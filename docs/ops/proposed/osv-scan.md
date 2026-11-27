# Proposal: the audit gate step and an advisory OSV scan (BL-2124, SEC-R08, CODE-R17)

Status: proposal, 24 Nov 2026. Nothing under `.github/` changes in this pull request (CR-22, D-124). Karma pastes both.

## 1. The audit gate (blocking, once the ignore list is in place)

First copy `docs/ops/proposed/audit-ignore.json` to `.github/audit-ignore.json`. Without it the gate treats the list as empty and fails on the 10 high advisories develop has today (live `npm audit --omit=dev --json` on 00c93e3, 24 Nov 2026: 0 critical, 6 vulnerable packages at high; node-forge and zod through the Expo CLI, decode-uri-component through Expo Router). Every entry expires on 2027-02-22.

Step for `ci.yml`, job `unit`, after the test step. It reads `package-lock.json` only; `npm audit` calls the registry, so it needs no install and no token.

```yaml
      - name: Dependency audit gate (SEC-R08, ids and package names only)
        if: ${{ !cancelled() }}
        run: node scripts/ci/audit-gate.mjs --run
```

`--run` runs `npm audit --omit=dev --json` and passes npm's exit status to the gate, so a failed audit never reads as clean. The log names advisory ids, severities and package names, never titles or URLs.

## 2. OSV scan (advisory)

OSV.dev also covers advisories the npm registry does not carry. It is advisory: a finding never blocks a merge, and the job is not added to `required`.

```yaml
  osv:
    name: OSV scan (package-lock.json, advisory)
    runs-on: ubuntu-24.04
    timeout-minutes: 5
    # Advisory: never add this job to `required`.
    continue-on-error: true
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683 # v4.2.2
        with:
          persist-credentials: false
      - uses: google/osv-scanner-action/osv-scanner-action@32d3cd482bdadfb38b186c0ad1b031902d55d932 # v2.7.1
        with:
          scan-args: |-
            --lockfile=package-lock.json
            --format=table
```

Put it in `ci.yml` (no `needs`) or in a scheduled `security.yml` as `npm-audit.md` describes. The sha is `refs/tags/v2.7.1^{}` read with `git ls-remote https://github.com/google/osv-scanner-action` on 24 Nov 2026. That action runs the Docker image `ghcr.io/google/osv-scanner-action:v2.7.1` by tag, not by digest (`osv-scanner-action/action.yml` at that sha), so the image can move under a fixed action sha; the job is advisory partly for that reason.

## Not verified

The YAML was not run (no Actions runner here), and `--lockfile` was not run against this repo with osv-scanner 2.7.1. The gate was run locally against the live report: it fails with no ignore file and passes with the proposed one.
