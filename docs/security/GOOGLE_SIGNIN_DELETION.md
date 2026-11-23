# Google sign-in and deletion: what the vendors require and what we hold (BL-1892)

Rows: NS-54-R7, R9, R38; A-NFR-011; DATA-REQ-019. Owner: security. Test: `apps/mobile/test/auth-google-no-token.test.ts` (`[NS-54-R7]`, `[NS-54-R9]`).

Marks. "Read" means the page or file was opened in this session and the line is quoted as given. `[UNVERIFIED]` means it was not read at the vendor's own page, so nothing is built on it. Hosts that did not resolve in this session: supabase.com, developers.google.com, support.google.com. Only developer.apple.com and github.com loaded, plus search-result summaries (secondary, never relied on).

## 1. What Apple requires (read, primary)

Page: https://developer.apple.com/app-store/review/guidelines/ (first 100,000 characters read; the last 14,384 were not).

- 5.1.1(v): "If your app supports account creation, you must also offer account deletion within the app."
- 5.1.1(v): "The app must also include a mechanism to revoke social network credentials and disable data access between the app and social network from within the app. An app may not store credentials or tokens to social networks off of the device and may only use such credentials or tokens to directly connect to the social network from the app itself while the app is in use."
- 4.8 (opening): apps that use "a third-party or social login service (such as Facebook Login, Google Sign-In, ...)" to set up or authenticate the primary account "must also offer as an equivalent option another login service" (Sign in with Apple is that option for us).

Page: https://developer.apple.com/support/offering-account-deletion-in-your-app/ : "Apps that support Sign in with Apple should use the Sign in with Apple REST API to revoke user tokens." (Apple only; the page has no sentence on third-party sign-in.)

Reading for us (counsel and the regulatory lead confirm, as NS-54-R38 says): Google Sign-In is used to log in, not as a social-network feed. Wording for counsel: we request and store no Google access token, no refresh token and no server auth code, on the phone or on our servers. The Google ID token (a Google credential) goes once from the phone to Supabase Auth for verification; whether the hosted Supabase version retains it is [UNVERIFIED] (section 3 read the master branch only). So "may not store credentials or tokens to social networks off of the device" is met for tokens we request and store, and open for the ID token while it passes through Supabase.

Possible gap (5.1.1(v), first clause): "a mechanism to revoke social network credentials and disable data access between the app and social network from within the app". If counsel reads Google Sign-In as in scope (the same "social network" question as above), we may not meet it: we cannot revoke Google's grant (section 4), and the planned "remove Google" (BL-1894) only unlinks the identity at Supabase. Counsel answers; if in scope, a revoke path or a link to Google's own permissions page in the app is needed before Google ships.

## 2. What Google requires [UNVERIFIED at Google's own page]

developers.google.com did not load. A search-result summary (secondary) of Google's pages said: when a user deletes their account the app must delete the information it obtained from Google APIs; the OAuth 2.0 policy says to revoke tokens no longer needed and then delete them; the Google Play user data policy needs an in-app deletion path and a web deletion link. None of this is quoted from Google. Before Google ships, someone with network access reads these three pages and records the lines here: the OAuth 2.0 Policies page, the Google Sign-In "disconnect" guide, and the Google Play account deletion policy (the Play rule only applies if we ship on Google Play; iOS first).

What holds either way: we ask Google for no API data beyond sign-in, so there is nothing "obtained from Google APIs" that we keep, and no token to revoke.

## 3. What Supabase Auth keeps for a Google identity

Version we run: the local stack is pinned by CLI v2.119.0 (`supabase/config.toml` header); the auth image tag in that CLI and the hosted auth version were NOT read. Everything below is from the `master` branch of https://github.com/supabase/auth, read through the page text this session, so for the version we run it is [UNVERIFIED]. On master the `id_token` grant function is `IdTokenGrant` (the client call is `signInWithIdToken`). Supabase's own docs page (supabase.com) did not load.

Read:
- `internal/api/provider/google.go`: default scopes are `"email"` and `"profile"`; with no ID token it falls back to the userinfo endpoint and maps `name`, `picture`, `email`.
- `internal/api/provider/oidc.go`, `parseGoogleIDToken`: sets `Name`, `Picture: claims.AvatarURL`, `AvatarURL`, `FullName`, `Subject`, `ProviderId`, and `hd` if present; "The email ... goes into `data.Emails` with `Verified: claims.IsEmailVerified()`".
- `internal/api/token_oidc.go` (the `signInWithIdToken` path): the ID token and optional access token are used for verification (`SkipAccessTokenCheck: params.AccessToken == ""`); no provider access or refresh token handling appears; it then links or creates the identity and issues our own refresh token.
- `internal/api/external_oauth.go` (the browser flow, not ours): provider tokens are kept in memory and returned to the caller, not written to flow state.

Not read: the function that builds `identity_data` and the user metadata (`createAccountFromExternalIdentity`, `linkIdentityToUser`), the `auth.identities` and `auth.users` column list, and the foreign key from identities to users. So whether the Google name and picture URL land in `auth.users.raw_user_meta_data` and `auth.identities.identity_data` is [UNVERIFIED], but the mapping above makes it the expected case. `docs/legal/DATA_CLASSIFICATION.md:564` already lists `auth.identities` as L3 "Apple and Google subject ids".

Finding F1 (R7 needs a clarification, not a closed gap): R7 already says "Supabase keeps what it keeps" and its subject is what "we store", but its words "no profile picture anywhere off the phone" read wider than that. Supabase probably keeps the picture URL (not the image) and the name from Google in its own auth tables, outside our code. We cannot switch that off from the app. Proposal for `product`: reword R7 to say outright that Supabase Auth keeps the name, picture link and email from Google and we cannot switch that off from the app; what we ourselves store is no Google token and no picture. The proposed wording clarifies R7; it does not close a gap. Then let the first staging run with Google on (BL-053) read the real `auth.users` and `auth.identities` rows for a test identity and record the keys here. Deletion removes the auth user (section 4).

Finding F2: Supabase lets the Google provider skip the nonce check (`apps/mobile/src/lib/auth/google.ts`, `docs/security/REVIEW_R17_AUTH.md:72`). Unchanged and out of this row.

## 4. Deletion and revocation

- Deletion: the purge worker's last step is `ctx.c.auth.deleteUser(uid)` (`supabase/functions/purge-worker/account.ts:173`). It has no Google step and our schema has no Google column or table (test `[NS-54-R9]`). Whether Supabase removes the identity row with the user (a cascade) is [UNVERIFIED]; the staging check in section 5 reads `auth.identities` after a deletion.
- Revocation: Google's grant to our client lives at Google. We hold no token, so we cannot call Google's revoke endpoint and have nothing to revoke. The person removes the app in their Google account permissions [UNVERIFIED: Google's page was not read]. In the app, "remove Google" (BL-1894) unlinks the identity at Supabase; whether Supabase's unlink also calls Google is [UNVERIFIED]. Say neither in product words until read.

## 5. What the test proves, and what it does not

Proves (tests with a mutant each): the phone sends the ID token once to `signInWithIdToken` and nowhere else (no `fetch`, `XMLHttpRequest`, `WebSocket`, `sendBeacon`, `console`, global stash, secure store or async storage, checked by use and by source scan); Google is configured with only the two client ids, so no scopes, offline access or server auth code; `getTokens` is never called; Google's own session on the phone is asked to close after sign-in, also on a refused token (`signOut` errors are swallowed at `google.ts:63`, so this is "requested", not "confirmed"); no migration has a Google token column; the worker has no Google step and ends in `auth.deleteUser`. Does not prove: the ID token is not kept by Supabase, Supabase's own tables (needs a staging project with Google on; BL-053), the identity cascade, or Google's side.

Staging check, once Google is on: sign in with a test Google account, read `auth.users` and `auth.identities` for it (keys only, no values written down), delete the account, read both again, and record the result in this file.

## 6. The receipt line `google: none held`

Conflict with the card: NS-54-R9 says the deletion receipt "names `google: none held`". This row does not meet that sentence (reason below). Routed to `product` and `content` as a decision: build the conditional line, or amend R9 to the ops step receipt. BL-1892's own Done-when allows the absence if explained.

Not added. The person's receipt is the email `account-deleted` (`packages/content/src/emails/account.en.ts`), one fixed text for every account with a few variables (`supabase/functions/purge-worker/emails.ts`). It has no per-provider line, so a Google line would show to Apple and email accounts, where it is noise, or need a new conditional line, which is words a parent reads (content writes them, counsel reads them). The ops step receipt (`apple: 'revoked'` and the like) could carry `google: 'none_held'`, but that shows to no one and the NS-54-R9 promise is about the receipt the person gets. Proposal for `product` and `content`: if the line is wanted, add a PROPOSED key shown only when `auth.identities` held a Google row, and add the step key with it.
