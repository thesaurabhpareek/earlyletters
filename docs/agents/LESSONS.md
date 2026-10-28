# Lessons

Status: first harvest, 28 Oct 2026, against `develop` at 6bfb94a9. Retro work package R3-05 (IMP-10).

**This file is the single place new lessons go.** A lesson is something a session learned the hard way that the next session should not have to learn again. Until now lessons lived only in the "Learned" lines of journal issues: none reached any `agents/<handle>/MEMORY.md` (for example `agents/red-team/MEMORY.md` still says "Lessons: None yet"), and several journal entries say "MEMORY.md not edited this run" ([#20][j20a], [#21][j21a], [#23][j23a], [#171][j171e], [#172][j172e]).

What is in it:
- Every "Learned" line from the agent journal issues (label `journal`) up to 28 Oct, grouped by theme, deduplicated, each carried verbatim or closely paraphrased, with a link to the journal comment it came from. Where two journals learned the same thing, both sources are listed.
- The lessons of the 28 Oct retrospective: its 7 root causes and the things that worked, each with an evidence pointer.

Facts about code, prices and outside services are true as of the date of their source, not today. Check them on `develop` (or the outside source) before relying on one. A note in brackets marks a lesson that a later source changed.

## How to add a lesson

1. Search this file first (`grep -n -i "<key word>" docs/agents/LESSONS.md`). If the lesson is already here, add your source to that line instead of a new line. If yours replaces an older lesson, edit the old line and keep both sources.
2. Add one bullet under the theme that fits (or a new `##` theme if none does): the lesson in one or two plain sentences, then its source as a link (journal comment, PR, issue, review or commit) and the date. Facts that can go stale say "as of <date>".
3. Ship it in the same PR as the work that taught it, or in a small `docs/` PR that changes only this file.
4. Still write the "Learned" line in your journal entry as usual; this file is where it is kept.
5. Privacy rules apply here as everywhere (`CLAUDE.md`): no entry text, transcript, audio, child name or real family detail. Describe a security weakness by its class and fix, never with exploit steps.

Not decided yet: whether per-agent `agents/<handle>/MEMORY.md` files are kept, and whether lessons are copied into them. That waits on the harness decision (retro IMP-35 and Round 3 package R3-05), so no `MEMORY.md` was changed here. Until then, `scripts/agents/memory.mjs` reads only `MEMORY.md`, so it will keep listing these lessons as "Carry into memory" in agent briefs. Open PR #338 proposes a separate error-class registry (`agents/lessons/REGISTRY.md`); how it relates to this file is for the coordinator to settle.

## 1. Check the base before you trust a result

`develop` moved fast (for example a 549-file direct merge on 3 Oct, 7cc43b1, and 126 commits in the 9 days to 27 Oct). Most review mistakes came from checking against an old base.

- Fetch `develop` and compare its head before every review. A direct merge can land minutes before a run. ([#5, 3 Oct 21:09][j5e])
- Before checking "on develop" claims in a re-review, compare the PR's merge base with `origin/develop`. A large merge can overtake a fix within minutes. ([#5, 3 Oct 21:02][j5d])
- Before applying a review fix, re-check its premise on the current `develop`: the removal had landed and three new tasks were already done while the PR waited. ([#6, 3 Oct 21:13][j6c])
- `git merge-tree --write-tree --name-only origin/develop <branch>` shows conflicts without touching a worktree. ([#6, 3 Oct 21:13][j6c])
- A PR that passes at its own head can fail once merged with develop, because develop gains new guard tests (here `theme-leaks.test.ts`). Do a scratch `git merge --no-commit origin/develop`, run the tests, then `git merge --abort`, before trusting a green result on a stale PR. ([#5, 14 Oct 00:19][j5h])
- A legal PR's own test run proves little when its base is behind. Run the content rules on a trial merge with develop. ([#5, 14 Oct 00:12][j5f])
- A PR with a merge conflict gets no `pull_request` runs. Check `mergeable_state` before reading "green at head". ([#22, 3 Oct 21:09][j22b])
- When a later pending migration reuses a function's signature with `create or replace`, its definition wins. Review every hardening PR against everything that sorts after it, not only against its base. ([#5, 14 Oct 00:17][j5g])
- PRs #32 and #37 were cut from 3688796, before the develop merge 7cc43b1: develop's `20261004000000_plus_on_device_only.sql` redefines `purge_due` after PR #32's file, and #37's DATA_CLASSIFICATION disagrees with develop on the analytics language code. ([#19, 3 Oct 21:15][j19])
- A branch listed as "pushed with no PR" may already be merged by squash. Compare trees with a two-dot `git diff origin/develop origin/<branch>` before you treat it as live overlap; a three-dot stat showed 583 lines where the two-dot diff was empty. ([#6, 14 Oct 00:04][j6d])
- "Synced to: <sha>" is not proof: the branch base was at d74e860, so #108 and #122 were not yet recorded. Check the base branch's `docs/DECISIONS.md` against `develop`, not only the sha. ([#171, 16 Oct][j171b])
- Checking against a `develop` worktree (copy the changed files in, run the check there) gives the true result while the base branch lags. ([#171, 17 Oct][j171c])
- A branch based on another unmerged branch (`docs/knowledge-leads`) carries files `develop` lacks, so a page can stay stale until that branch merges. ([#172, 27 Oct][j172f])
- `main` takes direct product PRs (the website lane, #55 to #102), not only release PRs. Check `git log --first-parent origin/main` before assuming `main` is develop's past. ([#5, 14 Oct 00:19][j5h])

## 2. Scope and the source of truth

- Docs written from the PRD kept missing brief decisions 5 (co-parent only) and 9 (no audio upload, no family playback). Check every doc PR against the brief of record, not the PRD or roadmap. ([#5, 3 Oct 19:49][j5b]; [#20, 3 Oct 16:30][j20a])
- The 3 Oct brief and PRD 1.3 came from the same day and disagreed (Google sign-in, family scope, Family Sharing, audio upload, support cards). The newer one wins, and the copy flags the gap. ([#21, 3 Oct 16:56][j21a])
- Draft store and site copy promised things the 3 Oct brief moved out of v1.0 (grandparents writing, shared voices, word highlighting, mixed-language letters, backup). Check every public claim against the current decisions. ([#20, 3 Oct 16:30][j20a])
- A scope limit makes some metrics read zero by design: under brief decisions 5 and 9, any contributor, approval or other-family metric was zero at v1.0. ([#18, 3 Oct 20:32][j18b])
- A decision can be settled in one place and still marked open in another: brief decision 10 settled D-030 (the store never says "beta") while `DECISIONS.md` still marked D-030 Recommended. ([#17, 3 Oct 20:33][j17])
- On 15 Oct two founder records of v1.0 scope conflicted: on-device (#127) and option B, server features on (#128). ([#171, 15 Oct][j171a]) [Resolved 17 Oct: option B was logged as D-100 ([#171, 17 Oct][j171c]); #127 is still open with 0 comments on 28 Oct.]
- A process change can land as a docs PR with no D-id (#212, #224). Read merged docs PRs, not only `docs/DECISIONS.md`. ([#171, 18 Oct][j171d])
- D-ids D-112 to D-117 came from docs PRs while `develop` moved 126 commits in 9 days; the checker's "missing" list is the fastest worklist. ([#171, 27 Oct][j171f])
- "Open PR #n" wording goes stale after a merge and no checker catches it. Grep for "open PR" and check each one every run. ([#171, 23 Oct][j171e])
- Founder PRs cite WS ids, not BL ids, so match tasks by scope. ([#22, 3 Oct 19:40][j22a])

## 3. Database and migrations

- A security definer function whose `search_path` does not end with `pg_temp` can be shadowed by a caller's temp table. The DB-11 sweep in `hardening.test.mjs` and `supabase/APPLY.md` step 10 only substring-matched the pin, so they did not catch a missing `pg_temp`. ([#5, 3 Oct 19:40][j5a]; class tracked in issue #119)
- Each `supabase/tests` file takes its migration list as arguments (`node supabase/tests/<file> <migrations...>`), so a combined state, such as a PR's files plus develop's later files, can be probed without touching any branch. ([#5, 14 Oct 00:17][j5g])
- The harness `createDb(files)` plus a `pg_proc` query is a quick, authoritative way to list effective function attributes after every migration has applied. ([#5, 15 Oct 00:56][j5i])
- Perf p95 budgets are not reliable on this host while other agents run. Compare against another head before calling it a regression. ([#5, 14 Oct 00:17][j5g])
- A guard added in a PR does not protect PRs until it is on the base: develop already carried `.github/scripts/migration-guard.mjs`, so the new trusted-ref guard was not in bootstrap for real PRs. ([#5, 3 Oct 19:40][j5a])

## 4. CI, workflows and the supply chain

- The REST `git/ref/tags/<tag>` call returns the tag object for an annotated tag. Pin the peeled commit from `git ls-remote <repo> '<tag>^{}'`. ([#5, 3 Oct 20:44][j5c]; [#22, 3 Oct 21:09][j22b])
- `gitleaks git` with no `--log-opts` runs `git log --all`, and `actions/checkout` with `fetch-depth: 0` fetches every branch. So a PR-time scan covers all branches, and one branch's fixture fails every PR. ([#5, 3 Oct 20:44][j5c]; [#22, 3 Oct 21:09][j22b])
- Workflows added in a PR run only on that PR until they merge. ([#22, 3 Oct 19:40][j22a])
- `gh api .../actions/workflows/<file>/runs` returns 404 for a workflow that exists only off the default branch. ([#5, 14 Oct 00:19][j5h])
- Check repo visibility (`gh api repos/<o>/<r> --jq .visibility`) before accepting any claim that a GitHub feature is unavailable. The repo is public, and on GitHub Free a public repo gets environments, required reviewers and rulesets. ([#5, 15 Oct 00:56][j5i]; [#5, 15 Oct 00:59][j5j])
- Under Node 22, an uncaught `JSON.parse` error from `tsx` prints the whole offending input line. Never parse a secret without try/catch. ([#5, 15 Oct 00:59][j5j])
- `ubuntu-latest` moves to Ubuntu 26.04 from 19 Oct 2026. ([#22, 3 Oct 19:40][j22a])
- The `plan` cron alone needs at least 1,440 Actions minutes a month if the repository goes private. ([#22, 3 Oct 19:40][j22a])

## 5. Session tooling: git, worktrees, gh and web fetches

- The worktrees share `/home/claude/earlyletters/.git`, so a `git fetch` in one moves `origin/develop` for all. Use `git ls-remote` when you only need to read a ref. ([#5, 3 Oct 21:02][j5d])
- A sparse partial clone with symlinked `node_modules` can run one PR's tests against another branch's copy. ([#5, 3 Oct 21:09][j5e])
- Through this proxy, `gh api --paginate` and `gh api` on other owners' repos failed (3 Oct). Page by hand, and use `git ls-remote`. ([#5, 3 Oct 20:44][j5c]; [#22, 3 Oct 21:09][j22b])
- WebFetch on a URL recalled from memory gets no permission. Run WebSearch first, then fetch the returned URL; the `.md` variants of the Expo and Supabase docs pages work well. ([#5, 15 Oct 00:59][j5j]; [#5, 3 Oct 19:49][j5b])
- WebFetch needs the `cdn.www.census.gov` host. The Census data API now needs a key; the table-based summary file on www2.census.gov (for example `acsdt5y2022-b16001.dat`) plus the table shells give the same national figures without one. ([#5, 3 Oct 19:49][j5b]; [#5, 3 Oct 21:02][j5d]; [#20, 3 Oct 20:29][j20b])

## 6. The agent harness and the backlog

- The real-backlog test reads the harness checkout. To test an edited `docs/BACKLOG.md`, copy `scripts/`, `agents/` and `.claude/agents/` into a scratch mirror with the new file. ([#6, 3 Oct 19:44][j6a])
- A status's parentheses must not contain a full stop followed by a space and `Mode:`, or the parser cuts it short. ([#6, 3 Oct 19:44][j6a])
- `Status: blocked (founder PR #n)` parses as blocked on a non-backlog item, so the dispatcher skips the task until someone edits it. Use it only for work that must wait for an unmerged founder PR. ([#6, 3 Oct 20:42][j6b])
- Backlog id blocks fill up (the M0 block BL-100 to BL-109 was full on 3 Oct). Borrowed ids go in the appendix line, like BL-123 to BL-125 and BL-161 to BL-165. ([#6, 3 Oct 19:44][j6a]; [#6, 3 Oct 20:42][j6b])
- `check.mjs` checks only frontmatter and owner roles. Owned paths, charter sections and memory content need a manual pass every time. ([#5, 15 Oct 00:56][j5i])
- The board's spend figure read $0.00 because interactive-session receipts say "cost not reported". Report spend as unknown until receipts carry cost. ([#23, 3 Oct 19:28][j23a])
- Lessons did not reach memory: sessions were told not to edit `MEMORY.md`, and on 23 Oct the scheduled run could not, because the file was outside that run's files. ([#20, 3 Oct 16:30][j20a]; [#21, 3 Oct 16:56][j21a]; [#23, 3 Oct 19:28][j23a]; [#171, 23 Oct][j171e]; [#172, 23 Oct][j172e])
- Finding, not a Learned line: `scripts/agents/dispatch.mjs` and `brief.mjs` had no tests of their own because they run network calls at import. ([#7, 15 Oct][j7a])

## 7. Docs that describe code

- Built is not the same as used: many experience-pass components were built but not used by any screen. Check usage with grep before describing a component as on screen. ([#172, 17 Oct][j172c])
- The device flows under `apps/mobile/e2e/flows` can lag behind gate changes. Check them against `lib/billing/gates.ts` when the membership rules move. ([#172, 16 Oct][j172b])
- A page can name an env value as "not set in any profile" for weeks. Re-read `eas.json` whenever a page's covered files include it. ([#172, 23 Oct][j172e])
- Test-only changes under a page's covered files (for example packs `__tests__`) still mark it stale. Re-verify and bump it without prose changes. ([#172, 18 Oct][j172d])
- `packages/content/test/rules.test.ts` does not scan `docs/`, so docs need their own rule check. ([#21, 3 Oct 16:56][j21a])
- Scans of `docs/legal` must skip `[COUNSEL` notes, which quote other numbers. The `docs/legal` 90-day test runs paragraph by paragraph. ([#17, 3 Oct 20:33][j17]; [#5, 14 Oct 00:12][j5f])
- "one day" in copy means someday, not a day count. ([#17, 3 Oct 20:33][j17])
- `POLICY_VERSIONING` section 1 covers only user-facing texts. ([#19, 3 Oct 21:15][j19])

## 8. Facts about the product code (dated; check before relying on one)

- No build profile set the docs base URL and the pack signing-key list was empty, so a build made on 15 Oct could not install speech models or language packs. Without `EXPO_PUBLIC_DOCS_BASE_URL` there is no pack manifest, so any privacy text for a transcribing build must name the documents host. ([#172, 15 Oct][j172a]; [#5, 14 Oct 00:12][j5f]) The 15 Oct entry lists 12 places where code and docs disagreed, in PR #167.
- In `packages/core/src/verify.ts`, removal edits skip the negation backstop, so the filler list is the only guard. `lang/validate.ts` checks fillers against negations, modals, numbers, pronouns and kinship words, but not function words (3 Oct). ([#5, 3 Oct 21:09][j5e])
- D-082 and D-083 (4 Oct) replaced D-053's Plus scope. The one Plus gate is the Keep step of a third letter (`decideKeepLetter`, `packages/core/src/plan.ts`). ([#21, 14 Oct][j21c])
- The free-letter count lives in the Keychain, the database and the letters present, and the largest wins, so it usually survives deleting the app. On 14 Oct nothing in the app called `eraseLetterLedger`, so nothing cleared the Keychain count. ([#21, 14 Oct][j21c]; [#5, 14 Oct 00:12][j5f])
- The Subscription terms and the App Review note in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` still described the D-053 model on 14 Oct. ([#21, 14 Oct][j21c]) [On 28 Oct `docs/legal/subscription-terms.md:32-33` still states $3.99 and $29.99, while `pricing.ts` follows D-082 at $4.99 and $49.99.]
- v1.0 had no Delete this book and no Erase everything screen (14 Oct). ([#21, 14 Oct][j21c])
- The purchase runs in Apple's SubscriptionStoreView with notes from `packages/content/src/features/billing.en.ts`, not the custom Plus sheet `in-app-disclosures.md` described (3 Oct). ([#19, 3 Oct 21:15][j19])
- There was no `supabase/config.toml` on develop; hosted auth settings lived only in the dashboard (3 Oct). The Plus promise string is `plus.promise`. ([#21, 3 Oct 20:32][j21b])
- Mobile showed the beta card on the main Settings screen, not in About (3 Oct). ([#17, 3 Oct 20:33][j17])

## 9. Facts about Apple, Supabase and the market (as read on the date given)

- Supabase links identities that share a verified email automatically. Its docs describe this for OAuth and do not name `signInWithIdToken`, which the app uses on iOS; the Auth source shows the ID-token grant uses the same linking (`token_oidc.go`, `createAccountFromExternalIdentity`, `DetermineAccountLinking`) and needs a verified email. ([#5, 3 Oct 19:49][j5b]; [#5, 3 Oct 21:02][j5d]; [#21, 3 Oct 20:32][j21b])
- Apple only notifies, without asking consent, for subscription price increases below its thresholds (App Store Connect Help, "Manage pricing for auto-renewable subscriptions"). ([#5, 3 Oct 19:49][j5b]; [#21, 3 Oct 20:32][j21b])
- The App Store Connect Support URL is required and must be a full URL leading to contact details; a bare email address is not enough. ([#5, 3 Oct 19:49][j5b]; [#20, 3 Oct 20:29][j20b])
- Apple's only documented renewal reminder (12-month-commitment plans, 27 Apr 2026) excludes the US. ([#5, 3 Oct 20:44][j5c])
- Apple's Family Sharing help moved to `configure-in-app-purchase-settings/`. ([#5, 3 Oct 20:44][j5c])
- Apple-hosted Managed Background Assets need apps targeting iOS 26 or later (App Store Connect help, read 3 Oct). ([#5, 3 Oct 21:09][j5e])
- App Store Connect counts new users as App Units (first Get per Apple Account; redownloads and extra devices not counted), not downloads. ([#18, 3 Oct 16:41][j18a])
- TestFlight purchases run in Apple's sandbox, so no price or conversion data exists before launch. Apple's TestFlight page states the sandbox and renewals but not "testers are not charged". ([#18, 3 Oct 16:41][j18a]; [#18, 3 Oct 20:32][j18b])
- Internal TestFlight testers must be App Store Connect users (an individual account can add up to 50). ([#20, 3 Oct 20:29][j20b])
- App Store Connect usage metrics, like PostHog, cover only users who opted in. ([#20, 3 Oct 16:30][j20a])
- "early letters" on the US App Store returns phonics apps (iTunes Search API), so always pair the name with "memory book". ([#20, 3 Oct 16:30][j20a])
- The Wilson interval matches a two-sided score test, so say "can be told apart" only when the target falls outside the interval, and check that against the table. ([#18, 3 Oct 20:32][j18b])

## 10. Point-in-time notes (history, not rules)

These were recorded as Learned lines but describe the state on one day. Kept for completeness.

- 3 Oct: release PR #2 failed the migration guard on `20261001000000_scribe_hardening.sql` and would turn green only after #30 merged; #42 was stacked on #39, stacked on #4; `main` and `develop` were unprotected and `agents.yml` was on neither branch. ([#23, 3 Oct 19:28][j23a]) [On 28 Oct `develop` is still unprotected and the default branch is `main` (GitHub API).]
- 3 Oct: the legal drafts' line numbers were identical on develop and #37 except version lines. ([#19, 3 Oct 21:15][j19])

## Lessons from the 28 Oct retrospective

Source: the 28 Oct 2026 retrospective synthesis (six panels plus an independent synthesis, section 3 root causes and section 2.9 things that worked). The synthesis itself is not in the repo; each pointer below is to evidence that is. "Retro, unverified here" marks a claim this harvest did not re-check.

### The 7 root causes

1. **RC1. Build for the operating model you have, and prove it runs.** The harness and its rulebook assumed unattended agents with their own identity, stewards and an Actions lane, while the work was done by interactive threads posting as the founder. Fixture tests passed while the lane did nothing. Evidence: 13 of 26 journal issues have no entries (#8 to #16, #230 to #233; GitHub API, 28 Oct); `agents/red-team/MEMORY.md` "Lessons: None yet"; default branch is `main` (GitHub API, 28 Oct), so workflows that exist only on `develop` are not registered (retro spot-check 2).
2. **RC2. Track the founder-only critical path in one place.** Apple, EAS, staging, keys, counsel, default branch, protection and token rotation stayed untracked while threads built on top of them. Evidence: `docs/FOUNDER_TASKS.md` has 57 unticked boxes and 0 ticked (develop 6bfb94a9).
3. **RC3. Keep one source of truth for decisions, dates and status, and propagate every decision.** Stale copies kept acting and ids were picked by hand. Evidence: id renumbering notes at `docs/DECISIONS.md:443` and `:619`; issue #127 (on-device v1.0, reversed by D-100) is still open with 0 comments; the 4-hourly lane prompt still cited #127 on 28 Oct (retro spot-check 7; the prompt is not in the repo, unverified here).
4. **RC4. Consult legal, privacy, marketing and content before building, and carry scope changes downstream.** Scope flipped faster than the work that depended on it. Evidence: `docs/legal/subscription-terms.md:32-33` still states $3.99 and $29.99 against D-082; `packages/content/src/site.en.ts:83` "Your recordings stay on your phone" next to `:93` "your letters sync to our servers".
5. **RC5. Put rules and safety in machines, not prose.** Rules held only where a test enforced them. Evidence: `develop` is unprotected (`branches/develop` `protected: false`, GitHub API, 28 Oct); bot PR #309 into `main` changed the website privacy text and flipped its own guard test (retro spot-check 21; closed unmerged).
6. **RC6. Green CI is not evidence the product works.** Evidence: the app could not launch from 71070c41 (#96, merged 5 Oct) until 86b6e905 (#276, merged 24 Oct); #284 (merged 24 Oct) added the Release launch check on every mobile PR.
7. **RC7. Bound work in progress on one shared capacity.** Stacks went stale, drafts sat for weeks, and one subscription served every thread and lane with no budget. Evidence: 56 open PRs at 06:30 UTC on 28 Oct (GitHub API; the retro counted 36 earlier the same day); docs stack #164, #167, #168 still open.

### What worked: keep it

| Keep | Evidence |
|---|---|
| The kill-safe recording harness with a planted-failure self-check; it found the launch crash and unplayable M4A files | `docs/adr/0027-kill-safe-recording-container.md`; findings per retro panel 02 (unverified here) |
| The Release launch check on every mobile PR; make it a required check once protection exists | #284 |
| Two lens reviews on the current head plus green CI; they caught real defects | Retro panels 02 and 06 (unverified here) |
| Database discipline: access matrix, `test:db`, migration guard, `pg_proc` sweep with a negative control, explicit grants, the `APPLY.md` ledger | `supabase/tests/access_matrix.test.mjs`, `.github/workflows/migration-guard.yml`, `supabase/APPLY.md` |
| The content rules test and "fix the copy, not the test"; the hashed real-family guard | `packages/content/test/rules.test.ts`, `packages/content/test/no-real-family-data.test.ts` |
| The constitution held (`verifyEdits`) | `packages/core/src/verify.ts`; retro panel 02 (unverified here) |
| Fixed-seed property tests and the trace | `scripts/trace.mjs`; retro panels 02 and 04 (unverified here) |
| Runnable SQL stand-ins for cross-owner requests | Sync handoff #196 ("Done in #208 ... as the stand-in at 82d01f2"); match count per retro panel 02 (unverified here) |
| `DECISIONS.md` entries with Supersedes and Amends lines | `docs/DECISIONS.md` (9 such lines on 6bfb94a9) |
| Per-agent check-in files ended `BOARD.md` append conflicts | #224 (merged 18 Oct) |
| Small single-concern PRs | Retro panel 06: platform thread 12 of 12 merged (unverified here) |
| The red team's fix-first bar found real defects: the `pg_temp` class, wrong prices, false Apple claims; keep it as a review brief | Issue #119; [#5, 14 Oct 00:12][j5f]; [#5, 3 Oct 19:49][j5b] |
| The release record, settings-as-code dry run and read-only doctor | `docs/release/1.0.0.md`, #236, #303 |
| Declaring conflicts of interest in decision records | Issue #127, item 4 |

## Coverage of this harvest

Read on 28 Oct 2026 through `gh api repos/thesaurabhpareek/earlyletters/issues?labels=journal` and each issue's comments. 26 journal issues exist.

- With Learned lines, all carried above: #5 (10 entries), #6 (4), #17 (1), #18 (2), #19 (1), #20 (2), #21 (3), #22 (2), #23 (1), #171 (6), #172 (6).
- Entries with no Learned line: #7 (15 Oct note from the founder's session, carried as a finding; 18 Oct "in progress" only), #22 (18 Oct "started" only; 27 Oct task note), #23 (18 Oct "started" only), #234 (18 Oct "started" only).
- No entries at all: #8 to #16 and #230 to #233.

## Sources

[j5a]: https://github.com/thesaurabhpareek/earlyletters/issues/5#issuecomment-5972804115
[j5b]: https://github.com/thesaurabhpareek/earlyletters/issues/5#issuecomment-5972871412
[j5c]: https://github.com/thesaurabhpareek/earlyletters/issues/5#issuecomment-5973316006
[j5d]: https://github.com/thesaurabhpareek/earlyletters/issues/5#issuecomment-5973453304
[j5e]: https://github.com/thesaurabhpareek/earlyletters/issues/5#issuecomment-5973503004
[j5f]: https://github.com/thesaurabhpareek/earlyletters/issues/5#issuecomment-6157916982
[j5g]: https://github.com/thesaurabhpareek/earlyletters/issues/5#issuecomment-6157981902
[j5h]: https://github.com/thesaurabhpareek/earlyletters/issues/5#issuecomment-6158004936
[j5i]: https://github.com/thesaurabhpareek/earlyletters/issues/5#issuecomment-6181884752
[j5j]: https://github.com/thesaurabhpareek/earlyletters/issues/5#issuecomment-6181917639
[j6a]: https://github.com/thesaurabhpareek/earlyletters/issues/6#issuecomment-5972832902
[j6b]: https://github.com/thesaurabhpareek/earlyletters/issues/6#issuecomment-5973296978
[j6c]: https://github.com/thesaurabhpareek/earlyletters/issues/6#issuecomment-5973537667
[j6d]: https://github.com/thesaurabhpareek/earlyletters/issues/6#issuecomment-6157811754
[j7a]: https://github.com/thesaurabhpareek/earlyletters/issues/7#issuecomment-6198552494
[j17]: https://github.com/thesaurabhpareek/earlyletters/issues/17#issuecomment-5973233705
[j18a]: https://github.com/thesaurabhpareek/earlyletters/issues/18#issuecomment-5971193543
[j18b]: https://github.com/thesaurabhpareek/earlyletters/issues/18#issuecomment-5973225783
[j19]: https://github.com/thesaurabhpareek/earlyletters/issues/19#issuecomment-5973551678
[j20a]: https://github.com/thesaurabhpareek/earlyletters/issues/20#issuecomment-5971096841
[j20b]: https://github.com/thesaurabhpareek/earlyletters/issues/20#issuecomment-5973197438
[j21a]: https://github.com/thesaurabhpareek/earlyletters/issues/21#issuecomment-5971317495
[j21b]: https://github.com/thesaurabhpareek/earlyletters/issues/21#issuecomment-5973219663
[j21c]: https://github.com/thesaurabhpareek/earlyletters/issues/21#issuecomment-6157968169
[j22a]: https://github.com/thesaurabhpareek/earlyletters/issues/22#issuecomment-5972805420
[j22b]: https://github.com/thesaurabhpareek/earlyletters/issues/22#issuecomment-5973501101
[j23a]: https://github.com/thesaurabhpareek/earlyletters/issues/23#issuecomment-5972710236
[j171a]: https://github.com/thesaurabhpareek/earlyletters/issues/171#issuecomment-6199497852
[j171b]: https://github.com/thesaurabhpareek/earlyletters/issues/171#issuecomment-6216037894
[j171c]: https://github.com/thesaurabhpareek/earlyletters/issues/171#issuecomment-6234143865
[j171d]: https://github.com/thesaurabhpareek/earlyletters/issues/171#issuecomment-6246004143
[j171e]: https://github.com/thesaurabhpareek/earlyletters/issues/171#issuecomment-6365471340
[j171f]: https://github.com/thesaurabhpareek/earlyletters/issues/171#issuecomment-6454830551
[j172a]: https://github.com/thesaurabhpareek/earlyletters/issues/172#issuecomment-6199498236
[j172b]: https://github.com/thesaurabhpareek/earlyletters/issues/172#issuecomment-6216076527
[j172c]: https://github.com/thesaurabhpareek/earlyletters/issues/172#issuecomment-6234202395
[j172d]: https://github.com/thesaurabhpareek/earlyletters/issues/172#issuecomment-6246012903
[j172e]: https://github.com/thesaurabhpareek/earlyletters/issues/172#issuecomment-6365587589
[j172f]: https://github.com/thesaurabhpareek/earlyletters/issues/172#issuecomment-6454963298
