# Release readiness: M1 Guardrails and the security migration pack

Owner: `ops`. Run `sess-202610031917`. As of 2026-10-03 19:31 UTC.

Every status below comes from one of these sources at that time:
- the repository on `origin/develop`;
- the open pull requests;
- GitHub's REST API.

Refresh the statuses before relying on them. CI evidence is in [CI_HEALTH.md](CI_HEALTH.md).

## Which milestone, and how to read this

- **Why M1.** In `docs/ROADMAP.md` section 2, M0 (founder long poles, weeks 1 to 3) and M1 (weeks 1 to 2, 5 to 16 Oct 2026) both start in week 1. M1 exits first and carries the CI and release-engineering gates.
  - This checklist covers M1, plus the founder-only gates that block it today.
  - M0 items appear only where they gate M1.
- **M1 exit criteria** (ROADMAP): "CI and branch protection on; agent fence for `supabase/` and auth (D-041); one fix pack applied to staging by CI: parent-only invites with explicit role, client ids for children, server consent gate, policy-version fix, pepper fail-closed; test retitles; content-rule additions; `child-input` flag in core; verifier hardening".
- **Backlog source:** `docs/BACKLOG.md`, heading "M1. Guardrails and the security migration pack (weeks 1 to 2)". It has two sections: E0 (workflow guardrails) and E1 (database integrity, governance and the fix pack).
- **Status words:** done, partly done, in PR #n, not started, blocked on founder.
- **Caveats:**
  - The backlog status lines on develop predate today's PRs. For example, BL-004 still says `ready`.
  - The founder's open PRs cite workstream and finding ids, not BL ids. So "PR #n" below is a match by scope unless the PR names the id.
  - Ops did not review those PRs' code against each task's Definition of Done.

## Summary

- **Done:** CI on develop (BL-004) and the `approve-migration` label.
- **In a PR, or partly done:**
  - BL-003, BL-117, BL-121 and BL-122 among the guardrails;
  - BL-016, BL-111, BL-112 to BL-116 and BL-120 in the fix pack.
- **Not started:** BL-001, BL-002, BL-110, BL-118 (in code) and BL-119.
- **Blocked on founder:**
  - every gate in section 1;
  - BL-015 (apply the pack to staging by CI).
- **Biggest risk to the M1 exit on 16 Oct:** the apply-to-staging step. It needs a staging project (BL-107), workflows on `main` (F2) and the deploy pipeline (PR #36), all founder steps.

## 1. Founder-only gates open now

| # | Gate | What must be true | How to check | Owner | Backlog | Status and evidence |
|---|---|---|---|---|---|---|
| F1 | Merge PR #4 (agent harness), then PR #39 (stacked on #4), then PR #42 (stacked on #39) | All three merged into `develop`, in that order | `gh api repos/thesaurabhpareek/earlyletters/pulls/4 --jq .merged`, then 39 and 42 | founder | none (ADR 0014 to 0017) | **Blocked on founder.**<br>All three are open with green checks at their heads (CI_HEALTH section 2). PR #39 says "Merge #4 first".<br>PR #33 records the harness prerequisites: a private repository on GitHub Pro, branch protection plus the `approve-migration` gate, and the agents' own GitHub identity. |
| F2 | Workflows on `main`: release PR #2 (develop into main) | `main` contains `.github/workflows/`; PR #2 is merged with green checks | `git ls-tree -r --name-only origin/main -- .github` (empty today) | founder | BL-004 | **Blocked on founder, and on PR #30.**<br>PR #2's migration guard fails until PR #30's reviewed exception reaches develop (CI_HEALTH 3.2).<br>GitHub runs scheduled workflows "on the default branch only" ([docs](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)). The default branch is `main`, so the agents schedule also needs a second release PR after F1. |
| F3 | Branch protection on `main` and `develop` | Pull request required, plus these required checks: `required`, `applied migrations unchanged`, and `fence` once PR #30 merges. Also linear history, and no force pushes or deletions (`.github/README.md`) | `gh api repos/thesaurabhpareek/earlyletters/branches/main/protection --jq '.required_status_checks.checks'`, and the same for `develop` | founder | M1 exit criterion; BL-004, BL-122 | **Not started.**<br>Both branches return HTTP 404 "Branch not protected", and `gh api repos/thesaurabhpareek/earlyletters/rulesets` returns `[]`.<br>Both check names already exist, because both workflows have run. |
| F4 | `OPENROUTER_API_KEY` secret, on a key with a monthly budget (and zero data retention, per PR #4) | The secret is set; the key has a spend limit | `gh secret list --repo thesaurabhpareek/earlyletters` (founder); the limit is in the key's OpenRouter settings | founder | none (PR #4, "Before it runs") | **Blocked on founder.**<br>Whether it is set is Unverified: ops does not read secrets. It is of no use before F1 and F2. |
| F5 | Agents GitHub App | The App has no Workflows or Administration permission (PR #4). Variable `AGENTS_APP_CLIENT_ID` and secret `AGENTS_APP_PRIVATE_KEY` are set. Variable `AGENTS_BOT_LOGINS` holds the bot login (PR #39) | `gh variable list` and `gh secret list` with `--repo thesaurabhpareek/earlyletters` (founder); permissions on the App's settings page | founder | none | **Blocked on founder.** Unverified, for the same reason as F4. |
| F6 | `approve-migration` label | The label exists | `gh api repos/thesaurabhpareek/earlyletters/labels/approve-migration --jq .name` | founder | BL-122 | **Done.** The label exists (checked through REST). |
| F7 | Repository visibility and the Actions budget | The decision on private or public is made knowing the minutes it costs | `gh api repos/thesaurabhpareek/earlyletters --jq .visibility` | founder | none (PR #33) | **Blocked on founder.**<br>The repository is public today, so Actions on standard runners is free.<br>On GitHub Pro, the harness alone would exceed the 3,000 included minutes, and without a payment method Actions stops at the quota (CI_HEALTH section 5, cited). |

## 2. M1 gates: E0 workflow guardrails

| Gate | What must be true | How to check | Owner | Backlog | Status and evidence |
|---|---|---|---|---|---|
| Continuous integration [Critical] | CI runs on every pull request and every push to `develop` and `main`, within the time budget, with no secrets | `gh api 'repos/thesaurabhpareek/earlyletters/actions/runs?branch=develop&event=push&per_page=5' --jq '.workflow_runs[] \| [.name, .conclusion] \| @tsv'` | `qa` | BL-004 | **Done on develop.**<br>`ci.yml` has been there since 3bf45a0, and all 3 develop pushes passed. A green run takes 1m 35s at the median.<br>Not on `main` yet (F2). The backlog line still says `ready`, Node 20 and under 8 minutes; CI actually uses Node 22 with a 10-minute budget. |
| CI security and platform scans [High] | CI runs all of these: an SDK and import denylist, manifest lint, gitleaks, Semgrep and SQL lint, OSV and `npm audit`, and a placeholder scan | The workflows on develop include each scan, and their latest runs are green | `security` | BL-117 | **Partly done, in PR #30.**<br>PR #30 adds gitleaks over the full history and an `npm audit` gate. Its secrets scan reports 3 redacted findings (CI_HEALTH 3.1).<br>No open PR has the denylist, manifest lint, Semgrep, SQL lint, OSV or the placeholder scan. |
| Agent fence and review rule | PRs that touch `supabase/**` or auth need the `approve-migration` label and an independent review run. Unattended runs are limited to two a day | `fence.yml` is on develop and is a required check (F3); the label exists (F6) | founder, `qa` | BL-122 | **In PR #30.**<br>`fence.yml` is a label-only check on `pull_request_target`. The label is done.<br>**For the founder:** BL-122 says two unattended runs a day, but `agents/roster.json` in PR #4 sets `max_runs_per_day_total` to 30. |
| Point CLAUDE.md at the backlog | A "Work selection" section, under 10 lines, links `docs/BACKLOG.md` and adds the `-bl-###-` branch pattern | `grep -n 'Work selection' CLAUDE.md` | `qa` | BL-001 | **Not started.**<br>There is no match on develop. PR #4 and PR #42 edit `CLAUDE.md` without adding it. |
| Traceability check | `scripts/trace.mjs` exists, `npm run trace` runs inside `npm test`, and it writes `docs/TRACE.md` | `npm run trace` | `qa` | BL-002 | **Not started.**<br>Develop has no `scripts/` folder, and no open PR adds `trace.mjs`.<br>BL-004 lists BL-002 as a dependency, but CI shipped without it. |
| Pull request template | The template has `Task: BL-###`, `Satisfies:`, `Data classes touched:`, `Budgets checked:` and `Closes #`, plus the Definition of Done checklist | `grep -n -E 'Task:\|Satisfies:\|Data classes touched:\|Budgets checked:' .github/pull_request_template.md` | `qa` | BL-003 | **Partly done.**<br>The template on develop has the checklist but none of those four fields. |
| Requirement ids in test titles; database harness sections | Tests are retitled with requirement ids, JUnit output is produced, and line 92 of `data_governance.test.mjs` is marked `[KNOWN-DEFECT B-REQ-011]` | `grep -n 'KNOWN-DEFECT' supabase/tests/*.mjs` | `qa` | BL-110 | **Not started.**<br>There is no `KNOWN-DEFECT` marker on develop, and no open PR matches by scope. Ops did not audit the test titles. |
| Mobile test harness and lint | vitest covers the mobile logic and runs inside root `npm test`. Lint rules ban the listed imports and `console` in release builds. Unused `expo-symbols` and `expo-glass-effect` are removed | `npm test -w @scribe/mobile`, `npm run lint -w @scribe/mobile` | `mobile` | BL-121 | **Partly done.**<br>`@scribe/mobile` runs `vitest run` inside root `npm test` (31 tests, per CLAUDE.md). It has an `expo lint` script, but CI does not run it, because PR #30's lint job looks for a root `lint` script.<br>PR #29 adds more mobile tests. |

## 3. M1 gates: E1 database fix pack

| Gate | What must be true | How to check | Owner | Backlog | Status and evidence |
|---|---|---|---|---|---|
| Parent-only invites with explicit role [Critical] | Scope as in BL-112. Access tests prove that a contributor cannot mint any invite | `npm run test:db`, plus a review against BL-112 | `data-architect` | BL-112 | **Related work in PR #32.**<br>PR #32 makes `create_child_invite` idempotent with an explicit role and the 20-a-day limit, on top of the pending migrations on develop.<br>Whether it covers the full scope is Unverified by ops. |
| Client ids for children [High] | `create_child` takes a client id and is idempotent on it, with the date checks; entries go only into live books | Same as above | `data-architect` | BL-113 | **Related work in PR #32.**<br>`create_child(p_id, ...)` is idempotent on the device id. Full coverage is Unverified. |
| Server consent gates [Critical] | Consent is enforced by RLS and the RPCs, with guards against anonymous callers | Same as above | `data-architect`, `privacy` | BL-114 | **Related work in PR #32.**<br>PR #32 says the consent gate (SCCON) is unchanged by it. Full coverage is Unverified. |
| Policy versioning and pepper [Critical] | X-01, X-11, X-12 and X-15 as in BL-115. An empty or short pepper raises an error, and the pepper lives outside database settings | Same as above | `privacy` | BL-115 | **Related work in PR #32** (`record_policy_act` is idempotent).<br>Whether the pepper move is done is Unverified. |
| Access-test harness [High] | The harness mirrors Supabase's default grants, the access matrix comes from personas, and an upgrade-path test exists | `npm run test:db` | `security` | BL-116 | **In PR #26**, which is stacked on PR #32.<br>It mirrors the default grants for functions and sequences and adds `grants.test.mjs`.<br>PR #32's body counts 463 access-matrix cases. |
| Apply the migration pack to staging by CI | CI applies every migration to `scribe-staging` with `supabase db push` (D-041), with the pepper set as a secret, the hourly `purge_due()` cron scheduled and PITR confirmed | A green deploy run from `main`, and the applied files listed in `.github/migrations-applied.txt` | founder | BL-015 | **Blocked on founder.**<br>Only 2 of the 7 migrations on develop are listed as applied.<br>It needs BL-107 (the staging project, a founder task), BL-112 to BL-115, and F2.<br>The pipeline is in PR #36: staging deploys on a push to `main` that changes migrations, and production on a `db-v*` tag. See DEPLOY.md (in PR #36). |
| Data map is canonical [High] | `docs/legal/data-map.yaml` is the single inventory, and CI fails on any gap | `node scripts/check-data-map.mjs --strict` | `privacy` | BL-016 | **In PR #37** (the map and the checker).<br>PR #37 does not change any workflow, so the checker is not in CI yet. |
| Content rule additions and claims registry [High] | The new content rules exist, and a `claims.ts` registry with a rule that every claim string is registered | `npm test -w @scribe/content` | `content` | BL-118 | **Not started in code.**<br>PR #37 adds `docs/legal/CLAIMS.md`, a register document. It is not the code registry and rules this task asks for. |
| `child-input` flag in the prompt selector [High] | Prompt selection takes a flag (off by default) and never returns `together` prompts while it is off | `grep -rn -i -E 'childInput\|child-input' packages/core/src` | `speech` | BL-119 | **Not started.**<br>There is no match on develop and no open PR. |
| Verifier hardening and property tests [High] | The eight meaning-changing edits from TDD 03 7.1 are rejected, and a fast-check property suite passes | `npm test -w @scribe/core` | `speech` | BL-120 | **Related work in PR #28**: a Unicode-safe verifier, a golden corpus, Devanagari negation guards, and `ENGINE_VERSION` raised from 3 to 4.<br>Full coverage is Unverified. |
| LocalStore interface and schema migrator (M1 to M2) | Every SQL call goes through `LocalStore`, with versioned migrations tested against fixture databases | `npm test -w @scribe/mobile` | `mobile` | BL-111 | **Related work in PR #29** (`store.ts` on SqlDb repositories). |

## 4. Looking ahead: release-build gates (M2, M12, M13)

These are not M1 gates. They are listed because they need founder accounts weeks in advance. Ops never touches EAS or App Store accounts.

| Gate | What must be true | How to check | Owner | Backlog | Status and evidence |
|---|---|---|---|---|---|
| EAS account and build credentials | The EAS account exists and build credentials are set up | The founder confirms in EAS | founder | BL-108 | **Blocked on founder** (BL-101, Apple Developer enrollment). |
| App identity and build configuration | `app.config.ts` is generated from `packages/brand`, and `eas.json` has development, preview and production profiles | `npx expo config --type public` in `apps/mobile` (PR #30 adds this as a CI job) | `mobile` | BL-031 (M2) | **Partly done.**<br>Both files exist on develop, and PR #27 changes both. Ops did not review them against BL-031. |
| 40 MB download budget (BRIEF decision 15) | Every release build's App Store download size is recorded and is under 40 MB | Unverified until the first build exists. Expected: the per-build size report in App Store Connect | `ops` (the check), `product` (a task) | none yet | **Not started.**<br>No release build exists. `product` should add a backlog task, so the measurement lands with BL-283. |
| C0 internal TestFlight (from week 6) | Internal and external TestFlight groups exist, with a welcome note and a content-free problem report | The TestFlight groups in App Store Connect (founder) | `qa`, founder | BL-280 | **Blocked** (BL-275). |
| Release workflow and founder checklist | A release workflow runs from `ios-v*` tags, and `docs/ops/RELEASE.md` exists | Push an `ios-v*` tag on a test branch, once the workflow exists | `qa` | BL-283 | **Blocked** (BL-275). BL-283 owns `docs/ops/RELEASE.md`; this file does not replace it. |
| Store listing and submission | The listing, privacy labels with evidence, and review notes are ready, and the build is submitted on 11 Jan | App Store Connect (founder) | founder, `content` | BL-286 (M13) | **Blocked** (BL-104, BL-231, BL-280 exit). |

## 5. Suggested order for the founder

1. `security` triages the 3 secrets-scan findings on PR #30 (CI_HEALTH 3.1).
2. Merge PR #30 after its approve-migration review. Release PR #2's migration guard should then pass.
3. Merge PR #2, so that `main` has the workflows (F2).
4. Turn on branch protection on `develop` and `main` (F3).
5. Decide on visibility and the Actions budget (F7), then F4 and F5.
6. Merge PR #4, #39 and #42 in that order (F1). Then open a second release PR, so the agents schedule runs from `main`.

Related ops docs:
- RUNBOOKS.md, SECRETS.md, ENVIRONMENTS.md, INCIDENT.md and MODEL_HOSTING.md (in PR #35);
- DEPLOY.md (in PR #36).
