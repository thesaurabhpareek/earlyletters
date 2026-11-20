BRIEF BL-922a: The held screen when consent is still to give (NS-10-R0, R4a, R4b)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: mobile   Lane: Pack 3 (account and consent)   Build: 13; holds the cut (Q1)   Wave: 1   Size: M: about 350 lines, 9 files
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: the founder approves the held screen's PROPOSED lines (BL-965, #870, head 985c42df, open); the code can be built against the keys first. #871 and #879 (BL-961) should merge first because they touch lib/first-run and _layout (design section 7).

1. GOAL: When a returning account with no book on this phone has consent still to give, then within 10 seconds the app shows a held screen with Finish setup, Try another way, Delete account and the export, and never shows the child step.

2. CARD ROWS and TEST TITLES
   Rows: NS-10-R0, NS-10-R4a, NS-10-R4b (card 08 lines 476, 481, 482). R8 stays as built.
   Tests (titles exact, PR #925 catalogue A):
     [NS-10-R0] a returning account never meets the child step   mutant: remove the no-book-with-account branch so first-run shows
     [NS-10-R4a] deletion works without agreeing                 mutant: require Terms before the delete route mounts
     [NS-10-R4b] export reachable after declining                mutant: hide export behind the Terms gate
     [NS-10-R8] kill switch at sign-in shows the local book      (retitle only; mutant: check the switch after the held-screen decision)
   Red on develop: gate.logic.ts answers `childStep` for a session with no book (:129) and heldNewPhoneView returns undefined for needsConsent (:194-199).

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  apps/mobile/src/lib/first-run/{gate.logic.ts,new-phone.logic.ts,welcome.logic.ts,use-first-run-route.ts}, apps/mobile/src/components/onboarding/new-phone-screens.tsx, apps/mobile/test/first-run-*.test.ts (rewrite the pins at first-run-new-account.test.ts), docs/agents/checkins/mobile-bl-922a.md
   Never:  app/_layout.tsx (BL-961 owns the account cover), lib/auth/consent.ts (BL-978a), supabase/**, words in packages/content except PROPOSED keys, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: new-phone-screens.tsx and lib/first-run/* order is BL-922a, then BL-978a (design section 7); BL-961 #871 touches first-run too, so whichever lands second merges develop.

4. READING PACK
PR #917 KNOWLEDGE-PACKS.md Pack 3; 08-keeping.md section 3.1 to 3.7 (develop); PR #925 catalogue A NS-10 block; PR #914 section on NSC-03 (second account) for what the screen must not show.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   apps/mobile/src/lib/first-run/gate.logic.ts:110       serverFeatures false returns `unchanged`; :129 any session with no book gets childStep
   apps/mobile/src/lib/first-run/gate.logic.ts:187-199   the 'Known gap' comment (CR-61) and heldNewPhoneView (the function to extend)
   apps/mobile/src/lib/first-run/new-phone.logic.ts:32   OpeningView union (add `consent`); :86 ARRIVAL_SETTING
   apps/mobile/src/lib/first-run/use-first-run-route.ts:12, :135   where needsConsent keeps route `new`
   apps/mobile/src/app/settings/account.tsx:227          Finish setup pushes the consent route today (copy this call)
   apps/mobile/src/app/_layout.tsx:243                   AppLockLayer (do not touch here)

6. DATA AND SECURITY
   Data classes: none new; reads auth state in memory. No email appears on a shared screen. Nothing stored, sent or logged.
   Boundary: account and consent (security.md B-account; NSC-03 for the layer). Read by: security-architect (lens B).
   Control: Try another way and Delete account must never depend on the consent route (an App Review 2.1 risk, design 3.7).

7. LIBRARIES ALLOWED
Use installed expo-router. None new.

8. BUDGETS
Decision is pure over auth state in memory; no launch waits on the network (A-NFR-002, budget L-03 in PR #928). Checked by: the hook test reads nothing from the network. Cold start on an SE 3 stays with BL-929: not measured.

9. ACCEPTANCE
   Experience: area C held screen (Finish setup, Try another way, Delete account, export), 44 pt targets, stacked actions; re-open docs/e2e-ux-20nov (9e78eecd) area C. [U: not re-read here]
   Test cases: PR #925 catalogue A NS-10-R0, R4a, R4b, R8. Security: PR #915 second-account cases.
   Done also means: the 'Known gap' comments at gate.logic.ts:187 are removed (BL-922's done line); each test red on old code and on its mutant.

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: pure OpeningView `consent`, gate step `finishSetup`, welcome mapping, screen, route hook, tests | about 350 lines, 9 files | base develop (or #871's branch if it has not landed) | no flag; the no-server build is unchanged (R8 test)
   If over 400 lines: PR 1a pure logic + gate tests, PR 1b screen + hook.

11. REVIEW LENSES
Lens A: principal-architect. Lens B: security-architect (the held screen is boot-adjacent and a dead end would be an App Review rejection).

12. ORDER AND DEPENDENCIES
After: BL-961 #871 and #879 merged (so lib/first-run is quiet); BL-965 words. Before: BL-978a. Blocked by: founder words only for merge.

13. DEFINITION OF DONE
   [ ] focused tests (red on old code, red on the named mutant), then `npm test -w apps/mobile` (baseline: 8 files, 73 tests fail for missing expo-local-authentication, expo-clipboard; nothing else)
   [ ] `cd apps/mobile && npx tsc --noEmit`: only the 5 known errors
   [ ] `npm test -w packages/content` if any string or content key changed (new keys are PROPOSED)
   [ ] ASCII only in added lines; no content in logs; fictional family Asha only
   [ ] PR body per HARNESS-RUN.md (Agent, Mode, Satisfies, Data classes touched); labels agent:mobile, from:agent (+ needs:founder)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
S1-204 on two phones (new phone, consent outstanding, 10 s, never the child step); NS-10-R0 on a real cold start; R4a Delete account reachable with Terms outstanding.

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - the consent route cannot open from the held screen; - `_layout.tsx` must change; - a new server call is needed.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #8 first; marker `<!-- journal run:sess-20261120-mobile-bl-922a agent:mobile -->`.
   Check-in: docs/agents/checkins/mobile-bl-922a.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: fix/mobile-bl-922a-held-screen in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:mobile -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
