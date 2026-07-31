'use client';

import { type ReactNode, useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CalendarDays,
  Check,
  ClipboardList,
  Clock3,
  Pause,
  Pencil,
  Play,
  RefreshCw,
  Search,
  Send,
  Smile,
  Trash2,
  X,
} from 'lucide-react';
import { Kpi } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';

export type PopupSendStatus = 'scheduled' | 'sent' | 'completed';
export type PopupType = 'survey' | 'event' | 'announcement';

export interface SerializedPopupSend {
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
  popupType: PopupType;
  popupTitle: string | null;
  triggerAt: string | null;
  kickedAt: string | null;
  shownAt: string | null;
  status: PopupSendStatus;
}

export type AutomationKind = 'checkout' | 'default';
export type AutomationStatus = 'active' | 'paused';
export type AutomationTiming = 'd3' | 'd2' | 'd1' | 'd0' | 'every';

export interface PopupAutomation {
  id: string;
  kind: AutomationKind;
  timing: AutomationTiming;
  status: AutomationStatus;
}

function automationTimingLabel(automation: PopupAutomation, lang: Lang) {
  const labels: Record<AutomationTiming, [string, string]> = {
    d3: ['Çıkıştan 3 gün önce', '3 days before check-out'],
    d2: ['Çıkıştan 2 gün önce', '2 days before check-out'],
    d1: ['Çıkıştan 1 gün önce', '1 day before check-out'],
    d0: ['Çıkış günü', 'On check-out day'],
    every: ['Tamamlanana kadar her girişte', 'Every check-in until completed'],
  };
  return L(labels[automation.timing], lang);
}

function automationCopy(automation: PopupAutomation, lang: Lang) {
  const timing = automationTimingLabel(automation, lang);
  if (automation.kind === 'checkout') {
    return {
      title: L(['Çıkış Anketi', 'Checkout Survey'], lang),
      subtitle: `${timing} · ${L(['Tüm misafirler', 'All guests'], lang)}`,
      Icon: ClipboardList,
      tone: 'checkout',
    };
  }

  return {
    title: L(['Varsayılan Anket', 'Default Survey'], lang),
    subtitle: `${timing} · ${L(['Tüm misafirler', 'All guests'], lang)}`,
    Icon: Smile,
    tone: 'default',
  };
}

function PopupTypeBadge({ type, lang }: { type: PopupType; lang: Lang }) {
  const Icon = type === 'event' ? CalendarDays : type === 'announcement' ? Bell : ClipboardList;
  const label =
    type === 'event'
      ? L(['Etkinlik', 'Event'], lang)
      : type === 'announcement'
        ? L(['Duyuru', 'Announcement'], lang)
        : L(['Anket', 'Survey'], lang);
  return (
    <span className={`badge guest-popup-type type-${type}`}>
      <Icon size={12} />
      {label}
    </span>
  );
}

function StatusBadge({ status, lang }: { status: PopupSendStatus; lang: Lang }) {
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
  record: SerializedPopupSend;
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
        <h2>{L(['Popup Zamanını Düzenle', 'Edit Popup Trigger'], lang)}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 6px' }}>
          <strong>{record.guest.name}</strong> · {L(['Oda', 'Room'], lang)} {record.guest.room}
        </p>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 14px' }}>
          {L(['Misafirin popup\'ı göreceği tarih ve saati ayarlayın.', 'Set when the guest will be shown the popup.'], lang)}
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

/** Modal to add a new popup send by picking a guest and trigger time.
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
        <h2>{L(['Popup Zamanı Ekle', 'Add Popup Trigger'], lang)}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 16px' }}>
          {L(
            ['Popup zamanı eklemek için misafir detay sayfasına gidin ve "Anket Zamanı" kartındaki kalem ikonuna tıklayın.',
             'To add a popup trigger, go to the guest detail page and click the pencil icon on the "Survey Time" card.'],
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

function AutomationsSection({
  lang,
  automations,
  onOpen,
  onToggle,
  onEdit,
  onDelete,
}: {
  lang: Lang;
  automations: PopupAutomation[];
  onOpen: (automation: PopupAutomation) => void;
  onToggle: (id: string) => void;
  onEdit: (automation: PopupAutomation) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="card guest-popup-automations" id="popup-automations">
      <div className="guest-popup-automations__head">
        <h2>{L(['Otomasyonlar', 'Automations'], lang)}</h2>
        <p>
          {L(
            ['Giriş/çıkış tarihlerine göre otomatik gönderilen popup kuralları.', 'Popup rules sent automatically based on check-in/check-out dates.'],
            lang,
          )}
        </p>
      </div>
      <div className="guest-popup-automations__list">
        {automations.map((automation) => {
          const copy = automationCopy(automation, lang);
          const Icon = copy.Icon;
          const active = automation.status === 'active';
          return (
            <div
              className="guest-popup-automation-row"
              key={automation.id}
              role="link"
              tabIndex={0}
              onClick={() => onOpen(automation)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpen(automation);
                }
              }}
            >
              <span className={`guest-popup-automation-row__icon tone-${copy.tone}`}><Icon size={20} /></span>
              <div className="guest-popup-automation-row__copy">
                <strong>{copy.title}</strong>
                <span>{copy.subtitle}</span>
              </div>
              <span className={`guest-popup-automation-row__status ${active ? 'is-active' : 'is-paused'}`}>
                <Check size={13} />
                {active ? L(['Aktif', 'Active'], lang) : L(['Duraklatıldı', 'Paused'], lang)}
              </span>
              <div className="guest-popup-automation-row__actions">
                <button type="button" onClick={(event) => { event.stopPropagation(); onToggle(automation.id); }} aria-label={active ? L(['Duraklat', 'Pause'], lang) : L(['Etkinleştir', 'Activate'], lang)}>
                  {active ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button type="button" onClick={(event) => { event.stopPropagation(); onEdit(automation); }} aria-label={L(['Düzenle', 'Edit'], lang)}>
                  <Pencil size={18} />
                </button>
                <button className="danger" type="button" onClick={(event) => { event.stopPropagation(); onDelete(automation.id); }} aria-label={L(['Sil', 'Delete'], lang)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
        {!automations.length && (
          <div className="guest-popup-automations__empty">
            {L(['Henüz otomasyon bulunmuyor.', 'No automations yet.'], lang)}
          </div>
        )}
      </div>
    </section>
  );
}

export function GuestPopupSendsClient({
  hotelId,
  lang,
  records: initialRecords,
  automations: initialAutomations,
  basePath,
  hideHero,
  subnav,
  onSetTrigger,
  onToggleAutomation,
  onDeleteAutomation,
}: {
  hotelId: string;
  lang: Lang;
  records: SerializedPopupSend[];
  automations: PopupAutomation[];
  basePath?: string;
  hideHero?: boolean;
  subnav?: ReactNode;
  onSetTrigger?: (guestStayId: string, triggerAt: string | null) => Promise<{ ok: boolean }>;
  onToggleAutomation?: (automationId: string) => Promise<{ ok: boolean }>;
  onDeleteAutomation?: (automationId: string) => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const listHref = basePath ?? `/h/${hotelId}/surveys/sends`;
  const [records, setRecords] = useState(initialRecords);
  const [filter, setFilter] = useState<'all' | PopupSendStatus>('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<SerializedPopupSend | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [automations, setAutomations] = useState(initialAutomations);

  async function handleToggleAutomation(id: string) {
    if (!onToggleAutomation) return;
    const res = await onToggleAutomation(id);
    if (res.ok) {
      setAutomations((current) => current.map((automation) => (
        automation.id === id
          ? { ...automation, status: automation.status === 'active' ? 'paused' : 'active' }
          : automation
      )));
      router.refresh();
    }
  }

  async function handleDeleteAutomation(id: string) {
    if (!onDeleteAutomation) return;
    const res = await onDeleteAutomation(id);
    if (res.ok) {
      setAutomations((current) => current.filter((automation) => automation.id !== id));
      router.refresh();
    }
  }

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
      return [r.guest.name, r.guest.email ?? '', r.popupTitle ?? '', r.popupType].some((v) =>
        v.toLocaleLowerCase(locale).includes(q),
      );
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
      {!hideHero && (
        <div className="page-hero guests-hero">
          <div>
            <h1 className="page-hero__h">{L(['Popup Gönderimleri', 'Popup Sends'], lang)}</h1>
            <p className="page-hero__sub">
              {L(
                ["Misafirlere gönderilen anket, etkinlik ve duyuru popup'ları.", 'Survey, event, and announcement popups sent to guests.'],
                lang,
              )}
            </p>
          </div>
          <div className="page-hero__actions">
            <Link className="btn btn--ghost" href={`${listHref}/automations/new`}>
              <RefreshCw size={16} />{L(['Yeni Otomasyon', 'New Automation'], lang)}
            </Link>
            <Link className="btn btn--primary" href={`${listHref}/new`}>
              <Bell size={16} />{L(['Yeni Popup', 'New Popup'], lang)}
            </Link>
          </div>
        </div>
      )}

      {subnav}

      <div className="grid grid--kpi guest-comms-kpis">
        <Kpi icon={<Send />}    label={L(['Gönderildi', 'Sent'], lang)}       value={String(counts.sent)} />
        <Kpi icon={<Check />}   label={L(['Tamamlandı', 'Completed'], lang)}   value={String(counts.completed)} />
        <Kpi icon={<Clock3 />}  label={L(['Zamanlandı', 'Scheduled'], lang)}   value={String(counts.scheduled)} />
      </div>

      <AutomationsSection
        lang={lang}
        automations={automations}
        onOpen={(automation) => router.push(`${listHref}/automations/${automation.id}`)}
        onToggle={handleToggleAutomation}
        onEdit={(automation) => router.push(`${listHref}/automations/${automation.id}/edit`)}
        onDelete={handleDeleteAutomation}
      />

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
            placeholder={L(['Misafir veya konu ara…', 'Search guest or subject…'], lang)}
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
            <h2 className="card__title">{L(['Popup Gönderimleri', 'Popup Sends'], lang)}</h2>
            <p className="card__sub">{filtered.length} {L(['kayıt', 'records'], lang)}</p>
          </div>
        </div>
        <div className="card__body guests-table-wrap">
          <table className="table guest-comms-table">
            <thead>
              <tr>
                <th>{L(['Misafir', 'Guest'], lang)}</th>
                <th>{L(['Popup', 'Popup'], lang)}</th>
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
                    aria-label={`${r.guest.name} · ${r.popupTitle ?? ''}`}
                    onClick={() => router.push(`${listHref}/${r.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        router.push(`${listHref}/${r.id}`);
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
                      <div className="guest-popup-subject">
                        <PopupTypeBadge type={r.popupType} lang={lang} />
                        <span>{r.popupTitle ?? L(['Popup', 'Popup'], lang)}</span>
                      </div>
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
                      ? L(['Henüz popup gönderimi bulunmuyor.', 'No popup sends yet.'], lang)
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
