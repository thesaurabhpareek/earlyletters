# Future roadmap: v1.0.1 to v1.3, one ranked list

Owner: backlog-consolidation PM (merged by the coordinator). Version 1, 3 Oct 2026 (evening). Proposal: nothing here changes a founder decision; where the ranking departs from one, it says so and the question is escalated (DEBATES Q-011).

Built from the five lead files, which keep the detail (problem, evidence, solution, legal, metric) for every item:
- `future/01-capture-voice-languages.md` (pm-1, ids **CVL-01 to CVL-20**)
- `future/02-family-circle.md` (pm-2, ids **FAM-01 to FAM-17**)
- `future/03-book-keepsakes.md` (pm-3, ids **BK-01 to BK-19**)
- `future/04-growth-monetisation.md` (pm-4, ids **G-01 to G-21**)
- `future/05-trust-platform-insights.md` (pm-5, ids **T5-01 to T5-28**)

Ids are stable and never reused. Two commitments that no file scores are listed as **OPEN-01** (safety classifier) and **OPEN-02** (Plus backup and restore) until an owner takes them (DEBATES Q-010). v1.0 and the v1.0.1 engineering tasks are in `docs/BACKLOG.md`; founder steps are in `docs/FOUNDER_TASKS.md`.

Tags as in the lead files: **[F]** fact with a source, **[A]** assumption, **[E]** estimate, **[R]** recommendation.

---

## 0. The plan in five lines

1. **v1.0.1 (by Mon 7 Dec 2026):** a well-timed review ask (G-03), offer codes (G-16), an age signal if counsel says 1 Jan 2027 applies (T5-15), and a counter that tells us how many co-parents use Android (FAM-14 part 6). The trial reminders (G-12) moved **into v1.0** as BL-342, because Subscription Terms 1.4.0 promise them from the first purchase (legal-alignment's Q-003 memo).
2. **v1.1 (about mid January 2027): "hear each other, and be heard right."** Shared voice (FAM-03), word highlight in Read together (CVL-20, BK-01), Hindi and English in one letter with honest markers (CVL-01, CVL-06), On this day (BK-06), family-letter notifications (FAM-17), the voice promise with its guards (CVL-04, T5-08, T5-01), and the safety classifier only with a clinician's sign-off (OPEN-01).
3. **v1.2 (about mid March 2027): "the circle widens, safely."** Web platform and web deletion (T5-17), family members as authors with the safety floor and Report a concern (FAM-01, FAM-11, T5-13), invites where relatives are (FAM-04), the guest author (FAM-07), the web contribution page (FAM-05), names that learn (CVL-03), remote config matured (T5-21), ways to sign in (T5-10).
4. **v1.3 (about early May 2027, before Mother's Day, Sun 9 May): "two homes, two platforms, one year."** Plus follows the book (G-09), Android for co-parents if its gates are met (T5-16, FAM-14), realtime co-parent updates (T5-22), the Year page with birthdays and firsts (BK-04, BK-05, BK-07), prompts v3 (CVL-08), letters that outlast accounts (FAM-12 part 1).
5. **The honest gap:** the five top-10 lists add up to about 125 person-weeks; three releases at about 24 each hold about 72. Roughly 60% fits. Section 5 shows what waits and why.

---

## 1. Planning assumptions and how the ranking works

### 1.1 Dates [A]
- v1.0 submitted in the week of 2 Nov 2026, released on approval, planned as **Mon 16 Nov 2026** (ROADMAP 2.1).
- v1.1 six to eight weeks later (ROADMAP 2.0 section 6): **mid January 2027**. App Review slows in the last two weeks of December [U], so nothing ships then.
- v1.2 **mid March 2027**; v1.3 **early May 2027**, so the Mother's Day in-app event (G-04) can run from about 25 April.

### 1.2 Capacity [A]
- **App lane: about 24 person-weeks per release** (band 20 to 28). Agents write the code fast; the limit is integration, the founder's review and device testing (about 15 to 20 founder hours a week, TDD 10 6.2 [A]), counsel and App Review. Each lead file assumed 10 to 14 person-weeks for its own theme; five themes at that rate would be 50 to 70 a release, which a solo founder cannot review or test. If the first post-launch cycle shows more throughput, pull "next in line" items in the order given.
- **Ops lane: work that needs no app release** (store metadata, website pages, App Store Connect settings, native-speaker review of packs, counsel, the insights loop). It costs founder hours, not app capacity, and is listed separately per release.
- Each release keeps about 1 person-week of the 24 for fixes from the previous release.

### 1.3 Scores are not comparable across files as written
pm-1 and pm-3 count reach out of 5,000 active families a quarter, pm-5 out of 2,000, pm-2 per 1,000, and pm-4 in mixed units (page views, installs, trial starts). This file shows a **normalised score per 1,000 active families** (pm-1 and pm-3 divided by 5, pm-5 by 2, pm-2 unchanged). pm-4's growth items are not comparable ("n/c") and are ranked inside the growth lane by pm-4's own order.

### 1.4 Ranking rules, in order
1. **Floors first.** Legal dates (G-12, T5-15) and safety floors (FAM-11 floor and T5-13 ship with FAM-01; FAM-12 part 1 before about 1,000 books have family members) go before their score says.
2. **Founder commitments** (decision 9: Hindi-English, the safety classifier, word highlight, family hearing recordings, Android, the web page), adjusted only through DEBATES Q-011.
3. **Dependencies:** an item that unlocks others goes first (FAM-03's media pipeline, T5-17's web platform, G-09 before Android).
4. **Normalised score** (section 1.3).
5. **Balance:** every release moves trust, family, the book and capture; none is all plumbing.

---

## 2. Ownership (DEBATES Q-006, converged)

Each item is scored in one file only; the others cite it. Short form of the agreed lines:

| Area | Owner | Cites |
|---|---|---|
| Spoken languages, packs, Hindi-English, prompts library, capture surfaces, photos and voice notes at capture, word timings, accuracy feedback, "we never make a voice", the child's own voice | pm-1 (CVL) | pm-5 enforces the voice rule and runs the accuracy pipeline; pm-2 owns attribution and the media pipeline |
| Shared voice and the media pipeline, roles, invites and approvals, guest author, web contribution page, family pushes, readers and digest content, separation, bereavement (family side), handover at 18 (membership), Android family slice | pm-2 (FAM) | pm-5 owns `apps/web`, Report a concern, the legacy runbook, Android build; pm-4 owns invites as acquisition |
| Read together and highlight UX, sealed and birthday letters, firsts, On this day, Year in letters, audio keepsake, search, Photos, widgets (keepsake kinds), web reader, export formats, print, QR design, gift editions, Book at 18 artefact, themes | pm-3 (BK) | pm-5 owns print checkout plumbing, the QR resolver and the web platform; pm-4 owns packaging |
| Pricing, trials, offers, Plus packaging (Q-008), gifting a digital year, ASO, in-app events, onboarding experiments, first-week loop and reminder cadence, lifecycle email rules, Android pricing, market order | pm-4 (G) | pm-5 for experiment rules (T5-21), privacy programmes (T5-28) |
| Privacy label, claims guards, transparency, portability and shutdown pledge, Vault, AI gateway, data minimisation, recovery and passkeys, Report a concern, app lock, age signals, Android build, `apps/web`, iPad, UI localisation, accessibility beyond AA, remote config, realtime, cost, support, status, insights loop | pm-5 (T5) | all |
| Safety classifier (OPEN-01); Plus backup and restore (OPEN-02) | **open**: proposed pm-5 and pm-2 (Q-010) | |

---

## 3. The ranked roadmap

Columns: **Rank**; **Id**; **Item**; **Owner**; **PW** = person-weeks (app lane) from the lead file; **Score** = normalised per 1,000 families (section 1.3); **Why here**; **Needs** = hard dependencies.

### 3.1 Launch window and v1.0.1 (16 Nov to Mon 7 Dec 2026)

App lane (engineering tasks are BL-343 to BL-345 in `docs/BACKLOG.md`; G-12 is now BL-342 in v1.0):

| Rank | Id | Item | Owner | PW | Score | Why here | Needs |
|---|---|---|---|---|---|---|---|
| L1 | G-12 | **Moved to v1.0 (BL-342):** plan reminders on the device, the trial timeline, "Save a copy" after purchase | pm-4 | (2, in v1.0) | n/c (legal floor) | Subscription Terms 1.4.0 promise them from the first purchase | Counsel may object to the Q-003 memo by Fri 23 Oct |
| L2 | G-03 | Review ask after the fifth letter or first Read together | pm-4 | 0.5 | n/c | Ratings are the cheapest conversion lever for a new app | `expo-store-review` (pair) |
| L3 | G-16 | Redeem an offer code (founding families, support, partners) | pm-4 | 1 | n/c | Tiny; unlocks thanks, repair and partners | App Ready for Sale |
| L4 | T5-15 | Platform age signal | pm-5 | 1.5 | 62 (legal date) | California AB 1043 and Texas SB 2420 may apply from 1 Jan 2027 [U] | Counsel in November |
| L5 | FAM-14 (part 6) | "My co-parent uses Android" choice in the invite sheet, counted only as a k-anonymised server total | pm-2 | 0.5 | 175 | The data that decides Android timing (G-21) must start at launch | A migration range (coordinator) |
| | | Fixes from launch | coordinator | 1 to 2 | | | |
| | | **Total** | | **about 4.5 to 5.5** | | | |

Ops lane (no app release):

| Id | Item | Owner | When |
|---|---|---|---|
| T5-23 | Cost controls: spend cap off after launch with alerts at 150%, PostHog billing limit, monthly 15-minute cost review | pm-5, founder | Launch week (FT-49) |
| T5-26 | Insights loop operated: dry runs during C1, weekly from launch, triage within a working day (D-070: the agent writes files, the coordinator commits) | pm-5, founder | From launch |
| G-02 | ASO: direct links everywhere, Smart App Banner, three custom product pages (Bilingual, Co-parents, Expecting), Spanish (Mexico) listing on the US storefront; trademark screen before submission | pm-4, content, website thread | Pages after release; trademark in October (FT-28) |
| CVL-02 | Native-speaker review of the six language packs (13 paid reviewers), published as re-signed data, no app release | pm-1, founder | Recruit in October (FT-27); tables land by v1.1 |
| CVL-05 (part 1) | Scripted test corpus from reviewers and willing beta families, kept in `experiments/`, evaluation only | pm-1 | With CVL-02 |
| T5-12 (runbook) | Fiduciary runbook and the guardian-as-parent step | pm-5 | Before v1.2 (FAM-01) |
| T5-02, T5-04 | `/trust` and `/security` pages, the portability and shutdown pledge, a published export format | pm-5, website thread | v1.1 window |
| T5-24, T5-25 | Saved replies, help articles from `packages/content`, a status page | pm-5, website thread | v1.1 window |
| G-04 | "Major Update" in-app event for v1.1 | pm-4 | With v1.1 |
| G-15 | Annual trial from 2 months to 1 month for new subscribers (App Store Connect) | founder | Before v1.1 |

### 3.2 v1.1 (about mid January 2027)

| Rank | Id | Item | Owner | PW | Score | Why here | Needs |
|---|---|---|---|---|---|---|---|
| 1 | CVL-04, T5-08, T5-01 | "We never make a voice": the product rule and one calm line, with the claims guard and the privacy-label guard in CI | pm-1 (rule), pm-5 (guards) | 2.5 | 800, 400, 300 | Cheapest trust in the plan; every new claim in this release (shared voice) needs the guard first | Founder approves the constitution line; counsel wording |
| 2 | FAM-03 | Family hear each other's voices (shared voice), Standard escrow scheme, including the `book_access` table that FAM-01 and T5-22 reuse | pm-2 | 4 | 390 | Decision 9; the free family promise is half true without it; photos, the web page and Read together voices ride on it | Wrap-key custody (BL-206 scope), purge coverage for the media bucket (BL-232 scope), privacy copy (BL-205 scope), counsel on LEGAL-REQ-022(a) |
| 3 | BK-06 | On this day on Tonight | pm-3 | 1 | 400 | Highest score per week in the book theme; local only | none |
| 4 | FAM-17 | Family-letter notifications (APNs, no names or text in payloads) | pm-2 | 2 | 228 | Co-parent letters arrive silently in v1.0; FAM-01 and FAM-09 need it | APNs key (founder) |
| 5 | CVL-20, BK-01 | Word timings per language and Read together word highlight with a bedtime layout | pm-1, pm-3 | 6 | 80, 213 | Decision 9; store screenshot 3 assumes it | `entries.alignment` migration (BL-144 scope); CVL-02 test recordings |
| 6 | CVL-06 | "Not written down" markers and tap-to-hear in Review | pm-1 | 3 | 160 | Shows where speech was dropped instead of hiding it; useful on its own, essential with CVL-01 | whisper.rn token probabilities [U] |
| 7 | CVL-01 | Hindi and English in one letter, with the author's script | pm-1 | 6 (3 if the D-031 experiment shows turbo works) | 38 (commitment) | Decision 9 and the core segment; **gate:** the golden corpus meets ADR 0012's bars on device by 30 Nov, else it moves to v1.2 | D-031 (30 Oct), CVL-02 corpus, counsel on fine-tune training terms |
| 8 | OPEN-01 | Safety classifier on the device, behind `safety_card_enabled` | Q-010 (pm-5 proposed) | 0.5 | n/s | Decision 9; **gate:** a perinatal clinician's written sign-off by the v1.1 freeze, else the static row stays | Clinician (BL-105) |
| | | **Total** | | **25** | | | |

**Cut order if short:** (a) CVL-20: word highlight only for languages whose timings pass, sentence level elsewhere (pm-3's call, saves about 1.5); (b) OPEN-01 stays the static row; (c) FAM-17 moves to v1.2 with T5-22. Never cut the guards or FAM-03.

**Next in line** (pull in this order, for example if CVL-01's gate fails or it halves): FAM-04 parts 1 and 2 (token in the fragment, generic previews; 0.5), CVL-03 (2), FAM-07 (1.5), T5-09 (1), T5-21 (2), T5-10 (2).

### 3.3 v1.2 (about mid March 2027)

| Rank | Id | Item | Owner | PW | Score | Why here | Needs |
|---|---|---|---|---|---|---|---|
| 9 | T5-17 | Web platform (`apps/web`) and the full web deletion flow | pm-5 | 3 | 107 | Gates the web page, the web reader and Android (D-042: full web deletion before Android) | BL-114 anonymous guards (done in code); website thread |
| 10 | FAM-01, FAM-11 (floor), T5-13 | Family members as authors with core approvals, the two-parent cap and "private from now on", and Report a concern with safety runbooks: one bundle | pm-2, pm-5 | 5.5 | 140, 63 floor, 213 | The core research job; floor rule: never widen the circle without the floor | FAM-03 (`book_access`), FAM-17, D-050 counsel, D-039 (in v1.0 hardening) |
| 11 | FAM-04 | Invites through WhatsApp, iMessage and WeChat: token in the fragment, the relative's language, an 8-character code, QR, an honest landing | pm-2 | 1.5 (1 if parts 1 and 2 shipped in v1.1) | 200 | Fixes the token-in-path exposure before chat sharing grows | Website thread (`/i` page, AASA), CVL-02 for message wording |
| 12 | FAM-07 | A relative records on the parent's phone (guest author) | pm-2 | 1.5 | 280 | Cheapest no-install path; reused by voice-note import and the shower kit | `entries.spoken_by` migration; pm-3 renders the provenance line |
| 13 | FAM-05 | Web contribution page, phase 1 (record, type, send, return link, delete) | pm-2 | 6 | 63 (commitment) | Decision 9 placed it in v1.1; pm-2 recommends v1.2 behind FAM-03 and FAM-01 (Q-011); the only author path for overseas and Android relatives | T5-17, FAM-01, FAM-03, CAPTCHA vendor, counsel on LEGAL-REQ-010 and -035 |
| 14 | CVL-03 | Names and words that learn from Review, on the phone | pm-1 | 2 | 280 | Names are the accuracy bar; the learning path is not wired | Shared dictionary terms (BL-178 scope) |
| 15 | T5-21 | Remote config matured: one signed source, staged rollout, preview channel, kill-switch drill | pm-5 | 2 | 400 | Experiments (G-01, G-07) and risky content need it | none |
| 16 | T5-10 | Ways to sign in and the recovery runbook | pm-5 | 2 | 240 | Losing an email must not mean losing the book | none |
| 17 | T5-09 | Drop `entries.search` and other dead weight (if not pulled into v1.1) | pm-5 | 1 | 200 | Data minimisation; search stays on the phone (BK-09) | none |
| | | **Total** | | **24.5** | | | |

**Cut order if short:** T5-09, then T5-10 to v1.3; FAM-05 to v1.3 only as a last resort (FAM-07 bridges).

**Android switch:** if more than 20% of co-parent invites report an Android partner by v1.2 planning (FAM-14 part 6 counter, G-21 threshold) **and** an entity exists (D-004), move G-09, T5-16 stage 2 and FAM-14 (10 PW) into v1.2, and FAM-05, T5-10 and T5-09 to v1.3.

**Next in line:** T5-22 (2), CVL-10 with BK-17 (6), G-01 app part (1.5), G-07 (3), CVL-07 (2), FAM-02 (1.5), FAM-11 two homes (2), FAM-09 (2.5).

### 3.4 v1.3 (about early May 2027)

| Rank | Id | Item | Owner | PW | Score | Why here | Needs |
|---|---|---|---|---|---|---|---|
| 18 | G-09 | Plus follows the book: the subscriber's phone writes a coverage date per book (L3), every member's phone honours it | pm-4 | 2 | n/c | Restores D-012 for separated and mixed-platform families; prerequisite for Android co-parents | **Founder: Q-008**; DATA_CLASSIFICATION row and label check (pm-5) |
| 19 | T5-16 (stage 2), FAM-14 | Android app, free and co-parent, with the family slice at parity | pm-5, pm-2 | 6 [E: our split of T5-16's 12] + 2 | 62, 175 | Mixed-platform couples cannot share a book at all today | **Gates (G-21):** entity formed (D-004), T5-17 live, G-09, two monthly retention cohorts; Google Play developer account |
| 20 | T5-22 | Realtime co-parent updates while the app is open | pm-5 | 2 | 160 | The only unmet PRD 7.3 gate in the plan | `book_access` (FAM-03) |
| 21 | BK-04, BK-05, BK-07 | Birthday letters, firsts in the family's own words, and the Year in letters page (one bundle) | pm-3 | 6 | 120, 125, 83 | The launch cohort reaches first birthdays from late 2027; the Year page is made of the other two | CVL-08 prompt text; founder confirms "arrange, never author" and keepsakes Free |
| 22 | CVL-08 | Prompts v3: no near repeats within 90 days, seasonal, opt-in occasions on the device only; firsts and birthday text | pm-1 | 2 | 120 | Feeds the Year bundle and Mother's Day | Content owner; counsel claims check |
| 23 | FAM-12 (part 1) | Letters outlast accounts: "Leave my letters for {child}" in account deletion | pm-2 | 1 [E] | floor | Floor rule: before about 1,000 books have family members (FAM-01 ships in v1.2) | Counsel: a licence that survives deletion |
| 24 | G-01 (app part) | Growth measurement without tracking: device-drawn arms (L2 enum), campaign tokens | pm-4 | 1.5 | n/c | Every later growth change needs a readout | T5-21; counsel on the arm value and label |
| 25 | BK-10 | Save keepsakes to Apple Photos (add-only) | pm-3 | 1 | 80 | A Mother's Day card into Photos | Add-only photo permission string |
| | | **Total** | | **23.5** | | | |

**If the Android gates are not met:** drop rank 19 (8 PW) and pull CVL-10 with BK-17 (6), then BK-13 (start; see section 6).

### 3.5 Later (ranked, with triggers)

| Rank | Id | Item | Owner | PW | Trigger or reason it waits |
|---|---|---|---|---|---|
| 26 | CVL-10, BK-17 | One photo with a letter (system picker, no library access, no faces), and export splitting | pm-1, pm-3 | 4 + 2 | After FAM-03's media pipeline; BK-17 before photos grow exports past the 3.9 GB cap |
| 27 | OPEN-02 | Plus backup and restore of every recording on a new phone | Q-010 (pm-2 proposed) | 3 to 4 [E] | Needs server proof of Plus (Q-008 option (c)); **G-19's price rise should wait for it** |
| 28 | BK-13 | Print-ready book file | pm-3 | 4 | Must ship before the June 2027 print go/no-go (section 6) |
| 29 | G-07 | Onboarding experiment E1: welcome screen versus the 4-story intro | pm-4 | 3 | After T5-21 and G-01 |
| 30 | G-08, G-11 | First-week habit loop with back-off; reminder cadence | pm-4 | 4 + 2 | After measurement exists |
| 31 | CVL-07 | Language chip per letter; transcribe again before save | pm-1 | 2 | Bilingual households; pairs with FAM-07 |
| 32 | FAM-11 (two homes), FAM-02, FAM-09 | Hide for me, visible removals; approval extras; shared family prompts and family rounds | pm-2 | 2 + 1.5 + 2.5 | After FAM-01 |
| 33 | BK-03 | Sealed letters | pm-3 | 4 | Needs a server view and sync change |
| 34 | BK-09 | Search, people and occasions on the phone | pm-3 | 3 | From year two of a book |
| 35 | T5-11, T5-14 | Passkeys by default; Face ID lock | pm-5 | 1.5 + 2 | After passkeys pass device tests |
| 36 | CVL-12 | Voice notes into letters (Voice Memos, then WhatsApp) | pm-1 | 4 | Counsel on a non-user's voice |
| 37 | T5-19 | UI localisation infrastructure and Spanish | pm-5 | 3 | Before any non-US market (G-20) |
| 38 | BK-12, FAM-06, BK-08 | Web reader; readers and digest; the year in voices | pm-3, pm-2 | 6 + 3 + 3 | After T5-17, FAM-03 and the Reader role |
| 39 | CVL-13, BK-11 | Quick capture (Siri, controls, widget) and keepsake widgets, one widget extension | pm-1, pm-3 | 3 + 3 | Promote if beta shows capture friction |
| 40 | T5-16 (stage 3), G-21 | Plus purchase on Android (Play Billing via Q-008 (c) or a fallback) | pm-5, pm-4 | about 4 [E] | After free Android |
| 41 | T5-03 | External pen test with a public summary | pm-5 | 3 (vendor) | Before paid marketing, the public TestFlight link or 1,000 families |
| 42 | FAM-15, CVL-16, CVL-09, CVL-05 (in product) | Multi-book invites and role change; language requests; prompts in the spoken language; per-language accuracy signal | pm-2, pm-1 | 1 + 1 + 3 + 3 | Counsel on Q-004 for CVL-05 |
| 43 | G-10, G-13, G-14, G-17, G-18 | Gifting and shower kit; lifecycle email; invites as growth; win-back; "Plus, paid once" | pm-4 | various | Founder money decisions; G-10's gift needs a server grant |
| 44 | BK-14, BK-15, BK-16, BK-19, BK-18 | Printed Year One (US pilot October 2027), QR codes, gift editions, themes, Book at 18 | pm-3 | 10 + 5 + 3 + 3 + 3 | Print go/no-go June 2027; entity before selling physical goods |
| 45 | T5-05, T5-07, T5-12 (in app), T5-18, T5-20, T5-27, T5-28, T5-06 | Import from other apps; AI gateway (on pm-1 evidence); legacy contact in the app; iPad; accessibility beyond AA; print checkout; market privacy programmes; Vault mode | pm-5 | various | Each on its named trigger |
| 46 | CVL-19 | The child's own voice, parent-only | pm-1 | 4 | Only after counsel's written COPPA opinion (ask now) |
| 47 | FAM-10, FAM-13 (build), FAM-08 | Multi-generation books; handover at 18; two accounts on one phone | pm-2 | various | Decades away or not in 1.x; FAM-13 guardrails are standing rules now |
| 48 | CVL-11, CVL-14, CVL-15, CVL-17, CVL-18 | Video; lock-screen recording; Watch; Cantonese; Indian regional languages | pm-1 | various | Later or not in 1.x |

---

## 4. Dependencies between items

Read "A needs B" as: A cannot ship before B (or ships degraded without it).

| Item | Needs | Notes |
|---|---|---|
| FAM-01 | FAM-03 (`book_access`), FAM-17, FAM-11 floor, T5-13 | Floor rule; D-050 counsel |
| FAM-05 | T5-17, FAM-01, FAM-03, FAM-04 | Web audio uses FAM-03's scheme |
| FAM-06, BK-12 | T5-17, FAM-03, the Reader role | BK-12 is also the landing for printed QR codes (BK-15) |
| CVL-10 | FAM-03 (media pipeline) | Then BK-17 before exports grow; then BK-13 photo layout |
| BK-01 | CVL-20 | Per language; sentence-level fallback |
| CVL-01 | D-031, CVL-02 corpus, CVL-06 | Ship with CVL-06 or not at all (CVL-06 can ship alone) |
| CVL-03 | CVL-02 (phonetic tables for non-Latin scripts) | |
| FAM-04 (languages) | CVL-02 (native wording of invite messages) | |
| BK-04, BK-05, BK-07 | CVL-08 prompt text | Year page needs the other two |
| G-01 arms, G-07 | T5-21 | Price and trial arms compiled into the binary |
| T5-16, FAM-14 | T5-17 (web deletion, D-042), G-09 (Q-008), entity (D-004), Google Play account | G-21's four gates |
| OPEN-02 | FAM-03, Q-008 option (c) server proof | G-19 price rise waits for it |
| T5-22 | FAM-03 (`book_access`) | |
| FAM-12 part 1 | Counsel licence | Before about 1,000 books with family members |
| CVL-04 line | T5-08 claims registry | Founder approves the constitution line |
| BK-14 | BK-13 signal, entity, Print Terms (counsel), T5-27 | June 2027 go/no-go |
| G-12 (BL-342, v1.0) | Q-003 memo (default position) | Before the first purchase, so v1.0 |
| T5-03 | A paid-marketing date (pm-4) | Gate for paid acquisition |
| Every new claim | T5-08 | |

---

## 5. Capacity check

| Release | Window | App lane planned | Capacity [A] | Founder load (main items) | External calendars that cannot be compressed |
|---|---|---|---|---|---|
| v1.0.1 | 16 Nov to 7 Dec 2026 | 4.5 to 5.5 PW | about 8 (three weeks, plus launch support) | Launch support, reviews, refunds watch, AB 1043 with counsel | Counsel on T5-15 in November; App Review (a day or two [A]); Thanksgiving 26 Nov |
| v1.1 | 7 Dec 2026 to mid Jan 2027 | 25 PW | 24 (20 to 28) | Device tests in seven languages (CVL-01, CVL-20), clinician, reviewer sign-offs, shared-voice copy with counsel | App Review slowdown late December [U]; clinician; counsel wording; holidays cut founder hours |
| v1.2 | mid Jan to mid Mar 2027 | 24.5 PW | 24 | Family safety runbooks, web page legal text, Q-008 decision | Counsel (D-050, LEGAL-REQ-010 and -035, worldwide reach of the web page); CAPTCHA vendor DPA |
| v1.3 | mid Mar to early May 2027 | 23.5 PW | 24 | Entity (if Android), Play listing and Data safety form, Mother's Day event | Entity formation 2 to 6 weeks [U]; Google Play review; Mother's Day 9 May |

**What does not fit in v1.1 to v1.3** (top-10 items from the lead files that land Later): pm-1 CVL-05 in product, CVL-07, CVL-10; pm-2 FAM-09; pm-3 BK-03, BK-08, BK-09, BK-12 (BK-13 at risk); pm-4 G-07, G-08 (G-19 is a decision, flagged below); pm-5 T5-03 as a vendor engagement, T5-11. Sum of the five top-10 lists: about 125 person-weeks. Planned in the three releases: 73. The remainder is the first draft of v1.4.

**What would move the plan:** the D-031 experiment shows Roman Hinglish works on turbo (CVL-01 halves: pull FAM-04 and CVL-03 into v1.1); counsel says no to the server-wrapped key (FAM-03 slips, and everything on its pipeline with it); the Android counter passes 20% early (section 3.3 switch); C1 beta shows capture friction rather than accuracy pain (CVL-13 up, CVL-06 down); server aggregates show non-English families well under 30% (CVL-02, CVL-07, CVL-09 down).

---

## 6. Decisions this roadmap needs

**Founder** (with the date it is needed):
1. **Q-011, v1.1 scope** (web page to v1.2, Android free in v1.3 with readiness in v1.2): by Mon 30 Nov 2026, when v1.1 planning starts.
2. **CVL-02 reviewer budget** (about $5k to $8k [E], pm-1) and a contractor template: now (FT-27), because the reviews feed v1.0's per-language go/no-go too.
3. **D-031 Hindi script default:** Fri 30 Oct 2026 (sets CVL-01's default).
4. **The constitution line "The machine never makes a voice"** (CVL-04): before v1.1 planning.
5. **"Arrange, never author"** as the written corollary for keepsakes (pm-3) and **keepsakes Free** (G-19 packaging): before v1.2 planning.
6. **Q-008 Plus follows the book** (G-09): before v1.3 planning, about mid February 2027 (pm-4 asked for v1.2; capacity puts it in v1.3).
7. **D-004 entity:** by Fri 27 Nov 2026 (D-004 hedge). It gates Android, paid marketing (G-06, T5-03) and selling print (BK-14).
8. **Print go/no-go June 2027:** BK-13's signal needs about two months of data, so either pull BK-13 into v1.3 (displacing G-01's app part and BK-10) or move the go/no-go to August 2027.
9. **G-19 price review** for new subscribers: recommended only after OPEN-02 backup ships, since pm-4's case rests on backup and word highlight.
10. Smaller, from the lead files: occasion prompts on the device (CVL-08); Chinese punctuation (CVL-02, CVL-09); leave iOS Writing Tools at the system default; removing a family member needs no veto (FAM-11); worldwide reach of the web page (FAM-05, with counsel); spend cap after launch (T5-23); wind-down reserve (T5-04); pen-test budget and date (T5-03); annual trial to 1 month (G-15).

**Counsel** (pm-5's batch, routed with the v1.0 package where possible): Q-003 (legal-alignment's memo is the default unless counsel objects by Fri 23 Oct 2026); AB 1043 and Texas SB 2420 in November; Q-004 and Q-005; D-050; training-data terms for the Hinglish fine-tunes and Hindi small; the no-synthetic-voice wording; a licence that survives deletion (FAM-12); a non-user's imported voice note (CVL-12); the COPPA opinion on parent-only sounds (CVL-19); recording consent for shower guests (G-10); CAN-SPAM reading of share-sheet messages (FAM-04, G-14); the arm value and the label (G-01); whether native-speaker reviewers are processors (CVL-02); Print Terms (BK-14).

**Coordinator:** Q-010 owners for OPEN-01 and OPEN-02; record Q-006 as converged in DECISIONS; migration ranges when scheduled (FAM-14 counter for v1.0.1; `entries.alignment` and `book_access` for v1.1; `entries.spoken_by` and provenance, the Reader role for v1.2; G-09's coverage column, G-01's arm column and CVL-16's request counter later).

---

## 7. Will not build (combined)

One list from the five files; the source column names each file's section (01 section 5, 02 section 8, 03 section 7, 04 section 7, 05 section 5). Every line holds for all of 1.x unless it says otherwise.

### 7.1 Words and meaning (the constitution)
| We will not | Source |
|---|---|
| Machine-written text of any kind in the product or a keepsake: recaps, titles, captions, summaries, "highlights", story text, memorials, tribute cards, "continue their story" | 03 #1; 02; 05 |
| Translate letters, stored or shown as the letter (a relative may write their own translation as their own letter); translate anything but our own UI words | 01; 05 |
| Transliterate a letter after the fact, or normalise dialects and registers (Arabic dialects to MSA, written Cantonese to Standard Written Chinese, Hinglish to "proper" Hindi or English, Brazilian to European Portuguese) | 01 |
| Generate prompts with AI, or infer prompts from letter content | 01; 02 |
| Cut quotes out of letters for cards, shares, print or recaps; select letters by sentiment, length or "importance" | 03 #2, #3 |
| Let anyone edit or delete another author's words, in any family situation, including a child's sounds recorded by the other parent | 02 |

### 7.2 Voices
| We will not | Source |
|---|---|
| Make any synthetic voice: cloning, text-to-speech in a family member's voice, voice conversion, an AI narrator for Read together, generative speech enhancement, "finish this letter in Nani's voice" | 01; 02; 03 #4; 05 |
| Build a conversational avatar of anyone, living or not | 01; 02 |
| Identify speakers, diarize, make voiceprints, or detect emotion or age from a voice | 01; 03 #12; 05 |
| Put music under voices or generated intros between letters | 03 #4 |

### 7.3 Data, training and tracking
| We will not | Source |
|---|---|
| Train or fine-tune any model on letters, recordings, transcripts or corrections, including server-side "learning from your edits"; ask families to donate real letters, even opt-in, in 1.x | 01 |
| Join analytics ids to accounts, run person-level queries, export cohorts, or sell or share "anonymised" aggregates | 05 |
| Ship session replay, heatmaps, IDFA, an ATT prompt, attribution, MMP or ad SDKs, or ad pixels on our website | 04; 05 |
| Run feature flags or experiments through PostHog (decliners would get a different product) | 05 |
| Build a server-side search index over letter text, or index letters in Spotlight | 03 #14 |
| Infer religion, culture or occasions from language, names or letters; ask for the child's gender | 01 |
| Detect faces, crop by face, read or ask for full photo-library access, or build reels from the library | 01; 03 #12, #13 |
| Upload contacts, "find your family", or send invites or messages for the user (WhatsApp Business API, SMS from us) | 02; 04 |
| Delete inactive accounts or books | 05 |
| Add a third-party support chat SDK, or email or SMS subscriptions on the status page | 05 |
| Build a staff console that shows letter content | 05 |
| End-to-end encrypt letter text in 1.x (Vault covers audio); certificate pinning; a warrant canary; SOC 2 for the consumer product; a paid bug bounty before two clean pen tests; multi-region, read replicas, a hosted KMS or App Attest before their triggers | 05 |

### 7.4 Capture
| We will not | Source |
|---|---|
| Record in the background, auto-start, listen for a wake word, or market "capture conversations" | 01 |
| Switch language silently mid-letter | 01 |
| Make server transcription the default for any language | 01 |
| Import whole chat exports | 01 |
| Ship a second speech runtime or an Apple Watch app in 1.x | 01 |
| Allow photo-only or video-only entries | 01 |

### 7.5 Family and safety
| We will not | Source |
|---|---|
| In-app chat, comment threads, reactions or likes | 02 |
| "Seen by", read receipts, last active, typing or location | 02 |
| Public or link-shareable letters, recaps or recordings; social cards with letter text by default; one-tap sharing of other people's letters into chat apps | 02; 03 #11 |
| Digest emails that carry letter text, names or photos | 02 |
| Accounts for anyone under 18, a kids' mode, a child profile or a child-operated reading mode | 02; 03 #5 |
| A family tree, genealogy or cross-family social graph | 02 |
| Paywalls on family: invites, family authors, approvals, shared voice in shared books, readers | 02 |
| Account switching on one phone in 1.x | 02; 05 |
| Decide custody or "who is the real parent" inside the product | 02 |

### 7.6 Keepsakes and print
| We will not | Source |
|---|---|
| Developmental milestone checklists, expected ages, "early" or "late", milestone notifications | 03 #6 |
| Year stats: per-author counts, most active author, days missed, letters per week | 03 #7 |
| Sell printed books or print credits through in-app purchase, or bundle print credits into Plus | 03 #8; 04 |
| Ship print across borders from a single country | 03 #9 |
| Put QR codes or keepsake links on a vendor's domain or a URL shortener | 03 #10 |
| Show letter text or the child's name on a widget by default | 03 #15 |
| Claim encryption or a time lock for sealed letters | 03 #16 |
| Make other physical keepsakes (canvases, mugs, voice-wave art, recordable toys) | 03 #17 |
| Free-form tags in 1.x | 03 #18 |

### 7.7 Growth and money
| We will not | Source |
|---|---|
| Streaks, badges, points, counts of letters or days, challenges or competitions (including App Store "Challenge" and "Competition" events) | 04 |
| A paywall in onboarding or first run, or a hard paywall; gate writing, reading, playback, export or co-parent writing; shrink Free later | 04 |
| Second-chance discounts, countdown timers or urgency copy; any offer or extra step in the cancel flow, including Apple's retention messaging | 04 |
| Server-signed promotional offers until a server-proof ADR exists | 04 |
| An incentivised referral programme in 1.x | 04 |
| Marketing push notifications; re-engagement, "we miss you", drip or newsletter email; SMS marketing | 04 |
| A web checkout or external purchase links for Plus; selling offer or gift codes | 04 |
| Raise an existing subscriber's price; personalised or behaviour-based prices; "was" prices | 04 |
| Ask only happy users for reviews or offer any incentive; testimonials before they are real and consented | 04 |
| Use real families' letters or voices in marketing without written consent; child-directed marketing or "kids" keywords | 04 |
| Co-registration or contact sharing with hospitals, registries or partners | 04 |
| A lifetime plan without written, irrevocable terms | 04 |
| Launch in Mainland China, Japan or Korea in this horizon | 04 |

### 7.8 Platform and process
| We will not | Source |
|---|---|
| Full server-driven UI, or remote config that touches consent, data collection, the paywall or navigation | 05 |
| Let the insights agent edit `BACKLOG.md`, code, migrations or the catalogue, merge anything, run SQL on production, or tune its own rules | 05; D-070 |

---

## 8. Standing rules adopted from the lead files (no capacity needed)

- **Floor rule (pm-2):** an item that prevents irreversible loss of a family's words, or a safety harm, ships before or with the feature that creates the risk.
- **Arrange, never author (pm-3):** only the family's words and fixed template strings appear in a keepsake; whole letters only outside the app (pending founder confirmation, section 6).
- **Plus packaging (pm-4, G-19):** Plus adds; it never gates what exists. Read together's free count stays 3 and remote config may only raise it. Keepsakes are Free; themes are Plus; one photo with a letter is Free.
- **Handover guardrails (pm-2, FAM-13):** books survive author accounts; the role list can grow an Owner; no design ties a book to the creating parent's account.
- **Every new data flow** gets its DATA_CLASSIFICATION row and a privacy-label check in the same change (pm-5, T5-01).
