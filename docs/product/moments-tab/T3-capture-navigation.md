# Moments tab, T3: navigation from a moment into capture, attach and back

Status: PROPOSED (20 to 21 Nov 2026). Author: transition lead T3. Docs only. Nothing here is built, and nothing here changes a ruling; every place it touches one is marked as a reversal the founder owns.

## 1. Purpose and scope

A parent taps a moment on the new tab. A few seconds later they are talking, with their own pictures beside the words. When they are done they are back in their book. This file says how the app moves through that, screen by screen, and what must never go wrong on the way.

In scope:
- The Expo Router route structure from the Moments tab to the picker, to Listen or Write, to Review, and back.
- How each screen is presented (push, modal, form sheet, full screen) and what Expo SDK 57 supports.
- What travels in route params, and what must never travel there.
- Back, swipe down and the Android back button while a recording or typed words exist (never lose a letter).
- A call, Siri, an alarm, the lock button or another app arriving mid-way.
- After Keep: where the parent lands and what the moment card becomes.
- Deep links and notification taps into the tab.

Out of scope (owned elsewhere, linked in section 9): what the pictures are and how they are copied and stripped (P4, NS-52), the card visuals (design leads), tab position (IA question, OQ-P4-1), the photo permission flow, analytics catalog changes (data).

My own reading, so you can weigh it: I read the routing code and the P4 draft closely. I did not run the app, so every claim about how a transition looks or feels on a device is UNVERIFIED and is turned into a device check.

## 2. Inputs read

| Input | Path or URL | Used for |
|---|---|---|
| Brief of record | `/home/claude/moments-brief.md` | Rules, reversals J4, K-02, BL-1305, ML-6, three-tab ruling |
| Root layout | `apps/mobile/src/app/_layout.tsx` | Stack screens, `unstable_settings`, 18+ gate, tabs guard |
| Tabs layout | `apps/mobile/src/app/(tabs)/_layout.tsx` | JS tabs, three items, no custom tab transition |
| Route table | `apps/mobile/src/lib/transitions.logic.ts` (`ROUTES`, `moveOptions`) | Presentation and move per route |
| Deep links | `apps/mobile/src/app/+native-intent.tsx`, `apps/mobile/src/lib/resilience/not-found.logic.ts` | Capture routes never open from a link |
| The one start | `apps/mobile/src/lib/capture/start-capture.ts`, `start-capture.logic.ts` | Source list, push, params, analytics |
| Listen | `apps/mobile/src/app/listen.tsx`, `components/capture/listen.logic.ts`, `lib/resilience/start-intent.ts` | Interruption, background, close, arming tap |
| Write | `apps/mobile/src/app/write.tsx` | Swipe rule, Android back, autosave on background |
| Review | `apps/mobile/src/app/review.tsx` | Flush on background, `land()` after Keep |
| P4 draft | branch `wip/moments-p4`, `docs/product/moments-tab/P4-capture-handoff-and-attach.md` (head a2d453b) | MT-P4-R1 to R44, flow in its section 5, OQ-P4-1 to 9 |
| Expo Router modals | https://docs.expo.dev/router/advanced/modals.md | Presentation modes, detents, Android limits |
| Expo Router stack | https://docs.expo.dev/router/advanced/stack.md | `gestureEnabled`, modal caveat |
| Expo Router SDK 57 reference | https://docs.expo.dev/versions/v57.0.0/sdk/router.md | `dismissTo`, `dismiss`, `dismissAll`, `useLocalSearchParams`, `redirectSystemPath` |

Not found on `develop` or as a branch when I looked: the privacy, feasibility and design-concept docs named in the brief (no `wip/moments-*` branch other than a1 to a3, d1 to d5, p1 to p5 existed). Assumption: Route B (our own picker) is the default and Route A (Apple's sheet) is an adapter behind the same hand-off. I reconcile with the feasibility doc when it lands (section 8, DEP-3).

## 3. What the code does today (the base this builds on)

All of this is VERIFIED by reading the files above in this session.

1. Root stack, in `_layout.tsx`: `(tabs)` is the first route (inside `Stack.Protected guard={tabs}`), then `onboarding`, `write`, `listen`, `review`, `read-together`, `letter/[id]`, `settings`, `(auth)`, `invite`, `plus/confirmed`. `unstable_settings = { initialRouteName: '(tabs)' }` so a deep link opens over the tabs.
2. Presentation table, `transitions.logic.ts`: `listen`, `review`, `read-together` are `fullScreenModal` with a dissolve; `write` is `modal` with the platform's rise; `letter/[id]` is `transparentModal` with `cardToPage` (the page draws its own grow); `settings` is a push; `(auth)`, `invite`, `plus/confirmed` are `modal`.
3. `listen` and `review` set `gestureEnabled: false` in `_layout.tsx`. `write` flips `gestureEnabled` from its own state (`writeSwipeAllowed`) and treats a refused swipe as Close (`gestureCancel` listener), and on Android binds the hardware back to Close.
4. `startCapture({ source })` is the one start. Today `HOME_CAPTURE_SOURCES = ['speak','type','notMuchToday','photo']`, and `photo` already exists but is `reserved` (does nothing). It calls `router.push({ pathname, params })` and, for Speak, `armListenStart()` first. `test/navigation-one-entry.test.ts` fails on any other push of `/listen` or `/write`.
5. Route params today are `promptKey`, `promptLibraryVersion`, `draftId`, `stopped`, `entryId`. All are keys, random ids or a closed word. No param carries words or a child name.
6. Listen: the draft row is written before the microphone goes live; app to background, an audio interruption (call, Siri, alarm) and leaving the screen all stop and keep the take and open Review with a one-line reason (`stopped=background|interruption`). Only a confirmed "Let it go" deletes audio. `inactive` alone does nothing.
7. Write: a swipe down inside the pause writes the words first; a write that failed refuses the swipe. Background writes the newest words at once.
8. Review: persists choices within 300 ms and on any non-active state. After Keep, `land()` calls `router.dismissTo({ pathname: '/book', params: arrivalParams(...) })`, so the Book is selected under Review as Review dissolves away, Tonight is never seen between. One ask (reminder, or Keep the book) may follow.
9. Links: `+native-intent.tsx` sends any link to `/listen`, `/review` or `/read-together` to Tonight (`isCaptureRoute`). A link never starts the microphone. The 18+ gate renders no route until it passes.
10. Typed routes are on (`typedRoutes: true` in `app.config.ts`), minimum iOS 17.0 (`IOS_DEPLOYMENT_TARGET`).

## 4. What Expo SDK 57 supports (sources read this session)

VERIFIED from https://docs.expo.dev/router/advanced/modals.md:
- `presentation` values include `modal`, `formSheet`, `transparentModal`, `fullScreenModal` (on iOS full screen; on Android falls back to `modal`), also `card`, `containedModal`, `containedTransparentModal`.
- `formSheet` takes `sheetAllowedDetents` (fractions of height, ascending, or `'fitToContents'`), `sheetInitialDetentIndex`, `sheetGrabberVisible` (iOS only), `sheetCornerRadius`, `sheetLargestUndimmedDetentIndex`.
- Android: at most 3 detents; no native header or nested stack inside a form sheet (titles and actions go in the content); `flex: 1` works with numeric detents on iOS from SDK 55, not with `fitToContents`.

VERIFIED from https://docs.expo.dev/router/advanced/stack.md: `gestureEnabled` is documented as iOS "Whether you can use gestures to dismiss this screen. Defaults to true", with a note that the gesture options do not affect screens presented modally. The page does not document how to block a modal dismissal, and does not cover `usePreventRemove` or `beforeRemove`.

VERIFIED from the SDK 57 router reference: `router.dismissTo` dismisses until the href is reached and replaces the current screen if it is not found; `router.dismiss` goes down by a count; `dismissAll` pops to the first screen of the closest stack; `useLocalSearchParams` reads the focused route's params (typed `Record<string, string | string[]>`); `+native-intent.tsx` exposes `redirectSystemPath`.

UNVERIFIED (not on a page I read; the repo shows the app already relies on some of them):
- That `gestureEnabled: false` on a `modal` or `fullScreenModal` blocks the iOS swipe down. The repo sets it on `listen` and `review` and `write` built its own handling "because gestureEnabled alone would not hold it" on Android, so the working assumption is iOS yes, Android no. Needs a device check (DC-1).
- That a `fullScreenModal` pushed on top of a `modal` page sheet presents and dismisses cleanly on iOS 17 and 18 in this stack.
- That `formSheet` sheets keep a hosted `@gorhom/bottom-sheet`, keyboard avoidance and VoiceOver focus correct in this app. The app has no `formSheet` route today.
- Whether Reduce Motion changes a native modal's rise (the repo says native sheets "follow the system's own reduced transition", rule 6, unconfirmed on device).

## 5. Requirements

Test layers: unit (pure logic, `node --test`), scan (a test that reads source), e2e (the E2E seams in `src/dev/e2e-seams.ts`), device (founder or a `human` device-check task). Priority P0 (a) is a data-loss or constitution rule, (b) a legal or accessibility rule, (c) a one-entry or structure rule; P1 is quality.

### 5.1 Route structure

Proposed tree (names are proposals; `content` and `design-systems` may rename the parent words, route names are internal):

```
app/
  (tabs)/
    _layout.tsx        three tabs today; position of Moments is OQ-P4-1
    index.tsx          Home
    moments.tsx        Moments (tab root; no params)
    book.tsx
    you.tsx
  moments/
    pick.tsx           Route B picker, root-stack modal; no params
  listen.tsx           unchanged route; fullScreenModal
  write.tsx            unchanged route; modal
  review.tsx           unchanged route; fullScreenModal
  letter/[id].tsx      unchanged
```

| Id | Requirement | Layer | Pri |
|---|---|---|---|
| MT-T3-R1 | Given the root stack, When Moments is added, Then it is a tab screen under `(tabs)` and the picker is a root-stack route outside the tabs (`moments/pick`), so the tab bar never shows over it and a capture screen pushed above it is the same `listen` or `write` route as Home uses. There is no second Listen, Write or Review. | scan `[MT-T3-R1] one capture route set` | P0 (c) |
| MT-T3-R2 | Given the route table, When `moments/pick` is added, Then it gets one row in `ROUTES` with `presentation: 'modal'` and `move: 'sheet'`, `transitions.test.ts` covers it, and no duration is typed in the route file. | unit `[MT-T3-R2] pick is in the table` | P1 |
| MT-T3-R3 | Given a tap on a moment, Then the parent reaches the picker in one navigation (`router.push('/moments/pick')`), with the chosen moment passed by a one-shot in-memory hand-off (R9), not by params. | e2e `[MT-T3-R3] one tap to the picker` | P1 |
| MT-T3-R4 | Given the picker with at least one item chosen, When the parent taps the one start control, Then `startCapture({ source: 'moment' })` runs and pushes `/listen` (Speak, armed) over the picker. The picker stays mounted underneath so Close on Listen returns to the picker with the same choices (R11). `moment` is added to `CAPTURE_SOURCES` in the same change as its handler, and `navigation-one-entry.test.ts` is extended to allow only `start-capture.ts` to push it. | scan+unit `[MT-T3-R4] moment is a closed start source` | P0 (c) |
| MT-T3-R5 | Given Listen opened from a moment, When the parent taps "Type instead", Then Listen replaces itself with `/write` as it does today and the pictures stay attached to the same pending letter (R10). | e2e `[MT-T3-R5] speak or type, same pictures` | P1 |
| MT-T3-R6 | Given Moments, Book and Me, Then none of them calls `router.push` to `/listen` or `/write` directly; only `start-capture.ts` does. | scan `[MT-T3-R6] still one entry` | P0 (c) |

Why `modal` and not `formSheet` for the picker (recommendation, reversible): thumbnails of at least 96 pt (NS-51-R9 as quoted by P4) want height, VoiceOver and AX5 want a full page, and a `formSheet` has Android limits and no precedent in this app. A `modal` page sheet is the same shape as `write`. A `formSheet` with detents `[0.5, 1]` is the option if design wants the moment card to stay visible behind; that needs a device spike (DC-2) and is OQ-T3-1.

Why a push over the picker and not a replace: with a push, Close on Listen goes back to the picker with the pictures still chosen, which is the kind outcome. With a replace, a parent who changes their mind loses their picks. The cost is a full screen modal over a page sheet, which is UNVERIFIED on device (DC-2). Fallback if that misbehaves: the picker dismisses first and `startCapture` runs after the dismiss completes, and the choices are held in the in-memory hand-off for the few seconds between.

### 5.2 Params and the hand-off (what travels where)

| Id | Requirement | Layer | Pri |
|---|---|---|---|
| MT-T3-R7 | Given any route reached from a moment, Then the only params are those that exist today (`promptKey`, `promptLibraryVersion`, `draftId`, `stopped`, `entryId`). No param holds words, a transcript, a child name, a date from the pictures, a place, an asset id, a filename or a count. | scan `[MT-T3-R7] params are keys and ids` | P0 (a) |
| MT-T3-R8 | Given `screen_view` and the error boundary, Then they see route templates only (`/moments/pick`, `/listen`), never a param value, and a test with a canary asset id passed through the hand-off finds 0 hits in the analytics queue, console, breadcrumbs and crash payload. | unit+scan `[MT-T3-R8] canary never appears` | P0 (a) |
| MT-T3-R9 | Given the picker, When the parent starts, Then the chosen items go to the capture side through a one-shot in-memory hand-off, with the same shape as `AttachRequest` in P4 section 5.3: set before the push, read once on mount, then cleared. Same pattern as `armListenStart` and `consumeListenStart` (pure, in memory, nothing stored, 5 s window for arming). A relaunch, a restored screen or a link finds it empty and shows the screen at rest with no pictures. | unit `[MT-T3-R9] one-shot, in memory, cleared` | P0 (a) |
| MT-T3-R10 | Given pictures already copied for a letter, When capture moves Listen to Review or Listen to Write, Then the pictures follow the letter by its `draftId` (a database link), never by params or by the in-memory hand-off. | e2e `[MT-T3-R10] pictures follow the letter id` | P0 (a) |
| MT-T3-R11 | Given Listen opened over the picker, When the parent taps Close before any sound or words exist, Then Listen goes back to the picker, the choices are intact, 0 rows and 0 files remain besides the picker's own temporary copies, and those are deleted when the picker closes (P4 R3). | e2e `[MT-T3-R11] backing out writes nothing` | P0 (a) |
| MT-T3-R12 | Given the opt-in `capture_started` event, When the source is `moment`, Then nothing is sent that says the letter began from a moment (P4 R4). Today `startCapture` always sends `source: 'tonight'`; it must not send that for a moment, because it would be false. Recommended: send no `capture_started` for a moment start; letters kept is the measure (OQ-T3-4). | unit `[MT-T3-R12] no moment source recorded` | P0 (a) |

### 5.3 Back, swipe down and Android back (never lose a letter)

Principle: the screen the parent is on decides what back means by what exists on it, from the strongest to the weakest.
1. A recording or typed words exist: back never deletes. It stops and keeps (existing Listen and Write rules), then lands on Review or the page they left, with one calm line.
2. Only choices exist (pictures picked, nothing spoken): back discards the choices and any temporary copies, with no confirmation, because nothing of the parent's words existed.
3. Nothing exists: back just goes back.

| Id | Requirement | Layer | Pri |
|---|---|---|---|
| MT-T3-R13 | Given Listen recording or paused, When the parent swipes down, taps a back control, or uses Android back, Then nothing deletes audio. iOS: the swipe is off (`gestureEnabled: false`, unchanged). Android back on Listen does not close silently while recording: it stops and keeps the take and opens Review with the existing stop line. Only the confirmed "Let it go" deletes. | e2e+device `[MT-T3-R13] back never deletes a recording` | P0 (a) |
| MT-T3-R14 | Given Listen has no recording yet (Ready, denied, in use), When the parent closes, Then Listen goes back to the picker (or Moments root if there was no picker), using `router.canGoBack() ? back : replace('/')` as today. | unit `[MT-T3-R14] close from rest` | P1 |
| MT-T3-R15 | Given Write with words, When the parent swipes down, taps Close or uses Android back, Then the words are written first; if they cannot be written to the phone the sheet stays open with "Not saved yet" (existing `writeSwipeAllowed`, `gestureCancel`, `BackHandler`). This must still hold when Write was reached from a moment. | e2e `[MT-T3-R15] Write rules unchanged from a moment` | P0 (a) |
| MT-T3-R16 | Given Review, Then the swipe stays off (unchanged); the only exits are Keep, Later, Record again, Write the words and "Let it go" with its confirmation. Pictures removed here use Undo per P4 R26. | e2e `[MT-T3-R16] Review exits are all deliberate` | P0 (a) |
| MT-T3-R17 | Given the picker with choices and nothing else, When the parent swipes down, taps Close or uses Android back, Then the picker closes at once with no confirmation, the in-memory hand-off is cleared, and temporary copies are deleted. | e2e `[MT-T3-R17] picks alone are cheap to drop` | P1 |
| MT-T3-R18 | Given the Android hardware back anywhere in the flow, Then it follows the same three-step principle; Android is later (the brief says workable on Android), so this is a requirement to build in, not a v1 device check. | device (later) `[MT-T3-R18] Android back` | P1 |

Reconciliation with P4 R3: "backing out writes nothing" is true only before the first sound or word. After that the letter exists and R13 to R16 govern. I propose P4 R3 says so in its Given.

### 5.4 Interruptions: a call, Siri, an alarm, the lock button, another app

All rows below match what the code does today (VERIFIED, `listen.tsx`, `write.tsx`, `review.tsx`); the new work is to keep them true with pictures present and to test it from a moment.

| Id | Requirement | Layer | Pri |
|---|---|---|---|
| MT-T3-R19 | Given Listen recording, When a call, Siri or an alarm takes the audio session, or the app goes to the background, Then the take stops and is kept, the pictures stay with the letter, and Review opens with the stop line. `inactive` alone (Control Center, a notification banner) changes nothing. | device `[MT-T3-R19] interruption keeps words and pictures` | P0 (a) |
| MT-T3-R20 | Given the app is killed while recording or typing, When it next opens, Then the launch sweep finds the letter, the words or audio are kept, the letter's pictures that were already copied are kept with it, and any half-copied item is dropped alone. A letter is never deleted because a picture failed. | unit+device `[MT-T3-R20] a kill keeps the letter` | P0 (a) |
| MT-T3-R21 | Given pictures are being copied before Ready (foreground, with progress and Cancel per P4 5.2), When the app goes to the background or a call arrives, Then the copy stops, temporary copies are deleted, no letter row exists yet, and the parent returns to the picker with their choices if the process is alive, or to Moments if not. | unit+device `[MT-T3-R21] a copy cut short costs nothing` | P0 (a) |
| MT-T3-R22 | Given Review or Write when the app leaves the foreground, Then the newest choices and words are written within the existing flush, with pictures included in what is flushed (order, removals). | unit `[MT-T3-R22] flush includes pictures` | P0 (a) |
| MT-T3-R23 | Given the App lock covers the screen, Then the cover goes over the stack without unmounting anything (existing behaviour), a pick result that lands while locked is discarded with 0 files (P4 R29), and a running take finishes underneath. | device `[MT-T3-R23] lock covers, never unmounts` | P0 (a) |
| MT-T3-R24 | Given a return from the background to Review with the stop line, Then the parent can Keep, Record again (which replaces to `/listen` with the same prompt and keeps the pictures), or Write the words. Nothing starts a recording without a tap. | e2e `[MT-T3-R24] return is a choice` | P0 (a) |

### 5.5 After Keep: where the parent lands, and what the card becomes

Today (VERIFIED): Keep ends in the saved moment (files the letter into its month) and then `router.dismissTo('/book', arrival params)`. From a moment, the stack under Review is tabs, picker, Listen (replaced by Review). `dismissTo('/book')` pops to the tabs and selects Book; whether it plays one clean dissolve through a picker still in the stack is UNVERIFIED (DC-3).

| Id | Requirement | Layer | Pri |
|---|---|---|---|
| MT-T3-R25 | Given Keep from a letter that began at a moment, When the save finishes, Then the parent lands on the Book on the new letter, exactly as from Home, with the same one ask at most afterward. The picker and Listen leave the stack in the same navigation. No new landing screen is built. Recommendation, OQ-T3-2: the founder may instead want to return to Moments. | e2e `[MT-T3-R25] same landing as Home` | P1 |
| MT-T3-R26 | Given the stack after R25, Then it is tabs only, the back stack holds no picker, no Listen, no Review, and Back or a swipe from the edge on the Book does nothing odd. | e2e `[MT-T3-R26] stack is clean after Keep` | P1 |
| MT-T3-R27 | Given the Moments tab after a Keep, Then it shows no "done", no count of moments left, no tick, no gap line, no "1 of N", and nothing implies the other moments are waiting (constitution: celebrate what exists, never count gaps). | content+e2e `[MT-T3-R27] the tab stays quiet` | P0 (a) |
| MT-T3-R28 | Given the moment the parent used, Then the card does not turn into a link to the new letter, because nothing may record that the letter began from a moment (P4 R4, R17: no pointer back to the library). The letter is found in the Book where it was filed. | unit `[MT-T3-R28] the card keeps no link to the letter` | P0 (a) |
| MT-T3-R29 | Given a moment whose pictures were just used, When the parent opens Moments in the same app session, Then that moment is hidden from the list until the app next starts, held in memory only, cleared on relaunch. Whether any longer memory is allowed is OQ-T3-3 (default: no). | unit `[MT-T3-R29] used this session, in memory only` | P1 |

What the card becomes, in one line: nothing. It is a doorway, not a task. After Keep the card is unchanged for the rest of the session except it is out of the list (R29), and it may reappear after a relaunch if the source still offers it. I could not find a way to hide it for good without storing a pointer to the library, which P4 R17 forbids; I say so openly in OQ-T3-3 because a repeated suggestion is a real quality cost.

### 5.6 Deep links, notification taps and the 18+ gate

| Id | Requirement | Layer | Pri |
|---|---|---|---|
| MT-T3-R30 | Given a link `scribe://moments` or a local notification tap, Then the app opens the Moments tab root over `(tabs)` and nothing else: no picker, no capture, no microphone, no permission prompt. The picker and capture routes can never be the landing of a link. | unit `[MT-T3-R30] a link lands, never starts` | P0 (a) |
| MT-T3-R31 | Given `+native-intent.tsx`, When a link names `/moments/pick`, `/listen`, `/write`, `/review` or `/read-together`, Then it resolves to Tonight or to `/moments`. `CAPTURE_ROUTES` in `not-found.logic.ts` gains `/moments/pick` and `/write`. Today `/write` is not in that list, which is a gap I found (section 7). | unit `[MT-T3-R31] capture routes refuse links` | P0 (a) |
| MT-T3-R32 | Given a cold start from a link before the 18+ gate passes, Then no route renders, no link state is kept, and after the gate the parent lands on the target tab; a phone with no book opens first run and drops a moments link (the tabs guard `tabsInStack`). | unit+e2e `[MT-T3-R32] the gate and first run come first` | P0 (b) |
| MT-T3-R33 | Given a local nudge from a library signal (ML-3, P4 R38), Then its tap handler routes by a fixed content key to `/moments`, not by a URL that carries a signal, an id of a photo, a place or a date. The route carries no param. | unit `[MT-T3-R33] a nudge tap carries nothing` | P0 (a) |
| MT-T3-R34 | Given a widget, Control Center control, Action button or Siri doorway (already reserved in `CAPTURE_DOORWAYS`), Then none of them may pass pictures; they call `startCapture` with their own source and no items. A Moments doorway is out of scope until the founder asks. | scan `[MT-T3-R34] doorways carry no pictures` | P1 |

### 5.7 Motion, accessibility and budgets

| Id | Requirement | Layer | Pri |
|---|---|---|---|
| MT-T3-R35 | Given a moment card tapped, Then v1 uses the platform's own modal rise to the picker (rule 4: native first), and the app adds no custom card-to-page grow for moments. The existing `cardToPage` move stays for the letter page only. A shared-element from a card to the picker is a later design option, not a v1 need. | device `[MT-T3-R35] native rise, no custom move` | P1 |
| MT-T3-R36 | Given Reduce Motion, Then the picker's rise follows the system's reduced transition, Listen and Review dissolve at the shorter fade token, and no custom slide runs. | device `[MT-T3-R36] Reduce Motion` | P1 |
| MT-T3-R37 | Given VoiceOver, When the picker opens, Then focus lands on its title, the first chosen or choosable item is next, the start control is reachable without scrolling past every item at AX5 (inline at the end of the scroll at accessibility sizes, as Review's footer does), and on return from Listen to the picker focus lands on the control that opened Listen. Targets are 44 pt or more. | device `[MT-T3-R37] focus and order across the flow` | P0 (b) |
| MT-T3-R38 | Given first frame of the picker, Then it renders from local state with no awaited network or model load (A-NFR-001, A-NFR-002), and a cold start with Moments installed adds no photo-library call at launch. | unit+scan `[MT-T3-R38] no awaited work on open` | P0 (c) |
| MT-T3-R39 | Given the E2E seams, Then every e2e row above runs with fixture pictures generated by script for the fictional family Asha, and no fixture, string or snapshot holds a real name, place or picture. | review `[MT-T3-R39] Asha only` | P0 (a) |

## 6. Flows at a glance

Happy path, Route B, from the Moments tab (the picker is a root-stack modal):

1. Moments tab (root) to tap a card.
2. `push /moments/pick` (modal rise). Choices held in the picker. Nothing written.
3. Start control: `startCapture({ source: 'moment' })`, pictures copied in the foreground with progress and Cancel, then `push /listen` (armed). Draft row written before the microphone goes live; pictures linked to that `draftId`.
4. Finish: Listen `replace /review?draftId`. A stop line if it was not Finish.
5. Keep: `dismissTo /book` with the arrival params. Stack: tabs.

Route A (Apple's system sheet): the system sheet is presented over the Moments tab, no route of ours. On return with a pick, the same hand-off (R9) is filled and step 3 follows. There is no picker of ours in the stack, so Close on Listen returns to the Moments root with choices gone (the system sheet cannot be re-opened by us without a tap). Whether Route A's return is synchronous, can be deselected, or carries video is UNVERIFIED (P4 5.3 says the same).

Type path: step 3 as `startCapture` with Type, or "Type instead" on Listen, which `replace`s to `/write`; the pictures follow the letter by `draftId` (R5, R10).

Waiting letter (P4 R18, OQ-P4-4): if a letter waits to be kept, the tap asks once, "Add" by default. Choosing Add resumes the waiting letter with `push /review?draftId` (a resume, not a start; `start-capture.logic.ts` already says opening a waiting draft is a resume), Cancel changes nothing.

## 7. Edge and unhappy paths

1. Photo access limited or denied: the Moments tab still shows our own cards; a card from our letters or a typed day opens the ordinary capture with no picker and no pictures. The picker is only reached from a card that has pictures. (Permission design is another lead's.)
2. Zero chosen items: the start control is disabled and says why in one calm line; there is no empty start.
3. A chosen item is iCloud only, huge, a video over the limit or the phone is low on space: that item is refused with one line, the rest go on (P4 R10). Navigation does not change.
4. Double tap on the start control, or a tap on a card while Listen is already opening: the one-shot hand-off and a "starting" flag make the second tap do nothing; a second `/listen` is never on the stack (this is the same hazard the arming window already guards).
5. Mic permission denied or in use on Listen from a moment: Listen's existing denied and in-use states show; Close returns to the picker; the pictures are not lost; "Type instead" is offered as today.
6. A call arrives during the system picker (Route A): the system owns that; we receive either a result or a cancel, and treat a cancel as nothing chosen.
7. Phone rotates or Dynamic Type changes mid-flow: the stack is unchanged; the picker re-lays out without clearing choices.
8. Two books: the letter goes to the active book; Review's To lets the parent change it (P4 5.5). The picker never guesses whose pictures they are, and no route param names a child.
9. Restored stack after a kill (iOS state restoration, if it applies): `/moments/pick` and `/listen` open "at rest" because the hand-off and the arming window are empty (R9). Listen already does this for a stale route.
10. A moment link while a letter is mid-recording: the link goes to Moments only after the take is stopped and kept; a link never interrupts a recording. UNVERIFIED how Expo Router orders this when Listen is the focused route; the safe default is to ignore the link while Listen is recording and apply it after (DC-4).
11. App lock on at link time: the lock covers, the link is applied under it, the parent unlocks and sees the Moments tab.
12. Shared book with another member: the line about pictures staying on this phone (P4 R32) shows at Review, not on a route; no navigation difference.
13. Gap found in the repo: `CAPTURE_ROUTES` in `not-found.logic.ts` lists `/listen`, `/review`, `/read-together` but not `/write`; a link to `scribe://write` is not rewritten there. `write` may still be safe because it starts nothing without a tap, but the rule text in `+native-intent.tsx` says capture routes never open from links, so it should say what is true. Not changed by this doc (docs only); it is MT-T3-R31's fix.

## 8. Constitution, privacy and accessibility checks

Constitution: no row writes, rewrites, summarises or titles anything. A moment's machine title (Route A) is dropped by the adapter before the hand-off (P4 R14); nothing in this flow shows it. The stop lines on Review are the existing fixed lines. No count, gap, streak or "waiting" appears after Keep (R27).

Privacy: params carry keys and ids only (R7); the hand-off is in memory and one-shot (R9); route templates only reach `screen_view` (R8, as `+native-intent.tsx` comments say for secrets); `capture_started` must not mislabel a moment start (R12); links never start capture (R30, R31); no library signal is in any URL or notification payload (R33). The server never sees the library.

Accessibility: Dynamic Type to AX5 with the letter text never truncated; VoiceOver order and focus return (R37); 44 pt targets; Reduce Motion (R36). The existing screens already follow these; the new work is the picker and the returns.

Content: all parent words for the picker, start control and refusal lines live in a `copy.ts` in the feature folder and move to `packages/content` via `content`; none is typed in a route file. Proposed words are PROPOSED here and are not in this doc as shipped strings.

## 9. Open questions (recommended default, owner, deadline)

Deadlines are PROPOSED; I have not read the Build 13 freeze date.

| Id | Question | Recommended default | Owner | By |
|---|---|---|---|---|
| OQ-T3-1 | Picker as `modal` page sheet or `formSheet` with detents? | `modal` now; spike `formSheet [0.5, 1]` (DC-2) and move only if it is clearly better | `design-systems`, mobile | 28 Nov 2026 |
| OQ-T3-2 | After Keep from a moment, land on the Book (as Home) or back on Moments? | Book, because that is where the saved moment files the letter into its month and it keeps one landing behaviour | Founder | 28 Nov 2026 |
| OQ-T3-3 | May Moments remember "used" beyond the session, as its own device-only record not on the letter, so a used moment is not offered again? | No by default (R29 session only). If yes: a salted hash held in Moments' own table, never on the letter, deleted on Erase everything, reviewed by `privacy` against P4 R17 and ML rules. This is a possible reversal the founder owns | Founder, `privacy` | 1 Dec 2026 |
| OQ-T3-4 | What does opt-in analytics record for a moment start? | Nothing for the start (P4 R4). Judge the tab by letters kept, per OQ-P4-6 | `data`, Founder | 28 Nov 2026 |
| OQ-T3-5 | Does a nudge tap open Moments or Home (OQ-P4-1)? | Moments root; never a picker, never capture | Founder | 24 Nov 2026 |
| OQ-T3-6 | Android back while recording: stop and keep and go to Review (R13)? | Yes, to match the "never lose a word" rule; build with the Android pass | mobile | with Android work |
| OQ-T3-7 | Should a letter that is already waiting block the picker's start, or ask once? | Ask once, "Add" default (P4 R18) | mobile, `product` | 28 Nov 2026 |

Reversals touched by this file (the founder owns each; I do not change them): J4 (only Home starts a letter) through MT-T3-R4; the K-02 first-run rule and BL-1305 only if the picker is reached before first run ends (it is not: a link before first run is dropped, R32); ML-6 (cards show a date, never a place or thumbnail) through the picker's thumbnails, which are only inside the picker and not on cards; the three-tab ruling through the tab position (OQ-P4-1).

## 10. Dependencies

- DEP-1: P4 (`wip/moments-p4`) owns attach, pipeline and storage; I depend on its `AttachRequest` shape and R3, R4, R17, R18. I ask P4 R3 to name "before the first sound or word".
- DEP-2: the one-entry test (`test/navigation-one-entry.test.ts`) and `start-capture.logic.ts` change in the same PR as the `moment` source; `design-systems` gives the approval line the logic file asks for.
- DEP-3: the feasibility doc decides Route A and Route B; R9 and the flows hold for both.
- DEP-4: `_layout.tsx` Stack.Screen entries and the `ROUTES` table are boot wiring. Under my rules I do not edit `_layout.tsx` outside a task that owns it, so the task that adds Moments must say it owns that edit.
- DEP-5: `content` owns every string; `data` owns the analytics catalog change in R12.
- DEP-6: `payments` is not touched. `sync` is not touched (nothing here syncs; a letter syncs as any other).

Device checks for the founder (I cannot run a phone):
- DC-1: swipe down on Listen, Review and a Write with words, on iOS 17 and the newest iOS, recording and paused, from a moment. Expect the swipe to do nothing on Listen and Review.
- DC-2: a `fullScreenModal` Listen over the `modal` picker: open, Close back to the picker, and also with VoiceOver on. Then the `formSheet` spike.
- DC-3: Keep from a moment, watch for one clean dissolve to the Book, no flash of Moments or Tonight, with Reduce Motion on and off.
- DC-4: tap a `scribe://moments` link while Listen is recording.
- DC-5: a real call and a Siri request during a take that started from a moment, then check the letter and its pictures in Review.
- DC-6: the picker and Review at AX5 on an iPhone SE 3, VoiceOver focus order on open and on return.
- Timing: a cold start and a warm start with Moments added, on an iPhone SE 3 (budget in the mobile brief: cold p50 1.2 s, p90 2.0 s, warm p50 400 ms, no awaited network or model load). Not measurable in CI by me; a `human` task.

## 11. What is VERIFIED, UNVERIFIED, and a guess

VERIFIED (source read this session):
- Everything in section 3, from the files named in section 2 in a fresh clone of `develop` (head fb29507).
- The SDK 57 presentation modes, form sheet options and Android limits, and the `gestureEnabled` note, from the Expo pages in section 4.
- `dismissTo`, `dismiss`, `dismissAll`, `useLocalSearchParams`, `redirectSystemPath` from the SDK 57 router reference.
- P4's section 5 flow, its requirement ids and its open questions, from `wip/moments-p4` at a2d453b.

UNVERIFIED (named in the text, each has a device check or an owner):
- That `gestureEnabled: false` blocks the swipe on iOS modals and the Android behaviour (the repo's own comment on `write.tsx` says it does not on Android; the Expo page says gesture options do not affect modals; the two statements are not the same and I did not run it).
- A `fullScreenModal` over a `modal` page sheet; `dismissTo` through it; Reduce Motion on native modals; a `formSheet` in this app.
- How a link or a notification tap is ordered against a focused Listen.
- Route A: whether the parent can deselect, whether video comes back, whether the return is synchronous (also UNVERIFIED in P4).
- Anything about how Apple's system picker or Journal suggestions behave: I read no Apple source in this session.
- The branches for the privacy, feasibility and concept docs: not present when I looked.

A guess: that a push over the picker feels better than a replace, because Close returns to the choices. Reasoned, not measured.

I did not: run the app or tests, edit any code or other doc, change CLAIMS or BACKLOG, open a PR, or invent a number (every number above is from the repo, the Expo pages, the P4 draft or the mobile brief).
