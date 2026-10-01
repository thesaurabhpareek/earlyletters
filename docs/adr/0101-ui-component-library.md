# ADR 0101: UI component library and styling model

- **Status:** Accepted, 2026-10-01. Conditional on the Day-1 spike in `docs/design/COMPONENT_LIBRARY.md` section 7.
- **Deciders:** founder; design systems; product design (owns token values).
- **Related:** `docs/design/COMPONENT_LIBRARY.md` (evidence, scores, install plan), `docs/design/COMPONENTS.md` (specs), `packages/design-tokens/src/tokens.ts`.

## Context

Early Letters is an iOS-first app (Expo SDK 57, React Native 0.86, Expo Router, TypeScript, New Architecture always on). A web app (landing page, waitlist, browser book reader) comes later in the same npm-workspaces monorepo. The founder is a non-engineer who builds through Claude Code. That means:

1. Component code must be readable and live in our repo, so an AI assistant can open and edit it. A black-box package does not meet this.
2. Styling should work the same way on mobile and web, so the founder learns one system.
3. The product is emotional (parents' letters, voices). iOS polish matters more than component count: native sheets, haptics, Dynamic Type, VoiceOver.
4. A parallel designer owns token values. We own names and how components use them.

The founder named MUI, Mantine, Ant Design and shadcn/ui. Their docs show all four are web-only for our purposes. `antd` targets web applications; `@ant-design/react-native` is a separate, Material-adjacent package whose last stable release was 2025-08.

## Decision

1. **Mobile components:** React Native Reusables (RNR). Components are copied into `apps/ios/src/components/ui` by its CLI, built on `@rn-primitives`, and then owned and edited by us.
2. **Mobile styling:** Uniwind (Tailwind CSS v4 for React Native). NativeWind 4.2.7 is the named fallback if the spike fails.
3. **Native controls:** `@expo/ui` SwiftUI wrappers for Toggle, SegmentedControl, Alert/ConfirmationDialog, ContextMenu. Each sits behind our own component API.
4. **Sheets:** Expo Router `presentation: 'formSheet'` (native iOS sheet). No `@gorhom/bottom-sheet` unless a non-modal in-screen sheet is needed.
5. **Companions:** Reanimated 4 and Gesture Handler at SDK pins, FlashList, expo-haptics (five named intents), expo-audio, Lucide icons (`lucide-react-native` / `lucide-react`).
6. **Web (later):** Next.js + Tailwind v4 + shadcn/ui, with component and variant names identical to mobile.
7. **Tokens:** `packages/design-tokens/src/tokens.ts` is the single source. A build script emits `tokens.native.css` (Uniwind `@theme` + `@variant light/dark`) and `tokens.web.css` (shadcn `:root`/`.dark`). Motion and elevation are also exported as TypeScript for Reanimated and iOS shadows.

## Consequences

**Positive**
- Every component is a plain `.tsx` file in our repo; Claude Code can read and change it directly. No upstream overrides.
- One class vocabulary (`bg-surface`, `text-text-muted`, `rounded-lg`, `p-4`) on iOS and web; shadcn and RNR share structure (`cva` variants, `cn()` helper).
- iOS-native where users notice: sheets, switches, segmented controls and alerts are real UIKit/SwiftUI.
- No Material look, no theme provider maze, small runtime.

**Negative / costs**
- We maintain our components; no upstream fixes "for free" after copying. Acceptable, because the set is about 22 components.
- RNR defaults are web-sized and must be edited (44pt targets, iOS type ramp) before use.
- Uniwind free tier has no `group-*` variants. Pressed-state styling of children uses `Pressable` render props instead.
- Uniwind is 1.x and mainly one vendor; swapping to NativeWind v5 later is a config change plus a regression pass.
- Two copies of each component (RN and web) can drift. We use shared prop types and a parity checklist.
- Expo UI components need a `Host` wrapper and per-prop colours; we wrap them once.

## Alternatives considered

| Option | Why not |
|---|---|
| MUI / Mantine / Ant Design (web) | Do not run in React Native. MUI or Mantine could serve the web app, but would split the styling model from mobile. shadcn keeps one model. |
| `@ant-design/react-native` | Packaged black box, enterprise and Material-adjacent look, last stable release 2025-08. |
| HeroUI Native | Polished, Uniwind-based, Apache-2.0, but installed as an npm dependency (not owned source), and it requires `@gorhom/bottom-sheet`. Good second choice. |
| gluestack-ui v5 | Copy-paste and universal, close runner-up. Heavier component internals, and its web story is tied to its own patterns rather than shadcn. |
| Tamagui | Strong performance, but its own styling model and compiler are hard for a non-engineer and an AI assistant to work with. |
| React Native Paper | Material Design; wrong feel for an iOS-first product. |
| Expo UI (SwiftUI) only | Best iOS fidelity, but no expressive custom components, a weak web story and no class-based theming. Used as a supplement instead. |
| Unistyles + hand-built | Fast and owned, but no component starting point and no shared styling with the web. |
| NativeWind 4 instead of Uniwind | Tailwind v3 differs from web/shadcn (v4). Kept as the fallback. |
