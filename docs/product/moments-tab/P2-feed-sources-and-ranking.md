# Moments tab, P2: feed sources, ranking, caps, quiet rules and parent control

Status: PROPOSED (nothing here is decided, built, or in `DECISIONS.md`) | 21 Nov 2026 | Lead: product lead P2 of 5 | Docs only | Branch `wip/moments-p2`
Fictional family: Asha only. Words in quotes are intent for `content`, never final copy. The founder's screenshots are not copied here and no real name, place or business from them is in this file.

## 1. Purpose and scope

The founder wants a new tab that learns from Apple's journaling suggestions picker and does it in a smarter way for a parent who is making a baby book (brief, items 1 to 4 and the 20 Nov later update). The tab has two parts: For you and Recent. This file answers the part that is mine:

- Every source that may put something in For you or Recent, what each may show and never show.
- Who is eligible, and in what order, in words a parent could check ("explainable").
- Caps and quiet rules, tied to the NS-32 notification budget and the NS-50-R5 priority order.
- Dismiss, snooze and hide: what each means and what it remembers.
- How a parent corrects a source or turns it off.
- Where the tab sits among the tabs, and what brings a parent back each day without streaks, counts or guilt.
- How one moment signal feeds in-app cards, local reminders and email, while the server never sees the library.

Not mine, and not decided here: the look of the tab, the permission screens and the value-props state (M0), the route choice (Apple's picker or our own read), the capture hand-off screens, motion, and legal reads. Where I need them I state an assumption and name where to reconcile (section 12).

Every place where this proposal overturns an earlier ruling is listed in section 11 as a reversal the founder owns. I did not edit any ruling.

## 2. Inputs read

Read this session in a depth 1 clone of `develop` at `86eccfa` (paths relative to the repo root):

| Input | Ids I rely on |
|---|---|
| `/home/claude/moments-brief.md` including the UPDATE line | Founder direction, reversals list, constraints ML-3, NS-32, NS-51 wording |
| `docs/product/HOME-ENGAGEMENT-WHEEL-21nov.md` (branch `origin/docs/product-home-engagement-wheel-21nov`, PR #1264, in rework) | Wheel order, section 7 tab states M0 to M5, NS-53-R1 to R16 (PROPOSED there) |
| `docs/product/prd/11-foundations.md` | NS-32-R1 to R16: one budgeted notification a day, registry, back-off, lock-screen rules |
| `docs/product/prd/21-days-cultural-photos-home.md` | NS-46 (Days), NS-47, NS-48 (catalogue), NS-49 (levels 1 and 2), NS-50-R1 to R18 (Home slip) |
| `docs/product/prd/27-photo-moments-and-media.md` | NS-51-R1 to R35 (photo moments, level 3), NS-52 |
| `docs/product/prd/10-reading-and-family.md` | NS-23-R1 to R18 (past letter, "a year ago") |
| `docs/product/prd/09-capture.md` | NS-18-R1 to R8 (typed days) |
| `docs/agents/cto/RULINGS.md` line 698 | Notification budget: 60 pending, plan notices first, ranks typed day 1, birthday 2, libraryDay 3, month 4, evening 5 |
| `docs/content/lifecycle-playbook/02-email-lifecycle.md` | Email rules E75, E79, LEGAL-REQ-053, FR-MKT-44 |
| `packages/core/src/prompts.ts` | `selectPrompt`, `kindFor`, `GAP_DAYS`, `excludeKeys`, kinds `opening`, `together`, `family`, `gap`, `hard` |
| `docs/design/DESIGN-LANGUAGE-V2-21nov.md` | Paper content, glass only on navigation and controls |
| Web: Apple, "Journaling Suggestions and Privacy" (`https://www.apple.com/legal/privacy/data/en/journaling-suggestions`) | Read this session; see section 13 |

Not found or not readable, so my assumptions stand until reconciled:

- ML-1 to ML-14 (the memory library council record). The Project doc `infra/cto-rulings-2026-11-10-memory-library.md` is not reachable here. I cite ML-3 and ML-6 only as the brief states them (ML-3: no push is created from library data, fixed text, random id, no place, photo, count or "waiting"; ML-6: cards show a date, never a place or thumbnail). The repo carries ML-4, ML-13 and ML-14 through `NX-39-council-record-10nov.md`, which I did not open again.
- `infra/scope-stack-rank-and-ia-redesign-2026-11-19.md` (the three-tab ruling): Project doc, not read.
- The other four product leads' files, the benchmark B1 (branch `wip/moments-b1` did not exist when I looked; only `wip/moments-d5` was pushed), the feasibility doc, the privacy and constitution doc and the design concept. None were readable. Reconcile points are in section 12.
- How the hard-stretch state is derived on the device. I know only that safety tiers stay on the device (CLAUDE.md) and that `kindFor` takes a `hardStretch` input.

## 3. Findings that shape the design (read these first)

F1. The repo already has a complete ordering for notifications (NS-32 and the RULINGS line: typed day, birthday, library day, month age, evening) and a complete ordering for the one Home slip (NS-50-R5). A tab that shows several cards needs a third rule, and it must not contradict the first two. Section 6 gives it and shows it is the same order, widened from one slot to four.

F2. Existing rules say a library picture may never be a list, strip or count: NS-51-R8 ("the capture menu offers only the newest moment, never a list"), NS-50-R10 and R-IA-3 (no picture slip, tile or strip on Home), ML-6 (as the brief states it). A Recent part that lists days of pictures newest first breaks NS-51-R8 and ML-6 by design. I do not hide this. Section 11 lists it as a reversal, and section 6.3 caps Recent so it stays an invitation and not an inbox.

F3. The prompt selector in `packages/core/src/prompts.ts` has a prompt kind `gap` chosen when `daysSinceLastEntry >= GAP_DAYS`. Moments must never pass a days-since value, so it can never pick a gap prompt (the constitution and NS-51-R12 say no counting of gaps). MT-P2-R20 pins this.

F4. Email cannot carry a moment nudge at 1.0 at all. E75, LEGAL-REQ-053 and FR-MKT-44 say no marketing email to an address given in the app at 1.0, and E79 says there is no server push. The founder's wish that the moment signal "influences email" is a later, opt-in, commercial email class. It is a reversal if wanted at 1.0 (section 11, R-E75).

F5. The server can legitimately know the child's date of birth and the book's letters (they sync), but the repo says typed days and ticked days live on the phone only (NS-46-R6, NS-47-R6 days store outside `scribe.db`; NS-46-R45 "days store: device only, L4"). The brief says the server may know typed days. I read the repo as the opposite. I mark it UNVERIFIED and design email around the narrower, safe set: birthday and month-age dates only (section 8).

F6. Honest limit on daily return. On most days only one source is certain to exist: a question from the 111 prompts, which Home already shows. Moments earns a daily visit only on days when something real is there: a marked day, a birthday or month day, a letter from this day earlier, or new pictures. How often that is true for a real family is unknown. I do not invent a rate. Section 9 says what we do about it and how to measure it with analytics off.

F7. The tab word "Moments" collides with a content rule: NS-51-R35 forbids the words "memories, moments, best, smart, AI, suggested" on the Me row for photo moments. A tab label is not a Me row, but `content` must rule on it (open question Q6).

## 4. Position of the tab (the IA question the founder asked)

The founder's later update relaxed "default tab" and asked me to think about second tab, centre tab, default, or inside Home. Options judged against the repo's own tests (J1 to J12 Home says, Book reads, Me looks after; IA-R3 one capture entry; IA-R9 Home lists no kept letters):

| Option | Strength | Weakness | Verdict |
|---|---|---|---|
| A. Home default, Moments second: Home, Moments, Book, Me | Keeps J4 (capture starts from Home). Keeps the first-run rule K-02 true in practice, because a first-run parent lands on Home and sees no photo ask until they open Moments and tap. Home stays the verb "say", Moments the verb "look back", Book "read". The notification tap lands on Home today (NS-46-R32) and keeps doing so. | Changes IA-R1 and tests N1, N4, J12 (three tabs to four). One more tab to explain. | Recommended |
| B. Five-tab bar, Moments in the centre | Centre tab reads as the main action. | The centre slot belongs to the one capture action in most apps, and our one capture entry is Speak on Home (IA-R3). A centre Moments tab would look like a second capture entry, which N3 forbids. Five tabs on an iPhone SE 3 at AX5 is the hardest to pass for labels (D-098 floor, AX5). | Not recommended |
| C. Moments default | Founder item 2 as first written: the tab shows value props and asks for photos on first open. | First launch leads with a permission ask, which reverses K-02 outright; for a parent with no letters yet the best first screen is still one prompt and Speak. Value props before any letter is a marketing screen as the default, which J5 (is it an empty promise) cannot yet pass. | Not recommended for 1.0; revisit after five-parent check |
| D. Moments inside Home | No new tab; fewest rule changes. | It makes Home a feed, which NS-50-R11 and IA-R9 forbid, and it buries the For you and Recent split under Speak and Type. It is the "two tabs look the same" risk the founder raised. | Not recommended |

Recommendation: A. A first launch lands on Home, as today. Moments is the second tab. Reasons to stay with A: it needs the fewest reversals (three tab ruling and IA-R1 only, not K-02 or J4 in spirit), it keeps one capture entry, and it lets the tab be judged by a five-parent check (NS-50-R13 style) before anyone makes it default. The founder may still choose C; section 11 notes what C adds to the reversal list (K-02 in full).

What each tab owns after A (one owner per fact):

- Home (say): the day's question, Speak, Type, drafts, and the slip ranks 1 to 3b of NS-50-R5 (waiting set, seal-opened, a day the parent chose today, Save a copy, the Days ask).
- Moments (look back and start): today-things as cards, a letter from this day earlier, pictures from the phone, a different question.
- Book (read): every kept letter. Moments never lists kept letters (IA-R9 applies to Moments too, by MT-P2-R2).

## 5. The sources

A source is anything that may create a card. Each source has an id, an on-device rule for when it exists, what a card may show, and what it may never show. The shared "never" list applies to every source and is MT-P2-R3.

Shared never list: no title, caption, summary, story or mood written or suggested by the machine; no scene, object, place or person guess; no face or person matching; no count of pictures, letters, cards, days or things waiting; no gap word ("again", "still", "missed", "don't forget", "haven't"); no streak, points, badge or red dot; no "best" or "memories"; no line saying the app found, chose, wrote or suggested words; no child name where names are off or App lock is up on a lock screen; never gender the child (use {child}); no analytics event for any card, tap, dismissal or answer (NS-50-R17 pattern, NS-51-R27).

| Id | Source | Exists when (eligibility) | A card may show | A card may never show | Where it came from (cited) |
|---|---|---|---|---|---|
| S1 | A day the parent typed | Today equals the typed date and the typed day still exists (NS-18; it is deleted the day after delivery, NS-18-R7; it never recurs, NS-46-R5) | The parent's own words, unchanged, only in the app (NS-18-R1, R3); the words follow the `notifications.dayNames` switch on the lock screen, never in Moments snapshots | Any word the parent did not type; any upcoming or past typed day; a list | NS-18, NS-50-R2 pattern |
| S2 | A day the parent chose (Days, ticked) | The parent ticked it (never pre-ticked, NS-46-R2) and its date is today for the phone's local date; a moving day uses the row's date and the word "around" where precision is `about` (NS-46-R14) | The day's name and one line from `days.landing.*` (NS-50-R3); a `quiet` day shows the name and "The book is open if you want it." with no question (NS-46-R16, NS-50-R15); two days on one date name both (NS-46-R8) | A day not ticked; "last year"; a tradition label; a list of ticked days; a count (NS-50-R2, NS-46-R22) | NS-46, NS-47, NS-50 |
| S3 | Month and age days | From the active book's date of birth: the birthday, and the same day of each month. A book before the birth has none (it only offers the `before` prompts, `prompts.ts`) | "Today {child} is N months old" or the birthday, in the words `content` writes; the age shown is the one the Book shows (R-IA-1) | A comparison to other children, a milestone claim, a "should" about development | NS-32 classes `birthday`, `monthAge`; NS-48-R7 |
| S4 | A year ago, from our own letters | A kept letter on the same local day in an earlier month or year, chosen by NS-23-R12; never sealed, hidden, private, recently deleted (NS-23-R5), never from a `hard.*` prompt, dated today, or empty (NS-23-R15); never from a quiet or hidden book (NS-23-R8); the Me switch is on (NS-23-R4) | The letter's own date and a verbatim opening fragment (NS-23-R2); optionally the picture the parent attached to that letter (open question Q4) | A paraphrase; a summary; a count of letters that day; "a year ago you felt"; any word the parent did not write | NS-23 |
| S5 | A picture the parent already picked | The parent attached or started from it (level 1, NS-49; several, NS-52) and a draft holds it, or a kept letter holds it | A draft with a picture is owned by Home's waiting set (rank 1); a kept letter's own picture may appear on an S4 card only | A library picture the parent did not pick; any picture in a notification | NS-49, NS-52, NS-50-R5 |
| S6 | A written prompt from the 111 | Always eligible; chosen by `selectPrompt` with `kind` `opening` only for Moments, deterministic by the day's seed, never the key Home shows today (`excludeKeys`); the pre-birth set for a book before the birth | The prompt text as `content` wrote it, with "Another thought" to see a different one (the existing press, `MIN_ALTERNATIVES`) | A prompt chosen by days since the last letter (`gap`); a `hard` prompt unless the hard-stretch state asks for it (R14); a prompt that names the picture | `prompts.ts`, NS-48 |
| S7 | A day of pictures from the phone (library moment) | Only after the parent said yes to photo access (sheet after one sentence, NS-51-R1); the day has pictures by NS-51-R7 rules (thresholds ASSUMED, fixed by the spike); within the recent window (PROPOSED 90 days, NS-51-R7); only date and type were read (NS-51-R5) | The parent's own pictures as thumbnails of at least 96 pt (NS-51-R9), the phone-formatted date, and a way to pick which pictures to keep; a hand-off to capture | A place, a title, a caption, an event name, a person's name, a video length used as a count, a count of pictures, "best", a map, any Apple-made title (the brief says a machine-made title from Apple's picker is never stored or shown by us) | NS-51, ML-4, ML-13, ML-14 |

Source availability by route (the route is decided elsewhere; I design for both):

- Route A (Apple's picker, no library permission): the app sees nothing until the parent picks. S7 does not exist as a feed. The Recent part becomes one row that opens Apple's sheet; a picked suggestion goes to level 1 handling (NS-49-R7 to R9: only a title the parent taps "Use this" on is ever copied). For you still carries S1 to S6. Apple's own page says suggestions reach an app only when the person chooses them, and that only the person sees them before sharing (read this session, section 13).
- Route B (our own on-device read, limited access honoured): S7 and Recent exist. The repo's rules for this read (dates only, index at most 30 moments, no ID in logs) stand (NS-51-R5, R6, R28).
- No access, limited with a small selection, denied, or Not now: S1 to S6 show; Recent shows one calm line and the picker, with no line about access (FR-PHS-44, NS-51-R18, R19).

## 6. Eligibility and ordering

### 6.1 The one rule, in plain words

Moments shows up to four cards, always in this order, and only the cards that really exist today:

1. Today: a day that belongs to today (S1, S2, S3).
2. Look back: a letter from this day earlier (S4).
3. Pictures: the newest day of pictures from the phone (S7), or the picture row for Route A.
4. A question: one prompt (S6), always present.

Inside Today, if several sources apply to one date, one card names them with the strongest first and the rest as further names, as NS-46-R8 does: typed day, then birthday, then a ticked day, then a month day. This is the NS-32 order (typed day 1, birthday 2, library day 3, month 4) and so a parent can predict it. The lead of the whole screen is the first card that exists; if only the question exists, the question leads.

This is not a new priority. It is NS-50-R5 and NS-32 widened from one slot to four slots, with the same relative order. Check: NS-50-R5 puts "a day the parent chose today" above "past letter"; Moments puts Today above Look back. NS-32 puts day sources above `evening` and the photo moment below `monthAge` (NS-51 change row); Moments puts Pictures after Today. One difference, stated as a reversal: NS-23/NS-50-R5 rank 4 (the past letter slip on Home) moves to Moments when Moments is on (section 11, R-NS50-5).

### 6.2 Why four slots and no more

Four fixed slots mean no feed, no count of things waiting (NS-50-R11, NS-50-R2) and a layout design can hold at AX5. A slot with nothing in it is absent: no placeholder, no "nothing today", no hint that something is missing.

### 6.3 Recent (newest first by day)

- Recent lists days of the parent's own pictures from the phone, newest day first, within the recent window.
- It is capped to one screen at the default text size (NS-53-R9 PROPOSED in the wheel doc). The number of days is a design figure PROPOSED for the spike, not invented here; no endless scroll; no "Show more" that reveals an older backlog (NS-51-R7: no older backlog is swept, so no day is ever "missed").
- A day already written about, because a kept letter holds pictures from that day, is not marked or ticked. We do not show "done" or "not done" (that would be a gap count by another name). It simply keeps its place or ages out; the parent chose to write, so nothing is asked.
- Each day shows the phone-formatted date and the pictures. Nothing else (R5, NS-51-R9).
- Recent never shows a kept letter (IA-R9 and the "Moments never lists kept letters" rule).
- If the parent has two books, a day of pictures is not tied to a child, because nothing matches faces (NS-51-R33). Recent is the same under either book. The parent chooses the book when they start the letter (R22).

### 6.4 Stability

For one local day, every open and cold start shows the same cards in the same order (the NS-23-R13 pattern). At local midnight the choice is made again. Reasons: a parent can find a card they saw in the morning; tests can pin the output.

## 7. Dismiss, snooze and hide

Four different actions, each with one meaning and one thing it remembers. No action is an answer to a question, so none is logged.

| Action | Parent word (intent for `content`) | Meaning | Remembers | Returns |
|---|---|---|---|---|
| Not today | "Not today" | This card leaves until the next local day. No haptic (NS-50-R7). Nothing slides up to fill its place in the same visit (NS-50-R6). | The card's source and local date, for that day only | Tomorrow, if still eligible |
| Not this one | "Not this one" (S7 and S4 only) | This one day of pictures, or this one letter, never shows here again | A local day key for S7 inside the same L4 file as the index (NS-51-R6); a local letter id list for S4 | Never, unless the parent clears it in Me (R25) |
| Turn off a kind | A switch in Me, "What shows in Moments" | A whole source stops (section 7.2) | The switch, on the phone | When the parent turns it on |
| Hide a book | Existing "Quiet this book" or hide | Nothing from that book shows, in the app or as a reminder (NS-46-R25, NS-50-R8, NS-23-R8) | Existing book state | When the parent changes it |

There is no "Remind me later" in Moments. A snooze is a promise to nag; the repo's own rule is that the app does not ask twice (NS-47-R31 caps the Days ask at two times; FR-PHS-44). "Not today" is the only deferral, it lasts until tomorrow, and a card that is still real tomorrow is allowed to appear again. A moment older than the recent window leaves quietly (NS-51-R22).

Not this one for a letter (S4): the Book's hidden and private states already stop a letter resurfacing (NS-23-R5) but also change how it appears in the Book. Moments must not use them as a shortcut. So S4's Not this one is a local, per-phone list. It does not sync, so a second phone can still show that letter. That is an honest limit (Q5), and the alternative of syncing it needs a schema change that is not mine to propose.

### 7.1 What a dismissal never does

It never changes the notification plan (a hidden card does not cancel a reminder, and a reminder does not wait for a card), never counts, never becomes a streak or a gap, and never changes what the prompt selector or any later card says ("you dismissed three times" does not exist).

### 7.2 Turning a source off, and correcting one

Where, in Me, in one list called by `content` (working "What shows in Moments"; Me is where Reminders and Days already live, per NS-51 section 3 and NS-46-R3):

| Source | Turn off | Correct |
|---|---|---|
| S1 typed days | The Days page already lists them in "Days you added" and lets a parent delete one (NS-46-R3, R38) | Edit or delete the typed day there; the card and any planned note change within 1.5 s (NS-46-R33) |
| S2 chosen days | Untick or "Clear all" (NS-46-R35) | Move a date for one year or for always (NS-46-R14). A wrong date reported goes to the same-day review (NS-46-R44) |
| S3 month and age days | A switch (the existing reminders setting plus a Moments row) | Correct the child's date of birth in the book's settings; the age days and planned notes re-plan. UNVERIFIED that the app lets a parent edit the date of birth after creation; I did not read the screen |
| S4 a year ago | The existing past-letter switch in Me (NS-23-R4) | Not this one (section 7) |
| S5 pictures already picked | No separate switch; they are the parent's own letters | Remove the picture from the letter in the letter, as NS-52 allows |
| S6 questions | A switch, "Questions in Moments" | "Another thought" shows a different one |
| S7 pictures from the phone | The NS-51 Me row: Pause, Choose which pictures (limited), Albums (full), Turn off. Turn off deletes the index and the hidden-day keys in the same action (NS-51-R16). The card never claims it revoked Apple's permission | Choose which pictures (limited access) in Apple's own sheet; Not this one |

Turning off every source leaves Moments with one calm line and the picker. It is allowed; it is the parent's tab. Nothing then reminds them it is empty.

## 8. One moment signal: in-app cards, local reminders, email

### 8.1 The shape

Moments needs one pure function on the phone, `momentsFor(localDate, book, inputs)`, in `packages/core` (pure TS, no React Native, CLAUDE.md). It returns an ordered list of candidates:

`{ slot, source, dateKey, reasonKey, contentKey, refs }`

- `slot` is `today`, `lookBack`, `pictures` or `question`.
- `source` is one of S1 to S7.
- `reasonKey` is from a closed list that `content` owns (see R4).
- `contentKey` points at a `packages/content` key, never generated text.
- `refs` are local references (a typed day id, a letter id, a local day key). They never leave the phone and never go to a log.
- Each source has two fixed flags in the registry as data: `pushSafe` and `serverSafe`.

The same function feeds all three channels. The in-app cards take every candidate. The planner takes only candidates whose source is `pushSafe`. The email system takes only `serverSafe` sources, and the server computes them itself; the phone sends nothing.

### 8.2 By channel

| Source | In-app card | Local reminder (phone only) | Email (server) |
|---|---|---|---|
| S1 typed day | Yes, on the day | Yes: class `typedDay`, rank 1 (NS-18-R1, NS-32-R5, R9) | No. The server does not hold it (F5, UNVERIFIED) |
| S2 chosen day | Yes, on the day | Yes: class `typedDay` group as `libraryDay` (NS-46-R4, R29), neutral body, tone rules (NS-46-R36, R37) | No. Phone-only store |
| S3 birthday, month day | Yes | Yes: classes `birthday` (rank 2) and `monthAge` (rank 4) | Possible later: the server knows the date of birth; see 8.4 |
| S4 a year ago | Yes | No. A look-back note would be a new class (NS-32-R5 forbids an `occasion` class) and NS-23-R17 says nothing is donated to the system; letter words never go in a note | No. Letter words are the most private thing we hold |
| S5 pictures already picked | Draft owned by Home | No | No |
| S6 question | Yes | Yes, through the existing `evening` class and NS-48 catalogue; no new class | No |
| S7 pictures | Yes (Recent and the Pictures slot) | Yes only as the neutral `photoMoment` source inside `evening` below `monthAge`, planned only while the app is in the foreground, and only for a day known at the last open (NS-51-R11, Q-PM-8) | Never. The server never sees the library |

### 8.3 Local reminder rules (the budget, restated, not changed)

- At most one budgeted notification a day, across all classes (NS-32-R1). Plan notices go first and sit outside the budget (NS-32-R4, R4b). Total pending at most 60 (NS-32-R7).
- On a day with several candidates the rank is typed day, birthday, library day, month age, `photoMoment`, evening (NS-32-R3, NS-46-R7, NS-51 change row). `chooseOnePerDay` in `lib/reminders/budget.ts` is the only place this lives (NS-46-R30). Moments adds no class and raises no ceiling (NS-32-R15).
- A made letter that day silences the photo nudge (NS-51-R13). A quiet or hidden book contributes none (NS-32-R14, NS-46-R25).
- Back-off: evening notes stop after day 35 of no letter and a typed day survives it (NS-32-R8, R9). Moments cards do not back off, because a card is not an interruption. The absence is not named.
- Interruption level `active`, never `time-sensitive` (NS-32-R10); inside the parent's window (07:00 to 21:30, NS-46-R10); title and body are `packages/content` keys, neutral on a lock screen, no child name by default, no thumbnail, no place, no count, no "waiting" (NS-32-R11, R12, R13; ML-3 as the brief states it: fixed text, random id).
- A photo nudge uses the neutral NS-51 wording the brief quotes ("Some pictures from the weekend are here"). I did not re-check it against `rules.test.ts`; `content` must (MT-P2-R31).
- Tap routing: a day or typed day note opens Home as built (NS-46-R32, NS-50-R4). A `photoMoment` note, a new kind, opens the Moments tab, payload `{source, kind}` only, no ID. Moments reads nothing from the payload. A tap that finds no matching card opens Moments plainly with no message.
- No analytics event for any of it (NS-46-R34, NS-50-R17, NS-51-R27).

### 8.4 Email (not at 1.0; design only)

- At 1.0 there is no marketing or nudge email and no push (E75, E79, LEGAL-REQ-053, LEGAL-REQ-054, FR-MKT-44). This section is the only design that fits those rules if the founder later wants one.
- The server may know: the book's child date of birth, and letter dates. It must not know library signals, typed days or ticked days (F5). So an email can use only S3 (birthday, month day). It carries the neutral line only: no letter words, no child name by default, no count, no picture.
- It is its own commercial email class: separate opt-in, off by default, one-click unsubscribe, hashed suppression, the founder's yes (E75), and counsel's read.
- Cross channel rule: one nudge a day across push and email. The server cannot see the phone's plan, so the safe rule is that an email is never sent on a local date that has a birthday or month day, because the phone already sends one then, and at most one email a week (PROPOSED figure, Q7).
- A letter made today (the server knows from sync) suppresses that day's email.

## 9. What brings a parent back every day

The honest answer has five parts. None needs a streak, a count or a guilt line.

1. A fresh question each day (S6). It is always there, it is different from Home's, and it asks for something small. This is the floor.
2. Things that really are today (S1, S2, S3): a birthday, a month day, a day the parent chose or typed. These are the parent's own dates, so they feel like the parent's own app.
3. A letter from this day earlier (S4). This is the strongest personal pull in the whole tab, and it only grows with the book. It needs no permission.
4. New pictures from the weekend (S7, Route B). Every parent takes pictures all the time, which is why this source is the one that can make a daily visit likely. Without it, Moments is thin on most days (F6).
5. A reminder at the parent's own time, neutral, at most one a day (section 8.3).

What we deliberately do not use: a daily reward, "come back tomorrow", unread dots, a red badge or any tab badge (a badge is on the forbidden list in CLAUDE.md), a count of what is waiting, an absence line when the parent returns, a rotating "streak of letters". A parent who has not opened the app for a month sees exactly what a parent sees on any other day.

How we know without analytics: analytics stays off for slips and cards (NS-50-R17). So the measure is a research row like NS-50-R13 and R18: five parents use an e2e prototype with Asha content for two weeks; a diary note each evening says what in the app, if anything, they opened and why. Stop line (PROPOSED figure, founder fixes): if in most diary days the only card was the question, then Moments has not earned a tab yet, and the five-parent result says so plainly. The founder decides on that result. I do not claim the tab raises daily return; I claim it is the best-placed design inside our rules to try.

## 10. Requirements

Test layers: U unit (pure function), C content (rules test), S scan (source or plist scan), D device (iPhone SE 3, AX5), E e2e. Priority: P0 (a) a promise, (b) a legal or store duty, (c) the core loop. Each test title begins with its id in brackets. Rows cite, never restate or change, the requirement they depend on.

| Id | Given, When, Then | Layer | Pri | Satisfies or cites |
|---|---|---|---|---|
| MT-P2-R1 | Given the tab bar with the Moments flag on, Then the order is Home, Moments, Book, Me; a cold start and a notification tap for S1, S2, S3 and S6 land on Home; with the flag off the bar is Home, Book, Me | E | P0 (a) | NS-46-R32, NS-53-R1 (PROPOSED) |
| MT-P2-R2 | Given Moments on any day, Then it shows at most four cards in the slot order today, look back, pictures, question; a slot with nothing is absent with no placeholder; no kept letter is listed; Recent shows days of pictures only | U, E | P0 (a) | NS-50-R11, IA-R9 |
| MT-P2-R3 | Given every source, Then no card shows a title, caption, summary, story, mood, scene, object, place, person, face, count, gap word, streak, point, badge, "best", "memories", or a line implying the app wrote or chose words | C, S | P0 (a) | Constitution, NS-51-R10, R12, R33 |
| MT-P2-R4 | Given any card, Then it carries a reason line from a closed list in `packages/content` (intent: "A day you added", "A day you chose", "From {child}'s birthday", "A letter from this day", "Pictures from your phone", "A question to start from"), no reason says "we found", "picked for you" or "suggested", and an unlisted reason fails the build | C | P0 (a) | Explainable ordering |
| MT-P2-R5 | Given S7, Then only creation date and media type are read, and a scan fails any location, face, scene, filename, album or title field in Moments code | S | P0 (a) | NS-51-R5, NS-53-R5 |
| MT-P2-R6 | Given today's local date, When several Today sources apply, Then one Today card names them strongest first in the order typed day, birthday, chosen day, month day, and two chosen days name both | U | P1 | NS-32-R3, NS-46-R7, R8 |
| MT-P2-R7 | Given S1, Then it shows only on its date with the parent's own words, never an upcoming day or a list, and a typed day is gone the day after (no recurrence) | U | P1 | NS-18-R5 to R7, NS-50-R2 |
| MT-P2-R8 | Given S2 on a `quiet` day, Then the card shows the name and "The book is open if you want it." with no question and no prompt block; a day not ticked never shows | U, C | P0 (a) | NS-46-R2, R16, NS-50-R15 |
| MT-P2-R9 | Given a book before the birth, Then S3 does not exist and S6 draws only from the `before` set | U | P1 | `prompts.ts` |
| MT-P2-R10 | Given the same book on the 31st or on a 29 Feb birth date, Then month days and the birthday follow the planner's existing date rule and never skip a month without a rule (rule not read by me; reconcile with `lib/reminders/planner.ts`) | U | P1 | NS-23-R9b pattern |
| MT-P2-R11 | Given S4, Then it follows NS-23-R2, R5, R8, R12, R15 exactly (verbatim fragment, never sealed, hidden, private, deleted, quiet-book, hard-prompt, same-day or empty letters) and shows nothing else about the letter | U | P0 (a) | NS-23 |
| MT-P2-R12 | Given a day on which both Home and Moments could show the same past letter, Then only Moments shows it when the flag is on; Home's slip order is NS-50-R5 without rank 4 | U, E | P1 | Reversal R-NS50-5 |
| MT-P2-R13 | Given a today-fact (S1, S2, S3) and the Moments flag on, Then the fact shows on Home's slip as built and on Moments' Today card, both opening the same capture start; no other source shows on both tabs | E | P1 | NS-50-R4, one owner per fact |
| MT-P2-R14 | Given the hard-stretch or quiet state on this phone, Then Moments shows no S4 card and no bright-tone Today card, the question uses only the kind Home uses, and the default is nothing from a quiet book (the derivation of hard-stretch was not read) | U, D | P0 (a) | NS-23-R8, R15, `kindFor` |
| MT-P2-R15 | Given S6, Then `selectPrompt` is called with `kind` opening only, `daysSinceLastEntry` absent, `excludeKeys` holding Home's key today, and a deterministic seed per local day; the `gap` and `hard` kinds can never be returned to Moments | U, S | P0 (a) | `prompts.ts`, NS-51-R12 |
| MT-P2-R16 | Given "Another thought" on the question card, Then a different prompt shows (at least `MIN_ALTERNATIVES` choices) and nothing is counted or logged | U | P2 | `prompts.ts` |
| MT-P2-R17 | Given S7 and Route B, Then a day qualifies by NS-51-R7 (thresholds ASSUMED, fixed by the spike), shows newest first, only inside the recent window, no older backlog, and a deleted picture drops quietly | U | P1 | NS-51-R7, R22 |
| MT-P2-R18 | Given Recent, Then it fits one screen at the default size (number PROPOSED, fixed by design), has no endless scroll, no "show more", no count and no done mark on a day already written about | E, D | P0 (a) | Reversal R-NS51-R8 |
| MT-P2-R19 | Given Route A, Then Recent is one row opening Apple's sheet, the app learns nothing until the parent picks, and an Apple-made title is stored only after "Use this" (NS-49-R9); the brief's rule that a machine-made title is never shown by us wins if the two differ | E, D | P0 (a) | NS-49-R6, R9, R11 |
| MT-P2-R20 | Given no access, limited with a small selection, denied, or Not now, Then S1 to S6 show, Recent shows one calm line and the picker, and no line mentions access, never asks again | E, D | P0 (a) | FR-PHS-44, NS-51-R18, R19 |
| MT-P2-R21 | Given the app opened after a long absence, Then the cards are the same as on any day and no string names the absence | U, C | P0 (a) | NS-48-R4, NS-51-R12 |
| MT-P2-R22 | Given two books, Then Moments is per active book for S1 to S6, S7 is the same under both, and starting a letter from a day of pictures asks for the book with the child switcher only when needed | E | P1 | NS-51-R33, C-14 |
| MT-P2-R23 | Given "Not today" on a card, Then it leaves until the next local day, plays no haptic, fills no gap in the same visit, is not logged and returns tomorrow if eligible | U, E | P1 | NS-50-R6, R7, R17 |
| MT-P2-R24 | Given "Not this one" on S7 or S4, Then only a local day key (S7) or a local letter id (S4) is stored; S7's key lives in the index file and is removed by Turn off, Erase, sign-out; S4's list is per phone and does not sync | U, D | P0 (a) | NS-51-R6, R16, R17 |
| MT-P2-R25 | Given the Me list "What shows in Moments", Then each source has one switch or link to its own setting, off removes cards at the next focus and cancels that source's planned notes within 1.5 s, and the list has no count and no "recommended" | E | P1 | NS-46-R33, NS-51-R16 |
| MT-P2-R26 | Given every source turned off, Then Moments shows one calm line and the picker, and no other screen mentions it | E | P2 | NS-50-R2 |
| MT-P2-R27 | Given the momentsFor registry, Then each source has `pushSafe` and `serverSafe` as data; only S1, S2, S3, S6 and S7 are `pushSafe`; only S3 is `serverSafe`; a test fails any other value | U | P0 (a) | ML-3, NS-32-R5 |
| MT-P2-R28 | Given the planner, Then Moments adds no class, raises no ceiling, uses `chooseOnePerDay` as the only chooser and plans at most one budgeted note a day over 92 days | U | P0 (a) | NS-32-R1, R15, NS-46-R30 |
| MT-P2-R29 | Given a `photoMoment` candidate, Then it ranks below `monthAge` and above nothing else but `evening`, is planned only at foreground for a day known at the last open, is skipped when a letter is made that day or the book is quiet | U | P0 (a) | NS-51-R11, R13, NS-32-R14 |
| MT-P2-R30 | Given any notification from Moments sources, Then body and title are content keys, neutral on a lock screen, with no child name by default, no thumbnail, no place, no count, no "waiting", a random identifier and level `active` | U, C | P0 (a) | NS-32-R10 to R13, ML-3 |
| MT-P2-R31 | Given the neutral photo nudge wording, Then `content` has run it through `rules.test.ts` and BRAND.md before it ships, and the word "moments" is ruled on as a tab label (NS-51-R35 bans it on the Me row) | C | P1 | NS-51-R35 |
| MT-P2-R32 | Given a tap on a `photoMoment` note, Then Moments opens with payload `{source, kind}` only, reads nothing from the payload, and a tap with no matching card opens Moments plainly | U, D | P1 | NS-46-R32 pattern |
| MT-P2-R33 | Given any email from the moment signal, Then it is a commercial class with a separate opt-in off by default, built only from `serverSafe` sources (S3), neutral, no child name by default, never on a date with a phone reminder, suppressed on a letter-made day, and not shipped at 1.0 | U, review | P0 (b) | E75, LEGAL-REQ-053, FR-MKT-44 |
| MT-P2-R34 | Given the app backgrounded with any Moments card on screen, Then the switcher snapshot shows no day name, fragment, typed words or thumbnail, with or without App lock | D | P0 (a) | NS-50-R9, NS-51-R25, NS-23-R11 |
| MT-P2-R35 | Given the tab icon and the app icon, Then there is no badge, dot or count for Moments | S, D | P0 (a) | CLAUDE.md content rules |
| MT-P2-R36 | Given any card, tap or dismissal, Then no analytics event, log line or crash payload carries a card, source, date, picture, count or letter id; canary strings find 0 hits | U | P0 (a) | NS-50-R17, NS-51-R27, R28 |
| MT-P2-R37 | Given airplane mode, Then every source works the same (nothing needs the network) and the library is never fetched from the network | D | P1 | NS-51-R21, R26 |
| MT-P2-R38 | Given VoiceOver, Voice Control, Switch Control, AX5, Bold Text and Reduce Motion on an iPhone SE 3, Then each card is one element read as its reason, date and content, with its dismiss as a custom action and a separate 44 pt button, the picture items read "Picture 1 of N" without describing content, and motion is at most the 200 ms fade of NS-50-R12 | D | P0 (b) | NS-50-R12, R14, NS-51-R34 |
| MT-P2-R39 | Given the same inputs and local date, Then `momentsFor` returns the same list on every call, across cold starts and two phones holding the same book (S7 differs by phone by nature) | U | P1 | NS-23-R13 |
| MT-P2-R40 | Given fixtures, Then every Moments test uses the fictional family Asha and synthetic pictures; no real name, place or picture from the founder's screenshots exists in the repo | S | P0 (a) | `no-real-family-data.test.ts` |
| MT-P2-R41 | Given the five-parent two-week diary (section 9), Then results are recorded as x of n with the stop line; no telemetry | research | P2 | NS-50-R13 pattern |

## 11. Reversals the founder owns

Each row is an earlier ruling this proposal, or the founder's new ask, overturns or bends. I changed none of them.

| Id | Earlier ruling | What changes | If the founder says no |
|---|---|---|---|
| R-TABS | Three-tab ruling (`infra/scope-stack-rank-and-ia-redesign-2026-11-19.md`, not read), IA-R1, navigation tests N1, N4, J12 | Four tabs with Moments second | Choose option D (inside Home) and accept the feed risk, or drop the tab |
| R-J4 | J4, IA-R3, N3: only Home starts a letter | Moments hands to the one capture entry; it has no recorder (brief) | Moments only opens Home with the item pre-chosen |
| R-K02 | K-02: no permission ask during first run | Not touched under option A: the ask happens only after the parent opens Moments and taps. It is overturned in full only under option C (Moments default) | Keep A |
| R-1305 | BL-1305, FR-PHS-40: no photo usage string or PhotoKit call in any 1.x build | Route B needs both. BL-1305 also conflicts with NS-49 saying level 3 ships in 1.1 (the wheel doc already flagged this) | Route A only |
| R-ML6 | ML-6 (as the brief states it): cards show a date, never a place or thumbnail | S7 and Recent show thumbnails of the parent's own pictures; this file keeps place out | Date-only cards, no thumbnails (the tab becomes much weaker) |
| R-NS51-R8 | NS-51-R8: the capture menu offers only the newest moment, never a list or an older one | Recent lists days newest first, capped | Recent shows only the newest day |
| R-NS50-10 | NS-50-R10 and R-IA-3: no picture slip, tile or strip (on Home) | Not touched for Home; Moments is a different tab. Stated so the founder sees the line is kept for Home only | Same |
| R-NS50-5 | NS-50-R5 rank 4 and NS-23: the past letter is Home's last slip | It moves to Moments when the flag is on | Keep it on Home; Moments shows it as a link only |
| R-E75 | E75, E79, LEGAL-REQ-053, FR-MKT-44: no nudge email and no push at 1.0 | Only if the founder wants a moment email at 1.0 | Email waits for a later release, as section 8.4 |
| R-NS51-R35 | NS-51-R35: the Me row avoids "moments" | The tab label may be "Moments" or another word | `content` chooses another single word |

## 12. Dependencies and reconcile points

- Route choice and what each route can read: the feasibility doc (`docs/product/MOMENTS-TAB-FEASIBILITY-21nov.md`, not yet written when I looked). If Apple's picker cannot be launched from inside a tab, Route A's Recent row changes.
- Permission states and the value-props state M0: the other product leads and the design concept. I assume the wheel doc's M0 to M5 and Q-HEW-3 (one ask on a tap, never re-asked).
- Privacy and constitution analysis (`docs/product/MOMENTS-TAB-PRIVACY-AND-CONSTITUTION-21nov.md`): R3, R5, R24, R36 should match its lists. Theirs wins where it is stricter.
- Benchmark B1 (`docs/product/moments-tab/B1-market-benchmark.md`, branch `wip/moments-b1`): not present when I looked. This file makes no market claim. When B1 lands, check it against section 9 and section 6.3.
- Content: reason lines, tab word, Today lines, neutral photo wording, Me list words (MT-P2-R4, R31).
- Design: the four slots, Recent capped to one screen, reason line on every card, glass limits.
- Mobile and QA: `momentsFor` in `packages/core`, planner and `chooseOnePerDay`, device rows for access states.
- BACKLOG rows are not written here (I was asked not to edit `docs/BACKLOG.md`). The integrator should add tasks for `momentsFor` and its registry, the Me list, and the planner `photoMoment` source.

## 13. Edge and unhappy paths

| Case | What happens | Row |
|---|---|---|
| Day of pictures is today and a letter is made | The pictures stay in Recent without a mark; the photo reminder is silenced for the day | R17, R29 |
| Typed day and birthday on one date | One Today card, typed first, birthday named too | R6 |
| Parent has no letters and no date of birth day today | Only the question shows | R2 |
| Moving day with no date for next year | No card, no promise, no "missing" line (NS-46-R15) | R8 |
| Library permission revoked in Settings | Recent turns to the calm line and the picker; the index is emptied at the next open | R20, R24 |
| Limited access, a few pictures | No Recent days; no message; Choose which pictures only in the Me row | R20 |
| iCloud-only picture | A plain box; no download from the index | NS-51-R21 |
| Two phones, same account | S1 to S3 and S6 match by book and date; S7 and S4's Not this one differ per phone | R24, R39 |
| Time zone change | Cards follow the phone's local date; reminders follow NS-32-R6 | R28 |
| Parent in a quiet book | Nothing from that book anywhere | R14 |
| Account sign-out or Erase | Index, hidden-day keys, local letter list and switches are cleared; sign-out keeps the book | R24 |
| Notification denied | Cards still show; no reminder; plan date stays in Settings (NS-32-R4) | R28 |
| Parent dismisses everything every day | Nothing changes, nothing is said | R23 |

## 14. Constitution, privacy and accessibility checks

- Constitution: R3 (no machine words), R4 (reasons are ours, not about the parent's content), R11 (verbatim fragment only). The only text from a person's content is their own words, unchanged.
- Privacy: library reads are dates and type only (R5); nothing leaves the phone (R36, R37); the server sees no library signal (R27, R33); a place name is never produced, so the unverified question of whether reverse geocoding sends coordinates to Apple does not arise (the brief marks it UNVERIFIED); safety state stays on the device (R14).
- Data Not Collected label: holds only while no picture, thumbnail, date or identifier leaves the phone (NS-51-R26, R30). Counsel must confirm before any profile turns the flag on. A moment email (R33) would need its own label check.
- Accessibility: R34, R35, R38. Reduce Transparency and Increase Contrast belong to the design concept; cards are paper content, glass only on navigation (DESIGN-LANGUAGE-V2).

## 15. Open questions (each has my recommended default and a deadline)

Deadlines are PROPOSED; I have not read the Build 13 freeze date.

| Id | Question | Recommended default | Deadline |
|---|---|---|---|
| Q1 | Tab position: A (Home default, Moments second), B (centre of five), C (Moments default), D (inside Home) | A | Mon 24 Nov 2026 |
| Q2 | Does Past letter move from Home's slip order to Moments (R-NS50-5)? | Yes, when Moments is on | 24 Nov |
| Q3 | Are the four slots and the cap on Recent accepted as the answer to "not a feed"? | Yes; Recent capped to one screen | 24 Nov |
| Q4 | May an S4 card show the picture the parent attached to that letter? | Yes (their own picture, already in the book); a library thumbnail only in Recent | 28 Nov |
| Q5 | Should "Not this one" for a letter sync across phones? | No, local only, since sync needs a schema change | Before design freeze |
| Q6 | Tab word: "Moments" or another single parent word with one verb; and is "moments" allowed given NS-51-R35 | `content` proposes; default keep "Moments" as the working name only | 28 Nov |
| Q7 | Is any moment email wanted at 1.0 (reverses E75), and if later, one a week at most? | No email at 1.0; one a week at most later, opt-in | Before any email build |
| Q8 | Is the diary study (R41) enough evidence to decide whether Moments earns the second tab? | Yes; no analytics | 28 Nov |
| Q9 | Can the date of birth be corrected after the book is made (needed for S3 corrections)? | Unknown; mobile to check | 24 Nov |

## 16. VERIFIED, UNVERIFIED and guesses

VERIFIED this session (read, with path or URL):
- Everything cited by id from the repo files in section 2 (read at `86eccfa`, and the wheel doc on its branch). These are repo statements: they are VERIFIED as what the files say, not as what the code does.
- Apple, "Journaling Suggestions and Privacy", `https://www.apple.com/legal/privacy/data/en/journaling-suggestions`, fetched this session: suggestions are generated on the device; they reach a journaling app only when the person chooses them; only the person sees them before sharing; the person can turn off all suggestions and choose which data categories feed them; contacts and locations are not shared by the Bluetooth ranking signals; notifications can be turned on or off. This supports the Route A statements in section 5. It says nothing about iOS version needs, the entitlement or the sheet's behaviour inside a tab.
- `packages/core/src/prompts.ts` (code read): `kindFor` returns `gap` when days since the last letter reaches `GAP_DAYS`; `excludeKeys` exists; `selectPrompt` is deterministic by seed.

UNVERIFIED (not read this session):
- ML-1 to ML-14 text, ML-3 and ML-6 as quoted by the brief only.
- The three-tab ruling document.
- Whether the server holds typed days or ticked days (the repo says phone only; the brief suggests otherwise).
- How `lib/reminders/planner.ts` handles day 31 and a 29 Feb birth; how hard-stretch is derived; whether a date of birth can be edited.
- Journaling Suggestions API behaviour inside a tab, iOS 17.2 floor and entitlement (repo S5 records them; I did not re-read them).
- Whether the founder's screenshots are Apple's system sheet.
- Any statement about competitors: none made, B1 absent.

Guesses (labelled in place): the four slot structure's fit for a real family's day, the recent window of 90 days (from NS-51-R7, itself ASSUMED), the number of Recent days on one screen, the one a week email cap, the diary stop line, and how often a real source other than the question exists on a given day (unknown, F6).
