import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Check,
  ChevronDown,
  Coffee,
  Gift,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  UtensilsCrossed,
  Wine,
  type LucideIcon,
} from 'lucide-react';
import { DiningSubnav } from '@/components/console/dining/dining-subnav';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

type MenuTag = 'veg' | 'spicy' | 'new';
type MenuCategory = 'breakfast' | 'lunch' | 'dinner' | 'drinks' | 'desserts';

const MENU_CATEGORIES: Record<
  MenuCategory,
  { label: readonly [string, string]; icon: LucideIcon }
> = {
  breakfast: { label: ['Kahvaltı', 'Breakfast'], icon: Coffee },
  lunch: { label: ['Öğle Yemeği', 'Lunch'], icon: UtensilsCrossed },
  dinner: { label: ['Akşam Yemeği', 'Dinner'], icon: UtensilsCrossed },
  drinks: { label: ['İçecekler', 'Drinks'], icon: Wine },
  desserts: { label: ['Tatlılar', 'Desserts'], icon: Gift },
};

const TAGS: Record<MenuTag, { cls: string; label: readonly [string, string] }> = {
  veg: { cls: 'veg', label: ['Vegan', 'Vegan'] },
  spicy: { cls: 'spicy', label: ['Acı', 'Spicy'] },
  new: { cls: 'new', label: ['Yeni', 'New'] },
};

const MENU_ITEMS = [
  {
    name: ['Akdeniz Kahvaltı Tabağı', 'Mediterranean Breakfast'],
    category: 'breakfast',
    venue: ['Ana Restoran', 'Main'],
    price: '€18',
    available: true,
    tags: ['veg'],
  },
  {
    name: ['Izgara Levrek', 'Grilled Sea Bass'],
    category: 'dinner',
    venue: ["A'la Carte", "A'la Carte"],
    price: '€32',
    available: true,
    tags: ['new'],
  },
  {
    name: ['Adana Kebap', 'Adana Kebab'],
    category: 'dinner',
    venue: ['Ana Restoran', 'Main'],
    price: '€24',
    available: true,
    tags: ['spicy'],
  },
  {
    name: ['Vegan Buddha Bowl', 'Vegan Buddha Bowl'],
    category: 'lunch',
    venue: ['Havuz Bar', 'Pool Bar'],
    price: '€16',
    available: true,
    tags: ['veg'],
  },
  {
    name: ['Klasik Mojito', 'Classic Mojito'],
    category: 'drinks',
    venue: ['Lobi Bar', 'Lobby Bar'],
    price: '€11',
    available: true,
    tags: [],
  },
  {
    name: ['Baklava Tabağı', 'Baklava Plate'],
    category: 'desserts',
    venue: ["A'la Carte", "A'la Carte"],
    price: '€9',
    available: false,
    tags: [],
  },
] as const satisfies readonly {
  name: readonly [string, string];
  category: MenuCategory;
  venue: readonly [string, string];
  price: string;
  available: boolean;
  tags: readonly MenuTag[];
}[];

function FilterChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button className="fchip dining-menu-filter" type="button">
      {icon}
      {label}
      <ChevronDown />
    </button>
  );
}

function TagChip({ tag, lang }: { tag: MenuTag; lang: Lang }) {
  const meta = TAGS[tag];
  return <span className={`tag tag--${meta.cls}`}>{L(meta.label, lang)}</span>;
}

function AvailabilityBadge({ available, lang }: { available: boolean; lang: Lang }) {
  return (
    <span className={available ? 'badge badge--ok' : 'badge badge--warn'}>
      <span className="ico-dot" />
      {available ? L(['Mevcut', 'Available'], lang) : L(['Tükendi', 'Sold out'], lang)}
    </span>
  );
}

function MenuRow({
  item,
  lang,
  base,
}: {
  item: (typeof MENU_ITEMS)[number];
  lang: Lang;
  base: string;
}) {
  const category = MENU_CATEGORIES[item.category];
  const Icon = category.icon;

  return (
    <tr>
      <td>
        <Link className="table__name dining-menu-item-link" href={`${base}/menu/grilled-sea-bass`}>
          <span className="table__logo dining-menu-logo">
            <Icon size={16} />
          </span>
          <span className="dining-menu-name">{L(item.name, lang)}</span>
        </Link>
      </td>
      <td>
        <span className="badge badge--mute">{L(category.label, lang)}</span>
      </td>
      <td className="dining-menu-muted">{L(item.venue, lang)}</td>
      <td className="price dining-menu-price">{item.price}</td>
      <td>
        <AvailabilityBadge available={item.available} lang={lang} />
      </td>
      <td>
        <div className="tags">
          {item.tags.length ? (
            item.tags.map((tag) => <TagChip key={tag} tag={tag} lang={lang} />)
          ) : (
            <span className="dining-menu-empty">—</span>
          )}
        </div>
      </td>
      <td>
        <div className="rowact dining-menu-actions">
          <Link
            aria-label={L(['Menü öğesini düzenle', 'Edit menu item'], lang)}
            href={`${base}/menu/grilled-sea-bass/edit`}
          >
            <Pencil />
          </Link>
          <button aria-label={L(['Daha fazla işlem', 'More actions'], lang)} type="button">
            <MoreHorizontal />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default async function DiningMenu({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/dining`;
  const categories =
    lang === 'tr'
      ? ['Tümü', 'Kahvaltı', 'Öğle Yemeği', 'Akşam Yemeği', 'İçecekler', 'Tatlılar']
      : ['All', 'Breakfast', 'Lunch', 'Dinner', 'Drinks', 'Desserts'];

  return (
    <div className="dining-menu fade-in">
      <div className="page-hero dining-hero">
        <div>
          <h1 className="page-hero__h">{L(['Menü Yönetimi', 'Menu Management'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              [
                'Tüm mekanların menü öğelerini, fiyatlarını ve etiketlerini yönetin.',
                'Manage menu items, prices and tags across all venues.',
              ],
              lang,
            )}
          </p>
        </div>
        <div className="page-hero__actions">
          <Link className="btn btn--primary" href={`${base}/menu/new`}>
            <Plus />
            {L(['Yeni Öğe', 'New Item'], lang)}
          </Link>
        </div>
      </div>

      <DiningSubnav hotelId={hotelId} active="menu" lang={lang} />

      <div className="tabbar dining-menu-tabbar">
        {categories.map((category, index) => (
          <button key={category} className={index === 0 ? 'tab active' : 'tab'} type="button">
            {category}
          </button>
        ))}
      </div>

      <div className="filterbar dining-menu-filterbar">
        <FilterChip
          icon={<UtensilsCrossed size={15} />}
          label={L(['Tüm Mekanlar', 'All Venues'], lang)}
        />
        <FilterChip icon={<Check size={15} />} label={L(['Durum', 'Availability'], lang)} />
        <div className="filterbar__spacer" />
        <label className="searchmini dining-menu-search">
          <Search size={15} />
          <input placeholder={L(['Menü öğesi ara…', 'Search menu items…'], lang)} />
        </label>
      </div>

      <section className="card dining-menu-card">
        <div className="card__body dining-menu-table-wrap">
          <table className="dining-menu-table table">
            <thead>
              <tr>
                <th>{L(['Öğe', 'Item'], lang)}</th>
                <th>{L(['Kategori', 'Category'], lang)}</th>
                <th>{L(['Mekan', 'Venue'], lang)}</th>
                <th>{L(['Fiyat', 'Price'], lang)}</th>
                <th>{L(['Durum', 'Availability'], lang)}</th>
                <th>{L(['Etiketler', 'Tags'], lang)}</th>
                <th>{L(['İşlemler', 'Actions'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {MENU_ITEMS.map((item) => (
                <MenuRow
                  key={`${item.category}-${item.price}`}
                  item={item}
                  lang={lang}
                  base={base}
                />
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
