## Review B at fa5d1decedc111a383007bee2bbe434eb0f6033b: PASS WITH NOTES

Lens B (rules, public claims, security and supply chain, process) for PR 710, "fix(web): remove the build-time override of the legal text folder" (BL-778, CR-60). This replaces my review of 0300620374ec70efaefbb2344500e133baa0dc79. The head is now fa5d1dec, one commit on 03006203 ("fix(web): say only what the legal-text guard proves"). `gh api` returned fa5d1decedc111a383007bee2bbe434eb0f6033b. Reviewed in a detached worktree; the main checkout was not touched.

### The delta (re-read in full)
2 files, +8 -4, wording only, and it is exactly my note 2:
- `apps/web/test/legal-served.test.ts`: the describe title now reads "[BL-778] no environment variable names the folder the legal texts are read from". The inline comment says the files "take no input from the environment" and calls the guard "a tripwire over three files, not a proof", naming the sha256 check after a deploy (CR-60) as the gate for the build command, node options and root directory.
- `apps/web/src/lib/legal/documents.ts` (comment above `contentDir()`): "No environment variable names it (BL-778) ... The build command, node options and root directory are not covered by this: the check after a deploy (the sha256 of the two raw files, CR-60) is the gate for those."
- No code line changed. `contentDir()` is byte for byte what I reviewed: cwd only, no environment read.

Is the new wording true? Yes, each claim is something I checked.
- "No environment variable names it": `contentDir()` reads `process.cwd()` and `statSync` only; `serve.ts`, `versions.ts`, `origin.ts` and the two routes read no environment (read last round, unchanged in this delta).
- "a variable set only in the hosting project could point the site at another folder without any test seeing it": that was the old behaviour, run last round (old source plus a variable made both new tests and 2 existing pins fail; CI and the Vercel build would not have set it).
- "tripwire over three files, not a proof": matches the test, which scans `documents.ts`, `serve.ts` and `versions.ts` with one regex.
- The build command (`apps/web/vercel.json` sets only `installCommand`), node options and root directory can still change what is built; CR-60 names the post-deploy `curl | sha256sum` as the check. Accurate.

### What I ran at fa5d1dec
- `apps/web`: `npx vitest run test/legal-served.test.ts`, 9 of 9 passed. Full `npx vitest run`: 25 files, 303 passed, 1 skipped (same as before). `npx tsc --noEmit` exit 0.
- `git grep -n -F LEGAL_CONTENT_DIR -- apps .github`: no match, exit 1.
- Non-ASCII characters in the delta: none (no em or en dash, curly quote, ellipsis or emoji). The new commit message has none and carries both trailers.
- Whole PR vs develop (merge base 6cd2223b, develop has not moved): still only `documents.ts` and `legal-served.test.ts`. Nothing under `docs/legal`, no route, no sitemap, no copy file, so no new words reach the public site. The served files still hash to dfa303a7 (terms) and 4ec16856 (privacy), the pins.
- `git merge-tree --write-tree` against develop: clean, exit 0.

### Must-fix
None.

### Notes (carried, not blocking)
1. The guard is still a text scan of three files and misses `import { env } from 'node:process'`, `const { env } = process` and a new helper module that `documents.ts` imports (I ran the regex on samples last round). The new wording now says so ("tripwire, not a proof"), so the test no longer claims more than it proves. A Proxy on `process.env` during `readLegalSource` would be the stronger check; optional.
2. My earlier notes 3 (add `git grep -F LEGAL_CONTENT_DIR -- apps .github`, expect exit 1, to the CR-60 hotfix steps so the main-bound website hotfix carries this commit) and 4 (close BL-778 at `docs/BACKLOG.md`) are, per the coordinator, for the records PR and are left out of this PR on purpose. That is fine for this PR; they still need to land before the website hotfix is cut.
- Nit: the second new test is redundant with the existing pins; harmless.

### CI at this head (seen at the time of writing)
9 check runs. Completed success: web (typecheck, test, build), edge functions and ops scripts, applied migrations unchanged, install. In progress, not yet a result: typecheck, tests and content rules, database rules, no e2e seam in store bundles, web e2e (Chromium). The `required` aggregate has not reported yet. `compliance-fence` again ended `startup_failure` (workflow run 42658403710), the same repo-wide startup failure seen on every recent PR, so `mergeable_state` is "blocked" for that reason; I did not run the fence, and nothing this PR touches is named in `compliance/FENCE.json`. A PASS holds only once required CI, including compliance-fence, is green at this exact head.

### Not verified
- Playwright e2e locally and a local `next build` (CI web job is green at this head; web e2e still running).
- Root `npm test`, `npm run test:db`, mobile typecheck (not touched by this change; CI still running).
- Vercel dashboard settings (whether any project ever had the variable set); moot once the line is gone.
- compliance-fence verdict (it never started).

Reviewer: independent of the author (CR-44).
