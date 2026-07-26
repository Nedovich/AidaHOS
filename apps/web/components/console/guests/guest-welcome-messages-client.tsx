'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Clock3, MessageSquare, Search, Send } from 'lucide-react';
import { Kpi } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';
import {
  GUEST_WELCOME_MESSAGE_RECORDS,
  type WelcomeMessageStatus,
} from './guest-welcome-message-data';

type MessageFilter = 'all' | WelcomeMessageStatus;

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

export function GuestWelcomeMessagesClient({
  hotelId,
  lang,
}: {
  hotelId: string;
  lang: Lang;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<MessageFilter>('all');
  const [search, setSearch] = useState('');

  const counts = useMemo(() => ({
    all: GUEST_WELCOME_MESSAGE_RECORDS.length,
    sent: GUEST_WELCOME_MESSAGE_RECORDS.filter((item) => item.status === 'sent').length,
    opened: GUEST_WELCOME_MESSAGE_RECORDS.filter((item) => item.status === 'opened').length,
    scheduled: GUEST_WELCOME_MESSAGE_RECORDS.filter((item) => item.status === 'scheduled').length,
  }), []);

  const filtered = useMemo(() => {
    const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
    const query = search.trim().toLocaleLowerCase(locale);
    return GUEST_WELCOME_MESSAGE_RECORDS.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (!query) return true;
      return [item.guest.name, L(item.title, lang), item.guest.email]
        .some((value) => value.toLocaleLowerCase(locale).includes(query));
    });
  }, [filter, lang, search]);

  return (
    <div className="guests-page guest-welcome-messages-page">
      <div className="page-hero guests-hero">
        <div>
          <h1 className="page-hero__h">{L(['Karşılama Mesajları', 'Welcome Messages'], lang)}</h1>
          <p className="page-hero__sub">
            {L([
              'Misafirlere gönderilen ve zamanlanan mesajlar.',
              'Messages sent and scheduled to guests.',
            ], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => router.push(`/h/${hotelId}/guests/welcome-messages/new`)}
          >
            <MessageSquare />{L(['Yeni Gönder', 'New Message'], lang)}
          </button>
        </div>
      </div>

      <div className="grid grid--kpi guest-comms-kpis">
        <Kpi icon={<Send />} label={L(['Gönderildi', 'Sent'], lang)} value={String(counts.sent)} />
        <Kpi icon={<Check />} label={L(['Açıldı', 'Opened'], lang)} value={String(counts.opened)} />
        <Kpi icon={<Clock3 />} label={L(['Zamanlandı', 'Scheduled'], lang)} value={String(counts.scheduled)} />
      </div>

      <div className="guests-toolbar guest-comms-toolbar">
        <div className="guests-chips" role="group" aria-label={L(['Mesaj durumu', 'Message status'], lang)}>
          {([
            ['all', L(['Tümü', 'All'], lang), counts.all],
            ['sent', L(['Gönderildi', 'Sent'], lang), counts.sent],
            ['opened', L(['Açıldı', 'Opened'], lang), counts.opened],
            ['scheduled', L(['Zamanlandı', 'Scheduled'], lang), counts.scheduled],
          ] as const).map(([value, label, count]) => (
            <button
              className={`guests-chip${filter === value ? ' active' : ''}`}
              type="button"
              onClick={() => setFilter(value)}
              key={value}
            >
              {label}<span>{count}</span>
            </button>
          ))}
        </div>
        <label className="searchmini guests-search">
          <Search />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={L(['Misafir veya başlık ara…', 'Search guest or title…'], lang)}
          />
        </label>
      </div>

      <section className="card guests-card guest-comms-card">
        <div className="card__head">
          <div>
            <h2 className="card__title">{L(['Karşılama Mesajları', 'Welcome Messages'], lang)}</h2>
            <p className="card__sub">{filtered.length} {L(['kayıt', 'records'], lang)}</p>
          </div>
        </div>
        <div className="card__body guests-table-wrap">
          <table className="table guest-comms-table">
            <thead>
              <tr>
                <th>{L(['Misafir', 'Guest'], lang)}</th>
                <th>{L(['Başlık', 'Title'], lang)}</th>
                <th>{L(['Tarih / Saat', 'Date / Time'], lang)}</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  className="guests-row-link"
                  role="link"
                  tabIndex={0}
                  key={item.id}
                  onClick={() => router.push(`/h/${hotelId}/guests/welcome-messages/${item.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      router.push(`/h/${hotelId}/guests/welcome-messages/${item.id}`);
                    }
                  }}
                >
                  <td>
                    <div className="set-mem">
                      <div className="set-mem__av" style={{ background: item.guest.color }}>{item.guest.initials}</div>
                      <div>
                        <div className="set-mem__n">{item.guest.name}</div>
                        <div className="cell-sub">{item.guest.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="guest-email-subject">{L(item.title, lang)}</td>
                  <td className="mono cell-sub">{item.date} · {item.time}</td>
                  <td><StatusBadge status={item.status} lang={lang} /></td>
                </tr>
              ))}
              {!filtered.length ? (
                <tr><td className="guests-empty" colSpan={4}>{L(['Kayıt bulunamadı.', 'No records found.'], lang)}</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
