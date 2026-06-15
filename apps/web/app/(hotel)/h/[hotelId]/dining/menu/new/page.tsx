import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Coffee,
  Gift,
  ImageIcon,
  Plus,
  UtensilsCrossed,
  Wine,
} from 'lucide-react';
import { Subhero } from '@/components/console/survey-helpers';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

const CATEGORIES = [
  { label: ['Kahvaltı', 'Breakfast'] as const, icon: Coffee, active: false },
  { label: ['Öğle Yemeği', 'Lunch'] as const, icon: UtensilsCrossed, active: false },
  { label: ['Akşam Yemeği', 'Dinner'] as const, icon: UtensilsCrossed, active: true },
  { label: ['İçecekler', 'Drinks'] as const, icon: Wine, active: false },
  { label: ['Tatlılar', 'Desserts'] as const, icon: Gift, active: false },
  { label: ['Çocuk', 'Kids'] as const, icon: UtensilsCrossed, active: false },
] as const;

const TAGS = [
  { label: ['Vegan', 'Vegan'] as const, tone: 'veg', selected: false },
  { label: ['Acı', 'Spicy'] as const, tone: 'spicy', selected: false },
  { label: ['Yeni', 'New'] as const, tone: 'new', selected: false },
  { label: ['Glutensiz', 'Gluten-free'] as const, tone: 'veg', selected: false },
  { label: ['Şef seçimi', "Chef's pick"] as const, tone: 'chef', selected: false },
] as const;

const ALLERGENS = [
  { label: ['Gluten', 'Gluten'] as const, selected: true },
  { label: ['Süt', 'Dairy'] as const, selected: false },
  { label: ['Yumurta', 'Egg'] as const, selected: false },
  { label: ['Fıstık', 'Peanut'] as const, selected: false },
  { label: ['Deniz ürünü', 'Shellfish'] as const, selected: true },
  { label: ['Soya', 'Soy'] as const, selected: false },
] as const;

function SelectBox({ children }: { children: ReactNode }) {
  return (
    <div className="fselect">
      <span>{children}</span>
      <ChevronDown size={16} />
    </div>
  );
}

function CurrencyInput({ value }: { value: string }) {
  return (
    <div className="dining-menu-item-currency">
      <span>€</span>
      <input className="finput mono" defaultValue={value} />
    </div>
  );
}

function OptionRow({
  title,
  desc,
  enabled = true,
}: {
  title: ReactNode;
  desc?: ReactNode;
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

function EditableTag({
  children,
  tone,
  selected,
}: {
  children: ReactNode;
  tone?: string;
  selected: boolean;
}) {
  const classes = ['tag', 'dining-menu-item-edit-tag'];

  if (tone === 'veg') classes.push('tag--veg');
  if (tone === 'spicy') classes.push('tag--spicy');
  if (tone === 'new') classes.push('tag--new');
  if (tone === 'chef') classes.push('dining-menu-chef-pick');
  if (!selected) classes.push('is-muted');

  return (
    <span className={classes.join(' ')}>
      {selected ? <Check size={12} /> : <Plus size={12} />}
      {children}
    </span>
  );
}

function AllergenTag({ children, selected }: { children: ReactNode; selected: boolean }) {
  return (
    <span
      className={
        selected
          ? 'tag dining-menu-item-edit-tag dining-menu-allergen'
          : 'tag dining-menu-item-edit-tag dining-menu-item-edit-tag--plain'
      }
    >
      {selected ? <Check size={12} /> : <Plus size={12} />}
      {children}
    </span>
  );
}

export default async function NewDiningMenuItem({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/dining`;

  return (
    <div className="dining-menu-item-form fade-in">
      <Subhero
        backHref={`${base}/menu`}
        crumb={
          <>
            <Link href={`${base}/menu`}>{L(['Menü', 'Menu'], lang)}</Link>
            <ChevronRight size={15} />
            <b>{L(['Yeni Öğe', 'New Item'], lang)}</b>
          </>
        }
        title={L(['Yeni Menü Öğesi', 'New Menu Item'], lang)}
        sub={L(
          ['Menüye yeni bir yemek veya içecek ekleyin.', 'Add a new dish or drink to the menu.'],
          lang,
        )}
        actions={
          <div className="page-hero__actions">
            <Link className="btn btn--ghost" href={`${base}/menu`}>
              {L(['İptal', 'Cancel'], lang)}
            </Link>
            <Link className="btn btn--primary" href={`${base}/menu`}>
              <Check />
              {L(['Öğeyi Kaydet', 'Save Item'], lang)}
            </Link>
          </div>
        }
      />

      <div className="dining-menu-item-form-grid">
        <div className="card dining-menu-item-form-main">
          <section className="form-sec">
            <div className="form-sec__t">{L(['Temel Bilgiler', 'Basic Information'], lang)}</div>
            <div className="dining-form-stack">
              <div>
                <label className="flabel">{L(['Öğe adı', 'Item name'], lang)}</label>
                <input
                  className="finput"
                  placeholder={L(['ör. Izgara Levrek', 'e.g. Grilled Sea Bass'], lang)}
                />
              </div>
              <div>
                <label className="flabel">{L(['Açıklama', 'Description'], lang)}</label>
                <textarea
                  className="ftextarea dining-menu-item-description"
                  placeholder={L(
                    ['Menüde görünecek açıklama…', 'Description shown on the menu…'],
                    lang,
                  )}
                />
              </div>
              <div className="fgrid">
                <div>
                  <label className="flabel">{L(['Mekan', 'Venue'], lang)}</label>
                  <SelectBox>A&apos;la Carte</SelectBox>
                </div>
                <div>
                  <label className="flabel">{L(['Hazırlık süresi', 'Prep time'], lang)}</label>
                  <SelectBox>25 {L(['dk', 'min'], lang)}</SelectBox>
                </div>
              </div>
            </div>
          </section>

          <section className="form-sec">
            <div className="form-sec__t">{L(['Kategori', 'Category'], lang)}</div>
            <div className="seg-pills dining-menu-item-categories">
              {CATEGORIES.map((category) => {
                const Icon = category.icon;
                return (
                  <div
                    key={category.label[1]}
                    className={category.active ? 'seg-pill on' : 'seg-pill'}
                  >
                    <Icon size={15} />
                    {L(category.label, lang)}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="form-sec">
            <div className="form-sec__t">{L(['Fiyatlandırma', 'Pricing'], lang)}</div>
            <div className="fgrid">
              <div>
                <label className="flabel">{L(['Satış fiyatı', 'Sale price'], lang)}</label>
                <CurrencyInput value="0" />
              </div>
              <div>
                <label className="flabel">{L(['Maliyet', 'Cost'], lang)}</label>
                <CurrencyInput value="12.50" />
              </div>
              <div>
                <label className="flabel">KDV</label>
                <SelectBox>10%</SelectBox>
              </div>
              <div>
                <label className="flabel">{L(['Kalori', 'Calories'], lang)}</label>
                <input className="finput mono" defaultValue="420" />
              </div>
            </div>
          </section>

          <section className="form-sec">
            <div className="form-sec__t">
              {L(['Etiketler & Alerjenler', 'Tags & Allergens'], lang)}
            </div>
            <label className="flabel">{L(['Etiketler', 'Tags'], lang)}</label>
            <div className="tagrow dining-menu-item-edit-tags">
              {TAGS.map((tag) => (
                <EditableTag key={tag.label[1]} tone={tag.tone} selected={tag.selected}>
                  {L(tag.label, lang)}
                </EditableTag>
              ))}
            </div>
            <label className="flabel">{L(['Alerjenler', 'Allergens'], lang)}</label>
            <div className="tagrow dining-menu-item-edit-tags">
              {ALLERGENS.map((allergen) => (
                <AllergenTag key={allergen.label[1]} selected={allergen.selected}>
                  {L(allergen.label, lang)}
                </AllergenTag>
              ))}
            </div>
          </section>
        </div>

        <aside className="dining-menu-item-form-side">
          <section className="card">
            <div className="card__body">
              <label className="flabel">{L(['Öğe görseli', 'Item image'], lang)}</label>
              <div className="cover-drop dining-menu-item-drop">
                <ImageIcon size={26} />
                <div className="dining-cover-drop-title">
                  {L(['Görsel sürükleyin veya seçin', 'Drag or choose an image'], lang)}
                </div>
                <div className="cell-sub">
                  {L(['PNG, JPG · 4:3 önerilir', 'PNG, JPG · 4:3 recommended'], lang)}
                </div>
              </div>
            </div>
          </section>

          <section className="card">
            <div className="card__body">
              <label className="flabel">{L(['Durum', 'Status'], lang)}</label>
              <SelectBox>{L(['Yayında', 'Published'], lang)}</SelectBox>
              <div className="divider" />
              <OptionRow
                title={L(['Stokta', 'Available'], lang)}
                desc={L(
                  ['Menüde aktif olarak görünür.', 'Visible as available on the menu.'],
                  lang,
                )}
              />
              <OptionRow
                title={L(['Şefin önerisi', "Chef's recommendation"], lang)}
                enabled={false}
              />
              <OptionRow title={L(['Misafir portalında göster', 'Show on guest portal'], lang)} />
              <Link className="btn btn--primary dining-menu-item-save" href={`${base}/menu`}>
                <Check />
                {L(['Öğeyi Kaydet', 'Save Item'], lang)}
              </Link>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
