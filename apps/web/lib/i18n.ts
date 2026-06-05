export type Lang = 'tr' | 'en';
export const DEFAULT_LANG: Lang = 'tr';

/** Pick TR/EN from a [tr, en] pair. Mirrors the design's L() helper. */
export function L(pair: readonly [string, string], lang: Lang): string {
  return lang === 'en' ? pair[1] : pair[0];
}
