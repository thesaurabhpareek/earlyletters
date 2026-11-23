BRIEF P-7: F4: the founder's first-apply checklist, then record the applied migrations      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: ops   Lane: Pack 10 (platform, CI and release)   Build: 13 path (G8)   Wave: 1   Size: S: PR 1 about 80 lines docs; PR 2 about 40 lines
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: the founder. Only the founder can do F4: fix the two database secrets, run the staging catch-up, approve, tag db-v*, approve db-production (D-041; no agent applies or reads a hosted project). PR 2 cannot be written until the founder reports which files applied. Product numbers P-7 (no id left after BL-950, BL-951).

1. GOAL: When the founder opens one page and follows it, then staging and production receive the migrations from CI in order with the expected history checked first, and a PR then records the applied names so the guard freezes them.

2. CARD ROWS and TEST TITLES
   Rows: release gate G8; DB-R09; D-041; CK2 (29 or 31 files), CK5 (#424 timestamp), CK6 (DB-R10, file 3 has begin and commit).
   Tests: none new in code. Doc checks: every step has an expected output and a stop line. After PR 2, `.github/workflows/migration-guard.yml` rejects an edit to any listed file (try it on a scratch branch, do not push).
   Red on develop: .github/migrations-applied.txt lists 2 files while the repo has 31; runs 42976572128 and 42973935354 failed at 'Dry run' on 11 Nov and 42983835990 has waited for the staging approval since 11 Nov [V in data-and-sync.md section 6; run logs have expired, not re-read].

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  supabase/APPLY.md (a short top section 'First apply by CI, in order' that links data-and-sync.md section 6; keep old steps), docs/ops/DEPLOY.md (only a pointer if the secret-format lines need one), PR 2 only: .github/migrations-applied.txt and the states column in supabase/APPLY.md, docs/agents/checkins/ops-p-7.md
   Never:  .github/workflows/** (agents cannot edit them), any migration file, hosted projects, secrets, charters, memory, roster, BACKLOG, BOARD.
   Shared file rule: APPLY.md is also edited by every new migration PR (BL-870, H1, G1, S2, S4) in its file table; PR 2 merges last and merges develop first.

4. READING PACK
data-and-sync.md section 6 (the seven founder steps) and section 8 risk 1; supabase/APPLY.md 'Hosted checks before the first apply' a) to d); docs/ops/DEPLOY.md lines 36-56 [U: re-open]; .github/workflows/db-cli.yml run 44642662637 (rebuild of all 31 files passed on CLI 2.119.0).
   Stale-fact check: re-open every file:line you cite.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   .github/migrations-applied.txt                 2 files today (20260930000000, 20261001000000), both for project early-letters
   supabase/APPLY.md:6-38                        the file table and states (rows 1 to 3 shown at develop 16e61549)
   docs/ops/DEPLOY.md:36-38                        says production `scribe-prod` 'does not exist yet' and the live early-letters project is slated for retirement: the founder creates it first (F4 step 0)
   docs/ops/DEPLOY.md:52-56                        the pooler URL format, port 5432
   supabase/migrations/20261002010000_entries_select_policy.sql:4,11  begin and commit in file 3 (DB-R10; the fresh rebuild passes, so not a blocker)

6. DATA AND SECURITY
   Data classes: none (no data is read). The agent never reads production data and never applies. A password is never written in a file or a PR.
   Boundary: release and secrets. Owner of the read: security-architect.

7. LIBRARIES ALLOWED
none.

8. BUDGETS
Dry run lists 31 names (new project) or 29 (early-letters): the page tells the founder which. Not measured; the apply is the founder's.

9. ACCEPTANCE
   Experience: a one-page card for the founder: plain short sentences, steps numbered, an expected output under each, a STOP line (any other history version means stop: a repair is a decision, never a step, OQ-F2).
   Done also means: someone other than the author reads the card against section 6 and finds no missing step.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: the first-apply card in supabase/APPLY.md | about 80 lines, 1 to 2 files | base develop
   PR 2: record applied names | about 40 lines, 2 files | base develop, only after the founder reports

11. REVIEW LENSES
Lens A: data-steward. Lens B: security-architect. The founder performs the steps.

12. ORDER AND DEPENDENCIES
After: nothing (PR 1). PR 2 after the founder's apply. Before: every server-on build (OQ-F1). Blocked by: the founder.

13. DEFINITION OF DONE
   [ ] every claim in the doc is tagged [V] (file:line or sha), [E] (basis) or [U]; at least 10 cites re-opened and the count stated in the PR body
   [ ] ASCII only; no real family detail; no word a parent reads is final (PROPOSED only)
   [ ] PR body per HARNESS-RUN.md; labels agent:ops, from:agent (+ needs:founder when only the founder can merge)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
not a phone: the hosted dry run list and the smoke after staging are the founder's checks.

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - a history version other than the two expected appears; - the founder asks an agent to run the apply (it must not).

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #22 first; marker `<!-- journal run:sess-20261120-ops-p-7 agent:ops -->`.
   Check-in: docs/agents/checkins/ops-p-7.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: docs/ops-p7-f4-first-apply-card in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:ops -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
