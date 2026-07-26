'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, UsersRound } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import {
  GUEST_GROUP_RECORDS,
  getGuestGroupMembers,
} from './guest-group-data';

function AvatarStack({
  members,
}: {
  members: ReturnType<typeof getGuestGroupMembers>;
}) {
  const shown = members.slice(0, 5);
  const extra = members.length - shown.length;

  return (
    <div className="guest-group-avatars" aria-label={`${members.length} members`}>
      {shown.map((guest) => (
        <span
          className="set-mem__av"
          style={{ background: guest.color }}
          key={guest.id}
        >
          {guest.initials}
        </span>
      ))}
      {extra > 0 ? <span className="set-mem__av is-extra">+{extra}</span> : null}
    </div>
  );
}

export function GuestGroupsClient({
  hotelId,
  lang,
}: {
  hotelId: string;
  lang: Lang;
}) {
  const router = useRouter();
  const [notice, setNotice] = useState('');

  return (
    <div className="guests-page guest-groups-page">
      <div className="page-hero guests-hero">
        <div>
          <h1 className="page-hero__h">{L(['Gruplar', 'Groups'], lang)}</h1>
          <p className="page-hero__sub">
            {L([
              'Misafirleri gruplandırın; ileride bu gruplara toplu mesaj gönderebilirsiniz.',
              'Group guests together — bulk messaging to groups is coming soon.',
            ], lang)}
          </p>
        </div>
        <div className="page-hero__actions">
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => setNotice(L([
              'Yeni grup oluşturma ekranı bir sonraki adımda eklenecek.',
              'The new group screen will be added in the next step.',
            ], lang))}
          >
            <Plus />{L(['Yeni Grup', 'New Group'], lang)}
          </button>
        </div>
      </div>

      {notice ? (
        <div className="guests-notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label={L(['Bildirimi kapat', 'Dismiss notification'], lang)}>×</button>
        </div>
      ) : null}

      <div className="grid grid--3 guest-groups-grid">
        {GUEST_GROUP_RECORDS.map((group) => {
          const members = getGuestGroupMembers(group);
          return (
            <button
              className="card guest-group-card"
              type="button"
              key={group.id}
              onClick={() => router.push(`/h/${hotelId}/guests/groups/${group.id}`)}
            >
              <span className="card__body">
                <span className="guest-group-card__head">
                  <span className="guest-group-card__icon" style={{ background: group.color }}>
                    <UsersRound />
                  </span>
                  <span>
                    <strong className="card__title">{L(group.name, lang)}</strong>
                    <small className="card__sub">
                      {members.length} {L(['misafir', 'guests'], lang)}
                    </small>
                  </span>
                </span>
                <AvatarStack members={members} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
