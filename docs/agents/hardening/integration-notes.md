# Integration notes: fix/injection-integrated

Base: origin/fix/injection-dispatch (f2b6a3af). Merged one at a time, agents suite run after each.

| # | Merged | Head | Result |
|---|---|---|---|
| 1 | fix/injection-brief | bdf76e47 | 1 conflict (hardening.mjs), injection.test.mjs auto-merged. Suite: 211 tests, 207 pass, 0 fail, 4 todo |
| 2 | feat/agent-pathguard | c02c1258 | clean (new files only). 283 tests, 279 pass, 0 fail, 4 todo |
| 3 | fix/opencode-runner-hardening (includes test/opencode-contract) | cec0cc00 | clean. 332 tests in the final run, 328 pass, 0 fail, 4 todo |

Before: dispatch branch alone was 204 tests, 184 pass, 0 fail, 20 todo.

## Conflicts and resolution

`scripts/agents/hardening.mjs`: both branches appended a new block at the end of the file (dispatch: H1 to H5, H11; brief: H6 to H10, H12, H13). Resolved as a pure union, no code changed; every export either side's tests import is present. The duplicate `import` line did not occur (only `isTrusted` is imported). `injection.test.mjs` merged without conflict, because the two sides edited different tests. No semantic change was needed.

## Exports of hardening.mjs by owner

- Original (before this work): `oneLine`, `verdictPhrase`, `trustedJournalEntries`, `d041Pool`, `needsIndependentReview`, `nextIds`.
- T1, dispatch (H1 to H5, H11): `idReservingPRs`, `spendFromReceipts`, `verdictOf`, `capNotice`, `cleanState`, `lastStateMarker`, `boardText`, `NO_TRUST_MSG`.
- T2, brief (H6 to H10, H12, H13): `UNTRUSTED_TEXT_RULES`, `UNTRUSTED_REVIEW_WARNING`, `quotedLine`, `safeBranch`, `checkoutLine`, `branchLabel`, `fileList`, `quoteBlock`, `handoffRefusal`.

## Known conflict with open PR #354 (not merged here)

`dispatch.mjs`: the `status` expression and the `spendToday` body conflict (details in `injection-dispatch-conflicts.md`). Two recommendations for #354's author:
1. Receipts are posted by `github-actions[bot]`, which `isTrusted` rejects. #354's `isTrusted(c, trust) && startsWithMarker(...)` check would drop every real receipt and show spend as unknown. Use `ledgerRow` (trusted author, or github-actions[bot] for receipts only), via `spendFromReceipts` from this branch.
2. #354 stores `state.traces` (an array) in the board state. `cleanState` keeps only listed keys, so add `traces: "array"` to `STATE_KEYS` and accept an array for it when #354 lands.

## Holes remaining under `INJECTION_STRICT=1` (injection.test.mjs, at the end of round 8: 105 tests, 103 pass, 2 fail; the earlier 89/86/3 is out of date)

- H15: commands that send the environment out are not denied (a deny list cannot close it; needs a scoped token and no secrets in the model process).
- H16: edits under `.github/workflows` are allowed.
- H2 (spam hiding the founder's note) and H14 pass now (rounds 3 and 4). Only H15 and H16 fail under the strict flag.

## Leftover noted for W1's change

Branches whose names start with `develop` or `main` right after `origin` (for example `main-page`) are still blocked, because `lib.test.mjs` asserts the legacy globs. `lib.test.mjs` was not changed here.

## Other

The one non-ASCII character in `injection.test.mjs` (line 123) is a deliberate zero width space used as test data for `startsWithMarker`, so it was left in place. The changed docs are ASCII only.

## Round 4: red-team blockers fixed in scripts/agents (head after this section's commit)

| Finding | Change | Tests |
|---|---|---|
| A. Identity not label-only | New `identity.mjs` (label, branch prefix `agent/<handle>/`, bot author). `pathguard.mjs --labels` takes optional `--branch`, `--author`, `--author-type`, `--app-logins`; branch or bot author without a label, or a label and branch handle that disagree, exit 1. `guard-open-prs.mjs` counts label OR branch OR bot author. `dispatch.mjs` team cap uses `agentLikePR`. `lib.agentOfPR` stays label-only on purpose: a stranger's branch named `agent/qa/x` must never be routed, reviewed or briefed as an agent PR. | identity.test.mjs |
| B. Journal spam (rest of H2) | `brief.mjs` reads the journal comments newest page first (`newestPages`), stops at 3 trusted entries or 10 pages. | injection.test.mjs (1,200 spam comments), identity.test.mjs |
| C. Hard rules | `.npmrc`, `.gitattributes` (any directory), `.husky/**`, `opencode.json`, `AGENTS.md`, `.git/**` added to `HARD_RULES`; `.claude/**` was already there. Case, trailing dots and spaces, and backslashes were already normalised; now tested for the new rules. | identity.test.mjs, pathguard.test.mjs |
| D. Deny patterns | Bare `git push` forms, `--all/--mirror/--tags/--follow-tags`, tag refs, `heads/develop|main`, `--no-pager/-P/--git-dir/--work-tree` prefixes, `--receive-pack`, `--exec=`, and gh api write verbs in `=`, two-space, `-XV`, lower-case spellings. | opencode-deny.test.mjs |

Limits and caveats:
- Caller must pass `--branch` and `--author` to pathguard. If the workflow omits them, the check is only as strong as before (UNVERIFIED wiring, no workflow runs it yet).
- A bot-authored PR with no `agent:*` label (for example Dependabot) now exits 1 in pathguard. That is the requested fail-closed behaviour; the workflow PR must decide whether to skip known bots before calling it.
- The new deny patterns are glob tests with the offline matcher. Engine behaviour is UNVERIFIED: how opencode matches `git --no-pager push`, double spaces and quoted forms was not run on the real binary. They remain a tripwire, not a boundary.
- The `injection.test.mjs` zero width space (line 123) is deliberate test data and stays.

## Needs the workflow PR after 9 Nov

Not attempted here (`.github/**` is frozen and these need the two-job split). Red-team reasoning:
- `pathguard.mjs` and `guard-open-prs.mjs` are not run by any workflow, so today they protect nothing. They must run as a required step before push, from a clean checkout of `develop`, not from the PR's tree.
- `salvage.mjs` and `receipt.mjs` run from the model-editable working tree with write tokens. The model can edit them and then have its own code run with the token. They must run from a trusted checkout in a second job.
- `OPENROUTER_API_KEY` and `GH_TOKEN` are readable by the model's shell (see the comment on the env allowlist in `run-opencode.mjs`). Fix: a job split where the model job holds no write token, and a proxy for the model key with its own budget.
- `gh issue comment`, `gh pr comment`, `gh release`, `gh gist` are unrestricted by the deny list. A comment is an exfiltration channel and a release can publish. Needs token scope or lane control, not globs.

## Round 5: Review C and QA Review A fixes

| Item | Change | Test failed on old code? |
|---|---|---|
| 1. Journal (B) | `readJournal` in `hardening.mjs` reads the first 5 and the last 5 pages (the old 10-page cap), dedupes by comment id, and fails closed: an unreadable count or page gives `unreadable` and no comments, never an oldest-first guess. The brief prints "Journal unreadable" or "N of M journal comments were not read ... lock the journal issue". A note in the middle of a thread over 1,000 comments is NOT read; the brief says how many comments were skipped. The dispatcher already treats a failed journal read as no notes (`founderNotesSince` returns 0 on a null response); it was not changed. | yes (journal.test.mjs, 3 e2e tests in injection.test.mjs) |
| 2. Identity flags (A) | `--branch` and `--author` required; `--offline` for `--agent` runs. See pathguard.md. | yes (pathguard-cli.test.mjs) |
| 3. Hard rules (C) | any-depth forms and the added files; see pathguard.md. | yes (identity.test.mjs, wide-open lane) |
| 4. Dispatcher cap wiring | e2e test through `dispatch.mjs`: ten unlabelled `agent/` branch PRs, and ten bot PRs, fill the team cap. | yes: with `dispatch.mjs` reverted to `agentOfPR` the test fails; restored |
| 5. Deny rules (D) | Replaced the many push globs by: deny `git*push*` and `git*-c *`, allow only `git push origin agent/*` and `git push -u origin agent/*`, then re-deny a short list after the allow (`--force`, `-f`, `--delete`, `+`, any `:` refspec, ` develop`, ` main`, `--all`, `--mirror`, `--tags`, `--receive-pack`), because with last-match-wins an allow placed last would otherwise let a force push to an agent branch through. `gh*api*` denies any `-X` or `--method` followed by a quote. | yes (opencode-deny.test.mjs) |
| a. H14 | todo marker removed from the H14 test; it passes in strict mode. | n/a |
| b. Verdicts | `verdictPhrase` is now `verdictOf` (most restrictive wins), so `pause.mjs` and `reviewfp.mjs` cannot be fooled by an echoed "Verdict: ship". | yes (via `pause.olderRedTeam`) |
| c. pathguard history | per-commit checking and caps; see pathguard.md. | yes |
| d. NFKC and readJournal | look-alike branch test (fails with the normalisation removed, checked); direct `readJournal` tests. | yes |
| e. globToRegExp | one implementation in `glob.mjs`; `lib.mjs` re-exports it and `pathguard.mjs` wraps it with `ignoreCase`. | n/a |

Legacy assertions changed (the new ordering contradicts them):
- `opencode-contract.test.mjs`: the matcher now takes the last matching rule. The three "matcher agrees with the recording" tests now assert only that anything the real binary blocked is still denied (the new rules block more). The must-allow test now expects that only `git push [-u] origin agent/*` stays allowed; pushes of `feat/maintenance` and the like, and a commit message that contains "push", are denied on purpose.
- `run-opencode.test.mjs`: ordered matcher; the must-allow branch is `agent/qa/...` instead of `fix/...`.
- `injection.test.mjs`: ordered matcher; the allowed-push example is `agent/qa/x`.
- `lib.test.mjs` legacy keys (`git push --force*`, `git push origin main*`, ...) are kept as deny rules ahead of the allow.

Known holes left on purpose, stated plainly:
- Shell indirection after the allowed prefix (`git push origin agent/qa/x $REFSPEC`), `sh -c`, `env git`, a script the model wrote, and mixed-case verbs (`gh api -XPatch`) are not caught.
- The broad rule has false positives: any `git` command containing `push` or ` -c `.
- Behaviour on the real engine is UNVERIFIED: last-match-wins, `*` crossing spaces, the optional trailing ` *`, and how compound commands are split were taken from Review C's model, not run here.
- The deny list is a TRIPWIRE, not a boundary. The real controls are (a) branch protection on main and develop, (b) a write job that does the push so the model never holds push credentials, and (c) locking the journal, board and handoff issues so only collaborators can comment. None of the three is in place from this branch. This branch is not shown to be safe to enable.

## Round 6: the model does not push

Supersedes the round 5 push rules above (the allow for `git push origin agent/*` and its re-deny list are gone).

- `run-opencode.mjs`: every command that has `git` and `push` in it is denied (`*git*push*`, `git*push*`), in any spacing, with any global option, env prefix, `sh -c`, chain, substitution or pipe. There is no allow rule for push; the only allow is the catch-all. `git -c k=v` is denied (`git -c*`, `git*-c *=*`); `git switch -c` and `git checkout -b` stay allowed. Commits and branch creation work. Cost: any command with both words, such as `git commit -m "push notes"`, is denied too.
- The brief says: do not run `git push`, commit on `agent/<handle>/<topic>`, the workflow pushes. The task branch name is now `agent/<handle>/<task>-<slug>` (it was `<type>/<area>-<task>-<slug>`). `checkoutLine` and `OPERATING_MODEL.md` section "Save as you go" say the same.
- The deny list is a TRIPWIRE, not a boundary. Behaviour on the real engine is UNVERIFIED (last-match-wins, `*` crossing spaces, the optional trailing ` *`, how compound commands are split): all of it comes from Review C's model, implemented once in `opencode-matcher.mjs` and used by every test file. Known holes: mixed-case gh verbs (`-XPatch`), anything the globs cannot see (a script the model wrote). Pushes recorded on the real binary under older rule sets cannot be compared any more; they are a documented exception (`isPush` in the contract test), checked only as "denied now". Every other recorded command is compared for equality again.
- The real controls are (a) branch protection on main and develop, (b) the workflow's own push (below), (c) locking the journal, board and handoff issues so only collaborators can comment. None of them is verified or in place from this branch. The branch is not shown to be safe to enable.

### Does salvage push new agent branches today? (read only: `scripts/agents/salvage.mjs`, `.github/workflows/agents.yml`)

Yes, partly. The step "Save unfinished work" runs after the model step with `if: always()`, with the same App token the model had (`steps.app.outputs.token`). `salvage.mjs` pushes the CURRENT branch (`git push -u origin <branch>`) when the tree is dirty (it commits a WIP commit first) or has commits not on its upstream or not on `origin/develop`; a run on `develop`, `main` or a detached HEAD goes to `agent/<handle>/wip-<run id>`. It posts a journal comment with the branch link. Gaps that PR #429 (ci/agent-lane-gates) must close; nothing here is invented:
1. It pushes whatever branch name the model chose, not only `agent/<handle>/<topic>`. It must refuse or rename any other name, and run `pathguard.mjs` (with `--branch`, `--author`) before the push.
2. It does not open or label the pull request. The model used to run `gh pr create` after its own push; with push denied, the branch is not on GitHub until the salvage step, so a PR step (draft, labels `agent:<handle>` and `from:agent`) must follow it.
3. It only runs as a salvage step: success paths with nothing unpushed do nothing (correct), but the step name, journal text and the push credential are the salvage ones. A dedicated write job, with the model job holding no push credential, is the design (b) above.
4. `salvage.mjs` and `receipt.mjs` run from the model-editable checkout with the write token (see "Needs the workflow PR after 9 Nov").

### Known limits, not solved here

- Old-note resurfacing (named by Review C; not analysed or fixed here): the brief shows founder notes newer than the agent's last trusted journal entry, so a note can be shown again in a later run whenever no newer entry exists.
- Stub-timestamp race (named by Review C; not analysed or fixed here): the journal stub posted at the start of a run and the final entry have different timestamps, so a founder note written in between can be treated as already seen or shown twice.
- A founder note in the middle of a journal thread over 1,000 comments is still not read; the brief says how many comments were skipped. Locking the journal issue is the fix.
- `readJournal` skips a page that fails while others load; those comments are reported as not read (with the number of failed pages) and are not retried.
- `HARNESS.md`, `cto/RULINGS.md` and the older notes still mention `git push` as an agent step; they were not rewritten.

### Round 6 test changes

New tests failed on the old code first: the 112-shape push table and the config-injection and branch-creation rows (opencode-deny.test.mjs), the brief no-push and branch-name tests, the journal lookup tests (failed lookup, none, found), the `agent/` prefix tests (identity and pathguard CLI), the count-validation and failed-page tests. Added after Review A, each killed its mutation when tried: the 5 MB default, a rename's old path in the file cap, `readJournal` dedupe by id.

## Round 7: red-team findings on round 6 (31 Oct 2026)

### What is NOT closed, stated plainly

Do not read the rest of this section as "the harness is safe to turn on". It is not.

- The push ban is NOT closed by the deny list. The deny list is a tripwire. `g"i"t push`, `git 'push'`, `g\it push`, a variable (`$G push`), a script the model writes and runs (`node -e`, `python -c`, `sh x.sh`), `git` through an alias, a wrapper this list does not name, and `gh pr create` if it pushes the branch itself (UNVERIFIED: not tested whether it does) all get past the globs. Review B already ran the real engine against round 6 and found shapes that ran.
- The egress and secret rules are NOT closed by the deny list. `curl`, `wget`, `printenv`, `env`, `cat /proc/self/environ`, `python`, `node -e` and any other program can read `GH_TOKEN` and `OPENROUTER_API_KEY` from the model's environment and send them anywhere. Round 7 added `gh*gist*` and `gh*release*` to the denies, but those are globs: quote-splitting defeats them. They are not a control.
- The only real controls are (1) withholding `GH_TOKEN` and `OPENROUTER_API_KEY` from the model step, which needs the workflow job split (H15: a model job with no write token and a proxy for the model key with its own budget), and (2) branch protection on `develop` and `main`. Neither exists on this branch. Branch protection alone does not stop a push to a new branch or to a tag, or an exfiltrated token being used.
- `AGENTS_ENABLED` must stay unset until the job split exists. Nothing on this branch makes enabling the agents safe.
- `salvage.mjs` (the `if: always()` step, run with the App token from the model's working tree) pushes any branch name the model chose. PR #429 must enforce `agent/<handle>/` in the workflow before the push, and it must run `pathguard.mjs`. Separately, `salvage.mjs` runs `git` in a workspace the model controlled: a planted `.git/config` (for example `core.sshCommand`, `core.fsmonitor`, a credential helper), `.git/hooks/*` or a `.gitattributes` filter would run during salvage with the token in the environment. Whether salvage guards against that is UNTESTED here, and pathguard cannot see `.git/` (it is not in any diff). Salvage must run from a clean trusted checkout with `GIT_CONFIG_NOSYSTEM`, `core.hooksPath=/dev/null` and no inherited repository config, or in a second job.
- The whitespace finding came from the real engine: `gh pr  merge`, `gh pr  review --approve`, `gh issue  close`, `gh  secret` and `gh workflow  run` (two spaces or a tab) RAN. The fix in this round is verified only against the offline matcher (`opencode-matcher.mjs`). It has not been re-run on the engine. The earlier claim that the gh denies were closed was wrong for any spacing other than one space.

### What changed

1. Whitespace. Every gh deny is whitespace tolerant (`gh*pr*merge*`, `gh*pr*review*`, `gh*issue*close*`, `gh*secret*`, `gh*workflow*run*`, and the same for close, edit, ready, release, gist, variable, repo delete/edit/archive, ruleset, workflow enable/disable, run rerun/cancel). `gh api` write verbs are `gh*api*-X*POST*` and `--method*POST*` in upper, lower and Capitalised case; the field flags are denied after a tab as well as a space. Over-blocking is accepted: any command line with those words in that order is denied, even inside a quoted `--body`. Use `--body-file`. Still open: odd case such as `-XpAtCh`.
2. The brief no longer tells the agent to run `gh api -X POST/PATCH`. Finish step 3 is `gh issue comment <journal> --body-file <file>` and `gh issue comment <journal> --edit-last --body-file <file>`. Four narrow allows come after the denies (`gh issue comment * --body-file *`, the `--edit-last` form, `gh pr comment * --body-file *`, `gh pr review * --comment --body-file *`) so a file called `closed.md` or `merge-notes.md` does not trip `gh*issue*close*`. Re-denies come last for `$ ` backtick `; & | > < ( {`, a newline, `-R`, `--repo`, sensitive paths (`/proc/`, `environ`, `hosts.yml`, `.ssh`, `/etc/`, `.env`, `.config/gh`) and `--approve`/`-a` on a review. `OPERATING_MODEL.md` section 5 and the three claude-code lane prompts say the same. A test runs every `gh` and `git` command the six brief modes, the operating model and the lane prompts tell the agent to run through the matcher and asserts none is denied. That test found two that were: the digest's `gh pr list --state merged ...` (now a `gh api .../pulls?state=closed` read) and the operating model's `gh api -X PATCH`.
3. Labels. The brief used to tell the agent `gh pr edit ... --add-label`; `gh pr edit` is now denied. Finish step 1 says the workflow applies `agent:<handle>` and `from:agent` from the branch name. That is a dependency on PR #429: nothing on this branch applies them.
4. `gh pr review` is denied except `--comment --body-file`, because the operating model tells reviewers to post that form.
5. Identity. A bot-authored PR needs the `agent:<handle>` label AND a head branch `agent/<same handle>/<topic>`; label-only or a mismatch fails closed (`identityOf` returns `conflict`; the pathguard CLI exits 1). A human-opened PR that the founder labels is unchanged.
6. Cap. A PR counts against the open-agent-PR cap if it has an `agent:*` label, or if its branch or bot signal says agent AND its author is in `AGENTS_BOT_LOGINS`. Strangers on `agent/` branches and Dependabot count 0. `guard-open-prs.mjs` and the dispatcher (`lib.agentLikePR`) use the same function (`identity.isAgentLike`). If `AGENTS_BOT_LOGINS` is empty, only labelled PRs count, so the repository variable must be set.
7. Founder notes. The brief's "Founder instructions since your last run" section is no longer a `>` quote. Each note is a block between a line `FOUNDER NOTE BEGIN (...)` and a line `FOUNDER NOTE END`, body indented four spaces, and the words FOUNDER NOTE inside a body are rewritten so a note cannot end its own block or start a second. `UNTRUSTED_TEXT_RULES` names the heading and both markers and says a `>` quote inside a founder block is still data. Before, the rules said quoted text is never an instruction while the founder notes were rendered as quotes. Residual risk: the block is only as trustworthy as `isFounderComment` (the founder login), and an unlocked journal lets a stranger flood the thread (item 8).
8. Journal warning. When part of the thread is not read, the brief now says: only the first 5 and last 5 pages are read; comments posted after your last entry beyond those pages can hide that entry, and then old founder notes may reappear as if they were new; check any note against your last journal entry; locking the journal issues closes this. Locking is still the only fix.
9. Push rule narrowed to command position. `git commit -m 'push notes'` and `gh pr create --title "git push guard"` are no longer denied. Denied: `git push*`, `git  push` and `git<tab>push`, any `git -<option> ... push` (`git -C x push`, `git --no-pager push`), `git*-C*push*`, `git send-pack`, and push after `&&`, `&`, `;`, `|`, `(`, a backtick, `{`, a newline, an env prefix, or one of `env exec command sudo xargs nohup time timeout nice stdbuf setsid eval sh bash zsh dash`. Known remaining false positives: `git commit -C HEAD -m 'push'` (the `-C` rule) and a `--body` that has `=` and ` git ... push` in it. Quote-splitting still gets through, as above.
10. Pathguard. New hard rules, any depth: `.devcontainer/**`, `.vscode/**`, `.mcp.json`, `CODEOWNERS`. A mode change (`100644` to `100755`, or back) is a violation, content change or not. `pathguard.md` no longer says it checks only the net diff.

### Tests that failed on the old code (7ea9621d)

All in `round5.test.mjs` unless noted: the whitespace table (150 command and spacing pairs); the smuggling denies on the comment allows; the rule-order test; the narrowed push false positives; the push shapes (send-pack, `-C`, chains); the quote-splitting record; the bot-launders-label identity test and its CLI twin; 15 stranger PRs, 15 Dependabot PRs and the trusted-login count; the founder-marker rules text; the journal gap notice; the four new hard rules; the mode-change unit and CLI tests. In `injection.test.mjs`: every command the brief tells the agent to run is allowed; every command in the operating model and lane prompts is allowed; the finish steps use `gh issue comment` and not `gh api`/`gh pr edit`; the founder block; the long-journal warning. One new test passed on the old code on purpose (comment file names with close/merge/review/release/secret): it is a control for the allow rules.

### Existing tests changed in this round, and why

- `identity.test.mjs`, `injection.test.mjs` (dispatcher cap): the old tests asserted that a stranger's `agent/` branch PR counts against the cap. That was the DoS; they now assert it does not, and that a trusted login does.
- `injection.test.mjs` founder tests: founder text is now indented inside the FOUNDER NOTE block instead of `> `-quoted.
- `opencode-deny.test.mjs`: "no allow rule for push" now lists the four comment allows; the broad-rule false-positive test now asserts the narrowed behaviour; `-XPatch` is caught, `-XpAtCh` is the stated bypass.
- `opencode-contract.test.mjs`: `isPush` no longer counts a plain `git commit`/`log`/`checkout` that only mentions push, so those recordings are compared for equality again. The row `gh pr create --title ... --body 'no secret here'` ran under the old anchored pattern and is denied now on purpose (over-blocking, `OVERBLOCKED`).
- `run-opencode.test.mjs`: a `--body` that mentions secret is denied now.
- `hardening.test.mjs`, `pathguard.test.mjs`: the rules text says "founder blocks"; rows for the four new hard rules.

### Still open

- Everything under "What is NOT closed".
- `HARNESS.md`, `cto/RULINGS.md` and older notes still describe the old gh forms and `git push`; not rewritten.
- The new patterns are not re-run on the real engine. A live matrix for round 7 (whitespace, the four comment allows, the re-denies, the narrowed push shapes) is the next check.

## Round 8: final bounded round (31 Oct 2026)

Decision: we stop chasing deny-list bypass patterns. The deny list is a tripwire. It catches the bare, accidental or lazy form of a command. It does not stop anyone who is trying.

### What the deny list does not stop (engine-confirmed)

These ran on the real engine (opencode 1.18.34), or follow directly from how it matches. None is closed, and none will be closed by adding patterns.

- Merge, approve, close, secret and every other gh deny, by any wrapper: `env gh ...`, `FOO=1 gh ...`, `command gh`, `exec gh`, `nohup gh`, `timeout 5 gh`, `eval`, `xargs gh`, `sh -c 'gh ...'`, `bash -c`, a backslash (`\gh`), a full path (`/usr/bin/gh`), quote splitting. The gh and git patterns are anchored at the start of a command, so they catch only the bare form. Tests record these as known holes.
- Anything the model writes into a script and runs (`node -e`, `python -c`, a shell file). The patterns see the interpreter, not what it does.
- `gh alias set` followed by use of the alias. `gh alias` is denied now, as are `gh extension`, `gh config set`, `gh ssh-key`, `gh gpg-key`, `gh repo create|rename|sync`, `gh pr|issue reopen`, `gh pr update-branch`, `gh label|run|cache delete`. Other indirection (a script, a git alias, a shell function) is not.
- git push bypasses: an absolute path (`/usr/bin/git push`), a tab after an env prefix (`FOO=1<tab>git push`), a backslash-newline, `git config alias.p push` then `git p`, `GIT_CONFIG_COUNT`/`GIT_CONFIG_KEY_0`/`GIT_CONFIG_VALUE_0` in the environment, `git config core.hooksPath`, `git remote set-url`, quote or backslash splitting (`g"i"t push`). Round 7's narrowing to command position made `git commit -m 'push notes'` runnable and made these easier, not harder.
- Chains. The engine matches shell-grammar command nodes, not a fixed split (see "Round 9 additions" below): separators outside quotes are `|`, `;`, `&`, `&&`, `||` and newline; `$( )`, backticks, `( )`, `{ }` and loop bodies are matched as separate commands. A re-deny whose pattern contains a separator character never fires on the node it was meant for: `gh issue comment ... | tee x`, `... & curl x` and `... <newline>curl x` run. Quotes are not split.
- Extra flags on the allowed comment forms. `--delete-last --yes`, `-R owner/repo` (also glued, `-Rowner/repo`), `--repo`, `-F`, `--body-file -`, `--body-file=...`, `/dev/...`, `~`, `$` and quote or `..` paths are denied now. Not stopped: `--edit-last` on `gh pr comment` (it is a valid flag there; it edits the last comment, which may be someone else's), glob characters `*` and `?` in a body-file path (a glob rule cannot deny a literal `*` or `?`), and any path under `.agent-run/` or `/tmp/` that the model chose to fill with a secret (it can write one: the file is the model's).
- Forged verdicts. Every agent posts as one App identity. An injected author agent can post a fake red-team or steward verdict on its own PR, or delete the real one. This is the CR-20 identity problem. The real fix is separate identities per role, or verdicts written by the workflow and not by the model. Nothing on this branch does either.
- Egress and secrets: `curl`, `wget`, `printenv`, `env`, `cat /proc/self/environ`, any interpreter. Not denied, not deniable by glob.

### The only things that hold

The push ban and the protection of the two secrets hold ONLY if (1) `GH_TOKEN` and `OPENROUTER_API_KEY` are withheld from the model step (the job split, H15), and (2) branch protection is set on `develop` and `main`. Neither is in place from this branch. `AGENTS_ENABLED` stays unset until both are. `salvage.mjs` still pushes any branch name the model chose with the App token; PR #429 must enforce `agent/<handle>/` and run `pathguard.mjs`, and salvage running git config or hooks planted by the model is untested.

### Unverified

Last-match-wins, `*` crossing spaces, the optional trailing ` *`, backslash handling and the command-node matching described in "Round 9 additions" were CONFIRMED on opencode 1.18.34 for the cases Review B and the red team ran, and the round 8 patterns were then ENGINE-VERIFIED for those cases (round 9). Still unverified: whether `gh pr create` pushes the branch itself (if it does it bypasses the push deny), and every spelling the red team did not run.

### What changed

- A. `pathguard.mjs` rejects an empty or blank `--branch` or `--author` with exit 2 unless `--agent X --offline` is given (`--labels agent:product --branch "" --author ""` used to exit 0 as "no signal").
- B. Our instructions are runnable. (1) The digest agent no longer closes the previous digest issue (`gh issue close` is denied): it comments on it with a link to the new digest and leaves it open; the founder closes it. (2) The charters for ai-eng-lead, data-steward and security-architect say `gh pr review <n> --comment --body-file .agent-run/review.md`; chief-of-staff reads merged PRs with `gh api "repos/<repo>/pulls?state=closed..."`. (3) The every-command test scans `.claude/agents/*.md` too, and fails on a placeholder body-file path. (4) Briefs, the operating model and the lane prompts give a literal body path: `.agent-run/journal.md`, `.agent-run/reply.md`, `.agent-run/review.md`. (5) Reads that merely contain merge, review or release are allowed by narrow allows (`gh pr view*--json*`, `gh pr list*--json*|--search*|--label*`, the same for issues), placed AFTER the denies (last match wins, so an allow before them would do nothing) with the smuggle re-denies after. Cost: a `--search` or `--jq` with `>`, `(`, `{`, `$`, a backtick, `&` or `<` is still over-blocked, and a quoted `|` is DENIED by the engine (round 9 corrects the earlier claim).
- C. New gh denies as listed above. The comment allows now rescue only `--body-file .agent-run/...` and `--body-file /tmp/...`; a relative path such as `closed.md` stays over-blocked on purpose. The dedicated `--edit-last` allow was removed as redundant: the one allow's `*` already covers it (a test says so).
- D. Mutation-killing tests: each smuggle character and each sensitive fragment, `a & git push`, `{ git push; }`, founder-block defang variants, control-character stripping and all line-break kinds, `AGENTS_BOT_LOGINS` case, the exact 5 MB boundary, the negative journal count and its `why`, and `--labels ... --offline` with no identity. Correction (round 9): under the engine's command nodes the `|`, newline, `&` and `(x)` re-denies and the `*&*git*push*` and `*{*git*push*` rules are equivalent mutants; see below.
- E. Two weakened assertions fixed: the four-space indent is accepted only inside the founder section; the contract test excludes exactly `GIT_DENY` (now exported) and no longer hides a non-git pattern that contains "push".
- F. This section, the corrected headers (`-XPatch` is denied; only odd case such as `-XpAtCh` passes; the matcher header), and the strict-run counts in "Holes remaining" below.

### Round 9 additions: engine-verified status, new "does not stop" items, over-blocks

Status. The round 8 patterns were run on opencode 1.18.34 by the red team: every new deny and re-deny matched, and the 60 commands the briefs, charters and prompts tell the agent to run were all allowed. That is ENGINE-VERIFIED for the cases they ran, not for every spelling.

Also does not stop (engine-confirmed, in addition to the list above):
- (a) An alias written directly into gh's `config.yml`. `gh pm 7` ran, and real gh expands a hand-written alias to `pr merge`. Denying `gh alias` therefore protects nothing; it only catches the `gh alias set` command.
- (b) A comment target by URL (`gh issue comment https://github.com/other/repo/issues/1 --body-file ...`) and the prefixes `GH_REPO=`, `GH_HOST=` and `--hostname` defeat the `-R`/`--repo` re-deny. The App token's reach limits the impact; the deny list does not.
- (c) `gh pr review --comment --body-file ... --edit-last` is allowed.
- (d) `gh pr create --head other:branch --base main` is not denied. It opens a PR from any already-pushed branch. It is believed not to push; UNVERIFIED against real GitHub.
- (e) A single `&` or a `(x)` after an allowed comment form runs: the engine treats both as separators, so the re-denies for `&` and `(` never fire. The same holds for `;`, `|`, a newline and `&&`.
- (f) The `echo hi & gh pr merge` family is denied by the engine (it matches the second command on its own). That is stricter than the earlier model, and it is good, but it is not something a pattern of ours provides.
- Second body flag. Real gh uses the LAST `--body-file`, so `gh issue comment 12 --body-file .agent-run/j.md --body-file /root/.npmrc` and `... --body-file /pr?c/self/envir?n` ran. Any two of `--body`/`--body-file`, `-b`, `-F` on `gh issue|pr comment` and `gh pr review` are denied now. The allows for `.agent-run/` and `/tmp/` paths hold for a SINGLE body flag only, and only as a tripwire: a glob rule cannot deny a literal `?` or `*`, so `--body-file /pr?c/self/envir?n` alone (one flag, not under the allowed prefixes) is denied by the new base deny on body files, not by recognising the path.

Matcher (opencode-matcher.mjs) now follows the engine's shell-grammar nodes: separators `|`, `;`, `&`, `&&`, `||` and newline outside quotes; `$( )`, backticks, `<( )`, `( )`, `{ ...; }`, a leading `!` and if/for/while bodies are matched as separate commands (each denied on its own) while staying in the text of the node that holds them; quotes are NOT split; backslash-newline is a continuation. This replaces the earlier "splits at newline, |, ; and &&" description, which was wrong (it missed `&` and the grouping constructs and wrongly split inside quotes). Consequences, engine-confirmed: `echo "a;gh pr merge 7"` and `echo 'x | gh pr merge 7'` run; `gh pr list --json n --jq '.[] | .n'` is DENIED, because the quoted line matches the re-deny `gh pr list*|*`; `... --json x | sh` is a real chain and runs.

Matcher and engine disagreements that remain (approximate, not modelled): heredocs, `case`, arithmetic, `eval`, a `(` inside a path word (the model treats it as a group; the engine's treatment of that invalid shell is unconfirmed, so the `(` re-deny is not tested), `?` as a single-character wildcard (modelled, not separately confirmed), and every construct not in the list above. The 12 disagreements found in round 8 review are recorded as cases in `round9.test.mjs`; the old 25-command agreement set and the 58-command recordings still pass.

Corrections to the Round 8 text above:
- Item D (smuggle characters): under the engine's nodes, `|` and newline re-denies, `&` and `(` after an allowed form, and the `*&*git*push*` and `*{*git*push*` rules are equivalent mutants: removing them changes nothing, because the node `git push` is denied on its own. They are kept as decoration. The tests for them assert the command is denied (or runs), not that the rule is needed.
- Item B5: a `|` inside a `--jq` is NOT over-blocked by the matcher the way the earlier text said; the engine DENIES it, because the quoted line matches `gh pr list*|*`. Use `--json` with no pipe, and pipe nothing after it.
- The comment allows rescue a plain `.agent-run/` or `/tmp/` path for a single body flag only. Every body file outside those prefixes (including `/tmpevil/x.md`, `.agent-runx/y.md`, `/etc/x.md`, `x.md`) is denied by a base deny, which the allows then override for the two prefixes.

Over-blocks found (accepted, or use the stated alternative):
- `gh pr list --state merged`, `gh api ...issues?state=closed` and `gh issue list --state closed` are denied (the words merge and close). The briefs read merged PRs through `gh api "repos/<repo>/pulls?state=closed..."`, which does not match (it has no `pr` followed by `close`); an issues URL with `state=closed` does.
- `./.agent-run/j.md` is allowed for `gh issue|pr comment` but denied for `gh pr review`. Use `.agent-run/j.md`.
- A body-file path with `-b` twice, a `--search` with `>`, `<`, `(`, `{`, `$`, a backtick, `&` or a quoted `|`, and any command line with the words of a deny in that order, even in a quoted body.
