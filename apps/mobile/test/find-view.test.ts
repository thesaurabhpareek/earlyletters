import { describe, expect, it } from 'vitest';
import { excerptRuns, findView, rowLabel } from '../src/components/find/find-view.logic';

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
