import 'server-only';
import { deleteNas, isRadiusConfigured, nasShortname, writeAudit } from '@aidahos/db';
import { provisionNas } from '@/lib/nas';

export type RadiusBackend = 'central_freeradius' | 'local_mikrotik';

/**
 * Single entry point for hotel RADIUS provisioning. Branches on the hotel's backend:
 *  - central_freeradius: write/refresh our FreeRADIUS `nas` (existing provisionNas).
 *  - local_mikrotik:     do NOT touch our FreeRADIUS. Remove any stale NAS left over
 *                        from a prior central setup, and audit. Live MikroTik RouterOS
 *                        REST provisioning is handled by apps/api over Tailscale
 *                        (deferred — see plan).
 */
export async function provisionHotelRadius(opts: {
  backend: RadiusBackend;
  slug: string;
  name: string;
  exitIp: string | null;
  mikrotikIp: string | null;
  nasSecret: string | null;
  actorId: string;
  hotelId: string;
  hotelGroupId: string;
}) {
  if (opts.backend === 'central_freeradius') {
    await provisionNas({
      slug: opts.slug,
      name: opts.name,
      exitIp: opts.exitIp,
      mikrotikIp: opts.mikrotikIp,
      nasSecret: opts.nasSecret,
      actorId: opts.actorId,
      hotelId: opts.hotelId,
      hotelGroupId: opts.hotelGroupId,
    });
    return;
  }

  // local_mikrotik — clean up any NAS from a previous central setup (backend switch).
  if (isRadiusConfigured()) {
    try {
      await deleteNas(nasShortname(opts.slug));
    } catch (e) {
      console.error('radius-backend: deleteNas on switch-to-local failed:', e);
    }
  }
  await writeAudit({
    actorUserId: opts.actorId,
    hotelId: opts.hotelId,
    hotelGroupId: opts.hotelGroupId,
    action: 'radius.backend_local',
    target: opts.slug,
    meta: { note: 'local MikroTik backend — FreeRADIUS NAS not provisioned (RouterOS REST deferred to apps/api)' },
  });
}
