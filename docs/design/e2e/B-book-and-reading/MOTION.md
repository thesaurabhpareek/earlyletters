# Area B: Book and reading. Motion

Status: DRAFT v2, 20 Nov 2026 (v1 the same day, re-keyed after DESIGN.md v1 and the design system v2 `docs/design/system/MOTION.md` landed). Author: the area B motion lead (one Claude session), under `docs/design/e2e/BRIEF.md`. Docs only; nothing here was run on a phone. Companion: `MOTION-PROTOTYPE.html` in this folder plays every moment below, with Reduce Motion, Reduce Transparency, dark, a slow-motion study switch, and a switch between today's `standard` spring and v2's.

**How this file is keyed.** Each moment has a stable id `B-Mnn` (ids from v1 are kept; DESIGN.md and WORDS.md already cite them). Each names (1) the screen and state ids of `DESIGN.md` in this folder (`B-Snn.<state>`, the names in its section 2 and 4, with its section 10 aliases), and (2) the design system v2 primitive (`m.*`, v2 MOTION section 4) and navigation row (`T-*`, v2 section 6). v2 is the standard: where it and this file differ, v2 wins and this file changed (section 12 lists each change from v1). Where this area needs a move v2 does not name, it is proposed to v2 in section 11, not defined here.

**Sources, in order** (BRIEF section 1): the locked cards NS-01, NS-02, NS-06 Parts A and B, NS-21, NS-22, NS-23, NS-24, NS-29, NS-33, NS-34, NS-37; `14-test-plan.md` (J-N15: no moving loop under Reduce Motion); design system v2 `docs/design/system/MOTION.md`, `FOUNDATIONS.md` (lamp and material accessibility rows), `tokens.v2.json` (motion rulings of 20 Nov); house `docs/design/MOTION.md` v0.2 where v2 keeps it; `SOUND.md`; `packages/design-tokens/src/tokens.ts`; the app as built (`app/(tabs)/book.tsx`, `app/letter/[id].tsx`, `app/read-together.tsx`, `components/motion/*`, `components/book/*`, `components/tonight/resurfaced-card.tsx`, `components/ui/choice-group.tsx`, `lib/transitions.logic.ts`, `lib/haptics.shared.ts`). Tags: [B] built today (file named), [C] the card says so (row named), [V2] the v2 standard says so, [P] PROPOSED here.

## 1. The rules for this area

1. **Reading is still.** The Book, the letter page and Read together are for reading. Motion only says where you went (a hand-off) or that something you did took (a value or a row changed in place). Nothing moves while a person reads. A letter's words never animate on their own: they move only as one block with their surface (`m.zoom` carry, `m.pageTurn`, scrolling) [V2 section 11].
2. **Native first** [V2 principle 9]. Tabs (T-TAB), tab bar minimise (T-MIN), sheets (T-SHEET), menus (T-MENU), confirmations (T-ALERT), the date picker, the keyboard and the system toggle are the system's, with their Liquid Glass behaviour. Our own moves here: `m.zoom` (T-ZOOM), `m.pageTurn` (T-PAGE), `m.cover` (T-COVER), the list swap (proposed `m.list.swap`, section 11), `m.mark`, and the small primitives.
3. **Calm and quick.** Every move we draw is 300 ms or less [V2 section 5]. The only longer moves in this area are v2's named exceptions (`m.enter.group`, `m.zoom`, `m.mark`), section 7.
4. **Controls never animate in** [V2 principle 6]. A control that appears (Find, a lens option, a row in "This letter", Not today) is at full strength on its first frame.
5. **No ceremony.** No celebration, reveal, counter, countdown, progress fill, badge, pulse, shimmer, skeleton, stamp, seal, envelope or lock animation. A sealed letter opening on its day moves nothing (NS-06-B6, B15) [C]; a first marked moves nothing beyond the system toggle (NS-06-A15) [C].
6. **Glass materialises; it never fades** [V2 section 7 rule 1]. Glass in this area (the header control cluster, the inline bar, the Find bar, the letter page's top bar, Read together's top bar and turn buttons, toasts, sheets; DESIGN section 4a) appears and leaves by its glass style ('none' to 'regular' over `glass.styleS` 0.25 s), never by opacity. Under Reduce Transparency each is a solid surface and uses `m.fade`.
7. **Reduce Motion** [V2 section 8]. Movement goes; opacity and glass style stay. Every moment names its substitute. No screen in this area runs a loop under Reduce Motion (NS-33-R5, J-N15), and none runs one without it either (the lamp is still; Read together's pool is still).
8. **Haptics mark an outcome the person caused** [V2 section 9]. Navigation, scrolling, sheets, menus, toasts, page turns, the seal opening and system states are silent. System controls (toggle, date picker) play their own; we never add ours on top.
9. **Sound** is the opt-in Paper sounds layer only (SOUND.md, off by default): `page_turn` in Read together on a tap or swipe turn while nothing plays. No other sound in this area.

## 2. Values used (today's `tokens.motion`, and v2's where it changes them)

| Name (v2) | Today (`tokens.ts`) | v2 (section 13a) | Used here for |
|---|---|---|---|
| `spring.snappy` | k 520, c 46 (response 0.28 s, ratio 1.0) | same | `m.tap`, `m.select` indicator, swipe settle-back, `m.toast` rise |
| `spring.standard` | k 260, c 30 (0.40 s, 0.92) | k 439, c 38.5 (0.30 s, 0.92), RULED 20 Nov (ruling 26) | `m.zoom` growth, `m.move`, `m.pageTurn` arrival, `m.sheet.own` |
| `spring.gentle` | k 90, c 18 | retired | not used (the Book header settle is retired) |
| `easing.standard` | `[0.2, 0, 0, 1]` | same | `m.enter`, `m.swap`, timed fades that are not screens of words |
| `easing.exit` | none | `[0.3, 0, 1, 1]` (UNVERIFIED in v2) | `m.exit` |
| `enter` | dy 8, 280 ms; stagger 30 ms, first 6 | same | `m.enter`, `m.enter.group` |
| `exitMs` | 160 | same | `m.exit`, the page turn's leaving page |
| `fadeMs` | 200 | same | `m.fade`; every Reduce Motion substitute |
| `swapMs` | 150 | same | `m.swap`; the Find layer (NS-02 design input) |
| `handOff` | `HAND_OFF` 0.35; card-to-page hand-off 140 / 80 / 120 | same | `m.fade` between screens of words |
| `glass.styleS` | none | 0.25 s | `m.glass`, `m.toast` |
| `cover.dissolveMs` | `route.dissolveMs` 280 | same, renamed | `m.cover` (Read together, the picture viewer) |
| `zoom.*` | `cardToPage` contentFrom 0.6, holdMs 136, clearPt 24; veil `lamp.leaveMs` 160 in, `lamp.returnMs` 280 out | `zoom.*` same values, cap 600 | `m.zoom` |
| `markMs` | `newMarkMs` 1600 | same, renamed | `m.mark` |
| `pageTurn.dx`, `swipe` | 24; quarter width or 600 pt/s | same | `m.pageTurn` |
| `tap` | `press` 0.97, cards 0.98 | same plus `rmMs` 90 | `m.tap` |
| `lamp.returnMs` | 280 | kept (Karma ruling, 20 Nov: every first-run lamp change uses it) | lamp changes in this area (section 11 P3) |

Spring check (envelope `exp(-c t / 2m)`): v2 `standard` leaves 1 percent of a move at about 240 ms; today's leaves 1 percent at about 300 ms. Both are inside the cap; `m.zoom` is a named exception up to 600 ms to settled either way.

## 3. The Book (B-S01) and its header, lenses and sheets (B-S02 to B-S07)

| Id | Design ids | Trigger | v2 | What moves | Timing | Reduce Motion | Haptic | Never |
|---|---|---|---|---|---|---|---|---|
| B-M01 | B-S01.default, first show this session (alias `.firstView`) | The Book is first shown this session, not on a Keep landing | `m.enter.group` | The header renders complete. The first 6 cards enter: opacity 0 to 1, y 8 to 0, 30 ms apart; card 7 on arrives with card 6 | 280 ms each, `easing.standard`; last at 430 ms | One 200 ms fade of the first cards, no travel, no stagger | none | The header does not settle (v1's `gentle` settle, built `Settle` in `book.tsx`, is retired by v2 section 13); controls are hittable from frame 1 |
| B-M02 | B-S01.default, every later view | Tab return; Back from a letter, Find, Read together or Me | T-RESUME, T-TAB | Nothing in the Book. If the lamp is on, it settles from the last tab's light over `lamp.returnMs` | lamp 280 | lamp at its level | none | Cards never re-enter; the list never scrolls by itself |
| B-M03 | B-S01.default, `.many`; scrolling | The parent scrolls | T-MIN, `m.glass`, `m.swap` [P for the bar] | The list under the finger (native scroll). The tab bar minimises on scroll down and re-expands on scroll up (system, Book only). When the band's glass control cluster has scrolled under the bar (one scroll offset, measured at layout), the band's glass cluster goes to style 'none' and the inline bar's glass to 'regular' in one `m.glass`; the bar's title and compact month arrive with `m.swap`. Scrolling back reverses it at the same point | glass 0.25 s; words 150 ms | Glass style change kept, no travel (v2 section 8); words 150. Reduce Transparency: the bar is solid and fades over 200 ms at the same point | none | No scroll-linked opacity on glass (supersedes the built `barStyle` fade, which v2 section 7 rule 1 forbids on glass); never two control clusters at once (DESIGN 4a); no parallax, no scroll-to-top animation |
| B-M04 | B-S04.default, B-S01.many with pictures | A list copy finishes decoding after its card is on screen | `m.fade` (picture arriving in a reserved box) | The thumbnail only, opacity 0 to 1. A copy decoded before the card mounts shows at once | 200 ms, `easing.standard` | Shows at once (NS-37 Reduce Motion row "No fade-in on thumbnails") | none | No shimmer, blur-up, spinner or pulse; the box is reserved at mount, so the words never move |
| B-M05 | B-S04.thumbMissing (alias `.thumbPending`) | A missing list copy is regenerated in the background | `m.instant` at next mount | Nothing while the card is on screen; the thumbnail is there the next time the card mounts | 0 | same | none | Never pops into a card being read; the card's height never changes under the eye (G3) |
| B-M06 | B-S01.default after Keep (alias `.arrived`) | T-KEEP lands on the Book | T-KEEP, `m.mark` | The Book is already on the new letter (no insert, no scroll animation); the `accentSoft` tint behind its words fades | `markMs` 1600, `easing.standard` | Tint shown static, then the same fade | none here (`H-success` played at commit in Review, area A) | No badge, no count, no scroll |
| B-M07 | B-S01.twoParents | The other parent's letter shown on this phone for the first time | `m.mark` [B `firstSeen`; P to v2, section 11 P4] | The same tint, once per letter (ids only) | 1600 | static then fades | none | No "new" label, dot or count |
| B-M08 | B-S01.twoBooks | The switcher picks the other book | `m.fade` | The Book's content cross-fades to the other book; Find closes and clears | 200 ms | same | none as built (`child-switcher.tsx` plays none); if v2's I6 switcher is a choice group, `H-select` from the component | No slide between books |
| B-M09 | B-S02.default | "More for this book" | T-MENU (target, `Stack.Toolbar.Menu`); interim T-SHEET with `m.sheet.own` (DESIGN B-S02) | Target: the native menu pops out of the glass button. Interim: the sheet rises, the scrim fades in | system; interim rise `spring.standard`, scrim 200 | system; interim: glass style and scrim fade 200, no travel | none (opening is navigation) | No custom menu animation on the target |
| B-M10 | B-S02.quieted | Quiet this book, or Turn Quiet off | `m.toast` | The menu (or sheet) closes; nothing in the Book moves; the toast ("Quiet" line, WORDS) materialises and rises 8 pt | toast: glass 0.25 s, rise `spring.snappy`, words `m.enter` | glass style only, no rise; RT: solid toast fades 200 | none (a setting, v2 section 9) | No dimming, no change of light, nothing that marks the book as different |
| B-M11 | B-S02, Hide this book confirmed (C-S15's confirm) | Confirm | T-ALERT, then `m.fade` | The alert closes (system); the Book cross-fades to the next book, or to the empty Book | 200 | same | `H-warning` is not used (Hide deletes nothing); none | No collapse or fly-away |
| B-M12 | B-S03.twoOptions, `.threeOptions`; B-S04, B-S05 | A lens is picked (Months, Photos, Firsts) | `m.select` + `m.list.swap` [P, section 11 P1] | The selection indicator springs to the new option; label colours swap. The list fades out over half of `fadeMs`, is replaced at once (Months at its place this session; Photos and Firsts at their top), fades in over the other half. The header does not move | indicator `spring.snappy`; colours 150; list 100 + 100 ms linear | Indicator jumps, colours 150; the list fades the same | `H-select` (`ChoiceGroup` plays it; v2 section 9 names "segmented lens") | No horizontal slide of the list, no count on any option |
| B-M13 | B-S03.absent to `.twoOptions` and back (aliases `.lensAppears`, `.lensGoes`) | The first picture or first is kept; the last is removed | `m.instant` (control), `m.list.swap` (list) | The lens choice is there, or gone, on the Book's next render. If the lens that goes was showing, the list goes to Months with `m.list.swap` | control 0; list 200 | same | none | The control never animates in or out; no message (NS-01-R12) |
| B-M14 | B-S04.many, B-S05.many | Scroll | as B-M03, B-M04 | The lens cards are the Book's own cards | scroll-linked | as B-M03 | none | No Ken Burns, zoom, slideshow or autoplay [V2 section 11] |
| B-M15 | B-S07.default to B-S01 | A month row | T-SHEET, `m.list.swap` [B `jumpTo`, `runJump`] | The sheet goes down (system); at the same moment the list fades out, moves at once to the month under the bar, fades in | sheet system; list 100 + 100 | sheet system reduced; list the same | none | Never an animated scroll through months; no scrubber bubble |
| B-M16 | B-S07.withYears to B-S19.year | "Read a year together", a year row | T-SHEET then T-COVER | The sheet goes down and Read together dissolves in over it at the same moment: one hand-off | `m.cover` 280 | `m.fade` 200 | none | No title card, banner, count or recap |

## 4. Find (B-S06)

| Id | Design ids | Trigger | v2 | What moves | Timing | Reduce Motion | Haptic | Never |
|---|---|---|---|---|---|---|---|---|
| B-M17 | B-S06.idle | Find in the header cluster or the inline bar | `m.glass` (bar) + `m.swap` (paper layer) [C NS-02 section 15] | The header's glass cluster gives way to the Find bar (field and Cancel) inside one glass container: the system morph. The paper layer that covers the Book (it stays mounted underneath) cross-fades in. The field has focus from frame 1; the keyboard rises (system) | glass 0.25 s; paper `swapMs` 150 | Paper appears at once, no cross-fade (NS-02-R21); glass style change kept; RT: the solid bar appears with the paper | none | No bar growing out of the icon by scale, no blur of the Book, no slide down |
| B-M18 | B-S06.results, `.short`, `.rtlRow` | Each keystroke from the third character (one for CJK) | `m.instant` | Rows are replaced in one frame; the previous list stays until the new one is ready. The match mark (underline and weight) is drawn with the row | 0 | 0 | none | No `m.enter`, stagger, reorder animation, spinner, or count (supersedes the 11 Nov spec's staggered results) |
| B-M19 | B-S06.noMatch, `.failed`, `.failedGettingReady` | No match; the search fails | `m.instant`; a later change of the line `m.swap` | The one line (or the failed line with Try again) is there in one frame; announced once | 0; 150 for a change | same | none (errors are not felt, v2 section 9) | No shake, red flash or illustration |
| B-M20 | B-S06.results to B-S08.ownSpoken (alias `.faded`) | A result row | T-ZOOM fallback, `m.fade` | A Find row is not in the page's text column, so the page arrives whole: the hand-off (Find under the veil over 140 ms, the page in over its last 120 ms from 80 ms) | 200, linear | same | none | No carried words from a row that would reflow (supersedes the 11 Nov spec's card-to-page from a row) |
| B-M21 | B-S08 back to B-S06.results | Back | `m.fade` | The same hand-off back; query and scroll place unchanged | 200 | same | none | Rows never re-enter |
| B-M22 | B-S06 to B-S01 | Cancel | `m.glass` + `m.swap` | The keyboard goes down (system); the Find bar gives way to the header cluster (glass morph); the paper layer fades out; the Book is where it was | glass 0.25 s; paper 150 | Paper gone at once; glass style kept | none | The Book never re-enters or scrolls |
| B-M23 | B-S06, a tab switch | Home or Me | T-TAB | The native swap; the query is cleared | 0 | same | none | No fade on the way out |

## 5. The letter page (B-S08) and what opens from it (B-S09 to B-S16)

| Id | Design ids | Trigger | v2 | What moves | Timing | Reduce Motion | Haptic | Never |
|---|---|---|---|---|---|---|---|---|
| B-M24 | B-S01, B-S05 card to B-S08.ownSpoken (alias `.carried`) and back | A letter card whose text column matches the page's | T-ZOOM, `m.zoom` [B `CardToPage`] | `m.tap` holds the card at 0.98 through the hold; a veil of the page's paper comes up over the Book; one paper surface grows from the card to the screen, corner `md` to 0; the card's words are carried whole, unscaled; the rest of the page arrives with `m.enter` from 60 percent, once the words are within 4 pt of home. Back: the words go back into the card (re-measured), the veil lifts once the paper is within 24 pt of the card | hold 136; veil 160 linear; growth `spring.standard`; back veil 280; settled within 600 (named) | `m.fade` hand-off both ways, nothing moves | none | No scaled text, no blur, no dim on the veil; the page has no lamp and no loop |
| B-M25 | B-S08.ownSpoken (alias `.faded`) from any card whose column differs | Photos lens cards (thumbnail beside or above the words, DESIGN B-S04), the hidden card (B-S16), Home's slips (B-S17, B-S18), Find rows, a card at another Reading Size, a deep link or cold start | T-ZOOM fallback, `m.fade` | The hand-off of B-M24's Reduce Motion column, in every setting | 200 | same | none | Paper alone never shows: paper and words arrive together |
| B-M26 | B-S08, arrival | The page has arrived | not motion (focus) | VoiceOver focus moves to the dateline, the level 1 heading (NS-21-R4) | at arrival | same | none | Focus never lands on a carried copy |
| B-M27 | B-S09.default, B-S10.default, B-S13.default, B-S11.actions, `.words`, B-S12.labelSheet | A row in "This letter" | T-SHEET, `m.sheet` | The system sheet rises (or morphs out of its source where the platform allows); the page keeps its place; the date picker inside is the system's | system | system reduced | none (opening is navigation) | Sheet content adds no entrance |
| B-M28 | B-S08 after B-S09 or B-S10 saves; B-S09.failed, B-S10.failed | Save in the day sheet; a choice in Who can read it | `m.swap`, `m.move`, `m.toast` | The sheet closes. The row's value is replaced in place; if the dateline changed it is replaced the same way; if a value wraps to more lines, the rows below take their place with `m.move`. The toast (where WORDS gives one) materialises. Failed: the old value stays; the one failed line arrives with `m.toast` | swap 150; move `spring.standard`; toast as B-M10 | swap 150; move at once; toast glass only | Who can read it: `H-select` (a choice in its choice group). Day: none (the system date picker ticks; v2: never ours on top) | No flash, slide or highlight on the row; the page never scrolls to it |
| B-M29 | B-S08 row 2; B-S12.labelSheet, `.marked`, `.undo`, `.atLimit`, `.failed` | "This was a first" on; Done; off; Undo | system toggle, T-SHEET, `m.swap`, `m.move`, `m.toast` [C NS-06-A15] | On: the system toggle moves its thumb, and the label sheet rises (B-M27). Done: the sheet goes; the label arrives as the row's second line with `m.swap`, rows below `m.move`. Off: the label line goes at once and rows close up with `m.move`; the Undo toast materialises (T4 window). Undo: back as it was. At 40 graphemes the field just stops: nothing moves | toggle system; swap 150; move `spring.standard`; toast as B-M10 | toggle system; swap 150; move at once; toast glass only | none from us on the toggle (it plays its own); `H-select` on Undo | No celebration, stamp, star, glow, confetti; nothing on the card in the Book or in the Firsts lens (supersedes the 11 Nov spec's field `enter`) |
| B-M30 | B-S08.withPicture; B-S11.actions, `.replaceConfirm`, `.undo`, `.pickFailed`, `.iCloudDownloading`, `.iCloudOffline` | Added from the system picker; changed; Take the photo off; Undo | `m.enter`, `m.fade`, `m.exit`, `m.move`, `m.toast` | Added: the picture arrives in its box with `m.enter` and the words below take their new place with `m.move`. Changed (after the replace confirm, T-ALERT): the new picture cross-fades over the old in the same box. Taken off: the picture leaves with `m.exit` (opacity only), then the words close up with `m.move`; the Undo toast materialises. Undo: as Added. iCloud download: the system progress trait; a line changes with `m.swap` | enter 280; change 200; exit 160; move `spring.standard` | enter as a 200 fade; change 200; exit 160; move at once | none on add, change or take off (the picker is the system's; take off is undoable, not destructive, v2 section 9); `H-select` on Undo | No zoom, Ken Burns, parallax, blur-up [V2 section 11] |
| B-M49 | B-S11.viewer | Tap the picture | T-COVER, `m.cover`, `m.glass` [P, section 11 P2] | The viewer (picture fitted on black) dissolves in; its clear-glass controls (Close, Change, Take the photo off) over a 35 percent dim materialise with it. Close dissolves back to the page, unchanged | 280; glass 0.25 s | `m.fade` 200; glass style kept | none | Never a zoom from the thumbnail (it would scale the picture, v2 section 11 "Photographs: no zoom") |
| B-M31 | B-S13.default, `.daySelected` to B-S08.sealedAuthor | "Hide it" | T-SHEET, `m.swap` | The sheet goes down; "Hide until a day" becomes "Hidden until" with the chosen day, in place. The author's words do not change or dim | swap 150 | same | none (the date picker ticks itself) | No envelope closing, lock, wax seal, fold, dimming; no `sealed` sound (that is Keep's) |
| B-M32 | B-S16.default | Always; a tap | `m.instant`; tap: T-ZOOM fallback | Nothing: the hidden card is static. A tap (author only) opens the page with B-M25's hand-off | 0; tap 200 | same | none | No shimmer, frosted glass, blur over words, or ticking count; the envelope glyph is still |
| B-M33 | B-S14.confirm to B-S08 | "Open now" (Cancel is the default) | T-ALERT, `m.list.remove` | The confirmation closes (system). The "Hidden until" row leaves "This letter" with `m.exit` (opacity only), then the rows below close up with `m.move`. The words were already on the author's page: nothing else changes | exit 160; move `spring.standard` | exit 160; move at once | none (not destructive; v2 plays `H-warning` only for a destructive choice) | No reveal: words never fade in, unblur or "open" |
| B-M34 | B-S15.confirm, `.confirmSealed`; B-S01.undoDeleted; B-S15.overHome | "Delete letter" (Keep it is the default); Undo | T-ALERT, T-ZOOM back, `m.list.remove`, `m.toast`, `m.list.insert`, `m.mark` [B S35, S36] | The confirmation closes; the page goes back into its card (B-M24 back, or the hand-off); the card leaves its row with `m.exit` (opacity only), then the rows below close up with `m.move`; "Letter deleted." with Undo materialises and stays until tapped or the screen changes (no timer, NS-21). Undo: the card is back in its row (`m.list.insert`) with `m.mark`. From Home (`.overHome`): the toast shows over Home | exit 160; move `spring.standard`; toast as B-M10; mark 1600 | card fades 160, gap closes at once; toast glass only; mark static then fades | `H-warning` at confirm (commit first); `H-select` on Undo | No crumple, slide to a bin, shake |
| B-M35 | B-S08, Reading Size and "Exactly as said" | A step; the switch | `m.swap` [B MOTION v0.2 5i] | The words cross-fade at the new size or view; the scroll stays anchored to the paragraph at 40 percent | 150 | same | `H-select` per Reading Size step | Font size never animates |
| B-M36 | B-S08.ownSpoken, Play | Play, pause | `m.instant` (control state) | The player control's own state; nothing on the page moves with the voice | 0 | same | none (playback has none) | No waveform, no word highlight (read-along is parked, B-M48) |

## 6. Home slips (B-S17, B-S18), Read together (B-S19, B-S20), read-along (B-S23)

| Id | Design ids | Trigger | v2 | What moves | Timing | Reduce Motion | Haptic | Never |
|---|---|---|---|---|---|---|---|---|
| B-M37 | B-S17.default (alias `.present`) | Home on a cold launch with the slip due | `m.enter.group` (Home's, area A) | The card is one item of Home's first content, after the prompt. On a warm return or tab switch it is simply there | 280, in its stagger place | No enter at all: rendered complete (NS-23 Reduce Motion row "No enter animation"; the card wins over v2's fade substitute) | none | No date stamp animating, ribbon or glow; the excerpt's end fade is static |
| B-M38 | B-S17 to B-S08 | The card (not "Not today") | T-ZOOM fallback, `m.fade` | The hand-off; Back returns to Home with nothing re-entering | 200 | same | none | No carried words that would reflow |
| B-M39 | B-S17.dismissed | "Not today" | `m.list.remove` | The card leaves with `m.exit` (opacity only), then whatever sits below closes up with `m.move`; VoiceOver focus goes to the next element | exit 160; move `spring.standard` | exit 160; close-up at once | none | Speak and Type never move (pinned below the scroll at default sizes; above the card at AX sizes) |
| B-M40 | B-S17 at local midnight with Home on screen | The day changes | `m.instant` at next render | Nothing at midnight; the next day's choice shows at the next render cause (focus, launch, a store change) | 0 | same | none | A card never swaps under the eye |
| B-M41 | B-S16.afterOpening; B-S18.default (alias `.present`) | The instant passes | `m.instant` | Nothing animates, on any phone, in any setting. No timer at the instant: the visibility check runs at render, so the letter is open at the next render cause. In the Book the hidden card becomes the letter card in one frame, with no `m.mark`. On Home the seal-opened line renders complete with Home, exempt from Home's `m.enter.group` (it never "arrives"). The words show only on a tap (B-M25) | 0 | same | none | No reveal, unblur, envelope, tint, sound, badge, notification, count or confetti (supersedes the 11 Nov spec's cross-fade to the card). DESIGN B-S18 still says "no motion beyond the existing enter"; G2 is adopted in its section 10, so that line should be updated |
| B-M42 | the other parent's phone after the instant | The letter arrives by sync | as B-M07 | Exactly what any of the other parent's letters gets the first time: B-M07, once. Nothing tells them it was hidden | 1600 | static then fades | none | No treatment different from any other new letter |
| B-M43 | B-S01 or B-S08 to B-S19.default, `.year` | Read together; a year (B-M16) | T-COVER, `m.cover` | A cross-dissolve into the room. Its top bar and turn buttons are glass from frame 1 (they come with the room, no separate materialise). If the lamp is on: the Book's lamp leaves under the cover (`lamp.leaveMs` 160), and at night the dusk pool comes up with the room (P3: `lamp.returnMs` 280, not v0.2's 1200 arrive) | 280 | `m.fade` 200; lamp at its level | none | No title card, year banner or count |
| B-M44 | B-S19.default (alias `.turning`), `.year` | Next letter, Back one, a swipe, Keep playing turning on its own | T-PAGE, `m.pageTurn` [B `PageTurn`] | Next: the page moves 24 pt left over 160 ms, its words gone by 104 ms; the next page arrives from 24 pt right on `spring.standard`, fading in over 200 ms from 52 ms. Back mirrors it. A swipe follows the finger; past a quarter of the width or a fling of 600 pt/s it turns, otherwise it settles back on `spring.snappy`; at the first or last letter the page meets a soft edge at a quarter of the travel. The 2 pt progress hairline takes its new length on the next frame | out 160 `easing.standard`; in `spring.standard` + 200 fade | `m.fade` 200; the page does not follow the finger (buttons and VoiceOver turn it) | none | No curl, page shadow or count on screen; the hairline never animates (v2 "counts and numbers"). Sound: `page_turn` only with Paper sounds on, on a tap or swipe while nothing plays, never on Keep playing's own turn |
| B-M45 | B-S19.interrupted | A call; the app goes inactive | `m.instant` | Playback pauses with the audio session; the page stays; nothing moves on return | 0 | same | none | No resume animation |
| B-M46 | B-S20.endOfBook, `.endOfYear` | The page after the last letter | T-PAGE, then still | The end page arrives by the page turn like any page. The moon is drawn complete (v2 retires `m.draw` outside first run). If the lamp is on, the dusk pool dims to half (P3: over `lamp.returnMs` 280). Buttons are there from frame 1 | turn as B-M44; pool 280 | `m.fade` 200; moon complete; pool at half at once | none | No summary, count, recap or fireworks; nothing moves after it lands (supersedes v1's 1200 ms moon draw, built `LineArt animate`) |
| B-M47 | B-S19, B-S20 back to the Book | Close the book, or Close | T-COVER, T-RESUME | The dissolve out; the Book's lamp (if on) returns over 280; nothing in the Book re-enters; the list is where it was | 280 | `m.fade` 200 | none | No scroll of the Book to "where you stopped" |
| B-M48 | B-S23 | Not built (NS-29 parked) | `m.follow` (v2, kept for a future build) | Nothing in this area | n/a | n/a | none | Not drawn as a working feature |

## 7. Moments over 300 ms, and the v2 exception each uses

| Moment | Length | v2 named exception (section 5) |
|---|---|---|
| B-M01, B-M37 first content | 430 ms to the last item | `m.enter.group`, first show per session or cold launch only |
| B-M24, B-M34 card to page and back | up to 600 ms to settled | `m.zoom`; interruptible; the page takes touches from its first frame |
| B-M06, B-M07, B-M34 Undo, B-M42 tint | 1600 ms | `m.mark` (B-M07 and B-M42 ask v2 to widen the condition, P4) |

Nothing else in this area runs over 300 ms. v1's exceptions are gone: the header settle (retired), the moon draw (retired outside first run) and the 1200 ms dusk pool arrival (P3).

## 8. Haptics in this area (v2 section 9 ids)

| Moment | Id (intent) | B-M |
|---|---|---|
| A lens picked; a choice in Who can read it; a Reading Size step; Undo (delete, picture, first) | `H-select` (`tap`) | B-M12, B-M28, B-M35, B-M34, B-M30, B-M29 |
| Delete confirmed | `H-warning` (`warning`), at the commit | B-M34 |
| Everything else in this area: opening or closing the Book, a letter, Find, a sheet, a menu, the viewer, Read together; scrolling; tab bar minimise; switching books (as built); Go to a month; a year; a page turn; Quiet or Hide; a day saved; a seal set; Open now; a picture added, changed or taken off; the system toggle (it plays its own); the seal opening; a past letter shown, tapped or dismissed; any error | none | all others |

No `H-success` in this area: it belongs to Keep (area A). No haptic while a letter plays.

## 9. What never animates in this area

- A sealed letter, at any stage: setting the seal, the hidden card, the day it opens, Open now (B-M31 to B-M33, B-M41).
- A first: no stamp, star, ribbon or glow when marked, in the Book or in the Firsts lens (B-M29).
- Any number: nothing on screen counts (Find, lenses, year rows); Read together's position is spoken only; the hairline steps (B-M44).
- Find's results while typing (B-M18).
- The Book's list position: no animated scroll anywhere (jumps and lens swaps fade, B-M12, B-M15; Keep lands in place, B-M06).
- A letter's words, font size, a picture's scale (B-M24, B-M30, B-M35, B-M49).
- Glass opacity (B-M03, B-M17, B-M22).
- Loops: none on any screen here. The Book's lamp scene is still; Read together's pool is still; the letter page has no lamp; the empty Book's cover is still (`BookCover animate={false}`; waiting states are still, Karma ruling 20 Nov).
- Skeletons, shimmer, spinners: every read in this area is local.

## 10. VoiceOver, Switch Control and focus during motion

- During `m.zoom`, the Book is hidden from VoiceOver (`useHiddenBehindCardPage`), carried words are hidden, and focus lands on the dateline at arrival (B-M26).
- During a page turn the leaving page takes no touches and is hidden; VoiceOver hears "Letter n of m" after the turn (as built).
- Find announces "Letters found" or the no-match line once (NS-02-R11), after the rows are drawn, never per keystroke.
- When a row or card leaves (B-M33, B-M34, B-M39), focus moves to the next element, never to the top.
- Undo toasts follow T4 through the undo helper (open for the stated seconds or until VoiceOver has read the line plus that many seconds; with Switch Control, until the parent moves on); the delete Undo has no timer at all (NS-21). DESIGN G-13 records the v2 F1 conflict.
- Every gesture has a button: Next letter and Back one for swipes; Close in the viewer; menu items are commandable by their visible labels.

## 11. Proposals to design system v2 (this area needs them; v2 does not name them)

| # | Proposal | Why | Where it lands |
|---|---|---|---|
| P1 | `m.list.swap`: replace a whole list in place: the list `m.fade`s out over half of `fadeMs`, is replaced and repositioned with `m.instant`, and fades in over the other half (linear). RM: the same (opacity only) | The Book replaces its list for a month jump (built `runJump`) and for a lens; a single list cannot cross-fade with itself, and `m.fade`'s hand-off assumes two screens | v2 section 4; built in `book.tsx` `jumpTo`; row E1 below |
| P2 | The picture viewer (B-S11.viewer, v2 C4) is a T-COVER row: `m.cover` in and out, its clear-glass controls part of the room | v2 section 6 has no row for it; a zoom from the thumbnail would scale a photograph, which v2 section 11 forbids | v2 section 6 |
| P3 | The lamp is kept (ruling 31); Read together's dusk pool comes up with the room over `lamp.returnMs` (280), and dims to half at the end over the same; not v0.2's 1200 ms `arrive` per opening | v2 section 10 names only one 1200 ms arrive, once per cold launch; Karma's ruling put first-run lamp changes on `returnMs`; this keeps Read together under the cap | v2 section 10 and FOUNDATIONS (lamp) |
| P4 | `m.mark`'s condition widens to "a letter from the other parent, the first time this phone shows it" | Built (`book.tsx` `firstSeen`) and harmless; v2 section 5 lists only kept or restored letters, so as written it would be a defect | v2 section 5 |
| P5 | The Book's inline bar shows by a threshold (`m.glass` at the scroll offset where the band's control cluster passes under the bar), not a scroll-linked fade | The built bar fades its opacity with scroll; on glass that is forbidden (v2 section 7 rule 1); a threshold keeps "never two clusters" | v2 section 7; row E3 below |

## 12. Changes from v1 of this file (for DESIGN.md and WORDS.md)

- Keyed every row to v2 `m.*` and `T-*`, and to DESIGN.md's state names and section 10 aliases.
- B-M01: the header settle on `gentle` is retired (v2 section 13); only the first cards use `m.enter.group`.
- B-M03: tab bar minimise added (T-MIN); the inline bar changes by a glass threshold, not a scroll-linked fade (P5).
- B-M09: "More for this book" is T-MENU (target) with DESIGN's interim sheet.
- B-M10: no haptic on Quiet this book (v2: settings take none). **v1 gap G10 is withdrawn**; DESIGN section 10 adopted it ("the Quiet toast pairs with the `tap`") and should drop the `tap`.
- B-M12: the lens choice plays `H-select` (v2 section 9 names the segmented lens). **v1 gap G5 and engineering gap E2 are withdrawn**; DESIGN E-14 should be dropped. The indicator now springs between options (`m.select`).
- B-M28 to B-M34: haptics follow v2: none for a day saved, a seal set, Open now, a picture added, changed or taken off, or the first toggle; `H-select` on Undo and on the Who can read it choice; `H-warning` only for Delete. Rows leaving use `m.list.remove` (fade, then close up) instead of v1's simultaneous fade and close-up.
- B-M29: matches DESIGN B-S12: turning the toggle on opens the label sheet; the label arrives as the row's second line.
- B-M30: the picture enters with `m.enter`; the viewer (B-M49) is new.
- B-M43, B-M46: the moon is drawn complete; the dusk pool follows P3.
- B-M24: the page's rest arrives with `m.enter` from 60 percent (v2 T-ZOOM); on `spring.standard` 0.30 s (RULED, ruling 26; built with ENG-M1).

## 13. Card gaps (card row, what is missing, proposed default)

| # | Card row | What is missing | Proposed default |
|---|---|---|---|
| G1 | NS-06-B4, B24 | What the Book shows if it is on screen at the instant a seal opens | No timer; open at the next render cause, in one frame, no tint (B-M41) |
| G2 | NS-06-B4 with the frame's slip order | Home's cold-launch enter would make the seal-opened line "arrive", which reads as a reveal | The line is exempt from Home's `m.enter.group` (B-M41) |
| G3 | NS-37-R3 | When a regenerated list copy appears | At the card's next mount, never into a card on screen (B-M05) |
| G4 | NS-01-R10a, R12; NS-06-A3 | The lens switch motion, where each lens opens, what happens when the lens on screen goes | `m.list.swap`; Months keeps its place for the session; Photos and Firsts open at their top; a lens that goes falls back to Months with no message (B-M12, B-M13) |
| G5 | withdrawn (v2 section 9 decides: `H-select` on the lens) | | |
| G6 | NS-23-R14 | The motion of "Not today" | `m.list.remove`; no haptic; focus to the next element (B-M39) |
| G7 | NS-23 Reduce Motion row "No enter animation" | v2's substitute for an enter is a fade; the card removes it entirely | The card wins: rendered complete under Reduce Motion (B-M37) |
| G8 | NS-02 section 15 | The transition from a result row to the letter page, and back | The hand-off both ways (B-M20, B-M21) |
| G9 | NS-24 section 3 | The hand-off from a year row into Read together | One dissolve over the closing sheet (B-M16) |
| G10 | withdrawn (v2 section 9: no haptic for a setting) | | |
| G11 | NS-06-A5 "Unmark in one tap; Undo restores" | The surface for Undo | An Undo toast under T4 (B-M29) |
| G12 | NS-24 section 15 "the existing end of the book" | Whether the moon still draws: v2 retires `m.draw` outside first run | Drawn complete; the end page arrives by the page turn (B-M46) |
| G13 | NS-01 design inputs; NS-21 | The picture viewer's open and close | `m.cover` (B-M49, P2) |

## 14. Engineering gaps (with the backlog row each belongs to)

| # | Row | Gap |
|---|---|---|
| E1 | BL-938 (header), BL-956 (Photos lens), BL-968 (Firsts lens) | One `m.list.swap` helper for lenses and the month jump (DESIGN E-15), with Months' place saved per session |
| E2 | withdrawn | `ChoiceGroup` keeps its `tap` on the lens (v2 section 9). DESIGN E-14 can close |
| E3 | BL-938, v2 ENG-M3 and ENG-M4 | The inline bar on a glass threshold (P5) replacing `barStyle`; T-MIN needs the Book's list as a supported first-child scroll view (v2 S6: not `FlatList`; the Book is a `SectionList`): a device spike |
| E4 | BL-952 (Find) | #798's Find layer: paper `swapMs` cross-fade, at once under Reduce Motion (NS-02-R21); result rows with no `entering` or `layout`; the header cluster to Find bar glass morph in one container |
| E5 | BL-932, BL-956 | Thumbnail `m.fade` only when a decode finishes after mount; none under Reduce Motion; a reserved box; a regenerated copy waits for the next mount |
| E6 | BL-970, BL-963 (slip registry) | No timer at the instant; the opened letter replaces the hidden card with no `m.mark`; the seal-opened slip exempt from Home's `m.enter.group` |
| E7 | BL-946 | "Not today" as `m.list.remove` and focus to the next element; no midnight swap while Home is on screen |
| E8 | BL-947 | Read together presented while the Months sheet closes (one hand-off) |
| E9 | BL-937 | `m.swap` for every value in "This letter"; rows leave with `m.list.remove`; remove the `haptic('tap')` in `letter/[id].tsx` `changeDate` (a day saved takes none under v2 section 9) and keep `toggleInBook`'s as `H-select`; add both to v2 ENG-M10's allowed call-site test |
| E10 | none found | `page_turn` is specified in SOUND.md but no sound ships ("nothing is bundled"); B-M44 assumes it only once Paper sounds ships |
| E11 | BL-968 | The label sheet opens from the toggle; the label line arrives with `m.swap`; no haptic of ours on the system toggle |
| E12 | BL-947 or the Read together owner; v2 ENG-M13 | `EndOfBook` draws the moon complete (`LineArt animate={false}`); the dusk pool on `lamp.returnMs` (P3) |
| E13 | v2 ENG-M13 | Retire the Book `Settle` (B-M01) |
| E14 | BL-954 or BL-957 (picture on the letter page) | The viewer as a `fullScreenModal` with `m.cover` (P2) |

---

## 15. Final-pack reconciliation (v3, 20 Nov): new and changed states

Re-keyed to DESIGN.md v2 (sections 11 to 14). New moments are B-M50 and up; every one names its `m.*` primitive, its `T-*` row, its Reduce Motion behaviour and what must never move. Nothing here implies a streak, a count or a ceremony. The design-system v2 names are those of section 4 and 6 of `docs/design/system/MOTION.md`.

| Id | Design ids | Trigger | v2 | What moves | Timing | Reduce Motion | Haptic | Never |
|---|---|---|---|---|---|---|---|---|
| B-M50 | B-S17.higherSlip; B-S17.default | Home opens and a higher rank (1, 2, 2b, 3, 3b) is due, so the past letter is absent; or the higher slip is dismissed and the past letter would now be next | `m.instant` | Nothing. The past letter is not drawn and no space is kept; after a dismissal the next slip is chosen at the next Home visit (a render cause), never under the eye | 0 | same | none | No swap of one slip for another while Home is on screen; no "next up" cue; nothing that implies a queue or a count of slips |
| B-M51 | B-S01.dayToday | A day the parent chose is today | none | Nothing in the Book. The day exists on Home only (DESIGN section 12a) | 0 | same | none | No tint, badge, glow or label on any card or opener for a day |
| B-M52 | B-S08.fromNameChange | The author taps the From name | T-SHEET, `m.sheet`; `m.swap` | A fit-to-contents sheet rises; on Done the dateline's name changes with `m.swap` (cross-fade of the value only) | system; swap 200 | sheet system reduced; swap `m.fade` 200 | none (a setting, v2 section 9) | The letter's words never move or flash |
| B-M53 | B-S08.fromNameFixed | The page opens for an author's letter with a fixed name | `m.instant` | The footnote is there from the first frame | 0 | same | none | No fade-in of a caution; it is information, not an alert |
| B-M54 | B-S02.printOn | "More for this book" opens with the print flag on | T-MENU (target) or `m.sheet.own` (interim) | The third row is there when the menu opens; nothing is staggered. Tapping it opens PRT-S01 as a sheet (T-SHEET) over the closing menu in one hand-off | menu system; sheet system | menu and sheet system reduced | none | No pulse, badge or "new" on the row |
| B-M55 | B-S01.ratingMoment | Apple's rating request is shown | none of ours | Apple's own sheet, entirely the system's | system | system | none from us | Nothing of ours animates before, with or after it; no thank-you, no confetti |
| B-M56 | B-S13.default to `.daySelected` | A day is chosen in the picker | `m.instant` | The "Hide it" button is present at full strength from its first frame once a day is chosen (absent before, B G-12); the system picker moves itself | 0 | same | none | The button never fades or springs in; no ceremony on choosing |
| B-M57 | B-S18 "Not now" | The seal-opened line is dismissed | `m.list.remove` | As B-M39: the card fades with `m.exit`, what sits below closes up with `m.move` | exit 160; move `spring.standard` | exit 160; close-up at once | none | No reveal, farewell or "you can find it in the Book" cue |
| B-M58 | B-S08.withPicture (a picture letter however it began) | The page opens | as B-M24, B-M30 | Exactly what any picture letter does; a picture that began from Apple's suggestions is not told apart by motion | as B-M30 | as B-M30 | none | No difference in motion, label or timing between a photo start, a suggestion start and an added photo |
| B-M59 | Any screen of this area, `.backgrounded` | The app goes inactive | `m.instant` (privacy) | Letter words, pictures and fragments are covered by an opaque blank in one frame; on return the content is already there | 0 | same | none | Never a fade that would let the snapshot catch a half-covered letter (FR-SEC-22) |

Added to section 9 (what never animates): a ticked or typed day anywhere in the Book (B-M51); the choice of one slip over another (B-M50); the rating request (B-M55); the origin of a picture (B-M58).

Haptics added to section 8: none. B-M52 and B-M56 take none (settings and navigation).

Reduce Motion check for the new rows: every row above is either `m.instant`, system, or a 200 ms fade; none depends on travel.

Gaps: MOTION-PROTOTYPE.html is not updated in this pass (the new moments are `m.instant` or system, so there is nothing to play beyond the existing scenes); a scene for B-M57 would reuse B-M39. Engineering: BL-963 must make the slip swap happen at a render cause only (B-M50).

---

## 16. Round 2 additions (20 Nov, founder direction 26): several pictures and videos, moments

Keyed to DESIGN.md section 15. Ids B-M60 and up, PROPOSED, flagged: the cards NS-51 and NS-52 (`27-photo-moments-and-media.md`) did not exist when this was written, so rows are keyed by card name. Reading is still: nothing autoplays, loops, slides or counts.

| Id | Design ids | Trigger | v2 | What moves | Timing | Reduce Motion | Haptic | Never |
|---|---|---|---|---|---|---|---|---|
| B-M60 | B-S08.withMedia, `.withVideo` | The page opens | as B-M24, B-M30 | The page's items arrive with the rest of the page (`m.enter` from 60 percent); a picture decoded before mount shows at once; a poster arrives in its reserved box with `m.fade` only if it decodes after mount | 200 | shows at once | none | No stagger per item, no shimmer, no blur-up, no count |
| B-M61 | B-S08 video, Play | The parent taps Play on a poster | system player | The system player takes over in place; the poster is replaced by the player's first frame without a cross-fade of ours | system | system | none | No autoplay, no loop, no preview on scroll, no sound until the tap |
| B-M62 | B-S08 video and recording | One audio starts while the other plays | `m.instant` | The first pauses; no visual cue beyond its control's state | 0 | same | none | No ducking animation |
| B-M63 | B-S26 viewer open and close | Tap an item; Close | T-COVER, `m.cover`, `m.glass` (as B-M49) | As B-M49 for the first item | 280 | `m.fade` 200 | none | No zoom of the words; the picture's scale is not animated |
| B-M64 | B-S26 between items | Swipe, Back, Next | system paging | The system's own; the 35 percent dim stays | system | system reduced (a fade) | none | No parallax, Ken Burns or counter animation |
| B-M65 | B-S08 add an item, take off one, Undo | The row result | `m.enter`, `m.list.remove`, `m.list.insert` | An added item enters with `m.enter`; a removed item leaves with `m.exit` then the rest close up with `m.move`; Undo re-inserts it where it was | 160 to 280 | fades only, close-up at once | none (v2 section 9: media changes take none) | No "added" celebration, count or progress fill |
| B-M66 | B-S08.mediaDownloading | An iCloud-only item is opened | `m.instant` | One still line and a Cancel; when the file arrives the item is shown at the next render with `m.fade` 200 | 0, 200 | at once | none | No spinner loop, no determinate fill, no percentage |
| B-M67 | B-S08 at the media limit | The last allowed item is added | `m.instant` | The add row is absent at the next render; the calm line is there from its first frame | 0 | same | none | No disabled state, no shake |
| B-M68 | B-S04 Photos lens, a video card | The lens shows a video letter | `m.instant` | The Play glyph is part of the card from its first frame | 0 | same | none | No overlay animation, no duration counter |
| B-M69 | Photo moments (NS-51) in the Book | A moment exists on Home | none | Nothing in the Book (DESIGN section 15d) | 0 | same | none | No tint, mark, lens or message in the Book for a moment |
| B-M70 | B-S15.confirm with media; delete | Delete a letter that holds media | T-ALERT, `m.list.remove` | As B-M34: the confirm is the system's; the card leaves the Book with `m.list.remove`; its media leave with it, not one by one | system; 160 | fade, close-up at once | `H-warning` at the commit (as B-M34), once | No per-item fly-away, no count of what was removed |
| B-M71 | Any screen here, `.backgrounded` with video | The app goes inactive | `m.instant` | A playing video pauses; posters and pictures are blanked in one frame | 0 | same | none | No fade that lets a snapshot catch a frame |

Added to section 9 (what never animates): autoplay or looping of any video; a slideshow, carousel or Ken Burns of a letter's media; a download or upload progress fill; a count of media; a moment in the Book. Haptics: none added except the existing `H-warning` on a confirmed delete (B-M70).

Engineering gaps: BL-954 (the Undo helper for per-item media), BL-931 and its media successor (a `VideoPoster` with the system player; one audio session rule); no row exists yet for the media limit footnote. MOTION-PROTOTYPE.html is not updated for round 2 (no scene is needed: every row is `m.instant`, a 200 ms fade or the system's).
