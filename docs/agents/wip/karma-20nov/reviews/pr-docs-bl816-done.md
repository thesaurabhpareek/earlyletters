## What and why

Docs only, after #750 merged (fc7c0afb). Revised after Review B of this PR (CHANGES at e6c6423f): the first version said both reviews of #750 ruled one timer equivalent to two; only Review B of #750 accepted it, and it found the writes match only while no write throws.

- `docs/BACKLOG.md`, BL-816: Status moves from `ready` to `done in code (#750, fc7c0afb, merged 10 Nov 2026)`. The row's own rule says it is done in code when the fix and its tests merge, and the phone check stays open. The status text now says, in this order: it has not run on a phone; it is in no TestFlight build yet (the last successful `testflight.yml` runs I found are from d26335da on 8 Nov, which still has the old writer); severity is still unruled and is the founder's call, and moving the row to done in code neither rules on it nor clears it; S1-166 has not been run (as of 10 Nov); then the differences from the row as built: 300 ms chosen for margin under 500 ms and not from a phone measurement; one timer, accepted by Review B of #750 with the failure-path difference stated (after a throw the words wait for the next change or flush instead of one retry on a timer); RT-REV-02 and RT-REV-07 `partial`, accepted by Review B of #750 too; the new cases are in `review-writer-autosave.test.ts` (24 cases, 9 fail on the old logic, 15 pin behaviour that must not change); S1-166 (c) checks the recording only. The two present-tense lines in the row ("breaks today", "not met in a burst") are now past tense ("before #750"), and the Satisfies sentence about the catalog is dated to 9 Nov, before #750 made RT-REV-02 and RT-REV-07 `partial`. The status does not say which installed builds have the loss: I did not check whether either successful run reached testers, or whether a build was cut by hand.
- `docs/qa/DEVICE_TEST_PLAN.md`, S1-166: (c) says what the Node tests check (`review-writer-autosave.test.ts:127`, and for 100 seeds `review-persist.replay.test.ts`); Needs says a build must be cut from develop at or after fc7c0afb; the heading and Needs no longer name the deleted branch.

Requirement ids served: F06-REQ-036, F04-REQ-011, RT-REV-02, RT-REV-07 (no change to their status here).

No code, no `docs/prd`, no `docs/legal`, no decision entry. BL-816's severity (S1 proposed, S0 by the legend until ruled) is not touched.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here (no tests changed)

Run on this branch (docs only): `node scripts/agents/check.mjs` consistent (397 tasks); `node --test scripts/agents/*.test.mjs scripts/trace.test.mjs` 170 pass, 0 fail; `node scripts/qa/release-catalog.mjs --check` exit 0; `parseBacklog` reads BL-816 as status `done`, owner `mobile engineer`, mode `agent` (it read `ready` before); added lines have no bytes of 0x80 and above.

Not verified: nothing has run on a phone; I read `testflight.yml` run history only, so a build cut by hand outside the workflow would not show; the claim that d26335da has the old writer is Review B's reading of that commit.

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words (docs only)
- [x] Copy lives in `packages/content` (no copy)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only
- [x] Database changes are a new migration file (none)

PROPOSED WORDING: none.

## Screenshots

n/a (docs only)

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
