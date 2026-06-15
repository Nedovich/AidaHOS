import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Grid2X2,
  Plus,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { Subhero } from '@/components/console/survey-helpers';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

const VENUES = [
  { label: 'Ana Restoran', color: '#0E7490', active: false },
  { label: "A'la Carte Restoran", color: '#7C5CE0', active: true },
  { label: 'Havuz Bar', color: '#12A4B8', active: false },
  { label: 'Lobi Bar', color: '#B8740A', active: false },
  { label: 'Sahil Bar', color: '#0E9F6E', active: false },
] as const;

const PARTY_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10] as const;

function SelectBox({ children, muted = false }: { children: ReactNode; muted?: boolean }) {
  return (
    <div className={muted ? 'fselect dining-reservation-muted-select' : 'fselect'}>
      <span>{children}</span>
      <ChevronDown size={16} />
    </div>
  );
}

function SummaryRow({
  icon,
  label,
  value,
  mono = false,
  lang,
}: {
  icon: ReactNode;
  label: readonly [string, string];
  value: ReactNode;
  mono?: boolean;
  lang: Lang;
}) {
  return (
    <div className="stat-row dining-reservation-summary-row">
      <span className="stat-row__k">
        {icon}
        {L(label, lang)}
      </span>
      <span className={mono ? 'stat-row__v mono' : 'stat-row__v'}>{value}</span>
    </div>
  );
}

export default async function NewDiningReservation({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/dining`;

  return (
    <div className="dining-reservation-form fade-in">
      <Subhero
        backHref={`${base}/reservations`}
        crumb={
          <>
            <Link href={`${base}/reservations`}>{L(['Rezervasyonlar', 'Reservations'], lang)}</Link>
            <ChevronRight size={15} />
            <b>{L(['Yeni', 'New'], lang)}</b>
          </>
        }
        title={L(['Yeni Rezervasyon', 'New Reservation'], lang)}
        sub={L(
          [
            'Misafir için yeni bir restoran rezervasyonu oluşturun.',
            'Create a new restaurant reservation for a guest.',
          ],
          lang,
        )}
        actions={
          <div className="page-hero__actions">
            <Link className="btn btn--ghost" href={`${base}/reservations`}>
              {L(['İptal', 'Cancel'], lang)}
            </Link>
            <Link className="btn btn--primary" href={`${base}/reservations`}>
              <Check />
              {L(['Rezervasyonu Oluştur', 'Create Reservation'], lang)}
            </Link>
          </div>
        }
      />

      <div className="dining-reservation-form-grid">
        <div className="card dining-reservation-form-main">
          <section className="form-sec">
            <div className="form-sec__t">{L(['Misafir', 'Guest'], lang)}</div>
            <div className="form-sec__d">
              {L(
                [
                  'Aktif misafirler arasından seçin veya walk-in olarak ekleyin.',
                  'Pick from in-house guests or add a walk-in.',
                ],
                lang,
              )}
            </div>
            <div className="fgrid dining-reservation-guest-grid">
              <div>
                <label className="flabel">{L(['Misafir / Oda', 'Guest / Room'], lang)}</label>
                <SelectBox>{L(['Misafir seç…', 'Choose guest…'], lang)}</SelectBox>
              </div>
              <div>
                <label className="flabel">{L(['Misafir tipi', 'Guest type'], lang)}</label>
                <div className="seg-pills dining-reservation-type">
                  <div className="seg-pill on">
                    <Users size={15} />
                    {L(['Otel misafiri', 'In-house'], lang)}
                  </div>
                  <div className="seg-pill">
                    <Plus size={15} />
                    Walk-in
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="form-sec">
            <div className="form-sec__t">{L(['Mekan', 'Venue'], lang)}</div>
            <div className="form-sec__d">
              {L(['Misafirin yemek yiyeceği mekan.', 'Where the guest will dine.'], lang)}
            </div>
            <div className="seg-pills dining-reservation-venues">
              {VENUES.map((venue) => (
                <div key={venue.label} className={venue.active ? 'seg-pill on' : 'seg-pill'}>
                  <span className="seg-pill__dot" style={{ background: venue.color }} />
                  {venue.label}
                </div>
              ))}
            </div>
          </section>

          <section className="form-sec">
            <div className="form-sec__t">{L(['Zaman & Kişi', 'Time & Party'], lang)}</div>
            <div className="fgrid dining-reservation-time-grid">
              <div>
                <label className="flabel">{L(['Tarih', 'Date'], lang)}</label>
                <div className="dateinput dining-reservation-dateinput">
                  <CalendarDays size={16} />
                  12.06.2026
                </div>
              </div>
              <div className="dining-reservation-time-split">
                <div>
                  <label className="flabel">{L(['Saat', 'Time'], lang)}</label>
                  <div className="dateinput dining-reservation-dateinput">
                    <Clock size={16} />
                    20:00
                  </div>
                </div>
                <div>
                  <label className="flabel">{L(['Süre', 'Duration'], lang)}</label>
                  <SelectBox>120 {L(['dk', 'min'], lang)}</SelectBox>
                </div>
              </div>
            </div>
            <div className="dining-reservation-party">
              <label className="flabel">{L(['Kişi sayısı', 'Party size'], lang)}</label>
              <div className="dining-reservation-pax-list">
                {PARTY_OPTIONS.map((value) => (
                  <button
                    key={value}
                    className={value === 2 ? 'paxchip on' : 'paxchip'}
                    type="button"
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="form-sec">
            <div className="form-sec__t">{L(['Masa & Notlar', 'Table & Notes'], lang)}</div>
            <div className="fgrid">
              <div>
                <label className="flabel">{L(['Masa', 'Table'], lang)}</label>
                <SelectBox>{L(['Otomatik ata', 'Auto-assign'], lang)}</SelectBox>
              </div>
              <div>
                <label className="flabel">{L(['Oturma bölgesi', 'Seating area'], lang)}</label>
                <SelectBox>{L(['Pencere kenarı', 'Window-side'], lang)}</SelectBox>
              </div>
            </div>
            <div className="dining-reservation-notes">
              <label className="flabel">{L(['Özel istekler', 'Special requests'], lang)}</label>
              <textarea
                className="ftextarea dining-reservation-textarea"
                placeholder={L(
                  [
                    'Alerjiler, kutlamalar, oturma tercihleri…',
                    'Allergies, celebrations, seating preferences…',
                  ],
                  lang,
                )}
              />
            </div>
          </section>
        </div>

        <aside className="card dining-reservation-summary">
          <div className="card__body">
            <div className="card__title dining-reservation-summary-title">
              {L(['Özet', 'Summary'], lang)}
            </div>
            <SummaryRow
              icon={<UtensilsCrossed size={16} />}
              label={['Mekan', 'Venue']}
              value="A'la Carte"
              lang={lang}
            />
            <SummaryRow
              icon={<CalendarDays size={16} />}
              label={['Tarih', 'Date']}
              value="12.06.2026"
              lang={lang}
            />
            <SummaryRow
              icon={<Clock size={16} />}
              label={['Saat', 'Time']}
              value="20:00"
              mono
              lang={lang}
            />
            <SummaryRow
              icon={<Users size={16} />}
              label={['Kişi', 'Party']}
              value="2"
              lang={lang}
            />
            <SummaryRow
              icon={<Grid2X2 size={16} />}
              label={['Masa', 'Table']}
              value={L(['Otomatik ata', 'Auto-assign'], lang)}
              mono
              lang={lang}
            />
            <div className="divider" />
            <label className="flabel">{L(['Durum', 'Status'], lang)}</label>
            <SelectBox>{L(['Onaylandı', 'Confirmed'], lang)}</SelectBox>
            <div className="optrow dining-reservation-summary-option">
              <div>
                <div className="optrow__t">
                  {L(['Onay e-postası gönder', 'Send confirmation email'], lang)}
                </div>
              </div>
              <span className="switch on" />
            </div>
            <div className="optrow">
              <div>
                <div className="optrow__t">SMS reminder</div>
              </div>
              <span className="switch on" />
            </div>
            <Link
              className="btn btn--primary dining-reservation-save"
              href={`${base}/reservations`}
            >
              <Check />
              {L(['Rezervasyonu Oluştur', 'Create Reservation'], lang)}
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
