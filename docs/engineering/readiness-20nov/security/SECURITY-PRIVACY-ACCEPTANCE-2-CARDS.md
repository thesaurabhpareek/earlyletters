# Security and privacy acceptance, part 2 of 2: cards NS-46 to NS-52

Task RD-D, `security-architect`, 20 Nov 2026. Docs only. Part 1 is `SECURITY-PRIVACY-ACCEPTANCE.md` (method, data classes, today's findings, function areas, label guard). Card rows are cited by id, not copied. Sources: `docs/product/prd/21-days-cultural-photos-home.md` and `27-photo-moments-and-media.md` on `origin/docs/locked-pack-inputs-20nov` (`bee01360`, UNLOCKED), `26-founder-direction-photos-library-and-media.md`, the merged designs `docs/tdd/new-scope/security.md` and `privacy.md` on develop. Where a card contradicts the locked pack (`450bcb4a`), see `SECURITY-OPEN-QUESTIONS.md` part C; I design to the locked pack until product rules.

Reading guide. Each card has: (a) one summary line (data, class, leaves the phone, label, retention); (b) a STRIDE table (threat, control, acceptance test as `[id] title`, level, mutant). `S` spoofing, `T` tampering, `R` repudiation, `I` information disclosure, `D` denial of service, `E` elevation. A letter that does not apply is listed as "n/a" with the reason. Flags in all cases: off in every EAS profile until their gates close (`NS-51-R32`, `NS-46` section 10).

Priority marks follow the cards. "device" rows are phone rows for `qa` and the founder: no unit test replaces them.

## NS-46 Days we mark (days library; Drop B subset first)

(a) Data: ticked day ids, moved dates, hemisphere. Class L4 (whole store, NS-47-R1). Leaves the phone: no (NS-47-R4). Label: none expected while NS-47-R4 holds; the card's own line says "Not verified against the current label rules" (NS-46 section 18). Retention: until unticked, sign-out, Erase everything, account deletion (NS-46 section 11); not exported (NS-47-R10); not backed up (NS-47-R6). Needs counsel: FR-DAY-23 source licences, the reminder consent line (DPLA Attachment 1 section 2.2 per NS-46 section 17), CUL-Q6 and Q11. Needs founder: Q-FD-10 (October review owner), Q-FD-18 (public day names in titles).

| STRIDE | Threat | Control | Acceptance test | Level | Mutant |
|---|---|---|---|---|---|
| S | Account B plans or sees A's library-day notes | Store keyed to the signed-in account; cleared at sign-out (NS-47-R15) | `[NS-47-R15] sign-out clears the store and dismisses delivered notes` | e2e | Leave the store on sign-out: red |
| T | A wrong date or a table presented as an authority | Rule dates computed; every table cell a date or `n/r`; `precision: about` shows "around" | `[NS-46-R1] every day row has its fields and a source` | unit (content) | Add a cell with a date and no `authority`: red |
| T | A day pre-ticked | `preTicked: false` on every row | `[NS-46-R1]` same | unit | Set one row `preTicked: true`: red |
| T | A hostile signed config turns a pause off or the library on | Config can only hide (FR-SEC-16); `killSwitches.libraryDays` added to `KILL_SWITCH_KEYS`, older configs parse it as off (NS-46-R28) | `[NS-46-R28] pause hides, never enables` plus `[FR-SEC-16] a validly signed hostile payload cannot turn a feature on` | unit | Let the payload set `libraryDays: false` to enable a hidden surface: red |
| R | Parent cannot show what they chose | Phone-only list; Days page shows it; no server record by design | n/a (no PRIV-R21 row unless counsel rules otherwise, NS-46 section 12 Records) | n/a | n/a |
| I | A passer-by reads a faith day on a lock screen | One neutral title and body per tone; day-name switch off by default and forced off with App lock (NS-47-R12, R13); only `publicTitleOk` seasonal and shared days may name themselves (NS-46-R36) | `[NS-47-R13] public days may name themselves; others need the switch` | unit snapshot of every `days.*` key in all four switch states | Mark a faith day `publicTitleOk: true`: red |
| I | A day id or tradition reaches a log, URL, analytics, notification identifier or crash report | Opaque identifier `el.day.<isoDate>`; payload `{source, kind}` only (NS-46-R32); canary with synthetic keys (NS-47-R8) | `[NS-47-R8] canary finds nothing` | unit (J-N18 pattern) | Put the day id in `userInfo`: red |
| I | The Days page or the day slip shows in the app switcher | Blank snapshot where Home and Me carry a day (NS-47-R26; E18) | `[NS-47-R26] unlocked only; blank snapshot` | device | Remove the cover: row fails |
| I | Save a copy leaks a settings key | Leak test over a file built with every key set (NS-47-R10) | `[NS-47-R10] the export holds none of it` | unit | Add the store to the export reader: red |
| I | Day data in the planned notification list survives sign-out | Cancel and dismiss at sign-out and Clear all (NS-47-R21) | `[NS-47-R21] untick and clear all` | e2e | Cancel pending but not delivered: red |
| D | Two notes on one day; volume rises | One pure `chooseOnePerDay` is the only place the one-a-day rule lives (NS-46-R30); property test over random plans | `[NS-46-R30] no local date holds two notes` | unit property | Add a second scheduler path (the `plan-reminders.ts` cap of 4 today): red |
| D | A kill-switch fetch failure blocks reminders | Fail-open for the library only; reading, export, typed days unaffected (NS-46-R28) | `[NS-46-R28]` | unit | Make the pause block typed days: red |
| E | The day note carries entitlement or sells | No Plus, price, allowance or Keep step in any day note (NS-46-R27) | `[NS-46-R27] a day note never sells` | unit (content rules) | Add "Plus" to a body: red |

Writing tools off on the Add a day and move-a-date fields (ruling D2; NSC-05). Nothing donated to Spotlight or Siri (D3; `[X6-R1]` scan).

## NS-47 Cultural background (the optional ask, the store, the lock-screen rules)

(a) Data: ticks and moved dates (L4), picks in memory (L4), `culture.asked` (L2), `notifications.dayNames` (L3). Leaves: no. Label: none while NS-47-R4 holds; counsel re-checks per build (NS-47-R23). Retention and deletion: sign-out clears the store but keeps the flag keyed to the account (NS-47-R15); Erase everything clears all and a kill mid-erase resumes (NS-47-R16); account deletion clears this phone at once and others when their session ends (NS-47-R17); deleting the app deletes the file (NS-47-R6).

Special category, stated for counsel: a ticked tradition day implies a faith or origin even though it never leaves the phone. The cards already treat the whole store as the highest class in it (NS-47-R1). I accept: L4, phone only, optional, equal-weight decline, withdrawable in one tap, no server row. I do not accept any default that makes a recorded act or a server copy unless counsel says so (CUL-Q6). Flag stays off until CUL-Q5, Q6, Q7 and Q11 are answered (NS-47 section 13, risk checks).

| STRIDE | Threat | Control | Acceptance test | Level | Mutant |
|---|---|---|---|---|---|
| S | Account B inherits A's days or sees that a store existed | Per-account store; B is asked afresh and told nothing (NS-47-R15) | `[X4-R1]` registry enumeration covers the store | e2e | Key the store by device: red |
| T | A second reader (prompts, Home copy, Find, analytics, support) uses the store | One module reads it; import-boundary test fails on a second reader (NS-47-R11) | `[NS-47-R11] one reader` | scan | Import the store from `analytics`: red |
| T | The store file is corrupt or an unknown newer version | Fails closed (no reminder, no crash); higher unknown version is read for known keys and never rewritten (NS-47-R28) | `[NS-47-R28] the store file is protected, versioned and fails closed` | unit with fake exclusion call returning false: 0 bytes written | Ignore the read-back: red |
| T | A day-specific prompt key reaches `entries.prompt_key` (L2, synced) | Home shows an ordinary prompt; a letter from each library day equals a control row (NS-47-R5) | `[NS-47-R5] a day note leaves no trace in the synced row` | unit | Pass the day id as `prompt_key`: red |
| R | No proof that the parent chose | By design none; counsel decides (CUL-Q6) | n/a | n/a | n/a |
| I | Lock screen outs a family | Neutral strings; no category sets `hiddenPreviewsShowTitle`; no title or body holds both a day name and a child name (NS-47-R12, R36, R38) | `[NS-47-R36] no category shows a title with previews hidden`; `[NS-47-R38] no day name beside a child name` | unit (category options read) | Set `hiddenPreviewsShowTitle: true`: red |
| I | The effective switch re-enables after App lock is turned off | Effective value is `stored && !appLockOn`; turning App lock on stores off and turning it off never turns it on (NS-47-R12). The built `lockScreenNames` pattern restores the stored value (the card cites `prefs.ts:109-112`; that range holds `writePrefs`, so the line numbers drifted [U]; read the names rule before copying) and must NOT be copied | `[NS-47-R12] app lock off does not turn the day-name switch on` | unit | Copy the `lockScreenNames` logic: red | 
| I | Cloud or file backup carries the store | Application Support (not Caches), `setExcludedFromBackup` with read-back; refuses to write if it reads false (NS-47-R6) | `[NS-47-R28]` and a `device` row for restore: a restored phone opens empty | unit + device | Skip exclusion: red |
| I | A request leaves carrying a day | Network fake sees 0 requests with a day id, tradition or country; migration lint rejects names like tradition, religion, faith, country, origin, culture (NS-47-R4) | `[NS-47-R4] no request carries a day key` | unit + scan | Add a column named `faith`: red |
| I | Analytics or insights carry tradition vocabulary | Allowlist stems rejected (NS-47-R34): `tradition`, `religio`, `faith`, `countr`, `region`, `origin`, `cultur`, `holiday`, `hemisphere`, `library_day`, `day_id`, `ticked` and others; no real tradition names in the test | `[NS-47-R34] analytics allowlist rejects day vocabulary` (`packages/analytics/test/`) | unit | Add an event named `day_ticked`: red |
| I | A real tradition paired with Asha in a fixture | Synthetic keys only (`zz-test-tradition`) | `[NS-47-R8]` | unit | Use a real tradition name: the no-real-family-data scan or review fails |
| D | The ask shows twice or stacks with other asks | Capped at two showings; joins `nextAsk` order (NS-47-R31, R33) | `[NS-47-R33] asks do not stack` | unit | Skip the cap: red |
| E | The ask pre-selects or guesses from locale | No prefill from device locale, storefront, time zone (NS-47-R20) | `[NS-47-R20] pickers do not rank, guess or cross-suggest` | unit | Prefill from locale: red |

## NS-48 Notification catalogue and rotation

(a) Data: none stored (NS-48 section 10: "last chosen key" removed; variant is a pure function of the cell and slot ordinal). Class: inputs read at plan time only (last letter kind and date, age band). Leaves: no. Label: none. Retention: n/a. The one new risk is composition: a variety function that reads a day or a child must not widen what a lock screen shows.

| STRIDE | Threat | Control | Acceptance test | Level | Mutant |
|---|---|---|---|---|---|
| T | The catalogue raises volume or changes which notes exist | The set of (id, date, time, class) is identical with the catalogue on or off (NS-48-R2); the planner takes a `select` function | `[NS-48-R2] volume is unchanged` | unit property | Let the catalogue add a note: red |
| I | A catalogue variant carries a child name by default | No `{child}` slot in new titles; names off or App lock means no child name anywhere (NS-48-R11) | `[NS-48-R11] no child name by default` | unit lint over rendered neutral form | Add a `{child}` title: red |
| I | A family, tradition or national day name leaks through a variant | The catalogue never overrides the neutral strings (NS-48-R9) | `[NS-48-R9] the catalogue honours the lock-screen rules` | unit | Override the neutral body: red |
| I | A quieted or hidden book contributes an age band or kind to a key | Quiet books contribute nothing (NS-48-R21) | `[NS-48-R21] a quiet book adds nothing to a key` | unit | Read `Child.quiet` after building the key: red |
| I | Notification content or identifier logged | Closed identifier set; NSC-06 canary | `[J-N18]` canary row for the catalogue | unit | Log the variant key with the id: red |
| D | Rotation key collides, no variant fits | A floor pool always exists (phase 1 floor) | `[NS-48] floor selector returns a string for every cell` | unit | Empty the floor: red |
| E | A note appears to write about the parent's letter | The app does not read the letter text for a note (NS-48-R5) | `[NS-48-R5] no letter text reaches the key function` | scan (imports) | Import the entries store into the key function: red |
| S, R | n/a | Local notifications, no sender, no identity | n/a | n/a | n/a |

Words PROPOSED only; the VOICE.md line 70 correction (zero exclamation marks, N-5) is `content`'s.

## NS-49 Picture-first start and Journaling Suggestions (level 2)

(a) Data: the chosen picture (L4, as NS-01), suggestion title and date (L4 in memory only; class pending `privacy` K13), the app's copy of the suggestion file (L4, `Caches`, deleted once read), suggestion id on the iOS 26 path (L3, memory). Leaves: no. Label: none while only the chosen picture reaches the app in memory and it never leaves (NS-49-R27; counsel confirms). Retention: transient; the stored copy follows NS-01. Entitlement: needs Apple approval or a request [U, spike step 1]. Needs counsel: the label line, the recent-days lines, DPLA 3.3.3(H). Needs the security delta read before any `production` build (NS-49 section 13).

| STRIDE | Threat | Control | Acceptance test | Level | Mutant |
|---|---|---|---|---|---|
| S | Apple's returned URL is not what it seems (a link, a wrong owner) | Open once without following links; check on the open handle that it is a regular file under the cap; read from the handle only (NS-49-R19) | `[NS-49-R19] a crafted or odd file is refused` | unit with fixtures: symlink, directory, zero byte, oversize, wrong type | Open by path twice: red |
| T | The app deletes the URL Apple returned | Deletes only its own copy (NS-49-R7) | `[NS-49-R7] the app deletes only its own copy` | unit | Delete the source URL: red |
| T | Native code widened to read other item types | `content(forType:)` only for Photo and LivePhoto; scan fails on any other `JournalingSuggestion.*`, `.items`, `ItemContent` or `JournalingSuggestionAsset` (NS-49-R10) | `[NS-49-R10] only photo types are read` | scan (NSC-01 manifest also pins the source) | Call `content(forType: Location)`: red |
| I | Location, workout, contact, song, mood retained | R10 scan; object not retained after the picker returns | `[NS-49-R10]` | scan + unit | Keep the suggestion object in a property: review catches; add a source scan for stored properties of the suggestion type |
| I | A library permission sneaks in | No usage string, no PhotoKit authorisation call, no `PHPhotoLibrary` in the 1.x line, resolved plist per EAS profile (NS-49-R6, R25). NS-51 lifts R25 for one module only (see Conflict in part C of open questions) | `[NS-49-R25] no library string or call in any other folder` | scan (plist introspection, binary strings) | Add `NSPhotoLibraryUsageDescription`: red | 
| I | The suggestion title, place or workout reaches a log, URL or crash payload | Canary with synthetic title and place (NS-49-R24) | `[NS-49-R24] canary finds nothing` | unit | Log the title: red |
| I | A note about the picture appears on the lock screen | Neither a note nor a slip mentions the picture, its subject or its place (NS-49-R3) | `[NS-49-R3] no note about the picture` | unit (content) | Add a "from your photo" body: red |
| I | Suggestion file left in `Caches` | Deleted once read; launch sweep; Erase everything (NS-49 section 10) | `[NS-49-R7]` plus the NS-01-R52 sweep test | unit | Skip the sweep: red |
| D | A launch crash below iOS 17.2 | `#available(iOS 17.2, *)`; weak-linked framework; platform raised to 17.0 (NS-49-R28) | `[NS-49-R28]` on 17.0, 17.1, 17.2, 26 | device | Strong-link the framework: row fails |
| E | A new entitlement widens the app | NSC-02 allowlist change needs my read; G11-3 trips and demands a D-id | `[NSC-02] entitlement allowlist` and the label guard | scan | Add an unlisted entitlement: red |
| R | n/a | Picking is an act, no record (NS-49 section 12) | n/a | n/a | n/a |

## NS-50 Home today

(a) Data: none stored; reads the Days store at render for today's date only. Class: reads L4 in memory. Leaves: no. Label: none. Retention: n/a. The card is the smallest and its risk is display: a day name on Home is visible to a shoulder-surfer.

| STRIDE | Threat | Control | Acceptance test | Level | Mutant |
|---|---|---|---|---|---|
| I | A day name visible in the app switcher | Blank snapshot where a day name shows (NS-50-R9; generalised E18 rule) | `[NS-50-R9] snapshot has no day name` | device | Remove cover: row fails |
| I | Home lists upcoming days or a count | Names a day only when it is today; never lists or counts (NS-47-R26, NS-50 section 13) | `[NS-50-R11] Home never becomes a feed` | e2e | Show tomorrow's day: red |
| I | A quiet or hidden book shows a day slip to someone else on the phone | No day slip for a quieted or hidden active book or with reminders off (NS-50-R8) | `[NS-50-R8] a quiet book shows no day slip` | unit | Ignore `Child.quiet`: red |
| I | Account B sees A's day slip | Reads the store keyed to the signed-in account (`[X4-R1]`) | `[X4-R1]` enumeration | e2e | As NS-47 |
| T | The Days ask is a promotion | One ask slip per account, no feature name, "new", count or price (NS-50-R16) | `[NS-50-R16] the ask slip is not a promotion` | unit (content) | Add "New" to the ask: red |
| D, E, S, R | n/a | Local render, no privilege, no identity | n/a | n/a | n/a |

## NS-51 Photo moments (level 3: parent-opted read of the photo library; DROP C, spike first)

(a) Data: asset id and creation date read (L4 in memory), a moments index (at most 30 moments, at most 6 ids each, L4, phone database, excluded from backup, NS-51-R6), chosen album ids (L4), opt-in and pause state (L3), thumbnails (L4 transient). Leaves: no (NS-51-R26). Label: "Photos or Videos: not collected" holds only while NS-51-R26 and NS-52 Variant A hold; counsel confirms (NS-51-R30). The new photo-library usage string trips G11-3 and needs a D-id and a label edit in the same PR. Retention: pause empties the index at once (R15), Turn off deletes index and album choice (R16), sign-out, Erase everything, Delete account and a system-ended session clear it (R17), a restored phone starts off (R23). Needs counsel: usage string, App Review 5.1.1 for a library permission for a child's pictures, children's pictures (Q43, Q45, Q48, Q54). Needs the founder: Q-PM-1 (limited or full access), Q-PM-5 (place names, default off), Q-PM-6 (image analysis, default none), Q-PM-7 (drop).

This is a contradiction of the locked pack (NS-01-R22, R33 and NS-49-R25 forbid library access in 1.x). Founder direction 20 Nov (`26`, RV-18) overtakes it, but the pack has not been re-locked. Build nothing here until product re-locks the rows (open-questions part C, C-1).

| STRIDE | Threat | Control | Acceptance test | Level | Mutant |
|---|---|---|---|---|---|
| S | Account B reads A's moments, or B starts on because the system permission is already held | Opt-in and index per account; B starts off even if the app holds permission (NS-51-R24) | `[NS-51-R24] second account sees nothing of the first` | e2e | Key the opt-in by device: red |
| T | The module reads more than dates (pixels, faces, people, scenes, location, file name) | Library calls only in one module; scan fails on image-data requests outside the sheet and attach, location, people or smart-album collections, Vision, VisionKit, Core ML, background change observers and background modes (NS-51-R29, R5, R33) | `[NS-51-R5] only dates are read`; `[NS-51-R29] one module, allowlisted calls`; `[NS-51-R33] no face or person matching` | scan | Add a `PHAssetCollectionSubtype` people fetch: red |
| T | A moment is faked to prompt a lock-screen note | The nudge reads only the index; planned at foreground only; neutral title and body; no new class, a ranked source in `evening` (NS-51-R11) | `[NS-51-R11] the nudge is neutral, budgeted, foreground-planned` | unit | Name the pictures in the lock-screen body: red |
| R | n/a | Local; opt-in is a setting, not a consent act | n/a | n/a | n/a |
| I | The permission is asked at launch or from another screen | Off until the parent taps "Turn on" on its own row after one sentence (NS-51-R1); the system sheet never shown otherwise | `[NS-51-R1] no library ask before the parent turns it on` | e2e | Request at launch: red |
| I | Plist string missing crashes the app, or present in builds where it is off | String present exactly when the flag is on (NS-51-R2) | `[NS-51-R2] usage string present exactly when the flag is on` | scan | Ship the module without the string: red |
| I | Index, ids or dates in backup, sync, export, log, analytics or URL | Excluded from backup with read-back; never synced, exported, logged or sent; analytics carry no opt-in, moment, album, count or date (NS-51-R6, R27, R28) | `[NS-51-R6] the index is small, L4, local`; `[NS-51-R27]`; `[NS-51-R28] canary finds nothing` | db + unit | Write the index to the exported tables: red |
| I | Thumbnails visible when locked or in the switcher | Sheet cannot open under App lock; a result returning while locked is discarded with 0 files; opaque boxes before the snapshot (NS-51-R25) | `[NS-51-R25] locked means no thumbnails` | device | Draw thumbnails in the snapshot: row fails |
| I | The limited-library alert nags | Suppressed with the Info.plist key Apple names (key name [U], NS-51-R4); picker only from the row's control | `[NS-51-R4] no automatic limited-library alert` | device | Remove the key: row fails |
| I | An iCloud original is downloaded for the index | Index and moment never trigger a download (NS-51-R21) | `[NS-51-R21] no download for the index` | device | Request network access: row fails |
| D | The index refresh slows Home or drains battery | Off the main thread, under 3 s [E, card ASSUMED], skipped in Low Power Mode and critical storage (NS-51-R38) | `[NS-51-R38] refresh never slows Home` | device (SE 3, 20,000 items) | Run on main: red |
| E | A background mode or observer is added | No background mode; the preflight refuses `UIBackgroundModes` (`apps/mobile/scripts/preflight-testflight.mjs:599-600`) [V]; scan for observers | `[NS-51-R29]`; the existing preflight check | scan | Add a mode: red |
| E | The flag turns on in a release profile early | Off in every EAS profile; a test fails a release profile that enables it (NS-51-R32) | `[NS-51-R32] flags only narrow` | unit | Set the flag in `eas.json`: red |

Writing no words from pictures: `[NS-51-R10] no picture is described` (content test over every string; mutant: a body naming a subject).

## NS-52 Pictures and videos with a letter (DROP C, spike first)

(a) Data: up to 6 pictures and 2 videos per letter (defaults, Q-PM-2), poster frames, 512 and 1,280 px copies, alt text. Class L4. Leaves: no under Variant A (default, NS-52-R19); under Variant B yes and X2 applies (needs my read and counsel's before any upload, NS-52-R23). Label: Variant A "not collected"; Variant B Photos or Videos collected, linked to the user (NS-52-R23; counsel confirms, Q54), same build. Retention and deletion: Remove deletes the file after the Undo window (R15); delete letter, Let it go, Erase now and Erase everything take every file, Recently deleted restores them (R16); Save a copy and export include stripped media, streamed to disk with a size line (R17, R18); restored phone and missing file show a plain box and one calm line (R40). The iPhone backup carries stored media under Variant A (NS-52-R19 lines). Needs counsel: child's video, Q43, Q45, Q48, Q54, Apple 5.1.1; biometric laws are not engaged only because no face matching is built (NS-51-R33). Needs founder: Q-PM-2 limits, Q-PM-3 sync (largest cost and counsel decision), Q-PM-4 video sound transcription (default no), Q-PM-11 video trim and print stills.

Conflicts with the locked pack: NS-01-R22 (no video, no multi-select), "one picture per letter" (NS-01 sections 3 and 4, R21a), NS-01-R15. Open-questions part C, C-1 and C-2.

| STRIDE | Threat | Control | Acceptance test | Level | Mutant |
|---|---|---|---|---|---|
| S | Account B reads A's media | Media paths are in the `[X4-R1]` enumeration (FR-SEC-34): attached files, poster frames, thumbnails, index, album picks | `[X4-R1]` over media | e2e | Omit the media folder from the registry: red |
| T | A hostile or malformed file (corrupt HEIC, huge dimensions, long duration, decompression bomb, symlink, wrong extension, zero byte) | Type from bytes; size and duration from a bounded parser; decode timeout; no third-party decoder, picker, editor or ffmpeg (NS-52-R8, R38; FR-SEC-31); one open handle; 0 files left on refusal | `[NS-52-R8] bad media is refused cleanly` with Asha-only generated fixtures; `[NS-52-R38] no third-party media code in the lockfile` | unit + scan + device row (a validator stricter than real files passes CI and fails phones, NS-52-R39) | Add a decoder package: red; open by path twice: red |
| T | A path traversal in a stored name | Stored names are the plain-name rule (`apps/mobile/src/lib/photos/files.ts:39` `PLAIN_NAME`) [V]; the same rule extends to `media/` | `[NS-52-R15]` and `[NS-01-R34]` extended to videos | unit | Accept `../` in a media name: red |
| T | Metadata (location, device, creation tags) stays in a video | Re-encode at most 1080p dropping every metadata atom (API for it [U]); 0 of 10 fixture videos carry a location or device tag in the stored file or in Save a copy (NS-52-R5); refuse video in share and print until the spike lists the fields (Q-S9 default) | `[NS-52-R5] 0 of 10 stored videos carry metadata` | unit + scan with a metadata dump | Copy the container unchanged: red |
| R | n/a for Variant A | Local act | n/a | n/a | n/a |
| I | A video's sound is transcribed or analysed | Never; scan fails any speech or audio-analysis call on media (NS-52-R6) | `[NS-52-R6] video sound is not read` | scan | Call a speech API on a video: red |
| I | A caption, alt text, title or mood generated from a picture | None generated, suggested, pre-filled or inferred; scan for Vision, VisionKit, Core ML, Speech, captioning APIs; content test for strings describing media (NS-52-R29) | `[NS-52-R29] no words come from media` | scan + content | Add a Vision call: red |
| I | Frames visible in the app switcher; AirPlay or Picture in Picture | Opaque box before snapshot (with or without App lock); playback pauses; AirPlay and PiP off (NS-52-R30) | `[NS-52-R30] no frame in the switcher` | device | Enable PiP: row fails |
| I | Media reaches our server under Variant A | A push carries no media path other than null; 0 bytes upload; a pull never creates or deletes a media row (NS-52-R19; NS-01-R15) | `[NS-52-R19] variant A uploads no media` | unit | Add a path to the push: red |
| I | Variant B: signed URL forwarded; a non-member or left member reads | Private bucket separate from the closed `entry-photos`; signed URL at most 5 minutes (Q-S8 default), minted by an Edge Function after a membership check; delete or move the object on removal because one URL cannot be revoked; storage rules deny a non-member, a left member and a second account (NS-52-R21; FR-SEC-27, -28) | `[NS-52-R21] variant B access matrix` | db | Make the bucket public: red |
| I | A temp copy of a picked video remains | Copy in `Caches`, deleted on completion, cancel, kill and next launch (NS-52-R33; NSC-08) | `[NS-52-R33] transcode is foreground only` and the NS-01-R52 sweep | device + unit | Skip the sweep: red |
| D | Disk full or a huge video | Copy never starts if free space is below twice the video's bytes plus a margin; nothing partial remains; draft keeps every word (NS-52-R10) | `[NS-52-R10] no space loses nothing` | unit | Start the copy first: red |
| D | A media failure costs the words | Words, audio take and other items intact; letter still keepable (NS-52-R11) | `[NS-52-R11] a media failure never costs words` | e2e | Roll back the draft on media error: red |
| D | Variant B: cost abuse | Per-account byte caps, rate limits on upload URLs, alerts at 80 percent (FR-RSK-07) | `[FR-RSK-07] caps and alerts` | db + ops row | Remove the cap: red |
| E | A third party gets a video through share | Share carries at most one picture, never a video; X2 reads before any picture (NS-52-R37, E23) | `[NS-52-R37] share stays one picture` | review + type-level test | Widen the share payload type: red |
| E | Picked items land while App lock is up | Every picked item discarded, temp copies deleted (NS-52-R32) | `[NS-52-R32] locked picks are dropped` | device | Keep items: row fails |

Sealed or private letters: a sealed letter's picture stays out of any other surface until it opens (`security.md` 3.5 E3); Variant B shows media to the other parent only through NS-25 rules and skips private letters (NS-52-R25).

## Summary of what leaves the phone, per card

| Card | Anything leaves? | Label effect | Gate before `production` |
|---|---|---|---|
| NS-46 | No | None expected | Counsel FR-DAY-23; founder Q-FD-10, Q-FD-18; tradition reviewer per tradition |
| NS-47 | No | None while R4 holds | Counsel CUL-Q5, Q6, Q7, Q11; device walk J-CUL-01 |
| NS-48 | No | None | Rules test; one-week device check |
| NS-49 | No (picture never leaves) | None if R27 holds | Entitlement request [U]; counsel; my plist read |
| NS-50 | No | None | SE 3 at AX5 |
| NS-51 | No | None while R26, R30 hold; usage string trips G11-3 | Spike R36; counsel; my module and plist read; founder Q-PM-1 |
| NS-52 | No (Variant A); yes (Variant B, X2) | A none; B Photos or Videos collected | Spike; my metadata and decoder reads; counsel; founder Q-PM-2, Q-PM-3 |
