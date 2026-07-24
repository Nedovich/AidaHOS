import { getHotelById, getRadiusAuthLogOverview, type RadiusAuthLogOverview } from '@aidahos/db';
import { AuthLogsClient, type SerializedAuthLog } from '@/components/console/radius/auth-logs-client';
import { getLang } from '@/lib/i18n-server';

const EMPTY_OVERVIEW: RadiusAuthLogOverview = {
  logs: [],
  dailyTotal: 0,
  dailyAccept: 0,
  dailyReject: 0,
  activeDevices: 0,
  avgSessionSeconds: 0,
};

export default async function RadiusAuthLogsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const [lang, hotel] = await Promise.all([getLang(), getHotelById(hotelId)]);

  let overview = EMPTY_OVERVIEW;
  let error: string | null = null;

  if (!hotel) {
    error = lang === 'tr' ? 'Otel bulunamadı.' : 'Hotel not found.';
  } else {
    try {
      overview = await getRadiusAuthLogOverview(hotel.slug, 100);
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason);
    }
  }

  const serializedLogs: SerializedAuthLog[] = overview.logs.map((log) => ({
    id: log.id,
    username: log.username,
    reply: log.reply,
    nasName: log.nasName ?? null,
    authDateIso: log.authDate?.toISOString() ?? null,
  }));

  return (
    <AuthLogsClient
      hotelId={hotelId}
      lang={lang}
      logs={serializedLogs}
      dailyTotal={overview.dailyTotal}
      dailyAccept={overview.dailyAccept}
      dailyReject={overview.dailyReject}
      activeDevices={overview.activeDevices}
      avgSessionSeconds={overview.avgSessionSeconds}
      error={error}
    />
  );
}
