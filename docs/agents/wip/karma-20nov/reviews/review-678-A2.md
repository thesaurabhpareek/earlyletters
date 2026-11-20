## Review A at 24b606cf7fe8caece41cd1c408f85574b76b2797: PASS WITH NOTES
Delta review of PR 678 (lens A) on one commit over 1f60320b. `gh api` confirms head 24b606cf...; origin/develop is still 1189fdff, so the PR stays 3 files, +33/-16. `git diff 1f60320b 24b606cf` touches RULINGS.md (CR-60 rewritten, 15 ins/12 del) and RELEASE.md (+1 line); `docs/qa/` is unchanged (empty diff), so my first review's device-plan findings stand as written and nothing in them was re-opened.

**Ran**
- `apps/mobile` qa-release-catalog, qa-kill-harness, billing-plan: 3 files, 100 tests passed. `packages/content`: 13 files, 309 tests passed.
- Added lines (whole PR and delta): 0 bytes at or above 0x80, no ` -- ` or `...`; `git diff --check` clean.
- `git merge-tree --write-tree origin/develop <sha>`: clean (tree ad1d500e). Also clean against PR 520's head (366f8564).
- CI at this head: first look 8 of 9 runs success with `tests and content rules` in progress; on a second look 10 of 10 runs completed success, including `required`. A PASS holds only while that stays green at exactly this head.
- Worktree removed.

**CR-60 against the repo (verified, file:line at this head)**
- #616 merged at 77941fd3 and #652 at 1189fdff (develop's tip); `origin/main` has no `0.9.0` path and 1189fdff is not an ancestor of it, so "nothing is live" is true.
- `legal-beta.test.ts:21-22` and `legal-served.test.ts` pin dfa303a7... and 4ec16856...; `apps/web/content/legal/{terms,privacy}/0.9.0.md` are `cmp`-identical to `docs/legal/beta/*`. `LegalDocument.tsx:24` robots index/follow false; `sitemap.ts` header says unlisted; `serve.ts:15` sends `X-Robots-Tag: noindex, nofollow`. `LEGAL_CONTENT_DIR` is at `documents.ts:49`.
- D-138 item 1 (`DECISIONS.md:1079`) is now quoted accurately: 0.9.0 "marked as a test version", permanent URL "before build 2 signs anyone in", "Counsel's Q31 still stands", no waiver wording. "Decided to publish ahead of counsel's Q31" matches it and BACKLOG.md:2555. This closes the should-fix I raised on the first head. D-138 item 3 (agree line with versioned links) supports the consent-gap clause; `sign-in/consent.tsx:294-295` and `settings/index.tsx:157-158` still open `brand.web.terms/privacy`; #635 records 4.1.0 and 3.0.0 (`agreements.logic.ts:19,21`).
- `POLICY_VERSIONING.md` line 7 counsel is approver; 69 "A version number is never reused"; 99 "Never edited or removed"; 190 "policy_versions rows are immutable; publish a new version"; 105 versioned in-app links. All as cited.
- `DEVELOPMENT.md:10` main is "Updated only by a release PR from develop, or a website hotfix", approver Founder; `:16` hotfix then merge main back the same day; `RELEASE.md:19,42` store lane cuts `release/<x.y>` from `main`. #616 body step 6 (`curl | sha256sum`, "insert only after step 6 passes") and the hand-routes list (deletion, withdraw sync, see/export/correct, under-18, TestFlight feedback; no runbook) match.
- `AUTH_SETUP.md:34` says until `terms` and `sensitive-data` rows exist every new account stops and sign-in looks broken. `ALPHA_GO_NO_GO.md:51` B2-9 is "legal pages live ... matching the policy versions on staging"; `:74` a B2-9 fail means friends get build 1.
- #660 does cite "CR-54 item 2" (`scripts/status/build-queue.sh:25`); no CR-54 heading on develop or in any PR's RULINGS diff.

**RELEASE.md line:** in the checklist's style. Section 12 is "Per-release checklist (copy into the release PR)" and the release PR is develop into main (`RELEASE.md:19`, `DEVELOPMENT.md` Release rule); the new line has the same `- [ ] subject (id): condition` shape as its neighbours and sits just before "Release option". The glob `apps/web/content/legal/*/0.9.0.md` matches terms and privacy; "the versioned routes" are `(legal)/legal/[doc]/0.9.0` and `0.9.0.md`.

**Must-fix:** none.

**Notes (small inaccuracies in CR-60, none changes the ruling)**
1. "open PRs already use CR-43 to CR-52" is loose: CR-46 and CR-47 are merged on develop; CR-43/44 are #555 (open), CR-48 is in both #591 and #592, CR-49 to 51 #613, CR-52 #655; CR-45 appears only as a reference (`BACKLOG.md:2520`), with no heading in develop or in any PR diff I scanned.
2. "No `terms` or `sensitive-data` row can go into `policy_versions` until the pages are live and the sha256 checks have passed (AUTH_SETUP.md line 34, #616 step 6)": the sources support the terms (and privacy) rows being gated by step 6; neither ties the `sensitive-data` row to the 0.9.0 pages (no sensitive-data page or hash is in #616). The conclusion (sign-in stays closed) still holds because the `terms` row is blocked and the gate needs both.
3. "a hotfix PR that brings only the `apps/web` change of #652": #652 also adds three lines to the root `.gitattributes` (`apps/web/content/legal/**/*.md -text`, byte-exact checkout). The web app itself is self-contained (only comments mention `docs/legal`), so a web-only PR is feasible, but it should carry that file too.
4. B2-9 "cannot pass" is true, but the row is already open for another stated reason (holding pages not on main) and its text is stale (`main (b8b52d5)`).
5. The new RELEASE.md line stays in every future release PR template after the pages deploy; worth deleting once CR-60 is closed.
6. Still open from my first review (device plan untouched): stale "Settings > Recordings" at `DEVICE_TEST_PLAN.md:74` and `:147`, V-10 `:316` has no way to make a past due date, S1-15b step 6 omits the Speak primer and microphone prompt.

**Not verified:** the founder's quoted answers ("Versioned URLs only (Recommended)", "Merge #616 and #652, deploy the website") exist only in CR-60, nowhere else in the repo or PR threads; that CR-53 to CR-59 are unused outside the repo; Vercel's live state; anything on a phone; `npm test` at the root, `test:db`, `typecheck` (docs only).

Reviewer: independent of the author (CR-44).
