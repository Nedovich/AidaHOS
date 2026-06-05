'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, LayoutGrid, Pencil, Rows3 } from 'lucide-react';
import { L } from '@/lib/i18n';
import { initials } from '@/lib/avatar';
import { useLang } from './lang-provider';

export interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  banned: boolean;
  accountName: string | null;
  accountColor: string;
  hotelsAccess: number;
  lastLogin: string;
  color: string;
}

type Pair = readonly [string, string];
const ROLE: Record<string, [string, Pair]> = {
  super_admin: ['purple', ['Süper Admin', 'Super Admin']],
  admin: ['accent', ['Admin', 'Admin']],
  user: ['info', ['Kullanıcı', 'User']],
  customer: ['mute', ['Müşteri', 'Customer']],
};
const FILTERS: [string, Pair][] = [
  ['all', ['Tümü', 'All']],
  ['super_admin', ['Süper Admin', 'Super Admin']],
  ['admin', ['Admin', 'Admin']],
  ['user', ['Kullanıcı', 'User']],
];

export function UsersList({ users, basePath = '/users' }: { users: UserRow[]; basePath?: string }) {
  const lang = useLang();
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    const v = localStorage.getItem('ops-userview');
    if (v === 'cards' || v === 'table') setView(v);
  }, []);
  const setV = (v: 'table' | 'cards') => {
    setView(v);
    localStorage.setItem('ops-userview', v);
  };

  const RoleBadge = ({ role }: { role: string }) => {
    const r = ROLE[role] ?? ['mute', [role, role] as Pair];
    return <span className={`badge badge--${r[0]}`}>{L(r[1], lang)}</span>;
  };
  const StatusBadge = ({ banned }: { banned: boolean }) => (
    <span className={`badge badge--${banned ? 'warn' : 'ok'}`}>
      <span className="ico-dot" />
      {banned ? L(['Askıda', 'Suspended'], lang) : L(['Aktif', 'Active'], lang)}
    </span>
  );
  const Mfa = () => (
    <span className="badge badge--warn">
      <span className="ico-dot" />
      {L(['Kapalı', 'Off'], lang)}
    </span>
  );
  const Avatar = ({ u, size = 36 }: { u: UserRow; size?: number }) => (
    <div className="table__logo" style={{ width: size, height: size, background: `${u.color}1a`, color: u.color, borderColor: `${u.color}33`, fontWeight: 700 }}>
      {initials(u.name)}
    </div>
  );

  const list = filter === 'all' ? users : users.filter((u) => u.role === filter);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-4)', flexWrap: 'wrap', marginBottom: 'var(--sp-5)' }}>
        <div className="chips" style={{ margin: 0 }}>
          {FILTERS.map(([id, label]) => {
            const n = id === 'all' ? users.length : users.filter((u) => u.role === id).length;
            return (
              <span key={id} className={`chip${id === filter ? ' chip--on' : ''}`} onClick={() => setFilter(id)}>
                {L(label, lang)}
                <span className="chip__n">{n}</span>
              </span>
            );
          })}
        </div>
        <div className="view-toggle">
          <button className={view === 'table' ? 'on' : ''} onClick={() => setV('table')}>
            <Rows3 size={15} /> {L(['Tablo', 'Table'], lang)}
          </button>
          <button className={view === 'cards' ? 'on' : ''} onClick={() => setV('cards')}>
            <LayoutGrid size={15} /> {L(['Kart', 'Cards'], lang)}
          </button>
        </div>
      </div>

      {view === 'table' ? (
        <div className="card">
          <div className="card__body" style={{ paddingTop: 6, overflowX: 'auto' }}>
            <table className="table acct-table">
              <thead>
                <tr>
                  <th>{L(['Kullanıcı', 'User'], lang)}</th>
                  <th>{L(['Hesap', 'Account'], lang)}</th>
                  <th>{L(['Rol', 'Role'], lang)}</th>
                  <th>{L(['Durum', 'Status'], lang)}</th>
                  <th>MFA</th>
                  <th>{L(['Otel', 'Hotels'], lang)}</th>
                  <th>{L(['Son giriş', 'Last login'], lang)}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((u) => (
                  <tr key={u.id} className="row-link">
                    <td>
                      <Link href={`${basePath}/${u.id}`} className="table__name">
                        <Avatar u={u} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{u.name}</div>
                          <div className="cell-sub mono">{u.email}</div>
                        </div>
                      </Link>
                    </td>
                    <td>
                      {u.accountName ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span className="plan-dot" style={{ background: u.accountColor }} />
                          {u.accountName}
                        </span>
                      ) : (
                        <span className="cell-sub">—</span>
                      )}
                    </td>
                    <td><RoleBadge role={u.role} /></td>
                    <td><StatusBadge banned={u.banned} /></td>
                    <td><Mfa /></td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{u.hotelsAccess || '—'}</td>
                    <td><div className="cell-sub">{u.lastLogin}</div></td>
                    <td>
                      <div className="rowact">
                        <Link href={`${basePath}/${u.id}?tab=edit`} title={L(['Düzenle', 'Edit'], lang)}>
                          <Pencil size={15} />
                        </Link>
                        <Link href={`${basePath}/${u.id}`} title={L(['Aç', 'Open'], lang)}>
                          <ChevronRight size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="acct-grid">
          {list.map((u) => (
            <div key={u.id} className="acct-card">
              <Link href={`${basePath}/${u.id}`} style={{ display: 'block', color: 'inherit' }}>
                <div className="acct-card__top">
                  <div className="acct-card__logo" style={{ background: `linear-gradient(135deg, ${u.color}, ${u.color}bb)` }}>
                    {initials(u.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="acct-card__name" style={{ fontSize: 'var(--text-md)' }}>{u.name}</div>
                    <div className="acct-card__owner mono">{u.email}</div>
                  </div>
                  <StatusBadge banned={u.banned} />
                </div>
                <div className="acct-card__body">
                  <div>
                    <div className="acct-stat__k">{L(['Rol', 'Role'], lang)}</div>
                    <div className="acct-stat__v" style={{ fontSize: 'var(--text-sm)' }}><RoleBadge role={u.role} /></div>
                  </div>
                  <div>
                    <div className="acct-stat__k">MFA</div>
                    <div className="acct-stat__v" style={{ fontSize: 'var(--text-sm)' }}><Mfa /></div>
                  </div>
                  <div>
                    <div className="acct-stat__k">{L(['Otel', 'Hotels'], lang)}</div>
                    <div className="acct-stat__v">{u.hotelsAccess || '—'}</div>
                  </div>
                </div>
              </Link>
              <div className="acct-card__foot">
                <span className="cell-sub">{u.accountName ?? '—'}</span>
                <span className="cell-sub">{u.lastLogin}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {list.length === 0 && (
        <div className="card">
          <div className="card__body empty">
            <div style={{ color: 'var(--text-3)' }}>{L(['Bu filtrede kullanıcı yok.', 'No users in this filter.'], lang)}</div>
          </div>
        </div>
      )}
    </>
  );
}
