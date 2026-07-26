import {
  INITIAL_GUESTS,
  type Guest,
  type LocalizedText,
} from './guest-data';

export type WelcomeMessageStatus = 'sent' | 'opened' | 'scheduled';

export interface GuestWelcomeMessageRecord {
  id: number;
  guest: Guest;
  title: LocalizedText;
  body: LocalizedText;
  date: string;
  time: string;
  openedDate?: string;
  openedTime?: string;
  status: WelcomeMessageStatus;
}

const MESSAGE_CONTENT: Array<Omit<GuestWelcomeMessageRecord, 'guest'> & { guestId: number }> = [
  {
    id: 1,
    guestId: 1,
    title: ['Hoş Geldiniz!', 'Welcome!'],
    body: [
      'Hoş geldiniz James! AIDA misafir portalına erişiminiz aktif. Restoran rezervasyonu, spa randevusu ve etkinlik programını buradan takip edebilirsiniz.',
      'Welcome James! Your AIDA guest portal access is active. Book restaurants, spa appointments and browse the event program right here.',
    ],
    date: '19.07.2026',
    time: '09:00',
    openedDate: '19.07.2026',
    openedTime: '09:18',
    status: 'opened',
  },
  {
    id: 2,
    guestId: 3,
    title: ['Havuz Partisi Bu Akşam', 'Pool Party Tonight'],
    body: [
      "Bu akşam 20:30'da ana havuzda canlı DJ ve kokteyller sizi bekliyor. Etkinlik programından yerinizi ayırtabilirsiniz.",
      'Live DJ music and cocktails await you at the main pool tonight at 20:30. Reserve your place from the events program.',
    ],
    date: '21.07.2026',
    time: '16:00',
    status: 'sent',
  },
  {
    id: 3,
    guestId: 5,
    title: ['Spa Randevunuz Yaklaşıyor', 'Your Spa Appointment is Coming Up'],
    body: [
      "Spa randevunuz bugün 14:30'da. Lütfen randevunuzdan 10 dakika önce spa resepsiyonunda olun.",
      'Your spa appointment is today at 14:30. Please arrive at the spa reception 10 minutes before your appointment.',
    ],
    date: '16.07.2026',
    time: '08:00',
    openedDate: '16.07.2026',
    openedTime: '08:09',
    status: 'opened',
  },
  {
    id: 4,
    guestId: 9,
    title: ['İyi Geceler', 'Good Night'],
    body: [
      "İyi geceler Oliver. Yarınki kahvaltı 07:00–10:30 saatleri arasında ana restoranda servis edilecektir.",
      "Good night Oliver. Tomorrow's breakfast will be served at the main restaurant between 07:00 and 10:30.",
    ],
    date: '23.07.2026',
    time: '22:00',
    status: 'sent',
  },
  {
    id: 5,
    guestId: 11,
    title: ['Kahvaltı Saatleri', 'Breakfast Hours'],
    body: [
      'Günaydın Karl. Kahvaltımız bugün 07:00–10:30 arasında ana restoranda servis edilmektedir.',
      'Good morning Karl. Breakfast is served today at the main restaurant from 07:00 to 10:30.',
    ],
    date: '11.07.2026',
    time: '07:30',
    openedDate: '11.07.2026',
    openedTime: '07:44',
    status: 'opened',
  },
  {
    id: 6,
    guestId: 17,
    title: ['Yarın Check-out Hatırlatması', 'Check-out Reminder Tomorrow'],
    body: [
      "Konaklamanızın sonuna yaklaştık. Yarın check-out saati 12:00'dir. Dilerseniz resepsiyondan geç çıkış talep edebilirsiniz.",
      'Your stay is nearly complete. Check-out is at 12:00 tomorrow. You can request a late check-out from reception.',
    ],
    date: '26.07.2026',
    time: '09:00',
    status: 'scheduled',
  },
  {
    id: 7,
    guestId: 21,
    title: ['Canlı Müzik Bu Akşam', 'Live Music Tonight'],
    body: [
      "Bu akşam 21:00'de teras barda canlı müzik var. Gün batımına karşı keyifli bir akşam için sizi bekliyoruz.",
      'There is live music at the terrace bar tonight at 21:00. Join us for an evening overlooking the sunset.',
    ],
    date: '27.07.2026',
    time: '18:00',
    status: 'scheduled',
  },
  {
    id: 8,
    guestId: 23,
    title: ['Hoş Geldiniz!', 'Welcome!'],
    body: [
      'Hoş geldiniz Rafael! Konaklamanız boyunca ihtiyaç duyduğunuz tüm hizmetlere AIDA misafir portalından ulaşabilirsiniz.',
      'Welcome Rafael! You can access every service you may need during your stay through the AIDA guest portal.',
    ],
    date: '09.07.2026',
    time: '10:00',
    status: 'sent',
  },
];

export const GUEST_WELCOME_MESSAGE_RECORDS: GuestWelcomeMessageRecord[] =
  MESSAGE_CONTENT.flatMap((message) => {
    const guest = INITIAL_GUESTS[message.guestId];
    return guest ? [{ ...message, guest }] : [];
  });

export function getGuestWelcomeMessageRecord(id: number) {
  return GUEST_WELCOME_MESSAGE_RECORDS.find((record) => record.id === id);
}
