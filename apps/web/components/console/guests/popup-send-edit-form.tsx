'use client';

import { type FormEvent, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';

export function PopupSendEditForm({
  hotelId,
  popupSendId,
  lang,
  popupTitle,
  guestName,
  triggerAt,
  basePath,
  onSave,
}: {
  hotelId: string;
  popupSendId: string;
  lang: Lang;
  popupTitle: string | null;
  guestName: string;
  triggerAt: string;
  basePath?: string;
  onSave: (triggerAt: string) => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const listHref = basePath ?? `/h/${hotelId}/surveys/sends`;
  const detailHref = `${listHref}/${popupSendId}`;

  const initial = new Date(triggerAt);
  // Use local time for display — the user enters times in their timezone (TR = UTC+3).
  const toDateInput = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const toTimeInput = (d: Date) =>
    `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const [date, setDate] = useState(toDateInput(initial));
  const [time, setTime] = useState(toTimeInput(initial));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');

  const displayTitle = popupTitle ?? L(['Popup', 'Popup'], lang);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!date || !time) return;
    startTransition(async () => {
      const iso = new Date(`${date}T${time}`).toISOString();
      const res = await onSave(iso);
      if (res.ok) {
        router.push(detailHref);
      } else {
        setError(L(['Kaydedilemedi. Lütfen tekrar deneyin.', 'Could not save. Please try again.'], lang));
      }
    });
  }

  return (
    <div className="guests-page guest-compose-page guest-comms-edit-page">
      <div className="page-hero guests-hero guest-compose-hero">
        <div>
          <h1 className="page-hero__h">{L(['Gönderimi Düzenle', 'Edit Send'], lang)}</h1>
          <p className="page-hero__sub">
            {L(['Gönderim detaylarını düzenleyin.', 'Edit the send details.'], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          <button className="btn btn--ghost" type="button" onClick={() => router.push(detailHref)}>
            {L(['Vazgeç', 'Cancel'], lang)}
          </button>
        </div>
      </div>

      <form className="card guest-compose-card" onSubmit={handleSubmit}>
        <div className="card__body guest-compose-card__body">
          <div>
            <label className="flabel">{L(['Popup', 'Popup'], lang)}</label>
            <div className="finput guest-comms-edit-readonly">{displayTitle}</div>
          </div>

          <div className="fgrid guest-compose-datetime">
            <div>
              <label className="flabel" htmlFor="edit-survey-date">
                {L(['Tarih', 'Date'], lang)}
              </label>
              <input
                className="finput"
                id="edit-survey-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="flabel" htmlFor="edit-survey-time">
                {L(['Saat', 'Time'], lang)}
              </label>
              <input
                className="finput"
                id="edit-survey-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
          </div>

          {error && (
            <p style={{ color: 'var(--red)', fontSize: 13, margin: 0 }}>{error}</p>
          )}
        </div>

        <div className="guest-compose-card__footer">
          <button className="btn btn--ghost" type="button" onClick={() => router.push(detailHref)} disabled={pending}>
            {L(['Vazgeç', 'Cancel'], lang)}
          </button>
          <button className="btn btn--primary" type="submit" disabled={pending || !date || !time}>
            <Check />
            {L(['Kaydet', 'Save'], lang)}
          </button>
        </div>
      </form>
    </div>
  );
}
