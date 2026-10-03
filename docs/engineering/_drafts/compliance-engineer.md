# Draft inputs: compliance-engineer (chapters 07 and 08)

## Principles

1. Every public privacy claim maps to code and a test, or we do not make it.
2. No letter text, transcript, audio, photo or child identity in analytics, logs, crash reports, push, URLs, receipts or support prefill.
3. Nothing is collected or sent before consent; analytics and crash reports are opt-in, and consent gates are checked on the server.
4. A request touches only the requester's own data; nobody deletes another author's words.
5. Every request leaves a content-free audit trail; legal process goes to counsel, never answered by engineering alone.

## Enforcement map

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
| DSR-R02 | MUST | review; support runbook | not yet | LEGAL-REQ-036 |
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

## Review paths

- `packages/analytics/**`
- `docs/legal/**` (claims consistency only, no edits)
- `apps/mobile/src/**/consent*`
- `apps/mobile/src/**/delete*`
- `apps/mobile/src/**/export*`
- `supabase/migrations/**` (purge, deletion, holds, consent, audit, classification comments)
- `supabase/tests/data_governance.test.mjs`, `supabase/tests/purge_batching.test.mjs`, `supabase/tests/classification.test.mjs`
- `package.json`, `apps/*/package.json`, `packages/*/package.json` (any new dependency or SDK)
- `apps/mobile/app.config.ts` (privacy manifest, permissions)
- `packages/content/src/**` (privacy claims only)
- `supabase/functions/**` (when it exists: purge worker, `analytics-forget`, export)

## Open questions for the founder

1. Claims register location: `docs/legal/CLAIMS.md` (WS-19) or `docs/legal/claims-registry.yaml` (LEGAL-REQ-044)? One source, so the content test has one input.
2. Who keeps the request log until `privacy_requests` exists, and where (support mailbox labels with the DSR-R05 fields)?
3. Set the real `{PRIVACY_EMAIL}` and replace `support@example.com` in `packages/brand/index.ts`; the rights section of the privacy policy depends on it.
4. Approve a pending migration replacing the `revenuecat` deletion step with `appstore_mapping` (spec v1.1.0, ADR 0013).
5. Prioritise the purge worker (PDATA-02) and device purge (PPRIV-01) before any public beta with a backend: today the published 31/38/45-day promise has no executing code.
6. Handoff for `support`: create response templates in `docs/support/` (acknowledgement, verification, completion, extension, denial with appeal, legal-process holding reply) referenced by chapter 08.
7. Counsel pack (via `legal`): which state laws apply at launch; COPPA framing for adult-authored content about children; D-050; hold notice to users; analytics on cancelled deletion (TDD 05 OQ-L3).
