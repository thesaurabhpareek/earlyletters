# Moments tab, P4: from a moment to a letter with the photos attached

Status: PROPOSED. Nothing here is decided, built or recorded in `DECISIONS.md`. 21 Nov 2026. Lead: product P4 of 5. Docs only. Fictional family Asha only. Words in quotes are intent for `content`, never final copy. No real name, place or picture from the founder's screenshots is used or described beyond the brief's own summary.

## 1. Purpose and scope

The founder wants a Moments tab that helps a parent find what letter to write, and then attach pictures or videos to it. This file owns the middle of that road:

1. What a tap on a moment does, and how that reconciles with J4 ("only Home starts a letter", NS-35).
2. The attach rules: limits, order, copies, export, deletion (NS-52).
3. What is saved and what is not. Never a machine title.
4. Review and Keep with media. The letter page with pictures.
5. What happens when a photo is later deleted from the library.
6. Shared-book rules.
7. Because the coordinator's update asks every lead: where the tab sits, what brings a parent back every day, and how one moment signal drives in-app cards, local push and email.

Out of scope here (other leads own them): what the tab looks like before permission, the two routes' feasibility, the card visuals, the permission copy, the push copy, legal reads. I cite them by assumption (section 12).

## 2. Inputs read

Read in a depth 1 clone of `develop` this session:

| Id | Path | Used for |
|---|---|---|
| I1 | `docs/product/prd/27-photo-moments-and-media.md` (NS-51, NS-52, Q-PM-1 to Q-PM-12) | Limits, pipeline, flags, sync variants, error codes |
| I2 | `docs/product/prd/01-photo-with-a-letter.md` (NS-01-R1 to R52) | Review, Keep, letter page, Photos lens, deletion, Undo |
| I3 | `docs/product/prd/21-days-cultural-photos-home.md` (NS-49-R7, R9, R11, R29, R30) | Level 2 picker, "From your phone" title rule |
| I4 | `docs/product/prd/11-foundations.md` (NS-35-R1 to R5, NS-32-R1 to R16) | The one-start rule, the notification budget |
| I5 | `docs/product/prd/10-reading-and-family.md` (NS-25-R1 to R19) | Two parents in one book |
| I6 | `docs/design/e2e/A-capture/DESIGN.md` (A-S01 to A-S16) | The capture screens and states |
| I7 | `docs/design/IA-FINAL-20nov.md` line 313 (NS-35 "Only Home starts a letter") and line 177 (no strip, R-IA-3) | J4 as written |
| I8 | Branch `docs/product-home-engagement-wheel-21nov`, `docs/product/HOME-ENGAGEMENT-WHEEL-21nov.md` sections 3, 7.1 to 7.7 (NS-53 rows, M0 to M5, hand-off 7.4) | The proposed tab and its hand-off; I align with it and cite its ids |
| I9 | `/home/claude/moments-brief.md` and its UPDATE line | Direction, decisions of record, nudge constraints |
| I10 | https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker.md | Read this session. See section 13 |

Not present when I looked: the privacy and constitution analysis, the feasibility doc and the design concept (no open PR or `wip/moments-*` branch was listed), and the market benchmark B1 (`wip/moments-b1`, not on the remote). I did not read ML-1 to ML-14 as the project doc (not reachable); I use ML-3 and ML-6 as the brief states them. Where this file needs a fact from those, it says "assumed" and names where to reconcile.

## 3. Reversals the founder owns

The founder's direction overtakes these. Each is a reversal, not something I can waive. Each row names what this file does about it.

| Id | Ruling today | What changes | Where it bites in this file |
|---|---|---|---|
| RV-P4-1 | J4 / NS-35-R1, R3, R5 (I4, I7): only Home starts a letter; the start-source list in `start-capture.logic.ts` is closed | Moments hands off to the one start function with a new source `moment`. I keep "one start function, one recorder" and move only who may call it | R1 to R4 |
| RV-P4-2 | NS-01-R2, NS-01-R22 (I2): no library access, system picker only | Route B reads the library (dates only, NS-51-R5). The attach itself still uses system code and never a third-party picker | R6, R7 |
| RV-P4-3 | NS-51 section 3 item 3 (I1): library moments show only in the capture cluster menu | They also show in the Moments tab | R1 |
| RV-P4-4 | NS-50-R10, R-IA-3 (I7): no picture slip, tile or strip on Home; no feed | Moments shows pictures. On Home, section 4 proposes at most one neutral pointer. If the founder refuses the pointer, Home shows nothing about pictures | section 4, R40 |
| RV-P4-5 | NS-49-R9, Q-FD-30 (I3): Apple's suggestion title may show as "From your phone: {title}" and be copied by "Use this" | The brief says a machine title from Apple's picker is never stored or shown by us. This file follows the brief. NS-49-R9 as written still allows it, so one of them must give | R14, R15 |
| RV-P4-6 | Three tabs (IA-R1, N1, N4, J12; `infra/scope-stack-rank-and-ia-redesign-2026-11-19.md`) | A fourth tab, or a fifth, or none (section 4) | section 4 |
| RV-P4-7 | NS-35-R3 (I4): a notification tap lands on Home or a reading screen | If a moment nudge opens Moments, that is a new landing | section 4.4 |
| RV-P4-8 | K-02 first-run rule, BL-1305, ML-6 (brief) | Owned by other leads; they sit upstream of every row below and I do not restate them | none |

## 4. Where the tab sits, and what brings a parent back

This is an IA question the update gave every lead. My answer is for the hand-off and the daily return. It is a recommendation with reasons, not evidence. No parent has seen any of it.

### 4.1 The four options against the rules

| Option | For | Against |
|---|---|---|
| A. Home stays default, Moments second (Home, Moments, Book, Me) | Keeps J4 closest: Home is still where a letter starts today. The cold start shows the prompt and the cluster, which works on day one with no permission. Smallest change to IA-R1 and J12 | The daily reason sits one tap from the landing view. Needs the Home pointer (4.3) or the nudge landing (4.4) to carry it |
| B. Moments centre tab in a five-tab bar | A centre slot reads as "the main thing" | A fifth tab needs a fifth job and J12 (remove any tab and one job is undone) must hold for five. The centre slot invites a raised start button, which would be a second start control (N3). I would not do it |
| C. Moments default | Strongest daily pull if there is always something | A returning parent on a thin day lands on an empty or quiet state. Moments before permission is a value-props page, so every cold start shows marketing. It reverses the most rules at once. Home would no longer be the landing for "say" |
| D. Moments inside Home | Fewest tab rules touched | It is a strip on Home. R-IA-3 and NS-50-R10 forbid a strip, and Home and Book would look the same, which the founder named as a risk |

Recommendation: A. Reason in one line: a landing view that always has something true to show (the prompt) beats one that depends on what the library holds today. Open question OQ-P4-1 holds this for the founder and for the five-parent read (J5) and the device pass (J11).

### 4.2 The daily reason to come back (no streak, count, guilt or gap)

The honest picture: a library moment exists only on days the parent took pictures, and a marked or typed day is rare. So "every day" cannot rest on moments alone. I propose three layers, each real, none invented:

1. Always: today's ordinary prompt (built) and the parent's own past letter from this day in an earlier month or year (NS-23).
2. Often: a day of their own pictures, a marked day, an age day from the child's date of birth.
3. Sometimes: nothing, and that is a calm state (M3, M5 in I8). Never "no moments yet", never a count of anything.

What pulls the parent back is "something of yours is here, and saying a few words about it takes a minute". The words never claim the app found or chose it (NS-51-R10, NS-53-R8). What does not pull: a streak, a "you missed", a total, a points or badge model (CLAUDE.md content rules).

I can state no retention effect. The measure that fits the constitution is letters kept, not opens, and analytics are opt-in with no media or moment fields (NS-52-R43, NS-53). Whether that is enough to judge the tab is OQ-P4-6.

### 4.3 Home and Moments, one owner per fact

If Moments is second, a pointer on Home costs the parent one tap less. Proposal (founder-owned, RV-P4-4): the existing single slip slot may carry one neutral pointer that opens Moments, only on a day a moment exists, ranked below typed day, birthday and month age (as NS-51-R11 ranks the nudge), never with a count or a picture. Same item never shows in full on both tabs (I8, 7.2). If refused, Home is unchanged and the push or email carries the return.

### 4.4 One moment signal, three surfaces

One on-device value, computed from what the phone legitimately knows. It never goes to the server.

```
MomentSignal { kind, localDate, localRef }
kind: library | typedDay | birthday | monthAge | pastLetter | prompt
localRef: stays on the phone; never serialised to a push payload, log or request
```

| Surface | What it takes from the signal | What it must not carry |
|---|---|---|
| In-app card (Moments, the Home pointer) | Everything, including thumbnails of the parent's own pictures | Title, place, caption, count, "best" |
| Local push (NS-32, NS-51-R11) | Only `kind` mapped to a fixed content key, planned at foreground (Q-PM-8), inside the one a day budget (NS-32-R1), below `monthAge`, silent for a quiet book (NS-32-R14), `active` not time-sensitive (NS-32-R10), neutral hidden-preview text (NS-32-R13) | Photo, thumbnail, place, count, the word "waiting", a child name unless names are on (NS-32-R12). ML-3 as the brief states it: random id, fixed text, nothing derived from the library |
| Email | Only what the server already legitimately holds: the child's date of birth, typed days if they are synced (UNVERIFIED that they are), letters made | Any library kind. The server learns nothing about the library, so an email cannot say "you have pictures" and must never be made to by letting the phone tell the server |

Consequences I want the founder to read plainly:

- A library nudge is planned only when the app is opened. A parent who has not opened it for a week gets no new picture nudge. So picture nudges cannot win back a lapsed parent. Email cannot either, because it has no library signal. What can reach a lapsed parent is the age-day and typed-day class.
- Push and email can disagree on a given day (push built from the phone, email from the server). The neutral wording keeps that harmless. I would not try to align them by sending the phone's signal up. That would change the Data Not Collected story.
- A nudge tap opening Moments is RV-P4-7. If refused, it lands on Home and the pointer in 4.3 does the work.
- The email budget, quiet hours for email and consent for email are not in the files I read. Open question OQ-P4-7. I propose no number.

## 5. The hand-off: tapping a moment to a letter

### 5.1 How J4 is reconciled

J4 says one place starts a letter. I keep the intent (one start function, one recorder, a closed source list, a test) and change one thing: Moments may call that function. Capture then behaves as a mode of Home's single start, presented as a full-screen route over whichever tab the parent is on.

Why not "capture lives on Home only, so Moments switches tabs to Home first": the parent would lose the pictures they just chose and see Home's prompt before their own pictures. Why not "Moments owns a recorder": it breaks N3 and NS-35-R2 (a second start). So: one function, a new allowed source.

### 5.2 The flow (both routes)

1. The parent opens Moments and sees a day or a suggestion of their own pictures (dates only; no title, place or caption of ours; no Apple title).
2. They tap it. A sheet of their own pictures opens (Route B: our sheet, thumbnails of at least 96 pt as in NS-51-R9. Route A: Apple's sheet, which we cannot style).
3. They choose one or several. Nothing is stored yet.
4. They tap the one control to start. `startCapture({ source: 'moment', items })` runs. The items are a list of references the system gave us, in the parent's order (R11).
5. Each item is copied, stripped and validated by the NS-52 pipeline, in the foreground, with progress and Cancel (NS-52-R33). Typing is not blocked by a transcode.
6. Capture opens at Ready (A-S04) with the pictures above the prompt and an empty photo-words field (NS-51-R9). The parent speaks (A-S05) or types (A-S06).
7. Review (A-S07), Keep, saved moment (A-S13), Book.

The prompt is the ordinary prompt and does not depend on the pictures. NS-01-R3 already tests it with three different fixture pictures and one fixed state; this file extends the test to several pictures and to `source: 'moment'`.

### 5.3 One attach contract for Route A and Route B

The two routes differ in how the parent chooses. They must end at the same contract so the rest of the flow is built once.

`AttachRequest = { source: 'moment', items: ordered list of system item references, picked_at }`

- No title, no suggestion date range, no place, no people, no album, no filename crosses the contract. If Apple's picker returns them (Route A), the adapter drops them before the contract (R14).
- A reference is used once and discarded. The app deletes only its own temporary copy and never deletes or moves what the system returned (NS-49-R7 pattern).
- Route A returns the photos Apple chose to include for that suggestion. Whether the parent can deselect some, and whether videos come across, is UNVERIFIED (I10 does not say). R9 covers the case where the count exceeds the limits.

### 5.4 If a letter is already waiting

If Home shows a draft waiting to be kept, a moment tap must not silently add to it or replace it. Proposal: one question, "Add these to your waiting letter, or start a new one?" with the safe default "Add", and nothing changes on Cancel. Whether adding to a waiting letter is allowed at all today is not in what I read (NS-52-R2 allows Review's Add). OQ-P4-4.

### 5.5 Which book

A moment is tied to no child, because there is no face or person matching. The letter goes to the active book. Review already shows To (A-S07) and the whose-book sheet exists (A-S02). The parent corrects it there. No line guesses whose picture it is. This matters most for a family with two children.

## 6. Attach rules (NS-52 applied to a moment)

All defaults here are Q-PM-2's, which the founder accepted as ASSUMED with no size or price read. I invent no new number.

| Topic | Rule |
|---|---|
| Limits | At most 6 pictures and 2 videos per letter; a video up to 60 seconds; a stored video up to 100 MB (NS-52-R1). One constants file feeds the sheet's selection cap and the check |
| Selecting a whole day | There is no "select all". A day of 40 pictures is shown, and the parent picks. At the cap the sheet stops adding and says one calm line (NS-52-R34). No "left" count |
| Order | The order the parent picked them in, when the source reports it. If not, the order shown in the sheet, which the parent saw. The parent can change it in Review (NS-52-R14). The machine never reorders, crops or builds a highlight (NS-52-R29). OQ-P4-2 asks whether showing time order counts as machine ordering |
| Copies | Pictures: stripped, upright JPEG, long side at most 4,032 px, in Application Support (NS-01-R6, R34, R37). Videos: copied to Caches, checked by bytes, re-encoded to at most 1080p with metadata atoms removed, stored under Application Support, temporary copy deleted (NS-52-R5, R8). Live Photo: still only (NS-52-R12). The library original is never touched |
| Sound in a video | Stays in the file. Never transcribed or analysed (NS-52-R6) |
| Export and Save a copy | Every item, stripped, streamed to disk, with a size line first (NS-52-R17, R18). Export works with every switch off (LEGAL-REQ-040 as cited in I1) |
| Deletion | Remove one item: Undo for the NS-01 window, then the file is deleted and its bytes checked (NS-52-R15). Delete a letter, Let it go, Erase now, Erase everything: every item goes, restore inside Recently deleted brings them back (NS-52-R16, NS-01-R16b, R16c) |
| Plan | Attach, replace, remove, view and export are never gated (NS-01-R18, NS-52-R35). The only gate is Keep of a new letter after the allowance |
| Quiet day | "Not much today" cannot carry a picture (NS-01-R25). A moment tap never creates one |
| Where it lives | Variant A (the default, Q-PM-3): on this phone and in the iPhone backup. The where-it-lives lines name pictures and videos (NS-52-R36) |

## 7. What is saved and what is not

Saved (on the phone, as NS-52 section 10 and 11 describe):

| Item | Note |
|---|---|
| Stored copy of each picture and video | Stripped. L4 |
| Poster frame of a video | Derived name, no stored path |
| `kind`, `duration_ms`, `position` (order) | Order is the parent's |
| Photo words and "Describe this picture" | Only if the parent typed them. Optional. Writing tools off |
| Place | Only if the parent typed it. Never read from a file |
| Letter date | Only if the parent confirmed it (NS-01 OQ-1) |
| The parent's own words, audio, edits | Untouched by any media action (NS-01-R8) |

Not saved, not shown, not logged:

| Item | Why |
|---|---|
| Any title Apple's picker or the system gives a suggestion | The constitution: no machine title (brief; RV-P4-5) |
| The suggestion's date range as a label | A date a parent can check is fine on the card from the phone's own picture date. We do not store it as the letter's date |
| Place name, map tile, people's names, scene, "outing", "visit" | Never read (Q-PM-5, Q-PM-6, NS-51-R5) |
| Library asset identifier, album, filename, original creation time | The letter holds no pointer back to the library (R17). ML-4 as the wheel doc states it |
| Which moment the letter came from | No `source` field in the database. `source: 'moment'` lives only in the start call and is not logged |
| Counts, sizes, durations, types | Not in analytics, logs, crash payloads (NS-52-R43, R44) |
| The choice the parent made in the sheet | Not kept after the copy. If they back out, 0 files and 0 rows (NS-01-R4) |

## 8. Review and Keep with media

- Review (A-S07) shows the letter sheet with To, day, From, the words, and a media strip in the parent's order. The strip has Add (opens the system picker, NS-52-R2), Remove, Move earlier and Move later, and drag.
- Keep is disabled until there are words. Media alone cannot be kept (NS-52-R3, NS-01-R5a). A voice-only letter waits for its words as today (D-103).
- A media failure never costs words, audio or the other items. The one calm line shows and the letter can still be kept (NS-52-R11).
- Keep counts exactly as it would without media (NS-01-R5b). It is not gated by media.
- The letter date: Review's day sheet (A-S08) defaults to today. If the pictures' own date differs, a single optional chip may offer that date. It is never preselected and never used silently (NS-51-R10). OQ-P4-3 asks if even offering it is a suggestion we should not make.
- Back out before Keep: 0 files, 0 rows, Moments is as before (extends NS-01-R4).
- Let it go removes the recording and every item's file first, then rows (NS-01-R16c, A-S11).
- After Keep (A-S13): the saved moment shows the pictures. The parent lands on the Book as today. A Moments tab "done" state would be a count or a tick of gaps, so I propose none.

## 9. The letter page with pictures

- Items show in the parent's order. A video shows a poster with a play control of 44 pt or more. It plays only on tap, never autoplays or loops, respects the silent switch, pauses on inactive and App lock (NS-52-R13).
- VoiceOver reads the parent's photo words if present, else a fixed phrase: "Picture 2 of 4" or "Video, 42 seconds". Never a description (NS-52-R28, NS-01-R21c).
- Only the author can add, change, remove or edit words (NS-01-R9c).
- Every picture and frame is replaced by an opaque box before the switcher snapshot, with or without App lock. No external playback and no Picture in Picture (NS-52-R30, NS-01-R13a). No picture draws before unlock (NS-01-R13b).
- AX5 on an SE 3 stacks to one column and nothing truncates (NS-01-R20c).
- The Photos lens shows one card per letter drawn from the first item, a play glyph for a video, no count, no add control (NS-52-R41, NS-01-R11, R23b).
- A spec conflict I found: NS-01-R11 says no number of pictures appears on screen "or in any VoiceOver string", while NS-52-R28 labels items "Picture 2 of 4". I read R11 as the lens (a count of pictures per letter) and R28 as a position inside one letter. I recommend NS-01-R11 be reworded to say so. Founder or the reviewer decides.

## 10. When a photo is later deleted from the library

Plain answer: nothing happens to the letter. The letter holds its own stored copy and no pointer back (R17).

| Case | Behaviour |
|---|---|
| Parent deletes the original in Photos after Keep | The letter still shows our copy. Nothing is removed, and nothing is said |
| Parent deletes the letter in Early Letters | Our copies go (R19). The original in Photos is untouched. We never delete from the library |
| Parent expects deleting in Photos to remove it from the letter | It does not. This is a trust risk: a parent may think a child's picture is gone when our copy and the iPhone backup remain. So one plain sentence must exist where pictures are attached and in Me, Storage: "Pictures in a letter are copies. Taking one out of Photos does not take it out of your letter, and taking it out of your letter does not take it out of Photos." Words for `content`; counsel reads it (R20) |
| Original deleted between the tap and the copy | That item drops with one calm line. The other items and the words stay (NS-51-R22, NS-52-R11) |
| Moments card whose source is gone | Drops quietly, no message (NS-51-R22). A day below the threshold disappears |
| iCloud original not on the phone | The copy waits for the system's download with progress and Cancel. Offline: skipped with one calm line (NS-52-R9) |
| Our own stored file missing (a restored phone, a failed backup) | A plain box and one calm line, words intact, the row kept. Never an error code (NS-52-R40; and NS-01-R36's carve-out) |
| Parent turns off library access in iOS later | Existing letters are unaffected. Moments falls back to M4 (I8) with no line about access |

## 11. Shared-book rules

The facts, from I1, I2 and I5:

- Under Variant A nothing about media syncs. A push carries no media path. A pull never creates, changes or deletes a media row (NS-52-R19, NS-01-R15).
- So with two parents in one book, the other parent's phone gets the words of a letter and none of its pictures. It will not show a box for them either, because no row arrives. I could not find a requirement that says this is acceptable or says what the second parent sees. This is a real product gap and the most important thing in this section. OQ-P4-5.
- Proposed rule (R32): the first time a parent attaches media in a book that has another member, one plain line at Review says where the pictures live and who sees them ("These pictures stay on this phone and in your iPhone backup. The other parent reads the words."). It is a PRIV-R21 door: Shown, Records (nothing beyond the files), Never (no upload, no show to the other parent), Decline (Remove, or do not attach).
- Under Variant B (only if the founder chooses it) media reach the other parent only through NS-25's rules, private letters of any author are skipped (E15), and a share through NS-05 never carries a video (NS-52-R25, R37).
- Moments is per phone and per account. Parent 2's phone builds its own index. Neither sees the other's moments. If a family uses a shared iCloud library, both may be offered the same day and write two letters. We keep no identifiers, so we cannot dedupe and I propose we do not try.
- A second account on the same phone never sees the first's media, index or opt-in (NS-51-R24, NS-25-R19).
- Only the author edits media in a letter (NS-01-R9c). The other parent cannot remove or add to it.
- A quiet or hidden book contributes no moment and no nudge (NS-32-R14, NS-23-R8, I8 NS-53-R12).
- Share (NS-05 level 1) still carries at most one picture and never a video, and still needs the X2 reads (NS-52-R37).

## 12. Requirements

Test layers: unit, scan, db, device, content, e2e, review. P0 reasons: (a) a promise, (b) a legal or store duty, (c) the core loop. Every row's test title starts with its id. Ids are PROPOSED. Cited rows are not copied or changed.

| Id | Given, When, Then | Pri | Layer and title | Cites |
|---|---|---|---|---|
| MT-P4-R1 | Given any tap on a moment, Then it calls the one start function with source `moment`, and the closed source list gains `moment` in the same PR as its handler; Moments imports no recorder, no Listen or Write module | P0 (c) | scan `[MT-P4-R1] moment is a closed start source` | NS-35-R1, R5, NS-53-R10, RV-P4-1 |
| MT-P4-R2 | Given Book and Me, Then they still start nothing and the Photos lens has no add or start control | P0 (c) | e2e `[MT-P4-R2] only Home and Moments start` | NS-35-R1, IA-R4, NS-01-R23b |
| MT-P4-R3 | Given capture begun from a moment, When the parent backs out before Keep, Then 0 files and 0 rows remain, temporary copies are deleted and Moments equals its state before the tap | P0 (a) | e2e `[MT-P4-R3] backing out writes nothing` | NS-01-R4, R52 |
| MT-P4-R4 | Given a moment hand-off, Then no database field, log line, breadcrumb or analytics event records that the letter began from a moment | P0 (a) | scan+unit `[MT-P4-R4] no source is recorded` | NS-52-R44, NS-01-R51 |
| MT-P4-R5 | Given Moments is the caller, Then the prompt shown at Ready is chosen by the same function as without pictures and is identical for 3 different fixture sets and one fixed state | P1 | unit `[MT-P4-R5] the prompt ignores the pictures` | NS-01-R3 |
| MT-P4-R6 | Given the attach, Then the only code that reads or re-encodes a picture or video is the system's; the lockfile scan finds no third-party picker, decoder, editor or media package | P0 (a) | scan `[MT-P4-R6] system media code only` | NS-52-R2, R38 |
| MT-P4-R7 | Given Route A or Route B, Then both hand the same `AttachRequest` to the same pipeline and a test runs the pipeline with fixtures from each adapter | P0 (c) | unit `[MT-P4-R7] one attach contract` | section 5.3 |
| MT-P4-R8 | Given each picked item, Then it passes the NS-01 picture pipeline or the NS-52 video pipeline and 0 of 10 stored pictures and 0 of 10 stored videos carry location or device metadata | P0 (a) | unit+device `[MT-P4-R8] every stored copy is stripped` | NS-52-R4, R5, R8 |
| MT-P4-R9 | Given a selection above 6 pictures or 2 videos, Then the sheet stops adding at the cap with one calm line naming the limit, with no count of what is left, there is no "select all", and nothing already chosen is lost | P1 | e2e+content `[MT-P4-R9] caps are calm and manual` | NS-52-R1, R34 |
| MT-P4-R10 | Given a video over 60 seconds, a corrupt, oversized or iCloud-only item or low space, Then that item is refused or waits with one calm line, the words and other items are intact and the letter can still be kept | P0 (c) | e2e `[MT-P4-R10] one bad item costs nothing else` | NS-52-R7 to R11 |
| MT-P4-R11 | Given several items, Then they are stored in the order the parent picked, else the order shown in the sheet; the machine never reorders, crops, selects or builds a highlight; a scan finds no ranking, scoring or best-of code on media | P0 (a) | unit+scan `[MT-P4-R11] the parent's order` | NS-52-R14, R29 |
| MT-P4-R12 | Given Review, When the parent reorders by drag or by Move earlier and Move later, Then `position` updates and words, recording and edits are byte-identical | P1 | e2e `[MT-P4-R12] reorder with an accessible control` | NS-52-R14, NS-01-R8 |
| MT-P4-R13 | Given a picked item, Then the library original is never modified, moved or deleted by our code, and only our own temporary copy is deleted | P0 (a) | unit `[MT-P4-R13] the library is read, never changed` | NS-49-R7, NS-01-R52 |
| MT-P4-R14 | Given Route A returns a title, date range, place, people or music, Then the adapter drops each before the attach contract, none is stored, shown, logged or used for a prompt, nudge or Find ranking, and a content test fails any string built from one | P0 (a) | unit+content `[MT-P4-R14] no machine title is kept` | constitution, RV-P4-5, NS-51-R10 |
| MT-P4-R15 | Given Ready after a moment hand-off, Then the photo-words field is empty, nothing is pre-filled, and no string describes what the pictures show | P0 (a) | e2e+content `[MT-P4-R15] nothing is written for the parent` | NS-52-R29, NS-01-R21b |
| MT-P4-R16 | Given the letter date, Then it is today unless the parent picks another; an offered chip from the pictures' date is never preselected and is applied only on a tap | P0 (a) | e2e `[MT-P4-R16] a picture date is never silent` | NS-01 OQ-1, NS-51-R10 |
| MT-P4-R17 | Given a kept letter, Then the database holds no library asset id, album, filename, original creation time or place not typed by the parent | P0 (a) | db+scan `[MT-P4-R17] no pointer back to the library` | NS-51-R5, NS-01-R21b |
| MT-P4-R18 | Given a moment tap while a draft waits, Then the app asks once whether to add or start new, "Add" is the default, Cancel changes nothing, and neither choice deletes the waiting draft | P1 | e2e `[MT-P4-R18] a waiting letter is safe` | section 5.4 |
| MT-P4-R19 | Given a deleted letter, Let it go, Erase now or Erase everything, Then every picture and video of it is deleted, restore inside Recently deleted brings them back, and the library is untouched | P0 (a) | db+unit `[MT-P4-R19] delete takes our copies only` | NS-52-R16, NS-01-R16b, R16c |
| MT-P4-R20 | Given the where-it-lives lines and Me, Storage, Then a plain sentence says pictures in a letter are copies and that removing one place does not remove the other, and it has a claims-inventory row | P0 (b) | content `[MT-P4-R20] copies are named truthfully` | NS-52-R36, NS-01-R32 |
| MT-P4-R21 | Given an original deleted from the library after Keep, Then the letter and its stored copy are unchanged and no line shows | P0 (a) | device `[MT-P4-R21] deleting from Photos leaves the letter` | section 10 |
| MT-P4-R22 | Given an original deleted before the copy finishes, Then that item drops with one calm line and the rest stays | P1 | unit `[MT-P4-R22] a vanished source costs one item` | NS-51-R22 |
| MT-P4-R23 | Given our stored file is missing, Then a plain box and one calm line show, the row stays, words are intact and no code shows | P0 (c) | device `[MT-P4-R23] a missing copy is calm` | NS-52-R40 |
| MT-P4-R24 | Given media and no words, Then Keep is disabled; given words and any media within limits, Then Keep counts as the same letter without media and is never gated by media | P0 (c) | e2e `[MT-P4-R24] words make the letter` | NS-52-R3, NS-01-R5a, R5b, R18 |
| MT-P4-R25 | Given Review, Then Add opens only the system picker and the 7th picture or 3rd video is refused with the calm line | P1 | e2e `[MT-P4-R25] Review respects the same limits` | NS-52-R1, R2 |
| MT-P4-R26 | Given Remove, Then it leaves with Undo for the NS-01 window and after it the file is deleted and checked; the Undo control leaves the screen in the same moment the window closes | P0 (a) | unit+device `[MT-P4-R26] remove deletes and Undo does not outlive its window` | NS-52-R15, NS-01-R38a, R38b |
| MT-P4-R27 | Given the letter page, Then items show in order, a video plays only on tap, never autoplays or loops, plays with sound only after the tap, respects the silent switch and pauses on inactive and App lock | P1 | device `[MT-P4-R27] videos play only on tap` | NS-52-R13 |
| MT-P4-R28 | Given VoiceOver, AX5, Voice Control, Switch Control and Reduce Motion, Then each item reads "Picture N of M" or "Video, N seconds" or the parent's own words, never a description, controls are 44 pt or more, and AX5 on an SE 3 is one column | P0 (b) | device `[MT-P4-R28] assistive settings work` | NS-52-R28, NS-01-R20c |
| MT-P4-R29 | Given inactive, background or App lock, Then every picture and frame is an opaque box before the snapshot, and a pick that lands while locked is discarded with 0 files | P0 (a) | device `[MT-P4-R29] no frame in the switcher, no locked pick` | NS-52-R30, R32, NS-01-R13a, R13b |
| MT-P4-R30 | Given Save a copy and export, Then every item is included, stripped, streamed, with a size line first and a calm refusal on no space | P0 (b) | unit `[MT-P4-R30] export carries every item` | NS-52-R17, R18 |
| MT-P4-R31 | Given Variant A, Then a push carries no media path, a pull creates, changes or deletes no media row, and the label stays "Photos or Videos: not collected" (counsel confirms) | P0 (a) | unit `[MT-P4-R31] variant A uploads no media` | NS-52-R19, NS-01-R15 |
| MT-P4-R32 | Given a book with another member and the parent's first attach there, Then one plain line at Review says the pictures stay on this phone and the other parent reads the words, with Shown, Records, Never and Decline recorded per PRIV-R21 | P0 (b) | e2e+content `[MT-P4-R32] the other parent is told what they will see` | PRIV-R21, OQ-P4-5 |
| MT-P4-R33 | Given a letter by another author, Then add, change, remove and edit-words controls are absent | P1 | e2e `[MT-P4-R33] only the author changes media` | NS-01-R9c |
| MT-P4-R34 | Given a second account on the phone, Then it never sees the first account's media, index, opt-in or moments, and its start is off | P0 (a) | db+device `[MT-P4-R34] accounts do not share moments` | NS-51-R24, NS-25-R19 |
| MT-P4-R35 | Given a quiet or hidden book, Then no moment, pointer or nudge from it is shown or planned | P0 (a) | unit `[MT-P4-R35] a quiet book adds nothing` | NS-32-R14, NS-23-R8 |
| MT-P4-R36 | Given the Moments hand-off with no child tie, Then the letter goes to the active book and Review's To lets the parent change it, and no string or code guesses whose pictures they are | P0 (a) | e2e+scan `[MT-P4-R36] the parent says whose letter` | NS-01-R33, A-S02 |
| MT-P4-R37 | Given a moment signal, Then its `localRef` and library kind are never serialised into a push payload, an email request, a log, a breadcrumb or analytics, and a canary pictures set produces 0 hits | P0 (a) | unit+scan `[MT-P4-R37] the signal never leaves the phone` | NS-52-R44, ML-3 as stated in the brief |
| MT-P4-R38 | Given a library-kind nudge, Then it is one fixed content key with a random id, no photo, thumbnail, place, count or the word "waiting", is planned only at foreground, sits below `monthAge`, counts inside the one a day budget, and never plans for a day with a letter already made | P0 (a) | unit+content `[MT-P4-R38] the nudge is neutral and budgeted` | NS-32-R1, R11, R12, NS-51-R11, R12, R13 |
| MT-P4-R39 | Given email, Then its content is built only from server-held facts (date of birth, typed days if synced, letters made), has no library-derived variant, and no phone-to-server call exists for a moment | P0 (a) | scan+review `[MT-P4-R39] email uses no library signal` | brief, OQ-P4-7 |
| MT-P4-R40 | Given any day, Then no card, pointer, nudge or email shows a count of moments, pictures, unwritten days or letters, a streak, points, a badge, "again", "still" or "don't forget", and the pointer on Home (if approved) appears only on a day a moment exists and ranks below typed day, birthday and month age | P0 (a) | content+unit `[MT-P4-R40] no counts, gaps or streaks` | NS-51-R12, NS-50-R5, RV-P4-4 |
| MT-P4-R41 | Given a nudge tap, Then it lands on the screen the founder rules in OQ-P4-1, and no tap ever starts a recording on its own | P0 (c) | e2e `[MT-P4-R41] a doorway lands and never starts` | NS-35-R3, R4, RV-P4-7 |
| MT-P4-R42 | Given the flags, Then `EXPO_PUBLIC_PHOTOS`, `killSwitches.photos`, `EXPO_PUBLIC_VIDEO` and `killSwitches.videos` hide the hand-off and Add but leave sweep, Erase and Export working | P1 | unit `[MT-P4-R42] flags remove screens, not data rights` | NS-52-R42, NS-01-R19 |
| MT-P4-R43 | Given airplane mode, Then phone-held pictures attach and a letter is kept; only iCloud-only items wait or skip | P1 | device `[MT-P4-R43] attach works offline` | NS-52-R9, NS-53-R14 |
| MT-P4-R44 | Given fixtures, Then every picture and video is generated by script (Asha, synthetic), no fixture, string, snapshot or doc holds a real name, place or picture from the founder's screenshots | P0 (a) | review+unit `[MT-P4-R44] Asha only` | NS-52-R39, brief |

## 13. Edge and unhappy paths

| Case | What happens |
|---|---|
| Permission denied, limited or off | Moments shows M4 (I8). The system picker still works and the hand-off from it still starts a letter. No line about access |
| Parent dismisses Apple's first-use sheet or the picker | Nothing is written, no retry prompt (NS-49-R11) |
| Suggestion with many photos | The parent chooses within the cap. No auto choice |
| Suggestion with a video over 60 seconds | Refused after the pick with one calm line, no trim (NS-52-R7). The other items stay |
| Video transcode when the app is backgrounded | Pauses; resumes in the foreground; draft kept; no background mode (NS-52-R33) |
| Low Power Mode | The transcode waits for the parent's tap (I1 section 6) |
| Kill during copy | Caches swept at launch; a half-written file removed; the draft and words intact (NS-01-R52) |
| App lock comes up mid-pick | The pick is dropped, 0 files (NS-52-R32) |
| Double tap on a moment | One start only. The second is ignored |
| Same moment started twice on two days | Two letters. We keep nothing to match them (R17) |
| Live Photo, screenshot, a picture of someone else | Still only. Stored as any picture. No detection (Q45, Q48 as cited in I1) |
| Moment flag turned off remotely | The tab hides the hand-off; letters, sweep, Erase and Export are unaffected |
| Quiet day mark | Cannot carry a picture; a moment never creates one |
| iPad, Mac app, Expo Go, Android | Absent, not greyed |
| Two books | Active book; the parent corrects in Review (R36) |
| Signed out | Book and its pictures stay on the phone (NS-01-R30); the moment index clears (NS-51-R17) |
| Restored or new phone | Opt-in and index absent; letter media only if in the iPhone backup; a missing file is a plain box |

## 14. Constitution, privacy and accessibility checks

- Constitution: nothing here writes, rewrites, summarises or shapes words. No title, caption, alt text, mood, scene, place or person is made or kept (R14, R15, R17). No face match (R36). No highlight or auto-order (R11). Nothing says the app found or chose a picture (R38, R40).
- Privacy: nothing leaves the phone from the library (R31, R37, R39). No photo, filename, album, place or date in analytics, logs or crash reports (R4, R37). Safety tiers stay on the device. The Data Not Collected story holds under Variant A only; Variant B changes the label (NS-52-R23). Reverse geocoding is not used (Q-PM-5).
- Door lines (PRIV-R21) for the one act this file adds, "attach pictures to a letter in a book another parent reads":
  - Shown: one plain line at the first attach in a shared book, and the copies sentence (R20, R32).
  - Records: the files on the phone. Nothing about the source or the moment.
  - Never: upload under Variant A, show media to the other parent, delete from the library, describe a picture.
  - Decline: Cancel in the sheet, Remove any item, or Keep without media.
- Accessibility: R28 and R29; plus the sheet at AX5, a Bold Text pass, Reduce Transparency, Increase Contrast and Reduce Motion for the hand-off and Review's strip. Design leads own the visuals; I only fix behaviour and labels. Route A's sheet is Apple's, so we cannot guarantee its accessibility beyond what the system gives.
- Content rules: no em or en dashes, curly quotes, ellipsis characters or emoji; `{child}`; no internal words (take, entry, draft, pack) in parent strings. "Moments" is a working name; the word for the tab is for `content`.

## 15. Open questions (recommended default and deadline)

Deadlines are PROPOSED and I have not read the Build 13 freeze date.

| Id | Question | Recommended default | Who | By |
|---|---|---|---|---|
| OQ-P4-1 | Tab position, the Home pointer and where a nudge tap lands | Home default, Moments second; one neutral Home pointer; nudge opens Moments. Test with five parents (J5) and a device pass (J11) before it ships | Founder | Mon 24 Nov 2026 |
| OQ-P4-2 | Is showing the pictures in time order, when the source gives no pick order, an "auto-order" under NS-52-R29? | No: it is the order the parent saw. They can change it | Founder, `design-systems` | 28 Nov 2026 |
| OQ-P4-3 | May Review offer the pictures' date as an optional chip? | Yes, a tap, never preselected | Founder, `privacy` | 28 Nov 2026 |
| OQ-P4-4 | A moment tap while a letter waits: add or start new? Is Add to a waiting draft allowed today? | One question, default "Add" | `mobile`, `product` | 28 Nov 2026 |
| OQ-P4-5 | Shared book under Variant A: the other parent sees words only. Is that acceptable? Does the second parent need any sign that pictures exist? | Words only, plus the line in R32 for the author. No sign on the other phone (a sign would be a count of what they cannot see). Variant B is the real fix, with its cost | Founder | 1 Dec 2026 |
| OQ-P4-6 | How do we judge that Moments brings parents back without streaks, counts or analytics on media? | Letters kept per week per book, from opt-in analytics only, and five-parent reads | Founder, `data` | with OQ-P4-1 |
| OQ-P4-7 | Email: its budget, consent, quiet hours and whether typed days sync to the server | I propose no number. Email uses only date of birth, typed days if synced, letters made | `marketing`, `privacy` | 1 Dec 2026 |
| OQ-P4-8 | NS-49-R9 against the brief: Apple's title is never stored or shown by us | Reword NS-49-R9 to match, or exclude Route A's title everywhere | Founder | 24 Nov 2026 |
| OQ-P4-9 | NS-01-R11 against NS-52-R28 on "Picture 2 of 4" | R11 is the lens, R28 is inside one letter | Reviewer | 28 Nov 2026 |

## 16. Dependencies

- P1 to P3 and P5 (assumed, not read): the tab's states, the sheet's layout and the permission copy. The hand-off here starts after the parent taps an item. Reconcile at the integrator.
- Feasibility doc: whether Route A's picker can be opened from a tab and what it returns (I10 shows it is a SwiftUI view with its own label button, so we cannot start it from our own control); whether tap order is reported; PHPicker per-type limits.
- Privacy and constitution doc: confirm R14, R17, R37 and the Data Not Collected reading.
- Design concept: the media strip, the moment sheet and the letter page layout (content stays paper; no glass on the pictures).
- NS-35 start list (`start-capture.logic.ts`), NS-32 registry, NS-52 migration 12 (`entry_media`: `kind` gains video, `duration_ms`, `position`), BL-1305 reword, BL-046 and BL-1018 rows. I touched none of them and added no backlog row; the product agent will, once the founder signs.
- Market benchmark B1 (`wip/moments-b1`): not on the remote when I looked. I used none of it. Reconcile 4.1 and 4.2 against it when it lands.

## 17. What is verified, unverified, and a guess

VERIFIED (read this session):
- Everything cited by id from I1 to I8 is read in the clone, including the NS-52 rows (R1 to R44), NS-01 rows named above, NS-35-R1 to R5 and NS-32-R1 to R16.
- https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker.md: it is available from iOS 17.2; it is a SwiftUI view built with a label; the first time it appears a modal sheet introduces the concept; after a person selects a suggestion, the system shares only the information associated with that suggestion with the app. That page does not say what a suggestion contains (title, photos, videos, place) or whether library permission is needed.

UNVERIFIED:
- Route A: what a suggestion returns, whether the parent can deselect items, whether videos come across, the sheet's accessibility (the PHPicker `selectionLimit` page did not load, so I did not verify per-type limits or ordered selection).
- Whether the picker reports iCloud-only videos, tap order, or a video's duration before copy.
- The metadata-stripping API for video (NS-52-R5 itself says UNVERIFIED).
- Whether typed days sync to the server; the email budget; ML-3 and ML-6 wording (I used the brief's summary); the Build 13 freeze date.
- The Limits are Q-PM-2's ASSUMED numbers, not read from any source.

GUESS:
- That Home default with Moments second is the better position (4.1). No parent has seen it and B1 is not read.
- That a pointer on Home earns its cost.
- That most days have something real to show. It depends on how many pictures the parent takes.

## 18. What I did not do

No code, no tests run, no PR, no change to any other file, no backlog row, no `DECISIONS.md` entry. I did not view the founder's screenshots. I did not read B1, the feasibility doc, the privacy doc or the design concept because none existed on the remote.
