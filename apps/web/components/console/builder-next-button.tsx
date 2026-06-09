'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useLang } from '@/components/console/lang-provider';
import { L } from '@/lib/i18n';
import { saveSurveyJsonAction } from '@/app/(hotel)/h/[hotelId]/surveys/actions';
import { getBuilderJson } from '@/components/console/survey-builder-bridge';

/**
 * "Next step" for the builder: persists the SurveyJS Creator's current JSON (so the
 * user need not click the in-builder Save icon), then navigates to publish. Drives the
 * global top progress bar like other navigations.
 */
export function BuilderNextButton({ hotelId, surveyId, nextHref }: { hotelId: string; surveyId: string; nextHref: string }) {
  const lang = useLang();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('aida:nav-start'));
    try {
      const json = getBuilderJson(surveyId);
      if (json !== undefined) await saveSurveyJsonAction(hotelId, surveyId, json);
    } catch {
      /* keep navigating even if the save hiccups */
    }
    router.push(nextHref);
  }

  return (
    <button type="button" className="btn btn--primary" onClick={onClick} disabled={busy} aria-busy={busy} style={busy ? { opacity: 0.75, cursor: 'progress' } : undefined}>
      {L(['Sonraki Adım', 'Next step'], lang)} <ChevronRight size={16} />
    </button>
  );
}
