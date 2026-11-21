# Proposal: pin every workflow action to a full commit sha (SEC-R10, BRIEF CI-PIN, CR-71 A5)

Status: proposal, 20 Nov 2026. This pull request changes nothing under `.github/`. A tag such as `actions/checkout@v4` can be moved by its owner, and the action then runs with our token. 17 uses are still by tag; every other use already carries a sha.

## The exact change

`docs/ops/proposed/workflows/ci-pins.patch` edits 4 workflows and empties the allowlist, in one diff:

| File | Uses pinned |
|---|---|
| `ci.yml` | 7 (checkout x5, setup-node, cache) |
| `web-e2e.yml` | 5 (checkout, setup-node, cache x2, upload-artifact) |
| `web.yml` | 3 (checkout, setup-node, cache) |
| `migration-guard.yml` | 2 (checkout, setup-node) |

It stays on major v4, so behaviour does not change. The shas are the ones this repo already uses for the same major (checkout v4.2.2, setup-node v4.4.0, cache v4.3.0) and, for upload-artifact, the v4 tag read from the network on 20 Nov 2026:

```
$ git ls-remote https://github.com/actions/upload-artifact 'refs/tags/v4*' 'refs/tags/v4*^{}' | grep -E "v4.6.2|refs/tags/v4$"
ea165f8d65b6e75b540449e92b4886f43607fa02	refs/tags/v4
ea165f8d65b6e75b540449e92b4886f43607fa02	refs/tags/v4.6.2
```

The tag is lightweight (no `^{}` line), so that sha is the commit. The same read confirmed 11bd7190 = checkout v4.2.2, 49933ea5 = setup-node v4.4.0, 0057852b = cache v4.3.0. Moving to the newer pins elsewhere in the repo (checkout v7.0.1, cache v6.1.0 and so on) is a major upgrade and needs its own backlog row.

## Verify the four shas once before applying

Run these on a machine that can reach github.com; each line must print the sha shown (checkout v4.2.2, setup-node v4.4.0, cache v4.3.0, upload-artifact v4.6.2). The first three are the shas this repo already uses elsewhere; I read all four from the network on 20 Nov 2026.

```
git ls-remote https://github.com/actions/checkout refs/tags/v4.2.2        # 11bd71901bbe5b1630ceea73d27597364c9af683
git ls-remote https://github.com/actions/setup-node refs/tags/v4.4.0      # 49933ea5288caeca8642d1e84afbd3f7d6820020
git ls-remote https://github.com/actions/cache refs/tags/v4.3.0           # 0057852bfaa89a56745cba8c7296529d2fc39830
git ls-remote https://github.com/actions/upload-artifact refs/tags/v4.6.2 # ea165f8d65b6e75b540449e92b4886f43607fa02
```

## How it is guarded

`apps/mobile/test/workflow-pins.test.ts` (runs in `unit`) fails on any `uses:` that is not a sha, except the lines in `docs/ops/action-pins-allowlist.txt`. The list only shrinks: it fails if a listed line is already pinned, and (against the base branch's copy, `scripts/guards/ratchet-base.mjs`) if the list gained a line. Until the fetch step below exists, a pull request prints `ratchet compare: NOT ENFORCED (founder fetch step missing)` and the reviewer runs `git show origin/develop:docs/ops/action-pins-allowlist.txt | diff - docs/ops/action-pins-allowlist.txt` by hand.

## What the founder pastes, in order

1. Apply the patch (a workflow edit; two reviews, security-architect reads `.github/**`):
   ```
   git checkout -b chore/apply-ci-pins origin/develop
   git apply --check docs/ops/proposed/workflows/ci-pins.patch && git apply docs/ops/proposed/workflows/ci-pins.patch
   git commit -am "chore(ci): pin the 17 remaining actions to full shas (SEC-R10)"
   ```
2. In `ci.yml`, job `unit`, add this step before `npm test` and this `env` on the job. It serves every shrink-only list (this one, BL-964, CI-SIZEGATE, CI-LINT, CI-COV):
   ```yaml
       env:
         RATCHET_BASE_REQUIRED: ${{ github.event_name == 'pull_request' && '1' || '' }}
       steps:
         - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
         - name: Fetch the base branch for shrink-only compares
           if: github.event_name == 'pull_request'
           run: git fetch --no-tags --depth=1 origin "+refs/heads/${GITHUB_BASE_REF}:refs/remotes/origin/${GITHUB_BASE_REF}"
   ```
   Do 2 after 1, in the same sitting. A pull request cannot change `RATCHET_BASE_REQUIRED` without editing `ci.yml`, which shows in the diff.

## How to verify

- Before: `grep -rn "uses:" .github/workflows .github/actions | grep -v "@[0-9a-f]\{40\}" | grep -v "uses: \./"` lists 17 lines. After: none.
- `git apply --check` on a clean develop tree succeeds (run on 20 Nov at 021ecdfe).
- `npm test -w apps/mobile` is green on the patched tree and red on develop's with an empty list (17 lines named).
- The first CI run after the paste starts every job: that proves each sha resolves.

## The way back

`git revert` the paste commit. The old tags still resolve, and the test would then fail until the allowlist is restored, so revert the allowlist line change with it (it is in the same commit).
