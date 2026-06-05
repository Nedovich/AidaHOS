import { and, desc, eq } from 'drizzle-orm';
import { db, withTenant } from './client';
import { auditLogs, hotelGroups, hotels, hotelSimulation, memberships, users } from './schema';

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

export async function updateHotel(
  id: string,
  patch: {
    name?: string;
    status?: TenantStatus;
    hotelGroupId?: string;
    mikrotikIp?: string | null;
    exitIp?: string | null;
    nasSecret?: string | null;
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
  mikrotikIp?: string | null;
  exitIp?: string | null;
  nasSecret?: string | null;
}) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx
      .insert(hotels)
      .values({
        hotelGroupId: input.hotelGroupId,
        name: input.name,
        slug: input.slug,
        mikrotikIp: input.mikrotikIp ?? null,
        exitIp: input.exitIp ?? null,
        nasSecret: input.nasSecret ?? null,
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
