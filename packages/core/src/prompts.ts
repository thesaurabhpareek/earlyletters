/**
 * Prompt types and selection rules. The prompt TEXT lives in
 * @scribe/content (prompts.ts); this file owns only the logic, so writers
 * can change wording without touching code, and code can change rules
 * without touching wording.
 *
 * Keys are stored on each entry (prompt_key). Never reuse a key for new
 * wording: add a new key and mark the old one `retired`.
 */

export type PromptBand = 'any' | '0-3' | '4-6' | '7-9' | '10-12' | '13-18' | '19-24' | '25-36' | '37-60';
export type PromptKind = 'opening' | 'gap' | 'hard' | 'family' | 'together';

export interface Prompt {
  key: string;
  text: string;
  band: PromptBand;
  kind: PromptKind;
  retired?: boolean;
}

/** The text written by the one-tap "Not much today" entry lives in content (en.notMuch). */

export function bandFor(ageMonths: number): Exclude<PromptBand, 'any'> | null {
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
  ageMonths: number;
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
}

export const GAP_DAYS = 5;
export const AVOID_RECENT = 10;

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

/** Deterministic: same inputs, same prompt. Throws only if the library is empty. */
export function selectPrompt(input: SelectInput, library: readonly Prompt[]): Prompt {
  const live = library.filter((p) => !p.retired);
  if (live.length === 0) throw new Error('selectPrompt: empty prompt library');
  const kind = kindFor(input);
  const band = bandFor(input.ageMonths);
  const recent = new Set(input.recentKeys.slice(0, AVOID_RECENT));

  const fits = (p: Prompt) => p.band === 'any' || p.band === band;
  let pool = live.filter((p) => p.kind === kind && fits(p));
  if (pool.length === 0) pool = live.filter((p) => p.kind === 'opening' && fits(p));
  if (pool.length === 0) pool = live.filter((p) => p.kind === 'opening');

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
