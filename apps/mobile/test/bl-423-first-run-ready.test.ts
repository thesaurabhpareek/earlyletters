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

  it('the recorder is not opened for the person: no capture entry in first run', () => {
    expect(onboarding).not.toMatch(/startCapture|start-capture|\/listen|\/write/);
  });
});

describe('[BL-423] Tonight, empty, shows Speak with no card in front', () => {
  it('Speak is labelled from the existing key and begins the one capture entry', () => {
    expect(en.tonight.speakButton).toBe('Speak');
    expect(tonight).toMatch(/label=\{t\.speakButton\}.*?startCapture\(\{ source: 'speak'/);
  });

  it('cards render only from drafts or a month-ago letter, both empty in a new book', () => {
    expect(tonight).toMatch(/cards\.length > 0 \? \([\s\S]*?\) : monthAgo \? \(/);
    // Named by shape, not by field: #1541 moved the read from room.entries to room.window.
    expect(tonight).toMatch(/resurfaced\(room\?\.\w+ \?\? \[\], today, cards\.length/);
  });

  it('nothing between the prompt and Speak: no card sits above the actions', () => {
    const cardsAt = tonight.indexOf('cards.length > 0 ?');
    const inlineActionsAt = tonight.indexOf('{inlineActions ? actions : null}');
    expect(inlineActionsAt).toBeGreaterThan(0);
    expect(inlineActionsAt).toBeLessThan(cardsAt);
    expect(tonight.indexOf('{inlineActions ? null : actions}')).toBeGreaterThan(cardsAt);
  });

  it('no first-run card or sheet is mounted over Tonight', () => {
    expect(tonight).not.toMatch(/Modal|BottomSheet|Primer|Welcome|BookIsOpen/);
  });
});
