/// <reference types="node" />
/**
 * [BL-423] First run ends ready to speak (J01-13, J01-14). Council ruling: the finish button keeps "Write the first
 * one", two taps are accepted, and the recorder is NOT opened for the person (that would skip the first-use primer,
 * NS-39-R10, and start capture without a tap). What must hold: the finish step lands on Tonight, and Tonight, empty,
 * shows Speak with no card in front of it. Node cannot load React Native, so the screens are checked in their source.
 * Fixtures: the fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { en } from '@scribe/content';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1');

const onboarding = code('app/onboarding.tsx');
const tonight = code('app/(tabs)/index.tsx');
const finishBody = () => {
  const from = onboarding.indexOf('const finish = () =>');
  return onboarding.slice(from, onboarding.indexOf('\n  };', from));
};

describe('[BL-423] the finish step ends on Tonight and never starts capture', () => {
  it('keeps the button words the council kept', () => {
    expect(en.onboarding.finish.cta).toBe('Write the first one');
  });

  it('finish hands to Tonight (the "/" tab), not to a recorder or a card', () => {
    const body = finishBody();
    expect(body).toContain("router.replace('/')");
    expect(body.match(/router\.\w+\(/g)).toEqual(['router.replace(']);
  });

  it('[BL-1615] finish calls only the allowlisted functions: no helper that could open the recorder', () => {
    const calls = new Set(
      (finishBody().match(/(?:[\w$]+\.)*[\w$]+(?=\s*\()/g) ?? []).filter(
        (c) => !['if', 'for', 'while', 'switch', 'function'].includes(c),
      ),
    );
    const allowed = new Set([
      'finishMayMakeBook',
      'clearDraft', // BL-1816: deletes the kept first-run answers; opens nothing
      'hasSessionState',
      'addChildren',
      'firstRunBookNames',
      'setActiveChildId',
      'getActiveChildId',
      'track',
      'ordinalOf',
      'router.replace',
      'map',
      'signsAs.trim',
    ]);
    expect([...calls].filter((c) => !allowed.has(c))).toEqual([]);
  });

  it('[BL-1615] first run imports no capture entry (a helper file could start one)', () => {
    const froms = [...onboarding.matchAll(/\bfrom\s+'([^']+)'/g)].map((m) => m[1]);
    expect(froms.length).toBeGreaterThan(10);
    expect(froms.filter((f) => /capture|listen|write|photo-start/.test(f))).toEqual([]);
  });

  it('the recorder is not opened for the person: no capture entry in first run', () => {
    expect(onboarding).not.toMatch(/startCapture|start-capture|\/listen|\/write/);
  });
});

describe('[BL-423] Tonight, empty, shows Speak with no card in front', () => {
  it('Speak is labelled from the existing key and begins the one capture entry', () => {
    expect(en.tonight.speakButton).toBe('Speak');
    // [BL-1617] Within one <Button>, across any line breaks, so a reflow passes and a swapped label fails.
    expect(tonight).toMatch(
      /<Button\b(?:(?!<Button\b)[\s\S])*?label=\{t\.speakButton\}(?:(?!<Button\b)[\s\S])*?startCapture\(\{ source: 'speak'/,
    );
  });

  it('cards render only from drafts or a month-ago letter, both empty in a new book', () => {
    // BL-963: the one registry picks the slip (waiting drafts, else a past letter); Home renders only those two.
    expect(tonight).toMatch(/slip\?\.type === 'waiting' \? \([\s\S]*?\) : slip\?\.type === 'pastLetter' \? \(/);
    // Named by shape, not by field: #1541 moved the read from room.entries to room.window.
    expect(tonight).toMatch(/chooseSlip\(\{ cards, window: room\?\.\w+ \?\? \[\], today/);
  });

  it('nothing between the prompt and Speak: no card sits above the actions', () => {
    const cardsAt = tonight.indexOf("{slip?.type === 'waiting' ? (");
    const inlineActionsAt = tonight.indexOf('{inlineActions ? actions : null}');
    expect(inlineActionsAt).toBeGreaterThan(0);
    expect(inlineActionsAt).toBeLessThan(cardsAt);
    expect(tonight.indexOf('{inlineActions ? null : actions}')).toBeGreaterThan(cardsAt);
  });

  it('[BL-1614] only the known components are mounted on Tonight: no card or sheet over it', () => {
    const tags = new Set([...tonight.matchAll(/(?<![\w$])<([A-Z][\w.]*)/g)].map((m) => m[1]));
    const allowed = new Set([
      'Redirect',
      'SafeAreaView',
      'Lamp',
      'ScrollView',
      'View',
      'Animated.View',
      'Text',
      'Button',
      'ButtonRow',
      'PlusLine',
      'PhotoStartButton',
      'QuietDayInline',
      'HeldRow',
      'DraftCard',
      'CardSource',
      'ResurfacedCard',
      // NS-14 (BL-941): drawn only with two or more books, so never on a first run's one book; its sheet opens on a tap.
      'ChildSwitcher',
    ]);
    expect([...tags].filter((x) => !allowed.has(x))).toEqual([]);
  });
});
