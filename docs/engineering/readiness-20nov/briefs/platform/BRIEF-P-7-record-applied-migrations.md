# BRIEF P-7: record the applied production migrations (release gate G8)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U].

**Blocked until: BRIEF F4 is done, the founder approved the production push, and the run summary "Files to record" lists the files that were applied. The agent never records a migration that the founder has not confirmed applied.** Founder-only: the apply, and saying "applied". The merge of this PR is the founder's (data-steward and security-architect review).

```
BRIEF P-7                                         Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10   Build: 13 path   Wave: 1   (plan 2.9 row P-7; data-and-sync 3.6 PR 10)

1. GOAL: When the production push has run, `.github/migrations-applied.txt` and `supabase/APPLY.md` name every file that
   was applied, so the migration guard protects them and the next migration sorts after them.

2. CARD ROWS and TEST TITLES
   Rows: release gate G8 (FOUNDER_QUEUE.md:62). No NS row. Tests: the existing guard, no new test file.
   The proof is `node .github/scripts/migration-guard.mjs origin/develop` passing on the PR (exit 0), and failing on a
   mutant: delete one new line from the list -> the guard says a line was removed (`migration-guard.mjs:45`) [V].
   Red today: the file lists 2 of 31 files, so the guard protects 2 [V]. The number to add is whatever the production run applied: 31 minus 2 is arithmetic, not a read of production [U]; APPLY.md:11 says file 2 was applied under another name.

3. FILES
   Touch: .github/migrations-applied.txt (add lines only), supabase/APPLY.md (the State column for the applied rows only),
          docs/ops/DEPLOY.md (one line: date and tag of the first apply), docs/agents/checkins/ops-rd-h3-p7.md
   Never: any file in supabase/migrations/** (an applied file never changes), the header comment of the list, .github/workflows/**.
   Shared file: APPLY.md is also edited by BL-583/584 (#656, draft).

4. READING PACK: Pack 10 item 1; .github/scripts/migration-guard.mjs lines 39-60 (how the guard reads the list; a new
   migration may not sort before the newest listed one); supabase/APPLY.md lines 6-35 (the table); the F4 run summary.

5. CODE ENTRY POINTS (verified at 16e61549)
   .github/migrations-applied.txt           2 lines today: 20260930000000_scribe_core.sql, 20261001000000_scribe_hardening.sql
   .github/scripts/migration-guard.mjs:42   `newest` = last of the sorted applied set
   supabase/migrations/                     31 files; newest 20261109000000_child_name_optional.sql
   supabase/APPLY.md:10-34                  the table; numbering reaches 32 while 31 files exist: match by file name, never by order number
   .github/workflows/deploy-db.yml:275      the "Files to record" step prints exactly the lines to add

6. DATA AND SECURITY
   Data classes: none. Writes no secret and no row. Boundary: migration integrity (data-steward owns). Fail closed: if the run summary and
   the founder's confirmation differ, stop and ask. Privacy line: not a content change.

7. LIBRARIES: none.
8. BUDGETS: none. Guard job under 1 minute [E].

9. ACCEPTANCE
   Lines added = the "Files to record" list, sorted, one per line, comments untouched. APPLY.md rows for those files say
   "Applied <date> by deploy-db.yml run <id>"; rows that were not applied keep their text (file 32's text says it must be
   applied before any servers-on build with #701: if it is in the list it is now applied). Done also means the guard is
   green and a one-line removal turns it red (paste the output in the PR).

10. PR BREAKDOWN: PR 1 | ~60 lines, 3 files | base develop | no flag.

11. LENSES: A data-steward (the list is its path), B security-architect.

12. ORDER: after F4 and the founder's apply. Before the release PR and B13-CUT. Blocked by the founder.

13. DONE: [ ] guard green and red on the mutant; [ ] `npm test` unaffected (docs and a list); [ ] ASCII only;
    [ ] PR body per HARNESS-RUN, `needs:founder`; [ ] journal PATCHed (issue #22); [ ] check-in line.

14. ONLY THE FOUNDER CAN PROVE: the dashboard shows the same files as applied; ops has no account access. PR body says
    "Not verified: production state".

15. STOP AND ASK: the run summary lists more or fewer than the files the dry run named; a file in the list is missing from
    `supabase/migrations/`; the founder says only some were applied (partial apply: do not guess which).

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-p7 agent:ops -->`; branch chore/ops-p-7-migrations-applied;
    check-in docs/agents/checkins/ops-rd-h3-p7.md. Stacked: none. Labels agent:ops, from:agent, needs:founder.
```
