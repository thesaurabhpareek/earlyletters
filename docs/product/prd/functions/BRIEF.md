# Function reviews of the requirements: brief (20 Nov 2026)

Owner: Karma (CTO role, product side). The founder asked on 20 Nov that legal, compliance, policy, privacy, marketing, risk, customer support, operations and the other functions review the requirements and write the requirements they need that are missing, so that every function's needs are linked to the product requirements and design accounts for them.

## Sources (CR-66 order)

The locked cards `docs/product/prd/01` to `12` under `00-product-frame.md`; `19-from-download-to-first-letter.md` (NS-38 onward, being written now); `14-test-plan.md`; `16-council-review-round-2.md`; `18-errata-after-lock.md`; `GAP-LOG.md`; the backlog BL-922 to BL-992 in `docs/BACKLOG.md`; the design work on branch `docs/e2e-ux-20nov` (`docs/design/e2e/*/DESIGN.md`, `WORDS.md`; `docs/design/system/`), readable with `git -C /home/claude/earlyletters show origin/docs/e2e-ux-20nov:<path>` after `git -C /home/claude/earlyletters fetch -q origin docs/e2e-ux-20nov`; your function's own repo docs (legal under `docs/legal/`, ops under `docs/ops/`, support and help under `docs/support/` or `packages/content`, marketing under `docs/marketing/` and `apps/web`, privacy and data under `docs/legal/data-policy.md`, `DATA_CLASSIFICATION.md`, engineering chapters 05 to 08 and 10). Read the council skill for your role in `.claude/skills/early-letters-<role>/SKILL.md` where one exists and follow its evidence rules.

## What to write

One file per function: `docs/product/prd/functions/<function>.md`. ASCII only, the content rules in `CLAUDE.md` for any quoted words, fictional family Asha only. Sections:
1. What you reviewed (files and heads) and what you did not.
2. Coverage verdict per card (NS-01 to NS-45): covered, partly, missing, for your function.
3. Function requirements: a table `Id | Requirement (Given, When, Then where testable) | Links (card rows, e2e screen ids, backlog rows) | Priority (P0 with RR-4 reason (a) promise, (b) legal or store, (c) core loop; else P1, P2) | Owner lane | Evidence or source`. Ids `FR-<CODE>-nn` with your code: LEG legal, CMP compliance, POL policy (trust and safety, acceptable use, content policy), PRV privacy, MKT marketing, RSK risk, SUP support, OPS operations, SEC security, FIN finance, DAT data and measurement, A11Y accessibility.
4. Design needs: every screen, state, string or flow design must add or change for your requirements, keyed to e2e screen ids where they exist (or "new screen needed").
5. Card changes you propose (card row, change, why), for Karma to rule.
6. Engineering needs (backlog rows to add or change).
7. Founder or counsel questions, each with a recommended default (counsel numbers from `docs/legal/COUNSEL_PACKET.md` 1.5.0; new ones "needs a number from legal").

Rules: every outside fact (law, Apple rule, vendor term) needs a source read this session with URL and date, otherwise UNVERIFIED; every legal reading "counsel must confirm"; Claude roles are not licensed professionals and say so. Write only your own file. Do not commit, push, post, or edit any other file. Karma integrates: function requirements are linked from the cards, logged in `GAP-LOG.md`, and handed to the design leads.
