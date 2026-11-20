# Pack delta: what the newest product material changes for engineering

Status: v1, 20 Nov 2026, `principal-architect`, task RD-A. Docs only. Nothing here decides a founder, counsel or product question, edits a card or a design file, or sets a date. Words a parent reads are not touched. The founder's reading order: section 1, section 3 (the ten changes), section 4 (what goes to product).

This file is the index. The detail is in six numbered files in this folder:

| File | Covers |
|---|---|
| `PACK-DELTA-1-first-run-cards-38-45.md` | NS-38 to NS-45, download to first kept letter (card 19) |
| `PACK-DELTA-2-days-culture-catalogue-home-46-50.md` | NS-46 to NS-50: days, cultural background, catalogue, picture-first, Home today (card 21) |
| `PACK-DELTA-3-photo-library-and-media-51-52.md` | NS-51 photo moments, NS-52 pictures and videos with a letter (founder round 2; cards 26 and 27) |
| `PACK-DELTA-4-function-requirements.md` | the 741 function requirements by function file, and the engineering work no card carries |
| `PACK-DELTA-5-function-addenda-constraints.md` | the addenda as engineering constraints (security, privacy, quality, ops, AI limits, language packs, lifecycle) with source lines |
| `PACK-DELTA-6-design-errata-and-moved-code.md` | errata E23 to E30, e2e design and design system v2, handoff conflicts, code that moved |

Companion files: `INPUTS.md` (every input, its sha, merged or not) and `RESYNC-LIST.md` (what to re-sync when #846 merges).

Tags: [V] verified (file and line, sha or command named), [E] estimate (basis named), [U] not verified. Branch and sha of every input are in `INPUTS.md`. "Cards beat 14 beat 13 and design beat BACKLOG" is CR-66; the locked pack is `450bcb4a` (PR #846, open). Anything newer is UNLOCKED.

## 1. Legend

Verdicts (my wording, a reading aid, not a ruling):
- NO DESIGN YET: no engineering design file covers it; a new design is needed before the first PR.
- DESIGN HOLDS: our merged designs already say what the new material needs.
- DESIGN NEEDS AMENDMENT (AMEND): a merged design file says something the new material changes; the file and section are named.
- CONFLICT WITH LOCKED PACK: the new material contradicts a locked card row or ruling. Sent to product; never built the other way.
Size S, M, L follow `13-engineering-plan.md:9-13` (S one change, no native, no schema; M two to four changes or one local migration; L five or more, or a native module, a server schema change, a new entitlement or a counsel gate). Wave numbers follow `13:106-112`. Both are [E].
Design file short names: ARCH architecture, SEC security, PRIV privacy, DATA data-and-sync, 08, 09, 10, 11 (all `docs/tdd/new-scope/`).

## 2. One table: every new or changed card and the verdict

| Id | What it is | P0 rows | Our design | Verdict | Wave and size [E] | Gates |
|---|---|---|---|---|---|---|
| NS-38 | App Store page and install | 8 | none | NO DESIGN YET (content and release; a paragraph suffices) | W1, S | C Q24, W, F |
| NS-39 | First launch, first interaction | 10 | 08 s3 shares `lib/first-run/*` | NO DESIGN YET; AMEND 08 s3.2 merge order | W2, M | D, W |
| NS-40 | Age and region checks | 11 | none | NO DESIGN YET (native module, entitlement, server hook) | W2, L | C, F O-2 O-4, D |
| NS-41 | Sign up and sign in | 18 | SEC covers NS-10-R3 only | NO DESIGN YET; AMEND SEC | W2, L | F O-5 to O-7 O-20, C, D |
| NS-42 | Agreements and notices | 13 | PRIV s2 says no new consent | AMEND PRIV s2; NO DESIGN YET for builder order | W1, M | C Q-D Q20 Q41 Q44, F, W |
| NS-43 | Setting up the first book | 11 | none | NO DESIGN YET | W2, M | F O-14, D |
| NS-44 | First letter and allowance | 10 | 09, 11 NS-34 touch | NO DESIGN YET | W2, S to M | F O-13, D |
| NS-45 | Account life after first run | 15 | SEC s3.9, DATA deletion | NO DESIGN YET; AMEND SEC, DATA | W3, L | F O-15 to O-18, C, D |
| NS-46 | Days we mark | 22 | 11 s2, 09 s1.3 and s5 | AMEND 11 s2, 09 s1.3, s5; NO DESIGN YET for the days module | W3, L | G1 to G6, C |
| NS-47 | Cultural background | 27 | PRIV s4, SEC s2 | NO DESIGN YET (new L4 store, ADR B) | W3, L | C CUL-Q5 Q6 Q7 Q11, F |
| NS-48 | Notification catalogue | 13 | 09 s1.3 | AMEND 09 s1.3; drift test NO DESIGN YET | W1 (phase 1), M | W, D NTC-T24 |
| NS-49 | Picture-first, suggestions | 21 | 11 s8, SEC 3.1 | HOLDS (level 1); NO DESIGN YET (level 2); CONFLICT with R6, R25, R26 after NS-51 | W3 (L1), W5 (L2), S and L | F Q-FD-11, C |
| NS-50 | Home today | 4 | 10 s3 NS-23 | AMEND 10 s3 | W3, S | D |
| NS-51 | Photo moments (library read) | 27 | none | NO DESIGN YET; CONFLICT with locked NS-01-R22, NS-49-R6, R25, R26 until errata applied | W5, L | reversal ruling, C, F |
| NS-52 | Pictures and videos with a letter | 26 | 11 s6, s7, s8; DATA 3.1; ADR 0028 | AMEND (many); CONFLICT with NS-01-R15, R21a, R22 until errata applied | W5, L | reversal ruling, C, F Q-PM-2 3 |
| Errata E23 to E30 | Rulings after the lock | n/a | SEC 3.3, 3.5; 08; DATA | HOLDS for E23 to E28; E29, E30 need care | n/a | n/a |
| Function files (741 FRs; 206 more in addenda) | Expert requirements | 371 (+143) | none | 340 FRs carry work no card carries; see PACK-DELTA-4 | many | many |
| e2e design and system v2 | Screens, motion, tokens | n/a | ARCH layers, 09, 10, 11 | AMEND ARCH, 09, 10, 11; NO DESIGN YET for native tabs and glass | W2 to W4, L | D |

## 3. The ten largest changes for engineering, in order

1. **Founder round 2 reverses three locked positions: library read access, video, one picture per letter** (NS-51, NS-52; `26:11-15`; RV-18 to RV-20). New native module and permission string; `entry_media` needs more than dropping one index because `kind` and `ext` are CHECKs (`ADR 0028:37-38, :56`); export 1.7.0 has a single `photo` object (`ADR 0028:68-76`); video needs a transcode and metadata-stripping pipeline that does not exist; Variant B (server media) needs a bucket, signed-URL function, queue, quotas and the X2 reads. Both cards are drop C and need a recorded reversal first. Detail: PACK-DELTA-3.
2. **Eight first-run cards with 96 P0 rows and no design** (NS-38 to NS-45, 94 rows without a backlog row). Includes a Swift module with a new entitlement (Declared Age Range, NS-40), a sign-up region hook (File 28, PR #424), Supabase Auth production settings (NS-41 section 10 lists about nine), the consent builder that must land before a server flag turns on (NS-42, BL-577), step-up and update reader (NS-45). Detail: PACK-DELTA-1.
3. **The days family (NS-46, NS-47, NS-50: 87 P0 rows)**: new planner kinds, a pure one-a-day chooser, a 60-total ceiling with plan notices first, an L4 on-phone store outside `scribe.db` and backup, a Home slip registry with ranks 2b and 3b. Our `budget.ts` design and the handoff's disagree. Nothing is built. Detail: PACK-DELTA-2.
4. **340 of the 741 function requirements create engineering work that no card carries** (154 of them P0), plus 206 more function rows (143 P0) added after the trace. At least a dozen are schema, server-function or native work. Detail: PACK-DELTA-4.
5. **Nothing new can be dispatched yet.** 588 of 850 P0 rows have no row-level backlog row (`BACKLOG-GAPS.md:7`); the dispatcher reads `#### BL-nnn` with three digits only and BL-999 is used up; the 38 proposed rows are status `proposed` and use ids from free-list holes; BL-988 to BL-999 are design and function-review rows, not build rows. Karma and the founder own the id fix (`scripts/agents/**` is founder-owned). Detail: INPUTS section 2.2 row P-B.
6. **Design system v2 and the end-to-end design** (130 screens, 990 states, 415 motion ids; about 60 overlapping build rows DS2-xx, ENG-M1 to M15, R1 to R13, ES-A1 to A15): native tabs replace JS tabs today, `GlassSurface` over `expo-glass-effect`, SF Symbols through `expo-symbols`, tokens v2, font cuts, a motion lint rule, a Low Power Mode hook. `expo-symbols`, `expo-battery`, `expo-image` are not dependencies today. Detail: PACK-DELTA-6.
7. **The phone-only flag and pause pattern, and ADRs that do not exist.** TestFlight runs servers off, so `mayRun` hides a phone-only feature; ADR 0029 to 0039 are cited as files but only 0028 and 0101 exist; `kill-switches.ts` header and ADR 0016 5.3 say switches stop only server features; three different name sets exist for the new flags (card 27, operations addendum, handoff). Detail: PACK-DELTA-2 section 3 and PACK-DELTA-5 section 3.
8. **Source scans and tests that the pack now asks to rewrite or add.** NS-01-R22, NS-49-R6, R25 and R26 scans become allow-lists; a function-level deny-list for module names (`suggest`, `classif`, `tone`, `improve`) collides with NS-49's `suggestion` names (FR-AIS-54, FR-AIS-61); content-rules do not read new key families until a drift test exists; log canary and Erase scan gain media; media P0 rows are non-waivable at G4; the device matrix gains iOS 17.0, 17.1, 17.2, 26, iPad and an SE 3. Detail: PACK-DELTA-5.
9. **Errata E23 to E30 and the lock itself.** #846 is open; the errata are "applied in one docs PR after #846 merges" (`18:3`); until then engineering builds to the errata where they differ from a card. E23 makes a Share picture an X2 path (our SEC already treats it so). E27 makes BL-961 a dependency of NS-10-R3 and R5. E29: builders read the latest migration by search, not by line. Detail: PACK-DELTA-6 section 1.
10. **Our designs and the handoff are stale against develop.** 27 commits since 12:00 UTC overtake statements in `11-foundations.md` and `09-capture.md` (the planner now reads `quiet`; sign-out ends reminders); handoff 24 says `docs/tdd/new-scope/` does not exist and was written before card 27. The IA audit adds nine duplicated domain facts for CODE-R13 (one age function, two `monthDay`). Detail: PACK-DELTA-6 sections 3 and 4.

## 4. Sent to product (conflicts and card-internal contradictions)

Never built the other way; each needs product's or Karma's answer before the affected row starts.
1. NS-51-R6 says the index is "in the phone database" and also "excluded from the iPhone backup" (R6, R23). One SQLite file is backed up whole [E]. (PACK-DELTA-3 section 5.1.)
2. NS-47-R6 against R7: a restored phone "asks again" against `culture.asked` surviving sign-out (handoff C-18).
3. NS-48-R11 "a title never carries `{child}`" against built named titles `strings.en.ts:690-698` (handoff C-14).
4. Locked rows that card 27 overrides but #846 still carries: NS-01-R15, R21a, R22, NS-49-R6, R25, R26, NS-01 never-line (`27:"Changes to locked cards"`). Until the errata PR applies them, a reader of the lock builds the opposite.
5. NS-50-R5 changes the Home slip order stated in locked NS-23 and NS-32-R5 (our `10-reading-and-family.md:131`).
6. BL-982 stores typed days in `settings` keys; NS-47 puts ticked days outside `scribe.db` and the backup (handoff C-20, Q-E5): two stores for one Days page.
7. FR-AIS-54 and FR-AIS-61 deny-list `suggest` in module names; NS-49 names `pickSuggestion()`, a `suggestion` source and `EXPO_PUBLIC_SUGGESTIONS`. No ruling decides it (`FUNCTION-TRACE.md:546`).
8. Three different flag and key name sets for NS-51 and NS-52 (card `EXPO_PUBLIC_PHOTO_MOMENTS`, `EXPO_PUBLIC_VIDEO`, `killSwitches.videos`; operations addendum `EXPO_PUBLIC_MEDIA_ATTACH`, `killSwitches.mediaAttach`; handoff `media`, `EXPO_PUBLIC_MEDIA_SYNC`).
9. Card 27 proposes a local migration 12 for `entry_media`; the handoff asks to amend migration 11 in #835 before it merges (Q-E12).
10. Card 19 is "Locked v1.0 candidate" but is not in #846 (`19:3`); cards 21 and 27 are drafts. Which of them are inside the lock is Karma's or the founder's.
11. Wrong or missing paths and ids the cards cite: `docs/privacy/DATA_CLASSIFICATION.md` (real: `docs/legal/DATA_CLASSIFICATION.md` section 4.6, founder-merged), ADR 0029 (no such file), module names `scribe-photo-library` against `scribe-library`.
12. First-run: the lock's rows C25, C44 to C46 cite first run as built; card 19 lists unbuilt parts (Declared Age Range, region check, step-up, update reader). Compatible, but the lock's wording should change.

## 5. What needs the founder, counsel or Karma (collected, not answered)

- Founder, with the default the pack proposes: Q-FD-7 which drop ships when (A next build, B only if gates close before freeze, C after approval); Q-PM-1 to Q-PM-12 library access, video limits, sync, sound, places, analysis, drop, background refresh, lock-screen wording, QR, trim, pause (defaults in `27`); the NS-41 options O-5 to O-7, O-20; NS-43 O-14; NS-44 O-13; NS-45 O-15 to O-18; every parent-facing word (G3); the Supabase Auth production settings in NS-41 section 10; Variant B money (finance).
- Counsel (through the founder): a child's picture or video leaving the phone (Q54, X2), App Review 5.1.1 for a library permission, the Photos purpose string, DPLA 3.3.3(H) and 5.1.3 for level 2, label wording per variant, CUL-Q5 to Q7 and Q11, FR-DAY-23 copied tables, the consent line, FR-LEG-23.
- Karma: the reversal rulings RV-18 to RV-20 recorded; CR-66 precedence list names cards 19, 21, 26, 27 (handoff E-10); Q-E1 to Q-E16 of the handoff (budget shape, `libraryDay` as group, store placement, migration 11 vs 12, ADR numbers); the id fix for the dispatcher; whether card 19 and the function files are inside the lock.
- Engineering (mine to hand off, not decided here): ADR numbers and authors (handoff section 2), the lint rule for `expo-glass-effect`, one age function in core.

## 6. How I checked this (cite log)

- Scripted line-cite pass over the branch files, run once after drafting: 62 cites (file path, line, expected text), 62 held. Files covered: eleven function files, cards 18, 19, 22, 23, 24, 27, GAP-LOG, FUNCTION-TRACE, ADR 0028, plan #847 line 26, and six of our design files.
- Code cites on `origin/develop` `16e61549`: 22 of 22 held (`planner.ts:78-79, 91-94, 111, 295`; `scheduler.ts:137, 257`; `plan-reminders.logic.ts:48`; `prefs.ts:127`; `kill-switches.ts:1-8`; `capabilities.ts` header and `buildFlagEnabled`; `app.config.ts:44`; `ScribePhoto.podspec:9`; `onboarding.tsx` `LockOffer`; `app-review.en.ts:4`; `remote-config.ts:99`; `(tabs)/_layout.tsx:1`; `package.json` has no `expo-symbols`, `expo-battery`, `expo-video`, `expo-image`, `expo-media-library`; `supabase/migrations/20261108000000_consent_record_fields.sql` and `20261109000000_child_name_optional.sql` exist; no `modules/age-range`, `lib/days`, `budget.ts`, `scribe-library`).
- GitHub facts read by `gh api` on 20 Nov: PR #846 open, head `450bcb4a`; #847 open, `774d3e13`; #855 merged; #894 open, `1fb48f4e`; #835 open, `39cf30d3`; #871 and #879 open; no PR for `docs/locked-pack-inputs-20nov`, `docs/e2e-ux-20nov`, `docs/eng-eval-20nov` (6 of 6 as stated).
- Corrections made during drafting, 23, all fixed before commit: INPUTS 7 (plan line numbers 23, 19, 15 to 26, 22, 30; card 27's status; the commit count; the `26:13-17` range; the dispatcher statement for proposed rows); PACK-DELTA-1 5 (`23:1b` cites and a placeholder row id); PACK-DELTA-2 6 (`11-foundations.md:60` to 61, `10:129` to 131 in two places, `09:62` to 57, an invented NS-48-R5, an invented NS-49 range); PACK-DELTA-4 2 (the "152 of 154" arithmetic, `FUNCTION-TRACE.md:44` to 49); PACK-DELTA-6 3 (`11-foundations.md:56` to 58, `GAP-LOG.md:345` to 344, 565 to 588).
- Method: product branches read through `git archive` of each head into the scratchpad; FR counts by script over `FUNCTION-TRACE.md` lines 60 to 807 (741 rows, 371 P0, totals equal section 0.1); P0 rows per card by `p0.py` (`tools/review/p0.py --`, run read-only; NS-38 to NS-45 give 96, NS-46 to NS-50 give 87).

## 7. What I could not verify

- Any claim in the cards or reviews that rests on Apple's pages, Supabase's pages or the iOS 26 and iOS 27 behaviour (most are marked UNVERIFIED by their authors; I did not fetch any).
- Whether `20261108000000` and `20261109000000` are applied to production (the cards say pending; I have no production access, OBS-R14).
- The e2e screens as drawn: I read INDEX counts and the engineering rows, not the prototypes; no HTML was opened.
- Whether the function authors' "locked row" statuses are right; I used the trace's statuses as given.
- Whether the owners of #847's refresh will have moved any plan line number by the time RESYNC runs.
- Row-by-row correctness of the 741 FRs; I counted and grouped them and read the 206 addendum rows' lead sentences, not every row in full.
