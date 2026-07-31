import { NextResponse } from 'next/server';
import { listDuePopupSends, markGuestPopupSendKicked } from '@aidahos/db';
import { mikrotikClient } from '@/lib/mikrotik';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/survey-disconnect
 *
 * Called by an external cron every minute. Finds guest_popup_sends rows whose
 * triggerAt has passed and shownAt is NULL, then kicks those guests from MikroTik.
 * shownAt is NOT set here — it's set by loginGuest in the guest portal when the
 * guest reconnects and sees the popup (survey, event, or announcement).
 *
 * Protected by CRON_SECRET header (Authorization: Bearer <secret>).
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') ?? '';
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const due = await listDuePopupSends();

  if (due.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  const results: Array<{ sendId: string; username: string; mikrotikKicked: boolean; error?: string }> = [];

  for (const send of due) {
    const username = `${send.hotelSlug}-${send.roomNo}`;
    let mikrotikKicked = false;

    try {
      if (send.mikrotikIp && send.mikrotikApiUser && send.mikrotikApiPassword) {
        const mt = mikrotikClient({
          host: send.mikrotikIp,
          port: send.mikrotikApiPort ?? 80,
          user: send.mikrotikApiUser,
          password: send.mikrotikApiPassword,
        });
        mikrotikKicked = await mt.disconnectHotspotUser(username);
      }

      await markGuestPopupSendKicked(send.id);
      results.push({ sendId: send.id, username, mikrotikKicked });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ sendId: send.id, username, mikrotikKicked, error: msg });
    }
  }

  console.log('[survey-disconnect] processed:', results);

  return NextResponse.json({ processed: results.length, results });
}
