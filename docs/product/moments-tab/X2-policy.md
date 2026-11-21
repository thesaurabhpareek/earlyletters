# Moments tab: policy read (X2)

Status: PROPOSED. Docs only. Nothing here is decided, built, or recorded in `DECISIONS.md`.
Lead: x2 (cross-functional policy). Branch `wip/moments-x2`. Date: 21 Nov 2026.
Not legal advice. Every legal or store reading ends with "counsel must confirm".
Fictional family Asha only. The founder's reference screenshots are not in the repo and are described only in general terms: no name, place, face or business appears here.
"Moments" is a label for this document only. The content lead found that `packages/content/BRAND.md` lists "moment" as banned for a short piece someone makes, so the parent-facing tab word may be "Gather" or another word `content` picks. I use neither in a promise.

## 1. Purpose and scope

The founder wants a new tab that reads like Apple's journaling suggestions: days built from the parent's pictures, prompt cards, a year-ago card, and an ask for photo access that works for a parent who says no. He also wants the same signal to shape email and push nudges.

This document answers the policy half:
- what the privacy policy, App Privacy label and in-app disclosures would have to say;
- what Apple's rules allow and forbid for photo access, the journaling suggestions entitlement, kids and notifications;
- email and push consent, opt-in states and unsubscribe;
- the "what we never do" lines the tab shows;
- store listing claims allowed and forbidden;
- founder policy questions, each with a default.

It does not design the tab (design leads), choose the route (feasibility), or write final parent copy (`content`). Proposed wording below is for `legal` and `content` to take or change. I do not edit `docs/legal/**`.

Route A = Apple's journaling suggestions picker (system sheet). Route B = our own on-device PhotoKit read, Limited access honoured. Both as in the brief.

## 2. Inputs read

VERIFIED = read this session. Repo reads are on `develop` at `86eccfa`.

| Id | Source | Used for |
|---|---|---|
| S1 | `/home/claude/moments-brief.md` | Brief of record, UPDATE line, reversals list |
| S2 | developer.apple.com/app-store/review/guidelines (first 100000 of 121052 characters, then the rest from offset 100000) | 4.5.4, 5.1.1, 5.1.2, 5.1.4, 1.3, 2.3.1, 2.3.7, 4.1, 4.2, 5.1.5 text quoted below. 5.1.3 (health) was NOT in what I read |
| S3 | developer.apple.com/documentation/journalingsuggestions/presenting-the-suggestions-picker-and-processing-a-selection | Picker runs "in a system process"; consent sheet once per device; entitlement; the 14 item types; "Suggestion data requires careful handling" and a pointer to the Developer Program License Agreement |
| S4 | developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.journal.allow | The picker "can't present" without the entitlement; add it by enabling the Journaling Suggestions capability in Xcode. iOS 17.2 and later. Says nothing about Apple approval |
| S5 | developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker | iOS 17.2 and later; after a pick "the system shares only the information associated with the chosen suggestion" |
| S6 | apple.com/legal/privacy/data/en/journaling-suggestions | On-device processing; apps get only chosen suggestions; the parent controls categories and notifications, can turn suggestions off for all apps |
| S7 | www.ftc.gov/business-guidance/resources/CAN-SPAM-act-compliance-guide-business | Opt-out must be clear; honoured within 10 business days; penalties per email; postal address; primary-purpose test |
| S8 | `docs/legal/app-store-privacy-labels.md` v2.2.0 | The label as it stands: Yes to collected for five types, No for Photos or Videos, Location, Contacts, Health, Usage Data, Diagnostics |
| S9 | `docs/legal/privacy-policy.md` v3.0.0 (lines 33 to 45, 78 to 90, 129 to 131) | Current "What we do not collect" line, Never list, Children section |
| S10 | `docs/legal/in-app-disclosures.md` v3.4.0 | Section 2 rules on banned phrases |
| S11 | `docs/product/PERMISSIONS-AND-TERMS-AUDIT-20nov.md` | Permission-by-permission state; gap 2 (policy and label say no photos) |
| S12 | `docs/product/prd/27-photo-moments-and-media.md` (NS-51 R1, R3, R11 to R16, R18, R19, R25, R26, R30; Q-PM-8) | The written library rules |
| S13 | `docs/emails/COMPLIANCE.md` and `docs/emails/CATALOG.md` (lines 139, 161), `packages/content/src/emails/legal.en.ts` | Email classification, the commercial footer, and the no-child-anchored-email ruling |
| S14 | `packages/content/test/rules.test.ts` line 1047 (`ON_DEVICE_ONLY`) and `packages/content/BRAND.md` glossary | The banned phrases and the "moment" collision |
| S15 | `docs/design/NOTIFICATIONS.md` | Quiet hours, nudge budget, celebrations opt-in |
| S16 | PR #1267 (`docs/product/MOMENTS-TAB-PRIVACY-AND-CONSTITUTION-21nov.md`, privacy agent) | Element table, CQ-1 to CQ-15, nudge analysis. I reconcile with it; where I cite it as a source of a fact, I re-read the Apple page myself (S3 to S6) |

Not found when I looked: the feasibility doc and the design concept PRs (only #1267 among the three is open; branches `wip/moments-a1` and `wip/moments-d5` exist and I did not read them). Assumption: feasibility picks Route B first, Route A later or never. I reconcile at the integrator step.

## 3. Findings that change the brief's premises

F1. "Data Not Collected" does not describe the app today. The label of record (S8, section 3.2) answers Yes to collected for Name, Email Address, Sensitive Info, Other User Content and User ID, all linked, none tracking. So the brief's "Data Not Collected label story must hold" can only mean per data type: Photos or Videos, Precise Location, Coarse Location, Contacts and Health and Fitness stay "not collected". I use that reading. A label that said "Data Not Collected" for the whole app would be false, and under Apple's 2.3.1 an inaccurate store claim is grounds for removal (S2).

F2. Email cannot be child-dated. The standing email rule (S13, CATALOG line 139 and 161) says there are no child-anchored emails: birthday, month-of-age and due-date emails are barred because those dates "can fall on the worst day of a family's year" and would put the child's name in the email provider. The brief says email "can only use what the server legitimately knows: the child's date of birth, typed days, letters made". The first of those is a reversal, not a given. Section 8 treats it as one the founder owns.

F3. Policy and label are stale for any photo feature. `privacy-policy.md` line 45 says "We do not collect ... photos". The label says "No photo feature in v1.0" (S8, S11 gap 2). Both become false the day a photo flag turns on, so they change in the same build as the behaviour (NS-51-R30).

F4. Apple's own text wants the out-of-process picker first. 5.1.1(iii): "Where possible, use the out-of-process picker or a share sheet rather than requesting full access to protected resources like Photos or Contacts" (S2). Route B needs a library permission. Route A is an out-of-process system picker. Policy-wise, Route A is the friendlier route, and a reviewer may ask why Route B is needed. The answer has to be in the Notes for Review (2.3.1(a), S2).

F5. Route A hands the app more than pictures. A chosen suggestion can carry a title, Location (name, city, coordinates), Contact (name and photo), Song, Workout, Reflection and State of Mind items (S3). The App Privacy and policy story only holds if our code discards everything but the pictures at the boundary and tests it. State of Mind is the parent's Health-app data.

F6. The founder's "get that permission" cannot be a requirement. 5.1.1(iv): apps "must respect the user's permission settings and not attempt to manipulate, trick, or force people to consent to unnecessary data access ... provide alternative solutions for users who don't grant consent". The first sentence of the ask is fine as a plain, single, tappable ask. A second ask, a blocking wall, or reduced function for a "no" is not.

F7. The rules test bans on-device-only claims in touched copy (S14): "stays on this phone", "never leaves", "only on this phone", "from this phone", "no one else", "nobody else", "only you can read", "no accounts", "nothing is sent anywhere". That is not a nuisance. It is D-100 option B: accounts and sync exist, so those claims are untrue for a parent who syncs. The "what we never do" lines below are therefore written as true statements about what we do and do not receive, not as "it never leaves".

## 4. Requirements

Format: id, a plain statement, Given/When/Then, test layer. Test layers: U unit, C content test, D device, R review (counsel or store), E e2e. Every requirement is PROPOSED.

### 4.1 Privacy policy effect

MT-X2-R1. The policy names the library read.
Given a build where either route is on, When a parent opens the privacy policy, Then it says what the app reads from the photo library or the picker, that it is read on the phone, and what we do and do not receive. Layer: R (counsel), C (claims inventory).
It ships in the same build as the behaviour. Until then the line "We do not collect ... photos" stays and is true.

MT-X2-R2. Every sentence about pictures is backed by a test.
Given a published sentence about pictures, When the build runs, Then a named test proves it, in the claims-inventory pattern (S12 R26: a network fake sees 0 requests). Layer: U.

MT-X2-R3. Reading is not collecting, and the policy says so only as far as it is true.
Given the library is read on the phone and nothing derived is sent to us, When the policy says "we do not receive", Then the code has no path that sends a picture, thumbnail, date, identifier, place or count to our servers, logs, crash reports or analytics. Layer: U with a network fake and a leak scan.

MT-X2-R4. A picture the parent attaches to a letter is a different fact from the read.
Given a parent attaches a picture to a letter and the letter syncs, When the policy describes it, Then it says plainly that an attached picture is part of the letter and is kept like the letter (whether it syncs today is UNVERIFIED; S11 says "Whether a picked photo syncs is UNVERIFIED"). If it syncs, the label row Photos or Videos becomes Yes for that attachment, and F1 above no longer holds for that type. Layer: R.
This is the biggest label fork. Decision for the founder in section 11 (Q3).

MT-X2-R5. The Never list gains photo lines.
Given the policy section that lists what we never do (S9, lines 86 to 88), When the tab ships, Then it also says we never use pictures for ads, never use them to train models, never look at who is in them, and never use the pictures or the library read to decide what email or notification we send. Layer: R, C.

### 4.2 Proposed policy wording (for `legal`)

Plain voice, no banned phrases from F7, no model names.

Section "What we collect", new paragraph:
> **Your pictures.** If you turn on Pictures in Early Letters, the app looks at the dates and small previews of pictures on your phone, so it can show you days you might want to write about. We do not receive these. They are read on your phone to show you a list, and the list is not sent to us. If you attach a picture to a letter, that picture is part of the letter and is treated like your letters. You can choose which pictures the app can see, change that in Settings, or turn this off in the app.

Section "What we do not collect", replace "photos" in line 45 with:
> We do not collect your location, contacts, advertising ID or payment details. We do not receive the pictures on your phone unless you attach one to a letter. We never look at who is in a picture, never read its place, and never make a face match.

Section "How we use it", add to the Never list:
> - use your pictures, or the fact that you have them, to choose what we email you or when we remind you.

Section "Reminders":
> A reminder on your phone may be timed by your phone using the dates of your pictures. The words are the same ordinary words as any other reminder. Nothing about your pictures is sent to us, and the reminder shows no picture, place or count.

That last paragraph is only publishable if the founder owns the reversal in section 8 (Q7). If he says no, it is not written.

Route A only, replace the first paragraph's second sentence with:
> When you tap Choose from suggestions, Apple's own picker opens. Apple decides what it shows. We receive only what you choose to share, and we keep only the pictures.

Route A claims need CQ-2 and CQ-3 (S16) answered first. The Developer Program License Agreement section S3 points to was not read (UNVERIFIED).

Counsel must confirm all of the above, and especially "We do not receive": it is true only while R3 and R4 hold.

### 4.3 App Privacy label and privacy manifest

MT-X2-R6. Route B label.
Given Route B ships with nothing derived leaving the phone, When the label is filled, Then Photos or Videos, Precise Location, Coarse Location, Contacts and Health and Fitness stay No, and the five collected rows stay as in S8. Apple's definition (read in S8 section 1, from Apple's page on 15 Oct): data processed only on the device is not collected, and "If you derive anything from that data and send it off device, the resulting data should be considered separately" (this second sentence is from S16 reading Apple's page; I did not re-fetch the label page this session, so it is UNVERIFIED by me). Layer: R, U.

MT-X2-R7. Route A label.
Given Route A and only the chosen pictures are kept on the phone, When the label is filled, Then the answers are the same as R6. Given any Location, Contact, Song, Workout, Reflection or State of Mind item is stored or sent, Then the matching type is collected and the label changes in that build. Layer: U (boundary test: every non-picture item type is dropped), R.

MT-X2-R8. Any picture that syncs changes the label.
Given an attached picture syncs to our servers, When the build ships, Then Photos or Videos is Yes, linked, App Functionality, and the manifest `NSPrivacyCollectedDataTypes` gains `NSPrivacyCollectedDataTypePhotosorVideos` (name UNVERIFIED; check against Apple before use). Layer: R, U (the manifest equals section 3.2 of the label doc, per S8 section 4).

MT-X2-R9. A reverse-geocoded place changes the story.
Given a place name from a lookup (CLGeocoder), When it is built, Then coordinates go to Apple's service. The geocoder "works with a network-based service" (S16, from Apple's CLGeocoder page; I did not re-fetch it, UNVERIFIED by me). Default: no geocode, no map tile; a place is typed by the parent (Q4). Layer: R.

Label table the integrator can paste, per route (all PROPOSED, subject to counsel):

| Type | Today (S8) | Route A | Route B | Either, if a picture syncs |
|---|---|---|---|---|
| Photos or Videos | No | No | No | Yes, linked, App Functionality |
| Precise or Coarse Location | No | No (Location item discarded) | No (no place read) | No, unless a place is derived and sent |
| Contacts | No | No (Contact item discarded) | No | No |
| Health and Fitness | No | No (Workout, State of Mind discarded) | No | No |
| Usage Data | No | No | No | No, unless opt-in analytics is on (BRIEF decision 12) |
| Tracking | No | No | No | No |
| Name, Email, Sensitive Info, Other User Content, User ID | Yes | Yes | Yes | Yes |

### 4.4 Purpose strings and plist keys

MT-X2-R10. Route B photo string.
Given Route B, When the build is made, Then `NSPhotoLibraryUsageDescription` exists and is shown to every user. A missing string crashes the app on first library call (S16, from Apple's PhotoKit page; I did not re-fetch it, so UNVERIFIED by me, though it is Apple's long-standing behaviour). Apple requires purpose strings that "clearly and completely describe your use of the data" (S2, 5.1.1(ii)).
Proposed string:
> {app} looks at the dates and small previews of your pictures to show you days you may want to write about. Nothing is uploaded unless you attach a picture to a letter.
It must be true for every user, so it is true only while R3 and R4 hold, and it must not contain a banned phrase (F7). `permissions.en.ts` and `permission-copy.ts` both carry strings today, and a drift test guards them (S11 gap 7). Layer: C, R.

MT-X2-R11. Route A has no photo string and no library permission.
Given Route A only, Then no `NSPhotoLibraryUsageDescription` is added (S3: the app "accesses only the suggestion data that a person explicitly authorizes"), the entitlement `com.apple.developer.journal.allow` is added by the capability (S4), and the button that opens the picker carries a title that "clearly describes the purpose" (S3). Proposed button words: "Choose from suggestions". Whether Journaling Suggestions needs any Info.plist key is UNVERIFIED (S3 and S4 name none). Layer: R, D.

MT-X2-R12. Location string.
Given no route reads location or asks for Location Services, Then there is no location purpose string and no `NSLocation*` key, and 5.1.5 does not apply (S2: it governs "Location Services" use). Given a later parent-typed place, Then no permission is involved (5.1.1(iv)'s own example is "manually enter an address"). Layer: U (build-config test, as `g6-production-flags-off.test.ts` does for photos).

MT-X2-R13. The BL-1305 guard flips with a decision, not silently.
Given the build-config tests that today fail on a photo usage string or the journal entitlement (S16 names `g6-production-flags-off.test.ts` and `preflight-forbidden-native.test.ts`), When the founder owns the reversal, Then the same PR changes those tests and says so. Layer: U.

### 4.5 App Review: photos, entitlement, notifications, kids

What Apple's rules say (S2, exact):
- 5.1.1(iii) data minimisation and the out-of-process picker (F4).
- 5.1.1(iv) no tricking or forcing; offer an alternative to anyone who declines (F6).
- 5.1.1(i) a privacy policy link in metadata and in the app that says what is collected, how and all uses; deletion and consent withdrawal.
- 5.1.1(ii) consent for collection; "an easily accessible and understandable way to withdraw consent"; purpose strings that "clearly and completely describe" use.
- 5.1.2(i) no use or sharing of personal data without permission; "clearly disclose where personal data will be shared with third parties, including with third-party AI".
- 5.1.2(ii) "Data collected for one purpose may not be repurposed without further consent".
- 5.1.2(iii) no surreptitious profile building.
- 4.5.4 push: not required for the app to function; "should not be used for promotions or direct marketing purposes unless customers have explicitly opted in ... via consent language displayed in your app's UI, and you provide a method in your app for a user to opt out".
- 2.3.1(a) new features described with specificity in Notes for Review; misleading marketing is grounds for removal.

MT-X2-R14. The ask is one plain tap, with a way out.
Given the tab shows the value page, When the parent taps the one button, Then one sentence says what is read, then Apple's sheet appears. When the parent taps Not now, Then the tab still shows value (our own prompts, typed days, the picture picker that needs no permission) and does not ask again from our UI. Layer: E, D.

MT-X2-R15. Nothing is gated behind the permission.
Given permission is denied, limited or restricted, When any other feature is used, Then it works exactly as before (5.1.1(iv), 5.1.2(i) as read in S2). Layer: E.

MT-X2-R16. Purpose is not drifted.
Given the library read exists to show days to write about, When a later feature wants to use the same read for anything else (ranking by who is in a picture, ads, a notification chosen by library signal), Then it is refused unless a fresh consent exists (5.1.2(ii)). Layer: R, U (a denylist of call sites).

MT-X2-R17. Review notes are specific.
Given a build with the tab, When it is submitted, Then the Notes for Review say which route, what is read, where it stays, that permission is optional, and give a demo account with the fictional family Asha, as the label doc checklist already requires for sign-in (S8, section 6). Layer: R.

MT-X2-R18. Journaling suggestions entitlement.
Given Route A, Then the entitlement is added with the Xcode capability (S4). Whether Apple reviews or approves it, and whether the Developer Program License Agreement "sensitive content" terms (S3) add duties, is UNVERIFIED. Default: do not ship Route A until a test build with the capability has been through App Review and the reply is on record. Also: iOS 17.2 and later (S4, S5), while the project minimum is iOS 17.0 (brief), so the button must hide below 17.2 and the tab must still work. Layer: D, R.

MT-X2-R19. Copycat and look-alike risk.
Given the founder's direction is to "learn from this", When we ship, Then our layout, words, icon and names are our own: 4.1(a) says "Come up with your own ideas" and 4.1(c) bars another developer's brand or product name. Route A's sheet is Apple's own and is fine to present. We never name Apple's feature in a way that suggests we are it. Layer: R.

### 4.6 Kids and family rules

What the rules say (S2, S9):
- 5.1.4(a): care with kids' personal data; apps may ask for a birthdate and parental contact only to comply with statutes; "must include some useful functionality or entertainment value regardless of a person's age"; apps intended primarily for kids should not include third-party analytics or advertising.
- 5.1.4 (remainder): an app that collects or can share personal information, "photos, videos, drawings", from a minor must have a privacy policy and comply with children's privacy statutes; "Apps not in the Kids Category cannot include any terms in app name, subtitle, icon, screenshots or description that imply the main audience for the app is children" (guideline 2.3.8 as quoted there).
- Our policy (S9, section 8): the app is for adults aged 18 or older, children do not use or sign in, and what we hold about a child comes from the parents.

MT-X2-R20. The tab is an adult surface.
Given the tab shows pictures that include a child, When it is built, Then it is behind the same 18-plus agreement as the rest of the app, is not placed in the Kids Category, and no store text says "for kids" or "for children". Layer: R.

MT-X2-R21. No face or age signal.
Given a library picture, When we group it, Then we use time only. No detection of a child, a face, an age, a scene or a person, and no "baby" classifier. This is also the constitution and the reason there is no machine title. Layer: U (denylist of Vision and face APIs in the build, as the photo tests do for other symbols).

MT-X2-R22. A child's picture is the parent's, not ours.
Given a picture of a child is attached to a letter, Then it is Content class (C) in `docs/legal/DATA_CLASSIFICATION.md` section 4, never in analytics, logs, crash reports, push payloads, URLs or support prefill (LEGAL-REQ-014, DATA-REQ-004). Layer: U. Classification row: `privacy` and `data-architect` own it; not changed here.

MT-X2-R23. Other people in a picture.
Given a picture has an adult or another child in it, Then we do nothing different; we never identify them. The policy's co-parent line is unchanged: a co-parent can read the letters in a shared book. If an attached picture shows a third person, that is the parent's own content. Question for counsel (CQ-X2-3): does a shared-book picture of another family's child need a line in the Terms. Default: yes, one line, under the existing content clause. Layer: R.

MT-X2-R24. No third-party SDK on this tab.
Given 5.1.4(a) and 1.3 mention third-party analytics, Then the tab adds no analytics or ad SDK, no tracking and no ATT prompt (LEGAL-REQ-016). Layer: U (the denylist BL-117 is not yet proven in CI, per S11 gap 4 and follow-up 6.1; that remains open).

### 4.7 Notification and email policy

Founder direction (brief UPDATE): the same signal should shape in-app cards, local push and email. The standing rulings, from the brief: ML-3 no push is created from library data; NS-32 budget; NS-51 neutral wording; no thumbnail in a notification; quiet hours; the server never sees the library.

Policy read in one paragraph: in-app cards and local push can use library signals under strict conditions that need a founder reversal. Remote push and email cannot, because that requires data derived from the library to leave the phone, which makes it collected data about the parent's pictures (see F1 and R6).

MT-X2-R25. In-app cards.
Given the parent has turned the tab's library read on, When the tab opens, Then cards may use library days. Given the parent has not, Then cards use only typed days, age days from the child's date of birth, a year ago from our own letters, and the 111 written prompts. No card counts, names a gap or says "again" or "still" (S12 R12). Layer: C, E.

MT-X2-R26. Local push from the library is a reversal.
Given NX-39 ruling 3 and K1 forbid any library-derived notification (S16, reading NX-39), and NS-51-R11 already proposes a narrow neutral exception (S12), When the founder owns it, Then the only allowed form is: scheduled by the phone only while the app was open (Q-PM-8, no background mode); fixed neutral words identical to an ordinary evening reminder; no picture, place, date, count or identifier; the tap opens the tab, not a day; counted in the one-a-day budget (NS-32-R1) and silenced by a letter already made that day (NS-51-R13); off when the library read is paused or off (R15, R16); never marked in analytics. Layer: U, D.
Why identical words: "a notification that exists because of a library read discloses a derived fact by existing" (S16 quoting NX-39). That sentence is a quote from another document that I did not open (UNVERIFIED by me). The reasoning stands on its own: a person who can see the lock screen can infer.

MT-X2-R27. Push permission and consent language.
Given Apple 4.5.4 (S2), When any nudge is promotional in character, Then there is in-app consent language and an in-app way to turn it off. The existing reminder card after the first saved letter and the Reminders settings page are the consent and the opt-out. A nudge from the tab is a reminder the parent already chose, not marketing; the tab never adds a new push ask (K-02, S16). Push is never required for the app to work. Layer: D, E.

MT-X2-R28. Opt-in states for nudges, per channel.

| State | Local reminder (existing) | Library-timed reminder (if reversal owned) | Email |
|---|---|---|---|
| Never asked | none | none | none beyond transactional |
| Asked and said yes (the parent's own choice) | evening reminders per the Reminders page | only if the parent separately turns on "Use my pictures to time reminders" (default off, own switch) | only the emails the parent asked for |
| Said no or denied in iOS | none | none | unchanged |
| Library read off or paused | unchanged | removed at once | unchanged |
| Signed out or account deleted | local reminders removed on this device | removed | none |

Each state needs one test that proves the nudge is absent. Layer: U.

MT-X2-R29. Email never uses the library.
Given the server never sees the library, When any email is chosen, timed or worded, Then no library signal is an input. If the phone told the server "this parent has pictures from the weekend", that is derived data leaving the device; Apple's definition treats derived data sent off device as its own question (see R6). Layer: U (the email scheduler has no library input; a test enumerates its inputs).

MT-X2-R30. Email and the child's date of birth is a reversal.
Given CATALOG says "no child-anchored emails at all" (S13) and the founder's UPDATE implies "age days" in email, When the founder owns it, Then the minimum is: separate opt-in, per child, pausable; no child name in the email provider (the provider reason in CATALOG line 161); wording neutral for hard days; the first commercial email also needs the commercial footer in R32. Default (Q6): not reversed. Layer: R.

MT-X2-R31. Which emails are commercial.
Given S13's primary-purpose test and S7, When an email's job is to nudge a parent to open the app or write a letter, Then treat it as commercial unless counsel says otherwise. CATALOG classifies `family-digest` (opt-in, service content) as transactional with a one-click unsubscribe (S13 line 84), and lists newsletters as commercial. A "come and write" nudge is not on that list. Default: commercial, opt-in only. Counsel must confirm. Layer: R.

MT-X2-R32. Commercial footer and unsubscribe.
Given a commercial or subscription email, Then it has: a clear, conspicuous way to opt out; a postal address (a PO box or private mailbox, never a home address, D-004); an opt-out honoured within 10 business days (S7; S13 targets 48 hours); a signed, per-recipient, per-list link that is the same as the `List-Unsubscribe` header (RFC 8058), working for at least 30 days (the contract in `legal.en.ts`, S13). The unsubscribe is one step, no login, no reason asked. It never touches transactional mail. Penalties run "up to $53,088" per email (S7: the figure on the FTC page this session). Layer: U, R.

MT-X2-R33. Consent record for nudge email.
Given a parent opts in to nudge email, Then the app records the time, the version of the words shown, and the list, in the existing consent pattern (`packages/analytics/src/consent.ts` and `policy_acceptances` for policies; a new list-consent record would be `data-architect`'s). Layer: U, R. I have not read the `policy_acceptances` migration (UNVERIFIED).

MT-X2-R34. Quiet hours and budget apply to every channel.
Given NS-32-R1 (at most one budgeted notification a local day) and the quiet window in S15, Then in-app badges and the nudge email count toward the same daily story: one reason to come back, not three. Defaults: a parent who gets a local reminder that day gets no nudge email that day. Layer: U.

What brings a parent back every day without streaks or gaps (policy view only; product owns the design): a card that shows something of theirs, a year-ago letter, a typed day coming up, or a written prompt. It is never a count, never "you haven't written", never a score (S12 R12, CLAUDE.md content rules).

### 4.8 What we never do: in-product lines (draft for `content`)

These are statements the tab can show. Each avoids the banned phrases in F7 and each maps to a test.

| # | Draft line | Proved by |
|---|---|---|
| N1 | We read the dates of your pictures on your phone. We do not receive them. | R3 network fake, zero requests |
| N2 | We never look at who is in a picture. | R21 denylist of face and Vision APIs |
| N3 | We never read where a picture was taken. | R12, R9; no place APIs, no geocoder |
| N4 | We never write a title or a caption for you. Your words are yours. | constitution; `verifyEdits`; no title field filled by a machine |
| N5 | We never use your pictures for ads, and we never use them to train models. | R5; no ad SDK; policy |
| N6 | We do not count your pictures or the days you did not write. | NS-51-R12 content test |
| N7 | You choose which pictures we can see. You can change it in Settings at any time. | NS-51-R14, R18 |
| N8 | Say no, and nothing else changes. | R15 |
| N9 | A reminder never shows a picture or a place. | R26 |

Check against banned words: none uses "stays on this phone", "never leaves", "no one else", "only you can read" or "no accounts". N1 and N3 are the form that survives. Whether N1 may stand where a letter with an attached picture syncs is a counsel question (R4).

### 4.9 Store listing: claims allowed and forbidden

The rules: 2.3.1(a) misleading marketing is grounds for removal; 2.3.7 metadata should not include "terms ... not specific to the metadata type" (S2); 5.1.4 no child-audience terms outside the Kids Category; the store listing never says "beta" (S10); the trust promise on the listing is "private, never sold, never used for ads, never used to train machine learning models" (S10, Trust promise row).

| Allowed (if code proves it) | Forbidden |
|---|---|
| "Find a day to write about from your own pictures." | "Your pictures never leave your phone", "stays on your phone", "no one else sees them" (banned in F7; untrue if a picture syncs) |
| "Your pictures are not sent to us unless you attach one to a letter." (only while R3 and R4 hold) | "Private by design" or "end-to-end" about pictures (S10 section 2 bars "end-to-end" for letters and backup) |
| "Choose which pictures the app can see." | "AI finds your best moments", "smart memories", "auto-titles", "we write it for you" (constitution; nothing implies AI writes anything) |
| "Prompts from the day, the month, and your own letters." | "Never miss a day", "don't forget", "streak", counts of pictures or days (content rules) |
| "No ads. No selling your data. Never used to train models." | "Works like Apple Journal", any use of Apple's feature name as ours, any mention of another developer's product (4.1(c)) |
| Screenshots with the fictional family Asha only | Any real child, real face or real place in a screenshot or preview; the founder's reference screenshots |
| "For parents" | "For kids", "for children", "family photos app" suggestions of a kids audience (5.1.4 remainder) |
| "Works without photo access." (true if R15 holds) | "Requires photo access" or any wording that makes the permission a condition |

The App Store description's "Privacy" paragraph and the privacy nutrition label must agree line by line (S8 section 6 checklist). A screenshot that shows the Apple picker sheet is Apple's UI and needs a counsel and design check before it is used as marketing (UNVERIFIED: I read no Apple page on showing system sheets in screenshots).

## 5. Reversals the founder owns (policy lens)

Each is "PROPOSED to reverse", never decided here. The brief lists the first five; I add six and seven.

| # | Earlier ruling | What the tab does | My default |
|---|---|---|---|
| 1 | BL-1305: no photo usage string or PhotoKit call in any 1.x build | Route B needs both | Reverse for Route B only, behind a flag, with R6 to R10 and R13 |
| 2 | K-02: no permission ask in first run | A tab that asks | Not reversed: tab shows value only until the first saved letter, then one tap to ask |
| 3 | ML-6: cards show a date, never a place or thumbnail | Thumbnails in the tab | Reverse "no thumbnail" inside the parent-opened tab only; "no place" stays |
| 4 | J4: only Home starts a letter | A tab that starts a letter | Product and design; no policy objection if consent is unchanged |
| 5 | Three-tab ruling | Fourth or fifth tab | Product and design; no policy objection |
| 6 | NX-39 ruling 3 / K1 / ML-3: no library-derived notification | A nudge timed by the library | Reverse only in the identical-words form (R26), separate default-off switch; else not |
| 7 | Email: no child-anchored email (CATALOG line 139 and 161, D-022) | Age-day email | Not reversed (Q6) |

## 6. Edge and unhappy paths

- Permission asked, then revoked in Settings: the read stops; the index is emptied; any pending library-timed reminder is removed (NS-51-R15, R16); no banner nags (R19).
- Limited access with a tiny selection: nothing shown, no message (NS-51-R18).
- iOS below 17.2: the Route A button is absent; Route B and the written prompts work (S4, S5).
- Journaling Suggestions switched off by the parent in Settings, or categories narrowed: Apple controls this (S6); our tab does not argue with it and does not say why the picker is empty.
- The picker returns a suggestion containing a Contact, Location or State of Mind item: dropped at the boundary; never stored; never logged (F5, R7). A test feeds each item type.
- A title comes back with the picture: shown only as Apple's words, and copied only on the parent's own tap, after which it is the parent's text (the existing NS-49-R9 card behaviour, S16). Default for this tab: not shown at all.
- Account deleted: reminders and any indexed list are removed; nothing about pictures exists on the server to delete (R3), which is the privacy story. If a picture synced (R4), the existing deletion spec (`docs/legal/DELETION_AND_EXPORT_SPEC.md`, not re-read this session) must cover it. UNVERIFIED.
- Export: a picture the parent attached is part of an export if it is stored (BL-868, PR #1215, read only by title).
- Screenshot or app-switcher snapshot of the tab shows a child's face: NS-51-R25 replaces thumbnails with an opaque box before the snapshot (S12). Policy line: we say this plainly in security, not as a promise to the parent.
- A parent denies notifications and still opts in to email: allowed; they are separate channels.
- A parent unsubscribes from nudge email: transactional email still arrives (S13 rule 5); the in-app tab is unchanged.
- A parent on a shared book: the co-parent sees only letters, not the library read (S9 section 3, lines 53 and 54). The tab is per person.

## 7. Constitution, privacy and accessibility checks

Constitution: the policy lines above never promise a machine caption, title, place, name or summary. N4 says so. No line implies AI writes anything. No count or gap line appears. `{child}` is used where the child is named; none of my drafts needs a name.

Privacy: Content (C) and Sensitive (S) data never reach analytics, logs, crash reports, push payloads, URLs or support prefill (LEGAL-REQ-014, DATA-REQ-004). A picture, a date from the library, an identifier, a place or a count is C. R3, R22, R26 carry the tests.

Accessibility of the policy surfaces: the ask sentence and the Not now button are plain text in system type that scales to AX5; Reduce Transparency and Increase Contrast do not hide the sentence; VoiceOver reads the sentence before the button; the unsubscribe page is one button, no login (S13). I checked none of this on a device (UNVERIFIED); design leads own the proof.

Content rules: this file has no em or en dashes, curly quotes, ellipsis characters or emoji, and no model names. Proposed lines avoid the F7 phrases. I did not run `rules.test.ts` against them (no `npm install`), so they are PROPOSED and unproven.

## 8. Notification and email decision summary

| Channel | Library signal allowed? | Why | If the founder says yes anyway |
|---|---|---|---|
| In-app card | Yes, after the parent's tap | Read and shown on the phone only | R25 |
| Local push | Only the identical-words form, own switch, default off | Existence discloses a derived fact; needs reversal 6 | R26 and R28 |
| Remote push | No | Server would learn the library signal | Label changes; CQ-13 in S16 |
| Email | No | Same; also CATALOG bans child-anchored email | Label changes; see R29 and R30 |

## 9. Counsel questions (new, beyond CQ-1 to CQ-15 in S16)

| Id | Question | Default |
|---|---|---|
| CQ-X2-1 | Is "We do not receive these" accurate for a parent whose attached pictures sync? | Say "unless you attach one to a letter" every time |
| CQ-X2-2 | Does a library-timed local reminder, in the identical-words form, need its own consent line? | Yes, own switch, default off |
| CQ-X2-3 | Does a shared-book picture of another family's child need a line in the Terms? | Yes, one line |
| CQ-X2-4 | Is a nudge email a commercial message under the primary-purpose test (S7, S13)? | Yes: opt-in, footer, address, unsubscribe |
| CQ-X2-5 | Does 5.1.4's "photos ... from a minor" reach an adult's photos of their baby? | Treat as no, but keep the privacy policy complete; counsel confirms |
| CQ-X2-6 | May screenshots show Apple's own picker sheet? | Avoid; use our own layout with Asha |

## 10. Dependencies

- Feasibility doc (route choice) decides which of R6 to R13 apply.
- `content`: parent words, one verb, the tab word (BRAND.md "moment" collision, F7).
- `legal` and the founder: edit `docs/legal/**` in the same build as behaviour (R1, R3, R6, R8).
- `data-architect`: classification row for a picture attached to a letter, and any list-consent table (R22, R33).
- `analytics`: no event or property may mark a nudge as library-driven; no library field of any kind (R26).
- `mobile`: network fake, leak scan, boundary test for item types, build-config tests (R3, R7, R13).
- `design`: the ask and Not now, and the opaque box for switcher snapshots.
- `release`: Notes for Review (R17), entitlement test build (R18), label and manifest rechecked per build.
- PR #1264 (the Home engagement wheel) and #1267: reconcile ML numbering and the NX-39 text.

## 11. Founder policy questions, each with a default

Deadline for each: before any build that carries the tab leaves the repo, and Q1 and Q3 before the feasibility route is frozen.

| Id | Question | Default | Why |
|---|---|---|---|
| Q1 | Which route first? | Route B behind a flag; Route A only after a test build clears App Review | We control the words; Apple's rules prefer the picker but the entitlement's review is unknown (R18) |
| Q2 | May the tab ask for the library on a tap before the first saved letter? | No; value page first, ask after the first letter | Keeps K-02; one reversal fewer |
| Q3 | May a picture the parent attaches to a letter sync? | Follow NS-52 Variant A (local only) for 1.x; if it must sync, accept Photos or Videos Yes on the label | The label story depends on it (R4, R8) |
| Q4 | A place on a day? | None; a parent-typed place on the letter only | Avoids the geocode question and Precise Location (R9) |
| Q5 | Do we show Apple's picker title? | No | Constitution; nothing machine-made shown |
| Q6 | May email use the child's date of birth? | No | CATALOG line 139 and 161 |
| Q7 | May a local reminder be timed by library days? | No for 1.x. If yes: identical words, own switch, default off | Reversal 6; existence discloses a fact |
| Q8 | Do we publish the new policy paragraph before the build? | No; same build | Claims must match code (R1) |
| Q9 | Store claim "Works without photo access"? | Yes, if R15 passes | True and reassuring |
| Q10 | Do we want a measured test of engagement before relying on the founder's belief that nudges from the library lift it? | Yes, with parents, with no library signal in any analytics | I found no evidence in the repo or this session's reading (S16 says the same); it is a belief to test, not a fact |

## 12. VERIFIED, UNVERIFIED, guess

VERIFIED this session (read, with source):
- Apple App Review text for 4.5.4, 5.1.1 (i to v), 5.1.2 (i to iii), 5.1.4 (a and the remainder), 5.1.5, 1.3 excerpts, 2.3.1, 2.3.7, 4.1, 4.2 (S2).
- The suggestions picker is a system process; consent sheet once per device; the entitlement is required and added by an Xcode capability; item types (S3, S4, S5).
- Apple's journaling suggestions privacy page: on-device processing; user controls (S6).
- CAN-SPAM points (S7).
- Repo files S8 to S15.

UNVERIFIED (not read, or only described to me):
- That the founder's screenshots are Apple's system sheet.
- Apple's 5.1.3 (health), 2.3.8 text beyond the quote inside 5.1.4, and anything past character 121052.
- Whether Apple approves or reviews the journal entitlement; whether any Info.plist key is needed; the DPLA sensitive-content section.
- Apple's App Privacy page definition of "collect" and the derived-data sentence: I rely on S8 (read 15 Oct by another author) and S16, not on a fetch this session. Same for the PhotoKit crash behaviour and the CLGeocoder network statement.
- Whether a map tile sends a region to Apple.
- The Apple privacy manifest key name for photos.
- NX-39 and ML-3 texts: I rely on S16 for them and could not find an "ML-3" row myself.
- That a picture attached to a letter does or does not sync (S11 says unverified).
- The `policy_acceptances` migration; the DELETION_AND_EXPORT_SPEC coverage of pictures.
- Any test: no npm install, no test run, nothing on a device. The proposed lines were not run through `rules.test.ts`.
- The status of the feasibility and design PRs; I read no `wip/moments-*` branch.
- Any law other than CAN-SPAM (COPPA, GDPR, CCPA, Washington's consumer health data law, TCPA for texts). Named but not read.

Guess (not sourced): that engagement improves from library-timed nudges; that a reviewer would question Route B once Route A exists; that nudge email is commercial.
