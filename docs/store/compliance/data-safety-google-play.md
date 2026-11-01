# Google Play Data safety answers

Android is not part of v1.0 (D-013: "US App Store first, iOS only at launch"), and the Android side is unbuilt (`model-files.ts` TODO for `noBackupFilesDir`; no Android `ScribeFiles`). This page is prepared so the form is ready; confirm scope first (OPEN-20). The profile logic is the same as in `privacy-labels-apple.md`: Profile A is today's local-only code, Profile B is v1.0 as designed (OPEN-01). Source for Google's rules: https://support.google.com/googleplay/android-developer/answer/10787469 (as cited in `docs/legal/app-store-privacy-labels.md` [R4]); the exact form wording must be read in Play Console.

## 1. Profile A (local-only)

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **No** |
| Data deletion section | Not applicable: no account is created, and Google's policy exempts accounts created and operated offline (https://support.google.com/googleplay/android-developer/answer/13327111). Still enter the Privacy Policy URL (OPEN-02) |
| Security practices | "Data is encrypted in transit": not applicable with no transmission. Leave unselected rather than claim it |

Basis: no network code and no sign-in in the app (see `README.md` capability table). Re-verify the merged Android manifest after prebuild; the `INTERNET` permission that Expo adds by default does not mean data is sent (OPEN-20).

## 2. Profile B (v1.0 as designed)

### 2.1 Overview questions

| Question | Answer | Basis |
|---|---|---|
| Does your app collect or share any of the required user data types? | Yes | |
| Is all of the user data collected by your app encrypted in transit? | Yes | TLS to Supabase and PostHog/Sentry; confirm the speech model download is HTTPS (D-046) |
| Do you provide a way for users to request that their data be deleted? | Yes | In-app Settings, Data, Delete account (migration `request_account_deletion`), plus a web page (OPEN-05). See `data-and-account-deletion.md` |
| Data deletion web URL | OPEN-05 | `/delete-account` does not exist yet (D-042) |
| Independent security review | No | Optional |
| Committed to the Play Families Policy | No | Adults only, not in the Families program (OPEN-23) |
| Data shared with third parties | **No** | Every transfer is to a service provider acting for us (Supabase, PostHog, Sentry, Resend, Apple/Google billing). Letters shown to family members the parent invited are user-directed, not developer sharing |

### 2.2 Data types

"Ephemeral" means processed only in memory and not retained. "Required or optional": optional if the app works without the user providing it.

| Play category | Data type | Collected | Shared | Required / optional | Purposes | Basis |
|---|---|---|---|---|---|---|
| Personal info | Name | Yes | No | Required (signature on letters, "what your child calls you") | App functionality, Account management | `profiles.display_name`, `signs_as` |
| Personal info | Email address | Yes | No | Required to sign in | Account management, App functionality | Supabase Auth; notices about trial and renewal (OPEN-13 for who sends them) |
| Personal info | User IDs | Yes | No | Required to sign in | Account management, App functionality | Supabase user id |
| Personal info | Other info | Yes | No | Required (child's birthday or due date) | App functionality | `children.date_of_birth`, `due_date` |
| Health and fitness | Health info | Yes, **only if due-date mode ships** | No | Optional | App functionality | `children.due_date` treated as health data (PRD K-25) (OPEN-24, OPEN-22) |
| Financial info | Purchase history | Yes | No | Optional (only if the person subscribes) | App functionality, Analytics | `store_subscriptions`, `app_account_tokens` |
| Photos and videos | Photos | Yes, **only if photo attach ships** | No | Optional | App functionality | `entry-photos` bucket (OPEN-27) |
| Audio | Voice or sound recordings | Yes, **only if recordings upload** | No | Optional | App functionality | No audio bucket in migrations yet (OPEN-14). Transcription done in memory on a server, if offered, is ephemeral |
| App activity | Other user-generated content | Yes | No | Required to sync | App functionality | Letters, edit history, dictionary words |
| App activity | App interactions | Yes, opt-in | No | Optional | Analytics | PostHog, opt-in (D-003) |
| App info and performance | Crash logs | Yes, opt-in | No | Optional | App functionality | Sentry (OPEN-13) |
| App info and performance | Diagnostics | Yes, opt-in | No | Optional | App functionality, Analytics | |
| Device or other IDs | Device or other IDs | Yes | No | Optional | Analytics, App functionality | Random analytics id; random `appAccountToken` is an app-scoped id. On Android there is no App Store token, so confirm the Play billing mapping when Android is built (ADR 0013 is Apple only) |
| Messages, Files and docs, Calendar, Contacts, Location, Web browsing, Race and ethnicity, Political or religious beliefs, Sexual orientation | all | No | | | | Export ZIP and PDF are made on the device and handed to the share sheet |

### 2.3 Things Google asks that this app must answer deliberately

- Photo and video permissions policy: not applicable if the Android photo picker is used (no `READ_MEDIA_*`). The mobile app has no picker today.
- Health apps declaration: answer after counsel decides whether a due date makes this a health feature (OPEN-22). It has no medical features.
- Financial features declaration: none (Google Play Billing for subscriptions is not a financial feature).
- Ads: none; no advertising id.
- Sensitive permissions: only `RECORD_AUDIO` (see `permissions.md`).
- Account deletion: needs the web link even though an in-app path exists.
