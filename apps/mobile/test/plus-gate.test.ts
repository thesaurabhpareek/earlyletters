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
const { heldCardLabel, heldCardTilt, heldWords, holdOnce, keepSheetView, storedWords, SYNCED_HELD_NOTE_CLEARED } = await import('../src/components/child/plus-gate.logic');
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

  it('the sheet draws the words keepSheetView chose, each in its own place (#296; lens B B2 on #312)', () => {
    const gate = code('components/child/plus-gate.tsx');
    // Body under the title, the held note under it (trust copy, subhead), the note under See Plus: a swap fails here.
    expect(gate).toMatch(/<Text variant="body">\{view\.body\}<\/Text>/);
    expect(gate).toMatch(/<Text variant="subhead" tone="muted" testID="plusGate\.heldNote">\s*\{view\.heldNote\}\s*<\/Text>/);
    expect(gate).toMatch(/testID="plusGate\.note">\s*\{view\.note\}\s*<\/Text>/);
    for (const v of ['body', 'heldNote', 'note']) expect(gate.match(new RegExp(`\\{view\\.${v}\\}`, 'g')), v).toHaveLength(1);
    // The sentences that depend on the state never come straight from the copy: only through keepSheetView.
    expect(gate).not.toMatch(/\bk\.(body|lapsedBody|heldNote|heldNoteLetter|heldNoteSynced|offline|offlineLetter)\b/);
    expect(gate).not.toMatch(/\bg\.(unavailable|needsNewerIos)\b|billingCopy\.gate\.(unavailable|needsNewerIos)|keepGate\.(body|lapsedBody|heldNote|offline)/);
  });

  it('the sheet renders only its own words: never a renewal line, a plan, a trial or a price (lens B B1 on #312)', () => {
    const gate = code('components/child/plus-gate.tsx');
    const refs = [...new Set(gate.match(/\b(?:billingCopy|copy|k|g)\.[A-Za-z]+(?:\.[A-Za-z]+)*/g) ?? [])].sort();
    expect(refs).toEqual(['billingCopy.gate.opening', 'billingCopy.keepGate', 'billingCopy.keepGate.heldChip', 'copy.common.continueButton', 'k.holdButton', 'k.redeemLink', 'k.seePlus', 'k.title']);
    // One alias only (k is keepGate), no other way into the copy, and the plan is read for its state, never its words.
    expect([...gate.matchAll(/=\s*billingCopy\b[^;]*;/g)].map((m) => m[0])).toEqual(['= billingCopy.keepGate;']);
    expect(gate).not.toMatch(/billingCopy\s*\[|\}\s*=\s*billingCopy|\b(store|plan)\.(renewal|trial|monthly|yearly|annual|payment|promise|subtitle)\b|@scribe\/content/);
    expect([...new Set(gate.match(/\bplan\.[A-Za-z]+/g) ?? [])].sort()).toEqual(['plan.plusOn', 'plan.storeSupport']);
    // So the renewal and trial words exist in content, and the sheet cannot reach them.
    expect(billingCopy.store.renewal.length).toBeGreaterThan(0);
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
    // The words end in a full stop already: no second one ("too.. From Mama", lens B B6 on #312).
    expect(label).toBe(`To Asha, Month 7. ${heldWords(ASHA_SAID)} From Mama. ${k.heldChip}.`);
    expect(label).not.toMatch(/\.\./);
    expect(label).not.toMatch(/·/); // VoiceOver never reads the separator
    // Words that end without one get one; a question or an exclamation keeps its own mark.
    expect(heldCardLabel({ ...HELD, words: 'You found your toes' })).toBe(`To Asha, Month 7. You found your toes. From Mama. ${k.heldChip}.`);
    expect(heldCardLabel({ ...HELD, words: 'Did you hear the rain?' })).toBe(`To Asha, Month 7. Did you hear the rain? From Mama. ${k.heldChip}.`);
    expect(heldCardLabel({ ...HELD, words: 'You laughed!' })).not.toMatch(/!\./);
    expect(k.heldChip).toBe('Waiting');
    // Tilted on paper at default sizes; held still at accessibility sizes.
    expect(heldCardTilt(false)).toBe('-2deg');
    expect(heldCardTilt(true)).toBe('0deg');
  });

  it('Review passes the words that wait as stored, never its own unsaved changes, and the sheet draws them in two lines', () => {
    const review = code('app/review.tsx');
    expect(review).toMatch(/held=\{\{ \.\.\.header, words: storedWords\(later \?\? getDraft\(draft\.id\) \?\? draft\) \}\}/);
    expect(review).not.toMatch(/held=\{\{[^}]*finalText/);
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
    expect(hold).toMatch(/const outcome = holdOnce\(holding, \(\) => \(later \? true : holdDraft\(draft\.id, \{ inBookChoice: heldInBook\.current \}\)\)\);/);
    // A second tap does nothing more; only a hold that took is counted; the sheet and Review close once.
    expect(hold).toMatch(/if \(outcome === 'again'\) return;\s*if \(outcome === 'held'\) track\('letter_held', \{ letters_kept: Math\.min\(1000, gate\.lettersKept\) \}\);\s*router\.back\(\);/);
    expect(hold.match(/router\.back\(\)/g)).toHaveLength(1);
    expect(review).toMatch(/const holding = useRef\(false\);/);
    // The only analytics on Hold: the existing letter_held count (no words, no name).
    expect([...hold.matchAll(/track\(([^;]*)\);/g)].map((m) => m[1])).toEqual(["'letter_held', { letters_kept: Math.min(1000, gate.lettersKept) }"]);
    expect(hold.indexOf('holdDraft(')).toBeLessThan(hold.indexOf('router.back()'));
    // Holding never lets the letter go (lens B B1 on #312): no discard, delete or clear on this path.
    expect(hold).not.toMatch(/discard|Discard|delete|Delete|remove|clear|finishDiscard|setGate/);
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

  it('Keep it here for now runs once: a double tap closes once and counts once (lens B B3 on #312)', () => {
    const guard = { current: false };
    let holds = 0;
    const hold = () => {
      holds++;
      return true;
    };
    expect(holdOnce(guard, hold)).toBe('held');
    expect(holdOnce(guard, hold)).toBe('again');
    expect(holdOnce(guard, hold)).toBe('again');
    expect(holds).toBe(1);
  });

  it('a hold that does not take, or throws, still closes but is not counted, and the draft stays as it was (lens B B4)', () => {
    expect(holdOnce({ current: false }, () => false)).toBe('not_held');
    expect(
      holdOnce({ current: false }, () => {
        throw new Error('disk full');
      }),
    ).toBe('not_held');
    // The store says false for a draft it no longer has; Tonight then has no card for it, and nothing was counted.
    expect(store.holdDraft('0199a5b0-0000-7000-8000-999999999999', { inBookChoice: true })).toBe(false);
    // A draft that was not marked held is Tonight's ordinary card, with its words, never "Waiting to be kept."
    const d = store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'You rolled over twice.' });
    const card = draftCard(store.getDraft(d.id)!, new Date(2026, 9, 17, 20, 30));
    expect(card.state).toBe('typed');
    expect(card.line).not.toBe(en.tonight.draft.held);
    expect(card.words).toBe('You rolled over twice.');
  });

  it('edited in Review, then held: the card shows the stored words, the ones Tonight shows (lens B B5 on #312)', () => {
    const d = store.createDraft({ childId: asha, captureMode: 'spoken', promptKey: null, audioUri: 'file:///Documents/asha-spoon.m4a', audioDurationMs: 9000 });
    store.setDraftTranscript(d.id, ASHA_SAID);
    // Review's finalText after an edit in place: never stored by a hold.
    const editedInReview = 'Asha, today you held the spoon all by yourself.';
    expect(store.holdDraft(d.id, { inBookChoice: true })).toBe(true);
    const held = store.getDraft(d.id)!;
    expect(held.rawTranscript).toBe(ASHA_SAID); // the edit did not reach the draft
    const words = storedWords(held);
    expect(words).toBe(heldWords(ASHA_SAID));
    expect(words).not.toContain('all by yourself');
    expect(words).not.toBe(heldWords(editedInReview));
    // The same words Tonight's held card shows, and the same a reopened Review starts from (its raw transcript).
    expect(draftCard(held, new Date(2026, 9, 17, 20, 30)).words).toBe(words);
    // A typed draft: its typed words; a letter whose words arrived later: its stored words (in typedText).
    expect(storedWords({ typedText: 'Two teeth today.', rawTranscript: null })).toBe('Two teeth today.');
    // Typed words come first when a draft has both (a mixed draft: Tonight shows what was typed), as draftWords does.
    expect(storedWords({ typedText: 'a', rawTranscript: 'b' })).toBe('a');
    expect(storedWords({ typedText: '  ', rawTranscript: 'b' })).toBe('b');
    expect(storedWords({ typedText: null, rawTranscript: null })).toBe('');
  });

  it('signed out, holding queues nothing to leave the phone', () => {
    const d = store.createDraft({ childId: asha, captureMode: 'typed', promptKey: null, audioUri: null, audioDurationMs: null, typedText: 'You clapped for the first time.' });
    const queued = outbox();
    expect(store.holdDraft(d.id, { inBookChoice: true })).toBe(true);
    expect(outbox()).toBe(queued);
  });
});
