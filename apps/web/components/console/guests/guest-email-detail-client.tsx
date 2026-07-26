'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  Clock3,
  ExternalLink,
  Mail,
  Pencil,
  Phone,
  RefreshCw,
  Send,
  Wifi,
} from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import {
  type EmailStatus,
  type GuestEmailRecord,
} from './guest-email-data';
import { loadGuestCommsEdit } from './guest-comms-edit-storage';

function statusLabel(status: EmailStatus, lang: Lang) {
  if (status === 'opened') return L(['Açıldı', 'Opened'], lang);
  if (status === 'scheduled') return L(['Zamanlandı', 'Scheduled'], lang);
  return L(['Gönderildi', 'Sent'], lang);
}

function StatusBadge({ status, lang }: { status: EmailStatus; lang: Lang }) {
  const Icon = status === 'scheduled' ? Clock3 : status === 'opened' ? Check : Mail;
  return (
    <span className={`badge guest-email-status status-${status}`}>
      <Icon />
      {statusLabel(status, lang)}
    </span>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="stat-row guest-email-detail-row">
      <span className="stat-row__k">{icon}{label}</span>
      <span className="stat-row__v">{children}</span>
    </div>
  );
}

export function GuestEmailDetailClient({
  record,
  hotelId,
  lang,
}: {
  record: GuestEmailRecord;
  hotelId: string;
  lang: Lang;
}) {
  const [status, setStatus] = useState(record.status);
  const [notice, setNotice] = useState('');
  const [activityDate, setActivityDate] = useState(record.openedDate);
  const [activityTime, setActivityTime] = useState(record.openedTime);
  const [content, setContent] = useState({
    primary: L(record.subject, lang),
    body: L(record.body, lang),
    date: record.date,
    time: record.time,
  });

  useEffect(() => {
    const saved = loadGuestCommsEdit('email', record.id);
    if (saved) {
      setContent((current) => ({
        ...current,
        ...saved,
        body: saved.body ?? current.body,
      }));
    }
  }, [record.id]);

  const sendEmail = () => {
    setStatus('sent');
    setActivityDate(undefined);
    setActivityTime(undefined);
    setNotice(L([
      `E-posta ${record.guest.email} adresine gönderildi.`,
      `Email sent to ${record.guest.email}.`,
    ], lang));
  };

  return (
    <div className="guest-email-detail-page">
      <div className="guest-detail-breadcrumb">
        <Link href={`/h/${hotelId}/guests/emails`}>
          {L(['E-postalar', 'Emails'], lang)}
        </Link>
        <span>›</span>
        <strong>{content.primary}</strong>
      </div>

      <header className="guest-email-detail-head">
        <Link
          className="guest-email-detail-back"
          href={`/h/${hotelId}/guests/emails`}
          aria-label={L(['E-postalara dön', 'Back to emails'], lang)}
        >
          <ChevronLeft />
        </Link>
        <div className={`guest-email-detail-icon status-${status}`}>
          <Mail />
        </div>
        <div className="guest-email-detail-identity">
          <div className="guest-email-detail-titleline">
            <h1>{content.primary}</h1>
            <StatusBadge status={status} lang={lang} />
          </div>
          <p>
            {record.guest.name} · {L(['Oda', 'Room'], lang)} {record.guest.room} · {content.date}, {content.time}
          </p>
        </div>
        <div className="guest-email-detail-actions">
          <Link className="btn btn--ghost" href={`/h/${hotelId}/guests/${record.guest.id}`}>
            <ExternalLink />{L(['Misafire Git', 'Go to Guest'], lang)}
          </Link>
          {status === 'scheduled' ? (
            <>
              <Link className="btn btn--ghost" href={`/h/${hotelId}/guests/emails/${record.id}/edit`}>
                <Pencil />{L(['Düzenle', 'Edit'], lang)}
              </Link>
              <button className="btn btn--primary" type="button" onClick={sendEmail}>
                <Send />{L(['Şimdi Gönder', 'Send Now'], lang)}
              </button>
            </>
          ) : (
            <button className="btn btn--primary" type="button" onClick={sendEmail}>
              <RefreshCw />{L(['Yeniden Gönder', 'Resend'], lang)}
            </button>
          )}
        </div>
      </header>

      {notice ? (
        <div className="guests-notice" role="status">
          <span>{notice}</span>
          <button
            type="button"
            onClick={() => setNotice('')}
            aria-label={L(['Bildirimi kapat', 'Dismiss notification'], lang)}
          >
            ×
          </button>
        </div>
      ) : null}

      <div className="guest-email-detail-layout">
        <section className="card guest-email-content-card">
          <div className="card__head">
            <h2 className="card__title">{L(['E-posta İçeriği', 'Email Content'], lang)}</h2>
          </div>
          <div className="card__body">
            <div className="guest-email-meta">
              <div>
                <span>{L(['Gönderen', 'From'], lang)}</span>
                <strong>AIDA · {record.guest.hotel}</strong>
              </div>
              <div>
                <span>{L(['Alıcı', 'To'], lang)}</span>
                <strong>{record.guest.name} · {record.guest.email}</strong>
              </div>
              <div>
                <span>{L(['Konu', 'Subject'], lang)}</span>
                <strong>{content.primary}</strong>
              </div>
            </div>
            <div className="guest-email-body">
              <p>{content.body}</p>
            </div>
          </div>
        </section>

        <aside className="guest-email-detail-side">
          <section className="card guest-email-related">
            <div className="card__head">
              <h2 className="card__title">{L(['İlgili Misafir', 'Related Guest'], lang)}</h2>
            </div>
            <div className="card__body">
              <Link className="guest-ticket-related__profile" href={`/h/${hotelId}/guests/${record.guest.id}`}>
                <span style={{ background: record.guest.color }}>{record.guest.initials}</span>
                <span>
                  <strong>{record.guest.name}</strong>
                  <small>{L(['Oda', 'Room'], lang)} {record.guest.room} · {record.guest.hotel}</small>
                </span>
              </Link>
              <InfoRow icon={<Phone />} label={L(['Telefon', 'Phone'], lang)}>
                <span className="mono">{record.guest.phone}</span>
              </InfoRow>
              <InfoRow icon={<Mail />} label={L(['E-posta', 'Email'], lang)}>
                <span className="mono">{record.guest.email}</span>
              </InfoRow>
              <InfoRow icon={<Wifi />} label={L(['Bağlantı', 'Connection'], lang)}>
                <span className={`badge ${record.guest.connection === 'online' ? 'badge--ok' : 'badge--mute'}`}>
                  {record.guest.connection === 'online'
                    ? L(['Bağlı', 'Online'], lang)
                    : L(['Bağlı Değil', 'Offline'], lang)}
                </span>
              </InfoRow>
            </div>
          </section>

          <section className="card guest-email-activity-card">
            <div className="card__head">
              <h2 className="card__title">{L(['Gönderim Hareketleri', 'Send Activity'], lang)}</h2>
            </div>
            <div className="card__body">
              <div className="guest-email-timeline">
                <div className="guest-email-timeline__item">
                  <span className="guest-email-timeline__icon">
                    {status === 'scheduled' ? <Clock3 /> : <Send />}
                  </span>
                  <div>
                    <strong>
                      {status === 'scheduled'
                        ? L(['Gönderilmek üzere zamanlandı', 'Scheduled to send'], lang)
                        : L(['Gönderildi', 'Sent'], lang)}
                    </strong>
                    <small>{content.date} · {content.time}</small>
                  </div>
                </div>
                {status === 'opened' && activityDate && activityTime ? (
                  <div className="guest-email-timeline__item is-complete">
                    <span className="guest-email-timeline__icon"><Check /></span>
                    <div>
                      <strong>{L(['Açıldı', 'Opened'], lang)}</strong>
                      <small>{activityDate} · {activityTime}</small>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
