'use client';

import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Check,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  UserRound,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { Kpi } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';

export type StayStatus = 'inhouse' | 'checked-out';

export interface SerializedGuest {
  id: string;
  name: string;
  initials: string;
  color: string;
  room: string;
  checkin: string;
  checkout: string;
  status: StayStatus;
  phone: string;
  email: string;
  online: boolean;
  dataToday: string;
  country: string | null;
  roomType: string | null;
  agency: string | null;
  currency: string | null;
  createdAt: string;
}

const PAGE_SIZE = 10;

function csvCell(v: string) {
  return `"${v.replaceAll('"', '""')}"`;
}

type StepStatus = 'idle' | 'pending' | 'done' | 'error';

function StepRow({ label, status, lang }: { label: string; status: StepStatus; lang: Lang }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{
        width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: status === 'done' ? 'var(--ok-soft, #d1fae5)' : status === 'error' ? 'var(--danger-soft)' : status === 'pending' ? 'var(--surface-2, #f3f4f6)' : 'var(--surface-2, #f3f4f6)',
        color: status === 'done' ? 'var(--ok, #059669)' : status === 'error' ? 'var(--danger)' : 'var(--text-3)',
        transition: 'background 0.2s, color 0.2s',
      }}>
        {status === 'done' && <Check size={13} strokeWidth={2.5} />}
        {status === 'error' && <span style={{ fontSize: 12, fontWeight: 700 }}>✕</span>}
        {status === 'pending' && (
          <span style={{
            width: 12, height: 12, border: '2px solid var(--text-3)', borderTopColor: 'var(--text-1)',
            borderRadius: '50%', animation: 'dc-spin 0.7s linear infinite', display: 'block',
          }} />
        )}
        {status === 'idle' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--border)', display: 'block' }} />}
      </span>
      <span style={{ fontSize: 13.5, color: status === 'done' ? 'var(--text-1)' : status === 'error' ? 'var(--danger)' : 'var(--text-2)', flex: 1 }}>
        {label}
      </span>
      {status === 'done' && <span style={{ fontSize: 12, color: 'var(--ok, #059669)', fontWeight: 500 }}>{L(['Tamamlandı', 'Done'], lang)}</span>}
      {status === 'error' && <span style={{ fontSize: 12, color: 'var(--danger)', fontWeight: 500 }}>{L(['Hata', 'Error'], lang)}</span>}
    </div>
  );
}


function GuestActions({
  guestId,
  hotelId,
  lang,
  online,
  onDisconnectRouter,
  onDisconnectRadius,
}: {
  guestId: string;
  hotelId: string;
  lang: Lang;
  online: boolean;
  onDisconnectRouter: (id: string) => Promise<{ ok: boolean; error?: string }>;
  onDisconnectRadius: (id: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const [confirming, setConfirming] = useState(false);
  const [routerStatus, setRouterStatus] = useState<StepStatus>('idle');
  const [radiusStatus, setRadiusStatus] = useState<StepStatus>('idle');
  const [phase, setPhase] = useState<'confirm' | 'running' | 'done'>('confirm');
  const btnRef = useRef<HTMLButtonElement>(null);

  function resetDialog() {
    setConfirming(false);
    setPhase('confirm');
    setRouterStatus('idle');
    setRadiusStatus('idle');
  }

  async function handleStart() {
    setPhase('running');
    setRouterStatus('pending');
    setRadiusStatus('idle');

    const routerRes = await onDisconnectRouter(guestId);
    setRouterStatus(routerRes.ok ? 'done' : 'error');

    if (routerRes.ok) {
      setRadiusStatus('pending');
      const radiusRes = await onDisconnectRadius(guestId);
      setRadiusStatus(radiusRes.ok ? 'done' : 'error');
    }

    setPhase('done');
  }

  function handleOpen() {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = online ? 88 : 44;
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < menuHeight + 8) {
        setMenuStyle({ position: 'fixed', top: rect.top - menuHeight - 4, right: window.innerWidth - rect.right, zIndex: 50 });
      } else {
        setMenuStyle({ position: 'fixed', top: rect.bottom + 4, right: window.innerWidth - rect.right, zIndex: 50 });
      }
    }
    setOpen((v) => !v);
  }

  return (
    <div
      className="rowact rowmenu guests-rowmenu"
      onClick={(e) => e.stopPropagation()}
    >
      <button
        ref={btnRef}
        type="button"
        aria-label={L(['Misafir işlemleri', 'Guest actions'], lang)}
        aria-expanded={open}
        onClick={handleOpen}
      >
        <MoreHorizontal />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div className="rowmenu__pop" style={menuStyle}>
            <Link className="rowmenu__item" href={`/h/${hotelId}/guests/${guestId}`} onClick={() => setOpen(false)}>
              <UserRound size={15} /> {L(['Detay', 'View Detail'], lang)}
            </Link>
            {online && (
              <button
                className="rowmenu__item danger"
                type="button"
                onClick={() => { setOpen(false); setConfirming(true); }}
              >
                <WifiOff size={15} /> {L(['Bağlantıyı Kes', 'Disconnect'], lang)}
              </button>
            )}
          </div>
        </>
      )}
      {confirming && createPortal(
        <div className="modal-overlay" onMouseDown={phase === 'done' || routerStatus === 'error' ? resetDialog : undefined}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal>
            <div className="modal__head">
              <div className="modal__ico"><WifiOff size={20} /></div>
              <div>
                <div className="modal__title">{L(['Bağlantıyı Kes', 'Disconnect Wi-Fi'], lang)}</div>
                <div className="modal__sub">
                  {phase === 'confirm'
                    ? L(['Misafirin aktif Wi-Fi oturumu sonlandırılacak. Emin misiniz?', "The guest's active Wi-Fi session will be terminated. Are you sure?"], lang)
                    : L(['Oturumlar kapatılıyor…', 'Terminating sessions…'], lang)}
                </div>
              </div>
            </div>
            <div className="modal__body" style={{ paddingTop: 4, paddingBottom: 4 }}>
              <StepRow label="Router Session (MikroTik)" status={routerStatus} lang={lang} />
              <StepRow label="Radius Session" status={radiusStatus} lang={lang} />
              <style>{`@keyframes dc-spin { to { transform: rotate(360deg); } }`}</style>
            </div>
            <div className="modal__foot">
              {phase === 'confirm' && (
                <>
                  <button type="button" className="btn btn--ghost" onClick={resetDialog}>
                    {L(['Vazgeç', 'Cancel'], lang)}
                  </button>
                  <button type="button" className="btn btn--danger" onClick={handleStart}>
                    <WifiOff size={15} /> {L(['Bağlantıyı Kes', 'Disconnect'], lang)}
                  </button>
                </>
              )}
              {phase === 'running' && (
                <button type="button" className="btn btn--ghost" disabled>
                  {L(['İşleniyor…', 'Processing…'], lang)}
                </button>
              )}
              {phase === 'done' && (
                <button type="button" className="btn btn--ghost" onClick={resetDialog}>
                  {L(['Kapat', 'Close'], lang)}
                </button>
              )}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

export function GuestsClient({
  hotelId,
  lang,
  guests,
  avgData,
  onDisconnectRouter,
  onDisconnectRadius,
}: {
  hotelId: string;
  lang: Lang;
  guests: SerializedGuest[];
  avgData: string;
  onDisconnectRouter: (guestStayId: string) => Promise<{ ok: boolean; error?: string }>;
  onDisconnectRadius: (guestStayId: string) => Promise<{ ok: boolean; error?: string }>;
}) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<'all' | StayStatus>('all');
  const [connectionFilter, setConnectionFilter] = useState<'all' | 'online' | 'offline'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const counts = useMemo(() => ({
    all: guests.length,
    inhouse: guests.filter((g) => g.status === 'inhouse').length,
    checkedOut: guests.filter((g) => g.status === 'checked-out').length,
    online: guests.filter((g) => g.online).length,
    offline: guests.filter((g) => !g.online).length,
  }), [guests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US');
    return guests.filter((g) => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false;
      if (connectionFilter === 'online' && !g.online) return false;
      if (connectionFilter === 'offline' && g.online) return false;
      if (!q) return true;
      return [g.name, g.room, g.email, g.phone].some((v) =>
        v.toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US').includes(q),
      );
    });
  }, [guests, statusFilter, connectionFilter, search, lang]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const first = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(currentPage * PAGE_SIZE, filtered.length);

  const downloadCsv = () => {
    const rows = [
      ['Guest', 'Room', 'Check-in', 'Check-out', 'Phone', 'Email', 'Status', 'Connection'],
      ...filtered.map((g) => [g.name, g.room, g.checkin, g.checkout, g.phone, g.email, g.status, g.online ? 'Online' : 'Offline']),
    ];
    const csv = rows.map((r) => r.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aida-guests.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="guests-page">
      <div className="page-hero guests-hero">
        <div>
          <h1 className="page-hero__h">{L(['Misafirler', 'Guests'], lang)}</h1>
          <p className="page-hero__sub">
            {L(['Misafir CRM: profiller, konaklamalar, bağlantılar, talepler ve notlar.', 'Guest CRM: profiles, stays, connections, tickets and notes.'], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          <button className="btn btn--ghost" type="button" onClick={downloadCsv}><Download size={16} />CSV</button>
          <button className="btn btn--primary" type="button" disabled>
            <Plus size={16} />{L(['Misafir Ekle', 'Add Guest'], lang)}
          </button>
        </div>
      </div>

      <nav className="tabbar guests-tabbar" aria-label={L(['Misafir bölümleri', 'Guest sections'], lang)}>
        <Link className="tab active" aria-current="page" href={`/h/${hotelId}/guests`}>{L(['Misafirler', 'Guests'], lang)}</Link>
        <Link className="tab" href={`/h/${hotelId}/guests/connections`}>{L(['Bağlantılar', 'Connections'], lang)}</Link>
        <Link className="tab" href={`/h/${hotelId}/guests/tickets`}>{L(['Talepler / Şikayetler', 'Tickets / Complaints'], lang)}</Link>
        <span className="tab" aria-disabled="true">{L(['Notlar', 'Notes'], lang)}</span>
        <Link className="tab" href={`/h/${hotelId}/guests/analytics`}>{L(['Analitik', 'Analytics'], lang)}</Link>
      </nav>

      <div className="grid grid--kpi guests-kpis">
        <Kpi icon={<UserRound />} label={L(['Toplam Misafir', 'Total Guests'], lang)} value={String(counts.all)} note={L(['portal üzerinden bağlanan', 'connected via portal'], lang)} />
        <Kpi icon={<Wifi />} label={L(['Şu An Bağlı', 'Connected Now'], lang)} value={String(counts.online)} note={L(['çevrimiçi', 'online right now'], lang)} live />
        <Kpi icon={<Download />} label={L(['Ort. Veri Kullanımı', 'Avg Data Usage'], lang)} value={avgData} note={L(['bağlı misafir başına', 'per connected guest'], lang)} />
        <Kpi icon={<Star />} label={L(['Otelde', 'In-House'], lang)} value={String(counts.inhouse)} note={L(['şu an konakluyor', 'currently staying'], lang)} />
      </div>

      <div className="guests-toolbar">
        <div className="guests-filter-groups">
          <div className="guests-chips" role="group" aria-label={L(['Konaklama durumu', 'Stay status'], lang)}>
            {([
              ['all', L(['Tümü', 'All'], lang), counts.all],
              ['inhouse', L(['Otelde', 'In-House'], lang), counts.inhouse],
              ['checked-out', L(['Çıkış Yaptı', 'Checked Out'], lang), counts.checkedOut],
            ] as const).map(([v, label, count]) => (
              <button
                key={v}
                type="button"
                className={`guests-chip${statusFilter === v ? ' active' : ''}`}
                onClick={() => { setStatusFilter(v); setPage(1); }}
              >
                {label}<span>{count}</span>
              </button>
            ))}
          </div>
          <div className="guests-chips" role="group" aria-label={L(['Bağlantı durumu', 'Connection status'], lang)}>
            {([
              ['all', L(['Tüm Bağlantılar', 'All Connections'], lang), counts.all],
              ['online', L(['Bağlı', 'Online'], lang), counts.online],
              ['offline', L(['Bağlı Değil', 'Offline'], lang), counts.offline],
            ] as const).map(([v, label, count]) => (
              <button
                key={v}
                type="button"
                className={`guests-chip${connectionFilter === v ? ' active' : ''}`}
                onClick={() => { setConnectionFilter(v); setPage(1); }}
              >
                {label}{v === 'all' ? null : <span>{count}</span>}
              </button>
            ))}
          </div>
        </div>
        <label className="searchmini guests-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder={L(['İsim, oda, e-posta ara…', 'Search name, room, email…'], lang)}
          />
        </label>
      </div>

      <section className="card guests-card">
        <div className="card__head">
          <div>
            <h2 className="card__title">{L(['Tüm Misafirler', 'All Guests'], lang)}</h2>
            <p className="card__sub">{filtered.length} {L(['misafir', 'guests'], lang)}</p>
          </div>
        </div>
        <div className="card__body guests-table-wrap">
          <table className="table guests-table">
            <thead>
              <tr>
                <th>{L(['Misafir', 'Guest'], lang)}</th>
                <th>Check-in / Check-out</th>
                <th>{L(['İletişim', 'Contact'], lang)}</th>
                <th>{L(['Bağlantı', 'Connection'], lang)}</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
                <th>{L(['İşlemler', 'Actions'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr><td className="guests-empty" colSpan={6}>{L(['Henüz portal üzerinden bağlanan misafir yok.', 'No guests have connected via the portal yet.'], lang)}</td></tr>
              ) : visible.map((g) => (
                <tr
                  key={g.id}
                  className="guests-row-link"
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/h/${hotelId}/guests/${g.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/h/${hotelId}/guests/${g.id}`);
                    }
                  }}
                >
                  <td>
                    <div className="set-mem">
                      <div className="set-mem__av" style={{ background: g.color }}>{g.initials}</div>
                      <div>
                        <div className="set-mem__n">{g.name}</div>
                        <div className="cell-sub">{L(['Oda', 'Room'], lang)} {g.room}</div>
                      </div>
                    </div>
                  </td>
                  <td className="cell-sub mono">{g.checkin}<br />{g.checkout}</td>
                  <td className="mono guests-contact">
                    {g.phone !== '—' ? g.phone : <span className="cell-sub">—</span>}
                    <br />
                    <span>{g.email !== '—' ? g.email : <span className="cell-sub">—</span>}</span>
                  </td>
                  <td>
                    {g.online ? (
                      <span className="badge badge--ok"><span className="ico-dot" />{L(['Bağlı', 'Online'], lang)}</span>
                    ) : (
                      <span className="badge badge--mute">{L(['Bağlı Değil', 'Offline'], lang)}</span>
                    )}
                  </td>
                  <td>
                    {g.status === 'inhouse' ? (
                      <span className="badge badge--ok"><span className="ico-dot" />{L(['Otelde', 'In-House'], lang)}</span>
                    ) : (
                      <span className="badge badge--mute">{L(['Çıkış Yaptı', 'Checked Out'], lang)}</span>
                    )}
                  </td>
                  <td><GuestActions guestId={g.id} hotelId={hotelId} lang={lang} online={g.online} onDisconnectRouter={onDisconnectRouter} onDisconnectRadius={onDisconnectRadius} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 0 && (
          <div className="pager guests-pager">
            <p className="pager__info">
              {lang === 'tr' ? `${filtered.length} misafirden ${first}–${last} arası` : `Showing ${first}–${last} of ${filtered.length}`}
            </p>
            <div className="pager__nums">
              <button type="button" disabled={currentPage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>{L(['Önceki', 'Prev'], lang)}</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={currentPage === n ? 'on' : ''} onClick={() => setPage(n)}>{n}</button>
              ))}
              <button type="button" disabled={currentPage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>{L(['Sonraki', 'Next'], lang)}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
