# MomentCard and DayCollage (the day card)

Owner: `design-systems`. Status: PROPOSED, not built. Sources: G-02, G-04, DC-6, R10 to R17, R186, R195, R201, R208, R211, R212, R214, R154, R156, R158, PRD 5.3, EXP 2.3, 5.1, 5.7. Shared rules: `README.md`.

## 1. Purpose
One card is one thing the parent may tell {child} about: a day of pictures, an age day, a typed day, a question, an occasion. Two actions of equal weight, Continue and Not now. The card never counts, ranks or writes a title.

## 2. Anatomy (top to bottom)
1. Lead tile (`DayCollage`): one picture, or up to four where the first leads. The expand origin. Nothing drawn over it except R208's two marks. Fitted, framed with `mediaFrame` at `stroke.control`, radius `md`. Absent on cards with no picture (below).
2. Reason line: from the closed content list (R12), below the tile, never over it. `subhead`, `textMuted`. A machine line (R201), in the smaller interface face.
3. Date heading: weekday and date in the parent's locale, a pure function of timestamp, locale and zone (R16). `title2`, `asHeading`, `text`.
4. Place or occasion line when one applies: place only when away from home (R63), a 44 pt target that opens the two-choice sheet (R195); an occasion line for an occasion card. `subhead`. Hidden by "Hide places".
5. The parent's own label, only if they typed or chose it, in the letter face, a separate field and slot (R201). Never in the same slot as a machine line.
6. Optional "A letter is here" row, only if a kept letter exists for the day.
7. Two actions: Continue and Not now, `Button variant="outline"`, same size, width and outline, at least `target.action` (48; token gap in `README.md`) tall and never below `target.min`.
8. Card menu button (a visible 44 pt `IconButton`, label from content) holding: "Not this one" (this day never again, absorbs "Hide this day"), "Hide this place", "Name this day", each with Undo (`01-undo-row.md`), and in the day sheet only "Leave out this picture".

Surface: flat, `surface` on `bg`, `line` hairline, no lamp, no shadow (PRD 14.1). Card radius `md`.

### Cards with no picture (G-02)
Age day, typed day, question, public holiday, occasion with no pictures: same anatomy without the lead tile and without blank padding. The card is shorter, never padded to a picture card's height (L3: at most 60 percent of a picture card on an iPhone SE 3 at default size, ASSUMED, tuned at the card sort). The expand origin is the card's own measured frame (an empty paper surface, nothing carried); unmeasured falls back to the door's rise (EXP 5.2). A question card's Continue opens capture directly with no pick sheet; "Another thought" swaps the words in place with a `motion.swapMs` cross-fade, `selection` haptic.

## 3. Target model (DC-6, settles R211 against R186 and R212)
- Lead tile and Continue open the sheet. The text block is not a target. Not now is a one-tap set-aside with Undo. Menu opens the verbs. No gesture without a button (R150).
- The face word is "Not now" with effect "until the next local day" (R28); "Not this one" (never in For you or Recent), "Hide this day", "Hide this place" stay in the menu, each undoable. `content` owns the face word and may change it; if `content` picks "Not this one" the effect and the Undo line follow with it, with no design change.

## 4. States
| State | What shows |
|---|---|
| Default | As above |
| Pressed | Lead tile and buttons: `motion.press` scale; Card press 0.98 where the Card is the target |
| Loading picture | A flat paper tile in the tile's fixed frame; no spinner or shimmer; a low-quality version cross-fades to final in place; a failed picture keeps its frame, quiet (A2-R8 to R10) |
| Set aside | Card fades over `motion.exitMs`, cards below close the gap on `motion.standard` clamped; no confetti, check or count; Undo row appears |
| Undone | Card returns to its slot with `motion.enter` and the `tap` haptic |
| Example (K-EX) | Not this component: `ExampleCard` is inert; do not reuse these actions |
| Place hidden | Place line absent; nothing says it was hidden |

## 5. Tokens
Colours `surface`, `bg`, `line`, `controlBorder`, `mediaFrame`, `text`, `textMuted`, `accent`, `focus`; `space[2]`, `space[3]`, `space[4]`; `radius.md`, `radius.sm`; `stroke.control`, `stroke.focus`; `target.min`, `target.action` (proposed); `Text` `title2`, `subhead`, `letterBody` (the parent's label); `motion.press`, `motion.enter`, `motion.exitMs`, `motion.swapMs`, `motion.standard`, `motion.fadeMs`; `tokens.picture` maxima for the tile. No raw value.

## 6. Dynamic Type
- Default: tile at the card's full inner width, actions side by side.
- From AX1: lead tile one column at full width, reason line and date stay, the place line wraps, Continue and Not now stack, Continue first, full width, the menu stays a visible button (C-1). The duration mark stays fixed size and the duration is also text under the tile (R208).
- AX5 with Bold Text on an iPhone SE 3: the date heading wraps and never truncates, the parent's label wraps and never truncates; only the heading and the first card's reason and date must be visible above the fold (G-06). The For you and Recent switch never stacks (R211).

## 7. VoiceOver and order (G-04, R214)
Four stops a card, at most 16 in For you:
1. The information group, one non-actionable element. Its name is the reason line, the date, the place line when shown, and the parent's own label, in that order, in one phrase (R214). A collage has no machine description, no count, no place of its own (R154). A card with a picture adds the file kind only.
2. Continue.
3. Not now.
4. The menu button.
The lead tile is not a separate stop (it duplicates Continue) but still opens the sheet by touch.
Custom actions on the information group: "Not this one", "Hide this place", "Name this day", each also a visible menu item.
Voice Control: each control's name begins with its visible label; Continue carries the date in its hint, never in the name; the numbers overlay disambiguates repeated names.
After a set-aside, focus goes to the next card's heading, or the tab heading if it was the last (EXP 5.7). Example cards are named with "Example" (R160).

## 8. Motion
Tab to sheet: a measured-rect expand on `motion.standard`, overshoot clamped, about 400 ms and never above 420 ms; the lead tile is carried, the rest fades in from 60 percent; scrim 200 ms (EM-01). Reduce Motion: a `motion.fadeMs` cross-fade, no carry. First view: at most three blocks settle once per install with `motion.enter` and `motion.staggerMs`. No other card motion.

## 9. Targets
Continue, Not now, the menu button, the place line and the lead tile each at least `target.min`, 8 pt (`space[2]`) apart.

## 10. Words
Reason lines come from the closed list in `packages/content` (R12; the 15 first-release lines of PRD 6.4a). The actions, the menu verbs, "A letter is here" and the VoiceOver hints are content keys. No free text on any card; no title, caption, venue, person, scene, mood, count, "best" (R11).

## 11. Test list
- MC-T1 L0: card model kind to anatomy table for K-DAY, K-BIRTH, K-AGE, K-YEAR, K-PROMPT, K-PICK, K-LIB.
- MC-T2 L0 and L1: `machineLines` and `parentLabel` are disjoint types; no assignment compiles; no component renders both in one slot (R201).
- MC-T3 L2: Continue and Not now have equal measured size and width at default and AX5; neither filled.
- MC-T4 L2: lead tile and Continue open the sheet; the text block does nothing; the menu verbs each undo.
- MC-T5 L2: Not now hides until the next local day; "Not this one" hides permanently; both from the menu and card; Undo returns the card.
- MC-T6 L2: no text over a picture except the duration mark and the selection check (R208 render scan).
- MC-T7 L3: baselines per kind at default and AX5, light and dark, iPhone SE 3 and 16; a no-picture card is at most 60 percent of a picture card's height (ASSUMED).
- MC-T8 L3: iPhone SE 3 default, `maxY(Continue, Not now) <= tabBarTop` for the first card (G-06).
- MC-T9 L4: element order and names for six card kinds; every control's name starts with its visible label; the information group is not actionable; custom actions present.
- MC-T10 L2: Reduce Motion gives a fade with no carry; unmeasured card falls back to the door's rise.
- MC-T11 L1: content-rule scan (no count, streak, badge, "best", "memories"); no raw value; no string literal.
- MC-T12 L5: S1-23 with VoiceOver, Voice Control and Switch Control; DM-12 frame budget for the expand on an iPhone SE 3.

## 12. Android later
Same code. TalkBack custom actions use the actions menu; check the information group's name reads once.
