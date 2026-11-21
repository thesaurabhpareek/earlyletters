BRIEF BL-976: Backup stays off: claim patterns, the keep-safe line and the readiness notes (NS-08-R7, R8, R1 to R4, R9)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: PR 1 content, PR 2 mobile, PR 3 sync (Karma dispatches three runs; journal and check-in below are mobile's)   Lane: Pack 5 (keeping)   Build: 13 (R5, R6 merged; R7 per-candidate claims check)   Wave: 1   Size: S: P-6b about 80 lines 1 file; P-6c about 150 lines 5 files; notes docs only
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: P-6c: the founder approves the R8 line (PROPOSED key, BL-965 #870) and counsel's read of the iCloud line (OQ-4, Q43); until then no R8 line ships. Notes R1 to R4, R9: R3 and R9 need the founder (storage path OQ-1, backup of the backup OQ-3). Already merged, do not redo: #874 ([NS-08-R6]) and #875 (keep-safe preflight, R5).

1. GOAL: When backup is off, then no sentence anywhere implies a recording is kept off the phone, the keep-safe line points to Save a copy and the phone's own iCloud Backup once, and the readiness notes answer R1 to R4 and R9 with the founder's open questions listed.

2. CARD ROWS and TEST TITLES
   Rows: NS-08-R7, R8 (code); NS-08-R1 to R4, R9 (notes) (card 08 lines 114-122).
   Tests (exact; PR #927 catalogue D and the card):
     [NS-08-R7] no backup claim while backup is off     mutant: add 'Safe if you lose your phone' to a store string
     [NS-08-R8] the keep-safe line names the two real copies   (card title; mutant: the line names iCloud with no truth pattern, which the claims rule must fail until P-6b)
     [NS-08-R9] backup of the backup decided before a flip     (doc check, GAP in the catalogue: a checklist line)
   Red on develop: the claims rule (claims-capabilities.test.ts:206-211) would fail an R8 line that names iCloud (design K6).

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  packages/content/test/claims-capabilities.test.ts and its claim data (P-6b), apps/mobile/src/components/settings/where-live.logic.ts and app/settings/where-letters-live.tsx (P-6c), the notes (PR 3) go where the BL-976 backlog row names (re-open the row), docs/agents/checkins/mobile-bl-976.md
   Never:  eas.json (R5 is merged and guarded), lib/backup/** (16 files, 4,128 lines: no flip work), apps/mobile/package.json (scribe-keys stays excluded from autolinking at :96), supabase/**, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: where-letters-live.tsx and storage.tsx are also edited by P-4a; serial.

4. READING PACK
PR #917 KNOWLEDGE-PACKS.md Pack 5 pitfalls; 08-keeping.md section 4.1 to 4.4 (develop); docs/adr/0024-owner-backup-v1.md (still Proposed); PR #927 catalogue D NS-08 rows.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   packages/content/test/claims-capabilities.test.ts:206    the backup claims rule; its only allowed truth is 'your iPhone's own backup'
   apps/mobile/test/backup-gate.test.ts:56                  no profile sets EXPO_PUBLIC_BACKUP=on
   apps/mobile/src/components/settings/where-live.logic.ts:43   the nudge slot R8 would use (shows until the first export)
   apps/mobile/src/app/settings/where-letters-live.tsx:29   the screen; export row via where-live
   apps/mobile/src/lib/auth/auth-store.ts:188-194          sign-out waits for sync ops only, not backup jobs (R15 at the flip)
   supabase/migrations/20261023000000_backup_server.sql    the flip's tables (reach production with the F4 re-run; no rows)

6. DATA AND SECURITY
   Data classes: new phone setting keepSafe.shown (L2, phone only). Nothing sent. X2 applies only at the flip, and no flip work is in this brief.
   Boundary: backup X2 note. Read by: security-architect (R7) and compliance-engineer. A child's voice never leaves the phone here.

7. LIBRARIES ALLOWED
None new. Do not link scribe-keys.

8. BUDGETS
Claims scan runs in `npm test` (BLOCK). R8 line shows once, no launch cost. Storage and egress prices for R2 are read with a date (U8): not measured.

9. ACCEPTANCE
   Experience: area C Where your letters live and the keep-safe card; re-open docs/e2e-ux-20nov (9e78eecd). Words PROPOSED.
   Test cases: PR #927 catalogue D NS-08. Security: PR #914 backup X2 section.
   Done also means: each test red on old code and on its mutant; the content test passes.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1 (P-6b): add the card's banned forms ('never lose', 'safe in the cloud', 'only you can restore', 'free backup', survives loss of the phone) and one iCloud truth pattern, title [NS-08-R7] | about 80 lines, 1 file | base develop
   PR 2 (P-6c): R8 line in the nudge slot, shown once | about 150 lines, 5 files | after P-6b and the words
   PR 3 (notes, owner `sync`, docs): R1 to R4 and R9 answered; lists OQ-1 to OQ-4 | docs only | base develop

11. REVIEW LENSES
Lens A: compliance-engineer (claims); security-architect (R7, notes). Lens B: qa (P-6b), design-systems (P-6c).

12. ORDER AND DEPENDENCIES
After: BL-965 words. Before: any backup flip (not scheduled). Blocked by: founder words, counsel OQ-4, founder OQ-1 and OQ-3.

13. DEFINITION OF DONE
   [ ] focused tests (red on old code, red on the named mutant), then `npm test -w apps/mobile` (baseline: 8 files, 73 tests fail for missing expo-local-authentication, expo-clipboard; nothing else)
   [ ] `cd apps/mobile && npx tsc --noEmit`: only the 5 known errors
   [ ] `npm test -w packages/content` if any string or content key changed (new keys are PROPOSED)
   [ ] ASCII only in added lines; no content in logs; fictional family Asha only
   [ ] PR body per HARNESS-RUN.md (Agent, Mode, Satisfies, Data classes touched); labels agent:mobile, from:agent (+ needs:founder)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
NS-08-R6 J-N21: sign out with backup off, every recording still plays (already tested by #874; the sheet text is the device row).

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - a line names iCloud before counsel has read it; - any file under lib/backup/ would change.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #8 first; marker `<!-- journal run:sess-20261120-mobile-bl-976 agent:mobile -->`.
   Check-in: docs/agents/checkins/mobile-bl-976.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: fix/content-bl-976-claims-icloud in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:mobile -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
