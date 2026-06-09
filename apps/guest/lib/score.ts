type SurveyQuestion = { type?: string; name?: string; rateMax?: number };

/** Derive a 0–5 overall score from the first answered rating question, if any. */
export function deriveScore(json: unknown, data: Record<string, unknown>): number | null {
  const j = json as { pages?: { elements?: SurveyQuestion[] }[]; elements?: SurveyQuestion[] } | null;
  const qs = j?.pages ? j.pages.flatMap((p) => p.elements ?? []) : (j?.elements ?? []);
  const rating = qs.find((q) => q.type === 'rating' && q.name && data[q.name] != null);
  if (!rating || !rating.name) return null;
  const v = Number(data[rating.name]);
  if (Number.isNaN(v)) return null;
  const max = rating.rateMax ?? 5;
  const score = max > 5 ? (v / max) * 5 : v;
  return Math.round(score * 10) / 10;
}
