# Moments tab T2: from value page to permission to first feed (PROPOSED, 21 Nov 2026)

Status: PROPOSED. Docs only. Nothing here is decided, built, or recorded in `DECISIONS.md`. Author: transition lead T2. Fictional family: Asha only. Public name: `{app}`. Child: `{child}`. Every word in quotes is intent for `content`, never final copy. A PROPOSED word does not ship.

The founder's screenshots were not opened and nothing from them is used. No real name, place or face is in this file.

## 1. Purpose and scope

This file specifies the moves between the states of the Moments tab that depend on photo access. It answers four questions a parent feels and an engineer must build:

1. What does the tab look like before we ask, while we ask, and after each answer?
2. What changes on screen at each state change, so no state is a dead end?
3. How do we guarantee we never ask again after a No, and still let a parent change their mind?
4. How does the first feed arrive (loading to collage), and how does Limited access get managed later?

In scope: the state machine, every transition, the loading-to-collage move, Limited "manage" re-entry, the denied tab, a change in Settings, return to the app, Reduce Motion variants, VoiceOver focus at each move.

Out of scope (other leads, read not duplicated): tab position and the daily-return reason (IA and product leads; concept section 3 and 4), card anatomy and the hand-off into Home's capture (concept sections 6 and 7), push and email (concept section 8, privacy section 10), the words themselves (`content`), the index and PhotoKit code (`mobile`, feasibility doc).

Route choice is still open (privacy section 2 and 3, feasibility section 1 and 2). Sections 3 to 9 specify Route B (our own on-device read, Limited honoured) because only Route B has permission states we can read and a feed we draw. Section 10 says what survives under Route A.

Reversals this file touches (the founder owns each, none is decided here): BL-1305 (a usage string and PhotoKit in a 1.x build; needed for any Route B state below), K-02 and NS-39-R2 (no ask in first run; this file keeps them), NS-51-R1 (no other screen asks; the ask moves onto this tab), NS-51-R19 ("no other screen of ours mentions it"; the denied line on the tab), NS-51-R8 (no list of older moments; Recent is a list).

## 2. Inputs read

Read this session (VERIFIED means I read the source in this session; URL or path given):

| Id | Source | Used for |
|---|---|---|
| I1 | PR #1267 `docs/product/MOMENTS-TAB-PRIVACY-AND-CONSTITUTION-21nov.md` (branch `docs/privacy-moments-tab-21nov`) | Route A versus B, ask rules (its section 7), counsel questions CQ-1 to CQ-15 |
| I2 | PR #1270 `docs/design/MOMENTS-TAB-CONCEPT-21nov.md` (branch `docs/design-moments-tab-concept-21nov`) | Day-one card, primer, state table (its section 9 and 11), tab position options |
| I3 | PR #1269 `docs/product/MOMENTS-TAB-FEASIBILITY-21nov.md` (branch `docs/mobile-moments-tab-feasibility-21nov`) | Five PhotoKit states and tab reaction (its section 4), no-permission blocks (its section 3), device spikes D1 to D4 |
| I4 | `docs/product/prd/27-photo-moments-and-media.md` on develop (`fb29507`): NS-51-R3, R4, R14, R18, R19, R21, R38 and the state table | The rules each requirement below cites |
| I5 | `docs/design/MOTION.md` on develop (read by search, not top to bottom: Reduce Motion section 4, sheets, card-to-page, lamp sections) | Reduce Motion is one mechanism, `fadeMs` 200 ms, sheets fade with no travel |
| I6 | `packages/design-tokens/src/tokens.ts` on develop (lines found by search): `reduceMotion: { type: 'fade', durationMs: 200 }`, `fadeMs: 200`, `enter: { dy: 8, durationMs: 280 }` | The only durations this file uses; none is typed in a screen |
| I7 | `docs/agents/COORDINATION.md` section 10 (heading and Shown, Records lines) | Door-line shape (Shown, Records, Never, Decline) |
| I8 | https://developer.apple.com/documentation/photokit/delivering-an-enhanced-privacy-experience-in-your-photos-app.md (fetched this session) | The five statuses, "won't prompt them again", Settings change, Limited picker, suppress prompt |
| I9 | `/home/claude/moments-brief.md` | Work rules, decisions of record |

Not read: `docs/design/DESIGN-LANGUAGE-V2-21nov.md` (its tokens are in open PR #1251, so I name no new token), `SOUND.md`, `BRAND.md` glossary, the founder's screenshots, Expo Router or React Native source, Apple's `PHAuthorizationStatus` enum page, `docs/legal/**`.

Where I disagree with a source: section 9, finding F1 (the concept's empty-state line versus NS-51-R18). I did not change any ruling.

## 3. The state machine

### 3.1 States

State is derived from the operating system's answer on every read. It is never cached as the truth (see MT-T2-R9).

| Id | Name | What the system says | What we know | Tab shows |
|---|---|---|---|---|
| P0 | Off | n/a | Feature flag off, remote pause, or a platform that has no feature (iPad, Android, Expo Go) | For you only. No value card, no ask, no switch. Not greyed, not mentioned |
| S1 | Fresh | `notDetermined` | We have not asked | Value card plus real cards. No switch |
| S2 | Primer | `notDetermined` | Our sheet is up | Sheet over the tab |
| S3 | System sheet | `notDetermined`, then answer | Apple's dialog is up; the app is inactive | The tab behind Apple's dialog, covered for the switcher (NS-51-R25) |
| S4 | Not now | `notDetermined` | The parent chose Not now on our sheet | Value card collapsed to one quiet row at the foot of For you |
| S5 | Allowed (full) | `authorized` | | Switch appears; Recent; sub-states 3.2 |
| S6 | Limited | `limited` | | As S5, plus the quiet foot row "Choose which pictures" |
| S7 | Denied | `denied` | | One calm line and "Open Settings" at the foot of For you. No switch, no Recent |
| S8 | Restricted | `restricted` | Parental controls or device management (my gloss; Apple's comment says only "restricted") | The same line with no "Open Settings" |
| M | Manage | `limited` | Apple's limited-library picker is up | The tab behind it |

Allowed sub-states (S5 and S6 only): L (loading the index), D (days found), E (allowed, no day found), F (index failed). Sub-state is independent of the permission state.

The five statuses and their meanings are from I8, VERIFIED. The calls that report Limited are `authorizationStatus(for:)` and `requestAuthorization(for:handler:)`; the older forms report `authorized` for Limited and must not be used (I8, VERIFIED).

### 3.2 Transition table

`->` is a move. "Parent" means a direct tap. "OS" means the operating system's answer. "Fg" means the app became active again.

| Id | From | Trigger | To | Notes |
|---|---|---|---|---|
| T1 | (cold launch) | Status read, `notDetermined`, flag on | S1 | No PhotoKit call other than the read. No ask at launch (I8, VERIFIED) |
| T2 | S1 | Parent taps the ask on the value card | S2 | The first and only call that can lead to a system dialog |
| T3 | S2 | Parent taps Not now (or swipes the sheet away) | S4 | Nothing is written except the answer and its time, on this phone |
| T4 | S2 | Parent taps Continue | S3 | The request call runs now |
| T5 | S3 | OS answers Allow all | S5 (sub-state L) | |
| T6 | S3 | OS answers Select Photos, then the parent picks | S6 (sub-state L) | Apple's own "Select Photos" interface appears inside the dialog (I8, VERIFIED) |
| T7 | S3 | OS answers Don't Allow | S7 | Apple will not prompt again (I8, VERIFIED) |
| T8 | S3 | OS answers at once with no dialog (the decision already exists) | S5, S6, S7 or S8 by status | Inferred from "remembers their choice and won't prompt them again" (I8); UNVERIFIED that the handler returns instantly. Cases: second account, restored phone, Settings changed before the tap (MT-T2-R10) |
| T9 | S4 | Parent taps the quiet row | S2 | A parent's own tap. Not a re-ask by us |
| T10 | S5 or S6 | Fg and status now `denied` | S7 | Section 6. Index removed (MT-T2-R11) |
| T11 | S7 | Fg and status now `authorized` or `limited` | S5 or S6, sub-state L | Parent went to Settings. No primer. Section 6 |
| T12 | S5 | Fg and status now `limited` | S6 | Days narrow to the selection, silently |
| T13 | S6 | Fg and status now `authorized` | S5 | Days may grow, silently |
| T14 | S1, S4 | Fg and status now `denied`, `limited` or `authorized` | by status | The parent changed it in Settings before ever tapping our ask |
| T15 | S6 | Parent taps "Choose which pictures" | M | Only from our own control (I8: suppress the automatic prompt, present it from an affordance) |
| T16 | M | Picker closes | S6 (sub-state L) | New selection returned; index rebuilt |
| T17 | S8 | Fg and status now `denied`, `authorized`, `limited` | by status | Restriction lifted. Rare; handled by the same re-read |
| T18 | any | Flag turned off or remote pause | P0 | Value card and ask disappear |

Transitions that do not exist, on purpose: S7 to S2 (there is no ask after a denial, only Settings); S3 to S3 (one dialog per ask); S4 to S2 by itself (no timer, no count of opens, no card that returns).

### 3.3 The diagram

```
                         cold launch (status read only)
                                     |
          +--------------------------+---------------------------+
          |                          |                           |
      notDetermined            authorized / limited          denied / restricted
          |                          |                           |
         S1 Fresh                S5 / S6  (L -> D | E | F)     S7 / S8
          | tap ask                  ^   ^                       |
          v                          |   | Fg, Settings          | Open Settings (S7 only)
         S2 Primer --Not now--> S4 --tap row--> S2               v
          | Continue                 |   |                 parent changes Settings
          v                          |   |                       |
         S3 System dialog -----------+---+---- Allow / Select --> back to S5 / S6
                   |
                   +--- Don't Allow ---------------------------> S7
```

## 4. How the screen changes at each state

Every state keeps For you whole. The cards that need no permission are always there: a prompt from the 111 written prompts, the child's month-age or birthday day, a day the parent typed, a ticked Day, a year-ago letter, pictures the parent already attached (concept section 4 and 5.1; feasibility section 3). That is why no state below is a dead end.

| State | Top of the tab | For you | Recent | Foot of For you |
|---|---|---|---|---|
| P0 | Title and job line | Real cards | Absent | Nothing |
| S1 | Title, job line | Value card (labelled "An example"), then real cards | Absent, no switch | Nothing |
| S2 | Same, sheet up | Same | Absent | Nothing |
| S3 | Same | Same, covered | Absent | Nothing |
| S4 | Title, job line | Real cards | Absent, no switch | One quiet row, "Show my photo days" (working) |
| S5, L | Switch appears | Real cards | Placeholder cards (3.4) | Nothing |
| S5, D | Switch, "Recent" selected once after a grant | Real cards, with one library card at most (concept 5.1) | Days newest first, at most the index cap | Nothing |
| S5, E | Switch, For you | Real cards | One quiet line, see F1 | Nothing |
| S6, L or D | As S5 | As S5 | As S5 | Quiet row "Choose which pictures" |
| S6, E | No switch | Real cards | Absent | Quiet row "Choose which pictures", no line saying there is nothing |
| S7 | Title, job line, no switch | Real cards, value card gone | Absent | "Photo days are off. You can change that in Settings." and "Open Settings" |
| S8 | Same | Same | Absent | The same line, no "Open Settings" |
| F (index failed) | As the permission state | Real cards | Absent with no message | Unchanged |

Rules for all of them:
- The tab never says which access is better (CL-046 through I3). Limited reads exactly like full.
- No count of any kind: not days, not pictures, not "3 more". Placeholders are a fixed frame, not a number (MT-T2-R14).
- The value card is the only thing taller than a third of the screen, and only in S1 and S2.

### 3.4 The value-page ask, in the parent's words (intent)

The primer sentences are in concept section 9.2 (Shown, Records, Never, Decline). This file does not repeat the sentences. It adds the transition lines (what happens on screen at each answer), which are in sections 5 and 6, and the Records default in MT-T2-R4.

## 5. Requirements

Each row: Given, When, Then, a test layer. Layers: U unit (pure state function), C component (render test with fakes), D device (real iPhone, spike), A accessibility audit (VoiceOver, AX5, Reduce Motion), R design review.

### 5.1 The ask and its answers

**MT-T2-R1 One state function.**
Given any status the system can report, and the flag, and our stored answer (yes, not now, none),
When the tab asks "what do I show",
Then one pure function returns exactly one of P0, S1, S4, S5, S6, S7, S8 (and a sub-state for S5 and S6), the five statuses map one to one, and an unknown future status maps to S7 behaviour (calm, no ask, no Settings link that promises anything).
Layer: U. Test names: `[MT-T2-R1] every status has a state`, `[MT-T2-R1] unknown status is quiet`.

**MT-T2-R2 The ask is only a tap.**
Given S1 or S4,
When the tab appears, comes forward, or the app launches,
Then no PhotoKit call other than the status read is made; the request call is reachable only through the Continue button on our sheet.
Layer: U (call recorder), D. Test names: `[MT-T2-R2] no request without Continue`. Source: I8, "Avoid making PhotoKit calls when your app first launches"; NS-51-R1.

**MT-T2-R3 The primer is a sheet over the tab, not a new screen.**
Given S1,
When the parent taps the ask,
Then our sheet rises on the standard sheet motion (under Reduce Motion it and its scrim fade over `fadeMs`, with no travel, I5), the value card stays visible behind it, focus moves to the sheet's first sentence, and the sheet has two buttons of equal weight: Continue and Not now.
Layer: C, A. Test names: `[MT-T2-R3] primer is a sheet`, `[MT-T2-R3] equal weight`. Source: concept 9.2, I5.

**MT-T2-R4 Door lines for the primer (PRIV-R21 shape, I7).**
Given the primer is shown,
When it appears,
Then its Shown, Records, Never and Decline lines are those of concept section 9.2 with this addition to Records: our own record is one value (yes, not now) and a time, kept on the phone only; no server table, no analytics event or property carries the answer or its time (default; `analytics` and `privacy` confirm, see Q5).
Never: reads a picture's pixels, place or people; sends anything off the phone; asks again by itself; lets the answer unlock or lock anything else in the app.
Decline: Not now changes nothing else in the app.
Layer: C (copy keys exist, hash of words shown is stable), U (no event emitted). Test names: `[MT-T2-R4] primer record is local`. Counsel reads the words (CQ-7).

**MT-T2-R5 Not now is calm and final until the parent says otherwise.**
Given the primer is open,
When the parent taps Not now, or dismisses the sheet by any gesture,
Then the sheet closes, the value card collapses to the one quiet row (the card shrinks and fades, section 7.1), focus lands on that row, no toast and no message appears, and nothing is scheduled to ask again.
Layer: C, A. Test names: `[MT-T2-R5] not now collapses card`, `[MT-T2-R5] no timer asks again`.

**MT-T2-R6 No re-ask after No.**
Given the parent chose Not now (S4) or the system answered Don't Allow (S7),
When any amount of time passes, the app is opened any number of times, or the tab is revisited,
Then we never show the primer or call the request on our own. In S4 the only way back to the primer is the parent's tap on the quiet row (T9). In S7 there is no way back to a system dialog at all, only the parent's own trip to Settings.
Layer: U (property test over 1000 random open sequences: primer count after Not now stays 0 without a row tap), D. Test names: `[MT-T2-R6] no ask without a tap`. Source: NS-51-R3, R18, R19; I8, "won't prompt them again".

**MT-T2-R7 Allow all and Select Photos reach the same first feed.**
Given S3,
When the system answers Allow all, or Select Photos then a selection,
Then the tab moves to S5 or S6 and shows the loading move (section 7.2). It never says which was chosen and never praises the choice.
Layer: C, D. Test names: `[MT-T2-R7] limited and full both work`. Source: NS-51-R3.

**MT-T2-R8 Don't Allow lands on a useful tab, not a wall.**
Given S3,
When the system answers Don't Allow,
Then the tab moves to S7: the value card is gone, For you is whole, the one calm line and "Open Settings" sit at the foot, focus lands on the first real card (not on the line), and nothing else on the tab or on Home changes.
Layer: C, A, D. Test names: `[MT-T2-R8] denied tab is whole`. Source: NS-51-R19.

**MT-T2-R9 State is read, never remembered.**
Given any moment the tab can draw,
When it computes its state,
Then it reads the system status afresh (on cold launch, on the app becoming active, on the tab coming into focus, and after the request handler returns), and our stored answer only decides between S1 and S4 when the status is `notDetermined`. A stored "yes" never overrides a status of `denied`.
Layer: U. Test names: `[MT-T2-R9] status wins over stored answer`.

**MT-T2-R10 An already-decided status skips the dialog without a dead end.**
Given the parent tapped Continue and the system had already decided (a second account, a restored phone, Settings changed earlier),
When the request handler returns at once,
Then the sheet closes and the tab moves straight to the state of that status with the same transition as if the dialog had been answered; no "nothing happened" state exists, and a Denied result shows the denied line the same way as R8.
Layer: C (fake returns instantly), D (spike D2). Test names: `[MT-T2-R10] no dialog still lands`. Source: NS-51-R23, R24; UNVERIFIED that the handler returns instantly (T8).

### 5.2 Changes in Settings and return to the app

**MT-T2-R11 Downgrade removes what we hold.**
Given S5 or S6 with a built index of dates and system identifiers,
When the status becomes `denied` or `restricted`,
Then the tab moves to S7 or S8, Recent and the switch disappear (section 7.5), and the on-phone index is cleared within the same foreground (default; `privacy` and `mobile` confirm, Q4). No message says "access was removed".
Layer: U (store empty), D. Test names: `[MT-T2-R11] downgrade clears index`. Source: constitution; NS-51-R6, R26.

**MT-T2-R12 Upgrade from Settings needs no second yes.**
Given S7 (or S1 or S4) and the parent turned access on in Settings,
When the app becomes active again,
Then the tab moves to S5 or S6 with the loading move, no primer is shown (the parent already said yes in the system's own place), the switch lands on Recent once, and the stored answer becomes "yes" with its time.
Layer: C, D. Test names: `[MT-T2-R12] settings grant skips primer`.

**MT-T2-R13 Re-read on every return, once.**
Given the app was in the background,
When it becomes active, or the Moments tab comes into focus,
Then the status is read once, compared with the last drawn state, and only a change causes a move; a read that finds the same state changes nothing on screen (no flash, no re-fade). Reads are coalesced to one per second at most.
Layer: U, C. Test names: `[MT-T2-R13] same status no redraw`. Note: whether iOS ends the app when a Photos setting changes is UNVERIFIED (I8 does not say). The design is safe either way: a relaunch reads status at launch (T1) and lands in the right state, and no state lives only in memory.

### 5.3 Loading to collage

**MT-T2-R14 The loading state is a held place, not a promise.**
Given S5 or S6 has just entered sub-state L,
When the index is building,
Then Recent shows a fixed set of plain paper placeholder cards (three, a frame count that carries no meaning and is never read aloud as a count), each with the real card's height at the current Dynamic Type size, no spinner, no shimmer, no progress, no word such as "scanning" or "looking", and the placeholders are hidden from VoiceOver.
Layer: C, A. Test names: `[MT-T2-R14] placeholder is plain`, `[MT-T2-R14] placeholder height follows type`. Source: concept section 11.

**MT-T2-R15 The tab works while it loads.**
Given sub-state L,
When the parent scrolls, switches to For you, taps a card capsule, or leaves,
Then everything works at once, the index runs off the main thread and never blocks the first frame of any tab (NS-51-R38), and leaving cancels nothing that must finish.
Layer: D (20,000-picture fixture on an iPhone SE 3), U. Test names: `[MT-T2-R15] load never blocks`.

**MT-T2-R16 Days arrive as one calm move.**
Given the index finished with days,
When the placeholders are replaced,
Then each placeholder becomes its real card in the same place (same height, so nothing below jumps), the card text is present from its first frame, and each picture tile fades from its paper box to the thumbnail over `fadeMs` as that thumbnail arrives, independently, with no stagger and no ordering effect. The first screenful may also rise by `enter.dy` over `enter.durationMs` (I6); later cards do not move. Nothing animates again on later visits; a returning parent sees the cards as they were, at once.
Layer: C (fake clock), R. Test names: `[MT-T2-R16] same place same height`, `[MT-T2-R16] later opens are still`. Reduce Motion: section 8.

**MT-T2-R17 A tile that cannot arrive stays a plain box.**
Given an original that is only in the cloud (NS-51-R21), or a thumbnail that fails,
When the tile is waiting,
Then it stays a plain paper box for good, no spinner, no retry control, no message, and the card keeps its date and button.
Layer: C, D (network off). Test names: `[MT-T2-R17] box stays box`. Source: NS-51-R21 (UNVERIFIED that a local thumbnail results with network off).

**MT-T2-R18 The first feed after a grant answers the ask.**
Given the parent just said yes (T5, T6, or R12) and days exist,
When the loading move completes,
Then "Recent" is selected once, the value card is gone (it collapsed with the sheet, section 7.1), focus moves to the first day card, and the selection afterwards follows the parent's own choice for the rest of that cold launch.
Layer: C, A. Test names: `[MT-T2-R18] recent selected once`. If no day was found, R19 applies and For you stays selected.

**MT-T2-R19 Nothing found is not a gap.**
Given allowed with full access and the index has no day,
When loading ends,
Then Recent shows one quiet line (words for `content`; concept working words "No days to show yet."), no suggestion to take photos, no count, and the switch stays. Given Limited access, no line appears at all (F1).
Layer: C. Test names: `[MT-T2-R19] empty full has one line`, `[MT-T2-R19] empty limited is silent`. Source: NS-51-R18 versus concept section 11, see F1.

**MT-T2-R20 A failed index leaves no trace.**
Given the index fails,
When the failure is known,
Then the placeholders fade out over `fadeMs`, the switch and Recent are removed, the selection falls back to For you, focus is not moved, no message is shown, and the next foreground tries once more silently.
Layer: C, U. Test names: `[MT-T2-R20] failure is silent`. Source: NS-51 section 6.

**MT-T2-R21 A refresh never moves things under a finger.**
Given days are showing and a later read finds changes (new pictures, a Limited selection change),
When the result arrives,
Then it is applied only when the tab is next shown, or when the list is at its top and not being touched; cards that disappeared drop without a word (NS-51-R22); new cards are present without animation unless the list is empty before it.
Layer: C. Test names: `[MT-T2-R21] no reorder under scroll`.

### 5.4 Limited access and manage

**MT-T2-R22 Manage is one quiet row, on the tab only.**
Given S6,
When the tab shows For you or Recent,
Then one quiet row "Choose which pictures" (working) sits at the foot, 44 pt tall at least, and opens Apple's limited-library picker only on the parent's tap. The automatic alert is suppressed with the Info.plist key Apple describes (I8 says to add a key and value; its name is in an image there, so UNVERIFIED by me; I3 reads the name `PHPhotoLibraryPreventAutomaticLimitedAccessAlert` from the picker's API page, which I did not open). The row never appears in S5, S7 or S8.
Layer: C, D (no automatic alert). Test names: `[MT-T2-R22] manage row only when limited`, `[MT-T2-R22] no automatic alert`. Source: NS-51-R4.

**MT-T2-R23 Manage returns to the same place.**
Given the picker is up (M),
When it closes,
Then focus returns to the manage row, the index rebuilds off the main thread, any change is applied by R21, and no message says what changed. A picker that closes with no change changes nothing. The picker's callback (iOS 15 and later) returns the identifiers of the new selection and works only in Limited mode (I8, VERIFIED); we use it only to know a change happened, and drop the identifiers after the rebuild.
Layer: C, D. Test names: `[MT-T2-R23] manage returns focus`.

**MT-T2-R24 Limited and a tiny selection never nag.**
Given S6 with an empty or small selection,
When the tab is shown at any time,
Then no prompt, banner, or card asks for more pictures; the manage row is the only door, and it stays quiet.
Layer: D. Test names: `[MT-T2-R24] limited never nags`. Source: NS-51-R18.

**MT-T2-R25 Pictures taken after a Limited choice.**
Given S6,
When new pictures are taken after the parent made a selection,
Then the tab does not claim they will or will not show; whether a fetch sees them is UNVERIFIED (BL-871, spike D4). The design shows only what the fetch returns.
Layer: D. Test names: `[MT-T2-R25] limited new pictures` (spike).

### 5.5 Denied and restricted

**MT-T2-R26 The calm line.**
Given S7,
When the tab shows,
Then the foot of For you holds one line (words for `content`; concept working words "Photo days are off. You can change that in Settings.") and one control "Open Settings" and nothing else: no image, no second button, no coloured banner, no badge on the tab, nothing on Home. The control opens the app's own Settings page. Given S8, the same line with no control (the parent cannot change it).
Layer: C, A. Test names: `[MT-T2-R26] denied line is one line`, `[MT-T2-R26] restricted has no settings link`. Source: NS-51-R19. Whether the OS opens the right page from React Native `Linking.openSettings` is UNVERIFIED (not read this session).

**MT-T2-R27 The denied tab is still worth opening.**
Given S7 or S8,
When a parent opens the tab,
Then For you holds at least one card at all times: a prompt from the 111 written prompts is always available, and so a tap on its capsule reaches Home's Ready with that prompt, no permission involved. The deck follows concept section 5.1 order: typed occasions, ticked Days, month-age or birthday, a year ago, then prompts. A card whose source is empty is absent, not greyed.
Layer: C. Test names: `[MT-T2-R27] denied deck never empty`.

**MT-T2-R28 A picture without permission is still one tap away.**
Given S1, S4, S7 or S8,
When the parent wants to use a picture,
Then they use Home's existing start-from-a-picture path, and each card's hand-off to Ready can attach a picture through the system's out-of-process picker, which needs no authorisation (I8, VERIFIED: the picker "doesn't need to explicitly authorize your app to select photos"). The tab adds no control for this in S7 (NS-51-R19: "and nothing else").
Layer: C, D. Test names: `[MT-T2-R28] picker path works when denied`. Source: I8, I1 section 7 item 4.

**MT-T2-R29 Denied reverses cleanly.**
Given S7 and the parent switched access on in Settings,
When the app becomes active,
Then R12 applies: the calm line fades out, the switch appears, Recent loads, no primer. Given S7 and the parent switched Limited on, the same with S6.
Layer: C, D. Test names: `[MT-T2-R29] denied to allowed`.

### 5.6 Privacy and cover

**MT-T2-R30 Covered while the system asks and in the switcher.**
Given S3 or any state with day cards showing,
When the app goes inactive (the system dialog, the app switcher, App lock),
Then every picture tile is an opaque paper box before the snapshot, with or without App lock (NS-51-R25), and on return the tiles come back with no animation.
Layer: C, D. Test names: `[MT-T2-R30] tiles cover on inactive`.

**MT-T2-R31 Nothing leaves the phone in any transition.**
Given any state or move above,
When a network fake and a log scan run through the whole machine (T1 to T18),
Then zero requests, and no photo, filename, album, date, place, count, or access state appears in any request, log, crash report or analytics event.
Layer: U, D. Test names: `[MT-T2-R31] machine is silent`. Source: NS-51-R26, privacy rules; I1 section 7 label text.

## 6. What happens when it changes in Settings, step by step

Ordered, with what a parent sees. All reads happen at the app becoming active (R13).

| Change in Settings | Our read | Tab move | What the parent sees |
|---|---|---|---|
| S7 Denied to Allowed all | `authorized` | T11 to S5, L | Line fades out, switch appears, placeholders, then days; Recent selected once |
| S7 Denied to Limited | `limited` | T11 to S6, L | Same, plus the manage row |
| S5 to S6 (parent narrowed) | `limited` | T12 | Days narrow without a word; manage row appears; no animation of the removed days (R21) |
| S6 to S5 (parent widened) | `authorized` | T13 | Days may grow; manage row goes with a 200 ms fade |
| S5 or S6 to S7 | `denied` | T10 | Switch and Recent fade out over `fadeMs`; the calm line fades in; the selection falls to For you; index cleared (R11) |
| S1 or S4 to anything | by status | T14 | As if answered; no primer; R12 |
| S8 lifted | by status | T17 | As above |
| Setting changed while the app was closed | read at launch | T1 | The right state from the first frame; no move |

While the app is away nothing is held that can mislead: the tab never draws a state from memory alone (R9). The value card shows again, once, only on a restored or new phone where the feature is off (NS-51-R23, concept section 11), and never because a status changed.

## 7. The moves, in detail

Durations are tokens only: `fadeMs` (200 ms) and `enter` (8 pt, 280 ms) from I6; spring names come from the standard in I5. No screen types a number.

### 7.1 Value card to quiet row, or to feed

- To quiet row (Not now): the sheet closes; the value card's height eases to the row's on the standard layout spring while its content fades over `fadeMs`; the row is in place at the end; focus lands on it.
- To feed (a grant): the same collapse, then the switch appears with a fade over `fadeMs`, then L (section 7.2). The card never stays: after a grant the ask is answered and the card is gone from For you (not collapsed to a row).
- To denied line: the card disappears with a fade over `fadeMs`; the calm line fades in at the foot.
- The three glass surfaces rule holds: the tab bar, the switch and nothing else (concept 5). Under Reduce Transparency and Increase Contrast the switch uses the solid fallback; the line and rows are paper, never glass.

### 7.2 Loading to collage

```
t0   grant answered, sheet closed, switch faded in
t0   Recent selected, placeholders (3 paper cards, correct height) in place, no movement
t0+  index runs off the main thread (NS-51-R38); For you is live and tappable
t1   index ready: placeholders become cards in place (text first frame, same height)
t1+  each tile: paper box, then thumbnail fade over fadeMs, per tile, as it arrives
```

Why per tile and not the whole collage at once: it needs no coordination state and a slow tile never holds a card back. The cost is a collage that fills in unevenly on a slow phone. The alternative (reveal each collage when all four tiles are ready) is calmer to watch and needs a timeout; device review picks (Q3).

### 7.3 First feed versus later opens

Only the first load after a grant (and after a restore, NS-51-R23) animates. A tab opened with a stored index shows its cards at once and refreshes in the background by R21. Nothing replays.

### 7.4 VoiceOver focus at each move

| Move | Focus lands on | Announcement |
|---|---|---|
| Open primer | First sentence | None extra |
| Not now | The quiet row | None |
| Grant, days found | First day card | None extra (the card reads its date and its words) |
| Grant, nothing found | First real card in For you | None |
| Don't Allow | First real card (not the line) | None |
| Settings change while on the tab | Nothing moves; the changed region is a polite update | One polite line only on a grant from Settings: the first day card is announced when it appears; no announcement on a downgrade |
| Manage closes | The manage row | None |
| Index failed | Not moved | None |

Rationale: the parent who just allowed, denied or declined must be able to carry on from where they are. A silent focus move to the first card is quieter than a spoken "access granted". Where the plain state is a word (the denied line) VoiceOver reads it in order, last on For you, as a normal row. VoiceOver order top to bottom: title, job line, switch, cards, foot row.

### 7.5 Dynamic Type to AX5, Bold Text, both themes

- The value card, the primer, the denied line and every foot row grow; none truncates; buttons wrap and stay at least 44 pt.
- Dates on cards wrap to as many lines as they need. Placeholders use the same line height as the live card (R14) so the swap does not shift anything at AX5.
- State is never carried by colour alone: the denied line is words, the manage row is a labelled row, Limited has no icon or tint of its own.
- Both themes: only paper tokens and the solid fallback; no new colour (concept section 0; token names settle when #1251 lands). Contrast has not been computed (no device, no measurement in this session).

## 8. Reduce Motion, Reduce Transparency, Increase Contrast

Reduce Motion in this app is one mechanism: every custom move becomes one `fadeMs` fade; nothing slides; springs are not replaced by jumps (I5, section 4 and "Reduce Motion" rule 6).

| Move | Normal | Reduce Motion |
|---|---|---|
| Primer sheet open and close | Rises and falls on the standard sheet spring | Sheet and scrim fade over `fadeMs`, no travel |
| Value card to quiet row | Height eases, content fades | Height is instant, content fades over `fadeMs` (the height change is the one jump, and it is under a covered fade, so nothing is read mid-move) |
| Value card to denied line | Fade | Same fade |
| Switch appears or disappears | Fade over `fadeMs` | Same fade |
| Placeholder to card | Card in place; the first screenful rises by `enter.dy` | Card in place; fade over `fadeMs`; no rise |
| Tile to thumbnail | Fade over `fadeMs` | Same fade (a fade is the Reduce Motion form) |
| Cards leaving (downgrade, Limited narrowed, index failed) | Fade over `fadeMs` | Same fade |
| Foot row appears | Fade over `fadeMs` | Same fade |
| Manage picker | System presentation | System presentation (it follows the system's reduced transition) |

Reduce Transparency: the switch and the sheet scrim use the solid fallback; nothing else is glass. Increase Contrast: hairlines on cards and rows use the stronger token; the placeholders get the same hairline so they are visible as shapes. Bold Text: no layout change beyond wrapping.

The setting can change while the tab is up: the tab subscribes to the reduce-motion change event through the one hook (I5, M16), and a move in flight finishes as a fade.

Sound and haptics: none for any move in this file. I did not read `SOUND.md`; if it assigns one to a permission answer, it follows that file.

## 9. Edge and unhappy paths

| Case | Behaviour |
|---|---|
| Tap the ask twice fast | One primer; the second tap is ignored while S2 or S3 |
| App backgrounded with the primer open | The sheet stays; the tab re-reads status on return (R13) |
| App backgrounded while Apple's dialog is up | Apple owns it; on return we read the status |
| A call returns `limited` while the older no-argument form is used by mistake | Test `[MT-T2-R1]` fails: only the `for:` forms are allowed (I8, VERIFIED) |
| Account B on the same phone | Starts off, never reads A's index (NS-51-R24); value card shows; if the system already decided, T8 |
| Restored or new phone | Feature off, value card once, no ask by itself (NS-51-R23); if the system already decided, T8 |
| Large library (20,000) | Placeholders stay until the index is ready; no timeout message; For you is live; cap of the index (30 days, 90 days back, NS-51-R6, R7) |
| Low Power Mode or critical storage | Index refresh skipped (NS-51-R38); the cards already held stay; nothing says why |
| Offline | Identical; all on the phone; cloud-only originals are plain boxes (R17) |
| Parent rotates, or Split View on a large phone | Cards reflow; placeholders keep their height; no state change |
| Dark mode switched mid-move | Paper tokens swap; the move completes |
| VoiceOver off and on mid-move | Focus rules apply to the next move |
| Parent turns the feature off in Me | P0 at once; index cleared; no message |
| App lock on | Tiles cover (R30); the tab content is behind the lock |
| Pictures deleted after indexing | The card or tile drops without a word (NS-51-R22) |
| The status read throws | Treat as S7 behaviour (quiet, no ask); retry on the next foreground |

## 10. Route A (Apple's journaling suggestions picker) in the same machine

Route A has no permission status we can read (I1 section 2, A1, A5: "You don't need to ask for additional authorization"). So most of the machine above does not exist under Route A.

| Route B state | Under Route A |
|---|---|
| S1, S4 | One capsule on the tab opens Apple's sheet. Apple shows its own once-per-device consent sheet on first use (I1, A3); we do not draw or time it. There is no primer of ours, no "Not now" state, and so no quiet row |
| S5, S6, loading to collage | Absent. The collage is inside Apple's sheet (we cannot restyle it). After a pick the parent's chosen pictures go to Home's Ready (R28's path). Nothing is indexed, so nothing is loaded in the tab |
| S7, S8 | Not readable. If the parent turned suggestions off in Apple's settings (I1, A5) we cannot tell. The sheet shows nothing for them; whether the capsule can know is UNVERIFIED (spike D1). Until known, the capsule always opens and the tab does not claim a state |
| Manage | Absent: Apple's settings own categories |
| The For you deck | Unchanged. It never needed permission |

If both routes ship, the parent could meet our primer, Apple's iOS dialog and Apple's journaling consent in one session. That is CQ-8; my default follows it: ship Route B first and show one capsule per route only after counsel reads it. This file does not attempt a combined machine.

## 11. Constitution, privacy and accessibility checks

| Check | Result |
|---|---|
| Machine adds no meaning | Pass. No title, caption, place, person or "best" appears in any state. Date lines are the phone's own date |
| Nothing leaves the phone | Pass if MT-T2-R31 stays green. No state, answer, date or identifier in any event |
| Permission is a direct tap | Pass (R2), and the system's own answer is never second-guessed (R6) |
| App Review 5.1.1(iv) and 5.1.2(i) (I1 A9, read there, not re-read by me) | A fallback exists in every state (R27, R28); nothing is gated behind yes. Counsel confirms (CQ-7) |
| No streak, count, badge, guilt | Pass. No number on the switch or tab; placeholders carry no count; no "you missed" line in any state |
| No nagging | Pass by R5, R6, R24 |
| Never a dead end | Pass: every state has a tappable card; the denied and restricted states hold real cards |
| Content rules (no em or en dashes, curly quotes, ellipsis characters, emoji, model names) | Checked by search on this file before commit |
| Internal terms | None used in any quoted parent line |
| Never gender the child | `{child}` only |
| WCAG 2.2 AA | Intent only; no device test this session. Targets 44 pt; focus order stated; Reduce Motion, Reduce Transparency, Increase Contrast and Bold Text covered; AX5 never truncates; colour never the only signal |

## 12. Findings and open questions

Findings (each a place where two sources disagree, or where I found a risk):

- **F1. NS-51-R18 versus the concept's empty line.** R18 says a small or empty Limited selection shows "no prompt or message". Concept section 11 shows "No days to show yet." for allowed-no-day and Limited. I reconcile by a split: full access with no day gets the one quiet line, Limited gets none (R19). `product` and `content` confirm.
- **F2. Two different Noes.** Our Not now (parent-initiated way back through a quiet row) and Apple's Don't Allow (no way back except Settings) must not be mixed up in code or copy. The quiet row is not a re-ask; the parent's tap is the ask each time.
- **F3. The system dialog may never appear.** On a second account or a restored phone, or after a Settings change, the request returns a standing answer. The primer to loading or denied move must work with no dialog (R10). UNVERIFIED that the handler returns instantly; spike D2.
- **F4. Downgrade handling is a privacy decision nobody has made.** Clearing the index on a lost permission is my default (R11). The index holds dates and identifiers only (NS-51-R5), so the risk is small, but a revoked permission with a kept index is hard to explain. `privacy` and `mobile` decide.
- **F5. Limited needs the usage string and the Info.plist key.** Every Limited and Manage state depends on BL-1305 being reversed and on a key whose name I did not read from Apple's own page this session (I8 shows it only as an image). The key is not a decision, it is a consequence.

Open questions, each with a recommended default and a deadline (the deadline is the day the Moments build plan is frozen; I do not know that date, so I name the decision gate instead):

| Id | Question | Recommended default | Owner | Needed before |
|---|---|---|---|---|
| Q1 | Select Recent once after a grant, or leave For you selected? | Recent once (R18); the parent just asked for days | `design`, `product` | Moments design freeze |
| Q2 | Is the primer one screen or two (value, then ask)? | One sheet | `design` | Moments design freeze |
| Q3 | Per-tile fade or whole-collage reveal? | Per tile (7.2) | `design`, device review | First device build |
| Q4 | Clear the index on downgrade? | Yes (R11) | `privacy`, `mobile` | Before any Route B build |
| Q5 | May any event say a parent answered the ask? | No event (R4) | `analytics`, `privacy` | Event allowlist review |
| Q6 | A quiet link from the denied tab to the Days page in Me (a typed occasion is a no-permission card source)? | Yes, a link row, not a copy (J7), after J4 and wheel owners agree | `product` | Moments design freeze |
| Q7 | Placeholder count (three) a design choice with no meaning? | Three, fixed; never announced | `design` | First device build |
| Q8 | Which route ships first? | Route B first (CQ-8) | Founder | Before any build |

## 13. Dependencies

- Founder owns the reversals of section 1 (BL-1305, NS-51-R1, R8, R19; K-02 stays).
- `mobile`: one pure state function (R1), status reads with the `for:` forms, the index store (BL-877) and its off-main-thread build, `Linking`-based Settings control, the cover for the switcher (NS-51-R25).
- `design-systems`: placeholder card, quiet row, calm line and sheet components built on existing tokens; no token added by this file.
- `content`: every quoted line; the parent word for the tab.
- `privacy`, `legal`: R4, R11, R31 and CQ-1, CQ-7, CQ-8.
- `analytics`: Q5.
- Device spikes: D1 (Route A), D2 (statuses and Settings changes), D4 (Limited and new pictures).
- Open PRs read at their head: #1267, #1269, #1270. #1264 not read in full; where it differs the concept and privacy docs win until it is reworked.

## 14. VERIFIED, UNVERIFIED, guess

VERIFIED (read this session):
- The five statuses and their meanings; "remembers their choice and won't prompt them again"; the user can change it in Settings at any time; the older no-argument calls report `authorized` for Limited; Limited cannot fetch user albums; the system prompts once per app life cycle unless suppressed with an Info.plist key; the limited-library picker is presented from the app's own affordance, with an iOS 15 callback returning identifiers, working only in Limited mode; change-observer API exists; the out-of-process picker needs no authorisation; a missing usage description crashes the app; avoid PhotoKit calls at first launch. Source: I8.
- `fadeMs` 200, `reduceMotion` fade 200 ms, `enter` 8 pt and 280 ms exist in `packages/design-tokens/src/tokens.ts` (I6, by search). The Reduce Motion rules quoted from `docs/design/MOTION.md` (I5, by search).
- The NS-51 rows quoted (I4) and the Route A and B facts quoted from #1267, #1269, #1270 are as those documents state them at their heads; I did not re-open Apple pages other than I8.

UNVERIFIED:
- That a handler returns instantly with a standing decision (T8); that iOS ends or keeps the app when a Photos setting changes; what `Linking.openSettings` opens; the Info.plist key's exact name (read by #1269 from another Apple page, not by me).
- Whether Route A exposes any state; whether a Limited fetch sees new pictures (BL-871); whether a cloud-only original yields a local thumbnail with network off (NS-51-R21).
- Contrast ratios, hit areas and Dynamic Type layout: not measured.
- Whether `SOUND.md` assigns a sound or haptic to a permission answer.

Guess (labelled): three placeholder cards; per-tile reveal; Recent selected once after a grant; clearing the index on downgrade; one read per second at most.

Not done: no code, tests, tokens, CLAIMS or BACKLOG edits; no device run; no PR; no read of the founder's screenshots; no other file under `docs/` written.
