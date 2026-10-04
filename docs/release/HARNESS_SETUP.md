# Switching the agent harness on

For the founder. Written 4 Oct 2026 against the harness as it stands on the `docs/engineering-compendium` branch (PRs #4, #39 and #42: 24 agents, dispatcher, handoffs, stewards). The design is in `docs/agents/HARNESS.md`; this file is the order of operations, what it costs, and what to leave off at first.

**Marking.** Every step says whether it was checked. "Checked in code" means I read the script or workflow in this repository. "Unverified" means it depends on GitHub, OpenRouter or Anthropic behaviour or prices I could not reach from here; check it on the day.

## 0. What nothing needs until you do these steps

Until the secrets below exist, the harness does nothing harmful and nothing costly (checked in code):
- `agents.yml` still runs its `plan` job every 30 minutes once it is on `main`. It needs only the built-in `github.token`. It creates the labels, journal issues and the Agent board (see step 5), marks every agent "waiting for the OPENROUTER_API_KEY secret and the agents GitHub App", and starts no agent, so the `run` job is skipped.
- `claude.yml` ends green with a notice if neither `ANTHROPIC_API_KEY` nor `CLAUDE_CODE_OAUTH_TOKEN` exists.
- `agents-check.yml` needs no secrets.

## 1. Merge order

1. Merge PR #30 (CI hardening) first, after your `approve-migration` review. PR #4 will then conflict in `.github/README.md` (checked: that is the only conflicting file); ask for it to be resolved, or merge #4 first.
2. Merge #4, then #39, then #42 into `develop`, in that order.
3. Scheduled workflows run only from the default branch. Release `develop` into `main` (or merge a small PR that adds only `agents.yml`, `agents-check.yml` and `claude.yml`). Nothing is scheduled until then. Checked: this is stated in HARNESS.md section 12; GitHub's rule itself is unverified here.

## 2. Create the OpenRouter key (about 10 minutes)

1. Create an OpenRouter account and add prepaid credit. Start small: $20.
2. In Guardrails, create a key with a monthly budget. Suggested first month: $50 (the harness doc's example figure). This is the real monthly stop.
3. In Settings, Privacy, turn on zero data retention so providers cannot keep or train on prompts.
4. Check that both models are available on your key: `deepseek/deepseek-v4.1-flash` (every agent except the red team) and `z-ai/glm-5.2` (red team). **Unverified:** I could not reach OpenRouter; model names and prices come from HARNESS.md, dated 3 Oct 2026.
5. Save the key as the repository Actions secret `OPENROUTER_API_KEY` (Settings, Secrets and variables, Actions, New repository secret).

## 3. Create the agents GitHub App (about 15 minutes)

1. GitHub, Settings, Developer settings, GitHub Apps, New GitHub App. Name it, for example, `early-letters-agents`. Any homepage URL. Turn the webhook off.
2. Repository permissions: Contents read and write, Pull requests read and write, Issues read and write, Checks read, Actions read. **Do not grant Workflows or Administration.** That is what stops an agent editing the workflows.
3. Create it, install it on this repository only, generate a private key.
4. Save the Client ID as the Actions **variable** `AGENTS_APP_CLIENT_ID`, and the private key file's full contents as the Actions **secret** `AGENTS_APP_PRIVATE_KEY`.
5. Set the Actions **variable** `AGENTS_BOT_LOGINS` to the app's bot login, for example `early-letters-agents[bot]`. This one matters: red-team review verdicts count only through the login, because GitHub attaches the app id to comments but not to reviews (checked in `docs/agents/AGENT-COMMS.md` section on trust). Without it the board warns that agent messages are not recognised and reviews are ignored.

## 4. Labels, branch protection, repository settings

1. **Labels.** The harness creates all of them itself (checked in `scripts/agents/bootstrap.mjs`): 14 shared labels including `needs:founder`, `review:red-team-ok`, `review:changes-needed` and `approve-migration`, plus `agent:`, `from:` and `to:` labels for each of the 24 agents (86 labels in total). If you want them before the first tick, run `node scripts/agents/bootstrap.mjs --dry-run`, then without `--dry-run`, from a checkout where `gh` is logged in as you.
2. **Branch protection** on `develop` and `main`: the command in `.github/README.md`. Required checks should include `required`, `applied migrations unchanged` and `fence` (from PR #30). That README sets 1 required approval (PR #4 changes it from 0): as sole owner you can still merge your own PRs as an administrator because "do not allow bypassing" stays off. Unverified: the exact behaviour of your own account under these settings, and whether your plan allows protection on a private repository (HARNESS.md section 13).
3. **Settings, Actions, General:** nothing special for the agents. They open PRs with the App's own token, so no setting for "allow Actions to create PRs" is needed (checked in `agents.yml`: the App token is used for the OpenCode runs). Unverified.

## 5. First tick, in order

Run it by hand before trusting the schedule: Actions, Agents, Run workflow, set `agent` to `chief-of-staff` and leave `task` empty. (The `agent` input takes a list; checked in the dispatcher.)

What happens, and which agent goes first (checked in `scripts/agents/dispatch.mjs` and `OPERATING_MODEL.md`):
1. **Bootstrap.** Labels, 24 journal issues (label `journal`, one per agent) and the issue titled "Agent board" are created if missing.
2. **Dispatcher priority per agent:** fix its own PR, then handoffs, then reviews (red team and stewards), then the next ready backlog task, then a standing duty only if something changed.
3. **First day.** There are no agent PRs yet, so `red-team` and the five stewards (`principal-architect`, `data-steward`, `security-architect`, `compliance-engineer`, `ai-eng-lead`) have nothing to review and fall to standing duties. The delivery agents take the first ready backlog task for their role. Ready v1.0 tasks named in the backlog's status table: BL-330, BL-347, BL-322, BL-342, BL-349. The ones touching `supabase/**` or sign-in (BL-330, BL-347) need the `approve-migration` label and an independent review before they merge (D-041), so they will wait on you.
4. **`chief-of-staff`** writes the first digest after 14:00 UTC (`digest_hour_utc`), as an issue labelled `digest`. Read that, then the Agent board. Both are the daily dashboard.

## 6. What it costs per day at the roster's caps

From `agents/roster.json` and HARNESS.md section 10. **The per-session figures are the harness author's assumptions, not measurements; none was verified against OpenRouter prices.**

Hard limits (checked in the roster): team cap 30 runs a day (`max_runs_per_day_total`; the roster requests 50, the cap wins); at most 6 in parallel; $2 per DeepSeek run and $3 per red-team run, enforced by the runner; 50 minute job timeout; the OpenRouter key's monthly budget on top.

| Scenario | Assumption | Cost per day |
|---|---|---|
| Typical | 26 DeepSeek runs at about $0.04 and 4 red-team runs at about $0.33 | about $2.40 |
| Heavy | 26 runs at about $0.37 and 4 at about $1.81 | about $17 |
| Ceiling | every run hits its cap: 26 at $2 and 4 at $3 | $64 |

Monthly, from the same assumptions: about $70 to $510 (HARNESS.md). The same 30 runs on Claude Sonnet 5.5 would be roughly six to seven times dearer.

GitHub Actions minutes are free on a public repository. Private: about 15 minutes a run, so roughly $63 a month at the full cap after the included minutes (HARNESS.md; unverified, check github.com/settings/billing).

Agents idle whenever they wait for your review (open-PR limits), so real spend will be below the typical row.

## 7. Safe to leave off for the first week

Turn things on in this order. Each is one change.
- **Leave off:** `ANTHROPIC_API_KEY` and `CLAUDE_CODE_OAUTH_TOKEN`. Nothing needs them; every agent defaults to OpenCode. `claude.yml` will skip cleanly. Add them when you want `@claude` in issues.
- **Leave off:** Claude Code as an agent engine. Do not change any agent's `engine`.
- **Start with a small team.** Set `daily_runs` to `0` in `agents/roster.json` for every agent except `red-team`, `qa`, `content`, `design-systems`, `product` and `chief-of-staff` (checked in code: a zero daily limit makes the dispatcher skip the agent). Those are the roles that work in `docs/` and `packages/`, not in `supabase/` or sign-in. Turn the stewards, `legal`, `marketing`, `support`, `ops` and the rest on in week two.
- **Keep paused for `supabase/` and sign-in work** (D-041): do not unpause `security`, `sync`, `privacy`, `data-architect`, `payments` and `speech` until branch protection and the `fence` check are on and you have watched a few red-team reviews.
- **A lower first budget.** A $20 to $50 OpenRouter key budget is a harder stop than any roster setting.
- **Emergency stop:** set the repository variable `AGENTS_PAUSED` to `true`. The next tick starts nothing.
- **Optional, not needed yet:** Dependabot security updates, private repository, a self-hosted runner.

## 8. First-week checks

1. Day 1: the Agent board lists 24 agents and "waiting for" no secrets. The first agent PR carries the labels `agent:<handle>` and `from:agent`.
2. Open one receipt on a journal issue: it should show a cost above $0. A paid model that reports zero cost is stopped by the runner (HARNESS.md section 14). If receipts show $0.00, stop and check the model name.
3. Day 2 to 3: a red-team review on an agent PR, first line `<!-- red-team:<sha> -->`, and the label `review:red-team-ok` or `review:changes-needed`. If none appears, check `AGENTS_BOT_LOGINS`.
4. End of week: compare the board's "estimated spend" with your OpenRouter dashboard. Unverified until you do.

## 9. Not verified in this document

- Anything requiring a live run: no end-to-end run has happened (the PR #4 description says so; it needs the key and the App).
- OpenRouter prices, model availability, zero-data-retention behaviour; OpenCode 1.18.34 and its model list.
- GitHub App permission names and the scheduled-workflow default-branch rule.
- `anthropics/claude-code-action@v1` and `actions/create-github-app-token@v3` are still pinned by tag, not commit SHA (I could not look up the SHAs); Dependabot from PR #30 will propose pins.
- The CI result of the three agent PRs on GitHub.
