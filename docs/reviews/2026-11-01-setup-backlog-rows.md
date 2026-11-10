# Setup retro backlog rows (1 Nov 2026), for `docs/BACKLOG.md`

Source: `docs/reviews/2026-11-01-setup-retro.md` section 4 (RS-01 to RS-20).

**BL ids are not assigned here.** Each row is headed by its RS id from the retro.
- `node scripts/agents/next-id.mjs` on `origin/develop` 01a07627 printed `BL-563` as the next free id (the highest on `develop` is BL-562). It counts `develop` and the ids that open PRs define.
- Open PR #551 (harness v2) plans to map its HV2-B01 to HV2-B31 items to ids from BL-563 too, but defines none yet.
- So the BL ids are deliberately left unassigned, to avoid colliding with #551. The coordinator assigns BL ids to both sets in one pass.
- CR-47 overrides these rows where they overlap the release-setup retro (REL-01 to REL-13): RS-01 is dropped in favour of CR-47 R3 (REL-04), RS-15 is merged into REL-06, and RS-10 no longer touches `TESTFLIGHT.md` (REL-10). Do not paste RS-01 or RS-15.
- The order below is the retro's rank. Paste these rows under a new heading at the end of the task sections, in the bullet style of "Release-path follow-ups (1 Nov 2026, CR-45 lanes)".

**Freeze.** The freeze runs from Tue 3 Nov 13:00 UTC to the Mon 9 Nov go/no-go (D-130). Its rule (AUTOMATION 0.2 item 17) bars workflow, `eas.json` and `app.config.ts` changes except S0 and S1 fixes. A row marked "after 9 Nov" touches one of those.

**Waves.**
- **Wave 1** starts now.
- **Wave 1 follow-on** is freeze-safe and starts when its dependency lands.
- **Wave 2** waits for 9 Nov.
- **Harness-ready** means small, testable and needing no secrets.

Minutes are estimates of founder hands-on time saved per release cycle.

### Setup retro follow-ups (1 Nov 2026, RS ids; BL ids to be assigned together with #551)
- **RS-01 Prove the cloud build path on the next build.** BL id: none. Status: dropped in favour of CR-47 R3; see REL-04. Do not paste. Kept for the record: was needs-founder. Mode: pair. Owner: founder (sitting), `ops` (answer script, verification). When: Wave 1, before the next TestFlight build; no file changes, so freeze-safe. Scope: a prepared 10-minute sitting. Run `npx eas-cli@24.10.0 credentials --platform ios` in `apps/mobile` (profile `testflight`) and confirm the `.preview` distribution certificate, the profile and the App Store Connect API key for submit are listed; if the key is missing, add it with "Manage your API Key". Then dispatch the unchanged `testflight.yml` with `submit=true` and approve the `testflight` environment. Before the run, `security` confirms that `cache: npm` in the environment job is acceptable for one run. Fallback: the Mac path in `docs/release/TESTFLIGHT.md`. From RX-P2-6, RX-P1-8, RX-P2-5. Minutes: 30 to 45 per build. Done when: `testflight.yml` has one green `workflow_dispatch` run and its build shows in the TestFlight internal group.
- **RS-02 Secrets never on screen or in chat.** BL id: to be assigned together with #551. CR-47: this row keeps only its scripts; REL-07 owns the secret rules, so the CTO skill rule below moves there. Status: ready. Owner: `ops` (scripts), `security` (rule and review). When: Wave 1, before build 2's secrets (S-51 to S-54); freeze-safe. Scope:
  - `scripts/packs/keygen.mjs` writes the secret seed to a 0600 file that it refuses to overwrite, writes the backup to a separate file for offline custody, and prints only the public line and a short fingerprint.
  - `scripts/founder/put-secret.sh <NAME> <environment>` pipes stdin to `gh secret set` and clears the clipboard.
  - The `.p8` step ends with moving the file into the password manager.
  - The CTO skill gains the rule: never read page text or a screenshot of a tab that has just created a secret; verify by names, status and dates after a reload.

  From RX-P1-3. Minutes: 30 to 45 in a cycle that creates secrets. Done when: a keygen test shows no `EL_SIGNING_KEY=` on stdout, file mode 0600 and a refusal to overwrite; a `put-secret.sh` test with a stub `gh` sees the value only on stdin; the skill holds the rule.
- **RS-03 Walls in the repo, a one-action hand-off, no retries.** BL id: to be assigned together with #551. Status: ready. Owner: Karma (CTO skill), `security`. When: Wave 1; freeze-safe (docs). Scope:
  - `docs/agents/WALLS.md` lists each wall a session meets (consent and attestation, DNS edits, secrets, account creation, security settings, bulk deletes, GitHub settings through the proxy, passkey sudo mode, second-account sign-in), with its refusal string and the designed hand-off.
  - Agreements, attestations and DNS edits are always the founder's click, even if a session's click would go through.
  - Never retry a wall, and never offer to "approve the retry".
  - The hand-off template: one action per message, with the tab already open, the field, the value, the expected result and the reply word.
  - Stage a page no more than 10 minutes before the founder acts, and start a sitting with a sign-in sweep.

  From RX-P1-6, RX-P1-10, RX-P1-7. Minutes: 25 to 40. Done when: `WALLS.md` is on `develop`; the CTO skill and the setup ledger cite it; in the next cycle no founder-facing message asks him to approve a wall action in chat.
- **RS-04 One front door for every ask to the founder.** BL id: to be assigned together with #551. Status: ready. Owner: Karma; the founder sets the Project instructions. When: Wave 1; freeze-safe. Scope:
  - CTO skill section 3 (line 112) and the CR-41 email template require a citation line on every founder ask, hand-off emails included. The line names the checks run: setup record, PRs from the last 24 hours, coordination docs.
  - The Project instructions point to the one setup record and forbid new dated setup docs.
  - Superseded banners go on the dated setup docs.
  - Once RS-06 lands, the citation line becomes its `--step` output.

  From RX-P1-4, RX-P3-5, RX-P3-6; builds on IMP-28 and IMP-41. Minutes: 25 to 50. Done when: the skill and CR-41 text are amended; the Project instructions are non-empty; a 7-day sample of hand-off log entries all carry the line.
- **RS-05 Setup step registry in the repo.** BL id: to be assigned together with #551. CR-47: this registry is the source REL-08 renders. Status: ready. Owner: `ops`; Karma rules the step list. When: Wave 1; freeze-safe. Scope: `docs/release/setup-steps.json`, one entry per S-id. Fields: `id`, `title`, `chain`, `owner`, `wall`, `blocks` (`mac-build`, `gh-build`, `store`, `optional`), `depends`, `probe` or `attest`, deep link, prefilled public values, minutes, recurrence. Public identifiers only (RS-13). From RX-P3-1, RX-P1-1. Minutes: 0 directly (enabler). Done when: `node --test` validates unique ids, resolved `depends`, and a wall, minutes and probe on every founder step; every open S-id in the setup record is present.
- **RS-06 One read-only state command.** BL id: to be assigned together with #551. CR-47: setup state only; REL-03 consumes its JSON. Status: blocked (RS-05). Owner: `ops`; `qa` tests; `security` review. When: Wave 1; freeze-safe. Scope: `npm run release:ready` (`scripts/release/ready.ts`), GET only.
  - It reuses `scripts/founder/check.mjs`, `scripts/release/doctor.ts`, the preflights and `publish.ts verify`.
  - Public probes: DNS over HTTPS (NS, DS, CAA, MX, DMARC), AASA on the site and on Apple's CDN, the pack manifest, GitHub REST.
  - Founder mode, through the founder's own `gh`, lists environment secret names and never values.
  - Expo and App Store Connect reads run only when their variables are set.
  - States: PASS, FAIL, CLAIMED, ATTESTED, UNKNOWN. UNKNOWN is never PASS.
  - Flags: `--step S-xx` (exit 0 only on PASS or ATTESTED), `--json`, `--brief` (25 lines or fewer, for subagent prompts).

  From RX-P1-2, RX-P2-3, RX-P3-2, RX-P3-8. Minutes: 30 to 60. Done when: it prints a row per registry step; fixture tests cover each state; tests assert no write call and no secret value in the output; on 1 Nov state it reports S-04b FAIL and S-08 PASS.
- **RS-07 Update-channel guard.** BL id: to be assigned together with #551. Status: ready. Owner: `ops`. When: Wave 1; freeze-safe; harness-ready. Scope: a FAIL row in `scripts/release/doctor.ts` and `apps/mobile/scripts/preflight-production.mjs` for any `eas.json` build profile that names a `channel` while `expo-updates` is not a dependency (D-091). The `docs/release/TESTFLIGHT.md` line 60 correction (the build fails, so "answer no" is wrong) belongs to REL-10 under CR-47. From RX-P2-2. Minutes: 30 to 60 per avoided failed store build. Done when: `npx tsx scripts/release/doctor.ts --store` FAILs on today's `develop` with the channel row, and a fixture without a channel PASSes.
- **RS-10 Release docs say only what is observed.** BL id: to be assigned together with #551. Narrowed by CR-47: `TESTFLIGHT.md` belongs to REL-10, so this row fixes only the other docs. Status: ready. Owner: `ops`; `privacy` reviews the runbook line. When: Wave 1; freeze-safe; harness-ready. Scope:
  - `docs/ops/WEBSITE_RUNBOOK.md` line 19: remove the personal-account team slug and id and point to the private setup record. Lines 24 and 107: `.app` nameservers are on Cloudflare since 1 Nov. Line 20: confirm the project name.
  - The non-TESTFLIGHT leftovers of S-41: the PACKS_HOSTING default branch, the `.app` CAA wording, and the reachability line in the `doctor.ts` header.
  - Status sections are left to #551's HV2-B05 pointer pass.

  From RX-P2-10. Minutes: 10 to 20. Done when: the lines are corrected on `develop`, and on `main` with the next release merge; `git grep` finds no personal-account slug.
- **RS-08 Claims for setup steps, closed in the same turn.** BL id: to be assigned together with #551. Status: blocked (RS-05). Owner: `ops`; `chief-of-staff` writes the COORDINATION text. When: Wave 1 follow-on; freeze-safe. Scope:
  - `scripts/release/setup-claim.mjs claim | release | done | status`, on GitHub issues labelled `setup-claim`.
  - The lowest open issue number wins; a claim expires after 2 hours; `done --evidence <kind>` closes the claim with an attestation, where kind is one of `pr`, `dns`, `http`, `browser`, `vendor-email` or `founder-said`.
  - Closed duplicate branches get a `superseded` label.
  - Only for steps that touch no file. Code-path claims stay in #551's CLAIMS.md (HV2-B04).

  From RX-P3-4, RX-P3-7; builds on IMP-30 and IMP-32. Minutes: 20 to 40. Done when: a test with two simulated claimers on one step leaves exactly one holder; `release:ready` shows CLAIMED; COORDINATION section 2 names the command.
- **RS-09 Founder setup kit per cycle.** BL id: to be assigned together with #551. Status: blocked (RS-05, RS-06). Owner: `chief-of-staff` (content), `ops` (script). When: Wave 1 follow-on; freeze-safe. Scope: `scripts/founder/kit.mjs --cycle <version>` renders the founder's sitting from the registry and the live state.
  - Section 0: the linked pane and shell check, then the sign-in sweep.
  - Steps grouped by milestone, with the optional block last and each step in the RS-03 shape.
  - A recurring calendar: certificate and profile expiry, agreements, membership, domain renewals. UNVERIFIED where no source gives a date.
  - It shares one source with #551's HV2-B01 build checklist.

  From RX-P1-1, RX-P1-5, RX-P1-7, RX-P1-9. Minutes: 30 to 60. Done when: the kit for build 2 renders; a test fails on a step with no deep link, verifier, minutes or wall, and on an optional step placed above a blocking one.
- **RS-11 Doctor evaluates the resolved config.** BL id: to be assigned together with #551. Status: ready. Owner: `ops`. When: Wave 1 follow-on; freeze-safe; harness-ready. Scope: `scripts/release/doctor.ts` reads `extra.eas.projectId` and `owner` from the resolved Expo config, as the preflight does, and keeps the regex (lines 153 and 159) only as a WARN fallback. The "written inline" comment in `app.config.ts` changes only after 9 Nov. From RX-P2-1. Minutes: 0 to 10. Done when: `apps/mobile/test/release-doctor.test.ts` has a case where the project id is held in a constant and it PASSes, and the doctor on `develop` reports the same id as `npx expo config --json`.
- **RS-12 No live repository state in unit tests.** BL id: to be assigned together with #551. Status: ready. Owner: `qa`. When: Wave 1 follow-on; freeze-safe; harness-ready. Scope: `preflight-production.test.ts` and its peers test fixtures, not the live FAIL set; the live set is reported by `release:ready`. From RX-P2-8. Minutes: 0 directly (removes red-`develop` rounds). Done when: changing `packages/api/src/keys.ts` or `supabase/functions/config/published.ts` on a branch changes no unit test result.
- **RS-13 Personal-identifier guard.** BL id: to be assigned together with #551. Status: blocked (RS-10). Owner: `security`, `privacy`. When: Wave 1 follow-on; freeze-safe; harness-ready. Scope: extend the hashed approach of `packages/content/test/no-real-family-data.test.ts` to personal email addresses, personal account slugs and vendor ids that code does not need. Cover `docs/release/setup-steps.json` and the docs tree, `docs/reviews/` included. The test stores hashes, never the values. From RX-P3-10. Minutes: 0 (risk). Done when: the test fails on a planted fixture and passes on `develop`.
- **RS-14 `testflight.yml` hardening patch.** BL id: to be assigned together with #551. Status: blocked (REL-04, which replaced RS-01). Owner: `ops` (patch in `docs/ops/proposed/`); `red-team` review; the founder applies. When: Wave 2, after 9 Nov (workflow). Scope:
  - `--freeze-credentials`.
  - A first step in the environment job: `EXPO_TOKEN` present, then `eas whoami` and `eas project:info`.
  - Check that the `required` status is green on the sha, instead of re-running the suite.
  - No `cache: npm` in the job that holds the secret.
  - `--what-to-test` filled from `packages/content`.

  From RX-P2-5. Minutes: 5 to 10 beyond REL-04. Done when: a dispatch with the secret removed fails in under 2 minutes, and a normal dispatch is green.
- **RS-15 Remove the EAS Update channel from `production`.** BL id: none. Status: merged into REL-06 (the same change). Do not paste. Kept for the record: was blocked (RS-07, D-124 item 1). Owner: `mobile`; Karma merges. When: Wave 2, in the S-12b `eas.json` PR after 9 Nov. Scope: delete `"channel": "production"` from the `production` build profile; `release-ios.yml` builds that profile with `--non-interactive`, and expo-updates is not installed (D-091, #538). From RX-P2-2. Minutes: shared with RS-07. Done when: `doctor.ts --store` passes the channel row.
- **RS-16 Store-lane gate without the withdrawn approver.** BL id: to be assigned together with #551. Status: needs-decision (#551 HV2-B26). Owner: Karma, `ops`, `security`; the founder creates the environment. When: Wave 2. The rule "no `ios-v*` tag until `app-store` exists" applies now. Scope:
  - The `release-ios.yml` header requires a separate approver account, which CR-19 withdrew, and says a run creates `app-store` unprotected if it is missing (SR-11).
  - Karma proposes who reviews `app-store` (the founder, as on `testflight`, until the identity decision), and the founder confirms the reviewer.
  - The founder creates the environment with refs `ios-v*` and `release/*` before the first RC tag.
  - The header and `docs/ops/RELEASE.md` are updated.

  New in this retro. Minutes: 30 to 60 per avoided bad first RC. Done when: `app-store` exists with a reviewer and refs before the first RC tag, and the header names no approver account.
- **RS-17 Published state in one pinned issue.** BL id: to be assigned together with #551. Status: blocked (RS-06, #551 HV2-B07). Owner: `ops`, `chief-of-staff`; the founder applies the workflow and the `scripts/agents/brief.mjs` change (CODEOWNERS). When: Wave 2 (workflow). Scope: the setup and release rows from `release:ready --json` become a section of #551's TODAY pinned issue, with no second status issue. `brief.mjs` injects the FAIL and CLAIMED rows into agent briefs from plain code. From RX-P2-4, RX-P3-3, RX-P3-8. Minutes: 15 to 30. Done when: the issue section updates within its cycle; a `brief.mjs` dry run shows the rows; a test asserts the body holds no email address.
- **RS-18 Overlap guard for identifier PRs.** BL id: to be assigned together with #551. Status: ready (script); the workflow waits. Owner: `ops`; `red-team` review. When: Wave 2 (workflow); the script is harness-ready. Scope: a warn-only comment, `<!-- overlap:<sha> -->`, when two open PRs change `extra.eas.projectId`, `owner`, `submit.*.ascAppId`, `TRUSTED_SIGNING_KEYS` or `PACK_MANIFEST`. From RX-P2-11, RX-P3-9. Minutes: 0 to 10. Done when: a replay of the 1 Nov branches of #486, #487 and #493 gives each a comment naming the others.
- **RS-19 Read-only Expo and App Store Connect checks in CI.** BL id: to be assigned together with #551. Status: needs-founder (he creates the token and key). Owner: `ops`, `security`. When: Wave 2. Scope: a `release-read` environment (`develop` only, no reviewer) holding a read-only robot token and a read-only App Store Connect key. Least roles are UNVERIFIED; `security` signs them off. Used only by RS-17 to report the latest build and its processing state, and which record owns the Plus products. Never reuse the `testflight` token. From RX-P2-7. Minutes: 10 to 20. Done when: the pinned issue shows the latest build's processing state within 24 hours of an upload, with no founder action.
- **RS-20 First-run download proxies.** BL id: to be assigned together with #551. Status: ready. Owner: `speech` (soak), `qa` (journey). When: Wave 2 by priority; freeze-safe; the soak is harness-ready. Scope: `publish.ts verify --soak` fetches one model in the app's chunk size, through the redirect, with the app's stall rule, and runs weekly. A Simulator first-run journey asserts that the card never shows a frozen 0% (#541). Whether the Simulator reproduces `waiting_for_wifi` is UNVERIFIED. From RX-P2-9. Minutes: 15 to 30 per build that would otherwise be found broken on a phone. Done when: the soak runs green weekly, and the journey fails on pre-#541 code and passes after it.
