'use client';

import { useState } from 'react';
import { PORTAL_LANGS, type Loc, type PortalLang } from '@aidahos/db/portal-config';

/** Multilingual text field: EN/TR/DE/RU tabs over one input; edits the active language. */
export function LocInput({
  value, onChange, placeholder, multiline,
}: {
  value: Loc;
  onChange: (v: Loc) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  const [el, setEl] = useState<PortalLang>('en');
  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {PORTAL_LANGS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setEl(l)}
            style={{
              border: '1px solid var(--border)',
              background: l === el ? 'var(--accent)' : 'var(--surface-2)',
              color: l === el ? 'var(--accent-contrast)' : 'var(--text-2)',
              borderRadius: 'var(--r-sm)', padding: '3px 9px', fontSize: 'var(--text-xs)', fontWeight: 700, cursor: 'pointer',
            }}
          >
            {l.toUpperCase()}{value[l] ? '' : ' ·'}
          </button>
        ))}
      </div>
      {multiline ? (
        <textarea className="ftextarea" value={value[el] ?? ''} placeholder={placeholder} onChange={(e) => onChange({ ...value, [el]: e.target.value })} />
      ) : (
        <input className="finput" value={value[el] ?? ''} placeholder={placeholder} onChange={(e) => onChange({ ...value, [el]: e.target.value })} />
      )}
    </div>
  );
}
