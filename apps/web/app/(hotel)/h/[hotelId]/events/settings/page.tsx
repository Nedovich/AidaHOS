import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Bell,
  CalendarClock,
  Check,
  ChevronRight,
  Clock3,
  Download,
  Flag,
  MapPin,
  Megaphone,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Settings,
  Shield,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Users,
} from 'lucide-react';
import { EventsSubnav } from '@/components/console/events/events-subnav';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

type Section = 'categories' | 'locations' | 'registration' | 'notifications' | 'general';
type Pair = readonly [string, string];

const SECTIONS: {
  id: Section;
  icon: LucideIcon;
  label: Pair;
  count?: number;
  title: Pair;
  sub: Pair;
}[] = [
  {
    id: 'categories',
    icon: Tag,
    label: ['Kategoriler', 'Categories'],
    count: 6,
    title: ['Kategoriler', 'Categories'],
    sub: ['Etkinlik türleri, renkleri ve görünürlükleri.', 'Event types, colors and visibility.'],
  },
  {
    id: 'locations',
    icon: MapPin,
    label: ['Lokasyonlar', 'Locations'],
    count: 8,
    title: ['Lokasyonlar', 'Locations'],
    sub: ['Programda kullanılacak sahne ve alanlar.', 'Stages and areas used in the program.'],
  },
  {
    id: 'registration',
    icon: Users,
    label: ['Kayıt', 'Registration'],
    title: ['Kayıt', 'Registration'],
    sub: [
      'Kapasite, bekleme listesi ve check-in ayarları.',
      'Capacity, waitlist and check-in settings.',
    ],
  },
  {
    id: 'notifications',
    icon: Bell,
    label: ['Bildirimler', 'Notifications'],
    count: 4,
    title: ['Bildirimler', 'Notifications'],
    sub: ['Misafir ve ekip bildirim şablonları.', 'Guest and team notification templates.'],
  },
  {
    id: 'general',
    icon: Settings,
    label: ['Genel', 'General'],
    title: ['Genel', 'General'],
    sub: ['Tüm etkinlik programı için varsayılanlar.', 'Defaults for the full event program.'],
  },
];

const COLOR_SWATCHES = [
  '#7C5CE0',
  '#3267D6',
  '#43A46F',
  '#327C98',
  '#B8740A',
  '#D5485A',
  '#12A4B8',
  '#0A5E4F',
];

export default async function EventsSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ hotelId: string }>;
  searchParams?: Promise<{ section?: string }>;
}) {
  const { hotelId } = await params;
  const query = await searchParams;
  const lang = await getLang();
  const active = isSection(query?.section) ? query.section : 'categories';
  const current = SECTIONS.find((section) => section.id === active) ?? SECTIONS[0]!;

  return (
    <div className="events-settings fade-in">
      <div className="page-hero events-hero">
        <div>
          <h1 className="page-hero__h">{L(['Etkinlik Ayarları', 'Event Settings'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              [
                'Kategori, lokasyon ve kayıt varsayılanlarını buradan yönetin.',
                'Manage categories, locations and registration defaults from here.',
              ],
              lang,
            )}
          </p>
        </div>
      </div>

      <EventsSubnav hotelId={hotelId} active="settings" lang={lang} />

      <div className="events-settings-heading">
        <div>
          <div className="events-settings-heading__title">{L(current.title, lang)}</div>
          <div className="events-settings-heading__sub">{L(current.sub, lang)}</div>
        </div>
        <div className="searchmini events-settings-search">
          <Search size={15} />
          <input placeholder={L(['Arama...', 'Search...'], lang)} />
        </div>
      </div>

      <div className="events-settings-grid">
        <aside className="events-settings-nav">
          <div className="card events-settings-nav-card">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const on = section.id === active;
              return (
                <Link
                  className={on ? 'events-settings-nav-item on' : 'events-settings-nav-item'}
                  href={`/h/${hotelId}/events/settings?section=${section.id}`}
                  key={section.id}
                >
                  <span className="events-settings-nav-icon">
                    <Icon size={16} />
                  </span>
                  <span className="optrow__t">{L(section.label, lang)}</span>
                  {section.count != null ? (
                    <span className="badge badge--mute mono">{section.count}</span>
                  ) : null}
                  <ChevronRight size={14} className="events-settings-nav-chevron" />
                </Link>
              );
            })}
          </div>
        </aside>

        <main className="events-settings-main">
          {active === 'categories' ? <CategoriesPanel lang={lang} /> : null}
          {active === 'locations' ? <LocationsPanel lang={lang} /> : null}
          {active === 'registration' ? <RegistrationPanel lang={lang} /> : null}
          {active === 'notifications' ? <NotificationsPanel lang={lang} /> : null}
          {active === 'general' ? <GeneralPanel lang={lang} /> : null}
        </main>
      </div>
    </div>
  );
}

function isSection(value: string | undefined): value is Section {
  return (
    value === 'categories' ||
    value === 'locations' ||
    value === 'registration' ||
    value === 'notifications' ||
    value === 'general'
  );
}

function CategoriesPanel({ lang }: { lang: Lang }) {
  const rows = [
    {
      name: ['Eğlence', 'Entertainment'],
      icon: Sparkles,
      color: '#7C5CE0',
      events: 18,
      venues: 5,
      on: true,
    },
    {
      name: ['Çocuk Kulübü', 'Kids Club'],
      icon: Star,
      color: '#3267D6',
      events: 12,
      venues: 2,
      on: true,
    },
    { name: ['Spor', 'Sports'], icon: Activity, color: '#43A46F', events: 9, venues: 4, on: true },
    {
      name: ['Wellness', 'Wellness'],
      icon: Shield,
      color: '#327C98',
      events: 8,
      venues: 3,
      on: true,
    },
    {
      name: ['Yeme İçme', 'Food & Drink'],
      icon: CalendarClock,
      color: '#B8740A',
      events: 14,
      venues: 6,
      on: true,
    },
    {
      name: ['Özel Etkinlik', 'Special Event'],
      icon: Flag,
      color: '#D5485A',
      events: 6,
      venues: 2,
      on: false,
    },
  ] as const;

  return (
    <>
      <SettingsCard
        title={L(['Etkinlik kategorileri', 'Event categories'], lang)}
        sub={L(
          [
            'Takvim, liste ve misafir portalındaki kategori renklerini yönetin.',
            'Manage category colors across calendar, lists and the guest portal.',
          ],
          lang,
        )}
        action={
          <button className="btn btn--primary btn--sm" type="button">
            <Plus size={15} />
            {L(['Kategori ekle', 'Add category'], lang)}
          </button>
        }
      >
        <div className="events-settings-list">
          {rows.map((row) => (
            <SettingsLine
              color={row.color}
              icon={row.icon}
              inactiveLabel={L(['pasif', 'inactive'], lang)}
              key={L(row.name, lang)}
              title={L(row.name, lang)}
              subtitle={`${row.events} ${L(['etkinlik', 'events'], lang)} · ${row.venues} ${L(['lokasyon', 'locations'], lang)}`}
              inactive={!row.on}
            />
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        className="events-settings-card-spaced"
        title={L(['Yeni kategori', 'New category'], lang)}
        sub={L(
          [
            'Programda ve misafir portalında kullanılacak yeni bir kategori tanımlayın.',
            'Define a new category used in the program and guest portal.',
          ],
          lang,
        )}
        footer={
          <SettingsFooter
            note={L(
              [
                'Kategori değişiklikleri tüm otellerin etkinlik görünümünde kullanılır.',
                'Category changes are used across all hotel event views.',
              ],
              lang,
            )}
          >
            <button className="btn btn--subtle btn--sm" type="button">
              {L(['İptal', 'Cancel'], lang)}
            </button>
            <button className="btn btn--primary btn--sm" type="button">
              <Plus size={15} />
              {L(['Kategoriyi ekle', 'Add category'], lang)}
            </button>
          </SettingsFooter>
        }
      >
        <div className="card__body events-settings-form-body">
          <div className="fgrid">
            <Field
              label={L(['Kategori adı (TR)', 'Category name (TR)'], lang)}
              placeholder={L(['ör. Sahne Performansı', 'e.g. Stage performance'], lang)}
            />
            <Field
              label={L(['Kategori adı (EN)', 'Category name (EN)'], lang)}
              placeholder="Stage performance"
            />
            <Field label={L(['Sıra', 'Order'], lang)} value="7" mono />
            <div>
              <label className="flabel">{L(['İkon', 'Icon'], lang)}</label>
              <div className="seg-pills events-settings-icon-pills">
                {[Sparkles, Star, Activity, Shield, Flag, CalendarClock].map((Icon, index) => (
                  <div className={index === 0 ? 'seg-pill on' : 'seg-pill'} key={index}>
                    <Icon size={15} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ColorPicker label={L(['Renk', 'Color'], lang)} selected={0} />
          <OptionRow
            enabled
            title={L(['Misafir portalında göster', 'Show on guest portal'], lang)}
            desc={L(
              [
                'Misafirler bu kategoriyi mobil etkinlik akışında görür.',
                'Guests see this category in the mobile event feed.',
              ],
              lang,
            )}
          />
        </div>
      </SettingsCard>
    </>
  );
}

function LocationsPanel({ lang }: { lang: Lang }) {
  const rows = [
    {
      name: ['Ana Havuz', 'Main Pool'],
      type: ['Açık alan', 'Outdoor'],
      count: 14,
      color: '#327C98',
    },
    {
      name: ['Mini Kulüp', 'Kids Club'],
      type: ['Kapalı alan', 'Indoor'],
      count: 9,
      color: '#3267D6',
    },
    {
      name: ['Wellness Terası', 'Wellness Terrace'],
      type: ['Sessiz alan', 'Quiet area'],
      count: 8,
      color: '#43A46F',
    },
    { name: ['Sahil', 'Beach'], type: ['Açık alan', 'Outdoor'], count: 7, color: '#12A4B8' },
    {
      name: ['Amfi Tiyatro', 'Amphitheatre'],
      type: ['Sahne', 'Stage'],
      count: 5,
      color: '#D5485A',
    },
    {
      name: ['Teras Restoran', 'Terrace Restaurant'],
      type: ['Yeme içme', 'Dining'],
      count: 6,
      color: '#B8740A',
    },
  ] as const;

  return (
    <>
      <SettingsCard
        title={L(['Etkinlik lokasyonları', 'Event locations'], lang)}
        sub={L(
          [
            'Programda seçilebilir alanları ve kapasite notlarını düzenleyin.',
            'Edit selectable spaces and capacity notes for the program.',
          ],
          lang,
        )}
        action={
          <button className="btn btn--primary btn--sm" type="button">
            <Plus size={15} />
            {L(['Lokasyon ekle', 'Add location'], lang)}
          </button>
        }
      >
        <div className="events-settings-list">
          {rows.map((row) => (
            <SettingsLine
              color={row.color}
              icon={MapPin}
              key={L(row.name, lang)}
              title={L(row.name, lang)}
              subtitle={`${L(row.type, lang)} · ${row.count} ${L(['aktif etkinlik', 'active events'], lang)}`}
            />
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        className="events-settings-card-spaced"
        title={L(['Yeni lokasyon', 'New location'], lang)}
        sub={L(
          [
            'Etkinlik oluştururken seçilecek yeni bir alan tanımlayın.',
            'Define a new area selectable while creating events.',
          ],
          lang,
        )}
        footer={
          <SettingsFooter
            note={L(
              [
                'Lokasyonlar takvim ve katılımcı ekranlarında da görünür.',
                'Locations also appear in calendar and participant views.',
              ],
              lang,
            )}
          >
            <button className="btn btn--subtle btn--sm" type="button">
              {L(['İptal', 'Cancel'], lang)}
            </button>
            <button className="btn btn--primary btn--sm" type="button">
              <Plus size={15} />
              {L(['Lokasyonu ekle', 'Add location'], lang)}
            </button>
          </SettingsFooter>
        }
      >
        <div className="card__body events-settings-form-body">
          <div className="fgrid">
            <Field
              label={L(['Lokasyon adı (TR)', 'Location name (TR)'], lang)}
              placeholder={L(['ör. İskele Lounge', 'e.g. Pier Lounge'], lang)}
            />
            <Field
              label={L(['Lokasyon adı (EN)', 'Location name (EN)'], lang)}
              placeholder="Pier Lounge"
            />
            <Field label={L(['Varsayılan kapasite', 'Default capacity'], lang)} value="40" mono />
            <Field
              label={L(['Kat / Bölge', 'Floor / Zone'], lang)}
              value={L(['Sahil', 'Beach'], lang)}
            />
          </div>
          <OptionRow
            enabled
            title={L(['Takvimde göster', 'Show in calendar'], lang)}
            desc={L(
              [
                'Lokasyon filtresi etkinlik takviminde aktif olur.',
                'The location filter becomes available in the event calendar.',
              ],
              lang,
            )}
          />
        </div>
      </SettingsCard>
    </>
  );
}

function RegistrationPanel({ lang }: { lang: Lang }) {
  return (
    <>
      <SettingsCard
        title={L(['Kayıt varsayılanları', 'Registration defaults'], lang)}
        sub={L(
          [
            'Yeni etkinliklerde otomatik kullanılacak katılım ayarları.',
            'Attendance settings automatically used for new events.',
          ],
          lang,
        )}
      >
        <div className="card__body events-settings-options-body">
          <OptionRow
            enabled
            title={L(['Kayıt gerekli', 'Registration required'], lang)}
            desc={L(
              [
                'Misafirler etkinlik kapasitesinden yer ayırmak zorundadır.',
                'Guests must reserve a seat from event capacity.',
              ],
              lang,
            )}
          />
          <OptionRow
            enabled
            title={L(['Bekleme listesi', 'Waitlist'], lang)}
            desc={L(
              [
                'Kapasite dolduğunda misafirler otomatik bekleme listesine eklenir.',
                'Guests are automatically added to a waitlist once capacity is full.',
              ],
              lang,
            )}
          />
          <OptionRow
            enabled
            title={L(['QR check-in', 'QR check-in'], lang)}
            desc={L(
              [
                'Katılımcı girişleri QR kodla hızlıca işaretlenir.',
                'Participant arrivals can be marked quickly with QR codes.',
              ],
              lang,
            )}
          />
          <OptionRow
            title={L(['Otomatik kapanış', 'Auto close'], lang)}
            desc={L(
              [
                'Etkinlik başlamadan önce kayıtları otomatik kapatır.',
                'Automatically closes registration before the event starts.',
              ],
              lang,
            )}
          />
        </div>
      </SettingsCard>

      <SettingsCard
        className="events-settings-card-spaced"
        title={L(['Kapasite ve zamanlama', 'Capacity and timing'], lang)}
        sub={L(
          [
            'Yeni etkinlik formuna düşen varsayılan değerler.',
            'Default values populated in the new event form.',
          ],
          lang,
        )}
        footer={
          <SettingsFooter
            note={L(
              [
                'Bu ayarlar sadece yeni etkinlikleri etkiler.',
                'These settings affect new events only.',
              ],
              lang,
            )}
          >
            <button className="btn btn--subtle btn--sm" type="button">
              {L(['Sıfırla', 'Reset'], lang)}
            </button>
            <button className="btn btn--primary btn--sm" type="button">
              <Check size={15} />
              {L(['Kaydet', 'Save'], lang)}
            </button>
          </SettingsFooter>
        }
      >
        <div className="card__body events-settings-form-body">
          <div className="fgrid">
            <Field label={L(['Varsayılan kapasite', 'Default capacity'], lang)} value="60" mono />
            <Field label={L(['Kayıt kapanışı', 'Registration cutoff'], lang)} value="30 min" mono />
            <Field label={L(['Hatırlatma zamanı', 'Reminder time'], lang)} value="2 saat önce" />
            <Field label={L(['Check-in toleransı', 'Check-in window'], lang)} value="15 min" mono />
          </div>
        </div>
      </SettingsCard>
    </>
  );
}

function NotificationsPanel({ lang }: { lang: Lang }) {
  const rows = [
    {
      title: ['Kayıt onayı', 'Registration confirmation'],
      subtitle: ['Misafir kayıt olur olmaz gönderilir.', 'Sent as soon as a guest registers.'],
      color: 'var(--success)',
      soft: 'var(--success-soft)',
      icon: Check,
      on: true,
    },
    {
      title: ['24 saat hatırlatma', '24 hour reminder'],
      subtitle: [
        'Etkinlikten bir gün önce misafire bildirim gider.',
        'Notifies the guest one day before the event.',
      ],
      color: 'var(--info)',
      soft: 'var(--info-soft)',
      icon: Clock3,
      on: true,
    },
    {
      title: ['Kapasite uyarısı', 'Capacity alert'],
      subtitle: [
        'Doluluk %90 üzerine çıktığında ekibi bilgilendirir.',
        'Alerts the team once occupancy exceeds 90%.',
      ],
      color: 'var(--warning)',
      soft: 'var(--warning-soft)',
      icon: Megaphone,
      on: true,
    },
    {
      title: ['İptal bildirimi', 'Cancellation notice'],
      subtitle: [
        'Program değişikliklerinde katılımcılara otomatik gider.',
        'Automatically reaches participants after schedule changes.',
      ],
      color: 'var(--danger)',
      soft: 'var(--danger-soft)',
      icon: Bell,
      on: false,
    },
  ] as const;

  return (
    <>
      <SettingsCard
        title={L(['Bildirim şablonları', 'Notification templates'], lang)}
        sub={L(
          [
            'Etkinlik akışındaki otomatik mesajları yönetin.',
            'Manage automated messages in the event flow.',
          ],
          lang,
        )}
        action={
          <button className="btn btn--primary btn--sm" type="button">
            <Plus size={15} />
            {L(['Şablon ekle', 'Add template'], lang)}
          </button>
        }
      >
        <div className="events-settings-list">
          {rows.map((row) => (
            <SettingsLine
              color={row.color}
              icon={row.icon}
              inactiveLabel={L(['pasif', 'inactive'], lang)}
              key={L(row.title, lang)}
              soft={row.soft}
              title={L(row.title, lang)}
              subtitle={L(row.subtitle, lang)}
              inactive={!row.on}
            />
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        className="events-settings-card-spaced"
        title={L(['Yeni mesaj', 'New message'], lang)}
        sub={L(
          [
            'Misafir portalı ve ekip bildirimleri için kısa metin şablonu oluşturun.',
            'Create a short text template for guest portal and team notifications.',
          ],
          lang,
        )}
        footer={
          <SettingsFooter
            note={L(
              [
                'Şablonlar çok dilli içerik alanlarında kullanılır.',
                'Templates are used in multilingual content fields.',
              ],
              lang,
            )}
          >
            <button className="btn btn--subtle btn--sm" type="button">
              {L(['İptal', 'Cancel'], lang)}
            </button>
            <button className="btn btn--primary btn--sm" type="button">
              <Plus size={15} />
              {L(['Şablonu ekle', 'Add template'], lang)}
            </button>
          </SettingsFooter>
        }
      >
        <div className="card__body events-settings-form-body">
          <div className="fgrid">
            <Field
              label={L(['Şablon adı', 'Template name'], lang)}
              placeholder={L(['ör. VIP daveti', 'e.g. VIP invite'], lang)}
            />
            <Field
              label={L(['Kanal', 'Channel'], lang)}
              value={L(['Push + E-posta', 'Push + Email'], lang)}
            />
          </div>
          <div className="events-settings-textarea-field">
            <label className="flabel">{L(['Mesaj', 'Message'], lang)}</label>
            <textarea
              className="finput"
              defaultValue={L(
                [
                  'Merhaba {{guest}}, {{event}} için rezervasyonunuz onaylandı.',
                  'Hi {{guest}}, your reservation for {{event}} is confirmed.',
                ],
                lang,
              )}
            />
          </div>
        </div>
      </SettingsCard>
    </>
  );
}

function GeneralPanel({ lang }: { lang: Lang }) {
  return (
    <SettingsCard
      title={L(['Genel ayarlar', 'General settings'], lang)}
      sub={L(
        [
          'Etkinlik modülünün misafir portalı ve operasyon davranışları.',
          'Guest portal and operations behavior for the events module.',
        ],
        lang,
      )}
      footer={
        <SettingsFooter
          note={L(['Son güncelleme bugün 10:24.', 'Last updated today at 10:24.'], lang)}
        >
          <button className="btn btn--ghost btn--sm" type="button">
            <Download size={15} />
            {L(['Dışa aktar', 'Export'], lang)}
          </button>
          <button className="btn btn--primary btn--sm" type="button">
            <Check size={15} />
            {L(['Kaydet', 'Save'], lang)}
          </button>
        </SettingsFooter>
      }
    >
      <div className="card__body events-settings-options-body">
        <OptionRow
          enabled
          title={L(['Misafir portalında etkinlikleri göster', 'Show events on guest portal'], lang)}
          desc={L(
            [
              'Aktif etkinlikler mobil misafir deneyiminde görünür.',
              'Active events appear in the mobile guest experience.',
            ],
            lang,
          )}
        />
        <OptionRow
          enabled
          title={L(['Kalan kapasiteyi göster', 'Show remaining capacity'], lang)}
          desc={L(
            [
              'Misafirler kontenjan durumunu etkinlik kartında görür.',
              'Guests see availability status on event cards.',
            ],
            lang,
          )}
        />
        <OptionRow
          enabled
          title={L(['AIDA insight önerileri', 'AIDA insight suggestions'], lang)}
          desc={L(
            [
              'Doluluk ve katılım verilerine göre operasyon önerileri üretir.',
              'Generates operations suggestions from capacity and attendance data.',
            ],
            lang,
          )}
        />
        <OptionRow
          title={L(['Geçmiş etkinlikleri gizle', 'Hide past events'], lang)}
          desc={L(
            [
              'Tamamlanan etkinlikleri misafir portalından otomatik kaldırır.',
              'Automatically removes completed events from the guest portal.',
            ],
            lang,
          )}
        />
      </div>
    </SettingsCard>
  );
}

function SettingsCard({
  title,
  sub,
  action,
  children,
  footer,
  className,
}: {
  title: string;
  sub: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <section className={['card events-settings-card', className].filter(Boolean).join(' ')}>
      <div className="card__head events-settings-card-head">
        <div>
          <div className="card__title">{title}</div>
          <div className="card__sub">{sub}</div>
        </div>
        {action}
      </div>
      {children}
      {footer}
    </section>
  );
}

function SettingsLine({
  icon: Icon,
  color,
  soft,
  title,
  subtitle,
  inactive,
  inactiveLabel,
}: {
  icon: LucideIcon;
  color: string;
  soft?: string;
  title: string;
  subtitle: string;
  inactive?: boolean;
  inactiveLabel?: string;
}) {
  return (
    <div className="events-settings-line">
      <span
        className="events-settings-line__ico"
        style={{
          background: soft ?? `color-mix(in srgb, ${color} 14%, transparent)`,
          color,
        }}
      >
        <Icon size={18} />
      </span>
      <div className="events-settings-line__body">
        <div className="events-settings-line__title">
          {title}
          {inactive ? <InactivePill label={inactiveLabel ?? 'inactive'} /> : null}
        </div>
        <div className="events-settings-line__sub">{subtitle}</div>
      </div>
      <span className={inactive ? 'pb-sw' : 'pb-sw on'} />
      <RowActions />
    </div>
  );
}

function InactivePill({ label }: { label: string }) {
  return <span className="set-pill events-settings-inactive-pill">{label}</span>;
}

function RowActions() {
  return (
    <div className="rowact events-settings-row-actions">
      <button type="button" title="Edit">
        <Pencil size={15} />
      </button>
      <button type="button" title="More">
        <MoreHorizontal size={15} />
      </button>
      <button type="button" title="Delete">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

function Field({
  label,
  placeholder,
  value,
  mono,
}: {
  label: string;
  placeholder?: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <label className="flabel">{label}</label>
      <input
        className={mono ? 'finput mono' : 'finput'}
        placeholder={placeholder}
        defaultValue={value}
      />
    </div>
  );
}

function ColorPicker({ label, selected }: { label: string; selected: number }) {
  return (
    <div className="events-settings-color-field">
      <label className="flabel">{label}</label>
      <div className="events-swatch-row">
        {COLOR_SWATCHES.map((color, index) => (
          <span
            className={index === selected ? 'cswatch on' : 'cswatch'}
            key={`${color}-${index}`}
            style={{ background: color }}
          >
            {index === selected ? <Check size={14} /> : null}
          </span>
        ))}
      </div>
    </div>
  );
}

function OptionRow({ title, desc, enabled }: { title: string; desc: string; enabled?: boolean }) {
  return (
    <div className="optrow events-settings-option-row">
      <div>
        <div className="optrow__t">{title}</div>
        <div className="optrow__d">{desc}</div>
      </div>
      <span className={enabled ? 'switch on' : 'switch'} />
    </div>
  );
}

function SettingsFooter({ note, children }: { note: string; children: ReactNode }) {
  return (
    <div className="set-sec__foot events-settings-footer">
      <span>{note}</span>
      {children}
    </div>
  );
}
