# ADR 0023: Email sign-in links: PKCE, and when a link is accepted

Status: Proposed (stream S01, 15 Oct 2026). Decides: the founder (PRD V2 `08-delivery.md` 3.3, S01 "must not decide alone: the auth flow type (PKCE) and when a link is accepted"). Until decided, the code in PR #139 is the spec default (F02 section 11).
Closes: BL-347 (security review H1), F02-REQ-018, F02-REQ-019, F02-REQ-020; R4 PT-20. Must be accepted before the recovery-key function deploys (08 section 8.1).
Code: `apps/mobile/src/lib/auth/{email-link.logic,account-claim.logic,email,pending,auth-store,session-provider}.ts(x)`, `apps/mobile/src/lib/supabase/client.ts`, `apps/mobile/src/app/(auth)/sign-in/{verify,consent}.tsx`. Tests: `apps/mobile/test/auth-h1.test.ts`, `auth-email-link.test.ts`, `auth-kill-path.test.ts`.

Evidence key: **V** verified in the installed library source or on an opened vendor page, **U** unverified, checked on device (AUTH_SETUP 11.10).

## Context

Security review H1 (`docs/reviews/2026-10-04-security-privacy.md`): anyone can request a sign-in email for their own address and send the link to a parent. Before this change one tap on it signed the parent's phone into the sender's account (the app called `verifyOtp({ token_hash })` on open, with the implicit flow), and `onSignedIn` ran `takeOwnership`, so the phone's letters, raw transcripts, child names and dates uploaded to the sender's account. On `develop` at 4183844 the regression test's step 4 shows exactly that (`takeOwnership` ran for the attacker's id).

## Decision

Three layers; each is enough to stop H1 on its own.

1. **Pending request.** When this phone asks Supabase for an email, it writes a Keychain note (`scribe.auth.pendingEmailRequest`: the time only, never the address; `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`). An opened link is used only while an unexpired note exists (1 hour, the longest OTP life a project can set). Otherwise the app makes no request and shows "Type the code from the email on this phone instead." (F02-U11). A sign-in by link or code spends the note; "Not my account" drops it.
2. **PKCE.** The Supabase client runs `flowType: 'pkce'`. `signInWithOtp` then stores a code verifier in this phone's Keychain and sends only the challenge (V: auth-js 2.117.2 `getCodeChallengeAndMethod`, `storePKCEVerifier`). The app opens a link with `GET /auth/v1/verify?token=<hash>&type=<t>&redirect_to=<callback>`, redirects not followed (`expo/fetch` with `redirect: 'manual'`; V: `expo/ios/Fetch/NativeResponse.swift` hands back the 3xx when the mode is not `follow`), reads the auth code from `Location`, and calls `exchangeCodeForSession(code)`, which needs this phone's verifier. A link from another phone's flow fails there (`bad_code_verifier` or `pkce_code_verifier_not_found`), and a redirect that carries tokens (the implicit shape H1 used) is refused. `verifyOtp({ token_hash })` is no longer called anywhere (a test checks the source).
3. **Claim after consent and a tap.** The auth store releases a session to the sync contract (`onSignedIn`, `currentAuthUserId`, `syncAllowed`) only once consent is complete and, when this phone's letters belong to no account yet, the person has tapped "Keep them here" on a screen showing the masked account email ("a***@example.com"). "Not my account" ends the session; nothing was claimed or queued. A phone with no books or letters skips the screen (nothing to claim); a phone already owned by any account skips it (sync stops on a mismatch and nothing moves). An unreadable store asks.

And: **a link is refused while any account is signed in** on this phone (F02-U27, F02-REQ-020): "You're signed in as another account. Sign out first to use this link." A typed code keeps working on any phone (DR-13 A); it passes layer 3.

### Details

- **Link type.** Our templates send `type=email` so the Magic Link and Confirm signup emails look the same. `GET /verify` takes `magiclink` or `signup`, not `email` (U: GoTrue `verifyGet` type switch; checked on device), so a `type=email` link is tried as `magiclink`, then as `signup`. A miss under the wrong type uses nothing up. No template change is needed: under PKCE the `{{ .TokenHash }}` in the email is already the `pkce_` token (U, device check), and the template's words already say "Tap the button on the phone where the app is open. On a different device? Enter the code in the app instead."
- **Flow ids.** auth-js 2.117.2 stores verifiers per flow id but appends the id to `redirect_to` only with `experimental.appendPkceFlowIdToRedirects` (V). Without it, `exchangeCodeForSession(code)` reads the fixed key that mirrors the most recent flow, which is the right one: a new email replaces the old token, so only the newest link can work.
- **Challenge method `plain`.** Hermes has no `crypto.subtle`, so auth-js sends the challenge as `plain` (V: `generatePKCEChallenge`). We install only `crypto.getRandomValues` (expo-crypto, the platform generator) where it is missing, so the verifier is never made with `Math.random`. We do not install a partial `crypto.subtle`: other code that feature-detects it (for example auth-js asymmetric JWT checks) would then call methods that do not exist. `plain` is enough for H1 because the attacker in H1 holds a different flow; the challenge travels only from this phone to Supabase over TLS. Revisit `S256` when the runtime has WebCrypto digest or a maintained native shim is adopted (a new native module needs the founder, ADR 0101).
- **Order.** Consent screens first (Terms, then sensitive data), then the claim screen (F02 6.2 steps 5 and 6; PRD-REQ-002). A session whose claim was never answered (app closed on that screen) syncs nothing; Family and Settings > Account show "Finish setting up", which opens the claim screen.
- **Kill path.** Every new side effect checks `serverFeaturesEnabled()`; with the switch off none of it runs (test `auth-kill-path.test.ts`).

## Alternatives considered

- **Pending note only (the review's interim fix).** Stops the attack in the app, but a stolen link plus a pending note (the victim asked for their own email minutes earlier) would still verify. PKCE closes that.
- **PKCE only.** Relies on device behaviour we could only partly verify in source (U above). The note is cheap and makes the refusal happen before any request.
- **Claim on SIGNED_IN with an undo.** Uploads would already have happened; H1's impact is the upload. Rejected.
- **`verifyOtp({ token_hash })` with PKCE on.** Supabase's server-side pattern; it creates a session without the verifier, so it accepts a link from anyone. Rejected.

## Consequences

- A link opened on another phone, or on this phone without a request, always falls back to the code. Support copy: "Type the code from the email on this phone instead."
- Two sends in a row: only the newest email's link works (as before for the code).
- Device checks AUTH_SETUP 11.3 and 11.10 must pass before C1 (the U items above).
- The 8-digit, 15-minute code rule (review M4) and the new-device sign-in email are separate work packages (S01, wave 2).
