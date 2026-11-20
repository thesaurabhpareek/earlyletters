# C. Cross-cutting platform, quality and delivery design for the locked pack

Status: WORKING-INPUT (engineering evaluation behind errata E1 to E32; findings applied in C18) | 20 Nov 2026 | Owner: the review role named in the file | Replaces: none | Load when: reading section 8, which 18-errata-after-lock.md cites; otherwise do not load.

Author: `principal-architect`, for Karma (CTO). Written 20 Nov 2026 against the lock worktree `/home/claude/wt/E` at `450bcb4a9` (committed 2026-11-20T05:07Z), read-only. Nothing here was committed, pushed or posted.

Status detail: design proposal. It makes no product decision and sets no date. Where it proposes a rule change to a steward chapter, that is an RFC for the other stewards; where it proposes a workflow or roster change, that is for Karma and the founder.

How facts are marked:
- `path:line` is a fact read in the worktree this session.
- "GitHub, read 20 Nov" is a read-only `gh api` call made this session (no writes).
- **UNVERIFIED** means I did not read or run it this session.
- Sizes and counts I derived are marked [E] (estimate) with the arithmetic shown.

---

## 0. Summary

1. The locked pack sits on the existing architecture with no new tier and no new service. Almost all of it is on the phone. The server changes are additive: Firsts columns, seal columns plus a pull clause, an earlier-versions read RPC, and a later co-parent rollout. The new risk sits at the trust boundaries: OS surfaces (lock screen, share sheet, system intelligence, writing tools), a second account on the same phone, and the author against other readers for seals.
2. Eleven ADRs are needed, numbered 0029 to 0039 (section 1.4). The three that block code soonest are flags and kill switches (0029), traceability v2 (0030) and second-account isolation (0031).
3. Gate G0 is a tooling job of about two PRs. `scripts/trace.mjs` only knows `X-REQ-nnn` ids (`scripts/trace.mjs:37`) and reads `docs/prd/v2` (`:525`). I give an id grammar that covers all 636 acceptance ids in the cards (296 of them P0, which matches `14-test-plan.md:102`), and a ratchet that runs inside `npm test`, so CI enforces it without a workflow edit (`package.json:11`, `.github/workflows/ci.yml:60-63`).
4. Gate G6 has no code today. `preflight-production.mjs` checks named flags only (`apps/mobile/scripts/preflight-production.mjs:179-189`) and cannot see the EAS environment (`:338`). I propose one flag registry file that both the app and preflight read, plus a preflight check that fails when a production flag is on while its card has an open P0 in trace output.
5. Delivery is bound by review, not by build. My estimate is about 40 PRs on the critical path to Photos and Find in production, and about 120 PRs for the whole pack excluding parked cards. At two counted reviews per head, that is at least 80 and 240 counted reviews before any re-review. Today the harness cannot help: `agents.yml` is `disabled_manually` (GitHub, read 20 Nov), and even if it were on, 66 agent-labelled PRs are open against a team cap of 10 (`agents/roster.json:19`, `scripts/agents/dispatch.mjs:235-236,270-272`), so it would start no new task.
6. Release order without dates: a floor milestone with no flags turned on, then a store build carrying the keeping fixes and the cross-cutting rules, then Photos and Find on in production, then Share, Print and Firsts, then the counsel-gated items (seals, From name, other parent, earlier versions, languages).

---

## 1. Architecture view

### 1.1 Layers and what the pack adds to each

The pack keeps the shape the repo already has: an Expo app that holds the L4 book (`apps/mobile`), pure logic in `packages/*`, Supabase for accounts, sync and co-parent, a CDN for signed public documents, and the website as its own lane.

| Layer | Exists today (read) | Added or changed by the locked pack |
|---|---|---|
| Phone UI (Expo Router) | Home, Book, Me routes; capture cluster; Review; letter page | Home slip registry (FRAME-SLIP); child switcher on Home (NS-14); "This letter" list (NS-21); calm header with Find (NS-22, NS-02); Photos lens (NS-01); Quiet beside Hide (BL-985); Save a copy action and slip (NS-11); one past letter (NS-23); Read the year back (NS-24); seal and Firsts controls (NS-06); From name on Review (NS-16) |
| Phone logic (`apps/mobile/src/lib`) | `photos/` (`types.ts`, `baker.ts`), `reminders/` (`planner.ts`, `scheduler.ts`, `tz.ts`), `export/` (`build.logic.ts`, `device.ts`, `schema.ts`), `sync/engine.ts`, `remote/`, `capabilities.ts`, `store.ts`, `erase-everything.ts` (directory listing) | Photo file layer and stored copy (open stack #835 to #842); Find index `letter_search` in `scribe.db` (#798); notification budget `reminders/budget.ts` (BL-966); print PDF `export/print-pdf.ts` (BL-973); shared undo-window helper (BL-954); account-scoped local data (X4-R1, BL-961) |
| Pure packages | `packages/core` (engine, verifier, age, prompts), `packages/api` (contracts, `remote-config.ts`, `envelope.ts`), `packages/content` | Grapheme length helper in `packages/core` (BL-957); new kill switch keys in `KillSwitchesSchema` (`packages/api/src/remote-config.ts:67-78`); new error codes in `envelope.ts`; PROPOSED words (BL-965) |
| Native modules | recording container (ADR 0027), `scribe-photo` (#834 merged, #842 open) | Photo module hardening; possibly a writing-tools switch if React Native does not expose one (BL-962); quick capture doorways later (NS-06 Part C, after the NS-04 spike) |
| Supabase (Postgres, RLS, RPCs) | `entries`, `book_entries` view, content trigger tuple, `sync_pull`/`sync_push`, invites | `first_mark`, `first_label` (BL-968); `seal_opens_at`, `sealed_until`, non-author read clause and pull window (BL-969); earlier-versions read RPC with its grant (BL-979); server write-deny for media (BL-870); co-parent rows (BL-983). Every new synced column joins the content trigger tuple and `book_entries` in the same migration (`16-council-review-round-2.md:81`, F12) |
| Edge Functions | `config`, `content`, `invite-redeem`, `purge-worker`, `escrow`, `apple-token`, `analytics-forget`, `subscription-status`; logger `_shared/log/log.ts` (directory listing) | No new function is required by the pack. Seal publication option (a) via pg_cron stays out until it is proven on production (BL-969) |
| CDN (signed public docs) | remote config with `killSwitches` and `flags` (`remote-config.ts:93-110`, `killSwitches` at `:109`); pack manifests | Kill switch keys per card (section 2.2); `remoteConfig.doorways` is withdrawn (BL-971) |
| Export and keepsakes | export schema 1.6.0 (`01-photo-with-a-letter.md:229`), device PDF via `renderPdf` (`07-remaining-capability-rows.md:355`) | 1.7.0 adds `photos/` (NS-36-R5, BL-933); Firsts and seals each take a later minor; printable PDF with embedded OFL faces (NS-07-C28-13) |
| Website (`apps/web`, web lane) | external lane (`agents/roster.json` `external_lanes`) | Claims and privacy-label words only, through G5. No feature code |
| Build and release | EAS profiles (`apps/mobile/eas.json:7-85`), `preflight-production.mjs`, `release-config.test.ts`, `ci.yml`, `kill-harness.yml` | Flag registry and G6 check (section 2); trace ratchet (section 3); kill-harness path widening (proposal, section 3.6) |

### 1.2 Trust boundaries

A trust boundary is any place where a parent's words, a child's name or a picture could cross to someone or something that should not hold it. For each one I name the rule and the check that enforces it.

| # | Boundary | What could cross | Rule in the pack | Enforced by (proposed where not built) |
|---|---|---|---|---|
| TB1 | Phone to OS shared surfaces (lock screen, Notification Center, share sheet, Files, Spotlight, App Intents, system writing tools) | child name, letter words, picture, typed day | No name or words on the lock screen by default (J-N24); `hiddenPreviewsBodyPlaceholder` set per category (`16-council-review-round-2.md:111`); no donation to system intelligence (`[X6-R1]`, D3); writing tools off on letter fields (D2); shared text equals kept words byte for byte (J-N11) | Notification payload unit tests on the budget planner; BL-962 source scan; NS-05 golden test |
| TB2 | Phone to Supabase | words (synced with consent), Firsts label, seal instant, From name | Pictures never leave the phone in this pack (BL-870 write-deny); the Find index, typed days and the other-language transcript are never synced (NS-02, NS-18, D10) | SQL tests in `supabase/tests`; a source check that the sync column list carries none of the phone-only fields |
| TB3 | Phone to CDN | nothing outbound except the fetch itself | Read-only signed documents; kill switches fail safe (`withFreshKillSwitches`, `remote-config.ts:179-183`) | Existing contract tests; new keys are additive (API-R11) |
| TB4 | Account A to account B on the same phone | A's whole book | D1: the book stays on the phone after sign-out; B never sees, claims or uploads it (`[X4-R1]`) | BL-961 integration test with two seeded accounts. Needs ADR 0031 |
| TB5 | Author to other readers of the book | sealed letter before its instant; quiet days; earlier versions | Seals are author-only until the instant (ADR 0028 D3); quiet marks are `inBook: false` (BL-974); earlier versions are read only by the author (BL-979) | SQL tests on `book_entries` and the pull clause; two-phone test `[NS-06-B8b]` |
| TB6 | Repository and CI to the production build | a flag turned on with an open P0 | G6 | Section 2.3 preflight rule |
| TB7 | Real family to tests and evidence | names, letters, voices, pictures | Asha-only test install (D13, `14-test-plan.md:90`) | `packages/content/test/no-real-family-data.test.ts` on every evidence PR |
| TB8 | Phone to logs and crash reports | any L3 or L4 value | Content-free codes only (section 4) | J-N18 canary across the new paths |

### 1.3 Where each card lands (one line each)

| Card | Phone | Server | Sync | Export | Boundary crossed |
|---|---|---|---|---|---|
| NS-01 Photo | native module, local migration 11, `entry_media`, three files per picture | write-deny only | no | 1.7.0 | TB1 (share, Files), TB4 |
| NS-02 Find | FTS5 `letter_search` in `scribe.db`, derived, L4 | none | never | never | TB4, TB8 (query) |
| NS-05 Share L1 | share sheet, text only | none | no | no | TB1 |
| NS-06 A Firsts | lens, label | 2 columns, trigger tuple, view | field group `first` | next free minor | TB5 |
| NS-06 B Seals | seal at Keep, Open now | 2 columns, read clause, pull window | pull clause option (b) | next free minor | TB5 |
| NS-06 C Quick capture | OS doorways into `startCapture` | none | no | no | TB1 |
| NS-07 Print | `print-pdf.ts`, bundled fonts, temp file | none | no | separate file | TB1 |
| NS-08 Backup | none (stays off) | storage (off) | no | no | TB2 (future) |
| NS-09, NS-10 | sweep, retry, Book-level line | purge of a let-go held draft (D7) | yes | no | TB2 |
| NS-11 Save a copy | Me action and slip | none | no | existing export | TB1 (Files) |
| NS-12 Earlier versions | letter page row | read RPC plus grant | read | `data/other-versions.json` change named by card | TB5 |
| NS-13, NS-18, NS-32 | planner, budget, scheduler | none | never (typed days) | never | TB1 |
| NS-14, NS-15, NS-21 to NS-24 | UI over existing data | none | existing `occurred_on` | existing | none new |
| NS-16 From name | Review field | existing `author_signs_as` | insert-only | existing | TB2 |
| NS-17 Language | `language-hold.ts` | none | never the withheld words | never | TB8 |
| NS-25 Other parent | Me | co-parent rows | yes | yes | TB5 |
| NS-33, NS-34, NS-37 | accessibility, speed, derivatives | none | no | no | none |
| NS-36 Data follows the letter | rules over all of the above | L3 ids (BL-959) | per row | 1.7.0 | all |

### 1.4 ADRs needed

The next free number is 0029: the index runs to `0028-photo-seal-find-on-device-data.md`, then `0101-ui-component-library.md` (directory listing). One housekeeping item first: ADR 0028 still says "Status: Proposed" (`docs/adr/0028-photo-seal-find-on-device-data.md:3`), but #797 merged at 2026-11-20T04:28Z and is in the lock head (GitHub, read 20 Nov; `git merge-base` check). G1 cites ADR 0028 as merged, so its status line should say Accepted, and say by whom (CR-62 per `13-engineering-plan.md:108`).

| ADR | Title | Decision in one line | Blocks |
|---|---|---|---|
| 0029 | Feature flags, kill switches and the G6 preflight | Every card with a surface ships behind one build flag and one remote kill switch, both declared in one registry file that the app and preflight read; production turns a flag on only when trace shows zero open P0 for its cards and the gate record names G2 to G5 evidence | every flag PR (BL-958 onward) |
| 0030 | Requirement traceability v2 | `trace.mjs` reads `docs/product/prd` as a second source with the grammar in section 3.2; bracketed test titles are the only test evidence; skipped and todo tests never count; a baseline ratchet in `npm test` blocks new untested P0 rows | G0 (BL-964) |
| 0031 | One phone, two accounts | Local rows carry the owning account id; on sign-in, a mismatched owner hides and locks the old book (no read, claim, upload, index or reminder) until that account signs in again or Erase everything runs | `[X4-R1]` (BL-961), NS-01-R29/R30, NS-02-R24 |
| 0032 | One notification budget | One planner owns every local notification: classes evening, monthAge, birthday, typedDay, plan; at most one per local day across books; at most 60 pending of iOS's 64, with plan notices kept first and outside the budget; back-off pre-scheduled (7 daily, weekly for 4 weeks, then none); clamp 07:00 to 21:30 local; sign-out cancels and clears the plan | NS-32, NS-13, NS-18 |
| 0033 | Home slip registry | Slips are a closed, ordered registry in one module (waiting cards, seal opened, Save a copy, one past letter); at most one renders; an unregistered type throws in development and test, and `[FRAME-SLIP]` fails the build | BL-963, NS-06 B4, NS-11, NS-23 |
| 0034 | Seal publication | Option (b) of NS-06 B10.1: `sync_pull` returns, for non-authors, rows whose `seal_opens_at` falls in (last pull instant, now], keyed by the cursor's server time and idempotent on row id; the pull parser tolerates the new response key; option (a) (pg_cron) only after it is proven on production | BL-969, BL-970, `[NS-06-B8b]` |
| 0035 | Undo windows (ruling T4) | One helper: a window stays open for its stated seconds, or until VoiceOver finishes the undo line plus those seconds, whichever is later; with Switch Control on, until the parent moves on; the toast and the action expire together | BL-954, NS-01-R38, NS-06-A2b, NS-33-R15 |
| 0036 | One length rule for typed words | The app counts extended grapheme clusters through one `packages/core` helper and refuses before save; the database keeps a code-point ceiling set high enough for the grapheme limit in every launch script; `Intl.Segmenter` on Hermes is checked first (BL-987) and a vendored segmenter is the fallback | BL-957, NS-01-R54, NS-06 label, NS-16-R6 |
| 0037 | Printable PDF and fonts | `expo-print` (already a dependency, `apps/mobile/package.json:41`) renders HTML with `@font-face` rules for bundled SIL OFL faces; every face carries a licence row; a CJK and Arabic face is added only within the app size budget, or the print flag stays off for those scripts until it fits | BL-973, NS-07-C28-13 |
| 0038 | Export minor allocation | An export minor is taken by the PR that merges first; cards name the content, not the number; each bump keeps a fixture of the previous minor and a one-way schema test (NS-36-R7) | BL-933, BL-968, BL-969 |
| 0039 | Words stay out of system intelligence | No `CSSearchableIndex`, `isEligibleForSearch` or `AppEntity` over letters, children or prompts; writing tools are off on every letter field; if React Native exposes no switch, a small native prop is added and recorded | BL-962, `[X6-R1]` |

On 0038: the cards disagree on numbering. `11-foundations.md:716` says "1.8.0 seal; firsts in their own minor", while BL-968 says Firsts take 1.8.0 and `06-firsts-sealed-letter-quick-capture.md:164` says "the next free export minor after 1.7.0". The export header already uses the merge-order rule ("whichever lands second takes 1.3.0", `apps/mobile/src/lib/export/schema.ts:36-37`). The ADR makes that rule general.

---

## 2. Flags, kill switches, build profiles and the G6 preflight

### 2.1 What exists

- Build flags are `EXPO_PUBLIC_*` values inlined at build time. Only the exact string `on` turns one on (`apps/mobile/src/lib/capabilities.ts:150-153`). The flags that sit on top of the server switch go through `buildFlagEnabled`, which returns false whenever `serverFeaturesEnabled()` is false (`capabilities.ts:181-194`).
- None of the pack's flags are on `develop` yet. The only `EXPO_PUBLIC_*` names in `apps/mobile/src` and `app.config.ts` are the existing ones (grep: APP_ENV, SERVER_FEATURES, BACKUP, STATUS_REPORT, ACCOUNT_DELETION, ENGLISH_ONLY, SPOKEN_LANGUAGES, ANALYTICS, and so on). `EXPO_PUBLIC_PHOTOS` and `EXPO_PUBLIC_BOOK_SEARCH` live in the open stacks.
- Kill switches are remote and signed. The schema today has `sync, invites, photos, packDownloads, serverContent, backupUploads, escrow, statusReport` (`packages/api/src/remote-config.ts:67-78`). The cards also name `killSwitches.bookSearch` and `killSwitches.reminders` (grep of the cards), which do not exist yet.
- Profiles in `apps/mobile/eas.json`: `development` (`:8-21`), `e2e` (`:22-39`), `preview` (servers on, `:40-54`), `production` (`:55-69`), and `testflight` (servers **off**, `:70-84`, `EXPO_PUBLIC_SERVER_FEATURES` at `:77`).
- Preflight checks named flags one by one (`preflight-production.mjs:179-189` for BACKUP and STATUS_REPORT). It cannot read the EAS environment on expo.dev and says so as an UNVERIFIED line (`:338`). There is no flag-to-P0 check.

### 2.2 Policy (ADR 0029)

1. **One registry.** Add `apps/mobile/feature-flags.json`, read by `capabilities.ts` (JSON import) and by `preflight-production.mjs` (plain `readFileSync`, the same way it reads `ENVIRONMENTS.md` today, `:401`). Each entry has: `key` (for example `photos`), `env` (`EXPO_PUBLIC_PHOTOS`), `cards` (`["NS-01","NS-36","NS-37"]`), `killSwitch` (`photos`), `needsServer` (boolean), `owner` (handle), `gates` (paths to the G2, G3 and G5 records), `removeBy` (the release after it is fully on, CODE-R09). This gives one definition for each flag, in line with CODE-R13.
2. **Two kinds of build flag.** On-device features (Photos, Find, Save a copy, Print, past letter, Read the year back, typed days) must not depend on the server switch. Today's `buildFlagEnabled` would hide Photos in the `testflight` profile, because that profile has servers off. Add `localFeatureEnabled(key)` for those, and keep `buildFlagEnabled` for server-backed features (Firsts sync, seals, From name, other parent, earlier versions).
3. **Every surface has a kill switch.** Each card with a surface gets one `killSwitches.<key>`, added to `KillSwitchesSchema` in the same PR as its flag. Adding a key is additive, so it meets API-R11, and an older app falls back to `false` for keys it does not know. Proposed keys: `bookSearch`, `reminders`, `shareLetter`, `firsts`, `seals`, `printBook`, `quickCapture`, `earlierVersions`, `signAsOther`. Per X5, every RR-5 state table also covers the switch being on.
4. **Kill means hide, never delete.** A kill switch hides the surface and stops new writes. Files, rows and exports remain, so the book still reads with the switch on (`01-photo-with-a-letter.md:246` states this for photos; the ADR makes it the rule for every card).
5. **Profiles.** `development` and `e2e`: every pack flag `on`, which keeps the e2e seams exercising all paths. `preview` and `testflight`: `on` once the card's P0 unit and source tests pass in trace, with words allowed to be PROPOSED. `production`: written explicitly as `off` until G6 passes. Never leave a flag unset in `production`, matching how F19-REQ-025 treats backup (`preflight-production.mjs:178`).
6. **Names.** The README says flag names are proposals and that `capabilities.ts` sets the final ones (`docs/product/prd/README.md:61`). One naming note: `EXPO_PUBLIC_PRINT_READY` collides with the "printable, never print-ready" word rule. It is internal, so it is allowed, but `EXPO_PUBLIC_PRINT_BOOK` avoids a grep false alarm in the claims checks.
7. **Remote flags never turn a feature on.** The withdrawn `remoteConfig.doorways` allowlist (BL-971) is the precedent. Remote config may only turn things off.

### 2.3 Preflight rules so no production flag turns on with an open P0 (G6)

Add a check `flags-vs-p0` to `productionChecks` in `apps/mobile/scripts/preflight-production.mjs`. It takes three inputs that are already files in the repo:

1. `feature-flags.json` (above).
2. `node scripts/trace.mjs --json --no-write`, extended to return `p0ByCard: { "NS-01": { total, tested, open: [...] } }` (section 3).
3. A per-candidate gate record `docs/release/gates/<version>-rc<n>.md`, with one row per flag that is on: the G2 counsel reference, the G3 word approval (founder), the G4 evidence file path under `docs/qa/evidence/`, and the G5 label diff reference.

It FAILs when any of these holds:
- (a) A flag in the `production` env is `on` and any card in its `cards` has a non-empty `open` list.
- (b) A flag is `on` and its gate row is missing, or names a G4 evidence file that does not exist.
- (c) An `EXPO_PUBLIC_*` key in the production env is not in the registry and not in the existing allowlist (APP_ENV, SERVER_FEATURES, and so on). This catches a flag added outside the registry.
- (d) A registry entry has no `killSwitch` that exists in `KillSwitchesSchema`.

It also adds one UNVERIFIED line asking the operator to run `eas env:list --environment production` and confirm that no pack flag is set there. A value set on expo.dev would otherwise bypass (a), because preflight cannot read it (`:338`). The stronger fix is a rule: pack flags live only in `eas.json`, never in the EAS environment. A `release-config.test.ts` case already asserts profile facts (`apps/mobile/test/release-config.test.ts:84`), and the same file can assert that every registry flag is written explicitly in all five profiles.

The P0 waiver rule (`14-test-plan.md:98`) maps into (b): a waived device row is a gate-record row with the founder's written waiver reference. The check refuses a waiver on rows tagged as loss, leak, lock-screen or guilt, using a `waivable: false` column taken from the card's RR-4 reason.

Owner: `ops` (BL-958 already covers the two flags and the release-config test, `docs/BACKLOG.md:3769-3775`). The generic G6 check is one more S row, which I recommend `product` adds as BL-988.

---

## 3. Test strategy

### 3.1 Levels

| Level | Runner and place | What it proves for the pack | Runs |
|---|---|---|---|
| Unit (Node) | vitest in `apps/mobile` (`"test": "vitest run"`, `apps/mobile/package.json:91`); `node --test` for `scripts/`; package tests | Every acceptance row that is a pure rule: budget planner with an injected clock (J-N4 back-off), slip registry, length helper, undo helper, share text equality, stored copy metadata strip on fixtures, Find query sanitising | every PR (`npm test`, `ci.yml:60-63`) |
| Source checks | node scripts under `scripts/` and tests that scan source | No capture start outside Home; no `CSSearchableIndex` or `AppEntity` over letters (BL-962); no network import in Find; lens list never imports a full-size path (BL-956); label guard (BL-975) | every PR |
| Content rules | `packages/content/test/rules.test.ts` | Every new string: no count, fear, gender or banned punctuation (J-N17) | every PR |
| SQL in embedded Postgres | `npm run test:db` (PGlite, `ci.yml:64-73`) | Firsts and seal columns in the trigger tuple and `book_entries`; non-author read clause; the pull window; earlier-versions RPC grant; media write-deny | PRs touching `supabase/**`, and nightly (`nightly.yml:113`) |
| Functions (Deno) | `npm run test:functions`, including the log canary (`supabase/functions/_shared/log/canary.test.ts`) | Any function change; the canary for new events | PRs touching functions |
| e2e-web | Playwright over the Expo web build, `apps/mobile/e2e-web/*.flow.ts` (`playwright.config.ts:13-14`) | Journeys that need no native module: J-N6 two books, J-N7 another day, J-N17 string sweep in context, J-N22, J-N25, J-N26 | **Not run in CI on this branch** (no `e2e:web` in `.github/workflows/*.yml`; a "Web journeys" workflow is registered on GitHub but its file is not in this worktree, UNVERIFIED). Proposal: nightly plus candidate |
| Simulator (Maestro) | `apps/mobile/e2e/flows` (20 flows), kill harness (`kill-harness.yml`) | Kill during save (J-N1), photo pick then kill (BL-955), launch sweep | nightly and when capture paths change |
| Device | founder's phones, one run sheet per build (`docs/qa/run-sheets`), evidence at `docs/qa/evidence/<date>-<build>-<phone>.md` | Speed (J-N13), VoiceOver and AX5, notifications and time zones, two phones, airplane mode | once per candidate, P0 rows first |

Two harness gaps:
- `trace.mjs` counts only `*.test.*` and `__tests__` files (`scripts/trace.mjs:265`). Playwright journeys are `*.flow.ts`, and SQL tests are `*.test.mjs` (already counted). The rework must also read `e2e-web/**/*.flow.ts` and list those ids separately as "journey", just as it lists Maestro flows apart today (`:348-356`).
- `kill-harness.yml` triggers on `apps/mobile/src/lib/capture/**` and its own files only (`.github/workflows/kill-harness.yml:50-57`). The test plan requires the kill harness "when capture, store or erase changes" (`14-test-plan.md:41`). That needs a workflow proposal under `docs/ops/proposed/` adding `apps/mobile/src/lib/photos/**`, `apps/mobile/src/lib/store.ts`, `apps/mobile/src/lib/erase-everything.ts` and `apps/mobile/src/lib/db/**`. Only the founder can apply it.

### 3.2 Tracing the 296 P0 rows (design for BL-964)

**What I counted.** A table scan of every acceptance table headed `| Id | Given, When, Then | Priority | Test title |` in cards `00` to `12` gives 636 row ids. 296 of them have a Priority cell starting `P0`, which matches the register (`14-test-plan.md:102`). The id shapes and their counts: `NS-nn-Rn` 453, `Rnb` 32, `Cn-n` 32, `Rna` 29, `Bn` 26, `An` 25, `Rnc` 12, `Cn` 11, `Gn-n` 5, `Rnd` 3, `Bnb` 2, plus single cases of `Rne`, `Ana`, `Anb`, `Gn-na`, `Gn-nb`, `Gn-nc`. Today 21 distinct NS or NX ids appear in brackets in test titles, across 26 test files (grep).

**Sources.**
1. Definitions: the acceptance tables above in `docs/product/prd/[01][0-9]-*.md`, excluding `13` to `16`. Priority comes from the first token of the Priority cell (`P0 (a)` gives P0). Rows whose Priority is `n/a` (for example the split parent `NS-06-A2`, `06-firsts-sealed-letter-quick-capture.md:95`) are recorded as **split**: citing them warns and does not fail.
2. Cross-cutting ids (`X4-R1`, `X6-R1`, `FRAME-SLIP`) are defined today only in prose (`14-test-plan.md:137`, `00-product-frame.md:67,92`). Recommended default: add a small table to `14` section 7, `| Id | Given, When, Then | Priority | Test title |`, with these three rows, so the same parser reads them. That is a locked-doc change and needs a PR listing the changed ids (`14-test-plan.md:3`).
3. Outside sources: `NX-nn-*` ids from `docs/roadmap/next/03-requirements/*.md` (tests already cite `NX-39-R2`, `NX-36-S13` and others). Read them as "outside" so they never show up as undefined. They do not count toward the NS ratchet.
4. Legacy V2 (`X-REQ-nnn`) stays exactly as it is.

**Grammar** (JavaScript regex source, one alternative per family):

```
NS   = NS-\d{2}-[A-Z]\d{1,2}(?:-\d{1,2})?[a-z]?(?![A-Za-z0-9-])
NX   = NX-\d{2}-[A-Z]\d{1,3}[a-z]?(?![A-Za-z0-9-])
X    = X\d{1,2}-R\d{1,2}[a-z]?(?![A-Za-z0-9-])
FRM  = FRAME-[A-Z]{2,12}(?![A-Za-z0-9-])
```

This covers `NS-01-R9a`, `NS-06-A2b`, `NS-07-C28-13`, `NS-06-B8b`, `NS-07-G11-1a`, `NS-06-C1`, `X4-R1` and `FRAME-SLIP`. The negative lookahead stops `NS-07-C28` from matching inside `NS-07-C28-13`, and stops `B1` from matching inside `B1b`.

**Citation shorthand in the backlog** (needed for "every P0 has a backlog row", RR-3). After a full NS id, bare row tokens inherit the card prefix:
- `NS-01-R37a, R37b, R37c` and `NS-01-R39, R40, R42` (list form);
- `NS-02-R1 to NS-02-R50`, `NS-06-A1 to NS-06-A25`, `NS-33-R9 to NS-33-R16` (range form: expand within the same card and section letter, numbers inclusive, at most 200 apart, as `addRange` does today, `scripts/trace.mjs:74-77`);
- `R37a to R37c` (sub-letter range: expand the letters);
- `NS-07-C28-1 to NS-07-C28-19` (range over the last number).

A range expands only to ids that exist in the definitions. That way `R1 to R50` does not invent withdrawn ids (for example NS-10-R4, withdrawn per BL-978).

**Test evidence.**
- Only bracketed ids in test titles count: `[NS-01-R6][NX-39-R8] ...`. This is the convention the cards' Test title column already uses, and it keeps prose in test bodies from counting.
- `.skip`, `.todo`, `.fails` and `skipIf` titles **do not count**. Today `TITLE_CALL` accepts them (`scripts/trace.mjs:214`), so a skipped test would trace as covered. `scripts/qa/skip-guard.mjs` exists, but it measures skip shares and does not affect trace.
- A title containing `[stand-in]` counts as **partial**, per the rule that a stand-in keeps the row "partly built" (`14-test-plan.md:28`).
- Journey files (`e2e-web/*.flow.ts`) and Maestro tags count as **journey** evidence, listed separately because they do not run in `npm test`.
- Device rows count only at G4, from the candidate's evidence file, never on a PR.

**Ratchet.**
- `docs/qa/trace-baseline.json` holds, per P0 id, the current state: `tested`, `partial` or `missing`. It is generated once by `node scripts/trace.mjs --baseline-write`.
- `node scripts/trace.mjs --no-write --ratchet docs/qa/trace-baseline.json` fails when:
  - (1) a P0 id is `missing` and is not listed as `missing` in the baseline (a new P0 row with no test). The PR must either add the test or add the id to the baseline, so the gap shows in the diff;
  - (2) an id listed as `missing` in the baseline now has a test (the baseline must shrink in that PR);
  - (3) a bracketed NS, X or FRAME id in a test title is defined nowhere (a typo);
  - (4) the register table in `14` section 7 differs from the set computed from the cards (296 today), which enforces "the same PR regenerates this table" (`14-test-plan.md:102`);
  - (5) a P0 id has no backlog citation (RR-3) and is not in the baseline's `noBacklog` list.
- Wiring: change the root `test` script (`package.json:11`) from `node scripts/trace.mjs --no-write` to add `--ratchet docs/qa/trace-baseline.json`. The CI unit job runs `npm test` (`ci.yml:60-63`), so this enforces in CI without a founder workflow edit. Watch the unit job's 5-minute timeout (`ci.yml:53`): the walk over every test file is cheap, but measure it once.
- `--json` adds `p0ByCard` for the G6 preflight.

Founder question 07 Q8 ("Should `scripts/trace.mjs` block merges", `docs/prd/v2/07-*.md:624`) is answered for NS P0 rows by the locked test plan, which puts "the trace ratchet on NS P0 rows" in every PR's suite (`14-test-plan.md:40`). Legacy `X-REQ` ids stay in report mode.

Size [E]: one PR for the parser, sources and tests (about 350 lines with fixtures; fixture cards count as test data under CODE-R02), and one PR for the baseline, the `package.json` line and the `14` section 7 table. #819 (draft, +318/-71, 4 files; GitHub, read 20 Nov) can be reworked into the first.

### 3.3 Regression and candidate suites

These follow `14-test-plan.md:38-43`. Additions:
- **Every PR:** add the ratchet. Run `npm run test:db` whenever `supabase/**` or `packages/api/src/server/**` changes.
- **Every merge to develop:** the full suite, the simulator flows, and the kill harness when capture, photos, store, db or erase change (after the path proposal lands).
- **Nightly:** e2e-web journeys (proposal), the kill harness's nightly 50 (`kill-harness.yml:65`), the db perf suite (`nightly.yml:99`).
- **Every store candidate:**
  - `preflight:production` including `flags-vs-p0`;
  - trace `--json` stored in the build record;
  - device P0 rows;
  - an upgrade from the previous store build with a seeded 1,000-letter and 300-picture Asha book;
  - an export round trip on the previous and new schema minors (NS-36-R7);
  - a privacy label and claims diff (G5, the BL-975 guard);
  - a 500-run kill gate (`release-catalog.rows.mjs:68` records this rule).

### 3.4 Device matrix

From `14-test-plan.md:79-88`, and still blocked on the founder saying which phones he holds (`:83`).

| Slot | Must cover | If missing |
|---|---|---|
| iPhone SE (3rd gen), newest iOS it takes | J-N13 scroll on 1,000 letters and 300 pictures; AX5 layouts; slowest chip | No speed claim for the store build. P1 rows only, so a founder waiver is allowed |
| A phone on iOS 17 | lowest supported OS: notifications API behaviour, `PHPicker` path, FTS5 in the system SQLite (UNVERIFIED version) | A P0 that depends on OS behaviour cannot be waived if it is a lock-screen or loss row |
| Current large iPhone, latest iOS | newest system behaviour, writing tools (D2), system intelligence (D3) | Required for `[X6-R1]` evidence |
| Second phone, same account | J-N2, J-N14, `[NS-06-B8b]`, NS-10 rows, NS-25 | Seals, new phone and other parent cannot turn on in production |
| iPad | App Review runs the iPhone app on iPad | Simulator acceptable for layout P1 rows. A real iPad only if a P0 row needs it |

The evidence rules are fixed by D13 (`16-council-review-round-2.md:65`): an Asha-only test install, and no real name, letter, picture or voice. I add one rule: each evidence file names the build number, the trace JSON hash for that candidate, and each row id run, so G4 is checkable by a script (`docs/qa/evidence/TEMPLATE.md` exists; I did not read its fields, UNVERIFIED).

### 3.5 Evidence files

- Per PR: CI logs. Trace output is not committed per PR; `docs/TRACE.md` is regenerated on demand.
- Per candidate:
  - `docs/qa/evidence/<date>-<build>-<phone>.md` per phone;
  - `docs/release/gates/<version>-rc<n>.md` (G2 to G6 per flag);
  - the trace JSON;
  - the preflight JSON (`preflight-production.mjs --json`, `:424-425`).
- The `no-real-family-data` test runs on each of these (`14-test-plan.md:90`).

### 3.6 Proposals that need the founder's hand (`.github/workflows`)

1. `kill-harness.yml`: widen the PR paths (section 3.1).
2. A nightly e2e-web job (or confirm that "Web journeys" covers `apps/mobile/e2e-web`; UNVERIFIED).
3. The BL-975 label guard job.
4. The CODE-G1 PR size check (`docs/engineering/01-code-and-change.md:31`: "not yet").

All four are written as `docs/ops/proposed/*.md`, the pattern D-124 uses (`docs/ops/proposed/` holds `README.md`, `TEMPLATE.md` and others; directory listing).

---

## 4. Observability and privacy in logs

### 4.1 What exists and what the chapter says

- **Server.** One logger exists at `supabase/functions/_shared/log/log.ts`. Its fields are all closed sets, it has no id fields, and exceptions are reduced to `{code, sqlstate, status}` (`log.ts:1-21`). A canary test pushes Asha fixtures through every path (`log.ts:19-20`; `canary.test.ts`). Chapter 10 still says OBS-R01 is "not yet: the logger does not exist", with a proposed home in `packages/analytics` (`docs/engineering/10-logging-and-observability.md:29`). That is doc drift, and it is mine to fix in a later run.
- **Device.** There is no logger. One `console.warn` sink is in `apps/mobile/src/lib/resilience/global-errors.ts:49`. Sentry is not a dependency of `apps/mobile` (grep of `package.json`), so OBS-R06 stays "not yet". Analytics is off through 1.0 (D-124). For this pack, device observability therefore means typed error codes that stay on the phone, plus the canary.
- **Error registry.** Codes are mirrored in `packages/api/src/envelope.ts` (for example `SCKIL` at `:202` and `SCQTA` at `:206`). Five codes raised in migrations and present in `envelope.ts` are missing from the chapter 02 registry table (`docs/engineering/02-api-and-contracts.md:94-108`): `SCCAP`, `SCBKO`, `SCSTP`, `SCQTA`, `SCKIL` (grep of `supabase/migrations` and the chapter). More doc drift, also mine.

### 4.2 Rules for the pack

1. **Typed outcomes, closed codes.** Every new phone module returns `{ ok: true, ... } | { ok: false, code }` (CODE-R15). Each `code` is a string literal union declared once per module and exported. Messages never carry values (CODE-R16).
2. **Per-feature code sets** (proposed; the owner may rename, but each set stays closed):

| Feature | Codes |
|---|---|
| Photo (NS-01, NS-37) | `pick_cancelled`, `pick_unsupported_type`, `space_low`, `decode_failed`, `strip_failed`, `write_failed`, `derivative_failed`, `orphan_swept`, `killed` |
| Find (NS-02) | `fts_unavailable`, `index_corrupt`, `rebuild_batch_failed`, `killed` |
| Reminders (NS-13, NS-18, NS-32) | `permission_denied`, `budget_full`, `schedule_failed`, `clock_jump`, `killed` |
| Undo helper | `expired`, `superseded` |
| Length helper | `too_long`, `segmenter_unavailable` |
| Share and print (NS-05, NS-07) | `share_cancelled`, `share_failed`, `pdf_render_failed`, `font_missing`, `temp_cleanup_failed` |
| Seals (NS-06 B) | client: `seal_in_past`, `seal_after_limit`. Server: reuse `22023` with fixed text, or register a new five-character code in `envelope.ts` and in chapter 02 in the same PR (API-R09). Never echo the instant |
| Second account (X4) | `owner_mismatch` (sync stops; never logs either account id) |

3. **What never goes into any log, crash report, route param, URL or notification payload:**
   - entry text or transcript, typed day words, a Find query, a Firsts label, picture words or place, a From name, a child name;
   - file paths. `photos/<media_id>.jpg` holds an L3 id, and ids are L3 per BL-959;
   - row or media ids;
   - SQL text or Postgres `message`, `details` or `hint` (OBS-R02).

   Find queries stay in component state and never enter router params (NS-02-R25).
4. **Device diagnostics** may count codes locally (L2) for a future status report, which stays off (`EXPO_PUBLIC_STATUS_REPORT=off` in every profile, `eas.json:17,35,49,63,79`).
5. **Server.** Any new server path logs only through `log.ts`, and adds its event names to `EVENTS` in the same change (`log.ts:26-27`).
6. **Canary (J-N18).** One test module seeds canary strings for every new free-text input: a Find query, a typed day, a typed name, picture words and place, a Firsts label. It drives each module's public API and asserts that the strings never reach:
   - a spy on `console.*`;
   - any logger sink;
   - router params;
   - the notification content passed to `expo-notifications`;
   - `Error.message` of any thrown error.

   This is the device half of OBS-R10. The server half already exists (`canary.test.ts`).

### 4.3 Gaps to file after this design (mine; not done now, read-only)

1. Chapter 10 OBS-R01 drift (the logger exists).
2. Chapter 02 registry drift (5 codes missing).
3. ADR 0028 status line.
4. A `qa` handoff for the device canary module.

---

## 5. Delivery mechanics

### 5.1 How a PR gets counted

- A review counts only if the first line of a PR comment is exactly `## Review A at <40 hex>: PASS` or `: PASS WITH NOTES` (Review B likewise), and the sha equals the head (`scripts/agents/merge-queue.mjs:75,101-105`; CR-44).
- A `PASS WITH NOTES` counts only with a `Must fix: none` line or an equivalent phrase (`merge-queue.mjs:84-90`; CR-63). Authors should know that a bare "PASS WITH NOTES" with no must-fix line does not count.
- Only comments by OWNER, MEMBER or COLLABORATOR count (`merge-queue.mjs:107`). Comments posted through the agents GitHub App most likely carry a different association, so autonomous steward and red-team reviews are advisory and do not count. **UNVERIFIED**: I did not read an App comment's `author_association`. In practice, counted reviews come from interactive sessions on the founder's account, which matches `docs/agents/HARNESS.md:18-19`.
- READY also needs the required checks green (`applied migrations unchanged`, `required`, `compliance-fence`; develop branch protection, GitHub, read 20 Nov; `merge-queue.mjs:71`), the macOS checks for native paths (`:73`), and a head quiet for 10 minutes (`:200`).
- Branch protection requires 0 approving reviews (GitHub, read 20 Nov). The two-review rule is a process rule enforced by merge-queue, not by GitHub.

### 5.2 Size limit

CODE-R02 caps a PR at 400 changed lines and 20 files, excluding lockfile, generated files and test data (`01-code-and-change.md:31`). It is not enforced in CI (CODE-G1, "not yet").

Today's critical stacks (GitHub, read 20 Nov):

| PR | Size | Over the limit |
|---|---|---|
| #842 | +1,229, 11 files | yes |
| #835 | +672, 14 files | yes |
| #836 | +830, 17 files | yes |
| #837 | +686, 15 files | yes |
| #838 | +561, 25 files | yes (lines and files) |
| #839 | +512, 17 files | yes |
| #840 | +257, 11 files | no |
| #798 (Find) | +2,511, 37 files | yes |
| #834 | +835 | merged |
| #841 | +347 | merged |

Some of those lines are fixtures or tests and may be excluded; I did not separate them, UNVERIFIED. Recommendation: either split, or write one `Size exception: <reason>` per PR for the founder (CODE-R02 allows that). Do not let a stack merge silently over the limit. As principal-architect I will flag each one in review.

### 5.3 How many PRs the plan needs [E]

The unit is the size table in `13-engineering-plan.md:9-13`: S = 1 PR, M = 2 to 4 (I use 3), L = 5 or more (I use 6).

**Critical path to "Photos and Find on in production":**

| Item | PRs |
|---|---|
| G0 trace (BL-964) | 2 |
| G6 preflight and flag registry (BL-958 plus the proposed BL-988) | 2 |
| G1: BL-959 (ids L3), BL-933 (export 1.7.0) | 3 |
| Photo stack: 7 open (#835 to #840, #842) | 7 |
| Photo follow-ups: BL-953, BL-955, BL-956, BL-870 | 6 |
| NS-37 derivatives (BL-932) | 3 |
| Find split (BL-952) | 6 |
| `[X4-R1]` (BL-961) | 2 |
| `[X6-R1]` (BL-962) | 2 |
| Length helper (BL-957) | 1 |
| Undo helper (BL-954) | 1 |
| Inventory rows (BL-960) | 1 |
| Words for photo and Find (part of BL-965) | 2 |
| **Total** | **about 38 to 40** |

At least 80 counted reviews.

**Whole pack, excluding parked NS-26 to NS-29 and counting NS-17 as one language:**

| Item | PRs |
|---|---|
| NS-09 | 5 |
| NS-10 with BL-922 | 4 |
| NS-08 | 2 |
| NS-11 | 2 |
| NS-12 | 6 |
| NS-13 | 3 |
| NS-14 | 2 |
| NS-15 | 1 |
| NS-16 | 2 |
| NS-17 | 6 |
| NS-18 | 1 |
| NS-21 | 2 |
| NS-22 with BL-985 | 4 |
| NS-01 | 17 |
| NS-02 | 6 |
| NS-23 | 1 |
| NS-24 | 2 |
| NS-06 A | 3 |
| NS-06 B | 7 |
| NS-06 C | 3 |
| NS-07 | 5 |
| NS-05 | 3 |
| NS-25 | 6 |
| NS-33 | 5 |
| NS-34 | 1 |
| NS-36 | 3 |
| NS-37 | 3 |
| NS-32 | 3 |
| Cross-cutting (trace, preflight, X4, X6, slip, length, undo, words) | 14 |
| **Total** | **about 122** |

That is at least 244 counted reviews. With one re-review round on half the PRs, about 300 review sessions.

**For scale only (no dates):** the last 100 closed PRs into `develop` show merges of 25, 33 and 23 a day on 9 to 11 Nov, then 1 to 7 a day from 13 to 20 Nov (GitHub, read 20 Nov). At the 9 to 11 Nov pace, the critical path is a couple of days of review. At the recent pace it is one to several weeks. The pack rate is therefore set by how many counted-review sessions run each day, which is the founder's and Karma's call.

### 5.4 Re-review churn is the hidden cost

Every head move voids both counted reviews (CR-44). Stacked PRs make this worse: when a parent merges, the child usually needs a rebase or a merge of `develop`, which moves its head. Rules I recommend:
- (1) Merge stacks bottom-up, one at a time. Rebase the child only after its parent merges, and review only after CI is settled and the head is quiet (`merge-queue.mjs` `--quiet-minutes`).
- (2) No author pushes while a review claim is open (`docs/agents/harness-v2/LESSONS-2026-11-08.md:10`).
- (3) A proposal for Karma: when `git range-diff` shows the PR's own commits unchanged after a rebase, a reviewer may post a short PASS at the new sha that cites the old one. This is still a counted review at the new head, so CR-44 is unchanged; it only makes the second look cheap. The red team already has the equivalent through fingerprints (`docs/agents/HARNESS.md:234`).
- The merge method (squash or merge commit) affects how often children conflict. I did not read the repo setting, UNVERIFIED.

### 5.5 Harness state and caps (facts)

- `agents.yml` is `disabled_manually` (GitHub, read 20 Nov). When it does run, the plan job also needs `vars.AGENTS_ENABLED == 'true'` (`.github/workflows/agents.yml:42`), on a cron of `17,47 * * * *` (`:22`).
- Limits are `max_runs_per_day_total: 30`, `max_parallel: 6`, `max_open_agent_prs: 10` (`agents/roster.json:13-19`). Per-agent `daily_runs` sum to 50 across 26 agents (computed from the roster), so the team cap of 30 binds before the per-agent caps. Slots go in roster order (`dispatch.mjs:241`, the roster array order), which means `red-team`, `product`, `qa` and `mobile` are served first.
- The team limit counts every open PR with an `agent:` label, drafts included (`dispatch.mjs:76,235`). 170 PRs are open, 66 of them agent-labelled (GitHub, read 20 Nov). With the harness on, every agent would be "idle: team limit" and would only review and fix (`dispatch.mjs:270-272`).
- The dispatcher's "taken" test reads `bl-nnn` from the branch or title (`scripts/agents/lib.mjs:137-145`). Three open PRs that do backlog work carry no BL id in branch or title: #798 (BL-952), #758 (BL-966), #819 (BL-964). A dispatcher run would hand those rows out again, duplicating the work. Fix: retitle them with the BL id.
- Rows blocked on something other than backlog ids are never dispatched until a person edits the status (`lib.mjs:105-110,124-125`). Examples: BL-959 "blocked (PR #797 merged on develop)" is now satisfiable, since #797 is merged, but needs a hand edit to `ready`. BL-979, BL-980 and BL-983 wait on counsel.

### 5.6 Recommended harness settings for this plan (proposals for Karma)

None of these can be applied by me. Roster and dispatcher edits are owned by the founder (`.github/CODEOWNERS:31` per `HARNESS.md:24`).

1. **Clear the team limit before turning anything on.** Close or un-label stale agent drafts; 70 of the 170 open PRs are drafts (GitHub, read 20 Nov). Then change `dispatch.mjs:235` to count non-draft agent PRs only. Unmerged drafts still go stale, but they do not hold review capacity, and that capacity is what the cap protects.
2. **Keep `agents.yml` off for the critical path. Run it through interactive sessions by work lane.** Counted reviews come from founder-account sessions in any case. If the harness is switched on, use `ONLY_AGENT` (`dispatch.mjs:239`) for `qa,ops,content,legal,privacy,data-architect`, which are non-critical-path authors whose PRs are small. Pause the rest with `paused_until` (roster `$comment`).
3. **Work lanes, owners and WIP limits.** WIP means open non-draft PRs awaiting review.

| Lane | Owner handle | Rows | WIP | Notes |
|---|---|---|---|---|
| L0 Gates and tooling | `qa` (trace), `ops` (flags, preflight, label guard) | BL-964, BL-958, BL-988 (proposed), BL-975 | 2 | First. Nothing turns on until L0 lands |
| L1 Photo | `mobile` session 1 | stack #835 to #842, BL-953, BL-955, BL-956, BL-932 | 2 | Merge order fixed (`01-photo-with-a-letter.md:244`) |
| L2 Find | `mobile` session 2 | BL-952 six PRs | 1 | After #798 is split |
| L3 Keeping and reminders | `mobile` ("reminders owner") | BL-966, BL-967, BL-977, BL-978, BL-922, BL-943 | 2 | NS-32 before NS-13 (`13-engineering-plan.md:51`) |
| L4 Cross-cutting rules | `mobile` | BL-961, BL-962, BL-963, BL-954, BL-957 | 1 | Small. Each unblocks several cards |
| L5 Data and sync | `data-architect`, `sync` | BL-959, BL-960 (with `privacy`), BL-987, later BL-968 and BL-969 | 1 each | `supabase/**` also needs red-team and `approve-migration` (D-041) |
| L6 Words | `content` | BL-965 | 1 | Never blocks engineers. PROPOSED keys |
| L7 Counsel and research | `legal`, `user-research` | BL-949, BL-981 | 1 | Founder sends packets |
| Reviews | two lens sessions; stewards advisory | all | n/a | Review capacity sets total WIP: keep the open non-draft total at or below twice the counted-review PRs cleared per day |

4. **Roster numbers** (proposal):
   - Keep `max_runs_per_day_total` at 30.
   - Set `daily_runs: 0` for `marketing`, `support`, `decision-science`, `payments`, `analytics` and `speech` until NS-17 starts. That frees about 9 runs.
   - Leave `mobile` at 4 runs and `wip_limit` 3 (`roster.json:90` block). One agent handle carries L1 to L4, so the per-handle WIP limit, not the lane, is what binds. Either accept serial lanes or add a second mobile handle; that is a roster change.
   - Set `max_open_agent_prs` to 10, counting non-drafts.
5. **Steward reviews.** Stewards review PRs touching their `review_paths`. Mine are `packages/**`, `apps/mobile/src/lib/**`, `supabase/functions/**` and `packages/api/**` (charter), which covers most of the pack. A steward review is a third, advisory read. To save runs, ask stewards to review only PRs that touch a P0 row or a contract (`packages/api/**`, `supabase/**`), and skip pure UI PRs.

---

## 6. Release train (order of milestones, no dates)

Rules that shape the train:
- No over-the-air updates. `preflight-production.mjs:306-313` treats `expo-updates` as absent, so every change ships in a store build.
- Native changes cost EAS builds. D-092 allows 15 iOS builds a month on EAS Free (cited in `01-photo-with-a-letter.md:244`, UNVERIFIED by me).
- A build carries code dark, but turns a flag on in `production` only through G6.

| Milestone | Turns on in production | Ships dark (flag written `off`) | Gates that must hold |
|---|---|---|---|
| M0 Floor (no store build needed) | nothing | n/a | G0 trace ratchet on; G6 check merged; flag registry; ADR 0028 marked Accepted; BL-959; BL-960 drafted |
| M1 Store build: keeping and rules | NS-09 remaining rows, NS-10 last gap, NS-13-R14 sign-out cancels, NS-32 budget (no new surface), NS-33 floor fixes, NS-21 list, NS-15 another day, NS-14 switcher, BL-985 Quiet, `[X4-R1]`, `[X6-R1]`, `[FRAME-SLIP]` | Photos and Find, if their stacks merged (on in `preview` and `testflight`) | G3 words for new lines; G4 device rows for NS-09, NS-10, J-N21, J-N24; G5 diff empty (no new data leaves the phone); G6 for every flag that is on |
| M2 Store build: Photos and Find | NS-01, NS-02, NS-36, NS-37, NS-22 calm header, NS-11 Save a copy, NS-23 one past letter | NS-05 Share L1 | G1 (ADR 0028 plus export 1.7.0); G2 counsel on the photo label line; G4 on SE 3, iOS 17 and a second phone (J-N9, J-N10, J-N13); G5 label and claims; G6 zero open P0 on those cards |
| M3 Store build: Share, Print, Firsts | NS-05 L1 (after counsel Q45), NS-24, NS-07 print (after font-licence evidence), NS-06 Part A (after the five-parent study), NS-18 typed days | NS-06 Part B | G2 Q45; G3; G4; export minor for Firsts (ADR 0038) |
| M4 Store builds: counsel-gated | NS-06 Part B seals (counsel on minors; two-phone B8b), NS-16 From name (Q45, Q46, Q48, Q54), NS-12 earlier versions (Q51, Q32, Q48), NS-25 other parent (Q48, Q49, Q53; #767 and #827), NS-17 per language (native reviewer) | n/a | each card's counsel gate; `supabase/**` red-team and `approve-migration`; two-phone device rows |
| Side track | NS-04 spike on `exp/hands-free-spike`, never merged; NS-06 Part C only after GO; NS-08 backup readiness note (flip is the founder's, never in this train) | n/a | spike exit lines; `security-architect` on entitlements |

The README's defaults name builds 13 to 15 (`docs/product/prd/README.md:69-74`), but ruling T5 and the README itself say the roadmap owns timing (`:65`). The table above is order only.

---

## 7. Risks and open questions

### 7.1 Risks (likelihood x impact, each H, M or L)

| # | Risk | L x I | Mitigation |
|---|---|---|---|
| R1 | Review capacity: about 244 counted reviews for the pack, from founder-account sessions only | H x H | Section 5: lanes and WIP; critical path first; size discipline; range-diff re-review rule; stewards advisory and focused |
| R2 | Team limit: 66 open agent PRs against a cap of 10 stall any harness run | H x M | Sweep drafts; count non-drafts (section 5.6) |
| R3 | Oversized photo and Find PRs reviewed in a hurry | H x H | Split, or explicit size exceptions; flag each in steward review; no stack merges with a red macOS check (`merge-queue.mjs:193-197`) |
| R4 | Trace reports green falsely (skipped tests, prose ids, stand-ins) | M x H | Bracket-only titles, skip and todo excluded, `[stand-in]` partial, register-equals-cards check |
| R5 | A production flag turned on outside `eas.json` (EAS environment) bypasses G6 | M x H | Rule that pack flags live only in `eas.json`; preflight check (c); an `eas env:list` step in the candidate checklist |
| R6 | Devices not available (SE 3, iOS 17, second phone) | H x H | Founder names phones before the first run sheet (`14-test-plan.md:83`); loss, leak, lock-screen and guilt rows are not waivable, so seals, new phone and other parent wait |
| R7 | Second account on one phone (D1) leaks A's book to B | M x H | ADR 0031 before any sign-in change; `[X4-R1]` integration test; device row |
| R8 | Writing tools cannot be switched off from React Native | M x H | BL-962 records the finding; native prop; until fixed, D2 is unmet and Review cannot claim it |
| R9 | Seal pull clause misses or double-delivers around the cursor | M x H | ADR 0034; injected-clock two-phone test B8b; idempotent apply on row id; server time only |
| R10 | Print fonts: a CJK face pushes the app past the size budget (40 MB, `scripts/size/lib.ts:2-3`), or `expo-print` does not embed or subset as needed | M x M | ADR 0037; measure with `scripts/size`; ship print for the covered scripts only; golden PDF text test. Embedding behaviour UNVERIFIED |
| R11 | `Intl.Segmenter` missing on Hermes | M x M | BL-987 question; vendored segmenter fallback in `packages/core` (pure, CODE-R10) |
| R12 | Export minor collisions across Photos, Firsts and Seals | M x M | ADR 0038, merge-order allocation; fixtures per minor |
| R13 | Kill harness skips photo and store changes | M x H | Workflow path proposal (section 3.6); run the kill harness by hand on photo PRs until it lands |
| R14 | Duplicate agent work on BL-952, BL-966, BL-964 | M x M | Retitle #798, #758 and #819 with BL ids |
| R15 | `flags.familyTeaser` defaults to `coming_soon` (`remote-config.ts:88,90,122`) while the frame says nothing anywhere says "coming soon" (`00-product-frame.md:67`) | M x M | Check whether any surface still reads it (`capabilities.ts:24` mentions it); if so, change the default to the quiet variant in an additive PR. Whether it renders today is UNVERIFIED |
| R16 | Review independence: both lenses are the same model family (`HARNESS.md:18`) | H x M | Different lenses and prompts; the red team on `supabase/**`; device evidence as an independent check; disclose in build records |
| R17 | Standards drift confuses agents (OBS-R01 "not yet" though the logger exists; registry missing 5 codes; ADR 0028 "Proposed") | H x L | My conformance sweep fixes these as doc PRs after this design |
| R18 | iOS 64 pending notification limit and time zones cause a night reminder or a lock-screen name | M x H | ADR 0032; planner unit tests with an injected clock and zone changes; J-N5 and J-N24 device rows |
| R19 | Native builds exceed the EAS Free monthly quota | M x M | Batch native changes (photo module, writing-tools prop) into one candidate; JS-only changes ride along |

### 7.2 Open questions, each with a recommended default

| # | Question | Who decides | Default I recommend |
|---|---|---|---|
| Q1 | Do counted reviews come only from founder-account sessions, or can the agents App count? | Karma, founder | Founder-account sessions only, as today; App reviews are advisory |
| Q2 | Does the NS ratchet block merges (07 Q8)? | Karma (the locked plan already says yes) | Yes for NS P0; legacy `X-REQ` stays report-only |
| Q3 | Where are `X4-R1`, `X6-R1` and `FRAME-SLIP` defined for trace? | Karma, `qa` | A three-row table in `14` section 7, in the BL-964 PR |
| Q4 | Flag registry format and home | Karma | `apps/mobile/feature-flags.json`, read by the app and preflight |
| Q5 | Kill switch per card, added with the flag? | Karma | Yes, in the same PR; names as in section 2.2 |
| Q6 | Should drafts count against `max_open_agent_prs`? | founder (owns `scripts/agents`) | No; count non-drafts |
| Q7 | Export minor numbering | `data-architect` | Merge order (ADR 0038) |
| Q8 | e2e-web in CI | founder (workflow) | Nightly and candidate, not per PR |
| Q9 | Harness on for the pack? | founder | Off for the critical path; on with `ONLY_AGENT` for small lanes once the team limit is cleared |
| Q10 | A real iPad, or the simulator? | founder (spend) | Simulator for P1 layout rows; a real iPad only if a P0 row needs it |
| Q11 | Range-diff re-review rule | Karma | Adopt: still a counted review at the new sha, so CR-44 is unchanged |
| Q12 | Second mobile handle for parallel lanes | founder (roster) | Not yet; run L1 and L2 as two interactive sessions under the `mobile` handle |
| Q13 | Print for scripts without a bundled face | Karma, `legal` | Print flag on only for scripts with a licensed bundled face; others see no print option until the budget allows |

---

## 8. What I did not do or could not verify

- I ran no tests, builds or scripts beyond reading files and making read-only `gh api` calls. Nothing was posted, committed or pushed.
- Not read this session: each card's full text beyond the lines cited; `docs/engineering/05` and `06` beyond the chapter list; `docs/qa/evidence/TEMPLATE.md`; the Web journeys workflow file; the repo merge-method setting; the agents App comment association.
- UNVERIFIED Apple and library behaviour: `expo-print` font embedding and subsetting; `Intl.Segmenter` on Hermes; React Native's writing-tools switch; the FTS5 version on iOS 17; the EAS Free build quota. Every Apple fact must be re-read from the source before submission, per the Compliance role's standing rule (`16-council-review-round-2.md:111`).
