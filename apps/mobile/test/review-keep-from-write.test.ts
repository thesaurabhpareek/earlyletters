/// <reference types="node" />
/**
 * A typed letter kept from Write with one tap (EXPERIENCE_PASS_2026-10 S19, S20, 5.8 row 5a; package P4b), end to end
 * against the real store, ledger and M17 gate (D-082, D-103):
 *
 * - the words are kept exactly as typed, on the one-tap path and on the Review path: a curly apostrophe, an em dash,
 *   curly quotes and an ellipsis character are stored as the keyboard wrote them (F04-REQ-012, F06-REQ-037);
 * - the one-tap keep still asks the gate: past the free letters it opens the Keep sheet and writes nothing;
 * - review.tsx is pinned to that order and to the values it passes.
 *
 * Screens do not load in Node, so this runs Write's keep and Review's one Keep step in review.tsx's order (as
 * test/review-keep-m17.test.ts does for Review's buttons). Fictional Asha family only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NO_PLAN, type PlanView } from '@scribe/core';
import { nodeDb } from './helpers/node-db';

const plan = vi.hoisted(() => ({ view: null as unknown }));
vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
vi.mock('../src/lib/billing/plan-store', () => ({
  getPlan: () => ({ view: plan.view, details: {}, checkedAt: null }),
  planReadiness: async () => 'read',
}));
vi.mock('../src/lib/analytics/track', () => ({ track: () => {} }));

const store = await import('../src/lib/store');
const { countAfterSave, keepSheetFor } = await import('../src/lib/billing/keep-step');
const { configureLedgerStorage } = await import('../src/lib/billing/letter-ledger');
const { armKeep, consumeKeep, peekKeep, resetKeep } = await import('../src/lib/capture/keep-intent');
const { primaryDestination, typedFinalText, writeSwipeAllowed, writeWords } = await import('../src/components/capture/review-view.logic');

const PLUS: PlanView = { state: 'active', effectiveUntil: '2099-01-01T00:00:00Z', verifiedAt: '2026-10-03T00:00:00Z', environment: 'production', isTester: false };
const now = () => '2026-10-03T09:00:00.000Z';
let seq = 0;
const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
let close: () => void = () => {};
let asha = '';

beforeEach(() => {
  plan.view = NO_PLAN;
  resetKeep();
  configureLedgerStorage(null);
  store.closeStore();
  const h = nodeDb();
  close = h.close;
  expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now, newId }).ok).toBe(true);
  asha = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
});
afterEach(() => {
  store.closeStore();
  configureLedgerStorage(null);
  resetKeep();
  close();
});

const counted = () => store.ledgerDb().counts().recorded;

/**
 * What an iPhone keyboard with smart punctuation (on by default) writes for: Asha's first word - mama. "More" she
 * said... : U+2019, U+2014, U+201C and U+201D, U+2026. Every one of them must survive.
 */
const SMART = 'Asha’s first word — mama. “More” she said…';

/** Write's autosave: the words are on this phone as a typed draft before anything is kept (write.tsx `persist`). */
function writeDraft(text: string): string {
  return store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: text }).id;
}

type Outcome = { outcome: 'kept' | 'sheet' | 'nothing'; holding: boolean };

/**
 * Review's one Keep step, in review.tsx's order (`save(inBook)`): the Keep step rule (lib/billing/keep-step.ts,
 * #277) with `finalText` (`keepSheetFor`: a gate means the sheet opens and nothing is written), then the letter,
 * then the count (`countAfterSave`). `finalText` is `userText ?? cleanedText`, and a typed letter's `cleanedText`
 * is `typedFinalText(raw)`.
 */
async function save(draftId: string, inBook: boolean, userText: string | null = null): Promise<'kept' | 'sheet'> {
  const d = store.getDraft(draftId)!;
  const raw = d.typedText ?? '';
  const finalText = userText ?? typedFinalText(raw);
  if ((await keepSheetFor(finalText)) !== null) return 'sheet';
  store.saveLetterFromDraft(d.id, {
    id: d.id, kind: 'letter', occurredOn: '2026-10-03', capturedAt: d.createdAt, captureMode: 'typed', editLevel: 'verbatim',
    promptKey: null, engineVersion: 5, rawTranscript: raw, machineEdits: [], finalText, inBook, soundsLikeMe: null,
    childId: asha, authorSignsAs: 'Mama', audioUri: null, audioDurationMs: null,
  });
  await countAfterSave(finalText);
  return 'kept';
}

/**
 * Write's "Add to Asha's book" or "Keep private" (write.tsx `keep`): arm the keep for this draft, then Review mounts.
 * Its first frame holds the sheet still when a keep is armed (`peekKeep`); its mount effect spends the intent once
 * (`consumeKeep`) and runs `save` for a typed letter.
 */
async function oneTap(draftId: string, inBook: boolean): Promise<Outcome> {
  armKeep(draftId, inBook);
  return reviewMounts(draftId);
}
async function reviewMounts(draftId: string): Promise<Outcome> {
  const holding = peekKeep(draftId) !== null;
  const intent = consumeKeep(draftId);
  if (!intent) return { outcome: 'nothing', holding };
  return { outcome: await save(draftId, intent.inBook), holding };
}

describe('[S19, F04-REQ-012] a typed letter is kept exactly as typed', () => {
  it('the one-tap path stores a curly apostrophe, an em dash, curly quotes and an ellipsis character byte for byte', async () => {
    const id = writeDraft(SMART);
    expect(await oneTap(id, true)).toEqual({ outcome: 'kept', holding: true });
    const e = store.getEntry(id)!;
    expect(e.finalText).toBe(SMART);
    expect(Buffer.from(e.finalText, 'utf8').equals(Buffer.from(SMART, 'utf8'))).toBe(true);
    expect(e.rawTranscript).toBe(SMART);
    expect(e.inBook).toBe(true);
    expect(e.machineEdits).toEqual([]);
    for (const ch of ['’', '—', '“', '”', '…']) expect(e.finalText, ch).toContain(ch);
    expect(e.finalText).not.toMatch(/'|"|\.\.\./); // nothing swapped for a plain-keyboard mark
  });

  it('the Review path (Keep private, then the letter as typed) stores it byte for byte too', async () => {
    const id = writeDraft(SMART);
    expect(await reviewMounts(id)).toEqual({ outcome: 'nothing', holding: false }); // no tap on Write: Review waits
    expect(await save(id, false)).toBe('kept');
    const e = store.getEntry(id)!;
    expect(e.finalText).toBe(SMART);
    expect(e.rawTranscript).toBe(SMART);
    expect(e.inBook).toBe(false);
  });

  it('only the ends are trimmed: the raw transcript keeps every character, the words inside are untouched', async () => {
    const id = writeDraft(`\n  ${SMART}  \n`);
    expect((await oneTap(id, false)).outcome).toBe('kept');
    const e = store.getEntry(id)!;
    expect(e.finalText).toBe(SMART);
    expect(e.rawTranscript).toBe(`\n  ${SMART}  \n`);
  });

  it('a change the person makes in Review is what is kept (userText, never re-cleaned)', async () => {
    const id = writeDraft(SMART);
    const mine = `${SMART} — and then you slept.`;
    expect(await save(id, true, mine)).toBe('kept');
    expect(store.getEntry(id)!.finalText).toBe(mine);
  });
});

describe('[S20, D-103] the one-tap keep asks the M17 gate', () => {
  it('the first 2 letters keep at once; the third opens the Keep sheet and writes nothing', async () => {
    expect((await oneTap(writeDraft('You held my thumb.'), true)).outcome).toBe('kept');
    expect((await oneTap(writeDraft('Two teeth today.'), false)).outcome).toBe('kept');
    expect(counted()).toBe(2);
    const third = writeDraft(SMART);
    const before = store.getDraft(third);
    expect(await oneTap(third, true)).toEqual({ outcome: 'sheet', holding: true });
    expect(store.getEntry(third)).toBeNull();
    expect(store.getDraft(third)).toEqual(before); // held: the draft is untouched
    expect(counted()).toBe(2);
  });

  it('after the sheet it is the ordinary Review: the intent is spent, so nothing keeps by itself again', async () => {
    await oneTap(writeDraft('You held my thumb.'), true);
    await oneTap(writeDraft('Two teeth today.'), true);
    const third = writeDraft('You found your feet.');
    expect((await oneTap(third, true)).outcome).toBe('sheet');
    expect(await reviewMounts(third)).toEqual({ outcome: 'nothing', holding: false }); // a second Review, a restore
    expect(store.getEntry(third)).toBeNull();
    // Plus starts; the person taps Keep themselves, as everywhere else.
    plan.view = PLUS;
    expect(await save(third, true)).toBe('kept');
    expect(store.getEntry(third)!.finalText).toBe('You found your feet.');
    expect(counted()).toBe(3);
  });

  it('[L1] Review\'s path asks the gate for a typed letter too: past the free letters the Keep sheet opens and nothing is written', async () => {
    // Two typed letters kept on Review's path (no tap on Write, so no intent): free.
    for (const words of ['You held my thumb.', 'Two teeth today.']) {
      const id = writeDraft(words);
      expect(await reviewMounts(id)).toEqual({ outcome: 'nothing', holding: false });
      expect(await save(id, true)).toBe('kept');
    }
    expect(counted()).toBe(2);
    // The third, typed, on Review's path: "Add to Asha's book" opens the Keep sheet, for Keep private too.
    const third = writeDraft(SMART);
    const before = store.getDraft(third);
    expect(await reviewMounts(third)).toEqual({ outcome: 'nothing', holding: false });
    expect(await save(third, true)).toBe('sheet');
    expect(await save(third, false)).toBe('sheet');
    expect(store.getEntry(third)).toBeNull();
    expect(store.getDraft(third)).toEqual(before); // held: the draft is untouched, its words as typed
    expect(counted()).toBe(2);
    // With Plus, the same tap keeps it, exactly as typed.
    plan.view = PLUS;
    expect(await save(third, true)).toBe('kept');
    expect(store.getEntry(third)!.finalText).toBe(SMART);
    expect(counted()).toBe(3);
  });

  it('"Try again" after a save that did not work keeps the letter where the person chose', () => {
    expect(primaryDestination({ saveFailed: true, lastInBook: false })).toBe(false);
    expect(primaryDestination({ saveFailed: true, lastInBook: true })).toBe(true);
    expect(primaryDestination({ saveFailed: false, lastInBook: false })).toBe(true); // before a failure the primary is the book
  });
});

describe('[S19, L3] Write on a lasting write failure: the words stay, and so does the sheet, until a write works', () => {
  it('a failed write holds Close, Android\'s back and the swipe; the next good write saves the newest words and releases all three', () => {
    // Write's persist(): writeWords with the store's own createDraft and setDraftTyped. A full disk throws.
    let disk = true;
    const io = {
      create: (v: string) => {
        if (!disk) throw new Error('SQLITE_FULL');
        return store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: v }).id;
      },
      update: (id: string, v: string) => {
        if (!disk) throw new Error('SQLITE_FULL');
        store.setDraftTyped(id, v);
      },
    };
    let draftId: string | null = null;
    let line: 'none' | 'saved' | 'failed' = 'none'; // "Saved on this phone" or "Not saved yet"
    const persist = (value: string): boolean => {
      const r = writeWords(io, draftId, value);
      draftId = r.draftId;
      if (r.saveState) line = r.saveState;
      return r.ok;
    };
    const closes = (text: string) => !text.trim() || persist(text); // close() and Android's back
    const swipes = (text: string) => writeSwipeAllowed({ text, writeFailed: line === 'failed' });
    // A swipe down: allowed, it closes; refused, iOS springs the sheet back and Write runs close() (gestureCancel).
    const swipeCloses = (text: string) => swipes(text) || closes(text);

    expect(persist('   ')).toBe(false); // nothing typed: nothing written, nothing shown
    expect([draftId, line]).toEqual([null, 'none']);
    expect(persist('Asha, you')).toBe(true);
    expect(line).toBe('saved');
    expect(swipes('Asha, you')).toBe(true);

    disk = false;
    expect(persist('Asha, you sang')).toBe(false);
    expect(line).toBe('failed'); // "Not saved yet"
    expect(swipes('Asha, you sang')).toBe(false);
    expect(closes('Asha, you sang')).toBe(false); // Close and Android's back stay on Write
    expect(store.getDraft(draftId!)!.typedText).toBe('Asha, you'); // the phone still has the last good words
    expect(swipes('  ')).toBe(true); // nothing on screen to lose
    expect(swipeCloses('Asha, you sang')).toBe(false); // the refused swipe retried the write: still "Not saved yet"
    expect(line).toBe('failed');

    // The disk comes back and the person types nothing more: the last autosave still says it failed, so the swipe
    // is still refused, but the refused swipe retries the write as Close does, and both close.
    disk = true;
    expect(swipes('Asha, you sang')).toBe(false);
    expect([swipeCloses('Asha, you sang'), line]).toEqual([true, 'saved']);
    expect(store.getDraft(draftId!)!.typedText).toBe('Asha, you sang');
    expect(closes('Asha, you sang')).toBe(true);

    expect(persist('Asha, you sang to the cat')).toBe(true);
    expect(line).toBe('saved'); // "Saved on this phone" again
    expect(swipes('Asha, you sang to the cat')).toBe(true);
    expect(closes('Asha, you sang to the cat')).toBe(true);
    expect(store.getDraft(draftId!)!.typedText).toBe('Asha, you sang to the cat');
  });

  it('a first write that fails creates nothing, and the next one creates the draft once', () => {
    let disk = false;
    let created = 0;
    const io = {
      create: (v: string) => {
        if (!disk) throw new Error('SQLITE_FULL');
        created++;
        return store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: v }).id;
      },
      update: (id: string, v: string) => store.setDraftTyped(id, v),
    };
    expect(writeWords(io, null, 'You waved.')).toEqual({ ok: false, draftId: null, saveState: 'failed' });
    disk = true;
    const r = writeWords(io, null, 'You waved.');
    expect(r).toMatchObject({ ok: true, saveState: 'saved' });
    expect(writeWords(io, r.draftId, 'You waved at me.')).toEqual({ ok: true, draftId: r.draftId, saveState: 'saved' });
    expect(created).toBe(1);
    expect(store.getDraft(r.draftId!)!.typedText).toBe('You waved at me.');
  });
});

describe('review.tsx keeps a typed letter through its one Keep step', () => {
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const review = strip(readFileSync(join(__dirname, '..', 'src', 'app', 'review.tsx'), 'utf8'));
  const between = (from: string, to: string) => {
    const start = review.indexOf(from);
    if (start < 0) throw new Error(`review.tsx: anchor not found: ${from}`);
    const end = review.indexOf(to, start + from.length);
    if (end < 0) throw new Error(`review.tsx: anchor not found after ${from}: ${to}`);
    return review.slice(start, end);
  };
  const save = between('const save = async', 'const keepRecordingOnly = async');
  const keepTo = between('const keepTo = (inBook: boolean) =>', 'const dismissFirstNote');

  it('a typed letter\'s words are typedFinalText(raw): no normalizeChars, no applyEdits', () => {
    expect(review).toMatch(/const cleanedText = useMemo\(\(\) => \(typed \? typedFinalText\(raw\) : languageFinalText\(raw, inForce, rules\)\)/);
    expect(review).not.toMatch(/normalizeChars|applyEdits/);
  });

  it('the entry stores finalText, the words on screen (the person\'s edits included)', () => {
    expect(review).toMatch(/const finalText = userText \?\? cleanedText;/);
    expect(save).toMatch(/^\s*finalText,$/m);
    expect(save).not.toMatch(/finalText:\s*cleanedText|cleanedText/);
  });

  it('[L1] the gate in save is exactly `if (await keepNeedsPlus(finalText)) {`, with nothing in front of it', () => {
    // The only thing before it is hashing the recording; no condition (typed, keeping, a flag) can skip it.
    expect(save).toMatch(/try \{\s*const audio = await ensureAudioHash\(draft\);\s*if \(await keepNeedsPlus\(finalText\)\) \{\s*saving\.current = false;\s*return;\s*\}/);
    expect(save.match(/^.*keepNeedsPlus.*$/gm)?.map((l) => l.trim())).toEqual(['if (await keepNeedsPlus(finalText)) {']);
  });

  it('save always asks keepNeedsPlus before writing, and knows nothing of where the keep came from', () => {
    expect(save.indexOf('await keepNeedsPlus(finalText)')).toBeGreaterThan(-1);
    expect(save.indexOf('await keepNeedsPlus(finalText)')).toBeLessThan(save.indexOf('saveLetterFromDraft('));
    expect(save).not.toMatch(/keeping|Keep\(|intent|devPass/);
  });

  it('the one-tap keep and every Keep button go through keepTo, which only records the choice and calls save', () => {
    const fn = keepTo.slice(0, keepTo.indexOf('};') + 2);
    expect(fn).toMatch(/^const keepTo = \(inBook: boolean\) => \{\s*lastDestination\.current = inBook;\s*void save\(inBook\);\s*\};$/);
    expect(keepTo).toMatch(/const intent = consumeKeep\(draftId\);\s*if \(intent && phase === 'ready' && typed\) keepTo\(intent\.inBook\);\s*else setKeeping\(false\);/);
    expect(review).toMatch(/onPress=\{\(\) => keepTo\(primaryDestination\(\{ saveFailed, lastInBook: lastDestination\.current \}\)\)\}/);
    expect(review).toMatch(/onPress=\{\(\) => keepTo\(false\)\}/);
    expect(review.match(/void save\(/g)).toHaveLength(1);
  });

  it('the header names the month from the same day the entry is kept on', () => {
    const day = 'draft.createdAt ? todayISO(new Date(draft.createdAt)) : todayISO()';
    expect(save).toContain(`occurredOn: ${day},`);
    expect(review).toContain(`const occurredOn = ${day};`);
    expect(review).toMatch(/const month = monthFor\(child, occurredOn\);\s*const header = letterHeader\(\{ childName: child\.name, signsAs: child\.signsAs, month \}\);/);
  });
});
