# ADR 0017: API and service standards

Status: Proposed (implements founder decision 17 of 3 Oct 2026). Date: 2026-10-03, amended 2026-10-05 (fix wave: idempotency and server rate limits landed in migration 20261005000000; SCCAP; membership endpoints; section 6 closed and re-listed). Owner: platform.
Code: `packages/api/src/standards.ts` (budgets, classes, endpoints, cache policy, retry), `packages/api/src/envelope.ts` (envelope, error codes, SQLSTATE mapping), `packages/api/test/standards.test.ts` (contract checks), `supabase/functions/config/serve.ts` (reference implementation).
Related: TDD 02 section 4, TDD 06 sections 2, 3 and 5, ADR 0016, `supabase/APPLY.md` "Error codes the app must handle".

Evidence key as in ADR 0016: **V** verified on an opened page, **V-code** read in this repo, **U** unverified, **E** our estimate.

## 1. Rules every endpoint follows

1. **A p95 latency budget** from its class (2), measured at the client on good US LTE (PRD 7.2).
2. **An auth rule:** `public` (no credentials, no user data), `user_jwt` (the signed-in user's Supabase JWT; RLS or an in-function check decides), or `server_only` (cron and store webhooks with a dedicated secret). The app never holds a service key; the publishable (anon) key in the app is public by design (V-code: `src/lib/supabase/env.ts`). `standards.test.ts` fails if a `server_only` endpoint is listed as app-callable.
3. **Safe under retries:** reads are safe methods; inserts use the device's UUIDv7 as a natural idempotency key (DATA-REQ-044); other mutations carry an `idempotency-key` header (a UUID) that the server records for 24 hours and answers the stored result on a repeat (V-code: `public.idempotency_keys`, `idempotency_claim` and `idempotency_store` in migration 20261005000000, used by `create_child_invite` and `record_policy_act`; the same key with other arguments is `22023`). The client makes the key **once per user action** and sends the same key on every retry of that action; a fresh key per attempt defeats the rule (APPLY.md "App changes for file 12").
4. **Rate limited** where it is enforced (CDN, RPC, Edge Function or Supabase Auth). Client-only limits are listed as gaps (5).
5. **Content-free logs:** one line per request through `supabase/functions/_shared/log/log.ts` (closed event names and error codes, status, SQLSTATE, duration, counts, random `req_id`; no ids, paths, text or bodies). The log canary fixtures (`_shared/log/canary.ts`) are pushed through new functions' tests.
6. **Request ids:** the client sends `x-request-id` (12 lowercase hex, random); the server echoes a valid one or makes one, and returns it in the header and in error bodies. Support correlates by request id, never by person.
7. **One envelope:** `{ ok: true, data, requestId }` or `{ ok: false, error: { code, retryable, sqlstate? }, requestId }`. Errors never carry messages, rows, paths or user text. Public signed documents are served bare (so any CDN caches them byte for byte) with the envelope for errors only.
8. **Typed and versioned in `packages/api`** so client and server cannot drift; Edge Functions import its leaf modules directly (`standards.ts`, `envelope.ts`; deployed with `--use-api`).

## 2. Endpoint classes

| Class | p95 | Timeout | Attempts | Backoff (full jitter) | Used for |
|---|---|---|---|---|---|
| `public_document` | 300 ms | 5 s | 3 | 1 s to 30 s | config, content, pack manifest |
| `pack_file` | 1 s first byte | 60 s per Range request | 6 per host | 2 s to 5 min | pack files |
| `auth` | 1.5 s | 15 s | 2 | 1 s to 5 s | sign-in, refresh |
| `read_rpc` | 300 ms | 10 s | 4 | 1 s to 60 s | `policy_actions_needed`, `my_sync_gate`, `sync_books`, `peek_invite`, sync pull pages |
| `write_rpc` | 500 ms | 15 s | 8 | 1 s to 5 min | `create_child`, invites, `leave_child`, `remove_child_member`, `record_policy_act`, account deletion |
| `sync_batch` | 800 ms | 30 s | 10 | 1 s to 5 min | `sync_push` (up to 50 ops) |
| `edge_light` | 600 ms (cold start included) | 10 s | 4 | 1 s to 60 s | invite redeem, Apple token |

Budgets come from PRD 7.2 and TDD 06 3.2; the AI gateway (`edge_heavy`, 4 s) returns with v1.1.

## 3. Retry policy

- Exponential backoff with full jitter: delay = random(0, min(cap, base x 2^(attempt-1))) (AWS Architecture Blog, "Exponential Backoff and Jitter"; `retryDelayMs`). A `Retry-After` in seconds wins, capped; HTTP-date values are ignored because phone clocks drift.
- What retries is decided by `classifySqlstate` and `classifyHttpStatus` (`envelope.ts`):
  - retry: network failure (status 0), 408, 429, 5xx, SQLSTATE 40001, 40P01, 55P03, 57014 and classes 08, 53, 57, 58;
  - refresh the session once: 401, 28000;
  - pause the queue for consent: SCCON;
  - tell the person: SCRAT, SCINV, SCCAP (code `parents_full`: the book already has two parents, D-069), SCPLS (SCPLS goes away with decision 3);
  - reject permanently (content stays on the phone in `rejected_writes`, queue continues): SCIMM, SCTMB, SCLPG, SCDEL, SCPAR, SCCID, SCAPR, SCANO, P0002, 22023, 42501, 23xxx, other SC codes, anything unknown (a deterministic failure must not loop).
- Upload order is kept: a retrying op blocks the ops behind it in the same book (TDD 02 3.4).

## 4. Rate limits

| Endpoint | Limit | Per | Enforced by |
|---|---|---|---|
| config, content, pack manifest | 60 per hour | hashed IP | CDN cache (origin sees cache misses only) |
| pack files | 600 per hour | hashed IP | CDN |
| sign-in | Supabase defaults (30 verifications per 5 min per IP, A-REQ-027) | IP | Supabase Auth |
| `sync_push` | 60 batches per minute | user | RPC, `rate_hit('push')` (V-code, 20261005000000) |
| `sync_pull` | 120 per minute | user | RPC, `rate_hit('pull')` |
| `policy_actions_needed` | 60 per hour | user | RPC, `rate_hit('policy_actions')` |
| `accept_child_invite`, `leave_child`, `remove_child_member`, `peek_invite` | 120 per hour together | user | RPC, `rate_hit('membership')` (`peek_invite`: db-fix, G-13) |
| `create_child_invite` | 20 per day per book and per parent | user | RPC (`SCRAT`, V-code) |
| `record_policy_act` | 60 per hour and 200 per 24 hours | user | RPC |
| `request_account_deletion`, `cancel_account_deletion` | 5 new requests, 5 cancellations per 24 hours (a repeat of an open request is free) | user | RPC |
| `create_child` | 20 per day | user | RPC (db-fix, G-11; until it lands, book creation reaches the server only through `sync_push`, which is limited) |
| `sync_books`, `my_sync_gate`, `revoke_invite` | as in `ENDPOINTS` | user | **client only (gap, section 6)** |
| invite redeem (planned) | 10 per hour | hashed device id and IP | Edge Function |

The counters for `rate_hit()` live in `sync_rate_windows`, which clients may read but never write (security review M3). `packages/api/test/standards.test.ts` reads the newest definition of every RPC in `supabase/migrations` and fails when `ENDPOINTS` claims a server limit the SQL does not enforce, when a `rate_hit` bucket's numbers differ, when an `idempotency_key` endpoint does not call `idempotency_claim`, when an `SC***` code has no rule, or when the app calls an RPC that is not in `ENDPOINTS`.

Hashed IPs use a daily rotating salt and are never stored raw (TDD 02 2.7, LEGAL-REQ-058).

## 5. Region, timeouts and the rest

- **Region:** one Supabase project in us-west-1, near US users (TDD 02 6.1, DATA-REQ-005). No multi-region before 50k families (TDD 02 1). Pack files and public documents are served from the CDN edge closest to the phone.
- **Timeouts:** per class (2); the client aborts with `AbortController`; server functions stop work at 120 s inside the platform's wall clock (TDD 02 4.2).
- **Payload caps:** per TDD 02 4 (`uploadData` 256 KB, photos 10 MB, error bodies under 1 KB).
- **Versioning:**
  - Our routes carry a major in the path (`/functions/v1/config/v1/...`); documents carry `schemaVersion`.
  - Within a major, changes are additive only; clients ignore unknown fields and skip unknown entries (manifest entries, content blocks), and every config key has a fallback.
  - A breaking change ships as `/v2` while `/v1` keeps serving. The old route answers with `Deprecation` and `Sunset` headers (RFC 9745, RFC 8594) and is removed no earlier than 90 days after, and only when App Store Connect shows no supported version still calling it. `minSupportedVersion` in remote config shows a gentle update card first; it never blocks local use.
  - Database RPCs follow the same rule: a new signature is a new function; the old one stays until no supported app calls it (TDD 02 2.2 migration rules).
- **Contract tests:** `packages/api/test` checks every schema and the rules above; `vitest.consumers.config.ts` runs the app's pack and document clients, both Edge Functions and the publishing and size scripts against the same package in one run (`npm test -w @scribe/api`).

## 6. Gaps and requests

Closed on 2026-10-05 (migration 20261005000000, pending live apply):
- **Sync RPCs had no server-side rate limit.** `sync_push` and `sync_pull` now count through `rate_hit()`, and the counters are no longer writable by their owner.
- **Idempotency keys were not stored server side.** `idempotency_keys` (24 hours, trimmed hourly by `scribe-sync-housekeeping`) backs `create_child_invite` and `record_policy_act`.

Open:

| Gap | Owner | Ask |
|---|---|---|
| `sync_books`, `my_sync_gate` and `revoke_invite` have no server-side limit (`RATE_LIMIT_GAPS` in `standards.ts`). Each answers only for the caller, is cheap, and is called a few times per session | data owner | count them in `rate_hit()` (`sync_books` and `my_sync_gate` in `pull`, `revoke_invite` in `membership`), then set `enforcedBy: 'rpc'` |
| `create_child` has no daily limit; `delete_entry` and `restore_entry` have none (not called by the app directly) | db-fix (G-11) | as planned in the fix wave; `standards.test.ts` turns green when it lands |
| `peek_invite` (ask before joining) | db-fix (G-13) | returns the inviter's sign-off name only; counts in `membership` |
| The client reuses one idempotency key per action only after the auth fix (G-07) | auth-fix | `invites.ts` and `consent.ts` |
| The shared logger does not know the `config` and `content` functions | `_shared` owner | add both to `FUNCTIONS` in `_shared/log/log.ts` (they log as `unknown` until then) |
| Whether Supabase caches Edge Function responses at its edge | platform | measure `cf-cache-status`-style headers on the first deploy (U) |
| Signed documents had no same-version rule (security review L10, G-18) | platform | closed 2026-10-05: versions strictly increase for any change; a document whose version equals the accepted one is used only if its payload's canonical-JSON SHA-256 is identical (`decideDocumentVersion` in `integrity.ts`, used by `lib/remote/documents.ts` for config, manifest and content). ADR 0016's trust rule should say the same (coordinator). Freshness (`notAfter` for kill switches) is still open |

## Sources

- AWS Architecture Blog, Exponential Backoff and Jitter: https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/ (method; not opened this session)
- RFC 9745 (Deprecation header) and RFC 8594 (Sunset header): https://www.rfc-editor.org/rfc/rfc9745 , https://www.rfc-editor.org/rfc/rfc8594 (not opened this session; standard references)
- RFC 9110 section 13.1.2 (If-None-Match, weak comparison): https://www.rfc-editor.org/rfc/rfc9110 (not opened this session)
- Supabase Edge Function invocations and function configuration: see ADR 0016 sources (V).
