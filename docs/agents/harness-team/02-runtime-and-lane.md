# 02: Runtime and the one narrow lane

Harness team, engineer 2 of 3. Written 31 Oct 2026, during the freeze (D-130: go/no-go Mon 9 Nov). Design and prototype only. Nothing was pushed, commented, signed up for or keyed. No model was called.

Read for this: `docs/agents/HARNESS.md`, `.github/workflows/agents.yml`, `scripts/agents/**` (`run-opencode.mjs`, `dispatch.mjs`, `lib.mjs`, `brief.mjs`, `hardening.mjs`, `check.mjs`), `agents/roster.json`, ADR 0018, ADR 0019, `docs/DECISIONS.md` D-127, `docs/agents/cto/RULINGS.md` CR-5 (all on `origin/develop` e8b761db), CR-19 and CR-20 (`origin/docs/cto-rulings-cr6-cr20`), PR #349 (H1) and #353 (H8) through the REST API. Note: the local clone is checked out on `docs/cto-rulings-cr6-cr20`, not `develop`; everything above was read from `origin/develop` with `git show`.

Marking: **UNVERIFIED** means I could not confirm it this session. Every third-party claim has a source in section 5, read on 31 Oct 2026.

## 0. Summary

- **Runtime: keep OpenCode**, but change how it is run. It is MIT, released 1.19.5 on 28 Oct, has a documented headless `run --format json`, and takes any OpenAI-compatible endpoint as a config block. The change that matters is not the runtime: the model must never hold a GitHub token, and its permissions must be "deny everything, allow a few things", not "allow everything, deny a list". Aider is the runner-up for small models, because it needs no tool calling. OpenHands' CLI says it is no longer maintained. Goose leans hardest on tool calling.
- **Lane: add one unit-test file a day** for the least covered source file in four low-risk workspaces (`packages/api`, `analytics`, `design-tokens`, `emails`). Plain code picks the target, and no issue, PR or comment text is read. The model has no GitHub token and can only create one file in `<workspace>/test/lane/`. A plain-code gate checks the patch. A separate job publishes the PR as the agents App. One open lane PR at a time.
- **Engine switch**: a working draft diff (8 files, 123 harness tests pass, `check.mjs` clean) moves OpenCode from OpenRouter to any OpenAI-compatible endpoint named by repository variables. It replaces the blind dollar cap with a token cap and a stall watchdog. It fixes a bug that would kill every free-endpoint run at step 5.
- **Before anything runs** (preconditions, none met today): branch protection or a ruleset that stops the App pushing to `develop`, `main` or release tags; H1 merged and the App created; the `lane-guard` required check; and a free route proven with no card (D-127 item 4). CR-5 already says this; the lane design depends on it.

## 1. Runtime comparison

All four are open source and can run in a GitHub Actions job. The question is which one fails safest on a free, rate-limited, small open-weight model.

| | OpenCode (current) | aider | OpenHands (CLI) | Goose |
|---|---|---|---|---|
| Licence | MIT (npm `opencode-ai` licence field; ecosyste.ms repo record) [S1, S2] | Apache-2.0 (PyPI classifier) [S8] | MIT (PyPI `openhands`, `openhands-ai`; CLI README) [S12, S13] | Apache-2.0 on `goose-providers` from `aaif-goose/goose` (crates.io). Whole-repo licence UNVERIFIED [S17] |
| Maintained | 1.19.5 published 28 Oct 2026; harness pins 1.18.34 (30 Sep) [S1] | Last release 0.86.2 on 12 Feb 2026; the one before was 13 Aug 2025 [S8]. Slow | CLI README: "This project is no longer actively maintained", points to Agent Canvas [S13]. Last CLI release 1.16.0, 8 May 2026 [S12] | `goose-providers` 0.1.0-alpha.13, 24 Oct 2026; project now under AAIF [S14, S17] |
| Headless / CI | `opencode run [message]`, `--format json` (raw JSON events), `--model provider/model`, `--variant` [S3]. `--auto` ("auto-approve permissions that are not explicitly denied (dangerous!)") is in the 1.18.34 binary but not in the CLI docs page [S1 binary, S3]. A GitHub Action exists (`anomalyco/opencode/github`); its `share` input defaults to true on public repositories [S5] | `--message` / `--message-file` then exit; `--yes-always`; `--auto-commits`; `--test-cmd` and `--auto-test` loop on failing tests [S6, S9] | `openhands --headless -t` or `-f`, `--json` (JSONL events); headless always auto-approves [S10, S11] | `goose run -t`, `--recipe`, `--no-session`; `GOOSE_MODE=auto`, `GOOSE_MAX_TURNS`; the docs include a CI example [S14] |
| OpenAI-compatible endpoint | Custom provider: `npm: "@ai-sdk/openai-compatible"`, `options.baseURL`, `apiKey: "{env:...}"`, `models.<id>.limit.context/output` [S4]. Ollama, Groq, Cerebras, OpenRouter and LM Studio are listed; GitHub Models is not (only GitHub Copilot) [S4] | `OPENAI_API_BASE` plus `OPENAI_API_KEY`, model `openai/<name>` [S7] | Custom model `openai/<id>` with a base URL [S11]. CLI: `LLM_MODEL`, `LLM_BASE_URL` and `LLM_API_KEY` are ignored unless `--override-with-envs` is passed [S13] | `OPENAI_HOST` and `OPENAI_BASE_PATH`, or a custom provider JSON with `"engine": "openai"`. Groq, OpenRouter, Ollama and Cerebras are listed; GitHub Models is not [S15] |
| Tool calling with smaller open models | Native tool calls through the AI SDK; no doc statement on small models was found. **UNVERIFIED**: must be measured | Edits are text blocks (whole, diff, diff-fenced, udiff) in the reply, not tool calls [S9b]. This is the most forgiving design for weak models | Docs: "Even with a large context window, some local models may struggle with reliable tool use"; they recommend Qwen3.6-35B-A3B [S11] | Docs: goose "relies heavily on tool calling"; models without it "can only do chat completion" with all extensions off; they recommend Claude 4 [S15] |
| Context needs | `limit.context` per model; auto-compaction is on by default (`OPENCODE_DISABLE_AUTOCOMPACT` exists) [S3, S4]. System prompt and tool-schema size: **UNVERIFIED** (estimated about 10k tokens below) | Only the files added to the chat, plus a repo map (`--map-tokens`) [S6b]. Aider sizes Ollama's `num_ctx` itself, because Ollama's 2k default "silently discards context" [S16] | At least 22,000 tokens; 32,768 recommended; Ollama's 4096 default is too small [S11] | `GOOSE_CONTEXT_STRATEGY=summarize` is recommended for automation [S14]; size not stated |
| On a 429 | From the 1.18.34 binary: up to 5 retries, 2 s first delay, doubling, 25% jitter, at most 30 s apart without a header. It honours `retry-after-ms` and `Retry-After` **with no practical upper bound** (2^31 ms). It retries 429, 5xx and messages like "rate limit" or "resource exhausted" [S1 binary]. So one daily-quota 429 with a long Retry-After parks the run until the job timeout | Doubling backoff from 1 s; the reporter of issue #3265 says it ignores `Retry-After`. The issue's state is not visible and current behaviour is UNVERIFIED [S18]. `--timeout` defaults to none [S6b] | Not documented in the pages read. **UNVERIFIED** | Retry settings are documented only for GCP Vertex (5 retries, 5 s first, x2, 320 s cap). The OpenAI-compatible provider: **UNVERIFIED** [S15] |

**Pick: OpenCode, kept and pinned, run in a locked-down profile.** Why:
1. Lowest switching cost. The runner, receipts and salvage already parse its JSON events, and the endpoint switch is one config block (section 3).
2. Its permission model can express "deny all, allow a few". The last matching rule wins, and `edit` takes path patterns [S4b]. That is what lets the model write exactly one folder.
3. It is actively released and MIT.

What I do not like about it, plainly:
- `--auto` approves everything not denied, including the two kinds that default to "ask" (`external_directory`, `doom_loop`). The flag is undocumented on the CLI page.
- The uncapped Retry-After is a footgun on free tiers.
- It is a 185 MB binary downloaded on every run, from a project that went from 1.18 to 1.19 in a month.

The draft diff adds a stall watchdog for the retry problem and explicit denies for the rest.

**Runner-up: aider**, if a small model's tool calling proves unreliable on the calibration set (plan item 2). It needs no tool calling, it has a built-in test loop, and it has no shell tool of its own, which suits a lane where the model should only edit one file. Against it: no release since February, and a reported Retry-After problem. **Not OpenHands**: its CLI repo says it is no longer maintained, and its docs warn about tool use on local models. **Not Goose** for this lane: it leans hardest on tool calling, and its OpenAI-compatible retry behaviour is undocumented.

Not assessed: Codex CLI, mini-swe-agent and others. I did not read their docs this session.

What none of this tells us: whether any free model writes useful tests in this repo. That is an empirical question, and no model was called (no keys during the freeze). The first post-freeze step is to run the lane by hand against the calibration set with OpenCode and with aider on the same route.

## 2. The lane: one test file a day

### 2.1 What it does, and why this one

The lane adds one new unit-test file per run, for the least covered eligible source file in `packages/api`, `packages/analytics`, `packages/design-tokens` or `packages/emails`. Each file lives at `<ws>/test/lane/<slug>.lane.test.ts`. The lane never modifies an existing file.

Why this kind of work:
- **It cannot change product behaviour.** A new test file in a dedicated folder changes no shipped code. The worst merged outcome is a weak or wrongly-pinned test, which the founder can delete.
- **It is mechanically checkable.** Tests pass three times, coverage of the named file went up, the paths are right and the imports are clean. Plain code can check all of that (`lane/gate.mjs`, 6 tests).
- **There is real backlog.** `docs/qa/COVERAGE.md` puts emails, analytics and api branches at 81 to 92% and the merged total at 72%.

Alternatives I measured and rejected:
- **Docs link fixes.** A link checker I wrote (`lane/linkcheck.mjs`) finds 229 broken relative links in `docs/`. All 229 are generated screenshots that are gitignored (`.gitignore:96-99`), so there is no backlog. Stale backtick paths number about 700, but most are planned files named in PRDs. Fixing them takes judgement, and `docs/BACKLOG.md` rule 8 forbids agents editing requirement documents.
- **Lint.** The root `package.json` has no lint script (BL-268 adds rules; it does not fix findings).

Out of scope for now:
- `packages/core`: the constitution's `verify.ts`, `meaning.ts`, `types.ts`, `pipeline.ts` and `plan.ts` live there, and its tests guard them.
- `packages/content`: "fix the copy, not the test".
- `packages/brand`: it holds the public name.
- `apps/mobile`: its 0% files are native glue that needs mocks a small model is likely to get wrong. Revisit after the trial.

### 2.2 Trigger, cadence and budget

- **Trigger**: `schedule` at 11:41 UTC on weekdays (one run a day), plus `workflow_dispatch`. Draft: `lane/lane-tests.yml`.
- **It must live on the default branch.** Scheduled workflows register only from the default branch (`main`), which is why `agents.yml` never ran (HARNESS.md box, CR-1). So the lane needs its file on `main` (as with held #398), or the default branch must change (AF-05).
- **One open lane PR at a time.** The `pick` job exits if one is open. The founder's review time is the throughput limit (ADR 0018).

**Token math.** Estimates; S is UNVERIFIED and must be measured on the first dry run.

| Input | Size |
|---|---|
| S: OpenCode system prompt plus tool schemas | about 10k tokens (UNVERIFIED) |
| B: the brief | about 5k tokens typical, 8k at the 90th percentile. That is CLAUDE.md (5,820 chars, about 1.5k tokens), a lane brief (about 0.6k), the target file (median `packages/*/src` file 4,309 chars, about 1.1k; 90th percentile 16,091 chars, about 4k) and one sibling test as a style example (about 1.5k) |
| g: growth per step | about 1.5k tokens: file reads, test output capped at 60 lines by `test.sh`, and the model's reply |

Input over n steps is n(S+B) + g·n(n-1)/2.

| Case | Steps | Input tokens | Largest single request |
|---|---|---|---|
| Typical (n = 15, B = 5k) | 15 | about 383k | about 36k |
| At the step cap (n = 25, B = 8k) | 25 | about 900k (above the 600k token cap, so the run stops near step 20) | about 47k at step 20 |

Output is about 0.5k tokens a step, so 8 to 13k a run.

So the lane needs, per run and therefore per day:
- at most about 30 requests (25 steps plus retries);
- at most about 600k tokens (the hard cap);
- a per-request input limit of about 48k, or `AGENTS_LLM_CONTEXT` set lower so that OpenCode compacts. Compaction quality is UNVERIFIED;
- about 50k tokens a minute late in the run, to avoid constant 429s. A step every 20 to 60 s at up to 47k tokens is the worst case.

A route qualifies only if its free limits meet all four. The provider numbers belong to the other engineer's inventory; I could not open GitHub's own rate-limit page this session (fetch blocked). Two routes look doubtful:
- **Ollama on a standard hosted runner (no GPU)**: CPU prefill of 30 to 47k-token prompts per step is very unlikely to fit a 35-minute job. UNVERIFIED; benchmark it before betting on it.
- **The founder's Mac** as a self-hosted runner: OpenHands' docs suggest Apple Silicon with 64 GB or more for a 35B-A3B-class model [S11]. It means an always-on machine running repository code. CR-5 already calls it a weaker lane.

### 2.3 Identity (H1, #349) and CR-20

- **The App posts the PR.** The `publish` job mints an installation token through `scripts/agents/app-token.mjs` (H1). The PR's author is `earlyletters-agents[bot]` (name UNVERIFIED as free).
- **This is the difference from CR-20.** CR-20 notes that every session authors as `thesaurabhpareek`, and GitHub blocks authors approving their own PRs, so no approval gate can work on session PRs. Lane PRs are not authored by the founder, so **his approval on a lane PR is a real human gate**, the only one available today.
- **How to require it without blocking sessions.** Raising the repository's required approvals to 1 would block every session PR. So the requirement is a check instead: `lane-guard`, in section 2.5.
- **The marker rule from H1 stays.** Nothing the lane reads is a comment, so the founder marker never matters to it.

### 2.4 Permissions: least privilege, per job

| Job | GitHub token | Secrets | What runs there |
|---|---|---|---|
| `pick` | `GITHUB_TOKEN`: contents read, pull-requests read | none | repository code (coverage) |
| `write` | **none** (checkout with `persist-credentials: false`; `--no-github` strips `GH_TOKEN`, `GITHUB_TOKEN`, `ACTIONS_ID_TOKEN_REQUEST_TOKEN` and the App key from the model's environment) | `AGENTS_LLM_API_KEY` only, and none for Ollama | the model, and the tests it writes |
| `gate` | `GITHUB_TOKEN`: contents read, not persisted | none | the model's tests, three times |
| `publish` | App installation token, lane `worker` (H1: contents write, pull_requests write, issues write, checks read, actions read) | `AGENTS_APP_PRIVATE_KEY` | plain code only, no tests or model |

Changes I recommend to H1:
1. **Add a narrower `lane-publish` lane** with contents write, pull_requests write and metadata read only. The lane posts no journal, so it needs no issues or actions access.
2. **State the limit plainly.** Installation tokens cannot be limited to branch names, so contents write means "push any unprotected ref, including tags". The rulesets in 2.5 are what bound it.

Never granted (H1 already): administration, workflows, secrets, variables, environments, deployments.

OpenCode profile for `write` (`lane/lane-config.mjs`):
- the `"*": "deny"` default comes first;
- `read`, `glob`, `grep` and `lsp` are allowed;
- `edit` is allowed only for `packages/*/test/lane/*.lane.test.ts`;
- `bash` is allowed only for `scripts/agents/lane/test.sh *`, `ls *`, `git status*` and `git diff*`;
- webfetch, websearch, task, skill, `external_directory` and `doom_loop` are denied.

Whether OpenCode checks each part of a chained shell command (`a; b`) separately is UNVERIFIED, so `test.sh` validates its own argument as well.

### 2.5 Gates it must pass

1. **In the lane (`gate` job)**: `gate.mjs`. The change must be exactly one added file matching `^packages/(api|analytics|design-tokens|emails)/test/lane/<slug>.lane.test.ts$`. A never-list overrides it. The file must be at most 300 lines and pure ASCII (stricter than the content rules). It must contain no credential pattern; no `.only`, `.skip`, `.todo` or `.fails`; no `process.env`, `child_process`, network modules, `fetch`, file-system writes, `eval` or test-runner config. Its imports must be only `vitest` and the workspace's own `src`. It needs at least 3 `expect()` calls, at least as many as tests, and it must import the target. Then `npm test` passes three times (flakiness, BL-443), `npm run typecheck` passes, and coverage lines of the target rise by at least 5.
2. **On the PR, as required checks**: CI's `required` job (`ci.yml`, no secrets), `migration-guard`, and a new **`lane-guard`** job. On `pull_request` and `pull_request_review`, if the author is the App, `lane-guard` re-runs `gate.mjs` on the PR diff, so a broken lane cannot skip it. It then passes only if the founder has an APPROVED review on the current head SHA. For any other author it passes at once, so session PRs are unaffected. This is the CR-20 option (b) idea applied to the one identity where approval means something. Whether a check triggered by `pull_request_review` satisfies a required status reliably is UNVERIFIED.
3. **Repository rules (preconditions, founder-applied)**:
   - a ruleset on `develop` and `main` requiring a PR and the checks above, with no bypass for the App. CR-5: "`develop` has none, so an agent token can push";
   - a tag ruleset restricting creation of `db-v*` and `ios-v*` to the founder. `deploy-db.yml` deploys staging on a `db-v*` tag push, and an App with contents write could create one;
   - with no required approvals on PRs, the App could merge its own PR through `PUT /pulls/{n}/merge`. `lane-guard` as a required check is what stops that.

### 2.6 What it can never touch

The lane can never touch:
- the constitution: `packages/core/**` (including `src/verify.ts`, `meaning.ts`, `types.ts`, `pipeline.ts`, `plan.ts`) and `CLAUDE.md`;
- `supabase/**`, including migrations;
- `.github/**`, `scripts/**`, `agents/**`, `.claude/**`, `docs/**`, `packs/**`;
- `packages/content/**` and `packages/brand/**`;
- any `package.json` or lockfile, vitest config or tsconfig, `.env*`, `*.pem`, `*.key`.

Three layers enforce this:
1. OpenCode's edit allow-list. This is a tripwire.
2. `gate.mjs`'s NEVER list, plus "added files only". This is code.
3. The repository rules in 2.5. The App also has no Workflows permission, so GitHub itself refuses any push that changes `.github/workflows/`.

Secrets are never in the model's environment except the endpoint key, and `test.sh` runs tests with `env -i`, so the model's tests do not see even that.

### 2.7 Kill criterion (written)

**Trial**: the first 10 lane PRs or 21 calendar days from the first run, whichever comes first.

**Kill immediately** (procedure in 2.8) on any of these:
- K1: a lane PR or push touches anything but one file in the allowed folder, or the App writes to any ref other than `agent/tests/*`. `lane-guard` going red on path grounds counts.
- K2: a route reports any cost, asks for a card, or a run's receipt shows cost above $0 (D-127). The runner already stops the run (`error_unexpected_cost`).
- K3: a credential, real family detail or user data appears in a PR, log or artifact.
- K4: the App merges, approves, closes, or pushes to `develop`, `main` or a tag.
- K5: a merged lane test turns `develop` red, or a lane test is found weakening or hiding a real failure.

**Stop at trial end, or earlier once certain**, on any of these:
- K6: fewer than 5 of the first 10 lane PRs merged without founder edits.
- K7: the founder's median review time is over 10 minutes a PR, by his own one-line note on each PR.
- K8: more than a third of runs end with no PR because of provider limits (`error_provider_stalled`, `error_max_tokens`, or 429s), over 10 runs. That means the route does not work: pause and switch route, rather than kill.

**Continue** only with the founder's yes after the trial. Silence means stop.

### 2.8 How it stops at once

1. **Delete the repository variable `LANE_TESTS_ENABLED`, or `AGENTS_ENABLED`.** Every job's `if:` requires both. This stops new runs. Whether a variable deleted mid-run stops that run's remaining jobs is UNVERIFIED (I could not confirm when the `vars` context is evaluated).
2. **Cancel any in-progress "Lane tests" run** (Actions tab, Cancel). This stops `publish`, the only job that writes.
3. **Suspend the agents App's installation** (Settings, GitHub Apps). All of its writes stop. Whether already-minted tokens (1-hour life) stop working at once is UNVERIFIED.

The settings script (`scripts/release/apply-branch-settings.sh`, CR-5) also disables `agents.yml`. The lane's file needs the same treatment.

`AGENTS_PAUSED` is not a kill switch (CR-5).

### 2.9 Prompt-injection defence

- **No untrusted text in.** The lane reads no issue, PR, comment, journal, handoff, board or web content. Its inputs are coverage numbers and file paths (computed by code), the target source file, one sibling test, and `CLAUDE.md`, all from `develop`. That is the main defence: there is nothing for an outsider to write into.
- **Residual risk: text on `develop` itself.** Merges have 0 required approvals (CR-20), so a planted comment in a source file is possible in principle. The defence is capability, not prompt wording. A fully hijacked model in `write` can only create one file in one folder, with no GitHub token, no web tools, and one test command run with an empty environment. The gate rejects anything else, and the PR title and body are written by code (target, coverage before and after, gate results, receipt), never by the model.
- **Not blocked: network egress from model-written test code on a hosted runner.** `gate.mjs` rejects network modules and `fetch` by pattern, which a determined author can dodge. The only thing reachable is the free endpoint key, and with Ollama there is none. Rotating the key is K3 work.
- **The existing harness is weaker here.** Briefs quote founder-account comments and handoff bodies, and the model holds the App token with `bash: "*": "allow"` and webfetch allowed. See section 4.

### 2.10 Not written yet (needed before a real run)

- `lane/brief.mjs`, `lane/coverage-delta.mjs` and `lane/publish.mjs` are named in the draft workflow but not written.
- `run-opencode.mjs --profile lane` (wiring `laneConfig`) is a follow-up to the engine diff, kept separate to keep one concern per PR.
- The `lane-guard` workflow.

What is written: `gate.mjs` (6 tests), `pick.mjs` (2 tests), `lane-config.mjs`, `test.sh` (its path guard was checked by hand), and the draft `lane-tests.yml` (not linted with actionlint; the artifact action SHAs are marked "pin to verify").

## 3. Switching the engine to a free OpenAI-compatible endpoint

Draft diff: `engine-switch.diff` (against `origin/develop` e8b761db; not pushed). The patched tree is in `engine-switch/`. Results: `node --test 'scripts/agents/*.test.mjs'` gives 123 pass, 0 fail (115 before, plus 8 new). `node scripts/agents/check.mjs` reports "agent team is consistent". The diff contains no banned characters.

| File | Change |
|---|---|
| `.github/workflows/agents.yml` | Header comments. `HAS_OPENROUTER_KEY` becomes `HAS_LLM_ENDPOINT` (`vars.AGENTS_LLM_BASE_URL` and `vars.AGENTS_LLM_MODEL` set). The OpenCode step takes `AGENTS_LLM_BASE_URL`, `AGENTS_LLM_API_KEY` (secret, may be empty), `AGENTS_LLM_MODEL`, `AGENTS_LLM_REVIEW_MODEL` and `AGENTS_LLM_CONTEXT` instead of `OPENROUTER_API_KEY`, and passes `--max-tokens` and `--stall-minutes`. `max-parallel` goes from 6 to 1 |
| `scripts/agents/run-opencode.mjs` | Adds an `endpoint` provider (`@ai-sdk/openai-compatible`, baseURL and key from env, `limit.context/output`). The `endpoint/default` and `endpoint/review` aliases resolve from variables, so switching route or model needs no PR. Cost mode: `free` routes are capped by tokens, and **any reported cost stops the run** (D-127). The old `:free`-suffix heuristic is fixed: it would have stopped every non-OpenRouter free model at step 5 with `error_cost_not_reported`. A **stall watchdog** (`--stall-minutes`) handles OpenCode's uncapped Retry-After sleeps. Retry events are counted if the stream carries them (UNVERIFIED that it does). `--no-github` is added. New explicit denies: `external_directory`, `doom_loop`, webfetch, websearch, `gh api*/merge*`, `gh api*-X PUT*`, `curl*`. `OPENCODE_DISABLE_AUTOUPDATE` is set |
| `scripts/agents/run-opencode.test.mjs` | New: 8 tests |
| `scripts/agents/lib.mjs` | Roster passes `max_tokens` and `stall_minutes` through |
| `scripts/agents/dispatch.mjs` | `engineNeeds.opencode` checks `HAS_LLM_ENDPOINT`. Assignments carry `max_tokens` and `stall_minutes` |
| `scripts/agents/check.mjs` | Accepts `endpoint/default` and `endpoint/review`. Requires `max_tokens` on endpoint models instead of a positive dollar budget |
| `scripts/agents/lib.test.mjs` | The cap test checks for a cap that can see usage |
| `agents/roster.json` | `engines.opencode`: `secret: AGENTS_LLM_API_KEY`, `default_model: endpoint/default`, `default_budget_usd: 0`, `default_max_tokens: 600000`, `stall_minutes: 8`. The red team moves to `endpoint/review` with a 400k token cap. Defaults: `max_turns` 80 to 25, `timeout_minutes` 50 to 40. Limits: `max_parallel` 6 to 1, `max_runs_per_day_total` 30 to 6 |

Still to change, not in the diff:
- `docs/release/HARNESS_SETUP.md` steps 1 and 5, and `HARNESS.md` sections 3, 10 and 12, which tell the founder to buy OpenRouter credit. They conflict with D-127.
- ADR 0019 needs an amending ADR: the provider changes, and the red team's "different model family" independence now depends on the route offering a second family. That is UNVERIFIED per route.
- GitHub Models might accept the workflow's own `GITHUB_TOKEN` (with a `models: read` permission) as its key, avoiding a new secret. UNVERIFIED: I could not open GitHub's docs page this session.

## 4. Where the existing harness design is weak

1. **It has never run.** Scheduled workflows register only from the default branch, and `agents.yml` is only on `develop` (HARNESS.md box). Nothing below has been tested against a real model or the real API, and neither has this design.
2. **The model holds the write token.** The OpenCode step puts the App token in `GH_TOKEN` and gives the model `bash: {"*": "allow"}` under `--auto`. The deny list is a set of string globs:
   - `git push origin HEAD:refs/heads/develop`, `git -c x=y push`, and `gh api -X PUT .../pulls/N/merge` all pass on `develop` today (the last is added to the deny list in the diff);
   - with no ruleset on `develop` (CR-5) and 0 required approvals (CR-20), the App can push to or merge into `develop`.

   HARNESS.md section 11 says deny lists are tripwires. True, but the guarantee it relies on, branch protection, does not exist.
3. **Webfetch is allowed** in the shipped config. That is an injection inlet and an exfiltration path.
4. **The money cap is blind on free routes**, and the step-5 zero-cost stop would kill every free-endpoint run (fixed in the diff).
5. **Rate limits.** OpenCode waits out any Retry-After, and the runner had no stall watchdog. A daily-quota 429 would burn the whole job, then `salvage.mjs` would push a WIP branch. On a free tier that could be most runs, leaving branch litter nobody reviews.
6. **The scale is wrong for zero cost.** 24 personas, 30 runs a day and 6 in parallel cannot fit any free tier's per-key limits. The 28 Oct plan to cut to 4 roles and one lane is right.
7. **Trust collapses to one account.** Every "trusted" human comment is the founder's account, which every session uses. H1 documents that its marker is typed text and stops honest mistakes only.
8. **Least privilege is loose in the workflow.** The `run` job grants the default `GITHUB_TOKEN` contents write, pull-requests write, issues write and `id-token: write`, even for the OpenCode path. Permissions are per job, so the Claude Code step forces them on everyone.
9. **Supply chain.** `npm install -g opencode-ai@<version>` runs on every job with no integrity pin beyond the version, and pulls a 185 MB binary from a fast-moving project.
10. **Contents write reaches tags.** `deploy-db.yml` deploys staging on a `db-v*` tag push, so any App token with contents write can trigger it unless a tag ruleset stops it.
11. **The design depends on an undocumented flag.** `--auto` is absent from OpenCode's CLI docs page and is self-described as "dangerous!".

## 5. Sources (all read 31 Oct 2026)

- S1: npm registry, `npm view opencode-ai` (licence MIT; 1.18.34 published 2026-09-30; latest 1.19.5, 2026-10-28); `npm pack opencode-linux-x64@1.18.34`, binary strings read for the `run` options and the retry constants (`RETRY_MAX_RETRIES=5`, `RETRY_INITIAL_DELAY=2000`, `RETRY_BACKOFF_FACTOR=2`, `RETRY_MAX_DELAY_NO_HEADERS=30000`, `RETRY_MAX_DELAY=2147483647`).
- S2: https://awesome.ecosyste.ms/projects/github.com%2Fanomalyco%2Fopencode (MIT; last push 2026-06-09 per that mirror, which lags npm).
- S3: https://opencode.ai/docs/de/cli (run flags, env vars).
- S4: https://opencode.ai/docs/de/providers (custom OpenAI-compatible provider, provider list). S4b: https://opencode.ai/docs/de/permissions (keys, last match wins, path patterns, defaults).
- S5: https://opencode.ai/docs/de/github (GitHub Action inputs; `share` defaults true on public repos).
- S6: https://aider.chat/docs/scripting.html. S6b: https://aider.chat/docs/config/options.html.
- S7: https://aider.chat/docs/llms/openai-compat.html.
- S8: https://pypi.org/pypi/aider-chat/json (Apache classifier; releases 0.86.1 2025-08-13, 0.86.2 2026-02-12; homepage github.com/Aider-AI/aider).
- S9: https://aider.chat/docs/config/options.html (`--test-cmd`, `--auto-test`). S9b: https://aider.chat/docs/more/edit-formats.html.
- S10: https://docs.openhands.dev/openhands/usage/cli/headless. Also https://docs.openhands.dev/openhands/usage/run-openhands/headless-mode.
- S11: https://docs.openhands.dev/openhands/usage/llms/local-llms.
- S12: https://pypi.org/project/openhands/1.15.0/ and https://pypi.org/pypi/openhands/json (MIT; 1.16.0, 2026-05-08); https://pypi.org/pypi/openhands-ai/json (MIT; 1.11.0, 2026-07-09).
- S13: https://github.com/OpenHands/OpenHands-CLI (MIT; "no longer actively maintained"; `--override-with-envs`).
- S14: https://goose-docs.ai/docs/tutorials/headless-goose; https://goose-docs.ai/docs/gdk/.
- S15: https://goose-docs.ai/docs/getting-started/providers.
- S16: https://aider.chat/docs/llms/ollama.html.
- S17: https://crates.io/api/v1/crates/goose-providers (Apache-2.0; repository aaif-goose/goose; 0.1.0-alpha.13, 2026-10-24).
- S18: https://github.com/Aider-AI/aider/issues/3265 (reporter's account of 429 handling; state not visible).

GitHub's REST API for third-party repos was refused in this session (not attached), so the repo-level facts come from the registries above. GitHub Models' rate-limit docs could not be fetched (URL not allowed), so no GitHub Models numbers appear here.
