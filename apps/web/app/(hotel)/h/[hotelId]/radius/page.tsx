import {
  getHotelById,
  getRadiusActiveSessionOverview,
  listRecentRadiusAuthLogs,
  type RadiusActiveSessionOverview,
  type RadiusAuthLog,
} from '@aidahos/db';
import {
  ActiveSessionsClient,
  type ActiveSessionRow,
  type AuthLogRow,
} from '@/components/console/radius/active-sessions-client';
import { getLang } from '@/lib/i18n-server';

const EMPTY_OVERVIEW: RadiusActiveSessionOverview = {
  dailyLogins: 0,
  activeDevices: 0,
  avgSessionSeconds: 0,
  dailyLoginsLast7: [0, 0, 0, 0, 0, 0, 0],
  sessions: [],
};


export default async function RadiusActiveSessionsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const lang = await getLang();
  const hotel = await getHotelById(hotelId);

  let overview = EMPTY_OVERVIEW;
  let authLogs: RadiusAuthLog[] = [];
  let error: string | null = null;

  if (!hotel) {
    error = lang === 'tr' ? 'Otel bulunamadı.' : 'Hotel not found.';
  } else {
    try {
      overview = await getRadiusActiveSessionOverview(
        hotel.slug,
        hotel.exitIp ?? hotel.mikrotikIp,
      );
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason);
    }

    try {
      authLogs = await listRecentRadiusAuthLogs(hotel.slug, 5);
    } catch {
      // The active sessions view remains useful even when radpostauth is unavailable.
      authLogs = [];
    }
  }

  const liveSessions: ActiveSessionRow[] = overview.sessions.map((session) => ({
    id: session.id,
    username: session.username,
    framedIp: session.framedIp,
    nasName: session.nasName,
    durationSeconds: session.durationSeconds,
    bytes: session.bytes,
  }));
  const serializedLogs: AuthLogRow[] = authLogs.map((log) => ({
    id: log.id,
    username: log.username,
    reply: log.reply,
    authDate: log.authDate?.toISOString() ?? null,
  }));

  return (
    <ActiveSessionsClient
      hotelId={hotelId}
      lang={lang}
      sessions={liveSessions}
      authLogs={serializedLogs}
      dailyLogins={overview.dailyLogins}
      activeDevices={overview.activeDevices}
      avgSessionSeconds={overview.avgSessionSeconds}
      dailyLoginsLast7={overview.dailyLoginsLast7}
      error={error}
    />
  );
}
