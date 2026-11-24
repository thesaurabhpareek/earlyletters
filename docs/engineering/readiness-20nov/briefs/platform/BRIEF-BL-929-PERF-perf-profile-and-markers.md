# BRIEF BL-929-PERF: the `perf` EAS profile and the content-free marker harness (harness H1; NS-34-R6; S19, S20)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U]. Card and `14-test-plan.md` line cites are at the locked pack `450bcb4a` (#846, unmerged: `git show origin/docs/prd-lock-v1-20nov:<path>`); develop still holds the older cards.

**Blocked until: product gives this its own BL row (BL-929 names the run sheet only: Conflict sent in #929 section 8), and the founder approves a new EAS profile (`eas.json` is a security-architect path; a new store-distribution profile changes what `preflight` and `store-flags` check) and one EAS build per candidate (15 a month on Free). S19 and S20 are cited from MEASUREMENT-PLAN.md H1 and the task; I did not re-read them in 06-nfr.md [U].** Founder-only: EAS builds and spend, which phones, Instruments sessions, the decision on distribution (store versus internal).

```
BRIEF BL-929-PERF                                 Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: mobile (markers) with ops (profile and guards)   Lane: Pack 8 + Pack 10   Build: 14 candidate onward (device numbers for Build 13 come from a development build)   Wave: 2

1. GOAL: When a `perf` build runs the seeded Asha book on an SE 3, an export file holds event names and millisecond numbers for launch, save, Book first render and Find, and nothing else; a store build contains none of this code, and no log or analytics line ever carries content.

2. CARD ROWS and TEST TITLES: NS-34-R6 (markers content-free), NS-34-R3 (run sheet header carries the fingerprint), NS-52-R44, NS-51-R28, FR-OPS-22 (preflight refuses the flag in production), NFR L-01, L-05, L-08, C-01 to C-03, S-03, S-04 (#928).
   Tests: apps/mobile/test/perf-markers.test.ts
     [NS-34-R6] markers content-free         (the union of events is closed; a canary string passed through any marker path never appears in the ring; a scan finds no `mark(` argument that is not a literal or a number)
   apps/mobile/test/store-flags.test.ts gains `EXPO_PUBLIC_PERF` as a flag allowed only on the `perf` profile: `[FR-OPS-22] the perf flag is off in every other profile`.
   .github/scripts/seam-guard.test.mjs gains: `[NS-34-R6] a store bundle does not contain the marker module` (positive control: the perf export does).
     [FR-OPS-22] the perf profile is not a store profile, is named in no `submit` entry of eas.json and in no workflow (`grep -rn perf .github/workflows` finds no `--profile perf`)
   Red on develop: `git grep EXPO_PUBLIC_PERF` -> 0 hits [V]; no `perf` profile (eas.json build profiles: development, e2e (:22), preview, production, testflight [V]).

3. FILES
   Touch: apps/mobile/eas.json (a new `perf` profile cloned from `testflight`, env adds EXPO_PUBLIC_PERF "on"; BACKUP, ANALYTICS, STATUS_REPORT stay "off"), apps/mobile/src/lib/perf/markers.ts (new), apps/mobile/src/dev/asha-perf-seed.ts (with BRIEF ASHA),
          scripts/release/store-flags.mjs (one row), apps/mobile/scripts/preflight-testflight.mjs and preflight-production.mjs (refuse the flag outside `perf`), .github/scripts/seam-guard.mjs (search the marker module name) [security-architect reads], apps/mobile/test/*, docs/agents/checkins/mobile-perf.md
   Never: `production` or `preview` env values; analytics (`packages/analytics` gets no perf event, and its catalogue test fails if one is added); uploads of the export; a dependency.
   Shared file: eas.json and the preflights are also touched by BRIEF BL-976-WIRE and BRIEF B13-CHECKS; land WIRE first.

4. READING PACK: Pack 8 and Pack 10; MEASUREMENT-PLAN.md sections 2 and 4 (#929); OBSERVABILITY-WITHOUT-CONTENT.md (#930); scripts/release/store-flags.mjs (all); preflight-keepsafe.mjs; docs/tdd/new-scope/11-foundations.md section 4.

5. CODE ENTRY POINTS (verified at 16e61549)
   apps/mobile/eas.json:70-83    the `testflight` profile to clone (env: DOCS_BASE_URL, APP_ENV preview, SERVER_FEATURES off, BACKUP off, STATUS_REPORT off, ANALYTICS off, ENGLISH_ONLY on, SPOKEN_LANGUAGES en)
   scripts/release/store-flags.mjs:20-22  STORE_FLAGS rows (PHOTOS, BOOK_SEARCH) with `allowedOn`; `isStoreProfile` :38 reading distribution "store" or none
   .github/scripts/seam-guard.mjs:80      BUNDLE_PATHS; the script exports each store profile and searches it for the e2e seam: extend, do not add a second export
   apps/mobile/src/lib/resilience/global-errors.ts:49  the only `console` call in app source: markers must not use console
   DECISION (review B): the default is `distribution: "internal"` (ad hoc, registered devices, like `development`). A `store` profile is a store profile to every guard (`isStoreProfile`, store-flags.mjs:38) and cannot honestly be called "no marker code in a store build". The founder may still choose store (TestFlight) later; that is his call and needs `allowedOn` entries.

6. DATA AND SECURITY: Data classes: L1 timing only. Marker = event name from a closed list plus one number; never a letter, name, path, id, query, date of birth, file name or picture dimension. Export: a dev-only button writes `perf-<run>.json`, where <run> is the UTC start time as `YYYYMMDDTHHMMSSZ` plus a counter (`-1`), never a name, id or path and opens the iOS share sheet to the founder's own Mac; never uploaded, logged or sent to analytics. Boundary: no content in logs (CLAUDE.md privacy rules).
   Read: security-architect (eas.json, seam guard), privacy. Fail closed: if the flag is not literally "on", `mark` does nothing and is removed from store bundles.

7. LIBRARIES: none. `performance.now()` on Hermes [U resolution on SE 3]; frame hitches come from Instruments, not markers.
8. BUDGETS: marker call under 0.05 ms and ring of 2,000 entries [Rec, no source]; the profile adds 0 bytes to a store build (proved by the seam search). EAS: one build per candidate, counted in the 15 a month (FR-OPS-27).

9. ACCEPTANCE: closed event union (`launch_first_frame`, `launch_interactive`, `speak_tap_to_mic`, `save_commit`, `book_first_render`, `find_first_row`, ... per MEASUREMENT-PLAN 4; a new name is added in the PR that uses it); export header: device model, iOS, marketing version, build, EAS fingerprint.
   Done also means red on mutants: a marker call with a template string; `EXPO_PUBLIC_PERF` set "on" in the `production` profile (preflight and store-flags both fail); the marker module imported from app code unconditionally (seam search fails).

10. PR BREAKDOWN: PR 1 markers + tests ~180 lines, 4 files; PR 2 profile + store-flags + preflight + seam guard ~200 lines, 6 files | base develop | flag-off proof: with the flag unset `mark` is a no-op and a store export has no marker module.

11. LENSES: A security-architect (eas.json, seam guard), B principal-architect.

12. ORDER: after BRIEF BL-976-WIRE and BRIEF BL-929-ASHA PR 1. Before the Build 14 sheet; the Build 13 SE 3 numbers use a development build and the run sheet. Blocked by product (BL row) and the founder (profile, builds).

13. DONE: [ ] focused tests; [ ] `npm test -w apps/mobile` baseline; [ ] tsc 5 known errors; [ ] ASCII; [ ] PR body per HARNESS-RUN with `needs:founder`; [ ] journal #8 (mobile); [ ] check-in.

14. ONLY A PHONE CAN PROVE: every number: L-01 launch, L-05 tap to mic, C-01 to C-03 save, S-03 and S-04 Book, hitches (Instruments on a development-signed Release build [U that TestFlight builds cannot attach]; second-phone 240 fps video for L-06, L-07). Nothing from the sandbox is evidence.

15. STOP AND ASK: store versus internal distribution; any marker that needs a path or id; a native change for `os_signpost` (Rec only; U whether `scribe-*` modules already use it); anything that would put a marker in a store bundle.

16. HARNESS: journal #8; marker `<!-- journal run:sess-20261120-mobile-perf agent:mobile -->`; branch feat/mobile-bl-929-perf-markers; labels agent:mobile, from:agent, needs:founder.
```
