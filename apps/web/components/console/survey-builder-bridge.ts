'use client';

/**
 * Tiny client-side bridge so the page-hero "Next step" button (a sibling of the
 * embedded SurveyJS Creator) can grab the creator's current JSON and persist it
 * before navigating — without the user having to click the in-builder Save icon.
 */
type JsonGetter = () => unknown;

const registry = new Map<string, JsonGetter>();

export function registerBuilder(surveyId: string, getJson: JsonGetter): void {
  registry.set(surveyId, getJson);
}

export function unregisterBuilder(surveyId: string): void {
  registry.delete(surveyId);
}

/** Current model JSON for a mounted builder, or undefined if none is registered. */
export function getBuilderJson(surveyId: string): unknown {
  return registry.get(surveyId)?.();
}
