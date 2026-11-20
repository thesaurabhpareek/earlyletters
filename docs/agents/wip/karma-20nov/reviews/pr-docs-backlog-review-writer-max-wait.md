## What and why

One backlog row, BL-816, in `docs/BACKLOG.md` only. No code, no `docs/prd`, no `docs/qa`, no decision entry. This body covers the row as revised after Review B (CHANGES) and Review A (PASS WITH NOTES) on #727.

Review's writer for the person's own words, `reviewWriter().text()` in `apps/mobile/src/lib/capture/review-persist.logic.ts`, is a pure 300 ms debounce: every change stops the timer and starts a new one. It is the shape Write's autosave had before #725 (e5cc7ecd; `docs/design/screens/WRITE.md` section 11 item 7). A burst of editing in Change words with no 300 ms gap writes nothing until the burst ends, so a crash, an OS kill of the foreground app, a flat battery or a force restart in the middle loses the whole burst, not "at most the keystrokes of the last 300 ms" as the comment on the constant says.

Requirement ids served: F06-REQ-036 (P0: any change in Review is written to the draft within 500 ms; 100 of 100 kills reopen with the same text; also `docs/prd/v2/06-nfr.md:190`), F04-REQ-011, RT-WRT-05, RT-REV-02, RT-REV-07.

## Severity is a release gate, and the call is the founder's

The row's Severity field now reads `S1 proposed (S0 by the legend until ruled)`.

- The legend of the 1 Nov audit section puts anything that can lose a word at S0. F06-REQ-036 is P0, its acceptance is "100 of 100 kills reopen with the same text", and a burst of editing in Review breaks that today.
- `docs/ops/RELEASE.md` 5.4 and TF-09 say C0 to C1 needs no open S0, and only the submission step needs no open S0 or S1. So S0 versus S1 decides whether the families' next step waits for this fix. That is release scope: the founder decides, with the CPO recommending. The row no longer says the CPO sets the severity or that nobody must rule.
- **Karma's recommendation:** S1 for the next TestFlight build, because the loss needs a crash, a kill or a power loss inside an unbroken burst (a pause of 300 ms or more flushes, which ordinary typing usually has; not measured), every graceful exit flushes first, and only that session's edits on top of saved words are at risk; fixed before the 1 Dec submission; subject to the founder.
- The earlier line "same reasoning as BL-775" is withdrawn. BL-775's S1 rested on a CCO-6 ruling that it is not blocking and on an on-screen failed line that warns the person. This loss is silent and no ruling covers it.

## What the revision changed in the row

- **Retry.** `setDraftReview` returns false for a draft in `recording` or `discarding`, a missing draft or an empty base (`drafts.ts:261-286`). The row says false is a refusal, not a failure, and is not retried; a throw is retried only at the next change, Done, Close or the unmount, so no timer re-arms itself and a draft that is gone cannot loop.
- **Cancel.** With a second timer, `cancel` must clear both and `flush` must leave none. `review.tsx` never calls `cancel`; only `store.review-v9.test.ts:188` does, so the row asks for a case beside it.
- **Labels.** Every acceptance line starts "Maximum wait" or "Retry after a throw", so one half can be rejected. One row stays: same function, same invariant (the newest words reach the draft), and two PRs would both edit `flush` and the timer. Split only if the code PR passes the 400-line guide (CODE-R01).
- **Done means done in code** until the written Review device step is walked. RT-REV-02 and RT-REV-07 stay `gap`. The row and its Satisfies line now agree: the replay test's header names both ids, and the catalog lists no evidence for RT-REV-07.
- **The bound is the owner's call.** 300 ms and 500 ms both meet the P0 ceiling of 500 ms. Each mid-burst write is a synchronous SQLite write while the person types, and Write's is 500 ms, so the owner states the cost they measured and prefers 500 unless 300 is justified.
- **Dispatch.** The dispatcher takes the first eligible task in file order with no severity ordering (`scripts/agents/dispatch.mjs:332`). I counted the `mobile` queue with `eligibility()`: BL-816 is position 46 of 46 (the first is BL-355). If it must land before outside testers, Karma assigns it to a mobile session directly or the row moves up the file. Mode stays `agent`.
- **BL-377** is named in Extends only as stale: it still reads ready with Depends on BL-148 although #522 cites it. Not changed here.
- **Stale comments** to fix with the change: the header of `review-persist.logic.ts` cites `test/review-persist.test.ts`, which does not exist; and the comment above the constant.
- The first-person scratch experiment is moved out of the row, into the next section.

## What I read and ran myself (develop at c350be3e)

- Review's edits do go through the writer: `review.tsx:981` (`onChangeText={setUserText}`) to `:321-325` (`writer.text`) to `:306-308` (`setDraftReview`) to `drafts.setReview` writing `review_text`. That is the only autosave of those words, and it is silent: no autosave line or announcement exists in Review, so nothing needs keeping quiet mid-burst. The row says the fix must add none.
- The 300 ms is the quiet window the file puts under F04-REQ-011's 500 ms. #522 (34f848b7) added it; I found no recorded reason for 300.
- Flush paths, all writing the newest words first: AppState not active (`:311-313`), unmount (`:314-317`), Done (`:327-329`), Close (`:886-889`), Keep (`:539`); `review-persist.wiring.test.ts` pins them.
- No catalog row names Review's writer. RT-WRT-05 names `write-autosave.test.ts` and S1-36, both Write's; RT-REV-02 and RT-REV-07 are `gap` (`scripts/qa/release-catalog.rows.mjs:94`, `:99`).
- **Scratch experiment (reverted; nothing but `docs/BACKLOG.md` is in this PR):** I added a maximum-wait timer to the writer in a scratch copy. `review-persist.replay.test.ts` then failed at seed 40, because its `durableText` moves only after quiet and so counts a whole burst as lost; `store.review-v9.test.ts` still passed. So the replay model must change with the fix.
- **Throwaway test (deleted):** a change every 100 ms for 3 s writes zero times; a write that throws is not retried by `flush`, because `flush` clears `pending` first, although the comment in `safe` says it is.

## PRD rewording is a proposal for the CPO, not made here

F04-REQ-011 (`F04-capture.md:319`) and `06-nfr.md:59` still say "written 500 ms after the last keystroke", the debounce #725 fixed in Write. The bound that holds is the second sentence of F04-REQ-011 and `06-nfr.md:189`: at most the last 500 ms of typing lost. Proposed wording for the CPO: "written at least every 500 ms while typing, and at once on `inactive` or `background`". `docs/prd` is not edited (OPERATING_MODEL section 8).

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here (no tests changed)

Run on this branch after merging `develop` at e5ecc5f8 (docs only):
- `node scripts/agents/check.mjs`: agent team is consistent (397 backlog tasks).
- `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs`: 170 pass, 0 fail.
- `node scripts/trace.mjs --no-write`: 838 defined, 773 P0, 10 cited but undefined, the same as `develop`; five of those (F05-REQ-052 and 053, F09-REQ-034 and 038, F20-REQ-022) are cited by #715's merged text and wait for #726. This row adds none.
- `packages/content` vitest: 15 files, 367 pass.
- `eligibility()` on BL-816: ok; status ready, mode agent, owner `mobile engineer`, no Depends on.
- Added lines grepped for bytes of 0x80 and above and for three-dot runs: none. Only Asha is named. Nothing under `docs/prd`, `docs/legal`, `docs/qa` or `apps/`.
- Both reviews ran trial merges (develop, #707, #726, #638, #684, #664, #685) and found them clean; I did not repeat them for the revision, which changes only the row's text.

Not verified: nothing has run on a phone; the loss is read from code and shown with fake timers. I did not run `id-collisions.mjs` live for the revision (about 150 API calls, timed out earlier); Review A ran it and found no collision for BL-816, and `next-id.mjs` counts BL-816 as taken. I did not re-run the 100 seeded replay runs with a correct fixed writer, only showed that a naive one fails them. The queue position (46 of 46) is from the file as of 9 Nov and will drift.

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words (docs only; the row's fix stores the person's own words earlier and changes none)
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (not applicable)
- [x] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts` (not applicable)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (no copy)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file; no applied migration was edited (none touched)
- [x] The public product name comes only from `packages/brand`

PROPOSED WORDING: none. The row adds no user-facing word.

Rulings wanted: the founder, whether this gates C0 to C1 (S0) or waits for the 1 Dec submission (S1), with the CPO recommending; the CPO, the F04-REQ-011 and `06-nfr.md` rewording; the mobile owner, the bound (300 or 500 ms) with the measured cost.

Id note: BL-816 is free (not on `develop`, and Review A found it in no other open PR). Open draft #707 still defines BL-775 to BL-783, which `develop` already holds (since #692, #693 and #694); #715 recommended that #707 renumber that block. Whoever renumbers must start at BL-817 or later, because `next-id.mjs` counts BL-816 as taken once this PR is pushed. #707 is unchanged at 8f24cc04 and has not said it will.

## Screenshots

n/a (docs only)

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
