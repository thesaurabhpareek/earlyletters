# Design conformance: what engineering builds against what design says (21 Nov 2026)

Status: DRAFT for Karma (CTO), 21 Nov 2026 (UTC). Author: `design-systems`. Docs only: no code, token, string, card or legal text changes in this PR. Founder ask: make sure engineering is working with the latest designs and all changes.

ASCII only. All words quoted from the code or the design files are PROPOSED unless a file says BUILT; nothing here is final copy and nothing here is a promise to a user. `{child}` stays `{child}`.

Tags used for each audit finding:

- `DEVIATION`: the code differs from the latest design.
- `DESIGN-SILENT`: no spec covers it; design must draw or rule.
- `STALE-DESIGN`: a design file contradicts a later ruling, erratum or card; the design file is what to fix.
- `OK`: checked, matches.
- `[U]`: I could not verify it from what I read.

## 0. What I read, and what I could not

Read from `origin/develop` at `5f8a44699` (fetched 21 Nov 2026): `CLAUDE.md`; in `docs/design`: `IA-FINAL-20nov.md` (outline and the rows each lane needs), `SCREEN-PATHS-20nov.md` (PATH-08, PATH-09, PATH-10), `SPEC-SYNC-20nov.md` (in full), `DESIGN-SYSTEM-DELTA-20nov.md` (section 0 and 1), `DESIGN-GAPS-21nov.md` (in full), `specs/01` (in full), `specs/06` section 4a, `specs/08` to `specs/11` (in full), `specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md` sections 5.4 and 6, `PHOTOGRAPHY.md`, area files `e2e/A-capture`, `B-book-and-reading`, `C-keeping-and-trust`, `D-family-sharing-reminders`, `E-foundations-and-system-states` (the rows named below, by search), `e2e/RULINGS-20nov.md` rows 25 to 33; `docs/product/prd/01-photo-with-a-letter.md` rows R2 to R42 and `GAP-LOG.md` CL-116; `docs/tdd/new-scope/12-first-run-5.md` (the FP table); the mobile briefs `BRIEF-BL952-8`, `BL943`, `BL953` to `BL957`.

Not read in full, said plainly: `DESIGN_LANGUAGE.md`, `COMPONENT_LIBRARY.md`, `COMPONENTS.md`, `MOTION.md`, `SOUND.md`, `NOTIFICATIONS.md`, `A11Y-AND-TYPE-AUDIT-20nov.md` (headings and the rules the audit PRs cite only), `IA-FINAL-20nov.md` line by line, most of the area `MOTION.md` files. `PHOTOGRAPHY.md` was read; it governs marketing and intro stills (no children, hands and places only) and has no rule for the parent's own pictures, so it does not bind the photo stack.

PR evidence: for every PR in the ask I read the REST `pulls` record (state, head sha) and the full diff for the files that draw or word something. Test files were not read line by line. No screen was run on a device or simulator. No VoiceOver, Dynamic Type or Smart Invert run. Everything about how a screen looks or reads is from code and design text: `[U]` until a device row (`docs/qa/DEVICE_TEST_PLAN.md`, `docs/product/prd/14-test-plan.md` section 5) passes.

PR heads read (all REST, 21 Nov 2026):

| PR | State | Head |
|---|---|---|
| #1126 | merged | `1da68e6e0` |
| #1128 | open | `c0820d120` |
| #1167 | merged | `79712369d` |
| #1172 | open | `7451091bc` |
| #1173 | open | `208d626fa` |
| #1175 | merged | `3f793cbac` |
| #1208 | open | `20b421f80` |
| #1226 | open | `5035be170` |
| #1230 | open | `bae299cb4` |
| #835 | open | `4b186bab7` |
| #836 | open, base #835 | `836d5e89f` |
| #837 | open, base #836 | `8e79a73b6` |
| #838 | open, base #837 | `d31f431bd` |
| #839 | open, base #838 | `71d270de1` |
| #840 | open, base #839 | `a5e755c0e` |

## 1. Upcoming lanes: the design each must be built from

Rule for this table: a builder opens the "Build from" column first, then the area file for the screen id. Where the column says "no spec", the lane is blocked on design, not free to invent. "Open gaps" lists ids from `DESIGN-GAPS-21nov.md` (GAP-nn) and open items from `SPEC-SYNC-20nov.md` (OI-Sn), plus the findings of section 2 (F-nn) that the lane meets. Words are always PROPOSED or CONTENT-NEEDED; no lane may ship a sentence as final without `content` and the founder.

| Lane | Build from (file, section) | Screen ids | Open design gaps that block or shape it |
|---|---|---|---|
| FP-6 (NS-40, NS-41: `region_refused`, signIn pause, Apple on outage) | `docs/design/e2e/E-foundations-and-system-states/DESIGN.md` (J-E03, section 6c: `E-S04.refused-region`, `E-S14.signInPaused`), `SCREEN-PATHS-20nov.md` PATH-07 (code expired or paused), E WORDS `system.region.*` | E-S04, E-S06, E-S14 | Words `system.region.*` are HOLD or PROPOSED (content, counsel). E62 (20 Nov) puts the refusal after the code step; the E area text says "only at sign-up (step 6)"; I read both and did not confirm they agree: [U], design-systems to reconcile when FP-6 opens. GAP-09: E-S04 names no dark, offline or empty state in INDEX; E-S06 names dark but no offline or empty. No GAP-nn row is specific to FP-6. |
| BL-943 (reminders anchor, back-off, landing) | `e2e/D-family-sharing-reminders/DESIGN.md` D-S04, D-S06 (states off, on, denied, backedOff, lateClamp, appLock, ax5), D-S10; `SCREEN-PATHS-20nov.md` PATH-03, PATH-13; `SPEC-SYNC-20nov.md` E79, E82 | D-S04, D-S06, D-S10 | Rule from the brief and card: no screen says reminders slowed. OI-S2 (D-S26 specimens and D-S06 preview not redrawn for E82). F-08c, F-08d (words for the neutral month and birthday notes). GAP-10 (no AX5 or Bold Text row for settings pages). |
| BL-953 (stored copy cap 4,032 px) | card 01 R37a (`docs/product/prd/01-photo-with-a-letter.md`) and `BRIEF-BL953-stored-copy-cap.md`; spec 01 does not state the cap | none on screen | None for design. Native only. Blocked on BL-931 (#835 to #840). |
| BL-954 (Undo windows, one clock) | `COMPONENTS.md` 2.14 (toast); `specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md` section 5.4 (toast at accessibility sizes); card 01 R38a to R38c; CL-116 C-02 | A-S12, B-S11 | Blocked on design-systems row 33-3 (`createUndo`; the row id is in `docs/tdd/new-scope/11-foundations.md` line 120 and the "not on develop" claim is `BRIEF-BL954`'s, which I did not re-check against code beyond `toast.logic.ts`; not on develop: `toast.logic.ts` has no such export). That row is owed by `design-systems`, not by mobile. F-22. |
| BL-955 (picture survives a kill) | `specs/01` section 3.2 and 4 (Ready, Review); area A DESIGN A-S04 `readyPhoto` (Ready with a picture), A-S06 `withPhoto` (Write), A-S07 | A-S03, A-S04, A-S06, A-S07 | Conflict E2 (write the stored copy at Speak or at Ready) is for Karma and design-systems per the brief; no design file rules it. DESIGN-SILENT until ruled. |
| BL-956 (pictures at large text, Smart Invert, fit, lens list copies) | area A DESIGN A-S04 "Ready with a picture" AX5 paragraph (88 pt from AX3); area B DESIGN B-S04 (lens thumb 72 pt, fit, uncropped, AX5 stack to 160 pt); RULINGS row 27 (`mediaFrame`) | A-S04, B-S04, B-S08 | Token `mediaFrame` is not in `packages/design-tokens/src/tokens.ts` (F-12); owed by `design-systems`. F-15, F-25 to F-27 are this lane's own list. 88 pt confirm: the brief asks design-systems to confirm; design-systems confirms it (it is the A DESIGN default, O-4, and the code already follows it); see section 2 under #838. |
| BL-957 (one length rule: 140, 60, 40, 30) | `specs/01` section 9 (photo words and place), card 01 R21; E area DESIGN (From name) | A-S06 Write with a photo | The photo words and place fields are hidden in `production` builds until a native writing-tools setting exists (F-21). The spec says typed words are the only text alternative; design must rule what a parent gets in production. |
| Find, screen BL-952 slice 8 (mode and header) | `specs/02-FIND-11nov.md`; area B DESIGN B-S06 (states idle, short, noMatch, failed, offline, planLapsed, killSwitch, cjk, rtlRow); `IA-FINAL-20nov.md` section 4 (Book) | B-S06 | The brief says the Book header needs "a layout the design-systems spec does not draw" as a stop-and-ask. `book.tsx` is shared with #840, BL-938, BL-937. Wait for #840 to merge. Words `book.empty.searchTitle` (R39) are content's. GAP-09 (columns AX5, Dark, Offline, Error, Empty): B-S06 is yes for the first four and no for Empty. |
| The Days page and its moves and hemisphere | area C DESIGN C-S24, C-S25, C-S26 (lines 569 to 604: hemisphere control `.hemisphere`, `.whichDate`, `.noDateNextYear`, `.unavailable`); `SCREEN-PATHS-20nov.md` PATH-10; card 21 | C-S24, C-S25, C-S26 | OI-S3 (where a heritage-months group sits, not ruled). OI-S9 (heritage group has no states). OI-S10 (a tick that cannot be saved, a new phone, App lock on, paused family: not drawn). F-10 (days store failure). Heritage and regional layers are PROPOSED (#1055) and regional days are not in the first drop. |
| Add a book | `specs/10-ADD-A-BOOK-21nov.md` (AB-1, proposed id C-S28) | C-S28 (AB-1) | GAP-05 spec-PR (#1188). ERR and FUL lines are CONTENT-NEEDED. Whether the first-run promise line returns is not ruled (product). Row names "Add a book" and "Books" are PROPOSED (IA OI-3). `addChild` has no catch [U]. |
| Spoken language | `specs/11-SPOKEN-LANGUAGE-21nov.md` (SL-1 page C-S29, SL-2 picker C-S29.picker) | C-S29 (SL-1, SL-2) | GAP-06 spec-PR (#1189). Unavailable-reason line in the picker is CONTENT-NEEDED. Whether changing the primary confirms a speech-model download is open (mobile to say the size). |
| Your words | `specs/09-YOUR-WORDS-21nov.md` YW-1 (built page: default view choice) | no id yet (GAP-03) | GAP-03 and GAP-04 are RULINGS for product: which page owns the name "Your words", and is a taught-names list in 1.0. No taught-names page is built or drawn. Builders: do not build PATH-12's list under this route until ruled. |
| Legal and Licenses pages | `specs/08-LEGAL-AND-LICENSES-21nov.md` (L1, L2) | proposed E-S33 and E-S35 | GAP-01, GAP-02 spec-PR (#1186). ID COLLISION: `SPEC-SYNC-20nov.md` already gives E-S33 to the analytics ask and E-S34 to the confirm page, and spec 08 gives E-S33 to Legal (F-32). ERR and SLO lines are CONTENT-NEEDED. The licence list is about 150 rows: virtualised, rotor headings and expanded-state announcement are UNVERIFIED in the build. |
| Notification settings (Me, Reminders) | area D DESIGN D-S06; `SCREEN-PATHS-20nov.md` PATH-03, PATH-13; `IA-FINAL-20nov.md` section 10; `SPEC-SYNC-20nov.md` E79 (no "push"), E82 | D-S04, D-S05, D-S06, D-S10, D-S26 | OI-S2 (specimens). `SPEC-SYNC-20nov.md` section 5a Q3 (switch far down the row at AX5; `ToggleRow` change is mine to spec, mobile builds). GAP-10 (no AX5, Bold Text, Voice Control row for settings pages). F-08c, F-08d. |
| New-device email page `/not-you` (PROPOSED id E-S34, web) | `SCREEN-PATHS-20nov.md` PATH-08; `SPEC-SYNC-20nov.md` E83 and section 4 flag 2 | E-S34 | Every word is CONTENT-NEEDED. The page lives in `apps/web`, which is not in the checkouts I read: web tokens UNVERIFIED. The email template copy is stale (reply to this email, "We will sign that device out"). First view must be read-only (a scanner must change nothing): a test requirement, no design state. |
| App lock and privacy settings | `SCREEN-PATHS-20nov.md` PATH-04 (Face ID), PATH-05, PATH-06 (analytics ask and row); area E DESIGN E-S22 and J-E23; area C DESIGN C-S23; `SPEC-SYNC-20nov.md` 2.2 | E-S22, E-S33 analytics (PROPOSED), C-S23 | OI-S5 (what the app does if Face ID is later turned off in iPhone Settings: not in any source). The line before the Face ID switch turns on is CONTENT-NEEDED. `PermissionPrimer` is not yet extracted from `listen.tsx`. `SPEC-SYNC-20nov.md` section 5a Q3 (`ToggleRow` at AX5). OI-S7 (crash-data wording mismatch: do not turn analytics on in production until the words match what is sent). The session-3 lock offer card (E-S18) is not built and not in #1128: the first-run offer is gone, the later one does not exist yet [U which build]. |

Also true for every lane: GAP-07 (the Settings stack title "Settings" over a body that the tab calls "Me") and GAP-08 (which of four Photos-access ids survives; the design decision is that no Photos access screen is drawn while the system picker is the choice, OI-S11) are rulings, not drawings.

## 2. Audit findings

Method: for each PR, the governing design section, then each deviation. Findings are numbered F-nn so builders can cite them. Per-PR one-line fixes are in the final report; the table at the end of this section repeats them.

### 2.1 #1128 (lock offer removed from first run), open, head `c0820d120`

Governs: area E DESIGN section 6 J-E (Home "no sheet, permission prompt, Plus surface or lock offer in front", NS-39-R2); `specs/FIRST-RUN-AND-SIGN-IN-JOURNEY-10nov.md` section 3.3 and row A3; NX-31-R14.

| Id | Tag | Finding |
|---|---|---|
| F-01 | OK | `LockOffer` is no longer drawn on "The book is open." (E-S08). Matches the journey spec ("lock offer REMOVED from here") and E DESIGN. Settings, App lock stays the one door until the session-3 offer exists. |
| F-02 | STALE-DESIGN | `specs/FIRST-RUN-WORDS-10nov.md` line 15 still says the lock is "offered once at the end of first run in the code on develop today". Line 121 of the same file already corrects it. design-systems to strike line 15. |
| F-03 | OK [U] | The age-gate change (a No also drops a held email sign-in link and the typed address) has no screen. I did not check whether `components/app-lock/lock-offer.tsx` is now unused; if it is, mobile removes it with the offer's tests. |

### 2.2 #1167 (consent sheet stops reading books when the route will ask), merged, head `79712369d`

Governs: area C DESIGN C-S10 (the route draws "No book here yet"), C-S11 (the sheet is only the consent).

| Id | Tag | Finding |
|---|---|---|
| F-04 | OK | The sheet no longer draws its own "No book here yet" step; the first-run route (C-S10) draws it. Matches C DESIGN. Nothing new on screen. The hand-off (sheet closes, then the "Opening your book" screen) needs a device look for a flash of the wrong screen: [U]. |

### 2.3 #1173 (new phone retry; method line), open, head `208d626fa`

Governs: area C DESIGN C-S10 states `.slow`, `.offline`, `.noBook`, `.wrongAccount`, `.held`; C WORDS rows `auth.account.signedInWith.*` ("the method line, read first", on `.wrongAccount`); NS-10-R8, R10, R11, R12.

| Id | Tag | Finding |
|---|---|---|
| F-05 | DEVIATION | The method line ("Signed in with Apple" and the like, from `auth.account.signedInWith.*`) is appended to the end of the body string as `body + " " + method + "."` on three screens (slow, held, no book here). The design draws it as its own line, read first, on `.wrongAccount` and the no-book screen only. Appended text is read last, wraps into the paragraph at AX5 with no separation, and adds a full stop the key does not carry. It is also on slow and held, where C DESIGN does not draw it. Fix: give `StateScreen` an optional `lead` line (own `Text`, `footnote`, before the title or body, in reading order first) and use it for no-book and wrong-account only, or ask design to add it to slow and held. |
| F-06 | DESIGN-SILENT | When Try again is pressed after the 10 second window is already spent, the code keeps the old clock (`began` is kept), so the screen can settle straight back to the same view. No design file says what the person sees or hears on that tap (a still line, a polite announcement, anything). A silent tap on a retry is the failure a person reads as "broken". Needs design: one polite line, or a rule that Try again always shows the opening screen for a short beat. [U] whether the hook shows a beat; I read the logic, not a run. |
| F-06b | OK | The one automatic re-ask of a lost answer inside the same 10 seconds has no new screen; the person sees "Opening your book" until the window ends, then "No book here yet" (fail-safe direction). Matches NS-10-R11 as the brief states it. |

### 2.4 #1126 (held screen BL-922a), merged, head `1da68e6e0`

Governs: area C DESIGN C-S10 `.held` (U1 line 167: "Finish setting up to open your book." with "Finish setup" primary and "Try another way" quiet; "Never the child step"); C WORDS `auth.newPhone.needsConsentBody`; `C-S11.declined` (four actions); NS-10-R0, R4a, R4b.

| Id | Tag | Finding |
|---|---|---|
| F-07a | DEVIATION | The held screen shows four actions: Finish setting up (primary), Try another way, Delete account and the export link (three quiet). The design draws two on `.held`; the four-action list is `.declined`. The code folds R4a and R4b into the held screen. Fix: product decides; if four stay, design-systems updates C-S10.held (this is a good change for a held account: a way out is always reachable) and mobile checks AX5 stack on an SE 3; if two stay, delete and export move behind the sheet's Not now, as designed. |
| F-07b | DESIGN-SILENT | The heading is the "Opening your book." heading of state A (`t.loading`), reused. On a held screen nothing is opening; a person who reads it, and VoiceOver announces it through `Arrives`, is told something false. The design names the body line, not the heading. Needs design and content: one true heading (words PROPOSED, from `content`). |
| F-07c | DEVIATION | Key `auth.newPhone.consentBody` in code; the design registers `auth.newPhone.needsConsentBody`. The sentence is the same ("Finish setting up to open your book here."). Registry mismatch only; content aligns the key or the file. |
| F-07d | DEVIATION | `auth.newPhone.nothingToCopy` ends "recordings are on the phone that made them". The design key `declinedNothingHere` says "recordings and pictures are on the phone that made them". With the photo stack on, the code line is incomplete. Content aligns; it is a claim line (CLAIM), so counsel-read. |

### 2.5 #1172 (reminder category, placeholder, names-off lock screen), open, head `7451091bc`

Governs: area D DESIGN D-S10 (`birthday-neutral`, `<class>-hidden`), D WORDS (placeholder rows 287 to 290, `days.lock.body.neutral`), `SPEC-SYNC-20nov.md` E82, CL-119, G-D21.

| Id | Tag | Finding |
|---|---|---|
| F-08a | OK | One neutral placeholder line for a hidden preview, no name, count, day or brand; level `active`; no title for hidden previews. Matches D WORDS G1. The Settings preview (D-S06 "How it will look") reads the planner, so it follows this change: OK by construction, [U] until run. |
| F-08b | OK | With names off, month and birthday notes carry no month number, no age, no "A year of letters." and no "birthday". Matches E82. |
| F-08c | STALE-DESIGN | D WORDS line 740 ("body ... stays") and D DESIGN G-D29 and Q-D-5 (keep "Month 4 begins" on a lock screen) predate E82 (20 Nov, later). E82 wins. design-systems updates D DESIGN G-D29, Q-D-5 and WORDS 740, and redraws the D-S26 specimens (OI-S2). |
| F-08d | DESIGN-SILENT | The names-off body, "A day you chose to mark. A few words, if you like." is `days.lock.body.neutral`, written for a day the parent ticked. #1172 reuses it for the child's month note and birthday, where the parent chose no day. The sentence is then untrue for those two. E82 says reuse the neutral body; no file says which sentence is true for a month or a birthday. Needs design and content: one neutral body that is true for all three, or two. |

### 2.6 #1208 (Find account guard), #1230 (new-device report), #1175 and #1226 (days store and tick)

| Id | Tag | Finding |
|---|---|---|
| F-09 | OK | #1208 (head `20b421f80`): no screen. Matches CL-123 and X4-R1 ("B's screens show nothing about A"). It must not add any "signed in as another account" line to Find; the diff adds none. |
| F-09b | OK | #1230 (head `bae299cb4`): no screen, no in-app line. Matches E76 (no "we emailed you" banner) and E83. The web page `/not-you` (PATH-08) is still unbuilt; see lane table. |
| F-10 | DESIGN-SILENT | #1175 (merged, `3f793cbac`) and #1226 (`5035be170`) build the days store, the write queue and typed ticks. No screen changes. But the queue makes a tick asynchronous, and no design says what the person sees when a tick cannot be saved (`C-S24.store-unavailable`, OI-S10), or when a queued tick fails after the row already showed ticked. Needs design before the Days page UI lane starts. [U] what the store does on failure; I read the diff, not a run. |

### 2.7 Photo stack #835 to #840 (BL-931)

Governs: `specs/01-PHOTO-WITH-A-LETTER-11nov.md`; card 01 (`docs/product/prd/01-photo-with-a-letter.md`, rows R1 to R61); area A DESIGN A-S03, A-S04 (Ready with a picture), A-S06 (Write), A-S07; area B DESIGN B-S04, B-S08; RULINGS rows 27 and 31; CL-116 C-01 to C-10; `specs/NS-33-ACCESSIBILITY-FLOOR-20nov.md` section 6; tokens in `packages/design-tokens/src/tokens.ts`.

Where the stack is OK, said once: the photo start is absent (not greyed) with the switch off (`photoStartShows`); it is a quiet `md` button with a leading `Image` glyph, third in the cluster, with a VoiceOver hint; the Ready thumbnail is fitted (`contain`), at most 160 pt and at most 88 pt from AX3; the picture's accessible name is the parent's words or the fixed phrase and never generated (`photoA11yLabel`); the lens is one radio group of two (`ChoiceGroup`), built to NS-33 section 6, so "Go to a month" and "Months" are not the same name; the lens is absent with no picture and carries no count and no add control; the lens skips quiet-day marks and is built from list data; the picture is replaced by an opaque box when the app is not in front (R13a); copy comes from `packages/content` with a PROPOSED mark on every line; no machine text about a picture exists.

#### #835, #836 (stores, stored copy), #837 (picker adapter and pending picture)

| Id | Tag | Finding |
|---|---|---|
| F-11 | DEVIATION | #837 (`8e79a73b6`): the picker reports no download progress and no Cancel for an iCloud-only picture (`picker.ts` says so). PATH-09 SLO draws a still placeholder with "Getting your picture" in text; card R17b asks for progress and Cancel. On Home the button only goes `busy` and disabled. Fix: until the native side reports progress, show the PATH-09 SLO line (a words-only line, no percentage, polite announcement) while `busy`, and keep Cancel reachable; mobile and content (words CONTENT-NEEDED). #835 and #836: no screen, OK. |

#### #838 (photo-first capture on Home), open, head `d31f431bd`

| Id | Tag | Finding |
|---|---|---|
| F-12 | DEVIATION | `PhotoFrame` draws a raw `borderWidth: 1` in `c.line`. RULINGS row 27 and card R41 set the frame colour to the semantic token `mediaFrame` (dark `#716A62`, light keeps `line`, 3:1). In dark, `line` is `#33302C`, far under 3:1 on the page. Two causes: (1) mobile uses `line` and a raw width instead of `tokens.stroke.control`; (2) the token `mediaFrame` does not exist yet. The token and its pair tests are owed by `design-systems`. Fix: design-systems adds `mediaFrame` with pair tests (next token PR); mobile then swaps `c.line` for it and the width for `tokens.stroke.control`. |
| F-13 | DEVIATION | Area A DESIGN A-S04 "Ready with a picture" (`readyPhoto`): Speak and Type as the 64 pt twins in the thumb zone, no red circle. #838 keeps the red circle and adds a quiet `md` "Type" under it. Fix: product and design-systems confirm which wins (card R20b names "Speak, Type" as the order; the code matches spec 01 3.2 and the card's wording, not A DESIGN); mobile builds the twins if A DESIGN stands. Until then F-13 is open. |
| F-14 | STALE-DESIGN | `specs/01` section 3.2 says the prompt on Ready is replaced by a photo-aware line (`capture.photo.ready`) and the "Let it go" confirm carries a `capture.photo.dropNote` line. Card R3 says the prompt is chosen by the same function as without a picture. The code follows the card (no `ready` key, prompt kept). A DESIGN A-S11.confirmPhoto exists ("the picture goes with the recording", R16c) but the code adds no line to the Let it go confirm either [U: Review's confirm may already carry it]. design-systems strikes the `ready` slot from spec 01 3.2; mobile and content decide the confirm line against A-S11.confirmPhoto. |
| F-15 | DEVIATION | No picture in #838 to #840 sets `accessibilityIgnoresInvertColors` (a repository search finds none on develop or in the three diffs). Card R40 and area B DESIGN rule 10 require it. Known: BL-956. Fix: set the prop in `PhotoFrame` once, for every picture. |
| F-16 | DESIGN-SILENT | Home's error line sits under the photo start button, not under a thumbnail (there is none yet). Spec 01 section 6 draws the error under the thumbnail; PATH-09 draws a notice with Try again and Choose another. The code shows one calm line only. Needs design to confirm that one line is enough, and that the retry is the button itself. |
| F-17 | DEVIATION | `ErrorLine` is copied into `components/photos/error-line.tsx` because the sign-in `ErrorLine` pulls in `expo-apple-authentication`. The file says it is a follow-up for design-systems. That follow-up is design-systems': extract one `ErrorLine` (or the delta's `Notice`) into `components/ui`, then mobile deletes the copy. It also sets `ReduceMotion.Never` on a 150 ms fade; that is within the 200 ms fade rule, but the call should come from `lib/motion`, not be repeated. |

#### #839 (photo on Review and the letter page), open, head `71d270de1`

| Id | Tag | Finding |
|---|---|---|
| F-18 | STALE-DESIGN | The code draws the picture between the dateline and the words (CL-116 C-01, ruled 20 Nov: the picture sits above the words; cards 01 and 10 say so). `specs/01` section 4 and `specs/06` section 4a still list the photo after the words. area B DESIGN B-S08 (line 326) already says above. design-systems updates spec 01 section 4 and spec 06 4a order and VoiceOver order (heading, From line, picture, words). |
| F-19 | DESIGN-SILENT | The picture size on the letter page is three raw constants in `lib/photos/surface.ts` (`LETTER_PICTURE_COLUMN_RATIO` 0.75, `LETTER_PICTURE_WINDOW_RATIO` 0.4, `LETTER_PICTURE_AX_MAX_PT` 120), marked PROPOSED "to become a design token with a pair test (design-systems)". No design file sets them. The Ready thumbnail constants (160, 88) are also outside the token file. Needs design: design-systems decides the numbers and adds them as tokens; until then mobile leaves the constants and does not copy them elsewhere. |
| F-20 | DEVIATION | `specs/06` section 4a (and IA-R11) put the photo actions inside the "Add to this letter" group: a level 2 heading and quiet rows of 56 pt minimum. #839 draws up to four loose `quiet md` (44 pt) buttons (Words about this photo, Change photo, Take the photo off, plus Add) after the player, with no group heading. Reasonable while "first" and "seal" do not exist, but it is not the drawn page. Fix: wrap in the group when the second action lands; until then make the rows 56 pt and keep gap at least `space[2]`; mobile confirms with design-systems. |
| F-21 | DESIGN-SILENT | The photo words and place fields are shown only outside `production` (`photoWordsFieldsShown`, because iOS writing tools cannot be turned off on a field; R50). Spec 01 section 8 says the typed words are "the only text alternative". In production a parent therefore has no way to give a picture a text alternative, and VoiceOver reads only "Photo with this letter". Needs design and product: either the fields ship with a native setting, or the spec states plainly that 1.0 has no per-picture alternative text and why. Not a code error. |
| F-22 | DEVIATION | The Undo toast has no timed window: card R38 and CL-116 C-02 require 10 seconds on one clock owned by the toast, refusing Undo at the same moment. The code passes `onDismiss` and a separate settle, and the toast has no timer while an action is present. This is BL-954, blocked on `createUndo` (row 33-3), which is design-systems': it must land first. |
| F-23 | OK [U] | Replace confirmation uses a native `Alert` with two buttons. Spec 01 asks for two buttons of equal weight; iOS draws a cancel-style button bold, so the weights differ. Accept for 1.0, confirm on a device. |
| F-24 | OK | The missing-file box ("Not on this phone any more" with a quiet Remove for the author only) and the "photo did not come along" line (announced once, no cause named) match spec 01 section 6 and R17a. The Review variant correctly leaves out "your words are kept". |

#### #840 (the Book's Photos lens), open, head `a5e755c0e`

| Id | Tag | Finding |
|---|---|---|
| F-25 | DEVIATION | `LensCard` draws the thumbnail as a 72 pt square with `PhotoFrame`'s default `fit="cover"`, so a panorama or tall picture is cropped. B-S04 and R42 say fit, uncropped; at AX5 the thumbnail should stack above the words "at the card's width up to 160 pt tall", but the code keeps 72 by 72. Fix: pass `fit="contain"` and size the stacked form by `useIsAccessibilitySize`. Known: BL-956. |
| F-26 | DEVIATION | Radius: B-S04 draws `radius.sm` for the lens thumbnail; `PhotoFrame` uses `radius.md` for all. Spec 01 says `md`. The two design files disagree; the later is B DESIGN (20 Nov). Fix: design-systems confirms one (recommend `sm` for the 72 pt thumb, `md` for the letter page) and updates spec 01; mobile adds a `radius` prop. |
| F-27 | DEVIATION | The lens card shows the stored copy (`photoUri`), not the list copy (card R53, B-S04 `.many`, NS-37). Known: BL-956 PR b, after BL-932. A missing thumbnail draws an empty framed box; B-S04 says `.thumbMissing` is a card without a thumbnail and no error. Fix: on `onMissing`, drop the frame. |
| F-28 | OK | `LetterCard` with a leading thumbnail hides the thumbnail from VoiceOver and reads the card once, then the picture label, joined by one stop (`cardLabelWithPhoto`): matches spec 01 section 8. Row hint is the Book card's own. No count in any string. |
| F-29 | DESIGN-SILENT | When the Photos lens is on, the Months control in the bar and cover band is renamed "Go to a month" (CL-116 C-09, matches NS-22 s3) and is hidden while Photos shows. No design file draws the Book header with the lens row and the renamed button together at AX5 (the header grows by one row plus the choice group's stacked form). Needs a B-S04 AX5 frame. |

#### Cross-cutting, all of #838 to #840

| Id | Tag | Finding |
|---|---|---|
| F-30 | OK | Dynamic Type: no photo screen sets `allowFontScaling={false}` or a fixed font size; all text goes through `Text` variants. The only raw sizes are the thumbnail constants (F-19) and the 20 pt glyph in `ErrorLine` (the sign-in `ErrorLine` uses the same). |
| F-31 | DEVIATION | Empty, loading, error, offline: Home start, Ready, Review, letter page and lens have error and missing states; none has a drawn loading state (spec 01 section 6: a flat `surface` box until ready). The frame does have `backgroundColor: c.surface`, so the box exists, but nothing announces a long stored-copy write on Review ("Adding" label under the strip, ML-S5). Fix: mobile adds a still "Adding" line while `adoptPendingPhoto` runs, words from content. [U] whether it is quick enough to need it. |

### 2.8 Index of fixes by PR

Each finding above carries its own fix in the Finding column; there is no separate index.

## 3. Rules for builders and reviewers (the design lens)

For a builder, before opening a PR:

1. Start from the spec and the area file for the screen id, not from memory. If the cards (`docs/product/prd`) and a design file disagree, the later ruling wins (CL-116 is the model: "the picture sits above the words"), and you say which one you followed in the PR body. Never silently pick the older.
2. A state you cannot find in the design is a DESIGN-SILENT state: stop and ask `design-systems`. Do not invent the screen and do not ship a silent dead end. Name the id (for example OI-S10) in the PR.
3. Every colour, size, radius, stroke and duration comes from `packages/design-tokens/src/tokens.ts`. A new constant that is really a design value (a picture height, a ratio) is a token request to design-systems with a pair test, not a `const` in `lib`. The PROPOSED constants in `lib/photos/surface.ts` are the example of what not to repeat.
4. A library component first: `components/ui/**`. Do not copy a component to avoid an import (the photo `ErrorLine`); ask design-systems to extract it.
5. Words come from `packages/content` only, marked PROPOSED, with the key the design file names. A key that differs from the design file is a registry bug (F-07c).
6. Dynamic Type to AX5 with letter text never truncated, 44 pt targets (56 pt for object-action rows), VoiceOver order as the design lists it, Reduce Motion fades only, colour never the only signal, both themes. Each new screen lists its AX5, dark, empty, offline and error states or says "n/a" and why (DESIGN-GAPS section 3 rule).
7. Release switches (`EXPO_PUBLIC_*`): a surface that is off is absent, not greyed; a hidden control never leaves a footer pointing at it.
8. No screen says "push", "your religion", "your tradition", "AI", a count of gaps, a streak, or a lock-screen age with names off. No newsletter or offers opt-in anywhere (SPEC-SYNC section 2.4).
9. A page of words about what a person agrees to carries Shown, Records, Never and Decline lines (COORDINATION section 10, PRIV-R21), written in the spec, not invented in the PR.
10. Nothing here is verified on a device. A device row (`DEVICE_TEST_PLAN`, SE 3 at AX3 and AX5, Bold Text, Smart Invert, Voice Control, Switch Control, VoiceOver) is what turns a `[U]` into a pass.

For a reviewer (design lens), a PR with a screen change is not "approved" until:

1. The PR body names the spec id and section it was built from, and the diff matches it; each deviation is listed with its reason.
2. Searching the diff for `fontSize`, `#`, hex, `px`, `borderWidth`, `borderRadius`, `setTimeout`, `duration` and `allowFontScaling` finds no value that should be a token.
3. The five states (empty, error, offline, AX5, dark) are present or declared n/a.
4. Accessibility: label, role, order, hint, live region for a line that appears, focus after an action, `accessibilityIgnoresInvertColors` on every picture, 44 pt, text never clipped (`numberOfLines` only where the design allows, and never on the parent's words).
5. Words: PROPOSED mark, content-rules clean (no em or en dashes, curly quotes, ellipsis characters, emoji; no fear, guilt or loss language; `{child}` only).
6. Contrast of any new colour pair is in `tokens.test.ts` (status roles `caution` and `success` are not allowed as text on `surface` or `accentSoft` in light, DELTA section 1).
7. The review says "reviewed from the diff, not run" unless a device row was passed.

## 4. What design-systems owes (so builders are not waiting on it)

| Owed | Why | Blocks |
|---|---|---|
| Token `mediaFrame` with pair tests (RULINGS row 27) | F-12 | #838 to #840 frame; BL-956 |
| Tokens for the picture sizes (Ready, letter page, lens) | F-19 | BL-956 |
| `createUndo` on `toast.logic.ts` (row 33-3, 11-foundations) | F-22 | BL-954 |
| One `ErrorLine` or `Notice` in `components/ui` | F-17 | photo stack follow-up |
| Strike spec 01 3.2 `capture.photo.ready`; reorder spec 01 section 4 and spec 06 4a per CL-116 C-01 | F-14, F-18 | none; keeps design honest |
| Resolve the E-S33 collision (analytics ask in SPEC-SYNC vs Legal in spec 08) and update `e2e/INDEX.md` | F-32 | Legal lane, analytics lane |
| Redraw the D-S26 specimens and D-S06 preview for E82; update G-D29 and WORDS 740 | F-08c, OI-S2 | BL-943 |
| Draw: held-screen heading, Try again beat, days store failure, lens header at AX5, Ready twins | F-07b, F-06, F-10, F-29, F-13 | the lanes in section 1 |

| Id | Tag | Finding |
|---|---|---|
| F-32 | STALE-DESIGN | Screen id E-S33 is assigned twice: `SPEC-SYNC-20nov.md` (analytics consent sheet, E-S33, and E-S34 for the new-device page) and `specs/08-LEGAL-AND-LICENSES-21nov.md` (Legal is E-S33, Licenses E-S35). `e2e/INDEX.md` has neither [U]. design-systems re-keys Legal to the next free id and records all four in INDEX before the area E lead assigns final ids. |

Signed: `design-systems`, 21 Nov 2026.
