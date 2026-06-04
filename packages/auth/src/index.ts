import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { admin } from 'better-auth/plugins';
import { createAccessControl } from 'better-auth/plugins/access';
import { defaultStatements } from 'better-auth/plugins/admin/access';
import { db, schema } from '@aidahos/db';

/**
 * Access control for the admin plugin. super_admin gets full admin permissions;
 * the other app roles carry no BetterAuth admin permissions (their authority is
 * enforced by AidaHOS via memberships + Postgres RLS, not the admin plugin).
 */
const ac = createAccessControl(defaultStatements);
const roles = {
  super_admin: ac.newRole(defaultStatements),
  admin: ac.newRole({}),
  user: ac.newRole({}),
  customer: ac.newRole({}),
};

/**
 * AidaHOS auth — wired into apps/web at app/api/auth/[...all].
 *
 * Roles: super_admin / admin / user / customer (DB enum user_role).
 *  - admin plugin: role management + impersonation (super_admin -> admin), with
 *    super_admin as the privileged "admin" role. Sessions carry `impersonatedBy`.
 *  - Open sign-up is DISABLED: users are provisioned by admins/super_admins only
 *    (per spec). Login is email + password.
 *  - Active tenant (group/hotel) is resolved from `memberships` per request and may
 *    be persisted on the session (activeHotelId / activeHotelGroupId) by the tenant
 *    switcher; it is carried into Postgres RLS via withTenant() in @aidahos/db.
 *
 * Phase 3 adds the jwt plugin (JWKS) so the FastAPI connector can validate user
 * identity (matches the prior AIDA_JWKS_URL / issuer / audience design).
 */
/**
 * `allowSignUp` is false everywhere except the seed/bootstrap script, which needs
 * to create the very first super_admin before any admin exists to provision users.
 */
export function createAuth({ allowSignUp = false }: { allowSignUp?: boolean } = {}) {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,
    // Our PK columns are uuid → have BetterAuth generate uuids for all its tables.
    advanced: {
      database: {
        generateId: () => crypto.randomUUID(),
      },
    },
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !allowSignUp,
    },
    session: {
      additionalFields: {
        activeHotelId: { type: 'string', required: false, input: false },
        activeHotelGroupId: { type: 'string', required: false, input: false },
      },
    },
    plugins: [
      admin({
        ac,
        roles,
        defaultRole: 'user',
        adminRoles: ['super_admin'],
      }),
    ],
  });
}

export const auth = createAuth();

export type Auth = typeof auth;
export type Session = Auth['$Infer']['Session'];
export type AppRole = 'super_admin' | 'admin' | 'user' | 'customer';
