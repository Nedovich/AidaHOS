import { getHotelById, getRadiusAccountingOverview, type RadiusAccountingOverview } from '@aidahos/db';
import { AccountingClient, type SerializedAccountingRecord } from '@/components/console/radius/accounting-client';
import { getLang } from '@/lib/i18n-server';

const EMPTY_OVERVIEW: RadiusAccountingOverview = {
  records: [],
  dailyLogins: 0,
  activeDevices: 0,
  avgSessionSeconds: 0,
  todayRecords: 0,
  todayBytes: 0,
};

export default async function RadiusAccountingPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const [{ hotelId }, lang] = await Promise.all([params, getLang()]);
  const hotel = await getHotelById(hotelId);

  let overview = EMPTY_OVERVIEW;
  let error: string | null = null;

  if (!hotel) {
    error = lang === 'tr' ? 'Otel bulunamadı.' : 'Hotel not found.';
  } else {
    try {
      overview = await getRadiusAccountingOverview(hotel.slug, 200);
    } catch (reason) {
      error = reason instanceof Error ? reason.message : String(reason);
    }
  }

  const serializedRecords: SerializedAccountingRecord[] = overview.records.map((r) => ({
    id: r.id,
    sessionId: r.sessionId ?? null,
    username: r.username,
    nasName: r.nasName ?? null,
    startIso: r.start?.toISOString() ?? null,
    sessionSeconds: r.sessionSeconds ?? null,
    inOctets: r.inOctets,
    outOctets: r.outOctets,
    terminateCause: r.terminateCause ?? null,
    active: r.active,
  }));

  return (
    <AccountingClient
      hotelId={hotelId}
      lang={lang}
      records={serializedRecords}
      dailyLogins={overview.dailyLogins}
      activeDevices={overview.activeDevices}
      avgSessionSeconds={overview.avgSessionSeconds}
      todayRecords={overview.todayRecords}
      todayBytes={overview.todayBytes}
      error={error}
    />
  );
}
