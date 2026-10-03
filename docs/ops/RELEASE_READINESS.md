# Release readiness: M1 Guardrails and the security migration pack

Owner: `ops`. Written in run `sess-202610031917`; refreshed after the red-team review in run `sess-202610032046`. As of 2026-10-03 21:05 UTC, with develop at 7cc43b1.

Every status below comes from one of these sources at that time:
- the repository on `origin/develop`;
- the open pull requests, their reviews and their merge state;
- GitHub's REST API.

Refresh the statuses before relying on them. CI evidence is in [CI_HEALTH.md](CI_HEALTH.md).

## Which milestone, and how to read this

- **Why M1.** In `docs/ROADMAP.md` section 2, M0 (founder long poles, weeks 1 to 3) and M1 (weeks 1 to 2, 5 to 16 Oct 2026) both start in week 1. M1 exits first and carries the CI and release-engineering gates.
  - This checklist covers M1, plus the founder-only gates that block it today.
  - M0 items appear only where they gate M1.
- **M1 exit criteria** (ROADMAP): "CI and branch protection on; agent fence for `supabase/` and auth (D-041); one fix pack applied to staging by CI: parent-only invites with explicit role, client ids for children, server consent gate, policy-version fix, pepper fail-closed; test retitles; content-rule additions; `child-input` flag in core; verifier hardening".
- **Backlog source:** `docs/BACKLOG.md`, heading "M1. Guardrails and the security migration pack (weeks 1 to 2)". It has two sections: E0 (workflow guardrails) and E1 (database integrity, governance and the fix pack).
- **Status words:** done, partly done, in PR #n, not started, blocked on founder. Where a PR has a red-team review, its verdict is given with the commit it reviewed.
- **Caveats:**
  - The backlog status lines on develop predate today's PRs. For example, BL-004 still says `ready`.
  - The founder's open PRs cite workstream and finding ids, not BL ids. So "PR #n" below is a match by scope unless the PR names the id.
  - Ops did not review those PRs' code against each task's Definition of Done.
  - Develop moved at 20:43 UTC (7cc43b1, the 3 Oct wave). Eleven open PRs are now in conflict with their base, and GitHub runs no `pull_request` checks on them until they are updated (CI_HEALTH section 2).

## Summary

- **Done:** F6, the `approve-migration` label.
- **Done on develop only:** CI (BL-004). `main` waits on F2, so the task is not done yet.
- **In a PR, or partly done:**
  - BL-003, BL-117, BL-121 and BL-122 among the guardrails;
  - BL-016, BL-111, BL-112 to BL-116, BL-118 and BL-120 in the fix pack and M1 code.
- **Not started:**
  - BL-001, BL-002, BL-110 and BL-119;
  - F3, branch protection (a founder step).
- **Blocked on founder:** F1, F2, F4, F5 and F7, and BL-015 (apply the pack to staging by CI).
- **Open red-team verdicts on the path:** PR #30 and PR #32 both have "fix first", and neither has a review of its newer head. PR #30 gates F2. PR #32 carries BL-112 to BL-115. PR #46 (BL-118) also has "fix first".
- **Biggest risk to the M1 exit on 16 Oct:** the apply-to-staging step. It needs a staging project (BL-107), workflows on `main` (F2), the deploy pipeline (PR #36) and the fix pack (PR #32) with its two Vault secrets, all behind founder steps.

## 1. Founder-only gates open now

| # | Gate | What must be true | How to check | Owner | Backlog | Status and evidence |
|---|---|---|---|---|---|---|
| F1 | Merge PR #4 (agent harness), then PR #39 (stacked on #4), then PR #42 (stacked on #39) | All three merged into `develop`, in that order | `gh api repos/thesaurabhpareek/earlyletters/pulls/4 --jq .merged`, then 39 and 42 | founder | none (ADR 0014 to 0017) | **Blocked on founder.**<br>All three are open, mergeable and green at their heads (PR #4 is now at c55d5fa). None has a red-team review yet: `pulls/<n>/reviews` returns none. PR #39 says "Merge #4 first".<br>PR #33 records the harness prerequisites: a private repository on GitHub Pro, branch protection plus the `approve-migration` gate, and the agents' own GitHub identity. |
| F2 | Workflows on `main`: release PR #2 (develop into main) | `main` contains `.github/workflows/`; PR #2 is merged with green checks | `git ls-tree -r --name-only origin/main -- .github` (empty today) | founder | BL-004 | **Blocked on founder, and on PR #30.**<br>PR #2's migration guard failed again at 7cc43b1, and will until PR #30's reviewed exception reaches develop (CI_HEALTH 3.2). PR #30 is in conflict with develop and its red-team verdict is "fix first" (section 5, step 2).<br>GitHub's docs: "Scheduled workflows run on the default branch" ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)). The default branch is `main`, so the agents schedule also needs a second release PR after F1. |
| F3 | Branch protection on `main` and `develop` | Pull request required, plus these required checks: `required`, `applied migrations unchanged`, and `fence` once PR #30 merges. Also linear history, and no force pushes or deletions (`.github/README.md`) | `gh api repos/thesaurabhpareek/earlyletters/branches/main/protection --jq '.required_status_checks.checks'`, and the same for `develop` | founder | M1 exit criterion; BL-004, BL-122 | **Not started.**<br>Re-checked: both branches return HTTP 404 "Branch not protected", and `gh api repos/thesaurabhpareek/earlyletters/rulesets` returns `[]`.<br>Both check names already exist, because both workflows have run. |
| F4 | `OPENROUTER_API_KEY` secret, on a key with a monthly budget (and zero data retention, per PR #4) | The secret is set; the key has a spend limit | `gh secret list --repo thesaurabhpareek/earlyletters` (founder); the limit is in the key's OpenRouter settings | founder | none (PR #4, "Before it runs") | **Blocked on founder.**<br>Whether it is set is Unverified: ops does not read secrets. It is of no use before F1 and F2. |
| F5 | Agents GitHub App | The App has no Workflows or Administration permission (PR #4). Variable `AGENTS_APP_CLIENT_ID` and secret `AGENTS_APP_PRIVATE_KEY` are set. Variable `AGENTS_BOT_LOGINS` holds the bot login (PR #39) | `gh variable list` and `gh secret list` with `--repo thesaurabhpareek/earlyletters` (founder); permissions on the App's settings page | founder | none | **Blocked on founder.** Unverified, for the same reason as F4. |
| F6 | `approve-migration` label | The label exists | `gh api repos/thesaurabhpareek/earlyletters/labels/approve-migration --jq .name` | founder | BL-122 | **Done.** Re-checked: the label exists. |
| F7 | Repository visibility and the Actions budget | The decision on private or public is made knowing the minutes it costs | `gh api repos/thesaurabhpareek/earlyletters --jq .visibility` | founder | none (PR #33) | **Blocked on founder.**<br>The repository is public today, so Actions on standard runners is free.<br>On GitHub Pro, the harness alone would exceed the 3,000 included minutes, and without a payment method Actions stops at the quota (CI_HEALTH section 5, cited). |

## 2. M1 gates: E0 workflow guardrails

| Gate | What must be true | How to check | Owner | Backlog | Status and evidence |
|---|---|---|---|---|---|
| Continuous integration [Critical] | CI runs on every pull request and every push to `develop` and `main`, within the time budget, with no secrets | `gh api 'repos/thesaurabhpareek/earlyletters/actions/runs?branch=develop&event=push&per_page=5' --jq '.workflow_runs[] \| [.name, .conclusion] \| @tsv'` | `qa` | BL-004 | **Done on develop; `main` waits on F2.**<br>`ci.yml` has been there since 3bf45a0, and all 4 develop pushes passed. A green run takes 1m 36s at the median. Since 7cc43b1 it has six jobs.<br>The task is not done until CI is on `main`. The backlog line still says `ready`, Node 20 and under 8 minutes; CI actually uses Node 22 with a 10-minute budget. |
| CI security and platform scans [High] | CI runs all of these: an SDK and import denylist, manifest lint, gitleaks, Semgrep and SQL lint, OSV and `npm audit`, and a placeholder scan | The workflows on develop include each scan, and their latest runs are green | `security` | BL-117 | **Partly done, in PR #30** (red team: fix first, at 76c1f26; in conflict with develop).<br>PR #30 adds gitleaks and an `npm audit` gate. Its one secrets failure came from fixtures on another branch. Those fixtures are now on develop, so the PR scan needs a PR-only scope and allowlist entries before #30 merges (CI_HEALTH 3.1).<br>No open PR has the denylist, manifest lint, Semgrep, SQL lint, OSV or the placeholder scan. Only PRs #2, #4, #30, #36 and #39 change workflows. |
| Agent fence and review rule | PRs that touch `supabase/**` or auth need the `approve-migration` label and an independent review run. Unattended runs are limited to two a day | `fence.yml` is on develop and is a required check (F3); the label exists (F6) | founder, `qa` | BL-122 | **In PR #30** (red team: fix first).<br>`fence.yml` is a label-only check on `pull_request_target`. The label is done. The author reports the review's fence finding (auth coverage) fixed in ea0affb; it has not been re-reviewed.<br>**For the founder:** BL-122 says two unattended runs a day, but `agents/roster.json` in PR #4 sets `max_runs_per_day_total` to 30. |
| Point CLAUDE.md at the backlog | A "Work selection" section, under 10 lines, links `docs/BACKLOG.md` and adds the `-bl-###-` branch pattern | `grep -n 'Work selection' CLAUDE.md` | `qa` | BL-001 | **Not started.**<br>There is no match on develop at 7cc43b1. PR #4 and PR #42 edit `CLAUDE.md` without adding it. |
| Traceability check | `scripts/trace.mjs` exists, `npm run trace` runs inside `npm test`, and it writes `docs/TRACE.md` | `npm run trace` | `qa` | BL-002 | **Not started.**<br>Since 7cc43b1, develop has a `scripts/` folder (brand, insights, ops, packs, size), but no `trace.mjs` and no `trace` script, and no open PR adds them.<br>BL-004 lists BL-002 as a dependency, but CI shipped without it. |
| Pull request template | The template has `Task: BL-###`, `Satisfies:`, `Data classes touched:`, `Budgets checked:` and `Closes #`, plus the Definition of Done checklist | `grep -n -E 'Task:\|Satisfies:\|Data classes touched:\|Budgets checked:' .github/pull_request_template.md` | `qa` | BL-003 | **Partly done.**<br>The template on develop has the checklist but none of those fields. |
| Requirement ids in test titles; database harness sections | Tests are retitled with requirement ids, JUnit output is produced, and line 92 of `data_governance.test.mjs` is marked `[KNOWN-DEFECT B-REQ-011]` | `grep -n 'KNOWN-DEFECT' supabase/tests/*.mjs` | `qa` | BL-110 | **Not started.**<br>There is no `KNOWN-DEFECT` marker on develop, and no open PR matches by scope. Ops did not audit the test titles. |
| Mobile test harness and lint | vitest covers the mobile logic and runs inside root `npm test`. Lint rules ban the listed imports and `console` in release builds. Unused `expo-symbols` and `expo-glass-effect` are removed | `npm test -w @scribe/mobile`, `npm run lint -w @scribe/mobile` | `mobile` | BL-121 | **Partly done.**<br>`@scribe/mobile` runs `vitest run` inside root `npm test`. It has an `expo lint` script, but CI does not run it, because PR #30's lint job looks for a root `lint` script and develop has none. `expo-glass-effect` is still a dependency on develop.<br>PR #29 adds more mobile tests. |

## 3. M1 gates: E1 database fix pack

PR #32 is the fix pack. Its body has an "M1 fix pack coverage" table, written at 660e633 and also posted as a comment on this PR, which the rows below quote. Its red-team review (at 18499b9, before 660e633) says "fix first", with a High finding: SECURITY DEFINER functions and RLS helpers set `search_path = pg_catalog, public` without `pg_temp` last. No review of 660e633 exists yet, and #32 is in conflict with develop. Ops did not review the SQL.

| Gate | What must be true | How to check | Owner | Backlog | Status and evidence |
|---|---|---|---|---|---|
| Parent-only invites with explicit role [Critical] | Scope as in BL-112. Access tests prove that a contributor cannot mint any invite | `npm run test:db`, plus a review against BL-112 | `data-architect` | BL-112 | **In PR #32; red team: fix first.**<br>The coverage table reports it done: parents only, explicit role, 7 or 14 days, 20 a day, `revoke_invite`, token and code stored hashed, and tests that a contributor or stranger cannot mint any invite. `p_relation` and `p_large_print` are left out (Family hidden at v1.0, decision 5). |
| Client ids for children [High] | `create_child` takes a client id and is idempotent on it, with the date checks; entries go only into live books | Same as above | `data-architect` | BL-113 | **In PR #32; red team: fix first.**<br>The coverage table reports it done: `create_child(p_id, ..., p_client_created_at)` is idempotent on the device id, a date or due date is required, and letters go only into live books. |
| Server consent gates [Critical] | Consent is enforced by RLS and the RPCs, with guards against anonymous callers | Same as above | `data-architect`, `privacy` | BL-114 | **In PR #32; red team: fix first.**<br>The coverage table reports it done with an equivalent design: the gate is computed live, with `my_sync_gate()` and `my_policy_state` instead of the three named functions, and an anonymous guard on every granted RPC and client table. |
| Policy versioning and pepper [Critical] | X-01, X-11, X-12 and X-15 as in BL-115. An empty or short pepper raises an error, and the pepper lives outside database settings | Same as above | `privacy` | BL-115 | **In PR #32; red team: fix first.**<br>The coverage table reports X-01, X-11 and X-15 tested, and the pepper read from Supabase Vault, failing closed (`SCCFG`) when missing, empty or under 32 bytes, and never read from a database setting. |
| Access-test harness [High] | The harness mirrors Supabase's default grants, the access matrix comes from personas, and an upgrade-path test exists | `npm run test:db` | `security` | BL-116 | **Partly done, in PR #32 and PR #26.**<br>#32 adds the upgrade-path test and a left-member persona (463 access-matrix checks).<br>#26 ("Merge after #32") mirrors the default grants for functions and sequences and adds `grants.test.mjs`.<br>Still open: folding `rls.test.mjs` into the matrix (WS-03). Both PRs are in conflict with develop. |
| Apply the migration pack to staging by CI | CI applies every migration to `scribe-staging` with `supabase db push` (D-041), with the pepper set as a secret, the hourly `purge_due()` cron scheduled and PITR confirmed | A green deploy run from `main`, and the applied files listed in `.github/migrations-applied.txt`; the founder confirms the Vault secrets | founder | BL-015 | **Blocked on founder.**<br>Only 2 of the 11 migrations on develop are listed as applied. Four new pending migrations arrived at 7cc43b1.<br>It needs BL-107 (the staging project, a founder task), BL-112 to BL-115 (PR #32), and F2.<br>New prerequisite from PR #32: the founder stores the Vault secrets `consent_pepper` and `invite_code_pepper` (APPLY.md step 6, in #32) and checks on staging that `postgres` can read `vault.decrypted_secrets` (Unverified until then).<br>The pipeline is in PR #36: staging deploys on a push to `main` that changes migrations, and production on a `db-v*` tag. See DEPLOY.md (in PR #36). |
| Data map is canonical [High] | `docs/legal/data-map.yaml` is the single inventory, and CI fails on any gap | `node scripts/check-data-map.mjs --strict` | `privacy` | BL-016 | **In PR #37** (the map and the checker; in conflict with develop).<br>PR #37 does not change any workflow, so the checker is not in CI yet. |
| Content rule additions and claims registry [High] | The new content rules exist, and a `claims.ts` registry with a rule that every claim string is registered | `npm test -w @scribe/content` | `content` | BL-118 | **In PR #46** ("BL-118: Content rule additions and claims registry", by `content`; red team: fix first, at b0949bc; in conflict with develop). Ops did not review it against BL-118.<br>PR #37 separately adds `docs/legal/CLAIMS.md`, a register document. |
| `child-input` flag in the prompt selector [High] | Prompt selection takes a flag (off by default) and never returns `together` prompts while it is off | `grep -rn -i -E 'childInput\|child-input' packages/core/src` | `speech` | BL-119 | **Not started.**<br>There is no match on develop at 7cc43b1 and no open PR. |
| Verifier hardening and property tests [High] | The eight meaning-changing edits from TDD 03 7.1 are rejected, and a fast-check property suite passes | `npm test -w @scribe/core` | `speech` | BL-120 | **Related work in PR #28** (in conflict with develop): a Unicode-safe verifier, a golden corpus, Devanagari negation guards, and `ENGINE_VERSION` raised from 3 to 4.<br>Full coverage is Unverified. |
| LocalStore interface and schema migrator (M1 to M2) | Every SQL call goes through `LocalStore`, with versioned migrations tested against fixture databases | `npm test -w @scribe/mobile` | `mobile` | BL-111 | **Related work in PR #29** (`store.ts` on SqlDb repositories; in conflict with develop). |

## 4. Looking ahead: release-build gates (M2, M12, M13)

These are not M1 gates. They are listed because they need founder accounts weeks in advance. Ops never touches EAS or App Store accounts.

| Gate | What must be true | How to check | Owner | Backlog | Status and evidence |
|---|---|---|---|---|---|
| EAS account and build credentials | The EAS account exists and build credentials are set up | The founder confirms in EAS | founder | BL-108 | **Blocked on founder** (BL-101, Apple Developer enrollment). |
| App identity and build configuration | `app.config.ts` is generated from `packages/brand`, and `eas.json` has development, preview and production profiles | `npx expo config --type public` in `apps/mobile` (PR #30 adds this as a CI job) | `mobile` | BL-031 (M2) | **Partly done.**<br>Both files exist on develop, and PR #27 changes both. Ops did not review them against BL-031. |
| 40 MB download budget (BRIEF decision 15) | Every release build's App Store download size is recorded and is under 40 MB | `npx tsx scripts/size/measure.ts --thinning-report "<report>"` on a release build (`docs/ops/APP_SIZE.md`), then the size in App Store Connect | `qa` (BL-285, proposed), `ops` | BL-285 (proposed in PR #47) | **Partly done: the measuring tool exists; no release build yet.**<br>Since 7cc43b1, develop has `scripts/size/measure.ts` and `docs/ops/APP_SIZE.md`. It records a JS-only measurement: an 11.6 MB Hermes bundle against a 12 MB sub-budget. The native size waits on the first EAS build.<br>PR #47 proposes BL-285 (blocked on BL-108, milestone M12). |
| C0 internal TestFlight (from week 6) | Internal and external TestFlight groups exist, with a welcome note and a content-free problem report | The TestFlight groups in App Store Connect (founder) | `qa`, founder | BL-280 | **Blocked** (BL-275). |
| Release workflow and founder checklist | A release workflow runs from `ios-v*` tags, and `docs/ops/RELEASE.md` exists | Push an `ios-v*` tag on a test branch, once the workflow exists | `qa` | BL-283 | **Blocked** (BL-275). BL-283 owns `docs/ops/RELEASE.md`; this file does not replace it. |
| Store listing and submission | The listing, privacy labels with evidence, and review notes are ready, and the build is submitted on 11 Jan | App Store Connect (founder) | founder, `content` | BL-286 (M13) | **Blocked** (BL-104, BL-231, BL-280 exit). |

## 5. Suggested order for the founder

Each step names what blocks it today. A "fix first" verdict clears only when a new red-team review of the PR's latest head says `ship`.

1. **Fix the secrets scan** (CI_HEALTH fix 1).
   - Blocked by: nothing. `security` proposes the change and triages the findings; the founder applies it in PR #30, because agents cannot edit `.github/`.
   - Done when: PR scans cover only the PR's own commits, the 5 fixture findings on develop are allowlisted with reasons, and `security` confirms none is a live credential.
2. **Finish and merge PR #30** (CI hardening).
   - Blocked by:
     - a merge conflict with develop, so no checks have run at its head, ea0affb;
     - the red-team verdict "fix first", at 76c1f26. The author reports findings 2 and 3 fixed in ea0affb, with no review since. Findings 1 and 4 are founder items: branch protection (step 4), and confirming that the one migration exception pins the reviewed content;
     - step 1;
     - develop's new `functions` CI job, which needs the same runner and action pins.
   - Then: green checks at the new head, a new red-team review that says `ship`, and the approve-migration review (D-041). Release PR #2's migration guard should pass after this merge.
3. **Merge release PR #2** (develop into main), so that `main` has the workflows (F2).
   - Blocked by: step 2, because its guard fails until #30's exception is on develop.
   - Note: PR #2 carries all of develop, including the 3 Oct wave. Develop's only workflows are `ci.yml` and `migration-guard.yml`, so no workflow applies a migration when it merges while PR #36 is unmerged. Whether a Supabase dashboard integration is connected is Unverified: ops never reads remote projects.
4. **Turn on branch protection** on `develop` and `main` (F3).
   - Blocked by: nothing; it can be done at any time. Add `fence` to the required checks after step 2.
5. **Finish and merge the fix pack**: PR #32, then PR #26 ("Merge after #32").
   - Blocked by:
     - merge conflicts with develop, on both;
     - the red-team verdict "fix first" on #32, at 18499b9, with a High finding (the `search_path` gap in SECURITY DEFINER functions). The head has moved to 660e633 with no new review. #26 has no review;
     - the approve-migration review (D-041) on each.
   - Then: green checks, a `ship` review, approve-migration, merge.
6. **Decide on visibility and the Actions budget** (F7), then set up F4 and F5.
   - Blocked by: nothing for the decision. F4 and F5 are of no use before step 7.
7. **Merge PR #4, #39 and #42 in that order** (F1), then open a second release PR, so that the agents schedule runs from `main`.
   - Blocked by:
     - no red-team review on any of the three yet;
     - PR #33's prerequisites: steps 4 and 6, and F5.
   - Apply the pin patch in this PR's body (CI_HEALTH fix 4) before or with the merge.
8. **Apply the pack to staging by CI** (BL-015), through PR #36.
   - Blocked by: BL-107 (the staging project), step 5, the two Vault secrets, and PR #36 itself.
   - Caution: once PR #36 is merged, any release PR that changes migrations deploys them to staging. So merge PR #36 only after step 5.

Related ops docs:
- RUNBOOKS.md, SECRETS.md, ENVIRONMENTS.md, INCIDENT.md and MODEL_HOSTING.md (in PR #35);
- DEPLOY.md (in PR #36);
- on develop since 7cc43b1: `docs/ops/README.md` (deletion pipeline and infrastructure), APP_SIZE.md, SECURITY.md, DOMAINS.md and `runbooks/`.
