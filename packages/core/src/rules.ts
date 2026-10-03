/**
 * Deterministic cleanup rules (no model): filler removal and collapsing
 * accidental repeats (decided in repeats.ts).
 */
import type { Edit } from './types';
import { FILLERS, tokens } from './text';
import { findRepeats } from './repeats';

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

/**
 * Accidental repeats the rules remove by themselves: "and and then",
 * "like a like a little hiccup", "today you you held". Context-dependent
 * doubles ("I told you you were brave", "what it was was magic") are kept;
 * see repeats.ts for the full decision table.
 */
export function repeatEdits(raw: string): Edit[] {
  return findRepeats(raw)
    .filter((f) => f.decision === 'auto')
    .map((f) => f.edit);
}

/**
 * Repeats that may be a stumble or may be meant ("so so happy", "my my").
 * Never applied by the engine; the parent can accept one in review, and it
 * is then verified like any other edit (pass it in CleanOptions.ruleEdits).
 */
export function repeatSuggestionEdits(raw: string): Edit[] {
  return findRepeats(raw)
    .filter((f) => f.decision === 'suggest')
    .map((f) => f.edit);
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
