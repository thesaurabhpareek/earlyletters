/// <reference types="node" />
/**
 * A book made without a name (NX-31-R3, NX-36 S7 and the name-absent audit): the surfaces #701 did not reach.
 * Tonight's dateline, the Settings Children row, the cover, and the prompts that ask about the name. Fixtures: the
 * fictional family Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROMPTS } from '@scribe/content';
import { isNameThemed, selectPrompt } from '@scribe/core';
import { describe, expect, it } from 'vitest';
import { coverName, coverSignature } from '../src/components/book/book-cover.logic';
import { childRowTitle } from '../src/components/child/child-settings.logic';
import { tonightDateline } from '../src/components/tonight/draft-card.logic';
import { anotherThought, tonightPromptInput } from '../src/components/tonight/prompt.logic';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const TODAY = '2026-11-09';
const DAY_FALLBACK = 'Monday 9 November';

describe('[NX-36-S7] Tonight dateline for a nameless child', () => {
  it('[NX-31-R3] a blank name leaves the name and the dot out: the stage alone', () => {
    expect(tonightDateline('', '7 months', DAY_FALLBACK)).toEqual({ text: '7 months', a11y: '7 months' });
    expect(tonightDateline('   ', 'Before You', DAY_FALLBACK)).toEqual({ text: 'Before You', a11y: 'Before You' });
  });
  it('[NX-31-R3] a named child reads as before, and no stage still falls back to the day', () => {
    expect(tonightDateline('Asha', '7 months', DAY_FALLBACK)).toEqual({ text: 'Asha · 7 months', a11y: 'Asha, 7 months' });
    expect(tonightDateline('', null, DAY_FALLBACK)).toEqual({ text: DAY_FALLBACK, a11y: DAY_FALLBACK });
  });
});

describe('[NX-36-S7] Settings, Children row for a nameless child', () => {
  it('[NX-31-R3] a blank name shows the fallback with a capital; a name shows as stored', () => {
    expect(childRowTitle('')).toBe('Your child');
    expect(childRowTitle('  ')).toBe('Your child');
    expect(childRowTitle('Asha')).toBe('Asha');
  });
  it('[NX-31-R3] the Settings home titles each row with the helper, never the raw name', () => {
    const home = code('app/settings/index.tsx');
    expect(home).toContain('title={childRowTitle(ch.name)}');
    expect(home).not.toContain('title={ch.name}');
  });
});

describe('[NX-36-S7] BookCover with an empty name', () => {
  it('[NX-31-R3] sets no name lines on the front or the flyleaf, so the cover is the mark and the foot line', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      for (const state of ['closed', 'open'] as const) {
        expect(coverName('', size, state).lines).toEqual([]);
        expect(coverName('   ', size, state).lines).toEqual([]);
      }
    }
  });
  it('[NX-31-R3] the signature still sets on a nameless cover', () => {
    expect(coverSignature('From Mama', 'sm').lines).toEqual(['From Mama']);
  });
  it('[NX-31-R3] the cover draws no placeholder text for a blank name (the words "Your child\'s book" belong to the band title and empty-book card)', () => {
    const src = code('components/book/book-cover.tsx');
    expect(src).not.toMatch(/childLabel|childFallback|child's book/i);
  });
});

describe('[NX-31-R3] prompts that ask about the name are skipped for a nameless child', () => {
  const births = ['2026-10-20', '2026-06-01', '2026-02-01', '2025-09-01', null, '2027-01-15'];
  it('[NX-31-R3] Tonight never draws a name prompt when the name is blank, at any age, shuffle or night', () => {
    for (const birthday of births) {
      for (let shuffle = 0; shuffle < 40; shuffle++) {
        const input = tonightPromptInput({ birthday, today: TODAY, daysSinceLastEntry: 1, recentKeys: [], shuffle, leftKey: null, childName: '' });
        expect(isNameThemed(selectPrompt(input, PROMPTS).key)).toBe(false);
      }
    }
  });
  it('[NX-31-R3] Another thought on Write never draws one either', () => {
    for (const birthday of births) {
      let shown: string[] = [];
      for (let press = 1; press <= 25; press++) {
        const r = anotherThought({ birthday, today: TODAY, daysSinceLastEntry: 1, recentKeys: [], shown, press, childName: '' }, PROMPTS);
        expect(isNameThemed(r.prompt.key)).toBe(false);
        shown = r.shown;
      }
    }
  });
  it('[NX-31-R3] a named child still meets them, and the input carries the flag only for a blank name', () => {
    const args = { birthday: '2026-10-20', today: TODAY, daysSinceLastEntry: 1, recentKeys: [], shuffle: 0, leftKey: null };
    expect(tonightPromptInput({ ...args, childName: 'Asha' }).childNameBlank).toBeUndefined();
    expect(tonightPromptInput({ ...args }).childNameBlank).toBeUndefined();
    expect(tonightPromptInput({ ...args, childName: ' ' }).childNameBlank).toBe(true);
    const seen = new Set<string>();
    for (let shuffle = 0; shuffle < 300; shuffle++) seen.add(selectPrompt(tonightPromptInput({ ...args, shuffle, childName: 'Asha' }), PROMPTS).key);
    expect([...seen].some(isNameThemed)).toBe(true);
  });
  it('[NX-31-R3] the screens pass the stored name to the prompt input', () => {
    expect(code('app/(tabs)/index.tsx')).toContain('childName }), PROMPTS)');
    expect(code('app/write.tsx')).toContain('childName: child.name');
  });
});

describe('[NX-31-R28] the add-book form is not changed: a later book still needs a name', () => {
  it('[NX-31-R28] the form still uses the rule that wants a name', () => {
    expect(code('components/child/add-child-form.logic.ts')).toMatch(/checkChildName/);
    expect(code('components/child/add-child-form.logic.ts')).not.toMatch(/checkFirstRunChildName/);
  });
});
