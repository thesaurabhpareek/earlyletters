<!--
Title: type(scope): outcome in plain words (BL-123). 72 characters max, one id when one exists.
Types: feat fix perf refactor test docs chore. The scope is the area (db, mobile, web, core, api, content, release, ci, agents).
Stacked on another PR? Say so in the first line of the body and name the base.
Prose may be as long as the change needs. Keep the fixed sections below short.
-->

## Summary and why

One sentence on what changed. Then the problem it solves, and the backlog item, requirement and decision ids it serves.

Satisfies:
Data classes touched:

<!-- Agent PRs also keep their Agent: and Mode: lines at the top. -->

## Not verified

Required on every PR. Say what you did not run or could not check. "Nothing" is allowed only with the reason.

## Risk and rollback

One line, required for db, ci and release changes: what could break, and the exact undo. Write "N/A: reason" otherwise.

perf: n/a | checked-by: (test or command) | not-measured

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [ ] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

## The constitution and our rules

- [ ] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words
- [ ] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment
- [ ] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts`; read, play, export, delete, restore and family authorship stay ungated, and capturing and typing never are: only the Keep step of a letter is (D-082)
- [ ] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test
- [ ] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [ ] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [ ] Database changes are a new migration file; no applied migration was edited (the migration guard checks this)
- [ ] The public product name comes only from `packages/brand`

## Screenshots

<!-- UI changes only. Use the Asha fixtures; never a real letter. -->
