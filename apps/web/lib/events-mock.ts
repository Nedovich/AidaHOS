import type { Lang } from '@/lib/i18n';

export type EventCategory = 'ent' | 'kids' | 'sport' | 'well' | 'fnb' | 'spec';
export type EventStatus = 'scheduled' | 'live' | 'full' | 'completed' | 'draft';
export type ParticipantStatus = 'registered' | 'attended' | 'noshow' | 'cancelled';
export type LocalizedText = readonly [string, string];

export type MockEvent = {
  name: LocalizedText;
  category: EventCategory;
  location: LocalizedText;
  day: number;
  date: LocalizedText;
  time: string;
  end: string;
  capacity: number;
  registrations: number;
  status: EventStatus;
};

export type MockParticipant = {
  name: string;
  room: string;
  adults: number;
  children: number;
  registeredAt: LocalizedText;
  status: ParticipantStatus;
  color: string;
};

export const EVENT_CATEGORIES: Record<
  EventCategory,
  { label: LocalizedText; color: string; soft: string }
> = {
  ent: {
    label: ['Eğlence', 'Entertainment'],
    color: 'var(--purple)',
    soft: 'var(--purple-soft)',
  },
  kids: {
    label: ['Çocuk Kulübü', 'Kids Club'],
    color: 'var(--info)',
    soft: 'var(--info-soft)',
  },
  sport: {
    label: ['Spor', 'Sports'],
    color: 'var(--success)',
    soft: 'var(--success-soft)',
  },
  well: {
    label: ['Wellness', 'Wellness'],
    color: 'var(--accent)',
    soft: 'var(--accent-soft)',
  },
  fnb: {
    label: ['Yeme & İçme', 'Food & Drink'],
    color: 'var(--warning)',
    soft: 'var(--warning-soft)',
  },
  spec: {
    label: ['Özel Etkinlik', 'Special Event'],
    color: 'var(--danger)',
    soft: 'var(--danger-soft)',
  },
};

export const MOCK_EVENTS: MockEvent[] = [
  {
    name: ['Havuz Başı DJ Performansı', 'Poolside DJ Set'],
    category: 'ent',
    location: ['Ana Havuz', 'Main Pool'],
    day: 12,
    date: ['12 Haz', 'Jun 12'],
    time: '16:00',
    end: '18:00',
    capacity: 200,
    registrations: 184,
    status: 'live',
  },
  {
    name: ['Çocuk Animasyon Şovu', 'Kids Animation Show'],
    category: 'kids',
    location: ['Mini Kulüp', 'Mini Club'],
    day: 12,
    date: ['12 Haz', 'Jun 12'],
    time: '11:00',
    end: '12:00',
    capacity: 60,
    registrations: 48,
    status: 'scheduled',
  },
  {
    name: ['Sabah Yogası', 'Sunrise Yoga'],
    category: 'well',
    location: ['Wellness Terası', 'Wellness Deck'],
    day: 12,
    date: ['12 Haz', 'Jun 12'],
    time: '08:00',
    end: '09:00',
    capacity: 30,
    registrations: 30,
    status: 'full',
  },
  {
    name: ['Plaj Voleybol Turnuvası', 'Beach Volleyball Cup'],
    category: 'sport',
    location: ['Sahil', 'Beach'],
    day: 13,
    date: ['13 Haz', 'Jun 13'],
    time: '15:00',
    end: '17:00',
    capacity: 48,
    registrations: 22,
    status: 'scheduled',
  },
  {
    name: ['Gala Akşam Yemeği', 'Gala Dinner'],
    category: 'fnb',
    location: ['Teras Restoran', 'Terrace Restaurant'],
    day: 14,
    date: ['14 Haz', 'Jun 14'],
    time: '20:00',
    end: '23:00',
    capacity: 320,
    registrations: 295,
    status: 'scheduled',
  },
  {
    name: ['Türk Gecesi', 'Turkish Night'],
    category: 'spec',
    location: ['Amfi Tiyatro', 'Amphitheatre'],
    day: 14,
    date: ['14 Haz', 'Jun 14'],
    time: '21:30',
    end: '23:30',
    capacity: 500,
    registrations: 410,
    status: 'scheduled',
  },
  {
    name: ['Aqua Aerobik', 'Aqua Aerobics'],
    category: 'sport',
    location: ['Relax Havuz', 'Relax Pool'],
    day: 13,
    date: ['13 Haz', 'Jun 13'],
    time: '11:30',
    end: '12:15',
    capacity: 40,
    registrations: 18,
    status: 'scheduled',
  },
  {
    name: ['Cocktail Workshop', 'Cocktail Workshop'],
    category: 'fnb',
    location: ['Lobi Bar', 'Lobby Bar'],
    day: 16,
    date: ['16 Haz', 'Jun 16'],
    time: '18:30',
    end: '19:30',
    capacity: 25,
    registrations: 9,
    status: 'draft',
  },
  {
    name: ['Akustik Canlı Müzik', 'Acoustic Live Music'],
    category: 'ent',
    location: ['Lobi Bar', 'Lobby Bar'],
    day: 11,
    date: ['11 Haz', 'Jun 11'],
    time: '21:00',
    end: '23:00',
    capacity: 120,
    registrations: 120,
    status: 'completed',
  },
];

export const MOCK_PARTICIPANTS: MockParticipant[] = [
  {
    name: 'Eleanor James',
    room: '402',
    adults: 2,
    children: 0,
    registeredAt: ['11 Haz, 14:20', 'Jun 11, 14:20'],
    status: 'attended',
    color: '#2563C9',
  },
  {
    name: 'Familie Hoffmann',
    room: '210',
    adults: 2,
    children: 3,
    registeredAt: ['11 Haz, 09:05', 'Jun 11, 09:05'],
    status: 'registered',
    color: '#2F7E9A',
  },
  {
    name: 'Marcus Webb',
    room: '1105',
    adults: 1,
    children: 0,
    registeredAt: ['10 Haz, 18:42', 'Jun 10, 18:42'],
    status: 'registered',
    color: '#7C5CE0',
  },
  {
    name: 'Davide Russo',
    room: '615',
    adults: 2,
    children: 1,
    registeredAt: ['10 Haz, 12:30', 'Jun 10, 12:30'],
    status: 'noshow',
    color: '#D5485A',
  },
  {
    name: 'Sarah Palmer',
    room: '312',
    adults: 2,
    children: 0,
    registeredAt: ['09 Haz, 20:15', 'Jun 09, 20:15'],
    status: 'cancelled',
    color: '#45A46D',
  },
  {
    name: 'Ahmet Yıldız',
    room: '508',
    adults: 3,
    children: 2,
    registeredAt: ['09 Haz, 16:50', 'Jun 09, 16:50'],
    status: 'registered',
    color: '#45A46D',
  },
  {
    name: 'Lena Bauer',
    room: '718',
    adults: 2,
    children: 0,
    registeredAt: ['08 Haz, 11:10', 'Jun 08, 11:10'],
    status: 'attended',
    color: '#B8740A',
  },
];

export function localize(text: LocalizedText, lang: Lang) {
  return lang === 'en' ? text[1] : text[0];
}

export function initials(name: string) {
  return name
    .replace(/[^A-Za-zÇĞİÖŞÜçğıöşü\s.]/g, '')
    .trim()
    .split(/[\s.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
