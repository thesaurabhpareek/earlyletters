---
title: Legal benchmark, v1.0 texts (option B)
version: 1.1.0
last_updated: 2026-10-16
owner: founder
---

# Benchmark: claims of law, platform and product fact, checked against sources

Drafting support, not legal advice. Each row is a fact the drafts on this branch rely on, the source, the date it was read, and whether it was verified. **Yes** means the page or file was opened on the date shown and the quoted words are there. **Secondary** means a law firm, vendor summary or another agent's read. **Unverified** means the source could not be opened or did not answer. Nothing is marked Yes that was not read. Counsel decides what each fact means for us (`COUNSEL_PACKET.md` 1.1.0).

**Blocked on 15 Oct 2026.** The network proxy for this session refused (no response) every request to: app.leg.wa.gov, law.justia.com, ftc.gov, supabase.com, resend.com, vercel.com, cloudflare.com and posthog.com. Apple's developer.apple.com pages loaded. support.apple.com was blocked for the coordinator's research pass the same day. So every statute, regulator page and vendor contract below is Unverified or Secondary for this pass, even where an earlier draft read it on 2 or 3 Oct.

## 1. Apple platform facts

| # | Claim in our texts | Source | Read | Verified |
|---|---|---|---|---|
| 1 | "Collect" means "transmitting data off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time"; data processed only on the device is not collected (labels 1.4.0 section 1) | https://developer.apple.com/app-store/app-privacy-details/ | 2026-10-15 | **Yes** |
| 2 | Apple suggests "Other User Content" for free-form text and "Audio Data" for voice recordings; Audio Data is "The user's voice or sound recordings" (labels 3.2) | same | 2026-10-15 | **Yes** |
| 3 | User ID: "Such as screen name, handle, account ID, assigned user ID, customer number, or other user- or account-level ID"; Purchase History: "An account's or individual's purchases or purchase tendencies"; Sensitive Info includes "pregnancy or childbirth information" (labels 3.2) | same | 2026-10-15 | **Yes**. The Device ID definition was cut off in the text we extracted, so its exact words are Unverified |
| 4 | Data is linked unless direct identifiers (such as user ID or name) are removed before collection and never re-linked; tracking means linking with third-party data for ads or sharing with a data broker | same | 2026-10-15 | **Yes** |
| 5 | Apps that support account creation must also offer account deletion within the app (Guideline 5.1.1(v)) | https://developer.apple.com/app-store/review/guidelines/ (page says "Last Updated: June 8, 2026") | 2026-10-15 | **Yes** |
| 6 | Apps that "require sensitive user information should be submitted by a legal entity that provides the services, and not by an individual developer" (5.1.1(ix); COUNSEL_PACKET Q47) | same | 2026-10-15 | **Yes** |
| 7 | Apps must "clearly disclose where personal data will be shared with third parties, including with third-party AI, and obtain explicit permission before doing so" (5.1.2(i)); v1.0 sends no content to any AI service | same | 2026-10-15 | **Yes** |
| 8 | Before asking a customer to subscribe, "clearly describe what the user will get for the price" (3.1.2(c)) | same | 2026-10-15 | **Yes** |
| 9 | Apps may not use their own mechanisms, such as license keys, to unlock content (3.1.1); basis for Apple offer codes instead of codes of our own | same | 2026-10-15 | **Yes** |
| 10 | No names of other mobile platforms in the app or metadata (2.3.10) | same | 2026-10-15 | **Yes** |
| 11 | One introductory offer per subscription group per person; switching plans does not earn a second trial (Terms 8.2; Subscription Terms "Plans") | https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-introductory-offers-for-auto-renewable-subscriptions and https://developer.apple.com/app-store/subscriptions/ | 2026-10-15 | **Yes** for "one introductory offer per subscription group". The upgrade example ("aren't eligible for the second offer") is Secondary: quoted in the coordinator's Apple facts of 15 Oct, not re-extracted here |
| 12 | For a free trial, "clearly indicate how long the free trial lasts and the price billed once the free trial is over" | https://developer.apple.com/app-store/subscriptions/ | 2026-10-15 | **Yes** |
| 13 | On a price increase, Apple "automatically provides push notifications, email, and in-app messaging to let subscribers know about the upcoming change" (Subscription Terms "Dates and reminders") | same | 2026-10-15 | **Yes** |
| 14 | Apple sends a reminder before a trial converts | none found | 2026-10-15 | **Unverified**, and not claimed anywhere in the drafts. The coordinator's read found no developer page saying so; support.apple.com was blocked |
| 15 | Once Family Sharing is turned on for an in-app purchase, the developer "can't turn it off"; users can turn it off in their subscription settings; up to "five additional family members" (Subscription Terms "Family Sharing") | https://developer.apple.com/help/app-store-connect/configure-in-app-purchase-settings/turn-on-family-sharing-for-in-app-purchases | 2026-10-15 | **Yes** |
| 16 | An offer code can be set to "prevent auto-renewal, ensuring customers receive a commitment-free trial subscription"; "Customers are limited to redeeming one code per offer" (Subscription Terms "Offer codes") | https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-subscription-offer-codes | 2026-10-15 | **Yes**. Whether a 6-month code duration exists is Unverified |
| 17 | Schedule 2 section 3.8(b): "Links to Your Privacy Policy and Terms of Use must be accessible within Your Licensed Application"; Schedules 2 and 3 "last updated October 13, 2026" | https://developer.apple.com/support/terms/apple-developer-program-license-agreement/ | 2026-10-15 | **Yes** |
| 18 | $4.99 monthly and $49.99 yearly are selectable US price points | Apple's US price table (via the coordinator's read) | 2026-10-15 | **Secondary**: inferred from published ranges, no enumerated list; confirm in App Store Connect |
| 19 | Whether Apple's subscription view by itself meets every disclosure rule | Apple StoreKit documentation (coordinator's read) | 2026-10-15 | **Unverified**: Apple does not say so; check on a device |
| 20 | Privacy manifest required-reason codes (UserDefaults CA92.1, file timestamps C617.1, boot time 35F9.1, disk space E174.1) | https://developer.apple.com/documentation/bundleresources/privacy-manifest-files and `describing-use-of-required-reason-api` | 2026-10-15 | **Unverified**: both pages loaded but are rendered by JavaScript and returned no body text |
| 21 | iPhone backup (iCloud or a computer) includes app data such as recordings (Privacy 2; Terms 7) | Apple Support | not opened | **Unverified**; also PRD V2 F08 assumption A1, checked on a device in DL-03 |

## 2. Law (all Unverified or Secondary in this pass)

| # | Claim | Source | Last read | Verified |
|---|---|---|---|---|
| 22 | California automatic renewal law 17602 (as amended by AB 2863): notice before trials over 31 days, before renewal of terms of a year or more, an annual reminder, consent records, a retained acknowledgment | Cal. Bus. & Prof. Code 17602 via Justia; `memos/q-003-subscription-notices.md` | 3 Oct 2026 (memo); blocked 15 Oct | **Unverified** in this pass (V on 3 Oct per the memo) |
| 23 | New York GBL 527-a, Virginia 59.1-207.46, Utah 13-70, Massachusetts 940 CMR 38.00 notice windows; the NYC rule; ROSCA | memo sources | 3 Oct 2026 | **Unverified** in this pass |
| 24 | Washington MHMDA: consumer health data includes reproductive health; a separate consumer health data policy linked from the homepage, including the app's download page; biometric data examples include voice recordings tied to an identifier | RCW 19.373 | 2 Oct 2026 (earlier drafts); blocked 15 Oct | **Unverified** in this pass |
| 25 | COPPA covers collection from children under 13 or services directed to them; an adults-only app about a child is outside it | FTC COPPA FAQ | 2 Oct 2026; blocked 15 Oct | **Unverified** in this pass |
| 26 | CCPA thresholds; sensitive personal information includes account log-in with a security code and data of consumers under 16 | CPPA, Cal. Civ. Code 1798.140 | 2 Oct 2026 (secondary) | **Unverified** |
| 27 | Texas SB 2420 and California AB 1043 age-signal duties; AB 1043 from 1 Jan 2027 | Kelley Drye FAQ | 3 Oct 2026 (secondary) | **Secondary** |
| 28 | CAN-SPAM needs a postal address in commercial email | FTC guide | not opened | **Unverified**; asked as COUNSEL_PACKET Q34 |
| 29 | Fiduciary access to digital assets (California RUFADAA) | statute | not opened | **Unverified**; asked as Q49 |

## 3. Vendor facts (all Unverified in this pass)

| # | Claim | Source | Last read | Verified |
|---|---|---|---|---|
| 30 | Supabase DPA names Supabase Pte. Ltd.; Supabase will not train on customer data; Pro keeps 7 days of daily backups | supabase.com/legal/dpa, /terms, docs | 2 Oct 2026; blocked 15 Oct | **Unverified** in this pass |
| 31 | Resend keeps sent-message data for 30 days | `docs/ops/runbooks/incident-notification.md`; resend.com | repo; resend.com blocked | **Secondary** (repo runbook) |
| 32 | Cloudflare Customer DPA v6.4 limits processing to providing the services | cloudflare.com | 3 Oct 2026; blocked 15 Oct | **Unverified** in this pass |
| 33 | Vercel paid Pro is opted out of AI training by default | vercel.com changelog | 2 Oct 2026; blocked 15 Oct | **Unverified** in this pass |
| 34 | Supabase function secrets are shared by every function in a project and not across projects, so a separate project isolates the escrow key | PRD V2 F08 assumption A6 | not opened | **Unverified**; WP-F08-B4 checks it |

## 4. Product facts, checked in the code (origin/develop at 4183844 and 56ec5b5, 15 Oct 2026; re-checked 16 Oct 2026 at develop ef79bd3, `feat/backup-server` ad222eb, `chore/pack-host-ios17` e55c721 (PR #126), `feat/db-v1-gate` 3d2d440 (PR #140), `feat/platform-v1-contracts` feea25f (PR #138))

| Claim | Where checked | Verified |
|---|---|---|
| Every `eas.json` profile still sets `EXPO_PUBLIC_SERVER_FEATURES` to off and `EXPO_PUBLIC_ANALYTICS` to off | `apps/mobile/eas.json` | **Yes**. The drafts describe the option B build (server features on); they must not be published while a store build has the switch off (COUNSEL_PACKET Q44; PRD V2 T19, T20) |
| No analytics client is constructed while `EXPO_PUBLIC_ANALYTICS` is off (D-095) | PR #118 on develop | **Yes** for the switch in `eas.json`; the code path was not re-read |
| Plan reminders and the purchase confirmation with Save a copy are built, described as a courtesy, with no price in app copy | `packages/content/src/features/billing.en.ts` (`reminders`, `note`, `confirmation`); `apps/mobile/src/lib/billing/plan-reminders.logic.ts`; rules test (PR #121) | **Yes** |
| Plus prices are $4.99 a month and $49.99 a year | `packages/content/src/pricing.ts`; `apps/mobile/storekit/EarlyLetters.storekit`; `apps/web/src/content/pricing.ts` on main (69299f8) | **Yes** |
| Recording backup, the escrow function, `audio_blobs`, `child_keys`, the status report endpoint and the reminder email scheduler are not built on develop | `supabase/migrations`, `supabase/functions`, `packages/api` | **Yes** (searched; none found on develop). 16 Oct: the backup server is on `feat/backup-server`; the phone side is a contract only (`packages/api/src/server/recovery-key.ts`); `supabase/functions/subscription-status/handler.ts` on `feat/platform-v1-contracts` is a shell; no reminder email sender anywhere. The drafts say backup is not available yet and leave out the status report and reminder emails |
| The microphone purpose string ends "Your recordings stay on this phone." | `packages/content/src/permissions.en.ts` | **Yes**; labels 1.4.0 asks the content owner to drop that sentence |
| The website's delete page links to `/privacy#14-your-choices-and-rights` | `apps/web/src/lib/legal/delete-account-copy.ts` on main | **Yes**. The short Privacy Policy 2.1.0 moves rights to section 10, so `delete-account-page.md` gives `/privacy#10-your-rights`; the website owner changes the link with the copy |
| Supabase is the database and sign-in service | `@supabase/supabase-js` in `apps/mobile/src/lib/auth/*` (develop 56ec5b5) | **Yes** |
| Resend sends our emails | `supabase/functions/purge-worker/lib/resend.ts` | **Yes** |
| Cloudflare R2 delivers the app's settings and its language and speech files | 15 Oct: searched `apps/mobile/src`, `packages`, `supabase/functions` on develop and `feat/backup-server`: no code. 16 Oct: PR #126 at e55c721 sets `EXPO_PUBLIC_DOCS_BASE_URL=https://packs.earlyletters.app` in every `eas.json` profile, so the signed remote config, pack manifest and content bundle (`apps/mobile/src/lib/remote/index.ts`, fetched by `startRemote` on every launch) come from it, and `PACKS_ORIGIN`/`SELF_HOST_BASE` in `catalog.ts` point self-hosted speech files at it (R2 per the comment and D-097) | **Yes, on the unmerged PR #126**; not on develop. The drafts name R2 for this, so PR #163 merges after #126 |
| Encrypted recording backups are stored in Supabase Storage | `supabase/migrations/20261015230000_backup_server.sql` on `feat/backup-server` at 7a0f45d and again at ad222eb (`insert into storage.buckets ... 'entry-audio'`, policies on `storage.objects`); `docs/ops/BACKUP_RUNBOOK.md` on that branch | **Yes**, on an unmerged branch. The founder's 15 Oct list named R2 for backups; the texts follow the code |
| A restore waits 72 hours when the account has another enrolled device and 24 hours when it has none; only a device enrolled at least 7 days before the request may approve; release is refused unless a log row exists; the recovery key is opened for `restore`, `rotation` or `legal`; emails go on request, release and rotation | migration header, `escrow_long_hold`, `backup_approve_request`, `escrow_set_request_state`, the `escrow_unwraps.reason` check; `packages/content/src/emails/backup.en.ts` (ad222eb) | **Yes**, on the branch. The 7-day rule is decided (D-108, 15 Oct). A `legal` use has no code path yet (runbook: "not built in this release") |
| Hugging Face serves upstream model files | `catalog.ts` builds `https://huggingface.co/<repo>/resolve/<revision>/<file>` | **Yes**; the published texts name it |
| Sign in with Google | `apps/mobile/src/lib/auth/google.ts`; the button shows only when `EXPO_PUBLIC_GOOGLE_*` client IDs are set | **Yes, conditional**. The published texts name only Sign in with Apple and the email link; a build that sets the Google IDs needs one added line |
| The escrow private key is a function secret in the separate project `scribe-escrow`, and on two sealed paper copies; anyone with it plus a copy of the main database and bucket could open recordings with no log row or email | `supabase/functions/escrow/config.ts`; `docs/ops/BACKUP_RUNBOOK.md` sections 1, 3 (K3, K6, quarterly seal check) and 4 at ad222eb | **Yes**, on the branch. Privacy Policy 4 says so |
| Push notifications are not built | `packages/api/src/server/push.ts` (payload shapes only); no push-send function and no token table on any branch above | **Yes** (per review A on PR #163; re-checked: no sender). The drafts mention no push |
| New-device sign-in notices are not built | no `account_sessions_seen` table and no sender on any branch above | **Yes**. The drafts do not mention them |
| No server of ours sees purchases; Plus is checked on the phone | `supabase/migrations/20261004000000_plus_on_device_only.sql` drops `store_subscriptions`, `store_notifications`, `app_account_tokens` | **Yes**. Privacy 2 and the Subscription Terms say our servers do not receive purchases |
| The co-parent invite email subject names the inviter | `packages/content/src/emails/family.en.ts` line 32: "{inviter} invited you to write together" | **Yes**. Privacy 5 says an invitation names the parent who sent it |
| Month reminders show the child's name only when names are on | `packages/content/src/features/reminders.en.ts` (`monthBodyNames` and `monthBodyNeutral`); `apps/mobile/src/lib/reminders/planner.ts` | **Yes** |
| The inviting parent can undo a join within 72 hours | `undo_parent_join` in `20261015020000_v1_gate_coparent_invites_undo.sql` on `feat/db-v1-gate` | **Yes**, on the unmerged branch (per review A; not re-read line by line) |
| Per-book choices are kept on the server | `child_member_prefs` (`include_in_reminders`, `celebrations_paused`, `notify_letters`) | **Yes** |
| After an under-18 answer the phone keeps only the time of the No | `ageGate.stoppedAt` (`apps/mobile/src/lib/age-gate.logic.ts`; D-026) | **Yes** |
| A sign-in within a day before account deletion is not required by the code | searched migrations and `apps/mobile/src/lib/account-deletion` | **Yes** (none found). The delete page no longer says so |
| The website marks an unsubscribed address in Resend; there is no scrambled suppression record | `apps/web/src/lib/notify/unsubscribe-handler.ts` on main | **Yes**. The drafts no longer promise a scrambled copy |
| The website loads Vercel Web Analytics only when `NEXT_PUBLIC_ANALYTICS=vercel` | `apps/web/src/lib/analytics/WebAnalytics.tsx` on main | **Yes**, conditional. Whether production sets it was not checked |
| No analytics or crash SDK runs | `posthog-react-native` is in `apps/mobile/package.json` but never constructed while `EXPO_PUBLIC_ANALYTICS` is off; no Sentry package | **Yes** |
| The separate health notice is loaded by the website | `apps/web/src/lib/legal/documents.ts` on main maps `/health-privacy` to `consumer-health-data-notice.md` | **Yes**. This branch removes that file; the website must drop or redirect `/health-privacy` before develop is next merged into main |

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.1.0 | 2026-10-16 | Rebuilt for option B. Apple rows re-read on 15 Oct 2026 with quotes; law and vendor rows marked Unverified because their sites were blocked in this session; product rows checked on develop at 4183844, including that the build switch is still off and backup, escrow and the status report are not built. 16 Oct: product rows re-checked against the branches named in section 4 after the two reviews of PR #163 (R2 in #126; backup at ad222eb; D-108; unbuilt push, new-device notices, status report; invite subject; undo; under-18 time). Version 1.0.0 of 4 Oct was drafted in PR #81 and never merged. |
