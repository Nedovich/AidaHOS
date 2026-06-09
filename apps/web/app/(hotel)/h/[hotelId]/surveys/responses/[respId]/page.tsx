import { notFound } from 'next/navigation';
import { Check, ClipboardList, Clock, Download, Flag, Phone, Shield } from 'lucide-react';
import { getResponseById, type ResponseStatus, type SurveyNote } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { L, type Lang } from '@/lib/i18n';
import { GAvatar, Stars, Subhero } from '@/components/console/survey-helpers';
import { ResponseInternalForm } from '@/components/console/response-internal-form';

type Pair = readonly [string, string];

const STATUS_BADGE: Record<ResponseStatus, ['err' | 'info' | 'ok', Pair]> = {
  flagged: ['err', ['İşaretlendi', 'Flagged']],
  new: ['info', ['Yeni', 'New']],
  reviewed: ['ok', ['İncelendi', 'Reviewed']],
};

type LocStr = string | Record<string, string> | undefined;
type SurveyChoice = string | { value: string; text?: LocStr };
type SurveyQuestion = { type?: string; name?: string; title?: LocStr; rateMax?: number; choices?: SurveyChoice[] };

/** SurveyJS strings may be a plain string or a localized object {default,tr,de,…}. */
function locStr(v: LocStr): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return v.default ?? v.en ?? Object.values(v)[0] ?? '';
}

function flattenQuestions(json: unknown): SurveyQuestion[] {
  const j = json as { pages?: { elements?: SurveyQuestion[] }[]; elements?: SurveyQuestion[] } | null;
  if (!j) return [];
  if (Array.isArray(j.pages)) return j.pages.flatMap((p) => p.elements ?? []);
  return j.elements ?? [];
}

function choiceLabel(c: SurveyChoice): { value: string; text: string } {
  return typeof c === 'string' ? { value: c, text: c } : { value: c.value, text: locStr(c.text) || c.value };
}

function MsChip({ label, sel }: { label: string; sel: boolean }) {
  return (
    <span className={`mschip${sel ? ' sel' : ''}`}>
      <span className="mschip__box">{sel ? <Check size={11} /> : null}</span>
      {label}
    </span>
  );
}

function AnswerView({ q, value, lang }: { q: SurveyQuestion; value: unknown; lang: Lang }) {
  const type = q.type ?? 'text';
  if (value == null || value === '') return <div className="quote" style={{ fontStyle: 'italic', color: 'var(--text-3)' }}>{L(['(boş)', '(empty)'], lang)}</div>;

  if (type === 'rating') {
    const v = Number(value);
    const max = q.rateMax ?? 5;
    return (
      <>
        <Stars score={max > 5 ? (v / max) * 5 : v} /> <span style={{ color: 'var(--text-3)', fontSize: 'var(--text-sm)' }}>{v} / {max}</span>
      </>
    );
  }
  if (type === 'checkbox') {
    const arr = Array.isArray(value) ? (value as string[]) : [];
    const choices = (q.choices ?? []).map(choiceLabel);
    if (choices.length === 0) return <div className="mschips">{arr.map((a, i) => <MsChip key={i} label={a} sel />)}</div>;
    return <div className="mschips">{choices.map((c, i) => <MsChip key={i} label={c.text} sel={arr.includes(c.value)} />)}</div>;
  }
  if (type === 'boolean') {
    return <div style={{ fontWeight: 600 }}>{value ? L(['Evet', 'Yes'], lang) : L(['Hayır', 'No'], lang)}</div>;
  }
  if (type === 'radiogroup' || type === 'dropdown') {
    const choices = (q.choices ?? []).map(choiceLabel);
    const match = choices.find((c) => c.value === value);
    return <span className="mschip sel"><span className="mschip__box"><Check size={11} /></span>{match?.text ?? String(value)}</span>;
  }
  // comment / text / default
  return <div className="quote">{typeof value === 'object' ? JSON.stringify(value) : String(value)}</div>;
}

export default async function ResponseDetailPage({ params }: { params: Promise<{ hotelId: string; respId: string }> }) {
  const { hotelId, respId } = await params;
  const lang: Lang = await getLang();
  const base = `/h/${hotelId}/surveys`;

  const resp = await getResponseById(respId);
  if (!resp) notFound();

  const [badgeCls, badgeLabel] = STATUS_BADGE[resp.status];
  const questions = flattenQuestions(resp.surveyJson);
  const data = (resp.data ?? {}) as Record<string, unknown>;
  const notes = (Array.isArray(resp.internalNotes) ? resp.internalNotes : []) as SurveyNote[];
  const score = resp.score != null ? Number(resp.score) : null;
  const submitted = new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(resp.submittedAt);
  const guestName = resp.guestName ?? L(['İsimsiz Misafir', 'Anonymous Guest'], lang);

  return (
    <>
      <Subhero
        backHref={`${base}/responses`}
        title={resp.roomNo ? L([`Oda ${resp.roomNo}'den Yanıt`, `Response from Room ${resp.roomNo}`], lang) : L(['Yanıt Detayı', 'Response Detail'], lang)}
        pill={
          <span className={`badge badge--${badgeCls}`} style={{ fontSize: 'var(--text-sm)' }}>
            <span className="ico-dot" />
            {L(badgeLabel, lang)}
          </span>
        }
        sub={L([`${submitted} tarihinde gönderildi`, `Submitted ${submitted}`], lang)}
        actions={
          <>
            <button className="btn btn--ghost btn--sm" type="button"><ClipboardList size={15} /> {L(['Yazdır', 'Print'], lang)}</button>
            <button className="btn btn--ghost btn--sm" type="button"><Download size={15} /> {L(['PDF Aktar', 'Export PDF'], lang)}</button>
            <button className="btn btn--ghost btn--sm" type="button" style={{ color: 'var(--danger)', borderColor: 'color-mix(in srgb, var(--danger) 30%, transparent)' }}><Flag size={15} /> {L(['İşaretle', 'Flag'], lang)}</button>
          </>
        }
      />

      <div className="grid" style={{ gridTemplateColumns: '1fr 280px', gap: 'var(--sp-5)', marginBottom: 'var(--sp-5)' }}>
        <div className="card">
          <div className="card__body">
            <div className="gprofile">
              <GAvatar name={guestName} size={48} />
              <div>
                <div className="gprofile__name">{guestName}</div>
                <div className="gprofile__meta">
                  <div><div className="k">{L(['Oda', 'Room'], lang)}</div><div className="v">{resp.roomNo ?? '—'}</div></div>
                  <div><div className="k">{L(['Anket', 'Survey'], lang)}</div><div className="v">{resp.surveyName}</div></div>
                  <div><div className="k">{L(['Kaynak', 'Source'], lang)}</div><div className="v">{resp.source ?? '—'}</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="scorecard">
          <div className="scorecard__l">{L(['Genel Skor', 'Overall Score'], lang)}</div>
          <div className="scorecard__v">{score != null ? score.toFixed(1) : '—'}<span className="max"> / 5.0</span></div>
          {score != null ? <Stars score={score} /> : null}
        </div>
      </div>

      <div className="metastrip" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="metastrip__i"><Phone size={15} />{L(['Cihaz', 'Device'], lang)}: <b>{resp.device ?? '—'}</b></div>
        <div className="metastrip__i"><Shield size={15} />{L(['Doğrulama', 'Auth'], lang)}: <b>{resp.authMethod ?? '—'}</b></div>
        <div className="metastrip__i"><Clock size={15} />{L(['Tamamlama süresi', 'Time to complete'], lang)}: <b>{resp.completionSeconds != null ? `${Math.floor(resp.completionSeconds / 60)}${L(['dk', 'm'], lang)} ${resp.completionSeconds % 60}${L(['sn', 's'], lang)}` : '—'}</b></div>
      </div>

      <div className="grid grid--resp">
        <div className="card">
          <div className="card__head"><div className="card__title">{L(['Anket Yanıtları', 'Survey Responses'], lang)}</div></div>
          <div className="card__body" style={{ paddingTop: 10 }}>
            {questions.length === 0 && (
              <div className="cell-sub">{L(['Bu yanıt için soru tanımı bulunamadı.', 'No question definitions for this response.'], lang)}</div>
            )}
            {questions.map((q, i) => (
              <div className="qblock" key={q.name ?? i}>
                <div className="qblock__n">{L([`Soru ${i + 1}`, `Question ${i + 1}`], lang)}</div>
                <div className="qblock__q">{locStr(q.title) || q.name}</div>
                <AnswerView q={q} value={q.name ? data[q.name] : undefined} lang={lang} />
              </div>
            ))}
          </div>
        </div>

        <ResponseInternalForm
          hotelId={hotelId}
          respId={respId}
          status={resp.status}
          assigneeName={resp.assigneeName}
          notes={notes}
        />
      </div>
    </>
  );
}
