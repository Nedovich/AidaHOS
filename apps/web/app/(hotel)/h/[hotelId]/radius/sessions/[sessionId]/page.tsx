import { getStaffAccountStats, listUserSessions } from '@aidahos/db';
import { SessionDetailClient } from '@/components/console/radius/session-detail-client';
import { getLang } from '@/lib/i18n-server';

function queryValue(value: string | string[] | undefined, fallback: string) {
  if (Array.isArray(value)) return value[0] || fallback;
  return value || fallback;
}

function numericQuery(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(queryValue(value, String(fallback)));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export default async function RadiusSessionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ hotelId: string; sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ hotelId, sessionId }, query, lang] = await Promise.all([params, searchParams, getLang()]);

  const username = queryValue(query.username, '');
  const ip = queryValue(query.ip, '');
  const nas = queryValue(query.nas, '—');
  const durationSeconds = numericQuery(query.duration, 0);
  const bytes = numericQuery(query.bytes, 0);

  const [history, stats] = await Promise.all([
    username ? listUserSessions(username, 50).catch(() => []) : Promise.resolve([]),
    username ? getStaffAccountStats(username).catch(() => null) : Promise.resolve(null),
  ]);

  const serializedHistory = history.map((s) => ({
    id: s.id,
    mac: s.mac ?? '—',
    ip: s.framedIp ?? '—',
    startIso: s.start?.toISOString() ?? null,
    stopIso: s.stop?.toISOString() ?? null,
    sessionSeconds: s.sessionTime ?? null,
    inBytes: s.inOctets,
    outBytes: s.outOctets,
    terminateCause: s.terminateCause ?? null,
  }));

  return (
    <SessionDetailClient
      hotelId={hotelId}
      lang={lang}
      session={{
        id: sessionId,
        username,
        ip,
        nas,
        durationSeconds,
        bytes,
      }}
      history={serializedHistory}
      dailyBytesLast7={stats?.dailyBytesLast7 ?? null}
      lastLoginIso={history[0]?.start?.toISOString() ?? null}
      activeDevices={stats?.activeDevices ?? null}
    />
  );
}
