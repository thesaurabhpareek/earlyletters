# Injection brief fix: overlap with open PRs #326 and #348

Branch `fix/injection-brief`, 31 Oct 2026. Checked with `git merge-tree --write-tree --name-only` of this branch's head against `pull/326/head` (4375860e) and `pull/348/head` (b35361da). Neither branch was edited.

| PR | Result | Hunk in `scripts/agents/brief.mjs` | What to re-apply |
|---|---|---|---|
| #326 | clean | Review mode header line (`**Review PR #n** by ...`): #326 adds `?? pr.user?.login ?? "unknown"` to the author name. | Nothing. The first wiring draft also edited the review-mode `lines.push` pair and conflicted there. The data warning now goes in one `if (...) lines.push("", UNTRUSTED_REVIEW_WARNING)` before `return lines;` in `assignmentSection`, away from #326's lines. If a later change brings the conflict back, keep #326's header line and add nothing else. |
| #348 | clean | Last entry of the `doc` array: `memoryBrief.briefLines(...)` becomes `memoryBrief.contextLines(...)`. | Nothing. This branch changes the `doc` array only by inserting `UNTRUSTED_TEXT_RULES, ""` before `"## Read first, in this order"`. |

If either PR changes the maintain, steward or handoff sections, the `wiring` commit (brief.mjs only) is the unit to re-apply. It swaps `pr.title` and `p.title` for `quotedLine(...)`, the checkout line for `checkoutLine(pr.head.ref)`, the steward file list for `fileList(...)`, the push-event branch for `branchLabel(r)`, `quote` for `quoteBlock`, and adds `handoffRefusal` at the top of `handoffSection`. All logic lives in `scripts/agents/hardening.mjs`.
