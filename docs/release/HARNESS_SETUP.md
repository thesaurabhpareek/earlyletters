# Switching the agent harness on

For the founder. Written 4 Oct 2026, updated 15 Oct 2026 as the harness landed on `develop` (PR #4 at `cb8fa72`, then #39 and #42: 24 agents, dispatcher, handoffs, stewards). The design is in `docs/agents/HARNESS.md`; this file is the order of operations, what it costs, and what to leave off at first.

**Marking.** Every step says whether it was checked. "Checked in code" means I read the script or workflow in this repository. "Unverified" means it depends on GitHub, OpenRouter or Anthropic behaviour or prices I could not reach from here; check it on the day.

## 0. What runs before you do these steps: nothing

The harness is off by default (checked in code, 15 Oct):
- `agents.yml` runs only while the repository variable `AGENTS_ENABLED` is exactly `true`. Until you set it (section 4, item 4), every scheduled tick and every manual "Run workflow" is skipped before a runner starts: no minutes, no labels, no issues, no comments.
- Once `AGENTS_ENABLED` is `true` but the secrets below do not exist yet, the `plan` job runs every 30 minutes on the built-in `github.token`: it creates the labels, journal issues and the Agent board (see section 5), marks every agent "waiting for the OPENROUTER_API_KEY secret and the agents GitHub App", and starts no agent, so the `run` job is skipped. That is why the variable is the last step, not the first.
- `claude.yml` ends green with a notice if neither `ANTHROPIC_API_KEY` nor `CLAUDE_CODE_OAUTH_TOKEN` exists. It has no schedule and runs only on your own `@claude` mentions.
- `agents-check.yml` needs no secrets and writes nothing.

## 1. Merge order

1. Done 15 Oct: #4 (`cb8fa72`) and #39 (`0c71ea9`) landed on `develop` (squash). The coordinator agent merged them on the go-ahead to land the harness relayed in its brief, each after two independent review-agent passes recorded in a PR comment. The merge records cite the delegated merge rule then drafted as D-093; `docs/DECISIONS.md` now records that rule as D-104 item 1 (proposed, 14 Oct), which D-107 ("Widen", 15 Oct) replaced. Both PRs also changed `.github/**`, which D-107 reserves for you: please confirm them. #42 follows with two independent reviews and green CI; #112 (release agent, chapter 11) after it, once the release-engineering PRs it cites (#108 to #111) have landed.
2. PR #30 (CI hardening: SHA pins, trusted-ref migration guard, the `fence` check) changes the required checks, so it is release configuration. D-107 reserved `.github/**` for the founder; under D-117's operating rule the coordinator merges it after two independent passing reviews on the current head and green CI. It was synced with `develop` early on 15 Oct (`dafb5ff`, green on `required`, based on `4183844`); #39 and #130 landed after that, so sync it again before merging. It is marked "ready, founder merge"; its 4 Oct red-team label `review:changes-needed` still stands, so read that review first. After it lands, re-run the branch protection command with `fence` added.
3. Scheduled workflows run only from the default branch. Release `develop` into `main` (or merge a small PR that adds only `agents.yml`, `agents-check.yml` and `claude.yml`). Nothing is scheduled until then, and even then nothing runs until `AGENTS_ENABLED` is set (section 4, item 4). Checked: this is stated in HARNESS.md section 12; GitHub's rule itself is unverified here.

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
2. **Branch protection** on `develop` and `main`: the command in `.github/README.md`. Required checks should include `required`, `applied migrations unchanged` and, once PR #30 lands, `fence`. That README sets 1 required approval (PR #4 changes it from 0): as sole owner you can still merge your own PRs as an administrator because "do not allow bypassing" stays off. Unverified: the exact behaviour of your own account under these settings. The repository is public, so GitHub Free includes branch protection, rulesets and environments, and #127 item 7 decided to turn them on.
3. **Settings, Actions, General:** nothing special for the agents. They open PRs with the App's own token, so no setting for "allow Actions to create PRs" is needed (checked in `agents.yml`: the OpenCode runs use the App's token; whether GitHub still wants the setting is unverified).
4. **Switch on, last.** Settings, Secrets and variables, Actions, Variables: add `AGENTS_ENABLED` with the value `true`. This is the only thing that makes `agents.yml` run at all (checked in code: the `plan` job has `if: vars.AGENTS_ENABLED == 'true'`, and the `run` job needs `plan`). Do it after sections 2 and 3, or the first ticks will bootstrap labels and issues and then sit "waiting for" the secrets. To stop every tick later, delete the variable; `AGENTS_PAUSED=true` (section 7) pauses assignments but keeps the board current.

## 5. First tick, in order

With `AGENTS_ENABLED` set, run it by hand before trusting the schedule: Actions, Agents, Run workflow, set `agent` to `chief-of-staff` and leave `task` empty. (The `agent` input takes a list; checked in the dispatcher.)

What happens, and which agent goes first (checked in `scripts/agents/dispatch.mjs` and `OPERATING_MODEL.md`):
1. **Bootstrap.** Labels, 24 journal issues (label `journal`, one per agent) and the issue titled "Agent board" are created if missing.
2. **Dispatcher priority per agent:** fix its own PR, then handoffs, then reviews (red team and stewards), then the next ready backlog task, then a standing duty only if something changed.
3. **First day.** There are no agent PRs yet, so `red-team` and the five stewards (`principal-architect`, `data-steward`, `security-architect`, `compliance-engineer`, `ai-eng-lead`) have nothing to review and fall to standing duties. The delivery agents take the first ready backlog task for their role. Ready v1.0 tasks named in the backlog's status table: BL-330, BL-347, BL-322, BL-342, BL-349. On 15 Oct BL-330 and BL-347 already have an open PR (#139) and BL-322 has #148; the dispatcher skips any task whose id is in an open PR's title or branch (`takenIds` in `scripts/agents/lib.mjs`), so they are not started twice. The ones touching `supabase/**` or sign-in (BL-330, BL-347) need the `approve-migration` label and an independent review before they merge (D-041), so they will wait on you.
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
- **Emergency stop:** set the repository variable `AGENTS_PAUSED` to `true`. The next tick starts nothing but still refreshes the board. To stop the ticks themselves, delete `AGENTS_ENABLED`.
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
- A live tick with `AGENTS_ENABLED` set: the gate was verified by reading the workflow and parsing it, not by a run. #4's CI was green on 15 Oct (`required`, tests and content rules, database rules, Deno, typecheck, migration guard, agents-check); #39 and #42 pass the same gate before they merge.
