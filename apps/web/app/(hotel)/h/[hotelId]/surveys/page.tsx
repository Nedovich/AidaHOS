import Link from 'next/link';
import { ClipboardList, Plus, Smile, Sparkles, TrendingUp } from 'lucide-react';
import { getLang } from '@/lib/i18n-server';
import { L, type Lang } from '@/lib/i18n';
import { SurveySubnav } from '@/components/console/survey-subnav';
import { Donut, Kpi, MiniBar, StatusBadge, type StatusKind } from '@/components/console/charts';

type Pair = readonly [string, string];

const ACTIVE: { id: string; name: Pair; scope: Pair; responses: number; completion: number; status: StatusKind }[] = [
  { id: 'checkout', name: ['Check-out Memnuniyeti', 'Check-out Satisfaction'], scope: ['Tüm oteller', 'All hotels'], responses: 2184, completion: 88, status: 'live' },
  { id: 'mid-stay', name: ['Konaklama Ortası Nabız', 'Mid-Stay Pulse'], scope: ['Lumera · Marenza', 'Lumera · Marenza'], responses: 1042, completion: 74, status: 'live' },
  { id: 'spa-2024', name: ['SPA Deneyimi', 'SPA Experience'], scope: ['4 otel', '4 hotels'], responses: 412, completion: 91, status: 'live' },
  { id: 'restaurant', name: ['Restoran Geri Bildirimi', 'Restaurant Feedback'], scope: ['Taslak', 'Draft'], responses: 0, completion: 0, status: 'draft' },
  { id: 'welcome', name: ['Karşılama Anketi', 'Welcome Survey'], scope: ['Azure Bay', 'Azure Bay'], responses: 1880, completion: 62, status: 'paused' },
];

const THEMES: [Pair, 'ok' | 'warn' | 'err', number][] = [
  [['Temizlik', 'Cleanliness'], 'ok', 312],
  [['Personel', 'Staff'], 'ok', 288],
  [['WiFi', 'WiFi'], 'warn', 141],
  [['Kahvaltı', 'Breakfast'], 'ok', 204],
  [['Havuz', 'Pool'], 'ok', 176],
  [['Check-in süresi', 'Check-in time'], 'err', 92],
];

export default async function SurveysOverviewPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang: Lang = await getLang();
  const base = `/h/${hotelId}/surveys`;
  const pick = (p: Pair) => L(p, lang);

  const sentiment = [
    { label: L(['Olumlu', 'Positive'], lang), value: 68, color: 'var(--success)' },
    { label: L(['Nötr', 'Neutral'], lang), value: 22, color: 'var(--chart-4)' },
    { label: L(['Olumsuz', 'Negative'], lang), value: 10, color: 'var(--danger)' },
  ];

  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">{L(['Anketler & Gönderimler', 'Surveys & Sends'], lang)}</h1>
          <p className="page-hero__sub">{L(['Misafir geri bildirimi, NPS ve yapay zeka destekli duygu analizi.', 'Guest feedback, NPS and AI-powered sentiment analysis.'], lang)}</p>
        </div>
        <div className="page-hero__actions">
          <Link className="btn btn--ghost" href={`${base}/responses`}><ClipboardList size={16} /> {L(['Yanıtlar', 'Responses'], lang)}</Link>
          <Link className="btn btn--primary" href={`${base}/new`}><Plus size={16} /> {L(['Yeni Anket', 'New Survey'], lang)}</Link>
        </div>
      </div>

      <SurveySubnav hotelId={hotelId} active="overview" lang={lang} />

      <div className="grid grid--kpi" style={{ marginBottom: 'var(--sp-5)' }}>
        <Kpi icon={<TrendingUp size={18} />} label="Net Promoter Score" value="72" delta={4} unit="%" note={L(['bu ay', 'this month'], lang)} spark={[60, 62, 64, 66, 68, 70, 72]} />
        <Kpi icon={<Smile size={18} />} label="CSAT" value="4.7" delta={2.1} note={L(['geçen haftaya göre', 'vs last week'], lang)} spark={[4.4, 4.5, 4.5, 4.6, 4.6, 4.7, 4.7]} />
        <Kpi icon={<ClipboardList size={18} />} label={L(['Yanıt Oranı', 'Response Rate'], lang)} value="63%" delta={5.4} note={L(['geçen haftaya göre', 'vs last week'], lang)} spark={[52, 54, 56, 58, 60, 62, 63]} />
      </div>

      <div className="grid grid--2">
        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">{L(['Aktif Anketler', 'Active Surveys'], lang)}</div>
              <div className="card__sub">5 {L(['anket', 'surveys'], lang)}</div>
            </div>
            <Link className="btn btn--sm btn--subtle" href={`${base}/forms`}>{L(['Tümünü Gör', 'View all'], lang)}</Link>
          </div>
          <div className="card__body" style={{ paddingTop: 8, display: 'flex', flexDirection: 'column' }}>
            {ACTIVE.map((s) => (
              <Link key={s.id} href={`${base}/${s.id}`} className="srow" style={{ cursor: 'pointer', color: 'inherit' }}>
                <div className="srow__ico"><ClipboardList size={18} /></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{L(s.name, lang)}</div>
                  <div className="cell-sub">{L(s.scope, lang)}</div>
                </div>
                <div style={{ textAlign: 'right', minWidth: 90 }}>
                  <div style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{s.responses.toLocaleString('en-US')}</div>
                  <div className="cell-sub">{L(['yanıt', 'responses'], lang)}</div>
                </div>
                <div style={{ minWidth: 130 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', color: 'var(--text-3)', marginBottom: 5 }}>
                    <span>{L(['Tamamlama', 'Completion'], lang)}</span>
                    <span style={{ fontVariantNumeric: 'tabular-nums' }}>{s.completion}%</span>
                  </div>
                  <MiniBar pct={s.completion} color={s.completion >= 80 ? 'var(--success)' : 'var(--accent)'} maxWidth="none" />
                </div>
                <div style={{ minWidth: 96, textAlign: 'right' }}>
                  <StatusBadge status={s.status} pick={pick} />
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-5)' }}>
          <div className="card">
            <div className="card__head">
              <div>
                <div className="card__title">{L(['AI Duygu Analizi', 'AI Sentiment'], lang)}</div>
                <div className="card__sub">{L(['8 320 yorum analiz edildi', '8,320 comments analyzed'], lang)}</div>
              </div>
              <span className="badge badge--accent"><Sparkles size={12} />AIDA AI</span>
            </div>
            <div className="card__body" style={{ display: 'flex', alignItems: 'center', gap: 20, paddingTop: 10 }}>
              <Donut segments={sentiment} size={150} stroke={17} center="68%" centerSub={L(['olumlu', 'positive'], lang)} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
                {sentiment.map((s) => (
                  <div className="legend__i" key={s.label}>
                    <span className="legend__sw" style={{ background: s.color }} />
                    {s.label}
                    <span style={{ marginLeft: 'auto', fontVariantNumeric: 'tabular-nums', color: 'var(--text-3)' }}>{s.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card__head">
              <div className="card__title">{L(['Sık Geçen Temalar', 'Top Themes'], lang)}</div>
            </div>
            <div className="card__body" style={{ paddingTop: 12, display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {THEMES.map(([label, cls, n], i) => (
                <span key={i} className={`badge badge--${cls}`} style={{ fontSize: 'var(--text-sm)', padding: '6px 11px' }}>
                  {L(label, lang)} <span style={{ opacity: 0.7, fontVariantNumeric: 'tabular-nums' }}>{n}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
