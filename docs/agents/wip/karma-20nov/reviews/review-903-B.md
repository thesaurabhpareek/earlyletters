## Review B at 388dbf01be102af8c845f2bdff0b580a0d8b7f19: PASS WITH NOTES
<!-- agent:compliance-engineer -->

Lens B: privacy and compliance. PR #903, one consent key per answer (NS-10-R7). This is a re-review after my CHANGES at `e277e93f`.

Must fix: none.

## What I checked

- The fix commit `388dbf01`: `consent-key.logic.ts`, `consent.ts` (+6 -2) and the test (+53 -6), compared against `e277e93f`, and the whole branch against develop.
- My must-fix from `e277e93f`: after a lost Agree and then a decline, a later Agree replayed the stale first row. It is closed.
  - Answers are grouped by person and document (`consent.ts:112`).
  - Holding an answer drops every other hold in its group (`consent-key.logic.ts:33-38`), and so does a confirm (`:49`). A later different answer therefore ends the earlier hold.
  - The new test `consent-retry-one-key.test.ts:131`, inside the `[NS-10-R7]` describe block, drives that exact sequence on the stand-in server. It shows three rows (accept, decline, accept), three keys, and the last client time after the decline. CI ran it green.
- My note 2 is closed. A hold ends after 23 hours (`HOLD_MS`, `consent-key.logic.ts:29, 41`), before the server forgets the key at 24 hours (`20261005000000:165-194`). A late retry gets a new key and a fresh time, never a stale one. The unit test at `:205` pins both changes.
- My note 5 (legal) is now a "For legal" section in the body, worded as an engineering reading for counsel to confirm. Good.
- The consent record is now truthful in every order of answers I could build:
  - one row for a lost answer given again;
  - a separate, correctly timed row for each real change of mind;
  - no row for an under-18 answer;
  - and no reuse of a key across versions, steps or people.
  `accepted_at` stays the server's `now()` (PRIV-R21).
- Logs and analytics: the added lines have no log, analytics, crash or network call. The group and answer ids hold only ids and enums, in memory only.
- Cites: 20 sampled, 20 hold.
  - `consent.ts:110, 112, 113, 125, 128, 130`.
  - `consent-key.logic.ts:29, 33, 38, 41, 49`.
  - Test titles at `:80, 92, 107, 117, 131, 151, 160, 205`.
  - The migration ranges `20261005000000:165-194` and `20261108000000:152-158`. The fingerprint still has no client time.

## Findings, most serious first

1. Note. Terms and the age line share a group, because both record the `terms` document. A lost Terms Agree followed by the age answer drops the Terms hold, so a later Terms retry writes a second row. That row is a true act with its own time, so the record stays correct, only longer. The test at `:151` makes this deliberate. I accept it.
2. Note. If two answers in one group are in flight at once (the sheet and Turn on sync), confirming one drops the other's hold. If the other was lost, its retry is a new key and may add a duplicate row. The duplicate is true, and this is rare and harmless.
3. Note, carried over. Held answers for a person who signed out stay in memory until the app closes (a user id and enums). It is harmless. #904's session hook could clear them in a later touch.
4. Note, for the founder (in the body). The PR departs from the design (`08-keeping.md:123`): one key per answer in `lib/auth`, not one key per sheet mount. With the grouping the departure is sound.

## Not verified

- A real lost reply on a device, for example flight mode straight after Agree (a BL-948 row).
- I did not rerun the suite locally. I relied on CI, which runs the new sequence test.

CI at this head: `required` passed, and so did tests and content rules, typecheck, database rules, the Deno functions, the B-8 seam check and both `compliance-fence` runs. `store-profile Release launch` is still queued, as it is on every PR in this batch. The head commit is from 12:29 UTC, so it was more than 10 minutes old when I finalised.

Reviewer: independent of the author (CR-44).
