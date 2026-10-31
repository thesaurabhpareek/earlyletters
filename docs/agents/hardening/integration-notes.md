# Integration notes: fix/injection-integrated

Base: origin/fix/injection-dispatch (f2b6a3af). Merged one at a time, agents suite run after each.

| # | Merged | Head | Result |
|---|---|---|---|
| 1 | fix/injection-brief | bdf76e47 | 1 conflict (hardening.mjs), injection.test.mjs auto-merged. Suite: 211 tests, 207 pass, 0 fail, 4 todo |
| 2 | feat/agent-pathguard | c02c1258 | clean (new files only). 283 tests, 279 pass, 0 fail, 4 todo |
| 3 | fix/opencode-runner-hardening (includes test/opencode-contract) | cec0cc00 | clean. 332 tests in the final run, 328 pass, 0 fail, 4 todo |

Before: dispatch branch alone was 204 tests, 184 pass, 0 fail, 20 todo.

## Conflicts and resolution

`scripts/agents/hardening.mjs`: both branches appended a new block at the end of the file (dispatch: H1 to H5, H11; brief: H6 to H10, H12, H13). Resolved as a pure union, no code changed; every export either side's tests import is present. The duplicate `import` line did not occur (only `isTrusted` is imported). `injection.test.mjs` merged without conflict, because the two sides edited different tests. No semantic change was needed.

## Exports of hardening.mjs by owner

- Original (before this work): `oneLine`, `verdictPhrase`, `trustedJournalEntries`, `d041Pool`, `needsIndependentReview`, `nextIds`.
- T1, dispatch (H1 to H5, H11): `idReservingPRs`, `spendFromReceipts`, `verdictOf`, `capNotice`, `cleanState`, `lastStateMarker`, `boardText`, `NO_TRUST_MSG`.
- T2, brief (H6 to H10, H12, H13): `UNTRUSTED_TEXT_RULES`, `UNTRUSTED_REVIEW_WARNING`, `quotedLine`, `safeBranch`, `checkoutLine`, `branchLabel`, `fileList`, `quoteBlock`, `handoffRefusal`.

## Known conflict with open PR #354 (not merged here)

`dispatch.mjs`: the `status` expression and the `spendToday` body conflict (details in `injection-dispatch-conflicts.md`). Two recommendations for #354's author:
1. Receipts are posted by `github-actions[bot]`, which `isTrusted` rejects. #354's `isTrusted(c, trust) && startsWithMarker(...)` check would drop every real receipt and show spend as unknown. Use `ledgerRow` (trusted author, or github-actions[bot] for receipts only), via `spendFromReceipts` from this branch.
2. #354 stores `state.traces` (an array) in the board state. `cleanState` keeps only listed keys, so add `traces: "array"` to `STATE_KEYS` and accept an array for it when #354 lands.

## Holes remaining under `INJECTION_STRICT=1` (injection.test.mjs: 89 tests, 86 pass, 3 fail)

- H15: commands that send the environment out are not denied (a deny list cannot close it; needs a scoped token and no secrets in the model process).
- H16: edits under `.github/workflows` are allowed.
- H2, second half: 1,000 spam comments on a journal issue hide the founder's newer note (`ghAll` cap in `brief.mjs`; needs locking journal, board and handoff issues, and a cap warning in the brief).
- H14 now passes (W1's round 3).

## Leftover noted for W1's change

Branches whose names start with `develop` or `main` right after `origin` (for example `main-page`) are still blocked, because `lib.test.mjs` asserts the legacy globs. `lib.test.mjs` was not changed here.

## Other

The one non-ASCII character in `injection.test.mjs` (line 123) is a deliberate zero width space used as test data for `startsWithMarker`, so it was left in place. The changed docs are ASCII only.
