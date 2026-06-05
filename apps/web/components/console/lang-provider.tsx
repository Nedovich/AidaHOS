'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { DEFAULT_LANG, type Lang } from '@/lib/i18n';

const LangCtx = createContext<Lang>(DEFAULT_LANG);

export function LangProvider({ initial, children }: { initial: Lang; children: ReactNode }) {
  return <LangCtx.Provider value={initial}>{children}</LangCtx.Provider>;
}

export function useLang(): Lang {
  return useContext(LangCtx);
}

export function setLangCookie(lang: Lang) {
  document.cookie = `aida-lang=${lang};path=/;max-age=31536000`;
}
