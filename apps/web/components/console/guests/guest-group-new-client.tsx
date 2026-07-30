'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Search } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import { INITIAL_GUESTS, type Guest, type StayStatus } from './guest-data';
import { GUEST_GROUP_RECORDS, type GuestGroupRecord } from './guest-group-data';

type StayFilter = 'all' | StayStatus;

function dateKey(value: string) {
  const [day = '', month = '', year = ''] = value.split('.');
  return `${year}${month.padStart(2, '0')}${day.padStart(2, '0')}`;
}

function inputDateKey(value: string) {
  return value.replaceAll('-', '');
}

function StayBadge({ guest, lang }: { guest: Guest; lang: Lang }) {
  const inHouse = guest.status === 'inhouse';
  return (
    <span className={`badge ${inHouse ? 'badge--ok' : 'badge--mute'}`}>
      {inHouse ? <span className="ico-dot" /> : null}
      {inHouse ? L(['Otelde', 'In-House'], lang) : L(['Çıkış Yaptı', 'Checked Out'], lang)}
    </span>
  );
}

export function GuestGroupNewClient({
  hotelId,
  lang,
  group,
}: {
  hotelId: string;
  lang: Lang;
  group?: GuestGroupRecord;
}) {
  const router = useRouter();
  const groupsUrl = `/h/${hotelId}/guests/groups`;
  const [name, setName] = useState(() => (group ? L(group.name, lang) : ''));
  const [stayFilter, setStayFilter] = useState<StayFilter>('all');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [checkinFrom, setCheckinFrom] = useState('');
  const [checkinTo, setCheckinTo] = useState('');
  const [selected, setSelected] = useState<Set<number>>(() => new Set(group?.guestIds ?? []));
  const [error, setError] = useState('');

  const visibleGuests = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US');
    const from = inputDateKey(checkinFrom);
    const to = inputDateKey(checkinTo);

    return INITIAL_GUESTS.filter((guest) => {
      if (stayFilter !== 'all' && guest.status !== stayFilter) return false;
      if (onlineOnly && guest.connection !== 'online') return false;

      const guestCheckin = dateKey(guest.checkin);
      if (from && guestCheckin < from) return false;
      if (to && guestCheckin > to) return false;

      if (!query) return true;
      return [guest.name, guest.room, guest.email].some((value) =>
        value.toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US').includes(query),
      );
    });
  }, [checkinFrom, checkinTo, lang, onlineOnly, search, stayFilter]);

  function toggleGuest(id: number) {
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function selectVisible() {
    setSelected((current) => {
      const next = new Set(current);
      visibleGuests.forEach((guest) => next.add(guest.id));
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError(L(['Grup adı zorunludur.', 'Group name is required.'], lang));
      return;
    }

    if (group) {
      group.name = [trimmedName, trimmedName];
      group.guestIds = Array.from(selected);
      router.push(`${groupsUrl}/${group.id}`);
      return;
    }

    const nextId = Math.max(0, ...GUEST_GROUP_RECORDS.map((item) => item.id)) + 1;
    GUEST_GROUP_RECORDS.unshift({
      id: nextId,
      name: [trimmedName, trimmedName],
      color: '#0E7490',
      guestIds: Array.from(selected),
    });
    router.push(groupsUrl);
  }

  return (
    <form className="guests-page guest-group-new-page" onSubmit={submit}>
      <div className="page-hero guests-hero guest-group-new-hero">
        <div>
          <h1 className="page-hero__h">
            {group ? L(['Grubu Düzenle', 'Edit Group'], lang) : L(['Yeni Grup', 'New Group'], lang)}
          </h1>
          <p className="page-hero__sub">
            {L(
              [
                group
                  ? 'Grup adını ve seçili misafirleri güncelleyin.'
                  : 'Gruba bir ad verin ve misafirlerini seçin.',
                group
                  ? 'Update the group name and selected guests.'
                  : 'Name the group and select its guests.',
              ],
              lang,
            )}
          </p>
        </div>
        <div className="page-hero__actions">
          <button className="btn btn--ghost" type="button" onClick={() => router.push(groupsUrl)}>
            {L(['İptal', 'Cancel'], lang)}
          </button>
        </div>
      </div>

      <section className="card guests-card guest-group-name-card">
        <div className="card__body">
          <label className="flabel" htmlFor="guest-group-name">
            {L(['Grup Adı', 'Group Name'], lang)}
          </label>
          <input
            className={`finput guest-group-name-input${error ? 'is-error' : ''}`}
            id="guest-group-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (error) setError('');
            }}
            placeholder={L(['örn. VIP Misafirler', 'e.g. VIP Guests'], lang)}
            autoFocus
          />
          {error ? (
            <p className="guest-group-field-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </section>

      <section className="card guests-card guest-group-selection-card">
        <div className="card__head guest-group-selection-head">
          <div>
            <h2 className="card__title">{L(['Misafir Seçimi', 'Guest Selection'], lang)}</h2>
            <p className="card__sub">
              {visibleGuests.length} {L(['sonuç', 'results'], lang)} ·{' '}
              {L(['seçili', 'selected'], lang)}: {selected.size}
            </p>
          </div>
          <div className="guest-group-selection-actions">
            <button className="btn btn--ghost" type="button" onClick={selectVisible}>
              {L(['Görünenleri Seç', 'Select Visible'], lang)}
            </button>
            <button className="btn btn--ghost" type="button" onClick={() => setSelected(new Set())}>
              {L(['Temizle', 'Clear'], lang)}
            </button>
          </div>
        </div>

        <div className="card__body guest-group-selection-body">
          <div className="guest-group-filter-row">
            <div
              className="guests-chips"
              role="group"
              aria-label={L(['Konaklama durumu', 'Stay status'], lang)}
            >
              {(
                [
                  ['all', L(['Tümü', 'All'], lang)],
                  ['inhouse', L(['Aktif (Otelde)', 'Active (In-house)'], lang)],
                  ['checked-out', L(['Çıkış Yaptı', 'Checked Out'], lang)],
                ] as const
              ).map(([value, label]) => (
                <button
                  className={`guests-chip${stayFilter === value ? 'active' : ''}`}
                  type="button"
                  key={value}
                  onClick={() => setStayFilter(value)}
                >
                  {label}
                </button>
              ))}
              <button
                className={`guests-chip${onlineOnly ? 'active' : ''}`}
                type="button"
                onClick={() => setOnlineOnly((current) => !current)}
                aria-pressed={onlineOnly}
              >
                {L(['Bağlı (Çevrimiçi)', 'Connected (Online)'], lang)}
              </button>
            </div>

            <label className="searchmini guests-search guest-group-search">
              <Search aria-hidden="true" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={L(
                  ['İsim, oda veya e-posta ara...', 'Search name, room, or email...'],
                  lang,
                )}
                aria-label={L(['Misafir ara', 'Search guests'], lang)}
              />
            </label>
          </div>

          <div className="guest-group-date-grid">
            <label>
              <span className="flabel">{L(['Giriş Başlangıcı', 'Check-in From'], lang)}</span>
              <input
                className="finput"
                type="date"
                value={checkinFrom}
                onChange={(event) => setCheckinFrom(event.target.value)}
              />
            </label>
            <label>
              <span className="flabel">{L(['Giriş Bitişi', 'Check-in To'], lang)}</span>
              <input
                className="finput"
                type="date"
                value={checkinTo}
                onChange={(event) => setCheckinTo(event.target.value)}
              />
            </label>
          </div>

          <div className="guest-group-picklist">
            {visibleGuests.length ? (
              visibleGuests.map((guest) => (
                <label className="guest-group-pickrow" key={guest.id}>
                  <span className="set-mem">
                    <span className="set-mem__av" style={{ background: guest.color }}>
                      {guest.initials}
                    </span>
                    <span>
                      <span className="set-mem__n">{guest.name}</span>
                      <span className="guest-group-pickrow__meta">
                        {L(['Oda', 'Room'], lang)} {guest.room} ·{' '}
                        <StayBadge guest={guest} lang={lang} />
                        <span
                          className={`badge ${guest.connection === 'online' ? 'badge--ok' : 'badge--mute'}`}
                        >
                          {guest.connection === 'online' ? <span className="ico-dot" /> : null}
                          {guest.connection === 'online'
                            ? L(['Çevrimiçi', 'Online'], lang)
                            : L(['Çevrimdışı', 'Offline'], lang)}
                        </span>
                      </span>
                    </span>
                  </span>
                  <span
                    className={`guest-group-check${selected.has(guest.id) ? 'is-checked' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(guest.id)}
                      onChange={() => toggleGuest(guest.id)}
                    />
                    {selected.has(guest.id) ? <Check aria-hidden="true" /> : null}
                  </span>
                </label>
              ))
            ) : (
              <div className="guest-group-empty">
                {L(
                  ['Bu filtrelerle eşleşen misafir bulunamadı.', 'No guests match these filters.'],
                  lang,
                )}
              </div>
            )}
          </div>
        </div>

        <div className="guest-group-new-footer">
          <button className="btn btn--ghost" type="button" onClick={() => router.push(groupsUrl)}>
            {L(['İptal', 'Cancel'], lang)}
          </button>
          <button className="btn btn--primary" type="submit">
            <Check />
            {group
              ? L(['Değişiklikleri Kaydet', 'Save Changes'], lang)
              : L(['Grup Oluştur', 'Create Group'], lang)}
          </button>
        </div>
      </section>
    </form>
  );
}
