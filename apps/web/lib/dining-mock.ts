import type { Lang } from '@/lib/i18n';

export type LocalizedText = readonly [string, string];
export type VenueStatus = 'open' | 'limited' | 'closed';
export type ReservationStatus = 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'noshow';
export type VenueIcon = 'utensils' | 'wine' | 'coffee' | 'waves' | 'star';

export type DiningVenue = {
  id: string;
  name: string;
  type: LocalizedText;
  location: LocalizedText;
  icon: VenueIcon;
  color: string;
  soft: string;
  status: VenueStatus;
  occupancy: number;
  capacity: number;
  reservations: number;
  revenue: number;
};

export type DiningReservation = {
  id: string;
  guest: string;
  room: string;
  venueId: string;
  date: LocalizedText;
  time: string;
  party: number;
  table: string;
  status: ReservationStatus;
};

export function localize(text: LocalizedText, lang: Lang) {
  return lang === 'tr' ? text[0] : text[1];
}

export function formatEuro(value: number) {
  if (value >= 1000) return `€${(value / 1000).toFixed(value >= 10000 ? 1 : 1)}k`;
  return `€${value}`;
}

export const DINING_VENUES: DiningVenue[] = [
  {
    id: 'marea',
    name: 'Marea',
    type: ['Ege fine dining', 'Aegean fine dining'],
    location: ['Sahil Katı', 'Beach Level'],
    icon: 'utensils',
    color: '#0E7490',
    soft: 'var(--accent-soft)',
    status: 'open',
    occupancy: 74,
    capacity: 90,
    reservations: 42,
    revenue: 9600,
  },
  {
    id: 'alacarte',
    name: "A'la Carte",
    type: ['İtalyan & Akdeniz', 'Italian & Mediterranean'],
    location: ['Lobi Katı', 'Lobby Floor'],
    icon: 'wine',
    color: '#7C5CE0',
    soft: 'var(--purple-soft)',
    status: 'open',
    occupancy: 68,
    capacity: 90,
    reservations: 38,
    revenue: 8200,
  },
  {
    id: 'sunset',
    name: 'Sunset Bar',
    type: ['Kokteyl & tapas', 'Cocktails & tapas'],
    location: ['Teras', 'Terrace'],
    icon: 'wine',
    color: '#B8740A',
    soft: 'var(--warning-soft)',
    status: 'open',
    occupancy: 52,
    capacity: 74,
    reservations: 31,
    revenue: 5100,
  },
  {
    id: 'lagoon',
    name: 'Lagoon Grill',
    type: ['Havuz başı grill', 'Poolside grill'],
    location: ['Relax Havuz', 'Relax Pool'],
    icon: 'waves',
    color: '#0E9F6E',
    soft: 'var(--success-soft)',
    status: 'open',
    occupancy: 38,
    capacity: 64,
    reservations: 25,
    revenue: 3700,
  },
  {
    id: 'lobby',
    name: 'Lobby Lounge',
    type: ['Kafe & tatlı', 'Cafe & dessert'],
    location: ['Ana Lobi', 'Main Lobby'],
    icon: 'coffee',
    color: '#2563C9',
    soft: 'var(--info-soft)',
    status: 'limited',
    occupancy: 22,
    capacity: 48,
    reservations: 15,
    revenue: 2100,
  },
];

export const DINING_RESERVATIONS: DiningReservation[] = [
  {
    id: 'res-402-2000',
    guest: 'Eleanor James',
    room: '402',
    venueId: 'alacarte',
    date: ['12 Haz', 'Jun 12'],
    time: '20:00',
    party: 2,
    table: 'A-12',
    status: 'confirmed',
  },
  {
    id: 'res-210-2015',
    guest: 'Familie Hoffmann',
    room: '210',
    venueId: 'marea',
    date: ['12 Haz', 'Jun 12'],
    time: '20:15',
    party: 5,
    table: 'M-04',
    status: 'seated',
  },
  {
    id: 'res-1105-2030',
    guest: 'Marcus Webb',
    room: '1105',
    venueId: 'sunset',
    date: ['12 Haz', 'Jun 12'],
    time: '20:30',
    party: 1,
    table: 'S-08',
    status: 'confirmed',
  },
  {
    id: 'res-615-2100',
    guest: 'Davide Russo',
    room: '615',
    venueId: 'alacarte',
    date: ['12 Haz', 'Jun 12'],
    time: '21:00',
    party: 2,
    table: 'A-07',
    status: 'confirmed',
  },
  {
    id: 'res-312-2115',
    guest: 'Sarah Palmer',
    room: '312',
    venueId: 'marea',
    date: ['12 Haz', 'Jun 12'],
    time: '21:15',
    party: 2,
    table: 'M-02',
    status: 'completed',
  },
  {
    id: 'res-508-2130',
    guest: 'Ahmet Yıldız',
    room: '508',
    venueId: 'lagoon',
    date: ['12 Haz', 'Jun 12'],
    time: '21:30',
    party: 4,
    table: 'L-11',
    status: 'confirmed',
  },
];
