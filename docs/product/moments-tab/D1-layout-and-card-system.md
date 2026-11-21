# D1: Moments tab layout and card system

Status: PROPOSED (nothing here is decided, built or in `DECISIONS.md`) | 21 Nov 2026 | Lead: design lead D1 of 5 | Docs only | Family in every example: Asha. Words in quotes are intent for `content`, never final copy, and a PROPOSED word does not ship.

## 1. Purpose and scope

This file answers: where does Moments sit in the tab bar, what is on the screen, how do For you and Recent switch, what are the cards, and what do we add to the component library so it all holds on an iPhone SE 3, at AX5, in both themes, under Reduce Transparency and Increase Contrast.

In scope: tab position options and a recommendation, screen layout, the two parts and the switch, the card family, grid, spacing and type from tokens, tab bar and glass rules, new components and specs, light and dark, wireframes.

Out of scope (other leads or other files): motion and transitions between tabs (animation and transition leads), the requirement text for what For you ranks (product leads), words (`content`), the permission flow and legal text (xfn leads), route A or B (feasibility doc), the daily-return and nudge design (section 4 is only the design-system side: which card is the same signal as a push or an email).

I changed no token or component file. Everything below lands in later pull requests.

## 2. Inputs read

| Input | Path or id | Used for |
|---|---|---|
| Shared brief, with the later UPDATE | `/home/claude/moments-brief.md` | Scope, founder direction, constitution, position options |
| Design language v2 (version of record) | `docs/design/DESIGN-LANGUAGE-V2-21nov.md` (R1 to R5, sections 4, 5, 8) | Two layers, glass budget, T1 to T6 proposals, paper tab bar ships now |
| Tokens as built | `packages/design-tokens/src/tokens.ts` (colour, space, radius, type, elevation, motion) | Every value below |
| Shared components as built | `apps/mobile/src/components/ui/` (`card`, `empty-state`, `line-art`, `list-row`, `sheet`, `state-screen`, `text`, `button`, `toast`) | What to reuse |
| Component library and specs | `docs/design/COMPONENT_LIBRARY.md` (0.1 sheets, 0.3 tabs), `docs/design/COMPONENTS.md` | Reuse rule, tab bar status |
| IA of record | `docs/design/IA-FINAL-20nov.md` (three tabs Home, Book, Me; sections 3 and 4) | What the new tab changes |
| Memory Library day card | `docs/design/specs/MEMORY-LIBRARY-FLOWS-10nov.md` ML-S10 | The old day card the new cards extend |
| Home wheel (PR #1264) | branch `docs/product-home-engagement-wheel-21nov`, `docs/product/HOME-ENGAGEMENT-WHEEL-21nov.md` | Source order, gaps G1 to G6, Home versus Book line |
| Accessibility floor | `docs/design/specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md` | AX5 walk, headings |

Not found on 21 Nov: the three sibling docs (privacy and constitution, feasibility, design concept) and the market benchmark `wip/moments-b1`. `git ls-remote` showed no `wip/moments-*` branch and no matching branch name. I state assumptions where they matter and name where I reconcile (section 12). I did not open the founder screenshots; the brief describes them and I copied nothing from them.

## 3. Tab position: the options, one recommendation

The founder relaxed "default": position is an open IA question. Today the bar is three items, Home, Book, Me, paper, hairline, Phosphor icons, 13 pt labels, Large Content Viewer on iOS (`COMPONENT_LIBRARY.md` 0.3). The paper bar ships now; the system bar waits for SDK 58 and a device spike (design language v2 section 8, ruling 2). So every option below is drawn on the paper bar first.

Width check: iPhone SE 3 is 375 pt wide. Four items are 93.75 pt each, five are 75 pt each. A single-word label at 13 pt fits in both; a 44 pt target holds in both (width and height). "Moments" is the longest label (7 letters) and is the one to test at the largest Large Content Viewer size.

Option 1: Home default, Moments second (four tabs).
```
+-----------------------------------------------+
|  [moon]       [sun]        [book]      [person]|
|  Home        Moments       Book         Me     |
+-----------------------------------------------+
 selected tab: accent icon + label + 2 pt accent underline mark (never colour alone)
```

Option 2: Moments as a centre tab in a five-tab bar. A centre slot only makes sense if there is a fifth tab. The v3 IA draft (PR #789, "Home | Book | Share | Me") is the only candidate and it is a draft, not a ruling; a Share tab is also on the "Never a place" list in `IA-FINAL-20nov.md` section 3. So this option needs a fifth tab that does not exist.
```
+-----------------------------------------------+
| Home    Book   [Moments]   Share     Me       |
|  75pt    75pt    75pt      75pt     75pt      |
+-----------------------------------------------+
 a raised centre button (as in some social apps) is NOT proposed: it is a floating control
 on the navigation layer, it would read as the record button, and terracotta means recording.
```

Option 3: Moments default (first tab, four tabs).
```
+-----------------------------------------------+
| Moments       Home         Book         Me    |
+-----------------------------------------------+
```

Option 4 (named in the UPDATE): Moments inside Home. Not drawn as a bar; the tab bar stays three items and Home gains a For you and Recent switch. This conflicts with IA-R9 (Home lists no kept letters, fine, Moments are not kept letters) but also with the Home wheel rule that Home shows one slip and the picture entries live in the capture cluster (PR #1264 section 3). It would make Home do two jobs: say something (Home) and browse days. It also gives no new reason to open the app.

Recommendation (RECOMMENDED): Option 1, Home default and Moments second.

Why, in order of weight:
1. Home is where a letter starts (J4, kept unless the founder reverses it). A parent who opens the app tonight to speak should land on the one big Speak action. Moments is where they choose what to speak about, so it sits one tap away, next to Home, not before it.
2. Second position is the most reachable of the four on a phone after the first, and the order reads as a path: Home (say), Moments (what about), Book (read), Me (look after).
3. Four tabs fit on an SE 3 with room for AX label sizes (93.75 pt per item).
4. It keeps the Home wheel (PR #1264) valid: Home keeps one slip and one prompt; Moments holds the longer list.
5. It needs no new fifth tab and no centre control.
6. It can be reversed cheaply: moving to first position is a one-line order change and a one-line initial route change. Only the first-run walk and the "which tab on launch" test change.

Revisit rule: if in the five parent check (see Q-D1-1) fewer than a majority find Moments unprompted, test Option 3 before changing anything else.

MT-D1-R1. Tab order and count.
- Given the app has finished first run, when a parent opens it cold, then the bar shows Home, Moments, Book, Me in that order and Home is selected.
- Given any text size up to AX5, when the bar renders, then all four labels are one word each, none truncates, the Large Content Viewer shows the item at AX sizes, and each target is at least 44 pt.
- Test layer: component test (order, labels from `packages/content`, `accessibilityState.selected`), device pass on SE 3 at AX5 (founder or testers; simulator is not device evidence).
- Reversal the founder owns: the three-tab ruling (`infra/scope-stack-rank-and-ia-redesign-2026-11-19.md`) and `IA-FINAL-20nov.md` section 4 ("Three tabs, in every build").

MT-D1-R2. The bar carries no signal about content.
- Given there are new days, a card waiting or a photo moment, when the bar renders, then there is no badge, dot, number, glow or colour change on any tab. Never disable a tab (HIG Tab bars, read in the v2 research table).
- Test layer: component test (no badge prop exists), snapshot of the bar in both themes.

MT-D1-R3. Tab glyph and label.
- Working label "Moments" (content may propose a better single parent word with one verb in its sentence, per J1 to J10). Glyph: a line drawing of a sun on a horizon (Phosphor `SunHorizon`, to be confirmed in the icon set), chosen because a day is the unit. Never a sparkle, star or wand: those read as AI writes something (constitution: nothing implies AI writes anything). Under ruling 34 the glyph is re-tested in first-run testing and lives behind one mapping-table entry in `Icon`.
- Test layer: copy test in `packages/content` for the label, manual first-run test for the glyph.

## 4. The daily-return reason, and one signal for card, push and email

This section is the design side only; the policy and the budget live in the product and xfn docs.

The reason to come back each day is not a streak or a count. It is: "there is a day I could tell Asha about, and it takes a minute." Three facts hold it up without gap-counting:
1. What is on For you changes with the calendar and with what the parent did, not with a counter: a year ago today from their own letters, a day they typed, Asha's month or age day from the date of birth, one of 111 written prompts, and when allowed a day from their photos.
2. The first card is always real. If there is nothing special today, the first card is a prompt. The tab is never an empty promise (J5).
3. Opening Moments records nothing. There is no seen, unseen or new state. A card the parent leaves does not return as a reminder that they left it.

One signal, three outputs, drawn so they stay consistent:

| Moment signal (server may know it? ) | In-app card | Local push | Email |
|---|---|---|---|
| Typed occasion (yes: parent typed it) | Occasion card | Fixed text, inside NS-32 budget | Allowed: server knows the typed day |
| Month or age day from date of birth (yes) | Occasion card, kicker "Asha is 7 months" style | Fixed text | Allowed |
| A year ago from letters (letter date: UNVERIFIED whether the server holds the date; letters are on device first) | A year ago card | Local only | Allowed only if the server legitimately knows the date; otherwise none |
| Written prompt (yes: our own catalogue) | Prompt card | Fixed text | Allowed |
| Photo moment (NO: library never leaves the phone) | Day collage, picked photos | Local only, fixed neutral text, no thumbnail, no count (ML-3, NS-51) | Never |

Design rule that follows: a card's kind is named by its kicker word, never by an icon alone, so the push text and the card use the same plain noun. A push never carries a picture, and the card the push opens is the same card the parent would have found by opening the tab. Reversal note: ML-3 and NS-51 stay as written; nothing in the layout asks to overturn them.

## 5. Screen layout

One screen, one route, a vertical scroll. From top to bottom:

1. Large title "Moments" in `display` (34/41 serif medium), left aligned, scrolls away with content. It is the level 1 heading (NS-33 R1/R2 pattern: heading equals the tab label).
2. The switch: two segments, For you and Recent. It is pinned under the status bar when the title has scrolled away. Solid paper, a hairline below (`line`, decorative), not glass.
3. The part (For you or Recent), a single column of cards.
4. Bottom padding equal to the tab bar height plus `space.6`, so the last card is never under the bar. The paper bar is opaque so no scroll inset trick is needed; if the system bar is adopted later (spike) the scroll view uses the automatic inset.

Wireframe, For you, authorised, Asha (iPhone, light, default text size):
```
+-----------------------------------------+
| 9:41                                    |
|                                         |
|  Moments                          (display, serif)
|                                         |
|  [ For you ][ Recent ]   <- segmented, 44 pt high
|  -------------------------------------  <- hairline when pinned
|                                         |
|  +-----------------------------------+  |
|  | A year ago                  [More]|  |  kicker, title case
|  | Asha was 3 months old             |  |  cardTitle (from date of birth, a fact)
|  | "She laughed at the ceiling fan   |  |  letterBody, the parent's own words
|  |  today and would not stop."       |  |  verbatim opening words, never clipped
|  | Read the letter  >                |  |  quiet text button
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |
|  | Saturday 14 June            [More]|  |  kicker is the DATE only
|  | +-----------+ +-----------+       |  |
|  | |  photo    | |  photo    |       |  |  collage, parent's own photos
|  | +-----------+ +-----------+       |  |
|  | +-----------------------------+   |  |
|  | | Write about this day        |   |  |  one prominent action (accent)
|  | +-----------------------------+   |  |
|  +-----------------------------------+  |
|                                         |
|  +-----------------------------------+  |
|  | A thought to start with  [Another]|  |  tinted card: the one warm card
|  | What did Asha do today that made  |  |  prompt style, serif
|  | you laugh?                        |  |
|  | [ Speak ]  [ Type ]               |  |
|  +-----------------------------------+  |
|                                         |
| [ Home ][ Moments ][ Book ][ Me ]       |  paper tab bar
+-----------------------------------------+
```
The year-ago date, the day, the prompt and the occasion are examples of shape, not copy.

## 6. The two parts and how they switch

For you (what is meaningful) and Recent (newest first by day). Same card family, different order and density.

MT-D1-R4. The switch component.
- Given the Moments screen is open, when a parent taps a segment, then that part shows, the segment is selected, and the other part keeps its scroll position for the rest of the session.
- Given a cold start, then For you is selected, whatever was selected last.
- Behaviour: tap only. No horizontal swipe between parts (a swipe here would fight the edge back gesture and VoiceOver scrubbing, and brings no value). The change is a 200 ms cross-fade of content (`motion.fadeMs`) with no slide; under Reduce Motion the same fade (it is already the Reduce Motion form).
- Accessibility: the switch is a `tablist` of two `tab` elements, label "For you" and "Recent", `selected` state announced, 44 pt minimum height (52 at regular width). The selected segment is shown by a filled `accentSoft` pill plus a bolder label (`label` style), never colour alone. At AX sizes (label wider than half the row) the two segments stack vertically, each full width.
- Haptic: selection (existing pattern from Reading size), off under Reduce Motion is not required (haptics are separate), none on programmatic change.
- Test layer: component test (roles, selection, stacking at AX scale), device pass (VoiceOver rotor reads "For you, tab, selected, 1 of 2").

MT-D1-R5. For you order (design view; product owns the rule).
- A card list built from the source order the Home wheel proposes, then library days when allowed: typed occasion today, month or age day, a year ago from letters, picked photos not yet used, library day, then one prompt. At most one prompt card at a time. The first card is always something real; the prompt is the floor.
- Given nothing applies, then For you shows the prompt card, the "Choose photos" ask if photo access is not given, and the example cards (Section 8, state value). It never shows a blank page.
- Cap: at most 6 cards at once with no "more" count, no end marker line saying "that is all" (ending language). The list simply ends. (UNVERIFIED number: 6 is a starting value for a five parent check, not a measured one.)

MT-D1-R6. Recent.
- Given library access (route B) or days the parent picked (route A), when Recent shows, then it lists days newest first, each day a section header (the date in `kicker`, plus a weekday in full: "Saturday 14 June") and one day card under it. Days that already carry a kept letter are shown as a quiet "Read the letter" row, not as a card to write about (no "no letter for this day" ever).
- Given route A (Apple's picker sheet), then Recent is not an in-app list of the library (the app only sees what the parent picks). Recent shows a first row "Choose from your photos" that opens the system sheet and, under it, the days the parent has already picked, as picked photos cards. Marked UNVERIFIED assumption pending the feasibility doc.
- Order stable on refresh; no pull-to-refresh; new days appear at the top when the screen is next opened (never live).
- Test layer: component test (section headers are headings, order), UI test with fixtures (Asha only).

## 7. The card family

Reuse first: `ui/card` is the base. Every card is a `Card` (variants `raised`, `outlined`, `tinted`) with new content parts. Only one `tinted` card may be on screen (the existing rule in `card.tsx`: the one warm card on a screen). So the prompt card is tinted and no other card is. Cards are paper: no glass, no gradient, no scrim, no text on a photo.

Common anatomy (all five kinds):
- Kicker (top left), then optional card title, then the body part, then one action. A separate 44 pt "More" button (top right) opens a menu with "Hide this" (words PROPOSED; it never says "dismiss forever" or counts). Hiding is silent and reversible only by the card returning on its own day; nothing says "you hid 3".
- One VoiceOver group per card. Reading order: kicker, title, body, action, then More. The card body press target is the whole card except More, which is a sibling (not nested) so there is no button inside a button.
- Radius: `radius.lg` (20, 24 if T3 lands). Photos inside are inset by `space.2` (8), so their radius is `concentric(outer, inset)` = 12 now, 16 after T3 (`max(outer - inset, 4)`), per v2 R2.
- Padding `space.4` (16), `space.5` (20) at regular width. Gap between stacked parts `space.3` (12). Gap between cards `space.4`; between a section header and its card `space.2`.

### 7.1 Day collage card (a day with the parent's photos)
- Kicker: the date, as the system formats it for the parent's locale ("Saturday 14 June"). Nothing else is written by the machine: no title, no time of day, no outing, no place, no people.
- Collage: up to four of the parent's photos in one `DayCollage`. 1 photo: one tile at 4:3. 2: two tiles side by side. 3: one tile on the left at 2/3 of the width, two stacked on the right. 4 or more: 2 by 2, the four chosen by the app by time order only (no quality, face or scene pick, so no meaning is added). No "+12" overflow badge (it would count).
- Tile gap `space.1` (4). Tile radius sm (8) between tiles, concentric on the outer corners. A `mediaFrame` hairline `stroke.control` wide round the collage (needed in dark: ruling 27).
- Video: a small solid paper chip bottom left on the tile with a play glyph and no duration. Solid, not glass (glass budget), ink on paper so contrast holds on any photo. The VoiceOver label says "Video".
- Place: none by default. A place name appears only if the parent typed it (then in `subhead` under the kicker). No map tile.
- Action: one `Button` primary, "Write about this day" (PROPOSED words; one verb). Opens capture with these photos attached and an empty words field (NS-49 behaviour).
- VoiceOver label for the collage: "Photos from Saturday 14 June". Photo alt text is never machine-made; the parent's own words after they attach, or none.

### 7.2 Occasion card
- Source: a day the parent typed, a ticked day (NS-46), or Asha's month or age day from the date of birth.
- Kicker: the word for the kind ("A day you marked", "Asha is 7 months", PROPOSED). Title in `cardTitle`: the parent's own typed words, exactly as typed, never reworded or shortened (wrapped, no clamp). A computed age day shows only the fact (age) with no sentiment.
- `raised` variant with a 3 pt accent rule on the leading edge (the ML-S10 pattern), the rule is decorative; the kicker carries the meaning. The rule flips to the trailing edge in right to left layouts (Devanagari languages: layout mirrors).
- Action: primary "Write about it" (PROPOSED). Secondary quiet: "Speak" and "Type" choices live on the capture screen, not here; the card does not offer two capture buttons.

### 7.3 A year ago card
- Source: our own kept letters only (NS-23): a letter from the same day an earlier month or year.
- Kicker: "A year ago" or the exact earlier date (PROPOSED). Body: the letter's verbatim opening words in `letterBody`, with the quote pair (`QuotePair`) once. The excerpt length is a count of words fixed by `core`, so the text is complete at every Dynamic Type size and never line-clamped (D-027: letter text never truncated). It is the parent's own words, so no machine edit marks here.
- Action: quiet text button "Read the letter", opens that letter in the Book (a pushed route; the tab bar hides there per ruling 32). It does not start a new letter: it is a way into the Book, so J4 is not stretched here.
- The Home wheel doc lists this as a past letter slip (rank 4). If both Home and Moments show the same letter the same day, Home shows it and Moments shows the next candidate (open Q-D1-3).

### 7.4 Prompt card
- Source: the 111 written prompts (`packages/content/src/prompts.ts`).
- `tinted` variant, the one warm card. Text in the `prompt` style (serif 24/32). Kicker "A thought to start with" in title case (v2 R3; the all-caps form retires).
- Actions: primary "Speak" and secondary "Type", the same two as Home; and "Another one" as a quiet text button (PROPOSED words) at the top right that swaps the prompt with a 200 ms fade. No refresh icon alone (colour or glyph never the only signal). No count of prompts tried, no history of skips.
- No colour coding per category (colour is never a signal here).
- Reversal flag: this card starts a letter from the Moments tab, so J4 ("only Home starts a letter") is overturned unless capture opens from here as a pushed mode over the tabs and Home stays the named place. Recommended handling: Speak and Type here open the same capture route, over the tabs, exactly as from Home. The founder owns the J4 reversal.

### 7.5 Picked photos card
- Source: pictures the parent has already picked (level 1, NS-49) or picked through Apple's sheet (route A), not yet in a kept letter.
- Same collage as 7.1 with the kicker "Photos you chose" (PROPOSED) and the date they were taken only if the parent can already see it. Action: "Write about these". Same More menu, whose "Hide this" removes only the card, never the photo from the phone, and the card says nothing like "delete" (a destructive word would be wrong).
- Nothing about these is stored by us beyond what NS-49 already allows (see 10).

### 7.6 State cards (not part of the five, same family)
- Ask card (permission) and example cards: Section 8.
- Limited access note card: "Choose more photos" (system limited picker) and a quiet line; see Section 8.

Card state table (all kinds):

| State | Spec |
|---|---|
| Default | As above |
| Pressed | Scale 0.98 on `snappy` (existing `usePressScale`); Reduce Motion: no scale, background `accentSoft` for 120 ms is NOT used (no new motion); a visible pressed outline `focus` instead |
| Loading photos | Tiles show `surface` solid, no shimmer; thumbnail fades in over `fadeMs` (immediately under Reduce Motion). The card does not wait: it shows its kicker and action at once |
| Photo cannot open | The tile stays `surface` with a small paper glyph; the card still works; no error banner |
| Offline | Everything local still shows; cards from the server (none) are not needed |
| Hidden | Card is removed with a 160 ms exit (`motion.exitMs`), no undo toast (an undo toast would count it) |
| Focus (keyboard, switch control) | `focus` ring, 2 pt, outside the card edge |

## 8. States of the tab: the value before the permission

MT-D1-R7. Before any photo permission (value state).
- Given the app has no photo access decision (not asked), when a parent opens Moments, then For you shows our own example cards (illustrated, Asha) under the label "An example" and then the ask card.
- Example cards are drawn from the same components with line drawings (`LineArt`) in place of photos: paper and ink, no faces, no mascot (v2 R5). Each carries the visible words "An example" so it is never mistaken for the parent's real day. Examples are not tappable (no dead action): they have no button; the ask card is the only action.
- Order: heading, switch, ask card first (so the action is above the fold on an SE 3), then three example cards: collage, a year ago, prompt.
- Given the parent taps "Not now" then the tab shows what is real (typed occasion, month day, a year ago, prompt, picked photos) and one quiet line "Choose photos any time" at the end of For you, not a banner and not on every visit. "Not now" is a comfortable, equal-weight button (the two buttons are the same size; neither is hidden).
- Ask card words (PROPOSED, `content` and `legal` to clear; PRIV-R21 lines): Shown: the photos on this phone are used on this phone, one day at a time. Records: nothing about your photos leaves the phone and nothing is stored but what you pick. Never: we never read your photos for faces, places or what is in them, and never write about them. Decline: Not now, and Moments still shows your own days and prompts.
- Test layer: component test, content copy test, a legal-checked key list (xfn), VoiceOver pass.

States after the decision:

| Photo state | Moments shows |
|---|---|
| Not asked | Value state above |
| Authorised (route B) | Real day collages in Recent and For you; no ask card |
| Limited (route B) | Real cards from the chosen photos; one quiet card "Choose more photos" (opens the system limited-library picker) and nothing says what is hidden |
| Denied | Real cards from the other sources; one quiet card with a button that opens Settings; no repeat prompts, no red, no guilt line |
| Restricted (device policy) | Same as denied but with no Settings button (the parent cannot change it) |
| Route A (Apple's picker) | No ask card; a first row in Recent "Choose from your photos"; picked days as picked photos cards |
| First run still on | No Moments tab content is shown during first run (K-02 reversal: if the founder wants the ask in first run, it is the ask card, never a system dialog without it) |
| Child with no letters yet | Prompt card plus example cards; never "no letters yet" |
| Two books | Cards are for the active child (the switcher on Home, C-14); the large title does not carry the name |

Reversals the founder owns (listed once, in the order the brief gives them): J4 (7.4, capture from Moments), K-02 first-run rule (ask card exists on a tab, outside first run unless ruled), BL-1305 (route B needs a usage string and PhotoKit), ML-6 (thumbnails are shown, a place only if typed), and the three-tab ruling (section 3).

## 9. Grid, spacing and type, from tokens

Rule: never hard-code a colour, size or duration in a screen. Every value below names a token in `packages/design-tokens/src/tokens.ts`; names marked T are the v2 proposals (T1 to T6) not yet built.

| What | Token | Value now | After T |
|---|---|---|---|
| Screen gutter | `space.4`; T5 `gutter.compact` and `gutter.regular` | 16 | 16 below 390 pt, 20 above |
| Between cards | `space.4` | 16 | same |
| Section gap (For you groups, Recent days) | `space.9` compact, `space.10` regular | 40 / 48 | same |
| Card padding | `space.4` | 16 | `space.5` at regular |
| Parts inside a card | `space.3` | 12 | same |
| Collage tile gap | `space.1` | 4 | same |
| Photo inset in a card | `space.2` | 8 | same |
| Card radius | `radius.lg` | 20 | 24 (T3) |
| Photo radius | concentric | 12 | 16 |
| Segment height | min 44, list row min | 44 | 52 at regular (T5) |
| Elevation (raised card, light) | `elevation[1]` | one shadow | two layer (T4) |
| Dark raised card | `surfaceRaised` + `line` hairline | 1.10:1 step | `surfaceRaised` `#27231F` and `highlight` (T1) |

Single column at every width. On a wide phone the column is capped at the reading measure (`readingMeasure`, T2, 560 pt) and centred; the cap is lifted at AX sizes. No masonry, no two-column card grid (a two-column grid at AX5 would truncate or crush text, and it feels busy). Collages are the only grid, inside a card.

Type ladder (job per rung):

| Use | Style | Notes |
|---|---|---|
| Screen title | `display` | maxScale 1.6, wraps |
| Day section header (Recent) | `kicker` (T2; today `caption`) | title case; the date, weekday in full |
| Card kicker | `kicker` (T2; today `footnote`) | title case, never all caps |
| Occasion title | `cardTitle` (T2; today `title2`) | the parent's own typed words |
| Prompt | `prompt` | serif 24/32 |
| Parent's own words excerpt | `letterBody` | scales with Reading Size; never clamped |
| Place, if typed | `subhead` | |
| Segment label | `labelSmall`, selected `label` | |
| Buttons | `label` (existing `Button`) | |
| "An example" | `caption` | must be present on every example card |

`maxScale` rules: Dynamic Type scales all styles; text styles with a cap (`display` 1.6, `title2` 2.0) are the only places a cap applies and none carries letter text. Parent's words, prompts and kickers are uncapped (`prompt`, `letterBody`, `footnote` are null).

## 10. Tab bar and glass rules

- Paper tab bar now. Opaque `bg`, hairline `line`, four items, no glass, no blur. It stays until SDK 58 and the device spike (v2 section 8 rulings 1 and 2); then the system bar replaces it and adapts itself under Reduce Transparency and Increase Contrast. We never paint the system bar.
- Glass budget on Moments: zero of our own glass surfaces. The segmented switch is solid paper. The video chip is solid. The More button and the card action are solid. Nothing floats over the photos. With the system bar after the spike, the bar is the one glass surface on screen (the limit is three).
- No text on a photo and no scrim over a photo, so no contrast depends on what the photo looks like.
- If the system bar minimises on scroll (iOS 26 only, a spike result): Moments is a scroll view, not a FlatList of mixed items, if possible; otherwise leave the bar fixed. Not a pass criterion.
- Pushed routes (reading a letter, capture) hide the bar (ruling 32).
- Reduce Transparency and Increase Contrast: our surfaces are already solid; Increase Contrast turns on `highContrast` overrides (`line` becomes a visible 5.5:1 edge on light, `mediaFrame` follows). Cards keep a visible edge then.
- Under Bold Text the segment labels and kickers pick up the heavier face (the existing `useTheme` path); lines grow, nothing is clipped.

## 11. Light and dark

| Surface | Light | Dark |
|---|---|---|
| Screen | `bg` `#FBF8F3` | `bg` `#161412` |
| Card (raised) | `surfaceRaised` `#FFFFFF` plus `elevation[1]` | `surfaceRaised` plus 1 pt `line` edge (today) and `highlight` after T1 |
| Prompt card (tinted) | `accentSoft` `#F1E6DC` (text 12.07:1 per token note) | `accentSoft` `#3A2E25` (text 11.20:1, accent 5.99:1 per token note) |
| Photo frame | `mediaFrame` `#E6DED3` (1.26:1, only the page edge; the photo edge carries the shape) | `mediaFrame` `#716A62` (3.45:1 on bg, per token note) |
| Kicker text | `textMuted`: 5.51:1 on bg, 5.11:1 on surface (token notes) | `textMuted`: 8.01:1 on bg |
| Selected segment | `accentSoft` pill with `text` label | same tokens, dark values |

Contrast figures above are the ones recorded in the token file comments, not recomputed this session. Pairs I have not found a recorded ratio for: `textMuted` on `accentSoft` and `textMuted` on `surfaceRaised` in light. The kicker sits on `surfaceRaised` or `accentSoft`; the component test must compute these two pairs before the kicker colour is `textMuted` on a card (TDD 09 gap). Until then use `text` for kickers on tinted cards.

Dark mode: example line drawings take the dark `text` stroke; the paper tab bar uses dark `bg` with the dark `line`. Photos are never tinted or dimmed in dark.

## 12. New components and their specs

Reuse before building. What I reuse: `Card`, `Button`, `Text`, `QuotePair`, `LineArt`, `Separator`, `EmptyState` pattern, `Sheet` (for any picker steps we own), `ScreenHeader` for the large title (check it can be a large title, v2 R3), `ListRow` for the Recent "Read the letter" row.

New components to add to `apps/mobile/src/components/ui/` (and to `COMPONENT_LIBRARY.md` and `COMPONENTS.md` when built). The C3 `section-header` (v2) is a prerequisite for Recent.

MT-D1-R8. `SegmentedSwitch`
- Props: `options: {id, label}[]` (two), `value`, `onChange`, `accessibilityLabel`.
- Spec: sections 6, R4. Reduce Motion: no sliding thumb; the selected pill changes by fade.
- Test: unit for stacking at AX scale, role and selection state, 44 pt height.

MT-D1-R9. `MomentCard` (a wrapper over `Card`)
- Props: `kind: 'day' | 'occasion' | 'yearAgo' | 'prompt' | 'picked'`, `kicker`, `title?`, `body?`, `media?`, `action`, `onMore?`.
- Enforces the anatomy in section 7, the one-tinted-card rule and the sibling More button. It refuses any prop that would carry a count, a place not typed by the parent, or a machine title: there is no `title` prop on `day` and `picked` kinds (types make the constitution a compile error).
- Test: type test (no title on day), render tests per kind at AX5, VoiceOver order test.

MT-D1-R10. `DayCollage`
- Props: `items: {uri, kind: 'photo' | 'video', alt?}[]` (max 4 shown; extras ignored silently), `accessibilityLabel` (required, from the date).
- Layouts for 1, 2, 3 and 4; fixed aspect 4:3; gap, radius and frame from tokens; video chip solid; no overflow badge.
- Never loads full-size images (thumbnails only); never writes a filename, album or place to a label or log.
- Test: layout unit tests, label required, no `console` or analytics import (lint), memory check in the performance pass.

MT-D1-R11. `PermissionAsk` (card) and `ExampleCard`
- `ExampleCard`: the same layout as `MomentCard` with `LineArt` in place of photos, "An example" caption, no action, not focusable as a button (VoiceOver reads it as static text group with the word "Example" first).
- `PermissionAsk`: the Shown, Records, Never, Decline lines (PRIV-R21) in a `Card`, two equal buttons. Words from `packages/content/src/permissions.en.ts` once cleared; none inline.
- Test: copy test against the content rules and the no-real-family-data fixture rule; both buttons same size.

MT-D1-R12. Tokens to add (T-numbers from v2 where they exist)
- `kicker`, `cardTitle` (T2), `highlight`, `glassFallback` (T1), `concentric()` (T3), `gutter` (T5), `readingMeasure` (T2), and new here: `moments: { collageAspect: 4/3, collageGap: space.1, collageMax: 4, listMax: 6 }` so no screen holds a number. Each with a test beside it in `packages/design-tokens/test`.

MT-D1-R13. Content keys the cards need (to `content`, not written here): tab label, segment labels, kicker kinds, action verbs per card, "An example", "Another one", "Hide this", the ask card, the limited and denied lines, the VoiceOver labels. All one verb per action and all in the parent vocabulary (no "take", "entry", "draft", "pack").

## 13. Edge and unhappy paths

- A day with one photo: a single 4:3 tile; with 100 photos: four by time order, no count shown.
- Photo deleted after the card is built: the tile falls back to `surface`; if all are gone the card is removed on next open.
- iCloud only photo (not on device): the tile shows `surface` and loads when available; no spinner on the card; tapping works.
- A day that already has a kept letter: no write card; Recent shows a "Read the letter" row (R6).
- Very long occasion text typed by the parent (for example a 200 character line): it wraps in full at any size; the card grows; nothing is clipped (D-027 applies to the parent's typing here by the same rule).
- AX5 on SE 3: the switch stacks, the collage keeps the 4:3 tile (an image, not text), the action button is full width and its label wraps; the card may be taller than the screen and scrolls. No horizontal scroll anywhere on this tab.
- Right to left and Devanagari: leading and trailing swap; the accent rule and More button mirror. Hindi labels longer than English must wrap, not shrink.
- Reduce Motion: fades only (200 ms is already the form), no press scale. Bold Text: grows the type; test the segment.
- Reduce Transparency and Increase Contrast: nothing changes except stronger edges.
- Offline: all cards local; the tab works.
- Parent changes photo permission in Settings while the app is open: on return to foreground the tab re-reads the state and replaces the ask card or the cards, with a 200 ms fade, no toast.
- Date and locale: a date reads as the system date format for the language; time zone follows the device; no relative words ("yesterday", "3 days ago") because they count time since (gap counting).
- Very first open after the app updates: no "What's new" card on this tab.
- Two cards for the same day from different sources (a typed occasion and a photo day): one card each, the occasion first; no merge, because merging writes a story.

## 14. Constitution, privacy and accessibility checks

| Check | How the design holds it |
|---|---|
| The machine adds no meaning | No machine title, caption, summary, scene, place or person. The only words on a photo card are the date (a fact) and the parent's own text. No `title` prop on day or picked cards |
| No face matching, no scene guess | The collage picks by time order only |
| No counts, gaps, streaks, badges | No overflow "+n", no badge on the tab, no "new", no "n days without a letter", no "caught up", no relative time since |
| Nothing implies AI writes | No sparkle glyph, no "suggested for you" wording (PROPOSED words from content must pass this), the prompt is "A thought to start with" in our own voice |
| Never gender the child | `{child}` in any string; examples say Asha |
| Privacy | Nothing from the library in analytics, logs or crash reports: `DayCollage` has no logging; screen name only in analytics, no day, no count of photos. Thumbnails are never uploaded. The server never sees the library |
| Glass | Zero own glass on this tab; the system bar when adopted is the one surface |
| WCAG 2.2 AA | 44 pt targets (More button included), text contrast from the token pairs in section 11 (two light pairs to compute), focus visible, colour never the only signal (kicker words, selected pill plus bold), no motion beyond a 200 ms fade |
| VoiceOver | Large title is a heading; the switch is a tablist; each card is one group in a fixed order; More is a sibling; examples are read as examples |
| Dynamic Type | To AX5, nothing clipped, parent's words uncapped; the switch stacks |
| Reduce Motion, Reduce Transparency, Increase Contrast, Bold Text | Section 13 |
| iPhone SE 3 | The ask card and the first card are above the fold at default size; AX5 scrolls |

## 15. Open questions (each with a recommended default and a deadline)

| Id | Question | Recommended default | Owner | By |
|---|---|---|---|---|
| Q-D1-1 | Tab position (section 3) | Option 1: Home default, Moments second | Founder | Mon 23 Nov, before the first-run walk is drawn |
| Q-D1-2 | Does the tab glyph test well (sun on horizon) and is "Moments" the label | Test in the five parent check; fall back to the next word `content` proposes | content and design | before the tab is built |
| Q-D1-3 | Same past letter on Home and Moments the same day | Home shows it; Moments shows the next one | product | with the wheel rework of PR #1264 |
| Q-D1-4 | Does the capture start on Moments (J4 reversal) | Yes, as a pushed mode over the tabs, Home stays the named place | Founder | with Q-D1-1 |
| Q-D1-5 | Route A or B | Whichever feasibility rules; both are designed here (section 8 table, R6) | CTO | feasibility doc |
| Q-D1-6 | Cap of cards in For you (6 here) | 6 for the first test, measured later | product | five parent check |
| Q-D1-7 | Hide control on a card | "More" menu with one item for now | design | before build |
| Q-D1-8 | Pair contrast: `textMuted` on `accentSoft` and `surfaceRaised` in light | Compute in the token tests; use `text` until proven | design-systems | before the kicker colour is set |

## 16. Dependencies

- Tokens T1 to T6 (`#1221`, PR #1251), C1 to C3 (card, button, list row and section header) from the uplift build order, `Icon` wrapper, the paper tab bar change from three to four items in `app/(tabs)/_layout.tsx` (mobile).
- Product: the For you rule and the wheel rework (PR #1264); feasibility for route A or B; privacy and constitution analysis; the concept doc (`docs/design/MOMENTS-TAB-CONCEPT-21nov.md`), which I could not read: where it disagrees with this file, this file's tab position, card list and component specs are the starting point for the reconcile.
- Content: all words in 12 (R13). Legal and compliance: the ask card and the usage string. Market benchmark B1 (`wip/moments-b1`): not present on 21 Nov; to cite when it appears.
- Animation and transition leads: motion for the switch and for cards entering (this file allows only a 200 ms fade).
- Release: a real iPhone pass through TestFlight for any of this to ship; queue in `docs/release/FOUNDER_QUEUE.md` (not done here).

## 17. What is VERIFIED, UNVERIFIED and a guess

VERIFIED (read this session, in a clone at the head of `develop` on 21 Nov):
- Tokens, ratios in comments, `card.tsx` variants and one-tinted rule, `empty-state.tsx`, component list under `ui/`: `packages/design-tokens/src/tokens.ts`, `apps/mobile/src/components/ui/`.
- Design language v2 content, rulings and the build order: `docs/design/DESIGN-LANGUAGE-V2-21nov.md`.
- Tab bar is three items and paper, native tabs wait for a spike: `docs/design/COMPONENT_LIBRARY.md` 0.3, `docs/design/IA-FINAL-20nov.md` section 4.
- Home wheel rules, gaps G1 to G6 and the source order: branch `docs/product-home-engagement-wheel-21nov` (PR #1264).
- ML-S10 day card rules: `docs/design/specs/MEMORY-LIBRARY-FLOWS-10nov.md`.

UNVERIFIED:
- Any Apple platform behaviour not in the v2 research table (I read none new this session). Segmented control and tab role behaviour in VoiceOver on RN and the Large Content Viewer for four items: device test needed.
- Whether `ScreenHeader` can render a large title; whether Phosphor `SunHorizon` exists in the bundled set (the icon check was not run).
- Contrast pairs in section 11 marked as not recorded.
- Whether the server holds a letter's date (email, section 4).
- The sibling docs and B1: not on remote.

GUESS (to test, not measured):
- Four tabs at 93.75 pt fit "Moments" at AX label sizes; the 6 card cap; the 4 tile cap; that a majority of parents find the tab unprompted.
- I invented no numbers about users, uptake or engagement.

## 18. Content-rule self-check

No em or en dashes, curly quotes, ellipsis characters, emoji or model names in this file. Words quoted are PROPOSED intent for `content`. Examples use Asha only; nothing from the founder's screenshots is in this file.
