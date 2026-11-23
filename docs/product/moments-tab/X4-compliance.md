# Moments tab: compliance obligations register (X4)

Status: PROPOSED. Docs only. Nothing here is built, decided or recorded in `DECISIONS.md`.
Lead: X4 (compliance). Date: 21 Nov 2026. Branch `wip/moments-x4`. No PR.
Voice: engineering reading for the founder and counsel. Not legal advice. Every legal or store reading below is "engineering reading, confirm with counsel". The Chief Compliance Officer signs; this file is the working-level review, not an approval.
Fictional family Asha only. The founder's screenshots are not in the repo and nothing from them (name, place, face, business) appears here.

## 0. Short answer

1. The tab is allowed to exist under every rule I could read, if the library stays on the phone, the permission is asked once on a tap with a working path for a "no", and nothing derived from the library reaches a server, a log or an email. Most obligations below are "keep doing what the privacy read (PR #1267) already proposes, and prove it".
2. Five things are new compared with PR #1267, from sources I read this session (section 2): App Review 5.1.2(vi) (Photo API data may not be used for "marketing, advertising or use-based data mining"), 5.1.2(ii) (no repurposing without consent), 5.1.1(iii) (the out-of-process picker is preferred over full Photos access), 4.5.4 (now read, push rules), and the CAN-SPAM classification of a nudge email.
3. Route B (our own PhotoKit read) carries the heaviest review burden: it must justify why the out-of-process picker is not enough (5.1.1(iii)), and its purpose string must name the reminder use or the nudge is a repurposing (5.1.2(ii)). Route A (Apple's journaling suggestions picker) is out of process and needs no library permission, but needs an entitlement; whether Apple approves it is UNVERIFIED (both Apple pages are silent).
4. A nudge email cannot use library signals (server never sees them) and, by the existing email rule, cannot carry a child's name or birthday either. So "month age" as an email hook is blocked by our own rule, not only by the library rule (finding F4).
5. The label claim must be written per data type. The app as a whole answers "Yes, we collect data" (label file 2.2.0). "Photos or Videos: not collected" is the claim that must hold, and it is false if media sync (NS-52 Variant B) ships.
6. Nothing here changes which places are blocked or what a user is promised; where it touches a promise, the founder decides (section 11).

## 1. Purpose and scope

In scope: the compliance view of a photo-library-driven Moments tab, on iOS, US App Store storefront only (launch geography, `docs/legal/compliance-register.md` section 1). Out of scope: layout, copy, animation (other leads), the architecture (X-leads for architect and data), legal drafting in `docs/legal/**` (the founder and `legal` own it; I do not edit it).

Obligations covered: App Review 5.1.1 and 5.1.2; Apple's journaling suggestions entitlement; the App Privacy label; COPPA and children's data; GDPR and UK; California (CCPA/CPRA, CalOPPA); ATT; notification consent and local-notification rules; email consent (CAN-SPAM); the age gate; evidence before submission; a gate checklist.

## 2. Inputs read

Read in this session (VERIFIED means I opened the source on 21 Nov 2026; section 12 lists what I could not read):

| Id | Source | Used for |
|---|---|---|
| S1 | `/home/claude/moments-brief.md` | Scope, decisions of record, work rules |
| S2 | PR #1267, branch `docs/privacy-moments-tab-21nov`, `docs/product/MOMENTS-TAB-PRIVACY-AND-CONSTITUTION-21nov.md` (220 lines) | Routes A and B, element table, reversals, CQ-1 to CQ-15 |
| S3 | PR #1264, branch `docs/product-home-engagement-wheel-21nov`, `docs/product/HOME-ENGAGEMENT-WHEEL-21nov.md` (208 lines) | NS-53 rows R1 to R16, Q-HEW-1 to 3, M0 to M5 states |
| S4 | `docs/legal/compliance-register.md` (CR-001 to CR-006, CR-013, CR-014, CR-060, CR-061, geography note), `ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-002, `app-store-privacy-labels.md` 2.2.0, `docs/emails/COMPLIANCE.md` and `CATALOG.md` | Existing rules this tab must meet |
| S5 | `docs/product/prd/27-photo-moments-and-media.md` (NS-51 rows, NS-52 rows, Q-PM-3) | Row ids cited below |
| S6 | `apps/mobile/test/g6-production-flags-off.test.ts` lines 60 to 62, 160 to 163, 198 to 202 | The existing build gate |
| A1 | developer.apple.com App Review Guidelines (read to character 100000 of 121052) | 1.3, 4.5.4, 5.1.1, 5.1.2, 5.1.3, 5.1.4 (to 5.1.4(b)) |
| A2 | developer.apple.com/help/app-review/guideline-reference/5-1-1-purpose-strings | Purpose string rules |
| A3 | `developer.apple.com/documentation/journalingsuggestions/presenting-the-suggestions-picker-and-processing-a-selection` (markdown form) | Picker, consent sheet, entitlement, item types |
| A4 | `developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.journal.allow` (markdown form) | Entitlement, availability iOS 17.2 and later |
| A5 | `developer.apple.com/documentation/photokit/delivering-an-enhanced-privacy-experience-in-your-photos-app` | Usage string, crash without it, request on user action, limited library |
| A6 | `developer.apple.com/documentation/usernotifications/asking-permission-to-use-notifications` | Local and remote need permission; ask in context; provisional |
| A7 | developer.apple.com/app-store/app-privacy-details | Collect, tracking, data types, optional disclosure |
| A8 | `developer.apple.com/documentation/apptrackingtransparency` | When ATT applies |
| F1 | ftc.gov CAN-SPAM Act compliance guide for business | Eight requirements, 10 business days, penalty, definitions |
| F2 | ftc.gov COPPA FAQ (read to character 100000 of 144469) | A.1, A.3, A.8, A.9, F.1, F.4, H.1, H.6 |
| G1 | gdpr-info.eu Article 8 and Recital 51 (secondary reproduction of the regulation, labelled) | Child consent age; photographs |
| C1 | oag.ca.gov/privacy/ccpa (California Attorney General) | Thresholds, rights, sensitive personal information |
| C2 | law.justia.com CalOPPA B&P 22575 (secondary; the tool returned a summary, not full text) | Posting duty, contents |
| I1 | ico.org.uk Children's code page | Scope in general terms only |

## 3. What the tab does, as far as compliance is concerned

A new tab (position open, IA leads). Before permission it shows our own Asha examples (M0). On a parent's tap, and only after the first saved letter (D-165, K-02), it explains, then asks for photo access (Route B) or opens Apple's suggestions sheet (Route A). With no access it still shows catalogue prompts, typed days, ticked days and one past letter (M4). It may influence a local reminder and, per the founder's later direction, email.

Compliance facts that do not change with layout: (1) a library permission string is new in a 1.x build (reverses BL-1305); (2) a child's pictures appear on screen; (3) a nudge is timed from library data on the phone; (4) an email nudge, if any, runs on the server, which must stay blind to the library.

## 4. Requirements register (MT-X4-Rn)

Format: Given / When / Then; test layer (unit, e2e, device, scan, db, review); basis. "V" means the basis was read this session. "U" means UNVERIFIED. Row ids are PROPOSED and cite, not replace, rows in other files.

### 4.1 App Review 5.1.1: purpose strings and permission ask

| Id | Given / When / Then | Layer | Basis |
|---|---|---|---|
| MT-X4-R1 | Given any build that includes the library permission string, When the Info.plist is read, Then it holds one `NSPhotoLibraryUsageDescription` and no `NSPhotoLibraryAddUsageDescription` (the app never writes to the library), and no other protected-resource string is added by this tab | scan (extends S6 allow-list for the library module only) | A5 V: read-only use takes the first key, add-only takes the other; a missing string crashes the app |
| MT-X4-R2 | Given the purpose string, When it is reviewed, Then it is one complete sentence in active voice and sentence case, names the feature, gives one concrete example, is not marketing copy, and does not hide who has access | review | A2 V |
| MT-X4-R3 | Given the purpose string, When it describes the use, Then it states every use the library data has in the build: showing the parent's days, and, if the reminder link ships, timing a reminder from picture dates on the phone | review + content test | A1 V 5.1.2(ii): data collected for one purpose may not be repurposed without further consent. Intent only, DORMANT until counsel clears it (corrected 22 Nov 2026 by `product` after the `content` read; the earlier draft said "and to time your reminder" and "The pictures stay on this phone", which X2 F7 bans and which tells a parent the library drives reminders): "{app} reads the dates of your pictures on this phone to show days you can start a letter from." Words by `content`; the public name comes from `packages/brand` only |
| MT-X4-R4 | Given every supported localisation, When the permission alert is shown in each, Then the string is localised and was tested in the prompt | device | A2 V |
| MT-X4-R5 | Given a cold launch, first run, sign-in or any screen other than the Moments tab's own ask button (which is not shown before the first saved letter), When the app runs, Then no PhotoKit call is made and no alert appears | unit + device + scan | A5 V: avoid PhotoKit calls at first launch, make them on direct user action. Same as NS-53-R2, R3 (S3) |
| MT-X4-R6 | Given the parent taps the one ask button, When one sentence of ours has been shown, Then Apple's alert follows; the sentence names what is read and that it stays on the phone | e2e | A1 V 5.1.1(ii); S3 7.5 door lines |
| MT-X4-R7 | Given a No, Not now, Limited or Restricted, When the tab is used, Then every part that does not need the library works, no screen of ours asks again, and the only pointer is "Open Settings" when the parent looks at the declined state | e2e + device | A1 V 5.1.1(iv): do not manipulate or force consent; provide alternatives. A5 V: the system will not prompt again |
| MT-X4-R8 | Given Limited access, When the tab reads, Then it works as with full access and never nags to widen the selection; a parent-tapped "Choose more" may call the limited-library picker | device | A5 V (limited library from iOS 14; present the picker on a tap). The Info.plist key that suppresses the automatic limited-access alert is shown only as an image on the page: key name U |
| MT-X4-R9 | Given the tab would also work through the out-of-process picker, When Route B is chosen, Then the Notes for Review give the reason the picker is not enough (browse days by date, which PHPicker does not provide to our code) | review | A1 V 5.1.1(iii): "Where possible, use the out-of-process picker or a share sheet rather than requesting full access to protected resources like Photos". Whether App Review accepts the reason: U |
| MT-X4-R10 | Given only a subset of data is relevant, When the library module reads, Then it reads creation date, media type and a transient identifier only (NS-51-R5, R6), never location, people, albums by name, or pixels outside an opened sheet | scan | A1 V 5.1.1(iii) data minimisation; S5 |
| MT-X4-R11 | Given paid features, When the library is off or denied, Then no paid feature depends on it | unit | A1 V 5.1.1(ii): paid functionality must not depend on granting this data |

### 4.2 Apple journaling suggestions (Route A)

| Id | Given / When / Then | Layer | Basis |
|---|---|---|---|
| MT-X4-R12 | Given Route A, When the build is signed, Then `com.apple.developer.journal.allow` is present only in the build profile that enables the flag, added by the Journaling Suggestions capability, and S6's test still fails any other profile that carries it | scan | A3, A4 V: entitlement required; picker fails to present without it |
| MT-X4-R13 | Given the entitlement page says availability iOS 17.2 and later, and the minimum is iOS 17.0 (D-098), When the OS is 17.0 or 17.1, Then the Route A button is not rendered and nothing else changes | unit + device | A4 V availability; D-098 from S1 |
| MT-X4-R14 | Given a suggestion is chosen, When the completion handler runs, Then the app keeps the chosen photos and videos only, discards Location, Contact, Song, Podcast, Workout, MotionActivity, GenericMedia, Reflection, StateOfMind and EventPoster items at the boundary, and stores nothing from them | unit + scan | A3 V item types list. Mirrors S2 section 2 |
| MT-X4-R15 | Given the suggestion `title` is a machine-made string, When the parent has not tapped "Use this", Then it is not stored, logged or shown by us; if the parent taps it, it becomes their own text (NS-49-R9) | unit + content | A3 V (sample reads `suggestion.title`); S2 |
| MT-X4-R16 | Given the Journaling Suggestions consent sheet shows once per device and is Apple's wording, When it appears, Then our screen before it does not claim anything it does not say, and is not shown in the same session as our own library alert (one route at a time) | e2e + review | A3 V once per device. S2 CQ-8 |
| MT-X4-R17 | Given the Developer Program License Agreement section linked from A3 ("Suggestion data requires careful handling"), When Route A is considered for release, Then counsel has read that section and the founder has a written reading | review | A3 V that the link exists; the agreement text is U (not read) |
| MT-X4-R18 | Given App Review's view of the entitlement is unknown, When Route A is considered, Then a TestFlight build with the capability on has passed App Review with the reply on record before the flag is turned on in `production` | review | A3, A4 are silent on approval: U. Same as S2 CQ-2 |

### 4.3 Privacy nutrition label (App Privacy answers)

| Id | Given / When / Then | Layer | Basis |
|---|---|---|---|
| MT-X4-R19 | Given the label file today (2.2.0), When the Moments build ships, Then the row for User Content, Photos or Videos, reads "No" with a reason that matches the build ("on device only, never transmitted"), not "No photo feature in v1.0", and the file is re-versioned in the same build as the behaviour | review | S4 V (that row says "No photo feature in v1.0"); A7 V: data processed only on device is not collected |
| MT-X4-R20 | Given the whole-app answer, When anyone writes "Data Not Collected" about the app, Then it is corrected: the app answers "Yes, we collect data" for contact info, other user content, user ID and sensitive info; the claim that holds is per type | review | S4 V label 3.1 and 3.2. This corrects loose wording in S2 section 0 and CQ-1 ("label stays Data Not Collected"); the type-level claim in S2 is right |
| MT-X4-R21 | Given any photo, thumbnail, date, identifier, coordinate or title leaves the phone for our use (sync, analytics, crash, log, server geocode we log, email), When a network fake runs, Then the test fails, because the type becomes collected and the claim is false | e2e (network fake) | A7 V: "collect" means transmitting off the device so that you or partners can access it beyond the real-time request; NS-51-R26 |
| MT-X4-R22 | Given NS-52 Variant B (media sync) is chosen, When the build is prepared, Then Photos or Videos is answered "Collected, linked to the user, not used for tracking", counsel has read X2, and the Moments copy and policy change in the same build | review | S5 NS-52-R23; A7 V |
| MT-X4-R23 | Given a place name, When it is proposed, Then it is parent-typed only, because a reverse geocode of recorded coordinates needs a network service (S2 cites the Core Location page) and coordinates at three or more decimals are Precise Location on the label | review | A7 V precise location definition. The Core Location page was read by the privacy lead, not by me: U on that page |
| MT-X4-R24 | Given the privacy manifest and required-reason API rules, When the library module ships, Then `mobile` confirms from Apple's docs whether any new API needs a declared reason, and records it | review | Not read: U |
| MT-X4-R25 | Given the privacy policy must "identify what data, if any, the app collects, how, and all uses", When the library is read on the phone, Then the policy says in plain words what is read (dates), that it stays on the phone, how to turn it off, and that reminders may be timed from it, in the same build | review | A1 V 5.1.1(i); C2 V (CalOPPA posting duty, summary). Edited by `legal` and the founder, not by me |

### 4.4 Children's data when a photo shows a child (the parent is the user)

| Id | Given / When / Then | Layer | Basis |
|---|---|---|---|
| MT-X4-R26 | Given the user is an adult parent and the child never signs in, When the tab shows or attaches the parent's pictures of the child, Then the engineering reading is that COPPA is not the governing rule, because it covers information collected from children, not from adults about children | review | F2 V: A.8 "COPPA only applies to personal information collected online from children"; F.4 "does not cover information collected from adults that may pertain to children". A.3 and F.1 V: a photo of a child's image is personal information, so the rule turns on who it is collected from. Counsel confirms |
| MT-X4-R27 | Given F.4 also says operators primarily directed to children must assume the uploader is a child, When store text, screenshots or the value page (M0) use child imagery, Then they are checked against the child-directed signals already listed (CR-002 item 7: "kids" keyword, "let them listen on their own") and use Asha content shown as parents' memory-keeping, not a children's feature | review + content test | F2 V F.4. The register's D.1 factors: not re-read by me (page read to char 100000 only): U |
| MT-X4-R28 | Given Apple 5.1.4 and 1.3 (kids), When the app is submitted, Then the app stays outside the Kids Category, declared 18 and over, and no third-party analytics or ads are added by this tab | review | A1 V 1.3 and 5.1.4(a) to (b) (page truncated after 5.1.4(b)); CR-002 |
| MT-X4-R29 | Given the library may contain pictures of other people's children or adults, When the tab reads, Then it reads no faces, people albums, names or scenes, and ranks nothing by person | scan | NS-51-R33 (S5); G1 V Recital 51: photographs are biometric data only when processed through a specific technical means that allows unique identification. We do none |
| MT-X4-R30 | Given actual knowledge that a user is under 13 or under 18, When support learns it, Then the existing under-13 and under-18 runbooks apply and the library index and opt-in are erased with the account | e2e + runbook | LEGAL-REQ-002 (S4 V); F2 V H.1 and H.6 on actual knowledge. The runbook `docs/ops/runbooks/underage-account.md` exists (listed) but I did not read it: U |
| MT-X4-R31 | Given attached pictures, When a picture is attached to a letter, Then metadata (including location) is removed on attach (NS-52 re-encode) and the original is not touched | unit | NS-52 (S5): `scribe-photo` re-encode with metadata removal is specified, not built (state: PROPOSED) |

### 4.5 GDPR and UK

Launch geography is the US storefront only (CR section 1), so GDPR and UK GDPR are not engaged at launch by the app's own targeting; that is the register's reading and not mine to settle. The Moments tab does not change it, but it adds three facts counsel should hold if the storefront widens.

| Id | Given / When / Then | Layer | Basis |
|---|---|---|---|
| MT-X4-R32 | Given the storefront list, When the Moments build is submitted, Then the storefronts are still US only, and any change is a founder decision | review | S4 V |
| MT-X4-R33 | Given a future EU or UK storefront, When the library is read on the phone only, Then counsel decides whether on-device processing with no transfer reduces the duties; the engineering reading is that photos of a child are personal data and are not special category by that fact alone | review | G1 V Recital 51 (secondary reproduction). Art. 3(2), Art. 6 and Art. 9 texts: U (not read) |
| MT-X4-R34 | Given a parent who is under the digital age of consent in an EU country (16 by default, not lower than 13 by member-state law), When the 18-plus gate is in place, Then no under-18 reaches the tab, so Art. 8 consent by a parent is not needed | review | G1 V Art. 8(1); LEGAL-REQ-002 |
| MT-X4-R35 | Given the UK Children's code covers services "likely to be accessed by" children, When the service is adult-only with an 18-plus gate, Then counsel confirms whether the code applies | review | I1 V (general statement only); scope annex U |

### 4.6 California (CCPA/CPRA, CalOPPA)

| Id | Given / When / Then | Layer | Basis |
|---|---|---|---|
| MT-X4-R36 | Given the register says CCPA does not apply at launch (revenue under the threshold, no sale or share), When the Moments tab ships, Then the answer is re-run, because a library-derived signal that is collected would not change thresholds but would add sensitive data if it were precise location | review | CR-014 (S4); C1 V thresholds and that sensitive personal information includes "precise geolocation". Number to check: the register says $26,625,000 (CPI-adjusted, source [L5]); the AG page I read says "$25 million". I did not read the adjustment: U |
| MT-X4-R37 | Given we keep nothing from the library on a server, When a California parent asks to know or delete, Then the answer "we hold no library data" is true and the deletion path removes the on-phone index and opt-in | e2e | C1 V rights to know and delete. NS-36 erase gains these rows (S5) |
| MT-X4-R38 | Given CalOPPA requires a conspicuously posted privacy policy for services that collect personal information from California consumers, When the build ships, Then the policy link is in App Store Connect and in the app, and the policy states the Moments facts | review | C2 V (summary form only). The statutory text on leginfo could not be fetched: U |
| MT-X4-R39 | Given CalOPPA's do-not-track disclosure applies to tracking across sites, When the policy is read, Then it states plainly that we do not track across apps or sites | review | C2 V (summary) |

### 4.7 App Tracking Transparency

| Id | Given / When / Then | Layer | Basis |
|---|---|---|---|
| MT-X4-R40 | Given ATT is for apps that collect data and share it with other companies to track people across apps and websites, When the Moments tab ships, Then no `NSUserTrackingUsageDescription`, no ATT call and no ad or attribution SDK is added, and nothing from the library goes to any third party | scan + review | A8 V; label 3.1 (S4) says no tracking and no ATT prompt (LEGAL-REQ-016). 5.1.2(i) V: ATT permission is for tracking |
| MT-X4-R41 | Given Photo API data may not be used for "marketing, advertising or use-based data mining" (5.1.2(vi)), When a library date times a nudge, Then counsel decides whether a reminder to the parent about their own pictures is outside that rule; the engineering default is that it is a reminder, not marketing, and that it must carry no analytics | review | A1 V 5.1.2(vi) text. How Apple reads "marketing" here: U. Raised as CQ-16 |
| MT-X4-R42 | Given 5.1.2(iii) and (iv) bar building a user profile or a contact database from Photos data, When the index is built, Then it holds at most 30 moments each a start, end and at most 6 identifiers, per account, on the phone, and nothing resembles a profile | unit | A1 V 5.1.2(iii) and (iv); NS-51-R6 (S5) |

### 4.8 Notifications: consent and local-notification rules

| Id | Given / When / Then | Layer | Basis |
|---|---|---|---|
| MT-X4-R43 | Given Apple requires permission for local and remote notifications and asks developers to request in context, When the parent first sees the reminder ask, Then it is the existing ask after the first saved letter (K-02), and the Moments tab never asks for notification permission | e2e | A6 V: "you must obtain permission"; ask in a context that explains why. Founder owns the K-02 reversal question (section 11) |
| MT-X4-R44 | Given provisional authorisation can be requested at first launch and delivers quietly, When the team considers it, Then it is not used for a library-timed nudge without a founder decision, because a quiet provisional notice still appears in Notification Center and shows a pattern | review | A6 V on provisional behaviour |
| MT-X4-R45 | Given people can change authorisation at any time, When the app schedules, Then it checks the status first and schedules nothing when it is not authorised or provisional | unit | A6 V |
| MT-X4-R46 | Given 4.5.4 says push notifications must not be required to function, should not carry sensitive personal or confidential information, and should not be used for promotions or direct marketing unless the customer opted in via consent language in the app with an opt-out in the app, When a moment-timed reminder is drafted, Then it carries no letter text, name, place, count or thumbnail, is optional, and has a switch in Me | unit + content | A1 V 4.5.4. Whether 4.5.4 (headed "Push Notifications") also governs local notifications: U. Register CR-061 already says no promotional push in v1 |
| MT-X4-R47 | Given the reminder says nothing about pictures (NS-51-R11, NS-48), When the lock screen is read, Then the fact that it exists must not disclose library data; the identical-words form is the default (S2 section 10 point 5) | content + review | S2 (privacy lead's proposal; not Apple text) |
| MT-X4-R48 | Given 5.1.2(i), When the parent declines notifications or library access, Then nothing in the app is withheld because of it | e2e | A1 V 5.1.2(i): may not require users to enable system functionalities such as push or location to use the app |
| MT-X4-R49 | Given quiet hours, a hidden or quiet book and one budgeted reminder a day (NS-32-R1), When the moment source is ranked, Then it never adds a second reminder in a day | unit | S3, S5 (NS-32-R1, NS-51-R11) |

### 4.9 Email nudges (CAN-SPAM)

| Id | Given / When / Then | Layer | Basis |
|---|---|---|---|
| MT-X4-R50 | Given a nudge email whose purpose is to get the parent to open the app and write, When it is classified, Then the engineering reading is "commercial or at best uncertain", not transactional, because transactional or relationship mail is read narrowly and a nudge is not one of the five listed categories | review | F1 V: five categories, "read narrowly", "an email to an existing customer isn't automatically transactional". `docs/emails/COMPLIANCE.md` test 1.2 reaches the same stop point. Counsel confirms (CQ-17) |
| MT-X4-R51 | Given a commercial email, When it is sent, Then it has accurate headers, honest subject, a clear and conspicuous ad disclosure, a valid physical postal address (street, USPS PO box or registered private mailbox), a clear opt-out that works at least 30 days, and the opt-out is honoured within 10 business days | e2e + review | F1 V: eight requirements; 10 business days; the FTC page says the mechanism must keep working for at least 30 days after sending |
| MT-X4-R52 | Given a penalty of up to $53,088 for each separate violating email (FTC page figure; check for the current inflation figure before relying on it), When the first nudge email is planned, Then it is a founder decision with counsel's read, not a default | review | F1 V |
| MT-X4-R53 | Given the server never sees the library, When any email is built, Then no field, trigger, segment or send time is derived from a library signal | e2e (network fake) + db | NS-51-R26 (S5); S2 section 10: Photos or Videos metadata sent to a server becomes collected (A7 V) |
| MT-X4-R54 | Given the email rule that no child name, birthday or due date appears in any email body or subject (`docs/emails/COMPLIANCE.md` section 0 item 7), When a nudge uses "month age" or a birthday, Then the email may use that fact to choose WHEN to send but may not say it; words like "{child} is 8 months" are out | content test | S4 V. This blocks a hook the founder may expect (finding F4) |
| MT-X4-R55 | Given the email catalogue principle "no re-engagement" (`CATALOG.md` section 5 and the rejected list: no "we miss you", no guilt), When a nudge email is designed, Then it needs a founder ruling that overturns that line, and it is opt-in, off by default, on the separate mailing subdomain, and carries no counts and no gap language | review | S4 V |
| MT-X4-R56 | Given suppression is account-wide in the email vendor, When a parent opts out of nudges, Then sign-in and billing mail still send, and the opt-out does not use the account-wide list | e2e | `docs/emails/COMPLIANCE.md` item 5 (S4 V). Gmail and Yahoo one-click header rules (RFC 8058) are named there; I did not read them: U |

### 4.10 Age gate interplay

| Id | Given / When / Then | Layer | Basis |
|---|---|---|---|
| MT-X4-R57 | Given the age gate is the first thing on a fresh install (LEGAL-REQ-002), When the Moments tab or its value page (M0) is reachable, Then it is only reachable after the gate has passed, and no library ask, notification ask or Moments content shows before it | e2e | S4 V LEGAL-REQ-002 (age question first, nothing preselected) |
| MT-X4-R58 | Given an under-18 answer or store signal, When the gate stops the user, Then no Moments surface, index or opt-in is created | e2e | S4 V: no child, letter, recording or auth user is created, nothing stored but the gate state |
| MT-X4-R59 | Given the Declared Age Range value is used in memory only, When the tab is built, Then the tab never reads, stores or logs an age range, and never asks for age again | scan + unit | S4 V: LEGAL-REQ-002, CR-004 |
| MT-X4-R60 | Given the Texas store-law duties and the California, Utah, Louisiana and Alabama dates in CR-004 and CR-005 (secondary), When a new tab is added, Then `regulatory-affairs` re-checks those developer duties before each effective date and files what the tab must change | review | CR-004, CR-005 (S4 V); statute texts U |
| MT-X4-R61 | Given the value page M0 shows pictures of children (Asha, synthetic), When store frames are cut, Then no real child appears and the frames follow the child-directed check in R27 | review | S2, S3 |

### 4.11 Data lifecycle

| Id | Given / When / Then | Layer | Basis |
|---|---|---|---|
| MT-X4-R62 | Given the app must offer in-app account deletion if it supports account creation, When an account is deleted or the book erased, Then the on-phone index, opt-in and chosen album identifiers are removed with it | e2e | A1 V 5.1.1(v); NS-36 rows (S5) |
| MT-X4-R63 | Given the parent turns Moments off in Me, When it is off, Then the index is removed (NS-51 Q-PM-12, "no, pause empties the index") and Apple's permission is left to Settings; we do not claim to revoke it | e2e | S5 |
| MT-X4-R64 | Given the consent record for the library is on the phone only, When counsel asks for evidence, Then the answer is the per-build test and the screen, not a server row; counsel decides whether that is enough | review | CQ-18. LEGAL-REQ-049 style per-purchase records were retired for per-release evidence (S4 V); same pattern proposed |

## 5. Gate checklist (before any build that includes this tab is submitted)

Each item is yes or no. One "no" holds the build. Owner in brackets.

- [ ] G1. Founder decision recorded in `DECISIONS.md` for each reversal in section 11 (founder).
- [ ] G2. Route chosen. If B: Notes for Review give the 5.1.1(iii) reason (R9); the purpose string passes R1 to R4 (mobile, content, legal).
- [ ] G3. If A: entitlement appears only in the flagged profile (R12); TestFlight build passed App Review with the reply on record (R18); counsel read the DPLA section (R17).
- [ ] G4. S6 test (`g6-production-flags-off`) amended in its own PR to allow the library string or the entitlement for the library module and the flagged profile only; it still fails any other profile.
- [ ] G5. No PhotoKit call at launch or in first run (R5); device test on a fresh install.
- [ ] G6. Declined, limited, denied and restricted all work; no second ask (R7, R8).
- [ ] G7. Network fake shows zero requests carrying any library-derived value, including through analytics, crash, logs and any email or push path (R21, R53).
- [ ] G8. Label file re-versioned in the same build (R19, R20); counsel reads it (Q54 pattern).
- [ ] G9. Privacy policy and in-app disclosures updated in the same build (R25) and the claims test passes.
- [ ] G10. Age gate precedes the tab; under-18 creates nothing (R57, R58).
- [ ] G11. Nudge: words identical to the ordinary reminder; no analytics marker; counsel answered CQ-16 (R41, R46, R47).
- [ ] G12. Email: no library field; if any nudge email exists, classification, address, opt-out and a founder ruling on re-engagement are done (R50 to R55).
- [ ] G13. Erase and account deletion remove the index and opt-in (R62).
- [ ] G14. Store frames and value page use Asha only; child-directed check done (R27, R61).
- [ ] G15. `regulatory-affairs` re-run of CR-004 and CR-005 dates, and `regulatory-watch` run on the day of submission.

## 6. Evidence needed before submission

| Evidence | Produced by | Shows |
|---|---|---|
| Build-config scan output for the release profile | mobile | Which usage strings and entitlements are present (R1, R12) |
| Network fake log with zero library-derived requests | mobile, qa | R21, R53 |
| Device test videos: fresh install, no early ask; decline; limited | qa | R5, R7, R8 |
| Purpose string text and its localisations | content | R2 to R4 |
| Notes for Review text | mobile, legal | R9, 5.1.1(iii) reasoning, reviewer path |
| Label file version and counsel note | legal | R19 to R22 |
| Policy and disclosure diff | legal | R25 |
| App Review reply on the entitlement (Route A) | founder | R18 |
| Notification payload test | mobile | R46, R47 |
| Email classification and template registry row | legal, email lead | R50 to R56 |
| Founder decisions | founder | G1 |

## 7. Edge and unhappy paths

| Case | Compliance reading |
|---|---|
| A parent allows Limited, then selects zero pictures | Works as "nothing to show"; no nag (A5 V, R8) |
| A parent allows full access, then turns it off in Settings | The app must handle the change; the index is rebuilt from nothing or removed; no re-ask (A5 V: prepare for the user changing the choice) |
| Restored or new phone | Opt-in and index absent; no ask returns by itself (NS-51-R23) |
| Second account on the phone | Opt-in and index per account (NS-51-R24) |
| iCloud-only originals | No download triggered for the index (NS-51-R21; local thumbnail behaviour U) |
| Co-parent (LATER RELEASE: the first store build has no co-parent) | Variant A keeps pictures on the phone; a co-parent sees letter text only; Variant B changes the label and counsel reads (R22) |
| A picture holds a stranger's child, or an adult's face | No face or person reading; thumbnails shown only to the owner, with app switcher protection (NS-51-R25) |
| A nudge fires on a day the parent already wrote | Silenced (NS-51-R13) |
| Notification permission "No" | Library tab still works (R48) |
| Parent writes to support about a picture of a minor who is the parent's own child | Not an under-13 user; normal support path; no reading of user content |
| App Review rejects the library string | Route A or the PHPicker-only path ships instead; the tab still works as M4 |
| Route A sheet shows a Location or Contact item | Ignored at the boundary (R14) |
| iOS 17.0 or 17.1 | Route A button absent (R13) |
| Founder later asks for a map or place | A founder decision and counsel read (R23, CQ-4 in S2) |

## 8. Constitution, privacy and accessibility checks

Constitution: this file proposes no feature that writes, titles, captions or guesses. R15, R29 and R47 each guard a way the machine could add meaning (a machine title, a person guess, a lock-screen disclosure). No counts, gaps, streaks, points or badges are proposed; the nudge words carry none (R46, R54, R55).

Privacy: the whole file is built on "nothing derived from the library leaves the phone" (R21, R53). Safety tiers stay on the device; nothing here touches them. No real family detail appears; Asha only.

Accessibility (compliance side only; design leads own the detail): the permission sentence and the "Open Settings" line are plain text, read in full by VoiceOver at AX5 with Bold Text; no meaning is carried by colour; the ask has a visible "Not now" of equal weight. I did not read any accessibility law this session, so no accessibility statute is cited. The register's accessibility section (2.8) lists the duties; counsel owns it.

## 9. Reconciliation with PR #1267 and PR #1264

| Point | Their text | My reading | Action |
|---|---|---|---|
| "Data Not Collected" for Photos or Videos | PR #1267 section 0 and CQ-1 | Right per type; wrong as an app-wide phrase (label file 3.1 answers Yes) | `privacy` to reword; R20 |
| 4.5.4 "not read" | PR #1267 section 10, CQ-14 | Read now; text quoted in R46. Local-notification scope still U | Close CQ-14 partly; keep the local-notification part open as CQ-16 |
| 5.1.2(vi) | Not in PR #1267 | New: Photo API data may not be used for marketing, advertising or use-based data mining | New CQ-16 |
| 5.1.2(ii) repurposing | Not in PR #1267 | New: the purpose string must name the reminder use (R3) | `content`, `legal` |
| Entitlement approval | PR #1267 A4 "silent" | Confirmed silent in two Apple pages (A3, A4) | Stays U |
| Limited-access alert key name | PR #1267 A8 U | Still an image on the page; U | Mobile confirms in Xcode docs |
| NS-53 rows R2, R3, R4, R5, R13 | PR #1264 section 7.6 | I add R5 (no PhotoKit at launch) as the compliance twin of NS-53-R2 and R3; all NS-53 ids stand | None |
| Q-HEW-1 default (drop C, spike first) | PR #1264 | Compliance does not object; it reduces the number of gates closing at once | None |
| ML numbering "ML-3, ML-6" | Brief; PR #1267 | The privacy lead could not find rows with those ids; NX-39 ruling 3 and R16 carry the text. I did not re-check | `product` confirms |

## 10. Counsel questions I add (continuing after CQ-15)

| Id | Question | Recommended default |
|---|---|---|
| CQ-16 | Does App Review 5.1.2(vi) ("Photo APIs" data may not be used for marketing, advertising or use-based data mining) reach a reminder to the parent, timed from picture dates on the phone, about the parent's own pictures? Does 4.5.4 reach local notifications? | Treat as reaching it until counsel says no. Ship the identical-words reminder, opt-in, no analytics marker, off by default if counsel is unsure |
| CQ-17 | Is a nudge email ("write about this week") commercial under CAN-SPAM's primary-purpose rule, given that the FTC reads transactional or relationship categories narrowly? | Yes (commercial). No nudge email until the founder rules on re-engagement, a postal address exists, and opt-out works |
| CQ-18 | Is an on-phone-only record of the library opt-in (no server row) enough evidence of consent under Apple 5.1.1(ii) and the privacy policy? | Yes with per-build tests and the screen as evidence; counsel confirms |
| CQ-19 | If Route B is used, will App Review accept the reason that PHPicker cannot provide date-grouped browsing (5.1.1(iii))? Is Route A's out-of-process picker the safer path for review? | Prefer Route A first if the entitlement is granted; else Route B with Notes for Review |
| CQ-20 | If EU or UK storefronts open later, does an on-device-only library read with no transfer change the GDPR duties, and does the UK Children's code reach an adult-only 18-plus service? | Keep US only; revisit with a full GDPR programme (register section 1) |
| CQ-21 | Is a month-age or birthday used only to choose send time (not stated in the email) compatible with the "no child name or birthday in any email" rule? | Yes for timing only; counsel confirms because timing can reveal the fact |
| CQ-22 | Does an app-switcher or screenshot of a child's thumbnail on a shared phone create a duty beyond NS-51-R25 protections? | No new duty; keep protections; counsel confirms |

## 11. Reversals the founder owns (compliance view)

None is decided here. Each needs a recorded founder decision.

| Earlier ruling | What the tab overturns | Compliance note |
|---|---|---|
| BL-1305 (no photo-library string or PhotoKit in any 1.x build), plus the S6 test | A library string or the journaling entitlement | New rows R1, R9, R12; amend S6 in its own PR |
| K-02 (no permission ask in first run) | Only if the tab is default for a new parent | R5, R57: the tab must not ask before the gate and first letter |
| NX-39 ruling 3 and K1 (no notification derived from the library) | A library-timed reminder, even neutral | R41, R46, R47; CQ-16 |
| CATALOG "no re-engagement email" | A nudge email | R50 to R55; CQ-17 |
| ML-6 (cards show a date, never a place or thumbnail) | Thumbnails on the tab | Not a legal rule; privacy rule; place stays parent-typed (R23) |
| Label row "No photo feature in v1.0" | The words change | R19, R20 |
| Privacy policy and in-app disclosures | New facts to state | R25; `legal` edits |

What I do not recommend reversing: nothing derived from the library reaches a server; no place from a lookup; no analytics marker for a moment nudge.

## 12. Open questions, recommended default, deadline

| Question | Default | Deadline (PROPOSED) |
|---|---|---|
| Route A, Route B, or both | Route A first if the entitlement is granted, else B behind a flag | Before the device spike is scheduled (S3 proposes Mon 24 Nov 2026) |
| Does the founder want any nudge email | No | Before the email lead writes templates |
| Reword "Data Not Collected" wording in the privacy read | Yes (R20) | Next edit of S2 |
| Who reads the DPLA section and App Review reply on the entitlement | Counsel and the founder | Before Route A is flagged on |
| Send CQ-16 to CQ-22 to counsel | Yes, with CQ-1 to CQ-15 | With the next counsel packet |

## 13. Dependencies

S6 test amendment (mobile); label and policy edits (legal, founder); the architect's route decision; the design concept (tab position); the email lead (nudge email design); `ops` for the under-13 and under-18 runbook; counsel. Standing duties from my brief: the under-18 and under-13 runbook with `ops`, OFAC list currency, and state age-assurance dates (R60).

## 14. VERIFIED, UNVERIFIED, and a guess

VERIFIED (opened this session, 21 Nov 2026):
- Apple App Review Guidelines text for 1.3, 4.5.4, 5.1.1(i) to (x), 5.1.2(i) to (vii), 5.1.3, 5.1.4(a) and (b): developer.apple.com/app-store/review/guidelines (to character 100000 of 121052).
- Purpose string rules: developer.apple.com/help/app-review/guideline-reference/5-1-1-purpose-strings.
- Journaling suggestions picker article and entitlement page (markdown form): picker in a system process, consent sheet once per device, item types, entitlement required, availability iOS 17.2 and later.
- PhotoKit privacy article: usage string, crash when missing, ask on user action, limited library.
- UserNotifications permission article: permission needed for local and remote, ask in context, provisional, check status before scheduling.
- App Privacy details: collect, on-device not collected, tracking, Photos or Videos, Precise Location, optional disclosure criteria.
- ATT framework overview.
- FTC CAN-SPAM guide: eight requirements, 10 business days, $53,088 per email, five transactional categories read narrowly, postal address options.
- FTC COPPA FAQs A.1, A.3, A.8, A.9, F.1, F.4, H.1, H.6.
- GDPR Art. 8(1) and Recital 51 (secondary reproduction on gdpr-info.eu).
- California AG CCPA page: thresholds, rights, sensitive personal information.
- Repo files named in section 2 (clone of `develop` at `fb29507`; PR branches fetched).

UNVERIFIED (not read, or only read in a limited or secondary form):
- Whether Apple reviews or approves `com.apple.developer.journal.allow`: both Apple pages are silent.
- The Developer Program License Agreement section on suggestion data.
- The Info.plist key name that suppresses the automatic limited-access alert (the page shows it as an image).
- Whether 4.5.4 covers local notifications; how Apple reads "marketing" in 5.1.2(vi) for a reminder; any text of the guidelines after character 100000, including 5.1.4(c) onward.
- Privacy manifest and required-reason API rules.
- California statutory text: leginfo pages for CCPA 1798.140 and CalOPPA 22575 failed to load. CalOPPA came as a Justia summary, not full text. The register's revenue threshold figure ($26,625,000) against the AG page's "$25 million".
- GDPR Art. 3(2), Art. 6, Art. 9; the UK Children's code scope annex; EU member-state ages beyond Art. 8's rule.
- FTC COPPA FAQ D.1 (child-directed factors) and anything past character 100000 of that page; the 2025 amended COPPA rule text.
- Gmail and Yahoo bulk sender rules and RFC 8058.
- State email or consumer laws beyond CAN-SPAM.
- `docs/ops/runbooks/underage-account.md` content (the file exists; not read).
- The Core Location geocoding page (read by the privacy lead, not me).
- Whether the founder's screenshots show Apple's system sheet.

A guess, labelled: that a library-timed reminder in the identical-words form is lower risk than a neutral-words form. It follows the privacy lead's existence-disclosure reasoning, not a source.

Content-rule check: this file uses no em dash, en dash, curly quote, ellipsis character or emoji, no model names, and no real family detail.
