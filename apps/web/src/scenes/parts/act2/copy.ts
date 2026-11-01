/**
 * Owner: ACT2. Words the paper act needs that are not yet in src/content/site.ts.
 * The coordinator moves these into site.ts (requested in the ACT2 report); until then they live here.
 * Every string is copied verbatim from packages/content/src/strings.en.ts (the app's own words).
 */
import { site } from '@/content/site';

export const act2Copy = {
  /** strings.en.ts review.title */
  reviewTitle: 'Read it back',
  /** The app's three tabs (DESIGN_LANGUAGE 12, Navigation). */
  tabs: ['Tonight', 'Book', 'Family'],
} as const;

/** "From Papa": the same words S07 uses on its player (site.scenes.s07.appFrom). */
export const fromPapa = site.scenes.s07.appFrom;

const template = site.scenes.s06.chapters[0].month;
/** "Month 12" from the "Month 7" pattern in site.ts, so the word "Month" is never hardcoded. */
export const monthLabel = (n: number) => template.replace(/\d+/, String(n));
/** The numeral inside a chapter label ("Month 9" gives "9"). */
export const monthNumeral = (label: string) => label.match(/\d+/)?.[0] ?? '';
