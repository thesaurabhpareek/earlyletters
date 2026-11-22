/**
 * [BL-148] [F06-REQ-025] [F06-REQ-026] Every saved version replays byte for byte,
 * including after the author's own hand edit (DATA-REQ-041, TDD 01 X-8).
 *
 * A version stores: the immutable raw, the machine edits still applied, the
 * author edits, and the final text. Replay must re-derive the final text from
 * the first three alone. Author edits are not an EditType and never pass the
 * verifier; what they owe is replay. Seeded PRNG (SCRIBE_FUZZ_SEED overrides).
 */
import { describe, expect, it } from 'vitest';
import {
  applyAuthorEdits,
  applyEdits,
  diffAuthorEdits,
  faithfulClean,
  finalText,
  replayFinalText,
  withoutEdit,
  type AuthorEdit,
  type Edit,
} from '../src';

function prng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const SEED = Number(process.env.SCRIBE_FUZZ_SEED ?? 148);
const RUNS = Number(process.env.SCRIBE_FUZZ_RUNS ?? 500);

const PIECES = [
  'Asha laughed', 'um', 'uh', 'the the', 'she was, she was so happy', 'at the puddle.', 'We went to the park',
  'and and then', 'Asha said no.', 'It rained, um, all day', 'she was not tired', 'big big smile', 'You you ran',
  'Tuesday', 'line one\nline two', '  double  space ', 'café',
];
const WORDS = ['Asha', 'puddle', 'nap', 'yes', 'never', 'ran', 'two', 'her', 'blue', 'giggled', 'x́', ''];

function letter(r: () => number): string {
  const n = 2 + Math.floor(r() * 5);
  return Array.from({ length: n }, () => PIECES[Math.floor(r() * PIECES.length)]).join(' ');
}

/** A hand edit: any rewrite at all, because the author may write anything. */
function handEdit(text: string, r: () => number): string {
  const toks = text.match(/\s+|\S+/g) ?? [];
  const k = 1 + Math.floor(r() * 3);
  for (let i = 0; i < k; i++) {
    const at = Math.floor(r() * (toks.length + 1));
    const op = r();
    if (op < 0.4 && at < toks.length) toks.splice(at, 1);
    else if (op < 0.7) toks.splice(at, 0, WORDS[Math.floor(r() * WORDS.length)], ' ');
    else if (at < toks.length) toks[at] = WORDS[Math.floor(r() * WORDS.length)];
  }
  return toks.join('');
}

/** Independent of applyEdits: a left-to-right cursor over edits sorted by start. */
function oracleApply(raw: string, edits: readonly Edit[]): string {
  let out = '';
  let at = 0;
  for (const e of [...edits].sort((a, b) => a.start - b.start || a.end - b.end)) {
    out += raw.slice(at, e.start) + e.replacement;
    at = e.end;
  }
  return out + raw.slice(at);
}

interface Version {
  machine: Edit[];
  author: AuthorEdit[];
  text: string;
}

describe('[BL-148] version replay', () => {
  it('replays at every version of a letter: clean, put-backs, hand edits, put-backs after a hand edit', () => {
    const r = prng(SEED);
    let withAuthorSpan = 0;
    let withPutBack = 0;
    for (let n = 0; n < RUNS; n++) {
      const raw = letter(r);
      const clean = faithfulClean(raw, { level: 'clean', dictionary: [] });
      const versions: Version[] = [{ machine: clean.applied, author: [], text: clean.text }];
      let machine = clean.applied;
      let text = clean.text;
      const steps = 1 + Math.floor(r() * 5);
      for (let s = 0; s < steps; s++) {
        if (r() < 0.5 && machine.length > 0) {
          // Put it back: the machine edit leaves the list; the old hand edits were against the old machine text.
          const back = withoutEdit(raw, machine, Math.floor(r() * machine.length));
          machine = back.applied;
          text = back.text;
          withPutBack++;
        } else {
          const base = finalText(raw, machine);
          const next = handEdit(text, r);
          const author = diffAuthorEdits(base, next);
          if (author.length) withAuthorSpan++;
          text = next;
          versions.push({ machine, author, text });
          continue;
        }
        versions.push({ machine, author: [], text });
      }
      for (const [i, v] of versions.entries()) {
        expect(replayFinalText(raw, v.machine, v.author), `run ${n} version ${i} seed ${SEED}`).toBe(v.text);
        // the order of application is checked against a reference that does not share applyEdits
        expect(applyEdits(raw, v.machine), `order, run ${n} version ${i}`).toBe(oracleApply(raw, v.machine));
      }
    }
    // the generator really reached the cases the claim is about
    expect(withAuthorSpan).toBeGreaterThan(RUNS / 2);
    expect(withPutBack).toBeGreaterThan(RUNS / 4);
  });

  it('a put-back is the same text as replaying the shortened list, never a re-clean', () => {
    const raw = 'Asha laughed, um, at the the puddle.';
    const c = faithfulClean(raw, { level: 'clean', dictionary: [] });
    expect(c.applied.length).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < c.applied.length; i++) {
      const b = withoutEdit(raw, c.applied, i);
      expect(replayFinalText(raw, b.applied)).toBe(b.text);
    }
  });

  it('is independent of the stored order of machine edits', () => {
    const raw = 'um Asha laughed, um, at the the puddle and and then uh left';
    const c = faithfulClean(raw, { level: 'clean', dictionary: [] });
    const want = replayFinalText(raw, c.applied);
    expect(replayFinalText(raw, [...c.applied].reverse())).toBe(want);
    expect(applyEdits(raw, [...c.applied].reverse())).toBe(applyEdits(raw, c.applied));
  });

  it('the author layer is the author\'s words: it may write what the verifier would refuse, and still replays', () => {
    const raw = 'Asha said no, um, and left.';
    const c = faithfulClean(raw, { level: 'clean', dictionary: [] });
    const author = diffAuthorEdits(c.text, 'Asha said yes, and stayed.');
    expect(replayFinalText(raw, c.applied, author)).toBe('Asha said yes, and stayed.');
    // the raw is untouched and the machine list is unchanged by the hand edit
    expect(raw).toBe('Asha said no, um, and left.');
    expect(c.applied.every((e) => e.source === 'rule' || e.source === 'model')).toBe(true);
  });

  it('diffAuthorEdits is exact for any two strings, sorted and non-overlapping', () => {
    const r = prng(SEED + 1);
    for (let n = 0; n < 2000; n++) {
      const a = letter(r);
      const b = r() < 0.2 ? letter(r) : handEdit(a, r);
      const d = diffAuthorEdits(a, b);
      expect(applyAuthorEdits(a, d)).toBe(b);
      for (let i = 1; i < d.length; i++) expect(d[i].start).toBeGreaterThanOrEqual(d[i - 1].end);
    }
    expect(diffAuthorEdits('same', 'same')).toEqual([]);
  });

  it('refuses a layer that does not fit instead of guessing', () => {
    expect(() => applyAuthorEdits('abc', [{ start: 2, end: 9, replacement: '' }])).toThrow('author_edits_out_of_bounds');
    expect(() => applyAuthorEdits('abc', [{ start: 1, end: 2, replacement: '' }, { start: 0, end: 1, replacement: '' }])).toThrow(
      'author_edits_overlap_or_unsorted',
    );
  });
});
