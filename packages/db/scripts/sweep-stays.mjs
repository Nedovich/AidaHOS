// OPTIONAL housekeeping — NOT required for access control. The authoritative gate is the
// login-time PMS check in loginGuest: every re-login re-queries the PMS, so a past-check-out
// reservation is rejected ('expired') and a renewed/extended one is allowed again — no cron
// needed. Session-Timeout (set at login) already drops the live session at check-out.
//
// This sweep only matters as defense-in-depth for two edge cases:
//   (a) a hotel whose MikroTik profile uses `login-by=cookie` (device could auto-reauth via
//       cookie, bypassing the portal + window check) — our aida profile uses http-pap, so N/A;
//   (b) KVKK/retention hygiene — purge stale radcheck/radreply rows after the stay ends.
// If you do want it, run on a schedule (cron / Coolify scheduled task):
//   node packages/db/scripts/sweep-stays.mjs [graceHours=12]
//
// Reads guest_stays + hotels from the app DB (owner role, bypasses RLS) to build the expired
// usernames (`${slug}-${room}`), then deletes their radcheck + radreply rows in FreeRADIUS.
import postgres from 'postgres';
import '../../../scripts/load-root-env.mjs';

const graceHours = Number(process.argv[2] ?? 12);
const appUrl = process.env.MIGRATION_DATABASE_URL ?? process.env.DATABASE_URL;
const radUrl = process.env.RADIUS_DATABASE_URL;
if (!appUrl) { console.error('sweep-stays: MIGRATION_DATABASE_URL / DATABASE_URL not set'); process.exit(1); }
if (!radUrl) { console.error('sweep-stays: RADIUS_DATABASE_URL not set'); process.exit(1); }

const app = postgres(appUrl, { ssl: 'prefer', max: 1, connect_timeout: 20, onnotice: () => {} });
const rad = postgres(radUrl, { ssl: 'prefer', max: 1, connect_timeout: 20, onnotice: () => {} });
try {
  const expired = await app`
    select h.slug || '-' || gs.room_no as username
    from guest_stays gs
    join hotels h on h.id = gs.hotel_id
    where gs.check_out is not null
      and gs.check_out + make_interval(hours => ${graceHours}) < now()`;
  const usernames = [...new Set(expired.map((r) => r.username))];
  if (usernames.length === 0) {
    console.log('sweep-stays: no expired stays.');
  } else {
    const delChk = await rad`delete from radcheck where username = any(${usernames}) returning id`;
    await rad`delete from radreply where username = any(${usernames})`;
    console.log(`sweep-stays: revoked ${usernames.length} expired stay(s); removed ${delChk.length} radcheck row(s).`);
    console.log('  ', usernames.join(', '));
  }
} catch (e) {
  console.error('sweep-stays ERROR:', e.code ?? '', e.message);
  process.exitCode = 1;
} finally {
  await app.end({ timeout: 5 });
  await rad.end({ timeout: 5 });
}
