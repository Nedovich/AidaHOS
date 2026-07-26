'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, Check, ClipboardList, Clock3, Pencil, Plus, Search, Send, X } from 'lucide-react';
import { Kpi } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';

export type SurveySendStatus = 'scheduled' | 'sent' | 'completed';

export interface SerializedSurveySend {
  id: string;
  guest: {
    id: string;
    name: string;
    initials: string;
    color: string;
    room: string;
    hotel: string;
    email: string | null;
    phone: string | null;
  };
  surveyName: string | null;
  triggerAt: string | null;
  shownAt: string | null;
  status: SurveySendStatus;
}

function StatusBadge({ status, lang }: { status: SurveySendStatus; lang: Lang }) {
  const Icon = status === 'scheduled' ? Clock3 : status === 'completed' ? Check : Send;
  const label =
    status === 'scheduled' ? L(['Zamanlandı', 'Scheduled'], lang) :
    status === 'completed'  ? L(['Tamamlandı', 'Completed'], lang) :
                              L(['Gönderildi', 'Sent'], lang);
  return (
    <span className={`badge guest-survey-status status-${status}`}>
      <Icon size={13} />{label}
    </span>
  );
}

function fmtTrigger(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '—', time: '' };
  const d = new Date(iso);
  const date = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return { date, time };
}

/** Inline modal: edit trigger date+time for a single send record. */
function EditTriggerModal({
  record,
  lang,
  onClose,
  onSave,
}: {
  record: SerializedSurveySend;
  lang: Lang;
  onClose: () => void;
  onSave: (triggerAt: string) => void;
}) {
  const [value, setValue] = useState(record.triggerAt ? record.triggerAt.slice(0, 16) : '');
  const [pending, startTransition] = useTransition();

  return (
    <div className="guest-detail-modal" role="presentation" onMouseDown={onClose}>
      <div className="guest-detail-modal-card" role="dialog" aria-modal onMouseDown={(e) => e.stopPropagation()}>
        <span className="guest-detail-modal-icon"><Bell /></span>
        <h2>{L(['Anket Zamanını Düzenle', 'Edit Survey Trigger'], lang)}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 6px' }}>
          <strong>{record.guest.name}</strong> · {L(['Oda', 'Room'], lang)} {record.guest.room}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 14px' }}>
          {L(['Misafirin ankete yönlendirileceği tarih ve saati ayarlayın.', 'Set when the guest will be shown the survey.'], lang)}
        </p>
        <input
          type="datetime-local"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--line)', fontSize: 14, marginBottom: 16 }}
        />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn--ghost" type="button" onClick={onClose} disabled={pending}>
            {L(['İptal', 'Cancel'], lang)}
          </button>
          <button
            className="btn btn--primary"
            type="button"
            disabled={!value || pending}
            onClick={() => {
              if (!value) return;
              startTransition(() => { onSave(new Date(value).toISOString()); });
            }}
          >
            {L(['Kaydet', 'Save'], lang)}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Modal to add a new survey send by picking a guest and trigger time.
 *  Guest list comes from the already-loaded `records` (stays that have a triggerAt).
 *  For adding a guest that doesn't yet have one, we need the full stays list — kept simple
 *  here: user navigates to the guest detail and uses the KPI edit button.  */
function NewSendModal({
  lang,
  hotelId,
  onClose,
}: {
  lang: Lang;
  hotelId: string;
  onClose: () => void;
}) {
  return (
    <div className="guest-detail-modal" role="presentation" onMouseDown={onClose}>
      <div className="guest-detail-modal-card" role="dialog" aria-modal onMouseDown={(e) => e.stopPropagation()}>
        <span className="guest-detail-modal-icon"><ClipboardList /></span>
        <h2>{L(['Anket Zamanı Ekle', 'Add Survey Trigger'], lang)}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 16px' }}>
          {L(
            ['Anket zamanı eklemek için misafir detay sayfasına gidin ve "Anket Zamanı" kartındaki kalem ikonuna tıklayın.',
             'To add a survey trigger, go to the guest detail page and click the pencil icon on the "Survey Time" card.'],
            lang,
          )}
        </p>
        <Link
          className="btn btn--primary"
          href={`/h/${hotelId}/guests`}
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}
        >
          {L(['Misafir Listesine Git', 'Go to Guests'], lang)}
        </Link>
      </div>
    </div>
  );
}

export function GuestSurveySendsClient({
  hotelId,
  lang,
  records: initialRecords,
  onSetTrigger,
}: {
  hotelId: string;
  lang: Lang;
  records: SerializedSurveySend[];
  onSetTrigger?: (guestStayId: string, triggerAt: string | null) => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [filter, setFilter] = useState<'all' | SurveySendStatus>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<SerializedSurveySend | null>(null);
  const [newOpen, setNewOpen] = useState(false);

  const counts = useMemo(() => ({
    all: records.length,
    sent: records.filter((r) => r.status === 'sent').length,
    completed: records.filter((r) => r.status === 'completed').length,
    scheduled: records.filter((r) => r.status === 'scheduled').length,
  }), [records]);

  const filtered = useMemo(() => {
    const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
    const q = search.trim().toLocaleLowerCase(locale);
    return records.filter((r) => {
      if (filter !== 'all' && r.status !== filter) return false;
      if (!q) return true;
      return [r.guest.name, r.guest.email ?? '', r.surveyName ?? ''].some((v) => v.toLocaleLowerCase(locale).includes(q));
    });
  }, [records, filter, search, lang]);

  async function handleSave(guestStayId: string, triggerAt: string) {
    if (!onSetTrigger) return;
    const res = await onSetTrigger(guestStayId, triggerAt);
    if (res.ok) {
      setRecords((prev) => prev.map((r) => r.id === guestStayId ? { ...r, triggerAt, status: 'scheduled' as const } : r));
    }
    setEditing(null);
  }

  return (
    <div className="guests-page guest-survey-sends-page">
      <div className="page-hero guests-hero">
        <div>
          <h1 className="page-hero__h">{L(['Anket Gönderimleri', 'Survey Sends'], lang)}</h1>
          <p className="page-hero__sub">
            {L(['Gönderilen ve zamanlanan check-out anketleri.', 'Checkout surveys sent and scheduled to guests.'], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          <Link className="btn btn--primary" href={`/h/${hotelId}/guests/survey-sends/new`}>
            <Plus size={16} />{L(['Yeni Ekle', 'New Survey'], lang)}
          </Link>
        </div>
      </div>

      <div className="grid grid--kpi guest-comms-kpis">
        <Kpi icon={<Send />}    label={L(['Gönderildi', 'Sent'], lang)}       value={String(counts.sent)} />
        <Kpi icon={<Check />}   label={L(['Tamamlandı', 'Completed'], lang)}   value={String(counts.completed)} />
        <Kpi icon={<Clock3 />}  label={L(['Zamanlandı', 'Scheduled'], lang)}   value={String(counts.scheduled)} />
      </div>

      <div className="guests-toolbar guest-comms-toolbar">
        <div className="guests-chips" role="group">
          {([
            ['all',       L(['Tümü', 'All'], lang),           counts.all],
            ['sent',      L(['Gönderildi', 'Sent'], lang),    counts.sent],
            ['completed', L(['Tamamlandı', 'Completed'], lang), counts.completed],
            ['scheduled', L(['Zamanlandı', 'Scheduled'], lang), counts.scheduled],
          ] as const).map(([value, label, count]) => (
            <button key={value} className={`guests-chip${filter === value ? ' active' : ''}`} type="button" onClick={() => setFilter(value)}>
              {label}<span>{count}</span>
            </button>
          ))}
        </div>
        <label className="searchmini guests-search">
          <Search size={15} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={L(['Misafir veya anket ara…', 'Search guest or survey…'], lang)}
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} style={{ all: 'unset', cursor: 'pointer', display: 'flex', color: 'var(--text-3)' }}>
              <X size={13} />
            </button>
          )}
        </label>
      </div>

      <section className="card guests-card guest-comms-card">
        <div className="card__head">
          <div>
            <h2 className="card__title">{L(['Anket Gönderimleri', 'Survey Sends'], lang)}</h2>
            <p className="card__sub">{filtered.length} {L(['kayıt', 'records'], lang)}</p>
          </div>
        </div>
        <div className="card__body guests-table-wrap">
          <table className="table guest-comms-table">
            <thead>
              <tr>
                <th>{L(['Misafir', 'Guest'], lang)}</th>
                <th>{L(['Anket', 'Survey'], lang)}</th>
                <th>{L(['Tarih / Saat', 'Date / Time'], lang)}</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const { date, time } = fmtTrigger(r.triggerAt);
                return (
                  <tr
                    key={r.id}
                    className="row-link"
                    tabIndex={0}
                    aria-label={`${r.guest.name} · ${r.surveyName ?? ''}`}
                    onClick={() => router.push(`/h/${hotelId}/guests/survey-sends/${r.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(`/h/${hotelId}/guests/survey-sends/${r.id}`);
                      }
                    }}
                  >
                    <td>
                      <div
                        className="set-mem"
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}
                      >
                        <div className="set-mem__av" style={{ background: r.guest.color }}>{r.guest.initials}</div>
                        <div>
                          <div className="set-mem__n">{r.guest.name}</div>
                          <div className="cell-sub">{L(['Oda', 'Room'], lang)} {r.guest.room} · {r.guest.hotel}</div>
                        </div>
                      </div>
                    </td>
                    <td className="guest-email-subject">
                      {r.surveyName ?? L(['Checkout Anketi', 'Checkout Survey'], lang)}
                    </td>
                    <td className="mono cell-sub">{date}{time ? ` · ${time}` : ''}</td>
                    <td><StatusBadge status={r.status} lang={lang} /></td>
                  </tr>
                );
              })}
              {!filtered.length && (
                <tr>
                  <td className="guests-empty" colSpan={4}>
                    {records.length === 0
                      ? L(['Henüz anket zamanı ayarlanmamış. Misafir detay sayfasından "Anket Zamanı" KPI kartını kullanın.', 'No survey triggers set yet. Use the "Survey Time" KPI card on a guest detail page.'], lang)
                      : L(['Kayıt bulunamadı.', 'No records found.'], lang)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {editing && (
        <EditTriggerModal
          record={editing}
          lang={lang}
          onClose={() => setEditing(null)}
          onSave={(triggerAt) => handleSave(editing.id, triggerAt)}
        />
      )}

      {newOpen && (
        <NewSendModal lang={lang} hotelId={hotelId} onClose={() => setNewOpen(false)} />
      )}
    </div>
  );
}
