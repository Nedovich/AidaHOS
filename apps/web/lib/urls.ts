/**
 * Base URL of the guest portal — where survey public links (`/s/<hotel>/<survey>`)
 * resolve. Configurable per environment via GUEST_PUBLIC_URL (the guest app runs on a
 * different host than the console: localhost:3001 in dev, its own domain in prod).
 */
export function guestBaseUrl(): string {
  const raw = process.env.GUEST_PUBLIC_URL || process.env.NEXT_PUBLIC_GUEST_URL || 'http://localhost:3001';
  return raw.replace(/\/+$/, '');
}

/** Full public URL for a survey, served by the guest portal. */
export function surveyPublicUrl(hotelSlug: string, surveySlug: string): string {
  return `${guestBaseUrl()}/s/${hotelSlug}/${surveySlug}`;
}
