# Test plan B13, file 07: security, privacy, compliance, legal, support, finance

Owner agent: `security-architect` (test-plan author, docs only). Date: 20 Nov 2026. Base: develop `3e16f6a2` (worktree branch `docs/test-plan-build-13`).

Sources read: `docs/product/prd/14-test-plan.md` (priorities, levels, journeys, gates G0 to G6, P0 register); `docs/engineering/readiness-20nov/security/` (ABUSE-AND-FAILURE-CASES, SECURE-CODING-CHECKLIST (skimmed via the truncation point only: not used for ids), SECURITY-PRIVACY-ACCEPTANCE and -2-CARDS, SECURITY-OPEN-QUESTIONS); `docs/engineering/05`, `06`, `08` (rule lists and Enforced-by lines; `07` not opened); cards `08-keeping-and-trust.md` (NS-08, NS-10, NS-25 rows), `09-capture.md` (NS-16, NS-18), `10-reading-and-family.md` (NS-22, NS-24), `19-from-download-to-first-letter.md` (NS-40 rows only); function files risk-security, privacy, compliance, legal, support, finance (P0 rows); `23-dependency-map-and-plan.md` (drops); code and tests in `apps/mobile/test`, `packages/*/test`, `supabase/tests`, `scripts/**` (grep and titles only).

Not read: `18-errata-after-lock.md` (errata E1 to E61 may change rows; every row here is as the card or function file shows it today, UNVERIFIED against errata), `quality/` catalogue files, `docs/tdd/new-scope/`, `docs/design/e2e/`, `SECURE-CODING-CHECKLIST.md` body.

Counts: rows read about 205 (card P0 rows: NS-08 13, NS-10 9, NS-16 8, NS-18 3, NS-22 2, NS-24 3, NS-25 13 = 51; NS-40 P0 rows touched 8; function P0 rows: SEC 22, PRV 35, CMP 23, LEG 21, SUP+POL 29, FIN 8 = 138; chapter rules 14 selected; abuse cases 70+ read). Cases written: 133 (grouped rows count once; machine-counted by first status token). Status: BUILT 11, PARTIAL 52, GAP 49, DEVICE 6, DOC 14, COUNSEL 1 (other COUNSEL needs appear as a second tag on DOC or PARTIAL rows).

Unverified: errata effect; whether the FR-PRV-07 store registry file exists (grep for it was not done); Drop letters are ASSUMED from `23` (A = locked cards NS-01 to NS-37, B = card 21, C = card 27, D = card 19); hosted Supabase behaviour; any Apple behaviour.

Status key: BUILT = a test whose title cites the id (file named). PARTIAL = related test exists, covers part (part named). GAP = none found by `grep -rl "<id>" apps packages supabase scripts`. DEVICE = only a phone proves it (a GAP-level unit part may still be missing). DOC = process check. COUNSEL = needs counsel; the case is the evidence check after counsel answers. Fixtures: family Asha only; canary strings are generated, never real.

Mutant column: the one-line change that must turn the case red. P1 rows appear only where a P0 depends on them or a store rule is guarded.

## 1. Second account and the phone's own data (X4-R1, NS-10, NS-25-R19, FR-SEC-01 to 04, FR-PRV-14, FR-PRV-44)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T7-01 | NS-10-R3 | `[NS-10-R3] a second account never sees the first` | U | P0 | A | Asha book owned by A, session B: gate returns no-book route; no screen text names A | `gate.logic.ts:123-125` count unfiltered books | mobile | BUILT (`apps/mobile/test/account-gate.test.ts:38`, `account-layer.test.ts:19`) |
| T7-02 | X4-R1 | `[X4-R1] every surface and the planner return 0 rows for B` | I | P0 | A | Seed Asha as A, sign in B; one assertion per surface listed in FR-SEC-03 (Book, Find, Read together, Read the year, Save a copy, printable book, planned notes, slip registry, quick capture, active-book setting) | Drop one surface from the list | mobile | PARTIAL (`account-scope.test.ts:36` reader only; `account-gate.test.ts`; no per-surface enumeration) |
| T7-03 | X4-R1 | `[X4-R1] enumeration is built from the store registry` | S | P0 | A | Add a fake store to the registry; suite fails until covered (positive control) | Hand-written surface list | qa | GAP (FR-PRV-07 registry not checked: see Questions) |
| T7-04 | NS-10-R5 | `[NS-10-R5] a second account never claims the first's letters` | I | P0 | A | A signed out, B signs in, outbox: 0 claim screens, 0 uploads under B | Let `takeOwnership` adopt on mismatch | sync | PARTIAL (`account-scope.test.ts:95` real phone DB; no claim-screen or upload assert) |
| T7-05 | FR-SEC-02 | `[FR-SEC-02] B keeps a letter on A's phone: book is B's, one calm line or it syncs` | I | P0 | A | B keeps a letter; assert letter in B-owned book and either synced or one SystemLine | Leave `AccountMismatchError` silent (`ownership.ts:49`) | mobile | GAP |
| T7-06 | FR-SEC-04 | `[FR-SEC-04] A's book returns only when A signs in or Erase runs` | I | P0 | A | B signed in, scan every screen text for A or "another book" | Add a neutral "other book" line | mobile | GAP |
| T7-07 | FR-PRV-14 | `[FR-PRV-14] B reads none of A's rows in any registered store` | I | P0 | A | Walk registry: Days, moments, names list, versions cache, Find rows, planned notes read 0 for B | Omit one store from sign-out clear | mobile | GAP |
| T7-08 | NS-25-R19 | `[NS-25-R19] second account on the phone` | I | P0 | A | P1 local letters, account Q signs in: Q never sees, claims or uploads | As T7-04 | mobile | GAP |
| T7-09 | FR-PRV-44 | `[FR-PRV-44] B sees none of A's attached media or album picks` | I | P0 | C | Asha picture attached for A, B signs in: 0 files, 0 album ids | Key album picks by device | mobile | GAP |
| T7-10 | AB-04 | `[NS-32-R12] pending notes re-planned from B's books only` (abuse case AB-04; NS-32-R12 not read, cited via abuse file) | U | P0 | A | Plan notes naming A's child, sign in B: 0 pending notes name A's child | Re-plan from cached books | mobile | GAP |
| T7-11 | NS-10-R1 | `[NS-10-R1] two phones, one book` (device row S1-204) | D | P0 | A | Account with 5 Asha letters, second iPhone: all words appear; no page says a recording is on that phone | n/a (device) | mobile | DEVICE |
| T7-12 | NS-10-R6 | `[NS-10-R6] restore plus sign-in never duplicates` | D | P0 | A | Restored backup holds L1..Ln, sign-in pulls same ids: n rows | Dedupe on new id | sync | DEVICE (two-phone row) |
| T7-13 | NS-10-R0 | `[NS-10-R0] a returning account never meets the child step` | U | P0 | A | Account with no local book, consent due: consent sheet or held screen in 10 s; child step route never mounted | Route to child step on empty local DB | mobile | GAP |
| T7-14 | NS-10-R8 | `[NS-10-R8] kill switch at sign-in shows the local book` | U | P0 | A | `serverFeaturesEnabled()` false: local book, never held screen | Check flag after held step | mobile | BUILT (`account-gate.test.ts:93`) |
| T7-15 | NS-10-R10 | `[NS-10-R10] a lapsed plan still brings the book` | I | P0 | A | Lapsed Asha plan, new phone: all letters arrive and open | Gate pull on entitlement | sync | GAP |
| T7-16 | NS-10-R7 | `[NS-10-R7] one acceptance row after a retry` | U+I | P0 | A | Lost answer, retap: one row; key is stable per answer | `randomUUID()` per call | mobile | BUILT (`consent-retry-one-key.test.ts:79`); server idempotency cell GAP |

## 2. Consent, data rights, deletion (NS-10-R4, NS-25-R14 to R17, FR-PRV-01, -02, -19, -20, -34, -41, FR-CMP-16, -17, DSR, IAM-R03)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T7-20 | NS-10-R4a | `[NS-10-R4a] deletion works without agreeing` | I | P0 | A | Returning Asha parent declines new Terms: Delete account reachable and runs | Require acceptance on delete route | mobile | PARTIAL (`delete-account.test.ts` [S64]; `account-deletion-gate.test.ts`: no decline path found) |
| T7-21 | NS-10-R4b | `[NS-10-R4b] export reachable after declining` | I | P0 | A | Decline Terms: Save a copy on-phone works; empty phone shows "book is on the other phone" line | Gate export on consent | mobile | PARTIAL (`export-build.test.ts`, `export-open-request.test.ts` exist; decline path not checked) |
| T7-22 | G1 / FR-PRV-20 | `[FR-PRV-20] sync_pull returns no content rows without current consent` | I | P0 | A | db persona with no `terms` acceptance calls `sync_pull`: 0 content rows; export and `request_account_deletion` still succeed | Remove the consent check | data | GAP (`sync_v1_server.sql:1306` checks sign-in only) |
| T7-23 | PRIV-R09 | `[G1b] export and deletion work without current consent` | I | P0 | A | Stale acceptance: both RPCs succeed | Add the gate to those RPCs | data | GAP |
| T7-24 | API-R11 | `[G1c] an old build still parses the gated response` | U | P0 | A | Frozen v1 fixture against `packages/api` | Return a new error shape | sync | GAP |
| T7-25 | FR-PRV-01 | `[FR-PRV-01] withdraw sensitive-data consent in two taps` | J | P0 | A | Signed-in Asha, Me, Privacy: two taps reach the sheet; confirm writes one PRIV-R21 row | Hide row behind a third screen | mobile | PARTIAL (`privacy-sensitive-row.test.ts:61` row states; two-tap path and row write not seen) |
| T7-26 | FR-PRV-02 | `[FR-PRV-02] every consent row carries rendered_sha256 and its fields` | I | P0 | A | Accept and decline on each sheet: row has hash, version, method, surface; each sheet also shows its Shown, Records, Never and Decline lines (PRIV-R21) | Skip the hash | data | PARTIAL (`supabase/tests/consent_record_fields.test.mjs`; client side per sheet not checked) |
| T7-27 | PRIV-R06 | `[PRIV-R06] a replayed accept after a decline keeps order, earlier row stays` | I | P0 | A | accept, decline, replay accept: 3 rows in order | Overwrite first row | data | PARTIAL (`consent_record_fields.test.mjs`, `consent_service_role.test.mjs`; replay case not seen) |
| T7-28 | IAM-R03 | `[IAM-R03] content write without age-attested terms refuses with SCCON` | I | P0 | A | Persona with no terms writes entry: SQLSTATE `SCCON` | Drop `age_attested` test | data | PARTIAL (`security_family.test.mjs:66,175` cite LEGAL-REQ-001) |
| T7-29 | FL-09 | `[FL-09] consent withdrawn mid-sync: own deletions still go, content writes refuse` | I | P0 | A | Withdraw during push: deletions ok, content refused, 0 phone loss | Gate deletions | sync | GAP |
| T7-30 | FR-PRV-34 | `[FR-PRV-34] after Erase everything a scan of every store finds nothing` | I | P0 | A | Asha book with picture, Find index, typed day, share temp; Erase; scan listed paths | Leave `tmp/share` out of erase | mobile | PARTIAL (`erase-all.test.ts:385,628` cite DATA-REQ-024; paths for share, PDF temp, ImagePicker not confirmed) |
| T7-31 | FL-04 | `[NS-36] kill during Erase resumes and finishes` | I | P0 | A | Kill hook mid-erase; relaunch: 0 bytes in every store | Clear marker before stores | mobile | PARTIAL (`erase-all.test.ts`; per-store rows) |
| T7-32 | FR-CMP-17 | `[FR-CMP-17] Delete account visible in Me and works without new terms` | I | P0 | A | Store profile, Asha: row visible; runs with terms stale | D-129 hide left on | mobile | PARTIAL (`delete-account.test.ts`, `account-deletion-switch.test.ts`) |
| T7-33 | NS-25-R14 | `[NS-25-R14] P2 deletes account: P2's letters purged, P1's book intact` | I | P0 | A | Two Asha parents; P2 deletes; purge runs | Purge by book not author | data | PARTIAL (`account-deletion-two-phone.test.ts:121` real SQL; id not cited, purge clock not asserted) |
| T7-34 | NS-25-R15 | `[NS-25-R15] P1 deletes account: P2's letters survive with labels` | I | P0 | A | As above, P1 deletes | Cascade on book | data | PARTIAL (same file, `former_member_purge.test.mjs`) |
| T7-35 | DSR-R09 | `[DSR-R09] a purged id never returns from a stale device` | I | P0 | A | Stale phone pushes purged letter id: `SCPRG` | Drop purged-id set | sync | GAP (no `SCPRG` in tests; rule says pending PR #32) |
| T7-36 | FL-07 | `[IAM-R22] purge worker error keeps the request open` | I | P0 | A | Fail one Storage delete: request stays open, retried, no partial receipt | Mark done on first error | data | PARTIAL (`ops_deletion_worker.test.mjs`, `purge_batching.test.mjs`, `supabase/functions/purge-worker`; error path unchecked) |
| T7-37 | FR-PRV-19 | `[FR-PRV-19] other-language take empties raw and final text on the server` | I | P0 | A | Held draft synced, then marked other language: server text columns empty, audio stays | Skip empty call | sync | GAP |
| T7-38 | FR-PRV-18 | `[FR-PRV-18] What happens page states 30-day change of mind and 31, 38, 45-day clock` | C | P0 | A | Read `C-S20` strings: each date present | Edit a number | content | GAP |
| T7-39 | DSR-R03 | `[DSR-R03] destructive request with session older than 24 h re-authenticates` | U | (rule, no card pri) | A | Session 25 h old: re-auth then type-to-confirm | Skip age check | mobile | PARTIAL (`auth-force-reauth.test.ts` is epoch only); rule text says "not yet": drift, see Questions |
| T7-40 | NS-25-R16, R17 | `[NS-25-R16] invite says the other parent reads every non-private letter`; `[NS-25-R17] accept is recorded` | C+I | P0 | A | Invite sheet text; accept writes one PRIV-R21 row (`invite_accept`) | Remove the line; skip row | mobile | GAP |

## 3. Co-parent, invites and server access (NS-25, IAM, access matrix, Edge Functions)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T7-50 | NS-25-R1 | `[NS-25-R1] no co-parent surface in store builds` | S | P0 | A | Production profile: no invite or join route, no "coming soon" string (positive control: flag on shows them) | Flag on in store profile | mobile | GAP |
| T7-51 | NS-25-R2 | `[NS-25-R2] peek shows sign-off and role only` | I | P0 | A | Invitee not yet agreed: no child name or letter in peek | Add child name to peek | data | PARTIAL (`v1_gate_limits_peek_pepper.test.mjs:126` before consent; page text unchecked) |
| T7-52 | NS-25-R3 | `[NS-25-R3] private stays private` | I | P0 | A | P2 selects P1's private and sealed letters: 0 rows; P2 delete of P1 letter refused | Drop private filter in `book_entries` | data | PARTIAL (`access_matrix.test.mjs`, `v1_gate_coparent.test.mjs` no id) |
| T7-53 | NS-25-R4 | `[NS-25-R4][F11-REQ-008] within 72 hours the inviting parent undoes the join` | I | P0 | A | Undo at hour 71: membership gone, letters private not deleted | Allow undo at 73 h | data | BUILT (`v1_gate_coparent.test.mjs:137-140`; `sync_engine.test.mjs:300`) |
| T7-54 | NS-25-R6 | `[NS-25-R6] link page names no child` | S | P0 | A | Fetch invite page HTML with scraper: 0 child name, 0 inviter email | Render child name | web | GAP |
| T7-55 | NS-25-R7 | `[NS-25-R7] allowance per author` | I | P0 | A | Two authors, 3 letters each: each counts own | Count per book | data | GAP |
| T7-56 | NS-25-R10 | `[NS-25-R10] lost accept answer` | I | P0 | A | Retry accept: one membership | New key per call | data | GAP (`invite_redeem_by_code.test.mjs` related) |
| T7-57 | NS-25-R12 | `[NS-25-R12] servers off hides co-parent` | U | P0 | A | `serverFeaturesEnabled()` off: invite absent, own letters readable | Hide letters too | mobile | GAP |
| T7-58 | AB-31 | `[IAM-R14] revoked member's sync_pull returns 0 rows of the book` | I | P0 | A | Left member with valid token pulls: 0 rows, entry versions refuse | Drop membership check in definer | data | PARTIAL (`access_matrix.test.mjs` 27 cells; left-member sync_pull cell not confirmed) |
| T7-59 | IAM-R14 | `[IAM-R14] every authenticated function is listed and starts with require_user()` | I | P0 | A | Add unlisted fn in fixture migration: matrix fails | Skip `require_user()` | data | PARTIAL (`access_matrix.test.mjs:268-286`, rule text; id not in title: PARTIAL) |
| T7-60 | IAM-R15 | `[IAM-R15] views are read-only to clients` | I | P0 | A | `authenticated` insert on each view: denied | Grant write on a view | data | PARTIAL (`explicit_grants.test.mjs`, `grants.mjs`) |
| T7-61 | IAM-R17 | `[IAM-R17] contributors read only name, nickname, birthday month and day` | I | P0 | A | Contributor selects `children`: 0 rows; `book_children` columns exact | Add column to view | data | GAP (rule says pending PR #32) |
| T7-62 | IAM-R24 | `[IAM-R24] new table has a deny cell for every persona` | I | P0 | A | Add table to fixture: matrix fails without deny cell | Omit cell | data | PARTIAL (`access_matrix.test.mjs` for functions only; tables by review) |
| T7-63 | IAM-R07 | `[IAM-R07] no signInAnonymously under apps/mobile` | S | MUST | A | Scan source with a planted call (positive control) | Add call | security | GAP (rule says lint ban not yet) |
| T7-64 | IAM-R10 | `[IAM-R10] session and invite tokens live only in Keychain AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` | U | MUST | A | Storage adapter class assert; scan for AsyncStorage use of tokens | Switch to AsyncStorage | mobile | PARTIAL (`secure-storage-keychain-class.test.ts`; title id unverified: PARTIAL) |
| T7-65 | AB-53 | `[SEC-R17] hostile deep link: unknown path, startRecording, token in query` | U | MUST | A | Feed 6 links: not-found route, nothing records, query token rejected | Allowlist a route unchecked | mobile | PARTIAL (`deep-link.allowlist.test.ts` classification only; route behaviour not yet) |
| T7-66 | AB-34 | `[IAM-R18] forwarded invite: stranger opens, single use, 7-day expiry, token hashed` | I | MUST | A | Redeem twice; at day 8 | Reusable token | data | PARTIAL (`invite_redeem_by_code.test.mjs`, `functions/invite-redeem/handler.test.ts`) |
| T7-67 | AB-35 | `[IAM-R19] hostile contributor refused while contributors off` | I | MUST | A | Invite contributor with setting off: refused | Flip default | data | PARTIAL (`security_family.test.mjs`) |
| T7-68 | FR-SEC-23 | `[FR-SEC-23] public routes show no child name, letter or inviter email; token in fragment` | S | P0 | A | Scrape built web pages (positive control with planted name) | Token in query | web | GAP |
| T7-69 | Edge authz | `[IAM-R23] each Edge Function rejects a call with no or wrong JWT` | I | MUST | A | Call `escrow`, `invite-redeem`, `purge-worker`, `subscription-status`, `analytics-forget`, `apple-token` anonymous: 401, no body | Skip auth in one handler | security | PARTIAL (`handler.test.ts` in four functions; per-function anonymous cell not confirmed) |

## 4. Backup, sign out, recordings (NS-08)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T7-70 | NS-08-R5 | `[NS-08-R5] backup off in store profiles` | S | P0 | A | `eas.json` with a store profile `EXPO_PUBLIC_BACKUP=1` fails preflight | Flag on in profile | ops | BUILT (`preflight-keepsafe.test.ts:33`) |
| T7-71 | NS-08-R6 | `[NS-08-R6] sign out never removes a recording` | I | P0 | A | Asha take on disk, sign out: file still present; sheet says recordings stay and anyone can read | Delete audio in sign-out | mobile | BUILT (`ns08-sign-out-keeps-recordings.test.ts:129,247`); J-N21 DEVICE |
| T7-72 | NS-08-R6 | J-N21 on a phone: sign out with backup off, every recording still plays | D | P0 | A | Founder phone, test account Asha only | n/a | mobile | DEVICE |
| T7-73 | NS-08-R7 | `[NS-08-R7] no backup claim while backup is off` | C | P0 | A | Scan app strings, store listing, site, Save a copy README for "survives", "backed up", "safe if you lose" | Add a claim | content | PARTIAL (`packages/content/test/claims-capabilities.test.ts:387` RT-REL-03) |
| T7-74 | NS-08-R4 | `[NS-08-R4] label and policy delta for counsel` | P | P0 | A | One page lists each answer that changes at flip | Page absent | compliance | DOC / COUNSEL |
| T7-75 | NS-08-R9 | `[NS-08-R9] backup of the backup decided before a flip` | P | P0 | A | Readiness pack answers how `entry-audio` objects are copied, or says they are not | Missing | ops | DOC |
| T7-76 | NS-08-R10, R11 | `[NS-08-R10] second phone downloads, never duplicates`; `[NS-08-R11] second account never uploads the first's recordings` | I | P0 at flip | A | Flip build only: two phones; account B on A's phone | Upload under signed-in user | sync | GAP (`backup-e2e.test.ts`, `backup-queue.test.ts` exist, id not cited) |
| T7-77 | NS-08-R13, R14 | `[NS-08-R13] upload is idempotent`; `[NS-08-R14] kill switch leaves no dangling row` | I | P0 at flip | A | Lost answer retry: one object key (entry id + sha256); switch mid-upload | New key per retry | sync | PARTIAL (`audio_backup.test.mjs`, `backup-queue.test.ts`; ids not cited) |
| T7-78 | NS-08-R16, R19 | `[NS-08-R16] deletion purges objects and key`; `[NS-08-R19] withdrawing consent deletes server copies` | I | P0 at flip | A | Purge on published clock; escrow wrap gone | Leave wrap | data | PARTIAL (`audio_backup_purge.test.mjs`, `audio_backup_escrow.test.mjs`) |
| T7-79 | NS-08-R17, R18 | `[NS-08-R17] backup survives a lapse`; `[NS-08-R18] quota never blocks a letter` | I | P0 at flip | A | Lapsed plan; quota full: Keep works, no charge line | Gate Keep on quota | sync | GAP |

## 5. Capture and read rows with privacy weight (NS-16, NS-18, NS-22, NS-24)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T7-80 | NS-16-R4 | `[NS-16-R4] no contacts, no network` | S | P0 | A | Name field: scan for Contacts API; spy fetch during typing: 0 calls | Import Contacts | mobile | GAP |
| T7-81 | NS-16-R6 | `[NS-16-R6] over thirty refused before upload` | U | P0 | A | 31-char name: Keep refused, outbox empty | Limit 300 | mobile | GAP |
| T7-82 | NS-16-R9 | `[NS-16-R9] no speaker identification` | S | P0 | A | Scan for diarization or voice-compare identifiers (README deny-list; positive control) | Add `diarize` import | mobile | GAP |
| T7-83 | NS-16-R15, R16 | `[NS-16-R15] names list cleared`; `[NS-16-R16] name purged with the account` | I | P0 | A | Sign out and Erase; account deletion | Skip list in erase | mobile | GAP |
| T7-84 | NS-16-R5, R18 | `[NS-16-R5] never invites a child`; `[NS-16-R18] an instruction, not an attestation` | C | P0 | A | Content scan; Review line has no checkbox, no record | Add checkbox | content | GAP |
| T7-85 | NS-16-R3 | `[NS-16-R3] the keeper's rules apply` | I | P0 | A | Signed-as-other letter: edit, delete, privacy, count follow account holder | Count to signer | mobile | GAP |
| T7-86 | NS-18-R3 | `[NS-18-R3] words hidden by default` | U | P0 | A | Typed day, default: body is fixed line; switch on: body equals words | Default on | mobile | GAP |
| T7-87 | NS-18-R6, R8 | `[NS-18-R6] typed days removed`; `[NS-18-R8] typed words never logged` (J-N18) | I | P0 | A | Canary in typed day: 0 hits in logs, crash text, URLs; removed on sign-out, Erase, deletion | Log the label | mobile | GAP |
| T7-88 | NS-22-R2, R3 | `[NS-22-R2] header controls at AX5`; `[NS-22-R3] quiet and hide in 2 taps` | D+I | P0 | A | AX5 phone; tap-count walk | Add third tap | design-systems | DEVICE (R2); GAP (R3) |
| T7-89 | NS-24-R2, R3 | `[NS-24-R2] only their words`; `[NS-24-R3] skips private and sealed` | I | P0 | A | Asha year with private (either author), sealed, hidden letters: absent; no machine text | Include private by year | mobile | GAP |
| T7-90 | NS-24-R10 | `[NS-24-R10] reads with a lapsed plan` | I | P0 | A | Lapsed plan: year in full | Gate on plan | mobile | GAP |

## 6. Logs, crash, system indexing, switcher (FR-PRV-10, -11, -13, -17, -27, -45, FR-SEC-16, -18, -21, -22, X6-R1)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T7-100 | X6-R1 | `[X6-R1] nothing about a letter, picture, child or prompt reaches Spotlight, Siri, Handoff or App Intents` | S | P0 | A | Planted donor per rule; compiled plist and entitlements per EAS profile | Add `NSUserActivity` search eligibility | security | BUILT (`no-system-indexing.test.ts:295,315,338,381,388,407`) |
| T7-101 | FR-PRV-17 | `[FR-PRV-17] no pasteboard write without a tap; no widget or timeline data` | S | P0 | A | Extend X6-R1 scan to pasteboard and widget timelines | Add `UIPasteboard.general.string =` | security | PARTIAL (same file; pasteboard and widget coverage not confirmed) |
| T7-102 | FR-PRV-10 / J-N18 | `[FR-PRV-10] canary in every new field never reaches logs, crash, URLs, notifications, analytics` | I | P0 | A | Canary strings in Find query, photo words, place, Firsts label, seal day, From name, typed day, child name, email | Log one field | analytics | PARTIAL (`find-search.test.ts`, `reminders-never-list.test.ts`, `packages/analytics/test/analytics.test.ts`, `functions/_shared/log/canary.test.ts`: no single harness over every field) |
| T7-103 | FR-PRV-11 | `[FR-PRV-11] error messages hold only codes and L2 values` | S | P0 | A | Scan `throw` and `new Error` for interpolated fields named text, name, note, place, label, email, path (positive control planted) | `throw new Error(\`bad ${name}\`)` | security | PARTIAL (`global-errors.test.ts` cites PRIV-R10; no source scan) |
| T7-104 | FR-PRV-13 | `[FR-PRV-13] no route parameter holds L3 or L4; invite token in fragment only` | U | P0 | A | Build every route and link; scan for Find query, seal day, ids | Put query in route | mobile | PARTIAL (`deep-link.allowlist.test.ts`, `invite-link.test.ts`) |
| T7-105 | FR-PRV-27 | `[FR-PRV-27] email and code never in log, URL, analytics, notification` | I | P0 | A | Canary email: 0 hits; address masked on every screen except the field | Print address | mobile | GAP |
| T7-106 | FR-SEC-22 | `[FR-SEC-22] switcher snapshot blank on every L4 screen` | D | P0 | A | Review, letter page, Find results, Save a copy preview, share preview, versions; background; snapshot blank with and without App lock | Remove cover on one screen | mobile | DEVICE (`app-lock-machine.test.ts`, `first-run-cover.test.ts` unit parts only) |
| T7-107 | FR-SEC-21 | `[FR-SEC-21] no doorway or notification shows child name or letter words` | U | P0 | A | Every category and doorway string with every names switch state | `hiddenPreviewsShowTitle: true` | mobile | PARTIAL (`reminders-never-list.test.ts`, `reminders-inline.test.ts`); J-N24 DEVICE |
| T7-108 | FR-SEC-16 | `[FR-SEC-16] a validly signed hostile config cannot turn a feature on` | U | P0 | A | Sign payload (test key) with `true` for a hidden flag, stop-export, delete-local: all ignored | Accept enabling `true` | security | PARTIAL (`auth-force-reauth.test.ts`, `packages/api/test/standards.test.ts` cite LEGAL-REQ-040; hostile payload case not seen) |
| T7-109 | FR-SEC-18 | `[FR-SEC-18] Find, From, Firsts, typed days, photo paths never in log or analytics` | I | P0 | A | As T7-102 over the five paths | Log a path | analytics | GAP |
| T7-110 | AB-56, AB-57 | `[FR-AIS-13] tampered model or pack file deleted, never loaded` | U | P0 | A | Flip one byte vs signed manifest: deleted, retry shown | Skip hash compare | ai | PARTIAL (`models-catalog.test.ts`; FR-AIS-13 not cited) |
| T7-111 | FR-RSK-06 | `[FR-RSK-06] each kill switch hides a surface, never deletes data or stops export` | U | P0 | A | Each key in `KILL_SWITCH_KEYS` on: surface hidden, export works, rows intact | Switch deletes | mobile | PARTIAL (`auth-kill-path.test.ts`, `packages/api/src/kill-switches.ts` read via grep only) |

## 7. Store, label, claims, regulatory sign-up (G5, FR-CMP, FR-LEG, FR-PRV-24 to 31)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T7-120 | FR-CMP-05 (G5) | `[FR-CMP-05] ASC answers, privacy manifest and proxy capture equal the label row for the build` | P | P0 | A | Store candidate: three files saved in the gate record; proxy capture shows only declared hosts | New host not declared | compliance | PARTIAL (`privacy-manifest.test.ts:225,325` manifest vs worksheet; ASC answers and proxy capture are DOC) |
| T7-121 | FR-CMP-04, FR-PRV-30, -36 | `[FR-PRV-30] label evidence recorded per version; one label row per flag variant` | P | P0 | A | `app-store-privacy-labels.md` row for each variant; build flags pick the row | Row missing | compliance | DOC / COUNSEL |
| T7-122 | NS-07-G11-1 | `[NS-07-G11-1] data leaving the phone needs a recorded label change` | S | P0 | A | PR adding a network call naming letter text without D-id: guard red | Guard bypass | ops | BUILT (`apps/mobile/test/label-effect.test.ts:40`, G11-2, G11-3) |
| T7-123 | FR-PRV-31 | `[FR-PRV-31] preflight fails on an analytics, crash, attribution or ad SDK while label says No` | S | P0 | A | Fixture lockfile with planted SDK | Allow SDK | security | PARTIAL (`preflight-production.test.ts`, `analytics-off-v1.test.ts`) |
| T7-124 | FR-CMP-03, FR-CMP-20 | `[FR-CMP-20] every public line a card enables has a claims row naming build and P0 rows` | C | P0 | A | Strings in `store.en.ts`, site, screenshots vs inventory | Add unlisted line | content | PARTIAL (`claims-capabilities.test.ts:387,475`; Notes-for-Review flag comparison not seen) |
| T7-125 | FR-RSK-03 | `[FR-RSK-03] no public "secure", "encrypted", "locked" or "private" claim without a proving test` | C | P0 | A | Scan listing and site strings for the four words | Add "encrypted" | content | PARTIAL (`claims-capabilities.test.ts`; word list unverified) |
| T7-126 | NS-40-R1, R8 / LEGAL-REQ-002 | `[NS-40-R1] the age question comes first`; `[NS-40-R8] No at the age step ends the session` | U+J | P0 | D | Fresh install and deep link: first screen is age, nothing selected; No: nothing sent, `ageGate.stoppedAt` only | Mount route behind gate | mobile | PARTIAL (`age-gate.test.ts` cites PRD-REQ-019, LEGAL-REQ-002: 24 h stop; `age-gate-screen.test.ts`; NS ids not cited) |
| T7-127 | NS-40-R6 / FR-PRV-25 | `[NS-40-R6] the system age signal is never stored` | U | P0 | D | Spy on store, Keychain, logger, analytics: 0 writes of the signal | Persist the signal | mobile | GAP |
| T7-128 | NS-40-R9, R10 | `[NS-40-R9] a refused sign-up is calm and stores nothing`; `[NS-40-R10] every sign-in method meets the country check` (staging) | I | P0 | D | Staging, test refused location, three methods: refused after code (never at Send), no country asked | Check at Send | security | GAP (no D-131 hook found in `supabase` or `apps`) |
| T7-129 | NS-40-R12, FR-PRV-26 | `[NS-40-R12] country counts hold no person` | I | P0 | D | Hook output: counts by result and code only; no IP, email, user id | Store IP | data | GAP |
| T7-130 | AB-33 / FR-CMP-13 | `[FR-CMP-13] an invite opened with no install still meets the age gate before accept` | I | P0 | D | Invite link on a clean phone: gate answered Yes before accept | Skip gate on invite | mobile | GAP |
| T7-131 | FR-CMP-15 | `[FR-CMP-15] a minor age-range signal acts as the gate's No` | D | P0 | D | iOS 26.2 phone, test account: stop at once | Treat as adult | mobile | DEVICE / COUNSEL (risk acceptance) |
| T7-132 | FR-LEG-03, -04, -06, -08 | `[FR-LEG-08] Privacy Policy section 2 lists each new server field in the release that turns its flag on` | P | P0 | A | Diff flags on in `production` vs policy text | Flag on, policy old | legal | PARTIAL (`packages/content/test/legal-docs.test.ts`, `legal-beta.test.ts`); COUNSEL for wording |
| T7-133 | FR-LEG-09, -20 | `[FR-LEG-09] record_policy_act accepts each method and surface a card names` | I | P0 | A | Call with `invite_accept`, `withdraw`, etc. | Reject unknown surface | data | PARTIAL (`consent_record_fields.test.mjs`) |
| T7-134 | FR-LEG-13, -12 | `[FR-LEG-13] each new font, model or image has a licence record` | S | P0 | C | Planted asset with no record: fails | Add asset | legal | PARTIAL (`scripts/licences/`, listing only) |
| T7-135 | FR-LEG-07, -23, -18 | Counsel reads (age-keyed seal choices, child picture and video, packet 1.6.0) | P | P0 | A | Founder links written answer in gate record `docs/legal/evidence/store/<v>-<b>/gates.md` | n/a | legal | COUNSEL |
| T7-136 | FR-CMP-11, -12 | `[FR-CMP-11] gate record exists with evidence for G0 to G6` | P | P0 | A | Check file exists, each line names file, commit or console path | Missing line | compliance | DOC |
| T7-137 | FR-CMP-19, -25 | Age-rating questionnaire redone when NS-05, NS-25 or NS-52 is on | P | P0 | A/C | Saved answers in gate record | Skipped | compliance | DOC |
| T7-138 | FR-CMP-18 | Notes for Review state sign-in need and features that need it | P | P0 | A | Read notes vs flags | Mismatch | compliance | DOC (`packages/content/test/app-review.test.ts` partial) |
| T7-139 | FR-SEC-26 | `[FR-SEC-26] App Review demo account holds only the Asha book; credentials outside repo` | P | P0 | A | Inspect account (founder), grep repo for credential | Real data | ops | DOC |
| T7-140 | G5 | Store run: privacy label and claims diff on the candidate | P | P0 | A | Per 14 section 3 | n/a | qa | DOC |

## 8. Support, policy, finance (P0 rows only)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T7-150 | FR-SUP-01 | `[FR-SUP-01] Help and legal is reachable in every state` | I | P0 | A | Signed out, lapsed, offline, switches off, second account: Help row present | Hide when signed out | mobile | PARTIAL (`settings-help.test.ts:41,142` cite RT-SET-02, F20-REQ-007) |
| T7-151 | FR-SUP-03 | `[FR-SUP-03] every mailto has a fixed subject key, empty body, no content` | U | P0 | A | Build each `supportMailto` and `mailTarget` URL with Asha context | Add child name to body | mobile | PARTIAL (`settings-help.test.ts`, `settings-p6b.test.ts`; field-by-field check unconfirmed) |
| T7-152 | FR-SUP-05, -11, -12, -21 | `[FR-SUP-05] every help sentence is true of the shipping build` | C | P0 | A | Claims inventory vs articles and macros; no "free forever"; no refund promise | Add claim | content | PARTIAL (`packages/content/test/support/`) |
| T7-153 | FR-SUP-16, -17 | `[FR-SUP-17] struggling page shows region lines or emergency words` | U | P0 | A | Regions US, CA, GB, AU, NZ, IN plus unknown | Missing region | mobile | PARTIAL (`helpline-buttons-visible.test.ts`, `helplines.test.ts`, `settings-help.test.ts:72`) |
| T7-154 | FR-SUP-09, -10, -26 | Support asks only allowed items; attachments never opened; no picture asked | P | P0 | A | Macro text review | Macro asks for screenshot | support | DOC |
| T7-155 | FR-POL-12 | `[FR-POL-12] no Claude session reads the mailbox or writes to a user` | S | P0 | A | Scan `.claude/agents/support.md`, `agents/roster.json`, `agents.yml` for mail connectors | Add Gmail tool to support | security | GAP (review only per SEC-R19) |
| T7-156 | FR-POL-04, -05, -06, -07, -13 | Runbooks exist: safety removal, custody neutral reply M14, legal letter no reply, under-18 report, data leak | P | P0 | A | File exists in `docs/ops/runbooks/`, counsel approval line | Missing | support | DOC / COUNSEL |
| T7-157 | FR-SUP-14, -15, -07 | Deletion and data-request macros: 30 days, 31, 38, 45 days; reference `DREQ-` | P | P0 | A | Read macros vs DSR-R12, R13 | Wrong day | support | DOC |
| T7-158 | FR-SUP-23 | Support mailbox read by the founder alone; provider in `subprocessors.md` | P | P0 | A | Check settings (founder) and file | Forwarding rule | ops | DOC |
| T7-159 | FR-FIN-09 | `[FR-FIN-09] no string shows price, amount, trial length or "free"` | C | P0 | A | Scan app strings and notifications | Add "$" | content | PARTIAL (`packages/content/test/pricing.test.ts`) |
| T7-160 | FR-FIN-11 | `[FR-FIN-11] refunded or revoked Plus is treated as lapsed; kept letters stay` | I | P0 | A | Revoke: plan lapsed, letters open, played, found | Delete on revoke | mobile | GAP (`subscription-status` handler test related) |
| T7-161 | FR-FIN-02, -03, -05, -22, -30, -32 | G6 cost gate record, weekly limits job, sizing note, accountant brief | P | P0 | A | Check files and job output exist | Missing | ops | DOC |

## 9. Secrets, supply chain, agents (SEC, SEC-R10, R11, R19, R21)

| Case | Row | Exact title | Lvl | Pri | Drop | Fixture, act, assert | Mutant | Lane | Status (file) |
|---|---|---|---|---|---|---|---|---|---|
| T7-170 | SEC-R03 | `[SEC-R03] no secret in repo, EXPO_PUBLIC_* or the bundle` | S | MUST | A | Secret scan over history with a planted fake token (positive control); `.ipa` strings scan | Commit fake key | security | GAP (no gitleaks or trufflehog under `.github` or `scripts`; `env-file-guard.mjs` is related) |
| T7-171 | SEC-R02 | `docs/ops/SECRETS.md` has a row per secret | P | MUST | A | File exists | Missing | ops | GAP (file absent) |
| T7-172 | SEC-R10 | `[SEC-R10] every action pinned to full SHA` | S | MUST | A | Planted tag pin and short sha | Pin by tag | security | BUILT (`scripts/ci/workflow-lint.test.mjs:15,70`) |
| T7-173 | SEC-R11 | `[SEC-R11] pull_request_target never checks out or runs PR code` | S | MUST | A | Planted head checkout and interpolation | Add head checkout | security | BUILT (`workflow-lint.test.mjs:23,27,41,57,64`; `compliance-fence.yml` uses the trigger) |
| T7-174 | SEC-R16 | `[SEC-R16] no ATS exception or cleartext permission` | S | MUST | A | Config scan with planted `NSAllowsArbitraryLoads` | Add exception | mobile | BUILT (`supabase-env-https.test.ts`; config assert partly, rule says not yet: PARTIAL) |
| T7-175 | SEC-R15 | `[SEC-R15] CompleteUntilFirstUserAuthentication declared` | S | MUST | A | `app.config.ts` value | Lower class | mobile | PARTIAL (`config.test.ts`, `store-sign-in-capabilities.test.ts`); copyItem clone class UNVERIFIED |
| T7-176 | SEC-R06, R08 | `npm ci`, lockfile only by dependency PR, `npm audit --omit=dev --audit-level=high` with dated ignores | P | MUST | A | CI job run on a planted advisory | Raise ignore expiry | security | DOC |
| T7-177 | SEC-R19 | `[SEC-R19] agents hold no write connector or service key` | S | MUST | A | Scan `agents.yml`, `agents/roster.json`, `.claude/**` for Supabase, Vercel, Gmail, Resend, PayPal write connectors and `service_role` | Add connector | security | GAP (review only) |
| T7-178 | SEC-R21 | `[SEC-R21] untrusted issue text is not an instruction` | U | MUST | A | Issue comment from a non-owner asking to change a label or permission: ignored | Treat any author as founder | security | PARTIAL (`scripts/agents/lib.test.mjs`, `lib.mjs:254-256` trust rule; NSC-12 first-line fail-open (F-10) has no test) |
| T7-179 | NSC-12 | `[NSC-12] a new first-line format from the owner account does not become founder` | U | MUST | A | Comment `<!-- newformat -->` by owner: not trusted | Fail open to "founder" | security | GAP |

## Order of build

1. A (first, before any outside tester): T7-01 to T7-08, T7-22 to T7-24 (consent gate on `sync_pull`), T7-30/31 (Erase), T7-70/71 (already built, keep green), T7-100 (built). Why: they guard the live second-account defect and the unbuilt `sync_pull` consent gate (G0, G1, RR-3; trace must see NS ids first, so use the exact bracketed titles).
2. A device sheet: T7-11/12, T7-72, T7-106 first (P0 device rows block any build to anyone outside the family; a waiver is never allowed for leaks or lock-screen names, `14` s6).
3. A privacy and label: T7-102/103/109 (one canary harness), T7-120 to T7-125 before the first store candidate (G5).
4. D (card 19): T7-126 to T7-130 only when the D-131 hook and age module exist; staging cases need a refused-location fixture.
5. C: T7-09, T7-134 after Q-PM-3 is decided; FR-SEC-27/28 cases are Variant B only and not written.
6. Process (DOC, COUNSEL) rows: file in the G2 and G3 checklist once, not per build.

## Risks (how these tests could lie)

- Gate and reader tests (`account-gate.test.ts`) prove the pure functions, not a real sign-in on a phone. A green `[X4-R1]` today is a reader test; no per-surface enumeration exists.
- DB tests run in embedded Postgres; hosted Supabase behaviour (rate limits, Auth audit retention, Storage not in nightly dump) is not proven. Edge Function handler tests may stub the JWT.
- Source scans need a positive control; a scan whose regex rots passes with zero matches. `no-system-indexing.test.ts` has planted controls: copy that pattern.
- Clock: the age 24 h stop, 72 h undo, 7-day invite expiry, 30/31/38/45-day deletion clocks need an injected clock; a real `Date.now()` makes them flaky.
- "At flip" rows (NS-08-R10 to R19) test a build that is not shipped; they must not be reported green against the off build.
- A privacy-manifest or label match proves the worksheet, not what the binary sends: only the proxy capture (DOC) does.
- Canary tests must use generated Asha strings; `no-real-family-data.test.ts` keeps only hashes.
- DEVICE rows on a simulator are not evidence (14 s2); the Simulator SDK lacks the Journaling Suggestions framework.

## Questions for the owner

1. `14-test-plan.md` s7 and FR-PRV-20 (`functions/privacy.md`, row FR-PRV-20): server returns "no content rows" without current consent. `SECURITY-OPEN-QUESTIONS.md` S-1 recommends gating only other members' rows and always serving own rows. These contradict. Which does T7-22 assert? (owner: security-architect with data-steward; founder for the MUST.)
2. `docs/engineering/08-data-rights-and-legal-requests.md` line 33: DSR-R03 says "not yet (deletion UI not built)", but deletion screens and tests exist (`delete-account.test.ts`, `account-deletion-*.test.ts`). Rule drift: fix the rule or name the 24 h re-auth test.
3. `docs/engineering/06-security-engineering.md` line 35 (SEC-R03) says a gitleaks job is pending PR #30; grep finds none, and `SECURITY-OPEN-QUESTIONS.md` F-12 says the same. Is there an owner and a PR?
4. `functions/risk-security.md` FR-SEC-03 and `functions/privacy.md` FR-PRV-14 name a "FR-PRV-07 registry" for the X4-R1 enumeration; I did not find a registry file by grep. Where does it live, or is it still to be built?
5. `08-keeping-and-trust.md` NS-08-R10 to R19 are "P0 at flip". Do they block Build 13 (flag off) or only a flip build? I wrote them as flip-build cases.
6. `functions/risk-security.md` FR-SEC-24 is an opinion ("I agree with the default"), not a Given/When/Then row, yet marked P0 (b). No testable assertion; I wrote no case.
7. `functions/support.md` FR-SUP-07 has mixed priority by macro (P0 (b) M1 to M4, P0 (a) M5 and M6, P1 rest). Confirm T7-157 may treat M1 to M6 as P0 only.
8. FR-SEC-27, -28, -35 and FR-PRV-43, -47 apply to Variant B only (Q-PM-3 undecided, default Variant A). No cases written; confirm.
9. `19-from-download-to-first-letter.md` NS-40-R9: D-131 country hook is "when it ships". I found no hook in `apps` or `supabase`. Is it in Build 13? If not, T7-128 and T7-129 are out of this build.
10. Drop letters: I assumed A = locked cards NS-01 to NS-37, B = card 21, C = card 27, D = card 19 from `23`. Correct me if Build 13 maps otherwise.
11. Errata `18-errata-after-lock.md` (E1 to E61) not read; rows may have changed in place.

## Count check
Machine-counted on 20 Nov 2026 from the Status column: 133 case rows; BUILT 11, PARTIAL 52, GAP 49, DEVICE 6, DOC 14, COUNSEL 1.
