import { getLang } from '@/lib/i18n-server';
import { getHotelById } from '@aidahos/db';
import { mikrotikClientFromHotel } from '@/lib/mikrotik';
import { StaffProfiles } from '@/components/console/staff/staff-profiles';
import type { HotspotProfile } from '@/lib/mikrotik';

export default async function StaffProfilesPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();

  let profiles: HotspotProfile[] = [];
  let error: string | null = null;

  try {
    const hotel = await getHotelById(hotelId);
    if (hotel?.mikrotikIp && hotel?.mikrotikApiUser && hotel?.mikrotikApiPassword) {
      profiles = await mikrotikClientFromHotel(hotel).listHotspotProfiles();
    }
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  return <StaffProfiles hotelId={hotelId} lang={lang} profiles={profiles} error={error} />;
}
