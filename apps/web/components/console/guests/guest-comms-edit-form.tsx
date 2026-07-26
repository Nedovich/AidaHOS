'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import type { GuestEmailRecord } from './guest-email-data';
import type { GuestSurveySendRecord } from './guest-survey-send-data';
import type { GuestWelcomeMessageRecord } from './guest-welcome-message-data';
import {
  loadGuestCommsEdit,
  saveGuestCommsEdit,
  type GuestCommsRecordKind,
} from './guest-comms-edit-storage';

type GuestCommsEditFormProps =
  | { hotelId: string; kind: 'email'; lang: Lang; record: GuestEmailRecord }
  | { hotelId: string; kind: 'survey'; lang: Lang; record: GuestSurveySendRecord }
  | { hotelId: string; kind: 'message'; lang: Lang; record: GuestWelcomeMessageRecord };

function toInputDate(value: string) {
  const [day, month, year] = value.split('.');
  return year && month && day ? `${year}-${month}-${day}` : value;
}

function toDisplayDate(value: string) {
  const [year, month, day] = value.split('-');
  return day && month && year ? `${day}.${month}.${year}` : value;
}

function editConfig(kind: GuestCommsRecordKind, lang: Lang) {
  if (kind === 'email') {
    return {
      title: L(['E-postayı Düzenle', 'Edit Email'], lang),
      backPath: 'emails',
    };
  }
  if (kind === 'message') {
    return {
      title: L(['Mesajı Düzenle', 'Edit Message'], lang),
      backPath: 'welcome-messages',
    };
  }
  return {
    title: L(['Gönderimi Düzenle', 'Edit Send'], lang),
    backPath: 'survey-sends',
  };
}

export function GuestCommsEditForm(props: GuestCommsEditFormProps) {
  const { hotelId, kind, lang, record } = props;
  const router = useRouter();
  const config = editConfig(kind, lang);
  const detailHref = `/h/${hotelId}/guests/${config.backPath}/${record.id}`;
  const initialPrimary = useMemo(() => {
    if (props.kind === 'email') return L(props.record.subject, lang);
    if (props.kind === 'message') return L(props.record.title, lang);
    return L(props.record.survey, lang);
  }, [lang, props]);
  const initialBody = useMemo(() => {
    if (props.kind === 'survey') return '';
    return L(props.record.body, lang);
  }, [lang, props]);
  const [primary, setPrimary] = useState(initialPrimary);
  const [body, setBody] = useState(initialBody);
  const [date, setDate] = useState(toInputDate(record.date));
  const [time, setTime] = useState(record.time);

  useEffect(() => {
    const saved = loadGuestCommsEdit(kind, record.id);
    if (!saved) return;
    setPrimary(saved.primary);
    setBody(saved.body ?? '');
    setDate(toInputDate(saved.date));
    setTime(saved.time);
  }, [kind, record.id]);

  const cancel = () => router.push(detailHref);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    saveGuestCommsEdit(kind, record.id, {
      primary: primary.trim() || initialPrimary,
      body,
      date: toDisplayDate(date),
      time,
    });
    router.push(detailHref);
  };

  return (
    <div className="guests-page guest-compose-page guest-comms-edit-page">
      <div className="page-hero guests-hero guest-compose-hero">
        <div>
          <h1 className="page-hero__h">{config.title}</h1>
          <p className="page-hero__sub">
            {L(['Gönderim detaylarını düzenleyin.', 'Edit the send details.'], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          <button className="btn btn--ghost" type="button" onClick={cancel}>
            {L(['Vazgeç', 'Cancel'], lang)}
          </button>
        </div>
      </div>

      <form className="card guest-compose-card" onSubmit={submit}>
        <div className="card__body guest-compose-card__body">
          <div>
            <label className="flabel" htmlFor="edit-comms-primary">
              {kind === 'email'
                ? L(['Konu', 'Subject'], lang)
                : kind === 'message'
                  ? L(['Başlık', 'Title'], lang)
                  : L(['Anket', 'Survey'], lang)}
            </label>
            {kind === 'survey' ? (
              <div className="finput guest-comms-edit-readonly" id="edit-comms-primary">
                {primary}
              </div>
            ) : (
              <input
                className="finput"
                id="edit-comms-primary"
                value={primary}
                onChange={(event) => setPrimary(event.target.value)}
              />
            )}
          </div>

          {kind !== 'survey' ? (
            <div>
              <label className="flabel" htmlFor="edit-comms-body">
                {L(['Mesaj', 'Message'], lang)}
              </label>
              <textarea
                className={`ftextarea guest-compose-textarea ${
                  kind === 'email'
                    ? 'guest-compose-textarea--email'
                    : 'guest-compose-textarea--edit-message'
                }`}
                id="edit-comms-body"
                value={body}
                onChange={(event) => setBody(event.target.value)}
              />
            </div>
          ) : null}

          <div className="fgrid guest-compose-datetime">
            <div>
              <label className="flabel" htmlFor="edit-comms-date">
                {L(['Tarih', 'Date'], lang)}
              </label>
              <input
                className="finput"
                id="edit-comms-date"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
            <div>
              <label className="flabel" htmlFor="edit-comms-time">
                {L(['Saat', 'Time'], lang)}
              </label>
              <input
                className="finput"
                id="edit-comms-time"
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="guest-compose-card__footer">
          <button className="btn btn--ghost" type="button" onClick={cancel}>
            {L(['Vazgeç', 'Cancel'], lang)}
          </button>
          <button className="btn btn--primary" type="submit">
            <Check />
            {L(['Kaydet', 'Save'], lang)}
          </button>
        </div>
      </form>
    </div>
  );
}
