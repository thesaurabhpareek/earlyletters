# Moments tab, P5: rollout, nudges, measurement and backlog split (PROPOSED)

Status: PROPOSED, 21 Nov 2026 (UTC). Author: product lead P5 of 5 (id p5). Docs only. Nothing here changes a locked statement; every change to one is listed as a reversal the founder owns (section 3).
Brief of record: `/home/claude/moments-brief.md`, including its UPDATE line (tab position is open; the tab is the daily-return engine; nudges across feed, push and email). Branch `wip/moments-p5`.
ASCII only. Role names only. Ids of other leads are not known to me; where a row needs them, the integrator fills them in.

## 1. Purpose and scope

This file answers six things for the founder:

1. When does Moments ship: in the first store build, or in a 1.0.x update (section 4).
2. Which flags and switches control it (section 5).
3. What must pass before any parent sees the library part (section 6).
4. How the same signal drives the in-app feed, a local push and an email, and what each channel may never use (section 7).
5. What the reason to come back every day is, and how we would read whether it works under our analytics rules (sections 8 and 9).
6. The backlog split, the sizes and the Build 13 impact (sections 11 to 13).

Not mine: the tab's screens (design leads), the two routes (feasibility doc), the privacy analysis, the wording (content), the tab position decision itself (the IA lead answers it; I give my rollout view of each option in section 4.4).

## 2. Inputs read

Read this session, in the clone at the head of `develop`:

| Input | Path or source | Used for |
|---|---|---|
| Brief and UPDATE | `/home/claude/moments-brief.md` | decisions of record, nudge constraints |
| Kill-switch vocabulary | `packages/api/src/kill-switches.ts` | `photoMoments`, `videos`, `libraryDays`, `bookSearch`; "a switch can hide, never turn on" |
| Photo-library hold | `docs/BACKLOG.md` BL-1305 | no usage string or PhotoKit call in any 1.x build |
| Test plan B13, photos | `docs/qa/test-plan-b13/03-photos-and-media-library.md` | NS-51 and NS-52 are Drop C, spike first, flag off in every EAS profile |
| Measurement rules | `docs/product/prd/functions/data-and-measurement.md` FR-DAT-04, 05, 08, 27, 38 | tester numbers, x of n, no event for a moment |
| Instrumentation index and PM2 file | `docs/product/instrumentation/README.md`, `02-book-reading-find-photos.md` | event naming standard, closed areas, DARK build |
| Decisions | `docs/DECISIONS.md` D-095, D-124 item 3, D-130, D-163 | analytics state, dates |
| Notification budget | `docs/product/prd/11-foundations.md` NS-32-R1, R4, R8, R11, R12; `09-capture.md` NS-13-R30 | one a day, content keys, plain lock screen, 07:00 to 21:30 |
| Email rule | `docs/product/prd/functions/marketing.md` FR-MKT-44; `18-errata-after-lock.md` E75, E76, E79 | transactional email only; no server push in 1.0 |
| Build 13 chain | `docs/product/prd/23-dependency-map-and-plan.md` section 2.1 | critical path and the r3 contents proposal |
| Release record | `docs/release/1.0.0.md`, `docs/release/dates.json` | store lane, D-121 target, D-130 dates |
| Apple, Journaling Suggestions | https://developer.apple.com/documentation/journalingsuggestions.md and https://developer.apple.com/documentation/BundleResources/Entitlements/com.apple.developer.journal.allow.md | availability, entitlement, no extra authorisation |
| Not found | `ML-3`, `ML-6`, `NS-51` neutral wording as cited in the brief | I could not find an "ML-3" row text in the repo with a grep; I quote it from the brief and mark it UNVERIFIED. The B1 benchmark doc (`wip/moments-b1`) is not on the remote yet; I cite it by name only and reconcile when it lands |

Other leads' docs (privacy, feasibility, concept, PR #1264 wheel) were not present as files when I wrote this. Assumptions are in section 14.

## 3. Reversals the founder owns

Each is a change to an earlier ruling. Nothing below is settled until the founder signs it.

| # | Earlier ruling | What Moments would change | When it bites | My default |
|---|---|---|---|---|
| RV-1 | J4: only Home starts a letter | A start from the tab | any build with the tab | the tab hands a start to Home's capture (one door, one test) |
| RV-2 | K-02: no permission ask in first run | an ask for photos on the tab, never in first run | the library part only | ask on the tab after the first letter, never in first run |
| RV-3 | BL-1305: no photo-library usage string or PhotoKit call in any 1.x build | a usage string (Route B) or the journaling entitlement (Route A) in a binary | the library part only | keep BL-1305 for the first store build; lift it for one flagged profile (section 5.3) |
| RV-4 | ML-6: cards show a date, never a place or thumbnail | a thumbnail in a library card | the library part only | thumbnails are the parent's own pictures on the phone; no place, ever; the privacy lead owns this |
| RV-5 | Three-tab ruling (`infra/scope-stack-rank-and-ia-redesign-2026-11-19.md`) | a fourth tab or a changed order | any build with the tab | the IA lead; see 4.4 |
| RV-6 | FR-MKT-44 and E75: email is transactional only, no re-engagement, no opt-in at 1.0 | any email nudge | only if the founder asks for email nudges | not in the first store build; see 7.4 |
| RV-7 | E79: no server-sent push in 1.0 | any remote push | only if the founder asks | local push only; see 7.3 |
| RV-8 | FR-DAT-38: no event for a moment shown, tapped, dismissed or empty | any event on a library card | never proposed | I propose none; see 9.3 |
| RV-9 | D-095 and D-124 item 3: analytics off for the 1.0 line (D-163 supersedes for the production build only, gated) | reading the tab with events | only after the D-163 gates close | measure with tester numbers until then |

## 4. Release plan options

### 4.1 Facts that shape the options

- Moments has two parts. Part 1 is "For you" built from what we already hold: typed occasions, Days, month and age days from the date of birth, a year ago from our own letters, our written prompts, pictures the parent already picked. It needs no library, no new permission and no new entitlement. Part 2 is anything from the photo library (Route A or Route B).
- Part 2 changes the binary. Route B needs a photo-library usage string and a PhotoKit call. Route A needs the entitlement `com.apple.developer.journal.allow` in the code signature, and Apple says the picker cannot appear without it and that you enable it by turning on the Journaling Suggestions capability in Xcode (read this session). A binary change cannot ride on a signed config or a content pack. So "1.0.x" for Part 2 means a new store build, not a switch flip.
- Apple's page lists Journaling Suggestions as available from iOS 17.2 (read this session). Our floor is 17.0 (D-098). So Route A needs an availability check and a quiet fallback on 17.0 and 17.1. Whether any extra approval step sits behind the capability in App Store Connect is UNVERIFIED; I did not find it in the two pages I read.
- Apple says no extra authorisation is needed because the app sees nothing until the person chooses in the picker (read this session). The titles and names in that sheet are Apple's.
- The store lane has not started. Its first submission was targeted for Tue 1 Dec (D-121) and is re-planned after the alpha go/no-go (`docs/release/1.0.0.md`). The freeze and go/no-go of D-130 (3 and 9 Nov) are in the past on today's date. Today's real state of Build 12 and Build 13 is UNVERIFIED by me.
- BL-1305 has a test that fails on a photo-library usage string or a PhotoKit symbol in a 1.x profile. It is a guard I must not weaken without the founder's reversal RV-3.

### 4.2 The options

| Option | What ships first | What ships later | For | Against |
|---|---|---|---|---|
| O1: all in the first store build | Tab, For you, value screens, the ask, the library part | nothing planned | one story; matches the founder's first ask | Four gates (section 6) must all pass before the first submission. Reverses RV-2 and RV-3 in the build App Review sees first. A usage string and the Data Not Collected label story must hold on day one. A rejection on the library part holds the whole build |
| O2: tab first, library in 1.0.x (RECOMMENDED) | Tab with For you and our own Asha examples, no photo ask, no usage string, no entitlement | The library part in the first update after approval, behind a build flag and a kill switch, as its own build | First review sees the smallest privacy surface. BL-1305 stays true in the first build. A rejection on the library part does not hold the store release. The gates get time. The tab is still a reason to return from day one (section 8) | The first build has no library story, which is half of what the founder asked for. The founder must accept a second build for it. Parents who read the listing may expect photos |
| O3: no tab until later | Nothing | Everything in 1.1 or later | Zero risk to the store date | Throws away the daily-return engine the founder just asked for. I do not recommend it unless the founder wants the date above all else |

### 4.3 My recommendation, and what would change it

Recommend O2. Reasons: the date to submission is set by founder, device and counsel work, not code (`docs/ROADMAP.md`, section 0); the library part has four gates that have not run; and the part that makes people come back every day (8.1) does not need the library at all.

What would move me to O1: all four gates in section 6 pass before the first submission is cut, and the founder signs RV-2, RV-3 and RV-4. What would move me to O3: the device spike fails on the iPhone SE (3rd gen) and the tab's For you part also needs more design time than the store date allows.

Honesty note: O2 holds back the part the founder called most critical. I recommend it because it protects the date and the privacy label, not because it is better for the feature. The founder may rule O1.

### 4.4 Tab position, from the rollout side

I do not decide position. For each option the IA lead is weighing, what rollout and nudges need:

| Position | Rollout effect | Nudge effect |
|---|---|---|
| Home stays default, Moments second | Safest. Flag off gives today's bar. A kill switch returns to the current three tabs | A local push opens the app; where it lands is a routing rule (7.3), so Home default is fine |
| Moments as a centre tab in a five-tab bar | Two more tabs than today (RV-5); the larger change to the paper tab bar that ships now; needs every tab test redone | The centre slot suggests a primary action; that collides with J4 unless it opens capture (RV-1) |
| Moments default | The biggest reversal (J4, K-02 pressure, first-run landing) | A push can open straight to it |
| Moments inside Home | Smallest binary change; no new tab test | Fewest places to send a nudge; weakest daily-return surface |

My rollout preference, as a view only: Home stays default and Moments is second, because it keeps the flag-off state identical to today's bar and makes the kill switch a clean fall-back. Open question OQ-2.

## 5. Flags and switches

Precedent in code: a build flag is the only thing that turns a feature on, and a kill switch can only hide it (`kill-switches.ts`: `bookSearch`, `photoMoments`, `videos`, `libraryDays`). Flag names are proposals; `capabilities.ts` sets the final names.

| Id | Name (proposed) | Kind | Controls | Default in every EAS profile | Who may flip |
|---|---|---|---|---|---|
| F1 | `EXPO_PUBLIC_MOMENTS_TAB` | build flag | the tab exists in the bar, For you part and value screens | off until the founder rules; then on in `preview` and `testflight` first | founder, by build |
| F2 | `EXPO_PUBLIC_MOMENTS_LIBRARY` | build flag | the ask, Route A or B, Recent | off in every profile, including `testflight`, until gates G1 to G4 pass | founder, by a separate build |
| K1 | `momentsTab` (new key) | kill switch | hides the tab at next launch; the bar returns to today's | not paused | operator by signed config |
| K2 | `photoMoments` (exists) | kill switch | the library part: hides the doorway and Recent at next launch; the on-device index is untouched | not paused | operator |
| K3 | `libraryDays` (exists) | kill switch | the days library; typed days and reminders stay | not paused | operator |
| K4 | `momentNudges` (new key) | kill switch | cancels pending local nudges that come from Moments cards (7.3) | not paused | operator |

Rules, each a requirement below:

- MT-P5-R1. Given any EAS profile, When the config is built, Then F2 is off unless the profile is named in a single allow list reviewed by privacy, and a test fails on any other profile with F2 on. Test layer: S (source scan with a positive control).
- MT-P5-R2. Given K1, K2 or K4 is paused in a signed config, When the app next launches or focuses, Then the matching surface is hidden, nothing is deleted, and recording, typing, saving, reading, playback, sweep, Erase and export still work (LEGAL-REQ-040). Test layer: I.
- MT-P5-R3. Given a signed config from before K1 and K4 existed, When it is read, Then they read as not paused (the rule already used for older configs, `kill-switches.ts`). Test layer: U.
- MT-P5-R4. Given F1 is off, When the app runs, Then the tab bar, routes and tests are identical to the build without Moments (a snapshot of the bar and the route table). Test layer: I.
- MT-P5-R5. Given F2 is off, When the binary is scanned, Then there is no photo-library usage string and no PhotoKit symbol, and for Route A no journaling entitlement. This keeps BL-1305 true for the first store build. Test layer: S.
- MT-P5-R6. Given F2 is on in an allowed profile, When the binary is scanned, Then the usage string is present only in that profile and its words are a content key. Test layer: S, C.

### 5.3 What lifting BL-1305 for one profile means

RV-3 does not delete BL-1305; it narrows it. The test keeps failing on every profile except the one allow-listed in R1. The founder signs this once. Until then, F2 stays off everywhere and Part 2 cannot be tested on a device build from `develop`; spike work stays on `exp/photos` as the card already says (test plan B13, file 03: NS-51 spike first, branch `exp/photos`, flag off in every EAS profile).

## 6. What must pass first

| Gate | What it proves | Owner | Pass means | If it fails |
|---|---|---|---|---|
| G1 Device spike | Route A and Route B run within budget on the iPhone SE (3rd gen), with Limited access honoured, iCloud-only items, a library of any size, and the paper-first frame rate with Reduce Motion | `mobile` with the founder's phone (`mode: human` for the run) | a written read-out with device numbers from `NFR-BUDGETS.md` rows; no number invented here | Part 2 stays dark; O2's first build is unaffected |
| G2 Counsel read | Privacy label (Data Not Collected still true or counsel told what changes), the usage-string words, reverse geocoding and coordinates to Apple (UNVERIFIED), what Apple's picker returns and what we store, the terms and policy text | `legal`, `privacy`; counsel is the founder's | counsel's written answer on each question in the packet | Part 2 stays dark. Counsel and Apple sign-off are not delegated (`D-124` note) |
| G3 Apple entitlement | Route A only: the Journaling Suggestions capability is enabled on the app id and a build signs and runs on a device on iOS 17.2 or later; a 17.0 or 17.1 phone falls back quietly | founder (Apple account), `mobile` | a signed device build shows the picker | Route A is dropped; Route B remains if G1 and G2 pass |
| G4 Five-parent check | Parents understand the tab, what the ask says, what Not now does, and that the app wrote nothing | `user-research` | section 10 bar met | wording or design changes first; Part 2 does not ship |
| G5 Accessibility pass | iPhone SE 3, AX5, Bold Text, VoiceOver, Reduce Motion, Reduce Transparency, Increase Contrast on every state of the tab | `qa`, `design-systems` | the device rows pass | same as the design bar: no ship |
| G6 Content rules | no machine-written title, no place or person guess, no count, gap, streak or badge, `{child}` only, one verb per tab word | `content` | `packages/content` rule test passes; no PROPOSED words in a shipped screen | fix the copy, not the test |
| G7 Founder signs RV-1 to RV-5 | the decisions in section 3 that the chosen option needs | founder | a D-### entry (drafted by product as Proposed) | the option is not built |

MT-P5-R7. Given F2 is to be set on in any profile, When the release owner prepares the build, Then G1 to G7 each have a dated read-out linked in the release record `docs/release/<x.y.z>.md`, and a missing one blocks the flip. Test layer: P (process; a checklist line in the release record, not a code test).

MT-P5-R8. Given a gate failed, When the failure is recorded, Then the release record says which part of the feature stays dark and which ships, so a failed gate never silently cuts the part that needs no gate (For you). Test layer: P.

## 7. Nudges across three channels

The same moment signal can drive a card in the feed, a local push and an email. Each channel has a different source of truth and different rules. The founder asked that they be thought of together (UPDATE, 20 Nov).

### 7.1 What a "signal" is, and where it may live

| Signal source | Where it is known | Feed card | Local push | Email |
|---|---|---|---|---|
| Child's date of birth: month and age days, birthday | phone and server | yes | yes (existing classes `monthAge`, `birthday`) | yes, if the founder lifts RV-6 |
| Typed Days (days we mark, parent-typed) | phone only (NS-47: never synced, not in the backup) | yes | yes, as an ordinary prompt (NS-47-R5) | NO: the server does not hold them. The brief lists typed days as server knowledge; the repo says otherwise (NS-47 rows in BL-1307: "never synced or sent"). I mark this a conflict in the brief; see OQ-5 |
| Letters made (a letter exists, its month) | phone and server (when sync is on) | yes | yes | yes, as "letters made" in aggregate only; see the limits in 7.4 |
| A year ago, from our own letters | phone, and server if synced | yes | yes (local) | only from server-held metadata, and only if counsel and the founder allow; default no |
| Our written prompts (111) | packaged content | yes | yes (a content key) | yes (a content key), as a fixed prompt |
| Photos the parent already attached to a letter | phone | yes | no (a push would say something about a picture) | no |
| Library moments (Route A pick or Route B read) | phone only, by design | yes, on the phone | NO (ML-3, see 7.3) | NO (the server never sees the library) |

### 7.2 What each channel may use, and may never use

| | In-app feed (Moments tab, Home) | Local push | Email |
|---|---|---|---|
| May use | everything in 7.1 that sits on the phone, including library moments after the ask. Pictures only as the parent's own, drawn on the phone. A date; a parent-typed label | date-of-birth facts, typed days, letters made, our prompts, a plain evening reminder. Fixed text from a content key (NS-32-R11) | date of birth, letters made, fixed prompts. Only what the server legitimately holds. Only if the founder reverses RV-6 |
| May never use | a machine-made title; a place or person guess; face matching; a count of gaps; a streak, point or badge; Apple's titles and names stored or shown by us | any library signal (ML-3); a thumbnail; a place, photo, count or the word "waiting"; letter words; the child's name unless names are on (NS-32-R12); the child's age or month number on a lock screen when names are off or App lock is on (E82) | anything from the library; a photo; a thumbnail; a place; letter words; a count of gaps; guilt or loss language; anything the server does not already hold |
| Budget | none beyond the tab's own rules; no "N waiting" badge | NS-32: at most one budgeted notification a day, over every class (NS-32-R1); a plan notice sits outside the budget and is never delayed (R4); quiet hours 07:00 to 21:30 local (NS-13-R30); back-off, no evening nudge after day 35 with no letter (R8) | transactional only today (FR-MKT-44). If lifted, the founder sets the cadence; I propose at most one a week, which is a guess, labelled as such |
| Consent | none beyond the existing asks | the notification permission, asked in its own moment, not on first run | no opt-in exists at 1.0; any email nudge needs its own door lines (PRIV-R21), a one-tap stop and counsel |

### 7.3 Local push

- ML-3, as the brief states it (UNVERIFIED in the repo): no push is created from library data. The text is fixed, the id is random, there is no place, photo, count or "waiting".
- NS-51's neutral wording is the model for any library-adjacent line: "Some pictures from the weekend are here". Content owns the exact words. Even that line is ruled out of a push by ML-3. The only place it may appear is inside the app. I note this because the neutral line can be mistaken for a push line.
- Consequence for the founder's ask: a push can never say "you have photos from Saturday". A push may say what we already say today (an evening reminder, a month, a birthday) and nothing more. The daily reason to return (8.1) must therefore live in the tab, not in a library-driven push. A push brings people to the app; what is inside is the tab's job.

Requirements:

- MT-P5-R9. Given any local notification scheduled by the app, When its request is inspected, Then its title and body come from a content key, its identifier is random, and no field carries a place, photo, filename, count or library-derived value. A source scan finds no import of the library module in the notification planner. Test layer: S with a positive control, I.
- MT-P5-R10. Given every budgeted class scheduled over 92 days, When Moments adds a class, Then at most one budgeted notification is delivered per local day, inside 07:00 to 21:30, and Moments adds no new class that raises the daily maximum. Test layer: U (the existing NS-32-R1 test extended).
- MT-P5-R11. Given the parent made a letter today, When a Moments-derived nudge would be due, Then it is not delivered and no copy says anything about a missed day. Test layer: U.
- MT-P5-R12. Given K4 is paused, When the app next launches, Then pending nudges from Moments are cancelled. Test layer: I.
- MT-P5-R13. Given a push is tapped, When the app opens, Then it lands on the screen the routing table names, and no library permission prompt, count or gap line shows. Test layer: J.
- MT-P5-R14. Given the lock screen with names off or App lock on, When a Moments-derived push shows, Then it carries no age, month number or name (E82, NS-32-R12). Test layer: C.

### 7.4 Email

Facts: email today is transactional only (FR-MKT-44; E75; E76); no opt-in exists at 1.0; no server push exists in 1.0 (E79). So every email nudge is a reversal (RV-6) the founder owns.

If the founder wants email nudges, the only legitimate sources are those the server already holds:

- the child's date of birth (a birthday or month note);
- letters made, as server metadata (a letter exists, in which month), only when sync is on and only in aggregate wording that never counts a gap;
- our fixed prompts (a content key).

Not allowed in any email: library signals, thumbnails, places, typed days (not held by the server, see the conflict in 7.1), letter words, a count of days since the last letter, "you have not written", a streak.

Requirements:

- MT-P5-R15. Given any email sent by the product, When its template is inspected, Then it is in a closed class list, its body comes from a content key, and there is no field derived from the library or from a typed day. A content test fails on a template without a class (the test `LEGAL-REQ-053` already names). Test layer: C, S.
- MT-P5-R16. Given a parent who did not opt in to email nudges, When any Moments rule is evaluated, Then no email nudge is sent. Test layer: I.
- MT-P5-R17. Given the founder has not signed RV-6, When the first store build ships, Then there is no email nudge, no opt-in control and no analytics event for one. Test layer: S, J.

### 7.5 Which channel each source can drive (summary)

| Source | Feed | Local push | Email |
|---|---|---|---|
| Month and age day, birthday | yes | yes | yes, only with RV-6 |
| Typed Day | yes | yes (ordinary prompt) | no |
| Letters made | yes | yes | yes, only with RV-6, aggregate and plain |
| A year ago (our letters) | yes | yes | default no |
| Our 111 prompts | yes | yes | yes, only with RV-6 |
| Picked pictures on a letter | yes | no | no |
| Library moment | yes (after the ask) | never | never |

## 8. The daily reason to return

### 8.1 The reason, in the founder's plain terms

One sentence: "Today there is something of ours waiting to be put into words." I cannot use "waiting" on a push (ML-3), and I will not count anything. So the reason to come back is not a number. It is that the tab always shows one true, warm, specific thing the parent can start a letter from, and it changes through the day and week without the parent doing anything.

What changes daily, built only from what we hold:

- the day's own anchor: a month or age day from the date of birth, a typed Day, or "a year ago today" from our own letters;
- one written prompt chosen by the existing prompt selector (the 111 prompts), not by a model;
- pictures the parent already attached, shown as their own;
- after the ask and the gates: a day from the library, shown as the parent's own pictures with a date (never a place, never a machine title).

Rules that keep it honest:

- Celebrate what exists. Never count gaps, never say "you have not", never show a streak, point or badge (CLAUDE.md, content rules; J-N4: no line counts the gap).
- The tab is never empty and never an empty promise (J5): with no photo access, For you still has something true.
- No count made for measurement is ever shown to a parent (FR-DAT-03).
- Quiet when the parent is quiet: the back-off rule holds (NS-32-R8).

### 8.2 Requirements

- MT-P5-R18. Given any day, When the parent opens the tab, Then at least one card from For you is shown from own data with no library access, and none of its words count, compare, rank or guilt. Test layer: J, C.
- MT-P5-R19. Given the parent has made no letter for a long time, When they open the tab, Then it looks the same as for someone who wrote yesterday: no "we missed you", no gap line, no changed tone. Test layer: C, J.
- MT-P5-R20. Given the tab shows a number anywhere a parent can read it, When the content rule test runs, Then it fails, unless the number is a date, an age day or a month the parent typed or the date of birth gave. Test layer: C.
- MT-P5-R21. Given the same moment signal appears in the feed and in a push and an email, When a letter is made from any one of them, Then the other two do not repeat it that day, and the budget in 7.2 holds. Test layer: I.

## 9. Measurement

### 9.1 What state we are in

- Analytics is off for the whole 1.0 line (D-095, D-124 item 3; FR-DAT-01). D-163 (20 Nov) says analytics is built before the production-readiness build and supersedes D-095 for the production build only; the consent default, the wording, the PostHog account, the region, counsel's view and the content ban are not decided there, and no production flip happens until its gates close.
- Until then, the only measures are tester answers: numbers only, "x of n answered", never a percentage with n under 20, raw answers deleted after 90 days, a skipped question is not a "no" (FR-DAT-04, 05, 08).
- Free and open source tools only, one event standard (`docs/product/instrumentation/README.md`). Event names are `<area>.<object>.<action>`, snake_case, past tense, at most three segments; areas are a closed list (onboarding, capture, book, family, keeping, me, plus, notifications, system). I propose adding one area, `moments`. That is the analytics lead's call (OQ-6).
- A validator rejects names not in the registry and properties not on the allowlist.

### 9.2 Proposed events (closed allowlist; PROPOSED, nothing is built)

Every row below has no place, date, count, filename, photo, album, child name, letter id, query or length. Properties are closed enums. The screen ids come from the IA lead's ids (TBD).

| Event | Trigger | Closed properties | Why it is safe | Pair for a rate |
|---|---|---|---|---|
| `screen.moments_home.viewed` | the tab drawn in front | `via`: tab, control, back, link, system; `schema_version` | a screen view; no content | none |
| `ui.moments_card.impressed` | a For you card drawn | `kind`: occasion, day, age_day, year_ago, prompt, picked_picture; `schema_version` | the `kind` list has NO library value; a library card never emits | `ui.moments_card.tapped` |
| `ui.moments_card.tapped` | a For you card tapped | same `kind` | same | impression |
| `capture.letter.started` | a letter started | `source` (the existing closed value) | reuses the closed `source` that FR-DAT-38 allows; I add no library value | none |
| `ui.moments_ask_allow.tapped` | the plain ask's allow control tapped | none | a tap on our own control; it says nothing about what is in the library | `ui.moments_ask.impressed` |
| `ui.moments_ask_notnow.tapped` | Not now tapped | none | same | `ui.moments_ask.impressed` |
| `ui.moments_ask.impressed` | the ask drawn | none | same | taps |
| `perf.moments_first_paint.measured` | first paint of the tab | `budget_band`: within, near, over; `device_tier` | raw milliseconds stay on the phone | none |
| `system.error.raised` | a closed class | `area`: moments; `code`: picker_unavailable, library_unreadable, fallback_used | no content | none |

Properties that are flagged for privacy and counsel before any row is approved (OQ-7): the permission answer (allowed, limited, denied) as an event. I do not propose it. It is device state about the library, and the closed list in FR-DAT-27 already bans assistive-technology state in the same spirit. The tester question in 9.4 covers it without an event.

Timing note: any timestamp near a Day or a birthday is the same leak FR-DAT-38 names for a moment's date. I propose that the `moments` area is read at week level only and that the analytics lead decides whether the collector rounds the time. Not decided.

### 9.3 Events I do not propose, and why

- Anything about Recent, a library card, a day, a moment shown, tapped, dismissed or empty (FR-DAT-38, RV-8).
- The route used (A or B); an album picked; the number of pictures or videos on a letter; a video length or size; which source a picture came from beyond the closed `source` (FR-DAT-38).
- Limited, denied or granted as an event (OQ-7).
- Which Apple suggestion type was picked; any Apple title or name (never stored or shown by us).
- A count of cards, days or letters per parent.
- A streak, a return-day count or "days since" per parent. No such field exists in any event and no read-out may compute one.

### 9.4 Tester questions for the 1.0 line (fixed wording is content's; the question set is proposed)

Asked in tester rounds, numbers only, x of n:

1. Did you open the tab today without being asked? (yes, no, not sure)
2. Could you start a letter from it? (yes, no, not sure)
3. Did anything on it feel like pressure to write? (yes, no, not sure)
4. If you saw the photo ask: did Not now feel comfortable? (yes, no, did not see it)
5. Did any title or name look like the app wrote it? (yes, no, not sure)
6. Name the tab's job in one verb. (free word, scored by the researcher against the verb list, not quoted)

### 9.5 How we would read the daily reason to return, under our rules

Never a streak, never a count shown to a parent. What a read-out may say (all in aggregate, at least five people per cell, FR-DAT-08):

| Question | Measure | Source | Not allowed |
|---|---|---|---|
| Do people come back to the tab on days they open the app? | share of foreground sessions that view the tab (`screen.moments_home.viewed`) among sessions | events, after D-163 gates | per-person day counts; consecutive-day runs; "returning for N days" |
| Do cards lead to a letter? | `capture.letter.started` where `source` is a Moments value, over `ui.moments_card.impressed` | events | a per-parent list; any library card |
| Does a nudge bring people in without pushing too hard? | share of opens that began from a notification, against the daily budget | existing notification events | a count of notifications ignored |
| Does the tab leave quiet parents alone? | letters started per session for parents with and without the tab on | two TestFlight builds, 10.2 | a gap or lapse count |
| Tester numbers | section 9.4, x of n | tester round | percentage under n = 20 |

MT-P5-R22. Given any read-out, When it is written, Then it states n asked and n answered, never shows a percentage under n = 20, contains no quote or name, and no cell describes a group the founder could name. Test layer: P (read-out template, FR-DAT-08).

MT-P5-R23. Given the event registry, When Moments rows are added, Then they land in `packages/analytics/src/catalog.ts` and the generated plan in one PR before any call site, and a test fails on a property outside 9.2. Test layer: U, S.

MT-P5-R24. Given the 1.0 line (analytics off), When the tab ships, Then no analytics client is constructed, no event is queued, and a test proves it. Test layer: I.

## 10. Experiments, and what would prove us wrong

Small n. Nothing here is a statistic until n is at least 20; before that it is "x of n". All thresholds are HYPOTHESES from me (no parent evidence exists), taken from the style of the existing studies ("at least four of five", T8 in `docs/design/specs/03-SHARE-ONE-LETTER-11nov.md`).

### 10.1 Five-parent check (gate G4)

Five parents, moderated, a prototype with the fictional Asha family only. Run within one week of the first build that has the feature on (precedent in the PRD README for the other five-parent studies). Tasks:

1. Open the tab and say what it is for, in one verb. Pass: at least four of five name a verb from the content list.
2. See the value screens, then the ask. Say what the app will and will not do with photos. Pass: at least four of five say "the app only sees what I allow" or equivalent, and none say the app will write or choose words for them.
3. Choose Not now. Pass: all five reach something real, not an empty screen.
4. Choose limited access or deny at the system sheet. Pass: all five still see something true and do not feel scolded.
5. Start a letter from a card. Pass: at least four of five start without help.
6. Show a screen with an Apple-made title (Route A only). Pass: no parent believes the app made it; if any does, Route A needs a different frame.

### 10.2 Experiments

| Id | Question | Design | Reads | Proves us wrong if |
|---|---|---|---|---|
| E1 | Value first, then ask, or ask first? | moderated, order swapped across five, Asha examples | tester numbers 4 and 5 | fewer than three of five prefer value first; then the ask moves later or goes |
| E2 | Does Moments in second position help or hurt starting a letter? | two TestFlight builds with different F1 values, to separate groups, only when each has enough people (n at least 20 per group before any percentage) | letters started per session (events, once allowed); tester question 2 | the group with the tab starts fewer letters per session than the group without it; the tab is then an obstacle |
| E3 | Route A or Route B in the same frame | same five parents see both frames | task 6, question 5 | Route A makes any parent think the app wrote the title |
| E4 | Is the daily reason real? | tester question 1 over a two-week round | x of n yes | fewer than half of n say they opened it without prompting; then the "reason to return" claim is false |
| E5 | Pressure | tester question 3 | x of n | any parent says yes in a way the researcher can trace to a card or a push; any such answer blocks launch until the copy changes |
| E6 | Does a local nudge help without nagging? | tester round with the existing classes only; no new class | opens from a notification, tester question 3 | people turn notifications off after a Moments-related line |

### 10.3 What would prove the whole bet wrong

- The tab with no photo access feels empty or pointless to most parents (G4 tasks 3 and 4 fail).
- Parents with photo access say it feels like being watched.
- Starting a letter gets no easier, or harder, with the tab on (E2).
- The device spike fails on the iPhone SE (3rd gen) for both routes.
- Counsel says the Data Not Collected story cannot hold for the library part.
- Apple declines the entitlement, or review rejects the usage string, and Route B cannot be worded safely.
- A single case where a machine-made word is stored, shown or sent. That is a constitution break, not a metric; the feature stops, whatever else is true.

Each of these has a way back: F1, F2, K1, K2, K4 hide the surface without deleting a letter (R2).

## 11. Proposed backlog split

Rules followed: `docs/BACKLOG.md` numbering (BL-055 to BL-099 never used; new ids continue the block; the next free id is for the integrator). Ids below are TBD, not allocated. Every row fits one PR a reviewer can read in ten minutes, carries at most 8 ids in `Satisfies`, and names a roster owner. `Mode: agent` only when no founder account, device, vendor or secret is needed. Milestone: M15 proposed (the block where BL-1305 sits). Sizes use the repo's S, M, L; no L appears because every large item is split. Other leads' requirement ids are added by the integrator; mine are shown.

### 11.1 Rows

| Row | Title | Mode | Owner | Size | Depends on | Satisfies (mine) | Done when |
|---|---|---|---|---|---|---|---|
| TBD-1 | Founder decisions for Moments: RV-1 to RV-9, release option, tab position, as Proposed D-### drafts | human | founder | S | none | MT-P5-R7, R8 | the founder has signed or changed each default; the choice is recorded |
| TBD-2 | Flags F1, F2 and kill switches K1, K4, off by default, with the profile allow list test | agent | mobile engineer | S | TBD-1 | MT-P5-R1, R2, R3, R4 | tests R1 to R4 pass; F1 and F2 are off in every profile; bar snapshot equals today's |
| TBD-3 | Binary scan for photo-library strings and entitlement, narrowed for one allowed profile | agent | privacy engineer | S | TBD-1, BL-1305 | MT-P5-R5, R6 | the scan fails on any other profile; BL-1305's own test is kept, not weakened |
| TBD-4 | Moments tab shell and For you from own data, behind F1 | agent | mobile engineer | M | TBD-2 | MT-P5-R18, R19, R20 | R18 to R20 pass; no library import |
| TBD-5 | Value screens with Asha examples and the quiet states (Not now, limited, denied), behind F1, no ask in the binary | agent | content, mobile engineer | M | TBD-4 | MT-P5-R18 | the state table in the design doc has a test per state; content rules pass |
| TBD-6 | Local nudge classes for Moments from own data, budget held | agent | reminders owner | M | TBD-4 | MT-P5-R9, R10, R11, R14 | R9 to R14 pass; the NS-32-R1 test is extended, not loosened |
| TBD-7 | Nudge kill switch, cancellation and routing on tap | agent | reminders owner | S | TBD-6, TBD-2 | MT-P5-R12, R13 | R12 and R13 pass |
| TBD-8 | Cross-channel no-repeat rule (feed, push, email) as a pure function | agent | mobile engineer | S | TBD-6 | MT-P5-R21 | R21 passes with synthetic Asha data |
| TBD-9 | Analytics catalogue rows for Moments, DARK, and the off-by-default proof | agent | analytics engineer | S | TBD-4; analytics area approval | MT-P5-R23, R24 | rows in `catalog.ts` and the generated plan; R24 test proves no client is built in 1.0 |
| TBD-10 | Email template class test: no library or typed-day field; no nudge email without RV-6 | agent | analytics engineer, legal | S | TBD-1 | MT-P5-R15, R16, R17 | R15 to R17 pass; no template added |
| TBD-11 | Tester question bank for Moments and the read-out template | agent | user researcher | S | none | MT-P5-R22 | questions in fixed wording; template states x of n |
| TBD-12 | Five-parent check (G4) | human | user researcher | S | TBD-5 | MT-P5-R7 | read-out with the six tasks scored; failures named |
| TBD-13 | Device spike on iPhone SE (3rd gen), both routes (G1) | human | mobile engineer | M | none | MT-P5-R7, R8 | a written read-out with device numbers; stays on `exp/photos` |
| TBD-14 | Apple capability and a signed device build for Route A (G3) | human | founder | S | TBD-13 | MT-P5-R7 | a signed build shows the picker on iOS 17.2 or later; a 17.0 or 17.1 phone falls back |
| TBD-15 | Counsel read for the library part (G2) | human | legal | S | none | MT-P5-R7 | counsel's written answers on each question in the packet |
| TBD-16 | Accessibility device rows for every tab state (G5) | human | qa engineer | M | TBD-4, TBD-5 | MT-P5-R7 | rows run on the SE 3 with AX5, VoiceOver, Reduce Motion, Reduce Transparency, Increase Contrast |
| TBD-17 | Kill-switch rehearsal: pause K1, K2, K4 in a signed config and see the surface go | agent | qa engineer | S | TBD-2, TBD-7 | MT-P5-R2, R12 | the rehearsal log is in the release record |
| TBD-18 | Store text and screenshots for the first build without the library (Asha only) | agent | content | S | TBD-5 | MT-P5-R8 | listing says nothing about photo access if F2 is off |
| TBD-19 | Library part rows (after the gates): ask, Route A or B, Recent | agent | mobile engineer | M, split by the feasibility lead | G1 to G7 | (feasibility and privacy leads' ids) | not scheduled until G1 to G7 are dated in the release record |

TBD-19 is a placeholder for the library work the other leads specify; it is deliberately one line here so that this file does not invent their requirements.

### 11.2 Sizing (the count is the honest figure)

- 19 rows: 13 S (TBD-1, 2, 3, 7, 8, 9, 10, 11, 12, 14, 15, 17, 18) and 6 M (TBD-4, 5, 6, 13, 16, and the TBD-19 placeholder). Six rows are human (TBD-1, 12, 13, 14, 15, 16); the other 13 are agent rows.
- I give no hours. The repo's sizes are judgments about review load; I have no velocity figure for this team on tab work, so any number of weeks would be invented.
- Founder time is the scarce part: rows TBD-1, 13 and 14 need the founder's phone and Apple account, and TBD-15 needs counsel.

## 12. Order of work, and what a first build holds

For O2 (recommended):

1. TBD-1 (decisions), TBD-11 (questions), TBD-13 (spike), TBD-15 (counsel) start in parallel; none touches the binary.
2. TBD-2 and TBD-3 next, so the guards exist before the features.
3. TBD-4 to TBD-8, then TBD-9 and TBD-10 (dark), then TBD-16 and TBD-17.
4. TBD-12 (five-parent check) once TBD-5 is on a preview build.
5. First store build: F1 on (if the founder signs RV-1, RV-5), F2 off. Listing: TBD-18.
6. After approval: the library part, when G1 to G7 are dated. A new build; BL-1305 narrowed (TBD-3) for exactly one profile.

For O1: the same rows, but every gate must be dated before the first submission is cut, so the date is set by the slowest of G1 to G4.

## 13. Build 13 critical path impact

What I read (`23-dependency-map-and-plan.md` section 2.1): the only list of Build 13 contents is a review proposal, not a ruling. Under it, Build 13 has NS-09, NS-10, NS-32, NS-13 and NS-33 on and NS-01, NS-02, NS-37 and the export dark. The critical path is P01 (#846) so the dispatcher sees the rows, then BL-966 then BL-943 then the founder's device run with a time-zone change; items 3 to 5 run in parallel and end in a founder act; the photo stack and Find merge with flags off.

My read of Moments against that path:

- Code: I propose zero Moments code in Build 13. F1 and F2 sit off, so flag-off equals today's build (R4). If the founder wants TBD-2 inside Build 13 as inert code, it is S-size, but it touches the tab bar's route table and adds a review the mobile reviewers do not have spare; I would not do it.
- NS-32 is on the Build 13 critical path (reminders). TBD-6 and TBD-7 extend the same planner. They must wait until BL-943 is merged and device-run, or they put a second change on a planner that is waiting for a device run. This is the one place Moments can slow Build 13.
- Founder device time is shared: the SE 3 baseline (BL-929), the two-phone row (BL-978), the time-zone run (BL-943), the sign-out row (BL-961) are all queued for the same hands. TBD-13 and TBD-14 add to that queue. I propose they run after Build 13's device run, not before.
- Counsel: the packet is already the founder's queue; TBD-15 adds questions. It does not block Build 13, but a late answer blocks O1.
- Review load: every slice needs counted reviews (BL-931). Moments adds 12 agent rows. They should not enter the review queue until Build 13's rows are merged.
- Net: Moments does not belong on Build 13's critical path. It lengthens it only if it takes founder device time or reviewer time before Build 13's device run. The recommendation is to start only the no-binary rows (TBD-1, 11, 15) now.
- Not verified: Build 12 and Build 13 state today; whether the r3 proposal was ruled. If the founder rules otherwise, section 13 changes and sections 4 to 12 do not.

## 14. Edge and unhappy paths

| Case | What happens |
|---|---|
| Photo access denied or limited | For you still shows true things; no scolding; no re-ask loop; no prompt about the state (BL-1305, FR-PHS-44) |
| Not now | A comfortable close; no badge, no dot, no count |
| iOS 17.0 or 17.1 with Route A | The picker is not available; quiet fallback (G3) |
| Mac Catalyst | Apple's page says input to the picker button is ignored; not a target for us (UNVERIFIED for our build, we ship iPhone) |
| Entitlement missing in a build | The doorway is hidden at launch; nothing crashes |
| Kill switch paused mid-session | Surface hidden at next launch or focus; pending nudges cancelled; nothing deleted |
| Old signed config | New keys read as not paused (R3) |
| Parent has no child date of birth set | month and age cards are not drawn; typed days and prompts still are |
| Two phones, one account | typed days and library signals are per phone; nudges are per phone (NS-32 second-phone row); the feed may differ and that is correct |
| A letter made from a card on phone A | phone B's nudges end only after B's next pull (existing rule) |
| Notification permission off | the feed still works; nothing nags |
| Parent turns names off or App lock on | pushes carry no name, month number or age (R14) |
| Analytics later turned on | only the rows in 9.2 exist; a validator rejects anything else |

## 15. Constitution, privacy and accessibility checks

- The machine may remove and repair; it may never add meaning. No row above writes, summarises or titles anything. A label appears only if the parent typed or chose it; a machine-made title from Apple's picker is never stored or shown by us.
- No scene, place or person guess; no face matching; no place name in any event, log or crash report; reverse geocoding is not used (the safe default).
- Nothing from the library leaves the phone; the server never sees it; email therefore cannot use it. Safety tiers stay on the device.
- No streaks, points, badges, counts or gap language anywhere, including in push and email.
- Nothing implies AI writes anything. `{child}` only; no gendered child.
- Content rules in the repo apply to every string: no em dashes, en dashes, curly quotes, ellipsis characters or emoji.
- Accessibility: G5 covers iPhone SE 3, AX5, Bold Text, VoiceOver, Reduce Motion, Reduce Transparency, Increase Contrast. Notifications read plainly on the lock screen with VoiceOver.
- Door lines (PRIV-R21) for anything a person agrees to: the ask on the tab and, if ever built, an email opt-in. Each needs Shown, Records, Never and Decline. I list them as needs, not copy. Content and privacy write them.

## 16. Open questions, with my default and a deadline

Deadlines are relative to the founder's next release decision because no confirmed date exists for me to cite.

| # | Question | Default | Deadline |
|---|---|---|---|
| OQ-1 | Release option O1, O2 or O3 | O2 | before TBD-2 starts |
| OQ-2 | Tab position | Home default, Moments second (rollout view only; the IA lead decides) | before TBD-4 starts |
| OQ-3 | Lift BL-1305 for one profile (RV-3) | not before the first store build; narrow it in TBD-3 for the later build | before the library build |
| OQ-4 | Do we want email nudges at all (RV-6)? | no in the first store build; if yes, one a week at most, a guess, counsel first | before any template is written |
| OQ-5 | The brief says email can use typed days; NS-47 says typed days never leave the phone. Which holds? | the repo holds: no email from typed days | now; raised to the founder |
| OQ-6 | Add area `moments` to the closed area list, or place the events under `book` | add `moments` | before TBD-9 |
| OQ-7 | Any event for the permission answer | none | before D-163 gates close |
| OQ-8 | Is "second tab" a fourth tab or a swap in the three-tab bar | the IA lead | with OQ-2 |
| OQ-9 | Does Apple add an approval step behind the Journaling Suggestions capability | UNVERIFIED; the founder checks in the developer account while doing TBD-14 | before TBD-14 |
| OQ-10 | The cadence of a Moments-derived local nudge inside NS-32's one a day | no new class; reuse evening, month and birthday; the content lead may propose lines | before TBD-6 |

Founder decisions, listed for the journal: RV-1 to RV-9, OQ-1, OQ-2, OQ-3, OQ-4, OQ-5.

## 17. Dependencies

- Feasibility doc (routes), privacy and constitution analysis, the design concept, PR #1264 (Home engagement wheel), and the B1 benchmark doc (branch `wip/moments-b1`, not on the remote when I wrote this). I reconcile on arrival. If PR #1264's wheel puts a push class on Home, section 7.3 and R10 must agree with it.
- NS-32 planner work in Build 13 (BL-943) before TBD-6.
- Analytics standard (`00-event-standard.md`) when it lands, for the `moments` area.
- Content: parent words with one verb, the ask, the neutral line, the value screens.

## 18. What is VERIFIED, UNVERIFIED, and a guess

VERIFIED (read this session):

- `packages/api/src/kill-switches.ts`: flags and switch behaviour (hide, never turn on; older configs read as not paused).
- BL-1305 text in `docs/BACKLOG.md`.
- NS-32-R1, R4, R8, R11, R12 in `docs/product/prd/11-foundations.md`; NS-13-R30 quiet hours in `09-capture.md`.
- FR-DAT-04, 05, 08, 27, 38 in `data-and-measurement.md`; FR-MKT-44 in `functions/marketing.md`; E75, E76, E79 in `18-errata-after-lock.md`.
- D-095, D-124 item 3 and D-163 text in `docs/DECISIONS.md`; D-130 dates in `docs/release/dates.json`.
- `docs/product/prd/23-dependency-map-and-plan.md` section 2.1 (Build 13 chain).
- Apple: the Journaling Suggestions framework page (iOS 17.2 and later, special entitlement, no extra authorisation, Mac Catalyst ignores picker taps) at https://developer.apple.com/documentation/journalingsuggestions.md; the entitlement page (enable the Journaling Suggestions capability in Xcode) at https://developer.apple.com/documentation/BundleResources/Entitlements/com.apple.developer.journal.allow.md.

UNVERIFIED:

- The text of ML-3, ML-6 and the NS-51 neutral wording: quoted from the brief; I did not find them in the repo with a search.
- The state of Build 12 and Build 13 today; whether the r3 contents proposal was ruled; whether the D-121 target of Tue 1 Dec still stands.
- Whether Apple adds an approval step behind the capability; whether reverse geocoding sends coordinates to Apple.
- That the B1 doc, the feasibility doc, the privacy doc and the concept doc say what I assume (I assumed: Route A and B both exist; the privacy lead keeps "no place"; the concept puts the tab second or default).
- That the repo's NS-47 rule ("typed days never leave the phone") is still current; I read it only through BL-1307.

A GUESS (labelled): the five-parent thresholds ("at least four of five"), the one-email-a-week ceiling, the kind list in `ui.moments_card.*`, and M15 as the milestone.
