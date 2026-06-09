import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  Clock,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  Mail,
  Phone,
  Shield,
  Star,
  Wifi,
} from 'lucide-react';
import { getHotelById, getHotelsForGroup, getSurveyById, listResponses, surveyStats, type SurveyAccessControl, type SurveyStatus } from '@aidahos/db';
import { getLang } from '@/lib/i18n-server';
import { L, type Lang } from '@/lib/i18n';
import { GAvatar, QrSvg, ScoreChip, Subhero, surveyInitials } from '@/components/console/survey-helpers';
import { DeleteSurveyButton } from '@/components/console/delete-survey-button';
import { surveyPublicUrl } from '@/lib/urls';

type Pair = readonly [string, string];

const STATUS_PILL: Record<SurveyStatus, [string, Pair]> = {
  published: ['published', ['Yayında', 'Published']],
  draft: ['draft', ['Taslak', 'Draft']],
  paused: ['paused', ['Duraklatıldı', 'Paused']],
  archived: ['archived', ['Arşiv', 'Archived']],
};

function Kpi({ icon, label, value, foot }: { icon: React.ReactNode; label: React.ReactNode; value: React.ReactNode; foot: React.ReactNode }) {
  return (
    <div className="kpi">
      <div className="kpi__top">
        <div className="kpi__ico">{icon}</div>
        <div className="kpi__label">{label}</div>
      </div>
      <div className="kpi__val" style={{ marginTop: 6 }}>{value}</div>
      <div className="kpi__foot">{foot}</div>
    </div>
  );
}

function relTime(d: Date | string | null, lang: Lang): string {
  if (!d) return L(['—', '—'], lang);
  const t = d instanceof Date ? d.getTime() : new Date(d).getTime();
  if (Number.isNaN(t)) return L(['—', '—'], lang);
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return L([`${s} sn önce`, `${s}s ago`], lang);
  const m = Math.floor(s / 60);
  if (m < 60) return L([`${m} dk önce`, `${m} mins ago`], lang);
  const h = Math.floor(m / 60);
  if (h < 24) return L([`${h} saat önce`, `${h} hr ago`], lang);
  const days = Math.floor(h / 24);
  return L([`${days} gün önce`, `${days} days ago`], lang);
}

export default async function SurveyDetailPage({ params }: { params: Promise<{ hotelId: string; surveyId: string }> }) {
  const { hotelId, surveyId } = await params;
  const lang: Lang = await getLang();
  const base = `/h/${hotelId}/surveys`;

  const survey = await getSurveyById(surveyId);
  if (!survey || survey.hotelGroupId == null) notFound();

  const [stats, recent, hotel, groupHotels] = await Promise.all([
    surveyStats(surveyId),
    listResponses(survey.hotelGroupId, { surveyId, limit: 4 }),
    getHotelById(hotelId),
    getHotelsForGroup(survey.hotelGroupId),
  ]);

  const [pillCls, pillLabel] = STATUS_PILL[survey.status];
  const ac = (survey.accessControl ?? {}) as SurveyAccessControl;
  const publicUrl = surveyPublicUrl(hotel?.slug ?? hotelId, survey.slug);
  const lastRow = recent[0];

  const assignedHotel = groupHotels.find((h) => h.id === survey.hotelId);
  const scopeText = assignedHotel?.name ?? hotel?.name ?? L(['Atanmadı', 'Unassigned'], lang);

  return (
    <>
      <Subhero
        backHref={`${base}/forms`}
        title={survey.name}
        pill={
          <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
            <span className={`pill pill--${pillCls}`} style={{ fontSize: 'var(--text-sm)' }}>
              <span className="ico-dot" />
              {L(pillLabel, lang)}
            </span>
            {survey.isDefault ? (
              <span className="badge badge--accent" style={{ fontSize: 'var(--text-sm)' }}>
                <Star size={12} fill="currentColor" strokeWidth={0} /> {L(['Varsayılan', 'Default'], lang)}
              </span>
            ) : null}
          </span>
        }
        actions={
          <>
            <DeleteSurveyButton hotelId={hotelId} surveyId={surveyId} surveyName={survey.name} />
            <Link className="btn btn--ghost" href={`${base}/${surveyId}/edit/settings`}><ClipboardList size={16} /> {L(['Formu Düzenle', 'Edit Form'], lang)}</Link>
            <Link className="btn btn--primary" href={`${base}/responses?survey=${surveyId}`}><ExternalLink size={16} /> {L(['Yanıtları Görüntüle', 'View Responses'], lang)}</Link>
          </>
        }
      />

      <div className="grid grid--kpi" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 'var(--sp-6)' }}>
        <Kpi
          icon={<ClipboardList size={18} />}
          label={L(['Toplam Yanıt', 'Total Responses'], lang)}
          value={stats.totalResponses.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
          foot={<span className="delta__note">{L(['tüm zamanlar', 'all time'], lang)}</span>}
        />
        <Kpi
          icon={<Check size={18} />}
          label={L(['Tamamlanma Oranı', 'Completion Rate'], lang)}
          value="—"
          foot={<span className="delta__note">{L(['yakında', 'soon'], lang)}</span>}
        />
        <Kpi
          icon={<Star size={18} />}
          label={L(['Ortalama Skor', 'Average Score'], lang)}
          value={stats.avgScore != null ? <>{stats.avgScore.toFixed(1)} <span style={{ fontSize: 'var(--text-lg)', color: 'var(--text-3)', fontWeight: 500 }}>/ 5.0</span></> : '—'}
          foot={<span className="delta__note">{stats.totalResponses} {L(['yanıttan', 'responses'], lang)}</span>}
        />
        <Kpi
          icon={<Clock size={18} />}
          label={L(['Son Yanıt', 'Last Response'], lang)}
          value={<span style={{ fontSize: 'var(--text-xl)' }}>{relTime(stats.lastResponseAt, lang)}</span>}
          foot={lastRow ? <span className="delta__note">{L(['Oda', 'Room'], lang)} {lastRow.roomNo ?? '—'} · {surveyInitials(lastRow.guestName ?? '').toUpperCase()}</span> : <span className="delta__note">—</span>}
        />
      </div>

      <div className="grid grid--detail" style={{ marginBottom: 'var(--sp-6)' }}>
        <div className="card">
          <div className="card__head">
            <div>
              <div className="card__title">{L(['Dağıtım ve Paylaşım', 'Distribution & Sharing'], lang)}</div>
              <div className="card__sub">{L(['Misafirlerin ankete erişim kanalları', 'How guests can reach the survey'], lang)}</div>
            </div>
          </div>
          <div className="card__body" style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <div className="field__l" style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}><Link2 size={15} /> {L(['Herkese Açık Bağlantı', 'Public Link'], lang)}</div>
              <div className="linkbox">
                <span className="linkbox__url">{publicUrl}</span>
                <button className="linkbox__btn" type="button"><Copy size={14} /> {L(['Kopyala', 'Copy'], lang)}</button>
              </div>
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'auto 1fr', gap: 18, alignItems: 'start' }}>
              <div>
                <div className="field__l" style={{ marginBottom: 8 }}>{L(['QR Kod', 'QR Code'], lang)}</div>
                <div className="qrbox"><QrSvg seed={survey.slug} /></div>
                <div style={{ display: 'flex', gap: 7, marginTop: 9 }}>
                  <button className="btn btn--ghost btn--sm" type="button" style={{ flex: 1, justifyContent: 'center' }}>PNG</button>
                  <button className="btn btn--ghost btn--sm" type="button" style={{ flex: 1, justifyContent: 'center' }}>SVG</button>
                </div>
              </div>
              <div>
                <div className="field__l" style={{ marginBottom: 8 }}>{L(['Aktif Kanallar', 'Active Channels'], lang)}</div>
                <div className="chrow">
                  <div className="chrow__ico" style={{ background: 'var(--warning-soft)', color: 'var(--warning)' }}><Mail size={16} /></div>
                  <span className="chrow__name">{L(['E-posta Kampanyaları', 'Email Campaigns'], lang)}</span>
                  <span className="live__pulse" />
                </div>
                <div className="chrow off">
                  <div className="chrow__ico" style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}><Phone size={16} /></div>
                  <span className="chrow__name">{L(['SMS Bildirimleri', 'SMS Notifications'], lang)}</span>
                  <span className="badge badge--mute">{L(['Kapalı', 'Off'], lang)}</span>
                </div>
                <div className="chrow">
                  <div className="chrow__ico" style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}><Wifi size={16} /></div>
                  <span className="chrow__name">{L(['Captive Portal', 'Captive Portal'], lang)}</span>
                  <span className="live__pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card__head">
            <div className="card__title">{L(['Form Özeti', 'Form Summary'], lang)}</div>
            <Link className="btn btn--sm btn--subtle" href={`${base}/${surveyId}/edit/settings`}><ExternalLink size={14} /> {L(['Düzenle', 'Edit'], lang)}</Link>
          </div>
          <div className="card__body" style={{ paddingTop: 8 }}>
            <div className="qprev">
              <div className="qprev__ico"><Shield size={15} /></div>
              <div>
                <div className="qprev__t">{L(['Erişim Kontrolü', 'Access Control'], lang)}</div>
                <div className="qprev__d">
                  {ac.guestVerification
                    ? L(['Oda No + Soyadı doğrulaması aktif.', 'Room number + surname validation active.'], lang)
                    : L(['Herkese açık — doğrulama yok.', 'Public — no verification.'], lang)}
                </div>
              </div>
            </div>
            <div className="qprev">
              <div className="qprev__ico"><Clock size={15} /></div>
              <div>
                <div className="qprev__t">{L(['Durum', 'Status'], lang)}</div>
                <div className="qprev__d">{L(pillLabel, lang)}{survey.publishedAt ? ` · ${new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' }).format(survey.publishedAt)}` : ''}</div>
              </div>
            </div>
            <div className="qprev">
              <div className="qprev__ico"><Building2 size={15} /></div>
              <div>
                <div className="qprev__t">{L(['Atanan Otel', 'Assigned Hotel'], lang)}</div>
                <div className="qprev__d">{scopeText}</div>
              </div>
            </div>
            <div className="qprev">
              <div className="qprev__ico"><Globe size={15} /></div>
              <div>
                <div className="qprev__t">{L(['Varsayılan Dil', 'Default Language'], lang)}</div>
                <div className="lang-pills"><span>{survey.defaultLocale.toUpperCase()}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <div className="card__title">{L(['Son Yanıtlar', 'Recent Responses'], lang)}</div>
          <Link className="btn btn--sm btn--subtle" href={`${base}/responses?survey=${surveyId}`}>{L(['Tümünü Gör', 'View all'], lang)} <ChevronRight size={14} /></Link>
        </div>
        <div className="card__body" style={{ paddingTop: 10, overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{L(['Misafir', 'Guest'], lang)}</th>
                <th>{L(['Oda', 'Room'], lang)}</th>
                <th>{L(['Skor', 'Score'], lang)}</th>
                <th>{L(['Tarih', 'Date'], lang)}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {recent.map((r) => (
                <tr key={r.id} className="row-link">
                  <td>
                    <Link href={`${base}/responses/${r.id}`} className="table__name">
                      <GAvatar name={r.guestName ?? '—'} />
                      <span style={{ fontWeight: 600 }}>{r.guestName ?? L(['İsimsiz', 'Anonymous'], lang)}</span>
                    </Link>
                  </td>
                  <td className="mono" style={{ color: 'var(--text-2)' }}>{r.roomNo ?? '—'}</td>
                  <td>{r.score != null ? <ScoreChip v={Number(r.score)} /> : '—'}</td>
                  <td style={{ color: 'var(--text-2)' }}>{relTime(r.submittedAt, lang)}</td>
                  <td style={{ textAlign: 'right' }}><ChevronRight size={15} /></td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 'var(--sp-5)' }}>
                    {L(['Henüz yanıt yok.', 'No responses yet.'], lang)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
