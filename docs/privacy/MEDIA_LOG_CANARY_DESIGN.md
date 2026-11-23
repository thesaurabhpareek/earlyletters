# Log canary design for media (BL-850; BL-862 builds it)

Owner: `privacy`. Builder: `qa` (BL-862) with `mobile`. Reviewers: `security-architect`, `analytics`.
Satisfies: NX-39-R30 and NX-39-R50 (design only). Also cited: LEGAL-REQ-014, DATA-REQ-004, PRIV-R10, CDO-10, SEC-ML-5.
Status: design, docs only. Nothing here was run. Read at `origin/develop` `1f9065188` (23 Nov 2026). This page builds no test, so it does not make `[NX-39-R30] a fake city, id and date never appear in any log, analytics event or crash report` pass; BL-862 does.

## 1. The rule being proved

A picture's date, a city, a coordinate and an id are L4 (`docs/legal/DATA_CLASSIFICATION.md`, and the data map rows in `docs/ops/proposed/bl-850-media-label-data-map-consent-acts.md` section 4). They never reach analytics, logs at any level, crash reports, breadcrumbs, push payloads, URLs, support prefill, sync payloads or deletion receipts (PRIV-R10, NX-39-R30, R33, R34, R50). "Never" is proved by a test that plants unique fake values and fails on any hit anywhere, not by a comment.

Gate (NX-39 section 3): the canary is running and green before P2b can switch on in `production`, and again, covering the background path, before P2c. It is not a follow-up to P1. P1 may ship its own narrower proof (the attach path only) and says so in its PR.

## 2. What exists today, and what this reuses

- `apps/mobile/e2e-web/support/log-canary.ts` (BL-415, with BL-1901 for phone numbers): a pure matcher, `findLeaks(lines, typed)`, with whole-word, any-case matching for the child name "Asha" and seeded letter fragments. Unit-tested in `apps/mobile/test/log-canary.test.ts`. It watches the web journey's console and page errors only. No media value is known to it.
- `packages/analytics/test/analytics.test.ts` (the `CANARIES` list and the PII-drop cases that use it, per PRIV-R10): Asha fixtures cannot reach the provider whatever the caller does.
- `apps/mobile/src/lib/resilience/global-errors.ts`: fault records hold kind, code, id and time only, the last 20 (test `test/global-errors.test.ts`).
- The `DATA_CLASSIFICATION.md` section 0 row "log canary not built" is still true for media.

Design choice: extend the one matcher rather than add a second. Media canary values join `findLeaks` as a new fixture set with their own label, so one failure format covers children's names, letter text, phone numbers and media. The harness in NX-39 section 16 is `scripts/guards/log-canary.test.mjs`, which is not yet created on `develop`; the pure rules belong beside `log-canary.ts` so the existing unit test style carries over. Where they live is BL-862's call; this page asks only for one matcher.

## 3. The canary values

Fictional only. The family is "Asha" (CLAUDE.md). No real city, date, coordinate or id from any person's phone is ever used, including the founder's.

Each run generates its values from a fresh random nonce, so a value from an earlier run cannot match by luck and a leak cannot hide behind an earlier fixture. The nonce is printed in a failure; the values are fake and printing them is safe.

| Canary | Shape | Why this shape |
|---|---|---|
| City | A made-up name with a nonce, for example `Quillhaven-7f3a`, registered as an extra entry in the bundled city table for the test run only, with its own city key | The real pipeline reduces coordinates to a key from the bundled table (NX-39-R6, R7). The test needs the same reduction to run, without ever using a real place |
| Coordinates | A latitude and longitude near the fake city, with distinctive decimals, in the fixture file's own form | The coordinate must pass through the same read-and-reduce code a real file would |
| Capture instant | A far-future date and an odd time of day, for example 2039-07-19 at 03:17:41 in a fixed offset | No real photo or recording has it, and no scheduled job or build stamp will produce it by accident |
| Asset id | A random 128-bit hex string in the form PhotoKit ids take, plus the opaque media key the app makes | R41 says the media key is never derived from the asset id, so the two must be unrelated, and both are scanned |
| Parent-typed text | A place typed by the parent and a picture caption (`place`, `photo_text`), both with the nonce | These are L4 columns in `entry_media` already; they must stay out too |
| Child name | `Asha`, as in `CHILD_NAME` | Reuses the existing rule |

### 3.1 Forms the matcher must catch

A leak is rarely the plain string. For every value the matcher builds the set of forms below from the generated value and checks each against each sink. A hit on any form is a leak.

- Plain, lower case, upper case, and with the whitespace of a wrapped line collapsed (as `log-canary.ts` does for letter text).
- URL-encoded and double-encoded; JSON-escaped; inside a query string or a path segment.
- Base64 and hex of the value.
- Dates: ISO, the day key (`YYYY-MM-DD`), a locale long form, a numeric `m/d/y` and `d/m/y`, and epoch seconds and milliseconds.
- Coordinates: the full decimal, truncated to 4, 3 and 2 decimals, and degrees-minutes-seconds. A coordinate truncated to a city-sized cell is still a leak of where.
- A hash of the asset id or the city key (sha256, sha1 and md5 of the value, computed in the test). NX-39-R26 forbids "a hash of" an asset id in a notification, and a hash of a short value can be guessed back.
- The city key as well as the city name. The key alone is already a derived place.

Not matched, to avoid false alarms: the nonce-free words "city" or "date" as such; a public bundled table entry that is not a canary.

No allow-list. A canary hit is a failure in every state. There is no "expected error line" that may hold one (same rule as BL-415).

## 4. Where the canary is looked for (the sinks)

Each sink is a function or object the test can read after the journey. Each has a positive control (section 6).

| # | Sink | How it is read | Rule it proves |
|---|---|---|---|
| S1 | Every `console` level, and uncaught page or JS errors | Capture, as `log-canary.ts` already does for web; on the phone side, a test logger that replaces the app's log function | NX-39-R30, PRIV-R10 |
| S2 | Fault records (`global-errors.ts`) and any error object passed to it | Read the stored records after a forced error | R30, R50 |
| S3 | Breadcrumbs and the crash payload | The Sentry adapter is not wired yet (PRIV-R05, PDATA-06). Test against the adapter's input shape now, with a fake transport, so the test is ready when the SDK lands | R30 |
| S4 | The analytics queue and the provider call | A fake provider, as in `analytics.test.ts`. Run with consent on, so the allowlist is the only thing between the canary and the wire | R34, PRIV-R11 |
| S5 | Every outbound request: URL, query, headers, body | A fake network. Includes sync, the outbox, the packs and remote-config fetches, and the place lookup (which must make 0 calls: NX-39-R7) | R33, R7 |
| S6 | Sync payloads and the `packages/api` schemas | Serialise the outbox after a letter with media syncs; the keys library, local_id, asset, place, geohash, moment, occasion, taken_at and media must not appear (NX-39-R33) | R33 |
| S7 | Local notification requests (title, body, subtitle, `userInfo`, attachments, `threadIdentifier`) | A fake scheduler. Body is a fixed content key; `userInfo` holds only a random id (R26) | R26, R27 |
| S8 | Support prefill and share text (`mailto` body, share-sheet text) | Build each with a media-bearing state | PRIV-R10 |
| S9 | The parent's export ZIP and the deletion receipt | Read the bytes. A city appears only for an item the parent kept and only with "Include places" on. The index and the decisions are not exported (R32). A receipt holds none | R32, DATA-REQ-004 |
| S9b | The recovery export ZIP (`lib/resilience/recovery-export.logic.ts`, `recovery-export.ts`) | Build the ZIP from a store holding the canary items, then read every entry. This ZIP packs the recordings and the `scribe.db` files as they sit, with no "Include places" gate, so the S9 rule does not apply to it and a canary built to S9 alone would fail on it or miss it. Rule to assert, matching `DATA_CLASSIFICATION.md` 4.6 and the proposed rows: the kept capture day and kept city name (and the parent-typed `place` and `photo_text`) may appear, only inside the database entry, as the stored column text and nowhere else; a canary value in a file name, a path inside the ZIP, a manifest or any entry other than the database files is a leak; no picture file is packed; the moments index file and the decisions file are not in it; the Find index may hold neither the capture day nor the city name (S13). A capture day or city the parent cleared must not appear at all | R32, DATA-REQ-004, PRIV-R10 |
| S13 | The Find index (`letter_search`, `letter_search_rows`, the `searchable_letters` view) | Query and dump the index after every step that sets a capture day or city. The index holds the words, the label, the typed photo words and the typed place as today, and never the capture day or the captured city name (NX-39-R10). Also covered by S11 on erase: Find is dropped at launch with Find off and by Erase everything | R10, R31 |
| S14 | The on-phone backup queue and state file (`lib/backup/local-store.ts`, `token-vault.ts`; the state file `backup-<profile id>.db` in `DATA_CLASSIFICATION.md` 4.6) | At rest, after a run with the backup capability on and the canary items present. Opened only with `EXPO_PUBLIC_BACKUP` on (`lib/backup/gate.ts`), so low risk today and media is not backed up; the wire side is S5. Expect no canary value | R30, R33 |
| S10 | The native error that crosses the bridge | A fake native module throws an error whose message holds every canary; the adapter must pass on a closed enum code only (NX-39-R50) | R50 |
| S11 | Files left on disk after erase | A file-tree diff after Erase everything: no copy, field, index, sidecar (`-wal`, `-shm`), cursor, look log or decision remains (R31) | R31 |
| S12 | URLs and deep-link paths the app opens or builds | Route builders called with media-bearing state | PRIV-R10 |

Where a canary is allowed to be: the local store (`entry_media` date and city fields for a kept item), the screens that show them, the parent's own export under its rules, and the recovery export's database entry under the S9b rule. The Find index is not on this list for the capture day or the city name. The test asserts the canary is present there too (section 6, positive control), so a silent no-op cannot pass.

## 5. The journey the harness runs

One fixture library, run once per phase switch that is on in the build under test. The fixture library is a stand-in for the media adapter's closed list of fields (NX-39-R9(b)): opaque id, capture instant, media kind, duration, pixel size, city key. Thirty extra fields are added to the stand-in and none may survive the adapter (R9 test), so the canary also rides on those.

Steps, in the order of the R30 text:

1. Scan: the fake library holds the canary items across 3 days and two cities (one canary, one ordinary) so a multi-city day is covered.
2. Index (P2b on): build moments; run the catch-up on open; run it again after a rule version change and after a rebuild.
3. Attach: a picked file with the canary date and coordinates is attached to a letter; the parent keeps the city; the parent clears the date on a second item.
4. Hide and snooze: hide a day, hide a stretch, snooze a card; hide one unattached photo in the open chooser session (held in memory only, R41).
5. Permission changes: narrow Limited, revoke, restore from a backup, re-grant. The index must be wiped and nothing logged with an id, date or place (R42).
6. Export: an export with "Include places" off, then on.
7. Erase: Erase everything, then Delete account. An interrupted erase is resumed after a simulated kill (R31).
8. Forced errors: make the library, the picker, the decoder, the scheduler, the disk and the network each throw, with the canary in the native message.
9. P2c only: run the background entry point directly with a fake clock; once with permission, once with none, once locked, once killed mid-run. The run has no `fetch`, Supabase client, analytics import, breadcrumb call or push-token import (R46); the canary also proves the run logs nothing.
10. P4a only: schedule an occasion reminder with the library in a canary state. The notification builder takes no library input (R27), so the reminder must hold none.

After each step, and again at the end, every sink in section 4 is scanned for every form in section 3.1.

## 6. Positive controls (the harness has teeth)

A canary that cannot fail proves nothing. Mirroring the AST scanner's rule (NX-39-R9(c)):

- For each sink S1 to S14, a test writes a canary value into that sink on purpose, in at least two encodings, and asserts the matcher reports it with the sink's label.
- A test removes the media adapter's field filter (a stand-in that passes thirty extra fields) and asserts the run fails.
- A test removes the closed-code mapping at the bridge (S10) and asserts the run fails.
- A test with the matcher's value list emptied asserts the run fails as "no canary loaded", not as a pass.
- A test asserts the canary values appear where they should (the local store, the screens, the allowed export), so a run that never reached the pipeline cannot pass.

## 7. Failure output

A failure names the sink, the form that matched, the journey step, the nonce, and the first 80 characters of the line around the match with the matched span replaced by its label (`canary:city`, `canary:coord`, `canary:date`, `canary:asset-id`, `canary:text`). The value is fake, but the habit is that a leak report never repeats a value. The build fails. There is no retry and no skip flag, the same as `verifyEdits`.

## 8. What this does not cover (said plainly)

- The dev-only performance ring (`lib/perf/markers.ts`): a closed list of event names and one number each, in memory, and `mark` does nothing unless `EXPO_PUBLIC_PERF` is "on". It cannot hold a media value by construction, so it is out of scope and not scanned.
- Anything outside the JavaScript runtime. The native modules log through the system. A canary in native error text proves the bridge keeps it from JavaScript; it does not read `os_log`. The device row for that is D-11 in `docs/security/MEDIA_THREAT_MODEL.md` (force each photo failure, read the fault records and the device console). It is run by a person with a phone and Asha fixtures.
- Apple's own crash reports, which reach the developer through App Store Connect under the user's Apple setting, and any system log the phone keeps. We cannot scan them, and the label doc already says they are Apple's collection.
- The iPhone backup and the picker's out-of-process view (threat model PK-6, D-20).
- A dependency's native code. NX-39-R52 and `docs/security/NATIVE_MODULE_GATE.md` cover that.
- Any claim about timing or frequency: this proves content-freeness, not that a read happened.

## 9. Hand-offs

- `qa` builds it (BL-862), with `mobile` for the fake library, the fake native module and the test logger. Titles to make pass: `[NX-39-R30] a fake city, id and date never appear in any log, analytics event or crash report` and `[NX-39-R50] native errors cross the bridge as closed codes`.
- `analytics`: S4 with consent on; confirm the three allowed events' properties carry no canary shape.
- `security-architect`: review the sink list and the positive controls; the CODEOWNERS line for the scanner's allowlist (NX-39-R9(d)) is theirs.
- `privacy` (this role): after BL-862 merges, mark R30 built in the data map and the claims register, and keep this page in step with the sink list. Until then the `DATA_CLASSIFICATION.md` section 0 line stays "log canary not built".
- Open and not decided here: whether the matcher lives with the web e2e support file or in `scripts/guards/`; whether the P1 narrower proof is accepted for the P1 gate. Both are for `qa` and Karma.
