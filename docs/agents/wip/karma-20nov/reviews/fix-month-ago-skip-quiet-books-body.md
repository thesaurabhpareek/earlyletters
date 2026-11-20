Agent: mobile
Mode: task quiet books and consent key (Karma, 20 Nov), ahead of BL-946
Satisfies: NS-23-R8 (for the built card), J-N19 (past-letter part)
Data classes touched: none new. Reads `child_member_prefs.quiet_at` (L2, phone only) through `Child.quiet`. Nothing is written, sent or logged.

## What and why

The built "A month ago" card ignored Quiet this book. `resurfaced()` took no quiet input (`apps/mobile/src/components/tonight/draft-card.logic.ts:190-206` on develop), and Home passed it the open book's entries only (`apps/mobile/src/app/(tabs)/index.tsx:200`). So a book this person quieted could still bring a letter back on Home. J-N19 (P0) and NS-23-R8 (P0) forbid that.

This PR:
- `resurfaced()` takes a required `book: { quiet: boolean }` and returns null for a quiet book (`draft-card.logic.ts:196-198`). It is required so no caller can leave the guard out. The 9 existing calls in `test/draft-card.test.ts` now pass a not-quiet book (`AWAKE`), and their assertions are unchanged.
- Home's room reads the open book's `Child.quiet` along with the rest of the room (`index.tsx:103, 109`) and passes it (`index.tsx:210`). The room is already read again on any store change (`index.tsx` `subscribe(load)`), so quiet and unquiet show at once.
- Hidden books: a hidden book is never the open one, because `getActiveChildId` lists visible books only (`store.ts`). The new test pins that on the real store, so NS-23-R8's "hidden" half holds by construction.

Design: this is the quiet guard from `10-reading-and-family` section 3, NS-23 PR 1 ("add the quiet guard to the built `resurfaced()` outside the flag"). It ships the guard only. The slip registry and `[FRAME-SLIP]` from that PR are left for NS-23 PR 1 proper. The design asks for the `[NS-23-R8]` test to run "with the flag off and on". `EXPO_PUBLIC_PAST_LETTER` does not exist yet (NS-23 PR 3 adds it), so the guard sits in the built card, outside any flag.

No new words.

## How it was checked

`apps/mobile/test/month-ago-quiet.test.ts` (fictional family Asha and Avi):
- `[NS-23-R8] quiet book never resurfaces`: a quiet book gives no card, and unquiet brings the same letter back (J-N19).
- A source pin that Home reads `getActiveChild()?.quiet` with its room and passes it to `resurfaced`.
- On the real store (node:sqlite): quiet the open book and the card goes. Unquiet and it returns, and the letter itself is untouched. A hidden book is never the open one, so its letter never comes back.

On develop (`8343d119`) all 3 fail. On this branch they pass, and so do the 63 tests in `draft-card.test.ts`. The apps/mobile suite matches the sandbox baseline (8 files, 73 tests failing on the missing `expo-local-authentication` and `expo-clipboard`). `tsc --noEmit` shows the 5 known errors only, and `npm test -w packages/content` passes (395).

## What only a phone can prove

- First frame: the room now does one more synchronous SQLite read (`getActiveChild`) on each read. `getFamily` already does the same read, so the cost should be under a millisecond, but B-NFR-008 (interactive within 300 ms) was not measured on an iPhone SE 3. That stays with the BL-929 device check.
- Nothing calls `setChildQuiet` yet (NS-22 adds the button).

## Way back

Revert this commit. The card goes back to ignoring quiet, and nothing stored changes.

## Globs touched

`apps/mobile/src/components/tonight/draft-card.logic.ts`, `apps/mobile/src/app/(tabs)/index.tsx`, `apps/mobile/test/draft-card.test.ts`, `apps/mobile/test/month-ago-quiet.test.ts`.

Overlaps, checked with `git merge-tree`:
- #838 (photo 4b) also edits `index.tsx`. It merges cleanly with this PR.
- Draft #721 deletes `resurfaced()` and replaces it with a "From the book" card. It now conflicts with this PR in three files. Whichever lands second must carry the quiet guard into the surviving picker.

## Founder, look first at

The #721 overlap: if "From the book" replaces "A month ago", its picker needs the same guard (J-N19).

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
