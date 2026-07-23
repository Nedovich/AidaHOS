'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { CalendarDays, Check, ChevronRight, KeyRound, Router, Users } from 'lucide-react';
import { Subhero } from '@/components/console/survey-helpers';
import { L, type Lang } from '@/lib/i18n';
import type { HotspotProfile } from '@/lib/mikrotik';
import type { StaffAccount } from '@aidahos/db';
import { createStaffUserAction, updateStaffUserAction, deleteStaffUserAction } from '@/app/(hotel)/h/[hotelId]/staff/actions';

const DEFAULT_STAFF_PASSWORD = '333';

function getInitials(name: string) {
  return name.split(' ').map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase() || 'ST';
}

type Props = {
  hotelId: string;
  lang: Lang;
  profiles: HotspotProfile[];
  user?: StaffAccount;
};

export function StaffAccountForm({ hotelId, lang, profiles, user }: Props) {
  const base = `/h/${hotelId}/staff`;
  const editing = Boolean(user);

  const [displayName, setDisplayName] = useState(user?.displayName ?? '');
  const [localUsername, setLocalUsername] = useState(user?.localUsername ?? '');
  const [password] = useState(DEFAULT_STAFF_PASSWORD);
  const [mikrotikGroup, setMikrotikGroup] = useState(user?.mikrotikGroup ?? profiles[0]?.name ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveLabel = editing ? L(['Değişiklikleri Kaydet', 'Save Changes'], lang) : L(['Hesabı Kaydet', 'Save Account'], lang);
  const previewName = displayName.trim() || L(['Ad Soyad', 'Full Name'], lang);

  function handleSave() {
    if (!displayName.trim()) { setError(L(['Ad Soyad gerekli.', 'Display name is required.'], lang)); return; }
    if (!localUsername.trim()) { setError(L(['Kullanıcı adı gerekli.', 'Username is required.'], lang)); return; }
    if (!mikrotikGroup) { setError(L(['Profil seçilmedi.', 'No profile selected.'], lang)); return; }
    setError(null);
    startTransition(async () => {
      try {
        if (editing && user) {
          await updateStaffUserAction(hotelId, user.radiusUsername, {
            displayName: displayName.trim(),
            password: password.trim() || undefined,
            mikrotikGroup,
          });
        } else {
          await createStaffUserAction(hotelId, {
            localUsername: localUsername.trim(),
            displayName: displayName.trim(),
            password: password.trim(),
            mikrotikGroup,
          });
        }
      } catch (e) {
        const msg = (e as { digest?: string })?.digest?.startsWith('NEXT_REDIRECT') ? null : String(e);
        if (msg) setError(msg);
      }
    });
  }

  function handleDelete() {
    if (!user) return;
    startTransition(async () => {
      try { await deleteStaffUserAction(hotelId, user.radiusUsername); } catch { /* redirect */ }
    });
  }

  const selectedProfile = profiles.find((p) => p.name === mikrotikGroup);

  return (
    <div className="staff-account-create fade-in">
      <Subhero
        backHref={base}
        crumb={
          <>
            <Link href={base}>{L(['Kullanıcılar', 'Users'], lang)}</Link>
            <ChevronRight size={13} />
            <b>{editing ? user?.displayName : L(['Yeni Hesap', 'New Account'], lang)}</b>
          </>
        }
        title={editing ? L(['Hesabı Düzenle', 'Edit Account'], lang) : L(['Yeni Hesap Oluştur', 'Create New Account'], lang)}
        sub={editing
          ? L(['Çalışanın internet erişim hesabını güncelleyin.', "Update the employee's internet access account."], lang)
          : L(['Otel çalışanı için yeni bir internet hesabı açın.', 'Open a new internet account for a hotel employee.'], lang)}
        actions={
          <div className="staff-create-actions">
            <Link className="btn btn--ghost" href={base}>{L(['İptal', 'Cancel'], lang)}</Link>
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
            <h2 className="form-sec__t">{L(['Kişisel Bilgiler', 'Personal Information'], lang)}</h2>
            <p className="form-sec__d">{L(['Çalışanın adı ve görünen ismi.', "The employee's name shown in the panel."], lang)}</p>
            <div className="fgrid staff-account-grid">
              <div>
                <label className="flabel" htmlFor="staff-display-name">{L(['Ad Soyad', 'Full Name'], lang)}</label>
                <input id="staff-display-name" className="finput" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={L(['ör. Mert Aydın', 'e.g. Mert Aydin'], lang)} />
              </div>
              <div>
                <label className="flabel" htmlFor="staff-local-username">{L(['Kullanıcı adı', 'Username'], lang)}</label>
                <input
                  id="staff-local-username"
                  className="finput mono"
                  value={localUsername}
                  onChange={(e) => setLocalUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                  placeholder="m.aydin"
                  disabled={editing}
                />
                {!editing && (
                  <p className="finput-hint">
                    {L(['FreeRADIUS kullanıcı adı: staff-{otelslug}-{bu değer}', 'FreeRADIUS username: staff-{hotelslug}-{this value}'], lang)}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="form-sec">
            <h2 className="form-sec__t">{L(['Ağ Profili', 'Network Profile'], lang)}</h2>
            <p className="form-sec__d">{L(['MikroTik hotspot profili — bant genişliği ve erişim kuralları.', 'MikroTik hotspot profile — bandwidth and access rules.'], lang)}</p>
            {profiles.length === 0 ? (
              <div style={{ padding: '12px 16px', background: 'var(--surface-raised)', borderRadius: 'var(--r-md)', fontSize: 13, color: 'var(--text-muted)' }}>
                {L(['Profil bulunamadı. MikroTik bağlantısını kontrol edin.', 'No profiles found. Check MikroTik connection.'], lang)}
              </div>
            ) : (
              <div className="seg-pills">
                {profiles.filter((p) => !p.isDefault).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className={`seg-pill${mikrotikGroup === p.name ? ' on' : ''}`}
                    onClick={() => setMikrotikGroup(p.name)}
                  >
                    <Router size={13} />
                    {p.name}
                    {p.rateLimit && <span className="cell-sub mono" style={{ fontSize: 11 }}>{p.rateLimit}</span>}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="staff-account-side">
          <aside className="card staff-preview-card">
            <div className="card__body">
              <h2 className="card__title">{L(['Önizleme', 'Preview'], lang)}</h2>
              <div className="set-mem staff-preview-person">
                <div className="set-mem__av staff-preview-avatar">{getInitials(previewName)}</div>
                <div>
                  <div className="set-mem__n">{previewName}</div>
                  <div className="cell-sub mono" style={{ fontSize: 11 }}>
                    {localUsername || L(['kullanıcı-adı', 'username'], lang)}
                  </div>
                </div>
              </div>
              <div className="divider" />
              <div className="stat-row">
                <span className="stat-row__k"><Users size={15} />{L(['Kullanıcı adı', 'Username'], lang)}</span>
                <span className="stat-row__v mono">{localUsername || '—'}</span>
              </div>
              <div className="stat-row">
                <span className="stat-row__k"><Router size={15} />{L(['Profil', 'Profile'], lang)}</span>
                <span className="stat-row__v">{mikrotikGroup || '—'}</span>
              </div>
              {selectedProfile?.rateLimit && (
                <div className="stat-row">
                  <span className="stat-row__k"><KeyRound size={15} />{L(['Hız Limiti', 'Rate Limit'], lang)}</span>
                  <span className="stat-row__v mono">{selectedProfile.rateLimit}</span>
                </div>
              )}
              <button type="button" className="btn btn--primary staff-preview-primary" onClick={handleSave} disabled={isPending}>
                <Check size={16} />{isPending ? L(['Kaydediliyor…', 'Saving…'], lang) : saveLabel}
              </button>
            </div>
          </aside>

          {editing && user && (
            <section className="card staff-account-danger">
              <div className="card__body">
                <h2 className="staff-account-danger__title">{L(['Tehlikeli Bölge', 'Danger Zone'], lang)}</h2>
                <p className="staff-account-danger__sub">{L(['Bu işlemler hesabın erişimini etkiler.', "These actions affect the account's access."], lang)}</p>
                <div className="staff-account-danger__action">
                  <div className="staff-account-danger__label">{L(['Hesabı sil', 'Delete account'], lang)}</div>
                  <p>{L(['FreeRADIUS\'tan kalıcı olarak kaldırır.', 'Permanently removes from FreeRADIUS.'], lang)}</p>
                  {confirmDelete ? (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="btn btn--danger btn--sm" onClick={handleDelete} disabled={isPending}>
                        {isPending ? L(['Siliniyor…', 'Deleting…'], lang) : L(['Evet, Sil', 'Yes, Delete'], lang)}
                      </button>
                      <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirmDelete(false)}>
                        {L(['Vazgeç', 'Cancel'], lang)}
                      </button>
                    </div>
                  ) : (
                    <button type="button" className="btn btn--dangerghost btn--sm" onClick={() => setConfirmDelete(true)}>
                      {L(['Sil', 'Delete'], lang)}
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

export function NewStaffAccountForm({ hotelId, lang, profiles }: { hotelId: string; lang: Lang; profiles: HotspotProfile[] }) {
  return <StaffAccountForm hotelId={hotelId} lang={lang} profiles={profiles} />;
}
