# Build 12 store copy sync check (10 Nov 2026)

Owner: content. Status: a check and proposals, for the founder and counsel. No string in `packages/content` or `apps/web` is changed by this file.

Sources read, all from git: PR #757 (head `4badc096b6c3419576408f81290e2387b38c2c70`, `packages/content/test/support/claims-ledger.ts` and `claims-capabilities.test.ts`), PR #735 (head `45ff115b74ef66aeb236166e7efe05e3119963f8`), `origin/develop` at `a46ae06f3`, `docs/legal/in-app-disclosures.md`, `apps/mobile/src/lib/permission-copy.ts`, `apps/mobile/eas.json`.

## 1. The Build 12 facts the lines are judged against

| Fact | Source | Effect on "stays on your phone" |
|---|---|---|
| Servers are ON in Build 12. Sign in and sync run. `eas.json` production on develop still says `EXPO_PUBLIC_SERVER_FEATURES=off`; the flip is the Build 12 cut. | `release/app-review.en.ts` header; `docs/ops/RELEASE.md` | Letters can leave the phone. |
| Letters sync to the account only after the sensitive data agreement; then they are kept on the phone and on our servers so they reach the person's other phones. | `in-app-disclosures.md` (sensitive data row); `en.settings...keptSynced` in #735 | "Your letters stay on your phone" is untrue for anyone who signs in and agrees. |
| Recording backup is OFF (`EXPO_PUBLIC_BACKUP=off`). Recordings are kept on the phone that made them. | `eas.json`; header of `build12-untrue-copy.test.ts` in #735 | "Recordings stay on this phone" is true of our servers, but see the next row. |
| The person's own iPhone backup (iCloud or a computer) copies the app's data, recordings included. | `in-app-disclosures.md` section 3 rows 23 and 43 | A recording is not only on the phone. Counsel's own rule: never say recordings "stay on this phone" in a string a person with backup on can see. |
| Export (letters, recordings, a PDF) and print move the words off the phone by the person's choice. | `store.en.ts` TAKE IT WITH YOU | Same: a flat "stays" is false of what the person chooses to do. |
| Co-parent surfaces are hidden in Build 12 (Family tab, invites). | header of `build12-untrue-copy.test.ts` | Not in these seven lines. See the side finding in section 6. |
| Sign-in is optional in the App Review notes ("Sign-in required" stays No). The brief for this task says "account-first". The two differ. | `app-review.en.ts`, `RELEASE.md` | Founder decision 1 below. |

The rule behind the failures is `STAYS_ON_PHONE_CLAIMS` in `claims-ledger.ts`: `stays? on (your|this) (iphone|phone)`, `nothing is sent to us`, `nothing leaves your (iphone|phone)`. The ledger calls these "never to be said" unless the claims registry holds the line with a counsel version. The registry is empty (`PROMISE_REGISTRY.length` is asserted 0), so every one of them is held in `STAYS_ON_PHONE_HELD` with a cap of 7.

## 2. The seven lines, plus the notification

Text is exact, from `origin/develop`.

| # | File and key | Exact current text | True or untrue in Build 12 |
|---|---|---|---|
| 1 | `packages/content/src/store.en.ts`, `storeListing.description`, section PRIVATE BY DEFAULT (sentence 2) | `Without an account, your book stays on your phone.` | Literally true for a person who never signs in, but it is the only where-it-lives sentence in the listing, and the listing now describes a build with sign-in and sync. It leaves a reader to infer that signing in changes nothing. Untrue by omission for anyone who signs in and agrees to sync. Also read by `apps/mobile/store.config.json` (generated, drift tested). |
| 2 | `store.en.ts`, `screenshots[5].caption` (frame `06-privacy`) | `Your book stays on your phone.` (subline: `Private by default. Never sold, never used for ads.`) | Untrue once the person signs in and syncs. Also baked into the image `docs/store/screenshots/ios-6.9in/06-privacy.png`. |
| 3 | `store.en.ts`, `screenshotCaptions[5]` | Same string. It is `screenshots.map((s) => s.caption)`, so row 2 and row 3 are one edit. Also `docs/store/screenshots/captions.json`. | As row 2. |
| 4 | `packages/content/src/permissions.en.ts`, `permissions.microphone` (becomes `NSMicrophoneUsageDescription` through `apps/mobile/src/lib/permission-copy.ts`, a second copy of the same sentence at line 15) | `{app} uses the microphone to record the letters you speak to your child. Your recordings stay on this phone.` | Untrue in the sense counsel already named: a purpose string must be true whatever the person's backup setting is. With iPhone backup on, the recording is in the backup. `in-app-disclosures.md` section 3 already says to keep the first sentence only (labels 1.4.0 section 5). |
| 5 | `apps/web/src/content/site.ts`, `comingSoon.trust` | `Your letters and recordings stay on your iPhone, and none of it is sent to us.` (its own comment says: true for the first build only, D-121) | Untrue for a signed in person with sync on. "None of it is sent to us" is the stronger claim. |
| 6 | `site.ts`, `scenes.s09.points[0]` (headline of the same scene: `Kept on your iPhone.`) | `Letters and recordings stay on your iPhone. We never receive them.` | Untrue for letters once synced: we do receive and store them. The scene headline carries the same claim and is not in the held list. |
| 7 | `site.ts`, `welcomeEmail.promises[2]` | `Your letters and recordings stay on your iPhone. No ads, and we never sell your data.` | Same as row 5. The second sentence is true and registered. |
| 8 | `packages/content/src/strings.en.ts`, `notifications.evening[5].body` (copy also in `features/reminders.en.ts` line 19, without `{child}`) | `Talk for a minute. {child} will hear it one day, just as you said it.` | Not a where claim. Two problems. "Just as you said it" is the phrase `claims-capabilities.test.ts` bans for words (`wordsExactlyAsSaid`), because the default view removes ums and repeats and the speech model can mishear. It is true only of the recording. And with recording backup off, a phone that is lost or replaced without an iPhone backup takes its recordings with it, so "will hear it one day" is a promise Build 12 does not make. |

## 3. Does PR #735 already fix any of them?

No. #735 (`feat/content-untrue-copy-build12`, head `45ff115b74ef`) changes eight content files and the Build 12 surfaces for sign in, Account, Privacy, Where your letters live and Delete account: `features/auth.en.ts`, `features/account-deletion.en.ts`, `strings.en.ts` (three lines: `bookBody`, `sensitiveLabel`, `keptSynced`), `VOICE.md`, and tests. It does not touch `store.en.ts`, `permissions.en.ts`, `permission-copy.ts`, `apps/web/src/content/site.ts`, or the notification bodies. All seven lines and the notification remain in #735's tree exactly as on develop (confirmed by `git grep` at both heads; `site.ts` lines only moved by four lines).

What #735 does give this work: the Build 12 profile statement in its test header (sync ON, co-parent hidden, recording backup OFF, recordings stay on the phone that made them), and a rewritten `keptSynced`: "Your letters are kept on this phone and on our servers, so they reach your other devices. Your recordings are kept on this phone." The proposals below use the same wording so the app and the store say one thing. Note that `keptSynced` itself says "kept on this phone", which is the shape this document recommends (kept, not stays) and which the ledger pattern does not match.

Remaining after #735: all of rows 1 to 8.

## 4. Proposed rewrites

Rules check: no dash of any kind, no curly quote, no ellipsis character, no emoji, no mention of how words are produced. "We" appears only in the form BRAND.md allows ("we never sell", "we spell"). Every proposed line avoids the `STAYS_ON_PHONE_CLAIMS` patterns. COUNSEL-READ means the line says where data lives, so counsel reads it before it ships.

### Row 1: listing description, PRIVATE BY DEFAULT. COUNSEL-READ.

Replace `Without an account, your book stays on your phone.` with:

> You can use the app without an account. If you sign in and agree to sync, your letters are kept on your phone and on our servers, so they reach your other phones. Recordings are kept on the phone that made them, and in your iPhone's own backup if you use one.

If founder decision 1 is "account required", replace the first sentence with `Sign in to keep your book across your phones.` and keep the rest. The rest of the paragraph (`Keep any letter just for you...`) is unchanged. Update `docs/store/app-store.md` line 51 and `docs/store/listing/apple.md` lines 44 and 56 in the same pull request, then regenerate `apps/mobile/store.config.json` (`npx tsx scripts/release/store-config.ts`).

### Rows 2 and 3: screenshot caption 6. Not COUNSEL-READ (no where claim).

Caption: `Your book is private.` Subline unchanged: `Private by default. Never sold, never used for ads.` Both halves are existing registered wording (`en.trust.short`). The frame image must be re-composed (`docs/store/screenshots/tools`), with the captured Settings, Privacy screen still the source (`app-store.md` line 90). Update `captions.json` in the same pull request. Design systems owns the re-render.

### Row 4: microphone purpose string. Not COUNSEL-READ, because it removes a promise and follows counsel's recorded instruction.

> {app} uses the microphone to record the letters you speak to your child.

Change both `permissions.en.ts` and `apps/mobile/src/lib/permission-copy.ts` together (the second feeds Info.plist). The planned deletion of `permission-copy.ts` named in its comment would remove the double edit; until then a test should compare them.

### Row 5: coming soon trust line. Not COUNSEL-READ.

> Private by default. Never sold, never used for ads.

Optional where-line for the same slot, COUNSEL-READ: `Your recordings are kept on the phone that made them. Your letters reach your other phones only if you sign in and agree.`

### Row 6: Private scene. COUNSEL-READ.

Headline `Kept on your iPhone.` becomes `Private by default.` Point 1 becomes:

> Your recordings are kept on the phone that made them. Your letters reach your other phones only if you sign in and agree.

### Row 7: welcome email promise 3. Not COUNSEL-READ.

> Your letters and recordings are private. No ads, and we never sell your data.

### Row 8: evening reminder body. Not COUNSEL-READ (no where claim; the recording claim is narrowed to "can").

> Talk for a minute. One day {child} can hear how you sounded.

This is the phrasing `VOICE.md` already recommends ("one day {child} can hear how you sounded"). For `features/reminders.en.ts` line 19, which has no `{child}`: `Talk for a minute. One day it can be heard, just as you sounded.` Check first whether that file supports `{child}`; if it does, use the same line as above. Keep "will hear" out: with recording backup off the build cannot promise it.

## 5. Must fix before a Build 12 store submission, and what can follow

Submission visible. Apple's reviewers and the public App Store page read these, and the listing is pushed by `release-ios.yml` with `job: metadata`, which refuses a listing that promises sharing while servers are off (BL-440), so a listing that says "stays on your phone" next to a servers-on build is the exact mismatch to avoid. Fix these before the Build 12 submission:

1. Row 1, `store.description`. Also the generated `store.config.json`.
2. Rows 2 and 3, screenshot 6 caption in `store.en.ts`, `captions.json` and the composed PNG (upload by hand; EAS Metadata does not upload screenshots).
3. Row 4, `permissions.microphone` and the copy in `permission-copy.ts`. The purpose string is compiled into Info.plist, so it ships inside the binary and cannot be fixed after the build is cut. This one must land before the Build 12 cut, not just before submission.

Also submission visible, found while checking (outside the seven, for the founder to route):
- `docs/store/compliance/release-notes.md` line 20 ("a memory book that stays on your phone"), the What's New text.
- `storeListing.reviewNotes` (servers-off notes) says "keeps everything on the phone ... no server copy of letters". It is Apple facing only and must not be sent for a servers-on build; `with-review-contact.ts` is meant to enforce that. Confirm.
- `appReviewCopy.notesServersOn` describes joining a sample book as a second parent, but #735's test header says the Family tab, invites and co-parent surfaces are hidden in Build 12. One of the two is stale. If the surfaces are hidden, the reviewer cannot follow the steps.

Website, to be fixed by the time Build 12 is released, not by submission: rows 5, 6 and 7. They are live today from `main`, so they are already ahead of the Terms 7.1 text for the second test build, and they should change in the website deploy that goes with the privacy policy version for Build 12. They do not block a TestFlight or an App Review upload, but Apple expects the privacy policy page and the listing to agree, so do not let the website lag the store listing by long.

Row 8, the notification, is not store visible. Fix in the same content pull request for tidiness; it can follow the submission.

Additional website lines the capped list does not catch, because their wording differs from the pattern (found by search, not by the test): `packages/content/src/site.en.ts` lines 28, 76, 79, 88 and 113, `pages.en.ts` line 71 ("We do not upload them"), and `apps/web/src/content/site.ts` line 74 comment. They need the same pass. Each is a where-it-lives line, so each is COUNSEL-READ.

## 6. Decisions needed

Founder:
1. Is sign-in optional or required in Build 12? The App Review notes and `RELEASE.md` say optional ("Sign-in required" stays No); the task brief says account-first. Row 1 has two forms.
2. Approve the screenshot 6 caption change and the re-render of the PNG, or choose a different caption.
3. Confirm the microphone purpose string shrinks to its first sentence (it is in the binary).
4. Decide whether the website where-it-lives lines wait for Build 12 release or change now.
5. Settle which is true for Build 12: co-parent hidden (#735) or sample book join for the reviewer (`notesServersOn`).

Counsel:
1. Read rows 1 and 6 (and the optional where-line for row 5): the wording "kept on your phone and on our servers", "kept on the phone that made them", and "in your iPhone's own backup if you use one".
2. Confirm that dropping the microphone sentence, rather than rewording it, is what labels 1.4.0 section 5 meant.
3. Confirm the other site lines in section 5, and whether any line can enter the claims registry (BL-867, #747), which is the way the capped list goes down.

Signed, Content lead (Claude role)
