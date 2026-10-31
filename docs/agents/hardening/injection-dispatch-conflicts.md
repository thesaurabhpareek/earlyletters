# Branch `fix/injection-dispatch`: overlap with open PRs #349 and #354

Checked 31 Oct 2026 with `git merge-tree --write-tree --name-only` of this branch (after commit "wiring") against the PR heads fetched with `git fetch origin pull/349/head pull/354/head` (#349 head 44eba198, #354 head 9a13b070; both branch from 6bfb94a9). Neither PR branch was edited.

## What this branch changes

Logic in `scripts/agents/hardening.mjs` (new exports `idReservingPRs`, `spendFromReceipts`, `verdictOf`, `capNotice`, `cleanState`, `lastStateMarker`, `boardText`, `NO_TRUST_MSG`). Wiring, all in the last commit "wiring":

| File | Wiring |
|---|---|
| `lib.mjs` | import from hardening; `takenIds(openPRs, trust)` filters with `idReservingPRs`; `readState` uses `lastStateMarker` and `cleanState` (the `STATE_RE` constant is removed); `ghAll` records capped paths in the exported `CAP_HITS`; `stewardVerdict` uses `verdictOf` |
| `dispatch.mjs` | imports; `takenIds(openPRs, trust)`; `capNotice(CAP_HITS)` sets `slots = 0` and the board status; `redVerdict` uses `verdictOf`; `spendToday` body is one call to `spendFromReceipts`; handoff title on the board goes through `boardText` |
| `ledger.mjs` | `verdictOf` replaced by the shared helper |
| `verdicts.mjs` | `redTeamRows` returns `[]` with no trust; `refresh` throws `NO_TRUST_MSG`; `boardLines` logs the message |

Tests also changed: `lib.test.mjs` "open agent PR branches and titles mark tasks as taken" now gives its PRs an `agent:qa` label (a PR with no label and no trusted author no longer reserves an id, which is H1). `injection.test.mjs`: tests for H1, H2, H3, H4, H5, H11 only.

## #349 (edits `lib.mjs`): no textual conflict

`merge-tree` is clean. #349 edits `isFounderComment`, `trustContext` and `isTrusted` (new `isFounderAccount`, `isAgentIdentity`, `authorKind`, `trustLabel`); this branch edits `takenIds`, `readState`, `ghAll` and `stewardVerdict`. The hunks do not touch.

Semantic points to check after both land (UNVERIFIED, the merged tree was not run):
- `idReservingPRs` calls `isTrusted` with a default trust object when `takenIds` is called without one (`brief.mjs:193`). That object has no `appId`; #349's `isAgentIdentity` guards with `trust.appId &&`, so it works. A PR from the founder's account is trusted either way (OWNER association).
- #349 makes `isTrusted` for a founder account ignore a Bot type. No effect here.

## #354 (edits `dispatch.mjs`): 2 conflicting hunks, plus one silent loss

`merge-tree` reports a content conflict in `scripts/agents/dispatch.mjs` only.

1. `const status = ...` (about line 213). Mine: `const status = cap.stop ? cap.message : paused ? ...`. #354 rewrites the whole expression with `laneLabel`. Resolve by taking #354's version and putting the cap case first: `const status = cap.stop ? cap.message : paused ? ... (rest of #354)`. The `let slots = BOARD_ONLY || cap.stop ? 0 : ...` change (about line 195) merges cleanly.
2. `spendToday` body (about line 384). Mine: `return spendFromReceipts(comments, trust, ledgerRow);`. #354 keeps the loop and adds `isTrusted(c, trust) && startsWithMarker(...)`. Resolve by keeping mine and dropping #354's loop; keep #354's new `spendLine`. Reason: #354's check uses `isTrusted`, which rejects `github-actions[bot]`, the account that posts real receipts (ledger.mjs `ledgerRow` exists for that reason). With #354's loop alone every real receipt would be dropped and the board would show spend as unknown. `spendFromReceipts` needs `import { ledgerRow } from "./ledger.mjs"` and the hardening import, both on one line each.

Silent loss, not a conflict: #354 stores `state.traces` (an array) in the board state. `cleanState` (H11) keeps only the keys in `STATE_KEYS`, so after merging, `traces` would be dropped on every read and the "Finished runs" lines would never show. Re-apply: in `hardening.mjs` add `traces: "array"` to `STATE_KEYS` and let `cleanState` accept an array for that key. This was not committed here because the wiring commit has to stay last and history rewrites were not allowed in this session. The same applies to any key a later PR adds to board state.

Also in #354: the DRY run now calls `spendToday()` (it returned zeros before). With this branch that is still safe (`spendFromReceipts` reads comments only).

## Order that causes least rework

Land #349 first (no conflict). Land #354 next with the two resolutions above, or land this branch first and let #354 rebase: its `status` and `spendToday` hunks are the only ones to redo.
