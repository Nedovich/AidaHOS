import 'server-only';
import { cookies } from 'next/headers';
import { DEFAULT_LANG, type Lang } from './i18n';

/** Current console language from the `aida-lang` cookie (server components). */
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get('aida-lang')?.value;
  return v === 'en' ? 'en' : DEFAULT_LANG;
}
