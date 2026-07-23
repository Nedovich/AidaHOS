export type StaffAccountStatus = 'active' | 'pending' | 'suspended' | 'expired';
export type StaffAccountProfileId = 'mgmt' | 'front' | 'house' | 'fnb' | 'maint' | 'sec';

export type StaffAccountDefinition = {
  id: string;
  name: string;
  role: readonly [string, string];
  username: string;
  profile: StaffAccountProfileId;
  devices: readonly [number, number];
  status: StaffAccountStatus;
  lastLogin: readonly [string, string];
  accessUntil: string;
  color: string;
};

export const STAFF_ACCOUNTS: StaffAccountDefinition[] = [
  { id: 'mert-aydin', name: 'Mert Aydın', role: ['Genel Müdür Yardımcısı', 'Assistant General Manager'], username: 'm.aydin@staff', profile: 'mgmt', devices: [2, 3], status: 'active', lastLogin: ['şimdi', 'now'], accessUntil: '31 Ara 2026', color: '#0E7490' },
  { id: 'selin-yildiz', name: 'Selin Yıldız', role: ['Ön Büro Şefi', 'Front Office Chief'], username: 's.yildiz@staff', profile: 'front', devices: [2, 2], status: 'active', lastLogin: ['14 dk önce', '14 min ago'], accessUntil: '31 Ara 2026', color: '#2563C9' },
  { id: 'ahmet-kaya', name: 'Ahmet Kaya', role: ['Kat Hizmetleri Sorumlusu', 'Housekeeping Supervisor'], username: 'a.kaya@staff', profile: 'house', devices: [1, 1], status: 'active', lastLogin: ['1 sa önce', '1h ago'], accessUntil: '31 Ara 2026', color: '#7C5CE0' },
  { id: 'zeynep-arslan', name: 'Zeynep Arslan', role: ['Şef Garson', 'Head Waiter'], username: 'z.arslan@staff', profile: 'fnb', devices: [1, 1], status: 'active', lastLogin: ['3 sa önce', '3h ago'], accessUntil: '31 Ara 2026', color: '#B8740A' },
  { id: 'burak-sahin', name: 'Burak Şahin', role: ['Teknisyen', 'Technician'], username: 'b.sahin@staff', profile: 'maint', devices: [2, 2], status: 'active', lastLogin: ['dün', 'yesterday'], accessUntil: '31 Ara 2026', color: '#0E9F6E' },
  { id: 'deniz-koc', name: 'Deniz Koç', role: ['Gece Güvenlik', 'Night Security'], username: 'd.koc@staff', profile: 'sec', devices: [1, 2], status: 'active', lastLogin: ['şimdi', 'now'], accessUntil: '31 Ara 2026', color: '#D5485A' },
  { id: 'elif-demirtas', name: 'Elif Demirtaş', role: ['Resepsiyonist', 'Receptionist'], username: 'e.demirtas@staff', profile: 'front', devices: [2, 2], status: 'suspended', lastLogin: ['6 gün önce', '6 days ago'], accessUntil: '12 Eyl 2026', color: '#2563C9' },
  { id: 'onur-polat', name: 'Onur Polat', role: ['Kat Görevlisi', 'Room Attendant'], username: 'o.polat@staff', profile: 'house', devices: [0, 1], status: 'expired', lastLogin: ['32 gün önce', '32 days ago'], accessUntil: '15 Haz 2026', color: '#7C5CE0' },
  { id: 'aylin-sahin', name: 'Aylin Şahin', role: ['Aşçı', 'Cook'], username: 'a.sahin2@staff', profile: 'fnb', devices: [1, 1], status: 'active', lastLogin: ['5 sa önce', '5h ago'], accessUntil: '31 Ara 2026', color: '#B8740A' },
  { id: 'cem-yildirim', name: 'Cem Yıldırım', role: ['Bakım Sorumlusu', 'Maintenance Lead'], username: 'c.yildirim@staff', profile: 'maint', devices: [1, 2], status: 'active', lastLogin: ['2 gün önce', '2 days ago'], accessUntil: '31 Ara 2026', color: '#0E9F6E' },
];

export function getStaffAccount(accountId: string) {
  return STAFF_ACCOUNTS.find((account) => account.id === accountId);
}
