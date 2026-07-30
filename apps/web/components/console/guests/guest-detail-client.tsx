'use client';

import Link from 'next/link';
import { useTransition, useState } from 'react';
import {
  Bell,
  Building2,
  CalendarDays,
  ClipboardList,
  Clock3,
  CreditCard,
  Download,
  Globe2,
  Layers3,
  Link2,
  Mail,
  MessageSquare,
  Monitor,
  Pencil,
  Phone,
  Power,
  Printer,
  Send,
  Star,
  Trash2,
  Wifi,
  X,
} from 'lucide-react';
import { Kpi } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';

export interface SerializedSession {
  id: string;
  mac: string;
  ip: string;
  start: string | null;
  stop: string | null;
  duration: string;
  data: string;
  active: boolean;
}

export interface SerializedGuestDetail {
  id: string;
  name: string;
  initials: string;
  color: string;
  room: string;
  hotelName: string | null;
  checkin: string;
  checkout: string;
  status: 'inhouse' | 'checked-out';
  phone: string | null;
  email: string | null;
  country: string | null;
  roomType: string | null;
  agency: string | null;
  currency: string | null;
  birthDate: string;
  createdAt: string;
  online: boolean;
  dataToday: string;
  activeDevices: number;
  sessions: SerializedSession[];
  surveyTriggerAt: string | null;
  surveyShownAt: string | null;
  latestSurveySendId: string | null;
}

function InfoRow({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  if (!value) return null;
  return (
    <div className="stat-row guest-detail-info-row">
      <span className="stat-row__k">{icon}{label}</span>
      <span className={`stat-row__v${mono ? ' mono' : ''}`}>{value}</span>
    </div>
  );
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

type GuestActionKind = 'email' | 'survey' | 'welcome';

function toDateInputValue(value: string): string {
  const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : value.slice(0, 10);
}

function GuestActionModal({
  action,
  guest,
  lang,
  onClose,
  onSent,
  onSetSurveyTrigger,
}: {
  action: GuestActionKind;
  guest: SerializedGuestDetail;
  lang: Lang;
  onClose: () => void;
  onSent: (message: string) => void;
  onSetSurveyTrigger?: (guestId: string, triggerAt: string | null) => Promise<{ ok: boolean }>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [survey, setSurvey] = useState(L(['Check-out Geri Bildirimi', 'Check-out Feedback'], lang));
  const [date, setDate] = useState(action === 'survey' ? toDateInputValue(guest.checkout) : today);
  const [time, setTime] = useState('10:00');
  const [pending, startTransition] = useTransition();

  const content = {
    email: {
      title: L(['E-posta Gönder', 'Send Email'], lang),
      subtitle: L(['Misafire özel bir e-posta gönderin.', 'Send a custom email to the guest.'], lang),
      success: L(['E-posta gönderildi.', 'Email sent.'], lang),
    },
    survey: {
      title: L(['Check-out Anketi Gönder', 'Send Checkout Survey'], lang),
      subtitle: L(['Misafir için otomatik geri bildirim anketi planlayın.', 'Schedule an automated feedback survey for the guest.'], lang),
      success: L(['Check-out anketi planlandı.', 'Checkout survey scheduled.'], lang),
    },
    welcome: {
      title: L(['Karşılama Mesajı Gönder', 'Send Welcome Message'], lang),
      subtitle: L(['Misafirin portalına bir mesaj gönderin.', "Send a message to the guest's portal."], lang),
      success: L(['Karşılama mesajı planlandı.', 'Welcome message scheduled.'], lang),
    },
  }[action];

  return (
    <div className="guest-action-modal-overlay" role="presentation" onMouseDown={onClose}>
      <form
        className="guest-action-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-action-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          if (action === 'survey' && onSetSurveyTrigger) {
            const iso = new Date(`${date}T${time}`).toISOString();
            startTransition(async () => {
              await onSetSurveyTrigger(guest.id, iso);
              onSent(content.success);
            });
          } else {
            onSent(content.success);
          }
        }}
      >
        <div className="guest-action-modal__head">
          <div>
            <h2 id="guest-action-modal-title">{content.title}</h2>
            <p>{content.subtitle}</p>
          </div>
          <button
            type="button"
            className="guest-action-modal__close"
            onClick={onClose}
            aria-label={L(['Kapat', 'Close'], lang)}
          >
            <X />
          </button>
        </div>

        <div className="guest-action-modal__body">
          <label className="guest-action-field">
            <span>{L(['Alıcı', 'To'], lang)}</span>
            <div className="finput guest-action-readonly">
              {guest.name} · {guest.email || '—'}
            </div>
          </label>

          {action === 'email' && (
            <>
              <label className="guest-action-field">
                <span>{L(['Konu', 'Subject'], lang)}</span>
                <input
                  className="finput"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder={L(['örn. Rezervasyon Onayı', 'e.g. Booking Confirmation'], lang)}
                  required
                />
              </label>
              <label className="guest-action-field">
                <span>{L(['Mesaj', 'Message'], lang)}</span>
                <textarea
                  className="ftextarea guest-action-textarea guest-action-textarea--email"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={L(['E-posta içeriğini yazın…', 'Write email content…'], lang)}
                  required
                />
              </label>
            </>
          )}

          {action === 'survey' && (
            <label className="guest-action-field">
              <span>{L(['Anket', 'Survey'], lang)}</span>
              <select className="fselect" value={survey} onChange={(event) => setSurvey(event.target.value)}>
                <option>{L(['Check-out Geri Bildirimi', 'Check-out Feedback'], lang)}</option>
                <option>{L(['Konaklama Ortası Nabzı', 'Mid-Stay Pulse'], lang)}</option>
                <option>{L(['Etkinlik Geri Bildirimi', 'Event Feedback'], lang)}</option>
              </select>
            </label>
          )}

          {action === 'welcome' && (
            <>
              <label className="guest-action-field">
                <span>{L(['Başlık', 'Title'], lang)}</span>
                <input
                  className="finput"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder={L(['örn. Hoş geldiniz!', 'e.g. Welcome!'], lang)}
                  required
                />
              </label>
              <label className="guest-action-field">
                <span>{L(['Mesaj', 'Message'], lang)}</span>
                <textarea
                  className="ftextarea guest-action-textarea"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={L(['Mesajınızı yazın…', 'Write your message…'], lang)}
                  required
                />
              </label>
            </>
          )}

          {action !== 'email' && (
            <>
              <div className="guest-action-date-grid">
                <label className="guest-action-field">
                  <span>{L(['Tarih', 'Date'], lang)}</span>
                  <input className="finput" type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
                </label>
                <label className="guest-action-field">
                  <span>{L(['Saat', 'Time'], lang)}</span>
                  <input className="finput" type="time" value={time} onChange={(event) => setTime(event.target.value)} required />
                </label>
              </div>
              <p className="guest-action-hint">
                {action === 'survey'
                  ? L(['Check-out anketi bu tarih ve saatte misafire gönderilecek.', 'The checkout survey will be sent to the guest at this date and time.'], lang)
                  : L(['Karşılama mesajı bu tarih ve saatte misafir portalına gönderilecek.', "The welcome message will be sent to the guest's portal at this date and time."], lang)}
              </p>
            </>
          )}
        </div>

        <div className="guest-action-modal__foot">
          <button className="btn btn--ghost" type="button" onClick={onClose}>
            {L(['İptal', 'Cancel'], lang)}
          </button>
          <button className="btn btn--primary" type="submit">
            <Send />
            {L(['Gönder', 'Send'], lang)}
          </button>
        </div>
      </form>
    </div>
  );
}

export function GuestDetailClient({
  guest,
  hotelId,
  lang,
  onSetSurveyTrigger,
}: {
  guest: SerializedGuestDetail;
  hotelId: string;
  lang: Lang;
  onSetSurveyTrigger?: (guestId: string, triggerAt: string | null) => Promise<{ ok: boolean }>;
}) {
  const [search, setSearch] = useState('');
  const [noteValue, setNoteValue] = useState('');
  const [notes, setNotes] = useState<{ id: string; text: string; timestamp: string }[]>([]);
  const [notice, setNotice] = useState('');
  const [actionModal, setActionModal] = useState<GuestActionKind | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [triggerOpen, setTriggerOpen] = useState(false);
  const [triggerValue, setTriggerValue] = useState(
    guest.surveyTriggerAt ? guest.surveyTriggerAt.slice(0, 16) : '',
  );
  const [, startTriggerTransition] = useTransition();

  const addNote = () => {
    const v = noteValue.trim();
    if (!v) return;
    setNotes((n) => [{ id: `note-${Date.now()}`, text: v, timestamp: L(['şimdi', 'now'], lang) }, ...n]);
    setNoteValue('');
  };

  const filteredSessions = guest.sessions.filter((s) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return [s.mac, s.ip].some((v) => v.toLowerCase().includes(q));
  });

  return (
    <div className="guest-detail-page">
      <div className="guest-detail-breadcrumb">
        <Link href={`/h/${hotelId}/guests`}>{L(['Misafirler', 'Guests'], lang)}</Link>
        <span>›</span>
        <strong>{guest.name}</strong>
      </div>

      <header className="guest-detail-head">
        <div className="guest-detail-avatar" style={{ background: guest.color }}>{guest.initials}</div>
        <div className="guest-detail-identity">
          <div className="guest-detail-titleline">
            <h1>{guest.name}</h1>
            {guest.status === 'inhouse' ? (
              <span className="badge badge--ok"><span className="ico-dot" />{L(['Otelde', 'In-House'], lang)}</span>
            ) : (
              <span className="badge badge--mute">{L(['Çıkış Yaptı', 'Checked Out'], lang)}</span>
            )}
          </div>
          <p>{L(['Oda', 'Room'], lang)} {guest.room} · {guest.checkin} – {guest.checkout}</p>
        </div>
      </header>

      <div className="grid grid--kpi guest-detail-kpis">
        <Kpi icon={<Download />} label={L(['Bugünkü Veri', 'Data Used Today'], lang)} value={guest.dataToday} />
        <Kpi icon={<Monitor />} label={L(['Bağlı Cihaz', 'Connected Devices'], lang)} value={String(guest.activeDevices)} />
        <Kpi icon={<Wifi />} label={L(['Bağlantı', 'Connection'], lang)} value={guest.online ? L(['Bağlı', 'Online'], lang) : L(['Bağlı Değil', 'Offline'], lang)} live={guest.online} />
        <Kpi icon={<CalendarDays />} label="Check-out" value={guest.checkout} />
        <div style={{ position: 'relative' }}>
          <Kpi
            icon={<Bell />}
            label={L(['Anket Zamanı', 'Survey Time'], lang)}
            value={guest.surveyTriggerAt ? fmtDateTime(guest.surveyTriggerAt) : '—'}
            note={guest.surveyShownAt ? L(['Gösterildi ✓', 'Shown ✓'], lang) : undefined}
          />
          {onSetSurveyTrigger && (
            <button
              type="button"
              title={L(['Düzenle', 'Edit'], lang)}
              onClick={() => setTriggerOpen(true)}
              style={{ position: 'absolute', top: 8, right: 8, padding: 4, border: 0, background: 'none', color: 'var(--text-3)', cursor: 'pointer', borderRadius: 4 }}
            >
              <Pencil size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="guest-detail-main">
        <section className="card guest-detail-information">
          <div className="card__head">
            <div>
              <h2 className="card__title">{L(['Misafir Bilgileri', 'Guest Information'], lang)}</h2>
              <p className="card__sub">{L(['guest_stays kaydı', 'guest_stays record'], lang)}</p>
            </div>
          </div>
          <div className="card__body">
            <InfoRow icon={<Phone />} label={L(['Telefon', 'Phone'], lang)} value={guest.phone} mono />
            <InfoRow icon={<Mail />} label={L(['E-posta', 'Email'], lang)} value={guest.email} mono />
            <InfoRow icon={<CalendarDays />} label={L(['Doğum Tarihi', 'Birth Date'], lang)} value={guest.birthDate} mono />
            <InfoRow icon={<Globe2 />} label={L(['Ülke', 'Country'], lang)} value={guest.country} />
            <InfoRow icon={<Building2 />} label={L(['Otel / Oda', 'Hotel / Room'], lang)} value={guest.hotelName ? `${guest.hotelName} · ${guest.room}` : guest.room} />
            <InfoRow icon={<Layers3 />} label={L(['Oda Tipi', 'Room Type'], lang)} value={guest.roomType} />
            <InfoRow icon={<CalendarDays />} label={L(['Konaklama', 'Stay'], lang)} value={`${guest.checkin} – ${guest.checkout}`} />
            <InfoRow icon={<Link2 />} label={L(['Acenta', 'Agency'], lang)} value={guest.agency} />
            <InfoRow icon={<CreditCard />} label={L(['Para Birimi', 'Currency'], lang)} value={guest.currency} mono />
            <InfoRow icon={<Star />} label={L(['Sadakat Seviyesi', 'Loyalty Tier'], lang)} value={L(['Standart', 'Standard'], lang)} />
            <InfoRow icon={<Clock3 />} label={L(['Kayıt Tarihi', 'Created At'], lang)} value={guest.createdAt} mono />
          </div>
        </section>

        <aside className="guest-detail-side">
          {/* Actions */}
          <section className="card">
            <div className="card__head"><h2 className="card__title">{L(['İşlemler', 'Actions'], lang)}</h2></div>
            <div className="card__body guest-detail-actions">
              {[
                { kind: 'email' as const, icon: <Mail />, label: L(['E-posta Gönder', 'Send Email'], lang) },
                { kind: 'survey' as const, icon: <ClipboardList />, label: L(['Check-out Anketi Gönder', 'Send Checkout Survey'], lang) },
                { kind: 'welcome' as const, icon: <MessageSquare />, label: L(['Karşılama Mesajı Gönder', 'Send Welcome Message'], lang) },
              ].map((item) => (
                <button key={item.kind} type="button" onClick={() => setActionModal(item.kind)}>
                  <span>{item.icon}</span>{item.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setNotice(L(['Kayıt formu yazdırılmaya hazır.', 'Registration card is ready to print.'], lang));
                  window.print();
                }}
              >
                <span><Printer /></span>{L(['Kayıt Formunu Yazdır', 'Print Registration Card'], lang)}
              </button>
              {guest.online && (
                <button type="button" onClick={() => setNotice(L(['Bağlantı kesildi.', 'Disconnected.'], lang))}>
                  <span><Power /></span>{L(['Bağlantıyı Kes', 'Disconnect Wi-Fi'], lang)}
                </button>
              )}
              <button className="danger" type="button" onClick={() => setRemoveOpen(true)}>
                <span><Trash2 /></span>{L(['Misafiri Sil', 'Remove Guest'], lang)}
              </button>
            </div>
          </section>

          {/* Notes */}
          <section className="card">
            <div className="card__head"><h2 className="card__title">{L(['Notlar', 'Notes'], lang)}</h2></div>
            <div className="card__body">
              <div className="guest-detail-noteform">
                <input
                  className="finput"
                  value={noteValue}
                  onChange={(e) => setNoteValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addNote(); }}
                  placeholder={L(['Not ekle…', 'Add a note…'], lang)}
                />
                <button className="btn btn--primary btn--sm" type="button" onClick={addNote}>{L(['Ekle', 'Add'], lang)}</button>
              </div>
              {notes.length > 0 ? (
                <div className="feed">
                  {notes.map((n) => (
                    <div className="feed__item" key={n.id}>
                      <span className="feed__ico guest-detail-feed-icon"><MessageSquare /></span>
                      <div className="feed__body">
                        <div className="feed__text">{n.text}</div>
                        <div className="feed__meta">{n.timestamp}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="guest-detail-empty">{L(['Henüz not yok.', 'No notes yet.'], lang)}</p>
              )}
            </div>
          </section>

          {/* Tickets */}
          <section className="card">
            <div className="card__head"><h2 className="card__title">{L(['Talepler / Şikayetler', 'Tickets / Complaints'], lang)}</h2></div>
            <div className="card__body">
              <p className="guest-detail-empty">{L(['Kayıtlı talep yok.', 'No tickets on file.'], lang)}</p>
            </div>
          </section>

          {/* Completed Surveys */}
          <section className="card">
            <div className="card__head"><h2 className="card__title">{L(['Tamamlanan Anketler', 'Completed Surveys'], lang)}</h2></div>
            <div className="card__body">
              <p className="guest-detail-empty">{L(['Henüz anket tamamlamadı.', 'No surveys completed yet.'], lang)}</p>
            </div>
          </section>
        </aside>
      </div>

      {/* Notice */}
      {notice && (
        <div className="guests-notice guest-detail-notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label={L(['Kapat', 'Dismiss'], lang)}>×</button>
        </div>
      )}

      {actionModal && (
        <GuestActionModal
          action={actionModal}
          guest={guest}
          lang={lang}
          onClose={() => setActionModal(null)}
          onSent={(message) => {
            setActionModal(null);
            setNotice(message);
          }}
          onSetSurveyTrigger={onSetSurveyTrigger}
        />
      )}

      {/* Survey trigger edit modal */}
      {triggerOpen && (
        <div className="guest-detail-modal" role="presentation" onMouseDown={() => setTriggerOpen(false)}>
          <div className="guest-detail-modal-card" role="dialog" aria-modal onMouseDown={(e) => e.stopPropagation()}>
            <span className="guest-detail-modal-icon"><Bell /></span>
            <h2>{L(['Anket Zamanını Düzenle', 'Edit Survey Trigger Time'], lang)}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: '0 0 14px' }}>
              {L(['Misafirin ankete yönlendirileceği tarih ve saati ayarlayın.', 'Set the date and time when the guest will be redirected to the survey.'], lang)}
            </p>
            <input
              type="datetime-local"
              value={triggerValue}
              onChange={(e) => setTriggerValue(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: 'var(--r-md)', border: '1px solid var(--line)', fontSize: 14, marginBottom: 16 }}
            />
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn--ghost" type="button" onClick={() => setTriggerOpen(false)}>{L(['İptal', 'Cancel'], lang)}</button>
              <button
                className="btn btn--primary"
                type="button"
                onClick={() => {
                  if (!onSetSurveyTrigger) return;
                  startTriggerTransition(async () => {
                    const iso = triggerValue ? new Date(triggerValue).toISOString() : null;
                    await onSetSurveyTrigger(guest.id, iso);
                    setTriggerOpen(false);
                  });
                }}
              >
                {L(['Kaydet', 'Save'], lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove modal */}
      {removeOpen && (
        <div className="guest-detail-modal" role="presentation" onMouseDown={() => setRemoveOpen(false)}>
          <div className="guest-detail-modal-card" role="dialog" aria-modal onMouseDown={(e) => e.stopPropagation()}>
            <span className="guest-detail-modal-icon"><Trash2 /></span>
            <h2>{L(['Misafiri kaldır', 'Remove guest'], lang)}</h2>
            <p>{L([`${guest.name} misafir listesinden kaldırılacak.`, `${guest.name} will be removed from the guest list.`], lang)}</p>
            <div>
              <button className="btn btn--ghost" type="button" onClick={() => setRemoveOpen(false)}>{L(['İptal', 'Cancel'], lang)}</button>
              <button className="btn btn--dangerghost" type="button" onClick={() => setRemoveOpen(false)}>
                <Trash2 />{L(['Kaldır', 'Remove'], lang)}
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="card guest-detail-history">
        <div className="card__head guest-detail-history-head">
          <div>
            <h2 className="card__title"><Wifi size={16} style={{ display: 'inline', marginRight: 6 }} />{L(['Bağlantı Geçmişi', 'Connection History'], lang)}</h2>
            <p className="card__sub">{filteredSessions.length} {L(['kayıt', 'records'], lang)}</p>
          </div>
          <label className="searchmini guest-detail-history-search">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={L(['MAC veya IP ara…', 'Search MAC or IP…'], lang)}
            />
          </label>
        </div>
        <div className="card__body guest-detail-history-table">
          {filteredSessions.length === 0 ? (
            <p className="guest-detail-table-empty">{L(['Bağlantı kaydı bulunamadı.', 'No connection records found.'], lang)}</p>
          ) : (
            <table className="table guest-detail-connections-table">
              <thead>
                <tr>
                  <th>MAC</th>
                  <th>IP</th>
                  <th>{L(['Başlangıç', 'Start'], lang)}</th>
                  <th>{L(['Süre', 'Duration'], lang)}</th>
                  <th>{L(['Veri', 'Data'], lang)}</th>
                  <th>{L(['Durum', 'Status'], lang)}</th>
                </tr>
              </thead>
              <tbody>
                {filteredSessions.map((s) => (
                  <tr key={s.id}>
                    <td className="mono cell-sub">{s.mac}</td>
                    <td className="mono cell-sub">{s.ip}</td>
                    <td className="mono cell-sub">{fmtDateTime(s.start)}</td>
                    <td className="mono">{s.duration}</td>
                    <td className="mono">{s.data}</td>
                    <td>
                      {s.active ? (
                        <span className="badge badge--ok"><span className="ico-dot" />{L(['Aktif', 'Active'], lang)}</span>
                      ) : (
                        <span className="badge badge--mute">{L(['Sonlandı', 'Ended'], lang)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
