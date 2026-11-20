---
title: Counsel packet addendum, Memory Library (photos, videos, dates, places, occasions)
version: 0.1.0
status: draft-for-counsel (NOT merged; merging needs the founder, D-125 and D-132)
date: 2026-11-10
owner: founder
prepared_by: AI (Claude), legal drafting support (`legal` agent), task BL-841; not legal advice
numbering: Q78 to Q106 (see section 3 for how the numbers were chosen and how to re-check them)
---

> **Prepared by an AI. Not legal advice. No attorney-client relationship exists.** This is a draft for the founder to send, or not, to outside counsel. It asks questions; it states no conclusion and says nothing is compliant or lawful. Every reading of a law, a rule or an Apple document in it is an engineering reading by an AI agent, marked UNVERIFIED unless the text says a page was opened, and even then it is a reading and not a finding. Nothing here has been sent to anyone. No real family data is in it, and it contains no examples that name a family.

**Status of this file.** New draft file under `docs/legal/`. It does not edit `COUNSEL_PACKET.md` (1.5.0, last question Q57), any policy text, or any requirement document. Folding these questions into `COUNSEL_PACKET.md` as its next version is a separate founder merge (section 3).

## 0. Cover note (one page)

**What the proposed feature does.** A parent writing a letter to their child can add a photo or a video from their own phone and see the date it carries (and, if they keep it, a city name) quietly beside it. If the parent switches it on, the app can later show one gentle card on the Tonight screen naming a stretch of days that have pictures, and nothing more: no picture, no place, no count on the card. A parent can also type days they want a reminder for (a birthday, an anniversary). The reminder is a local notification on the phone, with fixed neutral words. The founder also asked for the app to read the library in a batch two to three times a day and to nudge by push. The council answered that with a read each time the app is opened, plus an optional, off-by-default, best-effort background top-up behind its own consent that does not ship until counsel and two device spikes say so; and no notification that comes from a library read, ever (NX-39 section 1.2).

**What it does not do.** It does not upload, sync or back up photos or videos to our servers. It does not look at what is in a picture or who is in it (no faces, no scene labels, no captions). It does not store coordinates, streets or places finer than a city. It does not write, summarize or suggest any words for the letter. It does not ship a list of festivals or religious days; the parent types their own days. It does not put a photo, a place, a count or a library fact in any notification. It does not delete or change the original in the Photos app. It does not send anything about the library to analytics, logs or crash reports.

**What is open, in one line each.** The exact words of the promise to parents (candidates in Appendix A, none chosen). Whether a promise like "stays on your phone" can stand beside iPhone backup, an iCloud download, export and a synced letter. Whether privacy and terms texts need a major version with a 30-day notice. Whether on-device reading counts as collection under the App Store label and under state sensitive-data and geolocation rules. Whether we need our own consent act. Whether a background read changes any of that. Apple's own terms, which no one on the team has read in full.

**Phase table (NX-39 v2 section 3, summarised; the founder names the release, nothing ships until its gate is signed).**

| Phase | What a parent gets | Library permission | Reads | Kept on the phone | Counsel tier needed first |
|---|---|---|---|---|---|
| P0 | Pick one photo for a letter (Apple's own picker); stripped copy | None | The picked file | The stripped copy | A (the NX-33 label) |
| P1 | P0 plus the date and, if a device test passes, a city name from the picked file | None | The picked file | Date and city name, in separate fields | A |
| P2a | "Add from your library": a chooser by date range, several per letter | Photo library read, asked on a tap | In the foreground, on a tap | Only the attached copies | A, then B |
| P2b | "Suggest days", off by default; one card at a time | The same permission, asked at the switch | In the foreground; a catch-up on open | A short list of day ranges with a city key, a cursor; the parent's hide choices in their own store | B |
| P2c | Optional "also look when the app is closed" | None new | In the background, best effort, ceiling 3 a day in code, no number in any copy | A last-looked time | B, plus Apple's terms (Q98) |
| P3 | Video | None, or as P2a | As P2a | Video copies | A (Q86), then a container-metadata proof |
| P4a | Days the parent types, with local reminders | Notifications | None | The parent's days | C |
| P4b | An in-app "days away" card on open | None | From P2b | Nothing extra | C, ships only with P2b |

**What we ask counsel to do first.** Tier A (Q78 to Q91, 14 questions) before P0 and P1. Tier B (Q92 to Q102, 11 questions) before P2. Tier C (Q103 to Q106, 4 questions) before P4 and before the background top-up is allowed anywhere near a shipped build. Nothing past tier A needs to be sent in the first batch. NX-39 (section 10, F2) suggests tier A plus the occasions question (Q103) as the first batch because P4a needs no library and may ship before P2a; that is the founder's call.

**What we have not done.** We have not read the full Apple Developer Program License Agreement, most Apple developer documentation for Photos, background tasks and the Journaling entitlement, or any of the statutes in section 7. We have not tested iOS behaviour on a phone. Section 7 lists these.

## 1. How to read each question

Each question has: **Ask** (the wording, as in the merged council brief, CB-n, in `NX-39-council-record-10nov.md` section 5); **Needed before** (the phase); **Facts counsel should not have to ask for**; **Our default** (what the product does until counsel answers; a proposal, the founder has not ruled unless the text says so); **If the answer is no** (what we would do; also a proposal); **Sources**. Terms: PRIV-R21 is our rule that anything a person agrees to has four lines, Shown, Records, Never and Decline (Appendix C has the table for this feature). LEGAL-REQ-nnn are our engineering requirements in `docs/legal/ENGINEERING_REQUIREMENTS.md`. POLICY_VERSIONING is `docs/legal/POLICY_VERSIONING.md` 1.4.0. A "moment" is a short run of days with pictures.

## 2. Questions

### Tier A: before P0 and P1 ship (first public text, first date and city read)

### Q78 (A). The promise lines (CB-1; merges NX-39 C9, C12 and privacy Q1, Q22)
- **Ask.** "Are the proposed claims (the candidates PW-A to PW-D, Appendix A) accurate and not deceptive under FTC Act section 5, given (a) iPhone and iCloud device backup of app files, (b) Apple downloading an iCloud-only original during a pick, (c) Build 12 syncing the words of a letter, (d) the parent's own export and any print order? Is 'We do not receive your photos, videos, or when and where they were taken' acceptable instead of 'stay on your phone'? Which qualifier must sit beside the claim?"
- **Needed before.** P0 (any public sentence about where photos live).
- **Facts.** (a) The app's files are part of an iPhone's own backup unless excluded; for recordings the exclusion flag is set on some derived files in code (`ScribeFilesModule.swift`, `ScribeAudioModule.swift`), and for stored photos the proposal is photos in the backup, videos out, said in words (NX-39 F9; the founder has not ruled; if silent the recommendation stands). (b) Whether Apple downloads an iCloud-only original when a parent picks it is from the privacy analysis section 4.5 and is UNVERIFIED by us. (c) Letters sync as words only after sign-in and consent; `photo_path` exists in the sync contract (`packages/api/src/server/sync.ts` line 618, optional) and is null in every payload today (NX-39 R33, R54). (d) The export carries the stored (stripped) copy if the founder merges the change to `DELETION_AND_EXPORT_SPEC.md` 4.2, which today says "original bytes" (proposed in the privacy analysis 7.4, not merged). No print path for media exists in P0 to P3 (NX-39 non-goal, R32); we have not verified that no print path exists in code. The older short form "Your photos and videos stay on your phone" is withdrawn by the council (CLO objection 1, privacy row 18, CMO O3); the NX-33 line "Photos stay on this phone, in your book" was judged inaccurate for the same reasons. The CLO read the FTC deception policy statement of 1983 on 10 Nov (ftc.gov PDF): express claims are presumed material and fine print may not cure a misleading claim. UNVERIFIED by us; the 15 U.S.C. 45 text itself was not read.
- **Our default.** No new promise ships; NX-33's words stay; nothing about media is said on the store page, website or in the app beyond describing the control. A chosen candidate always carries the backup clause (council tie-break T7).
- **If no.** If "receive" is rejected, the in-app sheet uses the description-of-controls form (`ask.days.where.alt`, Appendix B) and makes no statement about what the company receives. If every promise form is rejected, P0 and P1 do not ship.
- **Sources.** NX-39 v2 5.1; council record 5 (CB-1); privacy analysis 9.1 row 18, 9.2; CLO lens 2 objection 1.

### Q79 (A). The App Store privacy label (CB-2; merges C1, privacy Q2)
- **Ask.** "Under Apple's definition of collect (data transmitted off the device), does reading the date and city of a photo on the phone, with nothing leaving it, leave Photos or Videos, Precise Location and Coarse Location answered No, for each route (picker, limited, full, Journaling Suggestions)? Does a derived list on the phone change that?"
- **Needed before.** P1 (the first date or city read) and again at P2.
- **Facts.** Apple's text as read by the privacy agent on 10 Nov and another agent on 1 Nov: data processed only on the device is not "collected", and "If you derive anything from that data and send it off device, the resulting data should be considered separately" (developer.apple.com/app-store/app-privacy-details). UNVERIFIED by us; we did not reopen the page. Our current label draft (`app-store-privacy-labels.md` 2.1.0) answers Location and Photos or Videos No ("No photo feature in v1.0"). Nothing derived from the library may go to a server, an analytics event, a log or a crash report; one leak flips the answer (privacy analysis 1.1 finding 2). Per-phase recommended answers are in the privacy analysis section 9.4, which we did not read for this packet.
- **Our default.** Keep No for all three while nothing leaves the phone; update the labels file per phase.
- **If no.** Change the label answer for the route counsel names (Photos or Videos collected, linked, App Functionality is the privacy analysis's reading of the next step) and decide again whether that phase is worth it.
- **Sources.** Privacy analysis 4.5, 9.1 rows 6 to 8, 9.4; exec ruling on declaring nothing for a device-only country check (`docs/agents/exec/RULINGS.md`).

### Q80 (A). Version path and notice (CB-3; merges privacy Q6, Q23, C9)
- **Ask.** "Does adding media and removing 'photos' from the not-collected sentence of Privacy section 2 need a material-change notice, the 30-day gap and re-acknowledgement? Are Privacy and Terms both major bumps under POLICY_VERSIONING 2.1 (draft revision Privacy 3.0.0 to 4.0.0, Terms 4.1.0 to 5.0.0; published 2.0.0 each if 1.0.0 is out)? One text for all phases or one per release?"
- **Needed before.** P0.
- **Facts.** The sentence today (`privacy-policy.md` 3.0.0 section 2): "We do not collect your location (the country check in section 12 keeps none), contacts, photos, advertising ID or payment details." POLICY_VERSIONING 1.4.0: "When in doubt, it is major" (2.4); a new data category or way of collecting, a new purpose, or a change to what the user licenses is major (2.1 items 1, 2, 7, 9); a major change takes effect for existing users at least 30 days after publication (section 3). The frontmatter number in `docs/legal/` is an internal revision; the published sequence starts 0.9.0 (beta) then 1.0.0. Whether 1.0.0 is published is UNVERIFIED (not checked). If it is not yet published, the text goes in before publication, with no bump, and may describe only what is built. The privacy analysis 9.1 row 21 says Terms "4.0.0"; develop has 4.1.0.
- **Our default.** Major for both; one text per phase release; the labels file moves by phase.
- **If no.** Minor bump with a plain notice, still no media text before the code exists.
- **Sources.** POLICY_VERSIONING 2.1, 2.4, 3; CLO lens objection 5; privacy analysis 9.1.

### Q81 (A). A consent act of our own (CB-4; merges privacy Q5, Q6, Q4; design Q-D1)
- **Ask.** "Is a consent act of our own needed beyond Apple's prompt? New key `media-library`, or inside `sensitive-data` (LEGAL-REQ-006)? Is the PRIV-R21 form sufficient, and may the act be recorded on the phone and uploaded at sign-in with no media fact in it? Is allowing photo access a counted act?"
- **Needed before.** Tier A in the brief (before P0 and P1 ship). The library permission first appears at P2a; P0 and P1 use Apple's picker and ask for no permission, and the first-add notice (Q83) is a lighter act.
- **Facts.** Proposed acts, one per layer: `media_read` (P2a, P2b), `media_background` (P2c), `occasions` (P4a), plus the one-line first-add notice. Each records document, version, action (`agreed` or `withdrawn` only), method, surface, phone time, app version, OS major, language and a hash of the words shown, and never a date, place, count or id (Appendix C). "Not now" and a system revoke record no act (engineer's ruling 7; see Q102). The act vocabulary and where the writer lives are UNVERIFIED and counsel-adjacent (NX-39 14 item 30). Whether an act can be recorded before sign-in is open (BL-579).
- **Our default.** Agreed and withdrawn acts, recorded on the phone, uploaded at sign-in, no media fact in them.
- **If no.** Use the existing `sensitive-data` consent and show the same lines in its sheet; re-run the comprehension study on the new sheet.
- **Sources.** Council record 5 (CB-4) and 8 (ruling 7); NX-39 8.

### Q82 (A). The permission string and the sheet before it (CB-5; merges C2, privacy Q4)
- **Ask.** "Words for `NSPhotoLibraryUsageDescription` and the pre-sheet. May the string say only purpose (the microphone precedent)? Is the sheet an adequate notice at collection? If a background read exists, must the string and sheet name it (CB-19, CB-27)?"
- **Needed before.** Tier A in the brief (before P0 and P1 ship). The permission string first appears at P2a: P0 and P1 add no photo-library key, and LEGAL-REQ-007 as written would fail the build on it (the privacy analysis proposes the amendment). So the first public text can proceed on the picker if this waits.
- **Facts.** Draft string (NX-39 5.1): "{app} uses the dates in your photos and videos to help you find pictures for a letter." A second clause, "It can do this when the app is closed.", exists only in a build where the background top-up is on. The labels 1.4.0 dropped "Your recordings stay on this phone" from the microphone string because a purpose string must be true whatever the backup setting; both content files still carry it (privacy analysis 9.1 row 11, a separate finding). Apple's own page for the key says only that it is "A message that tells people why the app is requesting access to their photo library" (as read by the privacy agent; UNVERIFIED by us). Candidate sheet and string wordings are in Appendix B (themes 2, 3, 5 and 13).
- **Our default.** Purpose only in the string; "not sent to us" style statements only in the in-app sheet, which can change with the build.
- **If no.** String carries counsel's wording; if the background read cannot be named truthfully in the string, the background top-up does not ship (Q101).
- **Sources.** NX-39 5.1; words file section 3; privacy analysis 9.2.

### Q83 (A). Pictures the parent did not make (CB-6; merges privacy Q14, Q15, C6)
- **Ask.** "Draft a right-to-add term for media the parent did not make, covering copyright, licence and a one-line first-add notice. Does the NCMEC sentence in Terms 9 stay accurate for a local-only app?"
- **Needed before.** P0 (a grandparent's photo can be picked on day one).
- **Facts.** Terms 4.1.0 section 5.1 covers "things you create"; 5.2 is the licence we need to store and display content; 5.5 mentions "other adults" in a recording; section 9 has the NCMEC reporting sentence. None speaks of a grandparent's photo, another adult's video or another family's child. Placeholder first-add line in the words file: "Add only pictures you have the right to keep in your book." It records version and time only. No clause text is drafted yet; that is a separate `legal` task (BL-866) and a founder merge. Copyright of others' photos stays the parent's issue only while nothing is distributed; the print path and any share would change that (CLO objection 6).
- **Our default.** Notice on the first add of a picture the parent did not make; Terms bump per Q80.
- **If no.** No notice; the clause alone, in the Terms.
- **Sources.** CLO lens objection 6; words file 2.1 (`attach.firstAddNotice`); NX-39 8 (last row of the door-line table).

### Q84 (A). Other people and other children in the parent's own book (CB-7; merges C5, C6, R38)
- **Ask.** "Is the parent's own-book position enough for pictures of other people and other children when no detection runs? Confirm no biometric statute is touched (Washington, Illinois named; not opened)."
- **Needed before.** P1.
- **Facts.** The product has a hard rule: no face detection, landmarking or recognition, including OS frameworks via Photos APIs, no People albums, no scene or object labels, no captions (compliance register CR-040, 1.1.0; NX-39 non-goals). Media is private to the parent and the phone; nothing in P0 to P4 shows media to anyone else. Washington's and Illinois's biometric statutes, and Texas's, were not opened by any agent (UNVERIFIED).
- **Our default.** The parent's own-book position; no detection of any kind, ever.
- **If no.** Restrict what can be added or add a notice; counsel to say which.
- **Sources.** Privacy analysis 2, 3.3, 7.1; CLO lens CB-7.

### Q85 (A). Children, Read together, and a future adult (CB-8; merges C5, privacy Q19, Q20, Q16)
- **Ask.** "With children's media in the book, does the 2025 COPPA amendment, Read together showing media to a child, the 18+ gate, or a future adult's request for childhood images change any answer?"
- **Needed before.** P0.
- **Facts.** The product is for adults, 18 and over; the parent is the user, so a child's image is not collected from a child (FTC COPPA FAQ F.4 as read by the privacy agent; UNVERIFIED by us); the app must stay adult-directed (register CR-001). NX-39 R57: no library-derived value or media appears in Read together, a widget or a lock-screen notification. The 2025 COPPA amendment text (16 CFR Part 312) was not read by the CLO (UNVERIFIED). California AB 1043 (age signals) is on our calendar for 1 Jan 2027 (COUNSEL_PACKET section 0; not re-read). A grown child may later ask what an operator holds of their childhood; today the answer is "on the parent's phone".
- **Our default.** Media never shown in Read together; adult-only gate unchanged.
- **If no.** Counsel names what Read together may show; media stays out of it until then.
- **Sources.** Privacy analysis 4.1, 7.1; NX-39 R57.

### Q86 (A). Video with other people's voices (CB-9; merges privacy Q18, C13)
- **Ask.** "A video with other people's voices, kept on the phone and possibly exported: exposure under California Penal Code 632 (register CR-041). Is Terms 5.5 and 9 enough?"
- **Needed before.** P3 (video). The council record files it in tier A; the phase table gates only P3 on it, so it can wait if the first batch must be short.
- **Facts.** We never transcribe or analyse video audio (CR-040: no voiceprint, no diarization). The parent made the recording, not us. Cal. Penal Code 632 was not opened by any agent (UNVERIFIED). Video limits proposed: 60 seconds, 200 MB after conversion (NX-39 6). Whether container metadata is fully stripped from video is itself UNVERIFIED (NX-39 R8).
- **Our default.** Video (P3) is last in the order and off until this is answered.
- **If no.** No video; photos only.
- **Sources.** Privacy analysis 7.1; NX-39 3 (P3 row).

### Q87 (A). A city name kept with a letter (CB-10; merges C3, privacy Q7, Q9, Q10)
- **Ask.** "A city-level name kept with a letter, on the phone only: is it precise geolocation (California 1,850 feet, Washington 1,750 feet) or, taken at a hospital or clinic, consumer health data? Safest granularity? Does 'we do not collect your location' stay true?"
- **Needed before.** P1.
- **Facts.** The picked file may carry coordinates; the app would read them in memory, pick a city from a table kept inside the app (no network call), and drop the coordinates (never stored, even on the phone). Street, venue and point-of-interest names are never read, shown or stored. The city is kept only if the parent keeps it with a letter, and the parent can change or clear it. California's definition (circle of radius 1,850 feet) is quoted in the privacy analysis 4.3 and Washington's 1,750 feet in 4.4; UNVERIFIED by us. A child's life includes a maternity ward, a NICU and a paediatrician; place by date alone is refused on cards (NX-39 R16). Whether the city comes through Apple's picker without a prompt is a device spike not yet run (BL-843) and the table is BL-844. Washington's My Health My Data Act as it applies to a city kept with a letter is UNVERIFIED.
- **Our default.** City only; date-only if either spike fails; the Places switch (P2b) is off by default; "we do not collect your location" is kept only with the on-device qualifier proposed in the privacy analysis 9.1 row 1.
- **If no.** Date only, no place at all.
- **Sources.** Privacy analysis 2, 4.3, 6; NX-39 3, 7.2.

### Q88 (A). Which state rules reach data that never leaves the phone (CB-11; merges privacy Q8)
- **Ask.** "Which state sensitive-data and precise-geolocation rules apply to data that never leaves the phone? Is on-device reading 'collection' or 'processing'?"
- **Needed before.** P1.
- **Facts.** California, Connecticut and Washington are the states the CLO named; the CLO relied on quotes in the privacy analysis and opened none of them (UNVERIFIED). Nothing derived from the library leaves the phone in any phase; Q94 and Q99 cover the two stores that could.
- **Our default.** Treat on-device reading as outside our collection, and keep the design so that one rule change does not break it (no server field).
- **If no.** Counsel names the duties per state; we decide per phase whether to proceed.
- **Sources.** Privacy analysis 4.3, 4.4.

### Q89 (A). A bundled place table or Apple's geocoder (CB-12; merges C7, privacy Q3)
- **Ask.** "If Apple's geocoder were used instead of a bundled table, do the coordinates sent count as our collection? If the table is used, is anything left to disclose, including attribution of its licence?"
- **Needed before.** P1.
- **Facts.** Plan: a bundled table, no network call (NX-39 R7), never Apple's geocoder (CLO decision table). Which table, and its licence, is not chosen: it is the spike BL-844 (UNVERIFIED).
- **Our default.** Bundled table. Its licence terms are read before it is chosen.
- **If no.** Date only, with no city.
- **Sources.** Privacy analysis 6.2; CLO lens section 6.

### Q90 (A). Export and print (CB-13; merges C8, privacy Q13)
- **Ask.** "The export may carry places as text; a print order sends content to a processor. Does 'stays on your phone' survive? What warning, what defaults, should occasions be in the export?"
- **Needed before.** P1.
- **Facts.** The export holds the stored (stripped) media copy, each file with its size and SHA-256; a place chip is text in the entry if the parent kept it; coordinates are never in the export (privacy analysis 7.4). The export is a plaintext ZIP people hand to others (DATA-REQ-056). Print of media is a non-goal in P0 to P3 (NX-39 9, R32); the CLO asks for a line before any send of a book with media and a test (CLO-11). Place on a kept item in a shared view or print: own export on, others and print off (NX-39 F15 recommendation, undecided). Occasions in the export: open (privacy analysis 7.4).
- **Our default.** As listed; no print of media; "stays on your phone" is not used (Q78).
- **If no.** Export drops place text and occasions; the export screen carries counsel's warning.
- **Sources.** Privacy analysis 7.4; NX-39 F15.

### Q91 (A). App Review and Apple's agreement for a picker-only first release (CB-14; merges C10, privacy Q11)
- **Ask.** "Is a picker-only P1 within App Review 5.1.1(iii)? For the Journaling Suggestions picker, what statement does the entitlement need? Please read the full Apple Developer Program License Agreement for any term on user and device data (only a fragment of 3.3.9 was seen, in a forum thread)."
- **Needed before.** P1 (the picker); the Journaling route is a spike only.
- **Facts.** App Review 5.1.1(iii) as quoted by the privacy agent: "Where possible, use the out-of-process picker or a share sheet rather than requesting full access to protected resources like Photos". The Journaling entitlement is written in the privacy analysis as `com.apple.developer.journal.allow` and in the council brief as `com.apple.journal.allow`; we do not know which is right (UNVERIFIED; counsel or the engineer to check Apple's page). Its approval path is UNVERIFIED. The CLO could confirm only a forum-thread fragment of 3.3.9: "may not collect user or device data without prior user consent".
- **Our default.** Picker-only for P0 and P1; Journaling Suggestions as a spike only (NX-39 F10); no application to Apple before this is answered.
- **If no.** Counsel names the statement the app must make in App Review.
- **Sources.** Privacy analysis 3.1, 4.5; CLO lens objection 9.

### Tier B: before P2 (library read, derived data, background)

### Q92 (B). Why a library read and not the picker (CB-15; merges C10, privacy Q9 part)
- **Ask.** "Is a library read justified over the picker for suggestion cards (5.1.1(iii))? Is Limited handled as the whole library acceptable, and does revocation need more than clearing the index?"
- **Needed before.** P2a.
- **Facts.** A suggestion needs to know which days have pictures, which the picker alone cannot do. Apple's WWDC20 talk, as quoted by the privacy agent, says most apps do not need library access (UNVERIFIED by us). Limited access is first-class in the design; whether photos taken after a Limited selection become visible is UNVERIFIED (NX-39 14 item 4). On narrowing or revoke the index is cleared on the next open and a plain note is shown.
- **Our default.** Library read only behind an off-by-default switch, asked at the switch, never at launch.
- **If no.** Stay with the picker; P2 does not ship.
- **Sources.** Privacy analysis 3.1, 3.2; NX-39 3, 7.3.

### Q93 (B). A date range on a card (CB-16, reduced; merges privacy Q21)
- **Ask.** "Reduced: the card shows a date range only. Confirm a count shown on screen in the chooser (not on the card, never in a notification or analytics) is acceptable, or drop it."
- **Needed before.** P2a.
- **Facts.** A count such as "12 photos" is derived from the library (class L4); allowed on screen only in the chooser. The card shows no numeral about photos (NX-39 R17).
- **Our default.** Date range on the card; no count anywhere until counsel answers.
- **If no.** No count.
- **Sources.** Privacy analysis 2 (last row), 8; NX-39 R17.

### Q94 (B). The unused photo bucket and a future server copy (CB-17; merges privacy Q17)
- **Ask.** "For any future server copy of media, what duties arise under 18 U.S.C. 2258A (only (a)(1) and (f) read; the definition of provider not seen)? Is the unused `entry-photos` bucket with `photo_path` already relevant?"
- **Needed before.** P2 (gate on any server copy; none is planned).
- **Facts.** We checked the first migration (`supabase/migrations/20260930000000_scribe_core.sql`, lines 289 to 325): the private bucket `entry-photos` (10 MB; jpeg, heic, png) exists with an insert policy for an authenticated member of the child's book. Later migrations were not checked, so we do not know whether writes are allowed today. The sync contract has an optional `photo_path` field (`packages/api/src/server/sync.ts` line 618); the app sends null. A remote switch `photos` defaults off (ADR, as read by the CLO). The register (CR-113) names 2258A as "Unverified, not opened". The CLO opened 18 U.S.C. 2258A on Cornell on 10 Nov: reporting attaches "after obtaining actual knowledge" of apparent violations (a)(1); (f) says the section does not require a provider to monitor users or "affirmatively search, screen, or scan". The definition of "provider" was not on the page read. UNVERIFIED by us.
- **Our default.** The bucket's write policies deny writes and every sync payload carries a null `photo_path`, proved by a test in `supabase/tests` (NX-39 R54, CLO-10); not built yet.
- **If no.** Same default, and the field is removed from the contract in a later change.
- **Sources.** CLO lens objection 7; NX-39 R33, R54.

### Q95 (B). Classifying a place on the phone (CB-18; merges privacy Q24)
- **Ask.** "Does extending the no-inference rule (LEGAL-REQ-015) mean the app may not classify a place on the phone (for example to hide a hospital), and is any on-device place classification itself a health inference?"
- **Needed before.** P2b.
- **Facts.** Place is date-only on cards and the Places switch is off by default (NX-39 R16, council T12). A parent can hide a day or a stretch by hand. The design cannot know why a day is hidden.
- **Our default.** No classification of any place. The parent hides days.
- **If no.** Same.
- **Sources.** Privacy analysis 6.4, 8; NX-39 R20.

### Q96 (B). The kept list of moments (CB-12b; the architecture draft's index, reduced)
- **Ask.** "Reduced: v2 stores moments rows (a day range and a city key). Is that a location history or precise geolocation, even on the phone? Would computing on open and keeping nothing change the answer?"
- **Needed before.** P2b.
- **Facts.** The first architecture draft (#745) kept a row per photo with a six-character geohash cell, which the CLO and others put at about 1.2 km by 0.6 km, or 0.72 km2 (the ADR's own figure; area arithmetic by three agents, not checked by us), against California's 1,850-foot radius circle of about 1.0 km2 and Washington's 1,750 feet of about 0.89 km2. The council replaced that with moments rows (day range, city key, flags) and a cursor; no cell, no asset id, no coordinate is kept; the file is excluded from backup (flag set again; whether the flag survives a restore is UNVERIFIED, NX-39 14 item 19); cleared on switch off, Forget, Erase everything and revoke.
- **Our default.** Moments rows as described.
- **If no.** Compute on open and keep nothing (slower on a large library; the privacy analysis prefers it).
- **Sources.** CLO lens objection 3; NX-39 6, R40.

### Q97 (B). A background read (CB-19; new)
- **Ask.** "The founder wants a best-effort background read, with a ceiling and no promise, behind its own switch. Does an unseen, repeated read change any answer above (Q78, Q79, Q87, Q88)? What must the sheet, the purpose string and the Privacy text say? May the product ever state a frequency? (v2 answer by design: it will not.)"
- **Needed before.** P2c (never shipped on by default).
- **Facts.** iOS decides when background work runs; a force-quit, Low Power Mode or Background App Refresh turned off can mean no run at all. Sources are an Apple developer page and two forum threads, partly read (NX-39 1.2, 14). Every sentence of the form "only when you open the app" is false once a background task exists, so such sentences are used only in builds where the top-up is off (CLO objection 2). Ceiling 3 a day in code, no floor, no number in any copy. A second sheet and its own act (Appendix C). No notification derives from a library read.
- **Our default.** Not built in production. A flag exists that stays off until Q97, Q98, two device spikes, the founder's ruling and the study pass line (NX-39 3, R46).
- **If no.** P2c is dropped and "never read the library in the background" stays true.
- **Sources.** CLO lens objection 2; NX-39 1.2, 3, R44 to R46.

### Q98 (B). Apple's terms for background work (CB-20; merges CLO CB-20 and CISO S6)
- **Ask.** "Which Apple terms apply to scheduled background work and to deriving data from the library in the background (background modes, App Review 2.5.4, the license agreement)? Counsel's ruling on `UIBackgroundModes` and LEGAL-REQ-011 is required before the flag for P2c can ever be on in a shipped build."
- **Needed before.** P2c.
- **Facts.** Product reports that a preflight script for TestFlight builds fails any `UIBackgroundModes` (`preflight-testflight.mjs`, lines 575 to 576, per NX-39 14; we did not locate the file on `develop` and did not read it). The Expo background-task implementation and its plist keys are UNVERIFIED (NX-39 14 item 2). LEGAL-REQ-011 in the requirements file is a recording-consent item; the link the brief draws to background modes is the council's, not verified by us.
- **Our default.** No background mode is declared and no task is registered (CLO-5).
- **If no.** Same.
- **Sources.** NX-39 14 items 1, 2, 17; CLO lens objection 2.

### Q99 (B). Hidden days and snoozes (CB-25; new)
- **Ask.** "The parent's hidden days and stretches (and the 14-day snoozes, which are a date range plus an expiry) are stored as bare dates on the phone. Is that sensitive data? Should it be excluded from device backup? Should it be exported?"
- **Needed before.** P2b.
- **Facts.** A hidden hard week is a fact about a family's year, kept so that a card never shows it. The parent can see the list on a Hidden choices page and clear it. The council ruled that one unattached photo is hidden for the open chooser session only and keeps no stored photo key (ML-13, 10 Nov, later than the brief). The decisions survive Forget, Stop these and revoke; only Erase everything, Delete account and an explicit Clear remove them. Whether to exclude the store from device backup is open; the words avoid "only" and "never leaves" for this reason (words file 4.4).
- **Our default.** Kept on the phone, backup stance undecided, not exported unless counsel says otherwise.
- **If no.** Counsel names the treatment.
- **Sources.** Council record 5 (CB-25), 8.1; NX-39 R41.

### Q100 (B). The ledger of recent looks (CB-26; new)
- **Ask.** "The ledger's recent-looks list holds only times and a reason. Is that a new record needing disclosure?"
- **Needed before.** P2b.
- **Facts.** The list holds a time and a reason code per look, no content, and is cleared on switch off, Forget, Erase and revoke. A retention number was not found in the parts we read.
- **Our default.** Disclosed in the ledger page and in the Privacy text for the phase.
- **If no.** Drop the list and show only "last looked".
- **Sources.** Council record 5 (CB-26); NX-39 R18, 7.3.1.

### Q101 (B). Purpose string must be complete (CB-27; new)
- **Ask.** "Purpose-string completeness per build: if the string must name background reading, and cannot, the background top-up does not ship."
- **Needed before.** P2c.
- **Facts.** The string is one sentence, identical to the in-app content string word for word (NX-39 R56). Apple 5.1.1(ii) as read by the privacy agent requires the string to "clearly and completely describe" the use; UNVERIFIED by us. The same string covers every user of the build.
- **Our default.** The second clause appears only in a P2c build.
- **If no.** No P2c.
- **Sources.** CLO lens objection 2; NX-39 5.1, R56.

### Q102 (B). Narrowing or revoking access and the record of the act (CB-28; new)
- **Ask.** "When access narrows (All to Limited, or fewer photos shared) the app records no fresh consent act, wipes the index and shows the parent a plain note; when iOS access is revoked it records no withdrawn act. Is the existing record of the agreement still accurate and sufficient in both cases, or must a narrowing or a revoke produce its own act? Is the plain ledger note adequate notice? (Also read with Q81 on the act vocabulary.)"
- **Needed before.** P2a.
- **Facts.** After a revoke the last act on record still reads agreed while access is gone; that is truthful about what the parent chose, and counsel-adjacent (council record 8, rulings 7 and 9). The ledger line is `access.changed.cleared` (Appendix B).
- **Our default.** No new act in either case; the note is shown.
- **If no.** Add a withdrawn or narrowed act; record text reviewed under POLICY_VERSIONING.
- **Sources.** Council record 5 (CB-28), 8.

### Tier C: before P4 (occasions and reminders)

### Q103 (C). Days the parent types (CB-21; merges C4, privacy Q12)
- **Ask.** "Is a parent-typed occasion, on the phone only, outside special-category or sensitive-data rules? Would a neutral list change it, and how should a list be chosen, dated and reviewed? Which regions does the 1.0 audience include?"
- **Needed before.** P4a. (NX-39 F2 suggests sending this with tier A.)
- **Facts.** A chosen festival can reveal religion, ethnicity or culture; CPRA and GDPR Article 9 list them (as read by the privacy agent; UNVERIFIED by us). The repo already treats spoken languages as sensitive for the same reason. The design council removed a nine-festival starter list from the first flows draft: P4a is "Add your own" with a typed name and date only; no pre-listed festival, no date table, no ask card (CLO-9; words file 7.1 says the screen "adds none for you"). Audience: US App Store only for 1.0 (COUNSEL_PACKET section 0); other regions are the founder's later decision.
- **Our default.** Typed only. Occasions stay on the phone, outside every sync set, analytics and insights (test proposed).
- **If no.** Same, plus counsel's treatment of the typed field (for example, stored without any label).
- **Sources.** Privacy analysis 5; CLO lens objection 4; council T2.

### Q104 (C). The words of a reminder (CB-22, reduced)
- **Ask.** "Is the fixed neutral text of a reminder for a parent-typed day misleading or an implied claim? Which fixed lines carry no inference?"
- **Needed before.** P4a.
- **Facts.** Eight fixed keys, Appendix B theme 12. None names a place, a photo or a count; none says "found", "noticed" or "your photos". The day's name appears only if the parent turns that on.
- **Our default.** The fixed set; nothing else can be sent.
- **If no.** Counsel's lines replace them.
- **Sources.** Words file 7.2; CLO-12.

### Q105 (C). Local notifications and the lock screen (CB-23; merges C11)
- **Ask.** "Marketing-consent, quiet-hours or religion-adjacent concerns for local notifications with neutral text? Is 'Show the day's name on the lock screen', off by default, acceptable?"
- **Needed before.** P4a.
- **Facts.** The reminders are local to the phone; the operating system stores their text. One shared cap, the parent's own cadence (weekly by default, F6). No notification derives from the library; no digest.
- **Our default.** Name on the lock screen off by default.
- **If no.** Remove the switch; the reminder never carries the name.
- **Sources.** Privacy analysis 5.3; NX-39 R26, R27, R61.

### Q106 (C). A date shown for a lunar day (CB-24)
- **Ask.** "If the app ever shows a date for a lunar or sighting-based day, is a wrong date a misrepresentation, and who signs off the date table? (Moot while occasions are typed only.)"
- **Needed before.** Only if a list is ever added.
- **Facts.** No list or date table ships. The first flows draft showed "Falls on 12 Nov"; that is withdrawn.
- **Our default.** Moot.
- **If no.** Moot.
- **Sources.** Council record 5 (CB-24); CLO lens objection 4.

## 3. Numbering, and how to re-check it

- **Last question in the packet on `develop` (16df0f5f2, 10 Nov):** Q57 (`COUNSEL_PACKET.md` 1.5.0).
- **Claimed but not merged:** PR #598 (open, head dc799fb9) proposes Q58 to Q60 (the TestFlight questions, which `TESTFLIGHT_TESTERS.md` still calls Q57 to Q59) and Q61 to Q74 (the account program), in `docs/compliance/account-experience-obligations.md`. `docs/BACKLOG.md` BL-780 asks for three more questions "numbered from the next free Q" after #598, so they will take Q75 to Q77.
- **Search done 10 Nov:** all `origin` branches (651) for Q75 to Q99 and Q100 to Q199 in `docs/legal`, `docs/compliance`, `docs/BACKLOG.md` and `docs/DECISIONS.md`: no hit in text (a few binary image files matched and were ignored). The titles and bodies of the open pull requests (REST API, first 300) were searched for Q75 and above: no hit. Only #598 proposes new counsel numbers.
- **Chosen:** Q78 to Q106, in tier order. Mapping to the council brief: Q78=CB-1, Q79=CB-2, Q80=CB-3, Q81=CB-4, Q82=CB-5, Q83=CB-6, Q84=CB-7, Q85=CB-8, Q86=CB-9, Q87=CB-10, Q88=CB-11, Q89=CB-12, Q90=CB-13, Q91=CB-14, Q92=CB-15, Q93=CB-16, Q94=CB-17, Q95=CB-18, Q96=CB-12b, Q97=CB-19, Q98=CB-20, Q99=CB-25, Q100=CB-26, Q101=CB-27, Q102=CB-28, Q103=CB-21, Q104=CB-22, Q105=CB-23, Q106=CB-24.
- **Why not Q58:** the council record and the CLO proposed "Q58 onward" with the note that Q57 was the last row they saw and other branches were unchecked. Q58 to Q74 are claimed by #598; Q75 to Q77 are reserved by BL-780.
- **Before sending:** re-run the search above. If #598 or BL-780 land with different numbers, renumber this file in one pass (the mapping table is the only place the pairing lives). The founder, not an agent, decides when the questions join `COUNSEL_PACKET.md`.
- **Count note.** NX-39 section 13 says tier A is 15 questions, tier B 7 and tier C 3. The merged brief has 14, 11 and 4 (CB-12b, CB-25 to CB-28 were added to tier B after that count, and CB-21 sits in tier C). This file follows the brief.

## 4. The facts counsel should not have to ask for

**Plain words, no diagram.** Where a photo or video goes, in each phase, for a parent who has not signed in and for one who has.

1. **Picking.** The parent taps Add a photo or video and chooses from Apple's own picker. The picker runs apart from the app and passes back only what the parent chose. No library permission is asked in P0 and P1. The app makes a copy inside its own folder, with the device and location details stripped from the copy at the moment it is made, and keeps no pointer into the library (no library identifier is kept after the copy is made). The original in the Photos app is never changed or deleted; the app asks for no add or delete permission.
2. **Reading dates and places (P1 onward).** Date comes from the picked file. If the file carries a place, the app reads it in memory, picks a city name from a table inside the app, and drops the coordinates. The city and the date are kept as separate fields with that letter, on the phone, and the parent can change or clear them. Whether the picker returns these fields without a prompt is a device test not yet run (BL-843).
3. **Nothing leaves the phone because of us.** In P0 to P4, no photo, video, date, place, count, occasion, moment or consent fact about the library goes to our servers, to analytics, to logs or to crash reports. Counsel should read that as an engineering rule with tests proposed (NX-39 R30, R33, R54), not as a statement already proved by shipped tests. The only thing that goes to a server is the consent act, at sign-in, and it holds no media, place or date.
4. **What iPhone backup does.** An iPhone's own backup (iCloud or a computer) can include an app's files unless the app excludes them. So a copy of a picked photo in the app's folder may be in the parent's iPhone backup, and that backup is Apple's service for the parent, not ours. The proposal is photos in the backup, videos out by default, said in words (NX-39 F9, not yet decided). The kept list of moments has the exclusion flag set; the parent's hidden choices may be in the backup (open, Q99).
5. **Apple and iCloud.** If the parent picks a photo whose original is stored only in iCloud, Apple's picker may download it from Apple to the phone. UNVERIFIED by us (privacy analysis 4.5).
6. **Sync of letters (Build 12 and after).** When a parent signs in and consents, a letter's words sync to Supabase in the US as today. A letter's media does not: `photo_path` is null in every payload, no media byte uploads, and a place chip is not synced (NX-33 R16 via the privacy analysis 6.3). A place chip would be a separate consent act if media sync ever exists. The co-parent therefore does not receive the photo or video. The private `entry-photos` bucket and the optional `photo_path` field exist on the server from earlier work and are unused (Q94).
7. **Recording backup is separate.** The optional, free, off-until-turned-on recording backup (encrypted audio, key escrow) is a different feature with its own consent and does not include photos or videos (COUNSEL_PACKET section 0; privacy analysis 7.2). Photos and videos are not part of it (privacy analysis 7.2).
8. **Export.** The parent's own export (a ZIP they can hand to others) holds the stored copy of each picture with its size and SHA-256, plus the city text if the parent kept it. It never holds coordinates. The change from "original bytes" to "stored copy" in the export spec is proposed and not merged (Q90).
9. **Print.** No media goes to a print vendor in P0 to P3. A printed book with pictures is a later decision and needs Q90 answered first.
10. **Erase and delete.** Erase everything on this phone, Delete a book, Delete a letter (after the 30 days in Recently deleted), Take it off, and Delete account each remove the stored copies, the date and city fields, thumbnails, picker temporary files, the kept list with its sidecar files, the cursor, the look log, the hidden choices, the snoozes, the reminders and the media consent record, in the paths listed in the privacy analysis 7.3 and NX-39 R31. A phone that has never signed in sends nothing when it erases.
11. **Who else can see it.** In P0 to P4 no one but the parent, on the phone. Media never appears in Read together, a widget, a Live Activity, a share extension or a lock-screen notification (NX-39 R57, R51).
12. **Plan.** A picture attached to a letter is free; a lapsed plan never removes a keepsake (privacy analysis 7.2).
13. **Server cost and vendors.** No new vendor, server table, bucket, function or migration is added for P0 to P4 (NX-39 R54).

## 5. Documents attached

Read these in this order. Heads are those fetched through the GitHub REST API on 10 Nov 2026.

| # | Document | Where | What it is |
|---|---|---|---|
| 1 | NX-39 v2 requirements (this brief's source) | PR #747, `docs/roadmap/next/03-requirements/NX-39-memory-library.md` | Phases, candidate promise forms, door lines, requirements R1 to R61, UNVERIFIED list |
| 2 | NX-39 council record with the merged brief (CB-1 to CB-28) | PR #747, `NX-39-council-record-10nov.md` | The nine-lens review, tie-breaks, the 10 engineer rulings. Head named in the task: 4f5153d5b7b12d362c622b97a9fe2e613723059f; the PR head is now 47908c1b8ba67f684fbd60abbf7e7b57fabb6004, which adds ML-13 and ML-14 (section 8.1) and changes nothing in the CB list. |
| 3 | Privacy, legal-risk and compliance analysis | PR #748, `docs/privacy/MEMORY-LIBRARY-PRIVACY-ANALYSIS-10nov.md`, head 9bb1696c4f338305df6106108e75a98734c2b5fb | Data classes, routes into the library, laws to check, the statements that become untrue (9.1), label answers by phase (9.4), go/no-go lists per phase |
| 4 | Flows and wireframes | PR #746, `docs/design/specs/MEMORY-LIBRARY-FLOWS-10nov.md` and `-WIREFRAMES-10nov.html`, head 00a1082c33396b3021ab1904f4118f626d33786f | Screen flows. Its nine-festival starter card is withdrawn (Q103) |
| 5 | Consent and surfacing design spec | PR #751, `docs/design/specs/MEMORY-LIBRARY-CONSENT-AND-SURFACING-10nov.md` and wireframes, head 33912d2260f32d67aeba66bf89a64b8492e8cb2a | The sheets, the ledger, Forget, Hidden choices |
| 6 | The words | PR #752, `docs/design/specs/MEMORY-LIBRARY-WORDS-10nov.md`, head d1ed0eb4ca4bc74c135216f40fc03fe7bc316d73 | Every proposed string; the candidate promises (section 11); the claims ledger (section 12) |
| 7 | Architecture decision draft | PR #745, `docs/adr/DRAFT-memory-library-architecture-10nov.md`, head 19c6eb1d4690a5436183cf99a7709f99c55426f8 | The first index design (superseded on the index and phase table by NX-39 v2) |
| 8 | Benchmark | PR #749, `docs/research/MEMORY-LIBRARY-BENCHMARK-10nov.md`, head ae434ee7c23b943dc97d1b0eb3a7e54fa21e5176 | How Apple Journal and similar apps behave |
| 9 | Current legal drafts | `develop`: `docs/legal/privacy-policy.md` 3.0.0, `terms-of-service.md` 4.1.0, `POLICY_VERSIONING.md` 1.4.0, `app-store-privacy-labels.md` 2.1.0, `in-app-disclosures.md`, `compliance-register.md`, `COUNSEL_PACKET.md` 1.5.0 | What the questions change |
| 10 | Requirement documents | `develop`: `docs/legal/ENGINEERING_REQUIREMENTS.md` (LEGAL-REQ-006, -007, -011, -012, -013, -015), `DELETION_AND_EXPORT_SPEC.md` | Not edited by this packet |

Not attached because not yet written: a right-to-add Terms clause (Q83), a Privacy text for any phase, a claims registry (`docs/legal/CLAIMS.md` is absent on `develop`).

## 6. Decisions only the founder can take that the answers feed

Which promise wording (F4); whether to name P0 and P1 for a release (F1); the major version bumps and the 30-day notice (F5); backup stance for stored photos and videos (F9); the Journaling entitlement application (F10); the background reversal of "never read it in the background" (F11); print and place in shared views (F15). Counsel's answers go to the founder; counsel hours are the founder's to approve (F2).

## 7. UNVERIFIED, and what was not read

**Read by the drafter of this packet on 10 Nov 2026:** the CLO lens and the merged brief (council record section 5), NX-39 v2 (sections 1 to 14 in part), the words file (tables and sections 11 to 14), the privacy analysis (sections 0 to 3, 7, 9.1, 9.2 and parts of 9.3), `COUNSEL_PACKET.md` 1.5.0, the first Supabase migration for the photo bucket, `legal-docs.test.ts`, and the numbering evidence in section 3. No external web page, statute or Apple document was opened for this packet.

**Not read by the drafter:** the privacy analysis sections 4 to 6, 8, 10 to 15 in full; the flows file, the consent design spec and its wireframes, the ADR and the benchmark (listed only); the code of PR #754; every statute and rule below; every Apple page below.

**UNVERIFIED (every legal or Apple statement in this file rests on another agent's reading, quoted second-hand):**
- 15 U.S.C. 45 and the FTC deception policy statement (1983); the Everalbum FTC press release (2021) that the CLO cites as an analogy only.
- 18 U.S.C. 2258A beyond subsections (a)(1) and (f); the definition of provider.
- California CPRA definitions (precise geolocation 1,850 feet; sensitive personal information), Washington My Health My Data Act (1,750 feet), Connecticut, Illinois and Texas biometric law, Cal. Penal Code 632, COPPA 2025 amendment (16 CFR Part 312), GDPR Article 9, California AB 1043.
- Apple: the full Developer Program License Agreement (only a forum fragment of 3.3.9); App Review 5.1.1(ii), (iii), (iv) and 2.5.4 (quoted by the privacy and CLO agents); the App Privacy details page; the Photos, PhotoKit and BGTaskScheduler pages; Low Power Mode and Background App Refresh rules; the Journaling Suggestions entitlement (name and approval path); whether the picker returns date and place without a prompt; whether Apple downloads an iCloud-only original during a pick; whether the exclusion-from-backup flag survives a restore.
- Repo: whether Privacy and Terms 1.0.0 are published; whether later migrations change the `entry-photos` write policies; whether any print path for media exists in code; the location of `preflight-testflight.mjs`; the exact reading of LEGAL-REQ-011 for background modes; whether every proposed string passes `rules.test.ts` (none has been run through it).
- Geohash cell size and the circle areas are other agents' arithmetic from quoted figures.

## Appendix A. Candidate promise wordings (PW-A to PW-D), none chosen

Source: PR #752, `MEMORY-LIBRARY-WORDS-10nov.md` section 11, head d1ed0eb4ca4bc74c135216f40fc03fe7bc316d73. The words are verbatim, including "Early Letters", which would be a placeholder in a string. None is live. None has been run through the content rules test. The backup-aware qualifier is required in every candidate (council tie-break T7). The reading grades are an estimate from a heuristic by the words author and not a standard measure; no parent has tested them.

| | PW-A | PW-B | PW-C | PW-D |
|---|---|---|---|---|
| Wording | "Put the photo beside the words you said. Early Letters shows when it was taken, and the photo stays with your letter, on your phone and in your iPhone's own backup if you use one." | "We do not receive your photos, videos, or when and where they were taken." | "Photos and videos you add stay on this phone, in your book, and in your iPhone's own backup if you use one." | "You choose what Early Letters can see. It reads only the dates of the photos you allow, it never looks inside them, and the words are always yours." |
| Source | CMO A | CLO; CMO C | Privacy analysis 9.1 row 18 | CMO B, "places" removed |
| Where it could appear | P0 and P1 | P1, and P2 beside the sheet | P0 and P1 | P2a and later, as the control line |
| What it claims | The date shows; the photo stays with the letter; it is in the iPhone's own backup if the parent uses one | The company does not receive the photos, videos or when and where | Photos and videos are in three places, none of them the company | The parent chooses the access; only dates are read; never the content; the words are the parent's |
| Needed before it can be said | The picked file carries the date (BL-843); drop "when it was taken" if not | Counsel on the verb and the label answer; the edges of print, export and iCloud download beside the claim, not behind a link | As PW-B; videos are out of iPhone backup under the recommended stance, so "videos" does not take the backup clause | The scan proof that nothing inside a picture is read; the place question settled; counsel on "never looks inside" |
| Plain-language note | Two sentences; the second holds three ideas | Shortest; "receive" may be read as "see" | A list of three places; "stay on this phone" followed by "and in your backup" can sound contradictory | The only one that speaks about control; "never looks inside" is strong |
| Content-rule hits (words author, by hand) | None | Contains "We"; needs an allowance in the P0 rule | "stay on this phone" is caught by the rule that blocks claims letters stay on the phone | None |

The words author's finding, not a recommendation: PW-B and PW-D can be shown together because they answer different questions (what the company receives, and what the parent controls). PW-A and PW-C say where the photo is and both carry the backup clause, the part most likely to be misread. The NX-39 recommendation for the founder (F4, "PW-A for the first release; PW-D when P2a is on") is the product team's, not counsel's.

## Appendix B. The 63 COUNSEL-READ strings, by theme

Source: PR #752 words file, head d1ed0eb4ca4bc74c135216f40fc03fe7bc316d73. Keys carry the prefix `memoryLibrary.` in code (left off here). `{app}` is the public name. "COUNSEL-READ" means counsel and the founder read the exact words before they ship; it does not mean counsel wrote or approved them. The shared key `ask.never` appears twice in the words file and is counted once. Strings are proposals, none is live. Section numbers are the words file's.

**1. Picking and attaching a picture (words file 2.1; P0, P1)** (2)

| Key | Proposed words |
|---|---|
| `attach.firstAddNotice` | Add only pictures you have the right to keep in your book. |
| `note.line` | Photos are easier to find by their day. You can let {app} read their dates. |

**2. The library chooser sheet (2.2; P2a)** (4)

| Key | Proposed words |
|---|---|
| `ask.chooser.reads` | {app} shows your photos and videos with the date each was taken, so you can pick some to go with a letter. |
| `ask.never` | It never looks at what is in a photo or who is in it, and it never writes anything for you. |
| `ask.chooser.when` | It reads them while you are choosing. |
| `ask.chooser.where` | Photos you pick are copied into your book, on this phone and in your iPhone's own backup if you use one. The rest stay in your Photos app. |

**3. The Find days sheet (2.3; P2b)** (5)

| Key | Proposed words |
|---|---|
| `ask.days.reads` | {app} reads the date each photo and video was taken, so it can show you the days that have pictures. |
| `ask.days.when.open` | It reads when you open {app}. |
| `ask.days.when.background` | It reads when you open {app}. If you choose, it can also check while {app} is closed, when your iPhone allows. |
| `ask.days.where` | The list of days it makes is kept on this phone. {app} does not receive it. |
| `ask.days.where.alt` | The list of days it makes is kept on this phone. You can see it, turn it off and clear it in Settings. |

**4. After the iOS answer changes (2.4)** (1)

| Key | Proposed words |
|---|---|
| `access.changed.cleared` | The list was cleared because photo access changed. |

**5. The background top-up consent (2.5; P2c)** (4)

| Key | Proposed words |
|---|---|
| `bg.reads` | {app} can read the dates of your photos while it is closed. It reads the same thing as before and nothing more. |
| `bg.when` | Your iPhone decides when, and it may not check at all. Low Power Mode and Background App Refresh can stop it. |
| `bg.shows` | It never sends you a message about what it reads. |
| `bg.off` | You can turn this off in one tap, any time. |

**6. The ledger: master row and the Dates and Places switches (4.2)** (8)

| Key | Proposed words |
|---|---|
| `ledger.master.on` | On. {app} reads the dates of your photos when you open it. |
| `ledger.master.on.bg` | On. {app} reads the dates of your photos when you open it, and may also check while it is closed, if your iPhone allows. |
| `ledger.master.off` | Off. Nothing is read. |
| `ledger.dates.lets` | Lets {app} read the day each photo or video was taken. |
| `ledger.dates.doesNot` | Does not read what is in it. |
| `ledger.places.lets` | Lets {app} read the town a photo was taken in. The name comes from a list kept in the app. |
| `ledger.places.doesNot` | Never a street, and no exact spot is kept. |
| `ledger.places.shown` | A place shows only after you tap a day, never on a card. |

**7. When it checks (4.3)** (4)

| Key | Proposed words |
|---|---|
| `cadence.open.desc` | {app} reads the dates each time you open it. |
| `cadence.bg.desc` | {app} may also check while it is closed, when your iPhone allows. Your iPhone decides when, and it may not. |
| `cadence.status.bar.off` | Background App Refresh is off for {app}, so it checks only when you open it. |
| `cadence.status.lowPower.on` | Low Power Mode is on, so checks may pause until it ends. |

**8. What is kept and what is never done (4.4)** (5)

| Key | Proposed words |
|---|---|
| `ledger.onPhone.row` | A list of days that have photos, and the days you hid. |
| `ledger.never.1` | Never reads what is in a photo. |
| `ledger.never.2` | Never reads who is in it. |
| `ledger.never.4` | Never puts a photo, place or count in a reminder. |
| `ledger.never.5` | {app} does not receive the list. |

**9. Where it shows (5.3)** (2)

| Key | Proposed words |
|---|---|
| `surfaces.tonight.desc` | A date on Tonight, one at a time. No picture, place or count. |
| `surfaces.footer` | Nothing here sends you a message. |

**10. Hide, hidden choices, Forget, Erase everything (6.1 to 6.4)** (5)

| Key | Proposed words |
|---|---|
| `hide.stretch.help` | No card or shortcut will show these days. You can undo this in Hidden choices. |
| `hidden.clear.body` | Days and photos you hid may show on cards again. Your photos and letters are not touched. |
| `forget.row.desc` | Removes the list of days {app} made. Your photos, letters and hidden choices are not touched. |
| `forget.confirm.body` | {app} will remove its list of days and turn off Find days. Your photos, letters and hidden choices are not touched. |
| `erase.mediaLine` | This also clears the list of days made from your photos, your hidden choices and the reminder days you added. |

**11. Reminder days the parent types (7.1; P4a)** (5)

| Key | Proposed words |
|---|---|
| `occasions.intro` | Add the days you would like a reminder for, such as a birthday or an anniversary. {app} adds none for you. |
| `occasions.name.help` | The name stays in the app. The lock screen shows it only if you turn that on. |
| `occasions.lock.day.title` | Show the day's name on the lock screen |
| `occasions.lock.day.help` | Off, the reminder says nothing about the day. |
| `occasions.consent.line` | Days you add are kept on this phone. Reminders say nothing about your photos. |

**12. Local reminder text, fixed set (7.2; P4a)** (8)

| Key | Proposed words |
|---|---|
| `notif.occasion.title` | {app} |
| `notif.occasion.body.1` | A few words, whenever you like. |
| `notif.occasion.body.2` | Today is a day you chose. A few words about it? |
| `notif.occasion.body.3` | A day you chose is here. Add a letter if you like. |
| `notif.occasion.body.4` | A minute for a letter today? |
| `notif.occasion.withChild` | A few words for {child} today? |
| `notif.occasion.withDay` | {name} today. A few words about it? |
| `notif.occasion.withBoth` | {name} today. A few words for {child}? |

**13. Three pre-sheet variants for the comprehension study (14.1; study stimuli, not shipped as such)** (10)

| Key | Proposed words |
|---|---|
| `study.l1.plain.title` | Choose which photos {app} can see |
| `study.l1.plain.reads` | {app} reads the date of each photo and video you choose, so it can show you the days that have pictures. |
| `study.l1.plain.never` | It never looks at what is in a photo or who is in it. It never writes anything for you. |
| `study.l1.plain.whenWhere` | It reads when you open {app}. The list of days is kept on this phone, and you can clear it in Settings. |
| `study.l1.warm.title` | Which photos can {app} see? |
| `study.l1.warm.reads` | You pick which photos {app} can see, and you can change your mind any time. |
| `study.l1.warm.purpose` | It reads their dates, so a day with pictures is easy to find when you want to write a letter. |
| `study.l1.warm.never` | It never looks inside a photo, and the words are always yours. |
| `study.l1.minimal.title` | Find photos by their day? |
| `study.l1.minimal.reads` | {app} reads the dates of the photos you choose, and nothing inside them. |


## Appendix C. The four lines for each thing a person agrees to (PRIV-R21)

Source: NX-39 v2 section 8. "Shown" is what the person sees; "Records" is what we keep as the act; "Never" is what the record never holds; "Decline" is what happens when they say no.

| Layer | Shown | Records | Never | Decline and withdraw |
|---|---|---|---|---|
| `media_read` (P2a, P2b) | The pre-sheet, the Settings row, the permission string | Document, version, action (agreed or withdrawn only), method, surface, phone time, app version and build, OS major, platform, language, hash of the words shown, the access level iOS reports | Any date, place, count or id; the library contents | Not now holds; Off in one tap; Forget; export and erase still work |
| `media_background` (P2c) | The second sheet | The same fields, its own act | The same; a look reported to analytics beyond a content-free event; a notification | Row off in two taps; cancels requests; clears cursor and log; no data deleted by iOS turning Background App Refresh off alone |
| `occasions` (P4a) | The occasions row and what the reminder will say | The same fields, its own act | A named festival, a place, a photo, a count in a reminder | Per occasion off; master stop; Erase |
| First add of media the parent did not make (P1) | A one-line notice from the Terms right-to-add clause (Q83) | Version and time only | Any media fact | Cancel adds nothing |

## Changelog

| Version | Date | Change |
|---|---|---|
| 0.1.0 | 2026-11-10 | First draft. Cover note, Q78 to Q106 from the merged council brief CB-1 to CB-28, facts, attachments, UNVERIFIED list, Appendices A to C. `legal` agent, task BL-841. Not merged. |
