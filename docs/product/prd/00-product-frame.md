# The product frame: how every requirement is chosen, designed, measured and kept cheap

Status: CURRENT | Updated: 20 Nov 2026 | Load when: you need the principles, the three-tab IA, or the index of every card (NS-01 to NS-52).

Status: LOCKED 20 Nov 2026, requirements rev 2 (council round 2 and the founder's "Go with all default answers", 20 Nov). Changes after lock need an errata row (next free E number in `18-errata-after-lock.md`) that lists every changed id. Author: Karma with the Chief Product Officer role; reviewed by all twelve council roles in two rounds (section 10). Approved by the founder on 19 Nov 2026: "I approve all requirements." Docs only.

Two layers (founder items 9 and 15 in `FOUNDER-MESSAGES-VERBATIM.md`): the product layer (this folder's cards, `VISION.md`, the one-reading spec) is written from the customer's need and does not depend on BL or PR ids; the execution layer (backlog, `FUNCTION-TRACE.md`, `13-engineering-plan.md`, `23`, `24`) carries BL and PR ids and maps back to NS and R ids. Ids are not stripped from product files by script; they are removed card by card in the next edit of that card (council Part 1 item 8, 20 Nov).

Read in this order: `docs/product/VISION.md` (why and for whom), this file (how we choose and what we optimise), the cards in `docs/product/prd/` (what to build), `13-engineering-plan.md` (size, skills, order), `14-test-plan.md` (how we prove it). Added 20 Nov: card 19 (NS-38 to NS-45), card 21 (NS-46 to NS-50), the one-reading spec `22-final-holistic-spec.md`, and (being written) `23-dependency-map-and-plan.md` and `24-engineering-handoff.md`; cards NS-51 and NS-52 are being written from `26-founder-direction-photos-library-and-media.md`.

## 1. The people, in one line each

P1 the evening parent, one hand free, often in the dark. P2 the other parent, on their own rhythm. P3 the expecting parent. P4 the family with more than one language. P5 close family, later. P6 {child}, years from now. Full personas and what each must never meet: `docs/prd/v2/02-customers.md` sections 3 and 6.

## 2. How we choose

1. **The job first.** Every card names a ranked job (`02-customers.md` section 4). A request that serves no job is a feature looking for a user.
2. **Kano class.** Must-be items (never lose a letter, works with VoiceOver, quick on a small phone) earn no delight when they work and lose trust when they fail. They are never traded for an attractive item. Each card's class is in section 9.
3. **Five risks.** Value, usability, feasibility, viability (including legal and App Review), and the constitution: could this let the machine add meaning, or count a gap?
4. **Confidence written down.** We have no evidence from our own families yet. Every Value score is a judgment, and confidence on parent behaviour is low. The cheapest way to raise it comes first: the pilot, the hand-sent measures, tester notes.
5. **Appetite before solution.** The limit is review and the founder's time, not building. If an item does not fit its appetite, cut scope, not quality.
6. **What Plus holds, and how it grows.** Plus holds one paid act: keeping each new letter beyond the free allowance (the first 2 letters). Each new card makes a kept letter worth more (a picture, findable, shareable, readable by year), so it raises the value of the one paid act without adding a second gate. Every capability that ships free in the 1.0.x line falls under principle 6 and never moves behind Plus (ruled 20 Nov, reversible by the founder). Public copy says nothing either way about the future.

The opportunity tree in one view:

| Outcome | Opportunity (the parent's words) | Solutions in this pack |
|---|---|---|
| Families keep letters for years | "I can't lose this" | NS-08 backup readiness, NS-09 let it go finishes, NS-10 new phone, NS-11 save a copy, NS-36 data follows the letter |
| | "I have two minutes" | NS-13 reminders, NS-14 whose book, NS-15 another day, NS-35 one start, NS-34 quick |
| | "I want to go back to it" | NS-01 photo, NS-02 Find, NS-21 letter page, NS-22 calm header, NS-23 one past letter, NS-24 read the year back, NS-06 firsts and seals |
| | "I want them to hear it too" | NS-03 pilot, NS-05 share one letter, NS-25 the other parent, NS-16 someone else speaks |
| | "I want something to hold" | NS-07 print-ready file, NS-30 |
| Families get to the first kept letter, and a day that matters is not missed | "I do not know where to start"; "I want to mark Mother's Day"; "I have a picture" | NS-38 to NS-45 first run (card 19), NS-46 days we mark, NS-47 cultural background, NS-48 notification catalogue, NS-49 picture-first, NS-50 Home today (card 21), NS-51 photo moments and NS-52 pictures and videos with a letter (card 27, being written) |

## 3. What we optimise, and how we will know

North Star candidate (`03-goals-and-principles.md` section 4.1): **weekly making families**, families where any author made a letter (saved it in any state, kept or waiting at Keep) in the last 7 days. The kept-only version measures Plus as much as habit and sits beside it. Business number beside it, never above it: paying families over first-time downloads by install week.

Guardrails are hard stops, not weights: zero lost letters; zero charges outside their triggers; zero paywalls before a parent has seen their words; zero counts of gaps, streaks or guilt lines; zero child names on a lock screen by default.

Analytics is off through the 1.0 line (D-124). So for each measure we say where it comes from today. Sources available without analytics: App Store Connect installs and sales (wider than the usage metrics, which cover only users who share diagnostics; whether subscription reports cover every purchaser is UNVERIFIED); App Store ratings and public review text; a support inbox tally by fixed category (lost, confused, billing, other), content-free; tester answers by hand; and the export manifest's `counts` block, which a tester can read off and send as numbers only.

Reporting rule: hand-sent numbers are reported as "x of n" and never as a percentage when n is under 20. Each tester round asks at most 5 questions, with fixed wording, versioned in `docs/research/` as aggregates only. Each card's Measures section names its own questions.

| Measure | Serves | Source now | Target |
|---|---|---|---|
| Letters made, and letters kept, per family per week | North Star input | Testers, by hand, numbers only | none set; a baseline first |
| Families with a letter in the last 7 days | North Star | Testers, by hand | none set |
| Paid starts over first-time downloads | Business | App Store Connect sales reports | 5% at week 8 [assumption on record] |
| Lost letters reported | Guardrail | Support and testers | 0 |
| Crash-free sessions | Keeping | App Store Connect, only for users who share diagnostics | 99.8% (C1 exit on record) |
| Reminders still on after 2 weeks | NS-13 | Testers, yes or no | none set |
| Saved a copy this year | NS-11 | Testers, yes or no, and where | none set |
| Find used in a week | NS-02 | Testers, yes or no | none set |
| A recording sent to family in the pilot | NS-03 | The pilot sheet | set in NS-03 section 8 before it starts |
| Speed on an SE 3 | NS-34 | The run sheet | the targets in NS-34 |

Hand-sent measures: testers type numbers into their own message to the founder; the app composes nothing and sends nothing. The founder keeps them in one private sheet, never in the repo or a Claude session, and deletes them 90 days after the tester round ends (ruled 20 Nov). Inventory row (outside the product): tester identity L3, numbers L2; where: the founder's private sheet; synced: no; retention: 90 days after the round; deletion: by the founder, with a dated note; logs: never. Counsel Q44 (tester text) and Q51. Every target above without a number is set only after a first reading. A target with no source in the build that ships is not a target.

## 4. Where everything lives (information architecture)

Three tabs, one verb each. Only Home starts a letter. Elsewhere you can only add to an existing letter, and adding never edits what was said.

| Tab | Verb | What lives there (this pack) |
|---|---|---|
| Home | Say | The prompt; speak, type, not much today; whose book (NS-14); one slip at a time: a waiting draft, a day the parent chose, today (NS-50), Save a copy (NS-11), one past letter (NS-23); a picture first (NS-01, NS-49) |
| Book | Read | Month chapters; the calm header (NS-22) with Read together, the lens choice, Find (NS-02), Go to a month; the letter page as one list (NS-21) with Share (NS-05), a first, a picture, a seal, the day it is about, earlier versions; read the year back (NS-24) |
| Me | Look after | Account, plan, reminders (NS-13, NS-18), Days (NS-46, NS-47), past letters on Home switch, Save a copy (NS-11), take the book with you, storage, privacy, deletion; later, the other parent (NS-25) |

Never a tab: Family, Library, Share. Cards NS-38 to NS-52 add no tab: Home Say, Book Read, Me Look after stand (`22-final-holistic-spec.md` section 1).

No-duplication rule (IA-AUDIT, `docs/design/e2e/IA-AUDIT.md` on branch `docs/e2e-ux-20nov`; applied in `22` section 3): one owner per fact. A second door to a function is a link to the first, never a second list (Days page: R-IA-2; Home is one slip, not a strip: R-IA-3; the Me regroup waits for tree test T1: R-IA-4). Ownership: age math in `packages/core` (R-IA-1); the one-a-day reminder rule in `lib/reminders/budget.ts` (R-IA-6, X6).

Home shows at most one slip, in this fixed order: (1) the existing waiting cards, in their existing order ("Waiting to be kept.", "Recorded before the app closed.", "A recording is ready to read back."); (2) the seal-opened line, on its opening day only (NS-06 B4); (2b) a day the parent chose, today (NS-50); (3) Save a copy, in the birthday week (NS-11); (3b) the Days ask, once, retired after two unanswered showings (NS-47, Q-FD-23); (4) one past letter (NS-23, which replaces the built "A month ago" card). Superseded: this list had ranks 1 to 4 only -> 2b and 3b added (`22-final-holistic-spec.md` section 3; `21-days-cultural-photos-home.md` NS-50). The reminder ask sheet and the Plus line (F14-REQ-040) are not slips and keep their own rules. The photo start belongs to the capture cluster and is never a slip. Test `[FRAME-SLIP]` loads a registry of every slip type, and the build fails when an unregistered type renders. Superseded: any reading that the slip host and registry exist -> not built, the registry is a backlog row (`tools/review/ns46-50/mobile.md` M-13). Nothing anywhere says "coming soon" for the other parent (founder answer of 19 Nov; D-161 as drafted, pending his merge; D-160 stands until then).

## 5. Standing inputs for design

Every screen in every card is designed in these states before it is built: first use and empty; normal; many (1,000 letters, 300 pictures); offline; slow; failed; interrupted (a call, Siri, an alarm, the baby: the app goes inactive mid-action); app killed and relaunched mid-flow; app updated between two steps; low storage (under 1 GB, under 50 MB, per 06-nfr 11.3); Low Power Mode; plan lapsed; signed out; a second account on the same phone; new phone (words present, recordings absent); two books; two parents; expecting parent (due date only); the largest text size with Bold Text on an iPhone SE 3; VoiceOver; Voice Control (visible labels are the commands); Switch Control; Reduce Motion; Increase Contrast; Smart Invert (pictures ignore invert); Differentiate Without Colour (recording state never shown by colour alone); dark mode first; a Devanagari letter; a right-to-left letter once that language ships. Each card's Scenario coverage table says what happens in each.

Undo windows (ruled 20 Nov): every undo window stays open for its stated seconds, or until VoiceOver has finished reading the undo line plus that many seconds, whichever is later; with Switch Control on, until the parent moves on (WCAG 2.2.1; 06-nfr section 8).

Rules from the design language: primary actions in the bottom third, at least 56 pt; targets at least 44 pt; the letter's words in the serif, the app's words small and unsigned; a button for every gesture; no confetti, badges, rings, streaks or celebration; no lock or shield imagery; Apple's control where Apple has one. Motion does less, not more: no ceremony on Find, Share, Firsts or seals.

## 6. Standing inputs for content

Every word a parent reads lives in `packages/content` and passes the rules test: no em or en dashes, curly quotes, ellipsis characters or emoji; no fear, guilt or loss language; never implies the app writes anything; never genders the child (`{child}`); never counts a gap. Parents read only the words in the BRAND.md glossary. Words in these cards are intent. `content` writes them; the founder approves them; anything that is a promise goes in the claims registry and, where it touches privacy, money or safety, to counsel.

## 7. Standing inputs from legal, privacy and compliance

These are the council roles' standing positions. They are not legal advice. Counsel must confirm each legal reading.

- **What leaves the phone.** Nothing new leaves it without a privacy read. A child's voice or picture leaving it needs a security read and a counsel read first (X2; ruling 3).
- **Door lines.** Any card that touches sign-in, an agreement, consent, age, deletion or support has Shown, Records, Never and Decline lines (COORDINATION section 10).
- **Claims.** Every public sentence is true of the build that ships and has a row in the claims inventory, `docs/reviews/2026-10-claims-inventory.md` (section 2 row format), until a claims registry exists (D-123 deferred it). The CMO role keeps it and the CCO role checks each claim against the build (COUNCIL section 4). Claims this pack creates: the Let it go line (NS-09), no name on the lock screen by default (NS-13), languages named in the listing (NS-17), Read together has no limit (NS-24). While recording backup is off, no public surface may imply a recording survives a lost phone.
- **The privacy label** changes in the same build as the behaviour that changes it, never before or after.
- **Children.** The parent is the user; the child is the subject. No feature asks a child to speak or use the app. The open edges are a baby's voice on a recording and a child's picture (counsel packet Q45, packet 1.5.0).
- **Another adult's words.** A letter spoken by someone else, or shared with a second adult, carries another person's data (packet Q48). NS-16 and NS-25 wait on it.
- **System intelligence and writing tools (ruled 20 Nov).** No letter text, child name, picture or prompt is donated to Core Spotlight, NSUserActivity search, Siri suggestions or an App Intents entity (test `[X6-R1]`). System writing tools (rewrite, proofread) are off on every field whose text becomes a letter's words; if the platform cannot turn them off, that is a finding, not a pass.
- **Sign-out (ruled 20 Nov).** Signing out keeps the book on the phone, because deleting it would remove the only copy of the voice while backup is off. The sign-out sheet says so and points to Erase everything. A second account never sees, claims or uploads the first account's letters (`[X4-R1]`), and its screens show nothing about them; the sign-out line is addressed to the person signing out, once (E49).
- **Settings are not agreements.** For toggles, picks and settings: "Records: on the phone only; no PRIV-R21 row, because this is a setting, not an agreement."
- **Inventory home.** Every new data row lands in the same PR in `docs/legal/data-policy.md` section 4 and `DATA_CLASSIFICATION.md`. Before the first row lands, `privacy` with `data-architect` brings data-policy section 4 to Build 12 facts, or the PR names `DATA_CLASSIFICATION.md` as the interim inventory.
- **Counsel numbers** are packet 1.5.0 throughout: Q45 children, Q48 another adult, Q49 and Q50 shared books, Q51 retention, Q53 removing a co-parent, Q54 label, Q41 plan notices, Q43 claims, Q44 testers, Q40 Read together and Terms 8.4.
- **Open-ended promises on record.** Nothing free at v1.0 later moves behind Plus (principle 6); export is never gated; letters are never sold, never used for ads, never used to train models; the 90-day shutdown pledge. Each needs a claims row and is in counsel packet Q16 and Q40. "Free forever" was replaced on 11 Nov and must not come back. Read together: internally it has no session limit and no Plus gate; public copy may say only that it is free, never "forever" or "never limited" (ruled 20 Nov). Claims this pack adds, each with an inventory row: "Pictures stay on this phone" (NS-01), "Find works without a connection" (NS-02), "Sends the words as text" (NS-05 Level 1), "Let it go removes the recording from this phone" (NS-09), "Your words follow you to a new phone" (NS-10, words only), "A copy in open formats" (NS-11). Drift to fix: BRAND.md says the book is shared with your co-parent at v1.0, which is false for store builds (owner `content`).

## 8. Keeping the cost of building and running low

**Cost of building.** The constraint is review. Small changes with one purpose each; flags that ship dark; existing components before new ones (every card names the one it reuses); on-device logic in pure modules that test without a phone; device time batched into one run sheet per build.

**Cost of running.** The product is built so that most of it costs nothing per family.

| Choice | Why it is cheap | When it starts to cost |
|---|---|---|
| Speech on the phone | No transcription bill per minute | Never per use; model hosting on our pack host is small |
| Sync on Supabase, Free plan (D-159) | No monthly bill at the founder's expected few hundred users (8 Nov, relayed) | At the plan's limits (repo runbook `free-tier-ops.md`, read 8 Nov: 500 MB database, 1 GB storage, 5 GB egress, 50k monthly users). The weekly job checks database size and accounts only; storage and egress are read by hand; none of the three D-159 jobs is verified running |
| Nightly database dump to GitHub artifacts | Free | The artifact quota (the runbook warns at 60 MB a file) |
| No recording backup yet | Audio is the largest data by far | The day backup turns on. At the repo's own assumption of about 19 MB per active family per month (ADR 0005), the Free plan's 1 GB holds about 52 family-months, so 300 active families would fill it inside the first month: a flip on the Free plan is not an option (CFO, 20 Nov) |
| Pictures (NS-01) and the Find index (NS-02) | On the phone only | Never on our side; the parent pays in phone space (stored copy plus two smaller copies per picture; size not yet measured) |
| EAS builds | Free up to 15 iOS builds a month (D-092) | Native photo builds and release candidates count; past 15, Starter at $19 a month plus usage (price read 31 Oct or earlier, re-read) |
| Packs on Cloudflare R2 | Free egress | Past the free storage tier |
| Local notifications only | No push service | NS-26 would add one |
| Export through the system share sheet | We store and send nothing | Never |
| No analytics, crash or ad SDK | No vendor bill and no data to protect | If the founder turns analytics on |
| Email only for sign-in and account mail (Resend) | Free tier at this volume | Past its free sends; the limit is not stated here and must be read from Resend's page before relying on it |
| The founder's phones and time for each device run | No cash if he owns the phones | Buying a test phone is his decision; which phones he holds is not recorded here |

Cards that add zero server cost: NS-01, 02, 05 Level 1, 06 A, 07, 09, 11, 13 to 15, 18, 21 to 24, 32 to 37. Every run-cost line must state its read date and whether it is per family, per month or per build (CFO ruling). Prices and free-tier limits change and must be read again before any decision rests on them.

## 9. The master index (every ranked item, tagged)

Rank and size come from `docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`. Card ids NS-01 to NS-07 are the 11 Nov files; NS-08 onward are this pack.

| Rank | Candidate | Item | Card | File | Job | Persona | Kano class | Bucket |
|---|---|---|---|---|---|---|---|---|
| 1 | C-01 | Owner backup of recordings: prerequisites now, flip later | NS-08 | 08 | 1 | P1 | Must-be | A Keeping |
| 2 | N-07 | Discarding sweep and the two silent delete failures | NS-09 | 08 | 1 | P1 | Must-be | A Keeping |
| 3 | N-01 | Device baseline on a small phone | NS-34 | 11 | 2 | P1 | Must-be | F Foundations |
| 4 | N-02 | Accessibility floor pass | NS-33 | 11 | 3 | P1, P6 | Must-be | F Foundations |
| 5 | C-05 | Reminders made real | NS-13 | 09 | 5 | P1 | One-dimensional | B Capture |
| 6 | C-02 | New phone: close-out | NS-10 | 08 | 1 | P1, P2 | Must-be | A Keeping |
| 7 | N-08 | ADR 0028 accepted; export 1.7.0; inventory rows | NS-36 | 11 | 1 | all | Must-be | F Foundations |
| 8 | N-10 | Seal clock | NS-36 | 11 | 3 | P1 | Must-be | F Foundations |
| 9 | N-11 | Split #796; check #798's true size | none (process) | 13 | - | - | - | E Engineering |
| 10 | N-06 | Book list stays light; two photo derivatives | NS-37 | 11 | 3 | P1 | Must-be | F Foundations |
| 11 | N-05 | One capture start and the navigation test | NS-35 | 11 | 2 | P1 | Must-be | F Foundations |
| 12 | C-06 | Photo with a letter | NS-01 | 01 | 3 | P1 | One-dimensional | C Reading and keepsakes |
| 13 | C-17 | Find | NS-02 | 02 | 3 | P1 | One-dimensional | C Reading and keepsakes |
| 14 | C-19 | Family-hears-it pilot (no build) | NS-03 | 03 | 6 | P1, P5 | Research | D Family |
| 15 | C-03 | Save a copy of the year | NS-11 | 08 | 1 | P1, P6 | Attractive | A Keeping |
| 16 | N-03 | Letter page as one list | NS-21 | 10 | 3 | all | Must-be | C Reading and keepsakes |
| 17 | N-04 | Book header calm | NS-22 | 10 | 3 | P1 | One-dimensional | C Reading and keepsakes |
| 18 | C-18 | Share one letter, text first | NS-05 | 05 | 6 | P1, P5 | One-dimensional | D Family |
| 19 | C-14 | Child switcher on Home | NS-14 | 09 | 2 | P1 | Must-be (two books) | B Capture |
| 20 | C-09 | Hands-free spike | NS-04 | 04 | 2 | P1 | Research | B Capture |
| 21 | C-20 | One past letter on Home | NS-23 | 10 | 3 | P1 | Attractive | C Reading and keepsakes |
| 22 | C-07 | A letter for another day | NS-15 | 09 | 3 | P1 | One-dimensional | B Capture |
| 23 | N-09 | One notification budget | NS-32 | 11 | 5 | P1 | Must-be | F Foundations |
| 24 | N-12 | Doc and code drift | none (process) | 13 | - | - | - | E Engineering |
| 25 | C-23 | Firsts | NS-06 A | 06 | 3 | P1 | Attractive | C Reading and keepsakes |
| 26 | C-25 | Read the year back | NS-24 | 10 | 3 | P1, P2 | Attractive | C Reading and keepsakes |
| 27 | C-26 | Print-ready file | NS-07 C28 | 07 | 7 | P1, P5 | Attractive | C Reading and keepsakes |
| 28 | C-21 | Co-parent turned on in store builds | NS-25 | 10 | 6 | P2 | One-dimensional | D Family |
| 29 | C-08 | Someone else speaks | NS-16 | 09 | 6 | P5 | Attractive | D Family |
| 30 | C-12 | Second spoken language (gate) | NS-17 | 09 | 8 | P4 | One-dimensional | B Capture |
| 31 | C-24 | Sealed letters | NS-06 B | 06 | 3 | P1, P6 | Attractive | C Reading and keepsakes |
| 32 | C-10 | Quick capture from a doorway | NS-06 C | 06 | 2 | P1 | One-dimensional | B Capture |
| 33 | C-15 | Typed days in reminders | NS-18 | 09 | 5 | P1 | Attractive | B Capture |
| 34 | C-04 | Earlier versions of my words | NS-12 | 08 | 1 | P1 | Indifferent (likely) | A Keeping |
| 35 | C-11 | Add more to this letter | NS-19 | 09 | 2 | P1 | One-dimensional | B Capture |
| 36 | N-13 | Low Power Mode guard | none (engineering) | 13 | - | - | - | E Engineering |
| 37 | C-33 | Read-along highlight | NS-29 | 10 | 3 | P6 | Attractive | C Reading and keepsakes |
| 38 | C-32 | Photos follow the account | parked | 12 | 1 | P1 | - | G Parked |
| 39 | C-13 | A letter to two books | NS-20 | 09 | 2 | P1 | Indifferent (small group) | B Capture |
| 40 | C-27 | Hosted family link | NS-28 | 10 | 6 | P5 | - | G Parked |
| 41 | C-29 | Push for the other parent | NS-26 | 10 | 6 | P2 | - | G Parked |
| 42 | C-31 | Per-person visibility | NS-27 | 10 | 4 | P5 | - | G Parked |
| 43 | C-28 | Printed Year One with QR | NS-30 | 10 | 7 | P1, P5 | - | G Parked |
| 44 | C-16 | Memory Library | NS-31 (NX-39) | 10 | 5 | P1 | - | G Parked |
| 45 | C-30 | Past-letter widget | parked or refused | 12 | - | - | - | G Parked |
| 46 | C-34 | First-run story cards (new cards) | parked or refused | 12 | - | - | - | G Parked |
| 47 | C-39 | Android | parked or refused | 12 | - | - | - | G Parked |
| 48 | C-40 | Native tab bar | parked or refused | 12 | - | - | - | G Parked |
| 49 | C-38 | Apple Watch | parked or refused | 12 | - | - | - | G Parked |
| 50 | C-36 | Weekly family recap | parked or refused | 12 | - | - | - | G Parked |
| 51 | C-42 | Milestone notes (count style) | parked or refused | 12 | - | - | - | G Parked |
| 52 | C-41 | Paper sounds | parked or refused | 12 | - | - | - | G Parked |
| 53 | C-35 | Gifts and lifetime | parked or refused | 12 | - | - | - | G Parked |
| 54 | C-37 | A Share tab | parked or refused | 12 | - | - | - | G Parked |

Added 20 Nov 2026 (index only; the cards own every row; ranks above are unchanged and these cards carry no rank in `docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md` until the founder rules, see its section 4b). Counts are P0 rows from `tools/review/p0.py` register mode. Drops are card 21 "Release line and cut" (A next build, B 1.0 only if every gate closes before freeze otherwise 1.1, C after 1.0 approval; founder decides, Q-FD-7).

| Card | Item | File | P0 rows | Drop | Bucket |
|---|---|---|---|---|---|
| NS-38 to NS-45 (card 19) | From App Store page to first kept letter: store page, first launch, age and region, sign-in, agreements, first book, first letter and allowance, account life | 19 | 96 (8, 10, 11, 18, 13, 11, 10, 15) | none in the card; Karma to rule | H First run |
| NS-46 | Days we mark | 21 | 22 | B (R14, R20 in C) | B Capture |
| NS-47 | Cultural background | 21 | 27 | B store rules, C ask and traditions | B Capture |
| NS-48 | Notification catalogue and rotation | 21 | 13 | A phase 1, B, C | B Capture |
| NS-49 | Picture-first start and Journaling Suggestions | 21 | 21 | A level 1, C level 2 | B Capture |
| NS-50 | Home today | 21 | 4 | B (R13 in A, R6 and R16 in C) | B Capture |
| NS-51 | Photo moments (level 3, reverses "level 3 closed") | 27 (`27-photo-moments-and-media.md`; direction in `26-founder-direction-photos-library-and-media.md`) | 27 | C, spike first | C Reading and keepsakes |
| NS-52 | Pictures and videos with a letter (limits proposed, founder confirms) | 27 | 26 | C, spike first | C Reading and keepsakes |

All 87 P0 rows of NS-46 to NS-50 are counted above (22 + 27 + 13 + 21 + 4); NS-01 to NS-37 hold 296 (`14-test-plan.md` section 7) plus NS-17-R11 and NS-17-R12 from K17 (298), and NS-51 and NS-52 add 53 (27 + 26). P0 rows in the pack by `p0.py` on 20 Nov: 1,048, of which 534 in NS-01 to NS-52 (298 + 96 + 87 + 53) and 514 in `functions/*.md`; 781 have no row-level backlog row (`BACKLOG-GAPS.md` section 1). The five-card scope has no one cut in the reviews' reading: it stands on planner work that is not built (`budget.ts`, the quiet reader BL-985, typed days BL-982, the slip registry BL-963).

## 10. Council review

Round 1 (19 Nov 2026): two passes covering the CPO, Chief Design Officer and CMO, then the Chief Privacy Officer, CCO, CLO, CFO, CTO and quality (`15-council-review.md`).

Round 2 (20 Nov 2026, after the founder approved the requirements): three passes covering all twelve roles: CPO, Chief Design Officer, CMO and CBO; Chief Privacy Officer, CCO, CLO, CISO, CDO and CAIO; CFO, CTO and quality. About 90 findings per pass were debated, ruled on where roles disagreed, and applied by the product agents card by card (`16-council-review-round-2.md`). Each pass was a separate Claude session playing the roles from their skills. Independence is of method only (one account, one model family). No outside legal source was read by the reviewers; the Apple rules the cards rely on were read on 20 Nov by the main session and are recorded in section 16 of the round-2 record.

Cards 19 and 21 (added 20 Nov): no council round covers them. Card 21 had ten function reviews (`tools/review/ns46-50/`: analytics, compliance, content, design-systems, marketing, mobile, privacy, product, qa, security), recorded in `GAP-LOG.md` RV-1 to RV-17; card 19 has the two inputs under `inputs/`. Both are "Locked v1.0 candidate" pending Karma's rulings (`25-instruction-coverage-audit.md` row 1a). The founder's approval of 19 Nov covers the locked cards 01 to 18, not these.
