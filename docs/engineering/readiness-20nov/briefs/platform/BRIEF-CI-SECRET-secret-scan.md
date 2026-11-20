# BRIEF CI-SECRET: a secret scan in CI and `docs/ops/SECRETS.md` (SEC-R02, SEC-R03; security F-12)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U].

**Blocked until: the founder chooses the tool. Option A (no new dependency): extend the repo's own scanner `scripts/packs/secret-scan.mjs` and run it in the `unit` job. Option B: a third-party scanner (a new action or binary): a new dependency, approved by the founder on the PR (AIE-R21), pinned by SHA (BRIEF CI-PIN). The agent writes Option A and a one-page comparison; it does not pick B.** Founder-only: choosing, applying any workflow edit, repository secret-scanning and push-protection settings (an account setting; read-only check in `scripts/founder/check.mjs:42-47`), and the content of `SECRETS.md` that names where real secrets live (the agent writes names and places, never values).

```
BRIEF CI-SECRET                                   Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10   Build: any   Wave: 1 (before Build 14: the first build with keys and server paths widened)

1. GOAL: When a pull request adds a signing key, an EAS or Supabase service key, a private key block or a `service_role` token to any tracked file, CI fails with the file and line (never the value),
   and `docs/ops/SECRETS.md` says where each secret lives, who rotates it and what breaks if it leaks.

2. CARD ROWS and TEST TITLES: SEC-R02, SEC-R03 (06-security-engineering.md:35; ENFORCEMENT.md:157 "gitleaks pending PR #30"), FR-OPS secret rows [U ids], security F-12 (SECURITY-OPEN-QUESTIONS.md:32, #915).
   Tests: extend scripts/packs/secret-scan.test.ts (exists [V]) with `[SEC-R03] a service_role token in a tracked file is found`, `[SEC-R03] a private key block is found`, `[SEC-R03] the finding names file and line, never the value`.
   Each red on develop (the patterns do not cover them: today it targets "a signing key or an R2 secret" per PACKS_HOSTING.md:61 [V]). Positive control: a planted fixture string built at run time, never stored whole in the repo.

3. FILES
   Touch: scripts/packs/secret-scan.mjs and .test.ts (extend; ops owns scripts/**), scripts/guards/secret-scan-repo.mjs only if the pack scanner must stay pack-specific,
          docs/ops/SECRETS.md (new), docs/ops/proposed/workflows/secret-scan-step.yml (the step for `ci.yml` `unit`), docs/agents/checkins/ops-rd-h3-secret.md
   Never: .github/workflows/**; any real key, host, project ref or token in a fixture or doc; scripts/agents/**.
   Shared file: docs/engineering/ENFORCEMENT.md row SEC-R03 changes only through principal-architect.

4. READING PACK: Pack 10 item 1; 06-security-engineering.md:35 (SEC-R03) and :51 (SEC-R10); SECURE-CODING-CHECKLIST.md:57 (the `git grep` form and "no secret-scan job exists"); scripts/packs/secret-scan.mjs (all);
   docs/ops/SECURITY.md; PRODUCTION_VARIABLES.md (public values only).

5. CODE ENTRY POINTS (verified at 16e61549)
   scripts/packs/secret-scan.mjs        `scanRepo`, `scanText`; `--staged`; "npm test fails if a tracked file does" (PACKS_HOSTING.md:61): the test is in scripts/packs/secret-scan.test.ts
   scripts/founder/check.mjs:42-47      reads `secret_scanning` and `secret_scanning_push_protection` status (W0-06): GitHub's own scanning is a settings item
   `grep -rn -i -E 'gitleaks|trufflehog' .github/workflows` -> 0 hits [V]; docs/ops/SECRETS.md does not exist [V ls]
   .github/workflows/ci.yml `unit` job (about line 55-70): where a node step fits with no new action

6. DATA AND SECURITY: Data classes none. A scanner that prints a match leaks the match: output is file:line and a rule id only. Boundary: secrets in the repo (security-architect). The scan must not read `.env*` ignored files
   (CI has none). False negatives are expected; GitHub secret scanning with push protection stays the first line (founder setting). Privacy line: fixtures use the fictional Asha and built-up fake keys.

7. LIBRARIES: Option A none. Option B: reviewed in RD-F (#919, #920): no secret-scanning tool is listed [V grep]; so Option B is a new decision, not a pre-approved one.
8. BUDGETS: under 10 seconds on the repo (a text pass over tracked files) [E]; `unit` stays under its 5-minute timeout (about 3 minutes on 20 Nov, run 44781265818 [V per CODE-QUALITY-GATES.md]).

9. ACCEPTANCE: the scanner covers: private key blocks, `service_role` and `sb_secret_` style keys [U exact prefixes: read Supabase docs, do not invent], EAS tokens, Apple `.p8` blocks, Anthropic and OAuth tokens as the repo
   names them in docs. SECRETS.md: a table of every secret by name and place (GitHub Environments `app-store`, `db-production`, `staging`; EAS; Supabase; R2), owner, rotation, blast radius; no values.
   Done also means red on a mutant: delete the private-key rule and the test goes red; and a planted key in a scratch commit fails the step.

10. PR BREAKDOWN: PR 1 scanner + tests ~150 lines, 3 files; PR 2 SECRETS.md + the proposed step ~120 lines, 3 files | base develop | no flag.

11. LENSES: A security-architect, B compliance-engineer (SECRETS.md names accounts).

12. ORDER: any time; before BRIEF B13-CHECKS gains it. Blocked by the founder's A or B choice for the workflow step only.

13. DONE: [ ] `npm test` (scripts/packs test runs there [U: confirm it is in the root test list]); [ ] ASCII; [ ] no real secret anywhere (run the scanner on the PR); [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal #22; [ ] check-in.

14. ONLY THE FOUNDER CAN PROVE: GitHub secret scanning and push protection are enabled on the repository (`node scripts/founder/check.mjs` reports it; needs his token).

15. STOP AND ASK: a real secret is found in history (do not print it; tell the founder to rotate; security-architect, `suspected-data-leak.md` runbook); Option B is wanted; a rule would match public identifiers that SEC-R03 allows (Supabase URL, publishable key).

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-secret agent:ops -->`; branch chore/ops-secret-scan; labels agent:ops, from:agent, needs:founder.
```
