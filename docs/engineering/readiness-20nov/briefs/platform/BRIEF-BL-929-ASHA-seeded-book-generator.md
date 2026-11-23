# BRIEF BL-929-ASHA: the seeded Asha book, 1,000 letters (harness H2; NS-34-R5)

Re-open every file:line before relying on it. Cites at `origin/develop` 16e61549, 20 Nov 2026 about 18:50 UTC. Tags [V] [E] [U]. Card and `14-test-plan.md` line cites are at the locked pack `450bcb4a` (#846, unmerged: `git show origin/docs/prd-lock-v1-20nov:<path>`); develop still holds the older cards.

**Blocked until: the pure plan and the `small` seed (letters only) can be built now. Pictures need the photo store (#835 to #840, all open, not merged [V]); videos need NS-52 locked (unlocked product input). The full-size run is the founder's phone and Mac (`xcrun devicectl` copy, optional `ffmpeg`: [U] whether he has it).** Founder-only: the device run, which phones he holds, any word a parent reads (none here: the vocabulary is invented fixture text, never shown).

```
BRIEF BL-929-ASHA                                 Filled by: ops (RD-H3) 20 Nov 2026 18:50 UTC
Agent: qa (with mobile)   Lane: Pack 8 (foundations) + Pack 10   Build: 13 sheet needs it ("an upgrade from the last store build with a seeded 1,000-letter Asha book", plan 6)   Wave: 1 to 2

1. GOAL: When `planBook({ seed: 20261120, letters: 1000, pictures: 300, videos: 20 })` runs twice, the same list comes out (pinned by SHA-256), every word comes from one fixed invented vocabulary, and the `small` book (50 letters) loads into a test store in under 2 seconds.

2. CARD ROWS and TEST TITLES: NS-34-R5 (a fictional seeded book; 11-foundations.md at the lock), NS-37-R1 (many letters), J-N13 (14-test-plan.md:63 at the lock, :50 on develop: 1,000 letters, 300 pictures, Book scroll on an SE 3).
   Tests: apps/mobile/test/asha-book-plan.test.ts
     [NS-34-R5] seeded book is generated and fictional      (determinism, counts, vocabulary, no real-family hash hit via packages/content/test/no-real-family-data.test.ts)
     [NS-37-R1] the small book loads in two seconds
   Red on develop: no generator (`ls scripts/qa` has release-catalog.*, skip-guard.* only [V]); asha-seed.ts seeds a handful of letters (210 lines [V]). Mutant: change one weight in the plan: the pinned hash test goes red.

3. FILES
   Touch: scripts/qa/asha-book/plan.mjs, media.mjs (new), apps/mobile/src/dev/asha-perf-seed.ts (new; loaded only when EXPO_PUBLIC_PERF === 'on', see BRIEF BL-929-PERF), apps/mobile/test/asha-book-plan.test.ts, docs/qa/run-sheets/ (a section in the BL-929 sheet, qa's own file),
          docs/agents/checkins/qa-asha.md
   Never: real family data of any kind; apps/mobile/src/dev/asha-seed.ts behaviour (the web preview uses it: `store-ready.web.ts`); media in git (about 1 GB: write to a folder outside the repo).
   Shared file: store.ts exports (`saveEntry`, `createDraft`, `addChild`) are also edited by BL-952 and BL-961; call them, do not edit store.ts.

4. READING PACK: Pack 8 and Pack 10; MEASUREMENT-PLAN.md sections 2 to 4 (#929: the shape table in section 3); apps/mobile/src/dev/asha-seed.ts (all); packages/content/test/no-real-family-data.test.ts; NFR-BUDGETS.md rows S-01, S-02, M-02, D-04 (#928).

5. CODE ENTRY POINTS (verified at 16e61549)
   apps/mobile/src/dev/asha-seed.ts:75    `seedAsha(opts)` seeds through the real store functions (imports at :7: addChild, createDraft, saveEntry, setDraftTranscript ...), idempotent
   apps/mobile/src/dev/asha-seed.ts:78    child `Asha`, birthday 214 days back
   apps/mobile/src/lib/store.ts           `saveEntry`, `createDraft`; Find index and sweep run through them (so the book exercises them)
   packages/content/test/no-real-family-data.test.ts   stores only hashes of real names: never add a name to a fixture

6. DATA AND SECURITY: Data classes: none real. Everything is invented text; file names `asha-<n>.jpg`; no EXIF, no location; pictures drawn in code, no face. Seed time is printed as one number. Boundary: privacy rules (CLAUDE.md). Read: privacy. Nothing leaves the phone.

7. LIBRARIES: none (node:crypto, node:fs). `ffmpeg` is a tool on the founder's Mac, not a dependency; videos are skipped with a printed line when absent.
8. BUDGETS: `small` under 2 s [E sandbox]; `book` seeds in under 60 seconds on an SE 3 inside batched transactions [Rec, no source: the number is what the run sheet records]; media about 1 GB (D-04, [E]).

9. ACCEPTANCE: shape per MEASUREMENT-PLAN 3: 1,000 letters over about 5 years (60 to 260 a year, at least 3 a month, one month of 60), 70 percent spoken (3 s tone clip 24 KB), words 20 to 300 with 3 letters of 4,000 words, 10 each in Hindi, Arabic, Chinese,
   300 pictures at 4,032 px (aspect mix), 20 in Recently deleted, 1 hidden book, second book "Rohan" (fictional). Sizes `small`, `book`, `max`. Done also means: the plan hash is pinned and a canary scan finds no content outside the vocabulary.

10. PR BREAKDOWN: PR 1 plan + small seed + test ~250 lines, 4 files; PR 2 media writer ~150 lines, 2 files (after #835 to #840 land); PR 3 the perf-seed loader (with BRIEF BL-929-PERF) | base develop | flag-off proof: no store build imports `asha-perf-seed.ts` (the seam guard search, BRIEF BL-929-PERF).

11. LENSES: A principal-architect, B privacy; mobile reads (apps/mobile/src/dev and test under a qa name).

12. ORDER: PR 1 now. Before BRIEF BL-929-PERF's markers are useful; before the Build 13 "upgrade with a seeded book" sheet row. Pictures after #840. Blocked by the photo stack for PR 2 only.

13. DONE: [ ] `npx vitest run apps/mobile/test/asha-book-plan.test.ts`; [ ] `npm test -w packages/content` (no-real-family-data); [ ] `npm test -w apps/mobile` baseline; [ ] tsc 5 known errors; [ ] ASCII except the Hindi, Arabic and Chinese fixtures (on purpose); [ ] journal #7; [ ] check-in.

14. ONLY A PHONE CAN PROVE: S-01, S-02, S-06, S-07 (Book scroll, Find at 1,000 letters on an SE 3) and the first-launch-after-update time; J-N13; rows in `docs/qa/run-sheets/NS-34-SE3-SPEED.md` (BL-929, not written).

15. STOP AND ASK: the seed would need a store.ts change; video limits (NS-52) are not locked; a script's glyph set needs a font the app does not ship; two failed attempts.

16. HARNESS: journal #7; marker `<!-- journal run:sess-20261120-qa-asha agent:qa -->`; branch qa/asha-seeded-book-generator; labels agent:qa, from:agent.
```
