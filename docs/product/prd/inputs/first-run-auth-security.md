# Input: auth and sign-up security, from download to the first letter

Author: `security` (security engineer), for Karma (CTO). Backlog: BL-994. Written 20 Nov 2026 on branch `docs/locked-pack-inputs-20nov` at `7d0446d02`, read-only except this file. Nothing committed, pushed or posted.

Purpose: give product and design one place that says what sign-up and sign-in do today, every risk control and where it lives, every validation rule with its error code, every failure state design must draw, and the gaps with a recommended default. Error codes use area E's shared vocabulary (`/home/claude/wt/E/docs/design/e2e/E-foundations-and-system-states/WORDS.md` section 4: table 4.1 envelope codes, table 4.2 `AuthErrorKind`). A code not in that file is marked PROPOSED and needs a WORDS row before design uses it.

Evidence key:
- `path:line` is code or config read this session.
- "Supabase docs, read 20 Nov" and "Apple, read 20 Nov" are vendor pages opened this session (URLs in section 7).
- **UNVERIFIED** means not read or not run this session.

Scope note: v1.0 store builds ship with `EXPO_PUBLIC_SERVER_FEATURES` off until the R-17 security gate passes (`apps/mobile/src/lib/capabilities.ts:6-10`). With it off, there is no Supabase client, no sign-in and no session (`apps/mobile/src/lib/supabase/client.ts:96-100`). Everything below describes the servers-on build (alpha `preview` today, store builds after the flip).

---

## 1. The auth journey as built

### 1.1 Entry and the sign-in sheet

| Step | As built | Evidence |
|---|---|---|
| Sheet opens | `/sign-in?trigger=first_letter|invite|invite_create|sign_in|settings`; an unknown trigger becomes `settings` | `apps/mobile/src/lib/auth/pending.ts:61-67` |
| Ways in | Apple (iOS only, when `isAvailableAsync`), Google (only when its client ids are in the build), "Continue with email", passkey (only with `EXPO_PUBLIC_PASSKEYS=1`) | `apps/mobile/src/app/(auth)/sign-in/index.tsx:127-142`; `lib/auth/apple.ts:32-39`; `lib/auth/passkey.ts:97` |
| Policy | v1.0 methods are Apple and email link plus code; Google is v1.1; no passwords, no reset flow | `docs/engineering/05-identity-and-access.md` IAM-R05, IAM-R06 |
| Double tap | `inFlight` ref set before the first await, so one tap starts one sign-in | `index.tsx:54-55,78-92` |
| Cancel | Closing Apple's sheet is silent (`cancelled`), the sheet stays | `index.tsx:91`; `lib/auth/errors.logic.ts:31-32`; `machine.logic.ts:133-135` |
| Not now | Always closes, changes nothing (local-first) | `index.tsx:104-112` |
| Kill path | No Supabase settings or servers off: no buttons, one line (`notConfigured`) | `index.tsx:123-125` |
| Last method | "Last time you used ..." under the matching button; stored in the local settings table, not the Keychain | `index.tsx:136-140`; `session-provider.tsx:113,117-120,343-346` |

### 1.2 Sign in with Apple

| Item | As built | Evidence |
|---|---|---|
| Nonce | 32 random bytes (expo-crypto), SHA-256 sent to Apple, raw value to Supabase, which checks the token's nonce claim | `lib/auth/nonce.ts:1-14`; `apple.ts:49-55` |
| Scopes | Full name and email | `apple.ts:50-53` |
| Exchange | `signInWithIdToken({ provider: 'apple', token, nonce })` | `apple.ts:55` |
| Name | Shared once by Apple; kept in the Keychain (`scribe.auth.pendingName`, max 60 chars) until Terms are accepted, then written to `profiles.display_name`; never logged | `apple.ts:41-45,62-63`; `session-provider.tsx:497-505` |
| Apple user id | Kept in the Keychain (`scribe.auth.appleUser`) to ask Apple for the credential state | `apple.ts:61,81-91` |
| Token for revocation | The one-time authorization code goes in the background to `apple-token/v1` (user JWT), which exchanges it with Apple and stores the refresh token wrapped (AES-256-GCM under `TOKEN_KEK_V<n>`). Never blocks sign-in; one retry after 3 s only if the request never reached the function | `apple.ts:59-60,110-130`; `apple-token.logic.ts:375-403`; `docs/ops/SECURITY.md:143-155` |
| apple-token limits | 10 calls per person per hour, per instance and in the database (`rate_hit('apple_token')`); 429 with `Retry-After: 3600` | `supabase/functions/apple-token/handler.ts:37-41,64-65,268-295` |
| Revoked on this Apple ID | Checked when a signed-in user id first appears (launch restore or new sign-in). REVOKED asks for a sign-out with reason `apple_revoked`, after queued letters upload | `session-provider.tsx:255-267`; `apple.ts:81-91` |

Apple's rule (Apple TN3194, read 20 Nov): revocation needs "either a valid refresh token or access token"; on a credential-revoked notification the app must delete user data including "the token used for token revocation" and "revert the client to an unauthenticated state". Apple also says to "observe the credentialRevokedNotification and use getCredentialState". We do the second, not the first (gap G7).

### 1.3 Email one-time code and link

| Item | Value as built | Where it lives |
|---|---|---|
| One email, two ways | A link and a code in the same email (A-REQ-018) | `lib/auth/email.ts:1-19` |
| Account creation | `shouldCreateUser: true`: new and returning look the same | `email.ts:35-38`; `email.ts:14-15` |
| Code length | 6 digits. Server `otp_length = 6`; app `EMAIL_CODE_LENGTH` from `EXPO_PUBLIC_EMAIL_OTP_LENGTH`, accepted 6 to 10, default 6. Both must change together | `supabase/config.toml:71`; `email.ts:28-29` |
| Expiry | 900 s (15 minutes) for both code and link. Templates and copy say "15 minutes" | `config.toml:72-74` |
| Resend wait | Server: one email per address per 60 s (`max_frequency = "1m"`). App: `RESEND_WAIT_MS = 60_000`; the "Send a new email" button turns on after the minute, no countdown numbers. The same address again inside the minute reuses the earlier send and asks nothing of Supabase | `config.toml:69-70`; `email.ts:31-32`; `code.tsx:94-103,328-333`; `session-provider.tsx:400-407`; `errors.logic.ts:107-120` |
| Only the newest works | A new email replaces the old token (ADR 0023 Details "Flow ids") | `docs/adr/0023-email-links-pkce.md:26` |
| Attempts (client) | 5 wrong codes for one address within 15 minutes pause code entry for 15 minutes after the fifth. Memory only, keyed by trimmed lower-case address, last 10 times kept. Not a security control on its own (its own comment says so) | `errors.logic.ts:6-9,79-94`; `pending.ts:102-114`; `session-provider.tsx:423-445` |
| While paused | Field disabled; the line says the link in the newest email still works and so does Apple; "Send a new email" stays (never clears or shortens the pause) | `code.tsx:22-27,119-132,193-194` |
| Attempts (server) | Verify requests 30 per 5 minutes per IP. No per-address lockout exists on the server | `config.toml:49-56`; Supabase rate-limits page, read 20 Nov |
| Lockout | None on the server beyond the per-IP limit and the token's expiry. A new email (60 s later) gives a fresh code | as above |
| Code input | Digits only; spaces and dashes stripped; paste and iOS one-time-code AutoFill; submits itself at full length once per distinct value | `errors.logic.ts:96-99`; `code.tsx:160-165,275-287` |
| Link | `https://earlyletters.com/auth/callback#token_hash=...&type=email` (fragment, so website logs and mail scanners never get it; the page never verifies on load) | `email.ts:6-11`; `links.logic.ts:201-216` |
| Link acceptance (H1 fix, ADR 0023) | Three layers: (1) a Keychain note of the time this phone asked (no address), valid 1 hour; (2) PKCE: GET `/auth/v1/verify` with redirects not followed, then `exchangeCodeForSession` with this phone's verifier; implicit tokens in the redirect are refused; (3) the claim screen before any local letters join the account. A link is refused while any account is signed in here | `email-link.logic.ts:1-145`; `email.ts:70-97`; `pending.ts:20-48`; `session-provider.tsx:447-490`; `verify.tsx:8-13` |
| Cross-device | A typed code works on any phone on purpose; it still passes layer 3 | `email-link.logic.ts:28-31` |
| PKCE method | `plain` (Hermes has no `crypto.subtle`); verifier from the platform RNG. Accepted in ADR 0023 | `client.ts:58-75`; ADR 0023 line 27 |

### 1.4 Session storage and refresh

| Item | As built | Evidence |
|---|---|---|
| Store | iOS Keychain through expo-secure-store, `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`; never restored from an iCloud or device backup; web preview uses memory only | `lib/supabase/secure-storage.ts:150-204` |
| Keychain items | `scribe.auth` (session), `scribe.auth.pendingEmailRequest` (time only), `scribe.auth.appleUser`, `scribe.auth.pendingName` | `client.ts:42`; `pending.ts:18`; `apple.ts:29-30` |
| Email address | Never stored on the phone; memory only while signing in. A restart between send and code asks for the address again | `pending.ts:1-11,86-92`; `code.tsx:7-9,230-251` |
| Access token | JWT 900 s (15 minutes) | `config.toml:40-41` |
| Refresh | Rotation on, reuse interval 10 s; auto-refresh only while the app is active | `config.toml:42-43`; `client.ts:124-139` |
| Launch | Never waits on the network: user id read from the Keychain, the consent check runs in the background | `session-provider.tsx:7-10,135-145,201-231` |
| Offline at launch | `INITIAL_SESSION` with null after a failed refresh is not treated as a sign-out | `session-provider.tsx:209-215` |
| Requests | User JWT only plus the publishable key; every call carries `x-request-id` and `x-app-version`, never content | `client.ts:8-13,79-89` |
| Sync release | A session reaches sync only after consent is complete and, when the phone holds letters owned by no account, after "Keep in this account" | `auth-store.ts:14-21,74-103` |

### 1.5 Re-auth before sensitive acts

| Act | As built | Evidence |
|---|---|---|
| Founder-forced re-auth | Remote config `forceReauthEpoch`; a signed-in phone signs out once per new number after queued letters upload; letters stay | `lib/auth/reauth.logic.ts:1-71`; `session-provider.tsx:327-341` |
| Account deletion | Two steps and a typed word, then `request_account_deletion`; no fresh sign-in, no code | `lib/account-deletion/logic.ts:61-63,101-112`; `api.ts:74` |
| Sign out other devices | One tap; no fresh sign-in | `app/settings/account.tsx:181-188`; `session-provider.tsx:540-549` |
| Email change | Supabase secure change: both old and new address confirm (`double_confirm_changes`); the confirm link opens only while signed in and through PKCE; it never signs anyone in | `config.toml:67-68`; `email-link.logic.ts:84-85`; `session-provider.tsx:463-477` |
| Step-up code | Envelope code `reauth_required` (SQLSTATE `SCSTP`, detail `step_up_required`) exists for backup and recovery-key steps only, which are off | `packages/api/src/envelope.ts:72,209`; WORDS 4.1 |
| Reauthentication email | A template exists ("Your code to confirm account deletion"), but no app code calls Supabase reauthenticate (searched `apps/mobile/src`) | `config.toml:106-108` |

### 1.6 Sign-out (ruling D1: local scope, the book stays)

| Item | As built | Evidence |
|---|---|---|
| Scope | `signOut({ scope: 'local' })`; the Keychain is cleared even if the server cannot be reached | `session-provider.tsx:293-308` |
| Waits | Waits for queued uploads while sync can run; "Stay signed in" cancels a wait the person asked for | `machine.logic.ts:191-209`; `session-provider.tsx:269-284,529-538` |
| Clears | Session, Apple user id, pending email note, typed address; claim confirmations in memory | `session-provider.tsx:303-306`; `pending.ts:55-59`; `auth-store.ts:113-118` |
| Keeps | Every book, letter and recording on the phone (D1). The sheet must say anyone who opens the app here can read them (NS-08-R6) | `docs/product/prd/08-keeping-and-trust.md:13,119` |
| Under 18 on the age step | Ends the session (local) and closes the 18+ gate | `session-provider.tsx:310-325` |
| Revoked elsewhere | A Supabase `SIGNED_OUT` drops the pending note and shows `session_expired` | `session-provider.tsx:217-223`; `machine.logic.ts:211-216` |

### 1.7 Account deletion

| Item | As built | Evidence |
|---|---|---|
| Visibility | Build flag `EXPO_PUBLIC_ACCOUNT_DELETION=on` and servers on; off hides the row | `capabilities.ts:45-60` |
| Request | `request_account_deletion(p_source)`: one open request per account (a repeat returns it); at most 5 new requests per rolling 24 h (`SCRAT`); scheduled 30 days out; audited | `supabase/migrations/20261005000000_family_cap_language_idempotency.sql:405-430`; `20261002020000_data_governance.sql:465,483` |
| Cancel | `cancel_account_deletion`, rate limited per 24 h (`SCRAT`) | `20261005000000_...sql:459-469`; `account-deletion/api.ts:95` |
| Apple tokens | The purge worker revokes the stored Apple refresh token; without one the receipt says `apple: no_token` and an alert fires | `docs/ops/SECURITY.md:143-157` |
| Dashboard deletion | Forbidden in production (cascade would hard-delete letters) | IAM-R22 |
| Without agreeing to new Terms | Must work (NS-10-R4a) | `08-keeping-and-trust.md:481` |

---

## 2. Risk controls

### 2.1 Rate limits and where they live

| Limit | Value | Scope | Lives in | Error code |
|---|---|---|---|---|
| Sign-in and sign-up requests (`/otp`, `/magiclink`, `/signup` ...) | 30 per 5 min | per IP | Supabase Auth (`config.toml:55`; dashboard per `supabase/auth-email.md` 3.6) | 429 -> `email_wait` on send, `rate_limited` elsewhere (`errors.logic.ts:50-53,75`) |
| One email per address | 60 s | per address | Supabase Auth (`config.toml:70`) plus app wait (`email.ts:32`) | `email_wait` |
| Emails per hour | 100 | whole project (custom SMTP only) | Supabase Auth (`config.toml:54`) | `email_wait` |
| Code and link verification (`/verify`) | 30 per 5 min | per IP | Supabase Auth (`config.toml:56`) | `rate_limited`; the link path throws `over_request_rate_limit` (`email.ts:83`) |
| Token endpoint (refresh, id token, PKCE exchange) | 150 per 5 min | per IP | Supabase Auth (`config.toml:57`) | `rate_limited` |
| Wrong codes (client) | 5 per 15 min, pause 15 min | per address, this process only | `errors.logic.ts:79-94` | `code_paused` |
| Apple token capture | 10 per hour | per person | `apple-token` function and `rate_hit` | 429, not shown (background) |
| Policy acts (consent records) | 60 per hour (`rate_hit('policy_actions')`); record_policy_act also has hourly and 200 per 24 h caps | per person | `20261005000000_...sql:93-101,483-529,563` | `rate_limited` (SCRAT); shown as `consent_unavailable` on the sheet (`session-provider.tsx:508-511`) |
| Membership (invite create, accept by link, leave) | 120 per hour | per person | `rate_hit('membership')`, `20261005000000_...sql:280,341,368`; `20261015010000_...sql:149` | `rate_limited` |
| Invite creation | per-day cap (`too many invites today`) | per person | `20261005000000_...sql:253` | `rate_limited` |
| Invite codes (8 characters, about 40 bits) | 10 failures per person, 10 per device, 30 per IP per rolling hour; 1,000 across the service pauses all codes (links keep working) | person, device, IP, global | `supabase/functions/invite-redeem/handler.ts:15-27,129-169` | `rate_limited`, detail `codes_paused` (WORDS 4.1 `invite_unusable` row) |
| Sync pull / push | 120 / 60 per minute | per person | `20261005000000_...sql:671,925` | queue: not shown |
| Account deletion | 5 new requests per 24 h | per person | `20261005000000_...sql:425-428` | `rate_limited` |

Doc drift: `docs/ops/SECURITY.md:131` says "sign-ups per hour 30"; the config and Supabase's page are 30 per 5 minutes per IP. Fix the ops doc (G13).

### 2.2 Enumeration resistance

- `shouldCreateUser: true`, so the send answer is the same for a known and an unknown address (`email.ts:14-15,35-38`; check 7 in `supabase/auth-email.md:207`).
- New and returning addresses get different emails (Confirm signup versus Magic Link templates, `config.toml:94-100`). Only the inbox owner sees which; the app screen is identical (`email-link.logic.ts:91-99`: the link says `type=email` for both).
- Invite codes: every refusal except `already_member` reads as `not_found`, so a guess learns nothing (`invite-redeem/handler.ts:170-172`).
- The claim screen masks the account email to `a***@domain` (`account-claim.logic.ts:346-358`).
- Residual: response timing for a new versus known address (user row created) is UNVERIFIED. The `lastMethod` line is on-device only and reveals the method to anyone holding this phone.

### 2.3 Code brute force

As built: a 6-digit code (10^6), 15 minutes life, server limit 30 verifications per 5 minutes per IP and nothing per address. One IP gets about 90 guesses in a code's life (about 1 in 11,000). An attacker with many IPs scales linearly; a new code every 60 s does not reset anything for the attacker because each send replaces the token the guesses aim at, but it also does not lock them out. The client pause is honest-user help only and is reset by killing the app (`pending.ts:72`, memory map). This is review finding M4 and chapter 05 open question 4; ADR 0023 lists "the 8-digit, 15-minute code rule" as separate work (`0023-email-links-pkce.md:44`). See G2.

### 2.4 Bot and abuse limits

- No CAPTCHA (Turnstile or hCaptcha) on `signInWithOtp` (`docs/ops/SECURITY.md:132`; `auth-email.md:107-108`: founder decision Q3, recommended before the public TestFlight link).
- No App Attest or DeviceCheck.
- Email bombing: one IP can send a sign-in email to any address once a minute (60 per hour per victim), and many IPs can exhaust the 100-per-hour project cap, which blocks every family's email sign-in until the hour turns (Apple still works). See G3.
- Anonymous sign-ins off at the project and refused by the database (SQLSTATE `SCANO`) (`config.toml:45-46`; IAM-R07, IAM-R13).
- Manual identity linking off (`config.toml:47`).

### 2.5 Second account on one phone (X4, ruling D1)

Requirement: a second account never sees, claims or uploads the first account's local letters (`[X4-R1]`, `docs/product/prd/14-test-plan.md:137`; NS-10-R3, R5; NS-01-R29; NS-02-R24; NS-05-R27).

As built:
- Claim: skipped when another account owns the phone (`account-claim.logic.ts:301-305,339-344`), so B is never offered A's letters. Holds.
- Upload: `takeOwnership` throws `AccountMismatchError` when the owner differs; sync stops for that user (`lib/sync/ownership.ts:25-31,45-50`; `lib/sync/index.ts:175-215`). Holds.
- Sees: **not built.** No read path filters local books or letters by owner. `isOwnEntry` treats a null author or null owner as "mine" (`components/child/child-store.ts:11-15`). Area E records that "the built gate opens Home for any session" until BL-961 lands (WORDS 5.6). The platform pass names this TB4 / R7 and proposes ADR 0031 ("a mismatched owner hides and locks the old book ... until that account signs in again or Erase everything runs", `C-platform-quality-delivery.md` lines 54, 91, 490). See G1.
- Logs: the mismatch is `owner_mismatch` / `sync_account_mismatch` and never logs either account id (platform pass line 289).

### 2.6 Device change

- The session never moves with a backup (`THIS_DEVICE_ONLY`), so a new or restored phone signs in again and meets Terms and the age line (`secure-storage.ts:154-157`).
- With backup off, words arrive and recordings stay on the phone that made them (NS-10).
- No new-device sign-in email exists (ADR 0023 line 44 lists it as separate work). See G6.
- No list of signed-in devices; only "Sign out other devices" (`scope: 'others'`).

### 2.7 Session theft

| Threat | Control as built | Residual |
|---|---|---|
| Backup or iCloud copy of the Keychain | `THIS_DEVICE_ONLY` | none known |
| Stolen access token | 15-minute JWT | 15 minutes of use |
| Stolen refresh token | Rotation with 10 s reuse window; reuse detection is Supabase's (UNVERIFIED this session) | until the person taps Sign out other devices; no device list, no alert |
| Thief adds a durable credential | Email change needs both addresses; manual linking off | A password set through `updateUser` on a stolen session would survive token revocation. Whether the email provider accepts password set and password sign-in for these accounts is UNVERIFIED (`config.toml:59-61`: "The CLI has no key that turns off email plus password sign-in"). See G4 |
| Unlocked phone in someone else's hands | App lock (E-S22) is opt-in; deletion has a 30-day undo | deletion and sign-out-others need no fresh sign-in (G5) |
| Offline sign-out | Keychain cleared locally | the server session for that refresh token is not revoked if the logout call never reached Supabase (UNVERIFIED in auth-js behaviour) |

### 2.8 Invite link abuse

- Link: `https://earlyletters.com/j#t=<token>`; token only from the fragment, 32 to 128 of `[A-Za-z0-9_-]`; written to the Keychain before any screen (`lib/family/invite-link.logic.ts:6-28`; `app/+native-intent.tsx:50-53`).
- Server: tokens are SHA-256 hashes, returned once, 7 days (co-parent) or 14 days (family), hashes deleted 90 days after use; only a parent creates or revokes; acceptance never changes an existing role; the inviter cannot accept their own (IAM-R18, IAM-R19).
- Codes: HMAC with a pepper, never stored in clear; limits in 2.1; fails closed without the pepper or subject secret (`invite-redeem/handler.ts:104-113`).
- Acceptance requires current Terms with age attestation (IAM-R03; `SCCON`).
- Servers off or under-18 stop: the token is dropped (`+native-intent.tsx` header lines 11-23).
- Residual: the device id in the redeem body is client-supplied, so the per-device limit is soft; the per-IP limit is skipped when `CLIENT_IP_HEADER` is unset (logged as `redeem.degraded`) (`handler.ts:134-143`). See G14.
- In store builds co-parent is off ("coming soon"), so this surface is alpha-only today (`capabilities.ts:17-19`).

### 2.9 Deep links

- Universal links only for secrets: host must equal the brand origin; paths `/auth/callback`, `/auth/confirm`, `/j` (`links.logic.ts:259-278`).
- Custom scheme `scribe://auth/callback` opens the code screen and never carries a token; a token on the custom scheme is ignored (`links.logic.ts:209-214,280-285`).
- `detectSessionInUrl: false`: Supabase never reads sessions from URLs (`client.ts:108-109`).
- Redirect allowlist: exact `https://earlyletters.com/auth/callback`, never a wildcard or the custom scheme (`config.toml:34-39`). `/auth/confirm` is accepted by the app but not listed in the config (SIGN-04).
- A link held for /verify is in memory only and read once (`pending.ts:69-84`).
- External links never start recording: capture routes go to Tonight (`+native-intent.tsx:49`; SEC-R17).

### 2.10 What is logged, and what never is

| Where | Logged | Never |
|---|---|---|
| App analytics (opt-in, L2) | `auth_sheet_shown {trigger}`, `auth_method_selected {method}`, `auth_succeeded {method, had_local_data}`, `auth_failed {method, reason}` (closed list), `auth_email_sent {attempt}`, `auth_deferred {trigger}`, `signed_out {reason}` (`packages/analytics/src/catalog.ts:283-345`) | email, code, token hash, Apple code, name, user id. An under-18 answer is never sent (`catalog.ts:307`) |
| Edge Functions | event name, enums, HTTP status, SQLSTATE, counts, durations, random `req_id` (`docs/ops/SECURITY.md:159-163`); log canary test fails on any fixture, UUID, email or JWT | ids, emails, codes, device ids, IPs (hashed subjects only in the database) |
| Database | `audit(...)` rows for deletion and membership acts (`20261002020000_data_governance.sql:465,483`); policy acts append-only | content |
| Supabase Auth | Its own audit log (IPs and emails, vendor-held); ops asks for the shortest retention (`SECURITY.md:136`) | n/a (vendor) |
| Security events table (SEC-R24) | **does not exist** (`06-security-engineering.md` SEC-R24 "not yet") | G8 |

Gap in analytics: `auth_failed.reason` has no `email_wait`, `other_phone`, `other_phone_spent`, `already_signed_in`, `under_18` handled separately, so those land as `unknown` (`packages/analytics/src/observe.ts:39-40`). Low (G11).

---

## 3. Validation rules, first launch to the first letter

Client rules are convenience; the server rule is the control (chapter 05 principle "The database decides"). Codes are WORDS 4.1 and 4.2 codes unless marked PROPOSED.

| Step and field | Client rule | Server rule | Error code (parent line key) |
|---|---|---|---|
| Age gate (E-S03): Yes or No | One answer required; "Choose Yes or No." shown in words | none at this point; the Terms act later records `age_attested: true` | phone: `beforeBegin.chooseAnswer` (WORDS 5.14 4a) |
| Age gate: agreement tick | Required; "Check the box to continue." | none here | phone: `beforeBegin.tickBox` |
| Age gate: No | Stop screen; nothing stored but the answer (IAM-R04) | none | `under_18` (`ageGate.stopTitle`) |
| Email address | Trimmed; at most 254 characters; one `@`, a dot after it, no spaces (`errors.logic.ts:101-105`); shown on submit only, cleared on typing (`email.tsx:35-40,59-61`); Send disabled while empty | Supabase validates (`email_address_invalid`, `validation_failed`); 60 s per address; per-IP and project caps | `invalid_email`; `email_wait`; `not_available`; `network`. PROPOSED `authCopy.email.needEmail` for empty (WORDS 6a) |
| Email (after restart on the code screen) | Same shape check before verify or resend (`code.tsx:118,135,169-172`) | same | `invalid_email` |
| Code | Digits only after stripping spaces and dashes; exactly `EMAIL_CODE_LENGTH` (6) to submit; Continue disabled otherwise; paused after 5 wrong in 15 min | Supabase verify: token for that address and type `email`, unexpired, newest only; 30 per 5 min per IP | `wrong_code` (also used for an expired code, since Supabase answers "expired or invalid" for both, `errors.logic.ts:39-41`); `code_paused`; `rate_limited`; `network`. PROPOSED `authCopy.code.sixDigits` for short (WORDS 7a) |
| Email link | Token hash 16 to 256 of `[A-Za-z0-9_-]`; type one of `email`, `magiclink`, `signup`, `email_change` (`links.logic.ts:234-235,253,272`); pending note under 1 hour and not more than 60 s in the future (`email-link.logic.ts:35-66`); nobody signed in | PKCE exchange needs this phone's verifier; auth code 8 to 256 of `[A-Za-z0-9_-]` (`email-link.logic.ts:155,195`); implicit tokens refused | `other_phone`, `other_phone_spent`, `already_signed_in`, `expired`, `rate_limited`, `unknown` |
| Apple | No field. Nonce must match; identity token required | Supabase checks the token and nonce | `cancelled` (silent), `provider`, `not_available`, `network` |
| Apple code capture | `{code}` 16 to 512 of `[A-Za-z0-9._-]`, `{clientId}` 3 to 155 (`apple-token.logic.ts:381-392`) | function re-checks shape, the bundle id list, JWT, rate | none shown (background) |
| Terms (E-S07) | "Agree and continue"; "Not now" closes with nothing recorded | `record_policy_act` against the current published version; append-only; rate limits; `require_content_consent()` blocks every content write until current (IAM-R03) | `consent_unavailable`, `network`, `session_expired` (28000) (`session-provider.tsx:508-511`) |
| Age step (only when Terms are current without the attestation) | Yes or No, nothing preselected; Continue disabled until one | same act | No -> `under_18` |
| Sensitive data | Agree or Keep on this phone, same size | `record_policy_act`; decline stands until turned on from Settings (BL-503) | `consent_unavailable`, `network` |
| Claim screen | Shown only with local data and no owner; Keep waits for the account read (`keepEnabled`) | none (phone-side release of sync) | none |
| Display name (from Apple) | trimmed, joined, cut at 60 (`apple.ts:41-45`) | `char_length(display_name) <= 60` (`20260930000000_scribe_core.sql:20`) | none shown (best effort, `session-provider.tsx:500-504`) |
| Child name (E-S08) | optional; at most 60 (`CHILD_NAME_MAX`, `packages/core/src/child.ts:14,74`) | `char_length(name) <= 60` (`20261109000000_child_name_optional.sql:55`) | phone: `nameLimit`, `needNameMany` |
| Born or expecting | one required | `date_of_birth is not null or due_date is not null` (`20261003010000_children_and_entitlements.sql:52`, `not valid`, so old rows are not checked) | phone: `needBirthday`, `needDueDate` |
| Birthday | today or earlier | no range check found in migrations (UNVERIFIED that none exists) | phone: `childrenExtra.edit.birthdayFuture`, `dateInvalid` |
| Due date | today up to ten months ahead | no range check found (UNVERIFIED) | phone: `childrenExtra.edit.dueDateRange` |
| Signs as | at most 30 (`SIGNS_AS_MAX`) | `char_length(signs_as) <= 30` (`20260930000000_scribe_core.sql:22`) | phone: `signsAsLimit`, `needSignsAs` |
| First letter | area A's rules; capture never needs an account | sync push 60 per min, consent gate | queue codes, not shown (WORDS 4.3) |

---

## 4. Failure and edge states design must cover

Each row: what happens as built, and what design must draw. "Sheet stays" means the person is not moved.

| # | State | As built | Design must cover |
|---|---|---|---|
| F1 | Offline on the sign-in sheet | Provider call fails -> `network` | Line under the ways in; first run uses E-S14 offline (`authCopy.offline.*`) with "Start on this phone" |
| F2 | Offline on Send link | `network`; nothing sent; the address stays in the field | Sheet line; Send stays |
| F3 | Offline on the code screen | verify fails -> `network`; field cleared and refocused | Line; the code from the same email still works later (until 15 min) |
| F4 | Offline when a link opens the app | GET /verify fails -> mapped error; the pending note stays | Verify screen error with "Type the code" first |
| F5 | Offline on consent | `network` on the step; sheet stays | Line on each of Terms, age, sensitive |
| F6 | Offline on the claim screen | Keep waits for the account read with a bounded wait, then today's words | Waiting state (E-S24.waiting) |
| F7 | Offline at launch while signed in | `ready` with `sync: 'unknown'`; no sign-out | No message; gate re-read on foreground |
| F8 | Apple sheet cancelled | silent, sheet stays | Nothing |
| F9 | Apple not available (no Apple ID on the phone, non-iOS) | Apple button hidden | Email is the only way; no empty slot |
| F10 | Apple sign-in revoked in iOS Settings | Detected when a session's user id appears (launch); sign-out after uploads; reason `apple_revoked`; cannot be cancelled by "Stay signed in" | Calm signed-out line (`session_expired`) and the book stays (D1). Today a revoke while the app runs is not seen until next launch (G7) |
| F11 | Apple returns no identity token or no user | `provider` | Provider line |
| F12 | Email never arrives | After 60 s: "Send a new email", "Use a different email", Apple, and "Nothing yet? Look in spam, or send a new email." Trouble help line | Recovery set (NX-31-R11). `noEmailHelp` names Google, which Build 12 lacks (WORDS 7f change) |
| F13 | Email cap hit (project or per address) | `email_wait` | Line with no minutes counted |
| F14 | Code expired | Reads as `wrong_code` | Same line; the newest email's code; Send a new email |
| F15 | Link expired | `expired`; "Send a new email" filled, "Type the code" quiet | Verify screen |
| F16 | Wrong code | `wrong_code`; field clears and refocuses; no shake, no red, no haptic | As built |
| F17 | Five wrong codes | `code_paused` for 15 min; link and Apple still offered | Paused state, no countdown |
| F18 | 429 on verify | `rate_limited` | Line |
| F19 | Link opened on another phone, or no request from this phone | `other_phone` (before any request) or `other_phone_spent` (after GET /verify ran) | Refused title + typed code, or new email |
| F20 | Link opened while signed in | `already_signed_in`; never replaces the session | Refused title, Close only |
| F21 | Two sends in a row | Only the newest link and code work | Copy says "the newest email" (as built) |
| F22 | Outage (Supabase 5xx) | 5xx is not shown as offline (BL-488): `provider` or `unknown` | First run: E-S14 outage with "Start on this phone" |
| F23 | Kill switch: servers off in the build | No client; sheet shows `notConfigured`; Account and Delete rows hidden; invite tokens dropped | Sheet line; no buttons. There is no remote pause for sign-in itself (G9) |
| F24 | Remote pauses (`killSwitches.invites`, `sync`) | invite-redeem answers `paused` (503); sync stops | WORDS section 7 |
| F25 | Clock skew | Pending note: more than 60 s in the future counts as no request (`other_phone`); over an hour old counts as `expired`. Client resend wait and code pause use the phone clock (a clock moved forward lifts them; the server limits still hold). JWT expiry handling under a wrong clock is UNVERIFIED | Fallback to the typed code covers it; no clock message |
| F26 | App killed after Send, before the code | Address gone (memory only); the code screen asks for it (`code.emailLabel`); the 60 s wait is forgotten by the app, the server's is not (`email_wait`) | E-S06.noAddress |
| F27 | App killed after Apple, before Terms | Session saved; name waits in the Keychain; next launch -> consent sheet again | Consent sheet or held screen; never the child step (NS-10-R0) |
| F28 | App killed on the claim screen | Nothing claimed; "Finish setting up" on Family and Account reopens it | E-S24 from Account |
| F29 | App killed during the Apple token capture | `apple: no_token` later at deletion; ops alert | Nothing for the parent |
| F30 | Returning user on a new phone | Sign in; consent if outstanding; "Opening your book" up to 10 s; words arrive, recordings do not | NS-10 states (E-S09, C-S10, C-S11) |
| F31 | Existing account, other method | Same verified email links automatically to one user (Supabase identity linking). A different email (for example Hide My Email) makes a second, empty account -> "No book here yet / Did you use a different way to sign in last time? / Try another way / Start a book" | NS-10 wrong-account row; names the method, never the full email (NS-10-R12) |
| F32 | Hide My Email relay | The account email is `...@privaterelay.appleid.com`; the claim screen shows the masked relay address; sign-in emails reach the person only if the sending domain is registered with Apple's relay (G16) | Claim and Account show "Apple (email hidden)" instead of a masked relay address (PROPOSED) |
| F33 | Second account on a phone holding A's book | Upload and claim blocked; A's book still visible (G1) | E-S18 rule: lists filter to B; no line naming A |
| F34 | Terms "Not now" | Signed in, nothing syncs, nothing recorded | "Finish setting up" route |
| F35 | Under 18 on the age step | Session ends, gate closes | E-S03 stop |
| F36 | Session revoked elsewhere (Sign out other devices on another phone) | `SIGNED_OUT` -> `session_expired`; letters stay | Signed-out line once |
| F37 | Force re-auth epoch | Signs out after uploads; letters stay | Same signed-out line |
| F38 | Account deleted on another phone while this one waits | NS-10-R9 plain line (`authCopy.newPhone.accountDeleted`, PROPOSED) | C-S10.deletedElsewhere |
| F39 | Deletion pending at sign-in | Deletion screen with Cancel deletion (open-request logic) | Deletion state with the date |
| F40 | Mail app absent | "Open Mail" uses `message:`; failure is swallowed | Button stays; no error |

---

## 5. Gaps between built and needed

Severity: Critical (blocks any servers-on build outside the family), High (blocks the public TestFlight link or the store flip), Medium (before scale), Low.

| Id | Gap | Severity | Recommended default | Owner |
|---|---|---|---|---|
| G1 | X4-R1 "sees" is not built: account B signed in on a phone holding A's book sees A's book (claim and upload are blocked). Many P0 rows depend on it | High; Critical for any build with sign-in on outside one family | ADR 0031 as the platform pass proposes: local rows carry the owner; a mismatched owner hides and locks the old book (no read, claim, upload, index or reminder) until that account returns or Erase everything runs. Test: BL-961 two-account integration test plus a device row. No screen names A (WORDS 5.6) | `mobile`, `data-architect`; ADR needs the founder |
| G2 | Code brute force: 6 digits, server limit per IP only, client pause reset by a kill | High before the public link | 8-digit codes (`otp_length = 8` and `EXPO_PUBLIC_EMAIL_OTP_LENGTH=8` in the same release; copy "The code has 8 digits"), keep 900 s, lower `token_verifications` to 15 per 5 min per IP, plus G3. Design must draw the code field for 6 to 10 digits | `security` (config), `mobile`, `content` |
| G3 | No CAPTCHA or bot control on email send; email bombing; the 100 per hour project cap can be exhausted by others | High before the public link | Cloudflare Turnstile on `signInWithOtp` (web view) before the public TestFlight link; add to subprocessors first; alert when the hourly cap is near; Apple stays available as the way in during an email cap | founder decision Q3, `mobile`, `ops` |
| G4 | Password path at the API: the email provider may accept `updateUser({password})` and password sign-in, giving a thief a durable credential (UNVERIFIED) | Medium (High if confirmed) | Staging test this week: set a password with a session and try password sign-in. If it works, reject all password attempts (a password verification hook, availability on our plan UNVERIFIED) and alert on any `password` grant in the auth audit log | `security` |
| G5 | No step-up before account deletion or Sign out other devices; the reauthentication template is unused | Medium | Keep deletion friction low (Apple 5.1.1(v)) and rely on the 30-day undo, but send an email to the account on deletion request and on cancel (records: a mail event, no content). No step-up for sign-out-others (it is protective) | `product`, `privacy`, `content` |
| G6 | No new-device sign-in email; no list of signed-in devices | Medium | "New sign-in to your book" email on each new session (method and time, no place, no device name) via the send-email hook when it is adopted; device list later | `product`, `security` |
| G7 | Apple revocation seen only when a user id first appears; no `credentialRevokedNotification` listener; no foreground check; no server-to-server endpoint (`consent-revoked`, email forwarding changes, account deletions) | Medium | Check `getCredentialState` on every foreground and listen for the notification (Apple TN3194). S2S endpoint after the flip; Apple's news makes it mandatory only for Korean developers with a Services ID, so it is not a launch blocker for us | `mobile` |
| G8 | No `security_events` record (SEC-R24): sign-in failures, linking, revocations, kill switches | Medium | Content-free table or log stream as chapter 06 says, 12 months; until then the Supabase auth audit log is the only record | `data-architect`, `security` |
| G9 | No remote pause for sign-in (only a build flag) | Low to Medium | `killSwitches.signIn` that hides the email path (or all) with the `notConfigured`-style line; never touches a signed-in session. Add to `packages/api` remote config and WORDS table 7 | `mobile`, `ops` |
| G10 | Wrong-code times and the resend clock are memory only (a kill resets them) | Low | Accept: the server is the control (G2). Do not store the address (PRD A F6.2) | none |
| G11 | `auth_failed.reason` lacks `email_wait`, `other_phone`, `other_phone_spent`, `already_signed_in` | Low | Add the four enums to the catalog (L2, closed list) | `analytics` |
| G12 | PKCE `plain` challenge | Low (accepted, ADR 0023) | Revisit when WebCrypto digest exists on Hermes | `security` |
| G13 | `docs/ops/SECURITY.md:131` says sign-ups 30 per hour; config is 30 per 5 min per IP | Low | Fix the ops doc | `ops` |
| G14 | Invite redeem per-device limit uses a client-supplied id; IP limit skipped without `CLIENT_IP_HEADER` | Low (alpha only) | Founder sets `CLIENT_IP_HEADER` on the function; keep the person and global limits as the real control | `ops` |
| G15 | Offline sign-out may leave the server session alive | Low | Accept for D1; offer Sign out other devices from the next sign-in; consider an inactivity timeout if the plan has it (UNVERIFIED) | `security` |
| G16 | Hide My Email: delivery of sign-in mail to relay addresses depends on registering the sending domain with Apple's private relay (named in `auth-email.md` sources; whether done is UNVERIFIED); the claim screen shows a masked relay address that means nothing to the person | Medium | Founder checks Apple Developer > Sign in with Apple > email communication for `earlyletters.com`; design shows the method ("Apple, email hidden") instead of a relay address on claim and Account | founder, `content`, design |
| G17 | The address is trimmed but not lower-cased before send; whether Supabase normalises case is UNVERIFIED | Low | Lower-case before send (the wait key already does) | `mobile` |
| G18 | No region check (store availability only) | Low | Keep as is (WORDS 4c HOLD) | none |
| G19 | Birthday and due-date ranges are checked on the phone only (no server check found) | Low | Server check in the next children migration (birthday not after today plus one day for time zones; due date within 10 months plus a margin) | `data-architect` |
| G20 | `/auth/confirm` accepted by the app but not in the redirect allowlist (SIGN-04) | Low | Add the exact URL when the templates move | `ops` |

What is already strong and must not regress: Keychain `THIS_DEVICE_ONLY`; email never stored; link accepted only on the asking phone with PKCE; never replaces a session; claim after consent and a tap; consent enforced in the database; content-free logs with request ids; no service key in the app; invite tokens hashed and codes peppered with counted guesses.

---

## 6. Door lines for the sign-in, consent and claim surfaces (PRIV-R21)

- **Shown:** the sign-in sheet's privacy line; the Terms agree line with versioned links; the sensitive-data screen word for word; the claim screen with the masked account email (or the method, G16).
- **Records:** on the server, one append-only policy act per answer (document, version, action, surface, method, time; idempotency key); on the phone, the last sign-in method and the Keychain items in 1.4. Never the email on the phone.
- **Never:** a letter, name or recording of one account shown to another (X4); an email link that signs in a phone that did not ask; a session replaced by a link; the code, token hash, Apple code or address in any log or analytics event.
- **Decline:** "Not now" on the sheet or Terms changes nothing and keeps the book on the phone; "Keep on this phone" keeps the person signed in with sync off; "Not my account" ends the session with nothing claimed; No on the age step ends the session and closes the gate.

---

## 7. Vendor sources read this session (20 Nov 2026)

- Supabase, Rate limits: https://supabase.com/docs/guides/auth/rate-limits . Sign-ups and sign-ins "30 requests per 5 minutes" per IP; OTP "60 seconds window before a new request is allowed for the same user"; verification "30 requests per 5 minutes" per IP; token endpoint "150 requests per 5 minutes" per IP; built-in email provider 2 per hour (custom SMTP raises it).
- Supabase, Passwordless email sign-in: https://supabase.com/docs/guides/auth/auth-email-passwordless . Default expiry 1 hour (we set 900 s); one request per 60 s; six-digit code; users are created automatically unless `shouldCreateUser` is false; "Email OTPs share an implementation with Magic Links". The page says nothing about enumeration.
- Supabase, Identity linking: https://supabase.com/docs/guides/auth/auth-identity-linking . "Supabase Auth automatically links identities with the same email address to a single user"; unconfirmed identities are removed when a new identity links; manual linking must be enabled (ours is off).
- Apple, TN3194 Handling account deletions and revoking tokens for Sign in with Apple: https://developer.apple.com/documentation/technotes/tn3194-handling-account-deletions-and-revoking-tokens-for-sign-in-with-apple . Revocation needs a refresh or access token; observe `credentialRevokedNotification` and use `getCredentialState`; on revocation delete the stored token and return to signed out; without tokens, still delete and direct the user to revoke manually.
- Apple Developer News, server-to-server notification requirement: https://developer.apple.com/news/?id=j9zukcr6 . From 1 January 2026, developers based in the Republic of Korea must give an endpoint when registering or updating a Services ID; notifications cover email forwarding changes, account deletions in the app and permanent Apple Account deletions.

UNVERIFIED this session: Supabase refresh-token reuse detection details; whether `signOut({scope:'local'})` revokes the server session; password set and password sign-in on our email provider settings; password verification hook availability on our plan; Apple private relay registration for our domain; Supabase email case normalisation; response timing for known versus new addresses; session inactivity timeout availability.
