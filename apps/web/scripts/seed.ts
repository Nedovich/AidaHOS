/**
 * Bootstrap seed: first super_admin + a demo hotel group / hotel / admin.
 * Run: pnpm db:seed   (uses the seed-only signup-enabled auth instance)
 *
 * Idempotent — safe to run repeatedly. Change the default passwords after first login.
 */
import '../../../scripts/load-root-env.mjs';
import { createAuth, type AppRole } from '@aidahos/auth';
import {
  createHotel,
  createHotelGroup,
  ensureMembership,
  findHotelBySlug,
  findHotelGroupBySlug,
  getUserByEmail,
  setUserRole,
} from '@aidahos/db';

const auth = createAuth({ allowSignUp: true });

async function ensureUser(email: string, password: string, name: string, role: AppRole) {
  let u = await getUserByEmail(email);
  if (!u) {
    await auth.api.signUpEmail({ body: { email, password, name } });
    u = await getUserByEmail(email);
  }
  if (u && u.role !== role) await setUserRole(u.id, role);
  return u!;
}

async function main() {
  const sa = await ensureUser(
    'superadmin@aidahos.local',
    'ChangeMe!2026',
    'Super Admin',
    'super_admin',
  );
  const admin1 = await ensureUser('admin1@esken.local', 'ChangeMe!2026', 'Admin One', 'admin');

  const grp =
    (await findHotelGroupBySlug('esken-otel-group')) ??
    (await createHotelGroup({ name: 'Esken Otel Group', slug: 'esken-otel-group' }));

  const hotel =
    (await findHotelBySlug('esken-bodrum')) ??
    (await createHotel({ hotelGroupId: grp.id, name: 'Esken Hotel Bodrum', slug: 'esken-bodrum' }));

  await ensureMembership({
    userId: admin1.id,
    scope: 'hotel_group',
    hotelGroupId: grp.id,
    role: 'admin',
  });

  console.log('\nSeed complete. Default credentials (change after first login):');
  console.log('  super_admin  superadmin@aidahos.local  / ChangeMe!2026');
  console.log('  admin        admin1@esken.local        / ChangeMe!2026  →', grp.name);
  console.log('  group:', grp.name, grp.id);
  console.log('  hotel:', hotel.name, hotel.id, '\n');
  console.log('  (super_admin id:', sa.id, ')');
  process.exit(0);
}

main().catch((e) => {
  console.error('Seed failed:', e);
  process.exit(1);
});
