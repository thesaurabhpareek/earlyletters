> **Superseded (1 Nov 2026).** Do not paste from this file. The 1.0 listing is `docs/store/app-store.md`, and every other App Store Connect field is in `docs/store/app-store-connect-1.0.md`.

# App Privacy (nutrition label) answers: Apple App Store Connect

How to use: App Store Connect, App, App Privacy. Choose the profile that matches the binary you upload (OPEN-01). The label is a legal representation; it must match the privacy policy the URL points to (OPEN-02) and the privacy manifest in the build (OPEN-19).

Apple's definitions used (from https://developer.apple.com/app-store/app-privacy-details/, as summarised in `docs/legal/app-store-privacy-labels.md` section 0): "collect" means data leaves the device so we or a partner can access it longer than needed to serve the request in real time; data processed only on the device is not collected; "linked" unless stripped of identifiers and never re-linked; "tracking" means linking with third-party data for ads or ad measurement, or sharing with a data broker.

> **Build 12 (first store build): Profile B applies. "Data Not Collected" (Profile A) must not be selected.** The founder said on 11 Nov 2026 that Build 12 ships with servers ON (production Supabase). Build 12 is the `production` profile with server features on, sign-in required, recording backup off, status report off and analytics off (D-157, D-160). Profile A applies only to Build 1 (`testflight`, servers off). Section 3.5 below lists, with file and line, what the code does with servers on, and what could not be verified. State of the code on `develop` at 18ff63746 (11 Nov 2026): `apps/mobile/eas.json:61` still sets `EXPO_PUBLIC_SERVER_FEATURES` to `off` in `production`, and `apps/mobile/scripts/preflight-production.mjs:142` requires it off. The flip is draft PR #698 (`feat/ops-production-servers-on`, open, not merged on 11 Nov 2026; it changes `eas.json` line 61 only for the env values, and leaves `EXPO_PUBLIC_BACKUP`, `EXPO_PUBLIC_STATUS_REPORT` and `EXPO_PUBLIC_ANALYTICS` `off`). Until #698 merges, a `production` build is a servers-off build and this label would over-declare; after it merges, Profile B is the only accurate answer. Purchase History is **No** and Device ID is **No** only while `EXPO_PUBLIC_STATUS_REPORT` and `EXPO_PUBLIC_BACKUP` stay off. Usage Data and Diagnostics are **No**: analytics is off in every `eas.json` profile and `apps/mobile/package.json` has no analytics or crash SDK (searched 11 Nov 2026). Engineering reading, confirm with counsel; not legal advice.

> **OPEN QUESTION FOR COUNSEL (not decided here): "Other Data Types".** The Profile B table lists `policy_acceptances`, `deletion_requests` and `audit_events` under Other Data, Other Data Types, Yes. The privacy manifest in the build declares only the five types in `docs/legal/app-store-privacy-labels.md` section 3.2 (Name, Email Address, Sensitive Info, Other User Content, User ID). The label and the manifest must not disagree, so counsel must say whether these records are Other Data Types or fall under a type already declared. Until counsel answers, do not submit Profile B with the Other Data row either way.

## 1. Top-level answers (both profiles)

| Question | Answer | Basis |
|---|---|---|
| Privacy Policy URL | OPEN-02. Must cover the app. Today `https://earlyletters.com/privacy` says it covers only the website and email list | `apps/web/src/lib/legal/privacy-copy.ts` |
| Privacy Choices URL (optional) | Optional. Use the deletion and settings page when it exists (OPEN-05) | |
| Do you or your third-party partners use data for tracking? | **No** | No ad SDKs, no IDFA, no data brokers, no App Tracking Transparency prompt. `NSUserTrackingUsageDescription` is not added anywhere |
| Third-party advertising | None | |
| Is the app directed to children / Made for Kids | **No**. Adults only (18+ gate, D-006) | OPEN-23 |

## 2. Profile A: local-only (Build 1 `testflight` only; not Build 12)

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

Applies to Build 12. Valid only when the features exist (sign-in, sync, family, Plus, opt-in analytics) and migrations 3 to 7 in `supabase/APPLY.md` are live (OPEN-26). Starting point is `docs/legal/app-store-privacy-labels.md` section 1.2 (version 1.2.1), re-checked here against the database schema. Differences from that draft are called out.

"Linked" is Yes unless stated. All purposes use Apple's purpose names. Tracking is No for every row.

| Category | Data type | Collected | Linked | Purposes | Evidence in the schema and code | Status |
|---|---|---|---|---|---|---|
| Contact Info | Name | Yes | Yes | App Functionality | `profiles.display_name`, `profiles.signs_as` ("what the child calls you"), `entries.author_signs_as`, name from Sign in with Apple on first sign-in | Confirm |
| Contact Info | Email Address | Yes | Yes | App Functionality | Supabase Auth user email (magic link and code; Apple private relay if chosen); trial and renewal notices by email (`subscription-terms.md`). Sign-in codes and links come from Supabase Auth: `sb.auth.signInWithOtp` (`apps/mobile/src/lib/auth/email.ts:35`) and `verifyOtp` (`email.ts:43`). Add "Developer's Advertising or Marketing" only if marketing email is ever sent | Confirm |
| Contact Info | Phone, Physical Address, Other | No | | | Not requested. Print shipping is out of v1 (K-32) | |
| Health & Fitness | Health, Fitness | No | | | No structured health field. Health mentioned in free text is free-form content | |
| Financial Info | all | No | | | Apple handles payment; we hold no card data | |
| Location | Precise, Coarse | No | | | Not requested: no `expo-location` or location API in `apps/mobile/package.json` or `apps/mobile/src` (searched 11 Nov 2026). The app has no PostHog or Sentry. Whether Supabase or Cloudflare keep request IP addresses, and for how long, is UNVERIFIED (hosting dashboards, not in the repo); counsel question on IP addresses (Q12) | Confirm |
| Sensitive Info | Sensitive Info | Yes | Yes | App Functionality | `children.due_date`: Apple lists pregnancy or childbirth information here. No biometric data is collected (no voiceprints or face templates, LEGAL-REQ-019) | OPEN-24: remove if due-date mode does not ship |
| Contacts | Contacts | No | | | Never requested | |
| User Content | Photos or Videos | Yes **only if photo attach ships** | Yes | App Functionality | Bucket `entry-photos`, `entries.photo_path`, `children.photo_path` exist in migrations; the mobile app has no photo picker today | OPEN-27 |
| User Content | Audio Data | **No for Build 12** (backup off); Yes only if recordings upload | Yes | App Functionality | The migrations contain no audio bucket or audio column (`entries.audio_kept_on_device` only). D-032 (shared voice, Plus backup) was "recommended, needs founder OK, wait"; backup is now free (D-111 item 6, D-124 item 5). On-device-only transcription does not count as collection | OPEN-14 |
| User Content | Other User Content | Yes | Yes | App Functionality | `entries.final_text`, `raw_transcript`, `machine_edits`, `stt_meta`, `prompt_key`; `entry_versions`; `dictionary_terms`; child name, nickname, birthday (`children`); `child_invites.signs_as`; family relationships (`child_members`) | Confirm |
| User Content | Emails or Text Messages, Customer Support, Gameplay | No | | | Support is by email outside the app | |
| Browsing / Search History | all | No | | | In-app search is local | |
| Identifiers | User ID | Yes | Yes | App Functionality | Supabase user id used across `profiles`, `child_members`, `entries.author_id`, `audit_events` | Confirm |
| Identifiers | Device ID | **No (Build 12)** | | | No IDFA and no IDFV read: no `AdSupport`, `identifierForVendor`, `getIosIdForVendor` or `applicationId` call in `apps/mobile/src`, `apps/mobile/modules` or `apps/mobile/app.config.ts` (searched 11 Nov 2026). `expo-device` is used only for total memory to pick a speech model tier (`apps/mobile/src/lib/models/speech-packs.ts:118`) and is not sent. The per-install backup id (`backup_devices`) exists only behind `capabilities.backup` (`apps/mobile/src/lib/capabilities.ts:214`, `apps/mobile/src/lib/backup/gate.ts:20`), off in every `eas.json` profile. `app_account_tokens` is a random per-account UUID, not a device id | Confirm |
| Purchases | Purchase History | **No for Build 12** (Yes only once the status report is switched on) | Yes if it ships | App Functionality (Analytics only if counsel reads server aggregates that way) | Build 12 has `EXPO_PUBLIC_STATUS_REPORT` off, so no purchase data reaches our servers from the app: the only senders load behind `capabilities.statusReport` (`apps/mobile/src/lib/capabilities.ts:218`, which also needs the server switch, line 186; `apps/mobile/src/lib/billing/actions.ts:68`, `apps/mobile/src/lib/billing/plan-store.ts:170`) and Apple processes the payment itself; the tables `store_subscriptions` (product id, status, expiry, environment, storefront, original transaction id), `app_account_tokens` and `store_notifications` apply only when the status report ships | Confirm |
| Usage Data | Product Interaction | **No (Build 12)** | | | Build 12 profile: analytics off (`EXPO_PUBLIC_ANALYTICS` is `off` in every `apps/mobile/eas.json` profile, D-095) and `apps/mobile` has no analytics or crash SDK (no PostHog, no Sentry in `package.json` or source). Nothing is collected. Returns as Yes, opt-in only if analytics is turned on in a later build (catalogue in `packages/analytics`, D-003; redo this row then) | |
| Usage Data | Advertising Data, Other Usage Data | No | | | | |
| Diagnostics | Crash Data | **No (Build 12)** | | | No crash reporter in the build (no Sentry). Returns only if a crash SDK is added in a later build, with its own opt-in and a redo of this row | |
| Diagnostics | Performance Data | **No (Build 12)** | | | Build 12 profile: analytics off (`EXPO_PUBLIC_ANALYTICS` is `off` in every `apps/mobile/eas.json` profile, D-095) and `apps/mobile` has no analytics or crash SDK (no PostHog, no Sentry in `package.json` or source). No `app_cold_start` bucket or performance reporting leaves the device | |
| Diagnostics | Other Diagnostic Data | **No (Build 12)** | | | Status report is off (D-160) and analytics is off, so no download or sync outcome events are sent | |
| Other Data | Other Data Types | **Yes** (added by this pack) | Yes | App Functionality | `policy_acceptances` stores document, version, method, `app_version`, `platform`, `locale` per profile (no IP, no user agent, per the table comment); `deletion_requests`, `audit_events` hold user-linked action records. The 1.2.1 draft did not list these | Counsel to confirm the type |
| Surroundings, Body | all | No | | | | |

Expected label summary for Profile B in Build 12: Data Used to Track You: none. Data Linked to You: Contact Info, User Content, Identifiers, Sensitive Info, and Other Data only if counsel says so (open question above). Purchases is not on the Build 12 label; it returns with the status report. Data Not Linked to You: none for Build 12 (Usage Data and Diagnostics are No: analytics off, no crash reporter). "Other Data Types" stays an open counsel question.

### What stays on the device and is not on the label

Safety tiers (computed and stored on the phone only; the server table `safety_events` is dropped by migration `20261002020000`, PRD K-06). The 18+ answer. Reading size, theme, reminder choices.

### Differences from `docs/legal/app-store-privacy-labels.md` 1.2.1

1. Audio and Photos are conditional on features that the schema and app do not yet have.
2. "Other Data Types" added for consent and deletion records.
3. Email: the 1.2.1 draft lists "trial and renewal notices"; no email sender exists in the repo for the app (Resend is wired only to the website list). Confirm who sends them (OPEN-13).
4. Safety: until migration 4 is applied, the live core schema still has `safety_events` (tier and time only, no text). Apply migration 4 before launch (OPEN-26).

### 3.5 Build 12 evidence: what the code does with servers on (checked 11 Nov 2026 on `develop` 18ff63746)

Paths are under `apps/mobile` unless stated. "Off" means the build value in `eas.json` `production` after #698.

| Claim | Evidence | Label effect |
|---|---|---|
| Nothing reaches Supabase unless the server switch is on | `src/lib/supabase/client.ts:97` returns null when `serverFeaturesEnabled()` is false (`src/lib/capabilities.ts:181`) | Servers on is what makes Profile B apply |
| Backup, status report need their own flag on top of the switch | `src/lib/capabilities.ts:186` (`buildFlagEnabled`), `:214` backup, `:218` statusReport; `eas.json:62,63` both `off`; `src/lib/backup/gate.ts:20` loads nothing when off | Audio Data No, Device ID No, Purchase History No |
| Letters and child profile sync to Supabase | `src/lib/sync/engine.ts:182` (`sync_push`), `:237` (`sync_pull`); child fields `name`, `nickname`, `date_of_birth`, `due_date` in `src/lib/sync/types.ts:328-332`; entry fields incl. `final_text` and `raw_transcript` in the same file and `src/lib/sync/merge.ts:270` | Other User Content Yes; Sensitive Info Yes (due date) |
| Audio file is not uploaded | Only upload path is `src/lib/backup/runtime.ts:332` (`entry-audio` storage), behind the backup gate; the sync entry shape carries the flag `audio_kept_on_device` (`src/lib/sync/types.ts:77`), no audio file or path, and `audio_sha256` and `audio_bytes` appear in `src/lib/sync/merge.ts` only as local columns | Audio Data No. UNVERIFIED: the code that builds `entry.upsert` ops was not traced to confirm no audio hash or byte count is in the payload |
| Transcription is on the phone | `whisper.rn` in `package.json`; no `fetch` in `src/lib/transcribe-plan.ts`, `src/lib/transcribe-prompt.ts`, `src/lib/models/speech-packs.ts` (searched). Model files are downloaded from `huggingface.co` (`src/lib/models/catalog.ts:108`) and `packs.earlyletters.app` (`src/lib/packs/expo-adapter.ts:206`, `src/lib/remote/expo-adapter.ts:52`) | Download requests carry an IP address and a file name only; not a data type (Q12) |
| Sign-in sends name and email | Apple: `src/lib/auth/apple.ts:55` (`signInWithIdToken`), name read at `:62`; Apple refresh token sent to the `apple-token` function at `:121` (stored encrypted, `ops.apple_tokens`, per `supabase/functions/apple-token/index.ts` header); email code or link `src/lib/auth/email.ts:35,43` | Name Yes, Email Address Yes, User ID Yes |
| Google sign-in is offered only when both client ids are set | `src/lib/auth/google.ts:22,23,38` read `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`; neither is in `eas.json` `production` | UNVERIFIED whether the EAS `production` environment sets them. If it does, Google's SDK may collect data of its own that must be declared; read its manifest and Google's disclosure first |
| Consent record carries app version, platform, locale | `src/lib/auth/consent.ts:104-117` (`record_policy_act`) | Other Data Types, open counsel question above |
| Every Supabase call carries an app version header and a request id | `src/lib/supabase/client.ts:86-87` | UNVERIFIED whether the server keeps these with the user id; if so counsel decides whether it is Other Diagnostic Data |
| No analytics, no crash reporter | `src/lib/analytics/index.ts:41` (no key, no-op provider unless `EXPO_PUBLIC_ANALYTICS` is `on`); `src/lib/capabilities.ts:161`; `eas.json:64` `off`; no `posthog` or `sentry` in `package.json` | Usage Data No, Diagnostics No |
| No push tokens, no photos, no contacts, no location | No `getExpoPushToken`, `getDevicePushToken`, `ImagePicker`, `expo-contacts`, `expo-location` in `src` or `package.json`; reminders are local (`src/lib/reminders/scheduler.ts:25`) | Other Data (push), Photos, Contacts, Location No |
| Privacy manifest matches this table | `src/lib/privacy-manifest.ts:138-157` (rows) and `:166-175` (`collectedDataTypes`): with servers on and backup and status report off, exactly Name, Email Address, Sensitive Info, Other User Content, User ID; all linked, none tracking, App Functionality | Label and manifest agree except the open Other Data question |

Not verified, and needed before submission: the Supabase and Cloudflare request-log retention and what they hold (Q12); the Supabase Auth mail sender and what it logs (`supabase/config.toml:77-82` has custom SMTP only as a comment, so the production dashboard is the source); the real device privacy report from a Build 12 archive (Xcode, Product, Archive, Generate Privacy Report); a proxy capture of a Build 12 run listing every host contacted.

### Maintaining the label

Re-run this page whenever a dependency, SDK, table, bucket or permission is added. The checklist in `docs/legal/app-store-privacy-labels.md` section 5 stays in force. Keep `NSPrivacyCollectedDataTypes` in the privacy manifest identical to the Profile B table above (for Build 12: the five types, with Purchase History, Device ID and Audio Data absent). Today the Other Data row and the manifest differ; that is the open question above.
