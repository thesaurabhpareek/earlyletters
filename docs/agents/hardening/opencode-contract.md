# OpenCode contract: real engine versus run-opencode.mjs

Tested: `opencode-ai@1.18.34` (the version pinned in `agents/roster.json`), linux-x64, Node 22.22, on 2026-10-31.
Tests: `scripts/agents/opencode-contract.test.mjs`. Fixtures: `scripts/agents/fixtures/opencode/`.

## How the evidence was made

1. `npm install opencode-ai@1.18.34` into an empty scratch directory outside the repo. Nothing from inside it was run except the `opencode` binary, by absolute path.
2. A local stub OpenAI-compatible server (`/v1/chat/completions`, streaming SSE with a `usage` chunk) replayed a scripted plan: text, then tool calls, then a final text step. Dummy API key, no outbound model calls, proxy variables cleared, isolated `HOME` and XDG directories.
3. The config was `opencodeConfig()` imported from the repo, with only the `provider` swapped for the stub (once with a model price, once without).
4. `opencode run --format json --model stub/stub-model --auto` ran with a fake `git` and `gh` first on `PATH` that append their arguments to a log and do nothing else.
5. Raw stdout was saved with the scratch path rewritten to `/work`. No other edits.

## What matched

- Event types seen: `step_start`, `text`, `tool_use`, `step_finish`. No other types appeared in these runs.
- `step_finish` carries `part.cost` (number) and `part.tokens = {total, input, output, reasoning, cache: {write, read}}`. This is the shape `tally()` reads. Steps, cost and token sums from the real output match hand computation exactly.
- Cost is computed by opencode from the model's configured price. With a price, cost is non-zero.
- A denied tool call surfaces as a `tool_use` with `state.status: "error"`; the run continues and still emits `step_finish`.
- Deny globs that blocked (real binary): `git push origin develop`, `git push origin main`, `git push --force origin x`, `gh pr merge 1 --squash`, `gh pr merge 1` (also after `cd /tmp &&`), `gh pr close 2`, `gh api -X DELETE ...`. The fake `gh`/`git` recorded no call for any of them.
- Permitted commands ran: `git status`, `git push origin test/x`, `gh pr create --fill`.

## What did not match, or was learned

1. **Deny gap (needs a fix in run-opencode.mjs).** `git push origin HEAD:develop` RAN (the fake git recorded it), as did `git push origin HEAD:main`, `git push -u origin HEAD:refs/heads/develop` and `git -C . push origin develop`. The globs only match the literal prefix `git push origin develop*` / `main*`. Four `[expected failure]` todo tests in the contract file fail until the patterns cover these forms; remove the todo markers when fixed. Note a glob cannot cover every spelling (aliases, `git push` with a configured upstream, shell indirection): server-side branch protection on `develop` and `main` remains the real control.
2. **Unpriced model reports cost `0`, not absent.** `part.cost` is the number `0` and tokens are still reported. `tally()` handles it, and the runner's `steps >= 5 && cost === 0` fail-safe condition fires at step 5 when replayed. So the dollar cap is blind for a model with no price in OpenCode's model list, but not silently so. (Only tested with a custom provider lacking `cost`; whether OpenRouter's built-in models list prices for every model in the roster was not tested.)
3. `tokens.input` excludes cache reads (prompt 1000 with 400 cached gave input 600, cache.read 400), so `tokens.input` in the receipt is uncached input only. Not a bug, but worth knowing when reading receipts.
4. `--auto` was accepted by 1.18.34 and the runs completed with exit 0.

## UNVERIFIED

- The OpenRouter provider path (`openrouter/...` model ids, `{env:OPENROUTER_API_KEY}`) and real prices from the OpenRouter catalogue. The stub used a custom `@ai-sdk/openai-compatible` provider.
- Reasoning tokens from a real reasoning model (the stub reports `reasoning: 0`; `tally()` adds `reasoning` to `output`, which matches the field name but was not exercised with a non-zero value).
- Error events (provider 4xx/5xx, rate limits, aborted runs), `--variant`, and event types that only appear with other tools (`task`, `todowrite`, subagents).
- Behaviour on macOS or in the Actions runner image.
- Any other opencode version.

## Reproducing

Install the pinned version in a fresh empty directory, point a stub server at `/v1/chat/completions`, and run the command in step 4 above from an empty working directory with a fake `git`/`gh` on `PATH`. Replace the fixtures only with output captured the same way, and update the numbers asserted in the test.
