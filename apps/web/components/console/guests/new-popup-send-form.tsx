'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CalendarDays, Check, ClipboardList, Send, Smile, Users, X } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import type { Loc } from '@aidahos/db/portal-config';

interface GuestOption {
  id: string;
  name: string;
  room: string;
  checkOut: string | null;
  hasTrigger: boolean;
}

interface SurveyOption {
  id: string;
  name: string;
}

interface EventOption {
  id: string;
  name: Loc;
  description: Loc;
  startsAt: string | null;
}

type RecipientMode = 'guest' | 'group';
export type PopupType = 'survey' | 'event' | 'announcement';
type ContentLang = 'tr' | 'en' | 'de' | 'ru';

export interface PopupContent {
  title: string;
  description: string;
  buttonLabel: string;
}

const CONTENT_LANGS: ContentLang[] = ['tr', 'en', 'de', 'ru'];

const ANNOUNCEMENT_CONTENT: Record<ContentLang, PopupContent> = {
  tr: { title: '', description: '', buttonLabel: 'Devam Et' },
  en: { title: '', description: '', buttonLabel: 'Continue' },
  de: { title: '', description: '', buttonLabel: 'Weiter' },
  ru: { title: '', description: '', buttonLabel: 'Продолжить' },
};

const SURVEY_BUTTON_LABEL: Record<ContentLang, string> = {
  tr: 'Anketi Doldur',
  en: 'Take Survey',
  de: 'Umfrage starten',
  ru: 'Пройти опрос',
};

const EVENT_BUTTON_LABEL: Record<ContentLang, string> = {
  tr: 'Etkinliği Gör',
  en: 'View Event',
  de: 'Event ansehen',
  ru: 'Открыть событие',
};

function emptyContent(): Record<ContentLang, PopupContent> {
  return {
    tr: { title: '', description: '', buttonLabel: '' },
    en: { title: '', description: '', buttonLabel: '' },
    de: { title: '', description: '', buttonLabel: '' },
    ru: { title: '', description: '', buttonLabel: '' },
  };
}

function contentFromSurvey(survey: SurveyOption | undefined): Record<ContentLang, PopupContent> {
  const content = emptyContent();
  if (survey) {
    content.tr = { title: survey.name, description: '', buttonLabel: SURVEY_BUTTON_LABEL.tr };
    content.en = { title: survey.name, description: '', buttonLabel: SURVEY_BUTTON_LABEL.en };
  }
  content.de.buttonLabel = SURVEY_BUTTON_LABEL.de;
  content.ru.buttonLabel = SURVEY_BUTTON_LABEL.ru;
  return content;
}

function contentFromEvent(event: EventOption | undefined): Record<ContentLang, PopupContent> {
  const content = emptyContent();
  for (const language of CONTENT_LANGS) {
    content[language] = {
      title: event?.name[language] ?? '',
      description: event?.description[language] ?? '',
      buttonLabel: EVENT_BUTTON_LABEL[language],
    };
  }
  return content;
}

function cloneContent(content: Record<ContentLang, PopupContent>): Record<ContentLang, PopupContent> {
  return Object.fromEntries(
    CONTENT_LANGS.map((language) => [language, { ...content[language] }]),
  ) as Record<ContentLang, PopupContent>;
}

function localDatetimeToISO(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function defaultDate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export interface PopupSendPayload {
  guestStayId: string;
  popupType: PopupType;
  surveyId: string | null;
  eventId: string | null;
  content: Record<ContentLang, PopupContent>;
  triggerAt: string;
}

export function NewPopupSendForm({
  hotelId,
  lang,
  guests,
  surveys,
  events,
  basePath,
  onSave,
}: {
  hotelId: string;
  lang: Lang;
  guests: GuestOption[];
  surveys: SurveyOption[];
  events: EventOption[];
  basePath?: string;
  onSave: (payload: PopupSendPayload) => Promise<{ ok: boolean; error?: string }>;
}) {
  const router = useRouter();
  const backHref = basePath ?? `/h/${hotelId}/surveys/sends`;

  const [recipientMode, setRecipientMode] = useState<RecipientMode>('guest');
  const [guestId, setGuestId] = useState(guests[0]?.id ?? '');
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [popupType, setPopupType] = useState<PopupType>('survey');
  const [targetId, setTargetId] = useState<string>(surveys[0]?.id ?? '');
  const [activeLanguage, setActiveLanguage] = useState<ContentLang>('tr');
  const [content, setContent] = useState<Record<ContentLang, PopupContent>>(() => contentFromSurvey(surveys[0]));
  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState('10:00');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const groups = useMemo(() => [
    { id: 'vip', name: L(['VIP Misafirler', 'VIP Guests'], lang), guestIds: guests.slice(0, 6).map((guest) => guest.id) },
    { id: 'honeymoon', name: L(['Balayı Çiftleri', 'Honeymoon Couples'], lang), guestIds: guests.slice(6, 8).map((guest) => guest.id) },
    { id: 'returning', name: L(['Tekrar Misafirler', 'Returning Guests'], lang), guestIds: guests.slice(8, 13).map((guest) => guest.id) },
  ], [guests, lang]);

  const selectedGuest = guests.find((guest) => guest.id === guestId);
  const activeContent = content[activeLanguage];
  const PreviewIcon = popupType === 'event' ? CalendarDays : popupType === 'announcement' ? Bell : ClipboardList;

  function updateActiveContent(field: keyof PopupContent, value: string) {
    setContent((current) => ({
      ...current,
      [activeLanguage]: { ...current[activeLanguage], [field]: value },
    }));
  }

  function selectPopupType(nextType: PopupType) {
    setPopupType(nextType);
    if (nextType === 'survey') {
      const first = surveys[0];
      setTargetId(first?.id ?? '');
      setContent(contentFromSurvey(first));
    } else if (nextType === 'event') {
      const first = events[0];
      setTargetId(first?.id ?? '');
      setContent(contentFromEvent(first));
    } else {
      setTargetId('');
      setContent(cloneContent(ANNOUNCEMENT_CONTENT));
    }
  }

  function selectTarget(nextTargetId: string) {
    setTargetId(nextTargetId);
    if (popupType === 'event') {
      setContent(contentFromEvent(events.find((item) => item.id === nextTargetId)));
    } else if (popupType === 'survey') {
      setContent(contentFromSurvey(surveys.find((item) => item.id === nextTargetId)));
    }
  }

  function toggleGroup(groupId: string) {
    setSelectedGroupIds((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const recipientIds =
      recipientMode === 'guest'
        ? guestId
          ? [guestId]
          : []
        : Array.from(new Set(
            groups
              .filter((group) => selectedGroupIds.includes(group.id))
              .flatMap((group) => group.guestIds),
          ));

    if (!recipientIds.length) {
      setError(L(['Lütfen en az bir alıcı seçin.', 'Please select at least one recipient.'], lang));
      return;
    }
    if (popupType !== 'announcement' && !targetId) {
      setError(L(['Lütfen bir hedef seçin.', 'Please select a target.'], lang));
      return;
    }
    if (!activeContent.title.trim()) {
      setError(L(['Lütfen popup başlığını girin.', 'Please enter a popup title.'], lang));
      return;
    }
    if (!date || !time) {
      setError(L(['Tarih ve saat giriniz.', 'Please enter date and time.'], lang));
      return;
    }

    setBusy(true);
    setError('');
    const triggerAt = localDatetimeToISO(date, time);
    const results = await Promise.all(recipientIds.map((id) => onSave({
      guestStayId: id,
      popupType,
      surveyId: popupType === 'survey' ? targetId : null,
      eventId: popupType === 'event' ? targetId : null,
      content,
      triggerAt,
    })));
    const failed = results.find((result) => !result.ok);
    if (!failed) {
      router.push(backHref);
      router.refresh();
      return;
    }
    setError(failed.error ?? L(['Bir hata oluştu.', 'An error occurred.'], lang));
    setBusy(false);
  }

  return (
    <div className="guests-page guest-compose-page guest-popup-compose-page">
      <div className="page-hero guests-hero guest-compose-hero">
        <div>
          <h1 className="page-hero__h">{L(['Yeni Popup', 'New Popup'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              ["Misafire anket, etkinlik ya da özel bir duyuru popup'ı planlayın.", 'Schedule a survey, event, or custom announcement popup for the guest.'],
              lang,
            )}
          </p>
        </div>
        <div className="page-hero__actions">
          <button className="btn btn--ghost" type="button" onClick={() => router.push(backHref)}>
            <X />
            {L(['Vazgeç', 'Cancel'], lang)}
          </button>
        </div>
      </div>

      {error && (
        <div className="guests-notice guest-compose-error guest-popup-compose-error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label={L(['Kapat', 'Close'], lang)}>×</button>
        </div>
      )}

      <form className="card guest-compose-card guest-popup-compose-card" onSubmit={handleSubmit}>
        <div className="card__body guest-popup-compose-body">
          <div className="guest-popup-compose-fields">
            <section className="guest-popup-field">
              <span className="flabel">{L(['Kime', 'To'], lang)}</span>
              <div className="guests-chips guest-popup-choice-row">
                <button
                  className={`guests-chip${recipientMode === 'guest' ? ' active' : ''}`}
                  type="button"
                  onClick={() => setRecipientMode('guest')}
                >
                  <Smile size={15} />
                  {L(['Misafir', 'Guest'], lang)}
                </button>
                <button
                  className={`guests-chip${recipientMode === 'group' ? ' active' : ''}`}
                  type="button"
                  onClick={() => setRecipientMode('group')}
                >
                  <Users size={15} />
                  {L(['Grup', 'Group'], lang)}
                </button>
              </div>

              {recipientMode === 'guest' ? (
                <select
                  className="fselect"
                  value={guestId}
                  onChange={(event) => {
                    setGuestId(event.target.value);
                    setError('');
                  }}
                >
                  <option value="">{L(['Misafir seçin…', 'Choose a guest…'], lang)}</option>
                  {guests.map((guest) => (
                    <option key={guest.id} value={guest.id}>
                      {guest.name} — {L(['Oda', 'Room'], lang)} {guest.room}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="guest-popup-group-list">
                  {groups.map((group) => {
                    const selected = selectedGroupIds.includes(group.id);
                    return (
                      <button
                        key={group.id}
                        className={`guest-popup-group-option${selected ? ' is-selected' : ''}`}
                        type="button"
                        onClick={() => toggleGroup(group.id)}
                      >
                        <span className="guest-popup-group-check">{selected && <Check size={14} />}</span>
                        <span>
                          <strong>{group.name}</strong>
                          <small>{group.guestIds.length} {L(['misafir', 'guests'], lang)}</small>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {recipientMode === 'guest' && selectedGuest?.checkOut && (
                <p className="fhint">
                  {L(['Check-out:', 'Check-out:'], lang)}{' '}
                  {new Date(selectedGuest.checkOut).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-GB')}
                </p>
              )}
            </section>

            <section className="guest-popup-field">
              <span className="flabel">{L(['Popup Türü', 'Popup Type'], lang)}</span>
              <div className="guests-chips guest-popup-choice-row">
                {([
                  ['survey', ClipboardList, L(['Anket', 'Survey'], lang)],
                  ['event', CalendarDays, L(['Etkinlik', 'Event'], lang)],
                  ['announcement', Bell, L(['Duyuru', 'Announcement'], lang)],
                ] as const).map(([type, Icon, label]) => (
                  <button
                    key={type}
                    className={`guests-chip${popupType === type ? ' active' : ''}`}
                    type="button"
                    onClick={() => selectPopupType(type)}
                  >
                    <Icon size={15} />
                    {label}
                  </button>
                ))}
              </div>
            </section>

            {popupType !== 'announcement' ? (
              <section className="guest-popup-field">
                <label className="flabel" htmlFor="popup-target">
                  {popupType === 'event' ? L(['Etkinlik', 'Event'], lang) : L(['Anket', 'Survey'], lang)}
                </label>
                <select
                  className="fselect"
                  id="popup-target"
                  value={targetId}
                  onChange={(event) => selectTarget(event.target.value)}
                >
                  <option value="">{L(['Seçin…', 'Choose…'], lang)}</option>
                  {popupType === 'event'
                    ? events.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.name[lang] ?? target.name.en ?? target.name.tr ?? ''}
                        </option>
                      ))
                    : surveys.map((target) => (
                        <option key={target.id} value={target.id}>
                          {target.name}
                        </option>
                      ))}
                </select>
                {popupType === 'event' && events.length === 0 && (
                  <p className="fhint">{L(['Yayında etkinlik bulunmuyor.', 'No published events available.'], lang)}</p>
                )}
                {popupType === 'survey' && surveys.length === 0 && (
                  <p className="fhint">{L(['Yayında anket bulunmuyor.', 'No published surveys available.'], lang)}</p>
                )}
              </section>
            ) : (
              <p className="fhint guest-popup-announcement-hint">
                {L(
                  ['Özel duyuru için hedef seçmenize gerek yok; başlık, açıklama ve buton metnini kendiniz yazın.', 'No target is needed for a custom announcement; write your own title, description and button text.'],
                  lang,
                )}
              </p>
            )}

            <section className="guest-popup-field">
              <span className="flabel">{L(['Diller', 'Languages'], lang)}</span>
              <p className="fhint guest-popup-languages-hint">
                {L(
                  ['Popup TR, EN, DE ve RU dillerinde gösterilir; başlık, açıklama ve buton metnini her dil için ayrı girin.', 'The popup is shown in TR, EN, DE and RU; enter title, description and button text separately for each language.'],
                  lang,
                )}
              </p>
              <div className="guest-popup-language-tabs" role="tablist">
                {CONTENT_LANGS.map((language) => (
                  <button
                    key={language}
                    className={activeLanguage === language ? 'active' : ''}
                    type="button"
                    role="tab"
                    aria-selected={activeLanguage === language}
                    onClick={() => setActiveLanguage(language)}
                  >
                    {language.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="guest-popup-language-fields">
                <label className="guest-popup-field">
                  <span className="flabel">{L(['Başlık', 'Title'], lang)}</span>
                  <input
                    className="finput"
                    value={activeContent.title}
                    onChange={(event) => updateActiveContent('title', event.target.value)}
                  />
                </label>
                <label className="guest-popup-field">
                  <span className="flabel">{L(['Açıklama', 'Description'], lang)}</span>
                  <textarea
                    className="ftextarea guest-popup-description"
                    value={activeContent.description}
                    onChange={(event) => updateActiveContent('description', event.target.value)}
                  />
                </label>
                <label className="guest-popup-field">
                  <span className="flabel">{L(['Buton Metni', 'Button Label'], lang)}</span>
                  <input
                    className="finput"
                    value={activeContent.buttonLabel}
                    onChange={(event) => updateActiveContent('buttonLabel', event.target.value)}
                  />
                </label>
              </div>
            </section>

            <div className="fgrid guest-popup-datetime">
              <label className="guest-popup-field">
                <span className="flabel">{L(['Tarih', 'Date'], lang)}</span>
                <input className="finput" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
              <label className="guest-popup-field">
                <span className="flabel">{L(['Saat', 'Time'], lang)}</span>
                <input className="finput" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
              </label>
            </div>

            <p className="fhint guest-compose-hint">
              {L(
                ["Popup, misafirin uygulamasında bu tarih ve saatte görünecek.", "The popup will appear in the guest's app at this date and time."],
                lang,
              )}
            </p>
          </div>

          <aside className="guest-popup-preview-column">
            <span className="guest-popup-preview-label">{L(['Önizleme', 'Preview'], lang)}</span>
            <div className={`guest-popup-preview type-${popupType}`}>
              <span className="guest-popup-preview-close"><X size={13} /></span>
              <span className="guest-popup-preview-icon"><PreviewIcon size={21} /></span>
              <strong>{activeContent.title || L(['Popup Başlığı', 'Popup Title'], lang)}</strong>
              <p>{activeContent.description || L(['Popup açıklaması burada gösterilir.', 'Popup description appears here.'], lang)}</p>
              <span className="guest-popup-preview-button">
                {activeContent.buttonLabel || L(['Devam Et', 'Continue'], lang)}
              </span>
              {popupType === 'survey' && (
                <span className="guest-popup-preview-skip">
                  {L(['Geç, bağlan', 'Skip, connect me'], lang)}
                </span>
              )}
            </div>
          </aside>
        </div>

        <div className="guest-compose-card__footer">
          <button className="btn btn--ghost" type="button" onClick={() => router.push(backHref)} disabled={busy}>
            {L(['Vazgeç', 'Cancel'], lang)}
          </button>
          <button className="btn btn--primary" type="submit" disabled={busy}>
            <Send />
            {busy ? L(['Gönderiliyor…', 'Sending…'], lang) : L(['Gönder', 'Send'], lang)}
          </button>
        </div>
      </form>
    </div>
  );
}
