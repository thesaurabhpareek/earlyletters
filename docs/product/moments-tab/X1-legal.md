# X1 Legal: counsel brief for the Moments tab (21 Nov 2026)

Status: PROPOSED. Docs only. A draft for counsel review. Not legal advice, and nothing here says anything is compliant or legal. Every legal, Apple or store reading below is "counsel must confirm".
Author: X1, cross-functional legal lead. Audience: the founder, counsel (BL-104), `privacy`, `content`, `product`.
I did not open the founder's screenshots and copied nothing from them. Fictional family Asha only.
This file proposes clause text inside itself. It does not edit `docs/legal/**`, `ENGINEERING_REQUIREMENTS.md` or `DELETION_AND_EXPORT_SPEC.md`. Founder and `legal` apply any text in a later change, with the version bumps in section 5.

## 1. Purpose and scope

The founder wants a new tab (working name Moments) that is the daily-return engine. It shows value before permission, then asks for photo access on a tap, then shows days and pictures from the phone and prompts built from the child's dates. Its signal should also shape push and email nudges (founder, 20 Nov, verbatim in the brief).

This doc gives counsel one place to read:
- what changes and what we say publicly before and after (section 3);
- which clauses in our drafts would need to change (section 5);
- the specific legal exposure: children's pictures and video, biometric laws, Apple's terms, push and email, the tab name (sections 6 to 10);
- which claims the tab lets us make and which it forbids (section 11);
- counsel questions, each with a default (section 12).

It does not decide IA position, Route A versus Route B, or visual design. Those are in the other leads' docs.

## 2. Inputs read

Read in the repo this session (clone of `develop`, 21 Nov 2026):
- `/home/claude/moments-brief.md`, including the UPDATE line (tab need not be default; nudges across feed, push and email).
- `docs/legal/compliance-register.md` (CR-001, CR-002, CR-031, CR-040, CR-061, CR-083, CR-113), `docs/legal/privacy-policy.md` (3.0.0), `docs/legal/terms-of-service.md` (4.1.0), `docs/legal/in-app-disclosures.md` (3.4.0), `docs/legal/app-store-privacy-labels.md` (2.2.0), `docs/legal/POLICY_VERSIONING.md` (1.4.0), `docs/legal/COUNSEL_PACKET.md` (1.7.0, Q43, Q45, Q48).
- `docs/BACKLOG.md` BL-1304 and BL-1305. `docs/design/IA-FINAL-20nov.md` (flags and tab rules). `docs/design/NOTIFICATIONS.md` (K-02). `packages/content/BRAND.md` (glossary). `apps/mobile/eas.json` (profile names) and the header of `apps/mobile/test/g6-production-flags-off.test.ts`.
- `docs/product/prd/27-photo-moments-and-media.md` (NS-51 rows, NS-51-R33, R37; children and other adults). `docs/product/prd/GAP-LOG.md` (CL-019, CL-039).
- Open PR #1267 branch `docs/privacy-moments-tab-21nov` (privacy read, CQ-1 to CQ-15) and branch `wip/moments-d5` (content). PR #1264 (wheel) and the feasibility and design docs were not on origin when I looked, so I state assumptions and reconcile at integration (section 13).

Read on the web this session (VERIFIED, 21 Nov 2026):
- V1. Apple, Journaling Suggestions framework page (Markdown version), https://developer.apple.com/documentation/journalingsuggestions.md
- V2. Apple Developer Program License Agreement, 8 Oct 2025 English PDF, https://developer.apple.com/support/downloads/terms/apple-developer-program/Apple-Developer-Program-License-Agreement-20251008-English.pdf (first 100000 of 381649 characters; section 3.3.3(H) read in full).
- V3. Apple App Review Guidelines, https://developer.apple.com/app-store/review/guidelines/ (first 100000 of 121052 characters).
- V4. Illinois BIPA definitions, 740 ILCS 14/10, https://lig.ilga.gov/legislation/ilcs/documents/074000140K10.htm
- V5. Washington RCW 19.373.010, https://app.leg.wa.gov/RCW/default.aspx?cite=19.373.010
- V6. Two USPTO records via Justia, both for MOMENTS: https://trademarks.justia.com/861/59/moments-86159457.html and https://trademarks.justia.com/867/90/moments-86790791.html

## 3. The change, and the promise before and after

### 3.1 The change in plain words
A new tab. Before permission it shows our own Asha examples and a plain ask. With permission, limited access or none, it still shows real things from what we already know (typed days, the child's dates, letters already made, our 111 prompts). With the library, it can show days and pictures from the phone, in time order, in the parent's view only. It never writes a title, place or caption.

### 3.2 What we promise today (VERIFIED in the repo)
- Privacy Policy 3.0.0, "What we do not collect": "We do not collect your location ..., contacts, photos, advertising ID or payment details. ... We never create a voiceprint or any other biometric identifier."
- App Store privacy label draft 2.2.0, User Content, Photos or Videos: "No", with the note "No photo feature in v1.0". Row 117: photos, camera, speech recognition, location, contacts, tracking "Not used".
- NS-01 never-line: the photo library, faces or scenes, any picture the parent did not pick (per NS-51 row 39, the library clause is lifted only for NS-51).
- BL-1305: no photo-library usage string or PhotoKit call in any 1.x build; the g6 test enforces it on store profiles.
- Counsel packet: photo flag waits on Q43 and Q45, Q48 (pictures of a child and of another adult).

### 3.3 What we would say after (PROPOSED words for counsel; not for shipping)
These are drafts of the claim, not parent-facing copy. `content` sets parent words (see D5 for the tab words).

| Build profile | Proposed public promise | Condition that makes it true |
|---|---|---|
| `production` and `testflight` (store) in the state IA-FINAL describes today: no photo flag on | No change to the policy or label. The tab shows only our own examples, typed days, dates and prompts. | g6 test green; no usage string; no entitlement; no PhotoKit symbol. |
| A later store build with the system picker only (no library permission) | "You choose each picture. We keep only the ones you attach to a letter." | PHPicker only; label row re-run; counsel reads where a kept picture is stored and whether it syncs (see section 5.4). |
| A later store build with Route B (our own on-phone read) | "If you turn this on, the app reads only the date and time of pictures on your phone, to show you days. This stays on your phone. We do not look at what is in a picture." | Usage string; NS-51-R5, R26 tests; reversal of BL-1305 owned by the founder; counsel answers CQ-1 and Q-X1-1. |
| A later store build with Route A (Apple's suggestions picker) | "You can choose a day from Apple's own suggestions. We receive only what you choose, and we keep only the pictures." | Entitlement; DPLA 3.3.3(H) met; counsel reads (section 7). |
| `preview` and `development` (test devices) | No public claim. Flags on for testers only. | Notes for testers say so (TESTFLIGHT_TESTERS.md). |

Profile names are from `apps/mobile/eas.json` (development, e2e, preview, production, testflight). Which of them count as a "store" profile is read from `scripts/release/store-flags.mjs`, which I did not open: UNVERIFIED.

### 3.4 Requirement ids this touches
NS-51 (R1, R3, R5, R9, R11, R12, R18, R19, R25, R26, R29, R31, R33, R37), NS-49 (R9, R23, R25, R27, R33, R35), NS-52 (pictures and videos with a letter), NS-32 (notification budget, R1), NS-48, NS-01 never-line, BL-1304, BL-1305, FR-OPP-03 to 09, FR-PHS-40 to 57 (as listed in BL-1304 and BL-1305), LEGAL-REQ-014, LEGAL-REQ-019 (voice and, per CR-040 1.1.0, photos), CR-040, CR-031, CR-061, CR-083, CR-113. Ids "ML-3" and "ML-6" in the brief: I grepped `docs/` and `packages/` and found no row with those texts; the written rules are NX-39 ruling 3 and NX-39-R16, as #1267 also found. `product` to confirm the numbering.

## 4. Reversals the founder owns (legal view)

From the brief and my reading. None is decided here.

| # | Earlier ruling | What the Moments tab does to it | Legal consequence |
|---|---|---|---|
| 1 | BL-1305: no usage string, no PhotoKit in 1.x | Route B needs both | New permission text; label re-run; CQ-1 |
| 2 | K-02: no permission ask in first run | A default tab for a new parent would ask on the first screen | Recommended: the tab shows no ask before the first saved letter; keeps K-02 |
| 3 | J4: only Home starts a letter | Tab starts or hands over capture | No legal effect I can see; `product` owns it |
| 4 | ML-6 / NX-39-R16: card shows a date, never a place or thumbnail | Thumbnails on the tab | Pictures shown on screen: screenshots and app-switcher exposure (NS-51-R25); no data leaves the phone |
| 5 | NX-39 ruling 3 and K1: no notification derived from the library | A moment-driven push | Section 9. Reversal; NS-51-R11 already proposes a neutral form |
| 6 | Three-tab ruling in IA-FINAL | A fourth or fifth tab | No legal effect |
| 7 | NS-51-R1 and R8: one doorway; no list or older days | A "Recent" list of days | Same data, more visible; counsel reads the purpose string against the broader use |

## 5. Terms and policy clauses affected (proposals inside this doc)

Every proposed clause is a draft for counsel. Plain voice, per the house style. None may ship before the behaviour it describes, and none may be published for a build that lacks the behaviour (POLICY_VERSIONING.md; the policy's own rule that server and later parts take effect only when the feature ships, version 3.0.0 changelog).

### 5.1 Privacy Policy (now 3.0.0), proposed 3.1.0 (counsel decides materiality)
Section "What we do not collect". Today it says we do not collect photos. Proposed replacement, only for a build with a picture feature:

> We do not read your photo library unless you turn on days from your pictures. If you do, the app reads only when each picture was taken, on your phone, to show you days. We do not look at what is in a picture, and we do not use faces, people, places or albums. Pictures you choose to put with a letter are kept with that letter. Other pictures never leave your phone.

New section "Pictures and videos on your phone" (draft):

> You can choose pictures and videos to put with a letter. Where a kept picture is stored, whether it syncs to your family, and how to remove it: [engineering to fill from the build, counsel to read]. If you turn on days from your pictures, you can turn it off in Settings on your phone or in the app. Turning it off removes the days the app built.

New section "Reminders" addition (draft, counsel must confirm before any library-timed reminder exists):

> Your phone can time an evening reminder from the dates of your pictures. This happens on your phone. The reminder says the same thing as any other evening reminder. We never see which pictures you have.

The "never create a biometric identifier" sentence (1.1.0 of the register already rewrote it) stays, and should add "including from photos or videos" (CR-040(a)).

### 5.2 Terms of Service (now 4.1.0), proposed 4.2.0
- 5.1 and 5.2 (Your Content): name pictures and videos as Your Content. Proposed line: "Pictures and videos you put with a letter are Your Content."
- New 5.x, a draft: "You confirm that you may use the pictures and videos you add, including pictures of other people and of other people's children. Add only what you are comfortable keeping with {child}'s letters. If you share a letter with family, they can see its pictures." Counsel decides whether a warranty-style line belongs here (Q-X1-3).
- 2.1 (18 or older) unchanged. Nothing in the tab is for the child (CR-001, CR-002).
- A sentence that the days feature is optional and the app works without it (5.1.2(i), V3).

### 5.3 In-app disclosures (now 3.4.0), proposed 3.5.0
- Permission primer for days from pictures. Under COORDINATION section 10 and PRIV-R21, anything a person agrees to carries four lines (draft, for `content` and `mobile` to complete):
  - Shown: the primer text by `packages/content` key, with the Privacy Policy version link. Draft words: "Show days from your pictures. The app reads only when pictures were taken, on your phone. It does not look at what is in them." Then Apple's own system sheet.
  - Records: PRIV-R21 row: document `in-app-disclosures` and its version, action (turned on, turned off), method, surface, times, app and OS version, language, hash of the words shown. Never a picture, date, count or identifier. Whether a phone-only toggle needs a server row at all is for counsel (Q-X1-9). Default: no server row; phone-only setting.
  - Never: no picture, filename, album, place, date, face or person in the record, in analytics, logs or crash reports.
  - Decline and withdraw: "Not now" and a system "Don't Allow" both leave the tab working with our own examples and the system picker; no second ask by us; Settings link only when the parent looks for it (NS-51-R19). Export and deletion unaffected.
- The nudge opt-in, if any, is a second consent act with the same four lines (section 9).

### 5.4 Data classification, subprocessors, label
- `DATA_CLASSIFICATION.md`: the on-phone day index is class L4 (NS-51-R6). A parent-typed place on a letter is letter content (#1267 CQ-10). I did not edit that file.
- Subprocessors: no new subprocessor for Route A or B. Apple is the platform. If any place lookup is added, Apple's geocoder receives coordinates (CLGeocoder is network based, per #1267 A6, which I did not re-read); recommended default is no lookup.
- Label: Photos or Videos stays "No" only while nothing leaves the phone. Apple's definition of "collect" and its on-device carve-out are quoted in #1267 (A7). I did not re-read that page. If a kept picture syncs to our server, the row becomes "Yes" regardless of the tab. The register (CR-113) and migrations mention an `entry-photos` bucket while the policy says we do not collect photos. Whether any build uploads pictures today I did not verify in code: UNVERIFIED, flagged to `privacy` (finding F1, section 14).

### 5.5 Version consistency (standing duty 3)
Proposed bumps, only when the behaviour ships: `privacy` 3.0.0 to 3.1.0, `terms` 4.1.0 to 4.2.0, `in-app-disclosures` 3.4.0 to 3.5.0, `app-store-privacy-labels` 2.2.0 to 2.3.0, compliance register new rows (section 10), counsel packet gets Q-X1-1 to Q-X1-12 under a new heading. POLICY_VERSIONING.md section 6 (significant change, tied to Texas SB 2420 in CR-004): whether a new photo feature is a "significant change" for Apple's Significant Change API is for counsel (Q-X1-10).

## 6. Children's pictures and video

Facts (VERIFIED in repo): users are adults; the child never signs in (compliance register s.1). COPPA generally concerns information collected online from children, and the register's reading is that it does not apply to adults writing about a child (CR-001, citing the FTC FAQ A.8; Secondary, I did not re-open it). The register's edges are a child's voice in audio and sibling or teen contributors. Pictures and videos add a third edge: a video can carry a child's voice, and a library holds pictures of other children and other adults.

Exposure to put to counsel:
- A parent's own picture of their child is the parent's data about the child. The register treats that as outside COPPA while 18+ is gated (CR-001, CR-006). Counsel to confirm for pictures and video.
- A library holds pictures of other people's children (a cousin, a friend's baby) and adults who did not agree. The tab shows them only to the parent who owns the phone, and the machine does not identify them. If a parent attaches one to a letter and shares it, the family can see it. Q45 and Q48 already ask this for the picture feature; this tab makes it more visible, because the parent sees a wider set.
- Video with a child's voice: the "never listened to" and voiceprint claims (CR-040) must stay true. We do no analysis of video audio.
- CSAM: register CR-113 says no duty to scan, a report path exists, no proactive scanning of private family photos in v1. The on-phone day read does not change that: we do not view images. Counsel to confirm that on-device date reading is not "actual knowledge" and that the no-scan position holds if the library is read.
- Washington My Health My Data: face imagery is listed in the biometric data definition (V5, RCW 19.373.010(4)(a)), and biometric data is within consumer health data (8)(b)(ix). The register already treats photos conservatively (CR-031(j), HN-2). Pictures of a child in letters stay inside the Consumer Health Data question (the notice is not published in v1.0 per POLICY_VERSIONING, pending counsel, Q32).
- Apple 5.1.4 (kids) is about apps for kids; we are adult-directed, and the register says to keep metadata parent-facing (CR-002; V3 5.1.4(a) read). Nothing in the tab, screenshots or keywords may be child-directed.

Requirement:

MT-X1-R1. Given a parent has pictures or videos of other people, When the tab shows or attaches them, Then no code reads, ranks, hides or groups by person, and no copy says "your family", "friends" or names a person the parent did not type. Test layer: scan (the NS-51-R33 face and person scan extended to the tab's module) and content test.

MT-X1-R2. Given a picture or video is shown on the tab, When the app goes to the switcher or a screen is recorded, Then the NS-51-R25 protections apply to the whole tab. Test layer: device.

MT-X1-R3. Given any video, When it is shown or attached, Then nothing reads its audio or frames; duration and date are metadata only. Test layer: scan plus unit.

## 7. Apple: Photos, the journaling suggestions entitlement and the licence

### 7.1 What I read (VERIFIED, with source)
- Journaling Suggestions: a picker for iPhone apps, iOS 17.2 and later, iPadOS 26 and later (V1 header). "For the picker to appear, your app needs a special entitlement in your app's code signature. You don't need to ask for additional authorization because your app can't access the details for a suggestion until after a person chooses to share them by making a selection in the picker." (V1). The suggestions are described as "a place they visited, a person they connected with, a photo in their library, or a song that they play repeatedly" (V1).
- DPLA 3.3.3(H) (V2): the app "must not access the Journaling Suggestions API unless the use of such API is for journaling purposes. Any such uses must be clearly evident in Your marketing text and user interface." The app "must not use the Journaling Suggestions API, or collect any information through the Journaling Suggestions API, for any purposes other than providing journaling services in connection with Your Application". It must not "disclose or provide an end user's ... journaling suggestions information to a third party without prior express end-user consent", for example no sharing or selling to advertising platforms, data brokers or resellers. And it must "clearly disclose to end users how You and Your Application will be using their ... journaling suggestions information, and to use it only as expressly consented to by the end user".
- App Review (V3): 5.1.1(iii) use the out-of-process picker where possible; 5.1.1(iv) do not manipulate, trick or force consent, and provide alternatives for users who decline; 5.1.2(i) the app may not require users to enable system functionalities (such as push notifications) to use it; 5.1.2(iv) no building a database from Photos for your own use; 5.1.2(v) do not contact people using information collected via Photos except at the user's explicit initiative; 4.5.4 push must not be required, not for sensitive information, and not for promotions or direct marketing unless the person explicitly opted in with consent language in the UI and can opt out.
- 5.1.2(vi) (V3): "Data gathered from ... depth and/or facial mapping tools (such as ARKit, Camera APIs, or Photo APIs) may not be used for marketing, advertising or use-based data mining, including by third parties." Whether a library-timed nudge is "marketing" or "use-based data mining" is a question for counsel (Q-X1-6).

### 7.2 What I did not verify (UNVERIFIED)
- Whether Apple approves or reviews the entitlement `com.apple.developer.journal.allow`, and how (the entitlement page was not read; V1 only links it). The repo's own CL-019 and CL-042 also record it as unverified.
- DPLA sections beyond the first 100000 characters. Section 3.3.3(H) was read in full; other terms on Photos data, the Sensitive Content Analysis Framework, or anything applicable to a notification feature were not.
- The page on "Receiving journaling suggestions system notifications" (title seen on V1, not opened). It appears to let Apple send a system suggestion notification that opens our app. Not adopted; counsel and `mobile` would need to read it before it is considered (Q-X1-7).
- App Review text after character 100000.
- Whether Apple's own Settings, or its consent sheet text, describes our use adequately.

### 7.3 Consequences I read from the sources (counsel must confirm)
- Route A can only be used "for journaling purposes" and that must be "clearly evident" in marketing text and the interface. The brand rule bans "journal" in prose and keeps it in the store name and subtitle only (BRAND.md; CL-039 closed 20 Nov with the read that 3.3.3(H) applies to the Suggestions API only). Counsel: is the store name "Early Letters: Baby Journal" plus our interface enough for "clearly evident" (Q-X1-5)?
- Anything we collect "through" Route A may be used only to provide journaling. That rules out using what the parent picks in Apple's picker to drive engagement analytics, email, or a nudge-timing model. Default: Route A feeds only the letter being written.
- The tab must work for a parent who declines everything (5.1.1(iv), 5.1.2(i)).

MT-X1-R4. Given a build with the suggestions entitlement, When the build is cut, Then a docs check fails unless the licence read (DPLA 3.3.3(H)) and counsel reads are recorded (BL-1304 already specifies this). Test layer: doc-check in CI.

MT-X1-R5. Given Route A returns items, When our boundary receives them, Then only picture and video assets are kept; titles, locations, contacts, songs, workouts, reflections and state of mind are dropped at the boundary and never stored, logged or shown by us (matches NS-49-R9 and #1267 section 2). Test layer: unit with a fake picker result, plus scan.

## 8. Biometric-law exposure (face matching is not built)

VERIFIED text:
- Illinois BIPA (V4): "Biometric identifier" is "a retina or iris scan, fingerprint, voiceprint, or scan of hand or face geometry". The definition says identifiers "do not include writing samples, written signatures, photographs ...". "Biometric information" is information "based on an individual's biometric identifier used to identify an individual".
- Washington (V5): biometric data is "data that is generated from the measurement or technological processing of an individual's physiological, biological, or behavioral characteristics" and identifies a consumer; the list includes "Imagery of the iris, retina, fingerprint, face, hand, palm, vein patterns, and voice recordings". Biometric data is within consumer health data.
- Register CR-040 (VERIFIED in repo, its own sources Secondary): Texas CUBI and Colorado biometric rules were not opened by the register ("general knowledge, statutes not opened", "Unverified, not opened"). I did not open them either: UNVERIFIED.

Reading (counsel must confirm): BIPA's text, as I read it, excludes photographs and covers a scan of face geometry. The exposure arises from processing that computes a face template, not from showing or storing a picture. Washington's definition is broader in wording (imagery of the face), with a qualifier that it identifies a consumer. Because face matching is not built and the constitution forbids it, the designed exposure is low, but not zero for Washington, and the rule that keeps it low is engineering, not law.

What would break it, to forbid by test:
- Any Vision or PhotoKit person, face or scene request; Apple's People data; "smart" crop or auto-layout that detects faces (CR-040(a), already a stated guardrail but marked "not yet in LEGAL-REQ-019").
- A "best photo" or cover choice from pixels.
- Apple's own suggestions picker returning a Contact name and photo, which we drop at the boundary (MT-X1-R5).
- A third-party SDK that does any of the above (the dependency list is checked in the preflight tests).

MT-X1-R6. Given the tab's module and its dependencies, When CI scans them, Then no import, symbol or native module for face detection, face landmarks, person grouping, scene classification, saliency or Photos "People" is present, and the collage uses fixed order and a fixed centre crop. Test layer: scan (extends the NS-51-R33 and NS-49 face-detection source scan). Fails if a mutant adds one.

MT-X1-R7. Given the engineering requirements, When LEGAL-REQ-019 is next revised (by the owner of that file, not me), Then it names photos and videos and OS frameworks. Proposed in the PR body, since I do not edit that file.

Counsel: is a "we do not do X" claim safe on its own, or does a biometric statute require a written policy even where nothing is collected (Q-X1-4)?

## 9. Push and email nudges from library signals (counsel must confirm)

Constraints already on file: ML-3 as cited in the brief (no push from library data; fixed text, random id, no place, photo, count or "waiting"), NX-39 ruling 3 and K1, NS-32 budget (at most one budgeted notification per local day, NS-32-R1), NS-51-R11 (a moment may rank the evening reminder, neutral words, only while the app is open), NS-51-R26 (nothing leaves the phone), NS-51 rows on no count and no place, NS-51-R12 (analytics sees nothing), NS-51-R19 (no nag about access), K-02 (notification permission after the first saved letter). #1267 section 10 analyses the same ground; I agree with its conclusions and add the Apple and licence points.

### 9.1 Email
The server never sees the library, so email can use only what the server legitimately knows: the child's date of birth, typed days, letters made. An email that changes because of pictures would need the phone to tell the server something derived from the library. By Apple's own definition (quoted in #1267, A7, not re-read by me) that is data collected, and it would change the label. Proposed default: no email from library signals, ever, without a new founder and counsel decision. Even with a separate opt-in, the Photos or Videos row would become "collected" and the DPLA purpose limit applies to anything from Route A (section 7.3).

### 9.2 Remote push
Same answer as email. A remote push is chosen by our server; it cannot be library-driven without the library signal leaving the phone. Not recommended.

### 9.3 Local push
A local notification, scheduled by the phone, is not sent to us. Even so:
- 4.5.4 (V3): not for promotions or direct marketing unless the person explicitly opted in in the UI. A nudge to write a letter is arguably not a promotion of ours, arguably "direct marketing". Counsel must decide (Q-X1-6). Default: the existing reminder opt-in covers evening reminders; a library-timed nudge needs its own plain opt-in line and an off switch, and is off until chosen.
- 5.1.2(vi) (V3): counsel to read whether Photo APIs data timing a nudge is "use-based data mining".
- Existence is a disclosure: a notification that exists because of pictures tells a lock-screen watcher something (NX-39 reason). Therefore the safest form, which #1267 also proposes, is the identical-words form: the moment signal may only take the slot of the ordinary evening reminder and use the ordinary words.
- NS-51-R11 is already a narrow exception proposed on 20 Nov and not shown to the founder as a reversal. I list it as reversal 5 (section 4).

MT-X1-R8. Given any notification the app schedules, When the payload is built, Then it holds fixed text, a random id, no thumbnail or attachment, no library identifier, no place, date range or count, and a tap opens the tab and never a particular day or picture. Test layer: unit on the payload builder, plus a content test that fails on a banned word list (count, waiting, new pictures).

MT-X1-R9. Given a nudge was driven by a library signal, When analytics is on, Then no event, property or bucket distinguishes it from an ordinary evening reminder. Test layer: analytics allowlist test (extends NS-51-R12).

MT-X1-R10. Given the parent has not turned on days from pictures, or has paused it, When reminders are planned, Then no library signal is read. Test layer: unit with a fake library that throws if called.

MT-X1-R11. Given the nudge opt-in, When the parent sees it, Then it carries Shown, Records, Never, Decline lines per PRIV-R21 (section 5.3), is off by default, is not pre-ticked, and a "No" leaves reminders as they are. Test layer: unit plus content, doc-check that the opt-in key exists in the consent registry.

Daily-return reason, legal view: the reason to come back should be the child's real dates and the parent's own typed days, and our 111 prompts, none of which depends on a library read. That version needs no change to any promise and no reversal. A library moment is an addition, not the engine. That is a product call; I say it because the legal cost of making the library the engine is every reversal in section 4 and every nudge question in this section.

## 10. Compliance register rows to add (proposed; I do not edit the register)

| Proposed id | Subject | Applies | Status to set |
|---|---|---|---|
| CR-MT-1 | Apple DPLA 3.3.3(H), Journaling Suggestions API | Yes if Route A | Gap until counsel reads and CL-019 resolves |
| CR-MT-2 | App Review 5.1.1(iii) and (iv), 5.1.2(i), (iv), (v), (vi) for a photo-library tab | Yes if Route B | Gap |
| CR-MT-3 | App Review 4.5.4 for a picture-timed nudge | Maybe | Gap |
| CR-MT-4 | BIPA, Washington biometric data, Texas CUBI, Colorado for photos and video in a tab | No as designed; scan keeps it so | Partial (guardrail not in LEGAL-REQ-019) |
| CR-MT-5 | Other people's children and adults in a parent's pictures | Maybe | Gap, merges with Q45 and Q48 |
| CR-MT-6 | Tab name clearance | Maybe | Gap (section 11) |

## 11. Tab name: trademark and glossary

Working name: Moments (the founder's word; `content` may propose better, with one verb).

Glossary conflict (VERIFIED in repo): BRAND.md bans "moment" for "a short piece someone makes" (that is a "note"). The existing `en.moments` namespace means celebrations. NS-51 already uses "Photo moments". D5 (`wip/moments-d5`) finds the same trap (MT-D5-F1). Not a legal point, but any change to the glossary is `content`'s, and a tab word must pass the content rules test.

Trademark (mostly UNVERIFIED): I ran one web search and opened two USPTO records via Justia. Both are for MOMENTS, and both show status dead (one filed 7 Jan 2014, abandoned 15 Aug 2016, class 42, non-downloadable software for sharing photos; one filed 16 Oct 2015, abandoned 21 Nov 2019, classes 9 and 38, software for uploading and sharing media). The search returned many other MOMENT and MOMENTS records that I did not open. This is not a clearance search and does not show any live mark. "Moments" is a common English word and is widely used as a feature name by other apps (general knowledge, UNVERIFIED, no source read), which is a reason it is a weak, crowded name and a reason to treat it as descriptive, not ownable.

Our own legal position: the tab name is a feature label inside our app, under our existing mark (Q10 "Trademark: Live, unchanged" in the counsel packet; the mark itself I did not re-check). We should not seek to register the tab name, and we should not use it in the store name, subtitle or keywords until counsel clears it. A name that is a plain verb for the parent (D5 proposes one verb each) carries less risk than a coined noun.

MT-X1-R12. Given the tab name is shipped, When it appears in a string, Then it comes from `packages/content` and the public product name comes only from `packages/brand`. Test layer: content test (existing).

## 12. Claims the tab enables and forbids (for the claims registry, standing duty 1)

Enabled, only when the matching test is green in the shipped build (claims-inventory pattern, BL-1310):

| Claim (draft) | Needed true |
|---|---|
| "We read only when your pictures were taken." | NS-51-R5 test; no other field read |
| "This stays on your phone." | NS-51-R26 network fake sees zero requests; no library data in logs, analytics, crash |
| "You choose what goes with a letter." | Nothing attached without a tap |
| "The app works without it." | Fallback state test (declined, limited, denied) |
| "Turn it off any time." | Off switch removes the day index (NS-51 off and pause rows) |
| "Your reminders do not tell us which pictures you have." | MT-X1-R8 to R10 |

Forbidden (a content test and a scan fail on them):
- "We never see your photos." Unless true of every path including a kept picture that syncs. Today unverified (F1).
- "Smart", "AI", "automatically finds your best", "memories we found for you", "we picked". The machine adds no meaning, and nothing implies AI writes anything.
- Any claim that the app recognises, finds or tags people, places or scenes.
- Any count, gap, "waiting", "you have N", streak, "don't miss".
- "Compliant", "secure", "private by law", "safe for kids". Also anything child-directed (CR-002).
- "Journal" in running prose (BRAND.md), except as counsel decides for the Journaling Suggestions licence (Q-X1-5).
- "Apple" or "iOS" endorsement phrasing beyond naming Apple's system sheet; "Apple Journal" as a comparison.
- "Data Not Collected" for Photos or Videos while any picture, thumbnail, date or identifier can leave the phone (A7 as quoted by #1267).
- Any claim about reverse-geocoded places or maps.

## 13. Counsel questions, each with a default

Counsel must confirm every answer. A default is only what we build until counsel answers (the packet's own rule). Numbering continues the packet under "Moments tab". Overlaps with #1267 (CQ-n) are noted so the integrator does not ask twice.

| Id | Question | Default until answered | Deadline | Overlap |
|---|---|---|---|---|
| Q-X1-1 | May a 1.x store build carry a photo-library usage string and read only date and a system identifier, with the label kept as not collected? | No library read in any store build. Tab ships with examples, typed days, dates and prompts only. | Before any store build with Route B | CQ-1 |
| Q-X1-2 | Does Route A need approval of the entitlement, and does the app need extra text or a plist key? | Do not ship Route A. | Before Route A leaves test devices | CQ-2 |
| Q-X1-3 | What clause covers a parent adding pictures of other people and other people's children, and sharing them with family (Terms 5.x draft)? | The draft in section 5.2. | With Q45 and Q48 | Q45, Q48 |
| Q-X1-4 | Do BIPA, Washington MHMDA, Texas CUBI or Colorado require anything (policy, consent) when the app shows face imagery but never processes it? Is a plain "we do not do X" safe? | State the "we do not" line precisely; no face processing, enforced by scan. | Before the first picture feature | CR-040 |
| Q-X1-5 | Is "journaling purposes" "clearly evident" with our store name and interface, given our own copy avoids "journal" in prose (DPLA 3.3.3(H))? | Route A stays off until answered. | Before Route A | CL-039 reopened |
| Q-X1-6 | Is a picture-timed evening nudge "promotions or direct marketing" (4.5.4) or "use-based data mining" (5.1.2(vi))? | Off by default, own opt-in, identical-words form only, or none. | Before any library-timed nudge | CQ-11, CQ-14 |
| Q-X1-7 | May we use Apple's journaling suggestion system notification at all? | No. | Only if the founder asks | new |
| Q-X1-8 | Is a notification's existence a disclosure to anyone who sees the lock screen? | Treat as yes; identical-words form. | With Q-X1-6 | CQ-12 |
| Q-X1-9 | Does turning days from pictures on or off need a recorded consent row on our server, or is a phone-only setting enough? | Phone-only setting; a doc-check that the primer words are versioned. | Before the primer ships | new |
| Q-X1-10 | Is a new photo feature a "significant change" for Apple's Significant Change API and our policy versioning? | Yes, treated as material; bump versions and re-show. | Before the build | CR-004 |
| Q-X1-11 | Does reading the library on the phone create "actual knowledge" duties (18 U.S.C. 2258A, CR-113) or change the no-scan position? | No change; no scanning. | Before Route B | CR-113 |
| Q-X1-12 | Is the tab name clear to use as an in-app label, and may it appear in store metadata? | In-app only; not in store metadata until cleared. | Before the store listing | new |

## 14. Edge and unhappy paths (legal view)

- Parent denies, limits or later revokes in Settings: the tab keeps showing real things; no prompt about it (NS-51-R19); the day index is removed when the parent turns the feature off.
- Parent on iOS below 17.2: Route A is absent; value page and prompts still work. Minimum is iOS 17.0 (D-098).
- A child's other parent has a different setting: nothing about one parent's library or days is shown to the other (BL-1309 pattern).
- Account deletion and Erase everything: the day index is cleared on the phone; kept pictures follow the existing deletion spec (I did not re-read it; `DELETION_AND_EXPORT_SPEC.md` is not mine to edit; propose in a PR body if the index needs a line).
- Shared screens and Save a copy: the day index is not in a copy (BL-1307 pattern, NS-51 rows). Kept pictures: counsel to confirm the export promise (UNVERIFIED which rows apply).
- Screenshots and recordings of the tab show real faces: our own store screenshots must use generated Asha images only (CR-002, 4+ appropriateness).
- A law change: any change to biometric, kids or app-store rules re-opens sections 6 to 9 (regulatory-compliance skill, not re-read this session; I did not consult `regulatory-affairs`, see "not done").

## 15. Constitution, privacy and accessibility checks

- Constitution: no machine title, caption, place, person or scene; the tab adds dates in a fixed rule only. Passes in the design above; MT-X1-R1, R5, R6 hold it.
- Privacy: nothing leaves the phone from the library; no photo, filename, album, place or date in analytics, logs or crash; safety tiers stay on the device. MT-X1-R8, R9, R10.
- Content rules: this file has no em or en dashes, curly quotes, ellipsis characters or emoji, and no model names. Draft clauses use `{child}` and never gender the child.
- Accessibility (legal exposure only, CR-070): the primer, the opt-in and the legal pages are WCAG 2.2 AA surfaces. A consent act a person cannot reach with VoiceOver, AX5 or Reduce Motion is a consent risk, not only a design flaw. Checked by `design-systems`; I did not test.

## 16. Open items for the founder (recommended default and deadline)

1. Keep the store build as in IA-FINAL until Q-X1-1 and Q-X1-3 are answered: default is yes; deadline before the next release freeze.
2. Choose Route B before Route A if only one: default Route B (we control the words; DPLA 3.3.3(H) and the entitlement are avoided); deadline with the feasibility doc.
3. Own the reversals in section 4 explicitly, in `DECISIONS.md`, in the PR that builds each.
4. Choose the engagement engine: default is the child's dates, typed days and prompts, with library moments as an addition.

## 17. Dependencies

Feasibility doc, privacy doc (#1267), design concept, D5 words, the product wheel (#1264), `content` (tab word), `privacy` (finding F1 and the checks in sections 6 to 9), `mobile` (flags and tests), the founder (reversals), counsel (BL-104).

## 18. Findings and what I did not do

Findings (five most important):
- F1. Possible claim mismatch to verify now: Privacy Policy 3.0.0 says we do not collect photos, the label draft says "No photo feature in v1.0", while the register (CR-113) and several migrations mention an `entry-photos` bucket and PRs #836 to #840 build a stored copy. I did not read the code to see whether any build uploads pictures: UNVERIFIED. Hand-off to `privacy`; the claim must be true of the shipped binary.
- F2. DPLA 3.3.3(H) (read) limits Route A data to journaling purposes and requires the use to be "clearly evident" in marketing and interface. That collides with our own ban on "journal" in prose and means Route A data may not feed nudges, email or engagement analytics.
- F3. App Review 5.1.2(vi) (read) restricts using Photo APIs data for marketing or use-based data mining. It was not in the earlier analysis. It bears on any library-timed nudge.
- F4. Email and remote push from library signals cannot be done without sending a derived library fact to the server, which breaks the label story. Local push only, identical words, opt-in.
- F5. Name: "moment" is banned in the glossary for a short piece; two MOMENTS records I opened are dead, which is not a clearance; do not use the name in store metadata.

Not done: I opened no screenshots; I did not run any clearance search beyond one query; I did not read DPLA beyond 100000 characters, App Review beyond 100000, the entitlement page, the system-notification page, Texas CUBI or Colorado; I did not read `scripts/release/store-flags.mjs`, `DELETION_AND_EXPORT_SPEC.md`, or the regulatory-compliance skill; I did not consult `regulatory-affairs`; I did not open PR #1264 or the feasibility and design docs, which were not on origin. I contacted no counsel or regulator.

## 19. Verified, unverified, guess

VERIFIED (source read this session): V1 to V6 in section 2; repo facts in section 2 with paths.
UNVERIFIED: entitlement approval; DPLA and App Review beyond the read range; system notification page; Texas CUBI, Colorado; any live trademark; Apple's geocoder and map behaviour (from #1267, not re-read); the label "collect" definition (from #1267); which profiles count as store profiles; whether any build uploads pictures; widespread use of "Moments" by other apps.
Guess: that a feature label inside the app carries less trademark risk than a store-level name; that a nudge to write is arguably not "direct marketing".

Hand-offs: copy to `content`; implementation gaps and F1 to `privacy`; question pack text to the BL-104 counsel packet owner for merge.
