# Run sheet: Memory Library device spikes BL-843, BL-871, BL-872

Owner: QA lead (Claude role), for the founder, who runs it. Written 10 Nov 2026 (UTC). Status: DRAFT. Docs only: nothing in this file has been run on a phone, no build exists, and building one needs the founder's explicit go (section 9).

Folder: run sheets live in `docs/qa/run-sheets/` (see its `README.md`) and results in `docs/qa/evidence/`; the backlog rows say findings go in `docs/qa/`. This file is therefore here and not in `docs/release/`.

Read against NX-39 v2 (`docs/roadmap/next/03-requirements/NX-39-memory-library.md`, PR #747, branch `docs/nx-39-memory-library-10nov`, head `4f5153d5b7b12d362c622b97a9fe2e613723059f` when read; the branch has since moved to `47908c1b8ba67f684fbd60abbf7e7b57fabb6004`, which changes none of the BL-843, BL-871 or BL-872 rows), the architecture critique (CAIO-1, CAIO-2, CAIO-12) and the CISO critique (SEC-ML-1, -5, -10, -11), and `docs/qa/run-sheets/README.md`.

Tags used below: [E] estimate. UNVERIFIED means nobody on this team has read Apple's page or run it on a phone; section 11 lists every one. Everything about how iOS behaves in this sheet is a question to be answered by the run, not a fact.

## 1. Rules for the whole sheet

1. **No real data in anything you write down.** Results use only the item labels T1 to T10 and N1 to N3, the place labels P1 to P4, the phone labels A, B, C, yes or no, seconds and small whole numbers. No photo, file name, album name, place name or coordinate, no real date of a real photo, no child's name, no Apple Account name, no device id. The fictional family is Asha; the test pictures show a plain object, never a person, never the child, never your home.
2. **Test photos only.** You make or receive the test items in section 4. You never pick a real photo in this sheet. The single exception is T10 (iCloud-only) and it is your choice, with a default of "do not" (step 4.5).
3. **The spike app is not the letters app.** It has its own name on screen, "SPIKE - NOT THE LETTERS APP", and its own bundle id, so it never sees the family book. Do not sign in to anything in it. Do not install it from TestFlight (it will never be there).
4. **The spike app shows only yes or no** (plus seconds, and in BL-872 whole-number counts). If it ever shows a date, a place, a name or a picture of a photo, stop, write "harness shows content" in the notes and tell the engineer. Screenshots are never committed (`docs/qa/evidence/README.md`); if you take one for yourself, keep it off the repo.
5. **Do each pick once.** If the result is not what the "Hoped for" column says, do it again twice. Two of three the same decides; three different is "unstable" and the item is INCONCLUSIVE.
6. **Stop** (write it down, ask for help) if: an iOS box asks for your location or photos where this sheet says none should appear and you did not tap a button that asks for it; the spike app crashes twice in a row; the app shows content (rule 4).
7. Time is local. Estimates are [E].

## 2. What each spike decides

| Spike | One question | What it unlocks or closes | If it fails |
|---|---|---|---|
| BL-843 | When a parent chooses a photo in the system picker, with no permission asked, does the app get the day it was taken and the place, on the SDK 57 `expo-image-picker` path and on the direct PHPicker path, for a Live Photo, an edited photo, an iCloud-only photo, a screenshot, a shared-album photo and an AirDropped photo? Also from Limited, and can the parent drop the place in the picker? | The P1 gate (NX-39 section 3): "Taken {date}" line (R5), the city name (R6, R7 with BL-844), the PW-A promise "when it was taken", R2 (0 permission questions), R12, R13, CAIO-12 (asset identifier). Closes UNVERIFIED 15 | No date: P1 ships without "From the photo" lines and PW-A loses "when it was taken". No place: date only. A prompt appears: R2 fails and P1 stops |
| BL-871 | Under Limited photo access, are photos and videos taken after the selection visible to the app, and what happens when the selection changes? Do `creationDate` and `location` come back under Limited? | The P2b gate and, with BL-872, the P2c gate. Decides the Limited copy under R11: whether a Limited parent may be told new photos appear, or P2b is Full access only. Closes UNVERIFIED 4, 5, 14 in part | New items not visible: the P2b Limited copy says so plainly, or P2b is Full only |
| BL-872 | On the founder's own phones, over 14 days, how often does a background app-refresh task actually run (with Low Power Mode, Background App Refresh off, force quit, locked, charging)? Can a locked-phone run read? | The P2c gate and the F11 decision (reverse "never read in the background", S6, LEGAL-REQ-011). Satisfies the evidence side of R44 and R46 | Too few runs: F11 stays "no background read"; P2c is not built |

BL-844 (city key from a bundled table) is not a device spike and needs no founder hours. This sheet does not test it. It only tests whether a place reaches the app at all.

## 3. Phones, iOS versions, hours

### 3.1 Phones

| Label | Phone | iOS | Used for |
|---|---|---|---|
| Phone A | The current iPhone, on the newest iOS (DEVICE_TEST_PLAN says 27 at the time of writing; UNVERIFIED here) | Write the exact version | BL-843 full set, BL-871 full set, BL-872 "normal use" |
| Phone B | iPhone SE (3rd generation), on its latest iOS | Write the exact version | BL-843 short set, BL-871 short set, BL-872 "Low Power Mode" |
| Phone C | Any third iPhone: your spare, or a consenting adult's phone with no child's photos selected. If it runs the lowest iOS you can find (the app's floor is iOS 17.0, `IOS_DEPLOYMENT_TARGET`; Q-002 is open), better | Write the exact version | BL-872 "Background App Refresh off"; BL-843 and BL-871 if it is on a different iOS version from A and B |

Coverage rule: BL-843 and BL-871 need at least two different iOS versions (major, or minor if that is all you have). If you only have one, the verdict reads "on iOS N only" and the P1 and P2b gates stay open for other versions. Do not update a phone for this. Whether you own three phones, and which iOS each runs, is UNVERIFIED (BL-872 says "three phones").

The spike app is a separate app, so these are not "drill phones" in the sense of `README.md` rule 2 (that rule protects the family book in the letters app). Even so, read the Photos rows: test photos go into the real Camera Roll of the phone. Step 10.3 removes them.

### 3.2 Founder hours

| Block | Minutes [E] | Notes |
|---|---|---|
| Prep: register phones with Apple if not done, install the spike app on A, B, C, first launch | 60 | Registration (about 5 each) is needed only for phones not yet registered; UNVERIFIED which are |
| Test kit: make T1 to T10, N pack files, album, shared album, Phone C items | 50 | Section 4 |
| BL-843 | 120 | Phone A 85 (both paths, Never-asked and Limited), Phone B 35 |
| BL-871 | 115 | Phone A 75 (includes two later check-ins), Phone B 40 |
| BL-872, spread over 14 days | 142 | 3 min a day for 14 days (42), Low Power Mode re-enabling on Phone B (10), the force-quit and no-open days on A (10), readouts on days 7 and 14 (60), wrap-up (20) |
| Write-up into the evidence file | 30 | |
| **Total** | **517 (8 h 37 min), call it 8 h 40 min** | About 5 h 55 min is hands-on across two sittings on days 0 and 1; the other 2 h 22 min is 14 days of short pieces |

Calendar span: day 0 (prep, BL-843, BL-871 start), day 1 (BL-871 check-in, BL-872 starts that evening), day 15 (BL-872 ends the morning after the 14th evening). Sixteen calendar days.

## 4. The test kit (make it once, on Phone A; copy to B and C)

Item labels: T1 to T10 for BL-843, N1 to N3 for BL-871. Each Camera item shows a sticky note with its label in front of a plain object (a mug on a table), so you can tell items apart in the picker by their thumbnails. No people. No child. No readable text but the label.

Fictional place list (public landmarks, chosen to be nowhere in your life; swap any that mean something to you, and tell nobody which): **P1** Eiffel Tower, **P2** Sydney Opera House, **P3** Table Mountain, **P4** Tokyo Tower. Never write the names or coordinates in the results, only P1 to P4. Avoid any place of worship, hospital, home or business.

4.1 Open Photos, make an album called "Spike Test". Make a shared album called "Spike Shared" with no one invited. (Both are deleted in step 10.3.)

4.2 Take these with the Camera app. Put each in "Spike Test".

| Label | What | Hoped for |
|---|---|---|
| T1 | Plain photo, Camera location on (Settings > Privacy & Security > Location Services > Camera > While Using) | Date yes, place yes |
| T2 | Plain photo with the Camera's location set to Never (change it, take the photo, change it back) | Date yes, place no |
| T3 | Live Photo (Live on, hold still 3 seconds) | Date yes, place yes, a still arrives |
| T4 | Plain photo, then in Photos tap Edit, crop it, apply a filter, Done | Date yes, place yes |
| T5 | Plain photo, then in Photos open the Info panel and use Adjust on the date (set 3 March 2019) and on the location (search for P1) | Date 2019 if Photos' own date counts, place yes. This row decides; it may not be so |
| T9 | Screenshot of a new empty Notes page with only "T9" typed. Put the screenshot in the album, delete the note | Date yes, place no |

4.3 **T8, shared album.** Take a plain photo with the label T8, add it to "Spike Shared" (Share > Add to Shared Album). Hoped for: date yes, place yes.

4.4 **T6 and T7, received by AirDrop.**
- T6: the engineer gives you one synthetic picture file, made on a Mac, whose embedded date is in 2002 and place is P4 and which shows the text "T6". Preparing it needs no build (UNVERIFIED: it needs a Mac tool that edits picture metadata; the engineer chooses). AirDrop it from the Mac to Phone A. Hoped for: date 2002 yes, place yes.
- T7: take a plain photo labelled T7 on Phone B and AirDrop it to Phone A. Hoped for: date yes, place yes.
- Two more synthetic files for BL-871: **N3**, embedded date in 2001, place P2, text "N3". Do not AirDrop N3 yet.
- Put T6 and T7 in "Spike Test" after they arrive.

4.5 **T10, iCloud-only.** You need a photo whose full-size original is not on the phone.
- Try this first: iCloud Photos and Optimize iPhone Storage on for both phones (Settings > your name > iCloud > Photos). Take a plain photo labelled T10 on Phone B, wait until Photos shows it is up to date, then look for it on Phone A. Check that it is iCloud-only: put Phone A in airplane mode, open T10 in Photos at full size. If it will not open sharply and shows a download spinner or a blurry picture, it is iCloud-only. If it opens sharply, it is not (iOS decides what to keep; you cannot force it). Turn airplane mode off. Whether this check is reliable is UNVERIFIED.
- If you cannot get a verified iCloud-only test item: mark T10 "not made" and its rows INCONCLUSIVE. Do not use a real photo. If you decide yourself to use one old photo with no person in it, you may, say only yes or no in the table, and write "real item, founder choice" in the notes; this is not recommended and not the default.

4.6 **Phone C.** AirDrop T1, T6 and one more plain photo from Phone A to Phone C; these are its three "selected" test photos for BL-872.

4.7 **A note on dates.** The harness checks the *embedded* capture date (the one inside the file), never the date the file was copied. Photos' own "Adjust date" (T5) edits Photos' database, and whether that reaches the file the app gets is one of the things this sheet finds out.

## 5. Spike BL-843: what the picked file carries

Time: about 85 min on Phone A, 35 min on Phone B [E]. Builds: the spike app (section 9). States: **Never asked** first (the app has never requested Photos access), then **Limited** after BL-871 step 6.2 has set it.

### 5.1 The pick routine (used by every row)

1. Open the spike app > Picker test. Choose Path A (the `expo-image-picker` path on SDK 57) or Path B (the PHPicker path).
2. Type the year in the box the row gives you ("this year" means the current year).
3. Tap Pick one photo. **Watch for any iOS box that asks to use your Photos or your Location before the picker opens or while it is open. Write yes or no in column P.** (The picker's own "Select" and "Cancel" are not a prompt.)
4. In the picker open the album named in the row, tap the item, tap Add or Done.
5. The app shows a list of yes or no rows and a number of seconds. Copy them into the table.

Result rows the harness shows: **F** a file arrived; **D** the embedded capture date is present; **Y** that date's year equals the year you typed; **L** an embedded place is present; **I** an asset identifier came back; **M** a second, movie part came back (Live Photo only). It shows no value.

### 5.2 Never asked, Phone A and B (rows ML-843.1 to ML-843.24)

Run each item on Path A and Path B. Phone B: do T1, T3, T5, T6, T9 only (rows marked B).

| Row | Item (album) | Year to type | Path | P | F | D | Y | L | I | M | Seconds | Hoped for |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| ML-843.1 | T1 (Spike Test) | this year | A | | | | | | | | | P no, D yes, Y yes, L yes |
| ML-843.2 | T1 | this year | B | | | | | | | | | same |
| ML-843.3 | T2 | this year | A | | | | | | | | | P no, D yes, Y yes, L no |
| ML-843.4 | T2 | this year | B | | | | | | | | | same |
| ML-843.5 | T3 Live Photo | this year | A | | | | | | | | | D yes, L yes, F yes |
| ML-843.6 | T3 | this year | B | | | | | | | | | same |
| ML-843.7 | T4 edited | this year | A | | | | | | | | | D yes, L yes |
| ML-843.8 | T4 | this year | B | | | | | | | | | same |
| ML-843.9 | T5 adjusted | 2019 | A | | | | | | | | | open question, record |
| ML-843.10 | T5 | 2019 | B | | | | | | | | | open question, record |
| ML-843.11 | T6 AirDrop from Mac | 2002 | A | | | | | | | | | D yes, Y yes, L yes |
| ML-843.12 | T6 | 2002 | B | | | | | | | | | same |
| ML-843.13 | T7 AirDrop from Phone B | this year | A | | | | | | | | | D yes, L yes |
| ML-843.14 | T7 | this year | B | | | | | | | | | same |
| ML-843.15 | T8 (Spike Shared) | this year | A | | | | | | | | | D yes, L yes |
| ML-843.16 | T8 | this year | B | | | | | | | | | same |
| ML-843.17 | T9 screenshot | this year | A | | | | | | | | | D yes, L no |
| ML-843.18 | T9 | this year | B | | | | | | | | | same |
| ML-843.19 | T10 iCloud-only, Wi-Fi on | this year | A | | | | | | | | | D yes, L yes after download |
| ML-843.20 | T10 | this year | B | | | | | | | | | same |
| ML-843.21 | T10, airplane mode on | this year | A | | | | | | | | | the pick fails cleanly; no file; no crash |
| ML-843.22 | T10, tap Cancel while it downloads (use Wi-Fi, tap Cancel in the picker at once) | this year | A | | | | | | | | | F no |

For ML-843.19 to .22 also write: did the picker show its own progress (yes or no) and how many seconds until the app got the file. Rows .5 and .6: write in the notes whether the app got a still only or a still and a movie (column M).

Hoped for for column I is not set: record yes or no. CAIO-12 asks whether the asset identifier comes back with no permission. Path B uses the configuration that is supposed to return it (UNVERIFIED, section 11).

### 5.3 The location switch in the picker (ML-843.23, .24)

| Row | Do | Write down |
|---|---|---|
| ML-843.23 | Pick T1 on Path A. In the picker, look for an "Options" button (UNVERIFIED that it exists on your iOS). If it is there, tap it and write the labels of the switches (Apple's own words, not yours). | Options exists: yes or no. A location switch exists: yes or no. Where it sits (before or after choosing the item) |
| ML-843.24 | With the location switch off (if it exists), pick T1 on Path A, then on Path B. | L is no on both: yes or no. D still yes: yes or no. Did the app show an error: yes or no |

### 5.4 Limited state (rows ML-843.25 to ML-843.34, after BL-871 step 6.2)

The app is now Limited with three test photos selected: **T1, T5 and T6**. The picker is a separate system screen and should work the same for items inside and outside the selection. That is the claim.

| Row | Item | Inside or outside the selection | Path | P | F | D | Y | L | I | Hoped for |
|---|---|---|---|---|---|---|---|---|---|---|
| ML-843.25 | T1 | inside | A | | | | | | | same as ML-843.1 |
| ML-843.26 | T1 | inside | B | | | | | | | same |
| ML-843.27 | T3 | outside | A | | | | | | | same as ML-843.5 |
| ML-843.28 | T3 | outside | B | | | | | | | same |
| ML-843.29 | T4 | outside | A | | | | | | | same as ML-843.7 |
| ML-843.30 | T4 | outside | B | | | | | | | same |
| ML-843.31 | T6 | inside | A | | | | | | | same as ML-843.11 |
| ML-843.32 | T6 | inside | B | | | | | | | same |
| ML-843.33 | T10 | outside | A | | | | | | | same as ML-843.19 |
| ML-843.34 | T8 | outside | A | | | | | | | same as ML-843.15 |

Write also whether the iOS Limited-access box appeared when the picker opened (UNVERIFIED item 5); the harness keeps the automatic box off, so none should (CAIO-8).

### 5.5 Pass, fail, inconclusive for BL-843

Per iOS version tested, per phone. All of this is about the *shipping path* A unless a rule says B.

| Verdict id | Rule | Result and what it opens |
|---|---|---|
| V843-PROMPT | PASS: P is no in every row of 5.2 and 5.4, on both paths. FAIL: any prompt in a Never-asked row | FAIL stops P1 (R2 fails). Tell `mobile` and `security-architect` the same day |
| V843-DATE | PASS: on Path A, D and Y are yes for T1, T3, T4 and T6, in Never asked and in Limited, on every tested phone. PASS WITH LIMITS: the same, but a "no" for T5, T7, T8, T9 or T10; list each "no" as a known gap (R5: no date shows no line and no error; PW-A needs "when it was taken" only where a date exists) | PASS or PASS WITH LIMITS opens the P1 date line. FAIL: D is no for T1 on Path A: P1 has no date line; PW-A drops "when it was taken" |
| V843-PATH-B | If V843-DATE FAILS on Path A but passes on Path B | Report to `mobile`, `security-architect` (SEC-ML-11, a new native module) and `product`: P1 needs a native picker module. Neither pass nor fail for the product; the P1 gate stays shut until that decision |
| V843-PLACE | PASS: on the same path that passed V843-DATE, L is yes for T1, T3, T4 and T6, and L is no for T2 and T9. FAIL: L is yes for T2 or T9 (a place that should not exist; the metadata cannot be trusted), or L is no for T1 | PASS (with BL-844 passing) opens the city name in P1. FAIL or NO: date only; the picker "drop location" behaviour is still reported |
| V843-LOC-SWITCH | Informational: with the switch off, L must be no and D must stay yes and no error shows | A "yes" for L with the switch off is a FAIL and a privacy finding: tell `security-architect` |
| V843-LIVE (R12) | PASS: T3 delivers a still with D yes on Path A. The movie part may or may not arrive | The label never says video or live regardless |
| V843-ICLOUD (R13) | PASS: ML-843.19 delivers D yes after the picker's own download, ML-843.21 fails cleanly with no file, ML-843.22 leaves no file. INCONCLUSIVE: no verified iCloud-only item (step 4.5) | |
| V843-ID | Informational, not a P1 gate: I yes or no on each path with no permission | Feeds CAIO-12 and the de-duplication design in P2 |
| INCONCLUSIVE | Any row blank; any item "unstable" (rule 5); the app crashed or showed content; only one iOS version tested (then the verdict says "on iOS N only") | Not a pass. Repeat after the cause is fixed |

## 6. Spike BL-871: new photos under Limited

Time: about 75 min on Phone A, 40 min on Phone B [E], plus two short check-ins (10 min later, and the next morning). Run on the same spike app, directly after Section 5.2 (BL-843 Never-asked rows), before 5.4. State at the start: Never asked.

### 6.1 Harness rows for this spike

The Photos screen shows yes or no for: **V3** the number of assets the app can see equals the number you typed; **VP** an asset created in the last 2 hours as a photo is visible; **VV** an asset created in the last 2 hours as a video is visible; **V01** an asset whose creation date is in 2001 is visible; **CD** every visible asset has a creation date; **LC** the visible asset with the year 2019 (T5) has a location; **OB** the change observer has fired since the last reset; **TK** a change token or persistent-change query worked (if the module exposes it; UNVERIFIED). It shows no count and no value.

### 6.2 Steps (rows ML-871.1 to ML-871.20)

| Row | Do | Write down |
|---|---|---|
| ML-871.1 | Spike app > Photos screen > Ask for photos. When the iOS box appears, **write the words on its buttons and the order of its lines** (Apple's text, not private; this closes UNVERIFIED 5). Choose Select Photos (the Limited choice). In the sheet pick exactly T1, T5 and T6, tap Done | The button labels; whether iOS offered anything else; seconds from tap to the app saying "Limited" |
| ML-871.2 | Type 3 in the number box. Tap Look now | V3, CD, LC (should be yes, yes, yes if Limited sees T1, T5, T6 and their dates and place) |
| ML-871.3 | Run the Path A and Path B rows of 5.4 now (ML-843.25 to .34) before going on, then return here | Done: yes or no |
| ML-871.4 | Leave the spike app open in the background. Open Camera, take N1 (a plain photo with the label N1). Return to the spike app. Tap Look now with 3 typed | VP, VV, V3 (V3 = yes means N1 is not counted) |
| ML-871.5 | Camera > Video: record 10 seconds of the plain object, label N2 on the sticky note. Return to the app, tap Look now | VP, VV, V3 |
| ML-871.6 | Look now again with 4 typed, then with 5 typed | V3 each time. If 4 or 5 matches, new items are visible |
| ML-871.7 | AirDrop N3 (2001, P2) from the Mac to Phone A. Accept it. Return, Look now | V01, V3 with 3 typed and with 4 typed |
| ML-871.8 | Force quit the spike app (swipe it away). Wait 10 minutes. Reopen. Look now | VP, VV, V01, V3 (this is the 10-minute check-in) |
| ML-871.9 | Tap Change the selection (this calls the app's own selection sheet). Add N1. Done. Type 4. Look now | V3, OB (stays on screen), seconds until the app noticed |
| ML-871.10 | Tap Reset watcher. Change the selection again: remove T6. Done. Type 3. Look now | V3, OB, TK |
| ML-871.11 | Leave the app (Home), do not force quit. iPhone Settings > the spike app > Photos > Edit Selected Photos: add T6 back. Return to the spike app, wait 5 seconds | OB without tapping Look now; then Look now with 4 typed: V3 |
| ML-871.12 | Same as .11, but force quit the spike app first, change the selection in Settings, reopen | OB (expect no, the app was not running); V3 with the new number: does the app see the new selection on open |
| ML-871.13 | Take N1b (another plain photo) tonight, after the selection is final. Do not open the spike app again until tomorrow morning | Nothing now |
| ML-871.14 | Next morning (the day-after check-in): open the spike app, Look now with the number you expect if new items stay hidden, then with the number if they show | VP (for N1b if within 2 hours is not possible; use "created since yesterday" if the harness has it), V3 |
| ML-871.15 | **Control.** On the phone with no real library (or your call, see below), iOS Settings > the spike app > Photos > All Photos. Open the spike app, Look now | VP, VV, V01 should now be yes. If they are not, the harness is wrong, not iOS: INCONCLUSIVE, tell the engineer |
| ML-871.16 | Set it back to Selected Photos (Limited). Check V3 shows 3 again with T1, T5, T6 re-selected | V3 |
| ML-871.17 | On Phone B repeat ML-871.1, .2, .4, .5, .7, .9, .10, .15, .16 | Same columns, "Phone B" |
| ML-871.18 | Under Limited, T5 selected: CD and LC | CD yes or no; LC yes or no (this is "PHAsset creationDate and location under Limited") |
| ML-871.19 | Select T10 (iCloud-only, if made) in the Limited selection, then Look now | CD, LC for an iCloud-only asset; does reading fail or wait (seconds) |
| ML-871.20 | Write the iOS versions of Phones A and B | |

The control (ML-871.15) gives the app All Photos access. It only ever shows yes or no, but it is access to your whole library. Do it on a phone with no real library if you have one. On a phone with a real library, that is your decision; if you decline, every "not visible" answer is INCONCLUSIVE because there is nothing to show the harness can see new items at all.

### 6.3 Pass, fail, inconclusive for BL-871

| Verdict id | Rule | What it means |
|---|---|---|
| V871-NEW | VISIBLE: on Phone A and Phone B, and the control (ML-871.15) shows yes, N1 (VP) and N2 (VV) are visible under Limited, after both the switch of app and the 10-minute and next-morning check-ins. NOT VISIBLE: they are not visible on both phones and the control shows yes. MIXED: the phones, iOS versions or photo and video disagree. INCONCLUSIVE: the control is no or blank, or an item is "unstable" | NOT VISIBLE or MIXED: the P2b Limited copy says plainly that looking is over the chosen photos only, or P2b is Full access only (founder and CPO, with counsel). VISIBLE: P2b Limited may be considered, with copy that still waits for counsel (CB-28 and R11 are untouched). INCONCLUSIVE keeps R11's rule: no Limited copy promises new photos |
| V871-OLD | AirDropped old-dated item (V01): VISIBLE or NOT VISIBLE on the same terms | Decides whether a catch-up that compares added date with last-looked date is needed (CAIO-1) |
| V871-OBS | Selection change: OBSERVED (OB yes within 5 seconds) in the foreground (rows .9, .10) and after returning from Settings (row .11); NOT OBSERVED if no | Input to R11 and R42 (narrowing clears the index): if the observer does not fire, the clear must happen by comparing on open |
| V871-DATE | Under Limited, CD and LC are yes for the selected test items | PRESENT: the P2a/P2b read can use the date and place. ABSENT: report; it changes R5, R6 for P2 |
| V871-ICLOUD | Row .19 | Informational |

## 7. Spike BL-872: how often iOS runs a background look

Time: 14 days, about 2 h 22 min of your time in pieces [E]. Three phones. The spike app has a Background screen (section 9). Day 1 is the evening you tap Start the 14 days on each phone, which clears the earlier spike state.

### 7.1 What the app records, and nothing else

For each background launch and each foreground open it keeps, in a private file on the phone that no other app, backup or network can read: the time (to the minute) and a few yes-or-no flags: phone locked at that moment; charging; Low Power Mode on; Background App Refresh status (on, off, restricted); and, for a background launch, whether it could read one asset (yes or no). It shows, per day, how many background launches and foreground opens happened. It never writes this to a log, a console, a crash report, the clipboard, the share sheet or the network (section 9).

### 7.2 The pass bar, written before day 1

These numbers are my proposal as QA lead; the Chief Product Officer and the architect review them and the founder agrees before day 1. **A bar changed after day 1 voids the verdict**; write the date it was agreed here before starting: ______ (blank: not agreed yet). The bar uses only the "normal use" days.

- **Counted days:** days 3 to 14 on Phone A, excluding the force-quit day, the day after it, and the two no-open days (7.3). Days 1 and 2 are listed but not counted, because iOS may need time to learn when the app is used (UNVERIFIED).
- **SUPPORTS a best-effort top-up** (this alone does not approve P2c; the counsel ruling, the founder's recorded F11 ruling and the study pass line are still needed): median background launches per counted day is 1 or more, and the share of counted days with zero launches is 30 percent or less.
- **DOES NOT SUPPORT:** median is under 0.5, or the share of zero days is over 60 percent.
- **INCONCLUSIVE:** anything between, or fewer than 8 counted days, or the app was reinstalled, force quit by mistake, or the phone was off for a day, or the data was lost.
- The request asks iOS for the earliest start of 12 hours, as the plan would (CAIO section 3, UNVERIFIED; it caps a possible day at about 2).
- Low Power Mode (Phone B) and Background App Refresh off (Phone C) are *reported*, not scored. The expectation from the pages the team read is zero launches with Background App Refresh off and while Low Power Mode is on. **Any launch with Background App Refresh off is a harness fault or a surprise: write it and tell the engineer the same day.**
- **Locked-phone read (R46):** among background launches where "locked" is yes: WORKS if at least 5 such launches happened and at least 80 percent could read; FAILS CLEANLY if they happened and none read and no error showed; INCONCLUSIVE if fewer than 5. R46 accepts "works or ends with no error"; this only decides what the copy may say.
- **Charging:** report the share of launches that happened while charging. No pass or fail.
- **Force quit:** after the force quit on Phone A, launches on the next full day with no manual open should be zero (Apple forum statement, UNVERIFIED, two statements disagree). Report the count.
- Only 3 phones and 14 days: the result is a rough picture of one household's phones, never a promise. No copy, store text or website line may state a frequency whatever it shows (R44).

### 7.3 The 14-day plan

| Days | Phone A (normal) | Phone B (Low Power Mode on most days) | Phone C (Background App Refresh off for the spike app) |
|---|---|---|---|
| 1 to 10 | Normal use, charge overnight. Open the spike app once each evening for 10 seconds, then leave it (do not force quit) | Low Power Mode on all day (Settings > Battery). It switches itself off when charging reaches 80 percent, so check it every morning and evening and switch it on again. Open the app once each evening | iPhone Settings > General > Background App Refresh: leave the global switch on, switch the spike app's row **off**. Open the app once each evening |
| Day 4 night | Force quit the app (swipe it up in the app switcher) last thing at night | | |
| Day 5 | Do **not** open the app all day | | |
| Day 6 | Open once in the evening as usual | | |
| Days 7 and 8 | Do **not** open the app on either day (no force quit) | | |
| Day 9 | Open once in the evening | | |
| Days 11 to 14 | Normal | Low Power Mode off; normal use | Switch the app's Background App Refresh row **on**; normal use |

Every phone: do not turn the phone off for the 14 days, keep iOS updates off until day 15, keep the same Wi-Fi and the same Focus habits, keep the phone charging at night where you usually do. Note a restart or an iOS update if one happens anyway.

### 7.4 Daily record (rows ML-872.1 to ML-872.14)

Each evening, after opening the app, write the numbers it shows for *today* (and read yesterday's final number in the morning if you forgot). Whole numbers only.

| Day | Date (day number only) | A: bg launches | A: opens | B: bg launches | B: opens | C: bg launches | C: opens | Notes (LPM on, force quit, not opened, restart) |
|---|---|---|---|---|---|---|---|---|
| 1 | | | | | | | | |
| 2 | | | | | | | | |
| 3 | | | | | | | | |
| 4 | | | | | | | | |
| 5 | | | | | | | | |
| 6 | | | | | | | | |
| 7 | | | | | | | | |
| 8 | | | | | | | | |
| 9 | | | | | | | | |
| 10 | | | | | | | | |
| 11 | | | | | | | | |
| 12 | | | | | | | | |
| 13 | | | | | | | | |
| 14 | | | | | | | | |

On days 7 and 14, also copy the app's summary: median launches a day, days with zero launches, launches while locked, launches while locked that could read, launches while charging, launches while Low Power Mode was on, launches while Background App Refresh was off. On day 14 write the iOS versions and models of A, B, C.

### 7.5 Verdict rows

| Row | Result |
|---|---|
| ML-872.15 | Phone A, normal days: median, share of zero days, verdict (SUPPORTS, DOES NOT SUPPORT, INCONCLUSIVE) |
| ML-872.16 | Phone B, Low Power Mode days: median, zero days (report) |
| ML-872.17 | Phone C, Background App Refresh off days: median, zero days (report; surprise if over 0) |
| ML-872.18 | Phone B and C after the switch on days 11 to 14: median, zero days (report) |
| ML-872.19 | Locked-phone read: counts and WORKS, FAILS CLEANLY or INCONCLUSIVE |
| ML-872.20 | Force quit day and following days: launches |
| ML-872.21 | Share of launches while charging |

## 8. Writing down: what may and may not be in the evidence file

File: `docs/qa/evidence/<YYYY-MM-DD>-spike-memlib-<tag>.md`, copied from `docs/qa/evidence/TEMPLATE.md` (one per phone; the spike has no build number, so write the commit of the spike branch and "spike build"). The template and `docs/qa/evidence/README.md` rules apply on top of these.

**May be written:** row ids; item labels T1 to T10, N1 to N3; place labels P1 to P4; phone labels A, B, C; yes, no, unstable, not made; seconds; whole numbers of launches; iOS versions and model names (iPhone SE (3rd generation), iPhone 15, and so on); the words on Apple's own buttons; verdicts.

**Never written:** a photo, a file name, an album name, a place name or coordinate, a date of a real photo, any date other than the planned years 2001, 2002, 2019 and "this year", a child's name, a family member's name, an Apple Account, an email address, a device id (UDID, serial), an asset identifier value, a screenshot name that describes content, the text of any real note. Wherever a name is needed, Asha is the only one.

Any failing row gets a GitHub issue labelled `beta` and a severity, per the evidence README; the issue holds the row id and yes or no, nothing else.

## 9. The minimum throwaway test harness (NOT BUILT, NOT STARTED)

**Building this is a build. It needs the founder's explicit go, in writing, before an engineer starts.** This section is a specification for that engineer. I wrote no code and ran no build.

### 9.1 Boundaries

| # | Requirement |
|---|---|
| H1 | A separate, spike-only app on a branch named `exp/memlib-spikes` (CLAUDE.md branch rule). It is never opened as a pull request into `develop`; only the findings come back, as documents. The findings, not the code, are merged. |
| H2 | It lives outside the npm workspaces (`apps/*`, `packages/*`, `experiments`), so `npm test` and `npm run typecheck` neither run nor depend on it, and `apps/mobile/package.json`, `apps/mobile/app.config.ts` and the product's `eas.json` are not edited. `expo-image-picker` and `expo-media-library` are not in `apps/mobile/package.json` on `develop` (checked at `16df0f5f2`), so BL-871's "no new install if the existing dev client has the media module" does not hold: the spike needs its own native build. |
| H3 | Its own bundle id and display name ("SPIKE - NOT THE LETTERS APP"), not `com.earlyletters.scribe`, not `.dev`, not `.preview`. Registering a new bundle id is an Apple Developer step for the founder (UNVERIFIED). |
| H4 | Internal ad hoc distribution to the registered phones only. Never TestFlight, never App Store Connect, never the EAS `production` or `testflight` profiles. Because it declares a background mode, `apps/mobile/scripts/preflight-testflight.mjs` (which fails any `UIBackgroundModes`) would reject it, and it must stay that way; the spike never runs that script and the script is not edited. |
| H5 | Reads no product config. No `EXPO_PUBLIC_*` variable of the product, no Supabase URL or key, no Sentry or other crash SDK, no analytics package, no `packages/brand` import (the public name stays out of the spike). |
| H6 | No network at all: no `fetch`, no `URLSession`, no web view. The built plist shows no `NSLocation*` key, no app group, no extension target (SEC-ML-10). |
| H7 | Output is yes or no on screen, plus seconds, and in the Background screen whole numbers of launches and opens. Nothing is written to `console`, `NSLog`, `os_log`, `print`, a file, the clipboard, the share sheet or the pasteboard. Errors cross the bridge as closed codes only (SEC-ML-5), shown as a code on screen. Results for the picker and Photos screens are held in memory and cleared when the app closes. |
| H8 | It never shows a picked picture, a date, a coordinate, a place name or an identifier. It reads the embedded metadata, tests presence (and equality with the typed year), and discards. Picked bytes are deleted straight after the check (SEC-ML-13). |
| H9 | A "Delete all spike data" button, and the Background screen's file is excluded from backup. |
| H10 | A small Node script of the spike's own (not part of `npm test`) that inspects the built plist and fails if the bundle id is not the spike id, if any `NSLocation*` key or app group exists, or if any network library or analytics package is in the dependency list. |

### 9.2 Screens and what each does

| Screen | Does | Needed by |
|---|---|---|
| Picker test, Path A | Opens the SDK 57 `expo-image-picker` picker in its default photo-only mode, requesting the embedded metadata and asset identifier the library offers, at the original (not transcoded) quality if the module has that option; shows F, D, Y, L, I, M and seconds. If the module offers a "compatible" versus "current" representation setting, the screen has a switch to repeat any row on both (UNVERIFIED that the option exists on SDK 57). | BL-843 |
| Picker test, Path B | Opens PHPicker directly, configured with the shared photo library so an asset identifier can come back, with no authorization call; reads the picked file's embedded metadata with the system image-metadata reader; same output rows. A few lines of native code, in a throwaway local module. | BL-843 |
| Photos | Requests read-write authorization only when you tap Ask for photos; keeps the system's automatic Limited box off (`PHPhotoLibraryPreventAutomaticLimitedAccessAlert`, CAIO-8) and offers its own Change the selection button (`presentLimitedLibraryPicker`); fetches assets and shows V3, VP, VV, V01, CD, LC; registers a change observer and shows OB; shows TK if a persistent-change query is available; has Reset watcher; takes a typed expected number and typed expected year. | BL-871 and the Limited rows of BL-843 |
| Background | Registers one app-refresh request (`BGAppRefreshTaskRequest`, which is what BL-872 names), with the earliest start of 12 hours, reschedules at each launch and each foreground, finishes in a few seconds. Declares the minimum plist the system needs for it (the `fetch` background mode and a permitted task identifier; UNVERIFIED which mode Apple requires, and CAIO and CISO disagree with Expo's text on `processing`). On each launch it records the flags in 7.1 and whether it could read one asset, never which. Per-day table. Start the 14 days; Delete all spike data. | BL-872 |

### 9.3 Decisions the engineer must take to the founder before building

1. **App refresh or processing.** If the product would use `expo-background-task`, and that package is a processing request (UNVERIFIED, NX-39 section 14 item 2), then measuring only app refresh answers a different question. Minimum: app refresh only, because BL-872 says so. Option: add one processing request with "requires external power" so the same 14 days also answer "overnight while charging". Founder and `mobile` choose.
2. **Counts on screen.** The brief for this spike is "boolean field-presence only". The Background screen needs whole numbers of launches per day to answer its own question, and the Photos screen can use "equals the number I typed" instead of a count. `security-architect` confirms whole numbers of launches are acceptable (they are times and counts, no content).
3. **Native module review.** A background-task native module needs the BL-878 review first (SEC-ML-11), even for a throwaway; the spike's own module is not reused in the product.
4. **Developer Mode and ad hoc install** steps on each phone (UNVERIFIED which apply to a non-development ad hoc build).
5. **Size.** Not estimated here; no file in the repo holds a velocity. BL-871's row says S; BL-872's says M.

### 9.4 Afterwards

Delete the spike apps from the phones, delete the EAS builds, archive or delete `exp/memlib-spikes`. Merge only the evidence files and the NX-39 section 14 updates (as a documents-only PR).

## 10. Before, during and after

### 10.1 Before day 0 (the founder says go)

- [ ] The founder gives the explicit go to build the harness (section 9). Nothing in this sheet starts before it.
- [ ] Spike app installed on A, B, C; it opens and shows the SPIKE banner and no sign-in.
- [ ] The pass bar of 7.2 is agreed and dated.
- [ ] Both Wi-Fi and a Mac for the AirDrop of T6 and N3 are available.

### 10.2 Order of the days

| When | Do | Rows |
|---|---|---|
| Day 0, sitting 1 (about 2 h 40 min) | Prep, test kit, BL-843 Never-asked rows on A, then B | ML-843.1 to .24 |
| Day 0, sitting 2 (about 2 h 40 min) | BL-871 on A and B, with the BL-843 Limited rows in the middle (ML-871.3 = ML-843.25 to .34); tonight: ML-871.13 | ML-871.1 to .20, ML-843.25 to .34 |
| Day 1 morning | BL-871 next-morning check (ML-871.14); BL-843/871 write-up | |
| Day 1 evening | Tap Start the 14 days on A, B, C; set Phone B and C conditions | ML-872.1 |
| Days 2 to 15 | The daily record and the day plan in 7.3 | ML-872.1 to .14 |
| Day 15 morning | Day 14's numbers and summary; write the verdicts | ML-872.15 to .21 |

### 10.3 Cleanup (after day 15, or after BL-843 and BL-871 only, steps a to d and f)

a. Photos: delete "Spike Test" and "Spike Shared", delete every T and N item, then open Recently Deleted and delete them there too.
b. On the Mac delete the synthetic files and the AirDrop copies.
c. Settings > Privacy & Security > Photos > the spike app: no access.
d. Delete the spike app from each phone.
e. If you used a real item for T10, delete nothing: only the spike's access is revoked (step c).
f. Turn the Camera location setting back to While Using; turn Low Power Mode and Background App Refresh back to how they were.

## 11. UNVERIFIED (none relied on)

These are open in NX-39 section 14 or are mine. The run answers many; a few are about this sheet.

1. Whether the SDK 57 `expo-image-picker` returns the embedded date, place and an asset identifier with no permission asked, which version number goes with SDK 57, and what its quality and transcoding options do to the metadata (NX-39 section 14 item 15, 18).
2. That `PHPickerResult.assetIdentifier` is returned only when the picker is given the shared photo library, and that no authorization call is needed (the Apple page was blocked for the team).
3. Whether the system picker shows an Options button, a location switch, and where, on each iOS version (the sheet asks you to write what you see).
4. Whether Photos' Adjust date or location (T5) changes the embedded metadata of the file the app gets, or only Photos' database.
5. Whether a Live Photo arrives as a still only or a still and a movie on each path.
6. That the check in 4.5 (airplane mode plus a blurry or spinning full-size view) reliably shows an iCloud-only item, and that iOS ever keeps a new photo from another phone iCloud-only on a phone with enough space.
7. Whether the Limited-access box wording, buttons and timing are as I expect (NX-39 item 5); the sheet records the words.
8. Whether photos and videos taken after a Limited selection are visible, and observer and persistent-change behaviour across a selection change, foreground, backgrounded and force quit (items 4, 6, 14).
9. Whether the public API exposes the date a photo was added to the library (CAIO speaks of comparing "added date"). The sheet detects an AirDropped item by its old planned year, not by an added date.
10. Which background mode, which request type (app refresh or processing), and which plist keys Apple and Expo's package require on SDK 57 (items 1, 2, 17).
11. The effect on a background task of Low Power Mode, Background App Refresh off, force quit, a locked phone and charging; the two Apple statements on force quit disagree (items 3, 12, 13). The pass bar numbers in 7.2 are my proposal, not read from any file.
12. Whether iOS needs days to learn an app's use before it grants background runs (the reason days 1 and 2 are not counted).
13. Whether a restart without unlocking (before first unlock) allows any read. Not tested here; no step asks you to restart your phone.
14. Which phones the founder owns, which iOS each runs, whether each is registered with Apple for ad hoc installs, and whether the Apple team allows a new bundle id for the spike.
15. Whether the metadata editor needed for the synthetic files T6 and N3 is available on the Mac used.
16. All times in sections 3.2 and 10.2 are estimates; no one has run this.
17. The exact labels in iOS Photos for Adjust, in Settings for Background App Refresh and Low Power Mode, and in Camera, on the newest iOS; the sheet uses the names I expect.
18. That the three spikes can share one spike build without one disturbing another (a Photos permission set in BL-871 persists into BL-872). The sheet assumes yes and resets state at "Start the 14 days".
19. Whether the picker result for a video would carry the same metadata. Not tested; video is P3.
20. BL-843's row says "a phone with a real library"; its scope says "a test phone with only synthetic pictures". This sheet follows the scope (test items only) and treats a real item as the founder's choice for T10 alone. If the intent was a real library, that is a different and riskier test and needs a separate decision.

Signed: QA lead (Claude role), 10 Nov 2026 (UTC). Conflict of interest, said up front: I am Claude, the same family of model that wrote much of this repo and the NX-39 pack; every phone behaviour in this sheet is a question, and I have not run any of it.
