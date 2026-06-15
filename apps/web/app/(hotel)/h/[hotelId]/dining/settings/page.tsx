import Link from 'next/link';
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Check,
  ChevronRight,
  Coffee,
  Download,
  Flame,
  Gift,
  Heart,
  Leaf,
  Pencil,
  Plus,
  Search,
  Shield,
  Sparkles,
  Star,
  Trash2,
  UtensilsCrossed,
  Wine,
  X,
  Cog,
  Droplets,
  Layers,
  Filter,
  MoreHorizontal,
} from 'lucide-react';
import { DiningSubnav } from '@/components/console/dining/dining-subnav';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

type Section = 'categories' | 'tags' | 'allergens' | 'general';
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
    icon: Layers,
    label: ['Kategoriler', 'Categories'],
    count: 6,
    title: ['Kategoriler', 'Categories'],
    sub: ['Menü kategorileri ve sıralaması.', 'Menu categories and ordering.'],
  },
  {
    id: 'tags',
    icon: Filter,
    label: ['Etiketler', 'Tags'],
    count: 5,
    title: ['Etiketler', 'Tags'],
    sub: ['Menü öğelerine eklenen rozetler.', 'Badges applied to menu items.'],
  },
  {
    id: 'allergens',
    icon: Shield,
    label: ['Alerjenler', 'Allergens'],
    count: 8,
    title: ['Alerjenler', 'Allergens'],
    sub: ['Misafir güvenliği için alerjen yönetimi.', 'Allergen management for guest safety.'],
  },
  {
    id: 'general',
    icon: Cog,
    label: ['Genel', 'General'],
    title: ['Genel', 'General'],
    sub: ['Tüm mekanlar için varsayılanlar.', 'Defaults across all venues.'],
  },
];

const COLOR_SWATCHES = [
  '#0E7490',
  '#7C5CE0',
  '#12A4B8',
  '#B8740A',
  '#0E9F6E',
  '#D5485A',
  '#2563C9',
  '#0A5E4F',
];

export default async function DiningSettingsPage({
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
    <div className="dining-settings fade-in">
      <div className="page-hero dining-hero">
        <div>
          <h1 className="page-hero__h">{L(['Restoran Ayarları', 'Dining Settings'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              [
                'Kategori, etiket ve alerjen listelerini buradan yönetin.',
                'Manage categories, tags and allergen lists from here.',
              ],
              lang,
            )}
          </p>
        </div>
      </div>

      <DiningSubnav hotelId={hotelId} active="settings" lang={lang} />

      <div className="dining-settings-heading">
        <div>
          <div className="dining-settings-heading__title">{L(current.title, lang)}</div>
          <div className="dining-settings-heading__sub">{L(current.sub, lang)}</div>
        </div>
        <div className="searchmini dining-settings-search">
          <Search size={15} />
          <input placeholder={L(['Arama...', 'Search...'], lang)} />
        </div>
      </div>

      <div className="dining-settings-grid">
        <aside className="dining-settings-nav">
          <div className="card dining-settings-nav-card">
            {SECTIONS.map((section) => {
              const Icon = section.icon;
              const on = section.id === active;
              return (
                <Link
                  className={on ? 'dining-settings-nav-item on' : 'dining-settings-nav-item'}
                  href={`/h/${hotelId}/dining/settings?section=${section.id}`}
                  key={section.id}
                >
                  <span className="dining-settings-nav-icon">
                    <Icon size={16} />
                  </span>
                  <span className="optrow__t">{L(section.label, lang)}</span>
                  {section.count != null ? (
                    <span className="badge badge--mute mono">{section.count}</span>
                  ) : null}
                  <ChevronRight size={14} className="dining-settings-nav-chevron" />
                </Link>
              );
            })}
          </div>
        </aside>

        <main className="dining-settings-main">
          {active === 'categories' ? <CategoriesPanel lang={lang} /> : null}
          {active === 'tags' ? <TagsPanel lang={lang} /> : null}
          {active === 'allergens' ? <AllergensPanel lang={lang} /> : null}
          {active === 'general' ? <GeneralPanel lang={lang} /> : null}
        </main>
      </div>
    </div>
  );
}

function isSection(value: string | undefined): value is Section {
  return value === 'categories' || value === 'tags' || value === 'allergens' || value === 'general';
}

function CategoriesPanel({ lang }: { lang: Lang }) {
  const rows = [
    {
      name: ['Kahvaltı', 'Breakfast'],
      icon: Coffee,
      color: '#B8740A',
      items: 18,
      venues: 2,
      on: true,
    },
    {
      name: ['Öğle Yemeği', 'Lunch'],
      icon: UtensilsCrossed,
      color: '#0E7490',
      items: 24,
      venues: 3,
      on: true,
    },
    {
      name: ['Akşam Yemeği', 'Dinner'],
      icon: UtensilsCrossed,
      color: '#7C5CE0',
      items: 32,
      venues: 2,
      on: true,
    },
    { name: ['İçecekler', 'Drinks'], icon: Wine, color: '#12A4B8', items: 41, venues: 4, on: true },
    {
      name: ['Tatlılar', 'Desserts'],
      icon: Gift,
      color: '#D5485A',
      items: 12,
      venues: 3,
      on: true,
    },
    {
      name: ['Çocuk Menüsü', 'Kids Menu'],
      icon: Heart,
      color: '#0E9F6E',
      items: 8,
      venues: 2,
      on: false,
    },
  ] as const;

  return (
    <>
      <SettingsCard
        title={L(['Menü kategorileri', 'Menu categories'], lang)}
        sub={L(
          [
            'Tüm mekanlardaki menüleri gruplayan üst-düzey kategoriler.',
            'Top-level categories grouping items across venues.',
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
        <div className="dining-settings-list">
          {rows.map((row) => (
            <SettingsLine
              color={row.color}
              icon={row.icon}
              inactiveLabel={L(['pasif', 'inactive'], lang)}
              key={L(row.name, lang)}
              title={L(row.name, lang)}
              subtitle={`${row.items} ${L(['menü öğesi', 'menu items'], lang)} · ${row.venues} ${L(['mekan', 'venues'], lang)}`}
              inactive={!row.on}
            />
          ))}
        </div>
      </SettingsCard>

      <SettingsCard
        className="dining-settings-card-spaced"
        title={L(['Yeni kategori', 'New category'], lang)}
        sub={L(
          [
            'Misafir portalında ve menü listelerinde görünecek yeni bir kategori tanımlayın.',
            'Define a new category visible in the guest portal and menu lists.',
          ],
          lang,
        )}
        footer={
          <SettingsFooter
            note={L(
              ['Değişiklikler tüm menülere uygulanır.', 'Changes apply to every menu.'],
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
        <div className="card__body dining-settings-form-body">
          <div className="fgrid">
            <Field
              label={L(['Kategori adı (TR)', 'Category name (TR)'], lang)}
              placeholder={L(['ör. Geç Saat Menü', 'e.g. Late-night menu'], lang)}
            />
            <Field
              label={L(['Kategori adı (EN)', 'Category name (EN)'], lang)}
              placeholder="Late-night menu"
            />
            <Field label={L(['Sıra', 'Order'], lang)} value="7" mono />
            <div>
              <label className="flabel">{L(['İkon', 'Icon'], lang)}</label>
              <div className="seg-pills dining-settings-icon-pills">
                {[UtensilsCrossed, Wine, Coffee, Gift, Heart, Leaf].map((Icon, index) => (
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
                'Misafirler bu kategoriyi mobil menüde görür.',
                'Guests will see this category in the mobile menu.',
              ],
              lang,
            )}
          />
        </div>
      </SettingsCard>
    </>
  );
}

function TagsPanel({ lang }: { lang: Lang }) {
  const rows = [
    {
      key: 'veg',
      label: ['Vegan', 'Vegan'],
      color: 'var(--success)',
      soft: 'var(--success-soft)',
      icon: Leaf,
      uses: 22,
      on: true,
    },
    {
      key: 'spicy',
      label: ['Acı', 'Spicy'],
      color: 'var(--danger)',
      soft: 'var(--danger-soft)',
      icon: Flame,
      uses: 14,
      on: true,
    },
    {
      key: 'new',
      label: ['Yeni', 'New'],
      color: 'var(--accent)',
      soft: 'var(--accent-soft)',
      icon: Sparkles,
      uses: 9,
      on: true,
    },
    {
      key: 'gf',
      label: ['Glutensiz', 'Gluten-free'],
      color: 'var(--info)',
      soft: 'var(--info-soft)',
      icon: Shield,
      uses: 11,
      on: true,
    },
    {
      key: 'chef',
      label: ['Şef Seçimi', "Chef's Pick"],
      color: 'var(--warning)',
      soft: 'var(--warning-soft)',
      icon: Star,
      uses: 6,
      on: false,
    },
  ] as const;

  return (
    <>
      <SettingsCard
        title={L(['Menü etiketleri', 'Menu tags'], lang)}
        sub={L(
          [
            'Misafir menüde gördüğü küçük rozetler. Filtre ve arama için kullanılır.',
            'Small badges shown on the menu. Used for filtering and search.',
          ],
          lang,
        )}
        action={
          <button className="btn btn--primary btn--sm" type="button">
            <Plus size={15} />
            {L(['Etiket ekle', 'Add tag'], lang)}
          </button>
        }
      >
        <div className="dining-settings-list">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div className="dining-settings-line" key={row.key}>
                <span
                  className="dining-settings-line__ico"
                  style={{ background: row.soft, color: row.color }}
                >
                  <Icon size={18} />
                </span>
                <div className="dining-settings-line__body">
                  <div className="dining-settings-line__title">
                    {L(row.label, lang)}
                    {!row.on ? <InactivePill label={L(['pasif', 'inactive'], lang)} /> : null}
                  </div>
                  <div className="dining-settings-line__sub mono">
                    #{row.key} · {row.uses} {L(['menüde kullanılıyor', 'items use this tag'], lang)}
                  </div>
                </div>
                <span
                  className="tag dining-settings-preview-tag"
                  style={{ background: row.soft, color: row.color }}
                >
                  {L(row.label, lang)}
                </span>
                <span className={row.on ? 'pb-sw on' : 'pb-sw'} />
                <RowActions danger />
              </div>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard
        className="dining-settings-card-spaced"
        title={L(['Yeni etiket', 'New tag'], lang)}
        sub={L(
          [
            'Etiketler menü kartlarında rozet olarak görünür.',
            'Tags appear as badges on menu cards.',
          ],
          lang,
        )}
        footer={
          <SettingsFooter
            note={L(
              ['Etiketler tüm mekanlar arasında paylaşılır.', 'Tags are shared across all venues.'],
              lang,
            )}
          >
            <button className="btn btn--subtle btn--sm" type="button">
              {L(['İptal', 'Cancel'], lang)}
            </button>
            <button className="btn btn--primary btn--sm" type="button">
              <Plus size={15} />
              {L(['Etiketi ekle', 'Add tag'], lang)}
            </button>
          </SettingsFooter>
        }
      >
        <div className="card__body dining-settings-form-body">
          <div className="fgrid">
            <Field
              label={L(['Etiket adı (TR)', 'Tag name (TR)'], lang)}
              placeholder={L(['ör. İmza Yemek', 'e.g. Signature'], lang)}
            />
            <Field label={L(['Etiket adı (EN)', 'Tag name (EN)'], lang)} placeholder="Signature" />
            <Field label={L(['Anahtar', 'Key'], lang)} value="signature" mono />
            <div>
              <label className="flabel">{L(['İkon', 'Icon'], lang)}</label>
              <div className="seg-pills dining-settings-icon-pills">
                {[Leaf, Flame, Sparkles, Star, Shield, Heart].map((Icon, index) => (
                  <div className={index === 2 ? 'seg-pill on' : 'seg-pill'} key={index}>
                    <Icon size={15} />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ColorPicker label={L(['Renk', 'Color'], lang)} selected={1} semantic />
          <div className="dining-settings-preview-box">
            <div className="cell-sub">{L(['Önizleme', 'Preview'], lang)}</div>
            <div className="tagrow">
              <span className="tag dining-settings-signature-tag">
                <Sparkles size={12} />
                {L(['İmza Yemek', 'Signature'], lang)}
              </span>
            </div>
          </div>
        </div>
      </SettingsCard>
    </>
  );
}

function AllergensPanel({ lang }: { lang: Lang }) {
  const rows = [
    { label: ['Gluten', 'Gluten'], count: 31, severity: 'high', icon: Shield },
    { label: ['Süt ürünleri', 'Dairy'], count: 28, severity: 'med', icon: Droplets },
    { label: ['Yumurta', 'Egg'], count: 17, severity: 'med', icon: Shield },
    { label: ['Fıstık', 'Peanut'], count: 9, severity: 'high', icon: Shield },
    { label: ['Kabuklu yemiş', 'Tree nuts'], count: 14, severity: 'high', icon: Shield },
    { label: ['Deniz ürünü', 'Shellfish'], count: 12, severity: 'high', icon: Shield },
    { label: ['Soya', 'Soy'], count: 8, severity: 'low', icon: Leaf },
    { label: ['Susam', 'Sesame'], count: 6, severity: 'low', icon: Leaf },
  ] as const;

  return (
    <>
      <div className="card dining-allergen-alert">
        <div className="card__body">
          <div className="dining-allergen-alert__icon">
            <Shield size={18} />
          </div>
          <div>
            <div className="dining-allergen-alert__title">
              {L(
                [
                  'Alerjen yönetimi misafir güvenliği için kritiktir',
                  'Allergen management is critical for guest safety',
                ],
                lang,
              )}
            </div>
            <div className="dining-allergen-alert__sub">
              {L(
                [
                  'Burada tanımlanan alerjenler tüm menü öğelerinde seçilebilir, misafir portalında uyarı olarak gösterilir ve mutfak ekibine otomatik bildirim olarak iletilir.',
                  'Allergens defined here can be assigned to any menu item, are shown as warnings on the guest portal and are auto-broadcast to the kitchen team.',
                ],
                lang,
              )}
            </div>
          </div>
        </div>
      </div>

      <SettingsCard
        className="dining-settings-card-spaced"
        title={L(['Alerjen listesi', 'Allergen list'], lang)}
        sub={L(
          [
            '8 alerjen tanımlı · Avrupa Birliği EU 1169/2011 uyumlu',
            '8 allergens defined · EU 1169/2011 compliant',
          ],
          lang,
        )}
        action={
          <div className="page-hero__actions">
            <button className="btn btn--ghost btn--sm" type="button">
              <Download size={15} />
              {L(['EU listesini içe aktar', 'Import EU list'], lang)}
            </button>
            <button className="btn btn--primary btn--sm" type="button">
              <Plus size={15} />
              {L(['Alerjen ekle', 'Add allergen'], lang)}
            </button>
          </div>
        }
      >
        <div className="dining-settings-list">
          {rows.map((row) => {
            const severity = allergenSeverity(row.severity, lang);
            return (
              <SettingsLine
                color={severity.color}
                icon={row.icon}
                key={L(row.label, lang)}
                soft={severity.soft}
                title={L(row.label, lang)}
                subtitle={`${row.count} ${L(['menü öğesinde bulunur', 'items contain this allergen'], lang)}`}
                pill={
                  <span
                    className="set-pill"
                    style={{ background: severity.soft, color: severity.color }}
                  >
                    {severity.label}
                  </span>
                }
                noSwitch
                danger
              />
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard
        className="dining-settings-card-spaced"
        title={L(['Yeni alerjen', 'New allergen'], lang)}
        sub={L(
          [
            'Alerjen tüm mekanlarda menü öğelerine eklenebilir hale gelir.',
            'The allergen becomes available to add to menu items across all venues.',
          ],
          lang,
        )}
        footer={
          <SettingsFooter
            note={L(
              [
                'Yasal uyum için tüm değişiklikler denetim kaydına işlenir.',
                'All changes are logged to the audit trail for compliance.',
              ],
              lang,
            )}
          >
            <button className="btn btn--subtle btn--sm" type="button">
              {L(['İptal', 'Cancel'], lang)}
            </button>
            <button className="btn btn--primary btn--sm" type="button">
              <Plus size={15} />
              {L(['Alerjeni ekle', 'Add allergen'], lang)}
            </button>
          </SettingsFooter>
        }
      >
        <div className="card__body dining-settings-form-body">
          <div className="fgrid">
            <Field
              label={L(['Ad (TR)', 'Name (TR)'], lang)}
              placeholder={L(['ör. Hardal', 'e.g. Mustard'], lang)}
            />
            <Field label={L(['Ad (EN)', 'Name (EN)'], lang)} placeholder="Mustard" />
            <Field label={L(['Anahtar', 'Key'], lang)} value="mustard" mono />
            <div>
              <label className="flabel">{L(['Risk seviyesi', 'Risk level'], lang)}</label>
              <div className="seg-pills dining-settings-risk-pills">
                <div className="seg-pill">
                  <span className="ico-dot" style={{ background: 'var(--info)' }} />
                  {L(['Düşük', 'Low'], lang)}
                </div>
                <div className="seg-pill on">
                  <span className="ico-dot" style={{ background: 'var(--warning)' }} />
                  {L(['Orta', 'Medium'], lang)}
                </div>
                <div className="seg-pill">
                  <span className="ico-dot" style={{ background: 'var(--danger)' }} />
                  {L(['Yüksek', 'High'], lang)}
                </div>
              </div>
            </div>
          </div>
          <div className="dining-settings-textarea-field">
            <label className="flabel">{L(['Açıklama', 'Description'], lang)}</label>
            <textarea
              className="ftextarea"
              placeholder={L(
                [
                  'Bu alerjen hakkında misafire gösterilecek açıklama...',
                  'Guest-facing description for this allergen...',
                ],
                lang,
              )}
            />
          </div>
          <OptionRow
            enabled
            title={L(
              ['Misafir portalında zorunlu uyarı göster', 'Show mandatory warning on guest portal'],
              lang,
            )}
            desc={L(
              [
                'İçeren öğelerde misafire büyük uyarı rozeti gösterilir.',
                'A prominent warning badge is shown on items that contain this.',
              ],
              lang,
            )}
          />
          <OptionRow
            enabled
            title={L(['Mutfağa otomatik bildirim', 'Auto-notify kitchen'], lang)}
            desc={L(
              [
                'Misafir bu alerjeni profilinde işaretlediğinde otomatik uyarı gönderilir.',
                'Sends an automatic alert when a guest flags this in their profile.',
              ],
              lang,
            )}
          />
        </div>
      </SettingsCard>
    </>
  );
}

function GeneralPanel({ lang }: { lang: Lang }) {
  return (
    <SettingsCard
      title={L(['Genel restoran ayarları', 'General dining settings'], lang)}
      sub={L(
        ['Tüm mekanlar için varsayılan davranış.', 'Default behavior across all venues.'],
        lang,
      )}
    >
      <div className="card__body dining-settings-options-body">
        <OptionRow
          enabled
          title={L(['Misafir portalında menüleri göster', 'Show menus on guest portal'], lang)}
          desc={L(
            [
              'Misafirler mekanların menülerini mobil cihazlarında görür.',
              'Guests can view menus on their mobile devices.',
            ],
            lang,
          )}
        />
        <OptionRow
          enabled
          title={L(['Alerjen filtresi varsayılan açık', 'Allergen filter on by default'], lang)}
          desc={L(
            [
              'Misafirin profil alerjenleri otomatik olarak menüye uygulanır.',
              'Guest profile allergens are applied to the menu automatically.',
            ],
            lang,
          )}
        />
        <OptionRow
          enabled
          title={L(['Çevrimiçi rezervasyon', 'Online reservations'], lang)}
          desc={L(
            [
              'Misafirler tüm mekanlarda rezervasyon yapabilir.',
              'Guests can reserve at all venues.',
            ],
            lang,
          )}
        />
        <OptionRow
          title={L(['Otomatik no-show bildirimi', 'Auto no-show flag'], lang)}
          desc={L(
            [
              'Rezervasyon saatinden 30 dk sonra misafire bildirim gönderilir.',
              'Notify the guest 30 minutes after their reservation time.',
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
    <section className={['card dining-settings-card', className].filter(Boolean).join(' ')}>
      <div className="card__head dining-settings-card-head">
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
  pill,
  noSwitch,
  danger,
  inactiveLabel,
}: {
  icon: LucideIcon;
  color: string;
  soft?: string;
  title: string;
  subtitle: string;
  inactive?: boolean;
  pill?: React.ReactNode;
  noSwitch?: boolean;
  danger?: boolean;
  inactiveLabel?: string;
}) {
  return (
    <div className="dining-settings-line">
      <span
        className="dining-settings-line__ico"
        style={{
          background: soft ?? `color-mix(in srgb, ${color} 14%, transparent)`,
          color,
        }}
      >
        <Icon size={18} />
      </span>
      <div className="dining-settings-line__body">
        <div className="dining-settings-line__title">
          {title}
          {inactive ? <InactivePill label={inactiveLabel ?? 'inactive'} /> : null}
          {pill}
        </div>
        <div className="dining-settings-line__sub">{subtitle}</div>
      </div>
      {!noSwitch ? <span className={inactive ? 'pb-sw' : 'pb-sw on'} /> : null}
      <RowActions danger={danger} />
    </div>
  );
}

function InactivePill({ label }: { label: string }) {
  return <span className="set-pill dining-settings-inactive-pill">{label}</span>;
}

function RowActions({ danger }: { danger?: boolean }) {
  return (
    <div className="rowact dining-settings-row-actions">
      <button type="button" title="Edit">
        <Pencil size={15} />
      </button>
      <button type="button" title={danger ? 'Delete' : 'More'}>
        {danger ? <Trash2 size={15} /> : <MoreHorizontal size={15} />}
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

function ColorPicker({
  label,
  selected,
  semantic,
}: {
  label: string;
  selected: number;
  semantic?: boolean;
}) {
  const colors = semantic
    ? [
        'var(--success)',
        'var(--accent)',
        'var(--info)',
        'var(--warning)',
        'var(--danger)',
        'var(--purple)',
      ]
    : COLOR_SWATCHES;
  return (
    <div className="dining-settings-color-field">
      <label className="flabel">{label}</label>
      <div className="dining-swatch-row">
        {colors.map((color, index) => (
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
    <div className="optrow dining-settings-option-row">
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
    <div className="set-sec__foot dining-settings-footer">
      <span>{note}</span>
      {children}
    </div>
  );
}

function allergenSeverity(severity: 'high' | 'med' | 'low', lang: Lang) {
  if (severity === 'high')
    return {
      color: 'var(--danger)',
      soft: 'var(--danger-soft)',
      label: L(['Yüksek risk', 'High risk'], lang),
    };
  if (severity === 'med')
    return {
      color: 'var(--warning)',
      soft: 'var(--warning-soft)',
      label: L(['Orta', 'Medium'], lang),
    };
  return {
    color: 'var(--info)',
    soft: 'var(--info-soft)',
    label: L(['Düşük', 'Low'], lang),
  };
}
