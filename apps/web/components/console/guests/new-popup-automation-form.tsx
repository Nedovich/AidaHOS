'use client';

import { type FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, Check, ChevronLeft, ClipboardList, RefreshCw, Smile, Users, X } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import type { PopupContentMap } from '@aidahos/db/portal-config';

type AutomationKind = 'checkout' | 'default';
type AutomationTiming = 'd3' | 'd2' | 'd1' | 'd0' | 'every';
type ContentLanguage = 'tr' | 'en' | 'de' | 'ru';

interface AutomationContent {
  title: string;
  description: string;
  buttonLabel: string;
}

export interface PopupAutomationInput {
  kind: AutomationKind;
  timing: AutomationTiming;
  surveyId: string | null;
  content: PopupContentMap;
  status: 'active' | 'paused';
}

export interface PopupAutomationData {
  id: string;
  kind: AutomationKind;
  timing: AutomationTiming;
  surveyId: string | null;
  content: PopupContentMap | null;
  status: 'active' | 'paused';
}

const CONTENT_LANGUAGES: ContentLanguage[] = ['tr', 'en', 'de', 'ru'];

const DEFAULT_CONTENT: Record<AutomationKind, Record<ContentLanguage, AutomationContent>> = {
  checkout: {
    tr: {
      title: 'Check-out Geri Bildirimi',
      description: 'Konaklamanız hakkındaki görüşlerinizi 2 dakikada paylaşın.',
      buttonLabel: 'Anketi Doldur',
    },
    en: {
      title: 'Check-out Feedback',
      description: 'Share your thoughts about your stay in 2 minutes.',
      buttonLabel: 'Take Survey',
    },
    de: {
      title: 'Check-out Feedback',
      description: 'Teilen Sie uns in 2 Minuten Ihre Meinung zu Ihrem Aufenthalt mit.',
      buttonLabel: 'Umfrage starten',
    },
    ru: {
      title: 'Отзыв о выезде',
      description: 'Поделитесь впечатлениями о проживании за 2 минуты.',
      buttonLabel: 'Пройти опрос',
    },
  },
  default: {
    tr: {
      title: 'Karşılama Anketi',
      description: 'Deneyiminizi bizimle paylaşır mısınız? Sadece 1 dakika sürer.',
      buttonLabel: 'Anketi Doldur',
    },
    en: {
      title: 'Welcome Survey',
      description: 'Would you share your experience with us? It only takes a minute.',
      buttonLabel: 'Take Survey',
    },
    de: {
      title: 'Willkommensumfrage',
      description: 'Teilen Sie Ihre Erfahrung mit uns. Es dauert nur eine Minute.',
      buttonLabel: 'Umfrage starten',
    },
    ru: {
      title: 'Приветственный опрос',
      description: 'Поделитесь впечатлениями. Это займет всего одну минуту.',
      buttonLabel: 'Пройти опрос',
    },
  },
};

// 'every' is the only honest value for kind='default' — hasGuestResponded only
// supports "keep offering until answered this stay", there's no "ask once ever".
const TIMINGS: Record<AutomationKind, AutomationTiming[]> = {
  checkout: ['d3', 'd2', 'd1', 'd0'],
  default: ['every'],
};

function cloneContent(kind: AutomationKind): Record<ContentLanguage, AutomationContent> {
  return Object.fromEntries(
    CONTENT_LANGUAGES.map((language) => [language, { ...DEFAULT_CONTENT[kind][language] }]),
  ) as Record<ContentLanguage, AutomationContent>;
}

function contentFromAutomation(automation: PopupAutomationData): Record<ContentLanguage, AutomationContent> {
  const base = cloneContent(automation.kind);
  CONTENT_LANGUAGES.forEach((language) => {
    const stored = automation.content?.[language];
    if (stored) base[language] = { ...base[language], ...stored };
  });
  return base;
}

function timingLabel(timing: AutomationTiming, lang: Lang) {
  const labels: Record<AutomationTiming, [string, string]> = {
    d3: ['Çıkıştan 3 gün önce', '3 days before check-out'],
    d2: ['Çıkıştan 2 gün önce', '2 days before check-out'],
    d1: ['Çıkıştan 1 gün önce', '1 day before check-out'],
    d0: ['Çıkış günü', 'On check-out day'],
    every: ['Doldurana kadar her girişte', 'Every check-in until completed'],
  };
  return L(labels[timing], lang);
}

function timingHint(kind: AutomationKind, timing: AutomationTiming, lang: Lang) {
  if (kind === 'default') {
    return L(
      ["Popup, misafir anketi doldurana kadar her check-in'de tekrar gösterilir.", 'The popup is shown again at every check-in until the guest completes it.'],
      lang,
    );
  }

  if (timing === 'd0') {
    return L(
      ["Popup, misafirin check-out günü otomatik gönderilir.", "The popup is sent automatically on the guest's check-out day."],
      lang,
    );
  }

  const days = timing === 'd3' ? 3 : timing === 'd2' ? 2 : 1;
  return L(
    [
      `Popup, misafirin çıkış tarihinden ${days} gün önce otomatik gönderilir.`,
      `The popup is sent automatically ${days} day(s) before the guest's check-out date.`,
    ],
    lang,
  );
}

export function NewPopupAutomationForm({
  hotelId,
  lang,
  automation,
  surveys,
  existingKinds,
  onSave,
}: {
  hotelId: string;
  lang: Lang;
  automation?: PopupAutomationData | null;
  surveys: Array<{ id: string; name: string }>;
  existingKinds?: Array<{ id: string; kind: AutomationKind }>;
  onSave: (input: PopupAutomationInput) => Promise<{ ok: boolean; error?: string }>;
}) {
  const router = useRouter();
  const backHref = `/h/${hotelId}/surveys/sends`;
  const editing = Boolean(automation);
  const [kind, setKind] = useState<AutomationKind>(automation?.kind ?? 'checkout');
  const [timing, setTiming] = useState<AutomationTiming>(automation?.timing ?? 'd3');
  const [surveyId, setSurveyId] = useState<string>(automation?.surveyId ?? surveys[0]?.id ?? '');
  const [activeLanguage, setActiveLanguage] = useState<ContentLanguage>('tr');
  const [content, setContent] = useState(() => automation ? contentFromAutomation(automation) : cloneContent('checkout'));
  const [status, setStatus] = useState<'active' | 'paused'>(automation?.status ?? 'active');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // In create mode, if this hotel already has an automation for the selected
  // kind, block the form entirely — only one slot per (hotel, kind) is allowed.
  const conflict = !editing ? existingKinds?.find((a) => a.kind === kind) : undefined;

  const activeContent = content[activeLanguage];
  const typeOptions = useMemo(() => ([
    {
      kind: 'checkout' as const,
      Icon: ClipboardList,
      title: L(['Check-out Anketi', 'Checkout Survey'], lang),
      subtitle: L(['Check-out Geri Bildirimi', 'Check-out Feedback'], lang),
    },
    {
      kind: 'default' as const,
      Icon: Smile,
      title: L(['Karşılama Anketi', 'Default Survey'], lang),
      subtitle: L(['Karşılama Anketi', 'Welcome Survey'], lang),
    },
  ]), [lang]);

  function selectKind(nextKind: AutomationKind) {
    setKind(nextKind);
    setTiming(nextKind === 'checkout' ? 'd3' : 'every');
    setContent(cloneContent(nextKind));
  }

  function updateContent(field: keyof AutomationContent, value: string) {
    setContent((current) => ({
      ...current,
      [activeLanguage]: {
        ...current[activeLanguage],
        [field]: value,
      },
    }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (conflict) return;
    if (!surveyId) {
      setError(L(['Lütfen bir anket seçin.', 'Please select a survey.'], lang));
      return;
    }
    setBusy(true);
    setError('');
    window.dispatchEvent(new Event('aida:nav-start'));
    const res = await onSave({ kind, timing, surveyId, content, status });
    if (res.ok) {
      router.push(backHref);
      router.refresh();
      window.dispatchEvent(new Event('aida:nav-end'));
      return;
    }
    window.dispatchEvent(new Event('aida:nav-end'));
    setError(res.error ?? L(['Kaydedilemedi. Lütfen tekrar deneyin.', 'Could not save. Please try again.'], lang));
    setBusy(false);
  }

  const PreviewIcon = kind === 'checkout' ? ClipboardList : Smile;

  return (
    <div className="guests-page guest-popup-automation-page">
      <div className="page-hero guest-popup-automation-hero">
        <div className="guest-popup-automation-hero__title">
          <button
            className="back-btn"
            type="button"
            onClick={() => router.push(backHref)}
            aria-label={L(['Geri dön', 'Go back'], lang)}
          >
            <ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="page-hero__h">
              {editing
                ? L(['Otomasyonu Düzenle', 'Edit Automation'], lang)
                : L(['Yeni Otomasyon', 'New Automation'], lang)}
            </h1>
            <p className="page-hero__sub">
              {L(
                [
                  "Misafirin check-in/check-out tarihine göre otomatik gönderilecek bir anket kuralı tanımlayın.",
                  "Define a survey rule that sends automatically based on the guest's check-in/check-out date.",
                ],
                lang,
              )}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="guests-notice" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label={L(['Kapat', 'Close'], lang)}>×</button>
        </div>
      )}

      {conflict && (
        <div className="guests-notice guests-notice--warning" role="alert">
          <AlertTriangle size={16} />
          <span>
            {kind === 'checkout'
              ? L(
                  ['Bu otel için zaten bir Check-out Anketi otomasyonu belirlediniz. Yeni bir tane oluşturamazsınız. Değişiklik yapmak için mevcut otomasyonu düzenleyin.', 'You already have a Checkout Survey automation set for this hotel. You can\'t create a second one. To make changes, edit the existing automation.'],
                  lang,
                )
              : L(
                  ['Bu otel için zaten bir Karşılama Anketi otomasyonu belirlediniz. Yeni bir tane oluşturamazsınız. Değişiklik yapmak için mevcut otomasyonu düzenleyin.', 'You already have a Default Survey automation set for this hotel. You can\'t create a second one. To make changes, edit the existing automation.'],
                  lang,
                )}
            {' '}
            <Link href={`${backHref}/automations/${conflict.id}/edit`}>
              {L(['Otomasyonu Düzenle', 'Edit Automation'], lang)}
            </Link>
          </span>
        </div>
      )}

      <form className="card guest-popup-automation-card" onSubmit={handleSubmit}>
        <div className="card__body guest-popup-automation-body">
          <div className="guest-popup-automation-fields">
            <section className="guest-popup-automation-field">
              <span className="flabel">{L(['Anket Türü', 'Survey Type'], lang)}</span>
              <div className="guest-popup-automation-types">
                {typeOptions.map(({ kind: optionKind, Icon, title, subtitle }) => (
                  <button
                    className={`guest-popup-automation-type${kind === optionKind ? ' active' : ''} type-${optionKind}`}
                    type="button"
                    key={optionKind}
                    onClick={() => selectKind(optionKind)}
                    disabled={editing}
                  >
                    <span><Icon size={18} /></span>
                    <strong>{title}</strong>
                    <small>{subtitle}</small>
                  </button>
                ))}
              </div>
            </section>

            <div style={conflict ? { opacity: 0.5, pointerEvents: 'none' } : undefined}>
            <section className="guest-popup-automation-field">
              <label className="flabel" htmlFor="automation-survey">{L(['Anket', 'Survey'], lang)}</label>
              <select
                className="fselect"
                id="automation-survey"
                value={surveyId}
                onChange={(event) => setSurveyId(event.target.value)}
              >
                <option value="">{L(['Seçin…', 'Choose…'], lang)}</option>
                {surveys.map((survey) => (
                  <option key={survey.id} value={survey.id}>{survey.name}</option>
                ))}
              </select>
              {surveys.length === 0 && (
                <p className="fhint">{L(['Yayında anket bulunmuyor.', 'No published surveys available.'], lang)}</p>
              )}
            </section>

            <section className="guest-popup-automation-field">
              <span className="flabel">{L(['Gönderim Zamanlaması', 'Send Timing'], lang)}</span>
              <div className="guest-popup-automation-timings">
                {TIMINGS[kind].map((option) => (
                  <button
                    className={timing === option ? 'active' : ''}
                    type="button"
                    key={option}
                    onClick={() => setTiming(option)}
                  >
                    {timingLabel(option, lang)}
                  </button>
                ))}
              </div>
              <p className="fhint">{timingHint(kind, timing, lang)}</p>
            </section>

            <p className="fhint guest-popup-automation-audience">
              <Users size={15} />
              {L(['Bu otomasyon tüm misafirlere uygulanır.', 'This automation applies to all guests.'], lang)}
            </p>

            <section className="guest-popup-automation-field">
              <span className="flabel">{L(['Diller', 'Languages'], lang)}</span>
              <p className="fhint">
                {L(
                  [
                    'Popup TR, EN, DE ve RU dillerinde gösterilir; başlık, açıklama ve buton metnini her dil için ayrı girin.',
                    'The popup is shown in TR, EN, DE and RU; enter title, description and button text separately for each language.',
                  ],
                  lang,
                )}
              </p>
              <div className="guest-popup-language-tabs" role="tablist">
                {CONTENT_LANGUAGES.map((language) => (
                  <button
                    className={activeLanguage === language ? 'active' : ''}
                    type="button"
                    role="tab"
                    aria-selected={activeLanguage === language}
                    key={language}
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
                    onChange={(event) => updateContent('title', event.target.value)}
                  />
                </label>
                <label className="guest-popup-field">
                  <span className="flabel">{L(['Açıklama', 'Description'], lang)}</span>
                  <textarea
                    className="ftextarea guest-popup-automation-description"
                    value={activeContent.description}
                    onChange={(event) => updateContent('description', event.target.value)}
                  />
                </label>
                <label className="guest-popup-field">
                  <span className="flabel">{L(['Buton Metni', 'Button Label'], lang)}</span>
                  <input
                    className="finput"
                    value={activeContent.buttonLabel}
                    onChange={(event) => updateContent('buttonLabel', event.target.value)}
                  />
                </label>
              </div>
            </section>
            </div>
          </div>

          <aside className="guest-popup-preview-column">
            <span className="guest-popup-preview-label">{L(['Önizleme', 'Preview'], lang)}</span>
            <div className={`guest-popup-preview guest-popup-automation-preview type-${kind}`}>
              <span className="guest-popup-preview-close"><X size={13} /></span>
              <span className="guest-popup-preview-icon"><PreviewIcon size={21} /></span>
              <strong>{activeContent.title}</strong>
              <p>{activeContent.description}</p>
              <span className="guest-popup-preview-button">{activeContent.buttonLabel}</span>
              <span className="guest-popup-preview-skip">
                {L(['Geç, bağlan', 'Skip, connect me'], lang)}
              </span>
            </div>
          </aside>
        </div>

        <div className="guest-compose-card__footer">
          <button className="btn btn--ghost" type="button" onClick={() => router.push(backHref)} disabled={busy}>
            {L(['Vazgeç', 'Cancel'], lang)}
          </button>
          <button
            className="btn btn--primary"
            type="submit"
            disabled={busy || Boolean(conflict)}
            aria-busy={busy}
            style={busy ? { opacity: 0.75, cursor: 'progress' } : undefined}
          >
            {editing ? <Check size={16} /> : <RefreshCw size={16} />}
            {busy
              ? L(['Kaydediliyor…', 'Saving…'], lang)
              : editing
                ? L(['Kaydet', 'Save'], lang)
                : L(['Otomasyonu Oluştur', 'Create Automation'], lang)}
          </button>
        </div>
      </form>
    </div>
  );
}
