# Signing in

> **Coming in version 1.1.** Signing in is not in this version yet. In this version your book stays on your phone, and you do not need an account.

You can start a book without an account. Your first letters are kept on your phone. When you want your co-parent to write too, or you want your letters on a new phone, sign in.

## Three ways to sign in

- **Continue with Apple.** One tap, using your Apple Account.
- **Continue with Google.** One tap, using your Google account.
- **Continue with email.** Type your email address. We send you one email with a link and a 6-digit code.

There are no passwords, so there is nothing to forget and nothing to reset.

## Signing in with email

1. Tap **Continue with email**, type your email address and tap **Send link**.
2. Open the email from us on this phone.
3. Tap the link, or type the 6-digit code into the app.

The link and the code each work once and last for 1 hour.

**If the link opens in a browser instead of the app,** the page has a button to open Early Letters. Or type the code from the same email into the app.

**If the email has not arrived,** check your spam or promotions folder. After a minute you can tap **Send a new email**. Always use the code from the newest email.

**If the code does not match,** check that it came from the newest email. After 5 wrong codes, entry pauses for 15 minutes. That keeps your book safe. Try again after the break.

**If the link has expired,** tap **Send a new email** to get a new one at the same address.

**If the app says that is a lot of emails for one hour,** wait a little, then try again.

## The first time you sign in

The app asks you to agree to our Terms of Service and Privacy Policy, and to confirm you are 18 or older. Then it asks whether to keep your book on our servers, so it can sync. See [Your privacy](privacy.md).

The books and letters already on your phone become part of your account. Nothing on the phone is deleted.

## Same email address, same account

If you use the same email address, Apple, Google and the email link all open the same account. The app also remembers which way you used last on this phone, and shows it.

If the addresses are different, each one opens its own account. This happens most with Sign in with Apple. If you chose Hide My Email, Apple gives us a private address instead of your own. Signing in later with Google, or with the email link, then opens a new, empty account. Your letters are still safe in your first account.

**If the app says "No book here yet",** you may have used a different way last time. Tap **Try another way** and sign in the way you did before.

## Passkeys

After you sign in, go to Settings, Account and tap **Add a passkey**. Next time, tap **Use a passkey** and your iPhone signs you in with Face ID or Touch ID. You can still sign in with Apple, Google or email.

## On a new phone

Install Early Letters, tap **I already have a book**, and sign in the same way as before. Your book shows straight away and your letters arrive.

Recordings are kept on the phone they were made on. They come to a new phone if your iPhone's own backup restores them, or from an export you saved. See [Deleting and exporting](deleting-and-exporting.md).

## A phone you no longer use

Settings, Account, **Sign out of other devices**. Other phones signed in to your account will need to sign in again.

## Signing out

Settings, Account, **Sign out**. If some letters have not reached your account yet, the app waits until they have, then signs you out. Signing out never deletes the letters on this phone.

## Still stuck?

Write to us at {SUPPORT_EMAIL}. Tell us which way you sign in and what you see on the screen. Please do not send your letters or the code from your email. We never need them.

---

## Reviewer notes (remove before publishing)

**Version 1.1 (founder decision, v1.0 is on-device only).** This whole article describes sign-in, sync and accounts, which move to v1.1 with co-parent sharing (brief decisions 4 and 5, as amended in PR #33). Do not publish it with the v1.0 help centre. The notes below describe what is built on develop, which stays behind the build switch in PR #54 for v1.0.

**Built on develop (7cc43b1).** Sign-in with Apple, Google and the email link and code, the consent sheets, Settings, Account, and passkeys behind a flag (`docs/agents/BOARD.md`, "Done this wave": auth). Labels are from `packages/content/src/features/auth.en.ts`: "Continue with Google" and "Continue with email" (lines 26 and 27), "Use a passkey" (line 28), "Send link" (line 48), "Send a new email" and the one-minute wait (lines 59 and 60), the expired, wrong-code, 15-minute pause and too-many-emails messages (lines 73 to 76), "No book here yet" and "Try another way" (lines 106 to 111), Account rows (lines 134 to 149). The Apple button uses Apple's own "Continue" type (`apps/mobile/src/lib/auth/ui.tsx` line 99). "I already have a book" is `onboarding.welcome.signInButton` (`strings.en.ts` line 50).
- 1 hour and 6 digits: `docs/ops/AUTH_SETUP.md` lines 127 and 128. The length is a setting, and line 128 says 6 versus 8 is still a product call. If it changes, change "6-digit" here.
- One minute between emails: `apps/mobile/src/lib/auth/email.ts` line 23. Five wrong codes in 15 minutes: `apps/mobile/src/lib/auth/errors.logic.ts` lines 63 to 78 (a pause on the phone; the server has its own limit, AUTH_SETUP line 122).
- Google shows only when the build has both Google client ids (AUTH_SETUP line 98).
- First sign-in: the phone's books and letters become the account's in one step (`apps/mobile/src/lib/sync/ownership.ts` lines 1 to 8). Terms, 18+ and the sync question: AUTH_SETUP section 9 (lines 259 to 265).
- "No book here yet" shows after "I already have a book" when the account has no books (`apps/mobile/src/app/(auth)/sign-in/consent.tsx` lines 49 to 66).
- Sign out waits for letters to upload and never deletes letters on the phone (AUTH_SETUP line 265; `auth.en.ts` lines 147 to 149). Sign out of other devices: `apps/mobile/src/app/settings/account.tsx` lines 185 and 186.

**Publish gate: passkeys.** Passkeys are off unless the build sets `EXPO_PUBLIC_PASSKEYS=1` (`apps/mobile/src/lib/auth/passkey.ts` line 29; the Account section shows only then, account.tsx line 169). AUTH_SETUP lines 236 to 242 turn the flag on only after Supabase setup, the `webcredentials` entitlement and device test 11.7, and say "If test 11.7 fails or Supabase changes the beta API, leave the flag off: that is passkeys in v1.1". Publish the Passkeys section only if the release build has the flag on. Otherwise replace it with "Passkeys are not in this version yet."

**Changed in this review:**
- Button names follow the strings ("Continue with ...", "Send link").
- The browser page no longer "shows the same code". AUTH_SETUP line 185 says the page shows "Open Early Letters" and "Or type the code from the same email in the app". The link carries a token hash, not the code. Line 282 (device check 11.3) says "the page shows the code", which contradicts line 185. Hand-off to the auth owner and the website thread to settle one.
- "The app asks which book they belong to" is gone. That merge prompt (PRD A F6.3) is not built: first sign-in claims every book and letter on the phone automatically (ownership.ts above).
- Passkeys now name the real rows. "Sign out of other devices" and "No book here yet" are new, because they are built and support will be asked about them.

**Same email, same account: verified (3 Oct 2026).**
- Supabase docs, "Identity Linking" (supabase.com/docs/guides/auth/auth-identity-linking): "Supabase Auth automatically links identities with the same email address to a single user", and never to an unverified email.
- The iOS ID-token path links too. I fetched the Supabase Auth source at master myself: `internal/api/token_oidc.go` calls `createAccountFromExternalIdentity` and copies each email's `Verified` flag from the token; `internal/models/linking.go` (`DetermineAccountLinking`) links a new identity to an existing user with the same verified email, unless an experimental linking-domains setting separates providers. The red team reached the same result.
- Project settings: AUTH_SETUP lines 29 and 31 set "Allow manual linking" and "Confirm email" on. Hosted settings live in the dashboard and are not in the repo.
- Still worth one staging test once credentials exist (AUTH_SETUP section 11): email link first, then Apple and Google with the same address, and the reverse.

**Hand-offs:**
- `product`: D-054 (Decided) supersedes D-044, but PRD 2.1 and 2.2 and BL-302 (`docs/BACKLOG.md` line 891) still put Google in v1.1 and passkeys out of scope.
- `product` and `content`: a different account signing in on a phone whose letters belong to another account stops sync with `account_mismatch` (`apps/mobile/src/lib/sync/types.ts` line 252). I found no words for it in `packages/content`. Support will need to know what the person sees.

**Recordings on a new phone:** D-059 says no audio upload in v1.0, so this article does not promise a restore from our servers. The D-033 copy is settled (DECISIONS.md lines 378 and 393: "on the phone and in the person's own iPhone backup").

**Privacy:** the "please do not send" line follows the support charter. Tickets carry no content.
