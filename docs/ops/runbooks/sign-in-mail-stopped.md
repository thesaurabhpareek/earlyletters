# Runbook: sign-in mail stopped (the website is down, the mail service is down, or the email cap is hit)

Status: written 24 Nov 2026 for BL-1355 (FR-MSG-15, `docs/product/prd/functions/messaging-and-entry-points.md`), **NOT RUN**. Owner: `ops`. Nothing below has been tried on a Supabase project, on Resend or on a phone. Every statement names the file it was read from; anything not checked says UNVERIFIED. This page writes no words a person sees: it points to copy keys that already exist.

Agents never open the Resend, Supabase, Vercel or Porkbun consoles (`docs/ops/MAIL-PREFLIGHT.md`: founder-only steps are marked `[FOUNDER]`). Raising the email cap is BL-2108, a founder step in a vendor console, not part of this runbook.

## 1. The promise this runbook keeps

FR-MSG-15: when `earlyletters.com` is down, Resend is down, or the cap is hit, these still work:

1. **Sign in with Apple.** No email is involved.
2. **A code already sent.** A 6-digit code that reached the inbox before the outage still signs in.
3. **Everything on the phone.** Recording, reading and writing letters on the phone, and a phone that is already signed in.

And no first-run path needs a page on the website.

## 2. Why each still works (read from the code)

| What | Why it does not need the website or the mail service | Source |
|---|---|---|
| Sign in with Apple | The native Apple sheet, then `signInWithIdToken` to Supabase Auth. Nothing is emailed. The Welcome shows the Apple button whenever iOS says Apple sign-in is available. The `apple-token` capture after sign-in "never blocks or fails sign-in", and the new-device report is fire and forget | `apps/mobile/src/lib/auth/apple.ts` header and `appleSignInAvailable`; `apps/mobile/src/components/onboarding/welcome-sign-in.tsx` (the `AppleButton` line); `apps/mobile/src/lib/auth/new-device/report.logic.ts` ("Never blocks") |
| A code already sent | Typing the code calls `verifyOtp` on Supabase Auth only: no website page, no mail service. The code lives 15 minutes (`otp_expiry = 900`) and works once | `apps/mobile/src/lib/auth/email.ts` `verifyEmailCode`; `supabase/config.toml` `[auth.email]` `otp_expiry`; `supabase/auth-email.md` section 8 checks 3 to 5 |
| A link already sent | The link is `https://earlyletters.com/auth/callback#token_hash=...`. With the site down, whether tapping it still opens the app depends on iOS having the site's `apple-app-site-association` file cached: UNVERIFIED. The code in the same email is the way round it | `supabase/auth-email.md` sections 3.4 and 3.8; `apps/web/src/app/.well-known/apple-app-site-association` |
| Everything on the phone | The app is offline-first: record, transcribe, review, save and read without network; sync is eventual | `docs/ARCHITECTURE.md` section 2 (quality attributes), item 4 |
| Speech model download | Comes from `packs.earlyletters.app` on Cloudflare R2, a different domain and host from `earlyletters.com` | `apps/mobile/src/lib/models/catalog.ts` `PACKS_ORIGIN`; `docs/ops/DOMAINS.md` section 1 |
| First-run Terms and Privacy links | They open website pages in the in-app browser, but "a page that will not open changes nothing on this screen": Continue does not wait on them. Whether agreeing while the pages cannot load is acceptable is a question for the exec team (counsel role), not this runbook: UNVERIFIED | `welcome-sign-in.tsx` (the `open` helper's comment); `apps/mobile/src/components/gate/age-gate-screen.tsx` (`openLink`) |

UNVERIFIED for the whole table: `supabase/auth-email.md` section 8 check 3 (the code still works when the page is fetched by a scanner or never loads) has no result file in `docs/legal/evidence/`, so it has not been shown on staging.

Not covered here: Supabase itself being down. Then email sign-in, Apple sign-in and sync all stop, and the gate shows the outage screen (section 4).

## 3. Tell which of the three it is

| Sign | Most likely | How to confirm (who) |
|---|---|---|
| `https://earlyletters.com` does not load in a browser, or the `/.well-known/apple-app-site-association` address does not load | The website is down, or the domain or its DNS broke | Open both addresses in a browser (anyone). Then Vercel's project page and the domain's renewal and DNS at Porkbun (`docs/ops/DOMAINS.md` sections 2 and 3) `[FOUNDER]` |
| The site loads, but nobody gets a new sign-in email; the app shows no 429 words | The mail service (Resend) is down or is refusing our mail | Resend's own status page and Resend > Emails for failed sends `[FOUNDER]`; Supabase Auth logs for send errors on `/otp` `[FOUNDER]` (`docs/ops/runbooks/supabase-logs-readback.md` says how logs are read; NOT RUN) |
| People say "wait a few minutes" appears when they ask for an email | The project's hourly email cap is hit (or one address's 60-second wait) | Supabase Auth logs show `over_email_send_rate_limit` on `/otp` `[FOUNDER]`. The cap is 100 emails an hour in `supabase/config.toml` `[auth.rate_limit]` `email_sent`; the hosted value is set in the dashboard and is UNVERIFIED (`supabase/auth-email.md` sections 3.6 and 4.1) |

Alerts: `docs/ops/SECURITY.md` section 7 lists a "Project email cap" alert (any hit, warn at 70 percent). Whether that alert is set up on the hosted project: UNVERIFIED. BL-2108 says the weekly limits check records the peak emails per hour; I did not find that in `scripts/ops/free-limits.ts`: UNVERIFIED.

## 4. What the person sees (existing copy keys; no new words)

| Case | Key | File |
|---|---|---|
| Asking for an email while the cap or the per-address wait holds (a 429 in the send step) | `authCopy.errors.email_wait` | `packages/content/src/features/auth.en.ts`; mapping in `apps/mobile/src/lib/auth/errors.logic.ts` (`over_email_send_rate_limit` and any 429 in the `send` context) |
| Asking for an email while the mail service fails | `authCopy.errors.unknown`, if Supabase answers with a 5xx. What Supabase returns when its mail sender fails is UNVERIFIED | `errors.logic.ts` (a 5xx falls through to `unknown` in the `send` context) |
| Waiting on the code screen | `authCopy.code.noMailHelp`, `authCopy.code.resendWait`, and after five wrong codes `authCopy.code.pausedOtherWays` | `auth.en.ts`; shown by `apps/mobile/src/app/(auth)/sign-in/code.tsx` |
| "Trouble signing in?" help | `en.auth.troubleButton`, `en.auth.noEmailHelp` (names Sign in with Apple and writing to us) | `packages/content/src/strings.en.ts` |
| Sign-in itself cannot be reached (Supabase, not mail) | E-S14.outage: `authCopy.outage.*`, with "Start on this phone" where the gate offers it (`LOCAL_START_FALLBACK`) | `auth.en.ts`; `apps/mobile/src/components/onboarding/outage-screen.tsx`; `apps/mobile/src/lib/first-run/gate.logic.ts`. A mail outage alone does not route here, as far as I read the gate |

## 5. What to do

1. Confirm which of the three it is (section 3). Write the time it started.
2. **Website down:** the app keeps working (section 2). Restore the site or the domain `[FOUNDER]`. Until it is back, a person with an email link should type the code from the same email.
3. **Mail service down:** new codes cannot go out. Point people to Sign in with Apple and to a code they already have. Answer anyone who writes to `hello@` with those two ways; never ask for a code (`docs/ops/MAIL-PREFLIGHT.md` section 8 step 3). When Resend is back, nothing needs resending: a person asks for a new email.
4. **Cap hit:** the cap clears within the hour. If it keeps hitting, treat it as a possible bombing run (`supabase/auth-email.md` section 3.6). Raising the cap is BL-2108 `[FOUNDER]`, and its residual risk is read first (BL-2108 note, CR-189).
5. Afterwards, write one line in the incident record: which outage, start and end time, counts only. No addresses, no codes, no message bodies.

## 6. What not to do

- No agent opens or changes the Resend, Supabase, Vercel or Porkbun consoles, or raises a cap. Those are founder steps.
- Do not turn off the per-address 60-second wait or the cap to "get mail moving".
- Do not send codes or links by hand, or ask a person to forward a code or a link.
- Do not change any words a person sees to announce the outage: copy changes go through `content` and the exec team (D-172).
- Do not copy an address, a code or a message body into a ticket, a log or an agent chat (`CLAUDE.md` privacy rules).
