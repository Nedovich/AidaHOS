const TR: Record<string, string> = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', İ: 'i' };

/** Turkish-aware slugify. */
export function slugify(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[çğıöşüİ]/g, (c) => TR[c] ?? c)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'item';
}
