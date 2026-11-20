# Design system v2: Foundations

Status: proposal, 20 Nov 2026, design-systems (foundations lead). Branch `docs/e2e-ux-20nov`. Companion files in this folder: `BRIEF.md` (the decided Apple facts and material policy, not reopened here), `AUDIT.md` (disposition of prior work), `COMPONENTS.md`, `MOTION.md`, `REFERENCE.html`, and `tokens.v2.json` (the token proposal that goes with this file). This file changes no card (CR-66) and no production code; it specifies what `design-systems` and `mobile` build through the rows in section 14.

Premium, for this product, means restraint: one paper, one ink, one warm accent, two typefaces doing different jobs, spacing on a strict 4 pt scale, glass only where Apple puts it, and nothing decorative that a tired parent at 2 a.m. has to look past.

## 0. Sources and how they were checked

Read this session (20 Nov 2026), from Apple's HIG documentation JSON (`developer.apple.com/tutorials/data/design/human-interface-guidelines/<page>.json`, the same pages as `developer.apple.com/design/human-interface-guidelines/<page>`):

| Id | Page | Change log top entry | Used for |
|---|---|---|---|
| A1 | Typography | 16 Dec 2025 (emphasized weights added) | Dynamic Type tables, every size from xSmall to AX5, default 17 pt, minimum 11 pt |
| A2 | Materials | 9 Sep 2025 | Liquid Glass regular and clear, 35 percent dim, standard materials, vibrant labels |
| A3 | Color | 16 Dec 2025 | Liquid Glass colour, increased-contrast variants for custom colours |
| A4 | App icons | 28 Oct 2026 | Layers, Icon Composer, appearances (default, dark, clear light, clear dark, tinted light, tinted dark), 1024 px |
| A5 | SF Symbols | 28 Jul 2025 | Rendering modes, nine weights, three scales, fill versus outline, no symbols in icons or logos |
| A6 | Layout | 9 Sep 2026 | Liquid Glass separates controls from content, scroll edge effect, text-size adaptation |

Also read or measured this session:
- `BRIEF.md` section 1 (Apple facts, including the iOS 27 intensity slider from press reports, and the Expo SDK 57 `expo-glass-effect` and native tabs facts). Those are the brief's citations; where this file leans on them it says "BRIEF 1".
- React Native's Dynamic Type multipliers, `RCTAccessibilityManager.mm` on `facebook/react-native` main: one multiplier for every text style, 1.0 at Large up to 3.571 at AX5.
- The bundled font files in `packages/design-tokens/fonts`, opened with fontTools 4.67: weight class, features and average advance (section 4).
- SF Symbols availability by version from `sf-symbols-typescript` 2.2.0 (npm registry, data only), used to keep every symbol name at SF Symbols 5.0 or earlier, because the app's deployment target is iOS 17.0 (`apps/mobile/app.config.ts` line 44).
- WCAG 2.x contrast for every pair in section 3, computed by script with the relative-luminance formula (alpha composited where a colour has alpha).

UNVERIFIED (not read this session; check before building): the exact props of `expo-router/unstable-native-tabs` in 57.0.24 (`sf` icon prop shape, label font control); whether `GlassView` follows the iOS 27 intensity slider (expected, since it wraps the system glass effect); `expo-blur` tint names in 57.0.3; iPhone point widths other than 375; system corner radii of sheets, grouped lists and the display; Icon Composer option names; whether the SF Symbols licence restricts `icloud.*` symbols to iCloud features.

## 1. Two layers

Apple's model, which we adopt without change (A2, A6, BRIEF 1): a content layer and a functional layer that floats above it.

| Layer | What lives there | Material | Our tokens |
|---|---|---|---|
| Content | Letters, Book pages, the letter page body, Read together pages, lists of letters, cards in the flow, settings lists (system grouped list), empty states, errors | Paper (solid tokens). Standard materials only where something must show through. Never Liquid Glass | `bg`, `surface`, `surfaceRaised`, `accentSoft`, `line`, the lamp (`tokens.atmosphere`) |
| Functional | Tab bar (native tabs), navigation and toolbar buttons, the Home capture cluster, sheets and the Keep gate sheet, menus and popovers, the Find bar, the Book header controls, the undo toast, the recording control while recording | Liquid Glass, regular. Clear with a 35 percent dim only over a picture | `material.glass.*`, `material.solid`, `glassLabel`, `glassLabelSecondary`, `glassFallback`, `glassBorder`, `glassDim`, `onMedia` |

Rules that follow from the policy (BRIEF 3), restated here so the tokens carry them:
1. One `GlassContainer` per cluster; glass never inside glass; at most three glass surfaces visible on any screen. The tab bar counts as one.
2. A glass surface carries no shadow, border or background of our own (section 7). The system draws its edge, highlight and depth.
3. Colour on glass is rare (A3): at most one tinted (prominent) glass element per screen; the Home capture cluster counts as one, so Speak and Type stay equal twins in one tinted cluster.
4. Paper never imitates glass. No translucent paper, no blur on content, no frosted cards.

## 2. Materials

### 2.1 Liquid Glass

| Token | `GlassView` setting | Where (BRIEF 3) | Labels on it |
|---|---|---|---|
| `material.glass.regular` | `glassEffectStyle="regular"`, no tint, `isInteractive` on pressable surfaces only | Tab bar (system), toolbar and navigation buttons (system), capture cluster, Find bar, Book header controls, undo toast, recording control while recording, menus and popovers (system) | `glassLabel`, `glassLabelSecondary`; symbols in `glassLabel` |
| `material.glass.tint.accent` (prominent) | `regular` with `tintColor = accent` (the scheme's value) | The one primary action on a screen that sits on glass: the capture cluster on Home, Keep or Done in a sheet toolbar (system prominent glass button) | `onAccent` |
| `material.glass.clear` | `glassEffectStyle="clear"` over a `material.glass.dim` layer (colour `glassDim`, black at 35 percent) local to the controls, never over the whole picture | Controls over a picture: the photo on Review and on the letter page, the Photos lens viewer | `onMedia`, icon only (see 2.4) |
| `material.glass.mergeDistance` | `GlassContainer spacing` = 12 pt, the same as the gap between capsules in a cluster (`layout.controlGap`), so capsules rest apart and morph when they move closer. Tune on device | Every cluster | |
| `material.solid` | Not glass: `glassFallback` fill with a 1 pt `glassBorder` edge | Every glass surface under Reduce Transparency, below iOS 26, on Android and on web (2.3) | `glassLabel`, `glassLabelSecondary` |

Implementation rules (Expo SDK 57, BRIEF 1):
- Render glass only when `isLiquidGlassAvailable()` is true and `AccessibilityInfo.isReduceTransparencyEnabled()` is false. `isLiquidGlassAvailable()` ignores accessibility settings, so both checks are needed, and the second is a live subscription (`reduceTransparencyChanged`).
- Pin `colorScheme` on custom `GlassView`s to the app's scheme. Our label tokens are scheme-specific; letting a small glass element flip appearance with the content under it (A3, toolbars and tab bars) would leave our ink on a dark glass. System bars keep their own adaptive behaviour; we only pin our custom glass.
- Never set opacity 0 on a glass view to hide it (it stops rendering, BRIEF 1). Animate `glassEffectStyle` to `none`, or unmount; timing in `MOTION.md`.
- Corner shape comes from the view's own `borderRadius` (section 6); no clipping parent.

### 2.2 Standard materials (content layer)

Apple keeps four standard materials on iOS for the content layer: ultra-thin, thin, regular (default) and thick (A2). Our default for separation in the content layer is solid paper, which is calmer and costs nothing; a standard material is allowed only where the thing underneath must stay visible.

| Token | iOS (`expo-blur` `BlurView` tint, UNVERIFIED names) | Allowed use | Solid fallback (light / dark) |
|---|---|---|---|
| `material.content.ultraThin` | `systemUltraThinMaterial` | None by default. Apple: avoid the lowest label vibrancy on thin and ultra-thin (A2); our muted text would be at risk | `bg` |
| `material.content.thin` | `systemThinMaterial` | A sticky in-content header over scrolling letters, if a screen keeps one (the Book's month header while its section scrolls); the drawn notification preview on Reminders | `bg` |
| `material.content.regular` | `systemMaterial` | A panel inside the content layer over mixed content, such as a caption plate under the Photos lens image (never over a face, never over the words of a letter) | `surface` |
| `material.content.thick` | `systemThickMaterial` | Fine text over a busy picture where the text must win (Apple: thicker gives better contrast for fine features, A2). Expected to be rare | `surfaceRaised` |

Text on a standard material uses `text` and the Increase Contrast muted value (`glassLabelSecondary`) for secondary text, never `textMuted` at default strength: the material's colour is set by the system and can change with settings (A2: choose by meaning, not by the colour it imparts).

### 2.3 Fallbacks: Reduce Transparency and iOS earlier than 26

The deployment target is iOS 17.0, so iOS 17 to 25 users always get the fallback. Every glass surface keeps its shape, size and position and becomes:

| Case | Surface | Edge | Labels |
|---|---|---|---|
| Glass regular, fallback (`material.solid`) | `glassFallback` (light #FFFFFF, dark #282421) | 1 pt `glassBorder` (= `line`; under Increase Contrast its HC value, #6B645B light, #B3AA9E dark) | `glassLabel`, `glassLabelSecondary` |
| Glass prominent, fallback | `accent`, solid | none | `onAccent` (5.82 light, 8.11 dark) |
| Glass clear over a photo, fallback | `mediaSolid` (#2B2722 at 100 percent, both schemes) disc or capsule | none | `onMedia` #FFFFFF, 14.83:1 |
| Standard materials | The solid in 2.2 | `line` hairline where it meets content of the same colour | Normal text tokens |

Dark `glassFallback` is a new value one step above `surfaceRaised` (1.09:1 against it, 1.19:1 against `bg`) so a floating bar still reads as above a raised card in the dark; it is chrome, never a content surface.

On iOS 17 to 25 the native tab bar and navigation bars draw the system's pre-glass bars; we add nothing to them (A6: remove custom backgrounds from system bars).

### 2.4 Clear glass over pictures: computed contrast

Apple: clear glass only over visually rich backgrounds, with about a 35 percent dark dim over bright content (A2). The dim is the policy value (BRIEF 3). Computed for white (`onMedia`) on the 35 percent dim, ignoring any luminosity adjustment the glass itself makes:

| Picture under the control | Contrast of white |
|---|---|
| Pure white (#FFFFFF) | 2.43:1 |
| Light grey (#DCDCDC) | 3.23:1 |
| Grey #B4B4B4 | 4.61:1 |
| Mid grey #808080 | 7.69:1 |

White passes 3:1 when the picture under the control is no lighter than grey #E4E4E4, and 4.5:1 when no lighter than #B6B6B6. So:
1. Controls on clear glass are symbol-only (a non-text 3:1 target), with the symbol at Semibold (section 8), and their accessibility label carries the words.
2. Text never sits on clear glass. A caption, a time or a name over a picture uses the solid `mediaSolid` capsule or `material.content.thick`.
3. The worst case (a blown-out white sky under the control) fails at 35 percent. See open question Q1: it is a measurement for device, not a reason to change the policy here.
4. Increase Contrast or Reduce Transparency: clear-glass controls become the `mediaSolid` disc (14.83:1).

### 2.5 The iOS 27 glass intensity slider

iOS 27 adds a system slider from more opaque to clear (BRIEF 1, press reports). System components follow it. Our custom glass must look right at both ends:

| End | What happens | What we guarantee |
|---|---|---|
| Most opaque | Glass approaches a frosted solid; tint reads close to solid `accent` | Labels are the same tokens as the solid fallback, which pass (section 3). Prominent glass label `onAccent` on `accent` passes 5.82 / 8.11. Nothing relies on seeing through the glass |
| Clearest | Glass is highly translucent; letter text or a photo shows through | (a) At rest, no custom glass sits over words: Home's capture cluster sits over empty paper, the Find bar and toast sit over the bottom scroll edge (A3: the resting state must stay legible). (b) Under every floating cluster, a scroll edge effect: the system effect where the scroll view supports it, otherwise a 32 pt paper fade (`bg` to transparent) under the cluster, content layer, not glass. (c) Secondary labels on glass use `glassLabelSecondary`, which is the Increase Contrast muted value (8.10 light, 11.79 dark on paper), so a little show-through still leaves margin. (d) Symbols on glass are Medium weight or heavier |

Test matrix for every custom glass element (row DS2-12): both slider ends x light and dark x Increase Contrast on and off x Reduce Transparency on and off, over the screen's real content at rest and mid-scroll.

## 3. Colour

### 3.1 The palette stays

The house paper and ink palette is kept. It passes AA in both schemes, the brand values in `packages/brand/index.ts` do not move (`brand-parity.test.ts`), and its warmth is the product's character. Two light status values are refined because they failed 4.5:1 on `surface` (a real surface: grouped areas, the review tray):

| Token | Was | Now | Was on `surface` | Now on `surface` | Visible change |
|---|---|---|---|---|---|
| `light.success` | #3F7A55 | #3B724F | 4.46 (fails) | 4.96 | Slightly deeper green |
| `light.caution` | #94661A | #895E18 | 4.40 (fails) | 5.00 | Slightly deeper amber |

Both get darker, so their lamp limits in `atmosphere.test.ts` only improve.

### 3.2 Semantic roles

Names are kept; new roles are marked new.

| Role (token) | Meaning | Use | Never |
|---|---|---|---|
| `bg` | Paper | Screen background in the content layer | Under glass as a fake glass |
| `surface` | Grouped paper | Inset areas, review tray | Status text in `recording` or `destructive` (4.68 light, passes, but keep to `bg` or `surfaceRaised` where possible) |
| `surfaceRaised` | Raised paper | Cards, the letter page sheet, the book cover | Floating chrome (use `glassFallback`) |
| `accentSoft` | Selected wash | Selected chips, word highlight in Read together, new-letter wash | The only signal of selection; status text (`recording`, `destructive` fail at 4.35) |
| `text` | Ink | All primary text | |
| `textMuted` | Muted ink | Datelines, metadata, placeholders | Text on glass or on a standard material |
| `accent` | Warm brown | Links, tint, selected tab, primary fill | Body text; meaning "error" |
| `accentDeep` | Brand fill | Single-colour brand fills only | UI chrome, body text |
| `onAccent` | Label on accent | Labels on `accent` fills and prominent glass | |
| `line` | Hairline | Dividers, glass fallback edge | The only boundary of a control |
| `controlBorder` | Control edge | Inputs, outline buttons, switch off-track (3:1) | |
| `focus` | Focus ring | Keyboard, Switch Control, web focus | |
| `recording` | Listening | The live microphone state | Errors, deletion |
| `destructive`, `onDestructive` | Deletion | Delete a letter, remove a member, delete the account (always icon plus words) | Recording state |
| `success` | Kept | Saved, delivered (icon plus words) | Celebration |
| `caution` | Needs attention | Recoverable errors and warnings (icon plus words) | Fear language |
| `editMark` | Machine edit | Dotted underline under machine-edited words | |
| `scrim` | Dim behind sheets | Behind custom sheets and dialogs only; system sheets draw their own | Over glass |
| `glassLabel` (new) | Primary label on glass | Text and symbols on regular glass | |
| `glassLabelSecondary` (new) | Secondary label on glass or a standard material | The quieter line on a glass control (the toast's second line, a hint in the Find bar); secondary text on a standard material | `textMuted` in its place |
| `glassFallback` (new) | Solid chrome | Every glass surface under Reduce Transparency and below iOS 26 | Content cards |
| `glassDim` (new; `material.glass.dim`) | Dim under clear glass | #000000 at 35 percent, local to the controls | Full-screen over a photo |
| `glassBorder` (new) | Edge of `material.solid` | 1 pt; equals `line`, and its HC value under Increase Contrast | A content card edge (that is `line`) |
| `mediaSolid` (new) | Solid control over a picture | Fallback for clear glass; caption plates | |
| `onMedia` (new) | Label over a picture | Symbols on clear glass, text on `mediaSolid` | Text on clear glass |

### 3.3 Vibrant labels on glass

Apple asks for vibrant label colours on materials (A2) and system or custom colours with light, dark and increased-contrast variants in controls and navigation (A3, BRIEF 1). React Native cannot apply UIKit vibrancy to our own text. Our equivalent:
- System bars and buttons (native tabs, header items, system sheet toolbars) use the system's own vibrant labels; we pass only `tintColor = accent`.
- Our custom glass uses `glassLabel` and `glassLabelSecondary`, chosen with the margin computed below, and pinned to the app scheme (2.1). The labels are tested on device across the slider (2.5); the numbers in 3.4 are against the solid fallback and the paper beneath, which is what the glass blurs.

### 3.4 Contrast, computed (WCAG 2.x)

Text needs 4.5:1, large text and non-text 3:1. Bold figures mark a pair that is not allowed by rule even where it passes.

#### Light

| Role | Hex | on bg | on surface | on surfaceRaised | on accentSoft | on glassFallback |
|---|---|---|---|---|---|---|
| `text` | #2B2722 | 14.00 | 12.98 | 14.83 | 12.07 | 14.83 |
| `textMuted` | #6B645B | 5.51 | 5.11 | 5.83 | 4.75 | 5.83 |
| `glassLabel` | #2B2722 | 14.00 | 12.98 | 14.83 | 12.07 | 14.83 |
| `glassLabelSecondary` | #524B43 | 8.10 | 7.51 | 8.58 | 6.99 | 8.58 |
| `accent` | #8A5A3B | 5.50 | 5.10 | 5.82 | 4.74 | 5.82 |
| `focus` | #2F6F8F | 5.23 | 4.85 | 5.54 | 4.51 | 5.54 |
| `recording` | #B5473A | 5.05 | 4.68 | 5.35 | **4.35** | 5.35 |
| `destructive` | #B5473A | 5.05 | 4.68 | 5.35 | **4.35** | 5.35 |
| `success` | #3B724F | 5.35 | 4.96 | 5.67 | 4.61 | 5.67 |
| `caution` | #895E18 | 5.39 | 5.00 | 5.71 | 4.65 | 5.71 |
| `editMark` (3:1) | #8A5A3B | 5.50 | 5.10 | 5.82 | 4.74 | 5.82 |
| `controlBorder` (3:1) | #8A8175 | 3.62 | 3.36 | 3.83 | 3.12 | 3.83 |
| `line` (decorative) | #E6DED3 | 1.26 | 1.17 | 1.33 | 1.08 | 1.33 |

`onAccent` #FFFFFF on `accent` 5.82; `onDestructive` #FFFFFF on `destructive` 5.35; `onMedia` on `mediaSolid` 14.83.

#### Dark

| Role | Hex | on bg | on surface | on surfaceRaised | on accentSoft | on glassFallback |
|---|---|---|---|---|---|---|
| `text` | #F2ECE4 | 15.66 | 14.94 | 14.29 | 11.20 | 13.11 |
| `textMuted` | #B3AA9E | 8.01 | 7.65 | 7.32 | 5.73 | 6.71 |
| `glassLabel` | #F2ECE4 | 15.66 | 14.94 | 14.29 | 11.20 | 13.11 |
| `glassLabelSecondary` | #D6CEC3 | 11.79 | 11.25 | 10.76 | 8.44 | 9.88 |
| `accent` | #D9A47E | 8.37 | 7.98 | 7.64 | 5.99 | 7.01 |
| `focus` | #8CC4DE | 9.68 | 9.24 | 8.84 | 6.93 | 8.11 |
| `recording` | #F08C7C | 7.65 | 7.30 | 6.99 | 5.48 | 6.41 |
| `destructive` | #F08C7C | 7.65 | 7.30 | 6.99 | 5.48 | 6.41 |
| `success` | #8CC9A0 | 9.60 | 9.16 | 8.77 | 6.87 | 8.04 |
| `caution` | #E3B866 | 9.90 | 9.44 | 9.04 | 7.08 | 8.29 |
| `editMark` (3:1) | #D9A47E | 8.37 | 7.98 | 7.64 | 5.99 | 7.01 |
| `controlBorder` (3:1) | #857C70 | 4.47 | 4.27 | 4.08 | 3.20 | 3.75 |
| `line` (decorative) | #33302C | 1.40 | 1.34 | 1.28 | 1.00 | 1.17 |

`onAccent` #1E1612 on `accent` 8.11; `onDestructive` #1E1612 on `destructive` 7.42.

### 3.5 Increase Contrast: a variant for every role

Apple: custom colours need an increased-contrast option for each of light and dark "that provides a significantly higher amount of visual differentiation" (A3). Today only five roles have one. v2 gives every text and status role an Increase Contrast value at 7:1 or more on `bg`, `surface`, `surfaceRaised` and `accentSoft`, and lifts `line` to a visible 3:1 edge. Surfaces, `accentSoft`, `onAccent` and the scrims keep their values; `glassFallback` keeps its value and gains the stronger edge.

Two existing Increase Contrast values move slightly because they fell under 7:1 on `accentSoft` (computed: `textMuted` #524B43 6.99, `accent` #6E4529 6.71): `textMuted` to #4F4942, `accent` to #67432C.

#### Light, Increase Contrast

| Role | Hex | on bg | on surface | on surfaceRaised | on accentSoft | on glassFallback |
|---|---|---|---|---|---|---|
| `text` | #1F1B17 | 16.15 | 14.98 | 17.11 | 13.93 | 17.11 |
| `textMuted` | #4F4942 | 8.38 | 7.78 | 8.88 | 7.23 | 8.88 |
| `glassLabel` | #1F1B17 | 16.15 | 14.98 | 17.11 | 13.93 | 17.11 |
| `glassLabelSecondary` | #3F3A34 | 10.62 | 9.85 | 11.25 | 9.16 | 11.25 |
| `accent`, `editMark` | #67432C | 8.21 | 7.61 | 8.69 | 7.07 | 8.69 |
| `focus` | #225068 | 8.21 | 7.61 | 8.69 | 7.08 | 8.69 |
| `recording`, `destructive` | #813329 | 8.13 | 7.54 | 8.61 | 7.01 | 8.61 |
| `success` | #2B543B | 8.14 | 7.55 | 8.63 | 7.02 | 8.63 |
| `caution` | #654612 | 8.13 | 7.54 | 8.61 | 7.01 | 8.61 |
| `controlBorder` | #2B2722 | 14.00 | 12.98 | 14.83 | 12.07 | 14.83 |
| `line` | #6B645B | 5.51 | 5.11 | 5.83 | 4.75 | 5.83 |

`onAccent` #FFFFFF on `accent` 8.69; `onDestructive` #FFFFFF on `destructive` 8.61.

#### Dark, Increase Contrast

| Role | Hex | on bg | on surface | on surfaceRaised | on accentSoft | on glassFallback |
|---|---|---|---|---|---|---|
| `text` | #FAF6F1 | 17.08 | 16.29 | 15.59 | 12.22 | 14.30 |
| `textMuted` | #D6CEC3 | 11.79 | 11.25 | 10.76 | 8.44 | 9.88 |
| `glassLabel` | #FAF6F1 | 17.08 | 16.29 | 15.59 | 12.22 | 14.30 |
| `glassLabelSecondary` | #E6DFD6 | 13.90 | 13.26 | 12.69 | 9.95 | 11.65 |
| `accent`, `editMark` | #E8BC9A | 10.58 | 10.09 | 9.66 | 7.57 | 8.86 |
| `focus` | #AED6EA | 11.91 | 11.36 | 10.87 | 8.52 | 9.97 |
| `recording`, `destructive` | #F7B0A4 | 10.24 | 9.77 | 9.35 | 7.32 | 8.58 |
| `success` | #A9DDBA | 12.02 | 11.47 | 10.97 | 8.60 | 10.07 |
| `caution` | #EDCB8A | 11.82 | 11.28 | 10.79 | 8.46 | 9.90 |
| `controlBorder` | #F2ECE4 | 15.66 | 14.94 | 14.29 | 11.20 | 13.11 |
| `line` | #B3AA9E | 8.01 | 7.65 | 7.32 | 5.73 | 6.71 |

`onAccent` #1E1612 on `accent` 10.26; `onDestructive` #1E1612 on `destructive` 9.93.

Under Increase Contrast the lamp is off (DESIGN_LANGUAGE 2b, unchanged), glass edges step up to `line` HC (BRIEF 3), and clear-glass controls become `mediaSolid` (2.4).

### 3.6 Colour rules (kept, plus three)

Kept from DESIGN_LANGUAGE 2: colour is never the only signal; `recording` means listening and never error; destructive and caution always carry an icon plus words; dark `onAccent` is dark ink; `line` is never a control's only boundary; never draw a control edge at reduced alpha; icon tile colours are for the icon only.
New:
1. Status text (`recording`, `destructive`, `success`, `caution`) sits on `bg`, `surfaceRaised` or `glassFallback`, never on `accentSoft`.
2. No colour from the palette is ever placed on glass as a fill except `accent` as the prominent tint (one per screen).
3. Photos in dark mode keep the 92 percent brightness rule (DESIGN_LANGUAGE 9); `glassDim` is applied after it.

## 4. Typography

### 4.1 Faces (checked in the files)

| Face (file) | Weight class | Role | Figure features |
|---|---|---|---|
| Mukta Regular / Medium / SemiBold | 400 / 500 / 600 | UI sans, Latin and Devanagari | `tnum`, `onum` (lining by default); no `lnum` |
| Literata Regular (opsz 16) | 400 | Letters, prompts, the name field | `lnum`, `onum`, `pnum`, `tnum`, `smcp`, `c2sc` |
| Literata Medium (opsz 30) | 500 | Display and titles | as Regular |
| Literata Italic (opsz 16) | 400 | Signatures | as Regular |
| Tiro Devanagari Hindi Regular | 400 | Devanagari runs in letters | `lnum`; no `tnum` |

Confirmed: Tiro ships Regular only (the Italic was dropped for size, COMPONENT_LIBRARY 0.1), and Literata's heaviest shipped cut is Medium. Mukta's heaviest shipped cut is SemiBold. EB Garamond stays artwork only (the wordmark).

System chrome keeps the system font: native tab labels, system navigation bar buttons, system menus and alerts (DESIGN_LANGUAGE 7 already allows SF in system chrome). Our own glass (capture cluster, toast, Find bar) uses Mukta like the rest of the UI.

### 4.2 Roles

- Sans (Mukta) is the voice of the app: buttons, labels, metadata, settings, errors.
- Serif (Literata, Tiro for Devanagari) is the voice of the family and the book: letters, signatures, prompts, the child's name, titles. Never on a button or a settings row (DESIGN_LANGUAGE principle 3).

### 4.3 The type scale mapped to Dynamic Type, up to AX5

What changes: today React Native scales every style by one multiplier (1.0 at Large, 3.571 at AX5, `RCTAccessibilityManager.mm`). Apple's own styles grow at different rates (A1): Body x3.12 at AX5, Large Title x1.76, Caption 1 x3.58. v2 scales each token on its Apple style's own curve (ratio of the Apple size at the current setting to the Apple size at Large), then applies the token's cap. This keeps titles from crowding out letters, and makes body text the same relative size Apple's own apps use.

Sizes in pt (size at Large / line), then size at each setting. The last column is today's uniform scaling at AX5, for comparison.

| Token | Large | Apple style | Cap | xL | xxxL | AX1 | AX3 | AX5 | AX5 today |
|---|---|---|---|---|---|---|---|---|---|
| `hero` | 44/50 | Large Title | 1.6 | 47 | 52 | 57 | 67 | 70 | 70 |
| `display` | 34/41 | Large Title | 1.6 | 36 | 40 | 44 | 52 | 54 | 54 |
| `title1` | 28/34 | Title 1 | 1.8 | 30 | 34 | 38 | 48 | 50 | 50 |
| `title2` | 22/28 | Title 2 | 2.0 | 24 | 28 | 34 | 44 | 44 | 44 |
| `headline` | 18/23 | Headline | none | 20 | 24 | 30 | 42 | 56 | 64 |
| `body` | 18/24 | Body | none | 20 | 24 | 30 | 42 | 56 | 64 |
| `callout` | 17/22 | Callout | none | 19 | 23 | 28 | 40 | 54 | 61 |
| `subhead` | 16/21 | Subheadline | none | 18 | 22 | 27 | 38 | 52 | 57 |
| `footnote` | 14/19 | Footnote | none | 16 | 20 | 25 | 36 | 47 | 50 |
| `caption` | 13/17 | Caption 1 | none | 15 | 20 | 24 | 35 | 47 | 46 |
| `label` | 18/22 | Body | none | 20 | 24 | 30 | 42 | 56 | 64 |
| `labelSmall` | 16/20 | Subheadline | none | 18 | 22 | 27 | 38 | 52 | 57 |
| `timer` (new) | 18/23 | Headline | none | 20 | 24 | 30 | 42 | 56 | (new) |
| `letterBody` | 20/32 | Body | none | 22 | 27 | 33 | 47 | 62 | 71 |
| `signature` | 20/32 | Body | none | 22 | 27 | 33 | 47 | 62 | 71 |
| `letterDateline` | 14/18 | Footnote | 2.4 | 16 | 20 | 25 | 34 | 34 | 34 |
| `nameField` | 22/28 | Title 2 | none | 24 | 28 | 34 | 44 | 56 | 79 |
| `prompt` | 24/32 | Title 3 | none | 26 | 31 | 37 | 52 | 66 | 86 |
| `promptHero` | 28/36 | Title 1 | 1.8 | 30 | 34 | 38 | 48 | 50 | 50 |
| `numeral` (retired) | 64/96 | Large Title | 1.4 | 68 | 75 | 83 | 90 | 90 | 90 |

`numeral` is retired with AUDIT 2.3: no screen has used it since PR #674 (the month opener no longer shows a bare numeral, `components/book/month-opener.tsx` header). Its `fontMetrics` entry and `Text trim="figures"` go with it unless a v2 screen asks for a numeral again; the row stays above only as the record of how it would scale.

Apple reference (A1, size at Large and AX5): Large Title 34 to 60, Title 1 28 to 58, Title 2 22 to 56, Title 3 20 to 55, Headline and Body 17 to 53, Callout 16 to 51, Subheadline 15 to 49, Footnote 13 to 44, Caption 1 12 to 43.

Rules:
1. Letter text, body, callout and labels are never capped (D-027, DESIGN_LANGUAGE 3). Only display styles carry caps, and every cap is at least 1.4x.
2. The 13 pt floor at Large stays (`minFontSize`). Apple's minimum is 11 pt (A1).
3. Line height scales with size. Letter styles (`letterBody`, `signature`) keep 1.6 up to xxxL and taper to 1.5 at AX1 and above; 1.5 stays above Literata's own 1.485 em line so nothing clips, and still clears Devanagari matras.
4. Reading Size multiplies `letterBody` and `signature` only (1.0, 1.2, 1.45, unchanged). New cap: the product of Dynamic Type and Reading Size never passes the AX5 letter size, 62 pt. A reader at AX5 does not also need Large Print, and at 90 pt a line holds 7 characters.
5. Tab labels do not scale; the Large Content Viewer shows them (unchanged; native tabs provide it).
6. Every row, button pair and card footer stacks vertically at AX1 and above (`isAccessibilitySize`, unchanged).

### 4.4 Bold Text

iOS Bold Text asks for heavier text. Apple's emphasized weights for its own styles are Semibold for Body, Callout, Subheadline, Footnote and Captions, and Bold for the titles (A1). Bundled faces do not get heavier by themselves (AUDIT 1.6), and the house rule is never to let iOS synthesise a weight, so `Text` swaps the face. Two stages:

| Base face | Stage 1: files we ship today (one step, keeps hierarchy) | Gap in stage 1 | Stage 2: after DS2-05 adds four cuts |
|---|---|---|---|
| Mukta Regular 400 (body, callout, footnote) | Mukta Medium 500 | A small step | Mukta SemiBold 600 (Apple's emphasized weight for these styles) |
| Mukta Medium 500 (labels, caption, dateline) | Mukta SemiBold 600 | none | Mukta Bold 700 (new file, OFL, same family) |
| Mukta SemiBold 600 (headline) | Mukta SemiBold 600, no change | Headline does not get heavier | Mukta Bold 700 |
| Literata Regular 400, opsz 16 (letters, prompts) | Literata Medium 500, opsz 30 | Display optical size on reading text (slightly tighter, finer) | Literata SemiBold 600, opsz 16 (new cut from the variable source in `build_fonts.py`) |
| Literata Medium 500, opsz 30 (titles) | Literata Medium 500, no change | Titles do not get heavier | Literata Bold 700, opsz 30 (new cut) |
| Literata Italic 400 (signature) | Literata Italic 400, no change | Signatures do not get heavier | Literata SemiBold Italic 600, opsz 16 (new cut) |
| Tiro Devanagari Hindi 400 | Tiro Regular, no change | No heavier Tiro exists (Google Fonts has Regular and Italic only) | Q3 |

Stage 1 is the audit's map (AUDIT 7) and ships with DS2-04; stage 2 needs the new files and a size measurement against the 40 MB budget (DS2-05). Symbols step one weight heavier with Bold Text (section 8). Q3: Devanagari letter runs either stay in Tiro Regular under Bold Text (the letter's face does not change mid-paragraph) or switch to a heavier OFL Devanagari serif; that is a design call for the Chief Design Officer role, not a token call.

### 4.5 Numerals

- Durations and the elapsed recording time: `timer` (Mukta Medium, `tabular-nums`) so digits do not jitter as they count. Mukta has `tnum`.
- Datelines with numbers ("Month 4"): proportional, lining (Mukta defaults).
- Large figures in Literata (any future numeral display): `lining-nums proportional-nums`, never negative tracking on figures (the "18" closing up in TestFlight build 1 is the lesson kept from the retired `numeral`).
- Letter text: Literata defaults; never force oldstyle figures on a person's words.
- Devanagari digits stay as typed (Tiro has no `tnum`; it is never used for timers).

### 4.6 Line length

Measured from the files (average advance over a sample English letter): Literata Regular 0.477 em per character, Mukta Regular 0.418 em.

| Case at 375 pt | Measure | Characters per line |
|---|---|---|
| Letter text at Large (20 pt), reading gutter 20 | 335 pt | about 35 |
| Letter text at xxxL (27 pt) | 335 pt | about 26 |
| Letter text, Large Print at Large (29 pt) | 335 pt | about 24 |
| Letter text at AX5 (62 pt), reading gutter 16 (rule below) | 343 pt | about 11 |
| UI body at Large (18 pt), gutter 16 | 343 pt | about 46 |
| UI body at AX5 (56 pt) | 343 pt | about 15 |

On a phone the measure is set by the screen, and 26 to 46 characters is comfortable. The limits that matter are on wide screens and at AX5:
- Reading measure on iPad and web: at most 34 em of `letterBody` (unchanged); UI text at most 40 em.
- At AX3 and above the reading gutter drops from 20 to 16 pt, giving letter text 8 more points.
- At AX5 on 375 pt, a word of 12 or more letters is wider than the line. iOS then breaks inside the word. That is wrapping, not truncation, and is accepted; we never shrink letter text to fit and never ellipsize it.

## 5. Spacing and layout grid

### 5.1 Scale

The 4 pt scale stays: `space.0..12` = 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64. v2 adds named layout tokens so screens stop picking raw steps:

| Token (new) | Value | Use |
|---|---|---|
| `layout.gutter` | 16 below 390 pt width, 20 at 390 and wider | Screen side margin for UI |
| `layout.readingGutter` | 20 below 390 pt, 24 at 390 and wider; 16 at AX3 and above on any phone | Letter page, Read together, Write |
| `layout.cardPadding` | 16 | Inside cards |
| `layout.stackGap` | 12 | Between cards in a list |
| `layout.controlGap` | 12 | Between bezelled controls (H2, DESIGN_LANGUAGE 4) |
| `layout.sectionGap` | 40 | Between sections (48 on the Book between months) |
| `layout.glassClusterGap` | 8 | Between a floating glass cluster and the tab bar or the home indicator safe area |
| `layout.scrollEdgeFade` | 32 | Paper fade under a floating cluster where the system scroll edge effect is not available (2.5) |
| `layout.maxContent` | 600 | Max width of a UI column on iPad and web |
| `layout.maxReading` | 34 em | Max width of letter text |

### 5.2 Grid at 375 pt and wider

One column. 375 pt is the design floor and the AX5 test width (house rule).

| Width (pt) | Devices (UNVERIFIED list) | Gutter | Content column | Two-up grid (chapter covers, photos) |
|---|---|---|---|---|
| 375 | iPhone SE (3rd gen), 13 mini | 16 | 343 | 2 x 165.5 with a 12 gap |
| 390 to 402 | iPhone 13 to 17, 16 Pro and 17 Pro | 20 | 350 to 362 | 2 x 169 to 175 |
| 420 to 440 | iPhone Air, Plus and Pro Max | 20 | 380 to 400 | 2 x 184 to 194 |
| 600 and up | iPad, web | centred `maxContent` | 600 | 3-up allowed |

The two-up grid becomes one-up at AX1 and above, or when a column would be under 160 pt. Safe areas are always respected; the floating capture cluster sits `layout.glassClusterGap` above the tab bar and never under the home indicator.

### 5.3 Targets and control sizes

`target.min` 44, `target.primary` 56, `target.capture` 64, web 48 (unchanged). Apple's minimum is 28 x 28 for iOS with 44 x 44 the default (H2 via BENCHMARK 8); we keep 44 everywhere.

Control heights at Large, named for v2 COMPONENTS (`size.control.*`); every one grows with its label at larger text and never shrinks below its value:

| Token (new) | Height | Same as | Use |
|---|---|---|---|
| `size.control.sm` | 44 | `target.min` | Toolbar buttons, chips, small glass buttons |
| `size.control.md` | 48 | `target.md` (new; was typed in `button.tsx:254`) | Text fields, the Find field, secondary buttons |
| `size.control.lg` | 56 | `target.primary` | Primary buttons, Keep |
| `size.control.xl` | 64 | `target.capture` | Speak and Type, the recording control (Apple's extra-large control size, BRIEF 1) |
| `size.row` | 52 | | List row minimum height (Liquid Glass lists are taller, BRIEF 1); system grouped lists set their own |

## 6. Corner radii: concentric

### 6.1 The rule

A shape inside another shape, near its corner, takes the outer radius minus the inset: `inner = outer - inset`. If that is 4 pt or less, the inner corner is square-ish (`xs`, 4) rather than zero. Away from corners (more than 24 pt from any corner of the container) shapes are free. Apple: corners concentric with their container and the hardware (BRIEF 1).

The steps below are chosen so that the common insets, 8 and 16, land on another step: 32 - 16 = 16, 32 - 8 = 24, 24 - 8 = 16, 16 - 8 = 8, 16 - 12 = 4.

### 6.2 Tokens

| Token | v1 | v2 | Role | Concentric pairs |
|---|---|---|---|---|
| `radius.xs` (new) | none | 4 | Word highlight wash, edit wash, an image inside a card's padding | inner of `md` at 12 inset |
| `radius.sm` | 8 | 8 | Small thumbnails in rows, small badges | inner of `md` at 8 inset |
| `radius.control` (new) | none (inputs used `sm`) | 12 | Text fields, the Write surface outline when shown, the Find field inside the Find bar fallback | free-standing |
| `radius.md` (card) | 14 | 16 | Letter cards, prompt card, inline states, list cards | inner of `lg` at 8, of `xl` at 16 |
| `radius.lg` (feature) | 20 | 24 | Chapter covers, photo frame in the flow, feature cards | inner of `xl` at 8 |
| `radius.xl` (container) | 28 | 32 | Large content containers, the capture surface, custom sheet top corners on web and Android | outer |
| `radius.pill` (capsule) | 9999 | 9999 | Buttons, chips, segmented controls, every glass control, the toast, the Find bar | capsule is concentric with any parent whose radius is half its height plus the inset |
| `radius.cover` (new) | (used `md`, 14) | 14 | The book cover only, so the card change does not round the book | free-standing object |
| `radius.sheet` (new, reference) | (used `xl`) | system | System sheets draw their own, larger, display-concentric radius (BRIEF 1). We never set a sheet radius on iOS | system |
| `radius.listSection` (new) | none | system for system grouped lists; 24 (`lg`) for our own `ListSection` in the content layer | iOS 26 gives list sections a larger radius (BRIEF 1). Measure the system value on device (UNVERIFIED) and set ours to match within 2 pt | inner rows are square; the section clips |
| `radius.cluster` (AUDIT 7) | none | = `pill` | The floating capture cluster. Concentric with the display in effect (6.3), since React Native cannot read the display radius | |

The md, lg and xl changes are visible (2 to 4 pt rounder). They follow Apple's rounder controls and larger section radii (BRIEF 1) and put every radius on the 4 pt scale. They ship as one token PR with before and after screenshots (DS2-03).

### 6.3 Glass shapes near the display corners

React Native cannot read the display's corner radius, so custom glass near a screen corner is a capsule (`pill`): the capture cluster, the toast, the Find bar and the recording control. A capsule inset from the display edge by the same side inset as the system tab bar reads as concentric with both the bar and the hardware. Measure that inset on device (UNVERIFIED value) and record it as `layout.glassSideInset` in DS2-02.

## 7. Elevation and shadows

| Token | v1 | v2 | Use |
|---|---|---|---|
| `elevation.0` | flat | flat | Lists, reading, the letter page |
| `elevation.1` | y2 / 6 / 6% ink | kept | Resting cards in the flow (light); dark uses `surfaceRaised` plus a `line` border |
| `elevation.2` | y6 / 16 / 10% ink | kept, narrowed | The AudioPlayer pill on the letter page (a content-layer control, not in the BRIEF 3 glass list, so it stays solid paper with this shadow; AUDIT 2.3), and a card lifted by long press or drag. No longer the toast or the sheet |
| `elevation.3` | y12 / 32 / 16% ink | retired | Was sheets; sheets are system glass |

Glass has no elevation token: no shadow, no border and no background of our own (A6: elevate controls with Liquid Glass and the scroll edge effect, not with a background). The fallback in 2.3 has the hairline edge and no shadow (BRIEF 3: same shape, solid, hairline). Shadows stay warm ink, never black, and never on a glass surface.

## 8. Iconography: SF Symbols

### 8.1 Decision

The app's glyphs move from Phosphor to SF Symbols on iOS (expo-symbols `SymbolView`; native tabs take symbol names directly). Reasons: native tabs and toolbar items render SF Symbols, so the bar and the screen would otherwise use two icon sets (DESIGN_LANGUAGE 7: "app UI doesn't mix sets"); symbols match the system font's weights and scale with text (A5); they localise (A5 lists Devanagari and Hindi variants); and they adapt to vibrancy, Dark Mode and accessibility settings when given system or token colours (A5). Phosphor stays as the `fallback` on Android and web, glyph for glyph, so the web preview keeps working.

Every symbol below exists in SF Symbols 5.0 or earlier, so all render on iOS 17. SF Symbols may not be used in the app icon or any logo (A5); the quotation-pair mark is ours and stays artwork.

### 8.2 Mapping (every icon the app uses today, plus those the v2 components need)

Today's set is the 37 Phosphor glyphs imported in `apps/mobile/src` (counted 20 Nov).

| Phosphor today | SF Symbol | Fill or state | Where |
|---|---|---|---|
| MoonStars | `moon.stars` | `moon.stars.fill` selected (tab bar prefers fill, A5) | Home tab |
| BookOpen | `book` | `book.fill` selected | Book tab; export, delete account, letter page rows |
| User | `person` | `person.fill` selected | Me tab |
| Microphone | `mic` | `mic.fill` while recording | Speak, Listen, app note, export, letter provenance |
| MicrophoneSlash | `mic.slash` | | Microphone denied |
| PencilSimple | `pencil` | | Type (twin of Speak) |
| PencilSimpleLine | `pencil.line` | | Edit text on the letter page |
| ArrowsClockwise | `arrow.clockwise` | | Another thought, Try again |
| BellSimple | `bell` | `bell.slash` for no reminders | Reminder ask, reminder settings |
| LockSimple | `lock` | | Private, kept on this phone |
| Check | `checkmark` | | Selected choice, Done |
| CheckCircle | `checkmark.circle` | | Saved moment, export finished |
| WarningCircle | `exclamationmark.circle` | | Field errors, recoverable errors (with `caution` and words) |
| X | `xmark` | | Close, dismiss toast |
| Trash | `trash` | | Delete (with `destructive` and words) |
| CaretRight | `chevron.right` | | Row disclosure |
| CaretLeft | `chevron.left` | | Back (system back button preferred) |
| CaretDown | `chevron.down` | | Child switcher, expanders |
| Plus | `plus` | | Add a child, add |
| Play | `play.fill` | | Play |
| Pause | `pause.fill` | | Pause |
| GearSix | `gearshape` | | Settings entry on the Book cover band |
| MagnifyingGlass | `magnifyingglass` | | Language search, Find |
| Fingerprint | `faceid` or `touchid` by device | | Unlock (auth) |
| EnvelopeSimple | `envelope` | | Email sign-in |
| AppleLogo | none | | Use the system Sign in with Apple button, never a symbol |
| Database | `cylinder.split.1x2` | | Export your data |
| CreditCard | `creditcard` | | Plus, billing rows |
| CloudSlash | `cloud` | | Outage screen (not `icloud.*`, which reads as Apple's iCloud) |
| WifiSlash | `wifi.slash` | | Offline |
| CalendarBlank | `calendar` | | Date on the letter page |
| Waveform | `waveform` | | A letter that has a recording |
| UserPlus | `person.badge.plus` | | Invite |
| ShareNetwork | `square.and.arrow.up` | | Share (Apple's share glyph) |
| Moon | `moon` | | Quiet day ("Not much today") |
| BookOpenText | `book.closed` | | Book cover band |
| FileText | `doc.text` | | PDF and data documents |
| (new) | `textformat.size` | | Reading Size ("Aa") |
| (new) | `photo` / `photo.badge.plus` | | Photo, Add a photo |
| (new) | `photo.on.rectangle` | | Photos lens |
| (new) | `ellipsis.circle` | | More menu in toolbars |
| (new) | `gobackward.10` | | Back 10 seconds (Read together) |
| (new) | `backward.end.fill` / `forward.end.fill` | | Previous and next letter (Read together) |
| (new) | `stop.fill` | | Finish recording, where a stop glyph is used |
| (new) | `arrow.uturn.backward` | | Undo on the toast |
| (new) | `person.2` | | Family |
| (new) | `globe` | | Language |
| (new) | `hand.raised` | | Privacy |

### 8.3 Weights, scales, sizes and rendering

| Context | Weight | Scale | Point size | Rendering |
|---|---|---|---|---|
| Inline with text | Matches the text: Regular with Mukta 400, Medium with Mukta 500, Semibold with 600 | medium | The text's size (scales with it) | monochrome, the text's colour |
| List row leading icon | Regular | medium | 20, scales with the row's text, capped at 1.5x | monochrome `textMuted` |
| Toolbar and navigation items | system | system | system | system (vibrant) |
| Tab bar | system | system | system | fill variant when selected (system) |
| Custom glass controls (cluster, toast, Find bar) | Medium | large | 22, capped at 1.5x | monochrome `glassLabel`; `onAccent` on prominent glass |
| Clear glass over a photo | Semibold | large | 22, capped at 1.5x | monochrome `onMedia` |
| Capture twins (Speak, Type) | Medium | large | 28, capped at 1.4x | monochrome `onAccent` |
| Recording control | Semibold | large | 32, capped at 1.4x | monochrome |
| State screens (empty, error) | Light | large | 44, not scaled | hierarchical, `textMuted` |

These sizes become `iconSize` tokens (AUDIT 6.11, 6.12): `inline` 16 (fixed glyphs such as a check in a choice box), `row` 20, `glass` 22, `default` 24, `capture` 28, `record` 32, `state` 44. The capture glyph moves from 32 (DESIGN_LANGUAGE 7) to 28, matching what `button.tsx:136` already draws.

Rules: outline in content and toolbars, fill only for a selected tab and an active play or record state (A5); no multicolour symbols (our palette carries meaning, and colour is never the only signal); no symbol animation except the system's own on system controls, and none under Reduce Motion. Symbols are images to VoiceOver only when they stand alone; next to a word they are hidden from VoiceOver.

## 9. App icon

Apple: layered icons built in Icon Composer, square unmasked 1024 px layers, the system applies masking and Liquid Glass effects; appearances default, dark, clear light, clear dark, tinted light and tinted dark; annotate default, dark and mono in Icon Composer and the system generates what you do not provide; prefer vector layers; avoid soft or feathered edges and thin lines; keep the core features the same in every appearance (A4).

The mark does not change (BRAND_SYSTEM 6, D-071). The layered file replaces the three PNG masters on iOS 26 and later; the PNGs stay for earlier iOS and the store.

| Layer (Icon Composer) | Content | Default | Dark | Mono annotation (clear and tinted) |
|---|---|---|---|---|
| Background | Full-bleed gradient (Icon Composer gradient, not an image) | `icon.tileTop` #9A613C to `icon.tileBottom` #7F4F30, vertical | `icon.darkTileTop` #2C2926 to `icon.darkTileBottom` #1F1B18 | system |
| Foreground 1 | The large opening quotation mark, vector (from `symbol.svg`) | `icon.mark` #FBF8F3, opaque | `icon.darkMark` #D9A47E | white |
| Foreground 2 | The small quotation mark, leaning 14 degrees, at 0.62 of the large one, vector, its own layer | `icon.mark` #FBF8F3 | `icon.darkMark` #D9A47E | white |

Notes:
- Two foreground layers so the system's highlight and depth separate the parent and child marks a little; both stay one colour (BRAND rule). Apple suggests varying opacity for depth (A4); we keep both opaque, because the brand mark is one colour, and let the glass effect provide depth. Try a small layer depth difference in Icon Composer; final sign-off on device (BRAND_SYSTEM 6).
- No text, no border, no baked corners, no feathered edges, no dither (Icon Composer renders the gradient). The current PNG's dithering stays only in the PNG masters.
- Keep the pair inside Apple's icon grid centre zone so masking never touches it (A4: keep primary content centred).
- Clear and tinted appearances: the system derives them from the mono annotation; check that the small mark stays legible at the 40 and 60 px notification sizes, where the hand-tuned PNGs exist today (`app.notification` context).

## 10. Haptics

The vocabulary does not change in Foundations: a haptic marks an outcome, never a navigation; five intents (record start and stop light impact, success on Keep, warning on a confirmed discard, selection for picks and Reading Size, soft for long press); nothing during recording or playback. Owner and full map: `docs/design/system/MOTION.md` (v2), which supersedes `docs/design/MOTION.md` section 6. Glass controls with `isInteractive` get the system's touch response; we add no haptic to it.

Coordinator rulings carried into `tokens.v2.json` (Karma, 20 Nov), detail in v2 `MOTION.md`: waiting states are still, never breathing (the `Breathe` component and `motion.emptyBreathMs` retire); a busy control shows busy words at every Reduce Motion setting and never a spinner; every first-run lamp change uses `motion.lamp.returnMs` (280 ms); a waiting state shows its held line after `loading.heldAfterMs` 10000 ms (area E DESIGN rule 5, NS-10-R0).

## 11. Accessibility settings, one table

| Setting | Materials | Colour | Type | Other |
|---|---|---|---|---|
| Reduce Transparency | Glass and standard materials become their solids (2.3) | unchanged | unchanged | Lamp off |
| Increase Contrast | Glass edges step up; clear glass becomes `mediaSolid` | Every role takes its HC value (3.5) | unchanged | Lamp off |
| Reduce Motion | Glass style changes are instant or a 200 ms fade (MOTION) | unchanged | Reading Size cross-fade stays | Lamp still |
| Bold Text | unchanged | unchanged | Face map 4.4 | Symbols one weight heavier |
| Larger Text to AX5 | Clusters grow in height, never in count; labels may move under symbols | unchanged | Scale 4.3 | Rows stack at AX1 and above |
| Dark | Glass follows the pinned scheme | Dark palette | unchanged | Photo brightness 92 percent |
| iOS 27 glass slider | Both ends designed (2.5) | unchanged | unchanged | |

## 12. Reconciliation with AUDIT.md

`AUDIT.md` (draft of 20 Nov) and the v2 `COMPONENTS.md` draft were read at the end of this pass. What changed here because of them, and what still differs:

| Item | AUDIT or COMPONENTS says | This file now | Status |
|---|---|---|---|
| Token names for glass | COMPONENTS 9 asks for `material.glass.regular`, `.clear`, `.dim`, `.tint.accent`, `.mergeDistance`, `material.solid`, `material.content.*` | Adopted as named; colour tokens behind them are `glassDim`, `glassFallback`, `glassBorder` | Agreed |
| `material.solid` fill in dark | COMPONENTS 1.5: `surfaceRaised` plus 1 pt `line` | Light: `surfaceRaised` (same). Dark: `glassFallback` #282421, one step above `surfaceRaised`, so floating chrome reads above raised cards. Edge 1 pt (was 0.5 pt in my draft; changed to match) | Differs in dark only: Karma to confirm; the token absorbs either choice |
| Increase Contrast edge of `material.solid` | COMPONENTS 1.5: steps to `controlBorder` HC | `glassBorder` steps to `line` HC (5.51 light, 8.01 dark) | Differs: both pass 3:1; BRIEF 3 says "their high-contrast tokens", which reads as the border's own (`line`). Karma to pick one |
| HC for status colours and glass labels | AUDIT 2.3, 7: missing | Full HC set (3.5) | Closed |
| `scrim` | AUDIT 2.3: keep for content-layer modals | Same | Agreed |
| Bold Text map | AUDIT 7: Regular to Medium, Medium to SemiBold | Adopted as stage 1; stage 2 with new cuts (4.4) | Agreed, extended |
| `type.numeral` | AUDIT 2.3: retire, unused since PR #674 | Retired | Agreed |
| `elevation.2` | AUDIT 2.3: stays for the AudioPlayer pill | Same; my draft had moved the player to glass, which BRIEF 3 does not list | Agreed |
| `elevation.3` | AUDIT 7: retire for sheets | Retired | Agreed |
| `radius.xl` and a cluster radius | AUDIT 2.3, 7 | `xl` is containers only; `radius.cluster` = capsule (6.2, 6.3) | Agreed |
| `target.md` 48, extra-large control, `iconSize` | AUDIT 2.3, 6.11, 7; COMPONENTS `size.control.*` (44, 48, 56, 64), `size.row` 52 | Adopted (5.3, 8.3) | Agreed |
| `radius.listSection` | COMPONENTS 9 | Added (6.2) | Agreed, value to measure |
| SF Symbols scope | COMPONENTS 10: SF Symbols in system chrome, Phosphor stays in content | SF Symbols everywhere on iOS; Phosphor only as the Android and web fallback (8.1) | Differs. Reason: DESIGN_LANGUAGE 7 "app UI doesn't mix sets"; with native tabs and glass toolbars in SF, Phosphor in content would put two drawing styles on one screen (the toolbar Close next to a row chevron). Karma to decide |
| Motion tokens (`motion.glass.*`, toast, undo window, `reduceMotion` retirement) | AUDIT 7 | Not in Foundations; owned by v2 `MOTION.md` | Out of scope here |
| Atmosphere under glass (AUDIT 4.21) | No conflict; the cluster must not sit on the QuotePair | 2.5 (a) keeps custom glass off words and the mark at rest | Agreed |

## 13. Open questions (for Karma with the Chief Design Officer role)

- Q1. Clear glass at 35 percent dim fails 3:1 for white symbols over a near-white region of a photo (2.43:1 on pure white). Policy keeps 35 percent. Measure on device over the Asha photo set; if a control lands on a bright region, either the control moves, or the dim for that control steps to 45 percent (3.36:1 on pure white). Decision needed after measurement.
- Q2. The radius change (md 16, lg 24, xl 32) is visible on every card. Approve with the before and after set from DS2-03, or keep v1 values and accept off-grid 14 and 20.
- Q3. Bold Text for Devanagari letter runs (4.4).
- Q4. Home tab symbol: `moon.stars` keeps today's meaning (the evening letter); `house` is the conventional Home glyph. Keep `moon.stars` unless testing shows people do not find Home.
- Q5. `material.solid` in dark (`glassFallback` #282421 or `surfaceRaised`) and its Increase Contrast edge (`line` HC or `controlBorder` HC), section 12.
- Q6. SF Symbols in content as well as chrome (this file) or chrome only (v2 COMPONENTS), section 12.

## 14. Engineering rows needed

Proposed backlog rows. Owner lanes: DS = `design-systems`, MOB = `mobile`. Sizes S, M, L. Each row ships with its tests; no row changes a word of copy.

| Row | Lane | Size | What | Done when |
|---|---|---|---|---|
| DS2-01 | DS | S | Colour v2 in `tokens.ts`: refine `light.success` and `light.caution`; add `glassLabel`, `glassLabelSecondary`, `glassFallback`, `glassBorder`, `glassDim`, `mediaSolid`, `onMedia`; full `highContrast` for every text and status role (3.5) | `tokens.test.ts` asserts every pair in 3.4 and 3.5 (4.5:1 text, 7:1 HC text on bg, surface, surfaceRaised, accentSoft; 3:1 non-text); `brand-parity` and `atmosphere` tests pass; CSS regenerated |
| DS2-02 | DS | S | Layout, size and material tokens: `layout.*` (5.1), `size.control.*`, `size.row`, `target.md` (5.3), `iconSize.*` (8.3), `material.*` (2.1, 2.2); measure and add `layout.glassSideInset` and the system list section radius on device | Tokens exported in TS and CSS; inset value recorded with the device and iOS version |
| DS2-03 | DS | S | Radius v2: `xs`, `control`, `cover`, new `md`, `lg`, `xl` | Before and after screenshots of Home, Book, letter page, first run, light and dark, attached to the PR for Q2 |
| DS2-04 | DS | M | `Text` scales each token on its Apple style curve (4.3) from the content size category, applies caps, tapers letter line height, caps Reading Size times Dynamic Type at 62 pt | Unit test: every token at L, xxxL, AX1, AX3, AX5 equals the table in 4.3; no `maxFontSizeMultiplier` below 1.4 anywhere in `src` (source scan) |
| DS2-05 | DS | M | Fonts: cut Literata SemiBold (opsz 16), Bold (opsz 30), SemiBold Italic (opsz 16), add Mukta Bold; Bold Text face map in `Text` | `fonts.test.ts` checks the new faces' weight class; app size measured and recorded; Bold Text on shows the heavier face on Home, letter page, Settings |
| DS2-06 | DS | S | `timer` type token (Mukta Medium, tabular) | Elapsed time and durations use it; digits do not shift width in a test render |
| DS2-07 | DS | M | `GlassSurface` wrapper: `GlassView` or `GlassContainer` when available and Reduce Transparency is off, else the 2.3 solid; pinned `colorScheme`; prominent and clear variants with `glassDim`; Increase Contrast edge | Component test for each of the four cases; never sets opacity 0 on a glass view (source scan) |
| DS2-08 | DS | S | `useContrastPreference()` reads iOS Increase Contrast (a small Expo module if RN has no query, TDD 09 3.x) and feeds `useTheme()` | Toggling the setting on device swaps every role live |
| DS2-09 | DS | M | `Icon` wrapper over `SymbolView` with the Phosphor fallback; the mapping in 8.2 as one table; weights and sizes from 8.3 | Every Phosphor import in `src` replaced by `Icon`; a test fails on a direct `phosphor-react-native` import outside the wrapper |
| DS2-10 | MOB | M | Native tabs (`unstable-native-tabs`) with `moon.stars`, `book`, `person` and fills; remove the paper bar | Device spike recorded (COMPONENT_LIBRARY 0.1); tab bar is system glass on iOS 26, system bar on iOS 17 to 25; Large Content Viewer works |
| DS2-11 | MOB | L | Move the BRIEF 3 glass surfaces onto `GlassSurface` (capture cluster, Find bar, Book header controls, undo toast, recording control, photo controls) and system sheets | Each screen shows at most three glass surfaces (checked in the e2e journey); scroll edge fade present under every floating cluster |
| DS2-12 | MOB | M | Device test matrix for glass (2.5): slider ends x schemes x Increase Contrast x Reduce Transparency, plus clear glass over the Asha photos (Q1) | Screenshots for every cell in the release record; Accessibility Inspector contrast on each custom glass label |
| DS2-13 | DS | M | Icon Composer `.icon` file (section 9), registered in the brand registry and `app.config.ts` | Default, dark, clear and tinted checked on device at Home Screen and notification sizes; brand sign-off |
| DS2-14 | DS | S | Retire `elevation.3`, narrow `elevation.2`; remove shadows from anything that becomes glass | Source scan: no shadow style on a `GlassSurface` |
| DS2-15 | DS | S | Update `DESIGN_LANGUAGE.md` sections 2 to 7 to point here; keep its principles and screens | No conflicting values between the two files (a doc test comparing hex values, or a manual check in the PR) |

## 15. Retired

| What | Where | Replaced by |
|---|---|---|
| Phosphor as the iOS icon set | DESIGN_LANGUAGE 7 | SF Symbols (section 8); Phosphor stays only as the Android and web fallback |
| "Paper bar with a hairline (not Liquid Glass yet)" for the tab bar | BENCHMARK 9, COMPONENT_LIBRARY 0.1 | Native tabs, system glass (DS2-10) |
| `elevation.2` on the toast and `elevation.3` on the sheet | `ui/toast.tsx:114`, `ui/sheet.tsx:185` | Glass capsule toast and the system sheet, no shadow (AudioPlayer keeps `elevation.2`) |
| The `Breathe` component and `motion.emptyBreathMs` (empty and waiting states breathing) | `components/motion/breathe.tsx`, `tokens.motion` | Still waiting states (ruling, Karma 20 Nov) |
| `type.numeral` and the `serifMedium` `fontMetrics` entry | `tokens.type`, `tokens.fontMetrics` | Nothing (unused since PR #674; AUDIT 2.3) |
| `elevation.3` (sheets) | `tokens.elevation[3]`, DESIGN_LANGUAGE 6 | System sheets |
| `radius.xl` as the sheet radius on iOS | DESIGN_LANGUAGE 5 | System sheet radius; `xl` is containers and web or Android sheets |
| Uniform Dynamic Type scaling (one multiplier for every style) | `Text`, `lineHeightFor`, `renderedScale` | Per-style Apple curve (4.3) |
| Partial Increase Contrast set (five roles) | `tokens.highContrast` | Full set (3.5) |
| `light.success` #3F7A55, `light.caution` #94661A | `tokens.light` | #3B724F, #895E18 |
| HC `textMuted` #524B43 and `accent` #6E4529 | `tokens.highContrast.light` | #4F4942, #67432C |
| `BlurSurface` with arbitrary blur for chrome (Book's inline title bar) | COMPONENT_LIBRARY 0.1 | System navigation bar glass (BlurSurface stays only as the iOS 18 fallback for that bar until it moves to the native header, per v2 COMPONENTS); `material.content.thin` only for a sticky header in the content layer |
| "No Liquid Glass in the content layer; system tab bar and toolbars may use it" as the whole glass rule | DESIGN_LANGUAGE 2 | The material policy (BRIEF 3) and section 2 here |
