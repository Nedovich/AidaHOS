import {
  INITIAL_GUESTS,
  type Guest,
  type LocalizedText,
} from './guest-data';

export type EmailStatus = 'sent' | 'opened' | 'scheduled';

export interface GuestEmailRecord {
  id: number;
  guest: Guest;
  subject: LocalizedText;
  body: LocalizedText;
  date: string;
  time: string;
  openedDate?: string;
  openedTime?: string;
  status: EmailStatus;
}

const EMAIL_CONTENT: Array<{
  id: number;
  guestId: number;
  subject: LocalizedText;
  body: LocalizedText;
  date: string;
  time: string;
  openedDate?: string;
  openedTime?: string;
  status: EmailStatus;
}> = [
  {
    id: 1,
    guestId: 1,
    subject: ['Rezervasyon Onayı', 'Booking Confirmation'],
    body: [
      'Merhaba James, Azure Bay Hotel rezervasyonunuz onaylandı. Odanız check-in gününde sizin için hazır olacak. Herhangi bir özel talebiniz varsa bu e-postayı yanıtlayabilirsiniz.',
      'Hi James, your reservation at Azure Bay Hotel is confirmed. Your room will be ready on check-in day. Reply to this email for any special requests.',
    ],
    date: '19.07.2026',
    time: '09:12',
    openedDate: '19.07.2026',
    openedTime: '09:47',
    status: 'opened',
  },
  {
    id: 2,
    guestId: 3,
    subject: ['Özel Teklif: Spa Paketi', 'Special Offer: Spa Package'],
    body: [
      'Merhaba Lucas, konaklamanız süresince spa merkezimizde %20 indirimli özel bir masaj ve cilt bakım paketinden yararlanabilirsiniz. Teklif konaklamanızın son gününe kadar geçerlidir.',
      'Hi Lucas, enjoy 20% off a signature massage and facial package at our spa during your stay. This offer is valid until your last day with us.',
    ],
    date: '21.07.2026',
    time: '14:05',
    status: 'sent',
  },
  {
    id: 3,
    guestId: 5,
    subject: ['Check-in Bilgilendirmesi', 'Check-in Information'],
    body: [
      "Merhaba Chen, check-in saatimiz 14:00'tür. Erken varışlarda bagajınızı ücretsiz saklayabilir, havuz ve plaj alanlarımızdan yararlanabilirsiniz.",
      "Hi Chen, our check-in time is 2:00 PM. If you arrive early, we're happy to store your luggage and you're welcome to use the pool and beach areas.",
    ],
    date: '16.07.2026',
    time: '08:30',
    openedDate: '16.07.2026',
    openedTime: '09:03',
    status: 'opened',
  },
  {
    id: 4,
    guestId: 7,
    subject: ['Teşekkürler!', 'Thank You!'],
    body: [
      'Merhaba Mateus, konaklamanız için teşekkür ederiz. Sizi tekrar ağırlamak dileğiyle, deneyiminizi kısa bir anketle paylaşmanızı rica ederiz.',
      "Hi Mateus, thank you for staying with us. We'd love to welcome you back. Please share your experience in a short survey.",
    ],
    date: '23.07.2026',
    time: '17:00',
    status: 'sent',
  },
  {
    id: 5,
    guestId: 9,
    subject: ['Faturanız Hazır', 'Your Invoice is Ready'],
    body: [
      'Merhaba Oliver, konaklamanıza ait fatura hazırlanmıştır. Ekli bağlantıdan görüntüleyip indirebilirsiniz.',
      'Hi Oliver, your stay invoice is ready. You can view and download it from the link below.',
    ],
    date: '14.07.2026',
    time: '10:00',
    openedDate: '14.07.2026',
    openedTime: '10:22',
    status: 'opened',
  },
  {
    id: 6,
    guestId: 14,
    subject: ['Yaklaşan Check-out Hatırlatması', 'Upcoming Check-out Reminder'],
    body: [
      "Merhaba Layla, check-out tarihiniz yaklaşıyor. Çıkış saatimiz 12:00'dir; oda hizmetlerinden geç çıkış talep edebilirsiniz.",
      'Hi Layla, your check-out date is approaching. Our check-out time is 12:00 PM. Ask our team about a late check-out.',
    ],
    date: '27.07.2026',
    time: '11:00',
    status: 'scheduled',
  },
  {
    id: 7,
    guestId: 16,
    subject: ['Hoş Geldiniz Paketi', 'Welcome Package'],
    body: [
      "Merhaba Freya, Azure Bay Hotel'e hoş geldiniz! Odanızda sizi bekleyen karşılama ikramlarımızın ve otel imkanlarımızın detaylarını bu e-postada bulabilirsiniz.",
      'Hi Freya, welcome to Azure Bay Hotel! Find details of the welcome amenities in your room and our hotel facilities in this email.',
    ],
    date: '10.07.2026',
    time: '09:45',
    status: 'sent',
  },
  {
    id: 8,
    guestId: 18,
    subject: ['Restoran Rezervasyonu Onayı', 'Restaurant Reservation Confirmed'],
    body: [
      'Merhaba Grace, ana restoranımızdaki masa rezervasyonunuz onaylanmıştır. Sizi akşam yemeğinde ağırlamaktan mutluluk duyacağız.',
      'Hi Grace, your table reservation at our main restaurant is confirmed. We look forward to hosting you for dinner.',
    ],
    date: '24.07.2026',
    time: '19:20',
    openedDate: '24.07.2026',
    openedTime: '19:41',
    status: 'opened',
  },
  {
    id: 9,
    guestId: 20,
    subject: ['Anket Hatırlatması', 'Survey Reminder'],
    body: [
      'Merhaba Nadia, check-out anketimizi henüz tamamlamadınız. Görüşleriniz bizim için çok değerli; sadece 2 dakikanızı alacak.',
      "Hi Nadia, you haven't completed our checkout survey yet. Your feedback matters to us and takes just 2 minutes.",
    ],
    date: '18.07.2026',
    time: '10:15',
    status: 'sent',
  },
  {
    id: 10,
    guestId: 12,
    subject: ['Doğum Günü Sürprizi', 'Birthday Surprise'],
    body: [
      'Doğum günün kutlu olsun Valentina! Konaklamanız süresince odanıza özel bir sürpriz hazırlıyoruz.',
      "Happy birthday, Valentina! We're preparing a special surprise for your room during your stay.",
    ],
    date: '26.07.2026',
    time: '09:00',
    status: 'scheduled',
  },
];

export const GUEST_EMAIL_RECORDS: GuestEmailRecord[] = EMAIL_CONTENT.flatMap((email) => {
  const guest = INITIAL_GUESTS[email.guestId];
  return guest ? [{ ...email, guest }] : [];
});

export function getGuestEmailRecord(id: number) {
  return GUEST_EMAIL_RECORDS.find((record) => record.id === id);
}
