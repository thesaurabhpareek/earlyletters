# ADR 0004: Sync engine — PowerSync (Cloud) with op-sqlite, writes through Supabase

Status: Accepted. Date: 2026-10-01.

> **Status note, 3 Oct 2026: proposed for amendment, not yet superseded.** `docs/DECISIONS.md` D-023 (PRD.md K-39) recommends an outbox push and cursor pull on expo-sqlite for v1.0 instead of PowerSync with op-sqlite, because the app already ships expo-sqlite, PowerSync cannot replicate the `book_entries` view (TDD 02 finding 3), PowerSync holds L4 data without a written no-training clause (TDD 05 OQ-L15), a database restore under PowerSync's normal resync could delete letters on every device (TDD 06 P-1), and one visibility predicate (`book_access`, D-024) is simpler than RLS plus Sync Streams (TDD 10 section 2). This ADR stays in force until the founder confirms D-023 (requested by 16 Oct 2026); BACKLOG BL-173 is `needs-decision` meanwhile. If confirmed, this ADR becomes "Superseded for v1.0 by D-023; revisit PowerSync at 10k families or when attachment sync outgrows the simple queue".

## Context
Offline-first: every read and write must hit a local SQLite DB; Supabase Postgres + RLS is the source of truth and already has 36 access tests. Audio and photos are files that need an offline upload queue. A hand-rolled sync is the most common way solo projects lose data.

## Options

| Option | Licence | Cost | RLS fit | Ops |
|---|---|---|---|---|
| **PowerSync** | Client SDKs Apache 2.0/MIT; service FSL, self-hostable Open Edition [S15] | Free: 2 GB sync/mo, 500 MB, pauses after a week idle; Pro from $49: 30 GB sync, 10 GB, 1,000 concurrent clients; $1/GB, $30 per extra 1k clients [S16] | Uses Supabase JWT; writes go via Supabase client so **RLS applies to writes**; reads via Sync Streams that must mirror RLS [S27] | Managed; built-in attachment queue for Supabase Storage [S29]; RN SDK uses `@op-engineering/op-sqlite` [S27] |
| ElectricSQL | Apache 2.0 [S45] | reads free; $1 per 1M writes; $0.10/GB-month; bills under $5 waived [S45] | read-path sync; write path is yours (writes guide page could not be opened; Unverified) | Need own write queue and attachments |
| Hand-rolled (expo-sqlite + `updated_at` pull + outbox push) | n/a | $0 | Uses RLS directly | All conflict, retry, ordering and file-queue bugs are ours |

## Decision
PowerSync Cloud (Free in dogfood, Pro at launch). Local DB is op-sqlite (required by the PowerSync RN SDK [S27]) — this replaces the planned expo-sqlite. Use PowerSync's attachment queue for encrypted audio and photos. Writes are applied by our `uploadData()` through supabase-js so RLS and the existing triggers (immutable raw transcript, versioning) remain the only authority.

Required: a CI parity test that, for fixture users, the Sync Streams return exactly the rows RLS allows.

## Consequences
- Less custom code for the riskiest part of the system.
- Two places define read visibility (RLS and Sync Streams); the parity test is mandatory.
- Exit path: self-host the Open Edition (FSL) [S15], or replace with a hand-rolled pull since the local schema mirrors Postgres.
- expo-sqlite's `useSQLCipher` [S30] is not available on this path; local encryption via op-sqlite SQLCipher is Unverified — check in Phase 0.

## Alternatives rejected
Electric (no managed write path or file queue). Hand-rolled (highest data-loss risk for a non-engineer).
