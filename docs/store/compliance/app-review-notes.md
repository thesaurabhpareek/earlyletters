> **Superseded (1 Nov 2026).** Do not paste from this file. The 1.0 listing is `docs/store/app-store.md`, and every other App Store Connect field is in `docs/store/app-store-connect-1.0.md`.

# App Review notes (Apple) and testing instructions (Google Play)

For the "App Review Information" section of App Store Connect and the "App access" and "Testing instructions" parts of Play Console. Facts below were checked against `apps/mobile` at HEAD `3ce511e`. Use the Profile A notes for the binary that exists today, and the Profile B notes only when sign-in, sync, family and Plus have shipped (OPEN-01).

Only the fictional family "Asha" appears here (CLAUDE.md privacy rules). Do not put a real child's name, a real email or any real recording in App Review attachments; make the screen recording with the demo child "Asha".

## 1. App Review Information fields (entered only in App Store Connect)

| Field | Answer |
|---|---|
| Sign-in required | Profile A: **No**. Profile B: **Yes** (demo account below) |
| Contact first name, last name, phone | OPEN-04. Entered in App Store Connect only. Never in the repo (publisher legal name stays out of code, D-004) |
| Contact email | OPEN-04 (`hello@earlyletters.com` is the only address the repo publishes) |
| Demo account | Profile A: none needed. Profile B: see section 4 (OPEN-07) |
| Attachment | A short screen recording on a real device: age question, first run for "Asha", a typed letter, the Speak screen with the microphone prompt, the book. Recommended because speech-to-text is not available in a release build (OPEN-12) |
| App-specific hardware | None |
| Regions | United States only at launch (D-013) |
| Age rating override | 18+ (see `age-rating.md`) |
| Privacy Policy URL | OPEN-02. Must cover the app. The live `https://earlyletters.com/privacy` covers only the website today |
| Support URL | OPEN-04. `https://earlyletters.com/support` does not exist yet |

## 2. Notes for Apple, Profile A (local-only build)

Paste into the "Notes" box. About 1900 characters; the limit is 4000.

```
Early Letters is a baby memory book. A parent writes or speaks short letters to their child, and the app keeps them, in the parent's own words, in a book filed by month of age.

This version stores everything on the device. There is no sign-in, no account, no server, no advertising and no tracking, so there is no demo account. The app makes no network calls.

HOW TO REACH THE MAIN FLOW
1. Launch. The first screen asks "Are you 18 or older?". Tap Yes. (The app is for adults. Tapping No shows a stop screen; "I answered by mistake" on that screen returns to the question.)
2. First run: continue through the welcome and promise screens. When asked for a name, enter the demo child "Asha". Choose a birthday (any past date) or switch to a due date. For "What does Asha call you?" enter "Papa". Finish.
3. Tonight tab: tap Type, write a few words, and save. The letter appears in the Book tab, filed by month of age. Tap it to read it.
4. Speak: back on Tonight, tap Speak. The microphone permission prompt appears at this moment, not at launch. Allow it, say a sentence, and stop. The recording is kept on the device with the letter.

WHAT TO EXPECT ON SPEAK
Turning a recording into words (speech to text) runs on the device with a downloaded speech model, which this version does not include yet. After you stop recording, the Review screen says "Your voice is kept" and offers "Keep recording only" or typing the words instead. This is intended behaviour for this version, not a crash.

MICROPHONE
Used only while the Listening screen is open, to record the letter the parent speaks. Nothing is recorded in the background. Recordings never leave the device in this version.

ITEMS THAT ARE INTENTIONALLY OFF IN THIS VERSION
Settings shows Account ("Not signed in"), Export, Backup, Terms, and family invites as not available yet, with an honest line saying so. Plus is not purchasable in this version, so there are no in-app purchases to test.

There is a small "Beta" label at the top of Settings. Reminders can be chosen in Settings, but this version schedules none and requests no notification permission.

Contact: hello@earlyletters.com
```

Why each line is there (so you can keep it true when the build changes):

- "No network calls": verified by searching `apps/mobile/src` and `modules/` for fetch, Supabase, PostHog, Sentry, expo-iap; none found. Re-verify before every submission.
- "Used only while the Listening screen is open": `listen.tsx` requests permission in `start()` and records only in that screen; `app.config.ts` sets `enableBackgroundRecording: false` and `enableBackgroundPlayback: false` (LEGAL-REQ-011), so no `UIBackgroundModes` audio entry is added by `expo-audio`.
- The 24-hour block after "No" is real (`age-gate.logic.ts`, `BLOCK_MS`). Warn the reviewer so a mis-tap does not look like a hang.
- Disabled rows are real: `settings/index.tsx` lines for Export, Delete account and Terms; `(tabs)/family.tsx` invite button; `settings/recordings.tsx` backup.
- Risk: Apple may judge Profile A as incomplete (2.1, 4.2) because several visible rows are disabled and speaking yields no words. That is a product decision, not a wording one (OPEN-01, OPEN-12).

## 3. Notes for Apple, Profile B (v1.0 as designed)

Use only when the features exist. Fill the bracketed parts from the real console values.

```
Early Letters is a baby memory book. A parent writes or speaks short letters to their child, and the app keeps them, in the parent's own words, in a book filed by month of age. Family can be invited to add their own signed letters.

SIGN IN
Sign in with Apple, or email with a link and 6-digit code. For review, use the demo account: [DEMO EMAIL] and code [DEMO CODE] (OPEN-07). It belongs to the fictional family "Asha". It has one book, "Asha", and a few sample letters.

HOW TO REACH THE MAIN FLOW
1. Launch, answer "Are you 18 or older?" with Yes, and sign in with the demo account.
2. Tonight tab: tap Type or Speak. Speak asks for the microphone the first time. After you stop, Review shows the words as the parent said them, with any small fixes marked so each one can be put back. Save to add the letter to the book.
3. Book tab: letters are filed by month of age. Tap a letter to read it, and play the recording kept with it.
4. Family tab: invite a family member (copy the invite link; a second account is not needed for review).
5. Settings: Plan, Data (Export, Delete account), Legal (Terms, Privacy Policy, Subscription terms).

SPEECH
The words from a recording are made on the device by a speech model downloaded on first use over Wi-Fi [from the model host, D-046]. Transcription is not sent to a server unless the parent chooses cloud transcription and agrees on a consent sheet [only if built, OPEN-14]. We never rewrite a letter; machine fixes are limited to removing filler words and false starts and correcting spelling of names, and each is reversible.

SUBSCRIPTIONS (see section 5)

ACCOUNT DELETION
Settings, Data, Delete account. It asks for confirmation, schedules deletion in 30 days and can be cancelled in that window. Sign in with Apple tokens are revoked as part of it.

Contact: [support email]
```

## 4. Demo account (Profile B only)

| Item | Value |
|---|---|
| Account owner | The fictional family "Asha". Never a real person |
| Email | `[review-asha@ a domain the founder controls]` placeholder; not `example.com`, which cannot receive mail |
| Sign-in method for review | OPEN-07. Sign in with Apple cannot be handed to a reviewer. An email link and code needs an inbox the reviewer cannot read. Options: (a) a Supabase test OTP for this one address with a fixed code, (b) a password-based account enabled only for the review email, (c) a reviewer bypass flag. Pick one; whichever you pick must not weaken real accounts |
| Content | One book "Asha"; a handful of letters like those in `apps/mobile/src/dev/asha-seed.ts` (dev-only file, not bundled for release; use it as the script for the sample letters, nothing from a real family) |
| Plus state | No Plus, so the reviewer can see the paywall and buy through the sandbox |
| Reset | Document how to reset the account after review (delete the account and recreate, using the deletion path in `data-and-account-deletion.md`) |
| Environment note | `store_environment_allowed()` counts sandbox purchases only when `app.store_environment = 'sandbox'` is set on the database (migration `20261003010000`). Apple reviewers purchase in the sandbox even against production, so decide (OPEN-07, OPEN-26) how the production project treats sandbox transactions during review, or the reviewer's purchase will not unlock Plus |

## 5. Subscription and in-app purchase test notes

Profile A: **none**. The Plus button is disabled and there are no products; do not create or submit in-app purchases with this build.

Profile B (all figures from `apps/web/src/content/pricing.ts`):

```
IN-APP PURCHASE: Early Letters Plus (auto-renewable subscription, one subscription group)
- Plus Monthly: $4.99 a month, 1 month free trial for new subscribers (introductory offer).
- Plus Yearly: $49.99 a year, 2 months free trial for new subscribers (introductory offer).

What it unlocks: adding new letters after the first two, which are free. Letters already made always stay readable, playable and exportable.

HOW TO REACH THE PAYWALL
Sign in with the demo account, save two letters, then try to add a third on the Tonight tab. The Plus sheet appears. It states, before the purchase button: what Plus adds, the price and trial length, that it renews automatically until cancelled, and links to Terms, Privacy Policy and Subscription terms. Settings, Plan has Manage subscription (opens the App Store subscriptions screen), Restore purchases and Redeem a code.

TESTING
Use a Sandbox Apple Account. In the sandbox the trial and renewal periods are shortened by Apple. No server-side step is needed from you.
Restore purchases restores on the same Apple Account only.
Purchases are available in the United States storefront only.
```

Open points that change this text:

- **OPEN-09.** The "first two letters free, then the Plus sheet" behaviour is not implemented anywhere today (not in the app, not in the database; only "a second book needs Plus" is). Do not claim it in review notes until it works.
- **OPEN-08.** Product ids are not final.
- Apple wants the free trial less prominent than the billed price on the sheet (`in-app-disclosures.md` section 3 says so; marked Unverified practice there).
- Guideline 3.1.2(c) requires the sheet to describe what the user gets before the purchase button; the string `plus.legal.letters` in `in-app-disclosures.md` is draft wording awaiting counsel.
- Cancel and refunds stay in Apple's own screens (ADR 0013); do not name other platforms in iOS metadata (2.3.10).

## 6. Things a reviewer may think are defects (state them in the notes)

| What they see | Truth |
|---|---|
| Stop screen after tapping No on the age question | Intended; lasts 24 hours unless "I answered by mistake" is tapped |
| "Beta" label at the top of Settings | Intended until the founder ends the beta (D-011); the store listing carries no beta wording (D-030, OPEN-21). Its body says "Export a copy of your letters now and then", but Export is disabled in Profile A; fix that copy before submitting (`strings.en.ts` `settings.about.beta.body`) |
| Speak ends at "Your voice is kept" (Profile A) | Speech model not included yet (OPEN-12) |
| Disabled rows in Settings (Profile A) | Features not available yet, labelled honestly |
| Reminder choice saved but no notifications (Profile A) | Scheduling not built; no permission requested |
| The app asks nothing about the microphone at launch | Asked only on the Speak screen |

## 7. Google Play: App access and testing instructions

Android is not in v1.0 scope (D-013, OPEN-20). Prepared so the form is ready.

| Play Console section | Answer |
|---|---|
| App access | Profile A: "All functionality is available without special access." Profile B: "Some functionality is restricted" and give the demo account from section 4 plus the steps in section 3 |
| Ads | No ads |
| Content rating | See `age-rating.md` |
| Target audience | Adults 18 and over; not designed for children; not in the Families program (OPEN-23) |
| News app, Government, Financial features, Health apps, Gambling | No for each; the app has no medical features. If the due date is judged a "health feature" in the Health apps declaration, answer after counsel review (OPEN-22) |
| Data safety | `data-safety-google-play.md` |
| Data deletion URL | OPEN-05; see `data-and-account-deletion.md` |
| Notes to testers | Same walkthrough as section 2 or 3 |

Before the first production release a newly created personal Play developer account may need to run a closed test with a minimum number of testers for a minimum number of days. The rule has changed before; read the current Play Console requirement for your account (OPEN-20).
