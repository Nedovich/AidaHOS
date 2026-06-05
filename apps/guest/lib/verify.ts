import 'server-only';
import { verifyHotelSimulation, type SimGuest } from '@aidahos/db';

export type VerifyResult = { ok: true; guest: SimGuest } | { ok: false };

/**
 * Verify a guest's room-no + birth-date for a hotel.
 *
 * The implementation is swappable by env `GUEST_VERIFIER`:
 *   - 'sim'     (default, DEV): match against the hotel_simulation table.
 *   - 'fastapi' (PRODUCTION):   POST to the integration layer, which reaches the
 *                               hotel's on-prem PHP/MSSQL over Tailscale.
 * The call signature is identical for both, so wiring stays the same when we
 * move to a real hotel environment.
 */
export async function verifyGuest(hotelId: string, roomNo: string, birthDate: string): Promise<VerifyResult> {
  const mode = process.env.GUEST_VERIFIER ?? 'sim';

  if (mode === 'sim') {
    const guest = await verifyHotelSimulation(hotelId, roomNo, birthDate);
    return guest ? { ok: true, guest } : { ok: false };
  }

  // Production verifier — not wired during local development.
  throw new Error(`GUEST_VERIFIER='${mode}' is not implemented yet (use 'sim' in dev)`);
}
