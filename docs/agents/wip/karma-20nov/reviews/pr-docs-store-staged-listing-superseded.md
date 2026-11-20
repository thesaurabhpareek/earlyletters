## What and why

`docs/store/app-store-staged-1.0-proposal.md` is the 28 Oct staged-listing proposal. It still reads like a listing someone could paste from, and it carries claims the live listing dropped. The CMO ruled on 9 Nov 2026 (`cmo.md` section 1, "Staged listing") that it is marked superseded; `store.en.ts` dropped both lines.

This adds a short "Superseded" banner at the top, in the style of `docs/store/listing/apple.md`, and changes nothing else. It names:

- the Description's privacy paragraph, "You can export everything or delete everything, any time, from Settings" (section 3, Description);
- screenshot 6, "Private to your family" (section 5);
- the retired store name "Early Letters: Memory Book" and the retired subtitle "Baby journal in your own voice" (section 1, "Unchanged on purpose").

None of these is in the live source: `packages/content/src/store.en.ts`, `docs/store/app-store.md` and `apps/mobile/store.config.json` (checked by search on `origin/develop` 6cd2223b). The live name and subtitle come from `packages/brand`.

The banner states the three items as "not in the live listing" and says it "says nothing about the app itself": two of the retired claims still appear in the app (the "Private to your family" story card, a delete line in Settings), so it does not call them dead. It carries no line numbers, which would go stale, and one sentence that section 6 (Notes for Review) was written for the first build of D-121 (on-device only, servers off) and should be checked against the build before use. "memory book" in lower case (the descriptor) is the glossary term and is not retired.

No store field, no wording a person reads in the app or the store, and no claim changes. The document is not rewritten.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments)
- [ ] `npm run test:db` passes
- [ ] `npm run typecheck` passes, including `apps/mobile`
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

What I ran: `npx vitest run` in `packages/content` on this branch: 15 files, 367 tests pass. Added lines checked for bytes at 0x80 or above: none. Not run: root `npm test`, `npm run test:db`, typecheck (one markdown file changed; no test reads this file). No other open PR touches the file (checked by file list of the first 100 open PRs).

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (not applicable)
- [x] Gates use `decide()` or `decideKeepLetter()` from `packages/core/src/plan.ts` (not applicable)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (not applicable: documentation only)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file; no applied migration was edited (not applicable)
- [x] The public product name comes only from `packages/brand`

## Screenshots

n/a

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
