# Next: the ranked backlog for the founder to confirm (phase 3, file 08)

Status: DRAFT for founder confirmation
Date: Sun 8 Nov 2026 (UTC)
Written by: Product Manager (Claude role). Docs only. It changes no decision, sets no price, assigns no id, merges nothing and dispatches nothing.

Built from `00-stack-rank.md`, `03-requirements/*`, `04-feasibility.md`, `05-compliance-risk.md`, `06-roi.md`, `07-debate.md` in this folder; `docs/release/BUILD12-GAP-MAP-2026-11-08.md` (branch `docs/build12-gap-map-8nov`); `docs/backlog/READINESS-2026-11-08.md` and the F17 Feedback spec (PR #638, branch `docs/prd-v2-readiness-8nov`); `agents/roster.json` and `.claude/agents/`.

## 0. Founder facts held

- Public App Store release, with full App Review.
- Build 12 runs on production servers. Staging first, or production directly, is still to be confirmed by him (decision F2 below).
- English-only alpha now.
- Analytics: the default was off (D-124 as cited in `00`); he now wants analytics, and free. The plan is in progress (item 15).
- Internal alerts and reports go to earlyletters@gmail.com (item 17).
- Ids come only from `node scripts/agents/next-id.mjs`. It printed BL-740, D-144, ADR 0028 on 8 Nov. Nothing below is assigned: where a row has no id it says "id: to be assigned". BL-621, D-139, D-141, D-142 clash and are not reused (BL-729 to BL-738 are reserved by the readiness file in PR #638, cited as it states them).

## 1. Founder decisions still open, and what each blocks

Ranks refer to the table in section 2. "Default" is my recommendation, not a decision.

| Id | Decision | Recommended default | Blocks ranks |
|---|---|---|---|
| F1 | Record that build 12 reverses D-121 item 1 (servers on) | Yes | 1, 5, 6, 8, 9, 11 |
| F2 | Staging first, or production directly (final confirmation) | Production directly plus one throwaway rehearsal; staging before the first later migration | 5, 9 |
| F3 | Counsel engaged, scope Q41, Q43, Q44, Q46, Q47, Q48, Q53, Q54, Q57 | Engage Mon 9 Nov and send priority A | 2, 7, 10, 14, 15, 21 |
| F4 | Supabase plan for production | Pro with point-in-time recovery; read Supabase's pricing page first (cost UNVERIFIED) | 5, 9 |
| F5 | Who may sign in to build 12 | Family only until Q44 is answered and policy 0.9.0 is live | 5, 10 |
| F6 | Google sign-in out of build 12; code length 6 | Out; keep 6 | 6 |
| F7 | Reviewer sign-in method | A review mailbox on his domain that he opens for Apple | 10 |
| F8 | Co-parent in the first public release | Hidden; on in 1.0.1 | 6, 10, 23 |
| F9 | CCO lines for #635 and #520 | Give after #635 is split | 7, 8 |
| F10 | Confirm Plus prices from `pricing.ts`, free-letters rule, no lifetime at 1.0 | $4.99 and $49.99, first 2 free (D-082, D-083) | 14 |
| F11 | Analytics on for build 12: how, with what consent | Free first-party sink, opt-in, content-free allowlisted events only; supersedes the D-124 off default, needs a decision entry and counsel on the label (Q54) | 15 and the alpha measures in `00` section 6 |
| F12 | Update channel (AD-3) | Server-driven only | 10, 24 |
| F13 | Feedback decision entry words (the Feedback entry in PR #638 is drafted, his words not pasted); D-140 (#576) words | He pastes, or says he gave none | 21 |
| F14 | Photos label answer | "No" only after a client-reference test and a bucket policy check | 10 |
| F15 | Individual publisher risk (5.1.1(ix)) | Keep D-134; ask Q47 before submission | 10 |
| F16 | Where internal alerts go and what they hold | earlyletters@gmail.com, no letter text, names or audio (privacy rule) | 17 |
| F17 | Merge order and renumbers (#599 first, #587 renumbers; the #591 D-entry takes the next free number) | As the readiness file section 1 says | 4 and every row that cites a clashing id |

Open items I cannot settle: whether counsel is engaged at all, and whether any hosted project exists (both NOT VERIFIED).

## 2. The ranked backlog (one table, strict order)

Column key. Team uses roster handles grouped by lane: develop (mobile, sync, data-architect, payments, analytics, speech), test (qa, red-team, user-research), review (principal-architect, security-architect, compliance-engineer, data-steward, ai-eng-lead), release (ops), security (security), privacy (privacy), content (content, legal, regulatory-affairs), design (design-systems), plus product and chief-of-staff. Web work goes to ops (no `web` handle in the roster, per the readiness file). Size is the estimate in `00` or `04`; no figure was measured. "Fails on old code" names the test; "per NX rows" means the requirement file lists rows with a "fails on old code" column that I read at header level only (UNVERIFIED row by row). Analytics: "allowlisted" means present in `packages/analytics/src/catalog.ts` on 8 Nov per `00` section 3; all analytics are off in every build profile today (D-124).

| Rank | Item | Tier | Customer outcome | Requirement | PR or BL | Size | Develops | Tests | Reviews | Releases | Gate | Fails on old code | Device row | Analytics event | Ready | Missing |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Record the route; answer staging or production | 0 | Your letters are kept on a server that was planned, not guessed | `03-requirements/01` NX-01 | none yet; id: to be assigned (D-entry, next free after D-144 check) | S | product drafts | n/a | founder | n/a | founder | n/a | n/a | n/a | No | F1, F2 |
| 2 | Counsel gates: send the packet, get texts live | 0 | The words you agree to were read by a lawyer | `03`, `05`, `08`; `05` section 6 | #616, #652 (policy 0.9.0 texts) | S to start, weeks | legal, regulatory-affairs | n/a | compliance-engineer | n/a | counsel | n/a | n/a | n/a | No | F3; counsel not confirmed engaged |
| 3 | Key, session and https security PRs | 0 | Your session is safe and signs out when it should | `02` | #602 (BL-594), #657, #632, #633 (BL-597, 599, 600) | S each | mobile, security | qa | security-architect, founder reads #602 | ops | founder (CR-47) | per PR; S1-27 | S1-27; new: force sign-out with 3 unsent letters | `forced_sign_out` new, not allowlisted | Partly | Founder read of #602; PR bodies not read |
| 4 | Numbering clean-up: D, CR, S1-39 clashes and merge order | 0 | Nothing for you; the team stops tripping on duplicate ids | readiness file sections 1 and 4 | BL-737 (as reserved in #638) | XS | product | qa | ai-eng-lead | none | none | `node scripts/agents/id-collisions.mjs` prints no COLLISION line | n/a | n/a | Yes | F17 (merge order) |
| 5 | Hosted backend: consent and audit chain, rehearsal, production, smoke | 0 | Your letters sit on a real server, and it was tested first | `01` NX-01 | #634, #636, #637, #655, #656; smoke: none yet | M plus about 7 founder hours | data-architect, ops | qa | data-steward, principal-architect | ops | founder (project, plan, `db-v` tag, approve-migration) | 7 rows in `01` | DL-03, B2-11; new: kill switch off, then record, keep, read, export | None new | No | F1, F2, F4; founder hands |
| 6 | Sign in and session on production | 0 | You sign in with Apple or an email code and stay signed in | `02` | none yet (profile flip PR, on or after Tue 10 Nov) | M | mobile, security | qa | security-architect | ops | founder (Apple key, Resend SMTP), Apple 4.8 | 10 rows in `02` | S1-06, S1-08 | existing, allowlisted | No | Item 5 for the proof; F1, F6, F8 |
| 7 | Adults only, agreement, age signal, country check | 0 | Only adults sign up, and you see the agreement plainly | `03` | #635 (851 lines, split first) | M | mobile, privacy | qa | compliance-engineer, founder CCO line | ops | counsel (Q46, Q48, Q57), founder CCO line | 8 rows in `03` | S1-03; 3 new | `age_step_result`, `age_signal_result` new, not allowlisted | No | Split of #635; F3, F9 |
| 8 | Delete account end to end; erase this phone | 0 | You can delete your account and your phone copy, and it works | `04` | #520 (BL-640 in #599) | M | mobile, sync | qa | privacy, data-steward | ops | Apple 5.1.1(v), counsel sentence, founder CCO line | 7 rows in `04` | S1-35, S2-13, AL-07.6a, DL-05 | `phone_erase_result` new, not allowlisted | No | Item 5 for the drill; F9; `/delete-account` page is 404 |
| 9 | Production backup, kill, rollback, restore drill | 0 | If something breaks, your letters can come back | `01` NX-01-R5, R6 | #622 (staging only; production variant none yet) | M | ops | qa | principal-architect | ops | founder (plan), D-138 item 2 | per NX rows | DL-03; restore drill | none | No | F2, F4 |
| 10 | Reviewer sign-in, Notes for Review, store pack | 0 | Apple can open the app and approve it | `05` | none yet (BL-341); `/support`, `/subscription-terms` pages none yet | M | content, ops | qa | compliance-engineer | ops | Apple 2.1(a), 2.3.1(a), 5.1.1(i); counsel Q54, Q47 | 9 rows in `05` | S1-08; new: fresh phone, Notes only | none | No | F5, F7, F12, F14, F15; counsel text |
| 11 | Founder-hands setup: auth email, DMARC, CAA, EAS production variables, Friends group, App Store Connect record | 0 | Sign-in emails arrive and testers can join | gap map 4D (ranks 20, 34, 35, 37, 39) | none yet; id: to be assigned | S (30 min to 3 h each) | founder hands, ops writes checklist | n/a | ops | ops | founder | n/a | n/a | n/a | No | Item 5; F4 |
| 12 | Recording and Listen that behave; first run without fiddly steps; phone-is-full screen | 1 | Your recording is never lost, and a full phone says so and keeps it | `06` | #615 or #618 (pick one), #617, #619; BL-734 (as reserved in #638) | M | mobile, content (words), design-systems | qa | red-team | ops | none external | `[BL-563]` out-of-space test; 9 rows in `06` | S1-39, S1-13, DL-01, DL-02, B2-11; 2 new | `phone_full_shown`, `download_choice` new, not allowlisted | Yes | Pick #615 or #618; words for BL-734; fix the #533 local database flake before any new local migration |
| 13 | Letters on every phone: two-phone proof | 1 | A letter you record shows on your other phone | `07` | none yet (evidence files) | M to L | qa prepares, sync | qa | principal-architect | ops | founder (two phones) | 8 rows in `07` | B2-4, S1-22, S1-28, DL-03, AL-06 | existing, allowlisted | No | Items 5, 6; founder two phones |
| 14 | Plus and billing trust; alpha allowance test | 1 | You see the price plainly and nothing is taken away | `08` | BL-736 (as reserved in #638), BL-604 and BL-605 (#591); billing charter none yet | S to M | payments, content | qa | compliance-engineer | ops | counsel Q41 and 10 locked strings, Apple 2.1(b), 3.1.1, 3.1.2 | `[PL-1]` letters 1 to 100 free, letter 101 meets the Keep sheet; 8 rows in `08` | AL-09; 1 new | existing, allowlisted | Partly | BL-736 ready; rest needs F10 and counsel |
| 15 | Free analytics (first-party sink) | 1 | We learn what helps you without selling or reading your words | none written; plan in progress | order to be set; branch `feat/analytics-free-sink` exists in a working copy but is not on the remote; id: to be assigned | not sized | analytics, data-architect | qa | privacy, security-architect | ops | founder decision F11, counsel Q54 (privacy label) | not yet defined | none | the allowlist `packages/analytics/src/catalog.ts` governs; new events not allowlisted until added | No | `docs/analytics/FREE-ANALYTICS-PLAN-2026-11-08.md` does not exist on any branch I could read; F11 |
| 16 | Support route: a person answers within a day | 1 | You can reach a person, and they answer | none written (`01` opportunity 24) | none yet; id: to be assigned | S | support, ops | n/a | product | ops | none | n/a | n/a | n/a | No | Requirement; shares the `/support` page with rank 10; about 3 founder hours |
| 17 | Internal alerts and reports to earlyletters@gmail.com | 1 | The team hears about a problem before you do | none written | none yet; id: to be assigned | S | ops | qa | privacy | ops | none | not yet defined | n/a | n/a | No | Requirement; F16; nothing with letter text, names or audio |
| 18 | Reminders that fit: proof, back-off, measure | 1 | A reminder helps and then steps back | `10` | #624, #483 (built); BL-534 decision | S to M | mobile | qa | principal-architect | ops | Apple 4.5.4; decide BL-534 (1.0 or 1.0.1) | NX-10-R2 cross-season no-repeat test; R5 passes on old code | 2 new | existing, allowlisted | Yes (local) | Numbers need alpha use; D-130 call |
| 19 | Build 1 audit follow-ups, un-deferred on 9 Nov | 1 | The known rough edges from the first builds are smoothed | per row (37 rows) | BL-567 to BL-603; BL-551 to BL-562 | S to M each | mobile, data-architect, security, ops | qa | per row | ops | counsel on BL-573, BL-575, BL-580 | none named on most rows (one line each when picked up) | BL-566, BL-587 to BL-593 need a device operator | per row | Partly | Un-defer on 9 Nov; test line per row |
| 20 | The 1 Dec block in #599 (store-build P0 and P1 rows) | 1 | The first store build has what Apple and families expect | per row (106 items; 30 ready by their own status) | #599 | S to M each | per row | qa | per row | ops | per row | 8 ready rows name no test | per row | per row | Partly | `Satisfies:` lines on 96 rows; must merge by Fri 20 Nov or move to 1.0.1 |
| 21 | In-app Feedback (5 tasks) | 2 | You can tell us what went wrong in two taps | F17-REQ-084 to F17-REQ-094 (F17 spec) | BL-729 to BL-733 (as reserved in #638) | L, split into 5 | data-architect, mobile, content, ops | qa | privacy, security | ops | counsel (3 lists, deletion sentence, label), founder clicks | tests named in the BL-729 to BL-731 rows | VoiceOver and AX5; airplane mode | none (content-free report id only) | Partly | BL-729 migration label; F13; build 2 scope only |
| 22 | Names that learn; prompts v3 (English) | 2 | The app spells your family's names right | `12` (names part) | none yet | M | mobile, content | qa | privacy | ops | none external | repeat suppression across seasons, with the content-rules test | FB-02 for languages only | `dictionary_term_added` existing | Yes | Names near a log path is the pre-mortem risk |
| 23 | Co-parent text proof (9a); Family tab hidden | 2 | Your partner can add a letter, proven on two phones | `09` (9a) | none yet | S | mobile, qa | qa | compliance-engineer | ops | counsel Q53, Q50; founder two phones | access-matrix allow and deny rows for the contributor role | S1-22, S1-28 | existing, allowlisted | No | F8; counsel |
| 24 | Rating ask, store page, screenshots, listing follow-ups | 2 | The store page shows the real app | none written | BL-340 (screenshots), #587 (18 items, renumber first) | S | content, ops | qa | product | ops | Apple 2.3; none else | not yet defined | n/a | n/a | No | Requirement; `expo-store-review` is a native change, batch with others; renumber (rank 4) |
| 25 | Settings regroup and Reminders sheet (#614, #521) and stale Settings words | 2 | Settings names things where you find them | F17 spec | #614, #521 (hold dates), BL-738 (as reserved in #638) | S | mobile, content | qa | design-systems | ops | counsel, hold 1 Dec | content test fails on any string naming a group the app lacks | n/a | n/a | No | Scope not read by me beyond titles |
| 26 | Notes control (D-133) | 2 | You can add a note to a letter and it counts as kept | F04-REQ-014, F14-REQ-081 | none yet; id: to be assigned | M | mobile, payments | qa | design-systems | ops | none | not yet defined | n/a | n/a | No | Waits until after 9 Nov |
| 27 | Catch-up: backdate letters, import voice memos | 2 | You can add the letters you spoke before you installed | none written | none yet | M | mobile | qa | privacy | ops | counsel on others' voices (import) | not yet defined | n/a | n/a | No | Read the code first; requirement |
| 28 | Family release: shared voice (9b) and relatives' hello | 2 | Grandparents add a hello and the family hears it | `09` (9b), `11` | none yet | XL each | sync, security | qa, red-team | security-architect, principal-architect | ops | counsel, ADRs AD-1 and AD-2, pen test | 6 and 7 rows | new rows named | `shared_voice_played`, `relative_hello_reviewed` new, not allowlisted | No | ADRs and threat model first; no build now |
| 29 | Parked group | 3 | n/a | `12` (languages) and others | none | n/a | n/a | n/a | n/a | n/a | triggers in `00` section 2 item 20 | n/a | n/a | n/a | No | Not started by design |

Where the order is mine and not a source's: ranks 4, 11, 15, 17, 19 to 21 and 24 to 26 were added to the `00` order by me (rank 15 provisional, "order to be set"). Ranks 1 to 3, 5 to 10, 12 to 14, 16, 18, 22, 23, 27 to 29 keep the `00` order.

## 3. What we start the day you confirm

These eight need no decision from you. Agents begin on a branch the same day; none merges without the gates in section 4.

1. Rank 3: security PRs #657, #632, #633 (small, no dependencies) and the review of #602 prepared for your read.
2. Rank 4: the numbering clean-up (BL-737) so every later PR cites ids that are free.
3. Rank 12: recording and Listen. Pick the one of #615 or #618 whose test fails on `develop`, then #617, #619; write the phone-is-full words.
4. Rank 18: the reminders no-repeat test and device row.
5. Rank 22: names that learn, repeat suppression with the content-rules test.
6. Rank 14: the alpha allowance boundary test (BL-736), the one part of Plus with no gate.
7. Rank 7: split #635 into reviewable parts (it is over the 400-line, 20-file limit), ready for your CCO line.
8. Rank 5 and 9: write the hosted smoke script, the production dump workflow variant and the kill, rollback and restore runbook as drafts. They run only after you decide F1, F2 and F4.

Also ready as reading and writing work: the counsel packet additions (rank 2, 11 items in `05` section 6) as a docs PR for you to send.

## 4. What waits on you

| Decision | Recommended default | Unblocks |
|---|---|---|
| F1 and F2 | Yes, production directly plus one throwaway rehearsal | 1, 5, 6, 8, 9, 11 |
| F3 counsel engaged | Engage Mon 9 Nov | 2, 7, 10, 14, 15, 21 |
| F4 plan | Pro with point-in-time recovery | 5, 9 |
| F5, F6, F7, F8 | Family only; Google out and code length 6; review mailbox; Family tab hidden | 6, 10, 23 |
| F9 CCO lines | After #635 is split | 7, 8 |
| F10 prices | $4.99 and $49.99, first 2 free | 14 |
| F11 analytics | Free first-party sink, opt-in, allowlisted content-free events | 15 |
| F12 to F17 | Defaults in section 1 | 10, 17, 21 and renumbers |

## 5. Team assignment proposal

Constraint first: your own hours are limited. What only you can do: read fenced paths (credentials code such as #602, migrations, `docs/legal`), give CCO lines (#635, #520), run device rows on your phones, and click in Apple, Supabase, EAS, Vercel, Resend and Google. Agents queue these for you in batches and never wait on them for other work.

| Tier | Develops | Tests | Reviews | Releases |
|---|---|---|---|---|
| 0 (server, accounts, security, store pack) | mobile, sync, data-architect, security, privacy | qa; red-team on credentials and migrations | security-architect, data-steward, compliance-engineer; your own read for credentials and migrations while no second counted reviewer exists | ops |
| 1 (happy path, billing, analytics, support) | mobile, payments, analytics, content | qa | principal-architect, privacy, design-systems | ops |
| 2 (growth, Feedback, catch-up) | mobile, content, data-architect | qa, user-research | per row | ops |
| 2 family release, 3 parked | not started | n/a | ADRs by principal-architect and security-architect | n/a |

Product keeps the backlog and the ids. Chief-of-staff runs the daily hand-out and the open PR triage (125 open PRs on 8 Nov per `04` R2).

Release path (as you stated it; CR-49 and CR-52 are cited from your request: CR-52 is not in the repo I could read, and CR-49 as written in PR #613 concerns the next TestFlight build, so the exact merge wording is NOT VERIFIED):
1. Agents open PRs; none merges itself. A merge needs a go from you that names the PR and its full head sha (CR-49 and CR-52 as you cited them).
2. The delegated rule applies only to head bumps that touch `develop` alone, as you described it.
3. Fenced paths (credentials, migrations, `docs/legal`) need your read or a counted second review.
4. A build dispatch needs your approval on the `testflight` environment. ops prepares the release checklist; you press approve.
5. Public submission follows counsel sign-off, the 14-day soak and the R-17 checklist, in the dates `00` section 4 gives (estimates).

## 6. Confirm

Reply with this exact line:

`confirm backlog 08 as ranked`

Or send the changes you want, for example `confirm backlog 08, move 15 to rank 6, drop 25`.

After your reply the harness does this, in order: product turns the confirmed rows into BACKLOG entries with ids from `next-id.mjs` (a docs PR you merge; `docs/BACKLOG.md` is outside this file's fence); chief-of-staff hands the eight rows in section 3 to their owners; ops lists the founder-hand steps with times; every other row waits on the decision named in its Missing cell. No agent merges, dispatches a workflow or builds on your reply alone.

## 7. What is NOT verified

- Whether counsel is engaged, whether any hosted project exists, and the cost of any Supabase plan.
- That every size is anything but an estimate; none was measured. No usage or revenue data exists.
- Individual "fails on old code" rows in the requirement files (read at header level only), and the PR bodies of #602, #657, #632, #633.
- CR-52's text and the exact CR-49 merge rule (see section 5).
- The free analytics plan: the file does not exist on a branch I could read; a working copy named `feat/analytics-free-sink` has unpushed first-party sink code, which I did not review. Rank 15's order is provisional.
- The ids BL-729 to BL-738 exist only as reservations inside PR #638; none is on `develop`.
- Apple's age-range API and statutes; Apple review turnaround.
- Code state beyond what the phase files and the gap map report.

Product Manager (Claude role)
