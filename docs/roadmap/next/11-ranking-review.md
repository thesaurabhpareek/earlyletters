# Next: executive review of the ranking (phase 3, file 11)

Status: DRAFT, 8 Nov 2026 (UTC). Docs only. It changes no decision of record, sets no price, assigns no id, merges nothing and dispatches nothing. The founder asked: "Ask executive team to verify ranking and if they agree. Review and change what's needed."

Reviewed: `00-stack-rank.md` (20 rows) and `08-ranked-backlog.md` (29 rows) at head `1f25be67` of branch `docs/next-roadmap-8nov` (draft PR #664). Updated in the same change: `00` and `08`. Not touched: `12-engineering-readiness-audit.md`, `03-requirements/`.

## 0. Limits and what was not done

1. **One session wrote all twelve roles.** The roles are Claude roles, not professionals, and they were not run as independent agents. Each role's scores below are my judgment of that role's priorities, read from its skill file. The rank-by-role table is therefore a structured way to expose disagreement, not a vote and not a measurement. Where a number looks precise it is a rank from a 0 to 10 judgment score, nothing more.
2. **No usage or revenue data exists** (`06`). Nothing here is evidence of demand.
3. **Read for this review:** all of `docs/roadmap/next/` including `12`, the gap map (branch `docs/build12-gap-map-8nov`), the readiness file (branch `docs/prd-v2-readiness-8nov`), and DECISIONS D-100, D-121, D-124, D-125, D-126, D-128, D-129, D-133 and D-134 from `origin/develop`. D-130 to D-139 were not re-read for this review; where this file touches them it says "as cited in the phase files".
4. **Not read (UNVERIFIED):** the Project docs (no reader was available), the body of PRs #602, #657, #632, #633, #520, #533, the contents of CR-47, CR-49, CR-52, CR-120, Q2-09, and Apple's pages. Facts from those are marked.
5. **Counsel engagement and a hosted project** are still NOT VERIFIED, as in `00`.
6. **Dates** are the gap map's estimates. Nothing here is a commitment.

## 1. Method

1. Each of the 12 roles (CPO, CTO as Karma, CISO, CPrivO, CCO, CLO, CDesO, CFO, CBO, CMO, CDO, CAIO) scored every row 0 to 10 for its own priorities, then ranked. Ties break by the old `08` rank.
2. Median rank and spread (highest rank minus lowest) were computed per row. A spread of 15 or more is called contested.
3. Each contested point got a one-line challenge from the role with the opposite interest (section 5).
4. Karma ruled what Karma may rule. Founder-only matters (money, legal and privacy promises, scope and dates, external accounts, one-way doors, the founder's hours) stay FOUNDER with a recommended default.
5. Six checks the founder named were run (section 7).

## 2. Verdict

**AGREE WITH CHANGES.** The council agrees with the shape: a constraint lane first (Tier 0), then the happy path, then growth, with the parked group untouched. It does not agree that the lane is complete or that every row sits in the right tier. Twelve changes follow (section 8): three rows added, one row promoted into Tier 0 and widened, one demoted out of it, one moved up a tier, two rows widened, two defaults changed, the Tier 1 and Tier 2 order reset to the medians where Karma did not rule otherwise, and the founder list reshaped.

The most important finding, in plain words: the gap map's dates for the external "Friends" group (earliest Tue 17 Nov, realistic Mon 30 Nov) do not include the independent security test that D-125 item 10 requires "before server features open to anyone outside the first families". Either the test happens first, which moves the Friends dates by a vendor lead time nobody has quoted, or the founder narrows D-125 item 10 in a new decision. That is the founder's call (F18).

## 3. Per-role verdicts

Each line: the role's own top 8 by its scores (old `08` rank numbers, see section 4 for names), then what it flags. Evidence is cited by file, decision or PR; "UNVERIFIED" where I did not read the source.

- **CPO.** Top 8: 12, 1, 5, 6, 2, 9, 10, 13. Agrees with the Tier 0 lane but wants Recording (12) to start on day one in parallel, and says so; the doc already says it does (`00` section 1). Flags: Notes control (26) is in Tier 2 but D-133 says "Notes ship in v1.0", so it is Tier 1. Flags the 37-row Build 1 audit follow-up (19) as an unsorted bag that hides which rows are Tier 0. Verdict: agree with changes. (Chief Product Officer, Claude role)
- **CTO (Karma).** Top 8: 1, 5, 3, 6, 9, 2, 11, 12. Agrees with the order of Tier 0. Flags: the local database migration flake (#533, `04` R6) is a precondition for any local migration and has no row of its own; numbering clean-up (4) is hygiene, not a constraint. Rules on F12 and F17 (section 6). Verdict: agree with changes. (Karma)
- **CISO.** Top 8: 3, 5, 6, 9, 17, 1, 19, 8. Flags: (a) no row for the external security test D-125 item 10 requires; (b) internal alerts (17) is the incident-detection half of "can we run a public service", so it is Tier 0 and wider than "alerts to a mailbox"; (c) Build 1 audit rows with security content (BL-587 to BL-593 need a device operator) are not tagged. Verdict: disagree with the tiering of 17 and the missing test; otherwise agree. (Chief Information Security Officer, Claude role)
- **CPrivO.** Top 8: 7, 8, 2, 5, 1, 3, 6, 9. Flags: D-128 requires "the withdrawal control and its server function ... before any friend outside the family signs in", and no row carries it; analytics (15) conflicts with D-124 item 3 ("in-app analytics stays off for the whole 1.0 line") and needs a decision entry before any build carries it; the delete account row must ship hidden unless the drill passes (D-129). Verdict: disagree on the missing D-128 row and on analytics timing. (Chief Privacy Officer, Claude role)
- **CCO.** Top 8: 2, 7, 8, 10, 1, 5, 6, 19. Flags: the reviewer sign-in default in F7 (a mailbox the founder opens) contradicts the "0 messages to the founder" check the readiness audit records as gap G-16 in `12`; the store pack lacks an export-compliance answer and an accessibility pass as named items (the export key exists in `apps/mobile/app.config.ts`, its answer was not read); the age signal (7) is a Public gate and the age declaration is a Friends gate, which the single row hides. Verdict: disagree with F7 default; otherwise agree. (Chief Compliance Officer, Claude role)
- **CLO.** Top 8: 2, 7, 1, 8, 10, 14, 5, 23. Flags: counsel gating is correctly rank 2; Q44 (real families under draft texts) must be answered before the Friends group, not just before Public; Plus text (14) carries ten `COUNSEL_LOCKED` strings. Agrees with the order. Verdict: agree. (Chief Legal Officer, Claude role)
- **CDesO.** Top 8: 12, 6, 7, 8, 10, 14, 16, 18. Flags: Recording and Listen is the product; the Tier 0 lane is accepted only if Recording starts the same day. Wants an accessibility pass named in the store pack (VoiceOver and the largest text size) and asks that Settings regroup (25) not move up. Verdict: agree with changes. (Chief Design Officer, Claude role)
- **CFO.** Top 8: 14, 11, 1, 2, 5, 9, 6, 10. Flags: money admin has no home. The Paid Apps agreement, tax and bank steps, and the accountant before the first payout (CR-120, UNVERIFIED: not read) are not in any row, and the gap map treats the Paid Apps status as unknown (Q2-09, UNVERIFIED). Unit economics rest on Small Business Program, still pending (S-31). Wants Plus earlier. Verdict: disagree on Plus's place; agree on the added scope. (Chief Financial Officer, Claude role)
- **CBO.** Top 8: 14, 10, 11, 1, 5, 12, 15, 2. Flags: Plus and the store pack are what turn the build into a business; the founder-hands setup row is the real bottleneck on the founder's hours. Wants analytics (15) near the top. Verdict: disagree on Plus and analytics order; agree on the lane. (Chief Business Officer, Claude role)
- **CMO.** Top 8: 10, 24, 2, 16, 14, 11, 1, 7. Flags: the store page and a working support URL are launch assets; the rating ask (24) is cheap and should not sit behind the family release. States that no public claim leaves the building before counsel clears it (D-125 item 9, D-133). Verdict: agree with changes (support URL joins the store pack, already so in `08`). (Chief Marketing Officer, Claude role)
- **CDO.** Top 8: 5, 8, 9, 13, 6, 12, 15, 1. Flags: the local database flake is a data-integrity risk; the first-party analytics plan has no data classification and no allowlist entry for new events; backup and restore (9) is the data row that matters most. Verdict: agree with changes. (Chief Data Officer, Claude role)
- **CAIO.** Top 8: 12, 22, 1, 2, 4, 15, 3, 5. Flags: names that learn (22) is HYPOTHESIS-grade (`06`, `01` rank 7) and must keep the faithful-edit constitution (no rewriting); numbering clean-up (4) is cheap agent work and should start on day one, which it does. Verdict: agree. (Chief AI Officer, Claude role)

## 4. Rank by role

Ranks come from the judgment scores described in section 1. Old rank is the row number in `08` before this review; "New" is the number after. Names are short forms.

| Old | New | Item | CPO | CTO | CISO | CPrivO | CCO | CLO | CDesO | CFO | CBO | CMO | CDO | CAIO | Median | Spread |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | Record the route | 2 | 1 | 6 | 5 | 5 | 3 | 16 | 3 | 4 | 7 | 8 | 3 | 4.5 | 15 |
| 2 | 2 | Counsel gates | 5 | 6 | 10 | 3 | 1 | 1 | 10 | 4 | 8 | 3 | 9 | 4 | 4.5 | 9 |
| 3 | 3 | Security PRs | 15 | 3 | 1 | 6 | 9 | 9 | 23 | 11 | 19 | 24 | 10 | 7 | 9.5 | 23 |
| 4 | 24 | Numbering clean-up | 21 | 13 | 21 | 28 | 19 | 20 | 28 | 27 | 27 | 27 | 15 | 5 | 21 | 23 |
| 5 | 5 | Hosted backend | 3 | 2 | 2 | 4 | 6 | 7 | 17 | 5 | 5 | 11 | 1 | 8 | 5 | 16 |
| 6 | 6 | Sign in on production | 4 | 4 | 3 | 7 | 7 | 10 | 2 | 7 | 9 | 12 | 5 | 9 | 7 | 10 |
| 7 | 7 | Adults only, agreement, age signal, country | 9 | 14 | 12 | 1 | 2 | 2 | 3 | 12 | 20 | 8 | 11 | 18 | 10 | 19 |
| 8 | 9 | Delete account, erase phone | 10 | 10 | 8 | 2 | 3 | 4 | 4 | 16 | 21 | 13 | 2 | 19 | 9 | 19 |
| 9 | 10 | Backup, kill, rollback, restore | 6 | 5 | 4 | 8 | 13 | 15 | 24 | 6 | 13 | 17 | 3 | 10 | 9 | 21 |
| 10 | 12 | Reviewer sign-in, store pack | 7 | 11 | 11 | 9 | 4 | 5 | 5 | 8 | 2 | 1 | 16 | 11 | 7.5 | 15 |
| 11 | 13 | Founder-hands setup | 11 | 7 | 9 | 18 | 10 | 16 | 25 | 2 | 3 | 6 | 20 | 12 | 10.5 | 23 |
| 12 | 14 | Recording and Listen | 1 | 8 | 15 | 12 | 20 | 21 | 1 | 9 | 6 | 9 | 6 | 1 | 8.5 | 20 |
| 13 | 16 | Letters on every phone | 8 | 9 | 13 | 13 | 21 | 22 | 11 | 17 | 14 | 18 | 4 | 20 | 13.5 | 18 |
| 14 | 17 | Plus and billing trust | 12 | 16 | 18 | 19 | 11 | 6 | 6 | 1 | 1 | 5 | 21 | 22 | 11.5 | 21 |
| 15 | 22 | Free analytics | 13 | 18 | 19 | 20 | 17 | 17 | 12 | 10 | 7 | 19 | 7 | 6 | 15 | 14 |
| 16 | 18 | Support route | 14 | 19 | 20 | 11 | 14 | 11 | 7 | 13 | 10 | 4 | 25 | 23 | 13.5 | 21 |
| 17 | 11 | Internal alerts | 22 | 12 | 5 | 14 | 22 | 23 | 27 | 14 | 25 | 28 | 12 | 13 | 18 | 23 |
| 18 | 23 | Reminders | 17 | 20 | 22 | 21 | 23 | 24 | 8 | 19 | 15 | 10 | 22 | 24 | 20.5 | 16 |
| 19 | 19 | Build 1 audit follow-ups | 18 | 15 | 7 | 10 | 8 | 12 | 18 | 20 | 26 | 25 | 13 | 14 | 14.5 | 19 |
| 20 | 20 | The 1 Dec block (#599) | 16 | 17 | 14 | 15 | 12 | 13 | 13 | 21 | 22 | 14 | 17 | 15 | 15 | 10 |
| 21 | 26 | In-app Feedback | 19 | 21 | 16 | 16 | 15 | 18 | 19 | 22 | 23 | 20 | 14 | 21 | 19 | 9 |
| 22 | 27 | Names that learn | 23 | 24 | 25 | 22 | 26 | 27 | 14 | 23 | 24 | 21 | 23 | 2 | 23 | 25 |
| 23 | 25 | Co-parent text proof (9a) | 24 | 22 | 17 | 17 | 16 | 8 | 20 | 24 | 16 | 15 | 18 | 25 | 17.5 | 17 |
| 24 | 28 | Rating ask, store page | 26 | 25 | 26 | 25 | 18 | 19 | 21 | 15 | 11 | 2 | 28 | 26 | 23 | 26 |
| 25 | 30 | Settings regroup | 27 | 26 | 27 | 23 | 24 | 25 | 9 | 28 | 28 | 26 | 26 | 27 | 26 | 19 |
| 26 | 21 | Notes control | 20 | 23 | 28 | 26 | 25 | 14 | 15 | 18 | 18 | 16 | 19 | 16 | 18.5 | 14 |
| 27 | 29 | Catch-up | 25 | 27 | 23 | 24 | 27 | 26 | 22 | 25 | 17 | 22 | 24 | 17 | 24 | 10 |
| 28 | 31 | Family release (9b) | 28 | 28 | 24 | 27 | 28 | 28 | 26 | 26 | 12 | 23 | 27 | 28 | 27 | 16 |

Rows the review added (scored the same way, ranked among the 28 old rows plus these):

| New | Item | Median | Spread | Where it came from |
|---|---|---|---|---|
| 4 | Independent security test (D-125 item 10) | 6 | 8 | CISO, CTO |
| 8 | Withdraw sensitive-data consent (D-128) | 6 | 8 | CPrivO, CCO |
| 15 | Local database flake (#533) | 3 | 9 | CTO, CDO |

Candidates scored and folded into existing rows instead of added: never lose a take (median 5.5) into row 14; Plus works on production (6.5) into rows 13 and 17; device evidence plan (6.5) into row 16; open-PR triage (4) as a chief-of-staff task, no row; money admin (1.5, spread 9, because only the CFO and CBO care) into row 13.

What the table says:

- **Most contested (spread 23 or more):** rating ask (26), names that learn (25), security PRs (23), numbering clean-up (23), founder-hands setup (23), internal alerts (23). Each is one role pulling hard against the rest, which is what a specialist role should do.
- **Median order against the written order:** the median puts security PRs (9.5) and Recording (8.5) close together and ahead of several Tier 0 rows. This is the point debate (a) already decided: Tier 0 is a constraint lane, not scored against features. The council accepts it (section 5, challenge 1).
- **The twelve roles put eight different rows first** (old ranks 1, 2, 3, 5, 7, 10, 12 and 14 each top at least one role's list). There is no consensus top item, which is another reason to keep Tier 0 as a lane with a stated order and not let the median pick.

## 5. Challenge round

One line each. The challenger is the role with the opposite interest.

1. **Tier 0 lane versus Recording first.** CISO to CPO: a lost take is a trust failure, but an unprotected server leaks all of them; the lane stays. CPO answers: then Recording starts the same day on the agent side. Settled: both.
2. **Plus earlier (CFO, CBO).** CCO to CFO: Plus text has ten counsel-locked strings and Apple 3.1.1 and 3.1.2 gates; moving it up spends founder hours on a row that cannot ship before counsel answers. CFO answers: then take the store-side money admin now (row 13) so Plus is ready when counsel is. Settled: money admin joins row 13; Plus keeps its place.
3. **Analytics early (CDO, CBO).** CPrivO to CBO: D-124 item 3 keeps analytics off for the whole 1.0 line and the privacy label depends on Q54; a build that collects before that is a promise broken. CBO answers: the founder wants analytics and wants it free. Not settled: FOUNDER (F11).
4. **Rating ask and store page up (CMO).** CPO to CMO: the page can only show the real app after Recording and the store pack exist; `expo-store-review` is a native change to batch. Settled: stays Tier 2; screenshots stay on the store pack row.
5. **Names that learn up (CAIO).** CPrivO to CAIO: names stored near a log path is the pre-mortem risk, and the evidence is HYPOTHESIS (zero reviews about language). Settled: stays Tier 2; the content-rules test stays the gate.
6. **Numbering clean-up as Tier 0 (old rank 4).** CTO to CAIO: it costs the founder nothing and the team needs free ids, but the public build does not depend on it. Settled: demoted to Tier 1 hygiene, still first on the day-one list.
7. **Alerts as Tier 0 (CISO).** CMO to CISO: a mailbox alert is not a launch asset. CISO answers: without detection and an incident route we cannot say a public service is run, and D-129 and the purge worker need failure alarms. Settled: promoted to Tier 0.
8. **Reviewer sign-in by founder mailbox (F7).** CCO to CMO: the default asks the founder to open a mailbox while the readiness check counts zero messages to the founder (G-16 in `12`). CMO answers: Apple needs an account it can use. Settled: default changed (section 6, ruling 4).
9. **Friends dates versus the security test.** CTO to CMO and CBO: D-125 item 10 is in the record; the test is outside the gap map's dates. Not settled on the reading of "first families": FOUNDER (F18).
10. **Notes control in Tier 2.** CPO to CDesO: D-133 says "Notes ship in v1.0" and a kept note counts toward the free letters, so the control is part of the happy path. Settled: moved to Tier 1.

## 6. Karma's rulings

Verdict words: RULED, FOUNDER, NOT A QUESTION, NEEDS EVIDENCE.

1. **RULED: the Tier 0 lane stands** (debate (a) unchanged). Recording (new 14) starts the same day on the agent side. Median ranks do not reorder Tier 0.
2. **RULED: Letters on every phone (16) stays ahead of Plus (17).** Sync gates the Friends group and uses the founder's two phones, the scarcest input; the store-side Plus work is already in the founder-hands row (13).
3. **RULED: Tier 0 is gated by audience, not by one date.** Family (internal TestFlight), Friends (Beta App Review, outside the first families) and Public (App Store). The audience map is in section 7. This is a process rule and it does not change a decision.
4. **RULED, proposal to the founder: reviewer sign-in design.** Replace the default "a review mailbox the founder opens" with "a reviewer-only sign-in path that needs no founder inbox: a dedicated reviewer account whose sign-in code route is designed and tested by security-architect, with the review mailbox as the fallback and the founder opening it only on a day Apple asks". Whether the sign-in service can issue a fixed code for one account is UNVERIFIED (not read). The founder confirms it as F7 because it touches an external account.
5. **RULED: F12, update channel (AD-3).** Server-driven only; security-architect decides whether `expo-updates` is disabled (debate (e)). Removed from the founder list.
6. **RULED: F17, merge order and renumbers.** As the readiness file section 1 says (#599 first, #587 renumbers, the #591 D-entry takes the next free number). Removed from the founder list.
7. **NOT A QUESTION: F16, where internal alerts go.** The founder already named earlyletters@gmail.com; what they may hold is fixed by the privacy rules in `CLAUDE.md` (no letter text, names, transcript or audio). Removed from the founder list.
8. **RULED: Notes control (D-133) moves to Tier 1.** It cites a decision of record.
9. **RULED: Build 1 audit follow-ups (19) get a tag pass.** Product tags each of the 37 rows as Tier 0 or not by Wed 11 Nov. Until then every security, privacy or counsel row in it (BL-573, BL-575, BL-580, BL-587 to BL-593) is treated as Tier 0 for ordering.
10. **FOUNDER: F18, independent security test.** Vendor and spend are his (D-125 item 10 says the cost is unknown and the spend is the founder's). Recommended default: scope and book now; treat the Friends group as "outside the first families" and run the test before it opens; if he wants Friends earlier, record a narrowing of D-125 item 10 as a decision entry. A pen test on a guessed schedule is worse than none, so the scope waits for the hosted project to exist.
11. **FOUNDER: F19, money admin.** Paid Apps agreement, tax and bank in App Store Connect, the accountant before the first payout (CR-120, UNVERIFIED), and the status of Q2-09 (UNVERIFIED). Recommended default: start the agreement on the same day as the App Store Connect record (row 13), because Plus products cannot be sold or reviewed without it (Apple's rule, UNVERIFIED here).
12. **FOUNDER: F11, analytics.** Recommended default: first-party, opt-in, content-free events only, **off in the first submission build and build 12**, switched on in a 1.0.x after Q54 is answered and a decision entry supersedes D-124 item 3. This is a privacy promise and a label answer, so it is not Karma's to rule.

## 7. The six checks

### 7.1 Is Tier 0 complete for a public App Store release on production servers?

No. Seven items were missing or only implied. Status after this review:

| Needed for a public release | Where it lives now | Status |
|---|---|---|
| App Store Connect record | row 13 (D-134, individual publisher) | Covered; founder hands |
| Privacy label | row 12 (worksheet RA-17-01), counsel Q54, photos check | Covered; counsel gates |
| Export compliance (encryption) | row 12, added | Added. The app config carries an encryption key; its value was not read (UNVERIFIED) |
| Support and marketing URLs | row 12 (`/support`, `/subscription-terms`, `/delete-account`; `/support` is 404 on 8 Nov) | Covered; counsel text for some |
| Demo account | row 12, default changed (ruling 4) | Changed |
| Age rating | row 12, founder enters in App Store Connect | Covered; Apple's current questions UNVERIFIED |
| Review notes | row 12 (Notes for Review still describe the on-device app) | Covered |
| Accessibility | row 12, added: VoiceOver and largest text size on the happy path as named evidence rows | Added; no pass has run (UNVERIFIED) |
| Crash reporting | row 11, added: App Store Connect and TestFlight crash reports only, no third-party SDK, nothing with content | Added |
| Rate limits | row 11, added. Limits exist in places (`supabase/auth-email.md`, some migrations); no hosted proof, coverage of sign-in and the API is UNVERIFIED | Added |
| Abuse route | row 11, added: a way to report a problem and a person who reads it; family content is private, so user-generated public content is not in 1.0 (UNVERIFIED against Apple 1.2) | Added |
| Incident process | row 11, added: who is told, in what order, and the kill switch (row 10) | Added |
| Independent security test | new row 4 (D-125 item 10) | Added |
| Consent withdrawal | new row 8 (D-128) | Added |
| Money admin (Paid Apps, tax, bank, accountant) | row 13, widened | Added |
| Adults only, agreement, age signal, country | row 7 | Covered; counsel gates |
| Delete account and erase this phone | row 9 (D-129: ships hidden unless the drill passes) | Covered |
| Backup, kill, rollback, restore | row 10 | Covered |

Audience map (which rows gate which audience; a row can gate more than one):

| Audience | Rows that must be done |
|---|---|
| Family (internal TestFlight, build 12) | 1, 3, 5, 6 (the proof needs 5), 13 (the production steps) |
| Friends (Beta App Review, outside the first families) | all of the Family rows, plus 2 (Q44 answered, policy 0.9.0 live), 4, 7 (agreement and adults only), 8, 9, 10, 11, 12 (demo account and notes) |
| Public (App Store) | all of the above, plus the age signal and country check inside row 7 (AB 1043 starts 1 Jan 2027), the whole of row 12, and counsel sign-off |

### 7.2 Is anything in Tier 1 or 2 really Tier 0, or the reverse?

- **Up:** internal alerts (old 17, Tier 1) becomes Tier 0 and widens to incident process, rate limits, abuse route and crash reporting. Notes control (old 26, Tier 2) becomes Tier 1 (D-133).
- **Down:** numbering clean-up (old 4, Tier 0) becomes Tier 1 hygiene.
- **Split:** the "support route" row keeps its URL part in Tier 0 (row 12) and its "a person answers within a day" part in Tier 1. Recording keeps kill-safety proof (B2-11, 500 of 500, never waived per the gap map) as the exit test for the row.
- **Left alone:** Plus (Tier 1), reminders, names, rating ask, catch-up, family release.

### 7.3 Are dependencies and the critical path right?

Mostly. Corrections:

1. Row 8 (consent withdrawal) and row 7 (agreement) must both be live before the Friends group, not only before Public.
2. The independent test (row 4) needs a hosted project to test (row 5) and the security PRs (row 3). Booking can start earlier than the test; the scope waits for the project. Its calendar length is unknown (no quote), so the Friends dates in `00` section 4 are conditional.
3. Delete account (row 9) and the purge worker's drill need the hosted backend (row 5). Under D-129 the row ships hidden unless the drill passes.
4. Letters on every phone (16) needs sign-in (6) and the hosted backend (5) for real accounts.
5. The money admin (row 13) gates Plus products, which gate row 17's proof. It is a founder-hands task that no existing row held.

### 7.4 Does the order respect the founder's limited hours?

Better after the change, not perfect. The founder-only asks, batched in the order they unblock work:

| When (estimates from the gap map) | Founder-only work | Rows |
|---|---|---|
| Mon 9 Nov | Words of the decision entry (F1, F2); engage counsel and send priority A (F3); pick the Supabase plan (F4); say yes or no to F18 (book a security test) | 1, 2, 4, 5 |
| Wed 11 Nov | Auth setup choices (F6); start the App Store Connect record and the Paid Apps agreement (F19) | 6, 13 |
| Thu 12 to Fri 13 Nov | The production project steps (the gap map's "about 7 hours of dashboard steps"), EAS variables, `db-v` tag approvals; one sitting to read #602 and give the CCO lines on #635 and #520 | 3, 5, 7, 9 |
| Mon 16 to Fri 27 Nov | Two-phone sessions (rows S1-22, S1-28, B2-4, DL-03) in a small number of blocks | 16 |
| After counsel answers | Paste texts, enter privacy label answers, age rating, export and accessibility answers | 12 |

Everything else (recording, flake, reminders, names, audit follow-ups, numbering, 1 Dec block) needs none of the founder's hours except fenced-path reads, which are batched. No hour figure here is new; hours are the gap map's and `06`'s.

### 7.5 Does it match customer needs (01) and ROI (06)?

Where it differs, the reason is written:

- **Recording and Listen** is customer rank 1 and ROI rank 1 (94.2) and sits at new rank 14, not 1, because Tier 0 is a constraint lane: no outside family can use any feature on an unprotected, unrecoverable server (debate (a)). It starts on day one and consumes none of the founder's hours.
- **Reminders** is ROI rank 2 (66.5) and new rank 23: the evidence is HYPOTHESIS and the first step is measuring, not building (`06` 3.3 item 6).
- **Names that learn** is ROI rank 3 (62.0) and new rank 27: HYPOTHESIS-grade (`01` rank 7: zero reviews about language) and the privacy pre-mortem (`04` item 6).
- **Support** is ROI rank 4 (54.1) and new rank 18: the URL part is Tier 0 already; the answering part waits for the founder's hours (about 3, `06`).
- **Rating ask** (ROI 42.2 per ten founder-hours) is new rank 28: native change to batch, low need until the store page is real.
- **Catch-up** is customer rank 6 and ROI rank 10 (25.8), new rank 29: "was not checked" whether backdating exists, so the first step is a code read.
- **Paywall fear** is the loudest review theme (`01` rank 5): the review changes nothing in how Plus is presented; it adds the money admin so the store side is not the surprise.

### 7.6 Does it conflict with decisions on record?

| Decision | Finding | Action |
|---|---|---|
| D-121 item 1 (first store build on-device only) | The founder's route reverses it | Row 1 (decision entry), unchanged |
| D-124 item 3 (analytics off for the 1.0 line) | `08` F11 proposes analytics on for build 12 | Default changed: off in build 12 and the first submission; supersede in a decision entry first |
| D-125 item 10 (external security test before server features open beyond the first families) | Absent from `00` and `08`; Friends dates ignore it | Row 4 added; F18 |
| D-128 (withdrawal control before any friend signs in) | Absent | Row 8 added |
| D-129 (Delete account hidden unless the drill passes) | Consistent | Row 9 says it ships hidden if the drill does not pass |
| D-133 (Notes in v1.0) | Notes control was Tier 2 | Moved to Tier 1 |
| D-126 (no "coming soon" Family surface) | Consistent: co-parent hidden by default | No change |
| D-134 (individual publisher) | Consistent | No change; 5.1.1(ix) risk stays F15 |
| D-100 gate (R-17 shared security review before anyone outside the family signs in; legal pages live before sign-in) | Consistent with rows 2, 3, 12; the independent test is a separate D-125 item | No change |
| D-127 (no paid inference) | Not touched | None |

## 8. Change log

| # | Change | Reason | Evidence |
|---|---|---|---|
| 1 | Added: independent security test (`00` 4, `08` 4), Tier 0 | A decision of record required it and no row carried it | D-125 item 10; CISO, CTO |
| 2 | Added: withdraw sensitive-data consent (`00` 8, `08` 8), Tier 0 | A decision of record required it before any friend | D-128; CPrivO, CCO |
| 3 | Added: local database flake (#533) (`00` 15, `08` 15), Tier 1 | Precondition for any local migration; was buried in a note | `04` R6; CTO, CDO |
| 4 | Promoted and widened: internal alerts becomes alerts, incident process, rate limits, abuse route, crash reporting (`00` 11, `08` 11), Tier 0 | Public service cannot be run blind | CISO challenge 7 |
| 5 | Demoted: numbering clean-up, Tier 0 to Tier 1 (`08` 24), still first on the day-one list | Public build does not depend on it | Median 21; challenge 6 |
| 6 | Moved up a tier: Notes control, Tier 2 to Tier 1 (`00` 19, `08` 21) | D-133 puts notes in v1.0 | D-133 |
| 7 | Widened: founder-hands setup now includes money admin (`00` 13, `08` 13) | CFO: no row held Paid Apps, tax, bank, accountant | CFO; F19; CR-120 and Q2-09 UNVERIFIED |
| 8 | Widened: store pack adds export compliance, accessibility evidence, abuse route (`00` 12, `08` 12) | Tier 0 completeness | Section 7.1 |
| 9 | Default changed: reviewer sign-in (F7) | Contradicts "0 messages to the founder" check | `12` G-16; ruling 4 |
| 10 | Default changed: analytics (F11) off in build 12 and the first submission | D-124 item 3 and Q54 | D-124; challenge 3 |
| 11 | Reordered: Tier 1 now Recording, flake, Letters, Plus, Support, Audit follow-ups, 1 Dec block, Notes, Analytics, Reminders, Numbering; Tier 2 now Co-parent proof, Feedback, Names, Rating ask, Catch-up, Settings regroup, Family release | Median order, with Karma rulings 2 and 8 where they differ | Section 4 |
| 12 | Founder list: F12 and F17 ruled by Karma, F16 not a question; F18 and F19 added | Karma may rule process; spend and promises stay founder | Section 6 |

**Removed:** none. **Split:** support route (URL part Tier 0, answering Tier 1).

### Old to new rank map (`08`)

| Old | New | Old | New | Old | New | Old | New |
|---|---|---|---|---|---|---|---|
| 1 | 1 | 9 | 10 | 17 | 11 | 25 | 30 |
| 2 | 2 | 10 | 12 | 18 | 23 | 26 | 21 |
| 3 | 3 | 11 | 13 | 19 | 19 | 27 | 29 |
| 4 | 24 | 12 | 14 | 20 | 20 | 28 | 31 |
| 5 | 5 | 13 | 16 | 21 | 26 | 29 | 32 |
| 6 | 6 | 14 | 17 | 22 | 27 | new | 4, 8, 15 |
| 7 | 7 | 15 | 22 | 23 | 25 | | |
| 8 | 9 | 16 | 18 | 24 | 28 | | |

### Old to new rank map (`00`)

Old 1, 2, 3 stay 1, 2, 3. Old 4 to 5. Old 5 to 6. Old 6 to 7. Old 7 to 9. Old 8 to 10. Old 9 to 12. Old 10 to 14. Old 11 to 16. Old 12 to 17. Old 13 to 18. Old 14 to 20. Old 15 to 22. Old 16 to 21. Old 17 to 23. Old 18 to 24. Old 19 to 25. Old 20 to 26. New rows: 4, 8, 11, 13, 15, 19. `07-debate.md` refers to "item 11 in the stack rank"; in `00` that is now item 16, in `08` it is item 16 as well (Letters on every phone).

## 9. Residual disagreements and who decides

| # | Disagreement | Held by | Decides |
|---|---|---|---|
| R1 | Do the Friends dates wait for the independent test (D-125 item 10)? | CISO, CTO, CPrivO versus CMO, CBO schedule | FOUNDER (F18) |
| R2 | Analytics in build 12 | CDO, CBO versus CPrivO, CLO, CISO | FOUNDER (F11) |
| R3 | Plus before Letters on every phone | CFO, CBO versus CTO, CPO | Karma ruled (ruling 2); CFO and CBO note it |
| R4 | Recording ahead of the lane | CPO, CDesO, CAIO versus CISO, CCO, CLO, CPrivO | Karma ruled (ruling 1); starts day one in parallel |
| R5 | Reviewer sign-in design | CCO, CISO versus CMO | FOUNDER confirms F7 after security-architect designs it |
| R6 | Money admin timing | CFO versus CCO | FOUNDER (F19) |
| R7 | Whether abuse reporting is needed for 1.0 given private family content | CISO versus CPO | NEEDS EVIDENCE: read Apple 1.2 and the content model |
| R8 | Tier of each of the 37 Build 1 audit rows | CISO versus CPO | Product, by Wed 11 Nov (ruling 9) |

## 10. What this review did not do

It did not run any role independently, read the Project docs, read PR bodies, check Apple's pages, change a decision of record, assign an id, or touch `12-engineering-readiness-audit.md` or `03-requirements/`. Its ranks are one session's judgment and should be read as a map of disagreement.

Executive council: CPO, CTO, CISO, CPrivO, CCO, CLO, CDesO, CFO, CBO, CMO, CDO and CAIO (Claude roles). Rulings signed: Karma.
