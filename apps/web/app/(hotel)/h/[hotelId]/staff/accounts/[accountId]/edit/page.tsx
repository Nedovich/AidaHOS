import { notFound } from 'next/navigation';
import { getHotelById, getStaffAccount } from '@aidahos/db';
import { mikrotikClientFromHotel } from '@/lib/mikrotik';
import { getLang } from '@/lib/i18n-server';
import { StaffAccountForm } from '@/components/console/staff/new-staff-account-form';
import type { HotspotProfile } from '@/lib/mikrotik';

export default async function EditStaffAccountPage({ params }: { params: Promise<{ hotelId: string; accountId: string }> }) {
  const { hotelId, accountId } = await params;
  const lang = await getLang();
  const radiusUsername = decodeURIComponent(accountId);

  const hotel = await getHotelById(hotelId);
  if (!hotel) notFound();

  const account = await getStaffAccount(radiusUsername);
  if (!account || account.hotelId !== hotelId) notFound();

  let profiles: HotspotProfile[] = [];
  if (hotel.mikrotikIp && hotel.mikrotikApiUser && hotel.mikrotikApiPassword) {
    try { profiles = await mikrotikClientFromHotel(hotel).listHotspotProfiles(); } catch { /* no profiles */ }
  }

  return <StaffAccountForm hotelId={hotelId} lang={lang} profiles={profiles} user={account} />;
}
