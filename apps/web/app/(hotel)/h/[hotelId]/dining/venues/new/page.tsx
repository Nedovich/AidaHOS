import Link from 'next/link';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Coffee,
  Droplets,
  Eye,
  Gift,
  Globe2,
  ImageIcon,
  UtensilsCrossed,
  Wine,
} from 'lucide-react';
import { Subhero } from '@/components/console/survey-helpers';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

const COLORS = [
  '#0E7490',
  '#7C5CE0',
  '#12A4B8',
  '#B8740A',
  '#0E9F6E',
  '#D5485A',
  '#2563C9',
  '#0A5E4F',
];

const ICON_OPTIONS = [
  {
    key: 'utensils',
    label: ['Yemek', 'Food'] as const,
    icon: UtensilsCrossed,
  },
  {
    key: 'wine',
    label: ['İçecek', 'Bar'] as const,
    icon: Wine,
  },
  {
    key: 'coffee',
    label: ['Kafe', 'Cafe'] as const,
    icon: Coffee,
  },
  {
    key: 'pool',
    label: ['Havuz', 'Pool'] as const,
    icon: Droplets,
  },
  {
    key: 'special',
    label: ['Özel', 'Special'] as const,
    icon: Gift,
  },
];

function SelectBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="fselect">
      <span>{children}</span>
      <ChevronDown size={16} />
    </div>
  );
}

function FormRow({
  title,
  desc,
  enabled = true,
}: {
  title: React.ReactNode;
  desc?: React.ReactNode;
  enabled?: boolean;
}) {
  return (
    <div className="optrow">
      <div>
        <div className="optrow__t">{title}</div>
        {desc ? <div className="optrow__d">{desc}</div> : null}
      </div>
      <span className={enabled ? 'switch on' : 'switch'} />
    </div>
  );
}

export default async function DiningVenueNew({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/dining`;

  return (
    <div className="dining-venue-form fade-in">
      <Subhero
        backHref={`${base}/venues`}
        crumb={
          <>
            <Link href={`${base}/venues`}>{L(['Mekanlar', 'Venues'], lang)}</Link>
            <ChevronRight size={15} />
            <b>{L(['Yeni', 'New'], lang)}</b>
          </>
        }
        title={L(['Yeni Mekan Ekle', 'Add New Venue'], lang)}
        sub={L(['Yeni bir restoran veya bar tanımlayın.', 'Define a new restaurant or bar.'], lang)}
        actions={
          <div className="page-hero__actions">
            <Link className="btn btn--ghost" href={`${base}/venues`}>
              {L(['İptal', 'Cancel'], lang)}
            </Link>
            <Link className="btn btn--primary" href={`${base}/venues`}>
              <Check />
              {L(['Mekanı Kaydet', 'Save Venue'], lang)}
            </Link>
          </div>
        }
      />

      <div className="dining-venue-form-grid">
        <div className="card dining-venue-form-main">
          <section className="form-sec">
            <div className="form-sec__t">{L(['Temel Bilgiler', 'Basic Information'], lang)}</div>
            <div className="form-sec__d">
              {L(
                [
                  'Mekan adı, mutfak türü ve kısa tanım.',
                  'Venue name, cuisine and short description.',
                ],
                lang,
              )}
            </div>
            <div className="dining-form-stack">
              <div>
                <label className="flabel">{L(['Mekan adı', 'Venue name'], lang)}</label>
                <input
                  className="finput"
                  placeholder={L(['ör. Sahil Bar', 'e.g. Beach Bar'], lang)}
                />
              </div>
              <div className="fgrid">
                <div>
                  <label className="flabel">{L(['Mutfak / Tür', 'Cuisine / Type'], lang)}</label>
                  <SelectBox>{L(['İtalyan & Akdeniz', 'Italian & Med.'], lang)}</SelectBox>
                </div>
                <div>
                  <label className="flabel">{L(['Lokasyon', 'Location'], lang)}</label>
                  <SelectBox>{L(['Lobi Katı', 'Lobby Floor'], lang)}</SelectBox>
                </div>
              </div>
              <div>
                <label className="flabel">{L(['Açıklama', 'Description'], lang)}</label>
                <textarea
                  className="ftextarea"
                  placeholder={L(
                    ['Misafirlere gösterilecek açıklama…', 'Description shown to guests…'],
                    lang,
                  )}
                />
              </div>
            </div>
          </section>

          <section className="form-sec">
            <div className="form-sec__t">{L(['Görünüm', 'Appearance'], lang)}</div>
            <div className="form-sec__d">
              {L(
                [
                  'Liste kartında kullanılacak renk ve ikon.',
                  'Color and icon used in the venue card.',
                ],
                lang,
              )}
            </div>
            <label className="flabel">{L(['Renk', 'Color'], lang)}</label>
            <div className="dining-swatch-row">
              {COLORS.map((color, index) => (
                <div
                  key={color}
                  className={index === 0 ? 'cswatch on' : 'cswatch'}
                  style={{ background: color, color }}
                >
                  {index === 0 ? <Check size={14} /> : null}
                </div>
              ))}
            </div>
            <label className="flabel">{L(['İkon', 'Icon'], lang)}</label>
            <div className="seg-pills">
              {ICON_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <div
                    key={option.key}
                    className={option.key === 'utensils' ? 'seg-pill on' : 'seg-pill'}
                  >
                    <Icon size={15} />
                    {L(option.label, lang)}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="form-sec">
            <div className="form-sec__t">{L(['Kapasite & Çalışma', 'Capacity & Hours'], lang)}</div>
            <div className="fgrid">
              <div>
                <label className="flabel">{L(['Toplam kapasite', 'Total capacity'], lang)}</label>
                <input className="finput" defaultValue="80" />
              </div>
              <div>
                <label className="flabel">{L(['Masa sayısı', 'Number of tables'], lang)}</label>
                <input className="finput" defaultValue="10" />
              </div>
              <div>
                <label className="flabel">{L(['Açılış', 'Opens'], lang)}</label>
                <div className="dateinput">
                  <Clock size={16} />
                  19:00
                </div>
              </div>
              <div>
                <label className="flabel">{L(['Kapanış', 'Closes'], lang)}</label>
                <div className="dateinput">
                  <Clock size={16} />
                  23:30
                </div>
              </div>
            </div>
          </section>

          <section className="form-sec">
            <div className="form-sec__t">{L(['Operasyon', 'Operations'], lang)}</div>
            <FormRow
              title={L(['Rezervasyon zorunlu', 'Reservation required'], lang)}
              desc={L(
                [
                  'Misafirler gelmeden önce rezervasyon yapmalı.',
                  'Guests must reserve before arrival.',
                ],
                lang,
              )}
            />
            <FormRow title={L(['Çocuk menüsü', 'Kids menu'], lang)} />
            <FormRow title={L(['Online sipariş', 'Online ordering'], lang)} enabled={false} />
            <FormRow title={L(['Yarı pansiyon dahil', 'Half-board included'], lang)} />
          </section>
        </div>

        <aside className="dining-venue-form-side">
          <section className="card">
            <div className="card__body">
              <label className="flabel">{L(['Kapak görseli', 'Cover image'], lang)}</label>
              <div className="cover-drop">
                <ImageIcon size={26} />
                <div className="dining-cover-drop-title">
                  {L(['Görsel sürükleyin veya seçin', 'Drag or choose an image'], lang)}
                </div>
                <div className="cell-sub">
                  {L(['PNG, JPG · 16:9 önerilir', 'PNG, JPG · 16:9 recommended'], lang)}
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__body">
              <label className="flabel">{L(['Durum', 'Status'], lang)}</label>
              <SelectBox>{L(['Açık', 'Open'], lang)}</SelectBox>
              <div className="divider" />
              <div className="stat-row">
                <span className="stat-row__k">
                  <Eye size={15} />
                  {L(['Görünürlük', 'Visibility'], lang)}
                </span>
                <span className="stat-row__v">{L(['Misafir Portalı', 'Guest Portal'], lang)}</span>
              </div>
              <div className="stat-row">
                <span className="stat-row__k">
                  <Globe2 size={15} />
                  {L(['Diller', 'Languages'], lang)}
                </span>
                <span className="stat-row__v">TR · EN · DE</span>
              </div>
              <Link className="btn btn--primary dining-save-venue" href={`${base}/venues`}>
                <Check />
                {L(['Mekanı Kaydet', 'Save Venue'], lang)}
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
