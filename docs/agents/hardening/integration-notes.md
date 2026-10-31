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

## Round 4: red-team blockers fixed in scripts/agents (head after this section's commit)

| Finding | Change | Tests |
|---|---|---|
| A. Identity not label-only | New `identity.mjs` (label, branch prefix `agent/<handle>/`, bot author). `pathguard.mjs --labels` takes optional `--branch`, `--author`, `--author-type`, `--app-logins`; branch or bot author without a label, or a label and branch handle that disagree, exit 1. `guard-open-prs.mjs` counts label OR branch OR bot author. `dispatch.mjs` team cap uses `agentLikePR`. `lib.agentOfPR` stays label-only on purpose: a stranger's branch named `agent/qa/x` must never be routed, reviewed or briefed as an agent PR. | identity.test.mjs |
| B. Journal spam (rest of H2) | `brief.mjs` reads the journal comments newest page first (`newestPages`), stops at 3 trusted entries or 10 pages. | injection.test.mjs (1,200 spam comments), identity.test.mjs |
| C. Hard rules | `.npmrc`, `.gitattributes` (any directory), `.husky/**`, `opencode.json`, `AGENTS.md`, `.git/**` added to `HARD_RULES`; `.claude/**` was already there. Case, trailing dots and spaces, and backslashes were already normalised; now tested for the new rules. | identity.test.mjs, pathguard.test.mjs |
| D. Deny patterns | Bare `git push` forms, `--all/--mirror/--tags/--follow-tags`, tag refs, `heads/develop|main`, `--no-pager/-P/--git-dir/--work-tree` prefixes, `--receive-pack`, `--exec=`, and gh api write verbs in `=`, two-space, `-XV`, lower-case spellings. | opencode-deny.test.mjs |

Limits and caveats:
- Caller must pass `--branch` and `--author` to pathguard. If the workflow omits them, the check is only as strong as before (UNVERIFIED wiring, no workflow runs it yet).
- A bot-authored PR with no `agent:*` label (for example Dependabot) now exits 1 in pathguard. That is the requested fail-closed behaviour; the workflow PR must decide whether to skip known bots before calling it.
- The new deny patterns are glob tests with the offline matcher. Engine behaviour is UNVERIFIED: how opencode matches `git --no-pager push`, double spaces and quoted forms was not run on the real binary. They remain a tripwire, not a boundary.
- The `injection.test.mjs` zero width space (line 123) is deliberate test data and stays.

## Needs the workflow PR after 9 Nov

Not attempted here (`.github/**` is frozen and these need the two-job split). Red-team reasoning:
- `pathguard.mjs` and `guard-open-prs.mjs` are not run by any workflow, so today they protect nothing. They must run as a required step before push, from a clean checkout of `develop`, not from the PR's tree.
- `salvage.mjs` and `receipt.mjs` run from the model-editable working tree with write tokens. The model can edit them and then have its own code run with the token. They must run from a trusted checkout in a second job.
- `OPENROUTER_API_KEY` and `GH_TOKEN` are readable by the model's shell (see the comment on the env allowlist in `run-opencode.mjs`). Fix: a job split where the model job holds no write token, and a proxy for the model key with its own budget.
- `gh issue comment`, `gh pr comment`, `gh release`, `gh gist` are unrestricted by the deny list. A comment is an exfiltration channel and a release can publish. Needs token scope or lane control, not globs.
