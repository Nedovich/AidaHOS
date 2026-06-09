import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ChevronRight, ClipboardList, Filter, Layers, Plus, Search } from 'lucide-react';
import { getHotelById, listSurveys, type SurveyStatus } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { L, type Lang } from '@/lib/i18n';
import { SurveySubnav } from '@/components/console/survey-subnav';
import { SurveyRowActions } from '@/components/console/survey-row-actions';

type Pair = readonly [string, string];

const PILL: Record<SurveyStatus, [string, Pair]> = {
  published: ['published', ['Yayında', 'Published']],
  draft: ['draft', ['Taslak', 'Draft']],
  paused: ['paused', ['Duraklatıldı', 'Paused']],
  archived: ['archived', ['Arşiv', 'Archived']],
};

const PALETTE = ['var(--accent)', 'var(--purple)', 'var(--success)', 'var(--info)', 'var(--warning)'];
function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length]!;
}

function StatusPill({ status, lang }: { status: SurveyStatus; lang: Lang }) {
  const [cls, label] = PILL[status];
  return (
    <span className={`pill pill--${cls}`}>
      <span className="ico-dot" />
      {L(label, lang)}
    </span>
  );
}

function fmtDate(d: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(d);
}

export default async function SurveyFormsPage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/surveys`;

  const hotel = await getHotelById(hotelId);
  if (!hotel) redirect('/no-hotel');
  const forms = await listSurveys(hotel.hotelGroupId);

  return (
    <>
      <div className="page-hero">
        <div>
          <h1 className="page-hero__h">{L(['Anket Formları', 'Survey Forms'], lang)}</h1>
          <p className="page-hero__sub">{L(['Misafir geri bildirim anketlerinizi oluşturun ve dağıtın.', 'Create and distribute your guest feedback surveys.'], lang)}</p>
        </div>
        <div className="page-hero__actions">
          <Link className="btn btn--primary" href={`${base}/new`}>
            <Plus size={16} /> {L(['Yeni Anket Oluştur', 'Create New Survey'], lang)}
          </Link>
        </div>
      </div>

      <SurveySubnav hotelId={hotelId} active="forms" lang={lang} />

      <div className="card">
        <div className="tbl-toolbar" style={{ paddingTop: 'var(--sp-5)' }}>
          <div className="searchmini" style={{ flex: 1, maxWidth: 320 }}>
            <Search size={15} />
            <input placeholder={L(['Form ara…', 'Search forms…'], lang)} />
          </div>
          <div className="filterbar__spacer" />
          <div className="fchip"><Filter size={15} /> {L(['Filtrele', 'Filter'], lang)}</div>
          <div className="fchip"><Layers size={15} /> {L(['Sırala', 'Sort'], lang)}</div>
        </div>

        <div className="card__body" style={{ paddingTop: 4, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{L(['Form Adı', 'Form Name'], lang)}</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
                <th>{L(['Oluşturma', 'Created'], lang)}</th>
                <th>{L(['Yanıt', 'Responses'], lang)}</th>
                <th>{L(['İşlemler', 'Actions'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {forms.map((f) => {
                const color = colorFor(f.id);
                return (
                  <tr key={f.id} className="row-link">
                    <td>
                      <Link href={`${base}/${f.id}`} className="table__name">
                        <div
                          className="table__logo"
                          style={{
                            background: `color-mix(in srgb, ${color} 14%, transparent)`,
                            color,
                            borderColor: `color-mix(in srgb, ${color} 32%, transparent)`,
                          }}
                        >
                          <ClipboardList size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{f.name}</div>
                          {f.description ? <div className="cell-sub">{f.description}</div> : null}
                        </div>
                      </Link>
                    </td>
                    <td><StatusPill status={f.status} lang={lang} /></td>
                    <td style={{ color: 'var(--text-2)' }}>{fmtDate(f.createdAt, lang)}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {f.responseCount > 0 ? f.responseCount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US') : '—'}
                    </td>
                    <td>
                      <SurveyRowActions hotelId={hotelId} surveyId={f.id} surveyName={f.name} base={base} />
                    </td>
                  </tr>
                );
              })}
              {forms.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 'var(--sp-6)' }}>
                    {L(['Henüz anket yok. "Yeni Anket Oluştur" ile başlayın.', 'No surveys yet. Start with "Create New Survey".'], lang)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <div className="pager__info">
            {L([`${forms.length} formdan 1-${forms.length} arası gösteriliyor`, `Showing 1-${forms.length} of ${forms.length} forms`], lang)}
          </div>
          <div className="pager__nums">
            <button type="button"><ChevronRight size={14} style={{ transform: 'rotate(180deg)' }} /></button>
            <button type="button" className="on">1</button>
            <button type="button"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>
    </>
  );
}
