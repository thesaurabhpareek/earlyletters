# NFR budgets: one table, by area (readiness run RD-E, file 1 of 4)

Status: proposed, 20 Nov 2026. Author: `ops`. Docs only: no workflow, config, code or content key is changed. Nothing here decides a founder or counsel question, sets a date, or approves a word a parent reads. The other three files: `MEASUREMENT-PLAN.md`, `CODE-QUALITY-GATES.md`, `OBSERVABILITY-WITHOUT-CONTENT.md` (same folder).

## 0. How to read this

**Tags.** [V] verified (file:line, command, or card row id read on 20 Nov). [E] estimate, with its basis. [U] unverified. **Rec** is my proposed number, with its basis. A number from a card or design is marked [V card] or [V design].

**Sources read.** Locked cards at `450bcb4a` (`11-foundations.md` NS-34, NS-37; `01`, `02`, `09` rows named below); `docs/prd/v2/06-nfr.md` (the NFR file the cards cite); `docs/tdd/new-scope/11-foundations.md` sections 4 and 7; newer, unlocked, at `bee01360`: `27-photo-moments-and-media.md` (NS-51, NS-52) and the operations, quality, reliability, lifecycle and AI function addenda. Where the unlocked material differs from the lock I write a Conflict line (section 14). I never build to the unlocked number.

**Reference device.** iPhone SE (3rd generation), A15, 4 GB, on iOS 17 (the floor, `apps/mobile/app.config.ts:44`) and the latest iOS (`06-nfr.md` section 0). The protocol is `06-nfr.md` section 0: unplugged, 50% brightness, nominal thermal state at start, 2 minutes idle between runs, 200 samples unless the row says so, on the Asha install only (NS-34-R5).

**Where a row runs.** `unit` (vitest or node:test, every PR), `CI` (a GitHub job), `sim` (iOS Simulator on a macOS runner), `device` (a real SE 3 by hand until the `perf` profile exists).

**What a miss does.** `HOLD` = the feature behind the row is held from a store build until fixed or the founder changes the number in writing (NS-34-R2, P0 (c)). `BLOCK` = the PR cannot merge (a CI check fails). `WATCH` = measured, an issue opens, nothing is held. A row has one of these; a `HOLD` row with no measurement is "not measured" and also holds (`docs/tdd/new-scope/11-foundations.md` section 4, "Rules").

**Owners** are agent handles (`mobile`, `qa`, `ops`, `design-systems`, `data-architect`, `sync`, `security-architect`). The founder owns the phones and every spend.

## 1. Launch and navigation (reference: SE 3)

| Id | Budget | Source | Measured by | Runs | Owner | On a miss |
|---|---|---|---|---|---|---|
| L-01 | Cold start to first interactive frame: p50 1.2 s, p90 2.0 s, online and in airplane mode | [V card] NS-34 section 3; `06-nfr.md` 2.1 (A-NFR-001) | Perf marker from process start to first `onLayout` of the first route; until then video as S1-03 or Instruments App Launch | device | `qa` runs, `mobile` fixes | HOLD any store build |
| L-02 | First frame: report the time of the first drawn frame next to L-01; no separate gate | Rec, basis: no card gives a first-frame number, L-01 contains it | Same marker harness, one more event name (`first_frame`) | device | `qa` | WATCH |
| L-03 | Work before first frame: no awaited network, model load, sync, or import of PostHog, Sentry, whisper or crypto in `_layout` | [V] `06-nfr.md` 2.1 | A static import scan in vitest, plus the airplane-mode cold start | unit, device | `mobile` | BLOCK (scan) |
| L-04 | Launch-added work, each off the first frame: Find index catch-up in batches of 200, 3 s total at 1,000 letters, never while recording (NS-02-R35); photo sweep adds under 5 ms with 0 discarding drafts (NS-09-R5, PROPOSED); reminders re-plan under 50 ms; copy regeneration waits on `captureBusy()` (NS-37-R2) | [V card] rows named; [V design] `tdd/new-scope/11-foundations.md` 2, 7 | Node timing tripwire per item (not evidence), then one device run of L-01 with all four on the 1,000-letter fixture | unit, device | `mobile` | HOLD (rides L-01) |
| L-05 | Warm start p50 400 ms | [V card] NS-34 section 3 | Same harness, background then foreground | device | `qa` | HOLD |
| L-06 | A screen change starts within 100 ms of the tap; controls usable by 350 ms | [V card] NS-34 section 3 | Slow-motion video; Instruments Animation Hitches | device | `design-systems` | HOLD that screen's motion change |
| L-07 | Named hand-offs within 900 ms: Home to Listen, Listen to Review, Review to Book, card to page | [V card] NS-34 section 3 | Video, 200 samples | device | `qa` | HOLD that motion change |
| L-08 | Switch child p95 300 ms, offline | [V] `06-nfr.md` 2.1; NS-14-R10 | Perf marker, year-5 fixture | device | `mobile` | HOLD NS-14 |
| L-09 | Reminder planner run under 50 ms for 3 children; prompt selection under 5 ms | [V] `06-nfr.md` 2.3 | Node timing, median of 5, on the Asha 1,000-letter fixture | unit | `mobile` | BLOCK at 3x budget (CI jitter), WATCH between 1x and 3x |

## 2. Scrolling and reading at 1,000 letters and 300 pictures (the first of the three at risk)

| Id | Budget | Source | Measured by | Runs | Owner | On a miss |
|---|---|---|---|---|---|---|
| S-01 | Book (Months and Photos lens) and letter page: no frame over 16.7 ms, empty, year-5, and 1,000 letters with 300 pictures; one run at AX5 plus Bold Text | [V card] NS-37-R1; NS-34 row 7 (`11-foundations.md` section 4 table) | Instruments Animation Hitches on a Release build signed for development; J-N13 (`14-test-plan.md:50`) | device | `mobile` | HOLD `EXPO_PUBLIC_PHOTOS` |
| S-02 | Home scroll: the same bar as S-01 | Rec, basis: NS-34 names the Book and the letter page only; Home holds the same cards | Same | device | `mobile` | HOLD the screen's change |
| S-03 | Book first render with 1,200 letters p95 500 ms; a chapter of 60 letters first paint p95 500 ms | [V] `06-nfr.md` 2.3 (F09-REQ-011), "No" gate | Perf marker, year-5 fixture | device | `mobile` | WATCH |
| S-04 | A list copy's first decode p95 50 ms, off the UI thread | [V card] NS-37-R7 (PROPOSED number) | Perf marker around the decode | device | `mobile` | WATCH, then S-01 decides |
| S-05 | The list reads only list copies, the page only page copies; only export reads the stored copy | [V card] NS-37-R8 | Source scan in vitest (`[NS-37-R8]`) | unit | `mobile` | BLOCK |
| S-06 | Video poster in the lens and the letter page: same list-copy rule and the same S-01 bar; a video never autoplays or decodes in a list | Rec, basis: NS-52-R41 (poster frame in the same order), NS-52-R13 (plays only on tap) | Same as S-01 with the 20-video fixture (`MEASUREMENT-PLAN.md` section 3) | device | `mobile` | HOLD `EXPO_PUBLIC_VIDEO` (PROPOSED flag, NS-52-R42) |
| S-07 | Find first result row p95 300 ms after the last keystroke, 1,000 letters, 20 runs of 20 queries | [V card] NS-02-R2 | Video (S1-205) or marker | device | `mobile` | HOLD `EXPO_PUBLIC_BOOK_SEARCH` |
| S-08 | Find index rebuild: 1,000 letters in 3 s, batches of 200, no JS frame over 50 ms; index write adds under 20 ms p95 to a save | [V card] NS-02-R35, R36 (PROPOSED) | Node tripwire plus device | unit, device | `mobile` | WATCH (blocks the flag in production, not the build, NS-02-R20 text) |

## 3. Capture, save and durability

| Id | Budget | Source | Measured by | Runs | Owner | On a miss |
|---|---|---|---|---|---|---|
| C-01 | Tap Speak to microphone live p95 500 ms, cold and warm, 200 taps | [V card] NS-34 row 1 (F04-REQ-023) | 240 fps second-phone video, or a marker | device | `qa` | HOLD any store build (core loop) |
| C-02 | Local save commit p95 200 ms; visible save hand-off 2,000 ms | [V card] NS-34 section 3; `06-nfr.md` 2.2 (DATA-REQ-048) | Marker around the transaction (none yet) | device | `mobile` | HOLD |
| C-03 | Attach one picture: thumbnail p95 1,000 ms from picker close; stored copy written p95 1,500 ms, off the UI thread | [V card] NS-01 "Slow" row (`01-photo-with-a-letter.md:84`) | Marker, 200 picks of the 300-picture fixture | device | `mobile` | HOLD `EXPO_PUBLIC_PHOTOS` |
| C-04 | Attach one video (60 s, 1080p): re-encode under 60 s with progress throughout, foreground only | [E] NS-52 section 8 (ASSUMED; the spike measures) | The NS-52 spike on an SE 3 | device | `mobile` | HOLD `EXPO_PUBLIC_VIDEO` |
| C-05 | Typed autosave 500 ms after the last keystroke; at once on inactive | [V] `06-nfr.md` 2.2 (F04-REQ-011) | Unit with a fake clock | unit | `mobile` | BLOCK |
| C-06 | Kill during save: 0 losses in 500 Simulator kills and 50 on SE 3; every kill ends in a letter whose `audio_sha256` matches or an intact draft; `PRAGMA integrity_check` ok | [V] `06-nfr.md` 7 | Kill harness (`apps/mobile/e2e/kill/*`, workflow `kill-harness.yml`): 5 runs a mode on a PR touching capture paths, 50 nightly, 500 at the gate | sim (SE 3 by hand) | `qa` | HOLD any store build |
| C-07 | Kill while recording: 50 of 50 takes keep a row, 0 files deleted, 49 or more of 50 play to within 5 s | [V] `06-nfr.md` 7 | DL-01 in the same harness; SE 3 by hand | sim, device | `qa` | HOLD |
| C-08 | Kill while attaching a picture or video: 0 orphan files, 0 rows pointing at a missing file, the words intact | Rec, basis: NS-01-R36 (sweep), NS-52-R8, R11; extends the four crash points in `apps/mobile/e2e/kill/protocol.mjs` | Two new crash points: `after-copy-before-row`, `after-row-before-sweep` | sim | `qa` | HOLD the media flag |
| C-09 | Transcode, copy-making and regeneration never run while a take is recording; nothing is decoded during a take | [V card] NS-37-R2 (P0); NS-52-R33 | Unit with `captureBusy()` true | unit | `mobile` | BLOCK |
| C-10 | Local playback start p95 300 ms; clean and mark a 300-word transcript p95 300 ms | [V] `06-nfr.md` 2.2 | Marker | device | `mobile` | HOLD |

## 4. Memory (the second at risk, with S-01)

| Id | Budget | Source | Measured by | Runs | Owner | On a miss |
|---|---|---|---|---|---|---|
| M-01 | Idle after first run under 150 MB resident; recording under 40 MB above idle | [V card] NS-34 row 12 | Instruments Allocations, 10-minute take | device | `mobile` | HOLD |
| M-02 | Book with 1,200 letters, no pictures, under 120 MB; with 300 pictures under 150 MB | [V] `06-nfr.md` 10; [V card] NS-37-R6 (PROPOSED) | Instruments, scrolled end to end | device | `mobile` | WATCH, then HOLD with S-01 |
| M-03 | One Find adds at most 50 MB over the Book's baseline at 1,200 letters | [V card] NS-02-R20 (PROPOSED) | Instruments | device | `mobile` | WATCH |
| M-04 | Video attach, Save a copy and export stream to disk; peak memory under 150 MB | Rec, basis: NS-52 section 8 "stream, never hold"; `06-nfr.md` 2.5 export peak 150 MB | Instruments during a 100 MB video copy | device | `mobile` | HOLD `EXPO_PUBLIC_VIDEO` |
| M-05 | A 40-row window of 512 px list copies about 32 MB decoded | [E] `tdd/new-scope/11-foundations.md` section 7 (Assumption) | Same run as M-02 | device | `mobile` | WATCH |
| M-06 | Zero jetsam exits in 30 transcription runs per passed language; peak 1.4 GB or less | [V] `06-nfr.md` 2.4 | Lab plus Xcode Organizer | device | `speech` | HOLD that language |

## 5. App size and binary growth (the first of the three at risk)

| Id | Budget | Source | Measured by | Runs | Owner | On a miss |
|---|---|---|---|---|---|---|
| Z-01 | Download of the largest thinned variant under 40 MB, every release build | [V] BRIEF decision 15; `docs/ops/APP_SIZE.md` section 1; `06-nfr.md` 11.1 | App Store Connect size table; `scripts/size/measure.ts --thinning-report` | device | `ops` | HOLD the release candidate |
| Z-02 | Hermes bytecode bundle 12 MB; JS assets 3 MB | [V] `APP_SIZE.md` section 1 | `scripts/size/measure.ts` (JS only, exports the iOS bundle) | CI | `ops` | BLOCK (proposed check, `MEASUREMENT-PLAN.md` section 5); today nobody is blocked |
| Z-03 | CI proxy on the built IPA: fails above 38 MB, warns in a 2 MB band | [V] `06-nfr.md` 11.1 ("[R]") | Proposed job; does not exist | CI | `ops` | BLOCK |
| Z-04 | Any card that adds native code or a target records the thinned size before and after; a PR that adds more than 1 MB to the thinned download needs a line in the PR body naming the owner of that megabyte | Rec, basis: FR-OPS-28 (record per card), the `06-nfr.md` 11.1 working budgets (F14 view 200 KB, widget 2 MB), and 40 MB leaving no room for surprises | App Store Connect for the RC and the preview build, before and after | device | `ops` with the card owner | HOLD the card (NS-34-R2) |
| Z-05 | Bundled fonts under 1.5 MB after subsetting | [V] `06-nfr.md` 11.1 table | Sum of `packages/design-tokens/fonts/*.ttf` | CI | `design-systems` | BLOCK |
| Z-06 | Never in the binary: any speech model, non-English pack, or file over 5 MB matching `*.bin`; no CJK font | [V] `06-nfr.md` 11.1; `APP_SIZE.md` section 4 | IPA contents check | CI | `ops` | BLOCK |
| Z-07 | Caches 50 MB or less | [V card] NS-34 row 13 | iPhone Storage | device | `mobile` | WATCH |

**Facts behind Z-01 to Z-05.**
- The native binary has never been measured: `APP_SIZE.md` section 3 says "not measured yet" [V]. The quality critique of 18 Oct says the same and that "CI has no size gate" (`docs/release/journey/critiques/quality.json:901`) [V]; I found none in `ci.yml` (grep, 20 Nov) [V].
- Linked today and not obviously needed in 1.0: `whisper.rn`, `@react-native-google-signin/google-signin`, `react-native-passkey`, `expo-dev-client`, `expo-system-ui`, `react-dom`, `react-native-web` (from `apps/mobile/package.json`, 62 dependencies) [V]. Each native one adds binary size [U until an IPA is measured].
- The Phosphor cut (the biggest JS cut in `APP_SIZE.md` section 4) is done: icons import per file, for example `components/ui/toast.tsx:19` [V]; no root value import remains (grep) [V]. The 3 Oct number (11.6 MB bytecode) is therefore stale [U].
- Fonts today: 1,373,528 bytes unsubsetted in `packages/design-tokens/fonts` [V, ls]. The NS-33 plan adds Mukta Bold and Literata SemiBold (`tdd/new-scope/11-foundations.md` section 3.2 R14): about 270 KB and 113 KB if the same files are a guide [E], which gives about 1.76 MB, over Z-05. Subsetting (`APP_SIZE.md` cut 3) must come with them.
- I could not run `scripts/size/measure.ts` here: `expo export` fails in this sandbox on the missing `expo-local-authentication` plugin (the known baseline gap) [V, run on 20 Nov]. CI has the module, so the same script can run there.

## 6. Storage per picture and per video; free-space rules

| Id | Budget | Source | Measured by | Runs | Owner | On a miss |
|---|---|---|---|---|---|---|
| D-01 | Stored picture: long side at most 4,032 px, upright JPEG quality 0.85, no metadata segments, in `Library/Application Support/photos/`; 2 to 4 MB each | [V card] NS-01-R37a to R37c, R34; size [E] from NS-52 section 8 (ASSUMED) | Unit on fixtures; device on real HEIC | unit, device | `mobile` | BLOCK (unit) |
| D-02 | List copy about 512 px, page copy about 1,280 px, no metadata, excluded from backup, counted in Me, Storage | [V card] NS-37 section 3, R4 | Segment scan and a backup-flag assertion (`[NS-37-R4]`) | unit | `mobile` | BLOCK |
| D-03 | Byte ceilings per copy: list copy 60 KB or less, page copy 400 KB or less | Rec, basis: [E] a 512 by 384 JPEG at 0.85 is tens of KB and a 1,280 by 960 one a few hundred KB; the first device run sets the final numbers | Fixture test reads file sizes | unit | `mobile` | WATCH |
| D-04 | 1,000 letters with 300 pictures: about 1 GB of pictures (300 x about 3.4 MB with both copies) next to about 230 MB of year-1 audio | [E] arithmetic on D-01 and `06-nfr.md` 11.3 | Seeded book (`MEASUREMENT-PLAN.md` section 3), read in Me, Storage | device | `qa` | WATCH |
| D-05 | A video: at most 60 s, stored at most 100 MB, re-encoded to at most 1080p with every metadata atom removed, in `Application Support/media/` | [V card, unlocked] NS-52-R1, R5 (ASSUMED numbers) | Unit on generated fixtures, device on real files (R39: a validator stricter than the files passes CI and fails phones) | unit, device | `mobile` | HOLD `EXPO_PUBLIC_VIDEO` |
| D-06 | A letter at its limits (6 pictures, 2 videos): up to about 224 MB; the iPhone backup grows by the same | [E] NS-52 section 8 | Arithmetic, then one device letter | device | `mobile` | WATCH |
| D-07 | Free-space rules: under 1 GB, capture starts with a calm line; under 50 MB, no draft is created; under 20 MB mid-take, the take stops and is kept within 30 s; a picture is written only if free space covers it plus 50 MB (PROPOSED); a video copy never starts below twice its bytes plus a margin; export is refused below its estimate plus 200 MB; a model download needs the file plus 1 GB | [V] `06-nfr.md` 11.2, 11.3; [V card] NS-01-R45 (PROPOSED); [V card, unlocked] NS-52-R10 | Unit with a fake free-space reader at each threshold; one device spot run under 1 GB | unit, device | `mobile` | BLOCK (unit); HOLD (device) |
| D-08 | Disk full while making copies: the stored copy is kept, copies are made later, no message | [V card] NS-37 section 5 | Unit | unit | `mobile` | BLOCK |
| D-09 | Hosted media (only if the founder picks Variant B, Q-PM-3): bucket `entry-media`, per-bucket limit, per-account byte cap, totals-only alarms at 60% and 80%; default is no hosted media | [V card, unlocked] FR-OPS-37, FR-OPS-38 | Weekly limits job (`scripts/ops/free-limits.ts`), a proposed workflow not yet applied, fails on NOT CHECKED (to be built) | CI (schedule, proposed) | `ops` | WATCH, founder decides |

## 7. Battery and background work (reminders, copies, moments)

| Id | Budget | Source | Measured by | Runs | Owner | On a miss |
|---|---|---|---|---|---|---|
| B-01 | Idle drain 1% a day or less; recording 2% or less per 10-minute take | [V card] NS-34 row 11 | `06-nfr.md` section 0 method (20 items, coarse steps; a total under three steps reports "under the measurable step" and passes) | device | `qa` | HOLD |
| B-02 | Background work of our own: none, except OS-granted time and local notifications; no location, no polling; transcription, transcode and moment refresh are foreground only | [V] `06-nfr.md` 10; [V card, unlocked] NS-52-R33, NS-51 Q-PM-8 | Source scan for background modes in `app.config.ts`; code review | unit | `ops` | BLOCK |
| B-03 | Reminders: at most 60 pending local notifications in total, plan notices kept first within the 60, one a day, re-plan on first launch after an update, a quiet book plans 0. The ceiling is 60 in all, not 60 plus 4 | [V] NS-32-R4b and R7 as reworded by errata E13 and closure CL-115 (`docs/product/prd/18-errata-after-lock.md`, `GAP-LOG.md`, applied in card 11). **Code today allows 64** (`planner.ts:295` default 60 plus `plan-reminders.logic.ts:48` `MAX_PLAN_NOTIFICATIONS = 4`), so write the test from the new rule: it fails on today's code until the allocator cuts the budgeted list so the total stays 60 (`11-foundations.md` section 2 design, `allocate()`) | Property test over 92 days: total pending at most 60 with 4 plan notices due, plan notices all kept | unit | `mobile` | BLOCK |
| B-04 | Copy regeneration waits for normal power (Low Power Mode off) and for `captureBusy()` false; loops stop in Low Power Mode | [V card] NS-37 section 6; NS-34 row 8 | Unit with an injected power state; watch each screen 10 s | unit, device | `mobile` | BLOCK (unit); HOLD (device) |
| B-05 | Moment index refresh (20,000-picture library) under 3 s on foreground, off the main thread, skipped in Low Power Mode and at critical storage | [E] NS-51-R38 (ASSUMED) | The NS-51-R36 spike | device | `mobile` | HOLD `EXPO_PUBLIC_PHOTO_MOMENTS` (PROPOSED flag) |
| B-06 | Thermal: no take refused at `serious`; transcription pauses between chunks at `serious`, never starts at `critical` | [V card] NS-34 row 14 | Observed state | device | `speech` | WATCH |
| B-07 | Screen kept awake only while recording, playing in Read together or exporting | [V] `06-nfr.md` 10 | Device test | device | `mobile` | HOLD |

## 8. Network use (none for the on-device features)

| Id | Budget | Source | Measured by | Runs | Owner | On a miss |
|---|---|---|---|---|---|---|
| N-01 | Capture makes 0 network requests; Find, pictures, copies, video and moments make 0; a push carries no media path other than null and uploads 0 bytes of media (Variant A) | [V] `06-nfr.md` section 5; [V card, unlocked] NS-51-R26, NS-52-R19 | A network fake in unit tests, plus a proxy capture of the e2e suite | unit, sim | `security-architect` reads, `qa` owns | BLOCK |
| N-02 | Sync never blocks capture, review, save or reading | [V] `06-nfr.md` 4 | E2E with the server stubbed to hang | sim | `sync` | HOLD |
| N-03 | Data per active user per month under 5 MB (text sync only) | [V] `06-nfr.md` 4 ("No") | Network capture over a scripted month | device | `sync` | WATCH |
| N-04 | Speech model download over Wi-Fi by default, resumable, 574,041,195 bytes for the full tier; disk check file plus 1 GB | [V] `06-nfr.md` 11.2 | Unit with fake free space; lab | unit | `speech` | BLOCK |

## 9. Accessibility timing

| Id | Budget | Source | Measured by | Runs | Owner | On a miss |
|---|---|---|---|---|---|---|
| A-01 | Undo windows are timed, with one clock owned by the toast: the toast removes the control and refuses Undo at the same moment; the window never closes while a screen reader is still reading, and it is at least its stated seconds | [V card] NS-33-R15, NS-01-R38a to c, T4; ruled in closure CL-116 C-02 (`GAP-LOG.md`, 20 Nov), cards win (CR-66). Supersedes my first reading ("no time limit", from `tdd/new-scope/11-foundations.md` 1.1 Conflict E1) | Toast test with a fake clock: control removed and `undo()` refused in the same tick; a source scan that no second deadline exists outside the toast | unit | `design-systems` | BLOCK |
| A-02 | Start and stop of recording announced within 1 s under VoiceOver | [V card] NS-34 section 6 (NS-33-R6) | VoiceOver script on SE 3 | device | `qa` | HOLD |
| A-03 | Motion: nothing we draw runs over 300 ms unless named; loops change opacity only, run only on the screen in front, and stop under Reduce Motion and Low Power Mode | [V design] `docs/design/system/MOTION.md` on branch `docs/e2e-ux-20nov` (principle 1); [V card] NS-34 row 8 | Token test plus 10 s watch per screen | unit, device | `design-systems` | HOLD that screen |
| A-04 | AX5 plus Bold Text on SE 3: no truncation, Speak on screen at AX3 with a picture on Ready (thumbnail 88 pt) | [V card] NS-33-R4, R7; NS-01-R39 | Truncation scan; one device walk | unit, device | `design-systems` | HOLD |
| A-05 | Automated audit: zero critical violations at AX5 | [V] `06-nfr.md` 8; NS-33-R16 | XCUITest `performAccessibilityAudit()`, nightly and on a candidate (FR-QAL-10) | sim | `qa` | HOLD (needs the founder's workflow patch) |

## 10. Database: size and migration time

| Id | Budget | Source | Measured by | Runs | Owner | On a miss |
|---|---|---|---|---|---|---|
| Q-01 | Local migration 10 to 11 (and 12 for media, PROPOSED) on the 1,000-letter Asha book: every row byte-identical, nothing queued, every recording plays | [V card] NS-01-R35 (P0 (c)) | Unit on a seeded `node:sqlite` copy | unit | `mobile` | BLOCK |
| Q-02 | Local migration time on that book: 500 ms or less on SE 3, and it never runs before the first frame | Rec, basis: L-01 p90 2.0 s and re-ownership of 240 letters p95 500 ms (`06-nfr.md` 2.3) | Node tripwire for shape, marker on device | unit, device | `mobile` | HOLD (rides L-01) |
| Q-03 | Local database at 1,200 letters, excluding audio and pictures: 25 MB or less, of which the Find index at most 10 MB | Rec, basis: [V card] NS-02-R20 (index 10 MB); the rest [E] about 6 KB a letter | File size read after the seed | device | `data-architect` | WATCH |
| Q-04 | Server read budgets p95: `book_page` 15 ms, `book_full` 25 ms, `search_common` 12 ms, `search_rare` 12 ms, `letter_member` 4 ms, `letter_author` 4 ms at 1,000 families by 400 letters; plan checks on every PR at 250 by 400 | [V] `supabase/tests/perf.test.mjs:36`; header lines 9 to 14 | `npm run test:db:perf`, nightly with `PERF_BUDGETS=1` | CI (nightly) | `data-architect` | WATCH (a nightly is not required; a red run opens a `nightly` issue; the PR plan checks BLOCK) |
| Q-05 | Sync: local apply of a 200-row page under 300 ms off the UI thread; new phone, one year of text p95 30 s on LTE | [V] `06-nfr.md` 4 | Perf marker; lab | device | `sync` | WATCH / HOLD (year-1 row is a gate) |
| Q-06 | Supabase Free limits: 500 MB database, 1 GB storage, 5 GB egress | [V, outside] `functions/operations.md` (pricing page read 20 Nov by that author) | Weekly `scripts/ops/free-limits.ts`; today it prints NOT CHECKED for storage and egress (`docs/ops/runbooks/free-tier-ops.md:26`), and its workflow is a proposal in `docs/ops/proposed/workflows/` | CI (schedule, proposed) | `ops` | WATCH |

## 11. Delivery speed (the build team's own budgets)

| Id | Budget | Source | Measured by | Runs | Owner | On a miss |
|---|---|---|---|---|---|---|
| T-01 | `ci.yml` end to end under 10 minutes; no job's timeout is raised to absorb growth, a growing job is split | [V] `ci.yml:1-5`; FR-QAL-19 | Measured 20 Nov 2026 20:24 UTC: `gh run list --workflow ci.yml --event pull_request --limit 60 --json startedAt,updatedAt,conclusion`, successful runs only, start to last update (includes waiting): 38 runs, min 3.4, median 5.2, max 12.3 minutes. Other readings that day (3.2 to 23.8 minutes, medians 4.6 to 14.6) differ with load and are [U]; so under 10 is a tail risk, not a measured ceiling | CI | `ops` | BLOCK by timeout; WATCH on trend |
| T-02 | Release launch check (`ios-compile.yml` job `launch`): run time 15 minutes or less; wait for a macOS runner 15 minutes or less at p90 | Rec, basis: 14 recent successful runs ran 13.6 to 31.1 minutes (median 22.6) and waited 0 to 155 minutes (median 37.5) [V, gh api, 20 Nov] | `MEASUREMENT-PLAN.md` section 6 | CI | `ops` | WATCH; the cuts are founder proposals |
| T-03 | New hot-path or size check added to a PR run adds under 2 minutes to the longest path | Rec, basis: T-01 leaves about 5 minutes of headroom | Job timings in the run | CI | `ops` | BLOCK the check's own PR |

## 12. The three budgets most at risk

1. **Z-01, the 40 MB download.** The native binary has never been measured, CI has no size gate, `whisper.rn` and several unused native modules are linked, and NS-01, NS-37, NS-51 and NS-52 each add native code (picker, `makeCopy`, a photo-library module, a video encoder path). It is a hard founder decision (15), and a miss is found at the end, on a TestFlight build.
2. **S-01 with M-02, the Book at 1,000 letters, 300 pictures and videos on an SE 3.** No fixture, marker, or device run exists. The lens is a plain `ScrollView` in #840 while Months is virtualised (`tdd/new-scope/11-foundations.md` section 7), the decode path is React Native `Image` (decode thread and cache Unverified), and NS-52 adds posters. A miss holds the Photos flag, and it can only be found on a phone.
3. **L-01 with L-04, cold start 1.2 s and 2.0 s.** Never measured on an SE 3. Launch is where new work lands: a local migration (11, then 12), the Find index catch-up, the photo sweep, the reminders re-plan on version change, flag and kill-switch reads, and 522 source files and about 71,600 lines in `apps/mobile/src` [V, wc, 20 Nov]. A miss holds every store build.

Also at risk, not in the three: the macOS launch queue (section 11, T-02), which delays every mobile PR.

## 13. Cite check for this file

I sampled 32 cites by opening or running each: 31 held as first written, 1 fixed (the weekly limits workflow is a proposal in `docs/ops/proposed/workflows/`, not applied). Held: `ci.yml:1-5` header, the seven job timeouts, `app.config.ts:44`, `perf.test.mjs:36`, `toast.tsx:10-12`, `toast.tsx:19`, `01-photo-with-a-letter.md:84`, `14-test-plan.md:50` (J-N13), `06-nfr.md` sections 0, 2.1 to 2.5, 4, 5, 7, 10, 11.1 to 11.3, NS-34 and NS-37 rows R1 to R8 at `450bcb4a`, NS-52-R1, R5, R10, R33, R39 and section 8 at `bee01360`, FR-OPS-28, 37, 38, FR-QAL-10, 19, 30, `quality.json:901`, `APP_SIZE.md` sections 1 to 4, font byte sizes, dependency count 62. Findings, not errors: the README says the longest CI path is 9 minutes (`.github/README.md:7`) and the header says 10; measured median 4.6 to 14.6 depending on load, max 23.8 (T-01). The README also lists the two required checks (`.github/README.md:28-30`), which do not include the iOS launch job (T-02 note in `MEASUREMENT-PLAN.md`).

## 14. Conflicts and questions

- **Conflict to product (NS-37 vs NS-52):** NS-37 "Not in scope" says video is out; NS-52 (unlocked) puts videos in the Book lens as posters (NS-52-R41). S-06, C-04, D-05, M-04 depend on NS-52 and carry `EXPO_PUBLIC_VIDEO` as a PROPOSED flag. I design to the lock and mark these rows "if NS-52 locks".
- **Conflict to product (NS-37-R6 vs `06-nfr.md` 10):** under 150 MB with 300 pictures (PROPOSED) against under 120 MB without pictures. They do not conflict, but a reader sees two numbers for "the Book"; M-02 states both.
- **Superseded or scoped by errata on the inputs branch (read 20 Nov in `18-errata-after-lock.md` and `GAP-LOG.md` on the inputs branch): E13 (B-03, fixed above); CL-116 C-02 (A-01: timed Undo, fixed above); E34 (NS-52 and video ship after 1.0 behind `EXPO_PUBLIC_VIDEO` and `killSwitches.videos`, so S-06, C-04, D-05, M-04 are post-1.0 rows; pictures stay under `EXPO_PUBLIC_PHOTOS`); E38 (one flag set: `EXPO_PUBLIC_PHOTO_MOMENTS`, `EXPO_PUBLIC_VIDEO`; `EXPO_PUBLIC_MEDIA_ATTACH` is retired; library module `scribe-library`); E42 (NS-33-R16 is a by-hand device row recorded `[stand-in]` until an XCUITest target exists, BL-162, so A-05 has no CI run yet); E35 (NS-52 lands in a new local migration after 11, so Q-01 covers migration 11 only until then).
- **Conflict to product (NS-34 sample size):** 200 samples per metric cannot be reached by hand (Conflict P5 in `tdd/new-scope/11-foundations.md` section 12). Until markers exist, a founder-accepted stand-in count is needed.
- **Founder:** which phones he holds (iOS 17 and the latest); whether `perf` EAS builds count inside the 15 builds a month (FR-OPS-27); who runs the sheet (default: the founder, on the Asha install).
- **Not verified:** any number marked [U] or [E]; every device row (nothing was run on a phone); the size of the native binary; whether Z-04's 1 MB line is the right size.
