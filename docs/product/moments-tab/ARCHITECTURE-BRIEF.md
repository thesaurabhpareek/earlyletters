# NS-53 Moments: architecture brief for the engineers

Status: PROPOSED (a reading guide and a design starting point; it decides nothing the spec has not decided, and nothing here is a founder decision)
Date: 21 Nov 2026
Owner: `principal-architect` (standards steward; `mobile` builds, `security-architect` reviews native)
Spec of record: `docs/product/prd/28-moments-tab.md` (v3, rows `NS-53-R<n>` written below as `R<n>`; section numbers are that file's)
Read with: `docs/product/moments-tab/EXPERIENCE-AND-MOTION.md` (EM), `HARNESS-REPLAN-HYBRID.md` (HR), `FREEZE-CHECKLIST.md`, `docs/engineering/PRINCIPLES.md`
Load when: you start designing any PR of the 41-item plan and do not want to read 2,400 lines first.

Fictional family Asha only. Evidence labels, used on every claim: a spec row id; `file:line` read this session on `origin/develop` at b02f13aa7; ASSUMED (a number or choice nobody measured); UNVERIFIED (a fact I did not read in a primary source). Every Apple API name is UNVERIFIED until the G1a spike and a read of Apple's own reference pages by `mobile` (EXH-ENG-17, HR section 2). Where this brief proposes a TypeScript shape, the shape is PROPOSED design, not an Apple fact. Spec line numbers are for `docs/product/prd/28-moments-tab.md` unless a file is named.

## 0. The design in six lines

1. The tab decides, the sheet chooses, capture speaks (EM section 0, line 14). Each surface does one job and hands over without a seam.
2. One suggestion engine, pure TypeScript, in `packages/core/src/moments`; no platform import (CODE-R10, `docs/engineering/01-code-and-change.md:51`).
3. Three native modules, each a thin adapter with a closed function list and a source scan: `scribe-library` (read, F2 only), `scribe-picker` (one plain Apple picker, F1), `scribe-photo` (strip only, untouched except PR 18d).
4. Nothing library-derived is persisted except day keys, hidden-place keys and the parent's label, in `moments.json` (L4, outside `scribe.db`); nothing leaves the phone (17, 17.1, 10.2).
5. Every route into a letter ends in one `AttachRequest` and one stripper, then the existing `startCapture({source})` (R85, R88, R83).
6. The door ships without the library chain; the library chain ships behind F2 only after every gate has a read-out (R278, R171, HR section 1 after the table).

## 1. System context and the three surfaces

### 1.1 Context

```
                      phone only (nothing below crosses to our servers: 10.2, R116)
 +----------------------------------------------------------------------------------+
 | Apple Photos library          Apple's picker (out of process)    iOS permission  |
 |      |  (F2 only)                    |  (F1)                         sheet        |
 |      v                               v                                ^            |
 | scribe-library (Swift)         scribe-picker (Swift)                  |            |
 | read, thumbnail view,          one pick or many, date read            |            |
 | exportForAttach                (PR 18b-1a, -1b, -1c)                  |            |
 |      |  typed arrays / view          |  files in Caches/ImagePicker   |            |
 |      v                               v                                |            |
 | apps/mobile/src/lib/moments  (source.ts, use-moments, capture-handoff, clear)      |
 |      |  injected source               | AttachRequest                              |
 |      v                               v                                            |
 | packages/core/src/moments      scribe-photo reencodeUpright --> entry_media        |
 | (pure engine, rules.ts data)   (strip only, Caches/ScribePhoto)  (existing path)   |
 |      ^                               |                                            |
 |      | day keys, labels (L4)         v                                            |
 | moments.json (outside scribe.db)  startCapture({source}) --> /listen or /write     |
 |                                                                                  |
 | lib/reminders (planner.ts, budget.ts): one boolean plus a day key from the engine  |
 +----------------------------------------------------------------------------------+
 Server side: no table, column, RPC or sync op for the library part (17, first line; R116).
```

### 1.2 The three surfaces mapped to Expo Router

| Surface | Job | Route (file) | Status today |
|---|---|---|---|
| Tab (decides) | Reason, date, city or occasion, two actions; the ask card; the door row; the calm lines (EM section 3, line 163) | `apps/mobile/src/app/(tabs)/moments.tsx` (file name ASSUMED), a tab screen under `(tabs)` (R172); order: second of four with Home as landing (19.3 phase 1 row) | `(tabs)` holds `index.tsx`, `book.tsx`, `you.tsx` only (read: `apps/mobile/src/app/(tabs)`) |
| Sheet (chooses) | Choose pictures in our day tiles or Apple's picker; tray; one Start; Not now (R269) | `moments/pick`, one row in `ROUTES` (`apps/mobile/src/lib/transitions.logic.ts:43`), a transparent modal with no platform animation so our surface can grow from the card (EM 4.1, line 186); file `apps/mobile/src/app/moments/pick.tsx` (ASSUMED) | No row yet. Existing rows use `presentation: 'modal'` or `'fullScreenModal'` and a `move` key (`transitions.logic.ts:43-56`); whether a transparent presentation fits the `Row` type is UNVERIFIED, PR 6 reads it |
| Capture (speaks) | Talk or write; the pictures follow into Review; Keep (R85, 9.1) | `/listen` and `/write`, opened only by `startCapture` | Exists. `CAPTURE_ROUTES = ['/listen','/write']`, closed source list `speak, type, notMuchToday, photo` plus four doorways (`apps/mobile/src/lib/capture/start-capture.logic.ts:19-21` for the source lists and `:28` for `CAPTURE_ROUTES`) |

Rule of thumb from EM line 181: the tab never chooses, the sheet never explains, capture never browses.

Three tests today say the opposite of this design and must change in PR 6 and PR 19, each under the founder's RV-01 (spec line 94, the three-tab reversal) and RV-02 (line 95, the one doorway), which G10 signs: `[IA-N1]` (the bar is `index, book, you`, `apps/mobile/test/navigation-one-entry.test.ts:199`), `[IA-N4]` (no fourth tab, line 217) and NS-35-R1 "only Home starts" (`docs/product/prd/11-foundations.md:538`). A PR that edits any of them without the recorded decision id breaks PRINCIPLES item 2 (never loosen a test silently) and R277's last sentence. The test must be rewritten to the new fact (the one doorway is `startCapture`, and Moments imports no recorder, R83), not deleted.

### 1.3 Component tree (PROPOSED; names are mine, files are PR 6, 13, 14, 16, 17)

```
(tabs)/_layout.tsx                         adds the fourth tab behind F1 (R172)
  moments.tsx  MomentsTab                  reads useMomentsState() only
    use-moments (lib/moments)              the one hook: source + engine + decisions store (PR 15)
    AccessState function (lib/moments/access.ts)   the ONE state function (8.1, T2-R1)
    body by state:  ValueView | CardList | DoorRow | CalmLine | LimitedLine
      MomentCard, DayCollage (PR 13a)      paper cards, thumbnails via ScribeLibraryThumbnail
      ExampleCard (PR 13b)                 inert, labelled "An example", no photograph (R69)
      PermissionAsk + primer sheet (PR 14a, 17)   primer is a sheet over the tab, never a route
moments/pick.tsx  PickHostSheet            one frame, two bodies (PR 14b, 18b-1a)
  Frame: title row (Not now, heading), Body slot, Tray, Start   ours, paper, opaque (R269)
  DayTilesBody   (library path, our tiles)  ScribeLibraryThumbnail, one column from AX1 (EM 4.9)
  PickerBody     (scribe-picker)            modal presenter first, inline view later (D1, PR 18b-2)
  capture-handoff.ts                         in-memory set -> AttachRequest (lib/moments, PR 18a, 19, 19b)
listen.tsx / write.tsx / review.tsx        unchanged; Moments imports none of them (R83)
```

Dependencies point one way: screens call `apps/mobile/src/lib` only (CODE-R11, `01-code-and-change.md:55`; 19.1); `lib/moments` imports `packages/core` and the three module wrappers, never the reverse; core imports nothing from the app.

## 2. Modules and boundaries

### 2.1 Closed list of modules, owners, flags

| Module | Path | Owns | F-flag | Edited by |
|---|---|---|---|---|
| Moment engine | `packages/core/src/moments/` (new) | types, exclude, group, rules, occasions, place, collage, rank, plan (19.1) | none (pure) | PR 1 to 5 |
| `scribe-library` | `apps/mobile/modules/scribe-library` (new) | every PhotoKit read, the thumbnail view, `exportForAttach` (R220) | F2; the aim is exclusion from the native project where F2 is off (R222, R277), UNVERIFIED until G3-x (2.7) | PR 9, 10, 18 |
| `scribe-picker` | `apps/mobile/modules/scribe-picker` (new) | the one plain picker, date read, multi-select contract (R271 to R274) | F1 only; independent of F2 (R169 v3 note) | PR 18b-1a, -1b, -1c, later -2, 18c |
| `scribe-photo` | `apps/mobile/modules/scribe-photo` (exists) | `pickOne`, `reencodeUpright` (`index.ts`, 2 functions) | existing photos flag | no picker PR; only PR 18d (R271, R296) |
| `lib/moments` | `apps/mobile/src/lib/moments` (new) | `source.ts`, `use-moments`, `capture-handoff.ts`, `clear.ts`, the decisions store | n/a | PR 8, 15, 18a, 19, 19b |

The four existing modules besides `scribe-photo` (`scribe-audio`, `scribe-files`, `scribe-keys`, `scribe-store`) are untouched (read: `ls apps/mobile/modules`). Every new module follows `.claude/skills/expo-native-module/SKILL.md` sections 2 to 5: `expo-module.config.json`, `index.ts` with `requireOptionalNativeModule`, `ios/<Name>.podspec`, `ios/<Name>Module.swift`, a source scan that fails when the Swift function names differ from the `index.ts` surface, and a green `ios-compile.yml` at the head.

### 2.2 `scribe-library`: the closed function list (R220, line 1256)

Exactly these, no others; a scan lists the allowed Swift names and equals the `index.ts` surface, so any function not on the list fails CI:

1. access status (no prompt, cheap); 2. request access (one call, only after the primer's Continue); 3. fetch window; 4. thumbnail, as the native view `ScribeLibraryThumbnail` (props `localId`, `px`; request, cancel on unmount, own byte-capped LRU, decorative to VoiceOver); 5. full image and player item or poster for the day sheet; 6. cancel; 7. `exportForAttach(localId, plainName)`.

`exportForAttach` asks PhotoKit for the original of one asset and writes it into `Caches/ImagePicker` under a plain name checked by the rule of R272. It does nothing else: no strip, no resize, no property read, one closed error code, no path over the bridge. So PR 18 never edits `scribe-photo`, and no PhotoKit name enters it.

Naming drift to settle in PR 9 (not decided here): spec 10.1 step 1 calls the fetch `scanDates` (line 579); R220 says "fetch window". Default: R220's wording is the contract, because R220 is the later v3 fix and is the row the scan is written from.

Day sheet items 5 (full image, player item) are in R220 even though D7 cut the viewer to one plain enlarge (R276, PR 20). Open question Q-8 asks whether the list should shrink; until answered the scan pins what R220 says.

Hard "nevers" for the Swift (each is a source-scan line, L1): no `includeHiddenAssets`; no change-observer and no background mode (10.3, NS-51-R29); no `performChanges`, `PHAssetChangeRequest`, `CLGeocoder`, `MKLocalSearch` (G11a, line 1119); no network request for image data (thumbnails: network off, 10.1 step 6). The Apple symbol names above are UNVERIFIED in this brief; they come from the spec's own G11a text, not from Apple's pages.

### 2.3 `scribe-picker` (R271 to R274, R272, R282)

- PR 18b-1a: a Swift presenter of one `PHPickerViewController` built from one plain `PHPickerConfiguration()`: no photo library argument, no `assetIdentifier`, no `preselectedAssetIdentifiers`, no authorization call, no PhotoKit symbol (R271). Podspec platform 17.0, depends on `ExpoModulesCore` only, no `expo-image-picker`, no `@expo/ui` for the picker. Pictures only; a Live Photo is a still.
- Today's presenter to copy the shape of: `ScribePhotoModule.swift:130-139` (one `PHPickerConfiguration()`, `filter = .images`, `selectionLimit = 1`, `preferredAssetRepresentationMode = .current`), a 2.0 second present timeout (line 58), and one picker open at a time. `scribe-picker` generalises `selectionLimit`; it does not edit that file.
- PR 18b-1a/-1b/-1c TypeScript surface (PROPOSED, section 5.2): `pickMany(names)` where JavaScript supplies N plain names, one per allowed slot, validated by the same plain-name rule as `PLAIN_NAME` in `apps/mobile/src/lib/photos/files.ts:39`; the limit (6 pictures, 2 videos once video ships) is enforced twice, by `selectionLimit` and by our own count in Swift (R272); each item succeeds or fails alone with a closed code, never a path, name or type identifier; cancel, back-out, closed sheet or lock removes every partial copy; bounded concurrency (value set at G1b); iCloud progress and a native Cancel are preconditions (NS-01-R17b).
- `readPickedDay(name)` (PR 18b-1b, R273): a separate native function, run on the original before the strip, returning `YYYY-MM-DD` or null; reads a named allow-list of property keys (capture date, its offset, the TIFF date) and never a GPS key; never copies a whole property dictionary; no fallback to file or provider date; a source scan fails on any GPS constant, `CLLocation` or whole-dictionary copy; a canary-GPS fixture (synthetic date and coordinate) proves the day comes back and no part of the coordinate appears in any returned value or log.
- Who deletes originals: not `scribe-picker`, and not `scribe-photo` (VERIFIED by the spec, R272: `reencodeUpright` removes only its own output). The deleter is the existing TypeScript `PickedFiles.remove` (`apps/mobile/src/lib/photos/types.ts:88-94`, `files.ts:91,113,150`), called by the new hand-off code in `lib/moments/capture-handoff.ts` after the strip resolves or the item is refused, for picked and exported files alike. Each is an L0 case with a stand-in file system and a negative control (R272). Whether an NS-01 scan pins the callers of `PickedFiles.remove` is UNVERIFIED; `mobile` greps in 18b-1a.
- Inline view (PR 18b-2) is LATER: whether the one-`PHPickerConfiguration()` scan can pass for it is UNVERIFIED (R271); 18b-2 states its own scan set or stays on the modal presenter.
- Video (PR 18c) is LATER and waits on the G1a-P read-back of what the container keeps (R290, R271).

### 2.4 `scribe-photo`: untouched except named PR 18d

Today: two functions, `pickOne(destination)` and `reencodeUpright(source, destination)`, each writing only to a destination under its own Caches folder, one closed error code per failure (`photo_pick_failed`, `photo_reencode_failed`), no network, no library, no permission request (`apps/mobile/modules/scribe-photo/index.ts:1-24`, the file is 24 lines). Pins: `apps/mobile/test/photos-device.test.ts` C5 (line 68; `pickOne` called in exactly one place, `lib/photos/picker.ts`, line 75) and C8 (line 971, the Swift read as source); also `photos-capture.test.ts` and `photos-surfaces.test.ts` (named by R271 and R296; not opened for this brief).

Spec says "line 73" for the `pickOne` pin (R296, line 1339); the `it(` is at line 75 on `develop` (read). Doc drift, harmless; PR 18d re-cites.

The rule (R271, CH-ENG-1): no picker PR edits `scribe-photo`, its `index.ts` or those pins. PR 18d (`mobile`, `security-architect` read, founder-visible note) alone retires `pickOne`, moves capture Add to the host sheet, and edits the three NS-01 scans. Until 18d merges there are two pickers with two untouched pin sets; R296 allows that only until 18d and PR 25a lists it as a named exception. `reencodeUpright` is never edited by any picker PR.

### 2.5 The suggestion engine: `packages/core/src/moments`

Pure TypeScript (CODE-R10). Today's `packages/core/src/index.ts` re-exports with `export *` and already owns `./rules` (the faithful-edit cleanup rules, `packages/core/src/rules.ts:1-3`), so a second `rules.ts` under `moments/` is legal but a name collision waits in any `export *` chain. Q-4 settles how it is exported; default: `export * as moments from './moments'` (ASSUMED).

Files, from 19.1 and HR rows 1 to 5: `types.ts`, `reasons.ts` (15 reasons in the first release, no RSN-ALBUM, no RSN-SUGGEST, 6.4a line 295), `verbs.ts` (five, R59, R286), `rules.ts` (data), `exclude.ts`, `group.ts` (with `offsetAt`, no `Intl`, 7.1), `qualify.ts` (both span predicates), `rank.ts`, `collage.ts`, `occasions.ts`, `momentsFor` registry, `place.ts` (injected table).

`rules.ts` is data, versioned by `MOMENTS_RULES_VERSION`, one definition per value (CODE-R13). PROPOSED values, all ASSUMED, none measured (7.2a, line 335; PR 3b sets them):

| Name | Value | Meaning in one line |
|---|---|---|
| `WINDOW_DAYS` | 90 | Recent window (7.2, line 331) |
| `BUSY_DAY` | 5 | Candidates, not frames (a burst or near-duplicate group counts once) |
| `BUSY_HOURS` | 4 within 3 hours | The older predicate, kept behind the same rules field |
| `MIN_SPAN` | 2 hours | First to last candidate, or two sessions |
| `SESSION_GAP` | 3 hours | Splits sessions inside a day |
| `NEAR_SECONDS` | 10 | Gap from the PREVIOUS item's last frame, never from the first frame |
| `NEAR_GROUP_MAX` | 60 seconds | Stops chaining: span from the group's first frame |
| `PLACE_RARE_SHARE` | 0.15 | A place line only when not home and share below this |
| Junk bar | 3 of 10 before "Not this one"; 2 of 10 after one use | Written before the verb ships (R281 e) |

Pure interfaces (PROPOSED shape; names follow the spec's vocabulary; section 5.1 has the full signatures). Inputs are columnar typed arrays and a clock; outputs are `Moment` values that hold ids, never bytes. A type test fails if a coordinate field appears on a `Moment` (7a.2 step 1, line 407). The type has no free-text field except the parent's own 60-character label (RK-8, R201).

Place rules (7a.2). Default build target is R220 (Q-2, G1a-L decides): the native fetch returns a place id or a coarse cell and never a coordinate, so `place.ts` resolves only a cell to a place. If G1a-L shows a cell cannot be produced natively, the fallback is that coordinates are read only inside `place.ts` and dropped when a place id exists, which needs the spec owners to change R220 first; a day's place is its majority place, a tie gives none; home place is the most frequent place in the window, held in memory; a place line shows only when the place differs from home and its share is below `PLACE_RARE_SHARE`; a stay (consecutive qualifying days, same away place) is one card, never named "trip"; Hide this place stores a place key (R229 external id, never a readable name). Table: a bundled offline city table, versioned and checksummed, fails closed to no place (R229); PR 5 uses a synthetic 10-row table, PR 5b ships the real one after counsel reads the licence.

Junk bar and the span rule are decided by PR 3b, the R205 harness (counts only, on the founder's own phone export, locally; 7.2a line 349). Goldens for 7.2a are written in PR 2 and PR 5 against `asha-lib-v1`.

Where core's closed lists live (CODE-R13): my standards position, PROPOSED, no rule change. `Reason`, `Verb` and `CardKind` are read by the app, the engine and later the push planner, so they are exported once from `packages/core` and never redeclared in `apps/mobile`. If any of them can reach SQL or analytics it goes in `packages/core/src/domain.ts` under the `domain.test.ts` parity check; none does in the first release (no analytics event, no server column: R282, R116), so they stay in `moments/types.ts`. Q-3 asks `data-architect` to confirm.

### 2.6 On-device stores and what is never persisted

| Data | Where | Level | Lifetime | Source |
|---|---|---|---|---|
| Day keys (Not now, Not this one, Hide this day, Keep close), labels (60 chars), hidden-place keys, home-place correction | `moments.json`, outside `scribe.db`, excluded from backup and read back (ADR 0032 pattern, status Proposed) | L4 | per-field expiry and cap (17.2, line 943) | 17, 17.1 (R221) |
| Primer answered flag; nudge opt-in flags | phone settings | L2 | until changed | 17 |
| Coordinates, place ids for the window, home place, thumbnails | memory only | L4 | the session | 17 |
| A picked original (temporary) | `Caches/ImagePicker` | L4 (a picture of a child with a location) | removed at the strip, on back-out, on lock, by the photos switch and Erase; launch sweep is backstop | 17, R272, R282 |
| A kept letter's picture copies | app container, `entry_media` | L4 | with the letter | 17 (existing, ADR 0028). NOT excluded from iPhone backup today: R81, R235 and MEDIA_THREAT_MODEL P9 say so, and whether the policy line discloses it or the folder is excluded is the founder's call at O-44 (the device row is carried by gate G11, spec section 21). `moments.json` is excluded from backup; the picture copies are a different store and must not be assumed to be treated alike |

`moments.json` contract (R221, 17.1): `{v, owner, dayKeys[], labels{}, hiddenPlaces[], homePlace}`; day key is a local ISO date with no zone; unknown fields preserved; a higher `v` reads as empty and writes nothing; write is temp file then rename; a corrupt file is deleted and the tab starts clean with no message; `owner` is an opaque local id, never a person id.

The parent's 60-character label is free text and can hold a child's name: it is never logged, never sent, never in a crash report, and it lives only in `moments.json`, so it is excluded from backup with that file (R201, RK-8).

Never persisted, never sent, never logged (10.2, line 596): image bytes or thumbnails of library assets; coordinates; machine titles, captions, filenames, EXIF text; counts; tap or dwell history; scan results; the permission result as an event; any picture or album identifier (R247: dropped for good, O-13 and O-14 closed as No). Thumbnails have no disk cache (R112, 10.1 step 6).

Wipe rules (R246, R115): revoke or downgrade drops everything rebuildable and keeps dismissal and hidden-place keys, unread without access; Turn off deletes every field; Erase, sign-out and Delete account delete the file and the home-place value; the file is deleted first, before any await; `eraseDeviceFiles` lists it and a scan finds zero bytes.

### 2.7 Flags and per-profile exclusion (19.2, line 984)

| Flag | Name | Controls | Release |
|---|---|---|---|
| F1 | `EXPO_PUBLIC_MOMENTS_TAB` | tab, For you, value view; also the door and `scribe-picker` (R169 v3 note) | ON |
| F2 | `EXPO_PUBLIC_PHOTO_MOMENTS` | ask, library read, Recent, places | ON only when every gate has a read-out (R171, R222) |
| F2a, F2b | split of F2 (O-39, recommended) | F2a: ask, read, Recent, day cards; F2b: place labels and the location member of the read (`PLACE_READ` constant, R241) | recommendation only |
| F3, F4 | Apple geocoder; library-timed reminder | adapters and nudge | OFF; F3 not compiled in (R236) |
| K1 to K6 | kill switches | hide at next launch, delete nothing; K2 hides the library read and not the door (the photos switch governs the door, R106, R170); K6 purges the file (R246) | not paused |

Per-profile exclusion (R222, line 1258): `scribe-library` is excluded from the native project of every profile where F2 is off, so no Swift, no pod, no PhotoKit link, no photo-library usage string. The mechanism is UNVERIFIED. Read today: `apps/mobile/package.json:96` holds a static `"expo": {"autolinking": {"exclude": ["scribe-keys"]}}`; nothing yet shows how a per-profile value reaches it for a local module on EAS. G3-x proves it (section 8). Layers, each with a negative control: (a) usage string by config plugin only in allow-listed profiles; (b) the exclusion; (c) an L1 test that no `scribe-library` call site is reachable unless the F2 constant is true, with the JavaScript import resolving to `nullSource`. (c) is a second layer and not the control. `app.config.ts` fence tier is UNVERIFIED (19.5); PR 11c reads the fence before editing.

Per-profile exclusion fallback if G3-x fails (my proposal, ASSUMED, Q-1): ship one binary with F2 off meaning "never call", keep the usage string out of that profile, and accept that the pod links; this fails R222 and R277 as written, so it needs the founder and counsel, not an engineer's quiet choice.

## 3. Data flows

### 3.1 Library read to card (10.1 steps 0 to 7)

```
tab focus / foreground ------------------------------------------------------------+
  accessStatus()  (no prompt; the only library call allowed before Home's first frame, R109)
      |
      v   AccessState function (section 4.1)  --- not authorised ---> value view / door row, STOP
  [authorised: full or limited]
      |
      v   fetchWindow({fromMs, toMs, limit})   one fetch, background queue, newest first,
      |   user library only, no hidden assets, no image data, so no iCloud download   [R111]
      v   columnar typed arrays: id, creationMs, kind, durationMs, subtype flags,
      |   favourite, burst id, place cell (see Q-2), plus `truncated`
      v   core.exclude    drops no-date, screenshot, screen recording, animation,
      |                   non-user-library, parent-left-out; collapses bursts      (no trace left)
      v   core.place      cell -> place id (table injected); coordinates never reach a Moment
      v   core.group      local day via offsetAt(ms); sessions at SESSION_GAP; near-duplicates
      v   core.qualify    7.2 rules incl. both span predicates; dismissals by day key
      v   core.rank       class order, seeded rotation, tile 1 = heart else middle session
      v   Moment[] with up to 4 tile ids          (memory only; nothing persisted)
      v   MomentCard  --->  ScribeLibraryThumbnail(localId, px = tile pt x scale), network off,
                            only rows on screen plus one screen lookahead, cancel on scroll-out,
                            byte-capped in-memory LRU, never on disk, recycled row never shows
                            the last day's picture                                   [R112]
```

What each hop may hold: the arrays live for one window; `Moment` values hold ids and day keys; thumbnails live only inside the native view. Home's first frame is delayed by 0 ms (R111). A second scan for one window rejects as busy (R110). Low Power Mode and critical storage skip the scan (10.3, line 602).

### 3.2 Picked set to capture hand-off (9.1, R85, R88, R272, R273)

```
Door row / day sheet "Choose other pictures" / capture Add (after 18d)
   |  opens moments/pick  (never a permission request, never leads into the primer: R279, R70)
   v
PickHostSheet (our frame, opaque)  --- Apple body: scribe-picker.pickMany(names[N], limit)
   |                                    Swift: ONE plain PHPickerConfiguration, selectionLimit,
   |                                    own count, bounded concurrency, copies ORIGINAL (with GPS)
   |                                    into Caches/ImagePicker under each plain name
   |                                    per-item closed code; cancel/lock removes partial copies
   +--- our body (library path): ids only, nothing copied before Start
   v
Tray (in memory)  <-- readPickedDay(name) per picked file, on the ORIGINAL, before strip
   |                  -> 'YYYY-MM-DD' | null; chip only if every picked day agrees (R274)
   v  Start (closes the sheet, then capture opens; picks stay in the tray until capture holds them: R269)
capture-handoff.ts  builds ONE AttachRequest (type from PR 18a; no route param carries ids: 9.1 step 3)
   v
 for each item:
   library asset -> scribe-library.exportForAttach(localId, plainName)  -> Caches/ImagePicker/<plain>
   picked file   -> already in Caches/ImagePicker/<plain>
   v
 scribe-photo.reencodeUpright(source, dest)  -> upright, metadata-free JPEG in Caches/ScribePhoto
   v  (the one stripper: EXIF, GPS, device atoms removed; resized under NS-01 numbers)
 PickedFiles.remove(original)   <- the deleter (TypeScript, lib/photos/files.ts); runs after the strip
   |                              resolves, the strip throws, or the item is refused; a partial `exportForAttach` file and an `exportForAttach` that fails before it returns a name are removed by the same path (L0 cases named in 5.3); launch sweep is the backstop
   v
 Review (copies held in Caches while Review is open)
   |-- back out / Not now / lock / inactive-then-lock  -> 0 files, 0 rows (R86, R102)
   v
 Keep -> one transaction: the letter plus entry_media rows (existing save path)
        no library id, album, filename, original time, coordinate or place label written (R93, R114)
```

Cleanup guarantees, each an L0 case with negative control (R272): original deleted at strip or refusal; every partial copy removed on cancel, back-out, closed sheet or lock; a test kills the process between pick and strip and the launch sweep (`sweepPhotosAtLaunch`, `apps/mobile/src/lib/capture/sweep.ts:69`, `lib/photos/device.ts:85`) empties `Caches/ImagePicker`. The threat model row P2 text claiming the sweep is not wired is stale on `develop` (R283); `security-architect` owns the correction.

Which `source` value the hand-off passes to `startCapture` is open (Q-6). Today's closed list has `photo` ("called once the system picker has returned a picture", `start-capture.logic.ts:7-9`); R83 adds `moment` for a card tap, in the same PR as its handler (NS-35-R5). No source value is ever sent (R87, O-38 default).

### 3.3 Notification timing from pictures: what we receive, scoped (13, R265, R280, R299)

What reaches the planner in the first release is nothing library-derived. The library-timed reminder is F4, OFF, phase 2, behind counsel's answer on question 2 of spec 21.3 and the founder's O-02 (13.1 table, 13.3, 19.3). The design below is what the code must be ready for, so the planner needs no rewrite later.

```
Phone-held facts only (first release):  typed day, ticked Day, date of birth, month day
   -> lib/reminders/planner.ts intendedPlan() -> budget.ts chooseOnePerDay() -> scheduler
   (existing; PlannedKind today = 'evening' | 'monthAge' | 'birthday', planner.ts:136;
    class ids today include 'typedDay' and a ranked source 'libraryDay', budget.ts:9,23,40)

Phase 2 (F4 on, own opt-in, off by default, equal weight, local only):
   foreground scan -> core.qualify -> ONE boolean "a moment exists on day D" + dayKey
   -> planner ranks it below monthAge, above only evening (13.3)
   -> title/body = an existing evening-class key, word for word; random identifier;
      payload {source, kind} at most; no thumbnail, place, count, picture, library date,
      and no word picture/photo/place/day/weekend/tab name (13.3, R196)
   -> tap routing table: typedDay, birthday, monthAge -> Moments; evening -> Home;
      landing shows phone-held cards only and starts NO library scan until the parent's own tab
      switch; never opens the microphone, a draft, the prompt or Settings (R265)
```

What we receive from the library read for this: the planner receives one boolean and a local day key from the engine; it never receives an id, a count, a place or a picture (19.1, "one boolean plus a day key"). A Moments signal replaces an evening note on the same date and the parent's cadence is the cap; no second note after the parent opened the app; no win-back (R299).

Facts read this session that the PRs must reconcile:
- `routeForReminder` returns `/` for `evening` and `/book` for everything else (`apps/mobile/src/lib/reminders/payload.ts:34-39`); R265 wants `typedDay`, `birthday`, `monthAge` on Moments. A routing change plus its tests is a PR 23 line.
- `PlannedKind` has no `typedDay` (`planner.ts:136`), while `budget.ts` already defines the class `typedDay` (`budget.ts:23,40`). PR 23 adds the planner kind; whether the planner enforces cadence beneath the 60-in-92-days ceiling is UNVERIFIED (R299; `mobile` confirms).
- R280 (stricter reading: no child name or month number on every setting) differs from the shipped planner when names are on (`planner.ts` `monthNoteCopy`, from line 295; the spec says "about lines 283 to 297"). Planner and key change is owed to `mobile` and `content`; no Moments push copy is final until O-50 is answered. Do not merge a Moments-class note before then.
- Library-derived signals must not be read before access is granted (13.2 rule 1) and are never provenance-tagged on the wire (13.2 rule 4).

## 4. State machines

### 4.1 Permission state to tab body and door (8.1, line 460; R69 to R79, R270, R287)

One pure function, `accessState(input) -> AccState`, read by the tab, the day sheet, Me and the nudge gate; no screen reads PhotoKit itself (T2-R1, 8.1 title).

| State | Input condition | Tab body | Door row | Sheet entry | Library calls allowed |
|---|---|---|---|---|---|
| ACC-0 never asked | iOS not determined, F2 on | value view (inert Asha examples), real For you cards, one ask card below | none (R270; O-56 may change) | n/a | `accessStatus` only |
| ACC-1 Not now | parent answered Not now | real cards; door "Choose pictures" first, then "Show days from my pictures", equal weight | yes | card, door | `accessStatus` |
| ACC-2 full | authorised full | For you and Recent | no (day sheet "Choose other pictures" and capture Add carry it) | card, day sheet, Add | all of the list |
| ACC-3 limited | authorised limited | cards from the chosen set only; calm line plus "Choose pictures" when few or none, never a blank or a count; foot control opens Apple's limited manager; automatic limited alert suppressed | calm line button | same | all, on the chosen set |
| ACC-4 denied | denied | real cards; door first, then calm line with Open Settings; tab and Me only | yes | door | `accessStatus` |
| ACC-5 restricted | restricted | real cards; door first; one plain line, no button, no reason | yes | door | `accessStatus` |
| flag-off | F2 off, kill switch, unsupported device, `nullSource` | as ACC-1 without the re-ask row; module not in the build | yes | door | none (module absent) |

Transitions: `accessStatus()` is read on tab focus and on every foreground; a Settings change redraws the tab in under 1 s with no message, a downgrade empties our data at once (the file is deleted first, before any await; R77, R115), an upgrade needs no second yes; the system never re-prompts and our UI never asks twice (8.2 step 6). The state is read, never remembered (R77). Presenting the picker is never a permission request in any state (R70, R271).

The map from the spec's six names (never asked, granted, limited, denied, restricted, flag-off) to a TypeScript union: `'notDetermined' | 'full' | 'limited' | 'denied' | 'restricted' | 'off'`, where `'off'` also covers unsupported devices (iPad, Mac, Android, web, Expo Go) served by `nullSource` (R110). PROPOSED; `lib/moments/access.ts`.

Hard rules the function enforces by test (L0): `notDetermined` never calls `requestAccess`; `denied` and `restricted` never attempt a second system prompt (R76); the door row is absent in ACC-0 and ACC-2 (R270, subject to O-56).

### 4.2 Sheet lifecycle (EM 4.5 to 4.7, 5.3; R269, R102, R272)

```
 closed
   | tap card lead tile / door row / "Choose other pictures" / capture Add (after 18d)
   v
 opening        paper surface grows from the measured rect (card) or rises (door); scrim 200 ms;
   |            Not now and Start present and hittable from frame 1
   v
 open (our body)  <-----------------------------------------------+
   |  "Choose other pictures" / "This day's pictures"             |
   v  body swap: only OUR layer fades over swapMs (150 ms)        |
 mounting_apple  sheet has STOPPED; Apple's view mounts under a still paper cover (no spinner) 
   |             never preloaded, never kept mounted behind our body (EM 4.7 items 1-3)
   v
 apple_open      cover fades 200 ms; picks flow to the tray; view never faded, scaled or moved
   |
   +-- picks exist -> swipe-down, scrim tap and escape OFF; grabber hidden (EM 4.6)
   +-- Not now ------------------> hard cut cover, drop picks and temporary copies, no dialog -> closed
   +-- Start (needs >= 1) -------> hard cut cover; sheet leaves 160 ms; capture opens;
   |                               picks held in tray until capture owns them -> chosen -> capture
   +-- inactive/background ------> paper cover over the sheet, picks held in memory, restored on active
   |                               (fallback if DM-09 shows the cover cannot hide Apple's view in the
   |                                switcher snapshot: dismiss on background)       [EM 4.7 item 5]
   +-- App lock engages/timeouts -> sheet closes; picks and temp copies discarded; nothing written;
   |                               a pick landing while locked is discarded with 0 files   [R102]
   +-- access revoked while open -> picker is plain and independent of access; our day body falls
                                    to the door state; Limited alert never shown          [R75]
```

Invariants (each an L2 or L5 test): opaque sheet with no ancestor opacity below 1 or non-identity transform while Apple's view is mounted (EM 4.7 item 1; whether Apple's view ignores touches otherwise is UNVERIFIED, DM-10); one host, no second stacked sheet (R269); no analytics event and no log line for open, cancel, pick or count (R274, R282, EM 4.12); never opened from a link or notification (`scribe://moments` lands on the tab only, EM 4.7 item 2).

With the first-release modal presenter (PR 18b-1a) Apple's picker is a presented view controller above our sheet, not mounted inside it. The mounting and cover rules above then apply to the presenter's lifetime and the tray fills when the picker returns; what the sheet shows while Apple's controller is up is Q-5. Layout C in EM 4.8 (line 253) describes exactly this fallback.

## 5. Contracts

### 5.1 TypeScript signatures for every cross-module call (PROPOSED; none is on `develop`; Apple facts inside are UNVERIFIED)

```ts
// packages/core/src/moments/types.ts  (pure; no platform import)
export type AccessState = 'notDetermined' | 'full' | 'limited' | 'denied' | 'restricted' | 'off';

/** Columnar, typed arrays, one window. No coordinate, no filename, no pixel data. */
export interface LibraryWindow {
  ids: readonly string[];            // PhotoKit local identifier; memory only (R247, 10.2)
  creationMs: Float64Array;          // UTC ms
  utcOffsetSec: Int32Array;          // R220 lists "UTC offset in seconds"
  kind: Uint8Array;                  // image, video
  subtypeFlags: Uint32Array;         // screenshot, screen recording, animated, ...
  favourite: Uint8Array;
  burstId: readonly (string | null)[];
  placeCell: readonly (string | null)[]; // see Q-2: R220 says "a place id or coarse cell, never a coordinate"
  durationMs: Float64Array;
  truncated: boolean;
}

export interface MomentsRules { /* rules.ts data: BUSY_DAY, MIN_SPAN, NEAR_SECONDS ... with version */ }
export interface PlaceTable { version: number; checksum: string; /* injected; core never loads it */ }

export interface BuildInput {
  window: LibraryWindow;
  offsetAt: (ms: number) => number;   // seconds, the phone's current zone (7.1); no Intl in core
  nowMs: number;
  rules: MomentsRules;
  places: PlaceTable | null;          // null: date-only cards (RK-5 fall-back)
  decisions: Decisions;               // day keys, hidden places, labels; no picture or album id
  phoneHeld: PhoneHeldFacts;          // typed days, ticked Days, date of birth, month days
}
export function buildMoments(input: BuildInput): Moment[]; // total, pure, deterministic for a seed
export function signalForDay(moments: readonly Moment[], dayKey: string): { has: boolean };
```

```ts
// apps/mobile/modules/scribe-library/index.ts  (R220; optional module: requireOptionalNativeModule)
export type LibraryErrorCode = 'library_unavailable' | 'library_busy' | 'library_failed' | 'export_failed'; // ASSUMED names, local only
export interface ScribeLibraryNative {
  accessStatus(): AccessStateNative;                       // no prompt, cheap
  requestAccess(): Promise<AccessStateNative>;             // only after the primer's Continue
  fetchWindow(w: { fromMs: number; toMs: number; limit: number }): Promise<LibraryWindowNative>;
  fullImage(localId: string, px: number): Promise<string>; // day sheet; shape UNVERIFIED (R220 lists "full image and player item or poster"). RULE: it must not return a path or base64, because that would create a disk or bridge copy of a library image outside the `exportForAttach` lifecycle; it is a native view handle, or it gets its own deleter row in the threat model before PR 10 (Q-8)
  cancel(requestId: string): void;
  exportForAttach(localId: string, plainName: string): Promise<string>; // writes Caches/ImagePicker/<plainName>
}
// View: <ScribeLibraryThumbnail localId px /> (native view, decorative to VoiceOver)

// apps/mobile/src/lib/moments/source.ts
export interface MomentsSource {
  readonly kind: 'library' | 'null' | 'fixture';
  accessStatus(): AccessState;
  requestAccess(): Promise<AccessState>;
  fetchWindow(w: { fromMs: number; toMs: number; limit: number }): Promise<LibraryWindow>;
  exportForAttach(id: string, plainName: string): Promise<string>;
}
export const nullSource: MomentsSource;          // Expo Go, web, Android, iPad, Mac, flag-off (R110)
export function fixtureSource(asha: AshaLibrary): MomentsSource; // tests (R110, R107)
```

```ts
// apps/mobile/modules/scribe-picker/index.ts  (R271 to R274, R272)
export type PickerErrorCode = 'photo_pick_failed' | 'photo_limit' | 'photo_icloud_failed' | 'photo_cancelled'; // R272 names photo_limit; the others ASSUMED
export interface PickedItemResult { name: string; ok: true } | { name: string; ok: false; code: PickerErrorCode }
export interface ScribePickerNative {
  /** One plain configuration, selectionLimit enforced here and again in Swift. Never returns a path, type identifier or system text. */
  pickMany(names: readonly string[]): Promise<readonly PickedItemResult[] | null>; // null: cancel or went away
  cancel(): void;                                          // removes every partial copy
  readPickedDay(name: string): Promise<string | null>;     // 'YYYY-MM-DD' or null; never a time, zone or GPS (R273)
}
export const fixturePicker: (files: Record<string, { day: string | null }>) => ScribePickerNative; // R271: PR 18b-1a

// apps/mobile/src/lib/moments/attach-request.ts  (PR 18a)
export interface AttachItem { source: 'picked' | 'library'; name: string; kind: 'image' | 'video' }
export interface AttachRequest { items: readonly AttachItem[]; day: string | null /* chip, never preselected */ }
// names are plain names inside Caches/ImagePicker (PLAIN_NAME rule); no id, path or coordinate

// apps/mobile/src/lib/moments/capture-handoff.ts
export function setPending(req: AttachRequest): void;     // one-shot, in memory, never a route param (9.1 step 3)
export function takePending(): AttachRequest | null;
// existing: startCapture({ source }) in lib/capture/start-capture.ts; 'moment' added in the same PR as its handler (R83, NS-35-R5)
```

```ts
// apps/mobile/src/lib/moments/store.ts  (PR 8, R221)
export interface MomentsFile { v: number; owner: string; dayKeys: DayKeyEntry[]; labels: Record<string, string>; hiddenPlaces: string[]; homePlace?: string; [unknown: string]: unknown }
export function readMoments(): Promise<MomentsFile>;      // corrupt -> deleted, clean start, no message; higher v -> empty, no write
export function writeMoments(f: MomentsFile): Promise<void>; // temp file then rename
export function clearMoments(scope: 'revoke' | 'turnOff' | 'erase'): Promise<void>; // R246 three operations; file first, before any await
```

### 5.2 Error codes: local only

- No new analytics event, identifier or stored field; no event that varies by access state; no attach or photo event carries a picker-or-library source (R282, R87, R284).
- New failure codes are local closed codes, and so is `picker_unavailable` (R282 as amended: `picker_unavailable` stays a LOCAL code, with no analytics wire code and no catalog row, so there is no `system.error.raised` event for it; reversible, a later wire code needs the founder's O-49 and a catalog change); `library_unreadable` and `fallback_used` stay local (line 965).
- A native error is one closed `code` with no path, id, date, file name, type identifier or system text (R110, R272; today's pattern: `index.ts` header of `scribe-photo`).
- Lint view (my standards read, not a spec row): these are client-local TypeScript codes. API-R09's SQLSTATE registry (`docs/engineering/02-api-and-contracts.md:49`) governs codes a client branches on that come from the server; none does here (no server surface, R116). So no registry entry is owed, and `docs/engineering/10-logging-and-observability.md` OBS-R02 applies to the client the same way: log `{name, code}`, never an id or a message.
- `photo_limit` is named by R272; the others in `PickerErrorCode` and `LibraryErrorCode` are ASSUMED names for `mobile` to settle in PR 9 and PR 18b-1a, with a test that every thrown code is in a closed list.

### 5.3 What each test layer covers, per module (layers: spec line 12)

| Module | L0 unit (vitest, Node) | L1 scan or lint | L2 simulator, e2e | L3 visual | L4 accessibility | L5 device |
|---|---|---|---|---|---|---|
| `packages/core/src/moments` | goldens (`asha-lib-v1`), property tests for rank and collage, both span predicates, near-duplicate goldens of 7.2a, place goldens (R281 f), no coordinate on `Moment` (type test) | import-graph (no platform import, CODE-R10); closed reason and verb lists | none | none | none | none |
| `lib/moments` | access state function table; store contract (corrupt, higher `v`, rename write); hand-off one-shot; cleanup order with `PickedFiles.remove` and negative control; zero-residue on back-out; failure paths with the same zero-residue assertion: `reencodeUpright` throws, `exportForAttach` leaves a partial file, `exportForAttach` fails before it returns a name, app lock engages mid-strip | no `scribe-library` call from `_layout.tsx` or Home (R109); no `requestAuthorization` anywhere in the picker path (R70) | Maestro flows through `fixtureSource` and `fixturePicker` (PR 24); stop at the host sheet | tab states; host frame baselined against a flat placeholder body (EM 10) | per state (G5 a) | permission states, Settings change (G7) |
| `scribe-library` | TypeScript wrapper against `fixtureSource` | Swift function names equal `index.ts` surface; forbidden-call scan; per-profile native project scan (R277); usage-string key only in allow-listed profiles | `ios-compile.yml` compile leg (F2-on has its own leg, R277) | thumbnails fade in place | decorative view | scan time, LRU, 20,000-item library on an iPhone SE 3 (G1b) |
| `scribe-picker` | wrapper against `fixturePicker`; per-item codes; limit enforced twice (stub); date-chip rule; canary-GPS fixture | one `PHPickerConfiguration()`; no PhotoKit symbol; no GPS constant, `CLLocation` or whole-dictionary copy; plist, entitlements, privacy manifest diffs unchanged (G11a-photo) | present and cancel on the simulator | host frame | task completion through Apple's view (G5 b) | iCloud pick, app lock during a pick, switcher snapshot, Limited pick (G7) |
| `scribe-photo` (18d only) | existing C5 to C10 tests, edited only in 18d | existing C8 Swift scan | existing | none | none | existing rows |

Test names carry the rule id, as the existing suites do (`[NS-01-R22][C5] ...`, `apps/mobile/test/photos-device.test.ts:68`).

## 6. Motion implementation notes (tied to EM; tokens from `packages/design-tokens/src/tokens.ts`)

| Item | Implementation | Source |
|---|---|---|
| Card to sheet (EM-01) | Measured-rect expand: on touch-down measure the tapped lead tile's rect into a small store (the `CardSource` pattern of MOTION 5f); lay the sheet content out once at final size; reveal it with one empty paper surface growing from the tile rect to full height; spring `motion.standard` (`tokens.ts:364`, response 0.4, damping fraction 0.92) with `overshootClamping: true`; lead tile carried to its place; rest of the sheet fades in from 60 percent; scrim `fadeMs` 200; about 400 ms, cap 420 | EM 5.1 (line 292), EM-01 (line 363), 14.2 |
| Not `sharedTransitionTag`, not `Link.AppleZoom`, no new dependency | Reanimated 4.5.1, gesture-handler, expo-haptics and core `Image` are already in `apps/mobile/package.json` (EM line 24 says VERIFIED; I did not re-read); `expo-image` is not used | EM section 0 item 5 |
| Reduce Motion | one 200 ms cross-fade for everything, no carry, no flight; read through the existing `useMotion()` (`apps/mobile/src/lib/motion.ts`) | EM EM-01, EM-07 |
| Route presentation | transparent modal, no platform animation, same mechanism as `cardToPage` (`transitions.logic.ts` `ROUTES`, the `letter/[id]` row) | EM 4.1 |
| Apple's view | Never faded, scaled or moved while mounted; mounted after the sheet stops, under a still paper cover whose fade (`fadeMs` 200) is the only thing that changes; hard cut cover on Not now, Start, inactive, gesture dismiss | EM 4.7, EM-03 |
| Body swap (EM-04) | cross-fade of OUR layer only, `swapMs` 150 (`tokens.ts:429`); plain under Reduce Motion | R269, EM-04 |
| Not now (EM-08, EM-09) | with a card: paper returns to the tile, 280 ms, 160 ms fade (`exitMs`, `tokens.ts:376`); without: leaves downward 160 ms | EM 5.6 |
| Start to capture (EM-07) | OFF by default (O-27). If signed: sheet leaves over 160 ms, tray tiles fly 320 ms into capture's slots, sequence not overlap | EM 5.4 (line 318), O-27 |
| `carryMs` | proposed token `motion.carry { ms: 320 }`, PROPOSED, not in `tokens.ts` today (grep: `tokens.ts` has `fadeMs`, `exitMs`, `swapMs`, no carry); lands with tests only after the founder says yes to O-27, never before (O-58). Architecture stance: PR 14b must not import a symbol that does not exist; the flight code ships behind the O-27 answer or not at all | EM line 498, O-58 |
| Limits | every move 420 ms or less, every sequence 900 ms or less (`sequenceMaxMs`, R144); `transform` and `opacity` only, except the growing surface's frame and radius; controls live from frame 1; a tap ends the move | EM section 5 preamble, 14.4 |
| Picture arrival | one 200 ms fade from a flat tile, once per picture; no spinner, no shimmer; a placeholder grace number is not fixed before the SE 3 run (recon 21) | EM line 355, 14.2 |
| Haptics | existing `tap` intent for tile select and Undo, throttled by the 100 ms rule (PROPOSED, C-50); none for open, swap, Start, Not now or door | 14.3 |

Architecture rules: one `PickHostSheet` component built from existing parts, no `@gorhom/bottom-sheet` for this route (it rises from the bottom and cannot grow from a tile, EM 4.1); animation lives in `apps/mobile/src/lib/transitions.logic.ts`-style pure logic plus worklets so L0 can test the timing table; the pure logic has no `react-native` import.

## 7. Performance and memory budgets on iPhone SE 3 (ASSUMED)

The spec states no number for scan time, `limit`, LRU size or memory and says each is "measured by the spike on an iPhone SE 3 with the generated 20,000 item library and is ASSUMED until then; this file states none" (10.3, line 602). Numbers the spec does give: Home's first frame delayed by 0 ms (R111); redraw after a Settings change under 1 s (R77); pending moment notes cancelled within 1.5 s of turning the nudge off (8.5, line 505); every motion within 900 ms, no single move over 420 ms (14.4); no frame over 16.7 ms on the SE 3 for EM-01, EM-07, EM-12 (DM-12, EM line 472).

The rest are MY proposed budgets, with no source, to be replaced by the G1b read-out:

| Budget | Proposed (ASSUMED, architect) | How to measure |
|---|---|---|
| Cold launch: library work before Home's first frame | 0 calls except `accessStatus` | L0 and L1 source test of R109; Instruments launch trace on device |
| First Moments focus to first card painted, 20,000-item library, default window | 1.0 s target, 2.0 s ceiling | Instruments Time Profiler plus a perf marker with no content (A5-R2, 14.4); median of 10 cold runs |
| Fetch window (`fetchWindow`) | bounded by `limit`; `limit` set by G1a-L | native timer in the spike build; report `ms_bucket` only (perf events allow `ms_bucket` and `is_ok`; exec-review `cdo.md:94`). Spike-only: a perf marker emitted only when the library is read would reveal the access state, so in a release build it fires in every access state and carries no state, or it is not emitted |
| Thumbnail memory | LRU capped in bytes; start at 16 MB hypothesis; peak resident growth from the tab under 40 MB | Instruments Allocations and VM tracker, scroll a 200-day list; size set at G1b |
| Host sheet with tray thumbnails | tray thumbnails dropped if DM-11 fails (EM 4.4) | DM-11 on SE 3, eight concurrent iCloud picks |
| Frame time for EM-01 | 0 frames over 16.7 ms at 60 Hz on SE 3 | Instruments Animation Hitches or Core Animation FPS (tool and template names UNVERIFIED for this Xcode); DM-12 |
| Multi-select copies | concurrency value set at G1b (R272) | spike: 6 originals, mixed HEIC and JPEG, peak memory |
| Peak memory with a 150 MP decode next to audio enhance | UNVERIFIED (MEDIA_THREAT_MODEL P4, N-Q1) | the device row is carried by gate G1b (Full device run) in spec section 21; the spec names no row D-8 |
| Moments does not slow cold start in a flag-off build | binary and launch parity with F1 off (R169: with F1 off the bar, routes and tests equal the build without Moments) | L1 parity test; launch trace |

Rule: no number in this table becomes a test threshold until G1b writes its read-out into `docs/release/<x.y.z>.md` (G1b "ASSUMED thresholds ... are set as data").

## 8. The 41-item plan as an architecture critical path

Source: HR section 1 table (41 items, five waves), spec 19.4. Sizes are ASSUMED changed lines. This section sorts them by what blocks what.

### 8.1 The three spikes and what each decides

| Spike | What | Decides | Unblocks |
|---|---|---|---|
| G1a-L (library; first week, before PR 9; owner `mobile` with the founder's phone) | Is `asset.location` readable under Limited and without a Core Location permission; the source-type default; the subtype predicate; delivery options; what the default fetch does with the hidden album and Recently Deleted; the iCloud-only skip; place-table size and accuracy against the R204 bars; whether Favorites is readable under a limited selection (line 1113) | The shape of `fetchWindow` (coordinates versus coarse cell: Q-2); `limit`; whether a Favorite can lead a tile under Limited; whether PR 9a and 9b can proceed | PR 9 |
| G1a-P (picker; simulator part now, device session later; a throwaway branch, never merged; synthetic Asha library) | (a) presents under None, Limited, Full; (b) hidden-bars matrix per access state, light and dark; (c) item provider date and GPS per type; (d) limit the picker to a date or album; (e) Apple's first-time text per access state; (f) SE 3 memory and time with the inline host; (g) iCloud, eight concurrent downloads; (h) mixed per-type limit enforceable live; plus R290's video-permission prompt (UNVERIFIED for SDK 57) | Layout A, B or C (section 8.3); per-type limit (O-54); inline host go or no-go; video go or no-go | PR 18b-1a (simulator read-out plus Apple reference read), 18b-2, 18c |
| G3-x (exclusion spike; sub-task of G3; `mobile` with `privacy` and `security-architect`) | Prove a per-profile autolinking exclusion removes `scribe-library` from the generated native project (pod list and plist) where F2 is off and keeps it where F2 is on, on EAS or a local prebuild per profile, with the JavaScript import resolving to `nullSource` (line 1117) | Which rule of R222 is live; whether F2-off builds can ship with no photo-library usage string and no PhotoKit link (R277) | PR 11c, the F2-off store build, and the "to merge" gate of PR 9 |

G3-x is UNVERIFIED mechanism today and the longest-lead risk to the library chain: a failure moves the whole F2-off compliance argument from a build fact to a code-path claim (Q-1, section 10). Ask `mobile` to run it in wave A beside G1a-L, not in wave C where HR places 11c.

### 8.2 Critical paths (what ships when)

```
DOOR path (F1 only; does not wait for any library PR, D4, R278):
  18a (type) + 18b-0 (threat rows) ----+
  G1a-P simulator read-out + Apple ref read ---> 18b-1a --> 18b-1b --> 19b ------+
                                               \-> 18b-1c ------------------------+--> 11a --> 25a
                       (12, 14 content and frame feed 19b)                              \
                       + photo flag legal set + counsel Q5-Q7, Q9 in the same build (R278) --> DOOR store build
  18d (capture Add moves; the only PR that edits scribe-photo pins) after 18b-1a, 18b-1c, 19b

LIBRARY path (F2; waits on gates):
  G1a-L read-out + G3 + G3-x --> 9 (9a, 9b) --> 10 --> 15 --> 16 --> 17 --> 19 --> 24
                               \-> 11b --> 11c (needs G3-x) --> 25b
  4, 8 -> 15 ; 13, 14, 12 -> 16 ; 5 -> 5b (licence, G11b) -> 22 ; 18 (exportForAttach) needs 9, 18a

PURE path (starts now): 1 -> 2 -> 3 -> 3b (R205 harness sets 7.2a values) ; 1 -> 4 -> 23 ; 1 -> 5
```

Critical path by length of unknowns (my reading, ASSUMED): (1) G3-x then 11c then 25b then the F2 flip; (2) G1a-L then 9 then 10 then 15 then 16 then 17; (3) G1a-P then 18b-1a then 19b then the door store build. The door path is shorter and has no library dependency; it needs counsel (R278) and `security-architect` reads (18b-0, 18b-1a to -1c, 18d).

CODE-R02 and the plan: items marked AT THE LINE (2, 4, 9, 11b/13, 14, 12) carry split plans in the spec table; a review round that adds lines forces the split, and `stacked-prs` is the method. PR 0 is over CODE-R02 by construction and needs the founder's `size:accepted` and a `Size exception` line (HR row 0). Rule of 18d and 18b: one PR may not edit a flag allow-list or its test together with the file they guard without the founder's recorded decision id (R277, last sentence).

### 8.3 Decision tree: layout A, B or C (EM 4.8, line 246; O-53) and picker-only versus library (E8, KM1)

```
G1a-P (b) hidden-bars matrix on SE 3 and newest phone, iOS 17 and newest, None/Limited/Full, light/dark
 |
 |-- with BOTH bars hidden: Albums reachable AND Options reachable AND privacy badge shown
 |     AND first-show panel appears AND continuous selection reaches us AND no count drawn where
 |     we cannot hide it  ----------------------------------------------------> Layout A
 |-- else the same list passes with only the BOTTOM bar hidden  --------------> Layout B (default until
 |                                                                              proven otherwise: O-53)
 |-- else, or DM-11 memory fails ---------------------------------------------> Layout C (modal picker as
 |                                                                              its own sheet; no tray for Apple's picks)
 +-- A or B passes but AX5 + VoiceOver/Voice Control/Switch Control task completion fails (DM-07)
       -> the public accessibility claim for starting from a picture is withheld until fixed;
          a letter never needs a picture (EM 4.8 item 4)
Never hide Options (EM 4.8). Layout A or B needs the inline view (PR 18b-2); the first release
ships the MODAL presenter (D1), which is Layout C in effect (EM 4.8 line 253).
```

```
E8 (spec 20.1, line 1084): picker-only versus picker plus library read, read from App Store Connect
cohorts split by F1 and F2 state in the release record, plus the diary; analytics is off, so no event.
 |-- picker-only arm starts as many letters or keeps as often  --> the cards are not earning the permission
 |                                                                  cost: feeds the F2 keep-or-slip choice (O-37)
 |-- library arm clearly ahead  -------------------------------> F2 stays on; evaluate Route A later (O-51)
 +-- gates G2 or G8 not closed by submission --> slip the library read only (O-37 recommended (b));
                                                 the door still ships (D4), the tab ships on no-library content
```

Architecture consequence: the code must work with `scribe-library` absent at every layer above `source.ts` (`nullSource`), and the door must not import anything from `scribe-library` (R110, D4). The first scan must not run if the F2-off build excludes the module; this is why `AccessState` has `'off'`.

## 9. Open architecture questions (each with an owner and a default)

| Id | Question | Owner | Default (if nobody answers) | Needed by |
|---|---|---|---|---|
| Q-1 | G3-x fails: no per-profile exclusion. Ship F2 as one build flag with the module linked everywhere, or hold the library read? | `mobile` runs G3-x; `security-architect`, `privacy` and counsel decide | Hold the library read (F2 dark); the door ships (D4). Not a quiet engineer's choice, because R222 and R277 say excluded | before 11c |
| Q-2 | Where is a place formed: R220 says the fetch returns "a place id or coarse cell, never a coordinate" (line 1256), while 10.1 step 1 and 7a.2 step 1 return coordinates to JavaScript and resolve in `core/moments/place.ts` (lines 579, 407). Which wins? | `mobile` with `privacy`, `security-architect`; read-out from G1a-L | R220 wins: native returns a coarse cell, core maps cell to place; coordinates never cross the bridge. Accuracy of a cell against the R204 bars is UNVERIFIED | G1a-L, before 9a |
| Q-3 | Are `Reason`, `Verb`, `CardKind` in `domain.ts` (CODE-R13) or `moments/types.ts`? | `data-architect` with me | `moments/types.ts` exported once from core (never redeclared in the app); `domain.ts` only for a type that reaches SQL or analytics | PR 1 |
| Q-4 | How does core export `moments` given `export *` and the existing `./rules`? | `mobile` | `export * as moments from './moments'` | PR 1 |
| Q-5 | With the modal presenter, what does the sheet show while Apple's controller is up, and does the tray exist for Apple picks (R269 says "presented in our sheet"; EM 4.8 Layout C says no tray)? | `design-systems` with `mobile` | Paper cover under the presenter; the tray fills on return; Start only after return | G1a-P read-out, before 18b-1a Also decide what the app lock does while Apple's presented controller is up: it is not our view to close, so the rule must be that lock dismisses the controller if the OS allows it, and otherwise the picks are discarded and the copies deleted on return (R102, R272; UNVERIFIED on a device). |
| Q-6 | Which `startCapture` source for a door pick and for capture Add: `photo` (exists) or `moment` (R83, card tap)? | `mobile` with `design-systems` | card tap and day sheet: `moment`; door and capture Add: `photo`; neither sent anywhere (R87) | PR 19, 19b |
| Q-7 | Does a transparent modal fit the `ROUTES` row type or does PR 6 extend `transitions.logic.ts`? | `design-systems` | extend the table in PR 6 with its own test | PR 6 |
| Q-8 | R220 lists "full image and player item or poster" for the day sheet, but D7 and R276 cut the viewer to one plain full-width enlarge. Keep the functions? | `mobile`, `security-architect` (fewer decoder surfaces) | Keep one function: full image at screen size; drop the player and poster until video ships | PR 9a |
| Q-9 | Does PR 6 have a repo fence on `apps/mobile/app.config.ts` (19.5 says UNVERIFIED)? | `mobile` | Read `compliance/FENCE.json` at PR 11c time and record the tier | PR 11c |
| Q-10 | Does a test already pin the callers of `PickedFiles.remove` (R272 says UNVERIFIED)? | `mobile` | Add one in 18b-1a if absent: only `capture-handoff.ts` and the existing attach path call it | PR 18b-1a |
| Q-11 | Which Apple symbol names and options does the SDK 57 toolchain accept for the picker (video permission prompt, `selectionLimit`, representation mode)? | `mobile` | Read Apple's reference pages and the installed `expo-modules-core` source before 18b-1a (EXH-ENG-17; skill section 4) | before 18b-1a |
| Q-12 | The two-picker interim until 18d (two pickers, two pin sets): acceptable in any store build? | `security-architect`, founder | Not in a store build past 18d; before 18d, only with PR 25a listing it as a named exception (R296) | PR 25a |

## 10. Risks and what is UNVERIFIED

### 10.1 Architecture risks (each cites the spec risk id where one exists)

| Risk | Why it matters | Mitigation in this design |
|---|---|---|
| Per-profile exclusion does not work (G3-x) | The F2-off store build could still carry PhotoKit symbols and a usage string; R277 and R222 fail (RK-2, RK-H3 adjacent) | Run G3-x early; `nullSource` as the only import path; scan the generated native project per profile (R277); founder decision if it fails (Q-1) |
| `scribe-photo` pins edited by accident | R271 and R296 allow one named PR; any other edit breaks the NS-01 promise that the strip has no PhotoKit | Path-scoped review; a `security-architect` read; the three scans stay green until 18d |
| Original left in `Caches/ImagePicker` with GPS | A located original of a child, on disk after the parent backed out (MEDIA_THREAT_MODEL P2, R272) | The deleter is TypeScript with negative controls; process-kill test; launch sweep |
| The door ships ahead of legal paperwork | RK-H3; R278 | Guard 25a fails a production build with the door on and the photo line missing |
| Apple's picker looks like Apple inside a paper app; first-time text, badge and numbers cannot be styled (RK-H1) | Trust seam | Frame only; never restyle Apple's view (EM 4.7, 4.10) |
| Suggestions feel wrong or watching (RK-3, RK-4, RK-H2) | Place and occasion cards | Offline city-level table only; Not this place; Hide this place; the junk bar; G4 |
| 20,000-item library slow on SE 3 (RK-6) | Launch and scroll | Date-window scans only; no launch work; section 7 |
| Plan is 41 items and about 10,130 lines (HR line 60, ASSUMED) | Review load; each AT THE LINE item may split again | `stacked-prs`; CODE-R02 split plans recorded in 19.4 |
| Existing nav tests assert one capture entry and three tabs | Silent loosening | RV-02 signed first; the rewrite keeps the property "one doorway" |
| Spec contradictions I found (Q-2, the `scanDates` name, the line 73 versus 75 citation, `routeForReminder`, `PlannedKind`) | Engineers start from different rows | This brief names a default for each; `product` owns the spec fix |

### 10.2 UNVERIFIED in this brief

- Every Apple API behaviour: PhotoKit authorization, Limited, fetch options and predicates, location readability under Limited, `PHPickerConfiguration` options and its item provider output, whether a picker pick under SDK 57 raises a permission prompt, `PHPickerViewController` embedding and touch behaviour with non-opaque ancestors, interface-style override, iCloud download behaviour. I read no Apple page. Source of the unknown list: R290, G1a-L, G1a-P (lines 1113, 1333).
- Whether a per-profile autolinking exclusion works for a local module on EAS (R222; `apps/mobile/package.json:96` is static).
- Whether a transparent modal fits the existing `ROUTES` row type (`transitions.logic.ts:43-56`).
- Whether Caches is outside iPhone backup (MEDIA_THREAT_MODEL P2 says "Verified (vendor)"; R282 says UNVERIFIED against Apple's text; `mobile` confirms).
- Whether a NS-01 scan pins callers of `PickedFiles.remove` (R272); the content of `photos-capture.test.ts` and `photos-surfaces.test.ts` (not opened).
- Whether the planner enforces the parent's cadence beneath the 60-in-92-days ceiling (R299).
- Whether `apps/mobile/package.json` still lists Reanimated 4.5.1 and the other motion packages (EM line 24 asserts it; not re-read).
- Every number in `rules.ts` (7.2a), every budget in section 7, and the sizes in section 8 (HR table).
- Whether Instruments template names used in section 7 match the installed Xcode.
- Counsel's answers (G2, G8, G9) and the founder's signatures (G10, RV-02, RV-23, O-27, O-37, O-39, O-46, O-48, O-50, O-53, O-54, O-56, O-58): all open; this brief assumes none.

### 10.2a Threat-model rows owed, and the tab's own app-switcher cover

- `docs/security/` has no row today for `scribe-library`, `exportForAttach`, `moments.json` or the thumbnail view. Rows are owed before PR 9, 10 and 8 merge, in `docs/security/MEDIA_THREAT_MODEL.md` or a new file named in the PR 18b-0 style docs item; `security-architect` reads them. Picker rows live in 18b-0.
- The app-switcher cover is specified for the sheet (4.2). The Moments tab itself holds library thumbnails in memory, so the existing app-lock and inactive cover must be checked to hide the tab body too, not only the sheet (new device row; UNVERIFIED).
- OPEN, before PR 8: with app lock off, does the Moments tab (not only the sheet) show library thumbnails in the iOS app switcher? It needs a device row in gate G7 (spec section 21, switcher and App lock snapshot, R232) and a founder decision. Default if undecided: cover it, so the tab body is hidden in the switcher whether or not app lock is on.
- Backup: the O-44 decision (policy line discloses stored picture copies in the iPhone backup, or the folder is excluded) is open and is not assumed by this brief (2.6; R81, R235; the device row that proves it is carried by gate G11 in spec section 21 and named at O-44). `Caches/ImagePicker` is a separate question and is UNVERIFIED against Apple's text.

### 10.3 What this brief does not do

It does not change a rule in `docs/engineering/`, the spec, `packages/` or any code. Standards positions in sections 2.5 and 5.2 are proposals; a MUST rule changes only by RFC with the founder's approval on the PR. Gaps found in other owners' files (the spec, `docs/security/MEDIA_THREAT_MODEL.md`, `apps/mobile` tests) are named for their owners, not edited here.
