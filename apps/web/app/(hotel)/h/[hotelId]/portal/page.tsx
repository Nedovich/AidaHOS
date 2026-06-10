import { getHotelById, getHotelPortalConfig, getHotelsForGroup } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { guestBaseUrl } from '@/lib/urls';
import { PortalComposer } from '@/components/console/portal/portal-composer';

// Guest Portal composer — drag-and-drop builder + live phone preview. Splash + Brand +
// Languages are wired to the hotel's config (hotels.brand jsonb); Home/Explore/Events
// blocks are still mock pending later passes.
export default async function GuestPortalPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const hotel = await getHotelById(hotelId);
  const config = await getHotelPortalConfig(hotelId, 'draft');
  // The hotels this group manages — so the admin can pick which one they're editing.
  const groupHotels = hotel ? await getHotelsForGroup(hotel.hotelGroupId) : [];
  const hotels = groupHotels.map((h) => ({ id: h.id, name: h.name }));
  const previewUrl = hotel ? `${guestBaseUrl()}/${hotel.slug}` : '#';

  return (
    <PortalComposer
      hotelId={hotelId}
      lang={lang}
      initialConfig={config}
      hotels={hotels}
      previewUrl={previewUrl}
    />
  );
}
