import {
  INITIAL_GUESTS,
  type Guest,
  type LocalizedText,
} from './guest-data';

export type SurveySendStatus = 'sent' | 'completed' | 'scheduled';

export interface GuestSurveySendRecord {
  id: number;
  guest: Guest;
  survey: LocalizedText;
  date: string;
  time: string;
  completedDate?: string;
  completedTime?: string;
  score?: number;
  comment?: LocalizedText;
  status: SurveySendStatus;
}

const SURVEY_SEND_CONTENT: Array<{
  id: number;
  guestId: number;
  survey: LocalizedText;
  date: string;
  time: string;
  completedDate?: string;
  completedTime?: string;
  score?: number;
  comment?: LocalizedText;
  status: SurveySendStatus;
}> = [
  {
    id: 1,
    guestId: 0,
    survey: ['Check-out Geri Bildirimi', 'Check-out Feedback'],
    date: '20.07.2026',
    time: '10:00',
    completedDate: '20.07.2026',
    completedTime: '10:06',
    score: 4.6,
    comment: [
      'Personel çok ilgiliydi, odamız tertemizdi. Kesinlikle tekrar geleceğiz.',
      "Staff were very attentive and our room was spotless. We'll definitely come back.",
    ],
    status: 'completed',
  },
  {
    id: 2,
    guestId: 2,
    survey: ['Konaklama Ortası Nabız', 'Mid-Stay Pulse'],
    date: '17.07.2026',
    time: '09:30',
    completedDate: '17.07.2026',
    completedTime: '09:34',
    score: 4.2,
    comment: [
      'Havuz alanı harika ama restoran biraz kalabalıktı.',
      'The pool area is great, but the restaurant felt a bit crowded.',
    ],
    status: 'completed',
  },
  {
    id: 3,
    guestId: 4,
    survey: ['Check-out Geri Bildirimi', 'Check-out Feedback'],
    date: '22.07.2026',
    time: '11:00',
    status: 'sent',
  },
  {
    id: 4,
    guestId: 6,
    survey: ['Etkinlik Geri Bildirimi', 'Event Feedback'],
    date: '13.07.2026',
    time: '10:00',
    completedDate: '13.07.2026',
    completedTime: '10:09',
    score: 4.8,
    comment: [
      'DJ performansı gecenin en güzel anıydı!',
      'The DJ performance was the highlight of the night!',
    ],
    status: 'completed',
  },
  {
    id: 5,
    guestId: 8,
    survey: ['Check-out Geri Bildirimi', 'Check-out Feedback'],
    date: '28.07.2026',
    time: '09:00',
    status: 'scheduled',
  },
  {
    id: 6,
    guestId: 10,
    survey: ['Konaklama Ortası Nabız', 'Mid-Stay Pulse'],
    date: '24.07.2026',
    time: '14:00',
    status: 'sent',
  },
  {
    id: 7,
    guestId: 13,
    survey: ['Check-out Geri Bildirimi', 'Check-out Feedback'],
    date: '05.07.2026',
    time: '10:00',
    completedDate: '05.07.2026',
    completedTime: '10:15',
    score: 3.6,
    comment: [
      'Oda temizliği zamanında yapılmadı, biraz hayal kırıklığı yaşadık.',
      "Room cleaning wasn't done on time, which was a bit disappointing.",
    ],
    status: 'completed',
  },
  {
    id: 8,
    guestId: 15,
    survey: ['Etkinlik Geri Bildirimi', 'Event Feedback'],
    date: '30.07.2026',
    time: '10:30',
    status: 'scheduled',
  },
  {
    id: 9,
    guestId: 19,
    survey: ['Check-out Geri Bildirimi', 'Check-out Feedback'],
    date: '23.07.2026',
    time: '16:00',
    status: 'sent',
  },
];

export const GUEST_SURVEY_SEND_RECORDS: GuestSurveySendRecord[] = SURVEY_SEND_CONTENT.flatMap((record) => {
  const guest = INITIAL_GUESTS[record.guestId];
  return guest ? [{ ...record, guest }] : [];
});

export function getGuestSurveySendRecord(id: number) {
  return GUEST_SURVEY_SEND_RECORDS.find((record) => record.id === id);
}
