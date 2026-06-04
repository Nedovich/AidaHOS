import { and, desc, eq } from 'drizzle-orm';
import { db, withTenant } from './client';
import { auditLogs, hotelGroups, hotels, memberships, users } from './schema';

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

export async function findHotelGroupBySlug(slug: string) {
  return withTenant(SUPER, async (tx) => {
    const r = await tx.select().from(hotelGroups).where(eq(hotelGroups.slug, slug));
    return r[0] ?? null;
  });
}

export async function createHotelGroup(input: { name: string; slug: string }) {
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
