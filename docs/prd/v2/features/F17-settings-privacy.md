# F17 Settings, privacy controls, consents and deletion

| | |
|---|---|
| Release | v1.0 gate (app lock is P1 inside v1.0; the four leak surfaces are P0) |
| Priority and rank | P0, rank 6 (`05-feature-map.md` section 2) |
| Personas | P1, P2, P3, P4 |
| Existing IDs | C-REQ-016, C-REQ-017, C-REQ-018, C-REQ-019, C-REQ-009, C-NFR-005, C-NFR-009, PRD-REQ-001, PRD-REQ-002, PRD-REQ-010, PRD-REQ-013, PRD-REQ-018, LEGAL-REQ-003, LEGAL-REQ-006, LEGAL-REQ-007, LEGAL-REQ-008, LEGAL-REQ-009, LEGAL-REQ-014, LEGAL-REQ-016, LEGAL-REQ-022, LEGAL-REQ-029, LEGAL-REQ-030, LEGAL-REQ-031, LEGAL-REQ-032, LEGAL-REQ-033, LEGAL-REQ-044, LEGAL-REQ-051, LEGAL-REQ-054, DATA-REQ-010, DATA-REQ-011, DATA-REQ-013, DATA-REQ-014, DATA-REQ-015, DATA-REQ-019 to DATA-REQ-026, DATA-REQ-033, DATA-REQ-034, DATA-REQ-036, DATA-REQ-053, A-REQ-019, A-NFR-011, B-REQ-014, B-REQ-016, K-01, K-13, K-14, K-17, K-22, K-26, K-29, D-025, D-033, D-042, D-050, BL-023, BL-114, BL-118, BL-134, BL-159, BL-233, BL-234, BL-235, BL-236, BL-238, BL-239, BL-240, BL-243, BL-245 |
| Depends on | F02 (session, Terms and sensitive-data acts at sign-in, re-consent sheet, sign-out guard), F05 (Languages and speech screen), F06 (edit level), F08 (Recordings screen), F11 (co-parent rules at deletion), F12 (child page, book deletion entry), F13 (Reminders, names in notifications), F14 (Plan, on-device subscription state), F15 (export before delete), F16 (sync, Settings > Sync, server clock on tombstones), F18 (analytics consent behaviour), F19 (remote config), F20 (Support, If you are struggling), F21 (website legal and deletion pages) |
| Status | Draft V2, 3 Oct 2026. Reconciled on 13 Oct 2026 with D-073, D-074, D-085, D-068 and the Settings code on `develop`; revised after critique round 1 for M14 to M16 and R2 AR-22, AR-23, AR-38, R4 PT-03, PT-08, PT-09, PT-22, PT-23, PT-24, PT-27 to PT-29, PT-34: the staff-access line, the deletion matrix (section 8.4), the backup consent and Erase everything. Revised 15 Oct 2026 after critique round 2 (R8 R2A-01, -03 to -05, -16 to -18; `reviews/DISPOSITION-R2-architecture.md`): one rule for logging claims, signed-in Erase everything is not a ledger reset, and the matrix gains held drafts, exact backup paths, restore requests, sessions seen and drill projects |

> **Not legal advice.** Items marked **[Counsel]** wait on a licensed attorney. Legal duties in `docs/legal/ENGINEERING_REQUIREMENTS.md` and `DELETION_AND_EXPORT_SPEC.md` win over product wishes. Where a founder decision collides with one, this spec builds the legal default and raises the collision for counsel (R4 PT-06).

## 1. Why

- [S] Privacy is the most cited reason to choose a family memory app: 29 of 80 positive reviews (36%) of six baby memory apps name it (R2 section 0 item 2, T9). Job 1 in `02-customers.md` section 4 ranks it first, strength High.
- [S] Two reviews describe privacy failures. One is a journal passcode bypassed through system search (R2-S16); the other is family-only photos seen by the wrong people (R2-S17). A lock alone did not protect the first person. Search, widgets and notification previews must leak nothing (R2 section 0 item 2).
- [F] App Review 5.1.1(v) requires in-app account deletion when an app supports accounts; 5.1.1(ii) requires consent before collecting usage data and easy withdrawal (R4 section 5, R4-S55). LEGAL-REQ-029 and LEGAL-REQ-008 turn these into tests.
- [F] Connecticut and Washington need a separate, unbundled consent for sensitive data, and withdrawal must be possible (LEGAL-REQ-006; CR-020, CR-031). The consent record is append-only `policy_acceptances` (`POLICY_VERSIONING.md` section 7), which exists in migration `20261002020000_data_governance.sql`.
- [F] Only Dearest and Remento state plainly that content is not used to train AI among the products opened (R1 F17, R1-S3, R1-S13). Apple Journal and Dearest offer a Face ID or passcode lock (R1-S5, R1-S3).
- [S] 57% of US adults want more control over AI in their lives (R2-S27). The never-sold, never-trained line needs a real control behind it (B9).
- [F] Settings on 13 Oct: `account.tsx`, `privacy.tsx`, `delete-account.tsx`, `recently-deleted.tsx`, `export.tsx`, `storage.tsx`, `plus.tsx` and others exist in `apps/mobile/src/app/settings/`; account and deletion rows show only in a build with server features on (M14; off in every `eas.json` profile on 13 Oct). The beta card sits at the top of Settings home, not in About as K-13 requires.
- [F] M14 makes this a server product. The staff-access line drafted for v1.0 promised that every access is logged, which is not true at launch: Supabase dashboard SQL reads are not logged (`docs/legal/privacy-policy.md` CN-8), and whoever holds the escrow key could deploy a function that opens recordings (R4 PT-03). This spec replaces the line with one the system can prove and names what makes the stronger line true (6.2 B, 8.2).
- [D] Recording backup with a recovery key ships in v1.0 (D-073, M16), so Settings carries its row, its consent and its deletion rules now, not in v1.1.

## 2. Who

| Persona | Moment | Holding, feeling, short of | What F17 must do |
|---|---|---|---|
| P1 Evening parent | After a privacy story in the news; before handing the phone to a relative; when a partner asks "who can see this" | Phone, a minute, mild worry | Answer "who sees this" in one screen; one switch per consent; nothing alarming |
| P1 leaving | Decided to stop, or switching apps | Wants a copy and a clean exit | Export first, a plain list of what happens, a date, an undo for 30 days |
| P2 Co-parent | Separation, or a shared phone at home | Their own letters in a shared book | Clear that deleting removes only their letters; the book stays with the other parent (K-22) |
| P3 Expecting parent | A due date in the book; maybe a loss later | Tender; the due date is health data (K-25) | Quiet controls; hide before delete (B-REQ-014); no loss copy |
| P4 Multilingual family | Child's name in Devanagari or Arabic script | Keyboard may differ from the name's script | Confirm a deletion without typing a name in another script |
| Any parent with a nosy household | Phone left on a table | A child's name on a lock screen, a letter in the app switcher | Names off by default, nothing in search, optional Face ID lock that also hides the switcher snapshot |

## 3. What we are solving

**Outcome:** a parent can see and change every privacy choice in two taps, leave with a full copy and a clean deletion on a published clock, and nothing about their child shows outside the app unless they chose it.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Rows more than 2 taps from Settings | 0 | UI test walks the tree (`[C-REQ-016]`) | None |
| Analytics or crash requests before consent | 0 | Network capture E2E (BL-239) | None |
| Account deletions finished inside 31 / 38 / 45 days (live / backups / processors) | 100% | `deletion_requests` status and the SLA monitor (DATA-REQ-036, BL-242) | Server only |
| Deletion verification failures at execution | 0 | `ops/verify-deletion.mjs` and the worker `verify` step (DATA-REQ-034, BL-238) | Server only |
| Child name, nickname or letter text in Spotlight, widget, notification or app switcher (lock on) | 0 | Device test script (WP-F17-09) | None |
| Settings home opens | Under 300 ms on SE 3 (C-NFR-007) | Perf build | None |
| Restores from Recently deleted / letters deleted | Watch only, no target | `letter_deleted{action}` (F18) | Opt-in only |
| Sensitive-data withdrawals per month | Watch only | Server aggregate count of `withdraw` rows (F18) | Server, signed-in only |

## 4. Scope

**In v1.0**
- Settings information architecture: every row 2 taps or fewer from Settings home (C-REQ-016 Rev, PRD-REQ-013).
- Settings > Privacy: analytics and crash reports, sync and family sharing (sensitive-data consent), names in notifications, app lock, who can read each book, the B9 line. Each consent shows its state, version and date, a link to the text, and a control (LEGAL-REQ-008).
- Consent records: Terms and sensitive-data acts shown and withdrawable; analytics acts queued before sign-in and flushed after (F02-REQ-014); re-consent on a major version (LEGAL-REQ-009, sheet owned by F02).
- Leak surfaces, safe by default for everyone: no Spotlight or Siri indexing of content, widgets with no data (F04-REQ-020), notifications without letter text and without names by default (C-REQ-009, D-025).
- App lock with Face ID or the device passcode, off by default, P1 inside v1.0 (decision in section 4.1).
- Recently deleted (D-085): confirm before delete, a 30-day shelf of own letters with first words and the erase day, Restore, Erase now, and the launch purge that erases the recording before the row; with sync on, the server clock rules (DATA-REQ-010, DATA-REQ-013). Built for letters; sole-parent books on the shelf are not built.
- Storage and backup: Settings > Storage lists downloaded packs with sizes, removes them and holds the mobile-data switch (built, ADR 0016 section 4.3); Back up my recordings (`settings/backup.tsx`, new, F08 section 6.5) with its own consent act (F08-REQ-039). Not built.
- Delete a letter (author only), delete a book (sole parent deletes; co-parent leaves and removes own letters), delete the account in the app with export first, subscription notice and manage link, re-authentication, type to confirm, 30-day undo, purge across systems (C-REQ-019, LEGAL-REQ-029, DATA-REQ-019 to DATA-REQ-026).
- Erase everything on this phone (P0, R2 AR-23, R8 R2A-18): signed out, it wipes the phone and resets the free-letter ledger (DATA-REQ-024, F14-REQ-026); signed in, it offers account deletion first and otherwise wipes this phone only, leaving the server untouched and the ledger to heal from the account's own letters at next sign-in, so it is not a ledger reset (6.2 F). Both stay in v1.0: the signed-out path is what DATA-REQ-024 needs, and only counsel can relax a DATA-REQ.
- Web deletion page at `https://earlyletters.com/delete-account`: static page plus email route (D-042). F21 builds the page; F17 owns its content and the runbook.
- Claims accuracy for every privacy line F17 shows, through the claims registry (LEGAL-REQ-044, BL-118).
- About with the "early version, can make mistakes" note (B8), version, the never-rewrite line, Export a copy.
- Edit-level default control for spoken letters, per author (F06 request, F06-REQ-038).
- Data classification enforcement for everything F17 stores (PRD 7.10, PRD-REQ-010).

**Later**
- Cloud transcription consent row (`ai-processing`): v1.1 with F35. No row at v1.0, because nothing is sent to an AI provider.
- Backup mode choice (Standard or Vault): Vault is later (FUTURE T5-06); v1.0 backup is Standard with server escrow (M16).
- Full web deletion flow with sign-in on the page (LEGAL-REQ-030 full, DATA-REQ-021): before Android (F36, D-042).
- Server-built export for the deletion page and for contributors (DATA-REQ-054): v1.1.
- "Leave my letters for {child}" after account deletion (B-REQ-025, P2; needs counsel).
- Report a concern (LEGAL-REQ-056, P1): F20 owns it; the row appears when F20 ships it.
- Per-contributor visibility controls: v1.1 with F32.

**Never**
- Our own app PIN or passcode. The lock uses the device's Face ID or passcode only, so there is no forgotten-PIN path to build or support [R] (B3 spirit: no passwords).
- Content in Spotlight, Siri suggestions, Handoff or Shortcuts donations. Nothing to find means nothing to bypass (R2-S16).
- Deleting another person's letters. Parents can take a family letter out of the book; only the author deletes it (DATA-REQ-015, K-10).
- Export or deletion gated behind accepting new Terms, a plan or a sign-in (LEGAL-REQ-009, LEGAL-REQ-050).
- Retention offers, surveys or extra screens in front of deletion or cancellation (LEGAL-REQ-048 spirit).
- Fear or loss language in any deletion copy (`packages/content/VOICE.md`, CLAUDE.md content rules).

### 4.1 Decision: app lock at v1.0 is P1; the leak surfaces are P0

| Evidence | Reading |
|---|---|
| The one review about a bypass concerns system search, not a missing lock [S] R2-S16 | The fix that protects everyone is "nothing in search", which costs almost nothing and needs no setting |
| Apple Journal and Dearest offer a lock [F] R1-S5, R1-S3; Rosebud has a biometric lock [F] R1-S33 | A lock is parity in the private-journal category, not a differentiator |
| No review in R2 complains that a baby memory app lacked a lock (R2 T9 lists privacy as a reason to choose, not a missing lock) | Demand for the lock itself is unproven [A] |
| A lock adds a permission string. LEGAL-REQ-007 lets CI accept only the microphone and notification keys | Shipping the lock needs a legal-doc change (section 13, Q3) and a device spike |
| A lock in front of capture costs time on the 90 s first-letter path (PS1) | The lock must be off by default |

**Call [R]:** the four surfaces (search, widgets, notification previews, and the app switcher once the lock is on) are P0 for v1.0 and safe by default. The Face ID or passcode lock ships in v1.0 as P1: built after the deletion and consent work, and the first item cut if they run late (dates in `08-delivery.md`). Cut position: after cut order 5 in `05-feature-map.md` section 5. The founder can raise it to P0 (section 13, Q1).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Dearest | PIN and Face ID; says nothing is used to train AI; never hosts or sells [F] R1-S3 | 5.0 (1 rating) | n/a | **Match** the plain no-training line; **Avoid** a separate PIN [R] |
| Remento | States content is not used to train AI; delete account and data any time [F] R1-S13 | 4.8 | n/a | **Match** [R] |
| Day One | End-to-end encryption on all plans; no AI-training statement on the plans page [F] R1-S23 | 4.8 | A reviewer found a passcode bypassed through system search [S] R2-S16 | **Innovate**: nothing indexed, and say what Day One does not [R] |
| Apple Journal | Passcode, Touch ID or Face ID lock [F] R1-S5 | 4.8 | n/a | **Match** an optional lock [R] |
| Rosebud | Encryption in transit and at rest; biometric lock [F] R1-S33 | 4.9 | n/a | Neutral |
| Tiny Treasures | No transcription, no voice analysis; per-memory privacy for family [F] R1-S67 | 5.0 (7) | n/a | Neutral |
| From, Mama | Website links to account deletion [F] R1-S39 | 4.9 | n/a | **Match** a web deletion page (D-042) [R] |
| 23snaps | Private family albums | 4.8 | Family-only photos seen by the wrong audience [S] R2-S17 | **Avoid**: show who can read each book on the Privacy screen [R] |
| Apple rules | 5.1.1(v) in-app deletion; 5.1.1(ii) consent and easy withdrawal [F] R1-S49, R4-S55 | n/a | n/a | Required |

## 6. Experience

### 6.1 Entry points

| Entry | Where | Opens |
|---|---|---|
| Settings | Gear in the Book tab header (`apps/mobile/src/app/(tabs)/book.tsx`, exists) | Settings home |
| Privacy line on a consent sheet | `analyticsConsent.changeLater`, `sensitiveConsent.changeLater` (exist) | Settings > Privacy |
| Settings > Sync paused by consent (F16 C9) | Link "Open Privacy" | Settings > Privacy > Sync and family sharing |
| Letter view menu > Delete | `apps/mobile/src/app/letter/[id].tsx` (exists, local tombstone and Undo today) | Delete a letter (6.2 C) |
| {child}'s book page > Delete the book | F12 entry | Delete a book (6.2 D) |
| Root error screen | F15 "Export what is on this phone" | Export, then Settings |
| Account deleted elsewhere | Auth failure with the deletion marker (F02-REQ-007) | 6.2 E step 9 |
| Web | `https://earlyletters.com/delete-account` (F21 builds, F17 writes) | Static page (6.2 G) |

### 6.2 Happy paths

#### A. Settings information architecture (C-REQ-016 Rev)

Tap counts start on Settings home. "1" means the row is on a section screen one tap from home; "2" means the row is one more tap in. Every row is 2 or fewer. Rows owned by sibling specs are listed so the shell has a slot for each.

| Home row (tap 1) | Rows inside (tap 2) | Owner | State shown on the home row |
|---|---|---|---|
| Account | Signed in as (method, never the full email on the row), Ways to sign in (A-REQ-019), Sync (F16), Sign out, Sign out other devices (F02-REQ-008). Signed out: Sign in | F02, F16 | "Signed in with Apple" or "Not signed in" |
| One row per child (home section "Children") | Name and date, Sign my letters as, Include in my reminders, Pause celebrations, Names and words, Family, Hide this book, Delete the book | F12, F07, F11, F13 | Child name from the local book |
| Add a child; Hidden books (home section "Children") | Add flow; list of hidden books | F12 | Count of hidden books |
| Your words | Word for word: Small fixes, marked, or Exactly as said (6.2 H, D-074); Languages and speech (F05) | F17, F06, F05 | Current edit level |
| Reminders | Cadence, time, pause all, names in notifications | F13 | `cadenceLabel` (exists) |
| Recordings | Where recordings live, recordings without a letter, takes that may not play (D-085), the Word for word setting today | F08 | none |
| Storage and backup | Downloaded language packs and speech models with sizes, Remove, Use mobile data (built, `settings/storage.tsx`, S08); Back up my recordings: on or off, last backed up (`settings/backup.tsx`, new, S05; D-073, M16) | F05, F08, F17 | Space used by packs; "Backed up {date}" when on |
| Appearance | Theme, Reading size | exists | Theme name |
| Privacy | Share usage and crash reports, Sync and family sharing, Names in notifications, Lock with Face ID, Who can read each book, Your agreements and consents | F17 (names toggle mirrors F13) | "Private by default" |
| Plan | Status and dates, Manage or cancel, Restore, Request a refund, Redeem a code, terms. All rows, including Redeem a code (Apple offer codes, D-052 main, M5), are specified in F14; F17 only hosts the Plan row | F14 | Free or Plus |
| Your data | Export everything (F15), Recently deleted (D-085), Delete your account (signed in), Erase everything on this phone | F17, F15 | Last export date (F15, built) |
| Help and Legal | About, How transcription works, Support (F20), If you are struggling (F20), Terms of Service, Privacy Policy, Consumer Health Data Privacy Policy, Subscription terms, Subprocessors, Accessibility statement, Licences, Our 90-day promise | F17, F20 | none |

What `app/settings/index.tsx` shows on 13 Oct: Account (only in a build with server features on: v1.0 per M14, switch off in release profiles on 13 Oct) and Plan; one row per child and Add a child; a Writing section with Spoken language, Reminders and Appearance; a data section (footer `trust.short`) with Privacy, Export, Recently deleted, Recordings and Storage; Delete account (same switch); Help; About with the version. Gaps against the table: no Your words screen (the Word for word setting sits inside Recordings), no Help and Legal screen (legal rows), no Hidden books row on home, no backup row. Every row is within 2 taps.

Rules:
- The beta or early-version card moves off Settings home into About only (K-13 placement, Rev B8). Today it renders at the top of `settings/index.tsx`.
- Legal rows open the versioned page in an in-app browser (`expo-web-browser`, installed). URLs come from `packages/brand` (B11 paths `/terms`, `/privacy`, `/health-privacy`, `/subprocessors`), never hardcoded in screens.
- "Our 90-day promise" text is F15's (PRD-REQ-009); F17 only hosts the row.
- No Plus marks or upsell on any Settings row except the Plan row's state (C-REQ-023).

#### B. Privacy screen and consents

1. Parent taps Privacy. The screen shows, in this order:
   - **Share usage and crash reports**, a switch (`settings.privacy.analyticsLabel`, `analyticsHelp`, exist). Off unless the person said yes on the consent sheet or here. Toggling records `analytics` accept or withdraw with `method='settings_toggle'` and calls the F18 client (`grant()` or `revoke()`, `packages/analytics/src/client.ts`).
   - **Sync and family sharing**, a switch (`sensitiveLabel`, `sensitiveHelp`, exist; help names the health category per CHD HN-4). Shown only when signed in. On means `sensitive-data` accepted.
   - **Names in notifications**, a switch (`lockScreenLabel`, exists; help `settings.privacy.lockScreenHelp`, new, owned by F13). Off by default (D-025). Same control as Settings > Reminders; one stored value.
   - **Lock with Face ID**, a switch (new `settings.privacy.lockLabel`, `lockHelp`; label says "Touch ID" or "Passcode" on devices without Face ID, from the LocalAuthentication type query). Off by default. P1 (section 4.1).
   - **Who can read each book**, one line per book: "Only you", "You and {coParent}", or "On this phone only" when signed out (new `settings.privacy.readers.*`). Data from local membership rows (F11).
   - **Your agreements and consents**, a row to the list (6.2 B step 4).
   - Footer: the promise line (new `settings.privacy.promise`: "We never sell your letters, use them for ads or use them to train machine learning models.") and the staff line (new `settings.privacy.staffAccess`: "We don't look at your letters or listen to your recordings. The few ways we could, and the limits on each, are in our Privacy Policy."). Both go in the claims registry (LEGAL-REQ-044); the promise matches `sensitiveConsent.use` word for word on the no-sale, no-ads, no-training part. The staff line says nothing about logging until the three controls in section 8.2 item 6 are live and counsel approves the stronger wording ("Every access is logged.") (R4 PT-03; F17-REQ-027). The one scoped logging claim allowed before then is F08's `backup.sheetBody` ("We use it only through our recovery service, which logs every use and emails you each time"), because F08-REQ-042 proves it; it says nothing about any other access (R8 R2A-01).
2. Turning **Share usage** off: the switch flips at once, no sheet. The F18 client clears its queue, opts out, resets and retires the id inside the same session (PRD-REQ-018). Signed in: the withdraw act is recorded; offline it queues and uploads later with its device time (F02-REQ-014).
3. Turning **Sync and family sharing** off: a sheet (new `settings.privacy.sensitiveOff.*`). Export is offered as the first line. Then what stops (new letters stop syncing; the other parent stops receiving your new letters) and what stays, said plainly: "Letters already synced stay on our server, and in {child}'s book for {coParent}, until you delete them or your account." (R4 PT-23). Two buttons, deletion first: "Stop syncing and delete my synced letters" and "Stop syncing", and Cancel. "Stop syncing" records `withdraw`; the outbox pauses on `SCCON` (F16 C9). The delete button also calls `withdraw_sensitive_data(p_delete := true)` (new RPC, TDD 05 7.2): own letters tombstoned with `deleted_reason='consent_withdrawn'`, letters stay on this phone. Server mode `sensitive_withdrawal_mode` is `offer` at launch; `enforce` waits on counsel OQ-L1 (BL-240), which must answer before any outside family signs in (Q4). If backup is on, the sheet also offers to turn it off (F08 6.5 D).
4. **Your agreements and consents** lists each document the person acted on, from `my_policy_state` (view, exists) or `my_consents()` (new, BL-114 scope): name, "Agreed {date}" or "Turned off {date}", version, "Read it" link to `/legal/<key>/<version>` (POLICY_VERSIONING section 4). Terms shows "To end this agreement, delete your account" with a link to 6.2 E. Rows at v1.0: Terms of Service, Privacy Policy (acknowledged), Sensitive data, Usage and crash reports, Recording backup (when the owner turned it on, F08-REQ-039; withdrawable from here, which opens F08's turn-off sheet), and the Plus terms acknowledgment when F14 records one. Signed out: only Usage and crash reports, from the device record. Cloud transcription appears in v1.1 with its feature.
5. A major version that needs re-consent shows a dot on the Privacy row and "New version to review" on the document's row; the sheet itself is F02's (F02-REQ-013, LEGAL-REQ-009).

#### C. Delete a letter and Recently deleted (D-085; built for letters)

1. Author opens their letter, taps the menu, Delete. A confirm sheet asks first, with "Keep it" as the large button (`components/book/confirm-sheet.tsx`; `settings.delete.entryTitle`, `entryBody`, `entryConfirm`). Other people's letters show no Delete (DATA-REQ-015).
2. Local tombstone in one transaction; the letter leaves the Book and Tonight; the Undo toast stays until Undo, Close or Back (`components/book/undo-toast.tsx`).
3. With sync on, the change goes out through the outbox; the server sets `deleted_at` (DATA-REQ-013) and the co-parent's device drops it on its next pull (LEGAL-REQ-032).
4. Settings > Recently deleted (`app/settings/recently-deleted.tsx`, home row with `settings.delete.shelfHelp`) lists own deleted letters, newest deletion first: the first words (from the local row, never fetched), the letter's date, the deletion day and the day it will be erased, once, never as a countdown (`components/book/shelf.logic.ts`).
5. Restore puts the letter back exactly as it was (`undeleteEntry`); with sync on it queues an `entry.restore` op that the server applies with `restore_entry()`, never a `deleted_at = null` write (`lib/sync/outbox.ts`).
6. Erase now asks once, then erases the recording and its listening copy and then the row; a file that will not go keeps the row for a retry (`lib/capture/erase.ts`, `store.eraseEntry`). With sync on, `eraseEntry` does nothing today (F16-U17b). Until WP-F16-13 ships, a sync build hides Erase now and shows "Erased on {date}" from the server `deleted_at` plus 30 days instead (F17-REQ-025, R4 PT-27).
7. Day 30 on this phone: the launch purge erases the same way, after the capture sweep and never during a recording; no purge while the phone clock is earlier than the last launch; no local purge when sync is on, where the server purges (DATA-REQ-010, DATA-REQ-011). Deleted text may still sit in an old iPhone backup, which the Privacy Policy says (`recently-deleted.tsx` header).
8. Sole-parent books on the shelf ("Restore the book") are not built; book deletion follows 6.2 D.

#### D. Delete a book

1. Settings > {child}'s book > Delete the book (tap 2).
2. Sole parent: `settings.delete.bookTitle`, `bookBody`, `bookUndo` (exist). With a co-parent: `bookBodyCoParent` (exists): the book stays with the other parent, own letters leave (B-REQ-016, DATA-REQ-014).
3. Export first: `settings.delete.bookExportFirst` (exists), Export is the primary button, Continue is secondary (DATA-REQ-053).
4. Confirm: type the word "delete" (Rev of `bookTypeToConfirmLabel`, section 13 Q8) and tap `bookConfirm`.
5. `request_book_deletion(child, 'ios')` (exists). Sole parent: the book hides on every member's device and appears in Recently deleted with "Restore the book" until day 30. Co-parent: own letters tombstoned and listed in Recently deleted; membership removed (DATA-REQ-014).
6. Day 30: purge of the book, its letters, invites and dictionary terms; Storage prefix queued (DATA-REQ-014, BL-232).
7. Hiding is offered above Delete for a parent who may only need quiet (B-REQ-014). No loss copy anywhere.

#### E. Delete your account (C-REQ-019, LEGAL-REQ-029, DATA-REQ-019 to DATA-REQ-026)

1. Settings > Your data > Delete your account (tap 2).
2. **What happens** (new `settings.delete.account.*`). Per book: "Your {n} letters to {child} will be removed." Co-parent book: "{child}'s book stays with {coParent}." (F11 text). Sole-parent book: "{child}'s book will be deleted." Then: "You have 30 days to change your mind. Sign in before {date} to cancel." "Letters already exported, or saved on a family member's phone, stay where they are." "We keep a record of the agreements you made for as long as the law asks." The retention, and whether the record stays linked to you or is pseudonymised, is counsel's call (OQ-L5; R4 PT-09; F14 owns the subscription consent record). If backup is on: "Your recording backup and our recovery key for it are deleted too."
3. **Export first.** `settings.delete.bookExportFirst`. Export everything is primary; Continue is secondary. After the share sheet closes the flow returns here (F15-U20).
4. **Subscription**, only if the device reads an active auto-renewing Plus purchased by this Apple Account (F14 plan module, on-device `currentEntitlements` and renewal info): "Deleting your account does not cancel Plus. Billing continues through Apple until you cancel." (F14 `plus.plan.deleteNote`). Manage opens Apple's manage sheet in one tap; Continue goes on. Deletion is never blocked on it (DATA-REQ-022). Plus through Family Sharing skips this step: the person is not billed. **[Counsel]** Whether we keep a minimal billing-notice record (email, plan, next renewal date) until the subscription ends, so the renewal notices the law requires still go out, is R4 PT-08 (b); spec default [R]: keep it and say so on this screen with one line (new `settings.delete.account.billingNotice`). F14 owns the record.
4b. **Recordings only in your backup**, only if backup is on and the phone counts backed-up recordings with no local original (F08 6.5 D): `backup.onlyInBackup` with Bring them to this phone first (primary) and Continue. Continue needs a second tap that names the count (R2 AR-09; F08-REQ-035).
5. **Confirm.** Type "delete"; then device owner authentication (Face ID, Touch ID or passcode through LocalAuthentication). If the phone has no passcode set and the session is older than 24 hours, the provider sign-in runs again (DELETION 2.6.1 step 5). Button `settings.delete.accountConfirm` (exists).
6. **Request.** Before the server call, the app sends its current and retired analytics ids to `analytics-forget` (F18, BL-235) and on 202 calls `forgetIds()`. If that call fails, the ids stay on the phone and are retried on every launch, including through the execution wipe, which keeps them until a 202 arrives; the deletion receipt marks the PostHog step `unconfirmed` when it never succeeded (R4 PT-28; F17-REQ-029). Then `request_account_deletion('ios', had_active_subscription)` (exists): one request per account, own letters tombstoned, sole-parent books tombstoned, push tokens deleted, steps created.
7. **Done screen** (new `settings.delete.account.scheduled`): "Your account will be deleted on {date}. Sign in before then to cancel." The app uploads anything unsynced, then signs this phone out (F02 sign-out guard) and ends other sessions at their next refresh (F02-REQ-008). This phone keeps reading, playback and export until execution; writing new letters is paused with one line (F17-REQ-021, section 13 Q5).
8. **Email** (transactional, Resend, B11): receipt with request id, date, how to cancel, what is kept. Templates live on branch `feat/email-brand-library` (unmerged). No child name or letter text (LEGAL-REQ-053).
9. **Grace and execution.** Signing in during grace shows "Deletion scheduled for {date}" with Cancel deletion (primary) and Keep the deletion; Cancel calls `cancel_account_deletion()` and restores letters and books (DATA-REQ-026). On day 30 the `purge-worker` runs the steps in order (6.2 L). When any of the person's devices next launches, it gets an auth failure with the deletion marker, shows "Your account was deleted on {date}", offers one local export, then wipes the local database, audio, Keychain items for that account and the analytics id (DATA-REQ-023, F02-REQ-007).

#### F. Erase everything on this phone (P0; DATA-REQ-024, F14-REQ-026, R2 AR-23)

Settings > Your data > Erase everything on this phone (new `settings.erase.*`).
1. **Signed out.** Export-first step, type "delete", device owner authentication, then the app wipes letters, drafts, audio, listening copies, settings, the analytics id and Keychain items, resets the free-letter ledger (Keychain item and mirror, `eraseLetterLedger()` in `lib/billing/gates.ts`, built and uncalled), and returns to the welcome screen. Nothing is sent to any server.
2. **Signed in.** The first screen says what each choice does: "Delete your account" (opens 6.2 E: server data goes too) or "Erase this phone only": the outbox must be empty first (F02 sign-out guard), then the same local wipe, which removes this phone's Keychain ledger item and mirror with everything else, then sign-out. This is not a ledger reset (F14-REQ-026): the server copy, held drafts, the backup and the other parent's book are untouched, and signing in again brings the synced letters back and heals the ledger from the person's own letters (F11-REQ-025, F14-REQ-023). The screen says so in one line: "Your free letters are not reset, because your letters are still in your account." (new `settings.erase.signedInLedgerLine`).
3. Speech models and language packs stay, because they hold no personal data and are large (F05); a line says so and Settings > Languages and speech can remove them.

#### G. Web deletion page (D-042)

`https://earlyletters.com/delete-account` (F21 builds; B11 domain). Static content written here:
1. App name as on the store listing (`brand.storeName`) and the developer name as in the published legal documents (D-004; never in code).
2. The in-app path in one line: Settings, Your data, Delete your account.
3. What is deleted, what is kept and for how long, from the matrix in section 8.4: consent records, including the subscription consent record (retention per counsel, OQ-L5); the subscription status record (deleted, or kept as a minimal billing-notice record until an active subscription ends, per counsel, R4 PT-08); operational audit rows and the recovery-key log, pseudonymised, 24 months; and the published clock: live systems 31 days, backups 38 days, processors 45 days (K-23). The page no longer says purchase records do not exist (D-080, D-081; R4 PT-29).
4. The email route: write from the account's email address to the support address in `packages/brand` (BL-100; hello@earlyletters.com is live per B11). Support verifies control of the address with a sign-in link and code, then files the request with `source='support'` through `support_request_deletion` (new, service role, BL-237). Acknowledged within 10 days, completed within 45 (LEGAL-REQ-031, LEGAL-REQ-036).
5. Links to `/privacy` and `/privacy-choices` (POLICY_VERSIONING section 4).
No sign-in, form post or script on the page at v1.0. The full web flow (DATA-REQ-021) ships before Android.

#### H. Your words: edit level default (F06 request)

Settings > Your words > Word for word (`settings.tidyLabel`, D-074): two options, "Small fixes, marked" (`tidyOn`, level `clean`) and "Exactly as said" (`tidyOff`, level `verbatim`), with `tidyHelp` under them. Default: Small fixes, marked (F06-REQ-038). Today the row shows inside Settings > Recordings as a description only (`recordings.tsx`), with no control. Stored per author on this device (`settings` key `edit.levelDefault`, L2). Changing it never touches saved letters; Review can still switch per letter. Typed letters show no control (B5).

#### I. About (B8)

Settings > Help and Legal > About: app name from `packages/brand`, version and build (`expo-constants`, installed), then the note in caption style, no badge colour: label "Early version" and body "This is an early version, and it can make mistakes. Read each letter before you save it, and export a copy now and then." (Rev of `settings.about.beta.label` and `.body`, B8), button `settings.about.beta.exportCta` "Export a copy" (exists, opens F15). Then `settings.neverRewrite` (Rev K-26: "We never rewrite your words. We only fix what the microphone got wrong.") and `settings.privacyLine` (exists). The note never appears on Tonight, Listening, Review, the Book, the welcome, the sign-in sheet or the Plus sheet (K-13). It is removed in one release when the founder ends the early-version period.

#### J. App lock (P1)

1. Parent turns on Lock with Face ID. The system Face ID prompt appears once to confirm (LocalAuthentication); on success the setting saves (`settings` key `privacy.appLock = on`, L2, this device only, never synced).
2. From then on: cold start, or return after 60 seconds or more in the background (remote config `appLockGraceSeconds`, default 60, range 0 to 300), shows a plain cover with the app icon and Unlock. Face ID runs at once; passcode is the system fallback. No content renders under the cover.
3. Every time the app goes inactive (app switcher, Control Center, an incoming call), the cover is drawn before iOS takes its snapshot, so the switcher shows the cover, not a letter.
4. With the lock on, notifications use name-free copy whatever the names setting says, and the names row reads "Off while the lock is on" (F17-REQ-015).
5. Turning the lock off needs device owner authentication.

#### K. Leak surfaces (P0, for everyone, lock or not)

| Surface | Rule | Proof |
|---|---|---|
| Spotlight and Siri suggestions | No CoreSpotlight items, no `NSUserActivity` with search or prediction eligibility, no Siri or Shortcuts donations, no Handoff of letter content | CI grep of native code and the built app for `CoreSpotlight`, `isEligibleForSearch`, `isEligibleForPrediction`, `INInteraction`; device test: search Spotlight for "Asha" and a fixture sentence returns nothing from the app |
| Widgets | Static label only, no data read (F04-REQ-020) | F04 test plus a widget snapshot with fixture data present |
| Notification previews | Never letter text (LEGAL-REQ-054); names off by default (C-REQ-009, D-025); server pushes never carry names (D-025, BL-196); lock on forces name-free | F13 payload tests; F17-REQ-015 |
| App switcher snapshot | Cover drawn on inactive when the lock is on | Device test, WP-F17-09 |
| Export files | Plaintext notice; temp file deleted after the share sheet (DATA-REQ-056, F15) | F15 |
| Clipboard | The app never reads the clipboard except on an explicit Paste tap (A-REQ-029) | Code review |

#### L. Purge across systems (account execution, Rev B2, M14)

The worker runs the steps in `supabase/functions/purge-worker/account.ts` `STEP_ORDER` (built): `storage_objects`, `apple_token_revoke`, `posthog`, `powersync_verify`, `email_provider`, `receipt_email`, `auth_user`, then verify and finalize, after `prepare_account_purge`. M14 adds systems the worker does not reach today: the `entry-audio` bucket is marked `since: 'v1.1'` in `purge-worker/lib/buckets.ts`, and nothing deletes backup key rows, push tokens, the status record or escrow logs (R2 AR-22). The full list, with the step that covers each system, is the deletion matrix in section 8.4; the "Account deletion across systems" ADR (section 11) fixes the order.

| # | System | Action | Done when | Clock |
|---|---|---|---|---|
| 1 | Postgres | `prepare_account_purge`: re-check holds, hard-delete own letters, versions, dictionary terms, memberships; books where the person is sole parent; plus the M14 rows in section 8.4 (held drafts, backup rows, restore requests, sessions seen), each with its `purge_ledger` kind (F16 6.2 F step 2a) | Function returns counts | Day 30, within 1 h |
| 2 | Storage | Every registered prefix for the person and for deleted books, `entry-audio` included (set to v1.0 in `buckets.ts`, WP-F08-B3p); single erased letters and discarded held drafts go earlier, by the exact `audio_blobs.object_path` (F08 6.5 D4, D5) | Each prefix lists 0 objects | Day 30 |
| 3 | Apple | Sign in with Apple token revoke with the stored refresh token (F02-REQ-004, BL-330); `not_applicable` without an Apple identity | HTTP 200 or already revoked | Day 30 |
| 4 | PostHog | Done at request time through `analytics-forget`; `unconfirmed` in the receipt if it never returned 202 (F17-REQ-029) | 202 at request, or `unconfirmed` | Day 0 |
| 5 | Sentry | Not in the v1.0 app (privacy label 1.3.0); if added, no user identity is sent and events age out at 90 days (DATA-REQ-033) | n/a | n/a |
| 6 | Resend | Delete the contact and stored message logs; keep only a hashed suppression entry if the person unsubscribed from commercial mail (LEGAL-REQ-053). Resend's deletion API **Unverified** (Q12) | Provider confirms | Day 30 to 45 |
| 7 | Receipt email | "Your account and letters have been deleted", request id and date | Sent | Day 30 |
| 8 | Supabase Auth | `auth.admin.deleteUser`: cascades profile and every table with `on delete cascade` (for example `sync_op_receipts`, `sync_rate_windows`); `children.created_by` set null; `policy_acceptances` handled per counsel | `profiles` row absent | Day 30 |
| 9 | Verify | DATA-REQ-034 checks: no row references the profile id in any person-id column of the data map, except the named exceptions in section 8.4; prefixes empty; Apple 200 | All checks pass | Before finalize |
| 10 | Sync | No third-party replica under D-023; `powersync_verify` is `not_applicable` | n/a | n/a |
| 11 | Backups | Supabase daily database backups roll off in 7 days (DATA-REQ-030); whether deleted Storage objects persist in any Supabase backup is Unverified (Q13) | Day 38 | Day 38 |
| 12 | Devices | At next launch each device gets the deletion marker, offers one export, wipes the database, audio, Keychain items (session, ledger, backup keys, device key) and analytics ids (DATA-REQ-023, F08-REQ-040) | Device test | Next launch |

Each step is idempotent and retried with backoff from 1 minute to 6 hours for 7 days, then the request is `failed` and the founder is paged (DATA-REQ-020, BL-234, BL-242).

**What a book deletion, a leave and Erase everything do** (R2 AR-23): a sole parent's book deletion tombstones the book and its letters and, at day 30, purges them, their photos and their `entry-audio` objects; a co-parent's "delete" is a leave that removes their own letters (DATA-REQ-014); a leave keeps or takes out own letters (F11-REQ-011) and deletes nothing on the server; Erase everything touches only this phone (6.2 F).

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F17-U01 | Offline, toggles Share usage off | Local revoke at once; withdraw act queued with device time | Switch off | Act uploads on reconnect | Unit: no provider call after revoke; queued act flushes |
| F17-U02 | Offline, turns Sync and family sharing off | Local gate stops the outbox at once; act queued; server refuses any stale push with `SCCON` | Switch off; Settings > Sync shows paused (F16 C9) | Act uploads on reconnect | Integration with network blocked |
| F17-U03 | Offline, taps Delete your account | Steps 2 to 5 work; the request needs the server | "Deleting your account needs a connection. Your choice is not sent yet." (new); nothing is queued | Try again online | E2E airplane mode: zero deletion calls, no local wipe |
| F17-U04 | Offline, deletes a letter | Local tombstone; `delete_entry` queued; server clock starts at arrival (DATA-REQ-013) | Letter gone; Recently deleted shows the date from the device clock until sync | Restore works offline as a queued op | Unit; DATA-REQ-010 case 1 |
| F17-U05 | Restores a letter on phone A while phone B deletes it | Last action by server arrival wins; both audited (DATA-REQ-043) | The later action's state on both phones | None needed | Two-device integration |
| F17-U06 | Restore after the 30-day purge already ran | `restore_entry` returns not found; local row already gone after pull | Row disappears from Recently deleted; "This letter was erased on {date}." (new) | None | DB test with clock control |
| F17-U07 | Account deletion requested while letters are unsynced | Outbox drains before sign-out (F02 sign-out guard); request is not sent until the queue is empty | "Sending your last letters first." (new) | Automatic | Integration with a slow network |
| F17-U08 | Account deletion requested on phone A; phone B still signed in | Phone B gets 401 at next refresh after F02-REQ-008, then on execution the deletion marker | Phone B: "Your account is scheduled for deletion on {date}" during grace; "was deleted" after | Sign in on B to cancel during grace | Two-device integration |
| F17-U09 | Signs in during grace | Status from `deletion_requests` (owner select policy exists) | "Deletion scheduled for {date}" with Cancel deletion and Keep the deletion | Cancel restores everything (DATA-REQ-026) | DB test TC-11; E2E |
| F17-U10 | Taps Cancel deletion while the request is `executing` | Server refuses (DATA-REQ-026) | "Your account is being deleted now and can no longer be restored." (new) | Export what is on this phone | DB test |
| F17-U11 | Active Plus subscriber deletes | Subscription step with Manage; deletion continues either way | F14 `plus.plan.deleteNote` | Manage in Apple's sheet | `[C-REQ-019]`, `[DATA-REQ-022]` |
| F17-U12 | Plus through Family Sharing, or subscription state unreadable (StoreKit error) | Family Sharing: step skipped. Unreadable: show the step anyway with neutral wording "If you subscribe to Plus, deleting your account does not cancel it." (new) | Neutral line and Manage | Manage | Unit with a stubbed plan module |
| F17-U13 | Co-parent deletes their account | Own letters tombstoned at request; book, other parent's letters survive; `created_by` set null (DATA-REQ-012) | "{child}'s book stays with {coParent}." | Cancel within 30 days restores the letters | DB TC-07; F11 E2E |
| F17-U14 | Sole parent of two books, one shared later in grace | `prepare_account_purge` re-checks sole-parent status at day 30 (DELETION 2.6.3 step 1) | Nothing new | n/a | DB test |
| F17-U15 | Co-parent tries to delete the shared book | `request_book_deletion` returns `left_and_removed_own_letters`; no option to delete the other's words | `bookBodyCoParent` copy before confirm | Restore own letters for 30 days | DB TC-08 |
| F17-U16 | Last parent tries to leave a book | `SCLPG` from the last-parent guard (DATA-REQ-016) | Offers Delete the book or Hide this book | Choose one | DB TC-09 |
| F17-U17 | Child's name is in Devanagari, Arabic or Chinese script and the keyboard is English | Confirmation asks for the word "delete", not the name (F17-REQ-018) | Field label "Type delete to confirm" (new) | n/a | Unit with a Hindi-script fixture name |
| F17-U18 | Face ID fails or is cancelled at Confirm | Passcode fallback from the system; cancel returns to Confirm with nothing sent | System prompt; then Confirm again | Try again | Device test |
| F17-U19 | No device passcode set | LocalAuthentication reports no owner auth; fall back to provider re-sign-in if the session is older than 24 h, else continue | Provider sheet | n/a | Unit on the policy function |
| F17-U20 | Lock on; Face ID locked out after failed attempts | System passcode fallback; never our own PIN | System passcode screen | Passcode | Device test |
| F17-U21 | Lock on; device passcode later removed in iOS Settings | LocalAuthentication can no longer evaluate; the lock turns itself off and says so once | "Face ID lock is off because this iPhone has no passcode." (new) | Set a passcode, turn the lock on again | Unit with a stubbed policy result |
| F17-U22 | Lock on; app opened from a notification or the widget | Cover first; after unlock, route to the target (capture Ready state or the letter) | Cover, then target | n/a | E2E deep link with lock on |
| F17-U23 | Lock on; incoming call, Siri or alarm during recording | Recording stops and keeps the take (F04, LEGAL-REQ-011); cover drawn on inactive; unlock returns to Review | Cover, then Review with the saved take | n/a | Device interruption test |
| F17-U24 | App killed during the deletion request call | Request is idempotent; next launch reads `deletion_requests` and shows the scheduled screen if it exists (DATA-REQ-044) | Scheduled screen or Delete again | n/a | Kill test 20 of 20 |
| F17-U25 | Duplicate taps on Delete account, Restore, or a consent switch | One op in flight per control; buttons disabled; server functions idempotent | One result | n/a | Unit |
| F17-U26 | Server error (5xx) on `request_account_deletion` | Retry with backoff 3 times, then stop | "We could not send your deletion request. Nothing has changed." (new) | Try again; Support row | Fault injection |
| F17-U27 | `analytics-forget` fails at request time | Deletion still proceeds; ids kept locally, through the execution wipe, and retried on each launch until a 202 (F18-REQ-019); the receipt marks PostHog `unconfirmed` if no 202 ever arrives | Nothing extra | Automatic | `[F17-REQ-029]` fault injection |
| F17-U28 | Major Terms version effective; person taps Not now | Sync and family pause; record, read, export and deletion keep working (LEGAL-REQ-009) | Privacy dot; Terms row "New version to review" | Agree later | E2E |
| F17-U29 | Low storage when the delete flow offers export | F15 space check offers smaller options; Continue without export stays available | F15 `export.spaceLow` | Export one book, or continue | F15-U03 |
| F17-U30 | Signed out, two children, wants to delete one book | Local-only delete with the same 30-day restore from Recently deleted, kept in the local DB; purge at day 30 by the launch sweep | Same copy as sole parent minus the server line | Restore | Unit with clock control |
| F17-U31 | VoiceOver on Settings and every delete step | Each row reads label and value; destructive buttons say what they delete; switches announce state | "Share usage and crash reports, off, switch" | n/a | V-script (LEGAL-REQ-051) |
| F17-U32 | AX5 text on iPhone SE 3 | Rows wrap; no truncation of consent or delete copy; Confirm stays reachable by scrolling | Full text | n/a | AX5 snapshot per screen |
| F17-U33 | Reduce Motion | No animated transitions on the cover or delete steps | Instant changes | n/a | V6 |
| F17-U34 | Remote config fetch fails | Last good copy, else safe defaults: names off, lock grace 60 s, withdrawal mode `offer` | Normal | n/a | Unit on defaults |
| F17-U35 | Person withdraws Sync and family sharing and chooses delete, while a co-parent shares the book | Own synced letters tombstoned on the server; they leave the co-parent's book on the next pull; local copies stay on this phone | Sheet copy names the effect on {coParent} before confirming | Restore from Recently deleted within 30 days, after turning sync back on | DB test plus F11 integration |
| F17-U36 | Hidden book is deleted | Book leaves Hidden books and appears in Recently deleted | Recently deleted row | Restore | Unit |
| F17-U37 | Account deletion with backed-up recordings that are not on this phone | Step 4b before Confirm (F08 6.5 D) | `backup.onlyInBackup` with Bring them to this phone first | Download, or confirm the count | `[F08-REQ-035]` |
| F17-U38 | Signed in, chooses Erase this phone only with letters still queued | Outbox drains first; then local wipe (local ledger copies included) and sign-out; server untouched; not a ledger reset | "Sending your last letters first." then Welcome | Sign in again: letters return and the ledger heals from them | `[F17-REQ-026]` integration |
| F17-U39 | Sync build, letter in Recently deleted | Erase now hidden until WP-F16-13 ships; row shows "Erased on {date}" from server `deleted_at` plus 30 days | Date line, no Erase now | Wait, or Restore | `[F17-REQ-025]` |
| F17-U40 | Turns off Recording backup from Your agreements | Opens F08's turn-off sheet; withdraw act recorded | F08 sheet | Keep or delete | `[F08-REQ-039]` |

## 7. Requirements and acceptance criteria

### 7.1 Existing IDs

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| C-REQ-016 Rev (B8, K-17, M14) | P0 | Settings IA, every row 2 taps or fewer (6.2 A). v1.0 drops the Cloud transcription row and includes Back up my recordings (F08); the early-version card moves to About | Given a signed-in user with 2 books, When a test walks every route from Settings home, Then each row in 6.2 A is reached in 2 taps or fewer and 0 rows need 3. Given Settings home, Then no early-version or beta string renders on it | C, K-17, K-13 |
| C-REQ-019 | P0 | Delete account: export first, subscription notice with manage link before confirm, 30-day undo, type to confirm | Given an active purchased subscription read on the device, When the person reaches Confirm, Then the Export step and the Subscription step were each shown once, in that order. Given confirm, Then the done screen shows a date 30 days from the server `scheduled_for` | C, DATA-REQ-019 |
| C-NFR-005 | P0 | No content in analytics, logs, push payloads or support prefill; no ad or tracking SDKs | Given the E2E run with the Asha fixture, When logs, analytics bodies and push payloads are scanned, Then 0 fixture strings. Given the dependency tree, Then the LEGAL-REQ-016 denylist passes | C, LEGAL-REQ-014, -016 |
| C-NFR-009 | P0 | Remote config for F17 values is audit-logged | Given `appLockGraceSeconds`, `flags.lockScreenNamesDefault` and `sensitive_withdrawal_mode` (server), When one changes, Then an audit row records who, when and old and new value; data collection and paywall values are never remote-configurable (B14) | C, B14 |
| PRD-REQ-010 | P0 | Every store F17 adds carries an L1 to L4 level in the data map | Given a PR adding a device setting key, a column or a function result, Then the data map row lands in the same PR; CI fails without it (BL-016) | PRD 7.10 |
| F17-REQ-082 | P0 | Per-child and person-global settings each 2 taps or fewer | Given 3 books, Then each child page row is 2 taps from home (home child row, then the setting) | PRD; slice of PRD-REQ-013 (home F12), renamed in round 2 (R9 R2D-04) |
| F17-REQ-083 | P0 | Turning analytics off stops sending in the session | Given consent then the Privacy switch off, When 10 events are tracked, Then 0 reach the provider and the queue length is 0 (`packages/analytics/test/analytics.test.ts` guarantee 4) | PRD, F18; slice of PRD-REQ-018 (home F18), renamed in round 2 (R9 R2D-04) |
| F17-REQ-081 | P0 | Analytics and crash reports opt-in; Privacy switch withdraws | Given a fresh install through first letter, Then 0 requests to PostHog or Sentry hosts. Given the switch off, Then Sentry is closed and PostHog opted out before the next event | Legal, F18; slice of LEGAL-REQ-003 (home F18), renamed in round 2 (R9 R2D-04) |
| LEGAL-REQ-006 | P0 | Separate sensitive-data consent; withdrawal stops sync and offers export and deletion | Given withdraw, When the next sync runs, Then 0 entry writes are accepted (`SCCON`) and the sheet offered Export and "delete my synced letters" | Legal, BL-240 |
| LEGAL-REQ-007 Rev (F17 lock) | P0 | Only listed permission keys; adds `NSFaceIDUsageDescription` if the lock ships | Given the built Info.plist, Then the permission keys are exactly microphone, notifications and, when WP-F17-08 is merged, Face ID. Any other key fails CI. **[Counsel]** approves the Face ID purpose string | Legal, section 13 Q3 |
| LEGAL-REQ-008 | P0 | Every consent visible and withdrawable in 2 taps, recorded with `settings_toggle` | Given each consent row (Usage and crash reports; Sync and family sharing), When toggled from Settings home, Then 2 taps or fewer and one `policy_acceptances` row with `method='settings_toggle'` exists (signed in) | Legal |
| LEGAL-REQ-009 | P0 | Major policy change: re-consent; never gate export or delete | Given a declined major `terms`, When the person exports and requests deletion, Then both complete | Legal, F02-REQ-013 |
| LEGAL-REQ-014 | P0 | Content never in URLs, logs, push payloads, support prefill or analytics | Given the log canary over the delete, restore and consent flows, Then 0 matches | Legal, BL-239 |
| LEGAL-REQ-022 (b) | P0 | Device database and audio use Data Protection at least "complete until first user authentication" | Given a device build, Then the file protection class on `scribe.db` and `audio/` is asserted in a device test (BL-245) | Legal |
| LEGAL-REQ-029 Rev (B2, M14) | P0 | In-app account deletion reaches every system in the section 8.4 matrix | Given a staging fixture account with letters, a dictionary, two books (one shared), backed-up recordings with key rows, a push token, a status record and an analytics id, When execution finishes, Then `ops/verify-deletion.mjs` finds 0 rows or objects referencing the profile id except the named exceptions in 8.4 | Legal, BL-238, R2 AR-22 |
| LEGAL-REQ-030 Rev (D-042) | P0 | v1.0: static `/delete-account` page plus email route; full web flow before Android | Given the page, Then it names `brand.storeName`, gives the in-app path first, lists retained data and the 31 / 38 / 45 clock, and has no script or form. Given an emailed request, Then the runbook acknowledges within 10 days and completes within 45 | Legal, D-042, BL-243 |
| LEGAL-REQ-031 | P0 | Published deletion clocks | Given a request on day 0, Then live data is gone by day 31, backups by day 38, processors by day 45; the SLA monitor pages at day 31 for any unheld tombstone | Legal, K-23 |
| LEGAL-REQ-032 | P0 | Honest deletion across devices | Given two member devices, When the author deletes a letter, Then both drop it after their next pull; the delete copy says exported copies stay | Legal |
| LEGAL-REQ-033 Rev (B2) | P0 | Retention schedule enforced by code; the 7-year purchase ledger row no longer applies (no table, B2) | Given `retention.test.mjs` with time travel, Then tombstones go at 30 days, audit events at 24 months, acceptances 3 years after pseudonymisation | Legal, F14-REQ-012 |
| LEGAL-REQ-044 | P0 | Every privacy claim F17 shows is in the claims registry | Given `settings.privacy.promise`, `.staffAccess`, `settings.neverRewrite`, the About note and the backup lines F17 hosts, When the content test runs, Then each key is registered with its data-map facts | Legal, BL-118 |
| LEGAL-REQ-051 | P0 | WCAG 2.2 AA on Settings, consents and deletion | Given AX5 on SE 3 and VoiceOver, Then every step in 6.2 B to J is completable with 0 truncations | Legal |
| DATA-REQ-010 | P0 | Letter delete and restore on the server clock | Given an offline delete synced 3 days later, Then Recently deleted shows the erase date from server `deleted_at` | DATA spec |
| DATA-REQ-011 | P0 | Purge reaches every copy we control | Given a device offline 60 days, When it launches, Then letters tombstoned more than 30 days ago and their audio are deleted before any UI shows them | DATA spec, BL-134 |
| DATA-REQ-013 | P0 | No direct un-delete | Given a synced letter, When Undo or Restore runs, Then the op is `restore_entry`, never `deleted_at = null` | DATA spec |
| DATA-REQ-014, F17-REQ-080 | P0 | Book deletion follows the equals rule | Given two parents, When A deletes the book, Then B's letters stay and A's are tombstoned; given a sole parent, Then the book hides for every member and is restorable for 30 days | DATA spec, B; slice of B-REQ-016 (home F12), renamed in round 2 (R9 R2D-04) |
| DATA-REQ-015 | P0 | Nobody deletes another person's words | Given a co-parent's letter, Then no Delete control renders and `delete_entry` returns not found | DATA spec |
| DATA-REQ-019 | P0 | Delete account in 2 taps, no email or support contact | Given Settings home, Then Delete your account is 2 taps away and completes in-app | DATA spec, App Review 5.1.1(v) |
| DATA-REQ-020 | P0 | Execution order | Given a due request, Then `auth_user` runs only after `storage_objects` is done and finalize refuses while a `profiles` row exists | DATA spec |
| DATA-REQ-022 Rev (B2) | P0 | Subscription notice read on the device; no server billing step | Given an active purchase on the device, Then the notice and Manage were shown and `had_active_subscription = true` is sent; given Family Sharing, Then the step is skipped | DATA spec, B2 |
| DATA-REQ-023 | P0 | Device wipe after execution | Given execution done, When the phone next launches, Then one export is offered, then database, audio, Keychain items for the account and analytics ids are gone | DATA spec, F02-REQ-007 |
| DATA-REQ-024 Rev (AR-23) | P0 | Erase everything on this phone (6.2 F) | Given no account, When confirmed, Then 0 server requests, an empty local store except speech models and packs, and the next kept letter is free letter 1 | DATA spec; F14-REQ-026 |
| DATA-REQ-025 | P0 | Receipts without content | Given completion, Then the receipt holds request id, timestamps, counts and step statuses only | DATA spec |
| DATA-REQ-026 | P0 | Cancel in grace | Given `scheduled`, When Cancel, Then letters and books return; given `executing`, Then Cancel is not offered | DATA spec |
| DATA-REQ-033 Rev (TDD 05 X-02) | P0 | Analytics id is never stored on our server; PostHog deletion runs at request time | Given a deletion request, Then no table holds an analytics id, and the `posthog` step is `not_applicable` | DATA spec, BL-235 |
| DATA-REQ-034 | P0 | Verification before finalize | Given a completed request, Then every check in 6.2 L step 9 passed | DATA spec |
| DATA-REQ-036 | P0 | SLA monitor | Given a tombstone 31 days old and unheld, Then the founder is paged within 1 hour | DATA spec, BL-242 |
| DATA-REQ-053 | P0 | Export is primary before every book or account Confirm | Given either flow, Then Export is the primary button on the step before Confirm | DATA spec |
| A-NFR-011 | P0 | Apple token revoked on deletion | Given an Apple identity, Then the revoke step returns 200 | A |
| K-13 Rev (B8) | P0 | The early-version note lives only in About | Given every screen in 6.2 I's exclusion list, Then 0 early-version strings | K-13, B8 |
| K-14 | P0 | How transcription works is always in Help and Legal | Given Settings, Then `settings.help.mistakes` is reachable in 2 taps | K-14 |

### 7.2 New requirements

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| F17-REQ-001 | P0 | Settings shell owns slots for sibling screens | Given each sibling row in 6.2 A, Then the route exists (or renders a disabled row with no "coming soon" copy) and the tap test in C-REQ-016 passes | C-REQ-016 |
| F17-REQ-002 | P0 | Privacy screen lists every v1.0 consent with state, version and date | Given a signed-in user who accepted Terms 1.0.0 and sensitive-data 1.0.0 and declined analytics, Then the list shows 4 rows with those versions and "Turned off" for analytics | LEGAL-REQ-008 |
| F17-REQ-003 | P0 | Privacy screen shows who can read each book | Given 2 books (one shared with a co-parent, one not), Then the lines read "You and {coParent}" and "Only you"; signed out, "On this phone only" | R2-S17 |
| F17-REQ-004 | P0 | Promise and staff-access lines match the consent text | Given `settings.privacy.promise` and `sensitiveConsent.use`, Then the no-sale, no-ads, no-training clauses match word for word (content test) | B9, LEGAL-REQ-044 |
| F17-REQ-005 | P0, Rev (D-085) | Recently deleted shelf | Given 3 deleted letters, Then 3 rows, newest deletion first, each with first words, deletion day and erase day, Restore and Erase now, and no countdown; Restore returns each to its prior state; Erase now removes the recording before the row. Given a sole-parent book deleted, Then it appears with Restore the book (not built) | DATA-REQ-010; D-085 |
| F17-REQ-006 | P0 | Undo after sync goes through `restore_entry` | Given a synced letter deleted then undone, Then the outbox holds one `restore_entry` op and 0 direct `deleted_at` writes; `store.ts` `undeleteEntry` is used only for never-synced rows | DATA-REQ-013 |
| F17-REQ-007 | P0 | No content in system search or donations | Given the release build, When CI greps native sources and the binary, Then 0 uses of `CoreSpotlight`, `isEligibleForSearch`, `isEligibleForPrediction`, `INInteraction`. Given a device with the Asha fixture, When Spotlight searches "Asha" and a fixture sentence, Then 0 results from the app | R2-S16 |
| F17-REQ-008 | P1 | App lock with device Face ID, Touch ID or passcode; no app PIN | Given the lock on, When the app cold-starts or returns after 60 s or more, Then the cover shows and no letter, name or child row renders until LocalAuthentication succeeds | R1-S5, section 4.1 |
| F17-REQ-009 | P1 | App switcher snapshot hides content when the lock is on | Given the lock on and a letter open, When the app goes inactive, Then the snapshot shows the cover (device screenshot of the switcher) | R2 section 0 item 2 |
| F17-REQ-010 | P1 | Lock grace from remote config | Given `appLockGraceSeconds = 0`, Then any return shows the cover; given 300, Then a return after 299 s does not; values outside 0 to 300 clamp | C-NFR-009 |
| F17-REQ-011 | P1 | Lock state is device-only | Given the lock on, Then the value lives in the device `settings` table, never in Postgres, sync payloads or analytics values (only `settings_changed{key}`) | PRD 7.10 |
| F17-REQ-012 | P0 | Account deletion re-authenticates the device owner | Given Confirm, Then LocalAuthentication device owner auth runs; with no passcode and a session older than 24 h, provider sign-in runs; cancel sends nothing | DELETION 2.6.1, TDD 04 MASVS-AUTH-3 |
| F17-REQ-013 | P0 | Analytics ids leave with the deletion request, never stored | Given consent history with 2 retired ids, When deletion is requested, Then `analytics-forget` receives 3 ids before `request_account_deletion`, and on 202 `forgetIds()` empties local storage | TDD 05 X-02, BL-235 |
| F17-REQ-014 | P0 | Deletion done screen and grace status | Given a request, Then the done screen shows the server `scheduled_for` date; given sign-in during grace, Then the status screen shows the same date and Cancel deletion | DATA-REQ-026 |
| F17-REQ-015 | P0 | Lock on forces name-free notifications | Given the lock on and names on, When a reminder is scheduled, Then its title and body contain no child name (Asha fixture); the names row reads "Off while the lock is on" | D-025, R2 section 0 item 2 |
| F17-REQ-016 | P0 | Sensitive-data withdrawal sheet offers export and deletion of synced letters | Given withdraw with delete, Then `withdraw_sensitive_data(true)` tombstones own entries with `deleted_reason='consent_withdrawn'` and 0 local rows are removed | LEGAL-REQ-006, TDD 05 X-08 |
| F17-REQ-017 | P0 | Edit-level default per author | Given Exactly as said chosen in Settings, When a new spoken draft opens Review, Then the level is verbatim; saved letters are unchanged; typed letters show no control | F06-REQ-038, B5 |
| F17-REQ-018 | P0 | Type-to-confirm uses the word "delete", not the child's name | Given a child named in Devanagari and an English keyboard, Then the book and account confirms accept "delete" (case-insensitive, trimmed) and nothing else | P4, LEGAL-REQ-051 |
| F17-REQ-019 | P0 | About shows the early-version note, version and Export a copy | Given About, Then label, body, version and build, and Export a copy render; Export a copy opens F15 | B8, K-13 |
| F17-REQ-020 | P0 | Legal rows open versioned pages from `packages/brand` | Given each Help and Legal row, Then its URL starts with the brand domain and matches B11 paths; 0 hardcoded URLs in `apps/mobile/src/app/settings/` (grep) | B11, LEGAL-REQ-008 |
| F17-REQ-021 | P0 | During grace, this phone reads and exports but does not write | Given a scheduled deletion signed in on this phone, Then Speak and Type show one line "Your account is set to be deleted. Cancel the deletion to write again." (new) and record, play and export work | Section 13 Q5 |
| F17-REQ-022 | P0 | Offline deletion is never queued | Given airplane mode, When Delete your account is confirmed, Then 0 requests are queued and the person sees the offline line | F17-U03 |
| F17-REQ-023 | P0 | Web deletion page content | Given `/delete-account`, Then the 5 items in 6.2 G are present and the page loads no script; axe reports 0 critical violations (LEGAL-REQ-051) | D-042 |
| F17-REQ-024 | P0 | Settings home opens fast | Given SE 3 with 3 books, Then Settings home is interactive in under 300 ms (perf build) | C-NFR-007 |
| F17-REQ-025 | P0 | Erase now is hidden in a sync build until the server erase op ships | Given `capabilities.sync` true and WP-F16-13 not merged, Then Recently deleted shows no Erase now and shows "Erased on {date}" from server `deleted_at` plus 30 days | R4 PT-27; F16-U17b |
| F17-REQ-026 | P0, Rev (R2A-18) | Erase everything signed in offers account deletion first and otherwise wipes this phone only, after the outbox drains; it is not a ledger reset | Given a signed-in phone with 2 queued ops and 5 own letters on the server, When Erase this phone only is confirmed, Then both ops reach the server, the local store is empty, the server rows are unchanged, and after signing in again the ledger reads at least 5 (healed, F14-REQ-023), never 0. The signed-out reset is DATA-REQ-024 | R2 AR-23; F14-REQ-026; R8 R2A-18 |
| F17-REQ-027 | P0, Rev (R2A-01) | Privacy strings claim only what the system proves | Given the release build, Then `settings.privacy.staffAccess` is the 6.2 B text, and no string claims that every access, or every use, is logged, with one exception: `backup.sheetBody` may say the recovery service logs every use and emails the owner, scoped to that service, while F08-REQ-042 passes. The unscoped line waits until 8.2 item 6 (a) to (c) pass and counsel approves | R4 PT-03; LEGAL-REQ-044; R8 R2A-01 |
| F17-REQ-028 | P0 | Privacy label 1.4.0 and the manifest match the M14 build (8.5) | Given the submission build, Then each row in 8.5 is in App Store Connect and the `PrivacyInfo` collected types match; counsel has signed off | R4 PT-24; F21-REQ-007; F08-REQ-038 |
| F17-REQ-029 | P0 | PostHog deletion is retried until confirmed, and an unconfirmed deletion is reported as such | Given `analytics-forget` failing at request and at execution, Then the ids survive the execution wipe, are retried at each launch, and the receipt shows PostHog `unconfirmed` | R4 PT-28 |
| F17-REQ-030 | P0 | Withdrawal sheet states what stays on our server | Given Sync and family sharing turned off, Then the sheet shows Export first, the "stay on our server" line, and the delete option above Stop syncing | R4 PT-23 |

### Inherited requirements whose home is this spec (round 2)

These IDs were cited in V2 with no definition row (R9 R2D-06). The text is taken from the source named in the last column; that source still governs the full wording. Each P0 row has a work package and a test in section 12.

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| DATA-REQ-001 | P0 | The data inventory is the source of truth: every table, column, bucket, device store, SDK and vendor has class, owner, retention and reason | Given a PR adding a store, Then the inventory row exists before merge (S17 lands it, 08 section 4) | `docs/legal/DELETION_AND_EXPORT_SPEC.md` on `develop` DATA-REQ-001 |
| DATA-REQ-004 | P0 | No content outside content stores, including audit events and deletion receipts | Given the log canary over audit and receipt writes, Then zero fixture strings | `docs/legal/DELETION_AND_EXPORT_SPEC.md` on `develop` DATA-REQ-004 |
| DATA-REQ-021 | P0 | Web deletion URL at `/delete-account` on the company domain | Given the website, Then `/delete-account` serves the deletion page | `docs/legal/DELETION_AND_EXPORT_SPEC.md` on `develop` DATA-REQ-021 |
| DATA-REQ-027 | P0 | Support-initiated deletion uses the same functions under the service role with `source='support'` and an audit event | Given a support deletion in staging, Then the same steps run and one `support_access` audit row exists | `docs/legal/DELETION_AND_EXPORT_SPEC.md` on `develop` DATA-REQ-027 |
| DATA-REQ-063 | P1 | Support mail deleted 2 years after the last message; never copied into tickets with content | Given the support runbook, Then the retention line exists | `docs/legal/DELETION_AND_EXPORT_SPEC.md` on `develop` DATA-REQ-063 |
| DATA-REQ-064 | P0 | Consent records are pseudonymised at account deletion and deleted 3 years after | Given `retention.test.mjs` with time travel, Then consent rows follow the period | `docs/legal/DELETION_AND_EXPORT_SPEC.md` on `develop` DATA-REQ-064 |
| DATA-REQ-066 | P0 | Operational record retention: `audit_events` 24 months, closed `deletion_requests` 3 years, `purge_ledger` 60 days, `storage_purge_queue` 7 days after done, `exports` objects 7 days | Given `retention.test.mjs` with time travel, Then each table follows its period | `docs/legal/DELETION_AND_EXPORT_SPEC.md` on `develop` DATA-REQ-066 |
| LEGAL-REQ-025 | P0 | Staff and service-role access is break-glass and logged: no staff tool shows content; each runbook run writes one content-free audit row | Given a runbook execution, Then exactly one audit row exists and it holds no content | `docs/legal/ENGINEERING_REQUIREMENTS.md` on `develop` LEGAL-REQ-025; M16 |
| LEGAL-REQ-036 | P1 | Verified rights requests by email, logged without content | Given a request, Then the log shows receipt, verification, completion and outcome | `docs/legal/ENGINEERING_REQUIREMENTS.md` on `develop` LEGAL-REQ-036 |
| LEGAL-REQ-041 | P0 | One data map drives every disclosure | Given a change that adds a network host or SDK, When CI runs, Then it fails unless the data map lists it | `docs/legal/ENGINEERING_REQUIREMENTS.md` on `develop` LEGAL-REQ-041 |

## 8. Data, privacy and security

### 8.1 What F17 creates or reads

| Data | Level | Where | Who reads | Retention | Never |
|---|---|---|---|---|---|
| `policy_acceptances` rows (`terms`, `privacy`, `sensitive-data`, `analytics`) | L2 columns, L3 `profile_id`, `subject_hash`, `locale` (DATA_CLASSIFICATION 4.1) | Postgres (exists) | Owner through `my_policy_state`; service role | Account life, then pseudonymised and kept 3 years (DATA-REQ-064) **[Counsel]** OQ-L5 | Free text, IP address, user agent (POLICY_VERSIONING 7.1) |
| Queued consent acts before sign-in | L2 | Device `settings` | App | Until uploaded (F02-REQ-014) | Uploaded without a Terms row first |
| Analytics consent state and ids | L2 (DATA_CLASSIFICATION 4.6) | Device storage (`packages/analytics/src/consent.ts` keys) | App | Retired ids capped at 20; forgotten after deletion request | Any server table |
| `deletion_requests`, `deletion_request_steps` | L2, L3 `profile_id`, `child_id`, `had_active_subscription` | Postgres (exists) | Owner select; service role | 3 years after completion (DATA-REQ-066) | Content in `receipt` |
| `audit_events` for delete, restore, cancel | L2 enum detail, L3 actor | Postgres (exists) | Owner; service role | 24 months (DATA-REQ-066) | Content; detail over 512 bytes |
| Tombstoned letters and books | L4 (content) | Device and Postgres | Author only (letters); book members lose access at tombstone | 30 days, then purge | Readable by co-members after tombstone |
| `privacy.appLock`, `edit.levelDefault`, names toggle | L2 | Device `settings` | App | Install, or wipe | Synced; sent as values to analytics |
| Lock cover | none | Memory | n/a | n/a | Content under the cover |
| Web deletion requests by email | L3 (email), L4 if the person pastes a letter | Support mailbox | Founder, support | 2 years after the last message (DATA-REQ-063) | Copied into tickets with content |

### 8.2 Classification enforcement (PRD 7.10, PRD-REQ-010)

1. Every new device key and server object above has its row in `docs/legal/data-map.yaml` in the same PR (BL-016). Until the map exists, the row goes in `docs/legal/data-policy.md` section 4 and DATA_CLASSIFICATION section 4 (BACKLOG DoD item 5).
2. L4 never in analytics, logs, push payloads, URLs or support prefill. F17 screens render L4 (letter first lines in Recently deleted, child names) only from the local database, never from a server call made for that screen.
3. The Recently deleted first line is read from the local row; a tombstoned letter of another author is never shown.
4. The support row (F20) prefills app version and plan state only, no content (C-REQ-016).
5. Device stores L4 under iOS Data Protection at least "complete until first user authentication" (LEGAL-REQ-022(b)); BL-245 asserts it. Database encryption with SQLCipher stays "no for v1" (BL-245 scope, LEGAL-REQ-022(d)); the privacy copy must not claim the local database is encrypted.
6. L3 and L4 reach staff only through named runbooks that write `ops.audit_log` (table built in `20261004200000_ops_deletion_worker.sql`; LEGAL-REQ-025, BL-236, BL-237). That alone does not make "every access is logged" true: reads through the Supabase dashboard SQL editor are not logged (Privacy Policy CN-8). The stronger staff line may return only when all three hold [R]: (a) database-level audit of service-role and dashboard sessions, through `pgaudit` or a log drain [A: availability on our Supabase plan checked in WP-F17-16], live before C1; (b) the release check that the escrow key runs only in the separate escrow project, alone with the `escrow` function (F08-REQ-034); (c) a quarterly log review written down in `docs/runbooks/`. Until then the line in 6.2 B stands, and any recording access goes through `escrow_unwraps` (F08 6.5 C).

### 8.3 Claims accuracy

Every privacy sentence F17 shows is a registered claim (LEGAL-REQ-044, BL-118). F17's claims and the facts they rest on:

| Key | Claim | Fact it rests on | Breaks if |
|---|---|---|---|
| `settings.privacy.promise` (new) | Never sold, never for ads, never to train models | LEGAL-REQ-016 denylist; subprocessor no-training terms (subprocessors.md: Supabase yes, PostHog yes, Sentry partly) | Sentry "Additional Uses" toggles are on; any processor without a no-training clause holds content |
| `settings.privacy.staffAccess` (new) | We don't look at letters or listen to recordings; the ways we could are in the Privacy Policy | LEGAL-REQ-025; `ops.audit_log`; `escrow_unwraps` and the 6.5 C rules (F08); Privacy Policy CN-8 lists dashboard access | A staff tool reads content outside a runbook; the Policy omits a path. "Every access is logged" is not claimed until 8.2 item 6 (a) to (c) hold |
| `settings.privacy.analyticsHelp` (exists) | Never letters, recordings, photos or names | `packages/analytics` allowlist (39 tests) | A new event property not L2 |
| `settings.recordings.onPhoneBody` (exists, F08) | Recordings are kept on this phone and in the iPhone's own backup | D-033 | Recordings excluded from device backup; owners with backup on see `backup.lastBackedUp` instead |
| `backup.sheetBody` (new, F08) | Encrypted on the phone; a recovery key we hold; used only through our recovery service, which logs every use and emails the owner; never listened to, sold or used to train | F08 6.5 C and G; F08-REQ-029, F08-REQ-034, F08-REQ-042 (append-only `escrow_unwraps`, daily copy, email per use); M16. The Privacy Policy states the honest limit (F08 6.5 C) | The escrow key is used outside the function without the owner being told; the log stops being append-only; an email per use stops; counsel changes the wording |
| `settings.neverRewrite` (Rev K-26) | We never rewrite your words | CLAUDE.md constitution, `verifyEdits` | Any feature that rewords |
| About note (Rev B8) | It can make mistakes | Terms 11.4 to 11.6 (in-app-disclosures section 5) | n/a |
| Web deletion page | 31 / 38 / 45 days | K-23; Supabase Pro 7-day backups (DATA-REQ-030) | PITR raised above 7 days |

No string says "only on this phone", "end-to-end", "anonymous" or "encrypted" about the local database, or "only you can play" or "only your family's keys" about backup (LEGAL-REQ-044 rule; R-10; M16).

### 8.4 Deletion matrix (R2 AR-22)

One row per system that holds the person's data in the M14 build. "Request" is day 0; "execution" is day 30. Owning stream per `08-delivery.md` section 3. Every row has a test in `ops/verify-deletion.mjs` or the named suite.

| System | Data | At request | At execution | Owner | Test |
|---|---|---|---|---|---|
| Postgres content | Own letters, versions, dictionary, memberships, sole-parent books | Tombstone; letters leave shared books | Hard delete (`prepare_account_purge`) | S02 | DB TC-07 to TC-11 |
| Storage `entry-photos`, `child-photos` | None uploaded in v1.0 | n/a | Prefixes deleted (built) | S07 | Functions test |
| Storage `entry-audio` | Backup ciphertext | Uploads stop | Prefixes deleted; `buckets.ts` set to v1.0. Before that, a single erased letter or discarded held draft is deleted by its exact `object_path` (R8 R2A-03, R2A-04) | S07 (worker), S05 | `[F08-REQ-024]`, `[F08-REQ-043]` |
| `audio_blobs`, `child_keys`, `backup_devices`, `restore_requests`, stop-link tokens | Wrapped keys, device public keys, restore requests | Pending restore requests cancelled | Deleted, each with its ledger kind | S05 tables, S02 purge function | `[F08-REQ-040]` server part |
| `held_drafts` | Held and waiting letters (F16 6.2 I) | Kept for the grace period, so a cancel restores them | Deleted (`held_draft` ledger kind) | S02 | `[F16-REQ-029]` deletion case |
| `account_sessions_seen` | Session ids, first seen | n/a | Deleted (`session_seen` ledger kind) | S02 | DB test |
| `escrow_unwraps` and its daily copy in `ops-ledger/escrow/` | Recovery-key log | n/a | Profile id pseudonymised in the table; kept 24 months (named exception). Daily copies hold ids only and roll off in 60 days | S02, S07 | Verify script exception list |
| Keychain on each device | Session, ledger, backup keys, device key | n/a | Deleted at next launch; a key on a device never opened again decrypts nothing once objects are purged | S01, S05, S06 | Device test; `[F08-REQ-040]` |
| `sync_op_receipts`, `sync_rate_windows` | Op ids, counters | n/a | Cascade on profile delete (built) | S02 | DB test |
| `push_tokens`, `notify_outbox` | Push tokens, pending notices | Deleted (no pushes during grace) | n/a | S02 | DB test |
| Subscription status record (D-080) | Plan, trial end, renewal date, cancelled flag | Kept | Deleted, or kept as a minimal billing-notice record until an active subscription ends **[Counsel]** (R4 PT-08) | S06 (F14 owns) | F14 test |
| `policy_acceptances`, incl. the D-081 subscription consent | Consent acts | Kept | Linked or pseudonymised and kept per counsel (OQ-L5; R4 PT-09) | S02, S17 | Retention test |
| `deletion_requests`, steps, receipt | Request record | Created | Kept 3 years (DATA-REQ-066) | S02 | DB test |
| `audit_events`, `ops.audit_log` | Actor ids, enum details | Kept | Actor ids pseudonymised; kept 24 months (named exception, R4 PT-34) | S02 | Verify script exception list |
| `ops.apple_tokens` | Apple refresh token | Kept | Revoked at Apple, then deleted (BL-330) | S01, S07 | Functions test |
| PostHog | Analytics persons | `analytics-forget`; ids kept on the phone until 202 | Receipt marks `unconfirmed` if never confirmed | S18 | `[F17-REQ-029]` |
| Resend | Contact, message logs | n/a | Contact deleted; suppression hash kept if unsubscribed | S07 | Fake vendor test |
| Supabase Auth | Auth user, identities | Sessions end at next refresh | `deleteUser` | S07 | Functions test |
| Support mailbox | Any mail from the person | n/a | Runbook deletes threads not needed for an open case (F20) | Founder | Runbook check |
| Database backups | All of the above | n/a | Roll off by day 38; a restore inside the window replays every ledger kind, so nothing deleted comes back (F16 6.2 F step 2a, F16-REQ-031) | Founder | Restore drill timing; `[F16-REQ-031]` |
| Restore-drill scratch projects (R8 R2A-16) | A copy of production, only when a drill must use production data | n/a | Deleted within 24 hours of the drill, with `ops.audit_log` rows for the restore and the deletion; never holds the escrow secret (F08 6.5 G5) | Founder | Drill checklist |

Named exceptions appear on the deletion screen, the web page and the Privacy Policy: pseudonymised consent records, pseudonymised audit and recovery-key logs, the deletion receipt, a suppression hash, and, if counsel agrees, the billing-notice record. The Privacy Policy also names restore-drill scratch projects and their 24-hour life.

### 8.5 Privacy label and manifest for the M14 build (R4 PT-24)

Label 1.3.0 (`docs/legal/app-store-privacy-labels.md`) describes the on-device build. With accounts, sync, backup and the status report, S17 drafts 1.4.0 and counsel approves it before submission; F21-REQ-007 owns the App Store Connect entry and S20 the `PrivacyInfo` manifest (BL-349), whose collected types must match.

| Row | 1.3.0 says | 1.4.0 must say | Why |
|---|---|---|---|
| User Content, Audio Data | No | Yes, linked, App Functionality | Backup uploads recordings we can recover (M16; F08-REQ-038) |
| Purchases, Purchase History | Analytics only | Yes, linked, App Functionality and Analytics | The D-080 status report |
| Contact Info, Email Address | Account and deletion emails; no subscription emails | Add billing notice emails | D-080, D-081 |
| User Content, Other User Content; Identifiers, User ID; Sensitive Info (due date) | Yes | Unchanged; confirm against the synced columns | M14 sync |

F17-REQ-028 holds the requirement.

## 9. Non-functional requirements

| Budget | Value | Gate |
|---|---|---|
| Settings home interactive | Under 300 ms on SE 3 (C-NFR-007) | Yes |
| Any Settings sub-screen interactive | Under 300 ms on SE 3 [A] | No; measured |
| Consent switch to local effect | Same frame; provider opted out before the next `track()` | Yes (PRD-REQ-018) |
| Lock cover on inactive | Drawn before the snapshot; verified on SE 3 and a 6.1-inch phone | Yes, if the lock ships |
| Unlock to content | Under 1 s after Face ID success [A] | No |
| Deletion request round trip | p95 under 2 s on good LTE [A]; endpoint budget per PRD 7.2 write class | No |
| Deletion clocks | 31 / 38 / 45 days (K-23) | Yes |
| Accessibility | WCAG 2.2 AA, AX5, VoiceOver script for consent and deletion (LEGAL-REQ-051); shared rules in `06-nfr.md` | Yes |
| Battery | No timers or background work in F17 | Yes |

## 10. Analytics

All events fire only after analytics consent (F18, LEGAL-REQ-003). Properties L2 only.

| Event | Status | Properties | Question |
|---|---|---|---|
| `screen_view` | Exists | `route`: `settings`, `settings_privacy`, `settings_your_data`, `settings_help_legal`, `settings_about` exist; add `settings_recently_deleted`, `settings_words`, `settings_consents` (new values) | Are privacy screens found? |
| `settings_changed` | Exists | `key`: `lock_screen_names`, `sensitive_data` exist; add `app_lock`, `edit_level_default` (new values). `ai_processing` and `backup_mode` stay unused at v1.0 | Which controls matter? Never the value |
| `letter_deleted` | Exists | `action` (`deleted`, `restored`), `destination`; add `surface` (`letter`, `recently_deleted`) (new) | Is Recently deleted used to restore? |
| `child_setting_changed` | Exists | `key: deleted`, `hidden` | Book hide versus delete |
| `account_deletion` | Exists | `stage`: `started`, `export_offered`, `confirmed`, `undone`. `confirmed` is the last event for that id | Where do people stop in the flow? |
| `export_started` | Exists | `format` | Export before delete |

Not measured on the device, by design: who declines analytics (sending it would need consent), deletion completion (server), sensitive-data withdrawals (server counts of `withdraw` rows, F18 server aggregates). The lock state is never a property value.

## 11. How we build it (with the architect)

**What existed on 3 Oct 2026** (13 Oct additions follow the paragraph). Settings stack and screens `index.tsx`, `appearance.tsx`, `reminders.tsx`, `recordings.tsx`, `children/[id].tsx`, `children/new.tsx` in `apps/mobile/src/app/settings/`; shared `Row` and `Section` in `apps/mobile/src/components/settings/settings-ui.tsx`. Strings `settings.*`, `settingsMore.*`, `sensitiveConsent.*`, `analyticsConsent.*`, `settings.privacy.*` in `packages/content/src/strings.en.ts`. Local tombstone `deleteEntry` and direct `undeleteEntry` in `apps/mobile/src/lib/store.ts`. Server: `record_policy_act`, `policy_actions_needed`, `my_policy_state`, `my_sync_gate`, `require_content_consent`, `request_account_deletion`, `cancel_account_deletion`, `request_book_deletion`, `cancel_book_deletion`, `delete_entry`, `restore_entry`, `purge_due`, `prepare_account_purge`, `finalize_account_deletion` in migrations `20261002020000`, `20261003000000`, `20261003020000`. Only the first two migrations are applied (`.github/migrations-applied.txt`). `expo-local-authentication` is not installed. Added since, checked 13 Oct: `apps/mobile/src/lib/account-deletion/` (deletion flow logic and API), `app/settings/delete-account.tsx`, `privacy.tsx`, `recently-deleted.tsx`, `account.tsx`; `supabase/functions/purge-worker/` (Deno, with `account.ts` `STEP_ORDER`) and `supabase/functions/analytics-forget/`; `ops.audit_log` and `ops.apple_tokens` in `20261004200000_ops_deletion_worker.sql`. New work extends these modules; it does not create parallel ones (R2 AR-38).

**Components.**
- `apps/mobile/src/app/settings/`: new `privacy.tsx`, `consents.tsx`, `your-data.tsx`, `recently-deleted.tsx`, `delete-account.tsx` (multi-step), `words.tsx`, `help-legal.tsx`, `about.tsx`; `index.tsx` rebuilt to 6.2 A; `_layout.tsx` gains the screens.
- `apps/mobile/src/components/settings/copy.ts` (new) for new strings (brief rule; the content agent moves them).
- `apps/mobile/src/lib/privacy/` (new): `consents.ts` (reads `my_policy_state`, records acts through F02's queue), `lock.ts` (LocalAuthentication wrapper, cover state, AppState listener). The deletion flow stays in the existing `apps/mobile/src/lib/account-deletion/`.
- `packages/core/src/deletion-flow.ts` (new): pure reducer for the account and book delete steps (which steps show, given plan state, books, co-parents, network), unit-tested without React Native.
- Lock: `expo-local-authentication` (Expo SDK module; licence and SDK 57 API checked from the installed version before use, brief rule). Cover: an absolutely positioned view rendered from an AppState `inactive` listener; whether React Native paints before iOS takes the snapshot is the riskiest unknown (spike WP-F17-00). Fallback if it does not: a small native module that adds a cover view in `applicationWillResignActive` [A].
- Server (data architect, `approve-migration`): `my_consents()`, `my_feature_gates()`, `my_consent_active()` (BL-114); `withdraw_sensitive_data(p_delete)` (BL-240); `request_account_deletion` refuses `source='support'` for `authenticated` and accepts `analytics_forgotten boolean` (TDD 05 X-11, 7.1); `support_request_deletion` (BL-237); `bucket_registry` (BL-232); `ops.audit_log` (exists, BL-236). New migration files only; timestamps in the data architect's range.
- Worker: the existing `purge-worker` Edge Function (BL-234) gains the section 8.4 rows; `analytics-forget` (BL-235, F18) exists; verification script `ops/verify-deletion.mjs` (BL-238, new) with the named exceptions.
- Web page: content in `packages/content/src/site.en.ts` (F21 owns the page build).

**Sequencing.** Order only; dates live in `08-delivery.md` section 5 (R1 PL-03). (1) Settings shell and IA, Privacy screen with the analytics switch and the provable staff line, leak-surface CI checks. (2) The deletion ADR, then the worker rows in 8.4 and the verify script. (3) Consents list with the backup row, Recently deleted with Erase now hidden in sync builds, book delete, Erase everything. (4) Account deletion additions (4b, PostHog retry, billing-notice line), withdrawal sheet. (5) Database audit (WP-F17-16) before C1. (6) Lock spike then lock (P1).

**ADRs required before build** (numbers per `08-delivery.md` section 8.1; matches R2's list item 4)

| ADR | Content | Closes | Blocks |
|---|---|---|---|
| Account deletion across systems | The section 8.4 matrix, worker step order with the M14 rows, Keychain behaviour on each device, named exceptions, and what a book deletion, a leave and Erase everything each do | R2 AR-22, AR-23; R4 PT-34 | WP-F17-11, WP-F17-17, WP-F08-B3p |
| Owner backup v1.0 (F08 owns) | The backup rows in 8.4 | R2 AR-05 to AR-11 | WP-F17-17 backup rows |
| Subscription status report (F14 owns) | Deletion and pseudonymisation of the status and consent records | R2 AR-13; R4 PT-08, PT-09 | 8.4 status row |

**Riskiest unknown.** Whether the lock cover reaches the app switcher snapshot from React Native on SE 3. Spike WP-F17-00 answers it before the lock is built; if neither path works, the lock ships without switcher masking only if the founder accepts that (section 13 Q1), else it moves to v1.1.

## 12. Work packages

Status is what `develop` holds on 13 Oct 2026; "Device" names the `docs/qa/DEVICE_TEST_PLAN.md` run owed. Account, sync and account deletion rows are v1.0 (M14) and show only in a build with server features on; on 13 Oct the release profiles still have it off.

| WP | Scope | Owner | Owns files or folders | Depends on | Done when | Mode | Status 13 Oct | Device |
|---|---|---|---|---|---|---|---|---|
| WP-F17-00 | Spike: lock cover in the app switcher snapshot, LocalAuthentication on SE 3 | Mobile engineer | `experiments/app-lock-spike/` (new, throwaway) | none | Written result with screenshots; path chosen | Pair, device | Not run | SE 3 app switcher |
| WP-F17-01 | Settings shell and IA, early-version card moved to About, legal rows from `packages/brand` | Mobile engineer | `apps/mobile/src/app/settings/index.tsx`, `_layout.tsx`, `help-legal.tsx`, `about.tsx` (new), `apps/mobile/src/components/settings/copy.ts` (new) | BL-035 | `[C-REQ-016]` tap walk, `[F17-REQ-001]`, `[F17-REQ-019]`, `[F17-REQ-020]`, `[F17-REQ-024]`, `[K-13]`; `[LEGAL-REQ-051]`; `[F17-REQ-082]` | Agent. BL-159 | Partly built: `settings/index.tsx` shell, every row within 2 taps; no Help and Legal screen, no Your words screen, no backup row | S1-23 VoiceOver |
| WP-F17-02 | Privacy screen: analytics switch, names switch mirror, who can read, promise lines | Mobile engineer, privacy engineer | `apps/mobile/src/app/settings/privacy.tsx` (new), `apps/mobile/src/lib/privacy/consents.ts` (new) | WP-F17-01, F18 client (BL-250) | `[LEGAL-REQ-008]`, `[F17-REQ-083]`, `[F17-REQ-003]`, `[F17-REQ-004]`; `[F17-REQ-081]` | Agent. BL-023 | Partly built: `settings/privacy.tsx` exists; the sync consent row is built, switch off in release profiles | none |
| WP-F17-03 | Consents list and sensitive-data withdrawal sheet | Privacy engineer, mobile engineer | `apps/mobile/src/app/settings/consents.tsx` (new), withdrawal sheet in `privacy.tsx` | WP-F17-02, BL-114, BL-240 | `[F17-REQ-002]`, `[F17-REQ-016]`, `[LEGAL-REQ-006]`; `[LEGAL-REQ-009]` | Agent. BL-240 | Not built (`consents.tsx` absent) | none |
| WP-F17-04 | Recently deleted, restore through the outbox | Mobile engineer, sync owner | `apps/mobile/src/app/settings/recently-deleted.tsx` (new); restore op in F16 outbox (request to F16 owner) | WP-F16-06 | `[F17-REQ-005]`, `[F17-REQ-006]`, `[DATA-REQ-010]`, `[DATA-REQ-013]`; `[DATA-REQ-011]` | Agent | Built for letters (D-085, commit 6482cd3): shelf, Restore, Erase now, launch purge, `entry.restore` op. Not built: books on the shelf; Erase now in a sync build (WP-F16-13) | DL-04, DL-05 |
| WP-F17-05 | Pure delete-flow reducer | Core owner | `packages/core/src/deletion-flow.ts` (new), its test | none | Unit cases: subscriber, Family Sharing, co-parent book, sole book, offline, no passcode; `[F17-REQ-018]`, `[F17-REQ-022]` | Agent | Not built (`packages/core/src/deletion-flow.ts` absent) | none |
| WP-F17-06 | Book delete screens | Mobile engineer | Book delete steps under `apps/mobile/src/app/settings/children/` (coordinate with F12 owner) | WP-F17-05 | `[DATA-REQ-014]`, `[DATA-REQ-053]`, `[F17-REQ-080]` E2E; `[DATA-REQ-015]` | Agent | Partly built: Hide this book exists; book delete screens not verified | none |
| WP-F17-07 | Account delete flow additions to the built flow: step 4b (only in backup), PostHog retry through the wipe, billing-notice line, named exceptions copy | S14 | `apps/mobile/src/app/settings/delete-account.tsx`, `apps/mobile/src/lib/account-deletion/` (both exist) | WP-F17-05, WP-F14-05, WP-F15-06, BL-235, BL-051 | `[C-REQ-019]`, `[DATA-REQ-019]`, `[DATA-REQ-022]`, `[DATA-REQ-026]`, `[F17-REQ-012]` to `[F17-REQ-014]`, `[F17-REQ-021]`; `[DATA-REQ-023]`, `[F17-REQ-013]` | Agent. BL-233, BL-220 | Built, switch off in release profiles (BL-233: `settings/delete-account.tsx`, `lib/account-deletion/`); Apple token revocation waits on BL-330 | S2-13, S2-14 |
| WP-F17-08 | App lock (P1): LocalAuthentication, cover, grace, names override, Info.plist key | Mobile engineer | `apps/mobile/src/lib/privacy/lock.ts` (new), cover component, app config plugin entry (request to the boot-wiring owner) | WP-F17-00; counsel approval of the Face ID purpose string | `[F17-REQ-008]` to `[F17-REQ-011]`, `[F17-REQ-015]`, `[LEGAL-REQ-007]` manifest lint updated | Agent (adds a package: pair for the install) | Not built; P1 | Face ID on device |
| WP-F17-09 | Leak-surface checks: CI grep for indexing APIs, device script for Spotlight, widget, notification and switcher | QA engineer, security engineer | `scripts/leak-surfaces.mjs` (new), QA script in `docs/` (request) | WP-F17-01 | `[F17-REQ-007]`, device script passes on SE 3; `[LEGAL-REQ-014]` (exists in `supabase/functions/config/serve.test.ts`), `[LEGAL-REQ-022]`, `[DATA-REQ-004]`; `[LEGAL-REQ-007]` | Agent plus human. BL-245 | Not built | Spotlight, widget, notification and switcher on device |
| WP-F17-10 | Server pieces: `my_consents`, `request_account_deletion` source and `analytics_forgotten` change, `withdraw_sensitive_data`, `support_request_deletion` | Data architect, privacy engineer | New migration, `supabase/tests/consent.test.mjs` (new) | BL-114, BL-236 | DB tests for each function; access matrix updated; `[DATA-REQ-033]`, `[F17-REQ-029]`, `[F18-REQ-017]` | Agent, `approve-migration`. BL-114, BL-237, BL-240 | Partly built: `analytics-forget` function and deletion RPCs exist; `my_consents` and `withdraw_sensitive_data` not found in migrations | none |
| WP-F17-11 | Verification script and staging run of the built worker | S07 | `ops/verify-deletion.mjs` (new); `supabase/functions/purge-worker/` (exists) | BL-232, BL-236, F02-REQ-004 | `[LEGAL-REQ-029]` staging run, TC-19 fake vendors, `[DATA-REQ-034]` with the 8.4 exceptions; `[DATA-REQ-020]`, `[DATA-REQ-025]`, `[DATA-REQ-036]`, `[LEGAL-REQ-031]`, `[LEGAL-REQ-033]`, `[DATA-REQ-064]`, `[DATA-REQ-066]` | Agent. BL-234, BL-238 | Worker built (Deno tests); not deployed or scheduled (FT-11); script not built | none |
| WP-F17-12 | Web deletion page content and support runbook | Privacy engineer, content | `packages/content/src/site.en.ts` (delete-account block), `docs/runbooks/` deletion by email (request) | BL-100 | `[F17-REQ-023]`, `[LEGAL-REQ-030]`; `[DATA-REQ-021]`, `[DATA-REQ-027]` | Agent. BL-243 | Partly built: site copy in `packages/content/src/site.en.ts`; runbook not verified | none |
| WP-F17-13 | Edit-level default and Your words screen | Mobile engineer | `apps/mobile/src/app/settings/words.tsx` (new); revise `recordings.tsx` to drop the tidy row | WP-F17-01, F06 | `[F17-REQ-017]` | Agent | Not built: no `words.tsx`; the setting is text only inside `recordings.tsx`; D-074 copy done | none |
| WP-F17-14 | Copy and claims: new strings, Rev of beta and tidy strings, claims registry entries | Content | `apps/mobile/src/components/settings/copy.ts`, `claims.ts` (BL-118) | BL-118 | Content rules test passes; `[LEGAL-REQ-044]`, `[F17-REQ-004]`; `[PRD-REQ-010]`, `[DATA-REQ-001]`, `[LEGAL-REQ-041]` | Agent | Partly built: D-074 and D-085 strings in `packages/content`; claims registry entries not checked | none |
| WP-F17-15 | Erase everything on this phone, signed out (the ledger reset) and signed in (local wipe only, not a reset) (P0, stays in v1.0: DATA-REQ-024; R8 R2A-18) | S14, with S06 for the ledger call | `apps/mobile/src/app/settings/erase.tsx` (new), `apps/mobile/src/lib/account-deletion/` | WP-F17-07 | `[DATA-REQ-024]`, `[F17-REQ-026]`, `[F14-REQ-026]` | Agent | Not built (`eraseLetterLedger()` exists with no caller) | none |
| WP-F17-16 | Database audit for service-role and dashboard sessions, escrow secret check, quarterly review runbook | S02 with founder | Migration or project setting (pgaudit or log drain), `docs/runbooks/` (request) | none | A dashboard SQL read in staging produces an audit record; `[F17-REQ-027]` stronger line stays off until this passes; `[LEGAL-REQ-025]` | Pair | Not built | none |
| WP-F17-17 | Worker and purge-function rows for M14 systems (8.4): `entry-audio` to v1.0, backup tables, `restore_requests`, `held_drafts`, `account_sessions_seen`, push tables, status record, pseudonymisation of audit and escrow logs, each with its ledger kind (F16 6.2 F step 2a) | S07 (worker), S02 (shared purge functions) | `purge-worker/account.ts`, `purge-worker/lib/buckets.ts`; S02 migration for `prepare_account_purge` | Deletion ADR, WP-F08-B3 | `[LEGAL-REQ-029]` with every 8.4 row | Agent, `approve-migration` | Not built | none |
| WP-F17-18 | Hide Erase now in sync builds; withdrawal sheet copy; provable staff line | S14 with S16 | `recently-deleted.tsx`, `privacy.tsx`, `packages/content` | none | `[F17-REQ-025]`, `[F17-REQ-027]`, `[F17-REQ-030]` | Agent | Not built | none |

## 13. Open questions and assumptions

| # | Question | Who | By | What changes |
|---|---|---|---|---|
| Q1 | App lock P1 (spec default) or P0? And if the switcher cover cannot be made reliable, ship the lock without it or move it to v1.1? | Founder | After WP-F17-00 | Section 4.1, WP-F17-08 |
| Q2 | Lock grace 60 seconds (default) or immediate | Founder | Before WP-F17-08 | `appLockGraceSeconds` |
| Q3 | **[Counsel]** LEGAL-REQ-007 lists allowed permission keys; adding `NSFaceIDUsageDescription` needs an amendment and an approved purpose string | Counsel | Counsel delta (08 section 2.1) | LEGAL-REQ-007, WP-F17-08 |
| Q4 | **[Counsel]** OQ-L1: must synced letters be erased within 15 days of a sensitive-data withdrawal (Connecticut), or is stop-plus-offer enough? Spec default `offer`, with the F17-REQ-030 sheet | Counsel | Before any outside family signs in (R4 PT-23) | `sensitive_withdrawal_mode`, F17-REQ-016 |
| Q5 | During grace, should this phone keep writing letters locally? Spec default: no, read and export only (F17-REQ-021), because new letters would be purged at day 30 | Founder | Before WP-F17-07 | F17-REQ-021 |
| Q6 | **[Counsel]** OQ-L3: PostHog data deleted at request time cannot come back if the person cancels. Is the disclosure enough? | Counsel | Counsel delta (08 section 2.1) | Privacy Policy line |
| Q7 | **[Counsel]** OQ-L5: pseudonymised consent records kept 3 years after deletion | Counsel | Counsel delta (08 section 2.1) | 6.2 E step 2 copy, DATA-REQ-064 |
| Q8 | Type "delete" instead of the child's name (spec default) for book and account confirms | Founder, design | Before WP-F17-06 | F17-REQ-018; `bookTypeToConfirmLabel` Rev |
| Q9 | **[Counsel]** D-042: is the static page plus email route enough at v1.0 for an iOS-only launch? | Counsel | Counsel delta (08 section 2.1) | LEGAL-REQ-030 |
| Q10 | **[Counsel]** The early-version note wording: is "it can make mistakes" enough to rely on Terms 11.6 and 16.4 without the word "beta" in the app (B8 replaces the beta label)? | Counsel | Counsel delta (08 section 2.1) | About note, Terms 16.4 |
| Q11 | D-050: second consent at the first co-parent invite. Spec default: none (F11 ships the sheet compiled off) | Counsel | Counsel delta | F11, Privacy consents list |
| Q12 | Does the Resend account deletion API exist and delete message logs? | Privacy engineer | Before WP-F17-17 | 6.2 L step 6 |
| Q13 | Do deleted Supabase Storage objects persist in any Supabase backup, and for how long? | Privacy engineer with Supabase docs or support | Before the counsel delta | 6.2 L step 11; the 38-day clock |
| Q14 | **[Counsel]** Keep a billing-notice record after account deletion while a subscription is active (R4 PT-08 b), and keep the consent record linked rather than pseudonymised (PT-09)? | Counsel; F14 owns | Counsel delta | 8.4 rows; 6.2 E step 4 |

| # | Assumption | How we validate |
|---|---|---|
| A1 | React Native can draw a cover before iOS takes the app switcher snapshot | WP-F17-00 on SE 3 |
| A2 | Parents rarely need a lock; most want "nothing shows outside the app" | Study 1 interview question; `settings_changed{key: app_lock}` rate among consenting users |
| A3 | Typing "delete" is as protective as typing a name | Usability check in Study 1 |
| A4 | Most account deletions happen with a subscription already cancelled | `had_active_subscription` share in deletion receipts (counts only) |

## 14. Sources

- `docs/prd/v2/_AUTHORING.md` B2, B5, B7, B8, B9, B11, B14; `01-problem.md` 2.5; `02-customers.md` sections 4 and 6; `03-goals-and-principles.md` PS4, section 4.3; `05-feature-map.md` sections 2 and 5; `09-decisions-and-risks.md` R-10, R-11.
- `docs/agents/BRIEF-2026-10-03.md` items 9 to 12 and coordination rules.
- `docs/prd/PRD.md` 1.3: PRD-REQ-001, -002, -010, -013, -016 to -018; K-01, K-13, K-14, K-17, K-22, K-23, K-25, K-26, K-29; sections 6.6, 6.9, 7.2, 7.9, 7.10.
- `docs/prd/C-habits-pricing-settings.md` C-REQ-009, C-REQ-016 to C-REQ-019, C-REQ-023, C-REQ-034, C-NFR-005, C-NFR-007, C-NFR-009. `docs/prd/A-entry-and-auth.md` A-REQ-019, A-REQ-029, A-NFR-011. `docs/prd/B-first-run-and-family.md` B-REQ-014, B-REQ-016, B-REQ-025.
- `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-003, -006 to -009, -014, -016, -022, -025, -029 to -034, -044, -048, -050, -051, -053, -054. `docs/legal/DELETION_AND_EXPORT_SPEC.md` sections 2, 3, 6; DATA-REQ-010 to -026, -030, -033, -034, -036, -043, -044, -053, -063, -064, -066. `docs/legal/POLICY_VERSIONING.md` sections 1, 4 to 7. `docs/legal/DATA_CLASSIFICATION.md` sections 0 to 2, 4.1, 4.6, 6. `docs/legal/in-app-disclosures.md` sections 1, 2, 5. `docs/legal/app-store-privacy-labels.md` 1.3. `docs/legal/subprocessors.md` (PostHog, Sentry rows). `docs/legal/data-policy.md` section 4.
- `docs/tdd/05-privacy-compliance.md` X-02, X-03, X-08, X-10, X-11, X-13, X-20, 5.1, 5.4, 7.1, 7.2, 7.4, 7.5, 9.2, 13. `docs/tdd/04-security-identity.md` MASVS rows (step-up, snapshot). `docs/tdd/09-accessibility-design-system.md` A11Y-F03.
- `docs/DECISIONS.md` D-003, D-004, D-023, D-025, D-033, D-042, D-050. `docs/BACKLOG.md` BL-016, BL-020, BL-021, BL-023, BL-035, BL-051, BL-100, BL-114, BL-118, BL-134, BL-159, BL-196, BL-220, BL-232 to BL-245, BL-250.
- Sibling specs: `F02-account.md` (F02-REQ-004, -007, -008, -013, -014), `F04-capture.md` (F04-REQ-020), `F06-faithful-edit.md` (F06-REQ-038, Q7, `settings.tidy*`), `F08-recordings.md`, `F11-co-parent.md` (K-22 text, D-050), `F12-children.md`, `F13-prompts-reminders.md` (C-REQ-009, `lockScreenHelp`), `F14-plus.md` (F14-REQ-012, `plus.plan.deleteNote`, Settings > Plan), `F15-export.md` (F15-U20), `F16-sync.md` (C9, outbox).
- Reviews: `reviews/R2-architect.md` AR-22, AR-23, AR-38; `reviews/R4-privacy-trust.md` PT-03, PT-06, PT-08, PT-09, PT-22 to PT-24, PT-27 to PT-29, PT-34; `reviews/R1-product-leader.md` PL-03; `docs/reviews/2026-10-04-security-privacy.md`.
- Code read 13 Oct 2026: `apps/mobile/src/lib/account-deletion/`, `supabase/functions/purge-worker/account.ts`, `purge-worker/lib/buckets.ts`, `supabase/migrations/20261004200000_ops_deletion_worker.sql`, `20261004100000_sync_engine.sql` (cascades), `apps/mobile/src/lib/billing/gates.ts`; `docs/legal/app-store-privacy-labels.md` 1.3.0; `docs/legal/privacy-policy.md` CN-8.
- Code read 3 Oct 2026: `apps/mobile/src/app/settings/*.tsx`, `apps/mobile/src/app/letter/[id].tsx`, `apps/mobile/src/app/(tabs)/book.tsx`, `apps/mobile/src/lib/store.ts`, `apps/mobile/src/lib/copy.ts`, `apps/mobile/src/lib/db/migrations.ts`, `apps/mobile/package.json`; `packages/content/src/strings.en.ts`; `packages/brand/index.ts`; `packages/analytics/src/consent.ts`, `client.ts`, `catalog.ts`; `supabase/migrations/20260930000000_scribe_core.sql`, `20261002020000_data_governance.sql`, `20261003000000_security_and_family.sql`, `20261003020000_purge_batching.sql`; `.github/migrations-applied.txt`.
- Research: R1 F17 (R1-S3, R1-S5, R1-S13, R1-S23, R1-S33, R1-S39, R1-S49, R1-S67); R2 section 0 item 2, T9, R2-S16, R2-S17, R2-S27; R4 sections 5, 7, 8, 9 (R4-S55, R4-S61).
