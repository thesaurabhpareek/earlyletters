# Runbook: suspected data leak (the first hours)

Use this when anything suggests people's data reached someone who should not have it: a vendor breach notice, a secret found in a public place, odd access in logs, a report to `security@`, a bug that showed one family's book to another.
Rules: stay calm and factual, write down times as you go (UTC), and do not delete evidence. LEGAL-REQ-037 to -040, TDD 06 RB-5.

## 0. Start a log

Open one private note (not chat, not email) titled with the ticket number. Record: when you found out (this starts the notification clocks), who told you, what you saw. Every action below gets a line with the time.

## 1. Contain (minutes)

Pick what fits; each is reversible.

| Exposure | Action |
|---|---|
| Service role key or secret API key leaked | Rotate it now (SECURITY.md 2.5). Then redeploy both functions and update your shell |
| A function secret leaked (`PURGE_WORKER_SECRET`, Resend, PostHog, Apple key, `TOKEN_KEK`) | Rotate that one (SECURITY.md 2) |
| A person's session or device compromised | Supabase > Authentication > Users > the person > sign out of all sessions (only by ticket and with their request) |
| Everyone's sessions suspect | Rotate the JWT signing key: everyone signs in again; recording, reading and export keep working offline |
| A bug shows data across families | Ship the fix forward; if it is server-side, a migration; if needed, disable the RPC with a one-line `revoke execute ... from authenticated` until fixed |
| A vendor breached | Read their notice; rotate our keys at that vendor; ask them for affected tenant scope in writing |
| Purge or deletion must pause (evidence) | Place a legal hold on the affected scope (`legal_holds`, DATA-REQ-035) instead of stopping the worker for everyone |

Kill switches from LEGAL-REQ-040 (remote config) belong to the platform owner; use them if they exist by the time you read this.

## 2. Preserve (first hour)

- Do not delete logs, tables or Storage objects connected to the incident. Export the relevant Edge Function and API logs from the dashboard to your private incident folder (they hold no content by design, but may hold paths and IPs).
- Legal hold on the profiles or books involved, with `reason_code = 'safety_investigation'` or `'other'` and the ticket as `matter_ref`.
- Note the Supabase backup available from before the incident (Database > Backups); do not restore anything yet.

## 3. Scope (within one hour; LEGAL-REQ-039)

Run the enumeration with the narrowest scope you can justify; widen if unsure. It writes an audit row first.
```bash
SUPABASE_URL=https://<ref>.supabase.co SUPABASE_SERVICE_ROLE_KEY=... OPS_OPERATOR=<you> \
node scripts/ops/enumerate-affected.ts --project-ref <ref> --ticket <ticket> \
  --table entries --table children --from <start ISO> --until <end ISO> \
  --discovered-at <when you found out, ISO> --out ~/incident/<ticket>-affected.csv
# whole database: --all ; known people or books: --profile <uuid> / --child <uuid> ; photos: --bucket entry-photos
```
It prints how many people, letters and photos are in scope, people per data category, whether audio or escrow material exists on the server (both "no" in v1.0) and the notification clocks. The CSV (with emails) is mode 0600 in your private folder. Never attach it to email or chat.

What each category means for the notice:

| Category | Data | Level |
|---|---|---|
| `letter_text` | Letters they wrote (transcripts, text) | L4 |
| `book_content` | Letters and photos in a book they belong to | L4 |
| `child_identity` | Child's name, birthday or due date | L4 |
| `photos` | Photos attached to their letters | L4 |
| `profile`, `email` | Display name, how they sign, email address | L3 |
| `membership`, `consent_records`, `activity_log`, `dictionary` | Who belongs to which book, consent history, audit events, names dictionary | L3 / L4 for dictionary |

## 4. Decide (counsel)

Send counsel: the timeline, the categories and counts (not the list), the containment done and whether the data was encrypted (Postgres and Storage are encrypted at rest by Supabase, Unverified in writing, LEGAL-REQ-022). Counsel decides which laws apply and which clock is shortest (incident-notification.md).

## 5. Then

- Notify per [incident-notification.md](incident-notification.md).
- After the fix: run the log canary and the full test suites; add a test that would have caught it.
- Write a short blameless review in the incident folder: what happened, impact, what changed. Review `ops.audit_log` for the period (`select * from ops.audit_log where at > '<start>';`).
