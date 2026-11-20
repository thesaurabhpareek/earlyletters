## Review A at 4879ff5c82ea3ac7f419db17c9ffdfcb27c3402b: PASS WITH NOTES
<!-- agent:principal-architect -->

Lens A: correctness, tests that fail on the old code, code shape. PR 2 of the BL-961 stack. #869 is squash-merged into develop as c1306b18, and this PR now targets develop. Its head 4879ff5c is 46608dd4 with develop merged in, nothing else. This confirms Review A at 46608dd4 (PASS WITH NOTES) at the new head.

Must fix: none.

### Same change as the head I reviewed
- `git diff <merge-base f04cdf4b> 4879ff5c` against `git diff 427f1fea 46608dd4` (the delta reviewed before): the two patches are identical, ignoring `index` lines. The stat is 11 files, 390 insertions and 5 deletions, as before.
- Every file this PR changes has the same blob at 4879ff5c as at 46608dd4, so develop's newer commits touch none of them.
- #869 as merged (c1306b18) carries the reader `bookVisibleTo` that this delta builds on.

### What I checked at this head
- Head 4879ff5c, committed 12:25 UTC on 20 Nov, more than 10 minutes old at review.
- Tests:
  - account-scope, account-gate, account-layer, account-route and use-first-run-route: 5 files, 83 passed.
  - Full mobile suite at the top of the stack (#879 head e27d104e, which contains this delta and develop to f04cdf4b): exactly the 8 known sandbox baseline files (73 tests). `tsc --noEmit`: only the 5 known errors.
- The red-on-old-code proof from the earlier review still applies: the delta is byte-identical, and its base reader is the same code. 5 tests fail on the reader alone and pass here.

### Findings (notes, carried from Review A at 46608dd4, most serious first)
1. The gate's owner input still fails open when a caller leaves it out. `bookVisible?` and `gateInputsFromAuth`'s optional `phoneOwner` mean `route.logic.ts:31-44` (`welcomeBeginAllowed`) still asks without the owner. The route's `blank` and the cover keep B from reaching it. Making `phoneOwner` required would let the gate hold on its own.
2. A phone with a stale owner and nothing on it holds B and says "This phone has a book from another account". This can happen after a kill during `signingOut`, because `releaseEmptyPhone` runs only on the signed-in-to-signed-out edge (`sync/index.ts:252-258`). Signing out clears it. Put this case beside the PROPOSED words for the founder.
3. The design names the one action "Use another account (sign out)" (`08-keeping.md:132`); the PR uses the approved "Sign out". This is for the founder, under `needs:founder`.
4. Outside iOS the cover is a plain `View` (`zIndex: 999`). Mark it as the web-preview stand-in, not a shipped Android cover.
5. `account-layer.test.ts` pins source strings. It is brittle in the safe direction.
6. Cold-start frames before the Keychain read names B (device row 4) belong on the Build 13 device sheet.

### Not verified
- Device rows 1 to 5 in the body.

CI at the head (13:00 UTC): every check completed with success, including `required`, `tests and content rules`, `typecheck`, `database rules` and `compliance-fence`, except `store-profile Release launch`, which was still queued on the macOS runner after more than 30 minutes. It is outside `required`; I finalised without it. The iOS simulator build was skipped. One `compliance-fence` run was cancelled; its sibling run succeeded.
Reviewer: independent of the author (CR-44).
