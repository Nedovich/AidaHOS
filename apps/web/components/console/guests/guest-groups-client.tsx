'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, Grid2X2, Pencil, Plus, Rows3, Search, Trash2, UsersRound } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import {
  GUEST_GROUP_RECORDS,
  getGuestGroupMembers,
  type GuestGroupRecord,
} from './guest-group-data';

type GroupFilter = 'all' | 'has' | 'empty';
type GroupView = 'cards' | 'list';

function AvatarStack({
  members,
  limit = 5,
}: {
  members: ReturnType<typeof getGuestGroupMembers>;
  limit?: number;
}) {
  const shown = members.slice(0, limit);
  const extra = members.length - shown.length;

  return (
    <div className="guest-group-avatars" aria-label={`${members.length} members`}>
      {shown.map((guest) => (
        <span className="set-mem__av" style={{ background: guest.color }} key={guest.id}>
          {guest.initials}
        </span>
      ))}
      {extra > 0 ? <span className="set-mem__av is-extra">+{extra}</span> : null}
    </div>
  );
}

function GroupActions({
  group,
  hotelId,
  lang,
  onDelete,
}: {
  group: GuestGroupRecord;
  hotelId: string;
  lang: Lang;
  onDelete: (group: GuestGroupRecord) => void;
}) {
  const router = useRouter();
  const baseUrl = `/h/${hotelId}/guests/groups/${group.id}`;

  return (
    <div
      className="rowact guest-group-actions"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        title={L(['Detay', 'View'], lang)}
        aria-label={L(['Grubu görüntüle', 'View group'], lang)}
        onClick={() => router.push(baseUrl)}
      >
        <Eye />
      </button>
      <button
        type="button"
        title={L(['Düzenle', 'Edit'], lang)}
        aria-label={L(['Grubu düzenle', 'Edit group'], lang)}
        onClick={() => router.push(`${baseUrl}/edit`)}
      >
        <Pencil />
      </button>
      <button
        type="button"
        title={L(['Sil', 'Delete'], lang)}
        aria-label={L(['Grubu sil', 'Delete group'], lang)}
        onClick={() => onDelete(group)}
      >
        <Trash2 />
      </button>
    </div>
  );
}

export function GuestGroupsClient({ hotelId, lang }: { hotelId: string; lang: Lang }) {
  const router = useRouter();
  const [groups, setGroups] = useState<GuestGroupRecord[]>(() => [...GUEST_GROUP_RECORDS]);
  const [filter, setFilter] = useState<GroupFilter>('all');
  const [search, setSearch] = useState('');
  const [view, setView] = useState<GroupView>('cards');

  useEffect(() => {
    const savedView = window.localStorage.getItem('groups-view');
    if (savedView === 'cards' || savedView === 'list') setView(savedView);
  }, []);

  const filteredGroups = useMemo(() => {
    const query = search.trim().toLocaleLowerCase(lang === 'tr' ? 'tr-TR' : 'en-US');

    return groups.filter((group) => {
      const memberCount = getGuestGroupMembers(group).length;
      if (filter === 'has' && memberCount === 0) return false;
      if (filter === 'empty' && memberCount > 0) return false;
      return !query || L(group.name, lang).toLocaleLowerCase().includes(query);
    });
  }, [filter, groups, lang, search]);

  function setPreferredView(nextView: GroupView) {
    setView(nextView);
    window.localStorage.setItem('groups-view', nextView);
  }

  function deleteGroup(group: GuestGroupRecord) {
    const confirmed = window.confirm(
      L(
        [
          `"${L(group.name, lang)}" grubunu silmek istediğinize emin misiniz?`,
          `Delete the group "${L(group.name, lang)}"?`,
        ],
        lang,
      ),
    );
    if (!confirmed) return;

    const index = GUEST_GROUP_RECORDS.findIndex((item) => item.id === group.id);
    if (index >= 0) GUEST_GROUP_RECORDS.splice(index, 1);
    setGroups((current) => current.filter((item) => item.id !== group.id));
  }

  function openGroup(groupId: number) {
    router.push(`/h/${hotelId}/guests/groups/${groupId}`);
  }

  return (
    <div className="guests-page guest-groups-page">
      <div className="page-hero guests-hero">
        <div>
          <h1 className="page-hero__h">{L(['Gruplar', 'Groups'], lang)}</h1>
          <p className="page-hero__sub">
            {L(
              [
                'Misafirleri gruplandırın; ileride bu gruplara toplu mesaj gönderebilirsiniz.',
                'Group guests together — bulk messaging to groups is coming soon.',
              ],
              lang,
            )}
          </p>
        </div>
        <div className="page-hero__actions">
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => router.push(`/h/${hotelId}/guests/groups/new`)}
          >
            <Plus />
            {L(['Yeni Grup', 'New Group'], lang)}
          </button>
        </div>
      </div>

      <div className="guest-groups-toolbar">
        <div
          className="guests-chips"
          role="group"
          aria-label={L(['Grup filtresi', 'Group filter'], lang)}
        >
          <button
            className={`guests-chip${filter === 'all' ? 'active' : ''}`}
            type="button"
            onClick={() => setFilter('all')}
          >
            {L(['Tümü', 'All'], lang)}
            <span>{groups.length}</span>
          </button>
          <button
            className={`guests-chip${filter === 'has' ? 'active' : ''}`}
            type="button"
            onClick={() => setFilter('has')}
          >
            {L(['Dolu', 'Has Guests'], lang)}
          </button>
          <button
            className={`guests-chip${filter === 'empty' ? 'active' : ''}`}
            type="button"
            onClick={() => setFilter('empty')}
          >
            {L(['Boş', 'Empty'], lang)}
          </button>
        </div>

        <div className="guest-groups-tools">
          <label className="searchmini guests-search guest-groups-search">
            <Search aria-hidden="true" />
            <input
              id="groupsSearchInput"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={L(['Grup ara…', 'Search groups…'], lang)}
              aria-label={L(['Grup ara', 'Search groups'], lang)}
            />
          </label>
          <div className="view-toggle" role="group" aria-label={L(['Görünüm', 'View'], lang)}>
            <button
              className={view === 'cards' ? 'on' : ''}
              type="button"
              onClick={() => setPreferredView('cards')}
              aria-pressed={view === 'cards'}
            >
              <Grid2X2 />
              {L(['Kart', 'Cards'], lang)}
            </button>
            <button
              className={view === 'list' ? 'on' : ''}
              type="button"
              onClick={() => setPreferredView('list')}
              aria-pressed={view === 'list'}
            >
              <Rows3 />
              {L(['Liste', 'List'], lang)}
            </button>
          </div>
        </div>
      </div>

      {view === 'cards' ? (
        filteredGroups.length ? (
          <div className="grid--3 guest-groups-grid grid">
            {filteredGroups.map((group) => {
              const members = getGuestGroupMembers(group);
              return (
                <article
                  className="card guest-group-card"
                  key={group.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => openGroup(group.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openGroup(group.id);
                    }
                  }}
                >
                  <div className="card__body">
                    <div className="guest-group-card__head">
                      <span className="guest-group-card__icon" style={{ background: group.color }}>
                        <UsersRound />
                      </span>
                      <span>
                        <strong className="card__title">{L(group.name, lang)}</strong>
                        <small className="card__sub">
                          {members.length} {L(['misafir', 'guests'], lang)}
                        </small>
                      </span>
                    </div>
                    {members.length ? (
                      <AvatarStack members={members} />
                    ) : (
                      <span className="cell-sub guest-group-no-members">
                        {L(['Henüz misafir yok', 'No guests yet'], lang)}
                      </span>
                    )}
                  </div>
                  <GroupActions
                    group={group}
                    hotelId={hotelId}
                    lang={lang}
                    onDelete={deleteGroup}
                  />
                </article>
              );
            })}
          </div>
        ) : (
          <div className="guest-groups-empty">
            {L(['Eşleşen grup yok.', 'No groups match.'], lang)}
          </div>
        )
      ) : (
        <section className="card guest-groups-list-card">
          <div className="card__body">
            <div className="guest-groups-list-scroll">
              <table className="guest-groups-table table">
                <thead>
                  <tr>
                    <th>{L(['Grup', 'Group'], lang)}</th>
                    <th>{L(['Üyeler', 'Members'], lang)}</th>
                    <th>{L(['Üye Sayısı', 'Member Count'], lang)}</th>
                    <th>{L(['Eylemler', 'Actions'], lang)}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGroups.length ? (
                    filteredGroups.map((group) => {
                      const members = getGuestGroupMembers(group);
                      return (
                        <tr
                          className="guests-row-link"
                          key={group.id}
                          tabIndex={0}
                          onClick={() => openGroup(group.id)}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              openGroup(group.id);
                            }
                          }}
                        >
                          <td>
                            <span className="set-mem">
                              <span
                                className="set-mem__av guest-group-table-icon"
                                style={{ background: group.color }}
                              >
                                <UsersRound />
                              </span>
                              <span className="set-mem__n">{L(group.name, lang)}</span>
                            </span>
                          </td>
                          <td>
                            {members.length ? (
                              <AvatarStack members={members} limit={4} />
                            ) : (
                              <span className="cell-sub">{L(['Yok', 'None'], lang)}</span>
                            )}
                          </td>
                          <td className="cell-sub">{members.length}</td>
                          <td>
                            <GroupActions
                              group={group}
                              hotelId={hotelId}
                              lang={lang}
                              onDelete={deleteGroup}
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td className="guest-groups-table-empty" colSpan={4}>
                        {L(['Eşleşen grup yok.', 'No groups match.'], lang)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
