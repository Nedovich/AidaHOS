import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getEventById, getHotelById, getHotelsForGroup, listEventCategories, listGroupEventLocations, type Loc } from '@aidahos/db';
import { Subhero } from '@/components/console/survey-helpers';
import { L } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { EventForm, type EventInit } from '@/components/console/events/event-form';

type EventStatus = 'draft' | 'scheduled' | 'live' | 'full' | 'completed' | 'cancelled';

export default async function EditEventPage({ params }: { params: Promise<{ hotelId: string; eventId: string }> }) {
  const { hotelId, eventId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/events`;

  const hotel = await getHotelById(hotelId);
  const groupId = hotel?.hotelGroupId ?? '';
  const ev = await getEventById(eventId);
  if (!ev || !groupId || ev.hotelGroupId !== groupId) notFound();

  const [groupHotels, cats, locs] = await Promise.all([
    getHotelsForGroup(groupId),
    listEventCategories(groupId),
    listGroupEventLocations(groupId),
  ]);

  const event: EventInit = {
    id: ev.id,
    name: ev.name as Loc,
    description: ev.description as Loc,
    categoryId: ev.categoryId,
    locationId: ev.locationId,
    hotelId: ev.hotelId,
    startsAt: ev.startsAt ? new Date(ev.startsAt).toISOString() : null,
    endsAt: ev.endsAt ? new Date(ev.endsAt).toISOString() : null,
    capacity: ev.capacity,
    status: ev.status as EventStatus,
    coverUrl: ev.coverUrl,
    options: (ev.options as EventInit['options']) ?? {},
  };

  return (
    <div className="events-create fade-in">
      <Subhero
        backHref={`${base}/list`}
        crumb={
          <>
            <Link href={`${base}/list`}>{L(['Etkinlikler', 'Events'], lang)}</Link>
            <ChevronRight size={13} />
            <b>{L(['Düzenle', 'Edit'], lang)}</b>
          </>
        }
        title={L(['Etkinliği Düzenle', 'Edit Event'], lang)}
        sub={L(['Etkinlik bilgilerini güncelleyin.', 'Update the event details.'], lang)}
        actions={<Link className="btn btn--ghost" href={`${base}/list`}>{L(['İptal', 'Cancel'], lang)}</Link>}
      />
      <EventForm
        consoleHotelId={hotelId}
        lang={lang}
        hotels={groupHotels.map((h) => ({ id: h.id, name: h.name }))}
        categories={cats.map((c) => ({ id: c.id, name: c.name as Loc, color: c.color }))}
        locations={locs.map((l) => ({ id: l.id, name: l.name as Loc, hotelId: l.hotelId }))}
        event={event}
      />
    </div>
  );
}
