# NS-06: Firsts, the sealed letter and quick capture

Status: Draft v1.1, 11 Nov 2026 (UTC). Docs only. Author: `product`. Rank 6 of 7 (closed scope list). Index: `README.md`.
Aligned to `docs/design/specs/04-FIRSTS-AND-SEALED-11nov.md` and `05-HANDS-FREE-CAPTURE-STATES-11nov.md` (PR #794, head at time of writing `038c2dda`, re-read after the updates of 11 Nov; the sealed-letter surface rule FS-R10 is in it). Scope and sequencing (Karma, 11 Nov; the founder said on 10 Nov to include all new scope): Firsts and the sealed letter are IN scope, specified in full here, and not cancelled. The build is sequenced after rank 5 and behind a five-parent study, earliest Build 15. The sealed letter also needs `data-architect` to answer whether a seal syncs before any build.
Three rows of the capability map in one file. Each part has its own job, criteria, free/Plus line and rollout. Part A restates the proposal `NX-44-firsts.md` (PR #790, head `d80db1f2`) as testable rows; NX-44's requirement ids are cited, not copied. Part B is new. Part C depends on the spike in NS-04. Parent-facing strings named in acceptance rows ("This was a first", "hidden until" and the like) are PROPOSED; `content` owns the final words. Hands-free rules (unlock first, no auto-stop on silence, "Still here" after 8 seconds, headphone controls out of scope and UNVERIFIED) are in NS-04.

Terms: "lens", "Firsts lens", "Photos lens" and "Home memory" are internal terms. `content` names the parent-facing words (BRAND.md glossary, CR-25). A parent never reads "lens".

Tags: EVIDENCE = repo file or PR read this session. HYPOTHESIS = about parents. UNVERIFIED = not read or not run. Competitor facts come from `FEATURE-GAP-AND-WEDGE-10nov.md` and are marked UNVERIFIED there: they are pages read, not products run.

---

## Part A. Firsts (letters the parent marks as a first)

### A1. Job to be done

I go to a letter I kept to mark it as a first, in my own words, so that I can find our firsts together later.

### A2. Who and when

A parent after something happened. Never before, never prompted. HYPOTHESIS: parents think in firsts. No parent evidence exists.

### A3. The single capture entry rule

A first is a mark on a letter (an enricher, rule P9). It never creates a letter and never stands alone (NX-44-R6). The control sits on the letter page and in Review. The reading view is a Book lens that exists only when a first exists (rule P3).

### A4. Stories

| Id | Story |
|---|---|
| S1 | As a parent, after I kept a letter about {child}'s first laugh, I mark it and type "laughed out loud". |
| S2 | As a parent, I open Firsts in the Book and read them newest first. |
| S3 | As a parent who marked by mistake, I unmark it in one tap with Undo. |
| S4 | As a parent who never marks a first, I never see the word. |

### A5. Acceptance criteria

| Id | Given, When, Then | Cites | Test title |
|---|---|---|---|
| NS-06-A1 | Given a kept letter, When the parent chooses the mark control, Then the letter carries a mark and an optional label of 40 grapheme clusters or fewer, typed by the parent (iOS keyboard dictation is the system's own and outside the app; an in-app speech-to-text label would be machine text outside `verifyEdits` and is not specified here); the field has no placeholder, no example and no list. | NX-44-R1, R3 | `[NS-06-A1] mark with an optional label, nothing suggested` |
| NS-06-A2 | Given a marked letter, When the parent unmarks it, Then mark and label clear in 1 tap, Undo restores them for 10 seconds, and `final_text`, `raw_transcript` and the recording are byte-identical. | NX-44-R2, R7 | `[NS-06-A2] unmark is one tap, words untouched` |
| NS-06-A3 | Given at least 1 first, Then the Book offers a Firsts lens, newest first, each a normal letter card with the label as its first line. Given 0 firsts, Then no Firsts control, empty state or hint appears anywhere. | NX-44-R4 | `[NS-06-A3] the lens exists only when a first does` |
| NS-06-A4 | Given any number of firsts, Then no count appears on any screen, VoiceOver string, export file name or notification. | NX-44-R5 | `[NS-06-A4] firsts are never counted` |
| NS-06-A5 | Given the code, Then no suggested first, typical age, norm, "most babies", progress element, or machine detection of a first exists. Test: a scan of `packages/content` strings for the Firsts keys against the README appendix A pattern list finds 0 matches, and a scan of the code under the Firsts folder finds no import of a classifier, speech or text-analysis module (the module deny-list is in appendix A). | NX-44 goals and non-goals | `[NS-06-A5] no suggestions and no detection` |
| NS-06-A6 | Given a quiet day, Then it cannot be marked. | NX-44-R6, D-084 | `[NS-06-A6] quiet days cannot be marked` |
| NS-06-A7 | Given an export, Then mark and label are plain fields and the PDF book shows the label above the letter, only when present; the export schema version moves (ADR 0027). | NX-44-R8 | `[NS-06-A7] export carries the mark and label` |
| NS-06-A8 | Given sync, Then the mark and label sync with the letter, later write wins for them only, and the words follow existing sync rules. Given delete and restore, Then they go and return with the letter. | NX-44-R7, U3, U4 | `[NS-06-A8] mark and label travel with the letter` |
| NS-06-A9 | Given Find (NS-02), Then the label is searchable and nothing else about the mark is. | NS-02-R5 | `[NS-06-A9] Find sees the typed label only` |
| NS-06-A10 | Given the analytics catalog, Then it holds no event about marks. | NX-44-R12 | `[NS-06-A10] no analytics event for firsts` |
| NS-06-A11 | Given VoiceOver, AX5, Reduce Motion, Then the mark is a labelled toggle that announces its state; the lens reads in order. No celebration animation exists. | NX-44-R10 | `[NS-06-A11] the mark toggle passes VoiceOver and AX5` |
| NS-06-A12 | Given every Firsts string in `packages/content`, Then the content rules test passes and none matches the pattern list in README appendix A (gap, norm and counting words). | NX-44-R11 | `[NS-06-A12] Firsts strings match no forbidden pattern` |

### A6. Edge cases

Label empty is allowed (card shows the letter's own first line). Label at 40 stops the field and says nothing else. A letter in a hidden book hides its mark. Servers off works on the phone and syncs later. A parent who wants suggestions gets none: same answer as "make it nicer".

### A7. Privacy and constitution

Machine adds nothing: the label is the parent's or absent. No count, no streak, no badge. Door lines: Shown "This was a first" and the optional field (`content`); Records one boolean and up to 40 characters on the letter; Never a list, a count, a notification or an event; Decline do not mark, or unmark in one tap.

Label effect (Part A): none. Marks sync with the letter as any letter field does.

### A8. Free vs Plus

Free and ungated when built; not promised as forever. Marking and reading firsts work after the allowance is used (D-082: allowance 2, planned raise 2, 5, 10; capture never blocked; what a family kept stays theirs to read, hear and export).

### A9. Metrics (content-free)

None in the app. A five-parent concept study decides whether to build. Build trigger (PROPOSED, set before the study): at least 3 of 5 parents say they would mark a first without being asked, and for no more than 1 of 5 is a suggestion list the reason for or against. A request for a list is recorded as a signal for the founder, not a requirement (NX-44 section 7).

### A10. Dependencies, risks, rollout

Dependencies: Book lens frame (rule P3), a local migration for two fields, export schema bump, NS-02 for the label. Risk: a "first" mark becomes a milestone tracker; mitigations are A3, A4, A5. Rollout: flag `EXPO_PUBLIC_FIRSTS` (proposed). Target: sequenced after rank 5 and the five-parent study, earliest Build 15; Build 13 and Build 14 carry no Firsts. Firsts is in scope: if the study has not run, the build waits for it. It is not cancelled, and the old NX-44 FD-1 line "default: not built" is superseded by the founder's include-all-scope ruling.

---

## Part B. The sealed letter ("open on a day I choose")

Wording rule (design spec 04): the app says "hidden until" and never "locked"; the word "sealed" in the UI is a `content` and counsel decision. Source: PRD V2 F41 ("Sealed letters", later, light spec) and the capability gap G5 in the research file. BK-03 is cited by the exec record as size L (needs `sealed_until`, a security-barrier view and a sync change). I did not open BK-03; UNVERIFIED.

### B1. Job to be done

I go to Review, after I have said something to {child}, to seal it until a day I choose, so that it stays unread by everyone else until then.

### B2. Who and when

A parent with a letter meant for a later day (a birthday, a school day). HYPOTHESIS. The child cannot read the book today (no child-facing input, PRIV-R20), so the benefit today is the author's own: a letter held back on their own phone until a day they chose. Nobody else receives it before that day (NS-06-B8).

### B3. The single capture entry rule

Sealing is an enricher chosen in Review or on the letter page for a letter that exists. It does not start a letter. Home stays the only start.

### B4. Acceptance criteria (specified now, built later)

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-06-B1 | Given a letter in Review, When the parent picks a day later than today, Then at the moment of sealing the app stores one absolute UTC instant, the author's local midnight at the start of that day in the device's time zone at that moment, and nothing else about the words changes. The letter opens when now is at or after that instant (design spec 04, FS-R7). Reconciliation: ADR 0028 D3 stores `sealed_until` as a calendar date with a UTC-plus-grace rule for other readers; this row's absolute UTC instant differs from that calendar date, and `data-architect` reconciles the two (one stored field or two) and answers by Fri 20 Nov 2026, before any build. | `[NS-06-B1] sealing stores one instant and nothing else about the words` |
| NS-06-B1b | Given a seal made on 1 Jan in UTC-8 for 10 Jan, When the device zone is set to UTC+14 and the clock reads one minute before the stored instant, Then the letter is still closed; at the instant it is open; a zone change never moves the instant (design FS-R7). | `[NS-06-B1b] a seal made in UTC-8 stays closed at UTC+14 until the instant` (clock and zone injection) |
| NS-06-B2 | Given a sealed letter before its day, Then the Book shows one row with the date and "hidden until" wording (words by `content`; never "locked"), and no words. The letter contributes nothing to the Photos lens, the Firsts lens, the recordings list, a first label, a photo description, Find, Share, Read together or the PDF book until it opens, and adds nothing to a Home memory before its opening day (design spec 04, FS-R10, which now also lists the month opener excerpt, the Home day card and Recently deleted). Exception (FS-R11): the author's own data export (the ZIP from "Export your book") carries the sealed letter whole, words and seal date; the PDF book and any other person's export never carry its words until the seal is removed. | `[NS-06-B2][FS-R10] a sealed letter contributes nothing to any surface until it opens` |
| NS-06-B3 | Given the author, When they choose Open now on the sealed letter, Then, after one confirmation whose default button is Cancel, the seal is removed permanently and the letter reads normally. It cannot be sealed again (design spec 04, B4); to hide it again the parent would write a new letter. The letter is never lost, and what a family kept stays theirs to read. | `[NS-06-B3] the author can open early; opening removes the seal for good` |
| NS-06-B4 | Given the stored instant passes, Then the letter becomes a normal letter with no notification, no badge, no count and no celebration. On that day only, Home's one memory slot may show it once through `seal.homeOpened` (design spec 04, Q4 and FS-R3): one line, the letter's words appear only when the parent taps. That slot is allowed; it is not a notification, a count or a celebration. | `[NS-06-B4] opening day is quiet; the Home slot shows it at most once` |
| NS-06-B5 | Given the export, Then a sealed letter is included with its words and a `sealed_until` field. The data export (ZIP) is the author's own and includes the words; the PDF book omits them until the seal is removed (FS-R11). Copy never says "locked", "secure" or "sealed forever": the words are on the phone, and on the author's own phone a seal is a display rule the app keeps in its screens, not encryption, so it is never called secure or locked. Another person's phone gets nothing before the day (NS-06-B8). Only the author's own export holds the sealed words; no other person's export or view does. | `[NS-06-B5] export keeps sealed letters whole` |
| NS-06-B6 | Given one visibility function, Then every surface (Book, Home memory, Read together, Find, Firsts, lens, share, export view for others) calls it; a test lists the call sites and fails on a surface that does not. | `[NS-06-B6] one visibility path` |
| NS-06-B7 | Given the allowance, Then a sealed letter counts when it is kept like any letter (D-103); sealing never makes a letter free or hidden from the count. | `[NS-06-B7] sealing does not change counting` |
| NS-06-B8 | Author-only seal (ADR 0028 D3; Karma's ruling of 11 Nov). Given a sealed letter and a second phone in the same book, When the second phone syncs at any time before the opening instant, Then that phone receives 0 bytes of the words, no row, no seal date, no sealed marker and no placeholder for the letter, and its book, counts, Find, lenses, Read together and export show nothing of it. At and after the opening instant the letter reaches the second phone through ordinary sync as a normal letter. A design that syncs the words and only hides them on the other phone is NOT acceptable and must never be called secure. The sealed letter is not counted for anyone else: no count, row or marker on another phone, and it never counts toward another person's allowance (D-103: only the author's own kept letters count, and the author's count is NS-06-B7). `data-architect` decides the mechanics (how the letter is published at the instant if the author's phone is offline then) and answers by Fri 20 Nov 2026. | `[NS-06-B8] before the instant a second phone gets 0 bytes, no row and no marker; after it, a normal letter` (two-phone sync test with clock injection) |
| NS-06-B10 | Given a quiet-day mark (no words, D-084), Then the seal control is absent on it and any attempt to write a seal for it is refused. | `[NS-06-B10] a quiet day cannot be sealed` |
| NS-06-B9 | Given every seal string in `packages/content`, Then the content rules test passes and none matches the README appendix A patterns, including the loss words list and the word "locked". | `[NS-06-B9] seal strings match no forbidden pattern` |

### B5. Edge cases

Seal date in the past is refused (the control offers only later days). A time zone change never moves the stored instant, so it never opens a seal early; a clock set forward by hand on the author's phone can show the letter early on that phone, and the app does not claim to prevent that (a display rule on the author's own phone only). Co-parent live: the other parent's phone has no row and no words for a sealed letter until the opening instant (NS-06-B8); there is no 'closed row' on their side. A child's 18th birthday as a date is allowed as an ordinary date; "open at 18" wording and any duty to deliver to a minor are counsel's (BK-18 and FAM-13 per the exec record; not read by me).

### B6. Privacy and constitution

No machine adds meaning. The seal changes visibility only. Door lines: Shown the date control and one plain sentence of what a seal does (by `content`); Records the seal (the instant of NS-06-B1) on the author's phone only; it does not sync to any other phone before the day (NS-06-B8); Never a notification, a count, "sealed N letters", or reading a sealed letter into search; Decline do not seal, or Open now.

Label effect (Part B): none while the seal stays on the phone and in ordinary sync; `data-architect` confirms.

### B7. Free vs Plus

Free and ungated beyond the allowance rule when built (earliest Build 15); not promised as forever. A sealed letter is a kept letter. No separate Plus feature (one gate, closed X3).

### B8. Metrics

None. Study: a five-parent study (rule from Karma, 11 Nov; replaces the 8-parent concept cards in the exec record's default); pass line PROPOSED, at least 4 of 5 say they would seal one letter in the first year and none describe it as a way to hide from the other parent.

### B9. Dependencies, risks, rollout

Dependencies: backup and new-phone sync right and shipped (C29, C30), counsel on minors, the one visibility path (F41 note), a sync change so that the letter is published to other phones only at the opening instant (NS-06-B8), local and server migrations. Risk: a seal that hides a letter from the author would break "stays theirs" (B3 prevents it). Rollout: flag `EXPO_PUBLIC_SEALED_LETTERS` (proposed); no build until ranks 1 to 5 are done, the five-parent study passes and `data-architect` has answered. Target: earliest Build 15; not otherwise scheduled. Default if no one decides: the build waits; the spec stands.

---

## Part C. Quick capture (the four doorways: `widget`, `controlCenterControl`, `actionButton`, `siri`)

### C1. Job to be done

I go to a doorway (widget, Control Center control, Action Button or Siri phrase) to open Home's capture in one touch, so that a thought is not lost while my hands are busy.

### C2. The single capture entry rule

Every quick-capture trigger (one of the four doorway names above, passed as `source` to the single `startCapture({source})` function; design navigation test N3 and the step 0 consolidation are prerequisites) opens Home's one Listen screen in the Ready state (F04 widget row). None records on its own (NS-04 EX-2). None keeps a letter. A trigger is a door to Home's capture, not a second capture.

### C3. Acceptance criteria (conditional on NS-04)

| Id | Given, When, Then | Test title |
|---|---|---|
| NS-06-C1 | Given a trigger that passed NS-04 EX-1 to EX-4, When the parent uses it, Then the Listen Ready state opens through the same route as Speak; a second start while a take is active is refused (F04-U23). | `[NS-06-C1] every trigger lands in the one Listen screen` |
| NS-06-C2 | Given a widget or control, Then it is static: no child name, no letter text, no data (F04-REQ-020). | `[NS-06-C2] triggers carry no data` |
| NS-06-C3 | Given the built plist, Then it contains no app group, no `UIBackgroundModes` and no location unless the founder has recorded a decision (NX-39-R4, R51; preflight script). | `[NS-06-C3] the plist delta equals the approved delta` |
| NS-06-C4 | Given a hands-free start that ends, Then the letter is a draft ("Waiting to be kept") with its recording; 0 kept letters come from a trigger. | `[NS-06-C4] a trigger never keeps a letter` |
| NS-06-C5 | Given the strings for the doorways, Then copy never says "while driving" and never counts how often a trigger is used, and none matches the README appendix A patterns. | `[NS-06-C5] doorway strings match no forbidden pattern` |

### C4. Privacy and constitution

No always-on microphone. No wake word. Machine adds nothing. Door lines (written per trigger in NS-04b): Shown the plist purpose string and one line in Settings; Records the act only if a new permission is granted; Never audio before the parent's action; Decline remove the trigger in iOS and nothing else changes.

Label effect (Part C): none from a Siri phrase or Shortcut if it needs no new permission; a widget or control is a delta NS-04 lists.

### C5. Free vs Plus

Free and ungated when built; not promised as forever. Capture is never blocked. A trigger-started draft waits as any draft does. Keep after the allowance (D-082) is the one gate. No Plus line mentions triggers.

### C6. Metrics, dependencies, risks, rollout

Metrics: none in the app; `capture_started` with a `source` value only if analytics opt-in is on and `data-analyst` adds the values. Dependencies: NS-04 findings; F04; the preflight rules. Risks: the plist rules block the trigger (NS-04 PARTIAL branch). Rollout: after the NS-04 read-out; a Shortcuts/Siri phrase first if it needs no new target, the widget or control only if the delta is approved. Target: earliest Build 15 for all of Part C, in line with the README and the header of this file (Build 14 is the slot for Share Level 1, and NS-04 does not start until the Monday after Build 13 is cut). Flag: `EXPO_PUBLIC_QUICK_CAPTURE` (proposed), one flag for the doorways, each doorway also off by its own `source` entry in remote config (proposed). A Siri or Shortcuts phrase goes first if it needs no new target; the widget and Control Center control only if the plist delta is approved.

---

## Open questions (every one has a default)

| Id | Question | Owner | Default if no answer | By |
|---|---|---|---|---|
| OQ-A1 | When does the five-parent Firsts study run? | Founder | After Build 13 ships; the build waits for it (earliest Build 15). | Fri 20 Nov 2026 |
| OQ-A2 | Place of the mark control on the letter page | `design-systems` | A quiet action in the letter's action row | Design spec |
| OQ-B1 | When is the sealed letter built? | Founder | In scope; earliest Build 15, after rank 5, the five-parent study and the `data-architect` answer | Fri 20 Nov 2026 |
| OQ-B2 | Seal mechanics for other phones (ruled: author-only, nothing reaches another phone before the day, ADR 0028 D3). What remains: how the letter is published at the instant, and how the absolute UTC instant (NS-06-B1) is reconciled with ADR 0028's calendar-date `sealed_until` (one stored field or two) | `data-architect` | The instant stays the author's device rule (NS-06-B1); the stored form follows ADR 0028 D3 unless `data-architect` rules otherwise. No build before the answer. | Fri 20 Nov 2026 |
| OQ-C1 | Siri phrase before widget? | `mobile` after NS-04 | Yes, if it needs no new target. | NS-04 read-out |

## Not fully testable

NS-06-A11, NS-06-B8 and all of Part C need devices or counsel reads. Part B is specified for a build that has no date. Part C cannot be tested before NS-04 runs. Study pass lines in A9, B8 are proposals.
