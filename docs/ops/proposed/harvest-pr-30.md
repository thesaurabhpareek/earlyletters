# Harvest before closing: PRs #30, #26 and #32

Status: proposal, 1 Nov 2026. Draft, for the founder. Nothing is closed, merged or changed by this pull request. The doc only says what each PR holds that develop does not, so closing is an informed decision.

Method: PR metadata and file lists from the REST API; each head fetched (`refs/pull/N/head`) and compared with `origin/develop` at 246debbd. "On develop" means a keyword or behaviour search of `supabase/migrations`, `supabase/tests` and `.github`; where a search found nothing the entry says "not found" and is unverified (U) until a reviewer reads the replacement code. I did not run any of the three PRs' tests.

Note on the ids: the ids SEC-R03, SEC-R08 and SEC-R09 in `docs/engineering/ENFORCEMENT.md:157,162,163` all point at PR #30 (gitleaks, audit gate, dependabot). #26 and #32 are database PRs (WS-03, WS-01), not security-content PRs.

## State of all three

| PR | Title | Head | Draft | Mergeable | Base it was cut from |
|---|---|---|---|---|---|
| #30 | chore(ci): trusted-ref migration guard, SHA pins, scans (WS-13) | dafb5ff4 | no | dirty | 4183844c (old) |
| #26 | test(db): mirror Supabase function defaults in the harness (WS-03) | 7048dc1e | yes | dirty | 36887966 (old) |
| #32 | fix(db): harden pending migrations 3-7 (WS-01) | 660e633c | yes | dirty | 36887966 (old) |

All three were last updated 28 Oct 2026 and are far behind develop (#32 is 6 commits ahead, 417 behind). None can merge as is; a harvest means re-cutting small PRs from develop, not rebasing these.

## PR #30 (WS-13 CI hardening): what is worth keeping

Everything is under `.github/`, so any re-cut is a fenced change (D-124, `approve-migration`) and founder-applied.

| Item | Path on the PR head | Already on develop? | What closing loses |
|---|---|---|---|
| Trusted-ref migration guard (CI-09): the guard runs from the base ref, not from the PR | `.github/workflows/migration-guard.yml`, `.github/scripts/migration-guard.mjs` | No. develop's workflow has no trusted-ref step (grep for `RUNNER_TEMP`, `TRUSTED`, `exception` finds nothing) | A PR can still edit the guard that judges it |
| Guard tests, 16 cases, temp git repos | `.github/scripts/migration-guard.test.mjs` | No such file | The only tests of the guard, including "a PR cannot add its own exception" |
| Single reviewed exception list (CI-02), one entry for `20261001000000_scribe_hardening.sql` at one blob | `.github/migration-exceptions.txt` | No | The release PR into `main` would still fail the guard if `main` predates it (U: check whether `main` now carries the guard) |
| gitleaks full-history scan, version and sha256 pinned, with a scoped allowlist for the 8 copy-key false positives | `.github/workflows/security.yml`, `.github/gitleaks.toml` | No. Closes the gap named at `docs/engineering/ENFORCEMENT.md:157` (SEC-R03) | Secret scanning in CI. The allowlist (rule `generic-api-key`, path `packages/content/src/*.ts`) is the expensive part to rediscover |
| Dated npm audit gate that fails closed | `.github/scripts/audit-gate.mjs`, `.github/scripts/audit-gate.test.mjs` (6 tests), `.github/audit-ignore.json` | No. SEC-R08 | A tested gate with expiring ignores. See "Stale content" below: the ignore list needs rewriting |
| dependabot.yml | `.github/dependabot.yml` | No (`.github/dependabot.yml` absent). SEC-R09 | Superseded by the draft in `docs/ops/proposed/dependabot.yml` (HV2-B17); copy the `ignore` rules for react and react-native (Expo pins them) |
| Path fence for `supabase/**`, `.github/**`, auth paths | `.github/workflows/fence.yml`, `.github/scripts/fence-paths.mjs` + test | Partly: `.github/workflows/compliance-fence.yml` (CR-27) covers protected paths via `compliance/FENCE.json`. The auth-path rule (`apps/` or `packages/` named `auth`, `session`, `sign-in`) is U: not confirmed | Possibly the auth-path rule only |
| SHA pins on every action, `ubuntu-24.04`, `persist-credentials: false` | `.github/workflows/ci.yml`, `.github/actions/setup/action.yml` | Partly. 23 `checkout` and 14 `setup-node` uses are already SHA-pinned; 17 are not (list in `docs/ops/proposed/dependabot.yml`) | The pins for those 17, which `scripts/ci/workflow-lint.mjs` (PR #553) now detects |
| `lint` job (skips if no root `lint` script), `mobile config` job, `required` needs updated, drop duplicate content test (MONO-12) | `.github/workflows/ci.yml` | U. Not compared line by line | Small; re-derive if wanted |
| README of the trusted-ref model and exception format | `.github/README.md` | No | Explanation only |

Stale content in #30 that must not be copied as is:

- `audit-ignore.json` lists 4 advisories. Run on develop today (1 Nov, `npm audit --omit=dev`), `braces` (GHSA-vfj7-8cjw-p6xm) no longer appears, and many new high and critical ones do (Next.js, zod, more node-forge). The list would not make the gate pass. Details in `docs/ops/proposed/npm-audit.md`.
- Action SHAs: the PR pins checkout `3d3c42e5...` v7.0.1 and setup-node `82076278...` v7.0.0; develop already uses the same two, so they are still the in-repo choice.
- `security.yml` is not wired to `required`, deliberately. Keep that.

Cheapest harvest: three small PRs from develop, copying files from `refs/pull/30/head`: (1) guard + tests + exception file + workflow change; (2) `security.yml` + `gitleaks.toml`; (3) `audit-gate` + a refreshed ignore list. All founder-applied.

## PR #26 (WS-03 test harness): what is worth keeping

All under `supabase/tests/`; no migration files. D-041 applies to the path, but these are tests only.

| Item | Path on the PR head | On develop? | What closing loses |
|---|---|---|---|
| Trigger firing-order pins (DB-10): `entries_family_rules` before `entries_insert_guard`/`entries_guard`; consent gates before guard/touch; `child_members` guard BEFORE, audit AFTER DELETE; every `*_touch` last among BEFORE UPDATE | `supabase/tests/structure.test.mjs` (58 lines) | Not found (no test file mentions trigger order) | The only test that would catch a renamed trigger changing firing order (Postgres fires same-event triggers alphabetically). Worth re-cutting. Trigger names must be re-checked against develop's newer migrations |
| Harness mirror of Supabase default privileges for functions and sequences | `supabase/tests/harness.mjs` | Superseded. develop's harness has `SCRIBE_DEFAULT_GRANTS` modes and probes (`supabase/tests/harness.mjs:20-50`) | Nothing |
| View and sequence grant sweeps (DB-01, PDB-02) | `supabase/tests/grants.test.mjs` | Mostly superseded by `20261023060000_explicit_grants.sql` and `supabase/tests/explicit_grants.test.mjs`, `supabase/tests/grants.mjs` | Possibly the "anon-executable public functions is an empty set" check (U: `function_rpc_contract.test.mjs` may cover it) |
| Fixes in applied-or-pending migrations and renamed tests (`children.test.mjs`, `fixpack.test.mjs`, `hardening.test.mjs`, `upgrade.test.mjs`) | listed in #26 because it contains #32 and #3 | See #32 | See #32 |

PR #26 says "merge after #32" and carries #32's commits, so its unique content is `structure.test.mjs` plus the grants test.

## PR #32 (WS-01 pending migration hardening): what is worth keeping

This is the risky one. It edits `20261002010000`, `20261002020000`, `20261003000000`, `20261003010000`, `20261003020000`. None is in `.github/migrations-applied.txt` (only the first two migrations are), so the guard would allow it, but 21 later migrations on develop (20261004000000 to 20261028010000) were written on top of the current text. Editing those five files in place now would change what a fresh database builds and could diverge from what staging has applied (U: whether any environment applied them is in `supabase/APPLY.md`, not read). Per CLAUDE.md, fixes should be new migration files. Any re-cut needs data-architect, red-team review and the `approve-migration` label (D-041).

Issues the PR fixes, and whether develop has an equivalent (keyword search of `supabase/migrations` found no id match for DB-02, DB-05, DB-07, DB-09, DB-12, DB-15, PSEC-04, so "not found" means the ids are absent, not that the behaviour is):

| Id | Fix on the PR | Test | Equivalent on develop |
|---|---|---|---|
| DB-01 | book_entries and my_policy_state write grants revoked | `hardening.test.mjs` lines 34-48 | Likely yes: `20261023060000_explicit_grants.sql:14,40,108`, `20261015000000_v1_gate_membership_sync_hardening.sql` revoke on views |
| DB-05 / D-039 | contributors read no `children` row; a `book_children` view exposes name, nickname, birthday month and day only | lines 50-61 | Not found. `book_children` appears nowhere on develop. A contributor-privacy gap may remain (U) |
| DB-15 | non-v7 letter ids refused; captured_at bounded (two days ahead refused) | lines 64-70 | `is_valid_client_uuid7` exists (`20261015020000`); the captured_at bound is not found |
| DB-02 / PDB-03 | purged letter id refused for good (SCPRG), service role too | lines 72-91 | Partly: `purge_ledger` exists in `20261003020000`, `20261016000000`, `20261004200000`; SCPRG is not found by name |
| PSEC-04 | photo objects cannot be updated in place; delete needs live membership | lines 93-109 | Not found (storage policies only in `20260930000000` and `20261023000000`) |
| DB-12 | dictionary terms unique per owner and book, case-insensitive | lines 111-119 | Not found |
| DB-09 | specific error codes (SCPAR, P0002, 22023, SCACD, SCTMB) | lines 121-129 | U |
| DB-07 / BL-115 X-12 | consent pepper from Vault only, fails closed (SCCFG) | lines 185-202 | Not found; develop has pepper work in `20261015010000_v1_gate_peek_invite_consent_pepper.sql` (U whether it fails closed) |
| Retry safety (decision 17) | `create_child_invite` and `record_policy_act` take a client UUIDv7 key; replay returns the original id | lines 131-183 | `create_child_invite(p_invite_id ...)` exists in `20261015020000:231`. `record_policy_act` idempotency key: not confirmed (U) |

What closing #32 loses for certain: `supabase/tests/hardening.test.mjs` (250 lines, 68 checks), `fixpack.test.mjs`, `upgrade.test.mjs`, and the design reasoning in `supabase/APPLY.md` and the migration comments. The reasoning is the most valuable part and is the cheapest to keep: save the PR head as a branch before closing (see below).

Suggested harvest: data-architect takes the "Not found" rows (DB-05, DB-15 captured_at, PSEC-04, DB-12, DB-07, DB-02 SCPRG) as individual new-migration proposals, each with the PR's test lines as a starting point.

## Safe way to close

Closing a PR does not delete its branch, but a branch can be deleted later. To lose nothing, before closing push the heads to `wip/` refs (PR heads are also kept by GitHub at `refs/pull/N/head`):

```
git fetch origin pull/30/head:wip/pr-30-ci-hardening pull/26/head:wip/pr-26-db-harness pull/32/head:wip/pr-32-db-pending
git push origin wip/pr-30-ci-hardening wip/pr-26-db-harness wip/pr-32-db-pending
```

Then close with a comment linking this file. I did not close anything.

## Conflicts of interest

I am a Claude session working for the founder, not the author of these PRs. The PRs were written by other Claude sessions; I have no stake in them, but I wrote the replacement proposals (`dependabot.yml`, `npm-audit.md`), so I lean toward saying #30 is superseded.
