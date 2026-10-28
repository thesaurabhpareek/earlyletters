/// <reference types="node" />
/**
 * Keep needs Plus (EXPERIENCE_PASS_2026-10 S22, 5.8 row 5c; package P6). The sheet's words come from
 * components/child/plus-gate.logic.ts (run here); the sheet itself and Review's wiring are React Native, so their use
 * of it is pinned in their source. "Keep it here for now" is run against the real store: the draft is marked held
 * with the destination chosen at Keep, Tonight then reads it as "Waiting to be kept.", and, signed out, nothing is
 * queued to leave the phone. Fixtures: the fictional family Asha only (CLAUDE.md).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { billingCopy, en } from '@scribe/content';
import { nodeDb } from './helpers/node-db';

vi.mock('expo-crypto', () => ({ getRandomBytes: (n: number) => new Uint8Array(n).fill(7) }));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));

const store = await import('../src/lib/store');
const { heldCardLabel, heldCardTilt, heldWords, keepSheetView, SYNCED_HELD_NOTE_CLEARED } = await import('../src/components/child/plus-gate.logic');
const { draftCard } = await import('../src/components/tonight/draft-card.logic');
const { letterHeader } = await import('../src/components/capture/review-view.logic');

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
/** Source without comments, so a word in a comment never passes or fails a check. */
const code = (rel: string) => read(rel).replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

const k = billingCopy.keepGate;
const ASHA_SAID = 'Asha, today you held the spoon by yourself.\n\nYou mostly painted your face with it.';
const HELD = { ...letterHeader({ childName: 'Asha', signsAs: 'Mama', month: 7 }), words: ASHA_SAID };
const base = { lapsed: false, heldOn: 'tonight' as const, synced: false, offline: false, storeSupport: 'available' as const };

describe('[S22] what the Keep sheet says', () => {
  it('says the letter is safe and where it waits, by where it is held and how the person is signed in', () => {
    expect(keepSheetView(base)).toEqual({ body: k.body, heldNote: k.heldNote, note: null, canOpenStore: true });
    // Signed in with sync on, a held draft also goes up as an author-only row (store.holdDraft), but the line that says
    // so ("It syncs privately with your account") is held for counsel (C10): every case shows heldNote for build 2.
    expect(SYNCED_HELD_NOTE_CLEARED).toBe(false);
    expect(keepSheetView({ ...base, synced: true }).heldNote).toBe(k.heldNote);
    expect(k.heldNoteSynced.length).toBeGreaterThan(0); // the key stays, for the switch after counsel
    // A letter whose words arrived later (task #53): only its words wait, on the letter, signed in or not.
    for (const synced of [false, true]) expect(keepSheetView({ ...base, heldOn: 'letter', synced }).heldNote).toBe(k.heldNoteLetter);
    expect(keepSheetView({ ...base, lapsed: true }).body).toBe(k.lapsedBody);
  });

  it('offline keeps See Plus and says it needs a connection; with no store on the device only Keep it here is offered', () => {
    expect(keepSheetView({ ...base, offline: true })).toMatchObject({ note: k.offline, canOpenStore: true });
    expect(keepSheetView({ ...base, heldOn: 'letter', offline: true }).note).toBe(k.offlineLetter);
    expect(keepSheetView({ ...base, storeSupport: 'unsupported' })).toMatchObject({ note: billingCopy.gate.unavailable, canOpenStore: false });
    expect(keepSheetView({ ...base, storeSupport: 'needs_ios_17' })).toMatchObject({ note: billingCopy.gate.needsNewerIos, canOpenStore: false });
  });

  it('never names a price, a trial, free months or a countdown, in any state (D-083)', () => {
    const states = [false, true].flatMap((lapsed) =>
      (['tonight', 'letter'] as const).flatMap((heldOn) =>
        [false, true].flatMap((synced) =>
          [false, true].flatMap((offline) => (['available', 'unsupported', 'needs_ios_17'] as const).map((storeSupport) => keepSheetView({ lapsed, heldOn, synced, offline, storeSupport }))),
        ),
      ),
    );
    const said = [...states.flatMap((v) => [v.body, v.heldNote, v.note ?? '']), k.title, k.seePlus, k.holdButton, k.redeemLink, k.heldChip, heldCardLabel(HELD)];
    // Nothing the sheet shows today says the letter syncs (C10 hold).
    for (const line of said) expect(line, line).not.toMatch(/sync/i);
    for (const line of said) {
      expect(line, line).not.toMatch(/\$|\bprice\b|free trial|free months?|\btrial\b|\d+\s*(?:days?|letters?)\s*(?:left|to go)/i);
      expect(line, line).not.toMatch(/[–—‘’“”…]/);
    }
    // The sheet types no number of its own: every word on it comes from packages/content.
    expect(code('components/child/plus-gate.tsx')).not.toMatch(/['"`][^'"`\n]*\$\{?\s*\d/);
  });
});

describe('[S22] the held letter on the sheet is the person\'s own, read from this phone', () => {
  it('shows its own first words, its dateline and signature, with the Waiting chip, as one VoiceOver element', () => {
    expect(heldWords(ASHA_SAID)).toBe('Asha, today you held the spoon by yourself. You mostly painted your face with it.');
    const label = heldCardLabel(HELD);
    expect(label).toBe(`To Asha, Month 7. ${heldWords(ASHA_SAID)}. From Mama. ${k.heldChip}`);
    expect(label).not.toMatch(/·/); // VoiceOver never reads the separator
    expect(k.heldChip).toBe('Waiting');
    // Tilted on paper at default sizes; held still at accessibility sizes.
    expect(heldCardTilt(false)).toBe('-2deg');
    expect(heldCardTilt(true)).toBe('0deg');
  });

  it('Review passes the letter as it would be kept, and the sheet draws its words in a two-line excerpt', () => {
    expect(read('app/review.tsx')).toMatch(/held=\{\{ \.\.\.header, words: finalText \}\}/);
    const gate = code('components/child/plus-gate.tsx');
    expect(gate).toMatch(/<ExcerptFade text=\{heldWords\(held\.words\)\} lines=\{2\} variant="letterBody"/);
    expect(gate).toMatch(/accessibilityLabel=\{heldCardLabel\(held\)\}/);
  });

  it('nothing is sent to show it: the sheet imports no network, and its analytics carry counts and outcomes only', () => {
    const gate = code('components/child/plus-gate.tsx');
    expect(gate).not.toMatch(/fetch\(|supabase|XMLHttpRequest|WebSocket|lib\/sync/);
    const calls = [...gate.matchAll(/track\('(\w+)', (\{[^}]*\})\)/g)].map((m) => [m[1], m[2]]);
    expect(calls).toEqual([
      ['plus_started_from_gate', '{ letters_kept: Math.min(1000, Math.max(0, lettersKept)) }'],
      ['offer_code_redeemed', '{}'],
      ['plus_offer_viewed', "{ trigger: 'keep_letter' }"],
      ['plus_offer_closed', "{ trigger: 'keep_letter', outcome }"],
    ]);
    expect(gate).not.toMatch(/track\([^)]*(held|words|childName)/);
  });

  it('no lamp and no lockup on the sheet; nothing on it is typed outside packages/content', () => {
    const gate = code('components/child/plus-gate.tsx');
    expect(gate).not.toMatch(/<Lamp\b|Lockup|lockup/);
    // Every Text child is a copy lookup or a prop, never a literal sentence.
    expect(gate).not.toMatch(/<Text[^>]*>\s*[A-Za-z][^<{]*</);
  });
});

describe('[S22] Keep it here for now: the draft is held, and Tonight shows it waiting to be kept', () => {
  let close: () => void = () => {};
  let seq = 0;
  const newId = () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`;
  let asha = '';
  const outbox = () => store.localSqlDb().get<{ n: number }>('SELECT COUNT(*) AS n FROM sync_outbox')?.n ?? 0;

  beforeEach(() => {
    store.closeStore();
    const h = nodeDb();
    close = h.close;
    expect(store.openStore({ open: () => ({ db: h.db, close: () => {} }), now: () => '2026-10-17T19:05:00.000Z', newId }).ok).toBe(true);
    asha = store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
  });
  afterEach(() => {
    store.closeStore();
    close();
  });

  it('Review holds the draft once, with the destination chosen at this Keep, and never a later letter', () => {
    const review = code('app/review.tsx');
    const hold = review.slice(review.indexOf('onHold={() => {'), review.indexOf('onPlus={'));
    expect(hold.match(/holdDraft\(/g)).toHaveLength(1);
    expect(hold).toMatch(/if \(!later\) holdDraft\(draft\.id, \{ inBookChoice: heldInBook\.current \}\);/);
    // The only analytics on Hold: the existing letter_held count (no words, no name).
    expect([...hold.matchAll(/track\(([^;]*)\);/g)].map((m) => m[1])).toEqual(["'letter_held', { letters_kept: Math.min(1000, gate.lettersKept) }"]);
    expect(hold.indexOf('holdDraft(')).toBeLessThan(hold.indexOf('router.back()'));
    // The destination is the one save() was called with, set before the gate is asked.
    const save = review.slice(review.indexOf('const save = async'), review.indexOf('const keepRecordingOnly = async'));
    expect(save).toMatch(/heldInBook\.current = inBook;/);
    expect(save.indexOf('heldInBook.current = inBook')).toBeLessThan(save.indexOf('keepNeedsPlus(finalText)'));
    // The sheet rises over Review (drawn last in its screen), and only on an offer.
    expect(review).toMatch(/if \(gate && gate\.decision\.kind === 'offer' && phase !== 'saved'\) \{\s*keepSheet = \(/);
    expect(review).toMatch(/\{keepSheet\}\s*<\/SafeAreaView>/);
  });

  it('the draft row is marked held with that destination, untouched otherwise, and Tonight reads it as waiting', () => {
    const d = store.createDraft({ childId: asha, captureMode: 'spoken', promptKey: null, audioUri: 'file:///Documents/asha-take.m4a', audioDurationMs: 9000 });
    store.setDraftTranscript(d.id, ASHA_SAID);
    const before = store.getDraft(d.id)!;
    expect(before.held).toBe(false);
    expect(store.holdDraft(d.id, { inBookChoice: true })).toBe(true);
    const after = store.getDraft(d.id)!;
    expect(after).toEqual({ ...before, held: true, inBookChoice: true });
    expect(store.listHeldDrafts(asha).map((x) => x.id)).toEqual([d.id]);
    // Tonight's card (P3) reads the held state with the words already in strings.en.ts: no new copy.
    const card = draftCard(after, new Date(2026, 9, 17, 20, 30));
    expect(card.state).toBe('held');
    expect(card.line).toBe(en.tonight.draft.held);
    expect(en.tonight.draft.held).toBe('Waiting to be kept.');
    // "Keep private" is kept as the choice too.
    const typed = store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'Two teeth today.' });
    expect(store.holdDraft(typed.id, { inBookChoice: false })).toBe(true);
    expect(store.getDraft(typed.id)!.inBookChoice).toBe(false);
  });

  it('signed out, holding queues nothing to leave the phone', () => {
    const d = store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'You clapped for the first time.' });
    const queued = outbox();
    expect(store.holdDraft(d.id, { inBookChoice: true })).toBe(true);
    expect(outbox()).toBe(queued);
  });
});
