import { redirect } from 'next/navigation';

export default async function GuestSurveySendsRedirectPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  redirect(`/h/${hotelId}/surveys/sends`);
}
