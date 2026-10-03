# Draft inputs from principal-architect (chapters 01, 02, 10)

## Principles

1. One concern per PR, under 400 lines and 20 files; a change you cannot review in ten minutes gets split (CODE-R01, CODE-R02).
2. Every domain type, enum, rule and error code has exactly one definition, in `packages/core` or the contract package; never redeclare it (CODE-R13, API-R09).
3. Every write is idempotent on a client key and every contract change is additive, because old app builds stay in the field (API-R06, API-R11).
4. Errors are typed codes and SQLSTATEs; messages and logs never hold user data, and logs carry a random request id, never a user id (CODE-R15, OBS-R02, OBS-R03).
5. Standard over custom: platform and well-maintained libraries first, verified against installed source (CODE-R17, CODE-R18).

## Enforcement map

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
| API-R03 | MUST | view grant revokes; grants catalog sweep | pending PR #32, PR #26 | DB-01 |
| API-R04 | MUST NOT | review; gitleaks; app bundle secret scan | gitleaks pending PR #30; bundle scan not yet | API-G1 |
| API-R05 | MUST | `access_matrix.test.mjs`; anon-executable sweep | partly on develop; sweep pending PR #26 | none |
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

## Review paths

- `packages/**`
- `apps/mobile/src/lib/**`
- `supabase/functions/**`
- `packages/api/**`, `packages/db-types/**`
- `supabase/migrations/**` (only function signatures, grants and `errcode` values; database internals belong to data-steward)
- `scripts/**` (logging and runbook wrappers)
- any PR over 400 changed lines or 20 files (CODE-R02)

## Open questions for the founder

1. Contract package: BRIEF decision 17 says `packages/api`; ADR 0010 and WS-04 say `packages/db-types`. Recommend one package, `packages/api`, holding generated DB types, the SQLSTATE registry, typed RPC wrappers and content-block schemas. Yes or no?
2. PR size ceiling: 400 lines and 20 files (excluding lockfile, generated and test data) for everyone, or a lower ceiling (for example 250) for agent PRs?
3. Should the PR size check block merges, or only add a `size:large` label and require an `Exception:` line?
4. How long must an old app build keep working against the server? Proposed 180 days after its successor ships, enforced through `min_supported_build`.
5. MONO-04: compile packages to JS with an `exports` map, or keep raw TS with explicit `.ts` extensions for Deno? Needs an ADR before the first Edge Function.
6. Alert channel for Sev 1 and Sev 2: Sentry alerts (existing processor, recommended in TDD 06 5.6) or a new push or SMS service?
