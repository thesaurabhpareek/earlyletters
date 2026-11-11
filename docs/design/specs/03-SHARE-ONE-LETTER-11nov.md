# 3. Share one letter, and the test for whether a Share tab is ever justified

Status: DRAFT, 11 Nov 2026 (UTC). Docs only. Author: `design-systems`. Index, tags and the 12-line review: `NEW-SCOPE-INDEX-11nov.md`. Gap G-3 in NAV-TAB-ROLES (share one letter with one person; "S to M, no server, uses the share sheet `expo-sharing` already in the build per the gap file", UNVERIFIED: I did not re-read the gap file). NX-42 section 3 recorded G-3 as undecided; that is superseded. The founder decided on 10 Nov to include all new scope, so share one letter is built, text first (relayed by Karma; original not read, UNVERIFIED). The recording is gated off Level 1 (section 3.3).

## 1. Job

One sentence: I send one letter to someone I choose. (9 words. The verb "send" is PROPOSED: the PRD uses "Give" (README, NS-05 section 10). Which verb is a `content` decision, with `legal`; I do not decide it. Review B finding 14. The earlier wording "to one person" is withdrawn: the iPhone's own share sheet can send to several people, and the app cannot limit it, so the sentence promises only that the parent chooses.) Class OUTPUT, but placed as an object action on the letter (NAV-TAB-ROLES P4 and P9), so no tab needs the verb "send".

It is not backup, not co-parent writing together, not publishing, not a link to a page. The letter leaves the app only as a file or text the parent hands to the iPhone's own share sheet.

## 2. Where it lives

| Place | Control | Notes |
|---|---|---|
| Letter page (Book) | "Share this letter" (PROPOSED label) in the letter page's own action group; Share is not an "add", so it sits in a separate row from the add actions (order and group names: `06-HOME-BOOK-ME-IA-11nov.md` section 4a) | The one primary home. Opens the preview sheet (section 3) |
| Letter card menu in the Book | The key `book.entryMenu.shareButton` = "Share" exists in `strings.en.ts` (EVIDENCE), but a search of `apps/mobile/src` on `da83fb1e` finds no use of it: the letter page menu uses the keys for private, date and delete only. So it does nothing today; the Share action is new (UNVERIFIED beyond that grep; listed in section 12) | Same sheet. A doorway |
| Home | None | Home lists no kept letters and sends nothing |
| Me | None. A parent who looks for what has left the app finds nothing to list, because the app keeps no log of shares (section 6) | |

## 3. The flow: choose what goes, see it, hand it to the iPhone

### 3.1 Screen SH-1: "What goes" (a medium `Sheet`, grabber)

Changed after Review B finding 3 and PRD NS-05-R2 (EVIDENCE, read at head `2245c8be`): "A Continue and a Not now control have the same size, weight and type at AX5." The earlier design (one primary button and a Close at top left) is withdrawn. The words row is a static row, not a switch.

```
 Share this letter                                    <- title2, heading 1
 SAT 14 OCT  From {signsAs}

 The words always go.             <- static row, no switch (slot)
 (no recording row at Level 1; see section 3.3)
 The photo            [ off ]     <- Toggle row, only if the letter has a photo

 (preview, scrollable, words whole)
 +--------------------------------------+
 | SAT 14 OCT                           |
 | "We went to the park and {child} laughed" |
 | From {signsAs}                       |
 +--------------------------------------+
 This leaves the app when you send it.   <- Shown line (slot); says nothing about the recipient's copy

 [ Continue ]        [ Not now ]      <- two buttons, same size, weight and type, 56 pt
```

- Continue and Not now are equal. Both use `Button` at the same variant (`secondary lg`, 56 pt, same type); neither is the filled primary. At AX5 they stack in one column, Continue first, Not now second, each full width and the same height. Not now closes the sheet and changes nothing. There is no separate Close (the Sheet is opened with `hideClose`); the sheet's escape gesture (two-finger scrub) and the swipe down also close it. The labels "Continue" and "Not now" are the PRD's words; `content` owns them (PROPOSED).
- The founder's one-primary-action rule and PRD R2 point opposite ways here. R2 wins for this sheet, because this is the one place where something leaves the phone, and a decision that is easy to agree to and harder to decline would be a nudge. This is recorded as a deliberate exception in J6 below, not a pass of the one-primary rule. If the founder prefers one primary button, `product` changes R2 in #795 first.
- Level 1 (the build to design for): the words, and the letter's photo (Build 13 has one photo per letter, see spec 1). Defaults: the words go; the photo is off. A parent turns on only what they mean to send. The reason: a picture can carry more than the person thought (a child's face), and the default must be the least that leaves. There is no recording row and no recording path at Level 1 (section 3.3).
- The preview shows exactly what will be sent for the words: the date line, the letter as kept (the version the parent kept, "With small fixes" or "Exactly as said", whichever the book shows), the signature line. Never the other view, never `raw_transcript` unless that is what the Book shows.
- The preview is a rendering of the same text, not a rewrite. No intro line, no title, no app name or link, no "sent from", no watermark (Q2). The machine adds nothing (constitution).
- "The words always go." is a static row: plain text with a check shape, no switch, no dimmed control. Review B finding 3: a disabled switch is read by VoiceOver and Switch Control as "dimmed", and invites taps that do nothing. PRD R4 only needs the words always sent ("their toggle is on and disabled" in R4 is the PRD's wording; this spec changes it to a static row, and `product` should update R4 to match). The row also tells a parent who wants only the picture why they cannot: the letter is its words.
- App switcher: the sheet and preview are blank in the app switcher snapshot (PRD NS-05-R14); see SH-R13.

### 3.2 Step SH-2: the iPhone share sheet

"Continue" opens the system share sheet via `expo-sharing` (already in the build, EVIDENCE: `lib/export/device.ts` imports it) with:

| Chosen | What is handed over |
|---|---|
| The words | Plain text: date line, body, signature line |
| The recording | Not at Level 1. Gated (section 3.3) |
| The photos | The kept copies, location stripped (ML gap 4 default) |

The app never chooses a recipient and has no contacts permission. After the system sheet closes, SH-1 closes without a message. If the parent cancels the system sheet, SH-1 stays open (they may change what goes), with Continue and Not now still equal.

`expo-sharing` hands over a single file URI; sharing text plus a photo together, as one share, may need a different API (`Share` from React Native for text, or the expo-sharing multi-file option, if any). UNVERIFIED; `mobile` spikes it. Fallback in the design: send the words as text and offer "Send the photo" as a separate row that each open the share sheet, so the sheet never promises a single bundle it cannot make.

### 3.3 Levels: what is gated

| Level | What can leave | Status |
|---|---|---|
| 1 | The words as kept, plus the letter's one photo (off by default) | The design target now |
| 2, GATED | The recording (the parent's voice as an audio file) | Not designed to ship. Blocked until a `security-architect` read and a counsel read are on record. No row, no button, no code path, no copy slot is built at Level 1. Kept here only so the later work has a place to start |

The gate is a rule for `mobile` as well as for design: no recording row exists in the Level 1 sheet, even hidden behind a flag, and the share sheet is handed no audio URI. Nothing is added to the shared text: no footer, no app or brand name, no link, no "sent from", no watermark (Q2). The public name lives only in `packages/brand`; the shared text does not read it.

### 3.4 Components and tokens

| Part | Component | Tokens |
|---|---|---|
| Sheet | `Sheet` (medium, then large at AX5) | `radius.xl`, `surfaceRaised`, `line` |
| Photo row | `Toggle` in `ListRow` (the words row is plain text, not a Toggle) | `target.min`, `controlBorder` |
| Preview | `SharePreview` (NEW; `Card` with `letterBody`, `letterDateline`, `signature`) | `surface`, `radius.md`, 1 pt `line` |
| Continue and Not now | two `Button secondary lg`, same size | `target.primary` (56 pt) |
| Truth line | `AppNote` | `textMuted` on `surface` 5.11 : 1 light (EVIDENCE: tokens.ts comment) |

No new token.

## 4. States

| State | Behaviour |
|---|---|
| Default | As drawn |
| Letter has no photo | That row is absent, not greyed |
| Recording waiting for its words (no words yet) | Share is not offered: the control is absent and the sheet cannot be reached. The unit is a letter, not a file |
| A letter that is Private | Allowed for the parent's own letter; the sheet states Private in the Shown line: the letter was private to the parent; sending it is their choice (Q5) |
| Another parent's letter | Not offered: you send your own words only (Q6) |
| Sealed letter (spec 4) | Not offered until it is open |
| Quiet-day mark | Not offered (no words) |
| Offline | Works; the share sheet itself needs no network from us |
| Error: file could not be made | `ErrorLine` plus "Try again" (slot); the letter is untouched; a failed share never changes the letter |
| App locked | The sheet sits behind the lock |
| Long letter | Preview scrolls; the words are whole. Plain text has no length limit; an image card would (not in this scope, Q4) |
| Photo missing on this phone | That row is absent; the letter's missing-file box stays as the page has it |

## 5. Motion

| Moment | Motion | Reduce Motion |
|---|---|---|
| Sheet opens | native sheet | `fadeMs` |
| Toggle | system switch | same |
| Preview updates when a row is toggled | `swapMs` cross-fade | none |

Haptic: `tap` on Continue only. No sound.

## 6. Dynamic Type and VoiceOver

- AX5: the sheet goes to full height; rows stack label over switch; the preview shows the whole text in one column; Continue and Not now stack, equal width and height, inline after it, not pinned.
- VoiceOver: focus lands on the title. Order: title, words row (read as plain text: "The words always go"), photo row ("The photo, off", state spoken by the system), preview ("Preview of what will be sent. {date}. {words}"), Shown line, Continue, Not now. Continue and Not now carry the same kind of hint, so neither is described as the expected choice. Voice Control works by label.
- The preview is one element that reads the whole text, so a long letter is not skipped.

## 7. Copy slots (for `content`)

Existing (EVIDENCE): `book.entryMenu.shareButton` = "Share".

| Slot | Intent | Limits and rules |
|---|---|---|
| `share.letter.action` | Object action on the letter page | Starts with a verb; "this letter"; the verb is a content decision (Share, Send or Give) |
| `share.letter.title` | Sheet title | Heading 1 |
| `share.letter.words`, `.photo` | Row labels | Item count only for the parent's own selection |
| `share.letter.wordsAlways` | The static words row (PROPOSED: "The words always go.") | One sentence; plain text, no switch |
| `share.letter.previewA11y` | Preview label | |
| `share.letter.shown` | The truth line: this leaves the app | Must say it leaves; must not say "safe", "private" or "secure" about where it goes; counsel read |
| `share.letter.continue`, `share.letter.notNow` | The two equal buttons (PROPOSED: "Continue", "Not now", the PRD's words) | Same length class; neither louder |
| `share.letter.action` verb | The letter-page action. The wireframe no longer carries a long label. PROPOSED candidates: "Share this letter" or "Send this letter" (PRD says Give). The earlier 24-versus-22 character clash ("Choose who to send it to") is gone because that button is now "Continue"; the limit now applies to the letter-page action label, 22 characters or fewer | `content` and `legal` decide; I do not |
| `share.letter.failed` and `.retry` | Error | Says what to do |

Words: the glossary bans "sharing" as the word for backup and VOICE.md lists "Per-book sharing" as a phrasing to avoid (second-hand through NAV-TAB-ROLES 6.3; UNVERIFIED, BRAND.md and VOICE.md not re-read). Sharing one letter is a different act from per-book sharing; whether "Share" is allowed as a button word is for `content` and `legal` (COUNSEL-READ). Not "send to family" (grandparent words are v1.1).

Door lines (this is a thing a person agrees to; COORDINATION section 10, PRIV-R21):
- Shown: `share.letter.shown` and the preview, on the sheet, before the iPhone sheet opens.
- Records: nothing. No share log, no event, no count (NAV-R12). The app cannot know who received it, and keeps no list of shares. (If the founder wants a "Letters you shared" list, that is a new record and a new review; default no.)
- Never: any content, recipient or app chosen in analytics, logs or crash reports; no recipient in a URL; no link to a server copy (there is none); no contacts access.
- Decline: Not now (as easy to reach and as large as Continue), or cancel the iPhone sheet; nothing is kept either way; export and deletion work as before.

## 8. The test for whether a Share tab is ever justified

A tab is a promise of a place to go. Share earns one only if every row passes. Rows 1 to 6 are checked by `design-systems` and `product`; 7 and 8 by `legal` and the founder. The values are PROPOSED; I found no evidence for any number.

| # | Test | Pass when |
|---|---|---|
| T1 | A verb of its own | Its one verb (PROPOSED "Send"; the PRD says "Give"; `content` decides, and this test uses whichever is chosen) appears in no other tab's job sentence (06 section 1) and in no other tab's first screen |
| T2 | Its own material | There is a kind of thing only Share holds: a list of what has left the app and to whom (the app must be able to know that), or a book-level output with its own screen (for example a printed book order). Today the app knows neither |
| T3 | Three real outputs | At least three distinct output actions are shipped and working (not "Coming soon"), each used on its own: for example share one letter, share a page, the book as a PDF. Today: one candidate (this spec) plus Export, which already sits in Me |
| T4 | Day one is whole | On a day-one book the tab shows at least two things a parent can do, neither a settings page nor a promise |
| T5 | Not a section | The rows cannot sit as one section of Me and one action on the letter without losing anything a parent needs |
| T6 | Not a second capture | None of its actions makes or edits a letter |
| T7 | Words and promise | `legal` has read the label and what it implies about privacy ("private by default; only you, and your co-parent if you invite them") and passes it; the glossary has the word |
| T8 | A parent says it | In a five-parent read-through (HYPOTHESIS: no parent evidence exists) at least four, shown the bar without labels explained, name the tab's job in a verb that is not "settings" |

Today's result: T1 fail (nothing needs the verb on a tab), T2 fail, T3 fail, T4 fail, T5 fail (Me and the letter page hold everything), T6 pass, T7 open, T8 not run. Verdict: a Share tab is not justified. This is the founder's three-tab bar. The test is re-run only when a new output ships, and only by changing a row's evidence, never by relaxing a row.

What would flip it (informational): a printed book (BRAND.md says "Not promised in v1.0"), shared voice from close family (v1.1), several output types a parent returns to. Even then, "co-parent writing together" belongs to Me as a caption or to Home as a letter by two people, never to a tab named Family.

## 9. Requirements (working ids SH-R#)

| Id | Requirement | Proof |
|---|---|---|
| SH-R1 | One letter, chosen by the parent. Given a letter page, When the parent chooses Share, Then only that letter is offered and nothing leaves until they tap Continue and pick a recipient in the iPhone sheet | device |
| SH-R2 | Least by default. Given the sheet, Then the words go (a static row) and the photo is off, and no recording row or recording path exists at Level 1 | unit test on defaults |
| SH-R10 | Recording gate. Given Level 1, Then no recording row, audio URI or recording copy slot exists in the sheet or the code, and the shared text has no footer, brand name or link | code review by `security-architect`; unit test on the share payload |
| SH-R3 | Faithful. Given the preview, Then its words equal the words the Book shows for that letter, with no added line, title, name or link | unit test comparing strings |
| SH-R4 | No log. Given any share, Then no row, event or count is written | code review; analytics catalog |
| SH-R5 | Own letters only; open letters only. Given another parent's letter, a sealed letter, a quiet-day mark or a letter with no words, Then Share is absent | unit tests |
| SH-R6 | Not on Home. Given Home, Then there is no share control | navigation test N9; device |
| SH-R7 | Accessibility. Section 6 holds in both themes with Reduce Motion and Reduce Transparency; the preview is read whole | device |
| SH-R8 | Truth. Given the Shown line, Then no word says safe, secure or private about the recipient's copy | `legal`, content rules test |
| SH-R9 | Locale and script. Given a Devanagari letter, Then the text reaches the share sheet unchanged (no font-dependent image in this scope) | device |
| SH-R11 | File names hold no personal data (PRD NS-05-R6, head `2245c8be`). Given any file handed to the share sheet, Then neither its name nor its metadata holds the child's name, an email, a device name or an app account id; a picture's file name is the letter's date and nothing else | unit test on the payload builder |
| SH-R12 | No temporary file survives (PRD NS-05-R10). Given the share sheet is dismissed, a send fails, or the app is killed, Then any temporary file the app made is deleted at the next launch at the latest | unit test; device |

| SH-R13 | Blank in the switcher (PRD NS-05-R14). Given App lock on, When the app goes to the app switcher with the sheet open, Then the snapshot shows no preview text or photo; and the Share button is reachable only once the app is open past App lock | PRD test `[NS-05-R14]`; device |
| SH-R14 | Equal choice (PRD NS-05-R2). Given the sheet at every Dynamic Type size including AX5, Then Continue and Not now have the same size, weight and type, and neither is the filled primary | PRD test `[NS-05-R2]`; layout test reading both buttons' props; device at AX5 |
| SH-R15 | The words row is not a control. Given VoiceOver and Switch Control, Then "The words always go" is static text with no switch role and is not announced as dimmed | device |

## 10. The 12-line job-clarity review

| # | Result | Reason |
|---|---|---|
| J1 | Pass | "I send one letter to someone I choose." (verb PROPOSED) |
| J2 | Pass | "Send" is an action on a letter inside Read; no tab carries it |
| J3 | Pass | Starts nothing; absent on letters without words |
| J4 | Pass | One letter |
| J5 | Pass | Sheet title names the act |
| J6 | Pass, one deliberate exception | PRD NS-05-R2 asks for two equal controls, Continue and Not now. This is the one sheet where something leaves the phone, so declining is as easy as agreeing. The photo toggle is secondary. Not a pass of the one-primary rule; recorded for the founder |
| J7 | Pass | Home and Me do not repeat it |
| J8 | Pass | No tab to fill; no empty state |
| J9 | Pass | Section 4 |
| J10 | Open | Slots; the word "Share" needs `legal` and `content` |
| J11 | Open | Device pass |
| J12 | Open | If removed, a parent screenshots the letter, which sends it with no preview and no control over what goes. Another place already does it badly; the spec's value is the preview and defaults. The founder decided to build it (Q1), so J12 passes on the preview and defaults alone |

## 11. Open design questions, each with a default

| # | Question | Default |
|---|---|---|
| Q1 | Build share-one-letter (G-3)? | DECIDED by the founder, not an agent default: on 10 Nov he said to include all new scope, so build it, text first (relayed by Karma on 11 Nov; I did not read the original message, UNVERIFIED). Open only: the Q2 to Q7 defaults below |
| Q2 | Add a line "from Early Letters" to the shared text? | No. It would be the app speaking in the parent's letter |
| Q3 | May a parent send the recording, with or without the words? | Not at Level 1. A later, gated level, only after `security-architect` and counsel reads are on record (section 3.3). Never without the words: the unit is a letter |
| Q4 | Image card of the letter (a rendered page) as a format | Not now. A long letter cannot be a single image without cutting words, and a font-dependent image breaks for some scripts |
| Q5 | May a Private letter be shared? | Yes, the parent's own, with the Shown line saying so |
| Q6 | May a co-parent's letter be shared by the other parent? | No, own words only; `legal` to confirm |
| Q7 | Where are export and "where your letters live"? | Me, one section (06 section 5). They are care of the book, not a tab |

## 12. UNVERIFIED

The gap file for G-3 (not re-read); `expo-sharing` multi-item behaviour in SDK 57; that `book.entryMenu.shareButton` is unused (one grep); audio format and size on this phone; whether the share sheet shows an app-name preview line outside our control; whether a text share keeps Devanagari and emoji-free text intact in every target app; every statement about parents.
