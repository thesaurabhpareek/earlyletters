# BRIEF F4: the first production database deploy, runbook and re-run (release lane)

Re-open every file:line before relying on it. All cites are at `origin/develop` 16e61549, read 20 Nov 2026 about 18:50 UTC. Tags: [V] verified now, [E] estimate, [U] not verified.

**Blocked until: the founder fixes the production database secret (F4, plan section 5.2 row 1) and approves the `db-production` run. Not an agent step; the agent writes the runbook and checks the result.** Founder-only: the secret `SUPABASE_DB_URL_PROD` (an account secret), the approval click, any spend. Never touch secrets, accounts or deploy (ops charter).

```
BRIEF F4                                          Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10 (platform, CI, release)   Build: 13 path   Wave: 1

1. GOAL: When the founder has fixed the secret, the re-run of the db-v0.1.0 deploy shows a green dry run, he
   approves the push, and the run summary lists the migrations that were applied, so P-7 can record them. How many that is, is [U]: 31 files minus the 2 listed in migrations-applied.txt is 29, but that is arithmetic on the repo, not a read of production, and APPLY.md:11 says scribe_hardening was applied under a different name.

2. CARD ROWS and TEST TITLES
   Rows: release gate G8 (docs/release/FOUNDER_QUEUE.md:62, the F4 row), plan 3a "Release path" and risk 2 (plan line 697). No NS row.
   Tests: none new; this is a docs runbook. Proof is the run: `deploy-db.yml` "Dry run" step green (today it fails).
   Red today: run 42973935354 on tag db-v0.1.0 (11 Nov) failed at "Dry run", "failed to parse connection string"
   (plan 3a, log expired) [V per plan; the run is not re-read, the log expired].

3. FILES
   Touch: docs/ops/runbooks/first-production-db-deploy.md (new), docs/ops/DEPLOY.md (one pointer line only),
          docs/agents/checkins/ops-rd-h3-f4.md
   Never: .github/workflows/** (founder), supabase/migrations/**, secrets, EAS, charters, BOARD, BACKLOG, RULINGS.
   Shared file: DEPLOY.md is also edited by BL-583/584 (#656, draft); the later PR merges develop.

4. READING PACK: Pack 10 items 1, 6; then docs/ops/DEPLOY.md lines 16, 94-105 (prod = tag db-v* on main, job "deploy to
   production", Environment db-production); .github/workflows/deploy-db.yml:235-275 (job, "Tag must point at a commit on
   main" :249, secret check :261-264, Dry run :267, Push :271, "Files to record" :275); supabase/APPLY.md;
   docs/ops/runbooks/restore-drill.md (the way back).

5. CODE ENTRY POINTS (verified at 16e61549)
   .github/workflows/deploy-db.yml:240  environment db-production (required reviewers, founder)
   .github/workflows/deploy-db.yml:267  Dry run: `supabase db push --dry-run --db-url "$DB_URL"`
   .github/migrations-applied.txt       lists 2 files; supabase/migrations holds 31; main = tag = develop = same 31 [V plan 3a]
   `git ls-remote origin refs/tags/db-v0.1.0` -> 6863f996 = main's tip [V]

6. DATA AND SECURITY
   Data classes: none read or written by the agent. The push applies every migration production lacks (about 29 [U]) to the real family database: the
   founder's act. Boundary: production credentials (no NSC id; security-architect owns); secret never printed: the runbook shows where to set it, never a value.
   Read: data-steward (migrations), security-architect (Environment settings). Fail closed: dry run red = no push.
   Privacy line: nothing of a child leaves the phone; this is schema only.

7. LIBRARIES: none. supabase CLI is pinned in the workflow (SUPABASE_CLI_VERSION 2.119.0, deploy-db.yml:54 [V]).
8. BUDGETS: none. Time: dry run plus push are small [E under 5 min]; founder time is the cost.

9. ACCEPTANCE
   Runbook steps the founder can follow without reading code: (1) what "failed to parse connection string" means
   [E: the stored URL is not a valid Postgres URL: missing scheme, a space or newline pasted in, or a password with
   characters that need percent-encoding]; (2) set `SUPABASE_DB_URL_PROD` on the `db-production` Environment (not the
   repository) with the project-scoped URL from the Supabase dashboard; (3) re-run failed jobs of run 42973935354, or push a new tag
   on the same main commit; (4) REAL BEHAVIOUR, not a gate: `environment: db-production` is on the whole job (deploy-db.yml:240), and the dry run (:267) and the `--yes` push (:271) are steps of that job. The founder approves BEFORE the dry run, and a green dry run then pushes by itself. He cannot read the production dry run and then decide. The only look-first is the staging job's dry run on develop (same files), which he reads before approving; (5) approve knowing that; (6) read "Files to
   record"; (7) hand the list to P-7. If a push fails halfway: stop, do not repair by hand or re-run blind; record the migration history as it stands (`supabase migration list` read by the founder) and send it to data-steward; forward-only means the fix is a new migration. Way back: forward-only migrations, a fault is a new migration (plan risk 2).
   Done also means: a reader who has never seen the repo can do steps 1 to 7; two stop lines (staging dry run lists a count the founder does not expect;
   any red). Also deliver the PROPOSAL `docs/ops/proposed/workflows/deploy-db-two-jobs.yml`: job 1 `dry run production` (no environment, `contents: read`, uses the secret via a read-only environment or the same one without reviewers), job 2 `push production` `needs` job 1 with `environment: db-production` (approval only here, after the founder has read job 1's output). The founder applies it; the agent never edits the workflow. Until then step 4 stands as written.

10. PR BREAKDOWN: PR 1: runbook + pointer line | ~90 lines, 3 files | base develop | no flag, docs only.

11. LENSES: A security-architect (Environment, secret handling), B data-steward (the files to be applied).

12. ORDER: after nothing. Before P-7, before B13-CUT. Blocked by founder (F4).

13. DONE: [ ] ASCII only; [ ] no secret value, no host, no project ref in the file; [ ] `npm test -w packages/content` not needed
    (no strings); [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal PATCHed (issue #22); [ ] check-in line.

14. ONLY A PHONE (or the founder) CAN PROVE: the Supabase dashboard shows 31 applied migrations after the push; ops cannot read
    it (no account access). Mark in the PR: "Not verified: production state".

15. STOP AND ASK: the staging dry run lists a count that differs from 31 minus what production holds (check the history first); the tag run is re-run and the "Tag must point at a commit on main"
    step fails (main moved); anything that needs a secret value pasted into chat; two failed attempts at the same step.

16. HARNESS: claim row held by Karma. Journal issue #22; marker `<!-- journal run:sess-20261120-ops-f4 agent:ops -->`.
    Check-in docs/agents/checkins/ops-rd-h3-f4.md. Branch docs/ops-f4-first-production-deploy. REST PR; comments start
    `<!-- agent:ops -->`. If a journal or label call is refused: write the text to a file and say so (HARNESS-GAPS H1, H2).
```
