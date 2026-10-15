import { describe, expect, it } from 'vitest';
import { countLine, fixesInForce, rowShows, setAsideAtSave, showViewControl, viewFromSetting } from './review-view.logic';

describe('review view (D-086)', () => {
  it('defaults to small fixes, and only an explicit exact setting changes that', () => {
    expect(viewFromSetting(null)).toBe('fixes');
    expect(viewFromSetting('fixes')).toBe('fixes');
    expect(viewFromSetting('exact')).toBe('exact');
  });

  it('round-trips: Exactly as said and back keeps every fix (derived state, nothing thrown away)', () => {
    const applied = [{ n: 1 }, { n: 2 }, { n: 3 }];
    expect(fixesInForce('exact', applied)).toEqual([]);
    expect(fixesInForce('fixes', applied)).toEqual(applied);
    // Toggling does not mutate what the screen holds.
    expect(applied).toHaveLength(3);
  });

  it('counts the fixes set aside by Exactly as said once, at save', () => {
    expect(setAsideAtSave('exact', [1, 2, 3])).toBe(3);
    expect(setAsideAtSave('fixes', [1, 2, 3])).toBe(0);
  });

  it('shows the view control only when something was proposed', () => {
    expect(showViewControl(0)).toBe(false);
    expect(showViewControl(2)).toBe(true);
  });

  it('has three honest zeros and never says "nothing needed fixing" for a language without fix rules', () => {
    expect(countLine({ view: 'fixes', applied: 2, proposed: 2, hasFixRules: true })).toBe('count');
    expect(countLine({ view: 'fixes', applied: 0, proposed: 0, hasFixRules: true })).toBe('none');
    expect(countLine({ view: 'fixes', applied: 0, proposed: 3, hasFixRules: true })).toBe('afterUndo');
    expect(countLine({ view: 'fixes', applied: 0, proposed: 0, hasFixRules: false })).toBe('noRules');
    expect(countLine({ view: 'exact', applied: 4, proposed: 4, hasFixRules: true })).toBe('exact');
  });
});

describe('what a fix row shows', () => {
  it('shows a taken-out sound struck through', () => {
    expect(rowShows({ original: ' um', replacement: '' })).toEqual({ kind: 'struck', text: 'um' });
  });
  it('shows a name spelled the way the family spells it as a change', () => {
    expect(rowShows({ original: 'Usher', replacement: 'Asha' })).toEqual({ kind: 'change', from: 'Usher', to: 'Asha' });
  });
  it('shows added punctuation as an addition', () => {
    expect(rowShows({ original: '', replacement: '.' })).toEqual({ kind: 'added', text: '.' });
    expect(rowShows({ original: 'today', replacement: 'today.' })).toEqual({ kind: 'added', text: 'today.' });
  });
  it('shows a grammar slip as a change', () => {
    expect(rowShows({ original: 'she have', replacement: 'she has' })).toEqual({ kind: 'change', from: 'she have', to: 'she has' });
  });
  it('shows a bare break as a mark', () => {
    expect(rowShows({ original: ' ', replacement: '\n\n' })).toEqual({ kind: 'mark' });
  });
});
