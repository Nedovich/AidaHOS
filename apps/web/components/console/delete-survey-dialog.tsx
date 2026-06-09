'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useLang } from '@/components/console/lang-provider';
import { L } from '@/lib/i18n';
import { SubmitButton } from '@/components/console/submit-button';
import { deleteSurveyAction } from '@/app/(hotel)/h/[hotelId]/surveys/actions';

/** Confirm-to-delete dialog: requires typing DELETE before the destructive action arms. */
export function DeleteSurveyDialog({
  hotelId,
  surveyId,
  surveyName,
  onClose,
}: {
  hotelId: string;
  surveyId: string;
  surveyName: string;
  onClose: () => void;
}) {
  const lang = useLang();
  const [val, setVal] = useState('');
  const armed = val.trim().toUpperCase() === 'DELETE';
  const action = deleteSurveyAction.bind(null, hotelId, surveyId);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="modal__head">
          <div className="modal__ico"><AlertTriangle size={20} /></div>
          <div>
            <div className="modal__title">{L(['Anketi sil', 'Delete survey'], lang)}</div>
            <div className="modal__sub">
              {L(
                [`“${surveyName}” ve tüm yanıtları kalıcı olarak silinecek. Bu işlem geri alınamaz.`, `“${surveyName}” and all of its responses will be permanently deleted. This action cannot be undone.`],
                lang,
              )}
            </div>
          </div>
        </div>
        <div className="modal__body">
          <label className="flabel" style={{ marginBottom: 6, display: 'block' }}>
            {L(['Onaylamak için ', 'Type '], lang)}
            <b style={{ color: 'var(--danger)' }}>DELETE</b>
            {L([' yazın', ' to confirm'], lang)}
          </label>
          <input
            className="finput"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="DELETE"
            autoFocus
            autoComplete="off"
            spellCheck={false}
          />
        </div>
        <div className="modal__foot">
          <button type="button" className="btn btn--ghost" onClick={onClose}>{L(['Vazgeç', 'Cancel'], lang)}</button>
          <form action={action}>
            <SubmitButton className="btn btn--danger" disabled={!armed}>
              <Trash2 size={15} /> {L(['Anketi sil', 'Delete survey'], lang)}
            </SubmitButton>
          </form>
        </div>
      </div>
    </div>
  );
}
