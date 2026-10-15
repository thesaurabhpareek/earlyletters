# Sign-in setup: every dashboard step

Owner: auth engineer. Written 3 Oct 2026 for the founder. Follows BRIEF decisions 4 (Apple, Google, email link; passkeys after sign-in; no passwords), 5 (co-parent only at launch), 13 (domains, Resend) and 17 (API standards).

Labels: **Verified** means checked on an opened vendor page or in the installed library source on 3 Oct 2026. **Assumption** means believed, not yet checked; each has a test in section 11. Dashboard menu names move; if a label below differs, look for the same setting nearby.

What the app expects, in one table:

| Thing | Value |
|---|---|
| Website (universal links) | `https://earlyletters.com` (from `packages/brand`) |
| Email link | `https://earlyletters.com/auth/callback#token_hash=<hash>&type=email`. Opened only on the phone that asked for it, through PKCE (section 4.6, ADR 0023) |
| Custom-scheme fallback | `scribe://auth/callback` (opens the code screen; never carries a token) |
| Invite link | `https://earlyletters.com/i/<token>` |
| Apple token capture | Edge Function `apple-token` (section 2.7) |
| Bundle ids | `com.earlyletters.scribe` (production), `.preview`, `.dev` (internal builds) |
| Sender | `hello@earlyletters.com` through Resend SMTP |

Do the sections in order. Sections 1 to 6 are needed before anyone but you signs in. Section 7 (passkeys) can wait.

---

## 1. Supabase project basics

Dashboard: your project (`early-letters`, us-west-1).

1. **Project Settings > API Keys**: copy the **Project URL** and the **publishable key** (`sb_publishable_...`; older projects call it the `anon` key). Both are public by design and go into the app (section 8). Never copy the `service_role` or secret key anywhere near the app.
2. **Authentication > Sign In / Providers > Auth settings** (labels as of Oct 2026):
   - Allow new users to sign up: **on**.
   - Allow manual linking: **on** (needed later for "Ways to sign in", A-REQ-019).
   - Allow anonymous sign-ins: **off**. The app never uses them; the web contribution page that might is v1.1.
   - Confirm email: **on** (an address is an account only after its owner uses the link or code).
3. **Authentication > Sessions** (or Project Settings > JWT): leave refresh token rotation on (default). Recommended JWT expiry: **900 seconds** (TDD 04 3.1: shorter window for a stolen token; the app refreshes in the foreground). Leave "time-box sessions" and "inactivity timeout" off: this is a local-first memory book, and a forced sign-out helps nobody.
4. **Database**: the consent sheets need published policy versions. Until `supabase/APPLY.md` step 8.2 has inserted `terms` and `sensitive-data` rows into `policy_versions`, every new account stops at "We couldn't finish setting up your account" and stays local. That is safe, but sign-in looks broken. Publish both before inviting anyone.

## 2. Apple (Sign in with Apple)

Native iOS sign-in needs only step 2.1 and step 2.6. Steps 2.2 to 2.5 prepare what you will need for account deletion (Apple token revocation, A-NFR-011) and for web or Android sign-in later; doing them now avoids a second trip.

### 2.1 App ID capabilities
Apple Developer > Certificates, Identifiers & Profiles > **Identifiers** > App IDs > `com.earlyletters.scribe`:
- Tick **Sign in with Apple** (Edit > "Enable as a primary App ID").
- Tick **Associated Domains**.
- Do the same for `com.earlyletters.scribe.preview` and `com.earlyletters.scribe.dev` if those App IDs exist.

EAS Build normally turns these on for you from the app's entitlements (`com.apple.developer.applesignin`, `com.apple.developer.associated-domains`, both now in `app.config.ts`) when it manages your credentials (**Assumption**: EAS capability sync; check the App ID after the first build).

### 2.2 Team ID
Top right of the Apple Developer site (Membership details): a 10-character id such as `AB12CD34EF`. You need it for the website file in section 5 (`<TEAMID>` below).

### 2.3 Services ID (only for web or Android sign-in; optional today)
Identifiers > **+** > Services IDs:
- Description: `Early Letters web sign-in`; Identifier: `com.earlyletters.scribe.web`.
- Enable **Sign in with Apple** > Configure: Primary App ID `com.earlyletters.scribe`; Domains: `<project-ref>.supabase.co`; Return URLs: `https://<project-ref>.supabase.co/auth/v1/callback` (Verified: Supabase Apple guide).

### 2.4 Sign in with Apple key
Keys > **+**:
- Name: `Early Letters Sign in with Apple`; tick **Sign in with Apple** > Configure > Primary App ID `com.earlyletters.scribe`.
- Download `AuthKey_<KEYID>.p8` (Apple lets you download it **once**). Note the **Key ID**.
- Store the `.p8`, Key ID and Team ID in your password manager. Never in the repo (`.gitignore` already ignores `*.p8`).
- Uses: (a) the client secret for Supabase's web OAuth flow (step 2.6, only when 2.3 is used; Apple requires a new secret at least every 6 months, so set a calendar reminder); (b) the `apple-token` Edge Function (section 2.7), which exchanges the authorization code at sign-in, and the purge worker, which revokes Apple's token when someone deletes their account (TDD 04 3.1.1, App Store 5.1.1(v)). Both sign a fresh 10-minute client secret from the `.p8` on every call, so nothing expires on you there.

### 2.5 Email relay for "Hide My Email"
Apple Developer > **Services** > Sign in with Apple for Email Communication > Configure:
- Add the domain `earlyletters.com` and the address `hello@earlyletters.com`.
- Without this, email you send to an `@privaterelay.appleid.com` address (receipts, notices, an email sign-in by a person who signed up with Apple) is dropped. Apple checks SPF and DKIM for the sending domain (section 4.1 sets them).

### 2.6 Supabase Apple provider
Supabase > Authentication > Sign In / Providers > **Apple**: enable.
- **Client IDs**: `com.earlyletters.scribe,com.earlyletters.scribe.preview,com.earlyletters.scribe.dev`. If you set up 2.3, put the Services ID **first**: `com.earlyletters.scribe.web,com.earlyletters.scribe,...` (Verified: Supabase Apple guide, "list the Services ID as the first Client ID").
- **Secret Key (for OAuth)**: leave empty for native-only. Fill it only with the web flow (generated from the `.p8`; Supabase's guide links a generator).

The app sends Apple the SHA-256 of a random nonce and Supabase the raw value, so a replayed identity token fails (`src/lib/auth/apple.ts`). Apple shares the person's name only the first time; the app keeps it in the Keychain until Terms are accepted and then writes it to `profiles.display_name`.

### 2.7 The `apple-token` Edge Function (BL-330, security review H3)

Why: when someone deletes their account, Apple must stop listing Early Letters under "Sign in with Apple" for their Apple ID (App Store 5.1.1(v)). Revoking needs Apple's refresh token, which exists only if the app's one-time authorization code is exchanged within five minutes of sign-in. The app sends the code to this function right after Sign in with Apple (`captureAppleToken` in `src/lib/auth/apple.ts`), in the background: sign-in never waits for it or fails because of it.

What it does (`supabase/functions/apple-token/handler.ts`): checks the caller's session (a real account with an Apple identity), exchanges the code at `https://appleid.apple.com/auth/token`, checks that Apple's `id_token` is for the same Apple user and client id, wraps the refresh token with AES-256-GCM under the newest `TOKEN_KEK_V<n>` (the profile id is the additional data) and stores it with `ops_apple_token_put` (service role only). It answers 204 with no body. The purge worker's `apple_token_revoke` step unwraps and revokes it. Nothing it receives is logged; log lines carry statuses and closed error codes only. Limit: 10 calls per person per hour, per function instance and in the database (`rate_hit('apple_token')`, S02's migration `20261015000000`; until that is applied the instance limit alone holds). Apple codes work once anyway.

Before you deploy it:
1. Migration `20261004200000_ops_deletion_worker.sql` (which creates `ops.apple_tokens` and `ops_apple_token_put`) is applied to the project, through `deploy-db.yml` (`supabase/APPLY.md`). Without it every capture answers 503 and nothing is stored.
2. The secrets below are set (Supabase > Edge Functions > Secrets; the purge worker reads the same names, so set them once).

| Secret | Value | Without it |
|---|---|---|
| `APPLE_TEAM_ID` | Team ID from 2.2 | 503, nothing stored; deletion receipts say `apple: no_token` and the worker alerts `apple_no_token` |
| `APPLE_SIGNIN_KEY_ID` | Key ID from 2.4 | Same |
| `APPLE_SIGNIN_PRIVATE_KEY` | The whole `.p8` file, including the BEGIN and END lines (a value with literal `\n` also works) | Same |
| `TOKEN_KEK_V1` | 32 random bytes, base64: `openssl rand -base64 32`. Never reuse another secret. To rotate, add `TOKEN_KEK_V2` and keep V1 while tokens wrapped with it exist (the function always writes with the highest version present; the worker keeps all of them to unwrap) | Same |
| `APPLE_SERVICES_ID` | Optional, only with 2.3 | Codes from web or Android sign-in are refused (403) |
| `APPLE_EXTRA_CLIENT_IDS` | **Leave unset for now.** Later, comma separated, for example `com.earlyletters.scribe.preview,com.earlyletters.scribe.dev`, to capture tokens from internal builds. The purge worker must be able to revoke for the same ids first: today it accepts the production bundle id and `APPLE_SERVICES_ID` only (request to S07 in PR #139). A token it cannot revoke would stop the deletion step with an `apple_config` alert | Codes from internal builds are refused (403): those testers' deletions say `apple: no_token` |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected by Supabase.

Deploy: `npx supabase functions deploy apple-token --use-api` (keep "Verify JWT" on; the function checks the session again itself). Device check: section 11, item 9.

## 3. Google

### 3.1 Consent screen
Google Cloud Console > choose or create a project `early-letters` > **Google Auth Platform**:
- **Branding**: App name `Early Letters`; user support email `hello@earlyletters.com`; app home page `https://earlyletters.com`; privacy policy `https://earlyletters.com/privacy`; terms `https://earlyletters.com/terms`; authorized domain `earlyletters.com` (add `supabase.co` only if you later use Google's web redirect flow).
- **Audience**: External; then **Publish app** (In production). Testing mode limits sign-in to listed test users.
- **Data access**: scopes `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile` only. These are non-sensitive, so no Google security review (**Assumption**: Google may still ask for brand verification of the name and logo; it takes days, start early).

### 3.2 Web client (its id is the token audience Supabase checks)
Google Auth Platform > **Clients** > Create client > Application type **Web application**, name `Supabase`. Authorized redirect URI `https://<project-ref>.supabase.co/auth/v1/callback`. Copy the **client id** and **client secret**.

### 3.3 iOS clients (one per bundle id)
Clients > Create client > **iOS**:
- Name `Early Letters iOS`; Bundle ID `com.earlyletters.scribe`; Team ID from 2.2; App Store ID once the app record exists.
- Copy the **client id** (`<number>-<hash>.apps.googleusercontent.com`). The console also shows the **iOS URL scheme**; the app derives the same value from the client id at build time (`app.config.ts`), so you do not type it anywhere.
- Repeat for `com.earlyletters.scribe.preview` and `.dev` if you want Google sign-in in internal builds (each bundle id needs its own iOS client).

### 3.4 Supabase Google provider
Supabase > Authentication > Sign In / Providers > **Google**: enable.
- **Client IDs**: the web client id **first**, then every iOS client id, comma separated (Verified: Supabase Google guide, "with the web's client ID first").
- **Client Secret**: the web client's secret.
- **Skip nonce check: ON.** Required. The free Google sign-in library the app uses (`@react-native-google-signin/google-signin` 16.1.5, MIT) has no nonce parameter (Verified in its installed types), while Google's iOS SDK puts its own nonce in the ID token, which Supabase then cannot match. What still protects the exchange: Google's signature, the audience (only our client ids), and the token's one-hour life. The paid "Universal" module supports a nonce but is not open source, so it does not meet BRIEF decision 1. Revisit if the free module adds it.

### 3.5 Build settings
Per EAS profile (section 8): `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` (the iOS client for that profile's bundle id). Without both, the Google button is hidden and the Google config plugin is left out of the build.

## 4. Email through Resend

### 4.1 Resend
resend.com > **Domains** > `earlyletters.com` (already sending as `hello@`): confirm **Verified** (DKIM and SPF records at Porkbun).
- Add DMARC at Porkbun if missing: TXT `_dmarc` = `v=DMARC1; p=quarantine; rua=mailto:hello@earlyletters.com`. Move to `p=reject` after two clean weeks (A-REQ-026).
- Domain settings: turn **Click tracking off** and **Open tracking off**. Click tracking rewrites every link through a redirect, which stops the sign-in link from opening the app and adds a hop a scanner can follow; open tracking adds a pixel (decision 11, `packages/emails`: no tracking pixels).
- **API Keys** > Create: name `supabase-auth-smtp`, permission **Sending access**, domain `earlyletters.com`. Copy it once into the password manager.

### 4.2 Supabase SMTP
Supabase > Authentication > **Emails** > SMTP Settings > Enable custom SMTP (Verified values: Resend's Supabase guide):

| Field | Value |
|---|---|
| Sender email | `hello@earlyletters.com` |
| Sender name | `Early Letters` |
| Host | `smtp.resend.com` |
| Port | `465` |
| Username | `resend` |
| Password | the API key from 4.1 |
| Minimum interval between emails | `60` seconds (matches the app's "You can send another in a minute", A-REQ-025) |

### 4.3 Rate limits
Supabase > Authentication > **Rate Limits**. After custom SMTP is on, Supabase starts the project at **30 emails per hour for the whole project** (Verified: Supabase SMTP guide). Raise it to about **100 per hour** for TestFlight, more at launch. Leave the token verification limit at its default (about 30 per 5 minutes per IP).

### 4.4 Email provider
Supabase > Authentication > Sign In / Providers > **Email**:
- Enable Email provider: on. Confirm email: on. Secure email change: on.
- **Email OTP expiration**: `3600` seconds (link and code live one hour, A-REQ-018).
- **Email OTP length**: `6`. It must equal the app's `EXPO_PUBLIC_EMAIL_OTP_LENGTH` (default 6). The length is configurable (6 to 10) and some projects default to 8 (Verified: dev.to write-up of GoTrue `MAILER_OTP_LENGTH`, 1 Jul 2026; check what yours shows). TDD 04 OQ-S1 recommends 8 for brute-force margin; PRD A says 6. Product call; change both together.

### 4.6 PKCE for email links (BL-347, security review H1, ADR 0023)

Nothing to set in the dashboard, and no template change. The app runs Supabase Auth with `flowType: 'pkce'`: when this phone asks for an email it keeps a code verifier in its Keychain and a note that it asked (the time only, no address, one hour at most). An opened link is used only if this phone asked and nobody is signed in on it; then the app calls `GET /auth/v1/verify` (redirects not followed), which answers with an auth code that only this phone's verifier can exchange. A link someone else asked for, or a link opened while signed in, is never used: the person is offered the code from the same email instead. After any sign-in, consent comes first, then "Keep your letters in this account?" with the account's email masked (`a***@example.com`); nothing on the phone joins the account or uploads before "Keep them here".

What must stay as it is:
- The redirect URL `https://earlyletters.com/auth/callback` in the allow list (5.1): Supabase puts the auth code on it, and the app reads it from the redirect without loading the page.
- The template link `{{ .SiteURL }}/auth/callback#token_hash={{ .TokenHash }}&type=email` (section 6, `supabase/templates/magic_link.html`). With PKCE on, `{{ .TokenHash }}` is the `pkce_` token; the app tries `type=email` links as `magiclink`, then `signup`.

Assumptions, each checked by device test 11.10: Supabase answers `GET /verify` for a PKCE email with a redirect carrying `?code=`; the typed code still signs in with PKCE on; the verifier survives the app being closed between asking and tapping.

## 5. Redirect URLs, universal links and the website

### 5.1 Supabase URL configuration
Supabase > Authentication > **URL Configuration**:
- Site URL: `https://earlyletters.com`
- Redirect URLs (exactly these two, A-NFR-010): `https://earlyletters.com/auth/callback` and `scribe://auth/callback`

The email template (section 6) builds the link itself, so these mostly guard against someone passing another redirect.

### 5.2 apple-app-site-association (the website must serve this)
URL: `https://earlyletters.com/.well-known/apple-app-site-association`. No file extension, served as `application/json`, over HTTPS, **no redirects** (Verified: Apple "Supporting associated domains"). Replace `<TEAMID>`:

```json
{
  "applinks": {
    "details": [
      {
        "appIDs": [
          "<TEAMID>.com.earlyletters.scribe",
          "<TEAMID>.com.earlyletters.scribe.preview",
          "<TEAMID>.com.earlyletters.scribe.dev"
        ],
        "components": [
          { "/": "/auth/callback", "comment": "Email sign-in link. The token hash is in the fragment." },
          { "/": "/auth/callback/", "comment": "Same, with a trailing slash." },
          { "/": "/i/*", "comment": "Co-parent invite links." }
        ]
      }
    ]
  },
  "webcredentials": {
    "apps": [
      "<TEAMID>.com.earlyletters.scribe",
      "<TEAMID>.com.earlyletters.scribe.preview",
      "<TEAMID>.com.earlyletters.scribe.dev"
    ]
  }
}
```

On Vercel (the website thread): put the file at `public/.well-known/apple-app-site-association` and add a header rule so it is served as JSON:

```json
{ "headers": [ { "source": "/.well-known/apple-app-site-association", "headers": [ { "key": "Content-Type", "value": "application/json" } ] } ] }
```

- `earlyletters.app` only redirects; it must not serve this file, and links on it will not open the app (by design: one link domain).
- Apple's CDN fetches the file within 24 hours and devices recheck about weekly (Verified: Apple). Check what Apple sees at `https://app-site-association.cdn-apple.com/a/v1/earlyletters.com`.
- The app's entitlement is `applinks:earlyletters.com` (in `app.config.ts`). `webcredentials` above is for passkeys (section 7); it is harmless before then.

### 5.3 The two fallback pages the website needs
When a link opens in a browser instead of the app (desktop, a mail app's own browser, the app not installed):

**`/auth/callback`**
- Must **not** verify anything on load (mail scanners open links; A-REQ-023). Never read or send the fragment to any server or analytics.
- Show: "Open Early Letters" as a link to `scribe://auth/callback` (no token in it, ever; any app can claim a custom scheme, TDD 04 3.1.6), and the line "Or type the code from the same email in the app."
- Same page for an expired link; the app explains expiry.

**`/i/<token>`**
- A generic page: no child name, no photo, generic link preview tags (B-NFR-002). "Get Early Letters on the App Store", then "Already have it? Open the app, tap I was invited, and paste the link."
- **Known gap:** the token is in the path, so Vercel request logs see it. The founder chose `/i/<token>`; TDD 04 3.4.1 prefers a fragment (`/i#t=<token>`) that servers never receive. Mitigations today: the server stores only a hash, the invite works once and lasts 7 days, and the website must not log or forward paths under `/i/`. Moving to the fragment later is a small change (the app's parser and the AASA pattern), recorded in the hand-off.

## 6. Email templates to paste

Supabase > Authentication > **Emails** > Templates. Paste the same body into **Confirm signup** and **Magic Link**: a new address receives "Confirm signup", a known address receives "Magic Link", and the person should not see a difference (and nobody can tell whether an address has an account). The link uses `type=email`, which Supabase accepts for both (**Assumption**: GoTrue verifies a signup token and a magic-link token under `type=email`; test 11.3 checks both).

If `packages/emails` produces branded versions of these, they replace the text below as long as they keep the contract: `{{ .Token }}`, and the link exactly `https://earlyletters.com/auth/callback#token_hash={{ .TokenHash }}&type=email`. No tracking, no images required.

**Subject (both):** `Your sign-in link for Early Letters`

**Body (both):**

```html
<!doctype html>
<html lang="en">
  <body style="margin:0;padding:0;background:#FBF8F3;">
    <div style="max-width:480px;margin:0 auto;padding:32px 24px;font-family:-apple-system,BlinkMacSystemFont,'Helvetica Neue',Arial,sans-serif;color:#2B2722;">
      <p style="font-size:18px;line-height:1.5;margin:0 0 16px;">Here is your link to sign in to Early Letters.</p>
      <p style="margin:0 0 24px;">
        <a href="https://earlyletters.com/auth/callback#token_hash={{ .TokenHash }}&type=email"
           style="display:inline-block;background:#8A5A3B;color:#FFFFFF;text-decoration:none;font-size:17px;font-weight:600;padding:14px 24px;border-radius:999px;">Sign in on this phone</a>
      </p>
      <p style="font-size:16px;line-height:1.5;margin:0 0 8px;">Or type this code in the app:</p>
      <p style="font-size:32px;letter-spacing:6px;font-weight:600;margin:0 0 24px;">{{ .Token }}</p>
      <p style="font-size:14px;line-height:1.5;color:#6B645B;margin:0 0 8px;">The link and the code work once, for one hour.</p>
      <p style="font-size:14px;line-height:1.5;color:#6B645B;margin:0;">If you did not ask to sign in, you can ignore this email. Nothing changes.</p>
    </div>
  </body>
</html>
```

Supabase sends the HTML part only; most mail apps show it fine. The words follow VOICE.md (no dashes, no urgency).

Optional, same tab: turn on the security notices for "sign-in method linked or removed" and "verification method added or removed" so a person hears about a new passkey or a linked identity (TDD 04 3.1.5). Keep their wording plain.

## 7. Passkeys: decision and setup

**Question:** does Supabase Auth support passkeys natively as of October 2026?

**Finding (Verified, 3 Oct 2026):**
- Supabase announced "Passkeys for Supabase Auth (Beta)" on **28 May 2026** (supabase.com/changelog 46458; GitHub discussion 46458). Passkeys can sign a person in (discoverable credentials) and can be added to an existing signed-in account.
- The guide (supabase.com/docs/guides/auth/passkeys) still calls the API **experimental**, "may change without notice". Requirements: a passkey can only be added by a signed-in, confirmed, non-anonymous user; the account must already have a confirmed email or phone. Dashboard: Authentication > Passkeys, with Relying Party display name, ID (bare domain) and up to 5 origins. Changing the RP ID later breaks every existing passkey.
- The installed `@supabase/supabase-js` 2.117.2 has the methods (`registerPasskey`, `signInWithPasskey`, and the two-step `auth.passkey.startRegistration / verifyRegistration / startAuthentication / verifyAuthentication`, plus `list` and `delete`). Its type notes say the old `experimental.passkey` flag is no longer needed. The one-step methods call the browser's `navigator.credentials`, which React Native does not have; native support is documented for Swift and Flutter only.

**Decision:** use it. Supabase's own passkeys (no second auth system), through the two-step API, with the native ceremony from `react-native-passkey` 3.6.2 (MIT, last release September 2026, active tracker), which reads and writes the same W3C JSON. Code: `src/lib/auth/passkey.ts`; UI: "Add a passkey" in Settings > Account, and "Use a passkey" on the sign-in sheet.

**Guarded:** off unless the build sets `EXPO_PUBLIC_PASSKEYS=1`. Apple, Google and email never depend on it. Turn it on only after all of:
1. Supabase > Authentication > **Passkeys**: enable; RP display name `Early Letters`; RP ID `earlyletters.com`; origins `https://earlyletters.com`.
2. The AASA file (5.2) is live with `webcredentials`.
3. The app gets the entitlement `webcredentials:earlyletters.com` next to `applinks:earlyletters.com` in `app.config.ts` (`ios.associatedDomains`). This line is outside the auth engineer's ownership; requested in the hand-off.
4. Device test 11.7 passes. iOS sets the passkey's origin to `https://earlyletters.com` (**Assumption**: the platform authenticator uses the RP ID's https origin; the test proves it).

If test 11.7 fails or Supabase changes the beta API, leave the flag off: that is passkeys in v1.1 with no code removed. Android later needs the `android:apk-key-hash:` origin and `assetlinks.json`.

## 8. App build settings (environment variables)

All are public values, inlined at build time. Set them per profile as EAS environment variables (expo.dev > project > Environment variables, visibility "Plain text") or in `eas.json` under `build.<profile>.env`. Locally, put them in `apps/mobile/.env.development.local` (git-ignored).

| Variable | Value | Without it |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Project URL from 1.1 | App runs local-only; sign-in sheet says sign-in is not available in this build |
| `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key from 1.1 (`EXPO_PUBLIC_SUPABASE_ANON_KEY` also accepted) | Same |
| `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` | 3.2 | Google button hidden |
| `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` | 3.3, the client for this profile's bundle id | Google button hidden, Google plugin not in the build |
| `EXPO_PUBLIC_EMAIL_OTP_LENGTH` | Same as 4.4 (default 6) | 6 |
| `EXPO_PUBLIC_PASSKEYS` | `1` only after section 7 | Passkeys hidden |

Changing a Google id needs a new build (it changes a native URL scheme); the others need only a new bundle.

## 9. What happens after sign-in (for support questions)

1. The person signs in (Apple, Google, email link or code, or a passkey). An email link works only on the phone that asked for it and only while nobody is signed in there; otherwise the app offers the code. After Apple sign-in the app also sends Apple's one-time code to `apple-token` in the background (2.7).
2. The app reads `my_sync_gate()`. If Terms are not current, it shows the Terms sheet with "By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy" and records `record_policy_act('terms', ..., context {auth, age_attested: true})`. If Terms are current without the attestation, it asks "Are you 18 or older?" once; No ends the session and shows the 18+ stop screen.
3. Then the sensitive-data sheet ("Before your book syncs"). "Agree and sync" records an accept and sync may start. "Keep on this phone" records a decline; the person stays signed in, letters stay on the phone, and Family or Account offers "Agree and sync" later.
3a. If this phone's books and letters belong to no account yet: "Keep your letters in this account?" with the account's email masked. "Keep them here" lets them join the account; "Not my account" ends the session and nothing changes. A session left on this screen syncs nothing; Family and Settings > Account show "Finish setting up".
4. Nothing syncs before step 3 is accepted (and 3a, when shown): the app checks, and the server refuses content writes with `SCCON` anyway.
5. Sign-out waits until queued letters have uploaded, then ends the session on this phone only. Local letters are never deleted by signing out.

## 10. Keys and owners

| Secret | Where it lives | Rotation |
|---|---|---|
| Apple `.p8`, Key ID, Team ID | Password manager, and Edge Function secrets `APPLE_SIGNIN_PRIVATE_KEY`, `APPLE_SIGNIN_KEY_ID`, `APPLE_TEAM_ID` (`apple-token`, `purge-worker`) | The functions sign a fresh 10-minute secret per call. Only the web OAuth client secret (2.6, if used) expires within 6 months; calendar reminder |
| `TOKEN_KEK_V<n>` | Edge Function secrets only (`apple-token`, `purge-worker`), password manager | Add a new version and keep the old one while tokens wrapped with it exist |
| Resend SMTP API key | Supabase SMTP settings, password manager | When anyone with access leaves, or yearly |
| Google web client secret | Supabase Google provider | Only on suspicion; rotating it does not affect native sign-in |
| Supabase service role key | Supabase only | Never in the app, CI only through a protected environment |

## 11. Device checks before inviting anyone

Run on a real iPhone with a preview build that has every variable from section 8.

1. **Apple:** sign in, Terms sheet, sensitive-data sheet, back where you started. Supabase > Authentication > Users shows the Apple identity. Sign out and in again: no Terms sheet the second time.
2. **Google:** same; then confirm Supabase shows the Google identity. If it fails with a nonce message, 3.4 "Skip nonce check" is off.
3. **Email, both templates:** a brand-new address (Confirm signup template) and a known one (Magic Link template). For each: the link opens the app from Mail and signs in; the code typed by hand also signs in; an hour-old link shows "That link has expired"; open the link on a laptop: the page shows the code and does not sign anything in.
4. **Scheme fallback:** on the laptop page, "Open Early Letters" on the phone opens the code screen.
5. **Invite:** from Family, invite a co-parent, share to yourself in Messages, open the link on a second phone signed out: it lands on "Join the family book", sign in, consent, join. Try the same link again: "already been used". Cancel an invite and open its link: "was cancelled".
6. **Offline:** airplane mode, cold start: the app opens signed in, records and saves letters.
7. **Passkeys (only for section 7):** Settings > Account > Add a passkey shows Face ID and succeeds; sign out; "Use a passkey" signs back in. Supabase shows the passkey under the user.
8. **Revocation:** iOS Settings > Apple Account > Sign in with Apple > Early Letters > Stop using. Relaunch: the app signs out after letters upload.
9. **Apple token capture (2.7):** with a production-bundle build, sign in with Apple on a fresh account. Within a minute, SQL Editor: `select count(*), max(key_version) from ops.apple_tokens;` shows one more row (never select the ciphertext). Then delete that account in the app and let the purge worker run: the receipt says `apple: revoked`, and iOS Settings > Apple Account > Sign in with Apple no longer lists Early Letters.
10. **A link from someone else (security review H1, ADR 0023):** phone A signed out, with a book and a letter, has not asked for an email. On phone B ask for an email and open that link on phone A: phone A says "Type the code from the email on this phone instead." and nothing signs in. Then on phone A ask for an email, close the app completely, and open the link: it signs in, shows the consent sheets, then "Keep your letters in this account?" with the address masked. "Not my account" leaves the letter on the phone and unsynced (Supabase shows no rows for it); sign in again and "Keep them here" syncs it. Also: open a link while signed in: "You're signed in as another account. Sign out first to use this link."; and a typed code still signs in on any phone.

## 12. What only the founder can still do (15 Oct 2026)

The code for BL-347 and BL-330 is in PR #139. Nothing below can be done by an agent (no agent sets a secret, applies a migration, deploys a function or touches a dashboard: COORDINATION section 6). Do them on staging first, then production. Until the R-17 gate passes (D-089; `docs/security/REVIEW_R17_AUTH.md`), only the founding family signs in, on builds made with `EXPO_PUBLIC_SERVER_FEATURES=on`; every store profile stays `off`.

| Order | Task | Steps here | Blocks |
|---|---|---|---|
| 1 | **FT-07** Apple identifiers, Team ID, Sign in with Apple key, email relay | 2.1, 2.2, 2.4, 2.5 (one `.p8` serves sign-in, capture and revocation; `docs/ops/SECURITY.md` 5) | 2, 4, the AASA Team ID, every Apple sign-in |
| 2 | **FT-12** Supabase Auth | Section 1 (sign-ups on, manual linking on, anonymous off, confirm email on, JWT 900 s); 2.6 Apple provider client ids; 4.2 SMTP; 4.3 rate limits; 4.4 email provider; 5.1 redirect URLs (exactly two); 6 templates as `supabase/templates/README.md` lists them. **One mismatch to settle:** the generated templates say "work once, for 15 minutes", while 4.4 and FOUNDER_TASKS FT-12 say OTP expiry 3600. Either set **900** seconds (the templates' words, and the review M4 recommendation), or keep 3600 and regenerate the templates with `--expires="1 hour"`. Code length stays 6 until the M4 work package (FT-04 item 8). PKCE needs no setting (4.6) | All sign-in; device checks 11 |
| 3 | **FT-15** Google client ids (cuttable: ROADMAP 2.1 cut 2; Google is WP-F02-04, wave 3) | 3.1 consent screen, 3.2 web client, 3.3 one iOS client per bundle id, 3.4 Supabase Google provider (web id first, Skip nonce check on); then `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` per EAS profile (FT-17, section 8) | Google sign-in only; Apple and email do not need it |
| 4 | **FT-11** `apple-token` | Apply migration `20261004200000` through `deploy-db.yml` if it is not applied yet, and S02's `20261015000000` (the database half of the apple-token limit, `rate_hit('apple_token')`) when its PR merges; set `APPLE_TEAM_ID`, `APPLE_SIGNIN_KEY_ID`, `APPLE_SIGNIN_PRIVATE_KEY`, `TOKEN_KEK_V1` (2.7; the purge worker reads the same); leave `APPLE_EXTRA_CLIENT_IDS` unset; `npx supabase functions deploy apple-token --use-api` | Apple token revocation at deletion (App Store 5.1.1(v)) |
| 5 | Device checks on a switch-on preview build, founding family only | 11.1, 11.3, 11.9 (needs a production-bundle build, or `APPLE_EXTRA_CLIENT_IDS` once the purge worker reads it), 11.10 | The R-17 sign-off |
| 6 | Read and sign the R-17 auth items, with S02's items, in one shared review | `docs/security/REVIEW_R17_AUTH.md` | Anyone outside the family signing in (D-089) |

## Sources (opened 3 Oct 2026)

- Supabase changelog, Passkeys for Supabase Auth (Beta): https://supabase.com/changelog/46458-passkeys-for-supabase-auth-beta
- Supabase discussion 46458: https://github.com/orgs/supabase/discussions/46458
- Supabase passkeys guide: https://supabase.com/docs/guides/auth/passkeys
- Supabase Apple: https://supabase.com/docs/guides/auth/social-login/auth-apple
- Supabase Google: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase passwordless email: https://supabase.com/docs/guides/auth/auth-email-passwordless
- Supabase email templates: https://supabase.com/docs/guides/auth/auth-email-templates
- Supabase custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp
- Resend with Supabase SMTP: https://resend.com/docs/send-with-supabase-smtp
- Apple, Supporting associated domains: https://developer.apple.com/documentation/xcode/supporting-associated-domains
- Google sign-in for React Native (Expo setup): https://react-native-google-signin.github.io/docs/setting-up/expo
- react-native-passkey 3.6.2 (npm readme)
- Email OTP length is a setting: https://dev.to/incultnitollc/your-otp-regex-assumes-six-digits-supabase-magic-links-dont-33i1
- Installed library source: `@supabase/auth-js` 2.117.2, `@react-native-google-signin/google-signin` 16.1.5, `expo-apple-authentication` 57.0.2, `expo-secure-store` 57.0.4 (CHANGELOG: iOS size warning removed), `react-native-passkey` 3.6.2
