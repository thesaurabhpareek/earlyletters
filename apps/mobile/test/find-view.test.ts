import { describe, expect, it, vi } from 'vitest';
import { createQueryDebounce } from '../src/lib/find/debounce';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { excerptRuns, FIND_EMPTY, FIND_FIELD_PROPS, findReducer, findView, rowLabel } from '../src/components/find/find-view.logic';

const hit = { id: 'a', occurredOn: '2026-10-14', capturedAt: '2026-10-14T10:00:00Z', source: 'body' as const, excerpt: { text: 'x', offset: 0, marks: [], cutStart: false, cutEnd: false } };

describe('findView', () => {
  it('draws nothing when idle or short, one line when nothing matches, rows when something does, the error when it failed', () => {
    expect(findView(null, false)).toBe('idle');
    expect(findView({ status: 'idle' }, false)).toBe('idle');
    expect(findView({ status: 'done', hits: [], path: 'scan' }, false)).toBe('noMatch');
    expect(findView({ status: 'done', hits: [hit], path: 'index' }, false)).toBe('results');
    expect(findView({ status: 'done', hits: [hit], path: 'index' }, true)).toBe('failed');
  });
});
describe('row words', () => {
  it('the runs rebuild the excerpt exactly (nothing added, nothing dropped) and mark only the match', () => {
    const runs = excerptRuns({ text: 'the ducks again', marks: [{ start: 4, end: 9 }] });
    expect(runs.map((r) => r.text).join('')).toBe('the ducks again');
    expect(runs.filter((r) => r.match).map((r) => r.text)).toEqual(['ducks']);
  });
  it('the spoken row has the date and the sentence and no number', () => {
    expect(rowLabel('{date}. {label}. Opens the letter.', 'Saturday', 'the ducks')).toBe('Saturday. the ducks. Opens the letter.');
  });
});

describe('[NS-02-R41] a parent\'s words are never altered by the row label', () => {
  it('keeps $& and $\' and $1 and $$ exactly as written', () => {
    const t = '{date}. {label}. Opens the letter.';
    expect(rowLabel(t, 'Saturday', "cost $& $'x $1 $$ $`")).toBe("Saturday. cost $& $'x $1 $$ $`. Opens the letter.");
    expect(rowLabel(t, "$& day", 'the ducks')).toBe('$& day. the ducks. Opens the letter.');
  });
});

describe('[NS-02-R14] the query and the excerpts do not outlive the screen', () => {
  const found = { status: 'done' as const, hits: [hit], path: 'index' as const };
  it('clear returns to the empty state from any state', () => {
    let s = findReducer(FIND_EMPTY, { type: 'typed', raw: 'ducks' });
    s = findReducer(s, { type: 'found', result: found });
    s = findReducer(s, { type: 'failed' });
    expect(s).toEqual({ raw: 'ducks', result: found, failed: true });
    expect(findReducer(s, { type: 'clear' })).toEqual({ raw: '', result: null, failed: false });
  });
  it('a pending debounced run is dropped by cancel, and typing works again after', () => {
    vi.useFakeTimers();
    try {
      const run = vi.fn();
      const d = createQueryDebounce(run);
      d.push('ducks');
      d.cancel();
      vi.advanceTimersByTime(1000);
      expect(run).not.toHaveBeenCalled();
      d.push('boats');
      vi.advanceTimersByTime(1000);
      expect(run).toHaveBeenCalledWith('boats');
    } finally {
      vi.useRealTimers();
    }
  });
  const src = readFileSync(join(__dirname, '..', 'src/components/find/find-mode.tsx'), 'utf8');
  it('FindMode clears when it goes dark, on Cancel and on unmount', () => {
    expect(src).toMatch(/useEffect\(\(\) => \{\s*if \(on\) return;\s*debounce\.cancel\(\);\s*dispatch\(\{ type: 'clear' \}\);\s*\}, \[on, debounce\]\)/);
    expect(src).toMatch(/useEffect\(\(\) => \(\) => dispatch\(\{ type: 'clear' \}\), \[\]\)/);
    expect(src).toMatch(/const cancel = \(\) => \{\s*debounce\.cancel\(\);\s*dispatch\(\{ type: 'clear' \}\);\s*onCancel\(\);/);
    expect(src).toMatch(/onPress=\{cancel\}/);
  });
});

describe('[NS-02-R15] the field and the placeholder', () => {
  it('the field is hardened against every system helper that remembers text', () => {
    expect(FIND_FIELD_PROPS).toEqual({ autoComplete: 'off', textContentType: 'none', autoCapitalize: 'none', autoCorrect: false, spellCheck: false });
    const src = readFileSync(join(__dirname, '..', 'src/components/find/find-mode.tsx'), 'utf8');
    expect(src).toMatch(/\{\.\.\.FIND_FIELD_PROPS\}/);
  });
  it('the child name is passed as is: the fallback lives in fill(), not here', () => {
    const src = readFileSync(join(__dirname, '..', 'src/components/find/find-mode.tsx'), 'utf8');
    expect(src).not.toMatch(/your child/);
    expect(src).toMatch(/\{ child: child\.name \}/);
  });
});
