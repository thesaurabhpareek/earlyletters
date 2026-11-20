# Function review: the lifecycle of a book across builds, phones and platforms (LCY)

Owner: `sync` (Sync and Backend Engineer), second-wave review for an area the first wave did not cover. FR code LCY. Written 20 Nov 2026 (UTC) under `docs/product/prd/functions/BRIEF.md` and the common brief. Docs only: nothing here is built, no string is live, and no decision is recorded.

The person writing this is a Claude role. It is not a lawyer. Every legal reading says "counsel must confirm". Words a parent would read are quoted as intent; `content` writes them and the founder approves them. The only family named is the fictional family Asha. Nothing here asks for a feature that writes, rewrites or shapes a person's words.

---

## 1. What I reviewed, and what I did not

### Read this session (branch `docs/locked-pack-inputs-20nov`)

| Source | What I read |
|---|---|
| `functions/BRIEF.md` (all), `README.md` (all), `00-product-frame.md` (all), `18-errata-after-lock.md` (all) | Format, ground rules, master index, errata E1 to E22 |
| `08-keeping-and-trust.md` NS-10 (lines 411 to 577) and NS-11 (lines 579 to 760) in full | New phone, Save a copy |
| `11-foundations.md` NS-36 acceptance rows (lines 597 to 686) | Data follows the letter, export versions one way |
| `19-from-download-to-first-letter.md` NS-45 (lines 1472 to 1600) in full; grep of NS-38 to NS-44 for existing-install, update, offline | Account life, update line, deletion elsewhere |
| `GAP-LOG.md` line 225 (E K-E05, K-E15, CG7) and line 333 | The "no blocking update screen" ruling |
| `functions/support.md` (lines 1 to 120, plus Q-SUP-10), `functions/legal.md` (L-2 and the NS rows), `functions/privacy.md` (FR-PRV-03, 07, 14, 15, 18, 20, 21 by grep), `functions/operations.md` (FR-OPS-25 by grep), `functions/finance.md` (FR-FIN-19 by grep) | Adjacent reviews, so I point to their ids and do not repeat them |
| Built code: `apps/mobile/src/lib/db/migrations.ts` (lines 1 to 70, 430 to 480, grep of every `version:`, `DROP`, `RENAME`), `lib/db/expo-adapter.ts:31`, `lib/resilience/launch.logic.ts:1 to 30`, `lib/first-run/gate.logic.ts:1 to 70`, `lib/auth/account-claim.logic.ts:1 to 60`, `lib/sync/ownership.ts:36 to 56` and the comment at 93 to 113, `lib/billing/letter-ledger.ts:1 to 60`, `lib/export/schema.ts` (versions 1.0.0 to 1.6.0, `ExportEntry`), `lib/export/pack.ts:1 to 40`, `lib/export/build.logic.ts:550 to 590`, `packages/content/src/features/export.en.ts:90 to 104`, `packages/api/src/server/sync.ts:20 to 52`, `packages/api/src/remote-config.ts:98 to 118`, `apps/mobile/app.config.ts:44, 86, 206, 219, 228 to 285`, `apps/mobile/modules/*` file lists, `apps/mobile/test/` file names | Facts below carry these file and line cites |
| `docs/release/ENVIRONMENTS.md` (lines 1 to 90), `docs/release/TESTFLIGHT.md` (lines 130 to 200 by grep) | Which build uses which app id and which server |
| `docs/DECISIONS.md` D-033 (line 39), D-040 (line 273), D-082, D-160, D-161; `docs/adr/0005-audio-format.md`, `docs/adr/0023-email-links-pkce.md` | Audio containers, iOS floor, claim layers |
| `docs/legal/terms-of-service.md` (lines 23 to 25, 38 to 42, 58, 68, 98, 107, 136, 148, 156), `docs/legal/privacy-policy.md:159`, `docs/legal/data-policy.md:190 to 198`, `docs/legal/COUNSEL_PACKET.md` Q49 to Q51 | Ownership, 18+, closing the service, inactive accounts, death |
| `packages/content/VOICE.md:31 to 33` and README Appendix A (line 140) | The legacy rule and the banned loss and ending words |
| Design, branch `docs/e2e-ux-20nov` at `d94ed52d7`: area E `DESIGN.md` screen table (lines 196 to 226), J-E15 (lines 141 to 144), E-S16 (line 328), E-ST37 and E-ST46 (lines 445, 454); area C `DESIGN.md` screen table (lines 28 to 49), J-C06 (line 149 onward) | Screen ids used in the links |

### Outside sources read this session (20 Nov 2026)

| Fact | Source |
|---|---|
| iCloud Backup "periodically creates a backup of the user's device, including your app's data"; `/tmp` and `/Library/Caches` are excluded by default; nonpurgeable data is included unless the app marks it excludable with `isExcludedFromBackup`; that flag is guidance, "not a mechanism to guarantee those items never appear in a backup" | https://developer.apple.com/documentation/foundation/optimizing-your-app-s-data-for-icloud-backup.md |
| A TestFlight build is testable for up to 90 days and "becomes unavailable for testers after 90 days" | https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/ |
| Apple's Legacy Contact: after the holder's death a contact with an access key and a death certificate can request access to certain Apple Account data; "The data might include photos, messages, notes, files, device backups, and more"; purchased media and subscriptions and iCloud Keychain items are not accessible; the page does not say whether third-party app data is included | https://support.apple.com/en-us/102631 |

### Could not verify (UNVERIFIED)

- Which iPhone models run iOS 17. The Apple page I tried (support.apple.com/en-us/105103) does not say; I found no source that lists them.
- That `Library/Application Support` (where photos live, ADR 0028) and `Documents` are in an iCloud device backup. Apple's page says nonpurgeable data is included unless excluded, and these folders are not excluded for photos or recordings in the code I read, so I read them as included. The repo already says recordings are in device backup (D-033, `export.en.ts` and `lib/` comments). A restore on a real phone has not been run by me.
- How an iPhone-only app behaves on an iPad (compatibility mode) and whether it rotates. The repo says App Review runs the iPhone app on iPad (`14-test-plan.md:88`, E-ST46); I read nothing from Apple on it.
- Android Auto Backup limits and Sign in with Apple on Android. My search returned titles only.
- Whether browsers play a raw ADTS `.aac` file in an `<audio>` tag (the export's `index.html` does this, `build.logic.ts:417`).
- California RUFADAA and any other fiduciary-access law: not read. Counsel Q49 carries it.

### Not reviewed or run

- Build 11's actual bundle id and the build 11 record (a project doc, not on disk). I rely on `ENVIRONMENTS.md` and `app.config.ts:86, 206`.
- NS-38 to NS-44 beyond grep. NS-45 read in full.
- `14-test-plan.md`, `13-engineering-plan.md`, `16-council-review-round-2.md`: grep only.
- Server SQL (`sync_pull`, `held_*`): I did not open the migrations. Server facts come from the errata (E7, E8, E9) and `packages/api`.
- I ran no test, no device, no restore and nothing against any server. I did not read `docs/BACKLOG.md` row by row; backlog ids below are ones cited by the cards I read, or "new row needed".

---

## 2. Coverage check, then verdict per card

### 2a. What the repo and cards already say (coverage check)

| Topic | What is already said, and where | Verdict |
|---|---|---|
| Local schema upgrades | A versioned migrator exists: `PRAGMA user_version`, ten steps, each in its own transaction with the version bump, append-only, a failing step leaves the file as it was (`migrations.ts:1 to 15, 57, 393, 430, 451 to 470`; `test/migrations.test.ts`, `migrations.v5.test.ts`, `migrations.v9.test.ts`). The only `DELETE` statements are two setting cleanups (`migrations.ts:134, 168`); no `DROP` or `RENAME`. Cards say "Migrations: none" or name server migrations; no card names its local migration step or a test on an older file | Built and sound; not specified by any card |
| A file from a newer build | Stays open and the app runs, "until the 'update the app' screen exists (MOB-09)" (`launch.logic.ts:11 to 14`). The test file sets `user_version = 99` (`migrations.test.ts:138`) | Behaviour exists; no rule about what an older build may write into a newer file |
| Builds, apps and servers | Alpha builds use the id `<id>.preview` and a staging server; `production` uses `<id>` and `scribe-prod` (`ENVIRONMENTS.md:19 to 21`; `app.config.ts:86, 206`). "When the alpha ends, the founder decides whether these accounts move to production or are deleted; record it in `docs/DECISIONS.md`" (`ENVIRONMENTS.md:72`). A grep of `DECISIONS.md`, `BACKLOG.md`, the cards and every function review for that decision finds nothing | **Missing** |
| Existing install meets the account-first build | A phone that holds a book opens it; sign-in is offered, not required (`gate.logic.ts:49 to 52`). A phone with letters and a new sign-in shows the claim screen with the masked email (`account-claim.logic.ts:1 to 30`; ADR 0023 layer 3; E-S24, E-S03 `agreeOnly`) | Covered for the first sign-in; nothing for builds that wrote to staging (below) |
| Ownership of a phone's letters | The first account that claims a phone owns them; "another account owns them: nothing can move" (`account-claim.logic.ts:17 to 20`; `ownership.ts:48 to 49` throws `sync_account_mismatch`) | Safe by design; strands letters in one case (FR-LCY-11) |
| New phone | NS-10 (R0 to R14): arrive by sign-in, words only, one line at the top of the Book, restore plus sign-in never duplicates (R6), both phones keep receiving (R14), decline and deletion elsewhere (R4a, R4b, R9). NS-11 "New phone: words for all, recordings for those here" | Covered for sign-in; **partly** for restore, no-server and the recordings gap |
| Device restore | NS-10-R6 only; Keychain items are `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` (`secure-storage.ts:24`, `letter-ledger.ts:22`), so a session and the Keychain half of the ledger do not come back; the ledger heals from the database mirror and letters present (`letter-ledger.ts:5 to 9`; NS-44 table, `19:1352`) | Partly |
| Save a copy | NS-11 and F15: ZIP with `README.txt`, schema JSON, a letters text file each, an offline `index.html` with audio players, per-child PDF, `data/*.json`, recordings byte for byte with SHA-256 (`build.logic.ts:550 to 590, 724 to 773`; `export.en.ts:90 to 104`). Schema is 1.6.0 and moves one way (`schema.ts`; NS-36-R7). No import exists (grep of the repo for an importer finds none) | Built; **no way back in**; see FR-LCY-05, 12 |
| Size of a copy | `MAX_EXPORT_BYTES = 3.9 GB`, "no ZIP64", "Splitting by child-year above 2 GB (spec 4.2) is not built yet" (`pack.ts:9 to 20`); F15 table line 154 says split above 2 GB | **Missing**; reached in about 17 years (FR-LCY-21) |
| App update | K-E05, K-E15 ruled: no blocking screen; one line in Me; recording, reading and export never stop (`GAP-LOG.md:225`; NS-45 section 4, R13, R14; J-E15; E-S16). `minSupportedVersion` has no consumer yet (`remote-config.ts:98 to 99`; `19:1615`). `SCVER` and `p_api_version` are "planned" (`sync.ts:23, 46 to 52`) | Ruled; not built; two card lines disagree (FR-LCY-17) |
| iPad, landscape, iOS floor | iOS 17 minimum (D-040; `app.config.ts:44`); `supportsTablet: false` (`:236`); `orientation: 'portrait'` (`:219`); iPad is a smoke row only (`14-test-plan.md:88`; E-ST46; finance FR-FIN-19) | Decided in code; no card states the support promise |
| Account deletion | NS-45 R5 to R12, NS-10-R4a, R9; 30-day undo; letters stay on the phone | Covered for the deleting phone; thin for the other phone (FR-LCY-19) |
| Long-term archive | ADR 0005 "Voice keepsake for 18+ years", AAC in `.m4a` or ADTS `.aac` (ADR 0027 amendment), "optional Opus or FLAC archival export in v1.x"; Terms: if we close, 90 days and export working (`terms-of-service.md:156`) | Principle stated; no requirement tests it |
| Child turns 18 | Terms 2.3: a child does not use the Service; 5.1: the parent owns the content; sealed letters: no delivery by us, latest date the 25th birthday (legal L-2 default) | No hand-on path |
| Parent dies or is unreachable | Counsel Q49 (default: "No clause; runbook before C1"); support Q-SUP-10; data policy: no automatic deletion of inactive accounts (`data-policy.md:197`, counsel to confirm, OQ-11); README Appendix A bans "legacy contact", "when I am gone" and "in memory of" in strings | Runbook does not exist; nothing for the family |
| Android | Parked C-39: "a second platform doubles every test and device row" (`12-parked:18`; frame row 47). Absent rule for native modules (NS-01-R59). `scribe-keys/index.ts:2` is optional "on Android, so callers handle null" | Parked correctly; no "do not build iOS-only" list |

### 2b. Verdict per card (NS-01 to NS-45) for this area

Covered means the card already does what lifecycle needs. Partly means a lifecycle requirement is owed. Missing means the card should carry a line and does not. "n/a" means the card does not touch the lifecycle.

| Cards | Verdict | Why | FR |
|---|---|---|---|
| NS-01 Photo | Partly | Adds a local table and a phone-only picture folder. No numbered local migration, no old-file test, no word on restore or on the export size. Pictures never reach a second phone (stated) | 01, 02, 09, 21 |
| NS-02 Find | Partly | Adds a local index. Index is rebuildable: a restore or a downgrade should rebuild it, not trust it | 01, 03 |
| NS-03, NS-04 | n/a | Research and spike | none |
| NS-05 Share | Covered | Text only, nothing hosted, no lifecycle | none |
| NS-06 Firsts, seals | Partly | New columns (`seal_opens_at`, `seal_cleared_at`, first marks). A seal deleted with the account (D6); a hand-on question for sealed letters (L-2) | 01, 03, 25, 27 |
| NS-07 Print-ready file | Partly | Same 4 GiB ceiling for a book | 21 |
| NS-08 Backup readiness | Partly | Names the recordings gap on a second phone; no lifecycle rule for the day backup flips (a restore on a phone that never uploaded) | 09, 13 |
| NS-09 Let it go | Covered | No lifecycle effect | none |
| NS-10 New phone | Partly | Sign-in arrival is strong. Missing: restore from a device backup in full, no-server arrival, what the second phone cannot have, a phone whose account was deleted | 09, 11, 12, 13 |
| NS-11 Save a copy | Partly | Names itself a copy, not a way back. No check that a stranger can read it in 18 years; size limit unbuilt | 12, 20, 21, 22 |
| NS-12 Earlier versions | Partly | New server-held rows in an export: FR-PRV-21 covers the rule; lifecycle only needs the old-file test | 01 |
| NS-13 to NS-20 | Partly (one rule) | Settings and capture; each local table or key is a migration step: the notification plan must re-plan after an update and a restore (E-ST37, NS-32-R16) | 01, 09 |
| NS-21 to NS-24 | Covered | Read paths; no lifecycle effect beyond the old-file test | 01 |
| NS-25 The other parent | Partly | A second adult's phone; Android would reopen it | 13, 32 |
| NS-26 to NS-31 (parked) | Covered for now | Nothing ships | none |
| NS-32 Notification budget | Covered | Re-plan on update is in R16 | none |
| NS-33 to NS-35 | Partly | NS-34 names an iPad smoke row; no support statement | 15 |
| NS-36 Data follows the letter | Partly | One-way export versions are right; nothing keeps every old schema readable by a person with no app | 20, 23 |
| NS-37 Book stays fast | n/a | Speed | none |
| NS-38 to NS-44 First run, agreements, first book, first letter | Partly | Say nothing about a phone that already holds a book from an alpha build (only `agreeOnly`); NS-44 states the allowance for a new phone but not for upgraded testers | 05, 06 |
| NS-45 Account life | Partly | Update line and deletion rules are good; R14 and E-S16 disagree; deletion elsewhere leaves a second phone stranded in one case | 11, 17, 19 |

---

## 3. What is missing, then the requirements

### 3a. What is missing for a launch-ready, customer-first product

1. **The alpha families' books have no path into the store app.** Alpha builds are a different app (`<id>.preview`) from the store app (`<id>`): different data folders and Keychain, so nothing carries across by updating. The founder's own decision on staging accounts is owed and not recorded. Real family letters sit on staging.
2. **Save a copy is a read-out, not a way back in.** No import exists. With no server (a paused project, an outage, a closed service, a build with servers off) the only ways a book reaches a new phone are the phone's own backup or restore. The cards say this in pieces; no copy states it plainly, and no claim guard stops "restore" wording.
3. **No upgrade test across shipped schemas.** The migrator is good and the tests are for its steps. No requirement says every shipped version's file, filled with Asha's data, must open in the newest build with nothing lost, and no list says what "nothing lost" means.
4. **An older build can open a newer file and write to it.** No rule says it must leave unknown columns alone.
5. **A 4 GiB cliff in the keepsake.** A book that grows for about 17 years can no longer be copied in one file, and the split is unbuilt.
6. **No cold-read test for the archive.** Nothing proves a stranger in 2044 can read a copy with a text editor, a browser and a media player, or that an `.aac` recording plays in the offline reader.
7. **Deletion on one phone can strand letters on another** (FR-LCY-11, 19).
8. **No hand-on and no unreachable-parent route.** Nothing for the day {child} is grown, or for a family that cannot reach the account. The in-app string scan blocks the obvious words, so this needs a deliberate design, not a quick line.
9. **Two card lines disagree on the update line** (NS-45-R14 against E-S16 and K-E05).
10. **No Android do-not-build list.**

### 3b. Requirements

Priority: P0 with reason (a) a promise, (b) a legal or store duty, (c) the core loop; else P1 or P2. Owner lane is the agent that does the work. "new card row needed" and "new row needed" mean no id exists yet; no id above BL-999 is invented.

#### Upgrading testers and every existing install

| Id | Requirement (Given, When, Then) | Links (cards; e2e; backlog) | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LCY-01 | Given a database file at each shipped `user_version` (0 to the latest), filled by a fixture with the Asha family (two books, kept letters spoken and typed, a quiet-day mark, a held draft, a draft mid-capture, recordings in `.m4a` and `.aac`, unsent outbox rows, agreements, the ledger count, per-person book prefs), When the newest build opens it, Then it migrates and every row, `raw_transcript`, machine edit, audio file and its SHA-256, outbox row, held draft, agreement record and ledger count is present and unchanged, the notification plan is re-planned, and the migrated file passes `verifyEdits` over every stored edit. A card that adds a local table or column adds its step to this fixture list in the same PR | NS-01, 02, 06, 12, 13 to 20, 36 (new card row needed on each); E-S01 migrating, E-ST37; new row needed | P0 (a) | `mobile` with `sync`; `qa` | Migrator `migrations.ts:1 to 15`; tests exist per step only |
| FR-LCY-02 | Given any local migration, Then it is additive: no drop or rename of a table or column that holds a person's words, recordings, ids or settings; a migration that needs more than an `ALTER TABLE ... ADD COLUMN` or `CREATE TABLE` is a card-level decision with a data-loss test. A test scans `MIGRATIONS` and fails on `DROP` or `RENAME`. And Given a migration fails, Then the file is as before (as built), the recovery screen shows Try again and Export what's readable, and the export runs on the older-schema file | NS-39-R11; E-S01.recovery, E-S01.recovery-exporting; new row needed | P0 (a) | `mobile`; `data-architect` reviews | `migrations.ts:451 to 470`; `migrations.test.ts:114 to 131`; NS-39-R11 (`19:291`) |
| FR-LCY-03 | Given a database whose `user_version` is higher than the build knows (a TestFlight rollback, a reinstall of an older build over a restore), When the app opens it, Then it does not delete or rewrite a column or row it does not know, a letter saved by the older build keeps every newer column, and reopening in the newer build loses nothing. The build never shows a blocking "update the app" screen for this (K-E15); it shows the Me update line | NS-45-R13; E-S16, E-S01; new row needed | P0 (a) | `mobile` | `launch.logic.ts:11 to 14` ("MOB-09"); `GAP-LOG.md:225` |
| FR-LCY-04 | Given unsent outbox rows written by any shipped build, When a newer build starts, Then every row is sent, translated or kept, never dropped, and a contract test proves that every op type any shipped build has ever written is still accepted by the current client and server (a planned op type is never queued for send) | NS-10-R11; C-S08; new row needed | P0 (a) | `sync` | `sync.ts:23 to 29` ("the SQL refuses unknown ones with 22023"); migration 4 adds the outbox (`migrations.ts:172`) |
| FR-LCY-05 | Given a tester moves from an alpha build to a later build of the same app, When the first launch runs, Then the age and agreement step is the `agreeOnly` state (never a second age question the phone has already answered), the first sign-in shows the claim screen, and a tester whose phone already holds more than the free allowance meets the Keep gate on the next kept letter with every existing letter still readable, playable and exportable. The ledger is never lowered to be kind (it never decreases, D-082 note). The tester is told before the build, by hand, what will happen | NS-38 to NS-44 (new card row needed); E-S03.agreeOnly, E-S24, E-S10, E-S11 alpha; new row needed | P1 | `product`; `mobile` | Gate rule 2 `gate.logic.ts:49 to 52`; `letter-ledger.ts:5 to 9`; Terms 8.3 (`terms-of-service.md:107`); counsel Q40 |
| FR-LCY-06 | Given alpha builds and the store build are different apps, Then a recorded decision says, for each alpha family: (a) which app they keep using, (b) what happens to their books on `scribe-staging`, (c) what happens to the phone copies, and no alpha family's letters are deleted, moved or left behind without that family being told and offered Save a copy first. Default in section 7 (LQ-1) | new card row needed (NS-38); none; new row needed (ops and data-architect) | P0 (a) | founder; `ops`; `data-architect`; `product` | `ENVIRONMENTS.md:8, 19 to 21, 72`; `app.config.ts:86, 206`; grep finds no decision |
| FR-LCY-07 | Given staging holds real family letters (`ENVIRONMENTS.md:8`) and is to be retired, When it is retired, Then each family has had a dated notice and a Save a copy, deletion of staging data follows the data-request runbook's rules, and the retirement is recorded in `DECISIONS.md`; counsel must confirm any duty to those families as users | new card row needed; none; new row needed (ops) | P0 (b) | `ops`; `privacy`; founder | `ENVIRONMENTS.md:72`; `data-policy.md` retention table; counsel Q51 |
| FR-LCY-08 | Given a TestFlight build expires after 90 days, Then every tester round names the expiry date of the build in the message that sends it, says "update before then, and do not delete the app", and asks for Save a copy first; a tester who lets it lapse is told by hand how to get the next build | none (outside the app); none; new row needed (release) | P1 | `release` | Apple TestFlight page (read 20 Nov); the 90-day rule is Apple's, the message is ours |

#### Moving to a new phone, a second phone, no server

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LCY-09 | Given a phone restored from an iCloud device backup (database, recordings, pictures present; Keychain session and ledger item absent; packs and models excluded), When the app opens, Then it opens signed out on the book (gate rule 2), says nothing alarming, re-downloads models and packs on need, re-plans notifications, and a later sign-in to the same account shows no claim screen and no duplicate letter (NS-10-R6). A test builds exactly that state (files in place, empty Keychain) and runs it | NS-10-R6, NS-45-R3; C-S10, C-S01 (signed-out card); new card row needed | P0 (a) | `mobile` with `sync`; `qa` device row | Apple backup page (read 20 Nov); `secure-storage.ts:24`; `letter-ledger.ts:22`; D-033; recordings and photos in backup is an inference, restore not run |
| FR-LCY-10 | Given a restore or a new phone signs in with a different account from the one that owns the letters on the phone, Then the screen says in plain words that these letters belong to another sign-in, names the method used (never the full email), and offers Save a copy and Erase everything, and never moves a letter between accounts | NS-10-R3, R5, R12; E-S18, C-S10 wrong account, C-S19; none | P0 (a)(b) | `mobile` | `ownership.ts:48 to 49`; ADR 0023 layer 3; `[X4-R1]` |
| FR-LCY-11 | Given an account was deleted (on this phone or another) and this phone still holds the book, When the person signs in to a new account (a new user id, even with the same email), Then the claim screen is offered again and, after the masked-email tap, the letters on this phone are claimed by the new account; they are never stranded behind `sync_account_mismatch`. Nothing uploads before that tap | NS-45 (new row needed), NS-10-R9; E-S24 (new state needed), E-S18, C-S20; new row needed (sync, with a `security` read) | P0 (a) | `sync`; `security` | `ownership.ts:48 to 49, 93 to 113` (the owner is released only when the phone holds nothing); `19:1518` "the letters on this phone stay"; I did not find code that releases it after a purge, to be confirmed by a test |
| FR-LCY-12 | Given no server can be reached (a build with servers off, an outage, a paused project, a closed service), Then the book on the phone reads, records, searches and saves a copy; a new phone can receive the book only through its own backup restore; and no screen, article or macro says Save a copy restores a book unless an import exists (FR-LCY-05 option B). The honest line is: a copy is yours to keep and open anywhere | NS-10, NS-11; C-S04, C-S10 offline; new row needed (content) | P0 (a) claims | `content`; `support`; `sync` | `export.en.ts:90 to 104`; no importer in the repo; README ground rules on claims |
| FR-LCY-13 | Given one parent with two phones on one account, Then: words arrive on both, recordings stay on the phone that made them while backup is off (the Book says so once; the letter's provenance row says "not on this phone"), reminders and last-open book are per phone, the allowance counts once across both phones, Plus works on both through the same Apple Account, and a letter edited on both phones keeps both versions word for word (never a silent overwrite). Tests on two devices or two simulated clients, including an hour offline on one | NS-10-R1, R13, R14; NS-08; C-S09, C-S12; none | P0 (a) | `sync`; `qa` | NS-10-R14; export `data/other-versions.json` (`schema.ts`, 1.2.0 note); Terms 8.14 |
| FR-LCY-14 | Given a parent asks "how do my recordings get to my new phone", Then the help article and macro answer truthfully for the build: with backup off, the recordings are on the old phone and in the phone's own backup; Save a copy holds them; nothing of ours holds them; no line promises that a recording survives a lost phone (frame section 7) | NS-08, NS-10; none; new row needed (support, FR-SUP-04, M9, M10) | P0 (a) | `support`; `content` | `00-product-frame.md:87`; support FR-SUP-07 |

#### iPad, landscape, minimum iOS, app update

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LCY-15 | Given the supported-devices promise, Then one line is true in every place it appears: the app is for iPhone on iOS 17 or later; on an iPad it runs as the iPhone app (not designed for it, a smoke row only); no store text, site page or article says "works on iPad"; and the app stays portrait. A person who rotates an iPhone or uses an iPad in landscape is not asked to; counsel and `a11y` decide whether a portrait lock needs a line for people who cannot rotate their device (UNVERIFIED: WCAG 1.3.4 was not read this session) | NS-34, NS-33; E-ST46; new row needed (a11y) | P1 | `compliance`; `a11y`; `marketing` | D-040; `app.config.ts:44, 219, 236`; `14-test-plan.md:88`; finance FR-FIN-19 |
| FR-LCY-16 | Given a future decision to raise the iOS floor or to support iPad, Then it is a founder decision written before the build, with: what a parent on a phone that can no longer update can still do (the installed build keeps working; Save a copy must keep reading every export schema) and what the store offers them (UNVERIFIED: whether Apple offers an older compatible version of the app was not read). The floor does not rise in the 1.0.x line | none; E-S27 (App Store page); new row needed | P1 | founder; `mobile` | D-040 |
| FR-LCY-17 | Given `minSupportedVersion` above the installed build, or a `426` and `SCVER` answer, Then Me shows one line with the App Store button, nothing shows on Home, and recording, reading, searching, saving and Save a copy work; letters made while the phone cannot sync wait in the outbox and send after the update (never dropped, FR-LCY-04); the key is raised only after the newer version is in every storefront and only after a binary with the consumer has shipped (FR-OPS-25). The two card lines are made one: NS-45-R14 ("nothing about a newer version that is not required") and E-S16 as ruled in K-E05 ("Update available is one line in Me") | NS-45-R13, R14; E-S16, E-ST18, J-E15; new row needed (G-E03) | P0 (a)(c) | `mobile`; `ops` | `GAP-LOG.md:225, 333`; `19:1489, 1568, 1615`; `remote-config.ts:98 to 99` |
| FR-LCY-18 | Given the server retires an old wire version, Then there is a written support window (default in section 7: every build still installable from the store or TestFlight in the last 12 months, and at least the current and previous version), changes are additive first and the old shape is removed only after `minSupportedVersion` has been above it for the window, and a contract test in `packages/api` runs the previous build's calls against the current server | NS-45; none; new row needed | P1 | `sync`; `ops` | `sync.ts:46 to 52` (F16-REQ-019: current and previous); ENVIRONMENTS promotion path step 4 ("expand, then contract") |

#### Account deletion elsewhere

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LCY-19 | Given phone A deletes the account while phone B is signed in with a synced book and unsent letters, When B next talks to the server and gets `deleted`, Then B signs out once with one plain line in Me, its whole book stays readable, playable and exportable, its unsent letters are kept (never discarded), nothing uploads, and the person is offered the claim path of FR-LCY-11 on a later sign-in. During the 30-day window the account is not deleted: B keeps syncing; Cancel deletion on any phone returns everything (NS-45-R9, R10) | NS-45-R9, R10, R3, R7; C-S10 deletedElsewhere, C-S20; new row needed | P0 (a)(b) | `sync`; `mobile` | `19:1518` and R3; `ownership.ts` |

#### Long-term archive: the book in 18 years

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LCY-20 | Given a Save a copy file and a computer with no app, no account and no network, When a person who has never seen the product opens it, Then the `README.txt` tells them what is inside, the letters open in a plain text editor, `index.html` shows every letter with its date and plays every recording, the PDF opens, and every recording's SHA-256 in `manifest` matches. A cold-read test runs for each export schema minor (1.0.0 to the latest) on the newest and one older desktop browser and media player, and every shipped schema version stays readable by the current schema validator. The README names the codec and the container for each recording so a tool can be found for it | NS-11-R6a, R6b, NS-36-R2, R7; C-S04; new row needed | P0 (a) "A copy in open formats" | `qa`; `mobile` | `build.logic.ts:550 to 590`; `export.en.ts:90 to 104`; NS-36-R7 |
| FR-LCY-21 | Given a book that grows for years, Then a copy never fails for size: above 2 GB the export splits by child and year, each part is a complete readable archive with its own README and manifest, and the part count is stated once, never as a count of what is missing. At the ADR 0005 assumption of about 19 MB a month, 3.9 GB is reached after about 205 months (17 years); pictures (NS-01) and a heavier family reach it sooner. The split ships before the pictures flag is on in production | NS-11-R9, R18, NS-07, NS-01-R59; C-S04 failed (`tooBig`); new row needed | P0 (a) | `mobile`; `data-architect` (manifest shape) | `pack.ts:9 to 20` (`MAX_EXPORT_BYTES = 3_900_000_000`, no ZIP64, split not built); `export.tsx:56, 131`; F15 line 154; ADR 0005 consequences; my arithmetic: 3,900 / 19 = 205 months |
| FR-LCY-22 | Given recordings are `.aac` (ADTS) for every iOS take since ADR 0027, and `.m4a` before, Then the export's `index.html` plays both on the current Safari, Chrome and Firefox and on one older version of each (the result filed as a yes or no per browser), and where a browser cannot, the README line says which player does (a plain statement, not a promise). Recordings are never transcoded or rewritten in the export; the original stays byte for byte. If a browser cannot play ADTS, `mobile` and `qa` bring the question to Karma (a lossless rewrap is a separate ruling, because the export promises the original byte for byte) | NS-11, NS-36-R2; C-S04; new row needed | P1 | `qa`; `mobile` | ADR 0005 amendment; `export.en.ts:101`; `build.logic.ts:417`; DL-06 in `docs/qa/DEVICE_TEST_PLAN.md` (named in `TESTFLIGHT.md:195`, not read) |
| FR-LCY-23 | Given the export schema is the contract with a future reader, Then each minor's JSON schema, a one-page plain-language description of the format, and a sample archive made from the Asha fixture are published at a stable, versioned address from the CDN with a long cache, kept for as long as the Terms 90-day closing promise needs, and copied into every export; a closing notice (Terms line 156) points to them | NS-36-R7; none; new row needed (web, with `legal`) | P1 | `web`; `legal`; `sync` | `schema.ts` header notes; Terms line 156 |
| FR-LCY-24 | Given the service closes, Then a closing runbook exists: 90 days' notice (Terms), new charges stopped, a final build whose Save a copy works with no server, the `minSupportedVersion` line used to say so, no deletion of a person's server copy before they have had the notice period and a way to export, and the Apple Account holder told how to cancel. Counsel must confirm the wording | none; E-S16; new row needed (ops, with `legal`) | P1 | `ops`; `legal` | `terms-of-service.md:25, 156`; `privacy-policy.md:159` |

#### The child grows up; the parent cannot be reached

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LCY-25 | Given {child} is grown, Then the product does not deliver, announce or mail anything to {child} by age or date (a child does not use the Service, Terms 2.3; a sealed letter has no delivery by us, latest date the 25th birthday, legal L-2 default). The only hand-on path in this pack is the parent's own act: Save a copy, given on, and a help article that says how to open it on any computer. No in-app string says "when {child} is 18" or promises a delivery. Counsel must confirm whether any later reading by a grown child creates a duty (legal L-2) | NS-11, NS-06 B; C-S04; new row needed (help article, FR-SUP-04) | P1 | `content`; `support`; `legal` | `terms-of-service.md:38 to 42, 68`; `legal.md` L-2 |
| FR-LCY-26 | Given an account nobody can sign in to (an email that no longer works, an Apple relay address, an Apple link revoked, a phone lost with no backup), Then: no account is deleted for being quiet (`data-policy.md:197`; counsel to confirm against storage limits, OQ-11), the help article lists what is still true (the book stays on any phone that holds it; a sign-in method can be retried; support can neither read letters nor reset to a different person without the sign-in proof in FR-SUP-13), and support never accepts a claim that cannot be proved | NS-10, NS-45; E-S02 lastMethod, C-S10 wrong account; new row needed | P1 | `support`; `privacy` | support FR-SUP-13; `data-policy.md:197` |
| FR-LCY-27 | Given a person writes that the parent has died or cannot act, When support reads it, Then the first reply is human and kind, makes no promise about access, says what we can and cannot see (recordings are not on our servers while backup is off; no one at the company reads letters), and follows a runbook that counsel has read before the first store release has outside families: who may receive one export of a sole parent's book, on what documents, and never an account takeover (counsel Q49 default is "no clause; runbook before C1"). Claude roles are not lawyers; counsel must confirm RUFADAA and any other law, none of which I read. Apple's Legacy Contact page lists "device backups" among data a contact might receive and does not address third-party app data; we make no claim about it | none; none; new row needed (support and legal runbook) | P1 | `support`; `legal`; counsel | Q49 (`COUNSEL_PACKET.md:90 to 92`); support Q-SUP-10; Apple Legacy Contact page (read 20 Nov) |
| FR-LCY-28 | Given every lifecycle surface above, Then its words pass the legacy rule (time and love, never endings), and no in-app string uses a word on the loss and ending scan list ("if I am not here", "when I am gone", "farewell", "last letter", "passing", "legacy contact", "in memory of"). A future in-app "trusted person" surface is a new card with counsel read and a scan allow-list entry with a written reason; it is not slipped in as a setting | none; none; new row needed (content rules test) | P0 (a) | `content` | `VOICE.md:31 to 33`; README Appendix A (line 140) |

#### Android readiness

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LCY-29 | Given every contract that is shared between client and server or leaves the phone (sync wire shapes in `packages/api`, the export schema, ids, dates, language tags, the `base_direction`), Then none carries an iOS-only value: ids are UUIDv7, dates are ISO, a local file path (`audio_uri`, photo folder) is never synced or exported as a path to a phone, and the audio container is a field (`audio/mp4` or `audio/aac`), never an assumption. A test scans `packages/api` and the export schema for `ios`, `Library` and `Documents` | NS-36-R10; none; new row needed | P2 | `sync` | `schema.ts` (`media_type`); ADR 0005 and 0027 (Android stays `.m4a`) |
| FR-LCY-30 | Given Plus, the allowance ledger and sign-in today live on Apple (Terms 8.14: Plus belongs to the Apple Account; Sign in with Apple; a Keychain ledger), Then the entitlement and sign-in code sit behind small interfaces with the iOS provider as the only implementation, `packages/core` and `packages/api` stay free of StoreKit and Apple types (a grep check; I found Apple strings in `packages/api/src/server/subscription-status.ts` and `standards.ts`, not read), and the plan for a family with one iPhone and one Android phone is written as a question, not built: Plus would not follow the person across stores | NS-44, NS-25; E-S11; new row needed | P2 | `mobile`; `sync` | `terms-of-service.md:136`; `letter-ledger.ts:5 to 22` |
| FR-LCY-31 | Given a new native module or an iOS-only API, Then its card carries one line "what Android would do" (absent, a stand-in, or not offered), the TS side returns null when the module is absent (as `scribe-keys` does), the absent rule hides the control, and no sync or export field exists only because of that module. Today `scribe-keys`, `scribe-files` and `scribe-photo` have no `android` folder; `scribe-audio` and `scribe-store` have one | NS-01-R59; none; new row needed | P2 | `mobile` | `modules/` listing; `scribe-keys/index.ts:2 to 5` Extended by FR-LCY-39 on 20 Nov. |
| FR-LCY-32 | Given C-39 reopens (study U8 shows many mixed-platform couples), Then the work starts from this list, not from the iOS app: sign-in without Apple (UNVERIFIED how Sign in with Apple works on Android), invites by an Android app link, notifications, speech models per the pack system, backup and device-restore rules, an Android build of every phone-only store, and the Terms 4.1 line "Sharing a book needs a version of the app with sign-in". Nothing in this pack is built for Android | NS-25; none; none | P2 | `product` | `12-parked-and-not-built.md:18`; Terms 4.1 (`terms-of-service.md:58`) |

#### Option B: import a Save a copy file (a proposal for ruling, not a requirement)

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LCY-33 (proposal) | Given a person has a Save a copy file made by this product (schema 1.0.0 or later), When they choose to bring it into a phone with no matching book, Then the app checks each file against its SHA-256 and schema, restores every letter's `final_text`, `raw_transcript`, edits (each re-checked by `verifyEdits`, no bypass), recordings and pictures exactly as exported, idempotent on entry id, never merges into another account's book, never rewrites a word, and says in plain words what it brought and what the file did not hold. Constitution check: restoring what a person said, verbatim, adds no meaning. This is a feature; it needs a ruling (LQ-2) and its own card. Default: not built for the first store release | new card row needed; new screen needed; new row needed | P1 (proposal) | `product` rules; `mobile`; `sync` | `ExportEntry` carries `id`, `raw_transcript`, `raw_sha256`, `machine_edits` (`schema.ts:121 to 152`) |

#### Tests that prove the lifecycle (supports every row above)

| Id | Requirement | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LCY-34 | Given the test plan, Then these journeys exist and run on every release candidate: J-L1 upgrade from each shipped schema (FR-LCY-01); J-L2 restore from a device backup then sign-in (FR-LCY-09); J-L3 second phone, one offline an hour (FR-LCY-13); J-L4 deletion on one phone, the other signed in (FR-LCY-19); J-L5 required update with unsent letters (FR-LCY-17); J-L6 cold read of a copy (FR-LCY-20); J-L7 a copy near the size limit (FR-LCY-21). Each uses the Asha fixture only (ruling D13) | new rows in `14-test-plan.md`; none; new row needed | P0 (a) | `qa` | `14-test-plan.md` device matrix (lines 85 to 88) |

---

## 4. Design needs

| Where | Need | FR |
|---|---|---|
| E-S24 claim screen | New state: "your earlier account was deleted; keep these letters in this account?" Same masked-email and tap rules as ADR 0023 layer 3; words say what happens, not who is at fault | FR-LCY-11, 19 |
| C-S10, C-S11 | A state for "this phone's letters belong to another sign-in": names the method, offers Save a copy and Erase everything | FR-LCY-10 |
| E-S16 | One line, one rule: the "update available" and "can no longer reach your account" words as two states of the same line, absent when current. Resolves NS-45-R14 against K-E05 | FR-LCY-17 |
| E-S01.recovery | Keep "Export what's readable" on every recovery state; it must run against an older-schema file | FR-LCY-02 |
| C-S04 | A state for a split copy (part names, one sentence, no count of what is missing); `tooBig` stops being a dead end that points to "Write to us" | FR-LCY-21 |
| C-S01 signed-out card | The signed-out state after a device restore reads as normal, not as a fault | FR-LCY-09 |
| New screen needed | Only if LQ-2 is ruled yes: "Bring a copy in" (choose a file, a plain check, what came in). No id yet | FR-LCY-33 |
| Outside the app (help centre) | Articles: "A new phone", "Where my recordings are", "Giving {child} the book", "If you cannot sign in", "If someone cannot use their account", "Opening a copy on a computer". Written by `content` under the legacy rule | FR-LCY-12, 14, 25, 26, 27 |

No design need for iPad or Android: the iPhone layout is the layout (E-ST46).

## 5. Card changes proposed (for Karma to rule)

| Card row | Change | Why |
|---|---|---|
| NS-45-R14 | Reword to match K-E05: a build at or above `minSupportedVersion` shows nothing; below it, one line in Me; "update available" is the same line, softer words | Two lines disagree today (FR-LCY-17) |
| NS-45 section 5, row "Deleted and purged; this phone opens later" | Add: the new account can claim the letters on this phone through the claim screen | FR-LCY-11 |
| NS-10 section 5 | Add a row "Restored from a device backup, then sign-in: signed out on first open, book readable, no claim screen when the account is the same" and a row "no server: only the phone's own backup brings the book" | FR-LCY-09, 12 |
| NS-11 sections 3 and 19 | Add the claim guard: Save a copy is "a copy in open formats", never a restore; and add the split above 2 GB to NS-11 or to a new row, gated before pictures are on in production | FR-LCY-12, 21 |
| NS-38 to NS-44 (new rows) | One row for an existing alpha install (agreement only, claim, allowance on the next Keep) | FR-LCY-05 |
| NS-36 section 10 | Each card that adds a local table or column states its local migration step and the fixture row (FR-LCY-01); "Migrations: none" is replaced by "Local: step n" or "Local: none" | FR-LCY-01, 02 |
| `12-parked-and-not-built.md` | Add parked rows: "Bring a copy in (import)" with reopen trigger "a family cannot get a book to a new phone any other way, or the closing runbook needs it"; "A trusted person receives one copy" with reopen trigger "counsel Q49 answered"; both under the legacy rule | FR-LCY-27, 33 |
| `12-parked` C-39 Android | Add the do-not-build list of FR-LCY-29 to 32 as its guard | FR-LCY-29 to 32 |
| `14-test-plan.md` | Add journeys J-L1 to J-L7 and an iPad smoke row that states the support line | FR-LCY-34, 15 |

## 6. Engineering needs (backlog rows to add or change; ids from `next-id.mjs` when filed, none above BL-999 invented here)

| Need | Lane | FR |
|---|---|---|
| New row: local upgrade fixtures for every shipped `user_version` with Asha data, plus the additive-only scan of `MIGRATIONS` | `mobile`, `qa` | FR-LCY-01, 02 |
| New row: older build on a newer file never rewrites unknown columns; round-trip test | `mobile` | FR-LCY-03 |
| New row: contract test of every shipped outbox op type against the current client and server | `sync` | FR-LCY-04 |
| New row: the `minSupportedVersion` consumer and the E-S16 line (this is G-E03 in `GAP-LOG.md:333`); `SCVER` and `p_api_version` | `mobile`, `sync` | FR-LCY-17, 18 |
| New row: claim after a deleted account (owner release or replace after the masked-email tap), with a `security` read | `sync`, `security` | FR-LCY-11, 19 |
| New row: device-restore state test (files present, Keychain empty) | `mobile`, `qa` | FR-LCY-09 |
| New row: export split by child and year above 2 GB, each part complete; remove the dead-end `tooBig` path | `mobile`, `data-architect` | FR-LCY-21 |
| New row: cold-read test of a copy and playback of `.aac` and `.m4a` in `index.html` | `qa` | FR-LCY-20, 22 |
| New row: the public export format page, schemas, and sample archive from the CDN | `web`, `legal` | FR-LCY-23 |
| New rows (ops): alpha-to-store decision record, staging retirement, TestFlight expiry message, closing runbook | `ops`, `release` | FR-LCY-06, 07, 08, 24 |
| New row: content scan for the loss and ending words covers help articles and the website pages that carry lifecycle copy | `content` | FR-LCY-28 |
| New row: support window and the previous-build contract test in `packages/api` | `sync` | FR-LCY-18 |
| No row from this file for server migrations. Any schema change that a requirement above implies goes to `data-architect` as a migration task; I do not write migrations | `data-architect` | none |

Standing duties noted: contract tests between `packages/api` types and the database (FR-LCY-04, 18, 29), retry and idempotency tests (FR-LCY-04, 19), a latency report (not run here: no code was run).

## 7. Founder or counsel questions, each with a recommended default

Counsel numbers are from `COUNSEL_PACKET.md` 1.5.0 where one exists; "needs a number from legal" otherwise. The default is what I would do if no one answers; every default is reversible by the founder.

| # | Question | To | Recommended default | Number |
|---|---|---|---|---|
| LQ-1 | The alpha families used builds that are a different app from the store app. Do they keep the alpha app (updated in place, data stays), or move to the store app (starting empty, books on staging not carried)? What happens to their books on staging when the alpha ends: moved to production, or deleted after a notice and a Save a copy? | founder | Alpha families stay on the alpha app until each says otherwise; the store app starts clean for them; staging is kept until each family has a Save a copy and a dated notice, then retired; the decision is recorded in `DECISIONS.md` | needs a number from legal for any duty to them as users FOUNDER-ANSWERED 20 Nov, default accepted (CL-077): Default: tell them before build; founder gift decision. Decision made, action pending founder hands: tell the alpha families, gift decision |
| LQ-2 | Build "Bring a copy in" (import of a Save a copy file)? | founder, `product` | Not for the first store release. Reopen if a family cannot move a book any other way, or the closing runbook needs it. If built, verbatim restore only, through `verifyEdits` | none CLOSED 20 Nov, see GAP-LOG Closures CL-078 |
| LQ-3 | Export split above 2 GB: before pictures are on in production, or later? | founder, `product` | Before pictures are on in production (it also removes the 3.9 GB ceiling) | none CLOSED 20 Nov, see GAP-LOG Closures CL-078 |
| LQ-4 | Stay iPhone-only with iPad as a compatibility smoke row, portrait only? | founder | Yes through the 1.0.x line; no "works on iPad" claim | none CLOSED 20 Nov, see GAP-LOG Closures CL-078 |
| LQ-5 | Keep iOS 17 as the floor through 1.0.x? | founder | Yes | D-040 CLOSED 20 Nov, see GAP-LOG Closures CL-078 |
| LQ-6 | Server support window for old builds | founder, `ops` | The current and previous wire version, and any build installable in the last 12 months; additive changes first | none CLOSED 20 Nov, see GAP-LOG Closures CL-078 |
| LQ-7 | Alpha testers with more kept letters than the allowance: give them anything? | founder, counsel | Tell them before the build; change nothing in the ledger; a Plus offer code is a founder gift decision, outside the app | Q40 FOUNDER-ANSWERED 20 Nov, default accepted (CL-079, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement |
| LQ-8 | Ordinary hand-on: is "Save a copy, given on" enough for a grown child, with no delivery by us, no age trigger and no account for {child}? | founder, counsel | Yes | needs a number from legal; with L-2 and Q45 FOUNDER-ANSWERED 20 Nov, default accepted (CL-079, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement |
| LQ-9 | Death or inability to act: a clause, or a runbook only? Who may receive one export of a sole parent's book, on what documents, and what do we say to the family on day one? | counsel | No clause; a counsel-read runbook before outside families sign in; one export, never an account takeover, only after documents counsel names | Q49, support Q-SUP-10 FOUNDER-ANSWERED 20 Nov, default accepted (CL-079, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement |
| LQ-10 | Inactive accounts: confirm "no automatic deletion in v1" against storage limits | counsel | Keep as is; revisit at the first real inactive account | data policy OQ-11, Q51 FOUNDER-ANSWERED 20 Nov, default accepted (CL-079, default as stated in the row and in GAP-LOG Closures). Decision made, action pending founder hands: counsel engagement |
| LQ-11 | If `.aac` does not play in a browser, may the export carry a lossless rewrap beside the original? | Karma, founder | Keep the original byte for byte; add a rewrap only if the browser test fails, and only as an extra file | none CLOSED 20 Nov, see GAP-LOG Closures CL-078 |
| LQ-12 | Should an account made only with Apple be able to add an email sign-in so it can ever be used on another platform? | `security`, founder | Ask `security` to review before C-39 reopens; not now | none CLOSED 20 Nov, see GAP-LOG Closures CL-078 |

---

## Report-back summary lines for the integrator

- Requirements: 34 rows (FR-LCY-01 to FR-LCY-34), of which one (FR-LCY-33) is a proposal for ruling, not a requirement. P0 rows: 01, 02, 03, 04, 06, 07, 09, 10, 11, 12, 13, 14, 17, 19, 20, 21, 28, 34 (18 rows). P1: 05, 08, 15, 16, 18, 22, 23, 24, 25, 26, 27, 33 (12). P2: 29, 30, 31, 32 (4).
- Card changes proposed: 9. Backlog needs: 12 new rows, none above BL-999 invented. Founder or counsel questions: 12.
- Not read or run: listed in section 1.

## Addendum 20 Nov 2026: photo moments and pictures and videos

Source: `26-founder-direction-photos-library-and-media.md`. Cards NS-51 "Photo moments" and NS-52 "Pictures and videos with a letter" are now in `27-photo-moments-and-media.md` (NS-51-R1 to R42; I read it after drafting, so rows are aligned to it where an "Aligned" note says so). I cite existing rows by id and do not repeat them: FR-LCY-01, 02, 09, 10, 11, 13, 15, 19, 20 to 24, 27, 28, 31; NS-01-R16a to c, R27, R28, R29, R55, R56, R61; NS-45; K15 in GAP-LOG. No outside source read; Apple behaviour below is UNVERIFIED. Claude roles are not lawyers; counsel must confirm every legal reading. Fictional family Asha only.

The lifecycle stake: a picture or video of a child is the most irreplaceable and the most sensitive object in a book. Loss, exposure after a family change, and exposure after a death are the cases to design for.

### E.1 Requirements (continue FR-LCY-35 onward)

| Id | Requirement (Given, When, Then) | Links | Priority | Owner lane | Evidence or source |
|---|---|---|---|---|---|
| FR-LCY-35 | Given a database and export from any shipped build (one picture per letter, schema 1.7.0), When the build that holds several pictures and videos starts, Then the migration is additive (FR-LCY-02), every existing picture reads as the letter's first and only media item, nothing is queued to the outbox, every recording plays, and a fixture with the Asha two-book family, 300 pictures and sealed letters proves it. A rollback to an older build opens the data without losing media (FR-LCY-03) | NS-52; NS-01-R35; FR-LCY-01 to 03; new row needed | P0 (a): loss | `mobile`; `qa` | NS-01-R35 (the same shape for migration 11) |
| FR-LCY-36 | Given Save a copy with several pictures and videos, Then: each media file is in the archive with its hash and a manifest entry; the export splits by child and year above its size cap and this is routine, not an edge case (LQ-3 default: before pictures are on in production); the README names the container and codec of each video and says which software opens it (FR-LCY-20); videos in a format a current browser cannot play are kept byte for byte with a plain note, and a playable rewrap beside the original is a separate ruling (the same shape as LQ-11); the new schema minor keeps every earlier minor readable and gets its one-page format description and sample archive (FR-LCY-23). A cold-read test opens a media export with no app. Which video container and codec the app stores is not decided and I did not verify browser support | NS-52; NS-11; FR-LCY-20 to 23; LQ-3, LQ-11; new row needed | P0 (a): a copy in open formats | `mobile`; `qa` | FR-LCY-20 evidence |
| FR-LCY-37 | Given a new phone, a restore from an iCloud device backup, or a second phone, Then: pictures and videos come back with the letter only through the phone's own backup while sync of media is off (the line is true and named once, NS-01-R32 pattern); a restored row whose file is missing shows "Not on this phone any more" with Remove for the author (NS-01-R56 extended to video); the library index and the moments opt-in are never restored as data (NS-51-R6, R23): the app rebuilds from the new phone's library after the parent opts in again, and re-asks the Photos permission itself (whether iOS carries the permission across a restore is UNVERIFIED, so the design must work if it does and if it does not); words and recordings are untouched. If media sync is ruled yes (Q-PM-3), a second phone receives media with progress and a resumable download, and the Book says so once. Backup size: large video can exceed a free backup allowance (UNVERIFIED); until measured, a line in Me says where a video lives and how to save a copy | NS-52; NS-51; NS-10; NS-01-R27, R28, R56; FR-LCY-09, 13, 14; C-S08; new row needed | P0 (a): frame section 7 (no promise that a recording or video survives a lost phone) | `mobile`; `sync`; `content` | NS-01-R27, R56 |
| FR-LCY-38 | Given a person writes that the parent has died or cannot act, Then FR-LCY-27 holds unchanged and adds: no staff tool exports pictures or videos (K15); the first reply says that pictures and videos are on the parent's phone and in the phone's own backup unless the parent chose to sync, so the family should keep the phone and its backup and may need the Apple account holder's help (a statement of our own limits, no promise about Apple); the runbook counsel reads before the first outside families covers media with the same single export of a sole parent's book (LQ-9) and says that no account takeover occurs; no moment, reminder or invitation is built from the parent's library after the app is no longer opened, and none of our messages names a person, a loss or an ending (FR-LCY-28 scan) | NS-52; FR-LCY-26 to 28; LQ-9; counsel Q49; support FR-SUP rows | P1 | `support`; `legal`; counsel | K15; Q49 |
| FR-LCY-39 | Given the iPhone app running on an iPad, on an Apple silicon Mac, on Apple Vision, and the build on Android later, Then moments and the library read are absent there (never a dead button) until a device row for that destination passes, because the library on a Mac or a Vision device may be a different and much larger library and permission behaviour may differ (UNVERIFIED, nothing read or run); attach through the picker and view of media follow NS-49-R18: present only where the picker works, with a row per destination (iPad; a Mac and a Vision if one exists, else "not run"); Android is not offered and the TS side returns null, with the "what Android would do" line (FR-LCY-31): absent, with a note that Android's partial photo access is a different model to design (UNVERIFIED, not read). No "works on iPad or Mac" claim anywhere (FR-LCY-15) | NS-51; NS-52; NS-49-R18; FR-LCY-15, 31; quality P14; new row needed | P1 | `mobile`; `qa` | NS-49-R18 pattern |
| FR-LCY-40 | Given a family change (the parents separate; a sole parent hands a phone on; two parents share a book under NS-25; an other-parent invitation is undone), Then: each parent's library is theirs and on their phone; the moments index is per phone and never shared; media attached to a letter belongs to the author's letter and follows that letter's visibility (the other parent sees it only if letters are shared with them and, if Q-PM-3 is yes, only through server access rules tested per book and member); when the other parent is removed or leaves, they lose access to the book's media in the app at once, copies they already saved stay theirs, and the screen says so in plain words; no feature compares or merges two parents' libraries; the support rule stands that staff do not adjudicate access between parents (FR-POL-04, 05). Counsel must confirm duties about a child's image shown to a former partner (Q48); needs a number from legal for any custody-related reading | NS-52; NS-25; FR-RSH-06; FR-LCY-10; counsel Q45, Q48; new row needed | P0 (b): another adult and a child's images | `sync`; `security`; counsel | NS-01-R29 (second account); FR-POL-04, 05 as cited by FR-RSH-06 |
| FR-LCY-41 | Given account deletion with media, Then: on the phone that deletes, Erase everything removes every picture, video, poster frame, thumbnail cache, moments index and setting, file first then row (NS-01-R16c, R36 extended to video); if media sync exists (Q-PM-3), the server copies are removed in the deletion window with the same cancel path as the rest (NS-45-R9, R10) and storage objects are listed in the deletion receipt without naming files; on a second phone signed in to the deleted account the book stays readable and its media stays playable and exportable, nothing uploads (FR-LCY-19); the 30-day window never deletes media early; the deletion text and the where-it-lives lines name pictures and videos by their own words and never say they are removed from places the server cannot reach (NS-01-R31); iPhone and iCloud backups of the phone are Apple's and the line says so | NS-45; NS-52; FR-LCY-19; NS-01-R16c, R31, R55; privacy FR-PRV-19, 34 | P0 (a)(b) | `sync`; `mobile`; privacy | NS-01-R31 |
| FR-LCY-42 | Given sign-out, a second account on the same phone and Erase, Then: sign-out keeps the book and its media on the phone (D1); the moments opt-in, index and album choice are cleared by sign-out, Erase everything, delete account and Turn off, as NS-51-R17 rules (sign-out still keeps the book and its media, D1); account B sees none of A's media, moments, dismissals or settings (`[X4-R1]`, NS-01-R29); the library index is disposable, excluded from the iPhone backup (NS-51-R6, R23), never synced or exported; a revoked Photos permission in iOS Settings makes moments silently absent, attach through the picker still works, and nothing nags | NS-51; NS-52; NS-01-R29, R30; D1; quality C.1 | P0 (a) | `mobile`; `qa` | NS-01-R29, R30 |
| FR-LCY-43 | Given the book in 18 years and the service closed (FR-LCY-24), Then the final build's Save a copy works with no server and includes media; the closing runbook says so; media in an open, documented container is preferred to one that needs our app; and nothing in a letter's own words depends on its media (a letter reads whole without them) | NS-52; FR-LCY-24; LQ-2 | P1 | `mobile`; founder | FR-LCY-20, 24 |

### E.2 Design needs

| Where | Need |
|---|---|
| C-S10 and sign-out sheets | Name pictures and videos once where media exists (NS-01-R30 extended); deleted-elsewhere state names media |
| E-S24 and the deletion screens | Media and thumbnails in what is removed, by words, not file names |
| C-S04 Save a copy | Size estimate and split line for media; no promise of video playback in every program |
| B-S08 letter page | Missing media state for pictures and video; media removed for another adult (state to add) |
| A new screen in Me | Where pictures and videos live, one place, true for the build (default: phone and phone backup) |

### E.3 Card changes proposed

| Card row | Change | Why |
|---|---|---|
| NS-10 | Add: media returns only through the phone's backup (or sync if ruled); the library index is rebuilt | FR-LCY-37 |
| NS-11 | Add: media in the copy with hashes; split rule; video container named | FR-LCY-36 |
| NS-25 | Add: removal of the other parent ends in-app access to media; saved copies stay | FR-LCY-40 |
| NS-45 | Add media to the deletion rows | FR-LCY-41 |
| NS-49-R18 | Extend to NS-51 and NS-52 destinations | FR-LCY-39 |

### E.4 Engineering needs (new rows; none above BL-999 invented)

Media migration fixture and test; export schema minor and cold-read test; deletion purge order for video, thumbnails and index; two-device and second-account tests with media; per-destination `isAvailable()` for the library module; device rows for iPad, Mac and Vision.

### E.5 Questions, each with a default (who answers)

| Id | Question | To | Recommended default |
|---|---|---|---|
| LQ-13 | Q-PM-3: do pictures and videos sync to our servers or stay on the phone? | Founder with counsel (X2), finance | Stay on the phone; the rows above hold for both answers FOUNDER-ANSWERED 20 Nov, default accepted (CL-048, default as stated in the row and in GAP-LOG Closures) |
| LQ-14 | Export: keep videos byte for byte, or add a playable rewrap? | Karma, founder | Byte for byte, rewrap only if the browser test fails (LQ-11 shape) CLOSED 20 Nov, see GAP-LOG Closures CL-078 |
| LQ-15 | When the other parent is removed, do pictures attached to shared letters stay visible to them? | Founder, counsel (Q48) | No in-app access after removal; their saved copy stays theirs FOUNDER-ANSWERED 20 Nov, default accepted (CL-080): No in-app access after removal; counsel Q48. Decision made, action pending founder hands: counsel engagement |
| LQ-16 | Are videos excluded from the iPhone backup to save space? | Founder (see quality Q9) | Not excluded until measured; the line is true either way CLOSED 20 Nov, see GAP-LOG Closures CL-078 |
| LQ-17 | Allow moments on iPad, Mac or Vision runs? | Founder, `mobile` | Absent until a device row passes CLOSED 20 Nov, see GAP-LOG Closures CL-078 |

### E.6 Cannot assess yet

- Whether iOS returns the Photos permission after a device restore; whether the library on a Mac or Vision run of the iPhone app is the parent's library: neither read nor run.
- Backup size for realistic media against a free iCloud allowance: no size cap is ruled and no number was read.
- Browser and player support for the video container the app will store: undecided, UNVERIFIED.
- Which law governs a child's image after separation or death: counsel's (Q45, Q48, Q49); nothing here is a reading.
- Whether iOS keeps the system Photos permission across sign-out: the card (NS-51-R24) starts account B off even if the app already holds it.

Totals for this addendum: 9 requirements (FR-LCY-35 to 43): P0 6 (35, 36, 37, 40, 41, 42), P1 3 (38, 39, 43); 5 card changes; 5 questions (LQ-13 to 17).
