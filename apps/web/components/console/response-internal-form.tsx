'use client';

import { Check, Plus, Zap } from 'lucide-react';
import { useLang } from '@/components/console/lang-provider';
import { L } from '@/lib/i18n';
import { GAvatar } from '@/components/console/survey-helpers';
import { SubmitButton } from '@/components/console/submit-button';
import { updateResponseInternalAction } from '@/app/(hotel)/h/[hotelId]/surveys/actions';

type Note = { who: string; when: string; body: string };
type ResponseStatus = 'new' | 'reviewed' | 'flagged';

/** Editable "Internal Actions" panel — status, assignee, notes → server action. */
export function ResponseInternalForm({
  hotelId,
  respId,
  status,
  assigneeName,
  notes,
}: {
  hotelId: string;
  respId: string;
  status: ResponseStatus;
  assigneeName: string | null;
  notes: Note[];
}) {
  const lang = useLang();
  const action = updateResponseInternalAction.bind(null, hotelId, respId);

  return (
    <form className="card" style={{ padding: 0 }} action={action}>
      <div className="ipanel__sec">
        <div className="card__title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Zap size={16} />{L(['Dahili İşlemler', 'Internal Actions'], lang)}</div>
      </div>

      <div className="ipanel__sec">
        <div className="ipanel__l">{L(['Durum', 'Status'], lang)}</div>
        <select className="finput" name="status" defaultValue={status} style={{ height: 40 }}>
          <option value="new">{L(['Yeni', 'New'], lang)}</option>
          <option value="reviewed">{L(['İncelendi', 'Reviewed'], lang)}</option>
          <option value="flagged">{L(['İşaretlendi', 'Flagged'], lang)}</option>
        </select>
      </div>

      <div className="ipanel__sec">
        <div className="ipanel__l">{L(['Otomatik Etiketler (NLP)', 'Automated Tags (NLP)'], lang)}</div>
        <div className="tagrow">
          <span className="nlptag" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}><span className="ico-dot" style={{ background: 'var(--success)' }} />{L(['Olumlu Duygu', 'Positive Sentiment'], lang)}</span>
          <span className="nlptag" style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}><Plus size={13} /></span>
        </div>
        <div className="cell-sub" style={{ marginTop: 6, fontStyle: 'italic' }}>{L(['NLP analizi yakında.', 'NLP analysis coming soon.'], lang)}</div>
      </div>

      <div className="ipanel__sec">
        <div className="ipanel__l">{L(['Atanan Kişi', 'Assigned To'], lang)}</div>
        {assigneeName ? (
          <div className="assignee" style={{ marginBottom: 8 }}>
            <GAvatar name={assigneeName} />
            <div><div style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{assigneeName}</div></div>
          </div>
        ) : null}
        <input className="finput" name="assigneeName" defaultValue={assigneeName ?? ''} placeholder={L(['İsim ata…', 'Assign a name…'], lang)} style={{ height: 40 }} />
      </div>

      <div className="ipanel__sec">
        <div className="ipanel__l">{L(['Dahili Notlar', 'Internal Notes'], lang)}</div>
        <textarea className="noteinput" name="newNote" placeholder={L(['Bu yanıt hakkında not ekleyin…', 'Add a note about this response…'], lang)} />
        {notes.map((n, i) => (
          <div className="note" key={i}>
            <div className="note__head"><span className="note__who">{n.who}</span><span className="note__when">{n.when}</span></div>
            <div className="note__body">{n.body}</div>
          </div>
        ))}
        <SubmitButton className="btn btn--primary" style={{ width: '100%', justifyContent: 'center', marginTop: 13 }}><Check size={16} />{L(['Değişiklikleri Kaydet', 'Save Changes'], lang)}</SubmitButton>
      </div>
    </form>
  );
}
