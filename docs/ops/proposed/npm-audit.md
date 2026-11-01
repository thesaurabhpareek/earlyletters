# Proposed advisory job: npm audit --omit=dev (HV2-B17)

Status: proposal, 1 Nov 2026. Nothing under `.github/` is changed by this pull request (D-124, CR-22). The founder can paste the job below on or after 10 Nov 2026. It is advisory: it never fails a pull request and is not added to the `required` job.

This pairs with `docs/ops/proposed/dependabot.yml` (same PR). It does not replace PR #30's dated gate (`audit-gate.mjs`); see `docs/ops/proposed/harvest-pr-30.md`.

## Current audit output (run 1 Nov 2026)

Command: `npm audit --omit=dev --json` at the repo root on develop 45aa2197 (`package-lock.json` sha256 prefix 2a0c9a2e1c33). The network was available through the session proxy, so this is a live registry result, not an offline lockfile reading. Exit status 1.

Totals: 26 vulnerable packages: 1 critical, 6 high, 15 moderate, 4 low. 883 production dependencies in the tree.

Direct dependencies with advisories:

| Package | Severity | Our version | Fix npm reports |
|---|---|---|---|
| `next` | critical | 16.3.8 (`apps/web/package.json:24`) | 16.4.3, not a major bump |
| `expo-router` | high | (apps/mobile) | 58.0.29, flagged as a semver-major bump |
| `expo`, `expo-sharing`, `expo-splash-screen`, `react-email` | moderate | | Expo SDK upgrade |
| `@react-email/render` | low | | |

Advisories at high or critical (ids from the report):

- `next` <=16.4.0: GHSA-2464-fhr4-w9xw (critical, unauthenticated RCE in the Image Optimization API when SVG files are used), GHSA-673q-mjm6-r5xr (critical, unauthenticated RCE in `use cache` functions returning typed arrays), GHSA-p3m5-59mp-jv5r (high, denial of service via Server Actions).
- `node-forge` <=1.4.0: GHSA-86w9-cpqp-85rv, GHSA-7wch-p9px-956x, GHSA-jc66-7q78-782g, GHSA-8hrf-8g6f-7xwp, GHSA-hqq3-7jhf-c5jx, GHSA-5x38-2vff-x55p (all high). Reached through the Expo CLI (build tooling).
- `decode-uri-component` <=0.5.0: GHSA-qr28-fpjm-wq7f (high), through Expo Router query parsing.
- `zod` <4.6.6: GHSA-mrhx-c7xc-m3w5 (high), through the Expo CLI.

Exploitability in our use (a reading, not a test):

- `next` is the one that matters. `apps/web` is the public website on Next 16.3.8, inside the vulnerable range. Whether the two RCE paths are reachable depends on whether the site enables image optimization with SVG sources or uses `use cache` (I grepped `apps/web/next.config.ts` for `images` and `output` and `apps/web` for `"use cache"` and found no hits, but that is a keyword search, not a review). The fix is a minor bump to 16.4.3. Recommend the founder or the web agent take it as its own PR now, not wait for 10 Nov. This is a finding for `product` to put on the backlog.
- `node-forge`, `zod`, `glob`, `minimatch`, `deepmerge`: build and dev-client tooling on the developer machine and CI; they do not run in the shipped app on family data. Low urgency; they move with an Expo upgrade.
- `decode-uri-component` via Expo Router: parses query strings in the app; denial of service only. Moderate urgency.

Not run: `npm audit` for the dev tree (`--omit=dev` is the request), and `npm audit fix` (never run with `--force`).

## The job

Add to a new file `.github/workflows/security.yml` (or as a job in `ci.yml` that is not in `needs` of `required`). Pins use the two action SHAs already used 23 and 14 times on develop. Pull requests are not run: the schedule and manual trigger only, so it cannot add noise to the PR queue.

```yaml
name: Security (advisory)

on:
  schedule:
    - cron: '17 6 * * 1' # Mondays 06:17 UTC
  workflow_dispatch:

permissions:
  contents: read

jobs:
  npm-audit:
    name: npm audit (production, advisory)
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    # Advisory: a failure here never blocks a merge. Do not add this job to `required`.
    continue-on-error: true
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0
        with:
          node-version: 22
      # Reads package-lock.json only; no install. npm exits 1 when advisories exist, so the status is
      # captured and the report is written to the job summary. Never run `npm audit fix --force`.
      - name: npm audit --omit=dev
        run: |
          status=0
          npm audit --omit=dev --json > "$RUNNER_TEMP/audit.json" || status=$?
          echo "npm audit exit status: $status"
          node -e '
            const a = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
            if (a.error) { console.log("audit did not run:", a.error.summary || a.error.code); process.exit(2); }
            const m = a.metadata.vulnerabilities;
            const lines = ["## npm audit --omit=dev", "", JSON.stringify(m), ""];
            for (const v of Object.values(a.vulnerabilities).filter(v => ["high","critical"].includes(v.severity)))
              lines.push("- " + v.name + " (" + v.severity + (v.isDirect ? ", direct" : "") + ")");
            const out = lines.join("\n");
            console.log(out);
            if (process.env.GITHUB_STEP_SUMMARY) require("fs").appendFileSync(process.env.GITHUB_STEP_SUMMARY, out + "\n");
          ' "$RUNNER_TEMP/audit.json"
          # Make a critical advisory visible (red step) without blocking anything: continue-on-error is set.
          node -e 'const a=require(process.argv[1]); process.exit(a.metadata.vulnerabilities.critical>0?1:0)' "$RUNNER_TEMP/audit.json"
```

Why this shape:

- `continue-on-error: true` at job level: a red advisory job does not make a workflow or PR fail. It only turns the check amber in the run list.
- Schedule and manual only: a newly published advisory should not red every open PR (there are 91 open PRs on 1 Nov; the WIP limit is 72).
- The JSON is parsed, not grepped, and "audit did not run" (an npm `error` object) is distinguished from "advisories found". The tested fail-closed version of this idea is `audit-gate.mjs` in PR #30.

Not tested: I could not run the workflow YAML (no Actions runner) and did not run `actionlint`. I did run the two inline `node -e` programs locally against the saved audit JSON (they printed the summary and exited 1 because a critical advisory exists, as designed); I did not run the surrounding shell as a workflow.

## Which of the 17 tag-pinned `uses:` lines Dependabot will keep updated

Found by running PR #553's linter (`feat/harness-v2-b11-workflow-lint`, head 8afd9458, `scripts/ci/workflow-lint.mjs`) against `.github/workflows` on develop: 17 `pin` findings, 0 `prt` findings, exit 1. The lines:

| File | Lines | Action |
|---|---|---|
| `ci.yml` | 31, 55, 70, 81, 92 | `actions/checkout@v4` |
| `ci.yml` | 32 | `actions/setup-node@v4` |
| `ci.yml` | 38 | `actions/cache@v4` |
| `migration-guard.yml` | 20 | `actions/checkout@v4` |
| `migration-guard.yml` | 23 | `actions/setup-node@v4` |
| `web-e2e.yml` | 43 | `actions/checkout@v4` |
| `web-e2e.yml` | 45 | `actions/setup-node@v4` |
| `web-e2e.yml` | 50, 61 | `actions/cache@v4` |
| `web-e2e.yml` | 77 | `actions/upload-artifact@v4` |
| `web.yml` | 52 | `actions/checkout@v4` |
| `web.yml` | 54 | `actions/setup-node@v4` |
| `web.yml` | 61 | `actions/cache@v4` |

Answer: all 17, with the proposed config. They are in `.github/workflows/*.yml` and use public `actions/*` repositories, and the `github-actions` entry has `directories: ["/", ...]`; the docs say "/" makes Dependabot check `/.github/workflows`. Source: https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference.

Caveats:

- I did not run Dependabot; "will keep updated" is the documented behaviour, not an observed one. Check the Dependabot tab (Insights > Dependency graph > Dependabot) after the first Monday.
- A `@v4` tag will be moved to a newer tag by Dependabot (`v4` to a later major), but the docs page I read only documents the SHA-plus-comment form (`actions/checkout@<commit> # <tag>`: the comment is updated when it is on the same line). Behaviour for a bare major tag is U.
- Dependabot ignores local actions (`./...`, per the docs page https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories). The two uses inside `.github/actions/setup/action.yml` are already SHA-pinned; they are covered only if the `/.github/actions/*` directory is scanned, which the docs do not state (U).
- If the 17 are later SHA-pinned (HV2-B20), Dependabot continues to update them and rewrites the `# vX.Y.Z` comment.
- Every Dependabot PR to a workflow touches `.github/**`, so each needs the `approve-migration` label (fence). With the group `actions` and a limit of 2 that is at most one actions PR a week.

## Dependabot config: what was verified, and what was not

Verified at https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference (fetched 1 Nov 2026, through a summarising tool, not read by eye in full):

- `directories` supports globs and `*`; `directory` does not. All directories in one entry must use the same ecosystem.
- `groups.<name>`: `patterns`, `exclude-patterns`, `dependency-type` (`development` or `production`; supported for npm), `update-types` (`minor`, `patch`, `major`), `applies-to` (default version updates). A dependency matching several groups goes to the first.
- `open-pull-requests-limit`: default 5; security updates have a separate fixed limit of 10; setting 0 pauses version updates.
- `schedule.interval`: `daily`, `weekly`, `monthly`, `quarterly`, `semiannually`, `yearly`, `cron`.
- `labels`: custom labels replace the default; labels that do not exist in the repo are ignored.
- `target-branch`: security updates are affected (assignees and commit-message are not applied) when it names a non-default branch.
- The summary also said Dependabot applies "a default cooldown period of 3 days" to version updates (not security updates). I did not confirm that on the page myself.

Not verified (the pages did not say, marked U): `schedule.day` valid values (I use `monday`, which PR #30 also used); whether `open-pull-requests-limit` counts per directory; how npm workspaces behave (this repo has one root `package-lock.json` and 11 package.json files, so several `directories` may each open PRs that change the same lockfile; if the first week is noisy, reduce to `directories: [/]`); whether the `ignore` entries for `react` and `react-native` match (they come from PR #30, which parsed them as YAML but never ran Dependabot).

Local checks: `dependabot.yml` parses as YAML (Python `yaml.safe_load`); keys follow the docs above. There is no Dependabot schema validator available offline, and I did not run one.

## Conflicts of interest

None beyond the usual: I wrote this config and also recommend how it is judged. The PR #30 author's dependabot file is the base I changed; I chose a smaller PR limit (2 instead of 5) to protect the PR queue, which trades faster dependency freshness for less review load.
