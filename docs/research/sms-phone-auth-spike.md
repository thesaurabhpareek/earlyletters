# SMS provider and Supabase phone-auth spike (BL-1896)

Owner: security engineer. Satisfies NS-54-R23, R24, R28, R29 and Q1 of `docs/product/prd/29-sign-in-methods-and-phone-verification.md`. A desk spike: no account was opened, nothing was spent, no text was sent, no secret was used.

## 1. What is decided here and what is not

The SMS provider and the spend are the founder's. This page gives options, a recommendation and a default. It does not choose a vendor.

Phone is a factor on an account, never a way in (card section 7, Q7). Phase A is optional and comes after the first letter.

## 2. How facts were read (read this before trusting a number)

- Supabase: the public docs site (supabase.com) did not resolve from this session. The same pages were read as the vendor's own published source in its docs repository (raw files under `apps/docs/content/guides/auth/`, `apps/docs/spec/cli_v1_config.yaml`, `packages/shared-data/config.ts`, all in the `supabase/supabase` repository, and `example.env` in `supabase/auth`). Each fact below names its file. The rendered page may read slightly differently.
- SMS vendors (Twilio, Vonage, MessageBird, others): every vendor host tried (twilio.com, vonage.com, messagebird.com, bird.com, sinch, telnyx, plivo, AWS) failed to load. So NO price, country list, fraud-tool claim, retention period or registration rule from an SMS vendor was read. All of those are [UNVERIFIED] and no number is quoted for them. Section 6 gives the model with the price left as a variable.
- Search summaries in `docs/regulatory/signup-geo-checks.md` (F15) are secondary and are not reused as facts here.

## 3. Supabase phone options (read)

1. Providers. phone-login.mdx: "Supported providers include MessageBird, Twilio, Vonage, and TextLocal (community-supported)." cli_v1_config.yaml `auth.sms.provider.enabled` lists `twilio`, `twilio_verify`, `messagebird`, `textlocal`, `vonage`.
2. Channels. phone-login.mdx: the code is sent "via a channel (SMS or WhatsApp)", and "`WhatsApp` is only supported as a channel for the Twilio and Twilio Verify Providers." No voice-call channel is listed anywhere on the pages read, so a voice code is NOT available natively. send-sms-hook.mdx says the hook can "Use a regional SMS Provider", use "alternate messaging channels such as WhatsApp" and "Fall back to another provider if your primary one fails"; whether a voice call can be sent through it depends on the vendor [UNVERIFIED].
3. Send SMS hook. send-sms-hook.mdx: "The Send SMS Hook replaces Supabase's built-in SMS sending." Inputs are `user` ("The user attempting to sign in") and `sms` ("Metadata specific to the SMS sending process. Includes the OTP."). The `user` object carries `phone` and the code is in the payload, so a hook function sees both: its logs must stay content-free (NS-54-R26).
4. Phone as a factor, not a door. phone-login.mdx "Updating a phone number": a signed-in user calls `updateUser({ phone })`, receives a 6-digit code and verifies with type `phone_change`. This is the path for NS-54. The page's main flow, `signInWithOtp({ phone })`, creates a phone sign-in and so a separate account: it must not be reachable (see section 7, item 1).
5. Test numbers. testing-auth-flows.mdx: "Auth doesn't send an SMS to a test number, and it accepts the fixed code as many times as you need"; a provider must still be configured ("placeholder values work" locally); config key `auth.sms.test_otp`. This is how BL-1898's tests and the access tests run with no real text. Test numbers "don't apply to phone multi-factor authentication".
6. Same provider config serves phone MFA (mfaphone.mdx). We have no MFA in v1.0.

## 4. Fraud, rate and spend controls (read)

| Control | Where | What the vendor page says | Use for us |
|---|---|---|---|
| Project SMS cap | `auth.rate_limit.sms_sent` (cli_v1_config.yaml: default `30`, "Number of SMS messages that can be sent per hour. Requires auth.sms to be enabled."); auth_rate_limits.mdx: "SMS messages sent by Supabase Auth ... Project ... Defaults to [30] SMS messages per hour." (shared-data `sms.requests_per_hour` = 30) | Hourly, whole project, customizable | The only hard spend ceiling Supabase itself gives. Worst case per day is 24 x the cap x price per text. It is also a way for an attacker to use up our hourly allowance, so R27's fallback matters. |
| Per-user resend wait | `auth.rate_limits.otp.period` = 60 seconds (shared-data) | "a 60 seconds window before a new request is allowed for the same user" | Keep. Not per number across accounts. |
| Per-IP sign-up and sign-in | `sign_in_sign_ups` 30 per 5 minutes, bursts of 30 (config.toml already sets 30) | Per IP, covers `/auth/v1/otp` and `/auth/v1/user` | Our existing `[auth.rate_limit]` already holds this value. |
| Per-IP verify | `token_verifications` 30 per 5 minutes | Per IP | Five wrong tries (R24) is not a Supabase setting that was read: [UNVERIFIED]; likely an app-side or hook-side count. |
| Code lifetime | shared-data `otp.validity` = 1 hour | "How long before an OTP expires." | R24 needs at most 10 minutes. The CLI config reference read has no per-SMS expiry key (only `auth.email.otp_expiry`), and phone-login.mdx also says "verify within 60 seconds", which conflicts with the 1 hour value. Treat the real behaviour as [UNVERIFIED] and test it against the hosted project (BL-1898). |
| CAPTCHA | auth-captcha.mdx: "hCaptcha and Cloudflare Turnstile" on "sign-in, sign-up, and password reset forms"; cost_warning.mdx: "make sure you adjust your project's rate limits and configure CAPTCHA" | Page is written for web forms; its native iOS support was not read: [UNVERIFIED] | A captcha in an app is a screen a parent sees: needs design before it counts as a control. |
| Regional rules | cost_warning.mdx: "Some countries have special regulations for services that send SMS messages ... (e.g India's TRAI DLT regulations)" | Our own duty | US rules are BL-1897 (counsel). |
| Pre-send country check | `before user created` hook (`phone` is in its user schema, buc page) runs at account creation, not at each send. The Send SMS hook runs at each send. | Hook payloads read above | A blocked calling code can be refused in the Send SMS hook so no fee is paid (signup-geo-checks.md section 6, point 3). NS-54-R29 says a code never refuses alone, so use it as a signal only. |
| Vendor fraud tools (SMS-pumping detection, geo permissions, spend alerts) | vendor consoles | [UNVERIFIED] not readable | Must be read before choosing (section 8). |

Our `supabase/config.toml` today: no `[auth.sms]` section, no `[auth.rate_limit] sms_sent`, and `phone_changed` notice is `enabled = false` (line 129). The test `supabase/tests/auth_config.test.mjs` pins auth values and has no SMS pin.

## 5. What is kept, where, and for how long

| Place | What it holds | How long | Source |
|---|---|---|---|
| `auth.users` | `phone` and `phone_confirmed_at` (users.mdx: "The user's phone number."; "The timestamp that the user's phone was confirmed."). Phone identities also sit in `identities.identity_data` (send-sms-hook.mdx sample) | While the account exists. Removed when the user is deleted: that deletion removes the row is the normal behaviour but the page read states no schedule: [UNVERIFIED] | users.mdx, send-sms-hook.mdx |
| Auth audit log | Events such as `user_confirmation_requested` ("Email/phone confirmation requested"). Stored in external log storage, plus optionally `auth.audit_log_entries` ("Write audit logs to the database"). `ip_address` "is recorded only for some events, such as MFA, passkeys, identity linking, and recovery codes". | Retention period NOT stated on the page: [UNVERIFIED]. Whether the phone appears in an entry's metadata was not stated: [UNVERIFIED] | audit-logs.mdx |
| `auth.sessions` | An `ip` column: "To see the IP address for a session, check the `ip` column in `auth.sessions`." | Life of the session row, schedule [UNVERIFIED] | audit-logs.mdx |
| One-time code | Held by Auth until used or expired; storage form (hashed or not) and table were not read: [UNVERIFIED] | 1 hour by default (shared-data); R24 needs 10 minutes | shared-data, example.env |
| Send SMS hook function | Phone and code pass through memory and any platform log of the function | Our own: log nothing from the payload (R26) | send-sms-hook.mdx |
| SMS vendor | Message record, destination, delivery status, possibly body and sender metadata, with a retention period and a region | [UNVERIFIED] for every vendor | none read |
| Supabase region | Project region is chosen at project creation | Not read here: [UNVERIFIED] | none read |

Two follow-ups from this table. First, the sign-up IP can live in `auth.sessions.ip`, which bears on GEO-4 (the policy says "We do not keep the IP address", `docs/legal/privacy-policy.md:153`): that gate is still open and phone does not change it. Second, BL-1899 must record the vendor copy of the number in the deletion spec (BL-1909) once the vendor's retention is read.

## 6. Cost model (assumptions, not vendor prices)

No vendor price was read, so the price is a variable `p` (cost of one delivered text, in the founder's currency, including any per-message carrier fee the vendor adds). Fill `p` from the chosen vendor's own pricing page at BL-1898.

Assumptions (ours, to be replaced by real numbers):
- A: new accounts per day who reach the phone step. Starting values to test: 50, 500, 5,000.
- Attempt share `s`: share of those who start the step = 0.4 (Phase A is optional; Not now is as large as Continue, R22). Our guess, unmeasured.
- Sends per started attempt `r` = 1.3 (some resends). Our guess.
- Daily cost = A x s x r x p. Monthly = 30 x that.
- Pumping ceiling with Supabase's cap `C` per hour: daily worst case = 24 x C x p. At the Supabase default `C` = 30 this is 720 p per day; at `C` = 10 it is 240 p.
- Pause trigger (card, R37): pause the step at 80 percent of the monthly cap. Set the vendor console cap at the monthly spend the founder accepts and set `C` so 24 x C x p is below one day's share of it.

| Accounts per day (A) | Texts per day (A x 0.4 x 1.3) | Texts per month | Monthly cost |
|---|---|---|---|
| 50 | 26 | 780 | 780 p |
| 500 | 260 | 7,800 | 7,800 p |
| 5,000 | 2,600 | 78,000 | 78,000 p |

The founder can read the monthly cost for any vendor by multiplying the right column by `p`. A hard cap in the vendor console is the second layer behind `C`.

## 7. Recommended Supabase settings for the build (BL-1898 and the build row apply them)

These are values to carry into `supabase/config.toml` and the hosted dashboard. This page changes neither.

1. `[auth.sms] enable_signup = false`. The spec default is `true`, which lets a phone alone create an account (against Q7). With it false, a signed-in user adding a number through `updateUser` must still work: [UNVERIFIED], test locally first with `auth.sms.test_otp`, no real send.
2. `[auth.rate_limit] sms_sent`: start at 10 per hour and raise only on measured need. Pin it in `auth_config.test.mjs`.
3. Keep `sign_in_sign_ups = 30` and `token_verifications = 30`.
4. Code lifetime at 10 minutes or less on the hosted project (hosted field name [UNVERIFIED]); local CLI has no key for it.
5. Turn `phone_changed` notice on when the build collects a number (config.toml line 129 sets it off today).
6. A Send SMS hook function only if a pre-send country signal or a second provider is wanted; otherwise use the native provider (fewer places that see the number).
7. Test numbers only in staging, with an end date.

## 8. Providers: options, recommendation, default

Native to Supabase (so no hook code that sees the number): Twilio, Twilio Verify, Vonage, MessageBird. TextLocal is community-supported and not considered.

| Option | Supabase fit (read) | Price, countries, fraud tools, retention, region, voice (vendor page) |
|---|---|---|
| A. Twilio Verify | Native (`twilio_verify`); WhatsApp channel available | [UNVERIFIED]: vendor page not readable |
| B. Twilio messaging service | Native (`twilio`, needs a messaging service id); WhatsApp channel available; one vendor for both B and A | [UNVERIFIED] |
| C. Vonage | Native (`vonage`) | [UNVERIFIED] |
| D. Any vendor through the Send SMS hook | Hook "replaces Supabase's built-in SMS sending"; we write and own the code; the number and code pass through our function | [UNVERIFIED] |
| MessageBird | Native | [UNVERIFIED]; not shortlisted because nothing could be read to tell it apart |

Recommendation: A, Twilio Verify through the native provider, with Vonage (C) as the second provider to price, because both are native and A also brings WhatsApp as a later fallback for people abroad (R30, 7.4) without writing hook code. This rests only on the Supabase pages read. It is a conditional recommendation: it stands only if the vendor's own pages, read at BL-1898, show a per-verification price the cap model in section 6 accepts, a hard spend cap or alerts, SMS-pumping controls we can switch on, US sender registration that counsel (BL-1897) is content with, and a retention period that fits the deletion window (R25).

Default if the founder does not choose: do not spend. Phase A stays a design and a plan, the code path stays off (pause by R37), and nothing in `supabase/config.toml` enables SMS.

What would change the recommendation: a vendor page showing no hard spend cap; retention longer than the deletion window; a voice-call channel the founder wants for people without texts (not native in Supabase per section 3, so it implies option D).

## 9. Countries

Not decided here and not read from any vendor. What is known: the storefront and price stay US (D-137); a person abroad on a foreign number must be able to verify (R30); the calling-code list shown must come from the same data as the block list (`signup-geo-checks.md` 3.8). Before a send, each target country needs from the vendor: reachable yes or no, sender rules, per-text price, and whether alphanumeric sender IDs are allowed. All [UNVERIFIED]. Suggested first set to ask vendors about: US, Canada, United Kingdom, Australia, then the countries of the founder's family and of the first testers.

## 10. Open items handed on

- BL-1897 (counsel): US consent wording for a one-time code, carrier sender registration, TCPA. Not read here.
- BL-1898 (platform): read vendor pages for section 8 items; set the console cap; confirm the hosted code lifetime and the audit-log retention (section 5).
- BL-1899 and BL-1909: record the vendor's retention once read.
- Test to add when built: a pin for `auth.sms.enable_signup = false` and `sms_sent`, and a phone-number log canary (BL-1901).
