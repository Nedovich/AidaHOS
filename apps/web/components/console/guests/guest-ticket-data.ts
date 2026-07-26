import {
  INITIAL_GUESTS,
  type Guest,
  type GuestTicket,
  type LocalizedText,
} from './guest-data';

export type TicketPriority = 'low' | 'medium' | 'high';

export interface TicketMessage {
  id: string;
  from: LocalizedText;
  staff: boolean;
  text: LocalizedText;
  timestamp: LocalizedText;
}

export interface GuestTicketRecord {
  id: number;
  guest: Guest;
  ticket: GuestTicket;
  priority: TicketPriority;
  category: LocalizedText;
  assignee: LocalizedText;
  description: LocalizedText;
  thread: TicketMessage[];
}

const PRIORITIES: TicketPriority[] = ['low', 'medium', 'high'];
const CATEGORIES: LocalizedText[] = [
  ['İnternet', 'Internet'],
  ['Teknik', 'Technical'],
  ['Oda Hizmeti', 'Room Service'],
  ['Hesap', 'Account'],
];
const ASSIGNEES: LocalizedText[] = [
  ['IT Destek', 'IT Support'],
  ['Resepsiyon', 'Front Desk'],
  ['Teknik Servis', 'Maintenance'],
];
const DESCRIPTIONS: LocalizedText[] = [
  [
    'Misafir odasında Wi-Fi bağlantısının sık sık koptuğunu ve hızın çok düşük olduğunu bildirdi.',
    'Guest reported the in-room Wi-Fi keeps dropping and speeds are very slow.',
  ],
  [
    'Misafir izin verilen cihaz sayısının üzerine çıkmak istiyor, ek cihaz erişimi talep etti.',
    'Guest wants to exceed the allowed device limit and requested extra device access.',
  ],
  [
    'Oda servisi siparişi belirtilen sürede teslim edilmedi, misafir gecikmeden şikayetçi.',
    'Room service order was not delivered within the stated time; guest complained about the delay.',
  ],
  [
    'Misafir hesabına giriş yapamıyor, şifresini hatırlamıyor ve sıfırlama talep etti.',
    "Guest can't log into their account, doesn't remember the password, and requested a reset.",
  ],
];

export const GUEST_TICKET_RECORDS: GuestTicketRecord[] = INITIAL_GUESTS.flatMap((guest) => (
  guest.tickets.map((ticket) => ({ guest, ticket }))
)).map((record, index) => {
  const priority = PRIORITIES[index % PRIORITIES.length] ?? 'low';
  const category = CATEGORIES[index % CATEGORIES.length] ?? CATEGORIES[0]!;
  const assignee = ASSIGNEES[index % ASSIGNEES.length] ?? ASSIGNEES[0]!;
  const description = DESCRIPTIONS[index % DESCRIPTIONS.length] ?? DESCRIPTIONS[0]!;
  const thread: TicketMessage[] = [
    {
      id: `${index}-guest`,
      from: [record.guest.name, record.guest.name],
      staff: false,
      text: description,
      timestamp: [record.ticket.date, record.ticket.date],
    },
    {
      id: `${index}-staff`,
      from: assignee,
      staff: true,
      text: ['Talebinizi aldık, inceliyoruz.', "We've received your request and are looking into it."],
      timestamp: [record.ticket.date, record.ticket.date],
    },
  ];

  if (record.ticket.status === 'closed') {
    thread.push({
      id: `${index}-closed`,
      from: assignee,
      staff: true,
      text: ['Sorun çözüldü, talebi kapatıyoruz.', 'Issue resolved, closing this ticket.'],
      timestamp: [record.ticket.date, record.ticket.date],
    });
  }

  return {
    id: index,
    ...record,
    priority,
    category,
    assignee,
    description,
    thread,
  };
});

export function getGuestTicketRecord(id: number) {
  return GUEST_TICKET_RECORDS.find((record) => record.id === id);
}
