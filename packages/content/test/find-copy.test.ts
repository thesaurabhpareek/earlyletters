// NS-02 (Find): the words for the Find surfaces. From #798 (head 7f36031a). Until find.en.ts is registered in
// features/index.ts (after the photo stack, BL-952 slice 6), rules.test.ts does not see it, so the general character
// rules run here too.
import { describe, expect, it } from 'vitest';
import { en } from '../src';
import { findCopy } from '../src/features/find.en';

function leaves(o: unknown, path = 'find'): { path: string; text: string }[] {
  if (typeof o === 'string') return [{ path, text: o }];
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
  return [];
}
const ALL = leaves(findCopy);

describe('[NS-02] the general rules, until find.en.ts is registered', () => {
  it('[NS-02] ASCII only: no dash, curly quote, ellipsis character or emoji; no "we"', () => {
    for (const l of ALL) {
      expect(l.text, l.path).not.toMatch(/[^\x20-\x7e]/);
      expect(l.text, l.path).not.toMatch(/\bwe\b/i);
    }
  });
});

describe('[NS-02-R39] no gap word', () => {
  it('[NS-02-R39] no Find string holds "yet", "still", "missing" or another banned word of card section 16', () => {
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/\b(yet|still|missing|did you mean|smart|anything you said|search your recordings)\b/i);
  });
});

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
  it('[NS-02-R13] Find has no no-match line of its own (it reuses book.empty.searchTitle) and no string asks for a letter', () => {
    expect(typeof en.book.empty.searchTitle).toBe('string');
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/\b(write|add|record|speak)\b/i);
    expect(Object.keys(findCopy)).not.toContain('noMatchHelp');
    expect(ALL.map((l) => l.text)).not.toContain('Try another word.');
  });
});

describe('[NS-02-R3][NS-02-R23] short queries show no drawn hint', () => {
  it('[NS-02-R3] find.en.ts has no hint key', () => {
    expect(Object.keys(findCopy)).not.toContain('hint');
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/\bthree letters\b|\btype three\b/i);
  });
  it('[NS-02-R23] fieldHint is one sentence that names no number of results and does not claim three characters', () => {
    expect(findCopy.fieldHint).not.toMatch(/\d|\b(three|results?|matches)\b/i);
    expect(findCopy.fieldHint.match(/[.!?]/g)).toHaveLength(1);
    expect(findCopy.fieldHint.endsWith('.')).toBe(true);
    expect(findCopy.fieldHint).not.toContain('{');
  });
});

describe('[NS-02] Find obeys the voice rules', () => {
  it('[NS-02-R14][NS-02-R27] never mentions recent searches, history or suggestions', () => {
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/\b(recent|history|suggest\w*|related|popular)\b/i);
  });
  it('[NS-02-R9] never implies a machine writes, shapes or ranks', () => {
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/\b(AI|auto|automatic|smart|generated|best match|relevan\w*|rank\w*|summar\w*)\b/i);
  });
  it('[NS-02] uses only the placeholders it fills, and names the book with {child}', () => {
    for (const l of ALL) for (const m of l.text.matchAll(/\{(\w+)\}/g)) expect(['child', 'date', 'label']).toContain(m[1]);
    expect(findCopy.placeholder).toContain('{child}');
  });
  it('[NS-02-R1] the header action is the single word Find, and the field is "Find a letter" for VoiceOver', () => {
    expect([findCopy.button, findCopy.fieldLabel]).toEqual(['Find', 'Find a letter']);
  });
  it('[NS-02-R41] the row is read with "Opens the letter." once', () => {
    expect(findCopy.rowA11y.match(/Opens the letter\./g)).toHaveLength(1);
  });
  it('[NS-02][CR-25] does not use the internal word index, lens or query in what a parent reads', () => {
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/\b(index|lens|query|database|FTS)\b/i);
  });
});
