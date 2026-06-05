import postgres from 'postgres';

/**
 * FreeRADIUS database (separate `freeradius` DB on the same Postgres server).
 * We write the `nas` table directly so a hotel's MikroTik gateway can authenticate
 * against RADIUS. Lazy single connection; throws clearly if not configured.
 *
 * Phase 3+: a FastAPI connector may take this over (esp. for on-prem boxes over
 * Tailscale), but the table shape stays the same.
 */
let _sql: ReturnType<typeof postgres> | null = null;

function radiusSql() {
  const url = process.env.RADIUS_DATABASE_URL;
  if (!url) throw new Error('RADIUS_DATABASE_URL is not set');
  if (!_sql) _sql = postgres(url, { ssl: 'prefer', max: 3, onnotice: () => {} });
  return _sql;
}

export function isRadiusConfigured(): boolean {
  return Boolean(process.env.RADIUS_DATABASE_URL);
}

export interface NasInput {
  shortname: string; // stable per-hotel key (e.g. "mt-esken-bodrum")
  nasname: string; // the IP RADIUS sees the MikroTik from (exit / public IP)
  secret: string; // shared secret
  description?: string | null;
}

/** Insert or update a NAS client row (keyed by shortname). */
export async function upsertNas(input: NasInput): Promise<{ id: number; created: boolean }> {
  const sql = radiusSql();
  const existing = await sql<{ id: number }[]>`select id from nas where shortname = ${input.shortname}`;
  if (existing.length && existing[0]) {
    await sql`
      update nas set nasname = ${input.nasname}, secret = ${input.secret},
        type = 'other', description = ${input.description ?? null}
      where shortname = ${input.shortname}`;
    return { id: existing[0].id, created: false };
  }
  const inserted = await sql<{ id: number }[]>`
    insert into nas (nasname, shortname, type, secret, description, require_ma, limit_proxy_state)
    values (${input.nasname}, ${input.shortname}, 'other', ${input.secret}, ${input.description ?? null}, 'auto', 'auto')
    returning id`;
  return { id: inserted[0]!.id, created: true };
}

/** Remove a hotel's NAS client (when MikroTik is unset or the hotel is deleted). */
export async function deleteNas(shortname: string): Promise<void> {
  const sql = radiusSql();
  await sql`delete from nas where shortname = ${shortname}`;
}

/** Another NAS row claiming the same IP (different hotel) → a config conflict. */
export async function findNasConflict(nasname: string, shortname: string) {
  const sql = radiusSql();
  const r = await sql<{ id: number; shortname: string }[]>`
    select id, shortname from nas where nasname = ${nasname} and shortname <> ${shortname} limit 1`;
  return r[0] ?? null;
}

export async function getNas(shortname: string) {
  const sql = radiusSql();
  const r = await sql<
    { id: number; nasname: string; shortname: string; secret: string; description: string | null }[]
  >`select id, nasname, shortname, secret, description from nas where shortname = ${shortname}`;
  return r[0] ?? null;
}

/** Deterministic NAS shortname for a hotel slug. */
export function nasShortname(slug: string): string {
  return `mt-${slug}`.slice(0, 32);
}

/* ============================================================
   RADIUS users (radcheck) + sessions (radacct)
   ============================================================ */

export interface RadiusUserSummary {
  username: string;
  sessions: number;
  lastSeen: Date | null;
  bytes: number;
  online: boolean;
}

/** Access-granted users (radcheck) joined with their session activity (radacct). */
export async function listRadiusUsers(): Promise<RadiusUserSummary[]> {
  const sql = radiusSql();
  const rows = await sql<
    { username: string; sessions: number; last_seen: Date | null; bytes: string; online: boolean | null }[]
  >`
    select rc.username,
      count(ra.radacctid)::int as sessions,
      max(ra.acctstarttime) as last_seen,
      coalesce(sum(coalesce(ra.acctinputoctets,0) + coalesce(ra.acctoutputoctets,0)),0)::bigint as bytes,
      bool_or(ra.radacctid is not null and ra.acctstoptime is null) as online
    from radcheck rc
    left join radacct ra on ra.username = rc.username
    where rc.attribute = 'Cleartext-Password'
    group by rc.username
    order by max(ra.acctstarttime) desc nulls last`;
  return rows.map((r) => ({
    username: r.username,
    sessions: Number(r.sessions),
    lastSeen: r.last_seen,
    bytes: Number(r.bytes),
    online: Boolean(r.online),
  }));
}

export interface NasSessionStats {
  active: number;
  total: number;
  users: number;
}

/** Live radacct stats for a NAS (scoped by the IP RADIUS sees = nasname/exit IP). */
export async function getNasSessionStats(nasname: string): Promise<NasSessionStats> {
  const sql = radiusSql();
  const r = await sql<{ active: number; total: number; users: number }[]>`
    select
      count(*) filter (where acctstoptime is null)::int as active,
      count(*)::int as total,
      count(distinct username)::int as users
    from radacct where host(nasipaddress) = ${nasname}`;
  const row = r[0] ?? { active: 0, total: 0, users: 0 };
  return { active: Number(row.active), total: Number(row.total), users: Number(row.users) };
}

export async function getRadiusUser(username: string) {
  const sql = radiusSql();
  const r = await sql<{ username: string; password: string }[]>`
    select username, value as password from radcheck
    where username = ${username} and attribute = 'Cleartext-Password' limit 1`;
  return r[0] ?? null;
}

/**
 * Provision (or refresh) a guest's RADIUS credentials in `radcheck`.
 * Keyed by (username, attribute='Cleartext-Password'); updates the password on
 * repeat logins. The MikroTik gateway then authenticates the guest against this.
 *   username = `${hotel.slug}-${roomNo}`  (globally unique across hotels)
 *   password = birthDate (DDMMYYYY)
 */
export async function upsertRadiusUser(input: { username: string; password: string }): Promise<{ created: boolean }> {
  const sql = radiusSql();
  const existing = await sql<{ id: number }[]>`
    select id from radcheck
    where username = ${input.username} and attribute = 'Cleartext-Password' limit 1`;
  if (existing.length) {
    await sql`
      update radcheck set value = ${input.password}, op = ':='
      where username = ${input.username} and attribute = 'Cleartext-Password'`;
    return { created: false };
  }
  await sql`
    insert into radcheck (username, attribute, op, value)
    values (${input.username}, 'Cleartext-Password', ':=', ${input.password})`;
  return { created: true };
}

export interface RadAcctSession {
  id: string;
  sessionId: string | null;
  start: Date | null;
  stop: Date | null;
  sessionTime: number | null;
  inOctets: number;
  outOctets: number;
  mac: string | null;
  framedIp: string | null;
  nasIp: string | null;
  terminateCause: string | null;
}

/** Accounting sessions for a user (latest first). */
export async function listUserSessions(username: string, limit = 100): Promise<RadAcctSession[]> {
  const sql = radiusSql();
  const rows = await sql<
    {
      radacctid: string;
      acctsessionid: string | null;
      acctstarttime: Date | null;
      acctstoptime: Date | null;
      acctsessiontime: number | null;
      acctinputoctets: string | null;
      acctoutputoctets: string | null;
      callingstationid: string | null;
      framedip: string | null;
      nasip: string | null;
      acctterminatecause: string | null;
    }[]
  >`
    select radacctid, acctsessionid, acctstarttime, acctstoptime, acctsessiontime,
      acctinputoctets, acctoutputoctets, callingstationid,
      framedipaddress::text as framedip, nasipaddress::text as nasip, acctterminatecause
    from radacct where username = ${username}
    order by acctstarttime desc nulls last limit ${limit}`;
  return rows.map((r) => ({
    id: String(r.radacctid),
    sessionId: r.acctsessionid,
    start: r.acctstarttime,
    stop: r.acctstoptime,
    sessionTime: r.acctsessiontime != null ? Number(r.acctsessiontime) : null,
    inOctets: Number(r.acctinputoctets ?? 0),
    outOctets: Number(r.acctoutputoctets ?? 0),
    mac: r.callingstationid,
    framedIp: r.framedip,
    nasIp: r.nasip,
    terminateCause: r.acctterminatecause,
  }));
}
