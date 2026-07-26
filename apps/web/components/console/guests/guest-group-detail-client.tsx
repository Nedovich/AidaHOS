'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Check,
  Send,
  Trash2,
  UserMinus,
  UsersRound,
  X,
} from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';
import { INITIAL_GUESTS, type Guest } from './guest-data';
import {
  getGuestGroupMembers,
  type GuestGroupRecord,
} from './guest-group-data';

function GuestStatus({ guest, lang }: { guest: Guest; lang: Lang }) {
  const inHouse = guest.status === 'inhouse';
  return (
    <span className={`badge ${inHouse ? 'badge--ok' : 'badge--mute'}`}>
      {inHouse
        ? L(['Otelde', 'In-House'], lang)
        : L(['Check-out Yaptı', 'Checked Out'], lang)}
    </span>
  );
}

function MemberEditor({
  groupName,
  selectedIds,
  lang,
  onClose,
  onSave,
}: {
  groupName: string;
  selectedIds: number[];
  lang: Lang;
  onClose: () => void;
  onSave: (ids: number[]) => void;
}) {
  const [draft, setDraft] = useState(() => new Set(selectedIds));

  const toggle = (guestId: number) => {
    setDraft((current) => {
      const next = new Set(current);
      if (next.has(guestId)) next.delete(guestId);
      else next.add(guestId);
      return next;
    });
  };

  return (
    <div className="guest-group-modal-overlay" role="presentation" onMouseDown={onClose}>
      <section
        className="guest-group-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-group-editor-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="guest-group-modal__head">
          <div>
            <h2 id="guest-group-editor-title">{L(['Üyeleri Düzenle', 'Edit Members'], lang)}</h2>
            <p>{groupName}</p>
          </div>
          <button type="button" className="guest-group-modal__close" onClick={onClose} aria-label={L(['Kapat', 'Close'], lang)}>
            <X />
          </button>
        </div>
        <div className="guest-group-member-picker">
          {INITIAL_GUESTS.map((guest) => (
            <label className="guest-group-member-option" key={guest.id}>
              <span className="set-mem">
                <span className="set-mem__av" style={{ background: guest.color }}>{guest.initials}</span>
                <span>
                  <strong className="set-mem__n">{guest.name}</strong>
                  <small className="cell-sub">{L(['Oda', 'Room'], lang)} {guest.room}</small>
                </span>
              </span>
              <input
                type="checkbox"
                checked={draft.has(guest.id)}
                onChange={() => toggle(guest.id)}
              />
            </label>
          ))}
        </div>
        <div className="guest-group-modal__foot">
          <span>{draft.size} {L(['misafir seçili', 'guests selected'], lang)}</span>
          <div>
            <button className="btn btn--ghost" type="button" onClick={onClose}>
              {L(['Vazgeç', 'Cancel'], lang)}
            </button>
            <button className="btn btn--primary" type="button" onClick={() => onSave(Array.from(draft))}>
              <Check />{L(['Kaydet', 'Save'], lang)}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function GuestGroupDetailClient({
  group,
  hotelId,
  lang,
}: {
  group: GuestGroupRecord;
  hotelId: string;
  lang: Lang;
}) {
  const router = useRouter();
  const [memberIds, setMemberIds] = useState(group.guestIds);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState('');

  const members = useMemo(
    () => getGuestGroupMembers({ ...group, guestIds: memberIds }),
    [group, memberIds],
  );

  const saveMembers = (ids: number[]) => {
    setMemberIds(ids);
    setEditing(false);
    setNotice(L(['Grup üyeleri güncellendi.', 'Group members updated.'], lang));
  };

  const removeMember = (guestId: number) => {
    setMemberIds((current) => current.filter((id) => id !== guestId));
  };

  return (
    <div className="guests-page guest-group-detail-page">
      <div className="guest-detail-breadcrumb">
        <Link href={`/h/${hotelId}/guests/groups`}>{L(['Gruplar', 'Groups'], lang)}</Link>
        <span>›</span>
        <strong>{L(group.name, lang)}</strong>
      </div>

      <div className="page-hero guests-hero guest-group-detail-hero">
        <div className="guest-group-detail-title">
          <Link
            className="guest-email-detail-back"
            href={`/h/${hotelId}/guests/groups`}
            aria-label={L(['Gruplara dön', 'Back to groups'], lang)}
          >
            <ChevronLeft />
          </Link>
          <span className="guest-group-detail-icon" style={{ background: group.color }}>
            <UsersRound />
          </span>
          <div>
            <h1 className="page-hero__h">{L(group.name, lang)}</h1>
            <p className="page-hero__sub">
              {members.length} {L(['misafir', 'guests'], lang)}
            </p>
          </div>
        </div>
        <div className="page-hero__actions guest-group-detail-actions">
          <button className="btn btn--ghost" type="button" onClick={() => setEditing(true)}>
            <UsersRound />{L(['Üyeleri Düzenle', 'Edit Members'], lang)}
          </button>
          <button
            className="btn btn--ghost"
            type="button"
            disabled
            title={L(['Toplu mesaj gönderimi yakında', 'Bulk messaging coming soon'], lang)}
          >
            <Send />{L(['Toplu Mesaj (Yakında)', 'Bulk Message (Soon)'], lang)}
          </button>
          <button
            className="btn btn--dangerghost"
            type="button"
            onClick={() => router.push(`/h/${hotelId}/guests/groups`)}
          >
            <Trash2 />{L(['Grubu Sil', 'Delete Group'], lang)}
          </button>
        </div>
      </div>

      {notice ? (
        <div className="guests-notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} aria-label={L(['Bildirimi kapat', 'Dismiss notification'], lang)}>×</button>
        </div>
      ) : null}

      <section className="card guests-card guest-group-members-card">
        <div className="card__head">
          <div>
            <h2 className="card__title">{L(['Üyeler', 'Members'], lang)}</h2>
            <p className="card__sub">{members.length} {L(['misafir', 'guests'], lang)}</p>
          </div>
        </div>
        <div className="card__body guests-table-wrap">
          <table className="table guest-group-members-table">
            <thead>
              <tr>
                <th>{L(['Misafir', 'Guest'], lang)}</th>
                <th>{L(['Oda', 'Room'], lang)}</th>
                <th>{L(['Durum', 'Status'], lang)}</th>
                <th aria-label={L(['İşlemler', 'Actions'], lang)} />
              </tr>
            </thead>
            <tbody>
              {members.map((guest) => (
                <tr key={guest.id}>
                  <td>
                    <Link className="set-mem guest-group-member-link" href={`/h/${hotelId}/guests/${guest.id}`}>
                      <span className="set-mem__av" style={{ background: guest.color }}>{guest.initials}</span>
                      <span>
                        <strong className="set-mem__n">{guest.name}</strong>
                        <small className="cell-sub">{guest.email}</small>
                      </span>
                    </Link>
                  </td>
                  <td className="cell-sub">{guest.room}</td>
                  <td><GuestStatus guest={guest} lang={lang} /></td>
                  <td className="guest-group-member-action">
                    <button className="btn btn--sm btn--ghost" type="button" onClick={() => removeMember(guest.id)}>
                      <UserMinus />{L(['Kaldır', 'Remove'], lang)}
                    </button>
                  </td>
                </tr>
              ))}
              {!members.length ? (
                <tr>
                  <td className="guests-empty" colSpan={4}>
                    {L(['Bu grupta misafir yok.', 'No guests in this group.'], lang)}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {editing ? (
        <MemberEditor
          groupName={L(group.name, lang)}
          selectedIds={memberIds}
          lang={lang}
          onClose={() => setEditing(false)}
          onSave={saveMembers}
        />
      ) : null}
    </div>
  );
}
