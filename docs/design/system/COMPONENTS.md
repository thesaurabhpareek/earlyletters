# Design system v2: components

Status: DRAFT for reconciliation, 20 Nov 2026. Lead: design-systems (components). Brief: `BRIEF.md` in this folder (the Apple facts in section 1 and the material policy in section 3 are decided and are not re-argued here).
Companions in this folder: `FOUNDATIONS.md` and `tokens.v2.json` (foundations lead), `MOTION.md` (motion lead), `AUDIT.md` (auditor), `REFERENCE.html` (every component in every state). Token and motion names below are written to those files' names; section 9 lists the reconciliation.
This file supersedes `docs/design/COMPONENTS.md` (2 Oct to 9 Nov 2026) and the component parts of `docs/design/COMPONENT_LIBRARY.md`; see section 10 (Retired). It changes no card (CR-66). Where a 10 or 11 Nov spec and a locked card differ, the card wins.

## 0. How to read this file

Every component has an id (`N` navigation and chrome, `A` actions, `C` content, `I` inputs, `F` feedback, `S` system). The e2e leads key screens to these ids (for example "A-S07 uses A1 prominent xl, I5, C6"). Each entry has the same fields:

- **Purpose**, **Anatomy**, **Variants and sizes**.
- **States**: default, pressed, focused, selected, loading, error; the absent rule; AX5 layout at 375 pt; VoiceOver label and traits; Voice Control name; Switch Control.
- **Layer**: `glass regular`, `glass clear + dim`, or `content` (BRIEF section 3).
- **Tokens**, **Motion hooks** (names from `MOTION.md`), **Implementation** (system component, `expo-glass-effect`, or a house RN component, and what changes from today's file), **Used by** (cards and e2e screens).
- `NEW` marks a component that does not exist today, with its justification. `RETIRES` names what it replaces.

Sources for Apple facts are the ones listed in `BRIEF.md` section 1 (HIG Materials, Adopting Liquid Glass, Expo SDK 57 docs). Read again this session: Expo `expo-glass-effect` v57 reference (props, `isGlassEffectAPIAvailable()`, the opacity rule), Expo Router native tabs guide (`minimizeBehavior`, `BottomAccessory`, `role="search"`, colour props ignored on iOS 26) and Expo Router Stack toolbar guide (`Stack.Toolbar` with `left`, `right`, `bottom` placements, `Button`, `Menu`, `MenuAction destructive`, `Spacer`, `View`; no nesting). Anything else that names an API is marked UNVERIFIED.

## 1. System-wide rules (every component)

### 1.1 Layers and the glass budget
1. **Style is semantic; material follows the layer.** A component asks for a style (`glass`, `prominent`, `plain`, `destructive`). A `GlassLayer` context (section 8, NEW) tells it whether it sits in the glass layer. In the glass layer `glass` and `prominent` render as `GlassView`; in the content layer the same component renders its solid twin (`glass` becomes `bordered`: `surfaceRaised` fill and a 1 pt `controlBorder` edge; `prominent` becomes `filled`: `accent` fill, `onAccent` label). Shape, size and label never change between the two. This is how one Button serves the toolbar and the Save a copy page without putting glass in content.
2. **One `GlassContainer` per cluster.** Neighbouring glass shapes (Speak and Type, the Book header's Find and More, the Find field and Cancel) live in one container so they merge and morph. Never glass inside glass: a glass button is never placed on a glass sheet or a glass bar; inside a sheet, buttons are `plain`, `bordered` or `filled` (the sheet is the glass).
3. **At most three glass surfaces visible at once.** Budget per screen (a container counts once):

| Screen | Glass 1 | Glass 2 | Glass 3 (transient) |
|---|---|---|---|
| Home (A-S01) | Tab bar (N1) | Capture cluster (A2) | Undo toast (F1) or a sheet |
| Book (B-S01) | Tab bar | Book header controls (N5) | Toast, or Find bar (N4) which replaces N5 while open |
| Letter page (B-S08), pushed | Tab bar | Navigation bar buttons (N2) | Toast or menu |
| Listen, Review, Write (modal, tab bar hidden) | Navigation bar buttons (Close) | Record control (A3) or bottom toolbar (N3) | Toast or the Keep gate sheet (F4) |
| Picture viewer (C4 viewer) | Close and Change (clear + dim) | none | Toast |
| Me and settings (C-S01 on) | Tab bar or navigation bar | none | Toast or sheet |

4. **Content never wears glass**: letters, Book pages, letter page body, Read together pages, letter lists, cards in the flow, settings lists, empty states, state screens. Separation there uses paper tokens (`bg`, `surface`, `surfaceRaised`, `line`) or a standard material (`material.content.*`).
5. **Fallbacks.** Reduce Transparency on, iOS earlier than 26, `isGlassEffectAPIAvailable()` false, Android and web: every glass surface renders `material.solid` (`surfaceRaised` fill, 1 pt `line` hairline), same shape and size. Increase Contrast: borders step to `controlBorder` (high-contrast values), labels to `text`, and glass gains a visible 1 pt edge. The check is `useMaterial()` (section 8): `isLiquidGlassAvailable() && isGlassEffectAPIAvailable() && !reduceTransparency`.
6. **Never fade glass with `opacity`.** Setting opacity 0 on a `GlassView` or a parent stops it rendering (Expo v57 reference). Glass appears and leaves by animating `glassEffectStyle` (`{ style, animate: true, animationDuration }`) to and from `none`; a wrapper's opacity only moves together with a style switch to `none`.
7. **Both ends of the iOS 27 intensity slider** (BRIEF 1, press reports, UNVERIFIED on device): every glass label uses `text` or `accent` on regular glass, never `textMuted` below 17 pt; every specimen in `REFERENCE.html` has an intensity control from opaque to clear, and nothing may lose 4.5:1 at the clear end over paper or 3:1 for icons.
8. **Clear glass only over a picture**, always with `material.glass.dim` (black at 35 percent) between the picture and the control, local to the controls' corner, never over the whole picture.

### 1.2 The absent rule
A control that cannot act because a feature is off, a remote pause is on, the build lacks a module, the plan does not allow it, or the role does not allow it is **absent, not disabled**: it is not rendered and its space closes up (cards NS-01-R19, R59; NS-02-R1; NS-05; frame section 2 "no coming soon surface"). A control that will act once the person finishes something on the same screen (Save in the Day sheet until the pick differs, Delete account until the word is typed) is **present and not ready**: its fill drops to a 1 pt `controlBorder` outline with the label in `textMuted` (never 40 percent opacity), VoiceOver reads "dimmed" and the hint says what is missing. No third case exists.

### 1.3 Accessibility floor (A-NFR-005 to 007, B-NFR-006, LEGAL-REQ-051, D-027)
- Targets 44 by 44 pt minimum; `hitSlop` only where the visual is a glyph.
- Dynamic Type to AX5 at 375 pt (iPhone SE 3 width): letter text (`letterBody`, `signature`, snippets) is never truncated and never capped; chrome type caps only through `tokens.type[*].maxScale`; tab bar labels follow the system (they do not scale; Large Content Viewer shows them). Rows stack value under title; button pairs stack; buttons grow taller.
- VoiceOver: one element per row or card with a composed label; heading first on every screen; no separator glyphs spoken; modal surfaces trap focus and answer the escape gesture.
- Voice Control: the accessible name begins with the visible label (WCAG 2.5.3); icon-only controls carry a one-word name that is also their Large Content Viewer title.
- Switch Control: each glass cluster is one scan group; each row is one item; nothing auto-advances while Switch Control runs (T4).
- Colour is never the only signal: selected states add a check or weight; recording adds a shape and a word; errors add an icon and words.
- Bold Text, Smart Invert (pictures set `accessibilityIgnoresInvertColors`), Differentiate Without Colour, Increase Contrast and Reduce Motion are tested on every component in `REFERENCE.html`.

### 1.4 Motion floor
From `MOTION.md`: controls never animate in (they are hittable from the first frame); press feedback on `m.tap` (scale 0.97, cards 0.98, on `spring.snappy`; glass controls use `m.tap.glass`, the system's own response, never both); saves are instant and motion is the receipt; native chrome keeps the system's motion; Reduce Motion replaces every move with its substitute in MOTION section 8 (usually `m.fade`, 200 ms opacity); glass keeps its style change (`m.glass`) and loses any travel. Recording state changes are `m.instant` (MOTION section 5). Every move is at or under `motion.capMs` 300 unless MOTION section 5 names it. Haptics: the ids in MOTION section 9 (`H-select`, `H-press`, `H-soft`, `H-success`, `H-warning`); none on navigation, sheets, menus, tabs, toasts or glass morphs, and never while recording.

## 2. Navigation and chrome

### N1. Tab bar (native)
- **Purpose**: the three rooms: Home (Say), Book (Read), Me (Look after). Navigation only; never an action (only Home starts a letter).
- **Anatomy**: three items, each an icon above a single-word label; selected item tinted `accent` with the system selection platter.
- **Variants**: `expanded` (default), `minimized` (scroll down on the Book, `minimizeBehavior="onScrollDown"`; Home and Me never minimise, their pages are short and the capture cluster sits above the bar).
- **States**: default; selected (tint and platter plus weight, never colour alone); pressed (system); focused (system focus ring); loading, error: n/a; absent: never (the bar is the same in every build, `test/tab-bar.test.ts`). AX5: labels do not scale (system); long press shows Large Content Viewer. VoiceOver: "Home, tab, 1 of 3", "Book, tab, 2 of 3", "Me, tab, 3 of 3" (system traits). Voice Control: "Tap Home", "Tap Book", "Tap Me". Switch Control: one group of three.
- **Layer**: glass regular (system). Reduce Transparency and iOS before 26: the system's own solid bar.
- **Tokens**: `color.accent` as `tintColor` via `DynamicColorIOS` with light, dark and high-contrast values; labels in the system font (the bar is system chrome; Mukta in the tab bar retired).
- **Motion hooks**: T-TAB (system; no animation of content); T-MIN `m.minimize` on the Book only. No haptic.
- **Implementation**: Expo Router native tabs, `expo-router/unstable-native-tabs` (SDK 55 to 57), in `app/(tabs)/_layout.tsx`. Icons: SF Symbols through `NativeTabs.Trigger.Icon sf` (`house`, `book`, `person.crop.circle` with `.fill` selected; mapping owned by FOUNDATIONS iconography) with `src` Phosphor PNG as the Android and web fallback. Remove `backgroundColor`, `blurEffect`, `shadowColor` (ignored on iOS 26 anyway). Wrap in `ThemeProvider` to avoid the dark-mode white flash (Expo guide). Changes from today: `expo-router/js-tabs` with a paper bar, `BAR = 58`, Mukta labels and a custom Pressable are retired. The `ToastHost` offset must stop reading a fixed bar height (native tabs cannot be measured, Expo guide): toasts anchor to the safe area plus `NativeTabs.BottomAccessory`-free spacing (UNVERIFIED on device; engineering row R2). `ReminderPrimeAsk` stays a sheet, not a bottom accessory.
- **Used by**: frame section 4; spec 06 (IA); every e2e area (A-S01, B-S01, C-S01).

### N2. Navigation header
- **Purpose**: title and the back or Close control of pushed and modal screens.
- **Anatomy**: leading back chevron (pushed) or nothing; centred or large title; trailing items: Close (modal, the word, top right, never top left, never a circled X) and at most one more action. Items render on glass by the system.
- **Variants**: `push` (back chevron with the previous title), `modal` (Close trailing), `flow step` (onboarding back, drawn by the system header in a nested Stack), `large` title (settings roots in Me), `inline`.
- **States**: default; pressed (system); focused (system); loading: a trailing item can show busy (Close disabled only while a request must not be cut off, today's `closeDisabled`, kept); error: n/a; absent: an item with nothing to do is not rendered. AX5: titles truncate only in the bar (system), and every screen repeats its title as an in-content heading (level 1) so nothing is lost; item labels show in Large Content Viewer. VoiceOver: "Back, button", "Close, button" plus `closeHint` where the draft is kept. Voice Control: "Tap Back", "Tap Close". Switch Control: one group.
- **Layer**: glass regular (system items). Scroll edge effect keeps them legible over scrolling letters.
- **Tokens**: `color.accent` tint; `color.text` title; `type.headline` equivalent is the system's.
- **Motion hooks**: T-PUSH `m.push` and T-COVER `m.cover` (system or route table, never re-created per screen); T-ZOOM `m.zoom` for Book card to letter page stays ours and the glass Back and Aa appear by `m.glass` (style, never opacity) once the page has landed.
- **Implementation**: native Stack header (`expo-router` Stack, `headerTransparent` on iOS 26 so content scrolls under it; no custom `headerBackground`). `ModalHeader` and `BackButton` (`components/ui/screen-header.tsx`) become the **fallback** for screens that are not in a native Stack (the in-screen Keep gate, the age gate outside navigation); the "Close top right" rule in `lib/navigation.logic.ts` is unchanged.
- **Used by**: A-S04 to A-S07 (modals), B-S08 (letter page), C-S02 onward (settings), D-S06, E-S04 to E-S07.

### N3. Toolbar (bottom)
- **Purpose**: the one or two actions of a modal screen that has no tab bar: Review's Keep and Let it go; Write's Done; the picture viewer's Change and Take the photo off.
- **Anatomy**: `Stack.Toolbar` placement `bottom` with `Toolbar.Button` items, a flexible `Toolbar.Spacer` between groups, and at most one `prominent` item.
- **Variants**: `single` (one prominent item centred, for example Keep), `split` (a plain item leading and a prominent item trailing, for example Let it go and Keep), `over picture` (clear + dim, C4 viewer).
- **States**: default; pressed and focused (system); loading (the prominent item shows busy and ignores presses, label stays); error: the screen's line above the toolbar carries the words; absent: per 1.2. AX5: toolbar items do not grow past the bar (system); therefore **any item whose label is a sentence moves into the content as an A1 `lg` button pinned in the bottom third** at AX3 and above (`useIsAccessibilitySize()`), and the toolbar keeps only icon items with Large Content Viewer titles. VoiceOver and Voice Control: the item's label ("Keep", "Let it go"). Switch Control: one group.
- **Layer**: glass regular (system); clear + dim over a picture.
- **Tokens**: `color.accent` tint for prominent; `color.destructive` never in a toolbar (destructive actions open F6).
- **Motion hooks**: system; busy words `m.swap` with `m.progress.wait` (static words under Reduce Motion); T-KEEP `m.keep` follows the Keep press.
- **Implementation**: `Stack.Toolbar placement="bottom"` (iOS from SDK 55, Expo guide; renders only on iOS and Android). Web preview: a house fallback row of A1 buttons in `material.solid`. NEW at the system level (today Review draws its own footer of RN buttons); RETIRES the hand-drawn Review footer row and `StickyFooter` (spec only, never built).
- **Used by**: A-S06, A-S07, A-S11 entry, B-S11 viewer; cards NS-01, NS-09, NS-35.

### N4. Find bar (a `TextField` preset on glass, not a new component)
- **Why a preset**: card 02 says "No new component" (design inputs) and the brief puts the Find bar in the glass layer. NS-02 needs one field over the Book with Cancel, autocorrect, spell check, autocomplete and content type off (NS-02-R14), the field growing and Cancel wrapping under it at AX5 (R42). The native header search bar (`Stack.SearchBar`) does not promise the AX5 wrap and its input flags are UNVERIFIED, so the bar is `TextField variant="search"` plus a glass `Button` inside one `GlassCluster` (AUDIT 4.10 resolved the same way). Supersedes `FindBar` NEW in `specs/02-FIND-11nov.md`.
- **Purpose**: Find mode over the Book (B-S06).
- **Anatomy**: one `GlassContainer` at the top safe area: a capsule field (magnifier glyph, `TextInput`, clear button when text exists) and a `Cancel` glass capsule beside it. Results render below in the content layer (C2 rows).
- **Variants**: `idle` (focused, empty, nothing drawn under it), `typing`, `results`, `no match` (one line under the bar, content), `failed` (line plus Try again, content).
- **States**: default; focused (2 pt `focus` ring outside the capsule, plus the caret); pressed (Cancel: `motion.press`); loading: the getting-ready line in content under the bar, never a spinner in the field; error: per variant; absent: the Find action that opens it is absent when the flag or pause is off or the book has no findable letter (NS-02-R1). AX5: the field takes the full width and grows in height with its text; Cancel wraps under it, right aligned, 44 pt. VoiceOver: field "Find a letter, search field" (label), hint "Type a word you remember"; Cancel "Cancel, button"; result count never spoken (NS-02-R41). Voice Control: "Tap Find" opens, "Tap Cancel" closes. Switch Control: field and Cancel one group; rows one item each.
- **Layer**: glass regular (field and Cancel in one container). It replaces the Book header controls (N5) while open, so the budget stays at three.
- **Tokens**: `color.text`, `color.textMuted` (placeholder only, at 17 pt or larger), `color.focus`, `radius.pill`, `size.control.md` (48 pt field), `space.4` gutters.
- **Motion hooks**: the overlay `m.fade` over `swapMs` (card 02); the header capsules leave and the Find glass appears by `m.glass` inside one container; Reduce Motion: the overlay appears (card 02), glass style change kept; typing never animates the list.
- **Implementation**: `TextField variant="search"` (new variant in `components/ui/text-field.tsx`) rendered on `GlassSurface` with a `Button style="glass"` Cancel, both inside one `GlassCluster`, composed in the Book screen; RN `TextInput` with `autoCorrect={false}`, `spellCheck={false}`, `autoComplete="off"`, `textContentType="none"`, `keyboardType="default"`, writing tools off (I2 note). Fallback `material.solid`.
- **Used by**: B-S06; NS-02.

### N5. Book header (cover band plus glass controls)
- **Purpose**: the Book's one lit object (title, age) and its few controls: Find, Go to a month, More for this book (Quiet, Unquiet, Hide, Show again), Read together, and the child switcher when there are two books.
- **Anatomy**: content part, the existing `CoverBand` (title in `display` as heading 1, age in `callout`, switcher above the title, Read together as an in-flow A1 `bordered` `md` button); glass part, a `GlassContainer` of icon capsules trailing in the navigation bar: Find (magnifier) and More (ellipsis, opens the system menu, N6). Go to a month lives in More at AX3 and above (B-S02), otherwise as a third capsule.
- **Variants**: `band` (top of the Book), `inline` (after scroll: the system inline title and the same capsules), `empty book` (title and age only; Find absent), `two books` (switcher present), `quieted` (Unquiet in More).
- **States**: default; pressed (capsule `motion.press`); focused (system ring); loading: n/a; error: n/a; absent: Find per NS-02-R1, Go to a month when there is one month only, the switcher with one book. AX5: the band stacks title, age, switcher, Read together; capsules stay in the bar (Large Content Viewer); Go to a month folds into More. VoiceOver order: title, age, switcher, Read together, Find, Go to a month, More. Labels "Find", "Go to a month", "More for this book". Voice Control: same words. Switch Control: band items one by one, capsules one group.
- **Layer**: band = content (paper, lamp light, no glass); controls = glass regular (system header items).
- **Tokens**: band as today (`atmosphere`, `radius.lg`, `LIT_BAND_STRENGTH`); capsules `color.accent` tint.
- **Motion hooks**: none on the band (nothing moves; the Book `Settle` is retired, MOTION 13); system for header items (`m.tap.glass`); T-MENU for More; the hand-over to N4 as in N4.
- **Implementation**: band: today's `components/book/cover-band.tsx`, minus its gear and Months buttons, which move to `Stack.Toolbar placement="right"` with `Toolbar.Button` (Find) and `Toolbar.Menu` (More) in a Stack inside the Book tab. Requires the Book tab to host a Stack (engineering row R3). Retires the hand-placed trailing buttons and the "space kept for them" layout trick.
- **Used by**: B-S01, B-S02, B-S06, B-S07, C-S12 (book-level new phone line sits under the band, content); NS-22, NS-02, NS-24.

### N6. Menu and popover
- **Purpose**: short lists of actions that originate from the control that opened them: More for this book; letter page More; the end menu.
- **Anatomy**: system menu, items with an optional SF Symbol, destructive items last and marked `destructive` (red plus the word).
- **States**: system (pressed, focused, selected with a check for Quiet). AX5: system menus scale. VoiceOver: system. Absent: an item that cannot act is not listed.
- **Layer**: glass regular (system).
- **Implementation**: `Stack.Toolbar.Menu` and `MenuAction` (header items); `@expo/ui` SwiftUI `ContextMenu` behind `platform/action-menu` for long press on a letter card (kept from COMPONENT_LIBRARY 5). Destructive items never act directly: they open F6.
- **Used by**: B-S02, B-S08, C-S15.

### N7. Sheet (system)
- **Purpose**: a focused task over its context: Whose book, Day sheet, Who can read it, Share preview, Reminder ask, invite, confirmations, Keep gate.
- **Anatomy**: grabber, title (heading, focus lands on it), optional description, content, footer actions. Close in the header top right only when there is no other way out.
- **Variants**: `fit` (fits content; inset from the screen edge on iOS 26 so content peeks through), `half` (detents medium and large), `full` (large; becomes more opaque, system).
- **States**: default; keyboard raised; dismissing with unsaved text (guarded); not dismissible (`dismissible={false}` for required choices); AX5: content scrolls inside, footer actions stack and stay on the first screen. VoiceOver: modal, title focused, escape closes. Voice Control: "Tap Close" where shown.
- **Layer**: glass regular (system sheet). Content inside the sheet is content: buttons inside are `plain`, `bordered`, `filled` or `destructive`, never glass (1.1 rule 2).
- **Motion hooks**: T-SHEET `m.sheet` (system; from a glass header button the sheet may morph out of it, UNVERIFIED in RN, MOTION ENG-M5); Reduce Motion system. `m.sheet.own` only for the cases listed in section 8.
- **Implementation**: route sheets through Expo Router `presentation: 'formSheet'` with `sheetAllowedDetents`, `sheetGrabberVisible`, and **no** `sheetCornerRadius` or background (the system draws the glass and the concentric corner). In-context sheets move from `@gorhom/bottom-sheet` (paper, our spring) to `@expo/ui/community/bottom-sheet` (SwiftUI sheet on iOS; API compatible per COMPONENT_LIBRARY 0.1) so they get the system glass; that it renders iOS 26 glass is UNVERIFIED (engineering row R4, device spike). `ui/sheet.tsx` keeps its accessibility contract (title focus, modal, escape, labelled scrim). Fallback below iOS 26: system solid sheet.
- **Used by**: A-S02, A-S08, A-S09, A-S11, A-S12, B-S07, B-S09, B-S10, B-S13 to B-S15, C-S03, C-S07, C-S11, D-S02, D-S04, D-S07, D-S08, D-S13, D-S19, E-S10.

## 3. Actions

### A1. Button
- **Purpose**: the one control for acting.
- **Anatomy**: capsule (`radius.pill`, concentric with its container); optional leading icon; label (`type.label`, `labelSmall` at `sm`); busy glyph replacing the icon when loading.
- **Styles**: `glass` (glass regular in the glass layer, `bordered` in content), `prominent` (glass regular tinted `accent` in the glass layer, `filled` accent in content; at most one per screen), `plain` (no fill, `accent` label: Skip, Not much today, Close inside a sheet), `destructive` (no fill, `destructive` label and Trash icon; a `destructive` fill only on a confirm page after the typed word matches, D6 Delete account and Delete this book).
- **Sizes**: `sm` 44 pt, `md` 48 pt, `lg` 56 pt (pinned primary actions, NS-11 "at least 56 pt"), `xl` 64 pt (Speak, Type, the record control; Apple's extra-large control size), `icon` 44 by 44 (capsule or circle). Heights are minimums.
- **States**: default; pressed (`motion.press`, scale 0.97 and 0.9 opacity on solid twins; on glass, `isInteractive` gives the system's own press response and we add no scale); focused (2 pt `focus` ring outside the shape); selected: n/a (use I4 or N6); loading (busy glyph, label stays, presses ignored, VoiceOver "busy" not "dimmed"); not ready (1.2: outline and `textMuted`); error: never on the button (the screen's line); absent per 1.2. AX5: label wraps, never truncates, the button grows; `ButtonRow` pairs stack from AX1 (today: xxxLarge), equal width. VoiceOver: label = visible text, trait button, state busy or dimmed. Voice Control: the label. Switch Control: one item.
- **Layer**: inherited (1.1 rule 1).
- **Tokens**: `color.accent`, `color.onAccent`, `color.surfaceRaised`, `color.controlBorder`, `color.destructive`, `color.onDestructive`, `color.focus`; `material.glass.regular`, `material.glass.tint.accent` (prominent tint, value from FOUNDATIONS); `size.control.sm|md|lg|xl`; `radius.pill`.
- **Motion hooks**: `m.tap` on solid twins, `m.tap.glass` on glass (never both); busy `m.progress.wait` (system activity indicator) with the busy words `m.swap`; Reduce Motion: no indicator, static busy words (MOTION 13). Haptic only for the outcomes in MOTION section 9 (`H-press` on Speak and Type, `H-success` at Keep's commit, `H-warning` after a destructive confirm).
- **Implementation**: `components/ui/button.tsx`. Change: variants become `style` (`glass | prominent | plain | destructive`) plus the layer from context; `size` adds `xl` (rename of `capture`; the icon-above-label layout of `capture` is retired, the icon leads as on every other size). Map: `primary` to `prominent`, `secondary` and `outline` to `glass` (both render `bordered` in content, which fixes the 1.08 : 1 secondary fill found in PR #713), `quiet` to `plain`, `destructive` unchanged. In the glass layer the button renders `GlassView` with `glassEffectStyle="regular"`, `isInteractive`, `tintColor` for prominent. `IconButton` becomes `Button size="icon"` (variants `plain`, `tinted`, `filled` retired into the styles). `ButtonRow` kept; stacking threshold moves to AX1.
- **Used by**: every area.

### A2. Capture cluster (Home)
- **Purpose**: the only start of a letter (frame section 4; NS-35 one start). Speak and Type have equal weight; Start from a photo is quiet and never larger; Not much today is a quiet escape.
- **Anatomy**: fixed bottom region of Home, above the tab bar. One `GlassContainer` (MOTION 7 rule 3) holding two `xl` glass capsules side by side, Speak (microphone) and Type (pencil), equal width, and under them one `sm` glass capsule, Start from a photo (A4), centred and never wider than either. Under the container, in content on paper, Not much today as a `plain` `sm` button. The scroll view ends above the region with a scroll edge effect, so slips scroll under the glass, never under the plain button.
- **Variants**: `rest`; `rest, no photo start` (absent per NS-01-R19 and R59: the column closes up); `quiet day kept` (Not much today replaced by the kept line with Undo, D-S21, which is a toast F1); `waiting card present` (a slip sits above in the scroll; the cluster never moves).
- **States**: default; pressed (system glass press); focused; loading: n/a (start is instant; the Listen screen owns readiness); error: microphone denied shows Speak's label "Allow microphone" and opens Settings (kept from CaptureBar); absent per above. AX5 (from AX3, `useIsAccessibilitySize()`): the cluster stops floating and renders inline at the end of Home's content as solid twins (`GlassLayer` off: `bordered` capsules), Speak and Type stacked full width, then Start from a photo, then Not much today, so nothing covers the words and every label wraps (as built, `app/(tabs)/index.tsx:328`, AUDIT 2.9); at default sizes it stays in the bottom third (card 09 design input). VoiceOver order: Speak, Type, Start from a photo, Not much today; labels "Speak", "Type", "Start from a photo", "Not much today" with hint "Marks today without writing anything". Voice Control: the same words. Switch Control: the glass pair one group, the plain column one group.
- **Layer**: Speak, Type and Start from a photo glass regular (one container, one glass surface in the budget); Not much today content. AX3 and above: all content.
- **Tokens**: `size.control.xl`, `radius.pill`, `space.3` between capsules, `GlassContainer spacing` = `material.glass.mergeDistance` (FOUNDATIONS), `color.accent` icons.
- **Motion hooks**: `m.tap.glass`; the shapes merge and split only inside their one container (`m.glass`, MOTION 7 rule 3); Listen opens by T-COVER `m.cover`, never by morphing the cluster (recording is immediate). Controls never animate in; the cluster never pulses (MOTION 11).
- **Implementation**: house `components/capture/capture-cluster.tsx` (NEW file; RETIRES the inline `Button size="capture"` pair in `app/(tabs)/index.tsx` and the `CaptureBar` spec 2.18, whose `compact` mode is dropped).
- **Used by**: A-S01, A-S13, D-S21; NS-35, NS-01, NS-07 C5, NS-14.

### A3. Record control
- **Purpose**: start, stop and pause a recording on Listen (A-S04, A-S05).
- **Anatomy**: an `xl` circular-to-capsule control. Ready: a glass circle with the microphone glyph and the label "Speak" under it (content type). Recording: the same glass shape morphs to a capsule holding a `recording` dot, the word "Stop" and the elapsed time; a separate `glass` `icon` capsule for Pause in the same container. The listening aura (existing `ListeningAura`) sits behind in the content layer.
- **Variants**: `ready`, `recording`, `paused` (dot hollow, word "Resume"), `still here` (A-S05 hands-free prompt), `interrupted` (call or route change: paused with its line), `held` (the take is kept on the phone; Stop absent).
- **States**: default; pressed (system glass); focused; loading: `starting` (busy for at most the audio session start; label stays); error: microphone off shows the StateScreen (C8) instead of the control; absent: Pause absent where the recorder cannot pause. AX5: the capsule grows taller and the time moves under "Stop"; Pause moves under the capsule; the aura shrinks to the remaining space. VoiceOver: Ready "Speak, button, starts recording"; Recording "Stop recording, 42 seconds" (time announced each minute, not each second); Pause "Pause". Voice Control: "Tap Stop", "Tap Pause", "Tap Speak". Switch Control: one group; no timed step.
- **Layer**: glass regular while recording (BRIEF 3); at Ready the circle is glass too (it is the screen's one control over the aura). Never clear glass.
- **Tokens**: `color.recording` (dot and the hollow ring), `color.text` label, `size.control.xl`, `type.label`, `type.footnote` for the time with tabular figures.
- **Motion hooks**: every state change (ready, recording, paused, stopped, error) is `m.instant` with `glassEffectStyle` `animate: false` (MOTION section 5 and 7 rule 12): the control, its label, colour and time change on the frame the recorder reports it. The aura is `m.signal`. Reduce Motion: the same (instant) plus the aura's static ring. `H-press` before the audio session starts and after it ends; nothing else.
- **Implementation**: house `components/capture/record-control.tsx` (NEW file) on `GlassContainer` plus `GlassView`; morph by changing the container's children with `glassEffectStyle` animate (UNVERIFIED that `GlassContainer` animates a shape change; fallback is a Reanimated layout transition of the wrapper with the style switch, rule 1.1.6). Today the record button is drawn inline in `app/listen.tsx`.
- **Used by**: A-S04, A-S05, A-S14 (arrival from a doorway), A-S15; NS-04, NS-06 C, NS-09, NS-35.

### A4. Photo start
- **Purpose**: "Start from a photo" inside the capture cluster (NS-01-R1).
- **Anatomy**: `glass` `sm` capsule inside A2's container (solid `bordered` twin at AX3 and above), leading image glyph, label; never larger than Speak or Type.
- **States**: default; pressed; focused; loading: while the system picker downloads from iCloud the picker's own UI shows progress (A-S03; our states around it are the picker's); error: "That photo could not be opened" on Ready (#838), not on the button; absent when `EXPO_PUBLIC_PHOTOS` is off, `killSwitches.photos` is on, or the native module is missing (R19, R59). AX5: wraps, full width. VoiceOver: "Start from a photo, button". Voice Control: "Tap Start from a photo". Switch Control: one item.
- **Layer**: glass regular (inside A2's container); content at AX3 and above.
- **Implementation**: `Button style="glass" size="sm"` inside A2; no new file.
- **Used by**: A-S01, A-S03; NS-01.

## 4. Content

### C1. Letter card
- **Purpose**: one letter in the Book and on Home (one past letter, slip 4; waiting cards).
- **Anatomy**: as built (`components/book/letter-card.tsx`): dateline, up to three whole lines of the person's words ending in `ExcerptFade` (two at AX sizes), signature in `signature` italic, Private tag, a quiet "Voice 1:06" marker, optional photo thumbnail (C3) leading or above.
- **Variants**: `letter`, `note`, `with picture`, `waiting words` (AppNote line), `typed`, `other parent's`, `sealed` (the hidden row: date and "Hidden until {date}", no words, NS-06-B2), `quiet day` (QuietDayRow, not a card), `draft` (DraftCard on Home), `past letter` (ResurfacedCard, Home slip 4).
- **States**: default; pressed (`motion.press` card scale 0.98); focused (ring around the card); selected: n/a; loading: skeleton not used (the Book renders from the phone); error: picture missing shows the card without the thumbnail (card 11 design input); new (the `accentSoft` wash once over `newMarkMs`). AX5: excerpt two lines, footer stacks, thumbnail above the words (NS-01 lens rule), at most 88 pt tall from AX3. VoiceOver: one element, composed label with every word of the letter (D-027), recording length in words, hint "Opens the letter"; actions (share, mark a first, delete) as accessibility actions. Voice Control: the name begins with the dateline as shown. Switch Control: one item.
- **Layer**: content. Raised paper in light, 1 pt `line` edge in dark.
- **Tokens**: `color.surfaceRaised`, `color.line`, `radius.md`, `elevation.1`, `type.letterBody`, `type.letterDateline`, `type.signature`.
- **Motion hooks**: `m.tap` (card scale 0.98); T-ZOOM `m.zoom`; `m.mark` after Keep or Undo; `m.list.insert` and `m.list.remove`. The words never animate on their own (MOTION 11).
- **Implementation**: unchanged file; DraftCard and ResurfacedCard become variants of one `LetterCard` shape with the 3 pt accent rule as a prop (`rule`), RETIRING the two near-duplicate card shells in `components/tonight/` (the logic files stay).
- **Used by**: B-S01, B-S04, B-S05, B-S16, B-S17, A-S01 (waiting cards); NS-01, NS-06, NS-21, NS-23.

### C2. Letter page list (registry rows)
- **Purpose**: the letter page as one list (NS-21): the letter, then "This letter" rows.
- **Anatomy**: letter body (content: dateline C6, words in `letterBody` at Reading Size, signature), then an inset grouped `ListSection` titled "This letter" with rows: The day it is about (value, chevron, opens I3), From (value, read-only on the page), Who can read it (value, chevron), Picture (thumbnail, Change, Take the photo off), A first (I5 toggle and label), Hide until (value), Where the recording is (provenance, read-only, NS-08's four states), Earlier versions (chevron), Share (D-S01; row with the word), Delete (destructive row, last, full width at AX5).
- **Variants per row**: `navigation` (chevron), `value` (value then chevron), `toggle` (I5), `read-only` (no chevron, role text), `destructive` (no chevron, words say the action), `action` (`actionWord` last in the label).
- **States**: default; pressed (`surface` highlight); focused; loading: the row's value shows its line, not a spinner (speech rows keep the ring, F3); error: the row's subtitle carries words; absent: rows for off features are not rendered (Share when NS-05 is off; Picture when photos are off; Hide until in a book where sealing is unavailable). AX5: one column, value under title, every title wraps, Share full width, Delete full width and last (card 10 design input). VoiceOver: one element per row "Title, value, button" with `actionWord` last. Voice Control: the title. Switch Control: one item per row.
- **Layer**: content (system grouped list style; settings lists never glass).
- **Tokens**: `color.surfaceRaised` rows on `color.surface`, `radius.lg` section corner (larger per iOS 26 lists; value from FOUNDATIONS `radius.listSection`), row min height `size.row` 52 (iOS 26 larger rows; FOUNDATIONS), `type.body` title, `type.subhead` value, section header in title-style capitalisation (Apple 26: "This Letter" style is NOT adopted for our words; see section 11 gap G1).
- **Motion hooks**: `m.tap` on pressable rows (highlight); a row that appears or leaves uses `m.list.insert` or `m.list.remove`; a value that changes uses `m.swap`.
- **Implementation**: `components/ui/list-row.tsx` (`ListSection`, `ListRow`, `ToggleRow`) kept; add `rowHeight` and section radius from tokens v2; the letter page composes it.
- **Used by**: B-S08 to B-S15, C-S09, C-S13, D-S01; NS-21, NS-01, NS-05, NS-06, NS-08, NS-12.

### C3. Photo thumbnail (`PhotoFrame`, the component card 01 names)
- **Purpose**: a picture beside or above a letter in lists and on Review.
- **Anatomy**: `expo-image` with the list copy (about 512 px, T3), `radius.sm`, 1 pt `line` hairline frame in dark mode (NS-01-R41), aspect clamped 3:4 to 16:9, never cropped to fill in the PDF.
- **Variants**: `list` (lens and card), `ready` (on Ready and Review, larger, page copy about 1,280 px), `missing` (card without it; on the letter page the line "The picture is not on this phone" per R56), `did not come along` (R58 line).
- **States**: default; pressed (opens C4); focused; loading (placeholder `surface` block of the final size, no shift); error (missing variant); absent when the letter has no picture. AX5: from AX3 at most 88 pt tall, above the words. VoiceOver: role image, label "Picture" or the parent's own words for it if typed; never a machine description (constitution). Smart Invert ignored.
- **Layer**: content.
- **Implementation**: `components/ui/photo-frame.tsx`, built for the first time from spec 2.23 `PhotoFrame` (card 01 lists it as reused, so it keeps that name; not a new component in the card's sense); `accessibilityIgnoresInvertColors` on the image (NS-33-R11). RETIRES `PhotoFrame` variants `cover` and `polaroid` and multi-photo paging (one picture per letter in the cards).
- **Used by**: A-S04, A-S07, B-S04, B-S08, B-S11; NS-01, NS-37.

### C4. Stored-copy viewer (`PhotoFrame variant="viewer"` in a full-screen route)
- **Purpose**: the picture full screen from the letter page or Review (the stored copy, T3).
- **Anatomy**: black or `bg` backdrop, the picture fitted (never cropped), controls in the top corners: Close (top right), and on the letter page Change and Take the photo off in a bottom toolbar (N3 `over picture`).
- **States**: default; pressed; focused; loading (the page copy, then the stored copy); error (missing line, C3); absent: Change and Take off absent on another author's letter. AX5: controls stay 44 pt, labels in Large Content Viewer; the words line, if any, moves into a scroll below the picture. VoiceOver: image first, then Close, Change, Take the photo off. Voice Control: "Tap Close", "Tap Change". Zoom: pinch, double tap; VoiceOver magic tap off.
- **Layer**: glass clear + dim (`material.glass.clear` over `material.glass.dim` 35 percent, local to the control corners).
- **Motion hooks**: opens with T-COVER `m.cover` (no zoom from the thumbnail; photographs never zoom or Ken Burns, MOTION 11); the dim is static; a changed picture crossfades under it with `m.fade` (MOTION 7 rule 7).
- **Implementation**: a full-screen route (`app/letter/[id]/picture.tsx`, T-COVER) that renders `PhotoFrame variant="viewer"`; controls on `GlassSurface variant="clear" dim` (the dim is a separate black `View` at `material.glass.dim`; its opacity is static and it is not glass, so rule 1.1.6 does not apply to it).
- **Used by**: B-S11, A-S07; NS-01, NS-37.

### C5. Quote pair
- **Purpose**: the brand device above the heading on welcome and the empty Book.
- **Anatomy, states, tokens**: as built (`components/ui/quote-pair.tsx`): 40 to 64 pt, accent on paper, reversed on dark, one per screen, a single `motion.fade` then still; decorative, hidden from VoiceOver.
- **Layer**: content.
- **Used by**: E-S02, B-S01 empty.

### C6. Dateline (NEW component over an existing type style)
- **Justification**: the dateline is drawn four ways today (letter card, letter page, Review, Read together); NS-15 makes it a control on Review with a visible affordance and a two-date line in the app's small voice.
- **Anatomy**: `letterDateline` text ("Tuesday, 4 months old"); `tappable` adds a trailing chevron-down glyph and an underline offset 3 pt in `controlBorder`; `two dates` adds a second line in `footnote` `textMuted` ("Kept on 3 March").
- **Variants**: `static`, `tappable` (Review, opens I3), `two dates`, `month only`, `before you`.
- **States**: default; pressed (`surface` highlight behind the line); focused (ring); loading, error: n/a; absent: n/a. AX5: wraps to two or more lines; cap 2.4x as the type style says; never truncates. VoiceOver: static as text; tappable "Tuesday, 4 months old, button, change the day". Voice Control: the visible date words. Switch Control: one item.
- **Layer**: content.
- **Tokens**: `type.letterDateline`, `type.footnote`, `color.textMuted`, `color.controlBorder`.
- **Implementation**: `components/ui/dateline.tsx` (NEW).
- **Used by**: A-S07, A-S08, B-S08, B-S19, C1; NS-15.

### C7. Empty state
- **Purpose**: the warm, never-error view of something that has nothing yet (empty Book, no firsts, no typed days).
- **Anatomy, states**: as built (`EmptyState`): line art or the quote pair, title (heading), body, one action. The drawing is still: MOTION section 13 proposes retiring `Breathe` (a decorative loop with no signal); until Karma rules, it breathes only while focused and never under Reduce Motion or Low Power Mode. AX5: the centred block becomes left aligned from AX3 (long centred lines are hard to read; change from today), action full width. VoiceOver: title is a heading, drawing hidden; Voice Control: the action's words.
- **Layer**: content.
- **Used by**: B-S01.empty, B-S05 absent lens has no empty state (the lens is absent instead), C-S16, D-S06.

### C8. State screen
- **Purpose**: the one pattern for loading, empty, error, not found, offline and outage (2.15a, kept).
- **Anatomy**: picture slot, heading, one sentence, the way forward as an `lg` `prominent` button pinned in the bottom third (renders `filled`: content layer), quiet options below; never red, never a spinner, never a count. Adds a `note` slot (asked for by `outage-screen.tsx`).
- **Variants**: `empty`, `error`, `notFound`, `loading`, `offline`, `outage`, `killSwitch` (a remote pause of a whole feature), `lapsed` (plan lapse where a screen cannot show).
- **States**: AX5 content scrolls, actions stay; VoiceOver heading first, polite live region, busy while loading; Voice Control button words.
- **Layer**: content. `PlainScreen` (resilience) stays as the provider-free twin for crashes.
- **Implementation**: `components/ui/state-screen.tsx` plus `note`; variants added to `state-screen.logic.ts`.
- **Used by**: E-S13, E-S14, E-S16, E-S18, E-S20, A-S05 (microphone off), C-S11 declined; every area's `.error-<code>` and `.killswitch` states that replace a whole screen.

## 5. Inputs

### I1. Text field
- **Purpose**: one line of the person's text (child's name, From name, Firsts label, place, typed-day words, email, code).
- **Anatomy**: visible label above (never placeholder-only), field with a 1 pt `controlBorder` edge (3:1), 2 pt `focus` ring outside, helper below, error line with icon and words.
- **Variants**: `field`, `serif` (typed text in the letter face, `nameField`), `count` (Firsts label at 40: the count appears only past 90 percent, as words, never a red number).
- **States**: default; focused (ring, `m.swap`); filled; error (caution icon, words, announced once; `warning` haptic on submit only); not ready: n/a; absent: n/a. AX5: field grows taller, label and helper wrap. VoiceOver: label is the name; hint optional; error announced. Voice Control: the label. Switch Control: one item.
- **Layer**: content (fields are never glass; the Find field is N4's exception because the bar is chrome).
- **Writing tools off (D2)** on letter fields: From name, Firsts label, photo words, place, typed-day words. See I2.
- **Implementation**: `components/ui/text-field.tsx` kept; add `writingTools={false}` prop (I2 note).
- **Used by**: A-S09, B-S11, B-S12, D-S08, E-S05, E-S06, E-S08.

### I2. Textarea (letter writing surface)
- **Purpose**: the Type half of capture and the Review editor.
- **Anatomy**: paper, no box, `letterBody` at Reading Size, grows with its text; dateline above (C6).
- **Variants**: `letter` (Write), `review` (Review editor, edits stored and reversible), `compact` (typed-day words).
- **States**: default; focused (caret only; no ring on paper, the screen is the field); empty (the prompt as placeholder in `textMuted` at letter size, also given as the label); saving (quiet "Saved on this phone" caption, announced at most every 10 s); error (line under). AX5: uncapped, scrolls, keyboard avoidance. VoiceOver: label always read; Voice Control: "Tap" the label.
- **Writing tools off (D2)**: Apple Writing Tools must be off on every letter field (Review editor, Firsts label, photo text, place, typed-day words, From name). React Native 0.86 `TextInput` exposes no `writingToolsBehavior` prop that we have verified (UNVERIFIED); if absent, `mobile` adds a small native view config patch setting `UITextView.writingToolsBehavior = .none` and records the finding (D2 asks for it). Also off: predictive text inline completion is allowed (the person accepts each word), dictation allowed.
- **Layer**: content.
- **Implementation**: `TextField variant="letter"` is the writing surface (as built); `components/ui/textarea.tsx` (an RNR copy with a 3 px ring and a transition class) is RETIRED (AUDIT 2.5). Add `writingTools={false}` and a `compact` size.
- **Used by**: A-S06, A-S07, A-S10, D-S08; NS-35, D2.

### I3. Date sheet
- **Purpose**: the day a letter is about (NS-15), Hide until (NS-06 B), add a typed day (NS-18), the hour picker (D-S07 uses the time mode).
- **Anatomy**: N7 sheet titled "When was this?"; I4 segmented `A day | A month`; the system date picker (inline calendar style) bounded by the card's range; month list as I4 list; footer Save (`filled` `lg`, not ready until the pick differs) and the honest-limits sentence for Hide until.
- **States**: default; not ready Save; AX5: the inline calendar switches to the wheel style (UNVERIFIED that the calendar style reflows at AX5; device row R9), month rows scroll; VoiceOver: title focus, picker "Day", tabs "Day or month". Absent: the month tab for a child not born yet.
- **Layer**: glass regular (the sheet) with content inside.
- **Implementation**: `components/book/date-sheet.tsx` moves to `components/ui/date-sheet.tsx` (shared by four areas), unchanged logic.
- **Used by**: A-S08, B-S09, B-S13, D-S07, D-S08; NS-15, NS-06 B, NS-18, NS-13.

### I4. Choice group (segmented or chips, radio semantics)
- **Purpose**: pick one of a few: lens (Months, Photos, Firsts), day or month, appearance, Reading Size, how often.
- **Anatomy**: `segmented` (equal capsules in a track; selected capsule raised with a check glyph and medium weight), `chips` (36 pt pills reaching 44 pt, selected filled with a check), `list` (rows with a trailing check).
- **States**: default; pressed; focused (ring on the option); selected (fill + edge + check + weight; never colour alone, NS-01 Differentiate Without Colour); absent: an option that does not apply is not listed (Photos lens with no pictures, R10a). AX5: segmented stacks into the `list` layout from AX1; chips wrap. VoiceOver: group "Lens, radio group"; option "Photos, radio button, 2 of 3, checked". Voice Control: option label. Switch Control: group then options. Haptic `tap` on change.
- **Layer**: content; the lens choice in the Book header sits in content under the band, not in glass (budget).
- **Implementation**: `components/ui/choice-group.tsx` kept (radio semantics already right). `Chip` keeps `suggestion` and `tag`; `filter` RETIRED (no multi-select filters in scope). The `platform/segmented-control` SwiftUI Picker plan is RETIRED: our segmented control stacks at AX sizes, the native one does not.
- **Used by**: B-S03, A-S08, E-S21, D-S06; NS-01-R48, NS-06-A3, NS-33-R3.

### I5. Toggle
- **Purpose**: on or off: mark a first, past letters on Home, reminders, picture in a share.
- **Anatomy**: system switch in a `ToggleRow`, title and description, whole row the target.
- **States**: on, off, focused, not ready (rare; a toggle that cannot act is absent). The switch takes glass while being dragged (system, BRIEF 1 exception). AX5: switch moves under the title. VoiceOver: "Mark as a first, switch, off". Voice Control: the title.
- **Layer**: content row; the thumb is system glass while active.
- **Implementation**: `components/platform/toggle.ios.tsx` (SwiftUI Toggle) kept; remove any custom track colour so iOS 26 draws its own (tint `accent`).
- **Used by**: B-S12, B-S21, D-S02, D-S06; NS-06 A, NS-23, NS-05, NS-13.

### I6. Child switcher
- **Purpose**: whose book (NS-14) on the Book and on Home, identical in both.
- **Anatomy**: an eyebrow row "For Asha" with a chevron, above the title or dateline (never between the prompt and the capture controls); opens the Whose book sheet (N7 `fit`) with an I4 list, each row the child's name and current month line, the current book checked.
- **States**: default; pressed; focused; absent with one book. AX5: names wrap. VoiceOver: "For Asha, button, choose a book". Voice Control: "Tap For Asha".
- **Layer**: content row; the sheet is glass.
- **Implementation**: `components/child/child-switcher.tsx` and `whose-book-sheet.tsx` kept; one export used by Home and Book.
- **Used by**: A-S01, A-S02, B-S01; NS-14.

## 6. Feedback

### F1. Undo toast (T4)
- **Purpose**: the reversible outcome with its Undo: Letter deleted, Took the photo off, Marked as a first, quiet day kept, Use this picture instead.
- **Anatomy**: a floating capsule above the tab bar or toolbar: one line of words, an `Undo` text button (44 pt), no Close glyph (swipe down or the window ends it).
- **Window (T4)**: open for its stated seconds (`windowSeconds`, from the card: 10 s default), or until VoiceOver has finished reading the undo line plus that many seconds, whichever is later; with Switch Control on, until the parent moves on (focus leaves the toast or the screen changes). This replaces today's "with an action it never times out".
- **States**: visible; pressed Undo (`tap` haptic, then the outcome reverses and the toast swaps to the result line, "Put back."); replaced (a new toast swaps in place over `swapMs`, the old onDismiss runs); after the window (gone; the Book's row stays as it is). AX5: wraps to several lines, Undo moves under the words, right aligned. VoiceOver: announced once ("Letter deleted. Undo available."), not focused; reachable by swipe. Voice Control: "Tap Undo". Switch Control: one item; the window holds.
- **Layer**: glass regular.
- **Tokens**: `material.glass.regular`, `color.text`, `color.accent` (Undo), `radius.pill` (one line) or `radius.lg` (wrapped), `space.4`.
- **Motion hooks**: `m.toast` (glass materialises by style and rises 8 pt; words `m.enter`; out: words `m.exit`, glass to `none`, then unmount; over a toast: `m.swap`, the glass stays); swipe-down follows the finger (`toast.dismissDy`, `toast.dismissVelocity`). Reduce Motion: no rise. Never a progress ring or countdown on the toast (D-S21). `H-select` on Undo.
- **Implementation**: `components/ui/toast.tsx` on `GlassView`; add `windowSeconds`, VoiceOver completion through `AccessibilityInfo` `announcementFinished` (iOS event; UNVERIFIED in RN 0.86 New Architecture), Switch Control detection (no RN API; native `UIAccessibility.isSwitchControlRunning` through a small module, UNVERIFIED; engineering row R6). `book/undo-toast.tsx` RETIRED into it.
- **Used by**: A-S12, B-S11, B-S12, B-S15, D-S21; NS-01, NS-06, NS-07 C5, NS-21; T4.

### F2. Banner (SystemLine, NEW)
- **Justification**: E-S15 names `SystemLine`: offline, remote pause, low storage, update and outage are shown in place today by five different lines. One component keeps their shape, order and words aligned.
- **Purpose**: one calm line in place, under the header of the screen it concerns.
- **Anatomy**: small glyph (cloud-slash, pause, tray, arrow-down-circle), one sentence in `footnote`, optional action word (Try again, Update, Storage) as a `plain` `sm` button.
- **Variants**: `offline`, `outage`, `paused` (a remote pause of one feature), `lowStorage`, `update available`, `update required` (becomes C8), `plan` (plan date line, D-S24).
- **States**: default; pressed action; absent when the condition clears (the line leaves with `motion.fade`); at most one line per screen (priority: update required, outage, offline, paused, low storage, update available). AX5: wraps; action under. VoiceOver: one element announced politely once on arrival; action reachable. Voice Control: the action word.
- **Layer**: content (a line in the flow, `surface` fill, `radius.md`); never glass (budget, and it is information).
- **Tokens**: `color.surface`, `color.textMuted` glyph, `color.text` words, never status red.
- **Implementation**: `components/ui/system-line.tsx` (NEW); RETIRES the ad hoc lines in Listen, the Book and Storage.
- **Used by**: E-S14, E-S15, E-S16, E-S17, D-S24, C-S04 (offline), B-S01 (paused).

### F3. Progress
- **Purpose**: Save a copy, the printable book, a language download, the new phone arrival.
- **Anatomy**: `linear` (a 4 pt `radius.pill` track in `line`, fill `accent`, a sentence above: "Making your copy" and below the honest part: "You can leave this screen"); `ring` (22 pt, for rows; never spins: determinate only).
- **States**: running, paused (Low Power Mode line), stopped (the line plus Try again), done (the next step, never a celebration). AX5: sentence wraps; track full width. VoiceOver: role progressbar with `accessibilityValue` text ("About half") announced at most every 10 s; Voice Control: action words. Switch Control: action reachable.
- **Layer**: content.
- **Motion hooks**: `m.progress` (fill by `scaleX`, 200 ms linear per reading; Reduce Motion: jumps); unmeasurable work `m.progress.wait` (sweep 1400 ms, off under Reduce Motion and Low Power Mode, static words instead).
- **Implementation**: `components/ui/progress.tsx` (NEW, linear) and the ring from `settings/speech-row.tsx` moved into it.
- **Used by**: C-S04, C-S05, C-S10, E-S09; NS-11, NS-07 C28, NS-10.

### F4. Keep gate sheet (and the Plus sheet)
- **Purpose**: the one gate, at Keep, when keeping this letter needs Plus (E-S10), and Plus in Me (E-S11) handing to Apple's store view.
- **Anatomy**: N7 `full` sheet: title, the held letter itself (C1 compact) near the top, one plain sentence that it is safe and where it waits, then Apple's subscription store view; footer "See Plus" and "Keep it here for now". Never a price, trial, countdown or count typed by us.
- **States**: default; loading store view (the store's own); error: store unavailable shows a C8-style line in the sheet with Keep it here for now; lapsed variant. AX5: footer holds only the two actions on the first screen, the rest scrolls (keepSheetLayout, kept). VoiceOver: modal, title focus, held card one element.
- **Layer**: glass regular (system sheet). No lamp.
- **Motion hooks**: T-GATE (`m.sheet`); held card `m.enter`; nothing else moves; no haptic (StoreKit's purchase is the system's).
- **Implementation**: `components/child/plus-gate.tsx` moves to `components/gate/keep-gate-sheet.tsx`; today it is drawn inside Review with our spring; under N7 it presents as a system sheet over Review (Apple's store view presents over it; UNVERIFIED that StoreKit's view presents cleanly over a formSheet; row R7).
- **Used by**: E-S10, E-S11, A-S13; frame Plus rule.

### F5. Saved moment
- **Purpose**: the receipt after Keep (A-S13). Kept as built (`capture/saved-moment.tsx`): the letter files into the Book, no celebration. Content layer.

### F6. Confirmation (`ConfirmSheet`, the name cards 06 and 10 reuse)
- **Purpose**: ask before delete, erase, sign out or remove: Delete letter, Open now (sealed), Let it go, Use this picture instead, Erase everything on this phone, Delete account, Delete this book, Undo join, sign-out (D1).
- **Decision (AUDIT 4.20, MOTION T-ALERT)**: one API, two renderings by how much must be said. `simple`: a native confirmation that originates from the control that opened it (iOS 26 action sheet anchored to its source; on iPhone today an action sheet from the bottom), title = the question, message = one sentence, the safe choice is the cancel button and the default (card 06 B15 "default Cancel"), the destructive choice marked destructive with its verb ("Delete letter"). `explained` and `typed`: an N7 `fit` sheet with the title, the sentence (including what stays, for example the D1 line that the book stays on this phone), the safe choice as `filled` `lg` and default, the destructive choice as `destructive` text with the Trash icon; `typed` adds an I1 field and keeps the destructive choice not ready until the word matches, then a `destructive` fill (DELETE_THIS_BOOK proposal adopted).
- **Variants**: `simple` (Let it go, Delete letter, Open now, Use this picture instead, Remove a typed day, Undo join), `explained` (sign-out with its D1 sentence and three choices, Erase everything on this phone), `typed` (Delete account D6, Delete this book).
- **States**: default (safe focused first for VoiceOver after the title); pressed; not ready; loading (the destructive choice busy while the server works; sheet not dismissible); error (line in the sheet, Try again). AX5: choices stack, safe first, both full width. VoiceOver: title, sentence, safe choice, destructive choice. Voice Control: the words. Haptic `warning` with the outcome only.
- **Layer**: system (action sheet or alert, glass by iOS) for `simple`; glass regular sheet with content inside for `explained` and `typed`.
- **Implementation**: `components/book/confirm-sheet.tsx` moves to `components/ui/confirm-sheet.tsx` with `kind: 'simple' | 'explained' | 'typed'`. `simple` calls the native confirmation: SwiftUI `confirmationDialog` through `@expo/ui` behind `platform/confirm` if it anchors to the source (UNVERIFIED in `@expo/ui` 57), else `ActionSheetIOS.showActionSheetWithOptions` with `cancelButtonIndex` and `destructiveButtonIndex` (anchor is iPad-only, UNVERIFIED on iPhone iOS 26), else `Alert.alert`. The 12 existing `confirm()` call sites (AUDIT 2.1) route through it, so there is one helper. The Delete this book page keeps its typed step but draws it with `typed`.
- **Used by**: A-S11, A-S12, B-S14, B-S15, C-S03, C-S19, C-S20, C-S22, D-S09, D-S19; NS-09, NS-01, NS-06 B, NS-21, D1, D6.

## 7. System

### S1. Notification renderings
- **Purpose**: what our notifications look like on the lock screen and in Notification Centre (NS-32, NS-13, NS-18).
- **Anatomy**: system banner: app icon, app name, title, body; grouped by `threadIdentifier` per book; category per class (evening, typed day, month, birthday, plan).
- **Variants**: `previews shown` (title and body from the approved keys; no child name or letter text by default), `previews hidden` (system shows the app name and "Notification"; our content does not matter), `typed day` (the parent's own words only when the parent turned that on, D-S10).
- **States**: system. VoiceOver: system reads title and body.
- **Layer**: system (glass by iOS).
- **Tokens**: none of ours beyond the app icon layers (FOUNDATIONS, Icon Composer: default, dark, clear, tinted).
- **Implementation**: `settings/notification-preview.tsx` draws a faithful preview on the Reminders screen (content layer, `material.content.thin` over a drawn wallpaper, never real glass, since it is a picture of a notification inside content).
- **Used by**: D-S06 (live preview), D-S10; NS-32.

### S2. Lock-screen privacy snapshot
- **Purpose**: the app switcher snapshot and the App Lock cover never show a letter or a name.
- **Anatomy**: as built `PrivacyCover`: opaque `bg`, the mark only (96 pt, as the splash), no entrance animation; VoiceOver reads the app name only.
- **Layer**: content (opaque by design; never glass, which would show what is behind).
- **Implementation**: moves from `components/app-lock/privacy-cover.tsx` to `components/ui/privacy-cover.tsx` (hand-off named in its header).
- **Used by**: E-S22, every screen as the app leaves the front.

## 8. Infrastructure the components need (NEW, house)

| Name | What | Why |
|---|---|---|
| `useMaterial()` (`lib/material.ts`) | `{ glass: boolean, clear: boolean, highContrast: boolean }` from `isLiquidGlassAvailable()`, `isGlassEffectAPIAvailable()`, `AccessibilityInfo.isReduceTransparencyEnabled()` and its change event, Increase Contrast | One check for rule 1.1.5; `isLiquidGlassAvailable()` ignores accessibility settings (Expo v57) |
| `GlassSurface` (`components/platform/glass-surface.ios.tsx`, `.tsx` fallback) | `GlassView` when `glass`, else `material.solid` View with hairline; props `variant` regular or clear, `dim`, `tint`, `interactive` | One place imports `expo-glass-effect` (lint rule, like `expo-blur` today) |
| `GlassCluster` | `GlassContainer` with `spacing` from tokens, fallback a plain View | Rule 1.1.2 |
| `GlassLayer` context | tells A1 whether it sits in the glass layer | Rule 1.1.1 |
| `BlurSurface` | RETIRED on iOS 26 (glass replaces it); kept as the iOS 18 fallback for the Book's inline bar only until N5 moves to the native header | Duplicate material path |

## 9. Reconciliation with FOUNDATIONS, MOTION and AUDIT

Status at writing: `FOUNDATIONS.md`, `tokens.v2.json`, `MOTION.md` and `AUDIT.md` were not yet in the folder; names below are the ones this file asks for. Karma: where the foundations or motion lead chose a different name, theirs wins and this table is the find-and-replace list.

| Name used here | Owner | Meaning |
|---|---|---|
| `material.glass.regular`, `material.glass.clear` | FOUNDATIONS | Liquid Glass variants (system) |
| `material.glass.dim` | FOUNDATIONS | black at 0.35 under clear glass over pictures |
| `material.glass.tint.accent` | FOUNDATIONS | prominent glass tint |
| `material.glass.mergeDistance` | FOUNDATIONS | `GlassContainer spacing` |
| `material.solid` | FOUNDATIONS | Reduce Transparency and pre-26 fallback: `surfaceRaised` plus 1 pt `line` |
| `material.content.thin`, `.regular`, `.thick` | FOUNDATIONS | standard materials in content |
| `size.control.sm|md|lg|xl` (44, 48, 56, 64), `size.row` (52) | FOUNDATIONS | control and list row heights |
| `radius.listSection` and concentric rule | FOUNDATIONS | iOS 26 larger section radius |
| `motion.press`, `motion.fade`, `motion.snappy|standard|gentle` | MOTION | existing primitives |
| `motion.glass.morph`, `motion.glass.materialize` | MOTION | glass shape morph and appear by style |
| `motion.toast.enter|exit|swap`, `motion.tab.swap`, `motion.find.open`, `motion.viewer.open`, `motion.cardToPage`, `motion.newMark`, `motion.rowCollapse`, `motion.progress`, `motion.focusRing`, `motion.button.busy`, `motion.breath.*` | MOTION | hooks named in entries above |

## 10. Retired

| Retired | Replaced by | Note |
|---|---|---|
| `docs/design/COMPONENTS.md` (Oct to Nov 2026) as the component source | this file | Its sections stay as history; 0.2 haptics and 2.17 ListeningAura remain valid and are referenced, not copied |
| COMPONENT_LIBRARY 1 and 5: "no SF Symbols in v1", Phosphor tab icons | N1 SF Symbols in system chrome; Phosphor stays in content | System chrome should use system symbols to match the glass bar |
| COMPONENT_LIBRARY 0.1: NativeTabs "next step after a device spike" | N1 decided | Device check is row R1 |
| JS tabs paper bar (`(tabs)/_layout.tsx` `BAR`, custom Pressable) | N1 | |
| Button variants `primary`, `secondary`, `outline`, `quiet`; size `capture`; `IconButton` variants | A1 styles and `xl` | Mapping in A1 |
| `CaptureBar` spec (2.18) and its `compact` mode | A2 | Never built as specified |
| `@gorhom/bottom-sheet` paper sheet look | N7 system sheet | Swap behind `ui/sheet.tsx`; accessibility contract kept |
| `platform/segmented-control` (SwiftUI Picker) plan | I4 segmented | Native segmented does not stack at AX sizes |
| `Chip variant="filter"`, `ChipGroup scroll` | I4 | No filters in scope |
| `PhotoFrame` (2.23) `cover`, `polaroid`, paging | C3, C4 | Never built |
| `DraftCard`, `ResurfacedCard` shells | C1 variants | Logic files kept |
| `book/undo-toast.tsx` | F1 | |
| Toast "with an action it never times out" | F1 T4 window | Ruling T4 |
| `confirm()` via `Alert.alert` for delete and erase | F6 | |
| `BlurSurface` on iOS 26 | `GlassSurface` | |
| `StickyFooter` (spec only) | N3 toolbar or A1 pinned | |
| Hand-placed gear and Months buttons on `CoverBand` | N5 header items | |

## 11. Engineering rows needed (proposed backlog rows)

| Row | Lane | What |
|---|---|---|
| R1 | mobile | Native tabs (N1): swap `expo-router/js-tabs` for `unstable-native-tabs`, SF Symbol icons with PNG fallback, `ThemeProvider`, keep `test/tab-bar.test.ts` green; device check of VoiceOver "1 of 3" and Large Content Viewer |
| R2 | mobile | ToastHost offset without a measured tab bar (native tabs cannot be measured) |
| R3 | mobile | A Stack inside the Book tab; move gear and Months into `Stack.Toolbar` right items and the More menu (N5, N6) |
| R4 | design-systems | Device spike: `@expo/ui/community/bottom-sheet` renders iOS 26 glass and keeps `ui/sheet.tsx`'s accessibility contract; else route sheets via `formSheet` |
| R5 | design-systems | `lib/material.ts`, `platform/glass-surface`, `GlassCluster`, `GlassLayer`; lint ban on `expo-glass-effect` outside `platform/` |
| R6 | design-systems | Toast T4 window: `windowSeconds`, VoiceOver completion, Switch Control detection module; tests for the three cases |
| R7 | mobile | Keep gate as a system sheet over Review with StoreKit's view presenting over it |
| R8 | design-systems | Button styles and `xl` size (A1), with the variant mapping and a codemod of callers |
| R9 | design-systems | Device check: date picker inline style at AX5 on SE 3 |
| R10 | mobile | Writing tools off on letter fields (I2): verify the RN prop, else a native patch |
| R11 | design-systems | New files: `capture-cluster`, `record-control`, `find-bar`, `photo-thumb`, `photo-viewer`, `dateline`, `system-line`, `progress`; moves: `date-sheet`, `confirm-sheet`, `privacy-cover` into `components/ui` |
| R12 | design-systems | Story screen `(dev)/components.tsx` mirrors `REFERENCE.html` (light, dark, Reduce Transparency, Increase Contrast, Reduce Motion, AX5) |

## 12. Gaps and open points

- G1. iOS 26 asks for title-style capitalisation in section headers. Our content rules use sentence case for every parent-facing word (VOICE.md). Proposed default: keep sentence case; content lead to confirm.
- G2. The e2e `DESIGN.md` files were skeletons at writing (screen ids only). Their "components used" sections will key to the ids here; each area lead should check every new component they name against this list before adding one.
- G3. Whether `GlassContainer` animates a shape change (A3 morph) is UNVERIFIED; the fallback is stated in A3.
- G4. Glass budget on the letter page assumes the tab bar stays visible on pushed screens in the Book stack; if B decides to hide it, the bottom toolbar (N3) becomes available there.
