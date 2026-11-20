**BL-565 (S0, COMP-01), website side.** This is the website half of #616's "For the website lane" steps 1 to 3, plus the test part of step 6. Not a merge request: the founder merges docs/legal; this carries the website side.

## Founder decision (8 Nov 2026): versioned URLs only
The 0.9.0 Terms and Privacy Policy are published **only** at `/legal/terms/0.9.0` and `/legal/privacy/0.9.0` (and the raw `.md` of each). **The live `/terms` and `/privacy` stay the website's own pages, unchanged.** This replaces the first version of this PR, which made `/terms` and `/privacy` render the markdown.

**Do not let this reach `main` until the founder has merged #616 and confirmed the facts listed at the end of #616's body.** The site deploys from `main` on Vercel, so merging this into `develop` deploys nothing.

## What a visitor sees after a deploy
- **`/terms` and `/privacy`: nothing changes.** Same words, same "Last updated" date, same footer links, same sitemap entries and dates. `git diff origin/develop` is empty for `terms-copy.ts`, `privacy-copy.ts`, `types.ts`, `publisher.ts`, `pages.ts`, `legal-copy.ts`, `LegalPage.tsx`, `Legal.module.css`, the two page files, `e2e/pages.e2e.ts`, `e2e/support/legal.ts`, `test/legal.test.ts` and `claims-capabilities.test.ts`.
- **Two new pages:** `/legal/terms/0.9.0` ("Early Letters Terms of Service (test version)") and `/legal/privacy/0.9.0`, each with "Version 0.9.0, a test version." under the title, the frontmatter hidden, and tables as tables.
- **Two new raw files:** `/legal/terms/0.9.0.md` and `/legal/privacy/0.9.0.md`, as `text/markdown; charset=utf-8`, byte for byte. The raw file **keeps its frontmatter**, so anyone can read `status: draft-for-counsel`, the `review:` line and `source: docs/legal/...` there (see "Frontmatter" below).
- **Sitemap and search:** the versioned pages are not in the sitemap, say `noindex, nofollow` in the page, and the raw `.md` files send `X-Robots-Tag: noindex, nofollow` (a header only, so the bytes and the sha256 are unchanged). They are test texts for the app's testers, not the site's policy (review B2, 8 Nov). `/`, `/privacy` and `/terms` are listed as before.
- Footer, home page, other pages, headers and CSP: unchanged.

## What changed since the reviews (head `fcadeb17`, two reviewers, CHANGES)
- **Versioned only.** Restored from `develop`: `terms-copy.ts`, `privacy-copy.ts`, `types.ts`, `publisher.ts`, `pages.ts`, `legal-copy.ts`, `LegalPage.tsx`, `Legal.module.css`, `sitemap.ts` (code identical to develop; only its header comment now says the versioned pages are unlisted), `e2e/pages.e2e.ts`, `e2e/support/legal.ts`, `test/legal.test.ts`, and the one line in `packages/content/test/claims-capabilities.test.ts`.
- **The red CI check (both reviewers' must-fix 1) is gone by construction.** The `ViewTransition ... aborted` page error came from a test that clicked a link inside `/terms`, which is no longer touched. The new test for the link from the 0.9.0 Terms to the 0.9.0 Privacy Policy checks the link's `href` and opens it by address, with a comment saying why.
- **Review B finding 2 (the email-list promises missing from the 0.9.0 Privacy Policy) and 3 (list subscribers bound by app Terms) no longer apply:** `/privacy` and `/terms` keep their own words. The 0.9.0 texts are read only by people who open the versioned address.
- **Texts updated** to the #616 files after its review fixes (new hashes below). The copy in `apps/web/content/legal/` is byte-identical to `docs/legal/beta/` in #616 at its new head.
- **New code, small:** `lib/legal/versions.ts` (page data for a version), `components/site/LegalDocument.tsx` and `LegalDocument.module.css` (the page and its table styles). `documents.ts` and `serve.ts` are as before, minus the "current version".
- `WEBSITE_RUNBOOK.md` lines 67, 73, 89 and 422 (the reviewers' nit) are **not stale any more**, because `privacy-copy.ts`, `terms-copy.ts` and `PUBLISHER_LEGAL_NAME` are kept. Not changed.

## The hashes
| document | sha256 of the bytes served at `/legal/<doc>/0.9.0.md` |
|---|---|
| terms | `dfa303a731edd0fe5a68e05157587e260b00ea55b286cd57512156d0da0e6af1` |
| privacy | `4ec16856b2527cfdc7987f7cb8018fd1ab095b4ecf6093d0fcfcecf4f990cfe4` |

Old values (first push): terms `8da3bd2c...`, privacy `bcfd0603...`. Checked with `sha256sum` on the files copied from the #616 worktree; `cmp` says identical. They match `packages/content/test/legal-beta.test.ts` in #616.

## Frontmatter
The raw `.md` is served with its frontmatter because the hash covers the whole file (POLICY_VERSIONING 7.2 and 9.2; `legal-beta.test.ts` hashes the file; the web copy is pinned byte for byte). Serving the body only would change the bytes and so the hash, and the pins in #616 and here. So it is kept. What it exposes: `status: draft-for-counsel`, `review: ... Written without legal review ...`, and `source: docs/legal/terms-of-service.md 4.1.0, ...` (an internal path). The founder can remove the `source:` and `status:` lines in #616 (then re-hash) if he does not want them public; the HTML pages do not show them.

## Tests
- `apps/web/test/legal-versions.test.ts` (new, 11 tests): the two documents and their addresses; **`/terms` and `/privacy` do not import the versioned texts** (the decision, pinned); the title, the version line and no frontmatter in the HTML; tables and links; the changelog date; ASCII and one final newline; no internal references; the publisher cannot be changed by a build variable; the sound sentence, and the email-list, unsubscribe, IP and no-cookies sentences, checked against `src/lib/notify` and `AmbientSound.tsx`.
- `apps/web/test/legal-served.test.ts` (7 tests): the file on disk and the response of the `.md` handler hash to the two values above; content type exactly `text/markdown; charset=utf-8`; no carriage returns; one final newline.
- `apps/web/e2e/legal-versions.e2e.ts` (new): both versioned pages (one h1, the version line, every section, way home, footer, canonical to itself, noindex), no counsel mark or frontmatter in the HTML, the raw files' content type and sha256, the providers table, the Terms to Privacy link, 404 for other versions, and **`/terms` and `/privacy` still the website's own pages** (a "Last updated" line, no version line, no link to the 0.9.0 text).
- `apps/web/e2e/http.e2e.ts`: the sitemap lists `/`, `/privacy` and `/terms` only and nothing under `/legal/`. `e2e/support/pages.ts`: the versioned pages join the sweeps (health, a11y, links, headers).

What I ran, from the worktree:
- `cd apps/web && npx tsc --noEmit` and `npx vitest run`.
- `cd apps/web && npx playwright test -c e2e/playwright.config.ts` (builds the site, Chromium at `/opt/pw-browsers/chromium`).
- `cd packages/content && npx vitest run`.

Results:
- `tsc --noEmit` in `apps/web`: clean. `npx vitest run` in `apps/web`: 25 files, 301 passed, 1 skipped.
- Web e2e, full suite: **275 passed, exit 0** (3.3 minutes). The first run had 274 passed and 1 failed: my own new sitemap assertion expected the `<lastmod>` on the same line as `<loc>`; the output was right, the assertion was fixed, and the whole suite was run again.
- `packages/content` `npx vitest run` on this branch: 12 files, 280 passed. (#616's `legal-beta.test.ts` lives in #616: 13 files, 308 passed there.)
- Mutations: one space appended to `content/legal/terms/0.9.0.md` made 2 tests in `legal-served.test.ts` fail (restored, `cmp` identical to #616). Putting this PR's earlier `LegalPage.tsx` and `pages.ts` (which rendered the markdown at `/terms`) back made the "`/terms` and `/privacy` do not read the versioned texts" test fail (restored).
- This branch is cut from `develop` at `d07bb216`; `develop` has no change under `apps/web` since.

Not run: mobile tests, db tests, functions tests, `npm test` at the repo root (no mobile, SQL or function code changed).

## Not verified, and things to know
- **Production serving.** I checked the response from the handler and from a local production build. I did not check Vercel itself, so before `policy_versions` rows go in, run `curl -sS https://earlyletters.com/legal/terms/0.9.0.md | sha256sum` and the same for privacy (#616 step 6).
- **The build 2 consent sheet links to `/terms` and `/privacy`**, not to the versioned pages (`brand.web.terms`, `brand.web.privacy`). With versioned-only publishing, a tester who agrees records `terms 0.9.0` after reading the website's own page, not the 0.9.0 text. See #616 "Consent". Not decided here.
- **The claims checker does not read the legal markdown.** `packages/content/test/support/web-strings.ts` reads TypeScript strings under `apps/web/src`. Unchanged by this PR now that `/terms` and `/privacy` are TypeScript again.
- **The versioned pages are noindex and unlisted** (changed after review B2). They still carry a canonical to themselves. They are reachable by address only. Revisit at 1.0.0, when counsel has approved the text.
- **Internet Archive snapshots** (#616 step 5) are not requested; they need the pages live.
- `scripts/guards/docs-leak-guard.mjs` (not wired into CI) would list the two `content/legal` paths and the raw `.md`.
- Downgrade: Vercel Instant Rollback, or a revert PR. Either way `/legal/*/0.9.0` and the `.md` go back to 404, so any `policy_versions` row then points at a dead URL; `/terms` and `/privacy` are never affected.
- Not legal advice, and no legal review. Every reading stays "counsel must confirm" as in #616.

## Second round of reviews (8 Nov, after 01916a7b)

Review A2 at 01916a7b: PASS WITH NOTES. Review B2 at 01916a7b: CHANGES. Done in the next commit:

- Sitemap lines for the two versioned pages removed (and their e2e lines); `robots: { index: false, follow: false }` in `legalDocumentMetadata`; `X-Robots-Tag: noindex, nofollow` on the raw `.md` response, with tests. The privacy copy is re-copied from #616 (its A2 review found one false sentence in Privacy 7); the privacy hash is now `4ec16856b2527cfdc7987f7cb8018fd1ab095b4ecf6093d0fcfcecf4f990cfe4`, pinned in `legal-served.test.ts` and `e2e/legal-versions.e2e.ts`, and `cmp` shows the copies byte-identical to #616.
- A2 note 1: the "floating pages do not read the versioned texts" scan now also catches relative imports (`./documents`, `./versions`).
- Web vitest 25 files, 301 passed, 1 skipped; web e2e full suite 275 passed, exit 0; `tsc --noEmit` clean.

What a visitor can find that disagrees with the live site (review B2): two documents now claim the website. The live `/terms` and `/privacy` do, and so do the 0.9.0 texts (Terms 1.2 and 1.3, the Privacy opening). The live home page, the welcome email and the film scene say "none of it is sent to us", while 0.9.0 Privacy 2 and 3 say letters sync to the test server. With noindex and no sitemap entry, a visitor reaches the versioned pages only by a link. Which document governs a visitor or list subscriber is a counsel question.

BL-565's first acceptance line (a tester who opens Terms from the consent sheet sees the app text) is not met by versioned-only publishing: build 2's sheet opens `/terms` and `/privacy`. A later build has to link the versioned URLs (PR #635 records 4.1.0 and 3.0.0 today and has to become 0.9.0).

Approvals missing before anything reaches `main` (nothing mechanical stops a deploy, so the hold is a rule, recorded as CR-60 in `docs/agents/cto/RULINGS.md`: this PR merges to `develop` only, `apps/web` deploys from `main`, and no develop-to-main release PR is opened until these approvals exist): the founder's confirmation of the facts in #616; counsel (POLICY_VERSIONING.md line 7 names counsel as approver, D-138 item 1 is a founder waiver); a recorded decision, because "versioned only" (8 Nov) lives only in these two PR bodies.

Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
