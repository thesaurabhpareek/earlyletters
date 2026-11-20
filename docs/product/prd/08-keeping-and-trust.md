# NS-08 to NS-12: Keeping (letters survive and what we say about them is true)

Status: CURRENT (LOCKED rev 2) | 20 Nov 2026 | Owner: Karma with the CPO role | Replaces: none | Load when: building or testing backup, let-go, new phone, Save a copy, earlier versions (NS-08 to NS-12).

Status detail: Locked v1.0, 20 Nov 2026 (council round 2). Changes after lock need a PR that lists every changed id.

Author: Karma with the Chief Product Officer role (Claude sessions; not `product`'s own run). Docs only. Index and card shape: `README.md`. Rulings applied: `00-rulings-round2` of 20 Nov (T1 to T5, D1 to D13, CTO rescopes), cited on each card as "Ruled 20 Nov (Karma, council round 2)".
Nothing here was run on a phone. Code facts were read on `develop` at `697233d35` in the files named, this session. Words in quotes that are not an existing `packages/content` key are intent for `content`, never final copy. Numbers marked PROPOSED are proposals. UNVERIFIED marks anything not read in code or a source this session. Every legal reading: counsel must confirm (counsel packet 1.5.0 numbers).
Job served by this whole file: "Never lose what I made" (rank 1, `docs/prd/v2/02-customers.md` section 4).
Priority: P0 rows carry their RR-4 reason in brackets: (a) a promise, (b) a legal or store duty, (c) the core loop. Test titles use the `[NS-xx-Rn]` form; `scripts/trace.mjs` does not yet read NS ids (r3 F1), so no card here claims trace coverage until the engineering thread fixes it.
Timing: cards state order and gates only (ruling T5). The roadmap and `13-engineering-plan.md` own timing.

Rules that apply to every card in this file:
- **Device evidence (ruling D13).** Every device row runs on a separate install signed in to a test account that holds only the fictional Asha book. No run sheet, screenshot, recording, log or trace carries a real name, letter, picture or voice.
- **Sign-out (ruling D1).** Sign-out keeps the book on the phone (`session-provider.tsx:293-307`, `signOut({ scope: 'local' })`; comment at line 328 "Letters on the phone stay"). The sign-out sheet says, as intent: "Your letters and recordings stay on this phone. Anyone who opens the app here can read them. Use Erase everything to remove them." A second account never sees, claims or uploads the first account's local letters (`[X4-R1]`).
- **Never (rulings D2, D3).** No letter text, child name, picture or prompt is donated to Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity (`[X6-R1]`). System writing tools (rewrite, proofread) are off on every field whose text becomes a letter's words; `mobile` checks whether React Native exposes the switch, and if it cannot, that is a finding, not a silent pass.
- **Free or Plus (ruling T2).** Every capability that ships free in the 1.0.x line falls under principle 6: it never moves behind Plus. Plus holds one paid act (keeping beyond the allowance); each card here raises the value of a kept letter. Public copy says nothing either way.
- **Measures.** Analytics is off for the 1.0 line (D-124 item 3). Hand-sent numbers are reported as "x of n", never as a percentage when n is under 20. Each tester round asks at most 5 questions, with fixed wording versioned in `docs/research/` (aggregate only). Numbers only, kept in the founder's private sheet, never in the repo or a Claude session, deleted 90 days after the round (ruling D5).

---

## NS-08. Recording backup: get ready, do not turn it on (candidate C-01, rank 1)

### 1. Who and when
P1, the evening parent, eight months in, whose phone holds every recording of their voice for {child}. The moment that matters is the day that phone is replaced, lost or broken. Second moment: the founder, the day he decides whether to turn backup on, who needs a short, checked answer rather than a research project.

### 2. Why
The first store release ships with recording backup off. The words come back on a new phone when the parent signs in; the recordings do not. The voice is the keepsake (principle 1 of the design language), so today it lives on this phone, and in the phone's own iCloud backup only if the parent has that turned on (D-033; `data-policy.md`). That is the largest gap against job 1. Evidence: [F] for the gap (backup flag off in store profiles, `capabilities.ts:26,150`); [A] for how many families have iCloud Backup on (no reading of our own; measure below).

**Why not simply turn it on.** Production is on the Supabase Free plan by the founder's decision (D-159) and recordings would fill its storage (arithmetic below); turning it on changes the App Store privacy label and the Privacy Policy, which counsel must read; the escrow and restore drill has never run against production. The 19 Nov exec record (Project doc `infra/exec-rulings-2026-11-19-scope-decisions.md`, ruling 2, read 20 Nov by Karma) sets six flip conditions, all required: (1) a storage path inside the free tier, or a spend the founder approves; (2) the escrow drill passed; (3) one device run of backup and restore; (4) the policy and label rewrite read by counsel and merged by the founder; (5) App Review notes updated; (6) a weekly egress and storage check running. Revisit when production storage passes 500 MB, or when the founder chooses R2. This card adds a seventh (below). So this card is the work that costs nothing and makes the later decision short.

### 3. What, and Not in scope
**What.** Five deliverables, no parent-facing change:
1. A read of the built backup and restore paths against `docs/ops/BACKUP_RUNBOOK.md` and ADR 0024 (owner backup v1.0; status Proposed in its header; ADR 0023 is email links and is not the backup ADR), with every difference listed by file and line. The read depends on the narrowed backup role being merged.
2. A sizing note with the arithmetic below, re-read prices, and the CFO case "1,000 free families, 20 held drafts each".
3. The escrow drill rehearsed on a scratch project, written up as a run sheet the founder can repeat on production.
4. The label and policy difference drafted for counsel (what changes from Audio Data: No).
5. The seventh flip condition answered in writing: how the backup objects themselves are copied, since Storage files are not in the nightly database dump on Free.

**Not in scope.** Setting `EXPO_PUBLIC_BACKUP` on in any store profile. Any spend. Any change to a published sentence. Any consent sheet build (the door lines below are written now so the later build does not invent them).

**Sizing arithmetic (sources read this session; prices UNVERIFIED until re-read on the day of the note).**

| Step | Number | Source |
|---|---|---|
| Recording rate | 0.48 MB per minute (AAC-LC mono 64 kbps in M4A); about 0.49 MB/min with the M4A index and about 0.50 MB/min as ADTS | ADR 0005 line 11; ADR 0027 line 48 |
| Audio per active family per month | 40 minutes [A] | 06-nfr 11.3 |
| Originals per active family per month | 40 x 0.48 = 19.2 MB (20 MB at 0.50 MB/min) | 06-nfr 11.3; ADR 0005 line 23 ("about 19 MB") |
| With the listening copy | 38.4 MB per month (0.96 MB/min). Backup uploads originals only (PROPOSED; ADR 0024 to confirm) | 06-nfr 11.3 |
| Free plan storage | 1 GB file storage; 5 GB egress; no automatic backups | `docs/ops/runbooks/free-tier-ops.md` line 9 (cites supabase.com/pricing, read 8 Nov by `ops`) |
| Family-months that fit in 1 GB | 1,000 / 19.2 = about 52 (about 53 at 1,024 MB) | arithmetic |
| 50 active families | fill 1 GB in about 1 month | arithmetic |
| 300 active families | 300 x 19.2 = about 5.76 GB a month of new storage | arithmetic (r3 CFO) |
| Restore of one year of originals | about 230 MB per new phone | 06-nfr 2.5 row "1-year export" |
| New-phone restores that fit in 5 GB egress a month | 5,000 / 230 = about 21 | arithmetic |
| CFO case | 1,000 free families x 20 held drafts: size per held draft is [A] until the note sets it (held drafts back up when backup is on, F14-REQ-039) | r1 NS-08 item 2 |

Conclusion for the founder (CFO role): a backup flip on the Free plan is not an option. Paid storage prices are not read in this session (UNVERIFIED); NS-08-R2 reads them with the date.

**The seventh flip condition (r3, CTO pass).** On the Free plan the nightly backup is a database dump; Storage buckets and files are not in it (`staging-backup-free.md` lines 31 to 32) and nothing else copies them. Before any flip, the founder decides how backup objects in `entry-audio` are themselves copied (a backup of the backup), or records that they are not and that the phone remains a second copy. Default: no flip until decided.

### 4. Happy path (for the later flip; recorded now so design and content can prepare)
1. A signed-in parent sees the backup consent sheet once, with the door lines below, and says yes.
2. They keep a spoken letter.
3. The recording is encrypted on the phone and uploaded in the background; the letter page's provenance line says where the recording is, truthfully, at each moment.
4. On a new phone, after sign-in, the letter's words appear first; its recording arrives and the page says so when it has.

Today (backup off): steps 1 to 4 do not exist. What exists and this card guards: the sign-out sheet (NS-08-R6) and the claims check (NS-08-R7).

### 5. Unhappy paths and edge cases

| Case | What happens | What the parent must be able to tell |
|---|---|---|
| No network for days (flip) | Uploads queue | The recording is on this phone and will be backed up later. No warning tone |
| Upload fails repeatedly (flip) | Retries with back-off | Same as above; nothing asks the parent to act unless they can act |
| New phone, recording not yet arrived (flip) | Words first, audio follows | The words are here; the recording is on its way. Never "kept on this phone" (NX-36-S17) |
| Recording never backed up from the old phone | No Play | The recording was only on the other phone, without blame |
| Parent signs out (today and flip) | Local sign-out; nothing deleted (D1) | What stays on the phone and who can read it, before they confirm (NS-08-R6) |
| Storage quota reached on our side (flip) | Capture and Keep still work; backup waits | The parent is not charged or blocked |
| Parent deletes the app (today) | Everything on the phone goes with it unless the phone's iCloud Backup holds it | Nothing in the app claimed otherwise (NS-08-R8) |
| Parent withdraws backup consent (flip) | Uploads stop at once; server copies deleted on the published clock (ruling D12) | Recordings stay on this phone |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | Today: nothing new. Flip: the consent sheet shows once, after the first kept spoken letter (PROPOSED), never during first run |
| Empty | n/a because a book with no recordings has nothing to back up; the sheet still explains |
| Many (1,000 letters, 300 pictures) | Flip: about 230 MB per year of originals; uploads in the background, one at a time (PROPOSED); pictures are never uploaded (NS-01, ADR 0028 D6 write-deny) |
| Offline | Today: n/a. Flip: queued, never blocks Keep |
| Slow | Flip: uploads continue in the background; the provenance line never claims "backed up" until the server confirms |
| Failed | Flip: retried; no blame line; after repeated failure, Storage in Me says the recording is on this phone only (PROPOSED) |
| Interrupted (call, Siri, alarm, the baby) | Flip: an upload resumes; the consent sheet keeps its place and records nothing until answered |
| App killed mid-flow | Flip: an upload restarts from the object key (entry id plus sha256), never a duplicate (NS-08-R13) |
| App updated mid-flow | Flip: queued uploads survive the update |
| Low storage (under 1 GB, under 50 MB) | Today: unchanged (06-nfr 11.3). Flip: an upload needs no extra local space beyond the encrypted temp file (PROPOSED: streamed); under 50 MB uploads pause |
| Low Power Mode and low battery | Flip: uploads defer to charging or Wi-Fi under Low Power Mode (PROPOSED) |
| Two books | Flip: one consent per account covers every book the parent authors in (PROPOSED; ADR 0024 keys are per child and author) |
| Two parents | Flip: each parent backs up only their own recordings; never another author's (NS-08-R11) |
| Expecting parent (due date only) | Same as any parent |
| Multilingual (Devanagari, RTL, CJK) | Provenance lines and the sheet are interface strings; RTL mirrors; no change to audio |
| AX5 plus Bold Text on SE 3 | The four provenance states wrap and never truncate; the sheet scrolls with its two choices visible at the end |
| VoiceOver | Each provenance state has its own spoken phrase (NS-08-R20) |
| Voice Control and Switch Control | The sheet's two choices are visible labelled buttons, reachable by item scanning |
| Reduce Motion | No upload animation; a static line |
| Dark mode and Increase Contrast | Provenance text uses text tokens, 4.5:1; no colour-only state |
| Plan lapsed | Backup kept and free (D-111 item 6) (NS-08-R17) |
| Signed out | Today: the book stays (D1). Flip: uploads stop; nothing more leaves the phone |
| Second account on the same phone | Never uploads A's recordings under B (NS-08-R11) |
| New phone | Today: words arrive, recordings do not (NS-10). Flip: recordings download after words |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-08-R1 | Given the backup client, server and escrow code on develop, When the read is done, Then one note lists each difference between code and `BACKUP_RUNBOOK.md` and ADR 0024, with file and line, or says there is none | P1 | `[NS-08-R1] backup read note` (the note, reviewed by `security-architect`) |
| NS-08-R2 | Given the recording format in ADR 0005 and 0027, Then the sizing note states bytes per minute; low, base and high recordings per family per month marked as assumptions; months until each storage choice on record is full; monthly and yearly cost per family per storage path with the price source and read date; restore egress per new phone against the Free plan's 5 GB; how many families fit in 1 GB; and the case of 1,000 free families with 20 held drafts each | P1 | `[NS-08-R2] sizing note` (reviewed by the CFO role) |
| NS-08-R3 | Given a scratch project, When the escrow drill is rehearsed, Then the run sheet records each step, what was seen, and what could not be run without production | P1 | `[NS-08-R3] escrow drill run sheet` |
| NS-08-R4 | Given the privacy label worksheet and the Privacy Policy draft, Then one page shows each answer and sentence that changes when backup turns on | P0 (b) | `[NS-08-R4] label and policy delta for counsel` |
| NS-08-R5 | Given any store profile in `eas.json`, Then `EXPO_PUBLIC_BACKUP` stays off until a founder decision turns it on | P0 (b) | `[NS-08-R5] backup off in store profiles` (existing preflight check) |
| NS-08-R6 | Given backup off, When a parent opens the sign-out sheet, Then it says the letters and recordings stay on this phone and anyone who opens the app here can read them (ruling D1), and after confirming, every recording file is still on the phone | P0 (a) | `[NS-08-R6] sign out never removes a recording` |
| NS-08-R7 | Given backup off, Then no line in the app, the store listing, the site or Save a copy implies a recording survives the loss of the phone; checked per store candidate against the claims inventory | P0 (a)(b) | `[NS-08-R7] no backup claim while backup is off` |
| NS-08-R8 | Given backup off, Then the existing keep-safe card (C-REQ-018 Rev) points to Save a copy (NS-11) and to iCloud Backup in one line, shown once, with no word from the fear list | P1 | `[NS-08-R8] the keep-safe line names the two real copies` |
| NS-08-R9 | Given the readiness pack, Then it answers the seventh flip condition: how `entry-audio` objects are copied off the Storage bucket, or a written record that they are not | P0 (a) | `[NS-08-R9] backup of the backup decided before a flip` |
| NS-08-R10 | (Flip build) Given a second phone on the same account, Then it downloads recordings and never re-uploads a duplicate | P0 (a) at flip | `[NS-08-R10] second phone downloads, never duplicates` |
| NS-08-R11 | (Flip build) Given account B signs in on a phone holding A's recordings, Then none of A's recordings upload under B | P0 (a)(b) at flip | `[NS-08-R11] second account never uploads the first's recordings` |
| NS-08-R12 | (Flip build) Given offline for 7 days, Then every queued recording uploads within 1 hour of the next connection on Wi-Fi (PROPOSED) | P1 | `[NS-08-R12] offline uploads drain` |
| NS-08-R13 | (Flip build) Given a lost server answer, Then a retry uses the same object key (entry id plus sha256) and the server holds one object | P0 (a) at flip | `[NS-08-R13] upload is idempotent` |
| NS-08-R14 | (Flip build) Given `killSwitches.backupUploads` turns on during an upload, Then uploads stop and no row points at a missing object | P0 (a) at flip | `[NS-08-R14] kill switch leaves no dangling row` |
| NS-08-R15 | (Flip build) Given sign-out during an upload, Then `signOutWouldWait` counts pending audio uploads as it counts letters | P1 | `[NS-08-R15] sign out waits for audio uploads` |
| NS-08-R16 | (Flip build) Given account deletion, Then every object for the account is purged and its escrow wrap deleted, within the published deletion clock | P0 (b) at flip | `[NS-08-R16] deletion purges objects and key` |
| NS-08-R17 | (Flip build) Given the plan lapses, Then backup continues, free | P0 (a) at flip | `[NS-08-R17] backup survives a lapse` |
| NS-08-R18 | (Flip build) Given the storage quota is reached on our side, Then capture and Keep still work and no charge or block is shown | P0 (c) at flip | `[NS-08-R18] quota never blocks a letter` |
| NS-08-R19 | (Flip build) Given the parent stops backup, Then uploads stop at once and server copies are deleted on the published clock (ruling D12) | P0 (b) at flip | `[NS-08-R19] withdrawing consent deletes server copies` |
| NS-08-R20 | (Flip build) Given each of the four provenance states, Then it has its own text and its own VoiceOver phrase, wraps at AX5, and is never told by colour or icon alone | P1 | `[NS-08-R20] provenance states are spoken and wrap` |

### 8. Non-functional budgets
Inherits 06-nfr. Differences:
- Latency: today n/a (documents only). Flip: Keep is never slowed by backup; local save commit stays p95 200 ms (06-nfr).
- Memory: flip: an upload holds at most one recording in memory (PROPOSED: streamed).
- On-device storage: flip: no second persistent copy; one encrypted temp file at a time (PROPOSED).
- Battery: flip: uploads only when not in Low Power Mode, or on charge (PROPOSED).
- Offline: today n/a; flip: queues.
- Accessibility: 06-nfr defaults; provenance lines per NS-08-R20.
- Localisation: provenance lines and the sheet are interface strings, English only until a language ships.
- Privacy (log canary): no file path, entry id or byte count tied to an entry in logs; the log canary covers the upload path at the flip.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Second phone | Downloads; never re-uploads | `[NS-08-R10]` |
| Second account on the same phone | Never uploads A's under B | `[NS-08-R11]` |
| Offline | Queued | `[NS-08-R12]` |
| Retry after a lost answer | Idempotent object key | `[NS-08-R13]` |
| Sign out | Today: nothing deleted (D1). Flip: waits for pending uploads | `[NS-08-R6]`, `[NS-08-R15]` |
| Account deletion | Objects purged; escrow wrap deleted | `[NS-08-R16]` |
| Kill switch: `serverFeaturesEnabled()` off | No upload, no download; local book unchanged | `[NS-08-R14]` |
| Card's remote pause: `killSwitches.backupUploads`, `killSwitches.escrow` (existing, `packages/api/src/remote-config.ts`) | Stops uploads or escrow use; can only stop, never start | `[NS-08-R14]` |
| Plan lapse | Backup kept, free | `[NS-08-R17]` |
| Quota reached | Capture and Keep unaffected | `[NS-08-R18]` |

### 10. Data and engineering
- Fields: none today. Flip: ADR 0024 objects and keys (per child and author key, device key per install and account, recovery-key access log); bucket `entry-audio` (packet section 0 item 6).
- Classes: recordings L4; escrow wraps L4; device ids L3 (DATA_CLASSIFICATION 1.1, UNVERIFIED for the new tables until ADR 0024 lists them).
- Migrations: none today. Flip: the backup server migration (PR #151 per ADR 0024) with its grants and a `supabase/tests/grants.mjs` line.
- Sync field group: none (objects, not columns).
- Export: no schema change; recordings already export from the phone.
- Modules: `apps/mobile/src/lib/backup/`, `apps/mobile/modules/scribe-keys/`, `supabase/functions/escrow/` (read only, for R1).
- Flags: `EXPO_PUBLIC_BACKUP` (off in every store profile). Remote: `killSwitches.backupUploads`, `killSwitches.escrow`.
- Error codes: none new now.
- Rollout and rollback: no rollout. At the flip, rollback is `killSwitches.backupUploads` on, then a build with the flag off; server objects follow the deletion clock.

### 11. Data inventory
No new data now. At the flip (rows written by `privacy` with `data-architect` in the same PR in `docs/legal/data-policy.md` section 4 and `DATA_CLASSIFICATION.md`; data-policy 4.3 is stale and must first be brought to current facts, X2):

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| Encrypted recording object | L4 | `entry-audio` bucket | n/a (object) | Life of the letter; withdrawal deletes on the published clock | Letter delete, account deletion, withdrawal (D12) | Already exported from the phone | Never logged |
| Backup consent row (PRIV-R21) | L3 | server | n/a | Packet Q51 | Account deletion per policy | Yes, as a consent record | Never the text, only the hash |

### 12. Door lines (flip; written now)
- **Shown:** the backup consent sheet; the Privacy section 4 versioned link; the escrow sentence in D-102 wording ("we hold a key; each use is logged and emailed to you").
- **Records:** a PRIV-R21 row: document `backup_consent`, version, action, method, surface `backup_sheet`, times, app version and build, OS, platform, text language and text hash.
- **Never:** any upload before the yes; any claim that only the family's keys open it (D-102); any upload of another account's recordings.
- **Decline:** recordings stay on this phone; nothing uploads; export and deletion still work.
- **Withdraw:** Stop backup halts uploads at once and deletes server copies on the published 31/38/45-day clock (ruling D12; packet Q42(d), Q51).
- Today's sign-out sheet: Shown: the D1 line. Records: on the phone only; no PRIV-R21 row, because sign-out is an act, not an agreement. Never: deleting a recording. Decline: Cancel keeps the parent signed in.

### 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| Escrow key | Insider or a compromised founder account | Logged unwrap; 24/72 h hold; approval only from a device enrolled 7 days (D-108); email on use | R3 drill |
| Backup objects | Breach of the storage | Access-rule cells on `entry-audio` (packet Q42(b), Q28) | `audio_backup_escrow.test.mjs` |
| Recordings on a signed-out phone | Another person opens the app | D1 sheet line; Erase everything; App lock | `[NS-08-R6]`, `[X4-R1]` |
| Second account | B uploads A's recordings | ADR 0023 claim layers; NS-08-R11 | `[NS-08-R11]` |

### 14. Never
- No letter text, child name, picture or prompt is donated to Core Spotlight, `NSUserActivity` search, Siri suggestions or an App Intents entity (ruling D3).
- No field on this card becomes a letter's words, so ruling D2 has nothing to switch off here.
- No claim that a recording cannot be lost, or that only the family can open a backup.

### 15. Design inputs
None to build. Prepare four provenance states for the letter page: on this phone; on this phone and backed up; on its way to this phone; not on this phone. Largest text size first: at AX5 on an SE 3 each state is a full-width line that wraps. No lock, shield or "bank-level" imagery (VOICE.md). Motion: none. Dark mode: text tokens only. Smart Invert: n/a (no pictures). Components reused: the letter page's existing provenance row.

### 16. Content inputs
Four state lines (intent above); the D1 sign-out line; the keep-safe line of NS-08-R8. None may say or imply a recording cannot be lost. Banned: "backed up" (until true), "never lose", "safe in the cloud", "only you can restore", "free backup". Who approves: `content` writes, the founder approves; counsel reads any line about safety (packet Q43).

### 17. Legal, privacy and compliance inputs
Apple's App Privacy definition of "collect" would make Audio Data: Yes and linked once backup ships (per the exec record of 10 Nov; UNVERIFIED this session). Privacy Policy sentences on recordings must change first. A baby's voice on a parent's recording is the open children's-data edge (packet Q45). Other packet questions: Q42, Q54(a)(b), Q55, Q28, Q51 (key-unwrap log 12 against 24 months), Q11, Q39. Counsel must confirm each.

### 18. Label effect
**Label effect.** None now. At the flip: Audio Data yes and linked; Device ID if `backup_devices` exists (packet Q54). The label changes in the same build as the behaviour, never before.

### 19. Claims
Enables nothing new until the flip. Forbids "backed up", "never lose a recording", "safe in the cloud", "only you can restore" (D-102) and "free backup" (internal rule, T2). The NS-08-R7 check runs per store candidate.

### 20. Free or Plus
Free. Backup is never a Plus feature (D-111 item 6); ruling T2 applies. "Never a Plus feature" stays out of public copy until costed and read by counsel.

### 21. Measures with analytics off
- Source: tester round, fixed question: "Is iCloud Backup on for this iPhone? (yes / no / don't know)". Reported as x of n. It says how many families' voices live on one phone only.
- Source: the readiness notes themselves (R1 to R4, R9): done or not.

### 22. Dependencies and gates
Nothing to start the read. The read needs #622 merged. The flip needs: the six conditions of the 19 Nov exec record, the seventh condition (R9), the founder's decision, a `security-architect` read, counsel on the label and policy, and a production drill run by the founder with `ops`. Device rows follow ruling D13.

### 23. Open questions
- Which storage path. Owner: the founder. Default: none chosen; no flip.
- Who runs the production drill. Owner: the founder with `ops`. Default: the founder.
- Backup of the backup (R9). Owner: the founder with the CFO role. Default: no flip until answered.

---

## NS-09. Let it go always finishes (candidate N-07, rank 2)

### 1. Who and when
P1, a second after deciding a take was not worth keeping, or was something they did not want kept: a cough, a wrong start, a private moment.

### 2. Why
"Let it go" is a promise as much as "kept" is. Before the fix, if the app stopped midway through letting a take go, or the phone refused to remove the file, the take disappeared from view and its audio stayed on the phone; discarding while still recording had the same gap; Review did not notice when removal failed. The fix is merged (a let-go draft never leaves its recording on the phone). The Review line and one more row remain (backlog pointer, section 22). A parent who let something go believes it is gone. Evidence: [F] code defects since fixed.

### 3. What, and Not in scope
**What.** The launch sweep finishes any draft left `discarding`; Listen uses the same path as Review; Review tells the parent, once and calmly, when a recording could not be removed yet; Storage in Me names a stuck recording with Remove now; a let-go held draft that reached the server is purged there at once when the discard is acknowledged (ruling D7, after `sync` reports today's behaviour).
**Not in scope.** An Undo after Let it go (the confirmation says so). Recently deleted for drafts (a draft was never kept). Any change to deleting kept letters.

### 4. Happy path
1. The parent taps Let it go on Review or Listen.
2. A confirmation appears whose default is the safe choice (keep the take) and says plainly that this cannot be undone.
3. They confirm. The draft is marked `discarding`, the file is deleted, then the row.
4. If the draft had synced as a held draft, a discard op is queued; when the server acknowledges it, the server copy is purged at once (D7).
5. Nothing is shown except the return to where they were.

### 5. Unhappy paths and edge cases

| Case | What happens | What the parent sees |
|---|---|---|
| App is killed between mark and delete | Next launch finishes it in the background, without delaying the first frame | Nothing |
| File delete throws | The row stays marked; next launch retries; the failure counter for that draft goes up by 1 | One line in Review (intent: "That recording is still on this phone. We will finish removing it.") |
| File is already missing | The row is removed | Nothing |
| Delete keeps failing across 3 launches (PROPOSED) | Retries each launch; never surfaces the draft again as keepable | Storage in Me shows one line per stuck recording (intent: "One recording is still on this phone") and Remove now |
| Remove now fails again | Stays listed | The same line; no error word |
| Offline with a synced held draft | The discard op is queued; the draft stays hidden | Nothing |
| Server kill switch on | The discard stays queued locally; sent when on | Nothing |
| Signed out with a discard queued | Held for the same account; sent at its next sign-in; never sent under another account | Nothing |
| Account deletion with a discard queued | Deletion removes everything anyway | Nothing |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | The first let-go shows the confirmation; no tutorial |
| Empty | n/a because there is nothing to let go |
| Many (1,000 letters, 300 pictures) | The sweep touches only `discarding` drafts; with 50 of them it completes within 2 s off the UI thread (NS-09-R13) |
| Offline | Local delete completes; server discard queued (NS-09-R7) |
| Slow | Local delete never waits on the network |
| Failed | Row stays marked; Review line once; Storage after 3 launches |
| Interrupted (call, Siri, alarm, the baby) | If the app goes inactive after confirm, the delete still runs; if before confirm, nothing happens |
| App killed mid-flow | The launch sweep finishes it (NS-09-R1) |
| App updated mid-flow | The sweep runs at the first launch after the update (NS-09-R16) |
| Low storage (under 1 GB, under 50 MB) | A stuck file is the first item the low-storage card names (PROPOSED); a 30-minute take holds about 14.4 MB (0.48 MB/min) |
| Low Power Mode and low battery | No change; deletion is not deferred |
| Two books | Per draft; the book does not matter |
| Two parents | A parent can let go only their own draft; nothing reaches the other parent's phone because held drafts are author-only |
| Expecting parent (due date only) | Same |
| Multilingual (Devanagari, RTL, CJK) | The Review and Storage lines are interface strings; RTL mirrors |
| AX5 plus Bold Text on SE 3 | The Review line wraps under the transcript and never blocks leaving Review; Remove now stays 44 pt |
| VoiceOver | The Review line is announced after the screen settles (NS-09-R4b); the confirmation reads its consequence |
| Voice Control and Switch Control | Let it go, the confirmation choices and Remove now are visible labelled buttons |
| Reduce Motion | No animation on removal beyond the system's |
| Dark mode and Increase Contrast | The line uses the muted text token at 4.5:1 |
| Plan lapsed | n/a because letting go is never gated |
| Signed out | Local delete works; any queued server discard is held for the same account (NS-09-R12) |
| Second account on the same phone | A's queued discard is never sent under B (NS-09-R11) |
| New phone | A discard applied on the other phone removes the draft here at the next pull and launch (NS-09-R8) |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-09-R1 | Given one draft marked `discarding` with its file present, When the launch sweep runs, Then the file and the row are both gone | P0 (a) | `[NS-09-R1] the sweep finishes a discarding draft` |
| NS-09-R2 | Given a `discarding` draft whose delete throws, When the sweep runs, Then the row remains marked and no error reaches the screen | P0 (a) | `[NS-09-R2] a failed delete waits for the next launch` |
| NS-09-R3 | Given Discard on Listen and a delete that throws, Then the draft row remains, marked `discarding` | P0 (a) | `[NS-09-R3] Listen never removes a row whose file is still there` |
| NS-09-R4a | Given Let it go in Review and a delete that fails, Then the line is shown once for that take, on that Review visit | P0 (a) | `[NS-09-R4a] the line shows once per take` |
| NS-09-R4b | Given the line is shown, Then VoiceOver announces it after the screen settles | P0 (a) | `[NS-09-R4] Review says when a recording is not gone yet` |
| NS-09-R5 | Given 0 `discarding` drafts, Then the sweep adds under 5 ms to launch on an iPhone SE 3 (PROPOSED; device) | P1 | `[NS-09-R5] an empty sweep costs nothing` (BL-929 run sheet row) |
| NS-09-R6 | Given a delete that has failed on 3 launches, Then Storage in Me shows the line and Remove now, and Remove now retries once | P1 | `[NS-09-R6] a stuck recording is visible in Storage` |
| NS-09-R7 | Given a let-go of a synced held draft, Then the discard is queued and stays queued until the server acknowledges it | P0 (a) | `[NS-09-R7] the discard reaches the server` |
| NS-09-R8 | Given the discard is applied on a second phone, Then that phone holds neither the row nor the audio after its next launch | P0 (a) | `[NS-09-R8] let go follows to the other phone` (stand-in, then two phones) |
| NS-09-R9 | Given Let it go, Then a confirmation appears whose default is keep, VoiceOver reads its consequence, and it says the take cannot be brought back; no Undo exists after confirm | P0 (a) | `[NS-09-R9] the confirmation defaults to keep` |
| NS-09-R10 | Given `serverFeaturesEnabled()` off or `killSwitches.sync` on, When a synced held draft is let go, Then the local delete completes and the discard stays queued until sync is allowed | P0 (a) | `[NS-09-R10] kill switch queues the discard` |
| NS-09-R11 | Given A's discard is queued and A signs out, When B signs in, Then the discard is never sent under B's session and stays held for A | P0 (a)(b) | `[NS-09-R11] a discard is never sent as another account` |
| NS-09-R12 | Given sign-out with a discard queued, Then sign-out waits for discard ops as it waits for uploads (`signOutWouldWait`), or, if the parent signs out anyway, the op is held and sent at A's next sign-in | P0 (a) | `[NS-09-R12] sign out does not drop a discard` |
| NS-09-R13 | Given 50 `discarding` drafts, When the sweep runs, Then it completes within 2 s off the UI thread on an SE 3 (PROPOSED; device) | P1 | `[NS-09-R13] a large sweep stays off the first frame` |
| NS-09-R14 | Given the server acknowledges a discard of a held draft, Then the server holds no row and no words for it within the same request (ruling D7; after `sync` reports today's behaviour) | P0 (a)(b) | `[NS-09-R14] a let-go held draft is purged on the server` |
| NS-09-R15 | Given a failed delete, Then the failure count in settings key `discard.failures.<draft id>` persists across launches and is removed with the draft | P0 (a) | `[NS-09-R15] the failure count survives a relaunch` |
| NS-09-R16 | Given a draft in `discarding` when the app is updated, Then the sweep at the first launch after the update finishes it | P1 | `[NS-09-R16] the sweep runs after an update` |
| NS-09-R17 | Given any remote config value, Then no key pauses or delays the local delete | P1 | `[NS-09-R17] no remote switch stops a let-go` (source check) |

### 8. Non-functional budgets
- Latency: confirm to return under 300 ms p95 on SE 3 (06-nfr screen default); empty sweep under 5 ms (R5); 50-draft sweep within 2 s off the UI thread (R13). PROPOSED.
- Memory: no measurable change.
- On-device storage: frees the take's file; a stuck file is shown in Storage.
- Battery: under the measurable step.
- Offline: works; server discard queues.
- Accessibility: 06-nfr defaults; R4b, R9.
- Localisation: two interface strings; RTL mirrors.
- Privacy (log canary): no draft id, path or text in logs; the failure counter key holds a draft id on the phone only and is never logged.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Let go while offline | Discard queued; draft hidden | `[NS-09-R7]` |
| Retry after a lost answer | Retried until acknowledged; applying twice is harmless | `[NS-09-R7]` |
| Second phone, same author | Marked there; local audio removed at its next launch | `[NS-09-R8]` |
| Second account on the same phone | Never sent under B | `[NS-09-R11]` |
| Sign out | Waits, or holds for A | `[NS-09-R12]` |
| Account deletion | Deletion removes it anyway; nothing waits on the queue | existing deletion tests |
| Kill switch: `serverFeaturesEnabled()` off | Local delete completes; discard queued | `[NS-09-R10]` |
| Card's remote pause | None, on purpose: a deletion is never pausable | `[NS-09-R17]` |
| Plan lapse | n/a: never gated | none |
| Kill during the discard | Launch sweep | `[NS-09-R1]` |

### 10. Data and engineering
- Fields: existing draft state `discarding` (local drafts table, `apps/mobile/src/lib/store.ts`). New settings key `discard.failures.<draft id>` (integer), removed with the draft.
- Classes: the key holds a draft id, L3 (DATA_CLASSIFICATION rule 5 treats ids as L3); the count L2.
- Migrations: none local or server for the phone part. Server part of R14: if `sync` reports that a held draft's discard leaves a tombstone with words, a server migration purges words at acknowledgement (owner `sync` with `data-architect`; grants and `grants.mjs` if a function changes).
- Sync field group: none new; the existing held-draft discard op.
- Export: no effect.
- Modules: the launch sweep, Listen and Review discard paths, Storage in Me; BL-925 (Review line), BL-926.
- Flags: none. Remote pause: none (R17).
- Error codes: none shown to the parent.
- Rollout and rollback: ships on; rollback is a revert; no data migration to undo.

### 11. Data inventory

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| `discard.failures.<draft id>` | L3 (id), L2 (count) | Phone settings | No | Until the draft is gone | With the draft; Erase everything; account deletion | No | Never logged |

### 12. Door lines
- **Shown:** the existing confirmation (default keep), plus the Review line when removal fails.
- **Records:** the `discarding` mark and the outbox op, on the phone only; no PRIV-R21 row, because letting go is an act, not an agreement.
- **Never:** keep audio after a confirmed let-go beyond the retry; show the draft as keepable again; keep the server's words after acknowledgement (D7).
- **Decline:** Cancel keeps the take.

### 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| A let-go recording | Stays on the phone after the parent believes it is gone | Sweep, counter, Storage line | `[NS-09-R1]`, `[NS-09-R6]` |
| A let-go held draft on the server | Words kept after the parent let it go | Purge at acknowledgement (D7) | `[NS-09-R14]` |
| A queued discard | Sent under another account | Account-bound outbox | `[NS-09-R11]` |

### 14. Never
- No letter text, child name, picture or prompt is donated to system intelligence (ruling D3).
- Ruling D2: n/a because this card has no text field.
- No line says "failed", "error" or "deleted everywhere".

### 15. Design inputs
States: confirmation; Review line (inline, the app's small muted voice, never the letter's serif, no icon, no red; never blocks leaving Review); Storage row with Remove now. AX5 on SE 3: the line wraps; Remove now stays 44 pt. Motion: none added. Dark mode: tokens. Smart Invert: n/a. Components reused: the existing confirmation sheet and Storage list row.

### 16. Content inputs
The Review line key, the Storage line ("One recording is still on this phone", intent), "Remove now", the confirmation's "cannot be brought back" line. True, calm, no blame; banned: "failed", "error", "deleted everywhere", "instantly". `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
A deletion promise on the phone, on the server and on the parent's other phones. The fix changes no published sentence. The Review line is a claim and needs a claims inventory row. Server retention of a let-go held draft: packet Q51; ruling D7 sets "purged at once". Counsel must confirm.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Enables "Let it go removes the recording from this phone." Forbids "instantly deleted everywhere": the server and the other phone follow at their next sync.

### 20. Free or Plus
Free; never gated (T2).

### 21. Measures with analytics off
- Support inbox tally, category "something I let go came back" (content-free count). Target 0.
- Tester question: "Did anything you let go come back? (yes / no)". Reported as x of n.

### 22. Dependencies and gates
The let-go fix is merged. The Review line needs the founder's word approval. R14 needs `sync`'s report of today's server behaviour. Device rows follow ruling D13.

### 23. Open questions
- What the server does today with a let-go held draft. Owner: `sync`. Default: ruling D7 (purge at acknowledgement).
- The 3-launch threshold. Owner: CPO role. Default: 3.

---

## NS-10. A new phone: close the last gap (candidate C-02, rank 6)

### 1. Who and when
P1 or P2 on the first evening with a new phone, signing in and expecting their book.

### 2. Why
The app now waits on "Opening your book" while the account's book may be on its way, and no longer says a recording is kept on a phone that does not hold it. One hole remains: a returning account whose consent is outstanding (a Terms version changed, or the app was closed on the Terms sheet) sees the first-run promise step with Continue and no way to agree. For a parent that reads as "my book is gone". Evidence: [F] read in code (backlog pointer, section 22).

### 3. What, and Not in scope
**What.** Close that gap; prove the whole arrival on two phones; with backup off, explain once at Book level that recordings stay on the phone that made them.
**Not in scope.** Moving recordings (NS-08). Syncing reminder settings (NS-13-R22). Merging two accounts.

### 4. Happy path
1. Sign in on the new phone.
2. The consent sheet appears if a version is outstanding.
3. "Opening your book" holds for at most 10 seconds, then the Book shows the letters' words that have arrived.
4. With backup off, one Book-level line shows once at the top until dismissed (intent: "Your words are here. Recordings stay on the phone that made them."). Each letter's provenance row says "not on this phone"; no per-card warnings.

### 5. Unhappy paths and edge cases

| Case | What the parent sees |
|---|---|
| A second account on the same phone (B signs in on a phone that holds A's book) | B never sees A's letters, recordings or child name; never offered A's letters on a claim screen; the app offers B their own book or a new one |
| The parent declines the new Terms version | Nothing downloads to this phone and nothing uploads from it. The book stays on the server and the parent's other phone. Delete account works from this phone without agreeing. Export works for what is on this phone; if nothing is, the screen says the book is on the other phone |
| Consent outstanding at relaunch | The consent sheet again, or a held screen with Finish setup and Try another way. Never the child step |
| No network | The held screen says the book needs a connection once, with Try again. No empty book |
| The account truly has no book | "No book here yet" once, with Start a book once |
| Wrong account (another sign-in method, for example Hide My Email on one phone) | A plain route to sign out and try another way; the screen names the method used (intent: "You signed in with {method}"), never the full email on a shared screen |
| Restore from an iCloud device backup, then sign-in | Each letter appears once, matched by entry id |
| Old and new phones both active | Both receive the book; a letter made on either reaches the other |
| Account deleted on the other phone while this one waits | The held screen ends with a plain line |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | This is a first use on this phone for an existing account; never the child step |
| Empty | "No book here yet" once |
| Many (1,000 letters, 300 pictures) | At 10 s, the Book shows what has arrived with one line that more are on the way (R2); pictures never arrive (phone-only, NS-01) and their letters show without them |
| Offline | Held screen with Try again |
| Slow | Book list and children visible p95 10 s; one year of text p95 30 s on LTE (06-nfr lines 140 to 141) |
| Failed | Held screen with Try again; no empty book |
| Interrupted (call, Siri, alarm, the baby) | The pull resumes from its watermark on return |
| App killed mid-flow | The pull resumes from the watermark at relaunch; consent sheet again if not answered |
| App updated mid-flow | Same as killed |
| Low storage (under 1 GB, under 50 MB) | Text is small; under 50 MB the existing storage card shows and the pull continues for text (PROPOSED) |
| Low Power Mode and low battery | No change |
| Two books | Both arrive; the last active book opens |
| Two parents | Each parent's phone pulls the books they are members of |
| Expecting parent (due date only) | Same; Before You arrives |
| Multilingual (Devanagari, RTL, CJK) | Words arrive as stored; RTL letters keep `base_direction` |
| AX5 plus Bold Text on SE 3 | Held screen actions stack, 44 pt; the Book-level line wraps |
| VoiceOver | Held screen reads its line then two actions; the Book-level line is read once |
| Voice Control and Switch Control | Finish setup, Try another way, Try again are visible labelled buttons |
| Reduce Motion | The "Opening your book" indicator is static |
| Dark mode and Increase Contrast | Tokens; 4.5:1 |
| Plan lapsed | Every letter arrives and reads (NS-10-R10) |
| Signed out | n/a because this card begins at sign-in |
| Second account on the same phone | NS-10-R3, R5 |
| New phone | This card |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-10-R0 | Given a returning account with no book on this phone and a consent still to give, When the app is opened, Then the consent sheet or a held screen with two ways forward is shown within 10 seconds, and the first-run child step is never shown | P0 (a) | `[NS-10-R0] a returning account never meets the child step` |
| NS-10-R1 | Given two iPhones and one account with 5 or more letters, When the second phone signs in, Then every letter's words appear and no page says a recording is kept on that phone | P0 (a) | `[NS-10-R1] two phones, one book` (device row S1-204) |
| NS-10-R2 | Given 10 seconds pass and the book is still arriving (for example 1,000 letters on a slow network), Then the Book shows the letters that have arrived with one line that more are on their way; it is never empty and never shows the child step | P1 | `[NS-10-R2] a slow arrival shows what has come` |
| NS-10-R3 | Given account A's book on the phone, When account B signs in, Then no letter, recording or child name of A's is shown to B | P0 (a)(b) | `[NS-10-R3] a second account never sees the first` |
| NS-10-R4 | Withdrawn 20 Nov: split into R4a and R4b (r2 NS-10 M1) | n/a | n/a |
| NS-10-R4a | Given a returning parent declines the new Terms, Then Delete account works from this phone without agreeing | P0 (b) | `[NS-10-R4a] deletion works without agreeing` |
| NS-10-R4b | Given a returning parent declines the new Terms, Then export is reachable for what is on this phone, and with nothing on the phone the screen says the book is on the other phone | P0 (b) | `[NS-10-R4b] export reachable after declining` |
| NS-10-R5 | Given A signed out on this phone, When B signs in, Then B is never offered A's letters on a claim screen and none of A's letters upload under B (ADR 0023 claim layers; ruling D1) | P0 (a)(b) | `[NS-10-R5] a second account never claims the first's letters` |
| NS-10-R6 | Given a device restore holding letters L1 to Ln and a sign-in pulling the same ids, Then each letter appears once | P0 (a) | `[NS-10-R6] restore plus sign-in never duplicates` (two-phone device row) |
| NS-10-R7 | Given a lost answer during acceptance, Then the server holds one acceptance row (idempotent on document, version and client time) | P1 | `[NS-10-R7] one acceptance row after a retry` |
| NS-10-R8 | Given `serverFeaturesEnabled()` off at sign-in, Then the phone shows its local book only and never the held screen | P0 (a) | `[NS-10-R8] kill switch at sign-in shows the local book` |
| NS-10-R9 | Given the account is deleted on the other phone while this one waits, Then the held screen ends with a plain line and no error code | P1 | `[NS-10-R9] deletion elsewhere ends the wait` |
| NS-10-R10 | Given the plan has lapsed, Then every letter arrives and opens | P0 (a) | `[NS-10-R10] a lapsed plan still brings the book` |
| NS-10-R11 | Given the `sync_books` answer is lost, When the phone retries, Then the books appear once and the wait does not restart from zero | P1 | `[NS-10-R11] retry after a lost books answer` |
| NS-10-R12 | Given the Wrong account route, Then the screen names the sign-in method used and never shows a full email address | P1 | `[NS-10-R12] wrong account names the method` |
| NS-10-R13 | Given backup off and a new phone, Then the Book shows one line at the top, once, until dismissed, and no per-card warning | P1 | `[NS-10-R13] one book-level line for absent recordings` |
| NS-10-R14 | Given old and new phones both active, When a letter is made on either, Then it appears on the other within 30 s p95 in the foreground (06-nfr freshness) | P1 | `[NS-10-R14] both phones keep receiving` (device) |

CL/K ruling K15 (`GAP-LOG.md`): a phone whose account was deleted elsewhere (R9) and a suspended account are two states with two lines, and a claim after deletion is parent-driven, never done by staff; the full rule is carried in `19-from-download-to-first-letter.md` after NS-45-R18.

### 8. Non-functional budgets
- Latency: consent or held screen within 10 s (R0); book list and children p95 10 s; one year of text p95 30 s on LTE; five years p95 60 s (06-nfr; five-year figure per r1, UNVERIFIED line).
- Memory: inherits.
- On-device storage: text only; no recordings arrive with backup off.
- Battery: inherits.
- Offline: held screen; works offline only for what is already on the phone.
- Accessibility: R0 screens stack at AX5; 44 pt.
- Localisation: existing keys.
- Privacy (log canary): no email, name or entry id in logs during arrival.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Second phone | Both receive the book | `[NS-10-R1]`, `[NS-10-R14]` |
| Second account on the same phone | Never sees or claims A's | `[NS-10-R3]`, `[NS-10-R5]` |
| Offline | Held screen with Try again | `[NS-10-R2]` |
| Retry after a lost answer | One acceptance row; books once | `[NS-10-R7]`, `[NS-10-R11]` |
| Sign out | Book stays on the phone (D1) | `[X4-R1]` |
| Account deletion | Elsewhere: wait ends plainly; here: works without agreeing | `[NS-10-R9]`, `[NS-10-R4a]` |
| Kill switch: `serverFeaturesEnabled()` off | Local book only | `[NS-10-R8]` |
| Card's remote pause: `killSwitches.sync` | Same as kill switch for pulls | `[NS-10-R8]` |
| Plan lapse | Everything arrives | `[NS-10-R10]` |

NEEDS EVIDENCE (`sync`, before design freeze): does `sync_pull` serve rows while a Terms version is outstanding? `can_write_content()` gates writes only (per r2). The answer becomes a row here.

### 10. Data and engineering
- Fields: none new. Existing acceptance rows (PRIV-R21), sync watermark.
- Migrations: none.
- Sync field group: none new.
- Export: no change.
- Modules: first-run route and gate logic (`lib/first-run/route.logic.ts`, `gate.logic.ts`), the held screen, the Book header line.
- Flags: none new. Remote pause: `killSwitches.sync`.
- Error codes: none shown.
- Rollout and rollback: ships on; revert.

### 11. Data inventory
New: the Book-level line's dismissed state, a settings key `newPhoneLine.dismissed` (PROPOSED name), L2, phone only, not synced, cleared by Erase everything and sign-out, not exported, never logged.

### 12. Door lines
- **Shown:** the existing consent sheet keys and versioned links.
- **Records:** a PRIV-R21 row with all fields, surface `returning_consent_sheet`, method `tap`.
- **Never:** no letter, name or recording of another account shown before sign-in completes or after a different account signs in.
- **Decline:** nothing downloads to this phone and nothing uploads from it; the book stays on the server and the other phone; Delete account works without agreeing (Apple 5.1.1(v), research note 1; PRIV-R09); export works for what is on this phone.

### 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| A's book on a shared phone | B reads or claims it | ADR 0023 claim layers; D1 | `[NS-10-R3]`, `[NS-10-R5]` |
| Consent record | Duplicate or missing on retry | Idempotent key | `[NS-10-R7]` |

### 14. Never
- Ruling D3 applies: nothing arriving is donated to system intelligence.
- Ruling D2: n/a because this card adds no text field.

### 15. Design inputs
States: held screen (two actions), declined, no network, no book, wrong account, Book-level line. AX5 on SE 3: the two actions stack and stay 44 pt. Motion: static indicator with Reduce Motion. Dark mode: tokens. Smart Invert: n/a. Components reused: held screen, Book header slip area.

### 16. Content inputs
Reuse existing keys; new: the Book-level line, the declined line, the method line. "No book here yet" must not read as loss. Banned: "lost", "missing", "everything moved". `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
Re-consent: packet Q44. Pre-account local use: Q19. Apple 5.1.1(v) account deletion inside the app (research note 1, read 20 Nov). Counsel must confirm.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Enables "Your letters follow you to a new phone when you sign in." Forbids "everything moves", "recordings move" and "nothing is ever lost" while backup is off.

### 20. Free or Plus
Free (T2).

### 21. Measures with analytics off
Tester questions for those who changed phones: "Did your book appear on the new phone? (yes / no)" and "Did anything look missing that you expected? (yes / no)". Reported as x of n.

### 22. Dependencies and gates
BL-922. Two-phone device rows (D13: test accounts holding only the Asha book). The `sync` answer on pulls during outstanding consent.

### 23. Open questions
- Pulls while consent is outstanding. Owner: `sync`. Default: no pull until agreed; the declined line stands.

---

## NS-11. Save a copy of the year (candidate C-03, rank 15)

### 1. Who and when
P1 in {child}'s birthday week, in a reflective mood, or any day they think "I should have this somewhere else". Also P6: the copy is what outlives the app.

### 2. Why
Export exists and is free (F15), and while our backup is off it is the one second copy the parent controls directly (the phone's iCloud backup also holds recordings when that is on, D-033). Almost nobody exports without a reason to [A; no evidence of our own]. A yearly moment the parent chooses turns a setting into a keepsake habit. It also tests, at no server cost, whether families want a second home for the voice.

### 3. What, and Not in scope
**What.** One row in Me for the existing export, named by `content` so Me never has two entries for the same file ("Take the book with you" or "Save a copy"), and one Home slip in the birthday week that leads to it. The copy is the existing export (schema 1.6.0 today; pictures as stored copies when NS-01 is on, NS-36). No notification. No new file format.
**Not in scope.** Automatic export. Any cloud of ours. A repeating reminder. Any line that mentions losing anything.

**Home slip order (ruled 20 Nov, Karma, council round 2).** Home shows at most one slip, in this fixed order: (1) the existing waiting cards in their existing order; (2) the seal-opened line on its day; (3) Save a copy in the birthday week; (4) one past letter (replacing "A month ago"). The reminder ask sheet and the Plus line are not slips. A registry test fails when an unregistered slip renders.

### 4. Happy path
1. In the birthday week, when no higher slip is due, the Home slip appears.
2. The parent taps it and lands on Save a copy, which says what the copy holds: every letter's words, every recording on this phone, every picture's stored copy when pictures are on, in open formats.
3. Progress shows within 500 ms; they choose where it goes with the system share sheet (Files, iCloud Drive, AirDrop).
4. The slip does not return this year.

### 5. Unhappy paths and edge cases

| Case | What the parent sees |
|---|---|
| The phone is short of space (needs the estimate plus 200 MB, F15-REQ-010) | The existing phone-is-full line; the export does not start half-made |
| Files or iCloud Drive full at the destination | The destination's own error; our screen stays; nothing is marked done |
| Some recordings are not on this phone (new phone) | The copy holds words for all, recordings for those here; no count of what is missing |
| The parent dismisses the slip | Gone for this year |
| The share sheet is cancelled | Back on Save a copy; nothing recorded as done |
| No birthday yet (expecting parent, P3) | No slip; the row in Me is always there |
| Two books, different birthdays in the same week | One slip at a time, the earlier birthday first |
| Twins with the same birthday | One slip naming both, leading to a chooser |
| 29 February birthday | In non-leap years the window starts 28 February (PROPOSED) |
| Time zone change across the birthday | Local date rules |
| A large book (1,000 letters, hours of audio) | Progress; leaving the app resumes or says it stopped; never a half-made file |
| Low Power Mode or battery under 20% | One line that a large copy may take a while; not blocked |
| A quieted or hidden book | No slip for it |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | No slip before the first birthday with a kept letter (PROPOSED: needs at least 1 kept letter) |
| Empty | The row in Me shows the existing `exportEmpty` behaviour; no slip |
| Many (1,000 letters, 300 pictures) | Progress; one year of originals (about 230 MB) offline under 2 min (06-nfr 2.5 gate); five years under 10 min, resumable |
| Offline | Works fully (on the phone) |
| Slow | Progress within 500 ms; screen kept awake only while exporting |
| Failed | Says it stopped; leaves no partial file where the parent chose |
| Interrupted (call, Siri, alarm, the baby) | Resumes on return, or says it stopped |
| App killed mid-flow | The temp ZIP is removed at next launch; nothing marked done |
| App updated mid-flow | Same as killed |
| Low storage (under 1 GB, under 50 MB) | Disk check needs the estimate plus 200 MB; otherwise the phone-is-full line |
| Low Power Mode and low battery | One calm line; not blocked |
| Two books | Per book; twins one slip with chooser |
| Two parents | Each parent's copy holds what their phone holds; the slip is per phone |
| Expecting parent (due date only) | No slip; row always there |
| Multilingual (Devanagari, RTL, CJK) | File names use the book name as typed, made filesystem-safe (PROPOSED); words exported as stored |
| AX5 plus Bold Text on SE 3 | The sentence wraps; the action stays visible without scrolling (device) |
| VoiceOver | Progress announced at start and finish; the slip reads as one element |
| Voice Control and Switch Control | Slip and action are labelled buttons |
| Reduce Motion | Static progress |
| Dark mode and Increase Contrast | Tokens; 4.5:1 |
| Plan lapsed | Works (M1; NS-11-R12) |
| Signed out | Works on what is on the phone |
| Second account on the same phone | B never sees A's slip (NS-11-R22) |
| New phone | Words for all; recordings for those here |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-11-R1 | Given Me, Then exactly one row leads to the export, reachable in 2 taps from the tab | P1 | `[NS-11-R1] Save a copy is two taps from Me` |
| NS-11-R2 | Given a child with a birth date, When today is within 7 days after the birthday (PROPOSED window), Then Home shows the slip at most once per year per book | P1 | `[NS-11-R2] the slip shows once a year` |
| NS-11-R3 | Given the slip is dismissed or the copy is saved, Then the slip does not show again until the next birthday | P1 | `[NS-11-R3] dismissed means gone for the year` |
| NS-11-R4 | Given another Home slip is due, Then exactly one slip shows, in the ruled order: waiting cards, seal-opened line, Save a copy, one past letter | P1 | `[NS-11-R4] one slip at a time` |
| NS-11-R5 | Given the screen and the slip, Then no string contains a count of letters, a gap, or a word from the fear list | P0 (a) | `[NS-11-R5] no counts or fear` (content rules test) |
| NS-11-R6a | Given the two entry points, Then both call the same export function | P1 | `[NS-11-R6a] one export code path` |
| NS-11-R6b | Given two exports of the same book a minute apart, Then their manifests are equal apart from `generated_at` | P1 | `[NS-11-R6b] same export apart from its time` |
| NS-11-R7 | Given a child with only a due date, Then no slip is shown | P1 | `[NS-11-R7] no slip before a birth date` |
| NS-11-R8 | Given a quieted or hidden book, Then no slip is shown for it | P0 (a) | `[NS-11-R8] a quiet book gets no slip` |
| NS-11-R9 | Given 1,000 letters, Then the export shows progress and, when interrupted, resumes or reports that it stopped; no partial file is left where the parent chose | P1 | `[NS-11-R9] a big export is never half-made` (device) |
| NS-11-R10 | Given pictures are on (NS-01), Then the copy holds every stored picture copy of the book | P0 (a) | `[NS-11-R10] the copy holds every picture` |
| NS-11-R11 | Given the export file name, Then it contains the child's name only if the parent named the book, and never an email, account id or device name | P1 | `[NS-11-R11] file name carries no account data` |
| NS-11-R12 | Given a lapsed plan, Then the export runs in full | P0 (a) | `[NS-11-R12] export works after a lapse` |
| NS-11-R13 | Given a 29 February birthday in a non-leap year, Then the window starts 28 February | P2 | `[NS-11-R13] leap-day birthday` |
| NS-11-R14 | Given two books with the same birthday, Then one slip names both and leads to a chooser | P2 | `[NS-11-R14] twins get one slip` |
| NS-11-R15 | Given two birthdays in the same week, Then one slip shows at a time, the earlier birthday first | P2 | `[NS-11-R15] two birthdays, one at a time` |
| NS-11-R16 | Given the destination refuses the file, Then Save a copy stays open and nothing is marked done | P1 | `[NS-11-R16] a full destination marks nothing done` |
| NS-11-R17 | Given Low Power Mode or battery under 20%, Then one line says a large copy may take a while and the export is not blocked | P2 | `[NS-11-R17] low power never blocks a copy` |
| NS-11-R18 | Given the year-1 fixture (about 230 MB originals) in airplane mode on an SE 3, Then the export completes in under 2 minutes | P1 | `[NS-11-R18] one year exports in two minutes` (device; 06-nfr gate) |
| NS-11-R19 | Given an export, Then the screen is kept awake only while it runs | P1 | `[NS-11-R19] awake only while exporting` |
| NS-11-R20 | Given free space under the estimate plus 200 MB, Then the export does not start and the phone-is-full line shows | P1 | `[NS-11-R20] disk check before export` |
| NS-11-R21 | Given the parent is signed out, Then the export runs on what is on the phone | P1 | `[NS-11-R21] signed out export` |
| NS-11-R22 | Given A's slip state and B signs in on the same phone, Then B never sees A's slip | P1 | `[NS-11-R22] slip state belongs to one account` |
| NS-11-R23 | Given the share sheet completes or is cancelled, Then the temporary ZIP is deleted; any left after a kill is deleted at next launch | P0 (a) | `[NS-11-R23] no temp copy left behind` |
| NS-11-R24 | Given Save a copy is tapped, Then progress shows within 500 ms | P1 | `[NS-11-R24] progress within half a second` |

### 8. Non-functional budgets
- Latency: progress within 500 ms; 1 year under 2 min (gate); 5 years under 10 min, resumable.
- Memory: streamed ZIP (existing export); no new peak.
- On-device storage: temporary ZIP equal to the export size, deleted at completion (R23); disk check estimate plus 200 MB.
- Battery: screen awake only while exporting.
- Offline: works.
- Accessibility: action visible at AX5 on SE 3 without scrolling; progress announced.
- Localisation: two lines and a button; book names in any script in the file name (filesystem-safe).
- Privacy (log canary): no file name, child name or path in logs.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Second phone | Slip state per phone, not synced (CPrivO default: collect less) | none |
| Second account on the same phone | B never sees A's slip | `[NS-11-R22]` |
| Offline | Works | `[NS-11-R18]` |
| Retry after a lost answer | n/a: no server call | none |
| Sign out | Export works on the phone's content | `[NS-11-R21]` |
| Account deletion | Slip state cleared with the book | existing erase tests |
| Kill switch: `serverFeaturesEnabled()` off | No effect (local) | none |
| Card's remote pause | None for export (a right, never paused); the slip itself hides when `EXPO_PUBLIC_SAVE_A_COPY` is off | none |
| Plan lapse | Works | `[NS-11-R12]` |

### 10. Data and engineering
- Fields: new settings key `copySlip.<child id>.<year>` with values shown and dismissed or saved (r3).
- Classes: child id L3; year and state L2.
- Migrations: none.
- Sync field group: none.
- Export: no schema change; NS-11-R10 depends on BL-933 (pictures in export 1.7.0, NS-36) when pictures are on.
- Modules: the existing export (`apps/mobile/src/lib/export/`), Me row, Home slip registry.
- Flags: `EXPO_PUBLIC_SAVE_A_COPY` (PROPOSED name). Remote pause: none for export.
- Error codes: existing export errors; no new ones shown.
- Rollout and rollback: flag off hides the slip; the Me row stays.

### 11. Data inventory

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| `copySlip.<child id>.<year>` | L3 (id), L2 (state) | Phone settings | No | Until the book is deleted | Book delete; Erase everything; sign-out | No | Never logged |
| Temporary export ZIP | L4 | App temp directory | No | Until the share sheet ends | Sheet end; next launch sweep | n/a | Path never logged |

### 12. Door lines
- **Shown:** what the copy holds, plus "as private as where you put it" (intent).
- **Records:** on the phone only; no PRIV-R21 row, because this is a setting (the slip state).
- **Never:** we never learn the destination; nothing goes to our cloud; no count.
- **Decline:** dismiss.

### 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| The exported book | Left in temp storage | R23 | `[NS-11-R23]` |
| The file name | Leaks account data | R11 | `[NS-11-R11]` |

### 14. Never
- Ruling D3 applies to the copy: nothing in it is donated to system intelligence by us.
- Ruling D2: n/a because this card has no text field.

### 15. Design inputs
States: slip; Save a copy screen (one sentence, one primary action in the bottom third, at least 56 pt); progress; stopped; twins chooser. At AX5 on SE 3 the sentence wraps and the action stays visible without scrolling (device). No celebration, confetti or badge. Smart Invert: n/a. Components reused: the existing Home slip component and the export screen.

### 16. Content inputs
Two lines and one button; the low-power line; the twins chooser title. Tone: a keepsake ("a copy of the year, yours to keep"), never protection. Existing keys to match: `exportNudge` and `exportEmpty`. `{child}` only. Banned: "backup", "in case you lose your phone", "protect your memories", any count. `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
The copy leaves the phone only by the parent's own act through the system sheet; we receive nothing. It contains a child's name and the family's words, so the screen says the copy is as private as where they put it (intent). Whether that sentence needs a counsel read: packet Q43 if it uses a safety word. Counsel must confirm.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Enables "Save a copy of the year, in open formats, yours to keep." Forbids "backup", "in case you lose your phone" (fear), "protect your memories".

### 20. Free or Plus
Free; export is never gated (M1; T2).

### 21. Measures with analytics off
Tester questions: "Did you save a copy this year? (yes / no)", "Where did it go? (Files / iCloud Drive / somewhere else)", "Was this your first copy ever? (yes / no)". Reported as x of n.

### 22. Dependencies and gates
BL-942 (build). NS-11-R10 needs BL-933 when pictures are on. The Home slip registry test. Founder approves words. Device rows follow D13.

### 23. Open questions
- Window: 7 days after the birthday, or the week around it. Owner: CPO role. Default: 7 days after.
- A first copy before any birthday. Owner: CPO role. Default: no slip; Me row only.

---

## NS-12. Earlier versions of my own words (candidate C-04, rank 34)

### 1. Who and when
P1 who edited a letter in Review last month and wants the earlier wording back.

### 2. Why
The server already keeps earlier versions (`entry_versions`, `20260930000000_scribe_core.sql:155`, author-only select policy `entry_versions_author_select` at line 271), and the phone has no reader for them. Value is modest: every machine fix can already be put back, and the words as heard are one tap away. This is for the parent's own edits only. Evidence: [F] table exists; [A] demand.

### 3. What, and Not in scope
**What (when taken up).** On the letter page, for the author only, a list of that letter's earlier versions by date; tapping one shows it; one action restores it as the current words; the author may remove an earlier version (ruling D8). The screen says plainly that earlier versions are kept until removed. The raw transcript is untouched and stays immutable.
**Not in scope.** Versions of the other parent's letters. Removing the raw transcript. Comparing versions word by word. Any machine re-run on restore.

### 4. Happy path
1. The author opens their letter and the "This letter" list (NS-21) shows "Earlier versions" when there are 2 or more.
2. The list shows at most the last 20, newest first, by date only; "Show all" reaches older ones.
3. Tapping one shows its words read-only.
4. Restore makes those words the current words as a new version; nothing is deleted.
5. Remove on a version deletes it on the server within one sync and from the phone.

### 5. Unhappy paths and edge cases

| Case | What happens |
|---|---|
| No earlier version | The row is absent, not disabled |
| Offline | Versions already on the phone, or none; restore and remove queue |
| The other parent's letter | Never shown |
| Restore on phone A while phone B edits | Words conflict rules apply (compare and set, `WORDS_GROUP`); the conflict copy goes to `data/other-versions.json` as today |
| Remove the version that is current | Not offered (only earlier versions) |
| Kill switch on | The list shows what is on the phone; restore and remove queue |

### 6. Scenario coverage

| Scenario | Behaviour |
|---|---|
| First use | Row absent until a second version exists |
| Empty | Row absent |
| Many (1,000 letters, 300 pictures) | Versions load per letter on open, never for the whole book |
| Offline | Local only |
| Slow | List shows within 1 s p95 (PROPOSED) or a quiet loading line |
| Failed | A plain line; the current words unchanged |
| Interrupted (call, Siri, alarm, the baby) | A restore is one local write; on return the page shows the result |
| App killed mid-flow | Restore is atomic locally; the op resends |
| App updated mid-flow | Queued ops survive |
| Low storage (under 1 GB, under 50 MB) | Text only; no special case |
| Low Power Mode and low battery | No change |
| Two books | Per letter |
| Two parents | Author only |
| Expecting parent (due date only) | Same |
| Multilingual (Devanagari, RTL, CJK) | Versions render with the letter's `base_direction` |
| AX5 plus Bold Text on SE 3 | Dates wrap; actions 44 pt |
| VoiceOver | Each row reads its date; Restore and Remove read their consequence |
| Voice Control and Switch Control | Labelled buttons |
| Reduce Motion | No transition beyond the system's |
| Dark mode and Increase Contrast | Tokens |
| Plan lapsed | Works; free (NS-12-R5) |
| Signed out | Only versions already on the phone |
| Second account on the same phone | Never sees A's versions |
| New phone | Pulled on letter open from the server |

### 7. Acceptance criteria

| Id | Given, When, Then | Priority | Test title |
|---|---|---|---|
| NS-12-R1 | Given a letter with 2 or more versions and the reader is its author, Then the letter page offers the earlier versions, newest first, labelled by date only | P1 | `[NS-12-R1] earlier versions for the author` |
| NS-12-R2 | Given a restore, Then the restored words become a new version and no version is deleted | P0 (a) | `[NS-12-R2] restore adds a version` |
| NS-12-R3 | Given any version view or restore, Then `raw_transcript` is never changed and no machine edit is applied or re-run; stored `machine_edits` return as stored | P0 (a) | `[NS-12-R3] restore never re-runs the engine` |
| NS-12-R4 | Given the version list, Then at most the last 20 versions show, newest first (PROPOSED), and older ones are reachable through Show all | P2 | `[NS-12-R4] twenty versions then show all` |
| NS-12-R5 | Given any plan state, Then versions are free and never gated | P1 | `[NS-12-R5] versions are free` |
| NS-12-R6 | Given the author removes an earlier version, Then it is deleted on the server within one sync and from the phone, and the raw transcript remains (ruling D8) | P0 (a)(b) | `[NS-12-R6] removing a version deletes it` |
| NS-12-R7 | Given the versions screen, Then it says earlier versions are kept until removed | P0 (b) | `[NS-12-R7] the screen says versions are kept` |
| NS-12-R8 | Given a reader who is not the author, Then no version is fetched or shown | P0 (b) | `[NS-12-R8] never another author's versions` |

### 8. Non-functional budgets
- Latency: list within 1 s p95 on SE 3 on LTE (PROPOSED).
- Memory and storage: versions held only for the open letter (PROPOSED cache, cleared on leave).
- Battery: under the measurable step.
- Offline: what is on the phone; ops queue.
- Accessibility: 06-nfr defaults.
- Localisation: dates by `Intl.DateTimeFormat`.
- Privacy (log canary): no version text in logs.

### 9. State space (RR-5)

| Case | Expected | Test |
|---|---|---|
| Second phone | Restore on A while B edits: words conflict rules | to write with `sync` |
| Second account on the same phone | Never sees A's | `[NS-12-R8]` |
| Offline | Local; ops queue | to write |
| Retry after a lost answer | Restore and remove idempotent by version id | to write |
| Sign out | Cached versions cleared (PROPOSED) | to write |
| Account deletion | Versions purged with the letter | existing deletion tests |
| Kill switch: `serverFeaturesEnabled()` off | No fetch; ops queue | to write |
| Card's remote pause | `flags.versions` PROPOSED; can only hide | to write |
| Plan lapse | Works | `[NS-12-R5]` |
| Co-parent | Never sees them | `[NS-12-R8]` |

### 10. Data and engineering
- Fields: existing `entry_versions` (id, entry_id, final_text, in_book, created_at; `scribe_core.sql:155-161`).
- Classes: `final_text` versions L4 C; ids L3.
- Migrations: server: a new read RPC (for example `entry_versions_list`) and a remove RPC, each with its own grant in its own migration and a line in `supabase/tests/grants.mjs`; local: a cache table or none.
- Sync field group: none; versions are fetched, which changes the sync contract (`data-architect`).
- Export: `data/other-versions.json` carries conflict copies kept on the phone today (`export/schema.ts:39-45`), not the server's version history. Whether versions pulled to the phone are exported: decision for `data-architect` with `privacy`; default not exported until decided (an export bump follows the `export/schema.ts` header rules).
- Modules: letter page "This letter" list (NS-21).
- Flags: PROPOSED `EXPO_PUBLIC_EARLIER_VERSIONS`.
- Rollout and rollback: flag off hides the row; RPCs stay.

### 11. Data inventory

| Field | Class | Where | Synced | Retention clock | Deletion path | Export | Log exclusion |
|---|---|---|---|---|---|---|---|
| `entry_versions.final_text` (newly read on the phone) | L4 | Server; phone cache for the open letter | Fetched, author only | Life of the letter, or until removed (D8) | Remove; letter delete; account deletion | Default no | Never logged |

### 12. Door lines
- **Shown:** the versions list with the line that earlier versions are kept until removed.
- **Records:** on the phone and server only as data; no PRIV-R21 row, because this is not an agreement.
- **Never:** another author's versions; a re-run of the engine.
- **Decline:** n/a (nothing to agree to).

### 13. Threats

| Asset | Threat | Control | Test |
|---|---|---|---|
| Earlier words (may hold a health detail or a name the parent removed) | Read by another member | Author-only RLS and RPC | `[NS-12-R8]` plus SQL test |

### 14. Never
- Ruling D3: no version text is donated to system intelligence.
- Ruling D2: n/a because versions are read-only; Restore copies stored words.

### 15. Design inputs
One row in the "This letter" list (NS-21); a read-only version view; Restore and Remove. Words: dates, never "original" for an edited version. AX5 on SE 3: rows wrap. Smart Invert: n/a.

### 16. Content inputs
"Earlier versions", the kept-until-removed line, Restore, Remove (intent). No judgment words. `content` writes; the founder approves.

### 17. Legal, privacy and compliance inputs
Retention of removed words: packet Q51; health detail: Q32; whether a deletion right reaches part of a letter: Q48. Ruling D8 sets the default. Counsel must confirm.

### 18. Label effect
**Label effect.** None.

### 19. Claims
Enables nothing until built. Forbids "full history", "undo anything forever".

### 20. Free or Plus
Free (T2).

### 21. Measures with analytics off
Tester question once built: "Did you ever bring back an earlier version? (yes / no)". x of n.

### 22. Dependencies and gates
NS-21. The RPCs with grants. Counsel Q51, Q32, Q48. Size L.

### 23. Open questions
- Export of versions. Owner: `data-architect` with `privacy`. Default: not exported.
