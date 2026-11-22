# PROPOSAL: a real picture from the parent's phone on Home, chosen on the phone at run time, with a static invitation to tell the story by voice

Status: PROPOSAL, 22 Nov 2026, revised the same day after Review A and B (PASS WITH NOTES) at `221fcd12`. Docs only. Author: `product`. Nothing here is decided, built, filed in `docs/BACKLOG.md`, or in `docs/DECISIONS.md`. No app code and no `packages/content` string is changed. Every word in quotation marks below is working copy for `content` to rewrite and the founder to approve.

Founder ask (22 Nov 2026): "Moments can be better done. At least use some images to display in the feed from photos, after access is given, and make it personal. No need to store on the server; display at run time, to recommend and tell the story about this." Everything is approved by him in advance; the exec team decides. Read in this proposal: the exec lenses of section 7 are written by `product` as each seat would argue. No seat answered live, and I am not a lawyer, an auditor or a device.

Marks: [verified: file:line] means I read that line in this worktree (develop `fa69fab48`, 22 Nov 2026), or in the named open PR at the named head. [unverified] means I did not read it, it needs a phone, or counsel must say. I ran nothing on a device. Every number marked ASSUMED is a starting value for a card sort or device row to set.

## 0. The short version

1. The Moments tab already designs library days: a day card with a picture, a closed reason line, "Continue" and "Not now", For you and Recent (PRD 28 sections 5 to 8) [verified: docs/product/prd/28-moments-tab.md:215-256, 488-501]. What it does not do is put one of those pictures where the parent already looks every day, which is Home. Today the PRD gives Moments the pictures and gives Home "Never" a list, and R5 says one fact shows on one tab only [verified: 28-moments-tab.md:180-186, 209]. So this is a scope change, not a tweak.
2. The design: one picture card on Home, in the slot that spec 06 already holds for "one memory slip, or one day card, never both" [verified: docs/design/specs/06-HOME-BOOK-ME-IA-11nov.md:58], below the capture cluster. It appears only after the parent has said yes to the library in Moments, and it never asks for anything. The picture is read from the phone's library when Home is on screen, drawn, and dropped. It is never copied, cached to disk, sent or logged. The line under it is a static content key with {child}. The parent taps one button to tell the story by voice, or says "Not now" or "Not this one".
3. Selection is arithmetic on picture metadata (date and time, media type, heart flag, burst id and the subtype flags; the full read set is in 3.2), plus the child's birth date and the parent's own marks. There is no model, no face or scene reading, no score, no learning from taps. It is a pure function, the same all day, testable with the fictional family Asha.
4. Four things need the founder, because they change what a user is promised or what he already decided (section 11): the primer says the library is read "only while Moments is open" and Home would break that sentence; Moments is no longer the only owner of pictures (R5); the privacy cover of DC-5 would reach one picture on Home; and the picture card counts toward the two asks a day.
5. Nothing here may be published. O-48's line ("Pictures start the story. Your voice finishes it.") stays UNPUBLISHED until counsel answers Q130, and CPrivO-12 keeps every picture word out of listing, website, email and in-app strings while the photos flag is off [verified: docs/legal/proposed/moments-pictures-privacy-drafts.md:219-222, PR #1408 head `4c26974c`, held].

## 1. What exists, so this proposal does not rebuild it

| Piece | State | Source |
|---|---|---|
| Tab order Home, Moments, Book, Me, Home the landing tab, behind `EXPO_PUBLIC_MOMENTS_TAB` | Built, flag off by default | [verified: apps/mobile/src/lib/nav/moments-tab.ts:12-16] |
| Library access states ACC-0 to ACC-5, `nullSource`, `accessStateFor` | Built in `lib/moments/library` | [verified: apps/mobile/src/lib/moments/library/access.ts:1-25; source.ts:1-25] |
| For you plan, `phoneCalm` required so a hard stretch or quiet book shows no library card | Built | [verified: apps/mobile/src/lib/moments/for-you.ts:1-12] |
| The device-only moments store: day keys, the parent's day labels (60 characters), hidden place keys, a home-place correction, an opaque owner. No picture, album or asset id, no coordinate | Built (pure part) | [verified: apps/mobile/src/lib/moments/store.logic.ts:1-5; 28-moments-tab.md:957-970] |
| Day qualification, tile order, seeded rotation, iCloud-only fallback, "Not this one" on a day key | Specified, PROPOSED | [verified: 28-moments-tab.md:329-362, 410, 419] |
| Day card anatomy, Undo row, privacy cover, door row, ask card | Specified, PROPOSED, not built | [verified: docs/design/moments-tab/components/01, 04, 05, 06, 08] |
| Daily setup asks (cap of two a day, Home footer row) | Proposal only, founder question Q1 open | [verified: docs/design/proposed/settings-ia-and-daily-asks-2026-11-22.md:13, 93, PR #1566 head `ef58e6ce`] |

New in this proposal: one Home surface, one new selector (`homeDay`), one new content group, one more place the privacy veil applies, and amendments to about a dozen PRD rows (section 8).

## 2. The experience, in words

### 2.1 What the parent sees

A parent of Asha (the fixture family) opened Moments one evening and tapped "Show days". She read the one sentence, tapped Continue, and allowed her pictures. She did not think about it again.

Two days later she opens Home to say something to Asha. Greeting, the day's prompt, Speak and Type, as always. Below them, under any waiting letters, is one flat paper card. It holds one picture from her own phone: Asha on a blanket, taken on this date a year ago. Under the picture, small: "Pictures from this day in 2025". Then the date: "Friday 21 November". Then one quiet line: "Tell Asha about this day." Two buttons of the same size: "Tell it" and "Not now". A small menu button holds "Not this one".

She taps "Tell it". The picture grows into a sheet showing that day's pictures, the one she saw already ticked. She taps Start, says what she remembers, keeps the letter. The letter's words are hers. The app wrote nothing.

The next day there is a different card, or none. If she has nothing worth showing, Home looks exactly as it did before this feature. There is no empty box, no "nothing yet", no count, no "you missed".

### 2.2 Why it is personal, and why that is enough

It is personal because it is her picture, from her phone, with her child's name in the line under it, on a date she can check. It is not personal because the app knows what is in the picture. It does not. It will never say "Asha's first steps", never name a person or a place on Home, never say "this looks like". The constitution says the machine may not add meaning [verified: CLAUDE.md "The constitution"]. The only things the app says about a picture are a date fact, a reason from a closed list, and one invitation. Section 7 (CAIO and CDesO) says what this costs and how it is tested.

### 2.2a Where it lives on Home

Home's order today, top to bottom: date line and greeting; the prompt with "Another thought"; the capture cluster (Speak, Type, Start from a photo, Not much today); waiting letters as flat rows; at most one memory slip, "or one day card (ML-S10), never both"; the Plus line only when it applies [verified: 06-HOME-BOOK-ME-IA-11nov.md:52-61]. The picture card takes the slot of item 5. It is never above the cluster. At standard text sizes the cluster stays pinned and Speak and Type do not move when the card is present or absent; at AX1 and above the cluster joins the scroll and the card follows it [verified: 06-HOME-BOOK-ME-IA-11nov.md:97-99, section 3.5].

A year-ago letter fragment is a Moments card, not a Home slip, when Moments is on (R5) [verified: 28-moments-tab.md:209], so item 5 is free for the picture card in a build with the tab. In a build with no Moments tab there is no primer and so no access, so this card does not exist (section 3.1, gate G0).

The footer slot of Home (the O-06 pointer line, the Plus line, and in PR #1566 a quiet setup ask) is a different place and is not touched [verified: docs/design/moments-design-closure.md:46; PR #1566 file line 85]. The tab bar keeps no badge, dot or number (DC-4, R4) [verified: moments-design-closure.md:44-47; 28-moments-tab.md:208].

### 2.3 Card anatomy (Home variant of the day card)

Built from the existing `MomentCard` anatomy [verified: docs/design/moments-tab/components/06-day-card.md section 2] with these differences. `design-systems` writes the component file (row BL-1677).

1. One picture, the lead tile only, fitted into a fixed 4:3 frame (not filled and cropped: we have no face reading, so we do not decide where the subject is). `mediaFrame` outline, radius `md`. Nothing drawn over it except a video's duration mark where R208 allows.
2. Reason line from the closed list (R12), below the picture, never over it.
3. Date heading: weekday and date in the parent's locale (R16).
4. The parent's own label for that day, only if they typed one, in the letter face.
5. One static invitation line, a content key with {child}. Three alternates rotate by the same seed as the pick (section 3.4). Never chosen by what is in the picture.
6. "Tell it" and "Not now", equal size, width and outline; the card menu holds "Not this one" and "Hide this day" (DC-6) [verified: moments-design-closure.md:61-65].
7. No place line on Home. Home reads no coordinates (section 3.2).

Flat `surface` on `bg`, `line` hairline, no lamp, no shadow [verified: 06-day-card.md section 2]. The card is not a link to a letter and never turns into "done" (R15) [verified: 28-moments-tab.md:250].

### 2.4 The static line: what it may and may not be

It is a content key, written by `content`, with only `{child}`. It is chosen by the day's seed, never by the picture. It never states anything about the picture, a person, a place, a feeling, an age or a count; it never says "we found", "suggested", "memories", "best", "special" (R52 list) [verified: 28-moments-tab.md:418]. It never implies the app writes: "Tell it" is the parent's act. Three working invitation lines, each PROPOSED, for `content` to rewrite: PROPOSED "Tell {child} about this day." / PROPOSED "What do you want {child} to know about this day?" / PROPOSED "Say a little about this day for {child}." No variant presumes that an event happened or that the child is in the picture (an earlier draft had "what was happening", which presumes an event and is dropped). Letters are addressed to the child, so the line only names the audience [unverified: product voice read from PRD examples only, 28-moments-tab.md:675].

## 3. How a picture is chosen

### 3.1 Gates, all checked before any library read

A card is considered only if every gate holds. A failed gate means the slot is absent: no line, no placeholder, no message, and nothing records that a gate failed (as R253 already requires) [verified: 28-moments-tab.md:1323].

| Gate | Rule | Source |
|---|---|---|
| G0 | The Moments tab flag and the library flag are on, and a new `HOME_PICTURES` flag is on (default off in every profile) | Proposed; flags pattern [verified: moments-tab.ts:12] |
| G1 | The age gate has passed and the parent is 18 or over | [verified: 28-moments-tab.md:524] |
| G2 | Access is Full or Limited (read from `accessStatus()`, which does not prompt) | [verified: 28-moments-tab.md:615] |
| G3 | No visible book on this phone is quiet, hidden, in a hard stretch or expecting-only (`phoneCalm`) | [verified: 28-moments-tab.md:1323; for-you.ts:1-12] |
| G4 | App lock is not locked, the app is active, the capture cluster is idle (no recording, typing or Review open) | [verified: PR #1566 file line 94 for the idle rule] |
| G5 | Not Low Power Mode and storage not critical (the scan is skipped there) | [verified: 28-moments-tab.md:632] |
| G6 | Not the first Home focus after a notification tap or a link: those landings start no library scan until the parent's own next focus change (R265) | [verified: 28-moments-tab.md:1335] |
| G7 | Home has had its first frame. Home's first frame is delayed by 0 ms, and no library function except `accessStatus` is called before it (R109, R111) | [verified: 28-moments-tab.md:638, 640] |

G7 means R109's source test ("fails any call from `_layout.tsx` or Home") must change to allow exactly one hook in one file, `useHomeDay`, that runs after first paint (section 8).

### 3.2 What is read, and what is kept

Read from the library, in memory, only while Home is focused and a gate-passing scan runs:

- The true read set is the closed `READ_SET_V1` of R37: local identifier, creation date, media type, duration, location coordinates (only for the place resolver), the subtype flags (screenshot, screen recording, animation, panorama, Live Photo, video variants), `isFavorite` and `burstIdentifier` [verified: 28-moments-tab.md:407]. The window the native module returns is wider than the selector needs: identifier, creation time, UTC offset, kind, duration, subtype flags, favourite, burst id and `placeCell` (a place cell derived from coordinates) [verified: apps/mobile/src/lib/moments/library/source.ts:6-17]. The Home selector uses only identifier, creation time and offset, kind, duration, subtype flags, favourite and burst id.
- Coordinates and `placeCell`: Home shows no place, so the aim is that the Home path reads neither. [unverified] whether the native scan can skip the location read or the `placeCell` column today; `scanDates` as built may return them for every window. Until device row G1a-L shows a Home scan that reads no coordinates, this document does NOT claim "no coordinates"; it claims the Home path does not use them, never persists them and never shows them. If the module cannot skip them, they are read in memory and dropped, as for Moments (R162 canary). The skip option is part of BL-1676.
- Excluded at the fetch, never by us after the fact: hidden assets (`includeHiddenAssets` never set) and non-user-library assets such as iCloud Shared Album pictures (`includeAssetSourceTypes` passed explicitly). Both behaviours are [unverified] until device row G1a-L confirms them [verified: 28-moments-tab.md:327, 376-377].
- One thumbnail, requested at the tile's display size times the screen scale, network access off, so an iCloud-only original is never downloaded (R45, R112) [verified: 28-moments-tab.md:410, 641].

Kept on the phone: one new value. The Home pick lives in memory for the session, is recomputed by the pure function on a cold start, and is dropped at background and on revoke. The only stored facts that touch Home are the parent's own: a day key for "Not this one", and the label they typed, both already in the moments file [verified: store.logic.ts:1-5]. The one new value is the "Not now" date of HP7: a single local date in the device-only settings store (not `moments.json`), overwritten each time, holding no day key or picture id; `data-architect` sets its classification (I propose L4, since it implies a library day existed). No `shownOn` history, no "last day shown", no count, no tap history. The "every other day" rule of section 3.4 uses a hash of the date, not a record. No new field is added to the moments file's closed member list (R221) [verified: 28-moments-tab.md:957-970].

Never: picture bytes or thumbnails on disk; an asset id, date, count, coordinate or day key in a log, breadcrumb, crash report, analytics event, URL or route parameter; any request to our servers about a pictures; a copy of the picture before Keep. When the parent keeps a letter, the existing attach path makes its own stripped copy on the phone, as it does for any picture [verified: 28-moments-tab.md:624-625, step 9 and 10].

### 3.3 Inputs to the selector

A pure function `homeDay(input)` in `packages/core/src/moments/home.ts` (a new file; row BL-1674). Inputs and nothing else:

- `today`: the local calendar date, and `offsetAt` (no `Intl` in core) [verified: 28-moments-tab.md:325].
- `bookId`, the active book's date of birth (may be absent).
- `days`: clean candidate days from step 2 and 3 of the data flow (screenshots, recordings, animations, no-date assets already dropped) [verified: 28-moments-tab.md:615-620].
- `hiddenDays`: the day keys of the moments file.
- `letterDays`: the local dates on which a kept, open letter already exists in the active book (a date fact from the database; no letter text is read).
- `phoneCalm`, `access`.
No clock, no random source, no network, no read of coordinates, content, people or taps.

### 3.4 The rules, in order

Candidate days are qualifying days (the rules of PRD 7.2) that are strictly before `today`, are on or after the child's birth date when one exists (a picture before the birth is never used, F14) [verified: 28-moments-tab.md:289], are not in `hiddenDays`, and are not in `letterDays`. Excluding today means a picture the parent just took cannot change the pick during the day. Excluding `letterDays` means Home invites a story that has not been told; the Moments tab still shows such a day with "A letter is here" (R48) [verified: 28-moments-tab.md:413].

The class order extends the one in PRD 7.3 ("an occasion day in the window; the day a year ago; the newest day with a hearted picture; the newest busy day; the newest video day") with one inserted class [verified: 28-moments-tab.md:360]. The first class with a candidate wins.

| Class | Rule | Reason line (closed list) | New? |
|---|---|---|---|
| C1 Near a milestone | Let M be the most recent milestone date before `today` (the child's month day or birthday, clamped by the planner's rule), with `today - M` at most `MILESTONE_NEAR_DAYS` (3, ASSUMED). Candidates are days D with `M - 1 <= D <= M + 1` and `D < today`. Prefer D equal to M, then the earlier | RSN-MONTHDAY "From a month day for {child}" or RSN-BIRTHDAY "On {child}'s birthday" | No: the "occasion day in the window" class |
| C2 Same date, an earlier year | Day D with the same month and day as `today`, in an earlier year, on or after the birth. Fetched by that one date only, nothing stored. The most recent year first (R47) | RSN-YEAR "Pictures from this day in {year}" | No |
| C3 Same date, an earlier month | Day D with the same day of the month as `today`, in one of the previous 3 months (inside the 90 day window). The most recent month first. A month without that day is skipped, not clamped (ASSUMED) | RSN-DAY "Pictures from this day" (no relative count: R16) | Yes, new class |
| C4 A hearted day | The newest day in the window with a picture the parent hearted | RSN-HEART "Pictures you hearted" | No |
| C5 A busy day | The newest qualifying day with at least `BUSY_DAY` candidates (4 under the span rule, 5 under the sessions rule: E-B3-2) | RSN-DAY | No |
| C6 A video day | The newest day with a video | RSN-VIDEO "A video from this day" | No |

C1, C2 and C3 are tied to a date fact about today, so they need no spacing rule. C4, C5 and C6 are fill: they show only on days where `hash(localDate | bookId | "home-fill") mod HOME_FILL_EVERY == 0` (`HOME_FILL_EVERY` = 2, ASSUMED, so about every other day, with no record kept and no gap ever counted). The G4 card sort sets it.

Where a class has several candidate days, the winner is index `hash(localDate | bookId | "home") mod size`, with the fixed hash and no random source that 7.3 already requires [verified: 28-moments-tab.md:360]. The salt `"home"` makes Home's pick differ from For you's.

### 3.5 From a day to one picture

Tile order is PRD 7.3: an attached picture leads, then a hearted one, then the candidate nearest the middle of the day's middle session; a burst and a near-duplicate group are one candidate; a video is its own candidate; panoramas are never tiles [verified: 28-moments-tab.md:356-358, 368-374]. Home takes tile 1 only.

The fallback needs to know which thumbnails resolve, and that is a native fact, so the core selector stays pure and does not guess. `homeDay` returns an ordered plan: up to 3 candidate days, each with its tile candidates in 7.3 order. The mobile hook walks the plan with an injected `resolveThumbnail(id): Promise<Thumb | null>` (the native one in production, a fake in tests) and takes the first tile that resolves. If tile 1 is iCloud-only the thumbnail is null (network off), so the next candidate of that day is used (R45); if no tile of that day resolves, the next day in the plan is tried; after 3 days the slot is absent for the day. Unit tests inject a resolver that resolves all, fails the first, fails a whole day, and fails everything, and assert the chosen tile each time. Because this depends on what is on the phone, "same all day" holds for the same library state: a picture the parent deletes in Photos, or hides, can change the pick at the next focus. That is honest, and it is the behaviour the parent would expect.

### 3.6 One owner, two surfaces

R5 says a fact shows on one tab only. `homeDay` runs inside the For you builder too: the For you pictures slot excludes the day key Home chose, and takes the next eligible day, so the same day is not shown on two tabs on one local day. Recent is a list of all qualifying days and is unchanged, as a day may already show in For you and Recent [verified: 28-moments-tab.md:361]. The source registry (R36) gains one surface for S7, `home`, still not `pushSafe`, still no `email` or `widget` [verified: 28-moments-tab.md:321]. A test fails if S7 lists any other surface.

### 3.7 The same rules on the fictional family

Fixture `asha-lib-v1`: Asha, born Sat 12 Apr 2025; phone in America/Los_Angeles [verified: 28-moments-tab.md:261]. The pictures below are illustrative inputs the golden PR will make real.

| Local date | What the library holds (illustrative) | Home shows | Why |
|---|---|---|---|
| Sat 21 Nov 2026 | Six pictures on Fri 21 Nov 2025 (case F13) | That day, RSN-YEAR "Pictures from this day in 2025" | Last month day was Thu 12 Nov, 9 days back, outside 3 days. C1 empty. C2 wins |
| Sun 15 Nov 2026 | Three pictures on Thu 12 Nov, one hearted | That day, RSN-MONTHDAY | Milestone M = Thu 12 Nov, 3 days back. C1 wins over a hearted day |
| Tue 17 Nov 2026 | Only a lone ordinary picture on Sat 14 Nov | Nothing | A lone picture does not qualify (7.2). Home is as before |
| Sat 21 Nov 2026 | Six pictures on 21 Nov 2025, and a kept letter dated 21 Nov 2025 | Next class, or nothing | `letterDays` excludes it. Moments still shows it with "A letter is here" |
| Any day, Asha's book in a hard stretch | Anything | Nothing | G3 |

## 4. States

One table: what Home shows, what Moments shows, and what changes. "Nothing" means the slot is absent and Home is byte for byte today's Home.

| State | Home | Moments tab | Notes |
|---|---|---|---|
| First time (access just granted) | Nothing on that visit unless the parent goes to Home: then the card if one is eligible. First card ever settles once with `enter` (8 pt, 280 ms), once per install (O-26) | Days arrive as ACC-2 says; the days answer the ask in place | No explainer line. The primer already told her where the pictures are read (section 11, F-2) |
| Never asked (ACC-0), Not now (ACC-1) | Nothing. Home never asks for pictures and never mentions them | Value view, ask card, door row as DC-1 rules | R6 and R70: no PhotoKit prompt from Home. The only pointer is O-06's one line, which names no picture [verified: 28-moments-tab.md:196, 1439] |
| Full access (ACC-2) | The card, when a class has a candidate | For you (minus Home's day), Recent | |
| Limited (ACC-3) | The card, built only from the chosen set; nothing when that set has no eligible day. Home never says "choose more" | The calm line and "Choose pictures" button (R287) | Pictures taken after the choice are not read (R75). Home does not nag a small selection. iOS can show its own automatic "select more pictures" alert when an app uses a limited library; R75 says it is suppressed, and the build must carry the Info.plist key that does it (I recall `PHPhotoLibraryPreventAutomaticLimitedAccessAlert` [unverified: not read this run]), proved by a preflight scan, because a Home read must never raise a system alert on the landing tab. Home never calls the limited-library picker; "Choose which pictures" stays in Moments (ACC-3) [verified: 28-moments-tab.md:549, 1364] |
| Denied (ACC-4), Restricted (ACC-5) | Nothing. Home and notifications never mention it (R76) | The calm line, Open Settings (Denied only) | [verified: 28-moments-tab.md:550] |
| Revoked (Settings changed, or "None" chosen) | At the next return to the foreground the card is gone in the same redraw, in under 1 s, with no message; the in-memory thumbnail is dropped | ACC-4 | R77. Revoke keeps the day keys of "Not this one" (R246 op 1) so a set-aside day does not return if she allows again [verified: 28-moments-tab.md:551, 1316] |
| Turn off in Me | Nothing | ACC-1 | R246 op 2 deletes every field, including the set-aside days. Section 9, HP18 gives the line she is shown first |
| No suitable picture | Nothing | For you as usual | No "nothing yet", no apology, no count (R14) [verified: 28-moments-tab.md:252] |
| Offline, airplane mode | Identical. The library is local and no network is used (R118) | Identical | [verified: 28-moments-tab.md:648] |
| iCloud-only original | The next candidate; if none resolves, nothing | A plain paper box, with the explanation the PRD gives | Never downloaded. O-63 stays default No (section 11) |
| Library slow (over 1 s) | Nothing yet; no spinner on Home. The card appears when ready, nothing above it moves | R213's plain line on Moments only | Home's first frame is never delayed |
| Quiet, hidden, hard stretch, expecting-only | Nothing | R253 | [verified: 28-moments-tab.md:1323] |
| Low Power Mode, storage critical | Nothing | Scan skipped | [verified: 28-moments-tab.md:632] |
| App lock locked, or app inactive | Cover or picture veil first (section 5.4) | DC-5's scoped cover | |
| Two books | The card belongs to the active book's {child}. "Tell it" does not ask "Whose book?" because Home's switcher already names the book (F-6 asks the founder to confirm) | R32 as written | A change to R32 on Home only |
| Library changes while Home is open | The card stays as drawn until the next focus or foreground. No change observer exists (R10.3) | Same | [verified: 28-moments-tab.md:632] |
| The picture is deleted in Photos while shown | The thumbnail request returns null at the next focus; the card is removed with no message | | |
| Flag off, or no Moments tab in the build | Home exactly as today | As today | |

## 5. Frame by frame

Each frame is one screen state. Motion names are existing tokens [verified: docs/design/moments-tab/components/README.md rules 2 and 5].

### 5.1 Flow

| Frame | Screen | What happens |
|---|---|---|
| F0 | Moments, ACC-0 | Existing. The ask card, the primer sheet (with its Shown, Records, Never and Decline behind one disclosure), then Apple's alert once. Nothing new here except the primer's one sentence, which section 11 says must change |
| F1 | Moments, ACC-2 | Days arrive. Existing |
| F2 | Home, cold start | Greeting, prompt, cluster at first frame. The library module is not called. `accessStatus()` is not called before first paint |
| F3 | Home, after first paint | `useHomeDay` reads `accessStatus()`. Full or Limited: one date-window scan, the pure selector, one thumbnail request. Result in memory |
| F4 | Home, card arrives | The slot grows from zero height under the waiting rows with `enter`; nothing above it moves; the thumbnail cross-fades in `motion.fadeMs` (200). Reduce Motion: it appears at once, no fade |
| F5 | Home, card at rest | As 2.3. VoiceOver reads it as in 5.5 |
| F6a | Tap "Tell it" or the picture | Measured-rect expand from the picture to the day sheet (EM-01, about 400 ms, cap 420). Reduce Motion: 200 ms cross-fade, no carry [verified: docs/product/moments-tab/EXPERIENCE-AND-MOTION.md:363] |
| F6b | Day sheet | The same sheet Moments opens. The picture she saw is ticked on arrival, shown with a check and spoken as "selected" (section 12, open question Q5). She can untick, tick others, or tap Start with none |
| F6c | Start | The sheet leaves in 160 ms, the ticked tiles fly 320 ms into capture's picture slots (`motion.carry`); flight is default OFF until DM-11 and DM-12 pass, then ON, and never with Reduce Motion [verified: moments-design-closure.md:36-42] |
| F6d | Capture | Empty words field. No prompt about the picture (R49). She speaks or types. Her words, untouched by anything but the existing fixes of `verifyEdits` [verified: CLAUDE.md constitution] |
| F6e | Keep | The letter and a stripped copy of the chosen picture are written on the phone. The landing is the Book (O-19, A4-R20) [verified: moments-design-closure.md:82-85]. Home next shows a different card or none; this day is in `letterDays` |
| F7a | Tap "Not now" | The card fades over `motion.exitMs`; the slot collapses to one in-slot row "Set aside" with "Undo" (not pinned: Home's cluster is pinned at standard sizes, so a pinned row would collide). Until the next local day, no card, also after a cold start (the date is kept as HP7 says). No haptic [verified: 28-moments-tab.md:313] |
| F7b | Menu, "Not this one" | Same in-slot row. The day key goes into the moments file. The day never returns in Home, For you or Recent (R29, R54) |
| F7c | Undo | The card returns with `enter` and the `tap` haptic. The row never times out; it leaves when she leaves Home, or on a second set-aside (G-03 rule) [verified: moments-design-closure.md:172-181 for G-03 text]. The effect never changes on leaving |
| F8 | Me, Photos group | Existing rows: Photos access, Hide places, the hidden days list with Remove and "Start again" (G-08, R54) |

### 5.2 Frame text for a first-time parent, in order

1. Moments, never asked: ask card and door, as DC-1.
2. She taps the yes. A sheet with the one sentence. Continue. Apple's alert.
3. Moments shows days. She leaves.
4. Home, next time: one card, or the Home she knew.

There is no step that asks on Home. A parent who never opens Moments never sees a picture on Home; that is the founder's "after access is given".

### 5.3 Moments tab changes

None in layout. For you's pictures slot skips Home's day (section 3.6). The door row, Recent, the ask card, and the notification landings are as designed. G-09 (arrival by notification) is unchanged: a tap lands with phone-held cards only and no scan [verified: 28-moments-tab.md:1335].

### 5.4 Privacy cover and App lock (R102 and DC-5)

- App lock on: the lock layer governs. A locked app shows no card and no thumbnail. A result that returns while locked is discarded [verified: 28-moments-tab.md:595].
- App lock off: R102 says every picture and frame is an opaque box before the snapshot, with or without App lock [verified: 28-moments-tab.md:595]; DC-5 puts a scoped cover on the Moments tab and its sheets only, and says "Home, Book and Me are unchanged (no new promise)" [verified: docs/design/moments-design-closure.md:52-60]. Home would now hold a real picture in the switcher snapshot. This proposal asks to extend the intent of DC-5 by the smallest piece: a picture veil. When the app state becomes `inactive` or `background` and a library picture is mounted on Home, the thumbnail is replaced in the same frame by a flat paper tile of the same size, no fade, a cut, before the OS snapshot; the rest of Home is not covered. On return to `active` it is restored in the next frame, no animation. This raises privacy and adds no promise, but it amends a founder-decided ruling's scope, so it is F-5 in section 11. A brief flash on a notification pull-down is accepted, as in DC-5 [verified: components/04-privacy-cover-moments.md section 4].
- The veil is the same component as the Moments cover when both are mounted: one cover per screen, never two (G-01's count test).
- Thumbnails are dropped from memory on `background`, so a backgrounded app holds no picture.
- Residual: a screen recording or mirrored display shows what the screen shows. We cannot hide a view from screen capture [unverified: not checked against Apple's documentation]. It is the parent's own phone and pictures.

### 5.5 Dynamic Type, VoiceOver, Reduce Motion

- AX1 and above: the cluster is in the scroll, the card follows it. Picture at full inner width, with a maximum height from `tokens.picture` so it cannot fill a screen (the SE 3 value is ASSUMED, tuned at the device row). The reason, date and label wrap and never truncate (D-027). "Tell it" and "Not now" stack, "Tell it" first, each full width, at least `target.min` [verified: components/06-day-card.md section 6].
- AX5 with Bold Text on an iPhone SE 3: only Home's own first-screen budget applies. Greeting and prompt come first, then Speak and Type, then the card below the fold. Nothing about the card pushes Speak or Type down: the vertical position of Speak with the card present equals its position with the card absent (L3 test).
- VoiceOver: four stops, as for any day card: (1) the information group, one non-actionable element; (2) "Tell it"; (3) "Not now"; (4) the menu. The group's name is the reason line, the date, the parent's own label if any, and the file kind ("photo" or "video"), in one phrase (R154, R214) [verified: 28-moments-tab.md:879, 1284]. Example: "Pictures from this day in 2025, Friday 21 November, photo". The picture itself is not a stop and has no description. No machine-made alt text, ever: no scene, person, object, count or place. A VoiceOver parent who cannot see the picture hears the date and reason and can still tell the story; they can add their own label ("Name this day", up to 60 characters), which is then read.
- Custom actions on the group: "Not this one", "Hide this day" (each also a visible menu item); no gesture without a button (R150).
- Voice Control: each control's name starts with its visible label (WCAG 2.5.3).
- Reduce Motion: the card appears with no fade, the expand is a 200 ms cross-fade, the in-slot row changes with a 200 ms fade, nothing flies. Reduce Transparency: nothing uses glass. Increase Contrast: `controlBorder` and the `mediaFrame` override [verified: components/README.md rule 5].
- Haptics: `tap` on Undo; `selection` nowhere on Home; no sound.
- No claim of Larger Text or VoiceOver support for starting from a picture is made until the S1-23 walk passes (R293) [verified: moments-design-closure.md:200].

## 6. Cap with the daily asks

The cap that now governs, as Karma relayed it on 22 Nov 2026: a founder-delegated ruling in `infra/exec-rulings-2026-11-22-settings-asks.md` allows up to two setup asks a day, at most one per session, and at most one OS-alert or consent ask a day. [unverified: that file is not in this worktree or on develop and I could not open it; this is Karma's account of it.] That supersedes the one-ask-a-day default that PR #1566 gave if Q1 went unanswered, and the one a day that the code and PRD-REQ-001 still say today [verified: PR #1566 file lines 13, 93; apps/mobile/src/lib/asks/next-ask.logic.ts:14].

How the picture card fits: it is an invitation, not a setup ask, and never leads to an OS alert or consent sheet. The founder's own words for this feature were "at most two asks a day", so I count it inside two: on a day it shows, at most one setup ask shows with it, so the total stays two.

Rule proposed (HP13):

1. The picture card counts as one of the two. It never leads to an OS alert or a consent sheet (the permission was given in Moments), so it never uses the one-alert allowance.
2. A setup ask (reminder time, Keep the book, App lock, Save a copy) keeps its slot. The picture card is the other one. If two setup asks are due the same day, the picture card yields for that day.
3. The ruled cap is up to two setup asks a day. On a day the picture card shows, only one of them may; on a day with two setup asks due, the picture card yields. The total never exceeds two, and at most one of the day's asks is an OS alert or consent ask. Whether the picture card should instead sit outside the setup count is exec's to confirm (Q7).
4. Never in the same session as an OS permission alert or a consent sheet; never while a letter is being made; never in the first session (R2 and R3 of #1566) [verified: PR #1566 file lines 94, 95].
5. One card at a time in the slot, no stack, no "1 of 3" (R4). The card never carries a Plus line, a sign-in line, or any other message in its frame. This also keeps the library away from marketing use (Apple 5.1.2, section 7.2).
6. Nothing counts the days a card was shown or not shown; no "streak", no "you have not".

Pictures access itself stays rejected as a feed ask: the parent's own tap inside Moments is the only door [verified: PR #1566 file line 127; 28-moments-tab.md:96].

## 7. Exec lenses

Written by `product` as each seat would argue. Not live answers, not legal advice. Each answer says what changes in the design.

### 7.1 Chief Privacy Officer

Challenge 1. "You are putting a picture of a child on the most-viewed screen of the app, on a phone that might be borrowed, lent or glanced at. The Moments tab was a place a parent chose to go. Home is where the phone opens."
Answer. Four controls, none new in kind. App lock on: the lock governs (R102). App lock off: the picture veil of 5.4 for the snapshot, and nothing larger than one picture is ever on Home. One picture, no place, no name, no count. A set-aside day is one tap and never returns. Hard stretch, quiet and expecting-only books show nothing (R253). The residual is a person looking over a shoulder at an unlocked phone; that is the same exposure as Apple's own Photos widget, but we have not verified that comparison [unverified]. If the CPrivO judges it too much for an unlocked phone, the fallback is a "Hide pictures on Home" switch in Me, default off, which turns the surface off without touching Moments. I would not ship that switch unless asked: it adds a row and a promise.

Challenge 2. "The primer says the date, time and place are read 'only while Moments is open'. Home reads while Home is open. That is a purpose or scope the parent was not told."
Answer. Correct. R192 requires the primer, the purpose string, the Me row and the Notes for Review to say the read happens "only while the tab is open" [verified: 28-moments-tab.md:1262]. Home breaks that sentence. The purpose is the same (to show days to tell {child} about), the surface differs. The words must change before the flag is on: to "only while {app} is open", or to drop the timing claim. That is what users are promised, so F-2, with counsel (Q123, Q130). Until then `HOME_PICTURES` stays off. I propose no final words.

Challenge 3. "Dismissal keys are L4 dates kept after revoke."
Answer. R246 already keeps them on revoke and deletes them on Turn off, so "Not this one" survives a changed mind and Turn off is a full forget [verified: 28-moments-tab.md:1316]. The Turn off line must say what is deleted (HP18).

Challenge 4. "Other people's children appear in a parent's library. The packet asks Q45 only about a baby's voice."
Answer. The gap is real and is already row 24 of the legal checklist [verified: docs/legal/proposed/moments-pictures-privacy-drafts.md:168]. We do not detect people, so we cannot filter; "Not this one" is the remedy. Not a design change; a counsel question owed before the flag.

Challenge 5. "Home sees a card exists or not, so presence leaks something."
Answer. Presence on the phone's own screen reveals only to someone holding it. Nothing leaves the phone: no analytics event, no notification, no widget, no email (R36, R167, R282; O-49) [verified: 28-moments-tab.md:321, 1001, 1359]. No impression event is added, because a card dated by a library day would disclose the date by presence (EX-CDO-1).

### 7.2 Chief Legal Officer

Challenge 1. "What are you promising users?"
Answer. Nothing new, and nothing published. This proposal adds a behaviour and no public line. The proposed value line (O-48) is still unpublished until counsel Q130 [verified: 28-moments-tab.md:909]. While the photos flag is off the listing, website, email and in-app strings say nothing about pictures (CPrivO-12) [verified: moments-pictures-privacy-drafts.md:222]. The card's strings stay dark in `content` until the flag turns on. The "only while Moments is open" sentence (above) is the one existing promise Home would make false. Banned words stay banned: "daily", "every day", "memories", "highlights", "we only see what you pick", "never ask again" [verified: 28-moments-tab.md:921].

Challenge 2. "Apple 5.1.2 and 5.1.1."
Answer, read from Apple's App Review Guidelines on 22 Nov 2026 [verified: developer.apple.com/app-store/review/guidelines/, fetched in this run]:
- 5.1.2(ii): data collected for one purpose may not be repurposed without further consent. Showing a day on Home is the same purpose as showing it in Moments, but it is a new surface, so the primer and purpose string must name it, and counsel confirms.
- 5.1.2(i): an app may not require users to enable system functionalities to access functionality. Home and every flow work with access refused; the card is absent, never a wall.
- 5.1.2(iv) and (v): no contact database, no contacting people from Photos. None is built.
- 5.1.2(vi): Photo APIs may not be used for marketing, advertising or use-based data mining. Section 6 rule 5 keeps the slot free of any upsell, and nothing is mined: no ranking from taps (R54).
- 5.1.1(iii): "Where possible, use the out-of-process picker rather than requesting full access". Home gives the library read one more reason to exist (the picker cannot show a card unprompted), and one more thing for Apple to question. The Notes for Review argument is "an argument, not a won story" and stays so; the CCO reads it [verified: 28-moments-tab.md:556].
- 5.1.1(iv): respect the permission; offer an alternative when declined. The picker and every capture path work with no access.

Challenge 3. "Terms and other people's pictures."
Answer. Unchanged: Terms 4.2.0 row 5 and Q128 already cover pictures of other people's children [verified: moments-pictures-privacy-drafts.md:149].

Challenge 4. "Backups and deletion."
Answer. No new stored picture exists until Keep. The kept copy follows O-44 (disclose; counsel Q129). The Erase now line is the draft in the held PR (rows 9 and 10) and is unchanged by this proposal [verified: moments-pictures-privacy-drafts.md:59-63].

### 7.3 CISO

Challenge 1. "A new read path from the first screen of the app."
Answer. The hook runs after first paint, behind two flags, only with Full or Limited access, and with a source test that fails any library call from `_layout.tsx` or Home other than the one hook (amended R109). The native contract adds one option, no coordinates, and removes nothing. No new package, no new entitlement beyond those the tab already has [verified: 28-moments-tab.md:638, 1359 for the no-new-field rules].

Challenge 2. "Asset ids in a view prop reach crash reports."
Answer. The thumbnail view takes an id and a pixel edge and returns pixels to a native view; the id is not placed in a route parameter, log line or breadcrumb. A canary asset id, date and filename through the Home render, the hook, the crash reducer and the analytics path must leave 0 hits (R162 extended to Home). I could not check what the crash reducer captures from component props [unverified; the owner proves it in BL-1684].

Challenge 3. "A hidden or shared-album picture appears on Home."
Answer. The fetch never sets `includeHiddenAssets` and passes the source option explicitly. This is the single highest-value device check of the feature (G1a-L), because a hidden picture surfacing on a card is a harm no copy can fix. It is [unverified] until a phone runs it [verified: 28-moments-tab.md:376-377]. If G1a-L fails, `HOME_PICTURES` stays off.

Challenge 4. "Thumbnail in the switcher snapshot, memory, screen capture."
Answer. Section 5.4. A thumbnail is held in memory only while Home is focused; one at a time.

### 7.4 Chief Design Officer

Challenge 1. "Home's job is Say. A photo card competes with Speak and Type, and every pretty thing above the cluster costs a tap."
Answer. The card is below the cluster, never above, flat, no lamp, one card, two equal buttons. The position of Speak and Type is tested to be identical with and without the card. The Moments tab remains the choosing place. If the five-parent card sort says the card reads as a second job, the flag stays off.

Challenge 2. "A lone photo with a generic line will feel like every other memories widget."
Answer. Yes, if the picture is wrong. The restraint is the point: the founder asked for it personal, and the only personal thing we are allowed is the parent's own picture and the child's name. G4 adds Home questions (did it feel like the app guessed; would you want it tomorrow; what did you do when the picture was not one you wanted). "I did not expect it to know" halts the signal until privacy reads it [verified: 28-moments-tab.md:424].

Challenge 3. "Days with no picture make Home inconsistent."
Answer. The absent slot is the design. Home is the same length on a day with a card and a day without, apart from the card (R33's spirit: nothing names the absence) [verified: 28-moments-tab.md:318].

Challenge 4. "Undo on Home."
Answer. In the slot, not pinned, because Home's cluster is pinned. Never times out; leaves when she leaves Home.

### 7.5 CAIO

Challenge 1. "Is on-device selection AI? Does 'on device' make it fine?"
Answer. By construction this is not machine learning. The selector is arithmetic over picture metadata (date and time, media type, heart flag, burst id, subtype flags) and the birth date, with a fixed hash. There is no model, no `Vision`, no `CoreML`, no classification, no face or person read, no network call, no learning from taps. A build scan already fails on those names (R43) [verified: 28-moments-tab.md:408]. So in engineering terms it is a rules engine. Whether a regulator, Apple or a parent calls it AI is a different question: a parent may well perceive "it knows my pictures" as AI. We never say "smart", "found", "suggested for you" or that the app wrote or chose words (R52, constitution). On-device processing is also not "collection" in Apple's own definition ("Data that is processed only on device is not 'collected'") [verified: moments-pictures-privacy-drafts.md:77, quoting Apple's App Privacy Details; counsel to confirm]. Whether the EU AI Act or any state law treats a deterministic, rule-based selector as an AI system is [unverified]; I have not read the definitions in this run and counsel must say (section 11).

Challenge 2. "Choosing which picture to show is editorial. The machine adds meaning by selection."
Answer. The constitution bars the machine from writing, rewriting, summarising or shaping a person's words; it does not bar choosing which of the parent's own pictures to offer. We keep the choice honest: the reason line states the date fact the parent can check; "best", "special" and any quality ranking are banned (R52); a heart is the parent's own signal; no score. The first release does not claim the selection is neutral.

Challenge 3. "Bias in the rule. Busy days over-represent social and holiday weeks; a quiet ordinary day with one lovely picture never shows."
Answer. True, and stated. C4 (hearts) is the parent's own signal; the "same date" classes carry no volume bias; "Not this one" removes a bad pick; the junk bar (at most 3 days in 10 before any use of the verb, at most 2 in 10 after) is the measure [verified: 28-moments-tab.md:341-349, 424]. A lone picture is reachable by the picker door.

Challenge 4. "Does a future 'tell me more about this picture' sneak in?"
Answer. It would be a constitution change and a founder decision, not a design. The scan (R43) and the `Moment` type with no free-text machine field (R59) are the fence [verified: 28-moments-tab.md:421].

## 8. What changes in PRD 28, and which O-rows and DC-rows it touches

Nothing is edited by this proposal. Row ids are those of `docs/product/prd/28-moments-tab.md` at develop `fa69fab48`. `product` folds these after the founder answers (row BL-1686).

### 8.1 PRD rows

| Row | Says today (line) | Proposed change |
|---|---|---|
| 4.3 table, Home column "Owns" and "Never" | Home: today's prompt, Speak, Type, Start from a photo, waiting letters, one slip. Moments: pictures from the library [180-186] | Home also owns "at most one picture card from the parent's library, after access", in the slot of the memory slip |
| R5 (one owner per fact) | One tab per fact [209] | Add: the Home picture card and the For you pictures slot never show the same day on one local day; Home wins |
| R10 (For you slots) | Four slots; empty slot absent [248] | The pictures slot excludes Home's day |
| R36 (source registry) | S7 lists no surface; test fails if S7 lists push or email [321] | S7 lists exactly one new surface, `home`; still not `pushSafe`, no `email`, no `widget` |
| 7.3 class order | Five classes [360] | Add class C3 "same date in an earlier month"; add the Home salt `"home"` and the fill gate (3.4) |
| R51 (rotation) | The pictures slot picks by class order and seeded rotation [416] | Reads: Home and For you use two salts and never pick the same day on one local day |
| R6, R70 | No PhotoKit call that can prompt, except after the primer [210, 544] | Unchanged. State that Home never calls `requestAuthorization` |
| R109 | Source test fails any library call from `_layout.tsx` or Home except `accessStatus` [638] | Allow exactly one hook, `useHomeDay`, in one file, after Home's first paint |
| R111 | Home's first frame delayed by 0 ms [640] | Unchanged; add the card never delays the cluster's position |
| R24 and R253 | No S4 card or library card in a hard stretch or quiet book [309, 1323] | Name Home as a surface the rule covers |
| R27 | `momentsFor` same list on every call [312] | Add `homeDay` the same, for the same library state |
| R28, R29, R54 | Not now until tomorrow; Not this one stores a day key; verbs undoable [313, 314, 419] | Unchanged. State they act on Home's card |
| R32 (whose book) | Asks "Whose book?" when more than one book is visible [317] | On Home only, the active book is used with no question (F-6) |
| R102 and R232 (cover) and DC-5 | Cover on Moments and sheets, Home unchanged [595, 1302] | Add the picture veil for a library picture on Home (5.4, F-5) |
| R115 and R246 | Revoke keeps dismissal keys; Turn off deletes everything [644, 1316] | No change; add Home to "drops everything rebuildable" on revoke |
| R192 (primer, purpose string) | The read is "only while the tab is open" [1262] | Reword before the flag: the read also happens while Home is open (F-2). Final words are counsel's and the founder's |
| 8.1 table | ACC-0 to ACC-5, tab only [488-501] | Add a "Home" column: nothing in every state except ACC-2 and ACC-3 |
| R121 (O-06 pointer) | One Home line after the first kept letter, once [676] | Unchanged. The pointer names no picture |
| R167 and R282 (no event) | No Moments event for a library card [1001, 1359] | Add: the Home card produces no event, impression or tap |
| 13.4 and R265 | A landing starts no library scan until the parent's own tab switch [761, 1335] | Add: the first Home focus after a tap or a link shows no picture card (G6) |
| 16.1 (O-48) | Value line, first-run promise by state [907-927] | Unchanged and unpublished. Add the Home card to "not live in any public line" |

### 8.2 O-rows

| Row | Effect |
|---|---|
| O-06 (Home pointer) | Unchanged. Still one footer line, once. The picture card is a different slot |
| O-15 (READ_SET_V1) | Home uses a subset without coordinates; the set does not widen |
| O-18 (permission result as an event) | Stays No. Home adds no event |
| O-22 (notification landing) | Unchanged. G6 above |
| O-26 (first-view settle) | Reused for the first Home card, once per install |
| O-38, O-49 (analytics enum) | Stay No. Home adds no event, impression or tap |
| O-44 (backup of kept copies) | Unchanged. Home makes no copy before Keep |
| O-48 (value line, first-run promise) | Stays UNPUBLISHED until counsel Q130. The card strings stay dark with the flag |
| O-52 (door follows the photo flag, legal set ships with it) | `HOME_PICTURES` follows the same flag and the same legal set |
| O-55 (primer wording) | The wording must change (F-2). G4 tests the Home-aware variants |
| O-62 (one picture or six) | Home shows one. The day sheet is as ruled |
| O-63 (iCloud-only fetch) | Stays default No. Home never downloads |
| New, proposed ids for the log: O-64 Home as a surface for library pictures (scope; founder); O-65 the primer and purpose-string timing sentence (founder with counsel); O-66 the picture veil on Home (founder; amends DC-5's scope); O-67 the picture card counts as one of two asks (founder; with #1566 Q1) | Ids are proposed. The next free O-id was O-63 on develop; a collision check against open PRs is owed |

### 8.3 DC-rows (docs/design/moments-design-closure.md)

| Row | Effect |
|---|---|
| DC-1 (door) | Not touched. Home has no door and no ask |
| DC-2 (host sheet layout), DC-3 (carry flight) | Not touched. F6c reuses them |
| DC-4 (tab order, Home pointer in the footer slot) | Not touched. Tab order holds: Home, Moments, Book, Me [verified: moments-tab.ts:15-16] |
| DC-5 (cover with App lock off), with R102 | R102 already says no thumbnail shows in the switcher with or without App lock. Scope question: the picture veil (F-5) |
| DC-6 (face word, target model) | Used as is on Home: "Not now" on the face, "Not this one" in the menu |
| DC-7 (O-25 plain paper, O-26 first settle, O-34 place line only when away, O-24 haptics) | Used as is; O-34's place line is not shown on Home |
| DC-8 (no analytics enum; O-49) | Holds |

## 9. Requirements, in the customer's voice

Proposed ids `NS-53-HP1` to `NS-53-HP18`, to be given R-numbers when `product` folds them. One behaviour per id. Checks: L0 unit, L1 scan, L2 component, L3 baseline (iPhone SE 3 and iPhone 16, default and AX5, light and dark), L4 audit, L5 device. Priorities: P0 (a) a promise, (b) a legal or store duty, (c) the core loop.

| Id | I say | Given / When / Then | Check | Pri |
|---|---|---|---|---|
| HP1 | "Home never asks me for my pictures. I say yes once, in Moments." | Given any state and any launch, When Home is on screen, Then no permission alert, primer or ask card is shown by Home, `requestAuthorization` is not reachable from Home (a source scan), and a phone that never granted access shows Home exactly as without the feature | L1, L2 | P0 (b) |
| HP2 | "My picture is shown from my phone and not copied." | Given Full or Limited access and a card, When it draws, Then the picture is read on this phone, no file is created in the app container or `Caches` for it, no network request carries an id, date or picture, and the folder byte count is unchanged before and after the card | L1, L5 | P0 (a) |
| HP3 | "It is the same picture all day." | Given the same local date, book and library state, When Home opens 100 times and across cold starts, Then `homeDay` returns the same day and tile; at local midnight it is chosen again | L0 | P0 (a) |
| HP4 | "I can check why it is shown." | Given a card on `asha-lib-v1`, When Home chooses the day, Then it has exactly one reason from the closed list, the date is a pure function of the picture's time and the phone's zone, and the reason is true for the picture (C1 to C6 goldens) | L0 | P0 (a) |
| HP5 | "The app writes nothing about my picture." | Given any card, When it is built and drawn, Then the line under it is a content key with only `{child}`, the card model has no free-text machine field, no string contains the forbidden words of R52, and a scan fails on `Vision`, `CoreML`, any classifier, face or person API, any geocoder | L0, L1 | P0 (a) |
| HP6 | "I can say not this one and it never comes back, and I can undo." | Given a card, When I tap "Not this one", Then the day key is stored on the phone only, the day never shows in Home, For you or Recent, an in-slot Undo row appears and never times out, Undo restores the card, and Me lists the day with Remove | L0, L2 | P0 (a) |
| HP7 | "'Not now' means not today, even if I close the app." | Given a card, When I tap "Not now" and then kill and reopen the app the same local day, Then no card shows until the next local day and no haptic plays. The suppression is one local date, `homePictures.notNowOn`, in the phone's device-only settings store (not `moments.json`, whose member list is closed by R221; never a server; no day key, picture id or count in it); each new "Not now" overwrites it; Turn off, Erase and sign-out delete it. The next local day the card returns if eligible | L0, L2 | P1 |
| HP8 | "If I picked only some pictures, Home uses only those, and the phone does not interrupt me." | Given Limited access, When Home reads, Then the card is built only from the chosen set, Home never says "choose more", pictures added after the choice are not read, Home never calls the limited-library picker, and the build carries the key that suppresses the automatic Limited-access alert (R75), so no system alert appears on Home | L1, L2, L5 | P0 (b) |
| HP9 | "If I said no or changed my mind, Home shows nothing and does not tell me." | Given Denied, Restricted, Not now, or access revoked in Settings, When I return to Home, Then the card is gone in under 1 s in the same redraw, nothing mentions access, and every capture path works | L2, L5 | P0 (b) |
| HP10 | "When there is nothing to show, Home is just Home." | Given no eligible day, offline, only iCloud-only originals, Low Power Mode, or a library over 1 s slow, When Home is focused, Then the slot is absent, no line, spinner, count or apology shows, no download is started, and Home's first frame is not delayed (0 ms) | L2, L5 | P0 (a) |
| HP11 | "On a hard stretch or a quiet book, nothing." | Given any visible book on this phone that is quiet, hidden, in a hard stretch or expecting-only, When Home is focused, Then no picture card shows, and nothing records that the rule fired | L0, L2 | P0 (a) |
| HP12 | "Someone who picks up my phone does not see my child's picture in the app switcher." | Given a library picture on Home and App lock off, When the app goes inactive or background, Then the thumbnail is replaced by a paper tile in the same frame with no fade, before the OS snapshot, and is restored on return; with App lock on the lock governs; one cover is mounted, never two | L0 (truth table `shouldVeilHomePicture`), L2, L5 | P0 (a) |
| HP13 | "I am not nagged." | Given the daily asks cap, When Home chooses what to show in a local day, Then the picture card counts as one of at most two asks, yields on a day when two setup asks are due, is never in a session with an OS alert or a consent sheet, never during a letter, never in the first session, and carries no Plus line or sign-in line | L0, L2 | P0 (a) |
| HP14 | "I tell the story in my own voice, and the first words are mine." | Given a card, When I tap "Tell it", Then the day sheet opens from the card and, before I press Start, shows the lead picture already ticked, with a visible check and "selected" spoken; capture then starts with an empty words field, no prompt names or hints at the picture (R49), and the stripped copy is made only after Keep | L2, L4 | P0 (c) |
| HP15 | "It reads for everyone, at any text size." | Given AX5 with Bold Text on an iPhone SE 3, VoiceOver, Voice Control and Reduce Motion, When a card is on Home, Then it is four stops in reading order, each name starts with its visible label, the group name is reason, date, label and file kind only, nothing truncates, Speak and Type do not move with the card present, and nothing moves with Reduce Motion beyond a 200 ms fade | L3, L4, L5 | P0 (a) |
| HP16 | "Nothing about my pictures is sent." | Given Home, When a card is shown, tapped, set aside, undone or revoked, Then no analytics event, log line, crash field, URL or route parameter carries a card, day, id, count or place, and a canary asset through the render, the hook and the crash reducer leaves 0 hits | L0, L1 | P0 (a) |
| HP17 | "If you switch it off, Home is as it was." | Given `HOME_PICTURES` off, or the Moments tab off, When Home is focused, Then Home is identical to the current build, no library function is called from Home, and no string about pictures is reachable | L1, L2 | P0 (b) |
| HP18 | "If I turn pictures off in Me, I am told what that forgets." | Given Turn off in Me, When I tap it, Then the sheet says in plain words that days I set aside will show again if I turn it back on; on confirm the whole file and the HP7 date are deleted (R246 op 2) and the card goes at once | L2 | P0 (b) |

### 9.1 Shown, Records, Never and Decline (PRIV-R21 form, per COORDINATION section 10)

COORDINATION section 10 asks these lines for anything a person agrees to [verified: docs/agents/COORDINATION.md section 10]. The Home card itself asks no agreement. Three things around it do.

(a) The primer, with the Home timing change (F-2). Words are counsel's and the founder's; none are drafted here.
- Shown: the primer's one sentence from its content key and the versioned policy link, with the four lines behind one disclosure (R218), now naming that days may also show on Home.
- Records: on the phone only, that the primer was shown and answered. No server row, no analytics [verified: 28-moments-tab.md:530-537].
- Never: a picture, id, date, album, place or count; the permission result; any hash sent anywhere.
- Decline: Not now and Don't Allow leave every feature working, Home is as today, export and delete work (PRIV-R09).

(b) "Not this one", "Not now" and Undo.
- Shown: the verb and its one line, on the card menu.
- Records: a local day key on the phone for "Not this one" (R29, R247); for "Not now", one local date in the device-only settings store (HP7) that expires by itself the next local day.
- Never: a picture or album identifier, a count, a log line or event, a server copy.
- Decline: Undo; Me lists and removes; Turn off, Erase and sign-out delete it.

(c) Turn off in Me (HP18).
- Shown: one plain sentence that the pictures read on this phone are forgotten and set-aside days will show again.
- Records: nothing; the file is deleted.
- Never: a count of what was removed.
- Decline: Cancel; nothing is deleted.

## 10. Backlog rows (proposed, not filed)

Ids come from `node scripts/agents/next-id.mjs` on develop `fa69fab48` on 22 Nov 2026, which printed BL-1643; that id and the rest to BL-1671 have since been taken on develop and BL-1672 and BL-1673 are reserved by PR #1617, so these rows use BL-1674 to BL-1687. Run `node scripts/agents/id-collisions.mjs` before filing. Owner names are from `agents/roster.json` [verified: roster handles read in this run]. Lanes: the roster has no `motion` or `transition` agent, so those two lanes are filed to `design-systems` with the lane named in the row. Milestone M15 is the proposed label for work after Build 12. Every row builds behind `HOME_PICTURES`, off in every profile, and no row turns a flag on in `production`.

All Status: proposed. Depends on rows that are not filed, such as the day qualification rules in core and the Moments store wiring, are named in prose because I did not look up their BL ids [unverified].

| Id | Lane | Owner | Mode | Size | Title and scope | Satisfies | Depends on |
|---|---|---|---|---|---|---|---|
| BL-1674 | core | mobile | agent | M | `homeDay` in `packages/core/src/moments/home.ts` returning an ordered plan of up to 3 days with tile candidates (no thumbnail knowledge in core), and goldens: gates input, classes C1 to C6, fill gate, hash, three-day fallback; 100 shuffled orders equal; no import that reads coordinates, content, people or network. Done when the goldens in 3.7 and the 18-row truth table of classes pass, and a mutant that drops `letterDays` is killed | HP3, HP4, HP5, HP11 | the core qualify and tile rules (PRD 28 PRs 2 and 3) |
| BL-1675 | core | mobile | agent | S | One-owner registry: S7 lists exactly `home` (not `pushSafe`, no `email`, no `widget`); For you's pictures slot excludes Home's day; tests per R5 and R36 | HP4, R5, R36 | BL-1674 |
| BL-1676 | mobile | mobile | agent | M | `useHomeDay` hook, one file, taking an injected `resolveThumbnail` and walking the plan of BL-1674 (tests with a fake resolver: all local, first iCloud-only, a whole day iCloud-only, none); after first paint, gates G0 to G7, session cache, no scan on a notification or link landing, drop at background and revoke; the "no coordinates" option on `scanDates`; the amended R109 source test allows only this hook; a preflight scan that the build carries the key suppressing the automatic Limited-access alert and that Home never calls the limited-library picker. Done when a cold-start test shows 0 library calls before first paint and the revoke redraw is under 1 s in the harness | HP1, HP2, HP9, HP10, HP17 | BL-1674; the Moments library module |
| BL-1677 | design-systems | design-systems | agent | S | Component file `docs/design/moments-tab/components/09-home-day-card.md`: anatomy 2.3, in-slot Undo, tokens only (no new token), AX1 and AX5, VoiceOver four stops, test list. Docs only | HP6, HP15 | none |
| BL-1678 | motion | design-systems | agent | S | Motion rows EM-18 (card arrives under the cluster, nothing above moves), EM-19 (set-aside and in-slot Undo), each with a Reduce Motion form of 200 ms; added to the motion map in `EXPERIENCE-AND-MOTION.md` section 6. Docs only | HP10, HP15 | BL-1677 |
| BL-1679 | transition | design-systems | agent | S | Transition rows for Home: card to day sheet (the measured rect from the Home card, EM-01), sheet back to Home on Not now, Keep landing from a Home start; the origin fallback when the card is not measured. Docs only | HP14, HP15 | BL-1677 |
| BL-1680 | content | content | agent | S | PROPOSED content keys, dark with the flag: three invitation lines, the two buttons, in-slot Undo line, VoiceOver hints, and the Turn off line (HP18); content rules test passes; nothing referencing pictures is reachable with the photos flag off (CPrivO-12). The primer words change is not here: it is founder and counsel (F-2) | HP5, HP6, HP18 | none |
| BL-1681 | mobile | mobile | agent | M | Home thumbnail: one native thumbnail at tile size times scale, network off, in-memory only, dropped at background and revoke, never on disk; the picture veil `shouldVeilHomePicture` truth table and the replace-in-same-frame component, sharing the Moments cover's one-mount count | HP2, HP12 | BL-1676, the Moments privacy cover (PR 6b) |
| BL-1682 | mobile | mobile | agent | M | `HomeDayCard` wiring, including the HP7 "Not now" date in the settings store with its Turn off, Erase and sign-out deletion: renders 2.3, "Tell it" opens the day sheet with the lead tile ticked, Not now, Not this one, Undo through the existing store, no event, four accessibility stops, slot below the cluster | HP6, HP7, HP14, HP15 | BL-1677, BL-1681, the day sheet |
| BL-1683 | mobile | mobile | agent | S | Ask cap (up to two setup asks a day, one per session, one alert or consent a day, per the 22 Nov ruling; picture card inside the two): the picture card counts as one of two asks, yields to two due setup asks, never beside an OS alert, consent sheet or letter in progress. Pure function with a test table | HP13 | BL-1682 |
| BL-1684 | qa | qa | agent | S | Canary and scan tests: an asset id, date and filename through the Home render, the hook and the crash reducer leave 0 hits; no analytics event on any Home picture act; a scan that Home imports no coordinate read and no `requestAuthorization`; the L3 test that Speak and Type do not move with the card | HP1, HP16 | BL-1682 |
| BL-1685 | qa | qa | human | M | Device rows on a real iPhone SE 3 and iPhone 16: G1a-L hidden and shared-album exclusion; revoke while backgrounded; Limited; iCloud-only and airplane mode; Low Power Mode; AX5 with VoiceOver, Voice Control and Reduce Motion; the switcher snapshot with App lock off (still photo for the record only); the first Home card after allow. Synthetic Asha library only | HP8, HP9, HP10, HP12, HP15 | BL-1682 |
| BL-1686 | product | product | agent | S | Fold section 8 into PRD 28 and the O-log after the founder answers F-1 to F-6; no row folded before its answer | section 8 | founder answers |
| BL-1687 | legal | legal | agent | S | Add rows M12 (Home surface) to the claims drafts and one counsel question to the packet: does showing a day on Home, while Home is open, change the purpose of the library read (5.1.2(ii)), and does a deterministic selector count as AI under any law counsel names. Counsel answers, not us | O-65, CAIO | founder |

## 11. What stays founder or counsel only (CR-73)

Rulings recorded (22 Nov 2026): Karma reports that F-1 to F-7 below are RULED by the founder-delegated exec team in `infra/exec-rulings-2026-11-22-pictures-on-home.md`, with the flag `HOME_PICTURES` default OFF in every profile and the wording held for counsel. [unverified: I could not open that file; it is not in this worktree or on develop, so I record the outcome on Karma's word and cannot quote its reasons or any condition it attaches. Where the ruling file differs, the file wins.] The items stay listed because each still needs its owner's follow-through, and nothing below is published. "Held for counsel" means: no primer, purpose-string, store, website, email or in-app words for Home are final or live until counsel answers (Q123, Q130).

Founder:
- F-1. Approve Home as a surface for library pictures. This changes scope and moves PRD 4.3 and R5.
- F-2. The primer, purpose string, Me row and Notes for Review sentence that says the library is read "only while the tab is open". It becomes false with Home. What users are promised is his.
- F-3. Keep O-48's line unpublished. No store, website, email or in-app use until counsel answers Q130.
- F-4. The picture card counts as one of the two asks a day. #1566 Q1 is answered by the 22 Nov settings-asks ruling as Karma relays it (section 6); whether the card sits inside or outside the setup count is Q7.
- F-5. Extend DC-5's cover (R102 already says no thumbnail in the switcher, with or without App lock) to one picture on Home (the picture veil). DC-5 is his decision and says Home is unchanged.
- F-6. On Home, the active book is used without asking "Whose book?" (amends R32 on one surface).
- F-7. Whether and when it ships, and any flag in `production`. The CTO does not set that. Money: none here.

Counsel (via `legal`):
- Whether the Home display needs further consent under 5.1.2(ii) and the law that applies to a US parent (Q123).
- The label answer for Photos or Videos stays held until APPLY file 33 is applied and counsel reads Q1, Q8 and Q43 (CPrivO-10) [verified: moments-pictures-privacy-drafts.md:220]. Home adds no data that leaves the phone, so on my engineering reading it changes no label row; Apple's own definition is that on-device processing is not collected [verified: moments-pictures-privacy-drafts.md:77]. The note "No photo feature in v1.0" in the label doc is already false on any photo feature, not new here [verified: moments-pictures-privacy-drafts.md:83].
- Whether a deterministic rule-based selector is an "AI system" under any law counsel names [unverified].
- Pictures of other people's children in a library (Q45, Q128(b)); the gap is already filed.
- Terms and policy text, claims register rows, backup lines (Q129); I draft none.

Not a founder decision (the owning agent rules): the card's layout (CDesO and `design-systems`), the pre-ticked lead tile (Q5 below), the three invitation lines (`content`), the fill gate value and `MILESTONE_NEAR_DAYS` (set at the G4 card sort and the harness).

## 12. What I did not verify, and open questions

Not verified:
- Nothing ran on a phone. The behaviour of the fetch options (hidden, source), a null thumbnail for an iCloud-only original with network off, the native "no coordinates" option, the snapshot veil, and frame costs are all [unverified] until the device rows (G1a-L, DM-11, DM-12, G7).
- I did not read `apps/mobile/src/app/(tabs)/index.tsx` (Home) in this run; the Home order comes from the 11 Nov spec 06, which may differ from the built screen [unverified].
- I did not read the crash reducer, so whether component props reach a crash report is [unverified].
- Apple's wording for 5.1.1 and 5.1.2 was fetched from its published guidelines on 22 Nov 2026; the page I read was 121,052 characters long and the first 100,000 were returned, which covered those sections. I did not read Apple's behaviour on backup replacement (the legal draft's M3).
- I did not run `scripts/agents/id-collisions.mjs` beyond `next-id.mjs`; collisions with open PRs are owed a check before filing.
- BL-1603 to BL-1607 describe two Moments analytics events (`moments_card_impressed`, `moments_card_tapped`) in the catalog; PRD 18 lists impression events for the `question` and `look_back` slots only [verified: docs/BACKLOG.md BL-1603; 28-moments-tab.md:988-994]. This proposal adds none and does not rule on them. If they are wired, the Home card must not be one of them (R167).
- The ML-S10 day card on Home (a 10 Nov design with a 7 day frequency cap) is the older form of this idea and was written before the Moments tab and the library read; I used its slot, not its rules [verified: docs/design/specs/MEMORY-LIBRARY-CONSENT-AND-SURFACING-10nov.md:209].

Open questions, with my recommendation and the default if nobody answers:

| # | Question | Recommendation | Default |
|---|---|---|---|
| Q1 | Home as a surface (F-1) | RULED per Karma, flag default OFF, with the cadence of 3.4 (file not read by me) | Flag off |
| Q2 | Show a fill class (C4 to C6) at all, or only the date-linked classes C1 to C3? | Fill every other day, set at the card sort | Date-linked classes only, which is calmer and gives fewer cards |
| Q3 | Is "same date an earlier month" (C3) wanted? | Yes; it is the founder's own example | Drop C3 |
| Q4 | Should Home also offer a "Hide pictures on Home" switch in Me? | No: Turn off already exists and each switch is a row and a promise | None |
| Q5 | Pre-tick the lead tile on the day sheet, or tick nothing? | Pre-tick: she has just seen that picture and the tick is visible, spoken, one tap to remove. Nothing is attached until Keep | Nothing ticked; she ticks the same picture in the sheet |
| Q6 | Fill gate `HOME_FILL_EVERY` and `MILESTONE_NEAR_DAYS` values | 2 and 3, set at G4 | As stated, ASSUMED |
| Q7 | Does the picture card count inside the two-asks cap, or sit outside the setup asks? | Inside, as the founder's "at most two asks a day" reads | Inside |

Facts to remember from this run, for the next agent: the next free BL id on 22 Nov 2026 was BL-1674 and the next O-id was O-64; PR #1408 (legal drafts) and PR #1566 (daily asks) were open and unmerged at heads `4c26974c` and `ef58e6ce`.
