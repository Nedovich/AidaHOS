import Link from 'next/link';
import { Check } from 'lucide-react';
import { L, type Lang } from '@/lib/i18n';

type Step = 'settings' | 'builder' | 'publish';
const ORDER: Step[] = ['settings', 'builder', 'publish'];

/** Survey wizard step rail (Forms › Form Settings › Build Survey › Publish). */
export function WizardSteps({ hotelId, surveyId, current, lang }: { hotelId: string; surveyId: string; current: Step; lang: Lang }) {
  const base = `/h/${hotelId}/surveys`;
  const steps: { id: Step; n: number; label: readonly [string, string] }[] = [
    { id: 'settings', n: 1, label: ['Form Ayarları', 'Form Settings'] },
    { id: 'builder', n: 2, label: ['Anketi Oluştur', 'Build Survey'] },
    { id: 'publish', n: 3, label: ['Yayınla', 'Publish'] },
  ];
  const ci = ORDER.indexOf(current);
  return (
    <div className="wsteps">
      <Link className="wsteps__i" href={`${base}/forms`}>{L(['Formlar', 'Forms'], lang)}</Link>
      <span className="wsteps__sep" />
      {steps.map((s, i) => {
        const cls = i < ci ? 'done' : i === ci ? 'on' : '';
        return (
          <span key={s.id} style={{ display: 'contents' }}>
            <Link className={`wsteps__i ${cls}`} href={`${base}/${surveyId}/edit/${s.id}`}>
              <span className="n">{i < ci ? <Check size={12} /> : s.n}</span>
              {L(s.label, lang)}
            </Link>
            {i < steps.length - 1 ? <span className="wsteps__sep" /> : null}
          </span>
        );
      })}
    </div>
  );
}
