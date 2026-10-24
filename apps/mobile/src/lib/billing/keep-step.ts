/**
 * The Keep step around one save of a person's words (D-082, D-083; M17, D-103; F14 6.2 B and B2),
 * shared by every screen that keeps words, so the rule lives in one place and its tests run it:
 *
 *   keepSheetFor(words)        before writing. The gate when the Keep sheet must open (the caller opens it
 *                              and writes nothing), or null when the save may go ahead. Words on screen are
 *                              asked about (keepGateFor); no words (empty, blank, marks only) never are.
 *   afterKeep(words)           after writing. Copies the count to the Keychain. With words on screen, notes
 *                              the moment the free letters are used (free_allowance_reached, once, when Plus
 *                              is off and the count reaches the allowance) and answers true when the
 *                              "second free letter" line shows. A save without words never counts, so it
 *                              never notes anything.
 *   keepWords({ words, write })   both around one write, for a save that is a single store call (the letter
 *                              page's Save words and Read it back).
 *
 * Analytics carry numbers only (letters kept, allowance, lapsed). Never throws past the store's own write.
 */
import { track } from '../analytics/track';
import { afterLetterKept, freeLettersAllowance, hasPlus, keepGateFor, type KeepGate } from './gates';
import { hasWords } from './letter-ledger.logic';

/** Before the write: the gate when the Keep sheet opens instead, else null (go ahead). */
export async function keepSheetFor(wordsOnScreen: string): Promise<KeepGate | null> {
  const g = await keepGateFor({ wordsOnScreen });
  // null: no words on screen. Under M17 that save never counts (the ledger uses the same hasWords rule), so
  // there is nothing to gate: no ledger read, no sheet, the save goes ahead at once.
  if (g === null || g.decision.kind === 'allow') return null;
  track('keep_gate_shown', {
    letters_kept: Math.min(1000, g.lettersKept),
    allowance: Math.min(100, Math.max(2, g.allowance)),
    lapsed: g.decision.lapsed ? 1 : 0,
  });
  return g;
}

/** After the write: mirror the count; true when the "That was your second free letter." line shows. */
export async function afterKeep(wordsOnScreen: string): Promise<boolean> {
  const kept = await afterLetterKept();
  if (!hasWords(wordsOnScreen)) return false; // never counted (M17): no line, no free_allowance_reached
  const allowance = freeLettersAllowance();
  if (hasPlus() || kept !== allowance) return false;
  track('free_allowance_reached', { allowance: Math.min(100, allowance) });
  return allowance === 2;
}

export type KeepWordsResult =
  /** Plus is needed: the caller opens the Keep sheet. Nothing was written. */
  | { kind: 'sheet'; gate: KeepGate }
  /** Written. `secondFree`: show the second-free line. */
  | { kind: 'kept'; secondFree: boolean }
  /** The store wrote nothing (already done, deleted, or not waiting); nothing was counted. */
  | { kind: 'unchanged' };

/** One save of words that is a single store call: gate, then the write, then the count. */
export async function keepWords(save: { wordsOnScreen: string; write: () => boolean }): Promise<KeepWordsResult> {
  const gate = await keepSheetFor(save.wordsOnScreen);
  if (gate) return { kind: 'sheet', gate };
  if (!save.write()) return { kind: 'unchanged' };
  return { kind: 'kept', secondFree: await afterKeep(save.wordsOnScreen) };
}
