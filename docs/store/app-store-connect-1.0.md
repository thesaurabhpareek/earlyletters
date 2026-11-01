# App Store Connect for version 1.0 (first iOS submission)

Condensed from the review lane's work of Sun 1 Nov 2026 (ASC fields, risk register, featuring plan). The listing words
(name, subtitle, promotional text, keywords, description, captions) are in `app-store.md`, generated from
`packages/content/src/store.en.ts`; this file holds everything else App Store Connect asks for. Notes for Review are in
`notes-for-review-1.0.txt`.

Status: **at risk** for a Tue 1 Dec submission. Three blockers sit outside App Store Connect: the live Privacy Policy
and Terms pages cover only the website, the Support URL has no page behind it, and (fixed by this change) the old
description promised a delete control build 1 does not have.

Status words: READY (final), FOUNDER (only the founder can supply it), BLOCKED (cannot be entered truthfully yet),
ASO / VIDEO (another lane owns it). Personal details (legal name, phone, address) are typed only in App Store Connect,
never in this repo.

## 0. Which source wins

App Store Connect follows `packages/content/src/store.en.ts` (with `packages/brand` for name and subtitle), mirrored
by `app-store.md` and `apps/mobile/store.config.json`. `docs/store/listing/*` and the stale `docs/store/compliance/*`
files are superseded. Run `eas metadata:push` only from a `store.config.json` regenerated after this change.

## 1. App Information

| Field | Value for 1.0 | Status |
|---|---|---|
| Name | From `packages/brand` `storeName` (26 of 30) | READY; positioning decision pending with the founder |
| Subtitle | From `packages/brand` `subtitle` (30 of 30) | READY; positioning decision pending with the founder |
| Bundle ID | `com.earlyletters.scribe` from the EAS `production` profile. TestFlight build 1 is on the `.preview` record and cannot be submitted to this record | READY |
| SKU, Apple ID | `scribe-001`, 6829377245. Add `ascAppId` to `eas.json` `submit.production` after the go/no-go (Mon 9 Nov) | READY |
| Primary language | English (U.S.) (D-121) | READY |
| Primary category | Lifestyle (D-004) | READY |
| Secondary category | None, or Productivity if ASO wants it. Never Health & Fitness, Medical or Kids | ASO |
| Content Rights | "Yes, it contains, shows, or accesses third-party content, and I have the necessary rights" (Whisper weights from Hugging Face, OFL fonts, MIT icons; listed in Settings, Licenses). The old compliance draft said No | READY |
| Age Rating | Questionnaire in section 2; override to 18+; Made for Kids: No | FOUNDER confirms |
| License Agreement | Apple's standard EULA, Terms linked in the description | FOUNDER (decision) |
| Regulated Medical Devices | Should not appear (not Health & Fitness or Medical) | READY |
| Digital Services Act | "This is not a trader account" (no EU distribution). Re-assess before any EU storefront | FOUNDER |
| Server Notifications URL | Empty (no server, D-053) | READY |
| Encryption | `usesNonExemptEncryption: false` in `app.config.ts`; no documentation needed | READY |

## 2. Age rating questionnaire

All "No" or "None": Parental Controls, Age Assurance (the 18+ question is a self-declared tap), Unrestricted Web
Access (fixed links only), User-Generated Content (letters are never distributed), Social Media, Messaging, Advertising,
every Mature Themes, Sexuality, Violence and Chance-Based item, Health or Wellness Topics. Medical or Treatment
Information: None (the "If you are struggling" list is a referral; answering Infrequent would add a medical descriptor).
Calculated rating 4+, **override to 18+** (Terms require 18 or older, D-006). Made for Kids: **No** (permanent).

## 3. Pricing and Availability

| Field | Value | Status |
|---|---|---|
| Price | Free, base country United States | READY |
| Availability | United States only; "new countries or regions" unticked (D-083) | READY |
| Pre-order | No | READY |
| Mac (Apple silicon), Vision Pro | Untick if offered (iPhone only) | READY; field names UNVERIFIED |
| Tax category | Apple default | FOUNDER, UNVERIFIED |

## 4. App Privacy

| Field | Value | Status |
|---|---|---|
| Privacy Policy URL | `https://earlyletters.com/privacy` | **BLOCKED**: the live page covers only the website. Publish the app policy (`docs/legal/privacy-policy.md` 3.0.0) first |
| User Privacy Choices URL | Empty | READY |
| Data collection | Data Not Collected (D-088, D-095, D-124 item 3) | READY on three conditions: a proxy capture shows only packs, Hugging Face and Apple; counsel Q12 on IP addresses; no analytics or crash SDK in the build |
| Tracking | No (no IDFA, no ATT prompt) | READY |
| Publish | Click Publish after saving | FOUNDER |

## 5. Accessibility Nutrition Labels

Voluntary. Draft Dark Interface: Yes (confirm on the release build). Leave VoiceOver, Voice Control, Larger Text,
Sufficient Contrast, Differentiate Without Color and Reduced Motion unclaimed until an audit of every common task
passes. Publish only after the app is live.

## 6. Version 1.0

| Field | Value | Status |
|---|---|---|
| Version | 1.0.0 (`apps/mobile/version.json`) | READY |
| Screenshots | `screenshots/iphone-medium-1206x2622` (required), `screenshots/ios-6.9in` (optional); frames 1 to 6, plus 7 and 8 if wanted | READY, subject to the Family tab note in `screenshots/README.md` |
| App preview | Optional; 15 to 30 s, at most 30 fps, 886 x 1920; storyboard in `art/README.md`, capture steps in `preview/CAPTURE_GUIDE.md` | VIDEO |
| Promotional text, description, keywords | `app-store.md` | READY (keywords: ASO) |
| Support URL | Recommended `https://earlyletters.com/support` (build it); fallback `https://earlyletters.com`, which has a mailto link | **BLOCKED** until one is chosen; `/support` returns 404 today |
| Marketing URL | `https://earlyletters.com` | READY |
| Copyright | `2026 <founder's legal name>`, typed only in App Store Connect | FOUNDER |
| What's New | Not shown for a first version | n/a |
| Build | EAS `production` 1.0.0: servers, backup, status report, analytics off; English only; with D-126 (or its fallback in the notes) and the TestFlight fixes | BLOCKED until built (after 9 Nov) |
| Subscriptions | Add group Plus (`plus.monthly`, `plus.annual`) to the same submission | READY |
| Release | Manually release this version (phased release is for updates only) | READY |

Subscription disclosure: with the standard EULA, the only Terms link on the product page is the one in the
description, so the description ends with the renewal lines and the Terms of Use and Privacy Policy links. If the
founder keeps the standard EULA, the review lane also suggests the line
`Apple's standard license (EULA): https://www.apple.com/legal/internet-services/itunes/dev/stdeula/` (not added yet).
**BLOCKED** until the app Terms (`docs/legal/terms-of-service.md` 4.1.0) and Privacy Policy are live.

## 7. App Review Information

| Field | Value | Status |
|---|---|---|
| Sign-in required | No | READY |
| Contact | Founder's name, email, phone in "+1 ..." form | FOUNDER, never in the repo |
| Notes | `notes-for-review-1.0.txt` (under 4000 bytes); resolve the three brackets | FOUNDER |
| Attachment | 60 to 90 s screen recording on a real iPhone with demo child "Asha": age question, setup, typed letter, Speak, the download prompt with its size, the Plus sheet | FOUNDER |

## 8. Subscriptions (group "Plus")

| Field | Plus Monthly | Plus Annual |
|---|---|---|
| Product ID | `plus.monthly` | `plus.annual` |
| Level | Same level for both | |
| Duration | 1 month | 1 year |
| Price (US) | $4.99 | $49.99 |
| Intro offer | Free trial, 1 month, new subscribers | Free trial, 2 months, new subscribers |
| Display name | Plus Monthly | Plus Annual |
| Description (max 45) | Keep adding letters, billed monthly | Keep adding letters, billed yearly |
| Family Sharing | On (cannot be turned off later) | On |
| Purchase options | Multiseat No; App Store only | same |
| Availability | United States only | same |
| Review screenshot | The Plus sheet from the release build, 1206 x 2622 (FOUNDER) | same |

Group display name: `Early Letters Plus`. Billing grace period on (D-048). No promotional image, no promoted purchases
for 1.0. The old `compliance/subscription-metadata.md` (product IDs `el_plus_*`, Family Sharing off, yearly above
monthly) is superseded.

Subscription review notes (both products):

```text
Plus is the only purchase. Monthly (plus.monthly, $4.99, 1-month free trial) and Annual (plus.annual, $49.99, 2-month free trial) are the same service at the same level; Annual is billed yearly. What Plus adds: keeping letters after the first 2, which are free. Letters already kept stay readable, playable and exportable without Plus. To reach it: keep two typed letters on the Tonight tab, then keep a third; or open Settings, Plan. The sheet is Apple's SubscriptionStoreView with Restore Purchases, Terms of Use and Privacy Policy. The app checks Plus on the device with StoreKit; there is no server step. Family Sharing is on.
```

## 9. App Review risks

Quotes and detail are in the review lane's register; fix-by dates are Pacific time, working back from Tue 1 Dec.

| # | Guideline | Risk now | After fix | Fix |
|---|---|---|---|---|
| R1 | 2.1(a) completeness, links | High | Low | Publish app Privacy Policy and Terms by Fri 20 Nov; build `/support` or use the homepage; D-126 in the build or its fallback |
| R2 | 2.3, 2.3.1 accurate metadata | High | Low | This change: new description without "delete everything"; one listing source |
| R3 | 2.5.19 dormant code | Medium | Medium | Notes name every switched-off flag. Optional: drop `usesAppleSignIn` and associated domains from `production` (engineering lead's call). Accepted in D-121 |
| R4 | 3.1.2 subscription info, Terms and Privacy links | High | Low | R1, plus the description lines above |
| R5 | 3.1.1 restore, 2.1(b) purchases reachable | Low | Low | Sandbox buy, restore, cancel on the release build; multiseat No |
| R6 | 3.1.2(a) ongoing value | Low to medium | Low to medium | Notes say exactly what Plus adds; promise no future features |
| R7 | 4.2, 4.2.3(ii) the 575 MB download | Medium | Low | Notes explain it; attach a recording of speech working |
| R8 | 5.1.1(ix) individual seller, sensitive info | Medium | Low to medium | Notes: not a health app, no account, nothing leaves the device; keep "due date" out of the listing |
| R9 | 5.1.1(i), 2.3 privacy label | Medium | Low | Policy live, proxy capture, counsel Q12 |
| R10 | 2.2 betas: "Early version" note in Settings | Medium | Low | Hide or reword the About note in production (founder call, D-030) |
| R11 | 2.3.8, 5.1.4 "For Kids" wording | Low | Low | Keep "For parents" first; never "for children" or "kids" |
| R12 | 1.3 Kids Category | Low | Low | Made for Kids: No |
| R13 | 2.3.6 age rating | Low | Low | 18+ override |
| R14 | 2.3.3, 2.3.9 screenshots, previews | Medium | Low | This change: real-app frames at the required size, fictional Asha; preview from real captures |
| R15 | 2.5.2 downloaded code | Low | Low | Model weights and signed settings are data; no feature switches in remote config |
| R16 | 5.1.2(i) third-party AI | Low | Low | Speech runs on the device; confirm with the proxy capture |

Not verified: whether documented dormant code is acceptable (R3); the Mac and Vision Pro checkbox wording and tax
category; Apple's 2026 holiday schedule; anything that needs the release build.

## 10. Featuring nomination

- **Type:** App Launch. **Desired range:** 8 to 31 Dec 2026. **Platform:** iPhone. **Country:** United States.
  **Localization:** English (U.S.). **In-App Events:** none.
- **When:** Apple asks for "a minimum lead time of 3 weeks"; submit by **Fri 13 Nov** (PT). Save the draft now.
- **Supplemental URLs:** https://earlyletters.com; the preview video as an unlisted link once final; a press page if
  one exists. No public TestFlight link (D-004).
- **Roles:** Account Holder, Admin, App Manager or Marketing.

Draft description:

Before submitting, confirm on the release build: "Not much today", reminders off by default, and the PDF export. The first line follows the positioning the founder chooses.

```text
Early Letters is a baby memory book that parents fill by talking. At the end of the day a parent tells their child one thing about it, in a sentence or a few minutes. The app writes the words down on the iPhone, keeps the recording beside them, and files the letter by the child's month of age. Years later the child can read it, and hear how their parent sounded when they said it.

What is different: the app never rewrites a parent's words. Speech-to-text runs on the device. The app only fixes small slips, like an um, a repeat or a name spelled the family's way, and marks every fix so the parent can tap it and put it back. Typed letters stay exactly as typed. The original recording is always kept unchanged.

It is private by default. There is no account to make, letters and recordings stay on the phone, and the App Store privacy label is Data Not Collected. Nothing is sold, used for ads or used to train models.

It asks little of a tired parent. A sentence is plenty, a "Not much today" button counts as enough, and there are no streaks, scores or reminders unless the parent turns reminders on. Read Together goes through the book one letter at a time, oldest first, as a bedtime moment, in the parent's own voice.

The first two letters are free. Plus, at $4.99 a month or $49.99 a year with a free trial, lets a parent keep adding letters, and every letter already kept stays readable, playable and exportable for free, as text, audio and a PDF of the book.

Launching in the United States on iPhone, iOS 17 or later.
```


Draft Helpful Details:

```text
Accessibility: built to Dynamic Type, Reduce Motion and dark mode, with VoiceOver labels on the recording flow. [FOUNDER: keep only the items an on-device audit confirms; the Accessibility Nutrition Labels draft must say the same.]
Privacy: speech-to-text runs entirely on the iPhone; the only network requests are signed settings files, the one-time speech model download (shown with its size, on Wi-Fi, after the parent agrees) and StoreKit.
Team: made by an independent developer. [FOUNDER: add one line about yourself if you want it; no child's name or family detail.]
Priority: this is our first and only app; the launch is our highest priority.
Coming later in 1.0.x updates: writing a book together with a co-parent, and more spoken languages, each when its native reviewer signs off. [FOUNDER: keep or delete. It describes plans, not the build.]
```

## Apple pages (opened by the review lane, 1 Nov 2026)

App information, Platform version information, Age ratings values and definitions, Screenshot specifications, App
preview specifications, Manage app privacy, App privacy details, Custom license agreement, DSA trader requirements,
Accessibility Nutrition Labels, Availability, Release option, Phased release, Submit for review, Submit an In-App
Purchase, Auto-renewable subscription information, Purchase options, Family Sharing, Auto-renewable subscriptions, App
Review Guidelines, Categories, App Review, Getting featured, Nominate your app for featuring. All under
https://developer.apple.com/help/app-store-connect/ or https://developer.apple.com/app-store/.
