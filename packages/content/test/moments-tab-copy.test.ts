// Moments tab strings (PR 12a). The general rules run on every `features` leaf in rules.test.ts; these are the Moments ones.
import { describe, expect, it } from 'vitest';
import { momentsTabCopy } from '../src';

function leaves(o: unknown, path = 'momentsTab'): { path: string; text: string }[] {
  if (typeof o === 'string') return [{ path, text: o }];
  if (o && typeof o === 'object') return Object.entries(o).flatMap(([k, v]) => leaves(v, `${path}.${k}`));
  return [];
}
const ALL = leaves(momentsTabCopy);
// "Moments" is the tab name, allowed only in these two keys.
const NAME_KEYS = ['momentsTab.tab.label', 'momentsTab.heading.title'];

describe('[NS-53-R159] Moments strings use the glossary and say no more than the spec', () => {
  it('[NS-53-R159] only the tab name says Moments; no memory, album, caption or machine words', () => {
    for (const l of ALL) {
      if (!NAME_KEYS.includes(l.path)) expect(l.text, l.path).not.toMatch(/\bmoments?\b/i);
      expect(l.text, l.path).not.toMatch(/\b(memory|memories|album|AI|auto|automatic|smart|generated|caption\w*|describe\w*|suggest\w*)\b/i);
      expect(l.text, l.path).not.toMatch(/\b(we|our|ours|allow|access)\b/i);
      expect(l.text, l.path).not.toMatch(/\b(take|entry|draft|pack|raw_transcript)\b/i);
    }
  });
  it('[NS-53-R159] placeholders are only the ones the spec names and no string counts or compares', () => {
    for (const l of ALL) {
      for (const m of l.text.matchAll(/\{(\w+)\}/g)) expect(['child', 'app', 'year', 'place', 'holiday']).toContain(m[1]);
      expect(l.text, l.path).not.toMatch(/\d|\b(best|most|more|streak|points|badge)\b/i);
    }
  });
  it('[NS-53-R159] the reason list is the closed list of spec 6.4a, fifteen lines', () => {
    expect(Object.keys(momentsTabCopy.reason)).toEqual(['marked', 'birthday', 'monthDay', 'kept', 'heart', 'video', 'day', 'year', 'run', 'picked', 'place', 'holiday', 'first', 'letter', 'question']);
  });
  // monthDay and heart carry the words of council ruling CDesO-18 (BL-1557, batch 6), not spec 6.4a's drafts.
  it('[NS-53-R159] the reason lines are word for word the strings of spec 6.4a, with the two council rulings', () => {
    expect(momentsTabCopy.reason).toEqual({
      marked: 'A day you marked',
      birthday: "On {child}'s birthday",
      monthDay: 'The day of the month {child} was born',
      kept: 'A day you kept close',
      heart: 'Pictures you marked as favorites',
      video: 'A video from this day',
      day: 'Pictures from this day',
      year: 'Pictures from this day in {year}',
      run: 'Pictures from these days',
      picked: 'Pictures you picked before',
      place: 'Pictures from {place}',
      holiday: 'On {holiday}',
      first: 'A first you marked',
      letter: 'A letter from this day',
      question: 'A question to start from',
    });
  });
  it('[NS-53-R159] no Settings word in any Moments string yet (state lines wait for 12b)', () => {
    for (const l of ALL) expect(l.text, l.path).not.toMatch(/settings/i);
  });
  it('[NS-53-R160] the example caption is exactly "An example"', () => {
    expect(momentsTabCopy.card.example).toBe('An example');
  });
});
