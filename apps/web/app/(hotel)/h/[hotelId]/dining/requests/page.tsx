import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Check, Clock3, Filter, Gift, Heart, Leaf, MapPin, Plus, Shield, Star } from 'lucide-react';
import { DiningSubnav } from '@/components/console/dining/dining-subnav';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

type RequestTone = 'danger' | 'success' | 'purple' | 'warning' | 'info' | 'accent';

type GuestRequest = {
  id: string;
  guest: string;
  room: string;
  type: 'allergy' | 'vegan' | 'anniv' | 'vip' | 'seating' | 'birthday';
  title: readonly [string, string];
  body: readonly [string, string];
  when: readonly [string, string];
  icon: LucideIcon;
  tone: RequestTone;
};

const REQUESTS: GuestRequest[] = [
  {
    id: 'req-402-001',
    guest: 'Eleanor James',
    room: '402',
    type: 'allergy',
    title: ['Alerji Notu', 'Allergy Note'],
    body: [
      'Fıstık ve kabuklu deniz ürünleri alerjisi. Mutfak bilgilendirildi.',
      'Peanut and shellfish allergy. Kitchen notified.',
    ],
    when: ['Bugün 12:40', 'Today 12:40'],
    icon: Shield,
    tone: 'danger',
  },
  {
    id: 'req-210-002',
    guest: 'Familie Hoffmann',
    room: '210',
    type: 'vegan',
    title: ['Vegan Talebi', 'Vegan Request'],
    body: [
      "3 vegan menü, akşam yemeği için A'la Carte.",
      "3 vegan menus for dinner at A'la Carte.",
    ],
    when: ['Bugün 09:15', 'Today 09:15'],
    icon: Leaf,
    tone: 'success',
  },
  {
    id: 'req-615-003',
    guest: 'Davide Russo',
    room: '615',
    type: 'anniv',
    title: ['Yıldönümü Yemeği', 'Anniversary Dinner'],
    body: [
      'Sürpriz pasta ve manzaralı masa talebi. Saat 21:00.',
      'Surprise cake and a table with a view. 21:00.',
    ],
    when: ['Dün 18:20', 'Yesterday 18:20'],
    icon: Heart,
    tone: 'purple',
  },
  {
    id: 'req-718-004',
    guest: 'Lena Bauer',
    room: '718',
    type: 'vip',
    title: ['VIP Rezervasyon', 'VIP Reservation'],
    body: [
      'Genel müdür misafiri — özel ilgi ve karşılama içeceği.',
      'GM guest — special attention and welcome drink.',
    ],
    when: ['Dün 14:05', 'Yesterday 14:05'],
    icon: Star,
    tone: 'warning',
  },
  {
    id: 'req-312-005',
    guest: 'Sarah Palmer',
    room: '312',
    type: 'seating',
    title: ['Özel Oturma Talebi', 'Special Seating'],
    body: ['Sahil kenarı, sessiz bölge tercihi.', 'Beachside, quiet area preferred.'],
    when: ['2 gün önce', '2 days ago'],
    icon: MapPin,
    tone: 'info',
  },
  {
    id: 'req-508-006',
    guest: 'Ahmet Yıldız',
    room: '508',
    type: 'birthday',
    title: ['Doğum Günü Yemeği', 'Birthday Dinner'],
    body: [
      'Çocuk için doğum günü kutlaması, balon süsleme.',
      'Birthday celebration for a child, balloon decoration.',
    ],
    when: ['2 gün önce', '2 days ago'],
    icon: Gift,
    tone: 'accent',
  },
];

export default async function DiningRequestsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const lang = await getLang();

  return (
    <div className="dining-requests fade-in">
      <div className="page-hero dining-hero">
        <div>
          <h1 className="page-hero__h">{L(['Özel Talepler', 'Guest Requests'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              [
                'Misafir özel istekleri, alerjiler ve VIP notları.',
                'Guest special requests, allergies and VIP notes.',
              ],
              lang,
            )}
          </p>
        </div>
        <div className="page-hero__actions">
          <button className="btn btn--ghost" type="button">
            <Filter size={16} />
            {L(['Filtrele', 'Filter'], lang)}
          </button>
          <button className="btn btn--primary" type="button">
            <Plus size={16} />
            {L(['Talep Ekle', 'Add Request'], lang)}
          </button>
        </div>
      </div>

      <DiningSubnav hotelId={hotelId} active="requests" lang={lang} />

      <div className="dining-requests-grid">
        {REQUESTS.map((request) => (
          <RequestCard
            hotelId={hotelId}
            key={`${request.guest}-${request.room}`}
            lang={lang}
            request={request}
          />
        ))}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  lang,
  hotelId,
}: {
  request: GuestRequest;
  lang: Lang;
  hotelId: string;
}) {
  const Icon = request.icon;

  return (
    <article className={`dining-request-card dining-request-card--${request.tone}`}>
      <Link
        className="dining-request-card__link"
        href={`/h/${hotelId}/dining/requests/${request.id}`}
      >
        <div className="dining-request-card__icon" aria-hidden="true">
          <Icon size={18} />
        </div>
        <div className="dining-request-card__content">
          <div className="dining-request-card__head">
            <span className="dining-request-card__guest">{request.guest}</span>
            <span className="cell-sub">
              {L(['Oda', 'Room'], lang)} {request.room}
            </span>
            <span className="catbadge dining-request-card__badge">{L(request.title, lang)}</span>
          </div>

          <p className="dining-request-card__body">{L(request.body, lang)}</p>

          <div className="dining-request-card__foot">
            <span className="dining-request-card__time">
              <Clock3 size={13} />
              {L(request.when, lang)}
            </span>
          </div>
        </div>
      </Link>
      <span className="dining-request-card__actions">
        <button className="btn btn--sm btn--subtle" type="button">
          {L(['Atla', 'Dismiss'], lang)}
        </button>
        <button className="btn btn--sm btn--ghost" type="button">
          <Check size={14} />
          {L(['Onayla', 'Acknowledge'], lang)}
        </button>
      </span>
    </article>
  );
}
