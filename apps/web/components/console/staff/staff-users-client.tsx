'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import { AlertTriangle, KeyRound, Pencil, Plus, Router, Trash2, Wifi } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import { deleteStaffUserAction } from '@/app/(hotel)/h/[hotelId]/staff/actions';
import type { StaffAccount } from '@aidahos/db';

function initials(name: string) {
  return name.split(' ').map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function avatarColor(s: string) {
  const colors = ['#0E7490', '#2563C9', '#7C5CE0', '#B8740A', '#0E9F6E', '#D5485A', '#0891B2', '#7C3AED'];
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return colors[h % colors.length]!;
}

function timeAgo(date: Date | null, lang: Lang): string {
  if (!date) return L(['Hiç', 'Never'], lang);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 2) return L(['şimdi', 'now'], lang);
  if (mins < 60) return `${mins} ${L(['dk önce', 'min ago'], lang)}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ${L(['sa önce', 'h ago'], lang)}`;
  return `${Math.floor(hrs / 24)} ${L(['gün önce', 'days ago'], lang)}`;
}

function DeleteButton({ hotelId, username, lang }: { hotelId: string; username: string; lang: Lang }) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (confirm) {
    return (
      <span style={{ display: 'flex', gap: 4 }}>
        <button
          type="button"
          className="btn btn--danger btn--xs"
          disabled={isPending}
          onClick={() => startTransition(async () => {
            try { await deleteStaffUserAction(hotelId, username); } catch { /* redirect throws */ }
          })}
        >
          {isPending ? '…' : L(['Evet', 'Yes'], lang)}
        </button>
        <button type="button" className="btn btn--ghost btn--xs" onClick={() => setConfirm(false)}>
          {L(['Hayır', 'No'], lang)}
        </button>
      </span>
    );
  }
  return (
    <button type="button" title={L(['Sil', 'Delete'], lang)} onClick={() => setConfirm(true)}>
      <Trash2 size={15} />
    </button>
  );
}

export function StaffUsersClient({
  hotelId,
  lang,
  users,
  error,
  base,
}: {
  hotelId: string;
  lang: Lang;
  users: StaffAccount[];
  error: string | null;
  base: string;
}) {
  if (error) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'color-mix(in srgb, var(--err) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--err) 20%, transparent)', borderRadius: 'var(--r-md)', color: 'var(--err)', fontSize: 14 }}>
        <AlertTriangle size={16} />
        <span>FreeRADIUS {L(['bağlantı hatası:', 'connection error:'], lang)} {error}</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--text-muted)' }}>
        <Wifi size={36} style={{ opacity: 0.25, marginBottom: 16 }} />
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{L(['Henüz personel hesabı yok', 'No staff accounts yet'], lang)}</div>
        <div style={{ fontSize: 13 }}>{L(['Yeni hesap ekleyerek başlayın.', 'Start by adding a new account.'], lang)}</div>
        <Link href={`${base}/new`} className="btn btn--primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16 }}>
          <Plus size={14} />{L(['Yeni Hesap', 'New Account'], lang)}
        </Link>
      </div>
    );
  }

  return (
    <div className="card staff-accounts-card">
      <div className="card__head">
        <div>
          <div className="card__title">{L(['Tüm Hesaplar', 'All Accounts'], lang)}</div>
          <div className="card__sub">{users.length} {L(['hesap', 'accounts'], lang)}</div>
        </div>
      </div>
      <div className="card__body staff-table-wrap">
        <table className="table staff-table">
          <thead>
            <tr>
              <th>{L(['Personel', 'Employee'], lang)}</th>
              <th>{L(['Kullanıcı Adı', 'Username'], lang)}</th>
              <th>{L(['Profil (Mikrotik-Group)', 'Profile (Mikrotik-Group)'], lang)}</th>
              <th>{L(['Durum', 'Status'], lang)}</th>
              <th>{L(['Son Giriş', 'Last Login'], lang)}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.radiusUsername} className="row-link">
                <td>
                  <div className="set-mem">
                    <div className="set-mem__av" style={{ background: avatarColor(user.radiusUsername) }}>
                      {initials(user.displayName)}
                    </div>
                    <div>
                      <Link className="set-mem__n staff-account-name-link" href={`${base}/accounts/${encodeURIComponent(user.radiusUsername)}/edit`}>
                        {user.displayName}
                      </Link>
                      <div className="cell-sub mono" style={{ fontSize: 11 }}>{user.radiusUsername}</div>
                    </div>
                  </div>
                </td>
                <td className="mono staff-username">{user.localUsername}</td>
                <td>
                  {user.mikrotikGroup ? (
                    <span className="badge" style={{ background: 'var(--accent-soft)', color: 'var(--accent)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Router size={12} />{user.mikrotikGroup}
                    </span>
                  ) : (
                    <span className="cell-sub">—</span>
                  )}
                </td>
                <td>
                  <span className={`badge badge--${user.online ? 'ok' : 'mute'}`}>
                    <span className="ico-dot" />
                    {user.online ? L(['Bağlı', 'Online'], lang) : L(['Çevrimdışı', 'Offline'], lang)}
                  </span>
                </td>
                <td className="cell-sub">{timeAgo(user.lastSeen, lang)}</td>
                <td>
                  <div className="rowact">
                    <Link href={`${base}/accounts/${encodeURIComponent(user.radiusUsername)}/edit`} title={L(['Düzenle', 'Edit'], lang)}>
                      <Pencil size={15} />
                    </Link>
                    <DeleteButton hotelId={hotelId} username={user.radiusUsername} lang={lang} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
