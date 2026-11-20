# Engineering project plan, part 2: NS-38 to NS-52 and the briefs (Karma, 20 Nov 2026)

Status: v1, 20 Nov 2026 at about 21:15 UTC, against develop `f0cf1c7a` (rev 2 of the requirements: #934 merged as `88f3a975`). Docs only. Split from `17-engineering-project-plan.md` so that file stays near its size; read that file first for the tags, the wave model, the reviewer lenses and the founder questions. This file adds rows and rules the first file lacks. It sets no dates and decides nothing that is the founder's (17 section 5.4 lists those with a default).

Tags as in 17: [V] read in a file or on GitHub on 20 Nov, [E] an estimate (here, the designs' own sums, not a measure), [U] not verified. Cites to errata (E1 to E61) are to `docs/product/prd/18-errata-after-lock.md` on develop; E62 to E68 and CL-136 to CL-142 exist only on #993 (head `58882897`, open, not merged) and are marked "#993". CL-nnn rows are in `docs/product/prd/GAP-LOG.md`. A1 to A13 are CR-69 (`docs/agents/cto/RULINGS.md:698-710`). Where a design and a card disagree, the card wins (CR-66).

Sources: designs `docs/tdd/new-scope/12-first-run-5.md`, `17-days-prs-and-amendments.md`, `16-media-flags-tests-prs.md` and their siblings (PRs #964 to #976 per CR-69's question line); briefs under `docs/engineering/readiness-20nov/briefs/{mobile,data,platform}/` (#937 to #963). A brief's size and its README's [E] are the brief author's.

---

## 1. The three new stacks

| Stack | Cards | PRs | Lines [E] | Where the PR list is |
|---|---|---|---|---|
| First-run, Drop D | NS-38 to NS-45 | 21 (FP-1 to FP-20, FP-10 as a and b, FP-16 as a and b; FP-11 unused) | about 5,600 | `12-first-run-5.md:34-62` |
| Days, culture, Home | NS-46 to NS-50 | 35: Stack A 4, B 18, C 5, P 8 | about 8,480 | `17-days-prs-and-amendments.md:5-60` |
| Media: photo moments, library, video | NS-51, NS-52 | 32 shippable: the design counts 33, and its PR 1 (amend #835) is withdrawn by CR-69 A2; 2 are spikes | about 7,300 | `16-media-flags-tests-prs.md:99-141` |

About 88 PRs and 21,400 lines [E] (21 + 35 + 32; the design's media PR 1 is withdrawn) on top of 17's 4.3 counts. They land in waves 1 to 5 as 17 section 4.3 defines them; section 6 below says how that moves the bands. Every PR is at most 400 lines and 20 files in its design, so none needs a size exception unless review finds it larger [E].

### 1.1 First-run, Drop D (NS-38 to NS-45)

Drop D ships after wave 1 and Drop A, and before any family outside the founder's signs in (E43, CL-117; card 21 drop table `21:167`). Which drop it ships in is the founder's default to accept (17 section 5.4).

- Order and owners: FP-1 (content, words wait for the founder), FP-5, FP-17, FP-12, FP-9, FP-16b, FP-18 can start now; `lib/first-run/*` is a queue: BL-922a, BL-922b, BL-978a, then FP-6 (`12-first-run-5.md` section 3, items 1 and 2). FP-2 (consent builder) lands before any other `consent.ts` change; BL-978a drops its R7 hunk because `heldAnswers` (`consent.ts:88`) already closes NS-10-R7 [V design; not re-read in code].
- Not in the FP count (`12-first-run-5.md:62`): DA-1 (File 28 re-stamp and apply path, fail open per the card), DA-2 (purge of never-confirmed `auth.users` rows after 7 days, O-12), DA-3 (`withdraw_sensitive_data`), NSC-01 and NSC-02 (security-architect), the SystemLine component and the words.
- Added by errata: FP-19 (NS-42-R17, the sensitive-data withdrawal control in Me, E46; row needs DA-3) and FP-20 (Turnstile bot check on email send, owner `mobile`, L; the Turnstile and Supabase CAPTCHA switch is the founder's). A content PR for the plain notice at collection NS-42-R18 (E51; the words wait for the founder; FP-2 or FP-3 carries the keys). One migration for the `age_signal` leftovers and two docs PRs (E63, #993; no BL id until #912 merges, E60).
- E62 (#993): Send answers "check your email" for a new and an existing address alike; the refused-region screen shows only after the code step (FP-6 maps `region_refused` after it). E47: the region hook fails open and the hook is off until counsel reads it. E56: a No at the age step sends nothing.
- A7 (CR-69): FP-9 builds the foreground `getCredentialStateAsync` check and the JavaScript `addRevokeListener`; no new native code. CR-69 names owner `sync`; the design's FP-9 row says `mobile`. Karma to reconcile before dispatch [U which].

Consent rollout order (A6, `RULINGS.md:703`; `12-first-run-5.md:74`), four steps, in order:
1. The founder applies migration `20261108000000` first (backward compatible).
2. The FP-2 builder ships, and its release is blocked until the APPLY.md file 29 check (`pg_get_function_identity_arguments` ends in `p_app_build text, p_os_major integer`) is shown as run on the hosted project; the PR states it. Its test calls `record_policy_act` with both the old and the new argument list.
3. Ops runs a measured gate: no sheet acts with `app_build` null for 14 days (an engineering default, not a card number), plus a minimum-build or update-line condition. The PR states what an old build shows on error 23502.
4. Only then does the founder set `app.consent_fields_required`. Owners: `sync`, ops. FP-15 (the update-line reader) is a courtesy, not the gate.

### 1.2 Days stack (NS-46 to NS-50)

- Drops (card 21, CL-015 at `GAP-LOG.md:526`; founder acceptance pending): A with the next build (Stack A, 4 PRs, about 980 lines), B only if its gates close before the 1.0 freeze (Stack B and P1, about 4,730), C after 1.0 is approved (about 1,300); level 2 is P2 to P8 (about 1,470). NS-49 level 1 is Drop B (E31).
- B1 `budget.ts` (registry, ranks, `chooseOnePerDay`) is the same work as BL-966 (a) (A1: `TOTAL_MAX = 60`, plan notices first); count it once. B1 comes before every planner PR (NS-46-R30).
- E57: no `EXPO_PUBLIC_DAYS_ASK` flag; a paused family gets no day notes. E64 (#993): the planner reads `celebrations_paused` locally only; no server reader in Drop A. E45: the neutral lock body `days.lock.body.neutral` carries no `{child}` (words: founder).
- Two files, one pattern (A4, `RULINGS.md:701`; E37; NS-46-R3): the days store and the moments index are separate versioned files in Application Support, outside `scribe.db`. Write order: create the empty file, set the backup exclusion, read it back, then write bytes, read back after the rename and on every open; a false read-back deletes the file and the store then refuses writes; sweep leftover temp files at launch. Clear order: delete the file first, before `forgetReminders` and before any await; the owner key is checked on read and fails closed. Protection is no weaker than `scribe.db`. A `local` file is adopted only at the claim step (NS-47-R7), by the same person. `dismissedOn` lives in the days file. `ownerKey` is a hash of the user id (E66, #993). A12: two stores, not one (Q-E5). Rows: days B5 and B6a, media PR 26, data brief 18 (`NS-47`, wave 3).

### 1.3 Media stack (NS-51, NS-52)

- Design PR 1 (amend #835) is withdrawn: A2 says #835 merges as it is, and NS-52 lands in a new local migration after migration 11 (card 27 calls it 12; the number is the next free local id at merge, A11; the rebuild drops the `searchable_letters` view first). Owner `data-architect`.
- One native module line (A3, E38): `scribe-photo` takes the NS-52 multi-select pick, the video check and the re-encode; `scribe-library` takes the NS-51 library read and nothing else. The design's name `scribe-photo-library` (media PRs 27 and 28) is wrong; use `scribe-library`. No third module.
- Release: NS-51 is a spike only in Build 13 (E32, CL-052 at `GAP-LOG.md:563`); it ships in 1.1 after the counsel read and device rows. NS-52 ships after 1.0. NS-37 stays until NS-52 ships (E52). All of this is a default pending the founder.
- E44: the field is `position`, and a poster name derives from the media id; the free-space floor is 200 MB, then twice min(video bytes, 100 MB) plus 50 MB (both PROPOSED). E65 (#993): one lens card per letter (unblocks media PR 19).
- `expo-video` (media PR 17, S, T2, two reviews): ADOPT at its SDK 57 pin through `expo install`, behind `EXPO_PUBLIC_VIDEO`, with a test that background playback and Picture-in-Picture stay off, after 1.0 (A8, E34). `jest-expo` and React Native Testing Library only on the founder's approval. Avoid `date-holidays`, `@hebcal/core`, `expo-media-library`, `@formatjs/intl-segmenter`. Grapheme counting reuses `packages/core/src/text.ts` with a new export; `splitsCluster` (`text.ts:78`) is unchanged.

### 1.4 One kill-switch PR (A5, `RULINGS.md:702`; E38; CL-111)

Keys: `killSwitches.photoMoments`, `.videos`, `.signIn`, `.libraryDays`; flags `EXPO_PUBLIC_PHOTO_MOMENTS` and `EXPO_PUBLIC_VIDEO`. Retired: `EXPO_PUBLIC_MEDIA_ATTACH`, `killSwitches.media`, `killSwitches.mediaAttach`. `mediaSync` and `EXPO_PUBLIC_MEDIA_SYNC` exist for variant B only (pictures leave the phone), which is the founder's choice and is not built. Files: `kill-switches.ts`, `remote-config.ts`, `remote-config.test.ts`, `contract-drift.test.ts`, the "Eight keys" line in `packages/api/README.md`, `KILL_SWITCH_FLAG`, and the M14 older-signed-config rule. Owner `mobile` with `sync`. It overlaps FP-5 (`signIn`), days B4 (`libraryDays`) and media PR 6; whichever merges second rebases. The header fix (E21): a switch hides a feature, never turns one on, never stops export.

## 2. Rows from the agent briefs that the plan had no row for

Briefs #937 to #963 are on develop except #946 and #952 (platform briefs, open at 21:30 UTC [V gh]); develop holds 18 of the 23 platform brief files (the others are on those open PRs or otherwise not on develop [U]). Waves and sizes are theirs [E].

Platform (`briefs/platform/README.md`, 23 briefs):
- Release path: B13-CHECKS (wire the `release-ios.yml` checks; founder pastes the patch) and B13-CUT (release branch and RC tag), and BL-976-WIRE (the keep-safe preflight is wired nowhere; `release-ios.yml` runs no preflight). Add all three to 17 section 3a's release path.
- CI: CI-PIN (17 unpinned `uses`), CI-SECRET (Option A own script, or B a new tool, which is a dependency: founder, F-12), CI-PRSIZE, CI-COV, CI-LINT (founder approves the dev dependencies), CI-SIZEGATE, CI-Q1 and CI-Q2 (macOS queue), QA-TITLES, KILL-MEDIA (M, wave 2, after #835 to #839), HG-H3 (stack status script; `scripts/agents/` is the founder's).
- BL-929 splits per brief 19 and 20: ASHA seeded generator (M, wave 1 to 2) and PERF profile with markers (M, wave 2; needs a BL row from product). Hand runs record 20 samples per metric and are marked `[stand-in]`, never green; 200 samples once the markers exist (E53).
- BL-964 PR 2 no longer waits for #846 (closed): the ratchet targets locked cards 00 to 16 first, then 19, 21, 27 and the function files as each merges (E55, CL-129); whether `--check` blocks is the founder's (07 Q8).
- HG-MQ (brief 23, A9): a `skipped` required check counts only when the queue itself computes not-native and the `changes` job succeeded (a test is required). The proposal lives under `docs/ops/proposed/` for the founder to apply (`scripts/agents/**` is CODEOWNERS:31); `eas.json` stays in `NATIVE_PATHS` (A9; `merge-queue.mjs:73`), so a brief that removes it from that list (the #952 draft of HG-MQ item 1) must be corrected before it is applied; the founder patch instead adds `apps/mobile/eas.json` to the `changes` match (`ios-compile.yml:308` (the `changes` job starts at :288)). Relevant to 17 risk 9. The F4 two-job deploy proposal is the same kind (db-production approval covers the whole job, so a green dry run pushes alone).
- Tests in `scripts/guards/*.test.mjs`, `scripts/qa/skip-guard.test.mjs`, `scripts/packs/*.test.ts` and `scripts/size/lib.test.ts` run in no CI list (platform README); no row yet.

Data (`briefs/data/README.md`, 22 briefs):
- T1 (sync, S) and T3 (qa, S) and BL-959 (S x3) start now, wave 1 (17 had T1 to T3 in wave 2).
- G1 (brief 14, `sync_pull` consent gate, data-architect, S to M, wave 2; red-team and security-architect) has only handoff #909 in 17. E9: the decline rule is enforced on the phone, and NS-10 gains a P0 row for it.
- H1 (brief 15) is wave 3, three SQL-heavy PRs, blocked on T1, Karma OQ-K1 and the founder's size exception OQ-F5 and `approve-migration` (17 had it "before the first new field group").
- NS-47 days store (brief 18, wave 3), BL-968 data (brief 19: L12, S2, E2; M; wave 4), L14, L15 and S3 (brief 21; S plus L; wave 5; E7 adds S3, the call that empties withheld words), BL-979 S5 RPC (brief 22; L; wave 5).
- BL-969 is L, 4 PRs (brief 20), with a named boundary test (`statement_timestamp` against `now()`); E3, E4, E6 are in 17's BL-969 row.

Mobile (`briefs/mobile/README.md`, 30 briefs): HO-908, HO-910, HO-911 (17 listed them only as handoffs), BL-922a and BL-922b, BL-978a and BL-978b (L), BL-966a, b and c, BL-952-8 (2 PRs, R39 reword), BL-956 (2 PRs), BL-957 (1 brief), P1 (iCloud progress), and the NS-10 phone-side decline row (E9). Open-PR findings in that README: #894 is 12 files, +228/-4 against develop (17's 2,081 lines counted squash-merged #881 to #885; re-run for this file with `git merge-tree` on 20 Nov [V]); BL-922's "922b" is not #869 (`consent.tsx:134` and `:151` still call `readAccountBooks` twice).

## 3. Gate, process and id rules these stacks add

- Gates G7 to G11 are review rules, not CI gates, until the founder pastes the workflow patches; `docs/engineering/readiness-20nov/quality/CHECKS-AND-BALANCES.md` C-03 to C-10 bind lens A and lens B (A10).
- G0 (every P0 has a test and a backlog row): E30 counts about 70 P0 rows with no backlog row (`BACKLOG-GAPS.md`), so G0 cannot pass until each is covered. No new BL id is allocated until #912 merges (E60); local migration numbers come from merge order, never from a design (A11). CL-115 proposes rows BL-129, 132, 138, 139, 162, 163, 168, 254, 287, 290, 299, 327 and 329 [V as named in CL-115; not each row read]. XCUITest target (BL-162) before G4 (E42). BL-287 is the shared writing-tools test (E41).
- Export minors go by merge order: the next free minor at merge (E5), not 1.7.0 and 1.8.0 fixed for Firsts and seals.

## 4. Capacity, in one paragraph

The three stacks add about 88 PRs. At 4 passes a PR (17 section 4.2) that is about 352 passes. Wave 2 absorbs first-run, days A and B and the media spine; wave 5 absorbs NS-51. Against 17's bands (low 46, mid 290, high 1,390 passes a week) that is about 7.7 weeks at the low band, 1.2 at the mid band and 0.3 at the high band, on top of 17's own [E]. This is arithmetic on the designs' counts, not a forecast; the founder's gates bind first (17 section 5.2).

## 5. Designs added since 17 section 10

`12-first-run.md` to `12-first-run-5.md`, `13-days-culture-home.md`, `14-days-planner-and-catalogue.md`, `14-media-library-video.md`, `15-home-and-picture-first.md`, `15-media-ingest-lifecycle.md`, `16-days-tests.md`, `16-media-flags-tests-prs.md`, `17-days-prs-and-amendments.md` (all in `docs/tdd/new-scope/`, on develop [V]). Decisions on their open questions: CR-69 A1 to A13.

## Not verified

- No id diff of cards between `450bcb4a` and `88f3a975` (100 files changed under `docs/product/prd`; counted, not read id by id). The new-scope sizes are the designs' sums.
- Brief README statements about heads and sizes other than #894's merge result (re-run here) were not re-run.
- Whether `scribe-library` is already used in a brief or design other than the one cited; the FP-9 owner conflict; the CL-115 rows individually.
- #993 is open: E62 to E68 and CL-136 to CL-142 may change before it merges.
