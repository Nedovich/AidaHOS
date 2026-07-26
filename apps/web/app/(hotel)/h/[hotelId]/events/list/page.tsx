import Link from 'next/link';
import { Download, Plus } from 'lucide-react';
import {
  getEventRegistrationCounts,
  getHotelById,
  listEventCategories,
  listEvents,
  listGroupEventLocations,
  resolveLoc,
  type Loc,
} from '@aidahos/db';
import { EventsSubnav } from '@/components/console/events/events-subnav';
import {
  EventsListClient,
  type SerializedCategory,
  type SerializedEvent,
  type SerializedLocation,
} from '@/components/console/events/events-list-client';
import { L } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

export default async function EventsListPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/events`;
  const rl = (l: Loc) => resolveLoc(l, lang === 'tr' ? 'tr' : 'en', 'en');

  const hotel = await getHotelById(hotelId);
  const groupId = hotel?.hotelGroupId ?? '';

  const [rows, cats, locs, regCounts] = groupId
    ? await Promise.all([
        listEvents(groupId),
        listEventCategories(groupId),
        listGroupEventLocations(groupId),
        hotel ? getEventRegistrationCounts(hotel.id) : Promise.resolve(new Map<string, number>()),
      ])
    : [[], [], [], new Map<string, number>()];

  const catById = new Map(cats.map((c) => [c.id, { name: c.name as Loc, color: c.color }]));
  const locById = new Map(locs.map((l) => [l.id, l.name as Loc]));

  const serializedEvents: SerializedEvent[] = rows.map((ev) => {
    const cat = ev.categoryId ? catById.get(ev.categoryId) : undefined;
    const loc = ev.locationId ? locById.get(ev.locationId) : undefined;
    return {
      id: ev.id,
      name: rl(ev.name as Loc) || '',
      categoryId: ev.categoryId ?? null,
      categoryName: cat ? rl(cat.name) : '',
      categoryColor: cat?.color ?? 'var(--accent)',
      locationId: ev.locationId ?? null,
      locationName: loc ? rl(loc) : '',
      startsAt: ev.startsAt ? ev.startsAt.toISOString() : null,
      endsAt: ev.endsAt ? ev.endsAt.toISOString() : null,
      capacity: ev.capacity ?? 0,
      status: ev.status as SerializedEvent['status'],
      registered: regCounts.get(ev.id) ?? 0,
      href: `${base}/${ev.id}`,
      editHref: `${base}/${ev.id}/edit`,
      notifyHref: `${base}/notify`,
    };
  });

  const serializedCats: SerializedCategory[] = cats.map((c) => ({
    id: c.id,
    name: rl(c.name as Loc),
    color: c.color,
  }));

  const serializedLocs: SerializedLocation[] = locs.map((l) => ({
    id: l.id,
    name: rl(l.name as Loc),
  }));

  return (
    <div className="events-list fade-in">
      <div className="page-hero events-hero">
        <div>
          <h1 className="page-hero__h">{L(['Etkinlikler', 'Events'], lang)}</h1>
          <p className="page-hero__sub">
            {L(['Tüm etkinlikleri görüntüleyin, filtreleyin ve yönetin.', 'View, filter and manage all events.'], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          <button className="btn btn--ghost" type="button">
            <Download />
            {L(['Dışa Aktar', 'Export'], lang)}
          </button>
          <Link className="btn btn--primary" href={`${base}/new`}>
            <Plus />
            {L(['Yeni Etkinlik', 'New Event'], lang)}
          </Link>
        </div>
      </div>

      <EventsSubnav hotelId={hotelId} active="list" lang={lang} />

      <EventsListClient
        events={serializedEvents}
        categories={serializedCats}
        locations={serializedLocs}
        lang={lang}
        hotelName={hotel?.name ?? ''}
      />
    </div>
  );
}
