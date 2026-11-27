/// <reference types="node" />
/**
 * BL-980, NS-16 "Someone else speaks": the From name on Review (docs/product/prd/09-capture.md section 7). The rules
 * run in Node; the hook runs as a plain function with `useState` stubbed and the store's settings in a Map; the screen
 * wiring is read as source, as the other Review tests do. Fictional family Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screenStates } from '@scribe/content';

const h = vi.hoisted(() => ({
  settings: new Map<string, string>(),
  entries: new Map<string, { authorSignsAs?: string }>(),
  /** Every useState slot the hook opened: its first value and every value or updater passed to its setter. */
  slots: [] as { init: unknown; sets: unknown[] }[],
}));
vi.mock('react', () => ({
  useState: (init: unknown) => {
    const slot = { init: typeof init === 'function' ? (init as () => unknown)() : init, sets: [] as unknown[] };
    h.slots.push(slot);
    return [slot.init, (v: unknown) => void slot.sets.push(v)];
  },
}));
vi.mock('@/lib/store', () => ({
  getSetting: (k: string) => h.settings.get(k) ?? null,
  setSetting: (k: string, v: string) => void h.settings.set(k, v),
  deleteSetting: (k: string) => void h.settings.delete(k),
  getEntry: (id: string) => h.entries.get(id) ?? null,
}));
vi.mock('@/lib/first-run/draft', () => ({ clearFirstRunDraft: () => {} }));
vi.mock('../src/lib/auth/apple', () => ({ forgetAppleUser: async () => {}, clearPendingAppleName: async () => {} }));
vi.mock('../src/lib/auth/pending', () => ({ clearPendingEmailRequest: async () => {} }));

import { forgetSignOutLeftovers } from '../src/lib/auth/sign-out-leftovers';
import { forgetFromNames, setSignAsOtherForTest, signAsOtherEnabled, useFromName } from '../src/lib/capture/sign-as-other';
import {
  checkFromName,
  parseDraftName,
  parseRecent,
  parseSignAsOtherFlag,
  rememberName,
  serializeDraftName,
  signatureForKeep,
  SIGN_AS_DRAFT_SETTING,
  SIGN_AS_OTHER_ENV,
  SIGN_AS_OTHER_TAGS,
  SIGN_AS_RECENT_MAX,
  SIGN_AS_RECENT_SETTING,
  SIGN_AS_TOO_LONG,
} from '../src/lib/capture/sign-as-other.logic';
import { removeEverything } from '../src/lib/db/repos/wipe';
import { photoTextSource, searchableViewSql } from '../src/lib/find/sources';
import { nodeDb } from './helpers/node-db';

const APP = join(__dirname, '..');
const src = (p: string) => readFileSync(join(APP, 'src', p), 'utf8');
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

/** A name of `n` code points that a person sees as fewer characters: Devanagari "Nani" repeated (4 code points each). */
const devanagari = (n: number) => 'नानी'.repeat(Math.ceil(n / 4)).slice(0, n);

beforeEach(() => {
  h.settings.clear();
  h.entries.clear();
  setSignAsOtherForTest(null);
});

describe('[NS-16-R6] over thirty refused before upload', () => {
  it('[NS-16-R6] over thirty refused before upload: 31 characters are refused with sign_as_too_long, 30 pass', () => {
    expect(signatureForKeep({ typed: 'N'.repeat(31), parentSignsAs: 'Mama', offered: true })).toEqual({ ok: false, code: SIGN_AS_TOO_LONG });
    expect(signatureForKeep({ typed: 'N'.repeat(30), parentSignsAs: 'Mama', offered: true })).toEqual({ ok: true, authorSignsAs: 'N'.repeat(30), other: 'N'.repeat(30) });
  });

  it('[NS-16-R6] over thirty refused before upload: the count is the database count (code points), not what a person sees', () => {
    const name = devanagari(31);
    expect(Array.from(name)).toHaveLength(31);
    expect(checkFromName(name)).toEqual({ ok: false, code: SIGN_AS_TOO_LONG });
    expect(checkFromName(devanagari(30)).ok).toBe(true);
  });

  it('[NS-16-R6] over thirty refused before upload: never silently cut', () => {
    const s = signatureForKeep({ typed: 'Asha Nani '.repeat(4), parentSignsAs: 'Mama', offered: true });
    expect(s.ok).toBe(false);
  });

  it('[NS-16-R6] over thirty refused before upload: the hook refuses and counts the refusal, so the sheet opens again', () => {
    setSignAsOtherForTest(true);
    h.settings.set(SIGN_AS_DRAFT_SETTING, serializeDraftName('d1', 'N'.repeat(31)));
    h.slots = [];
    const from = useFromName({ draftId: 'd1', keptEntryId: null });
    expect(from.typed).toBe('N'.repeat(31));
    expect(from.refusals).toBe(0);
    expect(from.signatureFor('Mama').ok).toBe(false);
    // The refusal count is the slot that starts at 0; a refused Keep moves it to 1, and that change reopens the sheet.
    const counts = h.slots.filter((s) => s.init === 0);
    expect(counts).toHaveLength(1);
    const step = counts[0].sets.at(-1);
    expect(typeof step === 'function' ? (step as (n: number) => number)(0) : step).toBe(1);
    // An accepted name counts nothing.
    h.slots = [];
    h.settings.set(SIGN_AS_DRAFT_SETTING, serializeDraftName('d1', 'Nani'));
    const ok = useFromName({ draftId: 'd1', keptEntryId: null });
    expect(ok.signatureFor('Mama').ok).toBe(true);
    expect(h.slots.filter((s) => s.init === 0)[0].sets).toEqual([]);
  });

  it('[NS-16-R6] over thirty refused before upload: the From sheet opens again when the refusal count goes up', () => {
    const sheet = code(src('components/capture/from-name.tsx'));
    expect(sheet).toMatch(/React\.useEffect\(\(\) => \{\s*if \(from\.refusals > 0\) setOpen\(true\);\s*\}, \[from\.refusals\]\);/);
  });

  it('[NS-16-R6] over thirty refused before upload: both Keep paths check before anything is written', () => {
    const r = code(src('app/review.tsx'));
    const save = r.slice(r.indexOf('const save = async'), r.indexOf('const keepRecordingOnly'));
    const voice = r.slice(r.indexOf('const keepRecordingOnly'), r.indexOf('trackLetterSaved', r.indexOf('const keepRecordingOnly')));
    for (const [body, write] of [[save, 'saveLetterFromDraft('], [voice, 'saveVoiceOnlyFromDraft(']] as const) {
      const check = body.indexOf('from.signatureFor(child.signsAs)');
      expect(check).toBeGreaterThan(-1);
      expect(body.slice(check)).toMatch(/^from\.signatureFor\(child\.signsAs\);\s*\n\s*if \(!signature\.ok\) return;/);
      expect(check).toBeLessThan(body.indexOf('saving.current = true'));
      expect(check).toBeLessThan(body.indexOf(write));
      expect(body).toContain('authorSignsAs: signature.authorSignsAs');
      expect(body).not.toContain('authorSignsAs: child.signsAs');
    }
  });
});

describe('[NS-16-R1] From is set on Review', () => {
  it('[NS-16-R1] From is set on Review: a typed name signs this letter; empty or spaces sign it as the parent', () => {
    expect(signatureForKeep({ typed: '  Nani ', parentSignsAs: 'Mama', offered: true })).toEqual({ ok: true, authorSignsAs: 'Nani', other: 'Nani' });
    expect(signatureForKeep({ typed: '', parentSignsAs: 'Mama', offered: true })).toEqual({ ok: true, authorSignsAs: 'Mama', other: null });
    expect(signatureForKeep({ typed: '   ', parentSignsAs: 'Mama', offered: true })).toEqual({ ok: true, authorSignsAs: 'Mama', other: null });
  });

  it('[NS-16-R1] From is set on Review: the typed name is kept with its draft and shown, and Keep remembers it', () => {
    setSignAsOtherForTest(true);
    h.settings.set(SIGN_AS_DRAFT_SETTING, serializeDraftName('d1', 'Nani'));
    const from = useFromName({ draftId: 'd1', keptEntryId: null });
    expect(from.offered).toBe(true);
    expect(from.shown('Mama')).toBe('Nani');
    const s = from.signatureFor('Mama');
    expect(s).toEqual({ ok: true, authorSignsAs: 'Nani', other: 'Nani' });
    from.kept(s);
    expect(parseRecent(h.settings.get(SIGN_AS_RECENT_SETTING) ?? null)).toEqual(['Nani']);
    expect(h.settings.has(SIGN_AS_DRAFT_SETTING)).toBe(false);
  });

  it('[NS-16-R1] From is set on Review: a name typed for another draft is not this one', () => {
    expect(parseDraftName(serializeDraftName('d1', 'Nani'), 'd2')).toBe('');
    expect(parseDraftName('not json', 'd1')).toBe('');
  });

  it('[NS-16-R7] any script as typed: Devanagari, Arabic and CJK names are kept exactly (NFC)', () => {
    for (const name of ['नानी', 'جدة', '奶奶', 'Nänï']) {
      const s = signatureForKeep({ typed: name, parentSignsAs: 'Mama', offered: true });
      expect(s).toEqual({ ok: true, authorSignsAs: name.normalize('NFC'), other: name.normalize('NFC') });
    }
  });
});

describe('the flag stays off by default and in production (CPrivO-24)', () => {
  it('[NS-16] flag off by default: only the exact word "on" turns it on', () => {
    for (const raw of [undefined, null, '', 'off', '1', 'true', 'yes', 'onn']) expect(parseSignAsOtherFlag(raw)).toBe(false);
    expect(parseSignAsOtherFlag(' ON ')).toBe(true);
    expect(process.env[SIGN_AS_OTHER_ENV]).toBeUndefined();
    expect(signAsOtherEnabled()).toBe(false);
  });

  it('[NS-16] flag off: no eas.json profile sets it, so no build (production included) turns it on', () => {
    const eas = JSON.parse(readFileSync(join(APP, 'eas.json'), 'utf8')) as { build: Record<string, { env?: Record<string, string> }> };
    expect(Object.keys(eas.build)).toContain('production');
    for (const [name, p] of Object.entries(eas.build)) expect(p.env?.[SIGN_AS_OTHER_ENV], name).toBeUndefined();
    expect(readFileSync(join(APP, 'test', 'g6-production-flags-off.test.ts'), 'utf8')).toContain(`'${SIGN_AS_OTHER_ENV}'`);
  });

  it('[NS-16][PRIV-R20] the flag is tagged child-input', () => {
    expect(SIGN_AS_OTHER_TAGS).toEqual(['child-input']);
  });

  it('[NS-16] flag off: Keep signs as the parent whatever a stale draft holds, and no control is offered', () => {
    h.settings.set(SIGN_AS_DRAFT_SETTING, serializeDraftName('d1', 'Nani'));
    const from = useFromName({ draftId: 'd1', keptEntryId: null });
    expect(from.offered).toBe(false);
    expect(from.typed).toBe('');
    expect(from.shown('Mama')).toBe('Mama');
    const s = from.signatureFor('Mama');
    expect(s).toEqual({ ok: true, authorSignsAs: 'Mama', other: null });
    from.kept(s);
    expect(h.settings.has(SIGN_AS_RECENT_SETTING)).toBe(false);
    expect(signatureForKeep({ typed: 'N'.repeat(40), parentSignsAs: 'Mama', offered: false })).toEqual({ ok: true, authorSignsAs: 'Mama', other: null });
  });
});

describe('[NS-16-R17] no change after Keep', () => {
  it('[NS-16-R17] no change after Keep: a kept letter shows its stored name and offers no control', () => {
    setSignAsOtherForTest(true);
    h.entries.set('e1', { authorSignsAs: 'Nani' });
    const from = useFromName({ draftId: null, keptEntryId: 'e1' });
    expect(from.offered).toBe(false);
    expect(from.shown('Mama')).toBe('Nani');
    expect(from.signatureFor('Mama')).toEqual({ ok: true, authorSignsAs: 'Mama', other: null });
  });

  it('[NS-16-R12] the name is written once: the local upsert never updates author_signs_as on conflict', () => {
    const repo = src('lib/db/repos/entries.ts');
    const onConflict = repo.slice(repo.indexOf('ON CONFLICT(id) DO UPDATE SET'), repo.indexOf('WHERE entries.deleted_at IS NULL', repo.indexOf('ON CONFLICT(id) DO UPDATE SET')));
    expect(onConflict).not.toContain('author_signs_as');
  });
});

describe('names used on this phone', () => {
  it('[NS-16] the list keeps the newest first, each name once, at most 20', () => {
    let list: string[] = [];
    for (let i = 0; i < 25; i += 1) list = rememberName(list, `Asha ${i}`);
    expect(list).toHaveLength(SIGN_AS_RECENT_MAX);
    expect(list[0]).toBe('Asha 24');
    expect(rememberName(['Nani', 'Dadi'], 'Dadi')).toEqual(['Dadi', 'Nani']);
    expect(parseRecent(JSON.stringify(['Nani', 7, '', 'N'.repeat(31), 'Dadi']))).toEqual(['Nani', 'Dadi']);
    expect(parseRecent('{')).toEqual([]);
  });

  it('[NS-16-R15] names list cleared: sign-out forgets the list and any typed name', async () => {
    h.settings.set(SIGN_AS_RECENT_SETTING, JSON.stringify(['Nani']));
    h.settings.set(SIGN_AS_DRAFT_SETTING, serializeDraftName('d1', 'Nani'));
    h.settings.set('appearance', 'dark');
    await forgetSignOutLeftovers();
    expect([...h.settings.keys()]).toEqual(['appearance']);
    expect(() => forgetFromNames()).not.toThrow();
  });

  it('[NS-16-R15] names list cleared: Erase everything takes both keys with every other setting', () => {
    const { db, close } = nodeDb();
    db.exec('CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
    for (const [k, v] of [[SIGN_AS_RECENT_SETTING, '["Nani"]'], [SIGN_AS_DRAFT_SETTING, serializeDraftName('d1', 'Nani')], ['erase.everything.pending', 'x']]) {
      db.run('INSERT INTO settings (key, value) VALUES (?, ?)', k, v);
    }
    removeEverything({ db } as never);
    expect(db.all<{ key: string }>('SELECT key FROM settings').map((r) => r.key)).toEqual(['erase.everything.pending']);
    close();
  });
});

describe('what the From path never does', () => {
  const files = ['lib/capture/sign-as-other.ts', 'lib/capture/sign-as-other.logic.ts', 'components/capture/from-name.tsx'];

  it('[NS-16-R8] the name is not searched: Find reads no signature', () => {
    expect(searchableViewSql([photoTextSource])).not.toMatch(/signs_as/);
    expect(searchableViewSql([])).not.toMatch(/signs_as/);
  });

  it('[NS-16-R4] no contacts, no network: the field reads no Contacts and the path makes no call', () => {
    for (const f of files) {
      const s = code(src(f));
      expect(s, f).not.toMatch(/expo-contacts|Contacts|fetch\(|supabase|XMLHttpRequest|@\/lib\/sync/);
    }
    const field = code(src('components/capture/from-name.tsx'));
    expect(field).toContain('textContentType="none"');
    expect(field).toContain('autoComplete="off"');
  });

  it('[NS-16-R18] an instruction, not an attestation: one line, no checkbox, nothing recorded', () => {
    expect(screenStates.from.ask).toBe('Ask before you record someone else.');
    const field = code(src('components/capture/from-name.tsx'));
    expect(field).toContain('{w.ask}');
    expect(field).not.toMatch(/Checkbox|Switch|ChoiceGroup|AgreementRow|agreement|consent|accessibilityRole="checkbox"/i);
    for (const f of files) expect(code(src(f)), f).not.toMatch(/agreements|recordConsent|consent/i);
  });

  it('[NS-16-R5] never invites a child: no line on the From path asks a child or sibling to speak', () => {
    for (const line of Object.values(screenStates.from)) expect(line).not.toMatch(/invite|child|sibling|kid|speaker|\{child\}|family can add/i);
  });

  it('[NS-16][PRIV-R10] the name is never logged or tracked', () => {
    for (const f of files) expect(code(src(f)), f).not.toMatch(/console\.|track\(|trackLetter|analytics|Sentry|log\(/);
  });
});
