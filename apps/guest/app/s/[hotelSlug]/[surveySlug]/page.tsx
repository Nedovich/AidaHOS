import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { findHotelBySlug, getSurveyBySlug } from '@aidahos/db';
import { SurveyRunner } from '@/components/survey-runner';

export const dynamic = 'force-dynamic';

export default async function GuestSurveyPage({
  params,
}: {
  params: Promise<{ hotelSlug: string; surveySlug: string }>;
}) {
  const { hotelSlug, surveySlug } = await params;

  const [survey, hotel] = await Promise.all([getSurveyBySlug(surveySlug), findHotelBySlug(hotelSlug)]);
  if (!survey || survey.status !== 'published') notFound();
  // The link's hotel must be the survey's single assigned hotel.
  if (!hotel || survey.hotelId !== hotel.id) notFound();

  const jar = await cookies();
  const lang = jar.get('aida-lang')?.value === 'tr' ? 'tr' : 'en';
  const ac = (survey.accessControl ?? {}) as { guestVerification?: boolean };

  return (
    <main style={{ minHeight: '100dvh', background: 'var(--bg, #f4f6f8)' }}>
      <SurveyRunner
        surveyId={survey.id}
        surveySlug={survey.slug}
        hotelSlug={hotel.slug}
        json={survey.json}
        guestVerification={ac.guestVerification ?? false}
        thankYouTitle={survey.thankYouTitle}
        thankYouDescription={survey.thankYouDescription}
        lang={lang}
        defaultLocale={survey.defaultLocale}
      />
    </main>
  );
}
