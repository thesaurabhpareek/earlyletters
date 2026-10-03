# Email and email-auth security

Owner: L3 (infosec lane, `docs/emails/BRIEF.md`). Written 3 Oct 2026 on `feat/email-brand-library`. Status: recommendations; nothing applied.
Companion files: `supabase/auth-email.md` (exact Supabase and Resend settings, Apple relay steps, acceptance checks) and `apps/web/vercel.json` (website headers).
Builds on, and does not replace: TDD 04 (`docs/tdd/04-security-identity.md`) sections 3.1 to 3.2, PRD A F4 to F6 and A-NFR-008 to -012, LEGAL-REQ-014, -026, -029, DATA_CLASSIFICATION.

**Who changes DNS:** the founder, by hand, at Porkbun (the authoritative DNS host, `*.ns.porkbun.com`). This document gives exact record text. No agent changes DNS.

Labels: **Fact** (seen in a primary source or live system on 3 Oct 2026, source named), **Rec** (recommendation), **UNVERIFIED** (could not confirm; test or ask).

---

## 1. What we protect and from whom

| Asset | Level | Why it matters |
|---|---|---|
| Sign-in link token hash and 6-digit code | L4 (secret) | Either one is a full sign-in to the account for 15 minutes |
| Session (access and refresh tokens) | L4 | Account access until expiry or revocation |
| The account email address | L3 | It is the account. Whoever controls the inbox controls the book |
| The domain `earlyletters.com` (DNS, DKIM key, AASA file, website) | Root of trust | Control of DNS means valid-looking signed mail, a swapped app association file, and the site |
| Apple refresh token (for revocation) | L4 | Needed to honour Apple's deletion rule |

Attackers that matter here (TDD 04 2.2): **A1 ex-partner or household member** who knows the email and may hold an unlocked phone; **A4 account takeover** by phishing or inbox compromise; **A7 internet attacker** with the public API URL and anon key; **mail infrastructure** (scanners, forwarders) that is not malicious but behaves like an attacker by opening links.

---

## 2. Current state, read live on 3 Oct 2026

Facts (Resend API, read-only; DNS via `dns.google`):

| Item | Value today | Comment |
|---|---|---|
| DNS host | Porkbun | Registrar account security is now part of auth security (section 9 risk 1) |
| Website apex | A records 207.207.210.x (Porkbun parking) | Not on Vercel yet; `vercel.json` headers take effect only after the move |
| Wildcard | `*.earlyletters.com` CNAME `uixie.porkbun.com`; `*.earlyletters.app` similar | Every unknown subdomain (including `mta-sts`, `_mta-sts`, `_smtp._tls`) resolves to parking. **Rec:** delete both wildcards |
| MX | `9 inbound-smtp.us-east-1.amazonaws.com` (Resend receiving), `10 fwd1.porkbun.com`, `20 fwd2.porkbun.com` | Mail to `hello@` normally goes to Resend, but falls back to Porkbun forwarding when Resend is slow. Two inboxes for one address. **Rec:** pick one route (open question Q1) |
| Apex SPF | `v=spf1 include:_spf.porkbun.com ~all` | Covers Porkbun forwarding only |
| Resend return path | `send.earlyletters.com`: MX `feedback-smtp.us-east-1.amazonses.com`, SPF `v=spf1 include:amazonses.com ~all`; `rsend` CNAME `send.forge.rmta.net` | Verified |
| DKIM | `resend._domainkey.earlyletters.com` (1024-bit RSA key per the `p=` length) | Verified. Signs `d=earlyletters.com`, aligned with `hello@earlyletters.com` |
| DMARC | `v=DMARC1; p=none; rua=mailto:hello@earlyletters.com; adkim=r; aspf=r;` | Stage 1 of 3 already live. Reports land in the human inbox (section 6.3) |
| MTA-STS, TLS-RPT | None (only the wildcard answers) | Section 6.4 |
| CAA | None | Section 6.7 |
| Resend tracking | Open off, click off, on both Early Letters domains | Matches the brief. Keep it off |
| `earlyletters.app` in Resend | `not_started` (no DNS records) | Section 6.6 asks whether .app should ever send |
| Resend API keys | One key, "HelloLumira for claude code", shared with another product | Section 9 risk 1; `supabase/auth-email.md` 2 |
| `packages/brand` | `publisher.domain: 'example.com'`, `scheme: 'scribe'` | BL-100 still open; bundle id and AASA app id depend on it |
| App config | `apps/mobile/app.config.ts` sets `scheme: brand.scheme` (`scribe`); no associated domains, no Apple sign-in plugin yet | The A-NFR-010 note about the scaffold scheme `lumiraletters` is resolved; universal links are not set up yet |

---

## 3. Email sign-in threat model and controls

### 3.1 Link interception and scanner prefetch (one-time links burned by mail security)

**Threat.** Corporate and consumer mail security (Fact, Supabase "Email prefetching": "Safe Links in Microsoft Defender for Office 365" is the named example) fetches every link in an inbound message. Supabase's default `{{ .ConfirmationURL }}` points at `/auth/v1/verify`, which verifies on a plain GET, so "the `{{ .ConfirmationURL }}` sent will be consumed instantly which leads to a 'Token has expired or is invalid' error" (Supabase). Separately, a token in a URL query string lands in web server logs, browser history and Referer headers.

**Control (Rec, matches PRD A F5 and TDD 04 3.1.3, path from PRD A):**

1. The email link is our own: `https://earlyletters.com/auth/confirm#token_hash={{ .TokenHash }}&type=email`. The token hash is in the **fragment**. Browsers never send fragments to servers, so Vercel never logs it and a scanner's GET carries nothing usable.
2. The page at `/auth/confirm` **never verifies**: no call to Supabase on load, on script run, or on any button. It is static. Its only jobs: tell the person to type the code from the email into the app, offer an "Open the app" button, and (for expired links) point to the app's resend. Spec in 3.2.
3. Only the app verifies, with `supabase.auth.verifyOtp({ token_hash, type: 'email' })` (a POST) when iOS hands it the universal link, or `verifyOtp({ email, token, type: 'email' })` when the person types the code. Supabase documents both calls (`auth-email-passwordless`).
4. The same email carries the 6-digit code, so a link that opens in the wrong place is never a dead end (D-044).

**Why this resists prefetch:** a scanner can fetch the page, run its scripts, and click its buttons, and nothing is spent, because nothing on the web side can spend the token. Only an app holding our bundle id, opened by iOS from a universal link, spends it.

**Interception residual.** Anyone who reads the email (inbox compromise, forwarded message, shared family inbox) can sign in until the token is used or expires. Same for every email-link product; mitigations are short expiry (3.4), single use (3.5), sign-in notices (section 5.3) and "Sign out other devices" (TDD 04 3.1.4 item 4). Transport: Resend Enforced TLS on (`supabase/auth-email.md` 2.4).

**Conflict to fix (outside this lane):** D2's `packages/emails/src/templates/supabase.ts` `linkFor` currently builds `{{ .SiteURL }}/auth/confirm?token_hash=...&type=...` (query string). Change `?` to `#`. TDD 04 3.1.3 uses the path `/a#th=`; PRD A F5 and D2 use `/auth/confirm`. **Rec:** `/auth/confirm` with `#token_hash=` (one name across PRD, D2, AASA and Vercel). TDD 04 should be amended to match.

### 3.2 Deep links, the app scheme, and the `/auth/confirm` page

- **Universal links carry tokens; the custom scheme never does.** Fact: the scheme is `scribe` (`brand.scheme`). Any app may register a custom scheme; Supabase's deep-link guide says the scheme should be "unique across the user's device", and `scribe` is a common word. A token sent to `scribe://` could reach another app. **Rec:** the `/auth/confirm` "Open the app" button is `scribe://` with no token, or better, consider changing `brand.scheme` to something distinctive such as `earlyletters` before the first store build (change in `packages/brand`, owner: founder; codename `scribe` stays).
- **AASA.** Served at `https://earlyletters.com/.well-known/apple-app-site-association`, no redirect (Fact, Apple "Supporting associated domains": "You must host the file using https:// with a valid certificate and with no redirects"; since iOS 14 Apple's CDN fetches it). `vercel.json` sets `Content-Type: application/json` for it. Minimal content (D3 creates the file; app id after BL-100):
  ```json
  {
    "applinks": {
      "details": [
        {
          "appIDs": ["<TEAMID>.<bundleId()>"],
          "components": [
            { "/": "/auth/confirm", "comment": "Email sign-in link; token in the fragment" }
          ]
        }
      ]
    }
  }
  ```
  Invite and return-link paths (`/i`, `/j`, `/r`) are added by their owners; keep the list explicit, never `"/*"`, so marketing pages stay in Safari. Fragments pass through to the app (AASA `components` can even match on `"#"`, Fact, Apple's sample).
- **Same-domain taps.** If the link opened in Safari or a mail app's in-app browser, tapping a link to the same domain on that page generally does not trigger the universal link (UNVERIFIED as current iOS behaviour; widely reported). That is why the page relies on the code, not on a second universal-link button. Optional later: a second associated host (for example `go.earlyletters.com`) for a cross-domain "Open in app" button; test before relying on it.
- **`/auth/confirm` page rules (D3 builds it; it is not in D3's page list yet):**
  1. Static; no Supabase client, no `fetch`, no analytics, no third-party script.
  2. Read `location.hash` once; accept `token_hash` only if it matches `^[A-Za-z0-9_-]{16,128}$` and `type` only from `email`, `email_change`; render nothing from the fragment into the DOM except through `textContent` (the fragment is attacker-controllable text).
  3. Immediately `history.replaceState(null, '', '/auth/confirm')` so the token hash leaves history and synced tabs.
  4. Copy: "Open the email on the phone with the app, or type the code from the email into the app." Never reveal whether an account exists.
  5. `vercel.json` gives it `Cache-Control: no-store` and `noindex`.
- **App handler (mobile lane):** accept only `https://earlyletters.com/auth/confirm` with a fragment; ignore query parameters, any `redirect`, `next` or `url` value, and any other host. Store nothing from the URL except in memory until `verifyOtp` returns. Strip `token_hash` from Sentry breadcrumbs (A-NFR-012 already says so).

### 3.3 PKCE: where it helps and where it does not

- `{{ .ConfirmationURL }}` plus PKCE (`flowType: 'pkce'`): Supabase redirects to `redirect_to?code=...`, and only the device holding the code verifier can exchange the code. That binds the link to the requesting phone, which blocks a stolen link on another device. But (a) the token is still spent by a scanner's GET before the person taps, and (b) it breaks the cross-device case that D-044 and PRD A F5.5 require. Rejected for email.
- `token_hash` plus `verifyOtp` (chosen): prefetch-safe as long as no web page verifies, works on any device. Device binding is lost, but the 6-digit code in the same email is not device-bound either, so PKCE would not have raised the bar for an attacker who reads the email.
- Supabase documents that a PKCE-flow project should put `{{ .TokenHash }}` in the template and call `verifyOtp({ token_hash, type: 'email' })` (Fact, `auth-email-passwordless`). Whether a PKCE-flow token hash can be verified on a device that did not start the flow is **UNVERIFIED**. Rec: initialise supabase-js in the app with `flowType: 'pkce'` (needed later for Android Apple OAuth), and add acceptance check "link requested on phone A, tapped on phone B" to `supabase/auth-email.md` section 8 before relying on cross-device links. If it fails, the code path still works.
- Apple on iOS uses the native sheet and `signInWithIdToken` (no redirect, no PKCE needed); section 4.

### 3.4 OTP brute force and expiry

Facts (Supabase `auth/rate-limits` and CLI config reference, 3 Oct 2026): `/auth/v1/verify` is limited **per IP** to 30 requests per 5 minutes; OTP length is configurable from 6 to 10 digits; expiry default 3600 s, and the same expiry governs links. No per-address failed-attempt lockout is documented (UNVERIFIED that none exists; TDD 04 finding 6 assumes none).

Arithmetic for one targeted address, attacker using N distinct IPs, each at the per-IP ceiling (90 guesses per IP in 15 minutes, 360 in an hour), chance of a hit is about N x guesses / code space:

| Setting | 50% chance needs about |
|---|---|
| 6 digits, 1 hour (PRD A today) | 1,400 IPs (matches TDD 04) |
| **6 digits, 15 minutes (Rec)** | **5,600 IPs** |
| 8 digits, 1 hour | 139,000 IPs |
| 8 digits, 15 minutes | 556,000 IPs |

**Rec for v1.0:** length **6** (D-044, brief), expiry **900 s**, so copy `{expiresIn}` is "15 minutes" (C1 placeholder; D2 export). This is a 4x reduction at zero UX cost for the normal path (auth email p90 30 s, A-NFR-004), and the expired path has its own email (`sign-in-trouble`). It amends PRD A F4's "expire in 1 hour" and A-REQ-018: **founder OK needed (Q2)**. Open question carried from TDD 04 OQ-S1: 8 digits is a config switch plus copy; it costs typing effort for grandparents. Rec: stay at 6 unless detection (below) ever fires.

Layered controls (from TDD 04 3.1.4, kept): app-side lockout copy after 5 wrong codes (`auth.code.pause`, honest users only); a scheduled job that reads Auth logs for verify failures grouped by a hash of the email and pages the founder above 20 per address per hour, then `auth.admin.signOut(user, 'global')`; CAPTCHA on code **requests** if the public link launches (Q3).

### 3.5 Replay and single use

- Supabase consumes the OTP on successful verification; the link and the code come from the same token (`{{ .TokenHash }}` is "a hashed version of the `{{ .Token }}`", Fact). That using the code also invalidates the link is **UNVERIFIED**; acceptance check 4 tests it.
- A new request replaces the earlier code for that user (UNVERIFIED; check: after "Send a new email", the first code must fail).
- Sessions: access token 900 s, refresh-token rotation with reuse detection (`supabase/auth-email.md` 3.5). Tokens only in Keychain (A-NFR-008).

### 3.6 Enumeration

- The app screen and the `signInWithOtp` response are identical for known and unknown addresses (OWASP Authentication Cheat Sheet: "respond with a generic error message regardless of whether" the user exists; Fact). Call `signInWithOtp({ email, options: { shouldCreateUser: true } })` from every entry point (TDD 04 3.1.3), so the server path does not branch on the client's intent.
- The **email** may differ (`sign-in-link` for an existing account, `verify-email` for a new one, `account-create-attempt` per the brief). That is safe: only the inbox owner reads it.
- Residuals: response timing may differ between existing and new users (UNVERIFIED; measure in staging with 50 requests each; if the median differs by more than 100 ms, note it, since Auth is Supabase-hosted we cannot pad it). The 60-second resend error is per user and appears for new and existing addresses alike once a request was made, so it reveals a recent request, not existence.
- Apple: Apple sign-in reveals nothing about our users.

### 3.7 Account takeover through email change; reauthentication for deletion

**Email change.** Whoever holds a session can call `updateUser({ email })` directly against the API, so app-side checks alone do not protect it.
- **Secure email change on** (`double_confirm_changes`): Fact, both the current and new address must confirm. An attacker with a stolen session but not the old inbox cannot move the account.
- **"Email address changed" notification on** to the old address (Supabase native, D2 maps `email-changed-old-address`).
- Rec: v1.0 Settings offers email change only if PRD C calls for it; if it does, the app first requires a fresh sign-in (below). With the Send Email Hook path, remember the reversed token pairs (`supabase/auth-email.md` 7.4).

**Account deletion.** The deletion RPC must not trust an old session: an unlocked phone in another person's hands (A1) should not be enough. Supabase JWTs carry `amr`, a list of `{ method, timestamp }` (Fact, `auth/jwt-fields`). **Rec (new migration, outside this lane):** `request_account_deletion` refuses unless the newest `amr` timestamp is within 10 minutes:
```sql
-- inside request_account_deletion, before any change
if coalesce((select max((e->>'timestamp')::bigint)
             from jsonb_array_elements(auth.jwt()->'amr') e), 0)
   < extract(epoch from now())::bigint - 600 then
  raise exception 'SCREAUTH: sign in again to delete this account' using errcode = 'P0001';
end if;
```
The app's re-auth step is just a fresh sign-in: Apple users go through the Apple sheet again (`signInWithIdToken`), email users get a new code (`signInWithOtp` with `shouldCreateUser: false`, then `verifyOtp`). Whether a token refresh preserves the original `amr` timestamp (so refresh cannot fake freshness) is **UNVERIFIED**; add a db test. Supabase's `reauthenticate()` sends a "reauthentication" code, but that nonce is only consumed by `updateUser({ password, nonce })`, so it does not fit deletion; D2's `reauthenticate-code` template can stay but our flow does not use it. Also send an email to the account address when deletion is **requested** (with the 30-day undo), not only when it completes (LEGAL-REQ-029 asks for the completion one); C2 owns the copy.

### 3.8 Phishing, look-alikes, homographs, open redirects

- **Look-alike and homograph domains.** DMARC `p=reject` (6.3) stops exact-domain spoofing only. Rec: monitor Certificate Transparency for names containing `earlyletters` (crt.sh query, monthly at first); defensively register `earlyletters.co` if still free (PRD notes it was on 2 Oct; UNVERIFIED today); BIMI later (6.5). Our own domains are plain ASCII.
- **Email rules that make phishing easier to spot** (section 5): one sender, one link host, the code is never requested by phone, text or chat (C1 already says this), the fallback shows the full URL as text.
- **Open redirects.** The site is static and has no redirect endpoint that takes a destination from the request. `vercel.json` has no redirects. The `.app` to `.com` 308 is a fixed host redirect in Vercel's domain settings. The Supabase redirect allowlist is one exact URL (`supabase/auth-email.md` 3.4). The app's link handler ignores `redirect`, `next` and `url` parameters (3.2).

### 3.9 Email bombing and sign-up spam

`shouldCreateUser: true` means anyone can make Supabase send a confirmation to any address. Limits: 1 per address per 60 s, 30 sign-in requests per 5 minutes per IP, and the project-wide hourly email cap. The cap protects reputation and the Resend quota but is also a denial-of-service lever: a botnet that exhausts it blocks email sign-in for everyone for the rest of the hour (Apple sign-in still works). Rec: cap 100 per hour for beta; alert at 70% (section 7); CAPTCHA on requests before the public TestFlight link (Q3). Unconfirmed auth users pile up: a weekly job deletes `auth.users` rows never confirmed after 7 days (UNVERIFIED that Supabase does not already expire them; check).

---

## 4. Sign in with Apple

### 4.1 Nonce (A-NFR-009, TDD 04 3.1.1)
Generate 32 random bytes per attempt (raw nonce), pass `SHA-256(raw)` as hex to the Apple request and the raw value to `supabase.auth.signInWithIdToken({ provider: 'apple', token, nonce: raw })`. Supabase checks the token's `nonce` claim against the hash, which stops a captured ID token being replayed into our project (Fact: Supabase's native Apple example hashes the nonce for Apple and passes the raw one to Supabase). Supabase's Expo example omits the nonce; ours must not. `expo-apple-authentication` `signInAsync({ nonce })` is the hook (UNVERIFIED parameter name for the installed version; check the Expo docs for SDK 57).

### 4.2 Token revocation on account deletion (A-NFR-011, LEGAL-REQ-029)
Facts (Apple TN3194, Apple `revoke-tokens`): apps that allow account creation must allow in-app deletion (since 30 June 2022); `POST https://appleid.apple.com/auth/revoke` with `client_id`, `client_secret` (a JWT signed with the Sign in with Apple key), `token`, `token_type_hint=refresh_token`; it returns 200 when the token is revoked "or was previously invalid". You need a refresh or access token, so the authorization code must be exchanged at first sign-in and the refresh token stored. If none was stored, Apple says to still delete the data, direct the user to stop using Apple ID with the app in their Apple account settings, and react to the credential-revoked notification.

Rec (as designed in TDD 04 3.1.1, kept): an `apple-token` Edge Function exchanges the code once at sign-in and stores the refresh token AES-GCM encrypted (`apple_tokens`, service role only); the deletion job revokes it, then deletes the row and records `apple_token_revoke` in the deletion ledger (the migration's processor list already includes `apple_token_revoke`). The function signs a fresh client-secret JWT per call (Apple caps its lifetime at about six months, UNVERIFIED exact limit), so nothing expires silently. The app listens for credential revocation and signs out locally only after unsynced letters sync (A-REQ-033).

### 4.3 Private relay and server-to-server notifications
- Register sending domains and `hello@earlyletters.com` with "Sign in with Apple for Email Communication" (steps in `supabase/auth-email.md` 6). Fact: Apple requires SPF and/or DKIM; with Resend, register `earlyletters.com` and `send.earlyletters.com`.
- Never treat a relay address as an identity across providers; never auto-merge accounts by email (TDD 04 3.1.5).
- Server-to-Server notifications (`consent-revoked`, `account-delete`, `email-disabled`): Supabase does not consume them (Fact, Supabase Apple guide "leave that setting blank"). v1.0: blank. Later: an Edge Function that verifies Apple's signed payload and starts the same deletion or sign-out path.

---

## 5. Email content rules (security)

1. **Links only to `https://earlyletters.com/...`** plus `mailto:hello@earlyletters.com`. No URL shorteners, no tracking redirects, no links to Supabase hosts, no `.app` links. Lint for it in D1's test suite (D1 lane).
2. **No tracking.** No pixels; Resend open and click tracking off (Fact: off today). Images only from `https://earlyletters.com/email/`.
3. **The sign-in link is visible as text** in the fallback line so a careful reader can check the host.
4. **Never request secrets.** No email asks the reader to reply with a code, or to sign in to anything but the app. Every code email carries "We will never ask for this code by phone, text or chat" (C1 `NEVER_ASK`).
5. **No user-controlled text in auth emails** (no `{{ .Data }}` or display names); the email address itself is fine. User text in an email is an injection and phishing channel.
6. **No content in subjects** (LEGAL-REQ-014): no child names, no codes in subjects. Supabase's default reauthentication subject puts the code in the subject (`{{ .Token }} is your verification code`); our template must not.
7. **Request context: time yes, location no.** Rec: security notices we send ourselves (new sign-in, deletion requested) show the time in words with the time zone named, and a coarse device ("an iPhone"). Do not show IP-derived location: it needs a geolocation lookup on an IP (L3 data, possibly a new processor), it is often wrong on cellular networks, and in a shared or compromised inbox it discloses where the account holder is. C1 already writes `{device}` as "never a location", which matches. Supabase SMTP templates have no time or device variable, so Supabase-sent sign-in emails carry neither; the mail client's received time is enough.
8. **One sender identity.** `Early Letters <hello@earlyletters.com>` for every transactional email; marketing, when it exists, from a separate subdomain (6.5).

---

## 6. Deliverability security (DNS records for the founder)

All values below are exact TXT or record contents to type at Porkbun. TTL: Porkbun default (600 s) is fine. Do steps in order; each says when to move to the next.

### 6.1 Clean-up first
| Action | Record | Why |
|---|---|---|
| Delete | `*.earlyletters.com` CNAME `uixie.porkbun.com` | Parking wildcard answers for every name, including the MTA-STS and TLS-RPT names below |
| Delete | `*.earlyletters.app` wildcard | Same |
| Decide (Q1) | MX set for `earlyletters.com` | Today two routes (Resend receiving and Porkbun forwarding). Keep one. If Resend receiving is the inbox, delete the Porkbun `fwd1`/`fwd2` MX records; if Porkbun forwarding is the inbox, delete the Resend MX and turn off receiving in Resend |

### 6.2 SPF and DKIM
- Resend's records are in place and verified (section 2). Nothing to add for Resend.
- Apex SPF stays `v=spf1 include:_spf.porkbun.com ~all` while Porkbun forwarding is used; if Q1 removes Porkbun forwarding and nothing else sends with an `@earlyletters.com` envelope sender, change it to `v=spf1 -all` after the DMARC reports confirm no other source.
- DKIM key length: the Resend key is 1024-bit (Fact, length of `p=`). Fine for now; ask Resend whether 2048-bit is available on rotation (UNVERIFIED).

### 6.3 DMARC staged path (RFC 7489)
Use a separate mailbox for reports so they do not bury customer mail: `dmarc@earlyletters.com` (routes to whichever inbox Q1 picks; UNVERIFIED that Resend receiving accepts any local part).

| Stage | When | `_dmarc.earlyletters.com` TXT |
|---|---|---|
| 1 (now, replaces today's record) | Today | `v=DMARC1; p=none; rua=mailto:dmarc@earlyletters.com; adkim=r; aspf=r; fo=1` |
| 2 | After 2 weeks of reports in which every legitimate source passes (Resend, and whatever the founder replies from, Q4) | `v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc@earlyletters.com; adkim=r; aspf=r; fo=1` |
| 3 | After 4 more clean weeks | `v=DMARC1; p=reject; rua=mailto:dmarc@earlyletters.com; adkim=r; aspf=r; fo=1` |

`aspf=r` is required: Resend's envelope sender is `send.earlyletters.com`, aligned with `earlyletters.com` only in relaxed mode. `sp` is omitted so subdomains inherit `p`. Before stage 2, confirm how the founder replies "from" `hello@` (Q4): a reply sent through a personal Gmail with "send mail as" is signed `d=gmail.com` and fails DMARC, and under `p=reject` it bounces.

### 6.4 MTA-STS and TLS-RPT (RFC 8461, RFC 8460)
Protects mail **to** `@earlyletters.com` (customer replies, support, deletion requests) from TLS downgrade. Do this after Q1 so the MX list is final.

| Record | Value |
|---|---|
| `_mta-sts.earlyletters.com` TXT | `v=STSv1; id=20261003T0000` (change the id every time the policy file changes) |
| `_smtp._tls.earlyletters.com` TXT | `v=TLSRPTv1; rua=mailto:tls-reports@earlyletters.com` |
| `mta-sts.earlyletters.com` | Add as a domain on the Vercel project; create the record Vercel's domain screen shows (UNVERIFIED value in advance) |

Policy file at `https://mta-sts.earlyletters.com/.well-known/mta-sts.txt`, `Content-Type: text/plain` (RFC 8461 requires it), CRLF line endings, start in testing mode:
```
version: STSv1
mode: testing
mx: inbound-smtp.us-east-1.amazonaws.com
max_age: 86400
```
(List exactly the MX hosts left after Q1, one `mx:` line each; if Porkbun forwarding stays, add `fwd1.porkbun.com` and `fwd2.porkbun.com`.) After 2 to 4 weeks of TLS-RPT reports with no failures, switch to `mode: enforce`, `max_age: 1209600`, and change the TXT `id`. Whether `inbound-smtp.us-east-1.amazonaws.com` and the Porkbun forwarders present certificates valid for their MX names is **UNVERIFIED**; testing mode exists to find out. D3 adds `apps/web/public/.well-known/mta-sts.txt` (outside this lane); `.txt` is served as `text/plain` by default (UNVERIFIED for Vercel; check with `curl -I`).

### 6.5 Marketing subdomain and BIMI
- **Marketing** (not built): send from `news.earlyletters.com` as its own Resend domain, with its own DKIM key and return path, so a complaint spike on newsletters never touches sign-in mail (Fact: Resend and Supabase both recommend separating auth and marketing domains). It inherits apex DMARC. If it ever mails Apple relay users, register it with Apple. One-click unsubscribe is L2's.
- **BIMI** prerequisites (Fact, Resend BIMI guide): apex DMARC at `p=quarantine` or `p=reject` with `pct=100`; an SVG Tiny PS logo; a mark certificate for Gmail and Apple Mail display: VMC needs a registered trademark (the name is "not yet trademark-cleared", `packages/brand`), CMC needs a year of logo use. So: earliest about a year after the logo ships, or after a trademark registration. Record when ready: `default._bimi.earlyletters.com` TXT `v=BIMI1; l=https://earlyletters.com/bimi/logo.svg; a=https://earlyletters.com/bimi/mark.pem`. Not now.

### 6.6 `earlyletters.app`
The brief says .app 308-redirects to .com and is "pending DNS" for Resend sending. Rec: **.app never sends or receives mail** (one sender identity, section 5.8). Then lock it down, which also stops spoofing of the second domain:

| Record | Value |
|---|---|
| `earlyletters.app` MX | `0 .` (null MX, RFC 7505: "this domain accepts no mail") |
| `earlyletters.app` TXT | `v=spf1 -all` |
| `_dmarc.earlyletters.app` TXT | `v=DMARC1; p=reject; rua=mailto:dmarc@earlyletters.com` |
| `earlyletters.app._report._dmarc.earlyletters.com` TXT | `v=DMARC1` (authorises .com to receive .app's reports, RFC 7489 7.1) |

and remove `earlyletters.app` from Resend. If the founder wants .app to send (Q5), use the five records Resend lists for it instead and register it with Apple.

### 6.7 CAA (optional)
`earlyletters.com` CAA `0 issue "letsencrypt.org"` and `0 iodef "mailto:hello@earlyletters.com"`. Vercel documents Let's Encrypt for its certificates; whether Vercel's custom-domain certificates can come from another CA is **UNVERIFIED**, so check Vercel's current guidance before adding, or skip. A wrong CAA blocks certificate renewal for the site and the MTA-STS host.

---

## 7. Monitoring and alerts (founder's phone)

| Signal | Source | Threshold |
|---|---|---|
| Verify failures per address | Supabase Auth logs, grouped by hash of email | over 20 per hour (TDD 04 3.1.4) |
| Project email cap | Supabase Auth logs (rate-limit errors on `/otp`) | any hit; warn at 70% of the hourly cap |
| Bounces and complaints | Resend webhooks `email.bounced`, `email.complained` (not opens or clicks) | complaint rate above 0.1% weekly |
| Apple relay failures | Apple's relay notification emails | any |
| DMARC aggregate | `dmarc@` reports | weekly review until stage 3, then monthly |
| TLS-RPT | `tls-reports@` | any failure while in testing mode |
| Certificate Transparency | crt.sh for `%earlyletters%` | monthly |
| Console logins | Porkbun, Resend, Supabase, Vercel, Apple, GitHub new-device alerts | any unexpected |

---

## 8. Website security headers (`apps/web/vercel.json`)

Validated on 3 Oct 2026 against Vercel's published schema (`https://openapi.vercel.sh/vercel.json`, Draft 7 validator: 0 errors).

| Header | Value | Reason |
|---|---|---|
| `Content-Security-Policy` | `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; upgrade-insecure-requests` | No inline script or style, no third parties. `frame-ancestors` only works as a header, not in a meta tag |
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | Vercel's default for custom domains is `max-age=63072000` without subdomains (Fact, Vercel "Encryption and TLS"). `preload` deliberately left out (below) |
| `Referrer-Policy` | `no-referrer` | Nothing on the site needs to tell other sites where a visitor came from |
| `Permissions-Policy` | every powerful feature `=()` | The site needs none. The v1.1 web contribution page will need `microphone=(self)` on its own path only |
| `X-Content-Type-Options` | `nosniff` | |
| `X-Frame-Options` | `DENY` | Older browsers; `frame-ancestors 'none'` is the modern control |
| `Cross-Origin-Opener-Policy` | `same-origin` | |
| `/auth/confirm` | `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow` | |
| `/.well-known/apple-app-site-association` | `Content-Type: application/json` | Extensionless file |
| `/email/*` | `Cross-Origin-Resource-Policy: cross-origin`, cache one day | Email clients load these images from other origins; not `immutable` because file names are not content-hashed |
| `cleanUrls: true`, `trailingSlash: false` | | One canonical URL per page (Vercel 308s the others) |

**Astro 7.3.5 static output and the strict CSP** (Fact, read from `node_modules/astro/dist`): Astro inlines a processed `<script>` when its bundle is smaller than Vite's `build.assetsInlineLimit` (default 4 KB) and inlines stylesheets under the same limit when `build.inlineStylesheets` is `'auto'` (the default). Inline code would be blocked by `script-src 'self'; style-src 'self'`. Astro's built-in CSP (`security.csp`, off by default) computes hashes but, for prerendered pages without an adapter, writes them into a `<meta http-equiv="content-security-policy">` tag; with both a header and a meta policy, the browser enforces both, so hashes in the meta tag do not relax our header. So D3 must (changes in D3's lane):
1. `astro.config`: `build: { inlineStylesheets: 'never' }` and `vite: { build: { assetsInlineLimit: 0 } }`.
2. No `is:inline` scripts, no `define:vars`, no `style="..."` attributes, no `on*=` handlers, no speculation rules, no View Transitions client router unless verified clean.
3. A build check that fails on any of those in `dist/**/*.html`:
   ```sh
   ! grep -rnP '<script(?![^>]*\bsrc=)(?![^>]*type="application/ld\+json")[^>]*>' dist --include=*.html \
   && ! grep -rnP '<style[\s>]' dist --include=*.html \
   && ! grep -rnP '\sstyle="' dist --include=*.html \
   && ! grep -rnP '\son[a-z]+="' dist --include=*.html
   ```
If D3 cannot avoid inline code, the fallback is: turn on Astro `security.csp` (meta tag with hashes) and reduce the header CSP to the directives a meta tag cannot carry: `frame-ancestors 'none'; base-uri 'none'; object-src 'none'; form-action 'self'`. Tell L3 if that happens.

**HSTS preload.** `.app` is already on the HSTS preload list as a whole TLD (Fact, hstspreload.org API: `app` status `preloaded`), so `earlyletters.app` is HTTPS-only in browsers regardless of our header. `earlyletters.com` is not preloaded (status `unknown`). Rec: after a month on Vercel with every subdomain on HTTPS (`www`, `mta-sts`, later `news`), add `; preload` to the header and submit at hstspreload.org. Removal from the list takes months, so do it deliberately. `includeSubDomains` is safe now because no subdomain serves plain HTTP (the Resend `send` and `rsend` names carry no website).

---

## 9. Top 5 risks, ranked

1. **One person's consoles are the root of trust.** Porkbun (DNS, so DKIM, MX, AASA and the site), Resend (the existing key is shared with another product and an AI tool connection), Supabase, Vercel, Apple. Whoever gets in can send perfectly signed phishing or take accounts. Fix: hardware-key or passkey MFA on all six, Porkbun registrar lock and auto-renew, dedicated sending-only Resend key restricted to `earlyletters.com`.
2. **Sign-in link format.** Today's D2 export uses a query string, and `/auth/confirm` is not in D3's page list. Shipped as is: tokens in Vercel logs (LEGAL-REQ-014 breach), and if anyone falls back to `{{ .ConfirmationURL }}`, scanners burn links for Outlook and workplace users. Fix: fragment link, static non-verifying page, AASA (3.1, 3.2).
3. **Distributed code guessing.** Supabase limits verification per IP, not per address. Fix: 15-minute expiry (needs founder OK), detection job, forced sign-out; 8 digits held in reserve (3.4).
4. **Email bombing and cap exhaustion without CAPTCHA.** Anyone can make us mail anyone, and exhausting the hourly cap blocks email sign-in for everyone. Fix: alerts now, CAPTCHA before the public TestFlight link (3.9, Q3).
5. **Apple obligations.** Without relay registration, Hide My Email users never get codes or security notices; without the code exchange at sign-in, deletion cannot revoke the Apple token (TN3194; App Review risk). Fix: `supabase/auth-email.md` 6 and the `apple-token` function before C1 beta.

Also tracked: deletion and email change without fresh sign-in (3.7, needs a migration); split MX and an unauthenticated reply path blocking DMARC enforcement (6.1, 6.3).

---

## 10. Open questions for the founder

- **Q1** Which inbox is `hello@`: Resend receiving or Porkbun forwarding to a personal mailbox? Keep one MX route.
- **Q2** Code and link expiry 15 minutes instead of PRD A's 1 hour? (Rec yes.) C1's `{expiresIn}` and D2's export follow the answer.
- **Q3** CAPTCHA (Turnstile or hCaptcha, a new processor) before the public TestFlight link?
- **Q4** How do you send replies as `hello@earlyletters.com`? DMARC stage 2 waits on this.
- **Q5** Should `earlyletters.app` ever send email? (Rec no; lock it down.)
- **Q6** Change the deep-link scheme from `scribe` to something distinctive before the first build?

## 11. Changes needed outside this lane

| Owner | Change |
|---|---|
| D2 | `supabase.ts` `linkFor`: `?token_hash=` to `#token_hash=`; production export uses only the token-hash mode; no code in any subject |
| C1 | `{expiresIn}` = "15 minutes" (or "1 hour" if Q2 is no); copy for "sign-in method removed" notice |
| C2 | "Deletion requested" email with undo, sent at request time |
| D3 | `/auth/confirm` page per 3.2; `public/.well-known/apple-app-site-association`; later `public/.well-known/mta-sts.txt`; Astro config and build check per section 8 |
| D1 | Test that every `href` in rendered emails starts with `https://earlyletters.com/` or `mailto:hello@earlyletters.com`, and every `img src` with `https://earlyletters.com/email/` |
| Mobile | Associated Domains entitlement `applinks:earlyletters.com`; Apple nonce; link handler rules (3.2); `flowType: 'pkce'` |
| Database (new migration) | Fresh-sign-in check in `request_account_deletion` (3.7); `apple_tokens` per TDD 04 |
| Founder | DNS (section 6), Resend key, Supabase settings, Apple relay (`supabase/auth-email.md`), console MFA |
| PRD A / TDD 04 | Link path `/auth/confirm#token_hash=` everywhere; expiry per Q2; anonymous sign-ins off until v1.1 |

## 12. Sources opened 3 Oct 2026

Supabase docs (`supabase.com/docs/guides/...`): auth/rate-limits, auth/auth-hooks, auth/auth-hooks/send-email-hook, auth/auth-email-templates, auth/auth-email-passwordless, auth/auth-smtp, auth/redirect-urls, auth/native-mobile-deep-linking, auth/social-login/auth-apple, auth/jwt-fields, auth/auth-captcha, deployment/going-into-prod, local-development/cli/config. Resend docs (`resend.com/docs/...`): create-an-api-key, send-with-smtp, send-with-supabase-smtp, dashboard/domains/introduction, tracking, tls, custom-return-path, dmarc, bimi, knowledge-base/sending-apple-private-relay. Apple: developer.apple.com/help/account/capabilities/configure-private-email-relay-service; documentation/signinwithapplerestapi/revoke-tokens; TN3194; documentation/xcode/supporting-associated-domains. Vercel: docs/cdn-security/encryption, docs/cdn-security/security-headers, openapi.vercel.sh/vercel.json. RFC 8461 (MTA-STS). OWASP Authentication Cheat Sheet. hstspreload.org status API. Cited but not reopened this session: RFC 7489 (DMARC), RFC 7505 (null MX), RFC 8460 (TLS-RPT).
