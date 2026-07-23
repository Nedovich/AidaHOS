'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronRight, LayoutGrid, List, Pencil, Plus, Router, Wifi } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import type { HotspotProfile } from '@/lib/mikrotik';
import { StaffSubnav } from './staff-subnav';

export function StaffProfiles({
  hotelId,
  lang,
  profiles,
  error,
}: {
  hotelId: string;
  lang: Lang;
  profiles: HotspotProfile[];
  error: string | null;
}) {
  const [view, setView] = useState<'cards' | 'list'>('cards');

  useEffect(() => {
    const saved = localStorage.getItem('staff-profileview');
    if (saved === 'cards' || saved === 'list') setView(saved);
  }, []);

  const changeView = (next: 'cards' | 'list') => {
    setView(next);
    localStorage.setItem('staff-profileview', next);
  };

  return (
    <div className="staff-profiles-page fade-in">
      <div className="page-hero staff-profiles-hero">
        <div>
          <h1 className="page-hero__h">{L(['Kullanıcı Profilleri', 'User Profiles'], lang)}</h1>
          <p className="page-hero__sub">
            {L(['MikroTik hotspot profilleri — bant genişliği ve oturum kurallarını buradan yönetin.', 'MikroTik hotspot profiles — manage bandwidth and session rules here.'], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          <Link className="btn btn--primary" href={`/h/${hotelId}/staff/profiles/new`}>
            <Plus size={16} />{L(['Yeni Profil', 'New Profile'], lang)}
          </Link>
        </div>
      </div>

      <StaffSubnav hotelId={hotelId} active="profiles" lang={lang} />

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'color-mix(in srgb, var(--err) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--err) 20%, transparent)', borderRadius: 'var(--r-md)', marginBottom: 16, color: 'var(--err)', fontSize: 14 }}>
          <AlertTriangle size={16} />
          <span>{L(['MikroTik bağlantı hatası:', 'MikroTik connection error:'], lang)} {error}</span>
        </div>
      )}

      {profiles.length === 0 && !error ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)' }}>
          <Wifi size={36} style={{ opacity: 0.25, marginBottom: 16 }} />
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{L(['Profil bulunamadı', 'No profiles found'], lang)}</div>
          <div style={{ fontSize: 13 }}>
            {L(['MikroTik bağlantısı yapılandırılmamış veya hiç profil yok.', 'MikroTik not configured or no profiles exist.'], lang)}
          </div>
          <Link href={`/h/${hotelId}/mikrotik`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, fontSize: 13, color: 'var(--accent)' }}>
            <Router size={14} />{L(['MikroTik ayarlarına git', 'Go to MikroTik settings'], lang)}
          </Link>
        </div>
      ) : profiles.length > 0 ? (
        <>
          <div className="staff-profile-viewbar">
            <div className="view-toggle" aria-label={L(['Görünüm', 'View'], lang)}>
              <button type="button" className={view === 'cards' ? 'on' : ''} onClick={() => changeView('cards')}>
                <LayoutGrid size={15} />{L(['Kart', 'Cards'], lang)}
              </button>
              <button type="button" className={view === 'list' ? 'on' : ''} onClick={() => changeView('list')}>
                <List size={15} />{L(['Liste', 'List'], lang)}
              </button>
            </div>
          </div>

          {view === 'cards' ? (
            <div className="staff-profile-grid">
              {profiles.map((profile) => (
                <article className="staff-profile-card" key={profile.id}>
                  <div className="staff-profile-card__top">
                    <div className="staff-profile-card__icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                      <Router size={17} />
                    </div>
                    <div>
                      <h2 className="staff-profile-card__name">{profile.name}</h2>
                      {profile.isDefault && (
                        <span className="badge badge--mute" style={{ fontSize: 11 }}>{L(['varsayılan', 'default'], lang)}</span>
                      )}
                    </div>
                  </div>
                  <p className="staff-profile-card__description">
                    {L(['Hız limiti', 'Rate limit'], lang)}: <b className="mono">{profile.rateLimit || L(['sınırsız', 'unlimited'], lang)}</b>
                    {' · '}{L(['Eş zamanlı', 'Shared users'], lang)}: <b>{profile.sharedUsers}</b>
                  </p>
                  <div className="staff-profile-card__footer">
                    <span className="staff-profile-card__count mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      ID: {profile.id}
                    </span>
                    {!profile.isDefault && (
                      <Link
                        href={`/h/${hotelId}/staff/profiles/${encodeURIComponent(profile.id)}/edit`}
                        className="staff-profile-card__edit"
                      >
                        {L(['Düzenle', 'Edit'], lang)} <ChevronRight size={13} />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="card staff-profile-table-card">
              <div className="card__body">
                <table className="table staff-profile-table">
                  <thead>
                    <tr>
                      <th>{L(['Profil', 'Profile'], lang)}</th>
                      <th>{L(['Hız Limiti', 'Rate Limit'], lang)}</th>
                      <th>{L(['Eş Zamanlı', 'Shared Users'], lang)}</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((profile) => (
                      <tr className="row-link" key={profile.id}>
                        <td>
                          <div className="set-mem">
                            <div className="set-mem__av staff-profile-row-icon" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}>
                              <Router size={16} />
                            </div>
                            <div>
                              <div className="set-mem__n">{profile.name}</div>
                              {profile.isDefault && (
                                <div className="cell-sub">{L(['varsayılan', 'default'], lang)}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td><span className="mono" style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 'var(--r-sm)', fontSize: 13 }}>{profile.rateLimit || '—'}</span></td>
                        <td className="mono staff-devices">{profile.sharedUsers}</td>
                        <td>
                          <div className="rowact">
                            {!profile.isDefault && (
                              <Link href={`/h/${hotelId}/staff/profiles/${encodeURIComponent(profile.id)}/edit`} title={L(['Düzenle', 'Edit'], lang)}>
                                <Pencil size={15} />
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
