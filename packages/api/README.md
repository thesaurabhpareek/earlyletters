# @scribe/api

Typed, versioned contracts shared by the app, the Edge Functions and the scripts (founder decision 17, ADR 0016, ADR 0017). Pure TypeScript; runs on Hermes, Node and Deno. Owner: S07 (platform). Other streams change it by request: send the contract shape in your PR's "Requests to other owners"; S07 checks it against the rules below and lands it.

The code is the source of truth. This file explains the rules; the numbers live in `src/standards.ts` and `src/envelope.ts`, and the tests fail when code and rules drift.

## Two entry points

| Import | Holds | Loaded in a build with `EXPO_PUBLIC_SERVER_FEATURES=off` |
|---|---|---|
| `@scribe/api` | Signed documents (`integrity.ts`, `canonical.ts`), pack manifest, remote config and kill switches, content blocks, the envelope and error codes, endpoint standards | Yes: everything an on-device build needs |
| `@scribe/api/server` | Contracts for features that need our server (M14): `sync.ts`, `family.ts`, `subscription-status.ts`, `recovery-key.ts`, `push.ts` | Never |

`test/server-features-off.test.ts` fails if the root re-exports a server contract, if anything the root imports reaches `src/server`, if the app's boot path (`_layout.tsx`, `lib/capabilities.ts`, `lib/remote/**`) imports `@scribe/api/server`, or if app code makes a value import of it outside the gated list in that test. App code may `import type` from it anywhere; a value import goes in a module that runs only behind `capabilities.*`, and the PR adds that file to the list with its gate.

**Leaf modules.** Edge Functions import some files directly from Deno (`../../../packages/api/src/...`, deployed with `--use-api`), so these stay leaf modules (no relative imports, no package import except `valibot`): `envelope.ts`, `standards.ts`, `kill-switches.ts`, `server/family.ts`, `server/subscription-status.ts`, `server/recovery-key.ts`.

## Contracts (15 Oct 2026)

| File | Contract | Version | Built where | Waiting on |
|---|---|---|---|---|
| `src/server/sync.ts` | Sync wire contract: push ops, field groups, results, pull books, digest, `gone`, `reset`, held drafts | `SYNC_API_VERSION` 1 | SQL `sync_push`, `sync_pull`: v1.0 columns (20261015030000, PR #140); words compare and set, `held_drafts` and the `held.*` ops, `entry.erase`, the review mark (20261016000000, PR #208) | S02: `p_api_version` and `SCVER`, prefs `hidden` and `quiet` |
| `src/server/family.ts` | Invite create (v0 and device-made), peek, accept by link, redeem by code, revoke, leave, remove, undo, member list, SCINV details, `inviteErrorKindFor` | `FAMILY_CONTRACT_VERSION` 1 | SQL (20261005000000; PR #140); `supabase/functions/invite-redeem` | S02: `peek_invite_by_code`, SCINV details, the redeem gate RPCs |
| `src/server/subscription-status.ts` | D-080 status report, D-081 consent facts, salt, signed-out queue merge, `sub_ref` reference | `STATUS_REPORT_SCHEMA_VERSION` 1 | `supabase/functions/subscription-status` (shell) | S06: tables and the two RPCs (WP-F14-15b) |
| `src/server/recovery-key.ts`, `src/server/escrow-keys.ts` | Sealed boxes and HPKE labels, device keys, stored wraps, uploads, restore requests, release, approvals, step-up, holds, limits, Stop link, unwrap log row and notice; escrow public keys from the build | `RECOVERY_CONTRACT_VERSION` 1 | S05's PR #151 (migration and the `escrow` function), followed name for name | the ceremony keys (WP-F08-B8); S05: `reauth_required` as 403 |
| `src/server/push.ts` | Push kinds and payloads | 1 | nothing yet | WP-F11-09a spike, push ADR, WP-F11-09s and -09f |
| `src/remote-config.ts`, `src/kill-switches.ts` | Remote config v1 with eight kill switches; the 7-day staleness rule | `REMOTE_CONFIG_SCHEMA_VERSION` 1 | `lib/remote`, `scripts/packs`, `config` function | consumers per F19 WP-F19-12 (S01, S03, S04, S05, S06) |

## Standards every endpoint follows (ADR 0017)

**Classes and budgets.** Each endpoint in `ENDPOINTS` has a class from `ENDPOINT_CLASSES` (p95 at the client, timeout, attempts, backoff with full jitter). `escrow` and `object_transfer` are proposed ADR 0017 deltas (R2 AR-15), marked [E] until measured.

**Auth.** `public` (documents only), `user_jwt` (the caller's Supabase JWT; RLS or an in-function check decides), or `server_only` (cron and webhooks with their own secret, listed in `SERVER_ENDPOINTS`, never in `ENDPOINTS`). The app never holds a service key. Functions check the session against Supabase Auth and refuse anonymous sessions. A function that can act for the caller forwards the caller's JWT and uses no service key (`subscription-status`); only a function that must stop the caller from reaching an RPC directly holds the service key (`invite-redeem`, because codes must be throttled where the caller cannot reset the count).

**Envelope.** JSON endpoints answer `{ ok: true, data, requestId }` or `{ ok: false, error: { code, retryable, sqlstate?, detail? }, requestId }`. `cache-control: no-store` on every JSON answer. Signed public documents are served bare (byte for byte, cacheable) with the envelope for errors only. An error never carries a message, row, path, id or user text.

**Error codes are versioned.** `API_ERROR_CODES` is append-only; `ERROR_CODE_SINCE` records the version that added each code (`API_ERROR_CODES_VERSION` 2 added `parents_full`, `paused`, `idempotency_conflict`, `reauth_required`). An older client reads an unknown code as `internal` and treats it as permanent, so a newer server never makes it loop. Removing or renaming a code is a breaking change and needs a new route major. `detail` is one value from the closed `ERROR_DETAILS` list (SCINV reasons, missing consents, escrow reasons, kill-switch names); anything else is dropped. SQLSTATEs map to codes and actions in `SQLSTATE_RULES`; `test/contract-drift.test.ts` fails when a migration raises an `SC***` code the contract does not know, or the contract keeps one no migration raises (unless listed as planned).

| Action | When | Client does |
|---|---|---|
| `retry` | network, 408, 429, 5xx, `paused`, transient SQLSTATE classes | back off with full jitter; a `Retry-After` in seconds wins, capped; keep queue order |
| `reauth` | 401, 28000 | refresh the session once |
| `pause_for_consent` | SCCON | keep the op, pause the queue, ask for consent |
| `tell_user` | SCRAT, SCINV, SCCAP, SCVER | say it in plain words; no automatic retry |
| `reject` | everything permanent or unknown | move to `rejected_writes`, keep content on the phone, continue |

**Idempotency (`IDEMPOTENCY`).**
- Inserts use the device-made UUIDv7 as the natural key (DATA-REQ-044).
- Every other mutation sends `idempotency-key: <uuid>` (v7 from the phone, lowercase).
- The server keeps (person, function, key, argument hash, result) for 24 hours. A repeat with the same key and the same arguments answers the stored result with no second effect.
- The same key with other arguments is `idempotency_conflict` (422; SQL raises 22023 as built). A malformed key is `bad_request`; where the endpoint requires a key (`idempotency: 'idempotency_key'`), a missing one is `bad_request` too.
- Reuse a key only to retry a call whose answer never arrived. Edge Functions forward the header to PostgREST, where `idempotency_claim()` reads it.

**Rate limits.** Every endpoint names its limit, its subject (`user`, `ip_hash`, `device_hash`, `global`) and where it is enforced (`cdn`, `rpc`, `edge_function`, `supabase_auth`; `client` marks a gap). Hashed subjects are HMAC-SHA256 with a function secret over `<kind>:<UTC day>:<value>`, so they rotate daily and are never stored raw (`_shared/http/http.ts subjectHashes`: the first hash is under today's key; in the first hour of a UTC day yesterday's follows, and the SQL counts over the whole array). A refusal is 429 `rate_limited` with `Retry-After` in seconds. Some RPCs count against one SQL bucket together, and the row's `rateLimit.bucket` says so: `peek_invite`, `accept_child_invite`, `leave_child`, `remove_child_member` and `undo_parent_join` share `membership`, 120 an hour per person for the five combined, not 120 each; `sync_pull` and `sync_books` share `pull`, 120 a minute combined. `invite-redeem` counts failures, not attempts: 10 per person, 10 per device and 30 per client IP per rolling hour, and 1,000 per hour across the service, after which every code answers `rate_limited` with detail `codes_paused` while links keep working (F11-REQ-007). The gate, the lookup and the count are one SQL transaction (`invite_redeem_by_code`) with the counter rows locked, so parallel guesses cannot all pass the gate and no wrong guess is answered uncounted. The client IP comes from exactly one header, named by the `CLIENT_IP_HEADER` secret after checking on staging which one the platform sets and overwrites; `x-forwarded-for` and every other header are never read. IPv6 counts by /64. Without a trusted address the IP limit is skipped (logged as `no_address`) rather than shared. A person the database just called limited is answered from memory for a minute, so a limited caller costs no database round trip. Subject keys rotate at midnight UTC and the first hour of a day also counts yesterday's hashes, so the rolling hour never restarts.

**Request ids.** The client sends `x-request-id` (12 lowercase hex, random). The server echoes a valid one or makes one, in the header and in the body. Support correlates by request id, never by person.

**Logs.** One content-free line per request through `supabase/functions/_shared/log/log.ts` (closed events and codes, status, SQLSTATE, durations, counts, `req_id`; no ids, paths, text, codes, tokens or bodies). Every function's tests push the Asha canary fixtures through success and failure paths.

**Versioning.** Our routes carry a major in the path (`/functions/v1/<fn>/v1/...`); documents carry `schemaVersion`; the sync RPCs take `p_api_version` and the server serves the current and previous version. Within a major, changes are additive: new fields are optional, clients ignore unknown fields, and every config key has a fallback. A breaking change ships as `/v2` while `/v1` keeps serving with `Deprecation` and `Sunset` headers for at least 90 days.

**Kill switches.** Eight keys in `KILL_SWITCH_KEYS`: `sync`, `invites`, `photos`, `packDownloads`, `serverContent`, `backupUploads`, `escrow`, `statusReport`. `true` stops only a server-dependent feature; nothing can stop recording, typing, saving, reading, playback or export, and nothing can turn a feature on (build flags in `apps/mobile/src/lib/capabilities.ts` decide what a build has). Two paths:
- Phones: the signed remote config (`scripts/packs/publish.ts config --kill <key>`). A config whose `generatedAt` is more than 7 days older than the newest server `Date` the phone has seen cannot clear a switch, though it may set one (`withFreshKillSwitches`, F19-REQ-008). A `Date` more than a day ahead of both the phone's clock and the newest signed `generatedAt` is ignored, so a forged header cannot freeze the switches. A switch kept on this way stays on until a fresh copy clears it, so after clearing a switch publish config again each week for 4 weeks (the script says so); a phone that first comes back later than that keeps the switch on until the next publish (open question in the PR: a standing weekly re-sign). The app reads seven of the eight: `sync` (the sync engine and the pending invites list), `packDownloads`, `serverContent`, `statusReport` (`lib/billing/status-report.app.ts`), `backupUploads` and `escrow` (`lib/backup/runtime.ts`), the last three through `mayRun` in `lib/capabilities.ts`, and, since #243, `invites` (`apps/mobile/src/lib/family/invites-switch.ts`): while it is on, creating an invite, Share again, the look before joining (peek) and joining (accept) send nothing; Cancel invite is never paused. `photos` has no reader yet (photos are not in v1.0).
- Server: `invite-redeem` and `subscription-status` read the `KILL_SWITCHES` function secret (same names, comma separated) and answer 503 `paused` with detail `<key>` and `Retry-After: 300` before reading anything else. For `invites` that is code redemption only: `create_child_invite`, `peek_invite` and `accept_child_invite` are PostgREST RPCs with no server-side stop until S02 adds SCKIL with detail `invites` (request 4), so a build that does not read the switch (one from before #243) or a direct caller is not stopped by it. `statusReport` also stops the SQL through the database setting `app.status_report_enabled` (SCKIL unless `on`, S06), so direct PostgREST callers stop too. Backup uses the database setting `app.backup_enabled` (SCBKO); escrow uses `app.escrow_enabled` and the escrow project's own `ESCROW_SWITCH` secret. The publish script prints every line to run.

Every server-feature endpoint names its `capability` (build flag) and its `killSwitch` (sign-in has no switch; `forceReauthEpoch` is its lever).

## Tests

`npm test -w @scribe/api` runs the contract tests (`test/`) and the consumers (`vitest.consumers.config.ts`: the app's document and pack clients, the `config` and `content` functions, the publishing scripts). The Deno tests for every function run in `npm run test:functions`.
