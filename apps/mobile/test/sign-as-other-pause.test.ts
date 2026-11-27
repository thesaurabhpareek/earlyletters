/// <reference types="node" />
/**
 * NS-16 remote pause (BL-980, GAP-LOG A G-18; review B finding 5 on #2093, review A finding 1 on #2179):
 * `killSwitches.signAsOther` in the signed config already on the phone hides the From control even with the build
 * flag on. It only hides: a draft that already carries a typed name keeps that name as its signature at Keep, shown
 * as plain text and not editable (as a kept letter's name is, NS-16-R17); a draft with no typed name signs as the
 * parent, as before. It never stops Keep and never turns the control on, a config that cannot be read is not paused
 * (fail-open, as every pause), and the config is read only with the flag on. Keep here is the store's own Keep (real
 * SQLite, node:sqlite) fed the signature Review's hook gives, as review.tsx does. Fictional Asha family only.
 *
 * Mutants this file was written to catch: `signAsOtherOffered` ignores the pause (the build flag alone), and the
 * pause signs every draft as the parent (`signatureForKeep` ignores `paused`, the head before this change, which also
 * dropped the typed name at Keep), and `kept()` deleting `signAs.draft` whatever draft it names, so keeping draft B
 * under the pause took the name typed for draft A, which then signed as the parent (review A and B finding 1 at
 * 9b62a26d5 on #2179).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import { nodeDb } from './helpers/node-db';

vi.mock('react', () => ({ useState: (init: unknown) => [typeof init === 'function' ? (init as () => unknown)() : init, () => {}] }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { setSignAsOtherForTest, setSignAsOtherRemoteForTest, signAsOtherOffered, useFromName } = await import('../src/lib/capture/sign-as-other');
const { parseRecent, serializeDraftName, signAsOtherPaused, SIGN_AS_DRAFT_SETTING, SIGN_AS_RECENT_SETTING } = await import(
  '../src/lib/capture/sign-as-other.logic'
);

let reads = 0;
const config = (killSwitches: Record<string, unknown> | null) => () => ({
  getRemoteConfig: () => {
    reads += 1;
    return { killSwitches };
  },
});

let db: SqlDb;
let close: () => void = () => {};
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;

beforeEach(() => {
  store.closeStore();
  const h = nodeDb();
  db = h.db;
  close = h.close;
  expect(store.openStore({ open: () => ({ db, close: () => {} }), now: () => '2026-10-03T09:00:00.000Z', newId }).ok).toBe(true);
  reads = 0;
  setSignAsOtherForTest(true);
  setSignAsOtherRemoteForTest(config({ signAsOther: false }));
});
afterEach(() => {
  store.closeStore();
  close();
  setSignAsOtherForTest(null);
  setSignAsOtherRemoteForTest(null);
});

const slot = () => db.get<{ value: string }>('SELECT value FROM settings WHERE key = ?', SIGN_AS_DRAFT_SETTING)?.value ?? null;
const ashaBook = () => store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
const spokenDraft = (childId = ashaBook()) =>
  store.createDraft({ childId, captureMode: 'spoken', promptKey: null, audioUri: 'file:///rec/take-1.m4a', audioDurationMs: 600, typedText: null });
const paused = () => setSignAsOtherRemoteForTest(config({ signAsOther: true }));

/** Review's Keep (review.tsx): the hook's signature, refused before anything is written, then the store, then kept(). */
function keepOnReview(draft: ReturnType<typeof spokenDraft>, from: ReturnType<typeof useFromName>) {
  const signature = from.signatureFor('Mama');
  expect(signature.ok).toBe(true); // the pause never stops Keep
  if (!signature.ok) return null;
  const entry = store.saveVoiceOnlyFromDraft(draft, { childId: draft.childId!, authorSignsAs: signature.authorSignsAs, inBook: true, engineVersion: 1 });
  from.kept(signature);
  return store.getEntry(entry.id);
}

describe('[NS-16][G-18] killSwitches.signAsOther hides the From control and never takes a typed name away', () => {
  it('[NS-16][G-18] with the flag on and no pause the control is offered', () => {
    expect(signAsOtherOffered()).toBe(true);
    const from = useFromName({ draftId: 'd1', keptEntryId: null });
    expect(from.offered).toBe(true);
    expect(from.paused).toBe(false);
  });

  it('[NS-16][G-18] paused: a draft that already carries a typed name keeps it as its signature at Keep, shown and not editable', () => {
    const d = spokenDraft();
    store.setSetting(SIGN_AS_DRAFT_SETTING, serializeDraftName(d.id, 'Nani'));
    paused();
    const from = useFromName({ draftId: d.id, keptEntryId: null });
    expect(from.offered).toBe(false); // no control: the sheet draws the From line as plain text
    expect(from.paused).toBe(true);
    expect(from.typed).toBe('Nani');
    expect(from.shown('Mama')).toBe('Nani'); // what Review shows is what Keep writes
    from.setTyped('Dada'); // the hidden control cannot change it
    expect(slot()).toBe(serializeDraftName(d.id, 'Nani'));
    expect(from.signatureFor('Mama')).toEqual({ ok: true, authorSignsAs: 'Nani', other: 'Nani' });
    const kept = keepOnReview(d, from);
    expect(kept?.authorSignsAs).toBe('Nani'); // the letter says Nani spoke, not the parent
    expect(store.getDraft(d.id)).toBeNull();
    expect(slot()).toBeNull(); // the draft's copy went with the draft
    expect(parseRecent(store.getSetting(SIGN_AS_RECENT_SETTING))).toEqual(['Nani']); // a kept name, as with the control
  });

  it('[NS-16][G-18] control: paused, a draft with no typed name signs as the parent', () => {
    const d = spokenDraft();
    paused();
    const from = useFromName({ draftId: d.id, keptEntryId: null });
    expect(from.offered).toBe(false);
    expect(from.typed).toBe('');
    expect(from.shown('Mama')).toBe('Mama');
    expect(from.signatureFor('Mama')).toEqual({ ok: true, authorSignsAs: 'Mama', other: null });
    expect(keepOnReview(d, from)?.authorSignsAs).toBe('Mama');
    expect(store.getSetting(SIGN_AS_RECENT_SETTING)).toBeNull();
  });

  it('[NS-16][G-18] paused: a name typed for another draft is not this one\'s, so this draft signs as the parent', () => {
    const d = spokenDraft();
    store.setSetting(SIGN_AS_DRAFT_SETTING, serializeDraftName('another-draft', 'Dada'));
    paused();
    const from = useFromName({ draftId: d.id, keptEntryId: null });
    expect(from.typed).toBe('');
    expect(keepOnReview(d, from)?.authorSignsAs).toBe('Mama');
  });

  /** "Nani" typed for draft A while the control is offered, then draft B kept (paused or not): A's name must survive. */
  function keepOtherDraftFirst(pause: boolean) {
    const childId = ashaBook();
    const a = spokenDraft(childId);
    const b = spokenDraft(childId);
    useFromName({ draftId: a.id, keptEntryId: null }).setTyped('Nani');
    expect(slot()).toBe(serializeDraftName(a.id, 'Nani'));
    if (pause) paused();
    const onB = useFromName({ draftId: b.id, keptEntryId: null });
    expect(onB.paused).toBe(pause);
    expect(onB.typed).toBe('');
    expect(keepOnReview(b, onB)?.authorSignsAs).toBe('Mama');
    expect(slot()).toBe(serializeDraftName(a.id, 'Nani')); // mutant: B's kept() deletes the slot whatever draft it names
    const onA = useFromName({ draftId: a.id, keptEntryId: null });
    expect(onA.paused).toBe(pause);
    expect(onA.typed).toBe('Nani');
    expect(onA.shown('Mama')).toBe('Nani');
    expect(keepOnReview(a, onA)?.authorSignsAs).toBe('Nani');
    expect(slot()).toBeNull(); // A's own Keep takes its name
  }

  it('[NS-16][G-18] paused: keeping another draft leaves the name typed for this one, which it still shows and keeps', () => {
    keepOtherDraftFirst(true);
  });

  it('[NS-16][G-18] control: with the control offered, keeping another draft leaves this draft\'s typed name too', () => {
    keepOtherDraftFirst(false);
  });

  it('[NS-16][G-18][NS-16-R6] paused: a typed name over 30 cannot be put right with the control hidden, so Keep is not refused and signs as the parent, never a cut name', () => {
    const d = spokenDraft();
    store.setSetting(SIGN_AS_DRAFT_SETTING, serializeDraftName(d.id, 'N'.repeat(31)));
    paused();
    const from = useFromName({ draftId: d.id, keptEntryId: null });
    expect(from.shown('Mama')).toBe('Mama');
    expect(keepOnReview(d, from)?.authorSignsAs).toBe('Mama');
    expect(from.refusals).toBe(0);
  });

  it('[NS-16][G-18] the pause never turns the control on: flag off stays off, a typed name is not used, and the config is not read', () => {
    const d = spokenDraft();
    store.setSetting(SIGN_AS_DRAFT_SETTING, serializeDraftName(d.id, 'Nani'));
    setSignAsOtherForTest(false);
    setSignAsOtherRemoteForTest(config({ signAsOther: false }));
    const from = useFromName({ draftId: d.id, keptEntryId: null });
    expect(from.offered).toBe(false);
    expect(from.paused).toBe(false);
    expect(from.typed).toBe('');
    expect(from.shown('Mama')).toBe('Mama');
    expect(reads).toBe(0);
  });

  it('[NS-16][G-18] fail-open: a config that cannot be read, lacks the key or holds anything but true is not paused', () => {
    setSignAsOtherRemoteForTest(() => {
      throw new Error('no config yet');
    });
    expect(signAsOtherOffered()).toBe(true);
    for (const ks of [null, {}, { signAsOther: 'true' }, { signAsOther: 1 }, { bookSearch: true }]) {
      setSignAsOtherRemoteForTest(config(ks));
      expect(signAsOtherOffered(), JSON.stringify(ks)).toBe(true);
    }
    expect(signAsOtherPaused(null)).toBe(false);
    expect(signAsOtherPaused({ killSwitches: { signAsOther: true } })).toBe(true);
  });

  it('[NS-16][G-18] the letter sheet draws the From control only when offered, and otherwise the plain From line', () => {
    const sheet = readFileSync(join(__dirname, '..', 'src', 'components', 'capture', 'letter-sheet.tsx'), 'utf8');
    expect(sheet).toContain('{from?.offered ? (');
    expect(sheet).toContain('accessibilityLabel={header.from} testID="review.sheet.from"');
  });

  it('[NS-16][G-18] the key is in the shared kill-switch vocabulary, so a signed config can carry it', async () => {
    const { KILL_SWITCH_KEYS, DEFAULT_REMOTE_CONFIG } = await import('../../../packages/api/src/remote-config');
    expect(KILL_SWITCH_KEYS as readonly string[]).toContain('signAsOther');
    expect(DEFAULT_REMOTE_CONFIG.killSwitches.signAsOther).toBe(false);
  });
});
