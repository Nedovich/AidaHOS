import Link from 'next/link';
import { ChevronDown, Grid2X2, Plus, Users } from 'lucide-react';
import { DiningSubnav } from '@/components/console/dining/dining-subnav';
import {
  DINING_TABLES,
  DINING_VENUES,
  TABLE_STATUSES,
  type DiningTable,
} from '@/lib/dining-mock';
import { L, type Lang } from '@/lib/i18n';
import { getLang } from '@/lib/i18n-server';

function TableTile({ table, lang }: { table: DiningTable; lang: Lang }) {
  const status = TABLE_STATUSES[table.status];
  return (
    <div className="tabletile" style={{ borderTopColor: status.color }}>
      <div className="tabletile__n">{table.label}</div>
      <div className="tabletile__seats">
        <Users size={13} />
        {table.seats} {L(['kişi', 'seats'], lang)}
      </div>
      <div className="tabletile__status" style={{ color: status.color }}>
        <span className="ico-dot" style={{ background: status.color }} />
        {L(status.label, lang)}
      </div>
      {table.guest && table.room ? (
        <div className="tabletile__guest">
          {table.guest} · {L(['Oda', 'Rm'], lang)} {table.room}
        </div>
      ) : null}
    </div>
  );
}

export default async function TablePage({ params }: { params: Promise<{ hotelId: string }> }) {
  const { hotelId } = await params;
  const lang = await getLang();
  const base = `/h/${hotelId}/dining`;

  // Resolve the default venue (from all tables)
  const venues = [...new Set(DINING_TABLES.map((t) => t.venueId))];
  const firstVenue = DINING_VENUES.find((v) => v.id === venues[0]);
  const venueName = firstVenue?.name ?? (DINING_VENUES.length > 0 ? DINING_VENUES[0]!.name : '');

  // Count tables by status
  const counts: Record<string, number> = {};
  DINING_TABLES.forEach((t) => {
    counts[t.status] = (counts[t.status] || 0) + 1;
  });

  return (
    <div className="dining-overview fade-in">
      <div className="page-hero dining-hero">
        <div>
          <h1 className="page-hero__h">{L(['Masa Yönetimi', 'Table Management'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              [`${venueName} Restoran · canlı masa planı`, `${venueName} · live floor plan`],
              lang,
            )}
          </p>
        </div>
        <div className="page-hero__actions">
          <button className="fchip" disabled>
            <Grid2X2 size={15} />
            {venueName}
            <ChevronDown size={14} />
          </button>
          <Link className="btn btn--primary" href={`${base}/tables/new`}>
            <Plus />
            {L(['Masa Ekle', 'Add Table'], lang)}
          </Link>
        </div>
      </div>

      <DiningSubnav hotelId={hotelId} active="tables" lang={lang} />

      <div className="tablelegend">
        {Object.entries(TABLE_STATUSES).map((entry) => {
          const countsKey = entry[0];
          return (
            <span key={countsKey} className="legend__i">
              <span className="ico-dot" style={{ background: entry[1].color }} />
              {L(entry[1].label, lang)}{' '}
              <span style={{ color: 'var(--text-3)', fontVariantNumeric: 'tabular-nums' }}>
                · {(counts[countsKey] || 0)}
              </span>
            </span>
          );
        })}
      </div>

      <section className="card">
        <div className="card__body">
          <div className="tablegrid">
            {DINING_TABLES.map((table) => (
              <TableTile key={table.id} table={table} lang={lang} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
