# R-17 gate: the auth items (S01)

Owner: stream S01 (auth and account security). Written 15 Oct 2026 for PR #139.
Gate: PRD V2 `09-decisions-and-risks.md` R-17 and D-089 (PR #128): nobody outside the founding family signs in before BL-347, BL-330, BL-331 with BL-332, `peek_invite` with BL-334, BL-322 and BL-349 merge and pass **one shared security review**. This file holds the S01 half (BL-347, BL-330) with the evidence for each item, so the shared review can read it next to S02's items (branch `feat/db-v1-gate`) and S04's and S20's. When S02's `docs/security/REVIEW_R17_CHECKLIST.md` lands, these rows move into it and this file points there.

Status words: **built** (code and tests in PR #139), **device** (needs a real iPhone, AUTH_SETUP section 11), **founder** (a dashboard, secret or deploy step, AUTH_SETUP section 12), **other stream** (a request in the PR body), **later** (its own work package, not in this PR).

## 1. Items

| # | Item | Requirement | What is in PR #139 | Evidence | Status |
|---|---|---|---|---|---|
| A1 | An email link is used only while this phone has a pending request (Keychain note: time only, 1 hour) | F02-REQ-018; BL-347; review H1 fix bullet 2 | `lib/auth/email-link.logic.ts` (`decodePendingRequest`, `decideEmailLink`, `openEmailLink`), `lib/auth/pending.ts` | `auth-email-link.test.ts` "the pending-request note", "when an opened link may be used"; `auth-h1.test.ts` "step 3, layer 1" (no request reaches Supabase) | built |
| A2 | Email links run through PKCE; a link from another phone's flow cannot finish here; a redirect carrying tokens is refused; `verifyOtp({ token_hash })` is gone | F02-REQ-018; A-REQ-018 (link only on the phone that asked); review H1 fix bullet 1 | `lib/supabase/client.ts` (`flowType: 'pkce'`, `ensureRandomValues`), `lib/auth/email.ts` (`verifyEmailLinkPkce`: GET /verify, `redirect: 'manual'`, `exchangeCodeForSession`), ADR 0023 | `auth-email-link.test.ts` "verifyEmailLinkPkce" (6 cases, including the source check that no `token_hash` call remains); `auth-h1.test.ts` "step 3, layer 2" (fake GoTrue, wrong verifier) | built; **device** 11.10 for the three U assumptions in ADR 0023 |
| A3 | Local letters move to an account only after consent and a tap on a screen with the masked account email; "Not my account" changes nothing | F02-REQ-019; review H1 fix bullet 3; R4 PT-20 | `lib/auth/auth-store.ts` (session released only after `canSync` and the claim), `lib/auth/account-claim.logic.ts` (`phoneHoldsAnyRow`: any book or letter row in any state, hidden ones included, so it can only err towards asking), `app/(auth)/sign-in/consent.tsx` (claim screen after consent), `lib/auth/ui.tsx` and `app/settings/account.tsx` ("Finish setting up") | `auth-h1.test.ts` "step 4" and "step 5" against the real `takeOwnership` on node:sqlite. **Fails on develop, passes here** (section 2) | built |
| A4 | A link is refused while any account is signed in on this phone | F02-REQ-020; F02-U27 | `openEmailLink` checks before the pending note; `verify.tsx` shows the U27 words and Close | `auth-h1.test.ts` "[F02-REQ-020]"; `auth-email-link.test.ts` decision matrix | built |
| A5 | Tokens only in Keychain-backed storage; no secret in route params, logs or analytics | F02-REQ-003; LEGAL-REQ-014 | The pending note and the PKCE verifier go through `secureStorage` (`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`); the note holds a time only; the Apple code is never stored on the phone; the token hash stays in memory (unchanged `+native-intent`) | `auth-apple-token.test.ts` "the code is never kept on the phone"; `auth-kill-path.test.ts` (Keychain key and value) | built |
| A6 | Apple refresh token captured at sign-in: the app posts the code once, the function stores it encrypted and answers 204 with nothing echoed | F02-REQ-004, F02-REQ-022; A-NFR-011; BL-330; review H3 | `lib/auth/apple.ts` (`captureAppleToken`, background, never blocks sign-in), `lib/auth/apple-token.logic.ts`, `supabase/functions/apple-token/**` | Deno `handler.test.ts` (15 tests: exchange, wrap and unwrap round trip, sub, aud and iss checks, client-id list equals the purge worker's, 204 with empty body, fails closed without secrets, rate limit, request validation); `auth-apple-token.test.ts` (8) | built; **founder** FT-11 (secrets, migration `20261004200000`, deploy); **device** 11.9 |
| A7 | apple-token logs nothing it received or sent; errors carry closed codes only | LEGAL-REQ-014; ADR 0017 rules 5 to 7 | `_shared/log` only; error bodies are the envelope | Deno "canary" test over 4 paths (logs and error bodies); the shared `_shared/log/canary.test.ts` sweep forbids `console.*` in function code | built |
| A8 | apple-token is rate limited where it runs | ADR 0017 rule 4; review M3 | 10 per person per hour per instance, and `rate_hit('apple_token')` with the caller's JWT (S02 added the bucket in `20261015000000`); SCRAT is 429 | Deno "the shared counter" and "before the counter migration is applied" | built; the database half is live once S02's migration is applied |
| A9 | Kill path: with `EXPO_PUBLIC_SERVER_FEATURES` off nothing above loads a client, touches the Keychain, calls Supabase or installs a crypto global | D-089 ("the switch stays as the kill path"); 08-delivery 8.3 item 1 | `serverFeaturesEnabled()` checks in `pending.ts`, `email.ts`, `apple.ts`; `getSupabaseOrNull` unchanged (Line B had removed this check; not ported) | `auth-kill-path.test.ts` (9 cases; the four side-effect cases, pending note, GET /verify, apple-token and client plus crypto, also run with the switch on as a control); `capabilities.test.ts` unchanged and green; web e2e journeys on a fresh export with the switch off: 55 of 55 passed on 15 Oct 2026 (`npm run e2e:web -w @scribe/mobile`, run recorded in the PR) | built |
| A10 | Words follow the content rules; no claim of more than the system does | 08-delivery 8.3 item 7 | `packages/content/src/features/auth.en.ts`: `claim.*`, `errors.other_phone` (F02-U11 words), `errors.already_signed_in` (F02-U27 words), `verify.close` | `npm test -w @scribe/content` (rules) green | built |

## 2. The H1 regression test fails on develop and passes here

`apps/mobile/test/auth-h1.test.ts`, case "step 4", uses only APIs `auth-store` already had before BL-347 (`publishAuth`, `onSignedIn`, `currentAuthUserId`, `syncAllowed`), wired the way `lib/sync/index.ts` wires them (`onSignedIn` runs `takeOwnership`). Run unchanged against `origin/develop` at 4183844 on 15 Oct 2026:

```
FAIL  test/auth-h1-develop.test.ts > [F02-REQ-019] H1 step 4: a session alone never claims or uploads
      this phone's letters > even if the attacker's session appeared and consent is already done,
      takeOwnership does not run and nothing is queued
AssertionError: expected [ Array(1) ] to deeply equal []
+ [ "0192f0aa-0000-7000-8000-0000000000a1" ]      <- takeOwnership ran for the attacker's id
```

On `feat/auth-v1-gate` the same case passes, with the owner unset and an empty outbox. The link cases (steps 1 to 3) need the new modules, so on develop they fail at import; develop verified any link on open (`verifyOtp({ token_hash })`).

## 3. Not in this PR (named so the review does not assume them)

| Item | Why it matters for R-17 | Where it is |
|---|---|---|
| 8-digit codes valid 15 minutes (review M4); the mismatch between the templates' "15 minutes" and OTP expiry 3600 in FT-12 | Brute force of a 6-digit code across many IPs (review M4) | **later**: S01 wave 2 "M4 code rules" (WP-F02-14); the expiry choice is a **founder** step (AUTH_SETUP 12, row 2) |
| New-device sign-in email before any recovery-key use | F02-REQ-017, F02-REQ-025; R4 PT-19; must exist before backup escrow releases a key | **later**: WP-F02-13 (S01 with S02, S07, S16), wave 2 |
| `forceReauthEpoch` consumer | F02-REQ-023, review L3; LEGAL-REQ-040 | **later**: WP-F19-12a, wave 2 (Line B `reauth.logic.ts` is ready to port) |
| PKCE challenge `S256` instead of `plain` | Defence in depth if a challenge ever leaked; not needed for H1 (ADR 0023) | later; needs WebCrypto digest in Hermes or a native shim (founder, ADR 0101) |
| Purge worker accepts `APPLE_EXTRA_CLIENT_IDS` | Tokens from `.preview` builds (TestFlight preview lane) can be captured but not revoked; until then they are refused at capture and those deletions say `apple: no_token` | **other stream**: S07 |
| `apple-token` in `_shared/log` `FUNCTIONS`; `appleToken` in `packages/api` `ENDPOINTS` | Log lines say `fn: unknown`; the endpoint is not in the typed contract | **other stream**: S07 |
| Migrations `20261004200000` (`ops.apple_tokens`) and S02's `20261015000000` applied to staging and production | apple-token answers 503 without the first; the database rate limit needs the second | **founder** through `deploy-db.yml`; S02 |
| Device rows S1-06 to S1-08 and S2-14 recorded | S01 "done when" (08-delivery 3.3) | **device**: AUTH_SETUP 11.1, 11.3, 11.9, 11.10 |

## 4. Residual risks the review should weigh

- **Typed codes still work on any phone** (by design, DR-13 A). Someone who talks a parent into typing a code from the attacker's email still reaches the claim screen, which shows the attacker's masked address and needs a tap. The claim screen is the guard there, not PKCE.
- **A phone with no books and no letters skips the claim screen** (nothing to claim, F02 6.2 step 6). Letters written afterwards belong to the signed-in account, as for any sign-in; layers 1 and 2 still stop a planted link.
- **GoTrue behaviour assumed from source reading, not yet seen on a device:** `GET /verify` with a `pkce_` token redirects with `?code=`; `type=email` is not accepted by `GET /verify`, so `magiclink` then `signup` is tried; the verifier survives an app kill. All three are in device check 11.10. If the first fails, links fall back to the code (safe, not broken).
- **Before S02's migration, the apple-token limit is per instance only.** Abuse costs one Apple call per attempt for a signed-in Apple account; Apple codes are single use.
- **Google ID tokens without a nonce** (review L11) are unchanged by this PR.
- **The Apple refresh token is captured before Terms and the 18+ line** (review 2 of PR #139, finding 2). Apple's code lives five minutes, so the app posts it right after sign-in, as F02 6.2 step 3 places it; the Supabase Auth user (email, Apple identity) is created at that same moment. If the person then answers "under 18", the session ends on the phone but the Auth user and its wrapped token stay until an account deletion, as the Auth user alone did before this PR. **For the founder and counsel:** keep this as processing necessary to offer deletion-time revocation, or make the under-18 stop file a deletion request (a server step for S02 and S07). Either way the data map (S17) should list `ops.apple_tokens` as created at sign-in, before Terms.

## 5. Sign-off

| Who | Lens | Verdict | Date and commit |
|---|---|---|---|
| Review agent 1 | Token and session security | see the PR comment | |
| Review agent 2 | Privacy and the kill path | see the PR comment | |
| Shared R-17 review (with S02, S04, S20 items) | All of R-17 | pending | |
| Founder | Merge (D-093: auth is founder-only) | pending | |
