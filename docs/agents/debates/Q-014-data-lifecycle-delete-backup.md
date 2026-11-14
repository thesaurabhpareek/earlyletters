# Q-014: Data lifecycle in an on-device-only v1.0: delete, recovery and backup

Numbering: the request called this Q-012, but Q-012 (crash reports) is taken on develop and Q-013 is taken on PR #84. This entry takes the next free number. Nothing else in `docs/agents/DEBATES.md` is changed.

- **Raised by:** the quality critique (issues 2 and 3, `docs/release/journey/critiques/quality.md`) and the product critique (issues 6 and 10), both on `origin/qa/journey-flows` (507ad7e).
- **Status:** Escalated to the founder (it touches D-073, a founder decision, and a promise already printed in the legal text).
- **Date:** 4 Oct 2026. Code cited is on `origin/qa/journey-flows`, except Plus, site, pages and store copy lines (billing, site.en, pages.en, app-store.md), which are on `origin/develop` (cfdca3f). Sources: Apple App Review Guidelines (opened 4 Oct); GDPR text and Apple's backup page were blocked here and are marked **unverified**.

## 1. The question

Two linked questions for a v1.0 that keeps everything on the phone:
- **A. Delete.** What happens when a person deletes a saved letter and its voice?
- **B. Backup and recovery.** What do we offer, and say, about a lost or replaced phone?

Plus the test that proves either answer: a take killed mid-recording, and a restore onto a second phone.

## 2. Facts

**Decided already (not reopened here).**
- v1.0 is on the phone only: founder decision of 3 Oct in commit c1764f9 (#54), `EXPO_PUBLIC_SERVER_FEATURES=off` in every `eas.json` profile (lines 14, 23, 32), `capabilities.sync` false (`lib/capabilities.ts:50`). It is not recorded as a D-###.
- D-033: recordings stay in Documents so the person's own iPhone backup includes them. D-059: no audio upload in v1.0.
- **D-073 (founder, 3 Oct evening): "encrypted backup of recordings ships in v1.0"**, supersedes D-059's "no audio upload" and D-033's copy. Sharing with family stays v1.1. D-073 was never amended after c1764f9.
- Constitution: raw transcripts are immutable and every edit is reversible. Nothing here touches edits.

**What the app does today.**
1. Delete is a tombstone: `deleteEntry` sets `deleted_at` (`lib/store.ts:641`). Every read hides it (`store.ts:609, 616`). Undo is a React state variable on the letter screen (`app/letter/[id].tsx:62, 143-148`), gone when the person leaves. No confirm. The same screen puts Delete beside Make private (product critique 6).
2. `undeleteEntry` exists (`store.ts:652`) but nothing calls it from a list. There is no Recently deleted screen (`e2e/TESTID_REQUESTS.md:154`).
3. Nothing ever purges. The sweep never deletes audio and counts tombstoned audio as claimed (`lib/capture/sweep.logic.ts:8, 41`). Only a confirmed Discard of an unsaved take deletes a file (`app/listen.tsx:183-203`). So a deleted letter is neither recoverable nor erased: text and voice stay in the database and in Documents for ever.
4. Export leaves deleted letters out (`lib/export/build.logic.ts:9`), and drafts and orphans too (quality critique 9).
5. Recordings are **not** excluded from backup, on purpose (`recorder.ts:33`, `model-files.ts:14-15`). Only speech models, packs, remote docs and listening copies are excluded (`model-files.ts:43`, `lib/packs/app-support.ts`, `audio-enhance/index.ts:13`); the export ZIP is written to the cache (`export/device.ts:6`). The database is opened as `scribe.db` with the expo-sqlite default (`store.ts:165`); I did not confirm its folder, so the drill must (it should be in Documents, so in backup).
6. Launch sweep after a kill: a draft still `recording` with a file of more than 0 bytes is "finalized" and shown on Tonight (`sweep.logic.ts:94`). It never checks the file plays. An M4A that was not closed properly may lack its index and not play. That is how MP4 containers work, but I have **not seen it on a device**: unverified.
7. Durability evidence: WAL plus `synchronous=FULL` (`lib/db/expo-adapter.ts:25`), unit tests (`test/sweep.test.ts`). No device run of the 500-kill test (PRD 7.4; BL-Q30), no restore drill (BL-284, FT-39, needs the founder; planned by Thu 29 Oct, `docs/BACKLOG.md:68`). Store submission is the week of 2 Nov.

**What the shipped words promise.**
- Content: "Delete this letter? You can undo this for 30 days from Recently deleted." plus `recentlyDeleted` and `restoreButton` (`packages/content/src/strings.en.ts` `settings.delete`, around lines 632-637). The app never shows them.
- Privacy Policy 2.0.0 section 7, lines 85-86 (PR #81, `docs/legal/privacy-policy.md`): "It stays in Recently deleted on your phone for 30 days so you can undo it." and "Delete everything by deleting the app... A copy may remain in an old iPhone backup." Line 41 says an iPhone backup may include app data. Line 105 says "backup between phones" is planned for later.
- Website delete page (PR #82, `delete-account-copy.ts`): the same 30 days, "then it is erased".
- Spec and PRD: DATA-REQ-010 is P0, "Recently deleted with 30-day undo" (`docs/legal/DELETION_AND_EXPORT_SPEC.md:92-103`, `docs/prd/PRD.md:76`). The spec's local purge is a launch sweep (step 7).
- Backup: Plus store view lists "Encrypted backup of every recording" (`packages/content/src/features/billing.en.ts:22`; a test requires it, `apps/mobile/test/billing-plan.test.ts:320`), also `site.en.ts:85-87, 129`, `pages.en.ts:70, 192`, `docs/store/app-store.md:64`. Live site on `main` says Plus "backs up every recording" (`apps/web/src/content/site.ts:201`); PR #82 removes it. PR #81 removes backup from the Terms and Subscription Terms. The recordings screen and strings say there is no backup (`settings/recordings.tsx:15`; `strings.en.ts:704, 880`).

**Constraints from outside.**
- Apple 5.1.1(v): account deletion is required only "if your app supports account creation". v1.0 has no account, so no Apple rule forces any delete behaviour here. 5.1.1(i): the privacy policy must explain retention and deletion, so it must be true. 3.1.2(a): a subscription must give "ongoing value" (read 4 Oct, fetch summary, not verbatim).
- GDPR Article 17 erasure and whether a developer with no access to on-device data is a controller: **unverified** (EUR-Lex blocked). Counsel Q33 (PR #81) is adjacent. Apple's page on what iCloud backs up: **unverified** (blocked; BENCHMARK row 14).
- The phrase "deleted means deleted" is not in the repo. The nearest promises are the 30-day lines above.

**The contradiction in one line.** Three printed promises (30-day shelf, erased after, backup between phones) and one decision (D-073) describe a product the v1.0 build is not.

## 3. Part A: options for delete

### A(a) Soft delete with a Recently deleted shelf, purge after 30 days
- **Product:** this is already the spec and the printed promise; a parent mis-tapping next to Make private loses nothing. Voice is irreplaceable, so a safety net is worth more than the saved bytes.
- **Design:** one new list screen in Settings, Restore and Erase now on each row, "Erased on {date}". Same pattern people know from Photos.
- **Content:** every string exists or is one line. No promise changes.
- **Legal/privacy:** the policy stays true. "Erase now" is the honest answer to "deleted means deleted": the 30 days is the person's own grace, and they can end it. Compatible with Apple (no rule) and, on the device, with the household nature of the data (counsel to confirm).
- **Engineering:** small. The tombstone, `undeleteEntry` and the strings exist; new are a list read, a purge and a screen.
- **Red team:**
  - A phone clock moved forward could purge early. Mitigate: never purge if the clock is earlier than the latest recorded launch.
  - Purge order matters. If the row goes first and the app is killed, the audio file is an orphan and the sweep would re-attach it as a draft (`reattach`, `sweep.logic.ts:114`), so a purged voice returns. Delete the file first, make purge idempotent, and make the sweep ignore a missing file for a tombstoned row.
  - Deleted text stays in iCloud backups; the policy says so already.
  - Three layers (confirm, undo, shelf) can feel heavy. See question 2.

### A(b) Confirm dialog only, hard delete
- **Product:** simplest mental model; matches the plain meaning of delete.
- **Content/legal:** needs the policy, website page, spec and three strings rewritten, and the "undo" promise withdrawn after it was printed.
- **Engineering:** also small (delete file and row), but irreversible. Quality finding 2 gets fixed by removing the undo, not by adding one.
- **Red team:** a confirm is not a safety net. People confirm by reflex at 11pm. Losing a grandparent's recorded voice to a thumb slip is the worst failure this product can have. Fails "celebrate what exists" in spirit.

### A(c) Status quo plus honest copy
- **Product/engineering:** zero build.
- **Legal:** the honest copy would read "Deleted letters stay on your phone and cannot be brought back or erased." That is a worse privacy statement than the one drafted, and it cannot be honest for text and voice that remain on disk for ever.
- **Red team:** it is not a delete at all. It would also need the policy rewritten, and it leaves a parent who wants a sensitive letter gone with no way to do it except deleting the whole app. Apple 5.1.1(i) wants retention explained; the explanation would be "for ever".

## 4. Part B: options for backup and recovery

### B(1) Rely on the person's own iPhone/iCloud backup, explain it in the app, show "last exported"
- **Product:** matches the current build, D-033 and the printed policy. Zero accounts, zero servers, zero cost to us. Export (free, complete) is the second copy and already works.
- **Design/content:** the recordings screen already says "on this phone and in your iPhone's own backup, if you use one" (`strings.en.ts:604`). Add one row "Last export" and one quiet nudge in Export. No notifications.
- **Legal:** nothing new leaves the phone. Policy line 41 is accurate.
- **Engineering:** small. Store one timestamp when an export is built; show it.
- **Payments:** Plus can no longer list backup. That is a change to D-073.
- **Red team:** we cannot see whether the person's backup is on or full. I know of no public iOS API for it (unverified), so the copy must never say "you are backed up". Many people never export. A killed or damaged database is not covered by anything of ours. And D-073 is a decision the founder made one day earlier.

### B(2) In-app encrypted file export to Files or iCloud Drive on a schedule
- **Product:** the only no-server way to meet the letter of D-073 (an encrypted backup the owner holds).
- **Engineering:** medium to large. Writing on a schedule to a folder the person chose needs a saved folder permission; iOS gives apps no promise to run on a schedule (unverified), so "on a schedule" would really mean "when the app is open". Encryption needs a passphrase or key. If it is lost, the backup is gone, which is a loss story we do not want to tell (the constitution's calm tone). A key kept for them would need a server.
- **Payments:** gating a file export behind Plus clashes with "export is free, always" (`billing.en.ts` promise line).
- **Red team:** a second, rarely tested restore path in a first release is a new way to lose data. It would also arrive after the drill dates, with no time to run its own restore drill.
- The existing Export already opens the share sheet, where "Save to Files" puts the ZIP in iCloud Drive. B(2) adds encryption and automation, not a new place to store.

### B(3) Defer
- **Product:** honest if the words change. Backup returns with sign-in and sync in v1.1 (backlog 06), which is where ADR 0006 and the server work already sit.
- **Red team:** a deferral that leaves D-073's copy in the Plus store view, the site and the listing sells a feature the app lacks. App Review risk (3.1.2, and 2.3.1 accurate metadata) and a trust break on day one. So B(3) only works together with the copy removal, which is the same change list as B(1). B(1) is B(3) plus an explanation and a last-export prompt.

## 5. Recommendation

**A(a), with a confirm in front of Delete. B(1) for v1.0, with D-073 amended for v1.0 by the founder, and B(2) kept as a v1.0.x or v1.1 option. Make the launch sweep check that a recovered take plays.**

Reasoning:
1. A(a) is the only option that makes the printed words true without rewriting them. A(b) and A(c) each need the privacy policy, the website, the spec and three strings changed after they were written, and each is worse for the person.
2. The shelf plus "Erase now" answers the privacy promise from both sides: undo by default, immediate erase on request, and a real purge (file then row) at 30 days. Today's behaviour (nothing erased) is the one that does not honour any promise.
3. B(1) is what the build can honestly do before 2 Nov. It uses a copy the person already controls, at no cost to us. D-073 cannot be met without sign-in and a server, which the founder switched off in c1764f9. Both are founder decisions; the decision to prepare is which one wins for v1.0.
4. Do not exclude a deleted letter's audio from backup to "help" erasure. A restore that fails to flip the flag would leave a restored letter's voice out of every backup, silently. Keep the rule "recordings are always in backup".

**Cost.** About 3 to 4 engineer-days for A(a) and the sweep fix, 1 day for the last-export row, 2 days of device time for the drills (the founder holds the phones). Storage: tombstones hold at most 30 days of audio at 0.48 MB a minute (`recorder.ts:38`), tens of MB. Backup storage is the person's own iCloud, about 230 MB a year if letters average 2 minutes at 240 letters a year (my assumption; 240 from ARCH 7 via the backlog). We pay nothing.

**Risks.** The drill may show the database or audio is not in an iPhone backup (then B(2) becomes necessary). The M4A may not survive a kill (then record to a container that survives, such as CAF, and convert on stop; I have not verified that expo-audio offers it). The shelf stays after the app is deleted only in an old backup.

**What would change my mind.**
- Restore drill fails, or support hears "new phone, lost it": move to B(2) first.
- The founder wants backup as a paid reason to buy Plus at launch: then sign-in and the server path of ADR 0006 must come back into v1.0, which the 26 Oct freeze (Q-003) will not allow.
- Counsel says a 30-day local shelf needs more than the policy line: keep A(a), add the wording they give.
- The kill test shows zero unplayable takes: the playability check stays (it is cheap) but the container work is dropped.

## 6. Change list (build agent: start when the founder says yes)

**Store (`apps/mobile/src/lib/store.ts`)**
- `listDeleted(): Entry[]` newest first, with `deletedAt`; `eraseEntry(id)`: delete the audio file (if any), then the row, in that order, idempotent; `purgeExpired(now)`: rows with `deleted_at` 30 days or older.
- Guards: no purge when `capabilities.sync` is true (server owns the clock, spec 2.2 step 7); no purge if `now` is earlier than the stored last-launch time (`settings` key `lastLaunchAt`, written at launch).
- Remove the matching listening copy and sidecar when erasing (`audio-enhance`).
- `build.logic.ts` header: say deleted letters are excluded by design, not because of a missing API.

**Sweep (`lib/capture/sweep.logic.ts`, `sweep.ts`)**
- `SweepFile` gets `playable: boolean | null` (duration probe in `sweep.ts`, null on web). `finalize-recording` only when playable is not false; otherwise keep the file, mark the draft `unrecoverable`, list it in Settings > Recordings with "This take may not play. Export keeps the file."
- A missing file for a tombstoned entry is not reported as `missing-audio`.
- Run `purgeExpired` after the sweep at launch; never in the middle of a recording (respect `activeTakeId()`).

**Screens**
- `app/letter/[id].tsx`: confirm sheet before delete using `settings.delete.entryTitle`, `entryBody`, `entryConfirm`, "Keep it" as the default; keep the persistent Undo (A11Y-F03).
- New `app/settings/recently-deleted.tsx` and a row on Settings home (`app/settings/index.tsx`), under Export. Row: first words, deleted date, "Erased on {date}", Restore, Erase now (confirm). Empty state.
- `app/settings/export.tsx`: "Last export" row; after a successful build, write `lastExportedAt` (set when the ZIP is built and the share sheet opens, since the share result does not say if the person saved it; the copy says "prepared", not "saved").

**Strings (`packages/content/src/strings.en.ts`, `settings.delete` and `settings.export`; rules test must pass)**
- Reuse: `entryTitle`, `entryBody`, `entryConfirm`, `recentlyDeleted`, `restoreButton`.
- Add: `keepButton` "Keep it"; `shelfHelp` "Letters you delete wait here for 30 days."; `shelfEmpty` "Nothing here. Letters you delete wait here for 30 days."; `erasesOn` "Erased on {date}"; `eraseNow` "Erase now"; `eraseNowTitle` "Erase this letter now?"; `eraseNowBody` "The letter and its recording will be erased from this phone, at once."; `restoredToast` "Letter restored."; `lastExport` "Last export: {date}"; `neverExported` "Not exported yet"; `exportNudge` "Save a copy of your book in Files or iCloud Drive. It is yours to keep." No fear, no counts of gaps.
- Unchanged: `settings.recordings.onPhoneBody` (already true).

**If the founder amends D-073 for v1.0 (question 1, yes)**
- Remove the backup lines from `billing.en.ts:22`, `site.en.ts:85-87, 129-130`, `pages.en.ts:70, 192`, `docs/store/app-store.md:64`; flip `billing-plan.test.ts:320` to `not.toMatch(/backup/i)`.
- PR #82 fixes `apps/web` on `main`; PR #81 already drops it from the Terms. Confirm both merge before the listing is submitted.
- `docs/DECISIONS.md`: coordinator records the amendment (new D-###, referencing D-073 and c1764f9). Update `DELETION_AND_EXPORT_SPEC.md` 2.2 with the v1.0 local purge, `E2E-08` header and `TESTID_REQUESTS.md`, and the CLAUDE.md test counts.

## 7. Test plan

**Node (vitest, fictional family Asha only)**
- Sweep: killed draft with playable file finalizes; with `playable: false` it is kept and marked unrecoverable; empty file kept; no file dropped; tombstoned entry with no file raises no report; a purged file is never re-attached.
- Store: delete, relaunch, `listDeleted` has it, `undeleteEntry` brings it back; `purgeExpired` at day 29 keeps, day 30 erases row and file; kill between file delete and row delete leaves a state the next launch completes; clock earlier than last launch purges nothing; with `capabilities.sync` true purges nothing; export excludes the shelf.
- Content rules pass on every new string; a test that every `settings.delete` string used by the shelf exists.

**Maestro (extend E2E-08, `apps/mobile/e2e/flows/`)**: delete, confirm, back to Book (gone), Settings, Recently deleted (present with "Erased on"), Restore (back in Book); delete again, Erase now (gone, and the shelf is empty).

**Device, D1 iPhone SE (3rd gen), founder runs it, evidence attached to BL-Q30 and BL-284**
1. Kill mid-record, 500 runs: start a recording, kill at a random 2 to 60 s, relaunch. Record per run: draft exists, file exists, duration within 1 s of elapsed, hash set, plays. Gate: **zero lost**, and every unplayable take is kept and listed. Report the unplayable rate; above 0 starts the container work.
2. Kill during save, 500 runs, random 0 to 400 ms (existing PRD 7.4 gate).
3. Restore drill (FT-39, extended): Phone A holds 1 spoken letter, 1 typed, 1 on the shelf (day 5) and 1 backdated to day 31, plus a speech model. Back up (iCloud and an encrypted Finder backup), restore to Phone B. Check: counts equal; `raw_sha256` of each letter and audio SHA-256 equal; audio plays; the day 5 letter is on the shelf with the right date; the day 31 letter is erased at first launch with no orphan reappearing; the speech model is absent and the app asks to download it without a crash; Export runs. Note the database folder and whether iCloud Backup was on by default.
4. Negative: restore from a backup made before the last letter; the app opens and says nothing false.

## 8. Questions only the founder can answer

1. **D-073 for v1.0.** A: amend it so v1.0 relies on the person's own iPhone backup plus Export, and encrypted backup (server, with sign-in) returns in v1.1 with sharing. B: keep it as written, which means sign-in, the server and a backup build return to v1.0 and the freeze moves. (Recommended: A.)
2. **Confirm before Delete, as well as the shelf?** A: yes, as the spec says (the strings exist; it also tells people the shelf is there). B: no, immediate delete with the persistent Undo, as the screen does today. (Recommended: A.)
3. **Erase now.** Add it on the shelf, yes or no? (Recommended: yes. It is the in-app answer to "deleted means deleted".)
4. **Last-export nudge.** A: passive only, a row in Settings and Export. B: also one quiet card on Book after 90 days or 30 new letters with no export, dismissible. (Recommended: A for v1.0.)
5. **Run the device drills before submission,** yes or no. They need the founder's phones by Thu 29 Oct (BL-284, FT-39).

## Affected
Founder (D-073), content (strings, site, store listing), legal-alignment (policy section 7, Q33), mobile (store, sweep, screens), QA (drills), payments (Plus feature list), coordinator (new D-### and backlog ids).

## Replies
None yet. At most one round from each affected agent.

## Status
Escalated to the founder.
