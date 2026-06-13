'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { resolveLoc, type Loc, type PortalLang } from '@aidahos/db/portal-config';
import { useLang } from '@/components/console/lang-provider';
import { L } from '@/lib/i18n';
import { deleteLocationAction } from '@/app/(hotel)/h/[hotelId]/events/actions';
import { AddLocationModal } from './add-location-modal';

export function LocationManager({ consoleHotelId, hotelId, locations }: { consoleHotelId: string; hotelId: string; locations: { id: string; name: Loc }[] }) {
  const lang = useLang();
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editLoc, setEditLoc] = useState<{ id: string; name: Loc } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const rl = (l: Loc) => resolveLoc(l, lang as PortalLang, 'en');

  const remove = async (id: string) => {
    if (busy) return;
    if (!confirm(L(['Bu lokasyon silinsin mi?', 'Delete this location?'], lang))) return;
    setBusy(id);
    try { await deleteLocationAction(consoleHotelId, hotelId, id); router.refresh(); } finally { setBusy(null); }
  };

  return (
    <div className="card">
      <div className="card__head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="card__title">{L(['Etkinlik lokasyonları', 'Event locations'], lang)}</div>
          <div className="card__sub">{L(['Bu otele bağlı; etkinlik oluştururken kullanılır.', 'Bound to this hotel; used when creating events.'], lang)}</div>
        </div>
        <button className="btn btn--primary btn--sm" type="button" onClick={() => setShowAdd(true)}><Plus size={15} />{L(['Lokasyon ekle', 'Add location'], lang)}</button>
      </div>
      <div className="card__body">
        {locations.length === 0 ? (
          <div style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)', padding: '8px 0' }}>{L(['Henüz lokasyon yok.', 'No locations yet.'], lang)}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {locations.map((l) => (
              <div key={l.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
                <MapPin size={15} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                <span style={{ flex: 1, fontWeight: 600 }}>{rl(l.name)}</span>
                <button className="btn btn--subtle btn--sm" type="button" onClick={() => setEditLoc(l)} title={L(['Düzenle', 'Edit'], lang)}><Pencil size={14} /></button>
                <button className="btn btn--subtle btn--sm" style={{ color: 'var(--danger)' }} type="button" onClick={() => remove(l.id)} disabled={busy === l.id} title={L(['Sil', 'Delete'], lang)}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
      {(showAdd || editLoc) && (
        <AddLocationModal
          consoleHotelId={consoleHotelId}
          hotelId={hotelId}
          location={editLoc ?? undefined}
          onClose={() => { setShowAdd(false); setEditLoc(null); }}
          onAdded={() => router.refresh()}
        />
      )}
    </div>
  );
}
