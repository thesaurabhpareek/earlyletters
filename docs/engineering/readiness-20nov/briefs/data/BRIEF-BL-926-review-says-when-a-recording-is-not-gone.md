BRIEF BL-926: Review says so when a let-go has not finished (NS-09-R4a, R4b)      Filled by: data-architect for Karma (RD-H2), 20 Nov 2026 19:00 UTC
Agent: mobile   Lane: Pack 5 (keeping and letting go)   Build: 13; holds the cut (Q1 recommendation)   Wave: 1   Size: S, about 200 lines, 5 files
Read first: re-open every file:line in this brief before relying on it. Cites were checked at develop 16e61549 (20 Nov, 17:35 UTC); the designs were written at d5d12178 and some lines have moved. Anything not yet on develop is cited by PR number.
Blocked until: the founder approves the BL-925 words (#866, head b981114e, open, needs:founder); BL-926 merges after BL-925 (plan 2.3). The code may be written now against the PROPOSED keys on #866's branch; do not merge or restate the words.

1. GOAL: When Let it go on Review cannot delete the recording, then Review stays on screen, hides Keep and Let it go, shows one quiet line once for that take, and VoiceOver reads it once after the alert closes; when the delete works, Review goes back as today.

2. CARD ROWS and TEST TITLES
   Rows: NS-09-R4a, NS-09-R4b (card 08 lines 303-304 at 450bcb4a). R9 wording is a BL-925 key change, not this PR.
   Tests (titles exact, catalogue A in PR #925):
     [NS-09-R4a] the line shows once per take          (unit; mutant: drop the per-take key so it shows on every render)
     [NS-09-R4b] Review says when a recording is not gone yet   (unit with fake timers; mutant: announce on mount, before the settle)
   Red on develop 16e61549: review.tsx:415 ignores the result of letItGo, so the screen always goes back (assert: still on Review with the line).
   Fixture: one Asha draft, expo-fs-standin with an undeletable path (test/helpers/expo-fs-standin.ts); second take for the once-per-take case.

3. FILES: TOUCH / DO NOT TOUCH
   Touch:  apps/mobile/src/lib/capture/let-it-go.logic.ts (add pure letGoOutcome(id, ok, getDraft) -> gone | stuck | absent), apps/mobile/src/app/review.tsx (the let-go branch only), apps/mobile/src/lib/a11y.ts (announce() exists at :5; add a delay port only if needed), apps/mobile/test/let-it-go.test.ts and a new test/review-let-go-stuck.test.ts, docs/agents/checkins/mobile-bl-926.md
   Never:  app/listen.tsx (R3 is built), lib/capture/sweep*.ts, settings screens (P-4a), packages/content except by merging the BL-925 keys from #866, charters, memory, roster, workflows, BACKLOG, BOARD.
   Shared file rule: review.tsx is also edited by the photo slices #838 to #840; whichever lands second merges develop.

4. READING PACK
PR #917 KNOWLEDGE-PACKS.md Pack 5 files 1 to 4 and its pitfalls; docs/tdd/new-scope/08-keeping.md section 2.1 to 2.2 (develop); PR #925 catalogue A rows NS-09-R4a, R4b.
   Stale-fact check: re-open every file:line you cite; `git grep` the symbol.

5. CODE ENTRY POINTS (file:line, checked at 16e61549 unless marked)
   apps/mobile/src/app/review.tsx:415            letItGo(...) call; result ignored
   apps/mobile/src/lib/capture/let-it-go.logic.ts:29   letItGo returns false when the file will not delete; the row stays `discarding`
   apps/mobile/src/lib/capture/sweep.ts:56       runLaunchSweep finishes any discarding draft at launch
   packages/content/src/strings.en.ts:303        discardBody (BL-925 edits it; PROPOSED)
   apps/mobile/test/let-it-go.test.ts, test/sweep.disk.test.ts:288-417   existing [NS-09-R1..R3] tests to copy

6. DATA AND SECURITY
   Data classes touched: none new. Nothing stored, sent or logged; the line shows no count and no error word.
   Boundary: none (local). Read by: none. The announce call carries the PROPOSED line text only, never the transcript.
   Privacy line: nothing of a child's voice or picture leaves the phone.

7. LIBRARIES ALLOWED
Use what is installed. A new dependency needs the founder's approval (AIE-R21). Libraries RD-F (PR #919, #920): none needed; React Native Alert and InteractionManager are in the platform.

8. BUDGETS
Sweep stays after the first frame and unawaited (sweep.ts:2-3); a failure costs one settings write at most (A-NFR-001, A-NFR-002). Checked by: existing launch tests. NS-09-R5 (under 5 ms, PROPOSED) is a BL-929 SE 3 row, not measured here.

9. ACCEPTANCE
   Experience: area C (keeping and trust) Review states in docs/design/e2e on docs/e2e-ux-20nov (9e78eecd); re-open the Review let-go states and the motion ids before building. [U: not re-read by this brief]
   Test cases: PR #925 catalogue A (NS-09-R4a, R4b). Security: none beyond the no-content rule.
   Done also means: each new test red on old code and red on its mutant (above).

10. PR BREAKDOWN AND SIZES (merge order)
   PR 1: letGoOutcome pure function + its unit tests | about 80 lines, 2 files | base develop | no flag; unchanged when the delete works
   PR 2: Review stays and shows the line, announce after settle | about 120 lines, 3 files | base develop (or the BL-925 branch if #866 is unmerged)

11. REVIEW LENSES
Lens A: principal-architect (correctness, tests that fail on old code). Lens B: design-systems (the line sits under the transcript in the muted footnote style).

12. ORDER AND DEPENDENCIES
After: BL-925 (#866) for the words. Before: P-4 (the stuck row reuses the count). Blocked by: founder words.

13. DEFINITION OF DONE
   [ ] focused tests (red on old code, red on the named mutant), then `npm test -w apps/mobile` (baseline: 8 files, 73 tests fail for missing expo-local-authentication, expo-clipboard; nothing else)
   [ ] `cd apps/mobile && npx tsc --noEmit`: only the 5 known errors
   [ ] `npm test -w packages/content` if any string or content key changed (new keys are PROPOSED)
   [ ] ASCII only in added lines; no content in logs; fictional family Asha only
   [ ] PR body per HARNESS-RUN.md (Agent, Mode, Satisfies, Data classes touched); labels agent:mobile, from:agent (+ needs:founder)
   [ ] journal PATCHed; check-in line committed

14. WHAT ONLY A PHONE CAN PROVE
NS-09-R4b VoiceOver read after the alert closes (design U1, device row on BL-929's sheet); NS-09-R9 default focus on Keep (U2).

15. STOP AND ASK (say so in the PR and the journal; do not guess)
   - the card and a design disagree (write a `Conflict:` line to `product`); - a file outside the claim globs must change;
   - the change needs a new dependency, entitlement, plist key, permission or background mode; - a word a parent reads is needed;
   - a number is not in a card (budget, cap, date); - two failed attempts at the same fix; - the head of a PR you build on moves under you.
   - the line would show twice for one take; - the draft can still be kept after a stuck result.

16. HARNESS STEPS
   claim row: Karma holds it on BOARD (do not edit). Journal stub on issue #8 first; marker `<!-- journal run:sess-20261120-mobile-bl-926 agent:mobile -->`.
   Check-in: docs/agents/checkins/mobile-bl-926.md, 3 lines every ~30 min, UTC from `date -u`.
   Branch: fix/mobile-bl-926-let-go-stuck-line in a worktree under the scratchpad; push at least every 30 min; open the PR yourself (REST). Every comment starts `<!-- agent:mobile -->`.
   If a journal comment or a label is refused: do not retry; write the text to a file and say so.
