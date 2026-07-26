'use client';

import Link from 'next/link';
import { useState, useTransition } from 'react';
import {
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

export type SurveySendStatus = 'scheduled' | 'sent' | 'completed';

export interface SerializedSurveySendDetail {
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
  surveyName: string | null;
  triggerAt: string;
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

export function GuestSurveySendDetailClient({
  detail: initial,
  hotelId,
  lang,
  onMarkShown,
}: {
  detail: SerializedSurveySendDetail;
  hotelId: string;
  lang: Lang;
  onMarkShown?: (id: string) => Promise<{ ok: boolean }>;
}) {
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
        setNotice(L(['Anket gönderildi olarak işaretlendi.', 'Survey marked as sent.'], lang));
      }
    });
  }

  const surveyLabel = detail.surveyName ?? L(['Checkout Anketi', 'Checkout Survey'], lang);

  return (
    <div className="guest-email-detail-page guest-survey-detail-page">
      {/* Breadcrumb */}
      <div className="guest-survey-detail-nav">
        <Link
          className="guest-email-detail-back"
          href={`/h/${hotelId}/guests/survey-sends`}
          aria-label={L(['Geri', 'Back'], lang)}
        >
          <ChevronLeft />
        </Link>
        <div className="guest-detail-breadcrumb">
          <Link href={`/h/${hotelId}/guests/survey-sends`}>
            {L(['Anket Gönderimleri', 'Survey Sends'], lang)}
          </Link>
          <span>›</span>
          <strong>{surveyLabel}</strong>
        </div>
      </div>

      {/* Header */}
      <header className="guest-email-detail-head guest-survey-detail-head">
        <div className={`guest-survey-detail-icon status-${detail.status}`}>
          <ClipboardList />
        </div>
        <div className="guest-email-detail-identity">
          <div className="guest-email-detail-titleline">
            <h1>{surveyLabel}</h1>
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
          <Link className="btn btn--ghost" href={`/h/${hotelId}/guests/survey-sends/${detail.id}/edit`}>
            <Pencil />{L(['Düzenle', 'Edit'], lang)}
          </Link>
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
              <h2 className="card__title">{L(['Anket Bilgileri', 'Survey Details'], lang)}</h2>
            </div>
            <div className="card__body">
              <InfoRow icon={<ClipboardList />} label={L(['Anket', 'Survey'], lang)}>
                {surveyLabel}
              </InfoRow>
              <InfoRow icon={<Send />} label={L(['Gönderim', 'Sent'], lang)}>
                <span className="mono">{fmtDt(detail.triggerAt)}</span>
              </InfoRow>
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
                  ? L(['Bu anket henüz gönderilmedi. Planlanan zamanda otomatik olarak gönderilecek.', "This survey hasn't been sent yet. It will be sent automatically at the scheduled time."], lang)
                  : L(['Anket gönderildi, misafirin yanıtı bekleniyor.', "Survey sent, awaiting the guest's response."], lang)}
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
                      <strong>{L(['Anket gösterildi', 'Survey shown'], lang)}</strong>
                      <small>{fmtDt(detail.shownAt)}</small>
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
