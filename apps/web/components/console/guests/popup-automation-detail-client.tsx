'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ClipboardList,
  Clock3,
  Pause,
  Pencil,
  Play,
  Smile,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Kpi } from '@/components/console/charts';
import { L, type Lang } from '@/lib/i18n';
import type { PopupContentMap } from '@aidahos/db/portal-config';

type ContentLanguage = 'tr' | 'en' | 'de' | 'ru';
type AutomationTiming = 'd3' | 'd2' | 'd1' | 'd0' | 'every';

interface AutomationDetail {
  id: string;
  kind: 'checkout' | 'default';
  timing: AutomationTiming;
  content: PopupContentMap | null;
  status: 'active' | 'paused';
  createdAt: string;
}

const LANGUAGES: ContentLanguage[] = ['tr', 'en', 'de', 'ru'];

const FALLBACK_CONTENT = {
  checkout: {
    tr: { title: 'Check-out Geri Bildirimi', description: 'Konaklamanız hakkındaki görüşlerinizi 2 dakikada paylaşın.', buttonLabel: 'Anketi Doldur' },
    en: { title: 'Check-out Feedback', description: 'Share your thoughts about your stay in 2 minutes.', buttonLabel: 'Take Survey' },
    de: { title: 'Check-out Feedback', description: 'Teilen Sie uns in 2 Minuten Ihre Meinung zu Ihrem Aufenthalt mit.', buttonLabel: 'Umfrage starten' },
    ru: { title: 'Отзыв о выезде', description: 'Поделитесь впечатлениями о проживании за 2 минуты.', buttonLabel: 'Пройти опрос' },
  },
  default: {
    tr: { title: 'Karşılama Anketi', description: 'Deneyiminizi bizimle paylaşır mısınız? Sadece 1 dakika sürer.', buttonLabel: 'Anketi Doldur' },
    en: { title: 'Welcome Survey', description: 'Would you share your experience with us? It only takes a minute.', buttonLabel: 'Take Survey' },
    de: { title: 'Willkommensumfrage', description: 'Teilen Sie Ihre Erfahrung mit uns. Es dauert nur eine Minute.', buttonLabel: 'Umfrage starten' },
    ru: { title: 'Приветственный опрос', description: 'Поделитесь впечатлениями. Это займет всего одну минуту.', buttonLabel: 'Пройти опрос' },
  },
} as const;

function timingLabel(timing: AutomationTiming, lang: Lang) {
  const labels: Record<AutomationTiming, [string, string]> = {
    d3: ['Çıkıştan 3 gün önce', '3 days before check-out'],
    d2: ['Çıkıştan 2 gün önce', '2 days before check-out'],
    d1: ['Çıkıştan 1 gün önce', '1 day before check-out'],
    d0: ['Çıkış günü', 'On check-out day'],
    every: ['Tamamlanana kadar her girişte', 'Every check-in until completed'],
  };
  return L(labels[timing], lang);
}

function timingHint(timing: AutomationTiming, lang: Lang) {
  if (timing === 'every') {
    return L(
      ["Popup, misafir anketi doldurana kadar her check-in'de tekrar gösterilir.", 'The popup is shown again at every check-in until the guest completes it.'],
      lang,
    );
  }
  if (timing === 'd0') {
    return L(["Popup, misafirin check-out günü otomatik gönderilir.", "The popup is sent automatically on the guest's check-out day."], lang);
  }
  const days = timing === 'd3' ? 3 : timing === 'd2' ? 2 : 1;
  return L(
    [`Popup, misafirin çıkış tarihinden ${days} gün önce otomatik gönderilir.`, `The popup is sent automatically ${days} day(s) before the guest's check-out date.`],
    lang,
  );
}

function formatCreated(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '25.06.2026 · 09:00';
  return `${date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })} · ${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}`;
}

export function PopupAutomationDetailClient({
  hotelId,
  lang,
  initialAutomation,
  onToggle,
  onDelete,
}: {
  hotelId: string;
  lang: Lang;
  initialAutomation: AutomationDetail;
  onToggle: () => Promise<{ ok: boolean }>;
  onDelete: () => Promise<{ ok: boolean }>;
}) {
  const router = useRouter();
  const [automation, setAutomation] = useState(initialAutomation);
  const [activeLanguage, setActiveLanguage] = useState<ContentLanguage>('tr');
  const [pending, startTransition] = useTransition();
  const backHref = `/h/${hotelId}/surveys/sends`;
  const editingHref = `${backHref}/automations/${automation.id}/edit`;
  const active = automation.status === 'active';
  const Icon = automation.kind === 'checkout' ? ClipboardList : Smile;
  const name = automation.kind === 'checkout'
    ? L(['Çıkış Anketi', 'Checkout Survey'], lang)
    : L(['Varsayılan Anket', 'Default Survey'], lang);
  const fallback = FALLBACK_CONTENT[automation.kind][activeLanguage];
  const stored = automation.content?.[activeLanguage];
  const preview = {
    title: stored?.title || fallback.title,
    description: stored?.description || fallback.description,
    buttonLabel: stored?.buttonLabel || fallback.buttonLabel,
  };

  function toggleStatus() {
    startTransition(async () => {
      const result = await onToggle();
      if (!result.ok) return;
      setAutomation((current) => ({
        ...current,
        status: current.status === 'active' ? 'paused' : 'active',
      }));
      router.refresh();
    });
  }

  function deleteAutomation() {
    if (!window.confirm(L(['Bu otomasyonu silmek istediğinize emin misiniz?', 'Are you sure you want to delete this automation?'], lang))) return;
    startTransition(async () => {
      const result = await onDelete();
      if (!result.ok) return;
      router.push(backHref);
      router.refresh();
    });
  }

  return (
    <div className="guests-page guest-automation-detail">
      <header className="guest-automation-detail__head">
        <button className="back-btn" type="button" onClick={() => router.push(backHref)} aria-label={L(['Geri dön', 'Go back'], lang)}>
          <ChevronLeft size={21} />
        </button>
        <span className={`guest-automation-detail__hero-icon tone-${automation.kind}`}><Icon size={30} /></span>
        <div className="guest-automation-detail__heading">
          <div className="guest-automation-detail__breadcrumb">
            <span>{L(['Popup Gönderimleri', 'Popup Sends'], lang)}</span>
            <ChevronLeft size={14} className="guest-automation-detail__crumb-arrow" />
            <strong>{name}</strong>
          </div>
          <div className="guest-automation-detail__title-row">
            <h1>{name}</h1>
            <span className={`guest-popup-automation-row__status ${active ? 'is-active' : 'is-paused'}`}>
              <Check size={13} />
              {active ? L(['Aktif', 'Active'], lang) : L(['Duraklatıldı', 'Paused'], lang)}
            </span>
          </div>
          <p>{timingLabel(automation.timing, lang)} · {L(['Tüm misafirler', 'All guests'], lang)}</p>
        </div>
        <div className="guest-automation-detail__actions">
          <button className="btn btn--ghost" type="button" onClick={toggleStatus} disabled={pending}>
            {active ? <Pause size={17} /> : <Play size={17} />}
            {active ? L(['Duraklat', 'Pause'], lang) : L(['Etkinleştir', 'Activate'], lang)}
          </button>
          <button className="btn btn--ghost" type="button" onClick={() => router.push(editingHref)}>
            <Pencil size={17} />{L(['Düzenle', 'Edit'], lang)}
          </button>
          <button className="btn guest-automation-detail__delete" type="button" onClick={deleteAutomation} disabled={pending}>
            <Trash2 size={17} />{L(['Sil', 'Delete'], lang)}
          </button>
        </div>
      </header>

      <div className="grid grid--kpi guest-automation-detail__kpis">
        <Kpi icon={<ClipboardList />} label={L(['Gönderildi', 'Sent'], lang)} value="0" />
        <Kpi icon={<Check />} label={L(['Tamamlandı', 'Completed'], lang)} value="0" />
        <Kpi icon={<Clock3 />} label={L(['Zamanlandı', 'Scheduled'], lang)} value="0" />
      </div>

      <div className="guest-automation-detail__layout">
        <div className="guest-automation-detail__main">
          <section className="card guest-automation-settings">
            <div className="card__head">
              <h2 className="card__title">{L(['Otomasyon Ayarları', 'Automation Settings'], lang)}</h2>
            </div>
            <div className="card__body guest-automation-settings__body">
              <div className="guest-automation-settings__row"><span><ClipboardList size={18} />{L(['Anket Türü', 'Survey Type'], lang)}</span><strong>{name}</strong></div>
              <div className="guest-automation-settings__row"><span><Clock3 size={18} />{L(['Zamanlama', 'Timing'], lang)}</span><strong>{timingLabel(automation.timing, lang)}</strong></div>
              <div className="guest-automation-settings__row"><span><Users size={18} />{L(['Hedef Kitle', 'Audience'], lang)}</span><strong>{L(['Tüm misafirler', 'All guests'], lang)}</strong></div>
              <div className="guest-automation-settings__row"><span><CalendarDays size={18} />{L(['Oluşturuldu', 'Created'], lang)}</span><strong className="mono">{formatCreated(automation.createdAt)}</strong></div>
              <p className="guest-automation-settings__hint">{timingHint(automation.timing, lang)}</p>
            </div>
          </section>

          <section className="card guest-automation-preview-card">
            <div className="card__head">
              <h2 className="card__title">{L(['Popup Önizleme', 'Popup Preview'], lang)}</h2>
            </div>
            <div className="card__body">
              <div className="guest-popup-language-tabs" role="tablist">
                {LANGUAGES.map((language) => (
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
              <div className={`guest-popup-preview guest-automation-detail__preview type-${automation.kind}`}>
                <span className="guest-popup-preview-close"><X size={13} /></span>
                <span className="guest-popup-preview-icon"><Icon size={21} /></span>
                <strong>{preview.title}</strong>
                <p>{preview.description}</p>
                <span className="guest-popup-preview-button">{preview.buttonLabel}</span>
              </div>
            </div>
          </section>
        </div>

        <aside className="card guest-automation-detail__note">
          <p>{L(
            [
              'Bu otomasyon, koşul sağlandığında tüm aktif misafirlere otomatik olarak gönderilir.',
              'This automation sends automatically to all active guests whenever the condition is met.',
            ],
            lang,
          )}</p>
        </aside>
      </div>
    </div>
  );
}
