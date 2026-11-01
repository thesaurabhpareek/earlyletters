# Data deletion and account deletion paths (App Store and Google Play)

What each store requires, what the code and database do today, and what must exist before submission. Facts come from `apps/mobile/src` (HEAD `3ce511e`), the pending migrations in `supabase/migrations`, and the specs in `docs/legal/DELETION_AND_EXPORT_SPEC.md`.

## 1. What the stores require

| Store | Requirement | Source |
|---|---|---|
| Apple | An app that lets people create an account must let them start deleting it from inside the app (Guideline 5.1.1(v)). Deactivating or "contact us" alone is not enough. If sign-in uses Sign in with Apple, the user's Apple token should be revoked when the account is deleted. A link to a web flow is allowed for the final step, but the start must be reachable in the app | Apple App Review Guidelines 5.1.1(v), summarised from memory and not re-opened in this session; `docs/DECISIONS.md` D-042 records the repo's reading: "Apple requires in-app deletion, which ships" |
| Google Play | An app that lets people create an account must offer an in-app path to start deletion **and** a working web link where a person can request deletion without reinstalling the app. The web page must name the app or developer as shown on the Play listing, explain extra steps (such as cancelling a subscription), state what data is kept and for how long, and be entered in the Data safety form. Accounts created and operated offline are exempt | https://support.google.com/googleplay/android-developer/answer/13327111 (read 28 Oct 2026) |
| Both | The privacy policy states what is deleted, what is kept, and for how long. Service providers are asked to delete too | |

## 2. Profile A (build as coded today): no accounts

There are no accounts (`currentUserId()` returns null), so Apple's 5.1.1(v) and Google's account-deletion policy are not triggered. Google's offline-account exemption applies. What the app does today for the user's data:

| Action | What actually happens | Evidence |
|---|---|---|
| Delete a letter | The row gets `deleted_at` and the letter disappears from the Book; an Undo stays on screen until the person leaves the screen. **Nothing is erased**: the text and any recording file stay on the phone. There is no "Recently deleted" screen and no 30-day purge | `store.ts` `deleteEntry`, `undeleteEntry`; `letter/[id].tsx` `remove` |
| Hide a book | Stops prompts for that child. "Nothing is deleted" | `store.ts` `hideChild`; `strings.en.ts` `hideBody` |
| Delete the app | Removes the app's SQLite database and recordings from the phone. This is the only real erase, and the app says so: "Until then, deleting the app removes its letters and recordings from this phone" | `strings.en.ts` `settingsMore.deleteAccountNotYet` |
| Account deletion row | Visible, disabled | `settings/index.tsx` |
| Export | Visible, disabled ("arrives in a coming beta update") | `settings/index.tsx` |
| Device backup | Recordings are deliberately not excluded from the user's own iCloud device backup (D-033, recommended, awaiting founder OK), and the SQLite store is in the app container, so a user's own backup may keep copies until it ages out or they delete it. The speech model files are excluded from backup | `model-files.ts`, `ScribeFilesModule.swift` |

**Two accuracy problems to fix before submitting Profile A (OPEN-29, new):**

1. The delete-confirmation copy `settings.delete.entryBody` ("You can undo this for 30 days from Recently deleted.") promises a screen and a window that do not exist on the device. In `apps/mobile/src` the string is not currently wired to a dialog, but it is in the content package that Terms and store copy are checked against. Either build local Recently deleted with a real 30-day local purge, or change the copy to match what the build does. Do not claim in the privacy policy that deleted letters are removed from the phone until the code does so.
2. The privacy policy for the app must say plainly: with no account, everything is stored on the phone, the developer receives nothing, deleting the app removes it, and a user's own device backup may keep a copy.

Store answers for Profile A: Play Data safety "no data collected", so no deletion URL is required, but entering the privacy policy URL is (OPEN-02). Apple: no account, so nothing to enter beyond the policy URL.

## 3. Profile B (v1.0 as designed): the paths each store needs

### 3.1 In the app (both stores)

Settings, Your data, **Delete account** (key `settings.delete.accountTitle`, today a disabled row). Intended behaviour, from `request_account_deletion(p_source, p_had_active_subscription)` in migration `20261003000000_security_and_family.sql`:

1. The person confirms. The app calls the function with `p_source` `ios`, `android` or `web` (anything else is refused; `support` cannot be sent by a client).
2. The server writes a `deletion_requests` row, status `scheduled`, `scheduled_for = now() + 30 days`. If one is already open it returns the same request (idempotent).
3. Immediately: the person's own letters get `deleted_at` and `deleted_reason = 'account_deletion'`, so they leave every family member's view at once; books where the person is the **only** parent are tombstoned too. A book with another parent is not deleted.
4. Steps queued for the deletion worker (`deletion_request_steps`): `storage_objects`, `apple_token_revoke`, `posthog`, `email_provider`, `receipt_email`, `auth_user`, `powersync_verify`; plus `contributor_export_notice` when a book is deleted so its family authors can save their letters.
5. **Cancel in 30 days:** `cancel_account_deletion()` restores letters and books and removes the steps.
6. **Day 30:** `purge_due()` marks due requests `executing` (or `held` under a legal hold). `prepare_account_purge()` removes the person's letters and their sole-parent books and queues Storage deletions; the worker removes photos (bucket `entry-photos`), the Sign in with Apple token, analytics and email-provider records, then the auth user; `finalize_account_deletion()` anonymises audit rows and writes a receipt. Other people's letters are never deleted (DATA-REQ-012: `children.created_by` and related keys do not cascade across authors).
7. A subscription is not cancelled by deleting the account. The deletion screen must say so and link to the store's subscriptions page (Apple 3.1.2 and Google's rule on extra steps); `p_had_active_subscription` records whether it applied.

**What is not in the repository** (OPEN-06): the Edge Functions (`purge-worker`, token revoke, PostHog and Resend deletion, receipt email) and the in-app screen. The migrations are marked PENDING in `supabase/APPLY.md`. Until they exist and are tested end to end, do not submit Profile B with an enabled-looking Delete account row, and do not state completion times in the policy.

Smaller deletions that exist in the schema: `delete_entry` / `restore_entry` (30-day tombstone, author only), `request_book_deletion` / `cancel_book_deletion` (sole parent schedules a 30-day deletion; with a co-parent it becomes "leave and remove my letters"), `revoke_invite`, leaving a family.

### 3.2 On the web (Google requires it; useful for Apple)

| Item | Detail |
|---|---|
| URL | `https://earlyletters.com/delete-account` (listed in D-042). **Does not exist today**: `apps/web/src/app` has no such route (OPEN-05) |
| v1.0 scope (D-042, recommended) | A static page that explains in-app deletion and a support-email route handled by a runbook; the full magic-link web flow (LEGAL-REQ-030) ships before Android |
| Must contain for Google | The app name exactly as on the Play listing; how to start deletion without the app installed; any extra step (cancel the subscription in the store); what is deleted; what is kept and for how long; how long it takes; the contact email |
| Email route | `hello@earlyletters.com` is the only published contact (`apps/web/src/content/site.ts`). The page should ask the person to write from the address they signed in with. Handling happens with `support_assisted` as the source in the audit trail (the client cannot choose `support`) |
| Website privacy policy | Already offers address deletion for the email list by email (`privacy-copy.ts` "Your choices"). It says nothing about the app (OPEN-02) |

### 3.3 What is kept after deletion (must be disclosed, OPEN-25)

From the migrations and `docs/legal/DELETION_AND_EXPORT_SPEC.md`:

| Data | After account deletion | Source |
|---|---|---|
| Letters, recordings, photos the person authored | Deleted at day 30; Storage objects within about 15 minutes after the purge; database backups roll off 7 days later; processors within 14 days | Spec section 2.1; `purge_due` |
| Other people's letters in a shared book | Kept | DATA-REQ-012 |
| Purchase ledger (`store_subscriptions`) | Kept with `profile_id` set to null (pseudonymised); the schema comment says 7 years. `store_notifications` purged after 7 years | Migration `20261003010000`; `purge_due` |
| Consent records (`policy_acceptances`) | Pseudonymised on profile deletion, deleted 3 years later | Migration `20261002020000` |
| Audit events | Actor and subject ids nulled; deleted after 24 months | `finalize_account_deletion`; `purge_due` |
| Deletion request and receipt | Kept without the profile id; deleted after 3 years | `purge_due` |
| Legal hold | Deletion pauses (`held`) while a hold exists | `legal_holds`, `is_held` |
| Invite hashes | Deleted 90 days after use, revocation or expiry | `purge_due`, D-020 |

### 3.4 Data requests that are not account deletion

- **Export** (any time, free, on the phone): specified in `DELETION_AND_EXPORT_SPEC.md`; the Settings row is disabled in the current code. Store listing text promises export (`store.en.ts`), so either build it before submission or remove the promise (OPEN-11).
- **Deleting only the recordings or a book:** `request_book_deletion` and local controls; no UI yet.
- **Analytics and crash data:** identified only by a random id, deleted on request through a stateless function that receives the current analytics id once, in memory (D-003 open sub-point; TDD 05 X-02). Not built (OPEN-13).

## 4. Console fields to fill (Profile B)

| Where | Field | Value |
|---|---|---|
| App Store Connect, App Information | Privacy Policy URL | OPEN-02 |
| App Store Connect, App Privacy | Privacy Choices URL (optional) | The deletion and settings page, once it exists |
| App Store Connect, review notes | Account deletion | "Settings, Your data, Delete account. Asks for confirmation, schedules deletion in 30 days, cancellable. Sign in with Apple tokens are revoked." |
| Play Console, App content, Data safety | Account creation: yes; in-app deletion path; deletion web URL | `https://earlyletters.com/delete-account` once built |
| Play Console, Data safety | Retention disclosure | Section 3.3 above, mirrored in the published policy |
| Privacy policy (app) | Deletion section with an anchor, as Google suggests | Counsel to draft |
