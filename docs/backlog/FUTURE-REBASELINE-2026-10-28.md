# Future backlog re-baseline (28 Oct 2026)

Status: Updated 28 Oct 2026 to the staged baseline of D-121 (PR #340). It changes no founder decision and edits no existing backlog item. `docs/backlog/FUTURE.md` (3 Oct 2026) and the five lead files stay the source of item detail. This file does three things: it re-dates the plan, re-ranks existing items on the new evidence, and adds the items the evidence shows are missing.

Evidence used: `docs/prd/v2/research/R6-benchmark-delta-2026-10-28.md`, `R7-sentiment-refresh-2026-10-28.md`, and retro pass 1 (`docs/prd/v2/11-requirement-rules-and-retro-changes.md`). Labels: [F] fact with a source, [S] signal, [A] assumption, [R] recommendation.

## 1. The dates in FUTURE.md are stale

`FUTURE.md` section 1.1 assumes v1.0 is submitted in the week of 2 Nov 2026 and released Mon 16 Nov 2026, then v1.1 in mid-January 2027, v1.2 in mid-March and v1.3 in early May. Since then the founder moved the date (M15, D-100), and on 28 Oct D-121 (PR #340) staged the release: the first store build is on-device only, submitted Tue 1 Dec 2026 and released about Tue 8 Dec [A, CTO analysis: 55% by Fri 11 Dec]. The server features follow in later 1.0.x releases behind existing flags, in this order: sync and co-parent sharing, status report and reminder emails, owner backup, the other six languages. The two scenarios this file first offered (submit 11 Jan or 3 May 2027) are superseded.

The rule from FUTURE.md is kept: a feature release comes about 8 weeks after the one before [A]. Measured from the first binary:

| Release | Date [A] |
|---|---|
| First store build (1.0) release | about Tue 8 Dec 2026 |
| v1.1 | about Tue 2 Feb 2027 |
| v1.2 | about Tue 30 Mar 2027 |
| v1.3 | about Tue 25 May 2027 |

The 1.0.x server stages have no dates yet. Their gates (soak, first families, counsel, an external security test before server features open beyond the first families) set them. Whether the 1.0.x stages take capacity from the v1.1 to v1.3 slots is not established here; FUTURE.md counts 3 releases of 24 person-weeks and does not model them [A, unverified]. A faster first build, Mon 16 Nov, exists only with a founder-signed counsel deferral (D-121).

**What this changes.**
- **G-04 (Mother's Day event, Sun 9 May 2027).** It now falls between v1.2 (about 30 Mar) and v1.3. It can run if its feature ships in v1.2, about 5 weeks ahead. If v1.2 slips more than about 3 weeks it cannot [A]. Event metadata needs no release; the feature does.
- **Father's Day, Sun 20 Jun 2027.** It falls after v1.3 (about 25 May), so a v1.3 feature can serve it, with about 4 weeks of margin [A].
- **June 2027 print go/no-go (BK-14, which depends on BK-13 signal, entity, Print Terms, T5-27).** Re-time to "6 weeks after the first release", about Tue 19 Jan 2027 [A]. The entity gate (D-125 item 6, decision by Fri 13 Nov) is now on its path.
- **Capacity.** FUTURE.md counts about 125 person-weeks wanted against about 72 held. The staged server releases compete for the same people [A].
- **App Review.** It slows in the last two weeks of December (FUTURE.md 1.1, marked unverified there). The 1 Dec submission lands before that; any resubmission after a rejection could land in it.

## 2. Re-rank existing items on the new evidence

Direction only. Items keep their ids and scores in the lead files; the founder or the backlog PM applies the move.

| Item | Move | Why (evidence) |
|---|---|---|
| BK-13 Print-ready book file, BK-14 Printed Year One book | Up | Printed books are the strongest-evidenced gap: Remento 4.8 across 1,748 Trustpilot reviews [S] R6 section 5; Dearest now lists printable books on its App Store page while its website says print is coming soon [F] R6 section 2. Keep the gates already in BK-14 (partners, entity, Print Terms, Apple 3.1.3(e)). |
| BK-03 Sealed letters | Up, small | Dearest lists scheduled sealing under Plus; Vellum sells time capsules to 25 years [F] R6 section 3. Evidence that people use it is thin [R6]. |
| CVL-12 Voice-note import | Hold | Ranked 6th of the gaps in R6 section 5 with thin evidence. Keep its place. |
| FAM-07 Guest author, FAM-04 invites | Hold | The family-engagement loop (alerts, hearts, comments, weekly recap) is 2nd in R6; FAM-07 is the cheapest no-install path. See new item FB-03. |
| T5-12 Legacy contact, T5-14 Face ID lock | Hold | Dearest lists both under Plus [F] R6; no review evidence they decide a purchase. |
| CVL-13, CVL-14, CVL-15 (Siri, lock screen, Watch) | Hold | CarPlay, Watch and widgets are rank 5 in R6; Tiny Treasures lists CarPlay. No evidence of use. |
| G-19 Price level: "are we priced too low?" | Update input | R6: our $49.99 a year equals Dearest, From, Mama and Day One Silver, and sits above FirstChapter ($39.99), Tiny Treasures ($29.99) and BabyPage ($44.99). The 3 Oct reading that we sit at the floor of the category no longer holds. |
| G-12 Plan reminders and the trial timeline | Up | Billing complaints dominate current reviews (30 of the 40 newest Chatbooks reviews, R7). G-12 is the product answer. |
| G-02 App Store optimisation and the name collision | Up | A new app, Early Chapters (Hidden Link Studios, baby monthly chapters plus voice messages), is live and its name is close to ours [F] R6 section 3. Trademark clearance by an attorney is BL-366, not BL-355 (BL-355 is brand fonts). |
| CVL-01, CVL-06 Hindi-English | No change | R6 corrects the Arabic reading (see FB-02); Hindi on-device speech support is unverified. |

## 3. New items (not in FUTURE.md)

Ids use the prefix FB (future backlog, second pass) and are stable. Each item has a testable requirement per RR-1 to RR-6 in `docs/prd/v2/11-requirement-rules-and-retro-changes.md`. Sizes are person-weeks, [A], and the founder or the owning agent may change them.

### FB-01 Billing trust charter

| | |
|---|---|
| Problem and evidence | Billing distrust is the loudest live complaint in the category: 30 of the 40 newest Chatbooks reviews are about price rises, surprise charges, cancelling or expiring credits; 17 reviews describe unreachable support or refused refunds [S] R7. |
| Requirement | F14-REQ-NEW-A, F14-NEVER-1 and F20-REQ-NEW-C in `11-requirement-rules-and-retro-changes.md` section 5. Plus a claim-registry row for every billing sentence (RR-10). |
| Depends on | G-12 (reminders and the trial timeline), D-080 (status report), F20 |
| Size | 1 [A] |
| Owner | Plus agent for the rows, counsel for the wording |
| Open questions | Apple's rules for consent to a price increase (Unverified, check R4). Support capacity for a 2-business-day reply [A]. |
| Release | Fold into v1.0 acceptance rows where a row already exists; the rest v1.1 |

### FB-02 Per-language proof harness

| | |
|---|---|
| Problem and evidence | Apple's `supportedLocales` list is not proof a language works: an Apple staff reply says Arabic was listed in error; a later poster says several languages were unreliable [S] R6 section 4. |
| Requirement | F05-REQ-NEW-D. A recorded test transcription per language on the minimum device passes at each build; the result is stored with the build. |
| Depends on | F05, DR-01 language gates, R5 test sets |
| Size | 1.5 [A] |
| Owner | Transcription agent and native-speaker reviewers |
| Open questions | Hindi on-device speech support has no source either way (R6). Who records and reviews each test clip (native reviewers, cost unknown). |
| Release | v1.0.x, before any language leaves the gate |

### FB-03 Family reactions without a feed

| | |
|---|---|
| Problem and evidence | The family-engagement loop (alerts, hearts, comments, weekly recap) ranks second among gaps in R6 section 5; grandparents seeing the baby is the second most praised theme in the category (R2 section 0 item 7). |
| Requirement draft | Given a family member who can read a letter, When they react to it, Then the author sees the reaction as a single quiet line with no count and no streak, and 0 reactions are shown on letters the author marked private. No public sharing, no feed (the age-rating answer in F21-REQ-NEW-E depends on this staying true). |
| Depends on | F32 contributors, FAM-17 notifications, FAM-01 roles, the age-rating questionnaire answer |
| Size | 3 [A] |
| Owner | Family agent |
| Open questions | Does a reaction break the "never count" voice rule (it does if shown as a number; the draft shows none). Child-safety review before family members other than co-parents appear. |
| Release | v1.2 (circle widens) at the earliest |

### FB-04 Capture by relatives without the app (research item)

| | |
|---|---|
| Problem and evidence | Tiny Treasures sells a family phone line for grandparents [F] R1, R6; relatives without the app are a standing gap (FAM-07 is the nearest existing item). |
| Question to answer first | Is a phone-line recording legal and consented in the states and countries where families live, and what does it cost per minute? Call-recording consent rules differ by jurisdiction and have not been researched here. |
| Output | A one-page legal and cost note by counsel, then a go or no-go. No build before that. |
| Size | 0.5 research [A] |
| Owner | Counsel and the founder |

### FB-05 Monthly market and policy watch

| | |
|---|---|
| Problem and evidence | Prices, ratings and rules moved or were corrected between R1 (3 Oct) and R6 (28 Oct): Apple moved a guideline, corrected an Arabic claim, and several entrants appeared. RR-11 asks that facts older than 30 days are re-checked before they drive a decision. |
| Requirement | Given the 1st of each month, Then a dated delta note lists changes to: competitor prices and plans, new entrants, Apple guidelines and speech languages. Each fact has a source and an open date. 0 undated facts. |
| Output | `docs/prd/v2/research/R#-delta-<date>.md` per month |
| Size | 0.25 a month [A] |
| Owner | An agent run on a schedule, reviewed by the founder; it never edits the PRD directly |

### FB-06 Three studies the desk research cannot answer

Each is a research item with a question, a method and a decision it feeds. Counts are targets [A].

| ID | Question | Method | Decision it feeds |
|---|---|---|---|
| FB-06a Voice for babies | Do parents of babies under 12 months value hearing the recorded voice later, and how? R7 found almost all voice evidence is about older relatives. | 8 to 12 interviews with parents of babies under 12 months, plus a one-week diary with 5 of them | Positioning (voice versus words), print and sealed-letter priority |
| FB-06b Faithful words versus polish | Given the same spoken letter, which version do parents want to keep, and what do they say about a version that rewrites? FirstChapter sells polish at $39.99 a year [R6]. | 12 parents, blind comparison of the raw words, the faithful edit and an AI polish (the polish is shown only in the study, never in the product) | Whether "word for word" leads the store listing; Terms and claim wording |
| FB-06c Heritage language | How do multilingual families record, and in which language do they write? R7 found 0 consumer posts. | 8 to 10 interviews across the seven languages, at least 1 per language where reachable | DR-01 language order, F38 second-language version, F45 |

Size 2 in total [A]. Owner: founder with a research agent for scheduling and notes. Consent and recruiting rules apply (no children's data, no recordings of the child).

## 3b. Engineering follow-ups from the 28 Oct decisions

Each is one owner and one PR. None is started by this file. Founder-only steps are marked.

| Follow-up | Owner | When |
|---|---|---|
| `EXPO_PUBLIC_ENGLISH_ONLY=on` in the `production` profile in `eas.json`, with its three tests (the switch is `capabilities.ts` line 75) | Mobile and release agents | After the 5 Nov go/no-go (`eas.json` is frozen 3 to 5 Nov) |
| Store listing and screenshot rewrite for the staged binary; no seven-language or co-parent claims; no "exactly as you said it" in the subtitle | Store agent, counsel | Before submission |
| Notes for Review: the dormant-code paragraph and the flag list (Apple 2.5.19, 2.3.1(a); F19-REQ-024). Draft in `docs/store/app-store-staged-1.0-proposal.md` | Store agent, counsel | Before submission |
| Hide the co-parent "coming soon" surfaces (Family tab, Settings row, invite screens) in the store build through the existing capability switch (D-126); mobile PR with tests | Mobile agent | After the 5 Nov go/no-go, with the `ENGLISH_ONLY` change |
| Root `.easignore` after a dry run on build 1 (EAS then ignores `.gitignore`; the command and effect are unverified) | Release agent | After build 1 |
| Wire `scripts/guards/docs-leak-guard.mjs` into the seam-guard job in `ci.yml` and `web.yml`; fix the stale comments in `web.yml` lines 18 and 28 | Ops | A `.github` change; founder step under D-122 |
| `scripts/trace.mjs` ID pattern to read sub-IDs (line 33); fix the C-NFR-005 duplicate ID | QA agent | This week, as a branch |
| `plan.ts` backup gate removed to match D-111 item 6, with test updates | Billing path, two reviews | After 5 Nov, before any profile turns backup on |
| F18 re-tagged to v1.1 or later; DR-19 and DR-20 closed in `09`; `08-delivery.md` dates re-based | Docs agents | Separate docs PRs |
| Check the merged backup server (PR #151) against D-108 and F08-REQ-034 | Docs agent | Before anyone edits the requirement |
| Reconcile DR-01 (Hindi needs a tuned model) with counsel packet Q9 (Hindi uses the shared model) | Speech engineer | Before Hindi is scheduled |
| Second private repository for design-level write-ups; Pull requests set to Collaborators only | Founder | This week |
| Replace the stale "issue #127" line in the 4-hourly agent lane prompt | Founder (the update was refused to me) | This week |

## 4. Rules for the new backlog items

1. One item, one owner, one release candidate. A candidate is not a promise.
2. Each item carries Given, When, Then rows with numbers before it is marked ready (RR-1 to RR-6).
3. Evidence is labelled and dated (RR-11). An item whose evidence is one signal says so.
4. An item that needs counsel, an entity, or a partner names that gate in its row and cannot be marked ready before it clears.
5. No item reopens a founder decision. Where one disagrees with a decision, it is listed under "Open questions" with the decision id.

## 5. Sources

- `docs/backlog/FUTURE.md` and `docs/backlog/future/*.md` (3 Oct 2026).
- `docs/prd/v2/08-delivery.md`, `09-decisions-and-risks.md`, `docs/ROADMAP.md` 2.1.
- `docs/prd/v2/research/R6-benchmark-delta-2026-10-28.md`, `R7-sentiment-refresh-2026-10-28.md`.
- `docs/prd/v2/11-requirement-rules-and-retro-changes.md`.
