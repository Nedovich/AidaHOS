'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Send, Undo2 } from 'lucide-react';
import { useLang } from '@/components/console/lang-provider';
import { L } from '@/lib/i18n';
import { SubmitButton } from '@/components/console/submit-button';

/**
 * Publish ⇄ Unpublish toggle for the survey publish step. Renders inside the publish
 * `<form>`, so the confirm button (a submit carrying `_publish`) drives the same action
 * that also saves the access controls. A confirmation modal guards both directions.
 */
export function PublishToggle({ published }: { published: boolean }) {
  const lang = useLang();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button type="button" className={`btn ${published ? 'btn--ghost-danger' : 'btn--primary'}`} onClick={() => setOpen(true)}>
        {published ? <Undo2 size={16} /> : <Send size={16} />} {published ? L(['Yayından Kaldır', 'Unpublish'], lang) : L(['Yayınla', 'Publish'], lang)}
      </button>

      {open && (
        <div className="modal-overlay" onMouseDown={() => setOpen(false)}>
          <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal>
            <div className="modal__head">
              <div className="modal__ico" style={{ background: published ? 'var(--danger-soft)' : 'var(--accent-soft)', color: published ? 'var(--danger)' : 'var(--accent)' }}>
                {published ? <AlertTriangle size={20} /> : <Send size={18} />}
              </div>
              <div>
                <div className="modal__title">{published ? L(['Yayından kaldır', 'Unpublish survey'], lang) : L(['Anketi yayınla', 'Publish survey'], lang)}</div>
                <div className="modal__sub">
                  {published
                    ? L(['Yayından kaldırılınca public link ve QR kod çalışmayı durdurur; misafirler ankete erişemez.', 'Once unpublished, the public link and QR code stop working and guests can no longer access the survey.'], lang)
                    : L(['Yayınlandığında public link ve QR kod aktif olur; varsayılan olarak ayarlandıysa captive giriş sonrası misafirlere gösterilir.', 'Once published, the public link and QR code become active; if set as default, guests see it after captive login.'], lang)}
                </div>
              </div>
            </div>
            <div className="modal__foot">
              <button type="button" className="btn btn--ghost" onClick={() => setOpen(false)}>{L(['Vazgeç', 'Cancel'], lang)}</button>
              <SubmitButton className={`btn ${published ? 'btn--danger' : 'btn--primary'}`} name="_publish" value={published ? 'unpublish' : 'publish'}>
                {published ? <Undo2 size={15} /> : <Send size={15} />} {published ? L(['Yayından kaldır', 'Unpublish'], lang) : L(['Yayınla', 'Publish'], lang)}
              </SubmitButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
