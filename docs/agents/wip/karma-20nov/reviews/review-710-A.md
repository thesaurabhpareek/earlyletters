## Review A at fa5d1decedc111a383007bee2bbe434eb0f6033b: PASS WITH NOTES

Lens A (correctness, tests, regressions). PR 710 into develop. The head moved from 0300620374ec70efaefbb2344500e133baa0dc79 to fa5d1decedc111a383007bee2bbe434eb0f6033b (one commit, "say only what the legal-text guard proves"). My first review was complete at 03006203; this one confirms the delta and carries the rest forward. A PASS holds only once required CI is green at this exact head: when I looked, 9 runs were listed, 4 completed/success (web typecheck/test/build, install, applied migrations unchanged, edge functions/ops Deno) and 5 still in progress (typecheck, tests and content rules, database rules, web e2e Chromium, no e2e seam in store bundles). The "required" run was not yet listed. I did not wait for them.

### Delta 03006203..fa5d1dec (read in full)
- `gh api` head sha equals fa5d1dec; parent is 03006203; 2 files, +8 -4: `apps/web/src/lib/legal/documents.ts` (comment on `contentDir()`) and `apps/web/test/legal-served.test.ts` (describe title and a comment). No code line, regex, import or assertion changed. Wording only, as the coordinator said.
- New title: "[BL-778] no environment variable names the folder the legal texts are read from". This now says what the check proves, which fixes my earlier note 1 about the old title overclaiming. The comments say it is a tripwire over three files and that the post-deploy sha256 check (CR-60) is the gate for build command, node options and root directory. That matches what I found: the regex has bypass forms and the hosting build runs no test.
- Added lines contain no non-ASCII character at all (`grep -P '[^\x00-\x7F]'` count 0; no dashes, curly quotes, ellipsis or emoji).
- Whole PR vs merge-base still touches nothing under `docs/legal/**` or `apps/web/content/**` (0 files). `git grep -F LEGAL_CONTENT_DIR -- apps .github` at the new head exits 1.
- `git merge-tree --write-tree origin/develop fa5d1dec`: clean tree (0af0b1e3), no conflicts.

### Re-run at the new head (fresh worktree, `apps/web`)
- `npx vitest run test/legal-served.test.ts test/legal-versions.test.ts`: 2 files, 20 passed (legal-served shows 9 tests).
- Whole web suite `npx vitest run`: 25 files, 303 passed, 1 skipped (same as before).
- `npx tsc --noEmit`: exit 0, no output.
- sha256 of `content/legal/{terms,privacy}/0.9.0.md` is dfa303a7...6af1 and 4ec16856...cfe4, the pinned values.
- Not re-run: the merge-base mutation and the real `next build` (the code lines are byte-identical to 03006203, where I ran both and they gave the results in my earlier review: the env-read test fails on the old `documents.ts`; the built raw files hash to the pins even with the old variable set to a tampered folder).

### Findings
Must-fix: none.

Notes carried forward (none blocks merge):
1. `legal-served.test.ts` env-read regex still misses `const { env } = process;`, `import { env } from 'node:process'` and `require('process').env`, and does not scan the route files or `LegalDocument.tsx`. The new wording is honest about this (tripwire, three files); hardening is optional.
2. The second new test (bytes equal the committed files) is mostly covered by the existing BL-565 hash test and cannot fail unless the variable is set. Harmless.
3. Stale comment, not this PR: `.github/workflows/web.yml` (lines 18, 29) and `web-e2e.yml:20` say the pages are rendered from `docs/legal/**`; the site reads `apps/web/content/legal`.
4. CR-60's post-deploy checks (two `curl | sha256sum`, `x-robots-tag`, phone check of both pages) still apply and are the gate the new comments point to. The mobile DEVICE_TEST_PLAN has no step for this web change.

### Not verified
- Final CI result at fa5d1dec (several runs in progress when I looked).
- Behaviour on real Vercel; local Playwright e2e; the repo-root `npm test` for other workspaces.

Reviewer: independent of the author (CR-44).
