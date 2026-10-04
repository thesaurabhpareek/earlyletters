# Early Letters: Design Language

v0.2, 2026-10-03 (v0.1 2026-10-01; v0.2 adds section 2a Brand mark, `accentDeep`, the icon tile colours and `destructive`). Tokens: `@scribe/design-tokens`; brand values: `packages/brand/index.ts`; brand assets: `docs/brand/BRAND_SYSTEM.md` and `packages/brand/registry.ts`. Sources S1 to S10, H1 to H6 are listed in `BENCHMARK.md`. **(opinion)** marks judgement.

## 1. Principles

| # | Principle | Do | Don't |
|---|---|---|---|
| 1 | **The voice is the treasure.** The recording is the artefact; text is its caption. | Show a play affordance on every letter; keep the original audio untouched. | Add music, effects or "enhanced" audio to a recording. |
| 2 | **Written for 2 a.m.** One hand, one thumb, low light. | Primary actions in the bottom third, at least 56pt tall; dark mode tuned first. | Put the only save action top-right; use pure white surfaces at night. |
| 3 | **Quiet UI, loud letters.** UI is sans and neutral; the child's book is serif and generous (S1, S4). | Medium-weight UI headings; serif only for letters, chapter titles, display. | Use serif for buttons or settings; use heavy weights for emphasis. |
| 4 | **Joy without scorekeeping.** Warmth comes from the content, not rewards. | "12 letters for Mira in Month 4" as a fact in a dateline. | Streaks, badges, confetti, progress rings, "you missed a day". |
| 5 | **Equal doors.** Speaking and typing are equally valid. | Speak and Type as identical twin buttons. | Make voice the hero and type a text link (or vice versa). |
| 6 | **Big enough for Nani.** Grandparents are first-class readers and writers. | Respect Dynamic Type to AX5; offer Large Print reading. | Truncate letter text; hide controls behind gestures only (H2). |
| 7 | **Honest about privacy.** Say plainly who can hear a letter. | An audience line ("Only family you invite") on capture and share. | Ambient location or data suggestions (see Journal, S5). |

## 2. Color

Brand colours unchanged (no WCAG failure found). Added `surface`, dark `accentSoft`, `onAccent`, `focus`, `recording`, `success`, `caution`; on 2026-10-03 `accentDeep` (approved with the primary mark) and `destructive` (D-029). Every brand value in `packages/brand/index.ts` (`brand.colors`, `brand.icon`) equals its token; `packages/design-tokens/test/brand-parity.test.ts` fails on drift. Ratios computed by script with the WCAG 2.x luminance formula. AA: 4.5:1 text, 3:1 large text/UI.

### Light

| Token | Hex | Key pair | Ratio |
|---|---|---|---|
| `bg` | #FBF8F3 | (paper) | |
| `surface` | #F5EFE7 | `text` on it | 12.98 |
| `surfaceRaised` | #FFFFFF | `text` on it | 14.83 |
| `text` | #2B2722 | on `bg` | 14.00 |
| `textMuted` | #6B645B | on `bg` / `surface` / `surfaceRaised` | 5.51 / 5.11 / 5.83 |
| `accent` | #8A5A3B | on `bg` / `surfaceRaised` / `accentSoft` | 5.50 / 5.82 / 4.74 |
| `accentDeep` | #7F4F30 | on `bg` / `surfaceRaised` / `accentSoft` | 6.47 / 6.85 / 5.58 |
| `accentSoft` | #F1E6DC | `text` on it | 12.07 |
| `onAccent` | #FFFFFF | on `accent` | 5.82 |
| `line` | #E6DED3 | on `bg` | 1.26 (decorative only) |
| `focus` | #2F6F8F | on `bg` / `surfaceRaised` | 5.23 / 5.54 |
| `recording` | #B5473A | on `bg` / `surfaceRaised` | 5.05 / 5.35 |
| `destructive` | #B5473A | on `bg` / `surfaceRaised` | 5.05 / 5.35 |
| `success` | #3F7A55 | on `bg` / `surfaceRaised` | 4.80 / 5.09 |
| `caution` | #94661A | on `bg` / `surfaceRaised` | 4.75 / 5.03 |
| `controlBorder` | #8A8175 | on `bg` / `surface` / `surfaceRaised` / `accentSoft` | 3.62 / 3.36 / 3.83 / 3.12 (non-text, 3:1) |
| `editMark` | #8A5A3B | on `surfaceRaised` | 5.82 |
| `destructive` | #B5473A | on `bg` (equals `recording` today; its own role, TDD 09 Q1) | 5.05 |
| `onDestructive` | #FFFFFF | on `destructive` | 5.35 |
| `scrim` | #2B2722 at 32% | behind sheets | (decorative) |

### Dark

| Token | Hex | Key pair | Ratio |
|---|---|---|---|
| `bg` | #161412 | | |
| `surface` | #1B1917 | `text` on it | 14.94 |
| `surfaceRaised` | #201D1A | `text` on it | 14.29 |
| `text` | #F2ECE4 | on `bg` | 15.66 |
| `textMuted` | #B3AA9E | on `bg` / `surfaceRaised` | 8.01 / 7.32 |
| `accent` | #D9A47E | on `bg` / `surfaceRaised` / `accentSoft` | 8.37 / 7.64 / 5.99 |
| `accentDeep` | #D9A47E | on `bg` / `surfaceRaised` | 8.37 / 7.64 (same as dark `accent`: on dark, single-colour brand fills use accentDark) |
| `accentSoft` | #3A2E25 | `text` on it | 11.20 |
| `onAccent` | #1E1612 | on `accent` | 8.11 |
| `line` | #33302C | on `bg` | 1.40 (decorative only) |
| `focus` | #8CC4DE | on `bg` / `surfaceRaised` | 9.68 / 8.84 |
| `recording` | #F08C7C | on `bg` / `surfaceRaised` | 7.65 / 6.99 |
| `destructive` | #F08C7C | on `bg` / `surfaceRaised` | 7.65 / 6.99 |
| `success` | #8CC9A0 | on `bg` / `surfaceRaised` | 9.60 / 8.77 |
| `caution` | #E3B866 | on `bg` / `surfaceRaised` | 9.90 / 9.04 |
| `controlBorder` | #857C70 | on `bg` / `surface` / `surfaceRaised` / `accentSoft` | 4.47 / 4.27 / 4.08 / 3.20 |
| `editMark` | #D9A47E | on `surfaceRaised` | 7.64 |
| `destructive` | #F08C7C | on `bg` | 7.65 |
| `onDestructive` | #1E1612 | on `destructive` | 7.42 |
| `scrim` | #000000 at 55% | behind sheets | (decorative) |

### Increase Contrast (`tokens.highContrast`, applied app-wide by `UIProvider`)

| Token | Light | Dark | Check (test) |
|---|---|---|---|
| `textMuted` | #524B43 | #D6CEC3 | 7:1 or more on every surface |
| `accent` | #6E4529 | #E8BC9A | 7:1 or more on every surface |
| `line` | #6B645B | #B3AA9E | 3:1 or more (hairlines become visible edges) |
| `controlBorder` | #2B2722 | #F2ECE4 | 4.5:1 or more |

**Rules**
- `line` fails 3:1 by design: never the only boundary of an interactive control. Control edges use `controlBorder` (the shadcn `input` colour maps to it, so every `border-input` passes 1.4.11). Never draw a control edge at reduced alpha: `textMuted` at 60% is 2.54:1 (the test keeps that failure documented).
- Dark `onAccent` is dark ink, not white: white on #D9A47E would be ~2.1:1 (fails).
- `recording` is a terracotta, not alarm red; it means "listening". `destructive` (D-029) is a separate token with the same value today, used only for destructive actions (delete a letter, remove a family member, delete the account); it can change without touching the recording state. Destructive actions always carry an icon plus words, never colour alone. Warnings and recoverable errors use `caution` plus an icon plus words. In CSS, shadcn's `--color-destructive` maps to `destructive`.
- `accentDeep` is for single-colour brand fills (favicon on light, foil, the icon tile base), never body text or UI chrome.
- Icon tile colours (`tokens.icon`: `tileTop` #9A613C, `tileBottom` #7F4F30, `mark` #FBF8F3, `darkTileTop` #2C2926, `darkTileBottom` #1F1B18, `darkMark` #D9A47E) are for the app icon only, never UI.
- Colour is never the only signal (H2).
- Increase Contrast: the table above (darker muted text and accent, visible hairlines, ink control edges).
- No Liquid Glass in the content layer (H5); system tab bar and toolbars may use it.

## 2a. Brand mark

Full rules: [docs/brand/BRAND_SYSTEM.md](../brand/BRAND_SYSTEM.md). Assets: `packages/brand/assets/logo/primary/`, resolved only through the registry (`packages/brand/registry.ts`, `assetFor(context)`). This section is the summary designers need in the app; if the two disagree, BRAND_SYSTEM.md wins.

- **The mark** is two opening quotation marks, one large and one small (0.62 of its size, leaning 14 degrees toward it), approved 2026-10-03 as r3 `final-a` (D-071). It replaces every earlier device: the envelope line, the Literata "e" (direction a), the script mark (direction b), round 2 concepts, the interim Literata email lockup and the serif "E" monogram. Opening quotes only; never closing quotes, a speech bubble, or the mark rotated.
- **Resolve, never pick a file.** Code asks for a context (`app.splash`, `app.header`, `app.paywall`, `app.settings.about`, `web.header`, `email.header.light` and the rest); a new touchpoint adds a context to the registry. Never import a path under `logo/r3`, `logo/a`, `logo/b` or `logo/r2` (D-072).
- **Clear space:** one cap height of the wordmark's E (x) on every side of a lockup; half the symbol's height around the symbol alone. The SVGs' built-in margin (0.25x horizontal, 0.3x stacked) is the floor for tight places such as the email header, never the target.
- **Minimum sizes** (height of the SVG as shipped): horizontal lockup 27 px, below that the small cut (17 to 26 px); stacked lockup 66 px; symbol 24 px, below that the small-cut symbol (12 to 23 px); 16 px favicon is the floor. Each registry asset carries its `minSize` and the id to use below it.
- **The wordmark is artwork.** It is outlined EB Garamond with its `tt` ligature and an opened word space. Never retype the name in a font to stand in for the logo, not even as a fallback; where an image cannot load, the alt text or accessibility label is the brand name.
- **EB Garamond is for the wordmark only** (and brand display set as artwork: book covers, gift cards, OG image). Never UI, buttons, letters or body text; the app's type stays Mukta, Literata and Tiro (section 3).
- **Colour:** the logo is one colour, `ink` on light and `inkDark` on dark. `logo.symbol.accent` is the one warm brand moment allowed on paper. Never two-colour lockups, an accent wordmark, accentDark on paper, or a gradient anywhere except the app icon tile.
- **Icon colours:** default tile gradient `tileTop` #9A613C to `tileBottom` #7F4F30 (`accentDeep`) with a `mark` #FBF8F3 (paper, never pure white); dark tile #2C2926 to #1F1B18 with an #D9A47E mark; tinted is the mark shape only. Values in `brand.icon` and `tokens.icon`; icon only, never UI.
- **One logo per screen.** In the app: splash (symbol alone), welcome or empty book header (small-cut lockup, 20 to 26 pt), paywall (stacked lockup, once), Settings > About. Navigation bars keep the system title.
- **Illustration is not the mark.** Line drawings (section 9, CREATIVE.md 3) may show envelopes, lamps, moons and pages; none of them stands in for the logo or sits locked up with the wordmark.

## 3. Typography

### Fonts (all SIL OFL 1.1, verified on Google Fonts metadata and each repo's OFL.txt)

| Role | Family | Scripts (Google Fonts subsets) | Notes |
|---|---|---|---|
| UI sans | **Mukta** (Ek Type) | devanagari, latin, latin-ext | One family, matched Latin + Devanagari, weights 200 to 800. No italic (UI doesn't need it). [fonts.google.com/specimen/Mukta](https://fonts.google.com/specimen/Mukta) |
| Reading serif (Latin) | **Literata** (TypeTogether) | latin, latin-ext, greek, cyrillic, vietnamese | Variable `opsz` + `wght`, true italics; designed for long-form reading. **No Devanagari.** [fonts.google.com/specimen/Literata](https://fonts.google.com/specimen/Literata) |
| Reading serif (Devanagari) | **Tiro Devanagari Hindi** (Tiro Typeworks) | devanagari, latin, latin-ext | Regular + Italic; a literary Devanagari with Hindi-specific forms. [fonts.google.com/specimen/Tiro+Devanagari+Hindi](https://fonts.google.com/specimen/Tiro+Devanagari+Hindi) |

Fallbacks: Noto Sans Devanagari / Noto Serif Devanagari (OFL), then system.

**Devanagari plan**
- Split runs by script at render (U+0900 to 097F, U+A8E0 to A8FF): Latin in Literata, Devanagari in Tiro, same paragraph. Web: `unicode-range` @font-face; React Native: nested `<Text>` per run.
- Tiro runs at 1.08x Literata size so Devanagari sits level with Latin x-height **(opinion; tune on device)**.
- `letterBody` line height 1.6 clears matras without clipping.
- UI needs no splitting: Mukta covers both scripts. Romanised Hindi is just Latin.

### Type scale (default "Large" Dynamic Type)

Apple's default Body is 17/22 (H1). Mukta sits small on its em, so UI styles are +1pt **(opinion; check on device)**.

| Token | Family / weight | Size / line (pt) | Maps to iOS style | Max scale |
|---|---|---|---|---|
| `display` | Literata 500 | 34 / 41 | Large Title | 1.6x |
| `title1` | Literata 500 | 28 / 34 | Title 1 | 1.8x |
| `title2` | Literata 500 | 22 / 28 | Title 2 | 2.0x |
| `headline` | Mukta 600 | 18 / 23 | Headline | none |
| `body` | Mukta 400 | 18 / 24 | Body | none |
| `callout` | Mukta 400 | 17 / 22 | Callout | none |
| `subhead` | Mukta 400 | 16 / 21 | Subhead | none |
| `footnote` | Mukta 400 | 14 / 19 | Footnote | none |
| `caption` | Mukta 500, +0.2 tracking | 13 / 17 | Caption 1 | none |
| `letterBody` | Literata 400 (+ Tiro) | 20 / 32 | Body | none |
| `letterDateline` | Mukta 500, +0.6 tracking | 14 / 18 | Footnote | 2.4x |
| `hero` | Literata 500 (opsz 30 cut), -0.4 | 44 / 50 | Large Title | 1.6x (first-run title only) |
| `label` | Mukta 500 | 18 / 22 | Body | none (button and row labels) |
| `labelSmall` | Mukta 500 | 16 / 20 | Subhead | none (small buttons, chips, field labels) |
| `signature` | Literata Italic 400 | 20 / 32 | Body | none (scales with Reading Size) |
| `prompt` | Literata 400 | 24 / 32 | Title 3 | none (Tonight's prompt) |

**Faces are bundled (Oct 3 2026):** `packages/design-tokens/fonts`, subset with `build_fonts.py`: Mukta Regular / Medium / SemiBold (Latin, Latin Extended, Devanagari), Literata Regular (opsz 16) / Medium (opsz 30) / Italic (opsz 16) cut from the variable font, Tiro Devanagari Hindi Regular. 1.37 MB raw, 0.64 MB compressed. One family name per face; the `Text` component applies the face and never asks a custom font to synthesise weight or italics.

Nothing is smaller than 13pt (HIG minimum is 11pt, H2; we hold a higher floor for grandparents).

**Scaling for grandparents**
1. All styles scale with Dynamic Type; display styles are capped, body and letter text never are (H2: enlarge "at least 200 percent"). Apple's AX5 Body is 53/62 (H1).
2. Reading Size ("Aa") multiplies `letterBody` only: 1.0 / 1.2 / **Large Print 1.45** (`tokens.readingScale`), like Apple Books' in-reader controls (S9).
3. Invitees are offered Large Print at first launch; per reader, per device.
4. At accessibility sizes rows stack vertically; letter text never truncates (H1).
5. Web/iPad measure max 34em.

## 4. Spacing

4pt scale, `space.0..12` = 0, 4, 8, 12, 16, 20, 24, 28, 32, 40, 48, 56, 64.
Gutter `space.4` (reading `space.5`); card padding `space.4`; between cards `space.3`; between sections `space.9` to `10`. Targets 44x44pt min (H2), primary 56pt; at least 12pt between bezelled controls (H2).

## 5. Radii

`radius.sm` 8 (inputs, thumbnails), `md` 14 (letter cards; matches Airbnb's ~14, S4), `lg` 20 (chapter covers, feature cards), `xl` 28 (sheet top corners, capture surface), `pill` (buttons, chips, segmented controls). Photos inside a card inherit the card's radius minus its padding (concentric corners).

## 6. Elevation

Warm ink-tinted shadows. `0` flat (lists, reading); `1` resting cards (y2/6/6%); `2` lifted card, floating player (y6/16/10%); `3` sheets (y12/32/16%). Dark mode: levels 1 to 3 use `surfaceRaised` + 1px `line` border.

## 7. Iconography

**Phosphor Icons**, MIT: `phosphor-react-native` 3.0.6 (MIT) and `@phosphor-icons/react` 2.1.10 (MIT), verified on the npm registry and the [Phosphor](https://github.com/phosphor-icons/homepage/blob/master/LICENSE) and [phosphor-react-native](https://github.com/duongdev/phosphor-react-native/blob/main/LICENSE) LICENSE files. Same glyph set on iOS and web.
- Weight **Regular** for UI, **Light** at 32pt+, **Fill** only for selected tab and active play state.
- Sizes 20 (inline), 24 (default), 28 (tab bar), 32 (Speak/Type).
- System chrome may use SF Symbols (H4); app UI doesn't mix sets. Key glyphs: Microphone, PencilSimple, Moon, BookOpen, UsersThree, Play.

## 8. Motion

| Token | Stiffness / damping / mass | approx. response / damping fraction | Use |
|---|---|---|---|
| `motion.snappy` | 520 / 46 / 1 | 0.28s / 1.0 | Press, toggles, chips, word-highlight advance |
| `motion.standard` | 260 / 30 / 1 | 0.40s / 0.92 | Sheets, navigation, card-to-letter |
| `motion.gentle` | 90 / 18 / 1 | 0.66s / 0.95 | Breathing glow, chapter reveal, save settle |

- **Breathing glow**: radial `recording` gradient (18 to 40% opacity) behind a 120pt mic disc; scale 1.0 to 1.18 and opacity follow smoothed RMS (attack 80ms, release 400ms) via `motion.gentle`. Silence = slow 4s idle breath, so a pause never looks broken. No waveform.
- **Word highlight**: `accentSoft` wash (radius 4) slides word to word via `motion.snappy`. No bolding (reflows).
- **Reduce Motion** (H2): 200ms cross-fades; glow becomes a static ring stepping in opacity; highlight jumps.

## 9. Imagery

- **No stock baby photos, anywhere.** Typography, paper tone and the family's own photos only.
- Sparse single-weight line drawings in `textMuted` (envelope, moon, lamp, page). No faces, no mascot. Drawings are illustration only; the brand mark is the quotation pair (section 2a) and a drawing never replaces it.
- User photos: 4:5 crop, full-bleed in a `radius.md`/`lg` card, text below, never overlaid; no app filters; 92% brightness in dark mode.
- Chapter cover: chosen photo, or paper tone with the month numeral in `display`.

## 10. Sound and haptics

- No UI sounds by default; the only default audio is recordings. An opt-in "Paper sounds" setting adds six quiet sounds (see SOUND.md). Never autoplay (H2).
- Haptics, consistent and complementary (H6): light impact on record start/stop, success on save, selection on Reading Size. None during playback.

## 11. Accessibility rules

1. AA in both modes; targets 44pt (H2); Dynamic Type to AX5.
2. VoiceOver: "Letter from Papa, Month 4, Tuesday night, 1 minute 20 recording"; recording state announced.
3. Every gesture has a button alternative (H2).
4. Support Reduce Motion, Reduce Transparency (solid surfaces), Increase Contrast.
5. No time-boxed UI (H2): toasts persist until dismissed.

## 12. Screens

Navigation: three tabs, **Tonight · Book · Family**, single-word labels, always visible (H4). Capture is not a tab (H4: tabs navigate, not act); it lives on Tonight.

### Onboarding
- **Purpose**: name the child, set birth date (powers month-of-age chapters), choose who can hear letters, write the first letter.
- **Layout**: small-cut lockup (registry context `app.header`, section 2a) above an optional line drawing (illustration, never the mark); `display` "Letters for someone small"; then one step per screen: child's name, birth date (wheel), privacy line ("Only people you invite can read or hear these"); ends in Tonight with the first prompt.
- **Primary action**: pill button "Continue", full width, bottom, 56pt.
- **Empty state**: n/a. Account creation after the first saved letter **(opinion)**.

### Tonight (capture home)
- **Purpose**: write tonight's letter in under 10 seconds.
- **Layout**: `letterDateline` "Month 4 · Week 2 · Tuesday"; `title1` serif greeting "Good evening"; prompt card (`surfaceRaised`, `radius.lg`, `callout`), swipe or "Another prompt"; spacer; **Speak and Type** twin pill buttons, side by side, identical width, 64pt height, same `accent` fill, same weight, icon above label; below them a "One month ago" resurfaced letter card when available.
- **Primary action**: Speak or Type (equal).
- **Empty state**: no history yet; the prompt card reads "Tell Mira about today. It can be one sentence."

### Listening (recording)
- **Purpose**: capture voice calmly; give confidence it's working.
- **Layout**: full-screen modal. Top: "To Mira" + audience line (`footnote`). Center: breathing glow. Below: elapsed time (tabular `headline`), last two transcript lines in `letterBody` `textMuted`. Bottom: Pause (secondary) and **Done** (primary); "Discard" confirms.
- **Primary action**: Done.
- **Empty state**: "Listening... take your time." Mic denied: calm card offering Type.

### Review
- **Purpose**: confirm the transcript, fix a few words, save.
- **Layout**: dateline; transcript in `letterBody` on `surfaceRaised`. Low-confidence words: **quiet underline**, 1.5pt dotted `accent` at 60%, 3pt below baseline. Tap: medium-detent sheet (H3) with alternatives + "Play this part". Edited words: hairline `textMuted` underline this session only. Mini-player, "Add a photo", bottom bar "Save letter" (primary), "Edit text".
- **Primary action**: Save letter (success haptic, gentle settle into the Book).
- **Empty state**: no words caught: "Your recording is still saved." Offer Play or Type.

### Book (month chapters)
- **Purpose**: browse the child's life by month of age.
- **Layout**: `display` "Mira's Book"; chapter covers newest first (`radius.lg`, "Month 4" `title2`, "12 letters · from Mama, Papa, Nani" `footnote`). Inside: month heading as typographic divider (S8); letter cards (`radius.md`, `elevation.1`): dateline, two-line serif excerpt, author, play + duration.
- **Primary action**: open a letter.
- **Empty state**: current month cover in paper tone: "Month 1 is waiting for its first letter." with a link to Tonight. Never a count of missed days.

### Letter reading view
- **Purpose**: read one letter as a page.
- **Layout**: 20pt gutter, chrome fades on scroll. Dateline; "From Papa"; optional photo; `letterBody`; italic sign-off. Floating pill player (`elevation.2`): play, scrubber, "Read together". "Aa" opens Reading Size sheet (medium detent, grabber, H3).
- **Primary action**: Play.
- **Empty state**: typed letter hides the player; processing shows "Preparing voice...".

### Read together
- **Purpose**: parent and child (or a grandparent) listen to the author's voice while words highlight.
- **Layout**: chrome-free; Reading Size Large by default; current word `accentSoft` wash, no dimming of other words (low vision). Current line held at 40% height. Bottom: 64pt play/pause, back 10s, speed 0.75x/1x, previous/next letter.
- **Primary action**: Play/Pause.
- **Empty state**: typed-only letter: "This letter was typed. Read it aloud together." with the text shown and no highlight.

### Family invite
- **Purpose**: bring in a partner and grandparents as writers or readers.
- **Layout**: `title1` "Who writes to Mira?"; members (initials, name, "Can write"/"Can read"). Invite sheet: name, relationship chips (Nani, Dadi, Nana, Dada, Grandma, Grandpa, Other), role, "Larger letters for them" (default on for grandparents **(opinion)**), share via Messages/WhatsApp. Invitee lands on the child's name and photo at Large Print.
- **Primary action**: Invite someone.
- **Empty state**: "Just you, for now. Letters are lovelier with more voices." plus Invite.

## 13. Open questions

Tiro 1.08x factor needs device testing; E2E encryption depends on architecture; print spreads deferred.
