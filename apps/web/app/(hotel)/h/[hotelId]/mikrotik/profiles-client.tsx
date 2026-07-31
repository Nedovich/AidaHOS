'use client';

import React, { useState } from 'react';
import { Check, Pencil, Plus, Router, Trash2, Wifi, X } from 'lucide-react';
import type { HotspotProfile } from '@/lib/mikrotik';
import {
  createProfileAction,
  deleteProfileAction,
  updateProfileAction,
} from './actions';

// Common rate-limit presets
const PRESETS = ['2M/2M', '5M/5M', '10M/10M', '20M/20M', '50M/50M', '100M/100M'];

function ProfileForm({
  hotelId,
  initial,
  onDone,
  onCancel,
}: {
  hotelId: string;
  initial?: HotspotProfile;
  onDone: (p: HotspotProfile) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [rateLimit, setRateLimit] = useState(initial?.rateLimit ?? '10M/10M');
  const [sharedUsers, setSharedUsers] = useState(String(initial?.sharedUsers ?? 1));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!name.trim() || !rateLimit.trim()) return;
    setSaving(true);
    setError('');
    try {
      let profile: HotspotProfile;
      if (initial) {
        profile = await updateProfileAction(hotelId, initial.id, {
          name: name.trim(),
          rateLimit: rateLimit.trim(),
          sharedUsers: Number(sharedUsers) || 1,
        });
      } else {
        profile = await createProfileAction(hotelId, {
          name: name.trim(),
          rateLimit: rateLimit.trim(),
          sharedUsers: Number(sharedUsers) || 1,
        });
      }
      onDone(profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Bir hata oluştu');
    } finally {
      setSaving(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)',
    background: 'var(--surface)',
    color: 'var(--text)',
    padding: '8px 12px',
    font: 'inherit',
    fontSize: 14,
    outline: 'none',
    width: '100%',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, alignItems: 'end' }}>
        <div>
          <label className="flabel">Profil adı</label>
          <input
            style={inputStyle}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ör. personel, misafir-10M"
            disabled={saving}
          />
        </div>
        <div>
          <label className="flabel">Hız limiti (upload/download)</label>
          <div style={{ display: 'flex', gap: 6 }}>
            <select
              style={{ ...inputStyle, width: 'auto', flex: 1 }}
              value={PRESETS.includes(rateLimit) ? rateLimit : ''}
              onChange={(e) => { if (e.target.value) setRateLimit(e.target.value); }}
              disabled={saving}
            >
              <option value="">Manuel gir…</option>
              {PRESETS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            <input
              style={{ ...inputStyle, width: 110 }}
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
              placeholder="10M/10M"
              disabled={saving}
            />
          </div>
        </div>
        <div>
          <label className="flabel">Eş zamanlı kullanıcı</label>
          <input
            style={{ ...inputStyle, width: 80 }}
            type="number"
            min={1}
            value={sharedUsers}
            onChange={(e) => setSharedUsers(e.target.value)}
            disabled={saving}
          />
        </div>
      </div>
      {error && (
        <div style={{ color: 'var(--err)', fontSize: 13, padding: '6px 10px', background: 'color-mix(in srgb, var(--err) 10%, transparent)', borderRadius: 'var(--r-sm)' }}>
          {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          className="btn btn--primary btn--sm"
          type="button"
          disabled={saving || !name.trim() || !rateLimit.trim()}
          onClick={submit}
        >
          <Check size={14} />
          {saving ? 'Kaydediliyor…' : initial ? 'Güncelle' : 'Oluştur'}
        </button>
        <button className="btn btn--ghost btn--sm" type="button" onClick={onCancel} disabled={saving}>
          <X size={14} />
          İptal
        </button>
      </div>
    </div>
  );
}

export function ProfilesClient({
  hotelId,
  initial,
}: {
  hotelId: string;
  initial: HotspotProfile[];
}) {
  const [profiles, setProfiles] = useState<HotspotProfile[]>(initial);
  const [adding, setAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function handleCreated(p: HotspotProfile) {
    setProfiles((prev) => [...prev, p]);
    setAdding(false);
  }

  function handleUpdated(p: HotspotProfile) {
    setProfiles((prev) => prev.map((x) => (x.id === p.id ? p : x)));
    setEditingId(null);
  }

  async function handleDelete(mtId: string) {
    setDeletingId(mtId);
    try {
      await deleteProfileAction(hotelId, mtId);
      setProfiles((prev) => prev.filter((x) => x.id !== mtId));
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Silinemedi');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '20px 24px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Hotspot Kullanıcı Profilleri</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            MikroTik üzerindeki profiller — hız limiti ve eş zamanlı bağlantı sayısı burada belirlenir.
          </div>
        </div>
        {!adding && (
          <button className="btn btn--primary btn--sm" type="button" onClick={() => setAdding(true)}>
            <Plus size={14} />
            Yeni Profil
          </button>
        )}
      </div>

      {adding && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', background: 'color-mix(in srgb, var(--accent) 4%, transparent)' }}>
          <ProfileForm
            hotelId={hotelId}
            onDone={handleCreated}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {profiles.length === 0 && !adding ? (
        <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Wifi size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div>Henüz profil yok</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>MikroTik üzerinde hiç hotspot kullanıcı profili bulunamadı.</div>
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Profil adı', 'Hız limiti', 'Eş zamanlı', ''].map((h) => (
                <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <React.Fragment key={p.id}>
                <tr
                  style={{ borderBottom: editingId === p.id ? 'none' : '1px solid var(--border-subtle, var(--border))' }}
                >
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Router size={15} style={{ color: 'var(--text-muted)' }} />
                      <span style={{ fontWeight: 500 }}>{p.name}</span>
                      {p.isDefault && (
                        <span className="badge badge--mute" style={{ fontSize: 11, padding: '1px 6px' }}>varsayılan</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <span className="mono" style={{ fontSize: 13, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 'var(--r-sm)' }}>
                      {p.rateLimit || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 24px', color: 'var(--text-muted)', fontSize: 14 }}>
                    {p.sharedUsers}
                  </td>
                  <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
                      {!p.isDefault && (
                        <>
                          <button
                            className="btn btn--ghost btn--sm"
                            type="button"
                            onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                            disabled={!!deletingId}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn btn--ghost btn--sm"
                            type="button"
                            style={{ color: 'var(--err)' }}
                            disabled={deletingId === p.id}
                            onClick={() => {
                              if (confirm(`"${p.name}" profilini silmek istiyor musunuz?`)) {
                                void handleDelete(p.id);
                              }
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {editingId === p.id && (
                  <tr key={`${p.id}-edit`} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td colSpan={4} style={{ padding: '12px 24px', background: 'color-mix(in srgb, var(--accent) 4%, transparent)' }}>
                      <ProfileForm
                        hotelId={hotelId}
                        initial={p}
                        onDone={handleUpdated}
                        onCancel={() => setEditingId(null)}
                      />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
