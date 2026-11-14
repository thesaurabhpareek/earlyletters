# Review gate design (G1, G11), 1 Nov 2026

Author: red-team. Status: proposal. Per CR-22 the workflow lands as `docs/ops/proposed/review-gate.yml` and the founder applies it after 9 Nov. It is a consistency gate, not a security boundary (CR-32).

## 1. Requirements
- RG-1 A PR whose head has fewer than one counted Review A and one counted Review B (by `countedPass`) shows status `review-gate` = failure.
- RG-2 A counted pass binds to the head only if the review header names the full 40-character head sha (CR-44 clause 2, from the Project doc `infra/cto-rulings-2026-11-01-karma-credit.md`). A pass at a 7 to 39 character prefix, or at another sha, does not count; the gate reports it as "short sha" so the author can repost. `sameSha` in `scripts/status/page.mjs:36-41` accepts prefixes today, so the gate needs a strict mode (or its own check). This is stricter than the earlier design and removes the prefix-length question.
- RG-3 Per lens, the latest verdict naming the head decides; a later non-pass cancels a pass (#460).
- RG-4 A new commit voids old passes at once.
- RG-5 After any new PR comment the status is pending for 180 seconds before it can turn success, so a late FAIL can land (#460, #512).
- RG-6 Only the owner's login counts, never bots (as `compliance-fence.yml:10-12`).
- RG-7 No PR code runs, no secrets, token read-only apart from `statuses: write`.
- RG-8 Any API or parse error sets failure, never success.
- RG-9 Success never merges anything; the status text names sha and both verdicts.
- RG-10 Free: public-repo Actions minutes, one script, no new vendor.

## 2. Comment grammar
Reuse, do not rewrite, `countedPass` (`page.mjs:141-155`) and `parseLens` (`:105-123`). Counted forms are exactly the two already tested (`page.test.mjs:238-240`):
- `^#{0,3}\s*review\s+([ab])(\s+delta)?\s+at\s+([0-9a-f]{7,40})\s*:\s*(pass|pass with notes)\s*$` (case-insensitive, first line; `page.mjs:134`)
- `<!-- lens:a|b:<sha> -->` then `Verdict: PASS|PASS WITH NOTES` (`:135`)
- Counted verdicts: PASS, PASS WITH NOTES only. MERGE AFTER FIX, CONDITIONAL, UNCLEAR and free text never count; stop phrases in the first 15 lines void a pass.
- Note for authors: a title with brackets, e.g. `## Review A (correctness and tests) at <sha>: PASS`, is rejected by design (`page.test.mjs:256`). The reviewer prompts must use the bare form. This is the most likely cause of false failures in week one.
- Non-pass: `parseLens` returns a verdict outside `PASSING` (`:63`) whose sha prefix-matches the head. Lens letter from the first line (`review|lens` followed by A or B). Unknown letter blocks both lenses until both pass later. No sha: blocks if posted after the head commit date.
- Ordering key: `updated_at`, so an edited comment counts as new.

## 3. Workflow
- File `review-gate.yml`, name `review-gate`. Triggers: `pull_request_target` (opened, synchronize, reopened, ready_for_review), `issue_comment` (created, edited, deleted; skip when `issue.pull_request` is absent), `pull_request_review` (submitted, edited, dismissed), `workflow_dispatch` with a PR number, and a 15-minute `schedule` that backfills open PRs (72 now) that have no status.
- Safety: all three event types run from the default branch (`develop`) file, as `compliance-fence.yml:6-9` documents. No checkout of the PR. The script comes from base through the contents API at the base sha (as the fence does), so a PR cannot edit its own gate. Permissions: `contents: read`, `pull-requests: read`, `issues: read`, `statuses: write`. No secrets. PR text is parsed as data, never interpolated into a shell line.
- Status: context `review-gate`, set on the PR head sha. States: pending ("waiting 180s after a comment" or "0 of 2 on new head"), success ("A PASS, B PASS WITH NOTES on <sha7>, no later non-pass"), failure (reason in one line). Statuses, not a check run, because an `issue_comment` run attaches to the default branch commit, not the PR head.
- Race handling: step 1 sets pending before any computation. Then the job sleeps 180 s and recomputes. Concurrency group `review-gate-<pr>` with cancel-in-progress, so a newer comment restarts the window. The final step re-reads the PR head and aborts to pending if it moved. Pending blocks the merge click.
- Gap: from a comment being posted to the first step running (queue delay) an old success still shows. The gate narrows the #460 window; it cannot close it.

## 4. Human merge stays human
The status is a summary line, never an auto-merge: no `auto_merge`, no merge call in the workflow, no label that merges. The founder (or a chat instruction naming the PR) clicks. Sessions still cannot self-approve or merge without review, and the gate asks for neither; nothing circumvents the classifier. The click is cheap because the status text shows sha, both verdicts and CI on one line. A session must not call the green status "approved". CR-20 option (b) already ruled this design.

## 5. Limits
- Same account (CR-20): any session or the founder's token can post a counted pass. The gate cannot tell a real review from a typed one.
- Same model family: two lenses catch different checklist items, not different blind spots (#460).
- It cannot judge depth; a quick PASS then a deep FAIL (#460, #512) is covered only by the pending window.
- Reviews as GitHub review events or chat do not count.
- It stops honest mistakes: stale heads, short shas, a missing lens, a merge during a pending review.

## 6. Test plan
Node tests beside `scripts/status/page.test.mjs`, pure function `decide(comments, head, now)`. Fixtures are scrubbed real bodies pulled with `gh api` (I only have the digest; bodies are U until pulled).
- #460: A PASS and B PASS at 7-char `b9d8175` (05:46-05:47), B FAIL 05:49:43, A FAIL 05:50:18 at full sha. Expect failure at 05:50:41.
- #524, #506, #504: A at a stale 8-char sha, no B, head different. Expect failure (RG-1, RG-2).
- #512: A PASS and B PASS WITH NOTES 06:54, merge 07:29:32, CHANGES 07:30-07:31. Expect success at merge time and failure after. This is the documented limit, kept as a fixture so nobody claims otherwise.
- Hostile: pass inside a quote; copy from another PR (`PR #166 at ...`); edited FAIL turned PASS; comment by a non-owner or bot; sha under 7 chars; 40-hex differing in the last char; `Review C`; CRLF bodies; "PASS pending #306"; FAIL with no sha; 300 comments (pagination); API 500 (expect failure); head moves mid-run. Also #494 (7-char sha, expect success).

## 7. CR-44: what is already ruled, and what is not yet in the repo
CR-44 was read in this session from the Project doc `infra/cto-rulings-2026-11-01-karma-credit.md` (1 Nov 2026, Karma via the credit thread; founder approved the direction in chat). It is not in `docs/agents/cto/RULINGS.md`, which ends at CR-42 on develop, and CR-43 (close #316, hold #326) is missing there too. Both need to be filed in the repo by Karma (the file is the CTO's). Facts from the ruling:
1. One merge owner per PR: the opening session, or the first to post a counted review, writes `<!-- merge-owner: <session short id> -->` and "I own the merge of this PR". Only that session merges; another asks and waits for a handover comment.
2. A review counts only if its first line names the full head sha at merge time (`## Review A at <40-char sha>: PASS`). A PASS on an older sha is history. A new push resets both reviews.
3. Before pushing to a branch another session touched in the last hour, fetch and read its last commit and PR comments, and say which review point the push answers.
4. A founder chat approval authorises Karma to act; it does not stand in for the two counted reviews. If a session cannot post reviews, another session posts them, stating that it did.
5. The merge commit or merge comment names the two review comments by URL.
The ruling itself says the proper enforcement is "a required-status check that reads the claim and the two sha-bound reviews", queued after 9 Nov, with no `.github/` change before then (D-124). This document is that check's design. Clause 1 (the merge-owner marker) is a second input the gate can read; a PR with no claim comment shows "no merge owner" as advice, not failure, until clause 1 is in common use.

## 8. Founder steps and rollback
1. After 9 Nov, copy `docs/ops/proposed/review-gate.yml` to `.github/workflows/` and merge it (T2, CR-22).
2. Run it via `workflow_dispatch` on five open PRs. A required context that has never reported blocks every merge.
3. Watch it on three real merges while not yet required.
4. Settings, Rules, "Protect long-lived branches" or the `develop` branch rule: add required status `review-gate` (exact name). Do `develop` only; `main` as with the fence (CR-32).
5. Rollback: remove `review-gate` from required checks (one click); disable the workflow if needed.

## 9. Independence path
A second GitHub machine account (one allowed free, GitHub Terms; CR-19, CR-20) posting lens reviews, with the founder as human approver, would make the review identity differ from the merger. Held to 10 Nov (CR-24: Vercel Hobby may refuse non-owner commits; U for public repos). Cost: $0 on GitHub; Vercel Pro is the paid fallback. Caveat: automation use only; my reading of the Terms is not legal advice. The model family stays shared.

Conflicts of interest: I am Claude on the same account and model family as the reviewers this gate counts, I proposed the gate, and it reduces my own lens's discretion; I could not read the Project doc for CR-44.
