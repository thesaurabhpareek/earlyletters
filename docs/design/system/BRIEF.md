# Design system v2: brief (20 Nov 2026)

Owner: Karma (CTO role) with the Chief Design Officer role. The founder asked on 20 Nov: look at all the previous design system and design work, keep what is relevant and retire what is not, and create or update the design system so every required component is standardised, with transition and animation standards, using Apple's latest Liquid Glass so the app meets Apple's material benchmarks, at a high-quality, premium feel.

Output folder: `docs/design/system/` on branch `docs/e2e-ux-20nov`. This system is what the 15 end-to-end leads (`docs/design/e2e/`) key their screens to, and what engineering builds from. It changes no card (CR-66). Code changes to `packages/design-tokens` and `apps/mobile/src/components` are specified here and built through backlog rows by the `design-systems` and `mobile` lanes; this round writes the specification and a reference page, not production code.

## 1. Apple facts this system rests on (read 20 Nov 2026)

From the Human Interface Guidelines, Materials (developer.apple.com/design/human-interface-guidelines/materials, change log to 9 Sep 2025) and Adopting Liquid Glass (developer.apple.com/documentation/technologyoverviews/adopting-liquid-glass):
- Liquid Glass forms a distinct functional layer for controls and navigation (tab bars, toolbars, sheets, menus, popovers) that floats above the content layer.
- Do not use Liquid Glass in the content layer; use standard materials there (ultra-thin, thin, regular, thick). Exception: transient interactive controls such as sliders and toggles take on glass while active.
- Use it sparingly on custom controls; limit it to the most important functional elements. Do not layer glass on glass. Combine custom glass shapes in one container so they morph and render efficiently.
- Two variants: regular (blurs and adjusts luminosity for legibility; default; use where there is text) and clear (highly translucent, only over visually rich backgrounds such as photos; add a dark dimming layer of about 35 percent over bright content).
- Prefer system components (tab bars, navigation bars, toolbars, sheets, buttons with the glass and prominent glass styles) and remove custom backgrounds from them; standard components adapt automatically.
- Controls: rounder, capsule-leaning shapes; corners concentric with their container and the hardware; an extra-large control size exists. Lists and forms: larger row height and padding, larger section corner radius, title-style capitalisation in section headers.
- Sheets: larger corner radius; half sheets inset from the display edge so content peeks through; a sheet becomes more opaque at full height. Action sheets originate from the control that opened them.
- Tab bars can minimise on scroll; scroll edge effects keep bars legible over scrolling content.
- Colour in controls and navigation: use system colours or custom colours with light, dark and increased-contrast variants; use vibrant label colours on materials.
- Accessibility: Reduce Transparency, Increase Contrast and Reduce Motion modify Liquid Glass; test every custom element under each.
- App icons: layered, built in Icon Composer, with default, dark, clear and tinted appearances; let the system apply masking and effects.
- iOS 27 (WWDC, 8 Jun 2026, per press reports read 20 Nov): a system-wide slider sets Liquid Glass intensity from more opaque to clear, with improved diffusion and contrast; apps using system materials pick this up without changes. Our custom glass must therefore look right at both ends of that slider.

From Expo SDK 57 docs (docs.expo.dev, versions v57.0.0):
- `expo-glass-effect`: `GlassView` (`glassEffectStyle` regular, clear or none, with `animate` and `animationDuration`; `tintColor`; `isInteractive`; `colorScheme`) and `GlassContainer` (`spacing`, merges nearby glass). Needs iOS 26 or later and falls back to a plain View; `isLiquidGlassAvailable()` ignores accessibility settings, so read `AccessibilityInfo.isReduceTransparencyEnabled()`; setting opacity 0 on a glass view stops it rendering (animate the style instead).
- Expo Router native tabs (`expo-router/unstable-native-tabs` in SDK 54 to 57) render the system tab bar with Liquid Glass.

## 2. House rules that do not move

The constitution and the content rules in `CLAUDE.md`; calm, never ceremonial; no streaks, counts of gaps or celebration; three tabs Home, Book, Me; only Home starts a letter; the Home slip order; the undo rule T4; AX5 at 375 pt; Asha only. Premium here means restraint, typographic quality, precise spacing, honest materials and motion that is quick and physical, never decoration.

## 3. The material policy (decided, Karma with the Chief Design Officer role)

- Glass layer (Liquid Glass, regular): the tab bar (system native tabs), navigation and toolbar buttons, the floating capture control cluster on Home, sheets and the Keep gate sheet, menus and popovers, the Find bar, the Book header controls, the undo toast, the recording control while recording.
- Glass, clear with a 35 percent dim: controls floating over a picture (the photo on Review and on the letter page, the Photos lens viewer).
- Content layer, never glass: letters, the Book pages, the letter page body, Read together pages, lists of letters, cards in the content flow, settings lists (system grouped list style), empty states, error screens. Use the house paper and ink tokens and standard materials where separation is needed.
- One glass container per cluster; never glass inside glass; at most three glass surfaces visible at once on any screen.
- Reduce Transparency or iOS earlier than 26: every glass surface falls back to a solid token surface with a hairline border, same shape and size. Increase Contrast: borders and label colours step up to their high-contrast tokens.

## 4. The work and who does it

| Piece | File(s) | Lead |
|---|---|---|
| Audit and disposition of every prior design-system and design document, token and component | `AUDIT.md` | design-systems (auditor) |
| Foundations: materials, colour (light, dark, increased contrast), type scale with Dynamic Type to AX5, spacing, concentric radii, elevation, iconography (SF Symbols mapping), app icon layers | `FOUNDATIONS.md`, `tokens.v2.json` (proposal) | design-systems (foundations) |
| Components: the full catalogue, each with anatomy, variants, states (default, pressed, focused, disabled-absent rule, loading, error, AX5, VoiceOver), layer (glass or content), tokens, motion hooks, implementation in Expo (native tabs, `GlassView`, existing component mapping, new ones) | `COMPONENTS.md` | design-systems (components) |
| Motion and transitions: primitives (springs and durations), glass morphs, navigation transitions, sheet and toast motion, haptics, Reduce Motion substitutes, what never animates | `MOTION.md` | design-systems (motion) |
| Reference page: one self-contained HTML page showing tokens, materials over light, dark and photo backgrounds, every component in every state, and the motion primitives, with toggles for dark, Reduce Transparency, Increase Contrast, Reduce Motion and AX5 | `REFERENCE.html` | design-systems (components, with foundations and motion) |

Every file: ASCII only; cite sources for Apple facts; mark UNVERIFIED anything not read this session; list "Engineering rows needed" (what `design-systems` and `mobile` must build, as proposed backlog rows) and "Retired" (what this supersedes). Write only in `docs/design/system/`. No commits, pushes or posts; Karma reconciles and commits.
