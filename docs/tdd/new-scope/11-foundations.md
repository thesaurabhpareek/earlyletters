# TDD new scope 11: Foundations (NS-32 to NS-37), NS-07, and the open rows of NS-01 and NS-02

Status: Proposed, 20 Nov 2026. Author: `design-systems`, for Karma, who assembles the PR. Target `docs/tdd/new-scope/11-foundations.md`. Docs only: nothing here is built, no parent-facing word is written (new keys are PROPOSED for `content`; the founder approves words), and no date is set.

**Sources.** Locked pack: `docs/prd-lock-v1-20nov` (#846) at `450bcb4a`, unchanged when this started (`README`, `01`, `02`, `07`, `09` section 3a, `11`, `13`, `14`, `16`, `docs/BACKLOG.md` BL-952 to BL-987). Current system: `develop` at `1513b265` (#841 merged 05:15 UTC 20 Nov, after #847 was written; it touched only `lib/photos/{files,types}.ts` and tests, so every other cite is the same at `d5d12178`). ADR 0028 merged as `e9dca86c`, accepted under CR-62 (`docs/agents/cto/RULINGS.md:570`). Plan: #847 at `de44b839`. Evaluations on `docs/eng-eval-20nov` at `6c011919`: `B-mobile-client.md` read in full, cited "eval B s<section>"; `A-data-and-sync.md` read for NS-36, cited "eval A s<section>". Where they settle a point this file adopts it; where it differs it writes Conflict E1 to E4 with evidence. Open PR heads read by REST on 20 Nov: #758 `4b108df4`, #798 `7f36031a`, #835 `f55be7b8`, #836 `3395e5a6` (moved from the plan's `4596b3c1`), #837 `f730a75e`, #838 `09b7082a`, #839 `81023add`, #840 `cc94d0d3`, #842 `d178068c` (now on `develop`). Library facts were read in the repo's installed `node_modules`: react-native 0.86.3, expo-notifications 57.0.21, expo-file-system 57.0.7.

**Tags** as `docs/tdd/01-mobile-client.md`: **Fact** (file:line), **Assumption**, **Rec**, **Risk**, **OQ** (owner, default), **Conflict** (listed again in section 12, never resolved silently), **Unverified**. Paths under `apps/mobile/src/` drop that prefix. Nothing was run on a phone or simulator; the only computation was the contrast check in 1.3.

## 0. Summary

| Card | Wave | Depth here | State |
|---|---|---|---|
| NS-32 notification budget | 1 | full | Not built. #758 is a draft with an `occasion` class; P0 row R14 (quiet book) is unmet on develop |
| NS-33 accessibility floor | 1 | full | Partly built; letter page heading, Me title, Smart Invert, Bold Text, lens control and the audit harness are missing |
| NS-34 speed baseline | 1 | full (a run sheet, no code) | No sheet, no `perf` profile, no marker harness, no 1,000-letter phone fixture |
| NS-35 one start | done | record | Built in #828 (`5f5dfaf4`); R6 checks wait for modules |
| NS-36 data follows the letter | 1 (ADR), 2 (P-5, BL-933) | full for pictures and Find; outline for seals and Firsts (waves 4, 5) | ADR merged; X10 class fix open; export 1.7.0 held behind BL-868 |
| NS-37 Book stays fast | 2 | full | Not built; the lens reads stored copies in a plain `ScrollView` (#840) |
| NS-07 C5, G11 | no wave in 13 s4 or #847 (BL-974, BL-975 ready) | outline | C5 built behaviour; G11 not built |
| NS-07 C28 printable book | 4 | paragraph | Not built |
| NS-01 photo, NS-02 Find | in review | record plus open rows | Stack #842, #835 to #840 open; #798 open |

The decisions that matter most:
1. **The lens control is `ChoiceGroup` with `layout="segmented"`**, not Buttons in a `tablist` (NS-33-R3, NS-01-R48; eval B s1.3 agrees). On Fabric iOS `tablist` maps to no trait at all; `radio` adds "radio button" and the checked state (8.2).
2. **One undo clock: the toast's own dismissal.** Action toasts keep never timing out, and no feature keeps a second deadline. That makes NS-01-R38b true by construction and needs no Switch Control read. Eval B s4.3 designs a timed window instead (Conflict E1).
3. **NS-32-R14 is a one-line fix with a P0 test**: `prefs.ts:116` ignores `quiet` (eval B s2.6 item 3 and s8 item 8 found the same). It must land before the Quiet control (BL-985).
4. **The budget keeps the total at 60**: plan notices first, budgeted notes fill what they leave, through one `allocate()` both schedulers call (eval B s2.6, s7.2 item 8). That satisfies NS-32-R4b and R7 and NS-13 3a item 7 (Conflict P1).
5. **NS-37's copies are written in place by `scribe-photo`**, because expo-file-system 57.0.7 has no backup-exclusion API. The sweep and the eraser learn the copy names in the same slice (NS-37-R5, P0). Names follow eval B s1.3: `makeCopy`, `derivatives.logic.ts`, `regen.ts`.
6. **NS-01-R17b needs `scribe-photo` to keep the `Progress` it discards** (`ScribePhotoModule.swift:167`), send it as an event, and add a native `cancelPick`. Eval B does not cover it.
7. **The account layer is designed once, in eval B s2.8**, and BL-961 owns its PR. These cards only consume the scope (6.1).
8. **NS-34 says what one person can measure by hand.** Rows that need markers say "not measured" until the `perf` profile exists, and a missed or unmeasured row names the flag it holds.

## 1. Shared decisions (several cards use them)

**1.1 One undo clock (NS-33-R15, NS-01-R38a to R38c, NS-06-A2b, NS-07-C5-6, BL-954).**

*Facts.* An action toast never times out (`components/ui/toast.tsx:10-12`); the timer runs only without an action and never with a screen reader on (`:70-77`). COMPONENTS 2.14 cites DESIGN_LANGUAGE 11.5, "no time-boxed UI". #839's `undoPhotoChange` refuses after its own `expiresAt` while the toast stays, so a dead Undo is left on screen (R38b). No other undo on develop keeps a deadline (grep). React Native 0.86.3 has no Switch Control query (`AccessibilityInfo.d.ts`).

*Rec.* A pure `createUndo({ revert, commit })` in `components/ui/toast.logic.ts` returns `{ action, onDismiss }`. `revert` works until `onDismiss`, and `commit` (for a picture, deleting the replaced file) runs once, at Close, a swipe, a screen change or a replacement (`toast.logic.ts:64-65`). The window is then at least "its seconds, or VoiceOver plus its seconds, or until the parent moves on" with no event or Switch Control read, as C5-6 already accepts for a line with no timer. Test `[NS-33-R15]`: an action toast never hides on a timer, and a scan fails on an `expiresAt` in an undo path.

*Conflict E1.* Eval B s4.3 and its s5.2 BL-954 slice propose `lib/undo-window.logic.ts`, a `useUndoWindow` hook reading `announcementFinished`, Switch Control from a new `scribe-system` module, and a Toast `expires` prop that closes the toast at `max(shown, announced) + stated` (cap 60 s). Evidence for the clock above: the built toast and DESIGN_LANGUAGE 11.5 already go beyond T4 with no time limit, while a closing window is a new time limit (WCAG 2.2.1) and adds native code for no gain to the parent. Both designs expire the toast and the action together. Karma rules; `toast.tsx` is mine (eval B s1.1).

**1.2 One progress bar.** Fact: four hand-made bars exist (`app/settings/storage.tsx:51-61`, `app/review.tsx:1312`, `app/settings/export.tsx:228`, `components/speech/speech-consent-card.tsx:167`), and `@rn-primitives/progress` is not installed. **Rec:** lift the `storage.tsx` bar into `components/ui/progress-bar.tsx`, with no new library: `value`; `label` required; `role="progressbar"`, which gives `UpdatesFrequently` on Fabric (`accessibilityPropsConversions.h:104-106`); 0 to 100; no animated fill; tokens only. The other three sites move in a later one-concern PR. NS-01-R17b and NS-07-C28 use it.

**1.3 Token gaps (my duty 2).**
- (a) **`mediaFrame`**, a semantic hairline for pictures. Dark `line` `#33302C` on `bg` `#161412` is 1.40:1 (computed here), so NS-01-R41 cannot be both "the line colour" and 3:1 (Conflict P3). Rec: dark `#716A62` (3.15:1 or higher on `bg`, `surface` and `surfaceRaised`, per Review B on #864; `#6B655D` was 2.91:1 on `surfaceRaised`). Light keeps `line` (1.26:1, a hairline, not a 3:1 boundary), and Increase Contrast uses its `line` (`tokens.ts:77, 84`). Only the dark and Increase Contrast pairs join `NON_TEXT_PAIRS` in `tokens.test.ts`; whether light needs a 3:1 frame is product's call under NS-01-R41 (P3).
- (b) The progress fill-on-track pair joins `NON_TEXT_PAIRS` at 3:1.
- (c) The Bold Text face map (3.2).

**1.4 Picture work waits for the take.** Fact: `lib/capture/busy.ts` already gives `captureBusy()` and `onCaptureBusy()` (`:20, 25`), true from the recording session until the take ends, paused included. Copy-making, regeneration and any early bake wait on it (eval B s2.3 item 5). Nothing new goes into `speech-gate.ts`.

**1.5 Source scans** (Node, CI, titled with the row). No `tablist` role in `apps/mobile/src` (NS-33-R3). `numberOfLines` on Home, Review, the Book and the letter page needs a large-text guard or a listed reason (R4; today `review.tsx` 2, `components/tonight/draft-card.tsx` 1). Every pan or swipe has a button twin (R10). Every `PhotoFrame` and the BookCover symbol set `accessibilityIgnoresInvertColors` (R11). The Book list and lens never read a stored-copy path (NS-37-R8). Voice Control label tests are BL-984 (c) (eval B s5.2).

## 2. NS-32 One notification budget (wave 1, full)

**Behaviour:** NS-32-R1 to R16. P0: R1, R1b, R4, R4b, R8, R11, R12, R14.

**Facts.** Notes are keyed `${kind}:${date}` (`lib/reminders/planner.ts:313`). The evening is skipped only on note days (`:350`); the horizon is 21 days (`:288`) and the cap 60 (`:290, :371`). `included: c.remindersOn` (`prefs.ts:116`). `listChildren` drops hidden books, not quiet ones (`lib/db/repos/children.ts:54-55`), and nothing in `lib/reminders` reads `quiet`, though `lib/store.ts:388` says the planner does (Conflict K5). Plan notices: at most 4, prefix `plan.` (`lib/billing/plan-reminders.logic.ts:48, 50`); each scheduler cancels only its own ids (`plan-reminders.ts:77`; `scheduler.ts:146-153`). No category or interruption level is set anywhere. `lastSignature` is module memory (`scheduler.ts:45`). expo-notifications 57.0.21 types have `previewPlaceholder` (`NotificationCategoriesModule.types.d.ts:6`) and `interruptionLevel` (`Notifications.types.d.ts:580`).

**Design (adopts eval B s2.6).**
- `lib/reminders/budget.ts`, from #758, holds rows `{ id, group, priority, owner, status }`: `plan` (outside the budget, owner `payments`), then `typedDay` (`planned`, behind NS-18's flag), `birthday`, `monthAge`, `evening` (owner `mobile`). There is no `occasion` row. It keeps #758's `addNotificationClass` (R15), and `allocate({ planPending, budgeted })` cuts the budgeted list so the total stays at 60 (R4b, R7).
- The planner keys by local date, and a pure pick keeps the highest-priority candidate per date. Same-kind notes stay grouped (`monthNoteCopy`); a birthday beats a month note.
- `prefs.ts:116` becomes `included: c.remindersOn && !c.quiet`.
- The back-off and the 35-day horizon are NS-13's (BL-943). R8's test lands here as a guard: it passes on the 21-day horizon and must keep passing after BL-943.
- The scheduler uses category `reminder` (eval B s2.6 item 7). `payments`' module registers category `plan`. Each has a `previewPlaceholder` from PROPOSED keys `reminders.previewPlaceholder` and `planReminders.previewPlaceholder` (BL-965).
- Both schedulers set `categoryIdentifier` and `interruptionLevel: 'active'` on every request.
- The first launch after an update re-plans, keyed by `app.lastPlannedVersion` (eval B s2.1; R16).

**Data and contracts.** No migration and no export or `packages/api` change. One settings key (`app.lastPlannedVersion`, L1). No native module, plist key or entitlement (Unverified: `active` needs none). No flag (eval B s3.1).

**Privacy and threats.** Bodies come only from `packages/content`. Names are off by default (D-025). A plan notice carries no name, count or price. Nothing leaves the phone. The lock-screen threat is met by R12 and R13. No body is logged. A foreign account scope cancels reminders (eval B s2.8; BL-961).

**Performance.** Under 50 ms for 3 children, by Node timing on the fixture (eval B s4.1).

**Tests for each P0 row** (`reminders-budget.test.ts`, eval B s6.1). R1: a 92-day property test (prefs, 1 to 3 children, 2 books). R1b: a birthday in book A and a month-day in book B give 1 (fails today). R4, R4b: a full budget with 4 plan notices due still plans all 4, and the total is 60 or fewer. R8: an injected clock gives no `evening` after day 35. R11: a scan shows bodies come from content imports. R12: with names off over Asha, no name; a plan notice has no digit run or currency. R14: a quiet book gives 0 (fails today). Device: J-N4 (spot), J-N24 and J-N27 (BL-948).

**PRs** (BL-966 slices as eval B s5.2; owner `mobile`; lenses `principal-architect` / `compliance-engineer`):
- (a) `budget.ts` and `allocate`, superseding #758; about 250 lines.
- (b) The planner: one a day, priority, ceiling, quiet; about 350 lines, 4 files.
- (c) Categories, placeholder, interruption level, version re-plan; about 150 lines.

**Order and gates.** Before BL-943, BL-982 and BL-985. Counsel Q41 gates the plan windows of a store build, not this code. **Risk:** iOS behaviour above 64 pending is Unverified; 60 total avoids it. **Way back:** revert.

**OQs.** `typedDay` against `birthday` (CPO; default `typedDay` first). The cap number (#847 Q8; founder; default 1 a day per the locked card; Conflict K1).

## 3. NS-33 Everyone can use it (wave 1, full)

**Behaviour:** NS-33-R1 to R16. P0: R1 to R10, R12, R15, R16. Per-surface targets: eval B s4.2 (adopted).

**3.1 Already built (Fact).** `Text asHeading` (`components/ui/text.tsx:16, 101`). Tab bar Large Content Viewer (`app/(tabs)/_layout.tsx:57`; R13). `ChoiceGroup` radio semantics (`components/ui/choice-group.tsx:76-80, 104-105`). Token contrast 4.5:1 and 3:1 in both themes and Increase Contrast (`packages/design-tokens/test/tokens.test.ts:90-113`; the token half of R8). The cover band stacks at accessibility sizes (`components/book/cover-band.tsx:59, 104-113`), with a 44 pt Months button (`button.tsx:61`). Listen pairs the aura with a clock and a text line (`app/listen.tsx:496-512`; R12 needs a test). Increase Contrast and Reduce Transparency are read (`lib/a11y.ts:129-135`).

### 3.2 Missing, and the fix
| Row | Fact | Design |
|---|---|---|
| R1 | Dateline `Text` has no heading role (`app/letter/[id].tsx:219`) | `asHeading={1}`; the test checks it is the first heading (Conflict P7) |
| R2 | Me `headerTitle` is `copy.settings.title` (`_layout.tsx:91`); title `t.you` (`:87`) | `headerTitle: t.you`, the tab label key; no new words (`content` confirms against the glossary) |
| R3 | #840 `LensRow` is Buttons in a `tablist` | 8.2, plus the 1.5 scan |
| R4, R7 | Not walked | Truncation scan; device walk at AX5 plus Bold Text on SE 3 (BL-948) |
| R5 | Loops use `useReducedMotion` (`components/ui/lamp.tsx:129`) | Device row; MOTION rules (opacity only, front screen only) |
| R6, R9, R10 | Not walked | Gesture scan, BL-984 (c) Voice Control label tests; device rows (J-N20) |
| R11 | No `accessibilityIgnoresInvertColors` anywhere; the prop exists (`ViewAccessibility.d.ts:321`) | Both `PhotoFrame` branches (mobile's file, eval B s1.3) and the BookCover symbol (`components/book/book-cover.tsx`) |
| R12 | Line and clock exist | Test: each Listen phase has a text element naming it (BL-984 (b)) |
| R14 | Nothing reads Bold Text; `faceForClassName` maps weight utilities only (`components/ui/fonts.ts:72-80`); bundled Mukta Regular, Medium, SemiBold, Literata Regular, Medium, Italic, Tiro Regular only; React Native has `isBoldTextEnabled` and `boldTextChanged` (`AccessibilityInfo.d.ts:15, 52`) | Device check first (BL-984). The face map steps each face up one weight and lives in `components/ui/fonts.ts` (mine); the hook is `mobile`'s (eval B s4.4). Add Mukta Bold and Literata SemiBold through `fonts/build_fonts.py`. Tiro: OQ (Conflict P4). Conflict E4 on the hook's path |
| R15 | 1.1 | 1.1 |
| R16 | No XCUITest target; `apps/mobile/e2e` is Maestro (eval B s7.1 item 11 agrees) | A standalone UI-test project, `apps/mobile/a11y-audit/`: it launches the simulator build by bundle id, opens each named screen by Expo Router link on Asha at AX5, and calls `performAccessibilityAudit()`. The CI job is a proposal under `docs/ops/proposed/` (D-124). Unverified: the bundle-id launch and the content-size argument |

**Data and contracts.** No data, sync, API or flag. Native: two font files add `UIAppFonts` values through the expo-font plugin (no new key, entitlement or usage string; a native build counts under D-092). The audit project is outside the app binary.

**Privacy and performance.** Labels carry no child name beyond what the screen shows, and none is logged; there is no trust boundary. A Bold Text change re-measures text once.

**Tests.** Each row names its test; files per eval B s6.1 (`a11y-headings.test.ts`). R4 to R7, R9 and R10 are device rows on SE 3 (iOS 17 and the latest) in BL-948, Asha install only.

**PRs, in merge order.**

| PR | Owner | Lenses A / B | Scope |
|---|---|---|---|
| 33-1 (BL-927) | `design-systems` | `qa` / `compliance-engineer` | Audit note `docs/design/reviews/NS-33-ACCESSIBILITY-FLOOR.md`: each fix by file and line, test against phone. Duty 3, `COMPONENTS.md` back in step with the code: 2.14 Toast (no `durationMs` for action toasts; `createUndo`); 2.23 PhotoFrame (React Native `Image`, not the uninstalled `expo-image`; fixed label, never "Photo from {date}"; fit; `mediaFrame`; invert); 2.9 SegmentedControl marked not built, with `ChoiceGroup` segmented as the built single choice. Docs only |
| BL-928 (a), (b) | `mobile` | `principal-architect` / `design-systems` | (a) R1, (b) R2, as eval B s5.2; off the Book header while #798 is in review |
| 33-3 | `design-systems` | `principal-architect` / `qa` | `createUndo` (if E1 goes this way), `progress-bar.tsx`, the 1.5 scans; about 300 lines |
| 33-4 | `design-systems` | `principal-architect` / `mobile` | Tokens: `mediaFrame`, the progress pair, the Bold Text face map; two subset faces; regenerated `dist/` CSS; tests |
| BL-984 (a) to (c) | `mobile` | `principal-architect` / `design-systems` | Bold Text hook, recording state, Voice Control labels (eval B s5.2); invert opt-outs; after 33-4 and the device check |
| 33-6 | `qa` | `principal-architect` / `ops` | The audit project and the CI proposal (R16); size M |

**Order.** After #840 (R3), NS-01 (R11), BL-954 (R15). G4 needs the device walk.

**OQs.**
- Which accessibility features to declare: founder; default none until the walk passes.
- Tiro under Bold Text: `design-systems` with the founder (eval B s7.1 item 5); default, under Bold Text only, Devanagari falls back to the system Devanagari face at semibold, after a device check.
- The audit route and its CI cost: `qa` with `ops`, cost by the founder (eval B s7.1 item 11); default the standalone project, nightly first.

## 4. NS-34 It feels quick on the smallest phone (wave 1, full; a run sheet, no code)

**What gets written.** BL-930 rewords `docs/prd/v2/06-nfr.md` rows 42 and 216. BL-929 writes `docs/qa/run-sheets/NS-34-SE3-SPEED.md`. Each run files `docs/qa/evidence/<date>-<build>-se3.md` from `TEMPLATE.md`, under its README: units kept, thermal state in words, screenshots and videos never committed. Node timing tests are tripwires, never evidence (eval B s4.1).

**Every run's header (R3, R5, R7).** Device model, iOS version, marketing version and build, and the EAS fingerprint. A separate install signed in to the Asha test account (D13). The 06-nfr section 0 protocol (unplugged, 50% brightness, nominal thermal state at start, 2 minutes idle between runs). iOS 17 and the latest, which needs two phones or one SE 3 on each; the founder first says which phones he holds (14 section 5).

**Methods today.**
- Tap latency: a second phone films the SE 3 at 240 fps; count frames (4.2 ms) from finger contact to the first frame of the new state. For Speak, also the system microphone indicator (Unverified as a proxy). S1-03 already counts 60 fps frames (`docs/qa/DEVICE_TEST_PLAN.md:85`).
- Frames and memory: Instruments Animation Hitches and Allocations on a Release build signed for development from the founder's Mac (Assumption: no attach to a TestFlight build; Unverified).
- Battery: the 06-nfr method. Size: the App Store Connect report.

**Rows.** "Holds" is what a miss stops (R2). Samples are 200 unless stated (Conflict P5).

| Row | Target (source) | Method now | Holds |
|---|---|---|---|
| 1 Speak to microphone live, cold and warm | p95 500 ms (F04-REQ-023) | Slow-motion video, 200 taps | Any store build (core loop) |
| 2 Cold start, online and airplane | p50 1.2 s, p90 2.0 s (A-NFR-001) | Video as S1-03; Instruments App Launch | Any store build |
| 3 Warm start | p50 400 ms | Video | Any store build |
| 4 Screen change starts; controls usable | 100 ms; 350 ms | Video | That screen's motion change |
| 5 Hand-offs: Home to Listen, Listen to Review, Review to Book, card to page | 900 ms each | Video | That screen's motion change |
| 6 Save hand-off; local save commit | 2,000 ms; p95 200 ms | Video; commit not measured until markers | Any store build |
| 7 Book and letter page scroll: empty, year-5, 1,000 letters with 300 pictures, AX5 | No frame over 16.7 ms | Animation Hitches | `EXPO_PUBLIC_PHOTOS` (NS-37) |
| 8 Loops under Reduce Motion and Low Power Mode | None moving | Watch each screen 10 s | That screen. Low Power Mode has no guard yet (eval B s7.2 item 9) |
| 9 Switch child | p95 300 ms | Video | NS-14 |
| 10 Find first row | p95 300 ms (NS-02-R2) | Video (S1-205) | `EXPO_PUBLIC_BOOK_SEARCH` |
| 11 Idle drain; recording battery | 1% a day; 2% or less per 10-minute take | 06-nfr method | Any store build |
| 12 Memory recording; idle after first run | Under 40 MB above idle; under 150 MB | Allocations | Any store build |
| 13 Download; caches | Under 40 MB; 50 MB or less | ASC report; iPhone Storage | Any store build |
| 14 Thermal | No take refused at `serious` | Observed state | none (watched) |
| 15 Spot runs: under 1 GB free; Low Power Mode | As row 1 | Video, 20 taps | As row 1 |
| 16 iPad smoke | Capture, Keep, read | By hand | Any store build |

**Rules.** A row is met, missed, or not measured with its reason. A missed or unmeasured row holds its feature until it is fixed or the founder changes the target in writing (R2). Markers (R6) do not exist; when they land, a marker is an event name and a number only, tested by `perf-markers.test.ts` (eval B s6.1).

**Fixture.** A 1,000-letter, 300-picture Asha book on a phone does not exist (`src/dev/asha-seed.ts` holds a few letters). Adopt eval B s6.4: a `perf` or `asha` EAS profile whose first launch seeds the extended Asha book, with pictures generated in code, and which the production preflight refuses.

**PRs.** BL-930: an interactive `product` session. BL-929: `qa`. Both have lenses `design-systems` / `principal-architect`. Evidence PRs: `qa` or the founder; lenses `qa` / `compliance-engineer`; `no-real-family-data` runs.

**Risk.** Rows 1 to 6 cannot reach 200 samples each by hand, and rows 6 and 12 need markers or Xcode. **Way back:** the founder accepts a stand-in count per row in writing (RR-8), or the `perf` profile lands first.

**OQ.** Who runs the sheet: founder; default the founder, on the Asha install.

## 5. NS-35 Only Home starts a letter (built; record only)

**Built in #828** (`5f5dfaf4`, 22:40 UTC 19 Nov): `lib/capture/start-capture.ts`; the closed source list (`start-capture.logic.ts:18-20`); `apps/mobile/test/navigation-one-entry.test.ts`, which checks N1, N2 (a to c), N3 (a to g), N4, N5, N6 (a, c, e) and N10 (its header, `:9`). R3, R4 and R7 rest on `lib/reminders/scheduler.ts:257` and `lib/resilience/start-intent.ts`. Eval B s2.2 keeps this shape.

**Open.** R6: N2 (d to f) waits for `content`'s tab-job strings (BL-965) and N6 (b, d) for the glossary rows. N7 can run once #840 merges and must find no start in the lens (NS-01-R23b). N8 waits for Find, N9 for Share. P-8 puts NS ids in test titles (`qa`). Nothing to design.

## 6. NS-36 New kinds of data follow the letter (full for pictures and Find; outline for seals and Firsts)

**Behaviour:** NS-36-R1a to R12. P0: all except R9.

**Facts.**
- X10 is still open: L2 for `entry_id` and `draft_id` at ADR 0028 lines 34-35 and in #835's migration comment (lines 15-16), and for `letter_search_rows.*` at ADR line 184. Eval A s1.6 sets them to L3.
- The latest content tuple of `entries_family_rules()` is at `20261015030000_v1_wire_contract_columns.sql:174-186`, and `book_entries` at `:229-249` (eval A s0).
- No test ties the push's columns (`packages/api/src/server/sync.ts:263`) to that tuple and view.
- Export is 1.6.0 (`lib/export/schema.ts:90`), `photo: null` (`:140`).

**Design and tests, by rule.**
- **Rules 1 and 3, pictures (R1a to R1c; P-5).** #835's erasers hide by join and purge file, then row, then index (ADR 0028 D5). Tests in one file, `data-follows-letter.test.ts` (eval B s6.1), titled with the NS-36 ids, also covering NS-37's copies.
- **Rule 3, Find (R8).** One definition: the view's WHERE becomes `visibilitySql('find')` from `packages/core/src/visibility.ts` (eval B s1.2, s2.4). It reads the instant (ADR 0028 D4), so a time zone change changes nothing. `reindexLetter` runs in the letter's transaction. Test `[NS-36-R8]` in BL-952.
- **Rule 2, export (R2, R5, R7).** BL-868 must be in a PR for the founder before BL-933 merges (CR-62 item 3). Minors go in merge order: 1.7.0 photos, then Firsts, then seals (eval A s3; Conflict P2).
- **Rule 4 (R6).** BL-960 (`privacy` with `data-architect`; the founder merges `docs/legal/**`) adds the rows for the stored and smaller copies, photo words, place, the Find index, Firsts and seals.
- **Rule 5 (R10).** Server: `classification.test.mjs`, which eval A s5 extends. Phone, new: `apps/mobile/test/local-classification.test.ts` parses each local migration's column comments from 11 on (#835's form `//   <col>  L<n>`; the DB-R25 rule, eval A s1) and fails on a column with no level or an id below L3. R4 is the acceptance record: ADR merged; X10 remains.
- **Rules 6 and 7 (R12).** The J-N18 harness (`test/canary.test.ts`, eval B s6.5) gains photo words, place, a file name and a query.
- **Rule 8 (R11).** New `supabase/tests/entries_content_columns.test.mjs`. Every `entries` column the push accepts must be in the tuple of `pg_get_functiondef('public.entries_family_rules')` and in `book_entries`, or be listed with a reason `data-steward` reviewed. A new unlisted column fails (F12). This generic guard adds to eval A, which covers R11 per migration.
- **R1d (BL-870, ADR 0028 D6; eval A s4 S1).** Drop the author insert and update policies. Add trigger `entries_15_photo_closed`, whose function is revoked from public roles, so there is no `grants.mjs` row. Test `photo_bucket_closed.test.mjs`. `sync` narrows `photo_path` to null in `packages/api`.

**6.1 Account scope (X4, D1): designed once, not here.** Confirmed by reading:
- `lib/first-run/gate.logic.ts:123-125` opens the local book whenever one exists, for any session.
- `lib/sync/ownership.ts:49` throws `AccountMismatchError` only inside `takeOwnership`, so a second account stops sync but still reads the first account's book.
- `currentUserId()` returns the stored owner (`lib/store.ts:432-434`).

**Rec:** adopt eval B s2.8. `scopeOf` returns owner, signedOutHolder or foreign, and a foreign scope reaches no book, letter, picture, Find result, slip, Share or reminder. BL-961 (`mobile`) is the one PR owner. These cards only consume the scope: NS-32 cancels reminders; NS-36 and NS-37 add pictures, copies and the Find index to what a foreign scope cannot reach; NS-33 adds the held screen to the walk.

**Data and flags.** Local migration 11 only (#835); the server migration is BL-870's. No new synced column now. No flag. **X2:** nothing sends a picture or a voice off the phone, and the server refuses pictures (D6).

**Performance.** Delete and restore commit p95 200 ms on SE 3 (section 4, row 6).

**PRs, in merge order.**

| PR | Owner | Lenses A / B | Scope |
|---|---|---|---|
| 36-1 | `mobile` | `data-steward` / `compliance-engineer` | X10 inside #835 before it merges; BL-959 for the ADR text (`data-architect`) |
| 36-2 (BL-960) | `privacy` | `compliance-engineer` / `regulatory-affairs` | Inventory rows |
| 36-3 (P-5) | `mobile` | `data-steward` / `compliance-engineer` | `data-follows-letter.test.ts`; canaries |
| 36-4 | `data-architect` | `data-steward` / `security-architect` | R11 guard test |
| 36-5 | `qa` | `principal-architect` / `data-steward` | R10 phone classification test |
| 36-6 (BL-870) | `sync` | `data-steward` / `security-architect` | Write-deny; `red-team` for `supabase/**` (D-041); founder's `approve-migration` |
| BL-933 | `mobile` | `data-steward` / `compliance-engineer` | Export 1.7.0 (8.3) |

**Outline for seals and Firsts (waves 4, 5).** One visibility clause list (eval B s1.2). Their columns enter the tuple and `book_entries` in their own migrations (eval A s4 S2, S4). Seal publication is option (b), the pull clause (eval A s2.3; eval B s7.2 item 4), which closes this card's OQ (Conflict P6). R3 is a two-phone device row with the seal build.

**Way back.** Flags hide surfaces; files and rows stay; local migrations are never reversed.

## 7. NS-37 The Book stays fast as it grows (wave 2, full)

**Behaviour:** NS-37-R1 to R8. P0: R2, R4, R5.

**Facts.** The lens draws the stored copy at 72 pt in a plain `ScrollView` (#840), while Months is a virtualised `AnimatedSectionList` over chapter sections (`app/(tabs)/book.tsx:78, 433`). `PhotoFrame` is React Native `Image` with `resizeMode="cover"` (#838). `scribe-photo` reads only `Caches/ImagePicker` (`ScribePhotoModule.swift:186`) and caps at 4,096 px and 0.9 (`:50-51`). expo-file-system 57.0.7 has no backup-exclusion API (none in its types or Swift), and pictures stay in the backup (`lib/photos/files.ts:3-4`). #835's sweep ignores a "name of another shape". No Low Power Mode read exists, and `expo-battery` is not installed.

**Design (names and slices adopt eval B s1.3, s2.3, s5.2).**
- **Native.** `makeCopy(source, destination, maxSide)` in `scribe-photo` uses the same ImageIO path, with one constraint added here: both names must be inside `Library/Application Support/photos/` (`<id>.jpg` in, `<id>-512.jpg` or `<id>-1280.jpg` out, checked natively). It writes through a temporary name and a rename in that folder, and sets `isExcludedFromBackup` on the result itself, because JavaScript cannot (R4). Quality 0.85 (PROPOSED); no source properties. No plist key, entitlement or network; BL-878's checklist applies.
- **Which copy each surface reads.** `lib/photos/derivatives.logic.ts` holds the paths and the rule; only `lib/photos/export.ts` reads the stored copy (R8).
- **Regeneration.** `lib/photos/regen.ts` makes a missing copy at idle and after a backup restore (R3). It waits on `captureBusy()` (1.4; R2) and on normal power. The Low Power Mode read is `useLowPowerMode` in `lib/motion.ts` (eval B s7.2 item 9), backed by one native read in eval B's `scribe-system`, not a second module.
- **Erasing.** The sweep learns that `<id>-(512|1280).jpg` belongs to `<id>`. The eraser removes the copies, then the stored copy, then the row (R5). Storage counts copies with their picture.
- **UI.** The lens reads the list copy in the Book's existing `AnimatedSectionList`, whose sections are `photoChapters`, already chapter-shaped in #840 `lens.ts` (R1, NS-01-R53). The letter page reads the page copy. Fit, not crop (8.5). Under Reduce Motion, no fade.
- **Conflict E3:** eval B s5.2 BL-956 (b) says "virtualised `FlatList`". Evidence for `SectionList`: it keeps the month openers as section headers in the Book's own list, with no second list type.

**Data and contracts.** No rows, migration, export or API change (copies are never exported). Flag `EXPO_PUBLIC_PHOTOS`; `killSwitches.photos` hides and never shows.

**Privacy.** Copies are L4 (eval A s1.6), carry no metadata, are excluded from the backup and are never logged with a path. **X2:** they never leave the phone.

**Performance.** As NS-37 section 8. Unverified: React Native `Image` decode thread and cache. Assumption: a 40-row window of 512 px copies is about 32 MB decoded.

**Tests** (`photos-derivatives.test.ts`, eval B s6.1). R2: nothing decodes while `captureBusy()` is true. R4: a segment scan of both copies, and a native stand-in asserts the backup call. R5: purge, let go and the sweep remove all three files. J-N13 on SE 3 for R1, R6 and R7.

**PRs** (owner `mobile`; all after #840 and BL-953, which edits the same Swift file). BL-932 (a), native `makeCopy` and `derivatives.logic.ts`: lenses `principal-architect` / `security-architect`. BL-932 (b), writer, eraser and sweep, and (c), readers and `regen.ts`: lenses `principal-architect` / `data-steward`. BL-956 (a), (b): lenses `design-systems` / `principal-architect`.

**Risks.** A native change to a module merged today. Copy names unknown to ADR 0028 D1 and NS-01-R34 (Conflict K6). **Way back:** flag off; Erase everything lists the folder. If decode still misses R7, `expo-image` is the fallback, as a new dependency with its own review.

**OQ.** Regenerate under Low Power Mode: `mobile`; default wait for normal power.

## 8. NS-01 Photo with a letter (in review; record plus open rows)

**8.1 Built, and where (merge order).** Merged: #834 `scribe-photo` (`76a4a5d7`) and #841 file layer (`1513b265`). Open: #842 hardening (now on develop); #835 migration 11, `entry_media`, sweep; #836 stored copy; #837 picker port; #838 photo start; #839 Review and letter page; #840 lens. Rows met and not met are as the card's section 10; data is ADR 0028 D1, D2, D5, D6. Eval B s5.2 proposes re-cutting #835 to #839 where no counted review exists. The Debug simulator link failure is `ops`'s.

### 8.2 The lens control (NS-01-R48, NS-33-R3; P0 through R3)
**Fact.** `LensRow` (#840) is two `Button`s with `accessibilityState.selected` inside `accessibilityRole="tablist"`. On Fabric iOS, `tabbar` maps to the TabBar trait and `tablist` to none (`react-native/ReactCommon/.../accessibilityPropsConversions.h:100-102`), so VoiceOver hears two buttons, one "selected", and no single choice. `radio` adds "radio button" and "checked" or "unchecked" (`RCTViewComponentView.mm:1523-1538`).

**Rec.** `ChoiceGroup` with `layout="segmented"`. Its `label` comes from a PROPOSED key `photos.book.lens.groupA11y`; the options keep #840's `photos.book.lens.months` and `.photos`; `value={lensMode}`; `testID="book.lens"` keeps the E2E ids `book.lens.months` and `book.lens.photos` (`choice-group.tsx:60`). It gives radio semantics with exactly one checked, 48 pt (`min-h-12`), stacking at large text (`:61`), selection by fill, a 1.5 pt accent edge and a check (never colour alone), and a `tap` haptic.

Not `ChipGroup`: its container has no group role (`:203-208`), and a `Chip` is 36 pt, reaching 44 only through hitSlop. No native SegmentedControl exists.

Best inside #840 before its first review (0 reviews at `cc94d0d3`), else BL-956 (b) (eval B s5.2). Tests `[NS-33-R3]` and `[NS-01-R48]`: one `radiogroup`, two `radio`s, exactly one checked; plus the 1.5 scan.

### 8.3 Export 1.7.0 (BL-933; NS-01-R14, NS-36-R2, R5, R7; held for the founder's BL-868 merge)
**Files.**
- `lib/export/schema.ts`: `EXPORT_SCHEMA_VERSION = '1.7.0'`, an `ExportPhoto` type, JSON schema `photo: oneOf [null, object]` with `additionalProperties: false`, and a 1.7.0 entry in its versioning comment.
- `build.logic.ts`: `entry_media` becomes `photo`; `counts.photos` counts files written and excludes Recently deleted.
- `pack.ts` writes bytes at `photos/<entry_id>/<media_id>.jpg`; `verify.ts` checks sha256 as for audio.
- New `lib/photos/export.ts`.
- README and `index.html` lines from PROPOSED `content` keys. The estimate adds picture bytes (F15-REQ-010).

**Golden and tests.** Freeze today's golden as `_v1.6.0/`, then regenerate with one Asha picture (`test/helpers/asha-photo.ts`, ADR 0028 D2; fixtures do not count toward CODE-R02). Tests: `[NS-01-R14]`, `[NS-01-R6]` (export bytes), `[NS-36-R5]`, `[NS-36-R7]` (1.6.0 rejects, 1.7.0 reads).

**X2.** No new path: the parent hands the ZIP to the iOS share sheet, as recordings go today. `security-architect` reads it as a review lens.

**PRs** (eval B s5.2 slices; owner `mobile`; lenses `data-steward` / `compliance-engineer`): (a) `lib/photos/export.ts` and schema 1.7.0; (b) the golden. Both wait for BL-868 in a PR for the founder, and for #835 and #836.

### 8.4 iCloud progress and native Cancel (NS-01-R17b; P-1, which the BACKLOG preamble calls BL-951; not in eval B)
**Fact.** `copyPicked` discards the `Progress` of `loadFileRepresentation` (`ScribePhotoModule.swift:167`). #837's port has an `onProgress` it never calls and a `cancel` that settles only in JavaScript while the download goes on.

**Native.** Keep the load's `Progress` on the session and observe `fractionCompleted` with KVO. Send `onPickProgress { fraction }`, a number only, at most every 250 ms or 2%, and only after the load has run 300 ms, so a local picture never flashes progress (PROPOSED). `cancelPick()` marks the session cancelled, calls `progress.cancel()`, removes the partial file and resolves null. No plist key or entitlement.

**JavaScript.** The port forwards `onProgress`; `cancel` calls `cancelPick`.

**UI** (Home's photo start, Review, the letter page). One row with `ProgressBar` (1.2), labelled by PROPOSED `photos.capture.iCloudProgressA11y` (README appendix A's one "progress" exemption), and a quiet 44 pt Cancel using the existing cancel key. One polite announcement at start, never repeated. Offline ends in R46's line.

**Tests.** A fake native emitter covers the throttle, the 300 ms floor, and a cancel that settles once and discards a late copy. Device row: an Asha picture kept only in iCloud on a test Apple ID with Optimize Storage, online and in airplane mode.

**PR.** `mobile`; lenses `principal-architect` / `security-architect`; after #840 and BL-953 (same Swift file); BL-878 first. Unverified: `fractionCompleted` advancing for iCloud loads, and `cancel()` stopping the download.

**8.5 My open items, and Conflict E2.**
- **O-4:** 88 pt from AX3 (R39). At AX5 on the SE 3 (375 by 667 pt), a full-width 4:3 thumbnail is about 245 pt and pushes Speak below the fold. Zoom remains for a closer look.
- **O-5:** fit, never crop (R42), everywhere. The frame takes the picture's aspect ratio inside a maximum box (Ready 160 pt high, 88 pt from AX3; lens 72 pt on the long side), so a panorama shrinks instead of losing its edges. The border is `mediaFrame`.
- **Conflict E2 (BL-955, NS-01 O-3).** Eval B s2.3 item 2 writes the stored copy as soon as the draft row exists, and Listen creates that row on Speak, so a HEIC or rotated picture would be re-encoded during the take. The re-encode decodes (`ScribePhotoModule.swift:208-214`, `CGImageSourceCreateThumbnailAtIndex`), which breaks NS-37-R2 (P0). Rec: bake at Ready before Speak, or once `captureBusy()` turns false; never during.

## 9. NS-02 Find (in review; record only)

**Built in #798** (`7f36031a`, ready, +2,511 / -12 in 37 files; size exception #847 Q4): `lib/find/*`, `components/find/*`, the `store.ts`, repos and `sync/engine.ts` hooks, `killSwitches.bookSearch`, `find.en.ts`. Data is ADR 0028 D4, D5; #799 is the inventory row.

**Open, through BL-952**, in the card's slice order (eval B s5.2, s8 item 4): R35 (batches of 200), R37 (announce once), the debounce (O-1), the view on `visibilitySql` with the account clause (eval B s2.4), device rows R2, R20, R21, R35, R36 (S1-205), and `[NS-36-R8]`.

**OQ-3 is mine: no count.** WCAG 4.1.3 asks that the status be announced, and "Letters found" and the no-match line already tell none from some. Sighted parents see no number either, and a VoiceOver user reaches the end of the list by swiping. Close OQ-3 with R11 as written.

## 10. NS-07 Remaining capability rows

**C5 quiet days (outline; BL-974 ready, one slice per eval B s5.2).** The behaviour is built (`components/book/quiet-day.logic.ts`). Work: C5-10's dedupe in `visibleInBook` by author, book and day; a component test for C5-9 (no run visual); an SQL cell proving `book_entries` never serves another author's `not_much` (C5-8). P0: C5-3, C5-9, C5-12. Owner `mobile`; lenses `principal-architect` / `data-steward`. **Risk:** marks from two phones; Undo on one leaves the other's row. OQ to `mobile`; default, Undo tombstones every own mark for that book and day.

**G11 label guard (outline; BL-975 ready).** `scripts/guards/label-effect.mjs` plus fixtures reads the diff, the PR body (`GITHUB_EVENT_PATH`) and `docs/DECISIONS.md` from the base branch. G11-1a and G11-3 use path and token heuristics (network calls with content tokens; new buckets, functions or content columns; SDKs, entitlements and usage strings); G11-2 scans `## NS-` headings. The workflow is a proposal under `docs/ops/proposed/` (D-124). **Risk:** false negatives; the README says the founder's merge is the real gate (G11-4). Owner: Conflict K2.

**C28 printable book (wave 4).** It would rest on the NS-01 stored copies (T3), `renderPdf` (`lib/export/device.ts:259`) and `build.logic.ts` ordering, `isVisibleTo` (eval B s1.2), fit-not-crop pictures, and embedded OFL faces (the fonts are mine, eval B s1.3). Decided first:
- The founder: proof-book spend and page size (OQ-1, OQ-4; defaults no spend, 8.5 by 8.5 inches).
- The CLO: embedding evidence.
- `design-systems` with the CLO: which OFL face covers Arabic and CJK. None is bundled, and a CJK face may not fit the 40 MB app budget (Conflict K3).

The parked rows need no design.

## 11. Merge order across this file (consistent with eval B s5.3)

1. 33-1, then BL-928 (a), (b).
2. BL-966 (a) to (c), then BL-943 and BL-985.
3. 36-1 inside #835. The photo stack in order (#842, #835 to #840), with the ChoiceGroup inside #840. 33-3 before #839 if E1 goes my way, else BL-954 after #839.
4. BL-953, BL-955 (E2), BL-932 (a) to (c), BL-956, then P-1.
5. BL-868 (founder), then BL-933 (a), (b). 36-2 to 36-6 in any order. BL-961 before any reading surface turns on outside the founder's family (eval B s0 item 4).
6. 33-4, the device check, BL-984, 33-6.
7. BL-930, BL-929, then one run sheet per candidate.
8. BL-974 and BL-975 any time; BL-973 in wave 4.

## 12. Risks, open questions, conflicts, unverified

**Top five risks, each with a way back.**
1. NS-33-R16 (P0, G4) has no harness. Way back: Accessibility Inspector's audit by hand on the simulator for each candidate, recorded as a stand-in (RR-8).
2. NS-34's latency rows cannot reach the card's sample counts by hand, and an unmeasured row holds its feature. Way back: a founder-accepted stand-in count per row, or the `perf` profile first.
3. If #839 merges with its own Undo deadline, a dead Undo stays on screen (NS-01-R38b, P0), so G6 holds `EXPO_PUBLIC_PHOTOS`. Way back: 33-3 or BL-954 straight after.
4. NS-37's copies change a native module merged today, and the sweep and eraser must learn the names in the same slice (R5, P0). Way back: flag off; Erase everything lists the folder.
5. NS-32-R14 is unmet; a Quiet control (BL-985) shipped first would notify about a quieted book. Way back: hold BL-985 until BL-966 (b).

**Open questions for the founder or counsel, with defaults.** Founder: which accessibility features to declare (none until the walk passes); who runs NS-34 (the founder, on the Asha install); which phones he holds (he says so before the first sheet; buying is his); the notification cap (1 a day); stand-in sample counts (Speak 200; others 20, marked stand-in, until markers); the CI cost of the R16 audit (nightly only); the BL-868 merge, which gates BL-933; proof-book spend and page size (no spend; 8.5 by 8.5, provisional); Tiro under Bold Text (the system Devanagari face under Bold Text only). Counsel: Q41, the plan windows. CLO: font embedding. CCO: re-read Apple 4.5.4 before submission.

**Conflicts for product (card gaps).**
- P1: NS-32-R4b and R7 (60 plus 4) against NS-13 3a item 7 (60 total). The design keeps 60 total; reword R4b's Given (eval B s8 item 1 agrees).
- P2: NS-36-R5 and ADR 0028 D2 put seals at 1.8.0, and BL-968 puts Firsts at 1.8.0. Use merge order (eval A s3).
- P3: NS-01-R41's "line colour" is 1.40:1 in dark mode. Use `mediaFrame`.
- P4: NS-33-R14: Tiro has only Regular (eval B s8 item 9 agrees).
- P5: NS-34's 200 samples per metric against by-hand methods.
- P6: NS-36's OQ default (a job) against NS-06 B10.1 (option (b)). Eval A s2.3 and eval B s8 item 5 choose (b), and so does this file.
- P7: NS-33-R1's "level 1": React Native on iOS carries no level (Unverified).

**Conflicts for Karma (engineering).**
- K1: #847 Q8 keeps the cap open; the card fixes 1 a day.
- K2: BL-975's owner is "platform"; the card names `security-architect` and `compliance-engineer`.
- K3: BL-973 says Noto Serif; C28-13 names Literata, Tiro and Mukta plus an Arabic and CJK face; and there is the 40 MB budget.
- K4: C5 and G11 have ready rows and no wave.
- K5: `store.ts:388` says the planner reads `quiet`; it does not.
- K6: NS-37's copy names are absent from ADR 0028 D1 and NS-01-R34.

**Conflicts with eval B.**
- E1: the undo clock (1.1).
- E2: BL-955 bakes during the take (8.5).
- E3: `FlatList` against `SectionList` for the lens (7).
- E4: the Bold Text hook path. Eval B s1.3 puts it in a new `lib/a11y/bold-text.ts`, while `lib/a11y.ts` exists and `@/lib/a11y` resolves to it; a folder beside the file splits one module. Rec: add the hook to `lib/a11y.ts`.

**Adopted from eval B:** `allocate()`, category `reminder` and `app.lastPlannedVersion` (s2.6, s2.1); `makeCopy`, `derivatives.logic.ts` and `regen.ts`, and the BL-932, BL-933, BL-928, BL-984 and BL-974 slices (s1.3, s5.2); `captureBusy()` (s2.3); `visibilitySql` for Find (s1.2, s2.4); the account scope, with BL-961 as owner (s2.8); the seeding profile (s6.4); the test file names (s6.1); the local flags (s3.1); `useLowPowerMode` (s7.2).

**Unverified:** that `active` needs no entitlement; iOS behaviour beyond 64 pending; that `previewPlaceholder` maps to `hiddenPreviewsBodyPlaceholder`; heading levels through React Native; React Native `Image` decode and cache; `Progress.fractionCompleted` and `cancel()` for iCloud loads; Instruments on TestFlight builds; the microphone indicator as a timing proxy; `XCUIApplication` by bundle id, and the content-size argument; a heavier Tiro, and the iOS 17 system Devanagari face; VoiceOver reading a `radiogroup` label on Fabric. Nothing was run on a phone.
