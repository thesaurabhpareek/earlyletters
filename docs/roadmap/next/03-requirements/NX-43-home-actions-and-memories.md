# NX-43: Home: the left-most tab, where I act and where I am reminded of what we kept

Status: v1, 10 Nov 2026 (UTC). Docs only. Author: `product`. Founder direction 10 Nov: "Default home tab on left most is where you see actions memorities etc". Fills gap C8 of `NX-42-capability-map.md`. Tab model: `NX-41-unique-tabs.md`. Not Build 12. Backlog rows: see section 9.

Tags: EVIDENCE = repo file read this session (named). HYPOTHESIS = anything about a parent's wants; no parent evidence exists for any number or ordering here. UNVERIFIED = not read or not run. Every promise or privacy line is COUNSEL-READ, not cleared.

## 1. Problem

Tonight (`apps/mobile/src/app/(tabs)/index.tsx`) is one question, two buttons and the drafts. Its one "memory" is a kept letter 28 to 35 days old, shown only when no draft waits (`ResurfacedCard`, `resurfaced()` in `draft-card.logic`; EVIDENCE from its header). So for most days the home screen has nothing of the family's own book on it, and the founder calls the landing page dull (NX-30). The founder now wants the left-most tab to carry actions and memories.

## 2. Goals and non-goals

Goals
1. Home answers two questions: "What can I do now?" (actions) and "What did we keep that I may want to see again?" (memories).
2. At most one memory at a time, always the parent's own words or pictures, never a count.
3. A parent with no letters sees a calm, full Home with no empty box.

Non-goals
- No streak, points, badge, goal, "days since", "N letters", "you missed" or percent. No gap counting (CLAUDE.md).
- No machine-written summary, caption, title or "highlight reel": memories are the parent's letters shown as they are, never rewritten or summarised (constitution).
- No new notification. A memory never produces a push (NX-39 R26, R27: nothing is derived from a library by push).
- No change to capture, review, Plus or the Keep step.
- The Book is not moved: Home points into it, it does not list it.

## 3. What exists (EVIDENCE)

Home today (Tonight): date line, greeting by daypart, the prompt with "Another thought", Speak and Type, "Not much today", waiting drafts (folded at two or more), the "A month ago" card, the Plus line. Lamp scene `tonight`. Nothing counts (its own header). Related requirements: F13 (prompts, REQ-003 to REQ-006), F14-REQ-040/041 (Plus line, held row), NX-30 (what feels dull, H1 to H3), the design lead's `NAV-TAB-ROLES-10nov.md` rules R1/R2 (waiting rows flat; the month-ago becomes a text row; read on branch `docs/nav-tab-roles-10nov`, PR #789, head c5897792, 10 Nov; it describes three tabs and will be revised, so only its Tonight rules are cited).

## 4. Requirements (Given, When, Then)

Ids are `NX-43-R#`.

| Id | Requirement |
|---|---|
| R1 | Order. Given Home, Then the order top to bottom is: date line and greeting; the prompt; Speak and Type (pinned); waiting drafts; one memory (if any); the Plus line only when it applies. Actions are above memories because a tired parent came to speak (HYPOTHESIS) |
| R2 | One memory. Given any number of kept letters, Then Home shows at most one memory at a time. There is no carousel, no "see more memories", no list |
| R3 | Memory sources, in this order of preference, all the parent's own: (a) a letter kept about one month ago (28 to 35 days, as today); (b) a letter kept about one year ago (358 to 372 days), once the book is a year old; (c) a letter the parent hid from Home earlier is never chosen. Nothing else in Build 13. Library "days away" cards (NX-39 P4b) are a separate slot and share this one slot until R2 is revisited (NX-41 section 12) |
| R4 | Choice is stable. Given a day, Then the memory shown does not change on re-open the same day, and the same letter is not offered again within 90 days of being opened or dismissed (proposed number, HYPOTHESIS) |
| R5 | Words only as kept. Given a memory, Then it shows the date line, the opening words of the letter as kept (cut on a whole word, as letter cards do) and one verb ("Read it"). It never shows a machine-chosen quote, mood, tag or title |
| R6 | Drafts first. Given a waiting draft, Then the memory still shows (this changes today's "only when no draft waits") but below the drafts, as a flat text row; if the design lead's spec keeps the older rule, the older rule wins and this row is withdrawn (conflict, section 10) |
| R7 | Not now. Given a memory, Then there is a quiet "Not now" that hides it for this day only and records nothing about the parent; and Settings, Reminders-style, has a switch "Show a past letter on Home" on by default (words are `content`'s) |
| R8 | Tapping the memory opens the letter page in the Book (`/letter/[id]`), and Back returns to Home |
| R9 | Quiet days are never memories (a mark with no words, D-084), and a letter the parent deleted or whose book is hidden is never shown (hide is per person, F12/B-REQ-014) |
| R10 | Privacy. Given a locked app, a lock screen or the app switcher, Then no memory text is visible (app lock cover, NX-40 R13). Memory selection runs on the phone from the local store and sends nothing |
| R11 | Selection is a pure function of the local store, the date and the two settings above, in `packages/core` or the mobile logic folder, with a property test: never a quiet day, never a deleted letter, never the same letter twice in 90 days, never more than one result |
| R12 | Accessibility. The memory is one VoiceOver element ("A letter from last month, read it"), reachable after the drafts; at AX5 it stacks under the prompt like the capture buttons; Reduce Motion: no entry motion; under 1 s of motion otherwise (motion spec's, not set here) |
| R13 | Content rules. Words pass `packages/content/test/rules.test.ts`: no em or en dash, curly quote, ellipsis character or emoji; no fear, guilt or loss; `{child}` for the child; no implication a machine writes; no "memories you are missing" or any gap language |
| R14 | Analytics: no new event. If the parent opted in, `book_opened` and `capture_started` already exist; whether a memory led to a letter is judged by a study, not a dashboard (section 7) |

## 5. Stories and acceptance

**H1 First day (P1).** As a parent with no letters, I want Home to be only the question and the buttons.
- Given a book with no kept letter, Then no memory row, no empty box, no "nothing yet" line shows (R2, R13). Home is the date line, greeting, prompt, Speak, Type, Not much today.

**H2 Three weeks in.**
- Given a letter kept 30 days ago and no draft, Then one flat row "A month ago" with the opening words and "Read it" shows below the buttons' content (R1, R5).
- When I tap it, Then the letter opens in the Book; Back returns to Home (R8).

**H3 A year in, many letters.** As a parent with 200 letters, I want a single meaningful reminder, not a feed.
- Given letters at about 1 month and about 1 year, Then one is shown, the year-old preferred (R3, HYPOTHESIS), and the other can appear on another day (R4).

**H4 I do not want this.**
- Given the switch off, Then no memory shows anywhere on Home and nothing else changes (R7).

**H5 Draft waiting.**
- Given two drafts waiting, Then they fold into one row (existing) and the memory sits below it (R6).

## 6. Unhappy paths and edge cases

| Id | Case | Required behaviour |
|---|---|---|
| U1 | Signed out, local start, servers off | Same Home; memory comes from the phone's store (R10). Home never asks to sign in on its own (NX-36 Q4, per the design lead's doc) |
| U2 | The memory's letter is still "getting ready" (words being made) | Not eligible until words exist (a text row with no words would break R5) |
| U3 | The memory's letter was deleted after selection | The row disappears at the next read; no error |
| U4 | Two books | The memory comes from the active book only; switching book changes it |
| U5 | Hidden book (per-person hide) | No memory from it (R9) |
| U6 | Time zone or clock change | Day boundaries use the local date at read time (`roomClock`); a changed clock never shows a letter from the future |
| U7 | A letter whose date was set by catch-up (NX-27) | Uses the date the parent chose for the letter, not the kept time |
| U8 | Offline | No change; nothing is fetched |
| U9 | Lock on, app returns after the grace | Cover shows; no text before Face ID |
| U10 | Fallback ship (Build 12 on-device only) | Unaffected: Build 13 |
| U11 | A grieving or hard-day parent (the safety rule) | The memory is always the parent's own and can be switched off in one tap; the "If you are struggling" row stays in Me and is never moved. Whether a memory could land on a painful letter is UNVERIFIED and is the first question to `user-research` (the read-through row in the backlog) |

## 7. Metrics that respect the constitution

Analytics is opt-in and off in every 1.0 profile (D-124 item 3). Measures: five-parent read-through "what is Home for?" (HYPOTHESIS target: at least four give a verb about saying or remembering); a device check that the memory row never shows a count, a gap or a streak; scripted time to Speak unchanged from today. Never measured: how many memories a parent opens as a goal, days since last letter, or any letter text.

## 8. Door lines (COORDINATION section 10; PRIV-R21; COUNSEL-READ)

Past letter on Home. Shown: "A month ago" or "A year ago", the opening words, "Read it", and a "Not now". Records: one local day marker for "Not now" and the last-shown letter ids on the phone only. Never: a server record, a push, a count, a score. Decline: Not now; the Settings switch.

## 9. Backlog

The rows are in `docs/BACKLOG.md` section "Four tabs and the capability map (NX-41 to NX-45)": the memory selection function and its property test, the Home row and the setting, the study, and the QA rows.

## 10. Conflicts and open points

- `NAV-TAB-ROLES-10nov.md` R2 keeps the month-ago row only when nothing waits ("Tonight lists no kept letters, except one doorway"); R6 here shows it below drafts. If the design lead keeps R2, drop R6.
- NX-39 adds "days away" cards (library) to Tonight with the same one-slot rule; NX-39 R16 and this file's R2 must be reconciled when P4b ships.
- F47 ("On this day, Year One") is Later and says "no counts"; R3 (b) is a smaller version of it and should cite F47 when it is written.
- Whether "A year ago" is wanted at all is a HYPOTHESIS.

## 11. UNVERIFIED

The rendered Tonight; the exact windows in `resurfaced()` (I read the comment "28 to 35 days" via NX-30 and the design lead's audit, not the function); whether F47 text forbids a year-ago row; every number marked proposed.
