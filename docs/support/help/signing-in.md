# Signing in

You can start a book without an account. Your first letters are kept on your phone. When you want your co-parent to write too, or you want your letters on a new phone, sign in.

## Three ways to sign in

- **Sign in with Apple.** One tap, using your Apple Account.
- **Sign in with Google.** One tap, using your Google account.
- **Email.** Type your email address. We send you one email with a link and a 6-digit code.

There are no passwords, so there is nothing to forget and nothing to reset.

## Signing in with email

1. Type your email address and tap Send.
2. Open the email from us on this phone.
3. Tap the link, or type the 6-digit code into the app.

The link and the code each work once and last for 1 hour.

**If the link opens in a browser instead of the app,** the page shows a button to open Early Letters and the same code. Type the code in the app and you are in.

**If the email has not arrived,** check your spam or promotions folder. After a minute you can tap Send a new email. Always use the code from the newest email.

**If the code does not match,** check that it came from the newest email. After 5 wrong codes, entry pauses for 15 minutes. That keeps your book safe. Try again after the break.

**If the link has expired,** tap to send a new one to the same address.

## Same email address, same account

If you use the same email address, Apple, Google and the email link all open the same account. The app also remembers which way you used last on this phone, and shows it.

If the addresses are different, each one opens its own account. This happens most with Sign in with Apple. If you chose Hide My Email, Apple gives us a private address instead of your own. Signing in later with Google, or with the email link, then opens a new, empty account. Your letters are still safe in your first account. Sign out, then sign in with Apple again.

## Passkeys

After you sign in, you can add a passkey. Then your iPhone signs you in with Face ID or Touch ID.

## On a new phone

Install Early Letters, tap I already have a book, and sign in the same way as before. Your book shows straight away and your letters arrive.

Recordings are kept on the phone they were made on. They come to a new phone if your iPhone's own backup restores them, or from an export you saved. See [Deleting and exporting](deleting-and-exporting.md).

## Letters you wrote before signing in

When you sign in on a phone that already has letters, the app asks which book they belong to. You can add them to a book, or keep them as a new book. Nothing on the phone is deleted.

## Signing out

If some letters have not reached your account yet, the app waits until they have before it signs you out. Your letters always reach your account first.

## Still stuck?

Write to us at {SUPPORT_EMAIL}. Tell us which way you sign in and what you see on the screen. Please do not send your letters or the code from your email. We never need them.

---

## Reviewer notes (remove before publishing)

**Built today (develop at 3688796):** none of this. The app has no sign-in. Settings shows `settingsMore.signedOutHelp`: "Sign in arrives in a coming update."

**To build:** BL-171 Sign in with Apple, BL-051 email link and code, BL-052 bringing local letters into an account, BL-053 provider and email setup. The A section's "Keep the book" sheet (A-REQ-013), merge prompt (A F6.3) and sign-out guard (A F6.4) are specified. "I already have a book" is `onboarding.welcome.signInButton`.

**Hand-off to `product`: Google and passkeys (settled by the brief).** This article follows brief decision 4 (Decided: Apple, Google, email link; passkeys after sign-in). PRD 2.1, D-044 and BL-302 still put Google in v1.1, PRD 2.2 has passkeys out of scope, and the backlog has no passkey task. `product` should update the PRD and add Google and passkey tasks to v1.0.

**Same email, same account: what was checked (3 Oct 2026).**
- Supabase docs, "Identity Linking" (supabase.com/docs/guides/auth/auth-identity-linking, opened as markdown): "Supabase Auth automatically links identities with the same email address to a single user." "When a new user signs in with OAuth, Supabase Auth will attempt to look for an existing user that uses the same email address. If a match is found, the new identity is linked to the user." The condition: "It would also be an insecure practice to automatically link an identity to a user with an unverified email address", so "Supabase Auth will remove any other unconfirmed identities linked to an existing user." SAML SSO users are never linked (not used here).
- Supabase docs, "Passwordless email sign-in": the email link signs people "in to their accounts", and "If the user hasn't signed up yet, they are automatically signed up by default." So an email link to an address that already has an account reaches that account.
- PRD A, edge cases (`docs/prd/A-entry-and-auth.md` line 101): "Same verified email via Google and email: linked automatically [A2]", citing the same Supabase page.
- Project settings: there is no `supabase/config.toml` on develop. PR #36 adds one for the local stack only. It has no identity-linking setting, and Apple and Google are `enabled = false` until the credentials exist (BL-053). Hosted auth settings are set in each project's dashboard (PR #36, `docs/ops/DEPLOY.md` section 5), so they are not in the repo and I could not check them.

**Engineering question before publishing (the security engineer, owner of BL-171 Sign in with Apple, once BL-053 provider setup is done).** On iOS, Apple and Google both sign in through `signInWithIdToken` (PRD A F4). The Supabase page describes automatic linking for OAuth sign-ins and does not name the ID-token flow, and I could not read the Supabase Auth source from this session. So "Apple, Google and the email link all open the same account" is Unverified for the ID-token path. Please test on staging once BL-053 credentials exist: email link first, then Apple and Google with the same address, and the reverse. Also confirm the address Apple and Google pass on counts as verified. If they do not link, change this section back to "sign in the same way each time".

**Facts used:** link and code single use for 1 hour (A-REQ-018); resend after 60 seconds (A F4); 5 wrong codes in 15 minutes pauses entry for 15 minutes (A-REQ-027); scanner-safe browser page with the code (A-REQ-023); expired link resend (A-REQ-024); last method remembered, never the email (A F6.2); Hide My Email gives a new empty account, because private relay addresses never match another address (A F6.2 and edge cases). "Ways to sign in", where a person adds or removes a method by hand (A-REQ-019, manual linking, P1, v1.1 per D-044), is a different feature and is not promised here.

**Recordings on a new phone:** brief decision 9 says no audio upload in v1.0, so this article does not promise a restore from our servers. "Your iPhone's own backup" relies on D-033 (recordings kept in a backed-up folder), which is still recommended, not decided. If D-033 is declined, change the sentence to name export only.

**Privacy:** the "please do not send" line follows the support charter. Tickets carry no content.
