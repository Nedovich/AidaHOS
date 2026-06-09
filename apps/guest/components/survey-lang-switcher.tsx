'use client';

import type { Model } from 'survey-core';

const LABELS: Record<string, string> = { en: 'EN', tr: 'TR', de: 'DE', ru: 'RU' };

/** Locales the survey actually has content for: default locale first, then translations. */
export function surveyLocales(model: Model, defaultLocale: string): string[] {
  const used = ((model.getUsedLocales?.() ?? []) as string[]) || [];
  const list = [defaultLocale];
  for (const l of used) {
    const code = !l || l === 'default' ? defaultLocale : l;
    if (!list.includes(code)) list.push(code);
  }
  return list;
}

/** Compact locale switcher (chips). Hidden when only one locale is available. */
export function SurveyLangSwitcher({
  locales,
  active,
  onChange,
  style,
}: {
  locales: string[];
  active: string;
  onChange: (loc: string) => void;
  style?: React.CSSProperties;
}) {
  if (locales.length < 2) return null;
  return (
    <div style={{ display: 'inline-flex', gap: 5, ...style }}>
      {locales.map((l) => {
        const on = l === active;
        return (
          <button
            key={l}
            type="button"
            onClick={() => onChange(l)}
            aria-pressed={on}
            style={{
              cursor: 'pointer',
              padding: '5px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '.02em',
              border: '1px solid ' + (on ? 'transparent' : 'var(--line, #d6dbe0)'),
              background: on ? 'var(--brand-primary, var(--accent, #2F6E78))' : 'transparent',
              color: on ? '#fff' : 'var(--ink-soft, #556)',
              transition: 'all .15s',
            }}
          >
            {LABELS[l] ?? l.toUpperCase()}
          </button>
        );
      })}
    </div>
  );
}
