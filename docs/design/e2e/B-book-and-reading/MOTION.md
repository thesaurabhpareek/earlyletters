# Area B: Book and reading. Motion

Status: DRAFT v1, 20 Nov 2026. Author: the area B motion lead (one Claude session), under `docs/design/e2e/BRIEF.md`. Docs only; nothing here was run on a phone. Companion: `MOTION-PROTOTYPE.html` in this folder plays every moment below, with a Reduce Motion toggle, light and dark.

Keys: every moment has an id `B-Mnn` and names the screen and state ids of `DESIGN.md` in this folder (`B-Snn`, `B-Snn.<state>`). The screen ids were taken from the design lead's inventory as it stood on 20 Nov (B-S01 to B-S23); where a state name is not yet in DESIGN.md it is written here as a PROPOSED state and listed in section 11 for the reconciliation pass.

Sources, in order (BRIEF section 1): the locked cards NS-01, NS-02, NS-06 Parts A and B, NS-21, NS-22, NS-23, NS-24, NS-29, NS-33, NS-34, NS-37; `14-test-plan.md` (J-N15: no moving loop under Reduce Motion); house motion `docs/design/MOTION.md` v0.2 (cited as MOTION 5a to 5m), `SOUND.md`, `COMPONENTS.md`; tokens `packages/design-tokens/src/tokens.ts` (`tokens.motion`); the app as built (`app/(tabs)/book.tsx`, `app/letter/[id].tsx`, `app/read-together.tsx`, `components/motion/*`, `components/book/*`, `components/tonight/resurfaced-card.tsx`, `lib/transitions.logic.ts`, `lib/haptics.shared.ts`). Tags: [B] built today (file named), [C] the card says so (row named), [P] PROPOSED by this file.

## 1. The rules for this area

1. **Reading is still.** The Book, the letter page and Read together are places to read. Motion here only says where you went (a hand-off between places) or that a thing you did took (a value replaced in place). Nothing moves for its own sake, and nothing moves while a person reads.
2. **Native first** (MOTION 5l rule 4). Tabs swap with no animation; sheets, menus, date pickers, the keyboard and the system toggle are the platform's. Our own moves in this area are only four, all built: card to page (5f), the page turn (5m), the list fade for a jump (book-page.md 3, `runJump`), and the arrival wash (5e).
3. **Calm and quick.** Every transition this area adds is 300 ms or less. The few house motions that run longer are listed with their reason in section 7; none is new.
4. **Controls never animate in** (MOTION principle 2). A control that appears (the Find action, a lens choice, a row in "This letter", the Firsts label field) is there at full strength on its first frame.
5. **No ceremony.** No celebration, no reveal, no counter, no countdown, no progress ring, no badge pulse, no skeleton shimmer, no confetti, no envelope, no lock. A sealed letter opening on its day moves nothing (NS-06-B6 "No reveal animation exists in any mode"; B15 "Motion: none on opening").
6. **Reduce Motion, one mechanism** (MOTION 4). Movement goes; opacity stays. Every moment below names its Reduce Motion alternative. Under Reduce Motion no screen in this area runs a loop (NS-33-R5, J-N15).
7. **Haptics mark outcomes, never navigation** (MOTION 6). Opening, closing, scrolling, switching a lens, jumping to a month, turning a page and Find are silent. A changed fact about a letter is a `tap`; a delete is a `warning`.
8. **Sound** is the opt-in Paper sounds layer only (SOUND.md, off by default). In this area it is `page_turn` in Read together, and never while a letter plays. No other moment here has a sound.

## 2. Tokens used (all from `tokens.motion`; no screen types a number)

| Token | Value | Used here for |
|---|---|---|
| `fadeMs` | 200 | Reduce Motion cross-fade; card-to-page hand-off; the list fade of a jump or a lens switch (half out, half in); book switch |
| `exitMs` | 160 | a card or row leaving; a toast leaving; the page turn's leaving page |
| `swapMs` | 150 | words or a value replaced in place; Find opening and closing; Reading Size and "Exactly as said" |
| `enter` | dy 8, 280 ms, easing `[0.2, 0, 0, 1]` | content entering on the first Book view per session and on Home's cold launch only |
| `staggerMs`, `staggerMax` | 30, 6 | the first 6 Book cards, first view only |
| `easing` | cubic-bezier(0.2, 0, 0, 1) | every timed move that is not a straight-line fade |
| `snappy` | k 520, c 46, m 1 (ratio 1.0) | press feedback; selection fill; swipe settle |
| `standard` | k 260, c 30, m 1 (ratio 0.92) | card to page growth; rows closing up; sheets; the arriving page in a turn |
| `gentle` | k 90, c 18, m 1 (ratio 0.95) | the Book header settle, first view per session only |
| `press` | scale 0.97, cards 0.98 | press feedback on every pressable card and control |
| `cardToPage` | contentFrom 0.6, holdMs 136, clearPt 24 | card to page (5f) |
| `pageTurn` | dx 24 | Read together page turn (5m) |
| `lamp` | leaveMs 160, returnMs 280, arriveMs 1200 | the light under a covering room; Read together's dusk pool |
| `route.dissolveMs` | 280 | into and out of Read together |
| `newMarkMs` | 1600 | the accentSoft wash on a kept, restored or first-seen letter |
| `drawMs` | 1200 | the moon at the end of the book |
| `emptyBreathMs` | 8000 | not used in this area (see B-M33) |

Spring note (computed from the tokens, envelope `exp(-c t / 2m)`): `standard` has 5 percent of its travel left at 200 ms and about 1 percent at 300 ms (0.3 pt of a 24 pt move); `snappy` is under 1 percent by 200 ms; `gentle` needs about 500 ms to reach 1 percent, which is why it is used only for the built header settle (section 7).

## 3. The Book (B-S01) and its header (B-S02, B-S03)

| Id | Screen and state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Never |
|---|---|---|---|---|---|---|---|
| B-M01 | B-S01.default, first Book view this session [B `book.tsx` `Settle`, `enter`] | The Book tab is first shown after a cold launch, not on an `arrived` landing | The header (cover band) settles: opacity 0.6 to 1, y 6 to 0. The first 6 cards enter: opacity 0 to 1, y 8 to 0, 30 ms apart | Header `gentle`; cards `enter` 280 ms, `easing`, last card starts at 150 ms | One 200 ms opacity fade of the header; cards fade 200 ms, no travel, no stagger | none | Read together, Find, the lens choice, Go to a month and the menu are controls: full strength from frame 1 even while the band settles (they sit inside the band, so they take its opacity only; they are hittable from frame 1) |
| B-M02 | B-S01.default, every later view [B MOTION 5l rule 2] | Tab switch back to the Book; Back from a letter, Find, Read together or Settings | Nothing in the Book. The lamp settles from the last tab's light to the Book's still 0.6 | Lamp `returnMs` 280 | Lamp at its level at once | none | Cards never re-enter; the list never scrolls by itself |
| B-M03 | B-S01.default and B-S01.many, scrolling [B `book.tsx` `barStyle`] | The parent scrolls | Only the list, under the finger (native scroll, no inertia changes). Between 56 and 96 pt of scroll the inline bar's opacity follows the scroll from 0 to 1 (title, the lens choice, Find, Go to a month, the menu, and the compact month) | Scroll-linked, not timed | The bar switches at 96 pt, no fade (NS-22 Reduce Motion row) | none | No parallax, no sticky-heading push animation, no scroll-to-top animation, no blur that changes with scroll (the bar is a solid or system material, `BlurSurface`) |
| B-M04 | B-S01.many with pictures [P; C NS-37 Reduce Motion row "No fade-in on thumbnails"] | A card's list copy finishes decoding after the card is already on screen | The thumbnail only: opacity 0 to 1. A list copy already decoded when the card mounts shows at once with no fade | `fadeMs` 200, linear | Shows at once | none | No shimmer, no blur-up, no spinner, no placeholder pulse; the card's words never move when the thumbnail arrives (its box is reserved at mount) |
| B-M05 | B-S01.many, a missing list copy [C NS-37-R3; P timing] | The copy is regenerated in the background | Nothing while the card is on screen: the card stays without a thumbnail. The thumbnail shows the next time the card mounts | none | same | none | A thumbnail never pops into a card the parent is reading, and the card's height never changes under the eye (card gap G3) |
| B-M06 | B-S01.default after Keep, `arrived` [B MOTION 5e, area A hand-off] | Review's saved moment hands to the Book | The list is placed on the new letter at once (no animated scroll); when Review has dissolved away the card's accentSoft wash fades out | Wash `newMarkMs` 1600, linear | The wash shows static, then fades over the same 1600 ms (a fade, so it stays) | none here (Keep's `success` already played in Review) | No tab badge, no scroll animation, no count |
| B-M07 | B-S01.twoParents [B `firstSeen`] | The other parent's letter is shown on this phone for the first time | The same wash, once per letter, ids only | `newMarkMs` 1600 | Same as B-M06 | none | No "new" label, no dot, no count |
| B-M08 | B-S01.twoBooks [B `book.tsx` `switched`] | The child switcher picks the other book | The Book's content cross-fades to the other book | `fadeMs` 200 | Same fade | none (as built: `child-switcher.tsx` plays none; choosing which book to read is navigation) | No slide between books |
| B-M09 | B-S02 "More for this book" menu [C NS-22; P] | The parent taps the menu at the end of the bar | The system menu (UIMenu) opens and closes the platform's way | System | System's reduced version | none on open | No custom menu animation |
| B-M10 | B-S02, Quiet this book or Unquiet chosen [P] | One tap in the menu | Nothing moves in the Book. The menu's item reads Unquiet (or Quiet this book) next time it opens. If `content` gives it a one-line toast, the toast enters with `enter` and leaves with `exitMs` (row 11 of MOTION 5l) | toast `enter` 280 / `exitMs` 160 | toast fades 200, no travel | `tap` | No dimming of the Book, no change of the lamp, nothing that marks the book as different (F12: a hard-day tool is quiet) |
| B-M11 | B-S02, Hide this book confirmed [P; owned by F12 and area C] | Confirm in the system alert | Alert dismisses natively; the Book cross-fades to the next book (B-M08), or to the empty Book if none is left | `fadeMs` 200 | same | `tap` | No collapse or fly-away of the book |
| B-M12 | B-S03 lens choice: Months, Photos, Firsts [C NS-01-R48, NS-06-A3; P motion] | The parent picks a lens | (1) The radio: the selected fill and edge cross-fade on `snappy`; the check mark appears with it. (2) The list: fades out over half of `fadeMs`, the new lens's list replaces it at its place (Months at the place it was left this session; Photos and Firsts at their top), fades in over the other half. The header and the bar do not move | Radio `snappy`; list 100 ms out, 100 ms in, linear (the built `runJump` shape) | The same fades (opacity only, no travel) | none (a lens is a way of reading the same Book: navigation, MOTION 6; see card gap G5) | No horizontal slide (lenses are not pages in an order), no underline sliding between options, no count on any option |
| B-M13 | B-S03, a lens appears or goes [C NS-01-R10a, R12; NS-06-A3] | The first picture or first mark is kept; the last one is removed | The lens choice is simply there (or not) on the Book's next render; if the Photos or Firsts lens was the one showing when it goes, the list shows Months with the B-M12 list fade | 0 for the control; 200 ms for the list | same | none | The control never animates in or out, and no message says it went (R12) |
| B-M14 | B-S04 Photos lens, B-S05 Firsts lens, scroll [C NS-37-R1] | Scroll | As B-M03 and B-M04; the lens cards are the Book's own cards | Scroll-linked | as B-M03, B-M04 | none | No Ken Burns, no zoom on a thumbnail, no slideshow, no autoplay (11 Nov spec section 7, kept) |
| B-M15 | B-S07 Go to a month sheet, a month row [B `book.tsx` `jumpTo`] | A month is chosen | The sheet closes (rises down on `standard`); the list fades out over 100 ms, moves at once to the month under the bar, fades in over 100 ms | sheet `standard`; list 100 + 100 ms linear | Sheet and scrim fade 200, no travel (our Sheet); list the same | none (navigation) | Never an animated scroll through months; never a scrubber or a fast-scroll thumb with a floating month bubble |
| B-M16 | B-S07, a year row (Read the year back) [C NS-24; P] | A year is chosen | The sheet starts closing and Read together is presented at the same moment: its dissolve (B-M30) covers the closing sheet, so there is one hand-off, not two in a row | dissolve 280 | fade 200 | none | No title card for the year, no count, no "year in review" interstitial |

## 4. Find (B-S06)

| Id | Screen and state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Never |
|---|---|---|---|---|---|---|---|
| B-M17 | B-S06.idle [C NS-02 section 15 Motion] | The Find action in the bar or the band | The Find layer (opaque `bg`, the field, Cancel) cross-fades in over the Book, which stays mounted and still underneath. The keyboard rises the system's way at the same time; the field has focus from the first frame | `swapMs` 150, linear | Appears at once, no cross-fade (NS-02-R21); keyboard is the system's | none | No search bar growing out of the icon, no blur of the Book, no slide down |
| B-M18 | B-S06.results [C NS-02 "typing never animates the list"] | Each keystroke from the third character | The rows are replaced in one frame. A row's match mark (underline and weight) is drawn with the row. While a query is answering, the previous list stays as it is | 0 | 0 | none | No enter, no stagger, no reorder animation, no spinner, no fading rows, no count line ticking up (supersedes the 11 Nov spec's "Results enter, staggered") |
| B-M19 | B-S06.noMatch, B-S06.failed [C NS-02-R13, R37] | No letter holds the words; the search fails | The one line (or the failed line with Try again) is there in one frame | 0 | 0 | none; no `gentle_error` sound (a failure the parent cannot fix by acting on it, SOUND 4) | No shake of the field, no red flash, no illustration loop |
| B-M20 | B-S06.results to B-S08 [P; C NS-02-R12] | A result row is tapped | Find's rows are not in the letter page's text column, so the page fades in whole: the 200 ms card-to-page hand-off (Find under the veil over its first 140 ms, the page over its last 120 ms, from 80 ms) | `fadeMs` 200, linear, `CARD_TO_PAGE.handOff` | The same | none | No carried words from a row that would reflow (supersedes the 11 Nov spec's card-to-page from a Find row) |
| B-M21 | B-S08 back to B-S06.results [C NS-02-R12] | Back | The same 200 ms hand-off back; Find is where it was, query and scroll place unchanged | 200 ms | same | none | Rows never re-enter |
| B-M22 | B-S06 to B-S01 [C NS-02 happy path 6] | Cancel | The keyboard falls the system's way; the Find layer fades out; the Book is exactly where it was | `swapMs` 150 | Gone at once | none | The Book never re-enters or scrolls |
| B-M23 | B-S06, tab switch [C NS-02] | Home or Me tab | The native tab swap; the query is cleared off screen | 0 | 0 | none | No fade-out on the way to another tab |

## 5. The letter page (B-S08) and its sheets (B-S09 to B-S16)

| Id | Screen and state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Never |
|---|---|---|---|---|---|---|---|
| B-M24 | B-S01 to B-S08.default, and back [B MOTION 5f, `CardToPage`] | A letter card (Book, Photos lens, Firsts lens) is tapped | Press holds at 0.98; a veil of the page's paper comes up over the Book while the card holds; one paper surface grows from the card's rect to the screen, radius `md` to 0; the card's words are carried, unscaled, to their place on the page; the rest of the page (picture, Play, Share, "This letter", Delete) fades in once the words are home (`homePt` 4 pt). Back reverses it; the veil lifts over 280 ms once the paper is within 24 pt of the card | veil `lamp.leaveMs` 160 linear; hold 136; paper `standard`; rest from `contentFrom` 0.6; back veil `lamp.returnMs` 280 | The 200 ms hand-off both ways (leave over 140, arrive from 80 over 120); nothing moves | none | No scale of text, no blur, no dim on top of the veil; the page has no lamp and no loop (a voice may play here) |
| B-M25 | B-S08 from a card with no matching text column [B MOTION 5f fallback] | A deep link, a cold start on a letter, a card at another Reading Size, a Photos lens card at AX5 (thumbnail stacked above the words), the Home slips (B-S17, B-S18) | The 200 ms hand-off of B-M24's Reduce Motion column, in every motion setting | `fadeMs` 200 | same | none | Paper alone never shows: paper and words arrive together |
| B-M26 | B-S08, focus [B MOTION 5f "Screen readers read the letter once"] | The page has arrived (carried or faded) | VoiceOver focus moves to the dateline, the level 1 heading (NS-21-R4) | at arrival | same | none | Focus never lands on a carried copy |
| B-M27 | B-S08, a row's sheet (B-S09 day, B-S10 who can read it, B-S11 picture words, B-S13 hide until a day, B-S14 Open now, B-S15 delete) [B `ui/sheet.tsx`, `ConfirmSheet`, `DateSheet`] | A row in "This letter", or Share, or Delete | The sheet rises; the page keeps its place; the date picker inside is the system's | `standard` spring; scrim fade | Sheet and scrim fade 200, no travel | none on open | No custom picker animation; sheet content adds no entrance |
| B-M28 | B-S08, a change confirmed (day, who can read it, words and place) [B `letter/[id].tsx` `changeDate`, `toggleInBook`; P for new rows] | Save or the choice in the sheet | The sheet closes. The row's value text is replaced in place with a cross-fade; if the dateline changed, it is replaced the same way. A one-line toast (where `content` gives one) enters | value `swapMs` 150; sheet `standard`; toast `enter` | value 150 fade; sheet 200 fade; toast 200 fade | `tap` | The row never flashes, slides or highlights; the page never scrolls to it |
| B-M29 | B-S12 mark a first: toggle and label field [C NS-06-A15 "Motion: none beyond the system toggle"] | The toggle "This was a first" | The system toggle's own thumb movement. The label field is there on the next frame, empty; the rows below it take their new places at once. Unmark: the field is gone at once; Undo puts both back at once | System toggle; field 0 ms | System toggle (iOS reduces it itself); field 0 ms | `tap` on both directions; `tap` on Undo | No celebration, no stamp, no star, no confetti, no glow on the card; no enter on the field (supersedes the 11 Nov spec's 8 pt enter) |
| B-M30 | B-S11 picture on the letter page: added, changed, taken off [C NS-01 Motion "None new beyond existing fades"; 11 Nov spec section 7 kept where the card agrees] | Added from the picker; changed; Take the photo off; Undo | Added: the picture's box takes its place at once (reserved from the picker's size) and the picture fades in; the words below move to their new place on `standard`. Changed: the new picture cross-fades over the old in the same box. Taken off: the picture fades out, the words close up on `standard`, the Undo toast enters. Undo: the reverse of taken off | fade `fadeMs` 200; change `swapMs` 150; close-up `standard`; toast `enter` | Fades only, 200 ms; words move to their place at once | `tap` on add and change; `warning` on Take the photo off (undoable, MOTION 6); `tap` on Undo | No zoom, no Ken Burns, no parallax; the system picker is the system's |
| B-M31 | B-S13 hide until a day, confirmed [C NS-06-B15 "Motion: none on opening"; P] | Confirm in the date sheet | The sheet closes; the Sealed until row shows the chosen day in place (value `swapMs`). The words on the author's page do not change or dim | `swapMs` 150; sheet `standard` | 150 fade; sheet 200 fade | `tap` | No envelope closing, no lock, no wax seal, no fold, no dimming of the words; no `sealed` sound (that is Keep's, SOUND 4) |
| B-M32 | B-S16 the hidden row in the Book [C NS-06-B2, B6] | Always | Nothing. The row is static, like a quiet-day row. Tapping it (author only) opens the page with the B-M25 hand-off | 0; tap 200 | same | none | No shimmer, no frosted glass, no blur over hidden words, no ticking day count |
| B-M33 | B-S14 Open now, confirmed [C NS-06-B3; P] | Confirm (default Cancel) | The sheet closes. The Sealed until row leaves "This letter": it fades out and the rows below close up. The words were already on the author's page and do not change | row `exitMs` 160; close-up `standard` | row 200 fade; close-up at once | `tap` | No reveal: the words never fade in, unblur or "open" on screen |
| B-M34 | B-S15 delete [B S35, S36, `letter/[id].tsx` `remove`, `BookRow`] | Delete confirmed in the sheet ("Keep it" is the default) | The page goes back into its card (B-M24 back); the card leaves its row (fade) while the rows below close up; "Letter deleted." enters with Undo. Undo: the card is back in its row with the B-M06 wash | card `exitMs` 160 then rows `standard`; toast `enter`; wash 1600 | card fade 200, rows at once; toast fade 200; wash static then fades | `warning` on delete; `tap` on Undo | No crumple, no slide to a bin, no shake; the Undo toast never times out (it carries an action; T4) |
| B-M35 | B-S08, Reading Size and "Exactly as said" [B MOTION 5i] | A step in the Reading Size sheet; the view switch | The words cross-fade at the new size or view; the scroll stays anchored to the paragraph at 40 percent of the height | `swapMs` 150 | same | `tap` per step | Font size never animates |
| B-M36 | B-S08, Play [B, player owned elsewhere] | Play | The player's own control state; nothing on the page moves with the voice in v1 | none | none | none (playback has none) | No waveform, no word highlight (read-along is parked, B-M45) |

## 6. Home slips (B-S17, B-S18) and Read together (B-S19, B-S20)

| Id | Screen and state | Trigger | What moves | Duration and easing | Reduce Motion | Haptic | Never |
|---|---|---|---|---|---|---|---|
| B-M37 | B-S17.present, one past letter on Home [B `index.tsx` `enter(3 + i)`; C NS-23 Low Power and Reduce Motion rows] | Home on a cold launch, when the slip is due | The card enters with Home's cold-launch content: opacity 0 to 1, y 8 to 0, in its stagger place after the prompt. On a warm return or a tab switch it is simply there | `enter` 280, `easing` | No enter at all: rendered complete (NS-23 "No enter animation") | none | No "A year ago" stamp animating, no ribbon, no glow; the excerpt's end fade (`ExcerptFade`) is static |
| B-M38 | B-S17 to B-S08 [B resurfaced-card.tsx header] | The card is tapped | The card's words are not in the page's column: the B-M25 200 ms hand-off; Back returns to Home with nothing re-entering | 200 ms | same | none | No carried words that would reflow |
| B-M39 | B-S17.dismissed [C NS-23-R14; P motion] | "Not today" | The card fades out; whatever sits below it closes up. VoiceOver focus moves to the next element after the card | card `exitMs` 160; close-up `standard` | card 200 fade; close-up at once | none (a quiet choice, not an outcome to confirm) | The capture controls never move (they are pinned below the scroll at default sizes; at AX sizes they ride above the card, so they do not move either) |
| B-M40 | B-S17 at local midnight, Home on screen [C NS-23-R13; P] | The day changes while Home is open | Nothing at midnight. The new choice shows at the next render cause (focus, launch, a store change) with no animation | 0 | 0 | none | A card never swaps under the eye |
| B-M41 | B-S18 the seal-opened line on Home, and the opened letter in the Book [C NS-06-B4, B6, B15, B24] | The instant has passed | Nothing animates, on any phone, in any setting. There is no timer at the instant: the visibility check runs at render, so the letter is open at the next render cause (launch, focus, a store change). In the Book the hidden row (B-S16) is replaced by the letter card in one frame, with no wash. On Home the line renders complete with Home, even on a cold launch (it is exempt from Home's content enter, so it never "arrives"). The words show only when the parent taps (B-M25) | 0 | 0 | none | No reveal, no unblur, no envelope, no wash, no sound, no badge, no notification, no count, no confetti (supersedes the 11 Nov spec's "cross-fade from the closed row to the card") |
| B-M42 | B-S18, the other parent's phone after the instant [C NS-06-B8] | The letter arrives by sync as a normal letter | Exactly what any of the other parent's letters gets the first time: B-M07's wash, once. Nothing tells them it was ever hidden | 1600 | static then fades | none | No different treatment from any other new letter of the other parent |
| B-M43 | B-S01 or B-S08 to B-S19 [B MOTION 5l row 8] | Read together (whole book, or a year from B-M16) | A cross-dissolve into the room; the Book's lamp leaves; at night the room's dusk pool arrives once behind the controls (never behind the words). Controls are there from frame 1 | dissolve `route.dissolveMs` 280; Book lamp `leaveMs` 160; dusk pool `arriveMs` 1200 (opacity only) | Dissolve 200; the pool at its level at once | none | No title card, no year banner, no count |
| B-M44 | B-S19 page turn [B MOTION 5m, `PageTurn`, `pageTurnPlan`] | "Next letter" or "Back one"; a horizontal swipe; Keep playing turning on its own | Next: the page moves 24 pt left over 160 ms, its words gone by 104 ms; the next page comes from 24 pt right on `standard`, fading in over 200 ms from 52 ms. Back mirrors it. A swipe follows the finger: past a quarter of the width or a fling of 600 pt/s it turns, otherwise it settles back on `snappy`; at the first or last letter the page meets a soft edge at a quarter of the travel. The 2 pt progress hairline steps to its new length with no animation | out `exitMs` 160; in `standard` + 200 fade; swipe settle `snappy` | A 200 ms cross-fade; the page does not follow the finger (the buttons and VoiceOver's actions turn it) | none | No curl, no page shadow, no count on screen; the hairline never animates (it would read as a progress bar filling). Sound: `page_turn` (Paper sounds on) only on a tap or swipe turn while nothing plays; never on Keep playing's own turn |
| B-M45 | B-S19, a call or the app going inactive [C NS-24-R8] | Interruption | Playback pauses with the audio session; the page stays; nothing moves on return | 0 | 0 | none | No resume animation, no "welcome back" |
| B-M46 | B-S20 end of the year or the book [B `read-together.tsx` `EndOfBook`, MOTION 5h; C NS-24 happy path 4] | The page after the last letter | The moon draws on once, then nothing moves; the dusk pool dims to half. Buttons are there from frame 1 | draw `drawMs` 1200; dim `arriveMs` 1200 | The moon shown complete, with a 200 ms fade of the page; the pool at half at once | none | No summary, no count of letters, no "year in review", no fireworks; it never redraws while the page stays |
| B-M47 | B-S19 or B-S20 back to the Book [B MOTION 5l row 8] | Close | The dissolve out; the Book's lamp returns; nothing in the Book re-enters; the list is where it was | dissolve 280; lamp `returnMs` 280 | 200 fade; lamp at level | none | No scroll of the Book to "where you stopped" |
| B-M48 | B-S23 read-along (NS-29, parked: decision record only) [B MOTION 5g] | Not built | Nothing in this area. If it is ever ranked, MOTION 5g's model stands: a wash that follows the audio clock, minimum dwell 120 ms, line follow 450 ms; Reduce Motion: the wash jumps and the scroll pages | n/a | n/a | none | Not drawn in the prototype as a working feature |

## 7. Moments over 300 ms, and why each is allowed

None is new in this area; each is a built house motion that a card points to.

| Moment | Length | Why |
|---|---|---|
| B-M01 header settle (`gentle`) | about 500 ms to 1 percent | Built MOTION 5a; first Book view per session only; opacity starts at 0.6, so the header is readable from frame 1 |
| B-M06, B-M07, B-M34 Undo, B-M42 wash | 1600 ms | Built MOTION 5e; a fading background tint behind words that are already there, not a transition; nothing waits on it |
| B-M43 dusk pool | 1200 ms | Built MOTION 5k; Read together's light, opacity only, once per opening, at night only; the room is usable at once |
| B-M46 moon draw and dim | 1200 ms | Built MOTION 5h, S31; NS-24 happy path 4 names "the existing end of the book"; it plays once on a page with nothing else to do |
| B-M01 sixth card | starts at 150 ms, ends at 430 ms | Built 5f stagger, first view only; under the 900 ms `sequenceMaxMs` |

Every transition between places (B-M12, B-M15, B-M17, B-M20 to B-M25, B-M43 dissolve, B-M44) completes inside 300 ms. The card-to-page growth runs on `standard` after a 136 ms hold: its words reach `homePt` within the NS-34 900 ms named hand-off and NS-21-R8's p95 300 ms interactive budget is about the page taking touches, which it does from its first frame (controls never wait on the spring).

## 8. Haptics in this area (MOTION 6; `lib/haptics.shared.ts` intents)

| Moment | Intent (iOS / Android) | Ids |
|---|---|---|
| A fact about a letter changed: the day, who can read it, a first marked or unmarked, a seal set, Open now, a picture added or changed | `tap` (`selectionAsync` / `Segment_Tick`) | B-M28, B-M29, B-M30, B-M31, B-M33 |
| Undo of a delete, of Take the photo off, of an unmark | `tap` | B-M29, B-M30, B-M34 |
| Delete confirmed; Take the photo off | `warning` (`notificationAsync(Warning)` / `Reject`) | B-M30, B-M34 |
| Quiet this book, Unquiet, Hide this book | `tap` | B-M10, B-M11 |
| Reading Size step | `tap` | B-M35 |
| Opening the Book, a letter, Find, a sheet, a menu, Read together; scrolling; switching books; a lens; Go to a month; a year; a page turn; the seal opening; a past letter shown, tapped or dismissed | none | all others |

No `success` anywhere in this area: the one `success` belongs to Keep (area A). A haptic always comes with a visible change (MOTION 6), and no haptic plays while a letter's audio plays.

## 9. What never animates in this area

- A sealed letter, at any stage: setting the seal, the hidden row, the day it opens, Open now (B-M31 to B-M33, B-M41).
- A first: no stamp, star, ribbon or glow when marked or in the Firsts lens (B-M29).
- Any number: there is none on screen, so nothing counts up or down (Find, lenses, year rows, Read together's position is VoiceOver only).
- Read together's progress hairline (B-M44).
- Find results while typing (B-M18).
- The Book's list position: no animated scroll anywhere (jumps fade, B-M15; arrival is placed, B-M06).
- Font size (B-M35).
- Loops: none on any screen in this area (no lamp breath: the `book` scene is still, Read together's pool is still, the letter page has no lamp). The empty Book's closed cover is still (`BookCover animate={false}`), so the `emptyBreathMs` breath is not used here.
- Skeletons, shimmer, spinners on local reads (every read in this area is local).

## 10. VoiceOver, Switch Control and focus during motion

- During card to page, the Book is hidden from VoiceOver (`useHiddenBehindCardPage`), the carried words are hidden, and focus lands on the dateline at arrival (B-M26).
- During a page turn the leaving page takes no touches and is hidden (`aria-hidden` on web); VoiceOver hears "Letter n of m" after the turn (as built; position in words, no number on screen).
- Find announces "Letters found" or the no-match line once (NS-02-R11), after the rows are drawn, never per keystroke.
- When a row leaves (B-M33, B-M34, B-M39), focus moves to the next element, never to the top of the screen.
- With Switch Control, an Undo toast stays until the parent moves on (T4).
- Every gesture has a button: swipe turns have Next and Back; the menu items are commandable by their visible labels.

## 11. Reconciliation notes for DESIGN.md and WORDS.md

States this file names that DESIGN.md should carry (PROPOSED names): `B-S01.firstView`, `B-S01.arrived`, `B-S03.lensAppears`, `B-S03.lensGoes`, `B-S04.thumbPending`, `B-S06.idle`, `B-S06.results`, `B-S06.noMatch`, `B-S06.failed`, `B-S08.carried`, `B-S08.faded`, `B-S17.present`, `B-S17.dismissed`, `B-S18.present`, `B-S19.turning`, `B-S20.end`. Strings this file assumes exist (for `content`): the toast after Quiet this book (optional, B-M10), "Letter deleted." with Undo (existing key `copy.settings.delete.entryToast`), the Take the photo off toast with Undo, the unmark Undo line.

Superseded from the 10 and 11 Nov specs (the card wins, BRIEF section 1 item 5):
- `02-FIND-11nov.md` section 7 "Results enter, `enter` for the first six rows, staggered": replaced by B-M18 (NS-02 "typing never animates the list"). "Match opens its letter, card to page": replaced by B-M20 (the row is not in the page's column, so the page fades in whole).
- `04-FIRSTS-AND-SEALED-11nov.md` A6 "Label field: `enter` 8 pt, 280 ms": replaced by B-M29 (NS-06-A15 "none beyond the system toggle"). B7 "Row appears with `enter`" and "a `fadeMs` cross-fade from the closed row to the card": replaced by B-M32 and B-M41 (NS-06-B6, B15).
- `01-PHOTO-WITH-A-LETTER-11nov.md` section 7 "Lens switch, cross-fade `swapMs`": replaced by B-M12's 200 ms out-and-in list fade, the shape the built month jump already uses, so the Book has one way of replacing its list. "Haptic: `tap` on selecting in the chooser": not applied to the lens (B-M12, gap G5).

## 12. Card gaps (card row, what is missing, proposed default)

| # | Card row | What is missing | Proposed default |
|---|---|---|---|
| G1 | NS-06-B4, B24 | What the Book shows if it is on screen at the instant a seal opens | No timer; the letter opens at the next render cause (focus, launch, store change), in one frame, no wash (B-M41) |
| G2 | NS-06-B4 with the frame's slip order | Home's cold-launch content enter would make the seal-opened line "arrive", which reads as a reveal | The seal-opened line is exempt from Home's enter and renders complete (B-M41) |
| G3 | NS-37-R3 | When a regenerated list copy appears | At the card's next mount, never into a card on screen (B-M05) |
| G4 | NS-01-R10a, R12; NS-06-A3 | The lens switch motion, where each lens opens, and what happens when the lens on screen goes away | 200 ms out-and-in list fade; Months keeps its place for the session; Photos and Firsts open at their top; a lens that goes falls back to Months with the same fade and no message (B-M12, B-M13) |
| G5 | NS-01-R48 with COMPONENTS `ChoiceGroup` | `ChoiceGroup` plays `tap` on a choice, but MOTION 6 makes navigation silent; a lens is a way of reading, not an outcome | No haptic on the lens choice |
| G6 | NS-23-R14 | The motion of "Not today" | Card fades over `exitMs`, the rest closes up on `standard`; Reduce Motion: fade 200, close-up at once; no haptic (B-M39) |
| G7 | NS-23 Reduce Motion row "No enter animation" | The house rule turns an enter into a fade; the card removes it entirely | The card wins: rendered complete under Reduce Motion (B-M37) |
| G8 | NS-02 section 15 | The transition from a result row to the letter page, and back | The 200 ms hand-off both ways (B-M20, B-M21) |
| G9 | NS-24 section 3 | The hand-off from the year row in the sheet into Read together | One dissolve over the closing sheet (B-M16) |
| G10 | NS-22 Reduce Motion row | Whether Quiet this book gives any visible confirmation (MOTION 6 requires a visible change with a haptic) | The menu item's new label is the change; if `content` gives a toast, it is the visible change for the `tap` (B-M10). Without either, play no haptic |
| G11 | NS-06-A5 "Unmark in one tap; Undo restores" | Whether unmarking shows a toast (the Undo needs a surface) | An Undo toast as COMPONENTS 2.14, T4 window (B-M29) |

## 13. Engineering gaps (with the backlog row each belongs to)

| # | Row | Gap |
|---|---|---|
| E1 | BL-938 (header), BL-931 / BL-956 (Photos lens), BL-968 (Firsts lens) | A list swap for the lens choice using the `runJump` fade shape, with one saved place for Months per session; no code reads a lens today beyond #840's `LensRow` |
| E2 | BL-938, BL-931 | `ChoiceGroup` needs a way to play no haptic (a `haptic={false}` prop or a `navigation` flag) for the lens choice (G5); NS-01-R48 already moves the lens to `ChoiceGroup` or `ChipGroup` |
| E3 | BL-952 (Find) | #798's overlay: confirm it cross-fades over `swapMs` and appears at once under Reduce Motion (NS-02-R21), and that result rows have no `entering` or `layout` animation |
| E4 | BL-932 / BL-956 | The thumbnail fade (B-M04) only when a decode finishes after mount; none under Reduce Motion; a reserved box so the words never move; a regenerated copy waits for the next mount |
| E5 | BL-970 (sealed letters on the phone), BL-963 (slip registry) | No timer at the instant; the opened letter replaces the hidden row with no wash; the seal-opened slip exempt from Home's `enter` stagger |
| E6 | BL-946 (past letter) | "Not today" exit and close-up (B-M39) and focus moving to the next element; no midnight swap while Home is on screen (B-M40) |
| E7 | BL-947 (read the year) | Presenting Read together while the Months sheet closes, so the two motions are one (B-M16) |
| E8 | BL-937 (letter page list) | Value swaps in place (`swapMs`) for every row of "This letter"; the Sealed until row and an Undo-able row leave with `exitMs` and a `standard` close-up (B-M28, B-M33) |
| E9 | BL-968 | The Firsts label field appears with no `entering`; layout below moves at once (B-M29); the toggle's `tap` both directions |
| E10 | none found | `page_turn` sound is specified in SOUND.md but no sound ships today ("nothing is bundled"); B-M44 assumes it only once Paper sounds ships |
