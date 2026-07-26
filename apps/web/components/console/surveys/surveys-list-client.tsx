'use client';

import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ClipboardList,
  Search,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import { SurveyRowActions } from '@/components/console/survey-row-actions';
import { L, type Lang } from '@/lib/i18n';

export type SurveyStatus = 'draft' | 'published' | 'paused' | 'archived';

export interface SerializedSurvey {
  id: string;
  name: string;
  description: string | null;
  status: SurveyStatus;
  isDefault: boolean;
  isCheckout: boolean;
  responseCount: number;
  createdAt: string;
  color: string;
}

const STATUS_PILL: Record<SurveyStatus, { cls: string; label: readonly [string, string] }> = {
  published: { cls: 'published', label: ['Yayında', 'Published'] },
  draft:     { cls: 'draft',     label: ['Taslak', 'Draft'] },
  paused:    { cls: 'paused',    label: ['Duraklatıldı', 'Paused'] },
  archived:  { cls: 'archived',  label: ['Arşiv', 'Archived'] },
};

function StatusPill({ status, lang }: { status: SurveyStatus; lang: Lang }) {
  const { cls, label } = STATUS_PILL[status];
  return (
    <span className={`pill pill--${cls}`}>
      <span className="ico-dot" />
      {L(label, lang)}
    </span>
  );
}

function fmtDate(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === 'tr' ? 'tr-TR' : 'en-US', {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(iso));
}

function Dropdown({
  label,
  icon,
  options,
  value,
  onChange,
  allLabel,
}: {
  label: string;
  icon: React.ReactNode;
  options: { id: string; name: string }[];
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);
  const active = !!value;

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="fchip events-filter-chip"
        type="button"
        onClick={() => setOpen((p) => !p)}
        style={active ? { background: 'var(--accent-soft)', borderColor: 'var(--accent)', color: 'var(--accent)' } : {}}
      >
        {icon}
        {active ? (selected?.name ?? label) : label}
        {active
          ? <X size={13} onClick={(e) => { e.stopPropagation(); onChange(''); setOpen(false); }} style={{ marginLeft: 2, cursor: 'pointer' }} />
          : <span className="chev"><ChevronDown size={14} /></span>}
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 50,
            background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-md)',
            boxShadow: 'var(--sh-3)', minWidth: 180, overflow: 'hidden',
          }}>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left', padding: '9px 14px',
                border: 0, background: !value ? 'var(--surface-2)' : 'transparent',
                cursor: 'pointer', fontSize: 13, fontWeight: !value ? 700 : 500, color: 'var(--text-1)',
              }}
            >
              {allLabel}
            </button>
            {options.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => { onChange(o.id); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left',
                  padding: '9px 14px', border: 0,
                  background: value === o.id ? 'var(--surface-2)' : 'transparent',
                  cursor: 'pointer', fontSize: 13, fontWeight: value === o.id ? 700 : 500, color: 'var(--text-1)',
                }}
              >
                {o.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

const PAGE_SIZE = 20;

export function SurveysListClient({
  surveys,
  lang,
  hotelId,
  base,
  onToggleDefault,
  onToggleCheckout,
}: {
  surveys: SerializedSurvey[];
  lang: Lang;
  hotelId: string;
  base: string;
  onToggleDefault?: (surveyId: string, makeDefault: boolean) => Promise<void>;
  onToggleCheckout?: (surveyId: string, makeCheckout: boolean) => Promise<void>;
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [defaultFilter, setDefaultFilter] = useState('');
  const [page, setPage] = useState(1);

  const statusOptions = [
    { id: 'published', name: L(['Yayında', 'Published'], lang) },
    { id: 'draft',     name: L(['Taslak', 'Draft'], lang) },
    { id: 'paused',    name: L(['Duraklatıldı', 'Paused'], lang) },
    { id: 'archived',  name: L(['Arşiv', 'Archived'], lang) },
  ];

  const defaultOptions = [
    { id: 'default', name: L(['Default Survey', 'Default Survey'], lang) },
    { id: 'normal',  name: L(['Normal Anket', 'Regular Survey'], lang) },
  ];

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return surveys.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !(s.description ?? '').toLowerCase().includes(q)) return false;
      if (statusFilter && s.status !== statusFilter) return false;
      if (defaultFilter === 'default' && !s.isDefault) return false;
      if (defaultFilter === 'normal' && s.isDefault) return false;
      return true;
    });
  }, [surveys, search, statusFilter, defaultFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const resetPage = () => setPage(1);
  const hasFilters = !!(search || statusFilter || defaultFilter);

  return (
    <>
      {/* Filter bar — same visual style as events listing */}
      <div className="filterbar events-filterbar" style={{ marginBottom: 16, width: '100%', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <Dropdown
          label={L(['Durum', 'Status'], lang)}
          icon={<Check size={15} />}
          options={statusOptions}
          value={statusFilter}
          onChange={(v) => { setStatusFilter(v); resetPage(); }}
          allLabel={L(['Tüm Durumlar', 'All Statuses'], lang)}
        />

        <Dropdown
          label={L(['Tür', 'Type'], lang)}
          icon={<Star size={15} />}
          options={defaultOptions}
          value={defaultFilter}
          onChange={(v) => { setDefaultFilter(v); resetPage(); }}
          allLabel={L(['Tümü', 'All Types'], lang)}
        />

        {hasFilters && (
          <button
            type="button"
            onClick={() => { setSearch(''); setStatusFilter(''); setDefaultFilter(''); resetPage(); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 'var(--r-pill)', border: '1px solid var(--line)', background: 'transparent', color: 'var(--text-2)', fontSize: 13, cursor: 'pointer' }}
          >
            <X size={13} />
            {L(['Temizle', 'Clear'], lang)}
          </button>
        )}

        <div className="filterbar__spacer" />

        <label className="searchmini events-search">
          <Search size={15} />
          <input
            placeholder={L(['Form ara…', 'Search forms…'], lang)}
            value={search}
            onChange={(e) => { setSearch(e.target.value); resetPage(); }}
          />
          {search && (
            <button type="button" onClick={() => { setSearch(''); resetPage(); }} style={{ all: 'unset', cursor: 'pointer', display: 'flex', color: 'var(--text-3)' }}>
              <X size={13} />
            </button>
          )}
        </label>
      </div>

      <div className="card events-list-card">
        <div className="events-table-wrap" style={{ minWidth: 0 }}>
          <table className="table" style={{ minWidth: 760, width: '100%' }}>
            <thead>
              <tr>
                <th style={{ minWidth: 280 }}>{L(['Form Adı', 'Form Name'], lang)}</th>
                <th style={{ minWidth: 120 }}>{L(['Durum', 'Status'], lang)}</th>
                <th style={{ minWidth: 130 }}>{L(['Oluşturma', 'Created'], lang)}</th>
                <th style={{ minWidth: 100 }}>{L(['Yanıt', 'Responses'], lang)}</th>
                <th style={{ minWidth: 110 }}>{L(['İşlemler', 'Actions'], lang)}</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-3)', padding: 'var(--sp-6)' }}>
                    {hasFilters
                      ? L(['Filtre sonucu bulunamadı.', 'No surveys match the current filters.'], lang)
                      : L(['Henüz anket yok. "Yeni Anket Oluştur" ile başlayın.', 'No surveys yet. Start with "Create New Survey".'], lang)}
                  </td>
                </tr>
              ) : (
                pageRows.map((f) => (
                  <tr key={f.id} className="row-link">
                    <td>
                      <Link href={`${base}/${f.id}`} className="table__name">
                        <div
                          className="table__logo"
                          style={{
                            background: `color-mix(in srgb, ${f.color} 14%, transparent)`,
                            color: f.color,
                            borderColor: `color-mix(in srgb, ${f.color} 32%, transparent)`,
                          }}
                        >
                          <ClipboardList size={16} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 600 }}>
                            {f.name}
                            {f.isDefault && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                fontSize: 11, fontWeight: 700, letterSpacing: '.03em',
                                padding: '2px 7px', borderRadius: 'var(--r-pill)',
                                background: 'color-mix(in srgb, var(--warning) 14%, transparent)',
                                color: 'var(--warning)',
                                border: '1px solid color-mix(in srgb, var(--warning) 30%, transparent)',
                              }}>
                                <Star size={10} fill="currentColor" />
                                {L(['Varsayılan', 'Default'], lang)}
                              </span>
                            )}
                            {f.isCheckout && (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 3,
                                fontSize: 11, fontWeight: 700, letterSpacing: '.03em',
                                padding: '2px 7px', borderRadius: 'var(--r-pill)',
                                background: 'color-mix(in srgb, var(--teal, #2F6E78) 12%, transparent)',
                                color: 'var(--teal, #2F6E78)',
                                border: '1px solid color-mix(in srgb, var(--teal, #2F6E78) 28%, transparent)',
                              }}>
                                <ShoppingBag size={10} fill="currentColor" />
                                {L(['Checkout', 'Checkout'], lang)}
                              </span>
                            )}
                          </div>
                          {f.description ? <div className="cell-sub">{f.description}</div> : null}
                        </div>
                      </Link>
                    </td>
                    <td><StatusPill status={f.status} lang={lang} /></td>
                    <td style={{ color: 'var(--text-2)' }}>{fmtDate(f.createdAt, lang)}</td>
                    <td style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>
                      {f.responseCount.toLocaleString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                    </td>
                    <td>
                      <SurveyRowActions
                        hotelId={hotelId}
                        surveyId={f.id}
                        surveyName={f.name}
                        base={base}
                        isDefault={f.isDefault}
                        isCheckout={f.isCheckout}
                        onToggleDefault={onToggleDefault ? (makeDefault) => onToggleDefault(f.id, makeDefault) : undefined}
                        onToggleCheckout={onToggleCheckout ? (makeCheckout) => onToggleCheckout(f.id, makeCheckout) : undefined}
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pager">
          <div className="pager__info">
            {filtered.length === surveys.length
              ? L([`${surveys.length} formdan 1-${Math.min(surveys.length, PAGE_SIZE)} arası gösteriliyor`, `Showing 1-${Math.min(surveys.length, PAGE_SIZE)} of ${surveys.length} forms`], lang)
              : L([`${filtered.length} / ${surveys.length} form`, `${filtered.length} of ${surveys.length} forms`], lang)}
          </div>
          {totalPages > 1 && (
            <div className="pager__nums">
              <button type="button" disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                {L(['Önceki', 'Prev'], lang)}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button key={n} type="button" className={n === safePage ? 'on' : ''} onClick={() => setPage(n)}>
                  {n}
                </button>
              ))}
              <button type="button" disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>
                {L(['Sonraki', 'Next'], lang)}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
