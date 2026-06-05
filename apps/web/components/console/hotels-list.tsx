'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, LayoutGrid, Router, Rows3 } from 'lucide-react';
import { L } from '@/lib/i18n';
import { initials } from '@/lib/avatar';
import { useLang } from './lang-provider';

export interface HotelRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  region: string | null;
  rooms: number;
  guestsOnline: number;
  color: string;
  pmsType: string;
  groupName: string;
  groupColor: string;
}

type Pair = readonly [string, string];
const STATUS: Record<string, [string, Pair]> = {
  active: ['ok', ['Aktif', 'Active']],
  trial: ['info', ['Deneme', 'Trial']],
  suspended: ['warn', ['Askıda', 'Suspended']],
  archived: ['mute', ['Arşiv', 'Archived']],
};
const PMS_LABEL: Record<string, string> = {
  none: '—', mssql_generic: 'MSSQL', opera: 'Opera Cloud', protel: 'Protel', sis: 'SIS', elektraweb: 'Elektraweb',
};
const FILTERS: [string, Pair][] = [
  ['all', ['Tümü', 'All']],
  ['active', ['Aktif', 'Active']],
  ['trial', ['Deneme', 'Trial']],
  ['suspended', ['Askıda', 'Suspended']],
];

export function HotelsList({ hotels, basePath = '/hotels' }: { hotels: HotelRow[]; basePath?: string }) {
  const lang = useLang();
  const [view, setView] = useState<'table' | 'cards'>('table');
  const [filter, setFilter] = useState('all');
  useEffect(() => {
    const v = localStorage.getItem('ops-hotelview');
    if (v === 'cards' || v === 'table') setView(v);
  }, []);
  const setV = (v: 'table' | 'cards') => {
    setView(v);
    localStorage.setItem('ops-hotelview', v);
  };
  const Badge = ({ status }: { status: string }) => {
    const s = STATUS[status] ?? ['mute', [status, status] as Pair];
    return <span className={`badge badge--${s[0]}`}><span className="ico-dot" />{L(s[1], lang)}</span>;
  };
  const pms = (t: string) => PMS_LABEL[t] ?? t;
  const list = filter === 'all' ? hotels : hotels.filter((h) => h.status === filter);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-4)', flexWrap: 'wrap', marginBottom: 'var(--sp-5)' }}>
        <div className="chips" style={{ margin: 0 }}>
          {FILTERS.map(([id, label]) => {
            const n = id === 'all' ? hotels.length : hotels.filter((h) => h.status === id).length;
            return (
              <span key={id} className={`chip${id === filter ? ' chip--on' : ''}`} onClick={() => setFilter(id)}>
                {L(label, lang)}<span className="chip__n">{n}</span>
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
                  <th>{L(['Otel', 'Hotel'], lang)}</th>
                  <th>{L(['Hesap', 'Account'], lang)}</th>
                  <th>{L(['Durum', 'Status'], lang)}</th>
                  <th>PMS</th>
                  <th>{L(['Oda', 'Rooms'], lang)}</th>
                  <th>{L(['Misafir çevrimiçi', 'Guests online'], lang)}</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((h) => (
                  <tr key={h.id} className="row-link">
                    <td>
                      <Link href={`${basePath}/${h.id}`} className="table__name">
                        <div className="table__logo" style={{ background: `${h.color}1a`, color: h.color, borderColor: `${h.color}33`, fontWeight: 700 }}>
                          {initials(h.name)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{h.name}</div>
                          <div className="cell-sub">{h.region ?? h.slug}</div>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span className="plan-dot" style={{ background: h.groupColor }} />
                        {h.groupName}
                      </span>
                    </td>
                    <td><Badge status={h.status} /></td>
                    <td>
                      {h.pmsType === 'none' ? <span className="cell-sub">—</span> : (
                        <span className="plan-tag"><span className="plan-dot" style={{ background: 'var(--text-3)' }} />{pms(h.pmsType)}</span>
                      )}
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{h.rooms || '—'}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                      {h.guestsOnline ? <span style={{ color: 'var(--success)', fontWeight: 600 }}>{h.guestsOnline}</span> : '—'}
                    </td>
                    <td>
                      <div className="rowact">
                        <Link href={`${basePath}/${h.id}?tab=network`} title={L(['Ağ & cihazlar', 'Network & devices'], lang)}>
                          <Router size={15} />
                        </Link>
                        <Link href={`${basePath}/${h.id}`} title={L(['Aç', 'Open'], lang)}>
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
          {list.map((h) => (
            <div key={h.id} className="acct-card">
              <Link href={`${basePath}/${h.id}`} style={{ display: 'block', color: 'inherit' }}>
                <div className="acct-card__top">
                  <div className="acct-card__logo" style={{ background: `linear-gradient(135deg, ${h.color}, ${h.color}bb)` }}>
                    {initials(h.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="acct-card__name" style={{ fontSize: 'var(--text-md)' }}>{h.name}</div>
                    <div className="acct-card__owner">{h.region ?? h.slug}</div>
                  </div>
                  <Badge status={h.status} />
                </div>
                <div className="acct-card__body">
                  <div>
                    <div className="acct-stat__k">{L(['Oda', 'Rooms'], lang)}</div>
                    <div className="acct-stat__v">{h.rooms || '—'}</div>
                  </div>
                  <div>
                    <div className="acct-stat__k">PMS</div>
                    <div className="acct-stat__v" style={{ fontSize: 'var(--text-sm)' }}>{pms(h.pmsType)}</div>
                  </div>
                  <div>
                    <div className="acct-stat__k">{L(['Çevrimiçi', 'Online'], lang)}</div>
                    <div className="acct-stat__v" style={{ color: h.guestsOnline ? 'var(--success)' : 'inherit' }}>{h.guestsOnline || '—'}</div>
                  </div>
                </div>
              </Link>
              <div className="acct-card__foot">
                <span className="cell-sub">{h.groupName}</span>
                <Link className="btn btn--subtle btn--sm" href={`${basePath}/${h.id}?tab=network`}>
                  <Router size={14} /> {L(['Ağ', 'Network'], lang)}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {list.length === 0 && (
        <div className="card">
          <div className="card__body empty">
            <div style={{ color: 'var(--text-3)' }}>{L(['Bu filtrede otel yok.', 'No hotels in this filter.'], lang)}</div>
          </div>
        </div>
      )}
    </>
  );
}
