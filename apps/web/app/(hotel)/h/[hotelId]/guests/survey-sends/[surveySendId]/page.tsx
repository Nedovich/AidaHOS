import { redirect } from 'next/navigation';

export default async function GuestSurveySendDetailRedirectPage({
  params,
}: {
  params: Promise<{ hotelId: string; surveySendId: string }>;
}) {
  const { hotelId, surveySendId } = await params;
  redirect(`/h/${hotelId}/surveys/sends/${surveySendId}`);
}
