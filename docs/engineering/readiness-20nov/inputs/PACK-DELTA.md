# Pack delta: what the newest product material changes for engineering

Status: v2 (re-based on rev 2), 20 Nov 2026, `principal-architect`, task RD-A. Docs only. Nothing here decides a founder, counsel or product question, edits a card or a design file, or sets a date. Words a parent reads are not touched. The founder's reading order: section 1, section 3 (ten changes), section 4 (what goes to product).

Re-base: v1 was written against `bee01360`. This version re-reads the product pack at `a3806f74` (PR #934, open, "LOCKED rev 2"), the e2e design at `7e684984` (PR #935, open) and plan #847 at `458fae46`. The heads, what each says about its own status, and what is merged are in `INPUTS.md`. Line cites into product files are at `bee01360` unless marked `@a3806f74`; row ids are stable, re-grep by id. Reviewers read `40c6eb4a`.

This file is the index. The detail is in six numbered files in this folder:

| File | Covers |
|---|---|
| `PACK-DELTA-1-first-run-cards-38-45.md` | NS-38 to NS-45, download to first kept letter (card 19) |
| `PACK-DELTA-2-days-culture-catalogue-home-46-50.md` | NS-46 to NS-50: days, cultural background, catalogue, picture-first, Home today (card 21) |
| `PACK-DELTA-3-photo-library-and-media-51-52.md` | NS-51 photo moments, NS-52 pictures and videos with a letter (cards 26 and 27) |
| `PACK-DELTA-4-function-requirements.md` | the 947 function requirements by function file, and the engineering work no card carries |
| `PACK-DELTA-5-function-addenda-constraints.md` | the addenda as engineering constraints with source lines |
| `PACK-DELTA-6-design-errata-and-moved-code.md` | errata E23 to E33, e2e design and design system v2, closures, handoff conflicts, code that moved |

Companion files: `INPUTS.md` and `RESYNC-LIST.md`.

Tags: [V] verified, [E] estimate, [U] not verified. "Cards beat 14 beat 13 and design beat BACKLOG" is CR-66.

## 1. Legend

Verdicts (my wording, a reading aid, not a ruling):
- NO DESIGN YET: no engineering design file covers it; a new design is needed before the first PR.
- DESIGN HOLDS: our merged designs already say what the new material needs.
- AMEND (design needs amendment): a merged design file says something the new material changes; file and section named.
- CONFLICT: two statements in the product pack, or a statement and built code, disagree. Three kinds, always named: card-to-card (two cards or a card and its closure), card-internal (one card against itself), card-to-built (card against code). I use "conflict with the locked pack" only for the old lock `450bcb4a` against rev 2. Sent to product; never built either way until answered.
Size S, M, L follow `13-engineering-plan.md:9-13`; wave numbers follow `13:106-112`. Both [E].
Design file short names: ARCH architecture, SEC security, PRIV privacy, DATA data-and-sync, 08, 09, 10, 11 (`docs/tdd/new-scope/`).

## 2. One table: every new or changed card and the verdict (at `a3806f74`)

Status column: the card's own header at `a3806f74`.

| Id | What it is | Status at head | P0 | Our design | Verdict | Wave and size [E] | Gates |
|---|---|---|---|---|---|---|---|
| NS-38 | App Store page and install | LOCKED rev 2 | 8 | none | NO DESIGN YET (content and release; a paragraph suffices) | W1, S | C Q24, W, F |
| NS-39 | First launch | LOCKED rev 2 | 10 | 08 s3 shares `lib/first-run/*` | NO DESIGN YET; AMEND 08 s3.2 merge order | W2, M | D, W |
| NS-40 | Age and region | LOCKED rev 2 | 11 | none | NO DESIGN YET (native module, entitlement, server hook) | W2, L | C, F, D |
| NS-41 | Sign up and sign in | LOCKED rev 2 | 18 | SEC covers NS-10-R3 only | NO DESIGN YET; AMEND SEC. `signIn` pause key ruled (CL-111) | W2, L | F, C, D |
| NS-42 | Agreements and notices | LOCKED rev 2 | 13 | PRIV s2 says no new consent | AMEND PRIV s2, plus NO DESIGN YET for builder order | W1, M | C, F, W |
| NS-43 | First book | LOCKED rev 2 | 11 | none | NO DESIGN YET | W2, M | F, D |
| NS-44 | First letter, allowance | LOCKED rev 2 | 10 | 09, 11 NS-34 touch | NO DESIGN YET | W2, S to M | F, D |
| NS-45 | Account life | LOCKED rev 2 | 15 | SEC 3.9, DATA deletion | NO DESIGN YET, plus AMEND SEC, DATA | W3, L | F, C, D |
| NS-46 | Days we mark | LOCKED rev 2 | 22 | 11 s2, 09 s1.3 and s5 | AMEND 11 s2, 09 s1.3 and s5, plus NO DESIGN YET (days module). `killSwitches.libraryDays` ruled (CL-021) | W3, L | G1 to G6, C |
| NS-47 | Cultural background | LOCKED rev 2 | 27 | PRIV s4, SEC s2 | NO DESIGN YET (L4 store, ADR B) | W3, L | C, F |
| NS-48 | Notification catalogue | LOCKED rev 2 | 13 | 09 s1.3 | AMEND 09 s1.3; drift test NO DESIGN YET. R11 text now settled in rev 2 | W1 (phase 1, drop A), M | W, D |
| NS-49 | Picture-first, suggestions | LOCKED rev 2 | 21 | 11 s8, SEC 3.1 | HOLDS (level 1, now drop B by E31); NO DESIGN YET (level 2, drop C); card-to-card conflict on R6, R25, R26 against card 27 | W3 (L1), W5 (L2) | F, C |
| NS-50 | Home today | LOCKED rev 2 | 4 | 10 s3 NS-23 | AMEND 10 s3; card-to-card conflict with card 10 slip order (line 22 @a3806f74 still has four slips) | W3, S | D |
| NS-51 | Photo moments | CURRENT; inside lock per `22:153` | 27 | none | NO DESIGN YET; card-to-card conflicts (NS-01-R22, NS-49-R6, R25, R26 not edited in place); level 3 spike-only in Build 13 (E32) | W5 (spike earlier), L | counsel, D |
| NS-52 | Pictures and videos | CURRENT; inside lock per `22:153` | 26 | 11 s6, s7, s8; DATA 3.1; ADR 0028 | AMEND (many); card-to-card conflicts (NS-01-R15, R21a, R22). Variant A decided (CL-048) | W5, L | counsel, D |
| Errata E23 to E33 | Rulings after the first lock | LOCKED rev 2 | n/a | SEC 3.3, 3.5; 08; DATA | HOLDS for E23 to E28, E33 is a card text fix; E29, E30 need care; E31 and E32 move drops | n/a | n/a |
| Function files | 947 FRs, 514 P0 | LOCKED rev 2 per `22:153`; trace statuses not refreshed | 514 | none | 368 FRs (175 P0) carry work no card carries; PACK-DELTA-4 | many | many |
| e2e design, system v2 | Screens, motion, tokens | "locked requirements rev 2" (#935 body); system v2 "proposal" | n/a | ARCH layers, 09, 10, 11 | AMEND ARCH, 09, 10, 11; NO DESIGN YET for native tabs and glass | W2 to W4, L | D |

What the re-base changed in the verdicts (v1 to v2): no NO DESIGN YET became DESIGN HOLDS (no design for NS-38 to NS-52 exists; the new closures answer questions, not design gaps). Two v1 conflict labels are gone because rev 2 rewrote the rows (NS-48-R11 now keeps the built named titles "which render only when names are on", `21:699` @a3806f74; NS-47-R6 and R7 now agree that `culture.asked` lives in `settings`, `21:488-489`). Six v1 "conflict with the locked pack" labels were relabelled card-to-card (NS-01-R15, R21a, R22, NS-49-R6, R25, R26, NS-50-R5 against card 10) or card-internal (NS-51-R6). NS-49 level 1 moved from drop A to drop B (E31). Verdict counts over the 15 cards NS-38 to NS-52 by primary label (my count): NO DESIGN YET 9 (NS-38, 39, 40, 41, 43, 44, 45, 47, 51), AMEND 5 (NS-42, 46, 48, 50, 52), HOLDS 1 (NS-49 level 1). v1 had the same split, so the totals do not move; what moved is the conflict labels (above).

## 3. The ten largest changes for engineering, in order

1. **Founder round 2 reverses three locked positions: library read access, video, one picture per letter** (NS-51, NS-52; `26:13-15`; RV-18 to RV-20). The founder then accepted the defaults: Variant A phone-only (CL-048), limited library first (CL-046), caps 6 pictures, 2 videos, 60 s, 100 MB (CL-047), no video sound (CL-049), drop C with a spike (CL-052); E32 makes level 3 spike-only in Build 13. Engineering cost is unchanged: a new native module and permission string; `entry_media` needs more than dropping one index because `kind` and `ext` are CHECKs (`ADR 0028:37-38, :56`); export 1.7.0 has a single `photo` object (`ADR 0028:68-76`); video needs a transcode and metadata-stripping pipeline that does not exist. Variant B (server media) stays closed behind X2, counsel and a threat model. Detail: PACK-DELTA-3.
2. **Eight first-run cards with 96 P0 rows and no design** (NS-38 to NS-45, 94 rows without a backlog row at the v1 count). Includes a Swift Declared Age Range module with a new entitlement (NS-40), a sign-up region hook (File 28, PR #424), about nine Supabase Auth production settings (NS-41), the consent builder that must land before a server flag (NS-42, BL-577), step-up and update reader (NS-45). Detail: PACK-DELTA-1.
3. **The days family (NS-46, NS-47, NS-50: 87 P0 rows)**: new planner kinds, a pure one-a-day chooser, a 60-total ceiling (nearest 60 kept, CL-045), 366-day horizon (CL-027), fixed 09:00 (CL-025), an L4 on-phone store outside `scribe.db` and the backup, Home slip ranks 2b and 3b. Drops after E31: A 6, B 55, B+C 2, C 24. Our `budget.ts` design and the handoff's disagree. Nothing is built. Detail: PACK-DELTA-2.
4. **368 of the 947 function requirements create engineering work that no card carries** (175 of them P0), by my definition over `FUNCTION-TRACE.md` at `a3806f74` (section 1 of PACK-DELTA-4). At least a dozen are schema, server-function or native work. The trace now has 178 engineering rows NR-01 to NR-178. At `cfeca754` the same count was 340 of 741 (154 P0); both are in PACK-DELTA-4.
5. **Nothing new can be dispatched yet.** At `a3806f74` 781 of 1,048 P0 rows have no row-level backlog row (`BACKLOG-GAPS.md:9` @a3806f74). Definition: P0 rows over cards 01 to 12, 19, 21 and 27 (534) plus P0 function rows (514); a row is covered if a backlog block names its id or a range containing it (186) or if its own text cites an existing BL id (81); the other 781 have none. Earlier counts in the same file were 588 of 850 (first run) and 728 of 993 (`bee01360`, later run); they are superseded. The dispatcher reads `#### BL-nnn` with three digits only and BL-999 is used up; the 38 proposed rows are status `proposed` and use ids from free-list holes. The id fix is under `scripts/agents/**`, founder-owned. Detail: INPUTS row P-B.
6. **Design system v2 and the end-to-end design** (130 screens, 990 states, 415 motion ids; about 60 overlapping build rows DS2-xx, ENG-M1 to M15, R1 to R13, ES-A1 to A15): native tabs replace today's `expo-router/js-tabs`, `GlassSurface` over `expo-glass-effect`, SF Symbols through `expo-symbols`, tokens v2, font cuts, a motion lint rule, a Low Power Mode hook. `expo-symbols`, `expo-battery`, `expo-image` are not dependencies today. Detail: PACK-DELTA-6.
7. **The phone-only flag and pause pattern, and ADRs that do not exist.** TestFlight runs servers off, so `mayRun` hides a phone-only feature. ADR 0029 to 0039 are cited as files but only 0028 and 0101 exist; CL-021 and CL-111 now rule that mobile adds `libraryDays` and `signIn` to `kill-switches.ts` and writes ADR 0029. The `kill-switches.ts` header says switches stop only server features (E21). Three different name sets for the media flags remain (card 27, the operations addendum, handoff 24). Detail: PACK-DELTA-2 section 3 and PACK-DELTA-5 section 3.
8. **Source scans and tests the pack asks to rewrite or add.** NS-01-R22 and NS-49-R6, R25, R26 still read "closed" in rev 2 while card 27 lists them as overridden (card-to-card, not applied in place); a module-name deny-list on `suggest`, `classif`, `tone`, `improve` (FR-AIS-54, FR-AIS-61) collides with NS-49's `pickSuggestion()`, `suggestion` source and `EXPO_PUBLIC_SUGGESTIONS`; content rules do not read new key families until a drift test exists; log canary and Erase scan gain media; media P0 rows are non-waivable at G4; the device matrix gains iOS 17.0, 17.1, 17.2, 26, iPad and an SE 3. Detail: PACK-DELTA-5.
9. **Errata E23 to E33 and the lock.** Rev 2 is "LOCKED" on the branch; #934 and #935 are open; changes after lock are errata rows with a "Plan delta:" line (`FEEDBACK-LOOP.md:14` @a3806f74). E23 makes a Share picture an X2 path (our SEC already treats it so). E27 makes BL-961 a dependency of NS-10-R3 and R5. E29: builders read the latest migration by search. E31 moves NS-49 level 1 to drop B. E32: level 3 is spike-only in Build 13. E33 renames `tmp/share` to the share feature's own Caches folder (CR-67 AX-9). Detail: PACK-DELTA-6 section 1.
10. **Our designs and handoff 24 are stale against develop.** 27 commits since 12:00 UTC overtake statements in `11-foundations.md` and `09-capture.md` (the planner now reads `quiet`; sign-out ends reminders). The IA audit adds nine duplicated domain facts for CODE-R13 (one age function, two `monthDay`). Plan #847 at `458fae46` still maps NS-01 to NS-37 only. Detail: PACK-DELTA-6 sections 3 and 4.

## 4. Sent to product (conflicts, with their kind)

Never built either way; each needs product's or Karma's answer before the affected row starts. Items resolved by rev 2 are in section 4b.
1. Card-internal: NS-51-R6 says the index is "in the phone database" and also "excluded from the iPhone backup" (R6, R23). One SQLite file is backed up whole [E]. Unchanged at `a3806f74` (`27:139`).
2. Card-to-card: card 27's "Changes to locked cards" overrides NS-01-R15, R21a, R22, the NS-01 never-line, NS-49 section 3 and R6, R25, R26, NS-32 section 3 and R5, R12, NS-35-R5 and others, but the rows still read the old way at `a3806f74` (`01:133, 147, 150`, `21:889, 908, 909` @a3806f74 line numbers by grep) and no errata row E34 or later records the edit.
3. Card-to-card: NS-50-R5 puts a day slip (2b) and a Days ask (3b) into the Home slip order; card 10's ruled order is four slips (`10:22` @a3806f74).
4. Card-to-built: BL-982 stores typed days in `settings` keys; NS-47 puts ticked days outside `scribe.db` and the backup (handoff C-20, Q-E5): two stores for one Days page.
5. Function-to-card: FR-AIS-54 and FR-AIS-61 deny-list `suggest` in module names; NS-49 names `pickSuggestion()`, a `suggestion` source and `EXPO_PUBLIC_SUGGESTIONS`. No closure decides it (`FUNCTION-TRACE.md:546` @bee01360; CL-093 and CL-094 do not mention it).
6. Card-to-card: three name sets for the media flags (card 27 `EXPO_PUBLIC_PHOTO_MOMENTS`, `EXPO_PUBLIC_VIDEO`, `killSwitches.videos`; operations addendum `EXPO_PUBLIC_MEDIA_ATTACH`, `killSwitches.mediaAttach`; handoff `media`, `EXPO_PUBLIC_MEDIA_SYNC`). CL-111 names only `libraryDays` and `signIn`.
7. Card 27 proposes a local migration 12 for `entry_media`; the handoff asks to amend migration 11 in #835 before it merges (Q-E12). Unchanged at `a3806f74` (`27:35, :408`). Decision deadline: before #835 merges.
8. Header drift: cards 19 and 21 read "CURRENT (LOCKED rev 2)" in line 3 and "Locked v1.0 candidate" and "Final holistic draft" in line 5; REGISTRY row C27 says "CURRENT". Product to align.
9. Wrong paths and ids the cards cite: `docs/privacy/DATA_CLASSIFICATION.md` (real: `docs/legal/DATA_CLASSIFICATION.md` section 4.6, founder-merged), "ADR 0029" as a file (CL-111 says mobile writes it), module names `scribe-photo-library` against handoff `scribe-library`.
10. Level 3 timing: E32 says spike only in Build 13 and ship in 1.1; card 27 and CL-052 say drop C after 1.0 is approved with a spike first. Read together they agree; say so once in card 27.

### 4b. Resolved by rev 2 (were conflicts in v1)

- NS-47-R6 against R7 (restored phone): rewritten, `culture.asked` lives in `settings` and a restored phone does not ask again (`21:488-489` @a3806f74 numbering by grep).
- NS-48-R11 against built named titles: rewritten to "a new catalogue title never carries `{child}`; the migrated 8 keep their built named titles, which render only when names are on".
- Card 19 and the function files: "inside the lock" question answered by `22:153` (cards 00 to 27, function files, design areas A to E).
- Q-PM-1 to Q-PM-12, Q-FD-1 to Q-FD-34 and most function questions: answered by acceptance of defaults, CL-001 to CL-113.

## 5. What needs the founder, counsel or Karma (collected, not answered)

Founder answers are in; what remains is hands and reads.
- Founder hands, from `22:` section 7 and the closures (@a3806f74): Apple entitlement request if the portal needs one (CL-019, CL-042); borrow phones for device rows (CL-038, CL-090); DMARC record and `hello@`, `dmarc@`, `abuse@` mailboxes (CL-062, CL-066); two offline key copies and a sealed key sheet (CL-066, CL-091); pen test spend before the first non-family person stores letters on the server (CL-069); monthly second backup copy, second-provider status page, second contact route (CL-090); tell the alpha families (CL-077). Supabase Auth production settings of NS-41 section 10 and App Store Connect fields of NS-38 are founder or `ops` steps [E: card says so].
- Counsel (through the founder): a child's picture or video leaving the phone (Q54, X2; CL-084), App Review 5.1.1 for a library permission, the Photos purpose string, DPLA 3.3.3(H) and 5.1.3 for level 2, label wording per variant, CUL-Q5 to Q7 and Q11, FR-DAY-23 copied tables, the consent line, breach notice and co-parent removal (CL-071), research consent (CL-075), and the F6 batch.
- Karma: record the status mismatch of cards 19, 21, 27 (section 4 item 8); the next errata row for the card-to-card overrides (item 2); CR-66 precedence names cards 19, 21, 26, 27 (handoff E-10); Q-E1 to Q-E16 of the handoff that closures did not answer (budget shape, store placement, migration 11 or 12, ADR numbers); the dispatcher id format; one flag-name set for media.
- Engineering (mine to hand off): ADR numbers and authors, the lint rule for `expo-glass-effect`, one age function in core.

## 6. How I checked this (cite log, re-based)

- Pass 1 (v1, at `bee01360`): 62 scripted line cites, 62 held; 22 code cites on develop `16e61549`, 22 held; 23 drafting corrections.
- Review findings on v1 (two independent reviews per PR): 7 more cites did not hold, all fixed in v2: `19:11` (is "Conventions", not the claim); `consent.ts:113` (the `'en'` locale is at `apps/mobile/src/lib/auth/consent.ts:124`); `account-deletion.en.ts` and `child.ts` lacked folders (`packages/content/src/features/account-deletion.en.ts`, `packages/core/src/child.ts`); `planner.ts:286` is `inQuietHours`; `RULINGS.md:610` is CR-64 (CR-66 is at `:632`); short code paths (`packages/api/src/kill-switches.ts`, `apps/mobile/src/lib/billing/plan-reminders.logic.ts`, `packages/api/src/remote-config.ts`); the stale 588 of 850 figure.
- Pass 2 (v2, at `a3806f74`, `7e684984`, `458fae46`): FR counts recomputed by script over `FUNCTION-TRACE.md` lines for 947 rows and 514 P0 (matches section 0.1); P0 per card by `p0.py` (NS-38 to NS-45 96, NS-46 to NS-50 87, NS-51 27, NS-52 26); heads and PR states by `gh api` and `git rev-parse` (6 facts); closures read in `GAP-LOG.md` (CL-001 to CL-113); errata E31 to E33 read in full; card rows NS-47-R6, R7, NS-48-R11, NS-51-R6, NS-01-R15, R21a, R22, NS-49-R6, R25, R26 re-read at the new head; plan #847 re-read at `458fae46`; e2e INDEX counts re-read at `7e684984` (unchanged: 130, 990, 415). Cites re-checked in the v2 text: see the counts in each file's closing section.
- Not re-run: the code cites on develop (develop is still `16e61549`, unchanged since pass 1).

## 7. What I could not verify

- Any claim in the cards or reviews that rests on Apple's pages, Supabase's pages or the iOS 26 and 27 behaviour (most are marked UNVERIFIED by their authors; I fetched none).
- Whether `20261108000000` and `20261109000000` are applied to production (OBS-R14).
- The e2e screens as drawn: I read INDEX counts and the engineering rows, not the prototypes.
- Whether the trace's "locked row" statuses are right; 671 FRs still read "needs Karma ruling" although closures answered many; I used the trace as given.
- Row-by-row correctness of the 947 FRs: counted and grouped, not read in full.
- Whether function-file line cites in PACK-DELTA-3 to -5 still land at `a3806f74`: they are at `bee01360` (the files changed 2 to 38 lines each); find each by FR id.
