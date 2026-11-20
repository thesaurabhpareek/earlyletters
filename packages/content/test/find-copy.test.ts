// NS-02 (Find): the words for the Find surfaces. The general rules (dashes, curly quotes, ellipsis, emoji) are
// enforced for every `features` leaf by rules.test.ts; these are the Find-specific ones.
import { describe, expect, it } from 'vitest';
import { en, findCopy } from '../src';

function leaves(o: unknown, path = 'find'): { path: string; text: string }[] {
  if (typeof o === 'string') return [{ path, text: o }];
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
  return [];
}
const ALL = leaves(findCopy);

describe('[NS-02-R11] Find says no number', () => {
  it('[NS-02-R11] no Find string carries a digit, a number word for results, or a count placeholder', () => {
    for (const l of ALL) {
      expect(l.text, l.path).not.toMatch(/\d/);
      expect(l.text, l.path).not.toMatch(/\b(results?|matches|found \w+ letters)\b/i);
      expect(l.text, l.path).not.toMatch(/\{(n|count|total)\}/);
    }
    expect(findCopy.foundA11y).toBe('Letters found');
  });
});

describe('[NS-02-R13] the no-match state is one calm line', () => {
  it('[NS-02-R13] reuses book.empty.searchTitle and no Find string asks for a letter to be written', () => {
    expect(en.book.empty.searchTitle).toBe('No letters with that word yet.');
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/\b(write|add|record|speak)\b/i);
  });
  it('[NS-02-R13] find.en.ts has no noMatchHelp key: the title stands alone, with no second line (spec 02 section 9, FD-R10)', () => {
    expect(Object.keys(findCopy)).not.toContain('noMatchHelp');
    expect(ALL.map((l) => l.text)).not.toContain('Try another word.');
  });
});

describe('[NS-02-R3] short queries show no drawn hint', () => {
  it('[NS-02-R3] find.en.ts has no hint key', () => {
    expect(Object.keys(findCopy)).not.toContain('hint');
    expect(ALL.map((l) => l.text)).not.toContain('Type three letters to start.');
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/\bthree letters\b|\btype three\b/i);
  });
});

describe('[NS-02-R23] the VoiceOver-only hint on the field', () => {
  it('[NS-02-R23] fieldHint is one sentence that names no number of results and does not claim three characters', () => {
    expect(typeof findCopy.fieldHint).toBe('string');
    expect(findCopy.fieldHint).not.toMatch(/\d|\b(three|results?|matches)\b/i);
    expect(findCopy.fieldHint.match(/[.!?]/g)).toHaveLength(1);
    expect(findCopy.fieldHint.endsWith('.')).toBe(true);
    expect(findCopy.fieldHint).not.toContain('{');
  });
});

describe('[NS-02] Find obeys the voice rules', () => {
  it('[NS-02-R14] never mentions recent searches, history or suggestions', () => {
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/\b(recent|history|suggest\w*|related|popular)\b/i);
  });
  it('[NS-02-R9] never implies a machine writes, shapes or ranks', () => {
    for (const l of ALL) {
      expect(l.text, l.path).not.toMatch(/\b(AI|auto|automatic|smart|generated|best match|relevan\w*|rank\w*|summar\w*)\b/i);
    }
  });
  it('[NS-02] uses only the placeholders it fills, and names the book with {child}', () => {
    for (const l of ALL) for (const m of l.text.matchAll(/\{(\w+)\}/g)) expect(['child', 'date', 'label']).toContain(m[1]);
    expect(findCopy.placeholder).toContain('{child}');
  });
  it('[NS-02-R1] the header action is the single word Find', () => {
    expect(findCopy.button).toBe('Find');
  });
  it('[NS-02][CR-25] does not use the internal word index, lens or query in what a parent reads', () => {
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/\b(index|lens|query|database|FTS)\b/i);
  });
});
