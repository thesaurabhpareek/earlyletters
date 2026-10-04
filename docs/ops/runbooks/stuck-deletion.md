# Runbook: an account deletion has not finished

Alerts that point here: `request_stuck`, `step_failed`, `step_retrying`, `residue`, `apple_no_token`, `holds_review`. Also use it when someone writes in saying their account still exists after 30 days.

Promise being protected (data-policy section 5, DATA-REQ-036): live systems within 31 days of the request, backups within 38, processors within 45. The worker retries every step from 1 minute up to every 6 hours for 7 days, then marks it `failed` and stops that request.

All SQL runs in Dashboard > SQL Editor (it runs as `postgres`). Never paste results containing ids or emails into chat, tickets or email; keep them on screen.

## 1. Which request, which step

```sql
select d.id, d.status, d.requested_at, d.executing_at,
       s.step, s.status as step_status, s.attempts, s.last_error_code, s.next_attempt_at
  from deletion_requests d
  join deletion_request_steps s on s.request_id = d.id
 where d.kind = 'account' and d.status in ('executing', 'held')
 order by d.executing_at, s.step;
```
Steps run in this order and each waits for the one before: `storage_objects`, `apple_token_revoke`, `posthog` (always not applicable), `powersync_verify` (always not applicable), `email_provider`, `receipt_email`, `auth_user`. After them the worker verifies and finalizes. The receipt so far: `select receipt from deletion_requests where id = '<request>';`

## 2. What the error code means

| `last_error_code` | Meaning | Do |
|---|---|---|
| `http_5xx`, `timeout`, `network`, `rate_limited` | Vendor or Supabase hiccup | Nothing; it retries. If over a day, check the vendor status page |
| `config` | A secret is missing (Apple key, `TOKEN_KEK_V<n>`, Resend key) | Set it (SECURITY.md 1.1), then reset the step (section 3) |
| `invalid_client` | Apple rejects our key, Team ID or client id | Check `APPLE_TEAM_ID`, `APPLE_SIGNIN_KEY_ID`, the `.p8` contents and that the key has Sign in with Apple for `com.earlyletters.scribe` (SECURITY.md 5) |
| `decrypt_failed` | The stored Apple token does not open with its `TOKEN_KEK` version | A key was replaced instead of added. Restore the old value from the password manager as `TOKEN_KEK_V<n>` |
| `ownership` | Storage still records the person as owner of an object outside their own folders | Section 4 |
| `storage_error`, `budget` | A large folder or a Storage error | Usually clears on the next runs; if not, see purge-failing.md |
| `http_401`, `http_403` from Resend | Key revoked or lacks permission | New sending key (SECURITY.md 2.2) |
| a 5-character SQLSTATE | A database function refused | Read the function named by the step in `supabase/functions/purge-worker/account.ts`; fix forward with a migration |
| none, status `held` | A legal hold covers the account or one of its letters or books | Section 5 |

## 3. After fixing the cause: retry now

```sql
update deletion_request_steps set status = 'pending', next_attempt_at = now()
 where request_id = '<request>' and step = '<step>';
select public.ops_audit_write('<your handle>', 'deletion', 'step_reset', '<ticket>', null, null, null,
  jsonb_build_object('step', '<step>'));
```
Then start a run instead of waiting up to 15 minutes:
```bash
curl -sS -X POST "https://<ref>.supabase.co/functions/v1/purge-worker" \
  -H "Authorization: Bearer $PURGE_WORKER_SECRET" -H "apikey: <publishable key>" \
  -H 'Content-Type: application/json' -d '{"task":"run"}'
# 202 {"ok":true,"data":{"accepted":true,...},"requestId":"<12 hex>"}; find that requestId in Edge Function logs
```

## 4. `ownership`: objects the person still owns

```sql
select public.ops_storage_owned_by('<former profile id>', 100);
```
- In `{child}/{their id}/...` or `{their id}/...`: the worker deletes these itself; if they persist, delete them in Dashboard > Storage (the dashboard uses the Storage API). Never `delete from storage.objects` in SQL: it orphans the file.
- A book's photo (`child-photos/{child}/...`) in a book that survives: the worker copies it to a new name, points the book at it and deletes the old one. If it keeps failing, do the same by hand in the dashboard and `select public.ops_set_child_photo_path('<child>', '<old name>', '<new name>');`
- Anything else (another person's folder, an unknown bucket): stop and look. That is a path-rule bug, not a deletion problem; do not delete another family's object.

## 5. Held requests and holds past review

```sql
select scope, reason_code, matter_ref, placed_at, review_by from legal_holds where released_at is null;
```
A held request waits on purpose (DATA-REQ-035). When counsel releases the hold: `update legal_holds set released_at = now(), released_by = '<handle>' where id = '<hold>';` and the next hourly purge moves the request on. `holds_review` means a hold passed its `review_by` date: ask counsel, then extend `review_by` or release.

## 6. `residue`: verification found something

The worker found a column, a Storage folder, an owned object or the Auth user still pointing at the person, and did not finalize.
```bash
SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... OPS_OPERATOR=<you> \
node scripts/ops/verify-deletion.ts --project-ref <ref> --ticket <ticket> --profile <former profile id> --request <request id>
```
`postgres: no column ... holds the person id` names the table. A new table with a person id and no `on delete cascade` or nulling is a schema bug: fix forward with a migration (and add the column to `finalize_account_deletion` or a cascade), then reset the step or start a run. Never hand-delete rows of other people.

## 7. `apple_no_token`

Informational: the person signed in with Apple but we hold no refresh token (the sign-in exchange failed or predates the `apple-token` function). Deletion completed; the receipt says `apple: no_token`. Nothing to revoke from our side. If this appears for new accounts, the capture side is broken (SECURITY.md 5).

## 8. When the published deadline will be missed

If a request will pass 31 days (live) or 45 days (processors): fix first, then tell the person in plain words from `hello@` (or `privacy@`), with the request reference and the new date. Note it in the ticket. Ask counsel whether the delay affects a rights-request clock (CCPA 45 days).

## 9. Check the end state

Run the verify script from section 6. Every line must say PASS. The PostHog check needs the analytics ids, which only the person's phone has; skip it unless they provide them.
