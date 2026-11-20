# BRIEF B13-CHECKS: what `release-ios.yml` checks, and what it should also check (patch for the founder)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U]. Card and `14-test-plan.md` line cites are at the locked pack `450bcb4a` (#846, unmerged: `git show origin/docs/prd-lock-v1-20nov:<path>`); develop still holds the older cards.

**Blocked until: nothing for the proposal file; the founder applies the patch (the Claude GitHub App cannot edit `.github/workflows/`; FR-OPS-34). A change to `release-ios.yml` is a workflow edit that needs two reviews (security-architect `.github/**`) and the founder.** Founder-only: copying the patch to `.github/workflows/release-ios.yml`, the `app-store` environment. The agent writes `docs/ops/proposed/` files and tests only.

```
BRIEF B13-CHECKS                                  Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10   Build: 13   Wave: 1

1. GOAL: When an RC tag is pushed, the `checks` job fails on any of: a production-profile preflight FAIL, recording backup on in a store
   profile, a flag on in a store profile outside its allowed list, the label guard failing, and an unlisted size growth, before the build step is reachable.

2. CARD ROWS and TEST TITLES: [NS-08-R5] backup off in store profiles (existing test, apps/mobile/test/preflight-keepsafe.test.ts), BL-958 flags
   (apps/mobile/test/store-flags.test.ts), G5 and G6 of 14:96. Tests: the patch is a YAML file; add `apps/mobile/test/release-checks-proposal.test.ts`
   (new) that parses `docs/ops/proposed/workflows/release-ios.checks.patch.yml` and fails if any of steps (a) to (d) below is missing.
   Red on old code: the test fails today because the proposal file does not exist; the real proof is the dry run on a release branch.

3. FILES
   Touch: docs/ops/proposed/workflows/release-ios.checks.patch.yml (new; steps to paste into job `checks`), apps/mobile/test/release-checks-proposal.test.ts (new),
          docs/ops/RELEASE.md (section 3.4 one line), docs/agents/checkins/ops-rd-h3-b13checks.md
   Never: .github/workflows/release-ios.yml itself; the `build` and `metadata` jobs; scripts/agents/**; eas.json.
   Shared file rule: BRIEF CI-PIN also touches the `uses:` lines of release-ios.yml (already pinned there [V]); no overlap.

4. READING PACK: Pack 10 items 1 to 4; release-ios.yml lines 89-133 and the header lines 1-23; apps/mobile/scripts/preflight-production.mjs
   (result ids listed at header lines 109-111: app-env ... backup, status-report, signing-keys, seams, secrets); preflight-keepsafe.mjs.

5. CODE ENTRY POINTS (verified at 16e61549)
   release-ios.yml:89    job `checks` (timeout 15 min): npm test, typecheck, store-config --check, placeholder grep, seam-guard --profile production, signing keys
   `grep -n preflight .github/workflows/release-ios.yml` -> 0 hits [V]: the RC does not run `preflight:production`; only testflight.yml runs a preflight (:104)
   apps/mobile/package.json:88 `preflight:production` -> scripts/preflight-production.mjs (has its own `backup` check, id `backup`)
   apps/mobile/test/store-flags.test.ts runs in `npm test`, so flags are covered in `checks` already [V per store-flags.mjs header]
   scripts/release/label-effect.mjs (BL-975): runs on PRs only once the proposed workflow is applied; no step in `checks`
   scripts/size/measure.ts: manual, not in any workflow [V]

6. DATA AND SECURITY: no data class. Checks run with `contents: read`, no secret (the dry-run property in the header, lines 8-12). A preflight line
   that needs EAS variables stays UNVERIFIED and is read by the founder. Boundary: the release path (security-architect). Fail closed: a missing script = red.

7. LIBRARIES: none.
8. BUDGETS: `checks` timeout 15 minutes (:97); the added steps [E] under 1 minute (no install beyond the existing setup action).

9. ACCEPTANCE: steps (a) `npm run preflight:production -w @scribe/mobile` (exit 1 on FAIL), (b) `node apps/mobile/scripts/preflight-keepsafe.mjs`,
   (c) `node scripts/release/label-effect.mjs --base origin/main --head HEAD` for the release PR range [U: confirm base semantics in LABEL_GUARD.md],
   (d) `npx tsx scripts/size/measure.ts --check` once BRIEF CI-SIZEGATE lands (marked optional until then).
   Done also means: each step shown red on one named mutant (backup "on" in eas.json; `EXPO_PUBLIC_PHOTOS` "on" in production; a new SDK in package.json).

10. PR BREAKDOWN: PR 1 | ~110 lines, 4 files | base develop | no flag; nothing runs until the founder pastes it.

11. LENSES: A security-architect, B principal-architect; mobile also reads (a test under apps/mobile/**). Wiring: the test is a vitest file under apps/mobile/test, so the existing `unit` job already runs it through `npm test` (workspaces); no workflow change is needed for the test, only for the paste itself (founder).

12. ORDER: after BL-976-WIRE (so (b) is one tested call). Before B13-CUT's dry run. Blocked by the founder for the paste.

13. DONE: [ ] `npx vitest run apps/mobile/test/release-checks-proposal.test.ts`; [ ] `npm test` baseline only; [ ] ASCII only; [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal #22; [ ] check-in.

14. ONLY A PHONE (or the founder) CAN PROVE: the dispatched `job=checks` run on a release branch passes after the paste.

15. STOP AND ASK: (a) prints UNVERIFIED lines that need EAS variables the workflow cannot read; the label guard needs a base ref that does not exist on the
    release PR; any edit that would make `checks` need a secret.

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-b13checks agent:ops -->`; branch chore/ops-release-ios-checks-proposal; labels agent:ops, from:agent, needs:founder.
```
