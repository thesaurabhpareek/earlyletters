# Next: the ranked backlog for the founder to confirm (phase 3, file 08)

Status: DRAFT for founder confirmation, **revised after the executive review in `11-ranking-review.md`** (verdict: agree with changes; each changed row ends its Missing cell with a "Changed in review" note)
Date: Sun 8 Nov 2026 (UTC)
Written by: Product Manager (Claude role). Docs only. It changes no decision, sets no price, assigns no id, merges nothing and dispatches nothing.

Built from `00-stack-rank.md`, `03-requirements/*`, `04-feasibility.md`, `05-compliance-risk.md`, `06-roi.md`, `07-debate.md` in this folder; `docs/release/BUILD12-GAP-MAP-2026-11-08.md` (branch `docs/build12-gap-map-8nov`); `docs/backlog/READINESS-2026-11-08.md` and the F17 Feedback spec (PR #638, branch `docs/prd-v2-readiness-8nov`); `agents/roster.json` and `.claude/agents/`.

## 0. Founder facts held

- Public App Store release, with full App Review.
- Build 12 runs on production servers. Staging first, or production directly, is still to be confirmed by him (decision F2 below).
- English-only alpha now.
- Analytics: the default was off (D-124 as cited in `00`); he now wants analytics, and free. The plan is in progress (rank 22). The council's default: off in build 12 and the first submission until a decision entry supersedes D-124 item 3 and Q54 is answered (F11).
- Internal alerts and reports go to earlyletters@gmail.com (rank 11). This is settled, not a question (F16).
- Ids come only from `node scripts/agents/next-id.mjs`. It printed BL-740, D-144, ADR 0028 on 8 Nov. Nothing below is assigned: where a row has no id it says "id: to be assigned". BL-621, D-139, D-141, D-142 clash and are not reused (BL-729 to BL-738 are reserved by the readiness file in PR #638, cited as it states them).

## 1. Founder decisions still open, and what each blocks

Ranks refer to the table in section 2. "Default" is my recommendation, not a decision.

| Id | Decision | Recommended default | Blocks ranks |
|---|---|---|---|
| F1 | Record that build 12 reverses D-121 item 1 (servers on); the entry also names the independent security test and the analytics default | Yes | 1, 5, 6, 9, 10, 12, 13 |
| F2 | Staging first, or production directly (final confirmation) | Production directly plus one throwaway rehearsal; staging before the first later migration | 5, 10 |
| F3 | Counsel engaged, scope Q41, Q43, Q44, Q46, Q47, Q48, Q53, Q54, Q57 | Engage Mon 9 Nov and send priority A | 2, 7, 8, 12, 17, 26 |
| F4 | Supabase plan for production | Pro with point-in-time recovery; read Supabase's pricing page first (cost UNVERIFIED) | 5, 10 |
| F5 | Who may sign in to build 12 | Family only until Q44 is answered and policy 0.9.0 is live | 5, 12 |
| F6 | Google sign-in out of build 12; code length 6 | Out; keep 6 | 6 |
| F7 | Reviewer sign-in method. **Changed in review** | A reviewer-only sign-in path that needs no founder inbox, designed and tested by security-architect (whether the sign-in service can issue a fixed code for one account is UNVERIFIED); the review mailbox on his domain is the fallback, opened only on a day Apple asks. Reason: the old default contradicts the "0 messages to the founder" check (`12` G-16) | 12 |
| F8 | Co-parent in the first public release | Hidden; on in 1.0.1 | 6, 12, 25 |
| F9 | CCO lines for #635 and #520 | Give after #635 is split | 7, 9 |
| F10 | Confirm Plus prices from `pricing.ts`, free-letters rule, no lifetime at 1.0 | $4.99 and $49.99, first 2 free (D-082, D-083) | 17 |
| F11 | Analytics on for build 12: how, with what consent. **Changed in review** | Free first-party sink, opt-in, content-free allowlisted events only, **off in build 12 and the first submission**; on in a 1.0.x after a decision entry supersedes D-124 item 3 and counsel answers Q54 (privacy label) | 22 and the alpha measures in `00` section 6 |
| F12 | Update channel (AD-3) | **RULED by Karma in review:** server-driven only; security-architect decides whether `expo-updates` is disabled. Not a founder question | 12, 30 |
| F13 | Feedback decision entry words (the Feedback entry in PR #638 is drafted, his words not pasted); D-140 (#576) words | He pastes, or says he gave none | 26 |
| F14 | Photos label answer | "No" only after a client-reference test and a bucket policy check | 12 |
| F15 | Individual publisher risk (5.1.1(ix)) | Keep D-134; ask Q47 before submission | 12 |
| F16 | Where internal alerts go and what they hold | **NOT A QUESTION:** he named earlyletters@gmail.com; what alerts may hold is the privacy rule in `CLAUDE.md` (no letter text, names, transcripts or audio) | 11 |
| F17 | Merge order and renumbers (#599 first, #587 renumbers; the #591 D-entry takes the next free number) | **RULED by Karma in review:** as the readiness file section 1 says | 24 and every row that cites a clashing id |
| F18 | Independent security test (D-125 item 10): vendor, spend, and whether the Friends group counts as "outside the first families". **New in review** | Scope and book now; treat Friends as outside the first families and run the test before it opens. To open Friends earlier, record a narrowing of D-125 item 10 in a decision entry | 4 and the Friends dates in `00` section 4 |
| F19 | Money admin: Paid Apps agreement, tax, bank, accountant before the first payout (CR-120, UNVERIFIED). **New in review** | Start the Paid Apps agreement the same day as the App Store Connect record (Plus products cannot be sold or reviewed without it; Apple's rule UNVERIFIED here) | 13, 17 |

Open items I cannot settle: whether counsel is engaged at all, and whether any hosted project exists (both NOT VERIFIED).

## 2. The ranked backlog (one table, strict order)

Column key. Team uses roster handles grouped by lane: develop (mobile, sync, data-architect, payments, analytics, speech), test (qa, red-team, user-research), review (principal-architect, security-architect, compliance-engineer, data-steward, ai-eng-lead), release (ops), security (security), privacy (privacy), content (content, legal, regulatory-affairs), design (design-systems), plus product and chief-of-staff. Web work goes to ops (no `web` handle in the roster, per the readiness file). Size is the estimate in `00` or `04`; no figure was measured. "Fails on old code" names the test; "per NX rows" means the requirement file lists rows with a "fails on old code" column that I read at header level only (UNVERIFIED row by row). Analytics: "allowlisted" means present in `packages/analytics/src/catalog.ts` on 8 Nov per `00` section 3; all analytics are off in every build profile today (D-124).

| Rank | Item | Tier | Customer outcome | Requirement | PR or BL | Size | Develops | Tests | Reviews | Releases | Gate | Fails on old code | Device row | Analytics event | Ready | Missing |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Record the route; answer staging or production | 0 | Your letters are kept on a server that was planned, not guessed | `03-requirements/01` NX-01 | none yet; id: to be assigned (D-entry, next free after D-144 check) | S | product drafts | n/a | founder | n/a | founder | n/a | n/a | n/a | No | F1, F2 Changed in review: no change. Add the independent security test (rank 4) and the analytics default (F11) to the decision entry words. |
| 2 | Counsel gates: send the packet, get texts live | 0 | The words you agree to were read by a lawyer | `03`, `05`, `08`; `05` section 6 | #616, #652 (policy 0.9.0 texts) | S to start, weeks | legal, regulatory-affairs | n/a | compliance-engineer | n/a | counsel | n/a | n/a | n/a | No | F3; counsel not confirmed engaged |
| 3 | Key, session and https security PRs | 0 | Your session is safe and signs out when it should | `02` | #602 (BL-594), #657, #632, #633 (BL-597, 599, 600) | S each | mobile, security | qa | security-architect, founder reads #602 | ops | founder (CR-47) | per PR; S1-27 | S1-27; new: force sign-out with 3 unsent letters | `forced_sign_out` new, not allowlisted | Partly | Founder read of #602; PR bodies not read Changed in review: no change in rank; the lane stands (`11` ruling 1). |
| 4 | Independent security test: scope, book, run (D-125 item 10) | 0 | Someone outside the team tried to break in before outside families signed in | D-125 item 10; none written | none yet; id: to be assigned | S to book, weeks to run (no quote) | security, security-architect write the scope; founder books | red-team prepares the retest list | principal-architect | ops | founder (vendor and spend, F18) | n/a (external test) | n/a | n/a | No | Scope waits for rank 5 to exist; cost unknown. Changed in review: ADDED (D-125 item 10; CISO, CTO). |
| 5 | Hosted backend: consent and audit chain, rehearsal, production, smoke | 0 | Your letters sit on a real server, and it was tested first | `01` NX-01 | #634, #636, #637, #655, #656; smoke: none yet | M plus about 7 founder hours | data-architect, ops | qa | data-steward, principal-architect | ops | founder (project, plan, `db-v` tag, approve-migration) | 7 rows in `01` | DL-03, B2-11; new: kill switch off, then record, keep, read, export | None new | No | F1, F2, F4; founder hands Changed in review: same number; now follows the new rank 4, whose scope waits for this row. |
| 6 | Sign in and session on production | 0 | You sign in with Apple or an email code and stay signed in | `02` | none yet (profile flip PR, on or after Tue 10 Nov) | M | mobile, security | qa | security-architect | ops | founder (Apple key, Resend SMTP), Apple 4.8 | 10 rows in `02` | S1-06, S1-08 | existing, allowlisted | No | Item 5 for the proof; F1, F6, F8 Changed in review: dependency fixed, the proof needs rank 5. |
| 7 | Adults only, agreement, age signal, country check | 0 | Only adults sign up, and you see the agreement plainly | `03` | #635 (851 lines, split first) | M | mobile, privacy | qa | compliance-engineer, founder CCO line | ops | counsel (Q46, Q48, Q57), founder CCO line | 8 rows in `03` | S1-03; 3 new | `age_step_result`, `age_signal_result` new, not allowlisted | No | Split of #635; F3, F9 Changed in review: same number. Split by audience: agreement and adults only gate Friends; age signal and country gate Public. |
| 8 | Withdraw sensitive-data consent (Settings > Privacy row, server function) | 0 | You can turn sync and sharing off yourself, and it holds on the server | D-128; no NX row found in `03-requirements` (UNVERIFIED) | BL-485 option (b) as D-128 cites it; id for new work: to be assigned | S to M | mobile, data-architect | qa | privacy, security-architect | ops | counsel for the words, Apple 5.1.1 | to write: withdrawal stops sync on the server | new: Settings > Privacy control | none | No | Requirement; whether build 2 already carries part of it is UNVERIFIED. Changed in review: ADDED (D-128; CPrivO, CCO). |
| 9 | Delete account end to end; erase this phone | 0 | You can delete your account and your phone copy, and it works | `04` | #520 (BL-640 in #599) | M | mobile, sync | qa | privacy, data-steward | ops | Apple 5.1.1(v), counsel sentence, founder CCO line | 7 rows in `04` | S1-35, S2-13, AL-07.6a, DL-05 | `phone_erase_result` new, not allowlisted | No | Item 5 for the drill; F9; `/delete-account` page is 404 Changed in review: moved from 8 to 9. D-129: ships hidden unless the sole-parent drill passes. |
| 10 | Production backup, kill, rollback, restore drill | 0 | If something breaks, your letters can come back | `01` NX-01-R5, R6 | #622 (staging only; production variant none yet) | M | ops | qa | principal-architect | ops | founder (plan), D-138 item 2 | per NX rows | DL-03; restore drill | none | No | F2, F4 Changed in review: moved from 9 to 10. |
| 11 | Alerts, incident process, rate limits, abuse route, crash reports (internal alerts go to earlyletters@gmail.com) | 0 | The team hears about a problem before you do, and there is a way to tell us | none written; write one (alert list, incident order, abuse route, where crash reports are read) | none yet; id: to be assigned | S to M | ops, security | qa | privacy, security-architect | ops | none external; F16 is settled (not a question) | not yet defined | new: alert fires on a failed purge or backup; incident order walk-through | none (nothing with letter text, names, transcripts or audio) | No | Requirement. Rate-limit settings exist in places (`supabase/auth-email.md`, some migrations) with no hosted proof (UNVERIFIED for sign-in and the API); crash reports are App Store Connect and TestFlight only, no third-party SDK. Changed in review: PROMOTED from Tier 1 (was rank 17) and widened (CISO; D-129). |
| 12 | Reviewer sign-in, Notes for Review, store pack (adds export-compliance answer, accessibility evidence, support and marketing URLs) | 0 | Apple can open the app and approve it | `05` | none yet (BL-341); `/support`, `/subscription-terms` pages none yet | M | content, ops | qa | compliance-engineer | ops | Apple 2.1(a), 2.3.1(a), 5.1.1(i); counsel Q54, Q47 | 9 rows in `05` | S1-08; new: fresh phone, Notes only | none | No | F5, F7, F12, F14, F15; counsel text Changed in review: moved from 10 to 12. Widened: export-compliance answer, accessibility evidence rows, abuse route link. F7 default changed (reviewer-only sign-in path, mailbox as fallback; `12` G-16). |
| 13 | Founder-hands setup and money admin: auth email, DMARC, CAA, EAS production variables, Friends group, App Store Connect record, Paid Apps agreement, tax, bank, Plus products, accountant | 0 | Sign-in emails arrive, testers can join, and Plus can be sold | gap map 4D (ranks 20, 34, 35, 37, 39); money steps: none written | none yet; id: to be assigned | S each (30 min to 3 h) | founder hands, ops writes checklist | n/a | ops | ops | founder | n/a | n/a | n/a | No | Item 5; F4; F19 (Q2-09 and CR-120 not read, UNVERIFIED). Changed in review: WIDENED with money admin (CFO). |
| 14 | Recording and Listen that behave; first run without fiddly steps; phone-is-full screen | 1 | Your recording is never lost, and a full phone says so and keeps it | `06` | #615 or #618 (pick one), #617, #619; BL-734 (as reserved in #638) | M | mobile, content (words), design-systems | qa | red-team | ops | none external | `[BL-563]` out-of-space test; 9 rows in `06` | S1-39, S1-13, DL-01, DL-02, B2-11; 2 new | `phone_full_shown`, `download_choice` new, not allowlisted | Yes | Pick #615 or #618; words for BL-734; fix the #533 local database flake before any new local migration Changed in review: moved from 12 to 14. Kill-safety proof B2-11 is the exit test; the flake is now rank 15. |
| 15 | Local database migration flake (#533) | 1 | Updates never trip over your saved letters | `04` R6 | #533 | S | mobile | qa | data-steward | ops | none external | to write: repeat-run test that exposes the flake | none | none | Yes | #533 not read (UNVERIFIED). Start with rank 14; first if a recording PR adds a local migration. Changed in review: ADDED (`04` R6; CTO, CDO). |
| 16 | Letters on every phone: two-phone proof | 1 | A letter you record shows on your other phone | `07` | none yet (evidence files) | M to L | qa prepares, sync | qa | principal-architect | ops | founder (two phones) | 8 rows in `07` | B2-4, S1-22, S1-28, DL-03, AL-06 | existing, allowlisted | No | Items 5, 6; founder two phones Changed in review: moved from 13 to 16. Kept ahead of Plus (`11` ruling 2). |
| 17 | Plus and billing trust; alpha allowance test | 1 | You see the price plainly and nothing is taken away | `08` | BL-736 (as reserved in #638), BL-604 and BL-605 (#591); billing charter none yet | S to M | payments, content | qa | compliance-engineer | ops | counsel Q41 and 10 locked strings, Apple 2.1(b), 3.1.1, 3.1.2 | `[PL-1]` letters 1 to 100 free, letter 101 meets the Keep sheet; 8 rows in `08` | AL-09; 1 new | existing, allowlisted | Partly | BL-736 ready; rest needs F10 and counsel Changed in review: moved from 14 to 17. Store-side money steps moved to rank 13. |
| 18 | Support route: a person answers within a day | 1 | You can reach a person, and they answer | none written (`01` opportunity 24) | none yet; id: to be assigned | S | support, ops | n/a | product | ops | none | n/a | n/a | n/a | No | Requirement; shares the `/support` page with rank 12; about 3 founder hours Changed in review: moved from 16 to 18. The URL part is in rank 12. |
| 19 | Build 1 audit follow-ups, un-deferred on 9 Nov | 1 | The known rough edges from the first builds are smoothed | per row (37 rows) | BL-567 to BL-603; BL-551 to BL-562 | S to M each | mobile, data-architect, security, ops | qa | per row | ops | counsel on BL-573, BL-575, BL-580 | none named on most rows (one line each when picked up) | BL-566, BL-587 to BL-593 need a device operator | per row | Partly | Un-defer on 9 Nov; test line per row Changed in review: same rank. Product tags each of the 37 rows Tier 0 or not by Wed 11 Nov; security, privacy and counsel rows (BL-573, BL-575, BL-580, BL-587 to BL-593) count as Tier 0 for ordering until then. |
| 20 | The 1 Dec block in #599 (store-build P0 and P1 rows) | 1 | The first store build has what Apple and families expect | per row (106 items; 30 ready by their own status) | #599 | S to M each | per row | qa | per row | ops | per row | 8 ready rows name no test | per row | per row | Partly | `Satisfies:` lines on 96 rows; must merge by Fri 20 Nov or move to 1.0.1 Changed in review: same rank. |
| 21 | Notes control (D-133) | 1 | You can add a note to a letter and it counts as kept | F04-REQ-014, F14-REQ-081 | none yet; id: to be assigned | M | mobile, payments | qa | design-systems | ops | none | not yet defined | n/a | n/a | No | Waits until after 9 Nov |
| 22 | Free analytics (first-party sink) | 1 | We learn what helps you without selling or reading your words | none written; plan in progress | order to be set; branch `feat/analytics-free-sink` exists in a working copy but is not on the remote; id: to be assigned | not sized | analytics, data-architect | qa | privacy, security-architect | ops | founder decision F11, counsel Q54 (privacy label) | not yet defined | none | the allowlist `packages/analytics/src/catalog.ts` governs; new events not allowlisted until added | No | `docs/analytics/FREE-ANALYTICS-PLAN-2026-11-08.md` does not exist on any branch I could read; F11 Changed in review: moved from 15 to 22. F11 default changed: off in build 12 and the first submission (D-124 item 3, Q54). |
| 23 | Reminders that fit: proof, back-off, measure | 1 | A reminder helps and then steps back | `10` | #624, #483 (built); BL-534 decision | S to M | mobile | qa | principal-architect | ops | Apple 4.5.4; decide BL-534 (1.0 or 1.0.1) | NX-10-R2 cross-season no-repeat test; R5 passes on old code | 2 new | existing, allowlisted | Yes (local) | Numbers need alpha use; D-130 call Changed in review: moved from 18 to 23. |
| 24 | Numbering clean-up: D, CR, S1-39 clashes and merge order | 1 | Nothing for you; the team stops tripping on duplicate ids | readiness file sections 1 and 4 | BL-737 (as reserved in #638) | XS | product | qa | ai-eng-lead | none | none | `node scripts/agents/id-collisions.mjs` prints no COLLISION line | n/a | n/a | Yes | F17 (merge order) Changed in review: DEMOTED from Tier 0 (was rank 4). The public build does not depend on it; still first on the day-one list. |
| 25 | Co-parent text proof (9a); Family tab hidden | 2 | Your partner can add a letter, proven on two phones | `09` (9a) | none yet | S | mobile, qa | qa | compliance-engineer | ops | counsel Q53, Q50; founder two phones | access-matrix allow and deny rows for the contributor role | S1-22, S1-28 | existing, allowlisted | No | F8; counsel Changed in review: moved from 23 to 25; first in Tier 2. |
| 26 | In-app Feedback (5 tasks) | 2 | You can tell us what went wrong in two taps | F17-REQ-084 to F17-REQ-094 (F17 spec) | BL-729 to BL-733 (as reserved in #638) | L, split into 5 | data-architect, mobile, content, ops | qa | privacy, security | ops | counsel (3 lists, deletion sentence, label), founder clicks | tests named in the BL-729 to BL-731 rows | VoiceOver and AX5; airplane mode | none (content-free report id only) | Partly | BL-729 migration label; F13; build 2 scope only Changed in review: moved from 21 to 26. |
| 27 | Names that learn; prompts v3 (English) | 2 | The app spells your family's names right | `12` (names part) | none yet | M | mobile, content | qa | privacy | ops | none external | repeat suppression across seasons, with the content-rules test | FB-02 for languages only | `dictionary_term_added` existing | Yes | Names near a log path is the pre-mortem risk Changed in review: moved from 22 to 27. |
| 28 | Rating ask, store page, screenshots, listing follow-ups | 2 | The store page shows the real app | none written | BL-340 (screenshots), #587 (18 items, renumber first) | S | content, ops | qa | product | ops | Apple 2.3; none else | not yet defined | n/a | n/a | No | Requirement; `expo-store-review` is a native change, batch with others; renumber (rank 24) Changed in review: moved from 24 to 28. |
| 29 | Catch-up: backdate letters, import voice memos | 2 | You can add the letters you spoke before you installed | none written | none yet | M | mobile | qa | privacy | ops | counsel on others' voices (import) | not yet defined | n/a | n/a | No | Read the code first; requirement Changed in review: moved from 27 to 29. |
| 30 | Settings regroup and Reminders sheet (#614, #521) and stale Settings words | 2 | Settings names things where you find them | F17 spec | #614, #521 (hold dates), BL-738 (as reserved in #638) | S | mobile, content | qa | design-systems | ops | counsel, hold 1 Dec | content test fails on any string naming a group the app lacks | n/a | n/a | No | Scope not read by me beyond titles Changed in review: moved from 25 to 30. |
| 31 | Family release: shared voice (9b) and relatives' hello | 2 | Grandparents add a hello and the family hears it | `09` (9b), `11` | none yet | XL each | sync, security | qa, red-team | security-architect, principal-architect | ops | counsel, ADRs AD-1 and AD-2, pen test | 6 and 7 rows | new rows named | `shared_voice_played`, `relative_hello_reviewed` new, not allowlisted | No | ADRs and threat model first; no build now Changed in review: moved from 28 to 31. |
| 32 | Parked group | 3 | n/a | `12` (languages) and others | none | n/a | n/a | n/a | n/a | n/a | triggers in `00` section 2 item 20 | n/a | n/a | n/a | No | Not started by design Changed in review: moved from 29 to 32. |

Where the order is mine and not a source's (after review): the review rows 4, 8 and 15 are new; ranks 11, 13, 19 to 22, 24 and 26 are `08`-only rows ordered by the council's medians and Karma's rulings (rank 22 is provisional, "order to be set"). The rest follow `00`, whose numbers differ; the old-to-new map for both files is in `11-ranking-review.md` section 8. The per-role ranks behind every row are in `11` section 4.

## 3. What we start the day you confirm

These nine need no decision from you. Agents begin on a branch the same day; none merges without the gates in section 4.

1. Rank 3: security PRs #657, #632, #633 (small, no dependencies) and the review of #602 prepared for your read.
2. Rank 24: the numbering clean-up (BL-737) so every later PR cites ids that are free. Demoted from Tier 0 in review; still first because it costs you nothing.
3. Rank 14: recording and Listen. Pick the one of #615 or #618 whose test fails on `develop`, then #617, #619; write the phone-is-full words. Rank 15 (the #533 flake) starts alongside.
4. Rank 23: the reminders no-repeat test and device row.
5. Rank 27: names that learn, repeat suppression with the content-rules test.
6. Rank 17: the alpha allowance boundary test (BL-736), the one part of Plus with no gate.
7. Rank 7: split #635 into reviewable parts (it is over the 400-line, 20-file limit), ready for your CCO line.
8. Ranks 5 and 10: write the hosted smoke script, the production dump workflow variant and the kill, rollback and restore runbook as drafts. They run only after you decide F1, F2 and F4.
9. Ranks 4, 8 and 11 (new in review): write the scope note for the independent test, the consent-withdrawal requirement and the alerts and incident requirement. Docs only.

Also ready as reading and writing work: the counsel packet additions (rank 2, 11 items in `05` section 6) as a docs PR for you to send.

## 4. What waits on you

| Decision | Recommended default | Unblocks |
|---|---|---|
| F1 and F2 | Yes, production directly plus one throwaway rehearsal | 1, 5, 6, 9, 10, 12, 13 |
| F3 counsel engaged | Engage Mon 9 Nov | 2, 7, 8, 12, 17, 26 |
| F4 plan | Pro with point-in-time recovery | 5, 10 |
| F5, F6, F7, F8 | Family only; Google out and code length 6; reviewer-only sign-in path, mailbox as fallback; Family tab hidden | 6, 12, 25 |
| F9 CCO lines | After #635 is split | 7, 9 |
| F10 prices | $4.99 and $49.99, first 2 free | 17 |
| F11 analytics | Free first-party sink, opt-in, off in build 12 and the first submission | 22 |
| F18 independent security test | Scope and book now; Friends waits for it | 4, Friends dates |
| F19 money admin | Start with the App Store Connect record | 13, 17 |
| F13 to F15 | Defaults in section 1 | 12, 26 |

Ruled in review and no longer waiting on you: F12 and F17 (Karma), F16 (not a question).

## 5. Team assignment proposal

Constraint first: your own hours are limited. What only you can do: read fenced paths (credentials code such as #602, migrations, `docs/legal`), give CCO lines (#635, #520), run device rows on your phones, and click in Apple, Supabase, EAS, Vercel, Resend and Google. Agents queue these for you in batches and never wait on them for other work.

| Tier | Develops | Tests | Reviews | Releases |
|---|---|---|---|---|
| 0 (server, accounts, security, store pack, alerts, independent test) | mobile, sync, data-architect, security, privacy | qa; red-team on credentials and migrations | security-architect, data-steward, compliance-engineer; your own read for credentials and migrations while no second counted reviewer exists | ops |
| 1 (happy path, billing, analytics, support) | mobile, payments, analytics, content | qa | principal-architect, privacy, design-systems | ops |
| 2 (growth, Feedback, catch-up) | mobile, content, data-architect | qa, user-research | per row | ops |
| 2 family release, 3 parked | not started | n/a | ADRs by principal-architect and security-architect | n/a |

Product keeps the backlog and the ids. Chief-of-staff runs the daily hand-out and the open PR triage (125 open PRs on 8 Nov per `04` R2; the council scored this as a task, not a row).

Release path (as you stated it; CR-49 and CR-52 are cited from your request: CR-52 is not in the repo I could read, and CR-49 as written in PR #613 concerns the next TestFlight build, so the exact merge wording is NOT VERIFIED):
1. Agents open PRs; none merges itself. A merge needs a go from you that names the PR and its full head sha (CR-49 and CR-52 as you cited them).
2. The delegated rule applies only to head bumps that touch `develop` alone, as you described it.
3. Fenced paths (credentials, migrations, `docs/legal`) need your read or a counted second review.
4. A build dispatch needs your approval on the `testflight` environment. ops prepares the release checklist; you press approve.
5. Public submission follows counsel sign-off, the 14-day soak, the R-17 checklist and the independent security test (D-125 item 10), in the dates `00` section 4 gives (estimates; the Friends dates are conditional on the test).

## 6. Confirm

Reply with this exact line:

`confirm backlog 08 as ranked`

Or send the changes you want, for example `confirm backlog 08, move 22 to rank 6, drop 30`.

After your reply the harness does this, in order: product turns the confirmed rows into BACKLOG entries with ids from `next-id.mjs` (a docs PR you merge; `docs/BACKLOG.md` is outside this file's fence); chief-of-staff hands the nine rows in section 3 to their owners; ops lists the founder-hand steps with times; every other row waits on the decision named in its Missing cell. No agent merges, dispatches a workflow or builds on your reply alone.

## 7. What is NOT verified

- Whether counsel is engaged, whether any hosted project exists, and the cost of any Supabase plan.
- That every size is anything but an estimate; none was measured. No usage or revenue data exists.
- Individual "fails on old code" rows in the requirement files (read at header level only), and the PR bodies of #602, #657, #632, #633.
- CR-52's text and the exact CR-49 merge rule (see section 5).
- The free analytics plan: the file does not exist on a branch I could read; a working copy named `feat/analytics-free-sink` has unpushed first-party sink code, which I did not review. Rank 15's order is provisional.
- The ids BL-729 to BL-738 exist only as reservations inside PR #638; none is on `develop`.
- The review (`11`): the twelve roles were written by one session, not run independently; CR-120, Q2-09, #533, BL-485 and the body of D-128 beyond its decision line were not read in full; whether the sign-in service can issue a fixed code for a reviewer account is UNVERIFIED.
- Apple's age-range API and statutes; Apple review turnaround.
- Code state beyond what the phase files and the gap map report.

Product Manager (Claude role)
