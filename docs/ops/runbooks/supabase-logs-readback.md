# Runbook: read back what Supabase logs on staging, and who can read it (BL-603, SEC-10)

Status: written 8 Nov 2026, **NOT RUN**. Agents did not open the staging project or its logs. Every step below that needs the dashboard is a founder step. The record goes in `docs/legal/evidence/` using `TEMPLATE-supabase-logs-staging.md`.

Why: staging holds the family's letters during the alpha. A sign-in email link makes the phone send a one-time token in the address of a GET request to Supabase (`apps/mobile/src/lib/auth/email-link.logic.ts` `verifyUrl`: `/auth/v1/verify?token=...&type=...&redirect_to=...`). Whatever Supabase writes down about that request, and whoever can read it, is part of what we know about our own data (AF-06, SR-12).

## 1. What the app sends, from the code (read on develop)

- The link in the email is `https://earlyletters.com/auth/callback#token_hash=...`. A fragment (after `#`) is not sent to a server by the phone's browser or universal link handling; the app reads it locally (`apps/mobile/src/lib/auth/links.logic.ts`, `email.ts` header comment).
- The app then sends `GET <supabase>/auth/v1/verify?token=<hash>&type=<type>&redirect_to=<url>` without following the redirect (`email.ts` `verifyEmailLinkPkce`). So the token hash does reach Supabase in a query string.
- The 6-digit code path (`verifyEmailCode`, `verifyOtp`) sends the code in a request body, not in an address.
- No other place in `apps/mobile/src` builds an address with a token in its query string (pinned by the `[BL-603]` test `apps/mobile/test/auth-token-in-url.test.ts`).

## 2. What the vendor says (pages read 8 Nov 2026; nothing here was checked on our project)

| Fact | Source |
|---|---|
| Retention "depends on your pricing plan"; the Studio logs page gives no figures and does not say whether query strings are logged. | https://supabase.com/docs/guides/telemetry/logs |
| API Gateway (`edge_logs`) fields include `request.path`, `request.search`, `request.url` (the page does not define the last two), client IP header fields and the captured request headers including `user-agent` and `referer`. Other headers are omitted. The page has no field table for Auth logs, no request-body statement and no retention statement. | https://supabase.com/docs/guides/observability/log-field-reference |
| The Auth audit log records `timestamp`, `user_id`, `action`, `ip_address`, `user_agent`, `metadata`; `ip_address` is recorded only for some events and is empty for most sign-up, sign-in, sign-out and token events. It says which roles can view logs nowhere, and gives no retention. | https://supabase.com/docs/guides/auth/audit-logs |
| Log drains are Pro, Team and Enterprise only; "Archive logs to S3 for long-term retention and compliance." | https://supabase.com/docs/guides/observability/log-drains |
| Pricing table, "Log retention (API & Database)": Free 1 day, Pro 7 days, Team 28 days, Enterprise 90 days. Auth audit logs: Free 1 hour, Pro 7 days, Team 28 days. This is a sales page, not a guarantee; the dashboard is the evidence. | https://supabase.com/pricing |

Unverified, so the read-back must settle them: whether `request.search` holds the `token=` value for `/auth/v1/verify`; what Auth logs contain; which staging plan applies; who in the organization can read logs.

## 3. Founder steps (staging organization only; NOT RUN)

1. Sign in to the Supabase dashboard with the founder account. Open the staging project. Note the plan shown under Organization > Billing.
2. On a test phone, sign in as the fictional Asha address with the email link (not the code). Note the UTC minute.
3. Logs: open the API Gateway logs and the Auth logs for that minute. Find the `/auth/v1/verify` row. In its raw view, write in the template, section A, whether each item is present. Do not copy values (no token, no IP, no address) into the template: write yes or no.
4. Authentication > Audit Logs: check the same row; fill the Auth audit log column.
5. Section B: write the retention each log page shows. If a figure is not shown, write "not shown".
6. Log drains: Project Settings > Log Drains (or Integrations). Write whether any exists. Expected: none.
7. Section C: Organization > Team lists the members and roles. Write count and roles only. Then Account > Access Tokens: list token names, not values.
8. Connector check (BL-603 acceptance 2): in the Claude and any other agent client the founder uses, open the connector list and check each Supabase connector's organization. Expected: none can reach the staging organization (ADR 0026 point 10; `docs/release/AUTOMATION.md` 0.1 item 8). If one can, disconnect it or move the staging projects to an organization it is not authorized for; write what you did.
9. Save the filled template as `docs/legal/evidence/supabase-logs-staging-<yyyy-mm-dd>.md` in a PR.

## 4. If the token does appear in a log

- The token hash is one-time. Write in section A how long it lives on staging.
- If the answer is "too long" or the log can be read by someone beyond the founder, open an issue labelled `from:security-architect`; the lever is to steer sign-in to the 6-digit code (request body) before outside testers join. Do not ship that change tonight: it touches sign-in screens.
- Whether the privacy notice needs to say anything is a question for `legal` and the founder.

## 5. What this does not cover

Production (it does not exist yet), Edge Function logs, Storage logs, PostHog, Resend. Add a section per system when the founder reads it.
