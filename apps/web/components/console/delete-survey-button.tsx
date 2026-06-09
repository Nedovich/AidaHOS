'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useLang } from '@/components/console/lang-provider';
import { L } from '@/lib/i18n';
import { DeleteSurveyDialog } from '@/components/console/delete-survey-dialog';

/** Danger "Delete" button (survey detail header) that opens the confirm dialog. */
export function DeleteSurveyButton({ hotelId, surveyId, surveyName }: { hotelId: string; surveyId: string; surveyName: string }) {
  const lang = useLang();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="btn btn--ghost-danger" onClick={() => setOpen(true)}>
        <Trash2 size={16} /> {L(['Sil', 'Delete'], lang)}
      </button>
      {open && <DeleteSurveyDialog hotelId={hotelId} surveyId={surveyId} surveyName={surveyName} onClose={() => setOpen(false)} />}
    </>
  );
}
