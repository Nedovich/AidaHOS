import { getHotelById, listEventCategories, type Loc } from '@aidahos/db';
import { L } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';
import { EventsSubnav } from '@/components/console/events/events-subnav';
import { CategoryManager } from '@/components/console/events/category-manager';

export default async function EventsSettingsPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const hotel = await getHotelById(hotelId);
  const cats = hotel ? await listEventCategories(hotel.hotelGroupId) : [];
  const categories = cats.map((c) => ({ id: c.id, name: c.name as Loc, color: c.color }));

  return (
    <div className="events-overview fade-in">
      <div className="page-hero events-hero">
        <div>
          <h1 className="page-hero__h">{L(['Etkinlik Ayarları', 'Event Settings'], lang)}</h1>
          <p className="page-hero__sub">{L(['Etkinlik kategorilerini grup genelinde yönetin.', 'Manage event categories across your group.'], lang)}</p>
        </div>
      </div>
      <EventsSubnav hotelId={hotelId} active="settings" lang={lang} />
      <CategoryManager consoleHotelId={hotelId} categories={categories} />
    </div>
  );
}
