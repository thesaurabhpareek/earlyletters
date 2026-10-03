# Early Letters component inventory and specs

Library decision: `COMPONENT_LIBRARY.md` and ADR 0101 (revised Oct 1 2026: Apple first, Android later, one codebase). Mobile: RNR copies + Uniwind + Expo UI (SwiftUI on iOS, Jetpack Compose on Android, only behind `platform/` wrappers) + Expo Router sheets + Phosphor icons. Web: shadcn/ui with the same names. Motion: `MOTION.md` is the source; this file only says which MOTION rule each component uses.
Location: `apps/ios/src/components/ui/<kebab-name>.tsx` (primitives), `apps/ios/src/components/letters/<kebab-name>.tsx` (product components), `apps/ios/src/components/platform/<kebab-name>.{ios,android}.tsx` + `<kebab-name>.tsx` fallback (the only place platform libraries may be imported; see COMPONENT_LIBRARY section 5).
Every spec ends with an **Android later** line: what changes when Android ships. "Same code" means no Android file is needed; only device QA (TalkBack, font size, animator scale 0).
Tokens are referenced by contract name only. Values belong to the designer in `packages/design-tokens/src/tokens.ts`.

---

## 0. Shared rules (apply to every component)

### 0.1 Accessibility baseline
- **Targets:** every tappable thing is at least 44×44pt. If the visual is smaller, use `hitSlop` to reach 44.
- **Roles:** use RN `role` (or `accessibilityRole`): `button`, `link`, `header`, `switch`, `adjustable`, `tab`, `image`, `text`, `alert`.
- **Labels** describe the thing ("Speak a note"); **hints** describe the result ("Starts recording"). Hints are optional and never repeat the label.
- **Dynamic Type:** never set `allowFontScaling={false}`. Each type style has a `maxFontSizeMultiplier` (chrome 1.5, reading text 2.0). Layouts must reflow at AX5: rows stack, nothing truncates silently, and buttons grow taller instead of clipping. Android: the same props apply to the system font size; check at maximum size on device.
- **Reduce Motion:** never read the setting directly. Use `useMotion()` → `{ reduced, spring(token), fade() }` (MOTION section 4). Movement keeps `ReduceMotion.System`; the fallback is a paired 200ms opacity fade (`motion.fadeMs`), not a jump. Android: animator scale 0 reports reduced.
- **Reduce Transparency / Increase Contrast:** `BlurSurface` falls back to `surfaceRaised`; `line` gets thicker. Android never blurs.
- **Focus:** `focus` colour ring (2pt) for keyboard and Switch Control on iOS, keyboard / switch access on Android, and `focus-visible` on web.
- **Screen readers:** specs say VoiceOver; every one also applies to TalkBack.
- **Colour is never the only signal.** Recording uses a label and a shape as well as `recording` red.

### 0.2 Haptics: five intents only (`lib/haptics.ios.ts` / `lib/haptics.android.ts` / `lib/haptics.ts` no-op)
Mapping follows MOTION section 6.
| Intent | iOS (`expo-haptics`) | Android (`performAndroidHapticsAsync`) | Used for |
|---|---|---|---|
| `tap` | `selectionAsync()` | `Segment_Tick` | Chip toggle, Put it back, Reading Size, speed, pause/resume |
| `press` | `impactAsync(Light)` | `Context_Click` | Record start/stop, Speak/Type |
| `soft` | `impactAsync(Soft)` | `Long_Press` | Letter long-press menu, "Not much today" |
| `success` | `notificationAsync(Success)` | `Confirm` | Letter saved |
| `warning` | `notificationAsync(Warning)` | `Reject` | Destructive confirm shown, discard confirmed |
None on playback, highlight, milestones, tabs, sheets opening, scroll, or keystrokes; never more than once in 100ms. A haptic always accompanies a visible change (iOS mutes it in Low Power Mode and while recording, MOTION section 6).

### 0.3 Motion (from MOTION.md)
- Springs `motion.snappy` / `standard` / `gentle` (DESIGN_LANGUAGE section 8), plus proposed `fadeMs` 200, `enter` (opacity 0→1, y 8→0, 280ms), `staggerMs` 30 (max 6), `sequenceMaxMs` 900, `newMarkMs` 1600 (MOTION section 3). Same values on Android.
- Press feedback for all pressables: scale 0.97, opacity 0.9 on `snappy`; release springs back. Interruptible: springs start from the current value.
- **Controls never animate in** (MOTION principle 2): buttons are opaque and hittable from the first frame.
- **Saves are instant; animation is the receipt** (principle 3): commit, haptic, then animate.
- Animate only `transform` and `opacity` (exceptions: highlight wash width, transitioning card radius). Never font size, shadows, Android `elevation`, blur.
- **No Lottie or Rive in v1.** Line drawings use `react-native-svg` `strokeDashoffset`.
- Native chrome (tabs, sheets, alerts, push/back, Android predictive back) keeps platform motion; we never re-create it.

### 0.4 Shared types (`packages/ui-contract` later; inline for now)
```ts
type Tone = 'neutral' | 'accent' | 'success' | 'caution' | 'recording';
type TypeStyle = 'display'|'title1'|'title2'|'headline'|'body'|'callout'|'subhead'|'footnote'|'caption'|'letterBody'|'letterDateline';
type Elevation = 0 | 1 | 2 | 3;
type HapticIntent = 'tap' | 'press' | 'soft' | 'success' | 'warning';
type IconName = keyof typeof import('phosphor-react-native');   // Phosphor glyph, rendered through our Icon (weights per DESIGN_LANGUAGE 7)
type Author = { id: string; displayName: string; relation: string; signature: string; avatarUrl?: string }; // signature e.g. "From Papa"
```

### 0.5 Web parity rule
Each component file starts with a header comment: `// web: apps/web/components/ui/<name>.tsx, props parity: yes|partial (<diff>)` and `// android: same | platform/<name>.android.tsx`. Variant names never differ between platforms.

---

## 1. Benchmark: Airbnb polish → our inventory

Airbnb's public material on its Design Language System (DLS) describes one shared component set across platforms. The specifics below come from observing the shipping app; they are **design observations, not sourced claims**.

| Airbnb pattern | What makes it feel polished | Our component |
|---|---|---|
| Listing **cards** | Image first, generous radius, no borders, metadata in two muted lines, whole card is one tap target, light press scale | **Card**, **LetterCard** (photo or excerpt first, signature second, date third) |
| **Image carousel** in cards | Paging with small dots, swipe does not trigger the card tap, aspect ratio locked so the feed never jumps | **PhotoFrame** (`aspect` locked, multi-photo paging with dots) |
| **Sheets** (filters, details) | Native detents, grabber, content scrolls inside the sheet, background dims progressively | **Sheet** (Expo Router form sheet with detents; Android bottom sheet) |
| **Chips** (categories, filters) | Horizontally scrolling pills, selected = filled ink, haptic tick, icon + label | **Chip** (month filters, author filters, tags) |
| **Sticky CTA** (Reserve bar) | Bottom bar that stays above safe area, price on left, one strong button on right, hairline top border | **CaptureBar** (Speak / Type equal weight, "Not much today" quiet) and `StickyFooter` slot in **Sheet** |
| **Section headers** with large type | Calm hierarchy, lots of whitespace | **MonthChapterHeader** |
| **Wishlist heart** micro-interaction | Instant optimistic toggle, small spring, undo via toast | **IconButton** + **Toast (undo)** |
| Listing open | Card grows into the detail screen | **LetterCard** measured-rect open (MOTION 5f) |
| **Skeletons** while loading | Shapes match final layout, no spinners in feeds | `loading` state on Card / LetterCard / PhotoFrame |

---

## 2. Component specs

Format per component: purpose · variants · props · states · accessibility · haptics · motion · builds on.

### 2.1 Button
- **Purpose:** the main way to act. One `primary` per screen at most.
- **Variants:** `primary` (accent fill, `onAccent` text), `secondary` (`surfaceRaised` fill, `text`), `quiet` (no fill, `accent` text, for "Not much today" or "Skip"), `destructive` (`caution` text on `surface`; fills only inside a confirm Dialog). Sizes: `md` (48pt), `lg` (56pt, CTAs).
```ts
type ButtonProps = {
  variant?: 'primary' | 'secondary' | 'quiet' | 'destructive';
  size?: 'md' | 'lg';
  label: string;
  leadingIcon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  haptic?: HapticIntent | false;          // default 'press' for primary, 'tap' otherwise
  onPress: () => void;
  accessibilityHint?: string;
  testID?: string;
};
```
- **States:** default, pressed, disabled (40% opacity, still announced), loading (spinner replaces icon, label stays for VoiceOver, `aria-busy`), focus-visible.
- **A11y:** `role="button"`, label = `label`, `accessibilityState={{ disabled, busy: loading }}`. Min height 48 (above 44). Label wraps to 2 lines at large Dynamic Type sizes, never truncates.
- **Haptics:** as above; fires on press-in, not release.
- **Motion:** press scale on `snappy`; loading cross-fade on `standard`.
- **Builds on:** RNR `button.tsx` (rewrite `group-active` to the Pressable `pressed` render prop). Web: shadcn `Button`, variants renamed `default→primary`, `ghost→quiet`.
- **Android later:** same code. Our pill and press scale, not Material ripple (one brand feel, MOTION section 3). `haptic` maps through 0.2.

### 2.2 IconButton
- **Purpose:** icon-only action (close, more, play, heart).
- **Variants:** `plain`, `tinted` (`accentSoft` circle), `filled` (accent circle). Sizes `sm` (visual 32, hit 44), `md` (44), `lg` (64, for transport controls).
```ts
type IconButtonProps = {
  icon: IconName; label: string;            // label required: VoiceOver text
  variant?: 'plain' | 'tinted' | 'filled';
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;                         // toggle buttons (heart, favourite)
  disabled?: boolean; haptic?: HapticIntent | false;
  onPress: () => void;
};
```
- **States:** default, pressed, selected (icon filled, `accessibilityState.selected`), disabled.
- **A11y:** `role="button"`; `label` is mandatory at the type level; `hitSlop` brings `sm` to 44.
- **Haptics:** `tap`; toggles fire `tap` on both directions.
- **Motion:** selected toggle springs the icon 1→1.15→1 on `snappy`.
- **Builds on:** RNR `button` (size `icon`), Phosphor via our `Icon`. Web: shadcn `Button size="icon"`.
- **Android later:** same code. Phosphor renders through `react-native-svg` on Android; confirm in the Android smoke test.

### 2.3 Text
- **Purpose:** the only way text is rendered. It maps one to one to the type styles.
```ts
type TextProps = RNTextProps & {
  variant?: TypeStyle;                         // default 'body'
  tone?: 'default' | 'muted' | 'accent' | 'onAccent' | 'caution' | 'success';
  weight?: 'regular' | 'medium' | 'semibold';  // only where the style allows
  asHeading?: 1 | 2 | 3;                       // sets role="header"
  selectable?: boolean;                        // true for letterBody
};
```
- **Mapping:** `display/title1/title2` → heading roles when `asHeading` is set. `letterBody` uses `font-letter` with a generous line height. `letterDateline` uses small caps-like tracking and the `textMuted` tone. `maxFontSizeMultiplier`: 2.0 for `letterBody`/`body`/`callout`, 1.5 for others, 1.3 for `display`.
- **States:** none. **Haptics:** none. **Motion:** none.
- **A11y:** never truncate `letterBody`; `numberOfLines` is allowed only for previews and must have a full-text `accessibilityLabel`.
- **Builds on:** RNR `text.tsx` (`TextClassContext` kept; variants replaced with our 11 styles). Web: a `Text` component that renders `p`/`h1..h3`/`span` with the same variant classes.
- **Android later:** same code. Bundle Mukta, Literata and Tiro as app fonts (no system fallback differences); check Devanagari matras and line height on Android, and the 1.08x Tiro factor.

### 2.4 Card
- **Purpose:** a generic container for grouped content and settings blocks.
- **Variants:** `flat` (elevation 0, `surface`), `raised` (elevation 1, `surfaceRaised`), `outlined` (`line` hairline).
```ts
type CardProps = ViewProps & {
  variant?: 'flat' | 'raised' | 'outlined';
  padding?: 0 | 3 | 4 | 5 | 6;                 // space scale
  onPress?: () => void;                        // makes the whole card one button
  accessibilityLabel?: string;                 // required when onPress is set
  loading?: boolean;                           // skeleton shimmer
};
```
- **States:** default, pressed (if pressable), loading.
- **A11y:** if pressable: `role="button"`, children are grouped (`accessible`) with one label. Otherwise children are read separately.
- **Haptics:** none by default. **Motion:** press scale 0.98 on `snappy`; skeleton pulse on `gentle` (off with Reduce Motion; counts as the one loop on screen, MOTION section 7).
- **Builds on:** RNR `card.tsx`. Web: shadcn `Card`.
- **Android later:** same code. Shadows: elevation from `tokens.ts` as `boxShadow`; verify Android rendering; never animate shadow or `elevation`. Dark mode already uses border, not shadow.

### 2.5 LetterCard
- **Purpose:** the main object in the memory book: one note or letter in the feed.
- **Variants:** `note` (short, excerpt only), `letter` (title line + 3-line excerpt), `withPhoto` (PhotoFrame on top), `withAudio` (small waveform glyph + duration), `draft` (dashed `line` border, "Draft" caption), `pendingApproval` (family letter awaiting parent approval: `caution` dot + "Waiting for you").
```ts
type LetterCardProps = {
  id: string;
  kind: 'note' | 'letter';
  excerpt: string;
  title?: string;
  author: Author;                              // renders Signature
  createdAt: Date; childAgeLabel: string;      // "4 months, 2 weeks"
  photo?: { uri: string; blurhash?: string; aspect?: number };
  audio?: { durationSec: number };
  status?: 'saved' | 'draft' | 'pendingApproval' | 'syncing';
  onPress: (id: string) => void;
  onLongPress?: (id: string) => void;          // opens ContextMenu (share, edit, delete)
};
```
- **States:** default, pressed, syncing (small progress glyph, no layout shift), draft, pendingApproval, loading skeleton.
- **A11y:** one element, `role="button"`, label composed as "Letter from Papa, 4 months 2 weeks. 'Today you laughed at...'. Has voice recording, 1 minute 12." Hint: "Opens the letter." Long-press exposed as `accessibilityActions` [`share`, `edit`, `delete`] so VoiceOver users can reach them without a long-press.
- **Haptics:** `soft` on long-press menu open.
- **Motion:** press scale 0.98 (`snappy`). Open: **measured-rect transition** (MOTION 5f): measure the card on the UI thread, push a `transparentModal` with `animation: 'none'`, animate translate + scale and radius `md`→0 on `standard`, content fades in from 60%; dismiss reverses or fades 200ms. No shared-element API in v1. New letter after save: already in place with an `accentSoft` wash fading over `newMarkMs` (MOTION 5e). Chapter interior: first 6 cards `enter` with 30ms stagger. RM: 200ms cross-fade.
- **Builds on:** our Card + PhotoFrame + Signature + Text; long-press through `platform/action-menu` (never Expo UI directly). Web: same composition with shadcn `Card` + `ContextMenu`.
- **Android later:** same card and transition code (MOTION 5f is the v1 default on both). `action-menu.android.tsx` opens a `fitToContents` Sheet listing Share / Edit / Delete instead of a context menu; `accessibilityActions` unchanged. Android back and predictive back run the dismiss path.

### 2.6 Chip
- **Purpose:** filters (month, author), tags, and selection of one or many options.
- **Variants:** `filter` (toggle, selected = `text` fill + `bg` label), `choice` (single-select group), `tag` (read-only, `accentSoft`), `input` (removable, trailing ×).
```ts
type ChipProps = {
  label: string; icon?: IconName;
  variant?: 'filter' | 'choice' | 'tag' | 'input';
  selected?: boolean; disabled?: boolean;
  onPress?: () => void; onRemove?: () => void;
};
type ChipGroupProps = { scroll?: boolean; multiple?: boolean; label: string; children: React.ReactNode };
```
- **States:** default, pressed, selected, disabled.
- **A11y:** `filter`/`choice`: `role="button"` with `accessibilityState.selected` (choice inside a `radiogroup` on web). `ChipGroup` has an `accessibilityLabel` ("Filter by author"). Height is 36 visual with `hitSlop` to 44. `input` remove has its own label "Remove {label}".
- **Haptics:** `tap` on toggle. **Motion:** fill cross-fade on `snappy`.
- **Builds on:** RNR `toggle.tsx` / `toggle-group` (`@rn-primitives/toggle`), horizontal ScrollView. Web: shadcn `ToggleGroup` / `Badge`.
- **Android later:** same code (our chips, not Compose `Chip`). Also the fallback for SegmentedControl at large text sizes on both platforms.

### 2.7 TextField
- **Purpose:** single-line input (child name, family member name, email for waitlist).
```ts
type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;                               // always visible, never placeholder-only
  helper?: string; error?: string;
  leadingIcon?: IconName; clearable?: boolean;
};
```
- **States:** default, focused (`focus` 2pt ring), filled, error (`caution` text + icon + message), disabled.
- **A11y:** the label is linked (`accessibilityLabel={label}`, `aria-labelledby` on web); the error is announced via `AccessibilityInfo.announceForAccessibility`; height 48. Uses the correct `textContentType`/`autoComplete` (name, email).
- **Haptics:** `warning` once on submit error only. **Motion:** ring fade on `snappy`.
- **Builds on:** RNR `input.tsx` + `label.tsx`. Web: shadcn `Input` + `Label`.
- **Android later:** same code. Map `textContentType` to `autoComplete` (Android uses `autoComplete`); check the focus ring is not doubled by the Android underline; `announceForAccessibility` works with TalkBack.

### 2.8 TextArea (letter typing)
- **Purpose:** the Type half of capture. It should feel like writing on paper, not filling a form.
- **Variants:** `letter` (full screen, `letterBody` style, no border, ruled baseline optional), `compact` (inline edit of a transcript).
```ts
type TextAreaProps = Omit<TextInputProps, 'style' | 'multiline'> & {
  variant?: 'letter' | 'compact';
  label: string;                               // visually hidden in 'letter', still read
  dateline?: string;                           // "Tuesday, 4 months old" above the text
  autosaveState?: 'idle' | 'saving' | 'saved' | 'offline';
  maxLength?: number;                          // soft; shows count only past 90%
};
```
- **States:** empty (warm placeholder prompt, e.g. "What happened today?"), typing, autosaving (quiet caption "Saved"), offline ("Saved on this phone"), error.
- **A11y:** `role` is text input; the label is read; autosave changes are announced politely at most every 10s. Keyboard avoidance through `KeyboardAvoidingView`/`keyboardLayoutGuide`. Scales to AX5 with no fixed height.
- **Haptics:** none while typing. `success` when the user taps Done and the letter is saved.
- **Motion:** none on the input (controls never animate in). Dateline is static text.
- **Builds on:** RNR `textarea.tsx` restyled. Web: shadcn `Textarea`.
- **Android later:** same code. Keyboard: `KeyboardAvoidingView` behaviour differs (Android usually `height` or none with edge-to-edge); test in a `formSheet`. Set `textAlignVertical="top"` for multiline on Android.

### 2.9 SegmentedControl
- **Purpose:** switching views on one screen (Read / Listen; All / Notes / Letters).
```ts
type SegmentedControlProps<T extends string> = {
  segments: { value: T; label: string }[];     // 2 to 4 segments
  value: T; onChange: (v: T) => void;
  label: string;                               // group label for VoiceOver
};
```
- **States:** selected, pressed, disabled segment.
- **A11y:** native UISegmentedControl semantics (VoiceOver "1 of 3, selected"). Labels stay short; at AX sizes, more than 2 segments falls back to a Chip group.
- **Haptics:** native. Our `tap` is not called (no double haptic).
- **Motion:** native.
- **Builds on:** `platform/segmented-control.ios.tsx`: Expo UI SwiftUI `Picker` with `pickerStyle('segmented')` inside a sized `Host`. Screens import `platform/segmented-control` only. Web: shadcn `Tabs` (list only) or `ToggleGroup`.
- **Android later:** `segmented-control.android.tsx` uses Expo UI Compose `SingleChoiceSegmentedButtonRow` + `SegmentedButton` (Material 3 look, native haptics), coloured from tokens. Same props. The universal `@expo/ui` Picker has no segmented style, so two files are required.

### 2.10 Toggle
- **Purpose:** on/off settings (backup on, reminders on, share with family).
```ts
type ToggleProps = { label: string; description?: string; value: boolean; onValueChange: (v: boolean) => void; disabled?: boolean };
```
- **States:** on, off, disabled.
- **A11y:** `role="switch"`, label and description are read together; the whole row is the target.
- **Haptics:** native. **Motion:** native.
- **Builds on:** `platform/toggle.ios.tsx`: Expo UI SwiftUI `Toggle` with `tint(accent)`, inside ListRow. Web: shadcn `Switch`.
- **Android later:** `toggle.android.tsx` uses Expo UI Compose `Switch` with `colors` from tokens (`checkedTrackColor` = `accent`). Same props. (Universal `Switch` exists but has no colour prop, so we keep two small files.)

### 2.11 ListRow
- **Purpose:** settings, family members, and export options.
- **Variants:** `navigation` (chevron), `toggle` (trailing Toggle), `value` (trailing muted value), `destructive` (`caution` label), `author` (leading Avatar).
```ts
type ListRowProps = {
  title: string; subtitle?: string;
  leading?: React.ReactNode;                   // icon or Avatar
  trailing?: 'chevron' | 'none' | React.ReactNode;
  variant?: 'default' | 'destructive';
  onPress?: () => void;
  accessibilityHint?: string;
};
```
- **States:** default, pressed (`surfaceRaised` highlight), disabled.
- **A11y:** one element; `role="button"` if pressable (or `link` for navigation on web); min height 44, grows with type; the subtitle wraps.
- **Haptics:** none (navigation is not a haptic moment). **Motion:** highlight fade on `snappy`.
- **Builds on:** Pressable + Text + Separator (RNR). Long lists use FlashList. Web: a plain `<li>` with shadcn `Separator`.
- **Android later:** same code. Chevron is iOS idiom; on Android hide it via `android:hidden` (Uniwind platform selector) for `navigation` rows **(opinion)**. Pressed highlight stays ours (no ripple).

### 2.12 Sheet
- **Purpose:** focused tasks without leaving context: capture options, letter details, author picker, export.
- **Variants:** `auto` (`fitToContents`), `half` (detents `[0.5, 1]`), `full` (`[1]`).
```ts
// Route-level: app/(sheets)/<name>.tsx with Stack.Screen options
type SheetOptions = {
  detents: 'fitToContents' | number[];          // e.g. [0.5, 1]
  initialDetentIndex?: number;
  grabber?: boolean;                            // default true
  cornerRadius?: number;                        // from radius.xl
  undimmedUpTo?: number | 'none';
};
// In-sheet layout helper
type SheetBodyProps = { title?: string; children: React.ReactNode; footer?: React.ReactNode /* sticky CTA */ };
```
- **States:** detent positions, keyboard-raised, dismissing (if there is unsaved text, `preventRemove` plus a confirm Dialog).
- **A11y:** native modal trap; the title is `role="header"`; Escape/two-finger-Z dismisses; the footer stays above the keyboard and the home indicator.
- **Haptics:** none (MOTION section 6; native detent behaviour stays as-is).
- **Motion:** native sheet; sheet content adds no entrance (MOTION 5i).
- **Builds on:** **Expo Router** `presentation: 'formSheet'` via `platform/sheet-options.{ios,android}.ts` → `sheetScreenOptions(variant)`, plus `SheetBody`. iOS: `sheetAllowedDetents`, `sheetGrabberVisible`, `sheetCornerRadius`. The footer is our own `StickyFooter` on both platforms. Web: shadcn `Drawer` (mobile widths) / `Dialog` (desktop).
- **Android later:** `sheet-options.android.ts` caps detents at 3, drops the grabber (iOS only), and sets no header: `SheetBody` always renders the title, because native headers do not render inside Android form sheets. Do not use `unstable_sheetFooter` (experimental). Back button dismisses (with the same unsaved-text guard).

### 2.13 Dialog / Alert
- **Purpose:** confirm destructive or irreversible actions (delete letter, remove family member, leave with unsaved text). Never for information alone.
```ts
type ConfirmOptions = {
  title: string; message?: string;
  confirmLabel: string; cancelLabel?: string;   // default "Cancel"
  destructive?: boolean;
};
function confirm(opts: ConfirmOptions): Promise<boolean>;          // imperative helper
type DialogProps = { open: boolean; onOpenChange(o: boolean): void; title: string; children: React.ReactNode; actions: React.ReactNode }; // custom content (rare)
```
- **States:** open, closed.
- **A11y:** native alert semantics; focus goes to the title; destructive is the second button, never the default.
- **Haptics:** `warning` when a destructive confirm appears.
- **Motion:** native.
- **Builds on:** React Native `Alert.alert` for `confirm()` (native UIAlertController on iOS, with `style: 'destructive'`). RNR `dialog.tsx` / `alert-dialog.tsx` (`@rn-primitives/dialog`) for custom content. Web: shadcn `AlertDialog`.
- **Android later:** same `confirm()` code. Android shows a Material alert, max 3 buttons, ignores `destructive` styling, and is not dismissible by tapping outside unless `cancelable: true` (we pass it so it resolves `false`). The confirm label is always an explicit verb ("Delete letter"). RNR dialog: same code.

### 2.14 Toast (undo)
- **Purpose:** quiet confirmation with undo after a reversible action (deleted, archived, marked "Not much today"). It replaces most confirm dialogs.
```ts
type ToastOptions = {
  message: string;                              // "Letter deleted"
  action?: { label: 'Undo' | string; onPress: () => void };
  durationMs?: number;                          // default 5000; 8000 if action; paused while VoiceOver focused
  tone?: 'neutral' | 'success' | 'caution';
};
function toast(opts: ToastOptions): void;      // from useToast()
```
- **States:** entering, visible, action-pressed, leaving. One toast at a time; a new one replaces the old.
- **A11y:** announced via `announceForAccessibility` ("Letter deleted. Undo available."). With VoiceOver on, duration extends to 10s and the toast is focusable. It sits above CaptureBar and the safe area. The undo target is 44pt.
- **Haptics:** none on show; `tap` on Undo.
- **Motion:** `enter` (y 8→0 + fade) on `standard`; swipe-down to dismiss (Gesture Handler). Reduce Motion: 200ms fade only. Per DESIGN_LANGUAGE rule 11.5 (no time-boxed UI), an undo toast persists until dismissed or the screen changes; `durationMs` applies only to toasts without an action.
- **Builds on:** our own component (Reanimated + Portal from `@rn-primitives/portal`). Web: shadcn `Sonner`.
- **Android later:** same code (not Compose `Snackbar`). Sit above the Android gesture/navigation bar via safe-area insets.

### 2.15 EmptyState
- **Purpose:** the first-run book, an empty month, no family yet. It should be warm, not an error.
```ts
type EmptyStateProps = {
  illustration?: React.ReactNode;              // designer asset, optional
  title: string; body?: string;
  action?: { label: string; onPress: () => void; variant?: 'primary' | 'quiet' };
};
```
- **States:** static.
- **A11y:** the title is a header; the illustration is decorative (`accessible={false}`).
- **Haptics:** none. **Motion:** the one illustration breathes opacity 0.85↔1 over 8s, only while the screen is focused and the app active (MOTION 5j). Text and action are static. Off under Reduce Motion, Low Power Mode, and Android animator scale 0.
- **Builds on:** Text + Button + `react-native-svg` line drawing. Web: same.
- **Android later:** same code. Low Power check uses `expo-battery` on iOS; on Android rely on animator scale and battery saver if exposed (**Unverified**).

### 2.16 Avatar / Signature
- **Purpose:** who wrote it. A signature line ("From Papa") is a brand element (BRAND.md: "each one signed").
- **Variants:** Avatar `sm` 28 / `md` 40 / `lg` 64; initials fallback on `accentSoft`. Signature `inline` ("From Papa" in `letterDateline`) and `signoff` (at the end of a letter, `letterBody` italic-like style, right-aligned).
```ts
type AvatarProps = { author: Pick<Author, 'displayName' | 'avatarUrl'>; size?: 'sm' | 'md' | 'lg'; decorative?: boolean };
type SignatureProps = { author: Author; variant?: 'inline' | 'signoff'; showAvatar?: boolean };
```
- **States:** image loading (initials shown), image error (initials).
- **A11y:** Avatar is decorative when next to the name; otherwise label = name. Signature reads "From Papa".
- **Haptics / Motion:** none.
- **Builds on:** RNR `avatar.tsx` (`@rn-primitives/avatar`) + expo-image. Web: shadcn `Avatar`.
- **Android later:** same code.

### 2.17 ListeningAura
- **Purpose:** shows the app is listening, as a soft breathing glow driven by voice amplitude. Calm, not a VU meter.
```ts
type ListeningAuraProps = {
  state: 'idle' | 'listening' | 'paused' | 'processing';
  level: SharedValue<number>;                  // 0..1, smoothed, fed from expo-audio metering
  size?: number;                               // glow diameter, default 240 (mic disc 120)
  children?: React.ReactNode;                  // centre content: mic glyph or timer
};
```
- **States:** idle (static soft disc), listening (scale 1.0 to 1.18 and opacity 0.18 to 0.40 with level; after 600ms of silence an idle breath ramps in, speech always wins), paused (frozen at 1.0, dimmed), processing (static disc; caption "Preparing..."; no decorative loop, MOTION principle 1).
- **A11y:** decorative (`accessible={false}`). The state is conveyed by the CaptureBar button label and a live caption ("Listening... 0:42"). Reduce Motion: static 2pt ring; opacity steps 0.2/0.3/0.4 with 200ms fades, at most one change per 400ms (MOTION 5b).
- **Haptics:** none from the aura. `press` on record start fires before the audio session activates and on stop after it ends (owned by CaptureBar).
- **Motion:** MOTION 5b exactly: dB → `a` (floor −55, ceiling −10, gamma 0.6), asymmetric smoothing (attack 80ms, release 400ms) in `useFrameCallback` using `dt`. Colour is the `recording` terracotta (which means "listening", DESIGN_LANGUAGE section 2), never an error colour.
- **Builds on:** Reanimated 4 + one pre-rendered 240pt radial PNG behind the 120pt mic disc (no per-frame gradient, no Skia, no `expo-linear-gradient`). Metering from the `expo-audio` recorder (`isMeteringEnabled` → `metering` dBFS, normalised in `lib/audio-level.ts`). Web: CSS radial gradient + Web Audio `AnalyserNode` (later).
- **Android later:** same code. Confirm expo-audio metering rate and dBFS range on Android (MOTION open question 2); if coarse, the idle breath carries it. Target 60fps on a mid-tier Android.

### 2.18 CaptureBar
- **Purpose:** the sticky bottom bar on Home. Speak and Type have **equal weight**; "Not much today" is a quiet escape (BRAND.md: "Not much today in one tap. No streaks").
- **Variants:** `rest` (two equal buttons + quiet link), `recording` (Stop + Pause, timer, `recording` dot), `compact` (when scrolled: two icon buttons).
```ts
type CaptureBarProps = {
  mode: 'rest' | 'recording' | 'compact';
  elapsedSec?: number;
  onSpeak: () => void; onType: () => void; onNotMuchToday: () => void;
  onStop?: () => void; onPause?: () => void;
  notMuchTodayDone?: boolean;                  // shows "Noted for today" instead
};
```
- **Layout:** two `lg` Buttons side by side at `flex-1`, the same variant (`secondary` with leading icons Mic / PenLine), not primary vs secondary. "Not much today" is a `quiet` button below. Hairline `line` top border, `surface` with blur (fallback `surfaceRaised`), safe-area bottom padding. At AX sizes, the two buttons stack vertically.
- **States:** rest, recording, compact, disabled (mic permission denied: Speak shows "Allow microphone" and opens Settings), notMuchTodayDone.
- **A11y:** labels "Speak a note" / "Type a note" / "Not much today"; hint on the last: "Marks today without writing anything." While recording: "Stop recording, 42 seconds", announced every minute, not every second.
- **Haptics:** `press` on Speak/Type start; `soft` on Not much today; `success` on stop + save.
- **Motion:** rest↔recording morphs (layout transition) on `standard`; rest↔compact on scroll on `snappy`. Speak/Type never fade or stagger in (MOTION principle 2, 5a).
- **Builds on:** Button, IconButton, Reanimated layout animations, `platform/blur-surface` (never `expo-blur` directly). Web: not applicable for v1 (the web reader is read-only).
- **Android later:** same code; `blur-surface.android.tsx` is solid `surfaceRaised` + `line` hairline. Bottom padding uses safe-area insets for gesture and 3-button navigation bars.

### 2.19 EditUnderline
- **Purpose:** marks words that on-device cleanup changed (mic or grammar slips), so trust is visible (BRAND.md: "We never rewrite your words"). Tap to see the original or undo.
```ts
type EditUnderlineProps = {
  text: string;                                 // the edited span as shown
  original: string;                             // what was transcribed
  reason: 'mishear' | 'grammar' | 'filler';
  onRevert: () => void;
  onAccept?: () => void;                        // hides the mark
  children?: never;
};
// Used inside Text as nested <Text> spans; tapping expands an inline card under the line (MOTION 5d).
```
- **Visual:** 1pt dotted underline in `textMuted` at 60% opacity, 3pt offset. No colour fill, no icon; it must be readable as plain text.
- **States:** default, pressed (`accentSoft` background on the span), reverted (the mark is gone; the original text is shown), accepted (mark gone).
- **A11y:** the span gets `accessibilityHint="Edited. Double tap to see what you said."` and `accessibilityActions` [`showOriginal`, `revert`]. A screen-level rotor alternative: "Review 3 edits" ListRow at the end of the letter. Inline card content: "You said: '...' / We wrote: '...'" with `Keep` / `Use what I said`.
- **Haptics:** `tap` on open and on Put it back (MOTION 5d; `success` is reserved for save).
- **Motion:** underlines render at final opacity on the first frame. Tap: an inline card expands under the line (height via `LinearTransition` on `standard`, content fades in after 80ms) showing original vs current and **Put it back**. Put it back: original cross-fades in (out 120, in 160ms), paragraph reflows on `standard`, restored span gets an `accentSoft` wash fading over 1.6s; "Put back. Undo" persists. RM: instant height, 200ms fades.
- **Builds on:** nested RN `Text` with `onPress` + an inline expansion card (no Sheet, no Expo UI `Popover`). Web: `<span>` with `text-decoration: underline dotted` + an inline disclosure.
- **Android later:** same code. Check nested-`Text` press targets and the dotted underline (`textDecorationStyle` support on Android is **Unverified**; fall back to an SVG or border underline under the span).

### 2.20 MonthChapterHeader
- **Purpose:** the book is organised by month of age. Each month opens like a chapter.
```ts
type MonthChapterHeaderProps = {
  monthIndex: number;                           // 0 = birth month
  label: string;                                // "Month 4"
  dateRange: string;                            // "March 12 to April 11"
  count: { notes: number; letters: number };
  coverPhoto?: { uri: string; blurhash?: string };
  sticky?: boolean;                             // compact sticky version in the list
};
```
- **Variants:** `full` (large `title1`, cover photo, counts), `sticky` (one line, `headline`, blur background).
- **A11y:** `role="header"`; label "Month 4, March 12 to April 11, 6 notes and 2 letters." Counts are words, not just numerals with icons.
- **Haptics:** none. **Motion:** `full` → `sticky` cross-fade driven by scroll position (Reanimated `useAnimatedScrollHandler`). Reduce Motion means a hard switch.
- **Builds on:** FlashList sticky headers + Text + PhotoFrame; `sticky` background via `platform/blur-surface`. First Book view per session: cover settles opacity 0.6→1, y 6→0 on `gentle` (MOTION 5a). Web: `<h2>` with `position: sticky`.
- **Android later:** same code; sticky background is solid on Android.

### 2.21 AudioPlayer
- **Purpose:** play the original recording of a note or letter.
- **Variants:** `inline` (inside a letter: play button, scrub bar, time), `mini` (persistent bar while navigating; deferred unless needed).
```ts
type AudioPlayerProps = {
  source: { uri: string };
  durationSec: number;
  speeds?: (0.75 | 1 | 1.25 | 1.5)[];          // default [1, 1.25, 1.5, 0.75]
  author?: Author;                              // "Papa's voice"
  onProgress?: (sec: number) => void;
};
```
- **States:** idle, loading, playing, paused, scrubbing, ended, error ("Recording is on another phone": offline or local-only).
- **A11y:** Play/Pause IconButton `lg` labelled "Play Papa's voice, 1 minute 12". The scrub bar uses `role="adjustable"` with `accessibilityValue={{ min, max, now, text: '0:32 of 1:12' }}` and increment/decrement actions of 5s. The speed button reads "Playback speed 1 times", and a tap cycles the speed. Supports system audio interruption and Now Playing (deferred).
- **Haptics:** `tap` on speed change only; none during playback or scrubbing (MOTION section 6).
- **Motion:** progress fill linear; play/pause icon swap on `snappy`.
- **Builds on:** `expo-audio` `useAudioPlayer`, Gesture Handler pan for scrubbing, IconButton. Web: `<audio>` + shadcn `Slider`.
- **Android later:** same code. Test audio focus and interruptions (calls, other apps) and that `adjustable` increments work with TalkBack volume-key/swipe gestures.

### 2.22 ReadTogetherPlayer
- **Purpose:** "Read together": plays the author's voice while the words highlight, for reading with the child (BRAND.md).
```ts
type WordTiming = { start: number; end: number; charStart: number; charEnd: number };
type ReadTogetherPlayerProps = {
  text: string;
  timings: WordTiming[];                        // from transcription
  audio: { uri: string; durationSec: number };
  author: Author;
  fontScale?: 'normal' | 'large' | 'xlarge';    // child-reading sizes, on top of Dynamic Type
  onWordPress?: (index: number) => void;        // tap a word → seek
};
```
- **Visual:** `letterBody` at a larger size. The current word gets an `accentSoft` rounded background (radius 4; not a colour change of the text). Read words stay at full contrast; nothing is dimmed out of legibility. Auto-scroll holds the current line at 40% height (MOTION 5g).
- **States:** ready, playing, paused, seeking, finished (Signature signoff fades in), no-timings fallback (plain AudioPlayer + text).
- **A11y:** with VoiceOver on, highlighting continues but auto-scroll pauses while the user explores. Play control as AudioPlayer. Each word is not a separate element (too noisy); instead, "seek to sentence" is offered through `accessibilityActions`.
- **Haptics:** none (MOTION section 6: playback and highlight have none).
- **Motion:** MOTION 5g: UI-thread clock `pos = posMs + (now − at) × rate`; binary-search word index; highlight leads by 50ms; words under 120ms merge. One wash moves x/width on `snappy` along a line; on line change it fades out 80ms and in on the new line (no diagonal slide). Follow: `scrollTo` over 450ms beyond ±1 line; a drag suspends follow, "Follow along" pill resumes, auto-resume after 4s. RM: wash jumps; scroll pages.
- **Builds on:** `expo-audio` player status → shared clock; words as inline `Text` items measured by `onLayout` into a shared rect array; Reanimated. Web: same algorithm, `<audio>` `timeupdate` + `requestAnimationFrame`.
- **Android later:** same code. Verify `onLayout` word rects for wrapped Latin + Devanagari runs on Android (text layout differs from iOS), and status-update rate for the clock.

### 2.23 PhotoFrame
- **Purpose:** photos within letters and cards. It should feel like a printed photo in a book, not a gallery tile.
- **Variants:** `card` (top of LetterCard, 4:3), `inline` (inside a letter, natural aspect clamped 3:4 to 16:9), `cover` (MonthChapterHeader), `polaroid` (white mat + caption, for the book/PDF look). Multi-photo uses paging with dots.
```ts
type PhotoFrameProps = {
  photos: { uri: string; blurhash?: string; alt?: string; width?: number; height?: number }[];
  variant?: 'card' | 'inline' | 'cover' | 'polaroid';
  aspect?: number;                              // locked for 'card'
  caption?: string;
  onPress?: (index: number) => void;            // opens full-screen viewer (deferred)
};
```
- **States:** loading (blurhash placeholder, no layout shift), loaded (fade on `standard`), error (`surfaceRaised` with an image-off icon + "Photo unavailable"), multi-page.
- **A11y:** `role="image"`, label = `alt` or "Photo from {date}". The pager announces "Photo 2 of 3". Swipe is also available through `adjustable`. Paging does not trigger the card's `onPress`.
- **Haptics:** `tap` on page change.
- **Motion:** image fade-in; pager dots on `snappy`.
- **Builds on:** `expo-image` (already installed; `placeholder` blurhash, `contentFit`), horizontal paging ScrollView or FlashList horizontal. Web: `next/image` + CSS scroll-snap.
- **Android later:** same code. Check that horizontal paging inside a vertical FlashList does not steal the card tap or vertical scroll on Android.

---

## 3. Build order (smallest set that ships the capture loop)

1. Text, Button, IconButton, Card (foundation; edit RNR copies to spec).
2. CaptureBar, ListeningAura, TextArea, Toast (the capture loop).
3. LetterCard, Signature/Avatar, PhotoFrame, MonthChapterHeader, EmptyState (the book).
4. AudioPlayer, EditUnderline, ReadTogetherPlayer (trust + Read together).
5. ListRow, Toggle, SegmentedControl, Chip, TextField, Sheet, Dialog (settings, family, filters).

Every component ships with a story screen in `src/app/(dev)/components.tsx` (dev builds only) showing all variants in light, dark and AX5 text size. When Android starts, the same screen is the Android QA checklist: every `platform/` wrapper, TalkBack, maximum font size, animator scale 0.

## 4. Platform wrapper index

| Our name | iOS (now) | Android (later) |
|---|---|---|
| `platform/toggle` | Expo UI SwiftUI `Toggle` | Expo UI Compose `Switch` |
| `platform/segmented-control` | Expo UI SwiftUI `Picker` (segmented) | Expo UI Compose `SingleChoiceSegmentedButtonRow` |
| `platform/action-menu` | Expo UI SwiftUI `ContextMenu` | Sheet with ListRows |
| `platform/sheet-options` + `SheetBody` | `formSheet` with grabber, any detents | `formSheet`, max 3 detents, title in body |
| `platform/blur-surface` | `expo-blur` | solid `surfaceRaised` |
| `lib/haptics` | `expo-haptics` iOS calls | `performAndroidHapticsAsync` |

Not wrapped (one API, both platforms): `confirm()` (RN `Alert.alert`), Phosphor `Icon`, native tabs (`src` PNG icons), all Reanimated motion. No SF Symbols in v1.
