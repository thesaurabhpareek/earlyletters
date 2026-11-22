# Setup retrospective: 29 Oct to 1 Nov 2026 (synthesis)

Repo copy: personal emails, addresses, account names and vendor ids are left out. The Project copy (`infra/retrospective-2026-11-01.md`, proposed) keeps the private columns. Backlog rows: `docs/reviews/2026-11-01-setup-backlog-rows.md` (headed by RS ids; BL ids to be assigned together with #551).

Independent synthesis of panels P1 (founder time), P2 (automation) and P3 (coordination), checked against the repo (`origin/develop` 01a07627, 1 Nov 09:58 UTC), GitHub REST, live DNS and HTTP probes, the session transcript and the setup ledger (a private Project doc, `infra/setup-record.md`). I built none of the work under review. The panel authors did build much of it, so every claim that changes a ranking or an urgent finding was re-checked; what could not be checked is marked UNVERIFIED. Every minute figure is an ESTIMATE unless it is a timestamp.

---

## 0. Summary

1. **What went wrong.** About 30 founder-only steps fell in 4 days, and we added most of the round trips: stale overlapping status lists, threads asking for finished steps (3 emails for a done key ceremony), and secrets shown on screen (2 key pairs and 2 tokens lost). The cloud build had never run, so build 1 needed the founder's Mac.
2. **Fix 1:** one step registry and one live, read-only state command; every ask quotes it (RS-04, RS-05, RS-06).
3. **Fix 2:** secrets only through scripts, never on screen; each wall is one prepared click, never retried (RS-02, RS-03).
4. **Fix 3:** prove the cloud build path on the next build, as ruled in CR-47 R3 (REL-04). RS-01 proposed the same and is dropped in its favour.
5. **Cost (ESTIMATES):** this cycle 8 to 12 h. Build 2 (new staging and secrets) 90 to 150 min. A repeat TestFlight cycle after that: about 10 min of setup plus 20 min of his phone checks.
6. **Know now:** a session clicked Apple's licence "Agree" on 31 Oct, at the founder's explicit request; how to treat that acceptance is his to decide (section 5 item 3). Future agreements are the founder's click (RS-03). Push no `ios-v*` tag before the `app-store` environment exists.

---

## 1. Timeline (merged, UTC)

Round trips are founder messages spent on a step without closing it. In this session P1 sees 33 founder messages; the coordinator's "about 40" may include messages from before the earlier compaction, which no panel could see. Only 4 of about 32 setup messages were real decisions. The rest were delegations, navigation asks, checks and status asks (P1, section 1).

| When | Step | Founder trips | Why | Evidence |
|---|---|---|---|---|
| 29 Oct | Apple Developer Program active | n/a | Apple identity check | ledger 1.1 |
| 31 Oct | GitHub settings and rulesets | 1 to 2 | Two actors applied the same settings at once | session transcript |
| 31 Oct 08:21 / 15:37 | #435 and #457 set the same `ascAppId` | 0 (2 review sets) | No claim; open PRs not searched | REST; P3 |
| 31 Oct 15:45 | Apple Program License Agreement | 2 | First click refused ("Consent Given For The User"). After the founder delegated it in chat, the session clicked again and it went through | session transcript (verified) |
| 31 Oct to 1 Nov | GitHub two-factor | 3 | Security-settings wall. The first decline didn't say that no approval changes it. Afterwards every settings save needs the founder's passkey | session transcript |
| 31 Oct to 1 Nov | ASC API access (Apple terms) | 3 | Consent wall, then the page expired during a 12 h gap | session transcript |
| 31 Oct to 1 Nov | Expo sign-in, second Google account | 4 | Password wall, 12 h gap, expired page; the project already existed elsewhere | session transcript |
| 1 Nov 04:54 to 05:19 | Production `ascAppId` for the production app record: #482 | 0 (one review round) | Opened 04:54:54, closed unmerged 05:19:45; the two-lens review caught its production `ascAppId` before merge | REST |
| 1 Nov 05:07 to 05:32 | Expo project id: #486, #487, #493 | 0 (extra review round) | Three Expo projects created in parallel. #486 closed unmerged at 05:19:47. #487's first head failed the doctor's regex. #493 reopened a closed branch 22 s after #487 merged | REST; session transcript; P3 |
| 1 Nov 05:12 to 05:41 | Six new setup-state docs in the Project | n/a | No single home; the "no new dated file" rule came at 05:32 | session transcript |
| 1 Nov 05:45 to 06:12 | `EXPO_TOKEN` into the `testflight` environment | 7 | Wall, plus our mistake (page text read while a new token showed), "validate" read as a button, a token lost because it shows once. Not on build 1's critical path | session transcript |
| 1 Nov ~05:50 to 06:00 | `.app` nameservers, zone, DNSSEC, R2, bucket | several (other thread) | DNS and terms walls. The NS switch was done by a session "in his signed-in session" at his request | ledger section 5 |
| 1 Nov (other thread) | Pack key ceremony and release v1 | 5 or more | `keygen.mjs` prints the secret, which got pasted into chat twice; one pair saved as screenshots. #512 merged 07:29 | P1 row 17; `keygen.mjs:57` (verified) |
| 1 Nov 06:14 / 06:19 / 07:30 / 07:35 | False "not done" and three stale hand-off emails | 1 plus 3 emails | State read from `develop` only; the CR-41 email path skips the check | ledger section 5; P3 |
| 1 Nov 05:45 to 06:58 | Small Business Program | 5 | Attestation wall, form lost when a tab closed, buried in long lists | session transcript |
| 1 Nov | Build 1 from the founder's Mac, 1.0.0 (8) | not counted | The `channel` made `eas build` install expo-updates and fail (#538), then a rebuild | #538; ledger 1.1 |
| 1 Nov | First run: download stuck at 0%, date picker | reported by the founder | App state machine (#541, merged), picker (#540) | REST |
| 1 Nov | `develop` red twice | 0 | Tests pinned the live FAIL set (#526, #537, #539) | P2 |

Measured: the attended window on 1 Nov ran 04:13 to 07:26 UTC (3 h 13 min, 14 messages). Everything before the compaction and in other threads is unmeasured.

---

## 2. Root causes

### Walls (permanent: design around them, never get round them)

| ID | Wall | Evidence |
|---|---|---|
| W1 | Only the founder can accept terms or attest, edit DNS, type or read secrets, create accounts, change security settings, bulk-delete, or sign in to a second Google account. Apple: only the Account Holder signs agreements; on an individual account only the Account Holder creates signing credentials | refusal strings counted by P2 (consent 14, DNS 11, Git Destructive 4); Apple and Expo docs cited by P1 |
| W2 | The session proxy refuses GitHub settings, environment and secret APIs, even reads. Since his 2FA, every settings save needs the founder's passkey | P2 re-check (HTTP 403); session transcript |
| W3 | Vendor sign-in pages expire while waiting | session transcript |
| W4 | Some facts can't be probed without him: EAS has no documented read-only credentials listing; SBP, `.p8` custody and token values can only be attested | P2 W4; P3 W4 |
| W5 | Threads share no memory, all post as one GitHub identity, and the Project is invisible to subagents and the harness | session transcript; ledger section 0 |

### Friction we caused ourselves (deduplicated across panels)

| ID | Root cause | Panels | Evidence |
|---|---|---|---|
| SC1 | **No single computed state.** At least nine setup-state docs in the Project plus FOUNDER_QUEUE, TESTFLIGHT and others, all written by hand and stale row by row. `FOUNDER_QUEUE.md` still opens "Status at Wed 28 Oct"; `TESTFLIGHT.md` still says no build exists (both verified). The checker `scripts/founder/check.mjs` sees GitHub only (verified) | P1 RC2, P2 RC-5, P3 RC1, RC2, RC6 | session transcript vs session transcript; session transcript; repo |
| SC2 | **"Check before you ask" is a sentence, not a tool, and the newest ask channel is exempt.** CTO skill line 112 calls hand-offs "not questions", so CR-41 emails skip the gate. Nothing can show "in progress", so a step between your action and its merge reads as "not done" | P1 RC3, P3 RC3, RC5 | 06:14 false "not done"; emails at 06:19, 07:30, 07:35 |
| SC3 | **No claim for setup steps.** BOARD claims are file globs that land only on merge; races here took 3 minutes and 22 seconds. #482 and #486 were each closed once, 3 s apart (05:19:45 and 05:19:48, REST issue events) | P3 RC4, RC7 | REST; prior IMP-30, IMP-32 |
| SC4 | **Secrets passed through screens, clipboards and chat.** `keygen.mjs` prints `EL_SIGNING_KEY=` next to the public line (verified); a session read a page while a new token showed; one-time values were lost between tabs | P1 RC4, P2 RC-1 | `scripts/packs/keygen.mjs:49-57`; session transcript |
| SC5 | **Hand-offs were prose lists, not "this tab, this field, this value", and weren't ordered by the critical path.** Three "take me to the exact page" asks; 7 messages on a token build 1 never used; optional DMARC repeated in every list | P1 RC5, RC6 | session transcript; 0 dispatch runs |
| SC6 | **Walls were probed and enforced inconsistently, which invited re-asking.** The licence click and the Porkbun NS and mail edits went through after a chat approval; the Cloudflare edits did not | P1 RC7 | session transcript; ledger change log 05:50; P1 |
| SC7 | **The tools check repo text, and the docs and tests hold unverified beliefs.** The doctor matches regexes (`doctor.ts:153, 159`), so `app.config.ts:179` now bends to the checker. Tests required a `channel`, and the docs said "answer no" to expo-updates (`TESTFLIGHT.md:60`, verified). The claim that sandboxes can't reach Expo or ASC is false: Apple returns 401 and Expo 405 (re-probed 1 Nov). Unit tests pinned the live FAIL set | P2 RC-2, RC-3, RC-6 | repo; curl |
| SC8 | **The automated path was never exercised.** `testflight.yml` has 14 runs, all `pull_request`, and none on dispatch (REST, verified), so the manual path became the plan | P2 RC-4, P1 RC6 | REST |
| SC9 | **Sessions were not ready when the founder was.** Pages were staged hours early and expired; forms were lost; "Mac is on" didn't give a session a shell | P1 RC8 (mixed with W3) | session transcript |

How this relates to the previous retro (28 Oct): IMP-38 (one founder page) and IMP-41 (scattered founder asks) produced FOUNDER_QUEUE as "one order". SC1 shows that one hand-kept order isn't enough without a live check. IMP-28 and IMP-32 (answers and streams not crossing threads) recur here as SC2 and SC3. RB-15 (release pipeline dry run) is still open, and SC8 is the same gap.

---

## 3. What worked, and keep

- **The release doctor and the preflights.** The preflight resolves the real config, so it was right where the doctor's regex was wrong. `preflight-testflight` reported 0 FAIL at #527.
- **The two-lens review gate.** It caught #487's doctor failure and D-124 breach, and #482's production `ascAppId`, before merge.
- **`publish.ts verify`.** It proved the pack host independently, and narrowed the 0% bug to the app (#541).
- **The setup ledger once it existed,** especially section 0a ("Never ask twice", walls, the permanent versus recurring table).
- **The browser pane with the founder's sign-ins, plus passkey-staged settings.** The `testflight` environment and the Copilot ruleset took 0 extra trips and one passkey tap.
- **Checking from outside, without secrets.** DNS over HTTPS, curl and the Gmail and Resend connectors confirmed R2, DNSSEC and AASA with one "validate".
- **`testflight.yml`'s security posture.** SHA-pinned actions, `persist-credentials: false`, the token only in the step's env, `--non-interactive`.
- **Session footers in PR bodies.** They are the only way to tell threads apart (P3), so keep them.
- **Few real decisions were asked.** Only 4 of about 32 setup messages asked him to decide something. Prepared delegation works; the waste was in the other 28.

---

## 4. Ranked backlog

Ranked by founder minutes saved plus risk removed, per unit of effort. Minutes are ESTIMATES per release cycle. They overlap between rows (RS-03, RS-04, RS-06 and RS-09 share some of the same savings), so don't add them up.

**Freeze-safe** follows the written rule: D-130 "Effects" and `docs/release/AUTOMATION.md` 0.2 item 17 say no workflow, `eas.json` or `app.config.ts` change between the freeze and the go/no-go, except S0 and S1 fixes. The brief says workflows are fine with two reviews; see section 7. Here a workflow change is N, and a proposal file under `docs/ops/proposed/` is Y.

**Waves:**
- **W1**: Wave 1, start now.
- **W1+**: freeze-safe, starts once a W1 dependency lands.
- **W2**: Wave 2, waits for 9 Nov.
- **H**: Harness-ready (small, testable, no secrets).

| Rank | ID | Title | From | Problem | Change | Owner | Effort | Done when (testable) | Freeze-safe | Founder min saved (est.) | Deps | Wave |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 (dropped) | RS-01 | DROPPED in favour of CR-47 R3; see REL-04. Was: Prove the cloud build path on the next build | RX-P2-6, RX-P1-8, RX-P2-5 (dispatch only) | 0 dispatch runs; build 1 needed the founder's Mac and prompts; whether the ASC submit key is in EAS is UNVERIFIED | Dropped; kept for the record. Was: a prepared 10-min sitting: `npx eas-cli@24.10.0 credentials --platform ios` in `apps/mobile` (profile `testflight`), then read that the `.preview` certificate, the profile and the ASC API key are listed (add the key with "Manage your API Key" if not). Then dispatch the unchanged `testflight.yml` for the next build (a `testflight` rebuild with #541 and #546, or build 2) with `submit=true`, and approve it. ops scripts the screen answers and verifies from the run log. Fallback: the Mac path | FOUNDER (sitting), ops | S | One green `workflow_dispatch` run; its build is in TestFlight "Family" | Y (no file change) | 30 to 45 per build (now counted under REL-04) | security OKs `cache: npm` for one run (see RS-14) | dropped (REL-04) |
| 2 | RS-02 | Secrets never on screen or in chat | RX-P1-3 | 2 key pairs discarded, 2 tokens revoked, `.p8` left in Downloads. Build 2 creates at least 8 new secrets (ledger section 2) | (a) `keygen.mjs` writes the seed to `~/.config/early-letters/signing.env` (0600, no overwrite) and prints only the public line and a fingerprint. (b) `scripts/founder/put-secret.sh NAME env` pipes stdin to `gh secret set` and clears the clipboard. (c) The `.p8` step ends with moving it into the password manager. (d) The no-read rule from ledger 0a goes into the CTO skill | ops (scripts), security (rule, review) | M | `keygen` test: no `EL_SIGNING_KEY=` on stdout, mode 0600, refuses to overwrite; `put-secret.sh` test with a stub `gh` sees the value only on stdin; the skill holds the rule | Y | 30 to 45 in a cycle that creates secrets | none | W1 |
| 3 | RS-03 | Walls in the repo, a one-action hand-off, no retries | RX-P1-6, RX-P1-10, RX-P1-7 | The walls table lives only in the Project (ledger 0a), which the harness and subagents can't read. Chat approvals sometimes moved a wall action through, so the founder kept asking | `docs/agents/WALLS.md`: each wall, its refusal string and the designed hand-off. Agreements, attestations and DNS are the founder's click even when a click would go through. Never retry or offer "approve the retry". The hand-off template: one action per message, tab open, field, value, what he will see, reply word. Stage no more than 10 min ahead; sign-in sweep first | KARMA, security | S | WALLS.md on `develop`; CTO skill and ledger 0a cite it; spot check next cycle: no message asks the founder to approve a wall action in chat | Y | 25 to 40 | none | W1 |
| 4 | RS-04 | One front door for every ask to the founder | RX-P1-4, RX-P3-5, RX-P3-6; prior IMP-28, IMP-41 | Four prose "check first" rules, and the CR-41 email path is exempt (CTO skill line 112) | Now: CTO skill section 3 and the CR-41 template require a citation line (ledger 0a check: record, 24 h PRs, coordination docs) on every ask, hand-off emails included. Project instructions (founder, 2 min) point to `infra/setup-record.md`. "Superseded" banners on the six dated setup docs. Later: the line becomes `release:ready --step` output (RS-06) | KARMA; FOUNDER (Project instructions) | S | Skill and CR-41 amended; Project instructions non-empty; every dated setup doc bannered; a 7-day sample of `infra/founder-handoffs.md` all carry the line | Y | 25 to 50 | none | W1 |
| 5 | RS-05 | Setup step registry in the repo | RX-P3-1, RX-P1-1 (registry) | The step list lives in a Project doc that agents can't read | `docs/release/setup-steps.json`: S-ids from ledger section 3, with fields `wall`, `blocks` (mac-build, gh-build, store, optional), `depends`, `probe` or `attest`, deep link, prefilled public values, minutes, recurrence. Public identifiers only (RS-13 rules). A test validates it | ops; KARMA rules the list | S | `node --test` validates unique ids, resolved `depends`, and a wall, minutes and probe on every founder step; every open ledger S-id is present | Y | 0 (enabler) | none | W1 |
| 6 | RS-06 | One read-only state command | RX-P1-2, RX-P2-3, RX-P3-2, RX-P3-8 (`--brief`) | Five partial checkers; "validate" meant browsing the founder's pages; a step in flight read as "not done" | `npm run release:ready`: reuses check.mjs, the doctor, the preflights and `publish.ts verify`. Public probes: DNS over HTTPS, AASA on the site and on Apple's CDN, the pack manifest, GitHub REST. Founder mode (the founder's `gh`) lists secret names, never values. States PASS, FAIL, CLAIMED, ATTESTED, UNKNOWN. Flags: `--step S-xx`, `--json`, `--brief` (25 lines for subagent prompts) | ops; qa (tests); security (review) | M | A row per registry step; fixture tests per state; tests assert no write call and no secret value in output; on today's state S-04b is FAIL (DMARC is `p=reject` without strict alignment, probed 1 Nov) and S-08 is PASS | Y | 30 to 60 | RS-05 | W1 |
| 7 | RS-07 | Update-channel guard | RX-P2-2 (checks and docs) | `production` still has `"channel": "production"`, expo-updates isn't installed, and no check catches it | FAIL row in `doctor.ts` and `preflight-production.mjs` for any profile with a `channel` while expo-updates is absent. The `TESTFLIGHT.md:60` correction belongs to REL-10 (CR-47) | ops | S | `doctor.ts --store` FAILs on today's `develop` with the channel row; a fixture without a channel PASSes | Y | 30 to 60 per avoided failed store build | none | W1, H |
| 8 | RS-10 | Release docs say only what is observed (narrowed by CR-47: `TESTFLIGHT.md` belongs to REL-10) | RX-P2-10, ledger S-41, urgent finding 5.2 | `TESTFLIGHT.md:20` (no build; sandboxes can't reach Expo or ASC) and `:60` are false. `WEBSITE_RUNBOOK.md:19` carries a personal-account team slug and id; `:24` and `:107` say the nameservers never move (`.app` moved 1 Nov) | Fix the `WEBSITE_RUNBOOK.md` lines plus the non-TESTFLIGHT leftovers in ledger S-41 (PACKS_HOSTING default branch, `.app` CAA wording, the `doctor.ts` header reachability line). Leave the status sections to #551's HV2-B05 pointer pass | ops; privacy reviews the runbook line | S | Lines corrected on `develop` and `main`; `git grep` finds no personal team slug | Y | 10 to 20 | none | W1, H |
| 9 | RS-08 | Claims for setup steps, closed in the same turn | RX-P3-4, RX-P3-7; prior IMP-30, IMP-32 | 3-min and 22-s races; a closed branch reopened with a wrong id | `scripts/release/setup-claim.mjs claim, done, release, status` on GitHub issues (lowest number wins, 2 h expiry, `done --evidence <kind>`). A `superseded` label on dead branches. Only for steps that touch no file; code claims stay in #551's CLAIMS.md (HV2-B04) | ops; chief-of-staff (COORDINATION text) | M | Test: two simulated claimers, exactly one holds it; `release:ready` shows CLAIMED; COORDINATION section 2 updated | Y | 20 to 40 | RS-05 | W1+ |
| 10 | RS-09 | Founder setup kit per cycle | RX-P1-1 (render), RX-P1-5, RX-P1-7, RX-P1-9 | Steps went out as prose lists of 5 to 7, not ordered by milestone; renewals arrive as surprises | `scripts/founder/kit.mjs --cycle <v>` renders from RS-05 and RS-06. Section 0 checks the linked pane and shell, then the sign-in sweep. Steps grouped by milestone, the optional block last, each in the RS-03 shape. A recurring calendar (certificates from `eas credentials`, agreements, membership, domains; UNVERIFIED where no date). One source with #551's HV2-B01 build checklist | chief-of-staff, ops | M | The kit for build 2 renders; a test fails on a missing deep link, verifier, minutes or wall, or on an optional step above a blocking one | Y | 30 to 60 | RS-05, RS-06 | W1+ |
| 11 | RS-11 | Doctor evaluates the resolved config | RX-P2-1 | The regex can't see constants (#487) | Read `extra.eas.projectId` and `owner` from the resolved config, as the preflight does; regex only as a WARN fallback | ops | S | A `release-doctor` test with a constant id PASSes; the doctor agrees with `npx expo config --json` | Y (the `app.config.ts:179` comment waits for 9 Nov) | 0 to 10 | none | W1+, H |
| 12 | RS-12 | No live repo state in unit tests | RX-P2-8 | `develop` went red twice as the founder finished steps | Run the preflight tests on fixtures; report the live FAIL set via `release:ready` | qa | S | Changing `keys.ts` or `published.ts` on a branch changes no unit test result | Y | 0 direct (removes red-`develop` rounds) | none | W1+, H |
| 13 | RS-13 | Personal-identifier guard | RX-P3-10 | A personal-account slug reached the public repo (5.2); a machine-readable registry raises that risk | Extend the hashed `no-real-family-data` approach to personal emails, account slugs and vendor ids not needed by code; add `setup-steps.json` to its scope | security, privacy | S | The test fails on a planted fixture and passes on `develop` after RS-10 | Y | 0 (risk) | RS-10 | W1+, H |
| 14 | RS-14 | `testflight.yml` hardening patch | RX-P2-5 | No `--freeze-credentials`; secrets checked only after the full test suite; `cache: npm` in a job that holds a secret; no "What to Test" | Patch in `docs/ops/proposed/`: `--freeze-credentials`; an `EXPO_TOKEN` and `eas whoami` / `project:info` step first; check `required` is green on the sha instead of re-running tests; drop the cache; `--what-to-test` from `packages/content` | ops; red-team; FOUNDER applies | S to M | Dispatch with the secret removed fails in under 2 min; a normal dispatch is green | N (workflow) | 5 to 10 (beyond REL-04) | REL-04 (replaced RS-01) | W2 |
| 15 | RS-15 | MERGED into REL-06 (the same change). Was: Remove `channel` from `production` | RX-P2-2 (edit) | `release-ios.yml:163` runs `--non-interactive` on `production` and will hit #538's failure | Delete the line in the S-12b PR (D-124 item 1) | mobile; KARMA merges | S | `doctor.ts --store` passes the channel row | N (`eas.json`) | shares RS-07 | RS-07 | merged (REL-06) |
| 16 | RS-16 | Store-lane gate without the withdrawn approver | new (urgent finding 5.4) | The `release-ios.yml` header requires "the approver account" (CR-19 withdrew it). `app-store` doesn't exist, and the header says a run would create it unprotected (SR-11) | KARMA proposes who reviews `app-store` (the founder, as on `testflight`, until #551's HV2-B26 identity decision), and the founder confirms the reviewer. The founder creates the environment before any `ios-v*` tag; update the header and `docs/ops/RELEASE.md` | KARMA, ops, security; FOUNDER (environment) | S | `app-store` exists with a reviewer and refs before the first RC tag; the header names no approver account | Docs Y; header N | 30 to 60 per avoided bad first RC | HV2-B26 | W2 (the "no tag" rule now) |
| 17 | RS-17 | Published state in one pinned issue | RX-P2-4, RX-P3-3, RX-P3-8 (harness); #551 HV2-B07, B19 | Status was prose; the harness can't read the Project | Add the RS-06 setup and release rows to #551's TODAY pinned issue (no second issue). `brief.mjs` injects the FAIL and CLAIMED rows (a founder-owned path) | ops, chief-of-staff; FOUNDER applies | M | The issue updates within its cycle; a `brief.mjs` dry run shows the rows; the body has no email address | N (workflow) | 15 to 30 | RS-06, HV2-B07 | W2 |
| 18 | RS-18 | Overlap guard for identifier PRs | RX-P2-11, RX-P3-9 | #435/#457 and #482/#486/#487/#493 | Warn-only comment when two open PRs change `projectId`, `owner`, `ascAppId`, `TRUSTED_SIGNING_KEYS` or `PACK_MANIFEST` | ops; red-team | S to M | A replay of 1 Nov's branches comments on #486, #487 and #493 | N (workflow; the script half Y) | 0 to 10 | none | W2, H |
| 19 | RS-19 | Read-only Expo and ASC checks in CI | RX-P2-7 | "Did Apple process it?" was answered by browsing | A `release-read` environment holding a read-only robot token and ASC key (least roles UNVERIFIED), used only by RS-17 | ops; security; FOUNDER (creates them) | M | The issue shows the latest build's processing state within 24 h, with no founder action | N | 10 to 20 | RS-06, RS-17 | W2 |
| 20 | RS-20 | First-run download proxies | RX-P2-9 | The 0% bug was visible only on the founder's phone | `publish.ts verify --soak` (weekly) and a Simulator first-run journey that fails on pre-#541 code | speech, qa | M | The soak runs green; the journey fails before #541 and passes after | Y | 15 to 30 per build found broken | none | W2 by priority (soak is H) |

**Wave 1 (start now, all freeze-safe):** RS-02, RS-03, RS-04, RS-05, RS-06, RS-07, RS-10 (narrowed). RS-01 is dropped in favour of CR-47 R3 (REL-04), and RS-15 (Wave 2) is merged into REL-06.
**Harness-ready later:** RS-07, RS-10, RS-11, RS-12, RS-13, RS-18 (script), RS-20 (soak).

Not added as rows, because they already exist: S-43 (delete the unused Expo projects), S-45 (branch cleanup), S-04b (strict DMARC, optional), RB-15 (release dry run, partly in open #321).

---

## 5. Urgent findings (each verified on 1 Nov unless marked)

1. **`production` still has an EAS Update `channel`.** Verified: `apps/mobile/eas.json` keeps `"channel": "production"`. `expo-updates` is not in `apps/mobile/package.json`. `release-ios.yml:163` runs `eas build --profile production --non-interactive --freeze-credentials`. Neither `doctor.ts` nor `preflight-production.mjs` checks for a channel (grep). Impact: the first store-lane build after 9 Nov fails the way build 1 did (#538). It doesn't affect build 2: the `preview` and `testflight` profiles have no channel. Fix: RS-07 now, and the channel removal with S-12b under REL-06 (RS-15 is merged into it).
2. **A personal Vercel slug is in the public repo.** Verified: `docs/ops/WEBSITE_RUNBOOK.md:19` holds a Vercel team slug built from a personal account name, and the team id. It is on both `develop` and `main`, and has been since 3 Oct (09140fe6). It is the only hit for that slug on `develop`. The same runbook is also wrong on lines 24 and 107 (it says the nameservers stay at Porkbun; `.app` moved to Cloudflare on 1 Nov), and line 20 names the project `earlyletters-web` where the ledger's Vercel API read says `earlyletters` (UNVERIFIED which is right). Fix for the current line: RS-10.
   - **Founder to decide (`needs:founder`):** whether the slug stays in git history and in Vercel's public deploy comments. Options: (a) leave history and the comments as they are, and fix only the current line; (b) rewrite history on `develop` and `main` to remove it, a one-way door that changes later commit ids and needs force-pushes to protected branches; (c) remove or hide the Vercel deploy comments that show it, with or without (b). This retro does not choose.
3. **The Apple agreement lesson.** Verified (session transcript, 31 Oct 15:45:11 UTC): after the founder delegated it in chat, a session clicked "Agree" on the Apple Developer Program License Agreement. An earlier attempt had been refused as "Consent Given For The User". Apple's help says agreements are the Account Holder's to sign (P1's source). The ledger records "Accepted 31 Oct" but not who clicked. What to do:
   - **Founder to decide (`needs:founder`, possibly with counsel):** how to treat the acceptance a session clicked at his explicit request. Options: (a) confirm it as his own act and record that in the ledger; (b) ask Apple whether he should accept it again himself (UNVERIFIED whether Apple offers that); (c) take counsel's view before choosing. This retro does not choose.
   - Karma notes in the ledger who clicked.
   - The founder clicks every future agreement and attestation himself (RS-03).

   The same inconsistency happened with DNS. The ledger's change log says the `.app` nameserver switch (1 Nov ~05:50 UTC) was done by a session at the founder's request, and P1 reports the Porkbun mail edits went through after a chat approval, while the Cloudflare edits were refused. A wall that sometimes gives way invites re-asking. Agreements also recur: new Apple versions arrive at any time, and while an updated Paid Apps agreement is pending, no new app or IAP can be created (P1, Apple's help; not re-fetched by me).
4. **Don't push an `ios-v*` tag before the `app-store` environment exists.** Verified: the `release-ios.yml` header (lines 12 to 18) says a run creates the environment unprotected if it is missing (SR-11), and its planned gate needs an approver account that CR-19 withdrew. The ledger says `app-store` has not been created. RELEASE.md plans RC tags from `release/1.0`. See RS-16.
5. **The cloud path has never run.** Verified (REST): `testflight.yml` has 14 runs, all `pull_request`, and none on `workflow_dispatch`. Whether EAS holds the ASC key for non-interactive submit is UNVERIFIED. Unless CR-47 R3 (REL-04) proves the cloud path first, build 2 means another Mac session.
6. **The freeze rule is written more strictly than the brief.** D-130 "Effects" and `AUTOMATION.md` 0.2 item 17 bar workflow changes during the freeze, not only `eas.json` and `app.config.ts`. #551 also holds `.github/**` to the freeze. So RS-14 and RS-16 to RS-19 are Wave 2.
7. **A personal-account Expo project id is on a public branch.** Verified: commit 2d632a7e on `origin/chore/expo-project-id` (#486, closed) carries a user-level project id that the ledger says must never enter the repo. It isn't a secret, but it is the same branch #493 reopened with the wrong id. Suggest: delete that branch with S-45 (whether a single-branch delete hits the "Git Destructive" wall is UNVERIFIED).
8. **Id collision ahead.** Open PR #551 (harness v2) plans to map its 31 HV2 items to BL ids from BL-563, which is the same id `next-id.mjs` printed as the next free one (it counts only ids already defined). So the RS rows are deliberately left without BL ids, to avoid colliding with #551, and the coordinator should assign both sets in one pass.
9. **Build 2 needs the founder very soon.** S-54 (purge worker and function secrets) has a Mon 2 Nov noon PT deadline (D-129, per ledger section 3), and S-50 gates the whole chain. The kit (RS-09) won't exist in time, so Karma should hand-prepare that sitting in the RS-03 shape and run RS-02's scripts for it if they land first.
10. **`keygen.mjs` still prints the secret** (`render()`, lines 56 and 57). Build 2 needs no new pack keys, but any rotation would repeat the 1 Nov loss until RS-02 lands.

---

## 6. What not to do

- **Don't get round a wall.** That means no stored passwords or session cookies, no relaying OTPs, no Claude sign-in to a second Google account, no Claude accepting terms or attesting, and no DNS-capable Cloudflare or Porkbun tokens in session reach. Prepare the click and verify afterwards.
- **Don't retry a wall after a chat approval, or offer to,** even when a previous one went through.
- **Don't verify a secret by reading a page or a value.** Check names, dates and behaviour. `release:ready` must never print a value, even redacted.
- **Don't write another hand-kept tracker** ("status", "pending", "readiness", a new numbered founder list). Old ids map into the registry.
- **Don't add a second pinned status issue.** Setup rows go into #551's TODAY issue.
- **Don't commit a generated state file to `develop` on a timer.** It means a PR per change and is stale between runs.
- **Don't use `BOARD.md` for setup-step claims,** and don't add a lock service or database. Issue numbers already give a total order.
- **Don't run a scheduled `eas build` as a credentials probe.** It burns free-plan build credits (15 a month per Expo's pricing page; UNVERIFIED, not re-fetched), bumps the build number and needs the gated token.
- **Don't give a scheduled job the `testflight` token or a write-capable key.**
- **Don't build an EAS GraphQL client to read credentials.** It is undocumented and would break silently.
- **Don't drop the founder as the `testflight` reviewer** before a real second gate exists (AF-21, HV2-B26), and don't revive the second-GitHub-account idea (CR-19).
- **Don't let tests assert what the founder has or hasn't done.**
- **Don't build a full App Store Connect setup bot** for once-per-app steps. Deep links plus a verifier give most of the saving.

---

## 7. Disagreements between panels, and my call

| Topic | Positions | My call |
|---|---|---|
| Where state lives | P1: a kit page per cycle (repo and Project). P2: `release-ready` command and issue. P3: `setup-state` command, registry and pinned issue. #551: a TODAY pinned issue | One registry (RS-05: P3's file with P1's fields), one command (RS-06: P2's and P3's merged, as `release:ready` with `--step`), one pinned issue (#551's TODAY, plus setup rows). The kit (RS-09) is a rendering for a sitting, not a status surface |
| When to use `testflight.yml` | P1: default only after 9 Nov. P2: patch it, then dispatch | Superseded by CR-47 R3 (REL-04), which owns proving the path; RS-01 is dropped. Hardening after 9 Nov stays RS-14 |
| Are workflows freeze-safe? | Brief: yes, with two reviews. P3: yes. P2: Karma's call | No. D-130 and AUTOMATION 0.2 item 17 say so in writing, and a founder decision outranks the brief. Proposals in `docs/ops/proposed/` are fine. If the founder wants workflows allowed, one line from him and Karma records it |
| Claims | P3: GitHub issues per setup step. #551: a CLAIMS.md file with globs | Both, with split scopes: CLAIMS.md for code paths, issues for steps that touch no file (the 22-s race needs something faster than a merged PR) |
| Who clicked the Apple agreement | P1: a session. P2: UNVERIFIED | A session (verified, session transcript) |
| Founder messages | P1: 33 visible. Coordinator: about 40 | 33 visible; the rest UNVERIFIED |
| `EXPO_TOKEN` round trips | P1 and P2: 7. P3: 5 | 7 founder messages in 27 min; 4 of them caused by our page-text read (P1's reading of session transcript) |
| Robot users need an Expo organisation | Ledger: fact. P1 and P2: not in the docs | Treat it as observed behaviour, UNVERIFIED in the docs |
| Size of the kit's saving | P1: 45 to 75 min | Lower, 30 to 60 (ESTIMATE), because RS-03, RS-04 and RS-06 take part of the same saving |

---

Sources: the three panel reports and their citations; `origin/develop` 01a07627 (`apps/mobile/eas.json`, `apps/mobile/package.json`, `.github/workflows/testflight.yml`, `.github/workflows/release-ios.yml`, `scripts/release/doctor.ts`, `scripts/founder/check.mjs`, `scripts/packs/keygen.mjs`, `docs/release/TESTFLIGHT.md`, `docs/release/FOUNDER_QUEUE.md`, `docs/release/AUTOMATION.md`, `docs/ops/WEBSITE_RUNBOOK.md`, `docs/ops/RELEASE.md`, `docs/DECISIONS.md` D-130, `docs/agents/cto/RULINGS.md` CR-19, CR-22, CR-41); `origin/main` (runbook line 19); GitHub REST (testflight runs, open PRs including #551); curl (ASC 401, Expo 405, pack manifest 200); `dns.google` (DMARC `.app`); session transcript; ledger `infra/setup-record.md`.

## Relation to the release-setup retrospective and CR-47

A second retrospective of the same day covers build-day mechanics. Its items are REL-01 to REL-13, and their open points were ruled in CR-47 (`docs/agents/cto/RULINGS.md` once recorded there). Where the two overlap, the REL item and CR-47 win:
- RS-01 is dropped in favour of CR-47 R3 (REL-04).
- RS-02 keeps only its scripts, and REL-07 owns the secret rules.
- RS-06 covers setup state only, and REL-03 consumes its JSON.
- `TESTFLIGHT.md` belongs to REL-10, so RS-10 fixes only the other docs.
- RS-05's registry is the source REL-08 renders.
- RS-15 is the same change as REL-06, so it is merged into REL-06.

BL ids are assigned in one pass with the harness v2 items (#551), to avoid a collision.
