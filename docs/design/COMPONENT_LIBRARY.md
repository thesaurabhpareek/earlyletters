# Component library decision: Early Letters

Owner: design systems. Status: accepted (see `docs/adr/0101-ui-component-library.md`). Verified 2026-10-01. **Revised Oct 1 2026 for "Apple first now, Android later".**
Companions: `COMPONENTS.md` (component specs), `MOTION.md` (animation, haptics map), `DESIGN_LANGUAGE.md` (tokens, icons). Token values: `packages/design-tokens/src/tokens.ts` (designer-owned).

## 1. Decision in one paragraph

**Mobile (iOS now, Android later, one codebase):** React Native Reusables (RNR) components, copied into our repo, styled with **Uniwind** (Tailwind v4 for React Native), on headless `@rn-primitives`. These render the same on iOS and Android. Where a platform has a control people already trust (switch, segmented control, long-press menu), we use **Expo UI**: SwiftUI on iOS, Jetpack Compose on Android, each behind **our own component name** with `.ios.tsx` / `.android.tsx` files. Screens never import a platform library. Sheets use **Expo Router form sheets** (native sheet on iOS, platform bottom sheet on Android). Confirms use React Native's built-in `Alert.alert` (native on both). Icons are **Phosphor** everywhere; **no SF Symbols** in v1. Animation is **Reanimated** per `MOTION.md`.
**Web (later):** **shadcn/ui** on Next.js with Tailwind v4.
**Shared:** one token source (`tokens.ts`) generates one CSS file of Tailwind v4 `@theme` variables that both apps import. Component and variant names match one to one (`<Button variant="quiet">` everywhere).

### What changed in the Oct 1 revision
| Area | Before | Now | Why |
|---|---|---|---|
| Scoring | iOS-weighted | Android parity is the heaviest criterion (20/100) | Founder constraint |
| Base library | RNR + Uniwind | **Unchanged** (still first, 91/100) | Evidence below; RNR's native code paths are shared by iOS and Android |
| Native controls | Expo UI SwiftUI only | SwiftUI on iOS **and** Jetpack Compose on Android, behind wrappers (section 5) | Expo UI ships both; APIs differ |
| Confirm dialogs | Expo UI SwiftUI `Alert` / `ConfirmationDialog` | RN `Alert.alert`, one file | Native on both, imperative, no wrapper split |
| Long-press menu | Expo UI `ContextMenu` imported in LetterCard | `ActionMenu` wrapper: SwiftUI `ContextMenu` / Android action sheet | Compose has no long-press context menu |
| Icons | Lucide (conflicted with DESIGN_LANGUAGE) | **Phosphor** (matches DESIGN_LANGUAGE section 7) | One set, both platforms |
| SF Symbols | Allowed in tab bar | Not used; tab icons are Phosphor PNGs via `NativeTabs.Trigger.Icon src` | Same icon on both; no symbol mapping |
| Haptics | iOS calls only | `haptic(intent)` with `.ios.ts` / `.android.ts` per MOTION section 6 | Android uses `performAndroidHapticsAsync` |
| Blur | `expo-blur` direct | `BlurSurface` wrapper; Android is solid `surfaceRaised` | Android blur needs extra setup |
| Motion | per-component springs | aligned to `MOTION.md` (measured-rect, `useMotion()`, no Lottie/Rive) | MOTION is the source |

## 2. The four libraries the founder named

| Library | Runs in React Native? | Evidence |
|---|---|---|
| **Material UI** | **No. Web only.** | The "Supported platforms" page lists browsers (Edge, Firefox, Chrome, Safari) and server rendering only ([mui.com/.../supported-platforms](https://mui.com/material-ui/getting-started/supported-platforms/)). npm peers are `react-dom` and `@emotion/react` ([npm @mui/material 9.4.0](https://registry.npmjs.org/@mui/material)). |
| **Mantine** | **No. Web only.** | Install needs `react-dom` peer and PostCSS (`postcss-preset-mantine`) ([mantine.dev/getting-started](https://mantine.dev/getting-started/); [npm @mantine/core 9.6.3](https://registry.npmjs.org/@mantine/core)). A third-party `react-native-mantine` exists ([GitHub auronsan/react-native-mantine](https://github.com/auronsan/react-native-mantine), not opened, **Unverified**); it is not the Mantine team's work. |
| **Ant Design** | **`antd` is web only.** A separate package, `@ant-design/react-native`, targets RN. | antd describes itself as "Enterprise-class UI designed for web applications" ([ant.design introduce](https://ant.design/docs/react/introduce)). `@ant-design/react-native` latest stable is 5.4.3 from 2025-08-11 ([npm](https://registry.npmjs.org/@ant-design/react-native)); README ([GitHub](https://github.com/ant-design/ant-design-mobile-rn)). |
| **shadcn/ui** | **No. Web only** (Tailwind CSS + DOM primitives). Its React Native port is RNR. | shadcn docs: "This is not a component library. It is how you build your component library." Open code, edit the file ([ui.shadcn.com/docs](https://ui.shadcn.com/docs)). Expo: "Standard Tailwind CSS supports only web platform. For universal support, use ... NativeWind or Uniwind" ([docs.expo.dev/guides/tailwind](https://docs.expo.dev/guides/tailwind.md)). RNR README: "Bringing shadcn/ui to React Native" ([GitHub README](https://raw.githubusercontent.com/founded-labs/react-native-reusables/main/README.md)). |

**Plain answer:** none of the four runs in the mobile app (iOS or Android). All four are possible for the web app. We pick shadcn/ui for web because it has a real React Native sibling (RNR) with the same structure and naming, so the two apps read as one codebase.

## 3. Candidates: verified facts, with Android evidence

Versions and licences from the npm registry `latest` endpoint, read 2026-10-01.

| Candidate | Latest / license | Platforms (source) | Notes (source) |
|---|---|---|---|
| **React Native Reusables** | `@rn-primitives/*` 1.5.2, MIT | Native code shared by iOS and Android: component files branch only on `web` vs native (`Platform.select({ web: ... })`); the one iOS-only line is `FullWindowOverlay` in `dialog.tsx` ([button.tsx](https://raw.githubusercontent.com/founded-labs/react-native-reusables/main/packages/registry/src/uniwind/components/ui/button.tsx), [dialog.tsx](https://raw.githubusercontent.com/founded-labs/react-native-reusables/main/packages/registry/src/uniwind/components/ui/dialog.tsx), [switch.tsx](https://raw.githubusercontent.com/founded-labs/react-native-reusables/main/packages/registry/src/uniwind/components/ui/switch.tsx)). The docs site did not render for us; an explicit "iOS and Android supported" statement is **Unverified**. | Copy-in, shadcn-style, MIT ([README](https://raw.githubusercontent.com/founded-labs/react-native-reusables/main/README.md)). Supports Nativewind and Uniwind ([installation](https://reactnativereusables.com/docs/installation), read in the first pass). |
| **Uniwind** | 1.12.1, MIT; peers `react-native >=0.81`, `tailwindcss >=4` | "works with Expo, iOS, Android, tvOS and Web" ([llms.txt index](https://docs.uniwind.dev/llms.txt)); built-in `ios:` / `android:` / `web:` selectors ([platform selectors](https://docs.uniwind.dev/api/platform-select.md)) | Free tier: `group-*` "parsed but have no runtime effect" ([class-names](https://docs.uniwind.dev/class-names.md)). SDK 57 runtime **Unverified** until spike. |
| **NativeWind** | 4.2.7, MIT (Tailwind v3); v5 RC is Tailwind v4 | "works with both Expo and framework-less React Native" ([installation](https://www.nativewind.dev/docs/getting-started/installation)) | "v4.2.7 adds Expo SDK 57 support" (same page). |
| **HeroUI Native** | 1.0.10, Apache-2.0; peers include `@gorhom/bottom-sheet` ^5.2.9 | "We are focusing on mobile platforms (iOS and Android) at this time"; not for web ([quick start](https://heroui.com/docs/native/getting-started/quick-start)) | npm dependency, not owned source. |
| **gluestack-ui v5** | `@gluestack-ui/core` 5.0.15, MIT; peers `react-native-web`, `react-native-svg` | "One codebase, same behavior across React, Next.js, and React Native" ([intro](https://gluestack.io/ui/docs/home/overview/introduction)) | "Copy-paste components, modify freely" (same page). |
| **Tamagui** | 2.7.7; `tamagui` has no license field on npm (**Unverified**) | "All of its features work the same on both React Native and React web" ([intro](https://tamagui.dev/docs/intro/introduction)) | Own style system plus `@tamagui/static` compiler (same page). |
| **React Native Paper** | 5.15.3, MIT | "aligned across iOS, Android, and React Native Web from one codebase" ([oss.callstack.com/react-native-paper](https://oss.callstack.com/react-native-paper/)) | "following Google's Material Design guidelines", Material 3 (same page). Best Android parity, wrong iOS feel. |
| **Expo UI** | `@expo/ui` ~57.0.21 (SDK pin), MIT; already in `apps/ios` | `platforms: ['android', 'ios', 'tvos', 'expo-go']`; three layers: **SwiftUI** (iOS), **Jetpack Compose** (Android), **Universal** (Android, iOS, web) ([overview](https://docs.expo.dev/versions/v57.0.0/sdk/ui.md), [universal](https://docs.expo.dev/versions/v57.0.0/sdk/ui/universal.md)) | See section 3.1. |
| **Unistyles** | 3.3.0, MIT | Platform page not opened: **Unverified** | No components. |

### 3.1 Expo UI: SwiftUI vs Jetpack Compose, how different are the APIs?

Expo UI is a set of 1:1 mappings: "Components map one to one to their native counterparts" ([overview](https://docs.expo.dev/versions/v57.0.0/sdk/ui.md)). So the two platform APIs are **as different as SwiftUI and Compose are**. The Universal layer smooths this, but only for a small set.

| Our need | iOS: `@expo/ui/swift-ui` | Android: `@expo/ui/jetpack-compose` | Universal `@expo/ui`? |
|---|---|---|---|
| Switch | `<Toggle isOn onIsOnChange label />`, colour via `tint()` modifier ([toggle](https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/toggle.md)) | `<Switch value onCheckedChange colors={{ checkedTrackColor, ... }} />` ([switch](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/switch.md)) | **Yes**, `<Switch value onValueChange label />`, but no colour prop; colour only via platform `modifiers` ([universal switch](https://docs.expo.dev/versions/v57.0.0/sdk/ui/universal/switch.md)) |
| Segmented control | `<Picker modifiers={[pickerStyle('segmented')]} selection onSelectionChange>` with `tag()`-ed `Text` children ([picker](https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/picker.md)) | `<SingleChoiceSegmentedButtonRow>` of `<SegmentedButton selected onClick>` with `SegmentedButton.Label` ([segmentedbutton](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/segmentedbutton.md)) | **No.** Universal `Picker` has "menu and wheel appearances" only ([universal picker](https://docs.expo.dev/versions/v57.0.0/sdk/ui/universal/picker.md)) |
| Alert | `<Alert>` with `Alert.Trigger` / `Alert.Actions` slots ([alert](https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/alert.md)) | `<AlertDialog onDismissRequest>` with `.Title/.Text/.ConfirmButton/.DismissButton` slots ([alertdialog](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/alertdialog.md)) | No. We use RN `Alert.alert` instead (section 5) |
| Long-press menu | `<ContextMenu>` "displays a menu when long-pressed" ([contextmenu](https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/contextmenu.md)) | Only `<DropdownMenu>`, "displays a dropdown menu when a trigger element is pressed" ([dropdownmenu](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/dropdownmenu.md)) | No |
| Bottom sheet | SwiftUI BottomSheet | `ModalBottomSheet` ([bottomsheet](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/bottomsheet.md)) | Yes, `BottomSheet` ([universal bottomsheet](https://docs.expo.dev/versions/v57.0.0/sdk/ui/universal/bottomsheet.md)). We still use Expo Router form sheets (route-level, deep-linkable). |

Both platforms require a `Host` wrapper ([compose usage](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose.md)). **Conclusion:** Expo UI is a good supplement on both platforms, but every use needs two files. That cost is why we keep it to three controls.

**New Architecture:** "SDK 55 and later run entirely on the New Architecture... cannot be disabled" ([docs.expo.dev/guides/new-architecture](https://docs.expo.dev/guides/new-architecture.md)). Per-library New Arch support is **Unverified** beyond peer ranges; the spike (section 8) tests it.

## 4. Scored comparison (Android-weighted)

Score 1 to 5; weights sum to 100; total = Σ(score × weight) / 5. **Android parity** = the same component code renders correctly and feels acceptable on Android with no rewrite.

| Criterion (weight) | RNR + Uniwind | RNR + NativeWind 4 | gluestack v5 | HeroUI Native | Unistyles + own | Expo UI alone | Tamagui | RN Paper |
|---|---|---|---|---|---|---|---|---|
| **Android parity (20)** | 5 | 5 | 5 | 5 | 4 | 3 | 5 | 5 |
| Runs on New Arch, SDK 57 (10) | 4 | 4 | 4 | 4 | 4 | 5 | 4 | 4 |
| iOS feel (10) | 3 | 3 | 3 | 4 | 3 | 5 | 3 | 1 |
| Accessibility (10) | 4 | 4 | 4 | 4 | 3 | 5 | 3 | 4 |
| Theming with our tokens (10) | 5 | 4 | 4 | 4 | 4 | 2 | 4 | 3 |
| Owned source (10) | 5 | 5 | 5 | 2 | 5 | 2 | 2 | 1 |
| Dark mode (5) | 5 | 5 | 5 | 5 | 5 | 5 | 5 | 4 |
| Web parity (5) | 5 | 4 | 4 | 2 | 2 | 2 | 4 | 2 |
| Bundle / performance (5) | 5 | 4 | 3 | 3 | 5 | 5 | 4 | 3 |
| Maintenance (5) | 4 | 4 | 3 | 4 | 4 | 5 | 4 | 3 |
| License (5) | 5 | 5 | 5 | 5 | 5 | 5 | 4 | 5 |
| Ease for an AI assistant (5) | 5 | 5 | 4 | 4 | 3 | 3 | 2 | 4 |
| **Total / 100** | **91** | **87** | **84** | **79** | **78** | **75** | **75** | **67** |

- **Decision unchanged.** Android weighting lifts every cross-platform library equally, so the ranking among them does not move. RNR stays first on owned source, tokens and web parity.
- **Expo UI alone drops** (78 → 75): it runs on both platforms, but through two different APIs and a thin universal layer.
- **Paper** gains on Android but still has the wrong iOS feel (Material 3).
- **HeroUI Native** is iOS + Android only, explicitly not web, and still a black box that needs `@gorhom/bottom-sheet`.

## 5. Platform-native pieces: wrapper rule

**Rule.** Any platform-native piece lives in `apps/ios/src/components/platform/` (or `lib/` for non-visual helpers) behind our own name, as three files: `<name>.ios.tsx`, `<name>.android.tsx`, and `<name>.tsx` (web and fallback; also the file TypeScript resolves). All three export the same props type from `<name>.types.ts`. Screens and product components import only `@/components/platform/<name>`. A lint rule (`no-restricted-imports`) bans `@expo/ui/swift-ui`, `@expo/ui/jetpack-compose`, `expo-symbols`, `expo-blur` and `expo-haptics` everywhere else.

| Our component | iOS file (v1, built now) | Android file (later) | Web / fallback | Sources |
|---|---|---|---|---|
| `Toggle` | Expo UI SwiftUI `Toggle` + `tint(accent)` in `Host` | Expo UI Compose `Switch` with `colors` from tokens (`checkedTrackColor = accent`) | shadcn `Switch` | [toggle](https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/toggle.md), [switch](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/switch.md) |
| `SegmentedControl` | SwiftUI `Picker` + `pickerStyle('segmented')` | Compose `SingleChoiceSegmentedButtonRow` (Material 3 segmented buttons) | shadcn `ToggleGroup` | [picker](https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/picker.md), [segmentedbutton](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/segmentedbutton.md) |
| `ActionMenu` (letter long-press: share, edit, delete) | SwiftUI `ContextMenu` around the card | Long-press opens our `Sheet` (`fitToContents`) with a list of `ListRow`s. Compose `DropdownMenu` is tap-triggered, so not used | shadcn `ContextMenu` | [contextmenu](https://docs.expo.dev/versions/v57.0.0/sdk/ui/swift-ui/contextmenu.md), [dropdownmenu](https://docs.expo.dev/versions/v57.0.0/sdk/ui/jetpack-compose/dropdownmenu.md) |
| `sheetScreenOptions()` + `SheetBody` | `formSheet` with detents, `sheetGrabberVisible`, `sheetCornerRadius`; title may use the native header | Same `formSheet`; detents capped at 3; no grabber (iOS only); title rendered inside `SheetBody` because headers "will not render inside the sheet"; do **not** use `unstable_sheetFooter` (experimental) | shadcn `Drawer` / `Dialog` | [modals](https://docs.expo.dev/router/advanced/modals.md) |
| `haptic(intent)` (`lib/haptics.*.ts`) | `expo-haptics` `selectionAsync` / `impactAsync` / `notificationAsync`; fire record-start haptic before the audio session starts | `performAndroidHapticsAsync(AndroidHaptics.*)`, mapping per MOTION section 6 (`Segment_Tick`, `Context_Click`, `Long_Press`, `Confirm`, `Reject`) | no-op | [haptics](https://docs.expo.dev/versions/v57.0.0/sdk/haptics.md) |
| `BlurSurface` (CaptureBar, sticky chapter header) | `expo-blur` `BlurView`; Reduce Transparency → solid `surfaceRaised` | Solid `surfaceRaised` + `line` hairline (Android blur needs extra setup; not worth it) | CSS `backdrop-filter` | [blur-view](https://docs.expo.dev/versions/v57.0.0/sdk/blur-view.md) |
| `Icon` | `phosphor-react-native` | same file works (no split needed); listed so icon size and weight rules live in one place | `@phosphor-icons/react` | section 6 |

**Not wrapped, because it is already cross-platform in one API:**
- `confirm()` uses React Native `Alert.alert`: native alert on iOS and Android. Android allows at most three buttons, ignores `style: 'destructive'`, and is not cancelable by tapping outside unless `{ cancelable: true }` ([reactnative.dev/docs/alert](https://reactnative.dev/docs/alert)). So the confirm label must say the action ("Delete letter"), never rely on red.
- Native tabs: `NativeTabs.Trigger.Icon src={require(...png)}` works on both ([native tabs](https://docs.expo.dev/router/advanced/native-tabs.md)); the current template already does this.
- Measured-rect letter open, Read together, breathing glow: plain Reanimated, same code (MOTION 5b, 5f, 5g).

**Removed from v1:** Expo UI `Alert`, `ConfirmationDialog` and `Popover` (EditUnderline now expands inline per MOTION 5d).

## 6. Companion libraries

| Need | Choice | iOS + Android? / source |
|---|---|---|
| Animation | `react-native-reanimated` **4.5.1** + `react-native-worklets` 0.10.1 (SDK 57 pins) | Both. Pins from [bundledNativeModules.json](https://unpkg.com/expo@57.0.26/bundledNativeModules.json). All rules in `MOTION.md`: one `useMotion()` hook, measured-rect transitions (no shared-element transitions, no `Link.AppleZoom` in v1), **no Lottie or Rive in v1**. |
| Gestures | `react-native-gesture-handler` ~2.32.0 (SDK pin) | Both. Scrubbing, toast swipe. |
| Sheets | Expo Router `presentation: 'formSheet'` behind `sheetScreenOptions()` | Both, with Android limits ([modals](https://docs.expo.dev/router/advanced/modals.md)). No `@gorhom/bottom-sheet`. |
| Lists | `@shopify/flash-list` 2.0.2 (SDK pin) | Both ([expo flash-list](https://docs.expo.dev/versions/v57.0.0/sdk/flash-list.md)). |
| Icons | **Phosphor**: `phosphor-react-native` 3.0.6 (MIT, peers `react`, `react-native`, `react-native-svg`) and `@phosphor-icons/react` 2.1.10 (MIT) for web | Install is `phosphor-react-native react-native-svg`; MIT ([GitHub](https://github.com/duongdev/phosphor-react-native)). It draws through `react-native-svg`, whose platforms are `android, ios, macos, web, tvos` ([expo svg](https://docs.expo.dev/versions/v57.0.0/sdk/svg.md)); SDK pin 15.15.4. The package page makes no explicit platform statement, so "renders identically on Android" is **Unverified until the Android spike**, though it has no native code of its own. |
| SF Symbols | **Not used.** `expo-symbols` renders SF Symbols on iOS and Material Symbols on Android, and a plain string name "renders only on iOS" ([symbols](https://docs.expo.dev/versions/v57.0.0/sdk/symbols.md)). If ever needed (for example a native menu item icon), only inside a `platform/` wrapper with `{ ios, android }` names. Template files using `SymbolView` (`collapsible.tsx`, `explore.tsx`, `app-tabs.web.tsx`) are deleted with the template. | |
| Haptics | `expo-haptics` ~57.0.3 behind `haptic()` | Both. Note: expo-haptics adds the Android `VIBRATE` permission automatically even though `performAndroidHapticsAsync` does not need it ([haptics](https://docs.expo.dev/versions/v57.0.0/sdk/haptics.md)); removing it via app config is **Unverified**, check at Android setup. |
| Native controls | `@expo/ui` ~57.0.21, only inside `platform/` | Both, two APIs (section 3.1). |
| Audio | `expo-audio` ~57.0.5 | Metering on Android to be confirmed in the audio spike (MOTION open question 2). |
| Blur | `expo-blur` ~57.0.3, iOS only via `BlurSurface` | "stable on Android, but some code changes are required" ([blur-view](https://docs.expo.dev/versions/v57.0.0/sdk/blur-view.md)); we skip it on Android. |
| Class utilities | `class-variance-authority`, `clsx`, `tailwind-merge`, `@rn-primitives/portal` | Platform-neutral JS ([RNR manual install](https://reactnativereusables.com/docs/installation/manual)). |
| Web | Next.js + Tailwind v4 + shadcn/ui + `@phosphor-icons/react`; web animation library **Unverified**, choose later | [ui.shadcn.com/docs](https://ui.shadcn.com/docs) |

## 7. How mobile and web share one design language (and iOS and Android share everything)

```
packages/design-tokens/
  src/tokens.ts          ← designer fills values (contract names below)
  scripts/build-css.ts   ← generates dist/tokens.css (Tailwind v4 @theme + light/dark)
  dist/tokens.css        ← imported by apps/ios/src/global.css AND apps/web/app/globals.css
packages/ui-contract/    ← (optional later) shared TS prop types: ButtonVariant, ChipTone...
apps/ios/src/components/ui/*.tsx   ← RNR copies, edited
apps/web/components/ui/*.tsx       ← shadcn copies, edited to same variant names
```

**How each token maps to a Tailwind class (same on both platforms):**

| Token | CSS variable | Class examples |
|---|---|---|
| colors `bg, surface, surfaceRaised, text, textMuted, accent, accentSoft, onAccent, line, focus, recording, success, caution` | `--color-bg`, `--color-surface`, `--color-surface-raised`, `--color-text`, `--color-text-muted`, `--color-accent`, `--color-accent-soft`, `--color-on-accent`, `--color-line`, `--color-focus`, `--color-recording`, `--color-success`, `--color-caution` | `bg-bg`, `bg-surface-raised`, `text-text`, `text-text-muted`, `bg-accent`, `text-on-accent`, `border-line` |
| `space.0..12` (4pt) | Tailwind v4 `--spacing: 4px` | `p-4` = 16pt, `gap-3` = 12pt |
| `radius.sm/md/lg/xl/pill` | `--radius-sm` ... `--radius-pill` | `rounded-lg`, `rounded-pill` |
| type styles | `--text-body`, `--text-body--line-height`, ... plus `--font-letter` | `text-body`, `text-letter-body`, `font-letter` |
| `elevation.0..3` | `--shadow-e1..3` (web); on iOS and Android read from `tokens.ts` directly (`boxShadow` style; Android rendering to be checked in Step 0b) | `shadow-e2` |
| `motion.snappy/standard/gentle` | **JS only**: `tokens.motion.*` (spring configs) for Reanimated; web gets `--ease-*`/`--duration-*` | `withSpring(x, motion.gentle)` |

`text-text` reads awkwardly, but it follows the token contract, and the RNR `Text` component hides it. Do not rename tokens per platform.

**Generated `tokens.css` shape** (values come from `tokens.ts`, never typed by hand):
```css
@theme {
  --spacing: 4px;
  --radius-sm: ...; --radius-pill: 999px;
  --text-body: 17px; --text-body--line-height: 22px;
  --font-letter: "...";
}
@layer theme {
  :root {
    @variant light { --color-bg: ...; --color-text: ...; /* all 13 */ }
    @variant dark  { --color-bg: ...; --color-text: ...; }
  }
}
```
Web uses the same file. In Next.js, `@variant light/dark` must be expressed as `:root` plus `.dark` (shadcn convention). The generator emits two flavours, `tokens.native.css` and `tokens.web.css`, from one source, so no value is ever typed twice.

**Dynamic Type:** Tailwind font sizes are fixed points, and Uniwind has no `rem` ([class-names](https://docs.uniwind.dev/class-names.md)). RN `Text` still scales with the system text size unless `allowFontScaling={false}`. Our `Text` component sets `maxFontSizeMultiplier` per style (letters up to 2.0, chrome up to 1.5) and never disables scaling.

## 8. Installation plan (do not run yet; run in `apps/ios`)

**Step 0: Day-1 spike (half a day, iOS).** On a dev build on a real iPhone, prove: Uniwind free tier + Reanimated 4.5.1 + Expo Router form sheet + one Expo UI `Host` render together on SDK 57 with the React Compiler on. If Uniwind fails, fall back to NativeWind 4.2.7. Only config changes.

**Step 0b: Android smoke test (when Android starts, half a day).** Dev build on a mid-tier Android phone: the same four, plus the Compose `Switch` and `SegmentedButton` wrappers, `formSheet` with 2 detents and keyboard, Phosphor icons, `performAndroidHapticsAsync`, expo-audio metering, TalkBack on LetterCard, font size at maximum, and animator scale 0 (Reduce Motion path, MOTION section 4).

```bash
# 1. Styling engine + utilities
npx expo install uniwind tailwindcss class-variance-authority clsx tailwind-merge
npx expo install @rn-primitives/portal @rn-primitives/slot react-native-svg phosphor-react-native

# 2. Platform companions (SDK-pinned; reanimated/worklets/gesture-handler/screens/@expo/ui already present)
npx expo install expo-haptics expo-audio @shopify/flash-list expo-blur

# 3. Components (CLI copies files into src/components/ui; pick the Uniwind flavour)
npx @react-native-reusables/cli@latest init
npx @react-native-reusables/cli@latest add button text card input textarea toggle dialog alert-dialog avatar separator
npx @react-native-reusables/cli@latest doctor
```
RNR's CLI copies components that import Lucide (its `icon.tsx` types are `LucideIcon`, and `checkbox.tsx` imports `Check` from `lucide-react-native`: [icon.tsx](https://raw.githubusercontent.com/founded-labs/react-native-reusables/main/packages/registry/src/uniwind/components/ui/icon.tsx), [checkbox.tsx](https://raw.githubusercontent.com/founded-labs/react-native-reusables/main/packages/registry/src/uniwind/components/ui/checkbox.tsx)); replace those imports with our `Icon` when editing each copy. `expo-linear-gradient` is dropped: the glow is a pre-rendered radial PNG (MOTION 5b).

**`apps/ios/metro.config.js`** (Uniwind outermost, per [quickstart](https://docs.uniwind.dev/quickstart.md)):
```js
const { getDefaultConfig } = require('expo/metro-config');
const { withUniwindConfig } = require('uniwind/metro');
const config = getDefaultConfig(__dirname);
module.exports = withUniwindConfig(config, {
  cssEntryFile: './src/global.css',
  dtsFile: './src/uniwind-types.d.ts',
});
```

**`apps/ios/src/global.css`**:
```css
@import 'tailwindcss';
@import 'uniwind';
@import '../../../packages/design-tokens/dist/tokens.native.css';
@source '../../../packages';
```
Uniwind requires `@source` for files outside the CSS file's folder ([monorepos](https://docs.uniwind.dev/monorepos.md)).

**`apps/ios/components.json`**: shadcn format ([customization](https://reactnativereusables.com/docs/customization)). Aliases `@/components`, `@/lib/utils`. Add `PortalHost` in `src/app/_layout.tsx`.

**Folder name:** `apps/ios` will build Android too. Renaming it to `apps/mobile` before Android work starts is recommended **(opinion)**; it is a separate `chore/` PR.

**Clean-up:** delete template `constants/theme.ts`, `themed-text.tsx`, `themed-view.tsx`, `collapsible.tsx` and `explore.tsx` once `Text` and `Card` exist.

**Web (later):** `npx shadcn@latest init`, import `tokens.web.css`, add components, rename variants to match mobile.

## 9. Risks

| Risk | Likelihood / impact | Mitigation |
|---|---|---|
| Uniwind free has no `group-*` variants | Certain / low | Button reads `pressed` from `Pressable`; lint bans `group-` in `apps/ios`. |
| Uniwind (1.x, one vendor) loses momentum | Low to med / med | Standard Tailwind classes; NativeWind v5 is a config swap. |
| RNR defaults are web-sized (h-10 = 40pt) | Certain / med | Edit every copy to `COMPONENTS.md` (min 44pt) before use. |
| **Android wrapper files never get written, and iOS-only imports leak into screens** | Med / high | Lint ban (section 5); every `platform/` component ships a `.tsx` fallback so Android builds before its `.android.tsx` exists; the story screen shows each wrapper on both platforms. |
| **Compose controls look Material, not like our brand** | Certain / low | Accepted: native chrome per MOTION principle 6. Colour them from tokens; our own surfaces stay identical. |
| Expo UI `Host` sizing quirks (`matchContents` vs `flex: 1`) | Med / low | Wrap once per control; segmented and labelled switch rows need a sized host (per the docs examples). |
| Android `formSheet`: max 3 detents, no header, no grabber | Certain / low | `sheetScreenOptions()` enforces it; titles always in `SheetBody`. |
| `Alert.alert` on Android ignores destructive style | Certain / low | Destructive labels are explicit verbs; colour never the only signal. |
| Reanimated / gesture-handler past SDK pin | Med / high | `npx expo install --check` in CI. |
| RN and web copies drift | Med / med | Shared prop types; parity header in each file. |
| expo-audio metering differs on Android | Med / low | MOTION 5b fallback (idle breath); confirm in Step 0b. |
