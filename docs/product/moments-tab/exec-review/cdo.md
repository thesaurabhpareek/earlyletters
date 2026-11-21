# Executive review: Moments tab master requirements (NS-53), Chief Data Officer

Reviewer: Chief Data Officer (Claude role). Not a lawyer or a privacy regulator; anything legal goes to the Chief Privacy Officer and counsel, and I mark it.
Date: 21 Nov 2026
Document reviewed: `docs/product/prd/28-moments-tab.md` on branch `wip/moments-prd` at 5bebd892, read in full (1187 lines, NS-53-R1 to R191, section 25.10 is my block).
Also read, to check the PRD against what exists: `docs/agents/exec/COUNCIL.md`, `docs/legal/DATA_CLASSIFICATION.md` (levels, 4.5, 4.6), `docs/analytics/TRACKING_PLAN.md` (0, 6.4, 6.5), `packages/analytics/src/catalog.ts` (header, `capture_started`), `docs/analytics/instrumentation/00-event-standard.md` (sections 1 to 4), `docs/adr/0032-on-device-sensitive-store.md`, `docs/DECISIONS.md` D-163.
Founder rulings of 21 Nov are taken as given: the library read ships in the first release; places and special occasions are in.

## Verdict: ACCEPT-WITH-CHANGES

The data design is better than most first drafts. The library part adds no server table, no coordinate is persisted, thumbnails are memory only, the card model has no free-text machine field, and every library-derived store is L4, phone-only and wiped on Turn off, Erase and sign-out. I can support the first release with the library read and places on that basis.

I cannot accept the analytics section (18, R167) as written, the retention mechanics of the new phone store (17), or the revoke behaviour (R77 against R113 and R115). They can be fixed in the document without changing scope.

### Conditions

Before the document is called done (docs changes):
- C1. Fix the analytics allowlist so no event fires on a date set by a child's birthday, a month day, a typed day or a ticked Day, and no event omission reveals library use (EX-CDO-1, 2, 4).
- C2. Restate section 18 and R167 against D-163 and the shipped catalogue conventions (EX-CDO-3, 5).
- C3. Give every phone-store field a retention clock, a cap and a pruning rule, and settle what a revoke does to the parent's own decisions (EX-CDO-7, 8).
- C4. Take the G3 default for O-13 and O-14: store no picture or album identifier in the first release (EX-CDO-9).
- C5. Add place table identity, versioning and a fail-closed quality rule (EX-CDO-10, 11).

Before F2 is turned on in the release profile (release gates, add to section 21):
- C6. The inventory rows exist: `DATA_CLASSIFICATION.md` 4.6 rows for the phone store, and the data map once it lands, in the same PR as the code (EX-CDO-6).
- C7. The place and holiday tables have a read-out for licence, size, accuracy and expiry (EX-CDO-10, 11, 13).

Phase 2 server fact (EX-CDO-14) is acceptable only in the minimised shape given there.

### Counts

1 BLOCKER, 11 MAJOR, 6 MINOR. 18 findings.

## What holds, and I would not change

- No server table, column, RPC or sync op for the library part (R116, 17 first line). Right answer, and the cheapest.
- Coordinates, place ids for the window, the home place and thumbnails are memory only (10.1, 17). Persisted library-derived data is limited to the decisions store.
- Everything persisted is L4 and outside `scribe.db` (ADR 0032 pattern), excluded from backup, read back, wiped first on sign-out (R115). Highest-wins and derived-inherits (DATA_CLASSIFICATION 1.1 rules 1, 2, 6) are applied correctly.
- Ranking has no score, no dwell, no tap history (7.3, R54). That is also what keeps this out of Apple 5.1.2(vi) and out of my "data mining" anti-pattern.
- R162 asks for a canary through every path (primer, Recent, picker, push, email) with zero hits in logs, breadcrumbs, crash payloads, analytics and URLs. That is the right test shape (a rule is a wish until a test fails).
- "No provenance on the wire" (13.2 item 4) and no database field recording that a letter began from a moment (R87, R114).
- The lifecycle email takes only server-held facts and never typed days (C-3, R140, R188).

## Findings

### EX-CDO-1. BLOCKER. Card-kind events fire on dates that leak birth day, tradition and typed days

Requirements: NS-53-R167, section 18 table (`ui.moments_card.impressed` and `.tapped`, `kind`: occasion, day, age_day, year_ago, prompt, picked_picture), TRACKING_PLAN 6.4.

Finding: an impression or tap of a card with `kind: age_day` fires on the child's month day. `kind: occasion` fires on the birthday. `kind: day` fires on a typed or ticked date. An event timestamp is data. TRACKING_PLAN 6.4 says "No event may fire at a time determined by a child's birthday or due date", the catalogue header says the same, and `docs/analytics/TRACKING_PLAN.md` section 2 excludes "month-age notes, birthday notes". The test that enforces it bans event names, not property values, so it will not catch this. A series of `age_day` impressions for one analytics id gives the day of month of the birth (L4, DATA_CLASSIFICATION rule 6) within a few observations. `kind: day` is worse than the PRD says: ADR 0032 records that the days store holds tradition and faith-related choices (L4), so a `day` impression on a ticked Day discloses a tradition on its date.

Proposed change: remove `occasion`, `age_day` and `day` from the closed kind list, and do not emit impressions or taps for any Today-slot card at all (the slot is absent unless a dated fact exists, so presence is the leak). Keep slot-level events only where the slot is dated by something other than the child or the parent's marked days: `look_back` (letter only, see EX-CDO-4) and `question`. Add a catalogue test that fails on any property value in a list of timing-leak values, not only on event names. Say in section 18 that the start-through rate for dated cards cannot be measured and accept that blind spot.

Evidence: PRD lines 828 to 839 and 843 read; TRACKING_PLAN 6.4 (line 346 to 347) and section 2 line 80 read; catalog.ts header read; ADR 0032 Context read.

### EX-CDO-2. MAJOR. R87 and goal G-2 contradict each other on `source: moment`

Requirements: NS-53-R87, NS-53-R83, G-2 (2.1), section 18 row `capture.letter.started`, MT-P4-R4.

Finding: G-2 says we would know the goal is met from "letters started with `source: moment` among opted-in analytics users". R87 says no log, breadcrumb or analytics event records that a letter began from a moment, and that `capture_started` with source `moment` "sends nothing that says so". Section 18 hands the decision to MT-P4-R4. The PRD cannot hold G-2 and R87 together. The shipped `capture_started.source` enum is `tonight | book | notification | make_it_yours | resurface` (catalog.ts line 451), so adding `moment` is a catalogue change and a `SCHEMA_VERSION` bump under TRACKING_PLAN 6.5.

Proposed change: I rule for sending `source: moment`. It is an L2 entry-point enum, shared by every Moments card (prompt, typed day, library day alike), so it carries no library fact. Reword R87 to: no database column, log line or breadcrumb records it; the one analytics enum is permitted. Keep R87's ban for the server: no `entries.source`, no sync field, no insights column. Add a rule that no attach or photo event may carry `source`, because `source: moment` joined to a photo-attached event would single out library days (the Home "Start from a photo" path would otherwise be the only other source of that join). Bump `SCHEMA_VERSION` in the same PR; adding an event is the founder's while analytics is gated (D-163 item 5d), so this goes to him with the change.

Evidence: PRD lines 49, 485, 835; catalog.ts lines 444 to 453; TRACKING_PLAN 6.5.

### EX-CDO-3. MAJOR. Section 18 and R167 are written for analytics off everywhere; D-163 changed that for the production build

Requirements: section 18 intro, NS-53-R167, NS-53-R87 (consent clause), MT-P5-R24, RV-16.

Finding: section 18 says analytics is "off at 1.0 (consent off everywhere; MT-P5-R24)" and R167 requires "0 events are sent and none queued" when analytics is off or consent not given. D-163 (founder, 20 Nov; recorded 21 Nov) supersedes D-095 for the production build only and says page-view, click and impression instrumentation is collected for every user, not behind an opt-in. It leaves the consent default, counsel's view and the production flip open, with the flag off until its gates close. The first store submission is the production profile (17 last paragraph). So the Moments events may run with no consent ask in the first release, which is the case the PRD does not address. Every "after consent" statement in 18 and in the TRACKING_PLAN promise "opt-in only" is in tension with D-163 and neither document says which wins.

Proposed change: state in section 18 that the Moments events follow whichever consent default the founder rules under D-163, and write R167 as: with the flag off or without the lawful basis for that profile, 0 events sent or queued; with it on, only the closed list below. Remove "consent not given" as the only gate. Do not decide the default here; it is the founder's (my skill, section 4). Content-free, closed allowlist, registry as the only send path, no autocapture and no replay still bind (D-163 item 5c to 5e), and they are the reason EX-CDO-1 matters more under D-163, because more people would be in the stream.

Evidence: PRD lines 828, 843, 917; DECISIONS.md D-163 (lines 1187 to 1200) read.

### EX-CDO-4. MAJOR. The kind list can reveal library use by what it omits, and `year_ago` is ambiguous

Requirements: section 18 table, R167, NS-53-R47, R36, RSN-YEAR.

Finding: two separate problems.
(a) `year_ago` appears in the event `kind` list, but a year-ago card exists in two forms: a letter (RSN-LETTER, not a library fact) and pictures from a date a year earlier (RSN-YEAR, a library fact, R47). The PRD says "a library card never emits" but does not say which `year_ago` it means.
(b) Library cards emit nothing, while every other card emits. Per analytics id, a For you list that has a pictures-slot card but no matching event stream tells a reader that the phone has library access. The PRD excludes the permission result as an event (O-18) for exactly this reason, and an omission is the same fact.

Proposed change: replace `kind` with a `slot` enum (`look_back`, `question`, and after EX-CDO-1 nothing else), defined by position and not by source, with `year_ago` limited to letters in the registry row. The pictures slot is filled either by a library day or by the system-picker row (6.3), so the same slot value would be emitted by both and says nothing about access. In practice that means no pictures-slot events at all; say so and accept it. Add a test that no event is emitted or suppressed depending on a library state.

Evidence: PRD lines 249, 233 to 237, 323, 833, 839; 6.3 read.

### EX-CDO-5. MINOR. The proposed event names and properties do not match the catalogue or the event standard

Requirements: section 18 table, `perf.moments_first_paint.measured`, `system.error.raised`, `screen.moments_home.viewed`.

Finding: (a) `perf.*` has exactly two permitted properties, `ms_bucket` and `is_ok` (00-event-standard section 4). The PRD proposes `budget_band` and `device_tier`. A `device_tier` is also a new device-class property with no catalogue entry and no level. (b) The standard says a dynamic list is one element id, so `ui.moments_card.*` must have registered element ids, not a free `kind` property. (c) The standard is PROPOSED and the shipped catalogue uses `screen_view`, `capture_started`; the PRD uses dotted names without saying it depends on the standard landing. (d) Missing: the day sheet `moments/pick` screen id and the primer sheet need registry rows. (e) `system.error.raised` `code` values `library_unreadable` and `picker_unavailable` are fine, but each needs a level and must not carry a path or id (R110 already says so).

Proposed change: use `ms_bucket` and `is_ok` only; drop `device_tier` (the build_kind and the OS version in the SDK already cover it, and a device tier is a fingerprinting aid for no decision); register element and screen ids in `ids.ts`; state that the events are written to the standard and renamed if it changes. A new area is not needed: `moments` is not on the 9-area list (`onboarding, capture, book, family, keeping, me, plus, notifications, system`), so the `area: moments` in `system.error.raised` needs a CPO ruling or must use `system`.

Evidence: PRD lines 832 to 837; 00-event-standard sections 1, 3, 4 read.

### EX-CDO-6. MAJOR. The inventory is not written and the first release would add a new class of phone store with no data-map row

Requirements: NS-53-R116, NS-53-R162, NS-53-R113, section 17, section 10.2, section 21 (no gate names the inventory).

Finding: R116 and R162 say each field "is classed against `DATA_CLASSIFICATION.md`". It is not: section 4.6 has no row for the decisions store, the place keys or the primer flag. `docs/legal/data-map.yaml` and `scripts/check-data-map.mjs` do not exist on this branch (my skill lists PR #37 as open; I did not re-check it today, UNVERIFIED), so DQ-R02 and DQ-R03 are not enforced and the inventory is a document, which my anti-patterns call a wish. ADR 0032 is Proposed and names two files (a days store and a moments index). The PRD uses one `moments.json` that also holds place keys, hidden days, corrections and labels. That is a different file class from the one the ADR covers, and the ADR says the classification row stays founder-merged.

Proposed change: add a gate G11 to section 21: "inventory", owner `data-architect`, pass means rows in `DATA_CLASSIFICATION.md` 4.6 (and the data map row if it has landed) for the decisions store with every field, level, retention, deletion path and deletion test, merged in the same PR as the code. Amend ADR 0032 (or a new ADR) to say what one decisions store holds, since two sources of truth for that file would drift. Name the single reader module and an import-boundary test, as ADR 0032 item 7 does for the days store.

Evidence: PRD lines 550, 805 to 814, 820; DATA_CLASSIFICATION section 4.6 read (no moments rows); `ls` of `docs/legal/data-map.yaml` and `scripts/check-data-map.mjs` returned no such file; ADR 0032 read.

### EX-CDO-7. MAJOR. The phone store has retention "until the parent removes it" with no cap, no expiry and no pruning

Requirements: section 17 table (retention column), NS-53-R29, R54, R55, R56, R65, R66, RV-20, O-35.

Finding: every row in the decisions store says "Until the parent removes it". Nothing prunes. (a) "Not now" is "until tomorrow" (R28) but the store holds a day key; nothing says the key is deleted after that day. (b) "Not this one" for a day key is permanent by design, but a day key outside the scan window and not in the Photos library any more (pictures deleted) never matches anything again and stays for ever. (c) The file has no size cap, so a parent who hides many days or names many days grows an unbounded L4 file. (d) "Name this day" labels and "Keep this day close" keys have no ceiling. (e) O-35 ("every year" recurrence for typed days, ticked Days and firsts) changes the typed-day retention from "deleted the day after" (S1, NS-18-R5) to indefinite, and no row records the new clock or its deletion test. A retention period written in a doc with no code that enforces it is my first anti-pattern.

Proposed change: add to section 17, per field: expiry rule, a maximum count (ASSUMED value as data, set by G1), and the code that prunes it, with a test that fails without it. Concretely: "Not now" keys expire at the next local midnight and are removed at the next focus; day keys whose date is older than the library window and that match no pictures are removed at foreground (only under Full access, see EX-CDO-8); labels and close-keys are capped with a plain "That is all this list holds" line (no count shown, per the no-count rule). For O-35, record the new retention for typed days and firsts in the classification row and test deletion on Turn off, Erase and sign-out.

Evidence: PRD lines 273, 805 to 810, 327 to 336, 372 and section 23 (O-35) read; DATA_CLASSIFICATION 4.6 read.

### EX-CDO-8. MAJOR. Revoke deletes the parent's own decisions, and three rows disagree about it

Requirements: NS-53-R77, R113, R115, R65, R29, section 10.1 step 12, U17, ACC-3.

Finding: R77 says a downgrade "empties the on-phone data at once". R115 says Pause "keeps only dismissed day keys" and that downgrading in Settings empties the same data. R113 says "the dismissal state is the only unrebuildable data". If a revoke empties the dismissal keys, a parent who revoked access, or whose Limited selection changed, silently loses every "Not this one", "Hide this day" and "Hide this place", and the days and places they chose to hide come back on re-grant. For a hidden place, that is the day they hid a place of loss. The three rows cannot all hold. Limited access adds a second case: a key for a day outside the current Limited set looks "orphaned" and would be pruned by the rule in EX-CDO-7, then be wrong when the parent widens the selection.

Proposed change: define three operations and their effect on each field: (1) Revoke or downgrade (a state change the parent may undo): drop everything library-derived that is rebuildable (index, place ids, thumbnails), keep dismissal keys and hidden-place keys inside the file but do not read them without access; (2) Turn off in Me: parent's explicit choice, delete all (as written); (3) Erase and sign-out: delete all. Prune only under Full access and never under Limited. The Privacy Officer decides whether keeping dismissal keys through a revoke is acceptable (they are L4 and derived from the library); I recommend it, because the alternative destroys a parent's choices without telling them. If she says no, then say plainly in Shown, Records, Never and Decline (8.5) that a revoke forgets what the parent hid.

Evidence: PRD lines 456, 547, 549, 530, 606, 607 read.

### EX-CDO-9. MAJOR. Do not store a picture or album identifier in the first release (O-13, O-14)

Requirements: NS-53-R56, R57, O-13, O-14, G3, 7.4, section 17 row 3, MT-X5-R1 and R3.

Finding: this is the only row-level library identifier the phone would persist (everything else is a day key). The PRD itself says the default for G3 is "store none and ship Not this one only" (line 908) and that "no stored id is safest" (RV-12), yet the O-13 default is Yes and R56 is P0. Costs I can name: PhotoKit local identifiers are specific to a phone and are not stable across a restore (U17, a new phone starts off), so the key would silently stop matching; a Limited selection that changes hides the asset, so a "left out" id cannot be told from a deleted asset (EX-CDO-7); the album identifier plus a title shown verbatim stores a parent-chosen album name (free text derived from the library, L4); and a left-out picture id is an indexed fact about the content of a specific picture, which my skill rates as L4 on its face. The benefit is cleaning a receipt day, and "Not this one" already removes that day.

Proposed change: first release ships "Not this one" and "Hide this day" only. Remove R56 and R57 from phase 1 and mark them phase 2 behind G3. If the founder wants them anyway: cap the count, store only the identifier (never a name), prune only under Full access, and record the restore behaviour in the classification row. Counter-view for the record: the Product lead wants receipt days cleanable on day one (O-13 note). I would answer that a receipt day does not qualify for Recent unless it meets the busy tier (7.2), and one tap hides it.

Evidence: PRD lines 307, 332, 333, 480, 808 to 810, 908, 99 (RV-12) and section 23 (O-13, O-14) read; PhotoKit identifier behaviour across restore is UNVERIFIED (not read; the device spike G1 should confirm).

### EX-CDO-10. MAJOR. Place keys must be stable across table versions, and the table needs an identity

Requirements: NS-53-R61, R63, R64, R65, section 7a.1, 7a.2 item 6, U24, U25, RK-5, G1.

Finding: "Hide this place" stores a local place key. The PRD does not say what the key is. If it is a row number or an internal id of the bundled table, the next app release that updates the table can renumber it, and a place the parent chose to hide, possibly a place of loss (U24), comes back on a card with no warning. A resurfaced painful place is worse than a missing pretty one. The table also has no stated source, licence, version, checksum, size or update path (RK-5 says licence UNVERIFIED), and nothing says what happens to old keys when an entry is removed or merged (two cities merge, a name changes).

Proposed change: add to 7a.1 and R61: the table carries a version, a checksum verified at load (fail closed to "no place" on mismatch), and a stable external id per entry (a public gazetteer id, not a row index); keys store that id; a migration test fails if a table update drops an id that any key references without a mapping; a removed entry keeps hiding (map to its successor or to a tombstone that still suppresses). The dataset licence and attribution duty are a G1 and G2 read-out item; I did not read any dataset licence (UNVERIFIED). The table is public data and L1, but its names are words the product shows: say whether they are owned by `content` (CLAUDE.md says every word the product says lives in `packages/content`) or are data, and in which locale they render, because a language is L4 for a person and a card that renders "Lisboa" for one parent and "Lisbon" for another is derived from the parent's device locale.

Evidence: PRD lines 348 to 364, 388, 392, 614, 932 read.

### EX-CDO-11. MAJOR. A wrong place has no fail-closed rule and no quality measure

Requirements: NS-53-R61, R63, R64, R42, U23, U26, E7, G1, G4, RK-3.

Finding: the PRD fixes the failure modes of the nearest-place rule only by "radius ASSUMED, the spike fixes it". Quality cases that need a stated rule, none of which is in the golden set (fixture F01 to F20 has no coordinates; the Lisbon and Seattle examples are the only place cases): (a) a picture in open country is assigned to the nearest big city kilometres away, the most common wrong answer from a nearest-entry rule; (b) coordinates (0,0) or another placeholder written by some apps and imports; (c) pictures received from other people that carry their location; (d) a border or an island where the nearest entry is in another country; (e) a day with two places and one dominant (R63 ties give none, but 5 against 4 gives a place on thin evidence); (f) a stay card (R64) whose days each resolve to one place by majority of different pictures. "None beats wrong" is the fail-closed rule (DQ-R06, DQ-R07), and it is stated nowhere. The PRD measures place quality with nothing: G1 says "accuracy" and G4 is a five-parent card sort of feel.

Proposed change: add to R61 and R63: a place is shown only if the nearest entry is within the radius, the second nearest is farther by a margin (as data), the majority share is above a threshold (as data) and the coordinate is valid and not a known placeholder; otherwise none. Add synthetic coordinate cases for (a) to (f) to the golden set with expected "none". G1 reports precision as rates (share of sampled pictures given a place that a human judged right), measured on the founder's phone with a read-out that contains only rates and no place names or pictures (H-8, `no-real-family-data`). Success and failure thresholds are the Product lead's and set before the run, not after.

Evidence: PRD lines 288, 356 to 364, 388 to 391, 613, 906, 909 read; synthetic fixture has no coordinate cases beyond 7a.2 (line 364).

### EX-CDO-12. MINOR. The home place correction is a persisted location fact the PRD says is not persisted

Requirements: NS-53-R63, 7a.2 item 3, section 17 row 2, O-34.

Finding: R63 says the home place is computed in memory only and never named to the parent. 7a.2 item 3 says the parent can correct it ("This is where we live") and the correction is a local key. That key states the family's home city, the most identifying place fact in the product, and section 17 files it under "hidden-place keys and place corrections" as if it were the same kind of thing. It is L4, local, and not a risk the PRD hides, but it is not the same data as a hidden-place key and the rows say otherwise.

Proposed change: list it as its own row in 17 and in the classification row, with the same wipe rules, no export, no backup, and a cap of one value per book. The O-34 default (show a place only when away) is the right default for data too: it means most cards need no place at all.

Evidence: PRD lines 358, 808, 390 read.

### EX-CDO-13. MINOR. Public holiday and occasion data have no source, version or expiry

Requirements: NS-53-R66, 7a.3, RSN-HOLIDAY, O-33, NS-53-R22, K-AGE.

Finding: public holidays "from a shipped table keyed by date and by the phone's region setting". Nothing says where the table comes from, how many years it covers, who maintains it, what happens when the table runs out (silent absence in a year nobody tested), how observed dates are treated (a Saturday holiday observed on Friday), or what the region key reads (the phone's region, so a traveller gets another country's civic days; US storefront only at launch makes this rare, not impossible). The month-day and birthday rules are in R22 and are fine; the golden set (R59) covers them.

Proposed change: add an expiry check (a test that fails when the table covers less than the current year plus one at build time, and a runtime rule that shows nothing, not a wrong date, beyond the covered years), a source and licence line, observed-date handling, and a rule that a table of a region the family has not used is never read. Keep the per-holiday switch as written.

Evidence: PRD lines 108, 373, 267, 335 read.

### EX-CDO-14. MAJOR. The one server fact (phase 2): accept in a smaller shape, classed L4

Requirements: NS-53-R140, R141, R142, R188, 13.6, section 17 last row, RV-09, O-03, X6 Tier 4b.

Finding: the PRD allows one server row for the lifecycle email: id, date, repeat flag, channel, plus the PRIV-R21 consent row. I accept the principle (a date the parent confirms, no library or typed-day content) and prefer it to emailing from the child's date of birth, which would hand the birth date to the email processor through send timing. Changes:
(a) Level. Section 17 says "L2 and L4 as classed in X6", which is not a classification. A parent-chosen date for "remind me about this day" is in practice a date in the child's life (a birthday, a first), and the row is keyed to a person. By DATA_CLASSIFICATION rules 1, 6 and 7, the date is L4 and the row, with the account id, L3. Not L2.
(b) Fields. With a repeat flag the year of origin is not needed: store the next send date (or month and day) and the flag, not the date the occasion happened. Drop `channel` while email is the only channel (a column with one value is a future leak path). No `child_id`, no kind, no label in phase 1, as the PRD says.
(c) Retention as code. "Hard delete at once on request" is a promise about the primary table. Deleted rows live in database backups until they roll off, and erasure records are kept until the book or account is deleted (D-111). Say both, with counsel. Add clocks: a one-off row is deleted a set number of days after its send date; a repeat row is deleted after a set period with no letter in the account (values to be proposed to the founder; I have not set them, because retention periods are his).
(d) Tracking. Turn off open and click tracking for these emails at the provider; a tracking pixel in a lifecycle email is a collection channel the PRD does not mention (provider behaviour UNVERIFIED, not read).
(e) Mechanics. The migration ships its own grants and a line in `supabase/tests/grants.mjs` (CLAUDE.md), column level comments (DQ-R01), an access matrix test (R142), and a deletion test. If the founder wants to know whether the email helps, the only metric is a k = 10 count view in `insights` of opted-in rows, counts only; no per-account output.
(f) R116 says no server table is added by this tab, in a P0 phase 1 row. Scope it to phase 1 so the two rows do not contradict.

Proposed change: amend 17 last row, R140 and R116 as above.

Evidence: PRD lines 696, 698, 814, 550, 672 to 673 read; DATA_CLASSIFICATION 1.1 rules 1, 6, 7 read; CLAUDE.md grants rule read; D-111 as recorded in my skill (not re-read in DECISIONS.md, UNVERIFIED).

### EX-CDO-15. MAJOR. How the daily-return hypothesis is read without library data

Requirements: section 20 (E2, E4), G-2, 4.4, O-04, R168, R174, R167.

Finding: the PRD says honestly that daily return is a HYPOTHESIS with no evidence and that thresholds are anecdotes under n = 20. I agree. It does not say what instrument reads it, so here is what we can and cannot read.

With analytics off at 1.0, in the world D-095 describes: nothing in the app reports a Moments open. The server holds the letters (and the weekly keeping families view, `insights.weekly_keeping_families`), but a server count cannot be attributed to Moments, and the PRD correctly bans a server field that says a letter began from a moment (R87, R114). I will not add one. E2 (two TestFlight builds with the tab on and off) can only be read from the server if the build is known to it; I did not find that the insights views carry an app version, so this is UNVERIFIED and I recommend not adding one for n under 20. So at 1.0 with analytics off the instruments are the five-parent diary (E4) and moderated sessions (E1, E7), recorded "x of n". That is an anecdote, and the PRD says so. I would not build anything to make it look like more.

With analytics on under D-163 (consent default open, EX-CDO-3), the daily-return question can be answered from content-free events, after EX-CDO-1 and 4: for each random analytics id, the number of distinct local days in a week with `screen.moments_home.viewed` and with `via` in (`tab`, `control`, `back`) rather than `system` or a notification landing; as a share of ids with an `app_opened` that week. Do not use a streak definition and never show it to a parent (C-REQ-015, and the "no streaks" content rule). Start-through: `capture.letter.started` with `source: moment` over Moments views, same week. Define each metric in the registry row with its denominator and name the blind spots every time it is quoted: only ids that are in the stream (consent default or lack of it), only people who opened the app, and no library information, so a parent who has the library on cannot be told from one who does not.

Proposed change: add to section 20 an instrument table: metric, definition, denominator, who is missing, minimum n (20 per group before any percentage, as R168 says). Add to O-04 the recommendation that the claim stays a hypothesis and that nothing is built to measure it at 1.0 beyond the diary.

Evidence: PRD lines 880 to 894, 49, 485, 550 read; TRACKING_PLAN section 1 metrics and section 2 table read; the absence of app version in insights views is UNVERIFIED (I did not read the migration `20261004300000_insights_aggregates.sql` for it).

### EX-CDO-16. MINOR. Coordinates reach the JavaScript heap

Requirements: NS-53-R37, R61, 10.1 steps 1 and 3a, section 17 row 6.

Finding: step 1 returns coordinates from the native module in typed arrays, and the place resolver is in `packages/core` (TypeScript) at step 3a. So coordinates enter the JS heap, pass through function calls and may sit in a debugger state, an error context or a memory report. The PRD guards the end (a type test, a scan, a canary), which is good, but the smaller exposure is to resolve in the native module and return place ids only.

Proposed change: ask `mobile` and the CISO whether the place table lookup can run natively in `scribe-library` and return a place id per asset, so coordinates never leave Swift. If the pure-TypeScript core is needed for tests, keep the same function behind a source interface (`fixtureSource` already exists) and test the arithmetic there. I leave the architecture to the CTO and CISO; this is the minimisation preference of the data seat.

Evidence: PRD lines 517, 519, 356, 812 read.

### EX-CDO-17. MINOR. Parent-typed labels are the parent's words in a store with the weakest durability, and the file key is a person id

Requirements: NS-53-R55, R103, R105, U17, section 17 row 1, ADR 0032 item 3.

Finding: "Name this day" (60 characters) and the parent's typed place (P-C) are the parent's own words. They live only in the decisions file, which is excluded from backup (17), absent from export (R103) and wiped by Turn off, Erase and sign-out. On a new phone or after a restore (U17) the parent loses them without a message. That may be the right trade for a disposable aid, but the constitution says the product never discards a person's words lightly, and nothing in Shown, Records, Never and Decline tells the parent labels are phone-only and not backed up. Separately, ADR 0032 keys the file by owner; if the key is the profile id (L3, rule 4), a file path or name containing it carries an L3 value.

Proposed change: either say in the 8.5 lines that names the parent types here stay on this phone only and are not in a backup or the export, or include them in the export file as a labelled section (decision for Product and the Privacy Officer; I lean to the plain statement, because the export format is a promise). Use an opaque local owner token rather than the profile id in file names and paths, and check that the data map row says so.

Evidence: PRD lines 331, 501, 607, 807, 439 to 442; ADR 0032 decision 3; DATA_CLASSIFICATION 1.1 rule 4 read.

### EX-CDO-18. MINOR. Fixtures and the G1 read-out need explicit handling for real data

Requirements: NS-53-R59, R107, R162, R176, G1, section 6.1.

Finding: the PRD uses synthetic data throughout and bans real family data (H-8). Two gaps: (a) G1 runs on "the founder's phone" with a real library; the read-out is a release-record document in `docs/release/<x.y.z>.md`, a public-repo file, and it must carry device numbers only, never a place, a date or a count that came from his library. The PRD states "device numbers" but not the ban. (b) The canary in R162 lists asset id, album, date, coordinate and filename; it should also include a place name, a place id, a parent label and a day key, since those are the new fields.

Proposed change: add one line to G1 and G7 that the read-out holds timings and rates only and fails review if it names a place, date, count of pictures or album; extend the R162 canary list. Synthetic coordinates in `asha-lib-v1` should not be near any real family's home (a cheap check that the fixture coordinates are on a published list of synthetic points).

Evidence: PRD lines 221, 820, 906, 912, 922 read.

## Answers to the two questions in 25.10

1. Is the classification (17) right, is the only new server data minimal, and is the analytics allowlist enough to learn anything without library facts?
   - Classification: right for the library-derived rows (L4, phone-only). Wrong or missing for the home place correction (EX-CDO-12), the server row (L4 date, L3 row, EX-CDO-14), and the primer flag, which is fine as L2. Not yet written into the inventory (EX-CDO-6).
   - Server data: acceptable only in the smaller shape (EX-CDO-14).
   - Analytics: the allowlist as written learns something (tab views, ask taps, start-through) but leaks dates (EX-CDO-1) and library use by omission (EX-CDO-4). After the fixes it learns three things: whether the tab is opened and from where, whether people start letters from it, and whether the empty state fails (errors). It will not tell us whether library days help; only parents can, through the card sort.
2. How would we read the daily-return hypothesis with analytics off at 1.0? We would not, beyond the diary and moderated sessions (EX-CDO-15). I recommend we say so and keep the claim a hypothesis.

## Blind spots that remain after these changes

- Any analytics number covers only ids in the stream (consent default open under D-163) and only people who opened the app.
- Server counts see only synced letters; letters kept on a phone only are invisible.
- Nothing from the library, by design, so a rate for "library days" cannot be computed and no one should try.
- Place quality is judged by a sample of one phone and five parents; it is an anecdote until n is larger.

## Items for the main session to consider saving to memory

None from this review that is a stable fact about the user.

Chief Data Officer (Claude role)
