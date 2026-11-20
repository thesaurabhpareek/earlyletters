# Lifecycle playbook, part 5: proposed backlog

Status: PROPOSED (outside the lock) | 20 Nov 2026 | Owner: `product` | Replaces: none | Load when: turning the playbook into real backlog rows, or deciding what to build next from it.

These rows are working ids PB-01 and up. They are not BL ids and they are not in `docs/BACKLOG.md`. Real ids come when `product` sets them under the numbering rules at the top of the backlog (BL-055 to BL-099 are never used; new ids continue each milestone block; `next-id.mjs` in the #912 rules). This PR does not touch `docs/BACKLOG.md`.

Every row: one PR a reviewer can read in ten minutes, under 400 lines and 20 files. Sizes: S (a few hours), M (about a day), L (several days; split before it becomes a BL row if it will not fit one PR). Mode is `agent`, `human` or `pair`, as in the backlog; `agent` only when no founder account, device, vendor or secret is needed. Owner is a role from `agents/roster.json`. "Founder hands" says whether the founder must do something. "Part" says which content part the row consumes: 01 is `01-experience-content-map.md`, 02 is `02-email-lifecycle.md`, 04 is `04-events-and-festivals-usa.md`. "First" marks a row that needs counsel or a privacy read before any build.

Nothing here contradicts the lock. Where a row would need a rule changed, it depends on a Proposed change (PC-1 to PC-5) in `03-in-app-and-reminder-logic.md` section 14, and waits for an erratum (E83 onward).

## Already covered elsewhere (do not duplicate)

| Existing row | Covers | Playbook items it already holds |
|---|---|---|
| BL-295 | Days library and Home slip (group G18) | Days data, the Days page, the Home day slip, `days.*` keys |
| BL-296 | Cultural store and lock-screen rules (G19) | NS-47 store, neutral lock strings, switches |
| BL-297 | Notification catalogue (G20) | `selectNotificationKey`, the grid, rules tests |
| BL-966 | Budget | `budget.ts` and `chooseOnePerDay` |
| BL-982 | Typed days | Parent-typed days in the plan |
| BL-963 | Slip registry | The Home slip order |
| BL-985 | Quiet book | The quiet-book gate |
| BL-961 | Second account | Two accounts on one phone |
| BL-537 | Back-off (deferred) | NS-13 day-35 back-off |

The PB rows below are only what those rows do not hold: tests that prove the playbook's rules, docs and content corrections, content drops by wave, and the parked push design.

## Order and reason

The waves follow the release drops in `docs/product/prd/22-final-holistic-spec.md` (A, B, C, D) so no row is built before the thing it needs.

- Wave 0, rulings and reads, no code. Nothing can be approved until Karma has ruled the Proposed changes and counsel and privacy have read the sensitive parts. Cheapest, and unblocks everything.
- Wave 1, Drop A, words and corrections only. Safe before any new surface; fixes known drift (email catalog against E75 and E79).
- Wave 2, Drop B, code that proves the rules. The gate pipeline and the neutralising function go before any day data, because they are what keeps a name or a tradition off the lock screen.
- Wave 3, Drop C, the long tail. The full grid, the last-letter layer and the tradition rows, each after its reviewer.
- Wave 4, push, documents only. Designed so the work is not lost; no code, per E79.

## Wave 0: rulings and reads (no code)

#### PB-01 Draft the errata batch for the playbook
- Goal: Karma can rule PC-1 to PC-5 in one pass.
- Scope: a single proposal file listing each Proposed change as an erratum text (next free E83 and CL-158), with the rows it touches and the default. No edit to the errata file.
- Done when: the file is merged; each of the five has a text, a default and a named reviewer.
- Depends on: none (reads NS-13, NS-32, NS-46, NS-48).
- Owner: content. Mode: agent. Size: S. Founder hands: no. Part: none. First: no.

#### PB-02 Counsel brief for the sensitive-background items
- Goal: the questions counsel must answer are in one list before any tradition ships.
- Scope: a brief that collects CUL-Q5, Q6, Q7, Q11, Q-DAY-6, Q-DAY-9, Q-DAY-10, Q-DAY-11, the FR-DAY-23 source licences and the consent line (DPLA Attachment 1 section 2.2), each with what is blocked until it is answered.
- Done when: the brief is merged with each question marked open or answered; none is invented.
- Depends on: none.
- Owner: legal. Mode: agent. Size: S. Founder hands: yes (the founder sends it to counsel). Part: 04. First: it is the first.

#### PB-03 Privacy read of the lock-screen and key conflicts
- Goal: a recorded read of PC-1 (age-free band) and of the day-name and `{child}` rules before any of those strings is built.
- Scope: a review note against E82, E45, NS-47-R12, R13, R38 and the samples in `functions/notification-catalogue.md`, ending in yes or change for each.
- Done when: the note is merged and each sample key is marked allowed, unlocked-only or rewrite.
- Depends on: PB-01.
- Owner: privacy engineer. Mode: agent. Size: S. Founder hands: no. Part: 01, 04. First: it is the read.

#### PB-04 Recruit a reviewer for each tradition before it ships
- Goal: every tradition's day names and wording are read by a member of that tradition (NS-46-R23).
- Scope: a list of traditions in the first drop of part 04, a reviewer role description, the record format.
- Done when: the list and the record template are merged; no tradition row exists without a record.
- Depends on: PB-02.
- Owner: user researcher. Mode: human. Size: S. Founder hands: yes (the founder names or approves the reviewers). Part: 04. First: no.

## Wave 1: Drop A, words and corrections

#### PB-05 Correct the email catalog against E75 and E79
- Goal: no email row promises a push or a marketing message.
- Scope: edit `docs/emails/CATALOG.md` so the billing push and the family pushes are marked superseded by E79; add a `class: transactional` column; no template changes.
- Done when: the catalog and its content test agree; no `commercial` template.
- Depends on: none. Satisfies: LEGAL-REQ-053, LEGAL-REQ-054; E75, E79.
- Owner: content. Mode: agent. Size: S. Founder hands: no. Part: 02. First: no.

#### PB-06 A test that every email template declares its class
- Goal: the LEGAL-REQ-053 rule fails the build when broken.
- Scope: one content test over the email templates ([PBL-T03]) with a planted missing-class fixture and a recorded mutant.
- Done when: the test is green; the mutant turns it red.
- Depends on: PB-05.
- Owner: qa engineer. Mode: agent. Size: S. Founder hands: no. Part: 02. First: no.

#### PB-07 Catalogue phase-1 keys and the rules-test drift
- Goal: the phase-1 grid keys in the first drop pass the rules test, with the `{child}` rules and the neutral rendering.
- Scope: add the phase-1 keys of NS-48 only (the built 8 floor plus the first grid cells); names-off rendering for each; no new surface. Words come from the founder-approved list.
- Done when: the rules test and [PBL-T22] to [PBL-T24] pass.
- Depends on: PB-03; BL-297 is the engine; this row is the words. Satisfies: NS-48-R1 to R14.
- Owner: content. Mode: pair. Size: M. Founder hands: yes (the founder approves the words). Part: 01. First: PB-03.

## Wave 2: Drop B, code that proves the rules

#### PB-08 Gate pipeline simulation harness
- Goal: one test harness runs the section 5 pipeline over the Asha fixture with an injected clock.
- Scope: a test-only module that builds a plan from inputs and prints the date-by-date table; [PBL-T06] to [PBL-T14], [PBL-T41].
- Done when: the Asha table in section 17 of part 3 equals the harness output; each test has its mutant.
- Depends on: BL-966; BL-537. Satisfies: NS-13-R3, R4, R16 to R18; NS-32-R1, R7.
- Owner: reminders owner. Mode: agent. Size: M. Founder hands: no. Part: none. First: no.

#### PB-09 Neutralising function and the render-state tests
- Goal: one function turns a chosen key into a lock-screen title and body by the section 6.4 table.
- Scope: pure function in `packages/core`; [PBL-T23] to [PBL-T26] with a planted violating string; no new strings beyond the three `days.lock.*` keys.
- Done when: tests and mutants pass; the day-name switch is forced off by App lock.
- Depends on: PB-03; BL-296. Satisfies: NS-47-R12, R13, R38; E45; E82.
- Owner: reminders owner. Mode: agent. Size: M. Founder hands: no. Part: 04. First: PB-03.

#### PB-10 Days data rows, United States only, with an oracle test
- Goal: the seasonal, shared and civic days for 2026 to 2030 exist as data, with no date written from memory.
- Scope: rows from part 04 (seasonal and shared, family, civic), each with source and `precision`; `preTicked` false; `n/r` where no source; an oracle table checked by [PBL-T15], [PBL-T16], [PBL-T26].
- Done when: the oracle test is green against a source-checked table; every `publicTitleOk` is hand-listed.
- Depends on: BL-295; PB-04 not needed (no tradition). Satisfies: NS-46-R1 to R16.
- Owner: content. Mode: pair. Size: M. Founder hands: yes (approves names). Part: 04. First: no for these layers; counsel needed only for sources licences FR-DAY-23.

#### PB-11 `days.*` copy keys, one home for event words
- Goal: the words of a day have one key family.
- Scope: add the `days.*` landing and lock keys; remove `ntc.occ.*` and `ntc.season.*` once PC-2 is ruled; rules tests.
- Done when: the rules test passes; no `ntc.occ.*` key remains.
- Depends on: PB-01 (PC-2 ruled). Satisfies: NS-46-R17; NS-48-R8.
- Owner: content. Mode: agent. Size: S. Founder hands: yes (words). Part: 01, 04. First: no.

#### PB-12 Audit every in-app line on next open
- Goal: every in-app line that stands in for a notification uses an existing surface and no count.
- Scope: a table of each line in section 4 with its screen id and key; a scan test that no key holds a count or a gap; no new surface.
- Done when: the table is merged and [PBL-T39] passes.
- Depends on: BL-963. Satisfies: NS-50-R5, R11.
- Owner: design systems. Mode: agent. Size: S. Founder hands: no. Part: 01. First: no.

#### PB-13 Scans for no festival marketing and no push
- Goal: the content rules that keep marketing and pushes out are enforced.
- Scope: scans [PBL-T02], [PBL-T04], [PBL-T40] with planted positives and mutants (no APNs key, no `push_tokens`, no `aps-environment`, no `days.*` key in email, no analytics property for days).
- Done when: the scans are green and each planted fixture is found.
- Depends on: none. Satisfies: E79; NS-46-R34, R47.
- Owner: qa engineer. Mode: agent. Size: S. Founder hands: no. Part: 02. First: no.

#### PB-14 Support macros and one help article for days and reminders
- Goal: support can answer "why did I get that", "how do I stop", and "where is it stored" without saying anything untrue.
- Scope: three macros and one help article drawn from the cards; no promise on delivery; no tradition word.
- Done when: merged and read by `legal`.
- Depends on: BL-295. Satisfies: NS-47-R21 (Clear all); NS-46-R35.
- Owner: content. Mode: pair. Size: S. Founder hands: yes (support wording). Part: 01, 02. First: no.

#### PB-15 October review: the yearly check of the days calendar
- Goal: each October the next year's dates are checked against sources before the table ships.
- Scope: a runbook and an issue template; no code.
- Done when: merged; the first run is dated.
- Depends on: PB-10. Satisfies: NS-46-R15.
- Owner: content. Mode: agent. Size: S. Founder hands: no. Part: 04. First: no.

## Wave 3: Drop C, the long tail

#### PB-16 Full catalogue grid
- Goal: the whole grid (about 128 keys at the floor) is in `packages/content`.
- Scope: the cells of NS-48 beyond phase 1, in batches of one weekday tone at a time if over the line limit; rules tests; no exclamation marks.
- Done when: the rules test and the day-part test ([PBL-T27]) pass.
- Depends on: PB-07. Satisfies: NS-48-R3, R10 to R15.
- Owner: content. Mode: pair. Size: L (split into one PR per weekday tone). Founder hands: yes (words). Part: 01. First: no.

#### PB-17 Last-letter layer with the age-free band
- Goal: the question can follow what the parent last did without implying an age.
- Scope: layer code and keys, including band `any` once PC-1 is ruled; [PBL-T24], [PBL-T29].
- Done when: tests pass; no age implied with names off.
- Depends on: PB-01 (PC-1), PB-03, PB-16. Satisfies: NS-48-R5, R7; E82.
- Owner: reminders owner. Mode: pair. Size: M. Founder hands: yes (words). Part: 01. First: PB-03.

#### PB-18 Tradition rows, one tradition per PR
- Goal: each tradition's days exist only after its reviewer record.
- Scope: rows from part 04 for one tradition at a time; the reviewer record; authority variants with `precision: about`; synthetic test ids only in tests.
- Done when: each PR cites the reviewer record and the licence for its sources; oracle test green.
- Depends on: PB-02, PB-04, PB-10. Satisfies: NS-46-R14, R23; NS-47 counsel items.
- Owner: content. Mode: pair. Size: M each. Founder hands: yes. Part: 04. First: yes (PB-02 answered).

#### PB-19 Day lines chosen by year
- Goal: the day slip line rotates by year with nothing stored.
- Scope: pure function and test ([PBL-T29]) once PC-3 is ruled; keys in PB-11.
- Done when: n consecutive years give n distinct lines.
- Depends on: PB-01 (PC-3), PB-11.
- Owner: reminders owner. Mode: agent. Size: S. Founder hands: no. Part: 04. First: no.

#### PB-20 Settle whether "Not much today" moves the anchor
- Goal: the anchor definition is one sentence.
- Scope: code check and a test after PC-4 is ruled; fix whichever of `prefs.ts` or `lastMadeLetter()` differs.
- Done when: both agree and a test names the case.
- Depends on: PB-01 (PC-4). Satisfies: NS-13-R27; NS-48-R27.
- Owner: reminders owner. Mode: agent. Size: S. Founder hands: no. Part: none. First: no.

#### PB-21 Device walk sheet for the lock screen
- Goal: real-phone evidence for lock-screen privacy.
- Scope: a run sheet for J-CUL-01 and NTC-T24 ([PBL-T42]): Notification Center, Apple Watch mirror, Focus summary, Show Previews Never, App lock on and off.
- Done when: the sheet is merged; the founder records results.
- Depends on: PB-09. Satisfies: NS-47 section 13.
- Owner: qa engineer. Mode: human. Size: S. Founder hands: yes (a real phone). Part: 01, 04. First: no.

## Wave 4: push, designed and parked (documents only)

#### PB-22 Parked push design document
- Goal: the design in section 13 is a filed document a later cycle can use.
- Scope: one document with payload rules, token table plan, consent door lines, entitlement, label, the one-a-day problem. No code, no migration, no key.
- Done when: merged; the scan in PB-13 still passes.
- Depends on: none. Satisfies: NS-26 reopen test; E79.
- Owner: security engineer. Mode: agent. Size: S. Founder hands: no. Part: 02. First: counsel on Q54(d) before any build, not before this document.

#### PB-23 Put the push yes or no on the first tester sheet
- Goal: the NS-26 reopen test gets its evidence.
- Scope: one question on the tester sheet of the first store build: "Would you like to know when the other parent made a letter (yes / no)?"
- Done when: the question is on the sheet; results reported x of n.
- Depends on: a store build with NS-25. Satisfies: NS-26.
- Owner: user researcher. Mode: human. Size: S. Founder hands: yes. Part: none. First: no.

## Summary table

| Id | Wave | Size | Mode | Founder hands | Part | First (counsel or privacy) |
|---|---|---|---|---|---|---|
| PB-01 | 0 | S | agent | no | none | no |
| PB-02 | 0 | S | agent | yes | 04 | is the first |
| PB-03 | 0 | S | agent | no | 01, 04 | is the read |
| PB-04 | 0 | S | human | yes | 04 | no |
| PB-05 | 1 | S | agent | no | 02 | no |
| PB-06 | 1 | S | agent | no | 02 | no |
| PB-07 | 1 | M | pair | yes | 01 | PB-03 |
| PB-08 | 2 | M | agent | no | none | no |
| PB-09 | 2 | M | agent | no | 04 | PB-03 |
| PB-10 | 2 | M | pair | yes | 04 | licences only |
| PB-11 | 2 | S | agent | yes | 01, 04 | no |
| PB-12 | 2 | S | agent | no | 01 | no |
| PB-13 | 2 | S | agent | no | 02 | no |
| PB-14 | 2 | S | pair | yes | 01, 02 | no |
| PB-15 | 2 | S | agent | no | 04 | no |
| PB-16 | 3 | L | pair | yes | 01 | no |
| PB-17 | 3 | M | pair | yes | 01 | PB-03 |
| PB-18 | 3 | M each | pair | yes | 04 | PB-02 |
| PB-19 | 3 | S | agent | no | 04 | no |
| PB-20 | 3 | S | agent | no | none | no |
| PB-21 | 3 | S | human | yes | 01, 04 | no |
| PB-22 | 4 | S | agent | no | 02 | counsel before build |
| PB-23 | 4 | S | human | yes | none | no |

`product`
