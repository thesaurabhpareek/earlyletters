# Fact check: pictures and the server-feature flags

Read-only check of `origin/develop` at fdf34a58 (21 Nov 2026) and the photo slice branches. Marks: VERIFIED (read in the file named) or UNVERIFIED.

## 1. Does any current build upload or store a copy of a person's pictures?

Short answer: no build uploads a picture. No build stores one either, because every code path that could write one is unreachable in a store build. VERIFIED, with two cautions.

| Claim | Mark | Evidence |
|---|---|---|
| Only slice 3a (#835) is on develop. #836 to #840 are open, unmerged, stacked on each other. | VERIFIED | GitHub REST: #835 closed merged=true into develop; #836 open (base develop); #837 base feat/mobile-photo-3b-stored-copy; #838 base feat/mobile-photo-4a-pending; #839 base feat/mobile-photo-4-capture; #840 base feat/mobile-photo-4c-letter-page, all open merged=false. |
| What #835 put on develop is a local table and a sweep, with no picker or screen. | VERIFIED | `apps/mobile/src/lib/db/migrations.ts:425-445` (local migration 11, `entry_media`); `apps/mobile/src/lib/photos/entry-media.ts:1-6` ("Nothing here is queued for sync, and pull never touches this table (NS-01-R15)"). No file under `apps/mobile/src/app` or `src/components` imports `lib/photos` or `scribe-photo` on develop (grep, empty). |
| No upload path exists in the photo code, on develop or on the tip of the stack (feat/mobile-photo-5-lens). | VERIFIED | grep for `storage.from`, `.upload(`, `entry-photos`, `photo_path`, `uploadAsync`, `fetch(`, `supabase`, `outbox` in `apps/mobile/src/lib/photos` and `modules/scribe-photo`: only hit is `files.ts:84` throwing `photo_path_refused`. Only `src/lib/backup/runtime.ts:334` touches Storage, and that is the audio bucket `BACKUP_BUCKET`. |
| The picture file would live on the phone only. | VERIFIED | `apps/mobile/src/lib/photos/files.ts:1-12`: `Library/Application Support/photos/<media_id>.jpg`. |
| The server refuses a picture even from a crafted client. | VERIFIED as written, UNVERIFIED as applied | `supabase/migrations/20261110000000_photo_bucket_closed.sql:1-8` drops the insert and update policies on `entry-photos` and adds trigger `entries_photo_closed`. Line 7 of that file says "PENDING: not yet applied", needs the founder's `approve-migration` label. Until applied, the earlier policies (`entry_photos_author_insert` and `_update`, 20260930000000 and restatements) still let an author upload to `entry-photos` and set `entries.photo_path` (lines 3 to 6 of the same file). No build offers this; only a hand-made client could. Whether it has been applied to scribe-prod is UNVERIFIED (not visible from the repo). |
| The photo UI is behind `EXPO_PUBLIC_PHOTOS`, off by default, and no store profile may turn it on. | VERIFIED | `apps/mobile/src/lib/photos/flag.ts:1-8` (on the stack branch, not yet on develop); `apps/mobile/eas.json` has no `EXPO_PUBLIC_PHOTOS` in any profile (grep, empty); `apps/mobile/test/store-flags.test.ts:11-14` fails `npm test` if preview, testflight or production sets it; `apps/mobile/scripts/preflight-testflight.mjs:227` and `:599-600` repeat the rule. The flag is only used by the test fixture's `development` profile (`store-flags.test.ts:19`), not by the real `eas.json`. |
| Which builds can store a picture today? | VERIFIED | None. A build needs both the flag on and the code of #836 to #840 merged. develop has neither the UI nor the flag file. The stack branch could store a picture locally only in a `development` build started with `EXPO_PUBLIC_PHOTOS=on` in the shell, which is not in `eas.json` (UNVERIFIED for any developer's local Metro). |
| Privacy Policy 3.0.0 says photos are not collected. | VERIFIED, and true today | `docs/legal/privacy-policy.md:45` ("We do not collect your location ..., contacts, photos, ..."). True for every current build. It will stop being accurate in meaning the day #836 to #840 ship with the flag on, because the picture is a stored copy on the phone (not collected by us, but see next row). |
| App Store label for Photos or Videos. | VERIFIED | `docs/legal/app-store-privacy-labels.md:54` says No, "No photo feature in v1.0"; `:117` and `:127` repeat it. Correct today. When the feature ships it stays "not collected" only if nothing leaves the phone. |

Cautions for the Moments work:
1. Phone backup. `files.ts:3-4` says the picture folder is NOT excluded from the iPhone backup (NX-39 F9, ADR 0028 D1 as accepted in CR-62). So the copy can travel to the person's own iCloud or computer backup. That is Apple's backup of their own phone, not ours, and not a "collection" under Apple's definition, but the policy sentence "we do not collect photos" needs a line about it before the flag goes on. UNVERIFIED whether `legal` has ruled on that wording.
2. The "stored copy" in slice 3b is a re-encoded, location-stripped JPEG made on the phone (`files.ts:5-9`, the picker cache holds the original with location until swept). That is a copy of the person's picture on their own phone. If Moments uses "copy" to mean a copy the product keeps, it does keep one locally, and only locally.
3. The `entry-photos` bucket and `entries.photo_path` still exist in the schema; `purge-worker/lib/buckets.ts` and the deletion specs still sweep them. Existing objects: expected zero (migration header: "expected zero, data-and-sync Q8"), UNVERIFIED against the live database.

## 2. Server-feature flags in `apps/mobile/eas.json`

Verified by reading `apps/mobile/eas.json` on develop (last changed 205527e9, 10 Nov 2026, #698).

| Profile | SERVER_FEATURES | BACKUP | STATUS_REPORT | ANALYTICS | ACCOUNT_DELETION | Distribution |
|---|---|---|---|---|---|---|
| development | off | off | off | off | on | internal |
| e2e | off | off | off | off | on | internal (simulator) |
| preview | **on** | off | off | off | not set | store (ascAppId 6829163677, group Family) |
| production | **on** | off | off | off | on | store (ascAppId 6829377245) |
| testflight | off | off | off | off | not set | store (ascAppId 6829163677, group Family) |

Does the first store submission have server features on or off? ON. VERIFIED from the repo: the first store build is the `production` profile (Build 12), and that profile sets `EXPO_PUBLIC_SERVER_FEATURES` to `on`.
- `docs/legal/app-store-privacy-labels.md:135` (2.2.0): "the first store build is Build 12 (`production`, servers on, sign-in required, backup and status report off)".
- `docs/ops/PRODUCTION_VARIABLES.md:17`: `on`, "Changed from `off` by this PR".
- `docs/DECISIONS.md:675` (D-100): release profiles set it `on`.
- Backup, status report and analytics are off there too.

So X6 (on) matches the code. X1, X3 and X5 (off) do not match `production`; they match only the `testflight` profile (Build 1) and `development`/`e2e`. I could not open X1, X3, X5 or X6 as source documents by those labels (the repo uses X1 for the founder's feature order, closed question X1, and X6 for BL-962), so which statement each of them made is UNVERIFIED. The comparison above is against the claims as you relayed them.

Stale text that causes the confusion, all VERIFIED:
- `docs/legal/privacy-policy.md:21` still says "Build 1 and the first App Store build. Servers are off." That contradicts `eas.json` production and the label doc. This is a policy-versus-code mismatch for `legal` and the founder.
- `apps/mobile/src/lib/capabilities.ts:7-12` says "only `preview` ... is on; the store profiles stay off until the R-17 security gate passes". The same file's first lines (D-100) and `eas.json` production say on. The comment is out of date.
- `docs/release/TESTFLIGHT.md:162-163` shows an off-to-on diff for the same flag.

Not verifiable from the repo: whether the first submission has actually been made, what an EAS environment variable on expo.dev overrides, and whether #698 ("draft, do not merge" in its title) was a deliberate merge. The file on develop has it on regardless. UNVERIFIED.
