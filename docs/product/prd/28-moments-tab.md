Status: PROPOSED, FREEZE-READY after round 1 of the executive review (nothing here is decided, built, or in `DECISIONS.md`; each reversal and each founder question is the founder's to sign; section 27 records what every reviewer finding did to this file)
Date: 21 Nov 2026
Owner: `product` (master requirements author for the Moments tab)
Replaces: the PROPOSED NS-53 rows R1 to R16 in PR #1264 (`HOME-ENGAGEMENT-WHEEL-21nov.md` section 7.6). That file proposed the same id for the same tab; this file is the one NS-53 and absorbs those rows (see the traceability table). No other open PR uses NS-53 (checked 21 Nov against open PRs and `develop`).
Extends: `27-photo-moments-and-media.md` (NS-51, NS-52), `21-days-cultural-photos-home.md` (NS-46 to NS-50), `01-photo-with-a-letter.md` (NS-01)
Load when: you design, review, price or build the Moments tab, its nudges, its photo read, or its permission flow.

# NS-53: The Moments tab

Source: the founder's direction of 20 and 21 Nov 2026, quoted in section 1 and in `/home/claude/moments-brief.md`; the lead documents P1 to P6, D1 to D6, A1 to A5, T1 to T5, X1 to X6, B1 and R1 (branches `wip/moments-<id>`); PRs #1264, #1267, #1269, #1270 and #1276; the reconciliation pack, the principles review and the privacy and EAS fact check; and the founder rulings of 21 Nov (library read in the first release; places and special occasions in). Docs only. Every line is PROPOSED. A PROPOSED word never ships in a screen. Fictional family Asha only; the founder's screenshots are not in the repo and nothing from them is used.

Conventions. Row id: `NS-53-R<n>`. Priority: P0 (a) a promise, (b) a legal or store duty, (c) the core loop; P1 should ship with the phase; P2 later. Test layer follows TDD 09: L0 unit, content and core tests (vitest); L1 lint and source or binary scan; L2 component and e2e on the simulator; L3 visual regression (iPhone SE 3 and iPhone 16, default, AX3, AX5, light and dark); L4 accessibility audit; L5 device or manual script on a real iPhone. `Satisfies` lists the lead-document ids a row carries (`MT-P1-R3..R5` means R3 to R5 of that document). Phase (founder ruling 21 Nov, section 19): 1 the first release, which includes the own library read (Route B, Limited access honoured) with the flag on in the release profile; 2 the library-timed local reminder and the lifecycle email, after their gates; 3 Apple's journaling suggestions picker as an optional door. Any row marked OPEN waits for the founder.

Founder ruling of 21 Nov (his words: "No it needs to ship with photo library read."). The first release of Moments includes the photo library read. This replaces the earlier default of a first build with no library everywhere in this file. Work that was "before engineering" is now a release gate: it must pass before store submission, not before coding starts (section 21). If a gate fails, the flag stays off for that build and the tab ships on its no-library content; that is a fallback, not the plan. Which part slips when a gate does not close (the date, or only the library part) is the founder's question O-37, answered before the first gate read-out and not at the gate (EX-CPO-1). The ruling closes the reconciliation pack's founder decision 3 (first public build holds the tab with no library: now B, wait for the library part is overruled in favour of shipping it) and the route-order and wheel-timing rows 14 and 30 in part. The coordinator named decisions 2 and 5; in the pack as I read it those are "Moments is not the landing tab" and "after Keep land on the Book", which this ruling does not touch, so I treat 3 as the one closed and ask the coordinator to confirm the numbering (O-29).

How this file was built. I read all 29 lead documents that exist (D7 exists on `origin/wip/moments-d7`, head `abffeecd2f643d6cfe5c5ae356fcfb1c46cc2d3f`; it is the HTML prototype and its README, read in round 1 and recorded in section 24 as C-30 to C-33; P6 and the reconciliation pack arrived after the first draft and are folded in). Where leads disagreed I chose and said why (section 24). Where the choice is the founder's I wrote OPEN and gave a default. Facts about Apple and the law are as the leads read them (their URLs are in their files); this file read none of them again and marks them as the leads' findings.

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
| G-2 | A parent who allows the library sees their own days in time order and can start a letter from one in two taps | Not read from analytics in the first release (R87, O-38). Read by the five-parent check (E1, R161), the device row W-moment (two taps from a day to the writing screen, counted by hand), and the diary (E4); if the founder signs O-38 to send an enum, then letters started from a Moments card among analytics-consented installs, never by kind (EX-CPO-2, EX-CDO-2) |
| G-3 | A parent who says no loses nothing they had and is never asked again | no second ask in any test; five-parent task 4 |
| G-4 | The same moment signal can drive the card, a local reminder and, where the server legitimately knows it, an email | section 13 |
| G-5 | The tab looks and feels like the rest of the product: paper, calm, no streak, no count, no gap | design review, G5 accessibility pass |
| G-6 | Every photo is handled on the phone only, read-only, never ranked by content, and removed when the parent revokes | section 10 and its data-flow table |

### 2.2 Non-goals

- No machine-written title, caption, summary, mood, story, "best of" or "highlights" (constitution, NS-51-R10, MT-D5-F5).
- No face recognition, no naming of people, no face matching (children's biometric data; kept OUT, open question O-30, not decided here). No scene or event inference in the first release (section 7a.4). Places and special occasions are IN, by founder ruling 21 Nov, through the place pipeline (7a.1) and the occasion rules (7a.3); no map tile unless the gated adapter ships.
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
| H-2 | Apple App Review: 5.1.1(ii) purpose strings, 5.1.1(iii) prefer the out-of-process picker, 5.1.1(iv) no forcing consent and an alternative for "no", 5.1.2(i) no required permissions, 5.1.2(v) and (vi) on use of Photo API data (the exact words and the date read are carried in R242; the paraphrase used in earlier drafts was broader than the text and is UNVERIFIED as counsel's reading), 4.5.4 push rules | Store rules (X1, X2, X4 read them; counsel confirms) |
| H-3 | Apple Developer Program License Agreement 3.3.3(H) if Route A ships (suggestion data "for journaling purposes", use clearly evident); clause (H) does not reach Route B and the rest of 3.3.3 is not read here (EX-CLO-14) | Licence (X1 read it; counsel confirms) |
| H-4 | CAN-SPAM: truthful headers and subject, postal address, one-click unsubscribe honoured within 10 business days; designed to the stricter commercial standard whatever counsel classifies | Law (X2, X4); classification is counsel's call |
| H-5 | COPPA, GDPR and UK law, CCPA: the app is an adult surface, US storefront only at launch, no under-18 use, no face or age signal | Law (X4); counsel confirms |
| H-6 | The App Privacy label stays accurate per data type: Photos or Videos and Precise or Coarse Location stay "not collected" only while nothing from the library leaves the phone; "Data Not Collected" for the whole app is already false (X2 F1) | Apple label definition (privacy read A7; X2) |
| H-7 | Notification and library permissions are optional and the app works without them; push body not sensitive (4.5.4) | Store rules |
| H-8 | Real family details never appear in code, tests or fixtures; only Asha (`no-real-family-data.test.ts`) | Repo rule |
| H-9 | `raw_transcript` immutable; every edit reversible; safety tiers stay on the device | Constitution, CLAUDE.md privacy rules |
| H-10 | PROPOSED, founder to sign in the G10 entry (EX-AI-3): a machine label is allowed only when it is a pure function of metadata the phone already shows the parent (the date, the phone's zone and region, location coordinates, the parent's own marks); it is never a function of content (pixels, audio, words, people); it is ours (two disjoint card fields, R201), never enters a letter, and the parent can hide it | The constitution says the machine may not add meaning; this is the reading that lets a date or a city name stand. It is a reading of the constitution, so it is the founder's to record |
| H-11 | A public or in-app sentence says what we receive or keep ("we do not receive the dates, places or pictures it reads"), never where something lives, and every such claim is a registered claim with a named test (EX-CLO-12, R193) | The production build has server features on; an absolute "stays on the phone" claim is false there |

### 3.2 Amended or reversed rulings

| Rev | Old id and ruling | What changes | One-line reason | Default for the founder |
|---|---|---|---|---|
| RV-01 | Three-tab ruling (`infra/scope-stack-rank-and-ia-redesign-2026-11-19.md`; IA-R1, IA-FINAL section 4; D-161, Decided by the founder on 11 Nov, so this is a reversal of a decided ruling) | Four tabs: Home, Moments, Book, Me | The founder wants a tab for this job; a feature this central needs its own place | Sign (section 4) |
| RV-02 | J3 and IA-R3 (the brief calls it J4) / NS-35-R1: only Home starts a letter | Moments may call the one `startCapture({source:'moment'})`; it builds no recorder of its own and no cluster | A card that cannot start a letter is a dead end for a tired parent | Sign the one doorway (Q-P1-2 default) |
| RV-03 | K-02: no permission ask in first run | K-02 stands for the notification ask and for first run. A parent-opened primer on the Moments tab is not an unprompted ask (it also clarifies the one-ask principle, PRD v2 03 principle 10). The library ask is the parent's own tap inside Moments, any time after first run (gating it on a first kept letter is the stricter alternative, O-05) | Satisfies Apple's "direct user action" and keeps first run fast | Sign the narrow form |
| RV-04 | BL-1305 and NS-49-R25: no photo-library usage string or PhotoKit call in any 1.x build | Narrowed to per-profile: forbidden in every profile except the release profile, where `EXPO_PUBLIC_PHOTO_MOMENTS` is ON (founder ruling 21 Nov); preview and development carry it for test builds. BL-1305 also contradicts NS-51-R2 (which allows a string when the flag is on), so the settlement is the same (MT-P5-R1, R5, R6) | The library read is the feature and ships first | Signed in effect by the ruling; the D-### entry records it |
| RV-05 | NS-51-R1: no other screen asks for library access | The ask may live on Moments, only after one sentence, only on a tap | The ask must sit where the value is shown | Sign |
| RV-06 | NS-51-R8: the capture menu offers only the newest moment, never a list | Recent shows a list of days, bounded (section 7) | The founder asked for Recent, newest first | Sign |
| RV-07 | NS-51-R9 / "ML-6" (as the brief states it; the written rule found is NX-39-R16): a card shows a date, never a place or a thumbnail | Thumbnails are allowed inside the tab the parent opened; place and title stay banned | A card without a picture does not help a parent recognise the day | Sign thumbnails, keep "no place" |
| RV-08 | NX-39 ruling 3, K1 and "ML-3": no notification is derived from the library | One neutral local nudge may be timed from the library after a separate opt-in, in the identical-words form only (section 13) | Engagement is the point of the ask; the lock screen discloses nothing a plain evening reminder does not | OPEN (O-02) |
| RV-09 | E75: no marketing email at 1.0; CATALOG principle 5 and line 161: no child-anchored email | A lifecycle email, opt-in, off by default, built only from server-held facts, dark until signed | The founder asked for email nudges; email cannot use the library | OPEN (O-03) |
| RV-10 | NS-50-R5 rank 4: the year-ago letter is a Home slip | It lives on Moments when Moments is on; Home keeps ranks 1 to 3b | One fact, one place (P1 5.2) | Sign |
| RV-11 | NS-49-R9: Apple's title is shown with "Use this" | Apple's title is never shown or stored by us | Constitution; the brief | OPEN (O-08) |
| RV-12 | NS-51-R6 as amended by E37 and ML-4: 30 moments with up to 6 asset ids stored | Nothing library-derived is persisted by default; a cache file is allowed only if the spike proves it needed (section 10) | ML-4 and R6 conflict (X5 section 0.7); no stored id is safest | OPEN (O-09) |
| RV-13 | Q-PM-7 / CL-052: photo moments are drop C, after approval, spike first | The library read ships in the first release behind release gates (section 21); nothing waits for 1.1 | Founder ruling 21 Nov | Decided by ruling |
| RV-14 | NS-51-R35: the words "moments" and others are banned on the Me row | "Moments" is allowed as a tab label and place (PR #1276, D6); the Me row never says it | Founder: "Think we go with Moments" | Sign (#1276) |
| RV-15 | NS-51-R12 / R19 no nagging: unchanged in spirit; the new Home pointer line (section 4.5) is the only added prompt | One pointer, once | Discovery | Sign (O-06) |
| RV-16 | Analytics: ML-3 and K1 keep library signals out of analytics | Unchanged. A closed allowlist is added (section 18); no permission result is sent | Privacy | Not a reversal |
| RV-17 | Phase order of the brief and of P5 O2 / PR #1269: tab first, library later | The first release includes the library read (Route B); Route A (Apple's suggestions picker) stays an optional later door | Founder: "No it needs to ship with photo library read." | Decided by ruling |
| RV-18 | NX-39-R16 / ML-6 (no place), NS-51-R9 and R10, Q-PM-5 and CL-050 (place names off), MT-X1-R5 and PRINCIPLES-REVIEW section 6 L3 and L4 (no place, no title on a card) | Cards and themes carry places and special occasions. Places come from the pictures' own location metadata, resolved on the phone (7a.1). A place is a label we compute, never saved into a letter unless the parent chooses it | Founder, 21 Nov: "Places. Special occasions etc all are part of it. Don't exclude what drives attention." | Decided by ruling; release gate G8 on the data flow |
| RV-19 | NS-51-R5 (read only date, type and id) and Q-PM-5 | The read set gains the picture's location, read only inside the place resolver, never persisted, never sent | Needed for places | Decided by ruling; privacy and security-architect approve READ_SET_V1 (G3) |
| RV-20 | NS-18-R5 and NS-46-R5: a typed or ticked day never recurs | A parent-marked day and a first the parent marked may recur each year if the parent chooses "every year" | Recurring dates are in the ruling (birthdays, monthiversaries, firsts the parent marked) | OPEN (O-35) |
| RV-21 | NS-46 (only days the parent ticks exist) | App-supplied public holidays by date, civic only, a switch per holiday in Me; religious and cultural days stay parent-ticked | Founder: public holidays by date | OPEN (O-33) |
| RV-22 | Constitution: no scene, event or person guess | Not touched in the first release. A labelled machine-made suggestion (K-SUG, 7a.4) is NOT PLANNED on the CAIO and CPO recommendation: it reads pixels, so it is a different class from every other label here; it returns only with its own founder entry (R203). Faces and naming people stay OUT | Founder asked for it; the constitution about the parent's words is unchanged | OPEN: O-32 (recommend NOT PLANNED), O-30 (faces OUT) |

### 3.3 The principles review, folded in (PRINCIPLES-REVIEW-21nov, head 66bcc4f0)

The review read 79 of our rules: 55 KEEP, 24 AMEND, 0 REVERSE, and 14 external rules we cannot change. The constitution is on no amend row. Defaults this file adopts from its top ten (each is an OPEN row where it is the founder's call):

| # | Change | Default in this file |
|---|---|---|
| 1 | A fourth tab, second, Home landing (D-161, IA-R1) | Yes (section 4) |
| 2 | A library read in a 1.x build, exact usage string, Limited honoured (R35) | Yes, and now in the first release by founder ruling; release gates apply (section 21) |
| 3 | The tab holds the permission ask on the parent's tap, a comfortable Not now, a working no-permission path | Yes (section 8) |
| 4 | A bounded Recent list with the parent's own thumbnails (R42 to R44) | Yes; no numerals, no "unwritten"; window ASSUMED (the review says 30 days, P3 says 14, P6 gives no value; the spike decides) |
| 5 | Computed labels: weekday and date on every card; a place label and special occasions are IN by founder ruling 21 Nov ("Places. Special occasions etc all are part of it. Don't exclude what drives attention."), which reverses the review's L3 and L4 positions for labels we compute on the phone; no part-of-day word on the card; never a machine title, never a person | Yes with the firewall F1 to F8 below and the place gate (section 21, G8) |
| 6 | A day card starts the letter with `source: 'moment'`, in memory only | Yes |
| 7 | A library-timed local nudge in identical ordinary-reminder words, own switch | Only after counsel answers Q-X1-6; release gate for that piece |
| 8 | One opt-in email on a parent-chosen date, never from the library | Phase 2; dark first, send to the founder only, commercial standard |
| 9 | K-02 stands for the notification ask; a parent-opened primer is not an unprompted ask | Yes |
| 10 | Tab-level analytics with closed kinds and no library facts | Yes, under the D-163 consent default; library kinds never |

Id notes: "ML-3" and "ML-6" in the brief are NX-39 ruling 3 (with R26, R27, K1) and NX-39-R16; the brief's "J4" is J3 and IA-R3; NS-49-R9 (show Apple's title as Apple's) conflicts with MT-X1-R5 (never show or store a title) and is settled by dropping every Route A item but the pictures (O-08). Machine-label firewall, adopted as a requirement (section 5.4): F1 closed label kinds in core; F2 no free-text machine field; F3 (replaced in round 1 by the structural rule in R201: two disjoint card fields with different type tokens; the old wording "visibly ours" could not be tested) with no sparkle, "AI" or "suggested" mark and replaceable by the parent's own words; F4 never crosses into a letter; F5 never saved, exported, shared, in a notification, analytics, logs or crash reports; F6 use the phone's current zone and show a clock range if a label could change by zone; F7 words from `packages/content`; F8 one switch in Me turns labels to plain dates and a kill switch can hide them.

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

Moments cannot invent a day. On a day with nothing new, the tab still holds one honest card: a question from the 111 prompts (never a gap prompt), the child's age day if there is one, a typed day. That is the daily reason, and it is the same on the day after a parent writes ten letters and the day after none (MT-P5-R19). Where a real day exists (new pictures, a marked day, a birthday, a letter from a year ago) it leads. Moments as a daily return driver is a HYPOTHESIS to test, not a finding; no parent evidence exists. We do not claim a rate; the five-parent diary measures whether parents say they opened it unprompted (E4). P1 recommended dropping the daily-return claim (Q-P1-7); this file keeps it only as "a real reason when something real exists, and one honest card otherwise". OPEN (O-04).

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
| NS-53-R3 | Given the bar on an iPhone SE 3 at AX5 with Bold Text and with Reduce Transparency, Then four labels fit whole (13 pt floor), the bar stays paper, no glass is added to it, the Large Content Viewer covers the fourth tab, and VoiceOver says "Moments, tab, 2 of 4". Review (EX-DES-14): the bar, the token and the Large Content Viewer are R215 | L2, L3, L4, L5 | P0 (a) | 1 | MT-P1-R22, MT-T1-R2..R5, MT-D1-R3, MT-D4-R3, MT-D4-R20, MT-D4-R27, EX-DES-14 |
| NS-53-R4 | Given any tab or the app icon, Then no badge, dot, number, count, streak or gap shows, and the "arrival" of something new is shown only inside the tab, once, quietly | L0, L2 | P0 (a) | 1 | MT-P1-R12, MT-P2-R35, MT-T1-R17..R19, MT-D1-R2, MT-P3-R30 |
| NS-53-R5 | Given two tabs could show one fact (a marked day that is today, a year-ago letter), Then a single registry names one owner and the fact shows on one tab only; the year-ago letter shows on Moments, not as a Home slip, when Moments is on | L0 | P1 | 1 | MT-P1-R6, MT-P1-R7, MT-P2-R12, MT-P2-R13 |
| NS-53-R6 | Given a first cold start after first run, Then no photo-library question has been shown, no PhotoKit call made, and the first permission the parent meets is the microphone on their first tap of Speak | L1, L2 | P0 (b) | 1 | MT-P1-R8, MT-P3-R9, MT-D2-R5, MT-X4-R5 |
| NS-53-R7 | Given five parents shown the four-tab bar and the heading and first line of each tab, When asked what Moments is for and which tab they would open first, Then the result is recorded as x of n with a stop line, and no telemetry is used | L5 | P2 | 1 | MT-P1-R23, MT-P2-R41, MT-R1-R3, MT-R1-R4, MT-R1-R5, MT-R1-R6, MT-R1-R7, MT-R1-R8 |
| NS-53-R8 | Given the tab name, Then every parent-facing mention comes from `packages/content`, the glossary allows "Moments" only as a navigation label and place, the Me photos row never says it, the store listing, name, subtitle, keywords, screenshots and website do not say it until counsel clears the name, and a nudge never reads as a slideshow. Review (EX-CMO-3, EX-CMO-10, EX-CBO-9, EX-CLO-9, EX-CPO-14): the label comes from exactly one content key, the link path and route name are internal and never user-visible, a fallback label (PR #1270's "Days", or another cleared word) is named now so a rename is a one-key change, and store screenshots follow R194 | L0 | P0 (b) | 1 | MT-D6-R1..R11, MT-X1-R12, MT-P2-R31, MT-D5-F1, MT-D2-Q1, EX-CMO-3, EX-CMO-10, EX-CBO-9, EX-CLO-9, EX-CPO-14 |
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
| NS-53-R11 | Given any source, Then no card shows a machine-made title, caption, summary, story, mood, scene, object, person, face, count, gap word, streak, point, badge, "best", "memories" or a line implying the app wrote, chose or found words; a content test fails each | L0 | P0 (a) | 1 | MT-P2-R3, MT-D3-R2, MT-D3-R24, MT-P3-R8, MT-P5-R20, MT-D5-F5, MT-X3-R25 |
| NS-53-R12 | Given any card, Then it carries a reason line from a closed list in `packages/content` (for example "A day you added", "A day you chose", "From {child}'s birthday", "A letter from this day", "Pictures from your phone") and no free text | L0 | P1 | 1 | MT-P2-R4, MT-D5-R5, MT-D5-R6 |
| NS-53-R13 | Given the card family, Then there is one component per kind (`MomentCard`, `DayCollage`, `PermissionAsk`, `ExampleCard`, `SegmentedSwitch`), built from existing tokens and shared components, each documented and tested | L1, L2 | P1 | 1 | MT-D1-R8..R13, MT-D4-R34 |
| NS-53-R14 | Given any section with nothing to show, Then one calm line and one action show, never an apology, "nothing yet", a count or an empty header | L0, L2 | P0 (a) | 1 | MT-P1-R13, MT-D5-R6, MT-D3-R23, MT-D4-R33, MT-P3-R24 |
| NS-53-R15 | Given a card is tapped, Then one capture starts (section 9) and the card never turns into a link to the new letter or shows "done" | L2 | P0 (c) | 1 | MT-T3-R27, MT-T3-R28, MT-A4-R21 |
| NS-53-R16 | Given any card, Then its date heading is the weekday and date in the parent's locale ("Saturday 14 November", a computed fact the parent can check), no part-of-day word, title, person or scene appears on a card, a place appears only from the place pipeline of 7a.1, and clock times appear only in the day sheet; the label function is a pure function of one timestamp, the locale and the phone's zone, imports nothing that reads location, content, people or the network, shows a clock range if the label could change by zone, and the card model has no free-text machine field. Review (EX-AI-1, EX-DES-13): the machine place line and the parent's label are two disjoint fields (R201); the card has one VoiceOver name (R214) | L0, L1 | P0 (a) | 1 | MT-D3-R6, MT-D3-R2, MT-D5-R5, MT-D3-R7, MT-X3-R2, EX-AI-1, EX-DES-13 |
| NS-53-R17 | Given a machine label, Then it renders in the machine slot and type style of R201, never in the parent's words slot (no sparkle, "AI" mark or "suggested" word), the parent can replace it with their own words (phone only, 60 characters), it is never copied into a letter, never saved, exported, shared, put in a notification, analytics, logs or crash reports (the Save a copy file and the synced entry are byte-identical with and without it), one switch in Me turns labels to plain dates, and a kill switch can hide them | L0, L2 | P0 (a) | 1 | MT-D3-R7, MT-P4-R15, MT-P4-R17, MT-P6-R40 |

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
| S7 | A day of pictures from the phone | Library readable and the day qualifies (section 7) | Thumbnails, the date, a place label from 7a.1 when away from home | A machine title, caption, event name or count |

### 6.3 The one ordering rule

Up to four slots, in this order, only those that exist (MT-P2-R2, R6): Today (S1, then S3 birthday, then S2, then S3 month day, strongest first, two ticked days name both); Look back (S4); Pictures (S7 when the library is readable, else S5 or the system picker row); Question (S6, always). The lead of the screen is the first card that exists. This is the NS-32 and NS-50-R5 order widened from one slot to four, not a new priority. For one local day every open returns the same list (NS-23-R13 pattern); at local midnight the choice is made again.

### 6.4 How each kind is formed: rule, example input, example output

Inputs to any rule are only: date of birth, typed days, ticked Days, kept letters, the prompt catalogue, the parent's own marks (a heart, a kept-close day, a label, a chosen album) and, in phase 2, creation dates, media kinds and durations of pictures. Each row is a golden in `packages/core/test/moments`.

| Kind | Rule | Asha input | Output the engine must give |
|---|---|---|---|
| K-DAY | Typed date equals today's local date | "Nani's call" typed for Sat 21 Nov 2026; today Sat 21 Nov | Today card, reason RSN-MARKED, body "Nani's call". On Sun 22 Nov: gone, no message |
| K-BIRTH | Local month and day equal the date of birth (29 Feb: the planner's rule) | Today Sun 12 Apr 2026 | Today card for the first birthday, reason RSN-BIRTHDAY |
| K-AGE | Local day of month equals the birth day of month, clamped to the month's last day, and the book is born | Today Thu 12 Nov 2026 | Today card, reason RSN-MONTHDAY; whether it names the number of months is OPEN (P6 Q6, O-11); on Fri 13 Nov none |
| K-YEAR (letter) | A kept letter exists on this month and day in an earlier year and passes the NS-23 filters; book not quiet | Letter Fri 21 Nov 2025; today Sat 21 Nov 2026 | Look back card, reason RSN-LETTER, fragment "We tried the blue spoon.", opens the letter in the Book. Quiet book: absent |
| K-YEAR (pictures) | Pictures that pass section 7.2 exist on this month and day in an earlier year after the birth, fetched by that one date only | F13: 6 photos on Fri 21 Nov 2025 | Pictures card, reason RSN-YEAR "Pictures from this day in 2025". Never "a year ago" as a count. F14 (before the birth): never used |
| K-PROMPT | `selectPrompt` kind `opening`, seed = local day key, exclude Home's key | Any day, Asha born | One of the 111 prompts, same all day; "Another thought" gives another; before the birth only the `before` set |
| K-PICK | A draft or kept letter holds attached pictures | A draft with two pictures | Not a Moments card (Home's waiting set owns drafts); a kept letter's picture appears only on its K-YEAR card |
| K-LIB | Section 7 | `asha-lib-v1` | Section 7 |
| Seasonal or holiday day | Only ticked Days (S2, NS-46 catalogue) exist; we add no automatic season, weather, "first snow" or holiday card | A ticked Day whose date is today | Today card with the day's name and one line. OPEN (O-07): the founder may want an app-supplied seasonal list from a shipped calendar table (fixed dates, a switch, no inference). Default: no |

### 6.4a The closed reason list (P6's 13 lines plus four added by the 21 Nov ruling, 17 in all, less RSN-SUGGEST which round 1 removed from the phase 1 list (EX-AI-6, EX-CPO-14): 16 in the first release; intent for `content`)

RSN-MARKED "A day you marked"; RSN-BIRTHDAY "On {child}'s birthday" (a date fact, not an event); RSN-MONTHDAY "From a month day for {child}"; RSN-KEPT "A day you kept close"; RSN-HEART "Pictures you hearted"; RSN-ALBUM "From an album you chose"; RSN-VIDEO "A video from this day"; RSN-DAY "Pictures from this day"; RSN-YEAR "Pictures from this day in {year}"; RSN-RUN "Pictures from these days" (only if runs ship); RSN-PICKED "Pictures you picked before"; RSN-PLACE "Pictures from {place}" (a place the pipeline of 7a.1 named); RSN-HOLIDAY "On {holiday}" (a public holiday by date, 7a.3; a date fact, not an event); RSN-FIRST "A first you marked"; RSN-LETTER "A letter from this day"; RSN-QUESTION "A question to start from". Precedence when several apply to one date: marked, first, birthday, month day, holiday, kept, album, place, heart, video, day; losing reasons are not shown and nothing says "and more". A reason not in the list fails the build. This replaces the open list P2 R4 sketched.

### 6.5 Requirements

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R18 | Given today's local date and several Today sources, Then one Today card names them strongest first (typed day, birthday, chosen day, month day) and two chosen days name both | L0 | P1 | 1 | MT-P2-R6 |
| NS-53-R19 | Given S1, Then it shows only on its date with the parent's own words, never an upcoming day or a list; a typed day is gone the day after | L0 | P1 | 1 | MT-P2-R7 |
| NS-53-R20 | Given S2 on a quiet day, Then the card shows the name and "The book is open if you want it." with no question and no prompt block; a day not ticked never shows | L0 | P0 (a) | 1 | MT-P2-R8 |
| NS-53-R21 | Given a book before the birth, Then S3 does not exist and S6 draws only from the `before` set | L0 | P1 | 1 | MT-P2-R9 |
| NS-53-R22 | Given the 31st, a 29 Feb birth date or a month with fewer days, Then month days and the birthday follow the planner's existing date rule and never skip a month without a rule | L0 | P1 | 1 | MT-P2-R10 |
| NS-53-R23 | Given S4, Then it follows NS-23-R2, R5, R8, R12, R15 exactly (verbatim fragment; never sealed, hidden, private, deleted, quiet-book, hard-prompt, same-day or empty letters) and shows nothing else about the letter | L0 | P0 (a) | 1 | MT-P2-R11 |
| NS-53-R24 | Given a hard-stretch or quiet state on this phone, Then Moments shows no S4 card and no bright-tone Today card, the question uses only the kind Home uses, and nothing is shown from a quiet book | L0 | P0 (a) | 1 | MT-P2-R14, MT-P4-R35 |
| NS-53-R25 | Given S6, Then `selectPrompt` is called with kind `opening`, no `daysSinceLastEntry`, `excludeKeys` holding Home's key, and a deterministic seed per local day; `gap` and `hard` can never be chosen | L0 | P0 (a) | 1 | MT-P2-R15 |
| NS-53-R26 | Given "Another thought", Then a different prompt shows and nothing is counted or logged; the card height does not jump and VoiceOver hears the new prompt without losing place | L0, L2, L4 | P2 | 1 | MT-P2-R16, MT-A2-R23..R26 |
| NS-53-R27 | Given the same inputs and local date, Then `momentsFor` returns the same list on every call, across cold starts and two phones holding the same book | L0 | P1 | 1 | MT-P2-R39, MT-X3-R12 |
| NS-53-R28 | Given "Not today" on a card, Then it leaves until the next local day, plays no haptic, fills no gap in the same visit, is not logged, and returns tomorrow if eligible | L0, L2 | P1 | 1 | MT-P2-R23 |
| NS-53-R29 | Given "Not this one" on S7 or S4, Then only a local day key (S7) or a local letter id (S4) is stored on the phone and is removed by Turn off, Erase and sign-out; hiding is reversible and soft and a hidden day never leaks into any other surface. Review (EX-ENG-3): the file contract is 17.1 (R221) | L0, L2 | P1 | 1 | MT-P2-R24, MT-D3-R16, MT-D3-R17, MT-A1-R14, EX-ENG-3 |
| NS-53-R30 | Given the Me list "What shows in Moments", Then each source has one switch or a link to its own setting, off removes cards at the next focus and cancels that source's planned notes within 1.5 s, and the list has no count | L2 | P1 | 1 | MT-P2-R25, MT-X3-R16 |
| NS-53-R31 | Given every source turned off, Then Moments shows one calm line and the picker, and no other screen mentions it | L2 | P2 | 1 | MT-P2-R26 |
| NS-53-R32 | Given two books, Then Moments is per active book for S1 to S6 and S7 is the same under both; starting a letter from a day of pictures asks "Whose book?" only when more than one book is visible | L2 | P1 | 1 | MT-P2-R22, MT-P1-R5 |
| NS-53-R33 | Given the app opened after a long absence, Then the cards are the same as on any day and no string names the absence | L0 | P0 (a) | 1 | MT-P2-R21, MT-P5-R19 |
| NS-53-R34 | Given a book with no date of birth, a book before birth or a nameless child, Then no month-age or age day shows, no zero or blank shows, the fallback "your child" is used and Moments never asks for a date of birth | L0 | P1 | 1 | MT-P1-R15 |
| NS-53-R35 | Given a new phone whose book has not arrived, Then Moments shows the arrival line, offers nothing to start and asks nothing about photos | L2 | P1 | 1 | MT-P1-R16 |
| NS-53-R36 | Given the source registry (`momentsFor`), Then each source lists its surfaces as data (`pushSafe`, `serverSafe`), only S1, S2, S3 and S6 are `pushSafe` (S7, the library, is not `pushSafe` in phase 1 and lists no surface until its founder decision id exists), only S3 is `serverSafe`, a test fails if the library source lists `push` or `email`, and a test fails if any source lists `email` without a founder decision id. Review (EX-AI-7, EX-CPO-6): the build fails if S7 lists push, email or widget without the decision id; row R58 is merged into R64 at the lower priority | L0 | P0 (a) | 1 | MT-P2-R27, MT-P1-R17, MT-P1-R19, MT-X3-R1..R3, EX-AI-7, EX-CPO-6 |

## 7. Grouping rules: from pictures to days (source P6)

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
| NS-53-R37 | Given the library module, When it scans, Then it reads only the closed `READ_SET_V1` (local identifier, creation date, media type, duration, location coordinates read only for the place resolver of 7a.1, the subtype flags for screenshot, screen recording, animation, panorama, Live Photo and video variants, `isFavorite`, `burstIdentifier`) and a scan fails the build on any other `PHAsset` property name. OPEN (O-15, P6 Q1): reading hearts and burst ids widens NS-51-R5; privacy, security-architect and the founder approve the set | L1 | P0 (a) | 1 | MT-P6-R1, P6-Q1, MT-P2-R5, MT-X3-R5, MT-X3-R7, MT-X3-R8 |
| NS-53-R38 | Given the scan, Then no-date, hidden, screenshot, screen-recording, animation, non-user-library and left-out assets are excluded before grouping and leave no trace in any output | L0, L1 | P0 (a) | 1 | MT-P6-R2, MT-P6-R49 |
| NS-53-R39 | Given a picture and the phone's zone, Then it lands in the local calendar day via `offsetAt`, a clock-change day is one day, a zone change moves only day assignment, and the card date equals the Photos app's date on this phone | L0, L5 | P0 (a) | 1 | MT-P6-R3, MT-P6-R21, MT-P6-R47 |
| NS-53-R40 | Given a local day in the window, Then it qualifies for Recent only by the rules of 7.2, a lone ordinary picture does not, and counting excludes everything 7.1 excludes. OPEN (O-12) against D3 6.1. Review (EX-DES-4): the shape of Recent is R210 | L0 | P0 (a) | 1 | MT-P6-R4, P6-Q10, MT-P2-R17, EX-DES-4 |
| NS-53-R41 | Given a qualifying day, Then sessions split at `SESSION_GAP`, one burst is one candidate, a hearted picture is the first tile and gives the reason RSN-HEART only when no stronger reason applies, a video day shows length as text plus a glyph, and Live, HDR, depth effect and high frame rate change nothing | L0, L5 | P1 | 1 | MT-P6-R5..R9, MT-A2-R12, MT-D3-R5 |
| NS-53-R42 | Given any card, Then it carries exactly one reason from the closed list of 6.4a by the stated precedence and a reason outside the list fails the build; no reason names what a picture shows | L0 | P0 (a) | 1 | MT-P6-R11, MT-P2-R4 |
| NS-53-R43 | Given the Moments code and library module, Then a scan fails on any forbidden signal (faces, people, scene or object classification, captions, titles, filenames, EXIF text, music, Apple moments APIs, `Vision`, `CoreML`, `MediaPlayer`, `PHPerson`, and any network geocoder or map search such as `CLGeocoder` or `MapKit` outside the gated adapter of 7a.1) and no string names one | L1 | P0 (a) | 1 | MT-P6-R12, MT-X1-R6, MT-X2-R21 |
| NS-53-R44 | Given a day, Then tiles follow the order of 7.3 using only capture time, burst id, hearts and earlier picks, are identical in any input order and on any phone, and one heart added or removed changes at most the slots the heart rule changes | L0 | P0 (a) | 1 | MT-P6-R14, MT-P6-R15, MT-P6-R16, MT-P6-R18, MT-D3-R3, MT-D3-R4, MT-D1-R10, MT-A2-R5, MT-A2-R6 |
| NS-53-R45 | Given a candidate whose original is in iCloud, When the tile resolves, Then it takes the next candidate or a plain box, never triggers a download and never reorders after the first draw | L5, L0 | P1 | 1 | MT-P6-R17, MT-A2-R10, MT-A5-R8, MT-D3-R21 |
| NS-53-R46 | Given an occasion date with pictures, Then one card shows the date, the occasion reason, the parent's own label and the collage, never two cards for one date; with no pictures it is the Today card with no collage and no line about missing pictures | L0 | P0 (a) | 1 | MT-P6-R23, MT-P6-R24, MT-P6-R35 |
| NS-53-R47 | Given a book not quiet or hidden, When an earlier year after the birth holds qualifying pictures on today's month and day, Then one RSN-YEAR card may show, from a fetch of that date only, nothing stored, no "N years ago"; "Not this one" removes that year for good | L0, L5 | P0 (a) | 1 | MT-P6-R25 |
| NS-53-R48 | Given a day that holds a kept open letter, Then the card shows "A letter is here" and not a second card; a sealed letter shows nothing | L0 | P1 | 1 | MT-P6-R26, MT-D3-R9 |
| NS-53-R49 | Given a library day, Then no prompt is chosen from the pictures, no prompt names or hints at them, and capture starts with an empty words field | L0 | P0 (a) | 1 | MT-P6-R27, MT-D3-R8, MT-P4-R5 |
| NS-53-R50 | Given the age on a day, Then it may appear only in the detail header of an occasion day, never as a number on the card until `content` rules (OPEN O-11) | L0 | P2 | 1 | MT-P6-R28, P6-Q6 |
| NS-53-R51 | Given For you, Then the pictures slot picks by the class order of 7.3 and the seeded rotation of 7.3, the choice is the same on every open that day and on two phones with the same library, and every view is finite with no number except a date, clock time, duration or year | L0 | P0 (a) | 1 | MT-P6-R29, MT-P6-R30, MT-P6-R31, MT-P6-R32, MT-P6-R33 |
| NS-53-R52 | Given any string in Moments, Then none contains the forbidden words of P6 R34 ("we found", "suggested", "recommended", "based on", "smart", "highlights", "memories", "best", "special", "trip", "outing", "visit", "event", "party", "more") and the content test passes `rules.test.ts` and the glossary | L0 | P0 (a) | 1 | MT-P6-R34, MT-P6-R50, MT-P6-R37 |
| NS-53-R53 | Given a cold start or foreground, Then cards paint from the last in-memory result or static content first, thumbnails resolve after, no card reorders after it is final, and library work starts after first paint | L5, L0 | P1 | 1 | MT-P6-R36, MT-P6-R51, MT-X3-R13, MT-D3-R18 |
| NS-53-R54 | Given the teaching verbs, Then the closed set is the seven of 7.4, a tap, dismissal, scroll or dwell never adjusts ranking, qualifying, rotation or reasons, no tap history or per-person score is kept, and each verb has an Undo, is not logged, and is listed and removable in Me with "Start again" | L0, L2 | P0 (a) | 1 | MT-P6-R38, MT-P6-R39, MT-P6-R43, MT-P6-R44 |
| NS-53-R55 | Given "Name this day", Then up to 60 typed characters are stored on the phone with the day key, shown verbatim, with no autofill from library data; "Keep this day close" stores a day key only and has no recurrence in v1 (OPEN O-16, P6 Q5) | L0, L2 | P1 | 1 | MT-P6-R40, MT-P6-R41, P6-Q5 |
| NS-53-R56 | Given "Leave out this picture", Then that picture leaves tiles, counts and every day and its identifier is stored in the local moments file (L4, wiped by Turn off, Erase and sign-out). OPEN (O-13): conflicts with MT-X5-R1 and R3; without it a receipt day cannot be cleaned | L0, L1 | P0 (a) | 1 | MT-P6-R42, P6-Q4 |
| NS-53-R57 | Given full access and Me, Photos, Albums, When the parent chooses an album in our chooser, Then its identifier (not name) is stored, the album title shows verbatim only on days it supplies, with reason RSN-ALBUM; limited access, shared, synced, imported and smart albums are never offered. OPEN (O-14) | L0, L2, L5 | P1 | 1 | MT-P6-R10, P6-Q3 |
| NS-53-R58 | Given a kept-open run of days with `runs` on and a run no longer than `MAX_RUN`, Then one card may show the plain date range with reason RSN-RUN and, where 7a.1 resolves one, the place (a plain place plus date range such as "Lisbon, 24 to 26 October", reason RSN-PLACE), and never a purpose word or the word "trip"; the plain date-range run without a place stays default off | L0, R | P2 | 1 | MT-P6-R19, MT-P6-R20, MT-P6-R55, P6-Q2, P6-Q9 |
| NS-53-R59 | Given the golden fixture `asha-lib-v1`, Then the output equals the committed golden for all 20 cases, is identical in 100 seeded input orders and with extra excluded assets present, and the `Moment` type has no free-text field except a parent label, a chosen album title and closed reason keys | L0 | P0 (a) | 1 | MT-P6-R45, MT-P6-R46, MT-P6-R48, MT-X3-R2, MT-X3-R11 |
| NS-53-R60 | Given the five-parent card sort, Then part 1 and part 2 meet the P6 bar (a true reason for at least four of five cards unaided; no "it is guessing"; no more than two junk days in ten after one use of Not this one), three questions are asked verbatim, "I did not expect it to know" halts that signal until privacy reads it, and the outcome is "x of 5" with failing cards and no real data | L5 | P1 | 1 | MT-P6-R52..R54, MT-P6-R56 |

## 7a. Places, special occasions and what stays out (founder ruling 21 Nov)

The founder: "Places. Special occasions etc all are part of it. Don't exclude what drives attention." This reverses the earlier "no place, no title" position for labels we compute on the phone (RV-18, RV-19). It does not change the constitution about the parent's own words: the machine never writes or rewrites a letter, a label is shown as ours and is never saved into a letter unless the parent chooses it, and there are no counts, gaps or streaks.

### 7a.1 Places: the hard constraint and the approach

Coordinates are Precise Location on the label the moment they leave the phone for our use, and Apple's geocoder `CLGeocoder` works with a network-based service, so a reverse geocode sends the picture's latitude and longitude to Apple (privacy read A6, VERIFIED by that lead; what Apple logs or keeps is UNVERIFIED, and whether a map tile also sends the region is UNVERIFIED). Nothing library-derived may reach OUR servers in any option. The three approaches:

| Option | How | Data that leaves the phone | Output | Label, policy, consent | Gate |
|---|---|---|---|---|---|
| P-A offline place table (recommended for the first release) | A bundled table of cities, regions and countries; nearest place by arithmetic on the phone | None | City, region and country names ("Lisbon, Portugal"); never a street, a venue or a hospital. The table has a population floor and no point of interest, campus or neighbourhood entry; a version, a checksum and stable external ids (R229) | Location metadata of pictures is read on the phone to name a place: the purpose string and policy say so; Location stays "not collected" while nothing leaves | Privacy and security-architect approve reading `location` (G3); dataset licence and bundle size (UNVERIFIED, mobile measures); accuracy spike (G1) |
| P-B Apple geocoder (optional, later) | `CLGeocoder` reverse geocoding of a day's dominant coordinate, at most one request per card shown, cached on the phone only | The picture's precise latitude and longitude, to Apple's service, over the network | Place names that may include a neighbourhood or a point of interest | A separate opt-in, off by default, with its own consent text naming exactly this data and the recipient; the policy and label change (counsel decides whether this is "collection" under Apple's definition) | G8: counsel and privacy on the data flow before it can be on; sensitive-venue handling defined; not in the first release and not compiled into it (R236) |
| P-C parent-typed place | The parent types a place as the day's label (60 characters) | None | The parent's own words | Nothing new | None |

The first release ships P-A and P-C. P-B is a phase 2 piece, needs its own founder decision, and is not compiled into the release profile at all (R236); the earlier "unless the founder signs G8 before submission" clause is struck. Honest limit, said to the founder plainly (EX-DES-3): first-release places are city names, shown only when the family is away from home, so they will mostly appear on trips and visits; a park, a market or a grandparent's garden is the parent's own typed label (P-C), not a machine label. Venue names need P-B, the network and a counsel read. The prototype of D7 draws venue-level labels ("Maple Park", "Lakeside Market") and so must not be used as the G4 stimulus or as the founder's reference for places until it is redrawn at city level (R219). OPEN (O-31).

### 7a.2 How a place is formed and used

1. Coordinates are read only inside the place resolver (`core/moments/place.ts`) and are dropped as soon as a place id exists. They are never persisted, logged, sent, put in a route, a card model, a notification or a fixture; a type test fails if a coordinate field appears on a `Moment`.
2. Each picture resolves to the nearest table entry within a radius (the radius and the table's coarseness are ASSUMED; the spike fixes them) or to none. A day's place is its majority place; a tie gives none.
3. Home place: the most frequent resolved place across the scanned window, held in memory, never persisted, never named as "home" to the parent. A day is "away" when its place differs from it. The parent can correct it ("This is where we live") and the correction is a local key. OPEN (O-34): the default shows a place line only when away (less noise, and the home place is not repeated on every card); the alternative shows the place on every card.
4. A place label is a plain line under the date ("Lisbon"). It is ours, in the machine slot and type style of R201, has a "Not this place" action and can be replaced by the parent's own label. It is never saved into a letter unless the parent picks it as text.
5. A place theme (a stay): consecutive local days that each qualify and each resolve to the same away place form one card with the place and a plain date range ("Lisbon, 24 to 26 October", reason RSN-PLACE). The word "trip", "holiday", "weekend away" or any purpose word is never shown. `MAX_RUN` and the allowed gap between days are ASSUMED data and fixed by the card sort.
6. "Hide this place" (for good) stores a local place key and removes that place from cards and themes everywhere at once; it is undoable and listed in Me.
7. A place is never used in a push, an email, a widget, an analytics event or a log, and never leaves the phone (hard).

Asha example (golden, fixture `asha-lib-v1` extended with synthetic coordinates): three days Fri 24 to Sun 26 Oct 2026, each with 6 pictures whose coordinates fall in the table entry for Lisbon, the library's most frequent place being Seattle: output one card "Lisbon, 24 to 26 October" with reason RSN-PLACE and a collage by the 7.3 rule; the same days with Lisbon hidden: three plain day cards with no place line; a day with 3 pictures in Seattle and 3 in Portland: no place line.

### 7a.3 Special occasions

| Occasion | Source of the rule | How it shows |
|---|---|---|
| Birthday, monthiversary (month day) | The child's date of birth (S3); no server needed | Today card; with pictures on that date, one card with the collage (MT-P6-R23) |
| Typed day, ticked Day | The parent (S1, S2) | As today; a typed or ticked day may recur each year only if the parent chooses "every year" (RV-20, O-35); default off |
| A first the parent marked | A first the parent already marked (NS-06 firsts) | RSN-FIRST on that date and each anniversary if the parent chose "every year" |
| Public holiday | A shipped table keyed by date and by the phone's region setting; civic holidays only; religious and cultural days stay parent-ticked (NS-46) | RSN-HOLIDAY with the holiday's name from `packages/content`; a per-holiday switch in Me; never a claim that it is the parent's holiday. OPEN (O-33): which list ships and for which regions (US only at launch, X4) |
| Any other occasion (scene or event inference) | Specified in 7a.4; not in the first release | K-SUG, later |

### 7a.4 A labelled machine-made suggestion (K-SUG): NOT PLANNED (recommended, O-32)

Status after round 1 (EX-AI-2, EX-CPO-9, EX-CPO-14): K-SUG is not a phase 3 row. It is kept here only as a boundary note and for the day the founder asks for it. The boundary is H-10: a machine label is a function of metadata, never of content, and K-SUG is a function of content (pixels). If the founder later wants it, the entry needs his own words amending that reading of the constitution, the five findings of the CAIO answered, a model with an on-device size and a per-word precision bar written before testing, an abstain default, and a licensed counsel answer (G9) including children's image analysis law. Founder question O-32 is reframed: by "special occasions" did you mean dates we know (birthday, month day, days you mark, public holidays), or also parties and events recognised from the pictures? The second is a labelled guess, off by default, with its own legal gate. Recommended default: the first reading; K-SUG NOT PLANNED. The earlier specification follows unchanged for reference.

If the founder wants events recognised from the pictures themselves, it ships only as a suggestion: on-device only; a closed list of occasion words owned by `content`; the label reads as a guess ("A guess you can set aside", wording never certain and never "found" or "detected"); one tap "Not this one" that removes it for that day for good; firewall F1 to F8 (3.3); never saved into a letter unless the parent chooses it; no people, no faces, no names; no count; off by default with its own switch; and it reads pixels, so it needs its own gate G9 (counsel on 5.1.2(vi), privacy and security-architect on the model and what is retained, the five-parent read that no parent thinks the app is watching). Recommendation: not in the first release; places, dates and calendar occasions carry most of the attention, and K-SUG is judged against real parent evidence after launch. OPEN (O-32).

### 7a.5 Faces and people

Face recognition, person grouping and naming people are OUT (children's biometric data: BIPA, RCW 19.373, X1; no face matching, NS-51-R33). The founder did not mention them. Whether they are ever wanted is an open founder question (O-30); this file does not decide it, and no row, fixture or fallback depends on it. Camera modes that imply a person (selfie, depth effect) stay forbidden signals.

### 7a.6 Requirements

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R61 | Given a picture with location, When the place resolver runs, Then it uses the bundled offline table by arithmetic on the phone, no network request is made, coordinates are dropped once a place id exists, a coordinate field on any `Moment`, card model, route, log or fixture fails a type test and a scan, and a picture with no location or no table entry gives no place and no message. Review (EX-SEC-3, EX-SEC-4, EX-PRV-3, EX-CDO-10, EX-CDO-11, EX-AI-4, EX-ENG-8): the lookup runs in Swift and returns a place id or coarse cell, never a coordinate (R228); the table has provenance, a version, a checksum and stable ids (R229); fail-closed rules and accuracy bars are R204; city level only, shown only when away (R254) | L0, L1 | P0 (a) | 1 | MT-P6-R12, MT-X5-R14, MT-X3-R26, MT-X3-R2, EX-SEC-3, EX-SEC-4, EX-PRV-3, EX-CDO-10, EX-CDO-11, EX-AI-4, EX-ENG-8 |
| NS-53-R62 | Given the network geocoder (P-B), Then it exists only behind a flag that is off, a separate opt-in off by default with consent text naming the data (a picture's precise coordinates) and the recipient (Apple's service), at most one request per card shown, results cached on the phone only, no queued coordinate when offline, nothing library-derived to our servers, and the privacy policy, label and purpose string updated in the same build; a build test fails if the adapter's flag is on without the G8 read-out. Review (EX-SEC-11, EX-PRV-4, EX-CLO-8): not compiled into the release profile (R236) | L0, L1, R | P0 (b) | 2 | MT-X4-R23, MT-X2-R9, MT-X2-R12, MT-X4-R21, MT-X4-R24, EX-SEC-11, EX-PRV-4, EX-CLO-8 |
| NS-53-R63 | Given a day, Then its place is the majority place of its pictures (a tie gives none), the home place is computed in memory only and never named to the parent, a place line shows only when the day is away from home (O-34), the label is ours, has "Not this place" and can be replaced by the parent's own words, and is never written into a letter unless the parent picks it. Review (EX-CDO-12, EX-CLO-15, EX-DES-10): the home place is a computed attribute about where a family lives and the policy says so (R249); the place line is a 44 pt target (R195) | L0, L2 | P0 (a) | 1 | MT-P6-R40, MT-D3-R7, MT-P6-R23, EX-CDO-12, EX-CLO-15, EX-DES-10 |
| NS-53-R64 | Given consecutive qualifying days each resolving to the same away place, Then one card shows the place and the plain date range with reason RSN-PLACE, the word "trip", "holiday" or any purpose word never appears, and the Asha golden of 7a.2 holds. Review (EX-PRV-5): place themes appear only in Recent (R254) | L0 | P1 | 1 | MT-P6-R19, MT-P6-R20, MT-P6-R55, EX-PRV-5 |
| NS-53-R65 | Given "Hide this place", Then that place leaves cards and themes at once, only a local place key is stored (L4, wiped by Turn off, Erase and sign-out), it is undoable, listed in Me with remove and "Start again", not logged and never in any notification, email, widget or analytics | L0, L2 | P0 (a) | 1 | MT-P6-R43, MT-P6-R44, MT-X5-R7 |
| NS-53-R66 | Given the birthday, a monthiversary, a typed day, a ticked Day or a first the parent marked, Then each shows as in 7a.3; recurrence each year applies only if the parent chose it; public holidays come from a shipped table by date and the phone's region, civic only, with a per-holiday switch in Me and a name from `packages/content` (O-33) | L0 | P1 | 1 | MT-P2-R7, MT-P2-R8, MT-P2-R10, MT-P6-R23, MT-P6-R24, MT-P6-R41 |
| NS-53-R67 | Given K-SUG is ever built, Then it is on-device only, off by default, a closed list of words from `content`, labelled as a guess that never claims certainty, has "Not this one", obeys firewall F1 to F8, names no person, and cannot ship before gate G9 closes. Review (EX-AI-2, EX-CPO-14): NOT PLANNED: this row is not carried in phase 3 and is not counted in the first release; the closed reason list has no RSN-SUGGEST; it returns only with a signed founder entry (R203) | L0, L1, R | P1 | not planned | MT-P6-R12, MT-P6-R34, EX-AI-2, EX-CPO-14 |
| NS-53-R68 | Given any face, person or contact signal, Then no code reads or imports it (people albums, face detection, contact photos, depth effect as a person hint), and no row depends on a founder decision about faces | L1 | P0 (a) | 1 | MT-X1-R6, MT-X2-R21, MT-X2-R22, MT-X2-R23, MT-X4-R29 |

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
| Flag off (a gate failed, a kill switch, or an unsupported device) | No library module in the build | The same as ACC-1 without the door row; "Add pictures" through the existing system picker |

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
| The primer for the library read | The `packages/content` key of the one sentence (intent only: "{app} reads the date, the time and where your pictures were taken, on this phone, only while you have Moments open, to show you days." The earlier second sentence, "It does not look at what is in them", is removed unless counsel clears it in writing; counsel and `content` write final words; no on-device-only claim D5-F4; R192) and the versioned policy link | On the phone only: that the primer was shown and answered (a local flag so the ask card does not return). iOS itself holds the permission answer. No server row, no analytics (P3 Q-P3-9 default) | Not a picture, id, date, album, place or count; not the permission result; no hash sent anywhere | Not now and Don't Allow leave every feature working; Export, Delete and the whole capture flow work; Turn off in Me removes the on-phone data at once |
| The nudge opt-in (section 13) | One plain sentence naming the reminder use, equal-weight choices, off by default | The choice, on the phone; for email, the PRIV-R21 consent row on the server (X6) | No library fact in the record; no distinction from an ordinary reminder in any event | Off at once; pending notes cancelled within 1.5 s; account and safety mail untouched |
| The email opt-in (section 13.6) | Sender, purpose, frequency, how to stop | PRIV-R21 row | As above | One-click unsubscribe, no login |
| Teaching acts (Name, Keep close, Leave out, Use album) | The verb and its one line | A day key (or an album or picture identifier where 7.4 says OPEN) on the phone | No server copy, no log, no event | Undo; Me lists and removes; Turn off, Erase and sign-out delete it |

### 8.6 Requirements

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R69 | Given any permission state ACC-0 to ACC-5 and a brand-new account with no letters and no child, When the tab opens, Then at least the "no library" cards render and the tab is never a wall, an uncloseable modal or a blank; examples are drawn, labelled "An example" in text and accessible name, hold no photograph and no real name, place or face, are inert (no haptic, nothing opens), and disappear the day a real card exists. Review (EX-CMO-1, EX-DES-2, EX-DES-20): the primer names date, time and place (R192) and its door lines sit behind one disclosure (R218); examples follow R209 | L2, L3, L4 | P0 (a) | 1 | MT-D2-R1..R4, MT-P3-R4, MT-P3-R5, MT-P3-R6, MT-P3-R18, MT-D4-R13, MT-D5-R7, MT-A3-R3..R6, MT-X4-R61, EX-CMO-1, EX-DES-2, EX-DES-20 |
| NS-53-R70 | Given any launch, tab switch, first run, link, notification tap, recording or review, Then no PhotoKit call that can show Apple's prompt is made, and Apple's prompt shows only after the primer's Continue | L1, L2 | P0 (b) | 1 | MT-D2-R5, MT-P3-R9, MT-P3-R10, MT-P1-R9, MT-X4-R6, MT-T2-R2, MT-T1-R24, MT-T1-R34 |
| NS-53-R71 | Given the ask card, Then it sits below the real cards, "Not now" and the yes are equal in size and weight, neither is styled as the wrong choice, the pinned ask bar shows up to XL text and sits inline from AX1, and the primer is a sheet over the tab | L2, L3, L5 | P0 (b) | 1 | MT-P3-R7, MT-D2-R17, MT-T2-R3, MT-D4-R14, MT-D4-R17, MT-A3-R2, MT-A3-R7, MT-A3-R8 |
| NS-53-R72 | Given the primer, Then it carries the Shown, Records, Never and Decline lines of 8.5 by content key, the purpose string is present only in the allow-listed profile, is plain and true, names every use the library data has in the build (including any reminder timing), and a build test fails if a module ships without it. Review (EX-CLO-4, EX-PRV-1): the purpose string names the place read (R192) | L1, L0, R | P0 (b) | 1 | MT-D2-R8, MT-P3-R12, MT-X2-R10, MT-X4-R1..R4, MT-X2-R16, MT-D5-R2, MT-X6-R24, EX-CLO-4, EX-PRV-1 |
| NS-53-R73 | Given Not now, Then no primer and no ask card return by themselves on any later day, the only doors are the small row on the tab and the Me row, and no timer or counter of refusals exists | L0, L2 | P0 (a) | 1 | MT-D2-R6, MT-P3-R11, MT-T2-R5, MT-T2-R6, MT-A3-R16, MT-D5-R3 |
| NS-53-R74 | Given iOS holds any answer, When the parent taps any door, Then the primer and alert are not shown again and the tab goes straight to the state | L2 | P1 | 1 | MT-D2-R7, MT-T2-R9, MT-T2-R10, MT-X4-R7 |
| NS-53-R75 | Given Limited access, Then days build from the chosen set with no message, a "Choose which pictures" control opens Apple's limited picker, the automatic limited alert is suppressed, no album is offered, a tiny selection never nags, and pictures taken after a Limited choice are not read | L2, L5 | P0 (b) | 1 | MT-D2-R9, MT-D2-R10, MT-P3-R13, MT-T2-R24, MT-T2-R25, MT-A3-R17, MT-X4-R8, MT-D3-R19, MT-D4-R15, MT-D5-R4 |
| NS-53-R76 | Given Denied, Then one calm line with Open Settings shows on the tab and in Me only, no second system prompt is attempted, Home and notifications never mention it; given Restricted, one plain line and no button | L2, L5 | P0 (b) | 1 | MT-D2-R11, MT-D2-R12, MT-P3-R14, MT-P3-R15, MT-T2-R26..R29, MT-T1-R27, MT-A3-R18, MT-D4-R15 |
| NS-53-R77 | Given the parent changes access in Settings, When the app returns, Then the tab re-reads once and redraws in under 1 s with no message, a downgrade empties the on-phone data at once, state is read and never remembered, and coming back from Settings moves the screen once. Review (EX-DES-12): the still state is R213 | L2, L5 | P0 (a) | 1 | MT-D2-R13, MT-P3-R16, MT-T2-R9, MT-T2-R11..R13, MT-A3-R19, MT-X5-R8, MT-X4-R63, EX-DES-12 |
| NS-53-R78 | Given the Me entry for Photos access, Then it states on or off in plain words (not by colour), Turn off removes the on-phone index and the moments file at once, and it shows ACC-1 | L2 | P0 (a) | 1 | MT-D2-R14, MT-P1-R21, MT-P2-R25, MT-T2-R22, MT-T2-R23, MT-X5-R7 |
| NS-53-R79 | Given Denied, Restricted, Not now or no library module, Then Export, Delete, the whole capture flow and a letter from a prompt, a month-age day, a typed day or pictures chosen in the system picker all work, and a parent with no kept letters sees no "a year ago" card and no empty header | L2 | P0 (b) | 1 | MT-P3-R17, MT-P3-R23, MT-P3-R24, MT-X4-R7, MT-X2-R15, MT-X4-R48, MT-T2-R28 |
| NS-53-R80 | Given any library App Review submission, Then the Notes for Review say what is read, that the tab works with access refused, and why the out-of-process picker alone is not enough (5.1.1(iii)); purposes are not drifted (5.1.2(ii)); the library is not used for marketing or data mining (5.1.2(vi)); no profile or contact database is built (5.1.2(iii),(iv)). Review (EX-CCO-4, EX-CCO-6, EX-SEC-7, EX-CLO-16): the Notes for Review follow R240 and R242, mention that the permission can change pictures and our code does not (R233), and are counsel-reviewed with the G2 answer | R | P0 (b) | 1 | MT-P3-R33, MT-X2-R14, MT-X2-R17, MT-X4-R9, MT-X4-R10, MT-X4-R41, MT-X4-R42, MT-X2-R19, MT-X2-R24, EX-CCO-4, EX-CCO-6, EX-SEC-7, EX-CLO-16 |
| NS-53-R81 | Given the label, policy and in-app disclosure, Then in the same build as the behaviour they say, per data type, "Photos or Videos: not collected" only while no picture, thumbnail, date, id, coordinate or title leaves the phone; they never say "Data Not Collected" for the whole app (the label of record answers Yes for five types); they avoid the banned on-device-only claims of D5-F4; and the policy gains the backup line (a stored copy sits on the phone and is not excluded from iPhone backup, FACT-CHECK). Review (EX-PRV-8, EX-CLO-1, EX-CCO-5): label, policy and in-app text are re-read against the production profile with server features on, and the Location line is answered separately for the place read (R240, R241); the backup line follows O-44 (R235) | R, L0 | P0 (b) | 1 | MT-P3-R34, MT-X2-R1..R9, MT-X2-R11..R13, MT-X4-R19..R25, MT-X1-R7, MT-X2-R3, MT-X2-R4, MT-D5-F4, EX-PRV-8, EX-CLO-1, EX-CCO-5 |
| NS-53-R82 | Given a Route A build, Then the entitlement is present only in an allow-listed profile after the licence read, only picture and video assets are kept at the boundary (titles, locations, contacts, songs, workouts, reflections and state of mind are dropped), the 17.0 and 17.1 phones hide only the Route A control and keep the tab, and the first-use sheet is Apple's | L1, L5, R | P1 | 3 | MT-D2-R20, MT-D2-Q4, MT-X1-R4, MT-X1-R5, MT-X2-R11, MT-X2-R18, MT-X4-R12..R18, MT-P4-R14 |

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
| NS-53-R83 | Given any tap on a moment, Then it calls the one start function with source `moment` (added to the closed source list in the same PR as its handler), Moments imports no recorder, Listen or Write module, and only `start-capture.ts` routes to `/listen` or `/write` | L0, L1 | P0 (c) | 1 | MT-P4-R1, MT-P1-R4, MT-T3-R6, MT-X3-R22, MT-T3-R4 |
| NS-53-R84 | Given Book and Me, Then they still start nothing and the Photos lens has no add or start control | L2 | P0 (c) | 1 | MT-P4-R2 |
| NS-53-R85 | Given a tap on a day, Then capture opens with the chosen pictures attached, an empty words field, the "Whose book?" sheet only if more than one book is visible, and nothing pre-filled from the pictures; the picker is a root-stack modal route, params are only those that exist today, and route templates only reach `screen_view` and the error boundary | L2, L0 | P0 (c) | 1 | MT-P1-R5, MT-T3-R1..R3, MT-T3-R7..R9, MT-D3-R8, MT-D3-R11, MT-D3-R15, MT-P4-R15, MT-P3-R21 |
| NS-53-R86 | Given capture begun from a moment, When the parent backs out before Keep, Then 0 files and 0 rows remain, temporary copies are deleted and Moments equals its state before the tap; the three-step back principle (close picker, close Listen, never lose words) holds for every exit | L2, L5 | P0 (a) | 1 | MT-P4-R3, MT-T3-R10..R18, MT-T3-R24, MT-A4-R10..R13 |
| NS-53-R87 | Given a moment hand-off, Then no database field, log line, breadcrumb or analytics event records that the letter began from a moment, and `capture_started` with source `moment` sends nothing that says so. Review (EX-CDO-2, EX-CCO-11, EX-ENG-11, EX-CPO-2, EX-PRV-7): this row stands as the default (O-38): the first release sends no analytics value that says a letter began from a moment, for any card kind; `moment` is a local value of the closed source list in `start-capture.ts` only. The alternative (send `source: moment` as an L2 enum shared by every Moments card, no library fact) is the founder's call at O-38 and needs the registry, the D-163 gate and the R87 ban reworded to "no column, log line or breadcrumb" | L1, L0 | P0 (a) | 1 | MT-P4-R4, MT-T3-R12, EX-CDO-2, EX-CCO-11, EX-ENG-11, EX-CPO-2, EX-PRV-7 |
| NS-53-R88 | Given Route A or Route B, Then both hand the same `AttachRequest` to the same pipeline; the only code that reads or re-encodes a picture or video is the system's; no third-party picker, decoder, editor or media package appears in the lockfile | L0, L1 | P0 (c) | 1 | MT-P4-R6, MT-P4-R7 |
| NS-53-R89 | Given each picked item, Then it passes the NS-01 picture pipeline or the NS-52 video pipeline and 0 of 10 stored pictures and 0 of 10 stored videos carry location or device metadata | L0, L5 | P0 (a) | 1 | MT-P4-R8, MT-X4-R31 |
| NS-53-R90 | Given a selection above 6 pictures or 2 videos, Then the sheet stops adding with one calm line naming the limit, no count left, no "select all", nothing already chosen lost; selection is visible three ways (ring, check, spoken state), reachable without a drag, and the 7th picture in Review is refused too | L2, L4 | P1 | 1 | MT-P4-R9, MT-P4-R25, MT-D3-R12..R14 |
| NS-53-R91 | Given a video over 60 seconds, a corrupt, oversized or iCloud-only item or low space, Then that item is refused or waits with one calm line, the rest stays and the letter can be kept; a vanished source costs one item | L2, L5 | P1 | 1 | MT-P4-R10, MT-P4-R22 |
| NS-53-R92 | Given several items, Then they are stored in the order the parent picked, else in time order; the machine never reorders, crops, selects or builds a highlight; the parent can reorder by drag or by Move earlier and Move later | L2 | P1 | 1 | MT-P4-R11, MT-P4-R12 |
| NS-53-R93 | Given a library original, Then it is never modified, moved or deleted by our code; the kept letter holds no library id, album, filename, original creation time, coordinates or place label unless the parent chose that label, and an original deleted after Keep changes nothing | L0, L5 | P0 (a) | 1 | MT-P4-R13, MT-P4-R17, MT-P4-R21 |
| NS-53-R94 | Given Route A returns a title, date range, place, people or music, Then the adapter drops each before the attach contract and none is stored, shown, logged or used (OPEN O-08 against NS-49-R9) | L0 | P0 (a) | 3 | MT-P4-R14, OQ-P4-8 |
| NS-53-R95 | Given a picture date, Then it is offered only as an optional chip applied on a tap, never preselected | L2 | P0 (a) | 1 | MT-P4-R16 |
| NS-53-R96 | Given a moment tap while a draft waits, Then the app asks once whether to add or start new, "Add" is default, Cancel changes nothing, and neither choice deletes the draft | L2 | P1 | 1 | MT-P4-R18 |
| NS-53-R97 | Given a deleted letter, Let it go, Erase now or Erase everything, Then every picture and video of it is deleted, restore inside Recently deleted brings them back, and the library is untouched; a plain sentence says pictures in a letter are copies | L0, L2, R | P0 (a) | 1 | MT-P4-R19, MT-P4-R20 |
| NS-53-R98 | Given our stored file is missing, Then a plain box and one calm line show, the row stays and words are intact | L5 | P0 (c) | 1 | MT-P4-R23 |
| NS-53-R99 | Given media and no words, Then Keep is disabled; given words and any media within limits, Then Keep makes the same letter as without media and is never gated by media | L2 | P0 (c) | 1 | MT-P4-R24 |
| NS-53-R100 | Given Remove, Then it leaves with Undo for the NS-01 window and after it the file is deleted and checked | L0, L5 | P0 (a) | 1 | MT-P4-R26 |
| NS-53-R101 | Given the letter page, Then items show in order, a video plays only on tap, never autoplays or loops, plays with sound only after the tap, respects the silent switch and pauses on inactive and App lock | L5 | P1 | 1 | MT-P4-R27 |
| NS-53-R102 | Given inactive, background or App lock, Then every picture and frame is an opaque box before the snapshot, no day name, fragment, typed words or thumbnail shows in the switcher with or without App lock, and a pick that lands while locked is discarded with 0 files | L5 | P0 (a) | 1 | MT-P4-R29, MT-P2-R34, MT-X1-R2, MT-T2-R30 |
| NS-53-R103 | Given Save a copy and export, Then every item is included, stripped, streamed, with a size line first and a calm refusal on no space; Moments data is never in an export | L0, L5 | P0 (b) | 1 | MT-P4-R30, MT-X5-R15 |
| NS-53-R104 | Given a shared book, Then under Variant A a push carries no media path, a pull creates no media row and the label stays "Photos or Videos: not collected"; the author sees one plain line at Review with Shown, Records, Never and Decline; letters by another author show no media controls (OPEN O-20, P4 OQ-P4-5) | L0, L2, R | P0 (a) | 1 | MT-P4-R31..R33, OQ-P4-5 |
| NS-53-R105 | Given a second account on the phone, Then it never sees the first account's media, index, opt-in or moments and its start is off; a restored or new phone starts off | L0, L5 | P0 (a) | 1 | MT-P4-R34, MT-X5-R11, MT-T5-R13, MT-T5-R14 |
| NS-53-R106 | Given the flags, Then `EXPO_PUBLIC_PHOTOS`, the photos kill switch, `EXPO_PUBLIC_VIDEO` and the videos kill switch hide the hand-off and Add but leave sweep, Erase and Export working; airplane mode lets phone-held pictures attach | L0, L5 | P1 | 1 | MT-P4-R42, MT-P4-R43 |
| NS-53-R107 | Given all fixtures, Then every picture and video is generated by script (Asha, synthetic) and none holds a real name, place or picture from the founder's screenshots | L0, L1 | P0 (a) | 1 | MT-P4-R44, MT-P1-R24, MT-P2-R40, MT-T3-R39, MT-P3-R32 |
| NS-53-R108 | Given a Keep from a letter that began at a moment, Then the parent lands on the Book on the new letter, the back stack is tabs only, Moments shows no "done", no count, no tick and no "1 of N", the used day is hidden in the same session, and the list does not jump | L2 | P1 | 1 | MT-T3-R25..R29, MT-A4-R14, MT-A4-R20, MT-T1-R15, MT-P4-R41 |

## 10. How each photo is processed, end to end

Everything in this section is in the first release (own library read, founder ruling 21 Nov) unless marked. Facts about PhotoKit are those P6 and X3 read; items they marked UNVERIFIED stay UNVERIFIED until the device spike (G1). Each step names one owner module. No other module may touch the library (NS-51-R29).

### 10.1 The data-flow table

| Step | Input | What happens | Output | Held in memory | Persisted | Owner module |
|---|---|---|---|---|---|---|
| 0 Authorization | The parent's tap on the primer's Continue | `requestAccess()` calls `requestAuthorization(for: .readWrite)` once; `accessStatus()` (no prompt, cheap) is read on tab focus and on every foreground; Limited is told from Full by `authorizationStatus(for:)` | An access enum: not determined, limited, full, denied, restricted, unavailable | The enum for the session | Nothing of ours. iOS holds the answer. A local flag that the primer was answered (8.5) | `apps/mobile/modules/scribe-library` (Swift) behind `lib/moments/source.ts` |
| 1 Fetch | A window (`fromMs`, `toMs`, `limit`) from the engine | One fetch: `creationDate` in range, media type image or video, the user library only (`includeAssetSourceTypes` set explicitly, because the default is not stated: UNVERIFIED), `includeHiddenAssets` never set, sort by creation date descending, `fetchLimit` from the spike; `mediaSubtypes` bit mask filtered in Swift (predicate support UNVERIFIED); runs on a background queue; no image data requested, so iCloud originals are never downloaded | Columnar typed arrays: identifier, creation time, kind, duration, subtype flags, favourite flag, burst identifier, and the picture's location coordinates when present (the closed `READ_SET_V1`, RV-19), plus `truncated` | The arrays for one window | No | `scribe-library` `scanDates` |
| 2 Exclude | The arrays | Drop no-date, screenshot, screen-recording, animation, non-user-library and parent-left-out assets; collapse bursts to one candidate | Clean candidates | Candidates | No | `packages/core/src/moments/exclude.ts` |
| 3a Resolve place | Coordinates, the bundled place table | Offline nearest-place lookup by arithmetic on the phone (7a.1, option P-A); the coordinates are dropped the moment a place id is produced; a network geocoder runs only behind the gated adapter | A place id and a name per picture, or none | Place ids for the window | Only a hide-this-place key (L4) and a parent correction | `core/moments/place.ts` with the bundled table |
| 3 Group | Candidates, `offsetAt`, clock | Local calendar day; sessions split at `SESSION_GAP`; a clock-change day is one day | Day groups with sessions | Groups | No | `core/moments/group.ts` |
| 4 Qualify | Day groups, parent marks, occasions | The rules of 7.2 | Qualifying days | Qualifying days | Dismissals as day keys only | `core/moments/rules.ts` |
| 5 Rank and choose tiles | Qualifying days, hearts, earlier picks | The class order and seeded rotation of 7.3; tile order of 7.3; collage layout by count | Ordered cards with up to 4 tile ids each | The list | No | `core/moments/rank.ts`, `collage.ts` |
| 6 Thumbnail | A tile id and a pixel edge | `thumbnail({id, px})` where px is the tile's display size times the screen scale (96 pt minimum, NS-51-R9); network access off; a not-local original returns null and the tile falls to the next candidate or a plain box; each request is cancelled when its row scrolls out; requests only for rows on screen plus one screen of lookahead; delivery and resize options set by the spike (UNVERIFIED) | An image handed to the view | A small fixed-size in-memory LRU (size set by the spike); at most the live window | Never. No disk cache for library assets; a third-party image library is allowed only if mobile proves its disk cache is off | `scribe-library` `thumbnail`, view in `lib/moments` |
| 7 Show | Cards | Paper cards; thumbnails fade in as they arrive without moving anything | Pixels | | | `apps/mobile/src/lib/moments` |
| 8 Choose | The parent's selection in the day sheet | Ids held in memory by `capture-handoff.ts`; nothing copied | An `AttachRequest` | The selection | No | `lib/moments/capture-handoff.ts` |
| 9 Attach (copy, strip, resize, store) | The `AttachRequest` | The system supplies each item (the pick of the NS-01 and NS-52 pipelines): the copy is made from the library by the system, metadata (EXIF, GPS, device and QuickTime location atoms) is stripped, the picture is resized and the video transcoded under the NS-01 and NS-52 numbers (this file invents none), then stored as our own copy in the app container (`entry_media`) | Stripped copies, `entry_media` rows with position | Temporary copies in `Caches` while Review is open | Only after Keep. A killed app leaves temp files, swept at launch | `modules/scribe-photo` and the NS-01 and NS-52 pipeline in `lib/capture` |
| 10 Keep | Review, Keep | One transaction writes the letter and its media rows; no library identifier, album, filename, original creation time, coordinates or place label is written unless the parent chose that label | A kept letter | | The letter, its words, its media copies (on the phone; Variant A syncs no media) | existing capture save path |
| 11 Delete | Let it go, Erase now, Erase everything, Delete account | Every picture and video of the letter is deleted and checked; Recently deleted can restore; the library original is never touched | | | | existing deletion path (DATA-REQ) |
| 12 Revoke or turn off | Access downgraded in Settings, Turn off, sign-out, Erase, Delete account | On the next foreground (or at once for Turn off) the moments file is deleted first, before any await; pending moment notes are removed; memory is dropped; kept letters and their copies remain because they are the parent's letter content | An empty moments state, ACC-4 or ACC-1 | | | `lib/moments/clear.ts`, `eraseDeviceFiles` |

### 10.2 What is never persisted, never sent, never logged

Never persisted: image bytes or thumbnails of library assets; coordinates; machine titles, captions, filenames, EXIF text; counts; tap or dwell history; scan results; the permission result as an event. Never sent to our servers (server, analytics, logs, crash reports, URLs, route params): any identifier, date, album, count, coordinate, place, label or picture. Only the gated network geocoder adapter, if the founder signs it, ever sends coordinates, and only to Apple's service, with its own consent text (7a.1). Persisted on the phone only: the decisions store (day keys and times; a parent label with its day key; a hidden-place key and parent corrections of a place; and, only if the founder signs O-13 and O-14, a picture identifier and an album identifier), plus the optional index cache if O-09 is signed. All of it is L4, outside `scribe.db`, excluded from backup and read back (ADR 0032 pattern), file protection no weaker than `scribe.db`, wiped by Turn off, Erase and sign-out.

### 10.3 Freshness, cost and failure

No `PHPhotoLibraryChangeObserver` and no background mode (NS-51-R29). Freshness comes from a scan when the tab first gets focus and on foreground (and at foreground only if the nudge switch is on). Nothing runs at launch; the library is not touched before Home's first frame. The scan is skipped in Low Power Mode and when storage is critical. Every number (scan time, `limit`, LRU size) is measured by the spike on an iPhone SE 3 with the generated 20,000 item library and is ASSUMED until then; this file states none.

### 10.4 Requirements

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R109 | Given a cold launch with the library part on, When Home first renders, Then no `scribe-library` function other than `accessStatus` has been called, a source test fails any call from `_layout.tsx` or Home, and the first scan runs at first Moments focus | L0, L1, L5 | P0 (c) | 1 | MT-X3-R13, MT-A2-R4, MT-A5-R5, MT-A5-R15 |
| NS-53-R110 | Given the native contract, Then it is one iOS-only optional module with the closed functions of step 0 to 6, errors are one closed code with no path, id or date, nothing logs an identifier, a second scan for one window rejects as busy, and `nullSource` serves Expo Go, web, Android, iPad, Mac and flag-off while `fixtureSource` serves tests. Review (EX-ENG-1, EX-ENG-2): the real function list and the native thumbnail view are in R220 | L0, L1 | P0 (a) | 1 | MT-X3-R5, MT-X3-R6, MT-X3-R7, MT-X3-R24, EX-ENG-1, EX-ENG-2 |
| NS-53-R111 | Given a library of any size, Then no step enumerates the whole library, scans run on date windows newest first, a refresh is incremental, results arrive in typed arrays, and Home's first frame is delayed by 0 ms | L5, L0 | P1 | 1 | MT-X3-R13, MT-A5-R2, MT-A5-R4, MT-D3-R20, MT-A2-R15..R17 |
| NS-53-R112 | Given tiles, Then thumbnails are requested at tile size times scale, network off, only for rows on screen plus lookahead, cancelled on scroll-out, held in a bounded in-memory LRU, never written to disk, and a recycled row never shows the last day's picture | L2, L5 | P0 (a) | 1 | MT-A2-R7, MT-A2-R11, MT-A5-R6, MT-A5-R7, MT-A5-R12, MT-A5-R13, MT-A2-R16 |
| NS-53-R113 | Given nothing from the library is persisted by default (option P), When the app restarts, Then the tab rebuilds from a date-window scan; if the spike proves a cache needed (O-09) it is the NS-51-R6 file and nothing wider, holds no score, is a cache that can be deleted and rebuilt without a partial moment, and the dismissal state is the only unrebuildable data. Review (EX-ENG-3, EX-CDO-8, EX-CDO-9): the file contract and the revoke and turn-off rules are R221 and R246; no picture or album identifier is stored in the first release (R247) | L0, L5 | P0 (a) | 1 | MT-X5-R1, MT-X5-R2, MT-X5-R3, MT-X5-R4, MT-X3-R9, MT-X5-R12, EX-ENG-3, EX-CDO-8, EX-CDO-9 |
| NS-53-R114 | Given a kept letter, Then the database holds no library asset id, album, filename, original creation time, coordinates or place label unless the parent chose that label, no identifier reaches a letter, and the Find index and every other index skip Moments | L0 | P0 (a) | 1 | MT-X5-R5, MT-X5-R6 |
| NS-53-R115 | Given sign-out, Erase everything, Delete account, Turn off or Pause, Then the moments file is deleted first, before any await, pending moment notes are removed, `eraseDeviceFiles` lists the file and a scan finds zero bytes; Pause keeps only dismissed day keys; downgrading access in Settings empties the same data; Limited changes reconcile on foreground. Review (EX-CDO-8): the three operations of R246 apply, with K6 purging the file | L0, L5 | P0 (a) | 1 | MT-X5-R7..R10, MT-X3-R10, MT-X4-R62, MT-X4-R64, EX-CDO-8 |
| NS-53-R116 | Given the moments data classes, Then every field is classed against `DATA_CLASSIFICATION.md` (L4 for library-derived structure), the data is never in the outbox, the pull merge or the push mapper, retention values are stated, and no server table, column, RPC or sync op is added by this tab | L0, R | P0 (a) | 1 | MT-X5-R13, MT-X5-R14, MT-X5-R12, MT-X3-R18, MT-X3-R26 |
| NS-53-R117 | Given a place is shown, Then it comes only from the place pipeline of 7a.1 (offline first), no coordinate is persisted, logged, sent or placed in a card model, nothing library-derived reaches our servers, any network geocoder or map search exists only behind the gated adapter with its own opt-in and consent text, and the label, policy and purpose string say so per data type | L0, L1, R | P0 (a) | 1 | MT-X4-R23, MT-X2-R9, MT-X2-R12, MT-X1-R5 |
| NS-53-R118 | Given airplane mode, Then every source works the same, the library is never fetched from the network, local days draw normally and iCloud-only tiles explain themselves with a plain box | L5 | P1 | 1 | MT-P2-R37, MT-D3-R21, MT-X3-R26, MT-A2-R11 |

## 11. First customer experience, minute by minute

The parent is Asha's parent, new, tired, one thumb, at night. The first release includes the library read, so every step below is in it (if a release gate fails the build ships with the library flag off and the ask steps are absent). Timings are intent, not measured.

| When | The parent | The screen | The system does | Must not happen | Rows |
|---|---|---|---|---|---|
| 0:00 Install and open | Opens the app | Age gate first (LEGAL-REQ-002), terms and privacy links | Nothing library, nothing notification | A Moments surface before the gate; a permission | R-gate below |
| 0:30 First run | Answers a few plain questions: child's name (or "your child"), optional date of birth | First run (NS-39, NS-44), ending on Home with one question and Speak | No photo question (K-02) | Any photo ask; asking for the date of birth in Moments | first rows of section 4.6 |
| 2:00 First Speak | Taps Speak | Microphone prompt in context | The microphone is the first permission met | A library prompt | MT-P1-R8 |
| 4:00 First letter kept | Says a few words, taps Keep | The existing Keep moment, Book comes forward | Letter stored | A celebration count | MT-A4-R19 |
| Later that day | Opens Home | One quiet line near the bottom points to Moments, once (O-06) | | A badge or dot | MT-P3-R3 |
| First open of Moments, no permission (ACC-0) | Taps the Moments tab | Heading "Moments", one job line; real For you cards first (today's question, an age day if any, a typed day if any); then three labelled Asha examples; then the plain ask card below. Flag-off fallback: no ask card, an "Add pictures" row opening the system picker | A tab switch is the platform's cut; no alert | An empty page; an iOS alert; examples that look real | NS-53 section 8 rows |
| +20 s Value view | Reads the examples, taps one | The example opens in place; nothing starts | | A carousel or auto-advance | MT-A3-R5, R6 |
| Primer | Taps the yes | One sentence in a sheet, Continue and Not now equal | | Apple's sheet before this | 8.2 |
| System sheet | Chooses Select Photos or Allow all | Apple's sheet; then the tab answers in place | Status read; first read starts | A second ask; a message about which is better | 8.2 |
| First real card | Waits a moment | Days arrive as one calm move, no spinner, no shimmer; a plain box where a picture is still coming; real cards never waited on the library; a day away from home carries a plain place line such as "Lisbon" with a quiet "Not this place" in the card menu | Date-window scan, thumbnails | Counts; "we found"; a place or title | MT-T2-R14..R18 |
| First letter from a moment | Taps a day, chooses pictures, taps the start control | Day sheet; capture with the pictures attached, words empty | The system copies on Keep | Pre-filled words; a description | 9.1 |
| Day 2 first return | Opens the app next morning | Home as usual; if they open Moments, the cards are the same kind, one may differ (the question and the age or day); no "welcome back", no count of what they missed | | A streak, a gap word | MT-P5-R19 |
| First nudge | Notifications were already primed by the existing flow (evening reminder) | The evening reminder at the parent's time; same words as ever; tap lands on Home (13.4) | Local notification planned while the app was open | A thumbnail, a place, a count, "waiting" | 13.4 |
| Later: first library-timed nudge (phase 2, only after counsel answers Q-X1-6 and the parent opted in) | Same | The same words; tap lands as 13.4 says | The phone chose the timing from a library fact | Any library word | 13.3 |

### 11.1 Requirements for the first experience

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R119 | Given a fresh install, Then the 18+ gate is the first thing, no Moments surface, index or primer renders before it passes, an under-18 answer stops every Moments surface and creates no data, and the Declared Age Range value is never read by the tab. Review (EX-CCO-10): the tab and library module do not read, store or use an age signal; age assurance is owned by the gate code and the register (R244) | L2 | P0 (b) | 1 | MT-X4-R57..R59, MT-T5-R20, EX-CCO-10 |
| NS-53-R120 | Given first run, Then the first permission the parent meets is the microphone on the first Speak; given the first opening of Moments with no permission, Then the screen is the value view with real cards, never a system alert | L2 | P0 (b) | 1 | MT-P1-R8, MT-T1-R24, MT-T1-R29, MT-T1-R25 |
| NS-53-R121 | Given a parent with a kept first letter who has never opened Moments, When Home shows, Then one line near the bottom points to Moments once with one verb and never returns after a tap or dismissal (OPEN O-06) | L2 | P1 | 1 | MT-P3-R3, OQ-P4-1 |
| NS-53-R122 | Given the first real cards arrive after a grant, Then they arrive as one calm move, answering the ask, nothing moves under a finger, a plain box holds a late picture, "nothing found" is not a gap, and a failed index leaves no trace | L2, L5 | P1 | 1 | MT-T2-R14..R21, MT-A3-R11..R14, MT-A3-R20, MT-A2-R1..R3, MT-A2-R8, MT-A2-R9, MT-A2-R13 |
| NS-53-R123 | Given the tab on the next day, Then it looks the same for someone who wrote ten letters and for someone who wrote none, no card or string names the absence, and the daily card is a real fact or the question | L0, L2 | P0 (a) | 1 | MT-P5-R19, MT-P5-R18, MT-X3-R27, MT-P2-R21 |

## 12. Happy path and unhappy paths for every interaction

The happy path of each interaction is in its section (ask 8.2, attach 9.1, nudge 13). This matrix is the unhappy side. A parent never sees an error code, a count, or blame. Each row is one requirement in 12.1.

| # | Case | Behaviour |
|---|---|---|
| U1 | Denied | ACC-4: real cards, one calm line and Open Settings on the tab and in Me only |
| U2 | Limited | Works as full on the chosen set; one quiet control to choose more; no nag |
| U3 | Restricted | One plain line, no button, no reason guessed |
| U4 | iCloud-only asset | Plain box or next candidate; never a download from a card; at attach the item waits or is skipped with one calm line |
| U5 | Photo deleted mid-flow | Before the copy finishes: that item drops with one calm line, the rest stays; after Keep: nothing changes |
| U6 | No photos | ACC-2 with no qualifying day: one quiet line and the picker door; For you still shows real cards |
| U7 | Hundreds of thousands of photos | Date-window scans only, bounded limit, same tiles and rule as a small day, no count; the detail view pages |
| U8 | Offline | Everything works; nothing needs the network; iCloud-only items wait |
| U9 | Low storage | Scan skipped when storage is critical; attach refused with one calm line naming nothing technical; words and the letter are safe; export refuses calmly with a size line first |
| U10 | Interrupted by a call, Siri, an alarm | Recording is kept; Listen offers Review; nothing is deleted; words written first |
| U11 | App killed mid-recording or mid-typing | Launch sweep finds the draft; words and recording intact; half-written media removed |
| U12 | Wrong account | A notification planned under account A and tapped under B lands on a screen chosen from B, naming nothing; account B never sees A's moments file or opt-in; the file is keyed by account owner and fails closed |
| U13 | Deleted child or deleted book | Cards for that book vanish; a tap on an old nudge lands without naming the child; the book's moments are not shown |
| U14 | Second parent in the same book | Moments is per phone and per account; the other parent never sees the first's index, hearts, hidden days or opt-in |
| U15 | Shared book, other parent's letter | No add, change or remove media controls; words only under Variant A |
| U16 | Time zone change | Day assignment follows the phone's current zone; only day assignment changes; the card date equals the Photos app's date on this phone; pending notes re-plan at foreground |
| U17 | Device restore or new phone | Starts off; does not ask again by itself; the moments file is not in the backup; the book arrival line shows until the book arrives |
| U18 | Clock change (daylight saving, manual clock) | A clock-change day is one local day; no day is lost or doubled; a manual clock set into the future or past never creates a typed day or a year-ago card from a wrong date beyond what the new date implies; nothing is stored from the changed clock |
| U19 | Quiet, hidden or hard-stretch book | No year-ago card, no bright tone, nothing planned |
| U20 | Library changed while the tab is open | Library change events are coalesced; the list never jumps under the thumb; nothing is inserted above what the parent is looking at |
| U21 | Memory warning | Thumbnail LRU is dropped; the tab survives; tiles redraw as plain boxes |
| U22 | Parent turns reminders off in Settings | No card is removed; the pending notes are cancelled |
| U23 | Wrong place on a card (a picture's location is off, or two cities in one day) | The card menu offers "Not this place" (hide for this day) and "Name this day" (the parent's own words replace the label); a tie between two places on one day shows none; no line asks why |
| U24 | Sensitive place (a hospital, a home the parent has left, a place of loss) | The offline table names only a city, never a venue or a street, so a hospital cannot be named; the parent can hide a place for good ("Hide this place"), which removes it from cards and themes at once; a place never appears in a notification, email, widget, analytics or log; no line asks why |
| U25 | Hide a place for good, then change of mind | Hide is undoable at once and listed in Me with a remove control and "Start again"; hiding stores only a local place key (L4), wiped by Turn off, Erase and sign-out |
| U26 | Place lookup cannot run (no table entry, no coordinates, the picture has no location) | The card shows no place line and no message; the day is otherwise the same |
| U27 | The gated network geocoder is on and the phone is offline or rate-limited | The offline name stands; nothing queues a coordinate for later; no error shown |

### 12.1 Requirements

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R124 | Given U1 to U3 (denied, limited, restricted), Then the matrix behaviour holds with no second prompt, and the accessibility audit passes in each | L2, L4 | P0 (b) | 1 | MT-D4-R15, MT-D2-R11, MT-D2-R12 |
| NS-53-R125 | Given U4 to U9, Then the matrix behaviour holds, the library read fails closed with an `ErrorLine` and Try again that carries no photo detail, empty is not a dead end (one line and one button to the picker), and a huge library stays fast | L2, L5 | P1 | 1 | MT-D3-R20..R23, MT-A5-R8, MT-A5-R9 |
| NS-53-R126 | Given U10 and U11, Then a call, Siri or an alarm that takes the audio session, or the app going to the background, keeps the recording and offers Review; a kill leaves the draft for the launch sweep; the app lock covers the stack without unmounting; pictures being copied pause in the background, resume in the foreground and keep the draft | L5 | P0 (c) | 1 | MT-T3-R19..R23, MT-X1-R3 |
| NS-53-R127 | Given U12 to U15, Then a notification under a signed-out or other account lands with no child name, age, picture or occasion, the pending route is dropped when the gate is cancelled, a tap with the book deleted or quieted does not name it, and moments are never shared across accounts or parents | L0, L2 | P0 (a) | 1 | MT-T5-R6, MT-T5-R7, MT-T5-R12, MT-T5-R13, MT-T5-R14, MT-T5-R19, MT-P4-R34, MT-P4-R35 |
| NS-53-R128 | Given U16 to U18, Then days, month days and notes follow the stated rules, a clock or time zone change never double-plans a note on one local date, and the parent returning from Settings with notifications allowed re-plans once | L0, L5 | P1 | 1 | MT-T5-R28, MT-T5-R30, MT-T5-R32, MT-P6-R21, MT-P2-R10 |
| NS-53-R129 | Given a tap on a nudge for a picture since deleted, a letter already made that day, a book since quieted, or denied photo permission, Then the landing names nothing that cannot be read, no card claims a moment the app cannot read, and a letter made today cancels the pending nudge at the next foreground | L0, L2 | P0 (a) | 1 | MT-T5-R15..R19, MT-T5-R31 |

## 13. Nudges: in-app, local push, lifecycle email and widgets

### 13.1 One moment signal, three channels, different sources

The same moment (a day, an occasion) may be told in the tab, in a local reminder and in an email, but each channel may only use what it legitimately holds. The source of a signal decides which channels may carry it (P1 6, X6 section 0).

| Source | In the tab | Local push | Email | Widget |
|---|---|---|---|---|
| Typed day (phone only) | Yes | Yes (`typedDay`) | No (the server never holds it: ADR 0032, NS-47-R11; the brief's wording was wrong) | No |
| Ticked Day (phone only) | Yes | Yes | No | No |
| Date of birth, birthday, month day (the server holds the date) | Yes | Yes (`birthday`, `monthAge`) | Only with RV-09 and a per-child opt-in, never by default | No |
| A date the parent created for a reminder ("Remind me about this day") | Yes | Yes | Yes, per occasion opt-in, date and flags only (X6 Tier 2) | No |
| A year-ago letter (the server holds letter dates in a synced book) | Yes | Existing class only | Only with counsel's read | No |
| The 111 prompts | Yes | Existing `evening` class | Fixed copy only | No |
| Library facts | Yes (first release) | Local only, identical words, own opt-in, off by default, phase 2 and only after counsel answers Q-X1-6 (RV-08, OPEN O-02) | Never | Never |

### 13.2 Consent-gated signal rules (X6 R1 to R4, R11 to R13)

1. No library-derived signal is read before the parent has granted photo access. Not determined, denied and restricted yield only phone-held facts (dates the parent or the child's date of birth gave).
2. Photo consent covers use on the phone only. It does not cover a value leaving the phone, does not settle the Photos or Videos label, does not satisfy the purpose-string rule on its own and does not make an email non-commercial.
3. Anything that leaves the phone needs a separate opt-in, off by default, equal in weight to the other choice, shown on the same primer, with Shown, Records, Never and Decline lines. The smallest server-bound item is a date the parent confirms with a tap (Tier 4b), held until counsel answers CQ-16; silent scan results, counts, kinds and "pictures exist on a date" are refused (Tier 4c).
4. No provenance on the wire: a record never says where its date came from (no "library", no "photo") and nothing distinguishes a library-timed reminder from an ordinary one in analytics, logs or payloads.
5. Every nudge is optional; the app works with notifications and photos refused (5.1.2(i), 4.5.4).

### 13.3 Local push rules

- No new class and no new ceiling. A Moments nudge uses the existing classes (`typedDay`, `birthday`, `monthAge`, `evening`); `chooseOnePerDay` is the only chooser; at most one budgeted note a local date; 60 in 92 days; quiet hours hold; a letter made that day removes the pending note; a quiet or hidden book plans nothing (NS-32-R1, R14, R15; MT-P2-R28).
- A library-timed note, if signed (O-02): planned only at foreground from a day known at the last open; ranks below `monthAge` and above only `evening`; the title and body equal an existing evening-class content key word for word; identifier random; no thumbnail, place, count, picture, date from the library or the word "waiting"; the payload carries `{source, kind}` at most and nothing is read from it.
- Lock screen: a Moments-class note (`typedDay`, `birthday`, `monthAge`) carries no child name and no age or month number, on every setting; the evening class keeps its existing rule; the table in T5-R26 is the test (EX-SEC-8 resolved: the two earlier lines contradicted each other, and the stricter one stands, R234).
- The neutral photo wording of NS-51 ("Some pictures from the weekend are here") is REJECTED and deleted (EX-CMO-5, EX-CCO-7): no push, email, widget or badge ever contains the word picture, photo, place, day, weekend or the name of this tab, library-timed or not; the words are an existing evening-class key, invite and never remind, under 60 characters, no count, no urgency (R196).
- Kill switch `momentNudges` (K4) cancels pending Moments notes at next launch.

### 13.4 Where a tap lands (resolved, with the OPEN alternative)

Every local notification lands through one routing table. Moment-driven and ordinary evening nudges land on the same route, so the landing does not disclose which kind it was (T5 4.2). Recommendation after round 1 (EX-CPO-7): `typedDay`, `birthday` and `monthAge` taps land on Moments, because the one-owner rule puts those cards there and their lock-screen text already names the class; `evening` taps land on Home; the single routing table stays; a tap or link landing shows phone-held cards only and starts no library scan until the parent's own tab switch (R265). The earlier text, Home for all, reads: Home, as every evening reminder lands today, with the occasion card chosen on screen after unlock; a tap never opens the microphone, a draft, the library prompt or Settings, and opens no capture by itself. OPEN (O-22): P4, T1 and PR #1267 would land on Moments; the privacy argument for Home is stricter. After unlock under App lock nothing shows an occasion, name, picture or age until the gate passes. A cold start from a tap shows the routed screen or Home, never a blank; a capture or review already open is not disturbed; a notification delivered earlier (Scheduled Summary) is never described as new; a foreground arrival shows no banner for a Moments-class nudge.

### 13.5 In-app echo

The card the nudge points to is the same card the parent sees in the tab, from the same source, so a letter made from any one of them removes the others (P5-R21). If notifications are denied, the card is the same (T5-R15).

### 13.6 Lifecycle email (dark until the founder signs RV-09)

- What it is: one product lifecycle email to the account address of a signed-in parent who opted in, off by default, with its own switch in Settings that never touches account or safety mail. One purpose (the reminder the parent set up), no offer, no upsell, no third-party content. Designed to the stricter commercial standard: accurate sender and headers, a truthful subject, postal address, one-click unsubscribe with no login honoured at once, a body link to the preference page, and account-wide suppression that does not stop sign-in or safety mail. Whether the law calls it transactional or commercial is counsel's call (CQ-17); we do not rely on "transactional".
- What it may use: only a date the parent created for an email occasion (id, date, repeat flag, channel and nothing else; deleted at once on request, no label, no kind in phase 1) and, for the suppression rule, the dates of letters made in a synced book. The child's date of birth is struck as a source (EX-CMO-6, EX-PRV-11): the birth-date emails (`birthday`, `monthAge`, a "dob-email choice") stay off until counsel answers whether a processor learning the birthday counts. No child name, age or month number in subject or body. Never typed days, ticked Days, library signals, place or people.
- Frequency: one message per parent-chosen date (the weekly cap is replaced, EX-CMO-6), with a separate send budget that halts the lifecycle job above 70 sends in a day so account and sign-in mail keep the rest of the provider's daily allowance (EX-CFO-7). The same email suppresses itself on any date with a budgeted push, when a letter was made that day, and for a quiet, hidden or expecting-only book.
- Where it goes live: the production profile has server features on (FACT-CHECK of eas.json: production and preview on, testflight, development and e2e off), so the job can run; it ships dark first, send-to-self only, behind a server flag; the X1, X3 and X5 statements that the store build is server-free hold only for the testflight profile.
- Links: a nudge link opens the app on the Home route with no query and no state (T1-R30..R36, T5-R20..R22); if the app is not installed it is a web page, not a dead end.

### 13.7 Widgets

None in phases 1 and 2. If the founder wants one later (O-23, default no), it is static, shows no library content, no child name by default and no picture, and enters the closed list of start sources (T3-R34, T5-R23).

### 13.8 Requirements

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R130 | Given any source, Then it lists its channels as data, only the sources of 13.1 may list a channel, and no library source lists push, email or widget without the signed decision id | L0 | P0 (a) | 1 | MT-P1-R17, MT-P1-R19, MT-P2-R27, MT-X5-R18, MT-X3-R15, MT-P3-R25 |
| NS-53-R131 | Given any push the app schedules from a Moments source, Then it uses an existing class, a content key as body, no letter words, no child name unless names are on, a random identifier, no thumbnail, no place, no count and no "waiting"; and a library-derived moment is never a signal to any server path | L0, L1 | P0 (a) | 1 | MT-P1-R18, MT-P2-R30, MT-P3-R28, MT-P4-R37, MT-P4-R38, MT-X1-R8, MT-P5-R9, MT-T5-R25 |
| NS-53-R132 | Given the planner, Then Moments adds no class, raises no ceiling, plans at most one budgeted note a day over 92 days (60 total), quiet hours hold, a `photoMoment` candidate ranks below `monthAge` and above only `evening`, and is planned only at foreground for a day known at the last open | L0 | P0 (a) | 2 | MT-P2-R28, MT-P2-R29, MT-P3-R27, MT-X3-R17, MT-P5-R10, MT-T5-R28, MT-X4-R49 |
| NS-53-R133 | Given a letter made today, a quiet or hidden book, or the kill switch K4, Then the Moments nudge is not delivered and no copy says so | L0 | P0 (a) | 2 | MT-P5-R11, MT-P5-R12, MT-T5-R18, MT-P4-R35, MT-X3-R16 |
| NS-53-R134 | Given the parent has not turned on days from pictures or has paused it, Then no library signal feeds the planner; given photo access is not granted, Then only phone-held facts run; given Limited, Then the signal applies to the chosen pictures only | L0 | P0 (a) | 2 | MT-X1-R10, MT-X6-R11, MT-X6-R12, MT-X6-R14 |
| NS-53-R135 | Given a library-timed local reminder, When delivered, Then its title, body and payload equal the ordinary evening reminder, no analytics event or property distinguishes it, and the nudge opt-in carries Shown, Records, Never and Decline lines, is equal in weight and off by default; the privacy policy says plainly that reminders may be timed from pictures on the phone and that never leaves the phone | L0, R | P0 (a) | 2 | MT-X6-R13, MT-X1-R9, MT-X1-R11, MT-X2-R26, MT-X2-R27, MT-X4-R47, MT-X4-R46 |
| NS-53-R136 | Given a notification, Then notification permission is requested in context with the status checked before each schedule, provisional authorisation is not used at first launch without a founder decision, push is not required to use the app and nothing is withheld on a No | L0, L5 | P0 (b) | 1 | MT-X4-R43..R45, MT-X4-R48, MT-X2-R27, MT-X2-R28, MT-X2-R34 |
| NS-53-R137 | Given a tap on any local notification, Then it lands on the screen named by one routing table (13.4), moment-driven and ordinary evening nudges land the same, the landing has no permission prompt, count, "waiting" or gap word, the microphone stays off and no draft exists until the parent taps Speak, and a cold start shows the routed screen or Home, never a blank | L0, L2 | P0 (a) | 1 | MT-T5-R1..R5, MT-T5-R8..R11, MT-T3-R33, MT-P2-R32, MT-P4-R41, MT-P5-R13, MT-T1-R31, MT-T1-R32 |
| NS-53-R138 | Given the lock screen with names off or App lock on, Then a Moments-derived push carries no age, month number, name or occasion, and the occasion card on landing carries no child name, age or month number when names are off; a notification delivered earlier is never called new | L0, L5 | P0 (a) | 1 | MT-P5-R14, MT-T5-R26, MT-T5-R27, MT-T5-R30, MT-T5-R6 |
| NS-53-R139 | Given any link that opens the app, Then it routes to Home or the Moments root, keeps no state, never opens the microphone, a draft, the library prompt or Settings, never interrupts what a person is doing, is on the AASA allow list with no query, a link before the 18+ gate renders no route, and no widget, control, Action button or Siri doorway starts a letter unless it is in the closed source list | L0, L1 | P0 (a) | 1 | MT-T1-R30..R35, MT-T3-R30..R34, MT-T5-R20, MT-T5-R21, MT-T5-R23, MT-T5-R24 |
| NS-53-R140 | Given a server-held fact for email, Then the tier rule of X6 holds: the server is told only a date the parent chose (id, date, repeat flag, channel), with a per-occasion opt-in, hard-deleted at once on request, no label, kind, place or people in phase 1; the kind column, if added later, is read only by the email body chooser | L0, db, L1 | P0 (a) | 2 | MT-X6-R1..R3, MT-X6-R7..R10, MT-X6-R25, MT-X5-R16 |
| NS-53-R141 | Given the lifecycle email, Then it is in a closed class list with a content-key body, headers and footer to the commercial standard, a postal address, one-click unsubscribe with no login honoured at once, a stop that blocks every later nudge email but not sign-in or safety mail, both surfaces showing off after an off, no email to anyone who did not opt in, no email on a date with a budgeted push or when a letter was made, nothing for a quiet, hidden or expecting-only book, and no email if RV-09 is unsigned. Review (EX-CMO-6, EX-CCO-8, EX-SEC-9, EX-CFO-7): the closed class list adds a template class field, a hashed suppression after deletion, the subject rule and the send cap of R197 | L0, db | P0 (b) | 2 | MT-X6-R4..R6, MT-X6-R15..R18, MT-X6-R21, MT-P5-R15..R17, MT-T5-R29, MT-T5-R33..R36, MT-X2-R29..R33, MT-X4-R50..R56, MT-X3-R19, MT-X3-R20, EX-CMO-6, EX-CCO-8, EX-SEC-9, EX-CFO-7 |
| NS-53-R142 | Given the occasion tables and account deletion, Then the access matrix lets the owner read and delete their rows and no other member, deletion leaves no occasion row, send key or address, and the lifecycle email text fails the content test on any child name, banned word, count or guilt. Review (EX-CCO-8): a hashed address stays on a suppression list after deletion (R197) | db, L0 | P0 (a) | 2 | MT-X6-R19, MT-X6-R20, MT-X6-R22, MT-X6-R23, EX-CCO-8 |
| NS-53-R143 | Given email or lifecycle, Then the tab never promises it, the opt-in sits on its own row and is never required, and the email text is built to the stricter standard whatever counsel rules | R | P0 (b) | 2 | MT-X4-R50, Q-P3-5, MT-P1-R17 |

## 14. How it looks and feels

### 14.1 Layout per state

All layouts are paper: content on paper, glass only on navigation and controls (at most three surfaces, solid `glassFallback`, DESIGN-LANGUAGE-V2); the bar stays paper in 1.x. Text never sits over a photo (D4-R32). Cards are flat on a quiet paper surface with no lamp scene (PR #1270; OPEN O-25). The kicker is the reason line. Targets 44 pt; the whole card is the action.

| State | Layout |
|---|---|
| ACC-0 value view | Heading and one job line; real cards (question, age day, typed day); three labelled examples; the ask card below the real ones |
| ACC-1 | Real cards; one small row door; no explanation |
| ACC-2 For you | A two-part switch (For you, Recent); up to four cards; the question card always last |
| ACC-2 Recent | Months as headings, day cards under them, newest first, one screen, no count |
| ACC-3 | As ACC-2 on the chosen set; one quiet control at the foot to choose which pictures |
| ACC-4 | Real cards; one calm line with Open Settings |
| ACC-5 | Real cards; one plain line |
| Day sheet | Full-height sheet over the tab: the day's pictures in time order, tiles at least 96 pt, selection ring plus check plus spoken state, one start control, a viewer on tile tap |
| Viewer | Tile opens a full photo, swipe between photos of one day, pinch, double tap and pan, a video poster plays on tap only |

### 14.2 Motion (final choice where leads disagree)

| Interaction | Final choice | Cited rows | Disagreement and who decides |
|---|---|---|---|
| Tab switch | The platform's cut; nothing of ours moves; content does not re-enter on a return | T1-R7, R9 | A1-R2 assumed Moments was the landing tab; under option A only a first-view settle applies |
| First view of the tab | One settle, at most the first three blocks, opacity and a small rise (A1's token set: 8 pt, 30 ms stagger, under 400 ms total), controls opaque from frame 1; Reduce Motion is a plain fade | A1-R2, R3, A3-R1, T1-R9, R10 | A3 (12 pt, 420 ms) and A1 differ: use A1's tokens (recon 20). OPEN O-26 only if design wants A3's |
| For you and Recent switch, refresh | A quiet cross-fade in place at `swapMs` (150 ms); the platform refresh control is never stretched; every pull has a 44 pt button | A1-R10, A2-R19..R22, T4-R11, D4-R23 | none |
| "Another thought" | Swap the words in place, short cross-fade, no spin, no jump | A2-R23..R26 | none |
| Picture arrival | One short fade or none; a low-quality version cross-fades to final in place; a failed picture keeps its frame and stays quiet; nothing moves | A2-R8..R10, T4-R9, R10 | A3-R14 fixed a placeholder grace of 300 ms; A1-R8 and A5-R14 say measure: do not fix a number before the SE 3 run (recon 21) |
| Permission change | Calm, same move and same length for grant and Not now; denied and restricted are still, not red | A1-R11, A3-R10, R16, R18, T2-R16 | none |
| Day expands, month group collapses, card stack settles | In place, interruptible, no overshoot | T4-R12..R14, A1-R7 | none |
| Setting a card aside and Undo | A soft leave; Undo returns it; never celebrates; no count | T4-R15, R16, A1-R14, A1-R5 | none |
| Card to capture | The platform's modal rise; the photo is just there; no flight in v1; an option that carries one thing is calm and off by default | A4-R1..R9, T3-R35, T3-R36, A1-R13 | A4 option B and T1-R14: off. OPEN O-27 |
| Capture exits | Swipe down follows the finger and the words are safe; Talk has no swipe; the back swipe never strands | A4-R11..R13 | none |
| Photos during capture | The photo is still company; several photos or a video are a quiet static set; in Write the photo makes room and never covers words; if it cannot be shown the letter still works | A4-R15..R18, A4-R6, R7 | none |
| Keep | The one existing celebration; after Keep the Book comes forward | A4-R19, A4-R20, T1-R15 | Return to the tab is OPEN (O-19) |
| Loading | A flat still tile; no spinner, no shimmer, no block-level indicator on Recent | A1-R12, A2-R1..R3, A5-R10, A5-R11 | none |
| Reduce Motion, Reduce Transparency, Increase Contrast | One table and one reader; Reduce Motion is a cross-fade for every motion; nothing is lost | A1-R16, R17, A5-R1, R3, R19, T1-R37, R38, A3-R21, R22, T4-R20 | none |

### 14.3 Haptics and sound

No haptic for a tab switch, opening a card, Allow, Not now, scroll, load or a permission change (A1-R22). "Another thought" plays the existing `selection` haptic; Keep uses its existing haptic only; nothing depends on a haptic alone (iOS mutes them in Low Power Mode and while dictating). No sound anywhere in Moments. UNVERIFIED: A1 and T2 did not read `SOUND.md`; the haptics and sound owner reads it before sign-off (O-24).

### 14.4 Performance and motion budgets

Every motion ends within 900 ms and no single move is longer than 420 ms (A1-R1); one loop at most and none outlives its screen (A1-R15, A5-R16); animations run on the UI thread except a short list (A5-R4); few things animate at once; fixed frames and no layout shift; coalesced library events; low-power and heat calm the tab (the helper that reads Low Power Mode is dropped: the system already reduces animation, recon 28); budgets are stated for 60 and 120 Hz and frame evidence is measured on a device, not claimed; performance markers carry no content (A5-R2, R9, R11, R17, R21..R24).

### 14.5 Requirements

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R144 | Given any motion on the tab, Then it ends within 900 ms, no single move exceeds 420 ms, a tap lands on the end state at once, controls are opaque from frame 1, springs never overshoot, no motion celebrates a count or attracts, and Reduce Motion is one table with one reader giving a cross-fade | L0, L2 | P1 | 1 | MT-A1-R1, MT-A1-R2, MT-A1-R4, MT-A1-R5, MT-A1-R7, MT-A1-R15..R18, MT-A1-R21, MT-A5-R1, MT-A5-R3, MT-T1-R37, MT-T4-R20 |
| NS-53-R145 | Given Moments is not the landing tab, Then the tab switch is the platform's cut, a first-view settle plays once per install (hero arrival), content does not re-enter on returns or on switches, mounting never blocks the swap, a return keeps its place and pictures, and the light carries across with Moments keeping its own light | L2, L5 | P1 | 1 | MT-A1-R3, MT-A3-R1, MT-A3-R23, MT-T1-R7..R11, MT-T1-R20..R23, MT-A2-R27, MT-A2-R28, MT-T4-R14 |
| NS-53-R146 | Given photos and video, Then they stay still (never inverted, no motion on a card, no Ken Burns), images load without moving anything, the list never jumps under the thumb, nothing is inserted above what the parent looks at, and fast scrolling shows flat tiles | L2, L5 | P1 | 1 | MT-A1-R6, MT-A1-R8, MT-A1-R9, MT-A2-R18, MT-A5-R18, MT-A2-R30, MT-A5-R10, MT-A5-R14, MT-A5-R17 |
| NS-53-R147 | Given the value view, Then the first paint is complete and only the opening block eases in, three drawn examples settle once when first mostly in view, tapping an example opens it in place and starts nothing, there is no auto-advance or carousel, and the ask card shows its plain statement without a gesture, in the same place and at full strength from the start. Review (EX-DES-2, EX-DES-9): examples follow R209 | L2, L3 | P1 | 1 | MT-A3-R1..R8, MT-A3-R24, MT-A3-R25, EX-DES-2, EX-DES-9 |
| NS-53-R148 | Given a card tapped, Then it answers the finger and gets out of the way, a double tap opens one capture, talk or write follows one rule, and every motion can be interrupted and lands honestly; VoiceOver and focus follow the move and every motion has a non-motion form | L2, L4 | P1 | 1 | MT-A4-R1..R5, MT-A4-R8, MT-A4-R9, MT-A4-R22..R25, MT-T3-R37 |
| NS-53-R149 | Given a tile, Then it opens a full photo with a measured or hand-off origin, closes back to the tile, swipes between the photos of one day, pinches and pans, plays a video only from its poster on tap, shows a calm state when the photo is not on the phone, hides under privacy cover and OS interruptions, and the viewer cross-fades from thumbnail to sharp | L2, L5 | P1 | 1 | MT-T4-R1..R10, MT-T4-R21, MT-T4-R22 |
| NS-53-R150 | Given the day sheet and viewer, Then focus order, Switch Control, Full Keyboard Access, Voice Control, text size and Bold Text are covered by one table of variants, and expand, collapse, set-aside and Undo are reachable without a gesture | L4, L5 | P1 | 1 | MT-T4-R12..R19, MT-D3-R11, MT-D3-R13 |
| NS-53-R151 | Given Moments, Then haptics follow 14.3 and none plays on tab switch, open, Allow, Not now or load; `selection` on "Another thought"; Keep uses its existing haptic; no sound | L0, L5 | P2 | 1 | MT-A1-R22, MT-A3-R10 |
| NS-53-R152 | Given the motion code, Then it carries no content, no id, no count and no date in any marker or log, and performance frame budgets for 60 and 120 Hz, Low Power Mode and thermal state are checked on a device | L0, L5 | P1 | 1 | MT-A1-R23, MT-A1-R24, MT-A5-R2, MT-A5-R21..R24, MT-A4-R25 |

## 15. Accessibility

The bar is the public App Store quality bar: iPhone SE 3, AX5, Bold Text, VoiceOver, Voice Control, Switch Control, Reduce Motion, Reduce Transparency, Increase Contrast, light and dark.

- One heading first; reading order equals visual order; each card is one element read as its reason, date and content; the dismiss is a custom action that is also a visible button; hints say the result. The collage is one element with no machine description: its label is built only from the date, the parent's own words and file kind ("Video, N seconds", "Picture N of M" inside one letter only, per NS-52-R28 and reconciliation 37).
- Examples are named "Example". The system permission dialog is Apple's and untouched; no second automatic ask.
- Layout switches at AX1; the pair of ask buttons stacks; parent words never truncate; the pinned control stays under a quarter of the screen and everything scrolls; Bold Text honoured; 44 pt targets 8 pt apart; one-handed reach; no gesture without a button.
- Text on paper only in both themes; 4.5:1 text and 3:1 non-text contrast; Increase Contrast set with a `mediaFrame` outline; dark mode separates layers and photos never glare; colour is never the only signal; no text, chip or button over a photo; loading, empty and error are spoken once and never nag.
- Glass: zero own glass recommended, at most three surfaces, with the solid fallback.

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R153 | Given VoiceOver, AX5 with Bold Text on iPhone SE 3, Reduce Motion, Reduce Transparency and Increase Contrast, Then each tab reads its heading first, focus goes to a named place after every change, the selected tab and the For you and Recent switch are stated not coloured, and the walk script passes on a real device | L2, L4, L5 | P0 (a) | 1 | MT-D4-R1..R5, MT-D4-R21, MT-P1-R22, MT-P2-R38, MT-T1-R40, MT-A1-R19, MT-A1-R20, MT-A5-R20 |
| NS-53-R154 | Given a collage or day, Then it is one element whose name uses only the date, the parent's words and file kind, no count, place, person or scene, no network call exists in the label code, each photo in the opened day is named in time order, and nothing is read that the app cannot know. Review (EX-DES-13): the card name is R214; the collage label stays free of any place | L0, L1, L5 | P0 (a) | 1 | MT-D4-R6..R11, MT-A2-R13, MT-A2-R14, MT-D3-R25, MT-P4-R28, EX-DES-13 |
| NS-53-R155 | Given the permission states and loading, empty and error states, Then each is spoken once, never nags, and works at AX5 without a pinned bar over content | L4, L5 | P0 (b) | 1 | MT-D4-R14..R17, MT-D4-R33, MT-D2-R16, MT-D2-R17 |
| NS-53-R156 | Given AX1 and above, Bold Text and Reduce Motion, Then layout switches at AX1, parent words never truncate, targets are 44 pt and the whole card is the action, no gesture exists without a button, and the tab is reachable one-handed | L2, L3, L5 | P0 (a) | 1 | MT-D4-R18..R26, MT-D1-R2 |
| NS-53-R157 | Given themes and glass, Then text sits on paper in both themes at 4.5:1 and 3:1, Increase Contrast and Smart Invert are honoured (photos never inverted), colour is never the only signal, no text or control sits over a photo, and glass is at most three surfaces with a solid fallback. Review (EX-DES-1, EX-DES-17): the closed exception list is R208 and glass follows R217 | L0, L3 | P0 (a) | 1 | MT-D4-R27..R32, MT-D1-R12, MT-A5-R18, MT-A5-R19, MT-A1-R17, EX-DES-1, EX-DES-17 |
| NS-53-R158 | Given a card, Then dismissed, snoozed and hidden differ, are undoable and soft, and the day's custom actions are reachable by VoiceOver, Voice Control and Switch Control | L2, L4 | P1 | 1 | MT-D4-R9, MT-D3-R16, MT-D3-R13, MT-T4-R18 |

## 16. Content and microcopy intents

`packages/content` owns every word. This file sets intents only; PROPOSED words never ship. Rules: parent words only; one verb per tab word; `{child}` never gendered; `{app}` not "we" or "our" in touched in-app copy (D5-F3); no claim that a thing "stays on this phone", "never leaves", "no one else" in touched copy (D5-F4, D-100 option B: accounts and sync exist); no machine title (D5-F5).

| Surface | Intent |
|---|---|
| Heading and job line | "Moments"; "Choose a day to tell {child} about." (verb choose) |
| Value lines (before permission) | What the tab does in plain words, shown with Asha examples; never a promise of something not in the build |
| Ask card and primer | One plain sentence naming the date, the time and where the pictures were taken, read on this phone to show days (R192); equal Continue and Not now; the four door lines behind one disclosure (R218) |
| Not now, declined, limited | Not now: nothing. Declined and limited: a calm line and one control; never scolding, never "allow", "access" or "settings" outside the denied line and Me |
| Card patterns | Reason line, date, the parent's own label only, one verb action; see 6.4a |
| Empty and error | One calm line and one action; no apology; no "nothing yet" |
| Nudges | Fixed neutral lines; a nudge never reads as a slideshow; no count; intent only (D6-R6) |
| VoiceOver | Label states what it is and what it does in one short phrase |
| The tab name | From `packages/content`; "Moments" only as navigation label and place; not in the store or website until counsel clears it |

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R159 | Given any Moments string, Then it uses the glossary vocabulary, no internal term (take, entry, draft, pack, raw_transcript), `{child}` and `{app}` placeholders, no "we" or "our" outside sanctioned promises, no on-device-only claim banned by D5-F4, no PROPOSED word in a shipped screen, and every string comes from `packages/content` keys | L0 | P0 (a) | 1 | MT-D5-R1, MT-D5-R8, MT-D5-F2, MT-D5-F3, MT-D1-R13, MT-D6-R5 |
| NS-53-R160 | Given the illustrated examples, Then each carries the muted caption "An example" and VoiceOver says so | L0, L4 | P0 (a) | 1 | MT-D5-R7, MT-D4-R13 |
| NS-53-R161 | Given the five-parent readings, Then a parent states what Moments is for in one verb, what the app will and will not do with pictures, and does not think the app wrote anything; Route A frames are tested so no parent believes the app made Apple's title | L5 | P1 | 1 | MT-R1-R1, MT-R1-R2, MT-R1-R9..R11, MT-B1-R1..R10 |

## 17. Data model and classification

No server table, column, RPC or sync op is added for the library part of this tab (MT-X5-R14). What lives where:

| Data | Where | Level (`DATA_CLASSIFICATION.md`) | Synced to our server | Retention | Removed by |
|---|---|---|---|---|---|
| Moments decisions: day keys for Not now, Not this one, Hide this day, Keep close, a parent label (60 characters) | `moments.json` outside `scribe.db` (ADR 0032 pattern, status Proposed), excluded from iPhone backup and read back; contract in 17.1 | L4 | Never | Per field in 17.2 (expiry and cap) | Revoke, Turn off, Erase, sign-out, Delete account as R246 says |
| Hidden-place keys and place corrections | Same file | L4 | Never | Same | Same |
| A left-out picture identifier and a chosen album identifier: NOT stored in the first release (O-13 and O-14 default to No; if signed, hashed, capped, R247) | Same file | L4 | Never | n/a by default | n/a by default |
| The home-place correction ("This is where we live"), one value per book (R249) | Same file | L4 | Never | Until the parent removes it | Same, no export, no backup |
| Optional index cache (only if O-09 is signed) | Same file; a cache that can be rebuilt | L4 | Never | Rebuilt on foreground | Same |
| Primer answered flag; nudge opt-in flags | Phone settings | L2 | Never (PRIV-R21 consent row for email only) | Until changed | Erase, sign-out |
| Coordinates, place ids for the window, the home place, thumbnails | Memory only | L4 | Never | The session | App exit |
| A kept letter's copies of pictures | The app container, `entry_media` | L4 | Not under Variant A. A stored copy is on the phone and is not excluded from iPhone backup (FACT-CHECK), so the policy gets a line before the flag goes on, or the folder is excluded (O-44, R235) | With the letter | Letter deletion paths |
| Server rows for the lifecycle email (phase 2): a parent-chosen date, repeat flag, channel; the consent row | Server, new table and migration (not written here) | L2 and L4 as classed in X6 | Yes, this is the only new server data | Until deleted by the parent; hard delete at once | Parent delete, account deletion |

Facts that bound this table (FACT-CHECK-PRIVACY-EAS, commit c65c39f4, read by the coordinator): no build uploads or stores a picture today; the local table is #835, #836 to #840 are open and the photo UI sits behind `EXPO_PUBLIC_PHOTOS`, which no `eas.json` profile sets; Privacy Policy 3.0.0 and the label are correct today; the server refusal migration `20261110000000` is pending and its live status is UNVERIFIED. `SERVER_FEATURES` is on for production and preview and off for testflight, development and e2e; backup, status report and analytics are off everywhere. The first store submission is the production profile (Build 12), so servers are ON in it; X6 was right and X1, X3 and X5 hold only for testflight. Stale text to flag to `legal`: `privacy-policy.md` line 21 and `capabilities.ts` lines 7 to 12.

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R162 | Given the table above, Then each field has a level, retention and removal path recorded in the classification table, nothing library-derived is in the outbox, pull merge, push mapper or any export, and a canary asset id, album, date, coordinate and filename through every path (primer, Recent, picker, push, email) leaves 0 hits in logs, breadcrumbs, crash payloads, analytics and URLs. Review (EX-PRV-14, EX-CDO-12): the canary also covers attach, Keep, outbox, push mapper and export (R257); the place keys and the home-place correction are L4 rows (R249, R254) | L0, L1 | P0 (a) | 1 | MT-X5-R12..R15, MT-P3-R32, MT-P2-R36, MT-P1-R20, MT-X3-R24, EX-PRV-14, EX-CDO-12 |
| NS-53-R163 | Given a book with no child tie in the hand-off, Then the letter goes to the active book and Review's To lets the parent change it, and no string or code guesses whose pictures they are | L2 | P0 (a) | 1 | MT-P4-R36 |
| NS-53-R164 | Given pictures of other people or other children, Then no code reads, ranks, hides, tags or labels by who is in them, the tab never says it recognised anyone, and nothing in the tab reads a video's audio or frames | L1 | P0 (a) | 1 | MT-X1-R1, MT-X1-R3, MT-X4-R29, MT-X2-R22 |
| NS-53-R165 | Given the tab is an adult surface, Then the child never signs in, no age or face signal is read, the tab stays outside the Kids Category, store frames use only Asha synthetic images, and a parent who the support team learns is under 13 or under 18 follows the existing gate. Review (EX-CCO-10): the age wording is R244 | L2, R | P0 (b) | 1 | MT-X2-R20, MT-X4-R26..R28, MT-X4-R30, MT-X4-R61, MT-X4-R59, EX-CCO-10 |
| NS-53-R166 | Given account deletion and the parent turning Moments off, Then the library-derived data is removed as in section 10, the consent record for the library is on the phone only, and the answer to an access or deletion request is that we hold nothing from the library. Review (EX-CDO-8, EX-CLO-11): the file is deleted by the rule of R246; the answer to a request says we hold nothing from the library and says plainly that pictures already attached to letters, and the backup copy (O-44), are separate | L0, R | P0 (b) | 1 | MT-X4-R62, MT-X4-R64, MT-X4-R37, EX-CDO-8, EX-CLO-11 |

### 17.1 The `moments.json` contract (R221)

| Field | Rule |
|---|---|
| `v` | Integer schema version. A higher `v` than the app knows reads as empty and writes nothing (the file is not downgraded or deleted by an older build) |
| `owner` | An opaque local id for the book or phone, never a person id or a child name (EX-CDO-17) |
| `dayKeys[]` | Local ISO date strings with no zone. "Not this one" applies to the date as the parent saw it |
| `labels{}` | Day key to the parent's own words, 60 characters; the parent's words, stored on this phone only, in no backup and no export (R250) |
| `hiddenPlaces[]` | Stable external place ids (R229), never a readable place name (EX-SEC-5) and never a raw picture id |
| `homePlace` | The correction of R249, one value per book |
| Unknown fields | Preserved on write |
| Write | A temp file then a rename. A corrupt file is deleted and the tab starts clean with no message |
| Not in the file | A picture identifier, an album identifier, a coordinate, a count, a score, a thumbnail (first release) |

Library dependencies the native module and the day sheet may use (EX-SEC-1) are exactly those named in the dependency review of R230; no other package is added by this tab.

### 17.2 Retention per field (R245)

| Field | Expiry | Cap (ASSUMED, data, set by G1a) | Pruned by |
|---|---|---|---|
| Not now key | The next local midnight | One per day shown | Removed at the next focus |
| Not this one, Hide this day | Never, until the parent undoes it | A maximum count in `rules.ts` | A day key older than the library window and not kept is pruned; the oldest are dropped first at the cap |
| Parent label | Until the parent removes it | The same cap | The parent only |
| Hidden place, home-place correction | Until the parent removes them | One value per book for home; a cap for hidden places | The parent only; wiped on Turn off, Erase, sign-out |

Each rule has a test that fails without the pruning code.

## 18. Analytics

Analytics follows D-163 for each build profile (the production build's default changed after the lead documents were written; the exact open D-163 gates are UNVERIFIED here and the registry documents say which events wait on them, EX-CDO-3, R251). With the flag off, or without the lawful basis for that profile, 0 events are sent or queued and the screen works the same. When on, the closed allowlist is enums only, with no free text, id, date, count, place or picture, and at most one impression event per slot per local day:

| Event | Trigger | Closed properties | Notes |
|---|---|---|---|
| `screen.moments_home.viewed` | The tab drawn in front | `via`: tab, control, back, link, system | A screen view |
| `ui.moments_card.impressed` and `.tapped` | A card in the `question` or `look_back` slot drawn or tapped | `slot`: question, look_back | A slot is defined by position and not by source. No event for any card dated by the child's birth date, a typed day, a tick or the library: on those days the presence of the card would itself disclose the date (EX-CDO-1, EX-CDO-4). `look_back` is limited to letters |
| `ui.moments_ask.impressed`, `ui.moments_ask_allow.tapped`, `ui.moments_ask_notnow.tapped` | Our own ask control | none | Says nothing about the library; no event may follow that varies with Apple's answer |
| `capture.letter.started` | A letter started | `source` (existing closed value; `moment` is not sent in the first release, R87 and O-38) | Never says it began from a Moments card |
| `perf.moments_first_paint.measured` | First paint | `ms_bucket`, `is_ok` | Raw milliseconds stay on the phone; no device tier (a fingerprinting aid); names and element ids registered in `ids.ts` and written to the event standard |
| `system.error.raised` | A closed class | `area`: moments; `code`: picker_unavailable | No content; `library_unreadable` and `fallback_used` stay local error codes only because they would reveal access state |

Not proposed: the permission result (allowed, limited, denied), any count of days or pictures, any place or kind that came from the library, any distinction between a library-timed reminder and an ordinary one, any week-level or timestamp that could mark a Day or birthday. OPEN (O-18): the permission-result enum (P3 Q-P3-4) stays out unless the founder, analytics and counsel sign it. Registry rows land in `packages/analytics/src/catalog.ts` with the generated docs.

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R167 | Given any Moments screen, tap, card, permission answer, day or place, Then no analytics event, log line or crash field carries a card, source, date, picture, count, place or letter id; the allowlist is the closed enums above; events are in the registry and docs are generated; with analytics off or consent not given 0 events are sent and none queued. Review (EX-CDO-3, EX-CFO-9): events follow R251 and D-163; at most one impression event per slot per local day | L0, L1 | P0 (a) | 1 | MT-P3-R26, MT-P3-R31, MT-P5-R23, MT-P5-R24, MT-P2-R36, MT-P1-R20, MT-X1-R9, MT-X6-R23, EX-CDO-3, EX-CFO-9 |
| NS-53-R168 | Given every read-out of a study, Then it states n asked and n answered, never shows a percentage under n = 20, contains no content from a parent's library, and is recorded as "x of n" | L5 | P1 | 1 | MT-P5-R22, MT-P5-R21 |

## 19. Architecture and phases

### 19.1 Modules (X3)

One pure moment engine in `packages/core/src/moments` (types, exclude, group, rules, occasions, place, collage, rank, plan) with three callers: the tab (`use-moments` hook), the local push planner (one boolean plus a day key) and, in phase 2, a server email job that sees only server-held facts. One native module `scribe-library` reads the library (five closed functions, NS-51-R29); `scribe-photo` keeps the picker and the attach pipeline and gains the Route A door in phase 3. Screens call `apps/mobile/src/lib` only (CODE-R11). The type has no words in it; enums are defined once; no id travels in a route; flags only narrow; one `momentsFor` registry holds each source's surfaces as data. The router adds a fourth tab and the `moments/pick` modal route; a test pins tab order and the route table. An ADR is drafted when the founder signs (number to check; X3 section 21 holds the draft).

### 19.2 Flags and switches

| Id | Name | Kind | Controls | Release profile |
|---|---|---|---|---|
| F1 | `EXPO_PUBLIC_MOMENTS_TAB` | Build flag | The tab, For you, value view | ON |
| F2 | `EXPO_PUBLIC_PHOTO_MOMENTS` | Build flag | The ask, the library read, Recent, places | ON in the release profile by founder ruling 21 Nov; the build fails the store check if a gate in section 21 has no read-out (R222). The code carries a separate `PLACE_READ` constant (R241); splitting it into F2a (ask, read, Recent, day cards) and F2b (place labels and the location member of the read) is a recommendation at O-39, so that a place problem does not take down the library read |
| F3 | `EXPO_PUBLIC_PLACE_NAMES_APPLE` | Build flag | The Apple geocoder adapter (P-B) | OFF, and the adapter is not compiled into the release profile (R236); phase 2 after G8 |
| F4 | `EXPO_PUBLIC_MOMENT_NUDGE` | Build flag | The library-timed local reminder | OFF until counsel answers Q-X1-6 |
| K1 `momentsTab`, K2 `photoMoments`, K3 `libraryDays`, K4 `momentNudges`, K5 `machineLabels` (R202), K6 `purgeLibraryData` (security only, R246) | Kill switches | Hide at next launch; delete nothing; recording, typing, saving, reading, playback, sweep, Erase and export still work | Not paused |

### 19.3 Phases (founder ruling 21 Nov)

| Phase | What ships | Gate |
|---|---|---|
| 1 First release | The tab (second of four, Home landing), For you (typed days, ticked Days, birthdays and month days, public holidays by date, a year ago from letters and pictures, the 111 prompts, pictures already picked), the permission ask on the parent's tap, the own library read (Route B, Limited honoured), Recent, day cards with the parent's own pictures and the weekday and date, places from the offline table, teaching verbs, capture hand-off and attach, local reminders from phone-held facts, F1 and F2 ON in the release profile | Release gates G1b to G7, G10 and G11 (section 21), after the G1a spike |
| 2 | The library-timed local reminder (F4); the lifecycle email on a parent-chosen date (dark first); the Apple geocoder (F3) if G8 is signed; run cards if the card sort says so | Counsel on Q-X1-6; E75 and CATALOG ruling; written counsel answer on G8 |
| 3 | Route A (Apple's journaling suggestions picker) as an optional door; K-SUG; any widget | Entitlement answer, DPLA read, spike D1; G9 |

If a gate in phase 1 fails, the part it guards stays dark in that build and the release record names it (MT-P5-R8). Whether the date or the library part slips is the founder's question O-37 (recommended: the library part only for G2 and G8, which need a written licensed-counsel answer; the date for the others), asked now and not at the gate (EX-CPO-1, R262). Silence from counsel is never a pass: a part whose gate needs counsel stays dark.

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R169 | Given any EAS profile, When config is built, Then F2 is on only in the profiles named in one allow list reviewed by privacy (the release profile, preview and development), a test fails on any other profile, and the scan checks the plist usage-string key and the reachability of every `scribe-library` call site (the module is linked in every profile and is dead code when F2 is off, R222); with F1 off the bar, routes and tests equal the build without Moments | L1 | P0 (b) | 1 | MT-P5-R1, MT-P5-R4, MT-P5-R5, MT-P5-R6, MT-X2-R13, MT-X3-R23 |
| NS-53-R170 | Given K1, K2 or K4 paused in a signed config, When the app launches or focuses, Then the matching surface is hidden, nothing is deleted, recording, typing, saving, reading, playback, sweep, Erase and export still work, and a config from before K1 and K4 existed reads as not paused | L0, L2 | P0 (b) | 1 | MT-P5-R2, MT-P5-R3, MT-X3-R16 |
| NS-53-R171 | Given F2 is set on, When the release owner prepares the build, Then each gate G1b to G7, G10 and G11 (G1a first, before PR 9) has a dated read-out with a commit linked in the release record and a missing one blocks the flip through the guard of R222; a G2, G8 or G9 read-out is a written answer from licensed counsel or that part stays dark (R238); a failed gate names which part stays dark, and which part slips is O-37 | P | P0 (b) | 1 | MT-P5-R7, MT-P5-R8 |
| NS-53-R172 | Given the router, Then the Moments tab is a tab screen under `(tabs)`, `moments/pick` is one row in `ROUTES` with a modal presentation, the tab order is a tested decision, and the app's one `startCapture` is the only caller of `/listen` and `/write` | L0 | P0 (c) | 1 | MT-T3-R1, MT-T3-R2, MT-X3-R4, MT-X3-R21, MT-X3-R22 |
| NS-53-R173 | Given a moment source returns a denied or limited state, Then that is a working state and not an error, and the engine never returns a library moment from a server code path | L0 | P0 (a) | 1 | MT-X3-R14, MT-P3-R25 |

### 19.4 PR plan: 26 PRs in five waves (EX-ENG-5; sizes ASSUMED, changed lines excluding generated data and lockfile)

Owners use roster handles. There is no `core` handle, so engine PRs go to `mobile` with `principal-architect` reviewing under CODE-R13. Each PR carries its row ids so section 26 stays honest. Each stays under CODE-R02 (400 lines, 20 files).

| # | PR (one concern) | Owner | Size | Depends on |
|---|---|---|---|---|
| 0 | Decide the D-### defaults and the review text in this file (docs) | `product` | docs | founder G10 for the flip only |
| 1 | `moments/types`, `reasons`, `rules.ts` constants, enums in `domain.ts` | `mobile` | 300 | 0 |
| 2 | `exclude`, `group` with `offsetAt`, qualification, `asha-lib-v1` generator and 20 goldens | `mobile` | 380 | 1 |
| 3 | `rank`, `collage`, tile order, seeded rotation, property tests | `mobile` | 350 | 2 |
| 4 | `occasions` (birthday, month day, holidays, firsts), `momentsFor` registry, slots | `mobile` | 380 | 1 |
| 5 | `place.ts` with an injected table, grid lookup, goldens on a synthetic table | `mobile` | 300 | 1 |
| 5b | Place table package and generator, licence note, ledger | `mobile`, `privacy` approve | generated | licence read by licensed counsel (G11b) |
| 6 | Tab shell: fourth tab, `tab-jobs`, `MOMENT_SOURCES`, navigation tests, F1, `moments/pick` route row | `design-systems` | 250 | 1 |
| 7 | Analytics decision for `source` and catalog rows (or the no-change note) | `analytics` | 150 | 6 |
| 8 | `moments.json` store, clear, `eraseDeviceFiles`, schema tests | `mobile` | 300 | 0 |
| 9 | `scribe-library` access and fetch (columnar), `nullSource`, `fixtureSource`, TS surface | `mobile` | 400 | G1a read-out; G3 to merge |
| 10 | Native thumbnail view, bounded LRU, cancellation | `mobile` | 350 | 9 |
| 11 | Config plugin usage string by profile; guard scripts (read set, forbidden signals, import graph, call site, gate read-out) | `privacy` text, `qa` scripts | 350 | 9 |
| 12 | Content: tab, reasons, ask, primer with Shown, Records, Never, Decline, states | `content` | 380 | none |
| 13 | Components: `MomentCard`, `DayCollage`, `ExampleCard` | `design-systems` | 400 | 6, 12 |
| 14 | Components: `PermissionAsk`, `SegmentedSwitch`, state lines | `design-systems` | 300 | 12 |
| 15 | `use-moments`, ACC state function, foreground re-read, kill switches | `mobile` | 350 | 4, 8, 9 |
| 16 | For you screen with no library, value view, examples | `mobile` | 300 | 13, 14, 15 |
| 17 | Primer, ask flow, Recent, day sheet | `mobile` | 400 | 10, 16 |
| 18 | Copy-for-attach paths (image and video) in `scribe-photo`, `AttachRequest`, hand-off | `mobile` | 400 | 9 |
| 19 | Capture hand-off from a day, back-out, draft prompt | `mobile` | 300 | 6, 17, 18 |
| 20 | Viewer (full image, video poster and play) | `mobile` | 300 | 18 |
| 21 | Teaching verbs, Me list, Turn off, Start again | `mobile` | 350 | 8, 17 |
| 22 | Places on cards, Hide this place | `mobile` | 300 | 5, 5b, 17, 21 |
| 23 | Home pointer, existing-class nudges from phone-held facts | `mobile` | 250 | 4, 6 |
| 24 | Simulator library generator, Maestro flows, L3 and L4 set (the N layer, R225) | `qa` | 400 | 9, 17 |
| 25 | Release read-out guard step and `docs/release/<x.y.z>.md` entries | `qa`, founder pastes the workflow step | 150 | 11 |

Waves. A (parallel): 1, then 4, plus 6, 8, 12 and the G1a spike. B: 2, 3, 5, 9, 13, 14, 7. C: 10, 11, 15, 18, 16. D: 17, 19, 20, 21, 22, 23, 24. E: 25, the gate read-outs, then the F2 flip. About 7,600 lines across 26 PRs (ASSUMED). Phase 2 (library-timed reminder, email, geocoder) and phase 3 (Route A) are not in this split. Which can start now, before the founder's answers: the pure core PRs 1 to 4 (and 5 with a synthetic table), and the Wave A PRs that need no native code (6, 8, 12); PR 9 waits for G1a and its merge for G3; PR 5b waits for the licence read.

### 19.5 Fenced paths (R243)

| Path | Tier | Touched by this tab | Approvals if touched |
|---|---|---|---|
| `compliance/FENCE.json` listed paths | as the file says | None by default (the Moments tab and the library module are new files under `apps/mobile` and `packages/core/src/moments`) | If a PR touches one: CCO approval at the head commit, Karma, and the assigned-agent label if the path is protected, quoting the ruling id |
| `app.config.ts` (usage string by config plugin) | UNVERIFIED whether fenced | Yes, PR 11 | Read the fence at PR time and record the tier in the PR |
| `docs/legal/**`, `packages/content/BRAND.md`, `docs/agents/CLAIMS.md` | protected by repo rule | No edit in this file; entries are proposed in `FREEZE-CHECKLIST.md` | The owner's own PR |


## 20. Metrics and experiments

HYPOTHESIS, stated once: that Moments is a daily-return driver. No parent evidence exists in the repo or in what the leads read; the privacy lead found none for a lift from library nudges. Thresholds below are hypotheses and nothing is a statistic until n is at least 20; before that it is "x of n".

| Id | Question | Design | Proves us wrong if |
|---|---|---|---|
| E1 | Value first, then ask, or ask first? | Moderated, order swapped across five, Asha examples | Fewer than three of five prefer value first |
| E2 | Does Moments in second position help or hurt starting a letter? | Two TestFlight builds, F1 different, n of at least 20 per group before any percentage | The group with the tab starts fewer letters |
| E3 | Route A and Route B in the same frame | Same five parents see both | Route A makes a parent think the app wrote the title |
| E4 | Is the daily reason real? | Two-week diary, tester question 1 | Fewer than half of n say they opened it unprompted |
| E5 | Pressure | Tester question 3 | Any parent says yes in a way traceable to a card or a push (blocks launch until the copy changes) |
| E6 | Does a local nudge help without nagging? | Existing classes only | People turn notifications off after a Moments-related line |
| E7 | Do places and occasions help or feel like watching? | Five-parent card sort on the real-library trial (P6 6.10) | Any parent says "I did not expect it to know" (halts that signal) |

What would prove the whole bet wrong: the tab with no permission feels empty to most parents; parents with access say it feels like being watched; starting a letter gets harder with the tab; the device spike fails on the iPhone SE 3; counsel says the per-type label cannot hold; Apple rejects the usage string; or a single case where a machine-made word is stored, shown or sent as the parent's own (a constitution break; the feature stops).

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R174 | Given the five-parent default-tab check, the card sort and the two-week diary, Then results are x of n with a stop line, with no telemetry; a distress answer stops the session; findings reach the backlog | L5 | P2 | 1 | MT-R1-R1..R11, MT-P2-R41 |

### 20.1 Instruments, the measurable and the stop line (R252, R264, R259)

| Metric | Definition | Denominator | Who is missing | Minimum n |
|---|---|---|---|---|
| Trial-to-paid and first renewal, per install-week cohort, never blended (PROPOSED measurable) | App Store Connect, cohorts before and after the tab ships, split by the F1 and F2 state recorded in the release record | Installs of that week | Parents who never open the tab; installs on builds without it | 20 per group before any percentage |
| Daily return (hypothesis only) | The two-week diary (E4), tester question 1 | Diary participants | Everyone not in the diary | x of n, no percentage under 20 |

Stop line (PROPOSED, the founder sets the numbers at O-46 before the build): if trial-to-paid or first renewal for the after cohorts is worse than the before cohorts by more than the founder's stated margin for two consecutive install-weeks, F1 is paused by K1 and the tab returns to a design review. Moments does not change the F14 section 6.9 rules or numbers; they are read as written (EX-CBO-2). No library data is used for any of this; nothing is built to measure the return claim at 1.0 beyond the diary.

## 21. Release gates (before store submission, not before coding starts)

Founder ruling 21 Nov: the first release includes the library read. The items that were "before engineering" are release gates. Code is built behind the flag from the start; F2 turns on in the release profile only when each gate has a dated read-out in `docs/release/<x.y.z>.md`.

| Gate | What it proves | Owner | Pass means | If it fails |
|---|---|---|---|---|
| G1a Early device spike (first week, before PR 9) | On the founder's phone or a simulator with a script-made library, only the unknowns: is `asset.location` readable under Limited and without a Core Location permission, the source-type default, the subtype predicate, delivery options, what the default fetch does with the hidden album and Recently Deleted, the iCloud-only skip, and the place table size and accuracy against the R204 bars; the read-out holds timings and rates only | `mobile` with the founder's phone | A written read-out that is the input to PR 9 | The unknown it names stays unbuilt |
| G1b Full device run | The scan, thumbnails, a zone change, Limited and Full access, a script-made 20,000 item library, and the place table size run within budget on an iPhone SE 3; ASSUMED thresholds (`BUSY_DAY`, `SESSION_GAP`, `RECENT_CAP`, `CANDIDATES`, the LRU size in bytes, the place radius, the floors and margins of R204) are set as data | `mobile` with the founder's phone | A written read-out with device numbers | The affected part stays dark (O-37) |
| G2 Counsel read | The ten questions of 21.3, including App Review 5.1.2(v) and (vi) (is a picture-timed reminder or use barred), the per-type label ("Photos or Videos" and "Precise Location" for a build that reads them on the phone with servers on), the purpose string, the policy, the backup line, an on-device nearest-place lookup under the store rule and state precise-geolocation definitions, and the Terms | `legal`, `privacy`, licensed counsel | A written answer from licensed counsel with name and date on each (an internal memo, an agent review or an AI memo does not count, and silence is not a pass) | The affected part stays dark |
| G3 Approval of READ_SET_V1 | The closed read set (P6 Q1: hearts, burst ids, subtype flags) with the location member signed separately (R241), and a stored-identifier decision (default: none stored, O-13 and O-14) | `privacy`, `security-architect` | Signed set; Privacy's recommendation is APPROVE WITH CHANGES (the consent text names what the set reads; the location and identifier members carry handling conditions) | Narrow the set; store none and ship "Not this one" only |
| G4 Five-parent check | Parents understand the tab, the ask, Not now, that the app wrote nothing, and the place and occasion cards do not feel like watching; run on city-level place lines (R219), never on the current prototype; asks specifically about a stay away from home and a year-ago card; a bar of zero wrong-city labels and at least three of five cards "a day I would write about" | `user-research` | The section 20 bar | Wording or design changes first; place lines ship off for that build if any parent did not expect it to know |
| G5 Accessibility pass | iPhone SE 3, AX5, Bold Text, VoiceOver, Voice Control, Switch Control, Reduce Motion, Reduce Transparency, Increase Contrast on every state | `qa`, `design-systems` | The device rows pass (W1 to W12) | No ship |
| G6 Content rules | No machine title in a letter, no count, gap, streak or badge, `{child}` only, no PROPOSED word, the tab name in-app only | `content` | `rules.test.ts` and the glossary pass | Fix the copy |
| G7 Real-iPhone checks | The permission states, Limited and the limited picker, revoke in Settings, status after a Settings change, local notification timing and quiet hours across a zone change, the cold-start tap landing, the switcher snapshot, the App lock snapshot for the Moments tab (R232), a restore from backup with attached pictures (device row D-3, R235), Reduce Motion frame times | `qa`, founder's phone | Dated read-out holding timings and rates only | F2 or the affected part stays off |
| G8 Place data flow (phase 2, not the first release) | Only if P-B (Apple geocoder) is wanted later: Attachment 6 read in full, the one-request rule, the exact data sent (precise coordinates to Apple's service), consent text, caching, policy and label impact, venue names cut to city level in code | licensed counsel, `privacy` | A written answer from licensed counsel and signed text | F3 stays off and uncompiled; P-A and P-C ship |
| G9 Suggestions (K-SUG) | NOT PLANNED (O-32). Only if the founder asks: counsel on 5.1.2(vi) and on children's image analysis law, the model and what it retains, the five-parent read | licensed counsel, `privacy`, `security-architect` | Written answer | K-SUG not built |
| G10 Founder signs | The reversals RV-01 to RV-22 the first release needs, in a D-### entry `product` drafts as Proposed, presented as four signatures (Tab and capture; Permission and ask; Computed labels, places and occasions, including H-10; Nudges and email) so one signature does not carry all twenty-two (EX-CPO-10) | founder | The entry | The part is not built |
| G11 Security, data, licence and store paperwork | (a) Security read (owner `security-architect` with the CISO role): lockfile and prebuild diff against `NATIVE_MODULE_GATE.md` items 1 to 3, binary and plist scan (usage string only in allow-listed profiles; no `CLGeocoder`, `MKLocalSearch`, `PHAssetChangeRequest`, `performChanges`; no photo-add usage string; no background mode, app group or location entitlement), source read of `scribe-library`. (b) Place table provenance and licence (`mobile`, `legal`, CFO, CBO): the named dataset, the licence text read by licensed counsel, attribution, size, binary or signed download, the ledger `docs/security/PLACE_TABLE.md`. (c) Data inventory (`data-architect`): `DATA_CLASSIFICATION.md` 4.6 rows and the data map row for the decisions store, merged with the code (R250). (d) Store paperwork parity (`legal` with `privacy`): label, policy, usage string, Notes for Review and privacy manifest match the production profile, with an evidence index in `docs/release/<x.y.z>.md` (R240) | as named | A dated line with a commit for each of a to d (R171, R222) | The part stays dark |

Also in force before submission: the Notes for Review say what is read and that the tab works with access refused; the policy and label change in the same build as the behaviour; the usage string is plain and true and names the date, the time and the place (R192); the first store submission is the production profile, which has server features on, so the privacy statements are written for that profile, not for testflight.

### 21.1 Gate calendar and evidence index (R262; every date is PROPOSED and the founder's to set; D-121's target of Tue 1 Dec is UNVERIFIED as still current)

| Item | Proposed decide-by | Evidence artefact in `docs/release/<x.y.z>.md` |
|---|---|---|
| O-37 answered (which slips if a gate is open) | Tue 24 Nov | The founder's one-line answer with the date |
| Entity and individual-publisher decision, ahead of D-004 | Fri 27 Nov | D-### entry; counsel's written answer if any (O-47) |
| G1a read-out | Fri 27 Nov | Device read-out, timings and rates only |
| G3, G10, G11 a to c | Mon 30 Nov | Signed set; the D-### entry; G11 lines with commits |
| G1b, G2, G4, G5, G6, G7, G11 d | Mon 30 Nov, the day before the target | One dated line each with a commit; G2 as a licensed-counsel written answer |
| The fallback is invoked or not (O-37) | Mon 30 Nov, named decider: the founder, with the CFO's cost and the CPO's calendar | The record names the part that stayed dark |

### 21.2 Money implied by this PRD (R263; every row is FOUNDER and the default is no spend; costs are UNVERIFIED unless a source is given)

| Item | What it buys | One-off or recurring | Cost | If nobody acts | How to cancel | Trigger as a number | Owner |
|---|---|---|---|---|---|---|---|
| Counsel read for the Moments gates (the ten questions of 21.3) | Written answers for G2 | One-off, capped brief recommended | UNVERIFIED | The parts that need counsel stay dark (silence is not a pass) | Stop the engagement | Founder sets the cap at O-40 | FOUNDER |
| Place dataset licence | A lawful place table | One-off or none | UNVERIFIED; prefer a source with a permissive, attribution-only licence | No places in the first release | Do not adopt it | n/a | FOUNDER |
| Entity, accountant (CR-120, Gap, before the first payout), insurance quotes (FT-37) | D-004 hedge, 5.1.1(ix) | One-off and recurring | UNVERIFIED | Individual publisher stays | Decline | Decide before D-004 on Fri 27 Nov | FOUNDER |
| Name filing for Moments | Trademark protection | One-off | Not needed while the word is in-app only; UNVERIFIED | Nothing | Do not file | n/a | FOUNDER |
| EAS builds | Candidate builds | Recurring | UNVERIFIED | Stay on Free | Drop optional preview builds first | More than 15 iOS builds in a month, or a queue blocking a candidate (D-092) | FOUNDER |
| Resend allowance (phase 2) | Lifecycle email | Recurring | Free allowance is 100 a day (UNVERIFIED) | Email stays dark | Switch off | Lifecycle sends halt above 70 a day | FOUNDER |
| Route A entitlement (phase 3) | Apple's suggestions picker | Unknown | No cost known, UNVERIFIED; no spend implied | Route A does not ship | n/a | n/a | FOUNDER |
| Agent run spend | Agent runs | Recurring | D-127: none authorised | n/a | n/a | n/a | FOUNDER |
| Any paid place, map or geocoding service | Venue names | Recurring | None authorised | City names only | n/a | Needs its own G8-style read-out and a founder decision | FOUNDER |
| Variant B or any server holding pictures | Cross-device pictures | Recurring | Per-family run cost target about 0.02 to 0.10 dollars a month (ARCHITECTURE section 7) would change | Not specified here | n/a | Needs a CFO sizing note first | FOUNDER |

Effort (R264; [A] agent-days, planning figure only, UNVERIFIED arithmetic from the reconciliation pack): Route B alone 28 to 34 (as quoted by engineering); the pack's pieces together 39 to 49, or about 20 to 74 with a plus or minus 50 percent band. Places, holidays, teaching verbs, the viewer and thumbnails are unpriced: no estimate yet, `mobile` to estimate after G1a.

### 21.3 Counsel question map (R238; packet 1.8.0 section for Moments; counsel's answers are the only closing of G2, G8 and G9)

| Q | Question in short | Blocks | Default if counsel is silent (what we do, not a legal view) |
|---|---|---|---|
| 1 | Label and consent for a build that reads dates and coordinates on the phone with servers on; the purpose string; a phone-only primer record | G2 | Part stays dark; label and policy not changed |
| 2 | Picture-timed reminders under 4.5.4 and 5.1.2(vi), both readings | G2 | F4 off |
| 3 | Naming a city from picture location on the phone; the in-memory home place as a profile | G2, G3 | Place lines off, date-only cards |
| 4 | DPLA 3.3.3(F) and location in a library picture; readable under Limited | G2, G3 | Date-only cards |
| 5 | Trademark attorney: Moments as a tab label in classes 9, 42, 45; screenshots; fallback label | O-28, R194 | Fallback label in screenshots, in-app label per founder |
| 6 | Terms clauses on other people's children, approximate labels, no scanning; knowledge duty | G2 | Terms 4.2.0 not published; library read waits |
| 7 | Deletion promise versus a picture copy in an iPhone backup | G2 | Exclude the folder from backup, with a carve-out sentence |
| 8 | Policy mechanics: material change, Significant Change API, CalOPPA, absolute sentences | G2 | Say what we receive, never where it lives (H-11) |
| 9 | Publisher and liability: individual publisher under 5.1.1(ix); entity; cover; public address | G10 | Founder starts an entity in parallel |
| 10 | Place data and geocoder: dataset licence for a paid app; later P-B caching and the one-request rule | G11b | No places; P-B not built |

Queued behind these and not on the first-release path: CAN-SPAM classification of the parent-created reminder email (CQ-17), Route A and the marketing-text condition of H-3, and K-SUG with 5.1.2(vi). Privacy Policy 3.0.0 line 21 and the label currently describe a build that does not exist; the founder corrects the build list before any servers-on store build links the policy (R266). Absolute never-leaves sentences already in drafts are banned by H-11.

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R175 | Given a build for store submission, Then the compliance checks of X4 are filed: US storefront only, no Kids Category, no under-18 use, no ATT need because nothing is shared across apps, CCPA and CalOPPA statements true (nothing from the library is held), EU and UK treatment decided before any such storefront, state developer-duty dates re-checked by `regulatory-affairs`, provisional notification authorisation not used at first launch, and no required permission. Review (EX-CCO-10): dated duties carry an owner and a re-read date (R244) | R | P0 (b) | 1 | MT-X4-R11, MT-X4-R32..R40, MT-X4-R60, MT-X4-R44, MT-X4-R46, EX-CCO-10 |
| NS-53-R176 | Given the tab shows the parent's own children's pictures, Then no real family appears in any fixture, store frame, doc or test, the screenshots are never copied, and `no-real-family-data.test.ts` stays green | L0, L1 | P0 (a) | 1 | MT-P1-R24, MT-P2-R40, MT-P4-R44, MT-T3-R39 |

## 22. Risks

| Id | Risk | Likelihood and impact (judgment, no data) | Mitigation | Owner |
|---|---|---|---|---|
| RK-1 | Counsel rules the picture-timed reminder or the label unsafe | Medium, high | Ship phase 1 without the library-timed reminder (F4 off); the label per type; Notes for Review | counsel, `privacy` |
| RK-2 | App Review rejects the usage string or says the out-of-process picker suffices (5.1.1(iii)) | Medium, high | Notes for Review explain Recent and places need dates and locations the picker cannot give; the tab works with access refused; F2 can be turned off in a point release | `product`, `mobile` |
| RK-3 | A place label is wrong or painful (a hospital, a home left, a place of loss) | Medium, high | City-level offline table only; Not this place; Hide this place; never in a notification, email or widget; the five-parent read | `product`, `design-systems` |
| RK-4 | Parents feel watched by places and occasions | Medium, high | The firewall F1 to F8, plain labels, the "I did not expect it to know" halt (MT-P6-R54), the card sort | `user-research` |
| RK-5 | The offline place table is too large, unlicensed or inaccurate | Medium, medium | G1 measures size and accuracy; dataset licence read before use (UNVERIFIED); fall back to date-only cards | `mobile` |
| RK-6 | A 20,000 picture library is slow on an iPhone SE 3 | Medium, medium | Date-window scans only; no launch work; G1 numbers | `mobile` |
| RK-7 | Moments does not bring parents back daily (a hypothesis) | High, medium | One honest card every day; E2 and E4; no streak escape hatch; the tab still serves the letter job | `product` |
| RK-8 | A machine word reaches a parent's letter | Low, critical | Firewall F4 and F5 tests; the type has no free-text field; constitution break stops the feature | `core` |
| RK-9 | Server features are on in production while docs say store builds are server-free | Certain (FACT-CHECK), medium | Write every privacy statement for the production profile; flag stale `privacy-policy.md` line 21 and `capabilities.ts` lines 7 to 12 to `legal` | `legal`, `mobile` |
| RK-10 | A stored picture copy sits in iPhone backup | Certain once the flag is on (FACT-CHECK), medium | The policy line before the flag goes on; consider excluding the media folder (a separate decision) | `legal`, `data-architect` |
| RK-11 | The trademark for "Moments" is not cleared | Medium, medium | In-app only; none in store metadata, website or listing until counsel clears it (X1 Q-X1-12, D6) | counsel |
| RK-12 | The Build 13 freeze or store date slips because of the library read | Medium, high | Gates are release gates, so coding proceeds in parallel; the flag-off fallback ships the tab on its no-library content; the harness assigns engineers after freeze | `product` |
| RK-13 | Route A entitlement is not granted or reviewed | Medium, low | Route A is an optional later door, not on the first release path | `mobile` |

## 22a. Further requirements carried from the lead documents

These rows complete the motion, transition, layout and permission detail that the sections above summarise. Each is one behaviour.

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R177 | Given the For you and Recent switch, a refresh, a permission change and a wait, Then the switch and refresh are quiet cross-fades that change only what changed in place, tapping the active tab again scrolls to top on our own control, the platform refresh control is used and never stretched, every pull has a button alternative, permission changes are calm, waiting is shown without effects, and card to capture is the platform's move | L2, L5 | P1 | 1 | MT-A1-R10..R13, MT-A2-R19..R22, MT-T4-R11, MT-T1-R11 |
| NS-53-R178 | Given the permission changes mid-session or a grant, Then focus lands in a named place after the grant or the answer, Reduce Motion, Reduce Transparency, Increase Contrast and Bold Text keep the tab whole, a loop never outlives its screen, and frames are fixed so nothing shifts | L2, L4 | P1 | 1 | MT-A2-R29, MT-A3-R15, MT-A3-R21, MT-A3-R22, MT-A5-R11, MT-A5-R16 |
| NS-53-R179 | Given capture begun from a card, Then the words are in place before the parent needs them, nothing is carried the parent did not choose, while recording the photo is still company, several photos or a video are a quiet static set, in Write the photo makes room and never covers words, if the photo cannot be shown the letter still works, Keep is the one existing celebration, and there are no gaps and no nagging | L2, L5 | P1 | 1 | MT-A4-R6, MT-A4-R7, MT-A4-R15..R19 |
| NS-53-R180 | Given the tab bar and pushed pages, Then the bar hides only where a reading page covers it and never on Moments, pushed pages are the platform's, the founder-owned choices of 14.2 (no dot, no flight) hold, the doorway from Moments to capture is RV-02 (option B of Moments to Home to start a letter is not chosen), and the bar passes the type and colour gate with VoiceOver order stable across a switch | L2, L3, L4 | P1 | 1 | MT-T1-R6, MT-T1-R12, MT-T1-R13, MT-T1-R14, MT-T1-R19, MT-T1-R39, MT-T1-R40 |
| NS-53-R181 | Given granting, limiting or denying, Then the screen changes in place; the reversals the transition lead depends on are those of section 3.2; email and push share one "same signal" without sharing data; Reduce Transparency and Increase Contrast variants exist in the one table | L2 | P1 | 1 | MT-T1-R26, MT-T1-R28, MT-T1-R36, MT-T1-R38 |
| NS-53-R182 | Given the permission flow, Then one state function reads access, the primer's door lines follow the PRIV-R21 shape, Allow all and Select Photos reach the same first feed, Don't Allow lands on a useful tab, and nothing leaves the phone in any transition | L0, L2 | P0 (b) | 1 | MT-T2-R1, MT-T2-R4, MT-T2-R7, MT-T2-R8, MT-T2-R31, MT-D2-R15, MT-D2-R18, MT-D2-R19 |
| NS-53-R183 | Given Listen opened from a moment and the parent taps "Type instead", Then Listen replaces itself with Write as it does today; given the picker's rise, Then it is the platform's modal rise and follows the reduced transition under Reduce Motion; and the picker's first frame renders from local state with no awaited network or model | L2, L5 | P1 | 1 | MT-T3-R5, MT-T3-R35, MT-T3-R36, MT-T3-R38 |
| NS-53-R184 | Given an email link opened in a browser (the app not installed), Then it shows a plain web page that states what the email was and offers the app, never a dead end | L2 | P2 | 2 | MT-T5-R22 |
| NS-53-R185 | Given the layout system, Then the switch component, the For you order (design view; product owns the rule), Recent and the value state follow D1, and Smart Invert never inverts a photo | L2, L3 | P1 | 1 | MT-D1-R4, MT-D1-R5, MT-D1-R6, MT-D1-R7, MT-D4-R12 |
| NS-53-R186 | Given a day card, Then its anatomy is fixed (date, optional label, photos, optional "A letter is here" row, one action), Recent is grouped by day under months newest first, and no number shows except a date, clock time, duration or year | L0, L2 | P1 | 1 | MT-D3-R1, MT-D3-R10 |
| NS-53-R187 | Given a Moments string scan, Then no "allow", "access" or "settings" appears outside the denied line, the restricted line and the Me row, a "Pick one photo instead" action always opens Apple's picker (no usage string needed), M3 (nothing real) shows one calm line and the picker, and M2 shows at most one screen of days with a told or skipped day absent without a message | L0, L2 | P0 (a) | 1 | MT-P1-R10, MT-P1-R11, MT-P1-R14, MT-P2-R19, MT-P2-R20, MT-P2-R18 |
| NS-53-R188 | Given the Moments module, Then the email job reads only the parent-chosen dates, kept letters' dates (for suppression) and the 111 prompts, and never the child's date of birth (R197) and a test fails if any library or typed-day source is imported; an email from the moment signal is a commercial class with a separate opt-in off by default built only from `serverSafe` sources | L1, L0 | P0 (a) | 2 | MT-P3-R29, MT-P2-R33, MT-P4-R39, MT-P4-R40 |
| NS-53-R189 | Given each of the eleven states of the tab, Then the content table renders and a screenshot test per state passes on iPhone SE 3 at AX5 with Bold Text; content stays on paper, glass appears only on the bar and controls (at most three surfaces), and each state works under every Settings combination | L3, L5 | P0 (a) | 1 | MT-P3-R18, MT-P3-R22, MT-P3-R19, MT-P3-R20 |
| NS-53-R190 | Given a day with a very large number of pictures, Then the tiles, busy rule and card are the same as for a small day, the detail view pages, and no count is spoken or shown; given the reserved row id P6-R13, no behaviour is required | L0, L5 | P1 | 1 | MT-P6-R22 |
| NS-53-R191 | Given the Home pointer, the tab's Me list and the in-app cards, Then every in-app card echoes the same signal as the push and email from its own source, the card cannot show a library-derived fact that a server channel carries, and the lock screen of a Moments push never differs from an ordinary one | L0 | P0 (a) | 1 | MT-X2-R25, MT-X5-R17, MT-P5-R21 |

## 22b. Rows added by the executive review (round 1)

These rows continue the numbering from R191. Each names the review findings it carries in Satisfies (section 27 is the disposition table). A row marked phase 2 is not in the first release.

| Id | Given / When / Then | Layer | Pri | Phase | Satisfies |
|---|---|---|---|---|---|
| NS-53-R192 | Given the primer, the purpose string, the Me row and the Notes for Review, Then each names the date, the time and where a picture was taken, and says it is read on this phone and only while the tab is open (when and where); none says the app does not look at what is in the pictures unless counsel has cleared that sentence in writing; the four strings come from one content key set and a content test fails if the place source is on and a key lacks the place word; no string says "we ask once" or "never ask again"; and the Decline line says turning this off does not remove pictures already in letters | L0, L1 | P0 (a) | 1 | EX-CMO-1, EX-CMO-13, EX-CLO-4, EX-PRV-1, EX-PRV-10, EX-CCO-5 |
| NS-53-R193 | Given the production build with the library flag on, When a store field, site page, in-app string, Notes for Review or email says "on your phone", "no account", "keeps everything on the phone" or "private", Then it is re-proved against that profile and either rewritten or backed by a named code check before submission; the first listing (description, subtitle, screenshots) is true with the library flag on and off, and any line about days from pictures lives only in the promotional text; each claim in 8.5, 13 and 16 is a row in the claims inventory (words, surfaces, decision of record, proving test, profiles where false, verdict) before it is written into a screen, and a claim with no proving test is not shipped; absolute "never leaves" sentences are replaced by what we receive (H-11); "never adds a word" never appears without "letter" or "your words" in the same sentence | L0, R | P0 (b) | 1 | EX-CMO-2, EX-CMO-7, EX-CMO-8, EX-CMO-9, EX-CLO-1, EX-CLO-12, EX-PRV-8 |
| NS-53-R194 | Given store screenshots and previews, Then they are captured from screens that hide the tab bar (Listen, Review, Keep, the letter page, the day sheet) or with the bar masked, and a frame check in the store lane fails any frame whose accessibility tree names the tab; the founder decides before the screenshot freeze whether instead to wait for trademark clearance (O-28), and a dated decision is recorded; the in-app label comes from one key with a named fallback (R8) | L1, R | P0 (b) | 1 | EX-CMO-3, EX-CMO-10, EX-CLO-9, EX-CBO-9 |
| NS-53-R195 | Given a place line, When it first appears on a card, Then the card menu carries a "Where this came from" line from a closed content key (a place read from the picture's own location on this phone), the place line is itself a 44 pt target that opens a two-choice sheet ("Hide this place", "Name this day"), and G4 asks the five parents about a stay away from home and about a year-ago card; if any parent says they did not expect it to know, the place line ships off in that build and the fix is copy or design first | L2, L4, R | P0 (a) | 1 | EX-CMO-4, EX-DES-10, EX-PRV-5 |
| NS-53-R196 | Given any push, email, widget or badge string, Then a content test fails it if it contains the word picture, photo, place, day, weekend or the name of the tab, and a library-timed note (phase 2) uses an existing evening-class key word for word | L0 | P0 (a) | 1 | EX-CMO-5, EX-CCO-7 |
| NS-53-R197 | Given the lifecycle email, Then its only source is a parent-chosen date (never the child's date of birth, R188), its subject states in plain words the reason the parent set it up and carries no child name, age or month number, it is one message per chosen date and never on a date with a budgeted push or when a letter was made, each template has a class field (commercial or transactional) chosen with counsel, a hashed address stays on a suppression list after deletion, the abuse and unsubscribe controls are rows in the email spec, the body fails the content test on any price, trial, Plus, allowance, discount or print word, the processor is named in `docs/legal/subprocessors.md` before any send, the postal address is a founder decision (O-45), and the job halts above 70 sends a day | L0, L1, R | P0 (b) | 2 | EX-CMO-6, EX-CCO-8, EX-SEC-9, EX-PRV-11, EX-CFO-7, EX-CBO-7, EX-CLO-18 |
| NS-53-R198 | Given the Home pointer to Moments, Then its words use no "new", "discover" or "introducing", one verb, a plain statement of what the tab holds, it is never shown to a parent who has already opened the tab, and it does not return after a tap or dismissal | L0 | P1 | 1 | EX-CMO-12 |
| NS-53-R199 | Given a year-ago card, When the parent taps "Not this one", Then that date is removed for all years (golden), and a year-ago card is included in the G4 feel-watched question | L0, L5 | P1 | 1 | EX-CMO-16 |
| NS-53-R200 | Given any study or card sort with a parent's own library, Then it is run on the parent's own phone held by the parent, with no screen recording, screenshot or photograph of the screen, the consent sheet says what is read and shown, the read-out holds only x of n and the failing card kind (no place, date, count or album), a distress answer stops the session, a finding leaves the study only through the CMO with consent and never as a testimonial, and the fixture coordinates of `asha-lib-v1` sit on a place no real family uses | L5 | P0 (a) | 1 | EX-CMO-15, EX-PRV-12, EX-CDO-18 |
| NS-53-R201 | Given the card model, Then it has two disjoint fields, `machineLines` (closed kinds: reason, place, holiday) and `parentLabel` (a string the parent typed), they render in different slots with different type tokens (the parent's words in the letter face used nowhere else on the card; machine lines in the smaller interface face), a type-level test fails any assignment of one to the other, no component renders both in one slot, and a `MachineLabel` type is not reachable from the capture save path or the letter edit path | L0, L1 | P0 (a) | 1 | EX-AI-1, EX-DES-19, EX-AI-10 |
| NS-53-R202 | Given a machine label (place, holiday, reason), Then it is a pure function of metadata as H-10 states, kill switch K5 `machineLabels` (signed config, narrowing only, never switching a flag on) hides every place and holiday line and falls back to plain dates, and an import-graph test uses an allow list: `packages/core/src/moments` and `scribe-library` may import only named modules and any other native, ML or edit-engine import fails the build | L0, L1 | P0 (a) | 1 | EX-AI-3, EX-AI-9, EX-AI-10 |
| NS-53-R203 | Given the phase table and the closed reason list, Then K-SUG has no row in phase 3, RSN-SUGGEST is absent from the enum in the release profile (a build test), a Route A group shown as a card takes the plain reason "Pictures you picked" and no Apple label and has the same type as a parent pick, and O-32 is asked in the reframed words of 7a.4 | L0 | P0 (a) | 1 | EX-AI-2, EX-AI-6, EX-AI-12, EX-CPO-9, EX-CPO-14 |
| NS-53-R204 | Given the place resolver, Then the pass bars are written before G1a runs: abstain over guess, zero wrong-country on a hand-labelled sample of at least 100 geotagged pictures from the founder's own phone, a wrong-city ceiling the founder sets, a place is shown only if the nearest entry is within the radius and the second nearest is farther by a margin and the majority share is above a threshold (all data in `rules.ts`) and the coordinate is valid and not a placeholder, no place near a table boundary, no place on a day with fewer than a floor of pictures at it; goldens cover (0,0) as none, the antimeridian, a boundary tie and a two-place day; the sample and the labels stay on the phone and only counts leave the harness | L0, L5 | P0 (a) | 1 | EX-AI-4, EX-CDO-11, EX-DES-10, EX-PRV-5 |
| NS-53-R205 | Given grouping and reasons, Then a local-only real-library harness in the `experiments/` style runs `core/moments` on the founder's phone and prints only counts (days qualifying, days per week, the share marked junk, wrong-reason count which must be 0) and writes no image, date or place to disk; the bars are written before the run; `MOMENTS_RULES_VERSION` is bumped with any threshold change; and reasons are table-driven with one predicate each and a property test that the shown reason's predicate is true and no higher-precedence predicate is true | L0, L5 | P0 (a) | 1 | EX-AI-5, EX-AI-6 |
| NS-53-R206 | Given the place and holiday tables, Then they are built by a script that normalises text and fails on a banned character or a fear or loss word, a display-language rule is fixed, `rules.test.ts` scans the generated table, a place name ships only in languages the app is released in (or is suppressed in a language without it, with a native-script reviewer before the Hindi pack unlocks), a holiday shows only when its switch is on by default for the region, and the holiday table carries a source, a covered year range and a runtime rule that shows nothing, not a wrong date, beyond it | L0, L1 | P1 | 1 | EX-AI-8, EX-DES-21, EX-CDO-13, EX-ENG-21 |
| NS-53-R207 | Given a year-ago letter, Then the fragment is cut at a sentence end only, and if the first sentence exceeds the length design sets the card shows the date and "A letter from this day" with no fragment and opens the letter (golden: a first sentence with a negation and over the limit shows no fragment) | L0 | P0 (a) | 1 | EX-AI-11 |
| NS-53-R208 | Given any card, Then no text sits over a photo except (a) one duration mark on a video tile and (b) the selection check on a day-sheet tile, each on a solid scrim of the pill token, 24 pt minimum, fixed size, never scaled with Dynamic Type, with the duration also given as text under the tile from AX1; no word, place, date or reason line is ever drawn over a picture | L1, L3 | P0 (c) | 1 | EX-DES-1, EX-DES-17 |
| NS-53-R209 | Given the value view, Then examples appear only in ACC-0, ACC-1 and the flag-off state, never in ACC-2 to ACC-5; a "real card" for this rule is a library day, a marked or ticked day, a birthday or month day or a year-ago card (the question card does not count); the first open shows one example only, after the heading and job line, the real For you cards and the ask card, and it opens in place; the Asha example fixtures are rows of R107; two against three examples is tested in the E1 order swap; Not now and Continue stay equal in weight and size | L2, L5 | P0 (c) | 1 | EX-DES-2, EX-DES-9 |
| NS-53-R210 | Given Recent, Then it shows the newest 14 qualifying days (ASSUMED, tuned in the card sort) as cards under month headings, then one quiet "Earlier" row that opens a plain month list with no counts, each month showing the same cards; the finite list then a door is a design decision, not a performance number; `BUSY_DAY` is raised for the card sort | L0, L3 | P1 | 1 | EX-DES-4, EX-DES-11 |
| NS-53-R211 | Given Dynamic Type at AX1 or above (AX5 is about 3.571 times the base size, not the 2.4 times of the prototype), Then the card collapses to one lead tile at full width, the reason line and date stay, the place line wraps, the More button and the letter row move into the one card menu, the card is a single target, the For you and Recent switch never stacks, and the ask card is never more than one card from the top | L3, L4 | P0 (c) | 1 | EX-DES-5, EX-DES-8, EX-DES-17 |
| NS-53-R212 | Given a card, Then the whole card opens the day sheet and is one target, filled buttons appear only on the ask card, the primer and the day sheet's start control, and the card menu holds four verbs: "Not this one" (this day never again, undoable, absorbing "Hide this day"), "Hide this place" (one verb, one effect, absorbing "Not this place"), "Name this day" and, inside the day sheet only, "Leave out this picture" (R255); "Not today" is cut as a separate verb (tomorrow's card returns anyway). This is a recommendation to the founder at O-39 and a design default, not a decision | L2, L4 | P0 (c) | 1 | EX-DES-6, EX-DES-7, EX-CPO-3 |
| NS-53-R213 | Given days not ready within 1 s (ASSUMED, tuned at G1a), Then the ask card is replaced in place by one plain static line from `content` (pictures are being read on this phone; no spinner, no count, no "found") that VoiceOver speaks once and that disappears when the first day arrives | L2, L4 | P1 | 1 | EX-DES-12 |
| NS-53-R214 | Given a card, Then its VoiceOver name is the reason line, the date, the place line when shown, the parent's own label and the action in one phrase, the collage has no machine description of pictures, "no place" in R154 applies to the collage's own label only, and the G5 walk and the "Hide this place" custom action include the place line | L4 | P0 (c) | 1 | EX-DES-13 |
| NS-53-R215 | Given the fourth tab, Then it sits on today's paper bar, `tabLabel` is a token, the Large Content Viewer works on it, and a later swap of the bar applies to all four tabs and re-runs the R3 checks | L3, L4 | P1 | 1 | EX-DES-14 |
| NS-53-R216 | Given the D7 prototype, Then it is corrected to match this file before it is used as a reference: the first three blocks animate once per install (not six), after Keep the parent lands on the Book and the source day leaves For you for the session (a later Recent card for it reads "A letter is here" with the read action), `heroEnter` and `momentCarry` are dropped, and `glassFallback`, `highlight` and the pill alpha enter `tokens.ts` through the normal route with the brand-parity test | L3 | P1 | 1 | EX-DES-15, EX-DES-16, EX-DES-18 |
| NS-53-R217 | Given the layout, Then no glass is used on Moments cards, the bar or the ask; at most the day sheet's close control and start footer over the photo grid use it; the solid fallback is designed and baselined first and glass is the enhancement; the three-surface ceiling is a lint | L1, L3 | P1 | 1 | EX-DES-17 |
| NS-53-R218 | Given the primer, Then it shows the one sentence and equal Continue and Not now, and the four door lines sit behind one "What this does" disclosure on the same sheet, collapsed by default, expanded at the parent's tap and always present in the accessibility tree; counsel (G2) confirms a disclosure satisfies the door-lines requirement before it ships | L2, L4, R | P0 (b) | 1 | EX-DES-20 |
| NS-53-R219 | Given G4 and the founder's reference, Then the place lines in the prototype are redrawn at city level with at least one card at home with no place line, one trip card ("Lisbon, 24 to 26 October") and one parent-typed place label shown as the parent's own words, and G4 must not run on the current venue-level prototype | L5 | P0 (a) | 1 | EX-DES-3, EX-DES-10 |
| NS-53-R220 | Given the native contract, Then `scribe-library` exposes exactly these functions and no others: access status, request access, fetch window (ids, creation date, UTC offset in seconds, type, subtype flags, a place id or coarse cell, never a coordinate), thumbnail through the native view `ScribeLibraryThumbnail` (an Expo module view taking `localId` and `px`, doing request, cancel on unmount and its own byte-capped LRU, decorative for accessibility because the card carries the label, replacing any third-party image allowance), full image and player item or poster for the day sheet, and cancel; the copy-and-strip path for attach stays in `scribe-photo` so the one stripper stays one stripper; attach may let the system download an iCloud original and that is stated in the privacy line, so "the library is never fetched from the network" (R118) reads "never by us"; the module follows the `expo-native-module` skill with its source scan and the iOS compile job | L0, L1, L2 | P0 (a) | 1 | EX-ENG-1, EX-ENG-2, EX-ENG-20 |
| NS-53-R221 | Given `moments.json` (17.1), Then it has `{v, owner, dayKeys[], labels{}, hiddenPlaces[], ...}`, a day key is a local ISO date string with no zone and "Not this one" applies to the date the parent saw, unknown fields are preserved, a higher `v` than the app knows reads as empty and writes nothing, a write is a temp file and a rename, a corrupt file is deleted and the tab starts clean with no message, the owner is an opaque local id and never a person id, and tests cover each rule | L0, L2 | P0 (a) | 1 | EX-ENG-3, EX-SEC-5, EX-CDO-17 |
| NS-53-R222 | Given any build, Then `scribe-library` is linked in every profile and is dead code when F2 is off; the profile control is (a) the photo usage string set by a config plugin in `app.config.ts` only for allow-listed profiles and (b) an L1 test that no call site of `scribe-library` is reachable unless the F2 constant is true; the scan checks the plist key and the call-site reachability, not "PhotoKit symbols"; a guard script in `scripts/guards` (the pattern of `pr-size.mjs`) fails the production profile when F2 is on and `docs/release/<x.y.z>.md` lacks a dated line, with a commit, for each of G1b to G7, G10 and G11; the kill-switch source is confirmed by `mobile` before PR 11 or R170 becomes its own PR | L1 | P0 (b) | 1 | EX-ENG-4, EX-ENG-14, EX-SEC-2 |
| NS-53-R223 | Given the fetch, Then it returns the UTC offset in seconds per asset from the system calendar for that asset's date (so the card date equals the Photos app's date by construction), the engine takes `offsetAt` as a parameter, and a test crosses a clock-change day; "no Intl in core" is scoped to `moments/` | L0 | P0 (c) | 1 | EX-ENG-9 |
| NS-53-R224 | Given the performance rows, Then TDD 06 gains the budget rows (tab idle memory delta, LRU ceiling in bytes, day sheet page size, `fetchLimit` hard cap, a memory-warning handler test at L2) read from `rules.ts` with numbers set by G1a; "Home's first frame is delayed by 0 ms" is replaced by "no `scribe-library` call before first Moments focus and a startup marker delta within the existing budget"; timing rows ("under 1 s", "one calm move") are asserted at L5 or by Maestro with a wide margin while the logic stays at L0 | L0, L2, L5 | P1 | 1 | EX-ENG-10, EX-ENG-15, EX-ENG-16 |
| NS-53-R225 | Given the test plan, Then an N layer exists: a generated Asha library script (synthetic pictures, R107) loaded by `simctl addmedia` into a simulator and driven by Maestro through `fixtureSource` for UI and through the real module for read tests; L5 keeps only what a simulator cannot do (Limited picker, iCloud-only, thermal, 120 Hz, real notification timing); the L3 matrix is pruned to the states that differ (value view, ask card, limited, denied, Recent, day sheet) rather than eleven states by every theme and size; `asha-lib-v1` lives in `packages/core/test/golden/` and regenerating it needs a founder-visible diff | L0, L2 | P1 | 1 | EX-ENG-12, EX-ENG-19, EX-ENG-18 |
| NS-53-R226 | Given the source scans, Then one scan script has a path scope (`modules/scribe-library`, `src/lib/moments`, `packages/core/src/moments`), an allow list of `PHAsset` members read from one constant that the Swift file and the TS type both import by name in a test, an import-graph test for `core/moments` (no `react-native`, no `expo-*`, no `fs`), and a source scan for `os_log`, `NSLog`, `print` and `Logger` calls that interpolate any asset property, with every PhotoKit error mapped to the closed code and its user info discarded; `privacy` owns the allow list text and `qa` the script; the privacy manifest entry and the matching collected-data answer are in the build that sets F2 on | L1 | P0 (a) | 1 | EX-ENG-13, EX-PRV-13, EX-SEC-7 |
| NS-53-R227 | Given a Moments start, Then one PR owned by `design-systems` with `analytics` adds the third list (`MOMENT_SOURCES = ['moment']`), updates `tab-jobs.ts` and N1 to N6 and settles analytics as O-38 does; `moment` is dropped from R167's property list unless the founder signs O-38 | L0 | P0 (c) | 1 | EX-ENG-11, EX-CCO-11, EX-CDO-2 |
| NS-53-R228 | Given the place read, Then the table lookup runs in Swift inside `scribe-library` (the table bundled in the binary, not a pack) and returns a place id or a coarse cell per asset, coordinates never enter JavaScript memory, the Swift function has a TypeScript reference behind `fixtureSource` for goldens and a test proves they agree on the table, `core/moments/place.ts` takes the table as an argument (pure, tested with a 10 row synthetic table), a grid index built at generation time makes lookup O(1) per picture, and at most a stated, fixed number of pictures per day are sampled so the golden is deterministic | L0, L1, L5 | P0 (a) | 1 | EX-SEC-4, EX-PRV-3, EX-CDO-16, EX-ENG-8 |
| NS-53-R229 | Given the place table, Then it has a version, a checksum verified at load (a mismatch fails closed to no place), stable external ids from a public gazetteer (not row indexes) that keys store, a migration test that fails if an update drops an id any key references without a mapping, a source, a licence read from the publisher's own page by licensed counsel (permitted use in a shipped app, attribution wording and where it shows, redistribution, update terms, share-alike duty) before any dataset is adopted, an attribution screen if owed, and a ledger entry in `docs/security/PLACE_TABLE.md`; a dataset whose licence is not read in writing is not shipped and the first release ships dates without places | L0, L1, R | P0 (b) | 1 | EX-SEC-3, EX-CLO-7, EX-CBO-5, EX-CFO-3, EX-CDO-10, EX-CDO-13 |
| NS-53-R230 | Given the dependency list, Then every library the native module and the day sheet use is named in the PRD (17.1 and 19.4), reviewed against `NATIVE_MODULE_GATE.md` items 1 to 3 with a lockfile and prebuild diff, and the two rows that forbid new dependencies are amended to allow exactly those; a holiday library is not added (R206 is a pure function) | L1 | P0 (b) | 1 | EX-SEC-1, EX-ENG-21 |
| NS-53-R231 | Given the F2 allow list and its test, Then a PR that edits both together fails unless it carries the founder's recorded decision id, and a code-owner review by `privacy` and `security-architect` at the head commit is required on the allow list file (sessions are the founder, so the human check is the founder's recorded entry plus the guard of R222) | L1 | P0 (b) | 1 | EX-SEC-2 |
| NS-53-R232 | Given a borrowed or shared unlocked phone, Then Moments follows App lock exactly as the Book does (no thumbnails, dates, places or reasons render until the gate passes, including on return from background, with the scripted snapshot check as a G7 row), a one-tap "Hide places" local switch on the tab, also in Me, turns every place line and theme into plain dates without losing data (a viewer control, off by default, not "Hide this place"), the hidden-place list in Me sits behind App lock, and the primer says in plain words that anyone who opens the unlocked phone can see these days and where App lock is | L2, L5 | P0 (a) | 1 | EX-SEC-6 |
| NS-53-R233 | Given the permission API grants write access we do not use, Then a source scan for `scribe-library` and `scribe-photo` fails on any change-request, `performChanges`, delete or create call (allow-listed file by file), no photo-add usage string exists, and the Notes for Review say the permission can change pictures and our code does not; "read-only" stays out of in-app strings | L1 | P0 (b) | 1 | EX-SEC-7 |
| NS-53-R234 | Given the lock screen, Then a Moments-class note carries no child name and no age or month number on any setting, the evening class keeps its existing rule, and the T5-R26 table is the test | L0 | P0 (a) | 1 | EX-SEC-8 |
| NS-53-R235 | Given pictures attached to a kept letter, Then the policy and the deletion screen say that a stored copy is part of an iPhone backup (default O-44: disclose, and G11 carries device row D-3 that proves what a restore does); the alternative, excluding the picture-copy folder from backup as `moments.json` is excluded, is the founder's call at O-44 and the CLO prefers it because it makes the promise true | L5, R | P0 (b) | 1 | EX-SEC-10, EX-CLO-11, EX-PRV-8 |
| NS-53-R236 | Given the release profile, Then the Apple geocoder adapter is not compiled in (a build-time exclusion, not a runtime flag), the binary scan lists `CLGeocoder`, `MKLocalSearch` and `MKReverseGeocodingRequest` as forbidden symbols in profiles where F3 is off, no third-party or paid place, map or geocoding service is assumed or authorised (adding one is a founder money decision with its own G8-style read-out), and enabling F3 later requires a new label answer for Precise Location, a policy change in the same build and a refreshed Notes for Review | L1, R | P0 (b) | 1 | EX-SEC-11, EX-PRV-4, EX-CLO-8, EX-CCO-13, EX-AI-9, EX-CFO-10 |
| NS-53-R237 | Given the media threat model, Then rows M10 onward are added for the library read (A3, A8), the place resolver (A8, and the table), the decisions file (A3, A4), nudges (A3, lock screen), the day sheet (A9) and the borrowed phone (A1, A3), each with a control and a test | L1 | P1 | 1 | EX-SEC-12, EX-SEC-6 |
| NS-53-R238 | Given the counsel packet 1.8.0, Then a Moments section lists the questions of 21.3 with the rule, its source and the date read, our reading, options and a default, each PRD open question maps to a packet question id in one table, and a G2, G8 or G9 read-out is a written answer from licensed counsel with name and date, or that part stays dark; an internal memo, an agent review or an earlier AI memo does not close these gates | R | P0 (b) | 1 | EX-CCO-1, EX-CLO-2, EX-CLO-3, EX-CCO-3 |
| NS-53-R239 | Given the obligations register, Then `legal` adds rows (owner, trigger, control, evidence, status Gap until evidenced) for the library read (5.1.1(iii), (iv), 5.1.2(iii) to (vi)), the location read, label and policy parity, reminder timing, the lifecycle email and the age gate ordering, and CR-083 says the first release includes the library; Moments is uncleared until those rows have evidence, so R8's claim that it is cleared cannot hold | R | P0 (b) | 1 | EX-CCO-2, EX-CLO-9 |
| NS-53-R240 | Given a store submission, Then the privacy label, policy, usage string, Notes for Review and privacy manifest each match the profile submitted (production, with server features on), each with a dated artefact; the Notes for Review sit under `docs/release/` with one table mapping each sentence to its source row and assert no reading of 5.1.2(vi); a reviewer path works with access granted and refused; the primer and purpose-string screenshots per version and the access-refused recording are kept; an SDK inventory from the lockfile and a statement that no SDK receives a library identifier, date, coordinate or place are updated each build | R | P0 (b) | 1 | EX-CCO-3, EX-CCO-4, EX-CCO-12, EX-CLO-16, EX-PRV-8 |
| NS-53-R241 | Given the place read is a new sensitive use, Then the code carries a separate constant `PLACE_READ` (the location member of READ_SET_V1 is read only when it is true), G3 signs the location part separately, the scan of R37 reads two lists, and whether this becomes a separate build flag F2b with its own kill switch is the founder's call at O-39 (recommended: split) | L1 | P0 (b) | 1 | EX-CCO-5, EX-CPO-4 |
| NS-53-R242 | Given App Review 5.1.2(v) and (vi), Then the Notes for Review and G2 quote each verbatim with the date read, both are counsel questions, F4 stays off, the opt-in for a library-timed reminder is the explicit individual initiative (v) mentions and uses no tap, dwell or open history, and no document asserts a reading of (vi) as settled; the reading is UNVERIFIED until counsel answers in writing | R | P0 (b) | 1 | EX-CCO-6, EX-CLO-5 |
| NS-53-R243 | Given the fenced paths (19.5), Then the PRD names each `compliance/FENCE.json` path the build touches with its tier, approvals and ruling id; the default is that the Moments tab and library module touch none, and R119's ordering test lives in a file the fence does not cover | L1 | P0 (b) | 1 | EX-CCO-9 |
| NS-53-R244 | Given age assurance, Then R119 and R165 read "the Moments tab and library module do not read, store or use an age signal; age assurance is owned by the gate code and the register", and R175 lists each dated duty (Texas, Utah and Louisiana per Apple's notes, California AB 1043 from 1 Jan 2027, and the others the register names) with an owner and a re-read date | R | P0 (b) | 1 | EX-CCO-10 |
| NS-53-R245 | Given the decisions store (17.2), Then each field has an expiry rule, a maximum count (ASSUMED, data in `rules.ts`, set by G1a) and the code that prunes it with a test that fails without it: "Not now" keys expire at the next local midnight and are removed at the next focus, day keys older than the library window and not kept are pruned, and a label is kept until the parent removes it | L0 | P0 (a) | 1 | EX-CDO-7 |
| NS-53-R246 | Given revoke, downgrade and turn off, Then three operations are defined: (1) revoke or downgrade in Settings (undoable) drops everything rebuildable (index, place ids, thumbnails) and keeps dismissal keys and hidden-place keys in the file, unread without access; (2) Turn off deletes every field of the file; (3) Erase, sign-out and Delete account delete the file and the home-place value; a new K6 `purgeLibraryData` value (security only) can purge the file at the next launch; R113, R115 and R166 are read as this one rule, and Privacy confirms | L0, L2 | P0 (a) | 1 | EX-CDO-8, EX-SEC-5 |
| NS-53-R247 | Given the first release, Then no picture identifier and no album identifier is stored (O-13 and O-14 default to No), rows R56 and R57 stay in the table default-off behind constants `LEAVE_OUT_ENABLED` and `ALBUMS_ENABLED`, and if the founder signs them the identifier is hashed, capped in count, pruned only under Full access, never a name, with the restore behaviour in the classification row | L0 | P0 (a) | 1 | EX-CDO-9, EX-PRV-6, EX-ENG-6 |
| NS-53-R248 | Given a table update, Then place keys store the stable external id (R229), and a migration test fails if an update drops an id any stored key references without a mapping | L0 | P0 (a) | 1 | EX-CDO-10 |
| NS-53-R249 | Given the home place, Then it is computed in memory, a correction ("This is where we live") is its own row in 17 and in the classification table with the same wipe rules, no export, no backup and one value per book, and the policy and one plain sentence in the primer or Me say that the app works out which place looks like home on the phone | L0, R | P0 (a) | 1 | EX-CDO-12, EX-CLO-15 |
| NS-53-R250 | Given the decisions store, Then rows exist in `DATA_CLASSIFICATION.md` 4.6 (and the data map when it lands) for every field with level, retention, deletion path and deletion test, in the same PR as the code, ADR 0032 is amended or a new ADR is written (the ADR is Proposed), and the typed place labels and picture labels the parent writes here are stated to stay on this phone, in no backup and no export, or are exported as a labelled section (the Privacy Officer and Product decide, default: the plain statement) | R | P0 (a) | 1 | EX-CDO-6, EX-CDO-17 |
| NS-53-R251 | Given section 18, Then it is written against D-163: Moments events follow whichever consent default the founder rules, with the flag off or without the lawful basis for that profile 0 events are sent or queued; the card events carry a `slot` enum (`look_back`, `question`) and none for any card dated by the child, a typed day, a tick or the library; the `code` list keeps only `picker_unavailable`; the performance event carries `ms_bucket` and `is_ok` only (no `device_tier`); elements and screens are registered in `ids.ts`; at most one impression event per slot per local day | L0, L1 | P0 (a) | 1 | EX-CDO-1, EX-CDO-3, EX-CDO-4, EX-CDO-5, EX-PRV-7, EX-CFO-9 |
| NS-53-R252 | Given the daily-return hypothesis, Then section 20 holds an instrument table (metric, definition, denominator, who is missing, minimum n of 20 per group before any percentage), nothing is built to measure it at 1.0 beyond the diary (E4) and App Store Connect cohorts, and no public line states or implies a return rate | L5 | P1 | 1 | EX-CDO-15, EX-CFO-5, EX-CBO-3 |
| NS-53-R253 | Given a book that is quiet, hidden, in a hard stretch or expecting-only, or any visible book on the phone that is, Then Moments renders no library card, no Recent list, no place line, no year-ago picture card and no occasion collage on this phone until the parent changes the state, the picker door ("Add pictures") stays, no analytics, push or log records that the rule fired, and goldens in `asha-lib-v1` cover a quiet book and an expecting-only book with zero library cards (the stricter whole-phone rule stands unless the engine proves no cross-book day appears) | L0, L2 | P0 (a) | 1 | EX-PRV-2 |
| NS-53-R254 | Given a place line, Then place themes (runs of days) appear only in Recent and never in For you, no place line is shown on the child's date of birth or on a day with a birth occasion reason, the table has no neighbourhood or campus entry and a population floor set by G1a, a place seen on fewer than a floor of pictures in a day gives no line, and the hidden-place and home-place correction keys are L4 and wiped on Turn off, Erase and sign-out | L0 | P0 (a) | 1 | EX-PRV-5 |
| NS-53-R255 | Given a tile, Then "Leave out this picture" is reachable from the tile's menu in one tap with Undo, the hidden album and Recently Deleted are never read (the fetch does not set `includeHiddenAssets`; whether the default fetch excludes Recently Deleted is UNVERIFIED and is a G1a line), and a sensitive picture can be removed before it becomes a cover tile | L2, L5 | P1 | 1 | EX-PRV-9 |
| NS-53-R256 | Given withdrawal, Then the Me row and the Decline line say that turning this off does not remove pictures already in letters, and a place label the parent picks as text shows in Review as their own words like any other text | L0 | P0 (a) | 1 | EX-PRV-10 |
| NS-53-R257 | Given the canary test of R162, Then it also covers the attach pipeline, Keep, the outbox, the push mapper and export: a synthetic attached picture and a synthetic place-label letter produce a sync payload containing the words only, with no media row, id, coordinate or place key; the G1 and G7 read-outs hold timings and rates only and fail review if they name a place, date, count or album | L0, L1 | P0 (a) | 1 | EX-PRV-14, EX-CDO-18 |
| NS-53-R258 | Given Moments in any state, Then it imports no plan or entitlement type (a source scan), shows no Plus, price, trial, allowance, lock or count of letters left on any card, ask, nudge or email, and a tap on a card goes through the same `startCapture` so the only gate is Keep, after the words are seen; paywall views per family are added to the E2 guardrail | L0, L1 | P0 (a) | 1 | EX-CBO-1, EX-CPO-8 |
| NS-53-R259 | Given the release record, Then it states the F1 and F2 state per build so install-week cohorts can be split from build numbers, and section 20 says Moments does not change the F14 section 6.9 rules or numbers | P | P1 | 1 | EX-CBO-2 |
| NS-53-R260 | Given any document, store text, post or investor material, Then none states or implies that Moments drives daily or repeat use until a read exists with n stated (the word is "may"), or a count, "smart" behaviour or a comparison to Apple's Journal | L0, R | P0 (b) | 1 | EX-CBO-3, EX-CLO-17, EX-CMO-11, EX-CMO-14 |
| NS-53-R261 | Given the resize target for attached pictures, Then it is the one NS-52 sets for letters generally, chosen to keep a print-quality original, and recorded as data, not a Moments value; a non-goal states no print, gift, keepsake or "make a book from this day" is specified here | L0 | P1 | 1 | EX-CBO-6 |
| NS-53-R262 | Given the gates, Then each of G1b, G2, G3, G5, G7, G10 and G11 has a decide-by date (21.1), the default when one is missing is O-37, the decider is the founder with the CFO's cost and the CPO's calendar, and the choice is recorded before the first read-out | P | P0 (b) | 1 | EX-CBO-4, EX-CPO-1, EX-CFO-4 |
| NS-53-R263 | Given section 21.2, Then every money item is a row marked FOUNDER with default no spend: counsel read, the place dataset licence, entity timing (with G10 and before D-004 on Tue 27 Nov), accountant and insurance, name filing, builds (the D-092 trigger as a number), the Resend allowance, the Route A entitlement (phase 3), and the cost of any later Variant B | R | P0 (b) | 1 | EX-CFO-1, EX-CFO-2, EX-CFO-6, EX-CFO-8, EX-CFO-11, EX-CFO-12, EX-CFO-13, EX-CLO-13 |
| NS-53-R264 | Given the bet, Then section 20 states one measurable and one stop line as numbers before the build (PROPOSED: App Store Connect trial-to-paid and first renewal per install-week cohort, never blended, before and after the tab; the founder sets the numbers at O-46), and the effort range of 21.2 is the planning figure | P | P1 | 1 | EX-CFO-5, EX-CFO-4 |
| NS-53-R265 | Given a notification tap or a link, Then `typedDay`, `birthday` and `monthAge` taps land on Moments, `evening` lands on Home, the single routing table stays, a landing shows phone-held cards only and starts no library scan until the parent's own tab switch, and a tap never opens the microphone, a draft or Settings | L2 | P0 (c) | 1 | EX-CPO-7, EX-CPO-12 |
| NS-53-R266 | Given the legal set, Then the founder corrects the build list before any servers-on store build links the policy (a precondition of G2), and `legal` drafts Privacy Policy 3.1.0, Terms 4.2.0 (the parent confirms they may use the pictures they add, including pictures of other people and their children; dates and place names are computed, not the parent's words), in-app disclosures 3.5.0 and label 2.3.0; Privacy Policy 3.0.0 line 21 and the label contradictions are listed in 21.3; the entity and the individual-publisher question are settled with Moments in the decision (O-47) | R | P0 (b) | 1 | EX-CLO-1, EX-CLO-10, EX-CLO-13, EX-CLO-18 |
| NS-53-R267 | Given the OPEN rows O-09, O-11, O-12, O-13, O-14, O-16, O-34 and O-35, Then the engine takes each as a `RULES` field or feature constant (`RECENT_TIERS`, `LEAVE_OUT_ENABLED`, `ALBUMS_ENABLED`, `PLACE_ON_EVERY_CARD`) so a reversal is a one-file change plus golden regeneration, and goldens that depend on an OPEN row are tagged and live in their own file | L0 | P1 | 1 | EX-ENG-6 |
| NS-53-R268 | Given the phase column, Then the header states the first-release row count by phase (counted from the table), rows not in the first release are R62, R67, R82, R94, R132 to R135, R140 to R143, R184, R188 and R197, and a reader counting for the first release excludes them | P | P1 | 1 | EX-ENG-17, EX-CPO-5 |

## 23. Open founder questions

Closed by founder rulings of 21 Nov, so no longer open: (1) the first release includes the library read (closes reconciliation decision 3 and the phase-order rows; see O-29 for the numbering question); (2) places and special occasions are in (reverses the no-place, no-title position, RV-18 and RV-19). Faces and naming people are not decided (O-30). Each has a recommended default. If the founder says nothing by the deadline, the default applies to docs and test builds only, never to public text. Dates are PROPOSED; the Build 13 freeze date was not read by any lead.

| Id | Question | Default | Deadline |
|---|---|---|---|

Round 1 triage (EX-CPO-10): the founder-only set is O-01, O-02, O-03, O-05, O-07, O-16, O-18, O-30, O-31, O-32, O-33, O-35 and the new O-37 to O-42, O-44 to O-47; the others go to the owner named, who rules in the exec rulings log. Every default below is a recommendation; none is applied silently. Deadlines carry the corrected weekdays (21 Nov 2026 is a Saturday: Tue 24 Nov, Fri 27 Nov, Mon 30 Nov, Tue 1 Dec).

| Id | Question | Owner | Recommended default | Decide by |
|---|---|---|---|---|
| O-01 | Tab position: Home, Moments, Book, Me with Home landing, or Moments as landing (4.2) | Founder | Home landing; test option C with five parents | Tue 24 Nov |
| O-02 | A library-timed local reminder in the ordinary reminder's identical words (RV-08) | Founder | Not in the first release; ship F4 off; phase 2 after counsel answers Q-X1-6 | Before the release gate G2 |
| O-03 | One lifecycle email on a parent-chosen date, never library-derived (RV-09) | Founder | Park the email (CPO): phase 2, dark first, send to the founder only; if signed, only a parent-chosen date drives sends and never the date of birth (R197) | Fri 27 Nov |
| O-04 | Keep the daily-return claim as a hypothesis or drop it (4.4) | CPO | Keep as a hypothesis, one honest card a day | Tue 24 Nov |
| O-05 | When may the library ask appear: any tap after first run, or only after the first kept letter | Founder | Any tap after first run | Fri 27 Nov |
| O-06 | One Home pointer to Moments after the first kept letter | CPO | Yes, once | With O-01 |
| O-07 | App-supplied seasonal days beyond public holidays and ticked Days | Founder | No | Fri 27 Nov |
| O-08 | Apple's title on Route A: never shown or stored, and reword NS-49-R9 | CTO with privacy | Never | Tue 24 Nov |
| O-09 | Persist a library index cache, or rebuild from a date window each time (X5 option P) | CTO with privacy | Option P (no stored library identifier); a cache only if the spike proves it needed | After G1 |
| O-10 | Recent shows lone ordinary pictures or qualifying days only | Deleted | Deleted: the same question as O-12 (EX-CPO-10) | n/a |
| O-11 | A card may show the child's age or the number of months | CPO | Show the child's age in months on the age-day card only (CPO); never on the lock screen or in a push (R234) | Fri 27 Nov |
| O-12 | Recent qualifying tiers (P6 R4) versus D3 6.1 one card per day with a picture (C-1 and P6 Q10) | CPO | P6's tiers | Tue 24 Nov |
| O-13 | Store a picture identifier for "Leave out this picture" (P6 Q4; conflicts with MT-X5-R1 and R3) | Privacy and CTO at G3 (founder may reverse) | No in the first release: store no picture identifier (R247); G3's own fallback says store none, and CDO, Privacy and CPO agree; the founder may reverse | Fri 27 Nov |
| O-14 | Show a parent-chosen album's title verbatim (P6 Q3, narrows NS-51-R5 and R14) | Privacy and CTO at G3 (founder may reverse) | No in the first release: no album identifier or title stored (R247); the founder may reverse | Fri 27 Nov |
| O-15 | Approve READ_SET_V1 (P6 Q1; hearts widen NS-51-R5) | CTO with privacy | Yes as a closed set with a scan | Tue 24 Nov |
| O-16 | Does a kept day recur each year (P6 Q5, against NS-46-R5) | Founder | No recurrence in v1 for kept days | Fri 27 Nov |
| O-17 | "Choose which pictures" at the head or foot of Recent | Design | Foot | With design |
| O-18 | The permission result as an analytics event | Founder | No | Before the registry change |
| O-19 | After Keep, land on the Book or return to Moments | CTO with privacy | Book | Tue 24 Nov |
| O-20 | A shared book under Variant A: the other parent sees words only | Parked | Parked until co-parent ships (D-162); not first release | Parked |
| O-21 | Country or region as a coarser place (superseded by 7a) | Deleted | Deleted: superseded by 7a | n/a |
| O-22 | Where a notification tap lands | Design | Phase 1 routing table: `typedDay`, `birthday` and `monthAge` land on Moments, `evening` lands on Home; a landing shows phone-held cards only (R265) | Tue 24 Nov |
| O-23 | Any widget | CPO | No | After launch |
| O-24 | Haptics and sound: `selection` on "Another thought"; read `SOUND.md` first | Design | As 14.3 | Before sign-off |
| O-25 | Lamp scene on Moments or plain paper | Design | Plain paper | With design |
| O-26 | A3's longer first-view settle in place of A1's | Design | A1's tokens | With design |
| O-27 | A card carries one thing into capture (A4 option B) | Design | Off | With design |
| O-28 | Moments as a name in store text | CLO and counsel | In-app only until counsel clears it | Counsel |
| O-29 | Which reconciliation decisions the 21 Nov ruling closes | Coordinator | Coordinator housekeeping, not a founder matter | n/a |
| O-30 | Face recognition or naming people | Founder | OUT; not decided here (children's biometric data) | Founder, when he chooses |
| O-31 | Place names: offline city table only, or also Apple's geocoder (venue level) on day one | Founder | Offline table and parent-typed place; the Apple geocoder is not in the first release and not compiled in (R236) | Tue 24 Nov |
| O-32 | Scene or event inference as a labelled suggestion (K-SUG) | Founder | NOT PLANNED for K-SUG; ask the reframed question in 7a.4; special occasions mean dates we know | After the real-library card sort |
| O-33 | Which public holidays ship and for which regions | Founder | A civic list for the US; per-holiday switch | Fri 27 Nov |
| O-34 | Show a place line on every card or only when away from home | Design | Only when away | With design |
| O-35 | Recurring typed days, ticked Days and parent-marked firsts each year | Founder | Only if the parent chooses "every year" | Fri 27 Nov |
| O-36 | iOS floor 17.0 or 17.2 | Parked | Parked with Route A (phase 3): keep 17.0 (D-098) | Parked |
| O-37 | If a library gate is not closed by the submission date, which slips: (a) the date, or (b) the library read only (Moments ships on its no-library content and the library follows in the next binary)? Named decider: the founder, with the CFO's cost and the CPO's calendar (EX-CPO-1, EX-CBO-4) | Founder | (b) for G2 and G8, which need a written licensed-counsel answer and may not close in time; (a) for every other gate. Silence from counsel is never a pass | Tue 24 Nov; invoked or not by Mon 30 Nov (UNVERIFIED against D-121) |
| O-38 | Send `source: moment` as an analytics enum (an L2 entry-point value shared by every Moments card, no library fact), or not (EX-CPO-2, EX-CDO-2). CDO and CPO favour sending; Privacy, CCO and Engineering favour not sending | Founder | Do not send in the first release (R87 stands); G-2 is read from App Store Connect cohorts, the device row and the diary. If signed: an enum behind D-163 and the registry, never by library vs prompt | Before the registry change |
| O-39 | The CPO cut list and the F2a/F2b flag split (EX-CPO-3, EX-CPO-4, EX-CCO-5), shown in 23.2 as recommendations only | Founder | Split F2 into F2a and F2b; adopt the cut list of 23.2; neither is applied to the rows by this file | Tue 24 Nov |
| O-40 | Engage licensed California technology and consumer counsel for the Moments gates (spend; EX-CLO-2) | Founder | A capped brief on the ten questions of 21.3; silence leaves the dependent parts dark | Tue 24 Nov |
| O-41 | Store screenshots: capture from screens that hide the tab bar, or wait for trademark clearance of the name (EX-CMO-3) | Founder | Hide the tab bar in every frame (R194); decide before the screenshot freeze | Fri 27 Nov |
| O-42 | Sign RV-01 to RV-22 as four signatures (Tab and capture; Permission and ask; Computed labels, places and occasions with H-10; Nudges and email) or as one (EX-CPO-10) | Founder | Four signatures | With G10 |
| O-43 | The For you and Recent switch (kept) or one scrolling page with a Recent section (EX-DES-8, opinion) | Chief Design Officer | Keep the switch (R10, R177 depend on it), never stacked at AX1 (R211) | With design |
| O-44 | Stored picture copies in the iPhone backup: disclose them (CISO, Privacy) or exclude the folder from backup (CLO) (EX-SEC-10, EX-CLO-11) | Founder with Privacy | Disclose, plus device row D-3 in G11; the exclusion is the CLO's preference and is Counsel Q7's default | Before G2 |
| O-45 | The postal address for the lifecycle email (a mailbox service or an agent) (EX-CLO-18, EX-CCO-8) | Founder | Decide with the entity question; phase 2, not on the first-release path | With O-47 |
| O-46 | The numbers of the measurable and the stop line (R264) | Founder | Set before the build; PROPOSED measure in 20.1 | Before PR 16 |
| O-47 | Entity and individual publisher with Moments in the decision (EX-CLO-13, EX-CFO-6) | Founder | Decide before D-004 on Fri 27 Nov; if counsel is silent, start the entity in parallel and keep the individual account for the first submission only on counsel's written answer | Fri 27 Nov |

### 23.1 The founder-only decisions in one place, each with a recommended default

| Item | Recommended default | Where |
|---|---|---|
| O-37 which slips | (b) for G2 and G8, (a) otherwise | 21.1 |
| O-38 `source: moment` | Do not send | R87 |
| O-39 flag split and cut list | Split F2; adopt the cut list | 23.2 |
| O-40 licensed counsel | Capped brief | 21.2, 21.3 |
| O-32 K-SUG | NOT PLANNED | 7a.4 |
| O-30 faces and people | OUT | 7a.5 |
| O-41 screenshots | Hide the tab bar | R194 |
| O-44 backup copy | Disclose plus device row D-3 | R235 |
| O-45 postal address | With the entity question | R197 |
| O-46 measurable numbers | Founder sets | R264 |
| O-47 entity | Decide before Fri 27 Nov | 21.2 |
| Tab position (O-01) | Home landing, Moments second | 4.1 |
| Spend of any kind | None | 21.2 |
| H-10 machine-label boundary | Sign in the G10 entry | 3.1 |

### 23.2 The CPO cut list and the flag split, recommendations only (O-39)

The four rulings of 21 Nov fix the core: the tab, For you, the library read with Limited honoured, Recent, day cards, a place line, dated occasions, capture hand-off. The list below is not required by them. None of it is applied to a row's priority by this file; the rows stay and the ids stay stable. Where a row is default-off it is because the open question's default is No (R247).

| Cut (recommended for 1.1, after the card sort and G1a) | Rows | Effect |
|---|---|---|
| Stored picture identifier for "Leave out this picture" | R56 | Removes one stored identifier class (default-off now, R247) |
| Album chooser and verbatim album title | R57 | Removes a second identifier class (default-off now, R247) |
| The kept-day concept | R55 second half | Removes a concept with no stated purpose |
| Stay cards and run cards | R58, R64 | Their parameters wait on the card sort |
| Pinch and pan viewer | R149 | The day sheet's 96 pt tiles and the system handling carry the first release |
| One switch per public holiday | R66 | One "Public holidays" switch instead |
| Verbs | R28, R54, R212 | Four actions: CPO keeps "Not today", "Not this one" (absorbing "Hide this day"), "Name this day" and "Not this place" (absorbing "Hide this place"); Design cuts "Not today" and keeps "Leave out this picture" inside the day sheet only. R212 follows Design; the founder picks |

Total: about 10 rows and 3 stored identifier classes deferred, without touching any ruling. Flag split: F2a (ask, library read, Recent, day cards, hand-off) and F2b (place labels and the location member of READ_SET_V1); G1 (place half), G3 (location) and the licence read attach to F2b; a failed F2b gate ships date-only cards and the library read ships; R169 and R171 test both flags. Two candidate binaries then differ by F2a and F2b only.

## 24. Contradictions between the lead documents, and the choice made here

| Id | Contradiction | Choice | Founder's call? |
|---|---|---|---|
| C-1 | Recent lists qualifying days (P6) or one card per day with any picture (D3 6.1) or one screen (P2) | P6's qualifying tiers, one screen, no count | OPEN O-12 |
| C-2 | Tab position: landing Moments (A1, A2, A3, A5, D4 text) or second with Home landing (19 leads) | Second, Home landing; A and D4 landing text is rewritten | OPEN O-01 |
| C-3 | Typed days known to the server (brief, P1, B1) or phone-only (X3, X5, X6) | Phone only; no email from typed days | Founder confirms |
| C-4 | A birthday or month-age email is fine (X3, P1, P2) or barred (X2, X4, X6, CATALOG line 161) | Not by date of birth by default; a parent-chosen date | OPEN O-03 |
| C-5 | Index contents: ML-4 no id (X5) or up to 30 moments with 6 ids (NS-51-R6, E37) | Store none by default | OPEN O-09 |
| C-6 | Where a nudge tap lands: Home (T5) or Moments (T1, P4, X1) | Home | OPEN O-22 |
| C-7 | Limited state: a message (PR #1270) or silent (NS-51-R18, T2) | Silent with one quiet control | Design |
| C-8 | Denied wording: nothing (wheel) or one calm line and Open Settings (P3, D2, D5) | One line and the button, on the tab and in Me only | Founder (Q-HEW-3) |
| C-9 | The ask only after the first kept letter (X2, P5) or on a tap any time (P3, D2) | On a tap after first run | OPEN O-05 |
| C-10 | Where set-aside flags live: the index file (T4, P2) or a decisions store (X5, X3) | One phone-only decisions store of day keys | Data |
| C-11 | A collage tile is a target or not: A2 whole collage; T4, D3 tiles open the viewer | In the feed one target opens the day; inside the day, tiles open the viewer | Design |
| C-12 | Route order: A first (PR #1269, P3, X4) or B first (X1, X2, X3, PR #1267) | Route B in the first release by founder ruling; Route A optional later | Decided by ruling |
| C-13 | Route A and the 17.0 floor: hide the tab (D2) or hide the control (X4, PR #1269) | Hide the control | OPEN O-36 |
| C-14 | Apple's title: shown with "Use this" (NS-49-R9) or never (brief, X1, P4) | Never | OPEN O-08 |
| C-15 | Label claim: "Data Not Collected" (PR #1267) or per type (X2, X4) | Per type | `legal` |
| C-16 | The year-ago letter on Home (wheel, NS-50-R5) or Moments (P1, P2) | Moments when on | Founder |
| C-17 | Tab name and verb (D5 "Gather", PR #1270 "Days" and "pick", P2 "look back") | "Moments", verb choose | Decided (#1276) |
| C-18 | First-view motion: A1 (8 pt, 280 ms) or A3 (12 pt, 420 ms) | A1's token set | Design |
| C-19 | Placeholder grace: A3 fixes 300 ms; A1 and A5 say measure | Do not fix a number before the device run | Design |
| C-20 | Haptics: A3 none, A4 the Keep haptic, A1 `selection` on refresh | As 14.3; read `SOUND.md` | OPEN O-24 |
| C-21 | Thumbnail cache: A5 allows a disk cache, T4 and A3 say memory only | Memory only | `mobile` |
| C-22 | Selection cap: D3-R14 says 8, NS-52 says 6 pictures and 2 videos | NS-52 | Founder if he wants more |
| C-23 | Server features in store builds: off (X1, X3, X5) or on in production (X6, FACT-CHECK) | On in production; written for that | `mobile` confirms |
| C-24 | Place, title and person: "no place" (PRINCIPLES-REVIEW, MT-X1-R5, Q-PM-5) or places and occasions IN (founder, 21 Nov) | Places and occasions IN through 7a; faces and people OUT | Decided by ruling; O-30 |
| C-25 | Phase order: tab first, library later (P5 O2, PR #1269) or library read in the first release | Library read in the first release | Decided by ruling |
| C-26 | A part-of-day word (PRINCIPLES-REVIEW L2) or none (D3 5.2, D5, P6 Q8) | None on the card; clock times in the day sheet | Founder (coordinator: weekday and date only) |
| C-27 | A year-ago day (P6 R25) or a letter (P2 S4) | Both exist: RSN-YEAR for pictures and RSN-LETTER for a letter | None |
| C-28 | Count rule: "Picture 2 of 4" (NS-52-R28) or no count (NS-01-R11) | A position inside one letter is allowed; no count anywhere else | Reviewer |
| C-29 | Daily return: drop the claim (P1 Q-P1-7) or keep it (P5, D1, founder) | A hypothesis, with one honest card a day | OPEN O-04 |
| C-30 | Places: venue-level labels in the D7 prototype ("Maple Park", "Lakeside Market") or city level from an offline table (7a.1) | City level; the prototype is redrawn before G4 (R219) | Founder (O-31) |
| C-31 | The prototype's cold launch enters the first six cards; this file says the first three, once per install | Three, once per install (R216) | None |
| C-32 | After Keep the prototype returns to Moments; this file lands on the Book (O-19) | Book; the prototype is corrected (R216) | OPEN O-19 |
| C-33 | The prototype scales AX5 by 2.4 times and carries PROPOSED tokens not in `tokens.ts` (`glassFallback`, `highlight`, `kicker`, pill alpha 0.68, `heroEnter`, `momentCarry`); AX5 is about 3.571 times | 3.571 times (R211); tokens enter through the normal route or are dropped (R216) | None |
| C-34 | R87 (no analytics value says a letter began from a moment) against section 18 and G-2 (letters started with `source: moment`) | R87 stands as the default; G-2 is re-measured (O-38) | OPEN O-38 |
| C-35 | Lock screen: no child name by default (13.3) against none when names are off (13.3) and the T5-R26 table | A Moments-class note never carries a child name or age (R234) | None |
| C-36 | G3's fallback (store no identifier) against O-13's default (store one) | Store none (R247) | Founder may reverse |
| C-37 | S7 is `pushSafe` (R36) while R130 forbids a library push | S7 is not `pushSafe` in phase 1 (R36) | None |
| C-38 | R118 (the library is never fetched from the network) against U4 (an iCloud-only item waits at attach) | "Never by us"; the system may download for attach and the privacy line says so (R220) | None |

## 25. Executive review

Purpose: the review round fills this block, and the requirements are updated from it before they are called done. Reviewers assess the library-read-first release (founder ruling 21 Nov: the first release includes the photo library read) and the places and occasions ruling (RV-18, RV-19: places and special occasions are in; faces and naming people stay out and are an open founder question, O-30). Role letters are as the founder listed them; where a letter has two readings I state mine and the reviewer corrects it. Each table has the questions that role should answer, then space for findings, a verdict (Approve, Approve with changes, Block), the NS-53 rows to change, an owner and a date. Do not delete a question; add rows.

Common questions for every reviewer: Is the first release too large to ship safely with the library read? Which release gate (section 21) worries you most? What would make you vote Block? Does anything here break a promise made in the App Store text, the policy or the label?

### 25.1 CPO (product)
| Assess | Findings | Verdict | Rows to change | Owner | Date |
|---|---|---|---|---|---|
| Does the job statement (1.3) match the customer problem? Is the daily-return claim (a hypothesis) stated honestly (4.4, O-04)? | | | | | |
| Is the first release scope (19.3 phase 1) the smallest set that solves the problem, with the flag-off fallback credible? | | | | | |
| Are the Recent qualifying tiers (O-12) and the teaching verbs the right size? | | | | | |

### 25.2 Design
| Assess | Findings | Verdict | Rows to change | Owner | Date |
|---|---|---|---|---|---|
| Does 14 give a calm, paper-first feel; are the final choices where leads disagreed (C-11, C-18 to C-21, O-25 to O-27) right? | | | | | |
| Do place lines and hide-a-place controls (7a, U23 to U25) feel safe at AX5 on an iPhone SE 3? | | | | | |
| Is the first-customer minute-by-minute (11) a moment a tired parent would enjoy? | | | | | |

### 25.3 CMO (marketing)
| Assess | Findings | Verdict | Rows to change | Owner | Date |
|---|---|---|---|---|---|
| Is the tab name used only in-app (O-28)? Do value lines avoid claims the label or policy cannot back (13.1, 16)? | | | | | |
| Is the lifecycle email (13.6, O-03) acceptable to the stricter commercial standard, and is the nudge wording free of slideshow tone? | | | | | |

### 25.4 CBO (brand; correct me if this letter means business)
| Assess | Findings | Verdict | Rows to change | Owner | Date |
|---|---|---|---|---|---|
| Does a machine-computed place and occasion label sit inside the brand promise "we never write your words" (7a, firewall F1 to F8)? | | | | | |
| Does the word Moments fit the glossary and brand voice (D6, #1276)? | | | | | |

### 25.5 CFO
| Assess | Findings | Verdict | Rows to change | Owner | Date |
|---|---|---|---|---|---|
| Effort ranges (reconciliation section 8: Route B about 28 to 34 agent-days ASSUMED, local nudge 2 to 3, Route A 8 to 11) against the store date, plus the cost of the bundled place table and any geocoder use. | | | | | |
| Cost of a rejected or delayed submission versus shipping the tab with the flag off. | | | | | |

### 25.6 CLO (legal)
| Assess | Findings | Verdict | Rows to change | Owner | Date |
|---|---|---|---|---|---|
| Do 8.5 and 21 (G2, G8) list every Apple, DPLA, CAN-SPAM, COPPA, GDPR, CCPA and label question counsel must answer? Is the label per type correct for the production profile (17)? | | | | | |
| Is a picture-timed reminder (CQ-16, 5.1.2(vi)) and an offline place name from a picture's location acceptable? Is the stored-copy backup line right? | | | | | |

### 25.7 CCO (compliance; correct me if this letter means communications)
| Assess | Findings | Verdict | Rows to change | Owner | Date |
|---|---|---|---|---|---|
| Are the compliance rows in 21 complete (storefront, age gate, state developer duties, notification rules)? | | | | | |
| Is evidence for each gate recorded where an auditor would look (`docs/release/<x.y.z>.md`)? | | | | | |

### 25.8 Privacy
| Assess | Findings | Verdict | Rows to change | Owner | Date |
|---|---|---|---|---|---|
| READ_SET_V1 including location (RV-19, G3); the stored identifier decision (O-13); the data-flow table (10) and 17. | | | | | |
| Is "nothing library-derived leaves the phone" true in every path, including a place lookup and any reminder? Is the Shown, Records, Never, Decline set (8.5) complete? | | | | | |

### 25.9 CISO (security)
| Assess | Findings | Verdict | Rows to change | Owner | Date |
|---|---|---|---|---|---|
| Threat model: switcher snapshots, App lock, a coordinate in memory, the moments file protection, the bundled table's integrity, no third-party media package (9). | | | | | |
| Failure modes: library change events, a corrupt file, account switch (12). | | | | | |

### 25.10 CDO (data)
| Assess | Findings | Verdict | Rows to change | Owner | Date |
|---|---|---|---|---|---|
| Is the classification (17) right, and is the only new server data (phase 2 occasion rows) minimal? Is the analytics allowlist (18) enough to learn anything without library facts? | | | | | |
| How would we read the daily-return hypothesis with analytics off at 1.0 (20)? | | | | | |

### 25.11 CAIO (AI)
| Assess | Findings | Verdict | Rows to change | Owner | Date |
|---|---|---|---|---|---|
| Is the engine truly rule-based (no model) in the first release, and is K-SUG (7a.4) correctly held back with G9? | | | | | |
| Does anything imply a machine writes, suggests or knows something (P6 R34 words)? Are faces and people OUT without a back door (O-30)? | | | | | |

### 25.12 Engineering lead
| Assess | Findings | Verdict | Rows to change | Owner | Date |
|---|---|---|---|---|---|
| Is the module split (19.1), the one native module and the stacked-PR plan buildable inside the freeze; what does the harness assign to engineers after freeze? | | | | | |
| Are the ASSUMED thresholds data, and are the test layers on every row achievable (L0 to L5)? | | | | | |

### 25.13 Review log
| Round | Date | Reviewers | Rows changed | Open items |
|---|---|---|---|---|
| 1 | | | | |

## 26. Traceability: every lead-document requirement id

Every id below is either carried by the NS-53 rows named, or marked "not carried" with a reason. Each id is shown as id:row number, where "+n" means n further NS-53 rows also carry it and "nc" means not carried. The lead documents are P1 to P6, D1 to D6, A1 to A5, T1 to T5, X1 to X6, B1 and R1; ids of the form Q-P1-n, OQ-P4-n and P6-Qn are open questions carried in section 23. Coverage is computed by script from the Satisfies column when this file is assembled: 836 of 845 ids are carried by at least one row, 9 are marked not carried, 0 are unmapped.

| Lead doc | id : NS-53 row number (+n further rows; nc = not carried, reason in the not-carried list below) |
|---|---|
| MT-A1 | R1:144, R2:144, R3:145, R4:144, R5:144, R6:146, R7:144, R8:146, R9:146, R10:177, R11:177, R12:177, R13:177, R14:29, R15:144, R16:144, R17:144+1, R18:144, R19:153, R20:153, R21:144, R22:151, R23:152, R24:152 |
| MT-A2 | R1:122, R2:122, R3:122, R4:109, R5:44, R6:44, R7:112, R8:122, R9:122, R10:45, R11:112+1, R12:41, R13:122+1, R14:154, R15:111, R16:111+1, R17:111, R18:146, R19:177, R20:177, R21:177, R22:177, R23:26, R24:26, R25:26, R26:26, R27:145, R28:145, R29:178, R30:146 |
| MT-A3 | R1:145+1, R2:71+1, R3:69+1, R4:69+1, R5:69+1, R6:69+1, R7:71+1, R8:71+1, R10:151, R11:122, R12:122, R13:122, R14:122, R15:178, R16:73, R17:75, R18:76, R19:77, R20:122, R21:178, R22:178, R23:145, R24:147, R25:147 |
| MT-A4 | R1:148, R2:148, R3:148, R4:148, R5:148, R6:179, R7:179, R8:148, R9:148, R10:86, R11:86, R12:86, R13:86, R14:108, R15:179, R16:179, R17:179, R18:179, R19:179, R20:108, R21:15, R22:148, R23:148, R24:148, R25:148+1 |
| MT-A5 | R1:144, R2:111+1, R3:144, R4:111, R5:109, R6:112, R7:112, R8:45+1, R9:125, R10:146, R11:178, R12:112, R13:112, R14:146, R15:109, R16:178, R17:146, R18:146+1, R19:157, R20:153, R21:152, R22:152, R23:152, R24:152 |
| MT-B1 | R1:161, R2:161, R3:161, R4:161, R5:161, R6:161, R7:161, R8:161, R9:161, R10:161 |
| MT-D1 | R1:1, R2:4+1, R3:3, R4:185, R5:185, R6:185, R7:185, R8:13, R9:13, R10:13+1, R11:13, R12:13+1, R13:13+1 |
| MT-D2 | Q1:8, Q2:nc, Q3:nc, Q4:82, Q5:nc, Q6:nc, Q7:nc, Q8:nc, Q9:nc, R1:69, R2:69, R3:69, R4:69, R5:6+1, R6:73, R7:74, R8:72, R9:75, R10:75, R11:76+1, R12:76+1, R13:77, R14:78, R15:182, R16:155, R17:71+1, R18:182, R19:182, R20:82 |
| MT-D3 | Q1:nc, R1:186, R2:11+1, R3:44, R4:44, R5:41, R6:16, R7:16+2, R8:49+1, R9:48, R10:186, R11:85+1, R12:90, R13:90+2, R14:90, R15:85, R16:29+1, R17:29, R18:53, R19:75, R20:111+1, R21:45+2, R22:125, R23:14+1, R24:11, R25:154 |
| MT-D4 | R1:153, R2:153, R3:3+1, R4:153, R5:153, R6:154, R7:154, R8:154, R9:154+1, R10:154, R11:154, R12:185, R13:69+1, R14:71+1, R15:75+3, R16:155, R17:71+1, R18:156, R19:156, R20:3+1, R21:153+1, R22:156, R23:156, R24:156, R25:156, R26:156, R27:3+1, R28:157, R29:157, R30:157, R31:157, R32:157, R33:14+1, R34:13 |
| MT-D5 | F1:8, F2:159, F3:159, F4:81, F5:11, R1:159, R2:72, R3:73, R4:75, R5:12+1, R6:12+1, R7:69+1, R8:159 |
| MT-D6 | R1:8, R2:8+1, R3:8, R4:8, R5:8+1, R6:8, R7:8, R8:8, R9:8+1, R10:8, R11:8 |
| MT-P1 | R1:1, R2:2, R3:2, R4:83, R5:32+1, R6:5, R7:5, R8:6+1, R9:70, R10:187, R11:187, R12:4, R13:14, R14:187, R15:34, R16:35, R17:36+2, R18:131, R19:36+1, R20:162+1, R21:78, R22:3+1, R23:7, R24:107+1 |
| MT-P2 | R1:1, R2:10, R3:11, R4:12+1, R5:37, R6:18, R7:19+1, R8:20+1, R9:21, R10:22+2, R11:23, R12:5, R13:5, R14:24, R15:25, R16:26, R17:40, R18:187, R19:187, R20:187, R21:33+1, R22:32, R23:28, R24:29, R25:30+1, R26:31, R27:36+1, R28:132, R29:132, R30:131, R31:8, R32:137, R33:188, R34:102, R35:4, R36:162+1, R37:118, R38:153, R39:27, R40:107+1, R41:7+1 |
| MT-P3 | R1:1, R2:1, R3:121, R4:69, R5:69, R6:10+1, R7:71, R8:11, R9:6+1, R10:70, R11:73, R12:72, R13:75, R14:76, R15:76, R16:77, R17:79, R18:69+1, R19:189, R20:189, R21:85, R22:189, R23:79, R24:14+1, R25:130+1, R26:167, R27:132, R28:131, R29:188, R30:4, R31:167, R32:107+1, R33:80, R34:81 |
| MT-P4 | R1:83, R2:84, R3:86, R4:87, R5:49, R6:88, R7:88, R8:89, R9:90, R10:91, R11:92, R12:92, R13:93, R14:82+1, R15:17+1, R16:95, R17:17+1, R18:96, R19:97, R20:97, R21:93, R22:91, R23:98, R24:99, R25:90, R26:100, R27:101, R28:154, R29:102, R30:103, R31:104, R32:104, R33:104, R34:105+1, R35:24+2, R36:163, R37:131, R38:131, R39:188, R40:188, R41:108+1, R42:106, R43:106, R44:107+1 |
| MT-P5 | R1:169, R2:170, R3:170, R4:1+1, R5:169, R6:169, R7:171, R8:171, R9:131, R10:132, R11:133, R12:133, R13:137, R14:138, R15:141, R16:141, R17:141, R18:10+1, R19:33+1, R20:11, R21:168+1, R22:168, R23:167, R24:167 |
| MT-P6 | R1:37, R2:38, R3:39, R4:40, R5:41, R6:41, R7:41, R8:41, R9:41, R10:57, R11:42, R12:43+2, R13:nc, R14:44, R15:44, R16:44, R17:45, R18:44, R19:58+1, R20:58+1, R21:39+1, R22:190, R23:46+2, R24:46+1, R25:47, R26:48, R27:49, R28:50, R29:51, R30:51, R31:51, R32:51, R33:51, R34:52+1, R35:46, R36:53, R37:52, R38:54, R39:54, R40:17+2, R41:55+1, R42:56, R43:54+1, R44:54+1, R45:59, R46:59, R47:39, R48:59, R49:38, R50:52, R51:53, R52:60, R53:60, R54:60, R55:58+1, R56:60 |
| MT-R1 | R1:161+1, R2:161+1, R3:7+1, R4:7+1, R5:7+1, R6:7+1, R7:7+1, R8:7+1, R9:161+1, R10:161+1, R11:161+1 |
| MT-T1 | R1:1, R2:3, R3:3, R4:3, R5:3, R6:180, R7:145, R8:145, R9:145, R10:145, R11:145+1, R12:180, R13:180, R14:180, R15:108, R16:1, R17:4, R18:4, R19:4+1, R20:145, R21:145, R22:145, R23:145, R24:70+1, R25:120, R26:181, R27:76, R28:181, R29:120, R30:139, R31:137+1, R32:137+1, R33:139, R34:70+1, R35:139, R36:181, R37:144, R38:181, R39:180, R40:153+1 |
| MT-T2 | R1:182, R2:70, R3:71, R4:182, R5:73, R6:73, R7:182, R8:182, R9:74+1, R10:74, R11:77, R12:77, R13:77, R14:122, R15:122, R16:122, R17:122, R18:122, R19:122, R20:122, R21:122, R22:78, R23:78, R24:75, R25:75, R26:76, R27:76, R28:76+1, R29:76, R30:102, R31:182 |
| MT-T3 | R1:85+1, R2:85+1, R3:85, R4:83, R5:183, R6:83, R7:85, R8:85, R9:85, R10:86, R11:86, R12:86+1, R13:86, R14:86, R15:86, R16:86, R17:86, R18:86, R19:126, R20:126, R21:126, R22:126, R23:126, R24:86, R25:108, R26:108, R27:15+1, R28:15+1, R29:108, R30:139, R31:139, R32:139, R33:137+1, R34:139, R35:183, R36:183, R37:148, R38:183, R39:107+1 |
| MT-T4 | R1:149, R2:149, R3:149, R4:149, R5:149, R6:149, R7:149, R8:149, R9:149, R10:149, R11:177, R12:150, R13:150, R14:145+1, R15:150, R16:150, R17:150, R18:150+1, R19:150, R20:144, R21:149, R22:149 |
| MT-T5 | R1:137, R2:137, R3:137, R4:137, R5:137, R6:127+1, R7:127, R8:137, R9:137, R10:137, R11:137, R12:127, R13:105+1, R14:105+1, R15:129, R16:129, R17:129, R18:129+1, R19:127+1, R20:119+1, R21:139, R22:184, R23:139, R24:139, R25:131, R26:138, R27:138, R28:128+1, R29:141, R30:128+1, R31:129, R32:128, R33:141, R34:141, R35:141, R36:141 |
| MT-X1 | R1:164, R2:102, R3:126+1, R4:82, R5:82+1, R6:43+1, R7:81, R8:131, R9:135+1, R10:134, R11:135, R12:8 |
| MT-X2 | R1:81, R2:81, R3:81, R4:81, R5:81, R6:81, R7:81, R8:81, R9:62+2, R10:72, R11:81+1, R12:62+2, R13:81+1, R14:80, R15:79, R16:72, R17:80, R18:82, R19:80, R20:165, R21:43+1, R22:68+1, R23:68, R24:80, R25:191, R26:135, R27:135+1, R28:136, R29:141, R30:141, R31:141, R32:141, R33:141, R34:136 |
| MT-X3 | R1:36, R2:16+3, R3:36, R4:172, R5:37+1, R6:110, R7:37+1, R8:37, R9:113, R10:115, R11:59, R12:27, R13:53+2, R14:173, R15:130, R16:30+2, R17:132, R18:116, R19:141, R20:141, R21:1+1, R22:83+1, R23:169, R24:110+1, R25:11, R26:61+2, R27:10+1 |
| MT-X4 | R1:72, R2:72, R3:72, R4:72, R5:6, R6:70, R7:74+1, R8:75, R9:80, R10:80, R11:175, R12:82, R13:82, R14:82, R15:82, R16:82, R17:82, R18:82, R19:81, R20:81, R21:62+1, R22:81, R23:62+2, R24:62+1, R25:81, R26:165, R27:165, R28:165, R29:68+1, R30:165, R31:89, R32:175, R33:175, R34:175, R35:175, R36:175, R37:166+1, R38:175, R39:175, R40:175, R41:80, R42:80, R43:136, R44:136+1, R45:136, R46:135+1, R47:135, R48:79+1, R49:132, R50:141+1, R51:141, R52:141, R53:141, R54:141, R55:141, R56:141, R57:119, R58:119, R59:119+1, R60:175, R61:69+1, R62:115+1, R63:77, R64:115+1 |
| MT-X5 | R1:113, R2:113, R3:113, R4:113, R5:114, R6:114, R7:65+2, R8:77+1, R9:115, R10:115, R11:105, R12:113+2, R13:116+1, R14:61+2, R15:103+1, R16:140, R17:191, R18:130 |
| MT-X6 | R1:140, R2:140, R3:140, R4:141, R5:141, R6:141, R7:140, R8:140, R9:140, R10:140, R11:134, R12:134, R13:135, R14:134, R15:141, R16:141, R17:141, R18:141, R19:142, R20:142, R21:141, R22:142, R23:142+1, R24:72, R25:140 |

Not carried (intentionally), with reasons:

| Id | Reason |
|---|---|
| MT-D2-Q2 | A question, not a requirement. Answered in 8.2: a primer sheet before Apple's alert (two taps), with the inline ask card as the door. |
| MT-D2-Q3 | A question. Answered in 8.1 and 8.3: "declined" means Apple's Don't Allow; no permanent "never ask" in our UI. |
| MT-D2-Q5 | A question. Carried as release gate G7 (verify the iPhone Settings path and labels on a current iOS before any words describe it). |
| MT-D2-Q6 | A question. Carried as release gate G7 (does the system picker still work under Restricted; mobile checks on a device). |
| MT-D2-Q7 | A question. Answered in section 8 (pinned ask bar only on a tap arrival, inline from AX1). |
| MT-D2-Q8 | A question. Not carried: no "last looked" time is stored or shown (it would be a library-derived fact; default in D2 was privacy's call). |
| MT-D2-Q9 | A question. Carried by the reversal table in section 3.2 (K-02, J3, NS-51-R1). |
| MT-D3-Q1 | A question about the tab name. Settled by D6 and PR #1276 (Moments, in-app only). |
| MT-P6-R13 | Reserved id in P6 with no requirement (keeps numbering aligned). Nothing to carry. |

## 27. What is VERIFIED, UNVERIFIED and a guess

VERIFIED (read this session by this author): the 29 lead documents plus P6, the reconciliation pack and the principles review, on the branches named in section 1; PRs #1264, #1267, #1269, #1270, #1276 and their files; `docs/product/prd/27-photo-moments-and-media.md` structure and NS-51-R1, R3 and R5; COORDINATION section 10; TDD 09 layers. Facts about Apple, the law and the repo that the leads read (App Review 5.1.1, 5.1.2, 4.5.4, the journaling entitlement, `CLGeocoder` needing the network, the CAN-SPAM guide, BIPA and RCW 19.373, the PhotoKit property pages) are carried as their findings with their sources; this author did not re-read them. From the coordinator, not re-read: the fact check of privacy and EAS (commit c65c39f4), the founder rulings of 21 Nov (library read in the first release; places and occasions in), the P6 head (357ef84d) and the principles review head (66bcc4f0).

UNVERIFIED: whether `asset.location` is readable under Limited access and without a Core Location permission; the offline place table's size, licence and accuracy; the PhotoKit fetch behaviours listed in 10.1 (source-type default, subtype predicate, delivery options); Apple's logging of a geocode request and whether a map tile sends the region; whether Apple reviews the journaling entitlement; the production `eas.json` state at submission; the live status of migration `20261110000000`; ML numbering; the Build 13 freeze date; every performance number (none is stated here); the founder's screenshots (not seen, not in the repo).

A GUESS: the likelihood and impact judgments in section 22; the effort ranges quoted from the reconciliation pack; that a place line shown only when away is the right default; that public holidays by date help.

## 28. Lead documents not found, and what I did not do

Not found on 21 Nov: D7 (no `wip/moments-d7` branch; the coordinator's list named it); a local clone `mt-d7` of another agent existed but was not read. The `wip/moments-principles`, `wip/moments-recon` and `wip/moments-factcheck` documents were read or taken from the coordinator as noted. Not done: no edit to `docs/agents/CLAIMS.md`, `docs/BACKLOG.md`, `docs/legal/**`, `packages/content/BRAND.md` or any other file; no PR; no code; no migration; no decision recorded in `DECISIONS.md`; no screenshot opened. Decision entries (D-###) for RV-01 to RV-22 are for `product` to draft as Proposed after the review round.
