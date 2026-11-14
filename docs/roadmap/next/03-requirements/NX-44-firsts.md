# NX-44: Firsts: letters the parent marks as a first, in the parent's own words (PROPOSAL, founder decides first)

Status: v1, 10 Nov 2026 (UTC). Docs only. Author: `product`. Fills gap C14 of `NX-42-capability-map.md` ("ages and milestones" in the founder's capability list). This is a proposal: the founder has not asked for Firsts by name, and the brand rules make milestone features risky. Nothing is built until he rules (FD-1). Not Build 12. Backlog rows in section 9.

Tags: EVIDENCE = repo file read this session. HYPOTHESIS = anything about what parents want. No parent evidence exists. UNVERIFIED = not read.

## 1. Problem and the risk

Parents of babies think in firsts (first smile, first word, first steps). The book is ordered by month of age (F09), which already carries the child's age. Nothing lets a parent pick out a letter as a first. Competitor apps do this with checklists and counts (PRD V2 F09/F46 benchmark rows, R1; I did not re-read them). That is exactly what our rules forbid: a list of suggested milestones shows what has not happened (gap counting), implies a norm (guilt), and turns the book into a tracker. So the only version we can build is the opposite: the parent names the first, in their words, only after it happened.

## 2. Goals and non-goals

Goals
1. A parent can mark any kept letter as a first, and say what it was, in a few of their own words or none.
2. The Book can show those letters together, newest first, as a view of the book.
3. Nothing in the product ever suggests, prompts or counts firsts.

Non-goals (the constitution check)
- No suggested list of milestones, no "typical age", no "most babies", no percentile, no progress ring, no "firsts so far: 7", no "3 left".
- No badge, point, streak or celebration animation that rewards marking.
- No machine detection of a first from a transcript (the machine may not add meaning; it must not decide what a letter is).
- No machine-written label: the label is typed or spoken by the parent, or absent.
- No notification about firsts. No analytics of what was marked.
- Not a medical or developmental tool, and no wording that compares the child to anyone. `{child}` only.

## 3. What exists (EVIDENCE)

Month chapters and "Before You" (F09; `book.tsx`), age math in `packages/core`, letter page (`letter/[id].tsx`), no tag, label or favourite field. UNVERIFIED: whether the local store schema has a spare field; adding one is a migration (BL row 3).

## 4. Requirements (Given, When, Then)

Ids are `NX-44-R#`.

| Id | Requirement |
|---|---|
| R1 | Mark. Given a kept letter, When the parent opens the letter page and chooses "This was a first" (words are `content`'s), Then the letter carries a first mark and an optional label of up to 40 characters typed or dictated by the parent, nothing suggested in the field |
| R2 | Unmark. Given a marked letter, Then one tap removes the mark and the label, with Undo, and nothing else about the letter changes |
| R3 | The label is the parent's. Given the label field, Then it has no placeholder examples ("first word", "first steps") and no auto-complete from a list; an empty label is allowed |
| R4 | The view. Given at least one first, Then the Book shows a "Firsts" way to read them: a row in the Months sheet area or a switch above the chapters (the design lead decides), newest first, each a normal letter card with the label as the card's first line. Given no firsts, Then nothing about Firsts appears anywhere (no empty state, no hint) |
| R5 | Never counted. Given any number of firsts, Then no count is shown on any screen, VoiceOver string, export file name or notification |
| R6 | Not an entry type. A first is a mark on a letter, never a letter without words (PRD forbids photo-only or empty entries; D-084 quiet days are separate and cannot be marked) |
| R7 | Faithful. Marking and labelling never edit the letter's words, raw transcript or recording; the mark and label live in their own fields and are stored with the letter, syncing as the letter does |
| R8 | Export. Given an export, Then the mark and label are included as plain fields in the letter's data and shown in the PDF book as the label line above the letter, only when present (F15; the export schema version moves, per ADR 0027, a decision for `data-architect`) |
| R9 | Co-parent. Given two parents (later), Then a first marked by one is visible to the other as part of the letter; each parent can unmark only their own letters (UNVERIFIED against F11 rules; defer to F11 on conflict) |
| R10 | Accessibility. The mark control is a labelled toggle with state announced; the Firsts view is reachable by VoiceOver in reading order; works at AX5 and with Reduce Motion |
| R11 | Content. All words pass the content rules test (no em or en dash, curly quote, ellipsis character or emoji; no fear, guilt, loss; no gendering; no AI implication; no gap language such as "not yet" or "still waiting for") |
| R12 | Analytics: no event. Whether anyone uses Firsts is learned in a study, not by telemetry |

## 5. Stories and acceptance

**H1 Mark a first (P1).** As a parent, after I kept a letter about our daughter's first laugh, I want to mark it, so that I can find it.
- Given the letter page, When I choose "This was a first" and type "laughed out loud", Then the letter shows the label and a mark; the words I spoke are unchanged (R1, R7).

**H2 Read the firsts.** As a parent with six firsts marked among 80 letters, I want to read them together.
- Given six marked, When I open the Firsts view, Then six cards, newest first, no number anywhere (R4, R5).

**H3 First day.** Given a book with no firsts, Then no Firsts element is visible on Home, Book or the letter list (R4). The letter page shows only the quiet "This was a first" action.

**H4 Change my mind.** Given a marked letter, When I unmark it, Then it disappears from the view with Undo (R2).

## 6. Unhappy paths

| Id | Case | Behaviour |
|---|---|---|
| U1 | Label empty | Allowed; the card shows the letter's normal first line |
| U2 | Label at 40 characters | The field stops and says nothing about a limit beyond the cut |
| U3 | Letter deleted | Mark goes with it; Recently deleted restores both (F17) |
| U4 | Sync conflict (two phones) | The later write wins for the mark and label only; the letter's words follow the existing sync rules and are not touched |
| U5 | Signed out or servers off | Works on the phone; syncs later as the letter does |
| U6 | A parent wants a list of suggestions | Not provided. The answer is the same as for "make it nicer": no |
| U7 | A letter marked, then book hidden | Hidden with the book |
| U8 | Language | The label is stored as typed in any script; the control words are English-only in Build 13 |

## 7. Metrics

No telemetry. A five-parent study: do they understand it without a list; do any say they missed suggestions (a signal for the founder, not a feature request to follow). Never: counts of marks, marks per month, a goal.

## 8. Door lines

Mark a first. Shown: "This was a first" and an optional label field. Records: one boolean and up to 40 characters on the letter, on the phone and with the letter on sync and in export. Never: a list, a count, a notice, an analytics event. Decline: do not mark; unmark in one tap.

## 9. Founder decision and backlog

FD-1 Do we build Firsts at all? Recommendation: not in Build 13; build it only if a five-parent study (HYPOTHESIS: parents ask for it) says yes, because the Book's month chapters already carry age and the favourite way to find a letter is Find (F09-REQ-015). If yes, ship after Find. Default if no answer: not built. Backlog rows are in `docs/BACKLOG.md`, "Four tabs and the capability map".

## 10. UNVERIFIED

Competitor behaviour (not re-read); the local schema; F11 visibility rules; every statement about parents.
