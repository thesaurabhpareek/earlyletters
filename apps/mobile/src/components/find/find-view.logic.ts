/**
 * What Find's screen draws (docs/design/specs/02-FIND-11nov.md section 6; area B DESIGN B-S06). Pure: no React Native.
 * Idle and short draw nothing and say nothing (NS-02-R3); no match is one calm line (R13); a failed search is the one
 * error line plus Try again (R37); no state ever carries a number of results (R11).
 */
import type { FindResult } from '@/lib/find/search';

export type FindView = 'idle' | 'results' | 'noMatch' | 'failed';

export function findView(result: FindResult | null, failed: boolean): FindView {
  if (failed) return 'failed';
  if (!result || result.status === 'idle') return 'idle';
  return result.hits.length === 0 ? 'noMatch' : 'results';
}

/** One row read aloud: date, then the matching sentence as kept, then the action (spec section 8). No count. */
export function rowLabel(template: string, date: string, sentence: string): string {
  // Function replacers: a letter holding `$&` or `$'` is a parent's words and is never read as a pattern (R41).
  return template.replace('{date}', () => date).replace('{label}', () => sentence);
}

/** The excerpt cut into plain and matched runs, so the screen marks the match with an underline and weight. */
export function excerptRuns(e: { text: string; marks: { start: number; end: number }[] }): { text: string; match: boolean }[] {
  const runs: { text: string; match: boolean }[] = [];
  let at = 0;
  for (const m of [...e.marks].sort((a, b) => a.start - b.start)) {
    if (m.start < at) continue;
    if (m.start > at) runs.push({ text: e.text.slice(at, m.start), match: false });
    runs.push({ text: e.text.slice(m.start, m.end), match: true });
    at = m.end;
  }
  if (at < e.text.length) runs.push({ text: e.text.slice(at), match: false });
  return runs;
}

/** What Find holds in memory: the typed query and what it found, nothing else (R14). It is never stored. */
export interface FindState {
  raw: string;
  result: FindResult | null;
  failed: boolean;
}
export const FIND_EMPTY: FindState = { raw: '', result: null, failed: false };
export type FindAction =
  | { type: 'typed'; raw: string }
  | { type: 'found'; result: FindResult }
  | { type: 'failed' }
  /** Find went dark (the book left the screen, the switch or pause turned it off), Cancel, or unmount. */
  | { type: 'clear' };

export function findReducer(s: FindState, a: FindAction): FindState {
  switch (a.type) {
    case 'typed':
      return { ...s, raw: a.raw };
    case 'found':
      return { ...s, result: a.result, failed: false };
    case 'failed':
      return { ...s, failed: true };
    case 'clear':
      return s === FIND_EMPTY ? s : FIND_EMPTY;
  }
}

/** The field keeps a query off every system helper that remembers or suggests text (R14, R15). */
export const FIND_FIELD_PROPS = {
  autoComplete: 'off',
  textContentType: 'none',
  autoCapitalize: 'none',
  autoCorrect: false,
  spellCheck: false,
} as const;
