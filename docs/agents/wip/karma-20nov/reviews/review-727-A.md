## Review A at 26e9f3be6140ab1e67cf2f1e80a412679fe2e2a8: PASS

Second review (lens A: accuracy against the code and repo records), delta only against my review at 3d629af5. Head matched the PR (`gh api` returned 26e9f3be). It supersedes my earlier file.

**What changed.** Two commits on 3d629af5: d7a80929 (content, `docs/BACKLOG.md`, 22 insertions, 20 deletions) and a merge of develop e5ecc5f8 (#704, #705, #706: agent scripts and harness docs, none touching BACKLOG.md; `git log c350be3e..origin/develop -- docs/BACKLOG.md` is empty). Against the merge base (develop's tip e5ecc5f8) the PR is `docs/BACKLOG.md` alone, 29 added lines; no code, test, PRD, QA or other doc changed. `git merge-tree --write-tree origin/develop origin/pr-727` exits 0. CI at this head: all runs success including "required" (one duplicate compliance-fence run is cancelled, the other succeeded); a PASS holds only while that stays green at this exact head.

**What I ran at this head.**
- `scripts/agents/check.mjs`: agent team consistent, 397 tasks.
- `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs`: 170 pass, 0 fail (develop now has more tests than before).
- `eligibility()` on BL-816: `{"status":"ready","mode":"agent","owners":["mobile engineer"],"deps":[]}`, ok true, so dispatchable as before; the `mobile` queue is 46 long and BL-816 is position 46, the first is BL-355. That is what the row now says.
- Content vitest: 367 pass. `trace.mjs`: 838 defined, 773 P0, the same 10 undefined as develop (this row adds none).
- Added lines against develop (29): 0 non-ASCII bytes, no three-dot runs, no pronouns, only Asha. Live `id-collisions.mjs`: BL-816 appears under #727 alone, no collision; `next-id.mjs` prints BL-817 with this PR counted. (It reports a device-row collision, S1-140, among #665, #699 and #720; not this PR.)

### The notes I raised, checked
- **Severity.** The field reads "S1 proposed (S0 by the legend until ruled)". True to the legend (BACKLOG.md:2530: S0 "can lose a word ... now"). It cites `RELEASE.md` 5.4 and TF-09 correctly: line 198 says C0 to C1 needs no open S0, and C1 to submission needs no open S0 or S1. It names the call as release scope (the founder's) with the CPO recommending. It says "Unlike BL-775, no CCO-6 ruling calls this not blocking", and "same reasoning as BL-775" is gone from the row. F06-REQ-036 is stated P0, which `F06-faithful-edit.md:306` confirms, and "not met in a burst" is what I reproduced earlier (seed 40, and 0 writes in a 3 s burst).
- **Acceptance.** Each line starts "Maximum wait" or "Retry after a throw". The cancel case is there ("`cancel` clears both"), beside `store.review-v9.test.ts:188`; I confirmed again that `review.tsx` never calls `cancel`. A refused write (callback returns false or the draft is gone) is not retried: that matches `drafts.ts:261-286` (false for a missing draft, state `recording` or `discarding`, an empty base or a bad view) and the callback at `review.tsx:306-308`, which ignores the return. The requirement forbids a self-re-arming timer, so a gone draft cannot loop.
- **Evidence.** Problem 5 and the Satisfies line now agree: RT-REV-02 and RT-REV-07 are `gap` (`release-catalog.rows.mjs:94, :99`), the catalog lists no evidence for RT-REV-07, and the replay test's header names both. The catalog and the stale `test/review-persist.test.ts` reference at `review-persist.logic.ts:14` (file absent) are both stated; BL-377 is correctly "ready, Depends on BL-148" (BACKLOG.md:1099) and the row says it is stale.
- **Dispatch.** The row names `dispatch.mjs:332` (still `queue[0]`, no severity ordering), position 46 of 46, "Karma assigns it to a mobile session directly", Mode stays agent. All true.
- **Bound.** "The owner's call; 300 or up to 500 meet the P0 ceiling; state the measured cost; prefer 500 as Write does." Item 3 says each write is synchronous SQLite (true: `db.run` in `drafts.ts` is synchronous) and Write's is 500 ms (`WRITE_AUTOSAVE_MS`).

### Nits (optional)
1. "Karma's recommendation (9 Nov 2026)" has no repo record; it is labelled a recommendation, subject to the founder, so I take it as the coordinator's. Say "not filed" if you want it matched to the other council statements.
2. A 500 ms maximum wait leaves no slack against F06-REQ-036's "within 500 ms of any change" once timer latency is added; Write ships 500 against F04-REQ-011's "at most the last 500 ms". Worth one line in the PR the owner writes.
3. The new Review device step needs an unused S1 id; `id-collisions.mjs` (since #706) now checks S1 ids and has a `--pr` pre-push mode, which is better than `git grep` alone.

### Not verified
Anything on a phone. That a fixed writer passes the 100 seeded replay runs with a changed model (earlier I showed only that a naive writer fails seed 40). The "a pause of 300 ms or more flushes, which ordinary typing usually has" claim: the row itself says "not measured".

Reviewer: independent of the author (CR-44).
