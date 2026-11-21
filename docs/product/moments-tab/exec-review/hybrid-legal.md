# NS-53 Moments tab: hybrid picker design, executive review, Chief Legal Officer and Chief Compliance Officer (one combined review)

Status: EXECUTIVE REVIEW of a PROPOSED delta. Nothing here is decided, published or sent to counsel.
Date: 21 Nov 2026
Reviewer: Chief Legal Officer (Claude role, not a lawyer) and Chief Compliance Officer (Claude role, not counsel), one combined review. No attorney-client relationship exists. Nothing here is legal advice. Every legal conclusion marked "counsel must confirm" is a judgment for a licensed California attorney, not a finding.
Reviewed: `docs/product/moments-tab/HYBRID-PICKER-DELTA.md` on `wip/moments-picker-delta` (head a84f448c7f75480b629000b7997d8c4f18652e2b); the spec `docs/product/prd/28-moments-tab.md` on `wip/moments-prd` (head 1c1e05bc2f1dabc294a4b87aefca9035838f6fe7); my earlier reviews `exec-review/clo.md` and `exec-review/cco.md` (branches `wip/moments-review-clo` and `wip/moments-review-cco`); `docs/agents/exec/COUNCIL.md` and both role skills, read in full from `develop`.
Not present: `PICKER-ROUTE-FEASIBILITY.md` on `wip/moments-picker-feasibility`. That branch does not exist on the remote (the fetch failed and a listing of remote refs shows no match). Nothing below relies on it.
Founder rulings taken as given: the library read of 21 Nov is not reversed; the hybrid is a delta on top of it.

# Verdict: ACCEPT-WITH-CHANGES

The hybrid is the better legal shape. It gives the tab a working no-permission action, which matches the text of App Review 5.1.1(iii) and (iv) as I read them today, and it removes two stored-identifier classes. It does not dissolve any of the ten counsel questions or any gate (I agree with the delta on that, checked row by row below). It adds one thing the delta understates: the picker door is independent of the library gates, but it is not independent of counsel or of the legal paperwork, because it is the photo feature, and every public legal text on both branches still says there is no photo feature.

Conditions:

| # | Condition | Findings |
|---|---|---|
| C1 | The door ships only with the photo flag's own legal set: the picture lines in the Privacy Policy, Terms and label, written and read by counsel. It is "independent" of G2 questions 1 to 4 and 10 only. | EXH-LEG-1, EXH-LEG-7 |
| C2 | The door is built with a plain picker configuration and no PhotoKit authorization call and no photo usage string, in every profile where F2 is off. The library configuration of NEW-5 exists only in the F2 profile. | EXH-LEG-2 |
| C3 | Every public and in-app sentence about what we see is scoped to a mode (no access, Limited, Full). "We only see the pictures you choose" is never written. | EXH-LEG-3 |
| C4 | G1a records under which access states Apple's first-time picker text appears; if it appears under Full access, counsel reads it with Q1 before the picker is embedded in that state. | EXH-LEG-4 |
| C5 | The date read from a picked file never parses or returns a coordinate, and no claim says we remove location from videos until the video spike proves it. | EXH-LEG-5, EXH-LEG-6 |

# Counts

15 findings: 0 BLOCKER, 7 MAJOR, 8 MINOR.

| Severity | Ids |
|---|---|
| BLOCKER | none (the two BLOCKERs of my earlier review, EX-CLO-1 and EX-CLO-2, stand unchanged; the hybrid neither fixes nor worsens them) |
| MAJOR | EXH-LEG-1, 2, 3, 4, 5, 6, 7 |
| MINOR | EXH-LEG-8, 9, 10, 11, 12, 13, 14, 15 |

# How to read the evidence column

READ means I opened the primary text this session (21 Nov 2026) and say what it shows. UNVERIFIED means I did not read the primary text, or the page did not show the fact, and nothing in a recommendation rests on it alone. Apple pages were read through the fetch tool; where the tool returned a summary instead of the text, I say so. The Apple guidelines page returned no "last updated" date, so the date of the guideline text is UNVERIFIED. The Developer Program License Agreement page showed no version or effective date, so its version is UNVERIFIED.

# Findings

## EXH-LEG-1 (MAJOR) The door is independent of the library gates, not of counsel or of the legal paperwork

- Delta: section 5 ("the picker door alone ... needs none of Q1 to Q4 and Q10 ... UNVERIFIED and not a counsel view"); section 6 (PR 18b "can ship even if every library gate fails"); founder Q5.
- Finding: I agree with the narrow claim. Questions 1 to 4 and 10, G2, G3, G8 and G11b concern the library read and the place data, and the door in its plain form touches none of them. The wider impression is wrong. The door is a photo feature. On `wip/moments-prd` the label row for Photos or Videos reads "No | No photo feature in v1.0" (`docs/legal/app-store-privacy-labels.md` line 54), its permission table says photos are "Not used" (line 117), its review checklist says "No photo picker" (line 127), Privacy Policy 3.0.0 says "We do not collect ... photos" (line 45), and Terms 4.1.0 do not mention photos or pictures (grep, empty). The counsel packet on the same branch gates the photo flag on its own questions (Q43, Q45, Q48, Q51, Q54) and says the photo flag lands in Build 14 with flags off in the production profile of Build 13 (`COUNSEL_PACKET.md` lines 212 and 224 to 232). The delta says the door is governed by "the existing photos switch (R106)". So the door ships when the photo flag ships, with the photo flag's paperwork, and silence from counsel on those is not a pass. Whether a stored copy of a picked picture in an iPhone backup changes the label or the deletion promise is Q7 of the Moments list and Q54 of the packet: counsel must confirm.
- Proposed change: (a) the delta's section 5 and PR 18b text say "independent of the library gates (G2 questions 1 to 4 and 10, G3, G8, G11b)" and "not independent of the photo flag's legal set (packet Q43, Q45, Q48, Q51, Q54, Terms, Privacy Policy picture lines)"; (b) the CPO decides whether the door moves the photo flag into the Moments release or waits for Build 14; that is a scope call, and it carries the paperwork; (c) the founder is told this before he answers delta Q5.
- Evidence: READ on `wip/moments-prd` (1c1e05bc): `app-store-privacy-labels.md` lines 54, 117, 127; `privacy-policy.md` lines 21 and 45; `terms-of-service.md` grep; `COUNSEL_PACKET.md` lines 195 to 232 and 385 to 395. READ: delta sections 3, 5, 6. Current counsel engagement status: UNVERIFIED (as in EX-CLO-2).

## EXH-LEG-2 (MAJOR) NEW-5 couples the door to the library profile; the door must be the plain picker

- Delta: NEW-5 ("with access it may use the library configuration only to receive an identifier"); R70 change; R169 and R170 changes; section 1 table row on `assetIdentifier`.
- Finding: Apple's PhotoKit article, read today, draws the line this way: the picker "is private by default. The user doesn't need to explicitly authorize your app to select photos". Anything that goes past the picker (retrieving assets) needs authorization and a usage description, and "Attempting to access the Photos library without a valid usage description causes your app to crash". The picker initialiser `init(photoLibrary:)` is the library-configured form (PHPickerConfiguration page, read; its behaviour text was not on the page, so what it does with `assetIdentifier` is UNVERIFIED here). Our own gate G11a says the photo usage string appears only in the allow-listed profile. So a door that uses the library configuration needs the usage string, the authorization state and the F2 profile; it then fails when F2 is off or when G2 leaves the library part dark. The delta says the door sits under F1 alone and is never removed by a failed library gate (R169, founder Q5). Both cannot hold unless the library configuration is confined to the F2 profile.
- Proposed change: R88, NEW-3 and NEW-5 say: the door and the inline host use `PHPickerConfiguration()` with no library argument in every profile; the library-configured form exists only behind F2 and only after G2 question 1 is answered; a build test fails if the F1-only profile contains the usage string, a PhotoKit authorization call, or the library initialiser (extends G11a and the scan of R226). Under F2 and Full or Limited access, the date for a picked picture may come from the asset; that path is a library read and sits behind the primer and the F2 gates.
- Evidence: READ: Apple PhotoKit article "Delivering an Enhanced Privacy Experience in Your Photos App" (developer.apple.com markdown page); PHPickerConfiguration page (init list only). READ: delta NEW-5, R169; PRD G11a (line 1007). `PHPickerConfiguration(photoLibrary:)` behaviour: UNVERIFIED.

## EXH-LEG-3 (MAJOR) Two modes, one product: every sentence about what we see has to be true in each mode

- Delta: section 8 ("A picked picture produces no signal of any kind, because we never see the library through the picker"); R120 line ("the first thing a parent can do on the tab with no permission is pick pictures"); R75 change (picks outside the limited set).
- Finding: These sentences are true for a parent with no access. They are false for a parent who granted the library read, where we do see dates, times and places. If any of them reaches the door's label, the host sheet, the Notes for Review or the policy as "we only see the pictures you choose", it is a public claim made in the founder's name that the shipped build contradicts. That is the exact pattern my earlier review flagged (EX-CLO-12; PRD H-11 and R193). The Limited state adds a second trap: Apple's article says the limited library is a subset "your app can only access"; the delta reports that the picker can still pick outside it (forum thread; Apple's own statement UNVERIFIED). A parent who chose Limited to restrict us may be surprised that the in-app picker browses everything. The picker is Apple's design and the parent's explicit act, so I do not read it as circumvention, and counsel must confirm; the risk is in our words around it. Last, a pick can trigger a system download of an iCloud original (delta R91 carve-out), so a line that says the app "works without a network" or "nothing leaves your phone" is untrue at that moment.
- Proposed change: (a) a content rule: sentences about the picker path say what we receive in that path and name the mode; no sentence says "only" or "never" about what we see across modes; (b) R193 and H-11 gain the door and the host sheet as claim surfaces, each a registry row with a proving test per mode; (c) the Limited state's copy says "Choose other pictures" and does not say we can only see the ones selected; (d) the iCloud carve-out is stated where network behaviour is claimed; (e) the delta's sentences stay in internal docs.
- Evidence: READ: PhotoKit article ("your app can only access these assets"); delta sections 1 and 8, R75, R91; PRD H-11, R193. Picker under Limited access: forum thread only, UNVERIFIED against Apple text.

## EXH-LEG-4 (MAJOR) Apple's first-time picker text appears in our flow, in words we cannot edit, and may be wrong for a parent with full access

- Delta: section 1 ("first-time experience ... an Apple onboarding UI appears explaining the app can only access selected photos"); G1a unknown (e); NEW-6.
- Finding: I did not read the source of that behaviour (the delta read it in a WWDC page summary; I did not re-read it, so it is carried, not verified). If the statement shows when a parent has granted Full or Limited library access, it tells them something about our app that our primer contradicts ("reads the date, time and where pictures were taken on this phone"). We cannot change Apple's words. The DPLA, read today, requires that any description we add in a system panel "must accurately ... not misrepresent the scope of use" (3.3.3(F)(iv)); that clause binds our strings, not Apple's, but two statements in one flow that disagree is the shape of a misrepresentation complaint against whoever is the seller of record, which is the founder personally. Whether it shows under Full access at all is unknown; G1a (a) and (e) are the right place to find out.
- Proposed change: G1a records, per access state (None, Limited, Full), whether and when the text appears and its exact words, in light and dark. Rule until read: under Full access the picker is not embedded unless the text is shown to counsel with Q1; our own day sheet serves Full access. If the text appears only under None, no change. Add to Q1 as a sub-item. Counsel must confirm.
- Evidence: READ: DPLA 3.3.3(F)(iv) (developer.apple.com, 21 Nov 2026). The onboarding behaviour: UNVERIFIED (delta only, WWDC summary).

## EXH-LEG-5 (MAJOR) Q4 widens: a picked file can carry coordinates, and the date read must never touch them

- Delta: section 1 (EXIF; Options menu "not offered to apps that have full library access"); NEW-3 ("reads only the date from the file inside native; no coordinate leaves native"); founder Q3.
- Finding: My earlier review left the location clause unread (EX-CLO-6). I have now read it verbatim. DPLA 3.3.3(F)(ii): applications "that otherwise obtain a user's location through the use of the Apple Software or Apple Services, must notify and obtain consent from a user before a user's location data is collected, transmitted or otherwise used by the Application". Whether the coordinates inside a picture a parent chose are "location data" the app "obtains", and whether opening the file to read a date and then stripping it is "use", is a question for counsel. Two facts make it sharper. With Full access, the delta says the parent cannot strip location in the picker (session text, carried, UNVERIFIED by me), so files arrive with coordinates. And a library-configured pick under F2 would make the asset's location readable through PhotoKit. The delta's default for founder Q3 (date chip only, no place from a picked picture) is the right legal posture: it keeps the picker path out of Q3 and Q4.
- Proposed change: (a) NEW-3 and R95 say the date read uses an API call that returns a day value and never parses GPS tags, and a scan test fails if the picker code touches a location property or tag; (b) Q4 gains sub-item (b): does handling a GPS-bearing file only to read its date and re-encode it without location count as obtaining or using location data; (c) the host sheet and policy do not say "we do not read your location" unless the test in (a) proves it; they say what we keep: no location is kept in a stored copy (NS-01-R17); (d) G1a (c) records what the item provider and the asset give for date and GPS under each access state, as an input to Q4. Counsel must confirm.
- Evidence: READ: DPLA 3.3.3(F)(ii) and (iv), verbatim, via the fetch tool, 21 Nov 2026. READ: delta sections 1, 3, 11. EXIF presence in picked files and the Options menu behaviour: UNVERIFIED (forum thread and WWDC summary only). Attachment 6 (maps): still UNVERIFIED.

## EXH-LEG-6 (MAJOR) "We remove location" is proven for pictures, not for videos, and the hybrid adds multi-select video

- Delta: NEW-3 (pictures and videos); R90 (6 pictures, 2 videos); R88.
- Finding: The photo PRD says video re-encode with every metadata atom removed is the plan and that "the API for this is UNVERIFIED" (`27-photo-moments-and-media.md`, NS-52-R5), and its own risk table lists "Location or device metadata leaks" for a child's video, with a spike required before any build with the video flag (NS-52 spike row). The hybrid's picker makes multi-select video the normal path. If any text says the app strips location from what a parent adds, it is a claim about videos that nothing proves yet.
- Proposed change: NEW-3's video selection stays off until the NS-52 metadata spike has a read-out; until then, public and in-app text says "pictures" only; the door is pictures-only if the spike has not passed at freeze. This is a scope call for the CPO; the claim hold is mine (fail-closed, reversible).
- Evidence: READ: photo PRD NS-52-R5, risk row and spike row (on `wip/moments-prd`); delta NEW-3. The metadata removal API: UNVERIFIED (their own label).

## EXH-LEG-7 (MAJOR) Policy, label and Terms contradictions that remain under the hybrid

Findings carried and added, so the founder sees one list:

| # | Contradiction | Where | Effect of the hybrid |
|---|---|---|---|
| a | Policy says the first store build has servers off; the label says the first store build is the production profile with servers on | `privacy-policy.md` line 21; label `:84` (EX-CLO-1, BLOCKER) | Unchanged. Still a precondition of G2 |
| b | Policy: "We do not collect ... photos" | `privacy-policy.md` line 45 | Worse: the door stores a copy of a picked picture on the phone, and the library read reads dates and places. Apple's definition of "collect" (off the device, held longer than the real-time request) is read below and probably keeps the label at "not collected"; the policy sentence uses the everyday word and is wrong on its face. Counsel must confirm |
| c | Label row "Photos or Videos: No. No photo feature in v1.0"; permissions "Photos ... Not used"; checklist "No photo picker" | label `:54`, `:117`, `:127` | Each is false the day the door ships, even if the Apple answer stays "No" |
| d | Terms 4.1.0 silent on pictures, other people's children, approximate labels | grep (EX-CLO-10) | The door is the first place a parent attaches a picture of someone else's child. Needed for the door as well |
| e | "Never leaves the phone" and "we hold nothing" sentences | PRD R135, R166 (EX-CLO-12) | Unchanged; a door-specific variant is EXH-LEG-3 |
| f | The primer's "Never" column and the host sheet's heading speak for two different consent models | 8.5; NEW-4 | New. One content key set, mode-scoped (EXH-LEG-3) |

- Apple primary text, READ today (App Privacy details): "Collect" means "transmitting data off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time". "Data that is processed only on device is not 'collected' and does not need to be disclosed in your answers. If you derive anything from that data and send it off device, the resulting data should be considered separately." The data type "Photos or Videos" is defined as "The user's photos or videos". The same page says a feature "that enables users to upload a particular media type, such as photos or videos" needs disclosure of that type. Under Variant A pictures do not leave the phone (R104), so "not collected" can stand; Variant B, any picture sync and any future upload change that at once. This supports the PRD's R81; it says nothing about state law.
- Proposed change: draft the picture lines for Privacy Policy 3.1.0, Terms 4.2.0 and label 2.3.0 as the earlier review proposed, now including the door; fix `:54`, `:117` and `:127` in the same commit that merges the photo flag; hold all as `draft-for-counsel`.
- Evidence: READ: label, policy and Terms on `wip/moments-prd`; Apple App Privacy details page (developer.apple.com, 21 Nov 2026); PRD R81, R104, R135, R166.

## EXH-LEG-8 (MINOR) Permission ask timing: the hybrid is consistent, with two traps

- Finding: Apple's PhotoKit article, read today: "Avoid making PhotoKit calls when your app first launches ... make these calls in response to direct user action." The PRD's R70 and R71 follow that, and the picker needs no ask at all, so the door can be offered before and without the primer. Two traps. (1) The door and the library ask must not share a flow. If a parent finishes a pick in the host sheet and the next screen is the primer or the ask card, that is the pattern 5.1.1(iv) names ("not attempt to manipulate, trick, or force people to consent"; "provide alternative solutions for users who don't grant consent"). The door is that alternative; it should never be a funnel into the ask. (2) The Limited state: Apple's article says that by default "the system automatically prompts the user to update their limited-library selection once per app life cycle" and tells apps to suppress that and present it from their own affordance. R75 does not say the suppression is set. An automatic system prompt at a time we did not choose is an ask outside the primer.
- Proposed change: R70 and R120 add: the host sheet never presents the primer or the ask card, and the ask is shown only on the tab, on the parent's own tap; R75 and G7 add: the automatic limited-access alert is suppressed through the plist key Apple's article shows (the key's name is in an image I could not read: UNVERIFIED; `mobile` confirms) and a G7 row asserts it. 
- Evidence: READ: PhotoKit article ("Determine and Request Authorization", "Present the Limited-Library Selection Interface"); Apple guidelines 5.1.1(iv), verbatim. READ: PRD R70, R71, R75; delta R70, R75 rows.

## EXH-LEG-9 (MINOR) The host sheet must not interfere with Apple's panels, and must not hide a privacy control

- Finding: DPLA 3.3.3(F)(iv), read verbatim: applications "must not disable, override or otherwise interfere with any Apple-implemented system alerts, warnings, display panels, consent panels and the like, including ... those that are intended to notify the user that ... photos ... are being collected, transmitted, maintained, processed or used". Apple's PHPickerViewController page says the view is system-rendered, "you can't subclass" it, and "In iOS 17 and later, the picker controller ignores touch events while its opacity is anything other than fully opaque". Our host sheet (paper chrome, our own Start and Cancel, possible glass or fade) must keep the picker fully opaque and unobscured, including its first-time text. The delta lists `photosPickerDisabledCapabilities` and accessory hiding as options. If a disabled capability removes the Options control that lets a parent strip location (which capability maps to it is UNVERIFIED), we would be hiding a privacy control Apple built for the parent.
- Proposed change: NEW-4 adds: nothing overlaps or fades the picker view; no disabled capability that hides a parent-facing privacy control; G1a (b) records which capability hides which control; a G7 row covers the first-time panel. This is a reading of 3.3.3(F)(iv), not a finding of breach: counsel must confirm.
- Evidence: READ: DPLA 3.3.3(F)(iv); PHPickerViewController page (developer.apple.com markdown, 21 Nov 2026); PHPickerConfiguration page (the `disabledCapabilities` property listed, behaviour not described). Mapping of capabilities to controls: UNVERIFIED.

## EXH-LEG-10 (MINOR) App Review: the story improves; the Notes for Review must not overclaim it

- Finding: Guideline text, READ today: 5.1.1(iii) "Where possible, use the out-of-process picker or a share sheet rather than requesting full access to protected resources like Photos or Contacts."; 5.1.1(iv) "Where possible, provide alternative solutions for users who don't grant consent."; 5.1.1(ii) "Paid functionality must not be dependent on or require a user to grant access to this data." The door answers (iv) and (ii) directly and narrows the argument under (iii): the library read is for suggestions, Recent and place and date lines that the picker cannot give. That is a fair, checkable argument. It stays an argument: a reviewer can still say the library read is "not relevant to the core functionality", and I do not know how App Review will decide. R80's draft sentence "we use the system picker wherever it suffices" is absolute, and under Full access our own day sheet reads the library where a picker could have served. Say what the build does, and keep the Notes under the same rule as the policy (EX-CLO-16).
- Proposed change: R80 says "picking pictures uses the system picker in every state; the library read is used only for suggestions, Recent and place and date lines" and carries a table mapping each sentence to its code row; counsel reads it with the G2 answer. 5.1.2(vi) stays as in EX-CLO-5: the guideline sentence, READ again verbatim today, lists "depth and/or facial mapping tools (such as ARKit, Camera APIs, or Photo APIs)"; the DPLA's definition of Face Data (section 1.2, READ) is "information related to human faces ... including data from an uploaded photo ... through ... the Photo APIs". That supports the narrower reading (face data) for 5.1.2(vi), but I cannot say which reading App Review applies: counsel must confirm.
- Evidence: READ: Apple App Review Guidelines 5.1.1(ii) to (iv), 5.1.2(i) to (vi) (developer.apple.com, 21 Nov 2026; no page date shown); DPLA 1.2 "Face Data".

## EXH-LEG-11 (MINOR) Dropping R56 removes the one control for a painful picture; keep it default-off

- Delta: R56 DROP; founder Q2 ("a parent who does not want a picture simply does not tick it").
- Finding: R57 (album chooser) is a pure UI cost and its drop is fine. R56 is different. The tick argument covers a picture the parent attaches. It does not cover a picture our own surfaces show first: Recent, day tiles and cover tiles come from the library read, and R255 says "a sensitive picture can be removed before it becomes a cover tile" and gives the example of a receipt day. RK-3 and U24 are about a painful place label; the same family of harm applies to a painful picture showing as a card cover. Nothing in law I have read obliges us to offer the control, so this is risk reduction in the founder's own name, not compliance; the CPrivO owns the data side (EX-PRV-9).
- Proposed change: drop R57 now. For R56, keep the PRD's own compromise (R247: present in the table, default-off behind a constant, nothing stored in the first release) and decide with the CPrivO whether a session-only "not this picture" with no stored identifier is enough. A drop is the founder's call with that exposure in front of him.
- Evidence: READ: PRD R56, R57, R247, R255, RK-3, U24; delta sections 2 and 11.

## EXH-LEG-12 (MINOR) What I read of the Apple developer licence, and what is still UNVERIFIED

- Finding: The question was whether the licence says anything specific about photos. In the range the fetch tool returned (sections 1.2 to 5.1 of the agreement page; the page has 666,413 characters and the tool said the first 200,000 were covered) I read verbatim: 3.3.1 (including (G) Documentation, which means the Human Interface Guidelines), 3.3.2, and 3.3.3 (A) Recordings, (B) Collection and Use of Data, (C) Disclosures to Users, (D) Legal and Other Requirements, (F) Location and Maps; User Consents, and (K) Face Data, plus the 1.2 definition of Face Data. The tool reported that the word "photo" appears only in 3.3.3(A) ("an image, photo, voice or speech capture"), in 3.3.3(F)(iv) (the list of protected data) and in a content clause (3.3.4(A)(iii)), and that there is no separate photo-library clause. Journaling Suggestions, 3.3.3(H), I read verbatim earlier today for EX-CLO-14; I did not re-read it in this pass. That is the licence's answer on photos as far as the text I read goes: no photo-library clause, and general data duties that bite through 3.3.3(B), (C), (D), (F)(ii) and (F)(iv). Not read: Attachment 6 (Apple Maps), the remaining 3.3.3 lettered clauses one by one (the tool summarised them), anything after the covered range, and any version or effective date of the agreement. UNVERIFIED on each.
- Proposed change: `legal` re-reads 3.3.3 in full from the agreement itself before G2 and records the version date. Counsel must confirm how 3.3.3(B) "may not collect user or device data without prior user consent" and (C) interact with an on-device read.
- Evidence: READ: https://developer.apple.com/support/terms/apple-developer-program-license-agreement/ (21 Nov 2026), through the fetch tool.

## EXH-LEG-13 (MINOR) The counsel brief needs sub-items, not an eleventh question

- Finding: The delta says no counsel question is dissolved. I checked each (table below) and agree. Adding a question 11 would split the counsel's reading of one product across two lists. The door's questions fit under existing numbers.
- Proposed change (RULED as brief drafting, `CLO-` number to be assigned when recorded): add sub-items: Q1 (c) Apple's first-time picker text next to our primer (EXH-LEG-4), (d) stored copy of a picked picture and the Photos or Videos row (EXH-LEG-7); Q4 (b) handling a GPS-bearing picked file (EXH-LEG-5); Q6 (b) Terms for pictures the parent picks, including other people's children; Q7 (b) temporary copies and system iCloud download after a pick (EXH-LEG-14); Q8 (b) mode-scoped sentences (EXH-LEG-3). G2's row text gains "and the door's sub-items". Packet 1.8.0 is the vehicle.
- Evidence: READ: PRD 21.3; my earlier brief (clo.md, "Counsel brief"); delta section 5.

## EXH-LEG-14 (MINOR) Temporary copies, iCloud download and erase

- Finding: NEW-7 removes temporary copies on back-out and on Erase. A pick of an iCloud-only item makes the system download the original to the phone after the parent chose it (delta R91); that download is Apple's service and the parent's act, not ours, but the copy lands in our process and then in our temporary folder. The deletion promise (R97, R166) and the backup line (R235) must cover the temporary copies, and any claim about network use must carve the pick out (EXH-LEG-3).
- Proposed change: add the temporary folder to the zero-residue test and to the Q7 facts; state the iCloud download only where a claim about network use is made. Counsel must confirm Q7.
- Evidence: READ: delta R86, R91, NEW-7; PRD R97, R166, section 17.

## EXH-LEG-15 (MINOR) An identifier crosses the picker boundary and is not in the closed read set

- Finding: G3 approves a closed READ_SET_V1 for the library scan. In the library-configured form, the picker returns an `assetIdentifier` that the pipeline resolves (NEW-5). The delta says no identifier is stored and the kept letter holds none (R93). That is right, but the identifier is a library member in memory for a moment and belongs on the same signed list as the scan's members, with the rule "never stored, logged or sent".
- Proposed change: G3 includes the picker identifier as a member with that rule; R226's scan covers the picker code; R162's canary runs through the picker path (R257 already adds attach).
- Evidence: READ: delta NEW-5, G3 row; PRD G3 (line 999), R162, R226.

# Q1 to Q10 (section 21.3): do any dissolve under the hybrid

I agree with the delta: none dissolve. Checked one by one against what the hybrid keeps (library read, place read, tab label, Terms, publisher):

| Q | Dissolved? | What changes | Door alone needs it? |
|---|---|---|---|
| 1 Label and consent | No | Widens: Apple's first-time picker text beside our primer (EXH-LEG-4); stored copy of a picked picture (EXH-LEG-7 d) | Label and policy part, yes (through the photo flag, EXH-LEG-1); the library consent part, no |
| 2 Picture-timed reminders | No | Nothing. Phase 2, F4 off. A picked picture produces no signal | No |
| 3 Naming a place from pictures | No | Narrower: place comes only from the library read, never from a picked file (delta Q3 default) | No |
| 4 DPLA location | No | Widens: 3.3.3(F)(ii) now read verbatim; sub-item for GPS-bearing picked files (EXH-LEG-5) | Only if the date read touches the file's location; fixed by the scan rule |
| 5 Trademark | No | Nothing. The tab label appears in every build, so a door-only build still shows "Moments" | Yes (tab label) |
| 6 Terms | No | Widens: pictures a parent picks, other people's children (EXH-LEG-7 d) | Yes |
| 7 Deletion and backup | No | Widens: temporary copies and system iCloud download (EXH-LEG-14) | Yes |
| 8 Policy mechanics | No | Widens: mode-scoped sentences (EXH-LEG-3) | Yes |
| 9 Publisher and liability | No | Nothing. Same seller of record, same 5.1.1(ix) question; the door lowers the sensitive data in the no-access path but the library read remains | Yes |
| 10 Place data and geocoder | No | Nothing. The place table and the licence stand | No |

# Gates G1 to G11: delta verdict against mine

| Gate | Delta | Mine | Why |
|---|---|---|---|
| G1a | CHANGE | CHANGE, agree | Add (c) as an input to Q4 and (a) and (e) as inputs to Q1; record per access state, with exact words of Apple's text |
| G1b | CHANGE | KEEP the delta | Budget only; no legal effect |
| G2 | KEEP | CHANGE | Same ten questions plus the sub-items of EXH-LEG-13; the door's legal set is a separate precondition (EXH-LEG-1) |
| G3 | KEEP | CHANGE (minor) | Add the picker identifier member (EXH-LEG-15); the "no stored identifier" decision is simpler, as the delta says |
| G4 | CHANGE | KEEP the delta | No legal effect; the task on the picker door with access refused tests 5.1.1(iv) in practice |
| G5 | CHANGE | KEEP the delta | Scope to our surfaces; Apple's UI is observed, not scanned |
| G6 | KEEP | CHANGE | Add the mode-scoped claim test (EXH-LEG-3); Apple's text is still not scanned, but our sentences beside it are |
| G7 | CHANGE | CHANGE, agree | Add: automatic limited-access alert suppressed; first-time picker text shown unobscured; revoke while the host sheet is open must stop any asset read (the DPLA's 3.3.3(F)(iv) sentence: if consent is withdrawn the app may not "collect, transmit, maintain, process or utilize such data") |
| G8 | KEEP | KEEP | Geocoder stays out of the first release |
| G9 | KEEP | KEEP | Not planned |
| G10 | KEEP plus a line | CHANGE | The door is its own reversal (a picture attach from the tab, in every access state); record it in the four-signature form, not as a footnote |
| G11 | CHANGE | CHANGE, agree, plus | (a) The F1-only profile has no usage string, no PhotoKit authorization call and no library initialiser (EXH-LEG-2). (d) Store paperwork parity includes the door's picture lines, the label fixes and the Notes for Review (EXH-LEG-7, EXH-LEG-10) |

# Does anything in the delta's own legal reading need correcting?

| Delta statement | Source I read | Result |
|---|---|---|
| The picker needs no library authorization | Apple PhotoKit article: "private by default. The user doesn't need to explicitly authorize your app to select photos" | CONFIRMED (primary text). Upgrades the delta's "SOURCE-READ (summary)" |
| The picker is out of process, cannot be reached into or restyled | PHPickerViewController page: system-rendered, "you can't subclass" it, view hierarchy belongs to the system | CONFIRMED |
| Present at iOS 17 floor with inline style | PHPickerViewController availability read: iOS 14. The inline style modifier and its iOS 17 floor: not on the pages I read | UNVERIFIED by me |
| Works under Limited access, including picks outside the limited set | Apple's article describes the limited library as what "your app can only access" through PhotoKit; no statement on the picker | UNVERIFIED (forum thread only) |
| First-time Apple text; Options menu; GPS in picked files | Not on any page I read | UNVERIFIED by me; G1a answers |
| 5.1.1(iii) and "better App Review story" | 5.1.1(ii), (iii), (iv) verbatim | SUPPORTED, but see EXH-LEG-10 |
| Door alone needs none of Q1 to Q4 and Q10 | Primary texts above, packet and drafts | PARTLY: right for the library questions, wrong if read as "needs no counsel" (EXH-LEG-1) |

# Answers to the delta's founder questions Q1 to Q5 (section 11), legal seat

These are recommendations for the founder, with the CPO and Design as owners of the product call. None is applied. Counsel must confirm anything that rests on a legal reading.

1. Q1, where the inline picker lives: in a full-height sheet, as the delta recommends. Legal reasons: it keeps Apple's first-time text and our primer from sitting on one screen (EXH-LEG-4), it keeps the door away from the ask card so it cannot read as a funnel (EXH-LEG-8), and one sheet is easier to keep fully opaque and unobscured (EXH-LEG-9).
2. Q2, drop R57 and R56: drop R57 now. Keep R56 default-off as R247 already has it, rather than dropping it, and decide with the CPrivO (EXH-LEG-11). This is risk reduction, not a legal duty.
3. Q3, date chip only: yes. It keeps the picked path out of Q3 and Q4. Add the rule that the date read never parses a coordinate (EXH-LEG-5).
4. Q4, defer the viewer: no legal objection either way. The letter page's own viewing rules (R101) are unaffected.
5. Q5, the door under F1 alone so a failed library gate never removes it: yes, on two conditions. The door is the plain picker with no library configuration (EXH-LEG-2), and it ships with the photo flag's legal set (EXH-LEG-1). Without those, "independent of every library gate" is true and "ships without counsel" is not.

# What I read and what I did not

Read this session (21 Nov 2026):
- `docs/product/moments-tab/HYBRID-PICKER-DELTA.md` on `wip/moments-picker-delta` (head a84f448c), all 12 sections.
- `docs/product/prd/28-moments-tab.md` on `wip/moments-prd` (head 1c1e05bc): the rows and sections cited above, not every line. Counsel question map (21.3), gates (21), R56, R57, R70 to R81, R247, R255, H-11, RK-3, U23, U24.
- My earlier reviews `clo.md` (all) and `cco.md` (verdict, conditions, source table, gate table; not every finding row).
- `docs/agents/exec/COUNCIL.md`; both role skills from `develop` (the output of the CCO skill's later sections was cut off by the tool; I read it to its application sections and the rest through my earlier review).
- `docs/legal/` on `wip/moments-prd`: label, Privacy Policy and Terms (greps and cited lines), `COUNSEL_PACKET.md` (cited lines); `docs/product/prd/27-photo-moments-and-media.md` (greps for metadata, picker and video lines).
- Apple App Review Guidelines 5.1.1 (i) to (x), 5.1.2 (i) to (vi), 5.1.3, 4.5.4, verbatim, via the fetch tool; the page showed no "last updated" date and the tool covered its first 100,000 of 121,052 characters.
- Apple App Privacy details page (collect, on-device, Photos or Videos, Precise and Coarse Location, optional disclosure), verbatim extracts.
- Apple Developer Program License Agreement: 1.2 Face Data, 3.3.1, 3.3.2, 3.3.3 A to D, F, K, verbatim extracts; first 200,000 characters of 666,413.
- Apple documentation pages: PhotoKit article on the enhanced privacy experience; PHPickerViewController; PHPickerConfiguration (property list only); PhotosPicker (overview only, no style modifiers listed).

UNVERIFIED (nothing above rests on these alone): the WWDC picker session behaviour (first-time text, Options menu, inline style and its iOS 17 floor, picks under Limited); whether picked files carry GPS in every case; what `PHPickerConfiguration(photoLibrary:)` does with `assetIdentifier`; the key name that suppresses the automatic limited-access alert; the DPLA version date, Attachment 6, and the lettered 3.3.3 clauses not quoted; the guideline text date; CalOPPA, CAN-SPAM, COPPA and state-law texts (not re-read in this pass); current counsel engagement status; whether the photo flag moves into the Moments release; `PICKER-ROUTE-FEASIBILITY.md` (does not exist on the remote).

Memory: no stored user fact was needed for this review.

Signed: Chief Legal Officer (Claude role, not a lawyer) and Chief Compliance Officer (Claude role, not counsel). Counsel must confirm every legal conclusion above.
