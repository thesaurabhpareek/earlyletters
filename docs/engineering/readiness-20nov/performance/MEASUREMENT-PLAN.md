# Measurement plan: harnesses, the Asha seeded book, content-free markers, the CI budget check (readiness run RD-E, file 2 of 4)

Status: proposed, 20 Nov 2026. Author: `ops`. Docs only. Budgets and ids (L-, S-, C-, M-, Z-, D-, B-, N-, A-, Q-, T-) are in `NFR-BUDGETS.md`. Tags: [V] verified, [E] estimate with basis, [U] unverified, Rec = my proposal. Nothing here changes a workflow or config; every workflow change is a patch under `docs/ops/proposed/` for the founder (the Claude GitHub App cannot edit `.github/workflows/`, FR-OPS-34).

## 1. What exists today

| Harness | Where | What it proves | Gap |
|---|---|---|---|
| Kill harness | `apps/mobile/e2e/kill/{protocol,harness,oracle,run-kill-harness,simctl-driver,snapshot}.mjs`; app side `apps/mobile/src/dev/kill-drill*.ts`; workflow `kill-harness.yml` | DL-01 (kill while recording) and DL-02 (kill during save) with plants `none, loss, double, damage` and four crash points (`protocol.mjs:6-13`) [V]. Sizes: PR smoke 5 runs a mode, nightly 50, gate 500 (`kill-harness.yml:10-17`) [V] | Runs on a simulator, not an SE 3. No media crash points. Its `e2e` profile is not a perf build |
| Database perf | `supabase/tests/perf.test.mjs`; `npm run test:db:perf` | Plan checks on every PR (250 families x 400 letters); p95 budgets nightly at 1,000 x 400 (`perf.test.mjs:30-36`) [V] | Server only |
| Size | `scripts/size/measure.ts`, `scripts/size/lib.ts` | Exports the iOS bundle twice (Hermes bytecode and plain), attributes bytes per package, reads an IPA and a thinning report, exits 1 over budget (`measure.ts` header) [V] | Runs by hand; not in any workflow; no baseline file; no native number ever taken |
| Seam guard | `.github/scripts/seam-guard.mjs`, job `seam-guard` in `ci.yml:100` | Exports each store profile and searches for the e2e seam; runs about 4 minutes, only when `BUNDLE_PATHS` (`seam-guard.mjs:80`) match [V] | Already pays for a bundle export: reuse it (section 5) |
| Device baseline | Nothing. `docs/qa/run-sheets/` holds AL-01 to AL-10 and one session sheet; `docs/qa/evidence/` holds `README.md` and `TEMPLATE.md`; BL-929 (the NS-34 sheet) and BL-930 (reword 06-nfr rows 42 and 216) are not written (`docs/BACKLOG.md:3572, 3579`) [V] | Hand rows | The whole of section 2 |
| J-N13 | `14-test-plan.md:50`: 1,000 letters and 300 pictures, Book scroll on an SE 3, no frame over 16.7 ms, P1, device [V] | A register row only | No fixture, no sheet row, no marker |
| Asha seed | `apps/mobile/src/dev/asha-seed.ts`, 210 lines, a handful of letters, used by the web preview (`store-ready.web.ts`) [V] | Idempotent seed through the real store functions | Nowhere near 1,000 letters, no pictures, no videos |
| Trace | `scripts/trace.mjs`, run at the end of `npm test` with `--no-write` (root `package.json` `test`) [V] | Reports P0 rows by test title; report mode "never exits non-zero" (`trace.mjs:27`) | Not a ratchet today (see `CODE-QUALITY-GATES.md`) |
| Free-limits | `scripts/ops/free-limits.ts` | Weekly Supabase limits; storage and egress print NOT CHECKED (`docs/ops/runbooks/free-tier-ops.md:26`). The workflow is a proposal, not in `.github/workflows` [V, ls] | Media buckets only if Variant B |

Measured on 20 Nov, this sandbox (a laptop-class Linux box; not CI) [V]: `apps/mobile` vitest 110 s (292 files, 283 passed, 9 failed on the known missing modules, 5,205 tests passed); `packages/core` tests 19 s; `content` 6 s; `api` 9 s; `analytics` 2 s; trace 1 s; `tsc --noEmit` for `apps/mobile` 18 s. In CI the `unit` job plus `typecheck` ran in about 3 minutes (run 44781265818: `unit` 17:14:10 to 17:17:17) [V].

## 2. Harnesses to build or reuse

| Id | What | Reuse or build | Proves | Cost (see section 7) |
|---|---|---|---|---|
| H1 | `perf` EAS profile and the marker harness (S19, S20 in `06-nfr.md` section 0; NS-34 section 10) | Build: one more profile in `apps/mobile/eas.json` cloned from `testflight` with `EXPO_PUBLIC_PERF=on`; `lib/perf/markers.ts`; preflight refuses the flag in `production` (FR-OPS-22, eval B s6.4) | L-01, L-05, L-08, C-01 to C-03, C-10, S-03, S-04, Q-02, Q-05 | M, 1 EAS build per candidate |
| H2 | Asha seeded-book generator (section 3) | Build, extending `asha-seed.ts` | S-01, S-02, S-06, S-07, M-02, D-04, Q-01 to Q-03 | M |
| H3 | The BL-929 run sheet `docs/qa/run-sheets/NS-34-SE3-SPEED.md` and evidence files `docs/qa/evidence/<date>-<build>-se3.md` | Build (docs): rows and fields from `tdd/new-scope/11-foundations.md` section 4 | Every device row | S, `qa` |
| H4 | Kill harness, media crash points | Reuse and extend `protocol.mjs` (`CRASH_POINTS` gains `after-copy-before-row`, `after-row-before-sweep`) with a matching `POINT_EXPECTS` entry; the app-side mirror `kill-drill.logic.ts` and the guard `apps/mobile/test/qa-kill-harness.test.ts` must change in the same PR | C-08 | M |
| H5 | Size check (section 5) | Reuse `measure.ts`; add a committed baseline | Z-02, Z-05, Z-06 | S |
| H6 | Hot-path tripwires | Build: small vitest files with `performance.now()` around pure code | L-04, L-09, C-05, S-08, Q-01 | S each |
| H7 | Instruments on a development-signed Release build (Animation Hitches, Allocations, App Launch, Energy Log) | Reuse the founder's Mac; `tdd/new-scope/11-foundations.md` section 4 says Instruments cannot attach to a TestFlight build [U] | S-01, M-01 to M-05, B-01 | founder time |
| H8 | Second-phone 240 fps video | Reuse; count frames at 4.2 ms | L-06, L-07, C-01, S-07 | founder time |
| H9 | Limits job reads media storage and egress | Build only if Variant B | D-09, Q-06 | S |
| H10 | CI timing report (section 6) | Build: a script reading `gh run list` | T-01, T-02 | S |

Order (what unblocks what): H3 first (it costs one doc and gives the first numbers by hand), H2 and H6 in parallel, H1, then H4 and H5. No harness depends on a card that is not built, except H4's media points (needs NS-01 stack merged) and S-06 (needs NS-52 locked).

## 3. The Asha seeded-book generator (spec)

**Purpose.** One deterministic book of the fictional family "Asha" that every performance row uses: 1,000 letters, 300 pictures, a video set. No real name, text, picture or voice anywhere (NS-34-R5, `no-real-family-data.test.ts`). The pure parts run in CI at small scale; the full scale runs on the `perf` build.

**Files (Rec).**
- `scripts/qa/asha-book/plan.mjs`: pure, no I/O. `planBook({ seed, letters, pictures, videos })` returns a list of items (date, kind, language, words count, picture or video attached, aspect ratio). Same input gives the same output; a test pins the SHA-256 of the plan for seed 20261120 so drift is visible.
- `scripts/qa/asha-book/media.mjs`: writes generated media from a plan: JPEGs drawn in code (flat colour blocks and gradients with seeded shapes, no photographic content, no face), sized to hit a target byte count with seeded noise; short tone clips for audio; videos by `ffmpeg` on a Mac when present (generated test pattern plus a tone, at most 60 s, at most 100 MB), skipped with a printed line when absent. [U] ffmpeg availability on the founder's Mac.
- `apps/mobile/src/dev/asha-perf-seed.ts`: loaded only when `EXPO_PUBLIC_PERF === 'on'`. Reads the plan, inserts through the same store functions `asha-seed.ts` uses (`saveEntry`, `createDraft`), inside batched transactions, then attaches media through the real writer so sweep, copies and Find index are exercised. It prints one line: counts and the seed time in ms (a number, no content).
- `apps/mobile/test/asha-book-plan.test.ts` (title `[NS-34-R5] seeded book is generated and fictional`): determinism, counts, every text drawn from the fixed fictional vocabulary, no real-family hash hit.

**Shape of the book (Rec, basis: `06-nfr.md` 11.3 year-5 fixture about 1,200 letters; NS-37-R1; NS-34 section 6 "Multilingual" and "Many").**

| Part | Value |
|---|---|
| Letters | 1,000 over about 5 years, 60 to 260 a year rising, at least 3 per month so every chapter is non-empty; one month with 60 letters (the "chapter of 60" row S-03) |
| Kinds | 70% spoken (a 3 s tone clip each, 24 KB; sha stored), 30% typed |
| Words per letter | 20 to 300; 3 letters at 4,000 words (the "clean a 4,000-word" row) |
| Languages | English for most; 10 each in Hindi (Devanagari), Arabic (right to left), Chinese (simplified) so S-01 covers mixed scripts |
| Pictures | 300 attached to 300 distinct letters; stored copy 4,032 px long side, 2 to 4 MB; aspect ratios: 70% 4:3, 15% 3:4, 10% 1:1, 5% panorama (3:1); 10 files with orientation not 1 and 10 PNG, as the real picker would give |
| Videos (if NS-52 locks) | 20 videos: 10 at 5 s, 6 at 30 s, 4 at 60 s; 1080p; the largest near the 100 MB cap |
| Hidden or deleted | 20 letters in Recently deleted, 1 hidden book, so lenses and counts are exercised |
| Children | Asha only; a second book "Rohan" for Switch child (S: L-08), also fictional |
| Seed | Fixed `20261120`; a second seed for the nightly if wanted |

**Three sizes.** `small` (50 letters, 10 pictures at 64 by 48 px, 0 videos): unit tests, every PR, under 2 s. `book` (1,000 letters, 300 pictures at real size): the `perf` build, about 1 GB of media [E, `NFR-BUDGETS.md` D-04]. `max` (1,200 letters, 300 pictures, 20 videos, a letter at the NS-52 limits): memory and storage rows.

**Where the media lives.** Not in git (CODE-R02 does not count fixtures, but 1 GB is not a fixture). The generator writes to a folder; the perf build downloads nothing: the founder runs `node scripts/qa/asha-book/media.mjs --out <dir>` on the Mac and copies the folder into the app container with `xcrun devicectl`, or the app generates pictures in code on first launch (eval B s6.4). Rec: generate in the app for pictures (no transfer, no ffmpeg), and copy videos by hand until a native generator exists.

**Content-free by construction.** The vocabulary file is a fixed list of invented words and the sentences are assembled from it; file names are `asha-<n>.jpg`; no EXIF, no location; the perf build's logs and markers carry numbers and event names only (section 4).

## 4. Measuring on a device without content in the logs

**Rules (binding, from the privacy rules in `CLAUDE.md` and PRIV-R10):** a marker is an event name from a closed list and one number. It never carries a letter, a name, a path, an id, a query, a date of birth, a file name or a picture dimension that could single out a file (NS-34-R6; NS-52-R44; NS-51-R28).

**Marker API (Rec).** `lib/perf/markers.ts`:
- `type PerfEvent = 'launch_first_frame' | 'launch_interactive' | 'speak_tap_to_mic' | 'save_commit' | 'book_first_render' | 'book_scroll_hitch' | 'find_first_row' | 'copy_decode' | 'migration' | 'index_rebuild' | ...` (a closed union; the PR that adds a name adds it here).
- `mark(event: PerfEvent, ms: number)`: pushes `{ event, ms, t }` into an in-memory ring of 2,000 entries. It does nothing unless `EXPO_PUBLIC_PERF === 'on'` (dead-code-eliminated in store builds; the seam guard's pattern, `seam-guard.mjs`, extends to search the store bundle for the marker module name).
- Export: a button in a dev-only screen writes `perf-<run>.json` (events, numbers, device model, iOS version, build, fingerprint) and opens the iOS share sheet to the founder's own Mac. Never uploaded; never in a log; never in analytics (`packages/analytics` has no perf event, and the catalogue test fails if one is added without an owner).
- `os_signpost` with static strings is the native twin for Instruments (Rec; U whether `scribe-*` modules already use it).
- Tests: `apps/mobile/test/perf-markers.test.ts` (`[NS-34-R6] markers content-free`): the union is closed, a canary string passed through any marker path never appears in the ring, a scan finds no `mark(` argument that is not a literal or a number.

**Timing source.** `performance.now()` on Hermes [U on SE 3 resolution]; frame hitches come from Instruments, not markers (a JS marker cannot see a UI-thread frame).

**Run protocol.** Fixed by `06-nfr.md` section 0: unplugged, 50% brightness, nominal thermal state, 2 minutes idle; the "first launch after an update" is measured once per candidate (NS-34 section 6). The run sheet header records model, iOS, marketing version, build, and the EAS fingerprint (NS-34-R3). A failed run is repeated, never averaged in; a call during a run discards that sample.

**Crash and energy data.** Xcode Organizer and App Store Connect crash-free numbers are the gate source (`06-nfr.md` 6); MetricKit and Instruments Energy Log explain a miss, never serve as the number (`06-nfr.md` 0). No Sentry (not in `apps/mobile/package.json`) [V].

## 5. The CI budget check (fails a PR that grows size or a hot path past budget)

Three checks, all Rec; each is a patch under `docs/ops/proposed/` for the founder, because it edits a workflow. Nothing runs today.

**5.1 Size gate (Z-02, Z-05, Z-06).**
- Baselines: one committed file per area, `docs/ops/size/<area>.json` (`bundle`, `assets`, `fonts`, `deps`), not one shared file, so two PRs that move different areas do not conflict. Alternative: a bot-updated baseline written on `develop` pushes. Each file holds bytes, the top owners and the commit taken at.
- `scripts/size/measure.ts --check` (new flag, S): compare with the baselines and exit 1 when bytecode grows by more than 100 KB or 1%, a top-20 owner grows by more than 50 KB, or the dependency count grows. Thresholds are Rec (basis: 11.6 MB measured against a 12 MB budget on 3 Oct, under 4% headroom, `APP_SIZE.md` 3); the first CI run sets the real baseline.
- Hard budgets have no waiver: bytecode 12 MB, JS assets 3 MB, fonts 1.5 MB and the 40 MB download fail whatever the PR body says. Only the growth threshold can be downgraded, by a line `Size-change: <reason, owner>` in the PR body with the area file changed in the same PR.
- Where and cost: in the `seam-guard` job on Ubuntu, no secrets. `measure.ts` runs its own two `expo export` calls (bytecode and plain, "about 3 minutes" by its header), not the seam guard's exports, so it adds about 3 minutes [E, header] unless a small `--bundle-dir` flag lets it read the guard's export (S, saves most of that). Until then it runs only when `BUNDLE_PATHS` match, which keeps the job inside its 15-minute timeout (`ci.yml:111`).
- Not covered: the native binary. That stays an IPA or App Store Connect number per candidate (Z-01, Z-04); CI cannot see it before a build. A cheaper proxy is the autolinked native module list: fail a PR that adds a native dependency to `apps/mobile/package.json` or a folder under `apps/mobile/modules/` without a `Native-size: <KB before, after, source>` line in the PR body (Rec; the label guard `scripts/release/label-effect.mjs` already reads `package.json` for new SDKs, G11-3, and can host this rule).

**5.2 Hot-path tripwires (L-04, L-09, C-05, S-08, Q-01).** Plain vitest tests in `apps/mobile/test/perf-*.test.ts` that run the pure code on the `small` seed and the 1,000-letter plan: planner, prompt selection, Find query on `node:sqlite`, index batch, clean 300 words, migration 10 to 11. Each takes the median of 5 runs and fails only at 3 times the budget in `NFR-BUDGETS.md` (CI jitter; a sandbox run is not an SE 3). Between 1x and 3x it prints a warning in the run log. These are tripwires, never evidence (eval B s4.1); the device row is the gate.
- Cost [E]: each file under 2 seconds on this sandbox; all of them add under 15 seconds to `unit`.

**5.3 Dependency and hot-path growth in review.** CODE-R17 already asks that a new dependency be justified in the PR. `scripts/size/measure.ts` prints "app dependencies that put nothing in the JS bundle" [V, header item 4]; the check in 5.1 turns that list into a failure when it grows.

**5.4 What stays a nightly or a candidate job (FR-QAL-19, FR-QAL-30).** Video encode, large-file and 1,000-letter media tests; the XCUITest audit (A-05); the 500-kill gate. None goes into the PR path; `ci.yml` header budget is 10 minutes and a growing job is split, not given a longer timeout.

## 6. The macOS launch queue (merge bottleneck)

**What I measured (gh api, 20 Nov 2026).**
- `ios-compile.yml` job `store-profile Release launch` on 14 successful PR runs: run time 13.6 to 31.1 minutes, median 22.6; wait for a runner 0 to 155.4 minutes, median 37.5 [V]. The last four runs waited 0 to 0.1 minutes: the queue is bursty, not constant [V].
- One run's steps (run 44776672118, 26.3 minutes): `npm ci` 0.7, `pod install` 1.2, DerivedData restore 0.6, **xcodebuild 17.1**, simulator boot 2.3, launch and 20 s wait 1.8 [V]. A second run (44754043961): xcodebuild 15.7, boot 2.4, launch 2.5 [V]. So the native build is about 70% of the run.
- Both runs restored DerivedData from a `restore-keys` prefix, not an exact key (`Cache hit for restore-key: dd-release-macOS-xcode26.6-c4635a...` in run 44776672118's log) [V]. The key hashes `package-lock.json`, `app.config.ts` and `modules/**` (`ios-compile.yml:395-399`; same pattern at `kill-harness.yml:360`), and the nightly kill-harness build saves it (the post step of `actions/cache@` at `kill-harness.yml:208-214`, restore plus save; `kill-harness.yml:264` is a different save, the `kill-app` cache, not DerivedData) [V]. Even with a restore, xcodebuild took 15 to 17 minutes. Why is [U]: the step runs `expo prebuild --clean` before it, which may rewrite the project and defeat an incremental build [E].
- Demand: 60 `ios-compile` PR runs between 11:54 and 17:13 UTC on 20 Nov [V]. In 16 of the 24 newest I could resolve to a PR, 7 PRs accounted for all 16 runs (the stack #835 to #840 and #895), so about 2.3 runs a PR [V, my sample]. A rebase of one PR in a stack re-runs its whole stack.
- The workflow's own comment says 5 macOS jobs run at once on this plan (`ios-compile.yml:441`) [V]. Other macOS users: `compile` (Debug, on native changes) and the kill harness on PRs touching capture paths.
- The job is not a required check. Branch protection requires `required` and `applied migrations unchanged` (`.github/README.md:28-30`) [V]; the launch check is a practice gate the founder waits for.
- Test-only or docs-only changes inside the path filter: 0 of 16 sampled PRs were only tests or docs, so a `paths-ignore` for tests would save nothing [V sample].

**Proposals for the founder (cost and the decision are his; none weakens what the launch proves unless it says so).**

| # | Proposal | Gate strength | Estimate | Cost |
|---|---|---|---|---|
| Q1 | **Measure first.** One `workflow_dispatch` run with `xcodebuild -showBuildTimingSummary` and a log of whether DerivedData was used (`-derivedDataPath` size before and after). Tells whether the cache or `--clean` is the cause | None | one dispatch, 25 minutes | none |
| Q2 | **Save the Release DerivedData from the launch job itself on pushes to `develop`**, with an exact key of the native inputs only, and stop deleting the generated project when a cache hit exists. Today only the nightly kill-harness build saves it | Same | [E] cuts xcodebuild from about 16 to under 6 minutes if the build becomes incremental; unproven | none (cache storage within GitHub's 10 GB repo limit [U]) |
| Q3 | **Split what the launch proves.** (a) Native compiles: the existing `compile` job, on native changes. (b) This JS boots in Release: build the Release app once per native fingerprint on `develop` (the `changes` job's native filter at `ios-compile.yml:306-311` is the trigger), keep the `.app`, and on a PR with the same native inputs only bundle the JS in Release, swap `main.jsbundle` into the cached app, boot, launch 20 s, read the log | JS boot proof is the same check; native proof moves to `compile` and the nightly. Residual risk: a bundle swapped by script differs from the one Xcode's bundle phase makes [U] | [E] from about 22 to about 8 minutes: the non-xcodebuild steps total about 8 minutes today and `pod install` and DerivedData restore drop out | none beyond engineering (M) |
| Q4 | **Skip drafts, run on ready.** Run `launch` on `ready_for_review` and on a label, not on every push to a draft; keep `cancel-in-progress`. The founder's rule stays: green on the head sha at merge | Same at merge; less feedback while drafting | [E] at 2.3 runs a PR, perhaps one run fewer per PR; unknown share of drafts | none |
| Q5 | **A second runner pool.** (a) A GitHub larger macOS runner: separate concurrency pool [U], billed per minute. (b) A self-hosted Mac (the founder's): free minutes, but a self-hosted runner on a public repository must not run code from forks, and agent PRs are same-repo, so the "approve fork runs" setting must be on | Same | Halves the wait if demand is two pools wide; does not shorten a run | (a) per-minute price [U, not read]; (b) hardware and upkeep, the founder's |
| Q6 | **Cut redundant starts.** When a PR in a stack is rebased only because its parent merged, the diff is unchanged; reuse the previous head's result when `git range-diff` is empty | Same | [E] depends on how often stacks rebase | engineering (S) |

My order: Q1 now (free), then Q2 and Q3 (they attack the 70%), Q4 if the queue stays, Q5 only if the founder wants to buy time. Q5 alone helps the wait, not the run.

## 7. Cost of each item

Sizes follow `docs/engineering/01-code-and-change.md` (S under 150 lines, M about 400, L split). "Founder" is his time or money; I do not price EAS or hardware.

| Item | Effort | CI minutes added per PR | Device or EAS | Founder |
|---|---|---|---|---|
| H3 run sheet (BL-929) | S, docs, `qa` | 0 | one SE 3 session per candidate, about half a day [E] | who runs it (default: the founder) |
| H1 `perf` profile and markers | M, `mobile` and `ops` | under 0.5 (marker tests) | one EAS build per candidate; counts in the 15 a month (FR-OPS-27) | decides Starter if more than 12 used |
| H2 Asha generator | M, `qa` with `mobile` | under 0.1 (`small` seed test) | 1 GB on the phone; copy by hand | none |
| H4 media kill points | M, `qa` | kill-harness smoke only (macOS) | none | none |
| H5 size gate | S, `ops` | about 3 in the `seam-guard` job (about 1 with `--bundle-dir`) | none | applies the patch to `ci.yml` |
| H6 tripwires | S each, `mobile` | under 0.25 total | none | none |
| H7, H8 Instruments, video | none to build | 0 | SE 3 on iOS 17 and the latest | which phones he holds; buying is his |
| H9 limits job media | S, only if Variant B | weekly job | none | Management API token |
| H10 CI timing report | S, `ops` | 0 (reads the API) | none | none |
| Q1 to Q6 | S to M each | negative if they work | none | the decision, and the spend for Q5 |

## 8. Cite check, conflicts, what I could not do

- Cites sampled for this file: 31 checked by opening the line or running the command; 26 held as first written and 5 needed a line number or wording fixed (all fixed above): `protocol.mjs` range, `trace.mjs` line, two `ios-compile.yml` lines, and the free-limits workflow, which is a proposal and not applied. Held: `perf.test.mjs:30-36`, `kill-harness.yml:10-17, 360`, `ios-compile.yml:441`, `.github/README.md:28-30`, `seam-guard.mjs:80`, `ci.yml:100`, `docs/BACKLOG.md:3572, 3579`, `14-test-plan.md:50`, `06-nfr.md` sections 0, 6, 11.3, FR-OPS-22, 27, 34, FR-QAL-19, 30, `qa-kill-harness.test.ts` exists, and the gh api numbers in section 6.
- Conflict to product: NS-34 says the `perf` profile and marker harness are S19 and S20 in `06-nfr.md`; `docs/BACKLOG.md` BL-929 names the run sheet only. Someone must own H1 (the BL for the profile and markers). I recommend `product` adds one.
- Could not do: run `measure.ts` (sandbox cannot export the iOS bundle: missing `expo-local-authentication`); read any dashboard, EAS or App Store Connect; time a CI macOS run of my own; check that GitHub larger runners have a separate concurrency pool or their price.
- Founder: Q5 spend; which phones; EAS build count; whether the launch check should become a required check (it is not today).
