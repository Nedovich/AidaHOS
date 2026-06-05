import type { ReactNode } from 'react';
import Link from 'next/link';

export function FormSection({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="set-sec">
      <div className="set-sec__head">
        <div>
          <div className="set-sec__title">{title}</div>
          {sub && <div className="set-sec__sub">{sub}</div>}
        </div>
      </div>
      <div className="set-sec__body">{children}</div>
    </div>
  );
}

export function FormRow({
  label,
  desc,
  children,
  center,
}: {
  label: string;
  desc?: string;
  children: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`set-row${center ? ' set-row--center' : ''}`}>
      <div className="set-row__l">
        <div className="set-row__lbl">{label}</div>
        {desc && <div className="set-row__desc">{desc}</div>}
      </div>
      <div className="set-row__c">{children}</div>
    </div>
  );
}

export function FormFoot({ note, children }: { note?: string; children: ReactNode }) {
  return (
    <div
      className="set-sec__foot"
      style={{
        borderRadius: 'var(--r-lg)',
        border: '1px solid var(--border)',
        borderTop: '1px solid var(--border-faint)',
        background: 'var(--surface)',
      }}
    >
      {note && <span className="set-foot__note">{note}</span>}
      {children}
    </div>
  );
}

export function Crumb({ parent, parentHref, current }: { parent: string; parentHref: string; current: string }) {
  return (
    <div
      className="header__crumb"
      style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}
    >
      <Link href={parentHref} className="row-link" style={{ color: 'var(--text-3)' }}>
        {parent}
      </Link>
      <span>›</span>
      <span style={{ color: 'var(--text)' }}>{current}</span>
    </div>
  );
}
