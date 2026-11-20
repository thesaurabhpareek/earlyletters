# Inputs register: what engineering must follow, and how firm each input is

Status: v2 (re-based), 20 Nov 2026, `principal-architect`, task RD-A. Docs only. v1 was read at 17:40 to 18:40 UTC against `bee01360`; v2 re-reads everything against the heads below (read 19:00 to 19:30 UTC). Tags: [V] verified (command, file or line named), [E] estimate (basis named), [U] not verified.

Heads this register is "as at" (every Firmness cell below means "as stated by the file at this head"):
- Product pack: branch `docs/locked-pack-inputs-20nov` `a3806f74` (18:50 UTC), PR #934 (open, not merged). Reviewers read `40c6eb4a` (18:36); the branch moved once more after that.
- End-to-end design and system v2: branch `docs/e2e-ux-20nov` `7e684984` (18:26 UTC), PR #935 (open, not merged).
- Plan: PR #847 `458fae46` (refreshed 18:33 UTC), open.
- Old lock: PR #846 `450bcb4a`, open, not merged. Engineering evaluation: `docs/eng-eval-20nov` `6c011919`, no PR [V: `gh api repos/.../pulls?head=...`].
- Develop `16e61549` (17:35 UTC).
- Line cites into product files are at `bee01360` unless a cite says `@a3806f74`. Card 19 shifted by 2 lines (4 after its NS-45 section 10), card 21 by 2; GAP-LOG, FUNCTION-TRACE, card 22 and the function files moved more. Ids (NS-nn-Rn, FR-xxx-nn, CL-nnn, Ennn) are stable: re-grep by id at the new head.

How the product thread describes the status, quoted not decided: PR #934's body says the branch is "Requirements rev 2, LOCKED 20 Nov 2026 (22-final-holistic-spec.md section 10)" and "supersedes the head of draft PR #846 as the thing engineering should follow. Follow the branch tip" [V: `gh api .../pulls/934`]. Card 22 section 10 locks "cards 00 to 27, the function files in `functions/`, and the design areas A to E", on the founder's words "Go with all default answers ... proceed to lock all requirements" (`22:153` @a3806f74). The founder's words are relayed through the product thread, not recorded in `DECISIONS.md` (`22:5`). Neither #934 nor #935 is merged. Whether engineering treats the branch tip as the source before merge is Karma's and the founder's call; this register records what each file says about itself.

## 1. The plain summary

1. PR #846 is open at `450bcb4a`. Three newer heads now have a PR or not: #934 (inputs) and #935 (e2e) exist and are open and unmerged; `docs/eng-eval-20nov` still has none [V].
2. The inputs branch at `a3806f74` is 121 changed files, 31,342 added and 104 deleted lines over the lock (`git diff --shortstat 450bcb4a a3806f74 -- docs`) [V]. Since v1's `bee01360` it added 102 files of change: rev 2 in place (cards edited), 113 council closures CL-001 to CL-113 in `GAP-LOG.md`, errata E31 to E33, a registry and load order, a feedback loop, and recounted P0 numbers.
3. Status lines at `a3806f74` [V]: cards 19, 21 and 22 read "CURRENT (LOCKED rev 2)" (`19:3`, `21:3`, `22:3`); the REGISTRY row for card 27 reads "CURRENT" without "LOCKED rev 2" though `22:153` says cards 00 to 27 are locked (`REGISTRY.md` row C27). Cards 19 and 21 still carry an older "Status detail" line 5 ("Locked v1.0 candidate", "Final holistic draft") that the new header contradicts. The files disagree with themselves; the header and `22:153` govern (my reading, not a ruling).
4. Founder direction round 2 reverses three locked positions (library read, video, one picture per letter): `26:13-15`, RV-18 to RV-20. The founder then answered by accepting defaults (CL-046 to CL-057, `GAP-LOG.md` "Closures 20 Nov"): Variant A phone-only (CL-048), caps 6 pictures, 2 videos, 60 s, 100 MB (CL-047), limited library first (CL-046), no video sound (CL-049), drop C with a spike first (CL-052). E32 says level 3 is spike-only in Build 13 on `exp/photos` and ships in 1.1 after the spike.
5. Our eight designs (`docs/tdd/new-scope/*`) cover NS-01 to NS-37 only [V: zero hits for NS-38 to NS-52 in the eight files]. Plan #847 at `458fae46` still maps NS-01 to NS-37 (`17:26`, 637 row ids) [V: re-read at the new head]; its section 11 lists what waits for #846.
6. Function requirements: 947 FRs, 514 P0 at `a3806f74` (`FUNCTION-TRACE.md` section 0.1 total) [V], 178 new engineering rows NR-01 to NR-178. P0 rows over all cards and functions: 1,048, of which 781 have no row-level backlog row (`BACKLOG-GAPS.md:9`, definition: no backlog block names the row id or a range containing it, and the row's own text cites no existing BL id; 186 are named by a block and 81 cite an existing BL id) [V]. Earlier figures in the same file: 588 of 850 (first run), 728 of 993 (later run at `bee01360`).
7. `develop` moved after our designs: 27 commits since 12:00 UTC on 20 Nov [V]. Handoff 24 is stale on three facts (section 4).

## 2. Register

Columns: Id; What; Where; Head sha; Merged; Firmness as at that head; Owner; Last change (UTC, 20 Nov); How engineering uses it; Depended on by (RD names are the other readiness tasks; folder names are `docs/engineering/readiness-20nov/<folder>/`).
Firmness: LOCKED (#846 at `450bcb4a`, not on develop), LOCKED rev 2 (status as the product branch states it, unmerged), DRAFT, PROPOSAL, MERGED (on develop).

### 2.1 The old lock (#846)

| Id | What | Where | Head | Merged | Firmness | Owner | Last change | How engineering uses it | Depended on by |
|---|---|---|---|---|---|---|---|---|---|
| L-1 | Cards 00 to 12 (NS-01 to NS-37), 13, 14, 15, 16 | `git show origin/docs/prd-lock-v1-20nov:docs/product/prd/<file>` | `450bcb4a` | No (#846 open) | LOCKED v1.0; edited in place by rev 2 on the newer branch (cards 01 to 12 changed by 6 to 36 lines each) | product | 05:07 (PR updated 11:36) | Rows for NS-01 to NS-37. Where rev 2 differs, rev 2 says it supersedes (#934 body) | all |
| L-3 | Backlog rows BL-952 to BL-987 | `docs/BACKLOG.md` on #846 | `450bcb4a` | No | LOCKED | product | 05:07 | The dispatcher reads develop only, so none can be picked yet (`23:21`) | plan rows |

### 2.2 Product pack rev 2 (branch `docs/locked-pack-inputs-20nov`, PR #934)

| Id | What | Path | Head | Merged | Firmness (as at `a3806f74`) | Owner | Last change | How engineering uses it | Depended on by |
|---|---|---|---|---|---|---|---|---|---|
| P-reg | REGISTRY (status of every file), LOAD-ORDER (26 handles), FEEDBACK-LOOP, status headers | `docs/product/prd/REGISTRY.md`, `LOAD-ORDER.md`, `FEEDBACK-LOOP.md` | `a3806f74` | No | CURRENT | product | 18:50 | Start here: which file is current. Changes after lock need an errata row with a "Plan delta:" line (`FEEDBACK-LOOP.md:14`) | RESYNC-LIST |
| P-18 | Errata E1 to E33 | `18-errata-after-lock.md` (43 lines) | `a3806f74` | No | CURRENT (LOCKED rev 2), highest E33 | Karma | 18:50 | E31 (NS-49 level 1 moves to drop B), E32 (level 3 spike only in Build 13), E33 (`tmp/share` is the feature's own Caches folder, CR-67 AX-9). E23 to E30 as in v1 | PACK-DELTA-6 |
| P-19 | Cards NS-38 to NS-45 (96 P0) | `19-from-download-to-first-letter.md` (1,768 lines) | `a3806f74` | No | CURRENT (LOCKED rev 2) per `19:3`; line 5 still says candidate | product | 18:34 to 18:50 | Rows for first run, sign-in, agreements, first book, first Keep, account life | PACK-DELTA-1 |
| P-21 | Cards NS-46 to NS-50 (182 rows, 87 P0: drops A 6, B 55, B+C 2, C 24 after E31) | `21-days-cultural-photos-home.md` (1,201) | `a3806f74` | No | CURRENT (LOCKED rev 2) per `21:3`; line 5 still says "Final holistic draft" | product | 18:34 | Days, culture, catalogue, picture-first, Home today; release line at `21:158` @bee01360 | PACK-DELTA-2 |
| P-27 | Cards NS-51 and NS-52 | `27-photo-moments-and-media.md` (483) | `a3806f74` | No | "Status: CURRENT" (`27:1`); inside the lock by `22:153`; founder questions Q-PM-1 to Q-PM-12 now answered by closures (CL-046 to CL-057) | product | 18:26 | Library read path, several pictures and video; Variant A decided | PACK-DELTA-3 |
| P-26 | Founder direction round 2 | `26-founder-direction-photos-library-and-media.md` | `a3806f74` | No | WORKING-INPUT (REGISTRY) | founder | 17:11 | Source of the reversals; cards carry it | PACK-DELTA-3 |
| P-20 | Founder direction of 20 Nov | `20-founder-direction-20nov.md` | `a3806f74` | No | SUPERSEDED-BY 21, 22 section 7 and 27 (REGISTRY row C20) | founder | 11:09 | Context only; do not build from it | PACK-DELTA-2 |
| P-22 | The pack in one reading, eight answered founder items, lock | `22-final-holistic-spec.md` (169) | `a3806f74` | No | CURRENT (LOCKED rev 2) | product | 18:34 | Read first; section 7 answers, section 10 lock | PACK-DELTA index |
| P-23, P-24, P-25 | Dependency map; engineering handoff by `principal-architect`; instruction coverage audit | `23-`, `24-`, `25-*.md` | `a3806f74` | No | CURRENT; 24 is stale on three facts | product, principal-architect, qa | 17:16 to 18:34 | 24 is still the best engineering input for NS-46 to NS-52 (section 4); 25's verdict is "NOT READY" at its date | RESYNC-LIST |
| P-F | 23 function files and BRIEF | `functions/*.md` | `a3806f74` | No | LOCKED rev 2 per `22:153`; authors are Claude roles, "not licensed professionals" | product (function roles) | 18:34 | Expert guidance; PACK-DELTA-4 and -5 | PACK-DELTA-4, -5 |
| P-T | FUNCTION-TRACE (947 FRs, 514 P0, 178 NR rows) | `FUNCTION-TRACE.md` (4,504 lines) | `a3806f74` | No | CURRENT (generated; statuses not refreshed after closures: 671 FRs still read "needs Karma ruling") | product | 18:36 | One source for "engineering work not in a card" | PACK-DELTA-4 |
| P-G | GAP-LOG: K, RV, R-IA, N, CB, DL rulings and "Closures 20 Nov" CL-001 to CL-113 (624 lines) | `GAP-LOG.md` | `a3806f74` | No | CURRENT | Karma, product | 18:34 | The founder's accepted defaults, one line per closure | PACK-DELTA-6 |
| P-B | BACKLOG with 38 proposed rows; BACKLOG-GAPS (1,048 P0, 781 gaps) | `docs/BACKLOG.md`, `BACKLOG-GAPS.md` | `a3806f74` | No | PROPOSED rows, status `proposed` | product | 18:50 | Dispatcher will not hand out `proposed` rows; ids are in free-list holes because BL-999 is used up and the dispatcher reads three digits (`BACKLOG.md` block BL-006 to BL-049). BL-045 is NS-51, BL-046 NS-52, BL-047 lumps 140 function rows | RESYNC-LIST |
| P-M | Founder messages verbatim | `FOUNDER-MESSAGES-VERBATIM.md` | `a3806f74` | No | Source record | product | 18:34 | Check any "the founder said" claim | all |
| P-R | Reviews, trace generator, PDF build script | `docs/product/prd/tools/**` | `a3806f74` | No | Input | product | 18:36 | Code facts behind P-24 | PACK-DELTA-2 |
| P-P | Product thread sequencing input (banner added by #934) | `docs/engineering/plans/locked-pack-plan.md` | `a3806f74` | No | PROPOSAL; superseded in part by `23` | Karma, product | 18:34 | Input to #847 | RESYNC-LIST |

### 2.3 End-to-end design and motion (branch `docs/e2e-ux-20nov`, PR #935)

| Id | What | Path | Head | Merged | Firmness (as at `7e684984`) | Owner | Last change | How engineering uses it | Depended on by |
|---|---|---|---|---|---|---|---|---|---|
| E-A to E-E | Areas A capture, B book and reading, C keeping and trust, D family sharing and reminders, E foundations and system states: DESIGN, MOTION, WORDS, two HTML prototypes each | `docs/design/e2e/<area>/` | `7e684984` (area files last re-keyed at A `a1e3fe80`, B `8585858e`, C `f0ad5be3`, D `6ade48e2`, E `deda7111`; closures marked at `7e684984`) | No | "Design pack for the locked requirements rev 2" (#935 body); lock covers "design areas A to E" (`22:153`) | design-systems | 17:15 to 18:26 | Screens, states, motion ids; where an area file and a card differ the card wins and INDEX section 6 lists the difference | PACK-DELTA-6 |
| E-I | Master INDEX (130 screens, 990 states, 415 motion ids, 82 `E-ST` ids; counts unchanged at `7e684984`) and IA-AUDIT | `docs/design/e2e/INDEX.md`, `IA-AUDIT.md` | `7e684984`, `45b9d42b` | No | CURRENT, machine counts | design-systems | 18:26, 11:11 | One list of screens; the Me regroup waits for tree test T1 | PACK-DELTA-6 |
| E-S | Design system v2: FOUNDATIONS, COMPONENTS, MOTION, AUDIT, BRIEF, REFERENCE.html, `tokens.v2.json` | `docs/design/system/` | `31269da0`; tokens `de638399` | No (in #935's branch) | "proposal, 20 Nov" (`FOUNDATIONS.md:3`); not named in #935's globs, which list `docs/design/e2e/**` only | design-systems | 05:47 | Rows DS2-01 to DS2-15, ENG-M1 to ENG-M15, R1 to R13. New dependency questions: `expo-symbols`, `expo-battery` (D-065), `expo-image` | PACK-DELTA-6 |

### 2.4 Engineering evaluation (branch `docs/eng-eval-20nov`, no PR)

| Id | What | Path | Head | Merged | Firmness | Owner | Last change | How engineering uses it | Depended on by |
|---|---|---|---|---|---|---|---|---|---|
| V-A, V-B, V-C | Eval A data and sync (408 lines), B mobile client (539), C platform, quality, delivery (528) | `docs/engineering/eval-20nov/` (A, B, C files) | `6c011919` | No | PROPOSAL, adopted in our designs | product thread (evaluation) | 05:24 to 05:27 | Schema, modules, ADR 0029 to 0039 reservations, G6 preflight | designs |

### 2.5 Our merged designs and standards (on develop)

| Id | What | Path | Head | Merged | Firmness | Owner | Last change | How engineering uses it | Depended on by |
|---|---|---|---|---|---|---|---|---|---|
| D-1, D-2 | architecture (210), security (379), privacy (274), data-and-sync (230), 08-keeping (302), 09-capture (217), 10-reading-and-family (229), 11-foundations (367), facts BL-987 (53), README (40) | `docs/tdd/new-scope/` | develop `16e61549` | Yes (#857, #858, #863, #864, #876 and siblings) | MERGED; scope NS-01 to NS-37 | principal-architect, security-architect, privacy, data-architect, mobile | 11:12 to 13:00 | Contracts, threat model, classes, schema register, PR breakdowns | all |
| D-3 | PRINCIPLES, chapters 01 to 10, ADRs 0004 to 0028, RULINGS CR-66 (`RULINGS.md:632`), CR-67 | `docs/engineering/`, `docs/adr/`, `docs/agents/cto/RULINGS.md` | `16e61549` | Yes | MERGED | stewards | n/a | Binding rules. ADR 0029 to 0039 do not exist (`docs/adr` ends 0028, 0101) [V] | all |
| D-4 | Tag set Fact, Assumption, Rec, Risk, OQ, Conflict, Unverified | `docs/tdd/01-mobile-client.md` | `16e61549` | Yes | MERGED | mobile | n/a | Tag vocabulary | all |

### 2.6 Plan and open PRs

| Id | What | Where | Head | Merged | Firmness | Owner | Last change | How engineering uses it | Depended on by |
|---|---|---|---|---|---|---|---|---|---|
| X-847 | Task-level plan v2, NS-01 to NS-37 at `450bcb4a` (`17:26`); section 1 step 7 "Last re-sync 20 Nov 18:20 UTC, to `450bcb4a`"; section 11 "what waits for #846" | PR #847 `docs/product/prd/17-engineering-project-plan.md` (840 lines) | `458fae46` | No | PROPOSAL v2 (refreshed by `product` for Karma, `17:3`) | Karma | 18:33 | Row ids, waves, owners. Not re-synced to rev 2 | RESYNC-LIST |
| X-835 | Photo stack: #835 (migration 11), #836 to #840 open; #834, #841, #842 merged | PRs | #835 `39cf30d3` | Partly | In flight | mobile | 17:16 | NS-52 changes what #835 may hold (migration 11 vs 12) | PACK-DELTA-3 |
| X-894 | Find stack 6 of 8 (`bookSearch` pause pattern) | PR #894 | `1fb48f4e` | No | In flight | mobile | 17:35 | Phone-only flag pattern | PACK-DELTA-2 |
| X-961 | BL-961: #869 merged; #871, #879 open | PRs | `4879ff5c`, `e27d104e` | Partly | In flight | mobile | 13:00 | Hard dependency of NS-47, NS-51, NS-52 stores | all |
| X-Q | Quality readiness PRs #924 to #927: checks, journeys, test-case catalogues A to D | `docs/engineering/readiness-20nov/quality/` | `e17d5e1f`, `494c44c4`, `5514bb7a`, `93edd5ed` | No | Readiness drafts | qa | 18:4x | Test ids for NS-01 to NS-37 waves only: no `NS-38` to `NS-52` row id appears in them [V: `git grep` over the four branches, 0 hits] | PACK-DELTA-4 |

## 3. What is not merged, plainly

- Not merged: every item in 2.2, 2.3, 2.4, and X-847. #846, #934 and #935 are open.
- Could still move: #934 and #935 (the product branch moved three times between 17:29 and 18:50); #847; the photo and Find stacks.
- The founder's naming is relayed, not recorded (`22:5`; plan `17:31`). The founder's own words are "I approve all requirements" (19 Nov), "Consult with exec team and make all decisions" and "Go with all default answers ... proceed to lock all requirements" (20 Nov) (`FOUNDER-MESSAGES-VERBATIM.md` items 33 and earlier; `22:107`). Actions "pending founder hands" are listed in `22:` section 7 and the closures: Apple entitlement request, counsel engagement, phones to borrow, DMARC records, pen test spend. A default taken is a requirement for design and build, never for public text, a counsel answer or a store submission (`22:107`).
- Release content and dates: the founder's (ROADMAP:3). Not decided here.

## 4. Where the newest material is stale against develop [V]

| Statement | Where | Fact on `develop` `16e61549` |
|---|---|---|
| "`Child.quiet` has no reader" | `24:37, :287`; `22:67` @bee01360 | The planner reads `quiet` (`apps/mobile/src/lib/reminders/planner.ts:78-79`, `apps/mobile/src/lib/reminders/prefs.ts:127`). Merged #901, #902. The `store.ts` comment "The planner reads `Child.quiet`" is now correct and needs no edit |
| "Sign-out does not cancel reminders (BL-967)" | `24:58, :289` | #904 merged. The cold-start tap path (`getLastNotificationResponse`) is still absent from `apps/mobile/src/lib/reminders/scheduler.ts` (grep: 0) |
| `PlannedKind` at `planner.ts:106` | `24:28` | Now `apps/mobile/src/lib/reminders/planner.ts:111` |
| `bookSearch` and photo flags only in open PRs; `docs/tdd/new-scope/` does not exist | `24:13, :71, :290, :293` | `KILL_SWITCH_KEYS` in `packages/api/src/kill-switches.ts` still has eight keys; #896 merged (flags off in every store profile); `docs/tdd/new-scope/` has 10 files on develop |
| `ScribePhoto.podspec:9` says 16.4 while the app target is 17.0 | `24:78` | Still true: `apps/mobile/modules/scribe-photo/ios/ScribePhoto.podspec:9`, `apps/mobile/app.config.ts:44` |
| No `expo-symbols`, `expo-battery`, `expo-video`, `expo-image`, `expo-media-library` | design system v2 assumes some | `apps/mobile/package.json` has none; it has `expo-glass-effect ~57.0.4`, `expo-blur`, `react-native-reanimated 4.5.1`, `phosphor-react-native` |

## 5. How I checked this register

Re-read at the new heads by `git show` and `gh api` (PR states and bodies for #846, #847, #934, #935, #924 to #927; heads by `git rev-parse`). Cite results are in `PACK-DELTA.md` section 6.
