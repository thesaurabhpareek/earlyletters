Agent: mobile
Mode: task quiet books and consent key (Karma, 20 Nov), part of BL-978 (BL-978a in the keeping design)
Satisfies: NS-10-R7
Data classes touched: none new. The idempotency key (a random UUID) and the first tap's client time were already sent with every `record_policy_act` call. They are now held in memory for one answer until the server confirms it. Nothing is stored, logged or added to the request.

## What and why

`recordConsent` minted a new idempotency key on every call (`apps/mobile/src/lib/auth/consent.ts:117` on develop, `idempotencyKey()` at `lib/supabase/client.ts:147-148`). The server de-duplicates on that key (`supabase/migrations/20261005000000_family_cap_language_idempotency.sql:165-194`), so when the reply to Agree is lost and the parent taps again, the retry carries a new key and writes a second acceptance row. NS-10-R7 (P1) asks for one row. This is gap K11 in the keeping design.

This PR (client only, server untouched):
- New pure `lib/auth/consent-key.logic.ts`, `heldAnswers(mint)`. An answer holds one key and the client time of its first tap until `confirmed`.
- `recordConsent` names the answer by everything the server fingerprints that can differ between two taps: the person, document, version, answer, step and context (`consent.ts:110`). It sends the held key and the held client time (`consent.ts:111, 123, 126`) and releases the answer only when the server confirms (`consent.ts:128`). A lost answer (postgrest-js resolves `status: 0`, code '') keeps it, so the next tap is the same request and the server replays the first row.
- Answers are grouped by person and document (`consent.ts`, `group`). Holding or confirming one answer drops every other hold in its group. So when Agree is lost, then a decline is recorded, then the parent agrees again, the last Agree is its own act with its own key and its own (later) client time. This was review B's must-fix, reproduced as a test.
- A hold ends after 23 hours (`HOLD_MS`), before the server forgets the key at 24 hours, so a late retry never writes a row with a stale time (review B note 2).
- `recordConsent` takes the user id (`consent.ts:102`). Its two callers in `session-provider.tsx` pass `cur.userId` (`:496`, `:519`): the consent sheet and Turn on sync.

Key shape, checked against the server:
- The header is `idempotency-key` (`HEADER_IDEMPOTENCY_KEY`), which `request_idempotency_key()` reads (`20261005000000...sql:136-157`).
- The value is a UUIDv7, which matches the function's UUID pattern. Keys are scoped per profile (`on conflict (profile_id, idem_key)`).
- The fingerprint (`20261108000000_consent_record_fields.sql:152-158`) covers document, version, action, method, surface, app version, platform, locale, hash and context, but not client time. The card's row says "document, version and client time". Because the retry resends the first tap's client time, both readings hold, and no server change is needed.
- A new Terms version between the lost answer and the retry gets its own key, so the server's 22023 ("key reused for a different request") cannot trap the parent.

Design: `08-keeping` 3.2 R7 recommends that the sheet mint one key per (step, answer) when the step mounts. This PR holds the key in `lib/auth` per answer instead, keyed by person and version, for three reasons:
- it also covers Turn on sync, which records the same sensitive-data accept without the sheet;
- it covers a sheet closed with "Not now" after a lost answer and opened again from Settings > Account (a new mount, which under the design would mean a new key);
- it does not touch `app/(auth)/sign-in/consent.tsx`, which three open PRs edit (#740, #780, #830).

The key is held in memory only. After a relaunch the gate is read again, and it does not ask again for an answer the server already holds.

No new words.

## How it was checked

`apps/mobile/test/consent-retry-one-key.test.ts`. The parent is a fictional Asha-family profile id. A stand-in server does what `idempotency_claim` does: a key it has seen replays, and a new key writes a row.
- `[NS-10-R7] one acceptance row after a retry`, Terms: the answer is lost, Agree is tapped again, and the server holds one row; the retry has the same key and the same arguments. On develop this fails with 2 rows.
- Sensitive data: a lost Agree and a lost decline are one row each. On develop this fails with 2 rows.
- `[NS-10-R7]` lost Agree, then a decline, then Agree again: three rows in that order, three keys, and the last client time after the decline. The same with Terms (lost Terms, then age, then Terms). Both fail at e277e93f and pass from 388dbf01.
- Guards, which pass on develop too and still pass: once confirmed, the next answer is a new request; a new version, another step or another person never gets a held key; an under-18 answer is still never sent.
- Key shape: the header and UUID pattern are read from the migration, and the fingerprint is pinned to leave out client time.
- `heldAnswers` unit test.

On develop (`8343d119`) the retry cases fail; on this branch all 11 pass. `tsc --noEmit` shows the 5 known errors only, and `npm test -w packages/content` passes (395).

Run note, at 388dbf01: `tsc --noEmit` shows the 5 known errors only. The full apps/mobile suite (3 workers) is exactly the sandbox baseline: 8 files and 73 tests, all from the missing `expo-local-authentication` and `expo-clipboard`.

## What only a phone can prove

A real lost answer: a reply dropped after the server commits, for example by flight mode right after Agree. The stand-in reproduces the logic, not the network. A two-phone or flight-mode row belongs in BL-948 (`qa`).

## Way back

Revert this commit. Each call mints a new key again, and the duplicate row on retry comes back. Nothing stored changes.

## Globs touched

`apps/mobile/src/lib/auth/{consent.ts,consent-key.logic.ts,session-provider.tsx}`, `apps/mobile/test/consent-retry-one-key.test.ts`. `session-provider.tsx` is also edited by the BL-967 PR (fix/mobile-bl-967-sign-out-ends-reminders); the two merge cleanly (checked with `git merge-tree`). Old PRs #167 and #168 and the release snapshot #830 also touch it.

## For legal (review B note 5, an engineering reading)

When the first tap of an answer never reached the server, the row's `client_recorded_at` is that first tap's time, and `accepted_at` stays the server time. That matches PRIV-R21's "acts made offline", and it is worth a line in the consent-record notes.

## Founder, look first at

The departure from the design: the key lives in `lib/auth` per answer, not in the sheet per mount.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

https://claude.ai/code/session_01NBzZMdFrvcifyquTUAekLF
