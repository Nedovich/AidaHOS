import { NextResponse } from 'next/server';
import { listDueSurveyDisconnects } from '@aidahos/db';
import { mikrotikClient } from '@/lib/mikrotik';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * GET /api/survey-disconnect
 *
 * Called by an external cron (e.g. Coolify scheduled task or uptime-kuma HTTP monitor)
 * every minute. Finds guest stays whose survey_trigger_at has arrived and survey hasn't been
 * shown yet, then kicks those users from MikroTik hotspot. On next login the guest portal
 * automatically shows the checkout survey popup (loginGuest sets showCheckoutSurvey=true
 * when triggerAt has passed and surveyShownAt is null).
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

  const due = await listDueSurveyDisconnects();

  if (due.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  const results: Array<{ stayId: string; username: string; mikrotikKicked: boolean; error?: string }> = [];

  for (const stay of due) {
    const username = `${stay.hotelSlug}-${stay.roomNo}`;
    let mikrotikKicked = false;

    try {
      if (stay.mikrotikIp && stay.mikrotikApiUser && stay.mikrotikApiPassword) {
        const mt = mikrotikClient({
          host: stay.mikrotikIp,
          port: stay.mikrotikApiPort ?? 80,
          user: stay.mikrotikApiUser,
          password: stay.mikrotikApiPassword,
        });
        mikrotikKicked = await mt.disconnectHotspotUser(username);
      }

      // surveyShownAt is NOT set here — it's set by loginGuest in the guest portal
      // when the guest reconnects and sees the popup. This keeps the two steps correct:
      // 1) kick → 2) guest reconnects → popup shown → surveyShownAt marked.
      results.push({ stayId: stay.id, username, mikrotikKicked });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ stayId: stay.id, username, mikrotikKicked, error: msg });
    }
  }

  console.log('[survey-disconnect] processed:', results);

  return NextResponse.json({ processed: results.length, results });
}
