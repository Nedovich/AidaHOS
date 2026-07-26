'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  CalendarDays,
  Check,
  ExternalLink,
  Flag,
  Layers3,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Send,
  Ticket,
  UserRound,
  Wifi,
} from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import {
  type GuestTicketRecord,
  type TicketMessage,
  type TicketPriority,
} from './guest-ticket-data';

function priorityLabel(priority: TicketPriority, lang: Lang) {
  if (priority === 'high') return L(['Yüksek', 'High'], lang);
  if (priority === 'medium') return L(['Orta', 'Medium'], lang);
  return L(['Düşük', 'Low'], lang);
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
    <div className="stat-row guest-ticket-detail-row">
      <span className="stat-row__k">{icon}{label}</span>
      <span className="stat-row__v">{children}</span>
    </div>
  );
}

export function GuestTicketDetailClient({
  record,
  hotelId,
  lang,
}: {
  record: GuestTicketRecord;
  hotelId: string;
  lang: Lang;
}) {
  const [status, setStatus] = useState(record.ticket.status);
  const [messages, setMessages] = useState<TicketMessage[]>(record.thread);
  const [reply, setReply] = useState('');

  const addStaffMessage = (text: readonly [string, string]) => {
    setMessages((current) => [
      ...current,
      {
        id: `staff-${Date.now()}`,
        from: ['Siz', 'You'],
        staff: true,
        text,
        timestamp: ['şimdi', 'now'],
      },
    ]);
  };

  const sendReply = () => {
    const value = reply.trim();
    if (!value) return;
    addStaffMessage([value, value]);
    setReply('');
  };

  const toggleStatus = () => {
    if (status === 'open') {
      setStatus('closed');
      addStaffMessage(['Talep kapatıldı.', 'Ticket closed.']);
      return;
    }
    setStatus('open');
    addStaffMessage(['Talep yeniden açıldı.', 'Ticket reopened.']);
  };

  return (
    <div className="guest-ticket-detail-page">
      <div className="guest-detail-breadcrumb">
        <Link href={`/h/${hotelId}/guests/tickets`}>
          {L(['Talepler / Şikayetler', 'Tickets / Complaints'], lang)}
        </Link>
        <span>›</span>
        <strong>{L(record.ticket.subject, lang)}</strong>
      </div>

      <header className="guest-ticket-detail-head">
        <div className={`guest-ticket-detail-icon ${status === 'open' ? 'is-open' : 'is-closed'}`}>
          <Ticket />
        </div>
        <div className="guest-ticket-detail-identity">
          <div className="guest-ticket-detail-titleline">
            <h1>{L(record.ticket.subject, lang)}</h1>
            <span className={`badge ${status === 'open' ? 'badge--warn' : 'badge--ok'}`}>
              {status === 'open' ? L(['Açık', 'Open'], lang) : L(['Kapalı', 'Closed'], lang)}
            </span>
            <span className={`badge guest-ticket-priority priority-${record.priority}`}>
              {priorityLabel(record.priority, lang)}
            </span>
          </div>
          <p>{L(record.category, lang)} · #000{record.id} · {record.ticket.date}</p>
        </div>
        <div className="guest-ticket-detail-actions">
          <Link className="btn btn--ghost" href={`/h/${hotelId}/guests/${record.guest.id}`}>
            <ExternalLink />{L(['Misafire Git', 'Go to Guest'], lang)}
          </Link>
          <button className="btn btn--primary" type="button" onClick={toggleStatus}>
            {status === 'open' ? <Check /> : <RefreshCw />}
            {status === 'open' ? L(['Talebi Kapat', 'Close Ticket'], lang) : L(['Yeniden Aç', 'Reopen'], lang)}
          </button>
        </div>
      </header>

      <div className="guest-ticket-detail-layout">
        <section className="card guest-ticket-conversation">
          <div className="card__head">
            <h2 className="card__title">{L(['Konuşma', 'Conversation'], lang)}</h2>
          </div>
          <div className="card__body">
            <div className="guest-ticket-thread">
              {messages.map((message) => (
                <article className="guest-ticket-message" key={message.id}>
                  <span className={`guest-ticket-message__icon ${message.staff ? 'is-staff' : ''}`}>
                    {message.staff ? <MessageSquare /> : <UserRound />}
                  </span>
                  <div>
                    <div className="guest-ticket-message__author">
                      {L(message.from, lang)}
                      {message.staff ? <small>({L(['personel', 'staff'], lang)})</small> : null}
                    </div>
                    <p>{L(message.text, lang)}</p>
                    <time>{L(message.timestamp, lang)}</time>
                  </div>
                </article>
              ))}
            </div>

            <div className="guest-ticket-reply">
              <input
                className="finput"
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') sendReply();
                }}
                placeholder={L(['Bir yanıt yazın…', 'Write a reply…'], lang)}
              />
              <button className="btn btn--primary btn--sm" type="button" onClick={sendReply}>
                <Send />{L(['Gönder', 'Send'], lang)}
              </button>
            </div>
          </div>
        </section>

        <aside className="guest-ticket-detail-side">
          <section className="card">
            <div className="card__head">
              <h2 className="card__title">{L(['Talep Bilgileri', 'Ticket Info'], lang)}</h2>
            </div>
            <div className="card__body">
              <InfoRow icon={<Flag />} label={L(['Öncelik', 'Priority'], lang)}>
                <span className={`badge guest-ticket-priority priority-${record.priority}`}>
                  {priorityLabel(record.priority, lang)}
                </span>
              </InfoRow>
              <InfoRow icon={<Layers3 />} label={L(['Kategori', 'Category'], lang)}>
                {L(record.category, lang)}
              </InfoRow>
              <InfoRow icon={<UserRound />} label={L(['Atanan', 'Assigned To'], lang)}>
                {L(record.assignee, lang)}
              </InfoRow>
              <InfoRow icon={<CalendarDays />} label={L(['Açılış', 'Opened'], lang)}>
                <span className="mono">{record.ticket.date}</span>
              </InfoRow>
            </div>
          </section>

          <section className="card guest-ticket-related">
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
                  {record.guest.connection === 'online' ? L(['Bağlı', 'Online'], lang) : L(['Bağlı Değil', 'Offline'], lang)}
                </span>
              </InfoRow>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
