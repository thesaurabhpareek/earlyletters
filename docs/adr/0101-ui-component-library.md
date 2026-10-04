# ADR 0101: UI component library and styling model

- **Status:** Accepted, 2026-10-01. **Revised Oct 1 2026** (see below). **Amended Oct 3 2026** (sheets, see below). Conditional on the Day-1 spike in `docs/design/COMPONENT_LIBRARY.md` section 8.

> **Amended Oct 3 2026: `@gorhom/bottom-sheet` is adopted for sheets** (founder decision 2 of 3 Oct 2026, `docs/agents/BRIEF-2026-10-03.md`: motion and components come from high-quality libraries, naming Reanimated, Gesture Handler and @gorhom/bottom-sheet). This supersedes Decision item 4 below ("No `@gorhom/bottom-sheet`").
> - In-app sheets are `components/ui/sheet.tsx` (first user: Reading size; the other small sheets move to it as they are touched), built on `@gorhom/bottom-sheet` 5.2.14 (MIT, no native code, about 18.6 KB gzip) `BottomSheetModal` with Gesture Handler and Reanimated. `UIProvider` (`components/ui/provider.tsx`) mounts `GestureHandlerRootView` and `BottomSheetModalProvider` once at the root (`src/app/_layout.tsx`).
> - Route-level sheets (sign-in, invites) stay Expo Router modals or `formSheet` screens; a screen-sized task is a route, a small choice over the current screen is a Sheet.
> - The library's accessibility defaults are overridden in `ui/sheet.tsx` (no "adjustable" container, no English placeholder labels, `accessibilityViewIsModal`, escape gesture, visible Close, focus to the title) and Reduce Motion uses a 200 ms timing instead of the spring.
> - Native alternative kept on record: `@expo/ui/community/bottom-sheet` is API-compatible (SwiftUI sheet on iOS); swapping is one import in `ui/sheet.tsx` if a device test prefers the system sheet. Evidence and size: `docs/design/COMPONENT_LIBRARY.md` section 0.1.
> - Icons: Phosphor is imported per icon (`phosphor-react-native/src/icons/<Name>`), never from the package root, which pulls every icon into the bundle (about 5.5 MB of JS; measured with `scripts/size/measure.ts` on 3 Oct 2026).

> **Revised Oct 1 2026: Apple first now, Android later; every component and pattern must work on both.**
> Re-scored with Android parity as the heaviest criterion (20/100). **The base decision stands:** RNR + Uniwind still ranks first (91), ahead of RNR + NativeWind 4 (87) and gluestack v5 (84). RNR's component files branch only on web vs native, and Uniwind documents iOS, Android and web with `ios:`/`android:` selectors.
> What changed:
> 1. **Platform-native pieces sit behind our own names** in `src/components/platform/` as `.ios.tsx` / `.android.tsx` / `.tsx` (fallback) files; a lint rule bans `@expo/ui/swift-ui`, `@expo/ui/jetpack-compose`, `expo-symbols`, `expo-blur` and `expo-haptics` elsewhere. Wrappers: `toggle` (SwiftUI Toggle / Compose Switch), `segmented-control` (SwiftUI segmented Picker / Compose SegmentedButton row), `action-menu` (SwiftUI ContextMenu / Sheet list), `sheet-options` (formSheet with iOS grabber / Android max 3 detents, title in body), `blur-surface` (expo-blur / solid surface), `lib/haptics` (expo-haptics iOS calls / `performAndroidHapticsAsync`).
> 2. Expo UI provides both SwiftUI and Jetpack Compose, but as separate 1:1 APIs; its universal layer has a Switch without colour props and no segmented control, so two files per control.
> 3. `confirm()` moves from Expo UI SwiftUI Alert/ConfirmationDialog to React Native `Alert.alert` (native on both; Android ignores destructive style, max 3 buttons).
> 4. Icons: **Phosphor** (`phosphor-react-native` + `react-native-svg`, MIT), replacing Lucide, matching DESIGN_LANGUAGE. **No SF Symbols in v1**; native tab icons use `src` PNGs on both platforms.
> 5. Motion follows `MOTION.md`: Reanimated only, `useMotion()` for Reduce Motion, measured-rect transitions instead of shared elements, no Lottie or Rive in v1. EditUnderline expands inline (Expo UI Popover dropped).
- **Deciders:** founder; design systems; product design (owns token values).
- **Related:** `docs/design/COMPONENT_LIBRARY.md` (evidence, scores, install plan), `docs/design/COMPONENTS.md` (specs), `packages/design-tokens/src/tokens.ts`.

## Context

Early Letters is an iOS-first app, with Android later from the same codebase (Expo SDK 57, React Native 0.86, Expo Router, TypeScript, New Architecture always on). A web app (landing page, waitlist, browser book reader) comes later in the same npm-workspaces monorepo. The founder is a non-engineer who builds through Claude Code. That means:

1. Component code must be readable and live in our repo, so an AI assistant can open and edit it. A black-box package does not meet this.
2. Styling should work the same way on mobile and web, so the founder learns one system.
3. The product is emotional (parents' letters, voices). iOS polish matters more than component count: native sheets, haptics, Dynamic Type, VoiceOver.
4. A parallel designer owns token values. We own names and how components use them.

The founder named MUI, Mantine, Ant Design and shadcn/ui. Their docs show all four are web-only for our purposes. `antd` targets web applications; `@ant-design/react-native` is a separate, Material-adjacent package whose last stable release was 2025-08.

## Decision

1. **Mobile components:** React Native Reusables (RNR). Components are copied into `apps/ios/src/components/ui` by its CLI, built on `@rn-primitives`, and then owned and edited by us.
2. **Mobile styling:** Uniwind (Tailwind CSS v4 for React Native). NativeWind 4.2.7 is the named fallback if the spike fails.
3. **Native controls:** `@expo/ui` for Toggle, SegmentedControl and the letter long-press menu: SwiftUI on iOS now, Jetpack Compose (or our Sheet) on Android later, each behind our own component name with `.ios.tsx` / `.android.tsx` files. Confirms use RN `Alert.alert`.
4. **Sheets:** Expo Router `presentation: 'formSheet'` (native iOS sheet; platform bottom sheet on Android, max 3 detents) behind `sheetScreenOptions()`. No `@gorhom/bottom-sheet`. *(Superseded Oct 3 2026 for in-app sheets: `@gorhom/bottom-sheet` behind `ui/sheet.tsx`; see the amendment at the top.)*
5. **Companions:** Reanimated 4 and Gesture Handler at SDK pins (motion per `MOTION.md`), FlashList, haptics (five named intents, iOS and Android mappings), expo-audio, Phosphor icons (`phosphor-react-native` / `@phosphor-icons/react`). No SF Symbols, Lottie or Rive in v1.
6. **Web (later):** Next.js + Tailwind v4 + shadcn/ui, with component and variant names identical to mobile.
7. **Tokens:** `packages/design-tokens/src/tokens.ts` is the single source. A build script emits `tokens.native.css` (Uniwind `@theme` + `@variant light/dark`) and `tokens.web.css` (shadcn `:root`/`.dark`). Motion and elevation are also exported as TypeScript for Reanimated and iOS shadows.

## Consequences

**Positive**
- Every component is a plain `.tsx` file in our repo; Claude Code can read and change it directly. No upstream overrides.
- One class vocabulary (`bg-surface`, `text-text-muted`, `rounded-lg`, `p-4`) on iOS and web; shadcn and RNR share structure (`cva` variants, `cn()` helper).
- Native where users notice, on each platform: sheets, switches, segmented controls and alerts are UIKit/SwiftUI on iOS and Compose/Material on Android.
- Android needs only six small platform files plus device QA; every other component is the same code.
- No Material look, no theme provider maze, small runtime.

**Negative / costs**
- We maintain our components; no upstream fixes "for free" after copying. Acceptable, because the set is about 22 components.
- RNR defaults are web-sized and must be edited (44pt targets, iOS type ramp) before use.
- Uniwind free tier has no `group-*` variants. Pressed-state styling of children uses `Pressable` render props instead.
- Uniwind is 1.x and mainly one vendor; swapping to NativeWind v5 later is a config change plus a regression pass.
- Two copies of each component (RN and web) can drift. We use shared prop types and a parity checklist.
- Expo UI components need a `Host` wrapper and per-platform colour APIs (`tint()` modifier vs `colors` prop); we wrap each once per platform.
- Android controls look Material, not identical to iOS. Accepted: native chrome, our own surfaces (MOTION principle 6).
- Each `.ios.tsx` needs an `.android.tsx` before Android ships; the `.tsx` fallback keeps Android building meanwhile.

## Alternatives considered

| Option | Why not |
|---|---|
| MUI / Mantine / Ant Design (web) | Do not run in React Native. MUI or Mantine could serve the web app, but would split the styling model from mobile. shadcn keeps one model. |
| `@ant-design/react-native` | Packaged black box, enterprise and Material-adjacent look, last stable release 2025-08. |
| HeroUI Native | Polished, Uniwind-based, Apache-2.0, but installed as an npm dependency (not owned source), and it requires `@gorhom/bottom-sheet`. Good second choice. |
| gluestack-ui v5 | Copy-paste and universal, close runner-up. Heavier component internals, and its web story is tied to its own patterns rather than shadcn. |
| Tamagui | Strong performance, but its own styling model and compiler are hard for a non-engineer and an AI assistant to work with. |
| React Native Paper | Best Android parity, but Material Design; wrong feel for an iOS-first product. |
| Expo UI only (SwiftUI + Compose) | Best native fidelity, but two different APIs per control, a thin universal layer, no expressive custom components and no class-based theming. Used as a wrapped supplement. |
| Expo UI universal `Switch` / `Picker` | Single file, but no colour prop on Switch and no segmented Picker. Two small platform files are clearer. |
| Unistyles + hand-built | Fast and owned, but no component starting point and no shared styling with the web. |
| NativeWind 4 instead of Uniwind | Tailwind v3 differs from web/shadcn (v4). Kept as the fallback. |
