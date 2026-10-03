# ADR 0015: Open-weight models by default, through OpenCode and OpenRouter

- **Status:** Accepted, 2026-10-03.
- **Deciders:** founder ("I would not want to burn that amount of money").
- **Amends:** ADR 0014 (the agent harness). Everything there stands except the engine.
- **Related:** `agents/roster.json` (`engines`), `scripts/agents/run-opencode.mjs`, `docs/agents/HARNESS.md` sections 3, 9 and 10.

## Context

ADR 0014 ran every agent on Claude through the API. At the team's daily cap that models out at roughly $420 to $3,400 a month, too much for this project. Open-weight models have improved sharply: on their own model cards, DeepSeek V4.1 Flash, GLM-5.3 and Kimi K3 report agentic coding results close to recent Claude Opus versions, at a fraction of the price. Those results are self-reported, run in each vendor's harness, and compared with older Claude versions, so they are a signal, not a guarantee.

Running Claude Code itself against other vendors' models raises licence and support questions I could not settle from Anthropic's documentation, so the open-weight path uses an open-source agent runner instead.

## Decision

1. **Engines are per agent.** `opencode` is the default; `claude-code` stays available for any agent by changing one roster field.
2. **OpenCode (MIT), pinned to 1.18.34**, runs headless in the existing agents workflow. It reads `CLAUDE.md`, takes deny rules for founder-only commands, and sharing is disabled.
3. **OpenRouter** is the single provider connector: one key with its own monthly budget, zero-data-retention routing, and any listed model by name.
4. **Models:** DeepSeek V4.1 Flash (MIT weights) for every role except the red team, which uses GLM-5.2 (MIT weights) so reviews come from a different model family than the work. Prices on 3 Oct 2026, per million tokens (input / output / cached input): $0.30 / $1.20 / $0.006 and $0.41 / $3.99 / $0.26.
5. **The runner adds the hard stops the engine lacks:** a dollar cap and a step cap per run ($2, or $3 for the red team), and it stops any paid model that reports no cost, so the cap can never be blind.
6. **The agents GitHub App** (created by the founder) is the open-weight agents' identity: their PRs trigger CI and can be approved by the founder. It has no Workflows or Administration permission.

## Consequences

- Modelled spend at the full daily cap drops to roughly $70 to $510 a month (HARNESS.md section 10). The OpenRouter key budget is the hard stop.
- Expect more rework on hard tasks than with Claude; CI, the red-team review and the founder's approval stay in place. Receipts show cost and outcome per run, so weak spots show up fast; moving an agent to a stronger model or to Claude is a one-line change.
- One more founder step (the GitHub App) before agents can run.
- Not verified end to end until the first run with real keys: the cost field in OpenCode's JSON output (the runner fails safe if it is missing), and `gh auth setup-git` with the App token on the runner.

## Sources (opened 3 Oct 2026)

- OpenRouter model list and prices: https://openrouter.ai/api/v1/models; key budgets and data policies: https://openrouter.ai/docs/guides/features/guardrails
- Model cards and licences: https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash, https://huggingface.co/zai-org/GLM-5.2, https://huggingface.co/zai-org/GLM-5.3, https://huggingface.co/moonshotai/Kimi-K3
- Third-party leaderboard, for context only: https://benchlm.ai/benchmarks/terminal-bench-2
- OpenCode: https://github.com/anomalyco/opencode (MIT; `run --format json`, `--auto`, `OPENCODE_CONFIG`, `share: disabled`); npm `opencode-ai` 1.18.34
- GitHub App tokens: https://github.com/actions/create-github-app-token (v3, `client-id`)
