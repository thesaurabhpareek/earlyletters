# Recording backup and the recovery key: runbook

For the founder. Stream S05, server half. Written 15 Oct 2026 for the alpha (TestFlight with server features on, against staging, for the founding family, Thu 29 Oct 2026).

What this covers: the `entry-audio` bucket and the backup tables (migration `20261023000000_backup_server.sql`), the separate escrow project and its one function (`supabase/functions/escrow`), the escrow key ceremony, custody, rotation, and what each alert means. Spec: PRD V2 F08 section 6.5 (C, D, G) and F17 section 8.4. Decision: D-102 (formerly D-091, PR #128): keep server escrow, say so plainly, the key runs only in a separate project and one function, every use is logged and emailed.

Nothing here has been run against a hosted project. Agents never apply migrations, set secrets or deploy functions (COORDINATION section 6); every step below is yours.

## 1. What runs where

```
 phone                         main project (staging, later prod)           scribe-escrow project
 -----                         ----------------------------------           ---------------------
 book key (Keychain, synced)   entry-audio bucket: ciphertext only          escrow function (only function)
 device key (this phone only)  audio_blobs, child_keys (escrow wraps),      ESCROW_PRIVATE_KEY_V<n> (only copy
 encrypts, wraps BK to the     backup_devices, restore_requests,              outside the two sealed papers)
 escrow PUBLIC key             restore_approvals, escrow_unwraps (log),
                               escrow_rotation_notices
                               role escrow_svc: EXECUTE on 10 escrow_*  <---  connects as escrow_svc over TLS
                               functions, no table access                    verifies user JWTs with the main
                               user JWT signing keys (JWKS)            --->  project's public JWKS
                                                                             sends owner emails via Resend
```

- The escrow private key exists in one function secret in one project that holds nothing else, and on two sealed paper copies. Never in the main project, a password manager, a laptop file, CI or a chat.
- The main project never sees a book key in the clear. A compromise of any main-project function (`purge-worker`, `config`, `content`, `analytics-forget`, later `push-send`, `apple-token`, `invite-redeem`, the status endpoint) reaches neither the key nor the escrow role.
- The function imports nothing from outside `supabase/functions/escrow/` and nothing remote (a test fails otherwise), so no main-project code runs next to the key.

The honest limit (F08 6.5 C, for the Privacy Policy): anyone holding the escrow private key (the escrow project's secret, or a paper copy) plus a copy of the main database and the bucket could open recordings offline, with no log row and no email. The controls on that path are custody (section 4), the quarterly seal check, and the release isolation check (step B9). The product copy claims only what the function proves: it logs every use and emails the owner each time.

Other honest limits, so nobody reads more into the controls than they give:
- The access log's append-only trigger binds every role but a superuser. A superuser (the `postgres` role in the SQL editor, or anyone with the database password) can set `session_replication_role = replica`, which skips triggers, and then edit or delete log rows. The daily copy in `ops-ledger/escrow/` (a new file per day per run, never overwritten) is what shows that afterwards; compare it with the table when an alert or a restore makes you doubt the table (section 6).
- The service role still bypasses RLS on every other table. It has no table privilege on the backup tables (only the `backup_svc_*` functions), but a leaked service key is still an incident.
- A stolen session that keeps a fresh device registered for 7 days can approve its own later request. The request email with its Stop link still goes to the account address first, and Settings > Devices shows every device; a "new device" email is requested of S01 (PR body).
- The escrow function zeroes the key bytes it decodes at the end of every call, but the secret itself stays in the function's environment for the life of the worker; that is the custody boundary (section 4).

## 2. Before the alpha (in order)

Each step has a check. Stop at the first check that fails.

### B1. Apply the migration to staging
Through `deploy-db.yml` with the `approve-migration` label (S02's APPLY section for this file, appendix A). Then publish version 1.0.0 of the `backup` consent document once counsel has seen the backup lines (F08-REQ-037, F08-REQ-039). Until a version is published, every backup call answers SCCON and nothing uploads.

Check:
```sql
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'entry-audio';
-- expect: entry-audio | false | 20971520 | {application/octet-stream}
select key from policy_documents where key = 'backup';                        -- 1 row
select rolcanlogin from pg_roles where rolname = 'escrow_svc';                 -- false (not yet)
```
If the bucket row is missing (a hosted project refused the insert), create it in Storage > New bucket with exactly: name `entry-audio`, Public off, file size limit 20 MB, allowed MIME type `application/octet-stream`. Never make it public.

### B2. Main project: asymmetric JWT signing keys
Authentication > JWT Keys (dashboard): make sure the current signing key is asymmetric (ECC P-256 or RSA). The escrow function accepts only ES256 or RS256 tokens and refuses HS256, so it never needs the shared JWT secret.

Check: `curl -s https://<main-ref>.supabase.co/auth/v1/.well-known/jwks.json` lists at least one key with `"kty":"EC"` or `"kty":"RSA"`.

### B3. Give escrow_svc a login (main project, SQL editor)
```sql
-- Generate the password on your Mac: openssl rand -base64 33 | tr -d '/+=' | cut -c1-40
alter role escrow_svc with login password '<the password>';
```
The password goes only into the escrow project's `ESCROW_DB_URL` secret (step B5). Do not store it anywhere else; if it is lost, set a new one.

Check:
```sql
select rolcanlogin, rolsuper, rolbypassrls, rolconnlimit from pg_roles where rolname = 'escrow_svc';   -- true | false | false | 5
select pg_has_role('authenticator', 'escrow_svc', 'member');                                        -- false (the Data API cannot become it)
select count(*) from pg_auth_members where member = 'escrow_svc'::regrole;                          -- 0
```
Never `grant escrow_svc to authenticator` and never grant it a table.

### B4. Create the escrow project
Supabase dashboard, New project: name `scribe-escrow`, region us-west-1 (same as main), Pro plan (about $25 a month, F08 Q9). In it:
- Create no tables, enable no extensions, and do not use its database.
- Settings > API: turn off the Data API (nothing should be exposed).
- Deploy no function other than `escrow`.
- Invite no one else. Turn on two-factor sign-in for your Supabase account if it is not on.

Download the main project's database CA: main project > Database settings > SSL configuration > Download certificate.

### B5. Escrow project secrets (Edge Functions > Secrets)

| Name | Value | Secret? |
|---|---|---|
| `ESCROW_PRIVATE_KEY_V1` | from the key ceremony (section 3); staging uses the drill key | yes, the key |
| `ESCROW_SWITCH` | `on` (anything else pauses the function) | no, a switch |
| `ESCROW_DB_URL` | `postgresql://escrow_svc.<main-ref>:<password>@aws-0-us-west-1.pooler.supabase.com:5432/postgres` (session pooler) | yes |
| `ESCROW_DB_CA` | the PEM from step B4 (required: without it the function answers 503 and opens nothing) | no |
| `MAIN_SUPABASE_URL` | `https://<main-ref>.supabase.co` | no |
| `RESEND_API_KEY` | a Resend key with sending access only, restricted to the earlyletters.com domain, made for this project alone | yes |
| `ALERT_EMAIL` | optional; defaults to the support address | no |
| `MAIL_FROM` | optional; defaults to the sender in the email templates | no |
| `ESCROW_VERSION` | optional, for logs | no |

Only during a rotation (section 5): `ESCROW_PRIVATE_KEY_V2`, `ESCROW_TASK_SECRET`, `ESCROW_ROTATE_FROM`, `ESCROW_ROTATE_TO`. Remove them when it ends.

These nine settings (F08-REQ-034 as amended by the founder on 15 Oct 2026) are longer than F08 6.5 G2's three secrets: the function also needs the Resend key (it emails the owner itself, before any key leaves) and the CA (to verify the database it talks to). The release check (B9) must use this list.

### B6. Deploy the function (escrow project only)
For the alpha, from your Mac (later only from CI on a release tag, through a GitHub environment that needs your approval):
```bash
npx supabase functions deploy escrow --project-ref <scribe-escrow-ref> --no-verify-jwt
```
`--no-verify-jwt` because the caller's token is from the main project; the function checks it against the main project's JWKS itself. Never run this command against the main project.

Checks (from your Mac):
```bash
F=https://<scribe-escrow-ref>.supabase.co/functions/v1/escrow/v1/restore-requests
curl -s -X POST "$F" -d '{}'                      # {"ok":false,"error":{"code":"bad_request",...}}
curl -s -X POST "$F" -H 'authorization: Bearer x.y.z' -d '{"device_id":"00000000-0000-4000-8000-000000000000"}'   # unauthorized
```
Then the real one on staging with a test account of the Asha family: sign in on phone A, turn backup on, record, wait for "Backed up"; sign in on phone B (iCloud Keychain off) and confirm the request email arrives, the hold is 72 hours, phone A shows the request, and the "We used your recovery key" email arrives when it releases. Phone A can approve (Yes, it's mine) only once it has been enrolled for 7 days, so on a fresh staging setup either backdate phone A in the SQL editor (`update backup_devices set enrolled_at = now() - interval '8 days' where device_id = '<phone A>';`, staging only, never production) or let the hold run. Confirm `amr` step-up: on phone B, sign out, sign in, wait 11 minutes, ask again: the app must ask you to sign in again. Confirm the stop link: tap Stop in the email, then ask again on phone B with the same app session: the function must answer `unauthorized` (`session_ended`).

### B7. Switch on, in the main project
```sql
alter database postgres set app.backup_enabled = 'on';
alter database postgres set app.escrow_enabled = 'on';
alter database postgres set app.escrow_key_versions = '1';
```
`app.consent_pepper` must already be set (APPLY.md step 6; account deletion stops with 55000 without it, by design).

Off, in seconds, if anything looks wrong: `alter database postgres set app.escrow_enabled = 'off';` (no key opens) and, in the escrow project, `ESCROW_SWITCH` to `off`. Uploads: `app.backup_enabled = 'off'`. Reading and restoring what is already backed up never switches off.

### B8. Turn on the purge worker's backup steps
Nothing to do: the daily task (`{"task":"daily"}`) already copies the access log to `ops-ledger/escrow/YYYY-MM-DD.run-<UTC stamp>.jsonl` (a new file each run, never overwritten; missed days of the past week are backfilled) and runs the sweep once the purge worker is redeployed from this branch. Check the next day: Storage > ops-ledger > escrow has a file for any day with an unwrap. Never delete or edit these files by hand; the worker removes them after 60 days.

### B9. Release isolation check (until S20's `scripts/release/escrow-isolation.mjs` exists)
Before each release, in the dashboard:
- Main project, Edge Functions: no function named `escrow`. Secrets: no name starting `ESCROW_`.
- Escrow project, Edge Functions: exactly one function, `escrow`. Secrets: only the names in B5.
- Both projects: each deployed function's version matches the release commit.
Write the result and the date in `ops.audit_log` (`ops_audit_write`, runbook `release_check`).

## 3. The key ceremony (WP-F08-B8; F08 6.5 G1)

Two key pairs: production (version 1) and a drill pair for staging (also version 1, in the staging escrow project only; the production key never touches staging).

- K1. Use a computer you can take off every network (Wi-Fi off, cable out, Bluetooth off) for the whole ceremony. Have Deno installed and this repository checked out beforehand.
- K2. Networking off. Run `deno run --no-prompt supabase/functions/escrow/tools/keygen.ts 1`. It runs with no permissions: it cannot read files, the environment or the network, and writes nothing to disk.
- K3. Write the PRIVATE line by hand on two sheets (or print to a printer that is not networked), check each against the screen character by character, and seal each in a numbered tamper-evident bag. Store the bags in two different places.
- K4. Copy the PUBLIC line (base64 and hex) to paper too; it is safe to share.
- K5. Quit the terminal and reboot the computer before networking comes back.
- K6. Open one bag, type the private key once into the escrow project's `ESCROW_PRIVATE_KEY_V1` secret, and reseal it in a new numbered bag. Send the public key to S07 for `packages/api/src/escrow-keys.ts`.
- K7. Record in `ops.audit_log` (runbook `escrow_ceremony`): date, the bag numbers, where each bag is, and every later opening.

Quarterly: check both seals and the bag numbers against the log (F17 8.2 item 6 c).

## 4. Custody rules
- The private key is never typed anywhere except the escrow project's secret, never photographed, never pasted into a password manager, chat, email, ticket or terminal on a networked machine.
- Staff have no tool that calls the function. A `legal` use needs a written runbook entry with the legal order and your sign-off, and an `ops.audit_log` row; it is not built in this release.
- If you suspect the key has been seen by anyone: switch escrow off (B7), rotate (section 5), and treat it as an incident (docs/ops/runbooks).

## 5. Rotation (F08 6.5 G4, F08-REQ-030)
- R1. Ceremony for version 2 (section 3, `keygen.ts 2`).
- R2. S07 adds the v2 public key to `escrow-keys.ts` and the app release makes new wraps with it.
- R3. Main project: `alter database postgres set app.escrow_key_versions = '1,2';` and, to start the rotation, `alter database postgres set app.escrow_rotation = '1:2';`. Without that exact pair the escrow role cannot list or rewrap any wrap, or read any address for the rotation emails (SCBKO `rotation`), so outside a rotation it reads wraps only for a released restore.
- R4. Escrow project: add `ESCROW_PRIVATE_KEY_V2`, `ESCROW_TASK_SECRET` (`openssl rand -hex 32`), `ESCROW_ROTATE_FROM=1`, `ESCROW_ROTATE_TO=2`.
- R5. Call until `remaining` is false and `notices_pending` is 0: `curl -s -X POST https://<scribe-escrow-ref>.supabase.co/functions/v1/escrow/v1/rotate -H "authorization: Bearer $ESCROW_TASK_SECRET"`. Each call walks up to 200 keys in batches of 50, one commit each, writes a `rotation` log row per key, then sends every account whose key moved its one email (a failed send stays due and goes on the next call). A non-zero `failed` means a wrap did not open: it is passed over (the rest still move) and tried again on the next call; if it stays failed, stop and read section 6. A `paused` answer (SCBKO) means `app.escrow_rotation` in the main project does not name exactly `ESCROW_ROTATE_FROM:ESCROW_ROTATE_TO` (or escrow is switched off).
- R6. Check `select count(*) from child_keys where escrow_key_version = 1;` is 0 and `select count(*) from escrow_rotation_notices where to_version = 2 and sent_at is null;` is 0. Then `alter database postgres reset app.escrow_rotation;`, remove `ESCROW_PRIVATE_KEY_V1`, `ESCROW_TASK_SECRET` and the two `ESCROW_ROTATE_*` secrets, set `app.escrow_key_versions = '2'`, and destroy the v1 paper copies, recording it in `ops.audit_log`.

## 6. What an access-log alert means

The function emails `ALERT_EMAIL` with a subject `Escrow alert: <kind>` and no ids (kinds: `limit_restores`, `limit_keys`, `decrypt_failed`, `unknown_key_version`). Look anything up only through an audited runbook query (`ops_audit_write` first).

| Alert or sign | What it means | What to do |
|---|---|---|
| `limit_restores` or `limit_keys` | An account asked for a 4th new-device restore in 30 days, or more than 20 keys in a day (F08 6.5 C8). Either a person struggling with phones, or someone trying to get recordings | Look at that account's `restore_requests` (state, cancel_source, times). If the owner did not ask, keep escrow on (holds still protect them) and write to the owner from support |
| `decrypt_failed` | A wrap did not open with the key for its version. Data corruption, a phone bug, or someone writing wraps into the table | Count `escrow_unwraps` rows with `outcome = 'failed'` in the last day. One account: open a support case. More than one: switch escrow off (B7) and treat as an incident |
| `unknown_key_version` | A wrap targets an escrow key version this project does not hold | A rotation in progress lost a secret, or a phone used a public key that was never live. Check secrets against `app.escrow_key_versions` |
| A `restore` row whose request was never released | The function opened keys but the email or release failed; nothing was delivered | Normal after a Resend outage; the phone retries. Many in a day: check Resend |
| A row with reason `legal` | Only from the legal runbook | It must match an `ops.audit_log` legal entry with your sign-off. If not: incident |
| An owner says "I got an email I did not expect" | Someone signed in and asked for their recordings | Ask them to tap Stop in the email or in Settings > Storage and backup (Stop signs every session out, and the function then refuses that sign-in's token at once). Check `restore_requests` for that account; the hold gives you 24 to 72 hours |
| Two "We used your recovery key" emails for one request | The same new phone collected its keys twice within the 24-hour window (an app killed after release). Each opening is logged and emailed on its own | Normal once. More than twice for one request: look at that account's `escrow_unwraps` |
| A file `ops-ledger/escrow/<date>.run-*.jsonl` holds a row the table no longer has (other than rows older than 24 months) | Rows were removed outside the trigger (only a superuser can, with `session_replication_role`), or a database restore rolled them back | Incident if no restore explains it. The files are the record that survives both |

## 7. Disaster recovery (F08 6.5 G5)
A main-project database restore does not touch the escrow project or its secret. After a restore: set the `escrow_svc` password again (B3), update `ESCROW_DB_URL` in the escrow project, and replay the purge ledger as APPLY.md says. Recordings in the bucket follow the Storage restore in RB-8. The restore drill uses staging, synthetic Asha accounts and the drill key; the production key is never copied for a drill.

## Appendix A. APPLY section for S02 (supabase/APPLY.md)

S02 owns `supabase/APPLY.md`; this is the text for the section of this file, to paste as it stands (renamed again only if develop gains a later file before merge).

> ### File `20261023000000_backup_server.sql` (S05: encrypted recording backup and the recovery key)
> What it does: the private `entry-audio` bucket and its owner-only policies; tables `backup_devices`, `child_keys`, `audio_blobs`, `backup_usage`, `restore_requests`, `restore_approvals`, `escrow_unwraps` (append-only), `escrow_rotation_notices`, none of them granted to `service_role`; the `backup` policy document; client RPCs `backup_*`; the `escrow_svc` role (created NOLOGIN) with EXECUTE on ten `escrow_*` functions only; service functions `backup_svc_sweep`, `backup_svc_unwraps_between`, `backup_svc_stop`; triggers on `entries`, `profiles` and `deletion_requests` so every deletion path removes backups by exact path; `purge_ledger.entity_type` gains `audio_blob` (no value removed).
> Depends on: every earlier file. Needs `app.consent_pepper` set before any account deletion (step 6).
> Apply: through `deploy-db.yml` (docs/ops/DEPLOY.md: staging on the push to `develop` that carries this file, after the `staging` reviewer approves; production on a `db-v*` tag). Approve Deploy database before the functions run that redeploys `purge-worker`, which calls `backup_svc_sweep`.
> Check (expect each):
> ```sql
> select count(*) from pg_class c join pg_namespace n on n.oid = c.relnamespace
>  where n.nspname = 'public' and c.relname in ('backup_devices','child_keys','audio_blobs','backup_usage','restore_requests','restore_approvals','escrow_unwraps','escrow_rotation_notices')
>    and c.relrowsecurity;                                                        -- 8
> select count(*) from information_schema.role_table_grants
>  where grantee = 'service_role' and table_name in ('backup_devices','child_keys','audio_blobs','backup_usage','restore_requests','restore_approvals','escrow_unwraps','escrow_rotation_notices');  -- 0
> select public, file_size_limit from storage.buckets where id = 'entry-audio';  -- false | 20971520
> select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
>  where n.nspname = 'public' and has_function_privilege('escrow_svc', p.oid, 'execute');   -- 10
> select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
>  where n.nspname = 'public' and p.proname like 'escrow\_%'
>    and (has_function_privilege('anon', p.oid, 'execute') or has_function_privilege('authenticated', p.oid, 'execute')
>         or has_function_privilege('service_role', p.oid, 'execute'));          -- 0
> select pg_get_constraintdef(oid) from pg_constraint where conname = 'purge_ledger_entity_type_check';  -- includes 'audio_blob' and every earlier kind
> select count(*) from information_schema.columns where table_name = 'child_keys' and column_name = 'key_check';  -- 1
> select tgname from pg_trigger where tgname in ('entries_backup_forget','profiles_pseudonymise_escrow_unwraps','deletion_requests_backup_cancel','escrow_unwraps_guard','escrow_unwraps_no_truncate') order by 1;  -- 5 rows
> ```
> Advisors: expect 0029 "authenticated can execute security definer function" for `backup_register_device`, `backup_revoke_device`, `backup_store_key`, `backup_begin`, `backup_confirm`, `backup_discard`, `backup_delete_all`, `backup_pending_requests`, `backup_approve_request`, `backup_cancel_request` and the Storage helpers `backup_object_writable`, `backup_object_readable`. Each starts with `require_user()` or checks `auth.uid()` and `is_anonymous()`. Anything else new: stop and ask.
> Settings after apply (off until then, fail closed): `app.backup_enabled`, `app.escrow_enabled`, `app.escrow_key_versions` (docs/ops/BACKUP_RUNBOOK.md B7); `app.escrow_rotation` only during a rotation (section 5).
> Rollback (only before any real recording is uploaded; after that, switch off with B7 instead and never drop the tables, because the log must stay 24 months):
> ```sql
> begin;
> alter database postgres reset app.backup_enabled; alter database postgres reset app.escrow_enabled;
> drop trigger if exists entries_backup_forget on public.entries;
> drop trigger if exists profiles_pseudonymise_escrow_unwraps on public.profiles;
> drop trigger if exists deletion_requests_backup_cancel on public.deletion_requests;
> drop policy if exists entry_audio_owner_insert on storage.objects; drop policy if exists entry_audio_owner_update on storage.objects;
> drop policy if exists entry_audio_owner_read on storage.objects; drop policy if exists entry_audio_no_anonymous on storage.objects;
> drop table if exists public.escrow_unwraps, public.restore_approvals, public.restore_requests, public.backup_usage,
>   public.audio_blobs, public.child_keys, public.backup_devices, public.escrow_rotation_notices cascade;   -- the truncate guard goes with the table
> drop function if exists public.backup_switch_on(text), public.backup_escrow_key_trusted(int) cascade;  -- and the other functions of this file
> delete from storage.buckets where id = 'entry-audio';   -- only if empty
> delete from public.policy_documents where key = 'backup' and not exists (select 1 from public.policy_versions where document = 'backup');
> revoke usage on schema public from escrow_svc; drop role if exists escrow_svc;
> commit;
> ```
> `purge_ledger_entity_type_check` keeps `audio_blob` (harmless; removing it would fail on any ledger row of that kind).
