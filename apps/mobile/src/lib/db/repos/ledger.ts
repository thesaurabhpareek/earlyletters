/**
 * The database side of the letter ledger (D-082, D-083, D-133): the mirror in
 * settings key `letters.keptEver`, and the count of letters and notes present. Pure
 * functions over a SqlDb like every repository; the Keychain side and the max
 * rule live in lib/billing/letter-ledger.ts. Rules and the three sources are
 * described in lib/billing/letter-ledger.logic.ts.
 */
import {
  applyKept,
  hasWords,
  LEDGER_SETTING_KEY,
  parseLedger,
  raised,
  serializeLedger,
  type LedgerState,
} from '../../billing/letter-ledger.logic';
import { SYNC_SETTING } from '../../sync/outbox';
import type { RepoContext } from './context';
import * as settings from './settings';

/** The account that owns this phone's letters, set at the first sign-in (sync/ownership.ts). */
const OWNER_SETTING = SYNC_SETTING.owner;

export function readState(ctx: RepoContext): LedgerState {
  return parseLedger(settings.getSetting(ctx, LEDGER_SETTING_KEY));
}

/**
 * The M17 ledger query (D-103, drafted as D-092 in PR #128; F14-REQ-036,
 * F14-REQ-037): letters and notes present in the database that count toward
 * the free letters. A kept note counts like a letter (D-133, 31 Oct; SR-C-16):
 * Review's note-or-letter choice must never be a way past the Keep gate. A row
 * counts only when all three hold:
 *   own      its author is this phone's account (`sync.ownerId`), or it has no
 *            author (made on this phone before any sign-in). The other parent's
 *            synced letters never count, and never raise the mirror or Keychain.
 *   worded   its words exist: not a voice-only letter still waiting for them,
 *            and at least one letter or digit (hasWords, the Keep gate's rule;
 *            marks alone such as "..." are not words). SQLite has no Unicode
 *            letter class, so that last test runs on the rows the query returns.
 *   kept     kept from Review with the words on screen: words the machine wrote
 *            later count only once the author keeps them (transcript_status
 *            'unreviewed' until then, entries.ts).
 * Spoken or typed, in the Book or private, including the delete window (the
 * ledger never decreases). Quiet-day marks (`not_much`) and drafts never count.
 * The kind test names the two kinds that count rather than excluding the mark,
 * so a kind added later counts only when someone decides it should.
 *
 * Known gap (PR body, requests to S02 and S07): the server row carries no
 * review mark, so on a second phone of the same author a pulled letter whose
 * machine words are still unreviewed reads as kept.
 */
export const COUNTED_LETTERS_SQL = `kind IN ('letter', 'note')
  AND (author_id IS NULL OR author_id = ?)
  AND transcript_status IS NULL
  AND trim(final_text) <> ''`;

export function countPresent(ctx: RepoContext): number {
  const owner = settings.getSetting(ctx, OWNER_SETTING) ?? '';
  return ctx.db.all<{ t: string | null }>(`SELECT final_text AS t FROM entries WHERE ${COUNTED_LETTERS_SQL}`, owner).filter((r) => hasWords(r.t)).length;
}

/** Whether one letter or note counts by the rule above (the save path asks before recording it). */
export function counts(ctx: RepoContext, id: string): boolean {
  const owner = settings.getSetting(ctx, OWNER_SETTING) ?? '';
  return hasWords(ctx.db.get<{ t: string | null }>(`SELECT final_text AS t FROM entries WHERE id = ? AND ${COUNTED_LETTERS_SQL}`, id, owner)?.t);
}

/**
 * Counts one kept letter or note, inside the caller's transaction (the row is
 * already written, so `present` includes it). Idempotent per id. A row that does
 * not count by the M17 rule (another author's, no words yet, words not yet
 * reviewed, a quiet-day mark) changes nothing.
 */
export function recordKept(ctx: RepoContext, id: string, floor: number): LedgerState {
  const before = readState(ctx);
  if (!counts(ctx, id)) return before;
  const after = applyKept(before, id, { floor, present: countPresent(ctx) });
  if (after !== before) settings.setSetting(ctx, LEDGER_SETTING_KEY, serializeLedger(after));
  return after;
}

/** Raises the mirror to at least `n` (after a reinstall found a higher Keychain count, or letters were restored). */
export function raiseTo(ctx: RepoContext, n: number): LedgerState {
  const before = readState(ctx);
  const after = raised(before, n);
  if (after !== before) settings.setSetting(ctx, LEDGER_SETTING_KEY, serializeLedger(after));
  return after;
}

/** Erase everything: removes the mirror. */
export function clear(ctx: RepoContext): void {
  settings.deleteSetting(ctx, LEDGER_SETTING_KEY);
}
