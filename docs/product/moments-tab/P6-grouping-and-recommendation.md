> v2-era document; dispositions superseded by spec section 27 and 27b at PR #1314; kept as review history.

# Moments tab, P6: grouping and recommendation inside our rules

Status: PROPOSED (nothing here is decided, built, or in `DECISIONS.md`) | 21 Nov 2026 | Lead: product lead P6 | Docs only | Branch `wip/moments-p6`
Fictional family: Asha only (born 2025-04-12, per `packages/content/test/no-real-family-data.test.ts`). Words in quotes are intent for `content`, never final copy. The founder's screenshots are not copied here and no real name, place or business from them appears in this file.
Not legal advice. Every Apple or store reading that matters ends with "counsel must confirm".

## 0. The short answer

Founder ask (verbatim, 21 Nov): "Yes definitely meet all required rules but also think how we solve this without breaking rules... high quality product specs... beautifully crafted experience... grouping and moments recommendation like examples I shared."

How smart can grouping be, inside our rules? Smart in four ways, and blind in one on purpose.

| Rung | What it uses | Allowed | Example |
|---|---|---|---|
| 1. Facts | Capture time, media type, file-level flags the phone already holds | Yes | A day, a gap of hours, a video of 14 seconds, a burst of five frames |
| 2. The parent's own marks | A heart on a photo, an album the parent made and then chose, a label the parent typed, a day the parent kept close | Yes, when the parent made or chose it | "Pictures you hearted" |
| 3. Arithmetic on parent data | Date of birth, month-age days, birthdays, typed days, the date a year ago | Yes | "Pictures from the day {child} was born, one year on" |
| 4. Structure rules | Gap splits, burst collapse, even spread of tiles, seeded rotation | Yes, no content read | A collage that shows the shape of the day, not 30 shots of one minute |
| X. Meaning | Place, people, scene, mood, music, a machine title or caption, a guess that a run of days is a trip | No | "Afternoon at the park", "Birthday party", "Trip to the coast" |

Where that lands against Apple's picker (UNVERIFIED comparison; I have not seen the founder's screenshots as a spec and I have not run Apple's picker). Ours can match the structure of the picker: newest-first days, a collage per day, video marks, a compose button, a calm rhythm. It cannot match the titles, the place tiles, the names of people, the music and the mood cards, and it does not try. It can beat the picker on relevance to one baby book, because it knows the date of birth, the letters already written and the days the parent typed, and it fuses them with the pictures on a date match. That fusion is the "smart" the parent will feel. It never needs to be claimed.

Two things the founder may not expect:
1. Documents and receipts cannot be filtered out by a subtype. The media subtype list has no document value (section 5). Screenshots can be. For the rest the parent needs one tap, "Leave out this picture" (MT-P6-R42).
2. "Trip" grouping by contiguous days is acceptable under the constitution only as a plain date range, never named, and I recommend holding it until the card sort shows parents want it (section 6.4).

## 1. Purpose and scope

In scope: which signals may group and recommend pictures and days; which may not; how a day collage picks its tiles; how days merge and split; occasion recommendation from parent data; ranking and de-duplication; how the tab feels smart without claiming it; how a parent teaches it; the test approach with a fixed Asha fixture; the quality bar for a five-parent card sort.

Out of scope: tab position (P1, D1), the permission journey (P3, D2), the capture hand-off (P4), rollout and metrics (P5), nudge channels (P2 section 8, X6), the visual design of the card (D3), data classification (X5), architecture (X3). Where this file needs a number or a rule from them, it cites the id and does not copy it.

## 2. Inputs read

Read this session in a plain clone of `develop` and on the named refs (paths relative to the repo root):

| Id | Source | Used for |
|---|---|---|
| I1 | The Moments brief (both UPDATE lines) | Brief of record; tab name Moments, approved by the founder 21 Nov |
| I2 | PR #1267, `docs/product/MOMENTS-TAB-PRIVACY-AND-CONSTITUTION-21nov.md` | Element table, Route A and B, CQ-1 to CQ-15 |
| I3 | PR #1269, `docs/product/MOMENTS-TAB-FEASIBILITY-21nov.md` | PhotoKit facts, limited access, thumbnails, performance spikes D1 to D6 |
| I4 | PR #1270, `docs/design/MOMENTS-TAB-CONCEPT-21nov.md` | Two-part feed, card anatomy |
| I5 | PR #1264, `docs/product/HOME-ENGAGEMENT-WHEEL-21nov.md` | Wheel order, tab states |
| I6 | `wip/moments-p1`, `p2`, `p3` | Tab job, sources S1 to S7, MT-P2-R1 to R41, value before permission |
| I7 | `wip/moments-d1`, `d3` | Card family; D3 collage rules 5.4, day groups 6.1, parent label 5.3, MT-D3-R1 to R25 |
| I8 | `wip/moments-x2`, `x3`, `x5`, `x6` | Policy, engine module layout and `Moment` type, data classes, occasion signal for nudges |
| I9 | `wip/moments-b1` (read for grouping facts only) | What other products do; resurfacing harm complaints |
| I10 | `docs/product/prd/27-photo-moments-and-media.md` at develop | NS-51-R5, R6, R7, R9, R10, R12, R14, R21, R33 |
| I11 | `packages/core/src/age.ts`, `prompts.ts` (names only) | `ageOn`, `isBeforeBirth`, `selectPrompt`, `GAP_DAYS`, `MIN_ALTERNATIVES` |
| I12 | `docs/agents/COORDINATION.md` section 10 | How requirements are written; Shown, Records, Never, Decline |
| I13 | Apple developer pages (list in section 5) | PhotoKit property and collection facts, fetched this session as markdown |

Not available to me: the founder's screenshots (not opened; the brief says they are not for the repo), `ML-1` to `ML-14` text beyond what the brief and the other leads quote, `docs/legal/**` beyond what X2 cites, and any real device. I ran no code.

## 3. Findings that change the design

F1. Apple has removed its own time-and-place groups from PhotoKit. The moments fetches (`fetchMoments`, `fetchMomentLists`) show availability "iOS 8.0.0 to 13.0.0" on their pages, and the description says Photos "creates moments to group assets by time and location". So there is no Apple grouping an app can borrow under our iOS 17.0 floor, and the one we could have borrowed is location based and forbidden anyway. Day and session grouping is ours to write, as a pure function (X3 `group.ts`). Apple-grade groups with titles exist only inside the Journaling Suggestions picker (Route A), where the app receives the one pick (I3, I2).

F2. Documents cannot be excluded by subtype. The `PHAssetMediaSubtype` list has panorama, HDR, screenshot, Live Photo, cinematic, streamed, high frame rate, time-lapse, depth effect, animation, spatial and screen recording. No document or receipt value. Screenshots and screen recordings can be dropped by flag. A day of 12 receipt photos will pass a count rule. The cost is one parent tap, once (set aside the day or leave out the picture). That tap must exist from day one, which makes teaching (section 6.8) a quality feature, not a nicety.

F3. The cheapest way to feel like Apple is not a smarter rule, it is the parent's own flags. `isFavorite` is verified as "whether the user marks the asset as a favorite" and is a supported predicate key. A heart is the parent's own judgment of what matters, so choosing tiles by hearts is not scoring a picture. It needs `NS-51-R5` to be amended, because R5 reads only creation date and identifier (X3 and X5 already add duration and media type). I propose one closed read set (MT-P6-R1) for `privacy` and `security-architect` to approve.

F4. A parent-named album is the only parent-written title the library holds. It can be shown verbatim, on two conditions: full access (the feasibility read of Apple's article says a limited library cannot fetch user albums) and the parent choosing the album in our own chooser, which is what makes it "typed or chosen by the parent" under the brief. Who authored an album's name is not stated on the pages I read (`albumRegular` is "an album created in the Photos app"), so the parent's act of choosing, not the album's existence, is what makes it theirs. This narrows `NS-51-R5` (never an album name) and `NS-51-R14` (names only in the choice sheet). It is a small reversal the founder owns (section 9, Q3).

F5. The collage rule already agreed by D3 (parent's picks first, then even spread by time) is right, and the concept's "earliest four" is wrong for a baby day, because the first four frames are usually one burst. I add two content-blind inputs the parent owns (hearts, bursts) and fix a deterministic fallback order (MT-P6-R14 to R18).

F6. Recent cannot be both "every day with a picture" (D3 6.1) and "days the moment rule finds" (`NS-51-R7`, concept 5.2, P2 R17). I resolve it with tiers (MT-P6-R4): a day qualifies for Recent if it is busy, hearted, has a video, or is an occasion or kept-close day; a lone ordinary picture does not make a card. This is a decision D3 and P2 must accept or reject; both are listed in section 10.

F7. A repeating card with no new pictures is the real daily-return risk of this tab. Daily variety cannot come from stored tap history (`MT-X5-R4` forbids it) or from random numbers (`MT-X3-R12`). It comes from a seeded rotation over the eligible set, keyed on the local date (MT-P6-R31). With few eligible days the same card will repeat, and I say so (F6 in P2 is the same honest limit).

F8. "A year ago" can also come from pictures, by date arithmetic, with no stored index: fetch only the one calendar date in earlier years. That is the strongest Apple-like pull available inside our rules (MT-P6-R25). It also carries the resurfacing-harm risk that B1 records for other products, so it ships with a hard stop for quiet books and a permanent "Not this one" (section 7).

## 4. What the picker does, and what ours does in its place

Apple's feel comes from five things. Each has a rule-safe counterpart:

| What makes Apple's picker feel good | Our counterpart | Row |
|---|---|---|
| A title that says what the group is | The date as the card title, plus the parent's own label if one exists, plus a one-line reason from a closed list | R11, D3 5.2 and 5.3 |
| A collage that looks like the day | Up to four tiles by parent marks, then even spread by time | R14 to R18 |
| Groups that fit how a day went | Day as the unit, sessions (gaps in time) inside it for spreading and for the detail view | R5, R19 |
| Relevance | Fusion of pictures with the child's age, birthdays, typed days and letters on a date match | R23 to R27 |
| It is different each day | Seeded rotation over eligible days, plus new pictures | R31 |

What stays out: place tile, people names, music, mood, workouts, Apple's own titles. Route A can still be offered as a parent-started door (X3 section 5). Where it hands us a title, the brief wins over `NS-49-R9`: we do not store or show it (P2 R19 already takes this line).

## 5. PhotoKit signals: what I read, and what it allows

All rows are VERIFIED as what the Apple page says, fetched 21 Nov 2026 (`https://developer.apple.com/documentation/photos/<page>.md`). "Use" is my proposal.

| Property or API | What Apple says (short) | Use | Needs |
|---|---|---|---|
| `PHAsset.creationDate` | "The date and time of the asset's creation." Type is optional (`Date?`) | Day and session grouping | In `NS-51-R5` already. An asset with no date is excluded (R2) |
| `PHAsset.mediaType` | "The type of the asset, such as video or audio." | Photo or video | X5 adds it. Audio is not read |
| `PHAsset.mediaSubtypes` | "special kinds of assets, such as panoramic photo or high-frame-rate video"; an option set | Exclusions and tile eligibility (R2, R9) | New read, MT-P6-R1 |
| `photoScreenshot`, `videoScreenRecording`, `photoAnimation` | screenshot, screen recording, "photo animation such as a GIF" | Excluded from days and tiles | New read |
| `photoPanorama` | "large-format panorama photo" | Not a tile; allowed in detail | New read |
| `photoLive` | Live Photo with motion and sound | Treated as a still photo; no motion on the card | New read |
| `photoHDR`, `photoDepthEffect`, `videoCinematic`, `videoHighFrameRate`, `videoTimelapse`, `videoStreamed`, `spatialMedia` | camera or processing modes | HDR and depth effect ignored (depth effect hints at a person, so it is a forbidden signal). Video variants count as video | New read for the video ones |
| (absent) | No document or receipt subtype in the list | Cannot filter documents (F2) | Parent tap |
| `PHAsset.isFavorite` | "whether the user marks the asset as a favorite"; supported in a fetch predicate | Tile order, day qualifier, reason line (R7) | New read |
| `PHAsset.duration` | "duration, in seconds, of the video asset" | Video badge text | X3 adds it (MT-X3-R8) |
| `PHAsset.burstIdentifier` | "shared by photo assets from the same burst sequence" | Collapse a burst to one candidate (R6) | New read. Fallback with time only |
| `PHAsset.isHidden` and `PHFetchOptions.includeHiddenAssets` | Default `false`: "fetches exclude assets whose `isHidden` property is true" | Never set to true. Hidden pictures never appear (R2) | A scan test |
| `PHAsset.sourceType` and `includeAssetSourceTypes` | `typeUserLibrary`, `typeCloudShared` (iCloud Shared Album), `typeiTunesSynced` | Fetch user library only; shared-album pictures are other people's | Default of the fetch option not stated: UNVERIFIED, so set it explicitly |
| `PHAsset.location` | "location information for the asset" | Forbidden. Never read (Q-PM-5) | A scan test |
| `PHAsset.addedDate`, `hasAdjustments`, `rating`, `playbackStyle` | date added to the library; edited; star rating up to five; playback style | Considered, not used. `rating` is a parent mark but its OS floor is not on the page I read | Revisit after card sort |
| `PHAssetCollectionSubtype.albumRegular` | "An album created in the Photos app" | Parent chooses it in our chooser; name shown verbatim (R10) | Full access only |
| `albumCloudShared`, `albumSyncedEvent`, `albumImported`, `albumMyPhotoStream` | cloud and synced types | Not offered in the chooser | |
| Smart albums (`smartAlbumFavorites`, `smartAlbumSelfPortraits`, `smartAlbumVideos`, `smartAlbumBursts`, and others) | System-defined groups, titled by Apple | Titles never shown. Selfies and depth effect never used (person signal). Favourites only through `isFavorite` | |
| `PHAssetCollection.fetchMoments`, `PHCollectionList.fetchMomentLists` | Availability "iOS 8.0.0 to 13.0.0"; "group assets by time and location" | Not available to us and forbidden by the location rule | |
| `PHCollectionList.localizedLocationNames` | "names of locations grouped by the collection" | Forbidden | A scan test |
| `PHCollection.localizedTitle` | "The localized name of the collection." Does not say who wrote it | Only for an album the parent chose (R10). Never a smart album's | |
| `PHImageResultIsInCloudKey` | "If true, no image was provided, because the asset data must be downloaded from iCloud" | A tile with no local image falls to the next candidate or a plain box (R17) | |
| `PHFetchOptions` keys | Asset predicate keys include `creationDate`, `mediaType`, `mediaSubtypes`, `duration`, `isFavorite`, `isHidden`, `burstIdentifier`; also `fetchLimit` | A date-window fetch with a limit is supported | Bit-mask predicate on `mediaSubtypes` is UNVERIFIED; filter in Swift |
| Time zone per asset | I found no time zone property in the PHAsset list | Day boundaries use the phone's current zone (R3) | UNVERIFIED that none exists elsewhere |

Authorisation facts (limited library cannot fetch user albums; limited picker; usage string; ask on a tap) are read from the feasibility doc, which read Apple's "enhanced privacy" article. I did not re-fetch them.

## 6. Requirements

Test layers: U unit (pure function in `packages/core/src/moments`), G golden file, P property test, S source or binary scan, C content test, D device (iPhone SE 3, a script-made Asha library), E e2e, R research. Priority: P0 (a) a promise or the constitution, P0 (b) a legal or store duty, P1 the core loop, P2 polish. Rows cite requirements; they do not restate or change them.

Parameters (data in `rules.ts`, per `MT-X3-R11`; the spike or the card sort changes data, not code):

| Name | Meaning | Start value |
|---|---|---|
| `WINDOW_DAYS` | How far back Recent looks | 90, ASSUMED in `NS-51-R7` |
| `BUSY_DAY` | Pictures that make a day busy | 5, ASSUMED in `NS-51-R7` |
| `BUSY_HOURS` | Pictures within a span that make hours busy | 4 within 3 hours, ASSUMED in `NS-51-R7` |
| `SESSION_GAP` | A gap that starts a new session inside a day | Same 3 hours, ASSUMED; the spike and card sort fix it |
| `TILES` | Tiles on a card | 4 (D3 5.4) |
| `CANDIDATES` | Ordered candidates tried per tile slot before a plain box | No value proposed; set by the device spike on thumbnail cost |
| `RECENT_CAP` | Days Recent shows | P3 proposes 14; P2 says one screen; no value of mine |
| `MAX_RUN` | Longest run of days merged | No value; set by the card sort, and only if runs ship |
| `ROTATE_K` | Size of the eligible set the seeded rotation draws from | No value; set by the card sort |

### 6.1 Allowed grouping signals

| Id | Given, When, Then | Layer | Pri |
|---|---|---|---|
| MT-P6-R1 | Given the library module, When it scans, Then it reads only this closed set per asset: local identifier, creation date, media type, duration (videos), the subtype flags for screenshot, screen recording, animation, panorama, Live Photo, and the video variants, `isFavorite`, and `burstIdentifier`; no other `PHAsset` property is read, and a scan fails the build on any other property name in the module. The set is `READ_SET_V1`, one list in `packages/core`, reviewed by `privacy` and `security-architect` | S, U | P0 (a) |
| MT-P6-R2 | Given the scan, Then these are excluded before grouping and leave no trace in any output: assets with no creation date, hidden assets (the fetch never sets `includeHiddenAssets`), screenshots, screen recordings, animations, assets whose source is not the user library, and pictures the parent left out (R42) | U, S | P0 (a) |
| MT-P6-R3 | Given an asset and the phone's zone, When it is placed in a day, Then the day is the local calendar day in the phone's current zone via `offsetAt(ms)` (a parameter, no `Intl` in core); a late night that crosses midnight is two days; the ambiguous hour on a clock-change day is one day | U, G | P0 (a) |
| MT-P6-R4 | Given a local day inside `WINDOW_DAYS`, Then it qualifies for Recent if any one holds: it has `BUSY_DAY` pictures; it has `BUSY_HOURS` pictures; it holds a hearted picture; it holds a video; it is an occasion day (R23, R24); it is a day the parent kept close (R41). A lone ordinary picture does not qualify. Counting excludes everything R2 excludes | U, G | P0 (a) |
| MT-P6-R5 | Given a qualifying day, Then its pictures are split into sessions by gaps longer than `SESSION_GAP`; sessions are used for tile spreading (R15) and for time headings in the detail view as plain clock times, and are never shown on the card, never named, never counted | U, G | P1 |
| MT-P6-R6 | Given pictures sharing a `burstIdentifier`, Then they count as one candidate for tiles and for the busy rules, represented by the earliest frame unless the parent hearted another; the detail view lists all frames. Given the identifier is not approved for the read set, Then frames within a few seconds of the previous candidate collapse by time alone (the gap in seconds is set by the spike) | U, G | P1 |
| MT-P6-R7 | Given a hearted picture, Then it makes its day qualify, is the first candidate for a tile, and gives the day the reason "Pictures you hearted" only when no stronger reason applies (R11). Nothing else is read from the heart: no count of hearts on the card | U, G | P1 |
| MT-P6-R8 | Given a video, Then its day qualifies, it is a tile candidate (at most one video tile per card), it shows its length as text and a play glyph (D3 5.5), the poster frame is the one the system supplies, and no frame is chosen or analysed | U, D | P1 |
| MT-P6-R9 | Given a Live Photo, panorama, HDR, depth-effect or high-frame-rate item, Then Live, HDR, depth effect and high frame rate change nothing in grouping or tiles; a panorama is never a tile but is listed in detail; no motion plays on a card | U | P2 |
| MT-P6-R10 | Given full access and Me > Photos > Albums, When the parent chooses an album in our chooser, Then its identifier (not its name) is stored (`NS-51-R14`), and the card for any day in which that album supplies the tiles shows the album's title exactly as it is, unedited and unshortened, with the reason "From an album you chose". Given limited access, an album shared by others, a synced or imported album, or a smart album, Then none is offered and none is shown | U, E, D | P1 |
| MT-P6-R11 | Given any card, Then it carries exactly one reason line from the closed list in section 6.1a, the strongest by the precedence there; a reason not in the list fails the build; no reason names what a picture shows | C, U | P0 (a) |

#### 6.1a The closed reason list (intent for `content`, in parent words)

Reasons are facts the parent can check in five seconds. None says the app found, chose or suggested anything.

| Reason id | Intent words | Shown when |
|---|---|---|
| RSN-MARKED | "A day you marked" | The date is a typed day or a ticked Day (P2 S1, S2) |
| RSN-BIRTHDAY | "From {child}'s birthday" | The local date is the child's birthday, in any year |
| RSN-MONTHDAY | "From a month day for {child}" | The date is the same day of a month as the date of birth. The card does not say the number of months (see Q6) |
| RSN-KEPT | "A day you kept close" | The parent kept it close (R41) |
| RSN-HEART | "Pictures you hearted" | The day holds a hearted picture |
| RSN-ALBUM | "From an album you chose" | R10 |
| RSN-VIDEO | "A video from this day" | The day holds a video and nothing stronger applies |
| RSN-DAY | "Pictures from this day" | A busy day or busy hours |
| RSN-YEAR | "Pictures from this day in {year}" | R25. The year is a date, not a count |
| RSN-RUN | "Pictures from these days" | R20 (only if runs ship) |
| RSN-PICKED | "Pictures you picked before" | P2 S5 |
| RSN-LETTER | "A letter from this day" | P2 S4 |
| RSN-QUESTION | "A question to start from" | P2 S6 |

Precedence when several apply to one date: marked, birthday, month day, kept, album, heart, video, day. The losing reasons are not shown, and nothing says "and more".

### 6.2 Forbidden signals, and why

| Id | Given, When, Then | Layer | Pri |
|---|---|---|---|
| MT-P6-R12 | Given the Moments code and the library module, Then no code reads or imports any of the signals in the table below; a scan fails on each name or on any `Vision`, `CoreML`, `CLGeocoder`, `MapKit`, `MediaPlayer` or `PHPerson` symbol under `lib/moments`, `modules/scribe-library` and `packages/core/src/moments`; and no reason, label or string in the build names any of them | S, C | P0 (a) |

| Forbidden signal | Why |
|---|---|
| `PHAsset.location`, `localizedLocationNames`, reverse geocoding, a map tile, a city key, a time zone guess from a place | A place is words the machine adds (constitution); a lookup may send coordinates to Apple (UNVERIFIED; I2 section 5); Q-PM-5 closed |
| Faces, people albums, Apple's People data, contact photos, `smartAlbumSelfPortraits`, `photoDepthEffect` as a person hint | No face matching, no person guess (`NS-51-R33`). A camera mode that implies a person is a person guess |
| Scene, object, pet, food or document classification, image embeddings, "best photo" scores, sharpness or smile scores | Analysing a picture is reading it; the constitution says the machine removes and repairs, never adds meaning (`CLAUDE.md`) |
| Machine captions, titles, subtitles, Apple's suggestion `title`, any model output | Never stored or shown by us (brief). `NS-51-R10` |
| Music, podcasts, workouts, State of Mind, reflection items from Apple | Not about the child; a health-adjacent category and a new permission (I2 section 4) |
| Filenames, EXIF text, captions in metadata, keywords | Free text we did not write and cannot vouch for |
| Apple's moments APIs and smart-album names as labels | Unavailable past iOS 13 and location based (F1); smart-album titles are Apple's words |
| Travel inferred from a change of zone, a gap in the library, a burst of new days, or a distance | It is a place or meaning guess by another route |
| What the parent dismissed, scrolled past or tapped, used to learn a taste | Behavioural profile; `MT-X5-R4`. Only explicit teaching counts (R39) |

### 6.3 A day collage picks its tiles by rule

Inputs to the choice are capture time, the burst identifier, the heart and the parent's own earlier picks. Nothing else. This extends D3 5.4 (cited, not changed) and rejects the concept's "earliest four".

| Id | Given, When, Then | Layer | Pri |
|---|---|---|---|
| MT-P6-R13 | Reserved (no requirement; keeps ids aligned with the tile rows) | none | none |
| MT-P6-R14 | Given a day, Then the tile candidates are its photos and videos after R2 and R6, with panoramas removed, in this order of precedence: (1) pictures the parent already attached to a letter for this day (D3 5.4 rule 1); (2) hearted pictures, by capture time; (3) the rest, by the spread in R15 | U, G | P0 (a) |
| MT-P6-R15 | Given the remaining pictures and its sessions, Then the spread takes one picture from each session in time order, then the picture at the middle of the longest remaining time gap, repeating until the tiles are full; ties go to the earlier time, then to the lower identifier. The result depends only on times and sessions, not on any pixel | U, G, P | P0 (a) |
| MT-P6-R16 | Given 1, 2, 3 and 4 or more tiles, Then the layouts are D3's (4:3, two squares, tall plus two, two by two) and the card never shows how many pictures the day holds, "more", "+N" or a spoken count | U, D | P0 (a) |
| MT-P6-R17 | Given a candidate whose original is in iCloud and no local image is returned (`PHImageResultIsInCloudKey` true, network off, `NS-51-R21`), When the tile resolves, Then the tile takes the next candidate in its slot's order up to `CANDIDATES`, and if none resolves it is a plain box; a tile never triggers a download, and the grid never reorders after its first draw | D, U | P1 |
| MT-P6-R18 | Given the same asset list and the same hearts, When the collage is chosen twice, in any input order and on any phone, Then the tiles are identical; one heart added or removed changes at most the slots the heart rule says it changes | P, U | P0 (a) |

### 6.4 How groups merge or split

Day is the unit of a card (D3 6.1, `NS-51-R7`). Sessions live inside the day. A run of days is an option, off in v1.

| Id | Given, When, Then | Layer | Pri |
|---|---|---|---|
| MT-P6-R19 | Given a qualifying day with more than one session, Then it is still one card; no session gets its own card in v1; the card-sort study (section 6.10) tests one card per day against one card per session before any change | U, R | P1 |
| MT-P6-R20 | Given the `runs` flag on, When two or more consecutive local days each qualify under R4 by volume or heart, and the run is no longer than `MAX_RUN`, Then they may form one card whose title is the plain date range (for example "Friday 24 to Sunday 26 October"), whose reason is RSN-RUN, whose tiles come from R14 and R15 applied to the whole run, and whose detail lists each day under its own date; no place, no purpose word, no "trip", "weekend away" or "holiday" is ever shown; a run is never joined across a day that does not qualify; the same days are not also shown as separate cards in the same view | U, G, C | P1 |
| MT-P6-R21 | Given a late night over midnight, a clock-change day, or a change of the phone's zone, Then days follow the phone's current zone and the date shown on a card equals the date the Photos app shows for those pictures on this phone; a device row checks one zone change (X3 and D3 E9 own the edge) | G, D | P0 (a) |
| MT-P6-R22 | Given a day with a very large number of pictures, Then the tiles, the busy rule and the card are the same as for a small day, the detail view pages, and no count is spoken or shown | U, D | P1 |

Is a multi-day run acceptable? Yes under the constitution, in one narrow form. A run is arrangement, not words: the machine is saying "these dates are adjacent and each had pictures", which the parent can check against the calendar. It becomes meaning the moment it is named, placed or scored, so R20 forbids all three. Three reasons I still recommend holding it: D3 6.1 says no merging; a family with a camera roll that is busy every day would see one very long run; and I have no evidence yet that parents want it. The card sort decides (Q2).

### 6.5 Occasion recommendation from parent data

Sources are P2 S1 to S6 (cited). This section adds only how occasions meet pictures.

| Id | Given, When, Then | Layer | Pri |
|---|---|---|---|
| MT-P6-R23 | Given a date that is a typed day, a ticked Day, the child's birthday or a month day, and pictures on that date inside the window, Then one card shows the date, the occasion's reason (RSN-MARKED, RSN-BIRTHDAY or RSN-MONTHDAY), the parent's own label if any, and the collage; the occasion and the pictures are never shown as two cards for one date | U, G | P0 (a) |
| MT-P6-R24 | Given an occasion date with one picture, Then the day qualifies at one picture (`NS-51-R7`); given an occasion date with no pictures, Then the card is P2's Today card with no collage and no line about missing pictures | U | P1 |
| MT-P6-R25 | Given today's local date and a book that is not quiet or hidden, When an earlier calendar year holds pictures on the same month and day that pass R4, Then one card "Pictures from this day in {year}" may show, using the most recent such year after the child's birth, from a fetch of that one date only; nothing is stored; a year before the birth is never used; no "N years ago" appears; "Not this one" removes that date for that year for good | U, D | P0 (a) |
| MT-P6-R26 | Given a day that holds a kept, open letter (P2 S4 rules, `NS-23`), Then the card shows D3's "A letter is here" row and not a second card; a sealed letter shows nothing | U | P1 |
| MT-P6-R27 | Given a library day, Then no prompt is chosen from the pictures, no prompt text names or hints at what they show, and the compose hand-off starts with an empty words field (`NS-51-R10`, MT-D3-R8); a question card (S6) is chosen only by P2 R15 | U, C | P0 (a) |
| MT-P6-R28 | Given the age on the day (`ageOn(birth, day)`), Then it may appear only in the detail header of an occasion day, as the child's age in the words `content` sets; it is not on every card (open, Q6) | U, C | P2 |

### 6.6 Ranking order and de-duplication

| Id | Given, When, Then | Layer | Pri |
|---|---|---|---|
| MT-P6-R29 | Given Recent, Then days are newest first by local date, grouped under month headings (D3 6.1), capped at `RECENT_CAP`, with no endless scroll, no total and no older control; the order never depends on a score, a heart count or a past tap | U, E | P0 (a) |
| MT-P6-R30 | Given For you, Then P2's four slots stand (today, look back, pictures, question). For the pictures slot the candidate classes in order are: an occasion day inside the window; the day a year ago (R25); the newest day with a hearted picture; the newest busy day; the newest video day. Inside a class, newer first, then lower day key | U, G | P0 (a) |
| MT-P6-R31 | Given more than one eligible day in the winning class and the eligible set of at most `ROTATE_K`, Then the pictures slot takes the one at index `hash(localDate, bookId) mod size`, with a fixed hash and no call to a random source or the clock inside core; the choice is the same on every open that day and on two phones with the same library (`MT-X3-R12`, MT-P2-R39) | U, P | P1 |
| MT-P6-R32 | Given one day that could appear as an occasion card, a pictures-slot card and a Recent card, Then the day has one stable key; it may show in For you and in Recent (they are two views), never twice inside one view; "Not this one" and "Hide this day" act on the key, so the day leaves both views at once; a day with a kept letter is not marked as done and is not removed | U, E | P0 (a) |
| MT-P6-R33 | Given any view, Then it is finite: Recent stops at `RECENT_CAP`, For you at P2's four slots, and no view shows a number except a date, a clock time, a duration or a year | U, C | P0 (a) |

### 6.7 How it feels smart without claiming intelligence

The feel comes from being right, being fast, remembering what the parent said and fusing the parent's own data. Never from saying so.

| Id | Given, When, Then | Layer | Pri |
|---|---|---|---|
| MT-P6-R34 | Given every string in Moments, Then none contains: "we found", "for you because", "suggested", "picked for you", "recommended", "based on", "you might like", "similar", "looks like", "it seems", "smart", "highlights", "memories", "best", "special", "trip", "outing", "visit", "event", "party", "more", or a count of pictures, days or things; the content rule for numbers (MT-D3-R24) allows only a date, a clock time, a duration or a year | C | P0 (a) |
| MT-P6-R35 | Given a day that has a typed label, a kept letter, a month day or a birthday, Then the card shows those parent facts together (R23, R26), because that is the moment a parent notices the app knows their book; it is the only place the tab looks informed | U, E | P1 |
| MT-P6-R36 | Given a cold start and a foreground return, Then cards paint from the last in-memory result or static content first, thumbnails resolve after, no card reorders after it is final (MT-D3-R18), and library work starts after first paint (X3 R13); budget numbers come from spike D3 and I propose none | D, U | P1 |
| MT-P6-R37 | Given a day with nothing eligible, Then the view shows what exists (P2 slots), a slot with nothing is absent, and no line says nothing was found | E, C | P0 (a) |

### 6.8 How a parent teaches it

Two rules govern all teaching. It acts only on something the parent said (R39). Every act is undoable and removable in Me (R43, R44).

| Id | Given, When, Then | Layer | Pri |
|---|---|---|---|
| MT-P6-R38 | Given the card menu and the detail view, Then the closed set of teaching verbs is: Name this day, Not now, Not this one, Hide this day, Keep this day close, Leave out this picture, Use this album; each has one meaning in the table below; no verb is added without `content`, `privacy` and this file changing together | C, U | P0 (a) |
| MT-P6-R39 | Given any tap, dismissal, scroll or dwell, Then nothing about it adjusts ranking, qualifying, rotation or reasons, no tap history or per-person score is kept (`MT-X5-R4`), and nothing says the app learned a preference | U, S | P0 (a) |
| MT-P6-R40 | Given "Name this day", When the parent types up to 60 characters (D3 5.3), Then the label is stored on the phone with the day key, shown verbatim on that day's card, has no suggestion or autofill from library data, and is removed by editing it empty | U, E | P1 |
| MT-P6-R41 | Given "Keep this day close", When the parent taps it, Then the local day key (no picture ids) is stored; the day qualifies under R4 for as long as it is kept, its pictures are fetched by that date when needed, it is not limited by `WINDOW_DAYS`, and on each later year's date it may show once as "Pictures from this day in {year}" (R25) under the same stops. Whether a kept day recurs needs `NS-46` ruling (typed days never recur, `NS-46-R5`); default in v1: no recurrence (Q5) | U, E | P1 |
| MT-P6-R42 | Given "Leave out this picture", When the parent taps it in the detail view, Then that picture leaves tiles, counts and every day, and its identifier is stored in the local moments file (L4, wiped with Turn off, Erase and sign-out). This conflicts with `MT-X5-R1` and `R3` (no identifier on disk, day keys only); it is the price of F2 and is a decision for `privacy` and the founder (Q4) | U, S | P0 (a) |
| MT-P6-R43 | Given Not now, Not this one and Hide this day, Then they mean what D3 section 8 and P2 section 7 say (until tomorrow; this day never again in For you or Recent; hidden and listed only in Me), each shows an Undo, none counts or is logged, and none changes any other day | U, E | P1 |
| MT-P6-R44 | Given Me, Then one list shows what the parent has taught: named days, kept days, hidden days, left-out pictures and chosen albums, each removable one by one and all at once ("Start again"), with no count in the label | E, D | P1 |

Shown, Records, Never, Decline for each teaching act that stores something (`COORDINATION.md` section 10; these are on-device choices, not consents, so I give them in the same four lines so `privacy` can review the Records and Never columns):

| Act | Shown | Records | Never | Decline and withdraw |
|---|---|---|---|---|
| Name this day | The label field on the day, in the parent's words, with the 60 limit | A day key and the typed text, on the phone, L4 | Not sent, not in analytics, logs or crash reports; no autofill from the library | Leave the field empty; edit to empty removes it; Me lists it; Erase and sign-out delete it |
| Keep this day close | The verb and one line: the day stays in the list and may show again on its date | A local day key only | No picture id, no place, no count, no server copy | Undo at once; remove in Me; Turn off deletes all |
| Leave out this picture | The picture's own tile in the detail view and an Undo | The picture's identifier, on the phone (Q4) | Not in any log or event; not in a letter; not exported | Undo; remove in Me; Turn off, Erase and sign-out delete it |
| Use this album | The album's name in our chooser with a plain line that only its pictures' dates are read | The album's identifier, not its name (`NS-51-R14`) | The name is never logged or sent; shown verbatim only on cards the album supplies | Untick in the chooser; Turn off deletes it; limited access offers no albums |
| Not this one, Hide this day | The verb and an Undo toast | A local day key | No reason, no count, no picture id | Undo; Me lists hidden days; Turn off deletes all |

### 6.9 Test approach with a fixed Asha fixture library

One fixture, generated by a seeded script, committed as data and as the script (no photo bytes, no real names, no real places). It runs through `fixtureSource` (`MT-X3`, section 8), so the same input drives unit, golden, property, e2e and device rows.

Fixture `asha-lib-v1`. Child: Asha, born 2025-04-12. Parent timezone America/Los_Angeles. Clock for most cases: Saturday 2026-11-21 18:00 local. Identifiers are `a001` and up. Each case lists inputs and the expected result for the golden file.

| Case | Inputs | Expected |
|---|---|---|
| F01 Busy day, burst, screenshot | 2026-11-15, 7 photos 10:02 to 16:40; frames a010 to a012 share one burst; a013 is a screenshot | Qualifies (R4). Screenshot excluded (R2). Burst counts as one candidate. Reason RSN-DAY |
| F02 Heart and sessions | 2026-11-14, 5 photos 09:00 to 09:06 and one photo at 17:30 hearted | Qualifies. Two sessions. Tiles: the hearted photo first, then the first photo of the morning session, then spread (R14, R15). Reason RSN-HEART |
| F03 Typed label and month day | 2026-11-12 (a month day), 1 photo; parent typed "Park day" on 2026-11-14 for the 14th, not the 12th | 11-12 qualifies at one picture (R24), reason RSN-MONTHDAY, no label. 11-14 shows label "Park day" verbatim (R40) |
| F04 Lone ordinary photo | 2026-11-20, 1 photo, no heart | Does not qualify. No card (R4) |
| F05 Video only | 2026-10-18, 1 video of 14 seconds | Qualifies. One tile with "0:14" and a play glyph. Reason RSN-VIDEO |
| F06 Midnight split | 2026-10-02 23:40 to 2026-10-03 00:25, 6 photos, three each side | Two days of three. Neither qualifies unless another rule applies (R3, R21) |
| F07 Dense hours | 2026-09-01, 4 photos within 2 hours | Qualifies by `BUSY_HOURS` |
| F08 Clock change | 2026-11-01, photos at 01:10, 01:40 and again at 01:20, 01:50 after the clock goes back | One local day; no photo lost; no duplicate day (R3) |
| F09 Cloud-only | 2026-11-08, 5 photos; a041 to a043 return no local image | Tiles skip to the next candidates; a plain box only if none resolve (R17) |
| F10 No date | One asset with no creation date | Excluded; no trace in any output (R2) |
| F11 Hidden | Two assets flagged hidden in the fake source | Never returned by the fake fetch; a scan proves the option is never set (R2) |
| F12 Shared album source | 2026-11-09, 5 assets from a shared source | Excluded; the day does not qualify |
| F13 Year ago | 2025-11-21, 6 photos; Asha is seven months old that day | Today shows "Pictures from this day in 2025" (R25). Not shown if the book is quiet |
| F14 Before the birth | 2025-03-30, 6 photos | Never used by R25 or any occasion rule |
| F15 Three busy days in a row | 2026-10-24, 10-25, 10-26, each busy | Three cards with `runs` off. With `runs` on and `MAX_RUN` of at least 3: one card "Friday 24 to Sunday 26 October", reason RSN-RUN (R20) |
| F16 All screenshots | 2026-10-30, 12 screenshots | No day (R2) |
| F17 Receipts | 2026-10-12, 6 photos of documents (the fixture marks them only by a test flag) | Qualifies, because nothing can tell. After "Not this one" the day never returns; after "Leave out this picture" for one, the day may drop below the rule (F2, R42) |
| F18 Album | Album "Asha's first year" (fictional), 20 assets over many days, full access | Offered in the chooser by name. Once chosen, its name shows verbatim on cards it supplies (R10). Absent under limited access |
| F19 Limited access | Only 6 assets visible | No album, no error line, no "choose more" outside Me (P2 R20) |
| F20 Letter present | A kept open letter on 2026-11-15 | The F01 card shows "A letter is here" and no second card (R26) |

Test rows:

| Id | Given, When, Then | Layer | Pri |
|---|---|---|---|
| MT-P6-R45 | Given `asha-lib-v1` and the stated clock, When `groupByLocalDay`, `isMoment`, the collage rule and `selectForYou` run, Then the output equals the golden file `packages/core/test/moments-p6.golden.json` (proposed path) for every case above; changing a parameter changes the golden in the same PR | G | P0 (a) |
| MT-P6-R46 | Given the fixture shuffled in 100 seeded orders, Then every output is identical (order independence); given the fixture with extra excluded assets (screenshots, hidden, no date, shared source), Then the output is identical to the fixture without them | P | P0 (a) |
| MT-P6-R47 | Given the next local day, Then only the outputs that depend on the date change; given a change of zone, Then only day assignment changes; given an asset added outside `WINDOW_DAYS`, Then nothing changes | P, U | P1 |
| MT-P6-R48 | Given the `Moment` type and every card model, Then there is no free-text field other than a parent-made label, an album title the parent chose, and closed reason keys; a type test fails on any other string field (`MT-X3-R2`) | U | P0 (a) |
| MT-P6-R49 | Given the Moments sources, Then the scan in R12 and the read-set scan in R1 pass, no `Math.random` or wall clock sits in core, and no id, date, count or label reaches a log, event or crash payload (canary strings, `MT-P2-R36`) | S, U | P0 (a) |
| MT-P6-R50 | Given every reason id and every Moments string, Then the content test of R11 and R34 passes `rules.test.ts` and the BRAND.md glossary after the D6 ruling on the tab name | C | P0 (a) |
| MT-P6-R51 | Given a script-made Asha library of known size on an iPhone SE 3, Then the device row measures the date-window fetch, thumbnail resolve for `CANDIDATES`, the cloud-only skip, one zone change, and Limited and Full access, with pass bars written before the run (feasibility D2 to D4); I state none here | D | P1 |

### 6.10 The five-parent card sort: what it must show

Purpose: decide parameters (`SESSION_GAP`, `RECENT_CAP`, `MAX_RUN`, `ROTATE_K`), the run flag, one card per day or per session, and whether the cards feel like a good picker without sounding like a machine.

Method. Five parents of a child under three, recruited by the founder. Two parts, in a session of about 45 minutes.
1. A paper or prototype sort on Asha fixture cards (no real pictures), 24 cards drawn from the fixture variations. Each parent sorts every card into "I would write about this", "Maybe", "No", then says in their own words why each card is on the table.
2. A real-library trial on the parent's own phone, in a build behind a flag with analytics off, on-device only. The researcher watches and notes verdicts. No picture, name, place or date is copied, photographed or noted. The parent reads out their answers.

Quality bar (PROPOSED; the founder sets the numbers, because I have no baseline and will not invent one). A study of five people cannot give a rate; it can show a failure.

| Id | Given, When, Then | Layer | Pri |
|---|---|---|---|
| MT-P6-R52 | Given part 1, Then pass needs: every parent can state a true reason for at least four of five cards without being told; no parent says a card is guessing about them, reading their pictures or "knows" something it should not; every parent finds the occasion card (R23) and the "letter is here" row without help. One parent saying a card sounds like a machine is a fail for that card and a rewrite for `content` | R | P1 |
| MT-P6-R53 | Given part 2, Then pass needs: in each parent's own top ten days, at least half are days they would write about; no parent finds more than two junk days in ten (receipts, screenshots, duplicates, days with no child) after one use of "Not this one"; every parent finds how to set a day aside and how to leave out a picture within one minute, unaided | R, D | P1 |
| MT-P6-R54 | Given parts 1 and 2, Then three questions are asked verbatim: "What is this card telling you?", "Is anything here that you did not expect the app to know?", "Would you open this tab tomorrow, and why?"; answers are recorded as short phrases with no content from a parent's library; "I did not expect it to know" from any parent on any card halts that signal until `privacy` has read it | R | P0 (a) |
| MT-P6-R55 | Given the run flag, Then part 1 includes one run card and one set of single-day cards for the same dates; the run ships only if at least four of five prefer the run and none says it is naming something; otherwise it stays off | R | P1 |
| MT-P6-R56 | Given the study, Then no real name, place, face, date or picture from a participant appears in any note, ticket or doc in the repo, and the outcome is recorded as "x of 5" with the failing cards, never as a percentage (`no-real-family-data.test.ts` stays green) | R, S | P0 (a) |

Not claimed: that these cards will reach Apple's picker quality. The bar says whether five parents find them clear, relevant and not creepy. It does not compare them with Apple's picker, because I cannot show Apple's screens in a study without the founder's screenshots, which are not for the repo.

## 7. Edge and unhappy paths

| Case | What happens | Row |
|---|---|---|
| Parent has a few hundred photos a day | Same tiles and rule as a small day; no count | R22 |
| A day of only receipts or documents | Qualifies; one tap sets it aside; a picture can be left out | R42, R43 |
| Pictures arrive later from family with old capture dates | They join their own date if it is inside the window; nothing marks them as late | R3 |
| Grandparent's pictures in a shared album | Not read in v1 (user library only); Q7 asks whether the parent may opt in | R2 |
| Limited access with a small selection | Days only from the selection; no album; no sentence about it; "Choose which pictures" only in Me | R10, P2 R20 |
| iCloud-only originals | Next candidate or a plain box; never a download | R17 |
| A year-ago day when the book is quiet, hidden, or in a hard stretch | No year-ago card at all; the rest of the view is as any day | R25 |
| A year-ago day the parent finds painful | "Not this one" removes that date for that year for good; Me lists it; no line asks why | R25, R43 |
| Two books | Library days are the same under both (no face match); the book is chosen at capture (P2 R22) | R23 |
| Clock change, zone change, midnight | Day follows the phone now; card date equals the Photos app's date on this phone | R3, R21 |
| Birth date missing, or a book before the birth | No month day, no birthday, no age; no year-ago before the birth | R23, R25 |
| Library permission revoked in Settings | Next foreground drops library cards; teaching keys that hold identifiers are emptied by Turn off (X5 R8) | R42 |
| Album renamed or deleted in Photos | The card shows the current name (we store only the id); a deleted album drops quietly | R10 |
| Fewer than `ROTATE_K` eligible days | The same card may repeat; no copy pretends otherwise | R31 |
| Every teaching act used a lot | Nothing is learned; Me lists what the parent set | R39, R44 |
| Device offline | Everything works; library is on the phone | P2 R37 |

## 8. Constitution, privacy and accessibility checks

Constitution. Nothing here writes, rewrites, summarises or shapes a person's words. The only words not fixed in `packages/content` are a label the parent typed and an album title the parent chose, shown verbatim (R10, R40). Reasons are a closed list of dated facts (R11, R34). Grouping returns structure, not text (`MT-X3-R2`, R48). No place, people, scene, mood, music or machine title exists in the type.

Privacy. The read set grows from "date and identifier" to a closed list of flags (R1); each addition is a file-level or parent-made flag, none a content read. Hidden pictures stay hidden (R2). Photo-level leave-out stores an identifier, which `MT-X5-R1` and `R3` forbid; I flag the conflict (R42, Q4). Album names are read only for an album the parent chose and are never logged or sent. Year-ago and kept-close fetch by date and store at most a day key. Nothing leaves the phone, so the Photos or Videos "not collected" label story holds as long as the network-fake and canary tests stay green (`NS-51-R26`). Counsel must confirm that reading the favourite flag and an album name on the phone does not change the label or the usage-string text.

Accessibility. Each card is one element read as reason, date, label and content (MT-P2-R38). A heart is never the only signal: the reason line says it in words. Tiles carry no description; the collage reads "Photos from {date}" with ", includes a video" where one is present (D3 5.4). Teaching verbs are 44 pt buttons or custom actions with Undo. Reduce Motion, Reduce Transparency, Increase Contrast and AX5 follow D3 and D1; this file adds no motion and no glass.

Content-rule check on this file: no em or en dash, curly quote, ellipsis character or emoji; no model names; only the fictional family Asha.

## 9. Open questions (each with my recommended default and a deadline)

Deadlines are PROPOSED; I have not read the build freeze date.

| Id | Question | Default | Owner | Deadline |
|---|---|---|---|---|
| Q1 | Approve `READ_SET_V1` (R1): subtype flags, `isFavorite`, `burstIdentifier`, duration, media type | Yes, as a closed set with a scan | `privacy`, `security-architect`, founder | 24 Nov 2026 |
| Q2 | Ship a run-of-days card (R20)? | Not in v1; test in the card sort | Founder, after the study | After the study |
| Q3 | Show a parent-chosen album's title verbatim (R10), narrowing `NS-51-R5` and `R14`? | Yes, full access only, chosen by the parent | Founder, `privacy` | 28 Nov |
| Q4 | Store a photo identifier for "Leave out this picture" (R42), against `MT-X5-R1` and `R3`? | Yes, local, L4, wiped with Turn off. Without it a receipt day cannot be cleaned | `privacy`, `data-architect`, founder | 28 Nov |
| Q5 | Does a kept day recur each year as "in {year}" (R41), against `NS-46-R5` for typed days? | No recurrence in v1; keep it close only holds the day | `product` (NS-46 owner), founder | 28 Nov |
| Q6 | May a card show the child's age (R28, RSN-MONTHDAY), given MT-D3-R24 allows only dates, clock times, durations and years? | Occasion days, detail header only, no number on the card until `content` rules | `content`, founder | 28 Nov |
| Q7 | Include pictures from an iCloud Shared Album when the parent opts in? | Off in v1; user library only | Founder | After the card sort |
| Q8 | Time-of-day words ("morning") from a fixed rule, as `MT-X3`'s `timeOfDay` enum and CQ-5 allow, against D3 5.2 which bans them? | None on the card; clock times in the detail view only | `content`, `product` | 28 Nov |
| Q9 | One card per day, or one per session when a day has two long sessions (R19)? | One per day | Card sort | After the study |
| Q10 | Recent shows qualifying days only (R4), against D3 6.1 "one card per day with at least one picture"? | Qualifying days only; a lone ordinary picture stays reachable by opening that day from the picker door | `product`, D3 lead | 24 Nov |

## 10. Dependencies and reconcile points

Where other leads' files disagree with each other or with this one, I mark it. I changed none of them.

| Id | With | What differs | What I propose |
|---|---|---|---|
| C-1 | D3 6.1 versus P2 R17, concept 5.2, `NS-51-R7` | Every day with a picture, versus days the moment rule finds | R4 tiers (F6, Q10) |
| C-2 | Concept section 6 versus D3 5.4 | "Earliest four" versus parent's picks then even spread | D3 plus hearts and bursts (R14, R15) |
| C-3 | X3 `Moment.timeOfDay` versus D3 5.2 | An enum of day parts versus no day-part words | Keep the enum in the type if X3 wants it, show none (Q8) |
| C-4 | Concept section 6 versus D3 5.5 and `MT-X3-R8` | No video length until approved versus a badge with the length | Length as text, approved by R1 |
| C-5 | `MT-X5-R1`, `R3` versus R42 and R10 | No identifier on disk versus leave-out and album identifiers | Q4; `NS-51-R14` already stores album ids |
| C-6 | D3 card anatomy versus P2 R4 | D3's card has no reason line; P2 requires one on every card | Add one reason line under the date (R11); `design` fits it |
| C-7 | P2 R19, concept versus `NS-49-R9` | Apple's title shown after "Use this" versus never shown | The brief wins (P2 R19) |
| C-8 | P2 S4 and R25 here | A year ago from letters versus a year ago from pictures | Two sources; fused when the same date (R26) |
| C-9 | MT-D3-R24 versus RSN-MONTHDAY and R28 | Numbers allowed on a card | Q6 |
| C-10 | P3 R19 (14 days) versus P2 R18 (one screen) | Two caps for Recent | One parameter `RECENT_CAP`; design and spike set it |

Other dependencies: `content` for the reason lines, label limits and verbs after D6's glossary ruling; `privacy` and `security-architect` for R1; `data-architect` for R42 and R41 keys; `mobile` for the library module surface (`MT-X3-R5` to `R8`); `qa` for the fixture and the device rows; `design` for the reason line and the teach menu; the founder for Q1 to Q10. BACKLOG rows are not written here (I was asked not to edit `docs/BACKLOG.md`). The integrator should add tasks for `READ_SET_V1`, `group.ts` and `rank.ts` with the golden file, the tile rule, the teaching store, and the card-sort kit.

## 11. VERIFIED, UNVERIFIED, and guesses

VERIFIED this session (page read, with URL; descriptions quoted or closely paraphrased above):
- `https://developer.apple.com/documentation/photos/phasset.md`: the property list, `creationDate` as optional, `mediaSubtypes`, `sourceType`, `location`, `duration`, `isFavorite`, `isHidden`, `burstIdentifier`, `representsBurst`, `rating`, `addedDate`.
- `.../phassetmediasubtype.md`: the subtype list (no document value).
- `.../phassetcollectionsubtype.md` and `.../phassetcollectiontype.md`: `albumRegular` "An album created in the Photos app", synced, imported and cloud types, the smart-album list, `smartAlbumAllHidden` described as hidden "from the Moments view in the Photos app".
- `.../phcollectionlist.md`, `.../phcollection.md`: moment lists, `localizedLocationNames`, `localizedTitle` "The localized name of the collection."
- `.../phcollectionlist/fetchmomentlists(with:options:).md` and `.../phassetcollection/fetchmoments(with:).md`: availability "iOS 8.0.0 to 13.0.0" and "group assets by time and location".
- `.../phassetsourcetype.md`; `.../phfetchoptions.md` (predicate keys, `fetchLimit`, `includeAllBurstAssets`, `includeHiddenAssets`, `includeAssetSourceTypes`); `.../phfetchoptions/includehiddenassets.md` (default false); `.../phasset/burstidentifier.md`; `.../phasset/isfavorite.md`; `.../phimageresultisincloudkey.md`.
- Repo statements as the files say them: NS-51-R5, R6, R7, R9, R10, R12, R14, R21, R33 at develop; the branch files named in section 2 at the heads I fetched.
- Feasibility and privacy docs (PR #1267, #1269) as read; I did not re-fetch the Apple pages they cite (limited-library album restriction, usage string, Journaling Suggestions).

UNVERIFIED (not read, not run):
- That the founder's screenshots show Apple's system sheet, and any comparison of our quality with it.
- Who wrote an album's name when an app creates it; whether any third-party app can create albums in the user's library.
- The default of `includeAssetSourceTypes` and `includeAllBurstAssets`; whether a bit-mask predicate on `mediaSubtypes` works; the meaning of `representsBurst` for our use.
- That no time zone property exists for an asset (I saw none in the PHAsset list).
- Whether a Recently Deleted or Hidden-album asset can ever appear in a default fetch (device row).
- Whether `PHAsset.rating` is available at our iOS 17.0 floor.
- Thumbnail cost for `CANDIDATES` per card, fetch time on a 20,000 picture library, memory.
- Whether a Journaling Suggestions pick can be limited to photos (feasibility D1).
- Whether the favourite flag and an album name read on the phone change the Photos or Videos label or the usage-string wording (counsel).
- How often a real family has more than one eligible day, so how often the rotation repeats.

Guesses (labelled where used): that gap-split sessions help a baby's day more than they confuse it; that hearted pictures are common enough to matter; that five parents suffice to find a failure but not a rate; that a heart is parent-made rather than set by sync from another device (it may be set by any device on the account).

## 12. What I did not do

I changed no code, test, backlog row, CLAIMS row or doc other than this file. I opened no PR and did not merge. I did not open the founder's screenshots. I ran no device, no spike and no test. I did not read `ML-1` to `ML-14`, App Review 5.1.1, the Developer Program License Agreement or any iOS adoption figure. I did not re-read the BRAND.md glossary (D6 owns the tab-name ruling). I wrote no BACKLOG tasks (the integrator does). I did not invent a threshold: where a number is missing I say who sets it.
