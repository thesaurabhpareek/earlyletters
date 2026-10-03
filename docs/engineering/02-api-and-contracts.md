---
chapter: 02
title: API and contracts
owner: principal-architect
reviewers: [data-steward, security-architect]
status: adopted
last_reviewed: 2026-10-03
applies_to: supabase/functions/**, supabase/migrations/** (function signatures and SQLSTATEs), packages/api/**, packages/db-types/**, apps/mobile/src/lib/**
---

# 02. API and contracts

## Purpose

The phone is offline-first and cannot be force-upgraded, so every server interface we publish is a promise to every build still in the field. This chapter makes BRIEF decision 17 concrete: typed and versioned contracts in one package, an auth check, idempotency, a latency budget and a rate limit on every endpoint, content-free logs and a request id on every call. Database internals (RLS, triggers, transactions, indexes) are chapter 03; what payloads may contain is chapter 07.

## Principles

1. **The contract lives in one typed package.** Client and server import the same types and error codes, so they cannot drift (BRIEF decision 17).
2. **Every write is safe to retry.** The phone retries from an outbox after crashes and bad networks; a retry must never create a second letter (DATA-REQ-044).
3. **Errors are codes, not prose.** The client branches on SQLSTATE or a typed code; messages are for humans and may change.
4. **Old apps keep working.** Changes are additive; breaking changes get a new name and a retirement date.
5. **Reads through RLS, writes through RPCs.** The client holds only the user's JWT; the database is the only authority.

## Rules

### Shape and ownership

**API-R01 (MUST)** Every client-callable interface (RPC, Edge Function, Storage path pattern, public config file) has its request, response and error codes declared in the shared contract package, and the app calls it only through that package's typed wrappers. *Why:* BRIEF decision 17; hand-written calls drift. *Enforced by:* not yet: neither `packages/api` (decision 17) nor `packages/db-types` (ADR 0010, WS-04) exists (MONO-10). See open question 1.

**API-R02 (MUST)** Database types used by clients are generated from the migrations in CI, never written by hand, and a drift test fails when a migration changes a column or function the package exposes. *Why:* CORE-02, CORE-03 (local schema drifted from the server). *Enforced by:* not yet: WS-04 (wave 2, depends on WS-01).

**API-R03 (MUST)** Client writes go through RPCs or narrow, tested RLS policies on a table (the `entries` upsert path, TDD 02 3.4); views are read-only and grant no INSERT, UPDATE, DELETE or TRUNCATE to `anon` or `authenticated`. *Why:* DB-01: the `book_entries` view was writable by every member. *Enforced by:* pending PR #32 (revokes) and PR #26 (`supabase/tests/grants.test.mjs` catalog sweep).

**API-R04 (MUST NOT)** The app never ships a service-role or secret key, and no request is made with one on a user's behalf; Edge Functions call the database with the caller's JWT unless the function is a system job. *Why:* BRIEF decision 17; a service key bypasses RLS. *Enforced by:* review (security-architect); gitleaks scan pending PR #30; a bundle scan for `sb_secret`/`service_role` is not yet (API-G1).

**API-R05 (MUST)** Every RPC calls `require_user()` (or is explicitly service-only with EXECUTE revoked from `anon` and `authenticated`), and every new function revokes EXECUTE from `public` and `anon` unless it is meant for them. *Why:* Supabase grants EXECUTE on new functions to API roles by default. *Enforced by:* `supabase/tests/access_matrix.test.mjs` on develop; anon-executable sweep pending PR #26.

### Idempotency and retries

**API-R06 (MUST)** Every write is idempotent on a client-generated key: creates use the device UUIDv7 row id (`entries.id`, `create_child(p_id, ...)`); RPCs that are not keyed on a row take an explicit idempotency key from the caller; repeat calls return the first outcome. *Why:* DATA-REQ-044; the outbox retries after kills. *Enforced by:* partly: UUIDv7 check `is_valid_client_uuid7` (`supabase/migrations/20261003010000_children_and_entitlements.sql`) and DATA-REQ-044 tests; explicit key column for non-row RPCs not yet (API-G2).

**API-R07 (MUST)** A server that stores idempotency keys keeps them at least 24 hours, rejects a reused key with different parameters, and never stores keys built from personal data. *Why:* the same rules Stripe applies; a key tied to a person is L3. *Enforced by:* not yet: no key store exists; applies to the first Edge Function that needs one.

**API-R08 (MUST)** Clients retry only transient failures (network, `5xx`, `429`, `40001`, `40P01`, `57014`) with exponential backoff and jitter (1 s to 5 min) and keep queue order; every `SC***`, `23***` and `42501` is permanent and moves the op to `rejected_writes`; `SCCON` pauses the queue. *Why:* DATA-REQ-043 and TDD 02 3.5; retrying a permanent error loops forever, dropping it loses words. *Enforced by:* not yet: no outbox exists on the device (MOB-02, WS-09).

### Errors

**API-R09 (MUST)** Every error a client may branch on has a registered five-character SQLSTATE in the error registry (table below, mirrored in the contract package) with one meaning and one retry class; one code is never reused for a second meaning. *Why:* DB-09: `SCDEL` carried six meanings. *Enforced by:* pending PR #32 splits the codes; the registry as a typed export with a test that greps `supabase/migrations` for unregistered `errcode` values is not yet (WS-04).

**API-R10 (MUST NOT)** Server errors returned to the client carry no row values: custom raises use fixed messages, and content tables validate lengths before CHECK constraints can echo the failing row. *Why:* TDD 06 C-2: Postgres DETAIL echoes the whole row, including letter text. *Enforced by:* not yet: BL-244 (value-free validation), owned by data-steward in chapter 03.

### Versioning and compatibility

**API-R11 (MUST)** Changes to a published interface are additive: new optional parameters with defaults, new response fields, new codes in an existing retry class. Removing or renaming a parameter, column, field or code, or changing its meaning, needs a new name (`<rpc>_v2`) and the old one stays until `min_supported_build` (D-035) is above every build that calls it. *Why:* App Store builds stay installed for months; the server cannot assume the latest client. *Enforced by:* review (principal-architect); compatibility test against the previous release's contract not yet (API-G3).

**API-R12 (MUST)** Every request from the app carries the app build number and contract version in headers, and the server can refuse a build below `min_supported_build` with a dedicated code that the app turns into the gentle update card (TDD 01 3.10). *Why:* the one safe way to retire an old contract. *Enforced by:* not yet: `app_config` does not exist (BL-022, PDATA-08).

**API-R13 (SHOULD)** A deprecated interface is announced in the contract package with `@deprecated <date> <replacement>`, logged by count (never by user) when called, and removed in its own PR after the count reaches zero for 28 days. *Why:* deletion by evidence, not by guess. *Enforced by:* review.

### Requests, reads and sync

**API-R14 (MUST)** Every request carries a random request id generated by the caller (32 lowercase hex characters, the W3C trace-id format), which Edge Functions echo in the response and log (chapter 10, OBS-R03). *Why:* correlates a user report, a device log and a server log without any user id. *Enforced by:* not yet (OBS-G1).

**API-R15 (MUST NOT)** Content and L3 ids do not appear in URL paths or query strings for new interfaces; use POST bodies (RPCs) instead. *Why:* LEGAL-REQ-014; platform logs record paths (TDD 06 C-1). *Enforced by:* review; conflict C-1 for existing reads is an open question in chapter 07.

**API-R16 (MUST)** Lists are paginated by a stable keyset cursor, never by offset, with a server-set page cap; sync pulls use a server-assigned monotonic cursor (`server_seq`, D-023), never `updated_at`. *Why:* DB-08: an `updated_at` cursor can skip rows written in the same instant. *Enforced by:* not yet: `server_seq` does not exist (DB-08, WS-09).

### Budgets and limits

**API-R17 (MUST)** Every endpoint lists in the contract package its p95 client latency, server-time budget, payload cap and rate limit, taken from TDD 06 3.2; a new endpoint without them is not merged. *Why:* BRIEF decision 17. *Enforced by:* review; server-time budgets for queries are tested in `supabase/tests/perf.test.mjs` on develop.

**API-R18 (MUST)** Rate limits are enforced in the RPC or Edge Function (PostgREST has none of its own), keyed by user id or a hashed device id, and refusals raise `SCRAT`. *Why:* abuse and cost control; the invite limit already does this (`create_child_invite`). *Enforced by:* `SCRAT` on invites in `supabase/migrations/20261003000000_security_and_family.sql`; generic `rate_limits` table not yet (DOC-11).

### Public config and server-driven content

**API-R19 (MUST)** Public read-only data (remote config, pack manifests, prompt and content blocks) is served from a CDN with long cache and ETag, is never awaited at launch, and the app works from its last good copy. *Why:* BRIEF decisions 15 to 17. *Enforced by:* not yet: BL-022.

**API-R20 (MUST)** Server-driven content blocks and pack manifests are validated on device against a versioned schema from the contract package and checked by SHA-256 against a signed manifest; unknown block types are skipped, never rendered raw. *Why:* BRIEF decision 16; App Review 2.5.2 and 2.3.1. *Enforced by:* not yet.

## How to apply it

Adding or changing an RPC:
- [ ] Signature, response type and codes added to the contract package; budget and rate limit filled in (API-R17).
- [ ] `require_user()` first; EXECUTE revoked from `public` and `anon`; access matrix cell added.
- [ ] Idempotent on a client key; a second call returns the first result.
- [ ] Additive change only, or a `_v2` with a retirement plan (API-R11).
- [ ] New codes added to the registry below in the same PR.

Error registry (from `supabase/migrations` on PR #32 head `f20898c`, `supabase/APPLY.md`):

| Code | Meaning | Client class |
|---|---|---|
| `SCIMM` | immutable column changed | permanent |
| `SCTMB` | illegal tombstone transition (use `restore_entry`) | permanent, offer restore |
| `SCLPG` | last parent cannot leave | permanent |
| `SCDEL` | the book or letter is deleted | permanent |
| `SCPAR` | parents only | permanent |
| `SCACD` | account deletion pending | permanent until cancelled |
| `SCPRG` | id was purged; never comes back | permanent, drop local copy from queue |
| `SCCID` | invalid or reused client id | permanent |
| `SCANO` | anonymous session refused | permanent for the session |
| `SCCON` | consent missing | pause queue, show consent sheet |
| `SCVER` | newer policy version must be accepted | pause, call `policy_actions_needed()` |
| `SCINV` | invite cannot be created or accepted | permanent |
| `SCRAT` | rate limited | retry after the window |
| `SCAPR` | approval columns are server-owned | permanent |
| `SCCFG` | server setting missing | server alert, not shown to user |
| `28000` | not signed in | refresh session |
| `42501` | RLS refused | permanent (access) |

`SCPLS` exists on develop but is removed by PR #32 (BRIEF decision 3). `P0002`, `22023` and `55000` are also raised; the contract package must classify them.

## Exceptions

The founder grants exceptions, recorded as a `D-###` (standing) or `Exception: API-Rnn, <reason>, <removal date>` in the PR body (one-off). A breaking change without a `_v2` is never a one-off exception.

## Open questions

1. Decision 17 names `packages/api`; ADR 0010 and WS-04 name `packages/db-types`. Recommend one package, `packages/api`, holding generated DB types, the error registry, typed RPC wrappers and content-block schemas. Founder to confirm.
2. Does Supabase keep custom request headers (request id, build) in its API logs, and for how long? Unverified; decides whether API-R14 needs a body field instead.
3. How long does an old build stay supported? Proposed: 180 days after its successor ships, enforced by `min_supported_build`.

## References

Repo: `docs/agents/BRIEF-2026-10-03.md` decisions 15, 16, 17; `docs/tdd/02-sync-backend.md` 3.4, 3.5, 4; `docs/tdd/06-performance-reliability.md` 3.2, 5.4; `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-043, DATA-REQ-044; `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-014; D-023, D-024, D-035; ADR 0004, ADR 0010; findings DB-01, DB-08, DB-09, CORE-02, CORE-03, MOB-02, MONO-10, PDATA-08, DOC-11.

External (all checked 2026-10-03):
- Stripe API reference, "Idempotent requests": https://docs.stripe.com/api/idempotent_requests. Replays the first result, including 500s; keys may be pruned after 24 hours; reused keys with different parameters error; avoid personal data in keys.
- Supabase, "Database functions": https://supabase.com/docs/guides/database/functions. Prefer security invoker; a security definer function must set `search_path`; revoke EXECUTE from `public` and `anon`.
- Supabase, "Securing your API": https://supabase.com/docs/guides/api/securing-your-api. Grants decide reachability, RLS decides rows; new public objects get API-role grants by default.
- PostgreSQL, Appendix A "Error Codes": https://www.postgresql.org/docs/current/errcodes-appendix.html. Test the code, not the message; the first two characters are the class.
- PostgreSQL, "Errors and Messages" (PL/pgSQL): https://www.postgresql.org/docs/current/plpgsql-errors-and-messages.html. `RAISE ... USING ERRCODE` accepts a five-character SQLSTATE.
- W3C Trace Context: https://www.w3.org/TR/trace-context/. trace-id is a 16-byte value written as 32 lowercase hex.
