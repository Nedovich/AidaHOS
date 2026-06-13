'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { resolveLoc, type Loc, type PortalLang } from '@aidahos/db/portal-config';
import { useLang } from '@/components/console/lang-provider';
import { L } from '@/lib/i18n';
import { deleteCategoryAction } from '@/app/(hotel)/h/[hotelId]/events/actions';
import { AddCategoryModal } from './add-category-modal';

export function CategoryManager({ consoleHotelId, categories }: { consoleHotelId: string; categories: { id: string; name: Loc; color: string }[] }) {
  const lang = useLang();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editCat, setEditCat] = useState<{ id: string; name: Loc; color: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const rl = (l: Loc) => resolveLoc(l, lang as PortalLang, 'en');

  const remove = async (id: string) => {
    if (busy) return;
    if (!confirm(L(['Bu kategori silinsin mi?', 'Delete this category?'], lang))) return;
    setBusy(id);
    try { await deleteCategoryAction(consoleHotelId, id); router.refresh(); } finally { setBusy(null); }
  };

  return (
    <div className="card">
      <div className="card__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="card__title">{L(['Etkinlik kategorileri', 'Event categories'], lang)}</div>
        <button className="btn btn--primary btn--sm" type="button" onClick={() => setShowAdd(true)}><Plus size={15} />{L(['Kategori ekle', 'Add category'], lang)}</button>
      </div>
      <div className="card__body">
        {categories.length === 0 ? (
          <div style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)', padding: '8px 0' }}>{L(['Henüz kategori yok. Eklemek için “Kategori ekle”.', 'No categories yet. Use “Add category”.'], lang)}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {categories.map((c) => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                <span style={{ width: 14, height: 14, borderRadius: 4, background: c.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 600 }}>{rl(c.name)}</span>
                <button className="btn btn--subtle btn--sm" type="button" onClick={() => setEditCat(c)} title={L(['Düzenle', 'Edit'], lang)}><Pencil size={14} /></button>
                <button className="btn btn--subtle btn--sm" style={{ color: 'var(--danger)' }} type="button" onClick={() => remove(c.id)} disabled={busy === c.id} title={L(['Sil', 'Delete'], lang)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      {(showAdd || editCat) && (
        <AddCategoryModal
          hotelId={consoleHotelId}
          category={editCat ?? undefined}
          onClose={() => { setShowAdd(false); setEditCat(null); }}
          onAdded={() => router.refresh()}
        />
      )}
    </div>
  );
}
