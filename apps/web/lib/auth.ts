import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { auth, type AppRole } from '@aidahos/auth';
import {
  getHotelsForGroup,
  getUserMemberships,
  withTenant,
  type Database,
  type TenantContext,
} from '@aidahos/db';

/**
 * Current BetterAuth session (or null) for the incoming request.
 * Wrapped in React cache(): a page often calls getSession() many times (every guard,
 * every withTenantDb) — over a remote DB each lookup is a round trip, so we dedupe to
 * one per request.
 */
export const getSession = cache(async () => auth.api.getSession({ headers: await headers() }));

/** Per-request memoized memberships fetch (same userId → one DB round trip). */
const cachedMemberships = cache((userId: string) => getUserMemberships(userId));

/**
 * Resolve the Postgres RLS context from the session + memberships.
 *  - super_admin: sees everything
 *  - admin: scoped to one hotel group (active, else first membership)
 *  - user/customer: scoped to one hotel
 * cache()d: every withTenantDb() call resolves the context — without memoization that
 * re-runs getSession + memberships on each query.
 */
export const resolveTenantContext = cache(async (): Promise<TenantContext | null> => {
  const session = await getSession();
  if (!session) return null;

  const role = (session.user.role ?? 'user') as AppRole;
  if (role === 'super_admin') return { role: 'super_admin' };

  const mems = await cachedMemberships(session.user.id);
  const activeHotelId = session.session.activeHotelId ?? null;
  const activeGroupId = session.session.activeHotelGroupId ?? null;

  if (role === 'admin') {
    const m =
      mems.find((x) => x.hotelGroupId && x.hotelGroupId === activeGroupId) ??
      mems.find((x) => x.scope === 'hotel_group') ??
      mems[0];
    return { role: 'admin', hotelGroupId: m?.hotelGroupId ?? null };
  }

  // user / customer → hotel scoped
  const m =
    mems.find((x) => x.hotelId && x.hotelId === activeHotelId) ??
    mems.find((x) => x.scope === 'hotel') ??
    mems[0];
  return { role, hotelId: m?.hotelId ?? null, hotelGroupId: m?.hotelGroupId ?? null };
});

/** Run a query inside the resolved tenant's RLS context. Null if unauthenticated. */
export async function withTenantDb<T>(fn: (tx: Database) => Promise<T>): Promise<T | null> {
  const ctx = await resolveTenantContext();
  if (!ctx) return null;
  return withTenant(ctx, fn);
}

/** Resolve where a signed-in user should land based on role + memberships. */
export async function resolveLandingPath(): Promise<string> {
  const session = await getSession();
  if (!session) return '/login';
  const role = (session.user.role ?? 'user') as AppRole;
  if (role === 'super_admin') return '/dashboard';

  const mems = await cachedMemberships(session.user.id);

  // user: scoped to a specific hotel
  const hotelMem = mems.find((m) => m.hotelId);
  if (hotelMem?.hotelId) return `/h/${hotelMem.hotelId}/dashboard`;

  // admin: scoped to a group → first hotel in that group
  const groupMem = mems.find((m) => m.hotelGroupId);
  if (groupMem?.hotelGroupId) {
    const hs = await getHotelsForGroup(groupMem.hotelGroupId);
    if (hs[0]) return `/h/${hs[0].id}/dashboard`;
  }
  return '/no-hotel';
}

/** Can this user access the given hotel? (membership in the hotel or its group) */
export async function canAccessHotel(hotelId: string, hotelGroupId: string): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const role = (session.user.role ?? 'user') as AppRole;
  if (role === 'super_admin') return true;
  const mems = await cachedMemberships(session.user.id);
  return mems.some((m) => m.hotelId === hotelId || m.hotelGroupId === hotelGroupId);
}
