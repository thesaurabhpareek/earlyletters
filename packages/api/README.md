# @scribe/api

The single typed, versioned contract between the app and the database
(founder decision 17 in `docs/agents/BRIEF-2026-10-03.md`): client and server
cannot drift because a test compares this package with `supabase/migrations`.

Pure TypeScript. No React Native, no `node:` imports in `src`, no runtime
dependencies (inject your own Supabase client).

| File | What |
|---|---|
| `src/version.ts` | `API_CONTRACT_VERSION` and the bump rules |
| `src/errors.ts` | Every SQLSTATE the client can see: meaning, category, retryable, upload-queue disposition, copy key |
| `src/rpc.ts` | Every function `authenticated` may execute: typed request and response, idempotency, errors; `callRpc` |
| `src/rows.ts` | Row types of every table and view a signed-in client can read, plus insert and update shapes |
| `src/enums.ts` | Value sets from the CHECK constraints |
| `test/drift.test.ts` | Parses the migrations and fails on any difference |

The contract describes the schema **after PR #32** (`fix/db-pending-hardening`):
no entitlement objects and no `SCPLS`.

## Version rules

`API_CONTRACT_VERSION` is semver, judged by what an already-shipped build sees:

- **Major**: removing or renaming an RPC, parameter, column or error code;
  changing a type, a signature, or an error's retry or sync meaning; making a
  parameter required.
- **Minor**: a new RPC, optional parameter, column, view, error code or enum
  value. Clients treat unknown codes and enum values as unexpected, never as a crash.
- **Patch**: no wire change.

A migration that changes anything client-visible updates this package in the
same pull request and bumps the version.

## Calling an RPC

```ts
import { callRpc } from '@scribe/api';

const r = await callRpc(supabase, 'create_child', { p_id: uuidv7(), p_name: 'Asha', p_due_date: '2027-03-01' });
if (!r.ok) {
  // r.error.spec?.sync is 'retry' | 'pause' | 'reject'; r.error.spec?.copyKey names the message.
}
```

The injected client only needs `rpc(fn, args)` returning `{ data, error }`.
Configure it to sign with the user's JWT and to send a request id header.

## Adding an RPC

1. Write the migration: `create function`, then `revoke ... from public, anon`
   and `grant execute ... to authenticated`. Start the body with `require_user()`.
2. Add it to `RpcContract` in `src/rpc.ts` (parameter names exactly as in SQL)
   and to `RPC_CATALOG` (SQL types, which have defaults, the `returns` clause,
   idempotency, consent gate, errors).
3. Any new SQLSTATE goes in `src/errors.ts`; new CHECK values in `src/enums.ts`;
   new readable columns in `src/rows.ts`.
4. Bump `API_CONTRACT_VERSION` (usually minor) and run `npm test -w @scribe/api`.

Commands that take a client-made id (UUIDv7) must validate it with
`is_valid_client_uuid7` and be idempotent for the same caller; the drift test
checks the validation for every RPC marked `client_id`.

## Running the drift test

`MIGRATIONS_DIR` points the test at any migrations folder (default:
`supabase/migrations` in this repo). Until #32 merges, the default run skips
the drift checks with an `EXPECTS #32` warning, because develop still creates
`store_subscriptions` and raises `SCPLS`. To run them against the #32 tree:

```bash
git fetch origin
mkdir -p /tmp/scribe-pr32
git archive origin/fix/db-pending-hardening supabase/migrations | tar -x -C /tmp/scribe-pr32
cd packages/api
MIGRATIONS_DIR=/tmp/scribe-pr32/supabase/migrations npx vitest run
```

Once #32 is merged the skip no longer triggers and the checks run in CI.
