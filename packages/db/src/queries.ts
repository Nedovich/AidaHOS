import { and, asc, desc, eq, gte, notInArray, sql } from 'drizzle-orm';
import { db, withTenant } from './client';
import {
  auditLogs,
  eventCategories,
  eventLocations,
  events,
  guestStays,
  hotelGroups,
  hotels,
  hotelSimulation,
  memberships,
  staffAccounts,
  surveyResponses,
  surveys,
  users,
} from './schema';
import { defaultPortalConfig, parsePortalStore, withDefaults, type Loc, type PortalConfig } from './portal-config';

type EventStatus = 'draft' | 'scheduled' | 'live' | 'full' | 'completed' | 'cancelled';
export interface EventOptions { registrationRequired?: boolean; paid?: boolean; maxPerBooking?: number; recurring?: boolean }

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

/* ---------------- Guest Portal config (hotels.brand jsonb: {draft, published}) ---------------- */

/** Load a hotel's portal config (admin reads 'draft', guest reads 'published'), with defaults. */
export async function getHotelPortalConfig(hotelId: string, which: 'draft' | 'published' = 'draft'): Promise<PortalConfig> {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.select({ name: hotels.name, brand: hotels.brand }).from(hotels).where(eq(hotels.id, hotelId));
    const row = r[0];
    if (!row) return defaultPortalConfig('AIDA Bay');
    const store = parsePortalStore(row.brand);
    const cfg = which === 'published' ? store.published ?? store.draft : store.draft ?? store.published;
    return withDefaults(cfg, row.name);
  });
}

/** Persist the admin's working draft. */
export async function saveHotelPortalDraft(hotelId: string, config: PortalConfig): Promise<void> {
  await withTenant(SUPER, async (tx) => {
    const r = await tx.select({ brand: hotels.brand }).from(hotels).where(eq(hotels.id, hotelId));
    const store = parsePortalStore(r[0]?.brand);
    await tx.update(hotels).set({ brand: { ...store, draft: config }, updatedAt: new Date() }).where(eq(hotels.id, hotelId));
  });
}

/** Publish: the given config becomes both the live (published) and the working draft. */
export async function publishHotelPortal(hotelId: string, config: PortalConfig): Promise<void> {
  await withTenant(SUPER, (tx) =>
    tx.update(hotels).set({ brand: { draft: config, published: config }, updatedAt: new Date() }).where(eq(hotels.id, hotelId)),
  );
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
  // Richer PMS fields (optional; populated by the sim/PMS, captured into guest_stays).
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null;
  agency?: string | null;
  phone?: string | null;
  email?: string | null;
  country?: string | null;
  roomType?: string | null;
  currency?: string | null;
}

const SIM_GUEST_COLS = {
  roomNo: hotelSimulation.roomNo,
  guestName: hotelSimulation.guestName,
  checkIn: hotelSimulation.checkIn,
  checkOut: hotelSimulation.checkOut,
  birthDate: hotelSimulation.birthDate,
  firstName: hotelSimulation.firstName,
  lastName: hotelSimulation.lastName,
  agency: hotelSimulation.agency,
  phone: hotelSimulation.phone,
  email: hotelSimulation.email,
  country: hotelSimulation.country,
  roomType: hotelSimulation.roomType,
  currency: hotelSimulation.currency,
} as const;

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
    .select(SIM_GUEST_COLS)
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

/**
 * Look up the current guest of a room WITHOUT the birth-date (used to live-refresh the
 * portal header from the DB on each load, so name/dates aren't a stale login snapshot).
 */
export async function getSimGuestByRoom(hotelId: string, roomNo: string): Promise<SimGuest | null> {
  const r = await db
    .select(SIM_GUEST_COLS)
    .from(hotelSimulation)
    .where(and(eq(hotelSimulation.hotelId, hotelId), eq(hotelSimulation.roomNo, roomNo), eq(hotelSimulation.active, true)))
    .limit(1);
  return r[0] ?? null;
}

/**
 * Persist (or refresh) a verified guest stay in our store. Called by the guest app at
 * captive login as SUPER (the guest has no console session) — same trusted-server pattern
 * as createSurveyResponse. Keyed by (hotel, room, birthDate) — the guest's login identity.
 */
export async function upsertGuestStay(input: {
  hotelGroupId: string;
  hotelId: string;
  roomNo: string;
  birthDate: string;
  firstName?: string | null;
  lastName?: string | null;
  checkIn?: Date | null;
  checkOut?: Date | null;
  agency?: string | null;
  phone?: string | null;
  email?: string | null;
  country?: string | null;
  roomType?: string | null;
  currency?: string | null;
  reservationRef?: string | null;
}) {
  await withTenant(SUPER, (tx) =>
    tx
      .insert(guestStays)
      .values({
        hotelId: input.hotelId,
        hotelGroupId: input.hotelGroupId,
        roomNo: input.roomNo,
        birthDate: input.birthDate,
        firstName: input.firstName ?? null,
        lastName: input.lastName ?? null,
        checkIn: input.checkIn ?? null,
        checkOut: input.checkOut ?? null,
        agency: input.agency ?? null,
        phone: input.phone ?? null,
        email: input.email ?? null,
        country: input.country ?? null,
        roomType: input.roomType ?? null,
        currency: input.currency ?? null,
        reservationRef: input.reservationRef ?? null,
      })
      .onConflictDoUpdate({
        target: [guestStays.hotelId, guestStays.roomNo, guestStays.birthDate],
        set: {
          firstName: input.firstName ?? null,
          lastName: input.lastName ?? null,
          checkIn: input.checkIn ?? null,
          checkOut: input.checkOut ?? null,
          agency: input.agency ?? null,
          phone: input.phone ?? null,
          email: input.email ?? null,
          country: input.country ?? null,
          roomType: input.roomType ?? null,
          currency: input.currency ?? null,
          reservationRef: input.reservationRef ?? null,
          lastVerifiedAt: new Date(),
        },
      }),
  );
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

/* ============================================================
   Events — categories (group), locations (hotel), events (group+hotel)
   All group-scoped; written as SUPER (console actions gate access).
   ============================================================ */

export async function listEventCategories(hotelGroupId: string) {
  return withTenant(SUPER, (tx) =>
    tx.select().from(eventCategories).where(eq(eventCategories.hotelGroupId, hotelGroupId)).orderBy(asc(eventCategories.sortOrder), asc(eventCategories.createdAt)),
  );
}

export async function createEventCategory(input: { hotelGroupId: string; name: Loc; color: string; icon?: string | null; sortOrder?: number }) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.insert(eventCategories).values({
      hotelGroupId: input.hotelGroupId,
      name: input.name,
      color: input.color,
      icon: input.icon ?? null,
      sortOrder: input.sortOrder ?? 0,
    }).returning();
    return r[0]!;
  });
}

export async function updateEventCategory(id: string, patch: { name?: Loc; color?: string; icon?: string | null }) {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) set.name = patch.name;
  if (patch.color !== undefined) set.color = patch.color;
  if (patch.icon !== undefined) set.icon = patch.icon;
  return withTenant(SUPER, async (tx) => {
    const r = await tx.update(eventCategories).set(set).where(eq(eventCategories.id, id)).returning();
    return r[0] ?? null;
  });
}

export async function deleteEventCategory(id: string): Promise<void> {
  await withTenant(SUPER, (tx) => tx.delete(eventCategories).where(eq(eventCategories.id, id)));
}

export async function listEventLocations(hotelId: string) {
  return withTenant(SUPER, (tx) =>
    tx.select().from(eventLocations).where(eq(eventLocations.hotelId, hotelId)).orderBy(asc(eventLocations.sortOrder), asc(eventLocations.createdAt)),
  );
}

/** All locations across a group's hotels (for the Create Event form's hotel→location map). */
export async function listGroupEventLocations(hotelGroupId: string) {
  return withTenant(SUPER, (tx) =>
    tx.select().from(eventLocations).where(eq(eventLocations.hotelGroupId, hotelGroupId)).orderBy(asc(eventLocations.sortOrder), asc(eventLocations.createdAt)),
  );
}

export async function createEventLocation(input: { hotelGroupId: string; hotelId: string; name: Loc; sortOrder?: number }) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.insert(eventLocations).values({
      hotelGroupId: input.hotelGroupId,
      hotelId: input.hotelId,
      name: input.name,
      sortOrder: input.sortOrder ?? 0,
    }).returning();
    return r[0]!;
  });
}

export async function updateEventLocation(id: string, patch: { name?: Loc }) {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (patch.name !== undefined) set.name = patch.name;
  return withTenant(SUPER, async (tx) => {
    const r = await tx.update(eventLocations).set(set).where(eq(eventLocations.id, id)).returning();
    return r[0] ?? null;
  });
}

export async function deleteEventLocation(id: string): Promise<void> {
  await withTenant(SUPER, (tx) => tx.delete(eventLocations).where(eq(eventLocations.id, id)));
}

export async function listEvents(hotelGroupId: string, opts?: { hotelId?: string }) {
  const conds = [eq(events.hotelGroupId, hotelGroupId)];
  if (opts?.hotelId) conds.push(eq(events.hotelId, opts.hotelId));
  return withTenant(SUPER, (tx) =>
    tx.select().from(events).where(and(...conds)).orderBy(desc(events.startsAt)),
  );
}

export async function getEventById(id: string) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.select().from(events).where(eq(events.id, id));
    return r[0] ?? null;
  });
}

export interface GuestEvent {
  id: string;
  name: Loc;
  description: Loc;
  coverUrl: string | null;
  startsAt: Date | null;
  endsAt: Date | null;
  capacity: number;
  status: EventStatus;
  categoryName: Loc | null;
  categoryColor: string | null;
  locationName: Loc | null;
}

/**
 * Guest-facing events for one hotel — visible in the guest portal, not draft/cancelled,
 * joined with category (name/color) and location (name). Read as SUPER: the guest app has
 * no console session, same trusted-server pattern as the other guest reads. Ordered by
 * start time ascending (soonest first).
 */
export async function listGuestEvents(hotelId: string): Promise<GuestEvent[]> {
  return withTenant(SUPER, async (tx) => {
    const rows = await tx
      .select({
        id: events.id,
        name: events.name,
        description: events.description,
        coverUrl: events.coverUrl,
        startsAt: events.startsAt,
        endsAt: events.endsAt,
        capacity: events.capacity,
        status: events.status,
        categoryName: eventCategories.name,
        categoryColor: eventCategories.color,
        locationName: eventLocations.name,
      })
      .from(events)
      .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
      .leftJoin(eventLocations, eq(events.locationId, eventLocations.id))
      .where(
        and(
          eq(events.hotelId, hotelId),
          eq(events.visibility, 'guest_portal'),
          notInArray(events.status, ['draft', 'cancelled']),
        ),
      )
      .orderBy(asc(events.startsAt));
    return rows.map((r) => ({
      id: r.id,
      name: (r.name ?? {}) as Loc,
      description: (r.description ?? {}) as Loc,
      coverUrl: r.coverUrl,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      capacity: r.capacity,
      status: r.status as EventStatus,
      categoryName: (r.categoryName ?? null) as Loc | null,
      categoryColor: r.categoryColor,
      locationName: (r.locationName ?? null) as Loc | null,
    }));
  });
}

export async function createEvent(input: {
  hotelGroupId: string;
  hotelId: string;
  categoryId?: string | null;
  locationId?: string | null;
  name: Loc;
  description?: Loc;
  coverUrl?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  capacity?: number;
  status?: EventStatus;
  options?: EventOptions;
}) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.insert(events).values({
      hotelGroupId: input.hotelGroupId,
      hotelId: input.hotelId,
      categoryId: input.categoryId ?? null,
      locationId: input.locationId ?? null,
      name: input.name,
      description: input.description ?? {},
      coverUrl: input.coverUrl ?? null,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      capacity: input.capacity ?? 0,
      status: input.status ?? 'draft',
      options: input.options ?? {},
    }).returning();
    return r[0]!;
  });
}

export async function updateEvent(id: string, patch: {
  categoryId?: string | null;
  locationId?: string | null;
  name?: Loc;
  description?: Loc;
  coverUrl?: string | null;
  startsAt?: Date | null;
  endsAt?: Date | null;
  capacity?: number;
  status?: EventStatus;
  options?: EventOptions;
}) {
  const set: Record<string, unknown> = { updatedAt: new Date() };
  for (const k of ['categoryId', 'locationId', 'name', 'description', 'coverUrl', 'startsAt', 'endsAt', 'capacity', 'status', 'options'] as const) {
    if (patch[k] !== undefined) set[k] = patch[k];
  }
  return withTenant(SUPER, async (tx) => {
    const r = await tx.update(events).set(set).where(eq(events.id, id)).returning();
    return r[0] ?? null;
  });
}

export async function deleteEvent(id: string): Promise<void> {
  await withTenant(SUPER, (tx) => tx.delete(events).where(eq(events.id, id)));
}

/* ============================================================
   Staff accounts — AidaHOS DB side
   radiusUsername is the full RADIUS key (staff-{slug}-{local})
   ============================================================ */

export interface StaffAccount {
  id: number;
  hotelId: string;
  radiusUsername: string;
  localUsername: string;
  displayName: string;
  mikrotikGroup: string;
  online: boolean;
  lastSeen: Date | null;
  createdAt: Date;
}

/** List all staff accounts for a hotel. Pass RADIUS stats in to enrich online/lastSeen. */
export async function listStaffAccounts(
  hotelId: string,
  radiusStats?: { username: string; online: boolean; lastSeen: Date | null }[],
): Promise<StaffAccount[]> {
  const rows = await db
    .select()
    .from(staffAccounts)
    .where(eq(staffAccounts.hotelId, hotelId))
    .orderBy(asc(staffAccounts.localUsername));
  const statsMap = new Map(radiusStats?.map((s) => [s.username, s]) ?? []);
  return rows.map((r) => {
    const stat = statsMap.get(r.radiusUsername);
    return {
      id: r.id,
      hotelId: r.hotelId,
      radiusUsername: r.radiusUsername,
      localUsername: r.localUsername,
      displayName: r.displayName,
      mikrotikGroup: r.mikrotikGroup,
      online: stat?.online ?? false,
      lastSeen: stat?.lastSeen ?? null,
      createdAt: r.createdAt,
    };
  });
}

export async function getStaffAccount(radiusUsername: string): Promise<StaffAccount | null> {
  const rows = await db
    .select()
    .from(staffAccounts)
    .where(eq(staffAccounts.radiusUsername, radiusUsername))
    .limit(1);
  if (!rows[0]) return null;
  const r = rows[0];
  return {
    id: r.id,
    hotelId: r.hotelId,
    radiusUsername: r.radiusUsername,
    localUsername: r.localUsername,
    displayName: r.displayName,
    mikrotikGroup: r.mikrotikGroup,
    online: false,
    lastSeen: null,
    createdAt: r.createdAt,
  };
}

export async function upsertStaffAccount(input: {
  hotelId: string;
  radiusUsername: string;
  localUsername: string;
  displayName: string;
  mikrotikGroup: string;
}): Promise<StaffAccount> {
  const now = new Date();
  const rows = await db
    .insert(staffAccounts)
    .values({
      hotelId: input.hotelId,
      radiusUsername: input.radiusUsername,
      localUsername: input.localUsername,
      displayName: input.displayName,
      mikrotikGroup: input.mikrotikGroup,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: staffAccounts.radiusUsername,
      set: {
        displayName: input.displayName,
        mikrotikGroup: input.mikrotikGroup,
        localUsername: input.localUsername,
        updatedAt: now,
      },
    })
    .returning();
  const r = rows[0]!;
  return {
    id: r.id,
    hotelId: r.hotelId,
    radiusUsername: r.radiusUsername,
    localUsername: r.localUsername,
    displayName: r.displayName,
    mikrotikGroup: r.mikrotikGroup,
    online: false,
    lastSeen: null,
    createdAt: r.createdAt,
  };
}

export async function deleteStaffAccount(radiusUsername: string): Promise<void> {
  await db.delete(staffAccounts).where(eq(staffAccounts.radiusUsername, radiusUsername));
}
