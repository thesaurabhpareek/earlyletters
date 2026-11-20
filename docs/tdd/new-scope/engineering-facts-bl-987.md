# BL-987: engineering facts the cards are waiting on

Status: answers for `product` to copy onto the cards as dated lines (BL-987 "Done when"). Written 20 Nov 2026 by `sync` (Claude Code session, task from Karma). Every `file:line` is on `develop` at `1400718b`. Nothing here was run against a hosted project or a phone. One answer (S3) was also run in a throwaway local test that is not committed; it says so.

The plan (#847, row BL-987) names no path for this file. It sits next to the new-scope designs. Each lane answers its own lines: `sync` answers S1 to S3 here, and the `data-architect` and `mobile` lines stay open for them.

## sync

### S1. What the server does today with a let-go held draft (NS-09, ruling D7)
Answered 20 Nov 2026 (code read; production not verified).
- The let-go is the `held.discard` push op. `sync_private.held_discard` locks the author's own held row and deletes it in the same request that acknowledges the op (`supabase/migrations/20261016000000_sync_v1_server.sql:771-788`).
- Two exceptions keep the row and answer `{ kept: true }`. The row is kept when its words changed after the base the phone sent, so a later edit on another phone wins over the let-go (`:782-783`, final review B-2). It is also kept when a legal hold covers it (`:782`, `sync_private.held_on_hold` at `:633`).
- A row that is missing, or not the caller's, answers `{ missing: true }`, so a retry does nothing (`:776-781`). Clients hold no delete grant, and a direct delete is refused with 42501 (`supabase/tests/sync_v1_server.test.mjs:324`).
- The delete trigger `held_drafts_note_gone` (`:538-570`, triggers `:572-575`) does three things:
  - writes `purge_ledger ('held_draft', id)`;
  - forgets the recording's backup while the book and the author exist (`backup_forget_entry`);
  - writes a `discarded` marker of ids and times, which the author's other phones read on their next pull.
- Tests: `sync_v1_server.test.mjs:339-350` (stale base kept, newest base removed, ledgered, marker served) and `:390-392` (legal hold kept).
- The phone sends held ops only after a pull shows that the server holds held drafts (`apps/mobile/src/lib/sync/outbox.ts:778`, `merge.ts:829`).
- NS-09-R14 says no row survives the acknowledgement, but the two exceptions above keep it, and the phone then shows the draft again as keepable (`merge.ts:584-596`). This is K2 in the 08-keeping design (#861), and the two exceptions go to different owners:
  - the later-edit exception (`:782-783`) is a product rule: Karma or the CPO role rules on it;
  - the legal-hold exception (`:782`, `sync_private.held_on_hold` at `:633`) is a legal duty, so `legal` and the founder rule on it, not product.
- Unverified (OQ-11 in #861): does production run this file with `app.held_sync` on? `.github/migrations-applied.txt` lists only `20260930000000` and `20261001000000`. No agent can read a hosted project, so the founder confirms it during the F4 re-run and P-7 (`data-and-sync` design, #860, section 6). Until then, treat the server half of NS-09-R7, R8 and R14 as tested only against the local database.

### S2. Does `sync_pull` serve rows while consent is outstanding? (NS-10)
Answered 20 Nov 2026 (code read).
- Yes. The only guard in `public.sync_pull` is `public.require_user()` (`20261016000000_sync_v1_server.sql:1302-1306`). That function checks a signed-in, non-anonymous session and nothing about Terms, age or sensitive-data consent (`20261003000000_security_and_family.sql:62-74`). No later migration redefines either function.
- So "nothing downloads while consent is outstanding" is a phone rule:
  - `syncAllowed()` is true only when `canSync` is (`apps/mobile/src/lib/auth/auth-store.ts:88`);
  - `canSync` is false unless the gate says sync is on (`machine.logic.ts:237-241`);
  - the engine stops when sync is not allowed (`sync/index.ts:204-205`);
  - the first-run gate relies on this (`first-run/gate.logic.ts:183-190`).
- What the pull serves: the caller's own letters, and also other members' letters in each book the caller belongs to, read through `book_entries` (`20261016000000_sync_v1_server.sql:1498, 1542, 1553, 1563`). So a session with consent outstanding can read other people's letters, not only its own.
- No server test pins this. Whether the server should gate reads on consent is gap G1 below. This file proposes no fix.

### S3. Does the pull parser tolerate an unknown response key? (NS-06 B10.1)
Answered 20 Nov 2026 (code read, and run in a throwaway local test).
- On the phone, yes. The engine casts the RPC answer without a schema (`apps/mobile/src/lib/sync/engine.ts:163`). The merge reads only the keys it names (`merge.ts:793-831`), and each `entries` insert names its columns (`merge.ts:489, 600, 683`). An unknown key at the top of the page, in a book or in a row is therefore never read.
- In the contract package, yes. `parsePullResponse` (`packages/api/src/server/sync.ts:925-928`) uses `v.object` for the page, books and rows (`:785, :666, :583`). In valibot 1.5.0, `object` copies only the keys it declares (`node_modules/valibot/dist/index.mjs:5655, 5668-5669`), so it drops an unknown key and the page still parses.
- Run 20 Nov 2026 in a vitest case that was deleted afterwards: a page with one unknown key at each of the three levels parsed `ok`, with those keys gone, and `applyPullPage` stored the letter.
- Gap: no committed test proves this for the pull. The push has one (`packages/api/test/server-contracts.test.ts:113`). Rec: `sync` adds `[NS-06-B10.1]` cases to `server-contracts.test.ts` and to a phone merge test in its next PR. This only covers new keys: a known key whose type changes is a different question.

## Gaps found while answering (no fix in this PR)
- G1, owner `security-architect`: the server does not gate reads on consent. `sync_pull` checks only `require_user()` (`:1306`), and that is enough to serve other members' letters through `book_entries` (`:1498, 1542, 1553, 1563`). Today the phone is the only control: it does not pull until `canSync` is true. A client that skips that check reads the book before Terms, age or sensitive-data consent. `security-architect` decides whether a server gate is needed. If it is, the gate is a `data-architect` migration and a contract change, because old app builds call `sync_pull` too.

## data-architect (open)
- D1. The B10.1 choice (default b): open. The `data-and-sync` design (#860, sections 0 and 5) proposes option (b) with eval A's four corrections and CK10. `data-architect` confirms it on the card.
- D2. Can `held_drafts` null a withheld take's words? (NS-17): open. What the code does today: once `raw_transcript` is set, it cannot change (`20261016000000_sync_v1_server.sql:506-507`, SCIMM), and `held_upsert` keeps the stored words when the incoming ones are empty (`:722`). #860 proposes S3 for it. `data-architect` answers.

## mobile (open)
- M1. Does expo-notifications set `hiddenPreviewsBodyPlaceholder`? (NS-13-R33): open, `mobile`.
- M2. Does Read together keep the screen awake? (NS-24-R9): open, `mobile`.
- M3. Is `Intl.Segmenter` available on Hermes? (BL-957): open, `mobile`.
