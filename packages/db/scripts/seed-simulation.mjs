// DEV: seed hotel_simulation rooms (stands in for the on-prem PMS/MSSQL).
// Usage: node scripts/seed-simulation.mjs [hotelSlug]
import postgres from 'postgres';
import '../../../scripts/load-root-env.mjs';

const slug = process.argv[2] ?? 'esken-bodrum';
// Owner connection: hotels has RLS, so use the migration (owner) role which bypasses it.
const url = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
if (!url) {
  console.error('seed-simulation: MIGRATION_DATABASE_URL / DATABASE_URL is not set');
  process.exit(1);
}

// roomNo, birthDate (DDMMYYYY), guestName, checkIn (ISO date), checkOut (ISO date)
const ROOMS = [
  ['101', '08051990', 'Ayşe Yılmaz', '2026-06-04', '2026-06-10'],
  ['102', '15071985', 'Mehmet Demir', '2026-06-05', '2026-06-09'],
  ['205', '23111978', 'Elena Petrova', '2026-06-03', '2026-06-12'],
  ['250', '01011990', 'John Carter', '2026-06-06', '2026-06-08'],
];

const sql = postgres(url, { ssl: 'prefer', max: 1, connect_timeout: 15, onnotice: () => {} });
try {
  const hotel = await sql`select id, name from hotels where slug = ${slug} limit 1`;
  if (!hotel.length) {
    console.error(`seed-simulation: no hotel with slug "${slug}"`);
    process.exit(1);
  }
  const hotelId = hotel[0].id;
  for (const [roomNo, birthDate, guestName, checkIn, checkOut] of ROOMS) {
    await sql`
      insert into hotel_simulation (hotel_id, room_no, birth_date, guest_name, check_in, check_out, active)
      values (${hotelId}, ${roomNo}, ${birthDate}, ${guestName}, ${checkIn}, ${checkOut}, true)
      on conflict (hotel_id, room_no)
      do update set birth_date = excluded.birth_date, guest_name = excluded.guest_name,
        check_in = excluded.check_in, check_out = excluded.check_out, active = true`;
  }
  console.log(`seed-simulation: seeded ${ROOMS.length} rooms for "${hotel[0].name}" (${slug}).`);
  console.log('  e.g. room 101 / 08051990');
} catch (e) {
  console.error('seed-simulation ERROR:', e.code ?? '', e.message);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 3 });
}
