> **Superseded (1 Nov 2026).** Do not paste from this file. The 1.0 listing is `docs/store/app-store.md`, and every other App Store Connect field is in `docs/store/app-store-connect-1.0.md`.

# App Privacy (nutrition label) answers: Apple App Store Connect

How to use: App Store Connect, App, App Privacy. Choose the profile that matches the binary you upload (OPEN-01). The label is a legal representation; it must match the privacy policy the URL points to (OPEN-02) and the privacy manifest in the build (OPEN-19).

Apple's definitions used (from https://developer.apple.com/app-store/app-privacy-details/, as summarised in `docs/legal/app-store-privacy-labels.md` section 0): "collect" means data leaves the device so we or a partner can access it longer than needed to serve the request in real time; data processed only on the device is not collected; "linked" unless stripped of identifiers and never re-linked; "tracking" means linking with third-party data for ads or ad measurement, or sharing with a data broker.

## 1. Top-level answers (both profiles)

| Question | Answer | Basis |
|---|---|---|
| Privacy Policy URL | OPEN-02. Must cover the app. Today `https://earlyletters.com/privacy` says it covers only the website and email list | `apps/web/src/lib/legal/privacy-copy.ts` |
| Privacy Choices URL (optional) | Optional. Use the deletion and settings page when it exists (OPEN-05) | |
| Do you or your third-party partners use data for tracking? | **No** | No ad SDKs, no IDFA, no data brokers, no App Tracking Transparency prompt. `NSUserTrackingUsageDescription` is not added anywhere |
| Third-party advertising | None | |
| Is the app directed to children / Made for Kids | **No**. Adults only (18+ gate, D-006) | OPEN-23 |

## 2. Profile A: build as coded today (local-only)

**Answer: "Data Not Collected."** Select "No, we do not collect data from this app".

Why this is accurate, from the code:

- No sign-in and no account: `currentUserId()` returns null.
- No network code in `apps/mobile/src` or `apps/mobile/modules` (no fetch, no Supabase client, no PostHog, no Sentry, no `expo-iap`). Re-verify with a search before each submission.
- Letters, child name, birthday or due date, dictionary words, recordings and settings live in on-device SQLite and the app's Documents directory. The 18+ answer is a local boolean (`ageGate.passed`); after a No, only the time of the No is stored locally (`age-gate.logic.ts`).
- Recordings are not excluded from the user's own iCloud device backup (D-033, recommended). That backup is Apple's service acting for the user and is not "collected" by the developer.
- The only outbound action is opening the privacy policy URL in an in-app browser from Settings (`WebBrowser.openBrowserAsync`); that is the user visiting a web page, not data collected by the app. The website's own collection (email list, Resend, Vercel logs) belongs to the website policy, not this label.
- No speech model is downloaded in this build (BL-065 not built), so there is no model-host request.

If a later change adds any of: a network call that sends user data, an SDK, crash reporting, analytics, purchases, sign-in, then move to Profile B and redo this page.

Privacy manifest for Profile A: `NSPrivacyTracking` false, no tracking domains, `NSPrivacyCollectedDataTypes` empty, and required-reason API entries as in `permissions.md` section 4 (OPEN-19).

## 3. Profile B: v1.0 as designed

Valid only when the features exist (sign-in, sync, family, Plus, opt-in analytics) and migrations 3 to 7 in `supabase/APPLY.md` are live (OPEN-26). Starting point is `docs/legal/app-store-privacy-labels.md` section 1.2 (version 1.2.1), re-checked here against the database schema. Differences from that draft are called out.

"Linked" is Yes unless stated. All purposes use Apple's purpose names. Tracking is No for every row.

| Category | Data type | Collected | Linked | Purposes | Evidence in the schema and code | Status |
|---|---|---|---|---|---|---|
| Contact Info | Name | Yes | Yes | App Functionality | `profiles.display_name`, `profiles.signs_as` ("what the child calls you"), `entries.author_signs_as`, name from Sign in with Apple on first sign-in | Confirm |
| Contact Info | Email Address | Yes | Yes | App Functionality | Supabase Auth user email (magic link and code; Apple private relay if chosen); trial and renewal notices by email (`subscription-terms.md`). Add "Developer's Advertising or Marketing" only if marketing email is ever sent | Confirm |
| Contact Info | Phone, Physical Address, Other | No | | | Not requested. Print shipping is out of v1 (K-32) | |
| Health & Fitness | Health, Fitness | No | | | No structured health field. Health mentioned in free text is free-form content | |
| Financial Info | all | No | | | Apple handles payment; we hold no card data | |
| Location | Precise, Coarse | No | | | Not requested. IP address handling must be confirmed per OPEN-13 (PostHog GeoIP, Sentry IP storage) | Confirm |
| Sensitive Info | Sensitive Info | Yes | Yes | App Functionality | `children.due_date`: Apple lists pregnancy or childbirth information here. No biometric data is collected (no voiceprints or face templates, LEGAL-REQ-019) | OPEN-24: remove if due-date mode does not ship |
| Contacts | Contacts | No | | | Never requested | |
| User Content | Photos or Videos | Yes **only if photo attach ships** | Yes | App Functionality | Bucket `entry-photos`, `entries.photo_path`, `children.photo_path` exist in migrations; the mobile app has no photo picker today | OPEN-27 |
| User Content | Audio Data | Yes **only if recordings upload** | Yes | App Functionality | The migrations contain no audio bucket or audio column (`entries.audio_kept_on_device` only). D-032 (shared voice, Plus backup) was "recommended, needs founder OK, wait"; backup is now free (D-111 item 6, D-124 item 5). On-device-only transcription does not count as collection | OPEN-14 |
| User Content | Other User Content | Yes | Yes | App Functionality | `entries.final_text`, `raw_transcript`, `machine_edits`, `stt_meta`, `prompt_key`; `entry_versions`; `dictionary_terms`; child name, nickname, birthday (`children`); `child_invites.signs_as`; family relationships (`child_members`) | Confirm |
| User Content | Emails or Text Messages, Customer Support, Gameplay | No | | | Support is by email outside the app | |
| Browsing / Search History | all | No | | | In-app search is local | |
| Identifiers | User ID | Yes | Yes | App Functionality | Supabase user id used across `profiles`, `child_members`, `entries.author_id`, `audit_events` | Confirm |
| Identifiers | Device ID | No | | | No IDFA. IDFV must not be sent by PostHog or Sentry (OPEN-13). `app_account_tokens` is a random per-account UUID, not a device id | OPEN-13 |
| Purchases | Purchase History | Yes | Yes | App Functionality (Analytics only if counsel reads server aggregates that way) | `store_subscriptions` (product id, status, expiry, environment, storefront, original transaction id), `app_account_tokens`, `store_notifications` | Confirm |
| Usage Data | Product Interaction | Yes, opt-in | No (conditional) | Analytics | PostHog catalogue in `packages/analytics`; opt-in only (D-003). Not linked only if every condition in `docs/legal/app-store-privacy-labels.md` section 1.3 holds in the shipped build | OPEN-13 |
| Usage Data | Advertising Data, Other Usage Data | No | | | | |
| Diagnostics | Crash Data | Yes, opt-in | No (conditional) | App Functionality | Sentry, no user id, content scrubbed | OPEN-13 |
| Diagnostics | Performance Data | Yes, opt-in | No (conditional) | App Functionality, Analytics | `app_cold_start` bucket and Sentry performance | OPEN-13 |
| Diagnostics | Other Diagnostic Data | Yes, opt-in | No (conditional) | App Functionality | Enum-only download and sync outcomes | OPEN-13 |
| Other Data | Other Data Types | **Yes** (added by this pack) | Yes | App Functionality | `policy_acceptances` stores document, version, method, `app_version`, `platform`, `locale` per profile (no IP, no user agent, per the table comment); `deletion_requests`, `audit_events` hold user-linked action records. The 1.2.1 draft did not list these | Counsel to confirm the type |
| Surroundings, Body | all | No | | | | |

Expected label summary for Profile B: Data Used to Track You: none. Data Linked to You: Contact Info, User Content, Identifiers, Purchases, Sensitive Info, Other Data. Data Not Linked to You: Usage Data, Diagnostics.

### What stays on the device and is not on the label

Safety tiers (computed and stored on the phone only; the server table `safety_events` is dropped by migration `20261002020000`, PRD K-06). The 18+ answer. Reading size, theme, reminder choices.

### Differences from `docs/legal/app-store-privacy-labels.md` 1.2.1

1. Audio and Photos are conditional on features that the schema and app do not yet have.
2. "Other Data Types" added for consent and deletion records.
3. Email: the 1.2.1 draft lists "trial and renewal notices"; no email sender exists in the repo for the app (Resend is wired only to the website list). Confirm who sends them (OPEN-13).
4. Safety: until migration 4 is applied, the live core schema still has `safety_events` (tier and time only, no text). Apply migration 4 before launch (OPEN-26).

### Maintaining the label

Re-run this page whenever a dependency, SDK, table, bucket or permission is added. The checklist in `docs/legal/app-store-privacy-labels.md` section 5 stays in force. Keep `NSPrivacyCollectedDataTypes` in the privacy manifest identical to the Profile B table above.
