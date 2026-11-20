# Abuse and failure cases, per boundary

Task RD-D, `security-architect`, 20 Nov 2026. Docs only; nothing was run on a phone. Boundaries B1 to B11 and adversaries A1 to A11 are in `docs/tdd/new-scope/security.md` sections 1 and 2. Every case is a negative test: a person or a fault does the wrong thing, and the product must behave as stated. Fictional family "Asha" only; fixtures are generated; no real picture, tradition, name or voice.

Format per case: `Id`, trigger, expected behaviour (what the person sees, what is stored, what must not happen), test level (unit, db, scan, e2e, device, review), mutant (the change that must turn it red), the rule or card row it enforces, status. Status says whether the check exists on `origin/develop` (`16e61549`) [V] or is `not yet`.

Words the person reads in these cases are PROPOSED content keys; I name intent only, never final text. No case may produce a count, a scold, fear, guilt or loss language (CLAUDE.md content rules).

## C. Cases by boundary

### B5 Account to account on one phone (`[X4-R1]`)

| Id | Trigger | Expected | Level | Mutant | Enforces | Status |
|---|---|---|---|---|---|---|
| AB-01 | A made a book; A signs out (book kept, D1); B signs in on the same phone | Gate does not open Tonight on A's book; B lands where B's own book arrives or "No book here yet"; no screen names A or says another book exists (FR-SEC-04) | unit (gate) and e2e | Count A's book as B's `hasLocalBook` | NS-10-R3, FR-SEC-01, `gate.logic.ts:123-125` | reader on develop (`account-scope.logic.ts`, #869) [V]; gate not wired [U]; surfaces test is BL-961 PR 2 and 3, not yet |
| AB-02 | As AB-01, then B keeps a letter | Letter goes into a book B owns; either syncs or B sees one calm line that it stays on this phone; sync never stops without a word (FR-SEC-02) | e2e | Leave `AccountMismatchError` silent (`ownership.ts:49`) | FR-SEC-02 | not yet |
| AB-03 | A has Days ticked, moments opt-in, photo moments index, reminders planned; B signs in | B reads 0 of: Days store, moments index, album choice, names list, versions cache, Find rows, planned notes; B is asked the Days question afresh; delivered library-day notes dismissed | e2e over a registry | Omit one store from the registry | NS-47-R15, NS-51-R24, FR-SEC-34 | not yet |
| AB-04 | A's reminder was planned naming A's child; B signs in | Pending notes cancelled and re-planned from B's books only; no note names A's child | unit (planner) | Re-plan from the cached books | NS-10-R3, NS-32-R12 | not yet |
| AB-05 | B signs in; the app already holds the system photo-library permission | B starts with moments off; no system sheet; B never reads A's index | e2e | Treat the system permission as B's opt-in | NS-51-R24 | not yet (NS-51 unbuilt) |
| AB-06 | B taps Erase everything on A's phone | Step-up check (passcode or biometric) runs first when the phone has a passcode; cancelled check changes nothing | device | Skip the check | FR-SEC-06 (P1, a proposal) | not yet |
| AB-07 | B restores the app on a new phone from A's backup | Opt-in, index and Days store are absent (excluded, read back); book rows and stored pictures follow the backup rule stated in the where-it-lives line | device | Include the index in backup | NS-47-R6, NS-51-R23 | not yet |

### B2 Shared device, lock screen, switcher (A3)

| Id | Trigger | Expected | Level | Mutant | Enforces | Status |
|---|---|---|---|---|---|---|
| AB-10 | Phone locked, a library-day note arrives for a faith day, previews shown | Title and body are the one neutral string for the tone; no day name, tradition, country or child name | unit snapshot over every `days.*` key and all four switch states | Mark a faith day `publicTitleOk` | NS-47-R12, R13, R38, NS-46-R36 | not yet (cards unbuilt) |
| AB-11 | Previews hidden by the person | No category sets `hiddenPreviewsShowTitle`; the placeholder is the only text | unit | Set it true | NS-47-R36, FR-SEC-21 | not yet |
| AB-12 | Day-name switch on; person turns App lock on, then off | Stored switch becomes off and does not return on when App lock goes off (effective value `stored && !appLockOn`) | unit | Restore the stored value on unlock | NS-47-R12 | not yet; the built `lockScreenNames` does return the stored value when App lock is off (`apps/mobile/src/lib/reminders/prefs.ts:118` area) [V: line 118 holds the app-lock early return], so copying it is the trap |
| AB-13 | App goes to the switcher on Review, letter page, Find results, moment sheet, media tray, Days page, Home with a day slip | Snapshot blank, with or without App lock | device | Remove the privacy cover on one screen | FR-SEC-22, FR-SEC-33, NS-47-R26, NS-50-R9, NS-52-R30, E18 | pictures built (#838) [V per `security.md` NSC-07]; the rest not yet |
| AB-14 | Someone hands the phone to a child who opens Photos lens or the Days page | App lock gates the screen; Days page says in one line that anyone who can open the phone can see the list and App lock keeps it private (only while App lock exists as a switch) | e2e | Show the Days list before unlock | NS-47-R29 | not yet |
| AB-15 | A pick returns while App lock is up or the sheet is covered | Every picked item discarded; every temp copy deleted; 0 files | device | Keep the item | NS-01-R47, NS-52-R32, NS-51-R25 | pictures: built per `security.md` 3.1 [V by review, not re-run] |
| AB-16 | Notification Center on an Apple Watch mirror or a Focus summary | Same neutral strings (device walk J-CUL-01 records the observed behaviour) | device | n/a | NS-47 section 13 risk checks | not yet |

### B2 Lost phone (A3, A4)

| Id | Trigger | Expected | Level | Mutant | Enforces | Status |
|---|---|---|---|---|---|---|
| AB-20 | Phone lost, finder has no passcode | Out of our control; the where-it-lives and delete-account lines say so plainly. App lock and Erase are the only controls; "Sign out other devices" is the remote lever | review | Claim remote wipe | IAM-R12 (not yet built), FR-SEC-07 | IAM-R12 not yet |
| AB-21 | Phone lost, owner signs in on a new phone and asks the server to kill the old session | Old session ends at its next refresh; the old phone's local book stays until Erase; an upload queue is kept (IAM-R12) | db + device | Revoke without keeping the queue | IAM-R12, `sign-everyone-out.md` drills D1 to D4 (all NOT RUN per FR-OPS-03) | not yet |
| AB-22 | Lost phone's finder opens the files app | L4 files are under the app container with `CompleteUntilFirstUserAuthentication` (`app.config.ts:93`) [V]; after first unlock they are readable by apps, not by the finder over the lock screen | device | Lower the class on a copy (N-B2) | SEC-R15, `security.md` 3.1 N-B2 | the class on a `copyItem` clone is unverified [U] |
| AB-23 | Lost phone has Days ticked | Nothing about the days is on the server; the store is on the phone only, excluded from backup. A finder with the unlocked phone can read it | review | Sync the store | NS-47-R4 | not yet |

### B4 Member to member (A1 ex-partner, revoked co-parent)

| Id | Trigger | Expected | Level | Mutant | Enforces | Status |
|---|---|---|---|---|---|---|
| AB-30 | Co-parent P2 is removed or leaves; P2's phone still holds P1's letters | At the next pull, P1's letters leave P2's phone (`closeBook` deletes other authors' letters, `merge.ts:843-848`) [V]; copies already exported stay (said in the policy) | unit + two-phone test | Skip the delete | NS-25, `privacy.md` 1.3 | closeBook on develop [V]; two-phone test is `sync`'s [U] |
| AB-31 | Revoked P2 calls `sync_pull` and `entry_versions` RPCs with a still-valid token | 0 rows of the book; list-versions refuses a non-author | db access matrix deny cells for left member and outsider | Drop the author check inside the definer | NSC-10, IAM-R14, R24, NS-12-R8 | for sync: matrix exists [V]; NS-12 RPCs not built |
| AB-32 | P2 tries to read P1's private letters or sealed letters | `book_entries` excludes private; sealed rows only after server `now()` passes the instant; forged `seal_since` re-fetches only rows P2 may already read | db | Trust a client clock | NS-06-B8, B13, B16, B22 | not yet |
| AB-33 | A caller with no current age-attested Terms acceptance calls `sync_pull` | Others' rows are omitted; own rows served; export and deletion still work | db | Remove the gate; or gate export | G1 (#909), PRIV-R08, PRIV-R09 | not yet (decision pending, S-1) |
| AB-34 | Forwarded invite link opened by a stranger | Peek needs sign-in; single use; 7-day expiry; token hashed; join undoable 72 hours; the invite message names the child (OQ-S9), so a forward carries the name with a live link | db + e2e | Make the token reusable | NS-25-R2, R4, R6, IAM-R18, `share-text.ts:8` [V] | built (alpha) [per `security.md` 3.9] |
| AB-35 | Third adult or hostile contributor invited | Refused while contributors are off; accepting never changes a role | db | Flip the setting default | IAM-R19, `app.contributors_enabled` | built [V per `security.md` 3.9] |
| AB-36 | Separation: one parent keeps the phone with the other's letters and media | Variant A: media never left the author's phone; letters follow the book rules; no safety-removal path beyond the 72-hour undo (D11) | review (counsel Q50, Q53) | n/a | RSK-30 | counsel |

### B6 The recipient, share and export (A4, the parent's own act)

| Id | Trigger | Expected | Level | Mutant | Enforces | Status |
|---|---|---|---|---|---|---|
| AB-40 | Share one letter with a picture | Bytes are the stored copy, sha256 equals `entry_media.sha256`, metadata scan passes, file name fixed, temp has complete protection and no backup, deleted after the sheet | unit + device | Share the picker copy | `security.md` 3.3 P1 to P4 | not yet (wave 3) |
| AB-41 | Share payload type widened to audio or video | Type-level test fails | unit (type test) | Widen the union | NS-05-R5a, NS-52-R37 | not yet |
| AB-42 | Export built with every key set (Days, moments, index, seal) | None of it is in the file | unit | Add the store to the export reader | NS-47-R10, NS-51-R6, `privacy.md` 1.9 | not yet |
| AB-43 | Export of a letter whose picture has GPS in its stored bytes | The scan over the written bytes fails the export build; no file with GPS leaves | unit | Skip the scan | NS-01-R14 (BL-933), NS-01-R6 | not yet (BL-933) |
| AB-44 | Recovery export ZIP on a launch recovery screen | Copies `scribe.db`, WAL, journal as they sit (`recovery-export.logic.ts:34`) [V]; carries Find index, picture rows, seal pairs and withheld output; no picture file. The README must say what it holds | unit listing the planner's folders | Add a new store to `scribe.db` without telling the README | `privacy.md` 1.9, P-4 | gap: README wording owed |

### Malformed input: import, files, links

| Id | Trigger | Expected | Level | Mutant | Enforces | Status |
|---|---|---|---|---|---|---|
| AB-50 | Import or restore of a malformed export (truncated ZIP, wrong schema minor, huge file, `../` entry names, nested ZIP, duplicate ids) | Refused cleanly with one calm line; nothing partly imported; no path outside the app folder is written; a higher unknown minor is read for known keys and never rewritten | unit with generated fixtures | Extract entry names without the plain-name rule | export one-way rule (`export-schema.test.ts`, `export-golden.test.ts` [V]), NS-52-R18 | schema tests exist [V]; there is no import path in 1.0 as far as I read [U]; if one is added it needs this case first |
| AB-51 | Hostile picture: corrupt HEIC, 150 MP canvas, zero byte, a link in place of the file, wrong extension | Type from bytes; canvas cap read before decode; own queue; 20 s timeout; refused with one calm line; 0 files left; words and draft intact | unit + device (a validator stricter than real files passes CI and fails phones) | Decode before the cap check | NS-01-R34, #834 scan, NS-52-R8, FR-SEC-31 | pictures: built [V per `security.md` 3.1]; video not yet |
| AB-52 | Hostile video: unreadable, over 60 s, over the byte cap, a metadata trap with location atoms | Refused (`video_unreadable`, `video_too_long`, `video_too_large`); stored file has 0 metadata atoms (0 of 10 fixtures) | unit + scan + device | Copy the container unchanged | NS-52-R5, R7, R8 | not yet |
| AB-53 | Hostile deep link: unknown path, long token, `startRecording` intent, a review route, a token in a query string | Unknown routes land on Home; nothing records or opens review; a token in a query is rejected (fragment only) | unit | Add the route to the allowlist without a check | SEC-R17, IAM-R09, `deep-link.allowlist.test.ts` [V] | allowlist test on develop [V] |
| AB-54 | Hostile notification payload (tap on a stale or forged identifier) | `el.day.<isoDate>` on a later date or a cleared or unreadable store opens plain Home with no message; a forged id with a path is ignored | unit | Route by id to a screen | NS-46-R32 | not yet |
| AB-55 | Apple's suggestion returns a symlink, directory, oversize or wrong type; or a type we do not read (location, workout, contact) | Only Photo and LivePhoto are read; file opened once on the handle; refused otherwise; the Apple URL is never deleted by us | unit + scan | Call `content(forType:)` for another type | NS-49-R7, R10, R19 | not yet |
| AB-56 | A tampered model or pack file | Hash and size must equal the signed manifest after the signature check; mismatch deletes the file and shows a retry; the file is never loaded | unit | Skip the hash compare | FR-AIS-13, FR-AIS-12 | not yet |
| AB-57 | Hostile signed config payload (validly signed) | Can only hide a surface, stop a write or raise `forceReauthEpoch`; cannot turn a feature on, stop export or delete local data | unit | Accept a `true` that enables | FR-SEC-16, ADR 0029 | not yet |

### B3 Replayed consent, retry and idempotency

| Id | Trigger | Expected | Level | Mutant | Enforces | Status |
|---|---|---|---|---|---|---|
| AB-60 | Consent answer sent, reply lost, the person taps again | One `policy_acceptances` row | unit + db | New key per call | NS-10-R7, PRIV-R21 | fixed in #903 (`consent.ts:110-117`) [V]; add the `db` idempotency cell [U] |
| AB-61 | Recorded accept replayed by a script after a decline | Order kept; the later act wins; the earlier row stays (append-only) | db | Overwrite the first row | PRIV-R06 | `consent_record_fields.test.mjs`, `consent_service_role.test.mjs` exist [V] |
| AB-62 | A client skips `canSync` and calls `sync_pull` before consent | See AB-33 | db | See AB-33 | G1 | not yet |
| AB-63 | An old app build replays an upload after a contract change | Server accepts only what the contract fixture allows; no row created for removed fields | unit fixture + db | Accept unknown columns | API-R11 | [U] |
| AB-64 | Two taps on Keep, or sync retried after a lost answer | One letter; the idempotency key is the letter's own id | unit | Mint an id per attempt | sync outbox (`docs/tdd/new-scope/data-and-sync.md`) [U: not re-read here] | [U] |

### Failure during write: kill-during-save, failed delete, no space

| Id | Trigger | Expected | Level | Mutant | Enforces | Status |
|---|---|---|---|---|---|---|
| FL-01 | Kill the app during Keep (after words saved, before picture row; or after picture file, before row) | On relaunch the words are intact; either the picture is attached or an orphan file is swept at launch; no row points at a missing file; no half-written file is shown | unit with a crash hook between steps + device | Write the row before the file | NS-01-R11, R52 (sweep) | pictures: built [V per `security.md` 3.1]; media (NS-52-R11) not yet |
| FL-02 | Kill the app during the days store write | Atomic write (temp file then rename); on relaunch the old list or the new list, never a half file; a corrupt file fails closed (no reminder, no crash) | unit with a kill hook | Write in place | NS-47-R6, R28 | not yet |
| FL-03 | Kill during the moments index refresh | Index is rebuilt or empty; no partial list shown; foreground only | unit | Show the partial list | NS-51-R6, R38 | not yet |
| FL-04 | Kill during Erase everything | On relaunch the erase resumes and finishes; the scan finds 0 bytes of every store | unit with a kill hook (`erase-all.test.ts`) | Clear the marker before the stores | NS-47-R16, NS-36 | `erase-all.test.ts` exists [V]; per-store rows not yet |
| FL-05 | Kill during a transcode | Temp copies cleaned on cancel, kill and next launch; draft keeps every word | device | Skip the sweep | NS-52-R33, NSC-08 | not yet |
| FL-06 | Failed delete: the file cannot be removed (permission, busy, path gone) | The row is kept (or a `discard.failures.<id>` count), the failure is retried at next launch, the person is told once in calm words, Erase everything still finishes the job; never "deleted" while bytes remain | unit with a failing fs fake | Delete the row first and ignore the file error | NS-01-R16c, NS-09, FR-LCY-41 | pictures: built per `privacy.md` 1.8 [V by design doc]; media not yet |
| FL-07 | Failed delete on the server (purge worker error) | The deletion request stays open, retried; the receipt shows counts only; no partial purge leaves orphan Storage objects | db + functions test | Mark done on the first error | IAM-R22, chapter 08, `npm run test:functions` | purge worker tests exist [U] |
| FL-08 | Disk nearly full when copying a video or saving | Copy never starts when free space is below twice the bytes plus margin; nothing partial remains; every word kept | unit | Start the copy first | NS-52-R10 | not yet |
| FL-09 | Network drops during sync with consent withdrawn mid-flight | Own-row deletions still go through; content writes refuse with a named SQLSTATE; nothing is lost on the phone | db + unit | Gate deletions | PRIV-R09, IAM-R03 | gate exists for writes [V per IAM-R03]; mid-flight case not yet |
| FL-10 | Restore drill: server restored to before a seal | No reader is served the sealed letter before the author's phone re-uploads the seal | db on a scratch project, Asha only | Serve the restored row | FR-OPS-08, NS-06-B2, B27 | not yet |
| FL-11 | Kill switch fetch fails or returns garbage | Fail-open for phone-only features (the library stays on); export, reading and deletion unaffected; never fail-open for a server write path | unit | Fail closed on the library | NS-46-R28, LEGAL-REQ-040 | not yet |

## D. What I would run first (order for the first week of building)

1. AB-01, AB-03 and AB-04 with the registry: they hold the live defect and every later store joins them.
2. AB-33 once S-1 is decided.
3. FL-04 and FL-06 per store as each store lands.
4. AB-51 and AB-52 fixtures (generated, Asha only) before any media code merges.
5. AB-10 to AB-13 as a device walk when the first notification category exists.

## E. Not verified

- Every "built" status marked [V per `security.md`] comes from the merged design, not from my re-run of the tests.
- Whether the gate is wired to `bookVisibleTo` [U]. Whether an import path exists in 1.0 [U]. The protection class of a `copyItem` clone [U]. The hosted behaviour of any Supabase feature. Apple behaviour for limited library, iCloud-only originals and the suggestions picker [U].
