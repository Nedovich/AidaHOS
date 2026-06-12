import Link from 'next/link';
import type { ReactNode } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Gift,
  Megaphone,
  Search,
  Ticket,
  Users,
  X,
} from 'lucide-react';
import { Kpi } from '@/components/console/charts';
import { EventsSubnav } from '@/components/console/events/events-subnav';
import { Subhero } from '@/components/console/survey-helpers';
import {
  MOCK_PARTICIPANTS,
  initials,
  localize,
  type MockParticipant,
  type ParticipantStatus,
} from '@/lib/events-mock';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

const STATUS_LABELS: Record<ParticipantStatus, readonly [string, string]> = {
  registered: ['Kayıtlı', 'Registered'],
  attended: ['Katıldı', 'Attended'],
  noshow: ['Gelmedi', 'No-show'],
  cancelled: ['İptal Etti', 'Cancelled'],
};

const STATUS_CLASSES: Record<ParticipantStatus, string> = {
  registered: 'info',
  attended: 'ok',
  noshow: 'warn',
  cancelled: 'err',
};

function EventPill({ lang }: { lang: Lang }) {
  return (
    <span className="catbadge events-participants-pill">
      <span className="ico-dot" />
      {L(['Havuz Başı DJ Performansı', 'Poolside DJ Set'], lang)}
    </span>
  );
}

function FilterChip({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <button className="fchip events-participants-filter" type="button">
      {icon}
      {label}
      <span className="chev">
        <ChevronDown size={14} />
      </span>
    </button>
  );
}

function ParticipantBadge({ status, lang }: { status: ParticipantStatus; lang: Lang }) {
  return (
    <span className={`badge badge--${STATUS_CLASSES[status]} events-participant-status`}>
      <span className="ico-dot" />
      {L(STATUS_LABELS[status], lang)}
    </span>
  );
}

function ParticipantRow({ participant, lang }: { participant: MockParticipant; lang: Lang }) {
  return (
    <tr>
      <td>
        <div className="table__name events-participant-guest">
          <span className="events-avatar" style={{ background: participant.color }}>
            {initials(participant.name)}
          </span>
          <strong>{participant.name}</strong>
        </div>
      </td>
      <td className="mono events-participant-muted">{participant.room}</td>
      <td>
        <span className="pax">
          <Users size={14} />
          {participant.adults}
        </span>
      </td>
      <td>
        <span className="pax">
          <Gift size={14} />
          {participant.children}
        </span>
      </td>
      <td className="events-participant-muted">{localize(participant.registeredAt, lang)}</td>
      <td>
        <ParticipantBadge status={participant.status} lang={lang} />
      </td>
    </tr>
  );
}

export default async function EventParticipantsPage({
  params,
}: {
  params: Promise<{ hotelId: string }>;
}) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/events`;

  return (
    <div className="events-participants fade-in">
      <Subhero
        backHref={`${base}/list`}
        crumb={
          <>
            <Link href={`${base}/list`}>{L(['Etkinlikler', 'Events'], lang)}</Link>
            <ChevronRight size={13} />
            <b>{L(['Katılımcılar', 'Participants'], lang)}</b>
          </>
        }
        title={L(['Katılımcılar', 'Participants'], lang)}
        pill={<EventPill lang={lang} />}
        sub={L(['12 Haziran · 16:00 · Ana Havuz', 'June 12 · 16:00 · Main Pool'], lang)}
        actions={
          <>
            <Link className="btn btn--ghost" href={`${base}/notify`}>
              <Megaphone />
              {L(['Bildirim Gönder', 'Send Notification'], lang)}
            </Link>
            <button className="btn btn--ghost" type="button">
              <Download />
              {L(['Dışa Aktar', 'Export'], lang)}
            </button>
          </>
        }
      />

      <EventsSubnav hotelId={hotelId} active="participants" lang={lang} />

      <div className="events-participants-kpis">
        <Kpi
          icon={<Ticket size={18} />}
          label={L(['Toplam Kayıt', 'Total Registered'], lang)}
          value="184"
          note={L(['200 kapasite', 'of 200 capacity'], lang)}
        />
        <Kpi
          icon={<Check size={18} />}
          label={L(['Katıldı', 'Attended'], lang)}
          value="156"
          note="84.8%"
        />
        <Kpi
          icon={<X size={18} />}
          label={L(['Gelmedi', 'No-show'], lang)}
          value="18"
          note="9.8%"
        />
        <Kpi
          icon={<Clock size={18} />}
          label={L(['İptal', 'Cancelled'], lang)}
          value="10"
          note="5.4%"
        />
      </div>

      <div className="filterbar events-participants-filterbar">
        <FilterChip icon={<Check size={15} />} label={L(['Tüm Durumlar', 'All Statuses'], lang)} />
        <FilterChip icon={<Users size={15} />} label={L(['Oda Tipi', 'Room Type'], lang)} />
        <div className="filterbar__spacer" />
        <label className="searchmini events-participants-search">
          <Search size={15} />
          <input placeholder={L(['Misafir veya oda ara…', 'Search guest or room…'], lang)} />
        </label>
      </div>

      <section className="card events-participants-card">
        <div className="card__body events-participants-table-wrap">
          <table className="events-participants-table table">
            <thead>
              <tr>
                <th>{L(['Misafir', 'Guest'], lang)}</th>
                <th>{L(['Oda', 'Room'], lang)}</th>
                <th>{L(['Yetişkin', 'Adults'], lang)}</th>
                <th>{L(['Çocuk', 'Children'], lang)}</th>
                <th>{L(['Kayıt Tarihi', 'Registered'], lang)}</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_PARTICIPANTS.map((participant) => (
                <ParticipantRow
                  participant={participant}
                  lang={lang}
                  key={`${participant.room}-${participant.name}`}
                />
              ))}
            </tbody>
          </table>
        </div>
        <div className="pager events-participants-pager">
          <div className="pager__info">
            {L(['184 kayıttan 1-7 arası', 'Showing 1-7 of 184'], lang)}
          </div>
          <div className="pager__nums">
            <button type="button">{L(['Önceki', 'Prev'], lang)}</button>
            <button className="on" type="button">
              1
            </button>
            <button type="button">2</button>
            <button type="button">3</button>
            <button type="button">{L(['Sonraki', 'Next'], lang)}</button>
          </div>
        </div>
      </section>
    </div>
  );
}
