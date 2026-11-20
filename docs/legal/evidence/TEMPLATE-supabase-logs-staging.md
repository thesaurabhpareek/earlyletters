# Supabase logs on staging: read-back (copy to `supabase-logs-staging-<yyyy-mm-dd>.md`)

Every value below is read by the founder in the staging organization's dashboard. Agents never fill this in from memory or from vendor pages. Do not write an email address, a user id, a token hash or any letter text here.

- Date read (UTC): NOT RUN
- Read by: NOT RUN
- Staging plan (Free, Pro, Team): NOT RUN
- Dashboard pages used (names only): NOT RUN

## A. What is recorded for one sign-in with an email link

Do one sign-in with the fictional Asha test address, then open the logs for that minute.

| Item | API Gateway log | Auth log | Auth audit log |
|---|---|---|---|
| Request path (`/auth/v1/verify`) recorded | NOT RUN | NOT RUN | NOT RUN |
| Query string recorded (does it include `token=`?) | NOT RUN | NOT RUN | NOT RUN |
| `redirect_to` value recorded | NOT RUN | NOT RUN | NOT RUN |
| Source IP address recorded | NOT RUN | NOT RUN | NOT RUN |
| User agent recorded | NOT RUN | NOT RUN | NOT RUN |
| User id recorded | NOT RUN | NOT RUN | NOT RUN |
| Email address recorded | NOT RUN | NOT RUN | NOT RUN |

If the query string with `token=` is recorded: the value is a one-time token hash that stops working after one use or when it expires. Write how long it stays valid on staging (the hosted value, read in Authentication > Email settings): NOT RUN.

## B. How long

| Log | Retention shown in the dashboard | Plan page says |
|---|---|---|
| API Gateway and Postgres logs | NOT RUN | NOT RUN |
| Auth audit log | NOT RUN | NOT RUN |
| Log drains to anywhere else (should be none) | NOT RUN | n/a |

## C. Who can read them

| Question | Answer |
|---|---|
| People in the Supabase organization, with their role (names or initials, not emails) | NOT RUN |
| Any role other than the founder | NOT RUN |
| Personal access tokens or connectors that can reach the organization (list names, not values) | NOT RUN |
| Any agent session or connector able to open this organization (BL-603 acceptance: none) | NOT RUN |

## D. Decision

- Does this match what the privacy notice says about logs? NOT RUN (a legal question: route to `legal` and the founder; engineering does not answer it).
- Anything to change (for example turn on the 6-digit code path, shorten retention, remove a member): NOT RUN
