import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  ClipboardList,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Eye,
  Pencil,
  Shield,
  Sparkles,
  Star,
  TrendingUp,
  UtensilsCrossed,
  Wine,
} from 'lucide-react';
import { Subhero } from '@/components/console/survey-helpers';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

const MONTHLY_SALES = [42, 38, 51, 47, 55, 62, 58, 64, 71, 68, 74, 82];

function SalesBars({ data }: { data: number[] }) {
  const max = Math.max(...data);

  return (
    <div className="dining-menu-sales-bars" aria-hidden="true">
      {data.map((value, index) => (
        <span
          key={`${value}-${index}`}
          className="dining-menu-sales-bar"
          style={{ height: `${Math.max(22, Math.round((value / max) * 100))}%` }}
        />
      ))}
    </div>
  );
}

function StatItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="cell-sub">{label}</div>
      <div className={mono ? 'dining-menu-detail-stat mono' : 'dining-menu-detail-stat'}>
        {value}
      </div>
    </div>
  );
}

function SideStat({
  icon,
  label,
  value,
  positive = false,
}: {
  icon: ReactNode;
  label: string;
  value: ReactNode;
  positive?: boolean;
}) {
  return (
    <div className="stat-row">
      <span className="stat-row__k">
        {icon}
        {label}
      </span>
      <span className="stat-row__v" style={positive ? { color: 'var(--success)' } : undefined}>
        {value}
      </span>
    </div>
  );
}

function Pairing({
  icon,
  color,
  title,
  subtitle,
}: {
  icon: ReactNode;
  color: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="dining-menu-pairing">
      <span className="mini-av dining-menu-pairing-icon" style={{ background: color }}>
        {icon}
      </span>
      <div>
        <div className="dining-menu-pairing-title">{title}</div>
        <div className="cell-sub">{subtitle}</div>
      </div>
    </div>
  );
}

export default async function DiningMenuItemDetail({
  params,
}: {
  params: Promise<{ hotelId: string; itemId: string }>;
}) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/dining`;
  const itemName = 'Izgara Levrek';
  const category = 'Akşam Yemeği';
  const venue = "A'la Carte";
  const price = '€32';

  return (
    <div className="dining-menu-detail fade-in">
      <Subhero
        backHref={`${base}/menu`}
        crumb={
          <>
            <Link href={`${base}/menu`}>{L(['Menü', 'Menu'], lang)}</Link>
            <ChevronRight size={15} />
            <b>{itemName}</b>
          </>
        }
        title={itemName}
        pill={
          <span className="catbadge dining-menu-detail-title-badge">
            {L(['Yeni', 'New'], lang)}
          </span>
        }
        sub={`${venue} · ${category} · ${price}`}
        actions={
          <div className="page-hero__actions">
            <button className="btn btn--ghost" type="button">
              <ExternalLink />
              {L(['Yazdır', 'Print'], lang)}
            </button>
            <Link className="btn btn--ghost" href={`${base}/menu/grilled-sea-bass/edit`}>
              <Pencil />
              {L(['Düzenle', 'Edit'], lang)}
            </Link>
            <button className="btn btn--primary" type="button">
              <Eye />
              {L(['Önizleme', 'Preview'], lang)}
            </button>
          </div>
        }
      />

      <div className="dining-menu-detail-grid">
        <div className="dining-menu-detail-main">
          <section className="card dining-menu-product-card">
            <div className="dining-menu-product-hero">
              <div className="dining-menu-product-tags">
                <span className="tag tag--new">
                  <Sparkles size={12} />
                  {L(['Yeni', 'New'], lang)}
                </span>
                <span className="tag dining-menu-chef-tag">
                  <Star size={12} />
                  {L(['Şef Önerisi', "Chef's Pick"], lang)}
                </span>
              </div>
              <div className="dining-menu-product-mark">
                <UtensilsCrossed size={34} />
              </div>
              <div className="dining-menu-product-copy">
                <div className="dining-menu-product-title">{itemName}</div>
                <div className="dining-menu-product-sub">
                  {category} · {venue}
                </div>
              </div>
            </div>
            <div className="card__body dining-menu-product-body">
              <p className="dining-menu-product-description">
                {L(
                  [
                    "Taze yakalanan Akdeniz levreği, fırınlanmış mevsim sebzeleri ve ev yapımı limon-zeytinyağı sosuyla servis edilir. Şef Andrea'nın imza tabağı.",
                    "Fresh Mediterranean sea bass served with roasted seasonal vegetables and house-made lemon-olive oil dressing. Chef Andrea's signature plate.",
                  ],
                  lang,
                )}
              </p>
              <div className="divider" />
              <div className="dining-menu-product-stats">
                <StatItem label={L(['Kategori', 'Category'], lang)} value={category} />
                <StatItem
                  label={L(['Hazırlık', 'Prep time'], lang)}
                  value={`25 ${L(['dk', 'min'], lang)}`}
                />
                <StatItem label={L(['Kalori', 'Calories'], lang)} value="420 kcal" mono />
                <StatItem label={L(['Porsiyon', 'Portion'], lang)} value="280 g" />
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__body dining-menu-tags-body">
              <div className="card__title">
                {L(['Etiketler & Alerjenler', 'Tags & Allergens'], lang)}
              </div>
              <div className="cell-sub dining-menu-tag-label">{L(['Etiketler', 'Tags'], lang)}</div>
              <div className="tagrow dining-menu-detail-tags">
                <span className="tag tag--new">{L(['Yeni', 'New'], lang)}</span>
                <span className="tag dining-menu-chef-pick">
                  {L(['Şef Seçimi', "Chef's Pick"], lang)}
                </span>
                <span className="tag tag--veg">{L(['Glutensiz', 'Gluten-free'], lang)}</span>
              </div>
              <div className="cell-sub dining-menu-tag-label">
                {L(['Alerjenler', 'Allergens'], lang)}
              </div>
              <div className="tagrow dining-menu-detail-tags">
                <span className="tag dining-menu-allergen">
                  <Shield size={12} />
                  {L(['Deniz ürünü', 'Shellfish'], lang)}
                </span>
                <span className="tag dining-menu-allergen">
                  <Shield size={12} />
                  {L(['Balık', 'Fish'], lang)}
                </span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__head">
              <div>
                <div className="card__title">
                  {L(['Satış Performansı', 'Sales Performance'], lang)}
                </div>
                <div className="card__sub">{L(['Son 12 ay', 'Last 12 months'], lang)}</div>
              </div>
              <span className="badge badge--ok">
                <span className="ico-dot" />
                {L(['Trend yukarı', 'Trending up'], lang)}
              </span>
            </div>
            <div className="card__body dining-menu-sales-body">
              <SalesBars data={MONTHLY_SALES} />
            </div>
          </section>
        </div>

        <aside className="dining-menu-detail-side">
          <section className="card dining-menu-price-card">
            <div className="card__body">
              <div className="cell-sub">{L(['Satış fiyatı', 'Sale price'], lang)}</div>
              <div className="dining-menu-price-value">{price}</div>
              <div className="cell-sub dining-menu-vat">{L(['KDV dahil', 'incl. VAT'], lang)}</div>
              <div className="divider" />
              <div className="stat-row">
                <span className="stat-row__k">{L(['Maliyet', 'Cost'], lang)}</span>
                <span className="stat-row__v">€12.50</span>
              </div>
              <div className="stat-row">
                <span className="stat-row__k">{L(['Kâr marjı', 'Margin'], lang)}</span>
                <span className="stat-row__v" style={{ color: 'var(--success)' }}>
                  61%
                </span>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__body">
              <div className="card__title dining-menu-side-title">
                {L(['Bu Ay', 'This Month'], lang)}
              </div>
              <SideStat
                icon={<ClipboardList size={16} />}
                label={L(['Sipariş', 'Orders'], lang)}
                value="82"
              />
              <SideStat
                icon={<CreditCard size={16} />}
                label={L(['Gelir', 'Revenue'], lang)}
                value="€2.624"
              />
              <SideStat
                icon={<Star size={16} />}
                label={L(['Misafir puanı', 'Guest rating'], lang)}
                value={
                  <>
                    4.7 <span className="dining-menu-rating-star">☆</span>
                  </>
                }
              />
              <SideStat
                icon={<TrendingUp size={16} />}
                label={L(['Aylık değişim', 'MoM change'], lang)}
                value="+12.4%"
                positive
              />
            </div>
          </section>

          <section className="card">
            <div className="card__body">
              <div className="card__title dining-menu-side-title">
                {L(['Yan Eşleştirmeler', 'Pairs Well With'], lang)}
              </div>
              <div className="dining-menu-pairings">
                <Pairing
                  icon={<Wine size={16} />}
                  color="var(--purple)"
                  title="Pinot Grigio 2023"
                  subtitle={`${L(['Beyaz şarap', 'White wine'], lang)} · €14`}
                />
                <Pairing
                  icon={<UtensilsCrossed size={16} />}
                  color="var(--success)"
                  title={L(['Akdeniz Salata', 'Mediterranean Salad'], lang)}
                  subtitle={`${L(['Başlangıç', 'Starter'], lang)} · €14`}
                />
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
