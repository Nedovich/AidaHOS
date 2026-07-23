import { StaffProfileForm } from '@/components/console/staff/staff-profile-form';
import { getLang } from '@/lib/i18n-server';

export default async function NewStaffProfilePage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();

  return <StaffProfileForm hotelId={hotelId} lang={lang} />;
}
