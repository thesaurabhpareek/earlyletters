# 09. New-device sign-in email: security answers (security-architect, 21 Nov 2026)

Status: DRAFT answers to Q2, Q3, Q4, Q5 and Q13 of `08-new-device-email-privacy-read.md` section 12 (PR #1152, read at its head; file 08 is not edited here). Docs only. Updated 21 Nov after #1147, #1176 and #1182 merged: the hook, `ops_end_session`, the sender functions and the two new kinds are on `develop` but not applied to hosted (the founder's step); the sender Edge Function and the `/not-you` page are not built. Nothing is decided for the founder. Rule ids: IAM and SEC chapters (`docs/engineering/05-identity-and-access.md`, `06-security-engineering.md`).

Tags: [V] read this session, source named; [E] my inference; [U] not read, a hosted or outside fact the builder must prove. Network note: `supabase.com` did not resolve from this session (host blocked). The Supabase docs were read as the MDX files of the public docs repo, and the Auth server and `auth-js` as source, all from `raw.githubusercontent.com` on 21 Nov 2026, branch `master`. Hosted projects may run an older Auth build than `master`; so every statement about what the hosted project does is [U] until the proof in section 2 or 3 is run. Files read, under `https://raw.githubusercontent.com/supabase/`:
- D1 `supabase/master/apps/docs/content/guides/auth/sessions.mdx` (canonical page: supabase.com/docs/guides/auth/sessions)
- D2 `.../guides/auth/signout.mdx`
- D3 `.../guides/auth/auth-hooks/custom-access-token-hook.mdx`
- D4 `.../guides/auth/auth-hooks.mdx`
- S1 `auth/master/internal/api/api.go`, S2 `.../internal/api/logout.go`, S3 `.../internal/models/sessions.go`
- S4 `auth-js/master/src/GoTrueAdminApi.ts`

## 1. The short version

| Q | Answer |
|---|---|
| Q2 | Use the **custom access token hook** as the detector, as a tiny fail-open Postgres function that only queues one row per new session. The hook payload carries `session_id` and `authentication_method`, and `token_refresh` is a named value, so a refresh is told apart from a sign-in [V]. Do not rely on a trigger on `auth.sessions` (hosted permission [U]). A client call after sign-in is a second path for the class word and device id only, never the detector. Proof the sender PR must carry: section 2.4. |
| Q3 | The admin API **cannot** end one session by id. The only documented lever, `POST /logout?scope=`, needs that session's own JWT [V]. The way is a definer function that deletes the one `auth.sessions` row; GoTrue's own local sign-out is exactly that delete [V], and the docs say sign-out destroys the refresh tokens [V]. Whether the hosted role may delete it, and whether the refresh token dies, is [U] and must be proved against real Auth (section 3.3). The access token lives on until it expires, 15 minutes here [V]. Fail-safe: section 3.4. |
| Q4 | Accept **48 hours**, one constant. Reasons in section 4. Make the link a GET that shows a static page; the action is a POST from a button. |
| Q5 | Key `DEVICE_HASH_KEY`: an Edge Function secret held by the one sender function, never in Postgres, the repo or the client. The founder sets and rotates it. Rotation uses an overlap key so no device becomes "new" (section 5). |
| Q13 | Since #1147 merged `ops.security_events`: both the token row (`used_at`, `outcome`) and a `security_events` row. The kind list is closed; migration 20261121000000 added `new_device_signed_out` and `new_device_hook_failed` (section 6). |

Finding for the privacy owner: file 08 section 13 item 2 says no session id may be written to "any table, log, queue row" of this feature, while section 6 requires the token row to name one session, and the hook can only hand the session id to the sender through a row. Both cannot hold. My reading: the session id may live in exactly two rows, the pending row (minutes, deleted on pickup) and the token row (dies with the token). That needs file 08 item 2 reworded by `privacy`; I do not edit it.

Class of the session id: the merged migrations put the pending and token tables at L3 but the `session_id` and `token_hash` columns at L4 (stricter; DATA_CLASSIFICATION rule 8). Ruling by Karma (CTO): L4 stands as built, and this file says L4. Merged file 08 says L3; `privacy` must align file 08 to L4. File 08 is not edited here.

## 2. Q2: how the server sees a new session

### 2.1 What the docs and the repo say

| Fact | Evidence |
|---|---|
| A session is created on sign-in and stored in `auth.sessions`; every access token has a `session_id` claim equal to that table's primary key | D1:48, D1:52 [V] |
| A refresh exchanges a refresh token for a new pair and keeps the same session | D1:15-17 [V] |
| The hook "runs before a token is issued"; input has `user_id`, `claims`, `authentication_method`; `session_id` is a required claim; `token_refresh` is one of the listed methods ("Possible values include", so the list may be longer) | D3:7, D3:13, D3:20-23 [V] |
| A Postgres-function hook takes one jsonb argument and returns jsonb, runs on our database, and needs `grant execute ... to supabase_auth_admin` and a revoke from `anon`, `authenticated`, `public` | D4:40, D4:65-66 [V] |
| An error from a Postgres hook "is not retry-able" and goes back to the app as an HTTP error, so a raising hook breaks the sign-in | D4:311 [V] |
| Sessions have `ip` and `user_agent` columns | S3:92-93 [V] |
| The repo has one Auth hook already, `public.hook_before_user_created`: security definer, `lock_timeout 200ms`, fail open, grants to `supabase_auth_admin` only, enabled by a hosted dashboard step | `docs/tdd/new-scope/12-first-run.md:104` [V] |
| `supabase/config.toml` has no hook line; its [auth] block is "the record of what the Management API" holds | `supabase/config.toml:11, 30-43`; grep for `hook` finds nothing [V] |
| Whether the CLI config can switch the access token hook on | not read (the CLI template URL returned 404) [U] |

### 2.2 The three options

| Option | For | Against | Verdict |
|---|---|---|---|
| Trigger on `auth.sessions` (insert = new session; a refresh updates the row, `refreshed_at` is a column, S3:91) | needs no dashboard step; sees the row itself | `auth.sessions` belongs to Supabase's Auth role; whether our migration role may create a trigger on it on a hosted project is [U]; a managed upgrade of Auth could drop or break it [E]; a failing trigger would fail the sign-in | Not the default. Keep as plan B only if the hosted check passes |
| Custom access token hook | documented [V]; gives `session_id`; says which method; one place for every sign-in method | runs on every token issue including refresh every 15 minutes (`jwt_expiry = 900`, `config.toml:41`), so it must exit at once for `token_refresh`; one hook slot of this type [E]; a dashboard step for the founder [U]; the payload holds the email, so the function must not log it | **Recommended** |
| Call from the app after sign-in, server checks the JWT | carries class word and device id | a modified client never calls it, which is the F02-REQ-017 hole (file 08 section 2) | Only as the second path (2.3) |

### 2.3 Recommended shape

1. The hook function, in `public`, security definer, `set search_path = pg_catalog, public, pg_temp`, `lock_timeout` 200 ms like `hook_before_user_created`:
   - reads only `user_id`, `claims.session_id`, `authentication_method` from the event; returns the event's claims unchanged (a hook that must return claims intact: D3:9-13); never logs or stores the payload;
   - if `authentication_method = 'token_refresh'`, returns at once without reading any table (test by exclusion, never by an allowlist: the Apple and Google id-token sign-ins have no named method in the list [U]);
   - otherwise inserts one pending row (profile id, session id, time), `on conflict do nothing`, inside a `begin ... exception when others` block that counts the failure and still returns the claims. Fail open is the only safe choice for sign-in (SEC-R24 wants the failure seen, so the failure is counted in `ops` and read by the same alert read as the other `ops` counters).
2. The hook must not read an IP or user agent: the event does not carry them in the shape D3 documents, and the function does not look at `auth.sessions` at all.
3. Grants: `supabase_auth_admin` only; revoke from `public`, `anon`, `authenticated` (D4:65-66). It is not callable by a signed-in user, so IAM-R14's `require_user()` rule does not apply; the matrix needs its deny cell for `authenticated` and `anon` (IAM-R24) and a `supabase/tests/grants.mjs` row.
4. The sender (Edge Function, its own single-function login role, `04-secrets-keys-and-endpoints.md:354`) works in this order: take (pickup deletes the pending row, `ops_new_device_pending_take`, merged in #1182), decide new or not, mint, send. Conditions on the sender, from the #1182 security review [not yet enforced; the sender PR must test each]:
   - **One pending row at a time.** The sender takes one row, finishes it, then takes the next.
   - **A crash cannot leave a thief's device known with no email.** Send first, and call `ops_new_device_record` as late as possible; or, if the sender records before it sends, count a failure between record and send. The test: kill the sender after record and before send, and show the failure is counted.
   - **A crash after pickup loses that one email.** The row is already deleted, so nothing retries it. It fails open (the sign-in is never blocked) and the loss is counted in an operator-visible counter, read by the same alert read as the other `ops` counters. The 24-hour sweep covers only rows that were never picked up.
   - **A null mint.** The 21st token in a day for one person makes `ops_new_device_token_mint` return null and write one `alert_mail_ceiling` event. The email still goes out, without the not-you link (or folded into a summary email). The sender tests that it never sends a link built from a null mint.
5. The app's optional call (JWT in the Authorization header, device id and class word in the body, never in a URL): the function checks the JWT's `session_id` equals the pending row's session and fills class and device id. A call with no match changes nothing. No call within a few minutes: the sender uses class `other` and a null device id (file 08 section 3 default). A client token calling the sender's URL for anything else gets 401 (07.2 rule 7).
6. Edge case the builder must test: a second sign-in from a modified client that sends no device id, on an account whose first device did register, still gets the email; the "first device sends nothing" rule rests on "no device row and no earlier pending row ever for the account", not on a missing id.

### 2.4 Proof the sender PR must include (real Auth, not a fake)

A fake `auth.sessions` (as `supabase/functions/escrow/test/fakes.ts:40` uses) proves nothing about GoTrue. The PR carries a recorded run (commands and output in the PR body) against a real Auth server, either the Supabase CLI local stack or a hosted staging project run by the founder, showing:

| # | Proof |
|---|---|
| P1 | Email-code, email-link, Sign in with Apple and Sign in with Google (the four ways, `config.toml:30-43, 63-75` per file 08) each call the hook once, and the event has a `session_id` equal to the `session_id` claim of the token that comes back |
| P2 | A refresh calls the hook with `token_refresh` (or the name that really appears) and writes no row; ten refreshes, zero rows |
| P3 | The hook raising an error, or a lock timeout, still lets the sign-in succeed and counts one failure |
| P4 | The pending row appears even when the session row is not yet visible (no foreign key to `auth.sessions`; record whether it is visible) |
| P5 | The function and its grants: `has_function_privilege` true for `supabase_auth_admin`, false for `anon` and `authenticated` |
| P6 | No log line, row or Resend request holds the email, IP or user agent: the canary test (file 08 section 10) runs with the hook payload as input |
| P7 | The hosted-only facts the local stack cannot show (hook switch location, whether the same hook slot is free, Auth build version) are listed as founder-run steps in the PR, with the result pasted back; they are not claimed [U] |

## 3. Q3: ending one session by id

### 3.1 What the admin API can do [V]

- `auth-js` admin `signOut(jwt, scope)` posts to `/logout?scope=...` with that JWT (S4:58-77). The "admin" in the name is only the client class; the call needs a valid access token of the session.
- The server route `POST /logout` sits behind `requireAuthentication` (S1:278). With scope `local` it deletes the session of the token; `others` deletes all of the user's other sessions; default `global` deletes all (S2:46-65, S3:364-375).
- The `/admin` routes (S1:379-412) list users, factors and passkeys, and get, update and delete a user. There is no route to list or end a session by id. [V at `master`; hosted build [U].]
- D2:86-88 names the three scopes; D2:166 says sign-out destroys the affected refresh tokens; D2:170 says access tokens of revoked sessions stay valid until `exp`.
- GoTrue's own `LogoutSession` is one statement: delete from `auth.sessions` where `id` equals the session (S3:369-370). It touches no refresh-token table, so the refresh tokens die by the schema's cascade [E, from S2 and D2:166]. I did not read the table definition; this is what the proof checks.
- The repo has no real session-ending code. File 08 section 6 and the backup stop design assume a delete of `auth.sessions` (`supabase/functions/escrow/test/fakes.ts:40`); S01 is not in `supabase/functions` (file 08 section 2). `backup_session_live` only reads `auth.sessions` (`20261023000000_backup_server.sql:205-218`).

### 3.2 Recommended lever

A security definer function, callable by `service_role` only:

`ops_end_session(p_profile uuid, p_session uuid) returns int` (merged in #1182, migration 20261121000000) : `delete from auth.sessions where id = p_session and user_id = p_profile`, returns the row count. The user id check means a token row can never end another account's session. Called only after the token row is claimed (single use, expiry checked) in the same transaction as setting `used_at`, so a failure rolls back and the token stays usable.

### 3.3 Proof the builder writes against real Auth

Run against the local stack and, for the privilege question, once on hosted by the founder:

| # | Step | Passes when |
|---|---|---|
| A1 | sign in as the same fictional account ("Asha") on three sessions A, B, C; keep B's refresh token and access token | three rows in `auth.sessions` for her |
| A2 | call `ops_end_session` for B | returns 1; rows A and C remain (this is the "3 sessions, 2 live" test of file 08 section 6) |
| A3 | refresh with B's refresh token | refused; record the exact error name from the real server |
| A4 | count refresh-token rows of B | zero (proves the cascade; if not zero, section 3.4 applies) |
| A5 | refresh with A's token | works, and A's session is unchanged |
| A6 | use B's access token on a PostgREST call and on `backup_session_live` | the call works until `exp` (15 minutes, `config.toml:41`); `backup_session_live` is false at once. The page and email must not say "signed out at once" |
| A7 | call `ops_end_session` for a session of another account with the right id but the wrong profile | returns 0, nothing deleted |
| A8 | call twice | second returns 0 and the page answers "already done" |
| H1 (founder, hosted, read-only) | `select has_table_privilege('<the function owner role>', 'auth.sessions', 'DELETE')` | true. If false, the lever does not exist on hosted and 3.4 is the design [U] |

### 3.4 Fail-safe if the delete or the cascade is not proved

Until A1 to A8 and H1 hold, the page must not say "signed out" (file 08 section 6 already says so) and the held line stays out of the email (E78). If the lever cannot be built on hosted:
1. The page records the report and shows words saying the report is received and where the in-app control is (Me, Account, Sign out other devices; it exists: `apps/mobile/src/app/settings/account.tsx:181-186, 250-251` [V]). Outcome in the token row: `noted`, not `ended`.
2. The sender sets one flag on the account: "ask to sign out other devices on next open". The app, on next open, shows a notice with a button that calls `signOutOtherDevices` (`account.tsx:184`; scope `others`, which uses the app's own JWT, S2:58-59). The parent presses it; their other devices need a new sign-in, which the notice says first. Nothing signs a device out without a press.
3. `scope=others` cannot be called from the page: the page has no session JWT, and a mail-link visitor may have none anywhere [V S2:43, S1:278]. The brief's idea of "sign out all sessions scope=others" therefore works only from the app, as in step 2.
4. Optional, bigger: a revoked-session list that our own RPCs check, like `backup_session_live`. It stops our API at once but not Supabase Auth itself. I do not recommend it for 1.0; it is a proposal for `data-architect` if the founder wants the page to be immediate.

## 4. Q4: token life, and mail scanners

Recommendation: **keep 48 hours.** One named constant in the sender, covered by a test, so product can change it without a redesign.

- The token can do one thing, end one session (file 08 section 6 "Not a credential"). A long life adds little for an attacker and little for the parent: the damage window of a thief session is in hours, and the in-app control is always there after the link expires.
- The token sits at Resend for the vendor roll-off (file 08 section 8, 30 days [U]) and in the inbox for ever. Less life is less to leak. The backup stop link is 7 days only because a restore holds 24 hours (file 08 Q4); that reason does not apply here.
- After expiry the page answers exactly as for an unknown token (no oracle) and shows the in-app path as plain words, so a parent who comes back on day 3 is not stranded.
- Token row kept to `expires_at` plus 7 days (file 08 section 7) is consistent.

Scanners and prefetch (SEC-R17 spirit: a link never acts on load):
1. The email link is `https://<our domain>/not-you#token=<32-byte base64url>`. A fragment is not sent in an HTTP request [E, URL rule], so a scanner doing a plain GET learns nothing and cannot use the token.
2. The page served on GET is static: no token in the response, no database read, no state change. Headers: `Cache-Control: no-store`, `Referrer-Policy: no-referrer`, no third-party scripts.
3. The page script reads the fragment and does two POSTs with the token in the body: "look" (read-only; returns the device word and time, or the same flat answer for unknown, used and expired) and "act" (only from the one primary button). Neither puts the token in a query string or a log.
4. A scanner that runs scripts but does not press the button changes nothing. Residual risk, stated: a scanner that executes scripts and clicks every button would end one session of the new device, which at worst makes a parent sign in again. I accept it; the test `scanner with scripts on: no session ends` covers the load case, not an adversarial clicker.
5. The POST has a per-token and per-IP attempt limit with the IP held in memory only (file 08 section 9, last paragraph), constant answers, and a body size cap.
6. No click tracking and no redirector (file 08 section 6): the rendered link equals the generated one. How Resend turns tracking off is [U].

## 5. Q5: the HMAC key for the device hash

- **Name and place.** `DEVICE_HASH_KEY`, an Edge Function secret read only by the new sender function, by purpose, per SEC-R02 and SEC-R04 (one job, one function). Not in Vault, not in a database setting, not in the repo, tests, docs or the app (SEC-R03). This is stricter than file 08 Q5's default ("same place as S8"): the keyed hash of a 16-byte-or-longer random id is only as good as keeping the key apart from the table (file 08 section 4), and a database setting would sit in the same backups as the table. The hook never needs the key: the hash is computed in the sender, so Postgres holds only hashes (`04-secrets-keys-and-endpoints.md:54-55` shows the same split for `INVITE_CODE_PEPPER`, `RATE_SUBJECT_SECRET`).
- **Not the same key as other purposes.** Not `RATE_SUBJECT_SECRET`, not the purged-id key (`04...:344`), not the key for `security_events.subject_hash`. One purpose per key; the Resend `Idempotency-Key` stays a random per-event id (file 08 Q7).
- **Input.** The app's random device id must be at least 128 bits from the platform CSPRNG; then even a leaked key lets nobody test guesses. The function rejects a shorter id and treats it as no id. HMAC-SHA-256, truncated to 16 bytes, domain-separated by a fixed prefix string and the profile id, so the same phone in two accounts hashes differently.
- **Who.** The founder holds and sets the secret; no agent touches it (IAM-R23, SEC-R19). `ops` adds the row to `docs/ops/SECRETS.md` (name, holder, rotation, what breaks); this file adds no secret to any doc.
- **Rotation plan (overlap, no false alerts).**
  1. Founder sets `DEVICE_HASH_KEY_NEXT` beside `DEVICE_HASH_KEY`.
  2. The sender computes both hashes of the id it receives, matches a row on either, and on a match under the old key rewrites the row to the new hash ("re-key on sight"). Unseen on neither is new, as today.
  3. After 90 days (the row roll-off, file 08 section 7) every live row has been re-keyed or deleted. Founder removes the old key and renames next to current.
  4. No device is told "new" during the rotation; no column is added (no key version needed because both are tried).
  - On suspected exposure (SEC-R05: revoke first): the key alone lets an attacker test guesses of 128-bit random ids, which is not feasible, so the overlap rotation is enough and nothing is urgent beyond doing it. If the founder skips the overlap, every device is "new" once on its next sign-in and each sends one email (capped by the E81 hourly fold). That is a planned event the founder can choose, not a default.
  - Interval: yearly or on exposure [E]; the founder sets the date.
- **Missing key.** The sender fails closed on the hash step: with no key it sends no email and counts the failure (like the invite function, `supabase/functions/invite-redeem/handler.ts:108-109`, fails closed without its pepper). It must not hash with an empty key.
- **Enforced by:** not yet (a handler test that a missing or short key sends nothing; a grep test that no `DEVICE_HASH` value appears in the repo is the secret scanner's job, SEC-R03).

## 6. Q13: where the press audit row goes

- **Token row.** The token row: `used_at` and a closed `outcome` (`ended`, `already`, `noted`), written in the same statement that claims the token. No IP, no user agent, no address, no request detail beyond a 12-hex request id (file 08 section 6 "Audited, content-free"). Written on the press only, never on load.
- **Security events row (#1147 merged).** A row in `ops.security_events` through `public.ops_security_event_write(p_kind, p_n, p_subject_hash, p_request_id, p_detail)` (`20261111010000_audit_writers_security_events.sql:153-156`). Details I read there at the time:
  - the kind list is a closed check: `wrong_code_burst`, `invite_pause_tripped`, `step_up_failed`, `restore_requested`, `deletion_refused`, `alert_mail_ceiling` (lines 117-118). No press kind existed. Migration `20261121000000_new_device_sign_in.sql:101` (merged, #1182) now extends the check with `new_device_signed_out` (the press) and `new_device_hook_failed` (the counted fail-open);
  - `subject_hash` is a 16-byte keyed hash of a person computed by the caller (line 120, comment line 133); use the person hash that file already defines, not `DEVICE_HASH_KEY`;
  - `detail` takes only numbers and booleans under keys of a-z and underscore (`ops.security_detail_ok`, lines 106-111), so the outcome goes in as `{"ended": true}` or a count, never as a string;
  - `request_id` is 12 hex characters (line 121); retention 12 months by `ops_security_events_retention()`;
  - `alert_mail_ceiling` already exists, so the E81 ceiling hit (file 08 section 9, item 4) needs no new kind.
- **Cutover.** The sender writes the token row always; the kinds exist, so it also writes the `security_events` row in the same transaction. Test: one row per press, none on load, none on a second press.
- **Numbers.** #1147 (`20261111010000`) and the device migrations (`20261121000000`, `20261121010000`) are merged; the next migration takes the next free id.
- **Enforced by:** not yet.

## 7. Order of work and reviewers

| Step | Who builds | What | Gate before the next step |
|---|---|---|---|
| 0 | Karma | #1147 (`security_events`), #1176 and #1182 (hook, `ops_end_session`, sender functions, the two new kinds) are merged; PR #1152 settles Q1, Q6 to Q12 | done for the kinds; #1152 open |
| 1 | `security`, `sync` | Real-Auth proof harness: the local-stack runs P1 to P6 and A1 to A8, as a test with its output pasted. Test-only; any CI job is a proposal under `docs/ops/proposed/`, not a workflow edit | A3 and A4 results recorded. If A4 fails, section 3.4 is the design |
| 2 | `data-architect` (author), `data-steward` | Migration PR (largely merged as 20261121000000 and 20261121010000; check what remains): pending table, device table (file 08 section 4), token table, the hook function, `ops_end_session`, the added `security_events` kinds, sweeps, `grants.mjs` rows, level comments, access-matrix rows with deny cells (IAM-R24, DB-R12 and the grants rules in `CLAUDE.md`) | `npm run test:db` green; `classification.test.mjs` passes |
| 3 | founder | Applies the migration to hosted (the founder applies hosted migrations); switches the hook on in the dashboard; sets `DEVICE_HASH_KEY`, the new Resend key and the sender login role secret; runs H1 | hosted proof H1 and P7 pasted back |
| 4 | `sync` | Sender PR: the function, mail with PR #1077 words, cap (E81), `/not-you` page and its two POSTs, held line only after the lever is proved | file 08 section 13 and this file; each `[NS-08-R21 ...]` test has a mutant |
| 5 | founder, with `privacy` | Capability flag on; the store label row and policy line go to `legal` first (file 08 section 11) | privacy read on record |

Seats. Review of steps 2 and 4: `security-architect` (review path `supabase/migrations/**`, SEC-R01 new endpoint and surface, SEC-R13 a path named session or sign-in), `data-steward` (migration), `privacy` (file 08 section 13 item 10), `mobile` for the optional call and the next-open notice. `red-team` reads step 4 for the scanner and token cases. `qa` owns the CI check for step 1. The roster does not route `apps/web` pages to me; ask for the `/not-you` PR. I review the sender PR by the order in my charter: SHA pins and token permissions for any workflow, new secrets (SEC-R04), SQL checks (IAM-R14, R15, R03, R17, R24).

## 8. What is the founder's or counsel's

- Founder: switching the hook on in the dashboard; setting and rotating `DEVICE_HASH_KEY`, the Resend key and the login role secret; running H1; applying the migration; turning the capability flag on.
- Product: the E81 wording (file 08 Q8) and whether 48 hours is the number.
- Counsel (not answered here): whether the email is a duty (Q10), retention numbers (Q11), the Device ID label (Q9), export of devices seen (Q6).
- Privacy: reword file 08 section 13 item 2 about the session id (section 1 finding).

- Rotation note: a hex `device_hash` supplied by the app bypasses `DEVICE_HASH_KEY` and the rekey in the sender; it is already written under the NEXT key by `new-device-fill` while a next key is set.

## 9. What I did not verify

- Every hosted behaviour: the hosted Auth build, whether the access token hook switch exists in the CLI config, whether a role of ours may delete from `auth.sessions` on a hosted project, the real error name on a refresh after the delete, whether the pending-row insert sees the session row.
- That refresh tokens die by cascade when a session row is deleted: inferred from S2 and D2:166, not from the table definition.
- That the app's four sign-in methods call the hook with the names I assume.
- The Supabase docs were read from the public repo, not from the website; the website may differ from `master`.
- `apps/web` was not read; the `/not-you` page does not exist on `develop`.
- No code was run and no live service was contacted.
