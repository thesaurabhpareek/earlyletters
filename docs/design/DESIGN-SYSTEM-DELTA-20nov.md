# Design system delta for the spec sync: tokens, components and their states

Status: DRAFT for Karma, 20 Nov 2026 (UTC). Author: `design-systems`. Docs only: nothing here is built, and no token file, generated CSS or component is changed by this PR. Everything below is PROPOSED until a token PR and a component PR carry it with tests. Stacks on #1033. Read with `SPEC-SYNC-20nov.md` (what and why), `SCREEN-PATHS-20nov.md` (where each is used) and `A11Y-AND-TYPE-AUDIT-20nov.md` (the evidence).

Rule followed (`docs/design/COMPONENT_LIBRARY.md`, ADR 0101): use a library component before building one, then add the finishing touch on top. Of the five things the ask names, two already exist in the app, two are thin wrappers on existing parts, and one is new. Said plainly per item.

| Item named | What exists today (READ on `develop` `55574906`) | Verdict |
|---|---|---|
| Analytics consent sheet | `components/consent/analytics-consent-sheet.tsx`: `AnalyticsConsentContent` and `AnalyticsConsentSheet`, built on `Sheet`, `Button`, `Text`; equal outline buttons, stacks at large text | Exists. Spec its states; two small changes (below). Do not generalise to a `ConsentSheet` until a second consent sheet exists. |
| Permission primer | The microphone primer is drawn inside `app/listen.tsx` (`listen.primer.*`); the reminders primer is the page footer plus `ReminderPrimeAsk`; no shared component | Extract `PermissionPrimer` from `listen.tsx` when the Face ID line is built: two uses justify it. Notifications keep the footer. |
| Error banner | `Toast` (reversible acts), `InlineState` (a region), `StateScreen` (a whole screen). Nothing for a condition above a form that stays usable | New, small: `Notice`. |
| Empty state | `EmptyState` (COMPONENTS 2.15), `StateScreen` | Exists. One variant (`compact`) and a rule: no count, no gap. |
| Offline state | `errors.offline` copy, `authCopy.offline` and `E-S14` as a `StateScreen`; no inline pattern | No new component: a `Notice` with `kind="offline"` for an action that needs a connection, and the existing `StateScreen` for a screen that cannot work without one. |

## 1. Tokens: added or changed

No new colour. The only colour roles the new parts need are `bg`, `surface`, `surfaceRaised`, `text`, `textMuted`, `controlBorder`, `focus`, `caution` (glyph only), `accentSoft`. Reason: the status roles `caution` and `success` fail 4.5:1 as text on `surface` and `accentSoft` in the light theme (4.40, 4.46, 4.09, 4.14; MEASURED, audit section 3), and no test covers it. A new parts rule follows from that, not a new colour: status colour on glyphs and borders, words in `text`.

| Token | Change | Value or rule | Test to add in `packages/design-tokens/test/tokens.test.ts` | Why |
|---|---|---|---|---|
| `type.tabLabel` | add | Mukta Medium, 13 pt, line height 17 (the caption ratio, not the 18 typed in the tab layout), `dynamicTypeStyle: 'caption1'`, `maxScale: 1.3` | size at the cap (16.9 pt) is at least `minFontSize`; line height at the cap fits in the bar height: check against a `target.min` + label | FE-1: the tab bar label is a hard-coded 13/18 that ignores Dynamic Type |
| `type.barTitle` | add | `headline` face and size, `maxScale: 1.3` | cap at least 1.3; the cap is one source for the Book bar and the letter page | FE-3: two screens type `maxFontSizeMultiplier={1.3}` themselves |
| `type.*.maxScale` | review, no change proposed | `title2` 2.0, `title1` 1.8, `display` 1.6, `hero` 1.6, `promptHero` 1.8, `numeral` 1.4 | a snapshot of every style's size at 3.571 so a cap change shows in review (FE-12 table) | Titles end below body at AX5: a decision for the CDesO, not a patch |
| `target` | no change | min 44, primary 56, capture 64, web 48 | existing test | |
| `focusRing` | no change | width 2, offset 2 | existing | |
| `TEXT_PAIRS` | extend the test, not the file | `caution`, `success`, `recording`, `destructive`, `focus` on `surface`, `surfaceRaised`, `accentSoft`, both modes | the pairs that fail (light: `caution` and `success` on `surface`, and the five on `accentSoft`) are listed as not allowed, with a message that says which role to use instead | The gap in audit section 3 |
| `space`, `radius`, `stroke`, `elevation`, `motion` | no change | The notice uses `space[3]` and `space[4]`, `radius.md`, `stroke.hairline`; enter uses `m.enter` and the existing 200 ms fade | existing | |
| Generated CSS in `dist/` | regenerate when `tokens.ts` changes | `npm run build -w @scribe/design-tokens`; the test "tokens.native.css is in sync with tokens.ts" fails otherwise | existing | |

If the CDesO rules against FE-1 (ruling 32: tab bar unchanged), `tabLabel` is not added and the Large Content Viewer alone carries it. That is Karma's and the CDesO's call.

## 2. Components

### 2.1 AnalyticsConsentSheet (exists): changes

Built on `Sheet`; reads `copy.analyticsConsent`; two `Button variant="outline"` of equal size, side by side, stacked at xxxLarge and up (`useIsLargeText`); a footer line; one report per showing; closing is not a no.

Changes proposed (for `mobile`):

1. At AX1 and up the buttons sit under the body inside the scrolling content, not in a pinned footer (rule 3 of the audit, section 2). The body is about 15 lines at AX5 (MEASURED), so a pinned pair would cover most of the sheet.
2. Initial VoiceOver focus is the title, never a button (already the `Sheet`'s rule; the test must pin it).
3. Failure of the write shows a `Notice` above the buttons (PATH-05), not a silent re-enable.

No visual hierarchy between the two buttons. No "recommended" wash. No colour on either that is not on the other.

States (default, pressed, disabled, focus, error), per button unless said:

| State | Look and behaviour | Tokens | Not allowed |
|---|---|---|---|
| default | outline, 44 pt minimum, label `label` ramp (Mukta Medium 18), `controlBorder` edge 1 pt | `controlBorder`, `text`, `stroke.control` | a filled one of the pair |
| pressed | `accentSoft` wash and `stroke.selected` edge in `accent`, both buttons identical; no scale; haptic `tap` on release | `accentSoft`, `accent`, `stroke.selected` | a different pressed style for yes |
| disabled | both buttons together while the write runs (`busy`): label in `textMuted`, edge in `line`, not announced as a change | `textMuted`, `line` | disabling one |
| focus | 2 pt ring offset 2 in `focus`, for Full Keyboard Access and Switch Control; initial focus on the title | `focusRing`, `focus` | auto-focus on a button |
| error | write failed: a `Notice` (kind error) above the pair; both buttons enabled again; nothing is sent | see 2.3 | red; a lost choice |

### 2.2 PermissionPrimer (new, extracted)

One short note of ours before Apple's own alert. Not a lookalike dialog: it has no "Allow" or "Don't allow" buttons. It is a screen block (inside Listen for the microphone, above the switch for Face ID), never a modal that traps.

```ts
type PermissionPrimerProps = {
  title: string;                       // from content, a heading
  body: string;                        // one or two plain sentences
  continueLabel: string;               // the only path to the iOS alert
  onContinue: () => void;
  alternative?: { label: string; onPress: () => void }; // "Type instead"
};
```

Builds on `StateScreen`'s block (title2, body, a 56 pt primary, a 44 pt quiet option) so it reads like every other state. Used for the microphone (as built) and Face ID. Notifications use the Reminders footer lines and the D-S04 card; not this component.

| State | Look and behaviour |
|---|---|
| default | title, body, primary Continue, quiet alternative |
| pressed | the Button's pressed state; haptic `tap`; on release the iOS alert opens |
| disabled | Continue is disabled while the iOS alert is up, label unchanged (no VoiceOver chatter) |
| focus | focus on the title when it appears; ring on whichever control has it |
| error | iOS answered No: the primer does not return; the denied `StateScreen` takes over (`errors.micDenied`). The primer is never shown again in the same session. |

Never: a counter, a second ask, a dark pattern that makes No look like a mistake. A primer shows only while the system has not asked.

### 2.3 Notice (new): the error banner

A calm inline message for a condition the person can act on while the rest of the page keeps working: a code that ran out, notifications off, a failed save of one choice. It is not a Toast (nothing was undone, so no timer and no Undo) and not a StateScreen (the page is usable).

```ts
type NoticeProps = {
  kind: 'info' | 'caution' | 'error' | 'offline';
  title?: string;                       // optional; title2 is too large here: use headline
  children: React.ReactNode;            // the sentence(s), body ramp
  action?: { label: string; onPress: () => void; busyLabel?: string };
  onDismiss?: () => void;               // only for info; never for error
};
```

Look: `surface` background, `radius.md`, a 24 pt glyph at the leading edge, `text` words. The glyph carries the kind: info and offline use `textMuted`, caution and error use `caution`. Never red: red means recording, and destructive is for Delete (DESIGN_LANGUAGE 2; `StateScreen` "never red"). The words are never in the status colour (audit section 3). The glyph is a different shape per kind, so colour is never the only signal. Voice: the words say what happened and what did not change, in that order for service faults.

Accessibility: one VoiceOver element (glyph hidden, words, then the action as its own button); a polite live region announced on mount through `announce()`; never assertive; no auto-dismiss for error or offline. At AX1 and up the glyph moves above the words and the action goes full width below; the words never truncate (no `numberOfLines`). Reduce Motion: appears with the 200 ms cross-fade, no slide.

| State | Look and behaviour | Tokens |
|---|---|---|
| default | as above | `surface`, `text`, glyph in `textMuted` or `caution` |
| pressed | only the action presses (Button quiet pressed: `accentSoft`); the notice itself is not tappable | `accentSoft` |
| disabled | action disabled while retrying, `busyLabel` shown ("Trying again" pattern from `errors.launch.tryingAgainButton`), no spinner-only | `textMuted` |
| focus | ring on the action, 2 pt offset 2; the notice is not a focus stop | `focusRing`, `focus` |
| error | the retry failed again: the words change to the second line ("It did not open this time either" pattern, `errors.launch.stillClosed`), the action stays; the notice never stacks twice | |

Voice: words come from `packages/content` keys; the component has no default text. Counts of gaps, guilt and fear are not available as props (no `count`).

### 2.4 EmptyState (exists): one variant, one rule

Changes: add `compact` (no illustration, no pinned action, title in `headline`, one sentence, an optional quiet action) for an empty list inside a page, such as Days, Your words, Recently deleted, Hidden books. The full `EmptyState` stays for the Book's first page.

Rule: an empty state never shows a count, a zero, a progress or a gap ("0 days", "you have not added", "nothing yet" as a reproach are not allowed); it says what the place is for in one calm line and gives one way forward or none.

| State | Look and behaviour |
|---|---|
| default | title as heading, one sentence, optional quiet action |
| pressed | the action's pressed state; the text is not tappable |
| disabled | the action only, when its work is busy |
| focus | the action; no focus stop on the text |
| error | not this component: a failed load is `InlineState` error |

Motion: the one illustration breathes only on the full variant, off under Reduce Motion and Low Power (COMPONENTS 2.15). `compact` has no motion.

### 2.5 Offline: no new component

Offline is not an error: the app records, writes and reads offline (`errors.offline`: "Keep talking. Everything is saved on this phone."). So:

- no persistent offline banner anywhere;
- an action that needs a connection (sign in, send a new email, the confirm page) shows a `Notice kind="offline"` with "Try again" when it is tapped and fails for no network, and clears itself when the connection returns (announce `authCopy.outage.backOnline`);
- a screen that cannot work at all without a connection (sign-in) uses the existing `StateScreen` (E-S14), unchanged.

| State | Look and behaviour |
|---|---|
| default | `Notice` kind offline, words from `authCopy.offline` or `errors.offline` |
| pressed | Try again pressed (Button quiet) |
| disabled | Try again while it checks the connection, `busyLabel` |
| focus | ring on Try again |
| error | still offline: the same notice, no extra alert, one live-region update |

### 2.6 ToggleRow, analytics row (exists)

No change to the component. Rules: off by default; one tap turns it off with no confirm sheet and no discouraging line; the row is disabled only while `busy`; the footer line is `settings.privacy.analyticsOffNote`.

| State | Look and behaviour |
|---|---|
| default | off, switch off-track in `controlBorder` (3:1 tested) |
| pressed | the system switch's own press |
| disabled | while saving (`busy`), switch and label in `textMuted` |
| focus | ring on the row, 2 pt |
| error | the switch returns to where it was and a `Notice` sits above the section |

### 2.7 Web confirm page shell (apps/web, PROPOSED)

A single column page on the web tokens (`dist/tokens.web.css`): one `h1`, one paragraph block, two buttons (a primary and a quiet), a live region for the result, 48 pt targets (`target.web`), `rem` sizes from the CSS variables (not fixed px), the same two themes by `prefers-color-scheme`, `prefers-reduced-motion` honoured, no JavaScript needed to read the first view. Not built; `apps/web` is not in this sparse checkout (UNVERIFIED).

| State | Look and behaviour |
|---|---|
| default | h1, what happened, primary and quiet buttons |
| pressed | `:active` wash in `accentSoft` |
| disabled | primary disabled after the press, `aria-disabled`, result in the live region |
| focus | `:focus-visible` 2 pt ring offset 2, never removed |
| error | the result text with the in-app path; no red |

## 3. Existing components: changes the audit needs

| Component | Change | For |
|---|---|---|
| `StateScreen` | From AX1 the primary scrolls with the content instead of pinning to the bottom (audit rule 3) | mobile; UNVERIFIED what the built component does at AX1 |
| `ListRow`, `ToggleRow` | From AX1 the title takes the full width and the control sits under it (rule 4) | FE-8 |
| `Sheet` | The sticky footer is not used at AX1 and up when it would take over 25 percent of the viewport | PATH-05 |
| `Text` | Reads `tabLabel` and `barTitle`; no screen sets `maxFontSizeMultiplier` itself | FE-1, FE-3, FE-4 |
| `Toast` | None (stacking at accessibility sizes is #877) | |
| Copy lint | A test that measures every string in `strings.en.ts` against 335 pt at AX5 and flags a word over the box | FE-8 |

## 4. What this file does not do

It does not write a sentence for any key; it does not choose a Face ID or device-access wording; it does not change `tokens.ts` or run the token build; it does not edit `COMPONENTS.md` beyond two pointer entries (2.25 Notice and 2.26 PermissionPrimer, marked PROPOSED); it does not draw the lock-screen specimens (OI-S2).

Signed: `design-systems`, 20 Nov 2026.
