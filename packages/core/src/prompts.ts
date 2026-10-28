/**
 * Prompt types and selection rules. The prompt TEXT lives in
 * @scribe/content (prompts.ts); this file owns only the logic, so writers
 * can change wording without touching code, and code can change rules
 * without touching wording.
 *
 * Keys are stored on each entry (prompt_key). Never reuse a key for new
 * wording: add a new key and mark the old one `retired`.
 */

/**
 * `before` is the set written for a book whose child is not born yet (a due date, no birthday). It is chosen by the
 * `beforeBirth` signal on SelectInput, never by an age, and it is never offered to a born child.
 */
export type PromptBand = 'any' | 'before' | '0-3' | '4-6' | '7-9' | '10-12' | '13-18' | '19-24' | '25-36' | '37-60';
export type PromptKind = 'opening' | 'gap' | 'hard' | 'family' | 'together';

export interface Prompt {
  key: string;
  text: string;
  band: PromptBand;
  kind: PromptKind;
  retired?: boolean;
}

/** "Not much today" stores a mark with no text (D-084); its words live in content (en.notMuch, en.book.quietDay). */

export function bandFor(ageMonths: number): Exclude<PromptBand, 'any' | 'before'> | null {
  if (ageMonths < 4) return '0-3';
  if (ageMonths < 7) return '4-6';
  if (ageMonths < 10) return '7-9';
  if (ageMonths < 13) return '10-12';
  if (ageMonths < 19) return '13-18';
  if (ageMonths < 25) return '19-24';
  if (ageMonths < 37) return '25-36';
  if (ageMonths < 61) return '37-60';
  return null;
}

export interface SelectInput {
  /** Whole months of age. Not read when `beforeBirth` is true. */
  ageMonths: number;
  /**
   * The book is for a child who is not born yet (a due date and no birthday). Only prompts of band `before` are
   * offered, whatever the kind; the openings for any age, which assume a child who is here, are not. Absent means false.
   * If the library has no `before` prompt at all, selection behaves as if this were false.
   */
  beforeBirth?: boolean;
  daysSinceLastEntry: number | null;
  /** The author marked today as hard. */
  hardStretch: boolean;
  /** 'contributor' = grandparent or other close family. */
  role: 'parent' | 'contributor';
  /** The child is with the author right now (Read together / write together). */
  together: boolean;
  /** Prompt keys used recently by this author, most recent first. */
  recentKeys: string[];
  /** Stable per night, e.g. the ISO date, so a reopened app shows the same prompt. */
  seed: string;
  /**
   * Keys that must not come back: the prompt on screen when "Another thought" is pressed, so a press always shows a
   * different one. Unlike `recentKeys` this is not a preference: it holds unless nothing else exists.
   */
  excludeKeys?: readonly string[];
}

export const GAP_DAYS = 5;
export const AVOID_RECENT = 10;
/**
 * After the prompt on screen is left out, a press of "Another thought" should still have this many to choose from.
 * Fewer than this and the pool is widened with the openings that fit the child (the age band and any age, or the
 * pre-birth set).
 */
export const MIN_ALTERNATIVES = 3;

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Which kind of prompt tonight calls for. Order matters: the most specific need wins. */
export function kindFor(input: Pick<SelectInput, 'hardStretch' | 'together' | 'role' | 'daysSinceLastEntry'>): PromptKind {
  if (input.hardStretch) return 'hard';
  if (input.together) return 'together';
  if (input.role === 'contributor') return 'family';
  if (input.daysSinceLastEntry !== null && input.daysSinceLastEntry >= GAP_DAYS) return 'gap';
  return 'opening';
}

/**
 * Deterministic: same inputs, same prompt. Throws only if the library is empty.
 *
 * Who sees what: a book before the birth is offered the `before` set and nothing else; a born child is never offered
 * it. Then the usual order, kind first, then the openings that fit, then any opening.
 *
 * `excludeKeys` (the prompt on screen) is honoured before anything else: the pick is never one of them while another
 * prompt exists. If that leaves fewer than MIN_ALTERNATIVES in the pool, the pool is widened with the openings that
 * fit this child. Without exclusions nothing is widened, so a night's first prompt does not depend on this.
 */
export function selectPrompt(input: SelectInput, library: readonly Prompt[]): Prompt {
  const live = library.filter((p) => !p.retired);
  if (live.length === 0) throw new Error('selectPrompt: empty prompt library');
  const kind = kindFor(input);
  const preBirth = input.beforeBirth === true && live.some((p) => p.band === 'before');
  const band: PromptBand | null = preBirth ? 'before' : bandFor(input.ageMonths);
  const recent = new Set(input.recentKeys.slice(0, AVOID_RECENT));
  const excluded = new Set(input.excludeKeys ?? []);

  // The audience first: the pre-birth set for a book before the birth, everything else for a born child.
  const audience = live.filter((p) => (p.band === 'before') === preBirth);
  const shown = audience.length ? audience : live;
  const fits = (p: Prompt) => p.band === band || (!preBirth && p.band === 'any');
  const openings = (p: Prompt) => p.kind === 'opening' && fits(p);

  let pool = shown.filter((p) => p.kind === kind && fits(p));
  if (pool.length === 0) pool = shown.filter(openings);
  if (pool.length === 0) pool = shown.filter((p) => p.kind === 'opening');
  if (pool.length === 0) pool = shown;

  if (excluded.size > 0) {
    let rest = pool.filter((p) => !excluded.has(p.key));
    if (rest.length < MIN_ALTERNATIVES) {
      const wider = shown.filter((p) => openings(p) && !excluded.has(p.key) && !rest.includes(p));
      rest = [...rest, ...wider];
    }
    if (rest.length > 0) pool = rest;
  }

  // For openings, prefer age-specific prompts two nights in three.
  if (kind === 'opening') {
    const banded = pool.filter((p) => p.band === band && !recent.has(p.key));
    if (banded.length && hash(input.seed) % 3 !== 0) pool = banded;
  }
  const fresh = pool.filter((p) => !recent.has(p.key));
  const choices = fresh.length ? fresh : pool;
  return choices[hash(`${input.seed}:${kind}`) % choices.length];
}

/** Fill placeholders. Unknown placeholders are left visible so they get noticed in review. */
export function renderTemplate(text: string, values: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? String(values[k]) : m));
}
