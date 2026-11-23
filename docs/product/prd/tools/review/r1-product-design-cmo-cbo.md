# Executive review of the new-scope requirements (read-only, develop at fetch on 20 Nov 2026)

Status: WORKING-INPUT (record; findings applied in the cards; do not load) | 20 Nov 2026 | Owner: the review role named in the file | Replaces: none | Load when: auditing where a finding came from; otherwise do not load.

I read the four skills in full (CPO, Design, CMO, CBO), COUNCIL.md, CLAUDE.md, PRD v2 02, 03, 06 (skimmed), the design index files (IA.md and NOTIFICATIONS.md read; the rest skimmed by heading), and in full: VISION.md, prd/README.md, 00 to 12, 15 (council record, to avoid repeating its findings), the head of 14, ROADMAP-2026-12-to-2027-05.md and 20-final-stack-rank. I also checked `packages/content/test/rules.test.ts` and `BRAND.md` for banned words, and `DECISIONS.md` for D-139 and D-157 to D-160. Nothing was run on a phone. No Apple, Supabase or legal page was read this session, so every platform rule below is UNVERIFIED and counsel must confirm any legal reading. I edited nothing.

Tags used: [CONFLICT] a contradiction in the record that must be fixed before lock; [AC] acceptance row to add; [SCN] scenario row; [NFR]; [KPI]; [DESIGN] state; [CONTENT] line as intent (content writes, founder approves); [CLAIM] what the card enables or forbids in public; [BIZ] Free vs Plus, cost, print; [FOUNDER] needs his decision, with recommended default. PROPOSED numbers are proposals.

---

## FRAME (00-product-frame, README, VISION, roadmap, stack rank)

1. [CONFLICT] Home slip order in 00 section 4 includes "a picture-first prompt", but NS-01-R1 and NS-35 put the photo start inside the capture cluster, never as a slip. The order also omits slips that exist (IA.md: "Waiting to be kept.", "Recorded before the app closed.", "A recording is ready to read back.", the built "A month ago" card) and NS-06-B4's `seal.homeOpened`. Replace with: "Home shows at most one slip, in this fixed order: (1) the existing waiting cards, in their existing order; (2) the seal-opened line, on its opening day only (NS-06-B4); (3) Save a copy, in the birthday week (NS-11); (4) one past letter (NS-23, which replaces the built 'A month ago' card). The reminder ask sheet and the Plus line (F14-REQ-040) are not slips and keep their own rules. The photo start belongs to the capture cluster and is never a slip." Test `[FRAME-SLIP]` loads a registry of every slip type, and the build fails when an unregistered type renders.
2. [CONFLICT] The README still records the founder's 11 Nov amendment as standing: the NX-41 R12 correction row says "'Coming soon' is one small caption line in Me, tappable", and the "What changed" table says "Design spec 07: the co-parent caption is tappable". The founder's 19 Nov answer ("Sorry second. Go for it") withdrew it. Change both rows to: "No caption, row, sheet or 'coming soon' line in any build (founder, 19 Nov; D-161 draft in #827)."
3. [CONFLICT] NS-06-B1 and OQ-B2 still ask `data-architect` to reconcile the instant against a calendar date by 20 Nov. The stack rank says ADR 0028 D3a settled it: two columns written once together, `seal_opens_at` is the rule and the date is display only, accepted under CR-62. Restate B1 to match.
4. [CONFLICT] NS-37 says "the original only for export" and NS-36-R1a lists "original and both derivatives". NS-01-R14 says "no original bytes and no 'originals' option exist". Define one term in 00 section 9: "stored copy = the stripped full-size file (no Exif, XMP or IPTC); list copy about 512 px; page copy about 1,280 px; the camera original is never stored." Then edit NS-36 and NS-37 to say "stored copy".
5. [DESIGN] Add to 00 section 5, so every card is designed in these states too: interrupted (phone call, Siri, alarm, the baby: app goes inactive mid-action); app killed and relaunched mid-flow; app updated between two steps; low storage (under 1 GB, under 50 MB, per 06-nfr 11.3); Low Power Mode; plan lapsed; signed out; a second account on the same phone; new phone (words present, recordings absent); two books; two parents; expecting parent (due date only); Smart Invert (pictures set to ignore invert); Voice Control (visible labels are the commands); Switch Control; Differentiate Without Colour (recording state never shown by terracotta alone).
6. [NFR] Add a required "Budgets" block to the card shape in README "How to read a card", where each line is filled or marked "n/a because": latency (p95 on SE 3 under the 06-nfr section 0 protocol); memory (peak above the screen's baseline); on-device storage (per item and per 1,000 letters); battery (06-nfr method, or "under the measurable step"); offline (works, queues, or is absent); accessibility (AX5 plus Bold Text, VoiceOver order, 44 pt); localisation (Devanagari, RTL, CJK, CLDR plurals); privacy (log canary covers the new field). Defaults are inherited from 06-nfr, and a card states only the lines where it differs.
7. [SCN] Add a required "Scenario coverage" table to the card shape with one row per founder scenario: first use; empty; many (1,000 letters, 300 pictures); offline; slow; failed; interrupted; low storage; low battery; two books; two parents; expecting; multilingual; AX5; VoiceOver; Reduce Motion; dark mode; app killed; app updated mid-flow; plan lapsed; signed out; new phone. Each row gives the behaviour or "n/a because". That makes exhaustiveness testable: `[CARD-SHAPE]`, a Node test, fails a card with a missing row.
8. [KPI] The section 3 measure table has no row for NS-01, NS-05, NS-09, NS-10, NS-14, NS-15, NS-21 to NS-24 or NS-33. Rows are given per card below. Add the rule: "Hand-sent numbers are reported as 'x of n' and never as a percentage when n is under 20. Each tester round asks at most 5 questions, with fixed wording, versioned in `docs/research/` (aggregate only)."
9. [KPI] Add these sources to section 3: App Store ratings and public review text (every user, no consent needed); a support inbox tally by fixed category (lost, confused, billing, other), content-free; and the export manifest's `counts` block, which a tester can read off and send by hand (the numbers only, no words). Also add the caveat from the CPO skill: App Store Connect usage metrics cover only users who share diagnostics, while installs and sales are wider. Whether subscription reports cover every purchaser is UNVERIFIED; verify before relying on it.
10. [FOUNDER] Every new card says "free ... not promised as forever". Principle 6 (03 section 3) protects only what is free at v1.0. That leaves Photo, Find, Share, Firsts, seals and Save a copy legally movable behind Plus. R2 found that new paywalls drew a negative review every time. Recommend: "Every capability that ships free in the 1.0.x line falls under principle 6: it never moves behind Plus." Default if no answer: treat as principle 6 internally, keep "not promised as forever" out of public copy, and say nothing either way in public.
11. [BIZ] The frame names one gate and makes every new feature free. App Review 3.1.2(a) asks for "ongoing value" (UNVERIFIED this session). Add one line to 00 section 2: "What Plus holds, and how it grows: keeping each new letter beyond the allowance. Each new card makes a kept letter worth more (a picture, findable, shareable, readable by year), so it raises the value of the one paid act without adding a second gate." Each card's Free/Plus line then cites it.
12. [BIZ] The run-cost table in section 8 needs three rows. Pictures: on the phone only, $0 server. The Find index: on the phone only, $0. Recording backup: arithmetic in NS-08 below. Also add: "Cards that add zero server cost: NS-01, 02, 05 L1, 06 A, 07 C5/C28, 09, 11, 13 to 15, 21 to 24, 32 to 37."
13. [CLAIM] Extend the claims list in 00 section 7 with these lines: "Pictures stay on this phone" (NS-01), "Find works without a connection" (NS-02), "Sends the words as text, nothing else" (NS-05), "Let it go removes the recording from this phone" (NS-09), "Your words follow you to a new phone" (NS-10, words only), "A copy in open formats" (NS-11). Each needs an inventory row.
14. [CLAIM] BRAND.md line 40 says "At v1.0 the book is shared with your co-parent". That is false for store builds under D-162 (draft) and NS-25. Add to the frame's drift list (N-12) with owner `content`.
15. [CONFLICT] VISION "Now (Build 12)" lists "free plan and Plus". BRAND forbids "free forever", and the record calls it "the allowance". Use "the first 2 letters free, then Plus" so no public line reads as a free tier forever.
16. [FOUNDER] The founder's asks in the README table are all dated Fri 20 Nov 2026, which is today. Add: "If unanswered by end of day Pacific, each default applies and is recorded in the exec rulings file with the date. A later answer from the founder reverses it."
17. [KPI] Roadmap: add "what reading would move a window", per window. December: SE 3 baseline numbers. January: the five-parent photo and Find studies. February to March: NS-03 read-out (Mon 21 Dec). April to May: proof-book quotes. Also add the two dated marketing moments (Mother's Day 9 May 2027, Father's Day 20 Jun 2027) against NS-05 and NS-11, which are the features those days would use.

---

## NS-01 Photo with a letter

1. [FOUNDER] One-way door: the resolution of the stored copy. Only the stripped copy is ever kept (R14), so whatever size BL-847 picks caps every future print (NS-07 C28, NS-30). An 8.5 x 8.5 inch page at 300 dpi needs about 2,550 px. Recommend: "The stored copy keeps the picked image's full pixel size up to 4,032 px on the long side, HEIC or JPEG at quality 0.85, metadata stripped." Default: that rule. Cost: about 1.5 to 3 MB per picture on the phone, so 300 pictures take about 0.5 to 0.9 GB [E].
2. [NFR] Add these budgets, all PROPOSED, on SE 3. Picker close to thumbnail shown: p95 1.0 s for a 12 MP local photo. Strip and write the stored copy off the UI thread: p95 1.5 s, with no UI frame over 16.7 ms. Tap Speak to microphone live with a picture attached: still p95 500 ms (F04-REQ-023). Peak memory during attach: under 80 MB above the Home baseline. On-device storage: per picture as item 1. Disk check before writing: free space must cover the file plus 50 MB, otherwise R17's full-phone path.
3. [AC] NS-01-R26: "Given a stored picture, Then its file is not excluded from the iPhone's own backup (`isExcludedFromBackup` false), so a device restore returns it with its letter." Test `[NS-01-R26] pictures ride in the device backup`. The NX-39 F9 default says pictures go in the backup, and #796 stores under Application Support, where models are excluded. The row prevents a silent exclusion.
4. [CONFLICT] R7 "Undo restores it for 10 seconds" conflicts with 06-nfr section 8 ("Undo windows never close while VoiceOver is reading"; WCAG 2.2.1). Rewrite: "Undo stays available for 10 seconds, or until VoiceOver has finished reading the undo line plus 10 seconds, whichever is later; with Switch Control on, until the parent moves on." The same fix applies to NS-06-A2.
5. [DESIGN] AX5 on SE 3: a 160 pt thumbnail above three capture buttons pushes Speak below the fold. Add NS-01-R27: "Given AX3 or larger on an iPhone SE 3, Then the thumbnail shrinks to 88 pt (PROPOSED) and Speak, Type and the photo row stay visible without scrolling." Device row.
6. [SCN] Add to section 6:
   - A call or the baby interrupts after the pick but before speaking: the picture stays attached for that capture session. Killed before speech: nothing written, as R4.
   - Killed after speech started: the draft holds the picture, and it waits as "Waiting to be kept".
   - App updated with a draft holding a picture: draft and picture intact after the update (add to the 06-nfr section 7 durability list).
   - Plan lapsed: attach and view work (R18).
   - Signed out: pictures stay on the phone with their letters. Second account on the same phone: never sees them (NS-10-R3 covers files).
   - Two books: the picture goes with the active book's letter.
   - An iCloud-only picture while offline: one line ("This picture is in iCloud and needs a connection") and the capture continues with no picture.
   - A panorama or very tall picture: the thumbnail fits inside the 160 pt box, uncropped.
   - Screenshots and HDR: stored as stills.
   - A picture from the Hidden album: the picker's own rules apply.
7. [DESIGN] States to draw:
   - Second phone where a picture was (OQ-2): show nothing. Me > Storage carries one line that pictures live on the phone that added them.
   - Smart Invert: thumbnails and the letter picture ignore invert.
   - Dark mode: a 1 pt hairline frame so dark photos do not merge into the background.
   - Lens with 300 pictures: list copies only (NS-37).
   - Failed-decode state: none drawn; the letter keeps going (R17).
8. [CONTENT] Lines as intent: photo text field label ("A few words about this picture, if you like"); place field ("Where, if you like"); replace confirm ("Use this picture instead?" with "Keep the first one" as the default); iCloud offline line as in item 6; the Storage line ("Pictures stay on the phone that added them"). Banned: memory, moment, album, "best".
9. [KPI] Analytics off. Testers send `counts.photos` and `counts.entries` from their export manifest (numbers only), plus one yes/no: "Did you start a letter from a picture this week?" Report as x of n. The study pass line stays as written.
10. [CLAIM] Enables: "Add a picture to a letter. It stays on your phone." Forbids: "backed up", "safe forever", "memories", "photo book", any count of pictures, and screenshots with a real child (use licensed or illustrated Asha images; App Review 2.3.8, UNVERIFIED). The privacy label keeps "Photos or Videos: not collected"; that is claimable only while R15 holds.
11. [BIZ] Free, zero server cost, never in Plus copy. The one cost is item 1's on-device storage, which the parent pays in phone space. Say nothing about it in public.

## NS-02 Find

1. [CONTENT] The empty line "No letters with that word yet." The word "yet" implies the parent should have written it. The appendix A list catches "not yet" but not this phrasing. Recommend "No letters with that word." Add "yet" (in an empty or result string) to the gap-pattern list.
2. [NFR] Index build: first build for 1,200 letters completes within 10 s in the background on SE 3, never on the first frame, never while recording (PROPOSED). Incremental update: within the Keep transaction, adding under 20 ms to the save commit (06-nfr requires local save p95 200 ms). Index size: under 10 KB per letter on average (R20 already caps 10 MB at 1,200). Keystroke debounce: 150 ms, counted inside R2's 300 ms.
3. [SCN] Add rows:
   - Backgrounded mid-query by a call or the baby: the query and results stay when the app returns in the same session. A kill clears them (R14).
   - Two parents: the co-parent's visible letters are found and their private ones never (R4).
   - A letter held at the Keep gate: not found until kept.
   - Signed out or second account: the index holds only the signed-in account's letters, and sign-out removes the other account's index rows with its data.
   - Before You letters: searchable.
   - Hindi typed in Latin script: found only by a Latin query (no transliteration, PRD v2 02 section 6 item 7).
   - Plan lapsed: works (J-N25).
   - App updated with the index at an older version: R19's fallback, then a rebuild.
4. [DESIGN] The match highlight must not rely on colour alone (WCAG 1.4.1): weight plus an underline, in light, dark and Increase Contrast. Snippet length is about two lines at the default size and up to 5 lines at AX5, and the result row never truncates the date line. VoiceOver reads each result as one element: date line, then snippet.
5. [AC] NS-02-R24: "Given a result whose match is in Arabic inside an English sentence, Then the snippet is wrapped in Unicode isolates (FSI and PDI) so the date line and the snippet keep their order." Test `[NS-02-R24] mixed-direction snippets keep order`.
6. [KPI] Two yes/no tester questions: "Did you use Find this week?" and "Did it find the letter you were looking for?" Report as x of n.
7. [CLAIM] Enables: "Find a letter by a word in it, even offline." Forbids: "search your recordings" and "find anything you said". The index holds `final_text` only, so a word a small fix removed, and the words of letters still waiting, are not found.
8. [BIZ] Free, zero cost. It raises the value of every kept letter (frame item 11).

## NS-03 Family-hears-it pilot

1. [FOUNDER] OQ-1 is due today, and every later date chains from it. Add: "If OQ-1 is answered after Fri 20 Nov, every date in section 5 moves by the same number of days. The read-out is never sooner than 7 days after the last send."
2. [SCN] Arm V transport: a recording sent by SMS or MMS to a non-iMessage phone can exceed carrier MMS limits (about 1 MB is common; UNVERIFIED per carrier). Originals are 0.48 MB per minute (06-nfr 11.3), so a 3-minute letter is about 1.4 MB. Add to Instruction V: "If the person does not use iMessage or WhatsApp, a recording longer than about 2 minutes may not arrive; send it by email or a messaging app instead." Add a code to Script B Q2: "file did not arrive".
3. [SCN] Recipient playback: `.m4a` (AAC) on an Android phone or in a web mail client. Before day 0, `mobile` checks that one fixture plays in WhatsApp on Android, in Gmail on the web and in Apple Mail (owner `qa`, by Mon 30 Nov).
4. [KPI] Add SC-6 (a signal, not a gate): "Arm W recipients who asked, unprompted, to hear the voice", counted from Script B Q1 free text. It is the only demand signal for Level 2 that Arm W can give, and it costs no voice read.
5. [SCN] Recipient abroad in another time zone: day 3 and day 7 are counted from the parent's send date in Pacific time.
6. [CLAIM] Participants get no code or reward (OQ-3). If any of them posts about the app, there is no material connection to disclose. If the founder later gives C1 offer codes to these same parents, the FTC endorsement guides apply (CMO skill section 8). Record the rule now: "No pilot participant receives an offer code until after the read-out, and any code later carries the disclosure line."
7. [BIZ] Cost is the founder's time: about 10 parents x 30 minutes, plus setup and the read-out, about 8 hours [E]. No spend. A GO feeds the only decision that could add server cost per family (hosted audio). Add to section 9: "A GO never implies a second tier. Family listening, if built, is described as part of what keeping a letter in Plus brings (X3)."

## NS-04 Hands-free spike

1. [SCN] Platform floor: the minimum iOS is 17 (D-040) and the reference phone is the SE 3. Control Center controls are understood to need iOS 18, and the SE 3 has no Action Button (both UNVERIFIED). Add Q11: "For each trigger, which supported iPhones and iOS versions get it. The SE 3 and iOS 17 rows are required." Add to EX: "A trigger that cannot reach the reference phone is reported as 'not for the floor' and never blocks parity."
2. [AC] EX-5 (from 12-parked: "zero unmeant recordings"): "0 recordings started without the parent's tap on Ready in 200 trigger fires across the triggers tested."
3. [SCN] Questions to add:
   - Q12: an incoming call, a Siri request or an alarm during a hands-free take. The take is held, not lost (F04 rules), and the result says what happens on return.
   - Q13: Driving Focus is active. Can the app see it? If yes, the trigger opens Ready with no change. No driving claim, ever.
   - Q14: AirPods connect mid-take: does the route change keep recording?
4. [CLAIM] A Siri phrase sends the parent's speech to Apple's Siri, not to us. No copy near a Siri trigger may say "nothing leaves your phone". Add to Q10's table a column "Apple processes audio (yes or no)".
5. [BIZ] None. Five engineer days plus one security day. Never Plus.

## NS-05 Share one letter

1. [AC] The date line is undefined, and it decides whether the child's name and age leave the phone. Review's header is "To {child} ? Month {n}". Add NS-05-R18: "Given a share, Then the wrapper is exactly: the letter's about-day as a long date in the device locale (no child name, no age), a blank line, the words, a blank line, the signature line ('From {signsAs}', or the NS-16 typed name). A child's name appears only if it is in the words." Test against the 20 fixtures.
2. [CLAIM] [CONFLICT] The promise is "every small fix is shown and can be undone". Plain text drops the marks, so the recipient reads the fixed version with no sign of the fixes. Add NS-05-R19: "Given the preview, Then it states which version is sent (intent: 'Sent as it reads in the book, with small fixes'), and if the letter page currently shows 'Exactly as said', that version is sent and the preview says so." This closes OQ-3. CMO: no public line may say a shared letter shows every change.
3. [AC] NS-05-R20 (bidi): "Given an Arabic or Hebrew letter, Then the date line and the signature line are wrapped in Unicode isolates, so the recipient's phone draws them in order." Fixture test.
4. [SCN] Rows to add:
   - The author's own private letter: shareable (it is theirs). State it in R7.
   - A letter held at the Keep gate: not shareable (not kept).
   - A call arrives while the share sheet is open: the sheet stays, and nothing is sent until the parent acts.
   - App killed after Continue: R10.
   - Plan lapsed: works (R8).
   - Signed out: works on letters still on the phone.
   - Offline: R9.
   - New phone with the picture absent: toggle hidden (section 7).
   - Two parents: never the other parent's letter (R7).
   - VoiceOver: the preview reads what leaves, in order.
5. [NFR] Preview opens p95 300 ms. Share sheet within 1 s (R11). Memory peak under 30 MB for a 1,000-word letter with a picture. Temporary files: 0 bytes left after the next launch (R10).
6. [DESIGN] States: preview with the picture toggle on and off; preview at AX5 with Continue and Not now stacked, equal size; picture missing; long letter (preview scrolls, buttons pinned in the bottom third); RTL letter; dark mode. No success toast after sending (the app cannot know if it was sent).
7. [CONTENT] Preview title (intent: "This will be sent"); static words row ("The words always go"); picture toggle ("Include the picture"); a "where it goes" line (intent: "It goes only where you send it, and cannot be taken back once sent"). No loss words, no "gift".
8. [KPI] Hand questions: "Did you send a letter this week (yes/no)?" and "Did the person reply (yes/no/don't know)?" Study pass line as written.
9. [CLAIM] Enables: "Send one letter to someone you love, as text, from your own messages." Forbids: "share your voice", "private link", "family can listen", "share with grandparents in the app". The Mother's Day 2027 moment is fine if Level 1 has shipped by then.
10. [BIZ] Free. No footer and no brand (Karma, 11 Nov) means a share brings zero acquisition. Record the trade explicitly in section 9 so no one later "fixes" it with a link: "Share earns trust, not installs. Acquisition comes from App Store search and communities (03 section 4.5)."

## NS-06 Firsts, sealed letters, quick capture

Part A, Firsts
1. [AC] Who may mark is unspecified. NS-06-A13: "Given the other parent's letter, Then no mark control exists; only the author marks or unmarks."
2. [AC] NS-06-A14: "Given a mark made in Review on a draft, Then the mark is stored with the draft. Let it go removes it, and it shows in the Book only once the letter is kept."
3. [AC] NS-06-A15: "Given a sealed letter with a mark, Then the mark contributes nothing anywhere until the seal opens" (consistent with B2).
4. [NFR] The label limit counts 40 grapheme clusters, tested with Devanagari conjuncts and an Arabic string. RTL labels right-aligned. The lens with 200 firsts opens p95 500 ms.
5. [DESIGN] States: mark toggle on and off; label empty; label at 40; lens empty (absent); RTL label; AX5. The Undo window follows NS-01 item 4.
6. [CLAIM] Forbids "milestones", "track firsts", "never miss a first" (fear of missing), "typical", and any count. Enables "Mark a letter as a first, in your own words."
7. [KPI] Hand: "Did you mark a first this month (yes/no)?" plus the study.

Part B, sealed letter
8. [CONFLICT] Restate B1 to ADR 0028 D3a (frame item 3) and close OQ-B2's reconciliation half.
9. [AC] NS-06-B11: "Given the date control, Then the latest day offered is the child's 25th birthday (PROPOSED). A due-date-only child uses the due date." [FOUNDER] Default: 25th birthday; counsel's "open at 18" question stays open.
10. [SCN] Rows to add:
    - The author deletes a sealed letter: confirmation, then Recently deleted holds it with no words shown (FS-R10).
    - The author's new phone with backup off: the sealed words must reach the author's own phone through sync. Add NS-06-B12: "Given the author signs in on a new phone before the instant, Then the sealed letter arrives there as sealed; no other member's phone receives it." Server access-rule test.
    - App killed at the instant: it opens at the next launch with no catch-up notice.
    - Plan lapsed at opening: reading is free.
    - The author's account is deleted before the instant: the letter is deleted with the account and never published.
    - The device clock is set back: the letter stays closed. Set forward: it shows early on that phone only, as B5 says.
11. [CLAIM] Forbids "time capsule" claims of security, "locked", "secure", "sealed forever", "delivered to your child". Enables "Keep a letter for a day you choose." Any "for when they turn 18" line is counsel's.
12. [CONTENT] The "hidden until {date}" row; the Open now confirmation (intent: "Open this letter now? It cannot be hidden again.", default Cancel); one plain sentence on what a seal does (intent: "Only you can see it until that day").

Part C, quick capture
13. [SCN] Inherit NS-04 items 1 to 3 as rows when written. Add C6: "No doorway appears on a phone or iOS version where it did not pass NS-04."

## NS-07 Remaining rows (C5, C28, G11)

1. [CONFLICT] [FOUNDER] `rules.test.ts` [K-32] fails any string matching `print`, so "print-ready" fails. "Printable" passes by the test's own comment. Recommend the parent-facing name "Printable book (PDF)". Default: "printable". No exemption to K-32.
2. [AC] C28 inherits NS-01 item 1. NS-07-C28-8: "Given a picture whose stored copy is under 2,550 px on its long side, Then the file uses it at the size it has and adds no upscaling. No message about quality."
3. [NFR] C28 budgets: 240 letters with 50 pictures generated within 60 s on SE 3 (PROPOSED; F15 says a 240-letter PDF in under 30 s without pictures); peak memory under 150 MB (06-nfr 2.5); progress shown; the screen kept awake only while generating; under Low Power Mode, a line that it may take longer; on a kill, no partial file (as NS-11-R9). Fonts: Literata, Tiro and Noto, all OFL, embedded and subset.
4. [FOUNDER] Page size default before proof books: 8.5 x 8.5 inch (BK-14's frame). Default: that size, layout marked provisional. The proof-book spend stays his (OQ-1, default no spend).
5. [AC] C5 rows to add. NS-07-C5-6: "Given 'A quiet day, kept.' with Undo, When Undo is tapped within its window (NS-01 item 4 rule), Then no mark remains." NS-07-C5-7: "A quiet day is one per book per local day. With two books, the mark goes to the active book." NS-07-C5-8: "Given two parents tap on the same day, Then each author's mark is their own, and the Book shows one quiet-day row per author, unsigned." Recommend one row per author; the CDesO may merge them. NS-07-C5-9: "Consecutive quiet days render as separate rows with no run visual, line or grouping."
6. [AC] G11-3: the label-effect guard also fails a diff that adds an analytics, crash or ads SDK to `apps/mobile/package.json`, or a new `NS*` entitlement or Info.plist usage string, without a recorded decision id.
7. [CLAIM] C28 enables "Free printable PDF of the book" only. It forbids "order", "printed", "hardcover" and any partner name (K-32).
8. [BIZ] Print revenue (BK-14: $59 first copy [R], about 39% margin [E, A]) depends on item 1 of NS-01 being decided now. It is the single cheapest way to keep the print business possible later.

## NS-08 Recording backup readiness

1. [BIZ] Put the arithmetic in the card so NS-08-R2 has a checkable base. 06-nfr 11.3 gives 19.2 MB per active family per month at 40 audio minutes. The Free plan's 1 GB storage (`free-tier-ops.md`, read 8 Nov by the frame) therefore holds about 52 family-months: 50 active families fill it in about one month. Supabase paid storage prices are not read here (UNVERIFIED; read before R2).
2. [BIZ] [FOUNDER] Free families can make unlimited drafts (capture never blocked), and F14-REQ-039 backs up held letters when backup is on. Backup cost therefore scales with free families' drafts, not payers. 06-nfr already sets 5 GB per account. Recommend keeping the promise (held drafts backed up) and the 5 GB cap, and having the CFO price the case "1,000 free families, 20 held drafts each". Default: as recorded; no flip until the CFO note.
3. [KPI] Exposure measure with analytics off. Tester question: "Is iCloud Backup on for this iPhone (yes/no/don't know)?" It says how many families' voices live on one phone only.
4. [AC] NS-08-R8: "Given backup off, When the parent deletes the app, Then nothing in the app claimed otherwise." The existing keep-safe card (C-REQ-018 Rev) points to Save a copy (NS-11) and to iCloud Backup, in one line, once, and never with fear words.
5. [CLAIM] Forbids "backed up", "never lose a recording", "safe in the cloud", "only you can restore" (D-102), and "free backup" (internal rule, frame text). Enables nothing new until the flip.
6. [DESIGN] The four provenance states also need AX5 wrap and a VoiceOver phrase per state. No colour or icon is the only signal.

## NS-09 Let it go always finishes

1. [AC] Hygiene: NS-09-R4a has no test title, and R5 sits after R6. Add `[NS-09-R4a] the line shows once per take` and renumber, so the trace script finds every row.
2. [AC] NS-09-R9: "Given Let it go, Then a confirmation appears whose default is the safe choice (keep), and VoiceOver reads its consequence; nothing is undone after confirm." State whether an Undo exists. Recommend no Undo after file deletion, and say so in the confirmation.
3. [NFR] Launch sweep with 50 discarding drafts: completes within 2 s off the UI thread (PROPOSED), next to R5's empty case. A stuck 30-minute file holds about 14.4 MB; Storage shows its size.
4. [SCN] Rows to add:
   - Low storage: a stuck file is what the low-storage card should name first.
   - App updated with a draft in `discarding`: the sweep runs after the update.
   - Signed out with a queued discard: the discard is kept and sent at the next sign-in of the same account; a different account never sends it.
   - VoiceOver: the R4 line is announced after the screen settles (R4b).
5. [CONTENT] The Storage line and "Remove now" (intent: "One recording is still on this phone" with "Remove now"). No count beyond one item per row.
6. [KPI] Support tally category "something I let go came back" (target 0). Testers: "Did anything you let go reappear (yes/no)?"
7. [CLAIM] Enables "Let it go removes it from this phone." Forbids "instantly deleted everywhere": the server and the other phone follow at their next sync.

## NS-10 New phone close-out

1. [SCN] New phone restored from an iCloud device backup and then signed in: local rows from the restore and pulled rows from sync must not duplicate. NS-10-R5: "Given a device restore holding letters L1 to Ln and a sign-in pulling the same ids, Then each letter appears once (match by entry id)." Two-phone device row.
2. [SCN] Old and new phones both active: both receive the book. A letter made on either reaches the other (NFR freshness, p95 30 s foreground).
3. [SCN] Sign in with Apple "Hide My Email" on one phone and email on another gives two accounts. The "Wrong account" row says how to tell which address was used (intent: "You signed in with {method}"), with no email shown in full on a shared screen.
4. [DESIGN] With backup off, every recording is absent on the new phone. Per-letter "not on this phone" on hundreds of cards reads as a broken book. Add a Book-level line shown once at the top until dismissed (intent: "Your words are here. Recordings stay on the phone that made them."). Read together shows the words with Play absent. One line per letter in the provenance row only.
5. [NFR] From 06-nfr section 4: book list and children visible p95 10 s; 1 year of text p95 30 s on LTE; 5 years p95 60 s. R2's 10 s hold must agree: show what has arrived at 10 s.
6. [SCN] App updated mid-arrival: the pull resumes from the watermark. Killed mid-arrival: same. Low storage: text is small, so no special case; say so.
7. [KPI] Testers who changed phones: "Did your book appear on the new phone (yes/no)? Did anything look missing that you expected (yes/no)?"
8. [CLAIM] Enables "Your letters follow you to a new phone when you sign in." Forbids "everything moves", "recordings move" and "nothing is ever lost" while backup is off.

## NS-11 Save a copy of the year

1. [SCN] Rows to add:
   - A 29 Feb birthday: in non-leap years the window starts 28 Feb (PROPOSED).
   - Twins with the same birthday: one slip naming both books, which leads to a chooser.
   - Two birthdays in the same week: one slip at a time, the earlier birthday first.
   - Files or iCloud Drive full: the destination's own error. Our screen stays and nothing is marked done.
   - Low Power Mode or battery under 20%: one line that a large copy may take a while (no fear words); the export is not blocked.
   - Device time zone change across the birthday: local date rules.
   - Plan lapsed: works (M1).
   - Signed out: works on what is on the phone.
2. [NFR] From 06-nfr 2.5: 1 year of originals (about 230 MB) offline in under 2 min (gate); 5 years under 10 min, resumable. Screen kept awake only while exporting (06-nfr section 10). The disk check needs the estimate plus 200 MB (F15-REQ-010).
3. [AC] NS-11-R10: "Given the export file name, Then it contains the child's name only if the parent named the book. It never contains an email, account id or device name."
4. [KPI] As written ("saved a copy, where"). Add: "Was this your first copy ever (yes/no)?" That measures whether the slip creates a new behaviour.
5. [CLAIM] Enables "Save a copy of the year, in open formats, yours to keep." Forbids "backup", "in case you lose your phone" (fear), "protect your memories". BRAND's existing `exportNudge` line is the model.
6. [BIZ] Free and zero cost. It is the only second copy of the voice while backup is off, so it is also our best defence against the worst support ticket.

## NS-12 Earlier versions

1. [FOUNDER] (with counsel) Retention: the server keeps every version for the life of the letter. Recommend: "The author can remove an earlier version. Removal deletes it on the server within one sync." Default: no build until counsel packet Q51 answers. The card already blocks the build; make the default explicit.
2. [AC] NS-12-R4: "Given the version list, Then at most the last 20 versions show, newest first (PROPOSED). Older ones are reachable through 'Show all'." NS-12-R5: "Free; never gated" (add the missing Free/Plus line).
3. [CLAIM] Forbids "full history", "undo anything forever". Enables nothing until built.

## NS-13 Reminders

1. [CONFLICT] "Offered reminders once" contradicts the built behaviour (NOTIFICATIONS.md: cap of 2 showings ever, the card can return once). Pick one. Recommend the built cap of 2 with "No reminders" counted as an answer, and write it into the happy path.
2. [CONFLICT] "Never fires between 21:30 and 07:00 local unless the parent chose that hour" contradicts the shipped gate: the picker is capped at 9:30 PM, and remote config may only narrow the window. Rewrite: "No reminder fires between 21:30 and 07:00 local. The picker offers no hour in that window (the shipped rule)." A later 10 PM option is v1.1 after Study 1.
3. [CONFLICT] "Two books: one reminder, not one per child" versus the built "Each book has its own 'Include in my reminders'". Restate: "At most one reminder per day across all books (NS-32). It names no child by default. Each book's switch decides whether that book's prompts are eligible."
4. [CONFLICT] R2 "never the same words twice running" is much weaker than F13-REQ-004 (no repeat within 365 days; `AVOID_RECENT = 10` in code). Set: "No notification body repeats within 30 days (PROPOSED). The name-free pool therefore holds at least 31 prompts per age band, including `before`." This is a content workload; F13-REQ-008 already wants 12 in `before`.
5. [CONFLICT] Month and birthday messages exist (NOTIFICATIONS.md) and are absent from NS-13 and NS-32. Add them as classes in NS-32 and to R5's string rules. A month message may name the age ("Month 3"), which is not a gap.
6. [AC] NS-13-R18: "Given any scheduled reminder, Then its iOS interruption level is 'active' and never 'time-sensitive', so Focus modes and the Scheduled Summary apply."
7. [AC] NS-13-R19: "Given the app is updated, Then all pending reminders are re-planned at the first launch after the update." NS-13-R20: "Given a new phone, Then reminder settings do not sync. The reminder ask follows the normal two-showing cap on that phone." [FOUNDER] whether settings should sync; default no (no new server data).
8. [AC] NS-13-R21: "Given every scheduled class, Then the total pending local notifications never exceed 60 (iOS keeps 64; the planner reserves 4)."
9. [SCN] Rows to add:
   - The parent already chose "Once a week": the back-off goes straight to the 4-week stop rule.
   - Expecting parent: evening reminders allowed, no due-date wording (R10).
   - Multilingual author: the notification language is the interface language (English in Build 12). Prompts in other languages only when that interface language ships.
   - Signed out: R14.
   - Low Power Mode: local notifications are unaffected; no change.
10. [KPI] As written, plus: "Did a reminder lead you to make a letter this week (yes/no)?" The 03 target of 12% made within 2 h needs analytics, so mark it "not measurable in 1.0".
11. [CLAIM] Enables "Gentle reminders at the hour you choose. No names on your lock screen unless you choose." Forbids "never miss a day", "stay on track", streak words, "smart reminders" (implies AI).
12. [DESIGN] States: the ask card (two equal choices); denied (Open Settings); back-off invisible; the AX5 picker with stacked day chips; a live preview showing the neutral body text.

## NS-14 Whose book

1. [FOUNDER] Moving a kept letter to the other child's book is "not offered", yet this card's own "why" is the small heartbreak of a wrong-book letter. Recommend a follow-up card, NS-14b "Move to {child}'s book" (author only, raw words unchanged, counted once). Default: out of this card, ranked by the CPO after NS-21.
2. [SCN] Rows to add:
   - A co-parent with the same two books: each parent's selection is their own phone's.
   - Book switched during an active take: impossible, because the switcher is hidden while Listen is open. State it.
   - Hidden book: absent from the Home switcher.
   - Quieted book: present (the parent may still write), no reminders.
   - AX5: names wrap and never truncate; a nameless book shows "Your child" plus the date.
3. [NFR] Switch p95 300 ms offline (06-nfr 2.1).
4. [KPI] Testers with two books: "Did a letter land in the wrong book this month (yes/no)?" Target 0.
5. [CONTENT] VoiceOver label as written. Never "Child 1/2".

## NS-15 A letter for another day

1. [SCN] Rows to add:
   - The birth date is changed later (a preterm birth recorded after letters exist): letters re-file by their about-day automatically, the said-on day never changes, and the age lines recompute.
   - About-day is a date with no time and no time zone; it never shifts on travel.
   - Due-date-only child: about-days before the due date file into Before You.
   - Sealed letter: its about-day cannot be after today (seals use the open day, NS-06).
   - Plan lapsed: changing the day on a kept letter is free.
   - A held draft at the gate: the day can be set in Review before Keep.
2. [AC] NS-15-R12: "Given a changed about-day, Then the Book moves the letter without a reload, p95 300 ms (PROPOSED), and VoiceOver announces the new month."
3. [DESIGN] States: the two-date line at AX5 on two lines; a picker bounded per R5 and the 2-year floor; the Before You case.
4. [KPI] From the export manifest by hand: "letters whose about-day differs from said-on" as a number (content-free), or a tester yes/no.
5. [CONTENT] Two-date line as written. Avoid "backdated" and "late". Avoid ordinal-day phrasing that needs locale work; use `Intl.DateTimeFormat`.

## NS-16 Someone else speaks

1. [CLAIM] Forbids "invite grandparents", "family can add letters" (that is NS-25 and v1.1). Enables nothing in public until counsel answers packet Q2.
2. [AC] NS-16-R6: "Given a typed name, Then it is stored as typed (any script, RTL allowed), up to 40 grapheme clusters." NS-16-R7: "Given Find, Then the typed name is not indexed" (only `final_text` and parent-typed labels are, NS-02-R5). Or decide to index it. [FOUNDER] Default: not indexed.
3. [BIZ] It counts toward the keeper's allowance. A grandparent's visit could use up both free letters in one evening, which makes the gate land on a guest moment. Recommend no change (one rule), but content must make sure the gate sheet never names the speaker.
4. [SCN] Plan lapsed: the keeper cannot keep a third letter, so the visitor's letter waits as a draft. The gate copy must not imply the visitor's words are at risk.

## NS-17 Second spoken language

1. [FOUNDER] In an English-only build, a Spanish-speaking parent's spoken letters wait forever for words, and D-103 means they can never be kept. Recommend scope: on a letter marked "another language", offer "Type the words yourself" (typed text is the parent's own and never machine-edited, B5), which lets the letter be kept. Default: offer it. Without it, P4 families cannot keep spoken letters at all.
2. [KPI] Per language, from testers by hand: author correction rate cannot be read with analytics off. Use the native reviewer's gate corpus result plus "Did the words match what you said (yes / mostly / no)?" from P4 testers.
3. [CLAIM] The store listing names only shipped languages (R4). The site's seven-languages line is already flagged by the CMO skill. D-139's subtitle is unaffected.
4. [BIZ] About $1,000 to $1,500 per language in reviewer spec checks [E] (03 section 4.4), plus model hosting on R2. Founder spend per language.
5. [DESIGN] The "words are waiting" state on a letter page and in the Book; RTL and Devanagari reviewed by a native-script reviewer before unlock.

## NS-18 Typed days

1. [AC] NS-18-R5: "The typed words are 1 to 80 characters (PROPOSED), any script." NS-18-R6: "Given sign-out, Erase everything or account deletion, Then typed days and their notifications are removed." NS-18-R7: "Typed days are included in the data export as settings" [FOUNDER with counsel on access-request scope]. Default: included.
2. [SCN] The parent types words about a due date ("baby due"): allowed, because they are the parent's own words. The P3 rule bans our wording, not theirs. State it.
3. [CONTENT] The fixed notification line as written ("A day you wanted to remember"). The switch "Show my words in the notification", off by default.

## NS-19 and NS-20

1. NS-19 [AC] NS-19-R3: "Given a continued draft, Then the Book shows the takes in order, each with its own Play, and the allowance counts the letter once."
2. NS-20 [FOUNDER] One letter in two books against two copies. Recommend two copies made at Keep, each counted. Default: not built.

## NS-21 Letter page as one list

1. [CONFLICT] Row 5 "Who can read it" is absent while the book has one adult. Build 12 cards already show "Private" (IA.md). If a parent marked letters private and the row disappears, the state becomes invisible. Rewrite: "Absent while the book has one adult and the letter is not private. A private letter always shows the row."
2. [AC] NS-21-R6: "Given a typed letter, Then no Play control. Given a spoken letter, Then Play sits under the dateline, above the words." NS-21-R7: "Given Delete, Then a confirmation with Cancel as the default, and the letter goes to Recently deleted for 30 days."
3. [NFR] Letter page open from a Book card: p95 300 ms (PROPOSED; inside NS-34's 900 ms hand-off).
4. [SCN] Rows to add:
   - A letter whose words are still being made: the list shows the date and provenance rows only.
   - A letter held at the gate: not reachable from the Book (state it).
   - Plan lapsed: every row except Keep-related ones works.
   - App updated: no change.

## NS-22 Book header calm

1. [AC] NS-22-R5: "Given AX5 with Bold Text on an SE 3, Then the first letter card's top edge is within one screen height of scroll (PROPOSED)."
2. [CONFLICT] The gear is "the only way into Settings" today (IA.md). Add NS-22-R6: "After the gear leaves, Settings is reached from Me in 1 tap, and the deep link to `/settings` still opens it."
3. [DESIGN] States: empty book (title and age only), one book, two books, a quieted book (the menu offers Unquiet), AX5 wrap order.

## NS-23 One past letter on Home

1. [CONFLICT] IA.md shows a built "A month ago" card. State whether NS-23 replaces it (recommended) or extends it.
2. [AC] NS-23-R9 (date matching): "Day 29, 30 or 31 matches the last day of a shorter month. 29 Feb matches 28 Feb in non-leap years. The first month has no match." NS-23-R10: "The fragment is at most 2 lines at the default size and 4 at AX5, cut by the language's word segmenter."
3. [FOUNDER] Default of the Me switch. A past letter about a hard time (NICU) can surface unprompted. Recommend on by default, with Quiet this book as the loss path. Default: on.
4. [SCN] App lock on: the fragment shows only after unlock. Recently deleted letters are never chosen. Plan lapsed: shown. Two parents: the other parent's non-private letters are eligible.

## NS-24 Read the year back

1. [SCN] Rows to add:
   - Due-date-only child: no year is offered except Before You.
   - Audio interruption (a call): playback pauses and resumes on return at the same page.
   - Screen kept awake while open (F10-REQ-012).
   - Reduce Motion: the page turn becomes a 200 ms fade (06-nfr section 8).
   - Dark mode is the default at bedtime.
   - Plan lapsed: works (J-N25).
2. [KPI] Tester: "Did you read a year back (yes/no)?" Asked only in birthday weeks.
3. [CLAIM] "Read together has no limit" needs a claims row (00 section 7 lists it). Forbids "your year in review", "highlights", any count.

## NS-25 The other parent

1. [BIZ] [FOUNDER] DR-16: Plus reaches a co-parent only inside one Apple Family (D-053). A co-parent outside it hits the 2-letter gate on their own letters. Decide before NS-25 ships to stores. Recommend: keep D-053, and say it plainly in the invite. Default: as recorded.
2. [AC] NS-25-R7: "Given each parent's allowance, Then each counts only their own kept letters" (D-103; the other parent's letters never count against them).
3. [CLAIM] BRAND line 40 (frame item 14) must change before any store listing mentions both parents.

## NS-26 to NS-31

1. NS-26 [AC if built] "At most 1 per day, inside NS-32's budget, never letter words or a child name by default."
2. NS-28 and NS-30 [BIZ] A printed book with a QR code needs hosted audio (X2), an entity (D-004) and a partner. Record the founder sequence: entity, then partner quotes, then hosted audio.
3. NS-29 [NFR if built] Word timings stored against raw words; zero highlighted words that are absent from `final_text`.

## NS-32 One notification budget

1. [AC] NS-32-R5: "The registry lists at least: plan notice (outside the budget, first); typed day; reminder; month message; birthday message. Each row has a priority and an owner." Month and birthday messages are missing today (NS-13 item 5).
2. [AC] NS-32-R6: "'Per local day' is the device's calendar day at delivery time. After a time zone change, a day never delivers 2 budgeted notifications."
3. [AC] NS-32-R7: "Total pending notifications are at most 60" (NS-13 item 8).
4. [KPI] Tester: "Did the app ever feel like too many notifications (yes/no)?" Guardrail target 0.

## NS-33 Everyone can use it

1. [AC] 06-nfr section 8 gates Voice Control and Switch Control at submission (G4), but NS-33 has no row for them. Add NS-33-R9: "Every visible label works as a Voice Control command on Home, Listen, Review, the Book and the letter page." Add NS-33-R10: "Every control on those screens is reachable by Switch Control item scanning."
2. [AC] NS-33-R11: "Pictures and the brand mark ignore Smart Invert." NS-33-R12: "The recording state is shown by text and shape, never by terracotta alone." NS-33-R13: "Tab bar items show the Large Content Viewer at AX sizes." NS-33-R14: "Bold Text changes the weight of Mukta, Literata and Tiro." The design skill marks this NEEDS EVIDENCE; this row makes it a device check.
3. [FOUNDER] Accessibility Nutrition Labels: declare only VoiceOver, Dark Interface and Reduced Motion after the walk passes; hold Larger Text until AX5 on SE 3 passes. Default: declare nothing.
4. [CLAIM] Forbids "accessible to everyone", "fully accessible", "works with VoiceOver" until the walk passes on a phone.

## NS-34 Quick on the smallest phone

1. [NFR] Add these from 06-nfr so the run sheet covers more than speed: idle drain 1% a day or less; recording battery 2% or less per 10-minute take; memory under 40 MB above idle while recording; idle memory after first run under 150 MB; app download under 40 MB; caches 50 MB or less. Add thermal: no take is refused at `serious`.
2. [CONFLICT] Clarify the "save hand-off within 2,000 ms" against 06-nfr's "local save commit p95 200 ms": the 2,000 ms is the visible hand-off (Keep to the Book showing it), and the commit inside it stays at 200 ms.
3. [AC] NS-34-R3: "The run sheet records the device model, the iOS version and the build fingerprint for every number."

## NS-35 One start

1. [AC] NS-35-R4: "A share extension, a notification action or a Siri intent counts as a doorway (R3). It never records or keeps on its own."

## NS-36 Data follows the letter

1. [AC] NS-36-R7: "The Find index row of a letter is deleted, hidden and restored with the letter" (ties NS-02-R16). NS-36-R8: "Typed days (NS-18) are settings, not letter data, and follow NS-18-R6."
2. [AC] NS-36-R9: "Given an export at 1.7.0, Then an import or read by the 1.6 reader ignores unknown fields without error."

## NS-37 The Book stays fast

1. [NFR] Book with 1,200 letters and 300 pictures under 150 MB resident (06-nfr says under 120 MB without pictures; +30 MB PROPOSED). First decode of a list copy p95 50 ms off the UI thread. Derivatives: stored next to the stored copy and regenerated if missing. Size about 50 KB (list) and about 250 KB (page) each, so 300 pictures add about 90 MB. Counted in Storage, not as purgeable cache.
2. [AC] NS-37-R3: "Given a derivative is missing, Then the Book shows the card without the thumbnail and regenerates it in the background, with no error."

---

## Verdicts

**Chief Product Officer.** The pack is the most complete product record this company has had. Every card names a job, a moment and the gate that guards it, and the council's 60 earlier findings were applied rather than argued. It is not yet lockable, for three reasons. First, six contradictions with the record or the built code would send engineering two ways: the Home slip order, the co-parent caption rows in the README, the stale seal reconciliation, "original" against "stored copy", and NS-13 against the shipped reminder rules (ask cap, quiet hours, per-book, repeat window). Second, the founder's own scenario list is answered unevenly. Older cards (NS-01 to NS-07) cover offline and failure well, while interruption, app update, signed out, second account and plan lapsed are mostly implicit; the "Scenario coverage" table and the card-shape test fix that mechanically. Third, measurement while analytics is off is honest but thin; the export manifest counts and a five-question tester round are a cheap, content-free improvement. The bet stays right: keeping before adding, then the founder's order. Two founder calls change the most for parents: whether everything free in 1.0.x falls under principle 6 (I recommend yes), and whether a P4 parent in an English-only build can keep a spoken letter by typing its words (I recommend yes). Chief Product Officer (Claude role)

**Chief Design Officer.** The standing rules are right: bottom-third primary actions, absent rather than greyed, no counts, and no ceremony. The cards respect them. What a designer cannot yet draw from them is the edges. AX5 on an SE 3 is asserted per card but laid out nowhere: the photo thumbnail above the capture cluster, the Book header and the two-date line all need a stated large-size form, and the NS-01 item 5 rule is the pattern to copy. The 10-second Undo windows in NS-01 and NS-06 break our own time-limit rule for VoiceOver users and must follow it. Voice Control, Switch Control, Smart Invert, colour-independent recording state and Bold Text on our three custom fonts are gated in 06-nfr but missing from NS-33, so they would ship unwalked. The new-phone experience with backup off needs one Book-level explanation, not hundreds of per-letter absences. None of this needs a new component. It needs the states written down before Build 13 design freezes, and every accessibility claim held until a phone shows it. Chief Design Officer (Claude role)

**Chief Marketing Officer.** This pack makes our public story stronger without making it riskier, as long as each card's claim and forbidden list goes into the claims inventory before its flag turns on in production. The real gains are "a picture with a letter, kept on your phone", "find a letter by a word, even offline", "send one letter as text" and "a copy of the year in open formats", all literally true of the planned builds. The risks are specific. A shared letter drops the fix marks, so "every change shown" must never be said of what a grandparent receives. "Print-ready" fails our own K-32 test, so it should be "printable". BRAND.md still promises a co-parent at v1.0. A Siri doorway means "nothing leaves your phone" cannot sit near it. Share carries no brand by decision, so it earns trust and no installs, and the launch plan must not count on it for reach. No pilot participant should receive an offer code before the read-out. Chief Marketing Officer (Claude role)

**Chief Business Officer.** The economics of this pack are good, because almost all of it costs nothing per family: pictures, Find, Share Level 1, Firsts, Save a copy and reminders all live on the phone. Recording backup is the exception, and it scales with every family who records, paying or not. On the repo's own numbers, the Free plan's storage holds about 50 active families for a month, so NS-08's sizing note must be priced before anyone talks about a flip date. The larger business point is structural. With one gate and every new feature free, Plus's ongoing value is "each kept letter is worth more", and the frame should say so in one line for App Review and for us. The founder should also confirm that free stays free across the 1.0.x line, because moving a feature behind Plus later is the one move R2 says always costs reviews. One decision is a one-way door hiding in a design detail: the resolution of the stored picture caps every future printed book, so it must be set before Build 13 writes its first photo. The print business stays where the record puts it: no spend, no partner, no seller before an entity. Chief Business Officer (Claude role)

---

Files read (all on `origin/develop`, under /home/claude/earlyletters):
- `docs/product/VISION.md`
- `docs/product/prd/README.md` and `00` to `12`, plus `14` (head) and `15`
- `docs/roadmap/ROADMAP-2026-12-to-2027-05.md`
- `docs/roadmap/next/20-final-stack-rank-and-sizing-19nov.md`
- `docs/prd/v2/02-customers.md`, `03-goals-and-principles.md`, `06-nfr.md` (sections 0 to 11)
- `docs/design/IA.md`, `docs/design/NOTIFICATIONS.md`
- `packages/content/test/rules.test.ts` and `packages/content/BRAND.md` (grep only)
- `docs/DECISIONS.md` (D-139, D-157 to D-160 rows)

Nothing new to remember about the user came up in this task.