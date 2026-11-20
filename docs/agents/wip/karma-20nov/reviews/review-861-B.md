## Review B at 36639f8e6e2d139f28472f09abad4e3df82f2a91: PASS WITH NOTES
<!-- agent:security-architect -->

Lens B: identity and security (chapters 05 IAM, 06 SEC). File: `docs/tdd/new-scope/08-keeping.md` (302 lines). Head committed 05:48:28 UTC, read again live at 11:10 UTC (unchanged). CI on the head: complete. Nine checks pass. One duplicate `compliance-fence` run was cancelled, and its sibling run passed.

Must fix: none.

## What I checked
Facts. I sampled 25 cites on `develop` `20553b18`. 24 hold. One points to a superseded file (finding 3).

Hold:
- First run and consent: `gate.logic.ts:110, 123-125, 129, 183-199`; `consent.ts:117` and `client.ts:147-148` (a new UUIDv7 per call).
- Deletion: `request_account_deletion` checks only `require_user()` (`20261005000000:408-456`; no later definition).
- Sign-out: `session-provider.tsx:293-307` (local scope), `:529-534`; `auth-store.ts:188-194` (sync ops only).
- Account layer and ownership: `_layout.tsx:243`; `ownership.ts:49`, `:106-117`.
- Backup client and gates: `package.json:96` (`scribe-keys` excluded); `contract.ts:19-21`; `queue.ts:20-23`; `remote-config.ts:57-75`; `capabilities.ts:241-246`; `eas.json` lines 16, 34, 48, 62 and 78 (all off); `backup-gate.test.ts:56`; `preflight-production.mjs:178-188`; `preflight-testflight.mjs:172-179` (warns only); `capabilities.test.ts:243`.
- Versions: `scribe_core.sql:271-272`; `explicit_grants.sql:49-51`.

Boundaries:
- No founder or counsel question is decided. OQ-1 to OQ-5 and the NS-12 gates go to the founder or counsel with defaults.
- NS-08 4.4 keeps the X2 reads (mine and counsel's) before any flip work, plus a read of any entitlement or plist change for `scribe-keys`.
- NS-12 restore is an ordinary words upsert that never runs the engine or `verifyEdits`, so it adds no meaning. `raw_transcript` is untouched.
- Deletion is never gated on consent (NS-10-R4a; PRIV-R09).

Lens:
- NS-10 account layer (R3, R5): `bookVisibleTo` and the cover.
- Consent idempotency (R7, 3.2).
- NS-08 readiness: R5, R6, the R1 notes, and the flip list.
- NS-09 security: `held.discard` carries an id only; the op is never sent under another account (`ownership.ts:49`); the owner is kept while ops wait.

## Findings (most serious first)
1. NS-10-R3 design against CR-67 AX-12. Section 3.2 designs only the screen cover. CR-67 rules both halves: the cover plus one `bookVisibleTo` check in the `lib/store` reads, the Find catch-up and the reminder planner. This file's own R3 test row ("no list returns A's rows to B", 3.5) already needs the data half, so the design and its test disagree. CR-67 wins until the next touch. When it is touched, add three things to BL-961:
   - the store-read check;
   - cancel every scheduled notification when the layer goes up, because a planner check alone leaves A's reminders, with the child's name, firing for B (NS-10-R3, NS-32-R12);
   - `accessibilityViewIsModal` on the cover, as `app-lock-layer.tsx:80` does. Screens under a cover stay mounted (`_layout.tsx:241-242`), so VoiceOver could otherwise read A's letters.
2. Consent idempotency (R7). The design works: the server replays on a repeated key, and its fingerprint leaves out client time, so one key per (step, answer) gives one row. Two details:
   - State what happens across a relaunch. A key held per mount gives a second row after a kill. Either persist the key until the answer is recorded, or record that a second row is a second act.
   - `client.ts:144` still says the SQL "does not read it yet", which is stale. The PR that takes the key as an argument should fix the comment.
3. The cites for the server half of R7 point at the dropped definition. `record_policy_act` was redefined in `20261108000000_consent_record_fields.sql` (fingerprint `:153-156`, claim `:158`). The behaviour is the same, but the cite should move.
4. NS-11 (section 5): "X2 is not triggered because we send nothing". Export 1.7.0 carries `photos/` (BL-933), and the frame's X2 covers a child's picture (`00-product-frame.md:85`). The file leaves the call to my review, which is correct. My read is owed: either it is the same act as Export, or it needs counsel's read. This file need not change.
5. `bookVisibleTo` treats "no session" as visible (D1). That matches the founder's ruling and the D1 sheet line. Record it as the accepted residual it is (A3: a phone left signed out shows the book).
6. NS-08 R6 test: the source pin ("`lib/auth/**` imports no erase function and calls no `File.delete`") is a good negative control. Run it against a mutant so it proves it can fail.
7. NS-12 3-point contract: the definer RPC needs the author check inside (`security.md` 3.7, K-12 here). OQ-DS4 (legal hold) agrees with `security.md` OQ-S7.
8. Format: ASCII, 302 lines, TDD 01 tags, no copied card text.

## Buildability
Wave 1 PRs (BL-922a/b, BL-961, BL-978a, P-6a, BL-925, BL-926, P-4a/b) each name an owner, two lenses, a size and an order. Every P0 row in 2.5 and 3.5 has a test design.

## Not verified
- Device rows U1 to U8.
- Whether production runs `20261016000000` with `app.held_sync` on (U3).
- What B's screens render on a phone (code reading only).

Reviewer: independent of the author (CR-44).
