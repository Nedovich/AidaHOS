'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import type { Loc } from '@aidahos/db/portal-config';
import { useLang } from '@/components/console/lang-provider';
import { L } from '@/lib/i18n';
import { createLocationAction, updateLocationAction } from '@/app/(hotel)/h/[hotelId]/events/actions';
import { LocInput } from './loc-input';

/** Add/edit a location for a specific hotel. `consoleHotelId` = the hotel in the URL (for
 * auth); `hotelId` = the hotel the location belongs to (same group). Pass `location` to edit. */
export function AddLocationModal({ consoleHotelId, hotelId, onClose, onAdded, location }: { consoleHotelId: string; hotelId: string; onClose: () => void; onAdded?: () => void; location?: { id: string; name: Loc } }) {
  const lang = useLang();
  const editing = !!location;
  const [name, setName] = useState<Loc>(location?.name ?? {});
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
      if (editing) await updateLocationAction(consoleHotelId, hotelId, location!.id, { name });
      else await createLocationAction(consoleHotelId, hotelId, { name });
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
          <div className="modal__ico" style={{ background: 'color-mix(in srgb, var(--accent) 14%, transparent)', color: 'var(--accent)' }}><MapPin size={20} /></div>
          <div>
            <div className="modal__title">{editing ? L(['Lokasyonu düzenle', 'Edit location'], lang) : L(['Lokasyon ekle', 'Add location'], lang)}</div>
            <div className="modal__sub">{L(['Bu otele bağlı bir etkinlik lokasyonu.', 'An event location bound to this hotel.'], lang)}</div>
          </div>
        </div>
        <div className="modal__body">
          <label className="flabel" style={{ display: 'block', marginBottom: 6 }}>{L(['İsim (dile göre)', 'Name (per language)'], lang)}</label>
          <LocInput value={name} onChange={setName} placeholder={L(['ör. Ana Havuz', 'e.g. Main Pool'], lang)} />
        </div>
        <div className="modal__foot">
          <button type="button" className="btn btn--ghost" onClick={onClose}>{L(['Vazgeç', 'Cancel'], lang)}</button>
          <button type="button" className="btn btn--primary" onClick={submit} disabled={!valid || busy}>{busy ? L(['Kaydediliyor…', 'Saving…'], lang) : editing ? L(['Kaydet', 'Save'], lang) : L(['Ekle', 'Add'], lang)}</button>
        </div>
      </div>
    </div>
  );
}
