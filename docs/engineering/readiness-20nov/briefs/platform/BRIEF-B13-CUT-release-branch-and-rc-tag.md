# BRIEF B13-CUT: the release branch and RC tag cut checklist for Build 13

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U]. Card and `14-test-plan.md` line cites are at the locked pack `450bcb4a` (#934 rev 2 (88f3a975; #846 closed), unmerged: `git show origin/docs/prd-lock-v1-20nov:<path>`); develop still holds the older cards.

**Blocked until: BRIEFs F4, P-7 and 830 are done; the founder answers Q1 (which P0 rows the cut meets; the plan's recommendation (5.3), not a default, holds the cut for BL-922, BL-925/926, BL-928, BL-961, NS-09-R6) and names the cut go; he picks the marketing version (1.0.0 or 1.0.1: plan 3a "Not verified" says Build 12 may not be submitted).** Founder-only: the go, the version, pushing the tag if he keeps it (RELEASE.md 1.2 says coordinator only), approving the `app-store` environment, submitting. The agent writes the checklist file and dry-runs the checks; it never tags, builds or submits.

```
BRIEF B13-CUT                                     Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: ops   Lane: Pack 10   Build: 13   Wave: 1

1. GOAL: When the founder says "cut", one checklist file lists every step, owner, command and stop line from main to the
   internal TestFlight build, and every automated step has been dry-run on `release/<x.y>` with no tag.

2. CARD ROWS and TEST TITLES: 14-test-plan.md section 6 gates G0 to G6 (14:96, 14:98); NS-08-R5 and NS-08-R7 via the preflight.
   Tests: none new. Proof: `release-ios.yml` manual run `job=checks` on the release branch is green (dry run, no secret, no build).
   Red today: no release branch and no `ios-v*` tag exist [V `git ls-remote`]; the only run is a green dispatch on develop (44630835277).

3. FILES
   Touch: docs/release/BUILD-13-CUT.md (new, copy of RELEASE.md section 12 filled for Build 13), docs/ops/RELEASE.md (one
          pointer line), docs/agents/checkins/ops-rd-h3-b13cut.md
   Never: `.github/workflows/**`, `apps/mobile/version.json` (edited only on the release branch by the coordinator after the founder
          picks the version), any tag, EAS, App Store Connect, secrets.
   Shared file: docs/ops/RELEASE.md is edited by nobody open [U: not checked for drafts].

4. READING PACK: Pack 10 items 1 to 3; docs/ops/RELEASE.md sections 1.1 to 1.3, 2.2, 3.4, 6, 12 (lines 38-69, 79-81, 118-139, 202-244,
   319-336); .github/workflows/release-ios.yml (all, 215+ lines); plan 3a and 6.1; FOUNDER_QUEUE.md.

5. CODE ENTRY POINTS (verified at 16e61549)
   release-ios.yml:27 push of tag `ios-v*`; classify :49-88: tag, version.json and branch `release/<x.y>` must agree, a release tag needs an RC tag on the
     same commit and docs/release/<version>.md
   release-ios.yml :89-133 job `checks`: npm test, typecheck, store-config --check, placeholder scan, seam guard (--profile production),
     TRUSTED_SIGNING_KEYS non-empty (packages/api/src/keys.ts:20 holds 2 keys [V])
   release-ios.yml:134-165 job `build`: environment `app-store`, `eas build --platform ios --profile production --no-wait --auto-submit`
   apps/mobile/version.json = 1.0.0 [V]; eas.json `appVersionSource` remote, build number from EAS only (RELEASE.md 2.2)
   Rulesets "Protect release tags" and "archive tags are kept" are active [V gh api rulesets]: a wrong tag cannot be deleted. Tags never move.

6. DATA AND SECURITY
   Data classes: none. Secrets: EXPO_TOKEN and ASC_REVIEW_CONTACT_JSON live in `app-store` (never read). Boundary: the store build is the only
   path that carries code to people (security-architect). Fail closed: any red check = no tag. Privacy line: the checklist has a row "no flag on
   in production whose card has an open P0" (14:98, G6) and a row for the privacy label and claims diff (G5, BL-975 guard output).

7. LIBRARIES: none (eas-cli 24.10.0 pinned in the workflow, release-ios.yml `EAS_CLI_VERSION`).
8. BUDGETS: download under 40 MB (founder decision 15; APP_SIZE.md); EAS Free 15 iOS builds a month, one RC about 1 build (RELEASE.md 3.4) [V].
   Size is checked from the thinning report after the build (BRIEF CI-SIZEGATE covers the JS half).

9. ACCEPTANCE: the file has these ordered sections, each row with owner and stop line: (1) preconditions: F4 done, P-7 merged, #830 landed,
   Q1 answered, flags off in every store profile (`store-flags.test.ts`); (2) cut `release/<x.y>` from main, set the version (founder), cherry-pick
   fixes from develop after the cut, never merge develop in; (3) dry run `job=checks` and `npm run preflight:production -w @scribe/mobile` (0 FAIL, read
   UNVERIFIED) and `node apps/mobile/scripts/preflight-keepsafe.mjs`; (4) licences verify (RELEASE.md 3.4); (5) RC tag `ios-v<x.y.z>-rc.1`, annotated;
   (6) approve `app-store`, build, TestFlight processing; record build number; (7) Build 13 device sheet part A (plan 6.1), P0 rows first,
   evidence files docs/qa/evidence/<date>-<build>-<phone>.md; (8) store-build gate 14:98; (9) submit, founder; (10) after release tag `ios-v<x.y.z>` and
   docs/release/<x.y.z>.md. Waivers: only 14:98's one, named in the build record.
   Done also means: a dry run of (3) was pasted, and a mutant is shown: an eas.json store profile with EXPO_PUBLIC_BACKUP="on" turns preflight-keepsafe red.

10. PR BREAKDOWN: PR 1 | ~120 lines, 3 files | base develop | docs only.

11. LENSES: A security-architect (.github, tags, secrets), B qa (device sheet rows) [E].

12. ORDER: after F4, P-7, 830, BRIEF B13-CHECKS and BL-976-WIRE (so the checks are complete). Before the device sheet. Blocked by the founder (Q1, version, go).

13. DONE (the dry run is a `workflow_dispatch`: an agent may not be allowed to dispatch [U]; the founder is the dispatcher; the `checks` job can run on develop, so the release branch is not needed for the dry run; every checklist row's owner is the founder or the coordinator, never the author agent; if refused, the founder dispatches and pastes the run URL, and the brief is done on that): [ ] ASCII only; [ ] cites re-opened; [ ] dry-run output pasted; [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal #22; [ ] check-in.

14. ONLY A PHONE CAN PROVE: the whole device sheet (plan 6.1: J-N1, J-N2/S1-204, NS-10-R3, NS-13-R14, J-N21, J-N24, J-N27, BL-928 row, BL-929);
    ITMS-90683 upload result; the iPad row. The checklist links them; it does not replace them.

15. STOP AND ASK: the version choice; any check red on the release branch; a P0 row still failing that Q1 holds; a request to tag from a branch
    other than release/<x.y>; the build count for the month is near 15 (RELEASE.md 3.4); two failed attempts.

16. HARNESS: journal #22; marker `<!-- journal run:sess-20261120-ops-b13cut agent:ops -->`; branch docs/release-build-13-cut-checklist;
    check-in docs/agents/checkins/ops-rd-h3-b13cut.md; labels agent:ops, from:agent, needs:founder.
```
