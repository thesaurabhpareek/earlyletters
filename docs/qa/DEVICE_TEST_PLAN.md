# Device test plan: the first real-iPhone session and the TestFlight beta

Owner: qa-e2e (S19 in PRD V2). Version 1.2, 16 Oct 2026. 1.1 on 15 Oct came in two parts, merged here: S2-17, TF-10 and TF-11 (#123; S2-17 and TF-10 ported from `auto/2026-10-05-fixes`, D-093), and the server-on items for M14, the WP-F08-B1 backup spike, the StoreKit rows the ASC doc numbers twice (S2-18 to S2-21), budgets brought to PRD V2 `06-nfr.md`, and run sheets (#143). 1.2 moves the numbers each server-on row must carry into its **Record** line (from `evidence/README.md`). For the founder or the device operator (who runs it) and the coordinator (who files the follow-ups).
Inputs: PRD V2 `07-quality-bar.md` section 2 and `08-delivery.md` sections 2.1 and 10 (every date is a T id there), TDD 07 (sections 3 to 5, 11), PRD 6 and 7, ROADMAP 2.x (week 2 device spikes, C0 from 14 Oct, C1 from 19 Oct), `docs/ops/AUTH_SETUP.md` 11, `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 11, `docs/ops/APP_SIZE.md`, ADR 0013 to 0017, TDD 03 failure modes, TDD 09, `apps/mobile/src/lib/README.md`, the agents' "needs a real device" notes. The alpha drills (D-106) are in `docs/qa/run-sheets/AL-*.md`.

Labels: **V** verified on a vendor page on 3 Oct 2026; **A** assumption to confirm during the session; **F** fact found in the repo.

## How to use this plan

- Work top to bottom. The order follows dependencies: a build that installs, then capture, then models, then accounts, then money, then the beta.
- Every item has **Steps**, **Expected**, **Record** (where the result goes) and **Update** (the document that holds the fact this item proves or measures). If the result differs from that document, fix the document in the same pull request.
- Results go in one evidence file per device session: `docs/qa/evidence/<date>-<build>-<device>.md` (template in `docs/qa/evidence/README.md`). One row per item ID.
- Fictional family only (Asha, Avi, Mama, Papa) in letters, names, notes and screenshots. The founder's own family never appears in evidence (CLAUDE.md).
- Maestro cannot drive a physical iPhone (V: Maestro 2.11.0, "Physical iOS devices are not yet supported"), so everything here is by hand. The simulator suite is `apps/mobile/e2e`.
- Failures: a GitHub issue with `beta` and a severity `S0` to `S3` (TDD 07 11.3). S0 (a letter lost or changed, data exposed, anything created after an under-18 answer, consent bypassed) stops the session.
- Scripted sessions follow a run sheet in `docs/qa/run-sheets/` (ordered steps with times). The first is `run-sheets/2026-10-30-T11-session-1.md`.

### Server-on items (M14)

PRD V2 puts sign-in, sync, co-parent sharing and the owner's backup in v1.0 (M14, M16). Every profile in `apps/mobile/eas.json` builds with `EXPO_PUBLIC_SERVER_FEATURES=off` today (F: 15 Oct), and a switch-off build shows "coming soon" for all of these, so they need a build made with the switch on and pointed at staging (S20 owns the per-profile switch, `08-delivery.md` S20 row). Evidence rows for them carry the header fields in `evidence/TEMPLATE.md` and the numbers in each item's **Record** line below; they run only on drill phones and drill accounts (`run-sheets/README.md` "Drill identities").

| Item | Needs | When (`08-delivery.md` 10.2) |
|---|---|---|
| S1-06, S1-07, S1-08 sign-in | Switch on; staging with P-04 and P-05 done | W2 (T11) |
| WP-F08-B1 backup spike | S05's spike build; two iPhones on one Apple Account | W2 (T11) |
| S2-13 deletion request and cancel | Switch on; staging | W2 (T11); completion and `verify-deletion` in staging in W5, W6 |
| S1-22 co-parent sync | Switch on; two iPhones on two Apple Accounts | W5, W6 |
| S1-29 a child's book with two parents | Switch on; S1-22's two phones, joined to one book | W5, W6, after S1-22 |
| S1-09 invite links, push | Switch on; AASA on Apple's CDN; APNs key | W7 |
| S2-14 sign out and revocation | Switch on | W14 |

### Devices
| Tag | Device | Why | Must have |
|---|---|---|---|
| `se3` | iPhone SE (3rd generation), 4 GB RAM (A: public specs) | Reference for every budget (PRD 7); smallest screen; the full-tier line in `lib/models/tiers.ts` sits at 3.4e9 bytes | Yes, session 1 |
| `ip12` | iPhone 12, 4 GB RAM (A: public specs) | Oldest common full-tier phone; memory edge for turbo | Yes, for S1-17 |
| `ip15` | iPhone 15, 6 GB RAM (A: public specs) | Current-class phone, 60 Hz | Yes, for S1-17 |
| current | Any phone on the newest iOS (27 at the time of writing, A) | The build is made with Xcode 26 (EAS `sdk-57`, V) and must run on the newest iOS | Yes |
| oldest | A phone on the lowest iOS we support (16.4 or 17, open DEBATES Q-002) | `SubscriptionStoreView` needs iOS 17 (ASC doc D-12) | Before C1 |
| `ipad` | Any iPad | `supportsTablet: false`, so iPads run the iPhone app in compatibility mode; App Review often tests on iPad (TDD 07 D5) | Before submission |
| `mac`, `win11` | A Mac and a Windows 11 PC | Export opens on both (S1-21) | Session 1 |

Borrowing is fine for `ip12` and `ip15`: the founder needs only the SE 3 and one current phone daily (TDD 07 4).

---

## Part 0. Before the first session

| ID | Check | Done when | Update |
|---|---|---|---|
| P-01 | Apple Developer Program (individual) active; Team ID noted | Membership page shows Active | `docs/FOUNDER_TASKS.md` |
| P-02 | Each test iPhone registered for internal builds: `npx eas-cli@24.10.0 device:create`, then a new build | `eas device:list` shows it (V: eas-cli command exists) | none |
| P-03 | Builds: an EAS **development** build (`--profile development`) for S1-01 to S1-20, and a **preview** build (release JavaScript, `.preview` bundle id) for timings and the gate | Both install from the EAS link | `docs/ops/RELEASE.md` 3 |
| P-04 | Staging Supabase: migrations applied in `supabase/APPLY.md` order, policy versions published (AUTH_SETUP 1.4), function secrets set (`docs/ops/README.md`) | `select public.ops_schema_health();` all zeros | `supabase/APPLY.md` |
| P-05 | Sign-in dashboards done (AUTH_SETUP sections 1 to 6), AASA live at `https://earlyletters.com/.well-known/apple-app-site-association` and visible on Apple's CDN (`https://app-site-association.cdn-apple.com/a/v1/earlyletters.com`) | Both URLs return the JSON with no redirect | AUTH_SETUP 5.2 |
| P-06 | Packs and models: text packs and the remote config published to the staging host (`scripts/packs/publish.ts`, RELEASE.md 9); speech models reachable at the D-046 host. F: the Hindi small and Belle models are `hosted: false` in `lib/models/catalog.ts`, so Hindi and Chinese fall back to the shared model until the founder uploads them | `ensurePack` downloads `text-rules.pt` in a dev build | ADR 0015 9 item 2 |
| P-07 | Paid Apps agreement Active, both products and the group created, Family Sharing on, 2 or 3 sandbox testers (ASC doc steps 1 to 9) | Products load in the sandbox | ASC doc |
| P-08 | Test recordings: the scripted Asha letters (TDD 03 7.3 corpus scripts) read aloud by the founder or a consenting adult tester, at 30 s, 2 min and 5 min, in each language the session covers. Kept out of git and out of evidence | Files on the phone, never in the repo | none |

---

## Part 1. First real-iPhone session (iPhone SE 3 first, then the current iPhone)

### S1-01 First compile of each native module
- **Steps:** In the EAS build log for the development and the preview build, open "Install pods" and "Run fastlane" (or `xcodebuild`) and find each module: `ScribeAudio` (`modules/scribe-audio/ios`), `ScribeFiles` (`modules/scribe-files/ios`), `ScribeStore` with `PlusStoreSheet.swift` (`modules/scribe-store/ios`), the third-party `whisper.rn` (Metal kernels), and the autolinked Expo modules. Save every warning that mentions these modules, the deployment target (F: the three local podspecs say iOS 16.4) or Swift concurrency.
- **Expected:** The build succeeds; no error in our three modules; warnings listed. The log's image line shows `macos-tahoe-26.5-xcode-26.6` once `eas.json` pins `sdk-57` (request B-3; V: EAS image list).
- **Record:** S1-01 row: build id, image, warning count per module.
- **Update:** `apps/mobile/src/lib/README.md` (Capture and Other modules) for anything that needed a code change; DEBATES Q-002 if the 16.4 versus 17 target causes warnings.

### S1-02 Native modules load at runtime
- **Steps:** Development build, React Native DevTools console: check `globalThis.expo.modules.ScribeAudio`, `.ScribeFiles`, `.ScribeStore` are objects (A: Expo modules are exposed there). Then by behaviour: Settings > Recordings lists speech files per language (ScribeFiles `modelsDirectory`); Settings > Plan shows See plans (ScribeStore `storeViewSupport` is `available` on iOS 17+); after a letter's words are done, the player offers the clearer listening copy (ScribeAudio `enhance`, S1-19).
- **Expected:** All three present; `ScribeAudio.isIsolationAvailable()` is true (iOS 16+, ADR 0015 V).
- **Record:** S1-02 row.
- **Update:** ADR 0015 section 9 (decode contract) if `decodePcm16` fails.

### S1-03 Cold start, splash and the 18+ gate (airplane mode)
- **Steps:** Preview build, fresh install, airplane mode on. Launch. Record the screen at 60 fps and count frames from tap to the gate's first frame; 10 cold starts (kill from the app switcher between them). Answer No: the stop screen. Relaunch: still stopped. Delete and reinstall; answer Yes.
- **Expected:** Splash matches the first frame in light and dark (A-REQ-001); gate shows with nothing selected and Continue disabled; no network needed (A-REQ-002); cold start p50 at or under 1.2 s, p90 at or under 2.0 s on SE 3 (PRD 7.1, gate). After No, there is no way to record or write.
- **Record:** S1-03 row: p50 and p90 in ms, 10 samples.
- **Update:** PRD 7.1 (add the measured column) or TDD 06 budgets table.

### S1-04 Fonts
- **Steps:** First run and a letter in Book: compare the letter body with a Literata specimen (look at "g", "a" and the italic), UI text with Mukta, a Devanagari letter with Mukta and Tiro Devanagari Hindi, an Arabic letter (system font, right to left) and a Chinese letter (system font). Toggle Bold Text.
- **Expected:** Brand fonts render from the first frame (embedded by the `expo-font` plugin, F); no fallback to San Francisco in letters; Devanagari conjuncts join; Arabic aligns right; Bold Text applies.
- **Record:** S1-04 row with screenshot names.
- **Update:** `docs/design/DESIGN_LANGUAGE.md` (the Tiro 1.08x size factor still needs device testing, F); `docs/ops/APP_SIZE.md` cut 3 if a subset drops a glyph.

### S1-05 Haptics
- **Steps:** With System Haptics on: choose an answer on the gate (tap), Speak and Type (press), save a letter (success), Delete a letter (warning), Not much today (soft). Then turn System Haptics off in iOS Settings and repeat.
- **Expected:** Only those moments buzz (`lib/haptics.ts` kinds; no haptic on navigation, MOTION 6); nothing when System Haptics is off.
- **Record:** S1-05 row.
- **Update:** `docs/design/MOTION.md` section 6 if a moment feels wrong.

### S1-06 Sign in with Apple (AUTH_SETUP 11.1)
- **Steps:** Signed out, after the first letter: Keep the book > Apple. Once with "Share My Email" and once (second Apple ID) with "Hide My Email". Then Terms sheet (with the 18+ line), sensitive-data sheet, Agree. Sign out and in again.
- **Expected:** Supabase > Users shows the Apple identity; no Terms sheet on the second sign-in; a receipt or notice email reaches the `privaterelay.appleid.com` address (needs AUTH_SETUP 2.5 relay setup).
- **Record:** S1-06 row (no email addresses in evidence; switch on, staging): seconds from the Apple sheet closing to signed in, 3 tries each (a smoke; the gate is 06-nfr's lab run, 50 runs, p90 3 s, A-NFR-004); Terms sheet on the first sign-in (yes, no) and on the second (must be no); relay email arrived (yes, no, minutes); identity "listed" in Supabase Users, never the id.
- **Update:** AUTH_SETUP 11 (tick 11.1), and 2.1 "Assumption: EAS capability sync" can become Verified (V: Expo "iOS capabilities": `eas build` enables supported entitlements on the App ID).

### S1-07 Sign in with Google (AUTH_SETUP 11.2)
- **Steps:** A build with both Google client ids (AUTH_SETUP 3.5). Keep the book > Google. If the button is missing, the build lacks the ids.
- **Expected:** Signs in; Supabase shows the Google identity; a nonce error means "Skip nonce check" is off.
- **Record:** S1-07 row (switch on, staging, both Google client ids in the build): seconds to signed in, 3 tries; button present (yes, no); identity listed; no nonce error.
- **Update:** AUTH_SETUP 11.2. Note: D-054 includes Google at launch; ROADMAP section 4 allows cutting it.

### S1-08 Email link and code in real mail apps (AUTH_SETUP 11.3, 11.4; A-REQ-018, A-REQ-022, A-REQ-023)
- **Steps:** Continue with email, with a brand-new address and with a known one. Open the link from: iOS Mail, Gmail app, Outlook app, and a link forwarded in Messages. Type the code by hand once. Open a one-hour-old link. Open the link on a laptop.
- **Expected:** The link opens the app (not Safari) and signs in; the code also works; the old link says it has expired and offers the code; the laptop page verifies nothing and shows the "Open the app" fallback; one email holds both link and code; no click-tracking redirect in the link (AUTH_SETUP 4.1).
- **Record:** S1-08 row (switch on, staging, AASA live): one line per mail app (iOS Mail, Gmail, Outlook, Messages forward) with opened the app (yes, no) and signed in (yes, no); email arrival seconds (06-nfr gate: p90 30 s over 50 sends, A-NFR-004); code typed by hand works; expired-link message seen; laptop page signs nothing in; no click-tracking redirect in the link.
- **Update:** AUTH_SETUP 11.3, 11.4 and the template assumption in section 6 ("GoTrue verifies a signup token and a magic-link token under `type=email`").

### S1-09 Universal links for invites (A-REQ-022, A-REQ-028)
- **Steps:** From the Family tab, invite a co-parent; share the link to yourself in Messages and WhatsApp. On a second phone: (a) app not installed, tap the link; (b) app installed, cold (killed) and warm; (c) long-press the link and choose "Open in Early Letters"; (d) paste it on "I was invited". Then answer No on the 18+ gate on a fresh install opened from the link.
- **Expected:** (a) the website's `/j` page with no child name (B-NFR-002); (b) the app opens on "Join the family book" after the 18+ gate, cold and warm; (c) works; (d) works without reading the clipboard on its own (A-REQ-029); after a No the invite is dropped (TDD 01 F-20).
- **Record:** S1-09 row (switch on, staging, AASA on Apple's CDN; Phone A on Account A invites, Phone B on Account B joins): cases (a) to (d) each pass or fail; cold and warm open; the invite page shows no child name (yes, no); after an 18+ No the invite is dropped (yes, no); no clipboard read without a tap.
- **Update:** AUTH_SETUP 11.5; `docs/ops/DOMAINS.md` if the AASA or the `/j` page misbehaves.

### S1-10 First recording, save, and the letter waiting for its words
- **Steps:** Fresh install, airplane mode. Speak: the microphone prompt; record 60 s of a test recording played from another device; Done. With no speech model yet, keep the recording; it is in the book "waiting for its words". Turn airplane mode off on Wi-Fi: the language download starts (S1-15) and the words arrive later.
- **Expected:** The microphone prompt is the only system prompt (A-REQ-012); tap to microphone live p95 at or under 500 ms (PRD 7.1); save commit p95 at or under 200 ms; the waiting letter gets its words once the model is ready, and Review never starts two jobs for one draft (TDD 03 FM-18).
- **Record:** S1-10 row: tap-to-live ms (screen recording), save ms.
- **Update:** PRD 7.1 measured column; TDD 03 FM-9.

### S1-11 Background and lock during recording (LEGAL-REQ-011, TDD 03 FM-2)
- **Steps:** Record 20 s; press Home. Record again; press the side button (lock). Record again; open Control Center for 5 s and close it.
- **Expected:** Home and lock: the take stops within 1 s and is kept; the orange microphone dot disappears (never records in the background; `UIBackgroundModes` has no `audio`, F: `app.config.ts`); Review opens on return. Control Center: recording pauses or continues per TDD 03 FM-1, never lost.
- **Record:** S1-11 row.
- **Update:** TDD 03 failure-mode table (status column), `src/lib/README.md` Capture.

### S1-12 Interruptions and audio routes (TDD 03 FM-1)
- **Steps:** During a recording: an incoming FaceTime audio call from another device (decline, then accept on a second take); "Hey Siri"; a Clock timer ending; connect and disconnect AirPods; plug and unplug wired headphones if available.
- **Expected:** Each interruption pauses and keeps the take so far, no auto-resume; route changes never end the take silently; the file plays back whole.
- **Record:** S1-12 row: one line per interruption.
- **Update:** TDD 03 FM-1.

### S1-13 Kill during recording and during save (DATA-REQ-048, PRD 7.4)
- **Steps:** (a) Record 10 s, swipe the app away in the app switcher; relaunch. Repeat 10 times. (b) Type a letter, tap Save, and swipe the app away at once; relaunch. Repeat 50 times, varying the delay. (c) Optional: the 500-iteration version on a simulator (TDD 07 BL-Q30, not scripted yet).
- **Expected:** (a) every take is offered on Tonight ("waiting to be read back") by the launch sweep, never deleted; (b) every letter exists exactly once, or is still a draft with its text; zero lost, zero duplicated.
- **Record:** S1-13 row: counts kept, lost, duplicated.
- **Update:** PRD 7.4 ("zero data loss in a kill-during-save test, 500 iterations, gate": note the device count and that the 500 run is still owed).

### DL-01 Kill mid-record, 500 runs (D-085, DATA-REQ-048, BL-Q30). Not run: needs the founder's iPhone SE 3
- **Steps:** Start a recording, kill the app at a random 10 to 120 s (07 "Kill while recording"; this row said 2 to 60 s before 16 Oct), relaunch. 500 runs. Per run record: a draft exists, the file exists, its duration is within 1 s of the elapsed time, a hash is set, it plays (tap play on Tonight or in Settings, Recordings).
- **Expected:** zero lost. Every take that does not play is kept and listed in Settings, Recordings as "This take may not play. Export keeps the file." and is not shown on Tonight as ready (the launch sweep probes a killed take before it marks it ready, `capture/probe.ts`).
- **Record:** DL-01 row: runs, kept, lost, unplayable rate. An unplayable rate above 0 starts the container work (record to a container that survives a kill, convert on stop); 0 keeps the probe (it is cheap) and drops that work. Also note that the probe waits up to 4 s for a file to open and treats "never loaded" as unplayable: report any playable take it wrongly listed.
- **Simulator, 500 runs (the B2-11 gate):** `apps/mobile/e2e/kill/run-kill-harness.mjs --mode dl01` (RA-19-04, `apps/mobile/e2e/README.md` section 9) does these steps on an iOS simulator from the host, in four shards of 125, and judges each run from the database and files after the relaunch: kept (one row, a file with bytes, and the take plays: `afinfo` on the host reads its header and a length above 0), lost, doubled, fail (a take marked ready that will not open, F08-REQ-019). It needs 49 or more of every 50 to play to within 5 s of the kill (07), and after every relaunch it checks `PRAGMA integrity_check`, rows pointing at missing files and stored hashes, and judges every earlier take again. The device runs here stay: the simulator does not prove the SE 3's file system or a forced reboot (F04-REQ-048).
- **Defect found by reading the code, 16 Oct; fixed by #207 (S10, merged 17 Oct, 4a71c33), not yet seen on a device:** expo-audio 57.0.5 writes takes to `Documents/ExpoAudio/recording-<uuid>.m4a` (`ios/AudioUtils.swift` `createRecordingUrl`), but the launch sweep listed only the top of Documents. After a kill mid-take it could not see the file, dropped the `recording` draft as empty (`drop-empty-recording`), and the take was on neither Tonight nor Settings > Recordings. Since #207 the sweep lists both folders (`lib/capture/recordings.ts`) and checks the disk again before it drops a draft. `apps/mobile/test/qa-kill-harness.test.ts` pins it: the app's real sweep on ExpoAudio takes must keep every take (that test goes red if the sweep goes back to the top of Documents), and a listing that shows only the top of Documents must come back as a harness fail.
- **Open dependency for the DL-01 gate (freeze night, proposed Tue 3 Nov until the founder confirms): a take that survives a kill.** With the sweep fixed, DL-01 still fails on the current recorder. The first simulator run that armed (run 40076982108, 24 Oct, a 5-run smoke on #269's branch, not a gate run) kept all 5 killed M4A takes and none played, so the harness exited 1 with 0 lost. A kept take must play, and an `.m4a` cut off by SIGKILL will not open in `afinfo` (most likely no index: the recorder writes it on stop). Every such run is `kept-unplayable`, and the harness exits 1 under 07's 49 in 50 rule, though nothing is lost (the sweep keeps the file and lists it as "may not play"). This is the container work in the Record line above. The fix is ADR 0027's kill-safe recording format (S10, in progress); the gate needs it in the freeze build, or a recorded decision to amend 07's playable rule. Owners: S10 (format), coordinator (decision). **Resolved on the simulator, 27 Oct:** ADTS runs 40081955446 and 40089036324 kept 50 of 50 killed takes each, and all 100 played to within 5 s (M4A: 0 of 65 across four runs, and 0 of 5 more on #288's smoke 40090988241). Every iOS build cut from develop from the flip on records ADTS, build 1 included (ADR 0027), so the freeze build's DL-01 gate runs on it. The device half is DL-06.
- **Update:** PRD 7.4, BL-Q30.

### DL-02 Kill during save, 500 runs, random 0 to 400 ms (PRD 7.4). Not run: needs the device
- **Steps:** Save a letter and kill at a random 0 to 400 ms; relaunch. 500 runs.
- **Expected:** every letter exists exactly once, or is still a draft with its text and recording; zero lost, zero duplicated.
- **Simulator, 500 runs (the B2-11 gate):** `apps/mobile/e2e/kill/run-kill-harness.mjs --mode dl02 --runs 500 --point-runs 50`: typed letters, spoken letters hashed at Finish and spoken letters Save must hash, in turn; SIGKILL a random 0 to 400 ms after Save; plus 50 kills exactly at each of four crash points inside the save (`after-file-write`, `before-row`, `inside-transaction`, `after-commit`), because a random kill mostly lands after the commit. Each run is judged letter (once), draft (intact), lost, doubled or fail, with the whole-database check after every relaunch (`PRAGMA integrity_check`, no row pointing at a missing file, every audio hash matching: 07 "Kill during save"). The 50-run SE 3 set stays a device run (AL-03).
- **Record:** DL-02 row. **Update:** PRD 7.4, BL-Q30.

### DL-03 Restore drill onto a second phone (D-085, FT-39 extended, BL-284). Not run: needs two phones
- **Steps:** Phone A holds one spoken letter, one typed letter, one letter on the Recently deleted shelf (deleted 5 days ago: change the phone date, or wait) and one backdated to day 31, plus a speech model. Back up (iCloud, and an encrypted Finder backup), restore to Phone B. Note the database folder and whether iCloud Backup is on by default.
- **Expected:** counts equal; `raw_sha256` of every letter and the SHA-256 of every recording equal; the recording plays; the day 5 letter is on the shelf with the right "Erased on" date; the day 31 letter is erased at the first launch with no orphan recording reappearing as a draft; the speech model is absent and the app asks to download it, without a crash; Export runs.
- **Record:** DL-03 row with the hashes (fictional letters only). If the database or recordings are not in the backup, the founder decides on an in-app encrypted export (the option the debate keeps for v1.0.x or v1.1).
- **Update:** `docs/legal/DELETION_AND_EXPORT_SPEC.md` 2.2 (local purge), `docs/BACKLOG.md` BL-284.

### DL-04 Negative restore, and the clock guard (D-085). Not run: needs the device
- **Steps:** (a) Restore from a backup made before the last letter. (b) Delete a letter, set the phone date 40 days forward, open the app (it purges), set the date back 10 days, delete another letter and open the app; then set the date 31 days forward from the second deletion.
- **Expected:** (a) the app opens and says nothing false (no backup claim anywhere). (b) The first letter is erased (file and row); nothing is erased while the date is earlier than the last launch; the second letter is erased once the date passes day 30 after its own deletion.
- **Record:** DL-04 row. **Update:** `apps/mobile/test/store.shelf.test.ts` if behaviour differs.

### DL-05 Delete, shelf and erase by hand (D-085)
- **Steps:** Delete a spoken letter: the confirm shows "Keep it" as the large button. Delete it; open Settings, Recently deleted: first words, "Erased on" date, Restore, Erase now. Restore it and play the recording. Delete again, Erase now, confirm, then check Settings, Storage for the freed space and Settings, Export for "Last export".
- **Expected:** every step as named; VoiceOver reads each shelf row as one item and the sheet title first; with Dynamic Type at the largest size nothing is cut off; Erase now removes the recording at once (storage shrinks) and the letter does not return after a relaunch; Export shows "Not exported yet", then "Last export: {date}" after the share sheet opens.
- **Record:** DL-05 row with screenshots (fictional letters only). **Update:** journey flows J10, J15 (`docs/release/journey`).

### DL-06 ADTS on the device: V1's speech half, V3's Mac half and V4 playback (ADR 0027). Not run: needs the first device build cut after the flip on the founder's iPhone SE 3, and a Mac
Due before the build 2 freeze (Tue 3 Nov 13:00 UTC). Every iOS build cut from develop from the flip on records ADTS (`.aac`), build 1 included; run this on the first one on a device, whichever it is. If V1, V3 or V4 fails, the coordinator sets `RECORDING_CONTAINERS.ios` back to `'m4a'` before the freeze: that one line and nothing else. Takes already recorded as `.aac` stay `.aac` and keep playing.
- **Steps, V1 (speech):** on that build, record two finished takes in your own voice in a quiet room: one of about a minute, and one of 10 minutes or more (it is also V4's take). End each with a few seconds of talking, not a pause. Export them (Settings > Export), AirDrop the archive to the Mac, and put the two `.aac` files in `experiments/recordings/` (git-ignored; they stay on the Mac). For each take, from the repo root:
  - `afinfo experiments/recordings/<take>.aac`
  - `node --input-type=module -e "import { adtsFactsOfFile, v1Findings } from './apps/mobile/e2e/kill/adts-evidence.mjs'; const f = adtsFactsOfFile(process.argv[1]); console.log(JSON.stringify({ header: f.header, frames: f.frames, tail: f.tail, tailBytes: f.tailBytes, kbps: f.kbps, frameBytes: f.frameBytes, ftypAt4: f.ftypAt4, findings: v1Findings(f) }, null, 2))" experiments/recordings/<take>.aac` (Node 22.18 or later)
- **Expected, V1:** `findings` is empty:
  - the take starts `FF F1` or `FF F9`, AAC-LC, frequency index 3, channel configuration 1, with no `ftyp` at offset 4;
  - `tail` is `none`, because a finished take ends on a whole frame;
  - no frame is over 775 bytes.

  `afinfo` shows file type `adts`, data format `aac`, about 64 kbps. Frame bytes (minimum, mean, maximum) are the speech figures V1 asks for; the simulator only gave silence's (11 bytes).
- **Steps, V3 (the Mac half):** `npm run adts-parity -w @scribe/experiments`, once with no arguments (generated tones) and once with `-- --take experiments/recordings/<one-minute>.aac --long experiments/recordings/<ten-minute>.aac` (`experiments/README.md` section 8).
- **Expected, V3:** exit 0. Exit 2 means a condition does not hold; 3 means a case could not be decided.
- **Steps, V4 (playback, on the phone):**
  - Play the 10-minute letter. Note the duration the player shows against the true length (frames x 1024 / 48000, from the V1 command).
  - Drag the scrubber to about 1, 5 and 9 minutes, and note where playback resumes each time. Watch whether the shown position stops moving after a seek (`scrubbedTo`, `use-letter-player.ts:144-146`).
  - Once, swipe the app away 30 s into a recording, relaunch, and play that take from Tonight. Export it and run the V1 command on it, and note its `tail`. Listen stops and keeps a take when the app goes to the background (`listen.tsx:206-207`), so the swipe may end the take before the kill. A `cut` tail shows the kill landed mid-take; a `none` tail means this step did not show a killed take (a killed take can end on a whole frame too). The killed-take evidence is the simulator's 100 (ADR 0027, V2); this step shows the phone plays what the swipe leaves.
  - Play the 10-minute letter's listening copy (S1-19), and note its length.
- **Expected, V4:** the swiped take plays, and the listening copy's length equals the original's. Duration and seek errors are recorded in seconds, and so is any frozen position.
- **Record:** a DL-06 row for each part, with numbers only (no file names, no words):
  - V1: the findings and the frame bytes (minimum, mean, maximum);
  - V3: the exit code and `experiments/results/adts-parity/report.md`;
  - V4: the errors, and the swiped take's `tail`.

  Send them to the coordinator.
- **Update:** the ADR 0027 timeline. If a check fails, the line goes back to `'m4a'` before the freeze.

### S1-14 Low storage and Low Power Mode (TDD 03 FM-5)
- **Steps:** Fill the phone to under 1 GB free (large videos), start a long recording; then under 50 MB if you can. Turn Low Power Mode on and transcribe a 2-minute letter.
- **Expected:** A warning below 1 GB before a long recording; refusal below 50 MB; auto-finish below 20 MB with the take kept; nothing fails silently. Low Power Mode slows transcription but completes.
- **Record:** S1-14 row.
- **Update:** TDD 03 FM-5; PRD 7.7.

### S1-15 Speech model download (ADR 0015, ADR 0016, D-046)
- **Steps:** Choose English on a phone with no model: watch the download (574 MB turbo on a full-tier phone, 190 MB small on compact; F: `lib/models/catalog.ts`). On cellular only: it waits for Wi-Fi. Kill the app at about 40%, relaunch: it resumes. Airplane mode mid-download: it waits, then resumes. Time the SHA-256 check after the last byte. Remove the model in Settings > Recordings (or Storage) and confirm letters and recordings stay.
- **Expected:** Range-resumable download (no restart from 0); Wi-Fi by default; the hash check finishes without freezing the UI (ADR 0016 U: Hermes hashing of 574 MB "may take tens of seconds" unless the native `sha256File` is used); removal frees the space and the next spoken letter waits for words.
- **Record:** S1-15 row: download time on Wi-Fi, hash seconds, resume worked (yes or no).
- **Update:** ADR 0016 Risks (URLSession Range across Hugging Face redirects; Hermes hash time), ADR 0015 section 9.

### S1-16 Language packs on demand (decision 15, D-065)
- **Steps:** Settings > Spoken language: add Portuguese. Then Storage: only `text-rules.pt` is new. Add Hindi as the primary: its text pack plus its speech model (the Hindi small model once hosted, else the shared one). Turn on the `packDownloads` kill switch in the staging config (RELEASE.md 9) and add French. Remove a pack in Storage.
- **Expected:** Choosing a language downloads that language and nothing else; status words match the state (downloading, on this phone, waiting for Wi-Fi, paused); removing a pack keeps letters; English text rules are bundled (no download).
- **Record:** S1-16 row: bytes per pack as shown.
- **Update:** ADR 0016 section 4.3; `docs/ops/APP_SIZE.md` (packs are outside the app).

### S1-17 Whisper speed and memory on iPhone SE 3, 12 and 15 (ADR 0015 9 item 4, BL-043)
- **Steps:** Development build attached to Xcode (Debug navigator memory gauge) or Instruments (Allocations and VM Tracker). For each phone, each language the session covers (at least English, Hindi, Spanish; then Mandarin, French, Arabic, Portuguese), and each test recording length (30 s, 2 min, 5 min): Done, then time until Review shows words. Note peak memory, the thermal state at the end, and battery percent over 10 transcriptions. Read `Device.totalMemory` in the DevTools console on each phone.
- **Expected:** A 2-minute letter in 30 s or less and 2% battery or less on SE 3 (PRD 7.7, marked Unverified there); no jetsam kill on 4 GB phones with turbo, else the phone moves to the compact tier after 2 failures (`MEMORY_FAILURES_BEFORE_COMPACT`); `Device.totalMemory` on SE 3 and 12 is above 3.4e9 (else `FULL_TIER_MIN_RAM_BYTES` is wrong).
- **Record:** S1-17 table in the evidence file: phone x language x length -> seconds, peak MB, thermal state.
- **Update:** ADR 0015 section 9 item 4 and 6 (resident memory estimates), ADR 0001, `lib/models/tiers.ts` comment ("U: from published device specs"), PRD 7.7. If a language is too slow on SE 3: ROADMAP section 4 cut (small model or hold the language back) and the store listing language list.

### S1-18 Transcription spot check
- **Steps:** For each language, one scripted letter with the child's name, a family name and a number. Open Review.
- **Expected:** Names spelled as taught (dictionary), correct script (Hindi in Devanagari, Arabic right to left, Chinese characters, accents in Spanish, French, Portuguese), no added words; every machine edit underlined and reversible. This is a smoke check; the gates are the golden corpus (TDD 03 7.3).
- **Record:** S1-18 row: pass or the edit kinds that looked wrong (no letter text).
- **Update:** ADR 0014 or the language pack owner's notes; D-031 (Hindi script default) evidence.

### S1-19 AUSoundIsolation listening copy (ADR 0015 section 5, D-058)
- **Steps:** Record a letter with background noise (a fan, a kitchen). After its words are done and with the app open, wait for the clearer copy. Play original and clearer copy; compare timing with the words. Check that the original file's SHA-256 is unchanged (export the letter, S1-21, and compare with `audio_sha256`).
- **Expected:** The original is never altered; the clearer copy lines up with the original (ADR 0015 U: "latency compensation lines up"); on iOS 18 and later the HighQualityVoice sound type is used; the person can always play the original.
- **Record:** S1-19 row: offset heard (none, or about how many ms).
- **Update:** ADR 0015 section 5 and section 9 item 4.

### S1-20 Playback and Read together on device
- **Steps:** Play a letter with the ring/silent switch on silent, then with AirPods. Lock the phone during playback. Read together four times in a Free book.
- **Expected:** Playback is audible in silent mode (playback audio session) and stops cleanly on lock, since background playback is off (F: `enableBackgroundPlayback: false`); Read together uses Large Print; the fourth and later sessions open with no gate (Read together is free with no limit: M2, D-082; this replaced the D-009 gate on 4 Oct).
- **Record:** S1-20 row.
- **Update:** `src/lib/README.md` (audio-mode) if the session category is wrong.

### S1-21 Export: the ZIP on a Mac and on Windows (C-REQ-017, LEGAL-REQ-034)
- **Steps:** Settings > Export your book, offline. Share to Files, then AirDrop to the Mac; email or USB to the Windows PC. On the Mac: open with Archive Utility; open `README.txt` (TextEdit), `index.html` (Safari, offline), `book/*.pdf` (Preview), an audio file (QuickTime): `audio/*.aac` for iOS takes recorded since the ADTS flip (ADR 0027), `audio/*.m4a` for earlier ones. On Windows 11: extract with File Explorer; open `README.txt` in Notepad, `index.html` and the PDF in Edge, an `.aac` and an `.m4a` in Media Player. Repeat once with a child named in Devanagari (fictional, for example "आशा").
- **Expected:** Both systems open the archive without a third-party tool (no ZIP64 below 3.9 GB, F: `lib/export/pack.ts`); README lines show on Windows (CRLF, F); names in Devanagari display correctly in both file managers (A: the ZIP marks names as UTF-8); `manifest.json` hashes match. A one-year fixture (about 240 letters, 230 MB) exports in under 2 minutes on SE 3 (PRD 7.1 gate; needs a seeded year, so it may move to the release-candidate run).
- **Record:** S1-21 row: Mac and Windows result, export seconds and size.
- **Update:** `docs/legal/DELETION_AND_EXPORT_SPEC.md` (export format notes) through the legal owner; BACKLOG BL-Q21.

### S1-22 Two phones, one book: co-parent sync (PRD 7.3)
- **Steps:** Mama's phone invites Papa's phone (S1-09). Mama saves a letter while both are online; time until it appears on Papa's phone. Then Mama offline: save two letters ("Not sent yet"), kill, relaunch offline (still there), go online.
- **Needs:** a switch-on build on both phones and two Apple Accounts (Mama on Account A, Papa on Account B).
- **Expected:** online, both apps in the foreground with the book open, no try over 30 s (PRD V2 `06-nfr.md` section 4: p95 30 s, p99 60 s, replacing PRD 1.3's 5 s; 10 tries are a smoke, not the p95 gate); offline letters queue visibly, survive a kill and sync later; Papa never sees Mama's raw transcript (PRD-REQ-004) or her private letters.
- **Record:** S1-22 row: 10 timings in s from the save tap on A to the row on B, with the slowest; offline queue counts (saved offline 2, after the kill 2, after reconnecting on B 2); raw transcript or private letter visible on B (must be no). The budget is the one in the Expected line above; 10 tries are a smoke, not the p95 gate.
- **Update:** PRD 7.3 measured column; TDD 02.

### S1-23 VoiceOver walk (script V-01 to V-10; A-NFR-005 to -007, LEGAL-REQ-051)
VoiceOver on, Reduce Motion on, text size AX5 (Settings > Accessibility > Display & Text Size > Larger Text, largest). For each, swipe through every element, then use the rotor and the two-finger scrub (escape).
- **V-01 Gate:** focus lands on the question; Yes and No announce as choices, not selected; Continue announces dimmed until a choice.
- **V-02 Welcome and first run:** each step's heading gets focus; every field has a label; errors are announced; Add another child is reachable.
- **V-03 Tonight:** the greeting, the prompt, Speak and Type read in order; Another thought and Not much today reachable.
- **V-04 Listening:** the elapsed time is spoken once a minute, not every second; Done is reachable without hunting; "To Asha" is reachable. At AX5 the clock and "Listening." are pinned above Pause and Finish, so the screen says it is recording without a scroll (P4c S5, #289).
- **V-05 Review:** the text reads in order; each machine edit is reachable with an action to put it back; Add to book and Keep private are reachable. P4c (#289, #292):
  - The letter's paragraph reads as the kept words (for the seeded Asha letter, "Asha, today you held the spoon by yourself."), with no struck words, no "N buttons found" and no inline mark read as a button; each edit is reached through its row under "N small fixes", and the rows are open on arrival (S3).
  - When a row opens its card, note where focus goes: the card opens inside the letter, under the mark's line, and nothing moves focus to it (lens B B7). Record whether the card's "Put it back" can be reached without hunting.
  - Keep, then listen: "Kept in Month N. Added to Asha's book." is said once, in full, before the Book; the Book comes as the sentence ends (at least 3 s, at most about 8 s). Record whether iOS's `announcementFinished` fires for that sentence word for word: if every save waits the full 8 s, it does not (S6, lens A A3).
  - Start "Hear it", then Keep while it plays: the same sentence is said at once, not held until the Book (S6, lens B B4).
- **V-06 Sheets (Keep the book, sign-in, Terms, sensitive data, Plus gate):** focus moves to the sheet title; the escape gesture closes. The Keep needs Plus sheet (P6a, S22), from a third letter's Keep in Review:
  - Focus lands on "Keep adding to Asha's book"; swiping back reaches the held letter as one element ("To Asha, Month 7", its words, "From Mama", "Waiting"); nothing of Review behind the sheet is reachable. The escape gesture returns to the letter in Review with nothing held or kept.
  - "Keep it here for now" closes the sheet and Review; Tonight's card for that letter reads "Waiting to be kept." and "Keep it".
  - With StoreKit: See Plus opens Apple's subscription view over the sheet; after a sandbox purchase the purchase confirmation opens, the sheet goes and the same Review shows for the person to tap Keep. Offline: the offline line shows under See Plus, which stays. Record any presentation that does not open.
- **V-07 Apple's subscription sheet:** prices read with their periods (Apple's view, ASC doc D-10).
- **V-08 Book and letter:** chapter headers read title, count and authors; the letter reads date, text, signature; Delete then Undo announced.
- **V-09 Read together:** Previous, Next and Close reachable; playback state announced.
- **V-10 Settings:** each row reads label and value; every consent row is two taps from Settings; "If you are struggling" is reachable. P6a (S40, S46, S47): "If you are struggling" and Licenses push their own pages; each support line reads its name and how to reach it and starts a call; the early-version note is read once, after Version; Add a child reads its heading first, the waiting "Add this book" as dimmed with its reason as the hint, and a tap on it says the reason and moves focus to the empty field; the due-date card's "Set the birthday" and "Hide" are reachable, and "Hide this book" opens a plain confirm.
- **Expected:** All ten pass with no unlabelled element, no trapped focus and no truncated text at AX5 (letter text never capped, D-027).
- **Record:** S1-23 rows V-01 to V-10.
- **Update:** TDD 09 section 2 findings table (status), `docs/design/COMPONENT_LIBRARY.md` for component fixes.

### S1-24 Display settings and the network check
- **Steps:** (a) On SE 3 at AX5 with Bold Text and Increase Contrast, in Dark mode, walk Tonight, Review, Book, Settings, Plus gate, then Write and Listen (P4c, #289, #292), each also on a 6.1-inch phone:
  - The Keep needs Plus sheet (P6a, S22): at AX5 the held card is not tilted and the buttons are in the scroll under the words, nothing truncated; at the default size the card is tilted and the buttons are pinned; Reduce Motion fades the sheet in instead of sliding it. Add a child (S47) and a child's book settings (S46) at AX5: the date row and "Born today" wrap, the reason line sits above the primary.
  - Review: every mark in the letter (a struck "um,", a struck repeat, the heard word and the kept name, a word put back) is in the letter's serif at the letter's size, at every Dynamic Type size from the default to AX5, with a plain space outside each strike (M1).
  - Write with the keyboard up, then down. Emulated on the web at AX5 on an SE: "Add to Asha's book" is 260 pt tall, "Keep private" ends 18 pt below the screen, and the letter gets 0 pt with no keyboard; on a 402 by 874 screen the letter gets about 200 pt (lens B B2). Record the room the letter gets on each phone; if it is too small to read what is typed, the AX5 Write layout needs a follow-up (the destinations in the scroll after the letter, or the autosave line folded into the header).
  - Listen during a take started from a prompt. Emulated on an SE: the room's window is 63 pt, under one 114 pt prompt line; on 402 by 874 it is 270 pt (lens B B3). Record whether the whole prompt can be read by scrolling the room while recording. (b) Settings > Privacy & Security > App Privacy Report on (A: shows the domains each app contacted). Fresh install, first letter, Keep the book Not now, open Settings; read the report. Then turn Usage and crash reports on and off in Settings > Privacy and read it again.
- **Expected:** (a) No truncation, no overlapping controls, 44 pt targets (56 pt primary), contrast holds in dark (TDD 09 2.3 to 2.7). (b) Before consent: no PostHog or Sentry domain at all (PRD-REQ-016, LEGAL-REQ-003); after a yes, PostHog appears; after withdrawal, no new contact (PRD-REQ-018). Only expected hosts overall: the Supabase project, the packs and models host, the config and content functions.
- **Record:** S1-24 row with the domain list (domains only).
- **Update:** `docs/legal/app-store-privacy-labels.md` section 5 consistency check; `docs/legal/DATA_CLASSIFICATION.md` if an unexpected host appears.

### S1-25 iCloud device backup (D-033)
- **Steps:** Settings > [your name] > iCloud > Manage Account Storage > Backups > this iPhone: find Early Letters' size before and after downloading a speech model.
- **Expected:** Recordings count toward the backup (they live in a backed-up directory); speech models do not (excluded through ScribeFiles `setExcludedFromBackup`, F). The full restore-to-a-new-phone drill is BL-284 at the release candidate.
- **Record:** S1-25 row: backup size before and after the model.
- **Update:** D-033 copy ("on this phone and in your iPhone's own backup") stays true or goes to the content owner.

### S1-26 First run, downloads, links and the screen (D-087, debate Q-015; branch feat/mobile-first-run-permissions)
- **Steps:** (a) Fresh install, first run to the end. On the last step read the "Get your words ready" card: the size, "Download on Wi-Fi", "Not now". Check Settings > Storage shows nothing downloading and, in Settings > Privacy and Security > App Privacy Report, no models host contact yet. Tap Download on Wi-Fi on Wi-Fi; then repeat on a fresh install with Not now and record a letter: Review shows "Get your words ready" with the same button. (b) On a 3 GB phone or the SE 3 compact tier read the size on the card (190 MB model plus 1 MB, not 575 MB); on Hindi read the size (574 MB until our model is hosted). (c) Fill the disk to under size plus 1 GB: the card shows the space line and no button. (d) Start a download, switch to airplane mode, then back: it resumes from where it stopped. Lock the phone and wait: record whether bytes keep arriving in the background (unverified). (e) Off Wi-Fi with the Wi-Fi wait card showing, tap "Use mobile data": only that download uses data; Settings > Storage mobile-data switch stays off. (f) From Notes or Safari open `scribe://listen`, `scribe://review?draftId=x`, `https://earlyletters.com/listen`, `https://earlyletters.com/settings/delete-account`: each opens Tonight and nothing records. `https://earlyletters.com/j#t=<token>` still opens the coming-soon sheet. (g) Start a letter and let auto-lock run with the screen untouched: it stays on while recording. Pause: the screen may now lock (and the take then ends and is kept). In Read together play a recording: awake while it plays, locks again when paused or finished. (h) Leave the app during a take: Review opens on return with "The recording stopped when you left the app. Everything up to then is kept." (i) First run welcome has no "I was invited"; a child's settings have no "Family can read" switch; the Family tab, the Settings row and "Tell me when it's here" still work.
- **Expected:** Nothing downloads before the tap. Sizes come from the tier plan. Wi-Fi only, resume and the 1 GB reserve behave as before. No link opens a screen other than Tonight (or the invite landing and sign-in links). The screen is awake only while recording and while Read together audio plays.
- **Record:** S1-26 row per sub-step a to i, with the phone and iOS version.
- **Update:** `apps/mobile/src/lib/models/speech-consent.logic.ts` and DEBATES Q-015 if downloads do not survive a lock (the card then needs "keep the app open" copy and the keep-awake rule widens).

### S1-29 A child's book with two parents: the book row and the hide footer (S46; P6a, #312)
- **Needs:** a switch-on build on both phones, with Mama and Papa joined to Asha's book (S1-22's setup).
- **Steps:**
  - (a) On Mama's phone, open Settings > Asha's book. Read the "Write this book together" row, then tap it.
  - (b) Read the footer under "Hide this book". Tap Hide this book, read the confirm, then Cancel. Build 2 has no "Show this book again" yet, so do not confirm the hide on a drill phone.
  - (c) Only if a drill book has a co-parent whose member row has no signature: repeat (a) and (b) for that book. The server's `signs_as` is null there; the app does not let anyone save an empty signature.
  - (d) Turn VoiceOver on and swipe through the row and the footer.
- **Expected:**
  - (a) The row's value is Papa's own signature ("Papa"). The tap opens the Family tab, not the invite sheet.
  - (b) The footer reads "Hiding Asha's book quiets every reminder and message about Asha. Nothing is deleted. Hiding is only for you. Papa still sees Asha's book as before." The confirm is not styled as destructive.
  - (c) The value and the footer say "Your co-parent", and the row still opens the Family tab.
  - (d) VoiceOver reads the row's label and value, and reads the footer once.
- **Record:** S1-29 row: (a) to (d) yes or no, or "not run" for (c), with the phones and iOS versions. Take a screenshot of the row and the footer, fictional names only.
- **Update:** the S46 checkbox in `docs/design/EXPERIENCE_PASS_2026-10.md` (evidence column). Open an issue for any difference.

### S1-30 Licenses: the page opens and scrolls, and cold start does not move (S40; P6a, #312)
- **Steps:**
  - (a) On the SE 3, with the S1-03 method, run 10 cold starts on the build before the Licenses page (develop at 49e3d93) and 10 on this one.
  - (b) After a fresh cold start, open Settings > Licenses for the first time, and time from the tap to the list on screen. `lib/licences` reads the 565 KB list there and only there.
  - (c) Fling to the end of the list and back. Open one notice and close it.
  - (d) Repeat (c) at AX5, then with VoiceOver on: the group headings are headings, and each package row reads its name and its licence.
- **Expected:**
  - (a) Cold start p50 and p90 are within 50 ms of the build before, and inside the S1-03 budget, because nothing reads the list at launch.
  - (b) The page opens with no visible stall. Over about 300 ms on the SE 3 is a finding; its follow-up, already listed on #312, is to move `licences.json` to an on-demand asset.
  - (c) The list scrolls smoothly, with no blank rows after a fling.
  - (d) Nothing is truncated.
- **Record:** S1-30 row: cold start p50 and p90 in ms, before and after, 10 samples each; first open in ms; smooth scroll yes or no; AX5 and VoiceOver yes or no.
- **Update:** `docs/ops/APP_SIZE.md` if the start time moves; the follow-up line on #312.

### B1-01 Backup spike WP-F08-B1 (F08 section 11.2; M16). Two iPhones, one Apple Account
- **Needs:** S05's spike build of `apps/mobile/modules/scribe-keys` (development client) on both phones; both phones signed in to the same Apple Account with iCloud Keychain on; Wi-Fi; a 15 MB test file made from a fictional recording (P-08); the staging Storage bucket S05 names for the spike. S05 pairs with the tester (mode `pair`).
- **Steps:** (a) On phone A create the synchronizable test item; note the clock time. On phone B poll until it appears; note the time. Delete it on phone A; note when it is gone on B. Repeat once in the other direction. (b) On the SE 3, seal and encrypt the 15 MB file in 64 KiB AES-GCM segments five times; note each time and the thermal state. (c) Start the resumable upload of the file; kill the app at about half; relaunch; note whether it resumes from the last finished part or from zero, and the part size. (d) If an iOS 17 phone is at hand, run the HPKE availability check on it; otherwise record "not measured: no iOS 17 phone" (SE 3 B is ordered at T12).
- **Expected:** (a) the item appears on B within 2 minutes (F08 assumption A2) and deletion reaches both phones; (b) about 1 s or less per 10 MB on SE 3 (F08 section 9, an assumption); (c) the upload resumes without re-sending finished parts.
- **Record:** B1-01 row in the session's evidence file (WP-F08-B1): Keychain item made on A at hh:mm and seen on B at hh:mm (minutes); deleted on A and gone from B (yes, no, minutes); 15 MB encrypt time on the SE 3 in s; upload resumed after the kill (yes, no; parts re-sent); HPKE on iOS 17 (yes, no, or "not measured: no iOS 17 phone"). No key material, item names or tokens.
- **Update:** F08 section 13 A2 and section 9 (through the PM lane), and the owner-backup ADR draft (T13). A failure of (a) is a stop for the per-author key design and goes to the founder and S05 the same day.

---

## Part 2. Money, account and notifications (session 2, can follow on the next days)

### S2-01 to S2-12 StoreKit and Apple's sheets
Run the twelve checks D-1 to D-12 in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 11, in that order, with a TestFlight build of the production profile (bundle id `com.earlyletters.scribe`; the `.dev` and `.preview` ids have no products, so use the StoreKit file for those). Map: S2-01 = D-1 (gate then Apple's sheet; neither plan selected, C-REQ-022), S2-02 = D-2 (monthly trial), S2-03 = D-3 (Read together with Plus), S2-04 = D-4 (Manage subscription), S2-05 = D-5 (Restore on a second iPhone within 10 s, C-REQ-020), S2-06 = D-6 (Family Sharing: the co-parent gets Plus, D-053), S2-07 = D-7 (refund sheet), S2-08 = D-8 (airplane mode with Plus), S2-09 = D-9 (expiry: everything keeps working, LEGAL-REQ-050), S2-10 = D-10 (AX5 and VoiceOver on the sheet), S2-11 = D-11 (dark mode), S2-12 = D-12 (iOS 16 device only if the target stays 16.4). The ASC table uses D-7 to D-10 twice (F: 15 Oct); the first four of those rows get their own ids here: S2-18 = the first D-7 (delete and reinstall, record whether the Keychain count survives), S2-19 = the first D-8 (iCloud restore keeps the free count), S2-20 = the first D-9 (airplane mode at the Keep sheet), S2-21 = the first D-10 (redeem an offer code). (S2-17 is the plan reminders item below.) Request to S06: renumber the ASC table so each check has one id.
- **Bundle id:** products exist only on the app record they were created on. A TestFlight build from the `testflight` profile is `com.earlyletters.scribe.preview` (F: `docs/release/TESTFLIGHT.md`), so either the products are set up on that record too, or S2-01 to S2-20 run against the StoreKit configuration file in a development build and every row says "StoreKit file, not sandbox".
- **Record:** the evidence file (S2-01 to S2-12) and the date and build in the ASC doc's table.
- **Update:** `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` (turn its U marks into V where the sheet confirms them); ADR 0013 "verify on device" for C-REQ-022.
- Note (V): apps installed from TestFlight use the sandbox automatically, and subscriptions renew every day, up to 6 times in a week, whatever their length (Apple, "Testing subscriptions and In-App Purchases in TestFlight"). Billing retry needs a Sandbox Apple Account's settings.

### S2-13 Account deletion on a real account (C-REQ-019, LEGAL-REQ-029)
- **Steps:** Signed in with Plus renewing (sandbox): Settings > Delete account. Read the per-book lines, Export first, the Apple billing notice with Manage subscription; type the word; confirm. Sign in again within the 30 days and Cancel deletion. Then, on staging, let one fixture account run to completion and run `scripts/ops/verify-deletion.ts` (ops README step 7).
- **Expected:** Export offered first; the subscription notice appears only when Plus will renew; the co-parent's copy of a shared book stays (DATA-REQ-012); cancel restores everything; after completion nothing remains but pseudonymised acceptances.
- **Record:** S2-13 row.
- **Update:** `docs/ops/runbooks/stuck-deletion.md` if a step stalls. Note (F, board 20:56): the `apple-token` Edge Function that revokes Apple's token on deletion is not built yet (SECURITY.md 5).

### S2-14 Sign out and Apple revocation (A-REQ-033, AUTH_SETUP 11.8)
- **Steps:** Airplane mode, save a letter (unsynced), Settings > Account > Sign out. Then online: iOS Settings > Apple Account > Sign in with Apple > Early Letters > Stop using; relaunch.
- **Expected:** Sign out waits and explains; no letter lost. After revocation the app signs out once letters have uploaded.
- **Record:** S2-14 row.
- **Update:** AUTH_SETUP 11.8.

### S2-15 Reminders and notifications (C-REQ-001 to -009, D-025)
- **Steps:** Settings > Reminders: turn on; the priming sheet, then the iOS prompt; choose a time 5 minutes ahead and wait with the phone locked. Change the time zone in iOS Settings; check the next reminder keeps local time. Look at the lock screen text. Turn Reminders off. Note: US daylight saving time ends on Sunday 1 Nov 2026 (A), right before submission week; check one reminder across it.
- **Expected:** One iOS prompt, only after the priming sheet (C-REQ-001); delivered at the chosen local time; none between 21:30 and 07:00; no child name on the lock screen by default (D-025); tapping opens Tonight; off means nothing is scheduled. F: the priming card after the first letter is not on Tonight yet (only Settings), see `apps/mobile/e2e/TESTID_REQUESTS.md` "Not mounted yet".
- **Record:** S2-15 row with delivery times.
- **Update:** PRD C-REQ rows; `src/lib/reminders` notes.

### S2-16 Passkeys (only before turning `EXPO_PUBLIC_PASSKEYS` on; AUTH_SETUP 11.7)
- **Steps and expected:** as AUTH_SETUP 11.7 (add a passkey with Face ID, sign out, sign in with it, Supabase lists it).
- **Record / Update:** S2-16 row; AUTH_SETUP section 7 assumption on the origin becomes V or the flag stays off.

---

### S2-17 Plan reminders and the purchase confirmation with Save a copy (G-15, D-094; BL-342; Q-003 memo section 5; LEGAL-REQ-046 to -049 as amended; PR #121)
Needs a TestFlight build with PR #121, and a Sandbox Apple Account set to the 1-hour renewal rate (App Store Connect > Users and Access > Sandbox > the account > Subscription Renewal Rate, V). Ported from `auto/2026-10-05-fixes` (`d1cbddb`) and adapted to D-083 (no price in app copy) and D-094 (reminders are a courtesy).
- **Steps:**
  1. A sandbox account that never had a trial: keep two letters, then keep a third; at the Keep gate tap See Plus and buy `plus.monthly`.
  2. On the confirmation screen (it opens over Review): read the plan, the free-until date, the cancel-by date (that date minus 24 hours), how to cancel, Apple's role, Family Sharing and the courtesy line about reminders. Tap "Save a copy": the share sheet; send it to Notes. Tap "Remind me before the free period ends" if shown: the iOS notification prompt follows only on that tap. Tap Done: back on Review; tap Keep.
  3. Settings, Plan: the note with its date once a window is open; the "Save a copy of the terms" row.
  4. Move the phone's date to one hour after the trial-week target (`E - 7d`), with the phone locked; then set it back.
  5. Turn off auto-renew in Apple's Manage subscription sheet; relaunch.
  6. Repeat 1 to 3 with `plus.annual` (2-month trial) on a second sandbox account.
  7. A co-parent or family member who has Plus through Family Sharing: open Settings, Plan.
  8. Turn notifications off for the app in iOS Settings; open Settings, Plan.
- **Expected:** (2) every line present and correct, **no price and no "free trial" anywhere** (D-083), the copy in Notes reads the same, no child name and no letter text; the held letter is kept only after the Keep tap; (3) the note lists the dates; (4) one notification on the lock screen with no child name and no price, and tapping it opens Settings, Plan; a window that has passed is skipped, never sent late; (5) pending reminders are gone; (6) the annual and long-trial reminders follow the memo table (`E-18d` long trial, `E-4d 12h` trial final; `E-30d 12h` and `E-7d` renewal); (7) no reminders and no "Save a copy" for a family-shared plan; (8) the "Allow notifications" row appears, and the dates are still on the screen.
- **Record:** S2-17 row: the dates shown versus the memo table, the notification text as seen, and whether any reminder came late or not at all (the courtesy wording in D-094 must stay true).
- **Update:** BACKLOG BL-342 device check; FT-39 evidence; `docs/legal/memos/q-003-subscription-notices.md` known gaps if behaviour differs.
- Note: TestFlight sandbox renews every day up to 6 times in a week, and a Sandbox Apple Account's renewal rate compresses a year to at most an hour (V: Apple, "Subscription renewal rate in TestFlight" and "Test in-app purchases"), so real-calendar reminder dates can be checked only by moving the phone's date or in the planner's unit tests (`apps/mobile/test/billing-plan-reminders.test.ts`, on `develop` through PR #121, which walk a synthetic year).

## Part 3. TestFlight beta (C0 internal from T10, C1 external from T22 in `08-delivery.md` 2.1; D-045)

### TF-01 App size from Apple's numbers (decision 15, D-065)
- **Steps:** When the first production-profile build finishes processing in App Store Connect, read its download sizes per device variant (TestFlight > the build > Build Metadata, A for the label). Also produce the App Thinning Size Report (`xcodebuild -exportArchive` with `thinning` set to `<thin-for-all-variants>`, APP_SIZE 2) and run `npx tsx scripts/size/measure.ts --thinning-report "App Thinning Size Report.txt"`.
- **Expected:** Largest variant download under 40 MB.
- **Record:** TF-01 row: largest download MB, install MB, JS bundle MB.
- **Update:** `docs/ops/APP_SIZE.md` section 3 (the native binary is "not measured yet") and the release notes line in RELEASE.md.

### TF-02 Export compliance
- **Steps:** Upload the build. If App Store Connect asks the encryption questions, the Info.plist key is missing.
- **Expected:** With `ITSAppUsesNonExemptEncryption = false` (request B-4) no questionnaire appears (V: Apple, "a Boolean value indicating whether the app uses encryption"; "If you don't have the key... App Store Connect walks you through an export compliance questionnaire every time").
- **Record:** TF-02 row. **Update:** RELEASE.md 6.5.

### TF-03 Update over an older build keeps everything
- **Steps:** Install build N from TestFlight; make two letters (one spoken, one typed), a second child, a language pack, Plus in sandbox. Install build N+1 from TestFlight over it.
- **Expected:** Letters, recordings, children, settings, packs and Plus all remain; the local database migrates once (`lib/db/migrations.ts`, `PRAGMA user_version`).
- **Record:** TF-03 row. **Update:** `src/lib/README.md` Database if a migration fails.

### TF-04 Smoke list for every TestFlight build (15 minutes, SE 3)
1. Fresh install, gate Yes, first run, a spoken letter with words (model already on the phone from an earlier install is not enough: delete first).
2. A typed letter; Review; add to the book.
3. Book, a letter, play it; Read together once.
4. Sign in (Apple), consent, sync on; a second phone sees the letter.
5. Export offline; the ZIP opens in Files.
6. Settings: each row opens; Privacy switch off by default.
7. Kill during save once; relaunch; nothing lost.
8. Airplane mode cold start.
- **Record:** TF-04 row per build. **Update:** none (regressions become issues).

### TF-05 iPad compatibility mode
- **Steps:** Install the TestFlight build on an iPad; run TF-04 items 1 to 3 and 6, in portrait and landscape.
- **Expected:** The iPhone layout runs without clipped controls; the Plus sheet and sign-in sheets present correctly.
- **Record:** TF-05 row. **Update:** `docs/design/COMPONENT_LIBRARY.md` if a sheet breaks.

### TF-06 The oldest and the newest iOS
- **Steps:** TF-04 on the oldest supported iOS (Q-002) and on the newest iOS.
- **Expected:** Both pass; on iOS 16.4 (if kept) the Plus gate says Plus needs iOS 17 (ASC doc D-12).
- **Record:** TF-06 row. **Update:** DEBATES Q-002 evidence.

### TF-07 Feedback and crash channels
- **Steps:** From the TestFlight app send a screenshot feedback and a crash feedback (force a crash only in a development build). Check App Store Connect > TestFlight > Feedback and Crashes.
- **Expected:** Both arrive. Risk (TDD 07 OQ-4, still open): screenshot feedback can capture letter text and child names; the welcome note tells testers not to screenshot letters and to use Settings > Help instead.
- **Record:** TF-07 row. **Update:** RELEASE.md 5 (tester note).

### TF-08 External group and Beta App Review (C1)
- **Steps:** Create the external group (an internal group must exist first, V), fill Test Information (beta description, feedback email, contact, sign-in notes from RELEASE.md 6.4), add the build, Submit Review.
- **Expected:** The first build gets a full review; later builds of the same version may not (V); at most six builds per 24 hours can go to TestFlight review (V); builds expire after 90 days (V).
- **Record:** TF-08 row: submitted and approved times. **Update:** ROADMAP week 3 dates if review is slow.

### TF-09 Cohort exits (TDD 07 11.4 adjusted to D-045 and ROADMAP 2.x)
- **C0 to C1:** 5 days of C0 with no open S0, crash-free sessions 99.5% or more (App Store Connect and TestFlight crash data, not only consenting users), S1-13 passed, TF-04 green on the build sent to C1.
- **C1 to submission (Thursday 29 Oct review):** zero open S0 and S1; crash-free sessions 99.8% or more; no fidelity complaint traced to a machine edit; at least one co-parent pair finished the invite without help; S1-17 numbers accepted for every listed language; TF-01 under 40 MB; RELEASE.md section 6 checklist complete.
- **Record:** TF-09 in the evidence file of the review day. **Update:** ROADMAP and the founder's go or no-go note in DECISIONS (coordinator).

---

### TF-10 Privacy manifest in the archive (G-23, security review L7, LEGAL-REQ-043; ITMS-91053)
#100's preflight checks the manifest in the config and in a prebuilt native project; this row checks the real archive.
- **Steps:** On a Mac, download the first production build's `.ipa` from EAS. (a) Unzip it and open `Payload/*.app/PrivacyInfo.xcprivacy` (plist): compare with `ios.privacyManifests` in `apps/mobile/app.config.ts` and `docs/legal/app-store-privacy-labels.md`. (b) List every bundled manifest: `find Payload -name PrivacyInfo.xcprivacy`. (c) In Xcode, Window > Organizer > the archive > Generate Privacy Report (A: menu location from Apple's WWDC23 session "Get started with privacy manifests"); save the PDF outside the repo. (d) After the upload in TF-02, read App Store Connect's email for any "ITMS-91053: Missing API declaration" warning.
- **Expected:** `NSPrivacyTracking` false, no tracking domains, every required-reason category declared in `app.config.ts`, and no collected data types (v1.0 is "Data Not Collected", D-088, D-095); every SDK Apple lists as needing a signed manifest has one; no ITMS-91053 email.
- **Record:** TF-10 row: manifests found (count), any reason missing, the email result.
- **Update:** `docs/legal/app-store-privacy-labels.md` (legal owner); `app.config.ts` through the mobile owner if a reason is missing.

### TF-11 No analytics in the build (D-095, D-088; PR #118)
- **Steps:** On a TestFlight build, with a proxy that shows the phone's traffic (or the Xcode network instrument), run first run, keep two letters, and close and reopen the app on three different days (move the date). Open Settings, Privacy.
- **Expected:** no "Help us make it better?" sheet ever appears; Settings, Privacy has no usage switch; no request to any PostHog host (or any analytics host) in the traffic. The only network destinations are the docs, pack and speech model hosts, and Apple.
- **Record:** TF-11 row: the hosts seen in the traffic.
- **Update:** the data map and `docs/legal/app-store-privacy-labels.md` if any other host appears.

## Facts and assumptions this plan rests on

| Item | Status |
|---|---|
| Maestro cannot run on a physical iPhone (2.11.0) | V (Maestro changelog) |
| TestFlight: up to 100 internal testers with an App Store Connect role, up to 10,000 external; the first external build needs App Review; 6 review submissions per 24 h; builds expire after 90 days | V (Apple TestFlight page and App Store Connect Help) |
| TestFlight purchases run in the sandbox; subscriptions renew daily, up to 6 times | V (App Store Connect Help) |
| `ITSAppUsesNonExemptEncryption` skips the export questions | V (Apple developer documentation) |
| EAS syncs Sign in with Apple and Associated Domains capabilities on `eas build` | V (Expo "iOS capabilities") |
| iPhone SE 3 and iPhone 12 have 4 GB RAM, iPhone 15 has 6 GB | A (public specifications) |
| App Privacy Report lists the domains an app contacted | A |
| `globalThis.expo.modules.<Name>` exposes native modules in the DevTools console | A |
| The ZIP marks file names as UTF-8 so Windows shows Devanagari | A |
| US daylight saving time ends 1 Nov 2026 | A |
| Declared Age Range: F, not used anywhere in `apps/mobile` today, although PRD 6.1 mentions "an under-18 Declared Age Range signal" | F |
