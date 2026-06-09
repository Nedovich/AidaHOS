import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db, withTenant } from './client';
import {
  auditLogs,
  hotelGroups,
  hotels,
  hotelSimulation,
  memberships,
  surveyResponses,
  surveys,
  users,
} from './schema';

type AppRole = 'super_admin' | 'admin' | 'user' | 'customer';
const SUPER: { role: AppRole } = { role: 'super_admin' };

/** A user's tenant memberships (no RLS on this table — safe to read directly). */
export async function getUserMemberships(userId: string) {
  return db.select().from(memberships).where(eq(memberships.userId, userId));
}

export async function getUserByEmail(email: string) {
  const rows = await db.select().from(users).where(eq(users.email, email));
  return rows[0] ?? null;
}

export async function listUsersByRole(role: AppRole) {
  return db.select().from(users).where(eq(users.role, role));
}

/** Users that can be assigned as a hotel-group owner (non super_admin). */
export async function listAssignableUsers() {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role })
    .from(users)
    .orderBy(users.name);
  return rows.filter((u) => u.role !== 'super_admin');
}

/** The admin (owner) member of a group, if any. */
export async function getGroupOwner(hotelGroupId: string) {
  const r = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(and(eq(memberships.hotelGroupId, hotelGroupId), eq(memberships.role, 'admin')));
  return r[0] ?? null;
}

/** All users with their (optional) tenant assignment — for the super-admin Users screen. */
export async function listUsersWithTenant() {
  return withTenant(SUPER, (tx) =>
    tx
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        banned: users.banned,
        createdAt: users.createdAt,
        scope: memberships.scope,
        groupName: hotelGroups.name,
        groupColor: hotelGroups.color,
        hotelName: hotels.name,
        hotelGroupId: memberships.hotelGroupId,
      })
      .from(users)
      .leftJoin(memberships, eq(memberships.userId, users.id))
      .leftJoin(hotelGroups, eq(memberships.hotelGroupId, hotelGroups.id))
      .leftJoin(hotels, eq(memberships.hotelId, hotels.id))
      .orderBy(users.createdAt),
  );
}

/** All hotels with their group id — for assignment dropdowns. */
export async function getAllHotels() {
  return withTenant(SUPER, (tx) =>
    tx
      .select({ id: hotels.id, name: hotels.name, hotelGroupId: hotels.hotelGroupId })
      .from(hotels)
      .orderBy(hotels.name),
  );
}

/* ---- audit trail (no RLS on audit_logs) ---- */

export async function writeAudit(input: {
  actorUserId?: string | null;
  impersonatedUserId?: string | null;
  hotelId?: string | null;
  hotelGroupId?: string | null;
  action: string;
  target?: string | null;
  meta?: Record<string, unknown>;
}) {
  await db.insert(auditLogs).values({
    actorUserId: input.actorUserId ?? null,
    impersonatedUserId: input.impersonatedUserId ?? null,
    hotelId: input.hotelId ?? null,
    hotelGroupId: input.hotelGroupId ?? null,
    action: input.action,
    target: input.target ?? null,
    meta: input.meta ?? {},
  });
}

export async function recentAudit(limit = 10) {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

export async function setUserRole(userId: string, role: AppRole) {
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

/* ---- tenant entities (RLS-protected → run in super_admin context) ---- */

export interface HotelGroupWithStats {
  id: string;
  name: string;
  slug: string;
  status: 'active' | 'trial' | 'suspended' | 'archived';
  ownerName: string | null;
  ownerEmail: string | null;
  region: string | null;
  plan: string;
  mrr: number;
  aiUsed: number;
  aiLimit: number;
  color: string;
  createdAt: Date;
  hotelCount: number;
  userCount: number;
}

export async function listHotelGroupsWithStats(): Promise<HotelGroupWithStats[]> {
  return withTenant(SUPER, async (tx) => {
    const groups = await tx.select().from(hotelGroups).orderBy(hotelGroups.createdAt);
    const hs = await tx.select({ gid: hotels.hotelGroupId }).from(hotels);
    const ms = await tx.select({ gid: memberships.hotelGroupId }).from(memberships);
    return groups.map((g) => ({
      id: g.id,
      name: g.name,
      slug: g.slug,
      status: g.status,
      ownerName: g.ownerName,
      ownerEmail: g.ownerEmail,
      region: g.region,
      plan: g.plan,
      mrr: g.mrr,
      aiUsed: g.aiUsed,
      aiLimit: g.aiLimit,
      color: g.color,
      createdAt: g.createdAt,
      hotelCount: hs.filter((h) => h.gid === g.id).length,
      userCount: ms.filter((m) => m.gid === g.id).length,
    }));
  });
}

type TenantStatus = 'active' | 'trial' | 'suspended' | 'archived';

export async function updateHotelGroup(
  id: string,
  patch: {
    name?: string;
    status?: TenantStatus;
    ownerName?: string | null;
    ownerEmail?: string | null;
    region?: string | null;
    plan?: string;
  },
) {
  return withTenant(SUPER, (tx) =>
    tx.update(hotelGroups).set({ ...patch, updatedAt: new Date() }).where(eq(hotelGroups.id, id)),
  );
}

type RadiusBackend = 'central_freeradius' | 'local_mikrotik';

export async function updateHotel(
  id: string,
  patch: {
    name?: string;
    status?: TenantStatus;
    hotelGroupId?: string;
    radiusBackend?: RadiusBackend;
    mikrotikIp?: string | null;
    exitIp?: string | null;
    nasSecret?: string | null;
    mikrotikApiUser?: string | null;
    mikrotikApiPassword?: string | null;
    mikrotikApiPort?: number | null;
  },
) {
  return withTenant(SUPER, (tx) =>
    tx.update(hotels).set({ ...patch, updatedAt: new Date() }).where(eq(hotels.id, id)),
  );
}

export async function getUserById(id: string) {
  const r = await db.select().from(users).where(eq(users.id, id));
  return r[0] ?? null;
}

export async function updateUserProfile(id: string, patch: { name?: string; role?: AppRole; banned?: boolean }) {
  await db.update(users).set({ ...patch, updatedAt: new Date() }).where(eq(users.id, id));
}

/** Replace a user's single membership with a fresh one (or none for super_admin). */
export async function replaceMembership(
  userId: string,
  input: { role: AppRole; hotelGroupId?: string | null; hotelId?: string | null },
) {
  await db.delete(memberships).where(eq(memberships.userId, userId));
  if (input.hotelGroupId) {
    await db.insert(memberships).values({ userId, scope: 'hotel_group', hotelGroupId: input.hotelGroupId, role: input.role });
  } else if (input.hotelId) {
    const hotel = await getHotelById(input.hotelId);
    await db.insert(memberships).values({ userId, scope: 'hotel', hotelId: input.hotelId, hotelGroupId: hotel?.hotelGroupId ?? null, role: input.role });
  }
}

export async function getHotelGroupById(id: string) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.select().from(hotelGroups).where(eq(hotelGroups.id, id));
    return r[0] ?? null;
  });
}

/** All users in a group (admins + hotel-scoped sub-users) — for the admin Users screen. */
export async function listGroupUsers(hotelGroupId: string) {
  return withTenant(SUPER, (tx) =>
    tx
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        banned: users.banned,
        createdAt: users.createdAt,
        role: memberships.role,
        scope: memberships.scope,
        hotelId: memberships.hotelId,
        hotelName: hotels.name,
      })
      .from(memberships)
      .innerJoin(users, eq(memberships.userId, users.id))
      .leftJoin(hotels, eq(memberships.hotelId, hotels.id))
      .where(eq(memberships.hotelGroupId, hotelGroupId))
      .orderBy(users.name),
  );
}

export async function getGroupMembers(hotelGroupId: string) {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(users, eq(memberships.userId, users.id))
    .where(eq(memberships.hotelGroupId, hotelGroupId));
}

export async function findHotelGroupBySlug(slug: string) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.select().from(hotelGroups).where(eq(hotelGroups.slug, slug));
    return r[0] ?? null;
  });
}

export async function createHotelGroup(input: {
  name: string;
  slug: string;
  ownerName?: string | null;
  ownerEmail?: string | null;
  region?: string | null;
  plan?: string;
}) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.insert(hotelGroups).values(input).returning();
    return r[0]!;
  });
}

export async function getHotelsForGroup(hotelGroupId: string) {
  return withTenant(SUPER, (tx) =>
    tx.select().from(hotels).where(eq(hotels.hotelGroupId, hotelGroupId)),
  );
}

export async function getHotelById(id: string) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.select().from(hotels).where(eq(hotels.id, id));
    return r[0] ?? null;
  });
}

export async function findHotelBySlug(slug: string) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.select().from(hotels).where(eq(hotels.slug, slug));
    return r[0] ?? null;
  });
}

export async function createHotel(input: { hotelGroupId: string; name: string; slug: string }) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.insert(hotels).values(input).returning();
    return r[0]!;
  });
}

export async function createHotelFull(input: {
  hotelGroupId: string;
  name: string;
  slug: string;
  radiusBackend?: RadiusBackend;
  mikrotikIp?: string | null;
  exitIp?: string | null;
  nasSecret?: string | null;
  mikrotikApiUser?: string | null;
  mikrotikApiPassword?: string | null;
  mikrotikApiPort?: number | null;
}) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx
      .insert(hotels)
      .values({
        hotelGroupId: input.hotelGroupId,
        name: input.name,
        slug: input.slug,
        radiusBackend: input.radiusBackend ?? 'central_freeradius',
        mikrotikIp: input.mikrotikIp ?? null,
        exitIp: input.exitIp ?? null,
        nasSecret: input.nasSecret ?? null,
        mikrotikApiUser: input.mikrotikApiUser ?? null,
        mikrotikApiPassword: input.mikrotikApiPassword ?? null,
        mikrotikApiPort: input.mikrotikApiPort ?? null,
      })
      .returning();
    return r[0]!;
  });
}

export async function listHotelsWithGroup() {
  return withTenant(SUPER, (tx) =>
    tx
      .select({
        id: hotels.id,
        name: hotels.name,
        slug: hotels.slug,
        status: hotels.status,
        pmsType: hotels.pmsType,
        mikrotikIp: hotels.mikrotikIp,
        region: hotels.region,
        rooms: hotels.rooms,
        guestsOnline: hotels.guestsOnline,
        color: hotels.color,
        groupId: hotels.hotelGroupId,
        groupName: hotelGroups.name,
        groupColor: hotelGroups.color,
      })
      .from(hotels)
      .innerJoin(hotelGroups, eq(hotels.hotelGroupId, hotelGroups.id))
      .orderBy(hotels.name),
  );
}

export async function ensureMembership(input: {
  userId: string;
  scope: 'hotel_group' | 'hotel';
  hotelGroupId?: string | null;
  hotelId?: string | null;
  role: AppRole;
}) {
  const existing = await db
    .select()
    .from(memberships)
    .where(
      and(
        eq(memberships.userId, input.userId),
        input.hotelId
          ? eq(memberships.hotelId, input.hotelId)
          : eq(memberships.hotelGroupId, input.hotelGroupId!),
      ),
    );
  if (existing[0]) return existing[0];
  const r = await db
    .insert(memberships)
    .values({
      userId: input.userId,
      scope: input.scope,
      hotelGroupId: input.hotelGroupId ?? null,
      hotelId: input.hotelId ?? null,
      role: input.role,
    })
    .returning();
  return r[0];
}

/* ------------------------------------------------------------------ *
 *  Guest captive-portal — DEV PMS simulation (hotel_simulation)
 * ------------------------------------------------------------------ */

export interface SimGuest {
  roomNo: string;
  guestName: string | null;
  checkIn: Date | null;
  checkOut: Date | null;
}

/**
 * DEV verification: match a guest's room-no + birth-date against hotel_simulation.
 * In production this call is swapped for the on-prem PMS lookup (FastAPI → PHP → MSSQL);
 * the signature stays the same. Returns the guest record when valid, else null.
 */
export async function verifyHotelSimulation(
  hotelId: string,
  roomNo: string,
  birthDate: string,
): Promise<SimGuest | null> {
  const r = await db
    .select({ roomNo: hotelSimulation.roomNo, guestName: hotelSimulation.guestName, checkIn: hotelSimulation.checkIn, checkOut: hotelSimulation.checkOut })
    .from(hotelSimulation)
    .where(
      and(
        eq(hotelSimulation.hotelId, hotelId),
        eq(hotelSimulation.roomNo, roomNo),
        eq(hotelSimulation.birthDate, birthDate),
        eq(hotelSimulation.active, true),
      ),
    )
    .limit(1);
  return r[0] ?? null;
}

/** Seed/refresh a simulated guest room (idempotent on hotel+room). DEV only. */
export async function upsertHotelSimulation(input: {
  hotelId: string;
  roomNo: string;
  birthDate: string;
  guestName?: string | null;
  checkOut?: Date | null;
}) {
  await db
    .insert(hotelSimulation)
    .values({
      hotelId: input.hotelId,
      roomNo: input.roomNo,
      birthDate: input.birthDate,
      guestName: input.guestName ?? null,
      checkOut: input.checkOut ?? null,
    })
    .onConflictDoUpdate({
      target: [hotelSimulation.hotelId, hotelSimulation.roomNo],
      set: { birthDate: input.birthDate, guestName: input.guestName ?? null, checkOut: input.checkOut ?? null, active: true },
    });
}

/** Simulated rooms for a hotel (for an admin/dev management view). DEV only. */
export async function listHotelSimulation(hotelId: string) {
  return db
    .select()
    .from(hotelSimulation)
    .where(eq(hotelSimulation.hotelId, hotelId))
    .orderBy(hotelSimulation.roomNo);
}

/* ============================================================
   Surveys — group-scoped. Query fns run under SUPER (RLS bypass-via-policy),
   tenant scoping enforced by explicit hotel_group_id predicates, matching the
   getHotelsForGroup / getHotelById convention above.
   ============================================================ */

export type SurveyStatus = 'draft' | 'published' | 'paused' | 'archived';
export type ResponseStatus = 'new' | 'reviewed' | 'flagged';

export interface SurveyAccessControl {
  guestVerification?: boolean;
  isAccountDefault?: boolean;
  expiresAt?: string | null;
}

export interface SurveyNote {
  who: string;
  when: string;
  body: string;
}

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[çğıöşü]/g, (c) => ({ ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' })[c] ?? c)
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'survey'
  );
}

export async function listSurveys(hotelGroupId: string) {
  return withTenant(SUPER, (tx) =>
    tx
      .select({
        id: surveys.id,
        name: surveys.name,
        description: surveys.description,
        slug: surveys.slug,
        status: surveys.status,
        defaultLocale: surveys.defaultLocale,
        isDefault: surveys.isDefault,
        createdAt: surveys.createdAt,
        updatedAt: surveys.updatedAt,
        responseCount: sql<number>`(select count(*)::int from ${surveyResponses} where ${surveyResponses.surveyId} = ${surveys.id})`,
      })
      .from(surveys)
      .where(eq(surveys.hotelGroupId, hotelGroupId))
      .orderBy(desc(surveys.updatedAt)),
  );
}

export async function getSurveyById(id: string) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.select().from(surveys).where(eq(surveys.id, id));
    return r[0] ?? null;
  });
}

export async function getSurveyBySlug(slug: string) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.select().from(surveys).where(eq(surveys.slug, slug));
    return r[0] ?? null;
  });
}

export async function createSurvey(input: {
  hotelGroupId: string;
  hotelId: string;
  name: string;
  description?: string | null;
  json?: unknown;
  defaultLocale?: string;
  thankYouTitle?: string | null;
  thankYouDescription?: string | null;
  createdBy?: string | null;
}) {
  const slug = `${slugify(input.name)}-${Math.random().toString(36).slice(2, 6)}`;
  return withTenant(SUPER, async (tx) => {
    // Names must be unique within the group — auto-suffix on collision so create never fails.
    const existing = await tx.select({ name: surveys.name }).from(surveys).where(eq(surveys.hotelGroupId, input.hotelGroupId));
    const taken = new Set(existing.map((e) => e.name.toLowerCase()));
    let name = input.name;
    for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${input.name} ${n}`;
    const r = await tx
      .insert(surveys)
      .values({
        hotelGroupId: input.hotelGroupId,
        hotelId: input.hotelId,
        name,
        description: input.description ?? null,
        slug,
        json: (input.json ?? {}) as object,
        defaultLocale: input.defaultLocale ?? 'en',
        thankYouTitle: input.thankYouTitle ?? null,
        thankYouDescription: input.thankYouDescription ?? null,
        createdBy: input.createdBy ?? null,
      })
      .returning();
    return r[0]!;
  });
}

export async function updateSurvey(
  id: string,
  patch: {
    name?: string;
    description?: string | null;
    json?: unknown;
    defaultLocale?: string;
    status?: SurveyStatus;
    thankYouTitle?: string | null;
    thankYouDescription?: string | null;
    hotelId?: string;
    accessControl?: SurveyAccessControl;
  },
) {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.description !== undefined) set.description = patch.description;
  if (patch.json !== undefined) set.json = patch.json as object;
  if (patch.defaultLocale !== undefined) set.defaultLocale = patch.defaultLocale;
  if (patch.status !== undefined) set.status = patch.status;
  if (patch.thankYouTitle !== undefined) set.thankYouTitle = patch.thankYouTitle;
  if (patch.thankYouDescription !== undefined) set.thankYouDescription = patch.thankYouDescription;
  if (patch.hotelId !== undefined) set.hotelId = patch.hotelId;
  if (patch.accessControl !== undefined) set.accessControl = patch.accessControl;
  return withTenant(SUPER, async (tx) => {
    const r = await tx.update(surveys).set(set).where(eq(surveys.id, id)).returning();
    return r[0] ?? null;
  });
}

/** True if another survey in the group already uses this name (case-insensitive). */
export async function surveyNameExists(hotelGroupId: string, name: string, excludeId?: string): Promise<boolean> {
  return withTenant(SUPER, async (tx) => {
    const rows = await tx
      .select({ id: surveys.id })
      .from(surveys)
      .where(and(eq(surveys.hotelGroupId, hotelGroupId), sql`lower(${surveys.name}) = lower(${name})`));
    return rows.some((r) => r.id !== excludeId);
  });
}

export async function deleteSurvey(id: string) {
  return withTenant(SUPER, async (tx) => {
    await tx.delete(surveys).where(eq(surveys.id, id));
  });
}

/** The published default survey for a hotel (shown after captive-WiFi login), or null. */
export async function getDefaultSurvey(hotelId: string) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx
      .select()
      .from(surveys)
      .where(and(eq(surveys.hotelId, hotelId), eq(surveys.isDefault, true), eq(surveys.status, 'published')))
      .limit(1);
    return r[0] ?? null;
  });
}

/** Make `surveyId` the hotel's default (unsetting siblings), or clear it. */
export async function setDefaultSurvey(hotelId: string, surveyId: string, makeDefault: boolean) {
  return withTenant(SUPER, async (tx) => {
    if (makeDefault) {
      await tx.update(surveys).set({ isDefault: false }).where(and(eq(surveys.hotelId, hotelId), eq(surveys.isDefault, true)));
      await tx.update(surveys).set({ isDefault: true }).where(eq(surveys.id, surveyId));
    } else {
      await tx.update(surveys).set({ isDefault: false }).where(eq(surveys.id, surveyId));
    }
  });
}

/** Has this guest (room) already answered the survey during the current stay? */
export async function hasGuestResponded(surveyId: string, hotelId: string, roomNo: string, since: Date): Promise<boolean> {
  return withTenant(SUPER, async (tx) => {
    const r = await tx
      .select({ id: surveyResponses.id })
      .from(surveyResponses)
      .where(
        and(
          eq(surveyResponses.surveyId, surveyId),
          eq(surveyResponses.hotelId, hotelId),
          eq(surveyResponses.roomNo, roomNo),
          // gte() uses the column's timestamp mapper to serialize the Date — a raw
          // `sql\`… >= ${since}\`` passes a bare Date that postgres.js can't bind.
          gte(surveyResponses.submittedAt, since),
        ),
      )
      .limit(1);
    return r.length > 0;
  });
}

export async function setSurveyStatus(id: string, status: SurveyStatus) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx
      .update(surveys)
      .set({ status, updatedAt: new Date(), ...(status === 'published' ? { publishedAt: new Date() } : {}) })
      .where(eq(surveys.id, id))
      .returning();
    return r[0] ?? null;
  });
}

export async function publishSurvey(id: string, accessControl: SurveyAccessControl) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx
      .update(surveys)
      .set({ status: 'published', accessControl, publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(surveys.id, id))
      .returning();
    return r[0] ?? null;
  });
}

export interface SurveyStats {
  totalResponses: number;
  avgScore: number | null;
  lastResponseAt: Date | null;
}

export async function surveyStats(id: string): Promise<SurveyStats> {
  return withTenant(SUPER, async (tx) => {
    const r = await tx
      .select({
        total: sql<number>`count(*)::int`,
        avg: sql<number | null>`round(avg(${surveyResponses.score}), 1)`,
        // Raw aggregate isn't run through drizzle's date mapper, so coerce below.
        last: sql<string | Date | null>`max(${surveyResponses.submittedAt})`,
      })
      .from(surveyResponses)
      .where(eq(surveyResponses.surveyId, id));
    const row = r[0];
    return {
      totalResponses: row?.total ?? 0,
      avgScore: row?.avg != null ? Number(row.avg) : null,
      lastResponseAt: row?.last ? new Date(row.last) : null,
    };
  });
}

/** Responses for a group (optionally one survey), with the survey name joined in. */
export async function listResponses(hotelGroupId: string, opts?: { surveyId?: string; limit?: number }) {
  return withTenant(SUPER, (tx) => {
    const where = opts?.surveyId
      ? and(eq(surveyResponses.hotelGroupId, hotelGroupId), eq(surveyResponses.surveyId, opts.surveyId))
      : eq(surveyResponses.hotelGroupId, hotelGroupId);
    const q = tx
      .select({
        id: surveyResponses.id,
        surveyId: surveyResponses.surveyId,
        surveyName: surveys.name,
        roomNo: surveyResponses.roomNo,
        guestName: surveyResponses.guestName,
        score: surveyResponses.score,
        status: surveyResponses.status,
        source: surveyResponses.source,
        submittedAt: surveyResponses.submittedAt,
      })
      .from(surveyResponses)
      .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
      .where(where)
      .orderBy(desc(surveyResponses.submittedAt));
    return opts?.limit ? q.limit(opts.limit) : q;
  });
}

export async function getResponseById(id: string) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx
      .select({
        id: surveyResponses.id,
        surveyId: surveyResponses.surveyId,
        surveyName: surveys.name,
        surveyJson: surveys.json,
        hotelGroupId: surveyResponses.hotelGroupId,
        hotelId: surveyResponses.hotelId,
        roomNo: surveyResponses.roomNo,
        guestName: surveyResponses.guestName,
        data: surveyResponses.data,
        score: surveyResponses.score,
        status: surveyResponses.status,
        source: surveyResponses.source,
        device: surveyResponses.device,
        authMethod: surveyResponses.authMethod,
        completionSeconds: surveyResponses.completionSeconds,
        assigneeName: surveyResponses.assigneeName,
        nlpTags: surveyResponses.nlpTags,
        internalNotes: surveyResponses.internalNotes,
        submittedAt: surveyResponses.submittedAt,
      })
      .from(surveyResponses)
      .innerJoin(surveys, eq(surveyResponses.surveyId, surveys.id))
      .where(eq(surveyResponses.id, id));
    return r[0] ?? null;
  });
}

export async function updateResponseInternal(
  id: string,
  patch: { status?: ResponseStatus; assigneeName?: string | null; internalNotes?: SurveyNote[] },
) {
  const set: Record<string, unknown> = {};
  if (patch.status !== undefined) set.status = patch.status;
  if (patch.assigneeName !== undefined) set.assigneeName = patch.assigneeName;
  if (patch.internalNotes !== undefined) set.internalNotes = patch.internalNotes;
  if (Object.keys(set).length === 0) return null;
  return withTenant(SUPER, async (tx) => {
    const r = await tx.update(surveyResponses).set(set).where(eq(surveyResponses.id, id)).returning();
    return r[0] ?? null;
  });
}

export async function createSurveyResponse(input: {
  surveyId: string;
  hotelGroupId: string;
  hotelId?: string | null;
  roomNo?: string | null;
  guestName?: string | null;
  data: unknown;
  score?: number | null;
  source?: string | null;
  device?: string | null;
  authMethod?: string | null;
  completionSeconds?: number | null;
}) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx
      .insert(surveyResponses)
      .values({
        surveyId: input.surveyId,
        hotelGroupId: input.hotelGroupId,
        hotelId: input.hotelId ?? null,
        roomNo: input.roomNo ?? null,
        guestName: input.guestName ?? null,
        data: (input.data ?? {}) as object,
        score: input.score != null ? String(input.score) : null,
        source: input.source ?? null,
        device: input.device ?? null,
        authMethod: input.authMethod ?? null,
        completionSeconds: input.completionSeconds ?? null,
      })
      .returning();
    return r[0]!;
  });
}
