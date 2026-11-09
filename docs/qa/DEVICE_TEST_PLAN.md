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
| S1-27 sign-in and Account screens (P8a) | Switch on; staging; a drill account; Larger Text and VoiceOver | Build 2 (B2-10) |
| S1-28 the Family tab, invite and joining a book (P8b) | Switch on; staging; two iPhones on two Apple Accounts (a fresh install for the joiner) | Build 2 (B2-10) |
| WP-F08-B1 backup spike | S05's spike build; two iPhones on one Apple Account | W2 (T11) |
| S1-35 Delete account as a sole parent: the deletion screen and Cancel deletion (M1) | Switch on; staging; a drill account with one book and no co-parent | Build 2 (B2-10) |
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
- **Expected:** zero lost. Every take that does not play is kept and listed in Settings, Recordings as "This recording may not play. Export keeps the file." and is not shown on Tonight as ready (the launch sweep probes a killed take before it marks it ready, `capture/probe.ts`).
- **Record:** DL-01 row: runs, kept, lost, unplayable rate. An unplayable rate above 0 starts the container work (record to a container that survives a kill, convert on stop); 0 keeps the probe (it is cheap) and drops that work. Also note that the probe waits up to 4 s for a file to open and treats "never loaded" as unplayable: report any playable take it wrongly listed.
- **Simulator, 500 runs (the B2-11 gate):** `apps/mobile/e2e/kill/run-kill-harness.mjs --mode dl01` (RA-19-04, `apps/mobile/e2e/README.md` section 9) does these steps on an iOS simulator from the host, in four shards of 125, and judges each run from the database and files after the relaunch: kept (one row, a file with bytes, and the take plays: `afinfo` on the host reads its header and a length above 0), lost, doubled, fail (a take marked ready that will not open, F08-REQ-019). It needs 49 or more of every 50 to play to within 5 s of the kill (07), and after every relaunch it checks `PRAGMA integrity_check`, rows pointing at missing files and stored hashes, and judges every earlier take again. The device runs here stay: the simulator does not prove the SE 3's file system or a forced reboot (F04-REQ-048).
- **Defect found by reading the code, 16 Oct; fixed by #207 (S10, merged 17 Oct, 4a71c33), not yet seen on a device:** expo-audio 57.0.5 writes takes to `Documents/ExpoAudio/recording-<uuid>.m4a` (`ios/AudioUtils.swift` `createRecordingUrl`), but the launch sweep listed only the top of Documents. After a kill mid-take it could not see the file, dropped the `recording` draft as empty (`drop-empty-recording`), and the take was on neither Tonight nor Settings > Recordings. Since #207 the sweep lists both folders (`lib/capture/recordings.ts`) and checks the disk again before it drops a draft. `apps/mobile/test/qa-kill-harness.test.ts` pins it: the app's real sweep on ExpoAudio takes must keep every take (that test goes red if the sweep goes back to the top of Documents), and a listing that shows only the top of Documents must come back as a harness fail.
- **Open dependency for the DL-01 gate (freeze night, Tue 3 Nov, confirmed by the founder on 30 Oct, D-130): a take that survives a kill.** With the sweep fixed, DL-01 still fails on the current recorder. The first simulator run that armed (run 40076982108, 24 Oct, a 5-run smoke on #269's branch, not a gate run) kept all 5 killed M4A takes and none played, so the harness exited 1 with 0 lost. A kept take must play, and an `.m4a` cut off by SIGKILL will not open in `afinfo` (most likely no index: the recorder writes it on stop). Every such run is `kept-unplayable`, and the harness exits 1 under 07's 49 in 50 rule, though nothing is lost (the sweep keeps the file and lists it as "may not play"). This is the container work in the Record line above. The fix is ADR 0027's kill-safe recording format (S10, in progress); the gate needs it in the freeze build, or a recorded decision to amend 07's playable rule. Owners: S10 (format), coordinator (decision). **Resolved on the simulator, 27 Oct:** ADTS runs 40081955446 and 40089036324 kept 50 of 50 killed takes each, and all 100 played to within 5 s (M4A: 0 of 65 across four runs, and 0 of 5 more on #288's smoke 40090988241). Every iOS build cut from develop from the flip on records ADTS, build 1 included (ADR 0027), so the freeze build's DL-01 gate runs on it. The device half is DL-06.
- **Update:** PRD 7.4, BL-Q30.

### DL-02 Kill during save, 500 runs, random 0 to 400 ms (PRD 7.4). Not run: needs the device
- **Steps:** Save a letter and kill at a random 0 to 400 ms; relaunch. 500 runs.
- **Expected:** every letter exists exactly once, or is still a draft with its text and recording; zero lost, zero duplicated.
- **Simulator, 500 runs (the B2-11 gate):** `apps/mobile/e2e/kill/run-kill-harness.mjs --mode dl02 --runs 500 --point-runs 50`: typed letters, spoken letters hashed at Finish and spoken letters Save must hash, in turn; SIGKILL a random 0 to 400 ms after Save; plus 50 kills exactly at each of four crash points inside the save (`after-file-write`, `before-row`, `inside-transaction`, `after-commit`), because a random kill mostly lands after the commit. Each run is judged letter (once), draft (intact), lost, doubled or fail, with the whole-database check after every relaunch (`PRAGMA integrity_check`, no row pointing at a missing file, every audio hash matching: 07 "Kill during save"). The 50-run SE 3 set stays a device run (AL-03).
- **Record:** DL-02 row. **Update:** PRD 7.4, BL-Q30.

### DL-03 Restore drill onto a second phone (D-085, FT-39 extended, BL-284). Not run: needs two phones
- **Steps:** Phone A holds one spoken letter, one typed letter, one letter on the Recently deleted shelf (deleted 5 days ago: change the phone date, or wait) and one backdated to day 31, plus a speech model. Back up (iCloud, and an encrypted Finder backup), restore to Phone B. Note the database folder and whether iCloud Backup is on by default. Open Phone B twice: force quit the app and start it cold between the opens (the purge runs once per process, so coming back from the background does not count as an open).
- **Expected:** counts equal; `raw_sha256` of every letter and the SHA-256 of every recording equal; the recording plays; the day 5 letter is on the shelf with the right "Erased on" date; the day 31 letter is erased at the first or second launch on Phone B (the purge counts time by the last launch record, which comes with the backup; if none came, the first launch only records the time) with no orphan recording reappearing as a draft; the speech model is absent and the app asks to download it, without a crash; Export runs.
- **Record:** DL-03 row with the hashes (fictional letters only). If the database or recordings are not in the backup, the founder decides on an in-app encrypted export (the option the debate keeps for v1.0.x or v1.1).
- **Update:** `docs/legal/DELETION_AND_EXPORT_SPEC.md` 2.2 (local purge), `docs/BACKLOG.md` BL-284.

### DL-04 Negative restore, and the clock guard (D-085). Not run: needs the device
- **Steps:** Every "open the app" here is a cold start: force quit the app from the app switcher, then open it (the purge runs once per process, so coming back from the background does nothing and would log a false FAIL). (a) Restore from a backup made before the last letter. (b) Delete a letter, set the phone date 40 days forward, open the app, force quit and open it again. Set the date back 10 days, delete another letter, open the app, force quit and open it again; then set the date 31 days forward from the second deletion and open the app, force quit and open it again. (c) QE-05: set the date to today and open the app once, so the launch record is not still ahead from (b). Delete a letter, set the date 40 days forward (the shelf is 30 days, `SHELF_DAYS`, so any jump of 31 days or more exercises the same rule; a year ahead is not needed, and a TestFlight build, which lasts 90 days, may refuse to open that far on), open the app, set the date back to today, then open the app twice, force quitting between the opens. Then delete a second letter, set the date 31 days forward from that deletion, and open the app twice, force quitting between the opens.
- **Expected:** (a) the app opens and says nothing false (no backup claim anywhere). (b) The first letter is still on the shelf after the first open on the jumped date and erased (file and row) at the second; nothing is erased at the first open on the earlier date; the second letter is erased at the second open past day 30 after its own deletion. (c) The first letter stays on the shelf at every open of the jumped (40 days ahead) and corrected dates. The second letter is still on the shelf after the first open 31 days on, and erased at the second open (purging resumed).
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

### S1-15a TF1-DL First-run download card lines, stalls and resume (PR #541, TestFlight build 1 "Getting ready, 0%")
- **Steps:** Fresh install, finish first run to "The book is open.", tap Download on Wi-Fi, keep the card on screen.
  1. On a normal Wi-Fi network: watch the card from the tap to the end.
  2. Turn Wi-Fi off mid-download (cellular only, "Use mobile data" off).
  3. Turn a VPN on (any), on Wi-Fi, before tapping (a second fresh install, or after Remove in Storage). Note what the card says.
  4. Mid-download, send the app to the background for 2 minutes, then return.
  5. Slow Wi-Fi under 2 Mbps (Network Link Conditioner "3G" or a 1 Mbps profile on the router): let it run at least 10 minutes.
  6. Settings > Storage, cancel or remove the model mid-download, then go back to a screen with the card or Review.
  7. Book, Review (a recording waiting for its words) and Settings > Storage (the English row) while the model downloads or waits: the same rule applies there.
- **Expected:** The card never shows "0%". Before bytes move: "Waiting to start", then "Downloading", then "Getting ready, n%" with a bar that moves. "Almost ready. Checking the download." and "Finishing" at the end, then "On this phone, 575 MB". Wi-Fi off: "Waits for Wi-Fi, 575 MB", no bar, no percent; it carries on by itself when Wi-Fi returns. Background and return: it carries on from where it was (the percent does not drop to the start). Slow Wi-Fi: the percent keeps moving and the download finishes, however long it takes. Any stop: a calm line with Try again ("Paused" after a cancel); after several automatic tries on a link that keeps stopping, "The download stopped. Tap Try again when the Wi-Fi is steady." VoiceOver announces each change of state once, never each percent; a stop is announced once, with its Try again line. Book, Review and Settings show their wait line, never 0%.
- **Record:** S1-15a row: each step's lines as seen (no letter text). Step 3: did the card say "Waits for Wi-Fi" on Wi-Fi with a VPN (yes or no: confirms or clears the expo-network `UNKNOWN` hypothesis). Step 5: link speed and total minutes.
- **Update:** If step 3 says yes: open an issue for `packs/expo-adapter.ts` `toConnection` (a Wi-Fi path that also uses an "other" interface reads `UNKNOWN`). If step 5 fails: STALL_MS and WASTED_CHUNKS_PER_RUN in `packs/engine.ts`.

### S1-15b TF1-WAIT First-run wait: the bar, the "start now" line and VoiceOver (PR #626, founder's TestFlight report)
- **Needs:** a TestFlight build of the `testflight` profile (servers off, English speech model downloads on first run); a throttled link so the download does not finish during steps 1 to 5 (Network Link Conditioner "3G" profile, or a 1 Mbps profile on the router; at 1 Mbps the 575 MB model takes over an hour); iPhone SE (3rd generation, `se3`) for every step and a larger-screen iPhone (`ip15`) for steps 1 and 4. Reduce Motion, VoiceOver and Larger Text are system settings that survive a reinstall: turn Reduce Motion off after step 2; VoiceOver stays on through steps 3 to 5 on purpose (step 4 at AX5 is how a VoiceOver user meets the card), then turn VoiceOver and Larger Text off. The Wi-Fi hold in step 5 needs working cellular data on the phone; without it the card says it carries on when you are back online.
- **Steps:** Fresh install, finish first run to "The book is open.", tap "Download on Wi-Fi", keep the card on screen.
  1. Watch the first minute of the download.
  2. A second fresh install (the card appears only at the end of first run, so Remove in Storage does not bring it back): Settings > Accessibility > Motion > Reduce Motion on; repeat step 1. Turn Reduce Motion off afterwards.
  3. A third fresh install: VoiceOver on before tapping "Download on Wi-Fi"; then focus the card, swipe to the bar and leave it for 2 minutes. Leave VoiceOver on through step 5.
  4. A fourth fresh install: Settings > Accessibility > Display & Text Size > Larger Text, Larger Accessibility Sizes, the largest size (AX5), before tapping "Download on Wi-Fi"; look at the card while the download runs. Keep VoiceOver on; turn Larger Text back down after step 5.
  5. Wi-Fi hold (a fresh install with VoiceOver on): on a running download, turn Wi-Fi off (cellular only; leave the app's own "Use cellular data" switch at its default, off), wait a minute, turn Wi-Fi on. Then turn VoiceOver off.
  6. Last, because it leaves the card (a fresh install). The line says "Downloading" only until the first percent, which is about 45 seconds at 1 Mbps (1% of 575 MB), counted from when the bar first shows; so record first and be quick. With the download running, tap "Write the first one"; on Tonight tap Speak, record 10 s, Finish. On Review look at the wait line first, then tap "Keep the recording". Then open the Book and look at its wait line. Then go back to Tonight, tap Type, type a line, tap "Add to {child}'s book" (the letter is saved and you land on the Book). Then lift the throttle and wait for the download to finish.
- **Expected:**
  1. Under the card's line: "You can start now. Your voice is kept, and the words follow." At "Waiting to start" no bar is drawn. Once bytes move the bar appears and its fill grows smoothly with the percent. Below 1% no number shows and the fill is a sliver (the true fraction, a fraction of a point wide): that is expected. From 1% the fill is clearly visible and moves.
  2. With Reduce Motion on, the fill steps instead of gliding.
  3. VoiceOver says the state once when it changes (for example "Waiting to start", then "Downloading"), never each new percent. Focusing the bar reads its label and, from 1%, the percent. The later announcement "Almost ready. Checking the download." cannot appear on a throttled link inside 2 minutes; it is covered by `first-run-wait.test.ts` (line 138).
  4. At AX5 the "start now" line wraps in full, with nothing cut off, and the card scrolls; the pinned button stays reachable. The footnote is visible only while the words are not here yet, so check it during the download.
  5. Wi-Fi off: "Waits for Wi-Fi, 575 MB", the "start now" line stays, and the download carries on by itself when Wi-Fi returns; this is a hold, not a stop. The stop (its line, Try again, the single VoiceOver announcement, and the "start now" line hidden while stopped) cannot be produced on a phone from this card, which exists only on the last first-run screen; `first-run-wait.test.ts` (lines 75 and 103 to 147) and `speech-download-status.test.ts` (line 98) cover it; S1-15a step 6 covers Storage only (Review and Book never read the download failure, so they show no stop line).
  6. Typing and recording both work while the download runs. While it runs, Review (before you tap "Keep the recording") and the Book show their wait line: "Downloading" below 1% (no number, never "0%"), then "Getting ready, n%" from 1%. Reached before the first percent, Review and the Book read "Downloading"; reached later, they read "Getting ready, n%", which is also right (the below 1% line is pinned by `download-wait-line.test.ts`). After you lift the throttle and the download finishes, the recorded letter gets its words.
- **Record:** S1-15b row: each step pass or fail, phone model and iOS version (no letter text). Step 1: the percent at which the fill first became visible. Step 6: the wait line you saw at Review and at the Book, and how many seconds after the bar first showed.
- **Update:** If step 4 clips: `apps/mobile/src/components/speech/speech-consent-card.tsx` footnote. If step 6 shows the letter never gets its words: the "start now" line is not true on this build; remove `speechConsentCopy.startNow` from the card before the next build.

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

### S1-17a TF1-DECODE Review's writing-down progress (PR #542, TestFlight build 1 "Part 1 of 3" with an empty bar)
- **Steps:** Model already on the phone. Record a letter of about 1 minute (three parts) and Finish; stay on Review and watch it until the words appear. Repeat with a 20 s letter (one part). On one run, Hear it while it writes. Then a development build attached to Xcode or Safari Web Inspector: set a breakpoint or a temporary `console.log` of the numbers only (no text) in the `within` callback of `lib/transcribe-whisper.ts`, and record a third letter.
- **Expected:** While the model opens and speech is found: "Writing down what you said." with no bar. From the first part on, "Part n of 3" and a thin bar on a visible `controlBorder` track that fills smoothly within each part and never moves back; the single-part letter also gets a bar. "Read it back later" appears only after 15 s with no whole-percent change. If whisper.rn's `onProgress` never fires on iOS: the words still say "Part n of 3", there is no bar during part 1, and the bar steps at 1/3 and 2/3. It is never an empty bar that sits still.
- **Record:** S1-17a row: did whisper.rn `onProgress` fire on iOS (yes or no, and roughly how many calls per part); seconds in "Writing down what you said." before Part 1 (model load plus speech finding) on the full and compact model; whether the bar ever moved back.
- **Update:** If `onProgress` never fires: note it in ADR 0015 section 9 and drop the per-call wiring in `transcribe-whisper.ts`. If the preparing stage is long: the design lane decides words for it (no progress callback exists for model load in whisper.rn 0.7.4).

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
- **V-02 Welcome and first run:** each step's heading gets focus; every field has a label; errors are announced; Add another child is reachable. Birthday and due date (#540), on iPhone SE 3 in Dark mode and again with Settings, Appearance set opposite to the phone: one tap on "Choose a date" opens the calendar sheet; swipe between months and tap the month and year header without the sheet moving; Done with today untouched fills today; the day saved matches the day tapped; with the name keyboard up, the screen does not jump when the calendar opens; VoiceOver reads the sheet title first, then the calendar, Done, Cancel; the two-finger Z on the calendar, Done or Cancel closes it as Cancel (on the title it may not: Cancel stays reachable); after Done or Cancel, VoiceOver focus lands on the date control; at AX5 the sheet body scrolls and Done and Cancel can be reached; leave the sheet open past local midnight, then Done: the save check, not the calendar, decides.
- **V-03 Tonight:** the greeting, the prompt, Speak and Type read in order; Another thought and Not much today reachable.
- **V-04 Listening:** the elapsed time is spoken once a minute, not every second; Done is reachable without hunting; "To Asha" is reachable. At AX5 the clock and "Listening." are pinned above Pause and Finish, so the screen says it is recording without a scroll (P4c S5, #289).
- **V-05 Review:** the text reads in order; each machine edit is reachable with an action to put it back; Add to book and Keep private are reachable. P4c (#289, #292):
  - The letter's paragraph reads as the kept words (for the seeded Asha letter, "Asha, today you held the spoon by yourself."), with no struck words, no "N buttons found" and no inline mark read as a button; each edit is reached through its row under "N small fixes", and the rows are open on arrival (S3).
  - When a row opens its card, note where focus goes: the card opens inside the letter, under the mark's line, and nothing moves focus to it (lens B B7). Record whether the card's "Put it back" can be reached without hunting.
  - Keep, then listen: "Kept in Month N. Added to Asha's book." is said once, in full, before the Book; the Book comes as the sentence ends (at least 3 s, at most about 8 s). Record whether iOS's `announcementFinished` fires for that sentence word for word: if every save waits the full 8 s, it does not (S6, lens A A3).
  - Start "Hear it", then Keep while it plays: the same sentence is said at once, not held until the Book (S6, lens B B4).
- **V-06 Sheets (Keep the book, sign-in, Terms, sensitive data, Plus gate):** focus moves to the sheet title; the escape gesture closes. The Keep needs Plus sheet (P6a, S22), from a third letter's Keep in Review, on a production-profile build only (bundle id `com.earlyletters.scribe`): development and preview builds count as alpha and never open the Keep sheet before letter 101 (S1-37), so this cannot run on build 2; that build exists after Mon 9 Nov at the earliest. Mark it not run, not failed, until then:
  - Focus lands on "Keep adding to Asha's book". At the default text size, swiping back reaches the held letter, which sits above the title. At accessibility sizes the held letter follows the words, so swiping forward reaches it after the body (#370). Either way it is one element ("To Asha, Month 7", its words, "From Mama", "Waiting"). Nothing of Review behind the sheet is reachable. The escape gesture returns to the letter in Review with nothing held or kept.
  - "Keep it here for now" closes the sheet and Review; Tonight's card for that letter reads "Waiting to be kept." and "Keep it".
  - Double-tap "Keep it here for now" quickly: you stay on Tonight, with one card for the letter. The second tap must not land on the tab bar under the sheet's bottom edge. On the web it lands on the Book tab. On iOS the sheet's dismiss animation probably swallows it, but that is unverified, so record where the second tap goes (#312 lens B delta).
  - With StoreKit: See Plus opens Apple's subscription view over the sheet; after a sandbox purchase the purchase confirmation opens, the sheet goes and the same Review shows for the person to tap Keep. Offline: See Plus stays, and the offline line appears. S1-23 runs at AX5, so the line is not under See Plus: it is a line of the words in the scroll, right after the held note. After the tap the sheet scrolls it into view, and VoiceOver announces it. At the default size it sits under See Plus in the footer (#370). Record any presentation that does not open.
- **V-07 Apple's subscription sheet:** prices read with their periods (Apple's view, ASC doc D-10).
- **V-08 Book and letter:** chapter headers read title, count and authors; the letter reads date, text, signature; Delete then Undo announced.
  - Before-birth dateline (QE-01, PR #643): set up a book with "Not here yet" and a due date of tomorrow (the app takes a due date from today up to ten months ahead, so one that has gone by cannot be chosen). Then set the phone date two days on (Settings > General > Date & Time, Set Automatically off, and back on afterwards), so the due date has gone by. Write a letter dated after that due date, so the book has no birthday. Open the letter with VoiceOver on: the dateline is read as "<weekday>, <date>. Before Asha was born." and never as an age ("N days old"). Then export (Settings > Export) and open the letter's text file: its Date line reads the same words. Record the spoken line and the Date line.
- **V-09 Read together:** Previous, Next and Close reachable; playback state announced.
- **V-10 Settings:** each row reads label and value; every consent row is two taps from Settings; "If you are struggling" is reachable. P6a (S40, S46, S47): "If you are struggling" and Licenses push their own pages; each support line reads its name and how to reach it and starts a call; the early-version note is read once, after Version; Add a child reads its heading first, the waiting "Add this book" as dimmed with its reason as the hint, and a tap on it says the reason and moves focus to the empty field; the due-date card's "Set the birthday" and "Hide" are reachable, and "Hide this book" opens a plain confirm. Add a child, Birthday and Due date in a child's settings, and "Set the birthday": the same date steps as V-02 (#540); a due date that has gone by shows its own day in the compact picker, not today; "Set the birthday" with a due date still ahead opens the calendar on today.
  - Back from Settings (TestFlight build 1, "No cross or back button in settings", PR #546): open Settings from each entry point: the Book gear, a content-block link to Settings, and the child switcher's Add a child (which opens straight on that page). Each time, the first screen shows the chevron at the top left in the accent colour, labelled "Book" from the Book tab (else the tab it came from, or "Back"), and VoiceOver reads it as "Book, back, button". Go back three ways from that screen: the button, the left-edge swipe, and the VoiceOver two-finger Z (escape). Each returns to where Settings was opened. Inner pages (Appearance, Reminders) still go back to Settings. Repeat with Reduce Motion on and at AX5. Record any entry point or way back that fails; the two-finger Z on the Settings home is the one no unit test proves (`apps/mobile/test/settings-back.test.ts` pins the button).
- **Expected:** All ten pass with no unlabelled element, no trapped focus and no truncated text at AX5 (letter text never capped, D-027).
- **Record:** S1-23 rows V-01 to V-10.
- **Update:** TDD 09 section 2 findings table (status), `docs/design/COMPONENT_LIBRARY.md` for component fixes.

### S1-24 Display settings and the network check
- **Steps:** (a) On SE 3 at AX5 with Bold Text and Increase Contrast, in Dark mode, walk Tonight, Review, Book, Settings, Plus gate, then Write and Listen (P4c, #289, #292), each also on a 6.1-inch phone:
  - The Keep needs Plus sheet (P6a, S22; #370), with nothing truncated at any size:
    - At AX5 the held card is not tilted. Only "See Plus" and "Keep it here for now" are pinned at the bottom. The scroll holds the title, the held note right after it, any note about See Plus, the body, the card and "Redeem a code".
    - At the default size the card is tilted and on top, and every button is pinned with its note.
    - Reduce Motion fades the sheet in instead of sliding it.
  - Add a child (S47) and a child's book settings (S46) at AX5: the date row and "Born today" wrap, the reason line sits above the primary.
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

### S1-27 Sign-in and Account screens (EXPERIENCE_PASS S52 to S56, package P8a; PR #310)
- **Needs:** a switch-on build against staging (build 2), a drill account, the fictional family Asha. What the web build cannot show: the native sheet, AutoFill, VoiceOver, Dynamic Type, the native confirm.
- **Steps:**
  - (a) **Row 5b.** On a fresh install, run first run and keep the first letter. The Book appears with the letter in its month, and about 600 ms later the sign-in sheet ("Keep Asha's book on any phone") rises over the Book. It never replaces Review, and no frame of Tonight shows between them. Tap Not now: the Book stays as it was.
  - (b) **Sensitive data at AX3 and AX5.** Sign in on an account with no sensitive-data answer. On the sensitive-data step at AX3 and at AX5, on an SE 3 and a 6.1-inch phone, "Agree and sync" and "Keep on this phone" are the same height and width. If one wraps, the other grows with it. Both are reachable.
  - (c) **Terms at AX5.** On a new account, the Terms step at AX5: the agree line ("By continuing, you confirm you are 18 or older and agree to the Terms of Service and Privacy Policy.") is fully visible, never cut, and sits right above "Agree and continue" (in the scroll at accessibility sizes).
  - (d) **VoiceOver on the sign-in sheet.** On the sheet from Account (cover beside the title), focus lands on the title. The small book cover is not read. The privacy line is read once, as one element. A busy Google button is announced as busy, not dimmed. An error line is announced once.
  - (e) **VoiceOver on Account.** The way-in mark (Apple, Google or envelope) is not read. "Signed in with email" and the address are read. With a letter queued (airplane mode on, keep a letter, then Sign out and confirm while airplane mode is still on, so the wait holds), the Sign out row is replaced by the waiting row, "Your newest letters are still on their way. This phone signs out once they are sent.", with a spinner, and it is spoken once. "Stay signed in" is under it (PR #388), and Sync and sharing keeps the value it had before the tap.
  - (f) **AutoFill.** Continue with email offers the phone's addresses, and the code screen offers the code from Mail (S1-08 covers the mail apps). After a wrong code the field is empty and the keyboard is up again. On an SE 3 with the keyboard up on the email screen, the longest sign-in error ("Your letters are safe. Sign-in emails are paused for an hour. Use Apple or Google, or try again later.", about 100 characters) wraps whole, with "Send link" still in view.
  - (g) **Agree and sync, later.** On an account that chose "Keep on this phone", Settings > Account > "Agree and sync" opens the sensitive-data step with all its lines. Nothing is recorded until "Agree and sync" is tapped there.
  - (h) **Not now with the number pad up (PR #372, lens A3).** On an SE 3 at the default text size and at AX3, on Check your email with the number pad up: "Not now" is top right, fully visible, and one tap closes the whole sheet without closing the keyboard first. With Asha's book on the phone, "Your letters are safe on this phone." is under the field; on a fresh install it is not there.
  - (i) **The pause (PR #372, lens A2).** Five wrong codes: one line, read once by VoiceOver as one element: "Your letters are safe. You can try a code again in 15 minutes. The link in the newest email still works, and so does signing in with Apple or Google." After a minute, "Send a new email": the new email's link signs in on this phone while the code field still waits. When the 15 minutes end the field takes a code again; nothing is announced then (known).
  - (j) **Stay signed in, and a wait that ends as it should (PR #388, BL-451).** Hold the wait as in (e). Tap "Stay signed in": the waiting row and "Stay signed in" go, "Sign out" is back, and the page still says how you signed in. Turn airplane mode off and let the letter sync, then sign out: the page fades to signed out with no line about letters kept on this phone. Hold a wait again and turn airplane mode off during it: the letter goes, then the page fades to signed out, again with no such line. With VoiceOver on, record what is heard and where focus lands after "Stay signed in" (known: nothing is announced and focus is not moved).
    - Unit-tested only, with no phone step: the early-end line ("Your newest letters are kept on this phone. They are sent the next time you sign in to this account."). A wait ends early only when the session ends, or a gate answer turns sync off, during it (`apps/mobile/test/account-view.test.ts`). Neither can be made to happen on demand on a phone:
      - "Sign out other devices" from another phone ends this phone's session only at its next token refresh, so the queued letter usually uploads first.
      - An Apple revocation during a wait cannot be produced: it is checked once when the session is set, a second sign-out is ignored while one waits, and at launch there is no wait (BL-450).
      - No screen turns sync off during a wait: Settings > Privacy's sync row has no control (BL-485 option (a) is not built; row (k) is what that row shows).
  - (k) **Settings > Privacy's sync row (PR #408, BL-485 option (b)).** In a switch-on build, open Settings > Privacy. "Sync and family sharing" is plain text beside its value: no chevron, nothing happens on a tap, and VoiceOver reads it as text and not as a button (expected: "Sync and family sharing, On"; signed out the row is dimmed, so VoiceOver may add "dimmed", unverified). Record the value in each state: signed out, "Not signed in"; signed in with sync on, "On"; after "Keep on this phone" on the sensitive-data step, or with a consent step still to answer, "Off, kept on this phone"; launched in airplane mode with a stored session, "Waiting for a connection" (it also shows for up to 10 seconds online while the first read runs, and longer if that read fails, until the app is next brought to the foreground). Known, so not a new finding: between signing in on a phone that already has letters and tapping "Keep in this account", Privacy reads "On" while Account reads "Not set up yet" and nothing uploads; the footer under the row ("Turn this off to stop syncing, and we will offer to delete what already synced.") promises a control and a deletion offer that do not exist yet (BL-485 option (a), and counsel's list). At AX5 record whether "Waiting for a connection" wraps cleanly in the value cell (unverified). Not run on a phone yet.
- **Expected:** All eleven hold, with no truncation, no trapped focus and no element read twice.
- **Record:** S1-27 rows (a) to (k), with the phone, iOS version and text size; screenshots with Asha only.
- **Update:** PR #310's phone list and `docs/design/EXPERIENCE_PASS_2026-10.md` S52 to S56 where a result differs.

### S1-28 The Family tab, the invite and joining a book (P8b; EXPERIENCE_PASS_2026-10 S57 to S59, 5.8 rows 10 and 12)
- **Needs:** a switch-on build on two phones and two Apple Accounts (Mama on A with Asha's book; Papa on B), as S1-22, plus an iPhone SE for (i), VoiceOver for (h), and airplane mode (Control Center) for (g). An invite link works once, so every run of (b), (d), (e), (g), (h) and (k) needs a new invite from A and a fresh install on B (delete the app, then install it again).
- **Steps:**
  - (a) On A, open the Family tab at the default size and at AX5, in light and dark, and with Increase Contrast. Then Invite a co-parent, type "Papa" and Share invite link through Messages to B.
  - (b) On B, fresh install: open the link, pass the age question, sign in, read the ask, tap Join the book, and wait on the joined sheet until the book is on the phone.
  - (c) Then Open the book.
  - (d) Repeat (b) with a new invite, and tap Close on the joined sheet once the book is there.
  - (e) With Reduce Motion on, repeat (b) and (c).
  - (f) On A, Invite a co-parent and dismiss the share sheet by tapping outside it. Tap Share invite link again and this time send it through Messages. Then look at the Family tab.
  - (g) Repeat (b) to the joined view, and tap Close while the sheet still says the book is on its way (the thin bar keeps moving; it never ends). The book usually arrives within seconds, so this is a race: if the welcome hands over to the Book first, note it and run (g) again with a new invite and a fresh install. To see the stall, turn on airplane mode from Control Center as soon as the joined view shows, then tap Close. Then turn airplane mode off and tap Try again.
  - (h) With VoiceOver on, repeat (b) to the joined view and listen, then tap Close and listen again. The waiting line is heard only while the book is still coming: if it arrives first, note it and run (h) again with a new invite and a fresh install, in airplane mode as in (g).
  - (i) On an iPhone SE, Invite a co-parent and type the sign-off with the keyboard up.
  - (j) The invite card on A's Family tab at AX5, light and dark.
  - (k) On B, fresh install with a new invite: start first run and go on to the child step without opening the link. Then open the link from Messages, sign in, Join the book, wait for the book, and tap Open the book. Swipe back and use the back gesture.
- **Expected:**
  - (a) The tab is lit low and still, and switching tabs never re-arrives the light; with Increase Contrast it is plain paper. People read as signatures ("From Mama", "You"), with no avatar or email; the privacy line reads "Shared only with the other parent, if you invite them."; nothing truncated at AX5. When the share sheet closes, the invite sheet closes too, "The invite waits on the Family tab until they join." shows above the tab bar, and the pending row is in the list.
  - (b) Before sign-in, no child name and no inviter on screen. The ask shows only "Invited by Mama". **The joined sheet stays up while the book comes down:** first run's welcome under it hands over to the Book only while it, or the sign-in sheet over it, is in front, so nothing replaces the join sheet when the book arrives. The cover appears with "Asha" and opens.
  - (c) The sheet closes onto the Book on Asha's book, and its light rises from unlit over about 1.2 s, once. Record whether the welcome shows for a moment between Open and the Book, and which transition plays (5.8 row 12: the tabs come forward on the new book). Then Tonight, the Family tab and Settings (the Book's gear) each stay where they are: nothing pulls back to the Book, and no swipe or back gesture reaches the welcome.
  - (d) Close lands on the Book with its usual light, with no second rise.
  - (e) The cover is shown open at once, and the Book is lit at once.
  - (f) After the dismissed share sheet, the invite sheet stays open at "Share invite link" with "Papa" still in the field, with no tick and no toast. The second tap opens the share sheet with the same link; once it is sent, the sheet closes, the toast shows, and the Family tab lists one pending invite, not two.
  - (g) The welcome says "Asha's book is on its way to this phone." with no "Begin the book"; when the book arrives it hands over to the Book. In airplane mode, or after about 30 s, it says "Asha's book has not reached this phone yet." with Try again, and "Begin the book" is back. Try again with the network back brings the book, and the welcome hands over to the Book.
  - (h) Focus moves to "You're in Asha's book", and "Asha's book is on its way to this phone." is spoken once, after the heading and not over it. After Close, the welcome speaks its line once; in airplane mode, "Asha's book has not reached this phone yet." is spoken when it shows.
  - (i) "Share invite link" stays visible above the keyboard, with any error line above it.
  - (j) The cover steps aside, "Write this book together" never breaks a word, and the button takes the card's width.
  - (k) Open the book goes to the Book on Asha's book (the child step does not hand over by itself, so the sheet takes the person there), and no back gesture returns to first run's child step.
  - Known, and not a failure: the wait is held in memory, so if B is closed and opened again while the book is on its way, the welcome shows "Begin the book" with no line (backlog). Not checkable on the web and noted here for the phone: the sheets' presentation (P1's route options), the room keeping its light under a sheet (5.8 row 10), the Book's header settle on the first arrival (row 12), and the co-parent's first-row wash on A's Family tab when Papa joins.
- **Record:** S1-28 row per sub-step a to k, with the phone, iOS version and build: the joined sheet stayed until Open the book or Close (yes, no; for no, what showed instead); the light rose once on (c) and not on (d) (yes, no); after (c), Tonight, Family and Settings stayed put and the welcome could not be reached (yes, no); (f) the sheet stayed with the sign-off after the dismissed share sheet, and the tab listed one invite (yes, no); (g) which state was seen (on its way, then the Book; or not here yet, then Try again, then the Book) and whether the book won the race; (h) the heading, then the line, each heard once, on the sheet and on the welcome (yes, no; what was heard); (i) the button stayed above the keyboard on the SE (yes, no); (j) the card at AX5 (cover aside, no broken word, full-width button: yes, no); (k) Open landed on the Book and back did not reach first run (yes, no).
- **Update:** a "no" on (b) or (k) is a stop for S59 and goes to the coordinator and P8b the same day (`apps/mobile/src/components/family/welcome-handoff.logic.ts`, `apps/mobile/src/components/family/join-sheet.logic.ts`, `apps/mobile/src/app/onboarding.tsx`).

### S1-29 A child's book with two parents: the book row and the hide footer (S46; P6a, #312)
- **Needs:** a switch-on build on both phones, with Mama and Papa joined to Asha's book (S1-22's setup).
- **Steps:**
  - (a) On Mama's phone, open Settings > Asha's book. Read the "Write this book together" row, then tap it.
  - (b) Read the footer under "Hide this book". Tap Hide this book, read the confirm, then Cancel. A confirmed hide is safe on a build with P6d (#361): Settings > Hidden books brings the book back (S1-32). On a build without it, do not confirm the hide on a drill phone.
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
  - (b) After a fresh cold start, open Settings > Licenses for the first time, and time from the tap to the list on screen. `lib/licences` reads the list (about 205 KB since #550: what ships in the iOS app, grouped by theme) there and only there.
  - (c) Fling to the end of the list and back. Open one notice and close it.
  - (d) Repeat (c) at AX5, then with VoiceOver on: the group headings are headings, and each package row reads its name and its licence.
  - (e) Tap a row (for example whisper.cpp and ggml under Speech), then tap a second row; tap a Language data line; then turn VoiceOver on and double-tap a row twice.
  - (f) Switch to dark mode (Settings > Display & Brightness > Dark) and repeat (c) and (e).
- **Expected:**
  - (a) Cold start p50 and p90 are within 50 ms of the build before, and inside the S1-03 budget, because nothing reads the list at launch.
  - (b) The page opens with no visible stall. Over about 300 ms on the SE 3 is a finding; its follow-up, already listed on #312, is to move `licences.json` to an on-demand asset.
  - (c) The list scrolls smoothly, with no blank rows after a fling.
  - (d) Nothing is truncated.
  - (e) One row is open at a time: the second tap closes the first. An open row shows its version, its copyright lines and the full license text, which scrolls to its end (the Apache 2.0 texts are the longest). A Language data line opens to the full OpenCC Apache 2.0 text, or the pinyin-data MIT and Unicode License v3 texts. VoiceOver reads each row as a button with its name and license, and reads "expanded" and "collapsed" as it opens and closes.
  - (f) In dark mode each group's card has its border (the dark-only `dark:border-*` classes), text and chevrons are readable, and the open text keeps its contrast.
- **Record:** S1-30 row: cold start p50 and p90 in ms, before and after, 10 samples each; first open in ms; smooth scroll yes or no; AX5 and VoiceOver yes or no; one-at-a-time and expanded state yes or no; dark mode yes or no.
- **Update:** `docs/ops/APP_SIZE.md` if the start time moves; the follow-up line on #312.

### S1-31 Settings: Plan, Reminders, Storage, Export, Privacy and Appearance (S34, S41 to S45; P6b, #313)
- **Needs:** for (a), the StoreKit configuration file in a development build, or the production-profile TestFlight build after Mon 9 Nov (S2-01's setup); any build for (b) to (f).
- **Steps:**
  - (a) **Plan.** With Plus off: the first row is "See what Plus adds", and it opens Apple's subscription view. Buy (StoreKit file, or the sandbox on the production TestFlight build), then come back. With the plan note open (inside its window): the renewal date is said once, and in a trial the free-until date is said once. Tap Restore purchases on an account with Plus, then on one without. A family-shared plan, if a drill family has one.
  - (b) **Reminders.** Turn reminders on and deny notifications. Tap Open Settings, allow, and come back. On a phone that had "Pause all reminders" on in an earlier build: read Settings home's Reminders row and the Reminders switch, then turn the switch on.
  - (c) **Storage.** Settings > Storage. With English not on the phone, tap the English row. Let it download (a tap while it downloads stops it: S1-97b), then tap it again once it reads "On this phone". Off Wi-Fi, and with the disk nearly full, read the row.
  - (d) **Export.** On a book with a twin, read the cover at the top. Fill the disk and export. On a book too big for one file, if a drill fixture has one, tap "Write to us".
  - (e) **Privacy.** Read the three never-lines. Then tap each of the two document rows, Privacy Policy and Terms of Service (critics' D6; #370 removed the two rows whose pages the website took down).
  - (f) **Appearance.** With a kept letter in the book, read the sample. With only a private letter, read it again. Change Reading size through every size.
- **Expected:**
  - (a) After the purchase, the first row reads "Plus" with the plan name and its dates, and "Manage subscription" shows. No sentence and no date is said twice on the screen. After a restore that works, "Plus is on." is said once. With nothing to restore, the found-nothing line shows under the row. A shared plan reads "Shared with you through Apple Family Sharing."
  - (b) The card collapses and "Reminders are on." shows once. Coming back still denied shows no "Reminders are on.". A phone paused before reads Off on both the row and the switch, and the switch turns reminders back on with the cadence that was chosen.
  - (c) "Download" starts the download. The ring fills, and the words say "Getting ready, n%", never 100% before the download is done. "Remove" asks before it removes. The Wi-Fi wait row says why and offers Stop (S1-97b); the low-space row says why and offers nothing to tap.
  - (d) The cover is the active book's, with the twin behind it. The low-space failure names its cause and offers "Export again". "Write to us" opens Mail with the subject.
  - (e) Each line has a LockSimple mark and does not look tappable. Each document row opens its page in the in-app browser, never the website's not-found page, and only those two rows are listed.
  - (f) The sample is the first line of your newest kept letter, never a private letter, the other parent's, or a quiet day. With no kept letter it shows "Aa". Each Reading size label is in Literata at its own size.
  - At AX5, nothing on any of these screens is truncated.
  - With VoiceOver: Plan's first row reads its title, status and plan name; the restore result is read once; the Reminders card's title is a heading; the language row is one button with its hint, and its trailing word and ring are not read again; each never-line is one element with its mark hidden.
- **Record:** S1-31 rows (a) to (f), with the phone, iOS version, text size and VoiceOver yes or no; screenshots with Asha only.
- **Update:** PR #313's phone list and `docs/design/EXPERIENCE_PASS_2026-10.md` S34 and S41 to S45 where a result differs.

### S1-32 Hidden books: the way back from "Hide this book" (P6d, #361; B-REQ-014)
- **Steps:**
  - (a) With two books on the phone, open Settings > Avi's book > Hide this book, and confirm.
  - (b) Read Settings under Children.
  - (c) Open Hidden books and tap "Show this book again". Then go back to Settings.
  - (d) Repeat (a) to (c) with VoiceOver on, then at AX5. With VoiceOver, set the rotor to Headings on Hidden books.
  - (e) Hide the book that is open (the one the switcher shows), then show it again from Hidden books, without choosing another book in the switcher in between. Choosing one makes that book the open one, so this check would fail for the wrong reason.
  - (f) Month and birthday messages for a hidden book (the only reminders that follow a book's own switch; evening reminders are not per book). This is covered by the planner test in `apps/mobile/test/hidden-books.test.ts`: a hidden book leaves the reminders' book list, and comes back with "Show this book again". There is no phone step, because it needs a book whose month turns on the day of the run. If a drill book's month does turn tomorrow, hide it today and check that no message for it arrives.
- **Expected:**
  - (a) Nothing is deleted.
  - (b) Avi's book is not listed. A "Hidden books" row sits after "Add a child".
  - (c) The page lists Avi's book with "Show this book again". After the tap, the page says "No hidden books.", Avi's book is back in the switcher and under Children, and the Hidden books row is gone. Avi's letters and drafts are as they were.
  - (d) Each button names its book ("Show this book again, Avi"), and focus moves to "No hidden books." after the tap. The rotor's Headings stop on each hidden book's name. At AX5, nothing is truncated.
  - (e) While it is hidden, the switcher opens another book. After "Show this book again" the book is the open one again, as it was before the hide, because the phone still remembers it as the open book.
  - (f) Not run on the phone (see Steps). If it is run, no month or birthday message for the hidden book arrives.
- **Record:** S1-32 rows (a) to (e), and (f) when it can be run, with the phone and iOS version; screenshots with the fictional family only.
- **Update:** F09-REQ-016 and F09-REQ-024 in `docs/prd/v2/features/F09-book.md` (WP-F09-09 status) where a result differs.

### S1-33 The Keep sheet's buttons at large text (S22; #370, P6a critics' S1 and the #370 lenses)
- **Needs:** a production-profile build only (bundle id `com.earlyletters.scribe`): development and preview builds count as alpha and never open the Keep sheet before letter 101 (S1-37), so this cannot run on build 2; that build exists after Mon 9 Nov at the earliest. Mark it not run, not failed, until then. On that build, a phone past its free letters, without Plus.
- **Steps:** At AX3, then at AX5, on an SE 3 and on a 6.1-inch phone, open the Keep sheet from a letter's Keep in Review. Do it twice on each: once online, and once with Apple's store view unreachable (airplane mode, then tap See Plus so the sheet shows its offline note).
- **Expected:**
  - "See Plus" and "Keep it here for now" are both fully on screen at the bottom and tappable, with nothing else pinned with them.
  - At AX3, the title and the line that says the letter is safe ("This one waits on this phone, on Tonight, exactly as it is, for as long as you like.") are on the first screen, with both buttons.
  - At AX5, the first lines of that line start on the first screen and the rest scrolls. On an SE the three-line "Keep it here for now" makes the footer more than half the screen.
  - Offline, after tapping See Plus, the sheet scrolls the offline note into view, and VoiceOver announces it.
  - The offline note, the body, the held letter and "Redeem a code" scroll above the buttons.
  - Nothing is truncated.
  - VoiceOver reads the held note before either button.
- **Record:** S1-33 rows: phone, text size, online or offline, and yes or no for each line above; screenshots with Asha only.
- **Update:** PR #370 and `docs/design/EXPERIENCE_PASS_2026-10.md` S22 (the AX layout, on the P7-7 spec list) where a result differs.

### S1-34 The crash screen and the launch recovery screen on a development build (S50 and S51; #355, P6c critics' S1 and S2)
- **Needs:** an EAS `development` build (a development client), which is the only kind that can reach these screens: a store build has no fault switch by design (B-8). Run (a) to (e) on the simulator or on a phone. A phone needs Xcode's Devices and Simulators window (Download Container and Replace Container). Keep a copy of the good `scribe.db` first, and use a book of fictional letters only (Asha).
- **Steps:**
  - (a) Make the open fail. Quit the app. In the app's container, replace `Documents/SQLite/scribe.db` with a file that is not a database (for example 4 KB of random bytes, `head -c 4096 /dev/urandom > scribe.db`), and delete `scribe.db-wal` and `scribe.db-shm` beside it. On the simulator: `xcrun simctl get_app_container booted <the development bundle id> data`, then that folder. On a phone: Download Container, edit the copy, Replace Container. Open the app.
  - (b) Tap Try again, and watch the screen. Wait for the answer, then tap Try again a second time, and a third.
  - (c) Tap Export what's readable. Open the ZIP on a Mac. Compare its `database/scribe.db` with the file you put in place (`shasum`). Download the container again and compare the app's own `scribe.db` with the same file.
  - (d) Simulator only (a phone's container cannot be replaced while the app runs): with the app still open on the recovery screen, put the good `scribe.db` back in its folder (and its `-wal` file if you kept one), then tap Try again.
  - (e) Repeat (a) and (b) with VoiceOver on, with Reduce Motion on, and at AX5 on an SE 3. Put the good file back afterwards.
  - (f) S50 on a throwaway local change that is never committed: add `throw new Error('drill')` as the first line of a screen's component (for example `apps/mobile/src/app/settings/index.tsx`), build a development client, and open that screen. If the red error box covers the screen, close it. Tap Try again, and record what Try again shows, including nothing at all (this change leaves S50's Try again as it is, so with the throw still in place it may look like nothing happened). Then tap Go to Tonight.
  - (g) In quick turns on the recovery screen: tap Export what's readable and, before the share sheet comes up, tap Try again (and the other way round: Try again, then Export during the half second). Then close the share sheet. Record which line is on screen after each answer: the newest answer must be the one shown, and Export must not start twice on a double tap.
- **Expected:**
  - (a) A screen titled "The book could not open", with the line "Export saves a copy of the recordings and book files it can read, exactly as they are.", the hint "Try again, or restart the phone.", and exactly two buttons: Try again and Export what's readable. No error text, code or number.
  - (b) Within about a second of each tap the button reads "Trying again" and looks busy (an outline, no fill), and it ignores a second tap. After about half a second it reads "Try again" again and the line "It did not open this time either." appears under the hint. On the second and third tap the line goes while the button is busy, and comes back. Each tap has a visible answer, and nothing counts the taps. With the file still broken the screen never opens the book.
  - (c) The share sheet opens. Choose Save to Files, or AirDrop to the Mac: the app deletes its own copy of the ZIP as soon as the share call returns, so a copy exists only where you put it. The ZIP holds `database/scribe.db` (and `recordings/` if there are recordings) and `README.txt`. The ZIP's `scribe.db` is byte for byte the file you put in place, and the app's own file has not changed. If the share sheet does not open and the line reads "That export did not work. Your files are still on this phone.", the export failed (the share sheet was not available, or the ZIP could not be written): record it, and the phone's iOS version. If it does not open and the line reads "Export has nothing to put in a file right now.", neither folder could be read: record that too.
  - (d) "Trying again" shows, then the book opens, with the letters as they were. A phone is not run for (d); its first launch after the good file is back is the same code.
  - (e) VoiceOver reads "It did not open this time either." once after each tap, and reads the button as busy while it works. With Reduce Motion nothing differs, because nothing here moves. At AX5 the title and the line can be reached by scrolling, and nothing is cut off mid-word. Record what shows first, and whether anything suggests the words continue below the buttons.
  - (f) A screen titled "This page did not open", with "Your letters and recordings are safe on this phone.", Try again and Go to Tonight. No result is expected from Try again; record what it shows. Go to Tonight leaves for Tonight while the fault is still in place. This is the one place the S50 line is unverified for the letters (claims inventory 3f): do not read it as a check that the letters are safe.
- **Record:** S1-34 rows (a) to (g), with the phone or simulator, iOS version, text size, VoiceOver yes or no, and the yes or no for each Expected line; the `shasum` pair for (c); screenshots with Asha only.
- **Update:** `docs/design/EXPERIENCE_PASS_2026-10.md` S50 and S51 (the launch body and the Export empty line, with the 30 Oct rulings), and `docs/reviews/2026-10-claims-inventory.md` section 3f where a result differs.

### S1-35 Delete account as a sole parent: the deletion screen and Cancel deletion (S64, B2-10, M1; critics' pass 30 Oct 2026)
- **Needs:** the switch-on build pointed at staging, **with `EXPO_PUBLIC_ACCOUNT_DELETION=on` in that build** (the alpha builds hide Delete account without it, `docs/release/TESTFLIGHT.md` step 9, founder, 30 Oct 2026; on a development client start Metro with it in the shell, `EXPO_PUBLIC_SERVER_FEATURES=on EXPO_PUBLIC_ACCOUNT_DELETION=on npx expo start --dev-client --clear`, never in a `.env` file; the staging `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` go in the git-ignored `.env.local` as `docs/qa/BACKUP_RESTORE_DRILL.md` step 1 says (move that file away before any preflight)); a drill account (`run-sheets/README.md` "Drill identities") with exactly one book, no co-parent and at least two kept letters, signed in on one iPhone (phone A); for (f) a second iPhone (phone B) signed in to the same drill account, and a third phone or phone B after deleting the app and installing it again. Never an account that has been in a real family book.
- **Steps:**
  - (a) Phone A: Settings > Delete account, read step 1, Continue, type the word, Delete account. Note the clock time and the date on the page.
  - (b) Force-quit the app and reopen it. Then send the app to the background (home screen) for a minute and reopen it: the app syncs when it comes to the foreground (there is no pull to refresh). Wait a minute after the reopen. After each, note what the screen shows, and every button on it (with no book listed the Tonight, Book and Family tabs are not on screen; the one screen stands in for all of them).
  - (c) On whatever screen it is, tap "Sign out of this phone". Note what it says and the names of its two buttons. Tap "Stay signed in" on the alert. Tap Sign out of this phone again and confirm. Note the screen, then sign in again with the same drill account.
  - (d) Tap "Cancel deletion". Note how long it takes for the Book to open with the book and the letters back (a stopwatch from the tap). The Try again and 15-minute checks need a cancel that goes through and a pull that fails, and on a healthy network `recordCancelled` pulls within about a second, so the Book simply opens and they read n/a. To stage them (founder, staging only, never production): in the SQL editor run `revoke execute on function public.sync_pull(jsonb, int) from authenticated;` before the tap, tap Cancel deletion (the cancel goes through, the pull fails), tap "Try again" and note what the screen does (it should show that it is working, then say "Still on their way. Try again in a moment."), leave it for 15 minutes and note what the screen shows then (it should become the welcome by itself), and then run `grant execute on function public.sync_pull(jsonb, int) to authenticated;` (the grant of `20261004100000_sync_engine.sql`). Then send the app to the background (home screen) and open it again, as in (b): the sync that starts when the app comes to the foreground brings the book back. Do not wait for it to come back by itself: a phone with nothing waiting to upload does not retry a failed pull on its own (unverified: from reading the sync code, not seen on a phone). If the Book has not opened a few seconds after the app is open, note what the screen shows and do it once more. Do not forget the grant: every phone on staging stops syncing without it.
  - (e) Settings > Recently deleted, and the Book.
  - (f) Phone B (same account, already signed in, with the book on it): foreground it after (a) and wait for a sync. Note the screen. Then on the third phone, or phone B after deleting the app and installing it again, sign in with "I already have a book" while the request is open, and note the screen after the sheet closes.
  - (g) Repeat (a) and (b) with VoiceOver on, then at AX5. While that second request is still open: first switch airplane mode on and tap Cancel deletion (a failed cancel) and note what is spoken at the tap, what is spoken for the failure, and that the buttons come back; then switch airplane mode off and tap Cancel deletion again (a cancel that goes through) and note what is spoken at the tap, while it works, and when the screen changes. The failed cancel must come first: once a cancel has gone through nothing is open to fail on. At AX5 note whether the date is reachable: it sits in the scrolled words while the two buttons are pinned below.
  - (h) The day after the date (founder, staging, with AL-07.7: phone B signed in, the request executing, then purged). The executing state is a race with the purge worker if left to chance, so stage it: pause the purge-worker schedule on staging first (AL-07's stop rule names the job), then in the SQL editor run `update public.deletion_requests set status = 'executing', executing_at = now() where id = '<the drill row>' and status = 'scheduled';`, open the app and note the screen, then revert with `update public.deletion_requests set status = 'scheduled', executing_at = null where id = '<the drill row>' and status = 'executing';` and resume the schedule. Then, after a real purge, open the app again, signed out by the app itself. Optional on a spare phone, signed out: switch off Set Automatically in Settings > General > Date & Time, set the date three days past the date on the screen, reopen the app, then switch Set Automatically back on.
- **Expected:**
  - (a) Scheduled page: "Deletion scheduled", the date 30 days out, Cancel deletion, Sign out of this phone.
  - (b) After the next sync the phone shows one screen: "Deletion scheduled", the date, "Cancel deletion" and "Sign out of this phone", and nothing else. Never "Begin the book", "I already have a book" or "I was invited". There is no way to Settings, and no way to start a book.
  - (c) Sign out asks first and says "Your deletion stays scheduled for {date}. Sign in again any time before then to cancel it." Its buttons are "Stay signed in" and "Sign out"; Stay signed in leaves her signed in. After a confirmed sign out the screen still says the account will be deleted on the date and offers Sign in, and after signing in again the screen offers Cancel deletion again.
  - (d) A success haptic, the screen shows that it is working, then "Deletion cancelled" and "Your letters and books are on their way back to this phone.", then the Book opens with the book and the letters. Never the welcome in between. The time is the number to record. After Try again: it shows that it is working and then "Still on their way. Try again in a moment." (or the Book opens). After 15 minutes with no book the screen becomes the welcome by itself, with no touch.
  - (e) Recently deleted is empty of the account's letters; the Book lists them again.
  - (f) Phone B shows the same deletion screen after its sync (a moment of blank paper at most; never "Begin the book"). The fresh install, after "I already have a book" and the sign-in, lands on the deletion screen too; the sheet's "No book here yet" text may show first (unverified: it comes from the sign-in sheet, not from this fix).
  - (g) The title is read first, each button by its words, nothing truncated at AX5, and the two buttons stay on screen. Tapping Cancel deletion is spoken ("Cancelling the deletion."), and so are the failed cancel (its line) and the change to "Deletion cancelled" and its sentence. Record whether the date can be reached at AX5.
  - (h) While the request is executing the screen reads "Deletion in progress" and "Your account is being deleted now. This can take up to a day.", with "Sign out of this phone" (no alert) or, signed out, "Sign in": never a screen without a button. After the purge the phone opens on the welcome ("Begin the book" works) once 48 hours have passed since the date; until then a signed-out phone still shows the date and Sign in. With the clock set three days past the date and the phone signed out: the welcome.
- **Record:** S1-35 rows (a) to (h): phone, iOS version, text size, VoiceOver yes or no; seconds for (d); the screen seen at each point in (b) and (f); screenshots with the fictional family only.
- **Update:** `docs/design/EXPERIENCE_PASS_2026-10.md` S64, once its acceptance list has the box proposed in section 5 of `docs/design/reviews/P6C_P8C_CRITICS_PASS_2026-10-30.md` ("A sole parent can reach Cancel deletion after the phone's next sync"; S64 lists four boxes today and this is not one of them, and the spec owner adds it, BL-491 point 4), and that pass's M1 where a result differs.

### S1-83 Listen follows the voice without re-rendering 20 times a second (founder report on TestFlight build 1; listening-cue.md; branch fix/mobile-listen-metering)
- **Needs:** a build with fix/mobile-listen-metering; the SE 3 on battery and a 120 Hz iPhone (Pro); Asha's book; a quiet room. For (e), a Mac with Xcode Instruments and a development build of the same commit.
- **Steps:**
  - (a) Tonight > Speak. Talk normally for 20 s, then softly, then stay quiet for 15 s, then talk again.
  - (b) Watch the clock for one minute while talking.
  - (c) Tap Pause for 10 s, then Resume, then Finish.
  - (d) Settings > Accessibility > Motion > Reduce Motion on: repeat (a).
  - (e) Instruments, Time Profiler and Energy Log: a 10-minute take on the SE 3 with this build and with build 1 (or develop before this branch); note JS thread CPU and the energy impact for each.
- **Expected:** (a) the glow behind the red circle swells with the voice within a fraction of a second, grows less when soft, and after about half a second of quiet turns to a slow breath (never still, never a warning); talking again brings it back to the voice. The red circle never moves. (b) The clock steps once a second, never skips or repeats a second. (c) Paused: the glow is still and dim; Resume brings it back; Finish opens Review. (d) The ring steps in strength with the voice, no swelling. (e) Lower JS CPU and energy impact than before; record the numbers either way. If the glow only ever breathes and never follows the voice, the metering is not arriving: note it as a fail and say so.
- **Record:** S1-83 rows (a) to (e): phone, iOS version, pass or fail, and for (e) JS thread CPU percent and energy impact before and after.

### S1-36 Typing on Write: the keyboard's own tools, at speed (founder report on TestFlight build 1; D-057; branch fix/mobile-write-typing)
- **Needs:** a build with fix/mobile-write-typing; the founder's iPhone and the SE 3; English and Hindi keyboards added in Settings > General > Keyboard, Predictive (QuickType), Auto-Correction, Smart Punctuation and Enable Dictation on. Fictional family only (Asha).
- **Steps:** open Write from Tonight (with a prompt) and again from a recording's Review (?draftId), then on each:
  - (a) Type about 300 words as fast as you can, without looking at the screen for the last 100. Then read them back.
  - (b) Misspell a word ("teh") and let autocorrect replace it with the space bar; misspell another and tap the underlined word to undo the correction.
  - (c) Tap a QuickType suggestion mid-sentence, three times.
  - (d) Switch to the Hindi keyboard (the globe key) and type a sentence, including a transliterated or multi-stage word if the layout offers it; switch back.
  - (e) Tap the dictation key and say two sentences; stop dictation.
  - (f) Paste a paragraph copied from Notes.
  - (g) Drag the caret (press and hold the space bar) into the middle of the text, type a word there, and add a new line there with Return.
  - (h) Send the app to the background mid-sentence, wait 30 s, return, and keep typing. Then close Write and open the draft again from Tonight.
  - (i) Repeat (a) and (g) at AX5 text size.
  - (j) The last keystrokes on every way out, four times, each on a fresh letter: type a sentence, and within half a second of the last key (no pause) do one of: tap Close; tap "Add to Asha's book"; tap "Keep private"; swipe the sheet down. Then reopen what was written (the draft from Tonight after Close or the swipe; the letter in the Book or in the private letters after a destination) and compare it word for word with what was typed.
  - (k) First open: force-quit the app, reopen it, and open Write from Tonight as the first thing (do not touch the screen while the sheet rises). Repeat from Review with a recording (?draftId), and once at AX5.
  - (l) QE-06, leaving the app inside the pause: on a fresh letter type a sentence and end it with one space (a trailing space, nothing after it), then, within half a second of the last key (no pause), press the side button to lock the phone; unlock, force quit the app from the app switcher, relaunch, open the draft from Tonight and compare it word for word with what was typed, the trailing space included (with the caret at the end, it sits one space after the last word; the save must keep the words exactly as typed). Repeat on a fresh letter but go to the Home Screen instead of locking (press the Home button on the SE 3, swipe up from the bottom edge on a Face ID iPhone; once is enough). Repeat once with the very first words of a new letter, before any pause has passed. Then pull Control Center down in the middle of a sentence, close it and keep typing.
- **Expected:** no character is lost, doubled or reordered in any step; the caret never jumps (not to the end, not to the start) except where the person moves it; autocorrect, its undo bubble, QuickType, Hindi composition and dictation all behave as in Apple Notes; Return always adds a new line, never sends or closes; the line being written and the caret stay in view above the keyboard while writing on at the end; "Add to Asha's book" and "Keep private" both sit fully above the keyboard and QuickType bar; "Saved on this phone" appears after a pause; after (h) the words come back exactly as typed, the caret at the end; in (j) every word typed, the last one included, is there after each of the four ways out; in (l) every word typed, the last one included, and the trailing space are in the draft after the lock and after the Home Screen, and the very first words give one new draft on Tonight; after Control Center there is no second draft and no word is lost or doubled; in (k) the keyboard comes up by itself as the sheet settles (no tap needed, no visible delay), and on that very first open both "Add to Asha's book" and "Keep private" sit fully above the keyboard and its QuickType bar. Typing never feels slower than Notes on the SE 3.
- **Record:** S1-36 rows (a) to (l): phone, iOS version, text size, keyboard, pass or fail, and for any fail the step and what happened (no letter text in the record beyond the fictional words typed); a screen recording of (a) on the SE 3.
- **Known unverified on a phone:** editing in the middle of a long letter relies on UIKit scrolling the sheet to keep the caret in view (the app only follows the caret when writing at the end); and the keyboard offset assumes the page sheet reaches the bottom of the screen. Report either if it does not hold.

### S1-82 One tick to start a recording, one to stop, none between (founder report on TestFlight build 1; MOTION 6; branch fix/mobile-recording-haptics)
- **Needs:** a build with fix/mobile-recording-haptics; the SE 3 and the founder's iPhone; Settings > Sounds & Haptics > System Haptics on; Low Power Mode off; Asha's book.
- **Steps:**
  - (a) On Tonight tap Speak, with a finger resting lightly on the phone's back. Count the taps felt until the clock shows 0:03.
  - (b) Record 2 minutes, tapping Pause and then Resume three times along the way, then Finish.
  - (c) Open Listen and tap Close at rest; open it from Speak with the microphone off in Settings > Privacy > Microphone, turn it back on, return and tap the red circle (or Try again).
  - (d) Play back the letter from (b) in Review, listening around each pause and resume and the last second before Finish.
  - (e) Fresh install (or Settings > General > Transfer or Reset iPhone > Reset > Reset Location & Privacy): set up Asha's book, tap Speak, read the microphone note and tap Continue, allow the microphone in the iOS question, and count the taps felt until the clock shows 0:03.
- **Expected:** (a) exactly one light tap, as Speak is let go, and none as Listen opens or the microphone starts. (b) no tap at any Pause or Resume; one light tap after Finish, as Review comes. (c) the circle or Try again plays one tap, before recording starts. (d) no click or buzz on the recording.
- **Record:** S1-82 rows (a) to (e): phone, iOS version, taps felt in (a), taps felt in (b) during the take and at Finish, pass or fail for (c) and (d), taps felt in (e) (expected: one, as Speak is let go; none at Continue).

### S1-37 No letter limit in alpha (founder decision, 1 Nov 2026; PL-1, S1; `apps/mobile/src/lib/billing/alpha.ts`)
- **Needs:** a TestFlight build of the `testflight` or `preview` profile (`.preview` bundle id) on a fresh install, and, after Mon 9 Nov, a TestFlight build of the `production` profile.
- **Steps:** (a) Alpha build: on the Welcome screen read the line under the body. Set up Asha's book, then keep three letters, then a fourth (speak one, type the others), each from Review with words on screen. Open Settings and read the Plan row, then open Plan. (b) Production profile build: the same steps.
- **Expected:**
  - (a) Welcome, the Settings Plan row and the Plan screen say "Plus is not part of this test. Every letter is free while you test." No "See what Plus adds", no "Redeem a code". Every letter is kept and lands in the Book. No "That was your second free letter." toast and no Keep sheet.
  - (b) Unchanged from today: Welcome says "Your first two letters are free.", the second letter shows the second-free toast, and the third letter's Keep opens the Keep sheet with See Plus.
  - S1-33 and V-06 (the Keep sheet) say so in their own entries: they need a production-profile build.
- **Record:** S1-37 rows (a) and (b) with the build number and profile; screenshots with Asha only.

### S1-47 Settings, Reminders without the sheet: straight to the iOS alert, choices inline (reminders-settings.md; CDesO-3, CCO-10, LEGAL-REQ-007; branch feat/mobile-reminders-inline)
- **Needs:** a TestFlight build with this branch, on a fresh install (iOS has never asked about notifications), and a second run on the same phone after denying. iPhone SE 3 for AX5. Asha's book with a birth date, and a second fresh install with a book that has only a due date.
- **Steps:** (a) Never asked: open Settings, Reminders. Read the lines under the switch before touching it. Turn the switch on. (b) Allow. Read the page. Change How often, an evening, the time and Names in notifications, one at a time, pausing a second after each. (c) Fresh install again, turn on, Don't Allow. Turn the switch off and on again. (d) Tap Open Settings, allow notifications in iPhone Settings, and come back. (e) In iPhone Settings, Notifications, the app: choose Deliver Quietly (or reinstall and let a provisional grant stand, if the build asks provisionally), come back. (f) Airplane mode does not stop local scheduling; to see the failure row, use a development build with `scheduleNotificationAsync` made to throw once, then tap Try again. (g) The due-date-only book: read the Month and birthday messages row and the preview. (h) Repeat (a) to (d) with VoiceOver on, then with Reduce Motion on, then at AX5. (i) After the first letter on a fresh install: "Yes, evenings", allow; and on another fresh install, Don't Allow.
- **Expected:**
  - (a) "A nudge in the evening, as often as you choose. Never late at night. Only in the evenings you pick, and never late at night. Notifications never show what you write. Names stay off the lock screen unless you turn them on." shows under the switch before any tap. A tap goes straight to the iOS alert: no sheet, and no "A few evenings a week" title anywhere. The switch is already on behind the alert and never flips back.
  - (b) Under the switch "Changes save as you go."; How it will look shows a flat card with the words of the next reminder (no name while Names is off; never a picture of an iOS banner); "Next: Tuesday at 8:30 PM." (or the real next day and time) changes with every edit, with a short cross-fade; How often, Which evenings, Time, Month and birthday messages and Names in notifications are all there with no Save button.
  - (c) The switch stays on; the Notifications are off card with Open Settings shows; Next reads "Not sending yet."; the choices stay editable. Off and on again shows no second alert.
  - (d) The card collapses, the toast says "Reminders are on. Next: ..." once, and the Next line appears.
  - (e) A line says "iPhone delivers these quietly, to Notification Center only." [unverified until this row is run: Deliver Quietly detection reads allowsDisplayOnLockScreen false, alertStyle none, Notification Center not off and sound not on]. With Notification Center also off, or sounds on, no line shows.
  - (f) "Could not set reminders just now." with Try again; Try again clears it and the Next line holds.
  - (g) The row reads "Starts once a birth date is added."; the preview is neutral.
  - (h) VoiceOver: after the alert, focus is on the Reminders switch, and "Reminders are on. Next: ..." or "Notifications are off" is spoken; the next swipe lands on the denied card. After each change in (b), "Saved. Next: ..." is spoken once, about half a second after the last change, never as a modal. The preview is one element. Reduce Motion: the choices fade in with no slide and the Next line swaps with no fade. AX5: the preview, the Next line and every help line wrap and never truncate; the time label and the time stack; the evening chips wrap; every target is at least 44 pt.
  - (i) "Yes, evenings" then Allow: the toast "Reminders are on. Next: ..." with Change, which opens Settings, Reminders. Don't Allow: "Notifications are off" with Open Settings.
- **Record:** S1-47 rows (a) to (i): phone, iOS version, text size, VoiceOver yes or no, Reduce Motion yes or no; pass or fail with the step and what was seen; screenshots with Asha only. Row (e) on whether Deliver Quietly is detected (yes, no).

### S1-38 Book month card type: the numeral and one left edge (founder report on TestFlight build 1, "18 is merging. Font alignment can be cleaner."; PR #544)
- **Needs:** a build with PR #544; the founder's iPhone and the SE 3; Asha's book seeded with letters in the current month and at least one past month, and a month of age of 10 or more (two figures, ideally 18 or 11). Fictional family only (Asha, Papa).
- **Steps:** open the Book tab and look at the current month's lit card and one past month's opener, in each of:
  - (a) Light, text size Default. (b) Dark, Default. (c) Light, xxxLarge. (d) Dark, xxxLarge. (e) Light, AX5. (f) Dark, AX5. (g) Dark, AX5, Increase Contrast on. (h) Light, Default, Increase Contrast on.
- **Expected:** in every case:
  - the two figures (for example "18") read as two separate figures, with clear white between their ink, never touching;
  - the kicker ("THIS MONTH" or "MONTH"), the numeral and the meta line ("1 letter · From Papa") and the date range start on one left edge (the numeral's ink is not visibly right of the kicker);
  - the gap from the kicker down to the top of the numeral and from the numeral's foot down to the meta line look even, and the numeral's top never touches the kicker;
  - in the lit card, the kicker and numeral start at the same left edge as the dateline and words of the letter cards below it (36 pt from the screen edge);
  - at AX5 the numeral stops growing at its cap (about 90 pt), and the meta line and range wrap and are never cut;
  - with Increase Contrast, the lit card has a plain 1 pt edge and no glow, with the same alignment.
- **Record:** S1-38 rows (a) to (h): phone, iOS version, pass or fail, and for any fail which check and a screenshot (Asha only).
- **Not covered:** Android (React Native on Android places a line's text differently, so the figure trim is unverified there).

### S1-39 Full disk and a long take: finishing never sticks, and the take is kept (BL-563, S0; PR #595)
- **Needs:** a build with PR #595; the SE 3; Asha's book; a way to fill the disk (large videos or a filler file through Files) and Settings > General > iPhone Storage to read free space. Fictional family only (Asha).
- **Steps:** (a) Fill the disk until iPhone Storage shows under 1 MB free (if iOS frees space on its own, fill again just before stopping). Start a letter and talk, or leave a radio on, for 30 minutes, then tap stop. Note the seconds from stop to the next screen and what that screen is. (b) On the same phone with the disk still full, try once more with a 1 minute take. (c) Free a few GB, force-quit the app and open it again. Read Tonight's unfinished letters, then open the card.
- **Expected:**
  - (a) and (b): within about 3 s of stop the screen leaves "finishing" on its own and lands on Review, or, if the save failed, on Tonight (home); never a screen that stays on finishing, and "Let it go" never shows while finishing. No crash.
  - (c): the take from (a) is there as an unfinished letter ("Recorded before the app closed." or Read it back), opens in Review, and plays its sound up to the point the disk filled; nothing was deleted. If the recording file could not be written at all, Review says so in its own words and never claims a recording is kept.
- **Record:** S1-39 rows (a) to (c): phone, iOS version, build number, free space before stop, take length, seconds from stop to the next screen, the screen reached, and for (c) whether the take was there and how long its sound plays. Screenshots with Asha only; no letter text.
- **Not covered:** a line on Tonight saying the take was kept after a failed finish (follow-up: needs a new content key from `content`; today it returns home without a toast).

### S1-81 Opening a letter from the Book: one move, card to page (founder report on TestFlight build 1; MOTION 5f, EXPERIENCE_PASS 5.8 row 7; branch fix/mobile-letter-open-motion)
- **Needs:** a build with fix/mobile-letter-open-motion; the SE 3 and a 120 Hz iPhone (Pro); a book with at least six letters of different lengths (Asha only), one short enough to show whole on its card; light and dark mode.
- **Steps:**
  - (a) On the Book, tap a letter card in the middle of the screen. Watch the open, then tap Back. Repeat for the top card, the bottom card and the short letter. Record a screen recording of each on the SE 3.
  - (b) Open a letter, then swipe down on the page's top bar. Open one more and scroll the Book far enough that its card is off screen before going back (open, Back, scroll, open the next).
  - (c) Settings > Accessibility > Motion > Reduce Motion on: repeat (a) once.
  - (d) Larger Text at AX5 (Reading Size larger than the card's, if offered): repeat (a) once.
  - (e) VoiceOver on: open a letter from the Book, then Back. Open it again, swipe right past the end of the letter, then close it with the escape gesture (two-finger scrub, a Z).
  - (f) Tonight's "A month ago" card, if shown, and Settings > Recently deleted > Open: open a letter from each; with VoiceOver on, swipe past the end of each.
- **Expected:** (a) the card holds its press, the Book goes under the page's paper, and the paper grows from the card into the page; no sideways slide at any point, nothing moves twice, no native header or back arrow flashes at the top; the card's words stay still on their way (never re-wrap or jump); Back carries them back into the card. (b) The swipe closes the page the same way; with the card off screen the page fades instead. (c) and (d) one short cross-fade each way, nothing slides or grows. (e) VoiceOver lands on the dateline, reads the letter once, and never reaches the Book or the tab bar behind the page; the escape gesture closes the page the same way Back does. (f) The page fades in whole (no card to grow from), with no slide, and Back returns to where it came from; VoiceOver never reaches the tab bar or the Recently deleted list behind it. No hitch longer than one frame on the SE 3.
- **Record:** S1-81 rows (a) to (f): phone, iOS version, text size, Reduce Motion yes or no, pass or fail, and for a fail what moved; the screen recordings of (a) on the SE 3.

### S1-144 The export's schema address opens (QE-04; branch fix/mobile-qe04-export-schema-url)
- **Needs:** the website deployed from `main` after this change; any build; Asha's book with one kept letter; Safari on the same phone and a Mac.
- **Steps:** (a) Settings, Export everything, Save to Files. In Files, open the ZIP, then `schema/export-v1.schema.json`; find the `$id` line. (b) In Safari on the phone, open that `$id` address exactly. (c) On the Mac, run `curl -sI` on the same address, then `curl -s <address> | diff - schema/export-v1.schema.json` against the file from the ZIP.
- **Expected:**
  - (a) `$id` is `https://earlyletters.com/export-format/v1.schema.json`.
  - (b) Safari shows the JSON text, not a 404 page.
  - (c) `HTTP/2 200` with a JSON content type; `diff` prints nothing.
- **Record:** S1-144 rows (a) to (c): phone, iOS version, build number, the website deploy (commit) checked, the status line from `curl -sI`, and whether `diff` was empty.

### S1-131 App lock: the offer, the lock screen, the app switcher cover, and Export (F1; CPO-2, CISO-1; branch feat/mobile-app-lock)
- **Needs:** a TestFlight build with expo-local-authentication (a new native build, not an update) on the SE 3 (Touch ID) and a Face ID iPhone, each with a passcode set; Asha's fictional book; one Face ID phone where Face ID can be turned off for the app in iPhone Settings, Face ID & Passcode, Other Apps.
- **Steps:** (a) Fresh install to "The book is open.": read the lock card, then Not now; reinstall and choose Turn on Face ID (Touch ID on the SE 3). (b) Swipe up into the app switcher on Tonight, on an open letter and on Listen while recording; look at the snapshot. Also press Home quickly instead of swiping. Then unlock normally, wait 2 s, and open the app switcher again. (c) Leave the app for 30 s, then for 70 s (default After 1 minute), then set Ask again after to Immediately and leave for 2 s. (d) On the lock screen: Cancel the system sheet; wait 10 s; then tap Unlock. Watch the end of the unlock fade (screen recording at 60 fps if possible), once with Reduce Motion off and once with it on. (e) Record a letter, press Home mid-take, wait 2 minutes, come back. (f) Settings, Export your book with the lock on; cancel the sheet once, then confirm. Keep the share sheet open for 2 minutes. (g) Settings, Reminders with the lock on. (h) Turn Face ID off for the app in iPhone Settings, come back: Settings, App lock. (i) Remove the device passcode (drill phone only), open the app. (j) VoiceOver on: steps (a), (d); Larger Text at AX5: (a) and the App lock page; Reduce Motion on: (d); dark and light: (b) and (d). (k) Cold start with the lock on, timed from tap to the cover on the SE 3. (l) Settings > Privacy with the lock off, then on.
- **Expected:**
  - (a) The card reads "A lock for Asha's book", two buttons of equal weight; Not now closes it and the lock stays off (Settings, App lock row says Off). Turn on shows the Face ID permission with "<app> uses Face ID to open your book and confirm it is you.", then the toast "Face ID lock is on." and one success haptic.
  - (b) Every snapshot shows only the page colour and the mark, in both themes: no letter, no name, no recording screen. With the lock off, the snapshot is the normal screen. After a normal unlock, wait 2 s and open the app switcher again: the cover is fully opaque at once (no see-through frame).
  - (c) 30 s: no lock. 70 s: the cover and the system sheet once. Immediately: locks after 2 s.
  - (d) Cancel leaves the cover and Unlock and nothing else; no second sheet appears on its own. Unlock opens the sheet; success fades the cover (a fade under Reduce Motion too), no haptic, content within 1 s. At the end of the fade no frame of the cover comes back (no flash), with Reduce Motion on and off. VoiceOver reads the app name, focus lands on Unlock with its hint.
  - (e) The take is kept in full (plays to the second you left); the lock appears only after the take has ended, never during it.
  - (f) "Confirm it is you to export your book" before packing; Cancel leaves the page as it was. No lock while the share sheet is open.
  - (g) Names in notifications is off and dimmed, with "Names stay hidden while App lock is on."; a reminder that fires shows no name.
  - (h) The switch reads "Lock with passcode", the line "Face ID is off for <app> in iPhone Settings, so your passcode opens the book." and Open Settings; Unlock asks for the passcode.
  - (i) The book opens with no lock, one toast "The lock is off because this iPhone has no passcode. Set one to turn the lock on again."; the App lock switch is dimmed with the no-passcode line.
  - (j) Nothing truncates at AX5 (the two offer buttons stack); every control is 44 pt or more.
  - (k) The first frame is the cover; cold start stays within A-NFR-001 (p50 1.2 s, p90 2.0 s on the SE 3).
  - (l) Lock off: Who can see it reads "Anyone who can unlock this iPhone can open the book." and the App lock row says Off. Lock on: it reads "You, after Face ID or your passcode." (Touch ID on the SE 3) and the row says On; the row opens Settings > App lock.
- **Record:** S1-131 rows (a) to (l) with the build number, phone and iOS version; screenshots of the snapshot (b) with Asha only; cold start times for (k).

### S1-96 Settings > Privacy, as ruled: the promise first, facts, then controls (CPrivO-5; privacy-settings.md; branch feat/mobile-privacy-page)
- **Needs:** a TestFlight build of the `testflight` profile (alpha, servers and analytics off) with Asha's book; then Larger Text at AX5 and VoiceOver; dark mode.
- **Steps:** (a) Settings > Privacy. Read top to bottom. (b) Tap Names in notifications. In Reminders, turn reminders on first (the Names switch shows only while reminders are on), then turn names on; come back. (c) Tap Export your book, then Recently deleted, coming back each time. (d) Tap Privacy Policy, then Terms of Service. (e) Repeat (a) at AX5, with VoiceOver, and in dark mode.
- **Expected:**
  - (a) First, with no icon: "Your letters and recordings are private. We never sell them, never use them for ads and never use them to train machine learning models." Then Where your book is kept: "Your letters and recordings are kept on this phone. They are not sent to us.", iPhone backup "Includes your recordings, if iCloud Backup is on." (the same words as Where your letters live), "Your speech is written down on this phone.", "This version collects no usage or crash reports." Who can see it: "Anyone who can unlock this iPhone can open the book.", Names in notifications Off, and "Notifications never show the words of a letter." What you can do: Export your book, Recently deleted, and "There is no account in this version. Deleting the app removes its letters and recordings from this phone." Our promises in full: Privacy Policy, Terms of Service, then "Private by default. Never sold, never used for ads." No "What we never do", no lock icons, nothing about photos, no usage switch, no sync row.
  - (b) Reminders opens; back on Privacy the row reads On.
  - (c) and (d) Each opens its page; the documents open in the in-app browser.
  - (e) Nothing truncates at AX5; each section title is a heading; each line is read once.
- **Record:** S1-96 rows (a) to (e) with the build number, phone and iOS version; screenshots with Asha only.
- **Update:** `proposals/privacy-settings.md` and `docs/design/screens/SETTINGS_AND_ACCOUNT.md` section 11 where a result differs.

### S1-97 Where your letters live, Your words, and languages only in Storage (settings-ia.md 4; CCO-8, CPrivO-4; branch feat/mobile-letters-live-and-your-words)
- **Needs:** a TestFlight build of the `testflight` profile with Asha's book and at least one kept letter; a fresh install for (c); Larger Text at AX5 and VoiceOver.
- **Steps:** (a) Settings > Where your letters live. Read it. Tap iPhone backup, then come back; tap Export your book, export, come back. (b) Settings > Your words. Choose Exactly as said; record a letter and open Review; come back and choose Small fixes, marked; record another. (c) On a fresh install before the speech model is here: Settings > Storage. Tap English to download, watch it until it says On this phone, then tap it again to remove (tapping it while it downloads stops it: S1-97b). (d) Repeat (a) to (c) at AX5 and with VoiceOver.
- **Expected:**
  - (a) "Your letters and recordings are kept on this iPhone." Then If you get a new phone: iPhone backup "Includes your recordings, if iCloud Backup is on." with How to check, which opens Apple's iCloud Backup page in the in-app browser; Export your book "Save a copy any time." before the first export and "Last export: {date}" after; Encrypted backup "Not in this version". Footer: "An export is a copy to open and keep. We hold no copy." No line says a backup or an export brings the book back. No language rows, no switch. Recordings without a letter and Recordings that may not play show only when there are some.
  - (b) Each choice shows its line and the example changes: struck-through words with Small fixes, the sentence as spoken with Exactly as said. The next new letter opens in the chosen view. On a phone that had the old switch off, Exactly as said is already chosen.
  - (c) Storage lists English once, with its size, and no separate "All languages, Speech model" or detector rows. Download shows the ring with "Getting ready, n%" and Stop; Remove asks first.
  - (d) Nothing truncates; each choice is read with its state ("selected"); the example is read once, with the taken-out words named.
- **Record:** S1-97 rows (a) to (d) with the build number, phone and iOS version; screenshots with Asha only.
- **Update:** `docs/design/screens/SETTINGS_AND_ACCOUNT.md` sections 7 to 9 (PR #596) where a result differs.

### S1-97b A running speech download can be stopped from its language row (found in review of #631; branch fix/mobile-speech-row-stop)
- **Needs:** a TestFlight build of the `testflight` profile on a full-tier phone (the 575 MB model; a compact-tier phone fetches about 191 MB, where one 16 MB piece is about 9%, not 3%), on a fresh install without the speech model, with no recording waiting for its words (a waiting recording starts a stopped download again when the app comes back to the front); on the first-run download card, choose "Not now" (or, if the download has started, tap the English row in Settings > Storage to stop it, so the row reads Download); a throttled link (Network Link Conditioner "3G" profile, or a 1 Mbps profile on the router) so the download is still running when you tap (the speech model is fetched in 16 MB pieces and only a finished piece is kept, so wait for the percent to pass 3% before the stopping tap in step (a): at 1 Mbps that is about 2 minutes); working cellular data for (c); VoiceOver for (d).
- **Steps:** (a) Settings > Storage. Tap the English row (its word is Download). Watch the row show "Getting ready, n%" with the ring and the word Stop, until the percent passes 3%. Tap the row to stop it (the whole row is the button; its word, Stop, says what the tap does). Then tap the row again (its word is now Download). (b) Look at Settings > Storage while it downloads: English once, no separate "Listening detector" or "English speech model" row, and none under "Downloading". (c) Tap the English row first (its word is Stop) so it reads Download, then turn Wi-Fi off (cellular only, the app's "Use cellular data" switch off). Tap the row (its word is Download); the row reads "Waits for Wi-Fi, 575 MB" with the word Stop. Tap the row to stop it; turn Wi-Fi on and wait a minute; then tap the row again (its word is Download). (d) VoiceOver on: focus the English row while it downloads, listen, and double-tap it.
- **Expected:**
  - (a) Tapping the row while it shows Stop halts the download at once: the ring and the percent go, and the row reads "Not on this phone, 575 MB" with the word Download. Tapping it again carries on from the partial file: the percent picks up from the last finished 16 MB piece (at most about 3% below where it stopped), never from 0. Tapping the row while it downloads never asks to remove anything.
  - (b) A language is still never said twice: Stop lives on the English row only.
  - (c) The row shows the word Stop while it waits. After the tap that stops it, it reads "Not on this phone, 575 MB" with the word Download, and nothing starts when Wi-Fi comes back. Tapping the row then starts the download at once, on Wi-Fi.
  - (d) The row is one element, read with its state and the hint "Stops getting this language ready for now"; the double-tap stops the download. The ring and the word Stop are not read on their own.
- **Record:** S1-97b rows (a) to (d) with the build number, phone and iOS version; for (a) the percent when you stopped it and the percent shown a few seconds after you started it again; if you tried it with a recording waiting, the row after you leave the app and come back (it can be back on "Getting ready, n%" with Stop); screenshots with Asha only.
- **Update:** If (a) starts again from 0 after the percent had passed 3%: `apps/mobile/src/lib/packs/engine.ts` `cancel` and `download` (the `.part` file in staging). If a stopped download starts again by itself with no recording waiting: `lib/transcription-queue/index.ts` `refreshReady`. `docs/design/screens/SETTINGS_AND_ACCOUNT.md` section 9 where a result differs.

### S1-150 If you are struggling, by the phone's region: emergency first, Call and Text, other countries (struggling-page.md 2 and 3; CCO-11; F20-REQ-005; branch feat/mobile-struggling-region)
- **Needs:** a TestFlight build with this branch on an iPhone with a SIM; an iPad (or an iPhone with no SIM) for (e); VoiceOver and AX5 for (f). Do not complete a call or a text to any helpline: back out of Phone or Messages before it dials or sends.
- **Steps:** (a) iOS Settings, General, Language and Region, Region: United States. Open the app, Settings > If you are struggling. Read it top to bottom. Tap Call on the first line, then back out of Phone; tap Text, then back out of Messages. Tap Call 911 and back out before it dials. (b) Set Region to United Kingdom, then Australia, then India, then Ireland (leave the language as it is); open the page each time. (c) Set Region to Germany; open the page; tap Find a free helpline near you, then close the browser. (d) On the page, tap Lines in other countries and scroll to the end. (e) On the iPad or the no-SIM phone, tap Call on a line, then Copy number; tap Text on a line. (f) VoiceOver on, at AX5: swipe through the page from the top, and through Lines in other countries.
- **Expected:**
  - (a) Order: the line "The early months ask a lot of anyone...", the "Are you or your baby in danger right now?" card with Call 911, then National Maternal Mental Health Hotline, 988 Lifeline, Postpartum Support International, each with its words and Call and Text, then Lines in other countries, then "Nothing on this page is recorded or sent." Call opens Phone with the number shown and never dials by itself; Text opens Messages with the number in the To field and nothing sent.
  - (b) Each region shows its own emergency button (Call 999, Call 000, Call 112) and only its own lines (Samaritans; Lifeline and PANDA National Helpline). India shows Call 112 and Find a free helpline near you, with no line (Tele-MANAS is held until a current official source is read). Ireland (like Germany) shows "Call your local emergency number." with no button and Find a free helpline near you (its lines are held). No US line shows.
  - (c) Germany: "Call your local emergency number." with no button, then Find a free helpline near you, which opens findahelpline.com in the in-app browser.
  - (d) All six countries (United States, Canada, United Kingdom, Australia, New Zealand, India) with their emergency number and lines (India: its emergency number only, for now), then Find a free helpline near you.
  - (e) Call shows the sheet with the number and Copy number; once copied it says "Number copied". Text either opens Messages or shows the same sheet titled "Text from a phone"; a tap never does nothing.
  - (f) Each line reads its name (heading), its words, then "Call {name}" and "Text {name}" as buttons, with a hint. At AX5 the Call and Text buttons stack, and no line is cut off.
- **Record:** S1-150 rows (a) to (f): phone, iOS version, build number, the Region set for each; screenshots of (a), (b) and (c). If a region shows another region's lines, note the Region and the phone's language.
- **Update:** If the region read is wrong: `apps/mobile/src/components/settings/phone-region.ts` (AppleLocale, then Intl) and `struggling.logic.ts` `regionFromLocale`. If a number or its words are wrong: `packages/content/src/helplines.ts`, with the source page, its `readOn` (and `datedOn` if the page states a date) and a new `verifiedOn`.

### S1-141 The early-version note in the store build (BL-607; D-060, D-030; branch test/mobile-bl607-store-early-note)
- **Needs:** a build of the `production` profile and a TestFlight build of the `testflight` profile, each with Asha's book.
- **Steps:** (a) In each build: Settings, scroll to About; read the version row and the note under it. (b) Larger Text at AX5 in the production build: the same. (c) VoiceOver on: swipe from the version row to the sign-off.
- **Expected:**
  - (a) Both builds show the same note, word for word: "{app} is an early version, and it can make mistakes. Some things may change. Export a copy of your letters now and then." with the app's name. No "Early version" heading; the version row reads "{version} ({build})".
  - (b) The whole note wraps; no word is cut off.
  - (c) VoiceOver reads the version row, then the note as one element, then the sign-off.
  - If the founder has amended D-060 for the store build before this row is run, stop and record "superseded".
- **Record:** S1-141 rows (a) to (c): phone, iOS version, build number and profile; one screenshot of About per build, with Asha only.

### S1-152 "Another thought" on Write (engagement.md section 3, Option A; BL-E1; branch feat/mobile-write-another-thought)
- **Needs:** a TestFlight build with this branch; Asha's book with at least one letter; VoiceOver, AX5 and Reduce Motion for (e) and (f).
- **Steps:** (a) Tonight: note the prompt, tap Type. On Write, tap Another thought five times, slowly. (b) Type one word. Delete it. Tap Another thought once more, then type a short letter and Add to Asha's book. Open the letter in the Book. (c) Keep tapping Another thought on a new Write (about 30 times). (d) From Review, open Type for a recording whose words could not be written down (or open a typed draft from Tonight's draft card). (e) VoiceOver on: swipe from the top of Write, double-tap Another thought, then double-tap again without moving. (f) Reduce Motion on, then AX5: tap Another thought.
- **Expected:**
  - (a) The keyboard stays up and the cursor stays in the field. Each tap: one light tap haptic, the old line fades out and a new one fades in where it stood, and the field slides down or up with the new height instead of jumping. Never the same line twice in a row; no count or "no more" anywhere.
  - (b) At the first character Another thought fades out but its space stays (the field does not move); when the word is deleted it fades back. The kept letter's question (if the letter page shows one) is the one on screen when the words were typed, not the one Write opened with.
  - (c) No line comes back until many different ones have shown; it never stops offering one.
  - (d) No Another thought: a letter already under way keeps its question.
  - (e) Order: dateline, prompt, Another thought, the page. The new line is read once; focus stays on Another thought, so a second double-tap swaps again.
  - (f) Reduce Motion: the line swaps at once with no slide. AX5: the button wraps under the prompt, its label is never cut, and it is at least 44 pt tall.
- **Record:** S1-152 rows (a) to (f): phone, iOS version, build number, text size; a screen recording of (a) and (b) with Asha only.
- **Update:** `apps/mobile/src/app/write.tsx` (the swap, the fade, the space kept) and `components/tonight/prompt.logic.ts` `anotherThought` (the draw).

### S1-111 Plus lines, F5 (founder decision F5, 1 Nov 2026; PL-3, PL-4, PL-5, PL-8; branch feat/billing-f5-lines)
- **Needs:** (a) a TestFlight build of the `testflight` or `preview` profile on a fresh install; (b) to (d) a build of the `production` profile on a fresh install, with a sandbox Apple Account for (c) and (d).
- **Steps:** (a) Alpha: read the line under the Welcome body; open Settings and read the Plan row; open Plan. (b) Production, Plus off: read the Welcome line; set up Asha's book; keep a first and then a second letter (each with words on screen) and read the toast on the Book; open Settings and read the Plan row; open Plan and read every section. (c) Start Plus Monthly in Apple's sheet (sandbox); come back to Settings and read the Plan row, then Plan. (d) Let the sandbox subscription lapse (cancel, then wait for the sandbox renewal period to end); read the Plan row and Plan.
- **Expected:**
  - (a) Welcome, the Plan row and Plan say only "Plus is not part of this test. Every letter is free while you test." The Plan row has no Free or Plus value. Plan has no "What Plus includes", no Restore, no Redeem, no Manage. Unchanged from S1-37 (a).
  - (b) Welcome: "Your first two letters are free. After that, Plus keeps the book growing. Reading, listening and your copy stay free." No toast after letter 1. After letter 2, once, with no button: "That was your second free letter. Whenever you are ready, Plus keeps the book growing." The Plan row: "Free" at the right, with "Your first two letters are free. Plus lets you keep adding letters." under the title. Plan: "See what Plus adds" with the Welcome line under it (not "Every letter you keep stays yours..."), then "What Plus includes" with "Keep adding letters to every book, as many as you like." No number, price or trial length anywhere.
  - (c) The Plan row: "Plus" and no line under it ("Plus, shared" for a Family Sharing member). Plan: the status row with its dates, the promise under it, "What Plus includes".
  - (d) The Plan row: "Free". Plan: "Plus ended on {the day it ended}. Every letter you kept is still yours." No Welcome line, no promise, no Manage; "See what Plus adds" is there.
  - VoiceOver on the Plan row reads "Plan", then the line under it when there is one, then "Free" (or "Plus").
- **Record:** S1-111 rows (a) to (d): phone, iOS version, build number and profile, text size; screenshots of Welcome, the Plan row and Plan at each step, with Asha only.

### S1-142 The Plus line on Write (BL-560; F14-REQ-040, F04-REQ-045; founder decision F5; branch feat/mobile-bl560-write-plus-line)
- **Needs:** (a) to (c) a build of the `production` profile on a fresh install, Plus off, with Asha's book; a sandbox Apple Account for (c). (d) a TestFlight build of the `testflight` profile with 3 or more of Mama's letters kept.
- **Steps:** (a) Production, one letter kept: tap Type on Tonight; look above "Add to Asha's book". Close. (b) Keep a second letter. Tap Type again; type a few words; look at the same place, with the keyboard up, in light and dark. Then Larger Text at AX5: open Write again and look at the footer with the keyboard up. VoiceOver on: swipe from the page to the two buttons. (c) Start Plus in Apple's sheet (sandbox); open Write. (d) Testflight: open Write.
- **Expected:**
  - (a) No Plus line on Write.
  - (b) "Adding new letters to the book needs Plus. Recording, reading and export are always free." in small muted type, centred, above the two buttons, with the same words as Tonight's line. No number, no price, nothing to press. It appears with Write, not after a moment's delay, and typing is not slowed. At AX5 the line wraps with no word cut, and both buttons stay above the keyboard. VoiceOver reads the line, then "Add to Asha's book", then "Keep private".
  - (c) No line.
  - (d) Alpha: no line, at any count.
- **Record:** S1-142 rows (a) to (d): phone, iOS version, build number and profile, text size; screenshots of the Write footer in (b) at default size and at AX5, with Asha only.

### S1-132 StoreKit robustness: unfinished transactions, the Keep step waits for StoreKit, offline at See Plus, and offline across a renewal (PR #517; RT-PAY-17, RT-PLS-10, RT-PAY-09, RT-OFC-06, RT-SUB-13; CR-46)
- **Why a device row:** the native change (`apps/mobile/modules/scribe-store/ios/ScribeStoreModule.swift`, the `Transaction.unfinished` walk at start and the per-id `claim` in the `Transaction.updates` loop) runs in no Node test. CTO ruling (8 Nov): for native StoreKit code in an alpha build, this row is the evidence; a Swift unit test is not required for tonight.
- **Needs:** (a) to (c): a development build run from Xcode with the StoreKit configuration file `apps/mobile/storekit/EarlyLetters.storekit` selected in the scheme (Xcode's Transaction Manager works only there; every record says "StoreKit file, not sandbox"). (d) to (f): a TestFlight build of the `production` profile (after Mon 9 Nov; the `.preview` bundle id loads no products) on a drill phone and a drill Apple Account (AL-09 "Drill identities"), or the same development build. Asha's book with exactly 2 of Mama's own letters kept with words, Plus off, unless a row says otherwise.
- **Steps and expected:**
  - (a) **Unfinished purchase finished at relaunch (RT-PAY-17).** The transaction must reach the phone while the app is closed, so the launch walk (`Transaction.unfinished`) is the only code that can finish it. In Xcode, open `EarlyLetters.storekit` and turn on **Ask to Buy** (Editor menu > Enable Ask to Buy). Run the app, write a third letter, Keep, See Plus, buy Plus Monthly: Apple's sheet says the request was sent and Plus stays off. Kill the app (swipe it away; check it is not running). In Debug > StoreKit > Manage Transactions, select the pending purchase and **Approve** it. Relaunch. Expected: within 5 s of the launch, Plus is on (Settings, Plan says so), and the Transaction Manager shows the purchase as finished. The letter is still on Tonight and is kept only by the parent's own tap on Keep. Apple's sheet does not open or close by itself at launch. If Ask to Buy is not available in the Xcode in use, use **Interrupted Purchases** instead (Editor menu > Enable Interrupted Purchases): buy, kill the app at the interruption, resolve it in the Transaction Manager, relaunch; write which was used.
  - (b) **An unverified transaction never grants Plus.** In the Transaction Manager, mark a new unfinished purchase as failing verification (Editor > "Fail transaction verification" or the equivalent option in the Xcode in use; write which). Relaunch. Expected: Plus stays off, the third letter's Keep opens the Keep sheet, and nothing crashes. Turn the option off afterwards.
  - (c) **One finish per transaction.** Set up as in (a) (Ask to Buy, pending purchase, app killed), then relaunch and approve the purchase in the Transaction Manager within the first second, while the launch walk may still be running, so it can arrive through both `Transaction.updates` and `Transaction.unfinished`. Expected: Plus on once, no second "Plus is on" message, and the Transaction Manager shows one finished transaction.
  - (d) **The Keep step waits for StoreKit (RT-PLS-10).** Phone with an Apple Account that has Plus and a fresh install (or restore from a backup holding 2 kept letters). Turn on Settings > Developer > Network Link Conditioner "Very Bad Network" if available. Launch and, as fast as possible, write and Keep a letter. Expected: no Keep sheet. The letter is kept, or held with no sheet when StoreKit has not answered within about 1 s (`KEEP_PLAN_WAIT_MS`). Never a See Plus offer to a payer.
  - (e) **Offline at See Plus and Redeem a code on the Keep sheet, and a failed code sheet (RT-PAY-09, RT-OFC-06).** Plus off, 2 letters kept. Airplane mode on. Write a third letter and Keep: the Keep sheet opens. (e1) Tap See Plus. Expected: no Apple sheet; under the buttons the app's own line "Plus needs a connection to start. This letter waits on Tonight, on this phone, exactly as it is."; the letter waits on Tonight. (e2) On the same Keep sheet, tap **Redeem a code**. Expected: Apple's code sheet does not open, and the same line shows. (e3) Airplane mode off. On the Keep sheet, tap Redeem a code; in Apple's sheet enter a code that is not valid (or, with the StoreKit file, use the Transaction Manager to fail the redemption) and close it with the error. Expected: back on the Keep sheet, the line "Please try again. Nothing you saved has changed." shows; the letter is untouched and can still be held or kept. (Settings, Plan, Redeem a code is not changed by this PR and is not part of this row.)
  - (f) **Offline across a renewal: 7 days past the last verified expiry (RT-SUB-13, CR-46).** Plus Monthly renewing, open the app online once (a fresh read). Airplane mode on before the period end (in the sandbox a month is minutes, so do it straight after the read; note the end time Plan shows). Stay offline. After the period end, keep a letter: expected kept, no Keep sheet, Plan still says Plus. Then, still offline, move the phone's date forward 6 days past that end: kept, no sheet. Then 8 days past it: the Keep sheet holds the letter (offline line), nothing is lost. Set the date back to automatic and go online: Plus follows Apple's answer at once. A subscription cancelled before going offline ends at its period end, with no 7 days (the Plan screen's "stays on until").
- **Record:** S1-132 rows (a) to (f): phone, iOS version, build profile and "StoreKit file" or "sandbox", Xcode version for (a) to (c), seconds to Plus on in (a), pass or fail per row with the step that failed. No receipt, transaction id or Apple Account address in the record. Screenshots with Asha only.

### S1-151 The Book page redesign: the cover band, the excerpt that ends on a whole word, the voice marker, month headings, the Months sheet and the end of the book (book-page.md; BL-659 option b, BL-660, BL-675, BL-676; branch feat/mobile-book-page)
- **Why a device row:** the word ending is measured from the platform's own line breaks (Text `onTextLayout`) and a hidden copy of the last word, which no Node test runs; VoiceOver order, AX5 wrapping, the bar's cross-fade, the jump cross-fade and the card to page carry are seen only on a phone.
- **Needs:** a build with this change on iPhone SE 3 and a current iPhone, both light and dark. Asha's book (fictional family only) with (1) one letter this month, spoken, about a minute, from Papa; and (2) a second book seeded with letters in at least 4 months (the dev seed, or write and change the date). For (h), a book with about 400 letters if a fixture build is to hand; otherwise mark (h) NOT RUN.
- **Steps and expected:**
  - (a) **One letter.** Open the Book. The cover band is the only lit object: "Asha's book", "17 months" (the age in months only, never "and 2 weeks"), Read together as a full-width button with its icon, the gear at the end of the title row and no row of its own. Under it: "THIS MONTH", the month in words ("17 months") and its dates muted; no numeral, no count, no box around the month. The card, then the quotation-pair mark at the end of the book. No dead space that looks unfinished.
  - (b) **The excerpt.** Cards show up to three lines; the last visible word is the only thing that fades, and the fade never starts inside a word. Try a letter whose third line ends on a long word, one with a word longer than a line, and an Arabic or Hebrew letter (the fade on the left). Light and dark: the fade's end matches the card exactly, no pale patch. The same ending on Tonight's draft and "A month ago" cards, the saved moment and a held letter (the one EXCERPT_ENDING seam changes them too).
  - (c) **The card's footer.** "From Papa" in italic; "Voice 1:06" with a small waveform glyph at the right; nothing looks like a play button, and tapping the marker opens the letter like the rest of the card.
  - (d) **Card to page (#628).** Open the card: the words grow into the page without a reflow or a jump in the fade, and Back puts them into the card. Repeat at the largest standard text size and at AX3.
  - (e) **VoiceOver.** From the top: "Asha's book, heading", "17 months", then (two books only) "For Asha", "Read together", "Months" (when shown), "Settings". The rotor's Headings move by month: "This month, 17 months, October 12 to November 11". A card is one element: "From Papa. Sunday, November 1, 2026, 17 months. Voice recording, 1 minute 6 seconds." then every word of the letter. Write down if the gear or the switcher is reached out of this order (they are placed over the space kept for them; iOS may order by position).
  - (f) **AX5 (Larger Accessibility Sizes at the maximum).** The band stacks: title, age, Read together grown to fit its label, then Months and the gear; card excerpts show two lines and the footer stacks; month headings and dates wrap; nothing truncates anywhere, including the compact month in the bar.
  - (g) **Scroll and the bar.** Scroll the 4-month book: the inline bar cross-fades in with the title, Months and the gear, and the month at the top under it ("14 months   July 12 to August 11") changes as months pass. Its buttons work only once it is in; VoiceOver does not read it while the band is in view. Reduce Motion on: the bar switches instead of fading. Reduce Transparency or Increase Contrast on: the bar is solid, and the band loses its light for a 1 pt line edge.
  - (h) **Months sheet.** Tap Months: "Go to a month" lists only months with letters, newest first, each as "3 letters, from Mama and Papa"; no empty or quiet-only month, no count of months. Choose an old month: the list fades out and back in there, with no animated scroll, the month's heading under the bar. Same with VoiceOver and at AX5 (rows wrap and scroll). On the 400-letter book, from the very top: (h1) jump to the oldest month, and (h2) jump to a month in the middle. Each time the list comes back in (never left blank), with that month's heading just under the bar and its compact month showing that month, not a neighbour; the sheet opens and the jump lands with no visible stall. (h3) Jump while a sync brings or removes letters (servers-on build, the other phone deleting that month's only letter): the list still comes back.
  - (i) **No haptics** anywhere on this page except the long-press menu's `soft`.
  - (j) **Regression.** Delete a letter from its page and Undo on the Book (S36 toast); keep a new letter and see the wash land on its card (5.8 row 5); Settings > Recently deleted lists and restores as before.
- **Record:** S1-151 rows (a) to (j): phone, iOS version, build number and profile, text size and scheme; pass or fail per row with the step that failed; the VoiceOver order heard in (e) in full; screenshots of (a), (b) and (f) in light and dark, with Asha only.

### S1-143 "Put back. Undo" goes away with Change words (QE-02; branch fix/mobile-qe02-stale-put-back)
- **Needs:** any build with this change; Asha's book; a spoken letter whose Review shows at least one small fix (an "um" works).
- **Steps:** (a) On Review, tap a marked fix, then Put back; read the line under the letter. Tap Undo; the fix returns. (b) Put the fix back again, then tap Change words without touching the line. Type a word, then Done. (c) Repeat (b) but tap Done without typing. (d) VoiceOver on: repeat (a) and (b).
- **Expected:**
  - (a) "Put back." with Undo and Close under the letter; Undo restores the fix, as before.
  - (b) and (c) The line goes as soon as Change words opens the page, and it does not come back after Done. The fix stays put back (the letter keeps the words as said there).
  - (d) VoiceOver announces "Put back." once in (a); nothing about it after Change words.
- **Record:** S1-143 rows (a) to (d): phone, iOS version, build number and profile; a screenshot after Done in (b), with Asha only.

### S1-110 Letters that are waiting are in the export (PL-2, F14-REQ-039; founder decision F5; export format 1.6.0; branch feat/billing-pl2-held-export)
- **Needs:** any build with this change; a Mac or PC to open the ZIP. For (b), a `production` profile build (the alpha keeps every letter, so nothing is held there).
- **Steps:** (a) In Asha's book, record a letter and leave Review without keeping it; start a typed letter on Write and leave it. Settings > Export everything, then Save to Files and open the ZIP on a computer. (b) Production profile, Plus off, two letters already kept: record a third, tap Keep, choose "Keep it here for now", then export as in (a). (c) Airplane mode on, export again.
- **Expected:**
  - (a) and (b): a `waiting/` folder with one `.txt` per waiting letter (your own words, typed or exactly as heard) and the spoken one's recording (`.m4a` or `.aac`) that plays in any player; `data/waiting.json` lists each one with its reason (`not_read_back`, `typed_draft`, `held_at_keep`). The ready screen counts nothing new.
  - On a Mac, `shasum -a 256 waiting/<file>` equals that file's line in `manifest.json` and its `sha256` in `data/waiting.json`.
  - (c) The export finishes with no connection, with the same `waiting/` files.
  - A letter let go before the export is not in it.
- **Record:** S1-110 rows (a) to (c): phone, iOS version, build number and profile; the list of files under `waiting/`; the shasum line for one recording; screenshots with Asha only.

### S1-133 Delete this book, Restore, Erase now, and Erase everything on this phone (PR #520; RT-BK-12, SR-C-07; DATA-REQ-014, DATA-REQ-024, F17-REQ-080; D-083, D-103; design 2.12; CTO ruling 8 Nov; council and founder decision 8 Nov)
- **Needs:** a build with PR #520 on a phone that has never signed in (both rows are hidden once a phone signs in); the SE 3 and the founder's iPhone; two fictional books, Asha's with spoken and written letters and a draft, and a second one with one letter; reminders on; the English speech download installed. Fictional family only (Asha, Papa). For (i), a development build and a Mac with Xcode. For (j), a build with App lock (PR #640, S1-131) and a passcode set on the phone. For (k), a phone that still has build 9 installed with letters and recordings in it (any phone for the first part; for the second part only a test phone with Asha's book, or a phone whose book has been exported and saved off the phone first, see the warning in (k)). For (l), a TestFlight build of the `production` profile (bundle id `com.earlyletters.scribe`, after Mon 9 Nov) on a drill phone and a drill Apple Account (AL-09 "Drill identities"): the Plus products load only there, and (l) cannot run on the `.preview` alpha or a development build.
- **Steps and expected:**
  - (a) Delete this book: Settings > Asha > Delete this book (below Hide this book). Step 1 shows Export everything first and Continue. Step 2 asks for the typed word "delete" before **Delete the book**; **Keep the book** backs out. After deleting, Asha's book is gone from the Book tab, Tonight, Export and the reminders, and Settings > Recently deleted shows one card with **Restore the book** and **Erase now**. The second book is untouched.
  - (b) Restore the book: every letter and the draft come back, and a spoken letter plays.
  - (c) Delete it again, then **Erase now** on the card: the card goes, and after a kill and relaunch the book does not come back. The second book is untouched. Settings > Storage lists only the language and speech downloads, so it shows nothing for this. To see the space come back, look at the app in iPhone Settings > General > iPhone Storage (iOS updates that figure slowly); on a development build, step (i) lists the files.
  - (d) Erase everything: Settings > Your letters > Erase everything on this phone. The page title is "Erase everything on this phone", then the heading "What is erased", then the body "This removes every book, letter and recording from this iPhone, and your settings. We hold no copy.", then these lines in this order, all in the same quiet note style as each other (none in body weight): "Exports you already saved, and backups of this phone such as iCloud Backup, are not changed." (it names exports and backups, and it comes straight after the body), "This happens on this phone only. Nothing is sent anywhere.", and "Your spoken language stays ready, because it holds nothing of yours. You can remove it in Storage." On a `production`-profile build there is one more line after those: "Your free letters start again." (also in the quiet note style), and on the alpha build (TestFlight `.preview`, development) it is not there, because there is no letter limit (S1-37). The Plus line has its own row, (l). Then "Save a copy first?" with **Export your book**, then **Erase everything** in the destructive style (not the large button). There is no typed word.
  - (e) Tap **Erase everything**: one `warning` haptic and the system alert "Erase everything on this phone?" with "This cannot be undone.", **Keep everything** first and **Erase** second in red, and Erase is not the bold default. Tap **Keep everything**: the alert closes and nothing changes (books still in the Book tab).
  - (f) Tap **Erase everything** again, then **Erase**: the "Erasing" screen appears with no back button; the edge swipe does nothing. Then the age question replaces every screen. Answer it: first run starts from the beginning, no book or letter remains, Notification Center holds none of the app's letter reminders and none arrives at the old reminder time, and Settings > Storage still lists the English speech download. A Plus subscriber's plan reminders (trial and yearly renewal notes, ids that start with `plan.`) are not letter reminders and stay on purpose: the plan belongs to the Apple Account, and they say nothing about a child or a letter. Their staying is not a fail; a letter reminder staying is. On a production-profile build the free letters start again (the alpha build shows no limit, S1-37).
  - (g) Kill after confirming: set up a book again, Erase everything, tap **Erase**, and kill the app from the app switcher at once (while "Erasing" shows, or as soon as possible after). Relaunch: it opens on the age question, with no book.
  - (h) VoiceOver: on the page the order is the title, "What is erased", the body, the note lines in the order of (d) (the same as the order drawn), "Save a copy first?", Export your book, then Erase everything; the alert reads its title, body and both buttons; the Erasing screen is announced as busy; after the erase "Everything on this phone is erased." is spoken. Dynamic Type AX5 on the SE 3: nothing truncated and Export comes before Erase everything.
  - (i) Optional, development build: after (f), Xcode > Devices and Simulators > Download Container. The app's Documents and Caches hold no recording, export or recovery ZIP; only the speech model and language packs remain.
  - (j) App lock on (F1): with the lock on and Immediately chosen, do (f). After Erase no cover and no lock screen shows, not behind the age question and not after it; first run starts, and its end offers the lock again as on a new phone. Leave the app for 70 s and come back: nothing locks. Settings > App lock reads Off. Then turn the lock on again, do (g) (kill during "Erasing"), and relaunch: the age question comes first, with no lock screen in front of it.
  - (k) Upgrade over build 9. **Warning: (d) to (f) erase everything on the phone and cannot be undone. Run them only on a test phone with Asha's book, or on a phone with real letters only after the person has exported the book and saved the copy off the phone (Settings > Your letters > Export your book, save it to Files, then check the file opens). Without that, stop after the first part.** First part, on any phone: with build 9 installed, note how many letters it holds and play two recordings. Install this build over it and open it (the first open rebuilds the database file once, so allow a few seconds). Every letter is still there, the same count, every book and every recording plays as before. Second part, only on a phone allowed by the warning: run (d) to (f). Note counts only; the record names no child and quotes no letter.
  - (l) **Store build only: the Plus line.** Needs the `production`-profile build named above; on the `.preview` alpha or a development build the Plus products do not load and the line never shows, so mark (l) "not run: needs the production build", not failed. On a phone that has never signed in, Plus off, open Settings > Your letters > Erase everything on this phone. Expected: the lines of (d) in their order, ending with "Your free letters start again." and no Plus line. Start Plus on the drill Apple Account (Settings > Plan, See Plus, the sandbox purchase), then open the Erase page again. Expected: "Erasing does not cancel Plus. Billing continues through Apple until you cancel." now sits after the speech line and before "Your free letters start again.", in the same quiet note style (not body weight); VoiceOver reads it in that position. Optional: cancel the renewal in the Apple Account's subscriptions (the sandbox keeps Plus on until the period ends), reopen the page, and note whether the line is gone (it is shown only while Plus will renew). With Plus on, do (e) and (f). Expected: after the erase, Settings > Plan still shows Plus on and the subscription is still listed in the Apple Account's subscriptions; the erase did not touch it. On a phone that has Plus only through Family Sharing (a family member's phone, with no purchase of its own), the Plus line does not show; the other lines are as above.
- **Record:** S1-133 rows (a) to (l): build number and profile, phone, iOS version, pass or fail, and for any fail which step and a screenshot (Asha only; for (k) on a phone with real letters, only the counts).
- **Not covered:** the line shown when an erase does not finish ("Erasing did not finish. Try again now. If you wait, the app finishes it the next time it opens, and that erases anything you add before then.") cannot be made to show on a phone, because it needs a file that will not delete; `apps/mobile/test/erase-all.test.ts` runs both halves of it (Erase everything again finishes it; the next launch erases a letter written in between) and the page's use of the line; device authentication (Face ID or passcode) before Erase everything, deferred to the 1 Dec build by the CTO ruling of 8 Nov (the app lock, #640, is now in the build; asking it before Erase everything is the follow-up); Erase everything on a signed-in phone (F17-REQ-026, not built); Android.

### S1-95 Settings home, regrouped: header card, the Plan row and five groups (settings-ia.md 3; CDesO-1, CCO-9; branch feat/mobile-settings-regroup)
- **Needs:** a TestFlight build of the `testflight` profile (alpha, servers off) with Asha's book set up as Mama; the production-profile build of build 12 for (f); any phone; Larger Text at AX5 and VoiceOver.
- **Steps:** (a) Open Settings. Read the card at the top, the row under it, then each group heading and its rows top to bottom. (b) Tap the card, then tap Plan. (c) Go back, tap Legal, then each of its three rows. (d) At AX5, read the card and every row. (e) With VoiceOver, swipe from the card to the last line. (f) On the production-profile build, read the Plan row with Plus off, then follow "Settings, Plan, Manage subscription" as the Subscription Terms write it.
- **Expected:**
  - (a) The card reads "Mama", then "On this phone", with no chevron and no plan word. Directly under it, a row labelled "Plan" with "Plus is not part of this test. Every letter is free while you test." Then: Children (Asha, Add a child); Writing (Spoken language, Your words, Reminders, Appearance); Your letters (Where your letters live, Export your book, Recently deleted, Storage, and, in red, last, Erase everything on this phone on a phone that has never signed in: PR #520, S1-133); Privacy and security (App lock with On or Off, then Privacy); Help and legal (Help, If you are struggling, Legal); About (version, the early-version note, the sign-off). No Account or Delete account rows, and no "Private by default" line on home.
  - (b) Tapping the card does nothing. Plan opens in one tap (CCO-9, "Settings, Plan").
  - (c) Legal lists Terms of Service, Privacy Policy and Licenses. The two documents open in the in-app browser; Licenses opens its own page.
  - (d) Nothing truncates; the card grows and its lines stack.
  - (e) The card is one element, read as the name and "On this phone", not as a button; Plan is read as a button with its value; each group heading is a heading.
  - (f) The Plan row reads "Plan", value "Free", and "Your first two letters are free. Plus lets you keep adding letters." Settings, Plan, Manage subscription reaches Apple's subscription page in the steps the Subscription Terms write.
- **Record:** S1-95 rows (a) to (f) with the build number, profile, phone, iOS version and text size; screenshots with Asha only.
- **Update:** `docs/design/screens/SETTINGS_AND_ACCOUNT.md` section 6 where a result differs.

### B1-01 Backup spike WP-F08-B1 (F08 section 11.2; M16). Two iPhones, one Apple Account
- **Needs:** S05's spike build of `apps/mobile/modules/scribe-keys` (development client) on both phones; both phones signed in to the same Apple Account with iCloud Keychain on; Wi-Fi; a 15 MB test file made from a fictional recording (P-08); the staging Storage bucket S05 names for the spike. S05 pairs with the tester (mode `pair`).
- **Steps:** (a) On phone A create the synchronizable test item; note the clock time. On phone B poll until it appears; note the time. Delete it on phone A; note when it is gone on B. Repeat once in the other direction. (b) On the SE 3, seal and encrypt the 15 MB file in 64 KiB AES-GCM segments five times; note each time and the thermal state. (c) Start the resumable upload of the file; kill the app at about half; relaunch; note whether it resumes from the last finished part or from zero, and the part size. (d) If an iOS 17 phone is at hand, run the HPKE availability check on it; otherwise record "not measured: no iOS 17 phone" (SE 3 B is ordered at T12).
- **Expected:** (a) the item appears on B within 2 minutes (F08 assumption A2) and deletion reaches both phones; (b) about 1 s or less per 10 MB on SE 3 (F08 section 9, an assumption); (c) the upload resumes without re-sending finished parts.
- **Record:** B1-01 row in the session's evidence file (WP-F08-B1): Keychain item made on A at hh:mm and seen on B at hh:mm (minutes); deleted on A and gone from B (yes, no, minutes); 15 MB encrypt time on the SE 3 in s; upload resumed after the kill (yes, no; parts re-sent); HPKE on iOS 17 (yes, no, or "not measured: no iOS 17 phone"). No key material, item names or tokens.
- **Update:** F08 section 13 A2 and section 9 (through the PM lane), and the owner-backup ADR draft (T13). A failure of (a) is a stop for the per-author key design and goes to the founder and S05 the same day.

---

## Part 1b. 1 Dec and 1.0.1: account and experience items (S1-50 to S1-74)

Written 1 to 8 Nov 2026 by `qa` from the founder's decisions F1 to F11 and PL-1 (`infra/exec-rulings-2026-11-01-account-security.md`; the two council files of 1 Nov, account and experience) and the release map in the experience council's Part 3. Nothing here is built yet: every item is **planned** and runs on the first build that carries the change. The ids start at S1-50 so they cannot meet the S1-38 to S1-4x numbers other branches are adding at the same time.

Every item lists its **Owner** (the agent that builds the change and fixes a failure) and its **Basis** (the decision codes and requirement ids it proves). Automatable halves of the same items are rows in `docs/qa/release-test-catalog.csv` (areas Lock, Before you begin, Where letters live, Your words, Erase, Settings 1 Dec, Reminders 1 Dec, Privacy page, Helplines, Held letters, Plus lines, Memory card, Motion, Prompts, and the rows whose area ends in 1.0.1); each item below names its rows.

Shared setup for every item: the fictional family only (Asha, Mama, Papa); a production-profile build unless the item says otherwise; run on the SE 3 and one current phone (REF), plus the SE 2 (Touch ID, D1 in RELEASE_TEST_PLAN section 3) where an item says Touch ID. "The matrix" means: VoiceOver on (the S1-23 rules: focus, labels, escape), text size AX5, Reduce Motion on, Dark appearance, and Increase Contrast once. "Low storage" means the phone filled as in S1-14 (under 1 GB, then under 50 MB). "Offline" means airplane mode with Wi-Fi off.

### 1 Dec: account items (F1)

If counsel has not approved the Face ID purpose string by Fri 20 Nov, the lock moves to the first 1.0.x and S1-50 to S1-55 run on that build instead (F1 default). S1-56 to S1-61 ship on 1 Dec either way.

### S1-50 App lock: the offer, the page, and when it locks (1 Dec; F1, CPO-2, CISO-1, CDesO-1; F17-REQ-008, F17-REQ-010, F17-REQ-011)
- **Owner:** mobile (lock), security (policy), content (lines).
- **Needs:** a build with the lock module; a phone with Face ID and a passcode; the SE 2 or SE 3 for Touch ID; a third phone, or the same phone later, with no passcode set.
- **Steps:**
  - (a) Fresh install. Pass Before you begin, set up Asha's book, reach "The book is open". Read the lock offer. Tap Not now. Open Settings: read the App lock row on home and in Privacy.
  - (b) Fresh install again; at the offer tap Turn on Face ID. Answer the system Face ID permission alert with Allow. Repeat on another install with Don't Allow.
  - (c) Settings, App lock: turn the switch off, then on. Choose each "Ask again after" value.
  - (d) Grace, lock on, value "After 1 minute": send the app to the background for 50 s and return; then for 70 s and return. Value "Immediately": background for 2 s and return. Value "After 5 minutes": 4 min 50 s, then 5 min 10 s. Force-quit and cold start under each value.
  - (e) Inactive never locks, value Immediately: pull down Control Centre and the notification shade; take a screenshot; let a call banner come in and decline it; open the share sheet from Export and leave it open for 2 minutes.
  - (f) No passcode set: run (a) on the phone with no passcode. Then open Settings, App lock.
  - (g) Touch ID (SE): run (a) and (b).
  - (h) The matrix, on the offer card and the App lock page.
- **Expected:**
  - (a) The offer shows once, after "The book is open", never before the first letter path. Turn on and Not now have equal weight (same size and style). After Not now nothing is stored as a refusal, the lock is off, and the App lock row reads Off in both places. One setting: changing it in one place changes the other (CDesO-1, tie-break 6).
  - (b) Allow: success haptic, the toast "Face ID lock is on." and the lock is on. Don't Allow: the lock is on with the passcode, and the line "Face ID is off for {app} in iPhone Settings, so your passcode opens the book." shows ({app} is the name from `packages/brand`). No error haptic.
  - (c) Turning on and turning off each ask the device first (system sheet with "Confirm it is you to turn on the lock" or "Confirm it is you to turn off the lock"). Cancel leaves the switch where it was. The choices show only while the lock is on; "After 1 minute" is the default.
  - (d) 50 s: no cover. 70 s: cover. Immediately: cover on any return from the background. 4 min 50 s: no cover; 5 min 10 s: cover. Cold start: cover under every value. No letter, name or child row is drawn before the device says yes (F17-REQ-008).
  - (e) None of these locks the app; the share sheet stays usable for the whole 2 minutes.
  - (f) No offer card at all. The App lock switch is disabled with "This iPhone has no passcode. Set one in iPhone Settings, then turn on the lock here."
  - (g) Every line says Touch ID, not Face ID.
  - (h) Nothing truncated at AX5 (buttons stack, value under title). VoiceOver reads the offer title first, both buttons as buttons, the switch with its state and the hint "Asks you to confirm it is you first."; each grace choice reads selected or not. Reduce Motion: the card arrives by fade. Dark: every control edge visible.
- **Record:** S1-50 rows (a) to (h): phone, iOS, text size, VoiceOver yes or no, the measured seconds in (d), pass or fail.
- **Catalog:** RT-LOCK-01 to 06, RT-LOCK-10, RT-LOCK-13.

### S1-51 Lock screen and the app switcher cover (1 Dec; F1, CISO-1; F17-REQ-008, F17-REQ-009)
- **Owner:** mobile, design-systems.
- **Needs:** S1-50 done with the lock on, value Immediately; at least 3 kept letters, one private letter, one draft typed on Write.
- **Steps:**
  - (a) On each of Tonight, an open letter, Review with words, Write with typed words, the Book, Read together and Settings: swipe up to the app switcher and hold. Take a screenshot of the switcher each time.
  - (b) Return from the switcher. Watch the Face ID sheet. Succeed. Time from success to the screen (screen recording at 60 fps).
  - (c) Return and Cancel the system sheet. Then tap Unlock. Then cancel again and wait 30 s.
  - (d) The matrix on the lock screen. With VoiceOver, swipe through every element of the cover.
  - (e) Search Spotlight for "Asha" and for a word from a letter while the app is locked.
- **Expected:**
  - (a) Every switcher card shows the cover: the background and the mark only, no letter words, no child name, no age line. It is drawn at once (no fade a snapshot could catch). F17-REQ-009.
  - (b) The system sheet appears once on its own. Content within 1 s of success; the cover fades out over `fadeMs`; no haptic.
  - (c) After Cancel only Unlock and the cover remain; the system sheet never reopens by itself, never loops. Unlock opens it again.
  - (d) VoiceOver: focus on Unlock; hint "Opens the book with Face ID."; the cover reads only the app name. AX5: Unlock fully visible. Reduce Motion: no movement, the fade only. Dark and light: the mark readable, Unlock contrast passes.
  - (e) Nothing from the app (F17-REQ-007).
- **Record:** S1-51 rows (a) to (e) with the switcher screenshots (Asha only) and the measured time in (b).
- **Catalog:** RT-LOCK-02, RT-LOCK-11, RT-LOCK-13.

### S1-52 Face ID fallbacks: lockout, biometrics changed, passcode removed (1 Dec; F1, CISO-1; F17-REQ-008)
- **Owner:** mobile, security.
- **Needs:** S1-50 with the lock on; a second face (Alternate Appearance) or a second finger available to enrol; permission to remove the passcode for a few minutes on a test phone.
- **Steps:**
  - (a) Fail Face ID on purpose (cover the camera, or another face) until iOS asks for the passcode. Enter it.
  - (b) Lockout: keep failing until biometrics are locked out (iOS then needs the passcode for Face ID in general).
  - (c) Biometrics changed: in iOS Settings set up an Alternate Appearance (or add a finger on Touch ID). Return to the app.
  - (d) Face ID permission turned off for the app in iOS Settings, Face ID and Passcode, Other Apps, after the lock is on. Return.
  - (e) Passcode removed: iOS Settings, Turn Passcode Off. Return to the app. Then set a passcode again and return.
  - (f) VoiceOver on during (a) and (e).
- **Expected:**
  - (a) The system passcode screen appears; the app never shows a PIN of its own. Entering it opens the book.
  - (b) The same: passcode, then the book. No app error line, no error haptic.
  - (c) Record what happens. Expected for 1 Dec: the passcode policy still opens the book; the app shows the "Face ID changed" line only if the native check shipped (CISO-1); without it, no line. Either way the book is never wiped and no letter is lost.
  - (d) The passcode opens the book and the "Face ID is off for {app}" line shows once.
  - (e) The lock turns itself off and says once: "The lock is off because this iPhone has no passcode. Set one to turn the lock on again." (F17-U21). Setting a passcode again does not turn the lock back on by itself; the App lock page offers it. Reminders' names row is enabled again only because the lock is off.
  - (f) The passcode screen and the one-time line are each read once.
- **Record:** S1-52 rows (a) to (f); for (c) write down exactly what showed.
- **Catalog:** RT-LOCK-05, RT-LOCK-06.

### S1-53 Never during recording (1 Dec; F1; security.md 2; F17-U23, F17-REQ-008)
- **Owner:** mobile.
- **Needs:** lock on, value Immediately; English words on the phone.
- **Steps:**
  - (a) Speak, talk for 20 s, press the side button to lock the iPhone for 60 s, unlock the phone, carry on talking, Finish.
  - (b) Speak, go to the Home Screen for 2 minutes, come back, Finish.
  - (c) Speak, then receive a phone call (second phone) and answer it; hang up after 30 s; return.
  - (d) Speak, then pause and resume twice, then Finish; feel for haptics.
  - (e) Speak for 2 minutes with Low Power Mode on and the lock on; Finish; keep the letter.
  - (f) Type on Write, send the app to the background for 2 minutes mid-sentence, return.
- **Expected:**
  - (a), (b) No cover appears while capture runs; the recording keeps going and the clock is right; after Finish the lock applies at the next return from the background (or at once if the grace has passed, per the policy row in RT-LOCK-03). The take is whole.
  - (c) The take is kept (LEGAL-REQ-011 behaviour unchanged); the cover is drawn while inactive; after unlock the app is on Review with the saved take (F17-U23).
  - (d) No haptic of the lock lands between start and stop, and no pause or resume tick (motion step 2).
  - (e) The letter keeps with its words.
  - (f) The cover shows on return; after unlock Write has every word typed and the caret at the end (S1-36 (h) still holds).
- **Record:** S1-53 rows (a) to (f): take length against the clock, pass or fail.
- **Catalog:** RT-LOCK-03.

### S1-54 Export asks again (1 Dec; F1; security backlog 2; LEGAL-REQ-034)
- **Owner:** mobile, security.
- **Needs:** lock on; 5 letters with recordings.
- **Steps:**
  - (a) Settings, Export your book. Succeed at the system sheet. Save to Files.
  - (b) Export again and Cancel the system sheet.
  - (c) Export with the share sheet left open for 3 minutes (value Immediately), then save.
  - (d) Turn the lock off; Export.
  - (e) Low storage: export with under 50 MB free, after the device says yes.
  - (f) Offline: export.
  - (g) The matrix on the reason sheet and the Export screen.
- **Expected:**
  - (a) The system sheet reads "Confirm it is you to export your book" before any ZIP is built; then the share sheet. The ZIP opens on a Mac (S1-21).
  - (b) Cancel builds no ZIP, leaves nothing in the cache, shows no error.
  - (c) No lock while the share sheet is open; the save works.
  - (d) No system sheet; Export works as today.
  - (e) The existing low-space failure names its cause and offers Export again; nothing half-written is left.
  - (f) Export needs no network and works.
  - (g) VoiceOver reads the reason; nothing truncated at AX5.
- **Record:** S1-54 rows (a) to (g).
- **Catalog:** RT-LOCK-07.

### S1-55 Lock and reminders: names hidden, opening from a notification (1 Dec; F1; F17-REQ-015, LEGAL-REQ-054; F17-U22)
- **Owner:** mobile.
- **Needs:** reminders on with "Names in notifications" on; a reminder time 2 minutes ahead; then lock on.
- **Steps:**
  - (a) Turn the lock on. Open Settings, Reminders.
  - (b) Wait for the reminder on the Lock Screen and in Notification Centre. Read it.
  - (c) Tap it with the app killed, then with the app in the background.
  - (d) Turn the lock off and wait for the next reminder.
- **Expected:**
  - (a) "Names in notifications" reads off and cannot be changed, with "Names stay hidden while App lock is on." The App lock page footer reads "When the lock is on, reminders never show a name."
  - (b) No child name and no letter words in title or body (F17-REQ-015, LEGAL-REQ-054).
  - (c) Cover first; after unlock the app opens where the reminder points (F17-U22).
  - (d) The parent's earlier choice (names on) returns; the reminder may carry the name.
- **Record:** S1-55 rows (a) to (d), a Lock Screen screenshot (Asha fixture).
- **Catalog:** RT-LOCK-08, RT-RMD-07.

### S1-56 Before you begin: the age question, the unticked box, the No path (1 Dec; F2, CCO-6, CLO-4, CPrivO-3; LEGAL-REQ-002, LEGAL-REQ-001; D-026)
- **Owner:** mobile, content; legal reads the result (counsel Q-A to Q-C).
- **Needs:** fresh installs; a second phone or reinstall for the No path; a TestFlight build 1 install that already passed the old gate, for (h).
- **Steps:**
  - (a) Fresh install, open. Read the screen without touching it.
  - (b) Tap Continue with nothing chosen.
  - (c) Tap Yes, leave the box unticked, tap Continue.
  - (d) Tick the box, tap Continue.
  - (e) Fresh install: tap No, tick the box, Continue. Relaunch. Move the clock 23 h, then 25 h, relaunch each time.
  - (f) Fresh install: tap No with the box unticked, Continue.
  - (g) Fresh install: tap the Terms link, come back; tap the Privacy link, come back. Then offline, tap each link.
  - (h) Update the build 1 install that passed the old gate to this build.
  - (i) The matrix. VoiceOver: swipe the whole screen in order.
- **Expected:**
  - (a) "Are you 18 or older?", Yes and No with neither selected, the box unticked, both links, Continue enabled.
  - (b) "Choose Yes or No." above Continue, announced; nothing stored.
  - (c) "Check the box to continue." above Continue; focus moves to the box; nothing stored (no `ageGate.passed`, no Terms row).
  - (d) Welcome follows. Stored: `ageGate.passed` as a boolean with no time, and one local Terms row (version, time, surface, app version, text hash) that is never logged (RT-BYB-03 proves the record).
  - (e) The stop screen (`ageGate.stopTitle`, "{app} is currently for adults 18 and over") whatever the box said; at 23 h still stopped; at 25 h "I answered by mistake" shows (D-026). Nothing but the stop time is stored.
  - (f) Same as (e).
  - (g) Each link opens the in-app browser and returns to the screen with the answer and the box as they were. Offline, the browser shows its own error; the screen state is kept; Continue still works without a network.
  - (h) The one-time agreement screen (title "Before you continue") with only the box and Continue; the age is not asked again. If counsel Q-C has not answered by the build, record that this screen is absent and file it.
  - (i) VoiceOver order: question (heading), Yes, No, the box ("checkbox, not checked", then "checked"), Terms link, Privacy link, the reason line when shown (read as it appears), Continue. Each link has the hint "Opens in a browser inside the app." The box row is at least 44 pt tall. AX5: nothing truncated, Continue reachable by scroll. Reduce Motion: the reason line fades only. Dark: the box edge visible (3:1).
- **Record:** S1-56 rows (a) to (i), with screenshots of (a), (c), (e).
- **Catalog:** RT-BYB-01 to RT-BYB-07.

### S1-57 Where your letters live (1 Dec; F1, F4, CPrivO-4, CCO-8, CLO-5; LEGAL-REQ-044; D-033, D-126)
- **Owner:** mobile, content, privacy.
- **Needs:** a book with 5 letters, one recording without a letter and one recording that may not play (S1-31's seed), no export yet; the DL-03 restore drill result.
- **Steps:**
  - (a) Settings, Where your letters live. Read every line.
  - (b) Tap How to check.
  - (c) Tap Export your book, finish an export, come back.
  - (d) Remove the orphan and the unplayable recording (or use a book with none) and come back.
  - (e) Offline: open the page and tap How to check.
  - (f) The matrix.
- **Expected:**
  - (a) "On this phone": "Your letters and recordings are kept on this iPhone." The iPhone backup row reads "Includes your letters and recordings, if iCloud Backup is on." only if DL-03 passed; if DL-03 failed or did not run, it reads "Includes your recordings, if iCloud Backup is on." (CCO-8). The export row reads "Save a copy any time." and the nudge shows. "Encrypted backup: Not in this version". The footer: "Your iPhone backup brings the book to a new iPhone. An export is a copy to open and keep. We hold no copy." No "lost", "stolen", "coming" or "coming soon" anywhere. No On or Off is shown for iCloud Backup (the app cannot read it). Erase everything on this phone is the last row and is not the large button.
  - (b) Apple's help page opens in the in-app browser.
  - (c) "Last export: {date}" with today's date; the nudge is gone.
  - (d) The two rows are gone when their counts are 0.
  - (e) The page renders fully; How to check shows the browser's own error.
  - (f) VoiceOver reads each row with its value; How to check has the hint "Opens Apple's help page."; AX5 stacks value under title, nothing truncated; Dark readable.
- **Record:** S1-57 rows (a) to (f) and which backup line showed, with the DL-03 result.
- **Catalog:** RT-WLL-01 to RT-WLL-04.

### S1-58 Your words: two choices, one meaning (1 Dec; F1, CDesO-1; D-086)
- **Owner:** mobile, content.
- **Needs:** English words on the phone; a phone upgraded from a build that had the "Word for word" switch Off, and one with it On.
- **Steps:**
  - (a) Settings, Your words. Read the page.
  - (b) Choose "Exactly as said". Speak a letter with an um and a repeat ("Asha, um, you you held the spoon").
  - (c) Choose "Small fixes, marked". Speak the same letter.
  - (d) Open a letter kept before the change.
  - (e) On each upgraded phone, open Your words first.
  - (f) The matrix.
- **Expected:**
  - (a) Two choices, each with one line; the example sentence in letter type with one marked fix; the footer "Either way, we never rewrite your words."
  - (b) Review shows every um and repeat, no marks.
  - (c) Review shows the fixes marked, each with Put it back.
  - (d) Unchanged: the setting never touches kept letters or `raw_transcript`.
  - (e) The old switch's value is the selected choice (On is "Small fixes, marked", Off is "Exactly as said").
  - (f) VoiceOver reads each choice as selected or not and announces the change; tap haptic once; AX5 nothing truncated; Dark readable.
- **Record:** S1-58 rows (a) to (f).
- **Catalog:** RT-YWD-01, RT-YWD-02.

### S1-59 Erase everything on this phone, two steps (1 Dec; F1, CPrivO-1, NAQ-2; WP-F17-15; F17-REQ-012 pattern)
- **Owner:** mobile, data-architect, content.
- **Needs:** a build with PR #520 (or its successor); a book with 2 children, 10 letters with recordings, 1 draft, reminders on, the lock on, Appearance Dark, an export done; a second install with no passcode for (g).
- **Steps:**
  - (a) Where your letters live, Erase everything on this phone. Read step 1. Tap Export your book, then come back.
  - (b) Tap Erase everything; at the dialog tap Cancel.
  - (c) Again; at the dialog tap Erase; at the device sheet Cancel.
  - (d) Again; Erase; succeed at the device sheet. Watch the screen to the end.
  - (e) After (d): check Settings (it should be first run), iOS Settings, General, iPhone Storage for the app's size, Notification Centre for scheduled reminders the next evening, and Files for the export.
  - (f) Kill the app during "Erasing" (second run of (d)); relaunch.
  - (g) No passcode on the phone: run (d).
  - (h) Low storage: run (d) under 50 MB free.
  - (i) The matrix on both steps and the Erasing screen.
- **Expected:**
  - (a) "This removes every book, letter and recording from this iPhone, and your settings. We hold no copy." "Save a copy first?" with Export your book; Export opens and returns here.
  - (b), (c) Nothing is erased; every letter, setting and reminder is still there.
  - (d) The dialog "Erase everything on this phone?" with "This cannot be undone.", Erase second and never the default, warning haptic; then the device sheet "Confirm it is you to erase everything on this phone"; then "Erasing" with no way out; then Before you begin, with "Everything on this phone is erased." announced.
  - (e) No letters, children, drafts or recordings; the app's Documents size is back to the install size plus any kept speech model (record whether models are kept); no reminder arrives; the lock is off; Appearance is back to System; the export in Files is untouched.
  - (f) On relaunch the erase finishes or "Erasing did not finish. Try again." shows; never a half book with letters missing their recordings.
  - (g) Record what the device step does with no passcode (security 2 has no rule for it). Expected and to confirm with security: the two in-app steps still guard it; the erase never runs without both.
  - (h) The erase completes (erasing frees space).
  - (i) VoiceOver: the step 1 title is a heading; the dialog's buttons read in order with Erase last; AX5: Export your book comes first and nothing truncates; Reduce Motion: no slide; Dark: the destructive colour has words and an icon, not colour alone.
- **Record:** S1-59 rows (a) to (i), the app size before and after.
- **Catalog:** RT-ERS-01 to RT-ERS-05.

### S1-60 Settings, regrouped (1 Dec; F1, CDesO-1, CDesO-2, CCO-9, CLO-5; LEGAL-REQ-062)
- **Owner:** mobile, content.
- **Needs:** one child; then two children; Plus off, then Plus on (sandbox) for the header value.
- **Steps:**
  - (a) Open Settings. Count the rows. Read the header card and each group heading.
  - (b) Tap the header card.
  - (c) Open Legal; open each of Terms of Service, Privacy Policy and Licenses.
  - (d) Read the About group and the last line.
  - (e) Add a second child; read Children.
  - (f) Storage: read the page with one language; start a second language download; go offline mid-download; remove a language.
  - (g) Look for Delete account and the old Recordings row.
  - (h) The matrix, and from each way in to Settings (the Book gear, a content link, Add a child), the back chevron (S1-23 V-10 still holds).
- **Expected:**
  - (a) Header card: "Mama", "On this phone", trailing "Free". Groups: Children; Writing (Spoken language, Your words, Reminders, Appearance); Your letters (Where your letters live, Export your book, Recently deleted, Storage); Privacy and security (App lock, Privacy); Help and legal (Help, If you are struggling, Legal); About. 13 rows with one child in build 1.
  - (b) Plan opens in one tap (CCO-9: "Settings, Plan" stays true).
  - (c) Each opens its page; Licenses scrolls (S1-30).
  - (d) Version reads `{version} ({build})` with the build from the binary; "early" appears once, in the registered note (CLO-5); the last line is "Made with care in California" with the heart icon hidden from VoiceOver (CDesO-2).
  - (e) Both children listed with Add a child.
  - (f) "Space used" with one row per language and its size; no row reads "All languages, Speech model"; the shared detector is in the language's size and, with two languages, the footer "Includes {size} shared by all languages."; the download shows its progress in place of the size; offline shows "Downloads need a connection. Try again once you are online."; Remove asks "Remove English from this phone?" and letters stay. Language download is offered only here.
  - (g) Neither appears in build 1.
  - (h) VoiceOver: the header card is one element ("Mama. On this phone. Plan, Free", hint "Opens Plan."); group headings are headings; AX5 values stack under titles, nothing truncates; Dark readable.
- **Record:** S1-60 rows (a) to (h), the row count, a screenshot of home at default size and at AX5.
- **Catalog:** RT-SIA-01 to RT-SIA-05.

### S1-61 Reminders without the pre-sheet: all 11 states (1 Dec; CDesO-3, CCO-10, CPO-3; LEGAL-REQ-007, LEGAL-REQ-054; M13 rules 1 to 3)
- **Owner:** mobile, content.
- **Needs:** one install that has never asked for notifications (state 1), reset between runs by deleting and reinstalling; a book with a birth date and one without; a second phone where Deliver Quietly can be set.
- **Steps and expected, one per state** (the table in `reminders-settings.md` 2):
  - (1) **Never asked.** Open Settings, Reminders. Expected: switch off; the footer lines visible before touching anything ("Notifications never show what you write." among them, CCO-10). Tap the switch: the iOS alert comes straight away, no sheet of ours.
  - (2) **Allowed.** Allow. Expected: the switch stays on; choices appear under it; "Changes save as you go."; the preview card with real words and no name; "Next: {day} at {time}". Change the time: the Next line changes (cross-fade) and VoiceOver says "Saved. Next: {day} at {time}." once, after the last change.
  - (3) **Denied now.** Reinstall, tap the switch, Don't Allow. Expected: the switch stays on; the card "Notifications are off" with Open Settings; "Not sending yet."; the choices still editable.
  - (4) **Denied before.** Leave and come back. Expected: the same, and no alert.
  - (5) **Back from iPhone Settings.** Tap Open Settings, allow, return. Expected: "Reminders are on." once; the card collapses; the Next line appears and is announced.
  - (6) **Provisional or Deliver Quietly.** In iOS Settings set the app to Deliver Quietly. Expected: counted as allowed; a note that they skip the Lock Screen (record whether it matches what iOS does).
  - (7) **Scheduling failure.** Not reachable by hand on a healthy phone; proved by RT-RMD-05. On the phone, record that no failure line shows when scheduling works.
  - (8) **No name or birth date.** On the book without a birth date. Expected: the preview is neutral; the month row reads "Starts once a birth date is added."
  - (9) **Reduce Motion.** Change the time and the cadence. Expected: fades only, no layout slide.
  - (10) **AX5.** Expected: preview, Next and help wrap, never truncate; the time row stacks; the evening chips wrap; every target at least 44 pt.
  - (11) **VoiceOver after the alert.** With VoiceOver, run (1) to (3). Expected: focus stays on the switch after the alert; the result is announced; the denied card is next in swipe order.
  - Also: (12) Dark mode on every state above; (13) the card after the first letter: "Yes, evenings" raises the alert then the toast "Reminders are on. Next: {day} at {time}." with Change; "Pick a time" opens this page with the switch on; denied shows "Notifications are off" with Open Settings; (14) offline: every state works (local only, M13 rule 1); (15) lock on: names off and disabled (S1-55).
- **Record:** S1-61 rows (1) to (15): pass or fail, the Next line text, a screenshot of (2) and (3).
- **Catalog:** RT-RMD-01 to RT-RMD-08.

### S1-62 Privacy page: three sections, every claim true (1 Dec; CPrivO-5, CPrivO-1, NAQ-2; LEGAL-REQ-044; D-061, D-095)
- **Owner:** privacy, mobile, content.
- **Needs:** the lock off, then on; the App Privacy Report on (iOS Settings, Privacy and Security).
- **Steps:**
  - (a) Settings, Privacy, lock off. Read every line top to bottom.
  - (b) Turn the lock on; read "Who can see it" again.
  - (c) Tap each row: Names in notifications, App lock, Export your book, Recently deleted, Erase everything, Privacy Policy, Terms of Service.
  - (d) After a session with first run, a letter and an export, open the App Privacy Report for the app.
  - (e) The matrix.
- **Expected:**
  - (a) The promise word for word at the top (D-061), plain text, no lock or shield icons. "Where your book is kept": "Your letters and recordings are kept on this phone and in your iPhone's own backup, if you use one. They are not sent to us."; "Your speech is written down on this phone."; "This version collects no usage or crash reports." "Who can see it" with the lock off: "Anyone who can unlock this iPhone can open the book." Never "Only you". "Notifications never show the words of a letter." "What you can do": Export, Recently deleted, Erase everything. No "yet" anywhere. Footer "Private by default. Never sold, never used for ads."
  - (b) "You, after Face ID or your passcode." (Touch ID variant on the SE).
  - (c) Each opens its page; Names in notifications opens Reminders.
  - (d) No network contact by the app except the in-app browser pages opened in (c) and the speech model host (RT-PRV-01).
  - (e) VoiceOver reads section headings as headings; AX5 nothing truncated; Dark readable.
- **Record:** S1-62 rows (a) to (e) and the App Privacy Report screenshot.
- **Catalog:** RT-PRP-01 to RT-PRP-05.

### S1-63 If you are struggling: lines for the phone's region (1 Dec; CCO-11; F20-REQ-001, F20-REQ-002, F20-REQ-003, F20-REQ-005; struggling-page.md 2 and 3)
- **Owner:** mobile, content, support; the founder ticks FT-36.
- **Needs:** a phone with a SIM; an iPad or a phone with no SIM (D10); iOS Settings, General, Language and Region to change the region. Do not complete a call or text: cancel at the Phone or Messages screen.
- **Steps:**
  - (a) Region United States. Open the page.
  - (b) Tap Call on each line; cancel. Tap Text on each line that has one; cancel.
  - (c) Change the region to Canada, United Kingdom, Ireland, Australia, New Zealand and India in turn; open the page each time.
  - (d) Change the region to Germany.
  - (e) Tap "Lines in other countries".
  - (f) On the iPad, tap Call.
  - (g) Offline, open the page.
  - (h) The matrix.
- **Expected:**
  - (a) The emergency line first ("In danger right now?" with Call 911), then NMMH, 988 and PSI, each with Call and Text, then "Lines in other countries", then "Nothing on this page is recorded or sent."
  - (b) Each opens Phone or Messages with the number filled in and never dials or sends by itself.
  - (c) Each region shows its own emergency number and only the lines whose source and `verifiedOn` exist in the table; a line that was not verified is not shown (CCO-11 holds unread lines: PANDA, Canada's cost).
  - (d) "Call your local emergency number." and "Find a free helpline near you", which opens findahelpline.com in the in-app browser.
  - (e) The regions listed, each with its lines.
  - (f) "Number copied" shows and the number is on the clipboard (F20-REQ-005).
  - (g) The page renders; the phone and copy actions work; only the directory link needs a network.
  - (h) VoiceOver reads each line's name and how (call, text, hours); the emergency line first; AX5 the buttons stack; Dark readable.
- **Record:** S1-63 rows (a) to (h), the region list checked, and the release date for F20-REQ-003.
- **Catalog:** RT-HLP-01 to RT-HLP-05.

### 1 Dec: experience items (F5, F6, F11)

### S1-64 Held letters readable, playable, exportable (1 Dec, P0; PL-2, F5, CCO-12; F14-REQ-039 device half)
- **Owner:** payments, mobile; qa signs the hash check.
- **Needs:** a production-profile TestFlight build (Plus on, sandbox tester with no Plus; S1-37 (b)); a Mac with `shasum`.
- **Steps:**
  - (a) Keep 2 letters. Speak a third, keep: at the Keep sheet tap Keep it here for now. Type a fourth and hold it the same way.
  - (b) Open each held letter from Tonight.
  - (c) Play the held spoken letter to the end; scrub; play again offline.
  - (d) Export your book. AirDrop the ZIP to the Mac. Unzip. Compare `shasum -a 256` of each held recording and text file with the manifest.
  - (e) Offline: export again.
  - (f) Buy Plus in the sandbox; let it lapse (sandbox renewal times); after the lapse open, play and export the held letters again.
  - (g) Low storage: export with the held letters.
  - (h) Read the held note on the Keep sheet.
  - (i) The matrix on the held letter page.
- **Expected:**
  - (a) Both held letters stay on Tonight; nothing is lost.
  - (b) A read-only page with the words and, for the spoken letter, the player. No edit, no way to keep it into the book without Plus.
  - (c) Plays fully online and offline.
  - (d) The ZIP has a `waiting/` folder with 2 text files and 1 recording (the typed letter has none); every hash equals the manifest and the originals (F14-REQ-039).
  - (e) Same ZIP contents offline.
  - (f) After the lapse every held and kept letter still opens, plays and exports.
  - (g) The low-space failure names its cause; nothing is half-written.
  - (h) "This letter is safe on this phone. You can read it, play it and export it, and keep it whenever you like." Only if (d) passed; if PL-2 slips, the note does not say "export" (F5 default, CCO-12).
  - (i) VoiceOver reads the held page title, the words in full and the player state; AX5 never truncates letter text (D-027); Reduce Motion fade only; Dark readable.
- **Record:** S1-64 rows (a) to (i), the hash list (file names and hashes only, no letter text).
- **Catalog:** RT-HELD-01 to RT-HELD-05.

### S1-65 Plus lines and status, and the Tonight line after the allowance (1 Dec; F5, CDesO-6, CBO-1, CLO-6; PL-3, PL-4, PL-5, PL-8; F14-REQ-040, F14-REQ-018)
- **Owner:** payments, content, mobile.
- **Needs:** production-profile build; sandbox testers: one with no Plus, one subscribing, one in a Family Sharing group with Plus.
- **Steps:**
  - (a) Fresh install: read Welcome.
  - (b) Keep letter 1; open Settings. Keep letter 2; watch the Book.
  - (c) Before letter 3: open Tonight and Write.
  - (d) Open Settings, Plan, without tapping anything else.
  - (e) Subscribe (sandbox); open Tonight, Write, Settings, Plan.
  - (f) Let the subscription lapse; open Plan and Tonight.
  - (g) Family Sharing tester: Settings header and Plan.
  - (h) The matrix on Plan and on the Tonight line.
- **Expected:**
  - (a) "Your first two letters are free. After that, Plus keeps the book growing. Reading, listening and your copy stay free." No price, no trial length.
  - (b) Header trailing value "Free"; Plan help "Two letters free, then Plus to keep adding." After letter 2, once: "That was your second free letter. Whenever you are ready, Plus keeps the book growing." Not on letter 1, not again.
  - (c) One standing line on Tonight (above Speak) and on Write: "Adding new letters to the book needs Plus. Recording, reading and export are always free." No number, no button, no "{count} letters waiting". Before letter 2 is kept the line is absent.
  - (d) "What Plus includes" readable before Apple's sheet opens; Manage, Restore, Redeem, Refund, Save a copy; no countdown, no save offer, no "Are you sure?".
  - (e) Header "Plus"; the Tonight and Write line gone; Plan shows the plan name and "Free until {date}" or "Renews on {date}".
  - (f) Plan: "Plus ended on {date}. Every letter you kept is still yours." and no sales sentence; header "Free"; the Tonight line back.
  - (g) Header "Plus, shared"; "Shared with you through Apple Family Sharing"; no Manage or Refund.
  - (h) No digit in any header value; VoiceOver reads the header value; AX5 nothing truncated; Dark readable.
- **Record:** S1-65 rows (a) to (h), screenshots of (c), (d), (f).
- **Catalog:** RT-PLN-01 to RT-PLN-06.

### S1-66 The memory card: Not today and the Settings switch (1 Dec; F6, CDesO-5, CR-43 as ruled in the experience council)
- **Owner:** mobile, design-systems.
- **Needs:** a book with a kept letter dated 30 days ago (letter date set on the phone, or the phone's date moved forward 30 days with automatic time off); one recording on that letter.
- **Steps:**
  - (a) Cold launch. Read Tonight.
  - (b) Tap Not today on the card.
  - (c) Send to the background, return; force-quit and cold launch the same day.
  - (d) Move the date one day on; cold launch.
  - (e) Settings: turn "Memories on Tonight" off; go back to Tonight; cold launch. Turn it on again.
  - (f) Open the card; play the recording.
  - (g) Leave the app open across midnight into a day when a memory qualifies; return without a cold launch; then cold launch.
  - (h) The matrix on the card.
- **Expected:**
  - (a) The card "A month ago" with the letter's first lines (fade on a whole word, no ellipsis), and a 44 pt Not today.
  - (b) The card leaves; nothing replaces it; soft haptic; VoiceOver announces it once.
  - (c) The card stays gone all that day (a local per-date flag).
  - (d) The card may show again if a letter qualifies.
  - (e) Off: no card on any day. On: cards return. The switch is on by default.
  - (f) The letter opens; Listen never starts on its own (CDesO-5); no music, no Ken Burns, no drawing.
  - (g) Without a cold launch nothing pops in; the card enters only in the cold-launch stagger.
  - (h) VoiceOver: the card is one element with the kicker, author and date, hint "Opens the memory", and a custom action Not today; the x is also its own button. AX5: Not today becomes a text row; nothing truncates. Reduce Motion: fade only, the space closes at once. Dark: the kicker passes 4.5:1.
- **Record:** S1-66 rows (a) to (h).
- **Catalog:** RT-MEM-01 to RT-MEM-05.

### S1-67 Motion fixes, the late November checklist (1 Dec; CDesO-8, F11; motion.md 3 and 4)
- **Owner:** design-systems, mobile.
- **Needs:** the SE 3 and a 120 Hz Pro; both themes; Xcode Instruments on a Mac.
- **Steps:**
  - (a) Book: open a letter, then Back, ten times.
  - (b) Tonight: tap Speak; feel for haptics until the clock runs. In Listen, pause and resume twice in a 2-minute take; Finish.
  - (c) Instruments, Energy Log and Time Profiler: a 10-minute take on the SE 3.
  - (d) Force-quit; cold launch; watch the splash become Tonight (screen recording).
  - (e) Watch every `ProgressLine` (download, export, Review's words) in light and dark.
  - (f) Press Another thought 10 times quickly.
  - (g) Instruments, Animation Hitches: the five moments (launch, start listening, keeping, opening a letter, a memory).
  - (h) Repeat (a), (b), (d), (f) with Reduce Motion, Reduce Transparency, AX5, VoiceOver and Low Power Mode, one at a time.
  - (i) If `PressableFeedback` merged by 20 Nov: press every control on Tonight, Book, Settings; with Reduce Motion.
- **Expected:**
  - (a) The paper grows from the card (`cardToPage`); never a slide and a grow together; the card's words travel whole; VoiceOver lands on the dateline.
  - (b) One light tick at start, one at Finish, none between (no pause or resume tick).
  - (c) Listen does not re-render at 20 Hz (record renders per second before and after); energy impact no worse than before the fix.
  - (d) The splash fades into Tonight; no cut, no flash; dark and light.
  - (e) The track is visible (3:1 both themes); no number or percent on the line; the line never says "still" while work is moving.
  - (f) The prompt stays legible; never two prompts at once; one tap haptic each.
  - (g) No hitch over one frame; hitch ratio under 5 ms/s.
  - (h) Reduce Motion: the hand-off fade, no travel; Low Power Mode: motion coherent, haptics muted by iOS; AX5 and VoiceOver: nothing lost.
  - (i) Every press answers within one frame; Reduce Motion an opacity dip only.
- **Record:** S1-67 rows (a) to (i), Instruments numbers, the two screen recordings.
- **Catalog:** RT-MOT-01 to RT-MOT-07.

### S1-68 Pregnancy prompts, the wait lines, drawings and what is gone (1 Dec; CPO-7, CDesO-7, CMO-1; F13-REQ-008; BL-535)
- **Owner:** content, mobile.
- **Needs:** a book set up before the birth (due date only); a fresh install on a phone with no speech model; a book with 10 kept letters.
- **Steps:**
  - (a) Pre-birth book: open Tonight on 14 evenings (move the date), and press Another thought 5 times each evening. Write down the keys or the lines shown.
  - (b) Fresh install: speak a first letter while the speech model downloads; read the wait and Review state lines.
  - (c) Keep letter 10 and letter 11.
  - (d) Look at each screen with a drawing (the reuses `envelopeOpen` and `readingLamp`, if merged by 20 Nov).
  - (e) The matrix on (a) and (b).
- **Expected:**
  - (a) Only `before` prompts; at least 12 different ones over the fortnight; none mentions a due date, weeks, labour or a countdown (F13-REQ-008).
  - (b) Only the lines in `wait-content.md` 1 and 2; no time estimate; nothing that says it works offline or in the background (both unverified).
  - (c) No count moment ("10 letters.") anywhere: no toast, no screen, no badge (CPO-7).
  - (d) One drawing per screen at most; never on a control, Plus, the letter page or a notification.
  - (e) VoiceOver reads each line once; AX5 nothing truncated; Dark readable.
- **Record:** S1-68 rows (a) to (e) with the list of prompt keys seen.
- **Catalog:** RT-PRM-01, RT-PRM-02, RT-CNT-01, RT-WAIT-01, RT-DRW-01.

### 1.0.1 items (release map, F11)

### S1-69 Tonight 1.0.1: one question, one card or nothing, the closure line, dayparts (1.0.1; CDesO-4, F6, CPO-8; CR-43)
- **Owner:** mobile, content, product.
- **Needs:** books for each state: first day; a waiting draft and a second draft; a month-day; a memory-eligible letter; none of these (thought or empty); after 5 days away. Phone clock moved for 9 AM, 7 PM and 10 PM.
- **Steps:**
  - (a) Open Tonight in each state at 7 PM.
  - (b) Keep a letter; return to Tonight.
  - (c) The normal book at 9 AM, 7 PM and 10 PM.
  - (d) Over 7 evenings, count the evenings with a small thought.
  - (e) Count the tappable things above the tab bar in each state; read every number on screen.
  - (f) The matrix in (a) and (b).
- **Expected:**
  - (a) Dateline, greeting, one question with Another thought, then at most one card in the ladder order: the newest draft with a quiet "Also waiting" (no number), else an occasion, else a memory, else a small thought, else nothing. No fact ever (F7). After a break: the gap prompt and no card.
  - (b) The closure line ("Today is in Asha's book." or content's final line) replaces the question; the card shows today's letter; never "come back tomorrow"; no haptic.
  - (c) 9 AM: no "tonight" or "today" line that does not fit the morning; 10 PM: no card except a waiting draft.
  - (d) At most 3 in 7; none on the first evening back.
  - (e) At most six tappable things; no number but the child's age.
  - (f) VoiceOver announces the closure line once and focus stays; the card never announces itself; AX5 actions inline under the prompt; Reduce Motion one fade.
- **Record:** S1-69 rows (a) to (f).
- **Catalog:** RT-SLB-01 to RT-SLB-05.

### S1-70 Memories 1.0.1: Keep out of memories, the hard filter, opening the card (1.0.1; CDesO-5, CPrivO-7, Karma tie-break 1)
- **Owner:** mobile, data-architect, design-systems.
- **Needs:** memory-eligible letters: one written to a hard prompt, one private, one quiet day, one by Papa who has left the book (build 2 only, skip in build 1), one before the birth.
- **Steps:**
  - (a) On a day the card shows, open its VoiceOver actions and choose Keep out of memories; then undo from the toast. Choose it again.
  - (b) Open the letter in the Book: find Keep out of memories in its menu; turn it off.
  - (c) Move the date through the eligible windows for each special letter.
  - (d) Tap Not today three days running; then watch 30 days.
  - (e) Open the card (the paper grows from it, with its column).
  - (f) The matrix.
- **Expected:**
  - (a) The card leaves; the undo toast stays until dismissed; undo brings it back; tap haptic.
  - (b) Reversible; the Book never changes.
  - (c) The hard, private, quiet and departed-author letters never resurface; the pre-birth letter only with its switch on (off by default).
  - (d) Memories drop to weekly for 30 days; never the same letter twice in 7 days.
  - (e) `cardToPage` from the card; its lines carry; no slide.
  - (f) As S1-66 (h).
- **Record:** S1-70 rows (a) to (f).
- **Catalog:** RT-MEM-06 to RT-MEM-09.

### S1-71 Another thought on Write and Listen; the question on the letter page (1.0.1; CDesO-9, CAIO-1)
- **Owner:** mobile, design-systems, content.
- **Steps:** (a) Open Write and Listen from Tonight; press Another thought on each. (b) Keep the letter; open it in the Book; then Read together; then Export and open the ZIP; then the PDF. (c) The matrix.
- **Expected:** (a) The question changes in place; focus stays on the button; the take or the typed words are untouched. (b) The question shows above the words on the letter page as an unsigned app note; it is absent from Read together, the export prose and the PDF. (c) VoiceOver reads the note as the app's, not the parent's; AX5 nothing truncated.
- **Record:** S1-71 rows (a) to (c).
- **Catalog:** RT-ANT-01, RT-ANT-02.

### S1-72 Waiting letters after a purchase (1.0.1; PL-6; F14-REQ-041)
- **Owner:** payments.
- **Needs:** production-profile build; 3 held letters; sandbox tester with no Plus.
- **Steps:** (a) Subscribe from the Keep sheet. (b) Read the offer; keep one letter from it. (c) Force-quit; relaunch. (d) Offline relaunch.
- **Expected:** (a) The purchase confirmation, then one offer "Keep the letters that are waiting". (b) Each letter still needs its own Keep; after one, 2 remain held. (c) No second offer, no duplicates. (d) Same, offline.
- **Record:** S1-72 rows (a) to (d).
- **Catalog:** RT-WTL-01.

### S1-73 Book page 1.0.1: cover band, chapters, Months sheet, glyphs (1.0.1; book-page.md 2 and 4; F09-U02 fixture)
- **Owner:** design-systems, mobile.
- **Needs:** the 1,200-letter perf fixture build; a small book of 5 letters.
- **Steps:** (a) Open the Book on the SE 3; scroll from top to end; open the Months sheet and jump to month 3. (b) Read a letter card: excerpt end, voice marker. (c) The matrix.
- **Expected:** (a) No hitch over one frame; sticky headers; the Months sheet jumps without a blank. (b) The excerpt ends on a whole word; the voice marker is a glyph plus a word ("Voice 1:06"), never a play button. (c) AX5: the cover band stacks; VoiceOver reads chapter title and authors; Dark readable.
- **Record:** S1-73 rows (a) to (c), Instruments hitch numbers.
- **Catalog:** RT-BKP-01, RT-BKP-02.

### S1-74 Questions over a year: no repeats, weak ones gone (1.0.1; CPO-6, CPO-9; F13-REQ-004; BL-534)
- **Owner:** content, mobile.
- **Steps:** (a) With the phone's date moved forward a day at a time for 30 evenings, open Tonight and press Another thought twice each evening; write down the keys. (b) Read for the retired weak prompts (motor milestones, first words).
- **Expected:** (a) No key twice in the 30 evenings for the same child and author. (b) None of the retired keys shows. The full year is proved in RT-HIST-01; this item checks that the phone reads the same history.
- **Record:** S1-74 rows (a) and (b), the key list.
- **Catalog:** RT-HIST-01 to RT-HIST-03.

---

## Part 2. Money, account and notifications (session 2, can follow on the next days)

### S2-01 to S2-12 StoreKit and Apple's sheets
Run the twelve checks D-1 to D-12 in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 11, in that order, with a TestFlight build of the production profile (bundle id `com.earlyletters.scribe`, after Mon 9 Nov, D-124 item 1; the `.dev` and `.preview` ids have no products, so use the StoreKit file for those). Map: S2-01 = D-1 (gate then Apple's sheet; neither plan selected, C-REQ-022), S2-02 = D-2 (monthly trial), S2-03 = D-3 (Read together with Plus), S2-04 = D-4 (Manage subscription), S2-05 = D-5 (Restore on a second iPhone within 10 s, C-REQ-020), S2-06 = D-6 (Family Sharing: the co-parent gets Plus, D-053), S2-07 = D-7 (refund sheet), S2-08 = D-8 (airplane mode with Plus), S2-09 = D-9 (expiry: everything keeps working, LEGAL-REQ-050), S2-10 = D-10 (AX5 and VoiceOver on the sheet), S2-11 = D-11 (dark mode), S2-12 = D-12 (iOS 16 device only if the target stays 16.4). The ASC table uses D-7 to D-10 twice (F: 15 Oct); the first four of those rows get their own ids here: S2-18 = the first D-7 (delete and reinstall, record whether the Keychain count survives), S2-19 = the first D-8 (iCloud restore keeps the free count), S2-20 = the first D-9 (airplane mode at the Keep sheet), S2-21 = the first D-10 (redeem an offer code). (S2-17 is the plan reminders item below.) Request to S06: renumber the ASC table so each check has one id.
- **Bundle id:** products exist only on the production record `com.earlyletters.scribe`; product ids are unique across the account, so the `.preview` record cannot carry copies (observed 1 Nov 2026, `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` correction). A TestFlight build from the `testflight` profile is `com.earlyletters.scribe.preview` (F: `docs/release/TESTFLIGHT.md`), so S2-01 to S2-20 run against the StoreKit configuration file in a development build and every row says "StoreKit file, not sandbox", until a TestFlight build of the production bundle id exists, after Mon 9 Nov (D-124 item 1).
- **Record:** the evidence file (S2-01 to S2-12) and the date and build in the ASC doc's table.
- **Update:** `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` (turn its U marks into V where the sheet confirms them); ADR 0013 "verify on device" for C-REQ-022.
- Note (V): apps installed from TestFlight use the sandbox automatically, and subscriptions renew every day, up to 6 times in a week, whatever their length (Apple, "Testing subscriptions and In-App Purchases in TestFlight"). Billing retry needs a Sandbox Apple Account's settings.

### S2-13 Account deletion on a real account (C-REQ-019, LEGAL-REQ-029)
- **Needs:** `EXPO_PUBLIC_ACCOUNT_DELETION=on` in the build under test; the alpha builds hide the Settings row without it (`docs/release/TESTFLIGHT.md` step 9, founder, 30 Oct 2026; on a development client, Metro is started with it in the shell as in S1-35). Rows (a) to (h) assume the row is there.
- **Steps:** Signed in with Plus renewing (sandbox): Settings > Delete account. Read the per-book lines, Export first, the Apple billing notice with Manage subscription; type the word; confirm. Sign in again within the 30 days and Cancel deletion. Then, on staging, let one fixture account run to completion and run `scripts/ops/verify-deletion.ts` (ops README step 7). The sole parent's request and cancel are S1-35.
  - (a) The Settings row: absent when signed out; after signing in it appears in its own section, in the destructive style; after signing out it goes. Check at AX5.
  - (b) Step 1 reads the line about this phone ("On this phone, your letters stay. The ones already saved to your account move to Recently deleted.") under the book lines, only when the account has a book.
  - (c) VoiceOver on step 2: focus lands on "Delete your account?", the field is read as "Type delete to confirm", "Delete account" is announced dimmed until the word is typed, and the two-finger Z gesture takes "Keep my account". On the scheduled page the date and title read as one heading and the buttons read in order.
  - (d) Dynamic Type AX3 and AX5 on steps 1 and 2 and the scheduled page, on an SE 3 and on a 6.1-inch phone: nothing truncated, the buttons reachable.
  - (e) Haptics: one `warning` at the final press and none at Continue; none repeated on an offline retry (known: it plays on each press, see the critics' pass L10); a success haptic on Cancel deletion.
  - (f) The iOS keyboard on step 2 on an SE 3: the field, "Delete account" and "Keep my account" stay visible above the keyboard; the return key says done; autocorrect and capitalization are off.
  - (g) A co-parent's phone after the request (account with a co-parent, as AL-07.4): after one sync the Book and Tonight stay (Settings reachable); Recently deleted lists the account's letters with the date line; note what Restore does on one of them while the request is open.
  - (h) Sign out of this phone on the scheduled page asks first and says the deletion stays scheduled for the date, with "Stay signed in" and "Sign out" as its buttons; after a confirmed sign out the page says "Sign in to delete your account, or to cancel a deletion you started."
- **Expected:** Export offered first; the subscription notice appears only when Plus will renew; the co-parent's copy of a shared book stays (DATA-REQ-012); cancel restores everything; after completion nothing remains but pseudonymised acceptances. Every failure line says that nothing has changed. (A request whose answer was lost shows the scheduled page, not a failure: the page re-reads the request once. That is proved by the unit tests in `apps/mobile/src/lib/account-deletion/account-deletion.test.ts` only; no phone step can drop a reply after the server has committed.)
- **Record:** S2-13 rows (a) to (h).
- **Update:** `docs/ops/runbooks/stuck-deletion.md` if a step stalls. Note (F, board 20:56): the `apple-token` Edge Function that revokes Apple's token on deletion is not built yet (SECURITY.md 5). What the phone does with a letter the server has erased after the purge is S03's to confirm (unverified): the account's auth user is gone by then, so the phone may never get the signal.

### S2-14 Sign out and Apple revocation (A-REQ-033, AUTH_SETUP 11.8)
- **Steps:** Airplane mode, save a letter (unsynced), Settings > Account > Sign out. Then online: iOS Settings > Apple Account > Sign in with Apple > Early Letters > Stop using; relaunch.
- **Expected:** Sign out waits and explains; no letter lost. After revocation the app signs out once letters have uploaded.
- **Record:** S2-14 row.
- **Update:** AUTH_SETUP 11.8.

### S2-15 Reminders and notifications (C-REQ-001 to -009, D-025)
- **Steps:** Settings > Reminders: turn on; the iOS prompt straight away, with no sheet in front of it (S1-47); choose a time 5 minutes ahead and wait with the phone locked. Change the time zone in iOS Settings; check the next reminder keeps local time. Look at the lock screen text. Turn Reminders off. Note: US daylight saving time ends on Sunday 1 Nov 2026 (A), right before submission week; check one reminder across it.
- **Expected:** One iOS prompt, straight from the Reminders switch with no sheet in front of it, after the explanation under the switch (C-REQ-001, CDesO-3, CCO-10); the switch stays on whatever the answer, and the choices, preview and Next line show inline (S1-47); delivered at the chosen local time; none between 21:30 and 07:00; no child name on the lock screen by default (D-025); tapping opens Tonight; off means nothing is scheduled. F: the priming card after the first letter is not on Tonight yet (only Settings), see `apps/mobile/e2e/TESTID_REQUESTS.md` "Not mounted yet".
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
