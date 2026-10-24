# Memory: Privacy and Compliance Engineer (compliance-engineer)

Curated long-term memory. Update it in the same PR as your work when you learn something durable. Replace stale lines; do not append forever.

Seeded 2026-10-03 from the compendium drafting run, against `develop` plus open PRs #25 to #33. Lines marked (15 Oct) were re-checked against `develop` at `56ec5b5` (after #4, #39 and #130 merged). Every other line is as of 3 Oct: re-verify it before acting on it.

## Current focus
- Chapters 07 (PRIV) and 08 (DSR) drafted. Next: conformance sweep. (15 Oct) #27 and #31 merged on 4 Oct; #32 is still a draft.

## Facts about this codebase (with paths)
- Deletion SQL lives in `supabase/migrations/20261002020000_data_governance.sql` (tables `deletion_requests`, `deletion_request_steps`, `legal_holds`, `audit_events`, `purge_ledger`, `policy_acceptances`; functions `request_account_deletion`, `request_book_deletion`, `delete_entry`, `restore_entry`, `purge_due`, `prepare_account_purge`, `finalize_account_deletion`, `is_held`). Updated in `20261003000000_security_and_family.sql` and `20261003020000_purge_batching.sql`.
- Live DB has only files 1-2 applied (DB-03): none of the deletion machinery is live.
- (15 Oct) `supabase/functions/` on `develop` has `purge-worker`, `analytics-forget`, `config`, `content` and `_shared` (server logger in `_shared/log`). There is no `export-build` function (PDATA-04).
- `deletion_request_steps.step` check still lists `revenuecat`; spec v1.1.0 says `appstore_mapping` (also in PR #32 branch).
- `legal_holds` has RLS on and no policies (service role only); `is_held()` is used by `purge_due`. Test "legal hold blocks purge" in `supabase/tests/data_governance.test.mjs`. No code writes `legal_hold_placed` audit events.
- Consent pepper: `data_governance.sql:684` falls back to `''` (DB-07); PR #32 fails closed with `SCCFG`.
- Server content gate: `require_content_consent()` in `20261003000000_security_and_family.sql:190`.
- Classification gate: `supabase/tests/classification.test.mjs` (Postgres only). No `docs/legal/data-map.yaml`, no `docs/legal/CLAIMS.md` yet (WS-19).
- Analytics: `packages/analytics/src/validate.ts` (`MAX_STRING_LENGTH = 40`), `posthog.ts` (`REQUIRED_POSTHOG_OPTIONS.defaultOptIn: false`), `consent.ts` (random id, retired ids kept for deletion, `forgetAllIds()`). Canary test at `packages/analytics/test/analytics.test.ts:219`.
- (15 Oct) `child_added` sends `has_date` instead of `mode` (`packages/analytics/src/catalog.ts`; PR #31 merged 4 Oct). PPRIV-02 closed.
- Claim at risk: `packages/content/src/strings.en.ts:532` `settings.backup.honestNote` ("only on this phone"), D-033.
- (15 Oct) `packages/brand/index.ts` sets `supportEmail` to `hello@` the domain.
- No ESLint (MONO-01), so no `console` ban. (15 Oct) v1.0 collects no analytics: `EXPO_PUBLIC_ANALYTICS` is off in every build profile (#118); taking `posthog-react-native` out of the bundle is open PR #125.
- No ad-SDK denylist in CI, including the `ci/hardening` branch (PR #30).
- No response templates or runbook wrapper yet. (15 Oct) `docs/support/` arrives with PR #41 (help centre drafts).

## Decisions and constraints I must respect
- BRIEF decision 11 (private, never sold, no ads, no training) and 12 (opt-in analytics); D-003 (Sentry on the same consent).
- D-006 adults only; D-013 US App Store first; D-042 `/delete-account` static page plus email at v1.0; D-049 consent rows; D-050 Washington second consent is open with counsel.
- Requirement docs are read-only for me: ENGINEERING_REQUIREMENTS, DELETION_AND_EXPORT_SPEC, `docs/prd/`.
- I am not a lawyer; legal readings are labelled and routed to counsel.

## Open threads
- Claims register location: `CLAIMS.md` (WS-19) vs `claims-registry.yaml` (LEGAL-REQ-044). Founder to pick.
- `privacy_requests` and `ops_audit_log` tables are designed in TDD 05 sections 7.7 and 7.8, not built.

## Lessons
- `cppa.ca.gov` and `law.cornell.edu` fetches timed out on permission on 2026-10-03; the AG's 2020 final-text PDF on `oag.ca.gov` worked. Re-try CPPA for the current numbering.
- The eur-lex `eli` URL returns only metadata; use `legal-content/EN/TXT/HTML/?uri=CELEX:32016R0679`.
