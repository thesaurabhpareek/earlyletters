## Review B at 26e9f3be6140ab1e67cf2f1e80a412679fe2e2a8: PASS WITH NOTES

Second review of #727, delta only (previous: 3d629af5, CHANGES). Head 26e9f3be is a content commit d7a80929 on 3d629af5 plus a merge of develop (e5ecc5f8). Still docs/BACKLOG.md only: against develop it is 1 file, +29 (the row grew by two lines, nothing else in the tree). The must-fix is done and each should-fix is answered.

**My must-fix, against the row as it stands.**
- Severity now reads `S1 proposed (S0 by the legend until ruled)`. The row says F06-REQ-036 is P0 with "100 of 100 kills reopen with the same text", which a burst breaks today. It says S0 versus S1 is a release gate (RELEASE.md 5.4 and TF-09: C0 to C1 needs no open S0; only submission needs no open S0 or S1), that this makes the call release scope, "the founder's, with the CPO recommending", and "Who must rule" now names the founder for the gate, the mobile owner for the bound and the CPO for the PRD wording. The "CPO sets the severity" and "nobody must rule" lines are gone.
- Karma's recommendation is stated as a recommendation, dated, with reasons (needs a crash, kill or power loss inside an unbroken burst; "a pause of 300 ms or more flushes ... not measured"; graceful exits flush; only that session's edits at risk), "fixed before the 1 Dec submission; subject to the founder". 1 Dec is the recorded D-121 target. It adds the honest contrast with BL-775 ("no CCO-6 ruling calls this not blocking, and the loss is silent"). The body withdraws "same reasoning as BL-775" and says why. A recommendation is not a ruling, so no log entry is needed; it is explicit that it is not one.

**Should-fix items, answered.**
- `false` and retry (Problem 6, Requirement, two "Retry after a throw" acceptance lines): `setDraftReview` returning false is "a refusal, not a failure ... not retried"; a throw is retried only at the next change, Done, Close and unmount, "no timer re-arms itself after a failure, so a draft that is gone cannot loop". That removes the loop I flagged.
- Acceptance lines are labelled "Maximum wait" or "Retry after a throw", so a reviewer can reject one half; one row is kept with the reason (both edit `flush` and the timer), split only past the 400-line guide.
- `cancel()`: new acceptance case beside `store.review-v9.test.ts:188` (checked: `w.cancel()` is at :188, and `review.tsx` never calls `cancel`); the Requirement says `cancel` clears both timers and `flush` leaves none.
- Done in code until the Review device step is walked; RT-REV-02 and RT-REV-07 stay `gap` until then (Who line, Device bullet).
- The body's "#707 plans to renumber" is now "#715 recommended it; #707 is unchanged at 8f24cc04 and has not said it will; whoever renumbers must start at BL-817 or later". True: #707 is unchanged. BL-816 is in no other open PR; live `id-collisions.mjs` (the updated tool, which now also checks CR and S1 ids) lists 30 collisions in four kinds and none names BL-816 or #727.
- The RT-REV-07 evidence contradiction, the BL-377 stale-status line and the first-person scratch narrative (moved to the body) are all fixed.

**New text I checked.**
- Dispatch paragraph: `dispatch.mjs:332` is `queue[0]` and the queue (lines 244-246) is a filter in file order with no severity ordering. Computed with `lib.mjs`: the `mobile` queue is 46 long, BL-816 is position 46, the first is BL-355. Exactly as written. The row does not hide that a `ready` S1 row sits last; it offers Karma assigning it directly, or moving the row up the file, and keeps Mode `agent`. Good.
- Item 8: the header of `review-persist.logic.ts` (line 14) cites `test/review-persist.test.ts`; that file does not exist. True.
- Item 4: `review.tsx` never calls `cancel`; the writer's own comment says Keep and Let it go do. True, and worth the extra test.
- No `docs/prd`, code or QA file is touched. The 29 added lines: 0 bytes >= 0x80, no ellipsis characters, no dash characters, only "Asha" named.

**Re-run at this head.** `check.mjs` (397 tasks, consistent); `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs` 170 pass (the body says 170); `trace.mjs` 838 defined, 773 P0, 10 cited-but-undefined, none from this row; `eligibility()`: BL-816 ready, agent, `mobile`; BL-377 not eligible; `git merge-tree` with #707 and #726: clean (one output line each). CI at this head when I last looked: 8 of 10 runs completed and green (db, typecheck, install, edge functions, agent team, applied migrations, e2e-seam guard, and the newer compliance-fence; an older compliance-fence run was cancelled); "tests and content rules" was still in progress and `required` had not reported. This verdict holds only once required CI is green at this exact head.

### Notes (none blocks)
1. **"Prefers 500" has no margin on a P0 that says "within 500 ms".** The Requirement now tells the owner to prefer 500 ms "as Write does, unless 300 is justified". A timer of exactly 500 ms plus the duration of the write is more than 500 ms; F06-REQ-036 says "written to the draft within 500 ms" and F04-REQ-011 "at most the last 500 ms ... lost". Write's #725 made the same choice, and the bound is the owner's, so I do not block. A sentence such as "the timer plus the measured write stays within 500 ms" would keep the P0 true.
2. The row is long (8 Problem items, 8 acceptance lines, a Device bullet). It is correct and labelled, but an unattended run reads all of it; if the dispatcher ever takes it, the `Requirement` paragraph is the part that matters. No change asked.
3. The dated recommendation names Karma; the PR is not labelled `agent:<handle>`, so it is an interactive session's text. Fine, but it lives in the repo only as this row, not in `docs/agents/cto/RULINGS.md`; if the founder rules, a CR entry or a D- line records it.

### Not verified
Phone behaviour; mobile typecheck and the full mobile suite (docs PR); whether any open PR claims the Review S1 step id (the row says to check); the 100 seeded replay runs with a correct fix; the founder's decision on the gate.

Reviewer: independent of the author (CR-44).
