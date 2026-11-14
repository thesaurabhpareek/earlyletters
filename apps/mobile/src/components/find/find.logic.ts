/**
 * What the Find overlay shows for a state (design 02 section 6; NS-02-R3, R11, R13). Pure: no React Native. The words
 * are `findCopy` from packages/content and the existing book.empty.searchTitle.
 *
 * No count is ever built here: not on screen, not in the VoiceOver string (R11). No state asks for a letter to be
 * written (R13). The only states are idle, results, none and failed.
 */
import { findCopy } from '@scribe/content';
import type { FindResult } from '@/lib/find/search';

export type FindView = 'idle' | 'results' | 'none' | 'failed';

export function findView(input: { result: FindResult | null; failed: boolean }): FindView {
  if (input.failed) return 'failed';
  if (!input.result || input.result.status === 'idle') return 'idle';
  return input.result.hits.length > 0 ? 'results' : 'none';
}

/** The one polite announcement for a view, or null when nothing should be said (idle says nothing: R3). */
export function announcementFor(view: FindView, noMatchTitle: string): string | null {
  if (view === 'results') return findCopy.foundA11y;
  if (view === 'none') return noMatchTitle;
  return null;
}

/** "{date}. {sentence}. Opens the letter." A sentence that already ends in a full stop does not get a second one. */
export function rowLabel(date: string, sentence: string): string {
  const s = sentence.replace(/[.।。]+\s*$/u, '');
  return findCopy.rowA11y.replace('{date}', date).replace('{label}', s);
}

export interface Segment {
  text: string;
  marked: boolean;
}

/** Cuts an excerpt into plain and marked runs, in order, covering the whole text exactly once. */
export function segments(text: string, marks: readonly { start: number; end: number }[]): Segment[] {
  const out: Segment[] = [];
  let at = 0;
  for (const m of [...marks].sort((a, b) => a.start - b.start)) {
    if (m.start < at || m.end <= m.start) continue; // overlapping or empty: skip, never double-print
    if (m.start > at) out.push({ text: text.slice(at, m.start), marked: false });
    out.push({ text: text.slice(m.start, m.end), marked: true });
    at = m.end;
  }
  if (at < text.length) out.push({ text: text.slice(at), marked: false });
  return out;
}
