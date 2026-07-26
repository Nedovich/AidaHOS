'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { Eye, MoreHorizontal, Pencil, Send, ShoppingBag, Star, Trash2 } from 'lucide-react';
import { useLang } from '@/components/console/lang-provider';
import { L } from '@/lib/i18n';
import { DeleteSurveyDialog } from '@/components/console/delete-survey-dialog';

/** Forms-list row actions: view / edit / publish + a 3-dot menu with Make Default and Delete. */
export function SurveyRowActions({
  hotelId,
  surveyId,
  surveyName,
  base,
  isDefault,
  isCheckout,
  onToggleDefault,
  onToggleCheckout,
}: {
  hotelId: string;
  surveyId: string;
  surveyName: string;
  base: string;
  isDefault?: boolean;
  isCheckout?: boolean;
  onToggleDefault?: (makeDefault: boolean) => Promise<void>;
  onToggleCheckout?: (makeCheckout: boolean) => Promise<void>;
}) {
  const lang = useLang();
  const [menu, setMenu] = useState(false);
  const [del, setDel] = useState(false);
  const [pending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenu(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menu]);

  function handleToggleDefault() {
    setMenu(false);
    if (!onToggleDefault) return;
    startTransition(async () => { await onToggleDefault(!isDefault); });
  }

  function handleToggleCheckout() {
    setMenu(false);
    if (!onToggleCheckout) return;
    startTransition(async () => { await onToggleCheckout(!isCheckout); });
  }

  return (
    <>
      <div className="rowact">
        <Link href={`${base}/${surveyId}`} title={L(['Görüntüle', 'View'], lang)}><Eye size={15} /></Link>
        <Link href={`${base}/${surveyId}/edit/builder`} title={L(['Düzenle', 'Edit'], lang)}><Pencil size={15} /></Link>
        <Link href={`${base}/${surveyId}/edit/publish`} title={L(['Yayınla', 'Publish'], lang)}><Send size={15} /></Link>
        <div className="rowmenu" ref={ref}>
          <button type="button" title={L(['Diğer', 'More'], lang)} onClick={() => setMenu((m) => !m)} aria-haspopup aria-expanded={menu}>
            <MoreHorizontal size={15} />
          </button>
          {menu && (
            <div className="rowmenu__pop">
              {onToggleDefault && (
                <button
                  className="rowmenu__item"
                  type="button"
                  disabled={pending}
                  onClick={handleToggleDefault}
                >
                  <Star size={15} fill={isDefault ? 'currentColor' : 'none'} />
                  {isDefault
                    ? L(['Varsayılanı Kaldır', 'Remove Default'], lang)
                    : L(['Varsayılan Yap', 'Make Default'], lang)}
                </button>
              )}
              {onToggleCheckout && (
                <button
                  className="rowmenu__item"
                  type="button"
                  disabled={pending}
                  onClick={handleToggleCheckout}
                >
                  <ShoppingBag size={15} fill={isCheckout ? 'currentColor' : 'none'} />
                  {isCheckout
                    ? L(['Checkout Anketini Kaldır', 'Remove Checkout Survey'], lang)
                    : L(['Checkout Anketi Yap', 'Make Checkout Survey'], lang)}
                </button>
              )}
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
