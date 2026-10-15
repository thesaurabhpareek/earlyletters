# 06. Non-functional requirements

Status: Draft V2, 3 Oct 2026; reconciled on 13 Oct 2026 with D-073, D-068 and ADR 0014 to 0017, D-084, D-085 and the code on `develop`; revised after critique round 1 for M14 to M16 and R2 AR-03, AR-11, AR-14, AR-15, AR-26, AR-27, AR-30, R4 PT-07, PT-21, R5 EQ-17, EQ-20, EQ-30: freshness, kill-switch, crash-free and server budgets that can be measured and can pass. Revised 15 Oct 2026 after critique round 2 (R8 R2A-11 to -14, -16, -19, -21, -22, -27, -28; `reviews/DISPOSITION-R2-architecture.md`): a freshness gate that passes by arithmetic, a G4 session rule the calendar can meet, the save budget matched to the code, one position on the security test and the load test, a battery method the tools support, and the escrow key in its own project. Replaces `docs/prd/PRD.md` 1.3 section 7. Feature specs keep their own budgets in their section 9; this file holds the shared ones and the single list of gates. Where a feature budget and this file differ, this file wins until the feature spec is updated, and the difference is listed in section 17.

## 0. How to read this file

- **Reference device: iPhone SE (3rd gen)**, A15, 4 GB RAM [F] (R5 section 0 item 4), on the lowest supported iOS (iOS 17, D-040) and the latest. Every device budget is measured there unless a row says otherwise. A current-generation iPhone is the second checklist device (PRD 1.3 section 6). Android budgets return when F36 ships.
- **Gate** means a launch blocker: the release candidate does not go to App Store review until the row passes (07-quality-bar.md section 5). "No" means the row is measured and watched; a miss opens an issue but does not block.
- **Samples.** Device percentiles come from a release-candidate run of at least 200 samples per metric. A p99 is gated only where a run has 1,000 or more samples, so load tests can gate p99 and device runs gate p50, p90 or p95 (TDD 06 CR-8).
- **Where measured.** "Perf build" means the `perf` build profile with timing markers (TDD 01; TDD 06 section 7.2). That profile and the scripted relaunch loop do not exist yet: `apps/mobile/eas.json` has `development`, `preview`, `production` and `testflight` (R5 EQ-30). S20 adds the profile and S19 the marker harness; until both land, a "Perf build" row is measured by hand with Instruments on a release build, and it gates only if `07-quality-bar.md` lists it in the device budget for that release candidate. "Lab" means a scripted run on the reference device. "Client" means at the phone, US, good LTE.
- **Device run protocol** (R2 AR-30). Every timing, memory and battery row on a device uses one protocol: phone unplugged, brightness fixed at 50%, room temperature, `ProcessInfo.thermalState` nominal at the start, 2 minutes idle between runs. Report p90 of cold runs and, separately, p90 of the fifth back-to-back run. Battery method (R8 R2A-22): a scripted run of 20 letters (or the row's stated work) on the SE 3 under this protocol, phone at 100% and unplugged, with `UIDevice.batteryLevel` read before the first and after the last item (battery monitoring on); the budget is the drop divided by the number of items. The level may move in coarse steps [A: the step size is recorded in the first device run], so each row's run is long enough that its total budget is several steps (20 letters at 2% each is 40 points); a row whose total stays under three steps reports "under the measurable step" and passes. Instruments Energy Log and MetricKit are used to explain a miss, not as the gate number, because they report an impact level and daily aggregates rather than percent of battery.
- **Labels** follow `_AUTHORING.md` section 6: [F] fact with a source, [A] assumption with a validation route, [D] founder decision, [R] recommendation. A budget marked [A] is a target we set; the first device run either confirms it or the owner proposes a new number in a pull request that edits this file.

## 1. What changed from PRD 1.3 section 7

| Area | PRD 1.3 | V2 | Why |
|---|---|---|---|
| App download size | 80 MB or less, no gate column | **Under 40 MB, gate, every release build** | B13 |
| Export, 1 year | 230 MB in under 2 minutes, gate | Unchanged: listening copies are never exported (ADR 0015 section 5; F15-REQ-001 Rev) | F15 |
| On-device transcription, 2-minute letter | 30 s or less, 2% battery, **Unverified**, no gate | p90 30 s or less and 2% battery or less **per passed language**, gate, or a founder-recorded change | F05-REQ-040; R-02 |
| Transcription quality | none | Per-language corpus gates (WER or CER, names, script, phantom words, memory), gate per language | B4, DR-01, F05 section 7.1 |
| Engine fidelity | "every edit passes `verifyEdits`" | Plus the R-01 regression suite: zero accepted meaning changes per language, Node and Hermes, gate | 09 R-01; F06-REQ-019 |
| Kill during save | 500 iterations, zero loss | 500 Simulator plus 50 SE 3 iterations, zero loss; plus kill while recording (50 of 50 rows, 49 of 50 playable), typed kills (100) and Review kills (100 of 100) | F04-REQ-024, F04-REQ-011, F06-REQ-036 |
| Server classes | Included store notification processing, entitlement after store success, Storage upload start, server transcription gateway, escrow unwrap, notice scheduler | Removed: store notifications, server entitlement, transcription gateway. Storage upload start and escrow unwrap return with the owner's encrypted backup (D-073; F08 section 6.5; budgets in section 4). Added: `sync_push`, `sync_pull`, public config and manifests (ADR 0017 classes). Plus usable p95 2 s after Apple's sheet closes, measured on the device | B2, D-073, B15, F16 section 9, C-NFR-002 Rev |
| Error budget | Server 5xx under 0.1% per endpoint class per day | Under 0.1% per endpoint class over 28 days, judged only after 1,000 events | TDD 06 CR-7; F16 section 9 |
| Crash-free source | Consenting users plus TestFlight and App Store Connect | App Store Connect and Xcode Organizer are the gate source; Sentry only if F18 Q2 adds it (not in `apps/mobile/package.json` on 15 Oct) | TDD 06 P-7; R8 R2A-28 |
| Sync | Included web-page letters to pending (p95 60 s) and backed-up audio restore | Web-page letters move to v1.1 (F37). Restore of the owner's backed-up audio is v1.0 (D-073): 20 recordings in 10 minutes on Wi-Fi (F08-REQ-023) | B1, D-073 |
| Load targets | 2.2 members per family, audio uploads, store webhooks, notice emails | Replaced by F16 section 9: 1.5 accounts per family, no store webhooks, owner backup uploads with a first-enable burst, escrow, and the D-080 status report (F14 owns its number) | B1, B2, D-073, D-080 |
| Database size at 100k | About 150 GB | About 290 GB, or about 120 GB if `stt_meta` stays on the device | TDD 06 section 3.4; F16 Q3 |
| Speech model | 574 MB separate download | Same, plus per-language packs downloaded only for chosen languages; model and packs on a zero-egress host | B13, D-046 |
| New gates | none | Local playback start p95 300 ms; purchase data only as the allowlisted status report; zero plaintext audio bytes in any request (only the owner's ciphertext backup, when on); zero jetsam in 30 transcription runs; RTL letter rendering | F08 section 9, F14-REQ-014, F08-REQ-018, F05 section 9, F09-REQ-008 |

## 2. Performance and speed

### 2.1 Launch and navigation

| Metric | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Cold start to first interactive frame | p50 1.2 s, p90 2.0 s | Perf build: native process start to first `onLayout` of the first route, scripted relaunch loop, 200 samples | Yes | A-NFR-001 |
| Warm start | p50 400 ms | Same harness, background then foreground | Yes | A-NFR-001 |
| Work before the first frame | No awaited network, model load or sync; no import of PostHog, Sentry, whisper or crypto in `_layout` | Static import check in CI plus the airplane-mode cold start test | Yes | A-REQ-002, A-NFR-002, F01 section 9 |
| Screen transition (push, sheet, tab) | Starts within 100 ms of the tap; completes within 350 ms; no UI-thread frame over 16.7 ms | Instruments Animation Hitches on scripted navigation | Yes | A-NFR-003; TDD 09 section 8.2 |
| Gate answer to Welcome interactive | p95 300 ms | Perf build marker | Yes | F01 section 9 [A] |
| Declared Age Range call | 3 s timeout, then fall back to our own gate | Unit test with a fake that never answers | Yes | F01 section 9 |
| First-run screen interactive | 300 ms or less | Perf build marker | Yes | B-NFR-008 |
| First launch to first saved letter (gate, first run, a 15 s spoken letter) | Median 90 s or less over 10 scripted runs | Lab script on SE 3 | Yes | F03-REQ-008; 03 section 2 PS1 |
| Settings opens | Under 300 ms | Perf build marker | Yes | C-NFR-007 |
| Invite sheet opens | Under 300 ms | Perf build marker | Yes | F11 section 9 |
| Switch child (tap in the switcher to the other book interactive) | p95 300 ms, offline included | Perf build, year-5 fixture | Yes | PRD-REQ-012; F12 section 9 |

### 2.2 Capture, review and playback

| Metric | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Tap Speak to microphone live | p95 500 ms | Perf build: tap to first non-silent metering sample, 200 taps | Yes | F04-REQ-023 |
| Local save commit, 2-minute take (row plus a closed audio file whose size is read back plus its SHA-256) | p95 200 ms | Perf build marker around the transaction | Yes | DATA-REQ-048; F04 section 9. No fsync: `recorder.ts` on `develop` says expo-file-system has none and AVAudioRecorder closing the file hands it to the OS. The forced-reboot case in DL-01 (F04-REQ-048) is what proves survival; if it loses a file, F04 adds `F_FULLFSYNC` in the `ScribeAudio` module and this row gains it back (R8 R2A-19) |
| Finish to Review on screen, 2-minute take | p95 400 ms | Perf build marker | No | F04 section 9 [A] |
| Finalize a 30-minute take (about 14.4 MB) | p95 1.5 s | Perf build marker | No | F04 section 9 [A] |
| Typed autosave | Written 500 ms after the last keystroke; immediately on `inactive` or `background` | Unit test plus typed kill run | Yes | F04-REQ-011 |
| Not much today | Saved and toast visible within 100 ms of the tap | Component test | No | F04-REQ-016 |
| Clean and mark a 300-word transcript | p95 300 ms, Hermes release build | Perf marker from raw available to marks rendered | Yes | F06-REQ-041 |
| Clean a 4,000-word transcript (30-minute cap) | Raw text within 300 ms, marks within 1 s, no JS frame over 50 ms | Same | Yes | F06-REQ-041 |
| Add a name from Review to re-cleaned text | p95 150 ms for a 3-minute transcript | Perf marker | No | F07 section 9 [A] |
| Local playback start | p95 300 ms | Perf build, 200 samples | Yes | F08 section 9 [R] |
| Read together start to first audio | p95 500 ms, local file | Perf build | No | F10 section 9 |
| Read together page turn | Under 300 ms p95 | Perf build | No | F10 section 9 |

### 2.3 Book, prompts, account and Plus

| Metric | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Book chapter of 60 letters, first paint | p95 500 ms over 200 runs | Perf build, year-5 fixture | No | F09-REQ-011; PRD 1.3 7.1 |
| Book first render with 1,200 letters | p95 500 ms | Perf build | No | F09 section 9 |
| Prompt selection on Tonight with 2 years of history | Under 5 ms | Unit timing plus device spot check | Yes | F13 section 9 [A] |
| Reminder planner run (3 children, Every evening, 8 weeks) | Under 50 ms; schedule calls finish under 1 s | Unit timing plus device run | Yes | F13 section 9 [A] |
| Native Apple or Google sign-in, after the OS sheet closes | p90 3 s | Lab, 50 runs per provider | Yes | A-NFR-004 |
| Auth email delivered | p90 30 s | Lab, 50 sends | Yes | A-NFR-004 |
| Re-ownership of 1 year of local data (about 240 letters) | p95 500 ms | Perf build | Yes | F02 section 9 [A] |
| Plus sheet showing Apple's prices | Under 1 s with StoreKit's cache; 3 s fetch timeout, then the offline line | Sandbox run on SE 3 | Yes | C-NFR-007; F14 section 9 |
| Plus usable after Apple's purchase sheet closes | p95 2 s (48 or more of 50 sandbox purchases) | Sandbox run | Yes | C-NFR-002 Rev; F14 section 9 |
| Restore | 99% within 10 s, first launch on a new phone with no tap | Sandbox, second device | Yes | C-NFR-003; C-REQ-020 Rev |
| `planView()` and the Read together decision | Under 5 ms, synchronous | Unit timing | Yes | F14 section 9; F10 section 9 |

### 2.4 Transcription

| Metric | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Finish to text, 2-minute letter, each passed language | p90 30 s or less | 30 runs per passed language on SE 3 under the section 0 device protocol (cold p90 and fifth-run p90 both reported) | Yes, or a founder-recorded change | F05-REQ-040; PRD 1.3 7.7; R2 AR-30 |
| Peak app memory during a turbo job | 1.4 GB or less | Instruments; 30 runs | Yes (zero jetsam in 30 runs) | F05 section 9 (estimate) |
| Context release | 45 s after the last job; at once on background | Unit test plus Instruments | Yes | F05 section 9 |
| Gate-status read | Under 5 ms, offline (not built; F05 Q11) | Perf marker | No | F05-REQ-007 [A] |
| Model download, 574 MB on 50 Mbps Wi-Fi | About 95 s (arithmetic) | Lab | No | TDD 03 section 5.4 |
| Started downloads that complete within 24 h | 95% | Server aggregate is impossible (host logs only); device `model_download` events, consenting users | No | F05 section 9 [A] |

### 2.5 Export

| Metric | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| 1-year export, originals only (about 230 MB), offline | Under 2 minutes | Airplane mode, year-1 fixture on SE 3 | **Yes** | C-NFR-007 |
| 1-year export with listening copies (about 470 MB), offline | Under 4 minutes (same throughput as the gate) | Same, with copies on | **No (target)**. Becomes a gate if the founder accepts it in F15 Q1 | F15 section 9 [A]; F15 Q1 |
| 5-year export | Under 10 minutes, with progress, resumable | Year-5 fixture | No | TDD 06 section 7.2 [R] |
| PDF for 240 letters | Under 30 s | WP-F15-03 measurement | No | F15 section 9 [A] |
| Export peak memory | Under 150 MB | Instruments | No | F15 section 9 [A] |

[R] If WP-F15-01 shows the 4-minute target cannot hold on SE 3, the F15 Q1 fallback applies: listening copies are off by default in export, so the default export stays inside the 2-minute gate.

## 3. Server latency by endpoint class (B15)

Every endpoint in v1.0 meets all of B15: a p95 budget, an auth check, safe under retries, a rate limit, content-free logs, a request id, user JWTs only (no service key in the app), typed and versioned contracts in `packages/api` (new, WP-F16-01), one US region. Measured at the client, US, good LTE, in the G4 load run at the section 16 loads (p95 always; p99 only where 1,000 or more samples exist).

| Class | Endpoints in v1.0 | p95 | p99 | Auth | Retry safety | Rate limit | Gate | Source |
|---|---|---|---|---|---|---|---|---|
| Auth token exchange | `signInWithIdToken` (Apple, Google), `verifyOtp` (email link and code) | 1.5 s | 3 s | Provider token plus nonce | Single-use tokens | 5 emails per address per hour; resend after 60 s; 5 wrong codes in 15 min pause the device | Yes | PRD 1.3 7.2; A-REQ-025, A-REQ-027 |
| Sync push | `sync_push(p_ops)` (built), up to 50 ops, 256 KB | 800 ms | 2 s | User JWT, RLS (security invoker) | Op id receipts in `sync_op_receipts`, keyed by person and op (BL-331) | 60 per user per minute through `rate_hit` | Yes | F16 section 9 |
| Sync pull | `sync_pull(p_since, p_limit)` (built), up to 500 rows per call | 300 ms per page | 800 ms | User JWT; `require_user()`; others' rows only through `book_entries` and membership helpers (no `book_access` in v1.0, D-055; R2 AR-03) | Read | 120 per user per minute through `rate_hit` | Yes | F16 section 9 |
| Read RPC | `my_sync_gate`, `policy_actions_needed`, member list | 300 ms | 800 ms | User JWT | Read | 60 per user per hour | Yes | F16 section 9; PRD 1.3 7.2 |
| Write RPC | `create_child`, `create_first_run_children`, `create_child_invite`, `accept_child_invite`, `leave_child`, `undo_parent_join`, `delete_entry`, `restore_entry`, `record_policy_act` | 500 ms (`record_policy_act` 300 ms) | 1.2 s | User JWT | Client id, invite id or naturally idempotent | Invites 20 per parent and per book per day; deletes 120 per user per hour; children 20 per user per day | Yes | F16 section 9; F11 section 9; B-NFR-004; F02 section 9 |
| Edge Function, light | `invite-redeem`, `apple-token`, `push-send` (new, F11), `account-stop` (new, F02 and F08); `escrow` (new, F08) runs alone in the separate `scribe-escrow` project (F08 6.5 G2) | 600 ms | 1.5 s, cold start included | User JWT (`push-send` is service-only) | Invite id; token write is upsert; escrow per request id | Code entry 10 failures per device per hour, 1,000 per hour globally; escrow 3 new-device restores per account per 30 days and 20 opened keys per day (F08 6.5 C) | Yes | PRD 1.3 7.2; F11-REQ-007; F08-REQ-029 |
| Backup write RPC | `backup_begin`, `backup_confirm`, `backup_store_key` (new, F08) | 500 ms | 1.2 s | User JWT; caller is author and a parent of the book | Entry id | 600 `backup_begin` per account per hour; 5 GB per account | Yes for backup | F08 6.5 F; R2 AR-11 |
| Storage upload | Resumable upload of one backup object (at most 20 MB) to `entry-audio` | 2-minute letter on Wi-Fi in 10 s [A] | n/a | User JWT; insert policy needs a matching `pending` row | Resumes from the last part | Bucket object limit 20 MB | No | F08 section 9 |
| Status report write | D-080 report (F14 owns the endpoint) | 500 ms | 1.2 s | User JWT | Per (profile, subscription reference) | F14 | Yes | R2 AR-13, AR-15; F14 |
| Push send | `push-send` to APNs | 60 s from the letter reaching the server to the APNs request, p95 [A] | n/a | Service only | Collapse per author and book | One per author per book per 2 hours | No | F11 section 9 |
| Email batch | Reminder emails (F14), new-sign-in emails (F02, queued by the server when it first sees an Auth session, never by the client) and recovery-key emails (F08) through Resend | New-sign-in email within 2 minutes p95 of the session's first token [A]; reminder batch of 1,000 within 1 hour [A] | n/a | Service only | Per notice id | Resend plan limits | No | F02-REQ-017; F14 |
| Public config and manifests | Signed remote config (D-068, ADR 0016; D-035's table is superseded), content bundle, pack manifest | 300 ms | n/a | Publishable key only | Read; ETag and long cache | CDN | Yes | B14, B15; F16 section 9 |
| Model and pack files | Speech model, language packs | First byte 1 s [A] | n/a | None (public files, no user id, cookie or query string) | HTTP Range resume | Host limits | No | F05 section 7; D-046 |

**Error budget.** Under 0.1% server 5xx per class over a rolling 28 days, excluding 429 and client 4xx, judged only after 1,000 events; below that, every 5xx is read by hand (TDD 06 section 2.3). Auth success excluding cancels is 97% or more weekly per method, alert below 93% (A-NFR-013, F02-REQ-015). Budget more than 50% spent in 7 days stops feature work on that path until a fix ships (TDD 06 section 2.3 policy).

**Request ids.** The client sends a random UUIDv7 `x-request-id` on every call and keeps it in on-device diagnostics; Edge Functions log it. Whether the Supabase API gateway logs custom headers is Unverified (F16 Q5).

**Removed from 1.3 for v1.0:** store notification processing and entitlement-after-store-success (B2: no server sees purchases); the server transcription gateway (F35, v1.1). Storage upload, escrow, the status report, push and email are back for v1.0 (M14) and have rows in the table above (R2 AR-15).

## 4. Sync

| Metric | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Letter saved on one phone visible on the co-parent's phone, both in the foreground with the shared book open and online; clock from the save tap on phone A to the row rendered on phone B | p95 30 s, p99 60 s (Rev of PRD 7.3's p95 5 s, which polling cannot meet; R2 AR-14). Passable by construction: with a 15 s pull for shared books, the parts at their own p95 (debounce 2 s, push 0.8 s, wait 14.25 s, pull 0.3 s, apply 0.3 s) add to about 17.7 s (R8 R2A-11) | Two-client freshness probe in the G4 load run, 200 or more letters; two-phone script on device | Yes | F16-REQ-017; F16 6.2 C; F16 Q2 (Realtime in v1.1) |
| Same, other phone in the background | At its next foreground pull | Two-phone script | No | F16 6.2 C |
| Hide book, delete letter, take-out, leave reach every member device | Within one sync; p95 60 s online | Load-test probe; F16-REQ-009 | Yes | B-REQ-014; LEGAL-REQ-032 |
| New phone: book list and children visible after sign-in | p95 10 s | Lab, LTE | Yes | PRD 1.3 7.3; F11 section 9 |
| New phone: one year of text (about 240 letters) | p95 30 s on LTE | Lab, year-1 fixture | Yes | PRD 1.3 7.3 |
| New phone: five years of text (about 1,200 letters) | p95 60 s on LTE | Lab, year-5 fixture | No | TDD 06 section 3.2 [R] |
| Local apply of a 200-row page | Under 300 ms, off the UI thread | Perf build | No | F16 section 9 [A] |
| Sync never blocks capture, review, save or reading | Always | E2E with the server stubbed to hang | Yes | PRD 1.3 7.3 |
| Queued ops never dropped | 100% reach the server or `rejected_writes`; 99.9% within 5 minutes of connectivity | Load scenario S4; chaos suite (WP-F16-11) | Yes | DATA-REQ-043; TDD 06 section 2.2 |
| Data per active user per month | Under 5 MB | Network capture over a scripted month | No | F16 section 9 [A] |
| Kill switch `killSwitches.sync` | Honoured within 5 minutes on active clients; outbox kept | Staging drill per release, with F19-REQ-026's cache numbers | Yes | F16-REQ-018; LEGAL-REQ-040; R5 EQ-17 |
| Watermark stall | App roles keep the platform `statement_timeout` default and get `idle_in_transaction_session_timeout` 30 s; purge, rotation, retention and backfill jobs commit in batches under 1 s; alert when the oldest running transaction of any role is over 30 s | DB test with a held transaction; batch test on the purge worker; alert drill | Yes | F16-REQ-027; R2 AR-14; R8 R2A-23 |
| Word conflict between two devices of one author | Neither version lost; the author sees the note (built protocol is last writer wins today: P0 gap, WP-F16-14 and -15) | Two-phone conflict test | Yes | F16-REQ-010 |

## 5. Offline

**Works fully offline** once installed: the 18+ gate, welcome and first run; record, type, save and Not much today; transcription for any language whose model and pack are already on the phone and passed; Review; the book; playback of local recordings; Read together on local recordings (free, M2); export and the PDF; local reminders and plan notices; Settings that need no server; delete and restore of own letters (the server half queues). Sources: A-REQ-030, B-NFR-009, F04-REQ-018, F05-REQ-010, C-REQ-017, C-NFR-001 Rev, C-NFR-004 Rev.

**Before the model is ready** (574 MB, after first run, Wi-Fi by default, resumable; F03-REQ-005, F05-REQ-021, F05-REQ-022): typed letters work; spoken letters save the audio and get words once when the model verifies (F05-REQ-011). There is no server transcription in v1.0.

**Needs the network, with honest copy and nothing lost:** sign-in, invites and joins (queued visibly, B-NFR-009), pushing and pulling letters, purchases and restore, model and pack downloads, content blocks and remote config (the app runs on the last good copy, B14).

**Offline gates:**
- [Gate] Airplane-mode cold start renders the first route and hides the splash (A-REQ-002).
- [Gate] Airplane-mode first run to first saved typed letter (B-NFR-009).
- [Gate] Capture makes 0 network requests (F04 section 9; A-REQ-030).
- [Gate] A lapsed user offline exports a complete ZIP with no Plus UI (LEGAL-REQ-034, C-REQ-017).
- [Gate] Queued writes survive app kill and reboot; "Not sent yet" is visible on letter rows and in Settings > Sync (F16-REQ-016).

## 6. Stability

| Metric | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Crash signatures on the release candidate (G4) | Zero unresolved crash signatures across beta C1 and the device scripts, over at least 300 sessions on **RC-equivalent builds** [A]; every signature seen on an earlier build is fixed or explained in writing. A build is RC-equivalent when its native fingerprint equals the RC's [A: S20 picks the `expo-updates` runtime version or an `@expo/fingerprint` hash in WP-F16-19's CI job] and its JavaScript diff from the RC touches no file outside copy and content (`packages/content/**`, feature `copy.ts`). C1 families get the freeze build at T29, so sessions accrue from 14 Dec to the C1 exit on 7 Jan: 15 families at about 2 sessions a day (R8's own rate) for 24 days is about 720, or about 500 if the two holiday weeks run at half. Device-script sessions count too. A native change after T29 restarts the count at that build; if fewer than 300 have accrued by T34, the founder records the number and decides (Q8) | TestFlight crash reports, Xcode Organizer, device script logs, the fingerprint per build | Yes (G4) | R2 AR-26: a percentage cannot be read from a short beta of a few families (one crash in about 500 sessions moves it by 0.2 points); R8 R2A-12: the RC alone gets about 90 sessions between T33 and T35 |
| Crash-free sessions | 99.8% or more | App Store Connect and Xcode Organizer for the build (all users who share diagnostics) | Yes as the G5 post-release gate, read after 1,000 sessions; watched before that | PRD 1.3 7.5; TDD 06 P-7 |
| Crash-free users, 7 days | 99.5% or more | Same | G5, as above | PRD 1.3 7.5 |
| Jetsam (memory-limit) exits during transcription | 0 in 30 SE 3 runs per passed language; 0 per release in MetricKit exit reasons | Lab plus Organizer | Yes | F05 section 9; TDD 06 section 7.2 |
| Crash during sign-in losing a local letter or invite token | Zero | E2E with forced failures | Yes | A-NFR-013; F02 section 9 |
| Purchase error rate | Under 1% | Sandbox runs (50) | Yes | C-NFR-002 Rev |
| Auth success per method, excluding cancels | 97% or more weekly; alert below 93% | Server auth logs, counts only | No (operating SLO) | A-NFR-013; F02-REQ-015 |
| Unclean exits | Counted in on-device diagnostics | Local ring buffer, attached to a support request only by the user | No | TDD 06 section 5.1 |

If F18 Q2 adds Sentry (its default is no Sentry, and it is not in `apps/mobile/package.json` on 15 Oct), Sentry receives scrubbed crashes from consenting users only and is used for stack traces, never as the gate source (LEGAL-REQ-003; TDD 06 section 2.2; R8 R2A-28).

## 7. Durability

Durability is an invariant, not a budget. "Letters or recordings lost or silently changed: zero" is a gate and any confirmed case is a severity 1 incident (03 section 4.3; TDD 06 section 2.1).

| Check | Pass bar | Where | Gate | Source |
|---|---|---|---|---|
| Kill during save | 0 losses in 500 Simulator iterations plus 50 on SE 3; every iteration ends with an entry whose `audio_sha256` matches its file, or an intact draft with its file; 0 rows point at a missing file; `PRAGMA integrity_check` ok | `apps/mobile/e2e/capture/*` (new, WP-F04-11), BL-135 | Yes | DATA-REQ-048; F04 section 9 |
| Kill while recording | 50 of 50 takes keep a row; 0 files deleted; 49 or more of 50 play to within 5 s of the kill point (below 49, the founder decides on the ADTS fallback before beta C1) | WP-F04-11 on SE 3 | Yes | F04-REQ-024 |
| Typed kills | 100 iterations; at most the last 500 ms of typing lost in each | WP-F04-11 | Yes | F04-REQ-011 |
| Kills in Review | 100 of 100 reopen with the same text, edit states, locks, author edits, kind, date and child | WP-F06 kill run | Yes | F06-REQ-036 |
| Transcription kill and jetsam | Job returns to `queued` with its `partial`; no audio or draft lost | Device run | Yes | F05-REQ-014 |
| Original recording never altered | SHA-256 unchanged after listening copy, 10 plays, export and an app update; no code path opens an original for writing (lint) | Unit, lint, device | Yes | F08-REQ-002; B6 |
| Export originals byte-identical | Every `audio/<id>.m4a` SHA-256 equals the capture hash, or is flagged | Export test | Yes | F15-REQ-002; DATA-REQ-051 |
| Raw transcript immutable | `raw_transcript` update fails at the database; the local store refuses it | `npm run test:db`; unit | Yes | DATA-REQ-040; CLAUDE.md |
| Engine update never changes a saved letter | Saved `final_text` unchanged across `ENGINE_VERSION` bumps | Replay test | Yes | F06-REQ-022, F06-REQ-027 |
| Sync conflicts | Two devices editing one letter offline: neither version lost; the author sees the note | Chaos suite and the two-phone test (WP-F16-11); fails on today's code by design until WP-F16-14 and -15 merge | Yes | F16-REQ-010; DATA-REQ-043 Rev |
| Backup is never the only copy deleted without a prompt | Turning backup off or deleting the account with recordings only in backup shows the count and Bring them here first | Unit plus device | Yes for backup | F08-REQ-035; R2 AR-09 |
| Backup restore after a database restore | The restore drill includes one escrow restore end to end and the client's re-check of uploaded objects | BL-247 drill | Yes for backup | F08-REQ-031; R2 AR-07, AR-08 |
| Restore drill | In staging with synthetic Asha families: database restored to a scratch project, main-project function secrets set and Storage buckets copied, `escrow_svc` recreated and the drill escrow key used (the production escrow secret is never copied, F08 6.5 G5), every ledger kind replayed (F16 6.2 F step 2a), `sync_begin_epoch` called, two synthetic devices reconciled: zero own rows deleted locally; others' rows kept 30 days as waiting; a deleted account's backup, held-draft, push and status rows stay gone. A drill on production data deletes its scratch project within 24 hours and writes `ops.audit_log` rows for the restore and the deletion | BL-247, WP-F16-08; quarterly and before the first non-founder family | Yes | DATA-REQ-030, DATA-REQ-031; F16-REQ-012, F16-REQ-031; TDD 06 section 6.3; R8 R2A-16, R2A-17 |
| Durability drill (device) | iCloud device backup restored to a second phone brings back letters, recordings and the Recently deleted shelf with its dates; letters past day 30 are erased at first launch with no orphan reappearing; export ZIP re-read; when the owner's backup is on, sign-in on a new phone restores every recording with equal hashes | BL-284, DEVICE_TEST_PLAN DL-03 and DL-04, every release candidate | Yes | D-033; D-073; D-085; BL-284 |
| Server RPO and RTO | Postgres RPO 24 h (daily backup, PITR off at launch); RTO 4 h | Restore drill timing | Yes (drill) | DATA-REQ-030, DATA-REQ-031; TDD 06 section 6.1 |
| Integrity scrub | Hashes of audio and raw text checked after update and weekly; a mismatch is shown, never silently repaired | Unit plus device | Yes | DATA-REQ-046 |

**Audio durability at v1.0.** Recordings live on the author's phone in Documents, inside the iPhone's own backup (D-033); speech models, packs and listening copies are excluded from backup. D-073 and M16 add an encrypted backup of the owner's own recordings in v1.0, with a recovery key we use only through a rate-limited recovery service that logs every use and emails the owner (F08 section 6.5); it is not built. Erasing a backed-up letter or letting a backed-up held draft go removes its backup object by exact path (F08-REQ-024, F08-REQ-043). For an owner who has not turned it on, the keep-safe card points to export and the person's own device backup (C-REQ-018 Rev), and a lost phone without a device backup loses the recordings not exported (09 R-11).

## 8. Accessibility

Target: **WCAG 2.2 AA** on every app screen, the website, the deletion page, legal pages, the paywall content we control and HTML emails (LEGAL-REQ-051). Apple's own purchase controls follow Apple's accessibility (F14 section 9).

| Rule | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Dynamic Type | AX5 on every screen; text never truncates; buttons grow; rows stack. Letter text is never capped (no `maxFontSizeMultiplier` on letter text) | Component tests at default and AX5 (L2); XCUITest `performAccessibilityAudit()` at AX5; manual V4 | Yes | A-NFR-005, C-NFR-006, D-027 |
| VoiceOver | Every P0 flow completes with VoiceOver on, in the scripted order; focus moves to sheet titles; errors and saves announced; nothing announces over a playing voice | Manual script V1 on SE 3 (07-quality-bar.md section 2.11); component label tests | Yes | A-NFR-007; F10-REQ-017; F08-REQ-017 |
| Touch targets | 44 pt minimum, 56 pt primary, 64 pt capture; web 48 px | Component test reads layout | Yes | PRD 1.3 7.6; TDD 09 section 8.2 |
| Contrast | 4.5:1 body text; 3:1 large text, controls, focus rings and non-text; light, dark and Increase Contrast | `tokens.test.ts` | Yes | PRD 1.3 7.6 |
| Reduce Motion | Honoured everywhere; 200 ms fades; no loops in Low Power Mode | Manual V6; token test | Yes | PRD 1.3 7.6; TDD 09 section 8.2 |
| Time limits | None without a control (WCAG 2.2.1, 2.2.2); Undo windows never close while VoiceOver is reading | Manual V1 | Yes | A-NFR-006 |
| Voice Control and Switch Control | Each visible label works as a Voice Control command; everything operable by item scanning | Manual V2, V3 | Yes at submission (G4) | TDD 09 section 8.3 |
| Captions for audio | Every recording has its letter text beside it; a voice-only letter says it has no words yet | Component test | Yes | F08-REQ-017; TDD 09 section 2.11 |
| Automated audit | Zero critical violations | XCUITest audit (RC), axe for web pages | Yes | LEGAL-REQ-051 |
| Smallest text | 13 pt at default size | Token test plus lint | Yes | TDD 09 section 8.2 |

Cut order 5 (`05-feature-map.md` section 5) may move Increase Contrast variants to v1.1; AX5 and VoiceOver on P0 screens are never cut.

## 9. Localisation readiness and right to left

**What v1.0 ships [D]:** English app interface, ready for localisation (B4). Letters in seven spoken languages, each shown only after its gate passes (DR-01 A), and typed letters in any language and script (B5). Hindi letters in Devanagari by default (D-031 default), Arabic letters right to left, Mandarin in simplified characters with full-width punctuation (F05 section 7.7).

| Rule | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Mixed scripts in one chapter | English, Hindi, Arabic and Mandarin letters each render `final_text` byte for byte; Arabic paragraphs `writingDirection: 'rtl'` and right aligned; Devanagari in Tiro; zero missing-glyph boxes | Snapshot fixture plus glyph coverage test | Yes | F09-REQ-008 |
| Typed text in any script | Stored exactly as typed (after trimming ends); the system keyboard keeps its own autocorrect | Byte-equality test; manual Arabic keyboard check | Yes | F04-REQ-012, F04-REQ-013; B5 |
| PDF scripts | Each script in its font; Arabic right to left; no missing glyphs | Visual check of the fixture PDF | Yes | F15-REQ-006 |
| No hardcoded left to right | Names and letter text follow their own direction; new and touched code uses logical properties (`ps-`, `pe-`, `ms-`, `me-`, `text-start`) | Lint warning; RTL name test | Yes for letter text and names; lint is a warning | B-NFR-007; TDD 09 section 7.2 |
| Dates | Built with `Intl.DateTimeFormat` from the device locale | Unit test in `packages/core` | Yes | D-028; TDD 09 section 7.2 |
| Plurals | Counted strings carry CLDR plural forms through `Intl.PluralRules`; no `count === 1` logic | Content test checks every `{count}` string | Yes | TDD 09 section 7.2 |
| Strings | Every user-facing string in `packages/content` or a feature `copy.ts`; no sentences assembled in code; no `.toUpperCase()` on copy | Lint and content tests | Yes | TDD 09 section 7.1 L2 to L5 |
| Pseudo-locale run (accented, 35% longer) | No truncation | Not run in v1.0 | No | TDD 09 section 7.2 (premature for v1) |
| Full RTL interface | Not in v1.0 | n/a | No | F44 (later) |

## 10. Battery, memory and background

| Metric | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| Transcription battery, 2-minute letter | 2% or less, averaged over 20 or more letters | Section 0 battery method (20 letters) under the device protocol (R2 AR-30, R8 R2A-22) | Yes | F05-REQ-040; TDD 06 section 7.2 |
| Recording battery, 10-minute take | 2% or less | Section 0 battery method, 10 takes | No | F04 section 9 [A] |
| Listening copy battery | 0.5% or less per 10 audio minutes | Section 0 battery method, 10 runs | No | F08 section 9 [A] |
| Listening copy job, 2-minute letter | 10 s or less | WP-F08-01, 30 runs | Yes once measured | F08 section 9 [A] |
| Background work | None of our own except OS-granted sync time and local notifications; transcription is foreground only; no location, no polling | Code review; Energy Log | Yes | PRD 1.3 7.7; F05-REQ-013; F13 section 9 |
| Idle drain from the app | 1% per day or less | 24 h idle, section 0 battery method against a control day with the app removed; Energy Log to explain a miss | Yes | PRD 1.3 7.7 |
| Thermal | No transcription start at `critical`; pause between chunks at `serious`; 2 threads in Low Power Mode | Unit plus Instruments | Yes | F05-REQ-015 |
| Memory while recording | Under 40 MB above idle | Instruments, 10-minute take | No | F04 section 9 [A] |
| Idle memory after first run | Under 150 MB resident | Instruments | No | TDD 06 section 7.2 [R] |
| Book screen with 1,200 letters | Under 120 MB resident | Instruments | No | F09 section 9 [A] |
| Engine peak for a 4,000-word letter | Under 20 MB | Instruments | No | F06 section 9 [A] |
| Screen kept awake | Only while recording, playing in Read together or exporting; released on pause after 5 minutes | Device test | Yes | F04-REQ-005; F10-REQ-012; F15-REQ-014 |

## 11. Storage and download size (B13)

### 11.1 The 40 MB app

| Metric | Budget | How measured | Gate | Source |
|---|---|---|---|---|
| App Store download size, iPhone SE 3 | **Under 40 MB, every release build** | CI proxy check on the IPA from the EAS build on every build; App Store Connect per-device download size on every TestFlight build (report name to be confirmed, R4 section 6) | **Yes** | B13; F05-REQ-016 |
| What ships in the binary | Code, the English text-rules pack, Literata and Tiro Devanagari fonts subset to the glyphs we use, Silero VAD | IPA contents check | Yes | B13; BL-258; F03 section 9 |
| What never ships in the binary | Any speech model; any non-English pack; any file over 5 MB matching `*.bin` | IPA contents check | Yes | F05-REQ-016 |

Working budget inside the 40 MB [A], so a regression is caught by the PR that causes it:

| Part | Budget | Source |
|---|---|---|
| F05 native and JS (whisper.rn, decode module, VAD) | 15 MB or less | F05 section 9 (estimate) |
| F08 listening copy (AUSoundIsolation, a system audio unit, so 0 MB) and the ScribeAudio module | About 0.05 to 0.15 MB (E) | ADR 0015 section 6 |
| F08 backup: Keychain module and AES-GCM (CryptoKit, system) | Under 1 MB [A] | F08 section 9 |
| F14 native subscription view module | Under 200 KB | F14 section 9 [A] |
| F04 widget extension (P1) | 2 MB or less | F04 section 9 [A] |
| Bundled fonts (Literata variable 955 KB, Tiro Devanagari Hindi 423 KB before subsetting) | Under 1.5 MB after subsetting | F15 section 11 (file sizes checked 3 Oct) |
| Intro and welcome images | 250 KB each, 1.5 MB total | A-NFR-003 |
| Everything else (JS bundle, Expo modules, assets) | The rest, under 40 MB in total | B13 |

The CI size job prints the IPA size and the top 20 files on every PR touching `apps/mobile/**` or `packages/**`; it fails above 38 MB (a 2 MB warning band) [R] and the release gate fails at 40 MB.

### 11.2 Downloaded on demand

| Item | Size | Rules | Gate | Source |
|---|---|---|---|---|
| Speech model, en, es, fr, pt, ar, zh | 574,041,195 bytes (Whisper large-v3-turbo q5_0); phones under 4 GB RAM, or after 2 memory kills, use small q5_1, 190,085,487 bytes | Asked by id through the pack system; Wi-Fi above 5 MB unless allowed; resumable by HTTP Range in 16 MiB parts; SHA-256 against the signed manifest; Application Support with backup excluded; deletable in Settings > Storage | Yes (rules) | ADR 0015 sections 1, 2; ADR 0016 section 4.3 |
| Hindi model | 190,085,487 bytes (whisper-hindi-small q5_1, Apache-2.0, our build); Hindi uses turbo or small until it is hosted | Not uploaded yet (`hosted: false`); counsel on training-data terms first | Yes (rules) | ADR 0015 sections 1, 7, 9 |
| Silero VAD | 885,098 bytes | Downloads with the first speech model | Yes (rules) | ADR 0015 section 4 |
| Text-rules pack | 5,083 to 7,341 bytes each; Mandarin 62,158 bytes (published, ADR 0014 section 8) | Only the languages the author picked; data, never code (App Review 2.5.2); nothing installs until the signing key exists (`packages/api/src/keys.ts` is empty) | Yes (rules) | ADR 0014; ADR 0016 section 4.2 |
| Reading fonts in packs | Noto Naskh Arabic 308 KB; Noto Serif SC 25.1 MB | Ride in the Arabic and Mandarin packs; Chinese subset at export | No | F15 section 11 |
| Disk check before download | Free space must cover the file plus 1 GB for large packs, 20 MB for small ones | Unit test with fake free space | Yes | ADR 0016 section 4.3 |

### 11.3 On-device storage

| Item | Budget | Gate | Source |
|---|---|---|---|
| Original audio | 0.48 MB per minute (AAC-LC mono 64 kbps) | n/a | ADR 0005; R5 section 6 |
| With listening copy | 0.96 MB per minute; about 19.2 MB per family per month of originals, 38.4 MB with copies at 40 audio minutes | n/a | R5 section 6; F08 section 9 |
| Year-1 fixture | About 230 MB originals; about 470 MB with copies | n/a | TDD 06 section 7.1; F15 Q1 |
| Caches (excluding user content, models and packs) | 50 MB or less, purgeable | No | PRD 1.3 7.7 |
| Low storage | Under 1 GB free: recording starts with a calm line. Under 50 MB: no draft is created and the storage card shows. Drop under 20 MB mid-take: the take stops and is kept within 30 s. A save never fails silently | Yes | F04-REQ-008; F08-REQ-016 |
| Export space check | Free space below estimate plus 200 MB: nothing is written; smaller options offered | Yes | F15-REQ-010 |
| Remove listening copies | Frees their space; originals untouched | Yes | F08-REQ-015 |

## 12. Security and privacy

All rows are gates unless marked. Each names the automated check that proves it; 07-quality-bar.md section 2 says where it runs.

| Requirement | Check | Source |
|---|---|---|
| TLS 1.2 or later everywhere; no App Transport Security exceptions | Manifest lint on the built Info.plist | LEGAL-REQ-021 |
| RLS on every table; every rule has an access test; the pull RPC has a parity test against RLS and `book_entries` | `npm run test:db` (access matrix, security and family, parity and leak suite F16-REQ-008) on every PR touching `supabase/**` | LEGAL-REQ-024; B-NFR-003 Rev |
| Cross-child leak: a member of one child's book gets no row, photo, member or audio of a sibling's book | Leak suite, both directions | PRD-REQ-014; PRD-REQ-011 |
| Working material author-only: no `raw_transcript`, `machine_edits`, `stt_meta`, author layer or edit history to any other member through API or pull | Access tests plus pull parity | PRD-REQ-004 Rev |
| Tokens only in Keychain-backed storage; never in AsyncStorage, settings, logs, route params or Sentry | Lint ban plus unit spy test | A-NFR-008; F02-REQ-003 |
| User JWT plus publishable key only; no service key in the bundle | Secret scan of the built bundle (gitleaks plus a key-pattern scan) | B15; F16-REQ-022; LEGAL-REQ-026 |
| Content never in URLs, logs, push payloads, analytics or support prefill | Log canary over the E2E run with Asha fixtures; push builder test (`data` holds only route ids) | LEGAL-REQ-014; LEGAL-REQ-054; F13-REQ-012 |
| No ad, attribution or tracking SDK; no AdSupport or AppTrackingTransparency import | CI SDK denylist | LEGAL-REQ-016 |
| Nothing leaves the phone before consent: fresh install to first letter, Keep the book and reminder prime makes zero requests to PostHog or Sentry and queues nothing on disk | E2E with proxy and container scan | LEGAL-REQ-003; PRD-REQ-016 |
| No content row accepted before Terms with `age_attested` and sensitive-data consent | Server raises `SCCON`; consent tests | LEGAL-REQ-001, LEGAL-REQ-006; F02-REQ-010 |
| No plaintext audio, listening copy or photo bytes in any request | Network capture of the full E2E suite: zero audio bodies with backup off; with backup on, only AES-GCM ciphertext to the `entry-audio` bucket | D-073; F08-REQ-018; F08-REQ-020; F16-REQ-014 |
| Purchase data reaches our server only as the D-080 and D-081 status report, by allowlist (R4 PT-07): exactly the fields D-080 and D-081 name (plan, trial end, renewal date, cancelled flag, the consent facts on first report, F14's hashed subscription reference, and the `environment` field F14-REQ-043 requires; R8 R2A-21), to one endpoint, typed in `packages/api` | A schema test fails on any extra field; CI grep and the sandbox network capture find zero receipts, JWS, transaction ids in clear, prices or `appAccountToken` in any request | B2 as amended by D-080, D-081 (M6); F14-REQ-014 |
| Safety tiers stay on the device; no `safety_events` table; no tier in any request or event | Migration check (the table is dropped in `20261002020000_data_governance.sql`); proxy body scan | LEGAL-REQ-015 |
| No voiceprints, diarization or voice synthesis; `translate` false; `tdrzEnable` absent | Config lint | LEGAL-REQ-019; F05-REQ-009 |
| Postgres never echoes content in errors | Value-free validation trigger on content tables; oversize-letter canary | F16-REQ-020; TDD 06 C-2 |
| Rate limits enforced in RPCs and Edge Functions (section 3) | Unit and DB tests per limit | B15; F16-REQ-021 |
| Kill switches (every `killSwitches.*` key in F19 section 6.5 and `forceReauthEpoch`) take effect within 5 minutes; local recording, reading and export keep working | Staging drill per release candidate with F19-REQ-026's cache numbers | LEGAL-REQ-040; F19-REQ-006 |
| The escrow private key runs only in the separate `scribe-escrow` project, alone with the `escrow` function; `escrow_svc` can execute only the four escrow functions; escrow is not deployed before BL-347 and the server-driven new-sign-in email | Management API release check over both projects, `escrow_svc` grant test, no-remote-import check, deploy checklist (F08 6.5 G3) | F08-REQ-034; R4 PT-03; R8 R2A-02 |
| The recovery-key log is append-only, copied daily outside database backups, and each use emails the owner | Trigger test, daily-copy test, email test | F08-REQ-042; R8 R2A-01 |
| A new Auth session always produces the new-sign-in email, whatever the client sends; data RPCs refuse a session the server has not recorded | Test with a client that never registers a device: email queued and `sync_pull` works only after the session row exists | F02-REQ-017, F02-REQ-025; R8 R2A-06 |
| Links in security emails act only on a button press, never on load | Scanner simulation that loads the page, runs scripts and follows links: zero cancellations, zero sign-outs | F02-REQ-017, F08-REQ-042; A-REQ-023; R8 R2A-08 |
| No outside sign-in before the security gate | F02-REQ-024 is the only checklist; 08 T16 and 09 R-17 cite it (R8 R2A-27). Signed by the founder before the build reaches anyone outside the founding family | M14; 09 R-17; F02-REQ-024 |
| Staff access claims match what is logged | The staff-access line says only what F17 8.2 item 6 proves; database audit of service-role and dashboard sessions before C1 | F17-REQ-027; R4 PT-03 |
| Packs and models load only after SHA-256 matches a signed manifest; a bad signature, unknown schema or lower version is rejected and the last good copy stays | Tampered, unsigned and rolled-back fixtures | F05-REQ-018; B13 |
| Server-driven content never changes data collection or the paywall; flags only switch reviewed features | Schema test on every block type; review checklist | B14; App Review 2.3.1 (R4 section 0 item 8) |
| Device data protection at least "complete until first user authentication" on the database and audio | Device check of file attributes | LEGAL-REQ-022; PRD 1.3 7.10 |
| Photo location stripped | Not applicable at v1.0 (no photo capture, F46); binds when photos return | LEGAL-REQ-013 |
| External security test (one position, R8 R2A-13) | A scoped external test of auth and email links, the Stop page, RLS and pull parity, held drafts, invites, escrow isolation and deletion, run on staging from Mon 23 Nov to Fri 4 Dec (between T23 and T27), with two fenced fix slots in wave 3. Backup does not turn on for C1 families (T27) while a high finding on escrow or deletion is open. The report is a G4 input. The full test runs before the C2 public link, paid marketing or 1,000 families, whichever is first. Default awaiting the founder's approval of the cost at T15 (not yet quoted); if the founder declines, submission goes without an outside test and 09 records it as a risk the founder accepted | BL-313; R4 PT-21; R8 R2A-13 |

## 13. Data classification

The four levels and handling floors in PRD 1.3 section 7.10 stay as written, with `docs/legal/DATA_CLASSIFICATION.md` as the authority. Changes for V2:

| Change | Why |
|---|---|
| Purchase records (`store_subscriptions`, `store_notifications`, `app_account_tokens`) leave the L3 list; the tables are dropped (F14-REQ-012). Plan state on the device is L2 local settings (F14-REQ-005) | B2 |
| The "client-encrypted before upload" floor for L4 audio binds at v1.0 with the owner's backup (D-073): AES-256-GCM on the phone, one book key per (child, author) in the Keychain, an escrow wrap that only the `escrow` function in the separate escrow project can open, with logged, emailed and rate-limited use (F08 section 6.5, ADR 0006 as amended, LEGAL-REQ-023, M16). No photo leaves the phone | D-073 |
| New L1 rows: speech manifest, model and pack files, `speech_assets` rows, content blocks and remote config | F05 section 8; B14 |
| New L4 rows: listening copies, `entries.language`, author edit layer, locked spans, transcript versions; new L3 row: `entries.listening_uri` | F08 section 8; F04 section 8; F06 |
| `sync_op_receipts` (op id, profile, 30 days) is L2 with an L3 profile id; `sync_epochs` L2; `sync_rate_windows` L2 with an L3 profile id | F16 section 8 |
| New backup rows: `audio_blobs` (L4 secret wrapped), `child_keys` (L4 secret wrapped), `backup_devices` (L3), `escrow_unwraps` (L3), `restore_requests` (L3), stop-link tokens (L3, hashed), the `entry-audio` bucket (ciphertext of L4) and the Keychain items (L4 secret) | F08 section 8 |
| New rows from round 2: `held_drafts` (L4, author only, F16 6.2 I); `account_sessions_seen` (L3, F02-REQ-025) | F16, F02 |

Enforcement stays as PRD 1.3 7.10 items 1 to 9, with two notes: item 1 points at `docs/legal/data-policy.md` section 4 until BL-016 makes `docs/legal/data-map.yaml` canonical (the YAML file does not exist yet); item 6 (server-built exports expire in 7 days) has no v1.0 path because exports are built on the phone.

## 14. Observability (content-free)

No entry text, transcript, audio, child name, language name or person id in any log, metric, crash report or alert (CLAUDE.md; LEGAL-REQ-014; DATA_CLASSIFICATION section 2 "Logging"). Observability is built on enums, counts, durations, SQLSTATEs and random request ids (TDD 06 section 0).

| Signal | Who it covers | What it answers | Gate | Source |
|---|---|---|---|---|
| App Store Connect and Xcode Organizer (MetricKit aggregates) | Users who share diagnostics with developers | Crash rate (gate source), launch time, hangs, memory exits, battery | Gate source for section 6 | TDD 06 section 5.1 |
| Sentry (mobile), only if F18 Q2 adds it | Consenting users only; started after first frame | Stack traces; `sendDefaultPii: false`; no `setUser`; PostgREST errors reduced to SQLSTATE and HTTP status | Scrub tests gate, if Sentry ships | LEGAL-REQ-003; TDD 06 section 5.4; R8 R2A-28 |
| PostHog | Consenting users only | Journey events from the typed catalogue, L2 only; strings capped at 40 characters | Allowlist tests gate | LEGAL-REQ-017; PRD-REQ-016 |
| On-device diagnostics ring buffer | Everyone; stays on the phone; the user may attach it to a support request | Unclean exits, queue depth, last sync SQLSTATE, model state, request ids | No | TDD 06 section 5.1; F16 section 9 |
| Edge Function logs | All server traffic | One typed record per request: function, version, request id, route template, outcome, status, SQLSTATE, duration, counts. No free-text message field | Logger canary test gates | TDD 06 section 5.3 |
| Server health views and `ops-health` | All | Purge backlog, deletion requests stuck, database size, top queries, rejected writes reported, oldest running transaction (alert over 30 s), escrow unwraps per day (alert on any limit hit), daily escrow-log copy written, restore requests on hold, backup bytes per account | No | TDD 06 section 5.5; F16-REQ-027; F08 6.5 C |
| Server aggregates | Synced accounts | Accounts, books, letters, co-parent share; never purchase data | No | PRD-REQ-017 Rev; B10 |

Alerts follow TDD 06 section 5.6 with the purchase and webhook rows removed (B2). The founder is the only responder in v1.0; severity 1 and 2 page the phone (TDD 06 section 2.3).

Analytics volume: batched, sent at most every 60 s in the foreground and on background; queue capped at 1 MB; no wake-ups of its own (PRD 1.3 7.7). The volume target is set in F18 (not yet written); R3 section 7 recommends about 50 events per family per month to stay inside PostHog's free tier through the Base case [R].

## 15. Cost per family

The target in 03 section 4.4 holds: run cost near $0.02 to $0.10 per family per month (ARCHITECTURE section 7). A design that raises it needs a line in `09-decisions-and-risks.md`.

| Line at v1.0 | 1k families | 100k families | Basis |
|---|---|---|---|
| Supabase Pro base | $25 | $25 | [F] R3 section 6.1 |
| Escrow project `scribe-escrow` (F08 6.5 G2) | About $25 | About $25 | 08 Q7's per-project Pro figure; F08 Q9 |
| Supabase MAU over 100k (1.5 accounts per family, F16) | $0 | 150k MAU: 50k x $0.00325 = about $163 | [F] price R3 section 6.1; [A] MAU from F16 section 9 |
| Supabase compute | $0 (included credit, one Micro) | Size by load test; TDD 06 estimates $200 to $400 (Unverified) | TDD 06 section 4.3 |
| Supabase database over 8 GB | $0 (about 3 GB) | About 290 GB: about $35; about 120 GB if `stt_meta` stays on the device | TDD 06 section 3.4 |
| Supabase Storage and audio egress (owner backup, D-073) | About $0 under the 100 GB included | About $243 a month of storage after 12 months at 100k, growing about $20 a month, plus about $9 a month of restore egress (TDD 06 4.1, 4.2, at 50% of families backing up) | TDD 06 section 4; F08 section 6.5 |
| Model and pack hosting | $0 on R2 or Hugging Face | $0 egress on R2 or Hugging Face; Supabase would be $3.8k to $11.3k at 220k installs | [F] R3 section 6.2; D-046 |
| PostHog (40% consent) | About 90k events: $0 | About 9M events: $50 + 7M x $0.0000343 = about $290 | [F] prices R3 section 6.1; [A] volume F16 section 9 |
| Sentry | $0 to $26 | $26 plus overage | [F] R3 section 6.1 |
| Resend (auth email) | $0 (3,000 a month free) | $20 Pro or more | [F] R3 section 6.1 |
| Vercel Pro (website, legal pages, `/j`, `/auth/confirm`) | $20 | $20 | [F] R3 section 6.1 |
| **Total** | **About $70 to $96 a month** | **About $805 to $1,005 a month, including TDD 06's compute estimate** | arithmetic |
| **Per family per month** | **About $0.07 to $0.10** | **About $0.01** | arithmetic |

Not in v1.0 and therefore $0: server transcription (F35), shared voice playback egress (F31), RevenueCat (B2), PowerSync (D-023 decided against for v1.0). The whole table assumes server features are on, as they are for v1.0 (M14, founder, 13 Oct 2026; the release profiles still have them off on 13 Oct, `apps/mobile/src/lib/capabilities.ts`). The cost decision of 3 Oct keeps Supabase paused and free until the first real family's letters reach a server; the $25 Pro base starts that day, which M14 puts at v1.0 launch or the first outside tester who signs in (F08 section 13 Q1). Cost guardrails from TDD 06 section 4.3 apply: billing alerts at 150% of this table in every console and a monthly 15-minute review [R].

## 16. Load targets

Replaced by F16 section 9 (recomputed without contributors, audio uploads, store webhooks or server notice emails). Summary:

| Target | 1k families (launch) | 100k families | Test load |
|---|---|---|---|
| Accounts per family | 1.5 [A] | 1.5 | n/a |
| MAU | 1.5k | 150k | n/a |
| Concurrent sync clients at peak (5% of MAU) | 75 | 7.5k | 200 at launch gate (kept from 1.3) |
| Entry writes, peak sustained 15 min | 5 per s | 50 per s | 2x |
| `sync_pull` calls at peak (one per 15 s per client with a shared book open, the worst case; F16 6.2 C) | 5 per s | 500 per s | 14 per s (200 clients) in the load runs |
| Write RPCs (invites, leave) | 1 per s | 10 per s | 2x |
| Encrypted audio uploads, steady state | About 0.1 per s at peak [A] | About 10 per s | 2x |
| First-enable backup burst | 20 families enabling at once, a year of recordings each (about 480 objects, 230 MB per family) | n/a | k6 scenario (R2 AR-15) |
| Escrow unwraps | Under 1 per hour [A] | Under 30 per hour [A] | Limit test |
| Status report writes and reminder emails | F14 owns the numbers | F14 | F14 |
| Store webhooks | 0 | 0 | n/a |
| Children's books (1.3 per family) | 1.3k | 130k | n/a |
| Letters after 12 months (240 per family) | 240k | 24M | Seeded at 1k for the launch gate |
| Database size | About 3 GB | About 290 GB (about 120 GB if `stt_meta` stays on the device, F16 Q3) | n/a |
| Analytics events (40% consent, 150 per user per month) | About 90k per month | About 9M per month | n/a |

**Gates (one position, R8 R2A-14; default awaiting the founder's answer to 08 Q8 at T15).** G4, before App Review submission: a 1-hour run in staging at **1x the 1k peak targets**, including the 20-family first-enable backup burst (the only test of the 600 per hour limit and bucket behaviour), the escrow limit test and the two-client freshness probe; every section 3 budget is read there at p95, and at p99 only where 1,000 or more samples exist. Before the C2 public link, paid marketing or 1,000 families, whichever is first: **2 times the 1k targets** with a 4-hour soak at 1x peak (flat p95 within 10%, no growing connections) (BL-282, WP-F16-12, TDD 06 G-L1). 07 G4 and 08 cite this paragraph. Before 10k families: 2x the 10k loads on 10k-equivalent data (TDD 06 G-L2) [R]. Before 25k families: 2x the 100k targets and an 8-hour soak (PRD 1.3 7.8; TDD 06 G-L3). Staging uses synthetic Asha families only (CLAUDE.md).

## 17. Feature budgets this file changes, and budgets parked for later

| Item | Status | Owner of the change |
|---|---|---|
| F04 section 9 refers to `06-nfr.md` as "not yet written"; F05, F06, F07 the same | Now written; feature owners remove the note at next edit | Feature spec owners |
| PRD 1.3 7.2 store notification processing, entitlement after store success, Storage upload start, escrow unwrap, server transcription gateway | Storage upload start and escrow unwrap return to v1.0 with the owner's backup (D-073; take TDD 06 section 3.2 rows; F08 owner). Member playback stays with F31; gateway with F35 (p95 4 s, p99 10 s for 2 minutes of audio, not a gate) | F08, F31, F35 owners |
| Load targets for owner backup uploads | Added to F16 section 9 and section 16 above | F16, F08 owners |
| Load target for the D-080 status report and reminder emails | F14 owns the numbers; rows exist in sections 3 and 16 | F14 owner |
| PRD 1.3 7.3 web-page letters to pending p95 60 s; 7.2 web page LCP 2.5 s and 300 KB or less | Parked for F37 | F37 owner |
| PRD 1.3 7.3 backed-up audio restore | v1.0 for the owner's own recordings (D-073): F08-REQ-023 | F08 owner |
| Android budgets (cold start p50 2.0 s, p90 3.0 s; mid-tier 60 Hz device) | Parked for F36 | F36 owner |

## 18. Open questions

| Q | Who answers, by when | What changes |
|---|---|---|
| Q1 F15 Q1: is 4 minutes with listening copies a gate, or do copies stay off by default in export? | Founder, after WP-F15-01 (week 6) | Section 2.5 gate column |
| Q2 F05-REQ-040: if turbo misses p90 30 s on SE 3, which change does the founder record: small model on SE 3, or a relaxed bar? | Founder, after BL-043 | Sections 2.4, 10, 11.2 |
| Q3 Exact name of the App Store Connect per-device download size report (R4 section 6 could not read it) | Release owner, before the first TestFlight build | Section 11.1 measurement line |
| Q4 F16 Q3: do per-token timestamps in `stt_meta` sync to the server? | Data architect with F05 owner, 30 Oct | Sections 15 and 16 database size |
| Q5 F16 Q5 and TDD 06 C-1: does the Supabase gateway log ids in paths and custom headers, and may it under the DPA? | Privacy counsel, data architect, before beta C1 | Sections 3 and 14 |
| Q6 F18 analytics volume cap (R3 recommends about 50 events per family) | F18 owner, founder | Section 14 and 15 PostHog line |
| Q7 Is PITR turned on at launch (about $100 a month, Unverified) to cut the 24 h RPO? | Founder (TDD 06 OQ-4) | Section 7 RPO row |
| Q8 Minimum session count for the G4 crash-signature gate: 300 on RC-equivalent builds [A]; what to do if fewer accrue by T34 | Founder with S19, from C1 numbers | Section 6 |
| Q9 Freshness: accept p95 30 s with a 15 s pull for shared books for v1.0 and add Realtime in v1.1, or add Realtime now? Spec default: 30 s with the 15 s pull | Founder | Section 4; F16 Q2 |
| Q10 Load gate: G4 is the 1-hour 1x run plus the burst (section 16 default), with the 2x run and soak before C2 or 1,000 families. Confirm, or keep the 2x run before submission | Founder, T15 (08 Q8) | Sections 3, 16; 07 G4 |
| Q11 External security test: approve the cost of the scoped test on staging from 23 Nov to 4 Dec (section 12 default) | Founder, T15 | Section 12; 08; 09 |

## 19. Sources

- Decisions: `docs/agents/BRIEF-2026-10-03.md` items 3, 6, 8, 9, 15 to 17; `_AUTHORING.md` section 3 (B2, B4 to B7, B13 to B15); `docs/DECISIONS.md` D-023, D-027, D-028, D-031, D-033, D-035, D-040, D-041, D-046, D-068, D-073, D-080; ADR 0014 to 0017; `apps/mobile/src/lib/capabilities.ts`; `docs/qa/DEVICE_TEST_PLAN.md`; `09-decisions-and-risks.md` DR-01, DR-02, DR-07, DR-09, R-01, R-02, R-11.
- Requirements: `docs/prd/PRD.md` 1.3 sections 2.3, 6, 7.1 to 7.10; `docs/prd/A-entry-and-auth.md` A-NFR-001 to A-NFR-014; `docs/prd/B-first-run-and-family.md` B-NFR-003, -007 to -009; `docs/prd/C-habits-pricing-settings.md` C-NFR-001 to C-NFR-009; `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-001, -003, -006, -013 to -017, -019, -021, -022, -024, -026, -032, -034, -040, -051, -054; `docs/legal/DATA_CLASSIFICATION.md` section 2; `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-030, -031, -040, -043, -044, -046, -048, -051.
- Feature specs, sections 7 and 9: `features/F01-entry.md` to `features/F16-sync.md` (requirement IDs as cited per row).
- Technical: `docs/tdd/06-performance-reliability.md` sections 0, 2, 3, 4, 5, 6, 7, 8, 10, 12; `docs/tdd/07-quality-test-strategy.md` sections 4, 7; `docs/tdd/09-accessibility-design-system.md` sections 2.11, 7, 8; `docs/ARCHITECTURE.md` status box and section 7; ADR 0005; `docs/BACKLOG.md` BL-016, BL-043, BL-135, BL-247, BL-258, BL-282, BL-284, BL-313.
- Reviews: `reviews/R2-architect.md` AR-03, AR-07 to AR-09, AR-11, AR-13 to AR-15, AR-26, AR-27, AR-30; `reviews/R4-privacy-trust.md` PT-03, PT-07, PT-21; `reviews/R5-eng-qa.md` EQ-17, EQ-20, EQ-30; `apps/mobile/eas.json` (profiles); `packages/api/src/standards.ts`.
- Research: `research/R3-market.md` sections 5, 6, 7; `research/R4-platform-and-policy.md` sections 0 and 6; `research/R5-speech-audio-languages.md` sections 0, 6, 7.
- Code: `supabase/migrations/20261002020000_data_governance.sql` (drops `safety_events`); `packages/core/src/plan.ts`; `.github/workflows/ci.yml`.
