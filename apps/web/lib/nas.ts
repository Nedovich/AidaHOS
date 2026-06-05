import 'server-only';
import { deleteNas, findNasConflict, isRadiusConfigured, nasShortname, upsertNas, writeAudit } from '@aidahos/db';

/**
 * Push (or remove) the hotel's MikroTik gateway in the FreeRADIUS `nas` table.
 * Best-effort: a RADIUS DB failure is audited but never blocks the hotel save.
 *   nasname  = exit IP (the address RADIUS sees) || mikrotik IP
 *   shortname= mt-<slug> (stable per hotel)
 *   secret   = nas secret
 */
export async function provisionNas(opts: {
  slug: string;
  name: string;
  exitIp: string | null;
  mikrotikIp: string | null;
  nasSecret: string | null;
  actorId: string;
  hotelId: string;
  hotelGroupId: string;
}) {
  if (!isRadiusConfigured()) return;
  const shortname = nasShortname(opts.slug);
  const nasname = opts.exitIp ?? opts.mikrotikIp;
  try {
    if (nasname && opts.nasSecret) {
      // Guard: another hotel already uses this exit IP → RADIUS keys NAS clients by
      // IP, so writing would be ambiguous. Block the write and flag it.
      const conflict = await findNasConflict(nasname, shortname);
      if (conflict) {
        await writeAudit({
          actorUserId: opts.actorId,
          hotelId: opts.hotelId,
          hotelGroupId: opts.hotelGroupId,
          action: 'radius.nas_conflict',
          target: `${nasname} ${conflict.shortname}`,
          meta: { reason: 'exit IP already used by another hotel' },
        });
        return;
      }
      const { created } = await upsertNas({ shortname, nasname, secret: opts.nasSecret, description: opts.name });
      await writeAudit({
        actorUserId: opts.actorId,
        hotelId: opts.hotelId,
        hotelGroupId: opts.hotelGroupId,
        action: created ? 'radius.nas_created' : 'radius.nas_updated',
        target: `${shortname} → ${nasname}`,
      });
    } else {
      await deleteNas(shortname);
    }
  } catch (e) {
    console.error('FreeRADIUS nas provisioning failed:', e);
    await writeAudit({
      actorUserId: opts.actorId,
      hotelId: opts.hotelId,
      hotelGroupId: opts.hotelGroupId,
      action: 'radius.nas_error',
      target: shortname,
      meta: { error: e instanceof Error ? e.message : String(e) },
    });
  }
}
