# 7. Co-parent coming soon: one quiet caption in Me, one clear sheet, one on-device reminder

Status: DRAFT, 11 Nov 2026 (UTC). Docs only. Author: `design-systems`. Index, tags and the 12-line review: `NEW-SCOPE-INDEX-11nov.md`. Nothing here is built; no token, string or screen changes in this PR. No word below is live until `content` writes it, the founder approves it and `mobile` wires it in the same PR that moves it. Working ids (CS-R#, CS-Q#) are labels, not assigned BL or D ids.

Tags as in the index: EVIDENCE (read this session at this branch), UNVERIFIED, PROPOSED, HYPOTHESIS.

Decision this spec carries out. Founder, chat, 11 Nov 2026 (relayed by Karma; original not read), amending closed question N1: "Make that coming soon sheet beautiful and clear and have a remind me when it launches or something." The earlier rule stands in spirit: a prominent coming-soon is overkill, so the entry in Me stays ONE small quiet caption line (no row, no chevron, no badge). What changes: that line is now tappable and opens one polished sheet. This supersedes the line "static text: not tappable, no row, no sheet, no chevron" that I wrote in `06-HOME-BOOK-ME-IA-11nov.md` 5.1, 8 and IA-R8 earlier on 11 Nov, on the founder's later instruction. Karma's rulings (a) to (c) are the brief.

Closed-question note. N1 in `infra/closed-questions-2026-11-11.md` (Project doc; I have not re-read it, the wording here is relayed): the co-parent coming-soon is one small caption in Me. **N1 amended by the founder on 11 Nov 2026 to allow a tappable caption opening one sheet.** The "static text, not tappable" line in spec 06 is superseded. Everything else in N1 stands: one line, no row, no chevron, no prominence.

## 1. Job

One sentence: I learn what co-parent sharing will be, and ask to be told when it is ready. (16 words; the verbs are "learn" and "ask". It adds no tab verb: it lives inside Me's job, Look after, as a note about my account and books.)

The sheet has two jobs only, as ruled: explain, and let the parent say "tell me when it is ready". It is not a sign-up, not a waitlist, not a survey and not a sales page. Plus is not mentioned on it.

## 2. Evidence read, and what already exists

| Fact | Source | Tag |
|---|---|---|
| The sheet exists today as `CoParentSoon` (`presentation: 'sheet'` for invite entry points), with a drawing (`LineArt name="together"`), a serif title, one line, Close, and a `track('coparent_soon_opened')` call | `apps/mobile/src/components/family/coparent-soon.tsx` at this branch | EVIDENCE. That `track` call is the event the founder's brief says was removed in #720: this branch's file still has it, so #720 is not in this branch's base. The #720 diff was not read |
| Existing words: `familyCopy.soon.title` "For now, this book is yours."; `.lead` "In a later update, {child}'s other parent can add letters too, from their own phone."; `.notify.button` "Tell me when it's here"; `.notify.hint` "Saves a note on this phone. Nothing is sent."; `.notify.done` "Noted on this phone. When the update arrives, you will see it here."; `.quiet.body`; `.childFallback`; `.close`; `.settingsRow`; `.settingsRowHelp` "Sharing a book with a co-parent is coming in a later update." | `packages/content/src/features/family.en.ts` lines 170 to 190 | EVIDENCE |
| A local flag already exists: key `family.coParentNotify`, value a day `YYYY-MM-DD`, set once, idempotent, written through the settings store; pure functions `requestCoParentNotify`, `coParentNotifyRequestedOn`, `hasRequestedCoParentNotify`. There is no function that clears it | `apps/mobile/src/lib/family/coming-soon.logic.ts`; `apps/mobile/test/coparent-soon.test.ts` imports it | EVIDENCE |
| The button was taken off on 31 Oct (SET-08) because its confirmation promised a note "here" and no build kept the promise; the code comment says the button returns "with that card" | `coparent-soon.tsx` header comment | EVIDENCE |
| Erase everything removes "every row of every table, settings included" | doc comment of `apps/mobile/src/lib/erase-everything.ts` step 2 | EVIDENCE (comment; the code under it not read) |
| The sync outbox enqueues named ops only (`book.update`, `prefs.upsert`, ...); the grep found no op that writes a `family.*` settings key | `apps/mobile/src/lib/sync/outbox.ts` (grep only) | UNVERIFIED: a grep, not a trace of every path. `data-architect` or `mobile` confirms before this ships |
| The sheet component: `Sheet` with `open`, `onClose`, `title`, `description`, `footer`, `hideClose`; title takes focus; modal for VoiceOver; visible Close; Reduce Motion fades it over `fadeMs` and nothing slides | `docs/design/COMPONENTS.md` rows 22 and 2.12; `MOTION.md` 5i | EVIDENCE for the doc; behaviour on device UNVERIFIED |
| Targets: `min` 44, `primary` 56 | `packages/design-tokens/src/tokens.ts` line 382 | EVIDENCE |

Found in this pass: the existing sheet draws `LineArt name="together"`. I did not open that asset, so I cannot say it shows no child. The brief bans an illustration of a child. This spec therefore drops the drawing from the sheet (section 4). If `creative` wants a drawing back, it must be shown to pass the rule first.

## 3. The entry: one tappable caption in Me

Placement is unchanged from 06 5.1: standing alone between "Your letters" and "Take the book with you", below the first-screen fold, no section title, no row, no chevron, no badge, no number, no date.

What changes (PROPOSED):
- It is tappable. The whole line is one pressable. Tapping opens the sheet (section 4). Nothing else on Me is changed by it.
- It shows it can be tapped by shape, not colour: the caption text is underlined (1 pt, same muted colour). Colour is never the only signal.
- The pressable is at least 44 pt tall (`target.min`) and as wide as the text column, by padding around the line; the visible text stays one small caption. The hit area does not touch the neighbouring row's hit area (8 pt gap minimum, `space` token to be named by `mobile` from `tokens.ts`).
- Text is the `caption` type (13 pt floor, `tokens.ts` line 229), `textMuted`. It wraps to as many lines as needed at any Dynamic Type size and is never truncated.
- Press feedback: the standard `press` scale (`tokens.motion.press`); no haptic (COMPONENTS 0.2: haptics only for outcomes).
- It does not change when the reminder is set. The sheet shows the state; the caption stays the same so Me's layout never jumps.
- Where co-parent is live (alpha, servers on), the real people rows replace it in the same place (unchanged from 06).

## 4. The sheet

### 4.1 What it is made of (library first)

The existing `Sheet` (gorhom bottom sheet, `auto` detent, content scrolls inside it), `Text`, `Button`, and the existing `AppNote`/`Card` for the confirmed state. No new component, no new token. (`CoParentSoon` is re-based onto these; its drawing, `Breathe` and `track` call are removed.)

### 4.2 Wireframe (first view; fictional Asha)

```
  ------------------------------------------   <- grabber (iOS)
                                     [ Close ]   <- Sheet header, 44 pt
  
  For now, this book is yours.                   <- heading level 1, serif title1
  
  In a later update, Asha's other parent can     <- body, text
  add letters too, from their own phone.
  
  Each of you adds your own letters, and each    <- body, textMuted
  letter says who it is from.
  
  +--------------------------------------------+
  |        Tell me when it is ready            |  <- Button primary, 56 pt, full width
  +--------------------------------------------+
   Saves a note on this phone. Nothing is sent.   <- caption, textMuted, under the button
```

Layout rules (PROPOSED): horizontal padding and vertical rhythm from the `space` tokens; the heading, then two body lines 12 pt apart, then 24 pt, then the button, then the hint 8 pt below. Surface `surfaceRaised`. No illustration, no photograph, no lamp inside the sheet, no card inside the sheet in the first view. The calm comes from type, space and one button. The room behind keeps its light and pauses its breath (MOTION 5i, EVIDENCE).

### 4.3 States

| State | When | What shows | Differences |
|---|---|---|---|
| S1 First view | Flag not set, co-parent not live | Wireframe above | Button `Tell me when it is ready` is the one primary action |
| S2 Reminder set | Flag is set (just now, or on a later open) | Same heading and body. The button and hint are replaced by one confirmation block on `accentSoft` (rounded `radius`, solid, no blur): a check shape beside the words "Noted on this phone." and the line "When co-parent sharing is ready, you will see one note in Me." Under it one quiet text button `Turn this off` (44 pt) | The check is a shape, not colour alone. The button is gone, so there is still one primary action: Close. Turning off returns to S1 and clears the flag |
| S3 Reminder set, feature shipped | Not this sheet. The build has co-parent sharing and the flag was set | The caption is gone; the real people rows are in its place (alpha behaviour). One quiet note appears at the top of Me (4.5) and the flag clears when the note is dismissed or acted on | See 4.5 |
| S4 Offline | No network, airplane mode | Identical to S1 or S2. Nothing on this sheet touches the network, so there is no offline variant, no error and no "try again" | Proof: CS-R9 |
| S5 Quiet remote variant | `flags.familyTeaser = 'quiet'` | The body is `familyCopy.soon.quiet.body` instead of the two body lines; the button and hint stay | Existing behaviour kept; it cannot turn sharing on (EVIDENCE, `coparent-soon.tsx` header). Whether anything sets `quiet` today: UNVERIFIED |
| S6 No child name yet | No book exists | `{child}` falls back to "your child" (`familyCopy.soon.childFallback`, EVIDENCE) | Never gendered |

### 4.4 Dynamic Type to AX5

- The sheet opens at the `auto` detent and, when the text no longer fits, the detent grows to full height and the content scrolls inside it. Nothing is cut; there is no `numberOfLines` on any line.
- The Close control stays pinned in the header and visible while the content scrolls (Sheet header, EVIDENCE in COMPONENTS 2.1a).
- The primary button is pinned in the sheet footer (`StickyFooter`, COMPONENTS 2.12) so it is reachable without scrolling at AX5, above the home indicator and safe area. Its label wraps to as many lines as it needs and the button grows taller than 56 pt; it never shrinks the text.
- At AX3 and above the hint under the button moves above the scrolling content's end, not under the footer, so it is never hidden behind the footer (PROPOSED; to be checked on a device).
- In S2 the check and the words stack (check above words) at AX3 and above.
- Landscape: the sheet is full height and scrolls (UNVERIFIED on device).

### 4.5 The note when co-parent sharing ships (S3)

Rule (PROPOSED, ruling (b)): when a build that really has co-parent sharing runs and `family.coParentNotify` is set, Me shows ONE quiet note, once, and the flag clears.
- Where: the first element under the Me heading (it is news, so it is above the fold, unlike the caption). It is an `AppNote` (COMPONENTS 2.5b), not a banner, not a toast, no badge on the Me tab, no sound, no haptic, no notification, no color other than the note's own surface.
- What it says: that co-parent sharing is ready, and how to start (one `Button` quiet `sm` that goes to the real invite entry), plus `Close` text button. No date, no "finally", no number.
- When the flag clears: when the person dismisses the note or taps through to the invite entry. It does not clear on mere display, because Me can be opened with the note off screen. It never appears a second time (the flag is gone).
- A person who never set the flag sees no note; they see the real rows.
- The note shows once per phone, not once per book. A phone with several books shows one note.
- Not promised: that the note appears on a particular day. It appears the first time Me opens in a build that has the feature.

### 4.6 Motion and Reduce Motion

- Motion is the `Sheet`'s only: it rises on the `standard` spring (EVIDENCE, MOTION 5i). Sheet content adds no entrance (MOTION 5i). Nothing breathes; the old `Breathe` and draw-on are removed.
- Tapping the button to move from S1 to S2: the button and hint cross-fade to the confirmation block over `fadeMs` (200 ms). No scale, no confetti, no haptic celebration (no streaks, points or badges, ever). The one haptic allowed is the single `success` outcome haptic from COMPONENTS 0.2 for a saved setting (PROPOSED; check that table lists it).
- Reduce Motion: the sheet and its scrim fade over `fadeMs` and nothing slides (EVIDENCE, MOTION 5i); the S1 to S2 change is an instant swap with no fade. Reduce Transparency: the sheet is solid `surfaceRaised`; no blur anywhere. Increase Contrast: `tokens.highContrast` and the underline stays.

### 4.7 VoiceOver script (UNVERIFIED until `qa` runs it on a device)

Entry, on Me:
1. "Writing this book together is coming in a later update. Button. Opens a short note." (the caption's text, role button, hint). Not read as a heading.

On open, focus moves to the heading and the sheet is modal:
2. "For now, this book is yours. Heading."
3. "In a later update, Asha's other parent can add letters too, from their own phone."
4. "Each of you adds your own letters, and each letter says who it is from."
5. "Tell me when it is ready. Button." Then the hint is read: "Saves a note on this phone. Nothing is sent."
6. "Close. Button." Close is last in the reading order because the heading is the job; it also answers the two-finger scrub (escape), which closes the sheet (EVIDENCE for the gesture in COMPONENTS 2.12).

After activating the button (S2): announce once, politely: "Noted on this phone." Focus stays on the block, which reads "Noted on this phone. When co-parent sharing is ready, you will see one note in Me. Turn this off. Button." If focus would be lost because the button was removed, focus moves to the confirmation block (PROPOSED).

After "Turn this off": announce "Turned off." and focus returns to the primary button.

On close: focus returns to the caption that opened the sheet.

Reading order is: heading, explanation, the one action, Close. No decorative element is read; there is none.

## 5. Requirements

| Id | Requirement | Observable pass/fail |
|---|---|---|
| CS-R1 | The entry stays one small quiet line. Given a signed-in or signed-out phone with co-parent not live, When Me is scrolled, Then exactly one text line stands between "Your letters" and "Take the book with you", with no chevron, badge, number, date or section title, and the caption type is 13 pt or larger | Device. Fail if any of these is present |
| CS-R2 | The line is tappable and tells you so without colour. Given the caption, When VoiceOver reads it, Then it is announced as a button with a hint, and the line is underlined | Device (Accessibility Inspector). Fail if it reads as plain text or the cue is colour only |
| CS-R3 | Targets. Given the caption and every control in the sheet, Then each hit area is at least 44 pt by 44 pt, the primary button is at least 56 pt tall (the brief asked for 48; `target.primary` is 56, which satisfies it), and Close is at least 44 pt | Device (Accessibility Inspector) or a layout unit test reading `tokens.target`. Fail if any is smaller |
| CS-R4 | One job. Given the sheet, Then it shows one primary action (S1) or none besides Close (S2). It contains no link to Plus, to a survey, to an email field or to a setting | Review by reading the screen; test that the sheet module renders one primary Button |
| CS-R5 | Remind me is on this phone only. Given a person taps "Tell me when it is ready", Then the app writes `family.coParentNotify` to the local settings store and does nothing else: no OS permission prompt, no network request, no analytics event, no email or contact captured, no server write | Test A: with the network blocked and a spy on the notification-permission API, tapping adds zero requests and zero permission calls. Test B: a source test fails if the sheet or `coming-soon.logic.ts` imports `track`, the notification module, the Supabase client or `fetch`. Fail on any |
| CS-R6 | The removed events stay removed. Given the source, Then no string beginning `coparent_soon_` appears in the app or in the analytics allowlist | Source test over `apps/mobile` and `packages/analytics`. Fail if one is found (on this branch's base the string still appears in `coparent-soon.tsx`; `mobile` removes it in the build PR) |
| CS-R7 | Turning it off works. Given S2, When "Turn this off" is tapped, Then the flag is cleared (`getSetting` returns null), the sheet returns to S1 and the VoiceOver announcement is "Turned off" | Unit test on a new `clearCoParentNotify` plus a device check. Fail if the value remains |
| CS-R8 | No promised date. Given every string on the sheet and in the note, Then none contains a digit, a month, a season, "soon", "next", "shortly", "by", "when it launches on" or "we will email" | Content test on the new keys (a pattern list). Fail on a match. Note: "when it is ready" is the founder's phrasing; see CS-Q3 |
| CS-R9 | Works offline. Given airplane mode, When the caption is tapped, then the button pressed, Then S2 shows with no error and no spinner | Device in airplane mode. Fail if any wait, banner or error shows |
| CS-R10 | The shipped note appears once and clears. Given a phone with the flag set, When it first opens Me in a build that has co-parent sharing, Then one `AppNote` shows at the top of Me; When it is dismissed or the invite entry is opened, Then `getSetting` returns null and the note never returns; Given a phone with no flag, Then no note shows | Unit test on the pure function (flag set + feature on shows once; flag clear shows never) and a device check. Fail on a second show or on a note without the flag |
| CS-R11 | No machine voice and no gendered child. Given the copy, Then it never implies that software writes anything, uses `{child}` or "your child", and contains no streak, gap count, fear, guilt or loss word | Existing `packages/content/test/rules.test.ts` on the new keys. Fail if it fails; the fix is the copy |
| CS-R12 | Dynamic Type. Given AX5, Then every word of the sheet is visible by scrolling, no line ends in an ellipsis, Close and the primary button stay reachable | Device at AX5, both themes. Fail on any truncated word |
| CS-R13 | Reduce Motion and Reduce Transparency. Given each on, Then the sheet fades with no travel, S1 to S2 is instant, no blur is drawn | Device. Fail if anything slides or blurs |
| CS-R14 | Both themes and contrast. Given light, dark and Increase Contrast, Then text is `text` or `textMuted` on `surfaceRaised` or `accentSoft`; the ratios in `tokens.ts` comments apply (`textMuted` 5.51:1 light and 8.01:1 dark on `bg`; `accentSoft` text 12.07:1 light, 11.20:1 dark). I computed no new ratio. `textMuted` on `surfaceRaised` and on `accentSoft` is not stated in the comments I read and must be measured before the build ships | Measurement by `design-systems` or `qa`. Fail below 4.5:1 for text |
| CS-R15 | Erase everything clears it. Given the flag is set, When Erase everything completes, Then `getSetting('family.coParentNotify')` is null and the caption shows S1 on the next open | Unit test on the erase path (settings rows are removed, step 2) plus one device run. Fail if the value survives |
| CS-R16 | Close and focus. Given the sheet, Then Close is visible at the top right in the sheet header, the two-finger scrub closes it, and focus returns to the caption | Device with VoiceOver. Fail if focus is lost |

## 6. Data flow: what is stored, where, and what leaves the phone

| What | Where | Leaves the phone? | Cleared by |
|---|---|---|---|
| `family.coParentNotify` = the day the person asked (`YYYY-MM-DD`, existing format) | The on-device settings store (the `settings` table of the local SQLite store). No other place | No. Nothing. No network call, no analytics event, no push token, no email, no contact, no server row | "Turn this off" (new `clearCoParentNotify`); the shipped note being dismissed or acted on; Erase everything (settings rows go, step 2 of `erase-everything.ts`) |
| Whether the sheet was opened | Not stored. The count event is removed (#720) and stays removed | No | n/a |
| Whether the note was shown | Not stored. The flag itself is the memory; once it clears, the note cannot return | No | n/a |

Caveats, stated honestly (UNVERIFIED unless marked):
- The iPhone's own device backup (iCloud or a computer) may include the app's local database, as it already includes recordings (`family.en.ts` comment at lines 170 to 172, EVIDENCE for the recordings remark). So the true line is "Nothing is sent from the app", not "stays on this phone only for ever". The hint "Saves a note on this phone. Nothing is sent." (existing, EVIDENCE) is true under that reading; `privacy` confirms.
- Whether the settings row can be swept into encrypted backup (BL backup, off in every build profile per `lib/README.md` line 80, EVIDENCE) or into any sync set: the outbox grep in section 2 found no path. Until traced, `mobile` adds a test that `family.coParentNotify` is in no sync or backup key list.
- The stored value is a day. The note does not need it. Keeping the existing format avoids a change to `coming-soon.logic.ts`; a bare `1` would store less (CS-Q4).

## 7. Door lines (PRIV-R21; `legal` and `privacy` review)

Shown: "Saves a note on this phone. Nothing is sent." (existing words, under the button), and in S2 "Noted on this phone."
Records: one setting on this phone, the day the parent asked. Nothing is counted; no event is sent.
Never: a date for the feature; a promise that a notification, email or message will arrive; asking for notification permission, an email or a phone number; any server write.
Decline: Close in one tap, or do nothing. Declining records nothing. Turning the reminder off removes the setting.

If the founder later wants a push or an email reminder, that is a different thing: it needs a permission prompt or a contact, so it needs `privacy` and counsel (consent, children's data and email law), new Shown, Records, Never and Decline lines, and a founder decision. It is not part of this spec, and nothing here is built to make it easy to switch on by accident (CS-R5 test B fails if it is tried).

## 8. Copy slots (for `content`)

All PROPOSED, built from words that already exist in BRAND.md (book, letter, co-parent, "{child}'s other parent", "your own letters", "From {signsAs}", "on this phone") or in `family.en.ts`. They are not final and not live: each needs `content` to write, the founder to approve, and `legal` to read CS-Q3. Keys are working names. A line marked (existing) is already in `strings.en.ts` or `family.en.ts`.

| Slot | PROPOSED string | Status |
|---|---|---|
| `me.coparentCaption` (the tappable line) | "Sharing a book with a co-parent is coming in a later update." | (existing) `familyCopy.soon.settingsRowHelp`. Reused as is; it now also needs the button hint below |
| `me.coparentCaptionHint` (VoiceOver hint) | "Opens a short note." | PROPOSED, new |
| `coparentSoon.title` | "For now, this book is yours." | (existing) `familyCopy.soon.title` |
| `coparentSoon.lead` | "In a later update, {child}'s other parent can add letters too, from their own phone." | (existing) `familyCopy.soon.lead` |
| `coparentSoon.how` | "Each of you adds your own letters, and each letter says who it is from." | PROPOSED, new. Product and legal confirm it describes F11 truly: that each parent's letters stay their own (PRINCIPLES 15, second-hand) and carry "From {signsAs}" (BRAND glossary, EVIDENCE) |
| `coparentSoon.quietBody` (variant S5) | "{child}'s book and every letter in it stay on this phone." | (existing) `familyCopy.soon.quiet.body` |
| `coparentSoon.remind` (primary button) | "Tell me when it is ready" | PROPOSED, new. Replaces `notify.button` "Tell me when it's here" so that it matches the founder's words and has no apostrophe |
| `coparentSoon.remindHint` (under the button) | "Saves a note on this phone. Nothing is sent." | (existing) `familyCopy.soon.notify.hint` |
| `coparentSoon.setTitle` (S2 first line) | "Noted on this phone." | PROPOSED, new |
| `coparentSoon.setBody` (S2 second line) | "When co-parent sharing is ready, you will see one note in Me." | PROPOSED, new. Replaces `notify.done`, whose "you will see it here" named a place (the old sheet) that the note no longer uses |
| `coparentSoon.off` (S2 quiet button) | "Turn this off" | PROPOSED, new |
| `coparentSoon.offDone` (announcement) | "Turned off." | PROPOSED, new |
| `coparentSoon.close` | "Close" | (existing) `familyCopy.soon.close` |
| `coparentReady.note` (S3, the note in Me) | "You can now write this book together. Invite {child}'s other parent from here." | PROPOSED, new. Check against the real flow's wording in `family.en.ts` before use |
| `coparentReady.action` (S3 button) | "Invite {child}'s other parent" | PROPOSED, new. Matches the glossary phrase |
| `coparentReady.dismiss` (S3) | "Close" | (existing word) |

Limits and rules for every slot: no digit, date or month; no "soon" except the existing `settingsRowHelp`, which says "a later update"; sentence case; no exclamation mark; `{child}` or "your child", never gendered; no word that implies software writes. Retired: `notify.button` "Tell me when it's here", `notify.done`, and the drawing. The word "co-parent" is the glossary's word for buttons and settings; "{child}'s other parent" is for prose.

Hand-off: `content` writes and tests the keys; the founder approves the PROPOSED rows; `legal` reads `coparentSoon.remind` and `setBody` (CS-Q3).

## 9. Components and tokens

No new token. No new component. Uses `Sheet`, `Text`, `Button`, `AppNote`, and the `accentSoft`, `surfaceRaised`, `text`, `textMuted`, `success` colors only if the check mark needs one (the check is drawn in `text`, so state is never colour alone), `target.min`, `target.primary`, `space`, `radius`, `tokens.motion` `fadeMs` and `press`. `COMPONENTS.md` needs, from `design-systems`, one line saying `CoParentSoon` is re-based onto `Sheet`, loses its drawing and `track` call, and gains `Turn this off` (step 4 of the sequence in section 11).

## 10. The 12-line job-clarity review

| # | Result | Reason |
|---|---|---|
| J1 | Pass | One sentence in section 1, one verb pair, within 16 words; the cap of 12 is exceeded by 4. Shortened form: "I ask to hear when co-parent sharing is ready." (10 words, one verb). Use that as the working sentence |
| J2 | Pass | It adds no tab verb |
| J3 | Pass | Starts no letter |
| J4 | Pass | One object: a note about a coming feature |
| J5 | Pass | The heading says the state of the book; the first line below says what is coming |
| J6 | Pass | One primary action |
| J7 | Pass | Points to nothing; the Me caption is the only door |
| J8 | Pass | Day one: a quiet line below the fold, no empty box |
| J9 | Pass | States say what next: S1 ask, S2 turn off, S3 invite |
| J10 | Open | Copy is PROPOSED |
| J11 | Open | Device pass: CS-R2, R3, R12 to R14, R16 |
| J12 | Pass | Remove the sheet and the parent has no way to say "tell me" and no explanation of the caption |

## 11. Hand-offs and sequence

| Step | Owner | Change |
|---|---|---|
| 1 | `content` | Write the section 8 keys; delete `notify.button` and `notify.done` when the new ones land |
| 2 | founder | Approve the PROPOSED strings; answer CS-Q1 to CS-Q4 |
| 3 | `legal`, `privacy` | Read the door lines in section 7 and CS-Q3; confirm the device-backup caveat wording |
| 4 | `design-systems` | `COMPONENTS.md` line for `CoParentSoon`; measure CS-R14 pairs |
| 5 | `mobile` | Tappable caption; re-base the sheet; `clearCoParentNotify`; the S3 note; remove `track('coparent_soon_opened')` and any other `coparent_soon_` string; tests for CS-R5, R6, R7, R10, R15 |
| 6 | `data-architect` | Confirm `family.coParentNotify` is in no sync or backup set |
| 7 | `qa` | Device pass: VoiceOver script 4.7, AX5, Reduce Motion, airplane mode, both themes |

## 12. Open design questions, each with a default

| # | Question | Default |
|---|---|---|
| CS-Q1 | A button (as drawn) or a switch? | A button that becomes a confirmation with "Turn this off". A switch would show state on first view, but a switch on a feature that does not exist reads as a setting already in effect, and the brief wants a 56 pt primary button |
| CS-Q2 | Where does the shipped note sit? | The top of Me, once, because it is news. The alternative, in the caption's place below the fold, risks being missed, and then the flag would never clear in a way the parent saw |
| CS-Q3 | Does "when it is ready" promise the feature will ship? | It is the founder's phrasing and carries a mild promise. `legal` reads it. A softer wording would be "Let me know if it is ready", which is awkward; I recommend keeping the founder's words and the hint "Nothing is sent", and not adding "we will" anywhere |
| CS-Q4 | Store the day, or a bare marker? | Keep the day for now (no change to existing, tested logic). A bare marker stores less; `privacy` may prefer it |
| CS-Q5 | Should the old drawing return to the sheet? | No, until `creative` shows it contains no child. The sheet works without it |
| CS-Q6 | Does a signed-out phone see the S3 note? | Yes: the note shows if the build has co-parent sharing, and the invite action leads to whatever the real flow needs first (sign in). Product confirms |

## 13. UNVERIFIED

Everything on a device (the tap, the underline, the sheet height at AX5, the VoiceOver order and announcements, Reduce Motion behaviour, the S1 to S2 swap); that the `Sheet` footer slot behaves as COMPONENTS 2.12 says; that `LineArt "together"` shows no child; that no sync or backup path carries `family.coParentNotify`; that Erase everything clears the settings row (comment read, code not); that the single `success` haptic exists in COMPONENTS 0.2; what #720 removed and where it is merged; whether `flags.familyTeaser = 'quiet'` is set anywhere; contrast of `textMuted` on `surfaceRaised` and `accentSoft`; the exact current wording of the real invite flow for `coparentReady.note`; any Apple behaviour named above. I read no Apple documentation.
