# Workflow proposals retired because they are already live (27 Nov 2026)

Status: record, docs only. Nothing under `.github/` is edited by this file.

Seven patch files in `docs/ops/proposed/workflows/` no longer applied to develop (`git apply --check` failed on each, and so did `node scripts/ci/proposed-patch-applies.mjs`). Each one failed because its change is already in the live workflow, applied by hand and often widened or hardened after review, not because it still waits. Redoing them against develop would give empty or duplicate diffs, so they are removed instead. The files stay in git history at `ba634177` (develop, 27 Nov 2026), where each can be read with `git show ba634177:docs/ops/proposed/workflows/<name>.patch`.

Read on develop at `ba634177`, file and line:

| Patch | What it proposed | Where it is live |
|---|---|---|
| `ci-docs-lane.patch` | `heavy` output on `install`; heavy jobs skip on an inert-docs PR; `content` job always runs; `required` accepts `skipped` only when `heavy=false` | `.github/workflows/ci.yml` lines 39 to 73 (`outputs.heavy` and the `scope` step, hardened by BL-1479: bound to the head sha, compare API, closed list), 92 to 102 (`content`), 107, 123, 135, 147, 169 (`if: needs.install.outputs.heavy == 'true'`), 197 to 211 (`required`) |
| `ci-pins.patch` | pin 17 tag uses in 4 workflows to 40-character shas and empty `docs/ops/action-pins-allowlist.txt` | no `@v<n>` use is left in `ci.yml`, `migration-guard.yml`, `web-e2e.yml` or `web.yml`; the allowlist holds comment lines only |
| `ci-unit-timeout.patch` | `unit` timeout 5 to 10 minutes | `.github/workflows/ci.yml` line 109 |
| `ios-compile-paths.patch` | negated paths so a docs or tests only change starts no macOS run | superseded by `ios-compile-batch` rather than applied as written: the same `!` patterns sit on `push` (`.github/workflows/ios-compile.yml` lines 61 to 72), and `pull_request` keeps only the build paths, so a docs or tests only PR still starts no run |
| `ios-compile-batch.patch` | pull requests run macOS only on build paths; other mobile changes run once per merge into develop | `.github/workflows/ios-compile.yml` lines 32 to 73 (`pull_request.paths` is the build-path list, `push` to develop has the wide list), line 80 (`cancel-in-progress` only on pull requests) and lines 335 to 340 (the `changes` job reads push events too); applied by hand under CR-175 (`ci-speed.md`, change 3) |
| `ios-compile-eas-json.patch` | add `apps/mobile/eas.json` to the `changes` job's native filter | `.github/workflows/ios-compile.yml` line 341 (`apps/mobile/eas\.json$`) and line 44 (`pull_request.paths`) |
| `release-ios-launch-gate.patch` | first job `launch-gate` on an rc tag; `classify` needs it | `.github/workflows/release-ios.yml` lines 51 to 68 and 72; applied in PR #1641 (`release-ios-launch-gate.md`, Status) |

How this was checked: for each patch, the lines it adds were looked up in the live file and the lines it removes were checked absent; where a line differs, the live line is the later, stricter form named in the table. `release-ios-launch-gate.patch` also applies in reverse (`git apply --check -R`).

## The rule from here

`scripts/ci/proposed-patch-applies.test.mjs` now checks every `.patch` in `docs/ops/proposed/workflows/`, not a fixed list, and runs in `npm test`. So the commit that applies a proposal to `.github/` also deletes its patch and marks its doc applied, or `npm test` fails on that commit. A patch that rots for another reason (its context moved) fails the same way and is refreshed against develop.

## Still open after this

Three proposals apply to develop and wait for someone with an account that can push `.github/workflows/` (agent sessions cannot): `a11y-evidence.patch` (`ax5-evidence.md`), `e2e-web.patch`, `ios-compile-timing.patch`. A fourth is added with this file: `release-ios-launch-gate-output.patch` (`release-ios-launch-gate.md`, "Require the open line").

Docs outside `docs/ops/proposed/` that name a removed patch, left for their owners: `docs/release/RELEASE_PR_CARRY_LIST.md` lines 67 and 70 (the folder listing and the [UNVERIFIED] note, which this table answers), `docs/agents/cto/RULINGS.md` (ios-compile-batch), `docs/agents/exec/proposed/moments-rulings-security-legal-money.md` (ios-compile-eas-json), `docs/engineering/readiness-20nov/briefs/platform/BRIEF-CI-PIN-sha-pin-actions.md` (ci-pins), the comment in `apps/mobile/test/workflow-pins.test.ts` line 6, and `docs/ops/action-pins-allowlist.txt` line 4 (owned by its test, which compares the file with the base branch).
