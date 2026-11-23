> v2-era document; dispositions superseded by spec section 27 and 27b at PR #1314; kept as review history.

Status: PROPOSED review input (nothing here is decided; every acceptance of a residual risk is the founder's)
Date: 21 Nov 2026
Reviewer: CISO (Claude role, not an auditor, not a penetration tester)
Reviewed: `docs/product/prd/28-moments-tab.md` on `wip/moments-prd` at 5bebd892, read in full (1187 lines, NS-53-R1 to R191, section 25.9 is this block)
Also read: `docs/agents/exec/COUNCIL.md`, `docs/adr/0032-on-device-sensitive-store.md`, `docs/security/MEDIA_THREAT_MODEL.md`, `docs/security/NATIVE_MODULE_GATE.md`, `apps/mobile/test/native-module-gate.test.ts`, `apps/mobile/app.config.ts` (lines 93, 260 to 264, 305), `apps/mobile/package.json`, `packages/api/src/keys.ts`, `docs/ops/SECURITY.md`, `docs/security/SECRETS_REVIEW.md`, `supabase/functions/new-device-email/`

# CISO executive review: the Moments tab (NS-53)

## Verdict: ACCEPT-WITH-CHANGES

The design is sound where it matters most. Nothing library-derived is meant to reach a server, no table or RPC is added in phase 1, the library module is one native module behind one import boundary, the decisions store follows an existing pattern, and Limited access is honoured. I can sign the first release with the library read and with places and occasions in, on these conditions. Each condition maps to a finding below.

Conditions before the flag F2 may turn on in the release profile:

1. **C1 (EX-SEC-1).** No new third-party package enters `apps/mobile/package.json` for Moments until it has a row in `docs/security/NATIVE_MODULE_GATE.md`. `expo-image`, `expo-video` and `expo-battery` are not named anywhere in this PRD, and the PRD says the opposite (R88, R112). Default: add none of the three.
2. **C2 (EX-SEC-2).** Add a security release gate G11 with a machine check that stops a store build when F2 is on without the read-outs. Today the gate is prose, and every session posts as the founder.
3. **C3 (EX-SEC-3).** The offline place table ships only with a recorded source, version, licence, checksum and reproducible build script. No dataset is bundled on a guess.
4. **C4 (EX-SEC-4).** Resolve the place inside the native module so precise coordinates never enter JavaScript memory; JavaScript receives a place id and nothing else.
5. **C5 (EX-SEC-5).** The decisions file stores no readable place name and no raw picture identifier, and the backup exclusion is read back at every open (a control that the threat model lists as not built).
6. **C6 (EX-SEC-6).** The borrowed-phone case gets a design answer: Moments obeys App lock like the Book, and the place line has a one-tap hide that needs no setup.

The phase 2 email (EX-SEC-9) is acceptable only under the conditions written there. I do not need them for the first release.

Counts: 12 findings. BLOCKER 3, MAJOR 7, MINOR 2.

Top three: EX-SEC-1 (undeclared dependencies that contradict R88 and R112), EX-SEC-2 (the F2 gate is a written rule, not a control), EX-SEC-3 (place table supply chain and licence unknown).

How to read the evidence field. "Read" means I opened the file named in this session on `wip/moments-prd`. "PRD" means the line is in the Moments PRD and I did not check it against a running build. UNVERIFIED means I did not read a source for it and a person must before it is relied on. Control types are named each time: a test in CI, a setting read back, or prose.

## Findings

### EX-SEC-1 BLOCKER: three dependencies the PRD never names, against two rows that forbid them

- **Requirements:** NS-53-R88, R110, R112, R101, R111, section 10.1 step 6, section 10.3 (Low Power Mode skip), 19.1.
- **Finding:** The review brief lists `expo-image`, `expo-video` and `expo-battery`. The PRD names none of them. It says the opposite in two places. R88: "no third-party picker, decoder, editor or media package appears in the lockfile". R112 and step 6: thumbnails are "never written to disk" and "a third-party image library is allowed only if mobile proves its disk cache is off". Each package has a job the PRD does need: showing thumbnails (`expo-image`), playing a picked video on the letter page (R101, `expo-video`), skipping the scan in Low Power Mode (10.3, `expo-battery`). So the need is real and the plan to meet it is missing.
  - `expo-video` is already on the gate's watch list; the lockfile ratchet fails without a ledger row (read: `native-module-gate.test.ts` line 18). `expo-image` and `expo-battery` are not on that list, so nothing in CI would catch them. A dependency the gate cannot see is the one I worry about.
  - `expo-image` caches to disk by default as I understand its API (UNVERIFIED: I did not read the package source or its docs this session). That would break R112 silently.
  - `expo-battery` is a thin wrapper over a call the native module can make itself (`ProcessInfo.processInfo.isLowPowerModeEnabled`, UNVERIFIED against current SDK 57 docs). A package for one boolean adds supply chain for nothing.
  - The backlog already records the `expo-video` dependency review as a blocker (BL row near `docs/BACKLOG.md:4202` per the lead branches; I did not open the main copy).
- **Proposed change:**
  1. Default for the first release: add none of the three. Thumbnails come from `scribe-library` as bytes for a view that has no disk cache (the React Native `Image` with a memory-only source), the Low Power Mode flag is a sixth closed function in `scribe-library` (or a field on `accessStatus`), and video on the letter page uses whatever the NS-52 pipeline already plays today.
  2. If a package is needed, it follows `NATIVE_MODULE_GATE.md` in full: lockfile diff, prebuild plist and entitlements diff, no new permission or background mode, no runtime download, licence row, exact pin (no range), `security-architect` read in the PR body. For `expo-video`, the row must show no `UIBackgroundModes` change (app.config.ts line 305 already sets background playback off for the audio package; the video package needs the same stated).
  3. Extend `WATCHED` in `native-module-gate.test.ts` to cover `expo-image`, `expo-battery`, `expo-video-thumbnails` and any image-cache package. The file says "never shrink it to pass"; extending it is the intended move.
  4. Rewrite R88 and R112 so they say what is true: the allowed set of packages is a short named list with ledger rows, not "none".
- **Evidence:** Read: `apps/mobile/package.json` (no `expo-image`, `expo-video`, `expo-battery` today), `native-module-gate.test.ts` lines 1 to 40, `NATIVE_MODULE_GATE.md` lines 17 to 29, PRD lines 486, 499, 523. UNVERIFIED: the packages' own caching and Low Power behaviour.
- **Residual risk after the change:** one native module of ours, written to the `expo-native-module` skill, is the whole surface. Its bugs are ours; the supply chain is not larger.

### EX-SEC-2 BLOCKER: the F2 gate is a written rule, and every session is the founder

- **Requirements:** NS-53-R169, R171, G1 to G10 (section 21), G10 ("founder signs"), section 19.2, 25.9.
- **Finding:** F2 turns the library read on in the release profile only when each gate has a dated read-out in `docs/release/<x.y.z>.md` (R171, layer "P", which is a process row, not a test). R169 is a test, but it checks that F2 is on only in an allow list; the allow list and the test live in the same repository, and one pull request can edit both. G10 says "the founder signs", yet COUNCIL and the project's own CR-19 record that every session's pushes and PRs come from the founder's account, so no check can tell his sign-off from a session's. The result: the control that decides whether L4 picture data is read on every parent's phone is a rule.
  - Section 21 has no security gate at all. G3 asks `security-architect` to approve the read set and the identifier decision. Nobody is asked for the lockfile read, the prebuild plist and entitlements diff, the binary scan, or the native module source read that `NATIVE_MODULE_GATE.md` already requires for a media package.
  - The store build is the one-way door: once a binary with the PhotoKit usage string is in review or released, "turn it off in a point release" (RK-2) costs a review cycle and the data already read stays read on phones that updated.
  - Agent coverage: the native Swift module is the highest-risk code in this PRD and will be written by agent sessions on open-weight models by default (CLAUDE.md, agents). It needs the T2 two-lens review, the `expo-native-module` skill and a source-scan test, stated in the PRD, not assumed.
- **Proposed change:**
  1. Add **G11 Security read** to section 21, owner `security-architect` with the CISO role: lockfile and prebuild diff attached (NATIVE_MODULE_GATE checklist items 1 to 3), binary scan result (usage string and PhotoKit symbols only in allow-listed profiles; no `CLGeocoder`, `MKLocalSearch`, `PHAssetChangeRequest`, `performChanges`, `PHAssetCollectionChangeRequest`; no `NSPhotoLibraryAddUsageDescription`; no `UIBackgroundModes`, app group or location entitlement), source read of `scribe-library`, the threat-model rows of EX-SEC-12, and the device rows of EX-SEC-4, 5 and 10. If G11 fails, F2 stays off, as for the other gates.
  2. Make R171 a machine check: the store preflight (`apps/mobile/scripts/preflight-testflight.mjs` is the existing home for such checks; I read only a reference to it, line numbers in the media threat model) fails the production profile when F2 is on and `docs/release/<x.y.z>.md` lacks a read-out line for each of G1 to G7, G10 and G11 with a date and a commit. The founder runs it on his Mac before the EAS submit, which is the step a session cannot do for him.
  3. Add the repo-side guard from the CISO skill: a check that fails when one PR edits the F2 allow list or its test together with the file they guard, unless the PR carries the founder's recorded decision id.
  4. State in R83 or section 19 that `scribe-library` follows the `expo-native-module` skill, with the source-scan test CI can run and the iOS compile job.
- **Evidence:** Read: PRD lines 862 to 878 and 900 to 922 (gates), `NATIVE_MODULE_GATE.md` (checklist), `.claude/skills/early-letters-ciso/SKILL.md` section 5 (sessions are the founder; approvals cannot work). Read: `MEDIA_THREAT_MODEL.md` section 5 (references to the preflight script and the no-background-mode rule). UNVERIFIED: whether the preflight script today has a check that I could extend; I did not open it.
- **Residual risk after the change:** the founder can still sign a build with F2 on, knowingly. That is his call, recorded.

### EX-SEC-3 BLOCKER: the offline place table has no source, no licence and no integrity control

- **Requirements:** NS-53-R61, R63, R64, 7a.1 (P-A), RK-5, G1.
- **Finding:** The first release ships a bundled table of cities, regions and countries. The PRD marks its size, licence and accuracy UNVERIFIED (section 27) and RK-5 says "dataset licence read before use". That is the right instinct and it is not yet a row anyone can test. Three exposures:
  1. **Licence.** Common sources differ in what they demand. I have not read any of them this session, so what follows is UNVERIFIED: some open place datasets require attribution, and one widely used map database carries a share-alike term that can reach derived data. A wrong choice is a legal problem in a store build we cannot recall. Counsel's G2 list (section 21) does not include the place dataset.
  2. **Integrity.** A table is data that decides what words appear under a child's picture. A poisoned or corrupted table can show a wrong or offensive name on a family's day. The table is not a signed pack (the pack system downloads on demand and is separate), so nothing proves the bytes in the build are the ones reviewed.
  3. **Small places identify a house.** A table that includes hamlets, single-address villages or named private estates would label "home" or a relative's farm. The PRD says "never a street, a venue or a hospital" and gives the coarseness as ASSUMED (7a.2). A population floor and a named-feature class filter are the missing control.
- **Proposed change:**
  1. Record the source, the exact version or date, the licence id (permissive or public-domain only, same rule as `NATIVE_MODULE_GATE` item 5), the attribution text if any (and where it appears in-app) and a SHA-256 of the source file, in a ledger row in a new `docs/security/PLACE_TABLE.md`. Counsel adds the dataset to G2.
  2. The table is built from the source by a script in the repo, run by the founder's machine or CI, with the output hash checked by a test (a control, in CI). A change to the table without a changed hash fails.
  3. It ships inside the app binary, not as a downloaded pack. No runtime fetch, no new signing surface.
  4. Coarseness rule as data: administrative level city and above, a population floor (value set by the G1 spike, ASSUMED until then), no point-of-interest class. A test asserts no entry below the floor.
  5. If any of 1 to 4 cannot be shown by the release gate, fall back to date-only cards for that part, which the PRD already allows (RK-5).
- **Evidence:** Read: PRD lines 342 to 364, 932, 1181. UNVERIFIED: every dataset licence term above; the table's size and accuracy.
- **Residual risk after the change:** a correct but unlucky label (a city name beside a hard day). That is a design risk the PRD already carries as RK-3 with "Not this place" and "Hide this place".

### EX-SEC-4 MAJOR: precise coordinates enter JavaScript memory for the whole window

- **Requirements:** NS-53-R61, R110, R115, R162, 7a.2 item 1, 10.1 steps 1 and 3a, 10.2, 17.
- **Finding:** READ_SET_V1 returns each picture's coordinates to the engine in "columnar typed arrays" (step 1). The place resolver is `core/moments/place.ts`, pure TypeScript (7a.2, 19.1). So up to a window of pictures, including the family's home coordinates and every place they went, sit in the JavaScript heap together, for the session. The PRD's protections are "dropped as soon as a place id exists", a type test that no `Moment` has a coordinate field, and canary tests on logs. Those are good, and they do not cover the heap itself: a crash report, a debugger attach on a dev build, a JS heap snapshot, or a future logging line printing a raw array. The PRD also lists "a coordinate in memory" as the exact question for me (25.9).
  - A second risk is the type test's reach. It guards the `Moment` type, not an intermediate array. A new helper that copies the array into a log call is not caught.
- **Proposed change:**
  1. Resolve the place natively. `scribe-library` takes the bundled table as an input, finds the nearest entry in Swift, and returns a place id per picture (or none). Coordinates never cross the bridge. `place.ts` keeps the pure parts (majority place, away from home, themes, hide keys) and receives ids.
  2. If native resolution cannot be done in the first release, quantise in Swift to a coarse grid (cell size from the G1 spike) before the data leaves the native layer, so JavaScript never holds a precise point. State which of the two ships.
  3. Home place ("the most frequent resolved place") is held as a place id, not a coordinate, which the PRD already says.
  4. Extend R162's canary to the typed arrays: a test that feeds a canary coordinate and asserts it is absent from every JS-visible structure after step 3a, and a source scan that fails any `console`, logger or error-report call that receives a library array.
  5. Revise the privacy text carefully: "coordinates are read on this phone to name a place" stays true under either option; do not add a claim that they never exist in memory.
- **Evidence:** Read: PRD lines 352 to 356, 519 to 523, 533. UNVERIFIED: whether the app has a crash reporter today (PRD says crash reports must not carry library data; `apps/mobile/package.json` shows no crash-report package by name, `grep` for sentry and crash returned nothing, but I did not read the Expo or Hermes defaults); whether `asset.location` is readable under Limited access (PRD section 27 lists it too).
- **Residual risk after the change:** native memory holds coordinates for milliseconds, inside our module. Residual: a jailbroken or debugged device (A3 with tools). Accepted by design.

### EX-SEC-5 MAJOR: the decisions file holds more than day keys, and its controls are mostly not built

- **Requirements:** NS-53-R29, R65, R113, R115, R116, section 10.2, section 17, O-09, O-13, O-14, G3.
- **Finding:** `moments.json` now holds: day keys, a parent label (60 characters), hidden-place keys, place corrections and, if O-13 and O-14 are signed (default yes in section 23), a left-out picture identifier and a chosen album identifier. For a parent, a hidden place can itself be the sensitive fact: the place they hid is probably the place they do not want to see, which is a place of loss or fear. Stored as a readable name, it is a note about that.
  - **Device theft (A3).** File protection is `NSFileProtectionCompleteUntilFirstUserAuthentication` (read: `app.config.ts` line 93; `MEDIA_THREAT_MODEL.md` section 5 gives the reason and the cost: after the first unlock since boot, a locked phone's files are readable by anything that reaches the file system). ADR 0032 item 4 says "no weaker than `scribe.db`", which is the same class. So the file inherits that exposure.
  - **Backup exposure (A4).** The PRD says the file is "excluded from backup and read back". The threat model says the backup exclusion read-back at open is "not built, GAP G-4" (NX-39-R43), and ADR 0032 is Proposed, two-way until code ships. The decisions store in `Application Support/days` has the exclusion, from the threat model table; whether it is verified on a device is row D-3, open.
  - **Write order and wipe.** ADR 0032 items 2 and 3 are good (create, exclude, read back, then write; delete first on sign-out). They are prose in an ADR until R115's tests exist.
- **Proposed change:**
  1. Store place keys as the opaque place-table id, never a name. Store picture and album identifiers only as a keyed hash (HMAC with a random per-install key held in the Keychain through `scribe-keys`), compared at read time against hashes of fetched identifiers. The file then says nothing readable if lifted. If this is judged too heavy, G3's stated fallback applies: store no identifier and ship "Not this one" only.
  2. Make the exclusion read-back a test and a runtime check: a false read-back deletes the file and the store refuses to write (ADR 0032 item 2), and G11 carries device row D-3 for this file. Close GAP G-4 for the Moments file at least.
  3. Keep the parent label out of the file's plaintext only if cheap; otherwise state in the primer's "Records" line that the label is stored on the phone. The 60-character label is the parent's own words; it follows their other on-device words.
  4. Tests per R115: the file is gone after Turn off, Erase, sign-out and account switch, deleted before any await; a corrupt file does not crash and is not read (ADR 0032 Consequences).
- **Evidence:** Read: PRD 806 to 812, 533; `app.config.ts` line 93; `MEDIA_THREAT_MODEL.md` sections 3 (P9), 5; ADR 0032 items 1 to 10. UNVERIFIED: that the file class is applied in practice (threat model row D-2 says the same).
- **Residual risk after the change:** a phone unlocked once since boot and then taken exposes hashed ids and place-table ids, which carry no name and need the same library to mean anything. The parent label stays readable and is the parent's own text.

### EX-SEC-6 MAJOR: the borrowed or shared phone turns Recent into a location diary

- **Requirements:** NS-53-R63, R65, R78, R102, R105, O-34, 8.3, 25.9.
- **Finding:** The abuse case you asked for. A partner, relative or anyone handed an unlocked phone opens Moments and sees days from the parent's pictures with thumbnails, dates, and, new with the places ruling, a place line and place themes ("Lisbon, 24 to 26 October"). That is a quick read of where the owner has been and when, built for them, in order. TDD 04 names A1 (an ex-partner co-parent) and A3 (someone holding the phone) as the adversaries; this feature gives both something to read that did not exist before. Four points:
  1. R102 hides pictures and day names in the app switcher, and the tab is covered by App lock when it is on. Whether App lock is on by default is not stated in this PRD (UNVERIFIED; I found it as an option in other PRDs, not as a default).
  2. Place lines are shown "only when away from home" (O-34 default), which is the more revealing form: the card tells the reader exactly where the owner was not at home.
  3. "Hide this place" and "Not this one" are one tap with no authentication, which is correct for the owner and also lets a borrower undo the owner's hides (they are undoable and listed in Me). Hidden places are a signal of what the owner wanted hidden.
  4. Turn off and "Start again" erase decisions without a challenge. This loses only decisions, not letters, so it is a nuisance, not a loss.
  The iOS Photos app already shows the same pictures and places to someone holding an unlocked phone, so Moments does not create the capability; it presents it in a calmer, faster, sorted form, in an app that parents will assume is private because it is a baby book. That assumption is the exposure.
- **Proposed change:**
  1. Moments follows App lock exactly as the Book does: when App lock is on, no Moments content (thumbnails, dates, places, reasons) renders until the gate passes, including on return from background; add the scripted snapshot check of `MEDIA_THREAT_MODEL.md` section 4 for the Moments tab as a G7 row.
  2. A one-tap "Hide places" on the tab (a local switch, remembered, also in Me) that turns every place line and theme into plain dates without losing data. It is not the same as "Hide this place" and needs no setup. The ruling keeps places in; this is a viewer control, off by default.
  3. The primer's "Never" line, or one sentence under it, says in plain words that anyone who opens the unlocked phone can see these days, and where App lock is. This is a fact the parent can act on, not a warning to scare them; the CISO does not need fear copy.
  4. "Hide this place" listing in Me sits behind App lock like the rest of Me. No new authentication prompt is needed.
  5. Threat-model rows (EX-SEC-12) for A1 and A3 on the Moments tab, so the answer is written down.
- **Evidence:** Read: PRD 363 to 364 (place lines and hide), 426 to 431, 500 to 502, 658. `MEDIA_THREAT_MODEL.md` section 2 (adversaries A3, A4) and section 4 (App lock snapshot check). UNVERIFIED: App lock default state and whether Me is covered by it.
- **Residual risk after the change:** someone who knows the passcode, or who is handed an unlocked phone with App lock off, can read days and places. This is the same exposure as the Photos app and is the parent's to carry; it is named in the primer.

### EX-SEC-7 MAJOR: the permission API grants write access we say we do not use, and the claim "read-only" has no scan

- **Requirements:** NS-53-R72, R80, R81, R82, R88, R110, R169, G-6 (2.1), 8.2 step 4.
- **Finding:** Step 4 calls `requestAuthorization(for: .readWrite)`. PhotoKit offers add-only and read-write levels; there is no read-only level, so read-write is the correct request to read. The consequence is that, once granted, the app holds an iOS permission that can in principle modify and delete the parent's pictures. G-6 and the section 2 text say "read-only". That is true of our behaviour and not of the permission. The controls that make it true are not written:
  - R88 limits the code that reads or re-encodes pictures to the system's, but there is no scan for a `PHPhotoLibrary.performChanges`, a `PHAssetChangeRequest`, a delete or an asset-creation call anywhere in `modules/scribe-library` or `scribe-photo`.
  - The purpose string and the primer must not say "read-only" as a promise of the permission; counsel's G2 should see that wording.
  - Entitlements: the first release adds the usage string only. I expect no new entitlement, no background mode, no app group and no location entitlement; `app.config.ts` lines 260 to 264 set the entitlements and privacy manifests from capability flags (read), and the PRD says F2 adds the usage string and PhotoKit symbols (R169). The G11 prebuild diff (EX-SEC-2) is what proves it; right now nothing in the PRD requires that diff.
  - The privacy manifest: `privacyManifests: privacyManifest(capabilityFlags())` is generated (read). Reading file timestamps, disk space or user defaults in a new native module needs its required-reason entries; a missing entry is a rejection, not a security hole, but the manifest should be diffed in G11.
  - Location: reading `asset.location` needs no Core Location permission as far as the PRD says (UNVERIFIED, section 27). If it did need one, it would add a second prompt and a location usage string; that must be settled in the G1 spike before the primer's words are written.
- **Proposed change:** (a) add a source scan to `scribe-library` and `scribe-photo`: no change-request, performChanges, delete or create call, fail on a match, allow-list file by file; (b) add "the permission can change pictures; our code does not" to the Notes for Review draft (R80) and keep "read-only" out of in-app strings unless it describes our behaviour, which counsel confirms; (c) G11 attaches the plist, entitlements and privacy manifest diffs; (d) the G1 spike records the location-under-Limited finding.
- **Evidence:** Read: PRD 413 to 416, 459 to 461, 486; `app.config.ts` lines 260 to 264. UNVERIFIED: the Apple API behaviour stated above (I did not re-read Apple's documentation this session), location access without a Core Location prompt.
- **Residual risk after the change:** a future bug or a malicious dependency in our own module could call a write API; the scan catches it at review, not at runtime. Accepted.

### EX-SEC-8 MAJOR: lock screen rules contradict each other on child name and age

- **Requirements:** NS-53-R131, R135, R137, R138, R191, 13.3, 13.4, O-22.
- **Finding:** Section 13.3 says "Lock screen: neutral; no child name by default, none when names are off or App lock is on; no age or month number then". R131 says "no child name unless names are on". R138 removes age, month number, name and occasion only "with names off or App lock on". Read together: with names on and App lock off (a plausible default for a new parent), a Moments-class push (`birthday`, `monthAge`) can show the child's name and age on the lock screen to anyone who sees the phone. 13.3 and R131 disagree about the default, and nothing says which is true. The existing `typedDay` push class has body copy I did not read; whether a typed day's words could appear is UNVERIFIED (R131 says no letter words, which I rely on).
  - Timing is a quiet channel. A library-timed reminder (phase 2, F4 off) fires on days that have pictures; an onlooker who knows the schedule could infer that. The PRD handles this by sending the identical words as an ordinary evening reminder and the same landing (R135, R137). It does not handle the case where the reminder appears only on picture days and never otherwise. That makes timing a signal by itself. The PRD should say so when counsel reads it (G2).
  - The notification tap: O-22 recommends Home. I agree. If it were Moments, a tap on the lock screen would land on pictures and places; with App lock off, nothing stands between a bystander and that screen.
- **Proposed change:**
  1. One rule, tested (a table test per class): Moments-class pushes carry no child name and no age or month number by default, whatever the names setting; the names-on choice applies to the existing classes only if a founder decision says so. Reconcile 13.3, R131 and R138 in one sentence.
  2. The body for every Moments source is a content key, the identifier is random, and the payload carries nothing a person could read from the notification centre, which the PRD already says.
  3. Add to the G2 question list: does picture-day timing, even with identical words, count as use of Photo API data for the purpose in 5.1.2(vi)? (RK-1 and O-02 already hold this for counsel; this adds the timing channel as the stated reason.)
  4. Landing stays Home (O-22 default). Keep R137.
- **Evidence:** Read: PRD 654 to 664, 692 to 697. UNVERIFIED: the current wording of the `typedDay`, `birthday` and `monthAge` classes in `packages/content`; I did not open them.
- **Residual risk after the change:** a bystander sees a generic reminder; they learn that the owner has a baby journal app. Accepted.

### EX-SEC-9 MAJOR (phase 2): the lifecycle email needs its abuse and unsubscribe controls written as rows

- **Requirements:** NS-53-R140, R141, R142, R143, R188, 13.6, O-03, RV-09.
- **Finding:** The email design is careful on content: only server-held facts, account address, opt-in, off by default, one purpose, no library or typed-day source, no child name by default, stricter commercial standard (read: PRD 670 to 677). I accept that. The security rows underneath it are thin:
  1. **Recipient.** Rows must send only to the verified account address of the owner of the occasion row, never to an address typed into the app or taken from an invite. R140 says the server is told "id, date, repeat flag, channel"; add that there is no recipient field anywhere. A co-parent in a shared book never receives an email from the other parent's occasions.
  2. **Volume cap.** The weekly limit (D11) "to be confirmed" must be enforced by the job in the database, not by the client. Without a per-account cap on occasion rows (value: ASSUMED, say 50), a modified client could create thousands of rows and use our domain to mail-bomb the account's own address, hurting domain reputation, which is shared with sign-in mail. The `new-device-email` function has a `rate_limited` path as precedent (read: `handler.ts` line 116).
  3. **One-click unsubscribe.** Use the List-Unsubscribe header with the one-click POST form. The token is signed (HMAC with a server secret in function secrets), single purpose, scoped to one account and one channel, carries no personal data, and has no login. A GET opens a page with a confirm button; only the POST changes state, because mail scanners follow links and would unsubscribe or resubscribe people by accident. The unsubscribe page answers the same way for an unknown token, so it does not reveal which addresses exist.
  4. **Links.** The email contains no sign-in link and no deep link with a token other than unsubscribe. Training parents to click our emails to open the app is a phishing habit we should not build; the body says to open the app. R139's "a nudge link opens Home with no query" holds for the app side.
  5. **Sending key.** The key that sends this mail is a Resend key with sending access only, on the verified domain, set in function secrets, separate from the sign-in mail key and from `RESEND_API_KEY` of the purge worker, so one leak does not take out both (read: `docs/ops/SECURITY.md` lines 19 to 20 and 112, which already ask for separate sending-only keys). Adding a secret is the founder's step (CISO skill section 4), after the read-back in `SECRETS_REVIEW.md` section 8; I do not recommend adding it to a repository-level store. Note also SR-12: the Resend connector in the founder's sessions can read sent mail, including sign-in links, so the connector's account must be settled before this ships.
  6. **Account separation.** Unsubscribe never touches sign-in or safety mail; R141 says so. Add a test.
  7. **Access rules.** R142's access matrix test is the right control and runs in `npm run test:db` (prose says CI; I read the command list in CLAUDE.md, not the test files).
- **Proposed change:** add rows for items 1 to 4 and 6, and a line to R141 for 3 and 5; keep the email dark until RV-09 is signed, as the PRD says.
- **Evidence:** Read: PRD 670 to 677, 696 to 700; `docs/ops/SECURITY.md` lines 19, 20, 112; `SECRETS_REVIEW.md` lines 151 to 154; `supabase/functions/new-device-email/handler.ts` line 116. UNVERIFIED: the Resend one-click header support and the current domain reputation setup; I did not read Resend's documentation.
- **Residual risk after the change:** a legitimate user can still ask for mail they later forget; the one-click stop covers that.

### EX-SEC-10 MAJOR: stored picture copies reach the iPhone backup, and the Moments flow multiplies them

- **Requirements:** NS-53-R89, R93, R97, R103, R105, RK-10, section 17, `MEDIA_THREAT_MODEL.md` P9, NS-53-R81.
- **Finding:** By an earlier decision (NX-39 F9, ADR 0028 D1) stored pictures are not excluded from the iPhone backup. The threat model calls it "not a control against A4: it is a stated exposure" and the PRD repeats it as a certain risk once the flag is on (RK-10, rated medium impact). With the library read, the number of pictures that parents attach rises, because starting from a day with a good picture is a lower barrier. The stored copies are stripped of metadata (R89, a control by test and device row D-9), so what a backup holder reads is the pictures themselves, of a child, in a backup that the parent may not think of. Two points follow:
  1. The Moments decisions file is excluded from backup, the pictures are not. That is a coherent split (decisions are L4 and low value to rebuild; pictures are the parent's letter content), and it needs saying in the policy line before the flag goes on, as the PRD already plans.
  2. The device row D-3 (read `isExcludedFromBackup` on the media folders and compare with what Settings says) is open in the threat model, and R81 says the policy gains a backup line. Neither is a gate.
- **Proposed change:** make this a founder question with my recommendation. Option 1: exclude `photos/` from backup and tell parents that pictures return by restoring from their own library or from Save a copy (cost: a restored phone loses attached pictures unless they are in the library or an export). Option 2: keep the decision, add the policy line, add D-3 to G11, and add a one-line statement in the Review screen where the parent first attaches a picture. I lean to Option 2 for the first release because Option 1 changes a data-loss story for parents and needs the CPrivO and CDO; the exposure is the one the founder already accepted, now with a larger population. Either way D-3 goes into G11.
- **Evidence:** Read: `MEDIA_THREAT_MODEL.md` P9 and section 5; PRD 813, 937. UNVERIFIED: Apple's backup behaviour, which the threat model sources to Apple's File System Basics page; I did not re-read it.
- **Residual risk after Option 2:** whoever holds a parent's unencrypted device backup can read the pictures that parent attached. Carried by the founder, as it is today.

### EX-SEC-11 MINOR: the network geocoder is gated by a flag, but its code would still ship in the binary

- **Requirements:** NS-53-R62, R117, 7a.1 (P-B), F3, G8, O-31.
- **Finding:** P-B (Apple's geocoder) is behind `EXPO_PUBLIC_PLACE_NAMES_APPLE`, off, until G8 closes. The design is right: separate opt-in, consent text naming the data and the recipient, one request per card shown, no queue offline. The residual is simple. If the adapter is compiled into the release build with only a flag off, then an accidental flip, a config mistake or a merge that sets the flag turns precise coordinates into a network call to a third party. R62's build test fails when the flag is on without the G8 read-out; the code is still in the binary. A third-party geocoder (a map SDK or a web API) is a different and worse matter: it adds a vendor, a key and a data flow, and nothing in the PRD forbids it.
- **Proposed change:** for the first release, do not compile the adapter into the release profile (a build-time exclusion, not just a runtime flag); G11's binary scan lists `CLGeocoder`, `MKLocalSearch` and `MKReverseGeocodingRequest` as forbidden symbols in profiles where F3 is off. Add to 7a.1 that no third-party geocoder, map SDK or place-search API is ever added without an ADR, a vendor review under SEC-R and the founder's decision, because that is where a child's coordinates would leave the phone for a company that is not Apple. If G8 later closes, the adapter enters through its own PR.
- **Evidence:** Read: PRD 342 to 352, 389. UNVERIFIED: Apple's handling of a reverse geocode request (the PRD marks it UNVERIFIED too).
- **Residual risk:** none for the first release.

### EX-SEC-12 MINOR: no threat-model rows exist for the new surfaces, and two small items are loose

- **Requirements:** NS-53-R110, R139, R170, 19.2 (K1 to K4), 25.9.
- **Finding:** Chapter 06 of the engineering compendium asks for a threat-model row per new surface (SEC-R01, as the CISO skill records it). Moments adds: the library read and `scribe-library`, the place resolver and table, the decisions file, the Moments nudges, the day-sheet pick, the optional email path, and a deep link. `docs/security/MEDIA_THREAT_MODEL.md` covers pictures and recordings and says the library index "is not built (P2)", so it predates this PRD. Two small items:
  1. **Custom scheme.** R139 allows `scribe://moments` with no parameters. A custom URL scheme can be invoked by any other app or web page, so it can open our app on the Moments tab. The PRD already limits the landing to a route with no state, no prompt, no microphone and no draft, which is the right control; I note that the first thing that tab could do is start a library scan, so R70 and R109 (no PhotoKit call at launch or from a link; scan at first focus of the tab by the parent's own tab switch) should say "by a link" explicitly. They mostly do.
  2. **Kill switches.** K1 to K4 hide the surface and "delete nothing" (R170). The signing keys for remote config are present in `packages/api/src/keys.ts` (read: two key ids, `remote-config` among the kinds; the file says a key compromise needs an app release to revoke). That makes the kill switch usable. For a security reason, such as a vulnerability in the scan, hiding is not enough: add a kill value that also clears the decisions file at the next launch. And the founder's signing shell is the only way to publish it; a session cannot.
- **Proposed change:** add rows M10 and following to `MEDIA_THREAT_MODEL.md` (or a Moments section) for: library read (A3, A8), place resolver (A8 for the table, EX-SEC-3), decisions file (A3, A4, EX-SEC-5), nudges (A3, lock screen), day-sheet (A9, a malformed file from outside, already covered by P4 for the system picker), email (phase 2, A4, A6). Name the control type for each. Run it as part of G11. Make the kill value in 2 a row.
- **Evidence:** Read: `MEDIA_THREAT_MODEL.md` (assets, adversaries, entry points, section 8 gaps), `packages/api/src/keys.ts` lines 10 to 25, PRD 861 to 862, 872, 910.
- **Residual risk:** none after the rows exist.

## Controls I read and rely on (so they are not re-litigated)

- No server table, column, RPC or sync op for the library part (R116, R162, section 17). A control by test once written; the principle is the strongest security choice in the document.
- Hidden assets, screenshots, shared-album items and non-user-library sources are excluded before grouping (7.1), and no `includeHiddenAssets` (10.1 step 1). Good for the abuse case: the Hidden album stays hidden.
- No face, person or contact signal is read (R68, R164), no audio or frames of video (2.2). This removes the largest class of biometric exposure.
- Original library assets are never modified (R93); stored copies pass the metadata strip (R89) and have device row D-9 in the threat model.
- Library data is never in analytics, logs, crash reports, URLs or routes (R162, R167); analytics are off at 1.0 (section 18).
- Sign-out, Erase, Turn off and a downgrade in Settings delete the decisions file first, before any await (R115, ADR 0032 item 3).
- A second account on a phone never sees the first account's data (R105).
- Thumbnails: network off, bounded in-memory cache, cancelled on scroll-out, no disk cache by the app (R112). This is why EX-SEC-1 matters: a package could undo it.
- The app switcher is covered with opaque boxes before the snapshot (R102), with a scripted check named in the media threat model section 4.

## What I did not check

- No code was read for `scribe-library`; it does not exist on `wip/moments-prd`. Every statement about it is about the PRD's design.
- I did not read the lead documents (X1, X2, X5, X6, P6, T5) behind the PRD, only the PRD and the repo files named at the top. Where the PRD quotes them, I treat the quote as theirs.
- No Apple document, no dataset licence, no Resend documentation and no package source was read this session; those statements are marked UNVERIFIED where they carry weight.
- I am a role a Claude session plays with a skill. This is not a penetration test or an audit. Before the first person outside the founding family stores letters on the server, an independent tester is still the right check (CISO skill section 6); the library read adds a native module and a decisions store to their scope. Without funding, say plainly that this review is self-assessed.
- The R-17 shared security review: I did not re-read its current status; the CISO skill (read 31 Oct) says it had not passed. That is UNVERIFIED for today and bears on any outside user.

Signed: CISO (Claude role, not an auditor)
