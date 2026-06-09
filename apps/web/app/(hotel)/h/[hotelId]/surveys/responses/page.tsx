import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Calendar, ChevronDown, ClipboardList, Download, Flag, Search, Smile, Star } from 'lucide-react';
import { getHotelById, listResponses, type ResponseStatus } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { L, type Lang } from '@/lib/i18n';
import { SurveySubnav } from '@/components/console/survey-subnav';
import { GAvatar, Stars } from '@/components/console/survey-helpers';

type Pair = readonly [string, string];

const STATUS: Record<ResponseStatus, ['err' | 'info' | 'ok', Pair]> = {
  flagged: ['err', ['İşaretlendi', 'Flagged']],
  new: ['info', ['Yeni', 'New']],
  reviewed: ['ok', ['İncelendi', 'Reviewed']],
};

function StatusBadge({ status, lang }: { status: ResponseStatus; lang: Lang }) {
  const [cls, label] = STATUS[status];
  return (
    <span className={`badge badge--${cls}`}>
      <span className="ico-dot" />
      {L(label, lang)}
    </span>
  );
}

function fmtDate(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}
function fmtTime(d: Date): string {
  return new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(d);
}

export default async function SurveyResponsesPage({
  params,
  searchParams,
}: {
  params: Promise<{ hotelId: string }>;
  searchParams: Promise<{ survey?: string }>;
}) {
  const { hotelId } = await params;
  const { survey } = await searchParams;
  const lang: Lang = await getLang();
  const base = `/h/${hotelId}/surveys`;

  const hotel = await getHotelById(hotelId);
  if (!hotel) redirect('/no-hotel');
  const rows = await listResponses(hotel.hotelGroupId, survey ? { surveyId: survey } : undefined);

  const total = rows.length;
  const scored = rows.filter((r) => r.score != null).map((r) => Number(r.score));
  const avg = scored.length ? scored.reduce((a, b) => a + b, 0) / scored.length : null;
  const flagged = rows.filter((r) => r.status === 'flagged').length;

  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">{L(['Yanıtlar', 'Responses'], lang)}</h1>
          <p className="page-hero__sub">{L(['Tüm aktif anketlerdeki misafir geri bildirimlerini inceleyin ve yönetin.', 'Review and manage guest feedback across all active surveys.'], lang)}</p>
        </div>
        <div className="page-hero__actions">
          <button className="btn btn--ghost" type="button"><Download size={16} /> {L(['Dışa Aktar', 'Export'], lang)}</button>
        </div>
      </div>

      <SurveySubnav hotelId={hotelId} active="responses" lang={lang} />

      <div className="grid grid--3" style={{ marginBottom: 'var(--sp-5)' }}>
        <div className="kpi">
          <div className="kpi__top"><div className="kpi__ico"><Smile size={18} /></div><div className="kpi__label">{L(['Ortalama Memnuniyet', 'Average Satisfaction'], lang)}</div></div>
          <div className="kpi__big" style={{ marginTop: 6 }}><span className="kpi__val">{avg != null ? avg.toFixed(1) : '—'}</span><span className="unit">/ 5.0</span></div>
          <div className="kpi__foot"><span className="delta__note">{scored.length} {L(['skorlu yanıt', 'scored responses'], lang)}</span></div>
        </div>
        <div className="kpi">
          <div className="kpi__top"><div className="kpi__ico"><ClipboardList size={18} /></div><div className="kpi__label">{L(['Toplam Yanıt', 'Total Responses'], lang)}</div></div>
          <div className="kpi__val" style={{ marginTop: 6 }}>{total.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 12 }}>
            <div className="minibar" style={{ maxWidth: 'none', flex: 1 }}><div className="minibar__f" style={{ width: `${total ? Math.round((scored.length / total) * 100) : 0}%`, background: 'var(--accent)' }} /></div>
            <span className="cell-sub" style={{ whiteSpace: 'nowrap' }}>{total ? Math.round((scored.length / total) * 100) : 0}% {L(['tamamlama', 'completion'], lang)}</span>
          </div>
        </div>
        <div className="kpi kpi--accent">
          <div className="kpi__top"><div className="kpi__ico"><Flag size={18} /></div><div className="kpi__label">{L(['Dikkat Gerektiren', 'Attention Required'], lang)}</div></div>
          <div className="kpi__row" style={{ marginTop: 6 }}>
            <div><div className="kpi__val">{flagged}</div><div className="delta__note">{L(['yanıt bekleyen işaretli yorum', 'flagged reviews needing response'], lang)}</div></div>
            <button className="btn btn--sm" type="button" style={{ background: '#fff', color: 'var(--accent)', alignSelf: 'flex-end', whiteSpace: 'nowrap' }}>{L(['İncele', 'Review'], lang)}</button>
          </div>
        </div>
      </div>

      <div className="filterbar">
        <div className="fchip"><Calendar size={15} />{L(['Son 30 Gün', 'Last 30 Days'], lang)}<span className="chev"><ChevronDown size={14} /></span></div>
        <div className="fchip"><Star size={15} />{L(['Tüm Skorlar', 'Any Score'], lang)}<span className="chev"><ChevronDown size={14} /></span></div>
        <div className="fchip"><ClipboardList size={15} />{L(['Tüm Anketler', 'All Surveys'], lang)}<span className="chev"><ChevronDown size={14} /></span></div>
        <div className="filterbar__spacer" />
        <div className="searchmini"><Search size={15} /><input placeholder={L(['Misafir veya oda ara…', 'Search guests or rooms…'], lang)} /></div>
      </div>

      <div className="card">
        <div className="card__body" style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{L(['Tarih & Saat', 'Date & Time'], lang)}</th>
                <th>{L(['Misafir / Oda', 'Guest / Room'], lang)}</th>
                <th>{L(['Anket', 'Survey Title'], lang)}</th>
                <th>{L(['Genel Skor', 'Overall Score'], lang)}</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="row-link" style={{ cursor: 'pointer' }}>
                  <td>
                    <Link href={`${base}/responses/${r.id}`} style={{ display: 'block', color: 'inherit' }}>
                      <div style={{ fontWeight: 600 }}>{fmtDate(r.submittedAt, lang)}</div>
                      <div className="cell-sub mono">{fmtTime(r.submittedAt)}</div>
                    </Link>
                  </td>
                  <td>
                    <Link href={`${base}/responses/${r.id}`} className="table__name">
                      <GAvatar name={r.guestName ?? '—'} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.guestName ?? L(['İsimsiz', 'Anonymous'], lang)}</div>
                        <div className="cell-sub">{L(['Oda', 'Room'], lang)} {r.roomNo ?? '—'}</div>
                      </div>
                    </Link>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{r.surveyName}</div>
                    {r.source ? <div className="cell-sub">{r.source}</div> : null}
                  </td>
                  <td>{r.score != null ? <Stars score={Number(r.score)} /> : '—'}</td>
                  <td><StatusBadge status={r.status} lang={lang} /></td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 'var(--sp-6)' }}>
                    {L(['Henüz yanıt yok.', 'No responses yet.'], lang)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="pager">
          <div className="pager__info">
            {L([`${total} sonuçtan 1-${total} arası gösteriliyor`, `Showing 1-${total} of ${total} results`], lang)}
          </div>
          <div className="pager__nums">
            <button type="button">{L(['Önceki', 'Previous'], lang)}</button>
            <button type="button" className="on">1</button>
            <button type="button">{L(['Sonraki', 'Next'], lang)}</button>
          </div>
        </div>
      </div>
    </>
  );
}
