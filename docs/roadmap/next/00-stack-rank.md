# Next: the stack rank (phase 3, file 00)

Status: draft for the "next set of requirements" programme, 8 Nov 2026. Docs only. It changes no decision, sets no price and merges nothing. It is a recommendation to the founder, built from `01` to `07` in this folder and `docs/release/BUILD12-GAP-MAP-2026-11-08.md` (the gap map). Disagreements and their tie-breaks are in `07-debate.md`; the lettered references (a) to (h) below point there.

## 0. Limits

1. **No usage or revenue data exists.** The ordering rests on judgment scores (`06-roi.md`), a compliance screen that is an engineering reading and not legal advice (`05`), and size bands that nobody has measured (`04`). It is an ordering aid, not a measurement.
2. **Dates are estimates.** They are the gap map's figures, which depend on the founder starting production steps on Mon 9 Nov and on counsel being engaged that day (whether counsel is engaged is NOT VERIFIED). Nothing here is a commitment.
3. **Not read:** the Project docs (including the QE bug-hunt note and the founder's alpha problem list beyond four named items). Code state is as the phase files report it. UNVERIFIED wherever they say so.
4. **No invented numbers.** A number is from a cited file, or says ASSUMPTION.

## 1. The rank at a glance

Tier 0 is a constraint lane: what must exist before any family outside the founder's own uses the public build. It is not scored against features (`06` section 3.3 item 3, recommendation 4; debate (a)). Agents work Tier 0 and Tier 1 in parallel on different paths; the founder's hours go Tier 0 first.

| Rank | Tier | Item | Size | Who can start | Requirement |
|---|---|---|---|---|---|
| 1 | 0 | Record the route; answer staging or production | S | Founder decision | `03-requirements/01` |
| 2 | 0 | Counsel gates: send the packet, get texts live | S to start, weeks to finish | Counsel needed | `03`, `05`, `08` |
| 3 | 0 | Key, session and https security PRs | S each | Agents now (founder reads #602) | `02` |
| 4 | 0 | Hosted backend: rehearsal, production, smoke | M | Founder hands | `01` |
| 5 | 0 | Sign in and session on production | M | Agents, after 4 for the proof | `02` |
| 6 | 0 | Adults only, agreement, age signal, country check | M | Agents; counsel gates the text | `03` |
| 7 | 0 | Delete account end to end; erase this phone | M | Agents, after 4 for the drill | `04` |
| 8 | 0 | Production backup, kill, rollback, restore drill | M | Agents plus founder hands | `01` |
| 9 | 0 | Reviewer sign-in, Notes for Review, store pack | M | Agents plus founder hands | `05` |
| 10 | 1 | Recording and Listen that behave; first run without fiddly steps | M | Agents now | `06` |
| 11 | 1 | Letters on every phone: two-phone proof | M to L | Founder hands (two phones) | `07` |
| 12 | 1 | Plus and billing trust | S to M | Agents; counsel and Apple gate | `08` |
| 13 | 1 | Support route: a person answers within a day | S | Founder hands | none written |
| 14 | 1 | Reminders that fit: proof, back-off, measure | S to M | Agents now | `10` |
| 15 | 2 | Names that learn; prompts v3 (English) | M | Agents now | `12` (names part) |
| 16 | 2 | Co-parent text proof (9a), Family tab hidden | S | Agents; two phones | `09` (9a) |
| 17 | 2 | Rating ask, store page and onboarding tests | S | Agents; founder hands in App Store Connect | none written |
| 18 | 2 | Catch-up: backdate letters, import voice memos | M | Agents; first check the code | none written |
| 19 | 2 | Family release: shared voice (9b) and relatives' hello | XL | Counsel and ADRs first | `09` (9b), `11` |
| 20 | 3 | Parked group (section 4) | n/a | Not started | `12` (languages) and others |

Why Tier 1 recording is at rank 10 and not 1: the founder asked for the server, accounts and security first, and the public build cannot be used by a family without Tier 0. It still starts in week 1 on the agent side, and it is the top customer need and the top ROI item (`01` rank 1; `06` rank 1; debate (a)).

## 2. The items

Each item gives: the reason in one line from the evidence, size, who can start, the requirement file, the gate, and the first PR to open. "First PR" is a proposal for the coordinator and `product`; ids are not assigned here (`00-index.md` of the requirements says `next-id.mjs` showed BL-740, D-144 and ADR 0028 free on 8 Nov, and I reserved none).

### Tier 0: before any family uses the public build

**1. Record the route; answer staging or production.**
- Reason: the public route with build 12 on production servers reverses D-121 item 1, and `eas.json` `production` still writes servers `off` (gap map section 0). The final staging confirmation is unanswered (debate (b)).
- Size S. Who: founder decision. Requirement: `01`. Gate: founder.
- First PR: a `docs/DECISIONS.md` entry recording the route, the staging answer and the rehearsal (the file is outside this PR's fence; the coordinator opens it). Recommended default: production directly plus one throwaway rehearsal.

**2. Counsel gates: send the packet, get texts live.**
- Reason: the public path runs through counsel. Priority-A questions Q44 (real families under draft texts), Q43, Q48, Q41, Q53 and Q54 gate the texts; Q46, Q47 and Q57 gate the age signal, publisher and country check (gap map 3.2, 4C; `05` section 6). Counsel comments about three weeks and sign-off up to six more are D-121 assumptions.
- Size S to start, calendar weeks to finish. Who: counsel needed, founder coordination (ASSUMPTION: heavy load is about 15 founder-hours, from `06` 1.2; no counsel quote exists).
- Requirement: `03`, `05`, `08` and `05-compliance-risk.md` section 6. Gate: counsel.
- First PR: none from agents. Agents prepare the packet additions (`05` section 6, 11 items) in a docs PR for the founder to send; app policy 0.9.0 PRs #616 and #652 are the first texts.

**3. Key, session and https security PRs.**
- Reason: #602 gates the switch from legacy keys (CR-47); #657, #632 and #633 are small and have no dependencies. WSJF rank 2 (`06` T05); `04` R3 priority B.
- Size S each. Who: agents now; the founder reads #602 or a counted second review (credentials code). Requirement: `02`. Gate: CR-47, the founder's read.
- First PR: #602 as it stands, then #657, #632, #633 and #617 (global error handler).

**4. Hosted backend: rehearsal, production, smoke.**
- Reason: no hosted project exists as far as the repo shows (S-50 to S-54 FAIL); the 32 access-test files have never run on hosted; R-17 has never been run (gap map sections 0, 2, 5).
- Size M agent work, about 7 founder hours of dashboard steps (gap map 3.3, citing `TESTFLIGHT.md` line 139). Who: founder hands. Requirement: `01`. Gate: founder (project, plan, tag approvals).
- First PR: the consent and audit chain in the order #655 sets (#634, #636, #637, each `approve-migration`), then #656 (per-project migrations record), then a hosted smoke script adapted from `docs/ops/runbooks/staging-smoke.md`.

**5. Sign in and session on production.**
- Reason: every account feature stands on it. Sign in with Apple and email link code is merged and never run on a phone; Google stays out (debate (h)).
- Size M. Who: agents; the proof needs 4. Requirement: `02`. Gate: founder (Apple key, Resend SMTP, code length 6), Apple guideline 4.8.
- First PR: the production profile flip with its equality test and doctor row, on or after Tue 10 Nov (the `eas.json` freeze ends at the go/no-go, D-124 item 1).

**6. Adults only, agreement, age signal, country check.**
- Reason: must be live before anyone outside the family signs in. Texas is in force for new Texas accounts (Apple news, `05` S2) and California AB 1043 starts 1 Jan 2027 (secondary source, `05` S6, UNVERIFIED); neither age signal nor country check is built (gap map 1.3).
- Size M. Who: agents, split #635 first (851 added lines over 27 files, over CODE-R02). Requirement: `03`. Gate: counsel Q46, Q48, Q57; the founder's CCO line on #635.
- First PR: #635 split into reviewable parts, then the Declared Age Range request (iOS 26 family SDK; no signal on iOS 18 or earlier, `05` S3).

**7. Delete account end to end; erase this phone.**
- Reason: Apple 5.1.1(v); `production` already writes account deletion `on` while the purge worker has no hosted deployment and the sole-parent drill never ran (gap map 1.7).
- Size M. Who: agents; the drill needs 4. Requirement: `04`. Gate: Apple 5.1.1(v), founder CCO line on #520, counsel for the deletion sentence.
- First PR: #520 (erase this phone) after the CCO line; then the `/delete-account` page (404 on 8 Nov) and the S1-35 and S2-13 drill record. Do not ship the deletion row until the drill passes on the throwaway project.

**8. Production backup, kill, rollback, restore drill.**
- Reason: nothing documented backs up production; no restore has run (DL-03 "not run"); a public build cannot be expired like a TestFlight build (gap map section 5).
- Size M. Who: agents write; founder decides the plan (Pro with point-in-time recovery, cost UNVERIFIED). Requirement: `01` (NX-01-R5, R6). Gate: founder, D-138 item 2.
- First PR: the production variant of #622 (dump workflow) and the kill, rollback and restore runbook, plus a timed restore drill record.

**9. Reviewer sign-in, Notes for Review, store pack.**
- Reason: Apple 2.1(a) needs demo account info, and passwordless sign-in has no designed path; Notes for Review and `reviewNotes` still describe the on-device app (gap map 1.1, 1.12).
- Size M. Who: agents write; founder enters App Store Connect values (age rating, privacy answers, trader answer, availability). Requirement: `05`. Gate: Apple 2.1(a), 2.3.1(a), 2.5.19, 5.1.1(i), 5.1.1(ix); counsel Q54, Q47.
- First PR: Notes for Review and listing rewritten for servers on with every dormant flag named, then `/support`, `/subscription-terms` pages (counsel text) and the privacy label worksheet RA-17-01 (see the photos check in debate (g)).

### Tier 1: the happy path made solid

**10. Recording and Listen that behave; first run without fiddly steps.**
- Reason: customer rank 1 and 2; ROI rank 1 (94.2) and rank 6; 41 of 104 negative or mixed reviews in the category are bugs or lost work (`01` rank 1; `06`). The local database migration flake (#533, `04` R6) must be fixed before any new local migration.
- Size M. Who: agents now. Requirement: `06`. Gate: none external; founder runs the SE 3 rows.
- First PR: pick one of #615 or #618 (the one whose test fails on `develop`), then #617, then the phone-full line and the download-size choice. Start the device evidence files under `docs/qa/evidence/` (R1).

**11. Letters on every phone: two-phone proof.**
- Reason: sync is built and unproven; the founder's hard constraint is two-phone proof; B2-11 kill harness 500 of 500 never waived (gap map 1.5; `04` R12).
- Size M to L. Who: founder hands (two phones on two Apple Accounts, the SE 3). Requirement: `07`. Gate: founder; counsel Q42 only if backup is turned on.
- First PR: the evidence-file template filled for S1-22, S1-28, B2-4 and DL-03 (agents prepare; founder runs).

**12. Plus and billing trust.**
- Reason: paywall fear is the loudest review theme (10 of 10 reviews about a new paywall on old features are negative, `01` rank 5); products on the production record and the sandbox decision S-35 are open (gap map 1.8). Prices come only from `pricing.ts` (debate (d)).
- Size S to M. Who: agents; founder creates products; counsel and Apple gate. Requirement: `08`. Gate: Apple 2.1(b), 3.1.1, 3.1.2; counsel Q41 and the ten `COUNSEL_LOCKED` strings.
- First PR: the billing trust charter and plain Plus page copy from `pricing.ts`; replace the alpha ceiling (#552, BL-604) with the decided gate for the production profile.

**13. Support route: a person answers within a day.**
- Reason: ROI rank 4 (54.1); category reviews name unreachable support (`01` rank 14, `06` T36). The support URL is the home page and `/support` is 404 (gap map 1.11).
- Size S. Who: founder hands (about 3 hours, `06` table 2B). Requirement: none written (`01` opportunity 24 only). Gate: none external.
- First PR: write the requirement first; then the `/support` page, shared with rank 9.

**14. Reminders that fit: proof, back-off, measure.**
- Reason: ROI rank 2 (66.5) but on thin evidence (HYPOTHESIS); local reminders are built (#624, #483); the real first step is the measurement, not a build (`06` section 3.3 item 6).
- Size S to M. Who: agents now (proof rows); the numbers need alpha use. Requirement: `10`. Gate: Apple 4.5.4 (no sensitive content); decide BL-534 (1.0 or 1.0.1).
- First PR: the cross-season no-repeat selection test (NX-10-R2) and the SE 3 reminder device row.

### Tier 2: growth and delight

**15. Names that learn; prompts v3 (English).**
- Reason: ROI rank 3 (62.0), top ten in 97% of draws, but HYPOTHESIS-grade (`01` rank 7: zero reviews about language); names stored near a log path is the pre-mortem (`04` item 6).
- Size M. Who: agents now. Requirement: `12` (names part only). Gate: none external.
- First PR: repeat suppression across seasons, with the content-rules test.

**16. Co-parent text proof (9a); Family tab stays hidden.**
- Reason: code merged, never run on two phones; `01` rank 8; hidden in the first public release by default (debate (h)).
- Size S. Who: agents; founder two-phone sessions. Requirement: `09` (9a). Gate: counsel Q53, Q50.
- First PR: access-matrix rows allow and deny for the contributor role, plus S1-22 and S1-28 evidence.

**17. Rating ask, store page and onboarding tests.**
- Reason: business ROI 42.2 per ten founder-hours on low cost (`06` T33), top ten in 56% of draws; needs `expo-store-review`, a native change (batch with the other native changes, debate (e)).
- Size S. Who: agents; founder in App Store Connect. Requirement: none written. Gate: none external.
- First PR: write the requirement; screenshots from a release build (BL-340) first.

**18. Catch-up: backdate letters, import voice memos.**
- Reason: ROI rank 10 (25.8); customer rank 6; whether backdating is built "was not checked" (`01` rank 6), so the first step is to read the code (`06` section 2).
- Size M. Who: agents. Requirement: none written. Gate: counsel on others' voices for import (`05` section 3 item 3 note, `04` item 3 pre-mortem).
- First PR: a short code-read note, then the requirement.

**19. Family release: shared voice (9b) and relatives' hello.**
- Reason: the highest absolute value and referral scores, XL cost, go slow, riskiest surface (`06` 3.3 item 2; `05` sections 3.1, 3.2). Needs AD-1 and AD-2 written as ADRs and threat models first.
- Size XL each (about 14 PRs for 9b, 14 for the web page, `04`). Who: counsel and ADRs first; no build now. Requirement: `09` (9b), `11`. Gate: counsel (key custody, worldwide reach, a relative's notice), pen test before the page is public.
- First PR: the AD-1 and AD-2 ADRs (docs only), then the security-architect threat model.

### Tier 3: parked (not started, not ranked)

**20. Parked group.** Each stays parked until its trigger.

| Parked | Why | Trigger to reopen |
|---|---|---|
| Android | Stop: entity, web deletion, Play billing (`05` 3.4) | G-21's four gates; study G6 on mixed-platform couples |
| Printed books with fulfilment | Stop: entity, vendor, Print Terms (`05` 3.3) | June 2027 go/no-go. A print-ready file is allowed now; promote it if keepsake demand shows (Mother's Day 9 May 2027) |
| Shareable web reader | Stop: bearer link to a child's data (`05` 3.13) | Web contribution page live, authenticated owner-only reader first |
| Video with letters | Stop: others' voices, faces, size (`05` 3.8) | Counsel on voice and faces |
| Photo with a letter | Go slow; also settle the label question (debate (g)) | After Tier 0 and a closed or tested bucket policy |
| Non-US storefronts | Stop: needs a per-market programme | A founder decision in `DECISIONS.md` |
| More spoken languages; Hindi and English in one letter | Gated by native reviewers (D-121); build 12 is English only | Each pack when its reviewers sign; FB-02 harness first |
| Quick capture from the lock screen | L, native, kill-safety proof; ROI rank 16 | Alpha shows capture friction (`01` rank 12) |
| Gifting, offer codes, lifetime | Decide the stance; no lifetime at 1.0 (debate (d)) | After the App Store Connect funnel |
| Search, sealed letters, year page, Vault, Watch, server transcription | Low evidence or blocked by a person | Re-rank after alpha |

## 3. Ready to hand out: the checklist per item

"Ready" means an agent can be handed the item and a reviewer can tell when it is done. Columns: requirements written; acceptance rows with a test that fails on old code (each requirement file has a "fails on old code because" column; I spot-read `01` and `10` and read the others at header level, so individual rows are UNVERIFIED); device row; copy keys; analytics event (allowlisted means present in `packages/analytics/src/catalog.ts`, checked 8 Nov; all analytics are off in every build profile, D-124); gate cleared.

| # | Requirements | Acceptance fails on old code | Device row | Copy keys | Analytics event | Gate cleared |
|---|---|---|---|---|---|---|
| 1 | `01` yes | n/a (decision entry) | n/a | n/a | n/a | No, founder |
| 2 | Part (`03`, `05`, `08`, packet) | n/a (counsel answers) | n/a | n/a | n/a | No, counsel |
| 3 | `02` yes | Per PR; PR bodies not read (UNVERIFIED) | S1-27; new "force sign-out with 3 unsent letters" | `authCopy.account.*` named | `forced_sign_out` new, not allowlisted | No, founder read of #602 |
| 4 | `01` yes | Yes (7 rows) | DL-03, B2-11; new "kill switch off, then record, keep, read, export" | none for parents | None new | No, founder |
| 5 | `02` yes | Yes (10 rows) | S1-06, S1-08 (S1-07 only if Google in) | `authCopy.*` named | Existing, allowlisted | No, founder and Apple 4.8 |
| 6 | `03` yes | Yes (8 rows) | S1-03; 3 new rows | `consentCopy.*` named; counsel for registered strings | `age_step_result`, `age_signal_result` new, not allowlisted | No, counsel |
| 7 | `04` yes | Yes (7 rows) | S1-35, S2-13, AL-07.6a, DL-05 | `accountDeletionCopy.*` named | `phone_erase_result` new, not allowlisted | No, CCO line, counsel sentence |
| 8 | `01` (R5, R6) | Yes | DL-03; restore drill | none | None | No, founder plan decision |
| 9 | `05` yes | Yes (9 rows) | S1-08; new "fresh phone, Notes only, reach a signed-in book" | `store.reviewNotes.*`, `pages.*` named | None | No, Apple and counsel |
| 10 | `06` yes | Yes (9 rows) | S1-39, S1-13, DL-01, DL-02, B2-11; 2 new | `listen.phoneFull.*`, `speech.download.*` named | `phone_full_shown`, `download_choice` new, not allowlisted | Yes (no external gate) |
| 11 | `07` yes | Yes (8 rows) | B2-4, S1-22, S1-28, DL-03, AL-06 | `sync.*` named | Existing, allowlisted | No, founder |
| 12 | `08` yes | Yes (8 rows) | AL-09; 1 new | `billingCopy.*` named; counsel owns registered | Existing, allowlisted | No, counsel and Apple |
| 13 | No | No | No | No | No | n/a |
| 14 | `10` yes | Partly (NX-10-R5 passes on old code, R1 is a device run) | 2 new rows | `reminderCopy.*` named | Existing, allowlisted | Yes for local reminders |
| 15 | `12` (names part) | Yes | FB-02 only for languages | `languageCopy.names.remembered` | `dictionary_term_added` existing | Yes (no external gate) |
| 16 | `09` (9a) | Partly (code merged, proof missing) | S1-22, S1-28 | `familyCopy.*` named | Existing, allowlisted | No, counsel |
| 17 | No | No | No | No | No | n/a |
| 18 | No | No | No | No | No | n/a |
| 19 | `09` (9b), `11` | Yes (6 and 7 rows) | New rows named | `familyCopy.*`, `site.relative.*` named | `shared_voice_played`, `relative_hello_reviewed` new, not allowlisted | No, counsel, ADRs, pen test |
| 20 | Parked | n/a | n/a | n/a | n/a | n/a |

Rows 13, 17 and 18 need a requirement written before they can be handed out. Rows 10, 14 (local) and 15 can be handed out today.

## 4. The critical path

Estimates only, from the gap map section 3.3, which rests on the founder's hours at `TESTFLIGHT.md` line 139 and on D-121's assumptions for counsel and soak durations. Counsel being engaged on Mon 9 Nov is NOT VERIFIED.

**To build 12 (internal Family group, production backend):** decision entry (rank 1) Mon 9 Nov, then production Supabase, auth, Resend, Apple key, EAS variables and the `db-v` tag (rank 4) Wed 11 Nov to Fri 13 Nov, with the security PRs and production flip merged (ranks 3 and 5) on the same dates. Build 12 in TestFlight: earliest Fri 13 Nov, realistic Fri 20 Nov. Real-phone rows (rank 11): Mon 16 Nov to Fri 27 Nov. Adding the throwaway rehearsal (B in debate (b)) adds about a day (gap map). Option A (staging first) adds an ASSUMPTION of a few days to a week.

**To widening and a public submission:**
- External group "Friends" (Beta App Review): earliest Tue 17 Nov, realistic Mon 30 Nov; needs policy 0.9.0 live at a permanent URL, the R-17 checklist signed, Q44 answered and the demo account path (ranks 2, 4, 9).
- Counsel comments: about Mon 30 Nov to mid-Dec; sign-off about Mon 4 Jan 2027 to late Jan.
- 14-day soak and 21-day first-families run: about Fri 4 Dec to late Dec.
- **Public submission: earliest Mon 4 Jan 2027, which the CTO put at 10 to 15 percent (D-121 as cited in the gap map); realistic mid-Feb to Mar 2027.** California AB 1043 starts 1 Jan 2027, before the earliest submission, so the age signal (rank 6) is on the critical path for the public release, subject to counsel (Q46).
- Apple's turnaround and rejection cycles: UNVERIFIED. 5.1.1(ix) (individual publisher) is the likeliest rejection (gap map 3.3).

## 5. Founder decisions

All are recommendations. Deadlines are mine unless a source is cited (ASSUMPTION where marked).

| # | Decision | Recommended default | Deadline | What it unblocks |
|---|---|---|---|---|
| 1 | Record that build 12 reverses D-121 item 1 | Yes | Mon 9 Nov | Production flip PR; hosted bring-up |
| 2 | Staging first, or production directly (final confirmation) | Production directly plus one throwaway rehearsal; stand up staging before the first later migration | Mon 9 Nov, before the project is created | Rank 4 |
| 3 | Counsel engagement and scope (Q41, Q43, Q44, Q46, Q47, Q48, Q53, Q54, Q57) | Engage and send priority-A questions | Mon 9 Nov (the gap map's assumption) | Ranks 2, 6, 9, 12 |
| 4 | Supabase plan for production | Pro with point-in-time recovery; read Supabase's pricing page first (cost UNVERIFIED) | Before the project is created | Ranks 4, 8 |
| 5 | Who may sign in to build 12 | Family only until Q44 is answered and 0.9.0 is live | Fri 13 Nov | Rank 4 and the external group |
| 6 | Google sign-in out of build 12; code length 6 | Out; keep 6 | Wed 11 Nov, before the auth setup | Rank 5 |
| 7 | Reviewer sign-in method | A review mailbox on the founder's domain that he opens for Apple | Fri 13 Nov (ASSUMPTION, before the first external group) | Rank 9 |
| 8 | Co-parent in the first public release | Hidden; on in 1.0.1 behind the existing switch | Fri 13 Nov (ASSUMPTION) | Ranks 5, 9, 16 |
| 9 | CCO lines for #635 and #520 | Give them after #635 is split | Before build 12 is cut (ASSUMPTION) | Ranks 6, 7 |
| 10 | Confirm Plus prices from `pricing.ts`; the free-letters rule; no lifetime at 1.0; no price test | Confirm $4.99 and $49.99, first 2 free, as D-082 and D-083 | Before the production products are made in App Store Connect (ASSUMPTION: Fri 20 Nov) | Rank 12 |
| 11 | Analytics for build 12 and the first submission | Stays off (D-124); revisit in a 1.0.x after Q54 | Before the release-candidate freeze | Section 6 measures |
| 12 | Update channel (AD-3) | Server-driven only; decide a disabled `expo-updates` with security-architect | Before the first build that goes to App Review (my inference, see debate (e)) | The single planned native build |
| 13 | Feedback: D-088 install id, or account link | D-088 stands | Before counsel signs the feedback text (not in build 12) | The feedback form |
| 14 | Photos label answer | "No" only after a client-reference test and a bucket policy check; else disclose | Before the label is entered in App Store Connect | Rank 9 |
| 15 | Small Business Program and the commission pages | Read both Apple pages himself; approval is Apple's | When Apple answers (S-31 pending) | Unit economics (`06` 5.3) |
| 16 | Individual publisher risk (5.1.1(ix)) | Keep D-134; ask Q47 before submission | Before submission | Rank 9 |
| 17 | Guest identity for the web (AD-1) | Scoped write-only token, after release | Not before the public release | Rank 19 |

## 6. What to measure from the alpha before re-ranking

The alpha is a family group on TestFlight, so every read is friendly and small. It cannot answer the Plus funnel (limits are off, #552; purchases are sandbox). Source: `06` section 6, which has the full table. In order of what exists now:

1. **Founder cost per PR and per device session (M9).** Available today. Sample 20 merged PRs by path class (fenced or not) and log device-session hours. It decides the cost side of the whole ordering. Re-run the ROI model if a fenced PR takes more than about twice the assumed 45 minutes, or a device session more than about twice 3 hours (`06` section 7 item 1).
2. **Reliability (M2).** Crash reports in App Store Connect and TestFlight, kill-harness counts, and a manual log of Listen, recording, date picker, consent link and download-wait reports with the build number.
3. **First-run friction (M1).** The first-run study with 5 to 8 strangers (`01` G1). Device events are off.
4. **Reminders (M5).** Three questions in tester notes: helped, muted, ignored.
5. **After build 12 is in Family hands:** server aggregates for signed-in families (M4 weekly keeping families, letters per active family) and cost to serve (M8, Supabase usage per family).
6. **Not measurable yet:** the Plus funnel (M3, M7) until a public release; use the gate comprehension study (`01` G7) in the meantime.

Re-rank when: the 14-day soak of build 12 ends (about Fri 4 Dec at the earliest, an estimate); counsel answers Q44, Q46, Q54 or Q57; the first-run study reports; or Apple answers the Small Business Program (`06` section 7). Two missing events (a playback failure code and a bounded first-run summary) are requests to the analytics owner, not built here.
