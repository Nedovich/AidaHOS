'use client';

import { useEffect, useState } from 'react';
import { Tag } from 'lucide-react';
import type { Loc } from '@aidahos/db/portal-config';
import { useLang } from '@/components/console/lang-provider';
import { L } from '@/lib/i18n';
import { createCategoryAction, updateCategoryAction } from '@/app/(hotel)/h/[hotelId]/events/actions';
import { LocInput } from './loc-input';

const COLORS = ['#7C5CFC', '#3B82F6', '#16A34A', '#14B8A6', '#D97706', '#DC2626', '#DB2777', '#0EA5E9'];

export function AddCategoryModal({ hotelId, onClose, onAdded, category }: { hotelId: string; onClose: () => void; onAdded?: () => void; category?: { id: string; name: Loc; color: string } }) {
  const lang = useLang();
  const editing = !!category;
  const [name, setName] = useState<Loc>(category?.name ?? {});
  const [color, setColor] = useState<string>(category?.color ?? COLORS[0]!);
  const [busy, setBusy] = useState(false);
  const valid = !!(name.en || name.tr || name.de || name.ru);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try {
      if (editing) await updateCategoryAction(hotelId, category!.id, { name, color });
      else await createCategoryAction(hotelId, { name, color });
      onAdded?.();
      onClose();
    } catch {
      setBusy(false);
      alert(L(['Kaydedilemedi. Tekrar deneyin.', 'Could not save. Please try again.'], lang));
    }
  };

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="modal__head">
          <div className="modal__ico" style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}><Tag size={20} /></div>
          <div>
            <div className="modal__title">{editing ? L(['Kategoriyi düzenle', 'Edit category'], lang) : L(['Kategori ekle', 'Add category'], lang)}</div>
            <div className="modal__sub">{L(['Etkinlik kategorisi grup genelinde kullanılır.', 'An event category, shared across the group.'], lang)}</div>
          </div>
        </div>
        <div className="modal__body">
          <label className="flabel" style={{ display: 'block', marginBottom: 6 }}>{L(['İsim (dile göre)', 'Name (per language)'], lang)}</label>
          <LocInput value={name} onChange={setName} placeholder={L(['ör. Spor', 'e.g. Sports'], lang)} />
          <label className="flabel" style={{ display: 'block', margin: '14px 0 6px' }}>{L(['Renk', 'Color'], lang)}</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} aria-label={c} style={{ width: 28, height: 28, borderRadius: 8, background: c, border: c === color ? '2px solid var(--text)' : '2px solid transparent', cursor: 'pointer' }} />
            ))}
          </div>
        </div>
        <div className="modal__foot">
          <button type="button" className="btn btn--ghost" onClick={onClose}>{L(['Vazgeç', 'Cancel'], lang)}</button>
          <button type="button" className="btn btn--primary" onClick={submit} disabled={!valid || busy}>{busy ? L(['Kaydediliyor…', 'Saving…'], lang) : editing ? L(['Kaydet', 'Save'], lang) : L(['Ekle', 'Add'], lang)}</button>
        </div>
      </div>
    </div>
  );
}
