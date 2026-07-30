import { INITIAL_GUESTS, type Guest, type LocalizedText } from './guest-data';

export interface GuestGroupRecord {
  id: number;
  name: LocalizedText;
  color: string;
  guestIds: number[];
}

export const GUEST_GROUP_RECORDS: GuestGroupRecord[] = [
  {
    id: 1,
    name: ['VIP Misafirler', 'VIP Misafirler'],
    color: '#B8740A',
    guestIds: [1, 5, 8, 14, 16, 22],
  },
  {
    id: 2,
    name: ['Balayı Çiftleri', 'Balayı Çiftleri'],
    color: '#7C5CE0',
    guestIds: [3, 9],
  },
  {
    id: 3,
    name: ['Tekrar Misafirler', 'Tekrar Misafirler'],
    color: '#0E7490',
    guestIds: [0, 2, 6, 13, 20],
  },
];

export function getGuestGroupRecord(id: number) {
  return GUEST_GROUP_RECORDS.find((group) => group.id === id);
}

export function getGuestGroupMembers(group: GuestGroupRecord): Guest[] {
  return group.guestIds.flatMap((id) => {
    const guest = INITIAL_GUESTS[id];
    return guest ? [guest] : [];
  });
}
