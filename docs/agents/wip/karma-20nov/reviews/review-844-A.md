## Review A at 27b963dfb03eb94affec8f4e5552440d42d3310e: PASS WITH NOTES

Lens A: CI correctness and safety. PR #844, `ci(ios): print linker and tool errors before the capped warnings list`, base develop 697233d35c5420623d26fb0ab2282b070e51c33e. One file, .github/workflows/ios-compile.yml, +7 -1, matching the PR body. Line numbers below are in the file at the head.

### What I ran

- `gh api .../pulls/844`: head 27b963dfb03eb94affec8f4e5552440d42d3310e, as expected. Checked again before writing; unchanged.
- Downloaded the file at base and head and diffed them. The only changes are lines 184-188 (new) and 212-213 (one line changed, one added). The YAML parses (python yaml.safe_load). I pulled the `xcodebuild` step's `run:` out of each version and ran `bash -n` on it.
- Harness: ran the base and head step scripts with `bash --noprofile --norc -eo pipefail` (the GitHub `shell: bash` wrapper), with a stub `xcodebuild` on PATH that cats a synthetic log and exits 0 or 65. RUNNER_TEMP, GITHUB_WORKSPACE (two fake local modules, one with a built product) and GITHUB_STEP_SUMMARY were fresh temp paths, run under `env -i`. GNU grep 3.11 on Linux; the runner uses macOS BSD grep.
- Synthetic logs: 600 warning lines (Pods and React umbrella warnings), then an Ld block (header, `cd`, a 25 KB clang link invocation), then the tool output, 200 rsync-style noise lines, and the BUILD FAILED tail. The tool-output variants were:
  - ld-prime `ld: Undefined symbols:`
  - ld64 `Undefined symbols for architecture arm64:` / `ld: symbol(s) not found`
  - `duplicate symbol` with `clang++: error: linker command failed`
  - `ld: framework not found X` and `ld: framework 'X' not found`
  - `ld: library not found for -lX` and `ld: library 'X' not found`
  - a failure with no linker line
  - a passing build
  - a passing build with `ld: warning: ignoring duplicate libraries`
  - a compile-error build
  - an overflow build (40 `error:` blocks, more than 300 output lines)
  - a hostile log (a `::warning` line, `##[warning]`, a fence, HTML, a literal `%0A`, and a CR followed by `::notice`)
- Decoded each `::error title=xcodebuild failed...` line the way the runner does (%0A, %0D, %25) and measured where the first linker text falls against the runner's issue-message cap.
- Real CI evidence:
  - Check-runs at the head.
  - Job logs, via `gh api .../actions/jobs/<id>/logs`, for compile jobs 136046076314 (pass), 136067651987, 135978233447, 135977213717 and 135942891236 (fail).
  - Check-run annotations of 136067651987.

### Results against the five questions

1. Shell correctness (verified in the harness):
   - set -u: `linker` is assigned at line 186, unconditionally after `status=$?` (183). It is read only at lines 187, 188, 212 and 213, so every new variable is set before use. Nothing went to stderr in any of the 13 scenarios.
   - No match: on line 187, grep's exit 1 (or SIGPIPE/EPIPE when `head -300` closes) is absorbed by `|| true` on the whole pipeline. `set +e` (167) holds anyway. `status` is assigned only at 183 and never rewritten. Exit codes were identical in all 13 base/head pairs (0 for the passing logs, 65 for the others).
   - `head -80 "$linker"` (212) and `head -120 "$linker"` (213) on an empty file print nothing and exit 0. Checked with the no-match failure log.
   - Quoting: `"$RUNNER_TEMP/linker-errors.txt"`, `"$log"` and `"$linker"` are all quoted.
   - Escaping: the new `head -80` sits inside the same `{ ...; } | sed 's/%/%25/g' | awk ORS="%0A"` group as before (212), so `%` and newline escaping apply to it. A literal `100%0A` in the log came out as `100%250A` and decodes back to the literal text.
   - Summary: every line in the linker file starts with `N:`, `N-` or `--` (grep -n), so no content line can close the ``` fence opened at 213. A log line that is exactly ``` came out as "18-```" and the fence held. HTML inside the fence stays literal.
2. Injection (verified in the harness). The new lines add no capability and no new class of risk:
   - Base already prints raw log lines to stdout: line 189 (capped grep), line 238 (`tail -150`), and `tail -60` inside the annotation (212). With the base script, a log line starting with `::warning` became a workflow command. With the head script, the new stdout block prefixes it (`16-::warning...`), so it does not; it still fires only through the existing `tail -150`.
   - Two vectors exist before and after this PR, and the new lines carry more instances of them:
     - `##[cmd]` (v1 syntax) anywhere in a line.
     - A bare CR inside a line. The runner's line reader treats CR as a line end, so text after the CR can start a new `::` command, and it also splits the `::error` annotation in two.
   - Text in the annotation's data part after `::error title=...::` cannot open a new command, because newlines become %0A. The title is fixed text.
   - Why the risk is not new: the log is written by code the PR author already controls, and that code already runs in earlier steps that print straight to stdout and can write GITHUB_ENV. Those are npm ci lifecycle scripts (106), app.config.ts in prebuild (122) and podspecs in pod install (150). The job is `pull_request` with `permissions: contents: read` (42-43), `persist-credentials: false` and no secrets, and this step has no `id`, so outputs go nowhere.
3. Pattern (line 187):
   - Failing builds (verified in the harness): the block printed with 2 lines of context before and 30 after for ld-prime and ld64 Undefined symbols, `duplicate symbol` (and `ld: 1 duplicate symbols`), `ld: framework ... not found` in both formats, `ld: library ... not found` in both formats, and `clang: error:` / `clang++: error: linker command failed`. It printed first, before the 400-line list.
   - Passing build without linker output: the file is empty, nothing extra prints, and stdout and the summary are byte-identical to base.
   - A passing build that has an `ld: warning:` line does print (see N2).
   - Overflow: capped at exactly 300 lines.
4. Nothing else changes (verified in the harness and by reading the file):
   - Base and head stdout are identical apart from the new block and the annotation line, in the ld64, passing and no-match cases.
   - Unchanged: the compile-error branch (annotations and summary identical in the compile-error case), the Local modules notice (identical), and `exit $status` (240).
   - Not touched by the diff: the cache keys (139-158), the artifact upload (242-248), the `changes` job and the `launch` job.
5. Check-runs at the head:
   - Succeeded: typecheck, edge functions, B-8 seam, compliance-fence, install, applied migrations, and `native files changed?`. The last printed `native=true`: the path filter includes the workflow's own file (38), and so does the `changes` regex (272).
   - Still running: tests and content rules, database rules.
   - Queued since 04:19:42Z, and still queued at 04:26:58Z: `iOS simulator build (no signing)` (job 136080246356) and the Release launch job (136080166253). So this PR's own compile has not run, and I cannot say what it printed.

### Must fix

None.

### Notes (non-blocking; N1 recommended before merge, one line)

- N1 (line 212): the annotation copy will most likely not show the linker message.
  - The runner caps an issue message at 4096 characters. I confirmed this on check-run 136067651987: the annotation "xcodebuild failed (exit 65) without a compiler error" is exactly 4096 characters long via the API.
  - `-B 2` pulls the `cd` line and the clang link invocation into the block. In xcodebuild output, the invocation is printed right before the tool's output, and with this many pods it is many KB long.
  - In the harness (25 KB invocation), the first linker text decoded at character 25928 of a 29.8 KB message, far past the cap, for all seven link-failure variants.
  - Fix: change line 212 to `head -80 "$linker" | cut -c1-300`. Tested: the first linker text lands at character 695, inside the cap, for all variants.
  - The stdout block (188) and the summary (213) are not affected, and job logs are readable with `gh api .../actions/jobs/<id>/logs` (I fetched five). So the PR's main goal holds, but the body's "added to the annotation (first 80 lines)" overstates what the check-run will carry.
- N2 (line 187): `^ld: ` also matches `ld: warning: ...`.
  - On a passing build with any linker warning, the step prints "Linker and tool errors:" plus about 33 lines, including the long invocation (verified in the harness). That contradicts the body's "on a passing build ... nothing extra prints".
  - It is harmless to status, because the summary and annotation copies sit only in the `elif [ $status -ne 0 ]` branch (210).
  - Whether real passing builds here emit `ld: warning` is not known: the passing log's 400-line list is filled with Pods warnings first. This PR's own run will show it.
  - If it does, exclude `^ld: warning` or label the block "Linker and tool output".
- N3 (line 213): when the build fails without a match, the summary gets the "#### Linker and tool errors" heading and an empty fence, and the annotation gets `...` twice (verified in the harness). This is cosmetic; gate both on `[ -s "$linker" ]` if you touch the line again.
- N4 (212-214, existing behaviour): CR is not escaped as %0D, so a CR in the log can split the annotation, and inside the summary fence it acts as a line end. The new lines add more lines of this existing class. A follow-up could add `tr -d '\r'` (or `sed 's/\r/%0D/g'`) to the existing pipeline. It is not a security issue, for the reasons in item 2.
- N5 (line 187, cosmetic): BSD grep prints `grep: stdout: Broken pipe` on stderr when `head` closes the pipe. Line 189 already does this in job 136067651987's log. The new pipeline will do the same whenever the block exceeds 300 lines.

### Not verified

- macOS BSD grep output for `-n -B 2 -A 30` (the `N:`, `N-` and `--` format), and the regex alternation with `^`. I tested GNU grep only; the existing step already relies on BSD `grep -E -A`.
- The exact text and layout of a real Xcode 26.6 link failure in this project, and the real length of the link invocation. N1's conclusion depends on the invocation being over about 3.5 KB, which is likely but not measured.
- This PR's own iOS compile, which was still queued at 04:26:58Z. It cannot show the failure path, and the success path will settle N2.
- The runner treating a bare CR as a line end and the v1 `##[` parsing (N4, item 2). This comes from the runner source as I know it; I did not run it on a real runner.

Reviewer: independent of the author (CR-44).
