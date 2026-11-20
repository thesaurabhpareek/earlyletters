BRIEF BL-942: Save a copy of the year: the Home slip and the one export path (NS-11)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: mobile   Lane: Pack 5 (keeping) with the export owner   Build: 15 (wave 3); flag EXPO_PUBLIC_SAVE_A_COPY (PROPOSED), off in every profile   Wave: 3   Size: S: 942a about 250 lines; 942b about 200 lines
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: BL-931 (all photo slices) and BL-952 (8/8 Find) done, BL-963 (the slip registry, ready, not written) merged; 942b also needs the founder's words (BL-965 #870). Q: the slip window (OQ-10, CPO role default 7 days after) is a product default, not a founder word.

1. GOAL: When a child's birthday week has passed and the book has at least one kept letter, then Home shows one calm slip that opens the existing export; the Me row reads as Save a copy; a quiet or hidden book never shows a slip; nothing counts letters or names a gap.

2. CARD ROWS and TEST TITLES
   Rows: NS-11-R1 to R8, R12, R13 to R16, R21 to R24; R10 rides BL-933 (card 08 lines 650-674).
   P0 tests (exact; PR #927 catalogue D): [NS-11-R8] a quiet book gets no slip (mutant: ignore quiet in slip selection); [NS-11-R12] export works after a lapse (mutant: gate export on hasPlus); [NS-11-R23] no temp copy left behind (mutant: delete only on success); [NS-11-R5] no counts or fear (content test; mutant: 'you have 120 letters').
   Others by card title: [NS-11-R1] Save a copy is two taps from Me; [NS-11-R2] the slip shows once a year; [NS-11-R3] dismissed means gone for the year; [NS-11-R4] one slip at a time; [NS-11-R6a] one export code path; [NS-11-R6b] same export apart from its time; [NS-11-R7] no slip before a birth date; [NS-11-R13] leap-day birthday; [NS-11-R16] a full destination marks nothing done; [NS-11-R22] slip state belongs to one account.
   Red on develop: no copySlipDue exists; Me's Export row (app/settings/index.tsx:161) and Where your letters live both carry an export row (design K13).

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  apps/mobile/src/lib/save-a-copy/slip.logic.ts (new, pure copySlipDue({books, today, states, keptLetters})), the slip state under settings key copySlip.<child id>.<year>, the slip entry in the BL-963 registry, apps/mobile/src/app/(tabs)/index.tsx slip slot only, apps/mobile/src/app/settings/index.tsx row title (942b), capabilities flag + test/capabilities.test.ts:243 env list + preflights, matching tests, docs/agents/checkins/mobile-bl-942.md
   Never:  lib/export/** except calling it (R6a: one code path), export schema (BL-933), packages/content except PROPOSED keys, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: the Home slip slot is shared with NS-23, NS-18, NS-46 (one slip at a time, BL-963 registry order); Book files with BL-937, BL-938.

4. READING PACK
PR #917 KNOWLEDGE-PACKS.md Pack 5; 08-keeping.md section 5 and K13, U5, U6 (develop); card 08 lines 579-674 at 450bcb4a; libraries ALREADY-HAVE (PR #920): expo-sharing is installed (~57.0.22).
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   apps/mobile/src/app/settings/index.tsx:161          the Export row (rename, never a second row)
   apps/mobile/src/lib/export/device.ts:295            file name carries no account data (R11)
   apps/mobile/src/app/_layout.tsx:119                 temp ZIP swept at launch (R23)
   apps/mobile/src/app/settings/export.tsx:96-103      keep-awake only while exporting (R19)
   apps/mobile/src/app/settings/where-letters-live.tsx:5  imports LAST_EXPORT_SETTING; its own Export row (K13)
   apps/mobile/test/capabilities.test.ts:243           env list pinned (adding the flag updates it) [U: re-open the line]

6. DATA AND SECURITY
   Data classes: copySlip.<child id>.<year>: child id L3, value L2; phone only; never synced or exported. Nothing new leaves the phone: the copy goes only where the parent sends it through the system share sheet (X2 not triggered; security-architect confirms at review).
   Boundary: export and share sheet. Owner of the read: security-architect. A picture or a voice in the ZIP leaves only by the parent's own act.

7. LIBRARIES ALLOWED
Use installed expo-sharing. expo-battery is NOT installed (checked package.json): R17 (Low Power Mode line) needs a decision; candidate LD in PR #920 [U: re-open]; a new dependency needs the founder (AIE-R21). Ship without R17 (P2) until then.

8. BUDGETS
Progress within 500 ms of the tap (R24); year-1 fixture about 230 MB in airplane mode on an SE 3 (R18, device); export peak memory under 150 MB, streamed to disk (budget M-04, PR #928); screen awake only while exporting (B-07). CI covers shape only; SE 3 numbers: not measured.

9. ACCEPTANCE
   Experience: area C Save a copy and the Home slip states; re-open docs/e2e-ux-20nov (9e78eecd) and the motion ids. [U: not re-read]
   Test cases: PR #927 catalogue D NS-11. Security: PR #914 export and share sheet.
   Done also means: each test red on old code and on its mutant; `[NS-11-R5]` passes in packages/content.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1 (942a): copySlipDue pure + state keys + flag + registry entry + [R2][R3][R4][R7][R8][R13] | about 250 lines, 6 files | base develop | flag off in every profile; preflight proves it
   PR 2 (942b): Me row rename, the screen's lines, slip surface | about 200 lines, 5 files | after the words
   R10 and the 1.7.0 ZIP: BL-933, not here.

11. REVIEW LENSES
Lens A: principal-architect. Lens B: compliance-engineer (no count, no fear; the copy is the parent's).

12. ORDER AND DEPENDENCIES
After: BL-931, BL-952, BL-963; BL-933 for R10. Before: BL-948. Blocked by: founder words (942b), the three hard dependencies.

13. DEFINITION OF DONE
   [ ] focused tests (red on old code, red on the named mutant), then `npm test -w apps/mobile` (baseline: 8 files, 73 tests fail for missing expo-local-authentication, expo-clipboard; nothing else)
   [ ] `cd apps/mobile && npx tsc --noEmit`: only the 5 known errors
   [ ] `npm test -w packages/content` if any string or content key changed (new keys are PROPOSED)
   [ ] ASCII only in added lines; no content in logs; fictional family Asha only
   [ ] PR body per HARNESS-RUN.md (Agent, Mode, Satisfies, Data classes touched); labels agent:mobile, from:agent (+ needs:founder)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
U5: does expo-sharing 57 report saved versus cancelled? If not, 'saved' is never recorded, only 'dismissed' (R3, R16). R18 airplane SE 3; R20 low free space; share sheet destination full.

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - the share result cannot tell saved from cancelled; - R17 needs a new dependency.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #8 first; marker `<!-- journal run:sess-20261120-mobile-bl-942 agent:mobile -->`.
   Check-in: docs/agents/checkins/mobile-bl-942.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: feat/mobile-bl-942a-copy-slip-logic in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:mobile -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
