# Moments pictures: privacy engineering drafts and the legal-set checklist

Status: DRAFT for `legal`, counsel and the founder. Written by `compliance-engineer` (an AI engineering role, not a lawyer). Not legal advice. Nothing here is applied: no policy, Terms, label, string, data-policy row or classification row is edited by this file. Every legal reading is an engineering reading, counsel must confirm.
Date: 21 Nov 2026. Revised 22 Nov 2026 (section 9: review notes and the locks since). Read against `origin/develop` `f59e000def85b0a5d561b6588b6669bf173cb12c`. Line numbers drift; each was read on that commit and must be re-checked before use.
Convention: `docs/legal/` has no `proposed/` folder yet, so this file starts one, beside the `docs/agents/exec/proposed/` and `docs/ops/proposed/` precedent. `docs/legal/*` drafts are founder-merged (D-125 item 5).

Inputs read: `docs/agents/exec/proposed/moments-rulings-security-legal-money.md` (MR-1, O-44 DECIDED by the founder: disclose in one plain line, do not exclude the folder); `docs/legal/COUNSEL_PACKET.md` section 9 (Q123 to Q132) and Q43, Q45, Q48, Q51, Q54; `docs/product/moments-tab/PRIVACY-CONTRADICTIONS.md` (C-1 to C-11); `docs/product/moments-tab/ALIGNMENT-data.md`; `docs/product/moments-tab/FREEZE-CHECKLIST.md`; `docs/product/prd/28-moments-tab.md` rows R72, R81, R97, R162, R166, R235, R240, R250, R266, R278; `docs/ops/LABEL_GUARD.md`; `docs/reviews/2026-10-claims-inventory.md`.

## 0. What the founder decided, and what stays open

- Decided (founder, 21 Nov 2026, as recorded in the MR-1 ruling file): O-44 is disclose, not exclude. Kept picture copies stay in the iPhone backup. One plain line says so. Counsel confirms the wording (packet Q129).
- Open: O-52 (the picker door follows the photo flag and ships only with its legal set, `FREEZE-CHECKLIST.md:53`), counsel's answers, and whether `labels{}` is exported (R250, `ALIGNMENT-data.md` G4; default is the plain statement "stays on this phone").
- Fact I could not verify: what Apple does to an older iCloud backup when a newer one replaces it. Both draft lines below that mention this rest on it. UNVERIFIED. Counsel or `legal` must read Apple's own page before the wording is used.

## 1. O-44: the one plain line (draft)

### 1.1 Policy line (Privacy Policy 3.1.0, section 2, replacing `privacy-policy.md:37`)

Current text (read at `privacy-policy.md:37`): "Your recordings. Recordings are kept on your phone, and in your phone's own iPhone backup if you use one. Today they are not copied to our servers. Once recording backup is available, they will be copied only if you turn it on, and only in encrypted form (section 4)."

Draft, to add as its own short paragraph after it (so recordings and pictures read as two plain facts, not one run-on):

> **Pictures you keep with a letter.** These are saved on your phone, so they are part of your iPhone backup if you use one. We do not receive them.

"We do not receive them" is the form the spec asks for (say what we receive, never where something lives: H-11, R135). It is true only while no picture, thumbnail or derived signal is sent (NS-01-R15, the push mapper sends `photo_path: null`). The claims row in section 5 ties it to that test. Counsel must confirm.

### 1.2 Deletion clause (Privacy Policy section 7, after the "A letter." bullet at `privacy-policy.md:113`)

Section 7 today has no backup sentence for recordings either, so this one closes both:

> **Backups on your phone.** If you use iPhone backup, an older backup may still hold a letter's recording or picture after you erase it here, until a newer backup replaces it. We cannot change a backup Apple holds for you.

The founder-ruling draft ended "an older backup Apple holds may keep it until Apple replaces that backup". Mine drops "until Apple replaces" into "until a newer backup replaces it", which is the same claim in fewer words and has the same UNVERIFIED base (Apple's replacement behaviour). Counsel's Q129 (a) and (c) decide whether this carve-out is enough or whether exclusion is wanted.

### 1.3 Terms 7.3 (Terms 4.2.0, replacing `terms-of-service.md:94`)

Current: "...Recordings are kept on your phone, and in your own iPhone backup if you use one. We cannot bring back a recording that was only on a phone you no longer have. Please keep your own copy."

Draft: "Recordings and the pictures you keep with letters are kept on your phone, and in your own iPhone backup if you use one. We cannot bring back a recording or a picture that was only on a phone you no longer have. Please keep your own copy."

Note for `legal`: a picture is also not in the owner backup (audio only, ADR 0028 Q4) and not in the book export yet (BL-933). The sentence "export everything" in the same clause (7.3) is then wrong for pictures until BL-933 ships; see checklist row 13.

### 1.4 In-app lines that carry the same promise (`content` words them; `legal` reads)

Keys named in ADR 0028 `:59` and re-read on `develop`: `whereLive.onPhone`, `whereLive.onPhoneSynced`, `whereLive.iphoneBackup.body` (`strings.en.ts:1433`, "Includes your recordings, if iCloud Backup is on."), `settings.recordings.onPhoneBody` (`:841`) and `.onPhoneBodyBackupOff` (`:844`), `settings.privacy.iphoneBackup` (`:1046`, same words). Draft for both `iphoneBackup` lines, in the glossary vocabulary:

> Includes your recordings and the pictures you keep with letters, if iCloud Backup is on.

The key text holds a comment (`:1043-1044`) that the wording stays recordings-only "until the device restore drill passes" (CCO-8). That is device row D-3 plus the G7 restore row. Do not widen the line before that drill is on record.

## 2. The deletion-screen backup line (R97, R235)

R235 says the policy and the deletion screen both say a stored copy is part of an iPhone backup. What the screens say today:

- Erase everything (`strings.en.ts:952`, `backups`): "Exports you already saved, and backups of this phone such as iCloud Backup, are not changed." This is already true for pictures and needs no change; it is the model for the others.
- Erase now on one letter (`:889`, `eraseNowBody`): "The letter and its recording are erased for good." A picture is not named, and "for good" stands beside a backup copy. This is the line that needs the clause.
- Delete account (`pages.en.ts:240` and `docs/legal/delete-account-page.md:48`): "Your letters, recordings and photos are removed from every book". Pictures never reach a server, so for pictures this is true only of the phone and the book on it. Needs the backup clause and a scoped verb.

Draft for `eraseNowBody` when the letter has a picture (R97 also wants one plain sentence that pictures in a letter are copies, and that the library is untouched):

> The letter, its recording and its picture are erased from this phone. The picture in your Photos library is not touched. A backup of this phone that was made earlier may still hold them.

Scope (review note, section 9): this line is true as written only for a letter that was never shared or synced. For a synced book, the letter itself goes by the sync and purge rules and a co-parent's phone keeps its own picture copy until that phone applies the change; `legal` and `content` must say which words the sheet shows for a synced letter. No picture was ever uploaded (NS-01-R15), so the server holds none to erase. Recently deleted (30 days) also holds the picture; its Shown line must name it, and the picture is gone from the phone only at the 30 day purge or Erase now.

Shown, Records, Never, Decline (PRIV-R21 form; this line asks no agreement, so it records nothing):
- Shown: the line above, on the Erase now sheet and on Recently deleted (where the picture stays for 30 days), only when the letter has a picture.
- Records: nothing.
- Never: wording that says a backup was erased, or that a copy "cannot exist".
- Decline: the person taps Cancel; nothing is erased.

Test owed with the string (`content`): a rules test that the line renders only with a picture, and the erase tests that already exist (`apps/mobile/test/erase-all.test.ts`, `export-device-cleanup.test.ts`) gain a case that the photo file and `entry_media` row go (R97). I grepped both file names exist on `develop`; I did not open them for a photo case, so "gains a case" is an ask, not a verified fact.

Engineering note for `privacy` (not a claim): restoring an older iPhone backup puts back the whole app container, so an erased letter returns with its picture and its recording, as it does today for recordings. For a synced book the purged-id rule applies on the next sync (DSR-R09, `pending PR #32`, `not yet` on `develop`). This belongs in the G7 restore row (`FREEZE-CHECKLIST.md:145`), not in parent-facing text.

## 3. Privacy label (App Store nutrition label) consistency impact

Source read 21 Nov 2026: Apple, App Privacy Details (`https://developer.apple.com/app-store/app-privacy-details/`). Apple defines "collect" as "transmitting data off the device in a way that allows you and/or your third-party partners to access it for a period longer than what is necessary to service the transmitted request in real time", and says "Data that is processed only on device is not 'collected' and does not need to be disclosed in your answers. If you derive anything from that data and send it off device, the resulting data should be considered separately." Engineering reading, counsel must confirm (packet Q123, Q54).

Effect by feature, label of record `app-store-privacy-labels.md` 2.2.0 (`:50` Location "No", `:54` Photos or Videos "No", `:84` build-state table, `:117` permission table, `:127` checklist):

| Feature | Moves any row of the label? | Why, and the condition |
|---|---|---|
| F1 the picker door (stripped copy kept on the phone, never uploaded) | No, on my reading. Photos or Videos stays "No" if counsel agrees | Nothing is transmitted. The condition is the sync test: `enqueueEntryUpsert`, the pull merge and the push mapper never read `entry_media`, and `photo_path` is always null (ADR 0028 Sync). A later multi-picture or upload path moves the row at once. The note "No photo feature in v1.0" (`:54`) becomes false the day the door ships even if the answer holds (C-4) |
| F2 the library read (date, time, place read in memory, on the phone) | No on my reading for Photos or Videos and Location, if counsel agrees "read only on device" is not "collect" | Apple's on-device line above. It needs a usage string in the F2 profile (`:117` "Not used" becomes false for F2, C-7). The privacy manifest must still equal the collected types for the build (`:130` area, section 4) |
| Local-only `labels{}` (the parent's typed words, max 60 characters, in `moments.json`) | No row | It is the parent's words, L4, on the phone, excluded from backup (ADR 0032 decision 2) and from the export by the R250 default. It is a User Content type only if it leaves the phone. Nothing reads it into the outbox, pull merge, push mapper or export (R162; canary of R257) |
| iPhone backup of the picture copy | Not a collection by us on my reading; counsel to say | The copy goes to the person's own Apple account. The same holds today for recordings and the label does not list it. Packet Q123 (d) and Q129 (a) |
| F3 an Apple geocoder (not planned) | Yes if built: a request leaves the phone | Out of scope; Q132 |

Things that would break label consistency and must fail loud:
1. A build where F1 or F2 is on and the label still says "No photo feature" in its Why column. Fix text, not answer (C-4).
2. A whole-app "nothing collected" label or store claim. Never written: five types are answered Yes (C-4). Locked as CPrivO-10 and CPrivO-12 (section 9).
3. A usage string present in a profile where F2 is off (R72, G11(a)). `scripts/release/label-effect.mjs` flags a new usage string in `app.config.ts` (G11-3) and added lines that call the network and name a picture (G11-1a). It never decides the label and does not read on-device code (`docs/ops/LABEL_GUARD.md`), so the sync test above is the real control, owner `mobile` with `privacy`.
4. The record: the PR that flips either flag names a D-id on the base branch whose section names the label, and `app-store-privacy-labels.md` changes in the same PR (`LABEL_GUARD.md` record rule). That means label 2.3.0 is merged before or with the flip, not after.

## 4. Data map and classification rows (R250; home PR 8; gate G11c)

`docs/legal/data-map.yaml` does not exist (BL-016 deferred); the inventory of record is `DATA_CLASSIFICATION.md` section 4.6 plus `data-policy.md` 4.4 (DATA-REQ-001). Rows proposed, for `data-architect` to merge in PR 8 with the code (PRIV-R01: level, purpose, retention, deletion path, deletion test). I do not edit `DATA_CLASSIFICATION.md`.

Already present, no new row, only the sentence updates named in section 6: kept picture copies, `Caches/ImagePicker` and `Caches/ScribePhoto`, smaller copies (`DATA_CLASSIFICATION.md` 4.6; `data-policy.md:155-156`, `:172`).

New rows for 4.6 (device files), and a matching row for `data-policy.md` 4.4:

| Element | Level | Purpose | Retention | Deletion path | Deletion test | Note |
|---|---|---|---|---|---|---|
| Moments store `Application Support/moments/moments.json` (path per ADR 0032, which is Proposed and must be amended or replaced, R250) | L4 for the whole file (highest class wins) | Remember which days the parent said "not this one", their own day labels, hidden places, a home place | Until the parent clears it, Erase everything, or the app is deleted | Clear in Moments settings; `eraseDeviceFiles`; Erase everything (`erase-everything.ts`) | `erase-all.test.ts` case: file absent after erase | Excluded from the iPhone backup with a read-back (ADR 0032 decision 2); never synced; never in any export unless the founder decides otherwise |
| `dayKeys[]` | L4 | Local ISO dates | as file | as file | schema test (R221) | Dates only, no zone |
| `labels{}` | L4 | Parent's own words per day, 60 characters | as file | as file | canary: a child name in a label leaves 0 hits in logs, analytics, breadcrumbs, outbox, push mapper, export | Highest-risk field: can hold a child's name. Free text, so PRIV-R10 applies. Open: exported as a labelled section, or stated as phone-only (default) |
| `hiddenPlaces[]`, `homePlace` | L4 | Hide a place; the one home place | as file | as file | as above | External place ids, no readable name; home place is a family location |
| `owner` | L2 (opaque local id, never a person id) | Fail closed on a different owner | as file | as file | owner mismatch test | `ALIGNMENT-data.md` says its derivation is not specified: UNVERIFIED |
| `v`, unknown fields | L2; unknown fields L4 by default | Version | as file | as file | R221 tests | An unknown field has no level today; say L4 |
| Bundled place table (PR 5b) | L1 | Name a city on the phone | App life | App update | none | Add after the licence is read (Q132, G11b) |
| Settings keys (primer answered, nudges) | L2 | Remember a choice | Until changed, Erase everything | settings erase | existing settings erase test | No row found for these keys on `develop` (UNVERIFIED, I did not grep each key) |
| Temporary located original (G11c, FREEZE-CHECKLIST `:152`) | L4 | A pick in flight | Until next launch sweep | launch sweep, Erase everything | D-4 device row | Already a 4.6 row; G11c asks the "gains" sentence |

Memory-only items (coordinates, place ids, thumbnails the library read computes) are not an inventory element; the inventory carries one note that they are never persisted, which the R162 canary proves.

Server side: no new table, column, bucket or function. `supabase/tests/classification.test.mjs` reads `public` columns only, so there is nothing for it to check, and the 4.6 rows are manual (`ALIGNMENT-data.md` section 5). `entry-photos` bucket stays empty and its client insert policies are dropped by BL-870 (`data-policy.md` 4.3).

## 5. Claims-inventory rows needed

The register named by PRIV-R17 (`docs/legal/CLAIMS.md`, WS-19) does not exist. The only inventory is `docs/reviews/2026-10-claims-inventory.md` (28 Oct 2026, read-only snapshot, 107 rows, ids A, E, L, K). Proposed rows below use a new `M` prefix for the Moments tab, to be added to whichever register the founder picks (open thread in my MEMORY). Verdict starts "unverified" until the named test exists; none of these may go live before it does (PRIV-R17).

| Id | Claim (proposed words) | Where it will show | Code path and test that must make it true | Status | Counsel |
|---|---|---|---|---|---|
| M1 | "We do not receive them" (pictures kept with a letter) | Privacy 3.1.0 section 2 | `photo_path: null` in the push mapper; `entry_media` never read by outbox or pull; test named in ADR 0028 Sync | unverified until test merges | Q123, Q130 |
| M2 | Pictures are in your iPhone backup if you use one | Privacy 3.1.0 section 2, Terms 7.3, `whereLive.*`, `settings.privacy.iphoneBackup` | No exclusion call under `apps/mobile/src/lib/photos/` (ADR 0028 `:58`, grep at `39efe1ac`); device row D-3 read-back | true on code, unverified on device (D-3) | Q129 |
| M3 | An older backup may keep an erased letter or picture | Privacy section 7, Erase now sheet | none (a statement about Apple's behaviour) | unverified (Apple behaviour) | Q129 |
| M4 | Erase now / Let it go / Erase everything removes the picture file and its row | Erase sheets, Privacy section 7 | `erase-everything.ts`, launch sweep; `erase-all.test.ts` and a picture case (R97) | unverified until the case exists | Q51 |
| M5 | "The picture in your Photos library is not touched" | Erase now sheet | no `PHAssetChangeRequest` or `performChanges` (G11(a) binary scan) | unverified until the scan runs | Q123 |
| M6 | "{app} reads the date, time and place of your pictures, on this phone and only while Moments is open" | Primer (variant A), purpose string | `scribe-library` source read; zero-residue canary (R162); allow-listed profile only | unverified; F2 dark | Q123, Q125, Q126 |
| M7 | Phone-only primer answer; no server consent row | Primer; deletion and access answers (R166) | Record built per PRIV-R21 on the phone; no server write | unverified | Q123 (b), Q48 |
| M8 | "Only on this phone." fact row for photo moments (C-S23) | Me, Privacy | true only while M1 holds and F3 is not built; scoped to build and mode, never "never leaves the phone" or "we hold nothing" (H-11, EXH-LEG-3) | unverified | Q43, Q130 |
| M9 | "Your words stay yours. It never adds a word to your letter." | Store text | Constitution test `verifyEdits` path; no machine text on a Moments card | true on current code (core tests) | Q43 |
| M10 | Delete account: "Your letters, recordings and photos are removed from every book" (existing, `pages.en.ts:240`) | Account deletion page | A server never held the picture, so "removed from every book" is true of the book, not of any server copy. Needs scoping once pictures ship | existing claim; reread when pictures ship | Q51, Q129 |
| M11 | Existing "Private by default" (`strings.en.ts` `privacyLine`) | App, store | Unchanged but read again beside M2 | existing | Q43 |

## 6. The checklist: every legal or store text that changes before the photo flag flips

O-52: the picker door follows the photo flag (`EXPO_PUBLIC_PHOTOS`, off in every profile today) and ships with its legal set in the same build. Nothing flips until every row is "merged" or "dated line on file". Owners are roles; the founder merges legal text. Status is as of 21 Nov 2026 from files read; none is started unless stated.

Gate key: Q43 claims; Q45 COPPA revisited (default: does not apply); Q48 consent design; Q51 deletion exceptions and retention; Q54 App Privacy answers; Q123 label and consent for F2; Q124 reminders; Q125 city from picture; Q126 location in a picture; Q127 trademark; Q128 Terms for other people's children; Q129 deletion versus backup copy; Q130 policy mechanics and absolute sentences; Q131 publisher and liability; Q132 place dataset licence.

| # | Text, file and line (read on `f59e000de`) | Change needed | Owner | Status | Gating counsel question |
|---|---|---|---|---|---|
| 1 | Privacy Policy `privacy-policy.md` 3.0.0 to 3.1.0, build list `:17-23` (C-1) | Describe the first store build as it is (servers on, sign-in, sync, sharing; backup off) and what the door and library read do | founder (build facts), `legal` drafts, `privacy` checks | not started; precondition of G2 | Q130, Q123 |
| 2 | Privacy Policy `:37` | Add the pictures paragraph (section 1.1) | `legal`; `privacy` checks; founder merges | draft here | Q129, Q130 |
| 3 | Privacy Policy `:45` "we do not collect ... photos" | Scope or rewrite by mode (none, Limited, Full); say what we receive (C-2) | `legal`, `privacy` | not started | Q123 (d), Q130 (c), Q43 |
| 4 | Privacy Policy section 7 `:107-128` | Add the backup carve-out (section 1.2); check "Your account" for "photos" | `legal`, `privacy` | draft here | Q129, Q51 |
| 5 | Terms of Service 4.1.0 to 4.2.0 `terms-of-service.md:94` (7.3) and a new clause: the parent may use the pictures they add, including other people's children; dates and place names are computed; no scanning | Section 1.3 plus new clause (C-9) | `legal`; founder merges | not started | Q128, Q129 |
| 6 | In-app disclosures 3.4.0 to 3.5.0 (`in-app-disclosures.md`): rows for the host sheet, primer and Limited access; every sentence names its mode (C-9) | New rows, set with `content` | `legal`, `content` | not started | Q43, Q128, Q130 |
| 7 | App Privacy label doc 2.2.0 to 2.3.0: `app-store-privacy-labels.md:50` (Location), `:54` (Photos or Videos note), `:84` (add production F1-only and F1 plus F2 rows), `:117` (usage string by profile), `:127` (checklist) (C-4 to C-8) | Section 3 | `legal`, `privacy` | not started | Q54, Q123, Q125, Q126 |
| 8 | App Store Connect answers, `PrivacyInfo.xcprivacy`, usage string, Notes for Review (`docs/release/<x.y.z>.md`, R240: each with a dated artefact) | Match the submitted profile; Notes say what is read, that the tab works with access refused | founder hands (store), `release`, `privacy` check | not started | Q54, Q123 |
| 9 | Strings: `whereLive.*`, `settings.recordings.*`, `settings.privacy.*` iPhone-backup keys (`strings.en.ts:841, :844, :1046, :1433`) | Section 1.4, after the restore drill (D-3, G7) | `content`; `legal` reads | not started; blocked on the drill | Q129, Q43 |
| 10 | Strings: `eraseNowBody` (`:889`), Recently deleted help; Erase everything `backups` (`:952`) needs no change | Section 2 | `content`, `privacy` | draft here | Q129, Q51 |
| 11 | Delete-account page `delete-account-page.md:48-58` and `pages.en.ts:240` | Backup carve-out; scope "photos removed" to the book (M10) | `legal`, `content` | not started | Q51, Q129 |
| 12 | Store copy and screenshots (`store.en.ts`; packet 9.1 lead and promo lines); banned words list in 9.1 | Mode-scoped lines only; no "stays on your phone", "no account", bare "private" | `content`; founder approves what users are promised (O-48) | not started | Q43, Q127 (the "Moments" label), Q130 |
| 13 | Book export promise `DELETION_AND_EXPORT_SPEC.md:335` (promises originals) versus NS-01-R14 (stripped copy only); Terms 7.3 "export everything" | Reword so no line says the export carries originals or all pictures until BL-933 ships (CR-62 item 3). I do not edit the spec | `privacy`, `data-architect`; handoff to `legal` | BL-933 open | Q129 (what an access answer may say) |
| 14 | Data policy `data-policy.md:155` (pictures row, already present), `:172` (iOS backup row says "no parent-facing line says so yet"), 4.4 new rows (section 4) | Update `:172` after the policy line merges; add 4.4 rows with PR 8 | `privacy`, `data-architect` | row for pictures exists; new rows not started | none (inventory) |
| 15 | Data classification 4.6 `moments.json` rows and amended ADR 0032 (R250, G11c) | Section 4 | `data-architect` in PR 8 | not started; due Mon 30 Nov (G11c) | none |
| 16 | Subprocessors `subprocessors.md` | No new vendor for F1 or F2; record "no change, confirmed" in the PR (PRIV-R12). Any F3 geocoder is a new destination | `privacy` | not started | Q132 only if F3 |
| 17 | Counsel packet Q129 default (`COUNSEL_PACKET.md:698`, 9.9) still says "Exclude the folder from backup; carve-out sentence" and the 9.2 index row; `PRIVACY-CONTRADICTIONS.md` C-3 offers both routes | Follow-up PR: default becomes "Disclose (founder decision, 21 Nov 2026); counsel confirms the wording and says whether exclusion is wanted instead"; bump packet version | `legal`; founder merges | open (ruling file section 4 step 2); stale on `develop` | Q129 |
| 18 | `FREEZE-CHECKLIST.md:44` says "counsel Q7 default" | Say "packet Q129" (its own note at `:242` explains) | `product` | open | Q129 |
| 19 | Threat model `MEDIA_THREAT_MODEL.md:50` (P9) and `:134` (D-3) | `:50`: record that O-44 is decided and the line is the control for a stated exposure; D-3 read-back stays in G11 and the G7 restore row | `security-architect` | decision recorded in ruling file only | Q129 |
| 20 | ADR 0028 `:58` (Backup) and `:59` (the line list) | One sentence: O-44 decided 21 Nov 2026, disclose; `:59` list gains `eraseNowBody` and `delete-account-page.md:48` | ADR owner (`data-architect`) | not started | Q129 |
| 21 | Claims register rows M1 to M11 (section 5) | Add to the register the founder picks; each flips to true only with its test | `privacy`, `legal` | rows drafted here; register missing (WS-19) | Q43 |
| 22 | Release guard: PR 25a `G11a-photo` line, label-effect record (`LABEL_GUARD.md` record rule), five door signatures (RV-23) | The flip PR names a D-id whose section names the label; `app-store-privacy-labels.md` changes in the same PR | `release`, `qa`, founder | not started (PR 25a/25b, wave E) | Q54 |
| 23 | Consent record for the library primer (R72, R166; PRIV-R21 fields, built on the phone) | Shown, Records, Never, Decline lines for the primer; no server row | `privacy`, `content` | not started | Q123 (b), Q48 |
| 24 | Pictures of children who are not the parent's (door, Apple's People album): the packet asks Q45 only about a baby's voice in backup | Ask counsel whether the "COPPA does not apply" default still holds for a picture of another family's child kept on the phone. Not in Q45 or Q128 (b) today: a gap in the ask | `legal` adds to Q45 or Q128 (b) | gap, filed in this report | Q45, Q128 |
| 25 | Publisher identity and cover (G10, O-47) | Not a text change; gates store submission | founder | open | Q131 |

Not on this list because they gate F2 places or later features only: Q124 (picture-timed reminders, F4 off), Q125 and Q132 beyond the label rows above (default is date-only cards, no places).

## 7. Order of work, and what I would not accept

1. Door ships only with rows 1 to 8, 14, 17 and 22 merged or dated. A door with the policy still saying "no photo feature" is the contradiction EXH-PRV-1 calls a blocker.
2. Rows 2 and 14 are hard preconditions, not nice-to-haves: `data-policy.md:172` says "no parent-facing line says so yet", which is a live gap the day the flag flips. Row 2 must not merge before the D-3 read-back is at least scheduled (review note).
3. Rows 9 and 10 wait on the restore drill (D-3, G7); until it is on record the backup line stays recordings-only in the app, but the policy line (row 2) must lead, because a stored picture is in the backup the day the flag flips.
4. Silence from counsel is not a pass: F2 stays dark, the door waits (packet defaults).
5. I would not approve weakening any of these to ship the door sooner (my charter: never weaken a consent gate or a deletion guarantee).

## 8. What I did not verify

- Apple's behaviour when a backup is replaced (the base of M3 and the section 1.2 clause): UNVERIFIED.
- That the exclusion call is still absent under `apps/mobile/src/lib/photos/` on `develop` today: the ADR records the grep at `39efe1ac`; I did not re-run it. The photo code is on the nine-PR stack, not all merged.
- Whether `erase-all.test.ts` and `export-device-cleanup.test.ts` have a picture case: not opened.
- Apple's wording in App Review 5.1.1, 5.1.2 and the Developer Program License Agreement 3.3.3(F): not read by me; only the App Privacy Details definitions in section 3 were fetched (21 Nov 2026).
- Whether any proposed text is accurate or lawful: counsel must confirm.

## 9. Revision of 22 Nov 2026: review notes and the locks since

Still a DRAFT. No decision below is rewritten; where a draft line meets a lock, it is marked CONFLICT and the lock wins until a new entry supersedes it.

### 9.1 Why the required check failed at `d5b5005a7`

`packages/content/test/legal-docs.test.ts` ([LEGAL-REQ-064]) scans `docs/legal/**`, `proposed/` included, and allows the phrase for a whole-app no-data claim only in the history of the label doc. Section 3 item 2 used the phrase. Reworded (item 2 above). Run on the merged tree: `packages/content` vitest, the one failing test was this one.

### 9.2 Review notes, each answered

Review A (red-team), at `d5b5005a7`:
1. Sequencing (policy line says pictures are in the backup while the in-app lines stay recordings-only): fixed in section 7, rows 2 and 14 are hard preconditions and row 2 waits for a scheduled D-3 read-back.
2. M1 rests on a sync test named in ADR 0028 and not verified: stands, M1 stays "unverified until test merges". CR-146 row 6 and NS-01-R19 are the owners of the proof.
3. `moments.json` rows rest on ADR 0032 (Proposed) and an unproven exclusion: stands. Now also see 9.3 on Apple's own wording: the flag is guidance, so no line may say "never in a backup".
4. M9 true on current code: stands as a claim to confirm by a test run when the register is built.
5. New `docs/legal/proposed/` folder: for the founder to accept at merge. Unchanged.

Review B (privacy), at `d5b5005a7`:
1. Account deletion for picture files: added. M4 and row 11 gain a claim test owed: executing account deletion removes the stripped copy, the `-512` and `-1280` copies and the `entry_media` rows on the phone (DATA-REQ-023 wipes the local database; the files need their own proof). Until that test exists, the delete-account page may only say what is proven. `data-policy.md:155` lists no account-deletion path for pictures: a gap for `privacy` to close in code or in text.
2. Classification vocabulary: partly not a mismatch. `DATA_CLASSIFICATION.md` (line 31) is the authoritative definition of L1 to L4 and maps the older C, S, A, T classes of `data-policy.md` in its section 1; section 4 here uses the authoritative levels. The real open point stands: for `moments.json`, highest class wins, and `labels{}` can hold a child's name, so `data-architect` must say in PR 8 whether the file is L4 (a child's words) and how `data-policy.md` 4.4 shows it in its older class.
3. Backup lines: covered in section 7.
4. Erase now for a synced book, and Recently deleted: added in section 2.
5. Children's data (row 24): kept as a must-ask before the door ships.
6. In-flight originals: the sweep test owed under row G11c and D-4 must assert zero location-bearing files remain in `Caches/ImagePicker` after the launch sweep. Added to the "Temporary located original" row of section 4 as its deletion test.
7. Apple replacement behaviour: stays UNVERIFIED (9.3); no published sentence before counsel or `legal` reads Apple's page.

### 9.3 Reconciliation with what is locked since

| Lock | What it says | Effect on this draft |
|---|---|---|
| D-165 | O-44 and cover on; O-47 option C; tabs Home, Moments, Book, Me; O-48 value-prop pair unpublished until counsel answers | Consistent with section 0 (disclose, not exclude). Row 12 (store copy) is bound by O-48: nothing published. |
| CPrivO-10 | No whole-app no-data label claim. A per-type "Photos or Videos: not collected" only while no picture leaves the phone and APPLY file 33 is applied | CONFLICT with section 3 first table row, which says Photos or Videos "stays No" and the 2.3.0 label doc row 7. Read it as: the per-type answer is held until APPLY file 33 is applied and counsel reads Q1, Q8 and Q43. This draft does not decide it. |
| CPrivO-11 | A pending (chosen, not yet kept) photo is discarded on every change of the session user, an account switch included | Not in the draft. Add to M4: the in-flight picture is gone on sign-out, account switch and Erase everything, with the PR #1340 test as the proof. A claim about "pictures removed on switch" is held until that test is named here. |
| CPrivO-12 | While `EXPO_PUBLIC_PHOTOS` is off, listing, screenshots, website, email and in-app strings say nothing about pictures. Held in every build: "never leave your phone", "private", "secure", "encrypted", "we never see" for pictures; any backup claim for pictures beyond the policy line; the bare policy sentence "We do not collect ... photos" once the flag is on | CONFLICT to watch: row 9 (in-app `iphoneBackup` strings) is a backup claim beyond the policy line, so it is held by CPrivO-12 regardless of the restore drill. Rows 2, 3 and 11 (policy and delete-account page text) are for the build that carries the flag. M11 ("Private by default") sits beside a held word for pictures: re-read it before the flag flips. "We do not receive them" (M1) is not on the held list but is close to "we never see": counsel reads Q43 and Q130 before it is used. Row 3 agrees with the held policy sentence. |
| CR-146 | Twelve conditions before the flag is on in any store build; each needs a dated line under `docs/release/<x.y.z>.md`; "whether and when photos ship is the founder's" | Section 6 is a legal-text subset of it. Map: row 1 and 2 here to CR-146 rows 9 and 10; row 13 here to CR-146 row 4 (BL-868 then BL-933); rows 14 and 15 here to CR-146 row 5; row 22 here to CR-146 rows 9 and 12; D-3 and G7 to CR-146 row 3. Not covered here and owned elsewhere: CR-146 rows 1, 2, 6, 7, 8. Section 7 step 1 (rows 1 to 8, 14, 17, 22) is therefore not the full gate. |
| `checked-facts-moments.md` (on `develop`, #1410) | 1.1 Documents and Application Support are in the backup by default (archive guide); 1.2 `Library/Caches` and `tmp` are excluded from iCloud Backup, which settles `Caches/ImagePicker` for iCloud; 1.5 `isExcludedFromBackup` is guidance, not a guarantee; 1.7 Finder (computer) backups unverified | Supports M2 on the archive guide (legacy page, per its own caveat). Adds: no line, test or claim may say a file is "never in a backup"; the `moments.json` read-back proves our flag only. Neither file records what Apple does when a newer iCloud backup replaces an older one, so M3 and section 1.2 stay UNVERIFIED. Section 3 here cites the same App Privacy Details definition; that file section 4 is the fuller read. |

### 9.4 Still open for the founder and counsel

Everything in sections 0 and 8, plus the three marked CONFLICT rows above. Nothing in this file is published, applied or counsel-approved.
