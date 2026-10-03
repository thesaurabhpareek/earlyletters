# Draft inputs: security-architect (chapters 05 and 06)

## Principles
- The database decides who sees a letter: RLS and RPC guards are the access control, the app only hides buttons, and every policy has a test that proves the deny.
- Access comes from membership of one book with one role (`parent` or `contributor`), never from being signed in.
- No secret or service key ever ships in the app or reaches an AI agent; every secret has an owner, a store and a rotation date.
- Pin what you run (lockfile, action SHAs, checksummed binaries) and threat-model every new surface before the code.
- Only the founder's words are instructions; all other text an agent reads is data.

## Enforcement map

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
| IAM-R15 | MUST | view revokes; `grants.test.mjs` catalog sweep | pending PR #32, PR #26 | DB-01 |
| IAM-R16 | MUST | review; `book_access` table | not yet | DB-08, D-024 |
| IAM-R17 | MUST | `book_children` view; matrix cell | pending PR #32 | DB-05 |
| IAM-R18 | MUST | `create_child_invite`; `purge_batching.sql:137`; `security_family.test.mjs` | enforced on develop (not live) | DB-03, BL-112 |
| IAM-R19 | MUST | `security_family.test.mjs` | enforced on develop | |
| IAM-R20 | MUST | `remove_member`, `set_member_role` RPCs | not yet | PSEC-01, WS-02 |
| IAM-R21 | MUST | `data_governance.test.mjs` (SCLPG) | enforced on develop | |
| IAM-R22 | MUST | runbook; review | not yet | DB-17, WS-18 |
| IAM-R23 | MUST NOT | gitleaks; bundle scan | pending PR #30 (repo); not yet (bundle) | PINF-01, PINF-05 |
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
| SEC-R21 | MUST | `isFounderComment` (`scripts/agents/lib.mjs:226`); `claude.yml` OWNER filter | enforced on harness branch (PR #4); review | PINF-03 |
| SEC-R22 | MUST | DNS records | not yet | PINF-08 |
| SEC-R23 | MUST | `SECURITY.md`, `docs/ops/INCIDENT.md` | not yet | PINF-09, WS-18 |
| SEC-R24 | MUST | `security_events` table and sources | not yet | LEGAL-REQ-037 |

## Review paths
- `supabase/migrations/**` (with data-steward)
- `supabase/tests/**`
- `**/auth/**`, `**/auth.*`, `**/session*`, `**/sign-in*`, `**/signin*`
- `apps/mobile/src/lib/auth*`
- `.github/**`
- `apps/mobile/app.config.ts`
- `apps/mobile/eas.json`
- `package-lock.json`
- `scripts/agents/**`
- `.claude/**`
- `agents/roster.json`
- `SECURITY.md`, `docs/security/**`, `docs/ops/SECRETS.md`

## Open questions for the founder
1. Sign-in at v1.0: BRIEF decision 4 lists Google; D-044 (and PRD 1.3) moves Google to v1.1. Chapter 05 follows D-044. Confirm.
2. Can one parent remove the other co-parent (WS-02): yes, only the book creator, or only with both parents' agreement?
3. When a contributor leaves or is removed, are their letters kept in the book or tombstoned?
4. Make the repository private on GitHub Pro so branch protection stays available (CI-04, CI-01)?
5. Pause scheduled unattended agent runs and remove agent write connectors until branch protection is on (PINF-01)?
6. Deep-link scheme: keep `scribe` or rename before the first build (DOC-17)?
7. Move email codes from 6 to 8 digits before public launch (TDD 04 OQ-S1)?
8. Stop `profiles` cascading from `auth.users` so a dashboard delete fails closed (DB-17)?
