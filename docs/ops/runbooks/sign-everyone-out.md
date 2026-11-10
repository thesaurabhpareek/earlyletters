# Runbook: end sessions for one person or for everyone (BL-597, SEC-04)

Status: written 8 Nov 2026, **NOT RUN**. Nothing below has been tried on a Supabase project. The steps marked "drill" are the ones that decide which lever really works; until the founder has run them and written the answer in section 5, treat every lever as unproven.

Use this when a session may be in the wrong hands (a lost phone, a suspected takeover) or before a risky change. For lost access or a takeover report, start with the account-recovery runbook (`docs/ops/runbooks/account-recovery.md`, PR #620); this page is the "end sessions" step it points to. LEGAL-REQ-040; F02-REQ-023.

## 1. What we know and what we do not

Read on 8 Nov 2026 (each page fetched that day):

| Fact | Source |
|---|---|
| With the signing keys system, rotating a key signs no one out: "No users get signed out." Access tokens signed with the old key keep working until they expire. | https://supabase.com/docs/guides/auth/signing-keys |
| The same page does not mention refresh tokens at all, so it does not say whether revoking a key stops a phone from refreshing. | same page |
| With the legacy JWT secret, revoking it: "Currently active users get immediately signed out." That is the legacy secret, not the signing keys system. Which one staging uses is not known here. | same page |
| Supabase products (Auth, Data API, Storage, Realtime) do not use the public-key cache, so revoking a key is instant for them; the cache clears every 20 minutes for outside checkers. | same page |
| `signOut` scope `global` (default) invalidates all of the user's sessions on the server first. Scope `local` removes the session on the phone and then makes a best-effort request to revoke the refresh token; if that request fails "the server may keep the refresh token until it expires". Scope `others` invalidates every other session. | https://supabase.com/docs/reference/javascript/auth-signout |
| "There is no way to revoke a user's access token jwt until it expires." Our `jwt_expiry` in `supabase/config.toml:41` is 900 seconds (the local setting; the hosted value is unverified). | same page |
| Admin `signOut(jwt, scope)` "removes a logged-in session" and needs "a valid, logged-in JWT". The page lists no scope values and does not say a user id will do. So support cannot use it without the person's own token. | https://supabase.com/docs/reference/javascript/auth-admin-signout |
| Admin `updateUserById` "Changes are applied directly without confirmation flows." The page says nothing on whether a ban (`ban_duration`) or an email change ends existing sessions. | https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid |
| When a session is signed out, its refresh tokens are marked revoked; reuse outside the reuse interval ends the whole session. Inactivity timeouts and time-boxed sessions exist, but a single-session limit is Pro and up. | https://supabase.com/docs/guides/auth/sessions |

So `docs/ops/SECURITY.md` 2.5 ("revoking the JWT signing key signs everyone out") was not supported by the vendor pages. It is now worded as unproven and points here.

What the app does today: `forceReauthEpoch` in the signed remote config is now read by the app (`apps/mobile/src/lib/auth/reauth.logic.ts`, wired in `session-provider.tsx`). It signs the phone out **locally** (scope `local`), after queued letters are uploaded, and keeps every letter. It does **not** by itself revoke a refresh token that was copied off the phone: that depends on the best-effort request above. For a takeover, the server-side step in 3.1 is required too.

## 2. The levers

| # | Lever | Reaches | Ends refresh tokens on the server? | Status |
|---|---|---|---|---|
| L1 | Raise `forceReauthEpoch` in remote config (publish a new signed `remote-config.json`, RELEASE.md section on kill switches) | Every phone running a build with the reader, within about 5 minutes of the app being open (LEGAL-REQ-040 numbers) | Only by the phone's best-effort request | Code built (BL-597); drill D1 |
| L2 | Revoke the JWT signing key (or the legacy secret) in the dashboard | Everyone, access tokens at once | Not stated by the vendor | Drill D2 |
| L3 | Dashboard: the person's row in Authentication > Users | One person | Unknown which action exists and what it does | Drill D3 |
| L4 | Ban the person (`ban_duration` through `updateUserById`) | One person | Not stated by the vendor | Drill D4; use only after the founder has chosen a service-role call by ticket |

L1 is not an instant response to a compromise. A phone that is offline, or that has queued letters not yet uploaded, stays signed in until it is back online and the queue has drained (A-REQ-033: a sign-out never discards a letter). Until then its session still works. For a suspected takeover, do not wait for L1; use the server-side step in 3.1.

Never use L3 or L4 to change an email address or link an identity. Support does not edit sign-in details by hand (BL-598).

## 3. Procedure (after the drills have been run; until then follow it as a plan, not a promise)

### 3.1 One person

1. Open a ticket; write the time (UTC) of the report. Do not paste the person's email into chat or the ticket body; use the user id.
2. Apply the lever the drill in 5 showed ends that person's refresh on the server (D3 or D4).
3. Ask the person to open the app. Expected: it shows signed out and their letters are still there.
4. Record the result in the ticket (time, lever, what the phone showed). Content-free: no letter text, no child name.

### 3.2 Everyone

1. Raise `forceReauthEpoch` (L1).
2. Apply L2 only if D2 showed it ends refresh. Otherwise state in the ticket that old refresh tokens may still work until they are rotated or expire.
3. Watch for new sign-ins; each phone signs in again and its letters are still on it.

## 4. Drills (founder, on staging only, with two test phones signed in as the fictional family "Asha")

All NOT RUN. Each drill needs two phones, A and B, signed in as the same Asha test account, each with one letter on it.

| Drill | Do | Pass when |
|---|---|---|
| D1 | Publish a staging remote config with `forceReauthEpoch` one higher. Open the app on A and B. | Within 5 minutes both phones show signed out; both still list their letter after signing in again. (Needs a device; not covered by unit tests.) |
| D2 | Revoke the staging signing key (or legacy secret, whichever staging uses; write which). Wait 20 minutes. On A and B, background the app for longer than `jwt_expiry` (15 minutes locally; read the hosted value), then foreground it. | Both phones' next refresh fails and they show signed out. If they stay signed in, D2 is not a sign-out lever; say so in 5. |
| D3 | Use the dashboard action for one user (name the exact menu item you used). Same wait as D2. | Both phones fail their next refresh. |
| D4 | Ban the Asha test user for a short time through a one-off service-role call run by you (not an agent). Same wait as D2. | Both phones fail their next refresh, and signing in is refused until the ban ends. |

Do the drills one at a time; sign both phones in again between them. A copied refresh token is not tested here (a device cannot show it); the pass rule is "the next refresh through the app fails".

## 5. Results (founder fills in; leave blank until run)

Write them in `docs/legal/evidence/` as `sessions-drill-<date>.md` (the folder is created by BL-603) and copy the one-line answers here.

| Drill | Date (UTC) | Lever as run | Refresh failed on A | on B | Notes |
|---|---|---|---|---|---|
| D1 | NOT RUN | | | | |
| D2 | NOT RUN | | | | |
| D3 | NOT RUN | | | | |
| D4 | NOT RUN | | | | |
