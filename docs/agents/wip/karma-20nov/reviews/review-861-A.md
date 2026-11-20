## Review A at 36639f8e6e2d139f28472f09abad4e3df82f2a91: PASS WITH NOTES
<!-- agent:principal-architect -->
Must fix: none.

Lens A (principal-architect): code shape, contracts, buildability. File `docs/tdd/new-scope/08-keeping.md`, 302 lines, ASCII only, TDD 01 tags, no card text copied.

## What I checked
- Facts: I sampled about 70 file:line cites against `develop` `d5d12178`. All but one hold. One is off by one: the Finish setup push is at `app/settings/account.tsx:227`, not `:226`. Examples that hold: `letItGo` returns false and keeps the row (`let-it-go.logic.ts:28-38`); `review.tsx:415` ignores the result; `held.discard` is queued in the mark's transaction (`store.ts:1274-1288`; `outbox.ts:547-559`); ownership refuses only sync (`ownership.ts:49`) while the gate opens the local book for any session (`gate.logic.ts:123-125`); `recordConsent` mints a key per call (`consent.ts:117`; `client.ts:147-148`); `scribe-keys` is excluded from autolinking (`package.json:96`); `entry_versions` has no client grant (`20261023060000:49-51`); `sync_v1_server.test.mjs` mentions `held.discard` 27 times.
- Card rows: the P0 rows of NS-09 (R1 to R4b, R7 to R12, R14, R15) and NS-10 (R0, R1, R3, R4a, R4b, R5, R6, R8, R10) each have a test design in 2.5 and 3.5. NS-08's wave 1 rows (R5, R6, R7) have a test. R1 to R4 and R9 are documents (BL-976).
- Boundaries: no founder or counsel question is decided. K2, K8, D1 and the NS-12 gates are left as Conflicts or OQs with defaults. No word is approved (keys PROPOSED, BL-925 and BL-965 wait for the founder). X2 stays at the NS-08 flip.
- Buildability, waves 1 and 2: 2.6 and 3.6 give the PRs in merge order, each with an owner, two lenses and a size under the limit. The R7 fix (one idempotency key per step and answer) keeps API-R06 and API-R07 with no server change. That is the right contract call.

## Findings (none blocks)
1. CR-67 AX-12, `[X4-R1]`. CR-67 rules both halves: a screen cover beside `AppLockLayer` and one `bookVisibleTo` check in the store reads, the Find catch-up and the reminder planner. Section 3.2 designs the cover only. A cover does not stop a scheduled reminder naming A's child, and the 3.5 test for R3 and R5 ("no list returns A's rows to B") needs the data half. BL-961 (PR 3) should carry both. `11-foundations.md` 6.1 names the same function `scopeOf` (eval B s2.8): use one name.
2. CR-67 AX-10: the founder decides whether NS-12 versions are exported. Section 6 says "until `data-architect` and `privacy` decide". CR-67 wins; the default (not exported) is unchanged.
3. NS-12 contract: the remove op "sent only once the server advertises it" matches CR-67 D1 (`caps`). The existing mechanism is held ops waiting on the pull's `held` section (`outbox.ts:772-779`). Say that the new op waits on `caps`, so the generalised mechanism is built once.
4. NS-11: the Low Power Mode read ("`expo-battery` (MIT) is the standard candidate", U6) and `11-foundations.md` 7 (a read in eval B's new `scribe-system` module) differ. That is one read, two designs. Pick one; a new native module needs the line on why nothing installed fits (brief rules).

## CI
All checks green at the head. The head was older than 10 minutes when I finalised.

## Not verified
- U1 to U8 as the file lists them; nothing on a phone.
- Whether production runs `20261016000000` with `app.held_sync` on (U3).

Reviewer: independent of the author (CR-44).
