import type { Config } from 'tailwindcss';

/**
 * Shared Tailwind preset carrying AIDA design tokens.
 * Colors map to CSS variables defined in globals.css so light/dark and the
 * guest portal's per-hotel brand override (terracotta / sea-green) work at runtime.
 *
 * Admin surfaces anchor on teal/cyan (#0e7490); the guest portal overrides
 * --brand-* per hotel. Extend the scales as real screens are built (Phase 2+).
 */
const preset = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [],
  theme: {
    extend: {
      colors: {
        // semantic surface tokens (driven by CSS vars)
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        ink: 'var(--text)',
        muted: 'var(--text-3)',
        // brand (overridable per hotel on the guest portal)
        brand: {
          DEFAULT: 'var(--brand-primary)',
          fg: 'var(--brand-primary-fg, #fff)',
          secondary: 'var(--brand-secondary)',
        },
        // admin accent scale (teal/cyan)
        teal: {
          50: '#ecfeff',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
        },
        success: 'var(--success, #2f9e6e)',
        warning: 'var(--warning, #c98a2b)',
        danger: 'var(--danger, #d0584f)',
      },
      borderRadius: {
        sm: 'var(--r-sm, 8px)',
        md: 'var(--r-md, 12px)',
        lg: 'var(--r-lg, 16px)',
      },
      fontFamily: {
        display: 'var(--font-display)',
        ui: 'var(--font-ui)',
      },
    },
  },
  plugins: [],
} satisfies Partial<Config>;

export default preset;
