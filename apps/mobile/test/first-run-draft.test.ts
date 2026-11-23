/**
 * [BL-1816] First-run answers are kept as she goes, so a relaunch resumes the step. The pure rules in
 * lib/first-run/draft.logic.ts run against an in-memory settings map standing in for the device settings.
 * The order of the steps is unchanged (D-169). Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  DRAFT_STEPS,
  FIRST_RUN_DRAFT_SETTING,
  draftIsEmpty,
  parseDraft,
  resumeStep,
  serializeDraft,
  type DraftStep,
  type FirstRunDraft,
} from '../src/lib/first-run/draft.logic';

const src = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
const answers: Record<DraftStep, Partial<FirstRunDraft>> = {
  welcome: {},
  promise: {},
  child: { names: ['Asha'], birthday: '2026-03-14' },
  signsAs: { names: ['Asha'], birthday: '2026-03-14', signsAs: 'Mama' },
  finish: { names: ['Asha'], birthday: '2026-03-14', signsAs: 'Mama' },
};
const draftAt = (step: DraftStep): FirstRunDraft => ({ step, names: [''], expecting: false, birthday: null, dueDate: null, signsAs: '', ...answers[step] });

/** One launch: reads the stored draft the way first run does, and returns the step and answers it opens with. */
const relaunch = (settings: Map<string, string>, over: { start?: DraftStep; serverFeatures?: boolean; hasSession?: boolean } = {}) => {
  const draft = parseDraft(settings.get(FIRST_RUN_DRAFT_SETTING) ?? null);
  const step = resumeStep({ draft, start: over.start ?? 'welcome', serverFeatures: over.serverFeatures ?? false, hasSession: over.hasSession ?? false });
  return { step, draft };
};

describe('[BL-1816] a relaunch after each step resumes at that step with the answers kept', () => {
  for (const step of DRAFT_STEPS.slice(1)) {
    it(`after ${step}: opens on ${step} with every answer given so far`, () => {
      const settings = new Map<string, string>();
      settings.set(FIRST_RUN_DRAFT_SETTING, serializeDraft(draftAt(step)));
      const r = relaunch(settings);
      expect(r.step).toBe(step);
      expect(r.draft).toEqual(draftAt(step));
    });
  }

  it('with no draft, first run opens where the build opens it (the old behaviour)', () => {
    expect(relaunch(new Map()).step).toBe('welcome');
    expect(relaunch(new Map(), { start: 'promise', serverFeatures: true, hasSession: true }).step).toBe('promise');
  });

  it('twins and a due date are kept', () => {
    const d: FirstRunDraft = { step: 'child', names: ['Asha', 'Asha B'], expecting: true, birthday: null, dueDate: '2027-01-20', signsAs: '' };
    expect(parseDraft(serializeDraft(d))).toEqual(d);
  });

  it('the date of birth is never pre-set (D-087): an empty date stays empty, a bad one is dropped', () => {
    expect(parseDraft(serializeDraft(draftAt('child')))?.birthday).toBe('2026-03-14');
    expect(parseDraft(serializeDraft(draftAt('promise')))?.birthday).toBeNull();
    expect(parseDraft(JSON.stringify({ ...draftAt('child'), birthday: 'today' }))?.birthday).toBeNull();
    expect(parseDraft(JSON.stringify({ ...draftAt('child'), birthday: 20260314 }))?.birthday).toBeNull();
  });

  it('a broken or foreign draft is no draft', () => {
    for (const raw of [null, '', 'not json', '[]', '"x"', JSON.stringify({ step: 'elsewhere' }), JSON.stringify({ names: ['Asha'] })]) {
      expect(parseDraft(raw), String(raw)).toBeNull();
    }
  });

  it('names are capped at six and trimmed to the field limit', () => {
    const d = parseDraft(JSON.stringify({ ...draftAt('child'), names: Array.from({ length: 9 }, (_, i) => `Asha ${i}`) }));
    expect(d?.names).toHaveLength(6);
    expect(parseDraft(JSON.stringify({ ...draftAt('child'), names: [] }))?.names).toEqual(['']);
  });

  it('the welcome with nothing typed is not worth keeping', () => {
    expect(draftIsEmpty(draftAt('welcome'))).toBe(true);
    expect(draftIsEmpty(draftAt('promise'))).toBe(false);
    expect(draftIsEmpty({ ...draftAt('welcome'), names: ['A'] })).toBe(false);
  });
});

describe('[BL-1816, D-169] where a resume may land', () => {
  it('a signed-in start is never sent back to the welcome or promise by an older step', () => {
    expect(resumeStep({ draft: draftAt('welcome'), start: 'promise', serverFeatures: true, hasSession: true })).toBe('promise');
    expect(resumeStep({ draft: draftAt('signsAs'), start: 'promise', serverFeatures: true, hasSession: true })).toBe('signsAs');
  });

  it('sign-in first with no session: the account step is not skipped, the answers are still kept', () => {
    const r = resumeStep({ draft: draftAt('signsAs'), start: 'welcome', serverFeatures: true, hasSession: false });
    expect(r).toBe('welcome');
    expect(parseDraft(serializeDraft(draftAt('signsAs')))?.names).toEqual(['Asha']);
  });

  it('the step order is exactly the one D-169 locked', () => {
    expect([...DRAFT_STEPS]).toEqual(['welcome', 'promise', 'child', 'signsAs', 'finish']);
    expect(src('app/onboarding.tsx')).toMatch(/const ORDER: Step\[\] = \['welcome', 'promise', 'child', 'signsAs', 'finish'\];/);
  });
});

describe('[BL-1816] wiring: kept on this phone, in the same device settings, and cleared when done', () => {
  const onboarding = src('app/onboarding.tsx');
  it('reads the draft once, writes it on every change, and clears it when the book is made', () => {
    expect(onboarding).toMatch(/const \[saved\] = useState\(\(\) => readDraft\(\)\)/);
    expect(onboarding).toMatch(/setSetting\(FIRST_RUN_DRAFT_SETTING, serializeDraft\(draft\)\)/);
    expect(onboarding).toMatch(/\[step, names, expecting, birthday, dueDate, signsAs\]/);
    expect(onboarding).toMatch(/booksMade\.current = true;\n\s*clearDraft\(\);/);
  });

  it('uses the settings store only: no sync, no analytics, no log, no new store', () => {
    const code = src('lib/first-run/draft.logic.ts').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    expect(code).not.toMatch(/analytics|track\(|console\.|outbox|sync|AsyncStorage|SecureStore|expo-file-system/);
    expect([...code.matchAll(/from '([^']+)'/g)].map((m) => m[1])).toEqual(['@scribe/core']);
    expect(onboarding).not.toMatch(/track\('[a-z_]*draft/);
  });

  it('no date is chosen for her: the birthday state still starts empty when there is no draft', () => {
    expect(onboarding).toMatch(/useState<string \| null>\(saved\?\.birthday \?\? null\)/);
  });
});
