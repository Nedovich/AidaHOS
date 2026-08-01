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
export async function listRadiusUsers(hotelSlug?: string, staffUsernames?: string[]): Promise<RadiusUserSummary[]> {
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
      ${hotelSlug
        ? sql`and (
            rc.username like ${hotelSlug + '-%'}
            ${staffUsernames && staffUsernames.length > 0 ? sql`or rc.username in ${sql(staffUsernames)}` : sql``}
          )`
        : sql``}
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

export interface ActiveRadiusSession {
  id: string;
  username: string;
  framedIp: string | null;
  nasIp: string | null;
  nasName: string;
  start: Date | null;
  durationSeconds: number;
  bytes: number;
}

export interface RadiusActiveSessionOverview {
  dailyLogins: number;
  activeDevices: number;
  avgSessionSeconds: number;
  dailyLoginsLast7: number[];
  sessions: ActiveRadiusSession[];
}

/**
 * Active FreeRADIUS sessions for one hotel, including guest and staff accounts.
 * The NAS IP is included in the scope for installations whose usernames predate
 * the current hotel-prefixed naming convention.
 */
export async function getRadiusActiveSessionOverview(
  hotelSlug: string,
  nasname?: string | null,
): Promise<RadiusActiveSessionOverview> {
  const sql = radiusSql();
  const guestPrefix = `${hotelSlug}-%`;
  const staffPrefix = `staff-${hotelSlug}-%`;
  const tz = 'Europe/Istanbul';
  const nasScope = nasname
    ? sql`or host(ra.nasipaddress) = ${nasname}`
    : sql``;

  const [sessionRows, dailyRows] = await Promise.all([
    sql<{
      radacctid: string;
      username: string;
      framedip: string | null;
      nasip: string | null;
      nas_name: string | null;
      acctstarttime: Date | null;
      duration_seconds: string;
      bytes: string;
    }[]>`
      select
        ra.radacctid,
        ra.username,
        ra.framedipaddress::text as framedip,
        ra.nasipaddress::text as nasip,
        coalesce(n.shortname, ra.nasipaddress::text, '—') as nas_name,
        ra.acctstarttime,
        greatest(
          0,
          coalesce(
            ra.acctsessiontime,
            extract(epoch from (now() - ra.acctstarttime))::bigint,
            0
          )
        )::bigint as duration_seconds,
        (
          coalesce(ra.acctinputoctets, 0) +
          coalesce(ra.acctoutputoctets, 0)
        )::bigint as bytes
      from radacct ra
      left join nas n on n.nasname = ra.nasipaddress::text
      where ra.acctstoptime is null
        and (
          ra.username like ${guestPrefix}
          or ra.username like ${staffPrefix}
          ${nasScope}
        )
      order by ra.acctstarttime asc nulls last`,
    sql<{ day_offset: string; logins: string }[]>`
      select
        ((now() at time zone ${tz})::date -
          (ra.acctstarttime at time zone ${tz})::date)::int as day_offset,
        count(*)::int as logins
      from radacct ra
      where ra.acctstarttime is not null
        and (ra.acctstarttime at time zone ${tz})::date >=
          (now() at time zone ${tz})::date - interval '6 days'
        and (
          ra.username like ${guestPrefix}
          or ra.username like ${staffPrefix}
          ${nasScope}
        )
      group by day_offset
      order by day_offset`,
  ]);

  const dailyLoginsLast7 = new Array<number>(7).fill(0);
  for (const row of dailyRows) {
    const offset = Number(row.day_offset);
    if (offset >= 0 && offset <= 6) {
      dailyLoginsLast7[6 - offset] = Number(row.logins);
    }
  }

  const sessions = sessionRows.map((row) => ({
    id: String(row.radacctid),
    username: row.username,
    framedIp: row.framedip,
    nasIp: row.nasip,
    nasName: row.nas_name ?? row.nasip ?? '—',
    start: row.acctstarttime,
    durationSeconds: Number(row.duration_seconds),
    bytes: Number(row.bytes),
  }));
  const durationTotal = sessions.reduce((sum, session) => sum + session.durationSeconds, 0);

  return {
    dailyLogins: dailyLoginsLast7[6] ?? 0,
    activeDevices: sessions.length,
    avgSessionSeconds: sessions.length ? Math.round(durationTotal / sessions.length) : 0,
    dailyLoginsLast7,
    sessions,
  };
}

export interface RadiusAuthLog {
  id: string;
  username: string;
  reply: string;
  nasName: string | null;
  authDate: Date | null;
}

export interface RadiusAuthLogOverview {
  logs: RadiusAuthLog[];
  dailyTotal: number;
  dailyAccept: number;
  dailyReject: number;
  activeDevices: number;
  avgSessionSeconds: number;
}

/** Recent authentication decisions for the Active Sessions activity feed. */
export async function listRecentRadiusAuthLogs(
  hotelSlug: string,
  limit = 5,
): Promise<RadiusAuthLog[]> {
  const sql = radiusSql();
  const rows = await sql<{
    id: string;
    username: string;
    reply: string;
    nas_name: string | null;
    authdate: Date | null;
  }[]>`
    select p.id, p.username, p.reply,
      coalesce(n.shortname, p.nasipaddress::text) as nas_name,
      p.authdate
    from radpostauth p
    left join nas n on n.nasname = p.nasipaddress::text
    where p.username like ${hotelSlug + '-%'}
      or p.username like ${`staff-${hotelSlug}-%`}
    order by p.authdate desc nulls last
    limit ${limit}`;

  return rows.map((row) => ({
    id: String(row.id),
    username: row.username,
    reply: row.reply,
    nasName: row.nas_name ?? null,
    authDate: row.authdate,
  }));
}

/** Full auth log overview for the Auth Logs page (logs + KPI aggregates). */
export async function getRadiusAuthLogOverview(
  hotelSlug: string,
  limit = 100,
): Promise<RadiusAuthLogOverview> {
  const sql = radiusSql();
  const tz = 'Europe/Istanbul';
  const guestPrefix = `${hotelSlug}-%`;
  const staffPrefix = `staff-${hotelSlug}-%`;

  const [logRows, kpiRows, sessionRows] = await Promise.all([
    sql<{
      id: string;
      username: string;
      reply: string;
      nas_name: string | null;
      authdate: Date | null;
    }[]>`
      select p.id, p.username, p.reply,
        coalesce(n.shortname, p.nasipaddress::text) as nas_name,
        p.authdate
      from radpostauth p
      left join nas n on n.nasname = p.nasipaddress::text
      where p.username like ${guestPrefix}
        or p.username like ${staffPrefix}
      order by p.authdate desc nulls last
      limit ${limit}`,

    sql<{ daily_total: string; daily_accept: string; daily_reject: string }[]>`
      select
        count(*)::int as daily_total,
        count(*) filter (where reply = 'Access-Accept')::int as daily_accept,
        count(*) filter (where reply = 'Access-Reject')::int as daily_reject
      from radpostauth
      where (username like ${guestPrefix} or username like ${staffPrefix})
        and (authdate at time zone ${tz})::date = (now() at time zone ${tz})::date`,

    sql<{ active: string; avg_sec: string | null }[]>`
      select
        count(*) filter (where acctstoptime is null)::int as active,
        avg(acctsessiontime) filter (where acctsessiontime > 0)::bigint as avg_sec
      from radacct
      where username like ${guestPrefix}
        or username like ${staffPrefix}`,
  ]);

  const kpi = kpiRows[0] ?? { daily_total: '0', daily_accept: '0', daily_reject: '0' };
  const sess = sessionRows[0] ?? { active: '0', avg_sec: null };

  return {
    logs: logRows.map((row) => ({
      id: String(row.id),
      username: row.username,
      reply: row.reply,
      nasName: row.nas_name ?? null,
      authDate: row.authdate,
    })),
    dailyTotal: Number(kpi.daily_total),
    dailyAccept: Number(kpi.daily_accept),
    dailyReject: Number(kpi.daily_reject),
    activeDevices: Number(sess.active),
    avgSessionSeconds: Number(sess.avg_sec ?? 0),
  };
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
 *   username = guestUsername(slug, roomNo, stayId)  (globally unique, per-reservation)
 *   password = birthDate (DDMMYYYY)
 */
export async function upsertRadiusUser(input: {
  username: string;
  password: string;
  /**
   * Seconds until the reservation's check-out. Written as a `Session-Timeout` reply
   * attribute so the MikroTik auto-disconnects the guest when the stay ends. Omit/null
   * to leave it unset (no time cap).
   */
  sessionTimeoutSeconds?: number | null;
}): Promise<{ created: boolean }> {
  const sql = radiusSql();
  const existing = await sql<{ id: number }[]>`
    select id from radcheck
    where username = ${input.username} and attribute = 'Cleartext-Password' limit 1`;
  const created = existing.length === 0;
  if (existing.length) {
    await sql`
      update radcheck set value = ${input.password}, op = ':='
      where username = ${input.username} and attribute = 'Cleartext-Password'`;
  } else {
    await sql`
      insert into radcheck (username, attribute, op, value)
      values (${input.username}, 'Cleartext-Password', ':=', ${input.password})`;
  }

  // Session-Timeout (reply): caps the session to the remaining stay so the gateway
  // drops the guest at check-out. Recomputed on every login.
  if (input.sessionTimeoutSeconds != null && input.sessionTimeoutSeconds > 0) {
    const val = String(Math.floor(input.sessionTimeoutSeconds));
    const ex = await sql<{ id: number }[]>`
      select id from radreply where username = ${input.username} and attribute = 'Session-Timeout' limit 1`;
    if (ex.length) {
      await sql`update radreply set value = ${val}, op = ':=' where username = ${input.username} and attribute = 'Session-Timeout'`;
    } else {
      await sql`insert into radreply (username, attribute, op, value) values (${input.username}, 'Session-Timeout', ':=', ${val})`;
    }
  }
  return { created };
}

/**
 * Revoke a guest's RADIUS access — deletes their radcheck credential + radreply attrs so
 * the gateway can no longer authenticate them (used when a stay ends / on check-out sweep).
 * Does not touch radacct (accounting history). Returns rows removed from radcheck.
 */
export async function deleteRadiusUser(username: string): Promise<{ removed: number }> {
  const sql = radiusSql();
  const del = await sql`delete from radcheck where username = ${username} returning id`;
  await sql`delete from radreply where username = ${username}`;
  return { removed: del.length };
}

/**
 * RADIUS username for a guest: `{hotelSlug}-{roomNo}-{stayRef}`, where stayRef is the
 * first 6 chars of the guest_stays row id.
 *
 * The stay suffix is what makes the identity per-*reservation* rather than per-room. Two
 * guests occupying 310 in sequence get different usernames, so the second check-in no
 * longer overwrites the first one's password, and every radacct session can be attributed
 * to exactly one stay (and through it, to a person via guest_stays.tcNo / idNo).
 *
 * Still prefixed with the hotel slug so it stays globally unique and the `{slug}-%`
 * lookups used for per-hotel session listings keep matching.
 */
export function guestUsername(hotelSlug: string, roomNo: string, stayId: string): string {
  return `${hotelSlug}-${roomNo}-${stayId.slice(0, 6)}`;
}

/* ============================================================
   STAFF users — radcheck + radreply(Mikrotik-Group)
   Username format: staff-{hotelSlug}-{localUsername}
   ============================================================ */

export const STAFF_PREFIX = 'staff-';

export function staffUsername(hotelSlug: string, localUsername: string): string {
  return `${STAFF_PREFIX}${hotelSlug}-${localUsername}`;
}

export interface StaffUser {
  username: string;
  localUsername: string;
  displayName: string;
  mikrotikGroup: string;
  online: boolean;
  lastSeen: Date | null;
}

/**
 * List staff users for a hotel from FreeRADIUS (radcheck).
 * displayName and mikrotikGroup are NOT read here — they come from AidaHOS
 * staff_accounts table via listStaffAccounts in queries.ts.
 * This function only provides online/lastSeen from radacct.
 */
export async function listStaffUsersRadiusStats(hotelSlug: string): Promise<
  { username: string; online: boolean; lastSeen: Date | null }[]
> {
  const sql = radiusSql();
  const prefix = `${STAFF_PREFIX}${hotelSlug}-`;
  const rows = await sql<{
    username: string;
    online: boolean | null;
    last_seen: Date | null;
  }[]>`
    select
      rc.username,
      bool_or(ra.radacctid is not null and ra.acctstoptime is null) as online,
      max(ra.acctstarttime) as last_seen
    from radcheck rc
    left join radacct ra on ra.username = rc.username
    where rc.attribute = 'Cleartext-Password'
      and rc.username like ${prefix + '%'}
    group by rc.username`;
  return rows.map((r) => ({
    username: r.username,
    online: Boolean(r.online),
    lastSeen: r.last_seen,
  }));
}

/** @deprecated Use listStaffAccounts from queries.ts instead — combines DB + RADIUS stats */
export async function listStaffUsers(hotelSlug: string): Promise<StaffUser[]> {
  const sql = radiusSql();
  const prefix = `${STAFF_PREFIX}${hotelSlug}-`;
  const rows = await sql<{
    username: string;
    mikrotik_group: string | null;
    online: boolean | null;
    last_seen: Date | null;
  }[]>`
    select
      rc.username,
      (select value from radreply where username = rc.username and attribute = 'Mikrotik-Group' limit 1) as mikrotik_group,
      bool_or(ra.radacctid is not null and ra.acctstoptime is null) as online,
      max(ra.acctstarttime) as last_seen
    from radcheck rc
    left join radacct ra on ra.username = rc.username
    where rc.attribute = 'Cleartext-Password'
      and rc.username like ${prefix + '%'}
    group by rc.username
    order by rc.username`;
  return rows.map((r) => ({
    username: r.username,
    localUsername: r.username.slice(prefix.length),
    displayName: r.username.slice(prefix.length),
    mikrotikGroup: r.mikrotik_group ?? '',
    online: Boolean(r.online),
    lastSeen: r.last_seen,
  }));
}

/** Create or update a staff user (radcheck + radreply entries). */
export async function upsertStaffUser(input: {
  hotelSlug: string;
  localUsername: string;
  displayName: string;
  password: string;
  mikrotikGroup: string;
}): Promise<{ created: boolean }> {
  const sql = radiusSql();
  const username = staffUsername(input.hotelSlug, input.localUsername);

  // radcheck: password
  const existing = await sql<{ id: number }[]>`
    select id from radcheck where username = ${username} and attribute = 'Cleartext-Password' limit 1`;
  const created = existing.length === 0;
  if (existing.length) {
    await sql`update radcheck set value = ${input.password}, op = ':='
      where username = ${username} and attribute = 'Cleartext-Password'`;
  } else {
    await sql`insert into radcheck (username, attribute, op, value)
      values (${username}, 'Cleartext-Password', ':=', ${input.password})`;
  }

  // radreply: Mikrotik-Group (assigns the hotspot profile on the MikroTik)
  const grpEx = await sql<{ id: number }[]>`
    select id from radreply where username = ${username} and attribute = 'Mikrotik-Group' limit 1`;
  if (grpEx.length) {
    await sql`update radreply set value = ${input.mikrotikGroup}, op = '='
      where username = ${username} and attribute = 'Mikrotik-Group'`;
  } else {
    await sql`insert into radreply (username, attribute, op, value)
      values (${username}, 'Mikrotik-Group', '=', ${input.mikrotikGroup})`;
  }

  // radusergroup: assigns user to a FreeRADIUS group so radgroupreply attributes
  // (e.g. Mikrotik-Rate-Limit) are applied. One group per user; update on profile change.
  const ugEx = await sql<{ id: number }[]>`
    select id from radusergroup where username = ${username} limit 1`;
  if (ugEx.length) {
    await sql`update radusergroup set groupname = ${input.mikrotikGroup}
      where username = ${username}`;
  } else {
    await sql`insert into radusergroup (username, groupname, priority)
      values (${username}, ${input.mikrotikGroup}, 1)`;
  }

  // Clean up any legacy display-name rows written by older code versions
  await sql`delete from radreply where username = ${username} and attribute = 'display-name'`;

  return { created };
}

/**
 * Sync a hotspot profile's rate-limit into radgroupreply so FreeRADIUS sends
 * Mikrotik-Rate-Limit to the router when a user in this group authenticates.
 * Called whenever a MikroTik hotspot profile is created or updated from the panel.
 */
export async function upsertRadiusGroup(groupname: string, rateLimit: string): Promise<void> {
  const sql = radiusSql();
  const ex = await sql<{ id: number }[]>`
    select id from radgroupreply where groupname = ${groupname} and attribute = 'Mikrotik-Rate-Limit' limit 1`;
  if (ex.length) {
    await sql`update radgroupreply set value = ${rateLimit}, op = '='
      where groupname = ${groupname} and attribute = 'Mikrotik-Rate-Limit'`;
  } else {
    await sql`insert into radgroupreply (groupname, attribute, op, value)
      values (${groupname}, 'Mikrotik-Rate-Limit', '=', ${rateLimit})`;
  }
}

/** Remove a hotspot profile group from radgroupreply (when the profile is deleted). */
export async function deleteRadiusGroup(groupname: string): Promise<void> {
  const sql = radiusSql();
  await sql`delete from radgroupreply where groupname = ${groupname}`;
}

/** Delete a staff user (radcheck + radreply + radusergroup). */
export async function deleteStaffUser(username: string): Promise<void> {
  const sql = radiusSql();
  await sql`delete from radcheck where username = ${username}`;
  await sql`delete from radreply where username = ${username}`;
  await sql`delete from radusergroup where username = ${username}`;
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

export interface StaffAccountStats {
  dataTodayBytes: number;
  avgSessionSeconds: number;
  activeDevices: number;
  dailyBytesLast7: number[]; // index 0 = 6 days ago, index 6 = today
}

/** Aggregate stats for a staff account detail page. */
export async function getStaffAccountStats(username: string): Promise<StaffAccountStats> {
  const sql = radiusSql();

  const tz = 'Europe/Istanbul';

  const [todayRow, avgRow, activeRow, dailyRows] = await Promise.all([
    // Today's total bytes (sessions starting today in local timezone)
    sql<{ bytes: string }[]>`
      select coalesce(sum(coalesce(acctinputoctets,0) + coalesce(acctoutputoctets,0)), 0)::bigint as bytes
      from radacct
      where username = ${username}
        and (acctstarttime at time zone ${tz})::date = (now() at time zone ${tz})::date`,

    // Avg session length in seconds (only finished sessions)
    sql<{ avg_sec: string | null }[]>`
      select avg(acctsessiontime)::bigint as avg_sec
      from radacct
      where username = ${username}
        and acctsessiontime is not null
        and acctsessiontime > 0`,

    // Active (open) sessions = connected devices right now
    sql<{ cnt: string }[]>`
      select count(*)::int as cnt
      from radacct
      where username = ${username}
        and acctstoptime is null`,

    // Daily bytes for last 7 days grouped by local date (day_offset 0 = today)
    sql<{ day_offset: string; bytes: string }[]>`
      select
        ((now() at time zone ${tz})::date - (acctstarttime at time zone ${tz})::date)::int as day_offset,
        coalesce(sum(coalesce(acctinputoctets,0) + coalesce(acctoutputoctets,0)), 0)::bigint as bytes
      from radacct
      where username = ${username}
        and (acctstarttime at time zone ${tz})::date >= (now() at time zone ${tz})::date - interval '6 days'
      group by day_offset
      order by day_offset`,
  ]);

  // Build 7-element array [6 days ago … today]
  const byDay = new Array<number>(7).fill(0);
  for (const row of dailyRows) {
    const offset = Number(row.day_offset);
    if (offset >= 0 && offset <= 6) byDay[6 - offset] = Number(row.bytes);
  }

  return {
    dataTodayBytes: Number(todayRow[0]?.bytes ?? 0),
    avgSessionSeconds: Number(avgRow[0]?.avg_sec ?? 0),
    activeDevices: Number(activeRow[0]?.cnt ?? 0),
    dailyBytesLast7: byDay,
  };
}

export interface RadiusAccountingRecord {
  id: string;
  sessionId: string | null;
  username: string;
  nasName: string | null;
  start: Date | null;
  sessionSeconds: number | null;
  inOctets: number;
  outOctets: number;
  terminateCause: string | null;
  active: boolean;
}

export interface RadiusAccountingOverview {
  records: RadiusAccountingRecord[];
  dailyLogins: number;
  activeDevices: number;
  avgSessionSeconds: number;
  todayRecords: number;
  todayBytes: number;
}

export async function getRadiusAccountingOverview(
  hotelSlug: string,
  limit = 200,
): Promise<RadiusAccountingOverview> {
  const sql = radiusSql();
  const tz = 'Europe/Istanbul';
  const guestPrefix = `${hotelSlug}-%`;
  const staffPrefix = `staff-${hotelSlug}-%`;

  const [recordRows, kpiRows] = await Promise.all([
    sql<{
      radacctid: string;
      acctsessionid: string | null;
      username: string;
      nas_name: string | null;
      acctstarttime: Date | null;
      acctsessiontime: number | null;
      acctinputoctets: string | null;
      acctoutputoctets: string | null;
      acctterminatecause: string | null;
      active: boolean;
    }[]>`
      select
        ra.radacctid,
        ra.acctsessionid,
        ra.username,
        coalesce(n.shortname, ra.nasipaddress::text) as nas_name,
        ra.acctstarttime,
        greatest(
          0,
          coalesce(
            ra.acctsessiontime,
            extract(epoch from (now() - ra.acctstarttime))::bigint,
            0
          )
        )::bigint as acctsessiontime,
        ra.acctinputoctets,
        ra.acctoutputoctets,
        ra.acctterminatecause,
        (ra.acctstoptime is null) as active
      from radacct ra
      left join nas n on n.nasname = ra.nasipaddress::text
      where ra.username like ${guestPrefix}
        or ra.username like ${staffPrefix}
      order by ra.acctstarttime desc nulls last
      limit ${limit}`,

    sql<{
      daily_logins: string;
      active_devices: string;
      avg_sec: string | null;
      today_records: string;
      today_bytes: string;
    }[]>`
      select
        count(*) filter (
          where (acctstarttime at time zone ${tz})::date = (now() at time zone ${tz})::date
        )::int as daily_logins,
        count(*) filter (where acctstoptime is null)::int as active_devices,
        avg(acctsessiontime) filter (where acctsessiontime > 0)::bigint as avg_sec,
        count(*) filter (
          where (acctstarttime at time zone ${tz})::date = (now() at time zone ${tz})::date
        )::int as today_records,
        coalesce(sum(
          coalesce(acctinputoctets, 0) + coalesce(acctoutputoctets, 0)
        ) filter (
          where (acctstarttime at time zone ${tz})::date = (now() at time zone ${tz})::date
        ), 0)::bigint as today_bytes
      from radacct
      where username like ${guestPrefix}
        or username like ${staffPrefix}`,
  ]);

  const kpi = kpiRows[0] ?? {
    daily_logins: '0', active_devices: '0', avg_sec: null,
    today_records: '0', today_bytes: '0',
  };

  return {
    records: recordRows.map((r) => ({
      id: String(r.radacctid),
      sessionId: r.acctsessionid,
      username: r.username,
      nasName: r.nas_name ?? null,
      start: r.acctstarttime,
      sessionSeconds: r.acctsessiontime != null ? Number(r.acctsessiontime) : null,
      inOctets: Number(r.acctinputoctets ?? 0),
      outOctets: Number(r.acctoutputoctets ?? 0),
      terminateCause: r.acctterminatecause || null,
      active: Boolean(r.active),
    })),
    dailyLogins: Number(kpi.daily_logins),
    activeDevices: Number(kpi.active_devices),
    avgSessionSeconds: Number(kpi.avg_sec ?? 0),
    todayRecords: Number(kpi.today_records),
    todayBytes: Number(kpi.today_bytes),
  };
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
