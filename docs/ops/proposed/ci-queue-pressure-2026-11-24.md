# Proposal: CI queue pressure on 24 Nov 2026, options and what each costs

Status: proposal by `ops`. This pull request changes nothing under `.github/` (the Claude GitHub App cannot edit workflows; OPERATING_MODEL line 95). The founder applies any patch. Marks: [U] means unverified, with the reason. I measured nothing for this note: the queue numbers below were handed to me, and I did not re-pull them. I claim no saving for any option.

## 1. Evidence

Handed to me by the caller, not re-measured [U]:

- On 24 Nov, about 94 workflow runs queued and 15 in progress.
- `Web journeys` had about 10 runs in progress, against about 2 for `CI`.

Read by me from `origin/develop` at `44c497eeaf51` (the three workflow files, whole):

| Workflow | Triggers | Concurrency group | cancel-in-progress | Runner, timeout |
|---|---|---|---|---|
| `ci.yml` | `pull_request` (no `types:`, so opened, synchronize, reopened), `push` to develop and main | `ci-<pr or ref>` | true on pull_request only | install, content, unit, functions, typecheck on `ubuntu-latest`; db and seam-guard on `ubuntu-24.04`; 4 to 15 min per job |
| `compliance-fence.yml` | `pull_request_target`: opened, synchronize, reopened, edited, labeled, unlabeled, ready_for_review | `compliance-fence-<pr>` | true | `ubuntu-24.04`, 3 min |
| `web-journeys.yml` | `pull_request` with a `paths:` filter, daily `schedule` (10:41 UTC), `workflow_dispatch` | `web-journeys-<pr or ref>` | true on pull_request only | `ubuntu-24.04`, 35 min |

Two corrections to the brief for this task, both from reading the files:

1. `web-journeys.yml` already has `cancel-in-progress` on pull requests and already has a `paths:` filter (`apps/mobile/**`, `packages/**`, `package.json`, `package-lock.json`, the setup action, the workflow file). Option (a) as first described is already in place. What is left is narrowing the filter (option a below).
2. `required` (`ci.yml` lines 192 to 210) is `if: always()` and `needs` seven jobs: install, content, unit, db, functions, typecheck, seam-guard. Six of them besides `install`. It is a gate, not a runner hog (1 minute timeout), but it stays pending until the slowest of them ends, and a queued job holds it.

Earlier measurements that bear on this, from `docs/ops/proposed/ci-speed.md` (a different window, 24 hours before that document; not today's numbers):

- Compliance fence: 808 of 2253 runs were an extra run on a head that already had one, and 585 of those started within 10 s of the previous run, which fits a PR opened and then given its labels. The cancelled ones ran a median 8 s; the wait for a runner, not the 10 s of work, was the cost (p90 27.7 min in that sample).
- Skipped checks satisfy a required status, so a job-level `if:` on the fence is unsafe (that note's change 5).
- The CI cancellations in that window were new pushes, not label events.

What I did not find, and no one should assume: how many of today's queued runs are fence, web journeys or iOS compile. The 94 is unsplit [U]. `docs/ops/ci-queue-q1-measurement.md` (21 Nov) read 36 `ios-compile.yml` runs queued and 3 in progress, so the macOS lane is a third candidate that this note does not cover.

## 2. Options

Each option: what, cost, way back.

### Option (a): narrow Web journeys further

- What: the cancel and the path filter are already there. Two further steps are possible, and either would be a patch to `web-journeys.yml` for the founder to paste. First, exclude paths that cannot change the web export, for example `!apps/mobile/**/*.md` and `!packages/**/*.md`. Second, run the 90 flows on pull requests only for a narrower set (the app and the packages the export imports) and leave the rest to the nightly run, which already exists.
- Cost: a flow regression from a change outside the narrowed list is found at the nightly run (10:41 UTC) instead of on the PR. The check is not in `required` (workflow header), so no merge is blocked either way. Whether any `.md` under those trees is read by the export or the flows I have not checked [U]; the existing paths comment says "when unsure included" for that reason, so the exclusion must be checked file type by file type before it is pasted.
- Saving: not measured. I do not know what share of PRs touch only the excluded paths [U]. It can be computed from merged PR file lists, as `ci-speed.md` did; I have not done it.
- Way back: `git revert` the pasted patch.

### Option (b): fewer fence triggers

- The premise (the fence reads live state) is true: it reads labels, files and comments from the API on every run, not from the event payload (`compliance-fence.yml` lines 55 to 93).
- Even so, I recommend against dropping `labeled` and `unlabeled`. The workflow header (lines 21 to 23) says the `karma:approved` label is how Karma re-runs the check after posting the approval comment, because a comment does not re-run it. Without `labeled`, a protected-path PR that failed for `no cco approval for head SHA` stays red until a push. The `agent:<handle>` label is also what the fence checks for an assigned agent, so adding it late must re-run.
- `edited` carries a base-branch change (the header says so). Dropping it means a retarget is not re-checked against the new base's fence. It also fires on title and body edits, which are the noise. The trigger cannot tell them apart; a job-level `if:` on `github.event.changes.base` would report a skipped check, which satisfies a required status (the trap above). So `edited` is also not safe to drop without a design that keeps a real result on every head.
- `ready_for_review` is not a likely source of volume. I would leave it.
- Cost of doing it anyway: a fence is a compliance control (CR-27, CR-32). A change that can leave a head green without the fence having run is a Compliance and CTO decision, not mine.
- Way back: `git revert`; the check would also need a re-run on every open PR.
- Recommendation: do not patch the triggers. This repeats `ci-speed.md` change 5, and nothing I read today changes it.

### Option (c): agents batch their label adds

- What: an agent adds all its labels in one REST call (`POST /repos/{owner}/{repo}/issues/{n}/labels` with a `labels` array) right after it opens the PR, instead of one call per label.
- Cost: none in code; a line in the agent instructions (the owners of those are not `ops`). It does not remove events if GitHub emits one `labeled` event per label in a batch call [U: I have not tested it, and docs.github.com was not reachable for me]. If it does, the effect is only fewer calls, not fewer runs. A one-PR test is cheap: add two labels in one call and count the fence runs on that head.
- What it still helps: runs already cancel on the next event (`cancel-in-progress: true`), so at most one fence run per PR is live. The waste is a run that took a runner for a few seconds before being cancelled, and that waste is smaller if the labels arrive together. I have no number for it.
- Way back: stop doing it.

### Option (d): a runner or plan change (founder only)

- This is money and an account setting, so it is the founder's decision (CR-73: money, accounts). I will not touch accounts and have no price: I could not read the plan page or GitHub's current limits from here [U].
- Facts I do have: the repository is public, so standard hosted runners are free (`ci-queue-q1-measurement.md`), and `ci-speed.md` observed the macOS cap at 5 concurrent jobs. The Linux concurrency limit of the plan, and what a larger or additional runner would cost, I do not know [U]. The first question for the founder is on the plan page: what the concurrent job limit is for Linux, and whether larger runners need an organization.
- Cost: unknown, a recurring spend if it is a paid runner.
- Way back: cancel the plan or runner; depends on the terms, which I have not read.
- Order: this comes after options (a) and (c) are measured, as `ci-speed.md` recommended for the macOS runner.

## 3. What I would do first

1. Split today's 94 queued and 15 running by workflow (one `gh run list` per workflow). This is a read, takes minutes, and tells which of the options above is aimed at the real cause. I did not do it here because the task was to write the options from the evidence given.
2. Then option (c) as a one-PR test, and option (a) as a patch if web journeys is the large share.
3. Leave option (b) alone; bring option (d) to the founder only if the split shows the queue is not duplicates.

## 4. Not done

- No workflow file was changed, no patch file was written, nothing was applied or measured.
- No claim of a saving appears above; none was measured.
