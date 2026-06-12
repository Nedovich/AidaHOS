import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Eye,
  Globe2,
  Image as ImageIcon,
  Megaphone,
} from 'lucide-react';
import { Subhero } from '@/components/console/survey-helpers';
import { EVENT_CATEGORIES, localize, type EventCategory } from '@/lib/events-mock';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

const CATEGORY_ORDER: EventCategory[] = ['ent', 'kids', 'sport', 'well', 'fnb', 'spec'];

function CategoryPills({ lang }: { lang: Lang }) {
  return (
    <div className="seg-pills events-create-cats">
      {CATEGORY_ORDER.map((category, index) => {
        const item = EVENT_CATEGORIES[category];
        return (
          <button
            className={['seg-pill', index === 0 ? 'on' : null].filter(Boolean).join(' ')}
            type="button"
            key={category}
          >
            <span className="seg-pill__dot" style={{ background: item.color }} />
            {localize(item.label, lang)}
          </button>
        );
      })}
    </div>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="form-sec">
      <div className="form-sec__t">{title}</div>
      <div className="form-sec__d">{description}</div>
      {children}
    </section>
  );
}

function SelectBox({ children }: { children: ReactNode }) {
  return (
    <div className="fselect">
      <span>{children}</span>
      <ChevronDown size={16} />
    </div>
  );
}

function DateBox({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className="dateinput events-dateinput">
      {icon}
      {children}
    </div>
  );
}

function OptionRow({
  title,
  description,
  enabled,
  children,
}: {
  title: string;
  description?: string;
  enabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="optrow events-option-row">
      <div>
        <div className="optrow__t">{title}</div>
        {description ? <div className="optrow__d">{description}</div> : null}
      </div>
      {children ?? <span className={['switch', enabled ? 'on' : null].filter(Boolean).join(' ')} />}
    </div>
  );
}

export default async function NewEventPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/events`;

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
        sub={L(
          [
            'Yeni bir etkinlik tanımlayın ve programa ekleyin.',
            'Define a new event and add it to the program.',
          ],
          lang,
        )}
        actions={
          <>
            <Link className="btn btn--ghost" href={`${base}/list`}>
              {L(['İptal', 'Cancel'], lang)}
            </Link>
            <button className="btn btn--primary" type="button">
              <Check />
              {L(['Etkinliği Kaydet', 'Save Event'], lang)}
            </button>
          </>
        }
      />

      <div className="events-create-grid">
        <div className="card events-form-card">
          <FormSection
            title={L(['Temel Bilgiler', 'Basic Information'], lang)}
            description={L(
              [
                'Etkinliğin adı, açıklaması ve kategorisi.',
                'Event name, description and category.',
              ],
              lang,
            )}
          >
            <div className="events-form-stack">
              <div>
                <label className="flabel">{L(['Etkinlik adı', 'Event name'], lang)}</label>
                <input
                  className="finput"
                  placeholder={L(['ör. Havuz Başı DJ Performansı', 'e.g. Poolside DJ Set'], lang)}
                />
              </div>
              <div>
                <label className="flabel">{L(['Açıklama', 'Description'], lang)}</label>
                <textarea
                  className="ftextarea events-description"
                  placeholder={L(
                    ['Misafirlere gösterilecek açıklama...', 'Description shown to guests...'],
                    lang,
                  )}
                />
              </div>
              <div>
                <label className="flabel">{L(['Kategori', 'Category'], lang)}</label>
                <CategoryPills lang={lang} />
              </div>
            </div>
          </FormSection>

          <FormSection
            title={L(['Zaman & Lokasyon', 'Time & Location'], lang)}
            description={L(
              [
                'Etkinliğin ne zaman ve nerede gerçekleşeceği.',
                'When and where the event takes place.',
              ],
              lang,
            )}
          >
            <div className="fgrid events-time-grid">
              <div>
                <label className="flabel">{L(['Otel', 'Hotel'], lang)}</label>
                <SelectBox>Esken Hotel Bodrum</SelectBox>
              </div>
              <div>
                <label className="flabel">{L(['Lokasyon', 'Location'], lang)}</label>
                <SelectBox>{L(['Ana Havuz', 'Main Pool'], lang)}</SelectBox>
              </div>
              <div>
                <label className="flabel">{L(['Tarih', 'Date'], lang)}</label>
                <DateBox icon={<CalendarDays size={16} />}>12.06.2026</DateBox>
              </div>
              <div className="events-time-split">
                <div>
                  <label className="flabel">{L(['Başlangıç', 'Start'], lang)}</label>
                  <DateBox icon={<Clock size={16} />}>16:00</DateBox>
                </div>
                <div>
                  <label className="flabel">{L(['Bitiş', 'End'], lang)}</label>
                  <DateBox icon={<Clock size={16} />}>18:00</DateBox>
                </div>
              </div>
              <div>
                <label className="flabel">{L(['Kapasite', 'Capacity'], lang)}</label>
                <input className="finput" defaultValue="200" />
              </div>
            </div>
          </FormSection>

          <FormSection
            title={L(['Seçenekler', 'Options'], lang)}
            description={L(
              [
                'Kayıt, ücretlendirme ve tekrar ayarları.',
                'Registration, pricing and recurrence settings.',
              ],
              lang,
            )}
          >
            <OptionRow
              title={L(['Kayıt zorunlu', 'Registration required'], lang)}
              description={L(
                [
                  'Misafirler katılmadan önce kayıt olmalı.',
                  'Guests must register before attending.',
                ],
                lang,
              )}
              enabled
            />
            <OptionRow
              title={L(['Ücretli etkinlik', 'Paid event'], lang)}
              description={L(
                ['Etkinlik için ücret alınır.', 'A fee is charged for this event.'],
                lang,
              )}
            />
            <OptionRow title={L(['Maksimum kişi / kayıt', 'Max people per booking'], lang)}>
              <input className="finput events-max-booking" defaultValue="6" />
            </OptionRow>
            <OptionRow
              title={L(['Tekrarlayan etkinlik', 'Recurring event'], lang)}
              description={L(
                ['Belirli günlerde otomatik tekrarlanır.', 'Repeats automatically on set days.'],
                lang,
              )}
            />
          </FormSection>
        </div>

        <aside className="events-create-side">
          <section className="card">
            <div className="card__body">
              <label className="flabel">{L(['Kapak görseli', 'Cover image'], lang)}</label>
              <button className="cover-drop" type="button">
                <ImageIcon size={26} />
                <span>{L(['Görsel sürükleyin veya seçin', 'Drag or choose an image'], lang)}</span>
                <span className="cell-sub">
                  {L(['PNG, JPG · 16:9 önerilir', 'PNG, JPG · 16:9 recommended'], lang)}
                </span>
              </button>
            </div>
          </section>

          <section className="card">
            <div className="card__body">
              <label className="flabel">{L(['Durum', 'Status'], lang)}</label>
              <SelectBox>{L(['Taslak', 'Draft'], lang)}</SelectBox>

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

              <button className="btn btn--primary events-side-action" type="button">
                <Check />
                {L(['Etkinliği Kaydet', 'Save Event'], lang)}
              </button>
              <button
                className="btn btn--subtle events-side-action events-side-action--notify"
                type="button"
              >
                <Megaphone />
                {L(['Kaydet & Bildir', 'Save & Notify'], lang)}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
