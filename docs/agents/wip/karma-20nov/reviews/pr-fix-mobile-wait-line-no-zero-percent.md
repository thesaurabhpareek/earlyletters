## What and why

The founder's TestFlight build 1 complaint, second half. #626 stopped the first-run card from saying "Getting ready, 0%", but every other surface that turns a download fraction into words still rounded down on its own and could print "0%" during the first percent: the Book and Review wait lines, the letter page, and the two Settings language rows.

One shared helper, `downloadingLine` in `apps/mobile/src/lib/models/speech-download.logic.ts`, built on `shownPercent` (which already returns null below 1% and caps at 99):

- below 1%: the existing `packsCopy.phases.downloading` text, "Downloading", with no number
- from 1%: the existing "Getting ready, n%" line (or "Downloading, n%" on the Spoken language row), as before
- never 100% before it is done; a negative or not-a-number fraction reads "Downloading"

Surfaces now using it (no new copy):

| Surface | File |
|---|---|
| First-run card (was inline; same output) | `components/speech/speech-consent-card.logic.ts` |
| Book waiting card reason | `app/(tabs)/book.tsx` |
| Review downloading card note | `components/capture/words-state.logic.ts` |
| Letter page waiting card reason | `app/letter/[id].tsx` (found in the audit, not in the brief) |
| Settings > Storage language row (`speechRow`) | `components/settings/recordings.logic.ts` |
| Settings > Spoken language row (`statusText`) | `components/language/language-row.tsx` |

The Storage row's ring keeps drawing from the whole percent and has no number on it. Its old test pinned "Getting ready, 100%" for a fraction of 1.7 under a comment saying never 100% before done; it now reads 99%, which is what the comment and the first-run card already said.

Deliberately left alone: the progress bars' VoiceOver value in `review.tsx` (`ProgressLine`, shared with the transcription parts bar) and `settings/storage.tsx` (`ProgressBar`) still announce their rounded number; they print no words. A follow-up can mirror the first-run card (no value below 1%).

`docs/qa/DEVICE_TEST_PLAN.md`: S1-15a no longer excuses Book and Review ("never 0%"); S1-15b step 6 drops the known gap and says Book and Review show "Downloading" below 1%, then "Getting ready, n%".

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile` (not run as the root script; see below for `apps/mobile` alone)
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

What was run: `cd apps/mobile && npx tsc --noEmit` (only the known local errors: `expo-clipboard` and `expo-local-authentication` are not installed in this checkout) and `cd apps/mobile && npx vitest run` (4109 tests). New file `test/download-wait-line.test.ts` (15 tests: the helper, Review card, Storage row, Spoken language row, first-run card, Book and letter page in source, and a scan that every line filling a percent copy goes through `downloadingLine`). `test/settings-p6b.test.ts` updated (1.7 now 99%, -0.2 now "Downloading", plus 0.004 and 0.01).

Mutation: with only `src/` reverted, 12 of the new and changed tests fail; with only the six site changes reverted (helper kept), 8 fail (Review, Storage row, Spoken language row, Book, letter page, the scan, and the updated settings test). All pass with the change.

The full `apps/mobile` run has 61 failures in 7 files (`config`, `privacy-manifest`, `capabilities`, `licences`, `preflight-production`, `app-lock-wiring`, `hosting-ios17`); the same 61 fail on `origin/develop` without this change (expo config, a missing native module and a duplicated pack key in `packages/api/src/keys.ts`), so they are not from this PR.

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (n/a: cleaning is untouched)
- [x] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts`; read, play, export, delete, restore and family authorship stay ungated, and capturing and typing never are: only the Keep step of a letter is (D-082) (n/a: no gate touched)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (no new copy; existing strings only)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file; no applied migration was edited (n/a: none)
- [x] The public product name comes only from `packages/brand`

## Screenshots

n/a (no layout change; the line reads "Downloading" instead of "Getting ready, 0%" for the first percent)

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
