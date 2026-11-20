## Review B at 27b963dfb03eb94affec8f4e5552440d42d3310e: PASS WITH NOTES

Lens B: CI supply chain and workflow security (chapter 06, SEC-R10, SEC-R11, SEC-R03, SEC-R13). Read-only review; nothing posted.

Head checked via REST at start and again before writing: 27b963dfb03eb94affec8f4e5552440d42d3310e (one commit, parent 697233d35c5420623d26fb0ab2282b070e51c33e). The parent is the current tip of `develop` (compare: identical), so there is no drift against the base. Line numbers below are in `.github/workflows/ios-compile.yml` at the head.

### What I checked

1. Diff, parent against head: only the `compile` job's xcodebuild step changes: +184-188 (comment, `linker=`, the `grep -n -E -B 2 -A 30 ... | head -300 > "$linker" || true`, the conditional `cat`), and 212-213 (adds `head -80 "$linker"` to fail.txt; adds a fenced "Linker and tool errors" block to `$GITHUB_STEP_SUMMARY`). The diff matches the PR body (1 file, +7 -1).
2. Trigger, permissions, secrets. `on: pull_request` (paths) and `workflow_dispatch` only (30-40); there is no `pull_request_target`. The workflow-level `permissions: contents: read` (42-43) has no job-level raise. Grep of the file at the head finds no `secrets.`, `github.token`, `GITHUB_TOKEN`, `pull_request_target` or `ACTIONS_` (so `ACTIONS_ALLOW_UNSECURE_COMMANDS` is not set). checkout has `persist-credentials: false` (68, 262, 295). Signing is off: `CODE_SIGNING_ALLOWED=NO CODE_SIGNING_REQUIRED=NO` (179).
3. Job env. Workflow env 49-53 (CI, EXPO_NO_TELEMETRY, XCODE_VERSION, NODE_VERSION). Step env 162-164 (WORKSPACE, SCHEME from the project facts step). `$GITHUB_ENV` from the eas.json `testflight` profile is filtered to `^EXPO_PUBLIC_[A-Z0-9_]+$` with no CR or LF (115). At the head those keys are ANALYTICS, APP_ENV, BACKUP, DOCS_BASE_URL, ENGLISH_ONLY, SERVER_FEATURES, SPOKEN_LANGUAGES and STATUS_REPORT, all `EXPO_PUBLIC_*` flags, which are public by SEC-R03.
4. Workflow command parsing, from the runner source on github.com/actions/runner main, fetched 2026-11-20:
   - `src/Runner.Common/ActionCommand.cs`: TryParseV2 does `message.TrimStart()`, then `StartsWith("::")`. The legacy TryParse finds `"##["` with `IndexOf`, so anywhere in a line. Data escapes are `\r`->%0D, `\n`->%0A and `%`->%25.
   - `src/Runner.Worker/ActionCommandManager.cs`: V2 first, then the legacy parser as an unconditional fallback. set-env and add-path throw unless unsupported commands are allowed.
   - `src/Runner.Sdk/ProcessInvoker.cs`: stdout is read with `reader.ReadLine()`. The dotnet/runtime `StreamReader.cs` (fetched the same day) defines a line as ending in `\r`, `\n` or `\r\n` (`IndexOfAny('\r', '\n')`).
5. Local simulation of lines 186-188 and 212-213, in bash with GNU grep, under the step's `set +e; set -uo pipefail`. The fake log held a line-start `::add-mask::`, a line-start triple backtick, a mid-line `##[add-mask]`, and a symbol line with an embedded CR followed by `::stop-commands::`. Results:
   - Every line of `$linker` starts with `N:` or `N-` (or is `--`).
   - The line-start `::` and the triple backtick are prefixed (`9-::add-mask::...`, `10-` followed by the backticks).
   - The summary has exactly two fence lines, its own open and close.
   - The mid-line `##[` and the CR both survive into the stdout of line 188 and into fail.txt (2 CR bytes, one from the new `head -80 "$linker"` and one from the old `tail -60 "$log"`).
6. Pins and runners (SEC-R10), unchanged by this PR:
   - `actions/checkout@3d3c42e5...` (66, 259, 293)
   - `actions/setup-node@82076278...` (99, 306)
   - `actions/cache@55cc8345...` (139, 153, 344)
   - `actions/cache/restore@55cc8345...` (360)
   - `actions/upload-artifact@cf430e03...` (244, 463)

   All are full SHAs with a version comment. Runners are `macos-26` and `ubuntu-24.04`, fixed labels. Caches (138-158, 343-365), concurrency (45-47) and the `changes` and `launch` jobs are byte-identical to the parent.
7. Check runs at the head (REST, 2026-11-20T04:23Z) and required contexts on `develop` (branch protection: `applied migrations unchanged`, `required`, `compliance-fence`).

### Findings

Must fix: none.

Notes (none blocks under this lens):

N1. Workflow command injection: bounded, and the same class as before, not a new capability (SEC-R11 met).
- What the new code gets right. The `grep -n` at 187 prefixes every output line with a line number. So no log line can start a V2 `::` command at 188, and no log line can close the summary fence at 213. On that vector the new print is stricter than the existing raw prints: line 189 (raw matching lines) and line 238 (`tail -150 "$log"`, unfiltered, on failure).
- What remains. Two paths stay open in the new lines, as they already are in 189, 238 and the old parts of 212:
  - (a) A legacy `##[command]` anywhere in a log line is parsed, because `IndexOf` does not care about the prefix.
  - (b) A bare CR inside a log line is a line break to the runner, so text after it that starts with `::` becomes a command. At 212, sed and awk escape `%` and `\n` but not `\r` (the runner's escape for CR is %0D). The `::error` at 214 can therefore be split by a CR.
- Why the impact is nil:
  - Whoever controls the log text already runs code in this job: the PR author or a dependency, through npm lifecycle scripts (106), app.config.ts evaluated by prebuild (122), the Podfile in pod install (150) and Xcode script phases.
  - On `pull_request`, the PR author also controls this workflow file.
  - No secret is in scope and the token is read-only.
  - set-env and add-path are disabled.
  - The step has no `id` and the job has no `outputs:`, so set-output has no consumer.
  - The worst case is add-mask, stop-commands or fake annotations muddying the report. The step still exits with `$status` (240), so a failed build still fails the job.
- Suggested follow-up, separate PR, covering 188, 189, 212 and 238 together: pass log-derived text through `tr -d '\r' | sed -e 's/::/: :/g' -e 's/##\[/# #[/g'`, as the `launch` job already does at 435, or wrap the prints in `::stop-commands::<random>` and `::<random>::`. This is a SEC-R11 hardening idea, not a gate on this PR.

N2. Secret exposure: nothing new.
- The new lines read only `"$log"` and the derived `$RUNNER_TEMP/linker-errors.txt`. They print a bounded subset (at most 300, 80 and 120 lines) of a file the job already publishes in full as the `xcodebuild-log` artifact on failure (242-248) and in part through `tail -150` (238).
- No env, token or credential is read or echoed. The only env the build sees is listed in check 3, and none of it is secret.

N3. Markdown summary (213): safe. The block is fenced and every content line carries a `N:`/`N-` prefix, so the fence cannot be closed early and nothing inside renders as Markdown or HTML. Out of scope, for contrast: line 209 (pre-existing) writes compiler error messages as raw Markdown list items, with only the path in backticks.

N4. Cosmetic, outside this lens: line 213 is in the `elif [ $status -ne 0 ]` branch without an `[ -s "$linker" ]` guard. When the build fails without any linker or tool match (for example a script phase failure), the summary gets the heading and an empty code block. Simulated. A guard would tidy it.

N5. Process: SEC-R13 (chapter 06, line 59 on `develop`) still names the founder's `approve-migration` label for `.github/**`, and the PR has no labels. The merge gate in force is D-107, D-117 and D-132: two independent counted reviews on the head plus green CI, with Karma merging. The chapter text has drifted from D-132. That is mine to fix in chapter 06, not a finding against #844.

### CI at the head (not green yet)

- Required contexts:
  - `applied migrations unchanged`: success.
  - `compliance-fence`: success.
  - `required`: not yet reported. It is ci.yml's aggregator (`needs: [install, unit, db, functions, typecheck, seam-guard]`) and was waiting on `tests and content rules`, which was in progress.
- Other checks: install, typecheck, database rules, edge functions, no e2e seam and native files changed? all succeeded.
- `iOS simulator build (no signing)` (the job this PR edits) and `store-profile Release launch` were queued. Neither is a required context, but the first is the only run that exercises the new lines on the macOS runner.
- Merge should wait for `required` green and for the iOS compile job to finish green, so the success path (empty `$linker`, nothing extra printed) is shown on the real runner.

### Not verified

- Behaviour on the macOS runner. The simulation used GNU grep on Linux. macOS ships BSD grep, whose `-n -A -B` output format (`N:`, `N-`, `--`) I expect to match but did not run. N1's prefix argument depends on it.
- The failure path on a real failing link: no failing build has run with this head.
- That the pinned SHAs map to the tags in their comments. They are unchanged by this PR, so I did not re-derive them.
- GitHub annotation and step summary size limits when the `-B 2` context includes a long clang link invocation (cosmetic: an oversized summary is dropped, and the job result is unaffected).
- Fork pull request approval settings and the current runner handling of stdout set-output. Both are repo or platform settings outside the file, and neither matters here (no consumer, no secrets).
- learn.microsoft.com was not reachable from this session. The CR line-break behaviour is cited from the dotnet/runtime source instead.

Reviewer: independent of the author (CR-44).
