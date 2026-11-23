# Moments tab: architecture (X3)

Status: PROPOSED. Docs only. Nothing here is built, decided or recorded in `docs/DECISIONS.md`.
Owner: X3, the architecture lead, for the founder, `mobile`, `data-architect`, `privacy`, `security-architect`, `qa` and counsel.
Date: 21 Nov 2026. Fictional family Asha only. The founder's screenshots are not in the repo and are not described here beyond the element types in the brief.
Nothing here is legal advice; every legal or store reading is "counsel must confirm".
Requirement ids are MT-X3-R1 and up. Test layers: unit, scan (source or binary), db, device, e2e, content, review.

## 1. Purpose and scope

The founder wants a tab that learns from Apple's journaling picker and is the daily reason to come back, and whose signal also shapes push and email (brief, UPDATE of 20 Nov). This file is the full architecture: module boundaries, data flow, router changes, the native module contract, performance for a 20,000 picture library, failure modes, what stays off the server, how email and push share one signal, switches, an ADR draft, rollback and content-free observability. It compares Route A (Apple's suggestions picker) and Route B (our own on-device PhotoKit read) and recommends.

Not in scope: screens, words, motion (design, content and animation leads), legal text (legal lead), product priorities (product leads). Where I rely on their output I say so in section 17.

Short answer, six lines:
1. Build one pure moment engine in `packages/core`. Three consumers (the tab, the local push planner, a server email job) call it with different inputs. The server gets only what it already holds; the phone adds the library.
2. Recommend Route B as the engine and Route A as one optional, parent-started door. Route A alone cannot feed Recent, push or email, and Apple draws its sheet.
3. Ship in three phases so the tab is useful on day one with no library permission: phase 1 needs no PhotoKit and no usage string, so it does not touch BL-1305.
4. Recommend tab position 2 of 4 (Home, Moments, Book, Me), Home stays the cold-launch tab.
5. Everything derived from the library lives in one file outside `scribe.db` (ADR 0032), never on the server, never in analytics, logs or crash reports.
6. Several standing rulings are overturned by the ask. Section 15 lists each as a reversal the founder owns.

## 2. Inputs read

Read this session in the repo (clone of `develop`, 21 Nov 2026):
- `/home/claude/moments-brief.md` (brief of record, UPDATE line noted).
- `CLAUDE.md`; `docs/ARCHITECTURE.md` headings; `docs/engineering/PRINCIPLES.md`; `docs/engineering/01-code-and-change.md` (CODE-R01, R02, R06, R10, R11, R13, R15, R16, R19), `02-api-and-contracts.md` (API-R06, R09, R11, R15, R19), `10-logging-and-observability.md` (OBS-R01 to R05, R08, R10).
- ADRs: 0028 (on-device data, `entry_media`), 0030 (one notification budget), 0031 (slip registry, title only), 0032 (on-device sensitive store, "days, culture, and the moments index"), 0033 (notification privacy), 0034 (pure selection), 0035 (one age function in core), 0036 (PostHog only).
- `docs/product/prd/27-photo-moments-and-media.md` (NS-51-R1 to R42, Q-PM-1 to Q-PM-12), `17b-engineering-plan-new-scope.md` line 49 (one native module line: `scribe-photo` and `scribe-library`, no third), `21-days-cultural-photos-home.md` (NS-47-R11, NS-49 levels).
- Code: `apps/mobile/src/app/(tabs)/_layout.tsx` (three tabs, JS tabs from `expo-router/js-tabs`), `apps/mobile/test/tab-bar.test.ts` (pins `['index','book','you']`), `apps/mobile/src/lib/capture/start-capture.logic.ts` (closed source list), `apps/mobile/modules/scribe-photo/index.ts` (picker only, no library), `apps/mobile/src/lib/capabilities.ts:258-268` (kill switch reader), `apps/mobile/test/g6-production-flags-off.test.ts` (no usage string, PhotoKit call or journaling entitlement in production), `packages/emails/src/templates/*` (billing and welcome only), `packages/core/src` (no moment code today).
- `docs/design/DESIGN-LANGUAGE-V2-21nov.md` lines 20 to 30 (public App Store bar).
- Branch `docs/privacy-moments-tab-21nov` (PR #1267): `docs/product/MOMENTS-TAB-PRIVACY-AND-CONSTITUTION-21nov.md`, sections 0 to 4, with its Apple sources A1 to A9. I cite its sources as read by `privacy`, not by me.

Not found when I looked: the feasibility doc and the design concept named in the brief (no open PR or branch for them in `git ls-remote`, 21 Nov). Branch `wip/moments-d5` exists; I did not read it. Reconcile point: when feasibility lands, its measured scan times replace my budgets in section 9 and its Route A answer on the entitlement replaces my section 6.

Where my reading differs from the brief:
- The brief lists "typed days" as something the server knows. They are not. ADR 0032 puts the days store in an on-device file outside `scribe.db`, L4, and NS-47-R11 lets only the days module read it. The server knows the child's date of birth, the plan, the email address and (for synced books) when letters were made. I design email from those four only (section 12). If the founder wants typed days in email, that is a new upload and a reversal (section 15, item 12).
- The brief says ML-6 shows a date, never a place or thumbnail. `privacy` could not find a text of "ML-6" (the nearest is NX-39-R16). I treat it as that rule and ask `product` to confirm the number.

## 3. Module boundaries

Rules behind the split: CODE-R10 (no platform import under `packages/*/src`), CODE-R11 (screens call `apps/mobile/src/lib`, never native modules directly), CODE-R13 (one definition of a domain enum), CODE-R14 (one implementation of a rule), CODE-R06 (files under about 300 lines), NS-51-R29 (library calls in exactly one module), 17b line 49 (no third native module).

```
packages/core/src/moments/                 PURE. No react-native, no expo, no node:*.
  types.ts        AssetStub, Moment, Occasion, MomentsState   (enums also exported from domain.ts)
  group.ts        groupByLocalDay(assets, offsetAt)            day and time-of-day buckets, no words
  rules.ts        isMoment(bucket, ctx)                        thresholds, as data
  occasions.ts    occasionsOn(date, { dob, typedDaySlots })    birthday, month age, typed day (opaque slot)
  rank.ts         selectForYou(ctx, dayKey)                    deterministic order, no randomness
  plan.ts         momentSignal(ctx)                            one boolean plus dayKey for push; nothing else
  index.ts        exports

apps/mobile/modules/scribe-library/        NATIVE (iOS). The only place PhotoKit is imported (NS-51-R29).
  index.ts        optional module (requireOptionalNativeModule), null when absent
  ios/            Swift: access status, date scan, thumbnail, limited picker. Nothing else.

apps/mobile/modules/scribe-photo/          EXISTS. Gains, in its own later PR, the Route A picker and the
                                           multi-select attach (NS-49 level 2, NS-52). No PhotoKit read.

apps/mobile/src/lib/moments/               JS data layer. The only importer of scribe-library.
  source.ts            MomentsSource interface and the three implementations (section 8)
  index-store.ts       reads and writes the moments file (index, decisions, notification map)
  moments.logic.ts     pure glue: window math, merge of index and live scan, paging
  use-moments.ts       hook for the tab (state machine: intro, asking, off, limited, ready, paused)
  nudge.ts             hands the one boolean to the planner at foreground
  capture-handoff.ts   in-memory pending pictures (never route params), then startCapture
  flags.ts             EXPO_PUBLIC_PHOTO_MOMENTS and kill switch reads

apps/mobile/src/app/(tabs)/moments.tsx     The tab screen. Imports only lib/moments and components.
apps/mobile/src/components/moments/*       Cards, day row, sheet. No native import (CODE-R11).

apps/mobile/src/lib/reminders/             EXISTS. planner.ts and budget.ts gain one ranked source (section 11).
apps/mobile/src/lib/days/                  EXISTS. Single reader of the days file; hands out opaque slots.

supabase/functions/moment-email/           NEW, server job. Imports packages/core only. No library input exists.
```

Why a pure engine and not logic in the hook: the same function must run in three places (phone tab, phone planner, Deno Edge Function). `packages/core` already runs in Deno and Next.js (CODE-R10; `packages/core/tsconfig.json` has `types: []`). The age function is already single (ADR 0035), so month-age and birthday come from it, not a second copy.

What the engine does not do, by construction (the constitution): it returns structure, never words. A `Moment` is `{ dayKey, startLocal, endLocal, timeOfDay, kinds, assetIds (at most 6), reason }` where `timeOfDay` is one of a closed enum (`morning`, `afternoon`, `evening`, `night`, `allDay`) derived from timestamps and `reason` is a closed enum (`manyPictures`, `birthday`, `monthAge`, `typedDay`). `content` maps enums to parent words. There is no `title`, `place`, `people` or `caption` field in the type, so a machine title cannot be added without a type change that review sees (MT-X3-R2).

### MT-X3-R1 One engine, three callers
- Given the tab, the planner and the email job, When each needs "what is special about this day", Then each calls `occasionsOn` and `selectForYou` from `packages/core/src/moments`, with no second copy in `apps/mobile` or `supabase`. (CODE-R14)
- Layer: scan (import graph test: no file outside `packages/core` defines a function named in the engine's export list; `supabase/functions/moment-email` imports from `@scribe/core`), unit.

### MT-X3-R2 The type has no words in it
- Given the `Moment` type, When a PR adds a string-valued field other than a closed enum key, an id or an ISO date, Then a type test fails.
- Layer: unit (type-level test, `packages/core/test/moments-shape.test.ts`, proposed path).

### MT-X3-R3 Enums are defined once
- Given `MomentReason`, `TimeOfDay`, `OccasionKind`, `LibraryAccess`, Then each is declared in `packages/core/src/domain.ts` and imported elsewhere; the native module's TypeScript types import `LibraryAccess` from core. (CODE-R13)
- Layer: unit (extends `packages/analytics/test/domain.test.ts` pattern), scan.

## 4. Data flow

Three inputs, one engine, three outputs. The library column exists only on the phone.

```
 SERVER-KNOWN (phone and server)        PHONE-ONLY (never uploaded)
 child date_of_birth ----------+        days file (typed days) -- via days module, opaque slots --+
 letters made (own letters) ---+                                                                    |
 plan, email address, prefs ---+        library dates -- scribe-library -- AssetStub[] --+         |
                               |        decisions (dismissed) ---------------------------+         |
                               v                                                         v         v
                       packages/core/src/moments  ( occasionsOn, groupByLocalDay, isMoment, selectForYou, momentSignal )
                               |                                       |                                  |
              server: moment-email job                     phone: use-moments hook                phone: nudge.ts
              (dob + letters only)                         (tab: For you, Recent)                 (one boolean + dayKey)
                               |                                       |                                  |
                       fixed-copy email                  cards, thumbnails (live request)       reminders/planner.ts
                       (no picture words)                compose -> capture-handoff             budget.ts: one a day, 60 total
                                                         -> startCapture({source:'moment'})     fixed neutral words, random id
                                                         -> /listen or /write (unchanged)
```

Reading the diagram:
- A thumbnail is requested live from the system by asset id and shown; it is never copied to our storage except the stripped copy the parent keeps with a letter (ADR 0028, `entry_media`).
- The compose button never passes an id in a route param (route state can be persisted and logged; API-R15 spirit). `capture-handoff.ts` holds ids in memory, `startCapture` receives only `{ source: 'moment' }` (NS-35: only `startCapture({source})` starts a letter; NS-51-R39: the source is in memory and dropped at Keep).
- The For you list is computed from state each time it is shown. Only the library-derived index and the parent's decisions are persisted.

### MT-X3-R4 No id in a route
- Given any Moments navigation, When a screen is pushed, Then no asset id, day key or date appears in a route path, search param or deep link.
- Layer: scan (grep of `router.push|navigate|replace` under `lib/moments` and `app/(tabs)/moments.tsx`), unit.

## 5. Route A versus Route B

Facts about Apple below are those `privacy` read this session (sources A1 to A9 in PR #1267) and S1 and S2 in card 27. I did not re-fetch them. My own attempt to fetch the PhotoKit `PHFetchOptions` page returned only its summary line, so anything about PhotoKit performance is UNVERIFIED (section 9).

| Question | Route A: Apple's journaling suggestions picker | Route B: our own PhotoKit read, limited access honoured |
|---|---|---|
| Library permission | None. The app sees nothing until the parent picks (A1) | Needs the usage string and Apple's sheet; limited or full (S2) |
| Entitlement or plist | `com.apple.developer.journal.allow`; whether Apple reviews it is UNVERIFIED (A4 silent) | `NSPhotoLibraryUsageDescription`; missing string crashes (A8) |
| Production build today | Fails `g6-production-flags-off.test.ts` (entitlement forbidden) | Fails the same test (usage string and PhotoKit forbidden) |
| iOS floor | 17.2 (A1); our floor is 17.0 | 17.0 (PhotoKit limited library since iOS 14, S2) |
| Look and layout | Apple's sheet, not ours; cannot restyle, cannot hide categories | Ours, on paper, in the design language |
| Recent list in our tab | Not possible: the app cannot list suggestions, only receive one pick | Yes: days newest first, our collage |
| Recommended cards | Apple's wording, music and mood tiles we cannot use | Our own: prompts, year ago, age days, typed days |
| Titles, places, names | Come back inside a pick; allowed only as Apple's words (NS-49-R9), never stored or reshown by us | Not available to us, and we do not look |
| Drives push | No. The app learns nothing until a pick | Yes, only by a foreground scan (section 11) |
| Drives email | No (and nothing on a server could, in either route) | No |
| Label impact | Stays "not collected" while nothing leaves the phone (A7) | Same, and a label review in the same build (NS-51-R30) |
| Cost and risk | Low build cost; Apple consent sheet once per device; no control of the experience | Medium build cost; native module; counsel read of 5.1.1 for a child's pictures; spike first (NS-51-R36) |
| Fit for "daily reason to come back" | Weak: parent-started, opaque | Strong: the tab can change every day from facts on the phone |

Recommendation (PROPOSED):
- Route B is the engine. It is the only route that can show Recent in our design, change daily, and (with the founder owning ML-3) feed a local nudge.
- Route A is kept as one optional door: "Start from your phone's suggestions", parent-started, where Apple's sheet is used as Apple's, per the existing NS-49 level 2 design. It is useful to a parent who says "Not now" to library access, because it gives real pictures with no permission. It is not the tab's content source.
- Phase 1 needs neither route (section 14). The system picker (`PHPickerViewController`, no permission, already in `scribe-photo`) plus our own letters, prompts and dates fill the tab before any permission ask.

This matches the founder's wording: "If declined, limited or denied, it still shows real things" (brief). Denied or limited is a working state, not an error (MT-X3-R14).

## 6. The native module contract (`scribe-library`)

One module, iOS only, optional like `scribe-photo` (`requireOptionalNativeModule`, null on Expo Go, web, Android, iPad, Mac app). Closed surface: five functions. Columnar results so the bridge moves a few typed arrays, not 20,000 objects.

```ts
// apps/mobile/modules/scribe-library/index.ts  (PROPOSED contract)
import type { LibraryAccess } from '@scribe/core';          // CODE-R13

export type ScanWindow = { fromMs: number; toMs: number; limit: number };
export type ScanResult = {
  ids: string[];            // PHAsset localIdentifier, opaque, L4
  takenMs: number[];        // creationDate as epoch ms, same length
  kinds: number[];          // 0 photo, 1 video, same length
  durationMs: number[];     // 0 for photos, same length
  truncated: boolean;       // true when the window held more than limit
};
export type ThumbRequest = { id: string; px: number };      // px = pixel edge, square crop is the UI's job
export type LibraryErrorCode =
  | 'library_unavailable' | 'library_denied' | 'library_scan_failed'
  | 'library_thumb_failed' | 'library_busy' | 'library_cancelled';

export interface ScribeLibraryNative {
  accessStatus(): LibraryAccess;                            // no prompt, synchronous, cheap
  requestAccess(): Promise<LibraryAccess>;                  // called only from the parent's tap (NS-51-R1)
  scanDates(w: ScanWindow): Promise<ScanResult>;            // creationDate, id, kind, duration; no image data
  thumbnail(r: ThumbRequest): Promise<{ uri: string; token: number } | null>; // network off; null when not local
  cancelThumbnail(token: number): void;
  presentLimitedPicker(): Promise<void>;                    // only from "Choose which pictures"
}
```

Rules the contract fixes:
- It reads only date, id, media kind and duration (NS-51-R5). No location, file name, caption, album, face, person, scene, keyword, or smart-album collection. Duration is not in NS-51-R5's list; I add it for video clusters (brief) and ask `product` and `privacy` to approve it (MT-X3-R8, section 23 question 4).
- No change observer, no background mode, no `PHPhotoLibraryChangeObserver` that runs while the app is not foreground (NS-51-R29). Freshness comes from a scan on foreground.
- `thumbnail` asks the system with network access off; a not-local original returns null and the UI shows a plain box (NS-51-R21). Thumbnail files, if any, are written only inside `Caches/ScribeLibrary` and swept at launch and at foreground; they are never in the index.
- Errors reject with one closed code and no path, id or date in the message (CODE-R15, R16). Swift logs nothing with ids: no `NSLog` of an identifier, and `os_log` with `%{private}` only for codes.
- `scanDates` is sorted by `creationDate` descending, and results are chunked by the JS side as month windows (section 9), so a single call never returns an unbounded array.
- A second call while a scan runs for the same window rejects `library_busy` (like `pickOne` today). The JS layer coalesces.

### MT-X3-R5 One module reads the library
- Given the source tree and the compiled binary, Then `Photos.framework` and the strings `PHAsset`, `PHFetchOptions` and `PHPhotoLibrary` appear only under `apps/mobile/modules/scribe-library`; in a build with the flag off, the module is not autolinked and the usage string is absent; the scan also fails on location, people or smart-album collections, Vision, Core ML and any background mode (NS-51-R29, R2).
- Layer: scan (source and binary), extends `g6-production-flags-off.test.ts`.

### MT-X3-R6 Test seams
- Given the data layer, Then every consumer takes `MomentsSource` (section 8) and never imports `scribe-library` outside `lib/moments/source.ts`; a script-generated Asha fixture source exists (fictional ids, generated dates, no real media).
- Layer: unit, scan.

### MT-X3-R7 Contract is additive
- Given a later build adds a field to `ScanResult` or a function to the module, Then old JS keeps working because fields are read by name and unknown ones are ignored; a removed or renamed function needs a new name (`scanDatesV2`) while any shipped JS calls it. (API-R11 applied to the native boundary.)
- Layer: review (principal-architect), unit (shape test against the previous release's contract file, once one exists).

### MT-X3-R8 Duration is the only field beyond NS-51-R5
- Given video lengths shown on a cluster, When `scanDates` returns `durationMs`, Then it is used only for the length line, never for ranking, and never in analytics or logs.
- Layer: unit, scan. Founder or `privacy` approval needed (open question 4).

## 7. Index store and decisions store

One file, `moments.json` (name PROPOSED), in Application Support, outside `scribe.db`, on the ADR 0032 pattern. ADR 0032 already names "the moments index" as its second tenant, so no new storage decision is needed, only a new section in that file. NS-51-R6 says "its own file"; I keep one file for the index and decisions because they share one clear order and one owner key.

```
moments.json  v1
  owner:    account key (read checks it; mismatch fails closed, ADR 0032 item 3)
  index:    [ { dayKey, startMs, endMs, timeOfDay, reason, assetIds (<= 6) } ]    L4, rebuilt on foreground
  window:   { scannedFromMs, scannedToMs }                                       so a refresh is incremental
  decisions: { dismissed: [ dayKey ] }                                            L4, the parent's own choices
  notify:   { slotId (random), dayKey } | null                                    for removing one pending reminder
```

Decisions:
- What is persisted is derived structure only. A day is "done" when a letter exists for it, read from the letters, never copied into this file (one source of truth; NS-51-R13 reads the day's letter). A day is "dismissed" only when the parent taps Not this one; that is one row of a date.
- Size: the index holds the last 90 days by default (NS-51-R7 default) and at most 30 moments (NS-51-R6). The Recent list needs more than that. Recent pages older days by scanning on demand into memory only (section 9); it is never persisted. This is a change to NS-51-R6 and R8 only in that the tab shows a list; the stored cap stays 30. Reversal 7 in section 15.
- Pause (Q-PM-12, CL-057): empties `index` and `window` and removes the pending reminder; keeps `decisions` (a dismissed date reveals no picture). Turn off, sign-out, Erase everything and Delete account delete the whole file first, before any await (ADR 0032 item 3; NS-51-R16, R17).
- Backup: exclusion set and read back; a false read-back deletes the file and refuses to write (ADR 0032 item 2; NS-51-R6, R23). A restored phone starts off and does not ask again by itself.
- Protection: file protection no weaker than `scribe.db` (ADR 0032 item 4). Per account: account B starts off and never reads A's file (NS-51-R24, ADR 0038).
- Writes are atomic (temp, rename). A corrupt file is deleted and rebuilt; nothing is shown from a half file.

### MT-X3-R9 The index is a cache
- Given the index file is deleted, corrupt or from another owner, When the tab opens, Then it rebuilds from a scan (if access is on), shows no partial moment and no message, and decisions are the only data that cannot be rebuilt.
- Layer: unit, device.

### MT-X3-R10 Clear order
- Given sign-out, Erase everything, Delete account or Turn off, Then the moments file is deleted first, pending moment reminders are removed, `eraseDeviceFiles` and the `[X4-R1]` enumeration list the file, and a scan finds zero bytes of it (NS-51-R17; BL-961).
- Layer: db, e2e.

## 8. Test seams and the three sources

```ts
// apps/mobile/src/lib/moments/source.ts
export interface MomentsSource {
  access(): LibraryAccess;
  request(): Promise<LibraryAccess>;
  scan(w: ScanWindow): Promise<ScanResult>;
  thumb(r: ThumbRequest): Promise<{ uri: string; token: number } | null>;
  cancelThumb(token: number): void;
  chooseMore(): Promise<void>;
}
// nullSource:   access() = 'unavailable'; used on Expo Go, web, Android, iPad, Mac app, flag off, module absent
// fixtureSource: generated Asha dates and ids from a seeded script; used by unit, e2e and the web preview
// nativeSource: wraps ScribeLibraryNative; used on a real iPhone only
```

Where each seam is used: unit tests use `fixtureSource` with a fake clock and a fake offset function; the core engine tests use plain arrays; the e2e (Maestro, existing `apps/mobile/e2e`) uses the fixture source behind the dev flag; a device row uses `nativeSource` with a script-created Asha library on a dev build (NS-51-R36). No test uses a real family's pictures (`no-real-family-data.test.ts`).

Engine test seams: clock (`now` is a parameter), zone (`offsetAt(ms)` is a parameter so DST and travel are testable, no `Intl` in core), thresholds (data in `rules.ts`, so the spike changes data, not code), and ranking (pure, deterministic from `dayKey`).

### MT-X3-R11 Moment rule goldens
- Given a fixture with a 5 picture day, a 4 pictures in 3 hours burst, a lone picture on a birthday, a lone picture on a month-age day, a lone ordinary picture, and a DST change day, When `isMoment` runs, Then exactly the first four are moments and the DST day groups by local calendar day.
- Layer: unit (golden file, test data excluded from CODE-R02 size).

### MT-X3-R12 Deterministic For you
- Given the same state and `dayKey`, When `selectForYou` runs twice, Then the output is identical; given the next `dayKey` the lead card may change; no call uses `Math.random` or the wall clock inside core.
- Layer: unit.

## 9. Performance: a 20,000 picture library

Budgets are from the cards where they exist and ASSUMED otherwise. None is measured: the spike (NS-51-R36) measures them on an iPhone SE 3 with a script-made 20,000 item Asha library, and I will not state a number as fact before then. PhotoKit behaviour below is from memory and UNVERIFIED.

Design, so the cost does not depend on library size:
1. Never enumerate the whole library. Scan a date window, newest first: the last 90 days for the index, one month at a time for Recent beyond that, each as a predicate on `creationDate` with a sort and a `limit` (the contract's `ScanWindow`). A window with more than `limit` items returns `truncated: true` and the engine works with what it has, which is enough because a moment needs only 4 or 5 pictures (NS-51-R7).
2. Read only the five fields. No image data is requested in a scan, so iCloud originals are never downloaded (NS-51-R21).
3. Run off the main thread: Swift on a background queue, results delivered as typed arrays; the JS engine step runs on the result. A 90-day window is the common case and is small even for a heavy shooter.
4. Incremental: `window` in the file records what was scanned; a foreground refresh scans only from `scannedToMs` minus a small overlap and merges. A full rebuild happens after access changes, a restore or a corrupt file.
5. Foreground scans are skipped in Low Power Mode and when storage is critical (NS-51-R38), never block Home's first frame (NS-34 budgets) and never run at launch: the first scan runs when the Moments tab first gets focus, or at foreground only if the nudge switch is on (A8: no PhotoKit at first launch, make calls on a direct action).
6. Thumbnails: only for rows on screen plus one screen of lookahead; each request sized to the display (a 96 pt minimum, per NS-51-R9, times the screen scale), cancelled when the row scrolls out (`cancelThumbnail`); an in-memory LRU holds a small fixed number; nothing is written to disk. The list is virtualised with the list component the app already uses [U: which component the Book uses, not checked; if none is suitable, a new list dependency needs CODE-R17].
7. Collage: up to 4 thumbnails per day row, one fixed layout, time order, no ranking and no crop that picks a face (privacy doc section 4).
8. Memory: the engine's input for 90 days is arrays of numbers and short strings; at 20,000 items a full pass would still be small, which is why the engine is allowed to be O(n) over a window but never over the library.

| Budget | Value | Status |
|---|---|---|
| Index refresh on foreground, 20,000 item library, SE 3 | under 3 s, off main thread | from NS-51-R38 (ASSUMED there); to be measured |
| Home first frame delay caused by Moments | 0 ms (no work at launch) | design rule, test |
| Tab first paint with cached index | one frame from `moments.json`, then reconcile | design target, not measured |
| Thumbnails in memory | fixed small LRU; number set by the spike | not set |
| Native scan call size | at most `limit` items; `limit` set by the spike | not set |

### MT-X3-R13 Launch cost is zero
- Given a cold launch with Photo moments on, When Home first renders, Then no `scribe-library` function other than `accessStatus` has been called, and a source test fails any call to the module from `_layout.tsx` or the Home screen.
- Layer: unit (spy on `nativeSource`), scan, device (NS-51-R38).

## 10. Failure modes

Each row is a state the tab must handle quietly. None shows an error string with a path, id or date; none counts or names a gap (J5: never an empty promise).

| Failure | What happens | Layer |
|---|---|---|
| Module absent (Expo Go, web, Android, iPad, Mac app) | `nullSource`; the tab shows phase 1 content only; the library row is absent, not greyed | unit |
| Access `notDetermined` | Intro shows our own Asha examples, then one plain ask on the parent's tap; "Not now" is comfortable and does not return by itself | e2e |
| Denied or restricted | Calm state; "Open Settings" only when the parent opens the row; For you and the picker door still work; no second system ask (NS-51-R19) | device |
| Limited access | Works on the selection; small selection means no moment and no message; "Choose which pictures" opens the limited picker; no automatic alert (NS-51-R4, R18) | device |
| Selection changed in Settings | Index rebuilds on next foreground, silently | unit |
| iCloud original not local | Plain box in place of a thumbnail; choosing it follows NS-52-R9; no download from the scan | device |
| Scan throws `library_scan_failed` or `library_busy` | Keep the last good index; no message; retry on next foreground with backoff (a local timer, not a network retry; API-R08 not applicable) | unit |
| Scan slow | Cached index shows first; scan result merges when ready; no spinner for the list | device |
| Index file corrupt, wrong owner or restored | Delete, rebuild, show nothing partial (MT-X3-R9) | unit |
| Backup exclusion reads false | Store refuses to write; Moments still works from memory for the session; no message | unit |
| No storage | Index is tiny; never blocks; attach path follows NS-52-R10 | device |
| Time zone or clock change, DST | Index rebuilt for the affected window; notification re-planned (NS-32-R16) | unit |
| Account switch or sign-out mid-scan | Result discarded when the owner key differs; file cleared per ADR 0032 | unit |
| App locked, app inactive, app switcher | Thumbnails replaced by an opaque box before the snapshot, with or without App lock (NS-51-R25, E18); a result that returns while locked is discarded | device |
| Kill switch turns on | Tab hides, pending moment reminders removed on next foreground, file kept until the parent turns off or erases (rollback, section 16) | unit |
| Parent deletes a source picture | Drops quietly; a moment below threshold vanishes (NS-51-R22) | unit |
| Two start doors in a row (tap compose twice) | `startCapture` plans once; `capture-handoff` is single-slot and cleared on read | unit |

## 11. Push: one signal, the planner, and where ML-3 is overturned

Existing rules to respect: ML-3 (no push is created from library data; fixed text, random id, no place, photo, count or "waiting"), NS-32 budget, NS-51 neutral words, ADR 0030 (60 pending in total, plan notices first, one chooser, `budget.ts`, `chooseOnePerDay`), ADR 0033 (category with a neutral preview, payload `{ source, kind }` only, identifiers opaque), ADR 0034 (pure selection), quiet hours, no thumbnail in a notification. Card 27 NS-51-R11 already made a moment "a ranked source of the evening class", planned only at foreground (Q-PM-8, CL-053), with the lock-screen words never naming pictures (Q-PM-9, CL-054).

Architecture:
- `packages/core` exports `momentSignal(ctx)`, which returns `{ fresh: boolean; dayKey }` and nothing else: no count, no asset id, no time of day, no reason. `nudge.ts` runs at foreground, only if `notifications.momentNudge` is on, access is on and the index is fresh, then passes at most one candidate to `planner.ts`.
- The planner already takes candidates with a class and rank; a moment is a ranked `evening` candidate below `monthAge` (NS-51-R11), so `chooseOnePerDay` keeps one a day and the 60 total with no new class (ADR 0030; N-2).
- The identifier is `el.m.<random>`, not `el.day.<isoDate>`: random per plan, and the `slotId` is kept in `moments.json` so it can be removed one by one, and every pending `el.m.` reminder is removed by prefix on pause, off, sign-out and Erase (extends ADR 0033 item 6). ML-3 says "random id", so this is stricter than ADR 0030's day-shaped id, which is for typed days and birthdays.
- Words: one neutral title and one neutral body, one string each, used for every tone and every state, never naming pictures, a place, a day or {child} on the lock screen (ADR 0033 items 1 and 2; Q-PM-9). The founder's example "Some pictures from the weekend are here" names pictures and a time window; under Q-PM-9 default it appears only inside the app. Whether it may appear on the lock screen with names on and App lock off is the founder's call (section 23, question 3).
- Timing: planned for the next quiet-hours-safe evening slot, never within an hour of one that is already pending, and removed when a letter is made that day (NS-51-R13).
- Background: none. A weekend's pictures taken after the last open do not prompt (NS-51-R11, Q-PM-8). That is a real limit on "reason to come back" through push; the honest answer is that library-driven push is weaker than the founder may expect, and the daily push still works from dates (birthday, month age, typed days) which need no library.

What this overturns (reversal the founder owns): ML-3's "no push is created from library data". Even with fixed words, the existence of a notification on a given day is derived from the library. Timing alone tells anyone who watches the phone that "there is something to write about today". Two designs follow; I recommend the first.
- 11a (recommended, no reversal needed): the push planner never reads library data. The existing evening reminder and date-based reminders stay as they are. The tab shows moments when opened. The "moment signal" reaches push only as dates the phone already knows.
- 11b (the founder's ask taken literally): `nudge.ts` as above, behind its own switch, default off, with the founder signing the ML-3 reversal and counsel reading the 5.1.1 and label notes.

### MT-X3-R15 The planner sees one boolean
- Given 11b is built, When `nudge.ts` hands over a candidate, Then its input type has only `{ fresh, dayKey }`, the planner test asserts no other key, the identifier matches `el.m.` plus 32 lowercase hex, the payload is `{ source, kind }`, and the title and body equal the neutral strings.
- Layer: unit (allowlist test named in ADR 0033, with a positive control: a note carrying an asset id must fail it).

### MT-X3-R16 Switches stop the signal
- Given Pause, Turn off, `notifications.momentNudge` off, a quiet or hidden book, an expecting-only plan, or App lock with day names off, When the planner runs, Then no moment candidate exists and every pending `el.m.` reminder is gone.
- Layer: unit, device (seed a pending and a delivered note first, then switch, then assert both gone; the CHECKS-AND-BALANCES C-06 pattern in ADR 0033).

### MT-X3-R17 One a day, 60 total
- Given a moment, a birthday and a month age on one date, When the planner chooses, Then one is planned for that date and the total pending stays at or below 60 with plan notices first.
- Layer: unit (extends `apps/mobile/test/reminders-budget.test.ts`).

## 12. Email nudges: server-known facts only

The server never sees the library (NS-51-R26, privacy rule). So an email cannot say "pictures", cannot be triggered by a moment, and cannot count anything from the phone. It can use only what the server legitimately holds:

| Server knows | Use | Not allowed |
|---|---|---|
| Child's date of birth (L4, in `children`) | Month-age and birthday occasions, computed by the same core function the phone uses (ADR 0035) | Putting the date or age in the subject line (subjects show in previews and logs) |
| When letters were made (for signed-in synced books) | "A letter from this day last year" at most as a fixed pointer; and silence when a letter was made that day or recently | Counts, streaks, "you have not written in N days", gap language (NS-51-R12, CLAUDE.md) |
| Plan state and email address | Billing and lifecycle mails already exist; Plus state decides eligibility | Any library, place, name or tradition |
| Parent's email preference (new) | One switch, default off | Sending with no opt-in |

Not server-known, so not usable: typed days and tradition choices (ADR 0032, NS-47-R11, NS-46-R47: no faith or tradition in email), library moments, the parent's dismissed days, the notification switches.

Architecture:
- `supabase/functions/moment-email/` is a scheduled job (system job, API-R04 exception for scheduled work; service-only, EXECUTE revoked from `anon` and `authenticated`, API-R05). It reads eligible books, calls `occasionsOn(date, { dob })` with no typed-day slots, and calls the existing send path in `packages/emails`.
- New template under `packages/emails/src/templates/lifecycle/` with copy in `packages/content`, one fixed subject and body per occasion kind, no `{child}` in the subject, never gendering the child.
- Idempotent: the send key is `(book_id, occasion_kind, local_date)` stored as a hash, never an address (API-R06, R07); a retry does not send twice.
- Consent and law: a marketing-adjacent engagement email needs an opt-in, a working unsubscribe and counsel's read. That is the legal lead's file; I only fix the architecture seam: a preference column or table is a migration (`supabase/**`, red-team review and `approve-migration`, D-041; I do not write it) and a hand-off to `data-architect`.
- The log is content-free: `OpsLog` fields only (OBS-R01), counts of sent and skipped, no address, no book id, no date of birth.
- Same signal, narrower input: the phone and the server call the same `occasionsOn`; the phone passes typed-day slots and the library, the server passes neither. A parity test proves that with the same dob the two agree on birthday and month-age.

### MT-X3-R18 Server input has no library
- Given `moment-email`, Then its inputs are limited to dob, letters-made timestamps, plan and preference; a scan fails any import of the moments index, `scribe-library`, the days module or analytics from `supabase/functions/moment-email`.
- Layer: scan, `npm run test:functions`.

### MT-X3-R19 Parity
- Given a dob and a date, When the phone engine and the server job compute birthday and month-age occasions, Then they return the same set.
- Layer: unit (one shared fixture, runs in both Node and Deno).

### MT-X3-R20 Email is dark until the founder signs
- Given the job exists, Then it ships with its switch off in every environment, a send-to-self dry run, and nothing is sent until the founder turns it on (the NEW_DEVICE_EMAIL pattern in `17b`).
- Layer: review, unit.

## 13. Expo Router changes per tab position

Today: `apps/mobile/src/app/(tabs)/_layout.tsx` declares three `Tabs.Screen` entries (`index`, `book`, `you`), pinned by `apps/mobile/test/tab-bar.test.ts` (`expect(SCREENS).toEqual(['index', 'book', 'you'])`). The root sets `initialRouteName: '(tabs)'` (`app/_layout.tsx:51`). The bar is 58 pt high, label-only 13 pt, with the Large Content Viewer button (`LARGE_CONTENT`).

What every option needs: a new file `(tabs)/moments.tsx`; a `Tabs.Screen name="moments"` with title from `copy.tabs` (new key by `content`; the brief says content may propose a better single-verb word) and an icon from the Phosphor set already used; `accessibilityHint` and Large Content Viewer title like the others; `tab-bar.test.ts` updated in the same PR (a deliberate edit, CODE-R03: the pin is the spec and the spec changed).

| Position | Order | Router change | Side effects I found | My view |
|---|---|---|---|---|
| Second of four | Home, Moments, Book, Me | Add file; insert `Tabs.Screen` between `index` and `book`; leave initial tab as `index` | Book moves from second to third. Settings back-label code names the You tab by key, unaffected. Book's empty state calls `router.navigate('/')` for Home, unaffected | Recommended |
| Centre of five | Home, Book, Moments, X, Me | Needs a fifth tab with a job; none exists, and Family is explicitly never a tab (layout header comment, IA-FINAL) | Adds a fifth item on iPhone SE 3 at AX5 where labels do not scale; the bar cannot grow without a design change | Not recommended |
| Default (first) | Moments, Home, Book, Me | Move `index` out of first place; set the first screen to `moments` | First launch lands on a permission ask; conflicts with K-02 (no permission ask during first run) and with capture living on Home (J4); the cold-launch path to the first letter gets longer | Not recommended |
| Inside Home | Home, Book, Me | No new tab; a section in `index.tsx` | Contradicts the founder's "one new tab" (item 1) and the Home design pack that removed strips; Home gets heavier at launch | Not recommended |

Why second: it keeps Home the cold-launch tab and the owner of the capture cluster, it puts the daily-return surface one thumb away, and it is the smallest router edit. The IA and design leads own the final call; this is the architecture's reason, not the IA's.

Other router facts:
- JS tabs (`expo-router/js-tabs`) keep a visited screen mounted. The Moments screen must therefore refresh on focus and on app foreground (`useIsFocused` plus `AppState`), not on mount only, and must release thumbnail requests on blur (`cancelThumbnail`).
- Hiding the tab for rollback: a screen option that hides a tab (for example `href: null` in the JS tabs) is how Expo Router normally does it. I did not read the installed `expo-router/js-tabs` source this session; the PR author verifies it against `node_modules` (CODE-R17, AIE-R11). UNVERIFIED.
- Pushed routes: the moment sheet and the limited-picker are presented over the tabs as sheets, not routes, so no deep link can open the library (`+native-intent.tsx` must not map any URL to Moments content). Opening the Moments tab itself from a notification tap is allowed and carries no id (payload is `{ source, kind }`).
- Capture: the compose button and the day row call `startCapture({ source: 'moment' })`. `moment` is added to the closed list in `start-capture.logic.ts` in the same PR as its handler, with a `design-systems` approval line (that file's own rule). The handler reads `capture-handoff` and opens `/listen` or `/write` as today. This changes J4 ("only Home starts a letter") but not NS-35 ("only `startCapture({source})` starts a letter").
- `ReminderPrimeAsk` is mounted in the tabs layout; it must not show over the Moments intro (one ask at a time).

### MT-X3-R21 Tab order is a decision, tested
- Given the founder signs a position, Then `tab-bar.test.ts` pins the new order and `initialRouteName` behaviour, label-only rename rules hold, every tab sets Large Content Viewer title and fixed label size (NX-30a-R4), and the bar still passes at AX5 on iPhone SE 3.
- Layer: unit (source text), device.

### MT-X3-R22 Capture has one door
- Given any button in Moments that starts a letter, Then it calls `startCapture` with `source: 'moment'` and no screen pushes `/listen` or `/write` itself; `navigation-one-entry.test.ts` stays green.
- Layer: unit, scan.

## 14. Release phases (so the tab is never an empty promise)

| Phase | What ships | Library or entitlement | Gate |
|---|---|---|---|
| 1 | Tab with Intro (our Asha examples), For you from dob, age days, typed days (via the days module), a year ago from our own letters, pictures the parent already attached, the 111 prompts; "Add pictures" through the existing system picker (no permission) | None. No usage string, no PhotoKit, no entitlement. BL-1305 untouched | Tab position, words, design uplift set rule (DESIGN-LANGUAGE-V2 item 1) |
| 2 | Route B: Recent and library moments, behind `EXPO_PUBLIC_PHOTO_MOMENTS`, off in every profile until the gates close | Usage string present only in builds where the flag is on (NS-51-R2) | Spike NS-51-R36, counsel read (5.1.1, label, Q43, Q45, Q54), BL-1305 and K-02 reversals signed, device rows |
| 3 | Optional: Route A door; local moment push (11b) | Journaling entitlement only if the founder wants the door | Entitlement answer from Apple, ML-3 reversal signed, copy cleared |

Phase 1 is the answer to "it is never an empty promise": a parent who is declined, limited, denied or on an unsupported device still has a real tab. It also matches the public-quality rule that nothing PROPOSED ships (brief; DESIGN-LANGUAGE-V2 item 4), because phase 1 has no gated words.

Sizing against CODE-R02 (400 lines or 20 files per PR, test data excluded; skill `stacked-prs`): the engine, the index store, the module, the tab UI, the planner hook and the email job are six separate stacked PRs, each far under the cap if the engine is split from its goldens only by file, not by concern. I give no line counts; the stack plan belongs to the engineering plan owner.

## 15. Reversals the founder owns

Each of these is overturned or relaxed by the ask. None is decided here.
1. J4, only Home starts a letter: Moments starts one through `startCapture({source:'moment'})` (NS-35 itself stands).
2. K-02, no permission ask during first run: an ask exists on the Moments intro, on the parent's tap; the tab is not default (UPDATE), so first run is untouched in my recommendation.
3. BL-1305, no photo-library usage string or PhotoKit call in any 1.x build: phase 2 requires it. Phase 1 does not.
4. ML-6 (card shows a date, never a place or thumbnail): the tab shows thumbnails inside the app. Lock-screen and card text stay place-free.
5. The three-tab ruling (`infra/scope-stack-rank-and-ia-redesign-2026-11-19.md`) and IA-FINAL "Home, Book, Me, always these three": a fourth tab.
6. NS-51-R40 ("no new Home element", the moment is one menu item) and NS-51-R8 (only the newest moment, never a list): the Recent list is a list.
7. NS-51-R6 and R7 limits: the stored index cap of 30 stands; Recent pages older days in memory beyond it. The 90 day default stands.
8. ML-3, no push from library data: only if 11b is built. 11a needs no reversal.
9. Q-PM-9 default (lock screen never says pictures): only if the founder wants the "Some pictures from the weekend are here" example on the lock screen.
10. NS-51 Not in scope "any album names shown, any title, a count": unchanged; I add none of them. Durations (R8 of this file) widen NS-51-R5 by one field.
11. Q-PM-8, no background refresh: unchanged; I do not propose one. It limits library-driven push (section 11).
12. Brief item "email from typed days": not possible without uploading typed days, which ADR 0032 and NS-46-R47 forbid; if wanted, it is a new upload and a founder decision with counsel.

## 16. Switches and rollback

Switches, in order of reach:
| Switch | Kind | Default | Effect |
|---|---|---|---|
| `EXPO_PUBLIC_PHOTO_MOMENTS` | build flag, local family (E20) | off in every EAS profile; a test fails a release profile that enables it before gates close (NS-51-R32) | Module, usage string and Route B code present or absent |
| `killSwitches.photoMoments` | remote, can only hide (D-035, `capabilities.ts:258-268`, CODE-R19) | not set | Hides Recent and library moments; phase 1 For you stays |
| `killSwitches.momentsTab` (PROPOSED) | remote, hide only | not set | Hides the whole tab |
| `killSwitches.momentNudge` (PROPOSED) | remote, hide only | not set | Removes pending moment reminders on next foreground |
| Photo moments row in Me | parent, local, per account | off | Opt-in, Pause, Turn off (NS-51-R1, R15, R16) |
| `notifications.momentNudge` | parent, local | off | Only if 11b is built |
| email preference | parent, server-side | off | Only if the email job is built; migration is a hand-off |

Every kill switch is owned by `mobile`, with a removal date set in the PR body when the feature is fully on (CODE-R19, R09). Kill switches only narrow; none turns anything on (NS-51-R32).

Rollback, by layer:
- Remote: set `killSwitches.photoMoments`, `.momentsTab` or `.momentNudge`. Effect on next foreground, no App Review. The index file stays until the parent turns off or erases (a kill switch is not a reason to delete a parent's decisions); nothing is sent anywhere either way.
- App: the usage string, entitlement and module code are compiled in. They cannot be removed without a new build. So the honest rollback of Route B is "hide now with the kill switch, remove in the next build". This is why the flag is off in every profile until the gates close.
- Data: the moments file and thumbnails are caches; deleting them loses only decisions. There is no server table to migrate back (no `supabase/**` change for the tab itself).
- Email: switch off, job stops; no data was stored beyond send keys.
- Test of rollback: one device row that turns the kill switch on mid-session, asserts the tab hides and pending `el.m.` notes are removed, and the parent's letters are untouched.

### MT-X3-R23 Flags only narrow
- Given the three kill switches, When any is true, Then the feature narrows and Erase, sweep and Export still work; no kill switch enables a feature that is off.
- Layer: unit (NS-51-R32 pattern).

## 17. Content-free observability

Rules: OBS-R01, R02, R05, R08, R10; ADR 0036 (PostHog only, allowlisted registry); NS-51-R27 and R28 (no library signal in analytics; canary finds nothing); D-124 (in-app analytics off for 1.0, opt-in) as superseded by D-163 for the production build only (page-view, click and impression events for every user, off in production until its gates close; the content ban stands).

Principle: the library must not be observable even as a number. A count of pictures, moments or unwritten days is a library signal and a gap count. A scan duration correlates with library size. So:
- Device diagnostics (local, L1 and L2 only): a closed `MomentsLog` allowlist of `{ code, outcome }` where `code` is a `LibraryErrorCode` or a closed state name (`intro`, `asking`, `off`, `limited`, `ready`, `paused`) and `outcome` is `ok`, `degraded` or `failed`. No ids, dates, counts, durations, album names or paths. No `console.*` (CODE-R20).
- Analytics: by default nothing about Moments. If the founder later allows it, only a boolean opt-in state is permitted (NS-51-R27 default none), and a `slow` boolean for a scan over budget, never the duration. Nothing from the library, ever.
- Crash reports: reduced `$exception` only (ADR 0036); Swift errors map to the closed code before they cross the bridge, so a stack never carries an id. A scrubber test seeds canary asset ids and dates through every path (NS-51-R28).
- Server: `moment-email` logs through the typed logger with counts and codes only (OBS-R01).
- Release gates use App Store Connect and Xcode Organizer crash rates, not our own telemetry (OBS-R11).
- Alerts: none for the tab itself. A scan failure is a quiet local state, not a page.

### MT-X3-R24 Canary
- Given canary asset ids, a canary day and a canary album name fed through scan, index, thumbnail, notification and error paths, Then zero hits in device diagnostics, breadcrumbs, crash payloads, analytics and URLs (OBS-R10; NS-51-R28).
- Layer: unit, device.

### MT-X3-R25 No counts in any output
- Given the tab, the nudge and the email, Then no string, analytics field, log field or accessibility label contains a count of pictures, moments, days or letters, a gap word, "again", "still", "don't forget", a streak, a point or a badge.
- Layer: content (`packages/content/test/rules.test.ts` extension), scan.

## 18. What stays off the server

Never leaves the phone, in any phase, by any route: asset ids, dates of pictures, thumbnails, durations, the index, the decisions file, the notification map, whether the feature is on, the access state, the limited selection, and the typed days. The only things that cross to a server are what already do: the child's date of birth, letters, plan state, the email address and the new email preference (if built). A request fake sees zero requests from the whole Moments path (NS-51-R26).

One place to be careful: a place name on a map tile would send coordinates to Apple (privacy doc section 4, A6: reverse geocoding uses a network service). Not built (Q-PM-5, CL-050). A parent-typed place on the letter is the only place word.

### MT-X3-R26 Zero requests
- Given turn on, scan, tab, compose, nudge planning and off, Then a network fake sees 0 requests from these paths and no URL carries an id.
- Layer: unit (NS-51-R26 pattern), device.

## 19. Constitution, privacy and accessibility checks

Constitution: no machine title, caption, summary, place, person or scene (MT-X3-R2 makes the type refuse them); Apple's titles from a Route A pick are shown only as Apple's and never stored or reshown (NS-49-R9); no face matching, no People data (NS-51-R33); nothing implies a machine writes anything; the child is never gendered, copy uses `{child}`; no counts, streaks, points or badges (MT-X3-R25); the daily return reason is love and time, not pressure (section 20).

Privacy: data classes: the index, decisions and notification map are L4 (derived from a child's pictures; asset ids are L4); the data-map row ships in the PR that builds the file (DATA-REQ-001); the classification row is founder-merged. The App Privacy label stays "Photos or Videos: not collected" only while MT-X3-R26 holds (A7, NS-51-R30); label and privacy text change in the same build. Consent: the intro and the Me row are things a person agrees to, so the PR carries Shown, Records, Never and Decline lines (PRIV-R21, COORDINATION section 10):
- Shown: one plain sentence of what is read (dates of your pictures, on this phone only) and what is never read; Apple's own sheet.
- Records: a local on or off, the file in this phone's app storage, nothing on our servers.
- Never: faces, people, places, what a picture shows, any upload, any count.
- Decline: "Not now" is comfortable; the tab still shows real things; no second ask.

Accessibility: every row 44 pt or more; VoiceOver says "Picture 1 of 5", never what a picture shows; thumbnails set `accessibilityIgnoresInvertColors`; no motion needed; Reduce Motion, Reduce Transparency and Increase Contrast honoured; glass only on the tab bar and controls, content stays paper, solid fallback (DESIGN-LANGUAGE-V2); layout holds at AX5 on iPhone SE 3; the tab label does not scale with Dynamic Type and uses the Large Content Viewer, as the existing tabs do (NS-51-R34, NX-30a-R4).

## 20. The daily reason to come back (architecture's contribution)

Without streaks, counts or guilt, the tab can change every day from facts, so there is always one true thing that was not there yesterday. The engine's `selectForYou(ctx, dayKey)` builds one lead card from the first that applies, in this order, then up to two quiet cards:
1. A day the parent typed (via the days module's opaque slot).
2. Birthday, or a month-age day, from the date of birth.
3. A year ago from our own letters, if a letter exists for this date last year.
4. New pictures on the phone (phase 2), shown as a day row, never as "waiting".
5. One of the 111 prompts, chosen from the day (`packages/core/src/prompts.ts` selection), the same all day, with a plain shuffle for the parent who wants another.
After a letter is made today, the lead card shows a calm "that is kept" state rather than an empty tab, and the next day starts fresh. There is no counter, no gap and no streak anywhere in the state. The same `occasionsOn` is what the push planner and the email job use for dates, so one fact (a month-age day) shows in the tab, may become a local note and may become an email, from one function.

### MT-X3-R27 Never empty
- Given any access state and any account with a date of birth, When the tab opens on any day, Then it shows at least one lead card from the list above; given a brand new account with no letters, the prompt card is the lead.
- Layer: unit, e2e.

## 21. ADR draft (number TBD)

Next free number on this read of `docs/adr`: after 0038. PRs open today may take it, so the integrator assigns it with `node scripts/agents/next-id.mjs`.

```
# ADR 00NN: A Moments tab, one pure moment engine, and an on-device library reader

- Status: PROPOSED, 21 Nov 2026. Docs only. Two-way until phase 2 ships.
- Author: architecture lead for the Moments work. Reviewers asked: principal-architect, mobile,
  data-architect, privacy, security-architect, qa, design-systems.
- Amends: ADR 0030 (one ranked source), ADR 0032 (adds the decisions section to the moments file).
  Does not supersede ADR 0028 or 0033.

## Context
- The founder wants a Moments tab (position open) that is the daily reason to return and informs
  in-app cards, local push and email.
- Library data must stay on the phone; the server holds only the child's date of birth and letters.
- Card 27 (NS-51) designs a library read but no tab; BL-1305 forbids PhotoKit in 1.x builds.

## Options
A. Route A only (Apple's suggestions picker): no permission, no control of the experience, cannot feed
   Recent, push or email.
B. Route B (our PhotoKit date read, limited honoured) plus the picker door: our layout, daily change,
   optional local nudge; needs counsel, a usage string and a spike.
C. No library at all (system picker only): safest, ships now, weaker daily pull.
D. B for the engine, C first as phase 1, A as an optional door.

## Decision (proposed)
1. D: ship phase 1 with no library; phase 2 behind a flag adds Route B; phase 3 optional.
2. One pure engine in packages/core/src/moments, three callers with different inputs.
3. One native module, scribe-library, with the five-function contract; no third native module.
4. One moments file outside scribe.db (ADR 0032): index, decisions, notification map.
5. Tab in position 2 of 4; Home remains the cold-launch tab; capture only through startCapture.
6. Push from library data is a separate, default-off switch and needs the founder's ML-3 reversal.
7. Email uses date of birth and letters only; never library or typed days.

## Consequences
- tab-bar.test.ts and IA-FINAL change in the same PR as the tab.
- Reversals in section 15 need founder sign-off before phase 2.
- A new Edge Function and a preference column need red-team review and approve-migration (D-041).
- Rollback is hide-now by kill switch, remove-later by build.
```

## 22. Edge and unhappy paths (index)

Covered above: module absent, denied, limited, iCloud-only, corrupt file, restore, account switch, lock and switcher, time zone and DST, kill switch, double tap. Additional ones:
- Child's date of birth missing (expecting-only book): For you shows prompts only; no month-age or birthday card; no moment nudge (NS-51-R41).
- Two books: occasions are per book; moments belong to the phone, not a book; the compose button asks which book only through the existing capture rules (no new picker in this doc).
- Hidden or quiet book: no moment nudge, no email (NS-51-R41; E16).
- Parent with a huge burst day (hundreds of pictures): the day shows up to 4 thumbnails and at most 6 ids are kept; the picker sheet loads the rest by scan, windowed.
- Video only day: a cluster with lengths, no analysis of its sound or content (Q-PM-4).
- Library pictures of another person or child: no different from level 1 (NS-51-R37).
- Offline: everything on the phone works; email is not involved.
- Update mid-flow: the index is a cache; the engine version is stored; a version change rebuilds (like `ENGINE_VERSION`, CODE-R05 spirit, but for moments, a separate constant, never the cleaning engine's).

## 23. Open questions, with my recommended default and a deadline

1. Tab position. Default: second of four, Home stays default. Decide by: before the design lead's frames are final (founder, with IA).
2. Is the Moments tab shipped in phase 1 without any library? Default: yes. Decide by: when the build 13 scope closes (founder).
3. May the lock-screen note say anything about pictures (the founder's "Some pictures from the weekend are here")? Default: no; in-app only (Q-PM-9). Decide by: before 11b is built (founder, with counsel).
4. May `scanDates` return video duration? Default: yes, display only (MT-X3-R8). Decide by: spike start (`privacy`, product).
5. Build 11b (library-driven local push) at all? Default: no, build 11a first and measure whether the tab brings people back. Decide by: after phase 2 device rows (founder).
6. Email: build now or later? Default: later, dark, birthday and month-age only, after the preference migration and counsel's read. Decide by: before any `supabase/**` work starts (founder, `data-architect`).
7. Route A entitlement: does Apple approve it in review, and is it worth the door? Default: not in phase 1 or 2; revisit after feasibility. Decide by: phase 3 planning (`mobile`, counsel).
8. Index size for Recent: confirm 30 stored plus in-memory paging. Default: as written. Decide by: the spike (`mobile`).
9. ML numbering: confirm which text "ML-6" and "ML-3" are in the repo. Default: ML-3 is the no-library-notification rule as the brief states; ML-6 maps to NX-39-R16. Decide by: next product doc sweep (`product`).
10. Which list component renders Recent; does it need a new dependency? Default: reuse what the Book uses. Decide by: first UI PR (`mobile`, CODE-R17).

## 24. Dependencies

- Design: tab bar position and glyph, day-row and collage frames, Reduce Transparency fallbacks (design leads; DESIGN-LANGUAGE-V2).
- Content: the tab word and its single verb, the intro, neutral push and email strings (J1 to J10; `content`).
- Privacy and legal: consent lines, label, 5.1.1 read, data-map row, email consent and unsubscribe; docs/legal is founder-merged.
- Data-architect: the email preference column and any send-key table (hand-off; I write no migration).
- Mobile: the module, the hook, the planner hook (`budget.ts`, `planner.ts`), `startCapture` source, tab layout and test edits.
- QA: seams in section 8, canary, device rows; GitHub workflow changes need the founder.
- Red-team: independent review of `supabase/functions/moment-email` and any migration (D-041).
- Existing work this builds on: `scribe-photo` (picker), `entry_media` (ADR 0028), `budget.ts` (ADR 0030, #1088 and #1089), the days store (ADR 0032, #1175), NS-51 and NS-52 (card 27), PR #1267 (privacy read).

## 25. What is VERIFIED, UNVERIFIED, and a guess

VERIFIED (read this session, path):
- The tab layout, the three-tab pin, JS tabs import, the Large Content Viewer button (`apps/mobile/src/app/(tabs)/_layout.tsx`, `apps/mobile/test/tab-bar.test.ts`).
- The closed capture source list and the one-entry rule (`apps/mobile/src/lib/capture/start-capture.logic.ts`).
- `scribe-photo` is a picker with no library read (`apps/mobile/modules/scribe-photo/index.ts`).
- Production forbids a usage string, PhotoKit, the journaling entitlement (`apps/mobile/test/g6-production-flags-off.test.ts:4, 61, 116 to 124`).
- Kill switch reader (`apps/mobile/src/lib/capabilities.ts:258-268`); root `initialRouteName` (`apps/mobile/src/app/_layout.tsx:51`).
- ADRs 0030, 0032, 0033, 0028 (heads read), 0036 (head read); 17b line 49 on module naming; card 27 NS-51 rows R1 to R42 and Q-PM table (headings and rows quoted above).
- Email templates are billing and welcome only (`packages/emails/src/templates`); `packages/core/src` has no moment code (directory listing).
- No open PR or branch for the feasibility doc and the design concept when I looked (`gh api` pulls list and `git ls-remote`, 21 Nov).

VERIFIED by `privacy` this session, not re-read by me: Apple sources A1 to A9 in PR #1267 (journaling suggestions framework and entitlement, PhotoKit limited access and usage string, App Privacy collect definition, geocoder network use, App Review 5.1.1).

UNVERIFIED:
- Every PhotoKit performance claim and every number for scan time, thumbnail cost and memory (my fetch of the PhotoKit options page returned only its summary).
- That a thumbnail request with network off yields a local image for optimised-storage items (NS-51-R21 also marks this).
- Whether Apple reviews the journaling entitlement; whether Route A needs a plist string.
- The exact hide-tab option of the installed `expo-router/js-tabs`.
- Whether the Book's list component suits Recent.
- That the founder's screenshots show Apple's system sheet (brief marks it so).
- How a hosted `children` row exposes dob to an Edge Function (assumed from ADR 0035 and the sync design; the data architect confirms).
- Whether an engagement email is permitted for this audience (counsel).

GUESS (mine, to be tested): the position recommendation; that phase 1 alone is enough pull; that a foreground-only library nudge is weak; the single-file layout for index and decisions; `MomentsLog` shape.

## 26. What I did not do

I wrote no code, no migration, no workflow and no other doc. I did not open a PR. I did not read the feasibility doc or the design concept (not found), the `wip/moments-d5` branch, the founder's screenshots, `docs/legal/**`, or the installed `expo-router` source. I measured nothing.
