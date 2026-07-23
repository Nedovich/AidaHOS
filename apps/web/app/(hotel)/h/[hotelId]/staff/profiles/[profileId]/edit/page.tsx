import { notFound } from 'next/navigation';
import { getHotelById } from '@aidahos/db';
import { mikrotikClientFromHotel } from '@/lib/mikrotik';
import { StaffProfileForm } from '@/components/console/staff/staff-profile-form';
import { getLang } from '@/lib/i18n-server';

export default async function EditStaffProfilePage({ params }: { params: Promise<{ hotelId: string; profileId: string }> }) {
  const { hotelId, profileId } = await params;
  const lang = await getLang();

  const hotel = await getHotelById(hotelId);
  if (!hotel?.mikrotikIp || !hotel?.mikrotikApiUser || !hotel?.mikrotikApiPassword) notFound();

  const profiles = await mikrotikClientFromHotel(hotel).listHotspotProfiles();
  const profile = profiles.find((p) => p.id === decodeURIComponent(profileId));
  if (!profile) notFound();

  return <StaffProfileForm hotelId={hotelId} lang={lang} profile={profile} />;
}
