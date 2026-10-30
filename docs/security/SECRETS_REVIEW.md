# Release secrets and permissions review (RA-01-01)

Status: S01 review of the release automation plan (`docs/release/AUTOMATION.md` revision 2 and ADR 0026, on `develop` at c9a192d), Fri 16 Oct 2026. Package RA-01-01 (AUTOMATION.md section 5): done before any secret is added. File owner: S01 (`docs/security/**`). Revised Fri 23 Oct 2026 on #206: an owner and a "By" for every fix, from the content review (comment 6247630897), and the staging rows moved to the 17 Oct rule, from the correctness review (comment 6247806622).

This file is a review and a checklist. Nothing here sets, reads or changes a secret, a variable, an environment or a setting; agents never do (AUTOMATION.md 2.11). Every value named below is a name only.

**Verdict: add no secret yet, except the one reissue in section 1.** The settings read back on 16 Oct show nothing in place yet: `develop` and `main` are unprotected, there are no rulesets, and the default branch is still `main`. No environment the plan names can be confirmed, because agents cannot read environments (section 2). One pull request path reads secrets today (SR-1). Section 9 lists each secret with what must happen before it is added. Section 8 is the founder's read-back, which replaces the rows marked [U].

Labels, as in AUTOMATION.md:
- **[V]** verified on 16 Oct 2026 in the vendor's own documentation source; section 12 names each one.
- **[V-S01]** verified by the S01 reviewer of #185 (comments 6222183586 and 6223027884).
- **[R]** read from this repository, its 175 remote branches or the public GitHub API on 16 Oct.
- **[U]** unverified, with what would confirm it. **[A]** an assumption we act on. **[Rec]** a recommendation.

**Dates.** Each "By" is a day in Pacific time from the alpha calendar: AUTOMATION.md 0.2 and section 6, and #152 section 2.2 (`docs/release/ALPHA_PLAN.md`, open). Where a gate exists, the "By" names it, because the calendar can move. A planned day that has passed is marked overdue unless the repository records it as done; its gate still holds. The calendar is itself under review: build 2 freeze is planned for Tue 27 Oct, 5:00 AM PDT (12:00 UTC). The coordinator's proposal of 23 Oct, not in the repo, moves it to Tue 3 Nov, 5:00 AM PST, which is 13:00 UTC: daylight time ends Sun 1 Nov, so 12:00 UTC that day would be 4:00 AM PST. The founder decides by Sat 24 Oct, 5:00 PM PT. "After the alpha" means after the go/no-go (planned Thu 29 Oct); those items get a day in the post-alpha re-plan (D-106). Facts marked [R, 23 Oct] were read on Fri 23 Oct.

## 1. Do this now: reissue the repository `EXPO_TOKEN` from a robot user

This is the security reviewer's note on #185 (comment 6223027884): reissue the kept repository `EXPO_TOKEN` from an Expo robot user now, and revoke the original.

Why now:
- **Every writer can read a repository secret.** "Any user with write access to your repository has read access to all secrets configured in your repository" [V2b]. A workflow pushed on any branch runs [V1] and reads it, and so does any pull request from a branch of this repository; only runs from forks are refused [V2d]. Branch protection does not change this. Every agent session has write access.
- **The original may be personal.** It was made for TESTFLIGHT.md step 1 ("Expo account, Access tokens") [R: `.github/workflows/testflight.yml` header]. A personal access token "applies to all content on your Personal Account, as well as any Personal Accounts or Organizations that you have been granted access to" [V37].
- **A robot is contained.** A robot user "cannot sign in to any Expo products, cannot own any projects themselves, and can only authenticate via an access token", and it takes a role [V37]. Revoking its token touches nothing else.

**Owner:** founder. **By:** overdue (asked for on Fri 16 Oct; section 11 still shows it pending). At the latest before AF-07 creates `testflight` (overdue, planned Wed 21 Oct, AUTOMATION 0.2 row 11), which takes a token from the same robot.

Steps (founder, about 10 minutes):
1. In the Expo account that owns the project, create a robot user, for example `gha-testflight`, with the **Developer** role. Then create one access token for it.
   - Expo describes roles for Organization accounts [V37]. Whether a robot in a personal account can hold a role is [U]; if the screen offers no role, create an organization first.
   - A robot token also needs `owner` in the app config (`docs/ops/RELEASE.md`, BL-339) [R].
2. In GitHub, go to Settings, Secrets and variables, Actions, Repository secrets. Update `EXPO_TOKEN` with the robot's token. The name stays the same, so #145's workflow needs no change.
3. In Expo, open Access tokens (expo.dev/settings/access-tokens) and delete the original token [V37: "delete the token you want to revoke"].
4. On your own computer, run `EXPO_TOKEN=<new token> npx eas-cli@24.10.0 whoami`. It should name the robot, not you [U: exact output].
5. Add a line to the log in section 11: the date and the robot's name, never the value.

When AF-07 creates the `testflight` environment (overdue, planned Wed 21 Oct), give it a **new** token for the same robot. When AF-22 deletes the repository secret (after the alpha), revoke the interim token as well. The value that was readable from every branch then stops working.

## 2. What the settings show today [R]

Read on 16 Oct 2026 through the public GitHub API (no credential), the GitHub connector and `git`.

| Setting | Read back | Needed by |
|---|---|---|
| Default branch | `main` | AF-05 sets `develop`, after RA-20-02a |
| Branch protection, `develop` and `main` | `protected: false`; no required checks | AF-03 |
| Rulesets (repository and branch rules) | none; `rules/branches/develop` and `rules/branches/main` are empty | AF-23 |
| Tags | none | n/a |
| Secret scanning; push protection | enabled; enabled | AF-24 confirms; nothing to do |
| Dependabot security updates | disabled | AF-24 |
| Secret scanning non-provider patterns; validity checks | disabled; disabled | AF-24 tries both. Whether they can be turned on for a user-owned public repository on Free is [U] |
| Workflows GitHub knows about | 9: `agents-check`, `ci`, `claude`, `db-cli`, `ios-compile`, `migration-guard`, `security`, `web-e2e`, `web`. `agents.yml`, `deploy-db.yml`, `nightly.yml` and `testflight.yml` have never run | AF-05 |
| `claude.yml` runs | one, on `pull_request_review` for #112 (run 38662061209, 15 Oct), skipped by its `if:` | SR-1 |
| GitHub environments that exist | `Production` and `Preview`, made by the Vercel integration's deployments; a lowercase `production` query returns the `Production` deployments | SR-2 |
| Environments, their rules and secrets; repository secrets and variables; Actions permissions | **not readable by agents**: the session proxy refuses `/environments`, `/actions/secrets`, `/actions/variables` and `/actions/permissions` | section 8 |

So none of AF-02 (approver), AF-03 (branch protection), AF-07 (first environments) or AF-23 (rulesets) is in force today. Until AF-02 is in force, every approval in the plan is a policy, not a control (AUTOMATION.md, first paragraph).

## 3. Findings this review adds to the plan

AUTOMATION.md revision 2 already carries the fixes from #185's two reviews. These findings are new. Each fix names its owner (for a file, the file's owner) and a "By".

**SR-1. `claude.yml` reads secrets on pull request events today.** Severity: High, if the secrets exist.
- **What it does.** `claude.yml` triggers on `pull_request_review` and `pull_request_review_comment` as well as `issue_comment` and `issues` [R]. Review events run the workflow file from the pull request's merge commit, with `GITHUB_REF` set to `refs/pull/<n>/merge` [V1, V34]. The job reads `ANTHROPIC_API_KEY` and `CLAUDE_CODE_OAUTH_TOKEN` [R] with `contents: write` and `id-token: write`.
- **Who can reach it.** Any branch of this repository can change `claude.yml` in its own pull request and trigger it with a review. It ran on #112 on 15 Oct [R].
- **The plan is wrong on this.** AUTOMATION.md 1.1 and ADR 0026 context item 3 say `claude.yml` "goes live when the default branch changes". That holds for `issue_comment` and `issues` only.
- **Fix, S20 in RA-20-02a.** By: overdue (planned Mon 19 Oct, AUTOMATION section 6, window 2; both review triggers are still in `claude.yml` on `develop` [R, 23 Oct]). It must land before AF-05 makes `develop` the default branch (AUTOMATION 0.2 row 9, overdue, planned by Wed 21 Oct; the default branch is still `main` [R, 23 Oct]). The fix:
  - remove the two review triggers;
  - replace `./.github/actions/setup` with no install, or with `npm ci` (SR-9);
  - correct 1.1 and the ADR's context item.

  Once the secrets live in the `agents` environment, review-triggered runs are refused by its `develop` ref rule anyway [V2]. Removing the triggers keeps them from failing red on every review.
- **Fix, founder.** Do not add either Anthropic secret as a repository secret. If one exists, delete it now (section 8 shows whether it does). By: at the section 8.2 read-back, overdue (planned Mon 19 Oct with AF-02 and AF-03, AUTOMATION 0.2 row 5).

**SR-2. The plan's `production` environment already exists as Vercel's `Production`.** Severity: Medium. It blocks `SUPABASE_DB_URL_PROD`.
- **What exists.** The Vercel integration records its deployments in GitHub environments `Production` and `Preview`. Querying deployments for `production` returns the `Production` ones [R], so the API matches environment names without regard to case.
- **The clash.** The database environment `deploy-db.yml` names (`environment: production` [R]) most likely binds to that same Vercel environment [A; section 8.1 confirms it if the list shows one `Production` and no separate `production`]. Giving it a `db-v*`-tag-only rule may refuse Vercel's deployment records for `main` [U: whether GitHub applies branch rules to deployments an app creates through the API]. Leaving it open defeats the rule.
- **Fix, S20:** rename the database environment `db-production` in:
  - `deploy-db.yml`;
  - `docs/ops/DEPLOY.md`;
  - AUTOMATION.md 2.0;
  - ADR 0026 decision 5.

  By: before AF-42 and before `SUPABASE_DB_URL_PROD` is added (both after the alpha). #236 carries the `deploy-db.yml` and AUTOMATION.md 2.0 parts. `staging` does not clash. The drift job's expected file (RA-20-12) lists `Production` and `Preview` too, so that a secret added to either one shows up.

**SR-3. A tag runs its own workflow file, and the approver cannot push tags.** Severity: Medium.
- **How a tag run works.** A push of `db-v*` or `ios-v*`, or a push to `release/*`, runs the workflow file at that commit. Every agent session can create those refs today: there are no rulesets [R]. So the job's own "tag must point at a commit on main" step [R: `deploy-db.yml`] is not a control, because a modified workflow drops it. For `production` (`db-production`) and `app-store`, the approver's click is the only control.
- **Why a ruleset does not help.**
  - The approver cannot push the tags themselves. With "Prevent self-review" on, "users who initiate a deployment cannot approve the deployment job" [V2], so they could never approve their own run.
  - A ruleset cannot tell the coordinator from other agent sessions, because they use the same account.
- **Fix, founder.** The approver runs the check in section 5 before every click. AF-23 still makes sense for immutability: restrict updates and deletions of `db-v*` and `ios-v*` tags [Rec]. By: the check from the first approval in any environment (the first `staging` run after AF-07, overdue, planned Wed 21 Oct, AUTOMATION 0.2 row 11); AF-23 after the alpha (AUTOMATION section 4).
- **Fix, S20.** `docs/ops/DEPLOY.md` section 3 puts "repository admin (you)" on the tag ruleset's bypass list. That is the account agents use, so it should not be presented as a gate. By: before any tag ruleset is created (DEPLOY.md section 3, or AF-23 after the alpha); the line is still there [R, 23 Oct].

**SR-4. `docs/ops/DEPLOY.md` section 2 contradicts AF-02 and AF-07.** Severity: Medium.
- It says:
  - staging needs "No reviewers";
  - staging's branch rule is `main` only;
  - for production, "Leave 'Prevent self-review' off while you are the only reviewer".
- A founder who follows DEPLOY.md gets the weaker setup.
- **Fix, S20.** Point DEPLOY.md section 2 at AUTOMATION.md AF-02 and AF-07 (approver only, prevent self-review on, admin bypass off, staging ref `develop` only, as DEPLOY.md and AUTOMATION.md 2.0 have said since 17 Oct). By: before AF-07 (planned Wed 21 Oct, AUTOMATION 0.2 row 11), so overdue. DEPLOY.md section 2 now names a reviewer and `develop` only, but still says to leave "Prevent self-review" off; AF-07's own row in AUTOMATION.md section 4 still says `develop` and `main` [R, 23 Oct].

**SR-5. Variables that secret-holding jobs read can be changed without review.** Severity: Medium.
- Repository and environment variables are changed in Settings, which the owner credential in every agent session can reach [V-S01]. A variable change also leaves no pull request.
- `EAS_CLI_VERSION` decides which package runs next to `EXPO_TOKEN`.
- **Fix, S20 in RA-20-06.** By: with RA-20-06 (after the alpha), and before a secret-holding job reads any of these variables. The fix:
  - keep the eas-cli pin in a reviewed file (the workflow's `env:` or a file under `.github/`);
  - if it stays a variable, pass it through `env:` and refuse anything but `^[0-9]+\.[0-9]+\.[0-9]+$`;
  - give `EAS_IOS_BUILD_CAP` (digits only) and `NIGHTLY_PROFILE` (`testflight` or `preview` only) the same treatment.
- `R17_PASSED` is not a control on its own; the approver's click in `testers` is (section 4.4).

**SR-6. `ASC_REVIEW_CONTACT_JSON` is structured data.** Severity: Low.
- GitHub's guidance: "do not use a blob of JSON, XML, or YAML ... to encapsulate a secret value, as this significantly reduces the probability the secrets will be properly redacted" [V2b]. The value is the founder's own contact details, which would land in a public log.
- **Fix, S20 on #110.** Either split the value into one secret per field, or write `::add-mask::` for each field right after parsing and before any step prints. By: before #110 merges and before `ASC_REVIEW_CONTACT_JSON` is added (store lane, after the alpha).

**SR-7. Database URLs: mask the decoded password too.** Severity: Low.
- The URL is percent-encoded (DEPLOY.md step 5) [R]. GitHub masks only exact matches, and a transformed value must be registered separately [V2b]. A CLI error that prints the decoded password would not be masked.
- **Fix, S20 in RA-20-04.** Before the CLI runs, a step decodes the password and writes it with `::add-mask::`. The same applies to `SUPABASE_LINT_DB_URL_STAGING` in `advisors.yml`. By: before `SUPABASE_DB_URL_STAGING` is added (AF-07, planned Wed 21 Oct, AUTOMATION 0.2 row 11), so overdue. RA-20-04 merged in #205 on Sun 18 Oct without it, and neither `deploy-db.yml` nor `deploy-functions.yml` masks the decoded password [R, 23 Oct]. For `advisors.yml`, with RA-20-12 (after the alpha).

**SR-8. A function-deploy token is worth the whole staging backend.** Severity: Medium.
- Code deployed with `SUPABASE_ACCESS_TOKEN_STAGING` runs with every function secret and the service role [A: Edge Functions read their secrets from the environment, `docs/ops/SECURITY.md` section 1]. That covers `TOKEN_KEK_V<n>`, the Apple keys and the Resend key.
- **Fix, founder** (who issues and adds every value, section 4). By: before `SUPABASE_ACCESS_TOKEN_STAGING` is added to any environment. The first function deploys it could serve are AF-13's (overdue, planned Thu 22 Oct, AUTOMATION 0.2 row 12).
  - Put the token only in `staging`, which has an approver, never in `health` or `agents`. S20's `deploy-functions.yml` reads it only in its `staging` job [R, 23 Oct].
  - Use a scoped token with an expiry.
  - For the alpha, prefer the "NOT DEPLOYED" path: functions deploy from the founder's computer (AUTOMATION.md 2.2) [Rec].

**SR-9. Two secret-holding jobs restore a cached `node_modules`.** Severity: Medium.
- **The rule.** AUTOMATION.md 2.0 says secret-holding jobs run `npm ci` without the restored `node_modules`.
- **Who breaks it.** `claude.yml` (job `claude`) and `agents.yml` (job `run`) both use `./.github/actions/setup`, which restores it [R]. A run restores caches written on its own branch or the default branch [V-cache], and today anyone can push to either.
- **Who complies:**
  - `testflight.yml` on `develop` and on #145: setup-node's download cache, then `npm ci`;
  - `release-ios.yml` on #110, jobs `build` and `metadata`: "Install from the lockfile, no cache";
  - `deploy-db.yml`: no install at all [R].
- **Fix, S20.** RA-20-02a for `claude.yml`; the `agents` move for `agents.yml`. By: `claude.yml` with RA-20-02a (overdue, planned Mon 19 Oct); `agents.yml` with the `agents` move (AF-22, after the alpha) and before `AGENTS_ENABLED` is turned on.

**SR-10. Unpinned actions in secret-holding jobs.** Severity: Medium.
- Each of these actions either receives a secret or runs before a step that does, in the same job [R]:
  - `anthropics/claude-code-action@v1`, in `claude.yml` and `agents.yml`;
  - `actions/create-github-app-token@v3`, in `agents.yml`;
  - `actions/checkout@v4` and `actions/setup-node@v4`, in `testflight.yml` on `develop` and on #145;
  - `actions/setup-node@v4` and `actions/cache/restore@v4`, inside `.github/actions/setup`.
- `release-ios.yml` on #110 and `deploy-db.yml` pin by SHA [R].
- **Fix, S20.** RA-20-06a for `testflight.yml` before its environment secret; RA-20-02a for `claude.yml`; RA-20-03c for the rest. By: RA-20-06a before the `testflight` `EXPO_TOKEN` is added (AF-07, overdue, planned Wed 21 Oct); #145 merged on Fri 23 Oct, 7:37 AM PT, without it, so it is now a follow-up to `testflight.yml` on `develop` [R, 23 Oct]. RA-20-02a overdue (planned Mon 19 Oct); RA-20-03c after the alpha.

**SR-11. Any branch can create an environment.** Severity: Low.
- "Running a workflow that references an environment that does not exist will create an environment with the referenced name ... the newly created environment will not have any protection rules or secrets configured. Anyone that can edit workflows in the repository can create environments via a workflow file" [V2c].
- **Fix, founder.** Create each environment with its rules before any secret, and before the first workflow that names it runs. Then read it back (section 8). By: `staging` and `testflight` with AF-07 (overdue, planned Wed 21 Oct, AUTOMATION 0.2 row 11); the others with AF-22 (after the alpha). For `staging` this is already late: jobs that name it ran on Sun 18 Oct and Fri 23 Oct with no approval (section 8.1).
- **Fix, S20 in RA-20-12.** The drift job raises an issue for any environment that is not in the expected file. By: with RA-20-12 (after the alpha).

**SR-12. More connectors reach production systems than the plan lists.** Severity: High for Resend if it is the product's sending account [U], Medium otherwise. Section 7 has the table.
- **Resend.** The connector in this session can list and read sent emails [R: tool names `list-emails`, `get-email`]. If it is the account that sends the app's emails, it can read the sign-in links sent to families.
- **Gmail.** It reads the founder's inbox, where `hello@` forwards [R: `docs/ops/DOMAINS.md`]. That inbox gets account-recovery and verification mail for GitHub, Expo, Apple and Supabase. So the approver account (AF-02) needs an email address that no connector reads.
- **Fix, founder.** Check both connectors and apply section 7. By: Gmail when AF-02 picks the approver's email (overdue, planned Mon 19 Oct, AUTOMATION 0.2 row 5); Resend before staging sends its first sign-in email (rehearsal R1, planned Fri 23 Oct, #152 section 2.1).

**SR-13. The harness keys may already be repository secrets, serving nothing.** Severity: Medium.
- `docs/release/HARNESS_SETUP.md` sections 2 and 3 store `OPENROUTER_API_KEY` and `AGENTS_APP_PRIVATE_KEY` as repository secrets [R]. Whether the founder did so is [U] (section 8).
- While `AGENTS_ENABLED` is off, they do nothing, yet every branch can read them.
- **Fix, founder.** Delete them now, and add them to `agents` when RA-20-02a and the `agents` move land. By: the deletion at the section 8.2 read-back (overdue, planned Mon 19 Oct); the move with AF-22 (after the alpha).
- **Fix, S20.** Update HARNESS_SETUP.md to the `agents` environment. By: with the `agents` move (AF-22, after the alpha).

**SR-14. The lint role's password stays out of the repository.** Severity: Medium.
- The repository is public, so S02's migration must not carry the password. It creates the role `nologin` or without a password. The founder sets `login password` on staging by hand, and S01 signs off on the read-back in section 8.4.
- **Fix, S02.** Build the lint-role migration that way. By: when S02 opens the lint-role migration (RA-07-03's request, after the alpha).

**SR-15. The file name differs from the plan.** Severity: Low.
- AUTOMATION.md section 5 named `docs/security/RELEASE_SECRETS_REVIEW.md`. The coordinator assigned `docs/security/SECRETS_REVIEW.md`, which is this file.
- **Fix.** Update the link in AUTOMATION.md section 5 (S20's file). Done on #206, Fri 23 Oct, as its content review suggested: a one-line change.

## 4. Every secret and variable the plan names

Who owns what:
- **The founder** issues, stores and rotates every value, and is the only person who adds one to GitHub. Each value also lives in the password manager.
- **The stream that owns the reading workflow** keeps the job minimal, as named in each table.
- **S01** reviews any change to a scope.

"Read by" names the workflow, the job and, where it matters, the step. Rotation periods are [Rec] unless labelled.

### 4.1 `staging`

Approver; ref `develop` only (staging follows `develop`, and a push to `main` deploys nothing to a database: the 17 Oct rule in `docs/ops/DEPLOY.md` and AUTOMATION.md 2.0). Workflows: S20.

| Name | Read by | Scope it must have | Rotate | A leak shows as | Revoke and replace |
|---|---|---|---|---|---|
| `SUPABASE_DB_URL_STAGING` | `deploy-db.yml`, job `deploy to staging`: steps "Check the secret exists", "Dry run", "Push" | Session-pooler URL for the `postgres` role. No narrower deploy role is possible today [R: DEPLOY.md step 5], so this is full read and write of a database that holds family letters | yearly, and at once on suspicion | No GitHub pattern for a Postgres URL [V3]. gitleaks generic rules in `security.yml` (#30) [A]. Unknown connections in the project's Postgres logs [U] | Supabase: reset the database password [U: menu path]. Update the secret, re-run the dry run, and record it under SEC-R05 |
| `SUPABASE_STAGING_PROJECT_REF` | `deploy-functions.yml` (RA-20-05) | An identifier, not a credential; a secret only so public logs mask it | none | n/a | n/a |
| `SUPABASE_ACCESS_TOKEN_STAGING` | `deploy-functions.yml`, deploy job | A **scoped** personal access token (public alpha [V32]) limited to the staging project and function deploys, with an expiry. Never a classic token, which carries the whole account [V32]. Worth every function secret (SR-8) | 90 days, with the expiry set | GitHub detects scoped Supabase tokens, but push protection does not cover them; classic tokens are covered by both [V3] | Supabase access tokens page: revoke [U: path]. Then rotate the function secrets that deployed code could read (`docs/ops/SECURITY.md` section 2) |

### 4.2 `production`

To be renamed `db-production` (SR-2). Approver; tag `db-v*` only. Workflow: S20.

| Name | Read by | Scope | Rotate | A leak shows as | Revoke and replace |
|---|---|---|---|---|---|
| `SUPABASE_DB_URL_PROD` | `deploy-db.yml`, job `deploy to production` | As staging, for production | yearly; on suspicion | As staging | As staging |

### 4.3 `testflight`

Approver until AF-21, then none; ref `develop` only. Workflow: S20.

| Name | Read by | Scope | Rotate | A leak shows as | Revoke and replace |
|---|---|---|---|---|---|
| `EXPO_TOKEN` (robot `gha-testflight`, Developer) | `testflight.yml`, job `testflight build`, step "Build on EAS". RA-20-06a adds `environment: testflight` | The Developer role "can create new projects, make new builds, release updates, and manage credentials" [V37], across the account's projects. It cannot be limited to one profile [V-S01] | 90 days | No GitHub pattern for Expo tokens [V3]. Builds nobody started in the EAS build list. The cap job's count (RA-20-06) | Expo, the robot's access tokens: delete [V37], then issue a new one. Treat it as an EAS credentials incident too (section 4.10) |

### 4.4 `testers`

Approver; ref `develop`. Workflow: S20.

| Name | Read by | Scope | Rotate | A leak shows as | Revoke and replace |
|---|---|---|---|---|---|
| `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID` | `testflight-testers.yml` (RA-20-07) | Identifiers; secrets only for masking | with the key | n/a | n/a |
| `ASC_API_KEY_P8` (key `gha-testers`) | `testflight-testers.yml`, its single job | A team key with **App Manager**: external testing needs Account Holder, Admin or App Manager [V17]. Team keys reach every app on the account [V14]. The stronger option is an individual key of a dedicated App Manager user limited to the two app records [V13] | yearly. Keys do not expire on their own [U] | No GitHub pattern [V3]. gitleaks' private-key rule [A]. TestFlight changes nobody made. A "last used" date on the key's row [U] | App Store Connect, Users and Access, Integrations: revoke the key [V13]. Create a new one (the file downloads once [V13]) and update all three secrets |
| `EXPO_TOKEN` (robot, Viewer) | the build lookup step | Viewer "can only view your projects through Expo Go but cannot modify your projects in any way" [V37]. Whether `eas build:list` works with it is [U] | 90 days | As 4.3 | As 4.3 |
| `R17_PASSED` (variable) | the refusal step of `testflight-testers.yml` | Not a credential, but its integrity matters. The owner credential in agent sessions can change it [V-S01], so it guards nothing alone. The controls are the approver's click and the "R-17 passed" entry in `docs/DECISIONS.md` at the run's commit (AUTOMATION.md 2.4) | n/a | The run summary prints its value and the decision entry it found [Rec, for RA-20-07] | Set it back to `false` (AUTOMATION.md 2.10) |

### 4.5 `app-store`

Approver; tags `ios-v*`, branches `release/*`. Workflow: S20 (#110, RA-20-08).

| Name | Read by | Scope | Rotate | A leak shows as | Revoke and replace |
|---|---|---|---|---|---|
| `EXPO_TOKEN` (store-lane robot) | `release-ios.yml`, jobs `build` and `metadata` | Developer, as 4.3, but **a second robot user**, so that each revokes alone [Rec; owner: founder; by: before this secret is added (section 9), store lane, after the alpha] | 90 days | As 4.3 | As 4.3 |
| `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, `ASC_API_KEY_P8` (key `gha-release`) | the jobs RA-20-08 adds: `screenshots`, `submit-review`, `phased` | App Manager team key, separate from `gha-testers` | yearly | As 4.4 | As 4.4 |
| `ASC_REVIEW_CONTACT_JSON` | `release-ios.yml`, job `metadata`, step "Add the App Review contact and copyright from the secret" | Personal data (the founder's contact details), not a credential. JSON defeats log redaction (SR-6) | when it changes | It appears in a public run log | Delete the run's logs [V2b], then change the secret |

### 4.6 `packs`

Approver; ref `develop` only. Workflows: S20 and S07 (#162, RA-07-01, RA-20-11).

| Name | Read by | Scope | Rotate | A leak shows as | Revoke and replace |
|---|---|---|---|---|---|
| `PACKS_S3_ENDPOINT`, `PACKS_S3_BUCKET` | `packs-publish.yml` | Identifiers | none | n/a | n/a |
| `PACKS_S3_ACCESS_KEY_ID`, `PACKS_S3_SECRET_ACCESS_KEY` | `packs-publish.yml`, the `upload` and `verify` steps | A Cloudflare R2 **Account API token** with **Object Read & Write**, scoped to the one bucket [V-CF]. Never Admin, which can create and delete buckets [V-CF]. Set an expiry: tokens "remain valid until manually revoked or until they reach a preset expiration date" [V-CF]. A leak cannot make phones accept anything (signatures, hashes, rollback protection [R: #162]); the worst case is files deleted or withheld | yearly, with the expiry set | GitHub detects Cloudflare API tokens, but has no pattern for the S3 key pair [V3]. The hourly `publish.ts verify` in `health.yml` (RA-20-12) reports a missing or changed file | Cloudflare, R2, Manage API tokens: delete the token [V-CF]. Create a new one, then re-run `verify` |

### 4.7 `health`

No reviewer; ref `develop`. Workflows: S20 and S07.

| Name | Read by | Scope | Rotate | A leak shows as | Revoke and replace |
|---|---|---|---|---|---|
| `HEALTH_STAGING_API_URL` | `health.yml`, the probe job | An identifier that the app already carries; a secret only so public logs mask it | none | n/a | n/a |
| `SUPABASE_LINT_DB_URL_STAGING` | `advisors.yml` (RA-07-03) | The catalog-only role (AUTOMATION.md 2.8): no SELECT on `public`, `ops`, `insights`, `auth` or `storage`, plus a `statement_timeout` and a connection limit. **Never the `postgres` role.** Password set by hand (SR-14) | yearly | As 4.1 | The founder runs `alter role <lint role> nologin`, or sets a new password, then updates the secret |

### 4.8 `agents`

No reviewer; ref `develop`. These move from repository secrets. Workflows: S20.

| Name | Read by | Scope | Rotate | A leak shows as | Revoke and replace |
|---|---|---|---|---|---|
| `AGENTS_APP_PRIVATE_KEY` | `agents.yml`, job `run`, step "Agent identity (GitHub App token)" | The agents App: Contents, Pull requests and Issues read and write; Checks and Actions read; no Workflows or Administration; installed on this repository only [R: HARNESS.md section 12]. After AF-03 it cannot push to `develop` or `main`. It can apply labels, which is why RA-20-03a's label check refuses app-applied labels | yearly | GitHub's patterns cover App installation tokens, not the App's private key [V3]. gitleaks' private-key rule [A]. Bot pushes, pull requests or labels outside a dispatcher run | App settings: generate a new private key, update the secret, delete the old key [A] |
| `OPENROUTER_API_KEY` | `agents.yml`, job `plan` (a presence check only) and job `run`, step "Agent (OpenCode)" | A key with a monthly budget and zero data retention [R: HARNESS.md section 12] | 90 days | GitHub pattern, with push protection and a validity check [V3]. Spend on the OpenRouter dashboard | OpenRouter keys page: delete, then create a new key |
| `ANTHROPIC_API_KEY` | `agents.yml`, `plan` (presence check) and `run`, step "Agent (Claude Code)"; `claude.yml`, job `claude` | A key in a dedicated Console workspace with a monthly spend limit [Rec] | 90 days | GitHub pattern, with push protection and a validity check [V3] | Anthropic Console: disable the key [A] |
| `CLAUDE_CODE_OAUTH_TOKEN` | `claude.yml`, job `claude` | The founder's own Claude subscription [R: HARNESS.md]. What it can reach beyond inference is [U] | [U: lifetime] | [U: whether a GitHub pattern covers it] | [U]. Held back (section 9) |
| `AGENTS_APP_CLIENT_ID` (variable) | `agents.yml` | An identifier | n/a | n/a | n/a |

### 4.9 Repository level

| Name | Read by | Scope | Rotate | A leak shows as | Revoke and replace |
|---|---|---|---|---|---|
| `EXPO_TOKEN` (interim) | `testflight.yml` on `develop` and #145 | The robot token from section 1; readable from every branch until AF-22 | until AF-22 | As 4.3 | AF-22: delete the repository secret and revoke this token |

Variables. Collaborators can see them, and a run that echoes one prints it in a public log, so no project URL or ref goes here (AUTOMATION.md 2.0). Their integrity matters (SR-5).

| Variable | Read by | Note |
|---|---|---|
| `EAS_CLI_VERSION` | `testflight.yml` v2, `release-ios.yml` | Decides the code that runs next to `EXPO_TOKEN`; SR-5 |
| `EAS_IOS_BUILD_CAP` | `testflight.yml` v2 | Digits only; SR-5 |
| `NIGHTLY_PROFILE` | `testflight.yml` v2 | `testflight` or `preview` only; SR-5 |
| `AGENTS_ENABLED` (exists [R: AUTOMATION.md 2.0]) | `agents.yml`, job `plan` | The off switch; leave it off until the `agents` move |
| `AGENTS_PAUSED`, `AGENTS_BOT_LOGINS` | `agents.yml` (not named by the plan) [R] | `AGENTS_BOT_LOGINS` decides whose comments count as agent messages and red-team verdicts [R: HARNESS_SETUP.md section 3] |

### 4.10 The private feedback repository (AF-26, RA-07-04)

User-owned private repositories on GitHub Free get no environment reviewers and no secret scanning [V-S01]. Its secrets are therefore repository secrets that any branch there can read. Only the founder pushes to it, and neither the Claude App nor the agents App is installed on it.

| Name | Read by | Scope | Rotate | A leak shows as | Revoke and replace |
|---|---|---|---|---|---|
| `ASC_FEEDBACK_KEY_ID`, `ASC_FEEDBACK_ISSUER_ID`, `ASC_FEEDBACK_KEY_P8` (key `gha-feedback`) | `testflight-feedback.yml`, the poll job | Developer: the narrowest role that reads feedback. It can add builds to internal groups but is read-only on external ones [V-S01], which is why "Friends" is external | yearly | Nothing scans that repository [V-S01] | As 4.4 |
| `PUBLIC_REPO_ISSUES_TOKEN` | the reporting job only (`issues: write`) | A fine-grained token: this repository only, Issues read and write only, a 90-day expiry [Rec] | 90 days | The GitHub token pattern finds it if it ever reaches this public repository [V3] | Settings, Developer settings, Fine-grained tokens: revoke |

### 4.11 Named by the plan, kept outside GitHub

| What | Where it lives | Rule |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | EAS environment `preview` (#145) | Built into the app, so public by design [A]. The publishable key is the **named** key that the staging stop revokes [V36] |
| Distribution certificate, provisioning profile, the App Store Connect key EAS holds | EAS credentials | A Developer token "can manage credentials" [V37], so an `EXPO_TOKEN` leak is also a credentials incident. Revoke the key EAS holds (App Manager, AF-10) and check the certificate [U: whether a Developer can download it] |
| Function secrets (`TOKEN_KEK_V<n>`, Apple keys, `PURGE_WORKER_SECRET`, Resend, PostHog) | Supabase function secrets | Governed by `docs/ops/SECURITY.md`; never in GitHub |
| The packs signing key | The founder's computer and password manager | Never in CI (ADR 0026 decision 8) |
| The accounts behind every token (Apple, Expo, Supabase, Cloudflare, Vercel, GitHub, App Store Connect) | | Two-factor sign-in without SMS where it is offered [Rec]. Owner: founder. By: GitHub and Expo before the section 1 reissue (overdue); the others before the first environment secret (AF-07, overdue, planned Wed 21 Oct, AUTOMATION 0.2 row 11) |

## 5. Environment protection rules

All of these are required before the environment's first secret. "Read back" is the state on 16 Oct [R].

| Environment | Required reviewer | Prevent self-review | Admin bypass | Deployment refs | Read back |
|---|---|---|---|---|---|
| `staging` | the approver only | on | off | branch `develop` only (the 17 Oct rule) | not readable by agents; no deployments on 16 Oct; four by Fri 23 Oct, none approved (section 8.1) |
| `db-production` (SR-2) | the approver only | on | off | tag `db-v*` only, no branch rule | `production` exists as Vercel's `Production`; its rules are unknown |
| `testflight` | the approver until AF-21, then none | on | off | branch `develop` only | not readable |
| `testers` | the approver only | on | off | branch `develop` | not readable |
| `app-store` | the approver only | on | off | tags `ios-v*`; branches `release/*` | not readable |
| `packs` | the approver only | on | off | branch `develop` only | not readable |
| `health` | none | n/a | off | branch `develop` | not readable |
| `agents` | none | n/a | off | branch `develop` | not readable |
| `Production`, `Preview` (Vercel) | none | n/a | n/a | n/a | exist; they must never hold a secret |

Rules for every environment:
- **Selected branches and tags only.**
  - Never "No restriction".
  - Never "Protected branches only": "If no branch protection rules are defined for any branch in the repository, then all branches can deploy" [V2].
  - Never a rule for `refs/pull/*/merge`, which "would also allow workflows triggered by `pull_request` events to deploy" [V2].
- **No wait timer.**
- **Create first.** The environment and its rules come before its first secret and before any workflow names it (SR-11).

What these rules hold, and what they do not:
- **Approvals.** With AF-02 in force, an agent session cannot approve: it is not a reviewer [V2]. Before AF-02 it can.
- **Refs.** A job on a ref the rules do not list never receives the environment's secrets [V2]. A changed workflow on an allowed branch still does. AF-03 decides who changes `develop`; from AF-21, CODEOWNERS on `.github/**` does.
- **Tags and `release/*`.** Any writer can create them (SR-3). For `db-production` and `app-store`, the approver's check below is the control.
- **The owner credential** can change all of this back [V-S01]. The drift job (RA-20-12), the monthly bypass look and AF-27 cover that.

**The approver's check before each click** (any environment with a reviewer):
1. **The ref** on the run page is the expected one: `develop` for `staging`, `testflight`, `testers` and `packs`; a tag for `db-production` and `app-store`.
2. **For a tag,** its commit is on `main` (`db-v*`) or is the reviewed head of `release/<x.y>` (`ios-v*`). Check with `git branch -r --contains <sha>`.
3. **`.github/`** at the run's commit holds no change you did not review. Check that `git diff <last approved sha> <sha> -- .github/` is empty, or that every change in it came through a pull request you reviewed. Until AF-21 this is the only check on workflow changes merged by the coordinator.
4. **The trigger** is the expected one: the tag push, the merge to `develop`, or the coordinator's dispatch of `testflight.yml`.

If any of these fails, reject the run.

## 6. Can a pull request path read a secret?

All 175 remote branches were scanned on 16 Oct [R]. They hold 23 distinct workflow file versions, and the findings are:
- Only `agents.yml`, `claude.yml`, `deploy-db.yml`, `testflight.yml` and `release-ios.yml` read a secret.
- Only `fence.yml` (#30) uses `pull_request_target`.
- No workflow uses `workflow_run`.

| Workflow | Where | Triggers | Secrets | Environment | `GITHUB_TOKEN` | Pull request path reads a secret |
|---|---|---|---|---|---|---|
| `ci.yml` | `develop`, `main` | `pull_request`; push to `develop`, `main` | none | none | `contents: read` | no |
| `migration-guard.yml` | `develop`, `main` | `pull_request`; push | none | none | `contents: read` | no |
| `db-cli.yml` | `develop` | `pull_request` (paths); `workflow_call` | none | none | `contents: read` | no |
| `nightly.yml` | `develop` | `schedule`; dispatch | none | none | `contents: read` | n/a |
| `agents-check.yml` | `develop` | `pull_request` (paths); push | none | none | `contents: read` | no |
| `agents.yml` | `develop` | `schedule`; dispatch | `AGENTS_APP_PRIVATE_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY` (repository) | none; `agents` after the move | `plan`: contents read, issues write, pull requests read, checks read, actions read. `run`: contents write, pull requests write, issues write, checks read, actions read, id-token write | no trigger, but repository secrets reach any branch |
| `claude.yml` | `develop` and every branch cut from it | `issue_comment`, `issues`; **`pull_request_review`, `pull_request_review_comment`** | `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN` (repository) | none | `claude`: contents write, pull requests write, issues write, actions read, id-token write | **yes (SR-1)** |
| `deploy-db.yml` | `develop` (#205, merged Sun 18 Oct, replaced the push to `main` [R, 23 Oct]) | push to `develop`; dispatch on `develop` as the catch-up; tags `db-v*` | `SUPABASE_DB_URL_STAGING`, `SUPABASE_DB_URL_PROD` | `staging`, `production` | `contents: read` | no |
| `testflight.yml` | `develop`; #145 | dispatch; `pull_request` only for a PR that edits this file (#404, the job is skipped by its `if`, so it only registers the workflow) | `EXPO_TOKEN` (repository) | none; RA-20-06a adds `testflight` | `contents: read` | the pull_request run builds nothing and a fork PR gets no secrets; the repository secret still reaches any branch |
| `web.yml`, `web-e2e.yml` | `main` | `pull_request` (paths); push | none | none | `contents: read` | no |
| `fence.yml` | #30 | `pull_request_target` | none; `GITHUB_TOKEN` only | none | `contents: read`, `pull-requests: read` | no: it checks out nothing and runs only the base commit's rules [R] |
| `security.yml` | #30 | `pull_request`; push; `schedule`; dispatch | none | none | `contents: read` | no |
| `ios-compile.yml` | `ci/ios-compile-check` | `pull_request` (paths); dispatch | none | none | `contents: read` | no |
| `release-ios.yml` | #110 | tags `ios-v*`; dispatch | `EXPO_TOKEN`, `ASC_REVIEW_CONTACT_JSON` | `app-store` | `contents: read`; `contents: write` on the GitHub Release job | no |

None of the planned workflows (`deploy-functions`, `testflight` v2, `testflight-testers`, `packs-publish`, `health`, `advisors`, `release-cut`, `ops-reminders`) has a pull request trigger in AUTOMATION.md 2.2 to 2.8 [R]. Keep it that way.

The five rules that keep the answer "no":
1. **No repository secrets.** No secret is a repository secret, except the interim `EXPO_TOKEN` until AF-22. Pull requests from branches of this repository receive repository secrets; only runs from forks are refused them [V2d].
2. **No pull request refs in environments.** `pull_request`, `pull_request_review` and `pull_request_review_comment` runs have `GITHUB_REF` set to `refs/pull/<n>/merge` [V1], and no environment lists that ref [V2]. So these runs can never enter an environment restricted to branches or tags.
3. **Default-branch triggers stay out of environments.** `pull_request_target`, `issue_comment` and `issues` runs have `GITHUB_REF` set to the default branch [V1]. After AF-05 that is `develop`, which six environments accept.
   - No `pull_request_target` workflow names an environment, reads a secret, or checks out pull request code [V34].
   - `fence.yml` is the only `pull_request_target` workflow, and AF-20's event policy allows that event for it alone [V34].
   - No `issue_comment` or `issues` workflow names an environment, except `claude.yml` after RA-20-02a.
4. **No `workflow_run` workflow.** It "is able to access secrets and write tokens, even if the previous workflow was not" [V1].
5. **No pull request code in a secret-holding job.** No job that holds a secret checks out or runs pull request code. `claude.yml` checks out `develop` [R]; keep it so.

**Verdict.**
- **Today:**
  - `claude.yml`'s review triggers read repository secrets from workflow code the pull request controls (SR-1).
  - Any pull request from a branch here can read every repository secret by adding a workflow.
  - Which repository secrets exist is [U]; section 8 settles it.
- **After the moves in section 9 and the five rules:** no `pull_request` or `pull_request_target` path can read an environment secret. The one exception left is the interim repository `EXPO_TOKEN`, readable from any branch until AF-22. That is why it is reissued from a robot now (section 1).

## 7. Connectors are production credentials

AUTOMATION.md 2.11 names the Supabase, Vercel and mail connectors. This session also has the others below [R: this session's tool list]. Agents do not use them against staging, production or the founder's inbox (2.11). These are the settings that turn that rule into a limit.

| Connector | What it reaches | Rule | Owner and by |
|---|---|---|---|
| GitHub | The founder's own account (the owner): merges, tag pushes, dispatches, and until AF-02, approvals | AF-02, AF-03; the durable fix is AF-27 | Founder. AF-02 and AF-03 overdue (planned Mon 19 Oct, AUTOMATION 0.2 row 5); AF-27 after the alpha |
| Supabase | Every project in the authorized organization: SQL, migrations, function deploys, function secrets [V-S01; R: tool names include `execute_sql`, `apply_migration`, `create_edge_function_secret`] | AF-06: staging and production in an organization the connector is not authorized for, or the connector read-only and scoped to a development project | Founder. AF-06 (overdue, planned Fri 16 Oct as #152 F04), before `SUPABASE_DB_URL_STAGING` is added |
| Vercel | Promotions, rollbacks and project environment variables [R: tools `request_promote`, `request_rollback`, `get_project_env`, `edit_project_env`]. Sensitive variables "are non-readable once created" [V-Vercel] | Production changes are founder actions. Mark every server-side website variable Sensitive [Rec]; which variables the project holds is [U] | Founder. With AF-15 (Vercel Pro), before Thu 29 Oct |
| Gmail | The founder's inbox: `hello@` forwards there [R: DOMAINS.md], and so do recovery and verification mail for GitHub, Expo, Apple and Supabase | The approver account's email is one no connector reads. The TestFlight feedback mailbox is not connected (AUTOMATION.md 2.7) | Founder. The approver's email when AF-02 creates it (overdue, planned Mon 19 Oct); the feedback mailbox with AF-11 (overdue, planned Tue 20 or Wed 21 Oct, AUTOMATION 0.2 row 16) |
| Resend | Lists and reads sent emails, sends email, creates API keys [R: tool names] | Check which Resend account it is [U]. If it is the account that sends the app's sign-in emails, disconnect it from agent sessions: it can read sign-in links (SR-12) | Founder. Before staging sends its first sign-in email (rehearsal R1, planned Fri 23 Oct, #152 section 2.1) |
| PayPal | Invoices and payment links [R: tool names] | Not a release credential; disconnect it if unused [Rec] | Founder. By the go/no-go (planned Thu 29 Oct); no gate waits on it |
| Google Drive, Docs, Sheets, Calendar; Notion; Figma; Wispr Flow | Documents and notes | Never paste a secret value into them, a pull request, an issue or an agent chat | Everyone, always |

## 8. The founder's read-back

Run these from your own computer, signed in as the approver (read access suffices for environments [V-S01]) or as yourself. They print names and settings, never secret values. Owner: the founder runs them; S01 marks each section 5 row read back (section 11). Each part has its own "By".

### 8.1 Environments and their refs

By: `staging` and `testflight` right after AF-07 creates them and before their first secret (overdue, planned Wed 21 Oct, AUTOMATION 0.2 row 11); the others with AF-22 (after the alpha).

Read on 23 Oct [R]. Agents cannot read the environment itself (section 2), so this comes from the public deployment and run records. `staging` has four deployments, and none waited for an approval (none is recorded). The evidence that it has no required reviewer (SR-11) is the two `deploy-db.yml` runs below: each started `deploy to staging` within 3 seconds of being queued, with no approval recorded.
- `deploy-functions.yml` run 39111226137, the push of #205 to `develop`, Sun 18 Oct, 1:23 AM PT: its deploy steps were skipped.
- `deploy-db.yml` runs 39970965877 and 39972543440, migrations reaching `develop` on Fri 23 Oct at 7:35 AM and 7:46 AM PT: each `deploy to staging` job started within 3 seconds of being queued and failed at "Check the secret exists", so `SUPABASE_DB_URL_STAGING` is not set.
- `deploy-functions.yml` run 39970965988, Fri 23 Oct, 7:35 AM PT: it deployed nothing.

So every migration that reaches `develop` now starts a staging deploy with no approval; only the missing secret stops it. Set `staging`'s rules (section 5) and read them back before its first secret. GitHub now lists 13 workflows (`deploy-db`, `deploy-functions`, `deploy-scripts` and `seam-guard` are new since section 2).

```bash
R=thesaurabhpareek/earlyletters
gh api repos/$R/environments --jq '.environments[] | {name, rules: [.protection_rules[] | {type, prevent_self_review, reviewers: [.reviewers[]?.reviewer.login]}], policy: .deployment_branch_policy}'
for e in staging db-production testflight testers app-store packs health agents; do
  echo "== $e"; gh api repos/$R/environments/$e/deployment-branch-policies --jq '.branch_policies[] | {name, type}'
done
```

Expected: section 5, row by row.
- `reviewers` holds only the approver's login.
- `prevent_self_review` is `true`.
- `custom_branch_policies` is `true`, and the policies are exactly those in section 5.
- "Allow administrators to bypass" is not in this object [V-S01]. Check it in Settings, Environments, on each environment.

### 8.2 Secret and variable names

By: now, overdue (planned Mon 19 Oct with AF-02 and AF-03, AUTOMATION 0.2 row 5, whose proof is this read-back). The repository part settles SR-1 and SR-13.

```bash
gh api repos/$R/actions/secrets --jq '.secrets[].name'
for e in staging db-production testflight testers app-store packs health agents; do
  echo "== $e"; gh api repos/$R/environments/$e/secrets --jq '.secrets[].name'
done
gh api repos/$R/actions/variables --jq '.variables[].name'
```

Expected at repository level: `EXPO_TOKEN` alone, the reissued robot token (section 1). If `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`, `OPENROUTER_API_KEY` or `AGENTS_APP_PRIVATE_KEY` is listed, delete it (SR-1, SR-13). Expected variables: `AGENTS_ENABLED` and the agents' own (4.9). If `R17_PASSED` exists at repository level, delete it: it belongs in `testers` (AUTOMATION.md 2.0).

### 8.3 Branches and Actions settings

By: right after AF-03 (overdue, planned Mon 19 Oct, AUTOMATION 0.2 row 5; `develop` and `main` are still unprotected [R, 23 Oct]); the Actions settings with AF-20 (before Mon 2 Nov).

```bash
gh api repos/$R/branches/develop/protection --jq '{checks: .required_status_checks.contexts, admins: .enforce_admins.enabled, force: .allow_force_pushes.enabled, del: .allow_deletions.enabled}'
gh api repos/$R/branches/main/protection --jq '{checks: .required_status_checks.contexts, admins: .enforce_admins.enabled, reviews: .required_pull_request_reviews.required_approving_review_count}'
gh api repos/$R/actions/permissions/workflow
```

Expected:
- Both branches require `required` and `applied migrations unchanged`, with `enforce_admins` on.
- `main` requires one approving review.
- Workflow permissions are `read` and `can_approve_pull_request_reviews` is `false` (AF-20).
- In Settings, Actions, General, "Require approval for all external contributors" is set (AF-20).

### 8.4 The lint role (before `SUPABASE_LINT_DB_URL_STAGING`)

By: before `SUPABASE_LINT_DB_URL_STAGING` is added (after the alpha).

In the staging SQL editor, with the role name S02 chose:

```sql
select rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb, rolconnlimit
from pg_roles where rolname = '<lint role>';
select setconfig from pg_db_role_setting
where setrole = (select oid from pg_roles where rolname = '<lint role>');
select has_table_privilege('<lint role>', 'public.entries', 'select') as can_read_entries;
select r.rolname from pg_auth_members m join pg_roles r on r.oid = m.roleid
where m.member = (select oid from pg_roles where rolname = '<lint role>');
```

Expected:
- `rolsuper`, `rolbypassrls`, `rolcreaterole` and `rolcreatedb` are false, and `rolconnlimit` is small.
- `can_read_entries` is false.
- No membership in `postgres`, `pg_read_all_data` or `service_role`.
- `setconfig` holds a `statement_timeout` [A: S02 sets it on the role].

Paste the output (names and settings only) into this file's pull request or the RA-20-12 expected file. S01 then marks each section 5 row "read back".

## 9. The hold list: what must not be added until something else changes

| Secret or variable | Not before | Why | Planned |
|---|---|---|---|
| **Any environment secret** | AF-02 in force: the approver is the only reviewer, with prevent self-review on and admin bypass off. AF-03 in force: `develop` and `main` protected, no bypass. The environment created with its rules and read back (section 8) | Before that, an agent session can approve, push to the allowed branch, or create the environment unprotected (SR-11) | first with AF-07, overdue (planned Wed 21 Oct, AUTOMATION 0.2 row 11), after AF-02 and AF-03, overdue (planned Mon 19 Oct, row 5) |
| Repository `EXPO_TOKEN` | **Now:** reissue it from the robot (section 1) | It is readable from every branch until AF-22 | now (section 1) |
| `testflight` `EXPO_TOKEN` | RA-20-06a merged: `testflight.yml` names `environment: testflight`, actions pinned, `npm ci` without the restored cache. Then a new robot token; the approver stays a reviewer until AF-21 | Until the workflow names the environment, the secret is never read, and the repository copy stays in use | AF-07, overdue (planned Wed 21 Oct, row 11) |
| `SUPABASE_DB_URL_STAGING` | AF-06 (connector cannot reach staging), AF-07, and DEPLOY.md section 2 aligned or ignored in favour of AF-07 (SR-4). The first deploy before staging holds letters (AUTOMATION.md 2.2) | Staging holds family letters during the alpha | AF-07, overdue (planned Wed 21 Oct, row 11) |
| `SUPABASE_STAGING_PROJECT_REF` | With `SUPABASE_ACCESS_TOKEN_STAGING` | Only `deploy-functions.yml` reads it | with the access token |
| `SUPABASE_ACCESS_TOKEN_STAGING` | A **scoped** token with an expiry is offered, AF-06 is done, and RA-20-05 is merged. If only classic tokens exist, never add it: functions deploy from the founder's computer (POPS-04) | A classic token carries the whole account [V32]. A deploy token is worth every function secret (SR-8) | not planned; AF-13's deploys (overdue, planned Thu 22 Oct, row 12) can run from the founder's computer |
| `SUPABASE_DB_URL_PROD` | SR-2 fixed (`db-production`), AF-42, and post-alpha | The environment's name currently resolves to Vercel's `Production` | after the alpha (AF-42) |
| `ASC_API_KEY_*` (`gha-testers`), the Viewer `EXPO_TOKEN`, `R17_PASSED` | AF-25 (App Manager key) and RA-20-07 merged. `R17_PASSED` only on the day the R-17 entry is recorded (AF-28), and never set by an agent | Nothing reads them before RA-20-07. The variable gates servers-on builds for friends (D-100) | after the alpha (AF-25, AF-28) |
| `app-store` `EXPO_TOKEN`, `ASC_API_KEY_*` (`gha-release`), `ASC_REVIEW_CONTACT_JSON` | #110 merged with SR-6 fixed; RA-20-08; AF-40; the approver's tag check in place (SR-3) | Tags and `release/*` are creatable by every agent session | after the alpha (store lane) |
| `PACKS_S3_*` | #162, RA-07-01 and RA-20-11 merged; the scratch-bucket plants of AUTOMATION.md 2.12 passed; the token is Object Read & Write on the one bucket, with an expiry | Before `assemble` exists, nothing checks the files against the signatures before upload | after the alpha (RA-20-11) |
| `HEALTH_STAGING_API_URL` | AF-03, and the `health` environment created | Low value; masked only | after the alpha (AF-22) |
| `SUPABASE_LINT_DB_URL_STAGING` | S02's lint-role migration and its `supabase/tests` case merged; the password set by hand (SR-14); section 8.4 read back and signed by S01 | `health` has no reviewer, and staging holds letters | after the alpha (RA-07-03) |
| `AGENTS_APP_PRIVATE_KEY`, `OPENROUTER_API_KEY`, `ANTHROPIC_API_KEY` | RA-20-02a merged, and `agents.yml` and `claude.yml` name `environment: agents`. Delete any repository copies **now** (SR-13) | Repository secrets reach any branch, and while `AGENTS_ENABLED` is off they serve nothing | after the alpha (AF-22); the deletion now (section 8.2) |
| `CLAUDE_CODE_OAUTH_TOKEN` | AF-21 (CODEOWNERS on `.github/**`), or never: prefer `ANTHROPIC_API_KEY` with a spend limit [Rec] | It is the founder's personal subscription, in an environment with no reviewer | after AF-21 (after the alpha), or never |
| `ASC_FEEDBACK_*`, `PUBLIC_REPO_ISSUES_TOKEN` | AF-26: the private repository exists, the Apps are not installed on it, and only the founder pushes. RA-07-04 merged | That repository's secrets are readable by any branch there | after the alpha (AF-26) |
| `EAS_CLI_VERSION`, `EAS_IOS_BUILD_CAP`, `NIGHTLY_PROFILE` | RA-20-06 validates them, or the pin moves into a reviewed file (SR-5) | They steer secret-holding jobs and can change without review | after the alpha (RA-20-06) |

## 10. When a secret may have leaked

1. **Revoke first, rotate second, investigate third,** and record it in the incident log (SEC-R05, `docs/engineering/06-security-engineering.md`) [R]. Each table in section 4 says where to revoke.
2. **If a value printed unmasked in a run log,** delete that run's logs and rotate. Masking happens on the runner and only for values the job could see [V2b].
3. **If a value reached git,** push protection should have refused the supported types [R: enabled]. Otherwise the value is public the moment it is pushed: revoke at once. Rewriting history does not take it back.
4. **If an approval or setting changed** without the founder, treat the owner credential as exposed: revoke the agent sessions' GitHub connection, then check environments (8.1), secrets (8.2) and branch protection (8.3).

## 11. Sign-off and log

| Item | State |
|---|---|
| S01 review of the plan as written at c9a192d | done, this file |
| Settings read back (section 8) | **pending the founder** |
| Section 1 reissue | **pending the founder** |
| S01 sign-off of each environment before its first secret | pending, per row of section 9 |
| Owners and dates for every fix (content review on #206) | done, Fri 23 Oct |

Log (dates, names and settings only, never a value):

| Date | Change | By |
|---|---|---|
| 16 Oct 2026 | Review written; settings read back as in section 2 | S01 |
| 23 Oct 2026 | Owners and dates added; staging rows set to `develop` only; settings re-read (sections 3 and 8.1) | coordinator's fix agent, for S01 |

## 12. Sources

Read on 16 Oct 2026. GitHub facts come from GitHub's documentation source (github/docs, `main`), because docs.github.com cannot be reached from the agents' sandbox.

- **V1.** `content/actions/reference/workflows-and-actions/events-that-trigger-workflows.md`:
  - the `GITHUB_REF` of each event (`pull_request`, `pull_request_review` and `pull_request_review_comment`: `refs/pull/<n>/merge`; `issue_comment` and `issues`: the default branch; `pull_request_target`: the default branch on github.com);
  - `push` runs workflows "that are not merged into the default branch";
  - `workflow_run` gets secrets and write tokens.
- **V2.** `content/actions/reference/workflows-and-actions/deployments-and-environments.md`: up to six reviewers; prevent self-review ("users who initiate a deployment cannot approve"); rules matched against `GITHUB_REF`; the `refs/pull/*/merge` warning; "Protected branches only" with no protection rules lets every branch deploy; administrators bypass by default; environment secrets are released only after approval.
- **V2b.** `content/actions/reference/security/secure-use.md`: write access reads every repository secret; redaction is not guaranteed; never use structured data as a secret; register transformed values; delete the log and rotate.
- **V2c.** `content/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments.md`: running a workflow that names a missing environment creates it with no rules.
- **V2d.** `data/reusables/actions/forked-secrets.md`: "With the exception of `GITHUB_TOKEN`, secrets are not passed to the runner when a workflow is triggered from a forked repository"; `data/reusables/developer-site/pull_request_forked_repos_link.md`: Dependabot pull requests are treated as forks.
- **V3.** `src/secret-scanning/data/pattern-docs/fpt/public-docs.yml`:
  - patterns exist for Anthropic, OpenRouter, GitHub tokens, Supabase classic and scoped tokens and secret keys, and Cloudflare API tokens;
  - push protection does not cover scoped Supabase tokens;
  - no pattern exists for Expo tokens, App Store Connect keys, Postgres URLs, R2 S3 key pairs or GitHub App private keys.
- **V-cache.** `content/actions/reference/workflows-and-actions/dependency-caching.md`: cache scope; runs restore from the current and the default branch.
- **V34.** `content/actions/reference/security/securely-using-pull_request_target.md`: the default policy enforced on 2 November 2026; workflows triggered by this event "should not check out, build, or run code from an untrusted pull request".
- **V13, V14, V17, V32, V36.** As in AUTOMATION.md section 9.
- **V37.** expo/expo `docs/pages/accounts/programmatic-access.mdx` (personal tokens, robot users, revoking) and `docs/pages/accounts/account-types.mdx` (the role table: Owner, Admin, Release Manager, Developer, Viewer).
- **V-CF.** cloudflare/cloudflare-docs `src/content/docs/r2/api/tokens.mdx`: Account and User API tokens; Object Read & Write scoped to buckets; Admin can create and delete buckets; expiry.
- **V-Vercel.** The Vercel documentation tool, "Sensitive environment variables": sensitive variables are non-readable once created.
- **V-S01.** The reviews on #185: comment 6222183586 (environment-approvals schema, personal-repository permission levels, label events, Supabase connector reach) and comment 6223027884 (the `EXPO_TOKEN` note).
