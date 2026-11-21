Status: PROPOSED (nothing here is decided, built, or in `DECISIONS.md`; each reversal is the founder's to sign)
Date: 21 Nov 2026
Owner: `product` (master requirements author for the Moments tab)
Replaces: the PROPOSED NS-53 rows R1 to R16 in PR #1264 (`HOME-ENGAGEMENT-WHEEL-21nov.md` section 7.6). That file proposed the same id for the same tab; this file is the one NS-53 and absorbs those rows (see the traceability table). No other open PR uses NS-53 (checked 21 Nov against open PRs and `develop`).
Extends: `27-photo-moments-and-media.md` (NS-51, NS-52), `21-days-cultural-photos-home.md` (NS-46 to NS-50), `01-photo-with-a-letter.md` (NS-01)
Load when: you design, review, price or build the Moments tab, its nudges, its photo read, or its permission flow.

# NS-53: The Moments tab

Source: the founder's direction of 20 and 21 Nov 2026, quoted in section 1 and in `/home/claude/moments-brief.md`; the lead documents P1 to P5, D1 to D6, A1 to A5, T1 to T5, X1 to X6, B1 and R1 (branches `wip/moments-<id>`); PRs #1264, #1267, #1269, #1270 and #1276. Docs only. Every line is PROPOSED. A PROPOSED word never ships in a screen. Fictional family Asha only; the founder's screenshots are not in the repo and nothing from them is used.

Conventions. Row id: `NS-53-R<n>`. Priority: P0 (a) a promise, (b) a legal or store duty, (c) the core loop; P1 should ship with the phase; P2 later. Test layer follows TDD 09: L0 unit, content and core tests (vitest); L1 lint and source or binary scan; L2 component and e2e on the simulator; L3 visual regression (iPhone SE 3 and iPhone 16, default, AX3, AX5, light and dark); L4 accessibility audit; L5 device or manual script on a real iPhone. `Satisfies` lists the lead-document ids a row carries (`MT-P1-R3..R5` means R3 to R5 of that document). Phase: 1 no library, 2 own library read behind a flag, 3 Apple's picker door (section 19). Any row marked OPEN waits for the founder.

How this file was built. I read all 29 lead documents that exist (P6, D7 and any other lead not on a `wip/moments-*` branch on 21 Nov are listed in section 28 as not found). Where leads disagreed I chose and said why (section 24). Where the choice is the founder's I wrote OPEN and gave a default. Facts about Apple and the law are as the leads read them (their URLs are in their files); this file read none of them again and marks them as the leads' findings.

## 1. The customer problem and the job

### 1.1 The parent in the circumstance

Asha's parent is tired. It is 9:40 at night. The baby is asleep. There are four hundred new pictures on the phone from the weekend and a month of days that all feel the same. The parent wants to tell the child something about what happened, and cannot think of what. Opening a blank page makes it worse. Nobody wants a machine to write it for them either. They want to be reminded of what is already theirs: a day, a picture, a date that matters, a question they can answer in a minute with their voice.

### 1.2 The founder's words

- "Basically learn from this and do what this does in a smarter way and relevant to my usecase. This is really critical for me. Doesn't need to be a half sheet but this can be one new tab like explore etc or suitable word." (20 Nov)
- "Apple Journal-like access to the photo library to find which letter someone should write, and attach pictures or videos to it." (20 Nov, PRD 26)
- "It doesn't need to be default but think if it can be second tab or centre tab or how we organise but this is what would bring engagement is think IA and customer engagement and reason to come back everyday. And this would influence email nudges and push notifications nudges not just this app feed." (20 Nov)
- "Think we go with Moments." (21 Nov)
- "This feature is important so build requirements and design right and change any of our current principles because if we don't solve customer problems there's no value of these principles. And this is core value prop for me." (21 Nov)

### 1.3 Job statement

When I am tired and the days blur together, I want to see the days and pictures that are already mine and pick one to tell {child} about, so that a letter takes a minute to start and never feels like homework.

Short form for the tab (verb: choose; P1 section 3, D6): "I go to Moments to choose a day to tell {child} about."

### 1.4 What the customer problem is not

It is not "the app should write the letter". The constitution stands: the machine may remove and repair and may never add meaning. The problem is finding the day, not writing the words. Nothing in this file lets a machine write, rewrite, summarise, title or caption.

## 2. Goals and non-goals

### 2.1 Goals

| Id | Goal | How we would know (small n, no percentage under n = 20) |
|---|---|---|
| G-1 | A parent who opens Moments on any day sees something real and true, with no permission given | G4 five-parent check tasks 3 and 4 (P5 section 10) |
| G-2 | A parent who allows the library sees their own days in time order and can start a letter from one in two taps | letters started with `source: moment` among opted-in analytics users (section 18) |
| G-3 | A parent who says no loses nothing they had and is never asked again | no second ask in any test; five-parent task 4 |
| G-4 | The same moment signal can drive the card, a local reminder and, where the server legitimately knows it, an email | section 13 |
| G-5 | The tab looks and feels like the rest of the product: paper, calm, no streak, no count, no gap | design review, G5 accessibility pass |
| G-6 | Every photo is handled on the phone only, read-only, never ranked by content, and removed when the parent revokes | section 10 and its data-flow table |

### 2.2 Non-goals

- No machine-written title, caption, summary, mood, story, "best of" or "highlights" (constitution, NS-51-R10, MT-D5-F5).
- No scene, object, place or person guess; no face matching; no map tile; no machine place name (section 24, C-14).
- No count of days, pictures, letters or things waiting; no streak, points, badge, dot or "you have not" (CLAUDE.md content rules).
- No reading of audio or video frames; duration and date are metadata only (MT-X1-R3).
- No Android build in this PRD (iOS first; `nullSource` covers other platforms).
- No account-level photo sync (NS-52 Variant B is a separate decision and changes the label; MT-X4-R22).
- No music, mood or health cards from Apple's sheet (privacy read, element table).
- No paid feature depends on the library (MT-X4-R11).

## 3. Principles as proposed, and where a current ruling is amended

The founder said principles give way where they stop us solving the customer's problem. This section keeps four things fixed and lists every place an earlier ruling is amended or reversed, each with the old id and a one-line reason. A reversal is a proposal until the founder signs it in a D-### entry that `product` drafts as Proposed.

### 3.1 Hard constraints (not amended; external or constitutional)

| Id | Constraint | Why it holds |
|---|---|---|
| H-1 | The machine never adds meaning (constitution, `packages/core/src/types.ts` `EditType`, `verifyEdits`) | The product promise; the founder re-affirmed it in the brief |
| H-2 | Apple App Review: 5.1.1(ii) purpose strings, 5.1.1(iii) prefer the out-of-process picker, 5.1.1(iv) no forcing consent and an alternative for "no", 5.1.2(i) no required permissions, 5.1.2(vi) Photo API data not used for marketing or use-based data mining, 4.5.4 push rules | Store rules (X1, X2, X4 read them; counsel confirms) |
| H-3 | Apple Developer Program License Agreement 3.3.3(H) if Route A ships (suggestion data "for journaling purposes", use clearly evident) | Licence (X1 read it; counsel confirms) |
| H-4 | CAN-SPAM: truthful headers and subject, postal address, one-click unsubscribe honoured within 10 business days; designed to the stricter commercial standard whatever counsel classifies | Law (X2, X4); classification is counsel's call |
| H-5 | COPPA, GDPR and UK law, CCPA: the app is an adult surface, US storefront only at launch, no under-18 use, no face or age signal | Law (X4); counsel confirms |
| H-6 | The App Privacy label stays accurate per data type: Photos or Videos and Precise or Coarse Location stay "not collected" only while nothing from the library leaves the phone; "Data Not Collected" for the whole app is already false (X2 F1) | Apple label definition (privacy read A7; X2) |
| H-7 | Notification and library permissions are optional and the app works without them; push body not sensitive (4.5.4) | Store rules |
| H-8 | Real family details never appear in code, tests or fixtures; only Asha (`no-real-family-data.test.ts`) | Repo rule |
| H-9 | `raw_transcript` immutable; every edit reversible; safety tiers stay on the device | Constitution, CLAUDE.md privacy rules |

### 3.2 Amended or reversed rulings

| Rev | Old id and ruling | What changes | One-line reason | Default for the founder |
|---|---|---|---|---|
| RV-01 | Three-tab ruling (`infra/scope-stack-rank-and-ia-redesign-2026-11-19.md`; IA-R1, IA-FINAL section 4; D-161 draft) | Four tabs: Home, Moments, Book, Me | The founder wants a tab for this job; a feature this central needs its own place | Sign (section 4) |
| RV-02 | J4 / NS-35-R1: only Home starts a letter | Moments may call the one `startCapture({source:'moment'})`; it builds no recorder of its own and no cluster | A card that cannot start a letter is a dead end for a tired parent | Sign the one doorway (Q-P1-2 default) |
| RV-03 | K-02: no permission ask in first run | Kept in first run (no ask there). The ask moves to the parent's own tap inside Moments, any time after first run (gating on a first kept letter is the stricter alternative, O-05) | Satisfies Apple's "direct user action" and keeps first run fast; K-02 is lifted only in this narrow form | Sign the narrow form |
| RV-04 | BL-1305 and NS-49-R25: no photo-library usage string or PhotoKit call in any 1.x build | Narrowed: forbidden in every build profile except the one allow-listed for phase 2 (MT-P5-R1, R5, R6) | The library read is the feature | Sign, phase 2 only |
| RV-05 | NS-51-R1: no other screen asks for library access | The ask may live on Moments, only after one sentence, only on a tap | The ask must sit where the value is shown | Sign |
| RV-06 | NS-51-R8: the capture menu offers only the newest moment, never a list | Recent shows a list of days, bounded (section 7) | The founder asked for Recent, newest first | Sign |
| RV-07 | NS-51-R9 / "ML-6" (as the brief states it; the written rule found is NX-39-R16): a card shows a date, never a place or a thumbnail | Thumbnails are allowed inside the tab the parent opened; place and title stay banned | A card without a picture does not help a parent recognise the day | Sign thumbnails, keep "no place" |
| RV-08 | NX-39 ruling 3, K1 and "ML-3": no notification is derived from the library | One neutral local nudge may be timed from the library after a separate opt-in, in the identical-words form only (section 13) | Engagement is the point of the ask; the lock screen discloses nothing a plain evening reminder does not | OPEN (O-02) |
| RV-09 | E75: no marketing email at 1.0; CATALOG principle 5 and line 161: no child-anchored email | A lifecycle email, opt-in, off by default, built only from server-held facts, dark until signed | The founder asked for email nudges; email cannot use the library | OPEN (O-03) |
| RV-10 | NS-50-R5 rank 4: the year-ago letter is a Home slip | It lives on Moments when Moments is on; Home keeps ranks 1 to 3b | One fact, one place (P1 5.2) | Sign |
| RV-11 | NS-49-R9: Apple's title is shown with "Use this" | Apple's title is never shown or stored by us | Constitution; the brief | OPEN (O-08) |
| RV-12 | NS-51-R6 as amended by E37 and ML-4: 30 moments with up to 6 asset ids stored | Nothing library-derived is persisted by default; a cache file is allowed only if the spike proves it needed (section 10) | ML-4 and R6 conflict (X5 section 0.7); no stored id is safest | OPEN (O-09) |
| RV-13 | Q-PM-7 / CL-052: photo moments are drop C, after approval, spike first | Phase 1 ships in the first store build; phase 2 follows the gates | The tab is useless if it waits | Sign |
| RV-14 | NS-51-R35: the words "moments" and others are banned on the Me row | "Moments" is allowed as a tab label and place (PR #1276, D6); the Me row never says it | Founder: "Think we go with Moments" | Sign (#1276) |
| RV-15 | NS-51-R12 / R19 no nagging: unchanged in spirit; the new Home pointer line (section 4.5) is the only added prompt | One pointer, once | Discovery | Sign (O-06) |
| RV-16 | Analytics: ML-3 and K1 keep library signals out of analytics | Unchanged. A closed allowlist is added (section 18); no permission result is sent | Privacy | Not a reversal |

## 4. Information architecture and tab position

### 4.1 Decision proposed

Four tabs in this order: Home, Moments, Book, Me. Home stays the landing tab on every cold start. Moments is second. The label is "Moments" (D6, PR #1276). With the flag off the bar is Home, Book, Me as built.

### 4.2 The alternative, stated

Option C: Moments is the default tab. It matches the founder's first message. It reopens K-02 on every launch for a new parent, adds a tap to every letter start on a day with nothing new, and turns the first screen into a showcase before any letter exists (P1 4.2, P2 section 4, D2 5.1). Cheaper test of the same wish: keep option A and run the five-parent default-tab check (NS-50-R13 pattern). If at least four of five say they would open Moments first, ship it as default in the next build. OPEN (O-01), deadline Mon 24 Nov 2026.

Rejected: a centre tab in a five-tab bar (no honest fifth destination; collides with N3), and Moments inside Home (breaks R-IA-3 and IA-R9).

### 4.3 What each tab owns

| | Home (say) | Moments (choose) | Book (read) | Me (look after) |
|---|---|---|---|---|
| Owns | Today's prompt, Speak, Type, Start from a photo, waiting letters, one slip | Days and pictures the parent can pick from: typed days that are not today, month and age days, a year ago, the 111 prompts as a fallback, pictures the parent already attached, library days when allowed | Every kept letter | Settings, including Moments switches |
| Starts a letter | Directly | Only through `startCapture({source:'moment'})` | Never | Never |
| Lists kept letters | Never | Never (a year-ago card opens its letter in the Book) | Always | Never |

### 4.4 The reason to come back every day, honestly

Moments cannot invent a day. On a day with nothing new, the tab still holds one honest card: a question from the 111 prompts (never a gap prompt), the child's age day if there is one, a typed day. That is the daily reason, and it is the same on the day after a parent writes ten letters and the day after none (MT-P5-R19). Where a real day exists (new pictures, a marked day, a birthday, a letter from a year ago) it leads. We do not claim a rate; the five-parent diary measures whether parents say they opened it unprompted (E4). P1 recommended dropping the daily-return claim (Q-P1-7); this file keeps it only as "a real reason when something real exists, and one honest card otherwise". OPEN (O-04).

### 4.5 Reaching the tab

| Row | Rule |
|---|---|
| Home pointer | After the first kept letter and only once, one quiet line on Home near the bottom points to Moments with one verb; it never returns after a tap or dismissal (MT-P3-R3, MT-P4 OQ-P4-1). OPEN (O-06) |
| Tab bar | No badge, dot or number on the tab or on the app icon (MT-P1-R12, MT-T1-R17) |
| Notification tap | Lands as section 13.4 says |
| Link | `scribe://moments`, no parameters (MT-T1-R30) |

### 4.6 Requirements

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R1 | Given the Moments flag on, When any build runs, Then the bar is Home, Moments, Book, Me in that order and the initial route is Home; with the flag off the bar is Home, Book, Me as built and no route, link or notification opens Moments (it falls back to Home) | L0, L2 | P0 (c) | 1 | MT-P1-R1, MT-P2-R1, MT-P3-R1, MT-P3-R2, MT-X3-R21, MT-T1-R1, MT-T1-R16, MT-D1-R1, MT-P5-R4 |
| NS-53-R2 | Given the manifest `TAB_JOBS`, Then Moments has `verb: 'choose'`, a job sentence of 12 words or fewer matching `^I go to Moments to choose\b`, and navigation tests N1, N2, N4 and N6 expect four tabs | L0 | P1 | 1 | MT-P1-R2, MT-P1-R3 |
| NS-53-R3 | Given the bar on an iPhone SE 3 at AX5 with Bold Text and with Reduce Transparency, Then four labels fit whole (13 pt floor), the bar stays paper, no glass is added to it, the Large Content Viewer covers the fourth tab, and VoiceOver says "Moments, tab, 2 of 4" | L2, L3, L4, L5 | P0 (a) | 1 | MT-P1-R22, MT-T1-R2..R5, MT-D1-R3, MT-D4-R3, MT-D4-R20, MT-D4-R27 |
| NS-53-R4 | Given any tab or the app icon, Then no badge, dot, number, count, streak or gap shows, and the "arrival" of something new is shown only inside the tab, once, quietly | L0, L2 | P0 (a) | 1 | MT-P1-R12, MT-P2-R35, MT-T1-R17..R19, MT-D1-R2, MT-P3-R30 |
| NS-53-R5 | Given two tabs could show one fact (a marked day that is today, a year-ago letter), Then a single registry names one owner and the fact shows on one tab only; the year-ago letter shows on Moments, not as a Home slip, when Moments is on | L0 | P1 | 1 | MT-P1-R6, MT-P1-R7, MT-P2-R12, MT-P2-R13 |
| NS-53-R6 | Given a first cold start after first run, Then no photo-library question has been shown, no PhotoKit call made, and the first permission the parent meets is the microphone on their first tap of Speak | L1, L2 | P0 (b) | 1 | MT-P1-R8, MT-P3-R9, MT-D2-R5, MT-X4-R5 |
| NS-53-R7 | Given five parents shown the four-tab bar and the heading and first line of each tab, When asked what Moments is for and which tab they would open first, Then the result is recorded as x of n with a stop line, and no telemetry is used | L5 | P2 | 1 | MT-P1-R23, MT-P2-R41, MT-R1-R3, MT-R1-R4, MT-R1-R5, MT-R1-R6, MT-R1-R7, MT-R1-R8 |
| NS-53-R8 | Given the tab name, Then every parent-facing mention comes from `packages/content`, the glossary allows "Moments" only as a navigation label and place, the Me photos row never says it, the store listing, name, subtitle, keywords, screenshots and website do not say it until counsel clears the name, and a nudge never reads as a slideshow | L0 | P0 (b) | 1 | MT-D6-R1..R11, MT-X1-R12, MT-P2-R31, MT-D5-F1, MT-D2-Q1 |
| NS-53-R9 | Given the working glossary, Then a note stays a "note", and no string calls the parent's own words, a letter, a recording or a picture a "moment" | L0 | P1 | 1 | MT-D6-R2, MT-D6-R9 |

## 5. The card and group model

### 5.1 Two parts, one card family

The tab has two parts and a plain switch between them (a quiet cross-fade, MT-A1-R10):

- **For you**: up to four cards in slot order today, look back, pictures, question (MT-P2-R2). A slot with nothing is absent, with no placeholder.
- **Recent**: days that have pictures, newest first, bounded (section 7). Shown only when the library is readable; otherwise one calm line and the system picker.

### 5.2 Card kinds (the closed list)

| Kind | Id | What it is | Needs the library? | May drive push? | May drive email? | Owner of the rule |
|---|---|---|---|---|---|---|
| Typed day | K-DAY | A day the parent marked (NS-18, NS-46) that is today | No | Yes (`typedDay`) | No (phone only) | section 6 |
| Occasion | K-BIRTH | Birthday and half-birthday from date of birth | No | Yes (`birthday`) | Optional, per child, opt-in (RV-09) | section 6 |
| Age day | K-AGE | Month age day from date of birth | No | Yes (`monthAge`) | Optional, opt-in | section 6 |
| A year ago | K-YEAR | A fragment of the parent's own letter from this date a year earlier (NS-23) | No | No in text; yes as an existing class | Optional, with counsel's read | section 6 |
| Question | K-PROMPT | One of the 111 written prompts | No | Existing `evening` class | Fixed copy only | section 6 |
| Picked pictures | K-PICK | Pictures the parent already attached to a draft or chose in the system picker | No | No | No | section 6 |
| Day of pictures | K-LIB | A day from the library with the parent's own pictures | Yes | Local, identical words only (RV-08) | Never | section 7 |
| Example | K-EX | An illustrated Asha example, labelled "An example", inert, shown only until a real card exists | No | No | No | section 8 |
| State card | K-STATE | Access state (ask, Not now, limited, denied, restricted) | n/a | No | No | section 8 |

### 5.3 Card anatomy

A card shows, top to bottom: a reason line from a closed content list (MT-P2-R4), the date (a heading in the parent's locale, no relative counts: MT-D3-R6), the parent's own label only if they typed or chose it (MT-D3-R7), the pictures (K-LIB, K-PICK) or the parent's own fragment (K-YEAR), and one action. No title, caption, place, person, scene, mood, count, "best" or machine-made line appears on any card (MT-P2-R3, MT-D3-R2). The whole card is one element for VoiceOver (section 15).

### 5.4 Requirements

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R10 | Given Moments on any day, Then For you shows at most four cards in slot order today, look back, pictures, question; an empty slot is absent with no placeholder; no kept letter is listed; Recent shows days of pictures only | L0, L2 | P0 (a) | 1 | MT-P2-R2, MT-P5-R18, MT-X3-R27, MT-P3-R6 |
| NS-53-R11 | Given any source, Then no card shows a title, caption, summary, story, mood, scene, object, place, person, face, count, gap word, streak, point, badge, "best", "memories" or a line implying the app wrote, chose or found words; a content test fails each | L0 | P0 (a) | 1 | MT-P2-R3, MT-D3-R2, MT-D3-R24, MT-P3-R8, MT-P5-R20, MT-D5-F5, MT-X3-R25 |
| NS-53-R12 | Given any card, Then it carries a reason line from a closed list in `packages/content` (for example "A day you added", "A day you chose", "From {child}'s birthday", "A letter from this day", "Pictures from your phone") and no free text | L0 | P1 | 1 | MT-P2-R4, MT-D5-R5, MT-D5-R6 |
| NS-53-R13 | Given the card family, Then there is one component per kind (`MomentCard`, `DayCollage`, `PermissionAsk`, `ExampleCard`, `SegmentedSwitch`), built from existing tokens and shared components, each documented and tested | L1, L2 | P1 | 1 | MT-D1-R8..R13, MT-D4-R34 |
| NS-53-R14 | Given any section with nothing to show, Then one calm line and one action show, never an apology, "nothing yet", a count or an empty header | L0, L2 | P0 (a) | 1 | MT-P1-R13, MT-D5-R6, MT-D3-R23, MT-D4-R33, MT-P3-R24 |
| NS-53-R15 | Given a card is tapped, Then one capture starts (section 9) and the card never turns into a link to the new letter or shows "done" | L2 | P0 (c) | 1 | MT-T3-R27, MT-T3-R28, MT-A4-R21 |

## 6. Sources, ranking and how each card kind is formed (themes)

### 6.1 The Asha fixture used in every example

All examples use one synthetic family, never a real one. Fixture `asha-lib-v1` is P6's (seeded script, committed as data and script, no photo bytes): child Asha, date of birth Sat 12 Apr 2025; the phone is in America/Los_Angeles; the clock for most cases is Sat 21 Nov 2026 at 18:00 local, so Asha is 19 months and 9 days old and the last month day was Thu 12 Nov. Letters kept: a letter on Fri 21 Nov 2025 with the opening fragment "We tried the blue spoon." and one on Sun 15 Nov 2026. Typed days: "Nani's call" on Sat 21 Nov 2026 and "Park day" on Sat 14 Nov 2026. The 20 library cases F01 to F20 (busy day with burst and screenshot, heart and sessions, lone photo, video only, midnight split, clock change, cloud-only, no date, hidden, shared album, year ago, before the birth, three busy days, all screenshots, receipts, album, limited access, letter present) are MT-P6 section 6.9 and are the golden file for the engine. `asha-lib-B` is a generated 20,000 item library for the device performance rows.

### 6.2 The sources (S1 to S7, from P2)

| Id | Source | Exists when | A card shows | Never shows |
|---|---|---|---|---|
| S1 | A day the parent typed | Today equals the typed date; deleted the day after (NS-18-R5 to R7); never recurs | The parent's own words, unchanged | Any word the parent did not type; an upcoming day; a list |
| S2 | A day the parent chose (a ticked Day, NS-46) | The parent ticked it and its date is today; a quiet day shows the name and "The book is open if you want it." | The day's name and one content line | A day not ticked; a tradition label we inferred |
| S3 | Birthday and month-age days | From the active book's date of birth; none before the birth | "Today {child} is N months old" or the birthday | A comparison to other children; a milestone claim |
| S4 | A year ago from the parent's own letters | NS-23 rules: verbatim opening fragment; never sealed, hidden, private, recently deleted, hard-prompt, same-day or empty; never from a quiet book | The letter's date and the fragment | A paraphrase; a summary; a count of letters |
| S5 | Pictures the parent already picked | A draft or kept letter holds them; draft belongs to Home's waiting set | On an S4 card only, the picture on that letter | A library picture the parent did not pick |
| S6 | A written prompt from the 111 | Always eligible; kind `opening` only; deterministic by day seed; never Home's key today | The prompt text; "Another thought" shuffles | A `gap` prompt; a `hard` prompt unless the state asks |
| S7 | A day of pictures from the phone | Library readable (phase 2) and the day qualifies (section 7) | Thumbnails, the date | Place, title, caption, event name, count |

### 6.3 The one ordering rule

Up to four slots, in this order, only those that exist (MT-P2-R2, R6): Today (S1, then S3 birthday, then S2, then S3 month day, strongest first, two ticked days name both); Look back (S4); Pictures (S7 in phase 2, else S5 or the system picker row); Question (S6, always). The lead of the screen is the first card that exists. This is the NS-32 and NS-50-R5 order widened from one slot to four, not a new priority. For one local day every open returns the same list (NS-23-R13 pattern); at local midnight the choice is made again.

### 6.4 How each kind is formed: rule, example input, example output

Inputs to any rule are only: date of birth, typed days, ticked Days, kept letters, the prompt catalogue, the parent's own marks (a heart, a kept-close day, a label, a chosen album) and, in phase 2, creation dates, media kinds and durations of pictures. Each row is a golden in `packages/core/test/moments`.

| Kind | Rule | Asha input | Output the engine must give |
|---|---|---|---|
| K-DAY | Typed date equals today's local date | "Nani's call" typed for Sat 21 Nov 2026; today Sat 21 Nov | Today card, reason RSN-MARKED, body "Nani's call". On Sun 22 Nov: gone, no message |
| K-BIRTH | Local month and day equal the date of birth (29 Feb: the planner's rule) | Today Sun 12 Apr 2026 | Today card for the first birthday, reason RSN-BIRTHDAY |
| K-AGE | Local day of month equals the birth day of month, clamped to the month's last day, and the book is born | Today Thu 12 Nov 2026 | Today card, reason RSN-MONTHDAY; whether it names the number of months is OPEN (P6 Q6, O-11); on Fri 13 Nov none |
| K-YEAR (letter) | A kept letter exists on this month and day in an earlier year and passes the NS-23 filters; book not quiet | Letter Fri 21 Nov 2025; today Sat 21 Nov 2026 | Look back card, reason RSN-LETTER, fragment "We tried the blue spoon.", opens the letter in the Book. Quiet book: absent |
| K-YEAR (pictures, phase 2) | Pictures that pass section 7.2 exist on this month and day in an earlier year after the birth, fetched by that one date only | F13: 6 photos on Fri 21 Nov 2025 | Pictures card, reason RSN-YEAR "Pictures from this day in 2025". Never "a year ago" as a count. F14 (before the birth): never used |
| K-PROMPT | `selectPrompt` kind `opening`, seed = local day key, exclude Home's key | Any day, Asha born | One of the 111 prompts, same all day; "Another thought" gives another; before the birth only the `before` set |
| K-PICK | A draft or kept letter holds attached pictures | A draft with two pictures | Not a Moments card (Home's waiting set owns drafts); a kept letter's picture appears only on its K-YEAR card |
| K-LIB | Section 7 | `asha-lib-v1` | Section 7 |
| Seasonal or holiday day | Only ticked Days (S2, NS-46 catalogue) exist; we add no automatic season, weather, "first snow" or holiday card | A ticked Day whose date is today | Today card with the day's name and one line. OPEN (O-07): the founder may want an app-supplied seasonal list from a shipped calendar table (fixed dates, a switch, no inference). Default: no |

### 6.4a The closed reason list (13 lines, P6 6.1a; intent for `content`)

RSN-MARKED "A day you marked"; RSN-BIRTHDAY "From {child}'s birthday"; RSN-MONTHDAY "From a month day for {child}"; RSN-KEPT "A day you kept close"; RSN-HEART "Pictures you hearted"; RSN-ALBUM "From an album you chose"; RSN-VIDEO "A video from this day"; RSN-DAY "Pictures from this day"; RSN-YEAR "Pictures from this day in {year}"; RSN-RUN "Pictures from these days" (only if runs ship); RSN-PICKED "Pictures you picked before"; RSN-LETTER "A letter from this day"; RSN-QUESTION "A question to start from". Precedence when several apply to one date: marked, birthday, month day, kept, album, heart, video, day; losing reasons are not shown and nothing says "and more". A reason not in the list fails the build. This replaces the open list P2 R4 sketched.

### 6.5 Requirements

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R16 | Given today's local date and several Today sources, Then one Today card names them strongest first (typed day, birthday, chosen day, month day) and two chosen days name both | L0 | P1 | 1 | MT-P2-R6 |
| NS-53-R17 | Given S1, Then it shows only on its date with the parent's own words, never an upcoming day or a list; a typed day is gone the day after | L0 | P1 | 1 | MT-P2-R7 |
| NS-53-R18 | Given S2 on a quiet day, Then the card shows the name and "The book is open if you want it." with no question and no prompt block; a day not ticked never shows | L0 | P0 (a) | 1 | MT-P2-R8 |
| NS-53-R19 | Given a book before the birth, Then S3 does not exist and S6 draws only from the `before` set | L0 | P1 | 1 | MT-P2-R9 |
| NS-53-R20 | Given the 31st, a 29 Feb birth date or a month with fewer days, Then month days and the birthday follow the planner's existing date rule and never skip a month without a rule | L0 | P1 | 1 | MT-P2-R10 |
| NS-53-R21 | Given S4, Then it follows NS-23-R2, R5, R8, R12, R15 exactly (verbatim fragment; never sealed, hidden, private, deleted, quiet-book, hard-prompt, same-day or empty letters) and shows nothing else about the letter | L0 | P0 (a) | 1 | MT-P2-R11 |
| NS-53-R22 | Given a hard-stretch or quiet state on this phone, Then Moments shows no S4 card and no bright-tone Today card, the question uses only the kind Home uses, and nothing is shown from a quiet book | L0 | P0 (a) | 1 | MT-P2-R14, MT-P4-R35 |
| NS-53-R23 | Given S6, Then `selectPrompt` is called with kind `opening`, no `daysSinceLastEntry`, `excludeKeys` holding Home's key, and a deterministic seed per local day; `gap` and `hard` can never be chosen | L0 | P0 (a) | 1 | MT-P2-R15 |
| NS-53-R24 | Given "Another thought", Then a different prompt shows and nothing is counted or logged; the card height does not jump and VoiceOver hears the new prompt without losing place | L0, L2, L4 | P2 | 1 | MT-P2-R16, MT-A2-R23..R26 |
| NS-53-R25 | Given the same inputs and local date, Then `momentsFor` returns the same list on every call, across cold starts and two phones holding the same book | L0 | P1 | 1 | MT-P2-R39, MT-X3-R12 |
| NS-53-R26 | Given "Not today" on a card, Then it leaves until the next local day, plays no haptic, fills no gap in the same visit, is not logged, and returns tomorrow if eligible | L0, L2 | P1 | 1 | MT-P2-R23 |
| NS-53-R27 | Given "Not this one" on S7 or S4, Then only a local day key (S7) or a local letter id (S4) is stored on the phone and is removed by Turn off, Erase and sign-out; hiding is reversible and soft and a hidden day never leaks into any other surface | L0, L2 | P1 | 1 | MT-P2-R24, MT-D3-R16, MT-D3-R17, MT-A1-R14 |
| NS-53-R28 | Given the Me list "What shows in Moments", Then each source has one switch or a link to its own setting, off removes cards at the next focus and cancels that source's planned notes within 1.5 s, and the list has no count | L2 | P1 | 1 | MT-P2-R25, MT-X3-R16 |
| NS-53-R29 | Given every source turned off, Then Moments shows one calm line and the picker, and no other screen mentions it | L2 | P2 | 1 | MT-P2-R26 |
| NS-53-R30 | Given two books, Then Moments is per active book for S1 to S6 and S7 is the same under both; starting a letter from a day of pictures asks "Whose book?" only when more than one book is visible | L2 | P1 | 1 | MT-P2-R22, MT-P1-R5 |
| NS-53-R31 | Given the app opened after a long absence, Then the cards are the same as on any day and no string names the absence | L0 | P0 (a) | 1 | MT-P2-R21, MT-P5-R19 |
| NS-53-R32 | Given a book with no date of birth, a book before birth or a nameless child, Then no month-age or age day shows, no zero or blank shows, the fallback "your child" is used and Moments never asks for a date of birth | L0 | P1 | 1 | MT-P1-R15 |
| NS-53-R33 | Given a new phone whose book has not arrived, Then Moments shows the arrival line, offers nothing to start and asks nothing about photos | L2 | P1 | 1 | MT-P1-R16 |
| NS-53-R34 | Given the source registry (`momentsFor`), Then each source lists its surfaces as data (`pushSafe`, `serverSafe`), only S1, S2, S3, S6 and S7 are `pushSafe`, only S3 is `serverSafe`, a test fails if the library source lists `push` or `email`, and a test fails if any source lists `email` without a founder decision id | L0 | P0 (a) | 1 | MT-P2-R27, MT-P1-R17, MT-P1-R19, MT-X3-R1..R3 |

## 7. Grouping rules: from pictures to days (phase 2, source P6)

### 7.1 What a day is, and what is excluded first

A day is one local calendar day in the phone's current zone via an `offsetAt(ms)` parameter (no `Intl` in core): a late night across midnight is two days; the ambiguous hour on a clock-change day is one day; the card date equals the date the Photos app shows on this phone (MT-P6-R3, R21). Excluded before grouping, leaving no trace: assets with no creation date, hidden assets (the fetch never sets `includeHiddenAssets`), screenshots, screen recordings, animations, assets whose source is not the user library (iCloud Shared Album pictures are other people's: P6 Q7, off), and pictures the parent left out (MT-P6-R2).

### 7.2 Which days qualify for Recent (parameters are data in `rules.ts`; every value is ASSUMED until the device spike and the card sort)

A day inside `WINDOW_DAYS` (90, ASSUMED in NS-51-R7) qualifies if any one holds: it has `BUSY_DAY` pictures (5, ASSUMED); it has `BUSY_HOURS` pictures (4 within 3 hours, ASSUMED); it holds a hearted picture; it holds a video; it is an occasion day (typed, ticked, birthday, month day); it is a day the parent kept close. A lone ordinary picture does not qualify and stays reachable by opening that day from the picker door (MT-P6-R4). Sessions inside a day split at `SESSION_GAP` (3 hours, ASSUMED) and are used only for tile spreading and plain clock times in the detail view, never named or counted. A burst counts as one candidate. No value here is invented by this file: `RECENT_CAP`, `CANDIDATES`, `MAX_RUN` and `ROTATE_K` have none.

OPEN (O-12, P6 Q10 and C-1): P6 says Recent shows qualifying days only; D3 6.1 says one card per day with at least one picture; P2 says one screen. Recommendation: P6's qualifying rule, because 30 shots of a receipt day should not be a card, with the lone-picture days one tap away through the picker door.

### 7.3 Tiles, merges, ranking

- Tile candidates, in order: (1) pictures the parent already attached to a letter for this day; (2) hearted pictures by capture time; (3) the rest by an even spread: one from each session in time order, then the picture at the middle of the longest remaining gap, ties to the earlier time then the lower identifier. Panoramas are never tiles. At most one video tile. No pixel is read (MT-P6-R14, R15, R8, R9).
- Layouts: 1 picture 4:3; 2 two squares; 3 one tall plus two; 4 or more a fixed 2 by 2. The card never shows how many pictures the day holds (MT-P6-R16, MT-D3-R4).
- iCloud-only candidates take the next candidate or a plain box and never trigger a download; the grid never reorders after its first draw (MT-P6-R17).
- One card per day. A multi-day run card ("Friday 24 to Sunday 26 October") is off in v1 (flag `runs`); it ships only if four of five parents prefer it and none says it names something (MT-P6-R19, R20, R55; P6 Q2, Q9).
- For you's pictures slot takes the first class that exists: an occasion day in the window; the day a year ago; the newest day with a hearted picture; the newest busy day; the newest video day. Several eligible days in the winning class: index `hash(localDate, bookId) mod size` with a fixed hash and no random source (MT-P6-R30, R31).
- One stable day key. A day may show in For you and in Recent (two views), never twice in one view. "Not this one" and "Hide this day" act on the key and remove it from both (MT-P6-R32).
- Ranking is never from a score, a heart count, a tap or a dwell. Only explicit teaching counts (MT-P6-R29, R39).

### 7.4 Teaching verbs (closed set, MT-P6-R38)

Name this day (60 characters, typed, stored with the day key); Not now (until tomorrow); Not this one (this day never again in For you or Recent); Hide this day (listed only in Me); Keep this day close (stores a day key, no recurrence in v1); Leave out this picture (stores that picture's identifier on the phone: OPEN O-13, conflicts with MT-X5-R1 and R3); Use this album (stores the album identifier, shows the album title verbatim: OPEN O-14, small reversal of NS-51-R5 and R14, full access only). Documents and receipts cannot be filtered by subtype (the subtype list has no document value), so Not this one and Leave out this picture ship on day one. Each stored act carries Shown, Records, Never, Decline lines (P6 6.8 table; section 8.6 here).

### 7.5 Requirements

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R35 | Given the library module, When it scans, Then it reads only the closed `READ_SET_V1` (local identifier, creation date, media type, duration, the subtype flags for screenshot, screen recording, animation, panorama, Live Photo and video variants, `isFavorite`, `burstIdentifier`) and a scan fails the build on any other `PHAsset` property name. OPEN (O-15, P6 Q1): reading hearts and burst ids widens NS-51-R5; privacy, security-architect and the founder approve the set | L1 | P0 (a) | 2 | MT-P6-R1, P6-Q1, MT-P2-R5, MT-X3-R5, MT-X3-R7, MT-X3-R8 |
| NS-53-R36 | Given the scan, Then no-date, hidden, screenshot, screen-recording, animation, non-user-library and left-out assets are excluded before grouping and leave no trace in any output | L0, L1 | P0 (a) | 2 | MT-P6-R2, MT-P6-R49 |
| NS-53-R37 | Given a picture and the phone's zone, Then it lands in the local calendar day via `offsetAt`, a clock-change day is one day, a zone change moves only day assignment, and the card date equals the Photos app's date on this phone | L0, L5 | P0 (a) | 2 | MT-P6-R3, MT-P6-R21, MT-P6-R47 |
| NS-53-R38 | Given a local day in the window, Then it qualifies for Recent only by the rules of 7.2, a lone ordinary picture does not, and counting excludes everything 7.1 excludes. OPEN (O-12) against D3 6.1 | L0 | P0 (a) | 2 | MT-P6-R4, P6-Q10, MT-P2-R17 |
| NS-53-R39 | Given a qualifying day, Then sessions split at `SESSION_GAP`, one burst is one candidate, a hearted picture is the first tile and gives the reason RSN-HEART only when no stronger reason applies, a video day shows length as text plus a glyph, and Live, HDR, depth effect and high frame rate change nothing | L0, L5 | P1 | 2 | MT-P6-R5..R9, MT-A2-R12, MT-D3-R5 |
| NS-53-R40 | Given any card, Then it carries exactly one reason from the closed list of 6.4a by the stated precedence and a reason outside the list fails the build; no reason names what a picture shows | L0 | P0 (a) | 1 | MT-P6-R11, MT-P2-R4 |
| NS-53-R41 | Given the Moments code and library module, Then a scan fails on any forbidden signal (location, geocoding, map tile, faces, people, scene or object classification, captions, titles, filenames, EXIF text, music, travel inference, Apple moments APIs, `Vision`, `CoreML`, `CLGeocoder`, `MapKit`, `MediaPlayer`, `PHPerson`) and no string names one | L1 | P0 (a) | 2 | MT-P6-R12, MT-X1-R6, MT-X2-R21 |
| NS-53-R42 | Given a day, Then tiles follow the order of 7.3 using only capture time, burst id, hearts and earlier picks, are identical in any input order and on any phone, and one heart added or removed changes at most the slots the heart rule changes | L0 | P0 (a) | 2 | MT-P6-R14, MT-P6-R15, MT-P6-R16, MT-P6-R18, MT-D3-R3, MT-D3-R4, MT-D1-R10, MT-A2-R5, MT-A2-R6 |
| NS-53-R43 | Given a candidate whose original is in iCloud, When the tile resolves, Then it takes the next candidate or a plain box, never triggers a download and never reorders after the first draw | L5, L0 | P1 | 2 | MT-P6-R17, MT-A2-R10, MT-A5-R8, MT-D3-R21 |
| NS-53-R44 | Given an occasion date with pictures, Then one card shows the date, the occasion reason, the parent's own label and the collage, never two cards for one date; with no pictures it is the Today card with no collage and no line about missing pictures | L0 | P0 (a) | 2 | MT-P6-R23, MT-P6-R24, MT-P6-R35 |
| NS-53-R45 | Given a book not quiet or hidden, When an earlier year after the birth holds qualifying pictures on today's month and day, Then one RSN-YEAR card may show, from a fetch of that date only, nothing stored, no "N years ago"; "Not this one" removes that year for good | L0, L5 | P0 (a) | 2 | MT-P6-R25 |
| NS-53-R46 | Given a day that holds a kept open letter, Then the card shows "A letter is here" and not a second card; a sealed letter shows nothing | L0 | P1 | 2 | MT-P6-R26, MT-D3-R9 |
| NS-53-R47 | Given a library day, Then no prompt is chosen from the pictures, no prompt names or hints at them, and capture starts with an empty words field | L0 | P0 (a) | 2 | MT-P6-R27, MT-D3-R8, MT-P4-R5 |
| NS-53-R48 | Given the age on a day, Then it may appear only in the detail header of an occasion day, never as a number on the card until `content` rules (OPEN O-11) | L0 | P2 | 2 | MT-P6-R28, P6-Q6 |
| NS-53-R49 | Given For you, Then the pictures slot picks by the class order of 7.3 and the seeded rotation of 7.3, the choice is the same on every open that day and on two phones with the same library, and every view is finite with no number except a date, clock time, duration or year | L0 | P0 (a) | 2 | MT-P6-R29, MT-P6-R30, MT-P6-R31, MT-P6-R32, MT-P6-R33 |
| NS-53-R50 | Given any string in Moments, Then none contains the forbidden words of P6 R34 ("we found", "suggested", "recommended", "based on", "smart", "highlights", "memories", "best", "special", "trip", "outing", "visit", "event", "party", "more") and the content test passes `rules.test.ts` and the glossary | L0 | P0 (a) | 1 | MT-P6-R34, MT-P6-R50, MT-P6-R37 |
| NS-53-R51 | Given a cold start or foreground, Then cards paint from the last in-memory result or static content first, thumbnails resolve after, no card reorders after it is final, and library work starts after first paint | L5, L0 | P1 | 2 | MT-P6-R36, MT-P6-R51, MT-X3-R13, MT-D3-R18 |
| NS-53-R52 | Given the teaching verbs, Then the closed set is the seven of 7.4, a tap, dismissal, scroll or dwell never adjusts ranking, qualifying, rotation or reasons, no tap history or per-person score is kept, and each verb has an Undo, is not logged, and is listed and removable in Me with "Start again" | L0, L2 | P0 (a) | 1 | MT-P6-R38, MT-P6-R39, MT-P6-R43, MT-P6-R44 |
| NS-53-R53 | Given "Name this day", Then up to 60 typed characters are stored on the phone with the day key, shown verbatim, with no autofill from library data; "Keep this day close" stores a day key only and has no recurrence in v1 (OPEN O-16, P6 Q5) | L0, L2 | P1 | 2 | MT-P6-R40, MT-P6-R41, P6-Q5 |
| NS-53-R54 | Given "Leave out this picture", Then that picture leaves tiles, counts and every day and its identifier is stored in the local moments file (L4, wiped by Turn off, Erase and sign-out). OPEN (O-13): conflicts with MT-X5-R1 and R3; without it a receipt day cannot be cleaned | L0, L1 | P0 (a) | 2 | MT-P6-R42, P6-Q4 |
| NS-53-R55 | Given full access and Me, Photos, Albums, When the parent chooses an album in our chooser, Then its identifier (not name) is stored, the album title shows verbatim only on days it supplies, with reason RSN-ALBUM; limited access, shared, synced, imported and smart albums are never offered. OPEN (O-14) | L0, L2, L5 | P1 | 2 | MT-P6-R10, P6-Q3 |
| NS-53-R56 | Given a kept-open run of days with `runs` on and a run no longer than `MAX_RUN`, Then one card may show the plain date range with reason RSN-RUN and never a place, purpose word or "trip"; default off | L0, R | P2 | 2 | MT-P6-R19, MT-P6-R20, MT-P6-R55, P6-Q2, P6-Q9 |
| NS-53-R57 | Given the golden fixture `asha-lib-v1`, Then the output equals the committed golden for all 20 cases, is identical in 100 seeded input orders and with extra excluded assets present, and the `Moment` type has no free-text field except a parent label, a chosen album title and closed reason keys | L0 | P0 (a) | 2 | MT-P6-R45, MT-P6-R46, MT-P6-R48, MT-X3-R2, MT-X3-R11 |
| NS-53-R58 | Given the five-parent card sort, Then part 1 and part 2 meet the P6 bar (a true reason for at least four of five cards unaided; no "it is guessing"; no more than two junk days in ten after one use of Not this one), three questions are asked verbatim, "I did not expect it to know" halts that signal until privacy reads it, and the outcome is "x of 5" with failing cards and no real data | L5 | P1 | 2 | MT-P6-R52..R54, MT-P6-R56 |

## 8. Permission and consent flow

### 8.1 The states (one state function reads them; T2-R1)

| State | Meaning | What the tab shows |
|---|---|---|
| ACC-0 | Never asked (iOS "not determined") | The value view: our own Asha examples (labelled "An example", inert, no photograph), then real For you cards, then one plain ask card below the real cards |
| ACC-1 | Parent chose Not now | Real cards; one small row "Show days from my pictures" as the only door; nothing else; no timer, no counter of refusals |
| ACC-2 | Full access | For you and Recent |
| ACC-3 | Limited access (Selected photos) | The same as full, built only from the chosen set; no message; one quiet "Choose which pictures" control at the foot (O-17 settles head or foot) |
| ACC-4 | Denied (after Don't Allow or Settings) | Real cards; one calm line with an "Open Settings" button, on the tab and in Me only |
| ACC-5 | Restricted (a setting on this phone) | Real cards; one plain line that it is off by a setting on this phone; no button; no reason named |
| Phase 1 | No library module in the build | The same as ACC-1 without the door row; "Add pictures" through the existing system picker |

### 8.2 The ask, step by step (happy path)

1. The parent opens Moments. ACC-0 shows the value view. No iOS alert, no PhotoKit call (A8: no PhotoKit at launch; calls only on direct action).
2. Below the real cards the ask card sits, with the plain statement visible without a gesture. "Not now" and the yes have the same size and weight (MT-P3-R7).
3. The parent taps the yes. One sentence of ours appears in a sheet over the tab (the primer; T2-R3), with Shown, Records, Never and Decline lines (8.5). The parent taps Continue.
4. Apple's sheet appears once, from `requestAuthorization(for: .readWrite)`; the result is read with `authorizationStatus(for:)` so Limited is told from Full.
5. Allow all and Select photos reach the same first feed (T2-R7); the tab answers the ask by showing the days, with nothing moving around it (A3-R8, R12).
6. The system never re-prompts; our UI never asks again (MT-P1-R10).

### 8.3 Unhappy paths of the ask

| Case | What happens |
|---|---|
| Not now or swipe down on the primer | Calm, final until the parent opens the small door row; no timer (T2-R5, R6) |
| Don't Allow at Apple's sheet | Lands on a useful tab, not a wall; the parent sees ACC-4 only when they look (T2-R8, R27) |
| Settings changed outside the app | Re-read once on every return to the foreground; the tab redraws in under 1 s with no message; a downgrade empties our data at once; an upgrade needs no second yes (T2-R11..R13, MT-P3-R16) |
| iOS already holds an answer | The dialog is skipped without a dead end (T2-R10) |
| App lock or inactive while the primer is open | The primer cannot be open; a result returning while locked is discarded (D2-R19, T2-R30) |
| Parent is under 18 or the gate has not passed | No Moments surface, index or primer renders (X4-R57, R58) |

### 8.4 What may never happen

No library question at launch, in first run, from a notification, from a link, from a tab switch alone or from recording or review (MT-D2-R5). No second ask after No. No ask that gates any feature (5.1.2(i)). No "allow" or "access" or "settings" string in Moments outside the denied line and the Me row (MT-P1-R10 with the exception that D2 allows for ACC-4 and ACC-5; the test lists the exact allowed keys). No analytics event for the permission result (RV-16, O-18).

### 8.5 Shown, Records, Never, Decline (PRIV-R21; COORDINATION section 10)

| Door | Shown | Records | Never | Decline and withdraw |
|---|---|---|---|---|
| The primer for the library read | The `packages/content` key of the one sentence ("{app} reads the date and time of your pictures on this phone to show you days. It does not look at what is in them." intent only; counsel and `content` write final words; no on-device-only claim D5-F4) and the versioned policy link | On the phone only: that the primer was shown and answered (a local flag so the ask card does not return). iOS itself holds the permission answer. No server row, no analytics (P3 Q-P3-9 default) | Not a picture, id, date, album, place or count; not the permission result; no hash sent anywhere | Not now and Don't Allow leave every feature working; Export, Delete and the whole capture flow work; Turn off in Me removes the on-phone data at once |
| The nudge opt-in (section 13) | One plain sentence naming the reminder use, equal-weight choices, off by default | The choice, on the phone; for email, the PRIV-R21 consent row on the server (X6) | No library fact in the record; no distinction from an ordinary reminder in any event | Off at once; pending notes cancelled within 1.5 s; account and safety mail untouched |
| The email opt-in (section 13.6) | Sender, purpose, frequency, how to stop | PRIV-R21 row | As above | One-click unsubscribe, no login |
| Teaching acts (Name, Keep close, Leave out, Use album) | The verb and its one line | A day key (or an album or picture identifier where 7.4 says OPEN) on the phone | No server copy, no log, no event | Undo; Me lists and removes; Turn off, Erase and sign-out delete it |

### 8.6 Requirements

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R59 | Given any permission state ACC-0 to ACC-5 and a brand-new account with no letters and no child, When the tab opens, Then at least the "no library" cards render and the tab is never a wall, an uncloseable modal or a blank; examples are drawn, labelled "An example" in text and accessible name, hold no photograph and no real name, place or face, are inert (no haptic, nothing opens), and disappear the day a real card exists | L2, L3, L4 | P0 (a) | 1 | MT-D2-R1..R4, MT-P3-R4, MT-P3-R5, MT-P3-R6, MT-P3-R18, MT-D4-R13, MT-D5-R7, MT-A3-R3..R6, MT-X4-R61 |
| NS-53-R60 | Given any launch, tab switch, first run, link, notification tap, recording or review, Then no PhotoKit call that can show Apple's prompt is made, and Apple's prompt shows only after the primer's Continue | L1, L2 | P0 (b) | 2 | MT-D2-R5, MT-P3-R9, MT-P3-R10, MT-P1-R9, MT-X4-R6, MT-T2-R2, MT-T1-R24, MT-T1-R34 |
| NS-53-R61 | Given the ask card, Then it sits below the real cards, "Not now" and the yes are equal in size and weight, neither is styled as the wrong choice, the pinned ask bar shows up to XL text and sits inline from AX1, and the primer is a sheet over the tab | L2, L3, L5 | P0 (b) | 2 | MT-P3-R7, MT-D2-R17, MT-T2-R3, MT-D4-R14, MT-D4-R17, MT-A3-R2, MT-A3-R7, MT-A3-R8 |
| NS-53-R62 | Given the primer, Then it carries the Shown, Records, Never and Decline lines of 8.5 by content key, the purpose string is present only in the allow-listed profile, is plain and true, names every use the library data has in the build (including any reminder timing), and a build test fails if a module ships without it | L1, L0, R | P0 (b) | 2 | MT-D2-R8, MT-P3-R12, MT-X2-R10, MT-X4-R1..R4, MT-X2-R16, MT-D5-R2, MT-X6-R24 |
| NS-53-R63 | Given Not now, Then no primer and no ask card return by themselves on any later day, the only doors are the small row on the tab and the Me row, and no timer or counter of refusals exists | L0, L2 | P0 (a) | 2 | MT-D2-R6, MT-P3-R11, MT-T2-R5, MT-T2-R6, MT-A3-R16, MT-D5-R3 |
| NS-53-R64 | Given iOS holds any answer, When the parent taps any door, Then the primer and alert are not shown again and the tab goes straight to the state | L2 | P1 | 2 | MT-D2-R7, MT-T2-R9, MT-T2-R10, MT-X4-R7 |
| NS-53-R65 | Given Limited access, Then days build from the chosen set with no message, a "Choose which pictures" control opens Apple's limited picker, the automatic limited alert is suppressed, no album is offered, a tiny selection never nags, and pictures taken after a Limited choice are not read | L2, L5 | P0 (b) | 2 | MT-D2-R9, MT-D2-R10, MT-P3-R13, MT-T2-R24, MT-T2-R25, MT-A3-R17, MT-X4-R8, MT-D3-R19, MT-D4-R15, MT-D5-R4 |
| NS-53-R66 | Given Denied, Then one calm line with Open Settings shows on the tab and in Me only, no second system prompt is attempted, Home and notifications never mention it; given Restricted, one plain line and no button | L2, L5 | P0 (b) | 2 | MT-D2-R11, MT-D2-R12, MT-P3-R14, MT-P3-R15, MT-T2-R26..R29, MT-T1-R27, MT-A3-R18, MT-D4-R15 |
| NS-53-R67 | Given the parent changes access in Settings, When the app returns, Then the tab re-reads once and redraws in under 1 s with no message, a downgrade empties the on-phone data at once, state is read and never remembered, and coming back from Settings moves the screen once | L2, L5 | P0 (a) | 2 | MT-D2-R13, MT-P3-R16, MT-T2-R9, MT-T2-R11..R13, MT-A3-R19, MT-X5-R8, MT-X4-R63 |
| NS-53-R68 | Given the Me entry for Photos access, Then it states on or off in plain words (not by colour), Turn off removes the on-phone index and the moments file at once, and it shows ACC-1 | L2 | P0 (a) | 2 | MT-D2-R14, MT-P1-R21, MT-P2-R25, MT-T2-R22, MT-T2-R23, MT-X5-R7 |
| NS-53-R69 | Given Denied, Restricted, Not now or no library module, Then Export, Delete, the whole capture flow and a letter from a prompt, a month-age day, a typed day or pictures chosen in the system picker all work, and a parent with no kept letters sees no "a year ago" card and no empty header | L2 | P0 (b) | 1 | MT-P3-R17, MT-P3-R23, MT-P3-R24, MT-X4-R7, MT-X2-R15, MT-X4-R48, MT-T2-R28 |
| NS-53-R70 | Given any library App Review submission, Then the Notes for Review say what is read, that the tab works with access refused, and why the out-of-process picker alone is not enough (5.1.1(iii)); purposes are not drifted (5.1.2(ii)); the library is not used for marketing or data mining (5.1.2(vi)); no profile or contact database is built (5.1.2(iii),(iv)) | R | P0 (b) | 2 | MT-P3-R33, MT-X2-R14, MT-X2-R17, MT-X4-R9, MT-X4-R10, MT-X4-R41, MT-X4-R42, MT-X2-R19, MT-X2-R24 |
| NS-53-R71 | Given the label, policy and in-app disclosure, Then in the same build as the behaviour they say, per data type, "Photos or Videos: not collected" only while no picture, thumbnail, date, id, coordinate or title leaves the phone; they never say "Data Not Collected" for the whole app (the label of record answers Yes for five types); they avoid the banned on-device-only claims of D5-F4; and the policy gains the backup line (a stored copy sits on the phone and is not excluded from iPhone backup, FACT-CHECK) | R, L0 | P0 (b) | 2 | MT-P3-R34, MT-X2-R1..R9, MT-X2-R11..R13, MT-X4-R19..R25, MT-X1-R7, MT-X2-R3, MT-X2-R4, MT-D5-F4 |
| NS-53-R72 | Given a Route A build, Then the entitlement is present only in an allow-listed profile after the licence read, only picture and video assets are kept at the boundary (titles, locations, contacts, songs, workouts, reflections and state of mind are dropped), the 17.0 and 17.1 phones hide only the Route A control and keep the tab, and the first-use sheet is Apple's | L1, L5, R | P1 | 3 | MT-D2-R20, MT-D2-Q4, MT-X1-R4, MT-X1-R5, MT-X2-R11, MT-X2-R18, MT-X4-R12..R18, MT-P4-R14 |

## 9. Capture hand-off and attach

### 9.1 How a moment becomes a letter

1. The parent taps a card (the whole card is one target; the compose button is the same action, labelled with one verb). The platform's modal rise opens the day sheet (route `moments/pick`, MT-T3-R1..R3, R35); nothing is carried that the parent did not choose.
2. In the sheet the parent chooses pictures (nothing pre-selected, nothing copied before Keep; at most 6 pictures or 2 videos, NS-52-R1 and R2; the gentle cap is one calm line with no countdown). The conflicting cap of 8 in D3-R14 is overruled by NS-52.
3. The parent taps the one start control. `startCapture({source:'moment'})` is called; Moments imports no recorder, Listen or Write module and renders no capture cluster. Chosen ids go through a one-shot in-memory hand-off, never through a route param (T3-R9, R7).
4. Listen or Write opens as today, with the words field empty and no string describing the pictures. The prompt shown at Ready is chosen by the same function as without pictures. The letter date is today unless the parent picks another; the pictures' date is an optional chip, never preselected.
5. The pictures follow into Review (copy, metadata stripped, resized: section 10.5). Keep stores the letter; the parent lands on the Book on the new letter (T3-R25; O-19 if the founder wants return to the tab). A card never becomes "done".

### 9.2 Unhappy paths

Backing out before Keep leaves 0 files and 0 rows and Moments as before the tap. A waiting draft: ask once "add or start new", Add is default, neither deletes the draft. A video over 60 seconds, a corrupt, oversized or iCloud-only item or low space: that item is refused or waits with one calm line; words and other items stay; the letter can still be kept. A call or the background interrupts: words are written first, nothing is deleted, a recording is kept. Killed mid-recording: the launch sweep finds the draft. App lock arrives mid-pick: the pick is dropped, 0 files. A shared book: the other parent sees words only under Variant A, and the author sees one plain line at Review. Other authors' letters show no add, change or remove.

### 9.3 Requirements

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R73 | Given any tap on a moment, Then it calls the one start function with source `moment` (added to the closed source list in the same PR as its handler), Moments imports no recorder, Listen or Write module, and only `start-capture.ts` routes to `/listen` or `/write` | L0, L1 | P0 (c) | 1 | MT-P4-R1, MT-P1-R4, MT-T3-R6, MT-X3-R22, MT-T3-R4 |
| NS-53-R74 | Given Book and Me, Then they still start nothing and the Photos lens has no add or start control | L2 | P0 (c) | 1 | MT-P4-R2 |
| NS-53-R75 | Given a tap on a day, Then capture opens with the chosen pictures attached, an empty words field, the "Whose book?" sheet only if more than one book is visible, and nothing pre-filled from the pictures; the picker is a root-stack modal route, params are only those that exist today, and route templates only reach `screen_view` and the error boundary | L2, L0 | P0 (c) | 1 | MT-P1-R5, MT-T3-R1..R3, MT-T3-R7..R9, MT-D3-R8, MT-D3-R11, MT-D3-R15, MT-P4-R15, MT-P3-R21 |
| NS-53-R76 | Given capture begun from a moment, When the parent backs out before Keep, Then 0 files and 0 rows remain, temporary copies are deleted and Moments equals its state before the tap; the three-step back principle (close picker, close Listen, never lose words) holds for every exit | L2, L5 | P0 (a) | 1 | MT-P4-R3, MT-T3-R10..R18, MT-T3-R24, MT-A4-R10..R13 |
| NS-53-R77 | Given a moment hand-off, Then no database field, log line, breadcrumb or analytics event records that the letter began from a moment, and `capture_started` with source `moment` sends nothing that says so | L1, L0 | P0 (a) | 1 | MT-P4-R4, MT-T3-R12 |
| NS-53-R78 | Given Route A or Route B, Then both hand the same `AttachRequest` to the same pipeline; the only code that reads or re-encodes a picture or video is the system's; no third-party picker, decoder, editor or media package appears in the lockfile | L0, L1 | P0 (c) | 2 | MT-P4-R6, MT-P4-R7 |
| NS-53-R79 | Given each picked item, Then it passes the NS-01 picture pipeline or the NS-52 video pipeline and 0 of 10 stored pictures and 0 of 10 stored videos carry location or device metadata | L0, L5 | P0 (a) | 2 | MT-P4-R8, MT-X4-R31 |
| NS-53-R80 | Given a selection above 6 pictures or 2 videos, Then the sheet stops adding with one calm line naming the limit, no count left, no "select all", nothing already chosen lost; selection is visible three ways (ring, check, spoken state), reachable without a drag, and the 7th picture in Review is refused too | L2, L4 | P1 | 2 | MT-P4-R9, MT-P4-R25, MT-D3-R12..R14 |
| NS-53-R81 | Given a video over 60 seconds, a corrupt, oversized or iCloud-only item or low space, Then that item is refused or waits with one calm line, the rest stays and the letter can be kept; a vanished source costs one item | L2, L5 | P1 | 2 | MT-P4-R10, MT-P4-R22 |
| NS-53-R82 | Given several items, Then they are stored in the order the parent picked, else in time order; the machine never reorders, crops, selects or builds a highlight; the parent can reorder by drag or by Move earlier and Move later | L2 | P1 | 2 | MT-P4-R11, MT-P4-R12 |
| NS-53-R83 | Given a library original, Then it is never modified, moved or deleted by our code; the kept letter holds no library id, album, filename, original creation time or place not typed by the parent, and an original deleted after Keep changes nothing | L0, L5 | P0 (a) | 2 | MT-P4-R13, MT-P4-R17, MT-P4-R21 |
| NS-53-R84 | Given Route A returns a title, date range, place, people or music, Then the adapter drops each before the attach contract and none is stored, shown, logged or used (OPEN O-08 against NS-49-R9) | L0 | P0 (a) | 3 | MT-P4-R14, OQ-P4-8 |
| NS-53-R85 | Given a picture date, Then it is offered only as an optional chip applied on a tap, never preselected | L2 | P0 (a) | 2 | MT-P4-R16 |
| NS-53-R86 | Given a moment tap while a draft waits, Then the app asks once whether to add or start new, "Add" is default, Cancel changes nothing, and neither choice deletes the draft | L2 | P1 | 1 | MT-P4-R18 |
| NS-53-R87 | Given a deleted letter, Let it go, Erase now or Erase everything, Then every picture and video of it is deleted, restore inside Recently deleted brings them back, and the library is untouched; a plain sentence says pictures in a letter are copies | L0, L2, R | P0 (a) | 2 | MT-P4-R19, MT-P4-R20 |
| NS-53-R88 | Given our stored file is missing, Then a plain box and one calm line show, the row stays and words are intact | L5 | P0 (c) | 2 | MT-P4-R23 |
| NS-53-R89 | Given media and no words, Then Keep is disabled; given words and any media within limits, Then Keep makes the same letter as without media and is never gated by media | L2 | P0 (c) | 2 | MT-P4-R24 |
| NS-53-R90 | Given Remove, Then it leaves with Undo for the NS-01 window and after it the file is deleted and checked | L0, L5 | P0 (a) | 2 | MT-P4-R26 |
| NS-53-R91 | Given the letter page, Then items show in order, a video plays only on tap, never autoplays or loops, plays with sound only after the tap, respects the silent switch and pauses on inactive and App lock | L5 | P1 | 2 | MT-P4-R27 |
| NS-53-R92 | Given inactive, background or App lock, Then every picture and frame is an opaque box before the snapshot, no day name, fragment, typed words or thumbnail shows in the switcher with or without App lock, and a pick that lands while locked is discarded with 0 files | L5 | P0 (a) | 1 | MT-P4-R29, MT-P2-R34, MT-X1-R2, MT-T2-R30 |
| NS-53-R93 | Given Save a copy and export, Then every item is included, stripped, streamed, with a size line first and a calm refusal on no space; Moments data is never in an export | L0, L5 | P0 (b) | 2 | MT-P4-R30, MT-X5-R15 |
| NS-53-R94 | Given a shared book, Then under Variant A a push carries no media path, a pull creates no media row and the label stays "Photos or Videos: not collected"; the author sees one plain line at Review with Shown, Records, Never and Decline; letters by another author show no media controls (OPEN O-20, P4 OQ-P4-5) | L0, L2, R | P0 (a) | 2 | MT-P4-R31..R33, OQ-P4-5 |
| NS-53-R95 | Given a second account on the phone, Then it never sees the first account's media, index, opt-in or moments and its start is off; a restored or new phone starts off | L0, L5 | P0 (a) | 2 | MT-P4-R34, MT-X5-R11, MT-T5-R13, MT-T5-R14 |
| NS-53-R96 | Given the flags, Then `EXPO_PUBLIC_PHOTOS`, the photos kill switch, `EXPO_PUBLIC_VIDEO` and the videos kill switch hide the hand-off and Add but leave sweep, Erase and Export working; airplane mode lets phone-held pictures attach | L0, L5 | P1 | 2 | MT-P4-R42, MT-P4-R43 |
| NS-53-R97 | Given all fixtures, Then every picture and video is generated by script (Asha, synthetic) and none holds a real name, place or picture from the founder's screenshots | L0, L1 | P0 (a) | 1 | MT-P4-R44, MT-P1-R24, MT-P2-R40, MT-T3-R39, MT-P3-R32 |
| NS-53-R98 | Given a Keep from a letter that began at a moment, Then the parent lands on the Book on the new letter, the back stack is tabs only, Moments shows no "done", no count, no tick and no "1 of N", the used day is hidden in the same session, and the list does not jump | L2 | P1 | 1 | MT-T3-R25..R29, MT-A4-R14, MT-A4-R20, MT-T1-R15, MT-P4-R41 |
