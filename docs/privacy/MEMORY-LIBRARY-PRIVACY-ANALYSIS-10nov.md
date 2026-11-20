# Memory Library: privacy, legal-risk and compliance analysis (10 Nov 2026)

Author: Privacy Engineer (`privacy`), a Claude role. Not a lawyer, auditor or regulator. Nothing here is legal advice. Counsel must read it before any user is told anything in it.
Status: DRAFT for the founder, `legal`, `regulatory-affairs` and counsel. Nothing is decided. Every wording proposal is marked "for counsel" and is not live.
Scope: the founder's Memory Library feature (10 Nov): the app reads the photo and video library and its metadata (date, place) to attach media to letters, to offer on-device suggestions, and to send local reminders around trips, festivals and holidays. Product requirements (NX-39) and the architecture decision are written in parallel by other agents; this file does not repeat them. It answers the privacy, legal-risk and compliance questions only.
Founder direction received 10 Nov: the NX-33 promise (picker only, no location, no library) is worth rewriting, because families' memories live in photos and videos. So this file proposes the new promise and the minimum conditions to make it true and lawful. The rewrite still needs counsel and the founder before any user is told it.
I did not edit `docs/legal/**` (founder-merge-only, D-125). Where a legal document or a requirement text needs a change, the change is proposed here.

## 0. What was read, and what was not

Repo (read 10 Nov 2026 on develop at `ae15dc93f`, plus the NX-33 branch `docs/nx-33-photos-8nov` at `2973722a`): `CLAUDE.md`; `docs/legal/DATA_CLASSIFICATION.md`, `data-policy.md`, `privacy-policy.md` (3.0.0), `app-store-privacy-labels.md` (2.1.0), `ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ-006, -007, -008, -012, -013, -014), `DELETION_AND_EXPORT_SPEC.md` (export section and DATA-REQ-024, -050, -053, -056), `compliance-register.md` (CR-001, -002, -014, -020, -022, -031, -032, -040, -083, -084, -100, -101), `COUNSEL_PACKET.md` (question index); `docs/engineering/04`, `05`, `06`, `07`; `docs/agents/COORDINATION.md` section 10; `packages/content/test/claims-capabilities.test.ts`; `packages/content/src` strings listed in section 9; `docs/store/compliance/permissions.md` and `privacy-labels-apple.md` (superseded, read for history); the exec council pass of 9 Nov (slice 3), read as background.

Not readable from this session, so nothing here relies on them: the Project docs (privacy-label proposal, store compliance review, CTO rulings); the NX-39 branch `docs/nx-39-memory-library-10nov`, the ADR branch `docs/adr-memory-library-10nov` and the benchmark branch `docs/research-memory-library-benchmark-10nov` (none was on `origin` when I fetched at the start of this run). If they say something different, theirs governs the product shape and this file governs the privacy conditions; reconcile in review.

External texts: each was opened in this session on 10 Nov 2026 unless marked UNVERIFIED. The exact list of what was read and what was not is in section 14.

## 1. Summary

### 1.1 The ten findings that matter most

1. The feature reverses three standing public statements. Privacy Policy 3.0.0 section 2 says "We do not collect your location ... contacts, photos". LEGAL-REQ-012 lists "precise or coarse location" as never collected. LEGAL-REQ-007 and the PRD non-goals say location is never requested. These stay true only if the media and its metadata never reach us. The whole design below is built so they can be kept true in a narrower, accurate form.
2. "On the device" is the load-bearing design, and Apple's own text supports it. Apple: "Data that is processed only on device is not 'collected' and does not need to be disclosed". The same sentence adds: "If you derive anything from that data and send it off device, the resulting data should be considered separately." So the rule for engineering is: nothing derived from the library (place, date, count, occasion, cluster, flag) goes to a server, an analytics event, a log or a crash report. One leak flips the label, the policy and several state laws.
3. Prefer the lowest-access route that does the job. Apple 5.1.1(iii): "Where possible, use the out-of-process picker or a share sheet rather than requesting full access to protected resources like Photos". Three routes are lower than full library access: the PHPicker (NX-33), Apple's Journaling Suggestions picker (iOS 17.2 and later, user-invoked, no permission prompt per Apple's talk, returns only what the person selects), and the limited library. Full library access should be the last choice and needs a named need (section 3).
4. Do not infer occasions. A chosen festival or holiday can reveal religion, ethnicity or culture: CPRA lists "religious or philosophical beliefs" and "racial or ethnic origin" as sensitive personal information; GDPR Article 9 lists the same; Apple's label lists "religious or philosophical beliefs" under Sensitive Info. The repo already treats spoken languages as sensitive for the same reason (data-policy.md: "languages spoken (proxy for ethnicity, PRD B-NFR-001)"). Recommendation: the person types their own occasions; the app ships no festival list, no default, no region-based ordering, and never reads the library to guess one; occasions stay on the phone and never appear in a notification by default (section 5).
5. Coordinates are the dangerous field, and the app does not need them. Precise geolocation is sensitive in California (within 1,850 feet) and a defined term in Washington (within 1,750 feet). A child's life includes the maternity ward, the NICU and the paediatrician. Recommendation: never store coordinates; never store a place name finer than a city; use an offline lookup so no coordinate goes to any geocoding service; never surface a point of interest (section 6).
6. Place-triggered resurfacing is where the product can hurt someone. "A year ago you were at the hospital" can land on a loss. Recommendation: surface by date only, never by place, and never push a media or place sentence (sections 6 and 8).
7. The constitution allows surfacing the person's own files and forbids sentences about their life. "Photos from 14 to 16 June" is a fact about files. "A year ago you were in Lisbon" is a claim the app makes about the person, from a guess. Ruling proposed in section 8.
8. There is a conflict in the legal requirements to fix before any build: `DELETION_AND_EXPORT_SPEC.md` section 4.2 lists `photos/<entry_id>.<jpg|heic>` as "original bytes", while LEGAL-REQ-013 and NX-33-R3 say stored photos carry no location or device metadata. An export of original bytes puts GPS into a plaintext ZIP that people hand to others (DATA-REQ-056). Proposed: the export carries the stored (stripped) copy. Founder and `legal` decide (section 7.4).
9. Many claims and checks become untrue or too narrow, and the claims test has no rule for photos or location yet. Section 9 lists the exact strings, documents and tests, and proposes two new rules for `claims-capabilities.test.ts` so the claim is false until the capability is on.
10. Three things are the founder's alone: the words of the new promise, the App Privacy label answers, and publishing (turning any phase on in `production`). None of the three is settled by this file (section 13).

### 1.2 Recommendation in one paragraph

Rewrite the promise from "no library, no location" to a narrower and more honest one: the app uses the dates and cities in your photos and videos on your phone, only when you allow it, never sends them to us, never looks at faces or people, and never guesses your religion or culture. Build in phases (P0 to P4). Keep every phase behind a build switch that is off in `production` until counsel has answered the questions in section 10 and the go/no-go list for that phase in section 12 is green. The first public phase should be P0 and P1 on the lowest-access route that works on a device. P4 (occasion reminders) ships only in the typed-by-the-person form. Full library access and any server copy of media are separate decisions that reopen every answer in this file.

## 2. What data the feature touches, and its class

Classes follow `DATA_CLASSIFICATION.md` (L1 to L4; C content, S sensitive, A account, T technical) and `data-policy.md` section 2. Classification decisions are mine; schema columns belong to `data-architect`. "Leaves device" means leaves the phone to us or any processor of ours. Apple's iCloud device backup is Apple's service for the person and is noted separately.

| Data | What it is | Proposed class | Why | Leaves device? | Notes |
|---|---|---|---|---|---|
| Photo pixels | A child's face, home, other people | L4, C (and S where it shows health or a body) | `DATA_CLASSIFICATION.md` rule 6: anything that names or describes the child is L4; photos are listed L4 | No (P0 to P4) | A photo with a child's image is "personal information" in the COPPA definition (16 CFR 312.2 item 8) when collected from a child. Parents are the users, so it is not collected from a child (FTC FAQ F.4, read), but the app must stay adult-directed (CR-001) |
| Video pixels | Moving images | L4, C | As photos | No | Larger, longer, more people in frame |
| Video audio | Voices, including children and strangers | L4, C | A child's voice is personal information in COPPA terms (312.2 item 8: "a child's image or voice") | No | Never transcribed, never analysed for speakers (CR-040: no voiceprint, no diarization) |
| Other people in media | Faces and voices of non-users, including other children | L4, C | The person who adds them is the only one who can decide | No | Section 7.1 |
| Capture date and time | When the file was made | L3 as a day; time of day not stored | Day precision places a letter in a month of age. Time of day adds a pattern of life for little use | No | Stored with a letter only if the person keeps it |
| Coordinates (latitude, longitude) | Where the file was made | L4, S; must not be persisted | Precise geolocation is sensitive: CPRA 1798.140(ae)(1)(C) and (w), within 1,850 feet; Washington RCW 19.373.010(19), within 1,750 feet | No, and not stored on the phone either | Read in memory to pick a city, then dropped |
| Place name, city level | "Lisbon" | L4, S when attached to a letter about a child | Where a family lives or travels, or receives care, is sensitive in combination | No | Stored only if the person keeps it with a letter. Not a place history |
| Place name, point of interest | "St Mary's Maternity" | Not stored. If ever held in memory, L4, S | A health-facility name is a health and childbirth inference (CR-031; Apple lists "pregnancy or childbirth information" under Sensitive Info) | No | Never read from the system, never displayed, never stored |
| Device and file metadata | Camera model, lens, software, serial, file name, thumbnail, depth data | L3 to L4 | LEGAL-REQ-013 names device serial; file names such as IMG_1234 are a handle to the library | No | Removed by re-encoding (NX-33-R3) |
| Library identifiers | `localIdentifier` of an asset | L3, A | A pointer into the person's library, not content | No | Not stored after the copy is made (section 7.3) |
| Derived moments | Windows of days with media, with a count | L4, C | Data derived from content is L4 (the L4 row in `DATA_CLASSIFICATION.md` section 1) | No | Recommended: not persisted at all; compute when the screen opens (section 3.3) |
| Chosen occasions | A name, a date, a repeat rule | L4, S | A festival chosen by a person can proxy religion, ethnicity or culture. Same treatment as spoken languages | No, never synced | Section 5 |
| Occasion reminders | Scheduled local notifications | L3, A | The operating system stores their text and any `userInfo` | No | Neutral text; cancelled on withdraw and erase |
| Media consent act | document, version, action, hash of words shown | L2, per PRD R21 | `PRIV-R21` | Yes, the act only, at sign-in | Contains no media, place or date |
| A count such as "12 photos" shown on screen | Derived | L4, C | It is derived from the library | No | Not in analytics. Counts of what exists are allowed on screen (section 8) |

Two classification decisions I am making now, for the data map:
- Chosen occasions are S, device-only, and excluded from sync, analytics and insights. Precedent: spoken languages (`data-policy.md` row for device settings; `DATA_CLASSIFICATION.md` 4.5).
- A place kept with a letter is S as well as C. The person chose to keep it, so it travels with that letter on the phone and in the person's own export, and nowhere else.

## 3. The routes into the library, compared

The question the founder asked: how does Apple's Journaling Suggestions API compare with the picker, the limited library and the full library, for privacy? Facts below are from Apple pages read in this session; anything I could not read is marked UNVERIFIED.

### 3.1 Comparison

| | PHPicker (NX-33, P0) | Journaling Suggestions picker | Limited library (PhotoKit) | Full library (PhotoKit) |
|---|---|---|---|---|
| Permission prompt | None. WWDC20 talk: PHPicker "doesn't require the user to grant Photos Library access" and runs "in a separate process from your app" | None. Apple's tech talk: "Your app does not need to ask permission because it runs out of your App process" (transcript wording). Needs the capability and entitlement `com.apple.developer.journal.allow`, described by Apple as "An entitlement that enables an app to present the journaling suggestions picker" | Yes: the library prompt, with a "Select Photos" choice. Needs `NSPhotoLibraryUsageDescription`. Apple's page for that key says only: "A message that tells people why the app is requesting access to their photo library." | Yes: the same prompt, "Allow Full Access" |
| What the app can read | Only what the person picks: "Only what the user actually selected is passed back to your app" | Only the suggestion the person chooses and the assets they leave ticked: "your app will only receive the content of the suggestion they choose to add, nothing else" (tech talk) | Only the person's selection: "You will only be able to fetch assets and resources related to what the user has chosen for you to have access to" (WWDC20 talk) | Everything, including metadata of every asset |
| Date and place of media | The file the app receives. Whether it carries date and place depends on the representation; NX-33 strips them. UNVERIFIED which fields PHPicker returns without a library identifier | Yes, for chosen items. The `Location` asset exposes `city`, `place`, `location` (a `CLLocation` with coordinates), `date`, `isWorkLocation` (Apple's page). The app can decline to read them | Yes, for the selection. Whether `PHAsset.location` is returned for limited selections: UNVERIFIED (the WWDC20 transcript is silent) | Yes |
| Who decides which events appear | The person, by hand | The system (iOS "can sense meaningful events"), under five system switches the person controls (Activity, Media, Contacts, Photos, Significant Locations) in Settings, Privacy and Security | The person, by selection | The app |
| Can it run in the background or push | No | No. It is a view the person opens | Yes, with a change observer, once authorised (UNVERIFIED in detail) | Yes |
| Other asset types that ride along | None | Yes: workouts, contacts (with their profile photo), songs, podcasts, motion activity, State of Mind (iOS 18). The app asks only for the types it wants | None | None |
| App Review fit | Apple's stated first choice (5.1.1(iii)) | Out-of-process, so in the same spirit. Entitlement approval path UNVERIFIED | Needs a stated reason; WWDC20: "reconsider if you're app needs to use photo library access at all ... For most apps the answer is no" | Needs a strong stated reason ("a backup service" is Apple's own example of strong need) |
| Effect on App Privacy label (Apple text) | None while processing stays on device | None while processing stays on device. What the system itself does is Apple's | None while processing stays on device | None while processing stays on device; the biggest trust and breach cost |
| Support in our stack | Expo image picker (NX-33 lists it, not yet a dependency) | UNVERIFIED. It is a SwiftUI view; a React Native app needs a native module. Not checked | Native module or Expo media library: UNVERIFIED | Same |

### 3.2 What this means

- Apple's Journaling Suggestions is the closest match to "the app offers photo and place suggestions without full library permission". It gives the founder a suggestions feature without the app ever seeing the library. It does not give what the founder asked for as reminders: it cannot run unseen, so "a year ago" would appear only when the person opens it. Reminders around trips and festivals therefore cannot be library-driven on the lowest-access routes. They can be date-driven from days the person chose (section 5) or from the dates of their own letters.
- Journaling Suggestions hands over more than we want. A `Contact` asset carries a person's profile photo. `StateOfMind` is a mental-health signal. Workout and motion data are health data. The `Location` asset carries coordinates and an inferred work flag. Rule: the app requests only photo, Live Photo, video and, if at all, city text; it never calls `content(forType:)` for any other type; it drops `isWorkLocation`, `location` coordinates and `place` immediately. Apple 5.1.3 and 5.1.2(vi) are strict on health data and on data from "depth and/or facial mapping tools (such as ARKit, Camera APIs, or Photo APIs)", which "may not be used for marketing, advertising or use-based data mining".
- Where the suggestions are computed (on the phone or elsewhere) is not stated on any page I could read. UNVERIFIED. If counsel wants the claim "nothing leaves the phone" the claim must say "nothing leaves the phone because of us"; what Apple does inside its own feature is Apple's (section 9, claim wording).
- The limited library and the full library both let the app read metadata of many assets. The limited library is the better fit for a "metadata chips" phase (P1), because the person has chosen what is visible. Its weakness: a thin selection makes "a year ago" poor, and iOS re-prompts to keep or change the selection (WWDC20: "once per app lifecycle when they first fetch assets", suppressible with `PHPhotoLibraryPreventAutomaticLimitedAccessAlert`).
- The full library is the only route that can find "a year ago" on its own. It is also the route with the largest trust cost. Recommendation: no-go for any phase unless the founder and counsel accept the cost in writing (section 13, D-B).

### 3.3 Recommended order of preference (for the architecture decision)

1. PHPicker for "add one photo or video". No permission. P0.
2. Journaling Suggestions picker for "offer me suggestions", if a native module and the entitlement are workable. No library permission. Evaluate in the architecture decision; I could not verify the entitlement approval, Expo support or on-device computation.
3. Limited library for date-window chips in the add-media screen, shown only when the person opens that screen.
4. Full library: last, with a named need and the founder's written decision.

Minimisation rules for every route:
- Pull, not push. Media or place is read when the person opens a screen, held in memory, and dropped when they leave.
- No persistent moments index in P1 to P3. If speed forces a cache, it holds opaque asset identifiers and UTC time bounds only, no place, no coordinates, no names; it is excluded from backup, rebuilt on demand, and wiped on erase and on withdrawal.
- No home or work inference. A trip needs a "home" to be a trip; inferring home is a street-level location profile. The app shows windows of days with media and lets the person decide what they are.
- No face detection, no People albums, no scene or object labels, no Vision framework, no captions (CR-040 added by 1.1.0: "no face detection, landmarking or recognition, including OS frameworks used for auto-crop or smart layouts"; NX-33-R4 scan). This is a hard rule for every phase.
- Hidden and Recently Deleted albums are never read. (Whether the default fetch already excludes hidden assets: UNVERIFIED, from memory.)
- Originals in the library are never changed or deleted. The app asks for no delete or add permission.

## 4. Legal bases and obligations to check

This section lists what to check and what I could read. It does not conclude. Counsel decides every applicability question.

### 4.1 COPPA and the 2025 amendments (16 CFR Part 312)

Read: 312.2 on Cornell LII (definitions); Federal Register 22 Apr 2025 (effective 23 Jun 2025; compliance date 22 Apr 2026, per the excerpt I could read); FTC COPPA FAQ (page metadata last modified 10 Jul 2026).
- "Child means an individual under the age of 13." "Personal information" includes "(8) A photograph, video, or audio file where such file contains a child's image or voice;" "(9) Geolocation information sufficient to identify street name and name of a city or town;" and "(10) A biometric identifier ... such as ... voiceprints; gait patterns; facial templates; or faceprints".
- FAQ F.4: "COPPA only covers information collected online from children." The FAQ treats photos an adult uploads on a general-audience service as outside COPPA; a service "primarily directed to children" must assume the uploader is a child. Our users are adults (D-006) and the child is the subject of the book (PRIV-R19).
- Edge to watch (CR-001 edge 1): anything that lets a child use the media, record, or browse the library. Read together is the child-facing edge. Media must not appear in Read together as a place a child roams, and no media screen may carry analytics ids from that surface.
- Biometric identifiers (faceprints) are in the definition after the 2025 amendment (Federal Register text read). Another reason for the no-face rule.
- UNVERIFIED: the amendments' written security programme, retention policy and separate third-party disclosure consent (the excerpt I could read did not describe them; CR-001 summarises them from a secondary source); the mixed-audience definition.

### 4.2 GDPR and UK GDPR

Read: Article 9(1) and 9(2)(a), (e) on gdpr-info.eu (an unofficial reproduction; EUR-Lex was not opened). Not read: Article 8, the recitals, UK GDPR.
- Article 9(1): processing of personal data "revealing racial or ethnic origin ... religious or philosophical beliefs" is prohibited unless an exception applies; 9(2)(a) is explicit consent.
- Launch geography is the US storefront only; no EU or UK targeting (CR-100 and the register's launch-geography recommendation). So GDPR is not engaged by design. The residual risks CR-100 names (an EU or UK relative using a web page) do not change with media.
- Article 8 (a child's consent for information society services offered to a child): not engaged, because the users are adults and the child is not a user. UNVERIFIED (Article 8 not read).
- Photos are not special-category data on their own; processing "for the purpose of uniquely identifying a natural person" (biometric) is. The no-face rule avoids it. UNVERIFIED (recital 51 not read).
- Counsel question: whether on-device processing by the app maker counts as the maker's processing at all (the household exemption protects the person, not us: CR-101 says the same for DPDP).

### 4.3 CCPA and CPRA

Read: Civil Code 1798.140 on leginfo (amended by AB 947, effective 1 Jan 2024).
- Sensitive personal information (ae)(1) includes "(C) A consumer's precise geolocation" and "(D) A consumer's racial or ethnic origin, citizenship or immigration status, religious or philosophical beliefs". Precise geolocation (w): "any data that is derived from a device and that is used or intended to be used to locate a consumer within a geographic area that is equal to or less than the area of a circle with a radius of 1,850 feet".
- Business thresholds in (d)(1): the statute text I read says "twenty-five million dollars ($25,000,000)", while the register (CR-014) cites $26,625,000 after CPI adjustment. The adjustment was not re-read. At launch we are below every threshold (CR-014), but the register's plan is to build to the baseline anyway.
- Design consequence: coordinates are exactly the field the statute names. Keeping them off the server and off the disk keeps the question moot. A city is larger than a 1,850-foot circle, so a stored city is not "precise geolocation" on the face of the definition; counsel confirms (Q9).
- UNVERIFIED: the definition of "collect" (1798.140(f)) and whether data that stays on a phone is "collected" by the business; the right to limit use of sensitive personal information (1798.121).

### 4.4 Other state laws (including Washington My Health My Data)

Read: RCW 19.373.010 definitions. Not read: the rest of the chapter, other states' statutes.
- Washington defines "Precise location information" as "within a radius of 1,750 feet" and lists, among consumer health data, precise location information "that could indicate an attempt to obtain health services or supplies" (my paraphrase of the long text) and "Biometric data". Photos taken at a maternity ward or a clinic fit the shape of that concern. Washington has no revenue threshold (CR-031). Relevance: real but conditional on the data being collected by us. On-device-only processing is the mitigation; whether it is enough is a counsel question (Q10). Register CR-031(j) already lists voice recordings and face imagery in Washington's "biometric data" conservatively.
- Connecticut (CR-020): applies to any controller "processing any sensitive data" from 1 Jul 2026; sensitive-data consent is already in place for letters (LEGAL-REQ-006). Whether precise geolocation and religious belief are sensitive data in Connecticut's text: UNVERIFIED (text not read; the register says consent is required for sensitive data).
- Most state laws (CR-022) require opt-in for sensitive data. A server copy of any place or occasion would need that consent. Another reason to keep both on the phone.
- Geofencing near health facilities: the register records a Connecticut geofence ban (CR-032). Washington's and others' geofence provisions: UNVERIFIED. Not engaged unless we use location to target; we do not.

### 4.5 Apple rules

Read: App Review Guidelines page, characters 0 to 100,000 of 121,490 (no date shown; the page is truncated inside 5.1.4(a), so the rest of 5.1.4 was not read); App Privacy Details page (not truncated).
- 5.1.1(ii): "Ensure your purpose strings clearly and completely describe your use of the data." "Apps must also provide the customer with an easily accessible and understandable way to withdraw consent."
- 5.1.1(iii): "Apps should only request access to data relevant to the core functionality of the app ... Where possible, use the out-of-process picker or a share sheet rather than requesting full access to protected resources like Photos or Contacts."
- 5.1.1(iv): "Apps must respect the user's permission settings and not attempt to manipulate, trick, or force people to consent to unnecessary data access ... Where possible, provide alternative solutions for users who don't grant consent." Consequence: every phase works without library access; P0's picker stays available.
- 5.1.2(i): no use, transmission or sharing of personal data without permission; "Your app may not require users to enable system functionalities (such as push notifications, location services, tracking) in order to access functionality". Reminders and library access are always optional.
- 5.1.2(ii): "Data collected for one purpose may not be repurposed without further consent". Media metadata read to suggest media for a letter is not reused for anything else (insights, ranking, marketing).
- 5.1.2(iv): no building a contact database from Contacts or Photos. 5.1.2(v): no contacting people from Photos or Contacts data except on the user's individualized initiative. We do neither.
- 5.1.2(vi): data from "depth and/or facial mapping tools (such as ARKit, Camera APIs, or Photo APIs) may not be used for marketing, advertising or use-based data mining, including by third parties". Our insights loop (`packages/analytics`) must never receive anything derived from the library.
- 5.1.3: health and fitness data rules. Journaling Suggestions workout and State of Mind assets are out of scope for us.
- 5.1.4 (kids): read only (a); the app is adult-directed and not in the Kids Category (CR-002). Remainder UNVERIFIED.
- 2.5.x: nothing on photos or location in the items I read. 2.5.1 (public APIs only) and 2.5.4 (background location is permitted only for its intended purpose) were read. We use no device location and no background location. 2.5.14 (explicit consent when "recording, logging, or otherwise making a record of user activity") is about camera, microphone and screen recording, which is not this feature.
- The label. Apple's definitions, read: "'Collect' refers to transmitting data off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time." Types: "Photos or Videos: The user's photos or videos"; "Precise Location: ... same or greater resolution as a latitude and longitude with three or more decimal places"; "Coarse Location: ... lower resolution than a latitude and longitude with three or more decimal places"; "Sensitive Info: Such as racial or ethnic data ... pregnancy or childbirth information ... religious or philosophical beliefs". The on-device exception: "Data that is processed only on device is not 'collected' and does not need to be disclosed in your answers."
- Reverse geocoding. Sending a coordinate to Apple's geocoding service (CLGeocoder or MapKit) is a network call that carries a location off the device. Whether Apple treats that as our collection, or as the platform's, is UNVERIFIED (I did not read Apple's geocoder documentation). Recommendation: avoid the question with an offline city lookup (section 6.2).
- iCloud Photos. A full-resolution fetch of an asset that lives only in iCloud makes the system download it. That traffic is Apple's, not ours, but it means "never leaves the phone" is the wrong sentence. Use "we never receive it".

## 5. Festival and holiday reminders

### 5.1 The risk

Choosing Diwali, Eid, Hanukkah, Lunar New Year, Easter or Vesak says something about a person's religion, ethnicity or culture. Inferring it from the library (a photo of rangoli, a hijab, a menorah) or from locale, language or region is worse: it is a guess about a protected characteristic. The same words appear in CPRA (ae)(1)(D), in GDPR Article 9(1) and on Apple's Sensitive Info line. The repo already decided the same for languages.

### 5.2 Recommended design (for the founder and counsel)

1. The app never infers an occasion. No library scan for dates that cluster, no photo content, no locale, no region, no spoken-language setting, no App Store storefront, no calendar import.
2. The person types an occasion: a name they choose, a date, and "every year" on or off. It works exactly like a birthday reminder. No list is shown, no default is ticked, nothing is ordered by region.
3. Moving festivals (lunar and lunisolar dates) are the product gap this leaves. Two ways to close it, in order of safety: (a) the person enters the date each year, and the app asks again the week before the old date passes, in neutral words; (b) a bundled, neutral table of dates for many traditions, shown as one alphabetical list with nothing pre-selected and no "popular for you". Option (b) is a founder and counsel decision; the table itself is public information, but a person's selection is the sensitive part. I recommend (a) for P4 and (b) only after counsel answers Q12.
4. Occasions are stored on the phone only, in a table that is outside every sync set, outside analytics and outside insights. A test proves the table is not in the sync contract.
5. Even on the phone this is risky in four ways: the lock screen, a shared or borrowed phone, Apple's device backup (a copy in the person's iCloud, which is Apple's service), and future sync creep. Each has a rule below. I judge the risk acceptable only with those rules.
6. A catalogue-driven "set up your family's festivals" step is not recommended even on the phone. If the founder wants it, treat it as a consent act with the four door lines (below) and take it to counsel first.

### 5.3 Notification content rules

For occasion reminders and any media-related nudge:
- No photo, thumbnail or attachment (`UNNotificationAttachment` is not used). No video frame.
- No place, city or coordinate.
- No occasion name by default. The default text is neutral and fixed. A per-occasion switch "Show its name in the reminder" is off by default and says: "Anyone who sees your lock screen could read it."
- No child name by default (the existing reminder planner already has a names setting; occasion reminders follow it and default to off).
- No count of media, and no "you have 14 photos from last year".
- `userInfo` holds an opaque id only, never a name, date or asset identifier, because the system stores it.
- Local notifications only. No server push carries any of this (no push is built; if one is, it carries none of it).
- Reminders can be turned off in two taps (LEGAL-REQ-008), and withdrawing media access cancels every pending occasion and media nudge.
- The words are courtesy words, never guilt, never a gap count (CLAUDE.md content rules). Example neutral text, for `content` to own: "A day you chose is here. Add a letter if you like."

### 5.4 Door lines (PRIV-R21) for the occasions step

- Shown: a one-screen explanation with the exact words by `packages/content` key and a versioned link. Draft, for counsel: "Occasions you add stay on this phone. We do not guess them, and we do not send them anywhere."
- Records: a local consent act `occasions` (document, version, action, method, surface, phone time, app version and build, OS major, platform, language, hash of the words shown), uploaded unchanged at first sign-in, deleted on Erase everything (as BL-579 does for other pre-account acts).
- Never: any occasion name, date or choice in analytics, logs, crash reports, push payloads, URLs, support prefill, or the consent record's `context`.
- Decline and withdraw: No or Not now adds nothing and does not re-ask. Withdrawal deletes every occasion and cancels every pending reminder in two taps. Export and deletion still work.

## 6. Location

### 6.1 Store a place name, not coordinates

- Coordinates are read in memory only, to choose a city, and dropped. They are not written to SQLite, files, logs, caches or the consent record. A test fixture proves 0 coordinates on disk after use.
- A place name is stored only if the person keeps it with a letter (a visible chip "Lisbon" with a remove control). The default for a new letter is no place.
- The finest place text is a city or locality. No point of interest, no street, no work flag.
- The capture date is stored as a day, not a time.

### 6.2 Reverse geocoding and the network

Apple's geocoders send a coordinate to a server. I did not read Apple's documentation for their data handling. UNVERIFIED. Recommendation: do not call a geocoder. Use a bundled, offline "nearest city" table. This keeps the sentence "no coordinate leaves the phone" true without asking Apple's terms. Open points for `security-architect` and counsel: the licence of the data (a geographic names dataset is data, not code, so the MIT, Apache, BSD or ISC rule in SEC-R07 does not obviously apply; attribution may be required), the size added to the app, and accuracy near borders. For Journaling Suggestions, use its `city` text only and ignore its `place`, `location` and `isWorkLocation`.

### 6.3 Who else can see a place

| Who | P0 to P3 | Future |
|---|---|---|
| The author | Yes, on their phone | Yes |
| The co-parent | No. Letters sync as words only; `photo_path` stays null (NX-33-R16); a place chip is not synced | When media sync exists, the place chip is a separate switch per letter, off by default, and a new consent act |
| Grandparents and Read together | No | The same rule, plus: nothing from the library is shown in a child-facing view |
| Export recipients (the person shares their ZIP) | The person's own place chips only, as text, if the person kept them. Never coordinates. The photo is the stored, stripped copy | Same |
| Printed book and PDF | Not printed unless the person puts it in the text of the letter | A "print the place" switch, off by default |
| Anyone looking at the screen | The grid and chips are on screen. App lock and the app-switcher snapshot apply (NX-33 notes this is UNVERIFIED) | Same |
| The pixels themselves | A photo can show a street sign or a house number. No stripping step removes that. The consent sheet should say so in one line | Same |

### 6.4 Never build a location history

No timeline, map, heat map or "places you have been" list of a child's life or the parent's. That would be a location profile. The app shows media windows by date, with an optional city chip. Counsel to say whether a city chip kept on a letter changes anything (Q9).

### 6.5 Sharing and export stripping

- The stored copy of a photo is re-encoded and has no Exif, XMP or IPTC segment (NX-33-R3). Videos need the same: container metadata such as QuickTime location and creation-date atoms, make and model, and any GPS track must be dropped on re-export. Whether the export API drops all of them: UNVERIFIED. Test: 0 of N fixture videos carry location or device atoms (byte scan).
- Both rules are enforced where the copy is made, not where it is exported, so no later export or share path can leak.
- If the founder wants an "archive with originals" export for families who value GPS in their own archive, make it a separate deliberate choice with a warning, never the default, and never in the normal share sheet.

## 7. Other people, minors, deletion, export, backup, device loss

### 7.1 Other people in media; minors' images

- Photos and videos contain bystanders, relatives and other people's children. The app cannot know who (no face detection) and should not try. The person adding the media is the only one who can judge.
- Default privacy: media is private to the author and the phone. Nothing in P0 to P4 shows media to anyone else.
- Copyright and consent are for the Terms: the person confirms they have the right to add what they add. A photo taken by a grandparent is the grandparent's copyright. Counsel to check Terms 4.0.0 (Q14, Q15).
- A child's image becomes the adult's data later. An 18-year-old may ask what an operator holds of their childhood. Counsel question for the long term (Q16). Today the answer is "on the parent's phone".
- Safety reporting. If media ever syncs to a server, the operator may be an electronic service provider with reporting duties under 18 U.S.C. 2258A (the register names the statute and says it was not opened). Ordinary photos of babies, including bath photos, are common in a parent's library. This is a hard gate on any server copy (Q17) and one more reason media stays local.
- Video audio may capture conversations. The user recorded it, not us. Recording-consent law (CR-041) is mainly the user's issue; counsel confirms (Q18). We never transcribe or analyse video audio.

### 7.2 Backup and the Free plan

- The app container is part of the person's iCloud device backup unless excluded (recordings today: D-033, "recommended"). So the sentence "Photos stay on this phone" is inaccurate. NX-33 itself notes the same iCloud behaviour as UNVERIFIED. Use the recordings' wording: "on this phone and in your iPhone's own backup, if you use one."
- A derived cache or occasion table is also in that backup unless excluded. Cache: exclude from backup. Occasions: they are user data; they ride with the device backup; the policy says so.
- Recording backup is built but off (`capabilities.backup`). NX-33 recommends P1: photos stay local. I agree. A server copy of media is a separate decision that needs: a new consent act, a label change (Photos or Videos: collected, linked, App Functionality), the safety-reporting answer (Q17), a purge path for storage (DQ-R17 is still hardcoded to `entry-photos`), and a restore drill.
- Free plan. NX-33 D5: a photo with a letter is Free. Keep it. Never make a person's own media a reason to upgrade. A lapsed plan never deletes keepsake content (C-NFR-008). Videos are large; a local storage budget and a "space on this phone" message are product points, not a reason to upload.
- Loss of the phone loses the stored copies. The originals are usually still in the person's Photos (UNVERIFIED for any one person). The app says so plainly and points to Export.

### 7.3 Erase everything, delete a book, delete the account (DATA-REQ-011, -024, -047, -053)

The new data must be in every erase path or the sentence "erased" is false:

| Path | Must remove |
|---|---|
| Take media off a letter | The stored file, its thumbnail, its place chip and date, after the Undo window |
| Delete a letter (Recently deleted, 30 days; Erase now) | Hidden at once; on Put back it returns; on purge the media, thumbnail, place and date go with it |
| Delete a book | Media of its letters; any cache entries for that child |
| Erase everything on this phone | The media folder, thumbnails, picker temporary files, export temporary files, the cache (if any), the occasions table, every pending local notification, the media consent record. 0 files and 0 rows. `resumeEraseAtLaunch` completes an interrupted erase |
| Delete account | The same device wipe by the existing path; on the server there is nothing to purge while media is local. If media ever syncs, `purge-worker` and the storage queue |
| Withdraw library access | The cache, pending nudges, the consent state. The stored media stays (it is the person's letter content); the suggestions and chips stop. Link to iOS Settings, Photos |
| The person turns Photos access to None in iOS Settings | The app detects the status on launch, hides suggestions, and keeps stored media |

Never: delete or alter the original in the person's library. Say it: "Your photos and videos in the Photos app are not touched."

Library identifiers are not kept after the copy is made, so there is nothing to "unlink".

### 7.4 Export (F15, DATA-REQ-050 to -056)

- The export holds the stored (stripped) media copy. The spec line "original bytes" needs to become "the stored copy" (proposal for the founder to merge; I did not edit `docs/legal`). Without this, DATA-REQ-056's plaintext ZIP could carry GPS.
- Each entry names its media file, size and SHA-256 (NX-33-R8). A place chip is text in the entry if the person kept it. Coordinates are never in the export.
- Occasions: the person's own data; include them in `account.json` under the person's choices, with the existing plaintext notice, or leave them out and say so. Counsel's call (Q13). They are not in anyone else's export.
- Export works offline, in every plan state, and before deletion (DATA-REQ-052, -053).

### 7.5 Device loss, shared phone, screen exposure

- File protection: the media folder uses the same class as letters and recordings (SEC-R15: `NSFileProtectionCompleteUntilFirstUserAuthentication`, as stated there; "complete" would be stronger and is a `security-architect` choice).
- App lock covers the add-media grid and the Photos tab. The app-switcher snapshot may show a photo: UNVERIFIED whether the lock blanks it; gate for P0.
- The add-media grid shows the person's other library items on screen (screenshots of IDs, medical letters). The app shows thumbnails only inside the picker or grid, keeps none, and never uploads them.
- The notifications rules in section 5.3 cover the lock screen.

## 8. The constitution: is "a year ago you were in X" compatible?

Rules in force (CLAUDE.md): "The machine may remove and repair. It may never add meaning." "No feature may write, rewrite, summarize or 'shape' a person's words." "Celebrate what exists; never count gaps." "Never imply AI writes anything." "Legacy is about love and time, never endings."

Proposed ruling (unnumbered; for the founder, `product` and `content`; number it in the rulings log):

1. Surfacing the person's own files is compatible. The app shows files that exist, with the file's own date, as an offer. That is neither a rewrite of their words nor a summary.
2. A sentence in the app's voice that states a fact about the person's life is not compatible. "A year ago you were in Lisbon" adds a meaning the files do not carry: a photo's place can be wrong, can come from a shared album or a download, and can be someone else's picture. It also says "you". So the surface says what the files say: a date range, a count of what exists, and (optionally) the city text as attached to the file.
3. The app never names the event. No "trip", "birthday", "festival", "weekend away", no captions, no emotion words, no machine summary. Event names inferred from a place or a date are meaning the machine added. The person names it, in their own words, in a letter.
4. The app never compares media with letters. "You have 14 photos and no letter" is a gap count and is out. "You have 14 photos from this day" is a count of what exists and is allowed on screen (never in a notification, never in analytics).
5. The app never uses loss language. No place-triggered surfacing (hospital, clinic, an address the person left), no "last year at this time" for a date the app cannot know is happy. Date-only surfacing still risks a sad anniversary. Mitigation: the surface is a quiet row inside the add-media screen the person opened, not a banner or a notification; "Not now" and "Don't show this day" are one tap.
6. Words that describe the offer must follow the content rules. Proposed words, for `content`: "Photos and videos from 14 to 16 June" (title), "12 photos, 2 videos" (count of what exists), a plain "Add to this letter" action. Not: "A year ago you were in Lisbon", "On this day", "Remember when".
7. No AI claim. The surface does not say or imply that anything was found by intelligence. The words are "from your library".

If the founder prefers "A year ago today" as a label for a date window, it is acceptable under this ruling because it states date arithmetic, not a fact about the person's whereabouts. Counsel does not need to rule on that; the founder does.

## 9. What changes in public claims, documents, permission strings, labels and tests

### 9.1 Statements that become untrue or too narrow (exact existing text)

| # | Where | Existing text | Problem | Proposal (for counsel) |
|---|---|---|---|---|
| 1 | `docs/legal/privacy-policy.md` 3.0.0 section 2, "What we do not collect" | "We do not collect your location (the country check in section 12 keeps none), contacts, photos, advertising ID or payment details." | True only while nothing leaves the phone and the person has not allowed library use. Needs the on-device qualifier | "We do not collect your location. If you let the app use the dates and places in your photos and videos, it reads them on your phone and does not send them to us. We do not collect your contacts, advertising ID or payment details." (the word "photos" removed from the not-collected list only if no photo ever reaches us) |
| 2 | `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-012 | "Never collected: child gender, surname, birth weight, place of birth, precise or coarse location, contacts ..." | Place text a person keeps with a letter on the phone is not "collected" by us, but the line reads as absolute | Add: "A place the person keeps with a letter stays on the phone. No coordinate is stored." |
| 3 | LEGAL-REQ-007 | "Photos, when they ship, use the system picker (no full-library permission). Contacts, location, tracking (ATT), Bluetooth and speech-recognition permissions are never requested." and "only `NSMicrophoneUsageDescription` (and photo-picker-compatible keys) and notification permission are present; any other permission key fails the build." | The first sentence forbids limited and full library access. The CI lint will fail on `NSPhotoLibraryUsageDescription`. "Location ... never requested" stays true: we never ask for the device's location | Amend to allow `NSPhotoLibraryUsageDescription` (and the Journaling Suggestions capability) per phase, behind the phase gate. Keep "location never requested" |
| 4 | LEGAL-REQ-013 | "Photos are re-encoded or stripped ... before upload or export" | Needs videos, and needs "at the time the copy is made" | Extend to video and to the copy step |
| 5 | `DELETION_AND_EXPORT_SPEC.md` 4.2 | "photos/<entry_id>.<jpg|heic>    original bytes; HEIC also gets a .jpg copy" | Contradicts LEGAL-REQ-013 and NX-33-R3 | "the stored copy" (section 7.4) |
| 6 | `docs/legal/app-store-privacy-labels.md` 2.1.0 section 3.2 | Location: Precise, Coarse "No ... Not requested; no IP-derived location is stored"; "Photos or Videos | No | No photo feature in v1.0" | Becomes inaccurate only if media or a place leaves the phone. Keep No, with the Apple on-device sentence as the basis, until a server copy exists | Answers by phase in section 11 |
| 7 | Same file, section 5 | "Photos, camera, speech recognition, location, contacts, tracking | Not used" | Wrong once `NSPhotoLibraryUsageDescription` or the entitlement exists | Update per phase |
| 8 | Same file, section 6 | "No photo picker, no new SDK since the last review (`apps/mobile/package.json` diff)." | The check fails by design the day a picker or native module is added | Replace with a phase check |
| 9 | `docs/legal/data-policy.md` rows for `entries.photo_path` and bucket `entry-photos` | "Column live; unused in v1.0 (no photo feature)" | Stale from P0 | `data-architect` and `legal` update |
| 10 | `docs/engineering/07-privacy-engineering.md` PRIV-R02 | "Add any field on the never-collect list in LEGAL-REQ-012 (... location ...)" | Same as 2 | Carve out "stays on the phone" |
| 11 | `packages/content/src/permissions.en.ts` and `apps/mobile/src/lib/permission-copy.ts` | "{app} uses the microphone to record the letters you speak to your child. Your recordings stay on this phone." | Labels 1.4.0 section 5 says the second sentence was dropped because a purpose string must be true whatever the backup setting. Both files still carry it. Not caused by this feature but it is the precedent for the new photo string, and it is already a false-or-risky claim | Fix independently (existing finding); do not copy this pattern |
| 12 | `packages/content/src/store.en.ts` line 39 and 76; `strings.en.ts` | caption "Your book stays on your phone."; "Without an account, your book stays on your phone." | True of the book; with media in the book it stays true while media is local | Keep, but re-run the claims test with the media rules in 9.3 |
| 13 | `packages/content/src/strings.en.ts` line 891 (Erase) | "This happens on this phone only. Nothing is sent anywhere." | Still true; must now cover media, cache, occasions and notifications | Test in 9.3 |
| 14 | `strings.en.ts` lines 957 and 1030 (analytics help) | "Never your letters, recordings, photos or anyone's names." | Still true; add places and occasions | "Never your letters, recordings, photos, places, occasions or anyone's names." |
| 15 | `strings.en.ts` line 982 | "Your letters and recordings are kept on this phone. They are not sent to us." | Add media | Include photos and videos once P0 ships |
| 16 | `strings.en.ts` trust promise, lines 1433 to 1453 | "Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models." | Needs "photos and videos" once they exist, because the promise is the one the store listing and website repeat word for word (`trust.promise`, D-061) | "Your letters, recordings, photos and videos are private ..." for counsel |
| 17 | `strings.en.ts` line 467 | `photoButton: "Add a photo"` (Quick note) | Exists today with no picker; a user-visible control for a feature that is not built | Check it is hidden in production; belongs to `mobile` |
| 18 | NX-33 `photos.localLine` (proposed) | "Photos stay on this phone, in your book." | Inaccurate because of the device backup (section 7.2) | "Photos stay on this phone, in your book, and in your iPhone's own backup if you use one." |
| 19 | NX-33 "What we never do" | "Request the whole library, read a photo's location or date ... make a slideshow or 'memories' reel ... show a count of photos" | This is the promise the founder is rewriting | Replaced by section 9.2 |
| 20 | `docs/legal/in-app-disclosures.md` | No row for library use, occasions or media nudges | New disclosure rows needed | `legal` |
| 21 | Terms of Service 4.0.0 | No term on content the person adds from a library or other people's images | Needs a right-to-add term | `legal` (Q14) |

### 9.2 The rewritten promise, proposed for counsel and the founder

These are not live and not approved. The founder decides what a user is promised.

In plain words (the shortest honest version, for the settings and the sheet):
- P0: "Photos and videos you add stay on this phone, in your book, and in your iPhone's own backup if you use one."
- From P1: "With your OK, the app looks at the date and city of the photos and videos on this phone, so it can show the ones near a letter. It does not look at faces or people. Nothing is sent to us."
- Always: "We never guess your religion or culture from the days you pick. Occasions you add stay on this phone."

Policy paragraph, for counsel (`legal` carries it to the founder; I do not edit `docs/legal`):
"Photos, videos and what is stored in them. If you add a photo or video to a letter, it stays on your phone with that letter. If you let the app use your photo library, it reads the date and the city of items on your phone to show you the ones near a letter. It does this on your phone. It does not send the photos, videos, dates or places to us, to an advertiser or to any other company. It does not look at faces or people, and it does not use them to train models. Photos and videos on your phone may also be in your iPhone's own backup if you use one; that copy is Apple's. You can stop at any time in Settings, and you can erase everything the app holds on your phone."
"Occasions. If you add a day you want to be reminded of, such as a festival, a holiday or an anniversary, it stays on your phone. We do not choose occasions for you and we do not work them out from your photos."

Permission strings (Info.plist). Follow the microphone precedent: purpose only, nothing about where data goes, because the string is shown to every user whatever a later build does.
- `NSPhotoLibraryUsageDescription` (limited or full library; P1 and later), for counsel: "{app} uses your photos and videos to show the ones near the day of a letter, so you can keep them with it."
- No `NSLocationWhenInUseUsageDescription` or any location key. The app never asks for the phone's location.
- No `NSPhotoLibraryAddUsageDescription` (the app saves nothing to the library).
- Journaling Suggestions: no purpose string is described in anything I could read; whether an Info.plist key exists: UNVERIFIED.
- The where-it-goes sentence ("Nothing is sent to us.") lives in the in-app priming sheet, which can change with the build's capabilities, not in the plist.

### 9.3 Claims registry and tests

Today `packages/content/test/claims-capabilities.test.ts` has five rules (`languages`, `coParent`, `sync`, `backup`, `exactWords`). It has none for photos, videos, location, library or occasions. Proposed (owner `content` with `privacy`; I write the rule text, they write the code):
- A rule `mediaLibrary`: claim patterns such as `\bphotos? library\b`, `\bdates? and (cities|places)\b`, `\bmemories?\b`, `\bon this day\b`, `\ba year ago\b`, `\bnear (the day of )?a letter\b`; true when `capabilities.mediaLibrary` is on in the production profile. Until then any such string on a store, website or in-app promise surface fails the test.
- A rule `mediaOnPhone`: claim patterns `\bphotos? stay on this phone\b`, `\bnothing is sent to us\b`; true only when the capability is on and the network-free test below passes; otherwise it fails (a claim without a proof is removed, PRIV-R17).
- A rule `occasions`: `\bfestivals?\b|\bholidays?\b|\boccasions?\b`; true only when the `occasions` capability is on.
- New build switches (names proposed, `mobile` owns): `EXPO_PUBLIC_MEDIA_LIBRARY`, `EXPO_PUBLIC_OCCASIONS`, off in `production`, on in `testflight` and `preview` first, following the `ACCOUNT_DELETION` pattern.
- Existing lines that must keep passing (the content rules): no em dash, en dash, curly quote, ellipsis or emoji; no AI wording; no gender; no streaks or gap counts.
- `packages/content/test/legal-docs.test.ts` and `legal-beta.test.ts` read the legal text; if they pin the "What we do not collect" sentence, they change in the founder's merge of the policy.
- Evidence of the proofs the new claims need (each is a test I would review, not a comment):

| Claim | Proof (proposed test, owner) |
|---|---|
| Nothing is sent to us | Source scan of the media and occasions modules: no `fetch`, no Supabase client, no analytics import, no XMLHttpRequest (`mobile`, as NX-33-R4) |
| No coordinate stored | Fixture images and videos with GPS: after save, 0 coordinates in SQLite, files or logs (`mobile`) |
| Stored media has no metadata | 0 of N fixture photos and 0 of N fixture videos contain Exif, XMP, IPTC, QuickTime location or device atoms (`mobile`, `security-architect`) |
| No faces or people | Source scan for Vision, face, `PHAssetCollectionSubtype` people albums, ML Kit, classify (`mobile`) |
| Not in analytics | The canary test in `packages/analytics/test/analytics.test.ts` extended with a media-derived fixture; the catalogue has no media, place or occasion property (`analytics`, `privacy`) |
| Erase leaves nothing | `erase-everything.test.ts` extended: 0 media files, 0 thumbnails, 0 temp files, 0 occasions rows, 0 pending notifications (`mobile`) |
| Occasions never synced | Test that the occasions table is outside the sync contract and outside `packages/api` schemas (`sync`, `privacy`) |
| Notification is neutral | Unit test over the notification builder: no attachment, no place, no occasion name unless the per-occasion switch is on, `userInfo` holds only an opaque id (`mobile`) |
| Permission keys | The manifest lint lists exactly the allowed keys per phase (`mobile`) |

### 9.4 App Privacy label answers by phase (a founder decision; these are my recommendations)

| Phase | Photos or Videos | Precise Location | Coarse Location | Sensitive Info | Basis |
|---|---|---|---|---|---|
| P0 one picked photo, stripped | No (not collected) | No | No | Unchanged (due date) | Apple's on-device sentence |
| P1 limited library, metadata chips | No | No | No | Unchanged | Same, provided no derived value leaves the phone. Journaling Suggestions: the same, for what we receive. What the system does is Apple's |
| P2 on-device moments | No | No | No | Unchanged | Same |
| P3 video | No | No | No | Unchanged | Same |
| P4 occasion reminders, typed | No | No | No | Unchanged | Occasions never leave the phone |
| Any server copy of media, place or occasions | Yes, linked, App Functionality | Yes only if coordinates; Coarse Yes if city text | Yes | Yes, adds religion and ethnicity risk | The derived data "should be considered separately" (Apple) |

The privacy manifest `NSPrivacyCollectedDataTypes` stays unchanged for P0 to P4. Required-reason API reasons for any new API used by a native module: UNVERIFIED (Apple pages are rendered by JavaScript; see the labels doc section 4).

## 10. Questions for counsel (short, answerable)

Numbering is local to this file (ML-Q). `legal` renumbers when they enter the counsel packet after Q57.

1. Is "Nothing is sent to us" a safe claim for on-device processing of photos, videos and their metadata, given iCloud Photos downloads and the iCloud device backup (both Apple's)? Or should the claim say "we never receive them"?
2. Under Apple's text, does reading dates and cities from the library, with nothing leaving the phone, leave "Photos or Videos", "Coarse Location" and "Precise Location" answered No? Do you agree with the wording in section 9.4?
3. Does calling Apple's geocoder (a coordinate sent to Apple) count as our collection of location? If we use an offline city table instead, is anything left to disclose?
4. May the purpose string say only what the permission is for, with the "stays on the phone" sentence in an in-app sheet (the microphone precedent)? Is that sheet an adequate "notice at collection" under state law?
5. Is a separate consent act needed for library use, beyond the iOS prompt? If yes, is the form in section 5.4 (Shown, Records, Never, Decline and withdraw) enough, and can it be recorded on the phone and uploaded at sign-in?
6. Does adding library use change the sensitive-data consent (LEGAL-REQ-006), the Terms or the Privacy Policy version bump rules in POLICY_VERSIONING?
7. Does keeping a city on a letter change the answer to "we do not collect your location" on the phone only?
8. Which of California, Connecticut, Washington and the other state sensitive-data and precise-geolocation rules apply to data that never leaves the phone? Is "collect" met by on-device reading?
9. Is a city, kept with a letter, "precise geolocation" under California (1,850 feet) or "precise location information" under Washington (1,750 feet)? Is a place chosen by the person different from one the app infers?
10. Does a place kept with a letter about a child, taken at a hospital, become "consumer health data" under Washington's definition if it stays on the phone?
11. Is Apple's Journaling Suggestions picker, for the data we receive from it, treated like the PHPicker for every question above? Does the entitlement need a statement to Apple?
12. If the person types their own occasions and they stay on the phone, is any sensitive-data notice or consent still required (religion, ethnicity, culture)? Would a bundled list of festivals the person can choose from change the answer?
13. Should occasions be in the person's export, or left out?
14. What Terms language covers media the person adds, including images of other people and other people's children, and photos they do not own? Should the app say anything at the moment of adding?
15. Does importing a photo taken by someone else (a grandparent) raise a copyright or licence issue we should address in Terms?
16. What duties do we have, if any, when a child in the images becomes an adult and asks what we hold? (Today the media is on the parent's phone.)
17. If media ever syncs to a server, what reporting or scanning duties arise (18 U.S.C. 2258A) and what must be in place first? (A gate for any server copy, not for P0 to P4.)
18. Does a video with other people's voices raise recording-consent exposure for us (California Penal Code 632, CR-041) when the person, not the app, made the recording?
19. Does the 2025 COPPA amendment change anything for a library the parent adds a child's photos and voice to, if Read together can show them to a child?
20. Is any change needed to the 18+ gate, Texas or other app-store age signals because the feature adds photos of minors?
21. May the app show a date range and a count ("Photos and videos from 14 to 16 June, 12 photos") with a city chip, without it being an inference about the person?
22. Is the proposed rewritten promise (section 9.2) accurate and not deceptive under FTC Act section 5, given the iCloud backup and Apple's own handling?
23. Do the rewritten Privacy Policy paragraphs and the removal of "photos" from the not-collected list need a material-change notice and a version bump (POLICY_VERSIONING)?
24. Does the safety-tier and "no inference" design (LEGAL-REQ-015) extend to on-device inferences about places (for example hiding a hospital)? Is on-device place classification itself a health inference to avoid?

## 11. Risk register

Likelihood (L) and impact (I) are 1 to 5. Score = L x I. Owners are agent handles; the founder owns anything marked founder. These are my judgements, not measurements.

| ID | Risk | L | I | Score | Owner | Mitigation |
|---|---|---|---|---|---|---|
| R1 | A derived value (place, count, occasion, window) reaches analytics, logs or crash reports | 3 | 5 | 15 | `analytics`, `privacy` | Canary test with media fixtures; catalogue has no such property; scan of the media module for network and analytics imports; log content rule PRIV-R10 |
| R2 | The claim "stays on this phone" or "nothing leaves" is false (iCloud device backup, iCloud Photos, Apple's geocoder) | 4 | 4 | 16 | `legal`, `content`, `privacy` | Claim wording in section 9.2; new claims rules (9.3); counsel Q1 |
| R3 | Location is stored or exported as coordinates, or a point-of-interest name appears | 3 | 5 | 15 | `mobile`, `security-architect` | No persistence; offline city table; fixtures prove 0 coordinates; export test; section 6 |
| R4 | Occasions reveal religion or culture (screen, lock screen, notification, shared phone, backup) | 3 | 4 | 12 | `privacy`, `design-systems` | Typed by the person, no list, device-only, neutral notifications, name off by default |
| R5 | The app infers an occasion or an event from the library or locale (scope creep) | 3 | 5 | 15 | `product`, `privacy` | Written rule: never infer; source scan; review gate; founder ruling |
| R6 | Resurfacing lands on a loss or a medical event | 3 | 5 | 15 | `product`, `content` | Date-only surfacing, in-screen only, one-tap "Don't show this day", no place triggers, ruling in section 8 |
| R7 | Face or people features creep in (Vision, People albums) | 2 | 5 | 10 | `mobile`, `security-architect` | Source scan; CR-040 guardrail; PR template line |
| R8 | Export carries original GPS or device metadata | 3 | 4 | 12 | `mobile`, `legal` | Spec fix (7.4); strip at copy time; byte-scan tests |
| R9 | Erase or delete leaves media, cache, occasions or pending notifications | 3 | 4 | 12 | `mobile`, `privacy` | Section 7.3 table as tests; interrupted erase resumes |
| R10 | Full library access is requested "just in case" | 2 | 4 | 8 | `mobile`, founder | Lowest-access order (3.3); App Review 5.1.1(iii); manifest lint per phase |
| R11 | The Journaling Suggestions route returns types we do not want (contact photos, State of Mind, workouts) | 2 | 4 | 8 | `mobile`, `privacy` | Allowlist of asset types; never call `content(forType:)` for others; test with a stub |
| R12 | App Review rejects the permission or entitlement | 3 | 3 | 9 | `release`, `privacy` | Accurate string; picker first; review notes; a build switch to turn the phase off |
| R13 | Other people's images (children, bystanders) in media; consent dispute | 3 | 3 | 9 | `legal` | Terms term; private by default; no sharing in P0 to P4 |
| R14 | A server copy of media is added later without redoing this analysis (label, policy, reporting duties) | 2 | 5 | 10 | founder, `privacy` | Written gate: any upload is a new decision, new consent act, new label, Q17 answered first |
| R15 | Device loss or a shared phone exposes media (snapshot, grid, notification) | 3 | 3 | 9 | `mobile`, `security-architect` | App lock covers the grid; snapshot check; neutral notifications |
| R16 | A child-facing surface shows library media (COPPA edge) | 2 | 4 | 8 | `product`, `privacy` | Media absent from Read together in P0 to P4; rule recorded |
| R17 | The new public promise ships before counsel has read it | 3 | 5 | 15 | founder | Switches off in `production`; claims rules fail the build; this file's go/no-go |
| R18 | A state law changes the answer before launch (new geolocation, sensitive-data or kids rules) | 3 | 3 | 9 | `regulatory-affairs` | Re-run CR-020, -022, -031 before each phase; checked-facts reference |
| R19 | Photos of children in a library trigger a false safety flag by a third party if ever uploaded | 2 | 5 | 10 | founder, `legal` | Keep media local; Q17; no upload without a plan |
| R20 | Free-plan or Plus gates make families feel their photos are held hostage | 2 | 3 | 6 | `product` | Photo with a letter is Free (NX-33 D5); lapsed plan never deletes |

Items scoring 15 or more are gates, not notes.

## 12. Go / no-go checklist per release phase

"Go" means the item is evidenced in the PR or build record. No item is a promise to a user until the founder approves its words. Each phase ships behind its own build switch, off in `production` until its list is green and counsel has answered the questions named.

### P0: one picked photo, metadata stripped (NX-33)

- [ ] PHPicker only; no `NSPhotoLibraryUsageDescription`; the manifest lint passes with the existing keys (no change needed).
- [ ] Re-encode strips Exif, XMP, IPTC, depth and thumbnails; byte-scan test over fixtures (NX-33-R3).
- [ ] Source scan: no face, caption, tag or network call touches a photo (NX-33-R4).
- [ ] Erase, delete a letter, delete a book and export tests cover photos (NX-33-R5 to R8).
- [ ] Export spec conflict resolved (7.4): stored copy, not original bytes.
- [ ] Claim wording uses the backup-aware sentence (9.1, row 18); claims rules for photos exist (9.3).
- [ ] App lock covers the photo UI; snapshot behaviour checked on a device.
- [ ] Label: Photos or Videos stays No, founder-confirmed, with counsel's answer to ML-Q2.
- [ ] Policy: "photos" removed from the not-collected list only if no photo reaches us; founder merges.
- [ ] Counsel has answered ML-Q1, Q2, Q14, Q15, Q22.

### P1: limited library and metadata chips (or Journaling Suggestions)

- [ ] Route chosen by the architecture decision, with the order in 3.3 and a written reason if a higher-access route is used.
- [ ] The consent sheet exists with Shown, Records, Never, Decline and withdraw (5.4 pattern for media); the iOS prompt appears only after "Continue"; "Not now" does not burn it.
- [ ] Withdrawal works in two taps (Settings, Privacy), cancels nudges, clears any cache, links to iOS Settings; the BL-485 problem (a consent with no withdraw control) does not repeat.
- [ ] The app works fully without access (5.1.1(iv)); P0 stays available.
- [ ] `NSPhotoLibraryUsageDescription` is the purpose-only string (9.2); the manifest lint allows exactly that key.
- [ ] Coordinates are never persisted; fixture test proves 0 on disk.
- [ ] Place text is city level only, from an offline table or the city field; no point of interest; no work flag; no geocoder call (or counsel has answered ML-Q3).
- [ ] Journaling Suggestions only: asset-type allowlist test; entitlement approved; Expo/native-module security review.
- [ ] No analytics event carries a media, place or count property (catalogue diff reviewed by `analytics`).
- [ ] Label recheck (9.4) signed by the founder; privacy manifest unchanged.
- [ ] Counsel has answered ML-Q3 to Q9, Q11, Q21.

### P2: on-device moments

- [ ] No persistent moments index, or a cache that is excluded from backup, holds only opaque ids and UTC bounds, and is wiped on erase and withdraw (3.3).
- [ ] No home or work inference; no trip, event or festival naming (section 8 ruling adopted by the founder).
- [ ] Surfacing is pull-only inside the add-media screen; "Don't show this day" is one tap.
- [ ] Words follow section 8, pass `rules.test.ts`, and are approved by the founder.
- [ ] Erase and withdraw tests cover the cache.
- [ ] Counsel has answered ML-Q8 to Q10 and Q24.

### P3: video

- [ ] Re-export strips container metadata, location atoms, make and model; byte-scan over fixture videos.
- [ ] Video audio is never transcribed or analysed (source scan: no speech or speaker call on a video path).
- [ ] Storage budget and "space on this phone" message; Free plan unaffected.
- [ ] Export carries the stored copy with hash; round trip opens offline.
- [ ] Counsel has answered ML-Q18 and Q19.

### P4: occasion reminders

- [ ] The person types occasions; no list, no default, no region ordering, no library or locale inference (source scan).
- [ ] Table is outside the sync contract, outside analytics and insights (tests).
- [ ] Notification builder test passes (neutral, no attachment, no place, no name unless the per-occasion switch is on, opaque `userInfo`).
- [ ] The door lines in 5.4 exist; withdrawal deletes occasions and cancels reminders in two taps.
- [ ] Erase test covers the occasions table and pending notifications.
- [ ] Counsel has answered ML-Q12 and Q13; the founder has decided D-E (section 13).
- [ ] If a bundled festival table is wanted, it is a new decision, a new consent act, counsel first.

Any server copy of media, place or occasions is not a phase here. It reopens sections 4, 9.4 and 11 and needs ML-Q17 answered.

## 13. What the founder alone decides

| ID | Decision | My recommendation |
|---|---|---|
| D-A | Whether to adopt the rewritten promise (9.2) in place of the NX-33 promise, and its exact words | Adopt in principle; words after counsel |
| D-B | Which route into the library (3.3), including whether full library access is ever acceptable | PHPicker, then Journaling Suggestions, then limited library; no full access |
| D-C | The App Privacy label answers per phase (9.4) | As the table; confirm each before every submission |
| D-D | The surfacing ruling in section 8 (facts about files, no event naming, date-only, in-screen) | Adopt |
| D-E | Occasion reminders: typed only, or also a bundled list; ship at all | Typed only; list only after counsel |
| D-F | Place: stored with a letter or not at all; offline table licence and size | City text only, off by default, offline table |
| D-G | Video in or out, and the storage budget | In, after P2, with a stated budget |
| D-H | Export default stripped; whether an "archive with originals" option exists | Stripped; no option for now |
| D-I | Publishing: turning any switch on in `production`, and sending any text to users | Not before counsel and this file's checklists |
| D-J | The family-sharing future: media and place private to the author until a new consent act | Adopt now as a written rule |

## 14. Sources and what I could not read

### 14.1 Read in this session (10 Nov 2026)

Apple:
- App Review Guidelines, https://developer.apple.com/app-store/review/guidelines/ : read to character 100,000 of 121,490; no date on the page; 5.1.1, 5.1.2, 5.1.3, 5.1.4(a) (partial), 1.3 first paragraph, 2.5.1, 2.5.4, 2.5.13, 2.5.14.
- App Privacy Details, https://developer.apple.com/app-store/app-privacy-details/ : read in full.
- JournalingSuggestionsPicker (Markdown version), https://developer.apple.com/documentation/journalingsuggestions/journalingsuggestionspicker : iOS 17.2 and later; "After a person selects a suggestion in the picker, the system shares only the information associated with the chosen suggestion with your app."
- JournalingSuggestion.Location (Markdown version): city, place, location (`CLLocation`), date, isWorkLocation, mapKitItemIdentifier.
- Entitlement `com.apple.developer.journal.allow`, one-line description only.
- Tech Talk "Discover the Journaling Suggestions API", https://developer.apple.com/videos/play/tech-talks/111384/ : transcript.
- WWDC24 10209 "Enhanced suggestions for your journaling app", https://developer.apple.com/videos/play/wwdc2024/10209/ : transcript.
- WWDC20 10676 "Build trust through better privacy", https://developer.apple.com/videos/play/wwdc2020/10676/ : PHPicker and approximate location statements.
- WWDC20 10641 "Handle the Limited Photos Library in your app", https://developer.apple.com/videos/play/wwdc2020/10641/ : limited library behaviour.
- PHAuthorizationStatus.limited (Markdown version), https://developer.apple.com/documentation/photos/phauthorizationstatus/limited.md : the `PHPhotoLibraryPreventAutomaticLimitedAccessAlert` key.

Law:
- 16 CFR 312.2, https://www.law.cornell.edu/cfr/text/16/312.2 (no date shown).
- Federal Register, COPPA rule, 22 Apr 2025, https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule : first 100,000 of 138,887 characters.
- FTC COPPA FAQ, https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions : first 100,000 of 128,931 characters; metadata last modified 10 Jul 2026.
- Cal. Civ. Code 1798.140, https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1798.140. : (ae), (w), (d); amended AB 947, effective 1 Jan 2024.
- GDPR Article 9, https://gdpr-info.eu/art-9-gdpr/ : 9(1), 9(2)(a), (e).
- RCW 19.373.010, https://app.leg.wa.gov/RCW/default.aspx?cite=19.373.010 : definitions (4), (7), (8), (19).

### 14.2 UNVERIFIED (could not read, or read only second-hand)

1. Apple App Review Guidelines: the last 21,490 characters, and the rest of 5.1.4. The page date.
2. Apple PHPicker documentation page itself, `PHPickerResult.assetIdentifier`, `PHAsset.location` behaviour under a limited selection, what metadata PHPicker returns, and the default handling of hidden and recently deleted assets (only WWDC20 transcripts were read; a "documentation" fetch was blocked by the tool's URL rules).
3. Apple's `NSPhotoLibraryUsageDescription` page (JavaScript only; one line read), and Apple's guidance on writing purpose strings.
4. Journaling Suggestions: the article "Presenting the suggestions picker and processing a selection"; the entitlement's full page; any Info.plist key; where suggestions are computed; the life of the URLs given for photo and video assets; how the entitlement is approved; React Native or Expo support; availability on devices before iOS 17.2.
5. Apple's geocoder documentation (CLGeocoder, MapKit) and its data handling; whether a geocoded coordinate is "our" collection.
6. Notification documentation (attachments, `userInfo` storage, lock-screen previews, pending request limits).
7. iCloud device backup treatment of the app container, `isExcludedFromBackup`, and iCloud Photos downloads under PhotoKit.
8. Apple required-reason API reasons for any new native module; PhotoKit as a required-reason API.
9. COPPA: the amendments' security programme, retention policy and third-party consent rules; mixed-audience definition; whether the Cornell page includes the 2025 text (it lists biometric identifiers; no date shown).
10. CCPA: the definition of "collect" (1798.140(f)); the right to limit (1798.121); the CPI-adjusted threshold figure.
11. GDPR Article 8, recital 51 and UK GDPR; the official EUR-Lex text (gdpr-info.eu is a reproduction).
12. Washington RCW 19.373: all sections after the definitions (consent, sale, geofence, enforcement); whether "collect" is met by on-device processing.
13. Connecticut, Colorado, Oregon and other states: definitions of sensitive data and precise geolocation; geofence rules outside the register's summary.
14. 18 U.S.C. 2258A (the register says it was not opened) and any operator duties for a local-only app.
15. Any FTC action on photo or face features (I recall the Everalbum matter from memory; not read, not relied on).
16. Expo or React Native packages for the library, picker and Journaling Suggestions: capabilities and licences.
17. The NX-39 requirements, the ADR and the benchmark branch; Project docs (privacy-label proposals, store compliance review, CTO rulings); the privacy-label and permissions behaviour on a device.
18. Whether `capabilities.backup` stays off in the next build, and whether Plus can be bought (both relevant to the Free-plan section; the 9 Nov council pass also lists these as UNVERIFIED).
19. The app-switcher snapshot behaviour of App lock.

## 15. Proposed changes to requirement documents (not made here)

Per the operating rules, requirement documents are not edited by this PR. Changes proposed for the PR body and the founder's merge:
- `ENGINEERING_REQUIREMENTS.md`: LEGAL-REQ-007 (allow the photo-library key per phase; keep "location never requested"), LEGAL-REQ-012 (on-phone carve-out), LEGAL-REQ-013 (video; at copy time).
- `DELETION_AND_EXPORT_SPEC.md` 4.2 and DATA-REQ-024 and -047: stored copy; list of media, cache, occasions and notifications.
- `app-store-privacy-labels.md` sections 3.2, 5 and 6: per-phase rows.
- `privacy-policy.md`, `in-app-disclosures.md`, Terms: section 9.
- `data-policy.md` and `DATA_CLASSIFICATION.md`: the rows in section 2 (my classification; schema belongs to `data-architect`).
- `docs/engineering/07-privacy-engineering.md`: PRIV-R02 carve-out and PRIV-R16 extended to video. These are engineering rules I own with `compliance-engineer`; I propose them here and will make them in a separate small PR once the founder rules on D-A.
