/** Default-survey payload handed to the client to render the post-login invite + form. */
export type SurveyOffer = {
  id: string;
  slug: string;
  name: string;
  json: unknown;
  defaultLocale: string;
  thankYouTitle: string | null;
  thankYouDescription: string | null;
};
