/**
 * The Keep sheet's words and choices (EXPERIENCE_PASS_2026-10 S22, package P6): pure, so test/plus-gate.test.ts runs it
 * in Node; plus-gate.tsx draws it.
 *
 * What the sheet says follows where the held letter waits and how it is kept:
 *   heldOn 'tonight'  a draft: it waits on Tonight, and the line names this phone (`keepGate.heldNote`). Signed in
 *                     with sync on it also syncs as an author-only held row (store.holdDraft queues it in the same
 *                     transaction), which `keepGate.heldNoteSynced` says; that sentence is a data-handling claim held
 *                     for counsel (C10), so it shows only once SYNCED_HELD_NOTE_CLEARED is switched on, and until then
 *                     every case shows `heldNote`, which is true and says nothing about sync.
 *   heldOn 'letter'   a letter whose words arrived later (task #53, #296): it is already in the book or private, and
 *                     only its words wait, on the letter itself (`heldNoteLetter`, `offlineLetter`). Never Tonight.
 * Lapsed members get `lapsedBody` instead of the body. With no StoreKit on the device the sheet offers only "Keep it
 * here for now" and says why (`gate.unavailable`, `gate.needsNewerIos`); offline, the offline line shows under "See
 * Plus", which stays and tries again. Never a price, a trial, a countdown or a count of what is left (D-083).
 *
 * The held letter itself is drawn at the top (S22 Visual): its dateline, its own words in two lines that end in a
 * fade, "From Mama" and the "Waiting" chip. Its words are the ones stored on this phone (`storedWords`): what Tonight's
 * card and a reopened Review start from, never this Review's unsaved changes. Nothing is sent to show them.
 *
 * "Keep it here for now" runs once (`holdOnce`): a second tap in the same moment does nothing, and a hold that fails
 * still closes the sheet but is not counted as held.
 */
import type { StoreViewSupport } from '../../../modules/scribe-store/types';
import { billingCopy } from '@scribe/content';
import { draftWords, spoken } from '@/components/tonight/draft-card.logic';

export type HeldOn = 'tonight' | 'letter';

/** The held letter as the sheet draws it: Review's own header ("To Asha · Month 7", "From Mama") and its words. */
export type HeldLetter = {
  /** "To Asha · Month 7" as shown. */
  to: string;
  /** The same, read aloud without the separator ("To Asha, Month 7"). */
  toSpoken: string;
  /** "From Mama". */
  from: string;
  /** The letter's words as stored on this phone (`storedWords`), the same words Tonight shows for it. */
  words: string;
};

export type KeepSheetInput = {
  lapsed: boolean;
  heldOn: HeldOn;
  /** Signed in with sync on: a held draft goes up as an author-only row (F14-REQ-039). */
  synced: boolean;
  /** "See Plus" answered that the store could not be reached. */
  offline: boolean;
  storeSupport: StoreViewSupport;
  /**
   * An alpha build (billing/alpha.ts PLUS_ALPHA, from the bundle's APP_ENV): Plus products cannot load there, so the
   * sheet offers no store and its body is the note that Plus is not part of this test (`alpha.note`), with no Plus
   * wording (no body, no lapsed line, no store note). Reached only past MAX_FREE_LETTERS (100). Defaults to false.
   */
  alpha?: boolean;
};

export type KeepSheetView = {
  body: string;
  /** Where the letter waits, said before any button (F14-REQ-028). */
  heldNote: string;
  /** Under "See Plus": why it cannot open, or that it needs a connection. Null when nothing needs saying. */
  note: string | null;
  /** "See Plus" and "Redeem a code" need Apple's store on this device. */
  canOpenStore: boolean;
};

/**
 * Held for counsel (C10, the register row "Keep step and held letter"): "It syncs privately with your account" is a
 * data-handling claim. Switch to true, in one line, once counsel has read `keepGate.heldNoteSynced`.
 */
export const SYNCED_HELD_NOTE_CLEARED = false;

const k = billingCopy.keepGate;
const g = billingCopy.gate;

export function keepSheetView({ lapsed, heldOn, synced, offline, storeSupport, alpha = false }: KeepSheetInput): KeepSheetView {
  const onLetter = heldOn === 'letter';
  const heldNote = onLetter ? k.heldNoteLetter : synced && SYNCED_HELD_NOTE_CLEARED ? k.heldNoteSynced : k.heldNote;
  // Alpha: no store, no Plus wording; the body is the alpha note and nothing sits under the buttons.
  if (alpha) return { body: billingCopy.alpha.note, heldNote, note: null, canOpenStore: false };
  const canOpenStore = storeSupport === 'available';
  const note =
    storeSupport === 'needs_ios_17' ? g.needsNewerIos : storeSupport === 'unsupported' ? g.unavailable : offline ? (onLetter ? k.offlineLetter : k.offline) : null;
  return {
    body: lapsed ? k.lapsedBody : k.body,
    heldNote,
    note,
    canOpenStore,
  };
}

/** The letter's words on one line: runs of white space become one space, so two lines show its first words. */
export function heldWords(words: string): string {
  return words.replace(/\s+/g, ' ').trim();
}

/**
 * The held card is one element for VoiceOver: the dateline without its separator, every word of the letter (nothing
 * is cut for a screen reader), the signature and the chip, in reading order. No count, no date arithmetic. Joined the
 * way Tonight's cards are (`spoken`): a part that already ends in a full stop, "!" or "?" gets no second one.
 */
export function heldCardLabel(held: HeldLetter): string {
  return spoken([held.toSpoken, heldWords(held.words), held.from, k.heldChip]);
}

/**
 * What waits, as stored: a typed draft's typed words, else the spoken draft's transcript; for a letter whose words
 * arrived later, its stored words (later-words.logic puts them in `typedText`). Review's in-place edits, put-backs and
 * view choice are not stored by a hold, so the card never shows them as if they waited.
 */
export function storedWords(d: { typedText?: string | null; rawTranscript?: string | null }): string {
  return draftWords({ typedText: d.typedText ?? null, rawTranscript: d.rawTranscript ?? null }) ?? '';
}

export type HoldOutcome = 'held' | 'not_held' | 'again';

/**
 * "Keep it here for now", once. The guard is set before anything else runs, so a double tap is 'again' and the caller
 * does nothing more (one close, one count). `hold` marks the draft held (store.holdDraft) and says whether it did; a
 * false or a throw is 'not_held': the sheet still closes, the draft stays as it was, and nothing is counted.
 */
export function holdOnce(guard: { current: boolean }, hold: () => boolean): HoldOutcome {
  if (guard.current) return 'again';
  guard.current = true;
  try {
    return hold() ? 'held' : 'not_held';
  } catch {
    return 'not_held';
  }
}

/**
 * The card's tilt (S22 Visual: "rotated -2 degrees"). Held still at accessibility text sizes, where a tilted block of
 * large type is harder to read and its corners would crowd the screen edge.
 */
export function heldCardTilt(accessibilitySize: boolean): string {
  return accessibilitySize ? '0deg' : '-2deg';
}

/** The parts of the Keep sheet: the scroll's blocks, the lines inside its words block, and the footer's buttons. */
export type KeepSheetBlock = 'card' | 'words' | 'seePlus' | 'note' | 'hold' | 'redeem';
export type KeepSheetLine = 'title' | 'heldNote' | 'note' | 'body';

export type KeepSheetLayout = {
  /** The scroll, in order. */
  scroll: KeepSheetBlock[];
  /** The lines of the `words` block, in order. */
  words: KeepSheetLine[];
  /** The footer that stays on screen, in order. */
  pinned: KeepSheetBlock[];
};

/**
 * Where each part of the sheet sits (P6a critics' pass S1, and both lenses on #370). At the default size the held card is
 * at the top, then the title, the body and the held note, and every button with its note is in the footer.
 *
 * At accessibility text sizes the words alone fill the first screen (at AX3 the title, body and held note reach about
 * 780 pt), so the footer holds the two buttons and nothing else: "See Plus" and "Keep it here for now", always on
 * screen. Every line of text is in the scroll, because uncapped text in a footer can grow taller than the sheet (the
 * 96-character offline note at AX5 on an SE made the footer about 865 pt in a 667 pt screen). The held note, the line
 * that says the letter is safe, comes right after the title (F14-REQ-028: said before any offer), then the note about
 * See Plus, then the body; the held card and "Redeem a code" follow. The scroll comes first in reading order, so the
 * held note is read before any button at every size.
 */
export function keepSheetLayout(accessibilitySize: boolean): KeepSheetLayout {
  return accessibilitySize
    ? { scroll: ['words', 'card', 'redeem'], words: ['title', 'heldNote', 'note', 'body'], pinned: ['seePlus', 'hold'] }
    : { scroll: ['card', 'words'], words: ['title', 'body', 'heldNote'], pinned: ['seePlus', 'note', 'hold', 'redeem'] };
}
