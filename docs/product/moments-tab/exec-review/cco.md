# NS-53 Moments tab: executive review, Chief Compliance Officer

Reviewed: `docs/product/prd/28-moments-tab.md` on `wip/moments-prd` at 5bebd892, all 1187 lines, 21 Nov 2026.
Seat: Chief Compliance Officer (Claude role, not counsel). Nothing here is legal advice. Every "does a law apply" call below is counsel's to confirm.
Scope of this review: which laws and store rules bite, the obligations register, evidence needed before submission, whether gates G1 to G10 are sufficient and testable, and how the compliance fence is touched. Founder rulings of 21 Nov are taken as given: library read ships in the first release; places and special occasions are in; faces and people are out.

## Verdict: ACCEPT-WITH-CHANGES

The design is unusually careful about the compliance shape: nothing library-derived leaves the phone, the tab works with access refused, no permission is forced, and the release gates are fail-closed per part. I do not reject it. But the first release now carries a library read and a location read, and the paperwork that would let us claim that is not in place. Section 25.7 asks whether the compliance rows in section 21 are complete. They are not.

### Conditions (all must hold before F2 is switched on in a store-bound build)

1. Counsel is engaged and the Moments questions are in `docs/legal/COUNSEL_PACKET.md` with a send date (EX-CCO-1).
2. The register has dated rows for the library read, the location read, the place table, reminders and the lifecycle email, and CR-083 no longer says "no full library access" (EX-CCO-2).
3. The gate set gains a store-paperwork gate and an evidence index; each gate names who signs a pass and where the read-out lives (EX-CCO-3).
4. The location read is a separate switch from the date read, so one "no" does not take down both (EX-CCO-5).
5. The contradiction in 13.3 about a lock-screen line that mentions pictures is removed (EX-CCO-7).
6. The PRD names every fenced path it touches and who approves (EX-CCO-9).

## Counts

14 findings: 2 BLOCKER, 8 MAJOR, 4 MINOR.

## What I read this session, and how sure I am

VERIFIED means I opened the source on 21 Nov 2026. UNVERIFIED means I did not, or could not.

| Rule | Status | Source and note |
|---|---|---|
| Apple 5.1.1(iii) data minimisation, prefer the out-of-process picker; 5.1.1(iv) no forcing consent, offer an alternative; 5.1.1(v) account deletion | VERIFIED | https://developer.apple.com/app-store/review/guidelines/ read 21 Nov. The page did not show its "last updated" date to my fetch; the CCO skill says 16 Oct 2026 (carried, UNVERIFIED here). |
| Apple 5.1.2(i) no required system functions (push, location); ATT explicit permission to track; 5.1.2(ii) no repurposing; 5.1.2(iii) no surreptitious profile; 5.1.2(iv) no contact database from Photos; 5.1.2(v) no contacting people using Photos or Contacts data except at the user's explicit individualised initiative; 5.1.2(vi) data from "depth and/or facial mapping tools (such as ARKit, Camera APIs, or Photo APIs)" not used for marketing, advertising or use-based data mining | VERIFIED | Same page. Note the exact wording of (v) and (vi): see EX-CCO-6. |
| Apple 4.5.4 push not required, "should not be used to send sensitive personal or confidential information", promotions only on explicit opt-in | VERIFIED | Same page. |
| Apple 1.3 and 5.1.4 Kids | VERIFIED | Same page. We are not in the Kids Category. |
| Apple App Privacy: "Collect" means transmitting data off the device so you or partners can access it longer than needed to service the request in real time; data processed only on device is not collected; "if you derive anything from that data and send it off device, the resulting data should be considered separately"; Precise Location is latitude and longitude at three or more decimal places | VERIFIED | https://developer.apple.com/app-store/app-privacy-details/ read 21 Nov. This supports the PRD's "Photos or Videos and Location not collected while nothing leaves the phone" (R81), for the Apple label only. It says nothing about state law. |
| CAN-SPAM: commercial means primary purpose is commercial advertisement or promotion; transactional or relationship categories are read narrowly; mixed messages turn on primary purpose and the subject line; opt-out honoured within 10 business days, no fee, nothing beyond an email address; valid physical postal address; penalties up to $53,088 per violating email | VERIFIED | https://www.ftc.gov/business-guidance/resources/can-spam-act-compliance-guide-business read 21 Nov. |
| Compliance fence paths and approval procedure | VERIFIED | `compliance/FENCE.json` and `compliance/README.md` on this branch, read 21 Nov. |
| Register rows CR-060, CR-083 and the counsel packet contents | VERIFIED | `docs/legal/compliance-register.md` 1.6.0 and `docs/legal/COUNSEL_PACKET.md` on this branch. |
| Washington RCW 19.373 (whether a photo's location, or a hospital name, is consumer health data; "collect" and "regulated entity" definitions) | UNVERIFIED | The legislature's site refused my fetch (robots). Do not build a founder recommendation on it. |
| COPPA FAQ points on adult-collected information about children (F.4), audio of a child (F.6), the 2025 amendments | UNVERIFIED this session | Carried from the CCO skill (read 31 Oct 2026). Not re-opened. |
| Texas SB 2420 effect date and the Declared Age Range iOS 26 floor; California AB 1043 operative 1 Jan 2027 and penalty amounts | UNVERIFIED this session | Carried from the CCO skill; AB 1043 was secondary-source only even then. The register's own Texas dates are flagged UNVERIFIED by the skill. |
| CCPA thresholds, CalOPPA, GDPR articles, BIPA | UNVERIFIED this session | Carried from the skill and the register. |
| `CLGeocoder` uses a network service; what Apple logs; the Apple Developer Program License Agreement 3.3.3(H) | UNVERIFIED | The PRD carries these as the leads' findings (section 27). I did not re-read them. |
| PhotoKit behaviour: whether `asset.location` is readable under Limited access and without a Core Location permission | UNVERIFIED | The PRD marks it UNVERIFIED (section 27). It decides whether the purpose string and the label are right. |

## Applicability, in the order the skill asks for

Applies: Apple 5.1.1(iii), (iv), (v); 5.1.2(i) to (vi); 4.5.4; Apple App Privacy label accuracy; CAN-SPAM for the phase 2 email (designed to the commercial standard whatever counsel classifies); CalOPPA (policy must say what the library read does). Counsel must confirm all of these.
Applies later: California AB 1043 age signal from 1 Jan 2027 (41 days from today, so inside the 90-day window and needs an owner; UNVERIFIED at primary level); Texas age assurance (in force for new Texas accounts per Apple, UNVERIFIED this session).
Does not apply, on the PRD's facts: COPPA (adult surface, child never a user), GDPR and UK GDPR (US storefront only, D-083), CCPA thresholds, Kids Category. Each is "counsel must confirm" and each rests on the fact that nothing from the library leaves the phone.
Unknown: state sensitive-data and precise-geolocation laws as applied to an on-device read of a picture's coordinates (EX-CCO-5); whether 5.1.2(v) and (vi) reach a reminder timed from pictures (EX-CCO-6).

## Gate sufficiency, G1 to G10

| Gate | Testable as written? | Gap |
|---|---|---|
| G1 Device spike | Yes: a written read-out with device numbers | It also fixes thresholds that change what is read; those values must be recorded in the read-out, not only in `rules.ts`. |
| G2 Counsel read | Not yet | Depends on counsel who is not engaged, and on question ids that are not in the packet (EX-CCO-1). "Counsel's written answer on each" has no named question list in the packet. |
| G3 READ_SET_V1 approval | Yes if the signed set is a committed file the scan (R37) reads | Needs the location read split from the date read (EX-CCO-5). |
| G4 Five-parent check | Weak | "The section 20 bar" is a set of stop lines for hypotheses, not one pass mark. State the pass line for G4 itself, and that "I did not expect it to know" halts the signal (R60 says so; G4 should too). |
| G5 Accessibility pass | Partly | "Device rows W1 to W12" refer to a document I could not find in this PRD or on this branch (UNVERIFIED). Name the file. |
| G6 Content rules | Yes: `rules.test.ts` and the glossary | Add the new reason strings and the lock-screen wording (EX-CCO-7). |
| G7 Real-iPhone checks | Yes: dated read-out | Add deletion and revocation (R115 "a scan finds zero bytes") and the app-lock snapshot (R102) by name. |
| G8 Place data flow | Yes, and fail-closed | Fine as a gate. See EX-CCO-13 for the label impact. |
| G9 Suggestions | Yes, and not built | None. |
| G10 Founder signs | Yes: a D-### entry | The entry list RV-01 to RV-22 must say which are signed in effect by the 21 Nov rulings, so the record is complete. |
| Missing: store paperwork parity | n/a | Listed under "Also in force" in section 21 but is not a gate, has no owner and no read-out. See EX-CCO-3. |
| Missing: age gate and fence evidence | n/a | See EX-CCO-9 and EX-CCO-10. |

## Findings

### EX-CCO-1  BLOCKER  Counsel gates have no engaged counsel and no packet entries
Requirements: NS-53-R80, R81, R171, G2, G8, section 21, section 22 RK-1, O-02.
Finding: G2 and G8 are release gates that need written counsel answers. The Moments questions are named CQ-16, CQ-17 (13.6), Q-X1-6 and Q-X1-12 (RK-11) in the PRD, but `docs/legal/COUNSEL_PACKET.md` on this branch contains none of those ids. The Q43, Q45 and Q48 the PRD cites in G2 exist in the packet but mean something else there (privacy claims, COPPA for backup, consent design). The packet's own section 6 and the founder queue show counsel send steps as open (F6 in `docs/release/FOUNDER_QUEUE.md`). The CCO skill records counsel as not engaged as of 28 Oct (carried, UNVERIFIED this session). A release gate that depends on an answer nobody has asked for is not a gate; it is a wish.
Proposed change: (a) `legal` adds a Moments section to the counsel packet with the exact questions in EX-CCO-5, 6, 8 and 13, each with the rule, its source and date read, our reading, options and a default. (b) The PRD maps each PRD question id to a packet question id in one table. (c) Add to section 21 a dated precondition: counsel engaged and questions sent by a named date, else the affected part stays dark (the PRD already says this; make the date explicit). (d) Per the CCO skill, applicability calls stay "counsel must confirm"; the PRD must not read as though counsel has agreed.
Evidence: counsel packet question list (headings Q41 to Q57 and section 7); grep for CQ-16 and Q-X1-6 in `docs/legal` returns nothing; FOUNDER_QUEUE F6.

### EX-CCO-2  BLOCKER  The register says the opposite of the first release and has no rows for the new data
Requirements: NS-53-R169, R175, G10, section 21 "Also in force", RV-04.
Finding: `docs/legal/compliance-register.md` 1.6.0 row CR-083 states the control as "PHPicker / Android Photo Picker for photos (no full library access)" with status Partial. The first release now ships a full-library read with a usage string, Limited access, and a location read. The register has no row for: the library read and purpose string; the location read and place table; the on-phone moments file and its erase paths; a reminder timed from pictures; the phase 2 email's consent row. CR-060 (CAN-SPAM) is a Gap and its control (classify every template, and prefer no commercial email in v1) is not reflected in the PRD. A register that contradicts the shipped build fails the "works in practice" test from the DOJ guidance the skill cites. NS-53-R175 asks for "compliance checks filed" but gives no row ids to file them against.
Proposed change: `legal` (through its docs PR; I review) adds rows with owner, trigger, control, evidence and status Gap until evidenced: library read (5.1.1(iii),(iv), 5.1.2(iii) to (vi)); location read; label and policy parity; reminder timing; lifecycle email (CR-060 refreshed); the age gate ordering. Update CR-083 to say the control is now the primer, the Limited path and the picker fallback. Add the row ids to R175. Per the CCO skill, a row with no evidence is Gap whatever the design says.
Evidence: register lines for CR-083 and CR-060 read 21 Nov; PRD R175, section 17.

### EX-CCO-3  MAJOR  Gate set is missing a store-paperwork gate and an evidence index
Requirements: NS-53-R72, R80, R81, R169, R171, section 21.
Finding: The things Apple actually reviews (App Privacy answers, the privacy policy text, the usage string, the Notes for Review, the privacy manifest) appear only in a paragraph below the gate table. They have no gate id, no owner and no read-out. R171 requires dated read-outs for G1 to G7 and G10 only. G8 and G9 are conditional, so the store paperwork is the one thing every submission needs and no gate names it. The register's CR-088 (privacy manifests) is marked Unverified, not opened.
Proposed change: add G11 "Store paperwork parity": owner `legal` with `privacy`; pass means the label, policy, usage string, Notes for Review and privacy manifest each match the build profile that is submitted (production, which has server features on, per FACT-CHECK in section 17), each with a dated artefact. Add an evidence index table to section 21: gate, artefact, path under `docs/release/<x.y.z>.md`, who signed, date. State who signs a pass (a named role, not the author of the work). Extend R171 to G11.
Evidence: PRD section 21 and R171; register CR-088.

### EX-CCO-4  MAJOR  The 5.1.1(iii) justification is asserted, not evidenced, and the rejection risk is real
Requirements: NS-53-R80, R70, R79, RK-2, section 8.
Finding: Apple's 5.1.1(iii) (verified) says apps should only request access relevant to the core functionality and, "where possible", use the out-of-process picker rather than full access to Photos. Early Letters' core function is speaking a letter. Moments is a convenience tab. R80 plans to say in the Notes for Review why the picker alone is not enough. That argument rests on Recent and place labels needing dates and locations the picker cannot give, which is a reason, but the same page requires "alternative solutions for users who don't grant consent" under 5.1.1(iv). The PRD supplies that (the picker door, R79, R187), which is good. What is missing is the evidence a reviewer sees: a reviewer account and a test path, the exact words, a recording or screenshots of the primer with Not now, and proof that each feature still works with access refused.
Proposed change: add to R80 an artefact list: Notes for Review text (stored under `docs/release/`), a reviewer path that works with access granted and refused, the primer and purpose-string screenshots per version, and the access-refused walkthrough recording. Add to the register row (EX-CCO-2) the exact Apple wording of (iii) and (iv) with the date read. State that RK-2's mitigation (turn F2 off in a point release) needs a tested kill path and that K2 and K3 do exactly that (R170): keep that test in the gate evidence.
Evidence: Apple guidelines page read 21 Nov; R79, R80, R170, R187.

### EX-CCO-5  MAJOR  The location read is a new sensitive data use with no separate switch, and its legal reading is unverified
Requirements: NS-53-R37, R61, R63, R65, RV-19, 7a.1, G1, G3, G8, F2.
Finding: RV-19 widens the read set to a picture's coordinates, read on the phone and dropped once a place id exists. Under Apple's own definition (verified) data processed only on device is not "collected", so the Apple label can hold. Whether state laws on precise geolocation or consumer health data treat an on-device read as collection is a legal judgment I could not resolve: the Washington statute page refused my fetch, so the MHMDA precise-location and health-inference points are UNVERIFIED. The place table names a city, never a venue, which is a sound mitigation for the hospital case (U24). But two things are missing. (a) Minimisation: 5.1.1(iii) asks for data required to accomplish the task, and a place line is the weakest part of the core job. (b) There is one flag, F2, for the ask, the date read, Recent and places. If counsel or Apple objects to location only, the only fallback is to turn off the whole library read, which is the founder's headline ask.
Proposed change: split F2 into F2a (dates, Recent, day cards) and F2b (location read and place table), each with its own gate row, kill switch and allow-list entry in R169. G3 signs the location part of READ_SET_V1 separately, and the scan in R37 reads two lists. Add to the counsel packet (EX-CCO-1): is an on-device read of picture coordinates, held in memory only, "collection" of precise geolocation or consumer health data under Washington, Connecticut and California law; does a home place computed in memory change that; do city-level labels reduce the risk. Confirm by device test whether `asset.location` is readable under Limited access (the PRD's own UNVERIFIED) before the purpose string is written.
Evidence: PRD 7a, section 27 UNVERIFIED list; Apple App Privacy page read 21 Nov; RCW fetch refused.

### EX-CCO-6  MAJOR  Apple 5.1.2(v) is not addressed, and 5.1.2(vi) is quoted more broadly than its text
Requirements: NS-53-R80, R132, R135, R134, G2, F4, O-02, RK-1.
Finding: R80 cites 5.1.2(vi) as "Photo API data not used for marketing or data mining". The verified text says data gathered "from depth and/or facial mapping tools (such as ARKit, Camera APIs, or Photo APIs) may not be used for marketing, advertising or use-based data mining". Whether a Photos library date or location counts is a reading I cannot settle; the PRD's paraphrase makes it sound settled. Separately, 5.1.2(v) (verified) says "do not contact people using information collected via a user's Contacts or Photos, except at the explicit initiative of that user on an individualized basis". A reminder timed from library facts (F4) or a lifecycle email is contact. The PRD's G2 does not cite (v). It is plausible the rule is about contacting other people and not the user themselves; that is counsel's reading to give, not ours.
Proposed change: in R80 and G2 quote 5.1.2(v) and (vi) verbatim with the date read, and list both as counsel questions. Keep F4 off (the PRD already does). Add to R135 that the opt-in for a library-timed reminder is the explicit, individualised initiative 5.1.2(v) mentions, and that no tap, dwell or open history is used (R54 already forbids ranking by behaviour; keep it as evidence for (vi)).
Evidence: Apple guidelines page read 21 Nov; PRD R80, R135, G2.

### EX-CCO-7  MAJOR  Section 13.3 contradicts the identical-words rule and the 4.5.4 posture
Requirements: NS-53-R131, R135, R138, 13.3, NS-51 wording.
Finding: 13.3 says a library-timed note must use an existing evening-class key "word for word", with no library word, and R131 and R135 say the same. Two bullets later it says "The neutral photo wording ('Some pictures from the weekend are here', NS-51) must pass `rules.test.ts` and BRAND.md before it ships." That string tells the lock screen the parent has pictures from the weekend: a library-derived fact on a surface others can see, and it contradicts R138 and "no library word". Apple 4.5.4 (verified) says push should not carry sensitive personal information; whether that line is sensitive is a judgment, but the PRD should not hold two incompatible rules.
Proposed change: delete the neutral photo wording bullet from 13.3 and R131's neighbours, or mark it rejected with the reason; add a content test that fails any push string that mentions pictures, weekends, days or places. Keep R135's identical-words rule as the single rule.
Evidence: PRD 13.3, R131, R135, R138.

### EX-CCO-8  MAJOR  Lifecycle email: suppression versus deletion conflict, and facts for the commercial standard
Requirements: NS-53-R140, R141, R142, R143, R188, 13.6, RV-09, O-03.
Finding: The PRD designs the phase 2 email to the commercial standard, which is the right call. FTC guidance read today: the commercial test is the message's primary purpose, transactional categories are read narrowly, opt-outs must be honoured within 10 business days with nothing asked beyond an email address, a valid physical postal address is required, and penalties reach $53,088 per email. Issues: (a) R142 says deletion "leaves no occasion row, send key or address", while R141 needs "account-wide suppression" that lasts. The register (CR-060) keeps a suppression list as a hash after deletion, so the two rows conflict; if the address is erased the person can be mailed again if they re-register. (b) The PRD does not say whose postal address appears; for an individual publisher that may be the founder's home address, which is a personal exposure (also the D-004 and 5.1.1(ix) hedge in the skill's open items, carried, UNVERIFIED now). (c) The register requires every template to be classified in `packages/content` (CR-060); R141 says "closed class list" but does not say the class is commercial or transactional. (d) The birthday and month-age email uses the child's date of birth, which conflicts with E75 and CATALOG line 161 (C-4); keep it behind RV-09 as the PRD does. (e) A vendor agreement for the sender is needed (register CR-124 lists Resend).
Proposed change: R142 keeps a hashed address on a suppression list after deletion, and R141 and R142 say so. Add a decision on the postal address to the founder questions (CLO and CCO prepare; mail drop or agent is an option for counsel). Add a template-class field (commercial, transactional) to R141's closed list. Keep the email dark and send-to-self until RV-09 and counsel's CQ-17 answer. Do not rely on "transactional".
Evidence: FTC guide read 21 Nov; PRD R141, R142; register CR-060, CR-124.

### EX-CCO-9  MAJOR  The PRD does not say which fenced paths it touches
Requirements: NS-53-R119, R140, R141, R165, R169, R172, 13.6, 19.1.
Finding: `compliance/FENCE.json` has two tiers. The cco_review tier covers `apps/mobile/src/components/gate/**`, `apps/mobile/src/lib/age-gate*` and files whose names contain age-signal or declared-age, plus any `supabase/` diff mentioning `policy_acceptances` or `record_policy_act`. The protected tier covers `compliance/**`, compliance migrations and tests, the regulatory-compliance skill and the fence workflow, plus any `supabase/` diff mentioning a compliance table such as `restricted_jurisdictions`. This PRD will touch some of these: R119 (nothing renders before the age gate) edits or depends on gate code; the phase 2 consent row ("PRIV-R21 consent row", a new migration) may reuse `record_policy_act`; R175 asks `regulatory-affairs` to re-check dates (a fenced skill). The PRD is silent, so an engineer could open a stacked PR that fails the fence late. The fence's content markers are text matches (README "Limits"), so a consent table that does not mention the marker words would slip past the check yet still deserve review.
Proposed change: add a "19.4 Fenced paths" table: each fenced path the build touches, the tier, the approvals needed (CCO approval at the head commit, plus Karma and an assigned-agent label if protected), and the ruling id. Default: the Moments tab and library module touch no fenced path; R119's ordering test lives in a file outside the gate folder and reads the gate's output; the phase 2 consent row uses its own table and is reviewed by CCO by name even if the marker does not fire (propose adding a marker to `FENCE.json` through its own fenced PR). Do not change `FENCE.json` in the Moments PRs.
Evidence: `compliance/FENCE.json` and `compliance/README.md` read 21 Nov.

### EX-CCO-10  MAJOR  Age-assurance rows overstate and the dated duties have no owner
Requirements: NS-53-R119, R165, R175, H-5, 8.3.
Finding: R119 says the Declared Age Range value is "never read by the tab" and R165 says "no age or face signal is read". Both are fine as statements about the Moments tab, but as written they can be read as a product-wide rule and would collide with the age-assurance work the packet carries (Q46) and with California AB 1043 from 1 Jan 2027 (UNVERIFIED at primary level; the skill says a developer must request an age signal at download and launch, so the app will need to read it). That date is 41 days away. R175 says "state developer-duty dates re-checked by regulatory-affairs" but gives no list, no owner dates and no evidence. Texas SB 2420 status is UNVERIFIED this session.
Proposed change: reword R119 and R165 to "the Moments tab and library module do not read, store or use an age signal; age assurance is owned by the gate code and the register". In R175 list each dated duty with an owner and a re-read date: Texas, Utah and Louisiana per Apple's notes, California AB 1043 (1 Jan 2027), and the AB 1856 bill whose status the skill could not read. Evidence for each is a dated source read, not a summary.
Evidence: PRD R119, R165, R175; CCO skill section 9 (carried); register CR-004, CR-005.

### EX-CCO-11  MINOR  The analytics section contradicts R87 on the `moment` source
Requirements: NS-53-R87, R167, section 18, RV-16.
Finding: R87 says `capture_started` with source `moment` "sends nothing that says so". Section 18 lists `capture.letter.started` with `source` "now including `moment`", and says MT-P4-R4 decides whether it is sent at all. A tap on a library-day card that emits `source: moment` implies library access was granted, which the PRD's own rule (no library signal, no permission result in analytics) forbids. Analytics is off at 1.0 (D-095), so no data moves today.
Proposed change: for a library or place card the source value is the existing generic one (or none); only phone-held cards may emit `moment`. Add a test that no analytics property differs between a library card start and a prompt start. Resolve the "decides if sent at all" wording.
Evidence: PRD R87, section 18, R167.

### EX-CCO-12  MINOR  Evidence for "no tracking, no third-party SDK that touches the library" is not named
Requirements: NS-53-R88, R175, H-6.
Finding: R175 says no ATT need because nothing is shared across apps. Apple 5.1.2(i) (verified) requires ATT permission to track. The PRD's evidence for "nothing is shared" is the lockfile check in R88 for media packages and a canary test (R162). It does not say there is an inventory of every SDK and a privacy manifest entry with no tracking domains. A future analytics vendor (the register lists PostHog) would be a third party.
Proposed change: add to the G11 evidence: an SDK inventory from the lockfile, the privacy manifest, and a statement that no SDK receives a library identifier, date, coordinate or place. Update at each build.
Evidence: Apple guidelines 5.1.2(i) read 21 Nov; PRD R88, R162, R175.

### EX-CCO-13  MINOR  The optional Apple geocoder changes the label and the policy, and should be named so
Requirements: NS-53-R62, R117, 7a.1, G8, F3.
Finding: P-B sends a picture's precise coordinates to Apple's geocoding service. Apple's label definition (verified) says derived data sent off the device is considered separately, so a precise-location answer is likely needed in that build; whether Apple counts as a recipient that "can access it" is a question, and what Apple logs is UNVERIFIED. The PRD already gates P-B and keeps it off, which is right.
Proposed change: in R62 and G8, add that enabling F3 requires a new label answer for Precise Location (linked or not, tracked or not, counsel to answer), a policy change in the same build, and a refreshed Notes for Review. Add a build test that fails if F3 is on without the G8 read-out (the PRD has this; keep it).
Evidence: Apple App Privacy page read 21 Nov; PRD 7a.1, R62.

### EX-CCO-14  MINOR  Section 27 should record my read, and carried facts should keep their labels
Requirements: section 27, section 25.7, H-2 to H-6.
Finding: Section 27 correctly says the author did not re-read Apple, the law or the repo facts. This review re-read Apple 5.1.1, 5.1.2, 4.5.4, 1.3, 5.1.4, the App Privacy definitions and the FTC CAN-SPAM guide on 21 Nov, and the PRD's reading matches except for 5.1.2(vi) and the missing 5.1.2(v) (EX-CCO-6). The remaining legal facts (COPPA FAQ points, Texas, AB 1043, CCPA thresholds, BIPA, RCW 19.373, CLGeocoder, the licence agreement) are still the leads' findings or UNVERIFIED.
Proposed change: after the review round add this table's VERIFIED rows to section 27 with the date. Keep every other legal fact marked UNVERIFIED until the CCO or `regulatory-affairs` reads it; do not build a founder recommendation on an UNVERIFIED rule.
Evidence: this file, first table.

## Answers to the section 25.7 questions

Are the compliance rows in 21 complete (storefront, age gate, state developer duties, notification rules)? No. Storefront, age gate and notification rules are present in R175, R119 and R136, but state duties lack owners and dates (EX-CCO-10), the store paperwork has no gate (EX-CCO-3), the register has no rows for the new data (EX-CCO-2), and the fenced paths are not named (EX-CCO-9).

Is evidence for each gate recorded where an auditor would look? The PRD names `docs/release/<x.y.z>.md` for read-outs, which is the right place, but gives no index of artefacts, no signer, and no evidence rule for the register (EX-CCO-3).

## Suggested next steps (owners)

1. `legal`: counsel packet section for Moments and a register update (EX-CCO-1, 2). CCO reviews.
2. `product`: edits to the PRD for EX-CCO-3 to 11 after the review round.
3. Founder: send the packet (F6 in the founder queue), and decide the lifecycle email address question (EX-CCO-8). Each goes through Karma first.
4. CCO: re-read Washington RCW 19.373, the COPPA FAQ and the Texas and California age-assurance sources from a fetch that works, before any founder recommendation relies on them.

Chief Compliance Officer (Claude role, not counsel)
