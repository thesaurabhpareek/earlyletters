# Executive review: Chief AI Officer (Claude role)

Status: PROPOSED review input for NS-53 (`docs/product/prd/28-moments-tab.md`, section 25.11). Nothing here is decided.
Date: 21 Nov 2026
Source read: `docs/product/prd/28-moments-tab.md` in full (1187 lines) at the head of `wip/moments-prd` (commit 5bebd892), `docs/agents/exec/COUNCIL.md`, `docs/engineering/09-ai-assisted-engineering.md` (AIE-R20, exception rule), `docs/legal/compliance-register.md` (CR-040), `docs/DECISIONS.md` (D-061, D-065), `docs/product/prd/10-reading-and-family.md` (NS-23-R2). The CAIO skill text (frameworks and law notes dated 31 Oct 2026) was read; I did not re-open those external sources, so every law statement below is UNVERIFIED unless it names a repo file I read.

Conflict of interest, said first. I am an AI session playing this seat, and the spec I am reviewing was written by a session of the same model family. This review is therefore not independent. I recommend a challenger who is neither the author nor me (a human reader or a different model family) read EX-AI-1, EX-AI-2 and EX-AI-3 before the founder signs.

## Verdict: ACCEPT-WITH-CHANGES

The first release is rule-based and on the phone. I found no model in it. The risk is not a hidden model; it is that the machine-made labels (place, holiday, reason lines) are specified with a firewall (F1 to F8) whose key rule, F3, cannot be built or tested as written, and that the evals measure the engine against itself, not against what parents see.

Conditions (each maps to a finding):

1. C1 (EX-AI-1, BLOCKER): F3 gets a structural definition and a test before F2 turns on in any store profile.
2. C2 (EX-AI-3): the founder records, in the G10 D-### entry, the boundary rule for computed labels (metadata yes, content no). This is a reading of the constitution, so it is the founder's, not mine.
3. C3 (EX-AI-2): K-SUG is deferred and not planned. R67 leaves the phase table until the founder answers O-32 with the constitution cost in front of him.
4. C4 (EX-AI-4, EX-AI-5): the pass bars for place accuracy and for day grouping are written before the G1 spike runs, and a local-only real-library harness exists.
5. C5: every other finding is fixed in the spec before it is called done.

Counts: 13 findings. BLOCKER 1, MAJOR 4, MINOR 8.

Recommendation on K-SUG: DEFER. Do not ship it, and do not carry it as a planned phase 3 row. Reasons are in EX-AI-2.

## What uses a model or inference (inventory, answers the first question)

| Piece | Where | What it is | Model? | Leaves the phone? | Read from |
|---|---|---|---|---|---|
| Day bucketing, qualify, tiles, rotation | 7.1 to 7.3, R37 to R59 | Arithmetic and fixed rules; rotation is a fixed hash, no random source | No | No | R44, R51, R59 |
| Thresholds (BUSY_DAY, SESSION_GAP, WINDOW_DAYS, radius) | 7.2, 7a.2 | Heuristics, ASSUMED, set as data after the spike | No, but they decide which days a parent sees | No | 7.2, G1 |
| Place from photo location (P-A) | 7a.1, R61 | Nearest entry in a bundled table, by arithmetic | No, but it is a geometric inference that asserts a fact | No | R61 |
| Home place | 7a.2 step 3 | Most frequent place in the window, in memory | No, an inference about where the family lives | No | 7a.2 |
| Occasions and holidays | 7a.3 | Date maths and a shipped table | No | No | 7a.3 |
| Apple geocoder (P-B) | 7a.1, R62 | Network reverse geocode | Not ours, an outside service | Yes, precise coordinates to Apple | 7a.1 |
| K-SUG | 7a.4, R67 | Pixel-reading scene or event guess | Yes, a model on the phone | Specified as no | 7a.4 |
| Route A (Apple's suggestions) | R82 | Apple builds the groups | Apple's, not ours | Not by us | R82 |
| Push, email | 13 | Fixed content keys, server date facts | No | Email only, parent-chosen dates | 13.1, 13.6 |

Whether the build conforms is UNVERIFIED: this branch holds no code.

## Findings

### EX-AI-1: F3 ("visibly ours") is contradictory and untestable

Severity: BLOCKER
Requirements: NS-53-R17, R16, R63, R12, R52, 5.3, firewall F3 (3.3 id notes)
Finding: F3 says a machine label must be "visibly ours" with "no sparkle, 'AI' mark or 'suggested' word". R52 bans "suggested" and similar words everywhere. Section 5.3 puts the machine place line and the parent's own label on the same card, under the same date, and R63 says only that the place label "is ours". Nothing says how a parent tells "Lisbon" (from a table) from "Lisbon" (typed by them). In a book families keep for a child, a machine line read as the parent's own words is exactly what the constitution exists to prevent. No L0 test can check "visibly"; L3 snapshots cannot either unless a rule exists to snapshot.
Proposed change: replace F3 with a structural rule. (a) The card model has two disjoint fields: `machineLines` (closed kinds: reason, place, holiday) and `parentLabel` (string, typed by the parent). (b) They render in different slots, with different type tokens: the parent's words use the parent-words style used in letters and nowhere else on the card; machine lines use the interface style, smaller, and sit in the reason line row, never in the label slot. (c) VoiceOver reads machine lines with a fixed prefix key from `packages/content`. (d) When the parent replaces a place with their own words, it moves to `parentLabel` and takes the parent style. (e) L3 snapshot per slot; L0 test that the style token for `parentLabel` is used by no other field. (f) G4 gets a question asked of each parent: "Which lines on this card did you write?" Pass bar: all five answer correctly; any miss changes the design before F2 turns on.
Evidence: spec sections 3.3, 5.3, R16, R17, R52, R63 read. The contradiction and the missing test are my reading; no code exists to check.

### EX-AI-2: K-SUG should be deferred, and R67 conflicts with the rules it says it obeys

Severity: MAJOR
Requirements: NS-53-R67, 7a.4, RV-22, O-32, G9, R11, R16, R43, R52, R164
Finding: K-SUG guesses what a day was from the pixels. Five problems. (1) It adds meaning, in the strongest sense: a statement about what happened that the parent did not make. AIE-R20 says AI features follow the constitution and that model output enters only as typed `EditType` proposals; K-SUG output is not an `EditType`, so it cannot comply, and the exception clause says an exception never covers AIE-R20. Only a founder amendment to the rule could allow it, which my seat treats as a one-way door. (2) R67 contradicts rows the spec marks P0: R11 bans any card showing a scene, R16 bans a machine scene line, R43 fails the build on any vision or ML framework, R164 and CR-040 (a) forbid reading people. (3) A "closed list of occasion words" does not remove the risk; a wrong guess on a day of grief or a hospital stay is the failure the product cannot afford, and no one has said which words are on the list or how wrong guesses are measured. (4) The phone would need a classifier: size against the 40 MB app rule (D-065), a download, training-data terms (the same unresolved question as COUNSEL_PACKET Q9), none costed. (5) Parents already get the value through dates, the parent's own labels and places; the spec itself says places, dates and calendar occasions carry most of the attention (7a.4).
Proposed change: remove R67 from the phase table and mark it NOT PLANNED. Keep 7a.4 as a short "not built" note that states the boundary rule of EX-AI-3. If the founder later wants it, the entry needs: his own words amending the constitution reading, the five findings answered, a model chosen with an on-device size and a per-word precision bar written before testing, an abstain default, and a legal read. Also drop RSN-SUGGEST from the closed reason list until then (EX-AI-6).
Evidence: 7a.4, R67, R11, R16, R43, R164, RV-22 read. `docs/engineering/09-ai-assisted-engineering.md` AIE-R20 and line 162 read. D-065 read in `docs/DECISIONS.md`. CR-040 read (secondary-sourced in the register).

### EX-AI-3: The boundary for machine-computed labels is not written down

Severity: MAJOR
Requirements: RV-18, RV-19, RV-22, 3.1 H-1, G10, R37, R43
Finding: The constitution says the machine "may never add meaning". The founder has put places and occasions in. A place name from a bundled table and a holiday name add information the parent never said. The spec says the constitution is "unchanged" for the parent's words, which is right, but it never states where the line sits for labels, so the next feature (a "season" card, a "weekend" word, a scene) has nothing to be tested against. Under my seat's rules, a reading that widens what the machine may show is the founder's call.
Proposed change: add one rule to section 3.1 and to the D-### entry that G10 already requires: "A machine label is allowed only when it is a pure function of metadata the phone already shows the parent (date, the phone's zone and region, location coordinates, the parent's own marks). It is never a function of content (pixels, audio, words, people). It is shown as ours (F3), never enters a letter, and the parent can remove it." Add the matching sentence to AIE-R20 through its owner. R43's scan is then the structural enforcement. The founder signs it in his words (AIE-R30).
Evidence: CLAUDE.md constitution text as quoted in the task brief and in spec 3.1; spec 3.2 RV-18; AIE-R20 and AIE-R30 read.

### EX-AI-4: Place resolution has no accuracy bar and one invisible inference

Severity: MAJOR
Requirements: NS-53-R61, R63, R64, 7a.1, 7a.2, G1, RK-3, RK-5
Finding: "Nearest table entry within a radius" asserts a fact about the picture ("Pictures from Lisbon"). The radius, the table's coarseness and its accuracy are all ASSUMED; G1 lists "place table accuracy" with no pass bar. A wrong city or a wrong country on a family's card is a trust failure, and the first view shows a place before the parent can hide it. Edge cases are unlisted: coordinates at (0,0), the antimeridian, a coast or a border where the nearest entry is across the line, a long stay abroad that makes a foreign place the "home place" in a 90 day window, a picture whose location differs from its date (a re-saved picture). The home place is a hidden inference about where the family lives; the parent's "This is where we live" correction is then persisted (L4, wiped on Turn off), which stores a home city.
Proposed change: write the bar before G1 runs (CAIO method, step 4). Proposal for the owner to confirm: abstain over guess; zero wrong-country on a hand-labelled sample of at least 100 geotagged pictures from the founder's own phone, and a wrong-city ceiling the founder sets; the labels and pictures stay on the phone and only counts leave the harness. Add Asha golden cases for (0,0) treated as none, antimeridian, border and coast, ties, a 90 day window dominated by an away place, and a picture with no location. State that the home place is never written except as a parent correction, and list that correction in Me beside hidden places. Allow a place line only when the table entry is within a tight radius and unambiguous; otherwise no line (the spec's "none" path).
Evidence: 7a.1, 7a.2, R61, R63, G1 read. Thresholds are stated ASSUMED in the spec. The proposed numbers are mine and marked as a proposal.

### EX-AI-5: The grouping and reason evals check the engine against itself

Severity: MAJOR
Requirements: NS-53-R59, R60, R40, R44, R42, R51, 7.2, G1, G4
Finding: R59 (golden file of 20 cases, 100 shuffled orders) proves determinism and that the rules do what they say. It does not show that the days the rules pick are days a parent recognises, because the thresholds (BUSY_DAY 5, BUSY_HOURS 4 in 3, SESSION_GAP 3 h, WINDOW 90, all ASSUMED) have no real-library evidence. R60's five-parent sort gives "x of 5" and cannot measure a junk-day rate to the "no more than two in ten" bar it sets. There is no equivalent of the speech gate (`npm run gate`, run on real recordings through the app's own pipeline): a local harness that runs the real engine on a real library and reports only aggregates. Nothing versions the rules, so a threshold tweak silently changes what parents see.
Proposed change: (a) add a local-only harness, in the `experiments/` style, that runs `core/moments` on the founder's phone library and prints only counts: days qualifying, days per week shown, the share a human marks junk after a quick pass, wrong-reason count (must be 0). No image, date or place is written to disk or committed (H-8). (b) Write the bars before running. (c) Add `MOMENTS_RULES_VERSION`, bumped with any threshold or precedence change, with the golden diff reviewed at that bump, mirroring `ENGINE_VERSION`. (d) Keep R60 as the human check, labelled as such, and let G1 own the numbers.
Evidence: R59, R60, 7.2, G1, G4 read. Speech-gate pattern read in the CAIO skill (8a), not re-opened in `experiments/`.

### EX-AI-6: Reason lines state events from dates, the closed list carries a K-SUG line, and precedence has gaps

Severity: MINOR
Requirements: NS-53-R42, R12, R52, 6.4a, R47, R46
Finding: "From {child}'s birthday", "From {holiday}" and "From a month day for {child}" read as claims that the pictures are of the birthday or the holiday. Only the date is known; a lone photo of a work lunch on the birthday date gets "From Asha's birthday". RSN-SUGGEST ("A guess you can set aside") sits in the closed list although K-SUG is not built, so a phase 1 build could in principle emit it. The precedence list (marked, first, birthday, month day, holiday, kept, album, place, heart, video, day) omits RSN-YEAR, RSN-LETTER, RSN-PICKED, RSN-RUN and RSN-QUESTION, so a year-ago hearted day has no stated winner.
Proposed change: give `content` an intent of "On {child}'s birthday" and "On {holiday}" (a date fact, not an event); remove RSN-SUGGEST from phase 1 (a build test that the enum in the release profile lacks it); complete the precedence order; table-driven test with one predicate per reason and a property test that the shown reason's predicate is true and no higher-precedence predicate is true.
Evidence: 6.4a, R42, R47 read.

### EX-AI-7: A library card is both "pushSafe" and forbidden to list push

Severity: MINOR
Requirements: NS-53-R36, R130, 5.2, 13.1, RV-08, R132
Finding: R36 says "only S1, S2, S3, S6 and S7 are pushSafe" and, in the same row, that a test fails if the library source lists push. S7 is the library source. Section 5.2 and 13.1 say a library-timed note is phase 2 and needs counsel; R130 says no library source lists push without a signed decision id. Three statements, one of them opposite. A signal derived from machine grouping reaching a push is the path with the most privacy cost.
Proposed change: set S7 `pushSafe: false` in phase 1 in R36; keep R130 as the rule; the test fails the build if S7 lists push, email or widget without the decision id.
Evidence: R36, R130, 5.2, 13.1 read.

### EX-AI-8: Place and holiday names come from data outside the content pipeline

Severity: MINOR
Requirements: F7, NS-53-R52, R66, R63, O-33, RK-5, `packages/content/test/rules.test.ts`
Finding: F7 says machine-label words come from `packages/content`, and the content rules ban dashes, curly quotes and fear or loss language. A bundled place table brings thousands of names the content tests do not scan: curly apostrophes in names, diacritics, locale spelling (Lisbon or Lisboa), and some real place names that read as fear or loss language to a parent. The holiday table keys off the phone's region setting, which can differ from the family's life; the spec says it never claims the holiday is the parent's, but a wrong-region name still shows.
Proposed change: build the table through a script that normalises text and fails on a banned character; apply a reviewed allowlist or denylist for fear and loss words; fix one display language rule; extend `rules.test.ts` to scan the generated table; keep the dataset licence read (UNVERIFIED in the spec) as a gate item; show a holiday only when the per-holiday switch is on by default for the region and the label is a plain name from `content`.
Evidence: F7, R52, 7a.3, RK-5 read; no dataset exists to inspect, so the content of any given table is UNVERIFIED.

### EX-AI-9: No kill switch for machine labels, and a phase 1 door to the network geocoder

Severity: MINOR
Requirements: F8, 19.2 (K1 to K4, F3), NS-53-R62, R170, 7a.1
Finding: F8 promises "a kill switch can hide" labels. K1 to K4 hide the tab, the library read, library days and nudges, but none hides place and holiday labels alone, so a bad place table found after release means turning off the whole library read. Separately, 7a.1 says P-B can be in the first release "unless the founder signs G8 before submission", while R62 and 19.3 put it in phase 2; text leaving the phone to an outside service is a FOUNDER matter.
Proposed change: add K5 `machineLabels` (hides place and holiday lines, falls back to plain dates), narrowing only, delivered through the same signed config as K1; state that no signed config can switch a flag on (consistent with the F06 stance that a remote switch never turns a model pass on). Remove the "unless" clause in 7a.1: P-B is phase 2 and needs its own founder decision.
Evidence: F8, 19.2, R62, R170, 7a.1 read. The F06 stance is quoted from the CAIO skill (8a), not re-read in the PRD file.

### EX-AI-10: The forbidden-signal scan is a list of today's names, and the boundary runs one way

Severity: MINOR
Requirements: NS-53-R43, R68, R164, 7a.5, CR-040
Finding: R43 names a few frameworks (faces, scene, object, `Vision`, `CoreML`, `MediaPlayer`, `PHPerson`, geocoders). Apple ships more on-device ML, language, sound and generative frameworks, curated-library APIs and image-metadata readers; a scan of named symbols misses a new one. CR-040 (a) already asks that no OS framework do auto-crop or smart layouts on photos. The reverse boundary is also missing: nothing says the moments engine may not import `verify`, `EditType` or write to `raw_transcript`, or that nothing it makes can enter the `entry` write path.
Proposed change: invert the scan to an allowlist: `packages/core/src/moments` and `scribe-library` may import only the named modules; any other native or ML import fails the build. Add the reverse test: no import of the edit engine from moments, no `MachineLabel` type reachable from the capture save path. Confirm in the thumbnail request that no content-aware crop or face-aware option is used (UNVERIFIED for the OS thumbnail options; the spike checks it).
Evidence: R43, R68, R164, 7a.5 read; CR-040 read.

### EX-AI-11: The year-ago fragment is a machine cut of a parent's words

Severity: MINOR
Requirements: NS-53-R23, K-YEAR (6.4), NS-23-R2, S4
Finding: NS-23-R2 shows "a verbatim prefix of `final_text`, cut at a word boundary". A prefix can end on "We did not" or "I was so", and the card cannot show an ellipsis (banned character). The verifier refuses edits that change negation, tense or sentence type for exactly this reason (as listed in the CAIO skill, 8a; `verify.ts` not re-read here). The demo "We tried the blue spoon." works only because it is a whole sentence.
Proposed change: cut at a sentence end only; if the first sentence exceeds a length the design sets, show the date and the "A letter from this day" reason with no fragment, and open the letter. Add the golden: a letter whose first sentence contains a negation and exceeds the limit shows no fragment.
Evidence: R23, 6.4 K-YEAR row read; NS-23-R2 read at `docs/product/prd/10-reading-and-family.md` line 439; verifier behaviour UNVERIFIED by me against code.

### EX-AI-12: Faces and people are out, with one back door in phase 3

Severity: MINOR
Requirements: NS-53-R68, R82, R57, O-30, 7a.5, R164
Finding: The first release has no face or people path that I can find: smart and shared albums are never offered (R57), people and selfie signals are forbidden (R43, R68), and no row depends on O-30. The back door is Route A. Apple's suggestion groups are built by Apple's own ML (the spec's leads read this; I did not), so a group may rest on people or events, and R82 keeps only the assets, not the grouping. A card from Route A would be a machine event guess by another hand, and the "we do not infer" claim would stop being true for that card. No reason line exists for it.
Proposed change: Route A stays phase 3 and optional, and carries the K-SUG answer: if a Route A group shows as a card, it takes a plain reason ("Pictures you picked") and no Apple label, and the store and privacy claims are re-read first. Add a test that a Route A card has the same type as a parent pick.
Evidence: R82, R57, R68, 7a.5 read. How Apple forms suggestions: UNVERIFIED.

### EX-AI-13: AI law touchpoints

Severity: MINOR
Requirements: G2, G8, G9, RK-1, RK-2, NS-53-R175
Finding: Under US launch only (D-013 per the skill), my reading is that the first release triggers no AI-specific rule because it contains no model, but I have read none of the following this session, so each is UNVERIFIED and counsel confirms. (1) California AB 2013 (training data transparency) bites only if a generative or retrained model ships; none does in phase 1, and K-SUG or a fine-tune would reopen it. (2) The CCPA automated decisionmaking rules (compliance from 1 Jan 2027 per the skill's 31 Oct read) matter only if a model decides something about a person; choosing which day to show is not such a decision, and that stays true while nothing scores a person. (3) The EU AI Act is out of scope while there is no EU storefront. (4) Biometrics: CR-040, a secondary-sourced entry I read in the register, says no face detection, landmarking or recognition; the spec keeps that. (5) Reading precise location coordinates on the phone for a place name is not named in G2 as a question about sensitive precise geolocation categories; Apple 5.1.2(vi) and the label are covered (leads' findings, not re-read).
Proposed change: add to G2: "Is an on-device nearest-place lookup from a picture's coordinates, never sent, acceptable under the store rule and the state precise-geolocation definitions, and does the label stay accurate?" Add to the K-SUG decision (EX-AI-2) a counsel question on AB 2013 and children's image analysis. Record the date each source is read when counsel answers.
Evidence: CR-040 read at `docs/legal/compliance-register.md`. Everything else UNVERIFIED (named in the CAIO skill or the spec's lead findings; not opened here).

## Tests and evals I would require (summary)

- Card model type test: two disjoint fields, no free-text machine field, no coordinate field (R16, R61).
- L3 snapshots and G4 question for EX-AI-1.
- Golden `asha-lib-v1` plus the place edge cases of EX-AI-4, under `MOMENTS_RULES_VERSION`.
- Property tests: reason truth and precedence; order independence (R59); canary through every path (R162).
- Local real-library harness with bars written first (EX-AI-5, EX-AI-4).
- Allowlist import scan and reverse boundary test (EX-AI-10).
- Content scan of the generated place and holiday tables (EX-AI-8).

## Answers to the questions in section 25.11

- Is the engine truly rule-based in the first release, and is K-SUG correctly held back with G9? Rule-based and on the phone, by the spec's text (UNVERIFIED in code). K-SUG is held back in phase 1 but is still planned for phase 3; it should be removed (EX-AI-2).
- Does anything imply a machine writes, suggests or knows something? "From {child}'s birthday" and RSN-SUGGEST do (EX-AI-6); the unmarked place line may be read as the parent's words (EX-AI-1).
- Are faces and people out without a back door? Yes in phase 1; Route A is the one door to watch (EX-AI-12).

Chief AI Officer (Claude role)
