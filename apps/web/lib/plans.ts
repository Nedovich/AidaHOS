import type { Lang } from './i18n';

export type PlanId = 'starter' | 'growth' | 'scale' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  color: string;
  price: number;
  hotels: number | '∞';
  users: number | '∞';
  credits: number;
  features: FeatureId[];
}

export type FeatureId = 'portal' | 'surveys' | 'events' | 'notifications' | 'spa' | 'dining' | 'ai';

export const FEATURE_LABELS: Record<FeatureId, readonly [string, string]> = {
  portal: ['Misafir Portalı', 'Guest Portal'],
  surveys: ['Anketler', 'Surveys'],
  events: ['Etkinlikler', 'Events'],
  notifications: ['Bildirimler', 'Notifications'],
  spa: ['Spa & Wellness', 'Spa & Wellness'],
  dining: ['Restoran & Bar', 'Dining & Bars'],
  ai: ['AI Concierge', 'AI Concierge'],
};

export const PLANS: Record<PlanId, Plan> = {
  starter: { id: 'starter', name: 'Starter', color: '#0E9F6E', price: 0, hotels: 1, users: 5, credits: 10000, features: ['portal', 'surveys'] },
  growth: { id: 'growth', name: 'Growth', color: '#2563C9', price: 690, hotels: 3, users: 25, credits: 40000, features: ['portal', 'surveys', 'events', 'notifications'] },
  scale: { id: 'scale', name: 'Scale', color: '#7C5CE0', price: 1840, hotels: 8, users: 50, credits: 100000, features: ['portal', 'surveys', 'events', 'notifications', 'spa', 'dining'] },
  enterprise: { id: 'enterprise', name: 'Enterprise', color: '#0E7490', price: 5200, hotels: '∞', users: '∞', credits: 500000, features: ['portal', 'surveys', 'events', 'notifications', 'spa', 'dining', 'ai'] },
};

export function getPlan(id: string): Plan {
  return PLANS[(id as PlanId)] ?? PLANS.scale;
}

export function fmtK(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : String(n);
}

export const PLAN_OPTIONS = (lang: Lang) =>
  (Object.keys(PLANS) as PlanId[]).map((id) => ({
    id,
    label: `${PLANS[id].name} · €${PLANS[id].price}/${lang === 'en' ? 'mo' : 'ay'}`,
  }));
