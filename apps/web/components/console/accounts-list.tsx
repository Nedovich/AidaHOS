'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, ExternalLink, LayoutGrid, Rows3 } from 'lucide-react';
import { L } from '@/lib/i18n';
import { fmtK, getPlan } from '@/lib/plans';
import { useLang } from './lang-provider';

export interface AccountRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  ownerName: string | null;
  region: string | null;
  plan: string;
  mrr: number;
  aiUsed: number;
  aiLimit: number;
  color: string;
  hotelCount: number;
  userCount: number;
}

type Pair = readonly [string, string];
const STATUS: Record<string, [string, Pair]> = {
  active: ['ok', ['Aktif', 'Active']],
  trial: ['info', ['Deneme', 'Trial']],
  suspended: ['warn', ['Askıda', 'Suspended']],
  archived: ['mute', ['Arşiv', 'Archived']],
};
const FILTERS: [string, Pair][] = [
  ['all', ['Tümü', 'All']],
  ['active', ['Aktif', 'Active']],
  ['trial', ['Deneme', 'Trial']],
  ['suspended', ['Askıda', 'Suspended']],
  ['archived', ['Arşiv', 'Archived']],
];

export function AccountsList({ groups }: { groups: AccountRow[] }) {
  const lang = useLang();
  const [view, setView] = useState<'table' | 'cards'>('cards');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const v = localStorage.getItem('ops-acctview');
    if (v === 'cards' || v === 'table') setView(v);
  }, []);
  const setV = (v: 'table' | 'cards') => {
    setView(v);
    localStorage.setItem('ops-acctview', v);
  };

  const Badge = ({ status }: { status: string }) => {
    const s = STATUS[status] ?? ['mute', [status, status] as Pair];
    return (
      <span className={`badge badge--${s[0]}`}>
        <span className="ico-dot" />
        {L(s[1], lang)}
      </span>
    );
  };
  const PlanTag = ({ plan }: { plan: string }) => {
    const p = getPlan(plan);
    return (
      <span className="plan-tag">
        <span className="plan-dot" style={{ background: p.color }} />
        {p.name}
      </span>
    );
  };

  const list = filter === 'all' ? groups : groups.filter((g) => g.status === filter);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--sp-4)', flexWrap: 'wrap', marginBottom: 'var(--sp-5)' }}>
        <div className="chips" style={{ margin: 0 }}>
          {FILTERS.map(([id, label]) => {
            const n = id === 'all' ? groups.length : groups.filter((g) => g.status === id).length;
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
                  <th>{L(['Hesap', 'Account'], lang)}</th>
                  <th>{L(['Sahip', 'Owner'], lang)}</th>
                  <th>{L(['Durum', 'Status'], lang)}</th>
                  <th>{L(['Plan', 'Plan'], lang)}</th>
                  <th>{L(['Otel', 'Hotels'], lang)}</th>
                  <th>{L(['AI kul.', 'AI use'], lang)}</th>
                  <th>MRR</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {list.map((g) => {
                  const pct = g.aiLimit ? Math.min(100, Math.round((g.aiUsed / g.aiLimit) * 100)) : 0;
                  return (
                    <tr key={g.id} className="row-link">
                      <td>
                        <Link href={`/accounts/${g.id}`} className="table__name">
                          <div className="table__logo" style={{ background: `${g.color}1a`, color: g.color, borderColor: `${g.color}33` }}>
                            {g.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600 }}>{g.name}</div>
                            <div className="cell-sub">{g.region ?? g.slug}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="acct-cell-owner">
                        <b>{g.ownerName ?? '—'}</b>
                      </td>
                      <td>
                        <Badge status={g.status} />
                      </td>
                      <td>
                        <PlanTag plan={g.plan} />
                      </td>
                      <td style={{ fontVariantNumeric: 'tabular-nums' }}>{g.hotelCount || '—'}</td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="minibar" style={{ maxWidth: 62 }}>
                            <div className="minibar__f" style={{ width: `${pct}%`, background: pct >= 85 ? 'var(--warning)' : 'var(--accent)' }} />
                          </div>
                          <span className="cell-sub" style={{ fontVariantNumeric: 'tabular-nums' }}>{pct}%</span>
                        </div>
                      </td>
                      <td className="mrr-val">{g.mrr ? '€' + g.mrr.toLocaleString() : '—'}</td>
                      <td>
                        <div className="rowact">
                          <Link href={`/accounts/${g.id}`} title={L(['Aç', 'Open'], lang)}>
                            <ChevronRight size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="acct-grid">
          {list.map((g) => {
            const pct = g.aiLimit ? Math.min(100, Math.round((g.aiUsed / g.aiLimit) * 100)) : 0;
            return (
              <div key={g.id} className="acct-card">
                <Link href={`/accounts/${g.id}`} style={{ display: 'block', color: 'inherit' }}>
                  <div className="acct-card__top">
                    <div className="acct-card__logo" style={{ background: `linear-gradient(135deg, ${g.color}, ${g.color}bb)` }}>
                      {g.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="acct-card__name">{g.name}</div>
                      <div className="acct-card__owner">{[g.ownerName, g.region].filter(Boolean).join(' · ') || g.slug}</div>
                    </div>
                    <Badge status={g.status} />
                  </div>
                  <div className="acct-card__body">
                    <div>
                      <div className="acct-stat__k">{L(['Plan', 'Plan'], lang)}</div>
                      <div className="acct-stat__v" style={{ fontSize: 'var(--text-base)' }}>
                        <PlanTag plan={g.plan} />
                      </div>
                    </div>
                    <div>
                      <div className="acct-stat__k">{L(['Otel', 'Hotels'], lang)}</div>
                      <div className="acct-stat__v">{g.hotelCount || '—'}</div>
                    </div>
                    <div>
                      <div className="acct-stat__k">MRR</div>
                      <div className="acct-stat__v">{g.mrr ? '€' + g.mrr.toLocaleString() : '—'}</div>
                    </div>
                  </div>
                  <div className="acct-credit">
                    <div className="acct-credit__top">
                      <span>{L(['AI kredisi', 'AI credits'], lang)}</span>
                      <span>{fmtK(g.aiUsed)} / {fmtK(g.aiLimit)}</span>
                    </div>
                    <div className="minibar">
                      <div className="minibar__f" style={{ width: `${pct}%`, background: pct >= 85 ? 'var(--warning)' : 'var(--accent)' }} />
                    </div>
                  </div>
                </Link>
                <div className="acct-card__foot">
                  <span className="cell-sub">{g.userCount} {L(['kullanıcı', 'users'], lang)}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link className="btn btn--ghost btn--sm" href={`/accounts/${g.id}`}>
                      <ExternalLink size={14} /> {L(['Gir', 'Enter'], lang)}
                    </Link>
                    <Link className="btn btn--subtle btn--sm" href={`/accounts/${g.id}`}>
                      {L(['Yönet', 'Manage'], lang)} <ChevronRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {list.length === 0 && (
        <div className="card">
          <div className="card__body empty">
            <div style={{ color: 'var(--text-3)' }}>{L(['Bu filtrede hesap yok.', 'No accounts in this filter.'], lang)}</div>
          </div>
        </div>
      )}
    </>
  );
}
