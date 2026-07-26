'use client';

import { useEffect, useMemo, useState } from 'react';
import { SurveyCreator, SurveyCreatorComponent } from 'survey-creator-react';
import 'survey-core/survey-core.css';
import 'survey-creator-core/survey-creator-core.css';
import { saveSurveyJsonAction } from '@/app/(hotel)/h/[hotelId]/surveys/actions';
import { registerBuilder, unregisterBuilder } from '@/components/console/survey-builder-bridge';

/**
 * Embedded SurveyJS Survey Creator. Persists the model JSON through the
 * saveSurveyJsonAction server action. Rendered only after mount to avoid the
 * library touching `window` during SSR.
 */
export function SurveyBuilderClient({
  hotelId,
  surveyId,
  json,
}: {
  hotelId: string;
  surveyId: string;
  json: unknown;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const creator = useMemo(() => {
    const c = new SurveyCreator({
      showThemeTab: true,
      showTranslationTab: true,
      showJSONEditorTab: false,
      showLogicTab: false,
    });
    try {
      c.JSON = (json && typeof json === 'object' ? json : {}) as object;
    } catch {
      c.JSON = {};
    }
    c.saveSurveyFunc = (saveNo: number, callback: (no: number, success: boolean) => void) => {
      saveSurveyJsonAction(hotelId, surveyId, c.JSON)
        .then(() => callback(saveNo, true))
        .catch(() => callback(saveNo, false));
    };

    // Pre-populate the Translation tab with the locales we support (English default + TR/DE/RU)
    // so guests can be served the survey in their language.
    const LOCALES = ['tr', 'de', 'ru'];
    const ensureLocales = () => {
      try {
        const model = (c.getPlugin('translation') as unknown as { model?: { locales: string[]; addLocale: (l: string) => void } } | undefined)?.model;
        if (model && Array.isArray(model.locales)) {
          for (const loc of LOCALES) if (model.locales.indexOf(loc) < 0) model.addLocale(loc);
        }
      } catch {
        /* translation plugin not ready yet */
      }
    };
    c.onActiveTabChanged.add((_s: unknown, o: { tabName?: string }) => {
      if (o?.tabName === 'translation') ensureLocales();
    });

    // Reorder tabs: Designer → Translations → Preview → Themes
    // tabbedMenu.actions is populated synchronously after construction.
    const ORDER = ['designer', 'translation', 'preview', 'theme'];
    const tabs = (c.tabbedMenu as unknown as { actions: Array<{ id: string }> }).actions;
    ORDER.forEach((id, idx) => {
      const i = tabs.findIndex((t) => t.id === id);
      if (i !== -1 && i !== idx) tabs.splice(idx, 0, tabs.splice(i, 1)[0]!);
    });

    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expose the creator's current JSON to the hero "Next step" button so it can save first.
  useEffect(() => {
    registerBuilder(surveyId, () => creator.JSON);
    return () => unregisterBuilder(surveyId);
  }, [surveyId, creator]);

  if (!mounted) {
    return (
      <div style={{ height: 640, display: 'grid', placeItems: 'center', color: 'var(--text-3)' }}>
        SurveyJS…
      </div>
    );
  }

  return (
    <div style={{ height: 'min(72vh, 760px)' }}>
      <SurveyCreatorComponent creator={creator} />
    </div>
  );
}
