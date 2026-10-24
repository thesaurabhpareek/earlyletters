/**
 * The Keep step around one save of a person's words in Review (D-082, D-083; M17, D-103; F14 6.2 B),
 * so the rule lives in one place and its tests run it (test/keep-step.test.ts):
 *
 *   keepSheetFor(wordsOnScreen)  before writing. The gate when the Keep sheet must open (the caller opens it
 *                                and writes nothing), or null when the save may go ahead. Words on screen are
 *                                asked about (keepGateFor); no words (empty, blank, marks only) never are.
 *   afterKeep(wordsOnScreen)     after writing. Copies the count to the Keychain. With words on screen, notes
 *                                the moment the free letters are used (free_allowance_reached, once, when Plus
 *                                is off and the count reaches the allowance) and answers true when the
 *                                "second free letter" line shows. A save without words never counts, so it
 *                                never notes anything.
 *
 * Analytics carry numbers only (letters kept, allowance, lapsed). Never throws.
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
