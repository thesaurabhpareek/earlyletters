# Design language v2: the uplift (proposal, 21 Nov 2026)

Status: PROPOSAL for Karma, mobile and the founder. Author: `design-systems`, with the Chief Design Officer view. Docs only: no token or component file is changed by this pull request. Every new word on a screen is PROPOSED and goes to `content`.

Founder feedback that started this: the drawn screens look "much more basic than current design", so uplift. Decision taken (not asked): the uplift is craft, depth, type, motion and polish on the warm paper language we have. It is not decoration, not gamification, and not a new brand.

Public name: always `{app}` here; the value lives only in `packages/brand/index.ts`. Family in examples: Asha.

## 0. What I could not verify (read this first)

1. **The design canvas and the phone page were not opened.** This session has no tool that reads a claude.ai canvas or artifact (slug `99700692-40d2-4407-8168-0c556f67aa19`; phone page slug `fd3d2aa4-9a13-4225-ab51-faa4cdf4e4e4`). The audit below uses what is in the repo: the tokens, `docs/design/*`, `docs/design/e2e/INDEX.md` screen ids, and two real renders (`docs/design/calm-brand/after/tonight-light.png`, `book-empty-light.png`). Where I say a screen "reads basic", the evidence is the code, the spec or those renders, not the canvas. If the canvas is drawn flatter than the build, the fix is to redraw it from this proposal.
2. **Nothing was run on a device.** No simulator, no iPhone, no iPhone SE 3. Every contrast ratio below is computed with the WCAG 2.x formula, not seen. Glass, blur and motion are described, not observed.
3. **Apple pages were read as Markdown through a summarising fetch tool, on 21 Nov 2026.** Materials, Tab bars, Toolbars, Sheets, Color, Motion, Playing haptics, SF Symbols, Live Activities and Adopting Liquid Glass came back whole. Typography and Widgets came back truncated (I read the parts on size tables, emphasized weights, rendering modes and the change log only). I did not read the Accessibility, Dark Mode, Layout, Lists and tables, Buttons, Icons or App icons pages for this run.
4. **iOS 27 facts are second hand.** I saw the Apple newsroom listing and a MacRumors headline for the 14 Sep 2026 release, and read one MacRumors article from 10 Jun 2026 (WWDC). I did not read Apple's iOS 27 release notes or watch the WWDC 2026 sessions. The "transparency slider" below is from that June article and is pre-release reporting.
5. **Unknown to me:** our iOS deployment target, whether `expo-router` native tabs are stable in the SDK we ship (the repo said `unstable-native-tabs` on 3 Oct 2026), and iPhone corner radii. Each is flagged where it matters.

## 1. Research notes: what current iOS design means

HIG pages carry no version number; I use the newest change-log entry as the page date. "Seen" is 21 Nov 2026.

| Source | Page date (change log) | Release it describes | What it says that matters to us |
|---|---|---|---|
| HIG Materials, `developer.apple.com/design/human-interface-guidelines/materials` | 9 Sep 2025 (Liquid Glass first added 9 Jun 2025) | iOS 26 and later | Two materials: Liquid Glass for the controls and navigation layer floating above content, standard materials for the content layer. "Don't use Liquid Glass in the content layer." Use custom glass sparingly. Regular variant for text-heavy parts, clear only over rich media. iOS keeps four standard materials (ultra-thin, thin, regular, thick). Use vibrant label and fill colours on materials. |
| Adopting Liquid Glass, `developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass` | undated page | iOS 26 and later | Standard bars, sheets, popovers and controls adopt the material automatically. Remove custom backgrounds on navigation bars, tab bars and toolbars. Controls get rounder, concentric corners. Tab bars can minimise on scroll (`tabBarMinimizeBehavior`). Half sheets are inset with a larger radius and turn more opaque when expanded. Lists and forms get larger row height and padding, and section headers move to title-style capitalisation. App icons use layers with default, dark, clear and tinted looks. A `UIDesignRequiresCompatibility` key keeps the old look. Reduced transparency and motion settings change the effects, so test them. |
| HIG Tab bars | 8 Jun 2026 (also 16 Dec 2025) | iOS 26 and later | The bar floats on Liquid Glass. Navigation only, always visible, never disable a tab, single-word labels, prefer filled symbols. Do not tint labels close to the colour of the content behind. |
| HIG Toolbars | 16 Dec 2025 | iOS 26 and later | Group items by function, at most three groups. Symbols beat text, without circle borders. One prominent action (Done), trailing. Reduce backgrounds and tint. Standard Back and Close glyphs, no "Back" text. Large title on iOS. |
| HIG Sheets | 24 Mar 2026 | iOS 26 and later | Cancel leading, Done trailing; medium detent for progressive disclosure; grabber on resizable sheets (it also lets VoiceOver users resize); swipe to dismiss, with a confirm if there are unsaved changes; one sheet at a time. |
| HIG Color | 16 Dec 2025 | iOS 26 and later | Liquid Glass has no colour of its own. Put colour on the background of the one primary action, not on symbols or on many controls. Supply light, dark and increased-contrast variants of every custom colour. Never colour alone. Do not hard-code system colour values. |
| HIG Typography | part read | iOS 26 and later | Default 17 pt, minimum 11 pt on iOS. Large (default) table: Large Title 34/41 regular (bold emphasized), up to 60/70 at AX5. Emphasized weights are medium, semibold, bold or heavy. |
| HIG Motion | 9 Sep 2025 | iOS 26 and later | Purposeful, brief, cancellable, never the only signal; avoid motion on frequent interactions; pair with haptics and sound. Liquid Glass responds to touch with more emphasis. |
| HIG Playing haptics | 7 May 2024 | all current iOS | System patterns keep their documented meaning (notification success, impact, selection). Consistent cause and effect, short, complementary, optional, and do not disturb the microphone. |
| HIG SF Symbols | 28 Jul 2025 | SF Symbols 7 (iOS 26) | Four rendering modes (monochrome, hierarchical, palette, multicolor), gradients (7), variable color, nine weights matched to the text weight. Animations: appear, bounce, scale, pulse, variable color, replace and Magic Replace, wiggle, breathe, rotate, and Draw On and Draw Off (7). "Apply symbol animations judiciously." |
| HIG Live Activities | 13 Oct 2026 | iOS 26 and later | For tasks with a start and an end, under eight hours; glanceable; large medium-or-heavier text; do not show sensitive content on the Lock Screen. The page links WWDC 2026 session 223 (not watched). |
| HIG Widgets | 13 Oct 2026 | iOS 26 and later | Full-colour, accented (tinted or clear glass) and vibrant rendering. The system desaturates full-colour art in clear and tinted looks; keep full-colour images for media. |
| MacRumors, "Here's How Liquid Glass Is Changing in iOS 27", `macrumors.com/2026/06/10/how-liquid-glass-is-changing-in-ios-27` | 10 Jun 2026 (secondary source) | iOS 27 (shipped 14 Sep 2026 per MacRumors) | A transparency control from clear to tinted, better diffusion of busy backgrounds, a uniform toolbar scrim when content scrolls under floating bars, sharper layered app icons, and many changes arriving without recompiling. |

What this adds up to for a keepsake app:

1. "Current iOS" is **Liquid Glass on the navigation layer, calm solid content underneath**. The content layer (a person's letters) stays paper. Glass belongs to the bar, the toolbar, sheets and the few floating controls.
2. Apple's own advice is to **use standard components and remove custom bar backgrounds**. Our paper tab bar with a hairline is the clearest place we look dated next to the system.
3. Depth comes from **layering, concentric radii and generous list padding**, not from effects.
4. SF Symbols are the system's icon voice, and they animate. Our icon set is Phosphor.
5. Accessibility is part of the material: transparency, contrast and motion settings change it, so we need a solid fallback for every glass use.

## 2. Audit: where we read basic

Evidence is by screen id from `docs/design/e2e/INDEX.md`. "Render" means the two PNGs named in section 0. The canvas was not read.

| # | Finding | Evidence | Why it reads basic |
|---|---|---|---|
| A1 | Navigation is a flat paper bar with a hairline, three Phosphor icons and 13 pt labels, not the system tab bar. | `BENCHMARK.md` "Tab bar": "Paper bar with a hairline (not Liquid Glass yet)"; `COMPONENT_LIBRARY.md` 0.3 says native tabs wait for a device spike; render `tonight-light.png`. Applies to A-S01, B-S01, C-S01 and every tab root. | It is the first thing that dates the app next to Notes, Journal and Music on iOS 26 and later. |
| A2 | Surfaces are flat. Elevation 1 is one 6% shadow; the Home prompt card is `#FFFFFF` on `#FBF8F3`, and the slip card is a flat tint with no edge. | `tokens.ts` `elevation[1]`; render `tonight-light.png` (prompt card and "A letter is waiting to be read back." slip). A-S01. | Three near-identical pale layers with no light edge, so nothing feels held or placed. |
| A3 | Dark mode separates layers by only 1.10:1 (`surfaceRaised #201D1A` on `bg #161412`) and leans on a 1 px line. | `tokens.ts` dark colours; computed 21 Nov 2026. B-S01.dark, B-S08.dark, E-S10.dark. | At night the cards and sheets merge into one block. |
| A4 | Type has a good serif voice but a thin ladder. Card titles, section headers, timers and numbers have no style of their own, and small kickers are ALL CAPS ("ASHA 7 MONTHS", "A THOUGHT TO START WITH"). | `tokens.ts` `type` has no `title3`-sized serif card title, no timer style, no kicker style; render `tonight-light.png`. A-S01, C-S01. | Hierarchy is carried by size alone, and all caps is what iOS lists have moved away from. |
| A5 | Icons are a third-party set (Phosphor) at fixed sizes, so they do not track text weight and cannot use symbol animation. | `DESIGN_LANGUAGE.md` section 7. All tab roots, A-S05 mic, A-S07 Keep. | Weight mismatch against SF text beside it, and the recording and saved moments lose the system's own symbol effects. |
| A6 | Sheets are a JavaScript bottom sheet with 28 pt top corners, not the system's inset, glass half sheet. | `COMPONENT_LIBRARY.md` 0.1 (`@gorhom/bottom-sheet`) and its recorded native alternative `@expo/ui/community/bottom-sheet`. A-S02, B-S07, E-S10, A-S08. | Sheets are on every important moment (whose book, when was this, Keep). They are the most visible custom surface. |
| A7 | Empty and first-run moments are one quotation mark, a serif line and one button, with a large blank field (render `book-empty-light.png`, B-S01.empty). | Render; `DESIGN_LANGUAGE.md` section 9 says "sparse line drawings", but the render has none. B-S01.empty, B-S01.firstUse, E-S02. | The product's whole promise (a book) is not shown as an object. A closed book cover exists (`components/book/book-cover.tsx`) and is not used here. |
| A8 | Keep and capture moments are specified well in motion (MOTION 5e, 5b) but use our own check and a flat red disc. | `tokens.ts` `motion.file`, `breath`; A-S05, A-S07, A-S13. | The mic and Keep moments could use system symbol effects (breathe, Magic Replace, Draw On) and the success haptic with less custom code. |
| A9 | Letter reading is good in line height (20/32) but has no measure cap, paragraph rhythm or page edge, so on a large phone the text feels like a web page. | `tokens.ts` `letterBody`; B-S08. | The one screen that must feel like a keepsake has the least craft. |
| A10 | Settings is the stock grouped list with our colours, so it reads like a default list, not a calm room. | C-S01 and the settings routes in `IA-FINAL-20nov.md`. | Settings is where the app is most like every app; row height, group radius and header case should match iOS 26 lists. |
| A11 | Motion is well specified (7.5 s breath, 200 ms fades, route dissolves). Not a gap. | `tokens.ts` `motion`, `MOTION.md`. | Kept as is. Listed so it is not rebuilt. |

## 3. The proposal: design language v2

Principles from v0.3 stay (voice is the treasure, written for 2 a.m., quiet UI and loud letters, joy without scorekeeping, equal doors, big enough for Nani, honest about privacy). v2 adds five rules.

**R1. Two layers, named.** The *content layer* is paper: letters, the book, prompts, cards. It never uses glass. The *navigation layer* is the system's: tab bar, toolbars, sheets, menus, and at most one floating control. We use Apple's standard component and do not paint it (no custom bar background, no tint on more than the one primary action).

**R2. Depth by light, not by effect.** A card has a two-part shadow (ambient plus key), a 1 px top highlight, and a radius concentric with its container. In dark, depth comes from lighter surface steps plus the highlight, not from shadow. No gradients on surfaces, no glow on cards, no parallax.

**R3. Type has a ladder with a job per rung.** Serif for what a person said or what they will keep; sans for everything that does something. Kickers are title case, not all caps. Numbers that change (the recording timer) use tabular figures.

**R4. Symbols, not stickers.** On iOS, chrome and actions use SF Symbols in the weight of the text beside them. Symbol effects are used for exactly three moments: recording (breathe), Speak to Stop (Magic Replace), Kept (Draw On). Each has a Reduce Motion static form and never replaces a word.

**R5. The book is an object.** Empty and first-run screens show the closed book cover, not a blank page. It is the app's one illustration, in paper and ink, with no faces and no mascot.

Fixed from before and not negotiable: no streaks, points, badges, confetti or progress rings; celebrate what exists and never count gaps; no fear, guilt or loss language; never gender the child (`{child}`); AX5 with letter text never truncated (D-027); VoiceOver label and order on every screen; 44 pt targets; Reduce Motion and Reduce Transparency honoured; light and dark; iPhone SE 3 (375 by 667 pt) is a release gate; colour is never the only signal.

### 3.1 The eight hero screens (drawn in the before and after artifact)

| # | Screen (id) | Before (as built or specified) | After (v2) |
|---|---|---|---|
| 1 | First run welcome (E-S02) | Quotation mark, serif title, three lines, buttons on flat paper. | The closed book cover is the hero object (R5), the lamp light stays, title in `display`, one prominent pill on the accent, the second action as a plain text button, agreement line in `footnote` with links. |
| 2 | Capture, recording (A-S05) | Red disc with a breathing glow. | Concentric breathing rings (the glow stays) around a system-weight mic; "Listening." in `title2` serif; timer in the new `timer` style with tabular figures; "Say it however it comes." as `subhead`; "Let it go" as a quiet button and the stop control as one glass circle (the one floating control on this screen). No waveform. |
| 3 | Review of a take (A-S07) | A sheet with To, day, From, words, Keep. | Letter on a raised paper card with the dateline above, machine-edited words keep the dotted `editMark`, the bar at the bottom is one prominent "Keep" on the accent with "Let it go" beside it as plain text; the card has the v2 shadow and highlight. |
| 4 | Keep sheet (E-S10) | A custom bottom sheet. | The system sheet at medium detent, a grabber, a 34 pt radius, title in `title2` serif, one prominent action, Cancel leading. Words unchanged. |
| 5 | Book home (B-S01) | Title, cover band, month list on flat paper, paper tab bar. | Large serif title, the cover band as the one lit object with a v2 shadow, month rows with larger padding and concentric radius, and the system floating tab bar (glass) that minimises on scroll. |
| 6 | A letter, reading view (B-S08) | Text column, dateline, "This letter" list. | A measure cap of about 62 characters, 12 pt paragraph gap, dateline in `letterDateline`, a quiet play row, the signature in italic serif, and a toolbar with standard back and one overflow menu. Reading Size stays. |
| 7 | Settings home (C-S01) | Stock grouped list. | iOS 26 list metrics (taller rows, larger group radius), title-case section headers, SF Symbols at text weight in muted tint, no coloured icon tiles. |
| 8 | An empty state (B-S01.empty) | Quote mark, serif line, button. | The closed cover at 3:4 on a soft shadow, "The first page is waiting." in `title1`, one line of `body`, one prominent button. Nothing counts what is missing. |

## 4. Token changes (named, for `packages/design-tokens/src/tokens.ts`; not made in this PR)

All colour values below were checked with the WCAG 2.x formula on 21 Nov 2026. Every existing contrast test must still pass; the brand-parity test covers `bg`, `text`, `accent`, `accentDeep`, so I leave those alone.

### 4.1 Color

| Token | Now | Proposed | Check |
|---|---|---|---|
| `dark.surface` | `#1B1917` | `#1D1A17` | text 14.76:1 |
| `dark.surfaceRaised` | `#201D1A` | `#27231F` | text 13.29:1, muted 6.80:1, accent 7.10:1; layer step against `bg` 1.10 to 1.18 (decorative, so no 3:1 needed; the highlight below carries the edge) |
| new `light.highlight` | none | `#FFFFFFB3` (top edge of a raised card) | decorative only |
| new `dark.highlight` | none | `#FFFFFF14` | decorative only |
| new `light.barFallback`, `dark.barFallback` | none | `= bg` at full opacity | used when Reduce Transparency is on, for any custom bar or floating control |
| `highContrast` | exists | add `highlight` as `line` strength | Increase Contrast |

Rule: the accent colours the background of the one primary action (Apple's own prominent button rule), never the symbols of several controls.

### 4.2 Type (new styles; none removes an old one)

| Token | Value | Use |
|---|---|---|
| `kicker` | sansMedium 14/18, title case, letterSpacing 0.1, `dynamicTypeStyle` footnote, maxScale null | replaces the all-caps kickers (A-S01, C-S01); `letterDateline` keeps its tracking |
| `cardTitle` | serifMedium 22/28 (as `title2`), maxScale 2.0 | prompt and cover titles on cards |
| `timer` | sansMedium 40/44, `fontVariant: ['tabular-nums']`, `dynamicTypeStyle` title1, maxScale 1.6 | recording elapsed time (A-S05); also announced to VoiceOver as words, never as the digits alone |
| `letterParagraphGap` (new scalar) | 12 pt | between paragraphs in a letter |
| `readingMeasure` (new scalar) | 560 pt max text width, about 62 characters at `letterBody` | B-S08, Read together; at AX sizes the column is the full width and the cap is lifted so text never truncates |

### 4.3 Radius

| Token | Now | Proposed | Note |
|---|---|---|---|
| `radius.md` | 14 | 18 | cards, rows |
| `radius.lg` | 20 | 24 | feature cards, cover band |
| `radius.xl` | 28 | 34 | custom sheets and the capture surface (system sheets use the system radius) |
| new `concentric(outer, inset)` | none | `max(outer - inset, 4)` | a child's radius is its container's minus the padding. Device corner radii were not verified, so the gutter-to-corner check is a device task. |

### 4.4 Elevation and material

| Token | Now | Proposed |
|---|---|---|
| `elevation[1]` | y2 / 6 / 6% | two layers: `0 1px 2px rgba(43,39,34,0.06), 0 4px 12px rgba(43,39,34,0.05)` |
| `elevation[2]` | y6 / 16 / 10% | `0 2px 4px rgba(43,39,34,0.06), 0 10px 24px rgba(43,39,34,0.09)` |
| `elevation[3]` | y12 / 32 / 16% | `0 4px 8px rgba(43,39,34,0.08), 0 18px 40px rgba(43,39,34,0.14)` |
| new `material` | none | `{ bar: 'system', sheet: 'system', card: 'solid', overMedia: 'ultraThin' }`. It names which layer uses what; `system` means the platform component, with `barFallback` under Reduce Transparency. No glass in `card`. |

Native shadows need two `shadow*` layers; React Native supports one per view, so the second layer is a wrapping view. Mobile to confirm cost on an SE 3.

### 4.5 Spacing

| Token | Now | Proposed |
|---|---|---|
| gutter | `space.4` (16) | `gutter: { compact: 16, regular: 20 }`, compact below 390 pt width (so SE 3 stays at 16) |
| section gap on Home and Book | `space.9` to `10` | `space.10` (48) at regular width, `space.9` at compact |
| list row minimum | 44 | 52 in lists and settings (the iOS 26 lists are taller); targets stay 44 |

### 4.6 Motion and haptics

| Token | Proposed |
|---|---|
| `motion.heroEnter` | `{ dy: 12, durationMs: 420 }`, content only, first run and empty states, on `standard`; Reduce Motion: 200 ms fade |
| `motion.symbol` | `{ record: 'breathe', swap: 'magicReplace', kept: 'drawOn' }`; each has a static Reduce Motion form; Draw On needs SF Symbols 7, so it is guarded by OS version |
| existing `breath`, `file`, `lamp`, `route` | unchanged |
| haptics | unchanged: light impact on record start and stop, notification success on Keep, selection on Reading Size, none during playback (matches HIG "complement, consistent, short, optional") |

### 4.7 Icons

On iOS, use SF Symbols for tab bar, toolbars, menus, rows and the mic and Keep actions, via the platform symbol API. Phosphor stays for Android and web and for the line drawings. The brand mark is not a symbol and does not change. A custom symbol needs an accessibility label (HIG SF Symbols).

## 5. Rollout order

1. **Tokens (S to M):** colour, type, radius, elevation, spacing, motion additions, with their contrast tests. No screen changes yet except where a token is picked up automatically. Ship alone, behind no flag.
2. **Shared components (M):** `ui/card` (shadow, highlight, concentric radius), `ui/button` prominent style, `ui/list-row`, `ui/section-header` (title case).
3. **Settings and lists (S to M):** C-S01 and the settings routes, lowest risk, biggest "default list" gap.
4. **Empty and first-run (M):** book cover as the hero object (E-S02, B-S01.empty, B-S01.firstUse).
5. **Sheets (L):** move A-S02, B-S07, E-S10 and the DateSheet to the system sheet via `@expo/ui` after a device spike (detents, grabber, VoiceOver resize, AX5).
6. **SF Symbols on iOS (M):** chrome and actions; symbol effects for the three moments.
7. **System tab bar (L, device spike first):** native tabs, minimise on scroll, Large Content Viewer check, SE 3.
8. **Letter and capture polish (M):** measure cap, paragraph rhythm, the `timer` style, concentric rings.

Each step passes: AX5 with no truncated letter text, VoiceOver order, Reduce Motion, Reduce Transparency, Increase Contrast, light and dark, SE 3.

## 6. What needs the founder

1. **Is the system look the goal?** Moving to the system tab bar and sheets gives the current iOS look and drops our paper bar. It follows his own rule "standard over custom", but it changes how the app first feels. My decision: yes, content stays paper, navigation goes system. He can overrule.
2. **Which two screens felt most basic?** I could not open the canvas, so I chose the eight above from the repo. Two named screens would change the rollout order.
3. **Minimum iOS version.** Glass and Draw On need iOS 26 and SF Symbols 7. If we still support an older iOS, those get the solid fallback. I do not know our deployment target.

Everything else is inside the design-systems rules and has been decided here.

## 7. Content-rule self-check

Text in this file has no em or en dashes, curly quotes, ellipsis characters or emoji; the new words in section 3.1 (none beyond the repo's own) are marked PROPOSED where they differ from the canvas wording and go to `content`. No streak, points, badge, or gap-counting language appears.
