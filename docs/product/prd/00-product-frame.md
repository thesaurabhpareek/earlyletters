# The product frame: how every requirement is chosen, designed, measured and kept cheap

Status: Draft v1, 19 Nov 2026. Author: Karma with the Chief Product Officer role; reviewed by the council roles named in section 10. Docs only.

Read in this order: `docs/product/VISION.md` (why and for whom), this file (how we choose and what we optimise), the cards in `docs/product/prd/` (what to build), `13-engineering-plan.md` (size, skills, order), `14-test-plan.md` (how we prove it).

## 1. The people, in one line each

P1 the evening parent, one hand free, often in the dark. P2 the other parent, on their own rhythm. P3 the expecting parent. P4 the family with more than one language. P5 close family, later. P6 {child}, years from now. Full personas and what each must never meet: `docs/prd/v2/02-customers.md` sections 3 and 6.

## 2. How we choose

1. **The job first.** Every card names a ranked job (`02-customers.md` section 4). A request that serves no job is a feature looking for a user.
2. **Kano class.** Must-be items (never lose a letter, works with VoiceOver, quick on a small phone) earn no delight when they work and lose trust when they fail. They are never traded for an attractive item. Each card's class is in section 9.
3. **Five risks.** Value, usability, feasibility, viability (including legal and App Review), and the constitution: could this let the machine add meaning, or count a gap?
4. **Confidence written down.** We have no evidence from our own families yet. Every Value score is a judgment, and confidence on parent behaviour is low. The cheapest way to raise it comes first: the pilot, the hand-sent measures, tester notes.
5. **Appetite before solution.** The limit is review and the founder's time, not building. If an item does not fit its appetite, cut scope, not quality.

The opportunity tree in one view:

| Outcome | Opportunity (the parent's words) | Solutions in this pack |
|---|---|---|
| Families keep letters for years | "I can't lose this" | NS-08 backup readiness, NS-09 let it go finishes, NS-10 new phone, NS-11 save a copy, NS-36 data follows the letter |
| | "I have two minutes" | NS-13 reminders, NS-14 whose book, NS-15 another day, NS-35 one start, NS-34 quick |
| | "I want to go back to it" | NS-01 photo, NS-02 Find, NS-21 letter page, NS-22 calm header, NS-23 one past letter, NS-24 read the year back, NS-06 firsts and seals |
| | "I want them to hear it too" | NS-03 pilot, NS-05 share one letter, NS-25 the other parent, NS-16 someone else speaks |
| | "I want something to hold" | NS-07 print-ready file, NS-30 |

## 3. What we optimise, and how we will know

North Star candidate (`03-goals-and-principles.md` section 4.1): **weekly making families**, families where any author kept a letter in the last 7 days. Business number beside it, never above it: paying families over first-time downloads by install week.

Guardrails are hard stops, not weights: zero lost letters; zero charges outside their triggers; zero paywalls before a parent has seen their words; zero counts of gaps, streaks or guilt lines; zero child names on a lock screen by default.

Analytics is off through the 1.0 line (D-124). So for each measure we say where it comes from today.

| Measure | Serves | Source now | Target |
|---|---|---|---|
| Letters kept per family per week | North Star input | Testers, by hand, numbers only | none set; a baseline first |
| Families with a letter in the last 7 days | North Star | Testers, by hand | none set |
| Paid starts over first-time downloads | Business | App Store Connect sales reports | 5% at week 8 [assumption on record] |
| Lost letters reported | Guardrail | Support and testers | 0 |
| Crash-free sessions | Keeping | App Store Connect, only for users who share diagnostics | 99.8% (C1 exit on record) |
| Reminders still on after 2 weeks | NS-13 | Testers, yes or no | none set |
| Saved a copy this year | NS-11 | Testers, yes or no, and where | none set |
| Find used in a week | NS-02 | Testers, yes or no | none set |
| A recording sent to family in the pilot | NS-03 | The pilot sheet | set in NS-03 section 8 before it starts |
| Speed on an SE 3 | NS-34 | The run sheet | the targets in NS-34 |

Every target above without a number is set only after a first reading. A target with no source in the build that ships is not a target.

## 4. Where everything lives (information architecture)

Three tabs, one verb each. Only Home starts a letter. Elsewhere you can only add to an existing letter, and adding never edits what was said.

| Tab | Verb | What lives there (this pack) |
|---|---|---|
| Home | Say | The prompt; speak, type, not much today; whose book (NS-14); one slip at a time: a waiting draft, Save a copy (NS-11), one past letter (NS-23); a picture first (NS-01) |
| Book | Read | Month chapters; the calm header (NS-22) with Read together, the lens choice, Find (NS-02), Go to a month; the letter page as one list (NS-21) with Share (NS-05), a first, a picture, a seal, the day it is about, earlier versions; read the year back (NS-24) |
| Me | Look after | Account, plan, reminders (NS-13, NS-18), past letters on Home switch, Save a copy (NS-11), take the book with you, storage, privacy, deletion; later, the other parent (NS-25) |

Never a tab: Family, Library, Share. Nothing anywhere says "coming soon" for the other parent.

## 5. Standing inputs for design

Every screen in every card is designed in these states before it is built: first use and empty; normal; many (1,000 letters); offline; slow; failed; the largest text size with Bold Text on an iPhone SE 3; VoiceOver; Reduce Motion; Increase Contrast; dark mode first; a Devanagari letter; a right-to-left letter once that language ships.

Rules from the design language: primary actions in the bottom third, at least 56 pt; targets at least 44 pt; the letter's words in the serif, the app's words small and unsigned; a button for every gesture; no confetti, badges, rings, streaks or celebration; no lock or shield imagery; Apple's control where Apple has one. Motion does less, not more: no ceremony on Find, Share, Firsts or seals.

## 6. Standing inputs for content

Every word a parent reads lives in `packages/content` and passes the rules test: no em or en dashes, curly quotes, ellipsis characters or emoji; no fear, guilt or loss language; never implies the app writes anything; never genders the child (`{child}`); never counts a gap. Parents read only the words in the BRAND.md glossary. Words in these cards are intent. `content` writes them; the founder approves them; anything that is a promise goes in the claims registry and, where it touches privacy, money or safety, to counsel.

## 7. Standing inputs from legal, privacy and compliance

These are the council roles' standing positions. They are not legal advice. Counsel must confirm each legal reading.

- **What leaves the phone.** Nothing new leaves it without a privacy read. A child's voice or picture leaving it needs a security read and a counsel read first (X2; ruling 3).
- **Door lines.** Any card that touches sign-in, an agreement, consent, age, deletion or support has Shown, Records, Never and Decline lines (COORDINATION section 10).
- **Claims.** Every public sentence has a claims registry row and is true of the build that ships.
- **The privacy label** changes in the same build as the behaviour that changes it, never before or after.
- **Children.** The parent is the user; the child is the subject. No feature asks a child to speak or use the app. The open edges are a baby's voice on a recording and a child's picture (counsel packet Q4).
- **Another adult's words.** A letter spoken by someone else, or shared with a second adult, carries another person's data (packet Q2). NS-16 and NS-25 wait on it.
- **Promises with no end date.** None. "Free forever" was replaced on 11 Nov.

## 8. Keeping the cost of building and running low

**Cost of building.** The constraint is review. Small changes with one purpose each; flags that ship dark; existing components before new ones (every card names the one it reuses); on-device logic in pure modules that test without a phone; device time batched into one run sheet per build.

**Cost of running.** The product is built so that most of it costs nothing per family.

| Choice | Why it is cheap | When it starts to cost |
|---|---|---|
| Speech on the phone | No transcription bill per minute | Never per use; model hosting on our pack host is small |
| Sync on Supabase, Free plan (D-159) | No monthly bill at a few hundred families | At the plan's storage, egress or user limits; a weekly check watches them |
| No recording backup yet | Audio is the largest data by far | The day backup turns on (NS-08 sizes it first) |
| Packs on Cloudflare R2 | Free egress | Past the free storage tier |
| Local notifications only | No push service | NS-26 would add one |
| Export through the system share sheet | We store and send nothing | Never |
| No analytics, crash or ad SDK | No vendor bill and no data to protect | If the founder turns analytics on |
| Email only for sign-in and account mail (Resend) | Free tier at this volume | Past its free sends |

Prices and free-tier limits change. They were read on 10 Nov for the exec record and must be read again before any decision rests on them.

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

## 10. Council review

Reviewed on 19 Nov 2026 by the roles below, each played by a Claude session from its skill. Independence is of method only. Findings and how each was answered: `15-council-review.md`.

| Role | Lens |
|---|---|
| Chief Product Officer | jobs, scope, measures |
| Chief Design Officer | states, accessibility, information architecture |
| Chief Privacy Officer, Chief Compliance Officer, Chief Legal Officer | what leaves the phone, claims, consent, children |
| Chief Financial Officer, Chief Business Officer | run cost, Plus, print |
| Karma (CTO) and quality | size, order, testability |
