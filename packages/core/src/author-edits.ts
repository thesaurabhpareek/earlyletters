/**
 * The author layer (F06-REQ-025, F06-REQ-026, BL-148, TDD 01 X-8).
 *
 * A person's own hand edits ("Change words") are stored apart from the
 * machine's edits. They are NOT an EditType, never pass verifyEdits and are
 * never counted as machine edits: they are the author's words, and the author
 * may write anything. What they must keep is replay: every saved version can
 * be re-derived byte for byte from raw_transcript, the stored machine edits
 * and the stored author edits, in that order.
 *
 *   text = applyAuthorEdits( finalText(raw, machine_edits), author_edits )
 *
 * Author offsets are UTF-16 indices into the machine-cleaned text, never into
 * raw, and nothing normalises after them (the author's text is authoritative).
 */
import type { Edit } from './types';
import { finalText } from './pipeline';
import type { LanguageRules } from './lang/engine';

/** One hand edit: word-level, against the machine-cleaned text. */
export interface AuthorEdit {
  start: number;
  end: number;
  replacement: string;
}

/** Why a stored author layer cannot be applied, or null when it can. */
export function checkAuthorEdits(base: string, edits: readonly AuthorEdit[]): string | null {
  let prevEnd = 0;
  for (const e of edits) {
    if (!Number.isInteger(e.start) || !Number.isInteger(e.end) || typeof e.replacement !== 'string') return 'malformed';
    if (e.start < 0 || e.end < e.start || e.end > base.length) return 'out_of_bounds';
    if (e.start < prevEnd) return 'overlap_or_unsorted';
    prevEnd = e.end;
  }
  return null;
}

/** Apply author edits to the machine-cleaned text. Throws on a layer that does not fit: a replay must never guess. */
export function applyAuthorEdits(base: string, edits: readonly AuthorEdit[]): string {
  const bad = checkAuthorEdits(base, edits);
  if (bad) throw new Error(`author_edits_${bad}`);
  let out = '';
  let at = 0;
  for (const e of edits) {
    out += base.slice(at, e.start) + e.replacement;
    at = e.end;
  }
  return out + base.slice(at);
}

/** Re-derive a saved version's final_text from what is stored: raw, machine edits, author edits. */
export function replayFinalText(
  raw: string,
  machineEdits: readonly Edit[],
  authorEdits: readonly AuthorEdit[] = [],
  rules?: LanguageRules,
): string {
  return applyAuthorEdits(finalText(raw, [...machineEdits], rules), authorEdits);
}

const MAX_CELLS = 250_000;

/**
 * Word-level diff from the machine-cleaned text to what the author saved.
 * Sorted, non-overlapping, and exact: applyAuthorEdits(from, result) === to
 * for every pair of strings. Whitespace runs are tokens of their own, so a
 * changed space or line break round-trips too.
 */
export function diffAuthorEdits(from: string, to: string): AuthorEdit[] {
  if (from === to) return [];
  const a = from.match(/\s+|\S+/g) ?? [];
  const b = to.match(/\s+|\S+/g) ?? [];
  let pre = 0;
  while (pre < a.length && pre < b.length && a[pre] === b[pre]) pre++;
  let suf = 0;
  while (suf < a.length - pre && suf < b.length - pre && a[a.length - 1 - suf] === b[b.length - 1 - suf]) suf++;
  const am = a.slice(pre, a.length - suf);
  const bm = b.slice(pre, b.length - suf);
  const offs: number[] = [0];
  for (const t of a) offs.push(offs[offs.length - 1] + t.length);
  const boffs: number[] = [0];
  for (const t of b) boffs.push(boffs[boffs.length - 1] + t.length);

  // pairs of aligned (kept) token indices inside the middle, by longest common subsequence
  const kept: Array<[number, number]> = [];
  if (am.length * bm.length <= MAX_CELLS) {
    const w = bm.length + 1;
    const L = new Uint32Array((am.length + 1) * w);
    for (let i = am.length - 1; i >= 0; i--) {
      for (let j = bm.length - 1; j >= 0; j--) {
        L[i * w + j] = am[i] === bm[j] ? L[(i + 1) * w + j + 1] + 1 : Math.max(L[(i + 1) * w + j], L[i * w + j + 1]);
      }
    }
    let i = 0;
    let j = 0;
    while (i < am.length && j < bm.length) {
      if (am[i] === bm[j]) {
        kept.push([i, j]);
        i++;
        j++;
      } else if (L[(i + 1) * w + j] >= L[i * w + j + 1]) i++;
      else j++;
    }
  }

  const out: AuthorEdit[] = [];
  let ai = 0;
  let bj = 0;
  const flush = (ae: number, be: number) => {
    if (ae > ai || be > bj) {
      out.push({ start: offs[pre + ai], end: offs[pre + ae], replacement: to.slice(boffs[pre + bj], boffs[pre + be]) });
    }
  };
  for (const [i, j] of kept) {
    flush(i, j);
    ai = i + 1;
    bj = j + 1;
  }
  flush(am.length, bm.length);
  return out;
}
