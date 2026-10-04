# Device test plan: the first real-iPhone session and the TestFlight beta

Owner: qa-e2e. Version 1.0, 3 Oct 2026. For the founder (who runs it) and the coordinator (who files the follow-ups).
Inputs: TDD 07 (sections 3 to 5, 11), PRD 6 and 7, ROADMAP 2.x (week 2 device spikes, C0 from 14 Oct, C1 from 19 Oct), `docs/ops/AUTH_SETUP.md` 11, `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 11, `docs/ops/APP_SIZE.md`, ADR 0013 to 0017, TDD 03 failure modes, TDD 09, `apps/mobile/src/lib/README.md`, the agents' "needs a real device" notes.

Labels: **V** verified on a vendor page on 3 Oct 2026; **A** assumption to confirm during the session; **F** fact found in the repo.

## How to use this plan

- Work top to bottom. The order follows dependencies: a build that installs, then capture, then models, then accounts, then money, then the beta.
- Every item has **Steps**, **Expected**, **Record** (where the result goes) and **Update** (the document that holds the fact this item proves or measures). If the result differs from that document, fix the document in the same pull request.
- Results go in one evidence file per device session: `docs/qa/evidence/<date>-<build>-<device>.md` (template in `docs/qa/evidence/README.md`). One row per item ID.
- Fictional family only (Asha, Avi, Mama, Papa) in letters, names, notes and screenshots. The founder's own family never appears in evidence (CLAUDE.md).
- Maestro cannot drive a physical iPhone (V: Maestro 2.11.0, "Physical iOS devices are not yet supported"), so everything here is by hand. The simulator suite is `apps/mobile/e2e`.
- Failures: a GitHub issue with `beta` and a severity `S0` to `S3` (TDD 07 11.3). S0 (a letter lost or changed, data exposed, anything created after an under-18 answer, consent bypassed) stops the session.

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
| P-02 | Each test iPhone registered for internal builds: `npx eas-cli@latest device:create`, then a new build | `eas device:list` shows it (V: eas-cli command exists) | none |
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
- **Record:** S1-06 row (no email addresses in evidence).
- **Update:** AUTH_SETUP 11 (tick 11.1), and 2.1 "Assumption: EAS capability sync" can become Verified (V: Expo "iOS capabilities": `eas build` enables supported entitlements on the App ID).

### S1-07 Sign in with Google (AUTH_SETUP 11.2)
- **Steps:** A build with both Google client ids (AUTH_SETUP 3.5). Keep the book > Google. If the button is missing, the build lacks the ids.
- **Expected:** Signs in; Supabase shows the Google identity; a nonce error means "Skip nonce check" is off.
- **Record:** S1-07 row.
- **Update:** AUTH_SETUP 11.2. Note: D-054 includes Google at launch; ROADMAP section 4 allows cutting it.

### S1-08 Email link and code in real mail apps (AUTH_SETUP 11.3, 11.4; A-REQ-018, A-REQ-022, A-REQ-023)
- **Steps:** Continue with email, with a brand-new address and with a known one. Open the link from: iOS Mail, Gmail app, Outlook app, and a link forwarded in Messages. Type the code by hand once. Open a one-hour-old link. Open the link on a laptop.
- **Expected:** The link opens the app (not Safari) and signs in; the code also works; the old link says it has expired and offers the code; the laptop page verifies nothing and shows the "Open the app" fallback; one email holds both link and code; no click-tracking redirect in the link (AUTH_SETUP 4.1).
- **Record:** S1-08 row: one line per mail app.
- **Update:** AUTH_SETUP 11.3, 11.4 and the template assumption in section 6 ("GoTrue verifies a signup token and a magic-link token under `type=email`").

### S1-09 Universal links for invites (A-REQ-022, A-REQ-028)
- **Steps:** From the Family tab, invite a co-parent; share the link to yourself in Messages and WhatsApp. On a second phone: (a) app not installed, tap the link; (b) app installed, cold (killed) and warm; (c) long-press the link and choose "Open in Early Letters"; (d) paste it on "I was invited". Then answer No on the 18+ gate on a fresh install opened from the link.
- **Expected:** (a) the website's `/i/` page with no child name (B-NFR-002); (b) the app opens on "Join the family book" after the 18+ gate, cold and warm; (c) works; (d) works without reading the clipboard on its own (A-REQ-029); after a No the invite is dropped (TDD 01 F-20).
- **Record:** S1-09 row.
- **Update:** AUTH_SETUP 11.5; `docs/ops/DOMAINS.md` if the AASA or the `/i/` page misbehaves.

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
- **Steps:** Play a letter with the ring/silent switch on silent, then with AirPods. Lock the phone during playback. Read together three times in a Free book; the fourth opens the Plus gate.
- **Expected:** Playback is audible in silent mode (playback audio session) and stops cleanly on lock, since background playback is off (F: `enableBackgroundPlayback: false`); Read together uses Large Print; the gate appears on the fourth session (D-009).
- **Record:** S1-20 row.
- **Update:** `src/lib/README.md` (audio-mode) if the session category is wrong.

### S1-21 Export: the ZIP on a Mac and on Windows (C-REQ-017, LEGAL-REQ-034)
- **Steps:** Settings > Export your book, offline. Share to Files, then AirDrop to the Mac; email or USB to the Windows PC. On the Mac: open with Archive Utility; open `README.txt` (TextEdit), `index.html` (Safari, offline), `book/*.pdf` (Preview), an `audio/*.m4a` (QuickTime). On Windows 11: extract with File Explorer; open `README.txt` in Notepad, `index.html` and the PDF in Edge, an `.m4a` in Media Player. Repeat once with a child named in Devanagari (fictional, for example "आशा").
- **Expected:** Both systems open the archive without a third-party tool (no ZIP64 below 3.9 GB, F: `lib/export/pack.ts`); README lines show on Windows (CRLF, F); names in Devanagari display correctly in both file managers (A: the ZIP marks names as UTF-8); `manifest.json` hashes match. A one-year fixture (about 240 letters, 230 MB) exports in under 2 minutes on SE 3 (PRD 7.1 gate; needs a seeded year, so it may move to the release-candidate run).
- **Record:** S1-21 row: Mac and Windows result, export seconds and size.
- **Update:** `docs/legal/DELETION_AND_EXPORT_SPEC.md` (export format notes) through the legal owner; BACKLOG BL-Q21.

### S1-22 Two phones, one book: co-parent sync (PRD 7.3)
- **Steps:** Mama's phone invites Papa's phone (S1-09). Mama saves a letter while both are online; time until it appears on Papa's phone. Then Mama offline: save two letters ("Not sent yet"), kill, relaunch offline (still there), go online.
- **Expected:** p95 5 s online (10 tries); offline letters queue visibly, survive a kill and sync later; Papa never sees Mama's raw transcript (PRD-REQ-004) or her private letters.
- **Record:** S1-22 row: 10 timings.
- **Update:** PRD 7.3 measured column; TDD 02.

### S1-23 VoiceOver walk (script V-01 to V-10; A-NFR-005 to -007, LEGAL-REQ-051)
VoiceOver on, Reduce Motion on, text size AX5 (Settings > Accessibility > Display & Text Size > Larger Text, largest). For each, swipe through every element, then use the rotor and the two-finger scrub (escape).
- **V-01 Gate:** focus lands on the question; Yes and No announce as choices, not selected; Continue announces dimmed until a choice.
- **V-02 Welcome and first run:** each step's heading gets focus; every field has a label; errors are announced; Add another child is reachable.
- **V-03 Tonight:** the greeting, the prompt, Speak and Type read in order; Another thought and Not much today reachable.
- **V-04 Listening:** the elapsed time is spoken once a minute, not every second; Done is reachable without hunting; "To Asha" is reachable.
- **V-05 Review:** the text reads in order; each machine edit is reachable with an action to put it back; Add to book and Keep private are reachable.
- **V-06 Sheets (Keep the book, sign-in, Terms, sensitive data, Plus gate):** focus moves to the sheet title; the escape gesture closes.
- **V-07 Apple's subscription sheet:** prices read with their periods (Apple's view, ASC doc D-10).
- **V-08 Book and letter:** chapter headers read title, count and authors; the letter reads date, text, signature; Delete then Undo announced.
- **V-09 Read together:** Previous, Next and Close reachable; playback state announced.
- **V-10 Settings:** each row reads label and value; every consent row is two taps from Settings; "If you are struggling" is reachable.
- **Expected:** All ten pass with no unlabelled element, no trapped focus and no truncated text at AX5 (letter text never capped, D-027).
- **Record:** S1-23 rows V-01 to V-10.
- **Update:** TDD 09 section 2 findings table (status), `docs/design/COMPONENT_LIBRARY.md` for component fixes.

### S1-24 Display settings and the network check
- **Steps:** (a) On SE 3 at AX5 with Bold Text and Increase Contrast, in Dark mode, walk Tonight, Review, Book, Settings, Plus gate. (b) Settings > Privacy & Security > App Privacy Report on (A: shows the domains each app contacted). Fresh install, first letter, Keep the book Not now, open Settings; read the report. Then turn Usage and crash reports on and off in Settings > Privacy and read it again.
- **Expected:** (a) No truncation, no overlapping controls, 44 pt targets (56 pt primary), contrast holds in dark (TDD 09 2.3 to 2.7). (b) Before consent: no PostHog or Sentry domain at all (PRD-REQ-016, LEGAL-REQ-003); after a yes, PostHog appears; after withdrawal, no new contact (PRD-REQ-018). Only expected hosts overall: the Supabase project, the packs and models host, the config and content functions.
- **Record:** S1-24 row with the domain list (domains only).
- **Update:** `docs/legal/app-store-privacy-labels.md` section 5 consistency check; `docs/legal/DATA_CLASSIFICATION.md` if an unexpected host appears.

### S1-25 iCloud device backup (D-033)
- **Steps:** Settings > [your name] > iCloud > Manage Account Storage > Backups > this iPhone: find Early Letters' size before and after downloading a speech model.
- **Expected:** Recordings count toward the backup (they live in a backed-up directory); speech models do not (excluded through ScribeFiles `setExcludedFromBackup`, F). The full restore-to-a-new-phone drill is BL-284 at the release candidate.
- **Record:** S1-25 row: backup size before and after the model.
- **Update:** D-033 copy ("on this phone and in your iPhone's own backup") stays true or goes to the content owner.

---

## Part 2. Money, account and notifications (session 2, can follow on the next days)

### S2-01 to S2-12 StoreKit and Apple's sheets
Run the twelve checks D-1 to D-12 in `docs/ops/APP_STORE_CONNECT_SUBSCRIPTIONS.md` step 11, in that order, with a TestFlight build of the production profile (bundle id `com.earlyletters.scribe`; the `.dev` and `.preview` ids have no products, so use the StoreKit file for those). Map: S2-01 = D-1 (gate then Apple's sheet; neither plan selected, C-REQ-022), S2-02 = D-2 (monthly trial), S2-03 = D-3 (Read together with Plus), S2-04 = D-4 (Manage subscription), S2-05 = D-5 (Restore on a second iPhone within 10 s, C-REQ-020), S2-06 = D-6 (Family Sharing: the co-parent gets Plus, D-053), S2-07 = D-7 (refund sheet), S2-08 = D-8 (airplane mode with Plus), S2-09 = D-9 (expiry: everything keeps working, LEGAL-REQ-050), S2-10 = D-10 (AX5 and VoiceOver on the sheet), S2-11 = D-11 (dark mode), S2-12 = D-12 (iOS 16 device only if the target stays 16.4).
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

## Part 3. TestFlight beta (C0 internal from 14 Oct, C1 external from about 19 Oct; D-045)

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
