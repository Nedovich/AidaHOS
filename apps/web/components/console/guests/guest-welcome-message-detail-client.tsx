'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Bell,
  Check,
  ChevronLeft,
  Clock3,
  ExternalLink,
  Mail,
  MessageSquare,
  Pencil,
  Phone,
  RefreshCw,
  Send,
  Wifi,
} from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import {
  type GuestWelcomeMessageRecord,
  type WelcomeMessageStatus,
} from './guest-welcome-message-data';
import { loadGuestCommsEdit } from './guest-comms-edit-storage';

function statusLabel(status: WelcomeMessageStatus, lang: Lang) {
  if (status === 'opened') return L(['Açıldı', 'Opened'], lang);
  if (status === 'scheduled') return L(['Zamanlandı', 'Scheduled'], lang);
  return L(['Gönderildi', 'Sent'], lang);
}

function StatusBadge({ status, lang }: { status: WelcomeMessageStatus; lang: Lang }) {
  const Icon = status === 'scheduled' ? Clock3 : status === 'opened' ? Check : Send;
  return (
    <span className={`badge guest-message-status status-${status}`}>
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

export function GuestWelcomeMessageDetailClient({
  record,
  hotelId,
  lang,
}: {
  record: GuestWelcomeMessageRecord;
  hotelId: string;
  lang: Lang;
}) {
  const [status, setStatus] = useState(record.status);
  const [openedDate, setOpenedDate] = useState(record.openedDate);
  const [openedTime, setOpenedTime] = useState(record.openedTime);
  const [notice, setNotice] = useState('');
  const [content, setContent] = useState({
    primary: L(record.title, lang),
    body: L(record.body, lang),
    date: record.date,
    time: record.time,
  });

  useEffect(() => {
    const saved = loadGuestCommsEdit('message', record.id);
    if (saved) {
      setContent((current) => ({
        ...current,
        ...saved,
        body: saved.body ?? current.body,
      }));
    }
  }, [record.id]);

  const sendMessage = () => {
    setStatus('sent');
    setOpenedDate(undefined);
    setOpenedTime(undefined);
    setNotice(L([
      `Mesaj ${record.guest.name} adlı misafire gönderildi.`,
      `Message sent to ${record.guest.name}.`,
    ], lang));
  };

  return (
    <div className="guest-email-detail-page guest-message-detail-page">
      <div className="guest-detail-breadcrumb">
        <Link href={`/h/${hotelId}/guests/welcome-messages`}>
          {L(['Karşılama Mesajları', 'Welcome Messages'], lang)}
        </Link>
        <span>›</span>
        <strong>{content.primary}</strong>
      </div>

      <header className="guest-email-detail-head">
        <Link
          className="guest-email-detail-back"
          href={`/h/${hotelId}/guests/welcome-messages`}
          aria-label={L(['Karşılama mesajlarına dön', 'Back to welcome messages'], lang)}
        >
          <ChevronLeft />
        </Link>
        <div className={`guest-message-detail-icon status-${status}`}>
          <MessageSquare />
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
              <Link className="btn btn--ghost" href={`/h/${hotelId}/guests/welcome-messages/${record.id}/edit`}>
                <Pencil />{L(['Düzenle', 'Edit'], lang)}
              </Link>
              <button className="btn btn--primary" type="button" onClick={sendMessage}>
                <Send />{L(['Şimdi Gönder', 'Send Now'], lang)}
              </button>
            </>
          ) : (
            <button className="btn btn--primary" type="button" onClick={sendMessage}>
              <RefreshCw />{L(['Yeniden Gönder', 'Resend'], lang)}
            </button>
          )}
        </div>
      </header>

      {notice ? (
        <div className="guests-notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label={L(['Bildirimi kapat', 'Dismiss notification'], lang)}>×</button>
        </div>
      ) : null}

      <div className="guest-email-detail-layout">
        <section className="card guest-message-preview-card">
          <div className="card__head">
            <div>
              <h2 className="card__title">{L(['Mesaj Önizleme', 'Message Preview'], lang)}</h2>
              <p className="card__sub">{L(['Misafir Portalı', 'Guest Portal'], lang)}</p>
            </div>
          </div>
          <div className="card__body">
            <div className="guest-message-phone">
              <div className="guest-message-phone__screen">
                <div className="guest-message-phone__notch" />
                <div className="guest-message-phone__time">{content.time}</div>
                <div className="guest-message-push">
                  <div className="guest-message-push__head">
                    <span className="guest-message-push__app"><Bell /></span>
                    <div>
                      <strong>AIDA</strong>
                      <span>{record.guest.hotel}</span>
                    </div>
                    <small>{L(['şimdi', 'now'], lang)}</small>
                  </div>
                  <h3>{content.primary}</h3>
                  <p>{content.body}</p>
                </div>
              </div>
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
              <h2 className="card__title">{L(['Gönderim Geçmişi', 'Send Activity'], lang)}</h2>
            </div>
            <div className="card__body">
              <div className="guest-email-timeline">
                {status === 'opened' && openedDate && openedTime ? (
                  <div className="guest-email-timeline__item is-complete">
                    <span className="guest-email-timeline__icon"><Check /></span>
                    <div>
                      <strong>{L(['Misafir mesajı açtı', 'Guest opened the message'], lang)}</strong>
                      <small>{openedDate} · {openedTime}</small>
                    </div>
                  </div>
                ) : null}
                <div className="guest-email-timeline__item">
                  <span className="guest-email-timeline__icon">
                    {status === 'scheduled' ? <Clock3 /> : <Send />}
                  </span>
                  <div>
                    <strong>
                      {status === 'scheduled'
                        ? L(['Gönderim planlandı', 'Scheduled to send'], lang)
                        : L(['Mesaj gönderildi', 'Message sent'], lang)}
                    </strong>
                    <small>{content.date} · {content.time}</small>
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
