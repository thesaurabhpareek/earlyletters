/**
 * Deterministic cleanup rules (no model): filler removal and collapsing
 * accidental repeats of a small set of function words.
 */
import type { Edit } from './types';
import { FILLERS, REPEAT_COLLAPSIBLE, tokens } from './text';

/**
 * "So um she, uh, walked" -> "So she walked".
 * Removes the filler plus one adjacent comma/space so punctuation stays tidy.
 */
export function fillerEdits(raw: string): Edit[] {
  const edits: Edit[] = [];
  for (const t of tokens(raw)) {
    if (!FILLERS.has(t.word.toLowerCase())) continue;
    let start = t.start;
    let end = t.end;
    // A filler that is a whole sentence ("...door. Hmm.") goes with its
    // terminal punctuation and the space before it.
    const isSentenceStart = /(^|[.!?]\s*)$/.test(raw.slice(0, start));
    const terminal = raw.slice(end).match(/^[.!?]+/);
    if (isSentenceStart && terminal) {
      const before = raw.slice(0, start).match(/\s*$/)![0];
      start -= before.length;
      end += terminal[0].length;
      edits.push({ type: 'filler', start, end, original: raw.slice(start, end), replacement: '', source: 'rule' });
      continue;
    }
    // swallow a trailing comma and the following whitespace: "um, she" -> "she"
    const after = raw.slice(end).match(/^,?\s*/)![0];
    end += after.length;
    // if the filler ends a clause ("she, um. Then") keep the period: drop the
    // preceding ", " instead of the following space
    if (after.length === 0 || /[.!?]/.test(raw[end] ?? '')) {
      const before = raw.slice(0, start).match(/,?\s*$/)![0];
      start -= before.length;
      end = t.end;
    }
    edits.push({ type: 'filler', start, end, original: raw.slice(start, end), replacement: '', source: 'rule' });
  }
  return mergeOverlapping(edits, raw);
}

/** "and and then" -> "and then". Only for REPEAT_COLLAPSIBLE words. */
export function repeatEdits(raw: string): Edit[] {
  const toks = tokens(raw);
  const edits: Edit[] = [];
  for (let i = 1; i < toks.length; i++) {
    const prev = toks[i - 1];
    const cur = toks[i];
    if (prev.word.toLowerCase() !== cur.word.toLowerCase()) continue;
    if (!REPEAT_COLLAPSIBLE.has(cur.word.toLowerCase())) continue;
    const between = raw.slice(prev.end, cur.start);
    if (!/^[\s,]*$/.test(between)) continue; // a sentence break between them is not a repeat
    // remove the gap and the second occurrence: keeps the first one's casing
    edits.push({
      type: 'repeat',
      start: prev.end,
      end: cur.end,
      original: raw.slice(prev.end, cur.end),
      replacement: '',
      source: 'rule',
    });
  }
  return mergeOverlapping(edits, raw);
}

function mergeOverlapping(edits: Edit[], raw: string): Edit[] {
  const sorted = [...edits].sort((a, b) => a.start - b.start);
  const out: Edit[] = [];
  for (const e of sorted) {
    const last = out.at(-1);
    if (last && e.start < last.end) {
      if (last.type === e.type && last.replacement === '' && e.replacement === '') {
        last.end = Math.max(last.end, e.end);
        last.original = raw.slice(last.start, last.end);
      }
      continue;
    }
    out.push({ ...e });
  }
  return out;
}
