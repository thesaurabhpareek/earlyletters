/// <reference types="node" />
/**
 * A book made without a name (NX-31-R3, NX-36 S7 and the name-absent audit): the surfaces #701 did not reach.
 * Tonight's dateline, the Settings Children row, the cover, and the prompts that ask about the name. Fixtures: the
 * fictional family Asha only (CLAUDE.md).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROMPTS } from '@scribe/content';
import { isNameThemed, selectPrompt } from '@scribe/core';
import { describe, expect, it } from 'vitest';
import { coverName, coverSignature } from '../src/components/book/book-cover.logic';
import { childRowTitle, nameEditorError } from '../src/components/child/child-settings.logic';
import { tonightDateline, writeDateline } from '../src/components/tonight/draft-card.logic';
import { copy } from '../src/lib/copy';
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

describe('[NX-36-S13] Write has the same dateline as Tonight', () => {
  const names = ['', '   ', 'Asha', 'Nila'];
  const stages: (string | null)[] = ['7 months', 'Before You', null];
  it('[NX-31-R3] a blank name gives the stage alone on Write: no leading dot, no "your child", spoken the same', () => {
    expect(writeDateline('', '7 months')).toEqual({ text: '7 months', a11y: '7 months' });
    expect(writeDateline('   ', 'Before You')).toEqual({ text: 'Before You', a11y: 'Before You' });
    for (const name of ['', '   ']) {
      for (const stage of ['7 months', 'Before You']) {
        const d = writeDateline(name, stage);
        expect(d.text).not.toMatch(/^\s*·|your child/i);
        expect(d.a11y).not.toMatch(/^\s*[,·]|your child/i);
      }
    }
  });
  it('[NX-31-R3] with no stage Write shows the name, or nothing at all for a blank one (it has no day to fall back to)', () => {
    expect(writeDateline('Asha', null)).toEqual({ text: 'Asha', a11y: 'Asha' });
    expect(writeDateline('', null)).toEqual({ text: '', a11y: '' });
    expect(writeDateline('   ', null)).toEqual({ text: '', a11y: '' });
  });
  it('[NX-36-S13] a named child reads as it did: "Asha · 7 months", spoken "Asha, 7 months"', () => {
    expect(writeDateline('Asha', '7 months')).toEqual({ text: 'Asha · 7 months', a11y: 'Asha, 7 months' });
  });
  it('[NX-36-S13] Write and Tonight say the same words for every name and stage', () => {
    for (const name of names) {
      for (const stage of stages) {
        const tonight = tonightDateline(name, stage, name.trim());
        expect(writeDateline(name, stage)).toEqual(tonight);
      }
    }
  });
  it('[NX-36-S13] the Write screen builds its dateline from that function, draws nothing for an empty one, and has no rule of its own', () => {
    const write = code('app/write.tsx');
    expect(write).toContain('const dateline = writeDateline(child.name, age);');
    expect(write).toContain('{dateline.text ? (');
    expect(write).toContain('accessibilityLabel={dateline.a11y}');
    expect(write).not.toMatch(/\$\{child\.name\} · |childLabel\(/);
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

describe('[NX-31-R3] Settings, the book, Name on a nameless book', () => {
  it('[NX-31-R3] opening the field empty says nothing: this row is how a name is added later', () => {
    expect(nameEditorError('', '')).toBeNull();
  });
  it('[NX-31-R3] typing a name says nothing, and deleting it again returns to the opened state without a warning', () => {
    expect(nameEditorError('', 'N')).toBeNull();
    expect(nameEditorError('', 'Nila')).toBeNull();
    expect(nameEditorError('', '')).toBeNull();
  });
  it('[NX-31-R3] spaces alone, once typed, still say a name is needed', () => {
    expect(nameEditorError('', '   ')).toBe(copy.childrenExtra.edit.nameEmpty);
  });
  it('[NX-31-R3] a named book is unchanged: clearing the name says "Add a name to save." and a name is silent', () => {
    expect(nameEditorError('Asha', 'Asha')).toBeNull();
    expect(nameEditorError('Asha', 'Nila')).toBeNull();
    expect(nameEditorError('Asha', '')).toBe(copy.childrenExtra.edit.nameEmpty);
    expect(nameEditorError('Asha', '  ')).toBe(copy.childrenExtra.edit.nameEmpty);
    expect(copy.childrenExtra.edit.nameEmpty).toBe('Add a name to save.');
  });
  it('[NX-31-R3] the Name editor takes its error line from that rule, not from the bare check', () => {
    const editors = code('components/child/child-editors.tsx');
    expect(editors).toContain('error={nameEditorError(child.name, draft)}');
    expect(editors).not.toContain('check.ok ? null : e.nameEmpty');
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

// packages/content/test/nameless-child.test.ts renders only the prompts a screen can draw, and leaves out the kinds below
// (hard, together, family). This is what keeps them out: every selection a screen makes asks for the same three things.
describe('[NX-31-R3] no screen asks for a hard, together or family prompt', () => {
  const births = ['2026-10-20', '2026-06-01', '2026-02-01', '2025-09-01', '2022-01-01', null, '2027-01-15'];
  const gaps = [null, 0, 1, 4, 5, 6, 40];
  it('[NX-31-R3] no screen asks for a hard, together or family prompt: the input is always hardStretch false, role parent, together false', () => {
    for (const birthday of births) {
      for (const daysSinceLastEntry of gaps) {
        for (const childName of [undefined, '', 'Asha']) {
          for (let shuffle = 0; shuffle < 6; shuffle++) {
            const input = tonightPromptInput({ birthday, today: TODAY, daysSinceLastEntry, recentKeys: [], shuffle, leftKey: 'opening.any.x', shownKeys: ['gap.any.y'], seedTag: 'write', childName });
            // If these change, change SCREEN_ASKS in packages/content/test/nameless-child.test.ts with them.
            expect({ hardStretch: input.hardStretch, role: input.role, together: input.together }).toEqual({ hardStretch: false, role: 'parent', together: false });
            expect(['opening', 'gap']).toContain(selectPrompt(input, PROMPTS).kind);
          }
        }
      }
    }
  });
  it('[NX-31-R3] Another thought on Write draws only opening and gap prompts, press after press', () => {
    for (const birthday of births) {
      for (const daysSinceLastEntry of gaps) {
        let shown: string[] = [];
        for (let press = 1; press <= 30; press++) {
          const r = anotherThought({ birthday, today: TODAY, daysSinceLastEntry, recentKeys: [], shown, press, childName: 'Asha' }, PROMPTS);
          expect(['opening', 'gap']).toContain(r.prompt.kind);
          shown = r.shown;
        }
      }
    }
  });
  it('[NX-31-R3] every selectPrompt call in the app goes through tonightPromptInput, so nothing else sets those flags', () => {
    const files = readdirSync(SRC, { recursive: true, encoding: 'utf8' }).filter((f) => /\.tsx?$/.test(f));
    const calls = files.map((f) => ({ f: f.split('\\').join('/'), text: code(f) })).map(({ f, text }) => ({ f, all: text.match(/\bselectPrompt\(/g)?.length ?? 0, viaInput: text.match(/\bselectPrompt\(tonightPromptInput\(/g)?.length ?? 0 }));
    const callers = calls.filter((c) => c.all > 0);
    expect(callers.map((c) => c.f).sort()).toEqual(['app/(tabs)/index.tsx', 'components/tonight/prompt.logic.ts']);
    for (const c of callers) expect(c.viaInput, c.f).toBe(c.all);
  });
});

describe('[NX-31-R28] the add-book form is not changed: a later book still needs a name', () => {
  it('[NX-31-R28] the form still uses the rule that wants a name', () => {
    expect(code('components/child/add-child-form.logic.ts')).toMatch(/checkChildName/);
    expect(code('components/child/add-child-form.logic.ts')).not.toMatch(/checkFirstRunChildName/);
  });
});
