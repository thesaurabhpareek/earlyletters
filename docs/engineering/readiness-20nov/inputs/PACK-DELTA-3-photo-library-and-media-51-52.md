# Pack delta 3: founder round 2, photo library moments (NS-51) and pictures and videos with a letter (NS-52)

Status: v1, 20 Nov 2026, `principal-architect`, RD-A. Part of `PACK-DELTA.md`. This is the largest change for engineering. Sources: `26-founder-direction-photos-library-and-media.md` (`f8eead01`, 47 lines), `27-photo-moments-and-media.md` (`bf195d36`, 483 lines; NS-51 at `27:68`, NS-52 at `27:271`), GAP-LOG RV-18 to RV-24 (`GAP-LOG.md:493-501`), `24-engineering-handoff.md` sections 1.13 and 1.14 (written before card 27 existed: `24:11`, `24:107`, `24:125`), function addenda (see `PACK-DELTA-5`). All on branch `docs/locked-pack-inputs-20nov`, not merged, not in #846. [V] verified, [E] estimate, [U] not verified.

## 1. What the founder changed

Three locked positions are reversed (`26:11-15`, RV-18 to RV-20 [V]):

| Locked position | Where it is written | Now |
|---|---|---|
| Level 3, reading the Photos library, is closed in 1.x | `20-founder-direction-20nov.md` 6.1; NS-49 not-in-scope; NS-49-R25 and R26; NS-01 never-line; frame section 7 | NS-51, flag off, drop C, spike first |
| No video | NS-01-R22; OPP-16 "not recommended" (`functions/feature-opportunities.md:107`) | NS-52 |
| One picture per letter | NS-01-R21a, sections 3 and 4; ADR 0028 D1 | Up to 6 pictures and 2 videos per letter (proposed defaults, Q-PM-2) |

What does not change (`26:17-24`): the machine adds no meaning (no caption, title or summary from a picture), nothing leaves the phone except by the parent's own act under X2 and E23, library analysis is on the phone only, no face or person matching, Asha only, nothing counts or scolds. Both cards are drop C: after 1.0 is approved, spike first (Q-PM-7, `22:63`).

## 2. NS-51 Photo moments (42 row ids, 27 P0)

Engineering shape from the card's section 10 (`27:197-203`) and the rows:
- One native module `apps/mobile/modules/scribe-photo-library` (card name, PROPOSED). Handoff 24 proposes `modules/scribe-library` (`24:117`): two names for one module; pick at design time (Rec: the card's, since cards win). Rows: NS-51-R29 puts every PhotoKit call in this one module and fails the scan elsewhere; `scribe-photo` keeps its "no PhotoKit authorisation" scan true (`24:114`).
- Reads only creation date and a system identifier (NS-51-R5; Q-PM-5, Q-PM-6 defaults: no place, no analysis). A moment is a local day with at least 5 pictures, or 4 within 3 hours, or 1 on a birthday, month-age day or a day the parent marked (R7, numbers ASSUMED). The rule is a pure function in `packages/core`, which fits CODE-R10 and `24:120`; FR-AIS-58 asks that it be deterministic with an injected clock and zone (`functions/ai-and-speech.md:343` [V]).
- Index: at most 30 moments, at most 6 identifiers each, L4, per account (R6), excluded from the iPhone backup with read back (R23). Conflict inside the card: R6 says "in the phone database" while R6 and R23 say excluded from the backup. A table inside `scribe.db` is in the backup with the file [E: one SQLite file is backed up as a whole]. Handoff 24 recommends a separate SQLite file in Application Support (`24:119`, ADR B). Send to product as a card-internal contradiction.
- Nudge: a ranked source inside the existing `evening` class below `monthAge` (R11, RV-24), planned only at foreground (no background mode, Q-PM-8), neutral words only (Q-PM-9). Needs the budget chooser (`budget.ts`) from delta 2. Handoff 24 asks whether a moment is also a slip rank (Q-E11); the card says no new Home element (R40).
- Access: the first PhotoKit call is `requestAuthorization(for: .readWrite)` or the narrowest read level the SDK offers (UNVERIFIED which; FR-PHS-58, `photos-and-suggestions.md:302`); limited access is first-class (R3, R18); the automatic limited-library prompt is suppressed by an Info.plist key whose name is UNVERIFIED (R4); `NSPhotoLibraryUsageDescription` exists only in builds where the flag is on (R2), new string for `content` and counsel, injected in `app.config.ts`; the privacy manifest function `privacyManifest(capabilityFlags())` gains entries (UNVERIFIED which, `24:118`).
- Today: nothing built. `apps/mobile/package.json` has no media-library or image-picker dependency [V: grep of develop package.json for `expo-media-library`, `expo-image-picker` found none]; `docs/legal/app-store-privacy-labels.md:117` records Photos as "Not used" (`24:111`).

### What NS-51 breaks in locked rules (to product, `27:"Changes to locked cards"`)
NS-49-R6 and R25 (no PhotoKit, no photo-library usage string, no background mode in 1.x), NS-01-R22 and the NS-01 never-line, `00-product-frame.md` section 7, NS-32 section 3 and R5, NS-35-R5 (closed start-source list gains `moment`), 22 section 4 (`22:80`). Each source scan is rewritten, not deleted (AIE-R14, AIE-R15; `24:112`). The reversal needs a recorded ruling first (RV-18); until then the cards cannot be built to (`24:112`).

### Design impact of NS-51
| Our file | Impact | Verdict |
|---|---|---|
| `security.md` 3.1 (source scans for NS-01), cross-cutting controls | New allow-list scan for one module; thumbnails never outside `Caches`; blank snapshot for moment cards (FR-SEC-33) | AMEND |
| `privacy.md` 3 (label), 4 (inventory) | New L4 store; label rows per variant (FR-PRV-36); purpose string (FR-PRV-37) | AMEND |
| `architecture.md` AB-7 "derived data never synced, rebuilt from `entries` and `entry_media`" (`architecture.md:72`) | The moment index is derived from the library, not from our rows; "rebuilt" is true, "from entries" is not | AMEND |
| `11-foundations.md` section 2 NS-32 | `photoMoment` ranked source (no new class) | AMEND (same as delta 2) |
| `data-and-sync.md` | No server change for Variant A | HOLDS |

Size L (native module, new store, permission string, label, counsel, spike) [E]. Wave 5, after BL-961 (hard dependency, `24:114`; BL-045 depends on BL-931, BL-961, BL-985, `BACKLOG.md` block BL-045 [V]). Gates: reversal ruling, counsel (App Review 5.1.1, label, Q43, Q45, Q54), F (Q-PM-1, 7, 9), D (device with a 20,000 item library, limited library, iCloud-only item, revoked access).

## 3. NS-52 Pictures and videos with a letter (44 row ids, 26 P0)

### 3.1 What the card asks (rows)
- Limits in one constants file: 6 pictures and 2 videos, video at most 60 s and 100 MB stored (R1; defaults, founder confirms, Q-PM-2). The system picker, multi-select, photos and videos, is the only direct source (R2). Each picture goes through the NS-01 pipeline (strip, 4,032 px, upright JPEG, `Application Support/photos`; R4). A video is copied into `Caches`, validated by bytes, re-encoded to at most 1080p with every metadata atom removed (the API is UNVERIFIED), stored under `Application Support/media/`, temp copy deleted; "0 of 10 fixture videos carry a location or device tag" (R5). Sound is never read (R6, Q-PM-4). Corrupt, truncated, symlinked or oversized files are refused with `video_unreadable` (R8). iCloud-only originals wait with progress and Cancel (R9). Free space below 2x the video plus a margin: copy never starts (R10, `no_space`).
- Reading: poster frame, play control 44 pt, no autoplay, plays on a tap, pauses on inactive, keep-awake released on pause (R13); reorder by drag and by "Move earlier" and "Move later" (R14); blank snapshot with or without App lock (R30); Photos lens shows pictures and a poster with a play glyph (R41); Find never searches media content (R41).
- Rights: delete, Let it go, Erase, restore follow the letter (R15, R16); Save a copy streams every item to disk with a size line (R17); export carries every item in the next free minor (R18, E5); Me, Storage shows a size and a Remove control per letter's media, no list by size, no count (R31); Share picture stays at most one picture, never video, needs X2 reads (R37).
- Sync: Variant A (default) none, `entries.photo_path` stays null, label stays "not collected" (R19, NS-01-R15 extended). Variant B only with Q-PM-3 yes: resumable queue (R20), encryption at rest and signed URLs bound to a book member (R21), purge ledger (R22), label becomes "Photos or Videos collected" (R23), strip on upload and byte cap (R24), co-parent rules (R25).
- Flags: `EXPO_PUBLIC_PHOTOS` and `killSwitches.photos` gate pictures as today, `EXPO_PUBLIC_VIDEO` and `killSwitches.videos` (PROPOSED) gate video (R42). Handoff 24 recommends separate keys `media` and `EXPO_PUBLIC_MEDIA_SYNC` for variant B (`24:153`, `:159`); different names again.

### 3.2 Effect on the locked cards and our designs, one by one

| Item | Today (source) | What NS-52 does | Verdict |
|---|---|---|---|
| NS-01-R15, R22, R21a, R32; "one picture per letter" | One picture, no video, no multi-select (`27:"Changes to locked cards"`) | R15 holds for Variant A and is replaced for media only under B; R22 narrows to "the system picker is the only source"; R21a limits become NS-52's | CONFLICT WITH LOCKED PACK (listed by product itself; not yet applied in #846) |
| NS-36 (R1a to R1d delete, restore, purge; R2 export; R4 classes; R5 minors; R7) | `11-foundations.md` section 6 (`:179`) and `data-and-sync.md` 3.1 cover one picture per letter | Every rule applies per item; video adds purge and sweep of `Application Support/media/`; a new class row for `duration_ms`, `poster_path`, `order` (L2 by rule 5; X10 still open, `privacy.md:259`) | AMEND 11 section 6, DATA 3.1, PRIV 4.1 |
| NS-37 (Book stays fast; copies) | One stored copy, one 512 px list copy, lens at 72 pt in a plain ScrollView (`11-foundations.md:230-235`); 40-row window of 512 px copies about 32 MB decoded (`:244`, Assumption) | Several pictures per letter and poster frames multiply copies; FR-REL-66: Book with 1,000 letters, 300 pictures and 100 videos on an SE 3, memory under 150 MB (PROPOSED in NS-37), no frame over 16.7 ms (`reliability.md:332`) | AMEND 11 section 7 (NS-37) |
| ADR 0028 D1 `entry_media` | Migration 11, `CHECK (kind = 'photo')`, `CHECK (ext = 'jpg')`, unique index `entry_media_one_photo_idx` (`0028:37, 38, 48`). The ADR says the one-photo rule is "the unique index, not the table shape ... drops that one index in its own migration (no table rebuild)" (`0028:56`) | The index drop is cheap, but `kind` gains 'video' and `ext` gains video containers: a CHECK change on SQLite is a table rebuild [E: SQLite cannot alter a CHECK in place]. Handoff 24 therefore asks to amend migration 11 in #835 before it merges (Q-E12, `24:129`); card 27 says a local migration 12 (`27:"Data and engineering"` NS-52, RV-20). The two disagree | AMEND ADR 0028 and `data-and-sync.md` L11 (`data-and-sync.md:39`); decide before #835 merges (`39cf30d3` open) |
| ADR 0028 D2, export 1.7.0 | `ExportEntry.photo: ExportPhoto \| null`, JSON schema `oneOf [null, object]`, `additionalProperties: false` (`0028:68-76`); our `11-foundations.md:267-269` builds exactly that | A letter with several items cannot fit one `photo` object. Needs a later additive minor and a decision whether `photo` stays as the first item; E5 allocates minors in merge order; ADR 0038 proposal is the named place (`24:131`) | AMEND 11 section 8.3, DATA 2.5 (`data-and-sync.md:79`) |
| ADR 0028 D5 erase and `eraseDeviceFiles` | Erase deletes files under `Library/Application Support/photos` by listing the folder (`0028:188-190`) | Add `Application Support/media/` (and poster frames) to the erase list, the sweep, and the FR-PRV-34 scan | AMEND |
| Storage budget | NS-34 rows: download under 40 MB, caches 50 MB or less (`11-foundations.md:158`); Me, Storage is a size line | A letter at the limits is about 6 pictures at 2 to 4 MB plus 2 videos up to 100 MB (ASSUMED in the card) so up to about 224 MB per letter [E: 6 x 4 + 2 x 100]; the iPhone backup grows by the same; low-storage ladder FR-REL-67; transcode scratch up to 2x the video (PROPOSED) | NEW BUDGETS NEEDED (no design) |
| X2 note (`00-product-frame.md:90`, E23) | A child's voice or picture leaving the phone needs a security read and a counsel read; E23 adds NS-05 Level 1 and NS-03 Arm W (`18:E23`); our `security.md` 3.5 (`:151`) and `privacy.md` 1.1 (`:46`) | Variant A: nothing leaves except Save a copy or share by the parent's own tap (still X2 for a share of a picture). Variant B: every upload is X2, plus a label change, counsel on a child's video (Q54), a threat model before code (PRINCIPLES 16), red-team review of `supabase/**` (D-041), BL-961 green | AMEND SEC 3.5 and PRIV 1.1 |
| `docs/legal/app-store-privacy-labels.md:54` "Photos or Videos: No" | Label | Variant A: unchanged ("not collected", counsel confirms; S1 on-device data is not collected); Variant B: collected, linked to user | label per variant, FR-PRV-36 |
| BL-870 (server write-deny test for photos) | Closes the author insert and update policies on `entry-photos` (`0028` D6 `:196`) | Stays valid under Variant A; Variant B reverses it for a new bucket `entry-media` (`24:151`) | HOLDS (A) / reversed (B) |

### 3.3 What Variant B would need (new, nothing of it exists)
From `24:149-158` and the addenda: a server `entry_media` table (every column classed with `COMMENT ON COLUMN`, DB-R12; limit trigger enforced server-side; added to the content trigger tuple additively), a new private bucket (not `entry-photos`, which is 10 MiB, `image/jpeg`, `image/heic`, `image/png`, `20260930000000_scribe_core.sql:290-291`), policies from book membership (IAM-R02, IAM-R13), a signed-URL Edge Function (none exist: `grep createSignedUrl` over `apps`, `packages`, `supabase/functions` returns nothing, `24:153`), a blob queue with resume in the outbox (ADR 0025 has none), per-account byte quotas, purge through `storage_purge_queue`, and the Supabase Free plan limits (D-159; 50 MB global cap, Storage not in the nightly dump, `functions/privacy.md:305`, `functions/operations.md:240`). Supabase signed URLs "cannot be revoked individually" (`functions/risk-security.md:299, 306`). Recommended by the handoff and by the card default: build Variant A first (`24:159`, `27` Q-PM-3). Hard gates before any bytes leave: X2, counsel on a child's video, security threat model, red-team, label change, founder's money decision.

## 4. Sizes, order and what to do first

NS-52 Variant A: L, wave 5, after NS-01 on `testflight`, NS-11, NS-36 erase registry, BL-961 (`27:"Dependencies and gates"` NS-52 section 22). Rough PR count [E]: multi-select pick and limits file (1), video validate and transcode in `scribe-photo` plus metadata-stripped container test (2 to 3), `entry_media` change (1), reading view and poster (2), Save a copy, export minor, erase and sweep, Storage line (3), tests and fixtures (1). About 10 to 12 PRs at 400 lines.
Order that avoids rework [E, Rec]: (1) product ruling RV-18 to RV-20 recorded and card 27 text applied; (2) Karma rules Q-E12 before #835 merges; (3) native spike for transcode, metadata and iCloud video (card Q-PM open items); (4) NS-52 Variant A; (5) NS-51 spike, then module; (6) Variant B only after X2, counsel, threat model, red-team and the founder's money decision.

## 5. Conflicts and questions (to product unless stated)

1. NS-51-R6 "in the phone database" against "excluded from the iPhone backup" (R6, R23). To product.
2. Module and flag names differ between card 27 (`scribe-photo-library`, `EXPO_PUBLIC_PHOTO_MOMENTS`, `EXPO_PUBLIC_VIDEO`, `killSwitches.videos`) and handoff 24 (`scribe-library`, `killSwitches.media`, `EXPO_PUBLIC_MEDIA_SYNC`). Cards win; Karma to fix the handoff. To Karma.
3. Migration 11 amended before merge (handoff) or migration 12 (card). To Karma (Q-E12) with `data-architect`.
4. NS-01-R22, NS-49-R6, R25, R26 still read "closed" in the locked pack; 27 lists the edits but they are not applied. To product (errata PR).
5. Founder: Q-PM-1 to Q-PM-12 (`27` table). Defaults are design inputs only.
6. Counsel: a child's video leaving the phone (Q54), App Review 5.1.1 for a library permission, label wording, FR-LEG-23 child's picture and video, BIPA and similar (nothing built, so no read needed, NS-51-R33).
