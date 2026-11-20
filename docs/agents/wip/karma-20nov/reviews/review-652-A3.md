## Review A at 3fd7205dde273a6c044062aa11643695b82b427a: PASS WITH NOTES

PR 652 (draft, base develop), head confirmed with gh api at start and at the end (3fd7205dde273a6c044062aa11643695b82b427a, one commit on 01916a7b). Delta review of A2 (PASS WITH NOTES at 01916a7b). No must-fix. A2 notes 1 and 3 are fixed; note 2 stays (below). A PASS holds only with required CI green at this exact head; it is.

### The delta, read in full (`git diff 01916a7b 3fd7205d`, 8 files, +18 -19)
- sitemap.ts: the two versioned entries and the versions import removed; the file's code is now what develop has (header comment only differs). http.e2e.ts: asserts locs are exactly home, /privacy, /terms and that the XML does not contain `/legal/`.
- LegalDocument.tsx:22-23: `robots: { index: false, follow: false }`. serve.ts:14-15: `X-Robots-Tag: noindex, nofollow` on the raw response; headers only, bytes untouched.
- privacy/0.9.0.md: one bullet (a letter's deletion: "In the first test build you can also erase it at once. The second test build does not offer that yet."). terms md untouched. Pins: privacy sha256 now 4ec16856... in legal-served.test.ts:20 and e2e/legal-versions.e2e.ts:19.
- legal-versions.test.ts:49: scan regex now also matches `./documents` and `./versions`. http.e2e.ts: unused legalVersionPage import removed. No non-ASCII, dash, curly quote or ellipsis in the delta or either md.

### Verified at this head
1. Head and refs: #616 ref docs/legal-bl-565-beta-policies is 3bea8e56f9721bee7e33de5f3598e0468ff4cf21 (open, draft), checked at start and end; develop caba0215.
2. Bytes: `git show <#616 ref>:docs/legal/beta/{terms,privacy}-0.9.0.md` against apps/web/content/legal/<doc>/0.9.0.md (file and git blob): `cmp` identical for both. sha256 terms dfa303a731edd0fe5a68e05157587e260b00ea55b286cd57512156d0da0e6af1, privacy 4ec16856b2527cfdc7987f7cb8018fd1ab095b4ecf6093d0fcfcecf4f990cfe4; equal to the constants in the two web tests and to #616's legal-beta.test.ts:21-22. No CR bytes. #616's own delta fb65fe0d to 3bea8e56 is that one bullet plus its pin.
3. Built site, local `next start` of the e2e build: both versioned pages carry `<meta name="robots" content="noindex, nofollow"/>` and a self canonical; /terms, /privacy and home carry no robots meta. Both .md answer 200, `text/markdown; charset=utf-8`, `x-robots-tag: noindex, nofollow`, content-length 13938 (terms) and 15221 (privacy); the HTML routes send no X-Robots-Tag (meta only, as intended). `curl | sha256sum` of both .md equals the two pins. CSP, HSTS, nosniff present and unchanged on all routes. robots.txt unchanged and does not Disallow /legal, which is right: noindex only works if crawlers may fetch the page.
4. Sitemap: built sitemap.xml and the response over HTTP list only `https://earlyletters.com`, `/privacy` (2026-11-01), `/terms` (2026-10-16). The built sitemap.xml.body is identical to a develop build's.
5. Floating pages unchanged: `git diff origin/develop 3fd7205d` is empty for terms-copy.ts, privacy-copy.ts, types.ts, publisher.ts, pages.ts, legal-copy.ts, LegalPage.tsx, Legal.module.css, the two page files, layout, e2e/pages.e2e.ts, e2e/support/legal.ts, test/legal.test.ts, package.json, next.config.ts, vercel.json. Built output: I built develop and the head the same way and compared all 22 HTML pages outside /legal in both site modes (coming-soon, film): 22 of 22 identical in each after normalising chunk names and build id; terms.meta, privacy.meta, index.meta, robots.txt.body, sitemap.xml.body identical.
6. Tests: `apps/web npx vitest run`: 25 files, 301 passed, 1 skipped. `tsc --noEmit`: clean. `packages/content npx vitest run`: 12 files, 280 passed. Legal e2e (legal-versions, pages, http) `--repeat-each=3`: 138 passed, 0 failed. Full e2e (reusing that build): 275 passed, 0 failed, 5.5 min.
7. Mutations (all reverted, `git status` clean): space appended to privacy md: 3 fail (hash x2, final newline). The previous head's privacy md put back: the 2 hash tests fail, so the re-copy is pinned. `./versions` import added to pages.ts, `./documents` to terms-copy.ts, `@/lib/legal/documents` to privacy-copy.ts: the floating-import test fails each time (it passed the first two in A2). With the two robots lines removed and the sitemap entries put back, rebuilt: 5 e2e tests fail (sitemap, meta robots x2, X-Robots-Tag x2), so the new assertions bite.
8. merge-tree: `git merge-tree --write-tree origin/develop 3fd7205d` clean against caba0215.
9. CI at this head: 11 success, 1 cancelled, none failing. The cancelled one is a `compliance-fence` run (pull_request_target, 0 seconds, superseded); the other compliance-fence run is success. `required` success, `web (typecheck, test, build)` success (301 passed, 1 skipped), `web e2e (Chromium)` success (275 passed, 2.7 min), typecheck, database rules, tests and content rules success. Same pattern as the earlier heads.

### Notes (none blocks merge into develop)
1. documents.ts:49 still reads the undocumented `LEGAL_CONTENT_DIR` (A2 note 2, not changed by the delta). No test or doc sets it; the hash pins run in CI, not in the Vercel build. Delete it or pin it.
2. The X-Robots-Tag and robots meta are asserted only in e2e (legal-versions.e2e.ts:38, :70), not in the unit tests; the mutation above shows e2e catches a removal, so this is only a speed point. One line in legal-served.test.ts would give the same check without a build.
3. The PR body matches the head (sitemap, noindex, new privacy hash, 301 and 275 counts); the line saying the first e2e run had 274 passed is history, not a claim about this head.

### Merge order
#616 first, then #652. No file overlap (#616: 4 files; #652: 16); either merges to develop cleanly and each CI passes alone, but #652's two md files are copies of #616's pinned by the same two hashes, so any further change to #616's text needs a re-copy and both pins updated here (legal-served.test.ts, e2e/legal-versions.e2e.ts). Neither may reach main until the founder confirms #616's listed facts. After deploy: `curl | sha256sum` both .md URLs against the pins before any policy_versions row.

### Not verified
- Vercel itself (headers, CDN bytes, production branch); local `next start` only. Whether search engines honour noindex on a fresh URL: standard behaviour, not observed.
- Device plan: S1-31 (e) taps the floating rows only; no step covers /legal/<doc>/0.9.0. After deploy a human should open both on a phone in Safari and see "Version 0.9.0, a test version." under the title. Not run on a device.
- Legal wording and whether the new privacy bullet is true of the build (Review B lens, #616).

Reviewer: independent of the author (CR-44).
