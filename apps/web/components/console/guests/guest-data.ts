export type StayStatus = 'inhouse' | 'checked-out';
export type ConnectionStatus = 'online' | 'offline';
export type VipTier = 'none' | 'silver' | 'gold' | 'platinum';
export type LocalizedText = readonly [string, string];

export interface GuestNote {
  id: string;
  text: LocalizedText;
  timestamp: LocalizedText;
}

export interface GuestTicket {
  id: string;
  subject: LocalizedText;
  date: string;
  status: 'open' | 'closed';
}

export interface GuestSurvey {
  id: string;
  title: LocalizedText;
  date: string;
  score: number;
}

export interface GuestStay {
  id: string;
  hotel: string;
  checkin: string;
  checkout: string;
  nights: number;
  roomType: LocalizedText;
  amount: string;
}

export interface GuestConnection {
  id: string;
  device: string;
  deviceType: 'phone' | 'laptop' | 'tablet';
  mac: string;
  ip: string;
  day: LocalizedText;
  time: string;
  duration: LocalizedText;
  data: string;
  status: 'active' | 'ended';
}

export interface Guest {
  id: number;
  name: string;
  initials: string;
  color: string;
  room: string;
  hotel: string;
  checkin: string;
  checkout: string;
  status: StayStatus;
  phone: string;
  email: string;
  connection: ConnectionStatus;
  devices: number;
  dataToday: string;
  vip: VipTier;
  birthDate: string;
  country: LocalizedText;
  roomType: LocalizedText;
  agency: string;
  currency: string;
  createdAt: string;
  pmsActive: boolean;
  notes: GuestNote[];
  tickets: GuestTicket[];
  surveys: GuestSurvey[];
  stays: GuestStay[];
  connections: GuestConnection[];
}

export const HOTELS = [
  'Lumera Resort & Spa',
  'Azure Bay Hotel',
  'Celestia Grand',
  'Marenza Beach Club',
  'Solara Cove Suites',
] as const;

const NAMES = [
  'Elena Marchetti',
  'James Whitfield',
  'Sofia Rossi',
  'Lucas Bergmann',
  'Amara Osei',
  'Chen Wei',
  'Isabelle Dubois',
  'Mateus Silva',
  'Priya Nair',
  'Oliver Bennett',
  'Hana Kobayashi',
  'Karl Fischer',
  'Valentina Cruz',
  'Noah Andersen',
  'Layla Haddad',
  'Marco Bianchi',
  'Freya Larsen',
  'Tomás García',
  'Grace Kim',
  'Aleksander Kowalski',
  'Nadia Hassan',
  'William Cole',
  'Ingrid Solberg',
  'Rafael Costa',
] as const;

const VIP: VipTier[] = [
  'gold', 'none', 'none', 'silver', 'none', 'platinum', 'none', 'none',
  'gold', 'none', 'silver', 'none', 'none', 'none', 'platinum', 'none',
  'gold', 'none', 'none', 'silver', 'none', 'none', 'none', 'gold',
];
const DOMAINS = ['gmail.com', 'outlook.com', 'icloud.com'] as const;
const AVATAR_COLORS = ['#0E7490', '#7C5CE0', '#0E9F6E', '#B8740A', '#2563C9', '#D5485A'] as const;
const COUNTRIES: LocalizedText[] = [
  ['İtalya', 'Italy'], ['Birleşik Krallık', 'United Kingdom'], ['İtalya', 'Italy'],
  ['Almanya', 'Germany'], ['Gana', 'Ghana'], ['Çin', 'China'], ['Fransa', 'France'],
  ['Brezilya', 'Brazil'], ['Hindistan', 'India'], ['Birleşik Krallık', 'United Kingdom'],
  ['Japonya', 'Japan'], ['Almanya', 'Germany'], ['Meksika', 'Mexico'], ['Norveç', 'Norway'],
  ['Lübnan', 'Lebanon'], ['İtalya', 'Italy'], ['Norveç', 'Norway'], ['İspanya', 'Spain'],
  ['Güney Kore', 'South Korea'], ['Polonya', 'Poland'], ['Mısır', 'Egypt'],
  ['Birleşik Krallık', 'United Kingdom'], ['Norveç', 'Norway'], ['Brezilya', 'Brazil'],
];
const AGENCIES = ['Booking.com', 'Direct', 'Expedia', 'TUI', 'Anex Tour', 'Jolly Tur'] as const;
const ROOM_TYPES: LocalizedText[] = [
  ['Standart Oda', 'Standard Room'],
  ['Deluxe Oda', 'Deluxe Room'],
  ['Süit', 'Suite'],
  ['Deniz Manzaralı Oda', 'Sea View Room'],
  ['Aile Odası', 'Family Room'],
];
const CURRENCIES = ['EUR', 'USD', 'GBP', 'TRY'] as const;
const NOTE_SEEDS: LocalizedText[] = [
  ['Erken check-in talep etti, karşılandı.', 'Requested early check-in; accommodated.'],
  ['Wi-Fi bağlantı şikayeti çözüldü.', 'Wi-Fi connection complaint resolved.'],
  ['Balayı odası üst kategoriye yükseltildi.', 'Honeymoon room upgraded.'],
  ['Sessiz ve üst katta oda tercih ediyor.', 'Prefers a quiet room on a high floor.'],
  ['Fıstık alerjisi var, mutfak bilgilendirildi.', 'Peanut allergy; kitchen notified.'],
];
const TICKET_SEEDS: LocalizedText[] = [
  ['Yavaş internet bağlantısı', 'Slow internet connection'],
  ['Ek cihaz erişimi', 'Extra device access'],
  ['Oda servisi gecikmesi', 'Room service delay'],
  ['Şifre sıfırlama talebi', 'Password reset request'],
];
const SURVEY_TITLES: LocalizedText[] = [
  ['Check-out Geri Bildirimi', 'Checkout Feedback'],
  ['Restoran Deneyimi', 'Restaurant Experience'],
  ['Spa Deneyimi', 'Spa Experience'],
  ['Konaklama Ortası Değerlendirmesi', 'Mid-Stay Pulse'],
  ['Etkinlik Geri Bildirimi', 'Event Feedback'],
];
const DEVICES = [
  { name: 'iPhone 15 Pro', type: 'phone' as const },
  { name: 'MacBook Pro', type: 'laptop' as const },
  { name: 'Samsung Galaxy Tab', type: 'tablet' as const },
  { name: 'iPad Air', type: 'tablet' as const },
] as const;

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDate(date: Date) {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getFullYear()}`;
}

function avatarColor(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}

function initials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
}

function usernameFor(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .trim()
    .replace(/\s+/g, '.');
}

function seeded(seed: number) {
  let value = seed || 1;
  return () => {
    value = (value * 9301 + 49297) % 233280;
    return value / 233280;
  };
}

function macAddress(seed: number) {
  const random = seeded(seed + 91);
  return Array.from({ length: 6 }, () => Math.floor(random() * 256).toString(16).padStart(2, '0').toUpperCase()).join(':');
}

function createConnections(guestIndex: number, online: boolean): GuestConnection[] {
  const random = seeded(guestIndex + 731);
  return Array.from({ length: 8 }, (_, index) => {
    const device = DEVICES[(guestIndex + index) % DEVICES.length] ?? DEVICES[0]!;
    const active = online && index === 0;
    const dayOffset = index === 0 ? 0 : index;
    const hour = 7 + (guestIndex * 3 + index * 2) % 15;
    const minute = (guestIndex * 11 + index * 17) % 60;
    const inbound = 0.2 + random() * 2.6;
    const outbound = 0.1 + random() * 1.4;

    return {
      id: `${guestIndex}-${index}`,
      device: device.name,
      deviceType: device.type,
      mac: macAddress(guestIndex * 20 + index),
      ip: `10.10.${2 + (guestIndex % 7)}.${40 + (guestIndex * 13 + index * 17) % 190}`,
      day: dayOffset === 0
        ? ['Bugün', 'Today']
        : dayOffset === 1
          ? ['Dün', 'Yesterday']
          : [`${25 - dayOffset} Tem`, `${25 - dayOffset} Jul`],
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      duration: active
        ? ['devam ediyor', 'ongoing']
        : [`${1 + (guestIndex + index) % 4}s ${3 + (index * 7) % 54}dk`, `${1 + (guestIndex + index) % 4}h ${3 + (index * 7) % 54}m`],
      data: `${inbound.toFixed(1)}/${outbound.toFixed(1)} GB`,
      status: active ? 'active' : 'ended',
    };
  });
}

function createGuests(): Guest[] {
  const today = new Date(2026, 6, 25);
  return NAMES.map((name, index) => {
    const hotelIndex = index % HOTELS.length;
    const checkinDate = addDays(today, -(3 + (index * 2) % 13));
    const checkoutDate = addDays(checkinDate, 3 + index % 6);
    const status: StayStatus = checkoutDate >= today ? 'inhouse' : 'checked-out';
    const connection: ConnectionStatus = status === 'inhouse' && index % 3 !== 0 ? 'online' : 'offline';
    const deviceCount = connection === 'online' ? 1 + index % 3 : 0;
    const dataMb = 80 + (index * 53) % 3200;
    const stayCount = 1 + index % 4;
    const surveyCount = index % 3 === 0 ? 0 : 1 + index % 3;

    const stays = Array.from({ length: stayCount }, (_, stayIndex): GuestStay => {
      const stayCheckout = addDays(checkinDate, -(stayIndex * 90));
      const nights = 3 + (index + stayIndex) % 6;
      const stayCheckin = addDays(stayCheckout, -nights);
      return {
        id: `${index}-${stayIndex}`,
        hotel: HOTELS[(hotelIndex + stayIndex) % HOTELS.length] ?? HOTELS[0]!,
        checkin: formatDate(stayCheckin),
        checkout: formatDate(stayCheckout),
        nights,
        roomType: ROOM_TYPES[(index + stayIndex) % ROOM_TYPES.length] ?? ROOM_TYPES[0]!,
        amount: `${CURRENCIES[index % CURRENCIES.length]} ${(420 + index * 63 + stayIndex * 180).toLocaleString('en-US')}`,
      };
    });

    const notes: GuestNote[] = index % 4 === 3 ? [] : [{
      id: `${index}-note`,
      text: NOTE_SEEDS[index % NOTE_SEEDS.length] ?? NOTE_SEEDS[0]!,
      timestamp: index % 2 === 0 ? ['Bugün 10:24', 'Today 10:24'] : ['Dün 18:40', 'Yesterday 18:40'],
    }];
    const tickets: GuestTicket[] = index % 5 === 0 ? [{
      id: `${index}-ticket`,
      subject: TICKET_SEEDS[index % TICKET_SEEDS.length] ?? TICKET_SEEDS[0]!,
      date: formatDate(addDays(checkinDate, 1)),
      status: index % 10 === 0 ? 'open' : 'closed',
    }] : [];
    const surveys = Array.from({ length: surveyCount }, (_, surveyIndex): GuestSurvey => ({
      id: `${index}-survey-${surveyIndex}`,
      title: SURVEY_TITLES[(index + surveyIndex) % SURVEY_TITLES.length] ?? SURVEY_TITLES[0]!,
      date: formatDate(addDays(today, -(5 + surveyIndex * 11))),
      score: 3 + (index + surveyIndex) % 3,
    }));
    const birthDate = new Date(1962 + (index * 3) % 42, (index * 5) % 12, 3 + (index * 7) % 25);
    const room = String(200 + hotelIndex * 40 + (index * 3) % 38);
    const username = usernameFor(name);

    return {
      id: index,
      name,
      initials: initials(name),
      color: avatarColor(name),
      room,
      hotel: HOTELS[hotelIndex] ?? HOTELS[0]!,
      checkin: formatDate(checkinDate),
      checkout: formatDate(checkoutDate),
      status,
      phone: `+90 5${String(30 + index % 60).padStart(2, '0')} ${String(100 + index * 17 % 900)} ${String(10 + index % 89).padStart(2, '0')} ${String(10 + (index * 7) % 89).padStart(2, '0')}`,
      email: `${username}@${DOMAINS[index % DOMAINS.length]}`,
      connection,
      devices: deviceCount,
      dataToday: connection === 'online' ? (dataMb > 1000 ? `${(dataMb / 1000).toFixed(1)} GB` : `${dataMb} MB`) : '—',
      vip: VIP[index] ?? 'none',
      birthDate: formatDate(birthDate),
      country: COUNTRIES[index] ?? COUNTRIES[0]!,
      roomType: ROOM_TYPES[index % ROOM_TYPES.length] ?? ROOM_TYPES[0]!,
      agency: AGENCIES[index % AGENCIES.length] ?? AGENCIES[0]!,
      currency: CURRENCIES[index % CURRENCIES.length] ?? CURRENCIES[0]!,
      createdAt: formatDate(addDays(checkinDate, -(1 + index % 5))),
      pmsActive: index % 17 !== 0,
      notes,
      tickets,
      surveys,
      stays,
      connections: createConnections(index, connection === 'online'),
    };
  });
}

export const INITIAL_GUESTS = createGuests();

export function getGuestById(id: number) {
  return INITIAL_GUESTS.find((guest) => guest.id === id);
}
