'use client';

import Link from 'next/link';
import {
  ChevronRight,
  Clock3,
  KeyRound,
  Monitor,
  Pencil,
  Power,
  Search,
  Wifi,
} from 'lucide-react';
import { useState } from 'react';
import { AreaChart, Kpi } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';
import type { RadAcctSession } from '@aidahos/db';

type SessionStatus = 'active' | 'ended';

type AccountDetail = {
  radiusUsername: string;
  localUsername: string;
  displayName: string;
  jobTitle: string;
  mikrotikGroup: string;
  color: string;
  online: boolean;
  lastLogin: string;
  dataTodayLabel: string;
  avgSessionLabel: string;
  activeDevices: number;
  dailyGb: number[];
  chartMax: number;
  sessions: RadAcctSession[];
};

function fmtBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  if (bytes >= 1e6) return `${(bytes / 1e6).toFixed(0)} MB`;
  return `${(bytes / 1e3).toFixed(0)} KB`;
}

function fmtSessionDuration(seconds: number | null, lang: Lang): string {
  if (!seconds) return L(['devam ediyor', 'ongoing'], lang);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (lang === 'tr') return h > 0 ? `${h}sa ${m}dk` : `${m}dk`;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function fmtDate(date: Date | null, lang: Lang): { day: string; time: string } {
  if (!date) return { day: '—', time: '—' };
  const now = new Date();
  const todayStr = now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const d = date.toDateString();
  const day = d === todayStr
    ? L(['Bugün', 'Today'], lang)
    : d === yesterday.toDateString()
      ? L(['Dün', 'Yesterday'], lang)
      : date.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB', { day: 'numeric', month: 'short' });
  const time = date.toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  return { day, time };
}

function initials(name: string) {
  return name.split(/\s+/).map((p) => p[0] ?? '').join('').slice(0, 2).toUpperCase();
}

export function StaffAccountDetail({
  hotelId,
  lang,
  account,
}: {
  hotelId: string;
  lang: Lang;
  account: AccountDetail;
}) {
  const [activeFilter, setActiveFilter] = useState<'all' | SessionStatus>('all');
  const [query, setQuery] = useState('');
  const labels = lang === 'tr' ? ['Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct', 'Pz'] : ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
  const base = `/h/${hotelId}/staff`;

  const mappedSessions = account.sessions.map((s) => {
    const active = !s.stop;
    const { day, time } = fmtDate(s.start, lang);
    return {
      id: s.id,
      mac: s.mac ?? '—',
      ip: s.framedIp ?? '—',
      day,
      time,
      duration: fmtSessionDuration(active ? null : s.sessionTime, lang),
      incoming: fmtBytes(s.inOctets),
      outgoing: fmtBytes(s.outOctets),
      status: (active ? 'active' : 'ended') as SessionStatus,
    };
  });

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = mappedSessions.filter((s) => {
    const matchesStatus = activeFilter === 'all' || s.status === activeFilter;
    if (!matchesStatus) return false;
    if (!normalizedQuery) return true;
    const haystack = `${s.mac} ${s.ip} ${s.day} ${s.time} ${s.duration}`.toLowerCase();
    return haystack.includes(normalizedQuery);
  });
  const counts = {
    all: mappedSessions.length,
    active: mappedSessions.filter((s) => s.status === 'active').length,
    ended: mappedSessions.filter((s) => s.status === 'ended').length,
  };

  return (
    <div className="staff-detail-page">
      <div className="staff-detail-breadcrumb">
        <Link href={base}>{L(['Kullanıcılar', 'Users'], lang)}</Link>
        <ChevronRight size={14} />
        <span>{account.displayName}</span>
      </div>

      <div className="acct-detail-head staff-detail-head">
        <div className="acct-detail-head__logo" style={{ background: account.color }}>
          {initials(account.displayName)}
        </div>
        <div className="staff-detail-identity">
          <div className="staff-detail-title-row">
            <h1 className="page-hero__h">{account.displayName}</h1>
            {account.online
              ? <span className="badge badge--ok"><span className="ico-dot" />{L(['Aktif', 'Active'], lang)}</span>
              : <span className="badge badge--mute">{L(['Çevrimdışı', 'Offline'], lang)}</span>}
            <span className="badge staff-detail-profile">
              {account.mikrotikGroup}
            </span>
          </div>
          <div className="cell-sub staff-detail-subtitle">
            {account.jobTitle}<span>·</span><span className="mono">{account.localUsername}</span>
          </div>
        </div>
        <div className="page-hero__actions staff-detail-actions">
          <button type="button" className="btn btn--ghost"><KeyRound size={16} />{L(['Şifreyi sıfırla', 'Reset password'], lang)}</button>
          <Link className="btn btn--primary" href={`${base}/accounts/${encodeURIComponent(account.radiusUsername)}/edit`}>
            <Pencil size={16} />{L(['Düzenle', 'Edit'], lang)}
          </Link>
        </div>
      </div>

      <div className="grid grid--kpi staff-detail-kpis">
        <Kpi icon={<Wifi />} label={L(['Bugün Kullanılan Veri', 'Data Used Today'], lang)} value={account.dataTodayLabel} />
        <Kpi icon={<Clock3 />} label={L(['Ort. Oturum Süresi', 'Avg Session Length'], lang)} value={account.avgSessionLabel} />
        <Kpi icon={<Monitor />} label={L(['Aktif Bağlantı', 'Active Connections'], lang)} value={String(account.activeDevices)} />
        <Kpi icon={<Power />} label={L(['Son Giriş', 'Last Login'], lang)} value={account.lastLogin} />
      </div>

      <section className="card staff-usage-card">
        <div className="card__head">
          <div>
            <div className="card__title">{L(['Günlük Veri Kullanımı', 'Daily Data Usage'], lang)}</div>
            <div className="card__sub">{L(['Son 7 gün · GB', 'Last 7 days · GB'], lang)}</div>
          </div>
        </div>
        <div className="card__body staff-usage-chart">
          <AreaChart data={account.dailyGb} labels={labels} max={account.chartMax} height={220} />
        </div>
      </section>

      <div className="staff-session-toolbar">
        <div className="chips staff-session-filters">
          {(['all', 'active', 'ended'] as const).map((value) => (
            <button
              type="button"
              key={value}
              className={`chip${activeFilter === value ? ' chip--on' : ''}`}
              onClick={() => setActiveFilter(value)}
            >
              {value === 'all' ? L(['Tümü', 'All'], lang) : value === 'active' ? L(['Aktif', 'Active'], lang) : L(['Sonlandı', 'Ended'], lang)}
              <span className="chip__n">{counts[value]}</span>
            </button>
          ))}
        </div>
        <label className="searchmini staff-session-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={L(['Bağlantı ara…', 'Search connections…'], lang)}
          />
        </label>
      </div>

      <section className="card staff-history-card">
        <div className="card__head">
          <div>
            <div className="card__title">{L(['Bağlantı Geçmişi', 'Connection History'], lang)}</div>
            <div className="card__sub">{filtered.length} {L(['kayıt', 'records'], lang)}</div>
          </div>
        </div>
        <div className="card__body staff-history-wrap">
          <table className="table staff-history-table">
            <thead>
              <tr>
                <th>MAC</th>
                <th>IP</th>
                <th>{L(['Gün / Saat', 'Day / Time'], lang)}</th>
                <th>{L(['Süre', 'Duration'], lang)}</th>
                <th>{L(['Veri (İn/Çık)', 'Data (In/Out)'], lang)}</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((session) => (
                <tr key={session.id}>
                  <td><span className="cell-sub mono">{session.mac}</span></td>
                  <td className="mono">{session.ip}</td>
                  <td><div className="cell-sub">{session.day}</div><div>{session.time}</div></td>
                  <td className="mono">{session.duration}</td>
                  <td className="mono">{session.incoming}/{session.outgoing}</td>
                  <td>
                    {session.status === 'active'
                      ? <span className="badge badge--ok"><span className="ico-dot" />{L(['Aktif', 'Active'], lang)}</span>
                      : <span className="badge badge--mute">{L(['Sonlandı', 'Ended'], lang)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="staff-history-empty">{L(['Henüz bağlantı kaydı yok.', 'No connection records yet.'], lang)}</div>
          )}
        </div>
      </section>
    </div>
  );
}
