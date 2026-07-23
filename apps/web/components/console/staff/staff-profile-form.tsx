'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import {
  Check,
  Clock3,
  Cpu,
  KeyRound,
  Power,
  Trash2,
  Users,
} from 'lucide-react';
import { Subhero } from '@/components/console/survey-helpers';
import { L, type Lang } from '@/lib/i18n';
import type { HotspotProfile } from '@/lib/mikrotik';
import {
  createStaffProfileAction,
  updateStaffProfileAction,
  deleteStaffProfileAction,
} from '@/app/(hotel)/h/[hotelId]/staff/actions';

function displayValue(value: string, fallback: string) {
  return value.trim() || fallback;
}

function buildRateLimit(rx: string, tx: string, editing: boolean, unlimited: string) {
  if (editing) {
    return rx.trim() && tx.trim() ? `${rx.trim()}/${tx.trim()}` : unlimited;
  }
  return `${displayValue(rx, '5M')}/${displayValue(tx, '5M')}`;
}

function parseRateLimit(rateLimit: string) {
  if (!rateLimit) return { rx: '', tx: '' };
  const parts = rateLimit.split('/');
  return { rx: parts[0] ?? '', tx: parts[1] ?? '' };
}

type StaffProfileFormProps = {
  hotelId: string;
  lang: Lang;
  profile?: HotspotProfile;
};

export function StaffProfileForm({ hotelId, lang, profile }: StaffProfileFormProps) {
  const profilesHref = `/h/${hotelId}/staff/profiles`;
  const editing = Boolean(profile);
  const parsed = parseRateLimit(profile?.rateLimit ?? '');

  const [name, setName] = useState(profile?.name ?? '');
  const [sharedUsers, setSharedUsers] = useState(String(profile?.sharedUsers ?? 1));
  const [rxRate, setRxRate] = useState(parsed.rx);
  const [txRate, setTxRate] = useState(parsed.tx);
  const [sessionTimeout, setSessionTimeout] = useState('');
  const [idleTimeout, setIdleTimeout] = useState('');
  const [macCookie, setMacCookie] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const unlimited = L(['sınırsız', 'unlimited'], lang);
  const previewName = displayValue(name, L(['Yeni Profil', 'New Profile'], lang));
  const previewSharedUsers = displayValue(sharedUsers, '1');
  const previewRate = buildRateLimit(rxRate, txRate, editing, unlimited);
  const previewSession = displayValue(sessionTimeout, L(['yok', 'none'], lang));
  const previewIdle = displayValue(idleTimeout, L(['yok', 'none'], lang));
  const saveLabel = editing
    ? L(['Değişiklikleri Kaydet', 'Save Changes'], lang)
    : L(['Profili Kaydet', 'Save Profile'], lang);

  const rateLimit = rxRate.trim() && txRate.trim() ? `${rxRate.trim()}/${txRate.trim()}` : '';

  function handleSave() {
    if (!name.trim()) {
      setError(L(['Profil adı gerekli.', 'Profile name is required.'], lang));
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        const input = {
          name: name.trim(),
          rateLimit,
          sharedUsers: Number(sharedUsers) || 1,
        };
        if (editing && profile) {
          await updateStaffProfileAction(hotelId, profile.id, input);
        } else {
          await createStaffProfileAction(hotelId, input);
        }
      } catch (e) {
        const msg = (e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT') ? null : String(e);
        if (msg) setError(msg);
      }
    });
  }

  function handleDelete() {
    if (!profile) return;
    startTransition(async () => {
      try {
        await deleteStaffProfileAction(hotelId, profile.id);
      } catch (e) {
        const msg = (e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT') ? null : String(e);
        if (msg) setError(msg);
      }
    });
  }

  return (
    <div className="staff-account-create staff-profile-create fade-in">
      <Subhero
        backHref={profilesHref}
        title={editing ? L(['Profili Düzenle', 'Edit Profile'], lang) : L(['Yeni Profil Oluştur', 'Create New Profile'], lang)}
        sub={editing ? L([
          'Bu hotspot kullanıcı profilinin bant genişliği ve zaman aşımı kurallarını güncelleyin.',
          'Update bandwidth and timeout rules for this hotspot user profile.',
        ], lang) : L([
          'Hotspot kullanıcı profili için bant genişliği ve zaman aşımı kurallarını tanımlayın.',
          'Define bandwidth and timeout rules for a hotspot user profile.',
        ], lang)}
        actions={
          <div className="staff-create-actions">
            <Link className="btn btn--ghost" href={profilesHref}>{L(['İptal', 'Cancel'], lang)}</Link>
            <button type="button" className="btn btn--primary" onClick={handleSave} disabled={isPending}>
              <Check size={16} />{isPending ? L(['Kaydediliyor…', 'Saving…'], lang) : saveLabel}
            </button>
          </div>
        }
      />

      {error && (
        <div style={{ padding: '10px 16px', background: 'color-mix(in srgb, var(--err) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--err) 20%, transparent)', borderRadius: 'var(--r-md)', color: 'var(--err)', fontSize: 13, marginBottom: 12 }}>
          {error}
        </div>
      )}

      <div className="staff-create-grid">
        <div className="card staff-create-form-card">
          <section className="form-sec">
            <h2 className="form-sec__t">{L(['Profil Bilgileri', 'Profile Information'], lang)}</h2>
            <p className="form-sec__d">{L(['Profilin adı ve eşzamanlı kullanıcı limiti.', "The profile's name and concurrent user limit."], lang)}</p>
            <div className="fgrid staff-profile-form-grid">
              <div>
                <label className="flabel" htmlFor="staff-profile-name">{L(['Ad', 'Name'], lang)}</label>
                <input id="staff-profile-name" className="finput" value={name} onChange={(e) => setName(e.target.value)} placeholder={L(['ör. Resepsiyon', 'e.g. Front Desk'], lang)} />
              </div>
              <div>
                <label className="flabel" htmlFor="staff-shared-users">{L(['Ortak Kullanıcı Sayısı', 'Shared Users'], lang)}</label>
                <input id="staff-shared-users" className="finput mono" type="number" min="1" value={sharedUsers} onChange={(e) => setSharedUsers(e.target.value)} />
              </div>
            </div>
          </section>

          <section className="form-sec">
            <h2 className="form-sec__t">{L(['Bant Genişliği', 'Bandwidth'], lang)}</h2>
            <p className="form-sec__d">{L(['İndirme/yükleme hız sınırı (rx/tx).', 'Download/upload rate limit (rx/tx).'], lang)}</p>
            <div className="fgrid staff-profile-form-grid">
              <div>
                <label className="flabel" htmlFor="staff-rx-rate">{L(['Alış Hızı (rx)', 'Rx Rate'], lang)}</label>
                <input id="staff-rx-rate" className="finput mono" value={rxRate} onChange={(e) => setRxRate(e.target.value)} placeholder={editing ? unlimited : '5M'} />
              </div>
              <div>
                <label className="flabel" htmlFor="staff-tx-rate">{L(['Gönderiş Hızı (tx)', 'Tx Rate'], lang)}</label>
                <input id="staff-tx-rate" className="finput mono" value={txRate} onChange={(e) => setTxRate(e.target.value)} placeholder={editing ? unlimited : '5M'} />
              </div>
            </div>
          </section>

          <section className="form-sec">
            <h2 className="form-sec__t">{L(['Zaman Aşımları', 'Timeouts'], lang)}</h2>
            <p className="form-sec__d">{L(['Oturum ve boşta kalma süresi sınırları.', 'Session and idle time limits.'], lang)}</p>
            <div className="fgrid staff-profile-form-grid">
              <div>
                <label className="flabel" htmlFor="staff-session-timeout">{L(['Oturum Zaman Aşımı', 'Session Timeout'], lang)}</label>
                <input id="staff-session-timeout" className="finput mono" value={sessionTimeout} onChange={(e) => setSessionTimeout(e.target.value)} placeholder={L(['sınırsız', 'unlimited'], lang)} />
                <p className="finput-hint">{L(['ör. 8h, 30m, 1h30m, 1d — boş = sınırsız', 'e.g. 8h, 30m, 1h30m, 1d — empty = unlimited'], lang)}</p>
              </div>
              <div>
                <label className="flabel" htmlFor="staff-idle-timeout">{L(['Boşta Kalma Zaman Aşımı', 'Idle Timeout'], lang)}</label>
                <input id="staff-idle-timeout" className="finput mono" value={idleTimeout} onChange={(e) => setIdleTimeout(e.target.value)} placeholder={L(['sınırsız', 'unlimited'], lang)} />
                <p className="finput-hint">{L(['ör. 10m, 1h — boş = sınırsız', 'e.g. 10m, 1h — empty = unlimited'], lang)}</p>
              </div>
            </div>
          </section>

          <section className="form-sec staff-mac-section">
            <h2 className="form-sec__t">{L(['MAC Çerezi', 'MAC Cookie'], lang)}</h2>
            <p className="form-sec__d">{L(['Cihaz tekrar giriş yapmadan tanınsın mı?', 'Let devices skip re-login via a MAC cookie?'], lang)}</p>
            <div className="staff-mac-row">
              <div>
                <div className="staff-mac-row__title">{L(['MAC Çerezi Ekle', 'Add MAC Cookie'], lang)}</div>
                <div className="staff-mac-row__description">{L([
                  'Etkinse cihaz, çerez süresince yeniden giriş istenmeden tanınır.',
                  "When on, the device is recognized without re-login for the cookie's duration.",
                ], lang)}</div>
              </div>
              <button type="button" className={`switch${macCookie ? ' on' : ''}`} onClick={() => setMacCookie((v) => !v)} aria-pressed={macCookie} aria-label={L(['MAC Çerezini Değiştir', 'Toggle MAC Cookie'], lang)} />
            </div>
          </section>
        </div>

        <div className="staff-profile-side">
          <aside className="card staff-preview-card staff-profile-preview-card">
            <div className="card__body">
              <h2 className="card__title">{L(['Önizleme', 'Preview'], lang)}</h2>
              <div className="staff-profile-card__top staff-profile-preview-heading">
                <div className="staff-profile-card__icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}><KeyRound size={17} /></div>
                <div>
                  <div className="staff-profile-card__name">{previewName}</div>
                </div>
              </div>
              <div className="divider" />
              <div className="stat-row"><span className="stat-row__k"><Users size={15} />{L(['Ortak Kullanıcı', 'Shared Users'], lang)}</span><span className="stat-row__v mono">{previewSharedUsers}</span></div>
              <div className="stat-row"><span className="stat-row__k"><Cpu size={15} />{L(['Hız Sınırı', 'Rate Limit'], lang)}</span><span className="stat-row__v mono">{previewRate}</span></div>
              <div className="stat-row"><span className="stat-row__k"><Clock3 size={15} />{L(['Oturum', 'Session'], lang)}</span><span className="stat-row__v">{previewSession}</span></div>
              <div className="stat-row"><span className="stat-row__k"><Power size={15} />{L(['Boşta Kalma', 'Idle'], lang)}</span><span className="stat-row__v">{previewIdle}</span></div>
              <div className="stat-row"><span className="stat-row__k"><KeyRound size={15} />{L(['MAC Çerezi', 'MAC Cookie'], lang)}</span><span className="stat-row__v">{macCookie ? L(['Açık', 'On'], lang) : L(['Kapalı', 'Off'], lang)}</span></div>
              <button type="button" className="btn btn--primary staff-preview-primary" onClick={handleSave} disabled={isPending}>
                <Check size={16} />{isPending ? L(['Kaydediliyor…', 'Saving…'], lang) : saveLabel}
              </button>
            </div>
          </aside>

          {editing && (
            <section className="card staff-profile-danger">
              <div className="card__body">
                <h2 className="staff-profile-danger__title">{L(['Tehlikeli Bölge', 'Danger Zone'], lang)}</h2>
                <p className="staff-profile-danger__sub">{L(['Bu profili kullanan hesapları etkiler.', 'Affects accounts using this profile.'], lang)}</p>
                <div className="staff-profile-danger__body">
                  <div className="staff-profile-danger__label">{L(['Profili sil', 'Delete profile'], lang)}</div>
                  <p className="staff-profile-danger__description">{L(['Bu profili kullanan hesaplar varsayılan profile taşınır.', 'Accounts on this profile move to the default profile.'], lang)}</p>
                  {confirmDelete ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn--danger btn--sm" onClick={handleDelete} disabled={isPending}>
                        <Trash2 size={14} />{isPending ? L(['Siliniyor…', 'Deleting…'], lang) : L(['Evet, Sil', 'Yes, Delete'], lang)}
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(false)}>
                        {L(['Vazgeç', 'Cancel'], lang)}
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="btn btn--dangerghost staff-profile-danger__button" onClick={() => setConfirmDelete(true)}>
                      <Trash2 size={14} />{L(['Sil', 'Delete'], lang)}
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
