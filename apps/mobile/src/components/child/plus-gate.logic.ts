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
 * fade, "From Mama" and the "Waiting" chip. Its words are read from this phone; nothing is sent to show them.
 */
import type { StoreViewSupport } from '../../../modules/scribe-store/types';
import { billingCopy } from '@scribe/content';

export type HeldOn = 'tonight' | 'letter';

/** The held letter as the sheet draws it: Review's own header ("To Asha · Month 7", "From Mama") and its words. */
export type HeldLetter = {
  /** "To Asha · Month 7" as shown. */
  to: string;
  /** The same, read aloud without the separator ("To Asha, Month 7"). */
  toSpoken: string;
  /** "From Mama". */
  from: string;
  /** The letter's words as they would be kept (Review's finalText). */
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

export function keepSheetView({ lapsed, heldOn, synced, offline, storeSupport }: KeepSheetInput): KeepSheetView {
  const onLetter = heldOn === 'letter';
  const canOpenStore = storeSupport === 'available';
  const note =
    storeSupport === 'needs_ios_17' ? g.needsNewerIos : storeSupport === 'unsupported' ? g.unavailable : offline ? (onLetter ? k.offlineLetter : k.offline) : null;
  return {
    body: lapsed ? k.lapsedBody : k.body,
    heldNote: onLetter ? k.heldNoteLetter : synced && SYNCED_HELD_NOTE_CLEARED ? k.heldNoteSynced : k.heldNote,
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
 * is cut for a screen reader), the signature and the chip, in reading order. No count, no date arithmetic.
 */
export function heldCardLabel(held: HeldLetter): string {
  return [held.toSpoken, heldWords(held.words), held.from, k.heldChip].filter((part) => part.length > 0).join('. ');
}

/**
 * The card's tilt (S22 Visual: "rotated -2 degrees"). Held still at accessibility text sizes, where a tilted block of
 * large type is harder to read and its corners would crowd the screen edge.
 */
export function heldCardTilt(accessibilitySize: boolean): string {
  return accessibilitySize ? '0deg' : '-2deg';
}
