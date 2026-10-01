# Component library decision: Early Letters

Owner: design systems. Status: accepted (see `docs/adr/0101-ui-component-library.md`). Verified 2026-10-01.
Companion: `COMPONENTS.md` (component specs). Token values: `packages/design-tokens/src/tokens.ts` (designer-owned).

## 1. Decision in one paragraph

**Mobile:** React Native Reusables (RNR) components, copied into our repo, styled with **Uniwind** (Tailwind v4 for React Native), on headless `@rn-primitives`. Where iOS has a control people already trust (segmented control, switch, alerts, context menus), we wrap **Expo UI's SwiftUI** components instead of drawing our own. Sheets use **Expo Router form sheets** (native iOS sheets), not a JS sheet library.
**Web (later):** **shadcn/ui** on Next.js with Tailwind v4.
**Shared:** one token source (`tokens.ts`) generates one CSS file of Tailwind v4 `@theme` variables that both apps import. The same class names (`bg-surface`, `text-text-muted`, `rounded-lg`) mean the same thing on both. Component names and variant names match one to one (`<Button variant="quiet">` on both).

## 2. The four libraries the founder named

| Library | Runs in React Native? | Evidence |
|---|---|---|
| **Material UI** | **No. Web only.** | The "Supported platforms" page lists browsers (Edge, Firefox, Chrome, Safari) and server rendering only ([mui.com/…/supported-platforms](https://mui.com/material-ui/getting-started/supported-platforms/)). npm peers are `react-dom` and `@emotion/react` ([npm @mui/material 9.4.0](https://registry.npmjs.org/@mui/material)). |
| **Mantine** | **No. Web only.** | Install needs `react-dom` peer and PostCSS (`postcss-preset-mantine`) ([mantine.dev/getting-started](https://mantine.dev/getting-started/); [npm @mantine/core 9.6.3](https://registry.npmjs.org/@mantine/core)). A third-party `react-native-mantine` exists ([GitHub auronsan/react-native-mantine](https://github.com/auronsan/react-native-mantine), not opened, **Unverified**); it is not the Mantine team's work. |
| **Ant Design** | **`antd` is web only.** A separate package, `@ant-design/react-native`, targets RN. | antd describes itself as "Enterprise-class UI designed for web applications" ([ant.design introduce](https://ant.design/docs/react/introduce)). `@ant-design/react-native` latest stable is 5.4.3 from 2025-08-11 ([npm](https://registry.npmjs.org/@ant-design/react-native)); README ([GitHub](https://github.com/ant-design/ant-design-mobile-rn)). |
| **shadcn/ui** | **No. Web only** (Tailwind CSS + DOM primitives). Its React Native port is RNR. | shadcn docs: "This is not a component library. It is how you build your component library." Open code, edit the file ([ui.shadcn.com/docs](https://ui.shadcn.com/docs)). Expo: "Standard Tailwind CSS supports only web platform. For universal support, use … NativeWind or Uniwind" ([docs.expo.dev/guides/tailwind](https://docs.expo.dev/guides/tailwind.md)). RNR README: "Bringing shadcn/ui to React Native" ([GitHub README](https://raw.githubusercontent.com/founded-labs/react-native-reusables/main/README.md)). |

**Plain answer:** none of the four runs in the iOS app. All four are possible for the web app. We pick shadcn/ui for web because it has a real React Native sibling (RNR) with the same structure and naming, so the two apps read as one codebase.

## 3. Native candidates: verified facts

All dates are latest-release dates from the npm registry, read 2026-10-01.

| Candidate | What it is | Latest / license | Notes (source) |
|---|---|---|---|
| **React Native Reusables** | shadcn-style copy-in components for RN, CLI `npx @react-native-reusables/cli add button` | CLI 0.7.1 (2026-03-14); primitives `@rn-primitives/*` 1.5.2 (2026-07-02); MIT | Supports "both Nativewind and Uniwind"; "you get the same files, and the code is yours" ([reactnativereusables.com/docs](https://reactnativereusables.com/docs), [installation](https://reactnativereusables.com/docs/installation)). Uniwind variant of Button source opened ([button.tsx](https://raw.githubusercontent.com/founded-labs/react-native-reusables/main/packages/registry/src/uniwind/components/ui/button.tsx)). |
| **Uniwind** | Tailwind v4 bindings for RN | 1.12.0 (2026-09-04), MIT; peer `react-native >=0.81`, `tailwindcss >=4` | "Uniwind only supports Tailwind 4"; Expo Metro setup via `withUniwindConfig`; theme vars via `@layer theme` + `@variant dark` ([quickstart](https://docs.uniwind.dev/quickstart.md), [global-css](https://docs.uniwind.dev/theming/global-css.md)). **Free tier: `group-*` variants "parsed but have no runtime effect"**; Pro supports them ([class-names](https://docs.uniwind.dev/class-names.md)). Pro supports Expo 54–57 ([pro/compatibility](https://docs.uniwind.dev/pro/compatibility.md)). Free tier on SDK 57: peer range satisfied, runtime **Unverified** until spike. |
| **NativeWind** | Tailwind for RN | stable 4.2.7 (2026-09-14, Tailwind v3); 5.0.0-rc.0 (2026-09-13, Tailwind v4); MIT | "v4.2.7 adds Expo SDK 57 support" ([installation](https://www.nativewind.dev/docs/getting-started/installation.mdx)); v5 is RC only ([v5 install](https://www.nativewind.dev/v5/getting-started/installation.mdx)). |
| **HeroUI Native** | Packaged RN components on Uniwind | 1.0.10 (2026-09-21), Apache-2.0 | Exists. "built on Tailwind v4 via Uniwind" ([heroui.com/docs/native](https://heroui.com/docs/native/getting-started)). Installed as npm dependency, peers include `@gorhom/bottom-sheet` ([npm](https://registry.npmjs.org/heroui-native)). |
| **gluestack-ui v5** | Copy-paste RN + web components | `gluestack-ui` CLI 5.0.3, `@gluestack-ui/core` 5.0.15 (2026-06-25), MIT | "copy-paste them directly into your … React Native projects"; CLI offers NativeWind v5 or UniWind ([intro](https://gluestack.io/ui/docs/home/overview/introduction), [install](https://gluestack.io/ui/docs/home/getting-started/installation)). |
| **Tamagui** | Style system + optimizing compiler + UI kit | 2.7.7 (2026-08-15); `@tamagui/core` MIT, `tamagui` package has no license field on npm (**Unverified**) | Own styling model, not Tailwind ([tamagui.dev](https://tamagui.dev), [npm](https://registry.npmjs.org/tamagui)). |
| **React Native Paper** | Material Design components | 5.15.3 (2026-05-26), MIT | "Cross-platform Material Design for React Native" ([callstack.github.io/react-native-paper](https://callstack.github.io/react-native-paper/)). Material look is wrong for an iOS-first memory book. |
| **Unistyles** | StyleSheet superset (no components) | 3.3.0 (2026-07-10), MIT; peers Nitro Modules, Reanimated | ([unistyl.es](https://www.unistyl.es/), [npm](https://registry.npmjs.org/react-native-unistyles)). |
| **Expo UI** | Real SwiftUI / Jetpack Compose from React, plus a "universal" layer with web fallbacks | `@expo/ui` 57.0.21 (2026-09-29), MIT; already in `apps/ios` | SwiftUI set includes Picker (segmented), Toggle, Alert, ConfirmationDialog, ContextMenu, BottomSheet, Slider ([swift-ui](https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui.md), [picker](https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/picker.md)). Universal: Android, iOS, Web ([universal](https://docs.expo.dev/versions/v57.0.0/sdk/ui/universal.md)). |

**New Architecture:** "SDK 55 and later run entirely on the New Architecture… cannot be disabled" ([docs.expo.dev/guides/new-architecture](https://docs.expo.dev/guides/new-architecture.md)). So every candidate must work there. Explicit New Architecture statements per library were not checked, so per-library New Arch support is **Unverified** beyond peer ranges. The Day-1 spike (section 7) is the real test.

## 4. Scored comparison

Score 1–5; weights sum to 100; total = Σ(score × weight) / 5.

| Criterion (weight) | RNR + Uniwind | RNR + NativeWind 4 | gluestack v5 | Expo UI alone | HeroUI Native | Unistyles + own | Tamagui | RN Paper |
|---|---|---|---|---|---|---|---|---|
| Runs on iOS, New Arch, SDK 57 (15) | 4 | 4 | 4 | 5 | 4 | 4 | 4 | 4 |
| iOS feel: sheets, haptics, gestures (10) | 3 | 3 | 3 | 5 | 4 | 3 | 3 | 1 |
| Accessibility: VoiceOver, Dynamic Type (10) | 4 | 4 | 4 | 5 | 4 | 3 | 3 | 4 |
| Dark mode (5) | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 |
| Theming with our tokens (10) | 5 | 4 | 4 | 2 | 4 | 4 | 4 | 3 |
| Web parity with web app (10) | 5 | 4 | 4 | 2 | 4 | 2 | 4 | 2 |
| Owned source vs black box (10) | 5 | 5 | 5 | 2 | 2 | 5 | 2 | 1 |
| Bundle / performance (5) | 5 | 4 | 3 | 5 | 3 | 5 | 4 | 3 |
| Maintenance 2025–26 (10) | 4 | 4 | 3 | 5 | 4 | 4 | 4 | 3 |
| License (5) | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 5 |
| Ease for an AI coding assistant (10) | 5 | 5 | 4 | 3 | 4 | 3 | 2 | 4 |
| **Total / 100** | **89** | **84** | **79** | **78** | **77** | **75** | **69** | **60** |

Why the scores land where they do:
- **RNR's** iOS feel is a 3 because it ships web-shaped defaults (shadcn heights like `h-10`, `rounded-md`). We fix that in our copies. Its other scores are high because the code is ours, it reads like shadcn, and AI assistants have seen a lot of shadcn code.
- **Uniwind over NativeWind 4:** Uniwind uses Tailwind v4, the same as the web app and shadcn's current default ([shadcn Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4)). NativeWind's Tailwind v4 line (v5) is still a release candidate.
- **Expo UI** wins on iOS feel but only covers controls, not our expressive components (LetterCard, ListeningAura). It has no web story for SwiftUI-specific APIs, and it is styled through SwiftUI modifiers rather than our classes. So it is a supplement, not the base.
- **HeroUI Native** is polished, but it is an npm black box and pulls in `@gorhom/bottom-sheet`, which we do not want.
- **Paper** looks like Material Design, which is wrong for an iOS-first memory book.

## 5. Companion libraries

| Need | Choice | Why / source |
|---|---|---|
| Animation | `react-native-reanimated` **4.5.1** (SDK 57 pin) + `react-native-worklets` 0.10.1 | Already installed; versions match SDK 57's `bundledNativeModules.json` ([unpkg expo@57.0.26](https://unpkg.com/expo@57.0.26/bundledNativeModules.json)). npm latest 4.7.0 needs RN 0.86–0.88 and worklets 0.13; **do not jump ahead of the SDK pin**. |
| Gestures | `react-native-gesture-handler` **~2.32.0** (SDK pin) | npm latest is 3.3.0 ([npm](https://registry.npmjs.org/react-native-gesture-handler)); stay on the SDK pin. Used for scrubbing and EditUnderline long-press. |
| Sheets | **Expo Router `presentation: 'formSheet'`** with `sheetAllowedDetents`, `sheetGrabberVisible`, `sheetCornerRadius` | Real UISheetPresentationController ([router modals](https://docs.expo.dev/router/advanced/modals.md)). `@gorhom/bottom-sheet` 5.2.14 is not in SDK 57's bundled list. Keep it as a fallback only for an in-screen non-modal sheet. |
| Lists | `@shopify/flash-list` **2.0.2** (SDK pin) | Listed in SDK 57 third-party docs ([expo flash-list](https://docs.expo.dev/versions/v57.0.0/sdk/flash-list.md)). For the month-by-month memory book. |
| Icons | **Lucide**: `lucide-react-native` + `lucide-react` 1.49.0, ISC | Same names on both platforms; RNR uses Lucide ([npm](https://registry.npmjs.org/lucide-react-native)). Needs `react-native-svg` (SDK pin 15.15.4). `expo-symbols` (already installed) is allowed for the native tab bar only. |
| Haptics | `expo-haptics` ~57.0.3 | `selectionAsync`, `impactAsync(Soft/Light/…)`, `notificationAsync` ([expo haptics](https://docs.expo.dev/versions/v57.0.0/sdk/haptics.md)). Wrapped in `lib/haptics.ts` with five named intents only. |
| Native controls | `@expo/ui` (already installed) | Toggle, segmented Picker, Alert, ConfirmationDialog, ContextMenu. |
| Audio | `expo-audio` ~57.0.5 | Players plus ListeningAura input: recorder status has `metering` when `isMeteringEnabled` ([expo audio](https://docs.expo.dev/versions/v57.0.0/sdk/audio.md)). |
| Class utilities | `class-variance-authority`, `clsx`, `tailwind-merge`, `@rn-primitives/portal` | Listed in RNR manual install ([manual](https://reactnativereusables.com/docs/installation/manual)). |
| Web | Next.js + Tailwind v4 + shadcn/ui + `lucide-react` + `motion` (**Unverified**, choose later) | shadcn is open code with Radix/Base UI primitives ([ui.shadcn.com/docs](https://ui.shadcn.com/docs)). |

## 6. How mobile and web share one design language

```
packages/design-tokens/
  src/tokens.ts          ← designer fills values (contract names below)
  scripts/build-css.ts   ← generates dist/tokens.css (Tailwind v4 @theme + light/dark)
  dist/tokens.css        ← imported by apps/ios/src/global.css AND apps/web/app/globals.css
packages/ui-contract/    ← (optional later) shared TS prop types: ButtonVariant, ChipTone…
apps/ios/src/components/ui/*.tsx   ← RNR copies, edited
apps/web/components/ui/*.tsx       ← shadcn copies, edited to same variant names
```

**How each token maps to a Tailwind class (same on both platforms):**

| Token | CSS variable | Class examples |
|---|---|---|
| colors `bg, surface, surfaceRaised, text, textMuted, accent, accentSoft, onAccent, line, focus, recording, success, caution` | `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-accent-soft`, `--color-on-accent`, `--color-line`, `--color-focus`, `--color-recording`, `--color-success`, `--color-caution` | `bg-bg`, `bg-surface-raised`, `text-text`, `text-text-muted`, `bg-accent`, `text-on-accent`, `border-line` |
| `space.0..12` (4pt) | Tailwind v4 `--spacing: 4px` | `p-4` = 16pt, `gap-3` = 12pt |
| `radius.sm/md/lg/xl/pill` | `--radius-sm` … `--radius-pill` | `rounded-lg`, `rounded-pill` |
| type styles | `--text-body`, `--text-body--line-height`, … plus `--font-letter` | `text-body`, `text-letter-body`, `font-letter` |
| `elevation.0..3` | `--shadow-e1..3` (web); on iOS read from `tokens.ts` directly (`boxShadow` style) | `shadow-e2` |
| `motion.snappy/standard/gentle` | **JS only**: `tokens.motion.*` (spring configs) for Reanimated; web gets `--ease-*`/`--duration-*` | `withSpring(x, motion.gentle)` |

`text-text` reads awkwardly, but it follows the token contract, and the RNR `Text` component hides it. Do not rename tokens per platform.

**Generated `tokens.css` shape** (values come from `tokens.ts`, never typed by hand):
```css
@theme {
  --spacing: 4px;
  --radius-sm: …; --radius-pill: 999px;
  --text-body: 17px; --text-body--line-height: 22px;
  --font-letter: "…";
}
@layer theme {
  :root {
    @variant light { --color-bg: …; --color-text: …; /* all 13 */ }
    @variant dark  { --color-bg: …; --color-text: …; }
  }
}
```
Web uses the same file. In Next.js, `@variant light/dark` must be expressed as `:root` plus `.dark` (shadcn convention). The generator emits two flavours, `tokens.native.css` and `tokens.web.css`, from one source, so no value is ever typed twice.

**Dynamic Type:** Tailwind font sizes are fixed points, and Uniwind has no `rem` ([class-names](https://docs.uniwind.dev/class-names.md)). RN `Text` still scales with the system text size unless `allowFontScaling={false}`. Our `Text` component sets `maxFontSizeMultiplier` per style (letters up to 2.0, chrome up to 1.5) and never disables scaling.

## 7. Installation plan (do not run yet; run in `apps/ios`)

**Step 0: Day-1 spike (half a day).** On a dev build on a real iPhone, prove four things: Uniwind free tier + Reanimated 4.5.1 + Expo Router form sheet + one Expo UI `Host` render together on SDK 57 with the React Compiler on. If Uniwind fails, fall back to NativeWind 4.2.7 (Tailwind v3, explicitly SDK 57). Only the config changes, not the components.

```bash
# 1. Styling engine + utilities
npx expo install uniwind tailwindcss class-variance-authority clsx tailwind-merge
npx expo install @rn-primitives/portal @rn-primitives/slot react-native-svg lucide-react-native

# 2. Platform companions (SDK-pinned; reanimated/worklets/gesture-handler/screens/@expo/ui already present)
npx expo install expo-haptics expo-audio @shopify/flash-list expo-blur expo-linear-gradient

# 3. Components (CLI copies files into src/components/ui; pick the Uniwind flavour when prompted)
npx @react-native-reusables/cli@latest init        # in an existing app it configures; verify diff
npx @react-native-reusables/cli@latest add button text card input textarea toggle dialog alert-dialog avatar separator
npx @react-native-reusables/cli@latest doctor
```

**`apps/ios/metro.config.js`** (monorepo + Uniwind outermost, per [quickstart](https://docs.uniwind.dev/quickstart.md)):
```js
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const config = getDefaultConfig(__dirname);
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
```

**`apps/ios/src/global.css`** (replaces the template file):
```css
@import 'tailwindcss';
@import 'uniwind';
@import '../../../packages/design-tokens/dist/tokens.native.css';
@source '../../../packages';          /* monorepo scanning, per Uniwind monorepo guide */
```
Uniwind requires `@source` for files outside the CSS file's folder ([monorepos](https://docs.uniwind.dev/monorepos.md)).

**`apps/ios/components.json`**: RNR uses shadcn's `components.json` format ([customization](https://reactnativereusables.com/docs/customization)). Set aliases `@/components`, `@/lib/utils`. Add `PortalHost` in `src/app/_layout.tsx` ([manual](https://reactnativereusables.com/docs/installation/manual)).

**Clean-up:** delete the template `constants/theme.ts`, `themed-text.tsx` and `themed-view.tsx` once `Text` and `Card` exist. Add `packages/design-tokens/package.json` with a `build` script and run it from the root `prepare` script.

**Web (later, `apps/web`):** `npx shadcn@latest init` (shadcn CLI 4.21.1, [npm](https://registry.npmjs.org/shadcn)). Import `tokens.web.css`, then `npx shadcn add button card …`, and rename variants to match mobile.

## 8. Risks

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| **Uniwind free has no `group-*` variants**; RNR Button colours its label via `group-active:` | Certain / low | Our Button reads `pressed` from `Pressable` and sets text classes directly; lint rule bans `group-` in `apps/ios`. Pro is an option, not a requirement. |
| Uniwind (1.x, single vendor, Pro upsell) loses momentum | Low–med / med | Classes are standard Tailwind. NativeWind v5 (Tailwind v4) is a config-level swap; components stay. |
| RNR CLI last released 2026-03; primitives 2026-07 | Med / low | We own the copies; primitives are thin. Do not depend on CLI after setup. |
| RNR defaults are web-sized (h-10 = 40pt < 44pt) | Certain / med | Every copied component is edited to our specs (min 44pt) before first use; `COMPONENTS.md` is the reference. |
| Expo UI `Host` sizing and theming quirks (needs `matchContents`, colours passed per prop) | Med / low | Use only for 4 controls; wrap each once; pass token colours from `tokens.ts`. |
| Reanimated/gesture-handler upgrades past SDK pin break build | Med / high | Always `npx expo install`; `npx expo install --check` in CI. |
| Form sheet footer is Android-only experimental ([modals](https://docs.expo.dev/router/advanced/modals.md)); sticky CTA inside iOS sheets must be our own | Certain / low | Sheet content uses an in-sheet `StickyFooter` with safe-area padding. |
| Two copies of each component (RN and web) drift | Med / med | Shared `ui-contract` prop types and a parity checklist in each component file header. |
| Metering update rate too coarse for a smooth aura | Med / low | Smooth on UI thread with `withSpring(motion.gentle)`; fallback is a slow breathing loop. |
