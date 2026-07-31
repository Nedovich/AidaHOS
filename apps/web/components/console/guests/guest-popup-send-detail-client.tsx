'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import {
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ClipboardList,
  Clock3,
  ExternalLink,
  Mail,
  Pencil,
  Phone,
  Send,
  WifiOff,
} from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';

export type PopupSendStatus = 'scheduled' | 'sent' | 'completed';
export type PopupType = 'survey' | 'event' | 'announcement';

export interface SerializedPopupSendDetail {
  id: string;
  guest: {
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
  triggerAt: string;
  kickedAt: string | null;
  shownAt: string | null;
  status: PopupSendStatus;
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

function popupTypeIcon(type: PopupType) {
  return type === 'event' ? CalendarDays : type === 'announcement' ? Bell : ClipboardList;
}

function popupTypeLabel(type: PopupType, lang: Lang): string {
  return type === 'event'
    ? L(['Etkinlik', 'Event'], lang)
    : type === 'announcement'
      ? L(['Duyuru', 'Announcement'], lang)
      : L(['Anket', 'Survey'], lang);
}

function InfoRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="stat-row guest-email-detail-row">
      <span className="stat-row__k">{icon}{label}</span>
      <span className="stat-row__v">{children}</span>
    </div>
  );
}

function fmtDt(iso: string): string {
  const d = new Date(iso);
  const date = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  return `${date} · ${time}`;
}

export function GuestPopupSendDetailClient({
  detail: initial,
  hotelId,
  lang,
  basePath,
  onMarkShown,
}: {
  detail: SerializedPopupSendDetail;
  hotelId: string;
  lang: Lang;
  basePath?: string;
  onMarkShown?: (id: string) => Promise<{ ok: boolean }>;
}) {
  const listHref = basePath ?? `/h/${hotelId}/surveys/sends`;
  const [detail, setDetail] = useState(initial);
  const [notice, setNotice] = useState('');
  const [, startTransition] = useTransition();

  function handleMarkShown() {
    if (!onMarkShown) return;
    startTransition(async () => {
      const res = await onMarkShown(detail.id);
      if (res.ok) {
        const now = new Date().toISOString();
        setDetail((d) => ({ ...d, shownAt: now, status: 'sent' }));
        setNotice(L(['Popup gönderildi olarak işaretlendi.', 'Popup marked as sent.'], lang));
      }
    });
  }

  const popupLabel = detail.popupTitle ?? popupTypeLabel(detail.popupType, lang);
  const PopupIcon = popupTypeIcon(detail.popupType);

  return (
    <div className="guest-email-detail-page guest-survey-detail-page">
      {/* Breadcrumb */}
      <div className="guest-survey-detail-nav">
        <Link
          className="guest-email-detail-back"
          href={listHref}
          aria-label={L(['Geri', 'Back'], lang)}
        >
          <ChevronLeft />
        </Link>
        <div className="guest-detail-breadcrumb">
          <Link href={listHref}>
            {L(['Popup Gönderimleri', 'Popup Sends'], lang)}
          </Link>
          <span>›</span>
          <strong>{popupLabel}</strong>
        </div>
      </div>

      {/* Header */}
      <header className="guest-email-detail-head guest-survey-detail-head">
        <div className={`guest-survey-detail-icon status-${detail.status}`}>
          <PopupIcon />
        </div>
        <div className="guest-email-detail-identity">
          <div className="guest-email-detail-titleline">
            <h1>{popupLabel}</h1>
            <StatusBadge status={detail.status} lang={lang} />
          </div>
          <p>
            {detail.guest.name} · {L(['Oda', 'Room'], lang)} {detail.guest.room} · {fmtDt(detail.triggerAt)}
          </p>
        </div>
        <div className="guest-email-detail-actions">
          <Link className="btn btn--ghost" href={`/h/${hotelId}/guests/${detail.id}`}>
            <ExternalLink />{L(['Misafire Git', 'Go to Guest'], lang)}
          </Link>
          {detail.status === 'scheduled' && (
            <Link className="btn btn--ghost" href={`${listHref}/${detail.id}/edit`}>
              <Pencil />{L(['Düzenle', 'Edit'], lang)}
            </Link>
          )}
          {detail.status === 'scheduled' && onMarkShown && (
            <button className="btn btn--primary" type="button" onClick={handleMarkShown}>
              <Send />{L(['Şimdi Gönder', 'Send Now'], lang)}
            </button>
          )}
          {detail.status === 'sent' && onMarkShown && (
            <button className="btn btn--primary" type="button" onClick={handleMarkShown}>
              <Send />{L(['Yeniden Gönder', 'Resend'], lang)}
            </button>
          )}
        </div>
      </header>

      {notice && (
        <div className="guests-notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label={L(['Kapat', 'Dismiss'], lang)}>×</button>
        </div>
      )}

      <div className="guest-email-detail-layout">
        {/* Main */}
        <div className="guest-survey-detail-main">
          <section className="card">
            <div className="card__head">
              <h2 className="card__title">{L(['Popup Bilgileri', 'Popup Details'], lang)}</h2>
            </div>
            <div className="card__body">
              <InfoRow icon={<PopupIcon />} label={popupTypeLabel(detail.popupType, lang)}>
                {popupLabel}
              </InfoRow>
              <InfoRow icon={<Send />} label={L(['Planlanan', 'Scheduled'], lang)}>
                <span className="mono">{fmtDt(detail.triggerAt)}</span>
              </InfoRow>
              {detail.kickedAt && (
                <InfoRow icon={<WifiOff size={14} />} label={L(['Kick edildi', 'Kicked'], lang)}>
                  <span className="mono">{fmtDt(detail.kickedAt)}</span>
                </InfoRow>
              )}
              {detail.shownAt && (
                <InfoRow icon={<Check />} label={L(['Gösterildi', 'Shown At'], lang)}>
                  <span className="mono">{fmtDt(detail.shownAt)}</span>
                </InfoRow>
              )}
            </div>
          </section>

          <section className="card guest-survey-state-card">
            <div className="card__body">
              <p>
                {detail.status === 'scheduled'
                  ? L(['Bu popup henüz gönderilmedi. Planlanan zamanda otomatik olarak gönderilecek.', "This popup hasn't been sent yet. It will be sent automatically at the scheduled time."], lang)
                  : detail.status === 'sent'
                  ? L(['Misafir bağlantısı kesildi. Tekrar bağlanınca popup görüntülenecek.', 'Guest was disconnected. The popup will appear when they reconnect.'], lang)
                  : L(['Popup gösterildi.', 'Popup was shown to the guest.'], lang)}
              </p>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="guest-email-detail-side">
          <section className="card guest-email-related">
            <div className="card__head">
              <h2 className="card__title">{L(['İlgili Misafir', 'Related Guest'], lang)}</h2>
            </div>
            <div className="card__body">
              <Link className="guest-ticket-related__profile" href={`/h/${hotelId}/guests/${detail.id}`}>
                <span style={{ background: detail.guest.color }}>{detail.guest.initials}</span>
                <span>
                  <strong>{detail.guest.name}</strong>
                  <small>{L(['Oda', 'Room'], lang)} {detail.guest.room} · {detail.guest.hotel}</small>
                </span>
              </Link>
              {detail.guest.phone && (
                <InfoRow icon={<Phone />} label={L(['Telefon', 'Phone'], lang)}>
                  <span className="mono">{detail.guest.phone}</span>
                </InfoRow>
              )}
              {detail.guest.email && (
                <InfoRow icon={<Mail />} label={L(['E-posta', 'Email'], lang)}>
                  <span className="mono">{detail.guest.email}</span>
                </InfoRow>
              )}
              <InfoRow icon={<WifiOff size={14} />} label={L(['Bağlantı', 'Connection'], lang)}>
                <span className="badge badge--mute">{L(['Bağlı Değil', 'Offline'], lang)}</span>
              </InfoRow>
            </div>
          </section>

          <section className="card guest-email-activity-card">
            <div className="card__head">
              <h2 className="card__title">{L(['Gönderim Hareketleri', 'Send Activity'], lang)}</h2>
            </div>
            <div className="card__body">
              <div className="guest-email-timeline">
                {detail.shownAt && (
                  <div className="guest-email-timeline__item is-complete">
                    <span className="guest-email-timeline__icon"><Check /></span>
                    <div>
                      <strong>{L(['Popup gösterildi', 'Popup shown'], lang)}</strong>
                      <small>{fmtDt(detail.shownAt)}</small>
                    </div>
                  </div>
                )}
                {detail.kickedAt && (
                  <div className="guest-email-timeline__item is-complete">
                    <span className="guest-email-timeline__icon"><WifiOff size={14} /></span>
                    <div>
                      <strong>{L(['MikroTik kick edildi', 'MikroTik kicked'], lang)}</strong>
                      <small>{fmtDt(detail.kickedAt)}</small>
                    </div>
                  </div>
                )}
                <div className="guest-email-timeline__item">
                  <span className="guest-email-timeline__icon">
                    {detail.status === 'scheduled' ? <Clock3 /> : <Send />}
                  </span>
                  <div>
                    <strong>
                      {detail.status === 'scheduled'
                        ? L(['Gönderilmek üzere zamanlandı', 'Scheduled to send'], lang)
                        : L(['Gönderildi', 'Sent'], lang)}
                    </strong>
                    <small>{fmtDt(detail.triggerAt)}</small>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

    </div>
  );
}
