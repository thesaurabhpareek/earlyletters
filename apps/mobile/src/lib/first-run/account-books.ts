/**
 * The one `sync_books()` call that tells a new account from a returning one and from one that already has a book
 * (account-books.logic.ts says what the answer means). Bounded: it waits `ACCOUNT_BOOKS_WAIT_MS` and never throws, so the
 * screen that asks is never held up by it; a failure, a timeout or an unreadable answer is `unknown`, which shows "No book
 * here yet". Counts one call in the pull bucket (120 a minute per person). Sends nothing but the signed-in session.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { ACCOUNT_BOOKS_WAIT_MS, kindFromRpc, settleWithin, type AccountKind } from './account-books.logic';

export async function readAccountBooks(sb: SupabaseClient, waitMs: number = ACCOUNT_BOOKS_WAIT_MS): Promise<AccountKind> {
  const settled = await settleWithin(() => sb.rpc('sync_books'), waitMs);
  return kindFromRpc(settled);
}
