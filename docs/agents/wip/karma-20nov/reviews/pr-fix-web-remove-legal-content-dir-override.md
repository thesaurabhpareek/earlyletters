## What and why

BL-778 (CR-60: "before the first deploy of the 0.9.0 pages"). `apps/web/src/lib/legal/documents.ts` let a build-time setting called `LEGAL_CONTENT_DIR` pick the folder the legal texts are read from. Nothing in the repo, no test and no doc used it. The sha256 pins on the 0.9.0 text (`apps/web/test/legal-served.test.ts`, `packages/content/test/legal-beta.test.ts`) run in CI, where nothing sets it; the Vercel build runs no test (`apps/web/vercel.json`). So a setting made only in the hosting project could have swapped the served Terms or Privacy text and no check would have seen it before the post-deploy `curl | sha256sum`.

The override is deleted. The default folder is unchanged: `content/legal` under the web app, or `apps/web/content/legal` when the process starts at the repo root. The committed files, their sha256 pins, the `noindex` behaviour and the bytes the site serves are untouched.

- `apps/web/src/lib/legal/documents.ts`: `contentDir()` no longer reads the environment; a comment says why.
- `apps/web/test/legal-served.test.ts`: a new block "[BL-778]" with two tests. One reads `documents.ts`, `serve.ts` and `versions.ts` and fails if any of them reads the environment (any `process.env`, `process[`, `import.meta.env`, `getenv`), so renaming the override would fail it too. The other checks that the bytes `readLegalSource` returns are the committed files and hash to the pins. The new tests do not spell the old name, so `git grep -F LEGAL_CONTENT_DIR -- apps .github` finds nothing (it exits 1 on this branch).

Satisfies the first and third acceptance lines of BL-778. Not touched: `docs/BACKLOG.md` (BL-778 still reads "ready"; the product manager marks it done) and `docs/agents/cto/RULINGS.md` CR-60, whose sentence "delete or document the override" is a record and stays as written. Remaining mentions of the old name are in those two files only.

**Nothing goes live from this PR.** `apps/web` is deployed from `main`; this change lands on `develop`. It reaches `main` only in the website hotfix PR that CR-60 describes, which is held for the founder's facts. Merging this does not release the CR-60 hold and does not start a deploy.

## How it was checked

- [ ] `npm test` passes (engine, verifier fuzz, entitlements, content rules, analytics, tokens, experiments) (not run at the root; the web workspace and the legal content test were run, see below)
- [ ] `npm run test:db` passes (n/a: no database change)
- [ ] `npm run typecheck` passes, including `apps/mobile` (not run at the root; `tsc --noEmit` in `apps/web` was run)
- [x] New or changed tests name the requirement or rule they prove; no test was deleted or skipped without a reason here

What was run, in `apps/web` unless stated:
- `npx vitest run`: 25 files, 303 passed, 1 skipped (already skipped on `develop`).
- `npx tsc --noEmit`: no output.
- `npx playwright test -c e2e/playwright.config.ts e2e/legal-versions.e2e.ts e2e/pages.e2e.ts` with Chromium at `/opt/pw-browsers/chromium`: 27 passed. This includes both raw `.md` addresses serving the published sha256 from a real `next build`, the `noindex` check on the versioned pages, and `/terms` and `/privacy` staying the website's own pages.
- `packages/content`: `npx vitest run test/legal-beta.test.ts`, 28 passed.
- `git grep -F LEGAL_CONTENT_DIR -- apps .github`: no match.

Mutation: with only `documents.ts` reverted to `develop` (the new tests kept), the new test "the files that locate and read the legal texts never read the environment" fails on `documents.ts`; the other new test passes on both, because nothing sets the variable in the test run (it pins the bytes, it does not exercise the override). With the change, 9 of 9 tests in the file pass.

## The constitution and our rules

- [x] No machine edit bypasses `verifyEdits`; nothing writes, rewrites, summarizes or "shapes" a person's words
- [x] If cleaning behaviour changed, `ENGINE_VERSION` is bumped with a dated comment (n/a: cleaning is untouched)
- [x] Gates use `decide()` or `decideKeepLetter()` (n/a: no gate touched)
- [x] Copy lives in `packages/content` and a failing content rule was fixed in the copy, not the test (n/a: no user-facing words; the served legal text is byte for byte the same)
- [x] No entry text, transcript, audio or child name in analytics, logs or crash reports
- [x] Tests and fixtures use the fictional family "Asha" only; no real family details anywhere
- [x] Database changes are a new migration file; no applied migration was edited (n/a: none)
- [x] The public product name comes only from `packages/brand`

## Screenshots

n/a: no screen changes.

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
