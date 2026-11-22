# Moments tab: executive rulings on O-44, G11b, PR #1316, O-47 and O-61

Status: PROPOSED rulings, 21 Nov 2026. Docs only. Nothing in `.github/`, `docs/legal/`, `docs/DECISIONS.md` or code is edited by this file.
Seats: CISO, CLO, CCO and CFO, run for Karma (CTO) under `docs/agents/exec/COUNCIL.md`. The founder delegated all open decisions ("Decide all open with exec", 21 Nov 2026).
Plain statement: these are Claude roles. None is a lawyer, accountant, auditor or tester. Every legal or tax point below is marked "counsel must confirm" or "accountant must confirm". Every outside fact is marked UNVERIFIED unless the source was read in this session.
Ids: the ids `MR-1` to `MR-5` are provisional. The next free `CISO-`, `CLO-`, `CCO-` and `CFO-` numbers are assigned when these are copied into `docs/agents/exec/RULINGS.md` (check the log and open PRs first, COUNCIL section 5).

## 0. The founder's reply of 21 Nov 2026

The coordinator relayed the founder's reply verbatim: "I agree with all your recommendations. Continue. Approved." What that fixes, in the coordinator's words of the same relay:

- O-44: disclose the iPhone backup of kept pictures in one plain line of the policy text (counsel to confirm the wording; Apple's behaviour is UNVERIFIED), and do not exclude the folder.
- The app-switcher cover is ON for the Moments tab with app lock off.
- #1316: the founder merges it himself (legal text, D-125).
- O-61: the founder pastes one file.
- O-47: steps and a recommendation are still wanted; the accountant and counsel must confirm.

O-44 and the cover are therefore DECIDED by the founder. Sections 1 and 2 record them as decided and carry the work that follows. Sections 3 to 5 are rulings for him to read, with the same status as any recommendation: he may reverse any of them.

## 1. One line per item

| Id | Item | Ruling in one line | Verdict |
|---|---|---|---|
| MR-1 | O-44 backup of kept picture copies | DECIDED by the founder: disclose in one plain policy line, do not exclude the folder. Counsel confirms the wording. | DECIDED (founder) |
| MR-1b | Switcher cover for the Moments tab | DECIDED by the founder: cover ON for the Moments tab, app lock off. Needs a code change and a spec edit. | DECIDED (founder) |
| MR-2 | G11b place table licence | Build the legal default: no places, date-only cards, until licensed counsel's written answer to packet Q132 and a dated G11b line. Silence is never a pass. | RULED (CLO, CCO); founder spend stays his |
| MR-3 | PR #1316 | Ready to merge on the evidence read; the founder merges it (D-125 item 5). Q123 to Q132 still fit. One stale default (Q129) needs a follow-up before the packet goes to counsel. | FOUNDER (his merge) |
| MR-4 | O-47 entity before Fri 27 Nov | Recommend option C: stay an individual now under D-134, and put dated triggers and four cheap preparations in writing. Do not form an entity by 27 Nov unless the accountant or counsel says to. | FOUNDER (money and legal) |
| MR-5 | O-61 iOS compile leg | Paste one patch into `.github/workflows/ios-compile.yml` (section 6, verified to apply on `develop` at `8ca6d7d28`). Needed before PR 9 or PR 11c merges. | FOUNDER (or Karma under CR-73), two reviews |

## 2. MR-1 and MR-1b: O-44, the iPhone backup of kept picture copies, and the switcher cover

Seats: CISO and CLO, with CCO. Verdict: DECIDED (founder, 21 Nov 2026).

**Question.** A kept letter's picture copy sits in `Library/Application Support/photos/` and is part of the iPhone backup. Does the policy say so, or does the app exclude the folder from backup?

**Facts read this session.**
- The folder is not excluded: "confirmed by the absence of any exclusion call under `lib/photos/`" at commit `39efe1ac` (`docs/adr/0028-photo-seal-find-on-device-data.md:58`). Apple's File System Programming Guide, as ADR 0028 quotes it (opened 19 Nov 2026 by that author, not by me): Application Support contents "are backed up by iTunes and iCloud" unless excluded with `NSURLIsExcludedFromBackupKey` (ADR 0028, same section). Apple's behaviour is UNVERIFIED by me.
- The threat model row: "By decision, stored pictures are NOT excluded from the iPhone backup" and "Not a control against A4: it is a stated exposure" (`docs/security/MEDIA_THREAT_MODEL.md:50`, row P9). The read-back that the flags match the words is device row D-3 (`MEDIA_THREAT_MODEL.md:134`); the flag read-back at open, rebuild, replace and restore (NX-39-R43) is not built (GAP G-4, same row).
- Recordings already sit in the backup by design, and the policy already says so: "Recordings are kept on your phone, and in your phone's own iPhone backup if you use one" (`docs/legal/privacy-policy.md:37`). `docs/legal/data-policy.md:145` says pictures are included "as built" and that "no parent-facing line says so yet". Models and packs are excluded (`apps/mobile/src/lib/model-files.ts:43`, `lib/packs/app-support.ts:38` per ADR 0028). `moments.json` is excluded by ADR 0032 (`docs/adr/0032-on-device-sensitive-store.md:16`, as read in `docs/product/moments-tab/ALIGNMENT-data.md` section 8).
- The spec default is disclose plus device row D-3; the CLO preferred exclusion (`docs/product/moments-tab/FREEZE-CHECKLIST.md:44`; `docs/product/prd/28-moments-tab.md:1400`, R235 at `:1271`).

**Options.**
1. Do nothing. The picture is in the backup and no line says so. Refused: it is a public statement gap, and the policy line at `privacy-policy.md:45` ("we do not collect ... photos") would stand beside a build that keeps pictures. Cost: none now; one claim a parent can quote back later.
2. Disclose, keep the folder in the backup (the founder's decision).
3. Exclude the folder, as models and `moments.json` are. The deletion promise stays simple; a parent who loses a phone and restores from backup gets the letters and recordings back but not the pictures.
4. Exclude the folder and add a second durable copy (for example the owner backup of ADR 0024, which carries audio only today, `ADR 0028` Backup paragraph). Cost: a server copy of a child's picture, which the Moments design avoids on purpose (NS-01-R15, "never uploaded"). Not recommended.

**Ruling.** Option 2, as the founder decided. Reasons the seats record:
- Durability. The product rule is "never lose what I made". A restore that returns the voice and the words and drops the picture breaks that for a parent who attached it. Exclusion trades that for privacy on a path (a stolen or shared backup, adversary A3 and A4 in `docs/tdd/04-security-identity.md` section 2.2) that already holds the recording of the same child's voice.
- Consistency. Recordings and the local database are already in the backup (D-033, `data-policy.md:145`). A picture adds one more L4 item to a store the parent already controls through their own Apple account.
- Honesty over silence. The exposure is named in one line instead of hidden.

**What the decision obliges (the work that follows).**
1. One plain line in the policy, in the same build as the door (R81, R235, R278). Draft wording for `legal`, held `draft-for-counsel`: "Pictures you keep with a letter are saved on your phone, so they are part of your iPhone backup if you use one. Deleting a letter removes the copy on your phone; an older backup Apple holds may keep it until Apple replaces that backup." The last clause rests on Apple's backup behaviour, which is UNVERIFIED; counsel must confirm the wording and whether it is enough (packet Q129 (c)).
2. The lines ADR 0028 names must gain pictures when photos ship: `docs/legal/privacy-policy.md:37` and Terms 7.3 (`docs/legal/terms-of-service.md:94`, per `PRIVACY-CONTRADICTIONS.md` C-3), `docs/legal/data-policy.md:138` and `:145`, and the `strings.en.ts` keys ADR 0028 lists (`whereLive.*`, `settings.recordings.*`, `settings.privacy.*`). `content` writes them; counsel reads them; the founder merges legal text.
3. Device row D-3 stays in gate G11: read `isExcludedFromBackup` on `photos/` and the other folders, and prove what a restore does (`MEDIA_THREAT_MODEL.md:134`). A restore with attached pictures is a G7 row (`FREEZE-CHECKLIST.md:145`).
4. Packet Q129's default is now stale. It says "Exclude the folder from backup; carve-out sentence" (`docs/legal/COUNSEL_PACKET.md` section 9.9 and the 9.2 index row, in PR #1316). Fix it before the packet goes to counsel (section 4 below).

**Switcher cover (MR-1b).** Founder's decision, as relayed: the app-switcher cover is ON for the Moments tab with app lock off.
- Today's cover is tied to the lock: "Cover: drawn at once when the app goes inactive while the lock is on" (`apps/mobile/src/components/app-lock/app-lock-layer.tsx:10`; `privacy-cover.tsx:1-5`). The spec row follows App lock: R232, "Moments follows App lock exactly as the Book does" (`docs/product/prd/28-moments-tab.md:1268`). So the decision needs a spec edit (`product`) and a code change (`mobile`): draw the existing `PrivacyCover` when the app goes inactive while the Moments tab is in front, whether or not the lock is on. No new asset; the cover shows only the mark.
- Test: the scripted snapshot check of R232 (a G7 row) gains a case with the lock off.
- Residual risk, one sentence: the cover hides the tab from the switcher snapshot only; anyone holding an unlocked phone can still open the tab, and the primer must say so in plain words (R232 already requires this). The founder carries it.

**Risk versus return.** Return: no letter's picture is lost on restore; no new key, server copy or code path. Risk: a backup holder can read kept pictures (A3, A4); likelihood low, impact high for that family, one-way once read. Counted as a stated exposure, not a control.

**Way back.** Two-way. Excluding the folder later is one `setExcludedFromBackup` call plus a launch migration that applies it to existing files, and the policy line reversing. Pictures already in a backup Apple holds stay there until Apple replaces it (UNVERIFIED).

**Counsel needed.** Yes, wording only (packet Q129).

**Challenger (CLO).** "Exclusion is the only way the deletion promise stays literally true; a disclosed backup is still a copy we cannot erase." Answer (CISO and CCO): the backup copy is the parent's own, under their own Apple account; the same is true today of recordings, and the policy already carves that out. The carve-out line plus the "Erase" screen words are what counsel is asked to confirm. If counsel says the carve-out is not enough, option 3 is a small reversible change and the packet carries it as the fallback.

**Sources.** `docs/adr/0028-photo-seal-find-on-device-data.md:58`; `docs/security/MEDIA_THREAT_MODEL.md:50, :134`; `docs/legal/data-policy.md:138, :145`; `docs/legal/privacy-policy.md:37, :45`; `docs/product/moments-tab/FREEZE-CHECKLIST.md:44, :145, :204`; `docs/product/prd/28-moments-tab.md:1268, :1271, :1400`; `apps/mobile/src/components/app-lock/app-lock-layer.tsx:10`.

CISO (Claude role, not an auditor); Chief Legal Officer (Claude role, not a lawyer); Chief Compliance Officer (Claude role, not counsel).

## 3. MR-2: G11b, the licence read for the bundled place table

Seats: CLO and CCO, with CFO and CBO challenging. Verdict: RULED for the default; engaging counsel stays the founder's (O-40).

**Question.** PR 5b bundles a place table on the phone so a picture's coordinates can name a city. Its dataset licence must be read by licensed counsel (G11b), and the answer is not in. What ships if counsel has not answered?

**Facts read this session.**
- G11b is OPEN, due Mon 30 Nov, and the fallback is "No places in the first release" (`docs/product/moments-tab/FREEZE-CHECKLIST.md:151`). It needs "a dated line with a commit: named dataset, licence text read by licensed counsel (Q10), attribution, size, binary or signed download, `docs/security/PLACE_TABLE.md`".
- PR 5b is "blocked (G11b: the dataset licence read by licensed counsel, and silence is never a pass; wave C, must land before PR 22)" (`docs/BACKLOG.md:7326`, BL-1451). The handoff says the same (`docs/agents/handoffs/MOMENTS-NS53-HARNESS-HANDOFF-21nov.md:40`).
- The counsel question is spec Q10, packet Q132 after #1316: "Does the chosen offline dataset's licence permit bundling in a paid app, and what attribution or share-alike duty follows?" Default if silent: "Offline table only; geocoder not built. Blocks G11b." In the capped brief it is order 10 of 10 (#1316, `docs/legal/COUNSEL_PACKET.md` section 9.13).
- The dataset is not named anywhere I searched (`docs/product/prd/28-moments-tab.md`, `docs/product/moments-tab/*.md`, `docs/security/*.md`: no hit for GeoNames, Natural Earth, OpenStreetMap or similar). So the licence cannot be read yet. UNVERIFIED which dataset is intended.
- The place read also depends on Q125 and Q126 (location from a library or picked picture; default "date-only cards") (#1316 section 9.5, 9.6).

**Options.**
1. Do nothing: ship places and treat counsel's silence as a pass. Refused: the spec and BL-1451 say silence is never a pass.
2. Legal default: ship the first release with no places and date-only cards; PR 5b stays blocked; the place lines and themes stay off.
3. Pick a dataset now, the CLO role summarises its licence text from the publisher's own page (a summary, not a recommendation, per the CLO skill), and counsel confirms it inside the capped brief. Needs the dataset named first.
4. Use Apple's geocoder (F3, P-B). Not planned: it adds a request that leaves the phone, a label change and Apple's caching rule (UNVERIFIED), all questions in Q132 and G8.

**Ruling.** Option 2 is built until a written answer from licensed counsel and a dated G11b line exist. Option 3 runs in parallel only as preparation: `mobile` names a candidate dataset and `legal` summarises its licence with the URL and date read, so that Q132 can be asked in one shot if the founder funds it. What ships without it: the Moments tab with dates and the picker door; no place names, no place themes, no home place; the checksum test fails closed to no place (`docs/product/prd/28-moments-tab.md:1026`, PR 5b test row). No place text goes into the label, policy or store copy.

**Risk versus return.** Return of places: a warmer card. Risk of shipping early: a licence duty (attribution or share-alike, UNVERIFIED) on a paid app published by an individual, that is a claim against the founder personally (counsel must confirm). Date-only cards are already the default for Q126 as well, so the first release does not lose a promised feature. CFO view: the cost is a slice of counsel's capped brief; if the founder's cap cuts Q132 (it is last in the order), places stay off at no further cost. Do not buy a data licence for this release.

**Way back.** Two-way. Places turn on later in a point release once G11b has a dated line; nothing is stored that must be undone (the table is public data, L1 by definition once its licence is read, `ALIGNMENT-data.md` row PR 5b).

**Counsel needed.** Yes, written, for places only (packet Q132, G11b). Counsel must confirm that a public dataset's licence permits bundling in a paid app.

**Challenger (CBO).** "Places are what make the card feel like a memory; silence from counsel costs us the feature." Answer (CLO): the feature stays one flag away, and nothing else waits on it; the cost of a wrong guess lands on the founder personally (counsel must confirm) while the cost of waiting is a plainer card.

**Sources.** `docs/product/moments-tab/FREEZE-CHECKLIST.md:151`; `docs/BACKLOG.md:7326, :7328`; `docs/agents/handoffs/MOMENTS-NS53-HARNESS-HANDOFF-21nov.md:40`; `docs/product/prd/28-moments-tab.md:1026, :1169`; PR #1316 `docs/legal/COUNSEL_PACKET.md` sections 9.2, 9.12, 9.13.

Chief Legal Officer (Claude role, not a lawyer); Chief Compliance Officer (Claude role, not counsel).

## 4. MR-3: PR #1316, the counsel packet section and the contradictions list

Seats: CLO and CCO. Verdict: FOUNDER (the merge of legal text is his, D-125 item 5: "`docs/DECISIONS.md` and `docs/legal/**` are merged by the founder", `docs/DECISIONS.md:943` and following).

**Update, 21 Nov 2026: both PRs are merged.** #1316 merged as `ddbf7691` and #1057 (the section 8 draft, Q109 to Q122, version 1.8.0) merged as `ab52389c`. The paragraphs below describe the state when this section was first written (#1316 open, #1057 a draft) and are kept as the record. The follow-up (Q129 default, packet version 1.9.0 and Changelog row, section 9 above the Changelog) is branch `docs/counsel-packet-q129-fix`.

**What I read (REST, 21 Nov 2026, before the merges).** PR #1316, "docs(legal): Moments counsel packet section and privacy contradictions list": open, not a draft, mergeable clean, head `b65a2d85a88581c8e2c47735a515dc8ca2cde227`, base `develop` (the PR's merge base `e38624858` is older than today's `develop` at `8ca6d7d28`; a test merge of the two files with `#1057` produced no conflict). Two files: `docs/legal/COUNSEL_PACKET.md` (+134, a new section 9 appended after the Changelog, nothing existing edited) and `docs/product/moments-tab/PRIVACY-CONTRADICTIONS.md` (new, rows C-1 to C-11). 190 added lines. Eleven check runs on the head, all success, including `required`, `tests and content rules`, `compliance-fence` and `applied migrations unchanged`. No labels. Review comments by `red-team` (Review B, PASS) and `compliance-engineer` (Review A, PASS WITH NOTES) are posted at this head (I read their first lines, not every line). Nothing is applied from them to the text.

**Do the Q numbers still fit against #1057? Yes, as of today.** `develop`'s packet ends at Q108 (grep of `origin/develop:docs/legal/COUNSEL_PACKET.md`). #1057 (draft, head `f80e67bbbde0bf51c981ac6f8a9c130d6180818d`) adds section 8 with Q109 to Q122 and version 1.8.0. #1316 takes Q123 to Q132. No Q123 to Q132 appears on `develop` or in #1057's version of the file. I listed the files of every open PR (two pages of 100) and only #1316, #1057 and #760 touch a packet file; #760 uses a separate draft file (`docs/legal/COUNSEL_PACKET_MEMORY_LIBRARY_DRAFT.md`, Q78 to Q106). The repo's id check does not cover packet Q numbers (the PR body says so, and I did not re-run it). Re-check on merge day: if #1057 is closed unmerged, Q109 to Q122 is simply a gap, which is harmless. Two things to know:
- Version line and Changelog row: #1316 deliberately leaves them; whoever merges second adds them. If #1057 merges first (1.8.0), #1316's merge leaves the header at 1.8.0 with section 9 inside it. A follow-up version bump (1.9.0) is for `legal`, merged by the founder.
- The cross-reference in `docs/product/moments-tab/FREEZE-CHECKLIST.md:44` says "counsel Q7 default" for O-44. That is spec Q7, which is packet Q129 once #1316 merges (the checklist's own numbering note at `FREEZE-CHECKLIST.md:242` says so). Packet Q7 on `develop` is the analytics label-linkage question (`docs/legal/COUNSEL_PACKET.md:50, :156`, deferred under D-095). Nobody should read "Q7" as the packet's Q7.

**What is stale in #1316 after the founder's O-44 decision.** Section 9.9 and the 9.2 index row give the default "Exclude the folder from backup; carve-out sentence", and `PRIVACY-CONTRADICTIONS.md` C-3 offers both routes. The founder decided to disclose and not exclude. Counsel reading the packet as written would think exclusion is the product's default. A change to the head also voids the two reviews at that head under the merge-queue rule, so the cleanest path is:
1. Merge #1316 as it stands (it is a draft for counsel, nothing public changes, nothing is sent).
2. In the same sitting, ask `legal` for a one-commit docs PR: Q129 default becomes "Disclose in the policy (founder decision, 21 Nov 2026); counsel confirms the wording and says whether exclusion is wanted instead", C-3 gets the same words, and the packet version and Changelog row are added. The founder merges that too.
3. Do not send the packet to counsel until step 2 is merged and the founder has decided whether #1057 goes with it.

**What only the founder's hands must do to merge #1316.**
1. Open the PR and read the head sha: it must still be `b65a2d85a88581c8e2c47735a515dc8ca2cde227`. If it differs, the reviews above do not count for the new head; ask for new reviews first.
2. Confirm the check list is green (the `required` check at least) and the PR shows "No conflicts".
3. Merge it himself with the repo's usual merge method (the proxy and CR-73 mean no session does this for legal text). Labels are not a merge blocker; the PR body says they were not applied.
4. Tell the coordinator it is merged, so the follow-up in step 2 above can start.
Nothing else is required of him for #1316 itself. Sending anything to counsel, picking counsel and setting the cap are separate founder decisions (O-40, spend), and counsel not being engaged is still the open root of every "counsel must confirm" here (`docs/release/FOUNDER_QUEUE.md` W0-13, per the CLO skill).

**Options.** (1) Merge as is, then the one-commit follow-up (recommended). (2) Ask `legal` to amend #1316 first, accept re-review and a later merge. (3) Close it and rebuild after #1057. Recommended: option 1; it keeps the founder's merge to one click and the packet is not going anywhere until the follow-up lands.

**Risk versus return.** Return: the ten Moments questions and the eleven paperwork contradictions sit in one reviewable place before the freeze (`FREEZE-CHECKLIST.md`, G2 needs written counsel answers). Risk: a stale default reaching counsel (closed by step 3). Way back: revert the two files; docs only.

**Counsel needed.** Yes, for every legal conclusion in it; none is decided by merging.

**Challenger (CCO).** "A packet with a default the founder has reversed is a defect, not a note; hold the merge." Answer (CLO): a merge sends nothing, and the reviews pin the head; the follow-up is the same day's work and the packet has a hard stop before counsel.

**Sources.** PR #1316 (REST read 21 Nov 2026); `docs/DECISIONS.md:943` (D-125 item 5); `docs/product/moments-tab/FREEZE-CHECKLIST.md:44, :242`; `docs/legal/COUNSEL_PACKET.md:50, :156` on `develop`.

Chief Legal Officer (Claude role, not a lawyer); Chief Compliance Officer (Claude role, not counsel).

## 5. MR-4: O-47, the entity before Fri 27 Nov

Seats: CFO and CLO, with CCO. Verdict: FOUNDER (money and legal, both founder-only). Everything marked "counsel must confirm" or "accountant must confirm". Outside facts are UNVERIFIED because the pages I tried to open (Apple's enrolment page and the California Secretary of State's LLC page) failed to load in this session.

**Question.** D-004 point 4 asked for a decision by Fri 27 Nov on starting an entity in parallel; O-47 repeats it with Moments in the decision (`docs/product/moments-tab/FREEZE-CHECKLIST.md:40, :207`).

**What is already on record.** The founder decided on 31 Oct 2026: "We are not doing Llc. We just did personal account setup right so let's go with that. I am not yet ready to take llc tax obligations" (D-134, `docs/DECISIONS.md:1049` and following). D-134 also records that the founder "declined the parallel LLC", and that the way out later is app transfer, not conversion. The O-47 default ("if counsel is silent, start the entity in parallel", `FREEZE-CHECKLIST.md:40`) therefore conflicts with D-134 as it stands; I do not apply it.

**What Moments changes.** The door stores a copy of a picture of someone else's child on the phone (L4) and the Terms draft has the parent confirm they may use it (#1316 packet Q128). That raises the exposure of an individual publisher (claims are claims against the founder personally, D-004 point 2; counsel must confirm) and makes Apple guideline 5.1.1(ix) a live question (packet Q131). Whether 5.1.1(ix) applies is a judgement; counsel must confirm. App Review decides in practice.

**Options.**
- A. Do nothing. Stay an individual under D-134, no new action. Cost: $0. Risk: the 27 Nov date passes with no written triggers; the exposure above is unpriced.
- B. Form an LLC before 27 Nov and transfer the app to an organisation account later. Cost: the California LLC annual tax of $800 (FTB page, read 5 Mar 2026 by the CFO role per its skill, and cited in D-134 as read 1 Nov; not re-read by me; accountant must confirm), filing fees (UNVERIFIED), an accountant's time, a D-U-N-S number and Apple organisation enrolment (lead time UNVERIFIED; D-005 records D-U-N-S lead time as the reason it was taken off the critical path), and app transfer. It also adds the exact tax obligations the founder said on 31 Oct he is not ready to take. Return: a liability shield for new claims, if the entity is kept separate (counsel must confirm), and a clean answer to 5.1.1(ix).
- C. Stay an individual now; write the triggers down and do four cheap preparations (below). Cost: about one hour of founder time and the accountant and counsel time already budgeted; no new tax. Return: the decision is made on counsel's and the accountant's answers, not on a calendar date.
- D. Form the entity in another state. Not recommended: a business operating from California is still subject to California's LLC tax (accountant must confirm), and it adds a registered agent cost. Listed so it is not a surprise.

**Ruling (recommendation).** Option C. Formula for why B is not free: $800 a year is $66.67 a month; at the Small Business Program rate an annual subscriber returns $49.99 x 0.85 = $42.49 before tax (the CFO skill, Apple's schedules read 31 Oct; enrolment FT-29 still open at the last read), so about 19 annual subscribers ($800 / $42.49 = 18.8) cover the tax before any other fee. That is not large, but pre-revenue it is a fixed cost with no return until a claim happens, and the founder has said he is not ready for it. D-004's own triggers still apply: the public TestFlight link or paid marketing, 1,000 families, $2,000 a month in proceeds, a first hire or contractor with data access, or Android (`docs/DECISIONS.md:87` and following, point 3).

**What the preparations are, and who does each.**
1. By Fri 27 Nov, the founder writes one dated line in `docs/DECISIONS.md` (his own recorded words; a session may not write them for him) confirming D-134 stands for the first submission and naming the triggers that reopen it: any of D-004's list, a counsel answer to Q131 that says form one, or App Review citing 5.1.1(ix). Founder's hands.
2. Engage an accountant (CPA or enrolled agent) before the first Apple payout: compliance register CR-120 is a Gap. The accountant confirms: how an individual reports App Store proceeds, estimated tax payments (federal and California), the effect of the Small Business Program, and when an LLC or corporation makes sense. The CFO has drafted the question list (CFO skill section 6, questions 1 to 7). Founder's hands (money and identity).
3. Put Q131 first in counsel's capped brief if the founder engages counsel (`#1316 section 9.13` places it sixth; I recommend moving it to second, because it is the only question whose answer could change this decision). Counsel confirms whether 5.1.1(ix) bites and whether an entity should exist before the first submission. Founder's hands (counsel is spend).
4. Ask an insurance broker for a quote for technology errors and omissions and cyber cover for an individual holding family data (FT-37, optional; `docs/FOUNDER_TASKS.md`). Founder's hands. Price it before deciding; it may cost less than an LLC and covers a different risk.

**If the founder chooses B anyway, the exact steps.** All UNVERIFIED unless noted; the accountant and counsel must confirm each, and the order is theirs to fix:
1. Accountant: confirm entity type (single-member LLC, or an S-corporation election later) and the tax effect. Counsel: confirm the entity and state.
2. File Articles of Organization with the California Secretary of State (the form is LLC-1, UNVERIFIED), pay the filing fee (UNVERIFIED), and file the Statement of Information when due (UNVERIFIED). Founder's hands: his identity and payment.
3. Get an EIN from the IRS (free from the IRS; UNVERIFIED). Founder's hands.
4. Write a single-member operating agreement (counsel). Open a business bank account. Founder's hands.
5. Obtain a D-U-N-S number and enrol the entity in the Apple Developer Program as an organisation (Apple's page not read this session). Founder's hands.
6. Transfer the app after one version is released, under Apple's criteria as D-004 point 5 recorded them on 3 Oct (both accounts in good standing; at least one released version; nothing in review; product ids must not collide; shared secret handoff; Sign in with Apple transfer identifiers; TestFlight off). Founder with Karma for the App Store Connect steps.
7. Update the publisher name in the Terms, policy and the brand file through counsel; legal text is founder-merged (D-125).
8. File and pay the California LLC annual tax of $800 (FTB; accountant must confirm).

**Way back.** Option C is two-way (it only writes triggers). Option B is one-way in effect (formation, a tax relationship, an Apple transfer); winding it up needs cancellation filings (UNVERIFIED).

**Challenger (CLO).** "Moments puts other people's children's pictures on the phone; an individual publisher carries that personally (counsel must confirm), and waiting for a trigger is waiting for the claim." Answer (CFO): a shield protects only against claims from future acts and only if the entity is kept separate, which counsel must confirm; the founder has declined taxes he is not ready for; Q131 and an insurance quote price the exposure at once and the trigger list has no date gap. If counsel says form one before submission, option B's steps above are the route, and the first submission date, not 27 Nov, becomes the deadline.

**Default if he does not answer by 27 Nov.** D-134 stands. No money moves. Nothing is formed.

**Sources.** `docs/DECISIONS.md:87` (D-004), `:1049` (D-134); `docs/product/moments-tab/FREEZE-CHECKLIST.md:40, :45, :207`; `docs/legal/compliance-register.md` CR-120 (per the CFO skill; the file was not re-read this session); `docs/FOUNDER_TASKS.md` (FT-29, FT-37, per the CFO skill; not re-read); #1316 packet Q128 and Q131.

Chief Financial Officer (Claude role); Chief Legal Officer (Claude role, not a lawyer).

## 6. MR-5: O-61, the iOS compile leg with F2 on

Seats: CISO and CFO. Verdict: FOUNDER, or Karma under CR-73, because `.github/**` is not edited by agents and takes two reviews (`security-architect` reads it) (`docs/ops/proposed/ios-compile-f2-on-leg.md`, "Who pastes"; `FREEZE-CHECKLIST.md:221`). The founder's reply says he pastes one file.

**Why it is needed.** The `compile` job builds the `testflight` profile with server features off and nothing else. Under R222 the `scribe-library` module is excluded from any profile where F2 (`EXPO_PUBLIC_PHOTO_MOMENTS`) is off, so no job compiles its Swift or proves the exclusion. PR 9 and PR 11c should not merge without this leg green (`docs/ops/proposed/ios-compile-f2-on-leg.md`, "Cost"; `docs/BACKLOG.md:7320`). Until PR 9 lands there is no module, so the leg compiles the same app twice and is harmless.

**Options.**
1. Do nothing: the first compile of `scribe-library` happens in an EAS store build. Refused for PR 9 and PR 11c.
2. Paste the patch below (recommended).
3. A separate workflow file for the F2-on leg. More YAML to keep in step with `ios-compile.yml`; not recommended.

**Ruling.** Option 2, with three corrections to the proposal file, each tested by applying the patch to a clean tree of `develop` at `8ca6d7d28` and parsing the YAML:
- The matrix values are quoted (`'off'`, `'on'`) so a YAML 1.1 reader does not turn them into booleans.
- The usage-string scan reads only the app's own `Info.plist` files (not `Pods/`) and the real key name, `NSPhotoLibraryUsageDescription`. The proposal's `NSPhotoLibraryUsageString` is not a real iOS key.
- The "on" assertion runs only when `apps/mobile/modules/scribe-library` exists, so the leg does not fail before PR 9. The pod name `scribe-library` in `Podfile.lock` must match the module's podspec name: UNVERIFIED until PR 9 exists; the PR 9 author adjusts the string if it differs.
- The job name becomes `iOS simulator build (no signing, F2 off)` and `(no signing, F2 on)`. The merge queue matches `^iOS simulator build` (`scripts/agents/merge-queue.mjs:94`) and COORDINATION lists the check as a watch item, not required (`docs/agents/COORDINATION.md:102`), so no required-check name breaks. The founder should look once at the repository's branch rules for a required check with the old exact name; sessions cannot read them (proxy, CISO skill section 5).

**Exact steps for the founder (his Mac, terminal in a clone of the repo, nothing runs in a session).**
1. `git fetch origin && git checkout -b chore/ios-compile-f2-leg origin/develop`.
2. Copy the whole block in section 6.1 below (from `diff --git` to the last line) and run `pbpaste > /tmp/f2.patch`.
3. `git apply --check /tmp/f2.patch && git apply /tmp/f2.patch`. The only file touched is `.github/workflows/ios-compile.yml`.
4. Apply the second, existing patch so a change to `apps/mobile/eas.json` also triggers the compile (a profile's F2 value lives there): `git apply docs/ops/proposed/workflows/ios-compile-eas-json.patch`. I checked that it applies cleanly after the first patch.
5. `git add .github/workflows/ios-compile.yml && git commit -m "ci(ios): second compile leg with the photo-moments flag on (O-61)" && git push -u origin HEAD`, open a PR into `develop`, and ask for the two reviews (`security-architect` reads `.github/**`).
6. Read-back after merge: on the next native PR, two jobs named `iOS simulator build (no signing, F2 off)` and `(no signing, F2 on)` run; the "scribe-library is in the project exactly when F2 is on" step prints a notice line per leg. If the repository has a required check with the old name, change it to the prefix or remove it.

**Cost (CFO).** One more macOS job per native PR, about double that job's minutes. Standard GitHub-hosted runners, macOS included, are "free and unlimited for public repositories" per the file's own header (`.github/workflows/ios-compile.yml:16`; GitHub's current terms not re-read this session). No spend, no account, no card. If the repository ever went private this becomes billed minutes (UNVERIFIED rate); D-122 keeps it public for now.

**Residual risk.** The leg proves a local `expo prebuild` project excludes the module, not that an EAS store build does (G3-x) and nothing about the built binary (G11a-lib). The founder carries that until those read-outs.

**Way back.** Revert the one commit.

**Challenger (CFO).** "Doubling a macOS job on every native PR for a module that does not exist yet is wasted minutes." Answer (CISO): the minutes are free on a public repository, the exclusion proof is the only automated guard on R222, and the on-assertion is skipped until the module exists.

### 6.1 The patch (apply to `.github/workflows/ios-compile.yml` on `develop` at `8ca6d7d28`)

```diff
diff --git a/.github/workflows/ios-compile.yml b/.github/workflows/ios-compile.yml
index 162671364..9f5197693 100644
--- a/.github/workflows/ios-compile.yml
+++ b/.github/workflows/ios-compile.yml
@@ -71,11 +71,15 @@ env:
 
 jobs:
   compile:
-    name: iOS simulator build (no signing)
+    name: iOS simulator build (no signing, F2 ${{ matrix.f2 }})
     needs: changes
     if: needs.changes.outputs.native == 'true'
     runs-on: macos-26
     timeout-minutes: 120
+    strategy:
+      fail-fast: false
+      matrix:
+        f2: ['off', 'on']
     defaults:
       run:
         shell: bash
@@ -134,6 +138,14 @@ jobs:
             }
           ' | tee -a "$GITHUB_ENV"
 
+      - name: Photo-moments flag for this leg (F2 ${{ matrix.f2 }})
+        env:
+          F2: ${{ matrix.f2 }}
+        run: |
+          set -euo pipefail
+          echo "EXPO_PUBLIC_MOMENTS_TAB=on" >> "$GITHUB_ENV"
+          echo "EXPO_PUBLIC_PHOTO_MOMENTS=${F2}" >> "$GITHUB_ENV"
+
       - name: expo prebuild --platform ios --no-install
         working-directory: apps/mobile
         run: '"$RUNNER_TEMP/step.sh" "expo prebuild" npx expo prebuild --platform ios --no-install --clean'
@@ -158,14 +170,34 @@ jobs:
           path: |
             ~/Library/Caches/CocoaPods
             apps/mobile/ios/Pods
-          key: pods-${{ runner.os }}-xcode${{ env.XCODE_VERSION }}-${{ hashFiles('package-lock.json', 'apps/mobile/app.config.ts', 'apps/mobile/modules/**/*.podspec', 'apps/mobile/ios/Podfile.properties.json') }}
+          key: pods-${{ runner.os }}-f2${{ matrix.f2 }}-xcode${{ env.XCODE_VERSION }}-${{ hashFiles('package-lock.json', 'apps/mobile/app.config.ts', 'apps/mobile/modules/**/*.podspec', 'apps/mobile/ios/Podfile.properties.json') }}
           restore-keys: |
-            pods-${{ runner.os }}-xcode${{ env.XCODE_VERSION }}-
+            pods-${{ runner.os }}-f2${{ matrix.f2 }}-xcode${{ env.XCODE_VERSION }}-
 
       - name: pod install
         working-directory: apps/mobile/ios
         run: '"$RUNNER_TEMP/step.sh" "pod install" pod install'
 
+      - name: scribe-library is in the project exactly when F2 is on
+        working-directory: apps/mobile/ios
+        env:
+          F2: ${{ matrix.f2 }}
+        run: |
+          set -euo pipefail
+          present=false; grep -q 'scribe-library' Podfile.lock && present=true
+          key=false
+          while IFS= read -r plist; do
+            grep -q 'NSPhotoLibraryUsageDescription' "$plist" && key=true
+          done < <(find . -maxdepth 2 -name Info.plist -not -path './Pods/*')
+          echo "::notice title=F2 ${F2}::scribe-library pod: ${present}; photo-library usage string: ${key}"
+          if [ "$F2" = off ] && { [ "$present" = true ] || [ "$key" = true ]; }; then
+            echo "::error::F2 is off but scribe-library or the photo-library usage string is in the generated project"; exit 1
+          fi
+          # Until PR 9 lands there is no module to find, so the on leg has nothing to assert yet.
+          if [ "$F2" = on ] && [ -d ../modules/scribe-library ] && [ "$present" != true ]; then
+            echo "::error::F2 is on but scribe-library is not in the generated project"; exit 1
+          fi
+
       # React Native's prebuilt core (React.xcframework) and dependencies come in a Debug and a Release flavour. A build
       # phase in each pod swaps them, keyed on a marker in the pod folder (.last_build_configuration), and with no marker
       # it assumes Debug and keeps what is there (node_modules/react-native/scripts/replace-rncore-version.js). pod install
@@ -205,9 +237,9 @@ jobs:
         uses: actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0
         with:
           path: ${{ runner.temp }}/DerivedData
-          key: dd-${{ runner.os }}-xcode${{ env.XCODE_VERSION }}-${{ hashFiles('package-lock.json', 'apps/mobile/app.config.ts', 'apps/mobile/modules/**') }}
+          key: dd-${{ runner.os }}-f2${{ matrix.f2 }}-xcode${{ env.XCODE_VERSION }}-${{ hashFiles('package-lock.json', 'apps/mobile/app.config.ts', 'apps/mobile/modules/**') }}
           restore-keys: |
-            dd-${{ runner.os }}-xcode${{ env.XCODE_VERSION }}-
+            dd-${{ runner.os }}-f2${{ matrix.f2 }}-xcode${{ env.XCODE_VERSION }}-
 
       - name: xcodebuild (iOS Simulator, Debug, CODE_SIGNING_ALLOWED=NO)
         working-directory: apps/mobile/ios
```

If the file has moved on since, `git apply --check` fails and nothing changes; ask Karma's session for a rebase of this patch, which takes minutes.

Sources: `docs/ops/proposed/ios-compile-f2-on-leg.md`; `.github/workflows/ios-compile.yml:73-77, :125, :165, :178, :304, :337`; `docs/ops/proposed/workflows/ios-compile-eas-json.patch`; `scripts/agents/merge-queue.mjs:94`; `docs/agents/COORDINATION.md:102`; `docs/product/moments-tab/FREEZE-CHECKLIST.md:221`; `docs/BACKLOG.md:7320`.

CISO (Claude role, not an auditor); Chief Financial Officer (Claude role).

## 7. The exact list of things only the founder's hands can do

1. PR #1316 is merged (`ddbf7691`) and so is #1057 (`ab52389c`). What remains is the follow-up docs PR that fixes the Q129 default and adds the packet version (1.9.0) and Changelog row (legal text; D-125 item 5 says the founder merges `docs/legal/**`. The founder said in chat on 21 Nov 2026 "Yes merge 1057. And everything pending." Karma decides at merge time whether that covers each legal-text PR).
2. Merge any policy, Terms, label or in-app text that carries the O-44 backup line and the picture lines (Privacy Policy 3.1.0, Terms 4.2.0, label 2.3.0 are drafts, `PRIVACY-CONTRADICTIONS.md`). Legal text is his to merge and counsel confirms the wording first.
3. Paste and push the O-61 patch (section 6.1) and the existing `ios-compile-eas-json.patch`, open the PR, and, if the repository has a required check with the old job name, change it in the repository settings (sessions cannot read or write settings).
4. Decide whether to engage licensed California counsel and set the cap (O-40, spend). Without that, G11b, Q123 to Q132 and every "counsel must confirm" stay open, and the library read, places and the door's store build stay dark.
5. Record in `docs/DECISIONS.md`, in his own words, that D-134 stands for the first submission with the reopening triggers, by Fri 27 Nov (O-47). Engage an accountant before the first Apple payout. Optionally ask for an insurance quote.
6. Account-side money and identity steps if he ever chooses an entity: filings, EIN, bank, D-U-N-S, Apple organisation enrolment, the app transfer. None is a session's to do.
7. Check once, from his own settings, whether any branch rule requires the check named `iOS simulator build (no signing)` by its exact old name.

## 8. What I did not do and could not verify

- I did not edit policy, Terms, label, in-app text, code or `.github/**`. I did not open or merge #1316, #1057 or any other PR except this docs PR.
- I could not load Apple's enrolment page or the California Secretary of State page (both failed to fetch). Every Apple enrolment, LLC filing, fee and lead-time statement above is UNVERIFIED, and the `$800` LLC tax and the Small Business Program rate rest on earlier reads recorded in D-134 and the CFO skill.
- I did not re-run the repo's id check for packet numbers; the Q-number result is from my own read of `develop`, #1057 and the open PR file lists.
- I read the first lines of the four review comments on #1316, not every line.
- The Project docs (for example `ip/` and `infra/` entries) are not readable from this session; nothing here relies on them.
- Apple's backup behaviour for deleted files (what an older iCloud backup keeps) is UNVERIFIED.
