# Function review: compliance (CMP)

Status: draft for Karma's ruling, 20 Nov 2026. Backlog row BL-995. Author: `legal` with the compliance lens (a Claude role drafting for counsel). Docs only.

> **Not legal advice.** Written by a Claude session. It is not a lawyer or a compliance professional, holds no licence, and no attorney-client relationship exists. Every reading of a law or an Apple rule is "engineering reading, counsel must confirm". Nothing here says that a build or a text is compliant. Counsel numbers are from `docs/legal/COUNSEL_PACKET.md` 1.5.0; new questions "need a number from legal".

Scope (from the task): the obligations register against every card; App Store review readiness (guidelines each card touches, App Review notes, the privacy label and the Accessibility Nutrition Labels); the evidence each release gate G0 to G6 needs; state and federal duties on the sign-up path; accessibility as a legal duty (LEGAL-REQ-051). Legal texts, consent records and counsel questions on Terms and Privacy are in `legal.md`; the two files share one source list (section 8 here, S1 to S8).

Tags: [F] read this session in a named file. [S] outside source read this session. UNVERIFIED: not read or not run this session.

## 1. What I reviewed, and what I did not

Everything in `legal.md` section 1, plus: `docs/store/app-store-connect-1.0.md` sections 1 to 8 (age rating answers, App Privacy, Accessibility Nutrition Labels draft, App Review information); `docs/store/notes-for-review-1.0.txt` (marked "SUPERSEDED FOR BUILD 12"); `docs/legal/compliance-register.md` 1.6.0 row index (CR-001 to CR-131); `docs/legal/app-store-privacy-labels.md` 2.2.0 sections 3.4, 5, 6; `.claude/skills/regulatory-compliance/SKILL.md` section 2 (the account-creation checks) and `references/checked-facts.md`; area E design (`E-foundations-and-system-states/DESIGN.md` on `origin/docs/e2e-ux-20nov` at `76c1e9971`) for the first-run path E-S01 to E-S29 and its gap K-E10.

Not read: `docs/product/prd/inputs/first-run-compliance.md` (does not exist yet; section 3d is written to be merged with it, and `regulatory-affairs` owns the merge); `docs/product/prd/19-from-download-to-first-letter.md` (NS-38 to NS-45, not written yet); `docs/store/compliance/*` (marked stale by `app-store-connect-1.0.md` section 0); the statutes themselves (AB 1043, Texas SB 2420, COPPA, CalOPPA, ARL): only the secondary sources in section 8 were read, so every state-law date below is secondary or UNVERIFIED. No build, binary or proxy capture was inspected.

## 2. Coverage verdict per card (compliance)

| Card | Verdict | Why (and the FR that closes it) |
|---|---|---|
| NS-01 | Partly | Label effect right (on-device data is not "collected" [S2]); the label file still says "No photo feature" and its checklist line "No photo picker" will fail the first photo build (FR-CMP-04); Notes for Review line missing (FR-CMP-03). |
| NS-02 | Covered | 2.5.19 named; label none; one Notes for Review line (FR-CMP-03). |
| NS-03 | Covered | No build; data outside the product, with retention; endorsement rule (no reward) named. |
| NS-04 | Covered | Spike; 2.5.19 and the Siri rules (UNVERIFIED) re-read on the spike day. |
| NS-05 | Partly | 2.5.19 named; age-rating answer "User-Generated Content: No (letters are never distributed)" is not re-checked for sharing (FR-CMP-19). |
| NS-06 A | Covered | Label none; Notes line (FR-CMP-03). |
| NS-06 B | Partly | The sealing UTC offset and the label (Q54, Q20) are named; App Review note for "hidden until" missing (FR-CMP-03). |
| NS-06 C | Partly | 2.5.19 named; Siri, App Intents, widget and Control Center rules UNVERIFIED; must be read and cited the day NS-04b is written (FR-CMP-02). |
| NS-07 C5, G11 | Covered | G11 is itself the label guard. |
| NS-07 C28 | Covered | Label none; print sale parked (CR-054; NS-30). |
| NS-08 | Partly | Six flip conditions plus a seventh; the consent record cannot be stored by the schema (`legal.md` FR-LEG-09); label and Notes for Review change at the flip (FR-CMP-03, FR-CMP-05). |
| NS-09, NS-11, NS-14, NS-15, NS-19 to NS-24 | Covered | No store, label or accessibility duty beyond NS-33's rows. |
| NS-10 | Partly | 5.1.1(v) named for decline; the store build's sign-in requirement and the deletion control's visibility are not gated anywhere (FR-CMP-17, FR-CMP-18). |
| NS-12 | Covered | Label none. |
| NS-13, NS-18, NS-32 | Covered | 4.5.4 named with its limit; plan notices outside the budget (Q41); in-app plan dates without notifications (D-S24, E-S25). |
| NS-16 | Partly | Q48, Q45, Q46 named; no `child-input` tag (FR-CMP-14); 5.1.2(i) on another person's data not read against it (question C-6). |
| NS-17 | Partly | Listing names only shipped languages (R4); 2.3.1(a) on misleading marketing applies [S1]; the cited "guideline 2.3" is UNVERIFIED in the card (FR-CMP-02). |
| NS-25 | Partly | NS-25-R1 and R12 cover dormant surfaces (2.1(a), 2.5.19); the age-rating re-answer is named; missing: demo account with an Asha two-parent book in the Notes (FR-CMP-03), the invitee path through the age gate (FR-CMP-13), and the 1.2 user-generated content reading (question C-5). |
| NS-26 to NS-31 | Covered (parked) | Each decision record names its label or store effect. |
| NS-33 | Partly | Screens listed are the daily ones; Apple's common tasks also include first launch, login, purchase and settings [S4], and LEGAL-REQ-051 names sign-in, consent sheets, paywall and deletion (FR-CMP-06, FR-CMP-07). T4's undo rule is not mapped to WCAG 2.2.1's three options [S6] (FR-CMP-08). |
| NS-34 | Covered | iPad smoke row matches App Review running the iPhone app on iPad. |
| NS-35 | Covered | Doorways reserved, not dormant (2.5.19). |
| NS-36 | Partly | Retention and deletion clock named; the privacy-label row per new field is left to Q54 without a per-field check (G11 covers it once built). |
| NS-37 | Covered | Copies excluded from the iPhone backup; no store effect. |
| NS-38 to NS-45 | Not on disk | The sign-up path duties they must carry are in section 3d. |

## 3. Function requirements (compliance)

Owner lanes: `legal` (register, packet), `compliance-engineer` (guards, gate record), `regulatory-affairs` (sign-up checks, watch), `qa` (device and accessibility walks), `content` (Notes for Review words), `mobile`, the founder (App Store Connect, D-125).

| Id | Requirement (Given, When, Then where testable) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-CMP-01 | Given the locked pack, Then `compliance-register.md` gains a section "Obligations by card" with the rows of section 3a, and these stale rows are corrected in the same version: CR-113 (says "Photos of babies are stored (`entry-photos` bucket)"; pictures now stay on the phone and the bucket refuses writes, NS-01-R61); CR-083 (the system picker needs no photo permission); CR-086 (1.2 user-generated content, now with NS-05 and NS-25); CR-123 (fonts embedded in a parent's PDF, OFL FAQ 1.12 [S5]); CR-061 (4.5.4 and local notifications); CR-005 (AB 1043 and Texas SB 2420 status, section 3d). | every card; section 3a | P0 (b) | legal | `compliance-register.md` CR-113, CR-083 [F]; NS-01-R61 [F] |
| FR-CMP-02 | Given a card's flag is proposed for production, Then its section 17 cites every Apple guideline of section 3b by number with the date read, and the CCO re-reads each from Apple's page within 30 days before submission, recorded in `references/checked-facts.md` with URL and date. A card citing a guideline that does not say what the card says (NS-17 cites "2.3" for listing claims; the rule is 2.3.1(a) [S1]) is corrected first. | section 3b; NS-06 C17, NS-17 section 17 | P1 | regulatory-affairs, legal | S1 read 20 Nov |
| FR-CMP-03 | Given a store candidate, When the Notes for Review are prepared, Then a check compares the flags on in the `production` profile (including the local flag family, errata E20) with the Notes' sections: every flag on has a section that says what it does and where to find it, no section describes a feature that is off, and a demo sign-in (founder-supplied, never in the repo) holds the Asha book, a second Asha book once NS-14 ships, and a two-parent book once NS-25 ships. The Build 12 notes replace `notes-for-review-1.0.txt`, which says "SUPERSEDED FOR BUILD 12". | NS-01, 02, 05, 06, 07 C28, 08, 16, 17, 25; NS-35; E-S04 to E-S07 | P0 (b) | content, compliance-engineer, founder | 2.1(a) "include demo account info (and turn on your back-end service!)"; 2.3.1(a) "All new features ... must be described with specificity in the Notes for Review"; 2.5.19 [S1]; notes file header [F] |
| FR-CMP-04 | Given `EXPO_PUBLIC_PHOTOS` on in any build, Then `app-store-privacy-labels.md` is versioned with: Photos or Videos "No" with the reason "a picture stays on the phone; data processed only on device is not collected" [S2], not "No photo feature"; the permission row keeps "Photos: not used" only while the system picker is the only path (no photo-library permission string); and the section 6 checklist line "No photo picker" becomes "Picker present; NS-01-R15, R26, R61 green on the candidate". | NS-01 sections 17, 18; NS-01-R15, R26, R61; G5 | P0 (b) | legal, privacy | label file 2.2.0 line 54 and 127 [F]; S2 |
| FR-CMP-05 | Given a store candidate, When G5 runs, Then the App Store Connect answers equal the label file's row for that build (section 3.4), the privacy manifest's data types equal that row, and a proxy capture of the release candidate shows no host or payload the row does not declare; the three files are saved in the gate record (FR-CMP-11). The label changes in the same build as the behaviour (frame section 7), and the answers can be updated without a new binary [S2]. | NS-07 G11; NS-08 flip; NS-05 Levels 2 and 3; NS-26, NS-28; LEGAL-REQ-041 to -043 | P0 (b) | compliance-engineer, privacy | S2 "You're responsible for keeping your responses accurate and up to date"; `app-store-connect-1.0.md` section 4 [F] |
| FR-CMP-06 | Given the Accessibility Nutrition Labels in App Store Connect, Then a feature (VoiceOver, Voice Control, Larger Text, Dark Interface, Differentiate Without Color Alone, Sufficient Contrast, Reduced Motion) is declared only when every common task passes with it on the candidate: first launch (E-S01 to E-S03, E-S08), sign-in (E-S04 to E-S07), purchase (E-S10, E-S11), settings (C-S01 and its rows), and the primary tasks (speak, type, Review, Keep, read a letter, Read together), plus the main flow of each card whose flag is on (for example A-S03 for NS-01, D-S01 to D-S03 for NS-05). The walk is saved per build; a later build that fails a task withdraws the declaration before release. Until a walk passes, nothing is declared (NS-33 OQ default). | NS-33 section 19, OQ; E-S23; `app-store-connect-1.0.md` section 5 | P0 (b) | qa, founder | S4: "users must be able to complete all of the common tasks of your app using that feature"; common tasks include "first launch experience, login, purchase, and settings" |
| FR-CMP-07 | Given LEGAL-REQ-051 (WCAG 2.2 AA), When the accessibility walk runs for a store candidate, Then it includes the consent and legal surfaces at AX5 with Bold Text and with VoiceOver: E-S03 age gate, E-S07 agreements, E-S10 Keep gate, E-S11 Plan, C-S20 Delete account, D-S13 and D-S16 (when NS-25 is on), D-S02 share preview (when NS-05 is on), B-S13 hide until a day (when NS-06 B is on): no truncation, every control reachable, links announced as links. Web surfaces (D-S14 invite link page, `/privacy`, `/delete-account`, `/legal/*`) pass an automated axe run with zero critical findings and the 1.4.10 reflow check. | NS-33 R4, R7; area E K-E08; LEGAL-REQ-051; CR-070 | P0 (b) | qa, design-systems | LEGAL-REQ-051 names "sign-in, consent sheets, paywall, deletion" [F]; WCAG 2.2 Recommendation 12 Dec 2024, 1.4.10 AA [S6] |
| FR-CMP-08 | Given ruling T4 (undo stays open its stated seconds, or until VoiceOver has read the line plus that many seconds; with Switch Control, until the parent moves on), Then before NS-01, NS-06 A or NS-21 ship, either a qualified accessibility reviewer records that T4 meets WCAG 2.2.1 (turn off, adjust to ten times, or warn with at least 20 seconds to extend), or each timed undo also has an untimed path to the same result (a deleted letter already has Recently deleted; a removed picture or first can be added back from the letter page). | frame section 5; T4; NS-01-R38a, R38b; NS-06 A; NS-21; B-S11, B-S12, B-S15 | P1 | design-systems, qa | WCAG 2.2.1 Level A text [S6]; whether a toast's undo is a "time limit set by the content" is a reading for an accessibility reviewer |
| FR-CMP-09 | Given sign-in by email code (E-S05, E-S06), Then the code field accepts paste and one-time-code autofill, and nothing asks the parent to remember or transcribe anything else. | E-S05, E-S06; NS-38 to NS-45 | P1 | mobile | WCAG 2.2 3.3.8 Accessible Authentication (Minimum), AA [S6] |
| FR-CMP-10 | Given any public accessibility claim or declared label, Then an accessibility statement (LEGAL-REQ-052: target, known gaps, contact route) is live and Me, Help links to it. | NS-33 section 19; BL-404; LEGAL-REQ-052 | P1 | content, legal | LEGAL-REQ-052 [F] |
| FR-CMP-11 | Given a store candidate, Then one gate record `docs/legal/evidence/store/<version>-<build>/gates.md` exists with the evidence of section 3c for G0 to G6, each line naming the file, commit or console screenshot that proves it, and the founder's dated sign-off; a candidate with a missing line is not submitted. | `14-test-plan.md` section 6; LEGAL-REQ-042 path | P0 (b) | compliance-engineer, qa, founder | 14-test-plan section 6 defines the gates but not their evidence [F] |
| FR-CMP-12 | Given a card names a counsel read as gating its production flag (NS-01 label line Q43; NS-05 picture Q45; NS-06 B minors question; NS-16 Q48 and Q45; NS-25 Q48, Q49, Q53; NS-08 flip), When G2 is checked, Then the gate record cites counsel's written answer (date, form, question number). A default is never a substitute for a read that gates a flag: the flag stays off. For reads that do not gate a flag, an applied default is recorded with the founder's dated acceptance. | G2; README "Reads that gate anything"; each card section 22 | P0 (b) | legal, founder | COUNSEL_PACKET 1.5.0 defaults [F]; CLO skill section 4 "fail-closed holds" [F] |
| FR-CMP-13 | Given any path that creates an account, including an invite opened on a phone with no install (D-S14, D-S15), When the person reaches sign-in or accept, Then the age gate (E-S03) has been answered Yes on this install first; the invite peek before sign-in shows only the inviter's sign-off and role (NS-25-R2); no account exists for a person who answered No. | NS-25-R2, R6; E-S03, D-S14, D-S15, D-S16; LEGAL-REQ-002; skill section 2 checks 1 and 3 | P0 (b) | mobile, regulatory-affairs | regulatory-compliance skill: "A new sign-up path (... an invite flow) is not done until it passes all six" [F] |
| FR-CMP-14 | Given NS-16 (someone else speaks, which could be a sibling), Then its flag is tagged `child-input` in the flag registry, so production stays off until counsel's written answer on Q45 is linked in the flag description. | NS-16 section 17; LEGAL-REQ-059; BL-119 | P0 (b) | mobile, compliance-engineer | LEGAL-REQ-059 [F] |
| FR-CMP-15 | Given any install on iOS 26 or later from 1 Jan 2027, When the app launches, Then it requests the platform age-range signal, treats a minor signal as the gate's No (stop, nothing reachable, nothing stored beyond the existing `ageGate.stoppedAt`), stores no age range anywhere, and treats no signal (iOS 17 to 25, or declined) as today's gate. Installs from before 1 Jan 2027 follow counsel's answer to Q46. | skill section 2 check 2; CR-004, CR-005; E-S01, E-S03; NS-38 to NS-45 | P0 (b) by 1 Jan 2027 | mobile, regulatory-affairs | AB 1043 effective 1 Jan 2027; developer requests the signal when the app is downloaded and launched; a received signal is actual knowledge (secondary [S7]); API floor iOS 26 per the skill, UNVERIFIED this session |
| FR-CMP-16 | Given the store build syncs letters after the sensitive-data consent, Then a withdrawal control exists in Me, Privacy in that build, because Privacy 9 says the control "is built before anyone outside the family signs in"; withdrawing stops sync and offers deletion. | E-S07, C-S01; D-128; Privacy 9; Q48 | P0 (a) | mobile, privacy | `privacy-policy.md` section 9 [F]; whether Build 12 has the control is UNVERIFIED |
| FR-CMP-17 | Given a store build that lets a person create an account, Then Delete account is visible in Me (the D-129 alpha hide does not apply) and works without accepting new terms or consents (NS-10 decline line). | C-S20; NS-10 section 12; D-129; LEGAL-REQ-029 | P0 (b) | mobile | 5.1.1(v) "If your app supports account creation, you must also offer account deletion within the app" [S1]; S3 |
| FR-CMP-18 | Given the store build requires sign-in (D-160), Then the Notes for Review state the account-based features that need it (sync to a second phone, a book that survives a new phone, deletion), and the founder records the decision against 5.1.1(v)'s first sentence, with counsel's view (question C-4). | D-160; NS-10; E-S02; FR-CMP-03 | P0 (b) | founder, content | 5.1.1(v): "If your app doesn't include significant account-based features, let people use it without a login" [S1] |
| FR-CMP-19 | Given NS-05 or NS-25 is on in a candidate, Then the App Store Connect age-rating questionnaire is answered again (User-Generated Content, Messaging, Social Media) and the answers saved in the gate record; the 18+ override and "Made for Kids: No" stay. | NS-05; NS-25 section 17 (F21-REQ-NEW-E); `app-store-connect-1.0.md` section 2 | P0 (b) | founder, legal | ASC answers say UGC "No (letters are never distributed)" [F] |
| FR-CMP-20 | Given a store candidate, Then every public line in `packages/content/src/store.en.ts`, the site and the screenshots that a card "Enables" has a claims-inventory row naming the build and the P0 rows it rests on, and each row's P0 rows are green on that candidate (for example "Pictures stay on this phone": NS-01-R15, R26, R61); each "Forbids" list is a scan pattern. Accessibility declarations (FR-CMP-06) are claims too. | every card section 19; G5; frame section 7; LEGAL-REQ-044 | P0 (b) | marketing (keeps), legal (checks) | frame section 7 [F]; 2.3.1(a) on misleading marketing [S1] |
| FR-CMP-21 | Given a store candidate, Then the state age-assurance trackers (Texas SB 2420, California AB 1043, Utah, Louisiana, Alabama, Colorado) were read within 30 days, with the date in `references/checked-facts.md`, and any change is a register update before submission. | CR-004, CR-005; skill section 5 | P1 | regulatory-affairs | Texas tracker "checked through October 13, 2026" [S8] |

### 3a. Obligations register against every card

Engineering reading; counsel must confirm each. "Rule" cites the register row (CR) or the Apple guideline; "Control" is what the card already does; "Gap" names the FR.

| Card | Rule touched | Control in the card | Gap |
|---|---|---|---|
| NS-01 | Apple 5.1.1(iii) picker; 5.1.1(v) deletion text; 2.5.19; 2.3.8 screenshots; CR-022 and LEGAL-REQ-013 (location in photos); CR-001 and Q45 (a child's image); CR-113 | System picker, no permission; GPS stripped at write (R6); bucket closed (R61); R31 deletion text; flag off draws nothing (R19) | FR-CMP-04, FR-CMP-03; CR-113 stale (FR-CMP-01); `legal.md` FR-LEG-02 |
| NS-02 | LEGAL-REQ-014 (query never logged or in a URL); 2.5.19 | R15 canary; index local; flag off drops the index (R43) | Notes line (FR-CMP-03) |
| NS-03 | Q44 tester texts; Q45; Q51 retention; FTC endorsement rule (UNVERIFIED) | Consent W and V, 12-month records (D4), no reward | Consent document key (`legal.md` FR-LEG-11) |
| NS-04 | 2.5.19; Siri and App Intents rules (UNVERIFIED) | Spike only; read on the day | none now |
| NS-05 | 5.1.1(iii) share sheet; Q45, Q48; 1.2 (UNVERIFIED for private sharing) | Own letters only (R7), nothing recorded (R12), no audio (R5a), metadata 0 (R6b) | Age rating (FR-CMP-19); `legal.md` FR-LEG-05 |
| NS-06 A | CR-031 and Q32 (a label can be a health fact) | Parent-typed only; no machine detection | Notice at collection (`legal.md` FR-LEG-08) |
| NS-06 B | Q49, Q50, minors question; Q54 and Q20 (sealing UTC offset) | Author-only; honest limits; D6 | Notes line; `legal.md` FR-LEG-06, -07 |
| NS-06 C | 2.5.19; Siri, widget, Control Center rules UNVERIFIED | Each doorway documented in its build's Notes | FR-CMP-02 at NS-04b |
| NS-07 C28 | CR-123 (OFL); CR-054 (print sales, parked); Q11, Q47 | No order, partner or price | `legal.md` FR-LEG-12 |
| NS-07 G11 | CR-088; LEGAL-REQ-041 to -043 | The guard | evidence in FR-CMP-05 |
| NS-08 | 5.1.1(i); CR-017 (breach, encrypted safe harbour, Q42(b)); CR-111; LEGAL-REQ-023, -061; Q42, Q54, Q55 | No flip; seven conditions | Consent record (`legal.md` FR-LEG-09); FR-CMP-05 at flip |
| NS-09 | LEGAL-REQ-031, -032 deletion | D7; launch sweep | none |
| NS-10 | 5.1.1(v); Q19, Q44 | Decline keeps Delete account (R4a) | FR-CMP-17, FR-CMP-18 |
| NS-11 | none new (export by the parent's own act) | No destination recorded | none |
| NS-12 | LEGAL-REQ-033 retention; Q51 | D8 | `legal.md` FR-LEG-17 |
| NS-13, NS-18, NS-32 | 4.5.4 (names push; local UNVERIFIED); 5.1.2(i) (no system function required); CR-050 and Q41 (plan notices); LEGAL-REQ-054 | Names off by default; plan notices outside the budget; plan dates in the app | none |
| NS-14, NS-15, NS-19, NS-20 to NS-24 | none new | n/a | none |
| NS-16 | Q48 (another adult); Q45 (a child speaking); Q46; 5.1.2(i) another person's data; CR-041 (recording consent, mainly on the user) | Instruction line (D9); no attestation | FR-CMP-14; question C-6 |
| NS-17 | 2.3.1(a); Q9, Q12 (model terms) | Listing names shipped languages only (R4) | FR-CMP-02; `legal.md` FR-LEG-13 |
| NS-25 | 2.1(a) demo account; 2.5.19; 1.2 (UNVERIFIED); Q48, Q49, Q50, Q53; CR-112 (custody, legal process); LEGAL-REQ-056 | R1, R12 no dormant surface; peek shows no child (R2, R6); consent record (R17) | FR-CMP-03, -13, -19; `legal.md` FR-LEG-03, -10 |
| NS-26 to NS-31 | 4.5.4 (NS-26); 1.2 and X2 (NS-28); 3.1.1 and physical goods (NS-30, UNVERIFIED); NX-39 brief (NS-31) | Parked | none until reopened |
| NS-33 | LEGAL-REQ-051; CR-070 (ADA Title III, Unruh; UNVERIFIED); Apple accessibility labels [S4] | Daily screens at AX5 and VoiceOver | FR-CMP-06, -07, -08, -10 |
| NS-34 | 2.1(a) tested on device; iPad | Run sheet on SE 3; iPad smoke | none |
| NS-35 | 2.5.19 | Doorways reserved | none |
| NS-36 | 5.1.1(i) retention and deletion; LEGAL-REQ-012, -031 | Eight rules per new field | `legal.md` FR-LEG-08 |
| NS-37 | none new | Copies excluded from backup | none |
| NS-38 to NS-45 | Section 3d | not written | section 3d |

### 3b. App Store review readiness per card

Guideline texts read 20 Nov 2026 [S1]. "Notes line" is what the Notes for Review must say in the build that turns the card on (FR-CMP-03); `content` words it. Label effects are the cards'. Accessibility label effect: whether the card adds a task to the FR-CMP-06 walk.

| Card | Guidelines touched | Notes line (intent) | Privacy label | Accessibility label |
|---|---|---|---|---|
| NS-01 | 5.1.1(iii), 5.1.1(v), 2.5.19, 2.3.8 | "Start from a photo uses the system photo picker. The picture stays on the device; nothing is uploaded." | None (on-device [S2]); file note fixed (FR-CMP-04) | Adds the picker flow (A-S03, B-S11) |
| NS-02 | 2.5.19 | "Find searches the letters on the device; it works offline." | None | Adds Find (B-S06) |
| NS-03 | none (no build) | none | None | none |
| NS-04 | 2.5.19 (NS-04b) | none for the spike | None | none |
| NS-05 | 5.1.1(iii), 2.5.19; age rating | "Share sends one letter as text through the iOS share sheet; nothing goes to our servers." | None at Level 1 | Adds D-S01 to D-S03 |
| NS-06 A | 2.5.19 | "A letter can be marked as a first, with optional words." | None | Adds B-S12 |
| NS-06 B | 2.5.19 | "A letter can be hidden from other readers until a day the author picks; the author still reads it." Demo: a hidden letter in the Asha book | None (Q54 on the offset) | Adds B-S13, B-S14 |
| NS-06 C | 2.5.19; Siri and widget rules UNVERIFIED | One line per doorway that ships | Per NS-04 findings | Adds each doorway |
| NS-07 C28 | 2.5.19 | "Me, Save a copy, can make a printable PDF of a book on the device." | None | Adds C-S05 |
| NS-08 (flip) | 5.1.1(i), 2.1(a) | Backup, the recovery key and the restore hold, with how to test | Audio Data and Device ID (Q54) | Adds C-S21 |
| NS-10 | 5.1.1(v) | Sign in on a second phone restores the words, not recordings while backup is off | None | Login is already a common task |
| NS-13, NS-18, NS-32 | 4.5.4 (reading UNVERIFIED for local), 5.1.2(i) | "Reminders are local notifications, off until the parent turns them on." | None | Adds D-S04, D-S06 |
| NS-16 | 5.1.2(i) (another person's data) | "A parent can sign one letter with the name of someone else who spoke." | Q54(f) proposed | Adds A-S09 |
| NS-17 | 2.3.1(a) | Lists the shipped languages only | None | none |
| NS-25 | 2.1(a), 2.5.19, 1.2 (UNVERIFIED); age rating | Invite, join, 72-hour undo; demo account with a two-parent Asha book | Q54 (no new type expected) | Adds D-S13 to D-S19 |
| NS-33 | Accessibility labels [S4] | none | None | Defines the walk |
| NS-34 | 2.1(a) | none | None | none |
| Others (NS-09, 11, 12, 14, 15, 19 to 24, 35 to 37) | none new | Only if the flag changes a visible flow | None | NS-14 (A-S02), NS-24 (B-S19) join the walk when on |

### 3c. Evidence per release gate (G0 to G6)

Gates as defined in `14-test-plan.md` section 6. All evidence goes in the gate record of FR-CMP-11; device evidence stays on the Asha-only install (D13) and the `no-real-family-data` test runs on the PR that adds it.

| Gate | What must be true | Evidence that proves it | Who signs |
|---|---|---|---|
| G0 | `scripts/trace.mjs` sees NS ids; every P0 row of every card whose flag is on has a test and a backlog row | The trace output for the candidate commit, listing each P0 id, its test title and BL row; zero unmatched. Until #819 lands: the hand check named in 14 section 7, saved as a table | qa |
| G1 | ADR 0028 and the export schema the cards need are merged | Merge commit of ADR 0028 (#797; errata E22 cites `e9dca86c`), the export schema version in `export/schema.ts` at the candidate commit, BL-868 merged | data-architect |
| G2 | Every counsel read the flagged cards name is on record | Per card: question numbers, counsel's written answer reference (date, form), or for a non-gating read the applied default with the founder's dated acceptance (FR-CMP-12). Flags whose gating read is missing are listed as off | legal, founder |
| G3 | The founder approved the words | List of `packages/content` keys new or changed since the last store build, the commit, and the founder's merge (D-125) or written approval | content, founder |
| G4 | Every P0 device row passed on the candidate | `docs/qa/evidence/<date>-<build>-<phone>.md` per phone, P0 rows first; any waiver in writing by the founder, never for a lost letter or recording, a leak, a name or words on a lock screen, or a guilt or count line (14 section 6); the accessibility walk of FR-CMP-06 and FR-CMP-07 | qa, founder |
| G5 | The privacy label and the claims match what the build sends | App Store Connect App Privacy screenshot; label file row for the build; privacy manifest; proxy capture summary (hosts and payload classes, no content); claims inventory diff with build and P0 links (FR-CMP-20); the Terms and Privacy versions the build links and proof they are live at those URLs; Accessibility Nutrition Labels declared versus the walk; age-rating answers (FR-CMP-19); territory = United States (LEGAL-REQ-058); export-compliance answer (Q55); Notes for Review versus flags (FR-CMP-03) | compliance-engineer, legal, founder |
| G6 | No `production` flag is on while its card has an open P0 | The list of flags on in the `production` profile and remote config, each with its card and the count of open P0 rows (must be 0); kill switches can hide, never turn on, never stop export (errata E21) | compliance-engineer |

### 3d. State and federal duties on the sign-up path

To be merged with `inputs/first-run-compliance.md` (owner `regulatory-affairs`) when it lands, and carried into NS-38 to NS-45. Engineering reading; counsel must confirm each. Screen ids are area E's.

| Step | Duty | Source (kind) | Control today | Gap |
|---|---|---|---|---|
| Download (E-S27) | US storefront only; no other country's targeting | LEGAL-REQ-058; CR-100 to CR-102 (register) | ASC availability United States only [F] | Screenshot in G5 |
| First launch (E-S01, E-S03) | Adults only, neutral question, nothing preselected | Terms 2.1; LEGAL-REQ-002; D-006, D-026 | Built age gate; stores only `ageGate.passed` and `stoppedAt` [F] | Every path through it (FR-CMP-13) |
| First launch, from 1 Jan 2027 | Request the platform age signal; a received signal is actual knowledge | California AB 1043 (secondary [S7]); Texas SB 2420 operative while the Fifth Circuit stay holds, developers have "related duties" (secondary [S8]); Utah, Louisiana, Alabama, Colorado later (register CR-005, UNVERIFIED) | Not built (skill section 2 check 2) | FR-CMP-15; Q46; the rule for installs made before 1 Jan 2027 is unverified (a search-result title mentions a later deadline for existing accounts; not read) |
| Actual knowledge of a minor | Close the account; minors' laws turn on at actual knowledge | COPPA (CR-001); state minors' laws (CR-006) | Runbook `underage-account.md`; Terms 2.1 | Support-initiated deletion (BL-551) |
| Before any collection | A privacy policy linked in the app, easy to find, and in App Store Connect | Apple 5.1.1(i) [S1]; CalOPPA 22575 (CLO skill, secondary) | E-S03 links Terms and Privacy [F] | The policy URL is BLOCKED until the app policy is live (`app-store-connect-1.0.md` section 4) [F]; `legal.md` FR-LEG-04 |
| Agreement (E-S03, E-S07) | Conspicuous notice and an unambiguous act; versioned record | CR-019 (E-SIGN, UETA, UNVERIFIED); POLICY_VERSIONING 7 | Unticked box, versioned record [F] | Text hash on each act (`legal.md` FR-LEG-09) |
| Sensitive-data consent (E-S07) | Opt-in for sensitive data; withdrawal | CR-020 (Connecticut), CR-031 (Washington MHMDA), Q32, Q48 | Separate consent sheet as built | Withdrawal control in the store build (FR-CMP-16) |
| Sign-in (E-S05, E-S06, Apple) | Transactional email rules; a code may be sensitive personal information; Apple token revocation at deletion; 4.8 only if Google is offered | LEGAL-REQ-053; Q56; S3; CR-080 | Resend; Apple sign-in | FR-CMP-09 (3.3.8) |
| Sign-in required (Build 12) | Login only where there are significant account features | Apple 5.1.1(v) [S1]; D-160 | Required in Build 12 [F] | FR-CMP-18; `legal.md` FR-LEG-04 |
| Account creation | In-app deletion | Apple 5.1.1(v) [S1]; S3 | Built, hidden in alpha (D-129) | FR-CMP-17 |
| Account creation | Not in an embargoed place, not on a restricted-party list | Terms 2.4; D-131, D-137; Q57 | Attestation only; country check not built; Privacy 12 says so [F] | Keep Privacy 12's "in no build yet" true until the check ships |
| Invite opened on a new install (D-S14 to D-S16) | Same checks as any sign-up; no child data before acceptance | skill section 2; NS-25-R2, R6 | Peek shows sign-off and role | FR-CMP-13 |
| First Keep past the allowance (E-S10) | Clear renewal terms before purchase; affirmative consent; easy cancellation | CR-050 (California ARL), CR-051 (ROSCA); LEGAL-REQ-046, -048; Q41 | Apple's sheet plus our disclosure | Q41 open (notice windows) |

## 4. Design needs (compliance)

| Screen | Need | FR |
|---|---|---|
| E-S23 Accessibility walk and speed sheet | Add the common tasks Apple names (first launch, login, purchase, settings) and each flag-on card's main flow; one column per declarable feature; pass or fail per task | FR-CMP-06 |
| E-S03, E-S07, E-S10, E-S11, C-S20, D-S13, D-S16, D-S02, B-S13 | AX5 with Bold Text and VoiceOver layouts drawn and walked; links announced as links; no truncated agreement text | FR-CMP-07 |
| E-S05, E-S06 | Code field allows paste and one-time-code autofill; no disabled Continue without words (area E K-E11 already) | FR-CMP-09 |
| E-S01, E-S03 | A state for "platform says a minor": the gate's stop room, same words, nothing stored; drawn now, built for 1 Jan 2027 | FR-CMP-15 |
| E-S03.region (HOLD, K-E10) | Stays a HOLD; no in-app region check unless counsel asks (Q57) | 3d |
| D-S14 Invite link page (web) | Path through the age gate before accept on a new install; WCAG AA on the web page; privacy link | FR-CMP-13, FR-CMP-07 |
| C-S01 Me, Privacy and Help | Withdrawal control for the sensitive-data consent (FR-CMP-16); accessibility statement link (FR-CMP-10); Delete account visible in store builds (FR-CMP-17) | FR-CMP-10, -16, -17 |
| B-S11, B-S12 | If T4 is not confirmed against 2.2.1, an untimed way back (add the picture or the mark again) is visible on the letter page | FR-CMP-08 |
| E-S27 App Store page | Only declared accessibility features and claims with inventory rows | FR-CMP-06, FR-CMP-20 |

## 5. Card changes I propose (for Karma to rule)

| # | Card row | Change | Why |
|---|---|---|---|
| K-1 | NS-33 section 3 and R4, R7 | Add first launch, sign-in, the Keep gate, Plan and Delete account to the screens (mirrors area E K-E08), and a P0 (b) row: no Accessibility Nutrition Label is declared unless every common task passes with it | Apple's common tasks include first launch, login, purchase and settings [S4] |
| K-2 | Frame section 5 (T4) | Add: "T4 is confirmed against WCAG 2.2.1 by an accessibility reviewer, or each timed undo has an untimed path" | 2.2.1's options are turn off, adjust, or extend with a warning [S6] |
| K-3 | `14-test-plan.md` section 6 | Add the evidence column of section 3c and the gate record path; add to G5: Notes for Review versus flags, age-rating answers, accessibility labels | Gates are defined, their proof is not |
| K-4 | NS-01 section 17 | Add: the label file's Photos note and checklist line change in the photo PR (FR-CMP-04) | The current checklist line fails the first photo build |
| K-5 | NS-05 section 17 and NS-25 section 17 | Add the age-rating re-answer as a gate (FR-CMP-19) | ASC says "letters are never distributed" |
| K-6 | NS-25 section 22 | Add: demo sign-in with a two-parent Asha book in the Notes (FR-CMP-03); invitee passes the age gate (FR-CMP-13) | 2.1(a) [S1]; skill section 2 |
| K-7 | NS-16 section 17 | Tag the flag `child-input` (FR-CMP-14) | LEGAL-REQ-059 |
| K-8 | NS-17 section 17 | "guideline 2.3" becomes "guideline 2.3.1(a)", read 20 Nov 2026 | The rule on misleading marketing is 2.3.1(a) [S1] |
| K-9 | NS-10 section 22 | Add FR-CMP-17 and FR-CMP-18 as store gates | Sign-in is required in the store build (D-160) |
| K-10 | NS-38 to NS-45 (when written) | Carry section 3d as the sign-up path's legal and store rows, with FR-CMP-13, -15, -16, -17, -18 | BL-994 scope names risk checks and verification |

## 6. Engineering needs (backlog rows to add or change)

| Row | What | FR |
|---|---|---|
| New | Gate record generator: writes `docs/legal/evidence/store/<version>-<build>/gates.md` with G0 to G6 lines from the trace output, flags, label file row and claims diff; the founder signs | FR-CMP-11 |
| New | Notes for Review check: flags on in `production` versus Notes sections | FR-CMP-03 |
| New | Declared Age Range on iOS 26+: request at launch, minor signal stops like the gate, nothing stored; unit test with an injected signal | FR-CMP-15 |
| New | Sensitive-data withdrawal control in the store build, if not already there (D-128) | FR-CMP-16 |
| New | Code field: `textContentType` one-time code and paste on E-S06 (check what is built first) | FR-CMP-09 |
| BL-404 | Accessibility statement and its Help link (scope already names it) | FR-CMP-10 |
| BL-119 pattern | `child-input` tag on the NS-16 flag | FR-CMP-14 |
| #819 rework | Trace sees NS ids (G0) | FR-CMP-11 |
| New | Register update (FR-CMP-01) and label file update (FR-CMP-04): docs rows for `legal` and `privacy` | FR-CMP-01, -04 |

## 7. Founder and counsel questions

| # | Question | To | Recommended default | Number |
|---|---|---|---|---|
| C-1 | Declare any Accessibility Nutrition Label for the first store build? | founder | Declare none until the FR-CMP-06 walk passes on the candidate; then Dark Interface first (the store draft), VoiceOver and Reduced Motion only after the walk covers sign-in and purchase | founder decision |
| C-2 | Installs made before 1 Jan 2027: must the app ask the platform for an age signal for existing users, and by when? May a signal be kept with the Terms acceptance as evidence? | counsel | Request at every launch on iOS 26+ from 1 Jan 2027; keep nothing | Q46 |
| C-3 | Texas SB 2420: which developer duties apply to an 18+ app with an 18+ rating while the stay holds? | counsel | Honour the store's age category signal as in FR-CMP-15; rating 18+ | Q46 (with CR-004) |
| C-4 | Sign-in required in Build 12: is the account-based feature set (sync, second phone, co-parent later, deletion) enough under 5.1.1(v), or should local use without an account return? | founder, counsel | Keep sign-in required; state the account features in the Notes; if App Review objects, the servers-off first-run path (E-S02.serversOff) is the fallback | founder decision; counsel reads with Q44 |
| C-5 | Does guideline 1.2 (user-generated content: filtering, reporting, blocking) apply to a book shared by two parents, and to a letter sent through the parent's own share sheet? | counsel | Treat NS-25 as in scope for a report route (LEGAL-REQ-056, `legal.md` FR-LEG-10); NS-05 out of scope (we host nothing) | needs a number from legal (with CR-086) |
| C-6 | Under 5.1.2(i), is storing a non-user's name and words in a parent's synced letter (NS-16) on the parent's say-so acceptable, or does App Review expect the speaker's permission in the app? | counsel | Instruction line only (D9); describe the feature in the Notes | Q48 |
| C-7 | Does guideline 4.5.4 apply to local notifications, and are plan notices "sensitive personal information"? | counsel | Treat 4.5.4 as applying; no names or words by default; plan notices carry dates, not amounts (D-083) | Q41 |
| C-8 | Is WCAG 2.2 AA the right target to state publicly, and should the accessibility statement say "aim" rather than "meet" while gaps remain? | counsel | "We aim to meet WCAG 2.2 AA" plus known gaps | needs a number from legal (with CR-070) |

## 8. Sources read this session (20 Nov 2026; shared with `legal.md`)

| # | Source | Used for |
|---|---|---|
| S1 | Apple App Review Guidelines, https://developer.apple.com/app-store/review/guidelines/ (no last-updated date in the fetched text) | 1.2, 1.3, 2.1(a), 2.3.1(a), 2.3.8, 2.5.19, 4.5.4, 5.1.1(i), (ii), (iii), (v), (ix), 5.1.2(i), 5.1.4 (partial) |
| S2 | Apple, App privacy details, https://developer.apple.com/app-store/app-privacy-details/ | Definition of "collect"; on-device processing; Photos or Videos, Audio Data, Other User Content; keeping answers current |
| S3 | Apple, Offering account deletion in your app, https://developer.apple.com/support/offering-account-deletion-in-your-app/ | What deletion covers; retained data; Sign in with Apple token revocation |
| S4 | Apple, Overview of Accessibility Nutrition Labels, https://developer.apple.com/help/app-store-connect/manage-app-accessibility/overview-of-accessibility-nutrition-labels | Voluntary now, required later (no date given); common tasks; the nine declarable features |
| S5 | SIL OFL FAQ, https://openfontlicense.org/ofl-faq/ | Embedding in documents (see `legal.md`) |
| S6 | W3C, WCAG 2.2, https://www.w3.org/TR/WCAG22/ (W3C Recommendation, 12 Dec 2024) | 2.2.1 (A), 1.4.10 (AA), 2.5.8 (AA), 3.2.6 (A), 3.3.7 (A), 3.3.8 (AA) |
| S7 | Kelley Drye, FAQ on the Digital Age Assurance Act, https://www.kelleydrye.com/viewpoints/blogs/ad-law-access/faq-digital-age-assurance-act-california-youth-safety-on-the-internet (secondary) | AB 1043 effective 1 Jan 2027; request at download and launch; actual knowledge; Attorney General enforcement, up to $2,500 or $7,500 per affected child |
| S8 | Texas Data Law tracker, SB 2420, https://texasdatalaw.com/tracker/sb-2420/ (secondary; "Law checked through October 13, 2026") | Operative while the Fifth Circuit stay holds; no merits opinion after the 4 Aug 2026 argument |

Everything else (CalOPPA, COPPA, ARL, ROSCA, ADA, Unruh, MHMDA, Connecticut, E-SIGN) is cited from the repo's register and the CLO skill and is UNVERIFIED this session.

Chief Legal Officer (Claude role, not a lawyer), for the compliance lens
