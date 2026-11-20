## Review A at 92e37929a82f790738ad62b810ca47c739956c1c: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. Head read live (`gh api pulls/895 .head.sha`): `92e37929` (12:37 UTC). Since my last round at `a33fcba8` (CHANGES, one must-fix), four commits landed:
- `7469d39f`, the fix in `store.ts`;
- `63652939`, a merge that brings only the #881, #885 and #894 fixes (`snippet.ts`, `lifecycle.ts`, `pause.ts` and their tests);
- `d699af40`, a check-in line;
- `92e37929`, the `_layout.tsx` call.

### What I checked this round
- `7469d39f`. `openStore` no longer schedules anything, and the 3 s timer is gone. `startFindCatchUp()` (`store.ts`) runs the batched catch-up once per open store. It does nothing when the store is not open or when Find is off with nothing of Find on the phone.
- `92e37929`. `_layout.tsx:110` calls `safely(startFindCatchUp)` inside `startServices`, right after `startPacks`. `startServices` runs only inside the `requestAnimationFrame` callback, once the 18+ gate passes (`_layout.tsx:194-197`), so the catch-up starts after the first frame, beside the other boot services that `lib/README.md` lists.
- Tests that pin it:
  - a source test checks the import, the one call, its place after `startPacks`, and that `startServices` runs only in the frame callback;
  - the store test checks that opening the store calls nothing, that the catch-up runs once after `startFindCatchUp`, and that a second call does nothing.
  - Mutation: with the `_layout.tsx` line removed, the source test is red (1 failed, 8 passed). I restored the line and the worktree was clean.
- S1-205 (k) and `lib/README.md` now say "after the first frame". My finding 6 from last round is closed.
- Together with #885's trust fix, the window in which a half-built index could be read is gone: until the catch-up finishes, the scan answers.
- Size: 12 files, +338/-10, inside CODE-R02. 0 non-ASCII bytes added. `_layout.tsx` sits outside the BL-952 claim; the body says Karma ruled it in, and that #871 also edits the file, so whichever lands second merges develop.
- Tests at this head:
  - all seven Find files: 77 pass;
  - `tsc --noEmit`: the 5 known errors only;
  - full `apps/mobile` suite: 281 files, 273 pass, 8 fail with 73 tests (app-lock-wiring, capabilities, config, hosting-ios17, licences, preflight-production, privacy-manifest, store-sign-in-capabilities). That is exactly the sandbox baseline, and no Find, repo, sync, store or layout test is among the failures.
- CI at this head, read 12:46 UTC: `required`, `tests and content rules` and `typecheck` succeeded. `store-profile Release launch` was still running; it is not required.

### Findings, most serious first
1. Note. `startFindCatchUp` returns early when the store is not open at that moment (`!conn?.result.ok`), and nothing calls it again in that process. In that case no catch-up runs, so the index is never trusted and the scan answers. That is safe, but Find stays on the slow path until the next launch. A call from the store-retry path, or a sentence in the comment, would settle it.
2. Note, carried. Hide, unhide and book restore write the pref and reconcile in two autocommits (`hideChild`, `unhideChild`, `restoreBook` in `store.ts`). Card R16a asks for one transaction.
3. Note, carried. `reconcileSearch` runs in full in every sync transaction. S1-205 has no step for the card's "under 20 ms at 1,000 letters" nor for R36.
4. Note, carried. The account half waits for #879. When it merges, the follow-up should also wire `setIndexableBooks(() => (bookVisibleNow() ? null : []))`.

Must fix: none.

### Not verified
- Every S1-205 step (device).

Reviewer: independent of the author (CR-44).
