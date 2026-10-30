# F02 Account and sign-in (Keep the book, local-first, re-ownership)

| | |
|---|---|
| Release | v1.0 gate (passkeys: not in v1.0, see 4) |
| Priority and rank | P0, rank 10 (05-feature-map.md section 2) |
| Personas | P1 Evening parent, P2 Co-parent, P3 Expecting parent, P4 Multilingual family |
| Existing IDs | A-REQ-012 to A-REQ-034, A-NFR-004, A-NFR-008 to A-NFR-013, PRD-REQ-001, PRD-REQ-002, PRD-REQ-022, LEGAL-REQ-001, LEGAL-REQ-006, LEGAL-REQ-008, LEGAL-REQ-009, LEGAL-REQ-014, LEGAL-REQ-024, LEGAL-REQ-026, DATA-REQ-023, DATA-REQ-033, DATA-REQ-044, D-026, D-036, D-038, D-044 (overridden by B3), DR-12, DR-13, R-17, BL-050, BL-051, BL-052, BL-053, BL-054, BL-170, BL-171, BL-172, BL-248, BL-302, BL-322, BL-330, BL-331, BL-332, BL-347, BL-349 |
| Depends on | F01 (gate state, link parser), F03 (local children and signature), F04 (first saved letter), F16 (sync starts after this feature), F17 (Settings > Account, Privacy, deletion), F21 (`/auth/confirm` page, AASA). Domain BL-100 |
| Status | Draft V2, 3 Oct 2026. M14 pass and security reconciliation 13 Oct 2026 after critique round 1 (R1 PL-04, PL-19, PL-20; R3 DX-07, DX-15; R4 PT-12, PT-19, PT-20, PT-32; R5 EQ-19): sign-in is v1.0 and gates every server feature; the BL-330, BL-347, BL-322, BL-331 fixes are requirements here. Revised 15 Oct 2026 after critique round 2 (R8 R2A-06, R2A-08, R2A-27; R7 R2P-03, R2P-17, R2P-18; `reviews/DISPOSITION-R2-architecture.md`): the new-sign-in email is driven by the server, its link is scanner-safe, and the ask order follows DR-12 B |

## 1. Why

- [D] First letter before the account: capture, transcription and save are local, and sign-in is required only for server features (A section 0 items 1 and 2; A-REQ-012).
- [F] App Review 5.1.1(v): apps without significant account features must work without login, and apps with accounts must offer in-app deletion (R4 section 5, R4-S55).
- [S] Reliability is the top complaint: 41 of 104 negative or mixed reviews across 11 products are bugs, sync or lost entries (R2 section 0 item 1). An account is what lets a letter survive a lost phone and reach the co-parent.
- [S] Day One reviewers punished the removal of a free sync path (R2-S3, R2-S16). Account creation is offered as protection, never forced, and a free storage path is never taken away (R2 section 6, F02 row).
- [D] Sign-in at v1.0: Apple, Google and email link; no passwords; passkeys can be added after sign-in (B3, brief item 4). This overrides D-044's move of Google to v1.1.
- [F] FirstChapter v1.0.6 had to fix Hide My Email compatibility and offline sign-in persistence (R1-S4). Both are tested from day one here.
- [F] Supabase passkeys are labelled experimental in docs dated 2 Oct 2026, and a user must be signed in before registering one (R4 section 7, R4-S59).
- [D] **Server features are on for v1.0** (M14, founder, 13 Oct 2026). Sign-in is the door to sync, co-parent sharing, recording backup and the subscription status report, so every M14 feature inherits this spec's security. M14 also says the security fixes BL-330, BL-347, BL-322 and BL-331 gate any outside tester (`_AUTHORING.md` 3b).
- [F] What the code does on 13 Oct (security review `docs/reviews/2026-10-04-security-privacy.md`): Apple, Google and email sign-in exist in `apps/mobile/src/lib/auth/` and `app/(auth)/sign-in/`. **H1 (BL-347) is open**: `verify.tsx` verifies any opened link, `session-provider.tsx` accepts it whatever the state, the Supabase client uses the implicit flow (no `flowType: 'pkce'` in `lib/supabase/client.ts`), and local letters are claimed on `SIGNED_IN` before consent, so one tapped link from an attacker uploads a family's letters to the attacker's account. **H3 (BL-330) is open**: `lib/auth/apple.ts` never sends the authorization code, so deletion cannot revoke Apple tokens. **H2 (BL-322, BL-331)**: the server half (two-parent cap, stale invites) is in the pending `20261005000000`; the app still joins without a tap. **M4**: email codes are 6 digits valid 1 hour (`lib/auth/email.ts` reads `EXPO_PUBLIC_EMAIL_OTP_LENGTH`, default 6). Passkey code exists in `lib/auth/passkey.ts` behind `EXPO_PUBLIC_PASSKEYS`, which no `eas.json` profile sets.

## 2. Who

| Persona | Moment | Holding, feeling, short of |
|---|---|---|
| P1 | Just saved a second letter, or opened the app for a second time, often at night | Relief and a little pride; no patience for a form; may not have their email password to hand |
| P1 returning | New phone, or reinstalled | Fear their letters are gone (02 section 3, fears) |
| P2 | Arrived by invite; must sign in to join (F11) | Wants the shortest path; may use a different Apple Account from P1 |
| P3 | Started before birth; may defer the account for weeks | Needs Later to work for as long as they like |
| P4 | Any of the above, interface in English | Email addresses and names in any script must work |

## 3. What we are solving

Outcome: after the first saved letter, a parent can keep the book on any phone in two taps with Apple or Google, or with an email link or code, without ever losing a letter, and can say Later and keep using everything local.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Share of first-letter users with an account by day 7 | 50% or more [A] (03 section 4.2) | Server accounts against first-letter users; first-letter users without accounts estimated from `analytics_opted_in` | Phone-only users invisible to the server |
| Auth success per method, excluding cancels | 97% or more weekly; alert below 93% (A-NFR-013) | Supabase Auth logs, content-free | None |
| Native Apple or Google sign-in time after the OS sheet closes | p90 3 s or less (A-NFR-004) | Device perf run | Lab |
| Auth email delivered | p90 30 s or less (A-NFR-004) | Resend delivery logs | None |
| Letters lost in re-ownership, sign-out or revocation | Zero (gate) | Fault-injection tests; support tickets | None |

## 4. Scope

**In v1.0**
- Keep the book sheet after the first saved letter, and Later.
- Sign in with Apple, Sign in with Google, email link plus 6-digit code (B3, DR-13 A).
- Terms line with the 18+ confirmation; `terms` acceptance with `age_attested: true`.
- Sensitive-data consent screen after a new account and before the first sync.
- Re-ownership of local data in one transaction; merge prompt when the account already has books.
- Sign-out guard; Apple credential revocation check; Apple token capture for deletion-time revocation (BL-330).
- The H1 fix (BL-347): PKCE for email links; a link is accepted only while this phone has a pending request; local letters move to an account only after consent, behind a screen with the masked account email and a tap; a link is refused while another account is signed in.
- New-device sign-in email, P0 (R4 PT-19): sent on every sign-in from a device the account has not used, before any recording key can be released (F08 6.5 C).
- 8-digit email codes valid 15 minutes [R] (security review M4; Q2).
- The outside-sign-in gate (R-17): no one outside the founding family signs in until the gate in F02-REQ-024 passes.
- Scanner-safe `/auth/confirm` page, universal links on earlyletters.com, rate limits, specific errors, offline session restore.
- "Ways to sign in" in Settings: add a second method while signed in (A-REQ-019, raised to v1.0 P1 with Google, Rev B3).
- Sign out other devices (TDD 04 3.2.3).

**Passkeys: what "experimental" means for v1.0.** Supabase labels passkeys experimental (API may change), the changelog calls it Beta, registration needs a signed-in user, and changing the relying party id invalidates every passkey (R4-S59). No React Native passkey bridge was checked (R4 section 11). So v1.0 ships no passkey UI, and the release profiles never set `EXPO_PUBLIC_PASSKEYS` (the module in `lib/auth/passkey.ts` stays unreachable). We fix the relying party id now as `earlyletters.com` so a later rollout never invalidates anything, and we re-check Supabase status at each milestone; passkeys ship when Supabase marks them generally available and a maintained, permissively licensed bridge exists (F02-REQ-016). App Review 2.3.1 forbids hidden features, so a dormant flag is not an option (R4 section 5).

**Later**
- Passkeys (above). Apple on Android, Google Credential Manager (A-REQ-020, with Android, F36).

**Never**
- Passwords or a forgot-password flow (B3).
- Anonymous Supabase auth in the app (A section 0 item 4, K-08).
- SMS or phone numbers (LEGAL-REQ-012 never collects phone number).
- Automatic merging of two accounts by email (TDD 04 3.1.5).
- A Plus sheet inside or before the Keep the book sheet (D-036, C-REQ-023).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Day One | Email and password, Apple, Google (Google on iOS in 2026.20); account required to sync [F] R1-S6, R1-S52 | 4.8 (118K) [F] R1-S6 | Called stable now after buggy early years [S] R1-S6 | **Match** methods, drop passwords [R] |
| Airbnb (quality bar) | Email, phone, Google and Apple offered together [F] R1-S59 | n/a | n/a | **Match** one sheet with all methods [R]; no phone |
| Dearest | No account; on-device with optional iCloud backup [F] R1-S3 | 5.0 (1) [F] | Too few reviews | **Match** the local-first start [R] |
| Then, Chapter One | No account or local plus iCloud [F] R1-S68, R1-S34 | Too new | n/a | Confirms the local-first trend (Inferred, R1) |
| FirstChapter | Fixed Hide My Email and offline sign-in persistence in v1.0.6 [F] R1-S4 | n/a | n/a | **Match** [R]: test relay addresses and offline restore early |
| Qeepsake | Contributors invited by email and told not to make an account first [F] R1-S40 | n/a | n/a | **Match** for F11: the invite leads into sign-in [R] |

## 6. Experience

### 6.1 Entry points

| Entry | Sheet title | `trigger` |
|---|---|---|
| The first save in session 2, or the second saved letter, whichever comes first, after the save animation settles (A-REQ-013 Rev, DR-12 B) | `auth.sheet.title` "Keep {child}'s book on any phone" | `first_letter` (the existing catalogue value, kept so the event stays comparable) |
| Welcome > Sign in (F01) | Sign in | `sign_in` |
| I was invited, not signed in (F11) | Sign in to join | `invite` |
| Once after the third saved letter, if Later (A F3.3) | Keep the book | `third_letter` |
| The Keep gate reached while signed out (F14) | No Keep the book sheet: the Plus sheet shows directly and purchase needs no account with us (F14). Never a Plus sheet inside Keep the book (D-036). Whether the gate should route through Keep the book first so billing notices can reach the buyer is R4 PT-08 (a), for counsel | n/a |
| Settings > Account (F17) | Sign in | `settings` |

Re-offer rule: Keep the book shows at most once per calendar day, never in the same session as another ask, never during recording, review or export (PRD-REQ-001). Ask order at launch is the reminder prime in the first ask slot after the first letter, then Keep the book in session 2 or after the second saved letter, then analytics consent (DR-12 B, the spec default in `09` since 13 Oct; F13-REQ-023 builds the same order; R7 R2P-03). If the founder picks A after the C1 cohorts, only the order table in `nextAsk` changes.

**One definition of a session, and every ask in the first 14 days** (R5 EQ-19, R3 DX-15). F02 owns this table; other specs cite it. The sequencer exists (`apps/mobile/src/lib/analytics/ask-sequencer.logic.ts`); the table is what it must implement.
- A session starts at a cold start, or at a return to the foreground after 30 minutes or more away [R].
- At most one ask per session and one per calendar day, never during recording, review or export.

| Ask | Earliest | Owner |
|---|---|---|
| 18+ gate | First launch | F01 |
| Microphone primer and OS prompt | First tap on Speak | F04 |
| Keep the book (sign-in with Terms) | Session 2, or right after the second saved letter, whichever comes first (DR-12 B) | F02 |
| Sensitive-data consent | Right after a new sign-in, as the same moment's second screen; counsel decides whether it can sit on the sign-in sheet (DX-15) | F02, F17 |
| Recording backup | The next session after sign-in and consent | F08 |
| Reminder prime and OS prompt | The first ask slot after the first saved letter (F13-REQ-023, DR-12 B) | F13 |
| Analytics consent | After the first letter, in a session with no other ask | F18 |
| Keep gate (Plus) | Not an ask: it appears only at the Keep step after the free letters (F14) | F14 |

### 6.2 Happy path: Apple, at the Keep the book moment (DR-12 B)

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Saves the second letter, or the first letter of session 2 | Save animation; then the sheet at medium detent: `auth.sheet.title`, `auth.sheet.body`, the child-data notice (K-16), the Terms line `auth.legal.accept` (in-app-disclosures 3a: "By continuing, you confirm you are 18 or older and agree to the Terms and Privacy Policy."), buttons Apple, Google, Email (equal size, Apple not smaller than Google, A-REQ-016), Later | `nextAsk()` returns `keep_the_book`; letter is already committed locally (F04) |
| 2 | Taps Sign in with Apple | System Apple sheet | 32 random bytes as raw nonce; SHA-256 passed to Apple (TDD 04 3.1.1) |
| 3 | Confirms with Face ID | Spinner on the button, sheet stays | `signInWithIdToken({ provider: 'apple', token, nonce })`; session to Keychain (`AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`); full name saved once to `profiles.display_name`; authorization code posted in the body to `apple-token` (new Edge Function, BL-171) which stores the refresh token encrypted for deletion-time revocation |
| 4 | Nothing | Same sheet, step text "Setting up your book" (new) | `record_policy_act('terms', <offered version>, 'accept', 'signin_sheet', ..., context {auth: 'apple', age_attested: true})` plus `privacy` acknowledge; any locally queued consent acts flush after it (POLICY_VERSIONING 7.3; TDD 01 3.11.4). No `age_signal` is sent until counsel answers Q6, because F01-REQ-001 keeps age data off the server (R4 PT-12). The phone posts the authorization code to `apple-token` (BL-330). The server, not the phone, records the new Auth session and queues the new-sign-in email when it is not the account's first session (F02-REQ-017, F02-REQ-025) |
| 5 | Reads the consent screen | `sensitiveConsent.title`, `.body`, `.use`, `.changeLater`, `.declineHelp`; buttons `.agreeButton` "Agree and sync", `.declineButton` "Keep on this phone"; nothing preselected | Shown to every account whose sensitive-data consent is missing, new or existing (R4 PT-20). Agree records `sensitive-data` accept (`consent_sheet`); decline records decline (PRD-REQ-002, LEGAL-REQ-006) |
| 6 | Taps Agree and sync, then confirms the account | If this phone has local letters: one screen "Your letters on this phone will be kept in the account a***@example.com" (masked email; new `auth.claim.*`) and a Keep them here button. Then the Book, unchanged, with a quiet "Syncing" row in Settings only | Re-ownership runs only after this tap, never on `SIGNED_IN` (BL-347). Then `create_first_run_children` (or `create_child` per book), then sync starts (F16). The server refuses content writes until Terms with `age_attested` and sensitive-data consent exist (`require_content_consent()`, `20261003000000_security_and_family.sql`, pending apply) |

Google is identical with the native Google ID token (`@react-native-google-signin/google-signin` per Supabase's guide, nonce on: hashed nonce to Google, raw nonce to Supabase, R4-S58).

### 6.3 Happy path: email link and code

| # | Person does | App shows | System does |
|---|---|---|---|
| 1 | Taps Email | Labelled field, email keyboard, autofill (A F4) | Nothing sent yet |
| 2 | Types the address, taps Send | "Check your email" screen: `auth.email.sent` with the address, 8-digit code field (autofill, paste, auto-submit at 8 digits; the length follows `EXPO_PUBLIC_EMAIL_OTP_LENGTH` and the Supabase setting together), Open email app, Send a new email (enabled after 60 s), Use a different email | `signInWithOtp({ email, options: { shouldCreateUser: true } })` from every entry point, so the response never reveals whether the account exists (email SECURITY.md 3.6, TDD 04 3.1.3). Email `sign-in-link` (copy on `origin/feat/email-brand-library`, `packages/content/src/emails/auth.en.ts`) carries the link `https://earlyletters.com/auth/confirm#token_hash=...&type=email` and the code |
| 3a | Taps the link on the same iPhone | App opens, then step 4 of 6.2 | Universal link. The app accepts it only while this phone holds a pending request from this install (the request made in step 2) and no other account is signed in; the link carries a PKCE code that only this install can exchange (BL-347). Otherwise it routes to "Type the code from the email" |
| 3b | Opens the email on a laptop or in an in-app mail browser | `/auth/confirm` page: type the code from the email into the app, an Open the app button (scheme, no token) | The page never calls Supabase on load, on script run or on any button (A-REQ-023; SECURITY.md 3.1) |
| 3c | Types the code | Auto-submits | `verifyOtp({ email, token, type: 'email' })` |

Words: the product and email say "sign-in link", never "magic link" (email catalog reconciliation note). The PKCE change needs the email template update in `supabase/templates/magic_link.html` and an ADR (section 11). Email copy status: `sign-in-link`, `verify-email`, `account-create-attempt`, `sign-in-trouble` and `welcome` are drafted on the unmerged branch and marked launch-blocking there; `{expiresIn}` is filled from config.

### 6.4 Re-ownership and the merge prompt

1. One SQLite transaction sets `author_id`, `created_by` and dictionary `owner_id` on every local row and marks rows `queued` (TDD 01 3.2.5). Children keep their device UUIDv7 ids, which `create_child(p_id, ...)` accepts idempotently (migration `20261003010000_children_and_entitlements.sql`, pending), so no id remap happens (TDD 01 X-7).
2. If the account already has books on the server and this phone has local books: "Add the letters on this phone to {child}'s book?" per local child, with Add to an existing book or Keep as a new book (A F6.3). Nothing local is deleted. "Keep as a new book" is free: books for more children have no gate (M2, PRD-REQ-015 Rev), and the server no longer refuses a book for Plus (`20261004000000_plus_on_device_only.sql` retires `SCPLS`, pending). Nothing local is ever deleted (D-038).
3. Moving letters between children uses the P1 `move_entry` (B section 6 item 8); until it ships, the choice is limited to keeping both books.

### 6.5 Returning user on a new phone

Gate (F01), Welcome > Sign in, same method as last time. The install remembers the last method, never the email: "Last time you used {method}." (A-REQ-021). If the account has no books: `auth.noBook` with Try another way and Start a book. Book list and child visible p95 10 s; a year of text p95 30 s on LTE (PRD 7.3). Recordings come back only for owners who turned on recording backup (D-073, M16): through iCloud Keychain, or through the recovery key with the checks in F08 6.5 C, including a 24-hour hold on a new device unless an enrolled device approves. Owners without backup see each letter's "not on this phone" line and the iPhone's own backup or an export is the way back (F08). The other parent's recordings never come to this phone in v1.0.

### 6.6 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F02-U01 | Later on the sheet | `auth_deferred` (if consented); nothing uploads | Book; everything local works, including export and Read together, which is free (M2; A-REQ-014) | Re-offer per 6.1 | Automated: a week of use with Later makes zero Supabase requests |
| F02-U02 | Offline when the sheet would open | Sheet still opens; provider buttons disabled | `auth.offline` "You're offline. Your letter is saved on this phone. Sign in when you're back online." Later enabled | Buttons enable on reconnect | Airplane test |
| F02-U03 | Cancels the Apple or Google sheet | No error state (A-REQ-031) | Sheet as before | Try again | Unit |
| F02-U04 | Apple returns no name on a second sign-in | Expected (Apple sends it once, A F4); keep any stored display name | Nothing | n/a | Unit |
| F02-U05 | Hide My Email address | Relay address becomes the account email; Apple relay must list our sending domain and return path (email CATALOG section 11) | Normal | If mail bounces, Settings shows "We could not reach {email}" (copy needed, catalog 10.4) | Manual with a relay address before C1 |
| F02-U06 | Relay user later signs in with Google on a real address | A new, empty account (never auto-merged) | `auth.noBook` with Try another way | Sign out, sign in with Apple; then add Google in Ways to sign in | Integration |
| F02-U07 | Same verified email used with Google and with an email link | Supabase links identities with the same verified email automatically (A section 3 edge cases citing [A2]; confirm current behaviour in the spike) | One account | n/a | Integration in staging |
| F02-U08 | Email typo | Nothing is created until verified | Code never arrives | Use a different email | Unit |
| F02-U09 | Link opened in a mail scanner or in-app browser | Page does not verify | `/auth/confirm` text and code instruction | Type the code | Web test: page makes no request to Supabase |
| F02-U10 | Link expired or already used | `GET /verify` error `otp_expired`; or this phone's own pending request is over an hour old, refused before any request (BL-347) | `auth.link.expired` with one-tap resend to the same address (A-REQ-024) | Resend | Unit |
| F02-U11 | Link requested on phone A, tapped on phone B; or a link someone else requested | Refused: phone B holds no pending request, and the PKCE code cannot be exchanged there (BL-347) | Heading "This link can't be used here"; "Type the code from the email on this phone instead." (new `auth.link.otherDevice`) | Type the code | `[F02-REQ-018]` H1 regression test: the five steps in security review H1 fail on the fixed code |
| F02-U12 | Resend tapped before 60 s | Button disabled | `auth.email.resendWait` "You can send another in a minute." (no ticking numbers) | Wait | Unit |
| F02-U13 | Sixth email to one address in an hour | Blocked client-side and by Supabase per-address limit | `auth.email.limit` | Try later, or another method | Unit plus staging |
| F02-U14 | Fifth wrong code in 15 minutes | Client pause 15 minutes (A-REQ-027); server keeps Supabase per-IP limit. Only typing a code waits: the newest email's link and Apple or Google still sign in, and sending a new email neither clears nor shortens the pause | `errors.code_paused`, then `code.pausedOtherWays`, in one line | Wait, or Send a new email | Unit |
| F02-U15 | Network drops after the provider succeeded but before `record_policy_act` | Session kept; terms act queued; no content syncs because the server gate refuses it | Book; quiet Settings row "Finishing sign-in" (new) | Retry on reconnect and foreground | Fault injection |
| F02-U16 | App killed during re-ownership | Transaction rolls back; nothing changed | On relaunch, Retry on the sheet | Retry | Fault injection, 100 iterations (A-NFR-013) |
| F02-U17 | Re-ownership succeeds, but a server without `20261004000000_plus_on_device_only.sql` applied still returns the retired `SCPLS` for a second book | Client tolerates it (migration header): book stays local, never deleted (D-038), and the push retries after the migration is applied. No Plus sheet: books are free (M2) | Quiet "not sent yet" state on that book (F16) | Apply the migration; push retries | Integration against a fixture that raises `SCPLS` |
| F02-U18 | Declines sensitive-data consent | Records decline; sync, backup and family stay off; letters stay local | `.declineHelp`; Settings > Privacy `sensitiveLabel` can turn it on (LEGAL-REQ-008, two taps) | Settings | Automated: zero entries uploaded after decline (checklist 6.1) |
| F02-U19 | Sign out with unsynced letters | Stays signed in until `pendingUploadCount() == 0` (A F6.4, TDD 01 3.2.6) | "Your letters are still going to your book. We'll sign you out once they're there." (new) | Automatic | Integration with a blocked network |
| F02-U20 | Sign out offline | Same as U19 | Same, plus offline note | Reconnect | Integration |
| F02-U21 | Apple credential revoked (checked at launch with credential state) | Sync finishes first, then sign-out (A-REQ-033) | After sync: sign-in sheet, local letters intact | Sign in again | Unit with mocked state |
| F02-U22 | Refresh token rejected (reuse detection, revoked, deleted elsewhere) | Local mode; queue kept (TDD 04 F-02) | "Sign in again to keep your book in sync" (new) | Sign in | Fault injection |
| F02-U23 | Account deleted on another device | On next launch: "Your account was deleted on {date}", one local export offered, then local wipe (DATA-REQ-023) | Export, then Welcome | Start again | Integration |
| F02-U24 | Session stored, no network at launch | Lands in the book signed in; refresh on reconnect and foreground (A-REQ-032) | Book | n/a | Airplane test |
| F02-U25 | Keychain not readable (locked since boot) | Sync waits; recording and reading continue (TDD 04 F-01) | Nothing | Unlock | Device test |
| F02-U26 | Double tap on a provider button | Second press ignored while a request is pending | One sheet | n/a | Component test |
| F02-U27 | Signed in on this phone (any account, this one included) when an email link arrives | Refused; nothing changes (BL-347). Sign-out drops this phone's pending request, so the same link never works afterwards | Heading "This link can't be used here"; "You're already signed in on this phone. To use another account, sign out, then type the code from the email." (new) | Sign out, then type the code from the email | `[F02-REQ-020]` integration |
| F02-U33 | A new Auth session for an account that already had one (any device, any client, including a modified one that never registers a device) | The server records the session at its first token and queues `new-device-sign-in` to the account address, with a "Not you? Secure your account" link to the scanner-safe Stop page (F08 6.5 C4) | Nothing on the phone | Owner opens the page and presses the button: every session ends and pending recording restores are cancelled | `[F02-REQ-017]`, `[F02-REQ-025]` |
| F02-U33b | A mail scanner opens the Secure your account link on delivery | Page loads and runs scripts; nothing happens until the button posts the token | Owner stays signed in | n/a | `[F02-REQ-017]` scanner case |
| F02-U34 | An existing account with Terms but no sensitive-data consent signs in on a phone with local letters | Consent screen shows (PT-20); claim screen with the masked email; nothing uploads until both taps | Consent, then claim | Decline keeps everything local | `[F02-REQ-019]` |
| F02-U35 | The Keep gate reached while signed out | Plus sheet directly, no account needed (F14) | F14 sheet | n/a | F14 tests |
| F02-U28 | Policy major version effective while signed in | Re-consent sheet before sync resumes; record, read and export unaffected (LEGAL-REQ-009) | Change summary, Agree, Not now | Not now pauses sync only | Automated |
| F02-U29 | VoiceOver | Focus to the sheet title on open; errors announced; code field announces digits entered | Spoken order matches visual | n/a | Script V-F02 |
| F02-U30 | AX5 on SE 3 | Notice and Terms line fully visible above the buttons without scrolling past them (LEGAL-REQ-001); buttons stack; sheet expands to large detent | Full text | n/a | Component test at AX5 |
| F02-U31 | Co-parent and multi-child: invitee with local books signs in to join | Re-ownership first, then `accept_child_invite`; their own books stay theirs | Merge prompt does not appear for the joined book | n/a | Integration (with F11) |
| F02-U32 | Google sign-in on a phone with no Google account | Google SDK shows its own add-account flow | Google screens | Cancel returns to the sheet | Manual |

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| A-REQ-012 | P0 | Letter first | Given a fresh install, When the person passes the gate, completes F03 and saves a letter, Then no sign-in was asked | A-REQ-012, K-07 |
| A-REQ-013 Rev (B3, DR-12 B) | P0 | Keep the book sheet at the first save in session 2 or at the second saved letter, with Apple, Google, Email and Later | Given the second saved letter, or the first save of session 2, in a session that has shown no other ask, When the save animation ends, Then the sheet opens within 500 ms with four controls. Given the first saved letter of session 1, Then the sheet does not open | A-REQ-013, B3, DR-12 B; R7 R2P-03 |
| A-REQ-014 Rev (M2) | P0 | Later works locally | Given Later, Then record, review, save, book, Read together (free, no session count, M2) and export work, and the sheet returns at most once a day, only at 6.1 moments | A-REQ-014 |
| A-REQ-015 | P0 | Re-ownership in one transaction | Given local data and a successful sign-in, Then every local row carries the new user id before any sync request; Given a forced failure, Then zero rows changed and Retry shows | A-REQ-015, DATA-REQ-044 |
| A-REQ-016 | P0 | Sign in with Apple | Given iOS, Then native sign-in runs with a hashed nonce, the first-sign-in name is saved, and the button is no smaller than Google's | A-REQ-016 |
| A-REQ-017 Rev (B3) | P0 | Google at v1.0 | Given iOS, When Google is tapped, Then a native ID token with nonce is exchanged through `signInWithIdToken` | B3, R4-S58 |
| A-REQ-018 Rev (DR-13, M4 review) | P0 | Email link and 8-digit code in one email, valid 15 minutes [R] | Given an email submitted, Then one email arrives with a PKCE link and an 8-digit code, each single use, valid 15 minutes; the code signs in on any phone, the link only on the phone that asked | DR-13 A; security review M4; Q2 |
| A-REQ-019 Rev (B3) | P1 | Ways to sign in | Given a signed-in user, Then they can add Apple, Google or email, and remove one while two remain; each change writes a `security_events` row | A-REQ-019, TDD 04 3.1.5 |
| A-REQ-021 | P1 | Last method hint | Given a prior sign-in on this install, Then the sheet shows the method name and no email is stored | A-REQ-021 |
| A-REQ-022 | P0 | Universal links on earlyletters.com | Given the app installed, When `/auth/confirm` or `/j` opens from Mail, Gmail, Outlook or Messages, Then the app opens the right flow; the AASA file lists only those paths | A-REQ-022, B11 |
| A-REQ-023 | P0 | Scanner-safe page | Given the page loaded by a scanner that runs scripts and clicks buttons, Then Supabase receives no request from the page | A-REQ-023, SECURITY.md 3.1 |
| A-REQ-024 | P0 | Expired link resend | Given an expired or used token, Then expiry copy and a one-tap resend show | A-REQ-024 |
| A-REQ-025 | P0 | Resend limits | Given a sent email, Then resend is disabled 60 s; at most 5 per address per hour | A-REQ-025 |
| A-REQ-026 | P0 | Custom SMTP on earlyletters.com | Given production, Then auth email is sent through Resend from `hello@earlyletters.com` with SPF, DKIM and DMARC passing | A-REQ-026, B11 |
| A-REQ-027 | P0 | Code attempt pause | Given 5 wrong codes for one address in 15 minutes, Then entry pauses 15 minutes on the device; the abuse job (BL-248) pages above 20 failures per address per hour | A-REQ-027, TDD 04 3.1.4 |
| A-REQ-031 | P0 | Specific errors | Given each `auth_failed.reason`, Then a specific message with icon and words shows; cancel shows nothing | A-REQ-031 |
| A-REQ-032 | P1 | Offline session restore | Given a stored session and no network, Then the user lands in the book signed in | A-REQ-032 |
| A-REQ-033 | P0 | Apple revocation | Given a revoked credential at launch, Then sign-out happens only after unsynced letters sync | A-REQ-033 |
| A-REQ-034 | P0 | Terms line and acceptance row | Given a new account, Then exactly one `terms` accept row with `method='signin_sheet'`, `context.auth` and `context.age_attested = true` exists before any other row of theirs syncs | A-REQ-034, LEGAL-REQ-001 |
| PRD-REQ-002 | P0 | Account creation sequence | Given a new account, Then the order is provider sign-in with Terms, then sensitive-data consent, then sync; each step records its own row; declining keeps all content local | PRD-REQ-002, LEGAL-REQ-006 |
| PRD-REQ-001 Rev (DR-12) | P0 | One ask per session and per day, per the 6.1 session definition and ask table; this row is the one home of the rule (R5 EQ-05) | Given a cold start, Then a new session begins; given a return after 29 minutes, Then the same session; given any session, Then at most one row of the 6.1 table shows, and at most one per calendar day | PRD-REQ-001, DR-12 B |
| F02-REQ-001 | P0 | Sign-out never discards unsynced letters | Given 3 unsynced letters and Sign out, Then the session stays until the queue is empty, and the letters exist on the server afterwards | A F6.4 |
| F02-REQ-002 | P0 | Merge prompt per local child | Given an account with one book and a phone with one local book, When sign-in completes, Then the prompt offers Add to existing or Keep as new, and no local row is deleted by either choice | A F6.3 |
| F02-REQ-003 | P0 | Tokens only in Keychain-backed storage | Given any session or invite token, Then it is never in AsyncStorage, the settings table, logs, route params or Sentry | A-NFR-008, A-NFR-012 |
| F02-REQ-004 | P0 | Apple refresh token captured for revocation | Given Apple sign-in, Then `apple-token` stores the refresh token encrypted and returns 204 with no token echoed; on deletion the token is revoked | A-NFR-011, DATA-REQ-033, BL-171 |
| F02-REQ-005 | P0 | Enumeration-safe email screen | Given a known or unknown address, Then the screen, timing class and response are identical | SECURITY.md 3.6 |
| F02-REQ-006 | P0 | Relay addresses receive auth mail | Given a Hide My Email address, Then the sign-in email arrives (domain, return path and sender registered with Apple) | Email CATALOG 11 |
| F02-REQ-007 | P0 | Account deleted elsewhere | Given an auth failure with the deletion marker, Then the app offers one export, then wipes database, audio, Keychain and analytics id | DATA-REQ-023 |
| F02-REQ-008 | P0 | Sign out other devices | Given Settings > Account, Then "Sign out other devices" ends other sessions at their next refresh | TDD 04 3.2.3 |
| F02-REQ-009 Rev (M1) | P0 | No Plus sheet or purchase UI inside the Keep the book sheet | Given the Keep the book sheet, Then no price, product or purchase control renders; given the Keep gate signed out, Then F14's sheet shows without Keep the book (unless counsel answers PT-08 (a) otherwise) | D-036, M1 |
| F02-REQ-010 | P0 | Server refuses content before consent | Given an account with Terms but no sensitive-data consent, When the client writes an entry, Then the server raises `SCCON` and the client treats it as paused | LEGAL-REQ-006, migration `20261003000000` |
| F02-REQ-011 | P0 | Tokens never travel in the custom scheme | Given the `/auth/confirm` page, Then its Open the app button carries no token; the app accepts tokens only from `https://earlyletters.com` with a fragment | TDD 04 3.1.6, SECURITY.md 3.2 |
| F02-REQ-012 | P0 | Redirect allowlist | Given Supabase settings, Then only `https://earlyletters.com/**` and the brand scheme are allowed redirects | A-NFR-010 |
| F02-REQ-013 | P1 | Re-consent on a major Terms change | Given a major `terms` version effective, Then the sheet appears before sync resumes and record, read and export work whatever the answer | LEGAL-REQ-009 |
| F02-REQ-014 | P0 | Consent acts before sign-in flush after Terms | Given an analytics answer recorded before sign-in, Then it uploads through `record_policy_act` after the `terms` row with its device time | POLICY_VERSIONING 7.2 note, TDD 01 3.11.4 |
| F02-REQ-015 | P0 | Auth reliability | Auth success excluding cancels 97% or more weekly per method; alert below 93% | A-NFR-013 |
| F02-REQ-017 | P0, Rev (R2A-06, R2A-08) | New-sign-in email, driven by the server | Given a new Auth session for an account that already had a session, whatever the client sends or omits, Then within 2 minutes p95 the account address receives `new-device-sign-in` with no content, the device kind from the token if known, and a link to the scanner-safe Stop page. Given more than 5 new sessions in an hour, Then one summary email covers the rest. Given the page loaded by a scanner that runs scripts and follows links, Then no session ends; given the button press, Then every session ends and pending restores are cancelled, once per token. F08 escrow releases no key to a session whose email has not been queued | R4 PT-19; TDD 04 3.1.4; R8 R2A-06, R2A-08 |
| F02-REQ-018 | P0 | An opened email link is accepted only while this install has a pending request, and only through PKCE | Given a link requested on another phone or by another person, Then no session is created and the app routes to the code screen; the H1 steps 1 to 5 fail as a regression test | BL-347; security review H1 |
| F02-REQ-019 | P0 | Local letters move to an account only after consent and a tap on a screen that shows the masked account email | Given `SIGNED_IN`, Then no re-ownership has run; given consent and the tap, Then re-ownership runs once; given an existing account without sensitive-data consent, Then the consent screen shows first | BL-347; R4 PT-20 |
| F02-REQ-020 | P0 | A link is refused while another account is signed in on this phone | Given account A signed in and a link for B, Then A stays signed in and nothing changes | BL-347 |
| F02-REQ-021 | P0 | Joining by invite asks first and never switches the open book by itself | As F11-REQ-006 and BL-322: `peek_invite` shows the child's first name and the inviter's signature, and a tap is needed | BL-322; security review H2 |
| F02-REQ-022 | P0 | Apple refresh token captured at sign-in | As F02-REQ-004: the app posts the authorization code to `apple-token` once after native sign-in; Deno tests with fake keys | BL-330; security review H3 |
| F02-REQ-023 | P0 | Forced re-authentication epoch is honoured | Given `forceReauthEpoch` raised in the signed remote config, Then each phone signs out locally once per epoch after its outbox drains (F19-REQ-011) | Security review L3; LEGAL-REQ-040 |
| F02-REQ-024 | P0 | Outside-sign-in gate (R-17) | Given the release profile with server features on, Then the build goes to anyone outside the founding family only when BL-330, BL-347, BL-322, BL-331, BL-332 and BL-349 have merged, the pending migrations are applied to staging and production, F11-REQ-025 is green, and `/terms`, `/privacy`, `/health-privacy` are live | M14; 09 R-17; BACKLOG gate row 6; R4 PT-20 |
| F02-REQ-025 | P0, new | The server records every Auth session before it can read data | Given a token issued for a session id the server has not seen, Then the custom access token hook [A: Supabase Auth hook input carries the session id; confirmed in WP-F02-13, else a trigger on `auth.sessions` if Supabase permits one] inserts an `account_sessions_seen` row and queues the email in the same transaction. Given a JWT whose session id has no row, Then `sync_pull`, `sync_push`, the escrow functions and `account-stop` refuse with `SCSES` (new). Test: a client that never calls any device RPC still causes the row and the email | R8 R2A-06 |
| F02-REQ-016 | P2 | Passkeys after sign-in, when GA | Given Supabase passkeys marked generally available and a maintained MIT, Apache-2.0, BSD or ISC bridge, Then "Add a passkey" appears in Ways to sign in with relying party id `earlyletters.com` | B3, R4-S59 |

### Inherited requirements whose home is this spec (round 2)

These IDs were cited in V2 with no definition row (R9 R2D-06). The text is taken from the source named in the last column; that source still governs the full wording. Each P0 row has a work package and a test in section 12.

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| LEGAL-REQ-026 | P0 | Secrets live only in the platform secret stores, never in the repo or the app bundle; session and invite tokens in Keychain | Given the repo and the built bundle, When a secret scanner runs, Then no secret is found | `docs/legal/ENGINEERING_REQUIREMENTS.md` on `develop` LEGAL-REQ-026 |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention | Never |
|---|---|---|---|---|---|
| Email address | L3 | Supabase Auth | User; service role | Until account deletion | In analytics, logs, URLs |
| Display name, signature | L3 | `profiles` | User; members of their books | Until deletion | In analytics |
| Session and refresh tokens | L4 | Keychain (`THIS_DEVICE_ONLY`) | App | Sign-out, deletion, revocation | In iCloud backup, logs |
| Apple refresh token | L4 | `apple_tokens` (new), encrypted, service role only | `apple-token` function | Deleted after revocation | Returned to the app |
| Last method used | L2 | Device settings | App | Install | Email itself |
| `policy_acceptances` rows | L3 | Postgres, append-only | User (own); service role | Kept after the account ends, linked or pseudonymised, for the period counsel sets (POLICY_VERSIONING 7.1; R4 PT-09; F17 section 8.4) | IP address, user agent, age signal (until counsel answers Q6) |
| `account_sessions_seen` (new): Auth session id, profile id, first seen, email queued at (for F02-REQ-017, F02-REQ-025) | L3 | Postgres, service role only | Service role | 90 days after the session ends; deleted at account deletion (ledger kind `session_seen`, F16 6.2 F step 2a) | Device model or name; any client-sent device id. `backup_devices` stays for escrow only |
| Sign-in link token hash and code | L4 | Supabase; email; memory on device | Supabase | Single use; expiry | In URLs as query strings, logs |

`ThisDeviceOnly` means a restored iCloud backup never carries a live session, so every new phone sees the Terms line again (TDD 04 3.2.1). Counsel confirms whether Washington's MHMDA exemption removes the need for the separate consent there; Connecticut still needs it (LEGAL-REQ-006 note). Not legal advice.

## 9. Non-functional requirements

| Budget | Target | Gate |
|---|---|---|
| Native sign-in after OS sheet | p90 3 s | Yes (A-NFR-004) |
| Token exchange endpoint | p95 1.5 s, p99 3 s | Yes (PRD 7.2) |
| `record_policy_act` | p95 300 ms | Yes (TDD 04 section 4) |
| Re-ownership of 1 year of local data (about 240 letters) | p95 500 ms on SE 3 [A] | Yes |
| Auth email delivery | p90 30 s | Yes |
| JWT lifetime | 15 minutes (TDD 04 3.1; BL-172) | Config |
| Crash during sign-in losing a letter or invite token | Zero | Yes (PRD 7.5) |

Shared budgets in `06-nfr.md`.

## 10. Analytics

Events exist in `packages/analytics/src/catalog.ts` and fire only after analytics consent, which comes after Keep the book in the ask order, so the first sign-in is invisible to device analytics. Business totals for accounts come from server aggregates (PRD-REQ-017 counts only; BL-024).

| Event | Properties (L2) | Question |
|---|---|---|
| `auth_sheet_shown` | `trigger` | Which re-offer moments are reached |
| `auth_method_selected` | `method` | Method mix |
| `auth_succeeded` | `method`, `new_user`, `had_local_data`, `linked_existing` | Which method finishes |
| `auth_failed` | `method`, `reason` | Where people get stuck |
| `auth_email_sent`, `auth_email_verified` | `attempt`; `via` | Do links or codes do the work |
| `auth_deferred` | `trigger` | How often Later wins |
| `local_merge_choice` | `choice` | Merge behaviour |

## 11. How we build it (with the architect)

**What exists (checked 13 Oct).** `apps/mobile/src/lib/auth/` (`apple.ts`, `google.ts`, `email.ts`, `pending.ts`, `consent.ts`, `machine.logic.ts`, `session-provider.tsx`, `passkey.ts` behind `EXPO_PUBLIC_PASSKEYS`) and `apps/mobile/src/app/(auth)/sign-in/` (`index`, `email`, `code`, `verify`, `consent`); the Supabase client in `lib/supabase/client.ts` (implicit flow); sessions in Keychain through `lib/supabase/secure-storage.ts`. All of it runs only with `EXPO_PUBLIC_SERVER_FEATURES=on`, which no `eas.json` profile sets on 13 Oct. Open: BL-330, BL-347, BL-322 app part, BL-331 and BL-332 apply, the new-device email, `forceReauthEpoch` consumer (security review L3). (On 3 Oct none of this existed.) Server side: `record_policy_act`, `policy_actions_needed`, `my_sync_gate`, `require_content_consent`, `create_child(p_id, ...)`, `create_first_run_children` exist in migrations `20261002020000`, `20261003000000` and `20261003010000`; only the first two migrations are applied (`.github/migrations-applied.txt`). `record_policy_act` allowlists context keys including `auth`, `age_attested`, `age_signal`.

**Libraries (standard over custom; verify licence, last release within 12 months and SDK 57 support before install, brief rule).**
- `@supabase/supabase-js` for Auth (`signInWithIdToken`, `signInWithOtp`, `verifyOtp`, `linkIdentity`).
- `expo-secure-store` with the large-secure-store pattern (TDD 04 3.2.1).
- Sign in with Apple: `expo-apple-authentication` is the expected Expo package [A]; not yet checked in this repo.
- Google: `@react-native-google-signin/google-signin` (named in Supabase's guide, R4-S58).

**Components.** `src/lib/auth/` (exists; S01 owns): add the pending-request check and PKCE exchange (BL-347), the claim screen gate, the `apple-token` call (BL-330) and the epoch consumer. Sheets through Expo Router `formSheet` (ADR 0101 rule 4): `keep-the-book`, `consent/sensitive`. `nextAsk(state)` in `packages/core` (BL-023). Edge Function `apple-token` (new). Web page `/auth/confirm` in the website thread (F21).

**Sequencing.** Order only; dates in `08-delivery.md` section 5. The email-links ADR, then BL-347 and BL-330 (S01), BL-331 and BL-332 applied (S02), BL-322 (S04), BL-349 (S20), then the new-device email, then the switch flip for anyone outside the founding family (F02-REQ-024).

**ADRs required before build** (numbers per `08-delivery.md` section 8.1; matches R2's list item 6)

| ADR | Content | Blocks |
|---|---|---|
| Email links: PKCE and when a link is accepted | Flow type, template change, pending-request rule, refusal while another account is signed in, claim only after consent and a tap, code length and life | WP-F02-12; escrow deploy (F08-REQ-034) |
| Account deletion across systems (F17 owns) | Apple token revoke step and device wipe | WP-F02-03 |

**Riskiest unknown and spike.** PKCE email links from React Native with Supabase: that the code verifier survives an app kill between request and tap, and that the template change reaches every email client (WP-F02-12). BL-330 settled the Apple question: the `apple-token` exchange is needed.

## 12. Work packages

| WP | Scope | Owns files or folders | Depends on | Done when (tests that must pass) | Mode |
|---|---|---|---|---|---|
| WP-F02-01 | Secure session store, sign out, sign out others, offline restore | `apps/mobile/src/lib/secure.ts` (new), `apps/mobile/src/lib/auth/session.ts` (new) | BL-040 (BL-170) | `[F02-REQ-003]`, `[A-REQ-032]`, `[F02-REQ-008]` | agent (mobile engineer, security engineer) |
| WP-F02-02 | Auth configuration as code: OTP length and expiry, JWT 15 min, SMTP, redirects, manual linking | `docs/security/auth-config.md` (new), Supabase config | BL-053 (BL-172) | `[F02-REQ-012]`, `[A-REQ-026]` checks in staging; `[F02-REQ-006]`, `[F02-REQ-015]`, `[LEGAL-REQ-026]` | agent plus human dashboard |
| WP-F02-03 | `apple-token` function and the app call (BL-330) | `apps/mobile/src/lib/auth/apple.ts` (exists), `supabase/functions/apple-token/` (new); `ops.apple_tokens` and `ops_apple_token_put` exist | WP-F02-02 | `[A-REQ-016]`, `[F02-REQ-004]`, `[F02-REQ-022]`, `[A-REQ-033]` | pair. Status 13 Oct: native Apple sign-in built; capture not built |
| WP-F02-04 | Google sign-in | `apps/mobile/src/lib/auth/google.ts` (new) | WP-F02-01 (BL-302, now v1.0) | `[A-REQ-017]` integration in staging | agent (security engineer) |
| WP-F02-05 | Keep the book sheet with notice and Terms line; `terms` act with `age_attested` | `apps/mobile/src/app/keep-the-book.tsx` (new), `apps/mobile/src/lib/auth/acts.ts` (new), feature `copy.ts` | WP-F02-03, BL-023 (BL-050) | `[A-REQ-013]`, `[A-REQ-034]`, `[F02-REQ-009]`, `[F02-REQ-014]`; AX5 test; `[A-REQ-014]` (exists in `apps/mobile/test/auth-machine.test.ts`) | agent (mobile engineer) |
| WP-F02-06 | Email link and code screens, limits, errors | `apps/mobile/src/lib/auth/email.ts` (new), `apps/mobile/src/app/sign-in-email.tsx` (new) | WP-F02-05 (BL-051) | `[A-REQ-018]`, `[A-REQ-024]`, `[A-REQ-025]`, `[A-REQ-027]`, `[F02-REQ-005]`; `[A-REQ-031]` (exists in `apps/mobile/test/auth-machine.test.ts`) | agent (mobile engineer) |
| WP-F02-07 | Sensitive-data consent screen | `apps/mobile/src/app/consent/sensitive.tsx` (new) | WP-F02-05, BL-114 (BL-054) | `[PRD-REQ-002]`, `[F02-REQ-010]` | agent (mobile engineer, privacy engineer) |
| WP-F02-08 | Re-ownership transaction and merge prompt | `apps/mobile/src/lib/auth/reown.ts` (new) | BL-111, BL-113, WP-F02-07 (BL-052) | `[A-REQ-015]` fault injection 100 runs; `[F02-REQ-002]` | agent (mobile engineer) |
| WP-F02-09 | Sign-out guard and account-deleted wipe | `apps/mobile/src/lib/auth/session.ts` | BL-174 sync client | `[F02-REQ-001]`, `[F02-REQ-007]` | agent (sync owner) |
| WP-F02-10 | `/auth/confirm` page and AASA paths | Website repo (F21 thread) | BL-100 | `[A-REQ-023]` network capture; `[A-REQ-022]` manual on 4 mail apps; `[F02-REQ-011]`, `[F21-REQ-024]` | agent in the website thread |
| WP-F02-11 | Email-code abuse detection job | `supabase/functions/` job (new) | BL-236 (BL-248) | Synthetic 25 failures page once | agent (security engineer); stream S01 |
| WP-F02-12 | H1 fix (BL-347): PKCE, pending-request check, refusal while signed in, claim after consent and tap | `apps/mobile/src/lib/auth/**`, `lib/supabase/client.ts`, `app/(auth)/**`, `supabase/templates/magic_link.html`, `docs/ops/AUTH_SETUP.md` | Email-links ADR | `[F02-REQ-018]`, `[F02-REQ-019]`, `[F02-REQ-020]`; the H1 PoC as a failing-then-passing test; `[F02-REQ-024]` | agent, S01, two review verdicts and `approve-migration`. Not built |
| WP-F02-13 | Server-driven new-sign-in email: the access token hook, `account_sessions_seen`, the `SCSES` refusal in data RPCs, the email job, the `account-stop` endpoint shared with F08 | New S02 migration (hook function and table), `supabase/functions/` email step (S07), email template from `feat/email-brand-library` (S16), Stop page on the website (F21) | WP-F02-12 | `[F02-REQ-017]`, `[F02-REQ-025]` | agent, S01 with S02, S07, S16. Not built |
| WP-F02-14 | 8-digit, 15-minute codes and the session and ask table in the sequencer | Supabase Auth setting (founder), `EXPO_PUBLIC_EMAIL_OTP_LENGTH` in release profiles (S20), `lib/analytics/ask-sequencer.logic.ts` (S18) | Q2 | `[A-REQ-018]`, `[PRD-REQ-001]`; `[A-REQ-012]` | pair. Not built |
| WP-F02-15 | `forceReauthEpoch` consumer | `apps/mobile/src/lib/auth/` | F19 WP-F19-12 | `[F02-REQ-023]` | agent, S01. Not built |

## 13. Open questions and assumptions

| Q | Who | By when | What changes |
|---|---|---|---|
| Q1. Google at v1.0 (B3) supersedes D-044; DECISIONS.md and PRD 3.0 still list Google as v1.1 | Founder confirms; PM edits D-044 | T07 | Nothing in this spec; BL-302 moves to M5 |
| Q2. Code and link expiry and length. Spec default changed [R]: 8 digits, 15 minutes (security review M4; R4 PT-19), because escrow now hangs off the session | Founder | Before WP-F02-14 | Supabase OTP settings, `{expiresIn}` copy |
| Q3. Keep link plus code (DR-13 A, spec default) | Founder | T07 | Email template, code screen |
| Q4. Does one Apple Family covering the co-parent (DR-03) interact with separate accounts here? No product change; F14 explains | Founder | T15 | F14 copy |
| Q5. Should Keep the book become required at the second letter if under 50% have an account by day 7 (A Q2)? | Founder, from C1 data | T26 | A-REQ-014 |
| Q6. May we store any age signal on the server (Texas SB 2420 limits age data to compliance use; F01-REQ-001 keeps age data off the server)? Spec default: send none until counsel answers (R4 PT-12) | Counsel | Counsel delta | Context value; DATA_CLASSIFICATION |
| Q7. Rename the account sheet so "Keep" means only the save step (R1 PL-20), for example "Keep your letters safe on a new phone"? | Founder with S16 | Before WP-F02-05 | `auth.sheet.title` |

| A | Assumption | Validate |
|---|---|---|
| A1 | `expo-apple-authentication` meets the brief's licence and maintenance rule | Read the installed package before WP-F02-03 |
| A2 | Same-email Google and email identities link automatically | Staging test in WP-F02-02 |
| A3 | Most Apple users choose Hide My Email (email catalog marks it unverified) | Count relay domains in Auth, content-free |

## 14. Sources

- Repo: `apps/mobile/package.json`, `apps/mobile/src/lib/store.ts`, `packages/content/src/strings.en.ts` (`sensitiveConsent.*`, `settingsMore.*`, `children.*`), `packages/analytics/src/catalog.ts`, `supabase/migrations/20261002020000_data_governance.sql`, `20261003000000_security_and_family.sql`, `20261003010000_children_and_entitlements.sql`, `.github/migrations-applied.txt`.
- Docs: `docs/prd/A-entry-and-auth.md` (sections 0, 3 F3 to F8, 5, 6, 9, 10), `docs/prd/PRD.md` (PRD-REQ-001, -002, -015, -022; K-07, K-15, K-16; 6.1; 7.2; 7.3), `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ-001, -006, -008, -009), `docs/legal/POLICY_VERSIONING.md` (5, 6, 7), `docs/legal/in-app-disclosures.md` (3a), `docs/legal/DELETION_AND_EXPORT_SPEC.md` (DATA-REQ-023, -044), `docs/DECISIONS.md` (D-026, D-036, D-038, D-044), `docs/tdd/04-security-identity.md` (3.1 to 3.2, 3.11, 4, 5), `docs/tdd/01-mobile-client.md` (3.2.5, 3.2.6, 3.11), `docs/BACKLOG.md` (BL-050 to BL-054, BL-170 to BL-172, BL-248, BL-302), `docs/prd/v2/09-decisions-and-risks.md` (DR-12, DR-13).
- Branch `origin/feat/email-brand-library`: `docs/emails/CATALOG.md` (sections 4, 10, 11, reconciliation), `docs/emails/SECURITY.md` (3.1 to 3.6), `packages/content/src/emails/auth.en.ts`.
- Reviews and security: `reviews/R1-product-leader.md` PL-04, PL-19, PL-20; `reviews/R3-design-research.md` DX-07, DX-15; `reviews/R4-privacy-trust.md` PT-08, PT-09, PT-12, PT-19, PT-20, PT-32; `reviews/R5-eng-qa.md` EQ-05, EQ-19; `docs/reviews/2026-10-04-security-privacy.md` H1, H2, H3, M4, L3; `docs/BACKLOG.md` BL-322, BL-330 to BL-332, BL-347, BL-349 and gate row 6; `09-decisions-and-risks.md` R-17.
- Code read 13 Oct 2026: `apps/mobile/src/lib/auth/*`, `apps/mobile/src/app/(auth)/sign-in/*`, `apps/mobile/src/lib/supabase/client.ts`, `apps/mobile/src/lib/analytics/ask-sequencer.logic.ts`, `supabase/migrations/20261004200000_ops_deletion_worker.sql` (`ops.apple_tokens`).
- Research: R1 F02 (R1-S3, R1-S4, R1-S6, R1-S34, R1-S40, R1-S52, R1-S59, R1-S68); R2 section 0 item 1 and section 6 (R2-S3, R2-S16); R4 sections 5 and 7 (R4-S55, R4-S58, R4-S59).
