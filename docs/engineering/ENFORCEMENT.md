# Enforcement map

Every MUST rule in the compendium and what enforces it today. Status words: **enforced** (a test, constraint, lint rule or CI job on `develop` fails when the rule is broken), **pending PR #n** (the check exists in an open PR), **review** (a steward or the red team checks it by hand), **not yet** (nothing enforces it; the gap id says what will).

Rules that stay `not yet` are the backlog for the stewards' standing duty 2: turn one into a real check per run, or file it as a backlog proposal for `product`. The owner of each chapter keeps its rows current in the same PR that changes a rule or adds a check.

Totals across 192 rules (2026-10-03, counted from the rows below): 42 enforced, 38 pending in open PRs, 34 partly enforced, review-only or covered by the rule they cite, 78 not yet.

## principal-architect (chapters 01, 02, 10)

| Rule id | Level | Enforced by | Status | Gap id |
|---|---|---|---|---|
| CODE-R01 | MUST | review; PR template; CLAUDE.md | enforced on develop (review only) | none |
| CODE-R02 | MUST | CI PR size check | not yet | CODE-G1 |
| CODE-R03 | MUST NOT | review; OPERATING_MODEL section 4 | enforced on develop (review only) | none |
| CODE-R04 | MUST | review; CI `required` (`npm test`, `test:db`, typecheck) | enforced on develop | none |
| CODE-R05 | MUST | PR template; golden test `packages/core/test/golden.test.ts` | pending PR #28 | none |
| CODE-R07 | MUST | review; `docs/GLOSSARY.md` | not yet (WS-17 not opened) | CODE-G4 |
| CODE-R09 | MUST | review | enforced on develop (review only) | none |
| CODE-R10 | MUST NOT | `types: []` in package tsconfigs; ESLint `no-restricted-imports` | partly (core only); rest not yet (MONO-02, WS-12) | MONO-02 |
| CODE-R11 | MUST NOT | ESLint `no-restricted-imports` for screens | not yet (WS-12) | MONO-01 |
| CODE-R13 | MUST | `packages/core/src/domain.ts` plus CHECK-constraint parity test | pending PR #31 | CORE-02 |
| CODE-R14 | MUST | PR template; review | enforced on develop (review only) | CORE-06 |
| CODE-R15 | MUST | review; lint rule against string throws | not yet | CORE-13 |
| CODE-R16 | MUST NOT | review; log canary | not yet | CODE-G2 |
| CODE-R17 | MUST | review; Dependabot and `npm audit` gate; licence check | pending PR #30 (audit); licence not yet | CODE-G3 |
| CODE-R18 | MUST | review (principal-architect); ADR | enforced on develop (review only) | none |
| CODE-R19 | MUST | `app_config` table and client | not yet | PDATA-08 (BL-022) |
| CODE-R20 | MUST | typecheck `strict` in CI; ESLint and Prettier | typecheck enforced on develop; lint not yet (PR #30 job waits for WS-12, WS-16) | MONO-01 |
| API-R01 | MUST | contract package with typed wrappers | not yet | API-G4 (MONO-10, WS-04) |
| API-R02 | MUST | generated types plus drift test | not yet | WS-04 |
| API-R03 | MUST | cites DB-R13 for views; RPC or narrow policy writes by review | see DB-R13; review | DB-01 |
| API-R04 | MUST NOT | review (security-architect); bundle scan | review; bundle scan not yet | API-G1 |
| API-R05 | MUST | `access_matrix.test.mjs` (matrix listing, no anon-callable function) | enforced on develop | none |
| API-R06 | MUST | UUIDv7 check; DATA-REQ-044 tests; key column for non-row RPCs | partly on develop (pending migrations 3-7 in tests); key column not yet | API-G2 |
| API-R07 | MUST | idempotency key store | not yet | API-G2 |
| API-R08 | MUST | device outbox with retry classes | not yet | MOB-02 (WS-09) |
| API-R09 | MUST | split codes; typed registry plus unregistered-errcode test | split pending PR #32; registry test not yet | DB-09, API-G5 |
| API-R10 | MUST NOT | value-free validation triggers | not yet | BL-244 |
| API-R11 | MUST | review; previous-release contract test | review only; test not yet | API-G3 |
| API-R12 | MUST | build headers; `min_supported_build` refusal code | not yet | PDATA-08 (BL-022) |
| API-R14 | MUST | request id header end to end | not yet | OBS-G1 |
| API-R15 | MUST NOT | review | review only | TDD 06 C-1 |
| API-R16 | MUST | keyset pagination; `server_seq` cursor | not yet | DB-08 |
| API-R17 | MUST | review; `supabase/tests/perf.test.mjs` server budgets | partly on develop | API-G4 |
| API-R18 | MUST | rate limit in RPC or function, `SCRAT` | invites only on develop; generic not yet | DOC-11 |
| API-R19 | MUST | CDN plus ETag config client | not yet | PDATA-08 (BL-022) |
| API-R20 | MUST | on-device schema and SHA-256 manifest validation | not yet | API-G6 |
| OBS-R01 | MUST | typed `OpsLog` logger | not yet | OBS-G2 (PDATA-06) |
| OBS-R02 | MUST NOT | logger tests; BL-021 scrubbers | not yet | OBS-G2, BL-021 |
| OBS-R03 | MUST | request id end to end | not yet | OBS-G1 |
| OBS-R04 | MUST | review | review only | none |
| OBS-R05 | MUST | ESLint `no-console`; Babel strip in release | not yet | MONO-01 |
| OBS-R06 | MUST | Sentry init after consent; `setUser` never-called test | not yet | MOB-15, BL-021 |
| OBS-R07 | MUST | `audit_events` table and tests; `ops_audit_log` | `audit_events` on develop (pending migration 4); `ops_audit_log` not yet | DOC-11 |
| OBS-R08 | MUST | analytics validator fails closed | pending PR #31 | PDATA-03 |
| OBS-R09 | MUST | `ops_health` views and job | not yet | OBS-G3 (PDATA-06) |
| OBS-R10 | MUST | E2E log canary | not yet | OBS-G4 (LEGAL-REQ-014) |
| OBS-R11 | MUST | review; SLO measurement | not yet measured | PDATA-06 |
| OBS-R12 | MUST | alerts with runbook ids | not yet | PDATA-06, WS-18 |
| OBS-R14 | MUST | runbook wrapper; agents without prod credentials | not yet | PINF-01 |

Gap ids defined here:
- CODE-G1: CI check that fails or labels PRs over 400 lines or 20 files (excluding lockfile, generated, test data).
- CODE-G2: `packages/core/src/age.ts:15` throws `Invalid ISO date: ${iso}`; the input can be a child's date of birth (L4). Replace with a typed error carrying no value.
- CODE-G3: licence allowlist check for production dependencies.
- CODE-G4: `docs/GLOSSARY.md` (WS-17) not started.
- API-G1: scan the built app bundle for `service_role` and `sb_secret` strings.
- API-G2: idempotency key parameter and store for RPCs not keyed on a row id (`request_account_deletion`, invites, policy acts).
- API-G3: contract compatibility test against the previous release tag.
- API-G4: the shared contract package itself (name to be decided; see questions).
- API-G5: test that every `errcode = '...'` in `supabase/migrations` is in the typed registry.
- API-G6: content-block and pack-manifest schemas in the contract package.
- OBS-G1: request id generation on device, header propagation, echo and storage with rejected ops.
- OBS-G2: typed `OpsLog` logger with Asha canary unit tests.
- OBS-G3: `ops_health` views and the 5-minute job.
- OBS-G4: end-to-end log canary over every log stream.

## data-steward (chapters 03, 04)

| Rule id | Level | Enforced by | Status | Gap id |
|---|---|---|---|---|
| DB-R01 | MUST | review; proposed check in `structure.test.mjs` | not yet | WS-03 |
| DB-R02 | MUST | review; `packages/analytics/test/domain.test.ts` | pending PR #31 | CORE-05 |
| DB-R04 | MUST | `supabase/tests/structure.test.mjs` trigger-order pin | pending PR #26 | DB-10 |
| DB-R05 | MUST | review | enforced by review | none |
| DB-R06 | MUST | `is_valid_client_uuid7` (children); entry check + `hardening.test.mjs` | partly on develop (pending file 6); entries pending PR #32 | DB-15 |
| DB-R07 | MUST NOT | `access_matrix.test.mjs` | enforced on develop | none |
| DB-R08 | MUST | `migration-guard.yml` / `migration-guard.mjs` | enforced on develop; guard-from-base pending PR #30 | CI-09 |
| DB-R09 | MUST | `deploy-db.yml` on tag | not yet | CI-03, WS-14 |
| DB-R10 | MUST NOT | `[DB-16]` check in `hardening.test.mjs` | pending PR #32 | DB-16 |
| DB-R11 | MUST | `npm run test:db` in `ci.yml`; label gate `fence.yml` | tests on develop; label pending PR #30 | CI-01, CI-11 |
| DB-R12 | MUST | `classification.test.mjs` (RLS on); allow/deny coverage by review | partly on develop | DB-18 |
| DB-R13 | MUST | revokes + `[DB-01]` tests; `grants.test.mjs` view sweep | pending PR #32, PR #26 | DB-01 |
| DB-R14 | MUST | revoke blocks in migrations; anon-executable sweep; sequence revoke | functions on develop; sweep pending PR #26; sequences pending PR #32 | PDB-02 |
| DB-R15 | MUST | `access_matrix.test.mjs:262-264` (search_path pinned); order rewrite; order check | presence enforced on develop; order pending PR #32; order check not yet | DB-11 |
| DB-R16 | MUST | DB-R13 tests; review | pending PR #32 | DB-01 |
| DB-R17 | MUST | `entries_guard_immutable`; `rls.test.mjs`, `data_governance.test.mjs` | enforced on develop (test harness) | none |
| DB-R18 | MUST | `entries_guard_immutable`; `SCTMB` test | enforced on develop (server); device gap | MOB-03, WS-09 |
| DB-R19 | MUST | `SCPRG` check; day 1 and day 61 tests | pending PR #32 | DB-02 |
| DB-R20 | MUST NOT | review; cascade allowlist test proposed | not yet | DB-17, DB-03 |
| DB-R21 | MUST | `perf.test.mjs` seq-scan and p95 budget; full index | enforced on develop; index pending PR #32 | DB-06 |
| DB-R23 | MUST | `server_seq` + tombstone pull | not yet | DB-08, D-023 |
| DB-R24 | MUST | `SCCFG` tests; env settings check | pending PR #32; per-env check not yet | DB-07, DB-18 |
| DB-R25 | MUST | migrator `user_version`; tombstone refusal; parity test | migrator on develop; refusal pending PR #29; parity not yet | CORE-03, WS-09 |
| DQ-R01 | MUST | `classification.test.mjs` | enforced on develop | none |
| DQ-R02 | MUST | `docs/legal/data-map.yaml` | not yet | PDATA-05, WS-19 |
| DQ-R03 | MUST | `scripts/check-data-map.mjs` in CI | not yet | WS-19 |
| DQ-R05 | MUST | CHECK constraints; API validation (chapter 02) | partly on develop | PAPI (packages/api) |
| DQ-R06 | MUST | `validate.ts` fail-closed + tests | pending PR #31 | PDATA-03 |
| DQ-R07 | MUST NOT | `SCCFG` tests; device not-null | pending PR #32; device not yet | DB-07, MOB-02 |
| DQ-R08 | MUST | fixture tests; scheduled invariant job | fixtures on develop; schedule not yet | PDATA-06 |
| DQ-R09 | MUST | `domain.test.ts` | pending PR #31 | CORE-05 |
| DQ-R11 | MUST | `purge_due()` + `purge_batching.test.mjs` | DB clocks on develop (pending files) | DB-13 |
| DQ-R12 | MUST | cron + `purge-worker` + page | not yet | PDATA-02 |
| DQ-R13 | MUST | device purge job | not yet | PPRIV-01, WS-09 |
| DQ-R14 | MUST | date indexes; 7-year clock or table removal | not yet | DB-13 |
| DQ-R15 | MUST NOT | review; runbooks | not yet | WS-18 |
| DQ-R16 | MUST | path CHECK constraints + storage policies | enforced on develop for `entry-photos` | PDATA-09 |
| DQ-R17 | MUST | bucket from queue row | not yet | PDATA-09 |
| DQ-R18 | MUST | `catalog.test.ts`; `schema-version.test.ts` | partly on develop; bump pending PR #31 | PDATA-10 |
| DQ-R19 | MUST | allowlist in `validate.ts` | enforced on develop | none |
| DQ-R20 | MUST | review; fixture canary proposed | not yet (review only) | PDATA-01 |
| DQ-R21 | MUST | quarterly restore drill (DATA-REQ-031) | not yet | WS-18 |

## security-architect (chapters 05, 06)

| Rule id | Level | Enforced by | Status | Gap id |
|---|---|---|---|---|
| IAM-R01 | MUST | review; enum parity in `packages/core/src/domain.ts` | pending PR #31 | CORE-02 |
| IAM-R02 | MUST | review; access matrix personas | enforced on develop | |
| IAM-R03 | MUST | `require_content_consent()`; `security_family.test.mjs` | enforced on develop (pending files; not live) | DB-03 |
| IAM-R04 | MUST NOT | `apps/mobile/test/age-gate.test.ts`; `classification.test.mjs` | enforced on develop | |
| IAM-R05 | MUST | review | not yet | none (no auth code) |
| IAM-R06 | MUST NOT | review | not yet | |
| IAM-R07 | MUST NOT | lint ban; server backstop in access matrix | not yet (lint); server backstop enforced on develop | MONO-01, WS-12 |
| IAM-R08 | MUST | `apple-token` function and tests | not yet | TDD 04 3.1.1 |
| IAM-R09 | MUST | universal-link handling, intent allowlist | not yet | PSEC-02, WS-11 |
| IAM-R10 | MUST | storage adapter test | not yet | LEGAL-REQ-026 |
| IAM-R12 | MUST | app behaviour test | not yet | TDD 04 3.2.3 |
| IAM-R13 | MUST | `access_matrix.test.mjs` structural checks | enforced on develop | |
| IAM-R14 | MUST | `access_matrix.test.mjs` lines 253-266 | enforced on develop | |
| IAM-R15 | MUST | cites DB-R13 | see DB-R13 | DB-01 |
| IAM-R16 | MUST | review; `book_access` table | not yet | DB-08, D-024 |
| IAM-R17 | MUST | `book_children` view; matrix cell | pending PR #32 | DB-05 |
| IAM-R18 | MUST | `create_child_invite`; `purge_batching.sql:137`; `security_family.test.mjs` | enforced on develop (not live) | DB-03, BL-112 |
| IAM-R19 | MUST | `security_family.test.mjs` | enforced on develop | |
| IAM-R20 | MUST | `remove_member`, `set_member_role` RPCs | not yet | PSEC-01, WS-02 |
| IAM-R21 | MUST | `data_governance.test.mjs` (SCLPG) | enforced on develop | |
| IAM-R22 | MUST | runbook; review | not yet | DB-17, WS-18 |
| IAM-R23 | MUST NOT | review; no Supabase credentials in `agents.yml` | review | PINF-01, PINF-05 |
| IAM-R24 | MUST | access matrix unlisted-function check; review | enforced on develop (functions); review (tables, views) | |
| SEC-R01 | MUST | review; `docs/security/threat-model.md` | not yet | handoff to `security` |
| SEC-R02 | MUST | `docs/ops/SECRETS.md` | not yet | PINF-05, WS-18 |
| SEC-R03 | MUST NOT | GitHub secret scanning; gitleaks; bundle scan | secret scanning on; gitleaks pending PR #30; bundle not yet | LEGAL-REQ-026 |
| SEC-R04 | MUST | scoped deploy secrets in GitHub Environment | not yet | PINF-05, WS-14 |
| SEC-R05 | MUST | incident runbook | not yet | PINF-09, WS-18 |
| SEC-R06 | MUST | `npm ci` in `.github/actions/setup/action.yml` | enforced on develop | |
| SEC-R07 | MUST | licence allowlist check | not yet | TDD 04 8.2 |
| SEC-R08 | MUST | `security.yml` audit gate, `audit-ignore.json` | pending PR #30 | CI-05 |
| SEC-R09 | MUST | `dependabot.yml`; repo setting | pending PR #30; setting founder-only | CI-05 |
| SEC-R10 | MUST | SHA pins | pending PR #30 (CI files); not yet (`agents.yml`, `agents-check.yml`, `claude.yml`) | CI-06 |
| SEC-R11 | MUST | review | review (pattern present in PR #30) | |
| SEC-R12 | MUST | branch protection or ruleset | not yet | CI-01, CI-04 |
| SEC-R13 | MUST | `fence.yml` | pending PR #30 (advisory until SEC-R12) | CI-11, BL-122 |
| SEC-R14 | MUST | `migration-guard.yml` from base ref | pending PR #30 | CI-09 |
| SEC-R15 | MUST | `app.config.ts` entitlement; `config.test.ts` | pending PR #27 | PSEC-05, WS-20 |
| SEC-R16 | MUST NOT | review; config test | not yet | LEGAL-REQ-021 |
| SEC-R17 | MUST | `+native-intent.tsx`, `links.logic.ts` test | not yet | PSEC-02, PSEC-03, WS-11, DOC-17 |
| SEC-R18 | MUST | storage policy changes and tests | pending PR #32 | PSEC-04 |
| SEC-R19 | MUST | review of `agents.yml`, roster; App permissions (founder setting) | not yet (not verifiable in repo) | PINF-01 |
| SEC-R20 | MUST | GitHub App token in `agents.yml` | partial on harness branch; not yet for all engines | PINF-02 |
| SEC-R21 | MUST | cites AIE-R22; `claude.yml` OWNER filter | pending PR #4; review | PINF-03 |
| SEC-R22 | MUST | DNS records | not yet | PINF-08 |
| SEC-R23 | MUST | `SECURITY.md`, `docs/ops/INCIDENT.md` | not yet | PINF-09, WS-18 |
| SEC-R24 | MUST | `security_events` table and sources | not yet | LEGAL-REQ-037 |

## compliance-engineer (chapters 07, 08)

| Rule id | Level | Enforced by | Status | Gap id |
|---|---|---|---|---|
| PRIV-R01 | MUST | `supabase/tests/classification.test.mjs` (Postgres); data-map check for the rest | enforced on develop (Postgres only); not yet (other stores) | PDATA-05 |
| PRIV-R02 | MUST NOT | review | not yet (automated denylist) | PDATA-05 |
| PRIV-R03 | MUST | review (compliance-engineer) | enforced by review | none |
| PRIV-R05 | MUST | `packages/analytics/test/analytics.test.ts`, `catalog.test.ts` defaultOptIn; network E2E | enforced on develop (package); not yet (Sentry, E2E) | PDATA-06, LEGAL-REQ-003 |
| PRIV-R06 | MUST | `policy_acceptances_guard` trigger and checks | enforced on develop (repo; not live) | DB-03 |
| PRIV-R07 | MUST | pepper fails closed (`SCCFG`) | pending PR #32 | DB-07 |
| PRIV-R08 | MUST | `require_content_consent()`, `security_family.test.mjs` | enforced on develop (repo; not live) | DB-03 |
| PRIV-R09 | MUST | review; POLICY_VERSIONING section 9 CI | not yet | LEGAL-REQ-009 |
| PRIV-R10 | MUST NOT | analytics canary test; `audit_events.detail` and receipt size checks; log canary; `console` lint | enforced on develop (analytics, DB checks); not yet (logs, lint) | PDATA-06, MONO-01 |
| PRIV-R11 | MUST | `validate.ts` allowlist; fail-closed required props | enforced on develop; pending PR #31 (fail closed) | PDATA-03 |
| PRIV-R12 | MUST | review on `package.json`; host and dependency diff | not yet (automation) | LEGAL-REQ-041 |
| PRIV-R13 | MUST NOT | dependency denylist | not yet | LEGAL-REQ-016 |
| PRIV-R14 | MUST NOT | `verifyEdits` and fuzz tests; provider config check | enforced on develop (verifier); not yet (provider, v1.1) | LEGAL-REQ-020 |
| PRIV-R15 | MUST | migration drops `safety_events`; network test | enforced in repo, not live; not yet (test) | DB-03, LEGAL-REQ-015 |
| PRIV-R16 | MUST | EXIF strip test | not yet | LEGAL-REQ-013 |
| PRIV-R17 | MUST | claims register plus content test | not yet | PPRIV-04 (WS-10, WS-19) |
| PRIV-R18 | MUST | privacy manifest in `app.config.ts`; render-and-compare script | pending PR #27 (manifest); not yet (script) | LEGAL-REQ-042 |
| PRIV-R19 | MUST | `classification.test.mjs` L4 checks; catalogue review | enforced on develop | none |
| PRIV-R20 | MUST NOT | `child-input` flag check | not yet | LEGAL-REQ-059, PDATA-08 |
| DSR-R01 | MUST | review; `ops/lib/runbook.mjs` wrapper | not yet | TDD 05 7.7 |
| DSR-R02 | MUST | review; support runbook | review only | LEGAL-REQ-036 |
| DSR-R03 | MUST | deletion UI re-auth | not yet | DATA-REQ-019 |
| DSR-R04 | MUST NOT | `request_book_deletion`, `delete_entry`, `child_members_guard`, `data_governance.test.mjs` | enforced on develop (repo; not live); pending PR #32 (DB-01) | DB-01, DB-17, DB-03 |
| DSR-R05 | MUST | `privacy_requests` table | not yet | TDD 05 7.8 |
| DSR-R06 | MUST | SQL functions plus purge worker | enforced in repo (SQL); not yet (worker) | PDATA-02 |
| DSR-R07 | MUST | device purge; `analytics-forget`; worker | not yet | PPRIV-01, PDATA-04, PDATA-02 |
| DSR-R08 | MUST | `audit_events` and receipt checks; emails | enforced on develop (DB); not yet (emails) | PDATA-02 |
| DSR-R09 | MUST | `SCPRG` purged-id set | pending PR #32 | DB-02 |
| DSR-R10 | MUST | `legal_holds`, `is_held`, `purge_due`, hold test | enforced on develop (repo; not live); not yet (hold audit events, review alert) | DB-03 |
| DSR-R11 | MUST | preservation script | not yet | LEGAL-REQ-057 |
| DSR-R12 | MUST | request log plus overdue query | not yet | TDD 05 7.8 |
| DSR-R13 | MUST | review; monitoring query | not yet (monitoring) | PDATA-06 |

## ai-eng-lead (chapters 09)

| Rule id | Level | Enforced by | Status (enforced on develop / pending PR #n / not yet) | Gap id |
|---|---|---|---|---|
| AIE-R01 | MUST | review (ai-eng-lead, red-team); brief reading order (`readingOrder()`) | pending PR #39 | AIE-G1 |
| AIE-R02 | MUST NOT | `scripts/agents/check.mjs` assertion | not yet | AIE-G2 |
| AIE-R03 | MUST | `check.mjs` size warnings (150 memory lines, 200-char description) | pending PR #4 (partial); real budgets not yet | AIE-G3 |
| AIE-R04 | MUST | review (ai-eng-lead) of instruction-file PRs | review only | none |
| AIE-R05 | MUST | ai-eng-lead standing duty 1 | not yet (known contradictions open) | AIE-G9 |
| AIE-R07 | MUST | red-team standing duty 3; ai-eng-lead standing duty 1 | pending PR #4 (charters) | none |
| AIE-R08 | MUST | OPERATING_MODEL section 9; dollar and step caps `run-opencode.mjs:109-110` | pending PR #4 | none |
| AIE-R09 | MUST | brief includes PRINCIPLES; chapters on demand | pending PR #39 | AIE-G1 |
| AIE-R11 | MUST | review (red-team, domain steward) | review only | none |
| AIE-R12 | MUST | `product` task template; `check.mjs` warning | not yet (2 of 167 tasks comply) | AIE-G4 |
| AIE-R13 | MUST | OPERATING_MODEL section 4; PR size check | review only; size check not yet | CODE-G1 |
| AIE-R14 | MUST | CI `required` job (`.github/workflows/ci.yml`) | enforced on develop (suite); test quality review only | none |
| AIE-R15 | MUST NOT | review (red-team); CI diff check on agent PRs | review only; check not yet | AIE-G5 |
| AIE-R16 | MUST NOT | review (red-team scope check) | pending PR #4 (red-team charter) | none |
| AIE-R17 | MUST | `verify.fuzz.test.ts` in CI; golden test; nightly random seed | fuzz enforced on develop; golden pending PR #28; nightly pending PR #36 | none |
| AIE-R18 | MUST | deny lists `run-opencode.mjs:19-22`, `agents.yml:141`; branch protection | deny lists pending PR #4; branch protection not yet | CI-01 |
| AIE-R19 | MUST | roster model split; dispatcher review mode; model-family check | pending PR #4; family check not yet | AIE-G6 |
| AIE-R20 | MUST | `verifyEdits` and its property test; red-team constitution check | enforced on develop | none |
| AIE-R21 | MUST | deny lists, App permissions, `fence.yml` | pending PR #4 and PR #30; fence advisory until branch protection | PINF-01, CI-11 |
| AIE-R22 | MUST | `isFounderComment`; trusted-author and first-line marker checks (`isTrusted`, `startsWithMarker`) | pending PR #4 and PR #39 | AIE-G7 |
| AIE-R23 | MUST | `receipt.mjs`; weekly aggregation | pending PR #4 (receipts); aggregation not yet | AIE-G8 |
| AIE-R24 | MUST | founder approval of `agents/roster.json` (CODEOWNERS); review | pending PR #4 | none |
