export type GuestCommsRecordKind = 'email' | 'survey' | 'message';

export interface GuestCommsEditValue {
  primary: string;
  body?: string;
  date: string;
  time: string;
}

function storageKey(kind: GuestCommsRecordKind, id: number) {
  return `aida:guest-comms:${kind}:${id}`;
}

export function loadGuestCommsEdit(kind: GuestCommsRecordKind, id: number) {
  if (typeof window === 'undefined') return null;

  try {
    const value = window.localStorage.getItem(storageKey(kind, id));
    return value ? JSON.parse(value) as GuestCommsEditValue : null;
  } catch {
    return null;
  }
}

export function saveGuestCommsEdit(
  kind: GuestCommsRecordKind,
  id: number,
  value: GuestCommsEditValue,
) {
  window.localStorage.setItem(storageKey(kind, id), JSON.stringify(value));
}
