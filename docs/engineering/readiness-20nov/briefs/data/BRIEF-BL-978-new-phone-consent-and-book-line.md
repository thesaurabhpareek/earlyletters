BRIEF BL-978: New phone: consent retry, slow-arrival and the Book-level line (NS-10-R2, R8, R10 to R13)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: mobile   Lane: Pack 3 (account and consent)   Build: 13; R7 is closed by #903, the other P0 rows: founder decides (Q1)   Wave: 1   Size: M: 978a about 300 lines 8 files; 978b about 300 lines 8 files
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: 978a: BL-922a merged first (same files), and the PROPOSED R12 line from BL-965 (#870, open, needs:founder). 978b: the founder approves its words (BL-965 keys for the arrival line and the 'not on this phone' clause), and BL-937 merged first (both edit app/(tabs)/book.tsx).

1. GOAL: When a parent signs in on a second phone, then a lost books answer or a slow pull never shows the child step, one Book-level line says what has come and what is not on this phone, and every row R2, R8, R10 to R13 has a test with its NS id.

2. CARD ROWS and TEST TITLES
   Rows: NS-10-R2, R8, R10, R11, R12, R13 (card 08 lines 478, 486, 488-491). R7 is merged (#903, b27f690e, tests at test/consent-retry-one-key.test.ts:80, 169): do not redo it.
   Tests (exact, PR #925 catalogue A):
     [NS-10-R11] retry after a lost books answer             mutant: reset the cursor on retry (today restarting the 10 s clock is the red: use-new-phone.ts)
     [NS-10-R12] wrong account names the method              mutant: interpolate the full email
     [NS-10-R8] kill switch at sign-in shows the local book  (retitle; mutant: check the switch after the held-screen decision)
     [NS-10-R10] a lapsed plan still brings the book         (lapsed-plan fixture, 5 Asha letters; mutant: gate pulled rows on plan state)
     [NS-10-R2] a slow arrival shows what has come           (978b; mutant: show the empty state while pulling)
     [NS-10-R13] one book-level line for absent recordings   (978b; mutant: show a per-card line)
   Red on develop: an unreadable answer shows No book here yet at once while online (new-phone.logic.ts:67); Try again restarts the clock.

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  apps/mobile/src/lib/first-run/{new-phone.logic.ts,use-new-phone.ts}, lib/provenance.ts (978b clause), components/onboarding/new-phone-screens.tsx, app/(tabs)/book.tsx (978b, the one slot only), apps/mobile/test/first-run-*.test.ts, docs/agents/checkins/mobile-bl-978.md
   Never:  lib/auth/consent.ts (R7 is done), supabase/**, _layout.tsx, packages/content except PROPOSED keys, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: book.tsx is also edited by BL-937 and BL-938; 978b merges after BL-937. new-phone-screens.tsx: after BL-922a.

4. READING PACK
PR #917 KNOWLEDGE-PACKS.md Pack 3; 08-keeping.md sections 3.2, 3.5, 3.6 and K8, K9, K11 (develop); card 08 lines 476-492 at 450bcb4a; PR #925 catalogue A.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   apps/mobile/src/lib/first-run/new-phone.logic.ts:59-72   kind to OpeningView; :67 unknown + online gives noBook at once; :86 ARRIVAL_SETTING (value `dismissed` is new)
   apps/mobile/src/lib/first-run/gate.logic.ts:194           heldNewPhoneView
   apps/mobile/src/lib/auth/consent.ts:88, :97              heldAnswers(idempotencyKey) and recordConsent (R7, built)
   apps/mobile/src/app/(tabs)/book.tsx:372                   authCopy.newPhone.arrivedPlain, the line 978b replaces by arrivalLine()
   apps/mobile/src/lib/auth/session-provider.tsx:113         auth.lastMethod for R12 [U: re-open, the design cites :113]
   apps/mobile/test/consent-retry-one-key.test.ts:80         the test style to copy

6. DATA AND SECURITY
   Data classes: newPhone.arrival (L2, phone only) gains `dismissed`; no email on screen (R12); nothing stored or sent that is new. No migration.
   Boundary: account (NSC-03). Read by: security-architect (lens A). Fail closed: unreadable owner means the book is hidden (BL-961).

7. LIBRARIES ALLOWED
Use installed. None new.

8. BUDGETS
Every decision is pure over auth state in memory; no launch waits on the network (A-NFR-002). Pull of 1,000 letters: apply 200-row page under 300 ms off the UI thread, year of text p95 30 s on LTE (budget Q-05, PR #928, WATCH). Checked by: stand-in test for shape; lab for numbers: not measured.

9. ACCEPTANCE
   Experience: area C new-phone slow, no-book and arrived states; re-open docs/e2e-ux-20nov (9e78eecd). Lines are PROPOSED keys only.
   Test cases: PR #925 catalogue A NS-10. Security: PR #915 second-account and lost-answer cases.
   Done also means: each test red on old code and on its mutant.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1 (978a): R11 keep `began` across retries, unknown reads as opening for 10 s with one re-ask, R12 line, R8 and R10 retitles | about 300 lines, 8 files | base develop | no flag
   PR 2 (978b): arrivalLine() pure, `dismissed`, provenance clause, [R2][R13] | about 300 lines, 8 files | base develop after BL-937 and the words

11. REVIEW LENSES
Lens A: principal-architect. Lens B: security-architect (978a); design-systems (978b).

12. ORDER AND DEPENDENCIES
After: BL-922a, BL-961 #871 and #879 (978a); BL-937, words (978b). Before: BL-948 two-phone rows R1, R6, R14. Blocked by: founder words.

13. DEFINITION OF DONE
   [ ] focused tests (red on old code, red on the named mutant), then `npm test -w apps/mobile` (baseline: 8 files, 73 tests fail for missing expo-local-authentication, expo-clipboard; nothing else)
   [ ] `cd apps/mobile && npx tsc --noEmit`: only the 5 known errors
   [ ] `npm test -w packages/content` if any string or content key changed (new keys are PROPOSED)
   [ ] ASCII only in added lines; no content in logs; fictional family Asha only
   [ ] PR body per HARNESS-RUN.md (Agent, Mode, Satisfies, Data classes touched); labels agent:mobile, from:agent (+ needs:founder)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
S1-204 two phones; R6 restore then sign in (U4, Keychain after iCloud restore); R14 both phones receive within 30 s p95 over 20 runs.

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - R2's `more` line would stay on a stalled pull; - the server answer for 'account deleted elsewhere' (R9, OQ-6 for `sync`) is needed; no code until it is given.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #8 first; marker `<!-- journal run:sess-20261120-mobile-bl-978 agent:mobile -->`.
   Check-in: docs/agents/checkins/mobile-bl-978.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: fix/mobile-bl-978a-new-phone-rows in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:mobile -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
