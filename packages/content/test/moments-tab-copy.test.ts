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
const SETTINGS_KEYS = ['momentsTab.state.denied', 'momentsTab.state.openSettings', 'momentsTab.state.restricted'];

describe('[NS-53-R159] Moments strings use the glossary and say no more than the spec', () => {
  it('[NS-53-R159] only the tab name says Moments; no memory, album, caption or machine words', () => {
    for (const l of ALL) {
      if (!NAME_KEYS.includes(l.path)) expect(l.text, l.path).not.toMatch(/\bmoments?\b/i);
      expect(l.text, l.path).not.toMatch(/\b(memory|memories|album|AI|auto|automatic|smart|generated|caption\w*|describe\w*|suggest\w*)\b/i);
      expect(l.text, l.path).not.toMatch(/\b(we|our|ours|allow|access)\b/i);
      expect(l.text, l.path).not.toMatch(/\b(take|entry|draft|pack|raw_transcript)\b/i);
    }
  });
  it('[NS-53-R159] "Settings" appears only in the denied and restricted lines', () => {
    for (const l of ALL) if (!SETTINGS_KEYS.includes(l.path)) expect(l.text, l.path).not.toMatch(/settings/i);
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
  it('[NS-53-R160] the example caption is exactly "An example"', () => {
    expect(momentsTabCopy.card.example).toBe('An example');
  });
  it('[NS-53-R159] no state line says "nothing yet", apologises or names a reason for a restriction', () => {
    for (const l of leaves(momentsTabCopy.state)) {
      expect(l.text, l.path).not.toMatch(/nothing yet|sorry|unfortunately|\bwe\b/i);
    }
    expect(momentsTabCopy.state.restricted).not.toMatch(/parental|screen time|school|admin|manager/i);
  });
});
