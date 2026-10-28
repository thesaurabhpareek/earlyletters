# Brief (a): provision the Actions agent lane, or retire it

Status: open, not decided. Needed by Thu 5 Nov (proposed go/no-go). Brief (b) depends on this one.
Default if unanswered: nothing changes. `agents.yml` stays unregistered and idle, the 24-agent roster stays, and the question keeps coming back in triage.
Conflict of interest: the session that commissioned this brief built the harness.

## Question
Should the GitHub Actions agent lane (`.github/workflows/agents.yml`) be made to run, or be retired for v1.0 with the roster trimmed to what is used?

## Evidence
- The default branch is `main` (GitHub API, 28 Oct). The workflows API lists 14 workflows; `agents.yml` is not one of them, so its schedule ([agents.yml:21](../../../.github/workflows/agents.yml#L21)) has never fired.
- Once registered, every tick still skips unless `vars.AGENTS_ENABLED == 'true'` ([agents.yml:42](../../../.github/workflows/agents.yml#L42)). Engines need `OPENROUTER_API_KEY` or `ANTHROPIC_API_KEY` ([agents.yml:14](../../../.github/workflows/agents.yml#L14)).
- `agents/roster.json` lists 24 agents; 4 carry `paused_until`. The retro panels report 13 never ran (retro IMP-11; not rechecked here).
- The separate 4-hourly scheduled lane left no journal entry in four weeks (retro spot-check 23).
- Agents post through the founder's account, so trust checks cannot tell an agent from the founder (retro IMP-06; unverified here).

## Options
| Option | What it changes | Cost or risk |
|---|---|---|
| 1. Provision | Default branch to `develop` (with the ruleset step in Wave 0 item 9), an API key secret with a spend limit, `AGENTS_ENABLED=true` | About 1 to 2 hours of founder time plus spend. An unattended lane writes to a public repo as the founder in freeze week, with the IMP-06 trust gap open |
| 2. Retire for v1.0 | Record that the Actions lane is not used for v1.0; leave `AGENTS_ENABLED` unset; disable the 4-hourly task (Wave 0 item 2); trim the roster after #316, #164 and #112 resolve; files stay, so it can return later | Sunk cost written off. Robustness items RB-10, RB-11, RB-32 and RB-35 drop. Low risk; reversible |
| 3. Pause and decide after the alpha | Same as the default, with a named review date | Low risk; the open question keeps costing triage time |

Option 2 does not block moving the default branch to `develop` for `nightly.yml`: `agents.yml` registers but stays idle while `AGENTS_ENABLED` is unset.

## Recommendation (a recommendation, not a decision)
Option 2. In four weeks there is no evidence the lane produced merged work, and provisioning during freeze week adds unattended writes for no release benefit. Revisit after v1.0 with an agent identity of its own.
