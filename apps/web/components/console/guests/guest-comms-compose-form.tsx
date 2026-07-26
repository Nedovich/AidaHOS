'use client';

import { type FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, X } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import { INITIAL_GUESTS } from './guest-data';

type ComposeKind = 'email' | 'survey' | 'message';

interface GuestCommsComposeFormProps {
  hotelId: string;
  kind: ComposeKind;
  lang: Lang;
}

const DEFAULT_DATE = '2026-07-25';

function composeConfig(kind: ComposeKind, lang: Lang) {
  if (kind === 'email') {
    return {
      title: L(['Yeni E-posta', 'New Email'], lang),
      subtitle: L([
        'Misafire özel bir e-posta gönderin.',
        'Send a custom email to the guest.',
      ], lang),
      backPath: 'emails',
    };
  }

  if (kind === 'survey') {
    return {
      title: L(['Yeni Anket Gönderimi', 'New Survey Send'], lang),
      subtitle: L([
        'Misafire otomatik değerlendirme anketi planlayın.',
        'Schedule an automated feedback survey for the guest.',
      ], lang),
      backPath: 'survey-sends',
    };
  }

  return {
    title: L(['Yeni Karşılama Mesajı', 'New Welcome Message'], lang),
    subtitle: L([
      'Misafirin portalına bir mesaj gönderin.',
      "Send a message to the guest's portal.",
    ], lang),
    backPath: 'welcome-messages',
  };
}

export function GuestCommsComposeForm({
  hotelId,
  kind,
  lang,
}: GuestCommsComposeFormProps) {
  const router = useRouter();
  const config = composeConfig(kind, lang);
  const backHref = `/h/${hotelId}/guests/${config.backPath}`;
  const [guestId, setGuestId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [survey, setSurvey] = useState('checkout');
  const [date, setDate] = useState(DEFAULT_DATE);
  const [time, setTime] = useState('10:00');
  const [error, setError] = useState('');

  const cancel = () => router.push(backHref);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!guestId) {
      setError(L(['Lütfen bir misafir seçin.', 'Please select a guest.'], lang));
      return;
    }
    router.push(backHref);
  };

  return (
    <div className="guests-page guest-compose-page">
      <div className="page-hero guests-hero guest-compose-hero">
        <div>
          <h1 className="page-hero__h">{config.title}</h1>
          <p className="page-hero__sub">{config.subtitle}</p>
        </div>
        <div className="page-hero__actions">
          <button className="btn btn--ghost" type="button" onClick={cancel}>
            <X />
            {L(['Vazgeç', 'Cancel'], lang)}
          </button>
        </div>
      </div>

      {error ? (
        <div className="guests-notice guest-compose-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError('')}
            aria-label={L(['Bildirimi kapat', 'Dismiss notification'], lang)}
          >
            ×
          </button>
        </div>
      ) : null}

      <form className="card guest-compose-card" onSubmit={submit}>
        <div className="card__body guest-compose-card__body">
          <div>
            <label className="flabel" htmlFor="compose-guest">
              {L(['Misafir', 'Guest'], lang)}
            </label>
            <select
              className="fselect"
              id="compose-guest"
              value={guestId}
              onChange={(event) => {
                setGuestId(event.target.value);
                setError('');
              }}
            >
              <option value="">
                {L(['Misafir seçin…', 'Choose a guest…'], lang)}
              </option>
              {INITIAL_GUESTS.map((guest) => (
                <option value={guest.id} key={guest.id}>
                  {guest.name} · {L(['Oda', 'Room'], lang)} {guest.room}
                </option>
              ))}
            </select>
          </div>

          {kind === 'email' ? (
            <>
              <div>
                <label className="flabel" htmlFor="compose-subject">
                  {L(['Konu', 'Subject'], lang)}
                </label>
                <input
                  className="finput"
                  id="compose-subject"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder={L(['ör. Rezervasyon Onayı', 'e.g. Booking Confirmation'], lang)}
                />
              </div>
              <div>
                <label className="flabel" htmlFor="compose-email-message">
                  {L(['Mesaj', 'Message'], lang)}
                </label>
                <textarea
                  className="ftextarea guest-compose-textarea guest-compose-textarea--email"
                  id="compose-email-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={L(['E-posta içeriğini yazın…', 'Write the email content…'], lang)}
                />
              </div>
            </>
          ) : null}

          {kind === 'survey' ? (
            <>
              <div>
                <label className="flabel" htmlFor="compose-survey">
                  {L(['Anket', 'Survey'], lang)}
                </label>
                <select
                  className="fselect"
                  id="compose-survey"
                  value={survey}
                  onChange={(event) => setSurvey(event.target.value)}
                >
                  <option value="checkout">
                    {L(['Check-out Geri Bildirimi', 'Check-out Feedback'], lang)}
                  </option>
                  <option value="midstay">
                    {L(['Konaklama Ortası Nabız', 'Mid-Stay Pulse'], lang)}
                  </option>
                  <option value="event">
                    {L(['Etkinlik Geri Bildirimi', 'Event Feedback'], lang)}
                  </option>
                </select>
              </div>
              <div className="fgrid guest-compose-datetime">
                <div>
                  <label className="flabel" htmlFor="compose-survey-date">
                    {L(['Tarih', 'Date'], lang)}
                  </label>
                  <input
                    className="finput"
                    id="compose-survey-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>
                <div>
                  <label className="flabel" htmlFor="compose-survey-time">
                    {L(['Saat', 'Time'], lang)}
                  </label>
                  <input
                    className="finput"
                    id="compose-survey-time"
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                  />
                </div>
              </div>
              <p className="fhint guest-compose-hint">
                {L([
                  'Misafire check-out anketi bu tarih ve saatte gönderilecek.',
                  'The checkout survey will be sent to the guest at this date and time.',
                ], lang)}
              </p>
            </>
          ) : null}

          {kind === 'message' ? (
            <>
              <div>
                <label className="flabel" htmlFor="compose-message-title">
                  {L(['Başlık', 'Title'], lang)}
                </label>
                <input
                  className="finput"
                  id="compose-message-title"
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder={L(['ör. Hoş Geldiniz!', 'e.g. Welcome!'], lang)}
                />
              </div>
              <div>
                <label className="flabel" htmlFor="compose-message-body">
                  {L(['Mesaj', 'Message'], lang)}
                </label>
                <textarea
                  className="ftextarea guest-compose-textarea guest-compose-textarea--message"
                  id="compose-message-body"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder={L(['Misafire gösterilecek mesaj…', 'Message shown to the guest…'], lang)}
                />
              </div>
              <div className="fgrid guest-compose-datetime">
                <div>
                  <label className="flabel" htmlFor="compose-message-date">
                    {L(['Tarih', 'Date'], lang)}
                  </label>
                  <input
                    className="finput"
                    id="compose-message-date"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                  />
                </div>
                <div>
                  <label className="flabel" htmlFor="compose-message-time">
                    {L(['Saat', 'Time'], lang)}
                  </label>
                  <input
                    className="finput"
                    id="compose-message-time"
                    type="time"
                    value={time}
                    onChange={(event) => setTime(event.target.value)}
                  />
                </div>
              </div>
            </>
          ) : null}
        </div>

        <div className="guest-compose-card__footer">
          <button className="btn btn--ghost" type="button" onClick={cancel}>
            {L(['Vazgeç', 'Cancel'], lang)}
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
