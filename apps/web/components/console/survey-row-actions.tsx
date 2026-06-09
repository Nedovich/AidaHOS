'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Eye, MoreHorizontal, Send, Trash2 } from 'lucide-react';
import { useLang } from '@/components/console/lang-provider';
import { L } from '@/lib/i18n';
import { DeleteSurveyDialog } from '@/components/console/delete-survey-dialog';

/** Forms-list row actions: view / publish + a 3-dot menu with Delete. */
export function SurveyRowActions({
  hotelId,
  surveyId,
  surveyName,
  base,
}: {
  hotelId: string;
  surveyId: string;
  surveyName: string;
  base: string;
}) {
  const lang = useLang();
  const [menu, setMenu] = useState(false);
  const [del, setDel] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menu]);

  return (
    <>
      <div className="rowact">
        <Link href={`${base}/${surveyId}`} title={L(['Görüntüle', 'View'], lang)}><Eye size={15} /></Link>
        <Link href={`${base}/${surveyId}/edit/publish`} title={L(['Yayınla', 'Publish'], lang)}><Send size={15} /></Link>
        <div className="rowmenu" ref={ref}>
          <button type="button" title={L(['Diğer', 'More'], lang)} onClick={() => setMenu((m) => !m)} aria-haspopup aria-expanded={menu}>
            <MoreHorizontal size={15} />
          </button>
          {menu && (
            <div className="rowmenu__pop">
              <button className="rowmenu__item danger" type="button" onClick={() => { setMenu(false); setDel(true); }}>
                <Trash2 size={15} /> {L(['Sil', 'Delete'], lang)}
              </button>
            </div>
          )}
        </div>
      </div>
      {del && <DeleteSurveyDialog hotelId={hotelId} surveyId={surveyId} surveyName={surveyName} onClose={() => setDel(false)} />}
    </>
  );
}
