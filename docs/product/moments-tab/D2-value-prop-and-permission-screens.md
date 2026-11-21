# D2. Moments tab: the value-prop view and the photo permission screens

Status: PROPOSED. Docs only. Author: design lead D2 of 5, 21 Nov 2026 (UTC). Branch `wip/moments-d2`. Nothing here is a founder decision, a counsel clearance or a content approval. Every parent-facing word below is a draft for `content` and is marked as one; no PROPOSED word may ship (brief, last decision of record).

Family in every example: Asha. Public name: `{app}`. Tab name: "Moments" is a working label only (see MT-D2-Q1).

## 1. Purpose and scope

The founder asked for a tab that shows its value before it asks for photos, then asks plainly, and still shows real things when the answer is no or "some". Later (UPDATE, 20 Nov) he relaxed "default tab": the tab can be second, in the centre, or default. This doc therefore designs every screen so it works wherever the tab sits, and says how the first view differs when the parent arrives by a tap versus by launch (section 5).

In scope (this doc):
1. S1 The value view, before any permission question (illustrated examples).
2. S2 The primer, a sheet that comes before Apple's own prompt.
3. S3 Not now.
4. S4 Declined (our reading, section 3.1).
5. S5 Limited access, including how to add more photos.
6. S6 Denied.
7. S7 Restricted.
8. S8 The later Settings entry.
9. The same screens under Route A (Apple's journaling suggestions picker), where there is no library permission.

Out of scope (other leads or other docs): the tab's position and the daily-return engine (IA and product leads), the filled "For you" and "Recent" views once photos are allowed (concept doc), motion and transitions (animation and transition leads), push and email wording (content, privacy). Where I depend on them I name the dependency in section 9.

## 2. Inputs read

| Input | Path or URL | What I took from it |
|---|---|---|
| Brief of record | `/home/claude/moments-brief.md` (with the 20 Nov UPDATE) | Position is open; examples use Asha; constitution; no streaks, counts, gaps. |
| Earlier permission design | `docs/design/specs/MEMORY-LIBRARY-CONSENT-AND-SURFACING-10nov.md` (CS-S1, CS-S2, CS-S3) | The primer pattern (`PermissionPrimer` on `Sheet`, two equal buttons, "Not now" holds), the four outcomes, "Choose more", re-read status on foreground. I reuse and extend it; I do not copy it. |
| Photo moments requirements | `docs/product/prd/27-photo-moments-and-media.md`, NS-51-R1 to R29 | R1 (no library ask before a tap on its own row), R3 (limited and full both work, no second ask), R4, R16, R18, R19, R23, R25, R26. |
| Privacy read (open branch) | branch `docs/privacy-moments-tab-21nov`, `docs/product/MOMENTS-TAB-PRIVACY-AND-CONSTITUTION-21nov.md` (head `6b57c94`) | Route A needs no usage string (its A1, unconfirmed for plist); Route B needs `NSPhotoLibraryUsageDescription`; label stays "Data Not Collected" only while nothing leaves the phone; CQ-1. |
| Permissions audit | `docs/product/PERMISSIONS-AND-TERMS-AUDIT-20nov.md` | Photos today use the system picker, no usage string, no PhotoKit; the policy and label docs still say no photo feature. |
| Design language v2 | `docs/design/DESIGN-LANGUAGE-V2-21nov.md` | Content stays paper; glass only on navigation and controls, max three; `glassFallback`; R5 (the book as the one illustration, no faces, no mascot); empty states show the closed cover. |
| Photography rules | `docs/design/PHOTOGRAPHY.md` | No children in any image, no identifiable faces, no stock for in-app proof. So our examples are drawn, not photographed. |
| Photo with a letter spec | `docs/design/specs/01-PHOTO-WITH-A-LETTER-11nov.md` | The system picker needs no permission and keeps working in every state below. |
| Words rules | `packages/content/BRAND.md` glossary; `CLAUDE.md` content rules | "moment" is banned as the word for a short piece a person makes (glossary row "Short piece someone makes": note, not moment). See MT-D2-Q1. |
| Tokens and components | `packages/design-tokens/src/tokens.ts`; `apps/mobile/src/components/ui/` | Names used below exist: `accentSoft`, `onAccent`, `controlBorder`, `surfaceRaised`, `textMuted`, `kicker`, `title2`, `callout`, `footnote`, `fadeMs`, `exitMs`, `enter`, `staggerMs`, radii sm 8, md 14, lg 20, xl 28. `Sheet`, `Button`, `Card`, `EmptyState`, `ListRow`, `Toast`, `ErrorLine`, `LineArt` exist. `PermissionPrimer`, `ChipGroup`/segmented preset for the two parts and `LimitedAccessRow` are not in `ui/` (build). |
| Apple, read this session | see section 10 | The five authorization cases; `presentLimitedLibraryPicker`; the automatic limited alert once per app life cycle and its Info.plist key; the Journaling Suggestions picker intro modal. |
| Not found | branch `wip/moments-b1` (market benchmark) | Did not exist when I fetched it (`couldn't find remote ref`). I cite nothing from it. Reconcile when it lands (section 9). The design concept doc was not yet open either; assumptions in section 9. |

I did view none of the founder's screenshots, and nothing below copies a name, place or face from them.

## 3. Design

### 3.0 Rules that hold on every screen here

1. The tab never shows an empty promise (J5). In every state, including denied, the tab body holds at least one real card the parent can act on today, from sources that need no library: our 111 written prompts (always available), typed occasions and Days, month and age days from `{child}`'s date of birth, a year ago from the parent's own letters, pictures the parent already attached to letters. Test: MT-D2-R2.
2. The ask is never automatic. iOS's prompt appears only after a tap on "Continue" in the primer, and the primer opens only from a tap on our own control. Not from launch, first run, a push tap, a deep link, recording, Review, or a tab switch (NS-51-R1). This is the part of K-02 that survives even if the founder reverses the rest.
3. One ask, then quiet. After Apple's answer we never ask a second time, never say which answer is better, never apologise (NS-51-R3).
4. Content stays paper. No glass on any card or example. The pinned ask bar is a control surface: it may use `glassFallback` solid in all cases for now (glass only after the SDK 58 spike, design language v2). At most one glass surface on this tab.
5. The examples are drawn, not photographed, and each one says it is an example. They show only what the product may do under the constitution: a date; the parent's own typed words; a drawn grid of tiles. They never show a title, place, person or caption made by a machine, because the product may not make one.
6. No counts, no "N days", no "you have M photos", no streak, no badge on the tab icon, no dot, no "waiting". A tab with no news looks the same as a tab with news.
7. No red, no warning colour, no "you are missing out" on any permission state. Terracotta means recording and is never used here.
8. AX5: every line wraps whole, nothing is truncated, controls stack at full width and are at least 44 pt. VoiceOver order is stated per screen. Reduce Motion: no slide, one `fadeMs` cross-fade or none. Reduce Transparency and Increase Contrast: solid surfaces and `controlBorder`. Both themes. iPhone SE 3 (375 x 667 pt) is the layout floor.

### 3.1 The states, named once

Photo access has two layers: what iOS says, and what the parent chose in our UI. They are not the same, and the tab must handle every pairing.

| State id | iOS says (verified, section 10) | Our record | Meaning for the parent |
|---|---|---|---|
| ACC-0 | notDetermined | none | Never asked. Shows S1. |
| ACC-1 | notDetermined | notNowAt | Opened the primer and chose "Not now". iOS was never asked, so a later ask is still possible. Shows S3. |
| ACC-2 | authorized | optIn | Full access. Concept doc's filled views. Settings S8. |
| ACC-3 | limited | optIn | Parent chose some photos. Shows S5. |
| ACC-4 | denied | optIn or none | iOS holds a refusal (answered "Don't Allow", or turned off later in iPhone Settings). Shows S6. |
| ACC-5 | restricted | any | The parent cannot grant access on this iPhone. Shows S7. |

"Declined" (brief wording): iOS cannot tell us whether a denial came from the alert or from iPhone Settings, because the status is one value (denied). So S4 is not a separate screen. I read "declined" as the moment right after the parent answers Apple's prompt with "Don't Allow", and S4 is that arrival (a one-time Toast and the S6 view). If the founder meant a hard in-app "No thanks, never ask", I recommend we do not build it: Not now already never repeats (MT-D2-R6), and a permanent refusal in our UI adds a choice with no benefit. Flagged MT-D2-Q3.

Route A (Apple's suggestions picker) has none of ACC-3 to ACC-5: there is no library permission, so the app only sees what the parent picks. See 3.10.

### 3.2 S1. The value view (ACC-0)

Purpose: show what the tab does, with our own illustrations, then offer the ask. It is the first thing in the tab until the parent chooses either way once.

Layout, iPhone SE 3, light, default text size. Paper tab bar at the bottom (the bar's own tabs and order are the IA lead's; shown generic).

```
+-----------------------------------------+
| 9:41                                    |
|                                         |
|  Moments                     (title1)   |  large serif title
|  [lead] Pick something to write about   |  body, 2 lines max by design;
|  from your day.                         |  wraps whole at AX5
|                                         |
|  An example, with Asha          (kicker)|
|  +-----------------------------------+  |
|  | [drawn tiles: 2 x 2 soft blocks,  |  |  Example 1: a day from your photos
|  |  no faces, no scene]              |  |  surfaceRaised card, radius lg
|  | Saturday 14 June                  |  |  a date only, no title
|  | ( Tell it as a letter )           |  |  quiet button, inert (example)
|  +-----------------------------------+  |
|  +-----------------------------------+  |
|  | A year ago                        |  |  Example 2: from your own letters
|  | You wrote: "She laughed at the    |  |  the parent's typed words, quoted,
|  | spoon."                           |  |  shown as an example of theirs
|  +-----------------------------------+  |
|  +-----------------------------------+  |
|  | Asha is 7 months on Thursday      |  |  Example 3: a day from the date
|  +-----------------------------------+  |  of birth
|  (more examples scroll; see below)      |
+-----------------------------------------+
| surfaceRaised ask bar, hairline top     |  pinned (see 5.2), 100 pt
|  Use your pictures to find days.        |  callout
|  ( Find days in my photos )   primary   |  56 pt
|  Not now                      quiet 44  |
+-----------------------------------------+
|  Home    Moments    Book    Me          |  paper tab bar (IA lead decides set)
+-----------------------------------------+
```

The examples, five in total, in this order (each card has the kicker "An example, with Asha" once above the stack, and each card is also labelled for VoiceOver as an example):

| # | Value it shows | Drawn content (fictional) | What it must not contain |
|---|---|---|---|
| E1 | A day from your pictures | A 2 x 2 grid of plain soft tiles in `accentSoft` and `surface` with a date line: "Saturday 14 June". A quiet "Tell it as a letter" row. | Any title ("Beach morning"), place, person, scene, music, mood, count, "best". |
| E2 | A year ago, from your own letters | One line the parent wrote, in quotes and serif, with the date a year back. | A rewritten or summarised line. The words are the letter's own, verbatim (and labelled as the parent's). |
| E3 | A day that matters | "Asha is 7 months on Thursday." A quiet "Write about it". | "Only N days left", "don't miss". |
| E4 | A question to start with | One of our written prompts, in a prompt card. | Anything that says a machine wrote it. It is one of our 111, written by us. |
| E5 | A picture you chose, beside your words | The drawn tiles beside a short typed line, as a letter card with a leading thumbnail. | A caption we made. |

Rules for the examples:
- The kicker line reads as an example and is title case, not all caps (design language v2, R3 `kicker`).
- All five are inert: tapping an example does nothing except put VoiceOver focus on it. A real tap target that does nothing is a lie, so they are not buttons; their "Tell it as a letter" rows are drawn, not controls (and hidden from the focus order as controls). If the parent taps one, nothing happens, with no haptic.
- Illustrations are `LineArt` or a new drawing in paper and ink, no people, no children, in line with design language v2 R5 and PHOTOGRAPHY rules 2 and 3. No stock photo (PHOTOGRAPHY section 1).
- Asha's name appears in examples only. A parent's real `{child}` name is not used in S1 because the view must work before a child is set (NS-51 note: the tab can open before a child exists, and nothing may say "your baby" in the wrong tense). When a child exists, E3 may read `{child}` (a real, typed fact) and the kicker changes (MT-D2-R3).

Scroll: the stack scrolls under the pinned bar. The last card ends 24 pt above the bar. Nothing is cut at a card boundary at the fold so scrolling is evident.

States of S1:

| State | Spec |
|---|---|
| Default | As drawn. |
| Offline | Identical (the screen needs no network). |
| Loading | None; static. No skeleton. |
| Nameless child / no child yet | Examples stay Asha; no `{child}` text. |
| AX5 | Pinned bar becomes inline at the end of the scroll (cannot take half the screen). Buttons stack full width at equal height. Example cards single column. |
| VoiceOver | Focus lands on the title. Order: title, lead, kicker, each example as one element ("Example. Saturday 14 June, a day from your pictures." and so on), then "Find days in my photos", then "Not now". The drawn tiles are hidden from VoiceOver. |
| Reduce Motion | No stagger; cards appear at once. Otherwise cards fade in with `enter` and `staggerMs`, first view only. |
| Dark | `surfaceRaised` cards with the v2 1 pt top highlight; tiles use `accentSoft` dark values. |
| Bold Text | Weights follow the system; no layout shift beyond wrap. |

### 3.3 S2. The primer (before Apple's prompt)

Opens on "Find days in my photos" (S1, S3, S6 none, S8). Reuses `PermissionPrimer`: a `Sheet` at medium detent, full height at AX5. Two equal buttons, equal height, equal type; no pre-selected option; "Not now" is a button, not a link (CS-S1 pattern).

```
+-----------------------------------------+
|   ----  (grabber)                       |
|                                         |
|  Find days in your photos     (title2)  |
|                                         |
|  [reads]  We look at the date of your   |
|  pictures to find days worth a letter.  |
|                                         |
|  [never]  We never look at what is in   |
|  them or who is in them. We never write |
|  anything for you.                      |
|                                         |
|  [where]  This stays on your iPhone.    |
|  Nothing is sent to us.                 |
|                                         |
|  [next]   Your iPhone asks next. You    |
|  can choose all photos or only some.    |
|  This works either way.                 |
|                                         |
|  ( Continue )                  primary  |
|  ( Not now )                   outline  |  equal weight, equal height
+-----------------------------------------+
```

Words above are drafts for `content` (keys `moments.ask.*`, one verb each, parent words only). They are subject to counsel (the usage string and the "stays on your iPhone" claim, which is true only if NS-51-R26 and R28 tests are green).

Shown, Records, Never, Decline (PRIV-R21, COORDINATION section 10):
- Shown: the four lines above and the two buttons, before any OS prompt.
- Records: on the phone only, the access level iOS reports, whether "Not now" was chosen, and the time of the choice. No library data.
- Never: no photo, date, place, count of pictures, or identifier is read before the parent answers Apple's prompt; nothing is sent from the phone; no analytics field carries an opt-in state or a date from the library (NS-51-R27).
- Decline and withdraw: "Not now" closes the sheet and holds (S3). The parent can turn it off any time in Settings (S8). Everything else in the tab and the app still works.

States of S2:

| State | Spec |
|---|---|
| Continue | Sheet closes, then iOS's alert appears at once. The alert is Apple's and is never restyled or followed by "are you sure" or thanks. |
| Not now | Sheet closes with `exitMs`. A `Toast` for the intent "You can change this any time in Settings." Then S3. |
| iOS returns an error, not an answer | Sheet closes; one `ErrorLine` in the tab ("That did not work. You can try again in Settings."). No retry loop. |
| iOS already holds a refusal | The sheet is not shown. The tab goes to S6. |
| Already allowed | The sheet is not shown; the tab shows the filled view. |
| Restricted | The sheet is not shown; S7. |
| Swipe down | Same as Not now (HIG sheets: swipe to dismiss; no unsaved data so no confirm). |
| Sheet open and app goes inactive or App lock comes up | Sheet is dismissed; nothing recorded; on return the tab is as before (NS-51-R25 pattern). |
| AX5 | Full height, scrolls; buttons follow the last paragraph, stacked, full width. |
| VoiceOver | Focus lands on the title. Order: title, the four lines, Continue, Not now. Continue hint: "Your iPhone asks next." |
| Reduce Motion | One `fadeMs` cross-fade, no slide. |

The usage string (`NSPhotoLibraryUsageDescription`) is separate from this sheet: plain, true, one sentence, reviewed by `content` and counsel (NS-51-R2). A missing string crashes the app when access is requested, so a build test fails without it (privacy read, A8; NS-51-R2).

### 3.4 S3. Not now (ACC-1)

The parent said "Not now" in the primer. iOS was never asked, so we keep our word: no automatic ask, ever.

What changes against S1:
- The pinned ask bar is gone. In its place, one quiet row at the top of the real content: "Use your photos" with a chevron, 44 pt minimum, in `textMuted` on `surface`. Tapping it opens the primer again (S2). It is the only door back, besides Settings.
- The examples are gone. The tab now shows real things (section 3.9). The parent has seen the value; showing drawn examples again would be a sales page.
- No badge, no dot on the tab, no re-prompt after N days, no "you have not turned on...". A quiet row is not a nag, but it is also not dismissible: dismissing would hide the only door, and it costs one line.

```
+-----------------------------------------+
|  Moments                                |
|  ( For you | Recent )                   |  segmented
|  > Use your photos                      |  quiet row
|  +-----------------------------------+  |
|  | A year ago                        |  |  real, from the parent's letters
|  | You wrote: "..." (their words)    |  |
|  +-----------------------------------+  |
|  +-----------------------------------+  |
|  | Asha is 7 months on Thursday      |  |  real, from the date of birth
|  +-----------------------------------+  |
|  +-----------------------------------+  |
|  | A question to start with          |  |  one of the 111 prompts
|  +-----------------------------------+  |
+-----------------------------------------+
```

States: AX5 the row wraps whole at full width; VoiceOver reads "Use your photos. Opens a short explanation." (hint); Reduce Motion no change. The Toast shown on arrival is the only "feedback" and never repeats.

### 3.5 S4. Declined (the moment after "Don't Allow")

Not a screen of its own (section 3.1). What the parent sees, once:
1. Apple's alert closes. We say nothing for 0 ms of delay; the tab simply shows S6 (denied).
2. One `Toast` with the intent "That is fine. You can change it in Settings any time." Draft words, `content` owns them. Auto-dismisses at the standard Toast time; stays for VoiceOver users (announced politely, once).
3. No second system ask. The primer cannot be opened again from this state (S6 has no "Find days" button, only "Open Settings").

### 3.6 S5. Limited access (ACC-3)

The parent chose "some photos" in Apple's prompt. The app works exactly like full access, over the chosen set (NS-51-R3, R18). Nothing nags.

What the parent sees, in addition to the filled views:
- One quiet line at the end of Recent (never at the top once the set is non-empty): "You chose some photos for {app}." (draft; the line stays true: it says what happened, not what is better.)
- One quiet control under it: "Choose more photos". 44 pt minimum, full width at AX5. It calls `presentLimitedLibraryPicker` from our own control only. We set `PHPhotoLibraryPreventAutomaticLimitedAccessAlert` so the system's reminder never appears at a surprise moment (both verified in Apple's method page, section 10; the plist key name is as Apple writes it there, NS-51-R4 called it UNVERIFIED because it came from a screenshot, so this closes that point).
- If the chosen set is empty or too small to make any day (NS-51-R18): no day cards, no message about what is missing. The line and "Choose more photos" move to the top of Recent so the parent has a door; everything in For you (non-photo sources) is unchanged. Still no "you have chosen 0".

Wireframe, Recent, limited, default size:

```
+-----------------------------------------+
|  Moments                                |
|  ( For you | Recent )                   |
|  Saturday 14 June                       |
|  [ drawn thumbs: the parent's own ]     |  4 max, from chosen set
|  ( Tell it as a letter )                |
|  Friday 13 June                         |
|  [ thumbs ]                             |
|  ...                                    |
|  -------------------------------------  |
|  You chose some photos for {app}.       |  footnote, textMuted
|  ( Choose more photos )         quiet   |
+-----------------------------------------+
```

How to add more photos, the three honest ways (all shown or reachable, in this order):
1. "Choose more photos" in the tab (and in S8): opens Apple's limited-library picker. When the parent finishes, iOS reports a library change and we re-read while the app is open (the observer is foreground only; NS-51-R29 forbids a background observer).
2. iPhone Settings, Photos access for the app. Words and path for this are UNVERIFIED this session (the Settings menu labels change by iOS version); we offer "Open Settings" only from S8, not from S5, so we do not have to describe a menu we have not checked. Flagged MT-D2-Q5.
3. Adding one photo to one letter through the system picker needs no access and works in every state (spec 01). The tab says this in one line only inside S8 ("You can always add a photo to a letter.").

Under limited access new photos do not appear in the app until the parent adds them to the chosen set. We say so only after the device spike confirms how new photos behave (CS-S2b; UNVERIFIED). Until then the S5 line says only what is true now (they chose some).

States: AX5 the line wraps whole above a full-width stacked button; VoiceOver reads the line and button as two elements, in that order, hint "Opens your photo choices". After the picker closes, a polite announcement is not made (nothing to announce that is not a count).

### 3.7 S6. Denied (ACC-4)

iOS holds a refusal. We do not ask again, and we cannot (iOS will not show the alert a second time: UNVERIFIED this session; the fix must go through iPhone Settings per Apple's usual guidance, which I did not read here).

What the parent sees: the tab shows real things (3.9), and one quiet block at the top of Recent and at the end of For you:

```
+-----------------------------------------+
|  Photos are off for {app} in iPhone     |  callout, text
|  Settings.                              |
|  ( Open Settings )               quiet  |  44 pt, full width at AX5
+-----------------------------------------+
```

- No red, no icon of a warning, no "you are missing out". A calm line, one button.
- "Open Settings" opens the app's page in iPhone Settings (`UIApplication.openSettingsURLString`: UNVERIFIED this session; mobile confirms the exact call).
- When the parent comes back from iPhone Settings after allowing, the next foreground re-read shows the new level with no comment (CS-S2d). Going to limited or full needs no extra tap from us; however the first day cards appear only after the index look runs (NS-51-R6, R7), which is local and silent.
- Nothing appears on Home for a denied parent (NS-51-R19). The block lives in the tab and in S8 only.

### 3.8 S7. Restricted (ACC-5)

Apple's definition (verified): the app is not authorized and the user cannot grant it. We do not know why (a device rule, a school or work profile, a child account). We do not guess, and we do not name Screen Time or a manager (UNVERIFIED which causes produce this status).

```
+-----------------------------------------+
|  This iPhone does not let {app} use     |  callout
|  photos.                                |
+-----------------------------------------+
```

- No "Open Settings" button: the parent may not be able to change it, and a button that cannot work is a dead end. A dead end for a parent who has no control is not a calm state.
- No primer, no ask, no "try again". The rest of the tab is real (3.9).
- Whether the system picker (for adding one photo to a letter) still works under a restriction is UNVERIFIED; if it does not, the "Start from a photo" door must say so in its own words. That is `mobile`'s spec, flagged MT-D2-Q6.

### 3.9 The real things when there is no library (S3, S6, S7 and the quiet parts of S5)

The tab body is never empty. Sources and order, all needing no library and no network:

| Order | Card | Source | Shows | Hidden when |
|---|---|---|---|---|
| 1 | A day that matters | Typed occasions and Days (NS-46), month and age days from the date of birth | The day and what it is ("Asha is 7 months on Thursday", or the parent's own typed name for the day) | none within the window |
| 2 | A year ago | The parent's own letters, a year back | The date and the parent's own first line, verbatim, in quotes | no letter a year back |
| 3 | A picture you chose | A photo the parent already attached to a letter | The letter card with its thumbnail (opens the letter, not a viewer) | no attached picture |
| 4 | A question to start with | One of the 111 written prompts | The prompt card | never hidden. This is the floor that makes the tab never empty. |

In Recent without library access: the days that already have a letter, newest first, as the Book's own letter cards (the same cards, not a new design). With no letters yet: Recent shows the same card 4 and one sentence, never "no moments yet". The sentence is a draft for `content` and must not count or name a gap.

No card counts, ranks, or says "best". Order is by date, then by source as in the table.

### 3.10 S8. The later Settings entry

Where: Me, then Settings, a row in the Privacy and security group named "Photos" (draft; `content` owns the label; "Moments" if that name stands). It is one tap from Me (IA-FINAL: Settings pushes from Me). It never lives anywhere else: not on Home, Book, or in Review.

The row summary shows the state in words, never by colour alone, and never a count:

| Access | Row value (draft) | Detail page controls |
|---|---|---|
| ACC-0 | Off | "Find days in my photos" (opens S2). A line: "You can always add a photo to a letter." |
| ACC-1 | Off | Same as ACC-0. |
| ACC-2 | On, all photos | "Pause", "Turn off", and the album choice (full only, NS-51-R14). |
| ACC-3 | On, the photos you chose | "Choose more photos", "Pause", "Turn off". No album choice (the set is the scope, NS-51-R14). |
| ACC-4 | Off in iPhone Settings | "Open Settings". No switch that cannot work; the switch is shown disabled with its reason in words. |
| ACC-5 | Not available on this iPhone | One line. No button. |

Rules:
- "Pause" stops every read and empties the index at once (NS-51-R15). "Turn off" deletes the index and the album choice in the same action, and says in one line that access can also be changed in iPhone Settings. It never claims it revoked the system permission (NS-51-R16).
- Sign-out, Erase everything and Delete account clear the opt-in and index (NS-51-R17). A restored or new phone starts Off, with no ask (NS-51-R23). A second account starts Off even if iOS already holds a grant (NS-51-R24).
- The page shows the last time the app looked, as a time, never a count (CS-S3 pattern), only if the privacy lead allows a time to be stored.

States: AX5 rows become stacked; every switch has words beside it; VoiceOver reads each row as one element with its value; "Open Settings" hint "Opens iPhone Settings".

### 3.11 Route A: Apple's journaling suggestions picker (no library permission)

If the feasibility work picks Route A, ACC-3 to ACC-5 and S2 as written do not exist, because no library permission is requested. What I verified (section 10): the picker is a SwiftUI view available from iOS 17.2, on first appearance it shows its own modal that introduces journaling suggestions, and after the parent picks, only the information for the chosen suggestion is shared with the app. Two consequences for this doc:
1. The deployment floor is iOS 17.0 (D-098) and the picker needs 17.2. The tab must hide or degrade on 17.0 and 17.1. NS-51-R20 says the same about 17.2 for level 2. Flagged MT-D2-Q4.
2. The primer changes to a lighter "what happens next" sheet: Apple's own intro modal explains its feature, so we say only that the parent will pick, that we see only what they pick, and that titles and names in Apple's sheet are Apple's, not ours. The Shown, Records, Never and Decline lines still apply, and `Records` is only "they used it" at most.
3. States become: Available, Not available on this iOS, and "the parent picked nothing" (no state, no message). Denied and restricted do not exist; S1 and S3 still apply with the button reading as the sheet's own verb. S8 shows one row: "Choose from Apple's suggestions" with no level words. A machine title from Apple's sheet is never stored or shown by us (brief constitution rule).

The reversal list in the brief (J4, K-02, BL-1305, ML-6, the three-tab ruling) is not changed by Route A except BL-1305 (no usage string needed for Route A) and ML-6 (Apple's sheet shows places; ours does not). Founder owns each.

## 4. Requirements

Test layers: U unit, C content test, E2E e2e (Maestro), D device pass (TestFlight on a real iPhone), A accessibility gate, S scan or build test. All PROPOSED.

| Id | Requirement | Given, When, Then | Layer |
|---|---|---|---|
| MT-D2-R1 | The first view before any answer is the value view. | Given a parent who has never answered the primer, When they open the Moments tab, Then they see title, lead, five labelled drawn examples and the ask bar, and no iOS prompt appears. | E2E |
| MT-D2-R2 | The tab is never empty. | Given any state ACC-0 to ACC-5 and a brand-new account with no letters and no child, When the tab opens, Then at least one real card (a written prompt) is shown, and no string says "nothing yet" or counts a gap. | U, C |
| MT-D2-R3 | Examples are labelled and drawn. | Given S1, Then every example sits under the example kicker, contains no photograph, face, child, title, place, person, scene or count, and VoiceOver says "Example". | C, A |
| MT-D2-R4 | Examples are inert. | Given S1, When the parent taps an example, Then nothing opens and no haptic plays. | E2E |
| MT-D2-R5 | No automatic library ask, anywhere. | Given launch, first run, a push tap, a deep link, a tab switch, recording, or Review, When the app runs, Then `requestAuthorization` is not called. It is called only after "Continue" in the primer. | E2E, S |
| MT-D2-R6 | Not now holds. | Given "Not now" or a swipe down on the primer, When the parent next opens the tab, Then no primer and no iOS prompt appear by themselves, and the only door back is the "Use your photos" row or Settings. | E2E |
| MT-D2-R7 | One ask. | Given iOS holds any answer, When the parent taps any door, Then the primer and alert are not shown again (denied goes to Settings, limited offers the limited picker, authorized is a no-op). | U |
| MT-D2-R8 | Primer wording and records. | Given the primer, Then it carries the Shown, Records, Never and Decline lines of section 3.3, uses no banned word, and writes nothing library-derived to the database or analytics. | C, U |
| MT-D2-R9 | Limited works like full and never nags. | Given limited access, When the tab opens at any time, Then day cards are built from the chosen set, the limited alert does not appear by itself (the plist key is set), and the only prompt is the one the parent opens with "Choose more photos". | D |
| MT-D2-R10 | Choose more photos. | Given limited access, When the parent taps "Choose more photos", Then Apple's limited picker opens from that tap; when it closes, the tab re-reads while the app is open and makes no announcement. | D |
| MT-D2-R11 | Denied is quiet. | Given denied, When the tab opens, Then the calm line and "Open Settings" show in the tab and S8 only, never on Home, no second alert is attempted, and no warning colour or icon is used. | E2E, A |
| MT-D2-R12 | Restricted has no dead-end button. | Given restricted, Then the line shows, no "Open Settings", no primer, no ask. | E2E |
| MT-D2-R13 | Status re-read on foreground. | Given the parent changes access in iPhone Settings, When the app returns, Then the tab and S8 reflect it without a message; going narrower empties the index at once. | D |
| MT-D2-R14 | Settings entry states. | Given S8, Then the value reads as in the table in 3.10, by words not colour, with Turn off deleting the index and never claiming it revoked the system permission. | U, E2E |
| MT-D2-R15 | No library signal leaves the phone. | Given the whole flow, Then a network fake sees zero requests from it and canary asset ids found in logs, breadcrumbs, crash payloads and analytics are zero. | U, S |
| MT-D2-R16 | Accessibility gate. | Given each screen in light and dark on iPhone SE 3 and the largest iPhone, Then text at AX5 is never truncated, targets are at least 44 pt, VoiceOver order matches the tables, Reduce Motion, Reduce Transparency and Increase Contrast hold, and colour is never the only signal. | A, D |
| MT-D2-R17 | The ask bar position. | Given default text up to XL, Then the pinned bar shows; from AX1 up it is inline at the end of the scroll. | A |
| MT-D2-R18 | Tab position independence. | Given the tab is second, centre in a five-tab bar, or default, Then the screens, words and states are identical except the arrival rules in section 5. | E2E |
| MT-D2-R19 | Locked or inactive. | Given App lock is up or the app goes inactive, Then the primer cannot be open, a result returning while locked is discarded, and thumbnails are replaced by opaque boxes before the switcher snapshot (NS-51-R25). | D |
| MT-D2-R20 | Route A variant. | Given Route A, Then S2 is the lighter primer, the 17.0 and 17.1 case hides or degrades the tab, and nothing from Apple's titles or names is stored or shown. | E2E, U |

## 5. Wherever the tab sits, and how the first view differs by arrival

The screens above are the tab's body. They do not depend on the tab bar order. What changes by position is how the parent arrives.

### 5.1 Position options, from this doc's point of view

| Option | What it does to these screens | My view |
|---|---|---|
| Home default, Moments second | Parent arrives by a tap. S1 is shown with the pinned bar. A parent who never taps never sees it, so the permission is never requested. | Safest for K-02 and NS-51-R1: the ask follows an act of interest. Fits "bring them back" less, because the tab is one more tap. |
| Moments centre of five | Centre is a tap; a five-tab bar is tight on iPhone SE 3. Labels are single words, and AX5 labels need the bar's own accessibility spec (IA lead). I add no raised or oversized centre button: the tab bar is navigation, not a call to action. | Good for prominence. The cost is a fifth tab, which the three-tab ruling forbids (a reversal the founder owns). |
| Moments default | Parent arrives by launch on the first ever open and on later cold starts. Needs the launch rule in 5.2. | The founder's first idea. Highest risk to the first impression, because the first screen would be about photos before the parent has a first letter (K-02). |
| Moments inside Home | No tab at all; S1 becomes a section of Home. The pinned bar must not appear; the ask is the inline row. | Weakest fit for "this is why I come back". |

I do not decide position (IA lead, product). I recommend the screens stay position-free and a tab can be moved with no copy change.

### 5.2 Arrived by a tap, versus by launch

| Case | What the parent sees |
|---|---|
| Tap on the tab, first time | S1 in full: examples first, then the pinned ask bar. They chose to come, so the ask is within reach. |
| Launch lands on the tab (Moments is default), first time ever | S1 without the pinned bar: lead line, the examples, and the ask as an inline card after the last example. The parent did not choose to be here, so nothing sits over the first impression and nothing asks before they have seen what it is. On a first run the tab is not reached until first run has ended (K-02: no ask in first run). |
| Launch lands on the tab, later | If ACC-0: S1 with the inline card, bar suppressed. If ACC-1 or any granted or denied state: the real things (3.9), not examples. |
| Tap, later, after Not now | S3 (real things plus the quiet row). |
| Opened from a push, email link or deep link | Lands on the tab as it would on a tap, but nothing is asked and no primer opens, ever (NS-51-R1). If ACC-0, the examples show and the card is inline. A nudge, being neutral text with no library signal (ML-3 and NS-51-R11), cannot depend on a state this tab shows. |
| Tab opened with no child set | Same as above. The examples are Asha; no `{child}` text. |

A single rule: the pinned bar appears only on a tap-arrival, and only until the parent answers once. Everywhere else the ask is inline.

## 6. Edge and unhappy paths

| Situation | What happens |
|---|---|
| Parent taps Continue, then Apple's alert is dismissed by the system (call, app switch) | The status stays notDetermined; the tab stays S1 or S3 depending on whether Not now was chosen. No re-ask. |
| Parent answers "Select photos" and selects zero | ACC-3 with an empty set. S5's empty-set rules (NS-51-R18). |
| Parent allows all, later narrows to limited in iPhone Settings | Re-read on foreground; the index is emptied at once, then rebuilt from the chosen set; no comment. |
| Parent denies, then allows in iPhone Settings | Re-read shows the new level; day cards appear after the local look runs. |
| iCloud-only originals | No download is triggered; a plain box shows if no local thumbnail (NS-51-R21, UNVERIFIED). |
| Two accounts | Opt-in per account (NS-51-R24). |
| Restored or new phone | Off and no ask (NS-51-R23). |
| Child set later | Examples and S3 text are unaffected; E3 may show the child's name once a child exists. |
| Long text, large type | Everything wraps whole; nothing is truncated at AX5. |
| Offline | Every screen here works offline. |
| Android, iPad, Mac app, Expo Go, module absent | The tab does not show S1 (no feature, no empty promise); it shows only the real things (NS-51-R20 pattern). |
| iOS 17.0 and 17.1 on Route A | The Apple picker is not available (it needs 17.2, verified). Degrade as in 3.11. |

## 7. Constitution, privacy and accessibility checks

Constitution: nothing in these screens writes, rewrites, summarises or titles anything. Examples show a date, a parent's own typed words (verbatim) and drawn tiles. The word "moment" is not used in any string where it would name a note (glossary). No scene, place or person guess; no face matching. No counts, gaps, streaks, points or badges; nothing implies AI writes anything; `{child}` is used and never gendered.

Privacy: nothing leaves the phone; no photo, filename, album, place or date in analytics, logs or crash reports; analytics may carry no opt-in state or library date (NS-51-R27). The Data Not Collected claim holds only while R15 stays green; if any picture, thumbnail, date, coordinate or title leaves the phone, the label is false and counsel is told (privacy read). A place name from reverse geocoding may send coordinates to Apple (UNVERIFIED); I use no place anywhere.

Accessibility: the gate in MT-D2-R16 and the per-screen tables. Colour is never the only signal: every state has a sentence. Contrast: I use existing tokens whose ratios are recorded in `tokens.ts` comments; I computed none and the new surfaces (the ask bar and the examples' tile colours) need the contrast tests when built (design systems standing duty 2). Where text sits on `accentSoft` tiles, there is no text on the tiles.

Legal and store: App Store guideline 5.1.1(ii) and (iii) (from the privacy read: clear purpose, and prefer the out-of-process picker where possible) bear on Route B; I did not read that page myself.

## 8. Open questions (recommended default, deadline)

| Id | Question | Default | Needed by |
|---|---|---|---|
| MT-D2-Q1 | Is "Moments" a safe tab name given the glossary bans "moment" for a note and the NS-51 files use "photo moments"? One verb per J1 to J10. | Keep as a working label in docs; `content` proposes the parent word before any build. | Before content freeze |
| MT-D2-Q2 | Primer as a sheet (two taps before Apple's alert) or merge the primer into S1's inline card (one tap)? | Sheet: the Shown, Records, Never and Decline lines need room, and it reuses the reminder primer. Re-test on a device. | Before build |
| MT-D2-Q3 | Does "declined" mean Apple's Don't Allow (my reading), or a permanent "never ask" in our UI? | The former. No permanent in-app refusal. | Before build |
| MT-D2-Q4 | Route A floor: iOS 17.2 versus our 17.0. Hide the tab on 17.0 and 17.1 or degrade to real things only? | Degrade (the tab still earns its place without photos). | With the feasibility doc |
| MT-D2-Q5 | Verify the iPhone Settings path and labels for photo access on current iOS before any words describe it. | We do not describe it; "Open Settings" only. | Before content freeze |
| MT-D2-Q6 | Does the system picker still work under restricted? | Unknown. `mobile` checks on a device. | Device pass |
| MT-D2-Q7 | Does a tab that is not default still need the pinned bar at all? | Yes on a tap-arrival for the first view only (5.2), then never again. | With the IA ruling |
| MT-D2-Q8 | May the Settings page store and show "last looked" as a time? | Only if privacy allows; otherwise omit. | With privacy lead |
| MT-D2-Q9 | Reversals the founder owns where these screens touch them: K-02 (an ask on a tab, not in first run, is within the spirit only if the tab is not reached during first run), BL-1305 (usage string in a 1.x build), NS-51-R1 wording ("no other screen asks": the tab's own tap is the row), NS-51-R19 ("nothing appears on Home": kept). | Founder decides with the position ruling. | Founder |

## 9. Dependencies and reconciliation

- IA lead: tab position and bar size. These screens do not change with it.
- Product lead and the daily-return engine: this doc does not decide the reason to come back. It guarantees only that the tab is never empty and never counts. Nudges (push, email) use neutral text with no library signal; the same neutral tab view is what a nudge opens (5.2).
- Design concept doc (`docs/design/MOMENTS-TAB-CONCEPT-21nov.md`, not open when I looked): I assume the For you and Recent segment, the day card and a thumbnail grid. If it differs, the segment names and card shapes in 3.2 to 3.9 follow it; the permission logic does not.
- Feasibility doc (`docs/product/MOMENTS-TAB-FEASIBILITY-21nov.md`, not open when I looked): decides Route A or B. Reconcile section 3.11.
- Privacy and constitution doc (branch `docs/privacy-moments-tab-21nov`, head `6b57c94`): read; consistent with section 7.
- Market benchmark B1 (`wip/moments-b1`): not present. Reconcile by adding its example patterns to section 3.2 only if they pass the constitution.
- `content`: every draft string in 3.2 to 3.10, the usage string, the Toasts, the example lines.
- `mobile`: new `PermissionPrimer`, `LimitedAccessRow`, the segmented preset; library calls in one module (NS-51-R29).
- `design-systems`: contrast tests for the ask bar and tile colours; `glassFallback`.
- Founder: the reversals in MT-D2-Q9.

## 10. What is verified, unverified, or a guess

Verified this session (source read):
- `PHAuthorizationStatus` has the cases notDetermined, restricted ("The app isn't authorized to access the photo library, and the user can't grant such permission"), denied ("The user explicitly denied this app access"), authorized, and limited. https://developer.apple.com/documentation/photos/phauthorizationstatus.md
- `presentLimitedLibraryPicker(from:)` is available from iOS 14; it prompts the user to update their limited selection; it does nothing unless limited access is on; by default the system prompts once per app life cycle, which `PHPhotoLibraryPreventAutomaticLimitedAccessAlert` in Info.plist suppresses; changes trigger a `PHPhotoLibraryChangeObserver` update. https://developer.apple.com/documentation/photos/phphotolibrary/presentlimitedlibrarypicker(from:).md
- `JournalingSuggestionsPicker` is available from iOS 17.2; on first appearance a modal sheet introduces the concept; after a selection the system shares only the information of the chosen suggestion. https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker.md
- WWDC20 session 10641 page says the limited library lets people control which photos and videos an app can access, shows `presentLimitedLibraryPicker`, and points to the private picker as a way to avoid needing full access. It does not state the picker needs no permission, the automatic prompt, or the plist key. https://developer.apple.com/la/videos/play/wwdc2020/10641/
- Repo: the files in the inputs table, read on a depth-1 clone of `develop` on 21 Nov; the privacy read on its branch at `6b57c94`; the glossary row on "moment"; names in `tokens.ts` and the files in `apps/mobile/src/components/ui/`.

Unverified (not read this session): the labels on Apple's alert buttons; that iOS never re-shows the alert after a denial; `openSettingsURLString`; the causes of the restricted status; whether the system picker works under restriction; the iPhone Settings path and labels; the system's behaviour for new photos under limited access; whether iCloud-only originals give a local thumbnail; whether the Journaling picker needs a plist string; the plist key name is verified by Apple's page; App Store guideline numbers (second hand from the privacy read).

Guess or judgement: the five examples, the order of real cards, the pinned-bar rule, the sheet versus inline primer, the draft words. None of it was run on a phone or seen rendered; the wireframes are drawn in text and the layouts are not measured.
