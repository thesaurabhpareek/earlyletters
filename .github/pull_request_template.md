## What and why

<!-- One concern per pull request. Link the backlog item (BL-...) and the requirement IDs it serves. -->

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
