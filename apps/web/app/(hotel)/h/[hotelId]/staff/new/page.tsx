import { getHotelById } from '@aidahos/db';
import { mikrotikClientFromHotel } from '@/lib/mikrotik';
import { getLang } from '@/lib/i18n-server';
import { NewStaffAccountForm } from '@/components/console/staff/new-staff-account-form';
import type { HotspotProfile } from '@/lib/mikrotik';

export default async function NewStaffAccountPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();

  let profiles: HotspotProfile[] = [];
  const hotel = await getHotelById(hotelId);
  if (hotel?.mikrotikIp && hotel?.mikrotikApiUser && hotel?.mikrotikApiPassword) {
    try { profiles = await mikrotikClientFromHotel(hotel).listHotspotProfiles(); } catch { /* no profiles */ }
  }

  return <NewStaffAccountForm hotelId={hotelId} lang={lang} profiles={profiles} />;
}
