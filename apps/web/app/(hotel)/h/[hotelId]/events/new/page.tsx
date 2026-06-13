import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getHotelById, getHotelsForGroup, listEventCategories, listGroupEventLocations, type Loc } from '@aidahos/db';
import { Subhero } from '@/components/console/survey-helpers';
import { L } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { EventForm } from '@/components/console/events/event-form';

export default async function NewEventPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/events`;

  const hotel = await getHotelById(hotelId);
  const groupId = hotel?.hotelGroupId ?? '';
  const [groupHotels, cats, locs] = groupId
    ? await Promise.all([getHotelsForGroup(groupId), listEventCategories(groupId), listGroupEventLocations(groupId)])
    : [[], [], []];

  const hotels = groupHotels.map((h) => ({ id: h.id, name: h.name }));
  const categories = cats.map((c) => ({ id: c.id, name: c.name as Loc, color: c.color }));
  const locations = locs.map((l) => ({ id: l.id, name: l.name as Loc, hotelId: l.hotelId }));

  return (
    <div className="events-create fade-in">
      <Subhero
        backHref={`${base}/list`}
        crumb={
          <>
            <Link href={`${base}/list`}>{L(['Etkinlikler', 'Events'], lang)}</Link>
            <ChevronRight size={13} />
            <b>{L(['Yeni', 'New'], lang)}</b>
          </>
        }
        title={L(['Etkinlik Oluştur', 'Create Event'], lang)}
        sub={L(['Yeni bir etkinlik tanımlayın ve programa ekleyin.', 'Define a new event and add it to the program.'], lang)}
        actions={<Link className="btn btn--ghost" href={`${base}/list`}>{L(['İptal', 'Cancel'], lang)}</Link>}
      />
      <EventForm consoleHotelId={hotelId} lang={lang} hotels={hotels} categories={categories} locations={locations} />
    </div>
  );
}
