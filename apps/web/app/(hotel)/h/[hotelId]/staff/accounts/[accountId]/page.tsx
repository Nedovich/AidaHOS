import { notFound } from 'next/navigation';
import {
  getHotelById,
  getStaffAccount as getDatabaseStaffAccount,
  getStaffAccountStats,
  listStaffUsersRadiusStats,
  listUserSessions,
} from '@aidahos/db';
import { StaffAccountDetail } from '@/components/console/staff/staff-account-detail';
import { L } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

function colorFor(value: string) {
  const colors = ['#0E7490', '#2563C9', '#7C5CE0', '#B8740A', '#0E9F6E', '#D5485A'];
  let h = 0;
  for (let i = 0; i < value.length; i++) h = (h * 31 + value.charCodeAt(i)) >>> 0;
  return colors[h % colors.length]!;
}

function fmtBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function fmtDuration(seconds: number, lang: string): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (lang === 'tr') return h > 0 ? `${h}sa ${m}dk` : `${m}dk`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default async function StaffAccountDetailPage({
  params,
}: {
  params: Promise<{ hotelId: string; accountId: string }>;
}) {
  const { hotelId, accountId } = await params;
  const lang = await getLang();
  const radiusUsername = decodeURIComponent(accountId);
  const hotel = await getHotelById(hotelId);
  if (!hotel) notFound();

  const databaseAccount = await getDatabaseStaffAccount(radiusUsername);
  if (!databaseAccount || databaseAccount.hotelId !== hotelId) notFound();

  let online = false;
  let lastSeen: Date | null = null;
  let stats = { dataTodayBytes: 0, avgSessionSeconds: 0, activeDevices: 0, dailyBytesLast7: new Array<number>(7).fill(0) };
  let sessions: Awaited<ReturnType<typeof listUserSessions>> = [];

  try {
    const [radiusStats, fetchedStats, fetchedSessions] = await Promise.all([
      listStaffUsersRadiusStats(hotel.slug),
      getStaffAccountStats(radiusUsername),
      listUserSessions(radiusUsername, 50),
    ]);
    const radiusAccount = radiusStats.find((item) => item.username === radiusUsername);
    online = radiusAccount?.online ?? false;
    lastSeen = radiusAccount?.lastSeen ?? null;
    stats = fetchedStats;
    sessions = fetchedSessions;
  } catch {
    // RADIUS unavailable — show degraded view
  }

  const lastLogin = online
    ? L(['şimdi', 'now'], lang)
    : lastSeen
      ? new Intl.RelativeTimeFormat(lang === 'tr' ? 'tr' : 'en', { numeric: 'auto' }).format(
          -Math.max(1, Math.round((Date.now() - lastSeen.getTime()) / 3_600_000)),
          'hour',
        )
      : '—';

  // Daily usage chart: bytes → GB
  const dailyGb = stats.dailyBytesLast7.map((b) => Math.round((b / 1e9) * 10) / 10);
  const chartMax = Math.max(1, ...dailyGb);

  return (
    <StaffAccountDetail
      hotelId={hotelId}
      lang={lang}
      account={{
        radiusUsername: databaseAccount.radiusUsername,
        localUsername: databaseAccount.localUsername,
        displayName: databaseAccount.displayName,
        jobTitle: databaseAccount.jobTitle ?? L(['Personel', 'Staff member'], lang),
        mikrotikGroup: databaseAccount.mikrotikGroup,
        color: colorFor(databaseAccount.radiusUsername),
        online,
        lastLogin,
        dataTodayLabel: fmtBytes(stats.dataTodayBytes),
        avgSessionLabel: stats.avgSessionSeconds > 0 ? fmtDuration(stats.avgSessionSeconds, lang) : '—',
        activeDevices: stats.activeDevices,
        dailyGb,
        chartMax,
        sessions,
      }}
    />
  );
}
