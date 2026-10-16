# ADR 0024: Owner backup v1.0: a key per (child, author), a device key per install and account, and the recovery-key access log

Status: **Proposed** (draft for the coordinator, PRD V2 `08-delivery.md` T13; decided at T15 or the spec default stands). Date: 2026-10-15. Owner: S05 (encrypted recording backup).
Amends: ADR 0006 (decision items 1 to 4). Implements: D-073, D-102 (recoverable keys through server escrow, honest copy), D-104 item 2 (free backup, default awaiting the founder).
Spec: PRD V2 F08 section 6.5 (key model, object format, server objects, A to G), F08 section 12 (WP-F08-B2 to B5c), F17 Storage and backup row.
Code (client half, PR `feat/backup-client`): `apps/mobile/modules/scribe-keys/`, `apps/mobile/src/lib/backup/`, `apps/mobile/src/app/settings/backup.tsx`, `packages/content/src/features/backup.en.ts`. Server half: PR #151 (`feat/backup-server`: `supabase/migrations/<ts>_backup_server.sql` and `supabase/functions/escrow/`); the client's wire to it is `lib/backup/wire.ts`, checked by `test/backup-wire.test.ts`. Contracts: S07's `packages/api/src/server/recovery-key.ts` (PR #138).

Number (as of 16 Oct 2026):
- 0018 to 0022 are on `develop`.
- 0023 is used on `feat/auth-v1-gate` (email links, PKCE); 0025 on the sync branches (sync protocol v1).
- This ADR has been 0024 since 15 Oct, when it was free on every branch. On 16 Oct `docs/release-automation-plan` (unmerged) also took 0024 for the release automation pipeline. The coordinator renumbers whichever merges second; 0026 is free today.

Evidence key as in ADR 0016: **V** verified, **V-code** read or tested in this repo, **U** unverified (a device or the server must confirm), **E** estimate.

## 1. Context

ADR 0006 (1 Oct) keyed backup by child: one Child Content Key per child, shared with family through `child_key_grants`. Two things changed:

- **Two parents per book in v1.0** (D-069, M14). With one key per child, the second parent cannot open the first parent's key, and creating their own collides with it in the Keychain and in escrow (R2 AR-05). v1.0 is owner-only: each parent backs up and restores only their own recordings; family listening is v1.1 (D-073).
- **Recoverable keys, honest copy** (D-102). We keep server escrow so a family that loses every device still gets its recordings back, and the copy says exactly that: encrypted, we hold a recovery key under strict, logged access, never read, sold or used to train models. No "only your family's keys" claim.

ADR 0006 also named `react-native-quick-crypto` for AES-GCM. D-065 keeps the app lean, and CryptoKit already does everything backup needs, so this ADR uses no third-party crypto.

## 2. Decision: keys

| Key or object | What | Where | Who can use it |
|---|---|---|---|
| File key | Random 256-bit, one per recording | Wrapped (AES-256-GCM) under the book key, in the object header and in `audio_blobs.wrapped_file_key` | A device holding that book key |
| Book key (BK) | Random 256-bit per (child, author, version) | One synchronizable Keychain item per (profile, child, version): service `scribe.backup`, account `<profile_id>:<child_id>:v<n>`, value the 32 raw bytes, `kSecAttrAccessibleWhenUnlocked` (every backup step runs in the foreground, so a locked phone never needs it). One item per version because iCloud resolves conflicts per item: a sync can never drop one version while another is written, and creating a version is one atomic add | The author's devices (iCloud Keychain) |
| Device key pair | X25519, one per (install, account), made the first time backup or restore runs for that account | Private key: Keychain service `scribe.backup.device`, account `<profile_id>`, the 32 raw bytes, the device id in `kSecAttrGeneric`, `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`, never synced, never in a device backup. Public key and the random device id in `backup_devices`, which #151 ties to one account: a second account on the same phone gets its own pair, and a pair the server calls revoked (`SCIMM revoked`) is replaced only after the person taps Try again | The escrow function seals released BKs to it |
| Escrow wrap of each BK | HPKE base mode (RFC 9180): DHKEM(X25519, HKDF-SHA256), HKDF-SHA256, AES-256-GCM, sealed **on the phone** to the escrow public key; format 1 = `0x01` || enc (32) || ciphertext and tag (48), 81 bytes | `child_keys.escrow_wrap` (`child_id`, `profile_id`, `key_version`), with `escrow_key_version` | Only the `escrow` function in the `scribe-escrow` project |
| Key check | HMAC-SHA256(BK, `"scribe/backup/key-check/v1|"` || profile|child|version), first 16 bytes | `child_keys.key_check` (#151: readable; sent as `p_key_check`) | Any device, to prove its local BK is the escrowed one, without the key |

Labels and associated data (`lib/backup/contract.ts`). They are byte for byte #151's `supabase/functions/escrow/hpke.ts`: a scratch run on 15 Oct (against #151 at 66d56a3) sealed with each side and opened with the other, including a release refused for another request id and a check-before-write refusal, and `test/backup-keys.test.ts` pins the bytes. The escrow function builds the same bytes from the row it loaded, so a wrap opens only as the row it was written for.

- Escrow seal: info = `"scribe/escrow/book-key/v1"`; aad = `"<profile>|<child>|<keyVersion>|<escrowKeyVersion>"` (lowercase).
- Release seal (escrow to device): info = `"scribe/escrow/release/v1"`; aad = `"<profile>|<device>|<requestId>|<child>|<keyVersion>"`. A release opens only on that device, for that request. The client opens it with the request id the route answered for, not the one it saved, since the route answers for the device's current request.
- Escrow wrap format 1 is exactly 81 bytes; any other length is refused.
- File key wrap: aad = `"scribe/backup/v1/file-key"` || entry id || author id || key version (binary). No child id, so a move rewraps 32 bytes.

Rules:

1. **Long-lived secrets stay native.** Book keys and the device private key never cross into JavaScript. The `ScribeKeys` module takes the Keychain service and account for every operation that needs them. JavaScript sees per-recording file keys (wiped after use, however a decrypt ends), wrapped keys and public keys only. **V-code** (`modules/scribe-keys/index.ts`). In Swift, the device private key is stored as its raw 32 bytes (no JSON or base64 copy), and the copies a call makes (the Keychain read, an opened book key) are cleared before it returns. That is best effort: `Data` and `SymmetricKey` may hold copies Swift does not let us wipe, and the file key crosses the bridge once per segment (about 230 calls per 15 MB), which is accepted. Items use the app's default access group; a later Keychain sharing group (a widget, an extension) must keep the app's own group first, or the app stops finding these items. `deleteBookKeys` deletes synchronizable items, so it removes them from every device on that Apple Account: only "delete the backup" (WP-F08-B5d) may call it, and it must say so.
2. **Never create a BK while the server holds one** (F08-REQ-028). A phone that sees an active `child_keys` row it cannot open waits up to 2 minutes for iCloud Keychain, then asks escrow. It makes a key only when the server has none for (child, me). A key made here whose store failed is stored again, never replaced. **V-code** (`test/backup-keys.test.ts`).
3. **The key check settles Keychain conflicts.** Two of a person's phones racing to make version 1: the server refuses the second (`SCIMM key_exists`). If an iCloud sync conflict then replaces the item with the losing key, the key check fails and that key is never used to encrypt or decrypt; the phone recovers the right one through escrow. **V-code**. #151 stores and returns the check, and the client sends and reads it. It also settles a store whose answer was lost: the retry seals again, the server refuses it (`key_exists`), and the check shows the escrowed key is this phone's own, so no escrow is asked. **V-code** ("a store that went through but whose answer was lost"). A row stored without a check (`key_check` null) is handled conservatively: a phone whose own store was refused marks its key untrusted and never uses it until escrow releases the escrowed one; any other local key of the row's version is trusted. **V-code** ("a row with no key check"). The check must stay readable and stored for every new key before T27.
4. **Escrow public keys ship in the app**, current and next version (`packages/api/src/escrow-keys.ts`, S07; WP-F08-B8 ceremony). With none bundled the app fails closed: backup cannot be turned on. Only a development-profile build (`APP_ENV === 'development'`: internal distribution, the `.dev` bundle id) may carry the drill-only key in `EXPO_PUBLIC_ESCROW_KEY`; preview, TestFlight (store-distributed, also `preview`) and production builds ignore it, and it never shadows a bundled version (`escrowKeysFor`, **V-code**). So a TestFlight alpha has backup only once the ceremony's keys are bundled. Request to the S05 server: give the drill pair a version production never lists (for example 9, the highest the escrow function reads), so the server refuses a drill wrap too.
5. **Keychain service name** is `scribe.backup`, not the `earlyletters.backup` that F08 6.5 and S07's `BOOK_KEY_KEYCHAIN_SERVICE` (#138) name. CLAUDE.md keeps the public name only in `packages/brand`, and a Keychain service must never change after the first item is written (renaming it orphans every key). The codename is permanent; the brand may not be. The escrow labels already use the codename for the same reason. This must be settled before the first item is written on a family's phone (T27).
6. **A release never replaces a good key.** A released key is written only for a version this phone lacks or cannot trust, and, when the row has a key check, only after the native module has checked the opened key against it (`ERR_SCRIBE_KEYS_CHECK` otherwise; nothing is written). A bad release can therefore never overwrite a good key here or, through iCloud Keychain, on the author's other devices. **V-code**.
7. **No rotation in v1.0.** The server refuses a second version, and the client never adopts a row above `MAX_KEY_VERSION` (1): it neither encrypts under it nor stores a release of it. A later rotation ADR raises both together. **V-code**.

## 3. Decision: the object

`apps/mobile/src/lib/backup/format.ts` is the one definition. Version 1:

```
object        = header (112, clear) || meta segment || data segments
header        = magic "SCRB" (4) | format 1 (1) | segment size u32 = 65536 (4) | entry id (16) | author id (16) | nonce prefix (7)
                | key version u32 (4) | wrapped file key (60 = nonce 12, ct 32, tag 16)
segment i     = AES-256-GCM(file key, nonce prefix || i u32 || last flag, plaintext, aad = first 48 header bytes)
segment 0     = SHA-256 of the original (32) || original length u64 (8); never last
segments 1..n = the original in 64 KiB pieces; n >= 1; only the final one has last flag 1
```

- Truncation, reordering, a changed header or trailing bytes fail (the STREAM construction). The original's hash is inside segment 0, never in clear. The server keeps only the ciphertext's SHA-256 for transfer checks. **V-code** (`test/backup-format.test.ts`).
- **Deterministic given (key block, nonce prefix, original).** The queue persists both after sealing, so a resumed upload whose ciphertext file is gone rebuilds byte-identical bytes and continues at the server's offset. A resumed upload never mixes two encryptions. **V-code**.
- Ciphertext is written to `Application Support/backup-tmp/`: excluded from device backup, complete-until-first-user-authentication protection, swept at launch. Decrypted bytes during a restore live only there too.

## 4. Decision: upload and restore

**Upload queue** (`queue.ts`; WP-F08-B5a): one job per recording, keyed by the letter's id (its draft id from capture to save), states `queued, sealed, begun, uploading, uploaded, confirmed` (and `blocked` for a file whose hash differs from capture; never uploaded). Each transition is one statement written after its work, and every state's step is safe to repeat. The Node suite kills the process at eight points (mid-encryption, before and after `backup_begin`, after the upload is created, mid-upload, after the last part, before and after `backup_confirm`), and twice in a row (mid-upload, then right after the relaunch asked for the offset), and relaunches. Every run ends with exactly one confirmed object that decrypts to the original. **V-code** (`test/backup-queue.test.ts`).

- Uploads use Supabase Storage's resumable (tus) endpoint, in 6 MiB parts, with the user's JWT (#151's `backup_begin` returns no upload token; SQL cannot mint one). Content type `application/octet-stream`; `x-upsert: true`, which #151's `backup_object_writable` allows only while the caller's `audio_blobs` row is `pending`. A confirm that finds no object (`P0002 object`) or another size (`22023 size`) sends the recording again from the start after a backoff; a letter erased on the server (`SCDEL purged`) is never sent. **V-code** (`test/backup-queue.test.ts`); **U** the tus path on a real Storage.
- Gates, checked before every step and between every segment and part: the person turned it on (consent act recorded first, F08-REQ-039); foreground only; never while recording, reviewing or playing; Wi-Fi unless Use mobile data is on; the remote kill switch `backupUploads`. `SCCON` or `SCQTA` pause the whole queue. No network, no sign-in, a full quota or a kill switch only make backup wait (F08-REQ-025).
- A recording uploads only once the server has its `entries` or `held_drafts` row (F08 6.5 A step 5). Held drafts are not listed in the app until S03's held-draft op (WP-F14-22) exists and passes `heldOnServer`, so a draft that cannot upload never waits in the queue as a recording.
- Wi-Fi is checked before every part, not once per recording: an upload that began on Wi-Fi stops at the next part when the phone leaves it, unless Use mobile data is on, and resumes from the saved offset (**V-code**).
- A recording refused `write_rpc.maxAttempts` (8) times in a row rests until the next launch. While a backoff runs, the app wakes the queue when it ends, in the foreground only.
- After a server restore, a recording this phone believes confirmed but the server no longer lists goes again (F08-U30).

**Restore** (`restore.ts`; WP-F08-B5b): after sign-in, for each of my confirmed blobs:

1. No local letter with that id yet: wait for sync. Someone else's or a deleted letter: skip.
2. A local file is there: **never overwritten**. If it matches the letter's hash, it is the recording; if it differs, it is kept and flagged (F08-U02).
3. Otherwise download, then check the ciphertext hash, the header (this entry, this author, the row's key version), every segment, and the original's hash against the decrypted file and against the letter's own hash when this phone has one. A failure is discarded and tried once more, then left "not on this phone" (F08-U20).
4. Point the letter at its final path, then move the file there. A kill between the two leaves a letter whose file is missing, which the next run repairs. The other order would leave a stray file the launch sweep turns into a draft. The move never replaces a file.

**One pass at a time, and a clean stop** (durability review of PR #150). **V-code** (`test/backup-restore.test.ts`, `test/backup-e2e.test.ts`, `test/backup-queue.test.ts`).
- The service runs one pass at a time: a tick while a pass runs joins it. Restore also holds one download per letter, and every temporary file has its own name (`<entry>.<attempt>.dl`, `.restoring`), so two passes never share a file.
- Restore obeys the same busy gate as upload: never while recording, reviewing or playing.
- `stop()` (sign-out, or another account signing in) stops between segments and parts, waits for the running pass, and sweeps `backup-tmp/`; the old account's service stops before the new one starts. The kill switch `backupUploads` is a gate: the next step waits.
- If the final move loses (a file appeared at the path meanwhile), the letter's hash that restore filled is cleared again, so the letter never claims a recording it does not have. After a move the file is hashed once more.
- The server's blob list is read in pages of 500, ordered by creation time.
- A Storage 400, 401 or 403 on an upload (an expired token, a policy refusal) sends the job back to begin again, not into a loop.
- A recording whose hash is briefly unknown keeps its job. A server list that comes back empty resets nothing unless the reset is forced.
- Settings never says "Backed up" while any recording of mine is not: anything still open reads "Backup will carry on later" (retrying, waiting for its letter's text to sync, or for its key); recordings that can never be sent (changed since capture, too long, not my book) read "Some recordings stay on this phone and are not in the backup"; consent withdrawn reads Off with the turn-on sheet; a quota pause is lifted once per launch so one `backup_begin` asks again. **V-code** (`test/backup-e2e.test.ts`).

Keys for restore come from iCloud Keychain when it brings them within 2 minutes, otherwise from escrow (section 5). A phone that has every recording but no key (iCloud Keychain off) asks escrow from the upload side too, and shows the hold ("New recordings back up from {date}"). A restore request that was stopped (Not me, the Stop link, Stop in Settings) is never asked again on its own; only Try again asks once more.

**A release is used once** (security re-review of PR #150). Every release opens the keys again, writes `escrow_unwraps` rows and emails the owner (#151 re-opens a released request for 24 hours). So the phone saves the released keys in `backup.db` before using them (they are sealed to this device's key: ciphertext only), retries storing from that copy after a failure, and never asks escrow to release again on its own. A release that can never be stored here (it fails its row's key check, or does not open) stops; only Try again asks once more. **V-code** ("escrow releases once, one log row, one email").

## 5. Decision: who can use the recovery key, and how each use is logged (D-102, M16)

This is the access-log design the founder asked for. It restates F08 6.5 C and G as the proposal; F08 6.5 G stays the one custody description.

**Who can unwrap.** Only the `escrow` function, deployed alone in its own Supabase project (`scribe-escrow`), holds the escrow private key (`ESCROW_PRIVATE_KEY_V<n>`). It reaches the main database only as `escrow_svc`, a login role with no table grants and `EXECUTE` on four security-definer functions (`escrow_open_request`, `escrow_load_wraps`, `escrow_record_unwrap`, `escrow_set_request_state`). No main-project function, no staff tool and no client can open a book key. The release check fails a release when any `ESCROW_` secret or `escrow` function exists in the main project, when the escrow project holds anything else, or when a deployed function differs from the repo.

**How.** A `restore_requests` row per new device: the user JWT must be under 10 minutes old and the device registered. The hold is 72 hours when another enrolled device exists (unless it approves), 24 hours when none does. The release re-checks state, revocation and pending deletion, and seals each book key to the requesting device's public key; plaintext key bytes exist only in that function's memory. Limits: 3 new-device restores per account per rolling 30 days, 20 opened keys per account per day (`SCRAT`, and the founder is paged). Off when `killSwitches.escrow`, the escrow project's own switch, or `capabilities.backup` is off.

**Every use logged.** One append-only `escrow_unwraps` row per opened key: profile, device, child, key version, reason (`restore`, `rotation`, `legal`), outcome, request id, time. No key bytes and no content. A trigger refuses `UPDATE` and `DELETE` for every role except the two named cases (pseudonymise at account deletion; the 24-month retention job). The daily purge-worker run copies the previous day's rows to `ops-ledger/escrow/<date>.jsonl`, outside database backups.

**The owner is told.** An email at request time with the Stop link, which is scanner-safe (only the button acts). A time-sensitive push with no ids to every enrolled device, and an approval sheet on its next foreground. An email for every opened key: each released restore, once per account per rotation, and each `legal` use unless an order forbids it. The email is the record we cannot edit afterwards.

**What the copy may claim, and the honest limit.** Provable: every use through the function writes a row and sends an email, and a daily copy sits outside backups. Not provable by any system: someone holding the escrow private key (the escrow project's secret, or a sealed paper copy) plus copies of the database and bucket could open recordings offline with no row and no email. The product copy therefore says only "We use it only through our recovery service, which logs every use and emails you each time" (`backup.sheetBody`). The Privacy Policy names the offline limit and who could do it. `test/backup-copy.test.ts` refuses "only your family", "only you can", "end-to-end" and any unscoped "every use is logged".

**Residual risk** (F08-U27c, 09 R-19): an attacker who controls the inbox while the owner's only phone is lost faces only the 24-hour hold. The owner can cancel from Settings on any signed-in phone during it.

**Residual risk: whoever can write `child_keys` or `backup_devices`.** The escrow public key ships in the app and the associated data is ids, so anyone who can write a `child_keys` row can seal a key of their own choosing that escrow will open, and compute its key check too; the key check catches accidents, not a forger. A phone that then restores through escrow would encrypt new recordings under that key. The same holds for a swapped device public key in `backup_devices` (escrow would seal to the attacker). Limits today: clients hold only `select` grants on these tables (#151) and only `security definer` functions write them, rows are immutable (`SCIMM`), every release is logged and emailed, a phone never adopts a version above 1 (rule 7), and a phone that holds a trusted key never replaces it (rule 6). What would close it: rows signed by a per-author identity key held in iCloud Keychain (a later ADR, with rotation).

## 6. Decision: the switch

`capabilities.backup` is its own build flag: `EXPO_PUBLIC_BACKUP=on` **and** server features on; off in every profile today (T23 merges the client with it off; T27 turns it on for C1 families who opt in). The only entry from the rest of the app is `lib/backup/gate.ts`, which imports nothing but the switch and requires the runtime only behind it. With the flag off, the JavaScript side never looks the native module up, no Keychain item is touched, the Settings row is not shown and the route redirects. `test/backup-gate.test.ts` checks the import graph and the runtime. The native module itself is a separate matter: Expo autolinking would compile and register `modules/scribe-keys` into every iOS build, flag or not, and it has never been compiled. So `apps/mobile/package.json` excludes it from autolinking (`expo.autolinking.exclude: ["scribe-keys"]`, one line, release configuration, a founder merge) until a Mac or macOS CI build compiles it; until then `ScribeKeys` is null and backup reports itself unavailable on every phone. The PR that first builds it removes that line and its test.

## 7. Consequences

- One small native module, `scribe-keys` (about 300 lines of Swift, CryptoKit and Security only). The binary cost is near zero: CryptoKit is a system framework (F08 section 9's "under 1 MB" budget holds; **U** until the IPA size check).
- HPKE needs iOS 17. D-098 (decided 15 Oct) makes iOS 17 the minimum; its follow-up sets the app's deployment target to 17.0. Until then the module builds for 16.4 and reports `isSupported() == false` below 17.
- The object format is implemented once, in TypeScript, over a 2-call native AEAD (seal and open one segment), so the Node suite exercises the exact bytes the phone writes. Cost: about 230 native calls per 15 MB recording. **U**: F08 section 9 budgets 1 s per 10 MB on the SE 3, measured in WP-F08-B1.
- The queue's state lives in its own `backup.db`, so S03's schema is unchanged. Every row can be rebuilt from the letters and `audio_blobs`. S03 may fold it into the main schema later (v11).
- Restore writes `entries.audio_uri`, `audio_sha256` and `audio_bytes` once for a letter that came by sync with none (`attachRestoredAudio`). That rule belongs beside `rebaseAudioUri` in S03's repository (request).

## 8. Alternatives rejected

| Option | Why not |
|---|---|
| One key per child (ADR 0006 as written) | Breaks with two parents (R2 AR-05) |
| `react-native-quick-crypto` | A heavy native dependency for what CryptoKit does; D-065 |
| Whole-file encryption in Swift | A second implementation of the format that Node tests cannot run; drift between the two would be found only on a phone |
| Password-derived keys | People forget passwords (ADR 0006) |
| No escrow (Vault mode) | Later (FUTURE T5-06); D-102 keeps escrow for v1.0 |
| Escrow key in a cloud KMS | Widens what the copy can claim, but it is a later ADR (F08 Q9); a separate project is the v1.0 default |
| Plaintext BK sent to the server for wrapping | The phone seals it; no server ever receives a plaintext BK |

## 9. Open for the coordinator and the founder

1. Accept the per-author key and the access-log design above (T15), or the F08 spec default stands, which this matches.
2. The Keychain service name `scribe.backup` (section 2 rule 5) in place of F08's `earlyletters.backup`.
3. Settled by #151, which follows S07's names (#138): `backup_register_device(p_device_id, p_public_key)`, `backup_store_key(..., p_wrap SealedBox, p_key_check)`, and two escrow routes (`restore-requests`, then `restore-requests/:id/release`, 410 `gone` when closed). The client follows #151 (`lib/backup/wire.ts`); argument names, granted columns and answer shapes are pinned in `test/backup-wire.test.ts` and were checked against the migration text. S07 still owns the reconciliation of `recovery-key.ts` (#151's requests to S07). Rechecked against #151 at `7a0f45d` (16 Oct): no phone-facing argument changed. Storage is the private Supabase Storage bucket `entry-audio` (20 MiB objects, `application/octet-stream`, path `{child}/{author}/{entry}.m4a.enc`), which `contract.ts` names. Opening a request now needs a live session: after a Stop, escrow answers 401 `unauthorized`, sqlstate `28000`, detail `session_ended` (#151 at `ad222eb`; S07 #138 at `feea25f` dropped the earlier `SCSES`). The client shows Sign in again. The main project's `SCSTP` (detail `step_up_required`: a sign-in in the last 10 minutes is needed) and `28000` get the same answer on the upload side: the queue stops with "Sign in again", counts no attempt and retries on the next pass, never through a silent token refresh (`needsSignIn` in `contract.ts`); only a device enrolled 7 days before the request may approve (D-108), which the approval sheet (not in this PR) must expect; a release repeated within a day opens the keys again, with its own log rows and email, and the client stores it as before.
3a. #151's eight deviations from F08 6.5, carried here for acceptance as the ADR 0006 amendment (#151 body, "Deviations"): (1) approval proves possession: a 256-bit code sealed to each enrolled device, not approval by device id; (2) seven narrow escrow functions, not four; (3) more than three escrow-project secrets (Resend key, main database CA, a rotation-only secret); (4) the function imports nothing outside its folder (own logger, Postgres client, HPKE over WebCrypto); (5) the step-up reads the newest `amr[].timestamp`, not `iat` (**U** on staging); (6) log outcomes `opened` and `failed`, written before release; (7) delete hooks as triggers, not edits to S02's functions; (8) the orphan sweep runs daily. None changes a byte the phone writes or opens.
4. Q2 (backup free or Plus): the client is built free for everyone (D-104 item 2). `packages/core/src/plan.ts` still lists `backup_upload` as gated, and nothing in the client calls that gate.
5. Q6 (counsel): its own `backup` consent act (built) or the sensitive-data act.
