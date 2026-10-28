/// <reference types="node" />
/**
 * A letter whose words arrived later meets the Keep gate through Review (#53; M17, D-103; F14-REQ-037; F14 6.1 :129,
 * 6.2 B2 steps 3 and 4). The letter page never counts and never shows a Plus sheet (6.1, 6.4): Save words stores the
 * typed words as the letter's words waiting for review and opens Review for the letter; Read it back opens Review for
 * a letter whose words wait. Review's one Keep step decides there: keepNeedsPlus (keepSheetFor), then
 * keepReviewedWords, then countAfterSave.
 *
 * Screens do not load in Node, so this runs Review's Keep order for such a letter with the same functions review.tsx
 * calls, against the real store, ledger and gate, a fake Keychain and recorded analytics, and pins review.tsx and the
 * letter page to that order. Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_PLAN, type Edit, type PlanView } from '@scribe/core';
import { nodeDb } from './helpers/node-db';

const h = vi.hoisted(() => ({ view: null as unknown, events: [] as { name: string; props: unknown }[] }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('../src/lib/billing/plan-store', () => ({ getPlan: () => ({ view: h.view, details: {}, checkedAt: null }) }));
vi.mock('../src/lib/analytics/track', () => ({ track: (name: string, props: unknown) => void h.events.push({ name, props }) }));

const store = await import('../src/lib/store');
const { countAfterSave, keepSheetFor } = await import('../src/lib/billing/keep-step');
const { configureLedgerStorage } = await import('../src/lib/billing/letter-ledger');
const { laterWordsDraft } = await import('../src/components/capture/later-words.logic');
const { typedFinalText } = await import('../src/components/capture/review-view.logic');
const { flagReadItBack, isReadItBack } = await import('../src/lib/read-it-back');
const { takeOwnership } = await import('../src/lib/sync/ownership');
const { billingCopy } = await import('../src/lib/billing/copy');

const PLUS: PlanView = { state: 'active', effectiveUntil: '2099-01-01T00:00:00Z', verifiedAt: '2026-10-03T00:00:00Z', environment: 'production', isTester: false };
const now = () => '2026-10-03T09:00:00.000Z';
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let close: () => void = () => {};
let raw: ReturnType<typeof nodeDb>['db'];
let asha = '';
const own = () => true;

beforeEach(() => {
  h.view = NO_PLAN;
  h.events.length = 0;
  configureLedgerStorage(null);
  store.closeStore();
  const db = nodeDb();
  close = db.close;
  raw = db.db;
  expect(store.openStore({ open: () => ({ db: db.db, close: () => {} }), now, newId }).ok).toBe(true);
  asha = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
});
afterEach(() => {
  store.closeStore();
  configureLedgerStorage(null);
  close();
});

const counted = () => store.ledgerDb().counts().recorded;
const names = () => h.events.map((e) => e.name);

/** Review's Keep the recording: a voice letter kept without words, never counted. */
function voiceOnly(): string {
  const d = store.createDraft({ childId: asha, captureMode: 'spoken', promptKey: null, audioUri: `file:///Documents/${newId()}.m4a`, audioDurationMs: 9000 });
  store.saveVoiceOnlyFromDraft({ ...d, audioSha256: 'a'.repeat(64), audioBytes: 12000 }, { childId: asha, authorSignsAs: 'Mama', inBook: false, engineVersion: 5 });
  return d.id;
}
/** The machine's words arrive later (the transcription queue), and the card is flagged, as the queue does. */
function wordsArrive(id: string, words: string, finalText = words.trim()): void {
  flagReadItBack(id);
  expect(store.setWordsForWaitingEntry(id, { rawTranscript: words, machineEdits: [] as Edit[], finalText, editLevel: 'verbatim', engineVersion: 5 })).toBe(true);
}
/** The letter page's Save words: the store write it makes before it opens Review. */
const saveWords = (id: string, text: string) => store.setTypedWordsForWaitingEntry(id, text);

/**
 * Review opened for the letter (`/review?entryId=`), one Keep tap, in review.tsx's order: the letter as Review's
 * draft, the words on screen (typedFinalText of the draft's typed text, as for any typed letter), keepNeedsPlus
 * (keepSheetFor), then keepLaterLetter (keepReviewedWords and the card cleared), then countAfterSave.
 */
async function reviewKeep(id: string, inBook: boolean): Promise<{ outcome: 'kept' | 'sheet'; noted: boolean; wordsOnScreen: string }> {
  const d = laterWordsDraft(store.getEntry(id), own);
  expect(d, 'Review opens for this letter').not.toBeNull();
  const wordsOnScreen = typedFinalText(d!.typedText!);
  if (await keepSheetFor(wordsOnScreen)) return { outcome: 'sheet', noted: false, wordsOnScreen };
  expect(store.keepReviewedWords(id, inBook)).toBe(true);
  return { outcome: 'kept', noted: await countAfterSave(wordsOnScreen), wordsOnScreen };
}

describe('[#53] the letter page never counts: it hands the keep to Review', () => {
  it('Save words keeps the typed words on the letter at once, uncounted, waiting for review', () => {
    const v = voiceOnly();
    expect(saveWords(v, '  You laughed at the rain.  ')).toBe(true);
    expect(store.getEntry(v)).toMatchObject({ finalText: 'You laughed at the rain.', rawTranscript: 'You laughed at the rain.', captureMode: 'mixed', wordsUnreviewed: true });
    expect(counted()).toBe(0);
    expect(store.ledgerDb().counts().present).toBe(0);
    expect(names()).toEqual([]); // no gate, no sheet, no note on the letter page
  });

  it('the hand-off carries the words: Review reads the letter with exactly the words the person typed', () => {
    const v = voiceOnly();
    saveWords(v, 'You found your feet.');
    const d = laterWordsDraft(store.getEntry(v), own)!;
    expect(d).toMatchObject({ id: v, childId: asha, typedText: 'You found your feet.', rawTranscript: 'You found your feet.', state: 'ready' });
    expect(d.audioUri).toMatch(/^file:\/\/\/Documents\//);
    expect(typedFinalText(d.typedText!)).toBe(store.getEntry(v)!.finalText);
  });

  it('Review shows the stored words, not the raw transcript, when the two differ', async () => {
    const v = voiceOnly();
    wordsArrive(v, 'You said \u201Cba\u201D to the cat.', 'You said "ba" to the cat.');
    expect(laterWordsDraft(store.getEntry(v), own)?.typedText).toBe('You said "ba" to the cat.');
    expect((await reviewKeep(v, true)).wordsOnScreen).toBe('You said "ba" to the cat.');
  });

  it('no Review for words waiting that are empty (the machine heard nobody)', () => {
    const v = voiceOnly();
    expect(store.setWordsForWaitingEntry(v, { rawTranscript: '', machineEdits: [] as Edit[], finalText: '', editLevel: 'verbatim', engineVersion: 5 })).toBe(true);
    expect(store.getEntry(v)?.wordsUnreviewed).toBe(true);
    expect(laterWordsDraft(store.getEntry(v), own)).toBeNull();
  });

  it('Review opens only for an own letter with words waiting: not for one still waiting, already kept, or another author', () => {
    const v = voiceOnly();
    expect(laterWordsDraft(store.getEntry(v), own)).toBeNull(); // no words yet
    saveWords(v, 'Two teeth.');
    expect(laterWordsDraft(store.getEntry(v), () => false)).toBeNull(); // the other parent's letter
    store.keepReviewedWords(v);
    expect(laterWordsDraft(store.getEntry(v), own)).toBeNull(); // kept already
    expect(laterWordsDraft(null, own)).toBeNull();
  });
});

describe('[F14-REQ-037] Review\'s Keep step runs for a letter whose words arrived later', () => {
  it('under the allowance: kept where the person chose, counted, the card gone; the save that reaches 2 notes it, as on Review\'s own path', async () => {
    const a = voiceOnly();
    const b = voiceOnly();
    wordsArrive(a, 'You sang to the cat.');
    saveWords(b, 'You clapped.');
    expect(await reviewKeep(a, true)).toEqual({ outcome: 'kept', noted: false, wordsOnScreen: 'You sang to the cat.' });
    expect(store.getEntry(a)).toMatchObject({ inBook: true, wordsUnreviewed: false });
    expect(counted()).toBe(1);
    expect(await reviewKeep(b, false)).toEqual({ outcome: 'kept', noted: true, wordsOnScreen: 'You clapped.' });
    expect(store.getEntry(b)).toMatchObject({ inBook: false, wordsUnreviewed: false });
    expect(counted()).toBe(2);
    expect(h.events).toEqual([{ name: 'free_allowance_reached', props: { allowance: 2 } }]);
  });

  it('3 voice-only letters, 0 counted; their words arrive or are typed, and 3 are kept from Review: 2 free, the third opens the Keep sheet', async () => {
    const ids = [voiceOnly(), voiceOnly(), voiceOnly()];
    expect(counted()).toBe(0);
    wordsArrive(ids[0], 'You laughed.');
    saveWords(ids[1], 'You rolled over.');
    wordsArrive(ids[2], 'You said ba.');
    expect(counted()).toBe(0); // the words exist, but nobody has kept them yet
    expect((await reviewKeep(ids[0], true)).outcome).toBe('kept');
    expect((await reviewKeep(ids[1], true)).outcome).toBe('kept');
    h.events.length = 0;
    expect((await reviewKeep(ids[2], true)).outcome).toBe('sheet');
    expect(h.events).toEqual([{ name: 'keep_gate_shown', props: { letters_kept: 2, allowance: 2, lapsed: 0 } }]);
    // Nothing written: the words wait on the letter, uncounted, and the card stays for the next try.
    expect(store.getEntry(ids[2])).toMatchObject({ wordsUnreviewed: true, finalText: 'You said ba.', inBook: false });
    expect(isReadItBack(ids[2])).toBe(true);
    expect(counted()).toBe(2);
    h.view = PLUS; // after Plus starts, the person taps Keep in Review again (D-083)
    expect(await reviewKeep(ids[2], true)).toEqual({ outcome: 'kept', noted: false, wordsOnScreen: 'You said ba.' });
    expect(counted()).toBe(3);
  });

  it('a Keep on a letter already kept changes nothing: not its place, not the count', async () => {
    const v = voiceOnly();
    saveWords(v, 'You waved.');
    await reviewKeep(v, true);
    expect(store.keepReviewedWords(v, false)).toBe(false);
    expect(store.getEntry(v)?.inBook).toBe(true);
    expect(counted()).toBe(1);
  });

  it('signed in, the place the person chose goes to the outbox with the letter', async () => {
    takeOwnership(raw, '11111111-1111-1111-1111-111111111111', { now: now(), newId });
    const v = voiceOnly();
    saveWords(v, 'You hummed.');
    await reviewKeep(v, true);
    const ops = raw.all<{ type: string; payload: string }>("SELECT type, payload FROM sync_outbox WHERE entity_id = ? AND type = 'entry.upsert' ORDER BY seq", v);
    expect(ops.length).toBeGreaterThan(0);
    const last = JSON.parse(ops[ops.length - 1].payload) as { changed?: string[]; data: { in_book: boolean; final_text: string } };
    expect(last.data).toMatchObject({ in_book: true, final_text: 'You hummed.' });
    expect(last.changed ?? ['in_book']).toContain('in_book');
  });

  it('marks only typed on the letter page: Review keeps them with no sheet, no count and no note, past the allowance too', async () => {
    const a = voiceOnly();
    saveWords(a, '...');
    const d0 = voiceOnly();
    const d1 = voiceOnly();
    saveWords(d0, 'One.');
    saveWords(d1, 'Two.');
    await reviewKeep(d0, true);
    await reviewKeep(d1, true);
    h.events.length = 0;
    expect(await reviewKeep(a, false)).toEqual({ outcome: 'kept', noted: false, wordsOnScreen: '...' });
    expect(h.events).toEqual([]);
    expect(counted()).toBe(2);
  });
});

const read = (p: string) => readFileSync(join(__dirname, '..', 'src', p), 'utf8');
/** The source from one anchor up to the next; fails loudly when either anchor is gone. */
function between(src: string, from: string, to: string): string {
  const start = src.indexOf(from);
  if (start < 0) throw new Error(`anchor not found: ${from}`);
  const end = src.indexOf(to, start + from.length);
  if (end < 0) throw new Error(`anchor not found after ${from}: ${to}`);
  return src.slice(start, end);
}

describe('[#53] the letter page and Review are wired this way', () => {
  const page = read('app/letter/[id].tsx');
  const review = read('app/review.tsx');

  it('the letter page never counts, never asks the gate and never shows a Plus sheet', () => {
    expect(page).not.toMatch(/keepReviewedWords|keepSheetFor|keepGateFor|keepLetterGate|countAfterSave|PlusGate|recordKept/);
  });

  it('the store write behind Save words counts nothing: no recordKept, and the words wait for review', () => {
    const storeSrc = read('lib/store.ts');
    const fn = between(storeSrc, 'export function setTypedWordsForWaitingEntry(', '\n}\n');
    expect(fn).toMatch(/entries\.setTypedWordsOnce\(c, id, text\)/);
    expect(fn).not.toMatch(/recordKept|keychainFloor/);
    expect(between(read('lib/db/repos/entries.ts'), 'export function setTypedWordsOnce(', '\n}\n')).toMatch(/transcript_status = '\$\{WORDS_UNREVIEWED\}'/);
  });

  it('Save words stores the typed words, then opens Review for the letter', () => {
    const sheet = between(page, 'function WordsSheet(', 'function ReadItBackCard(');
    const write = sheet.indexOf('if (!setTypedWordsForWaitingEntry(entryId, text)) return setRefused(true);');
    const open = sheet.search(/router\.push\(\{ pathname: '\/review', params: \{ entryId \} \}\)/);
    expect(write).toBeGreaterThan(-1);
    expect(open).toBeGreaterThan(write);
  });

  it('Read it back opens Review for a letter whose words wait, before anything clears the card', () => {
    const card = between(page, '<ReadItBackCard', 'function TopBar(');
    const open = card.search(/if \(entry\.wordsUnreviewed\) return router\.push\(\{ pathname: '\/review', params: \{ entryId: entry\.id \} \}\);/);
    expect(open).toBeGreaterThan(-1);
    expect(open).toBeLessThan(card.indexOf('clearReadItBack('));
    expect(page).toMatch(/own && words === 'words' && \(unread \|\| entry\.wordsUnreviewed\) && \(/);
  });

  it('Review reads such a letter by entryId, and its one Keep step keeps it: the gate first, then keepReviewedWords, then countAfterSave', () => {
    expect(review).toMatch(/laterWordsDraft\(getEntry\(entryId\), isOwnEntry\)/);
    const save = between(review, 'const save = async', 'const keepRecordingOnly = async');
    const gate = save.indexOf('if (await keepNeedsPlus(finalText)) {');
    const write = save.indexOf('if (later) keepLaterLetter(draft.id, inBook);');
    expect(gate).toBeGreaterThan(-1);
    expect(write).toBeGreaterThan(gate);
    expect(save.indexOf('countAfterSave(finalText)')).toBeGreaterThan(write);
    const helper = between(review, 'function keepLaterLetter(', 'function hasAnyLetter(');
    expect(helper).toMatch(/if \(!keepReviewedWords\(id, inBook\)\) throw/);
    expect(helper).toMatch(/clearReadItBack\(id\)/);
  });

  it('the Keep sheet says where such a letter\'s words wait, never Tonight', async () => {
    expect(review).toMatch(/heldOn=\{later \? 'letter' : 'tonight'\}/);
    const gate = read('components/child/plus-gate.tsx');
    expect(gate).toMatch(/heldOn = 'tonight'/);
    // The words are chosen in plus-gate.logic.ts (P6, S22), which the sheet draws: signed in or out, online or off.
    expect(gate).toMatch(/keepSheetView\(\{ lapsed, heldOn, synced, offline, storeSupport: plan\.storeSupport \}\)/);
    const { keepSheetView } = await import('../src/components/child/plus-gate.logic');
    for (const synced of [false, true]) {
      const base = { lapsed: false, heldOn: 'letter' as const, synced, storeSupport: 'available' as const };
      expect(keepSheetView({ ...base, offline: false })).toMatchObject({ heldNote: billingCopy.keepGate.heldNoteLetter, note: null });
      expect(keepSheetView({ ...base, offline: true }).note).toBe(billingCopy.keepGate.offlineLetter);
    }
    for (const line of [billingCopy.keepGate.heldNoteLetter, billingCopy.keepGate.offlineLetter]) {
      expect(line).toMatch(/this letter/);
      expect(line).not.toMatch(/Tonight|phone/);
    }
  });

  it('Review shows such a letter\'s words as stored: no Change words, no other book, and no second letter_saved', () => {
    expect(review).toMatch(/\{!isSample && !editing && !later && \(/);
    expect(review).toMatch(/if \(listChildren\(\)\.length < 2 \|\| !draft \|\| later\) return;/);
    expect(review).toMatch(/onChangeBook=\{many && !later \? pickChild : undefined\}/); // no dead control for VoiceOver
    expect(between(review, 'const save = async', 'const keepRecordingOnly = async')).toMatch(/if \(!later\) trackLetterSaved\(\{/);
  });
});
