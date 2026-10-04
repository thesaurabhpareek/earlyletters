# Q-013: Machine-written notes versus the constitution (quiet day, "nobody spoke", ghost salutation)

Numbering: the request called this Q-011, but Q-011 and Q-012 are already taken in `docs/agents/DEBATES.md` on develop (backlog-consolidation, mobile-polish). This entry takes the next free number. Nothing else in DEBATES.md is changed.

- **Raised by:** screen critiques on `origin/qa/journey-flows` (`docs/release/journey/critiques/product.md` issue 2, `design.md` issue 5; steps J08-02, J08-03, J09-05, J10-10).
- **Status:** Escalated to the founder (it touches the constitution, D-057 and what a printed book may contain).
- **Read first:** `CLAUDE.md` (constitution), D-057 and D-074 in `docs/DECISIONS.md` on develop, D-051 on `origin/main` (develop has a different D-051; the ids collide across branches, so this file says "D-051 (main)").

## 1. The question

Three places show words the person never said, in the parent's own style or under the parent's signature. Which should the app do?

## 2. Facts (read in the code on origin/develop, cfdca3f)

**Quiet day ("Not much today").**
1. Tapping it saves a normal entry: `kind: 'not_much'`, `rawTranscript` and `finalText` both set to the template sentence, `captureMode: 'typed'`, `inBook: false` (`apps/mobile/src/app/(tabs)/index.tsx:94-116`). Template: `"{weekday}. Not much today. Just {child}, and us, and an ordinary day."` (`packages/content/src/strings.en.ts:240`; the request cited line 232, develop has it at 240).
2. `strings.en.ts:241-244` also holds three unused alternates. One says "Tired tonight. Loved {child} all day anyway." That asserts a feeling nobody reported. They are dead copy today, but the pattern invites use.
3. The Book tab lists every entry with no kind filter (`components/book/chapters.ts:35-52`, `(tabs)/book.tsx:46`). The card shows the sentence in letter type and the line "From {signsAs}" (`components/book/letter-card.tsx:44-51,67`), with a Private chip. So a machine sentence reads as said by the parent. The J08-03 step note "it never appears in the book" is wrong.
4. The chapter count line counts a quiet day as a "note" (`chapters.ts:57-58`: notes = entries minus letters). That counts a day the person chose not to write.
5. The letter page menu has "Move to Book" for any entry, with no kind check (`app/letter/[id].tsx:136-139,214`; no `kind` appears in that file). Once moved, the sentence enters Read together (`read-together.tsx:48` filters only `inBook`) and the printed book (`export/build.logic.ts:310` filters only `inBook`, not empty, not waiting). The printed back cover promises letters "kept exactly as they said it" (`packages/content/src/book.en.ts:14`).
6. Export writes the sentence as `final_text` with `kind: 'not_much'` (`build.logic.ts:468`, schema `export/schema.ts:193`) and shows it with a signature in the browsable HTML (`build.logic.ts:256-262`).
7. Already correct: analytics, free-letter counts and deletion counts skip `not_much` (`lib/analytics/index.ts:107`, `ask.ts:48`, `account-deletion/use-account-deletion.ts:24`, `book.tsx:57`, insights SQL `20261004300000_insights_aggregates.sql:96`; TRACKING_PLAN.md:288 defines a letter as "not 'Not much today'").
8. Our own design docs already say this feature "marks today without writing anything" (`docs/design/COMPONENTS.md:428`), "Not much today in one tap. No counters or badges" (`packages/content/BRAND.md:40`), "One tap to Not much today is a complete answer" (`VOICE.md:61`). The code is the outlier.

**"Nobody spoke."** A spoken letter with empty words shows `"A quiet recording. Nobody spoke, and it is kept just as it is."` (`components/book/copy.ts:9`) in the italic `signature` text style (the same style as the parent's signature) on the card, the letter page (`letter/[id].tsx:172-174`) and Read together (`read-together.tsx:155-158`), followed by "From {signsAs}". It is not stored; it is a true statement about the file. The printed book already skips empty letters. Weakness: "nobody spoke" can be wrong, because the recording may hold laughing or babble.

**Ghost salutation.** The Write screen placeholder is `"Dear {child},"` in the letter field (`strings.en.ts:202`, `app/write.tsx:130`). It is not saved. It does prescribe a form, and it sits in the field where the person's own words go.

**Data.** `entries.kind` check allows `note|letter|not_much` (`supabase/migrations/20260930000000_scribe_core.sql:124`). `raw_transcript` is immutable by trigger (`entries_guard_immutable`, core sql:195-205, replaced in `20261002020000_data_governance.sql`); `raw_sha256` is computed on insert (data_governance sql:111-124). `final_text` may change and each change is versioned (`entries_record_version`, core sql:208-217). `raw_transcript` is `not null` but `''` is legal; `final_text` is `not null` with only a max length. Local SQLite has `kind TEXT NOT NULL` (`lib/db/migrations.ts:65`).

**Decided already.** The constitution: the machine may remove and repair, never add meaning; no feature writes a person's words (`CLAUDE.md`). D-057: typed text is never rewritten. D-074: the feature is "Word for word". D-051 (main): first 2 letters per account free, then Plus; its open edges 1 to 8 do not say whether a quiet day counts. Content rules: no gap counting, no streaks, never imply AI writes anything, never gender the child.

**Open.** What the marker looks like, whether it prints, whether it counts toward the 2 free letters, whether to offer "add a few words".

## 3. Options, argued

### (a) Keep the sentence, label it as the app's note, unsigned, visually distinct

- **Product:** the warmth lands; a tired parent sees something kind come back. A grandparent sees a day that was held.
- **Design:** one distinct "app voice" style (small, muted, sans, no signature) also fixes "nobody spoke".
- **Content:** the sentence is gentle and already passes the content rules.
- **Red team:** (1) The constitution's wording is "no feature may write ... a person's words"; a labelled app note dodges the letter of it, not the point, which is that the Book stays a record of what people said. (2) The sentence still adds meaning: "just {child}, and us" claims who was there and that the day was ordinary. A single parent, a night shift, a hospital day: false. (3) The alternates show where this goes: invented feelings. (4) It is still in the print and export unless filtered, so a back cover that says "kept exactly as they said it" sits next to a line nobody said. (5) Screen readers read it as content. (6) Needs an "app note" label in every language (D-056) and in the export schema.

### (b) Store a marker with no sentence; show a calm date mark

- **Product:** matches the spec in COMPONENTS.md:428 and BRAND.md:40. Zero words to defend. The one-tap promise survives.
- **Design:** a small row (date plus "A quiet day"), not a card. It reads as a mark on the calendar, which is what it is.
- **Content:** one short app label, unsigned, in `packages/content`.
- **Legal/privacy:** less personal text stored, nothing new in analytics.
- **Engineering:** small. Kind already exists; stop writing text; render by kind; guard four places.
- **Red team:** (1) Less warm than a sentence. Mitigation: the toast "Kept. Rest well." stays. (2) A grandparent may read a bare date row as "nothing happened". Mitigation: label says "A quiet day", and the mark is small, never counted, never in print or Read together. (3) A row for each quiet day could look like a list of gaps. Mitigation: never shown as a count or in a chapter line; hidden on a day that has a letter. (4) Existing rows hold the sentence, and `raw_transcript` cannot be blanked. Mitigation: render by kind, ignore text for `not_much`.

### (c) Let the person type or speak one line; the marker is the default skip

- **Product:** the best letters are small ones ("tell {child} anyway", CREATIVE.md "Small days"). One line is a real letter.
- **Content:** "Add a few words" already exists as dead copy (`strings.en.ts:245`).
- **Payments:** a one-line letter is a letter, so under D-051 (main) it spends one of the 2 free letters. The person would be asked to pay to say less.
- **Red team:** (1) It is the Write screen again; the "Type" button already does it. (2) It breaks the one-tap promise unless the marker stays default, so (c) is (b) plus a second step. (3) After the second letter the tap would open a paywall, which is the opposite of "a complete answer". (4) Extra v1.0 scope for little.

### (d) Remove the feature

- **Product:** the simplest constitution story. No marker, no debate.
- **Red team:** (1) It removes the tired-night door that VOICE.md:61, the store listing (`docs/store/app-store.md:40`, `packages/content/src/store.en.ts:51`), the website FAQ (`site.en.ts:105`), the reminder body (`features/reminders.en.ts:20`) and `pages.en.ts:131` all promise; many places of copy change. (2) The no-guilt design depends on a way to say "nothing today". (3) No evidence yet that it harms anyone; the fault is the sentence, not the door.

## 4. Recommendation

**Choose (b) for v1.0. Do (c) later (v1.1), as a separate, optional second step. Do not do (a) or (d).**

Reasoning:
- (b) is the only option under which every byte the Book shows was said by a person. That is the constitution and the printed back-cover promise (`book.en.ts:14`).
- The sentence is not the benefit; the one-tap permission is. (b) keeps that and the toast, and drops the claims.
- (a) fails on facts the template cannot know. (d) breaks promises in many places (about ten copy files). (c) has a payments cost (D-051 main) and duplicates Write.
- Both critiques (product, design) point at "marker only" or "distinct app voice or removal".

**Apply the same rule to the other two.**
- "Nobody spoke": keep the app note (it is a true statement about the file), but show it as an app note: small, muted, sans, not in the signature style, no "From ..." line under it, with a small icon. Soften the wording because the recording may hold sounds: `"No words in this one. The recording is kept just as it is."`
- "Dear {child},": remove the ghost. Use the existing `typing.placeholder` ("Write it the way you would say it.") in the muted placeholder style. People who want a salutation will type it.

**Cost:** about 1 to 1.5 days for one mobile engineer, plus a small content change; no new table, no new column. **Risks:** a bare row feels cold (mitigated by label and toast); an app note style is a new visual pattern (use one component for both); export golden files change. **What would change my mind:** if TestFlight testers say the plain mark feels like nothing happened, test a labelled (a) behind a flag on the Book tab only, never in print, Read together or export; if counsel or Apple object to an entry with empty text, store a one-character marker instead (unverified; I read no Apple guideline on this).

### Printed book, export, Read together, accessibility, the grandparent

- **Printed book:** no quiet days in v1.0 (the book is for what people said; a printed "gap" reads as absence). Not even a date mark. Revisit after real books exist.
- **Read together:** never plays or reads the marker.
- **Export:** keep the row in `entries.json` with `kind: 'not_much'`, `final_text: ''`, so a person's whole history stays complete and reversible; the browsable page shows one line "A quiet day" with the date, unsigned. One small `letters/` file per marker is needed because the schema requires `text_file` (`export/schema.ts:181,205`); the file contains the date line and the label only.
- **Accessibility:** label "{date}. A quiet day, kept." Not a button into a letter page. Long-press or the row's action menu offers "Remove this mark" with an Undo toast (COMPONENTS.md:352 lists this as a reversible action). Touch target 44 pt, Dynamic Type uncapped (D-027).
- **A grandparent later** sees a letter book with the odd small date line "A quiet day". Nothing says what the day held and nothing is signed, so nothing is untrue. In print they see only what was said.
- **Celebrate what exists:** the marker never enters a count, a chapter line, a streak or an insight; chapters made only of quiet days show no count line.

## 5. Data model note and migration impact

**Entry shape for a new marker:** `kind: 'not_much'`, `rawTranscript: ''`, `finalText: ''`, `machineEdits: []`, `editLevel: 'verbatim'`, `inBook: false`, `captureMode: 'typed'` (kept to avoid a check-constraint change even though nothing was typed), `promptKey: null`. `raw_transcript` stays immutable and `raw_sha256` hashes `''`. No new column, no new kind value.

**Server schema:** no change required. The kind check (core sql:124), the trigger and `entries_before_insert` all accept `''`. Data class: no new field, so `docs/legal/DATA_CLASSIFICATION.md` needs no row; the PR says "Data classes touched: none" (BACKLOG DoD item 5).

**Existing rows (pre-fix not_much entries):** their `raw_transcript` holds the sentence and cannot be changed (trigger). The safe path is to render by kind and ignore text for `not_much`, so old and new rows look the same. Optional tidy-up: blank `final_text` on old rows (allowed by the guard, versioned in `entry_versions`, so reversible). How many exist: unverified (on-device only until sync is on; TestFlight is the only place they can be).
- Local: a new `MIGRATIONS` entry (version 5) in `apps/mobile/src/lib/db/migrations.ts` running `UPDATE entries SET final_text = '' WHERE kind = 'not_much' AND final_text <> ''`. It must go through the sync outbox as a normal update; check the repo's update path before writing it (unverified which function).
- Server (optional, separate PR): a new migration file, never an edit of an applied one (`.github/migrations-applied.txt`), `20261006000000_quiet_day_marker_text.sql`: the same update, plus `check (kind <> 'not_much' or final_text = '') not valid`, then validate. Add a case to `supabase/tests`.

## 6. Change list for a build agent (after the founder says yes)

**Content (`packages/content`)**
- `strings.en.ts` notMuch block (236-250): delete `template`, `templateAlt`, `addWordButton`, `saveButton`, `confirmTitle`. Keep `button`, `savedToast` ("Kept. Rest well."). Change `confirmBody` (used as the a11y hint, `index.tsx:204`) to `"Marks today without writing anything."`. Add `undo: "Undo"`.
- Add `book.quietDay`: `label: "A quiet day"`, `a11y: "{date}. A quiet day, kept."`, `remove: "Remove this mark"`, `removedToast: "Removed."`.
- `components/book/copy.ts:9` `nobodySpoke` becomes `"No words in this one. The recording is kept just as it is."`.
- `strings.en.ts:202` remove `letterPlaceholder`; `write.tsx:130` uses `copy.tonight.typing.placeholder`.
- `docs/design/COMPONENTS.md` section for the app-note style; `VOICE.md` one line: "The app's own words are small and unsigned, and never sit in the letter's type."
- `packages/content/test/rules.test.ts` must still pass (no dashes, no ellipsis, no emoji).

**Mobile**
- `(tabs)/index.tsx:94-116`: save with empty text; skip if a `not_much` already exists for this child today; show the Undo toast.
- New `components/book/quiet-day-row.tsx` (date plus label, muted sans, 44 pt, no signature); `book.tsx` renders it for `kind === 'not_much'` and hides it if a letter exists on that date.
- `chapters.ts`: `countLine` and `fromLine` ignore `not_much`; hide the count line when only marks exist.
- `letter/[id].tsx`: no "Move to Book" or open for `not_much` (redirect back); `read-together.tsx:48` and `build.logic.ts:310,409`: add `e.kind !== 'not_much'` guards.
- New app-note component used by `letter-card.tsx:49-51`, `letter/[id].tsx:172`, `read-together.tsx:155`; remove the "From ..." line under it.
- Export `build.logic.ts:256-262,403,468`: marker row as above; update the golden export under `apps/mobile/test/__golden__/export-asha/`.
- Local migration v5 (section 5).

**Tests (fictional family "Asha" only)**
- `apps/mobile/test`: saving a quiet day stores empty `rawTranscript` and `finalText`; a second tap the same day adds nothing; `countLine`, chapters and `fromLine` ignore marks; `bookHtml` and Read together never include a `not_much` even if `inBook` is true; export has `final_text: ''` and validates against the schema; a legacy row with the old sentence renders as a mark and prints nothing.
- `letter-words.logic.test.ts`: unchanged behaviour; add a case that the nobody-spoke note carries no signature.
- `supabase/tests`: if the server migration ships, a `not_much` with non-empty `final_text` is rejected and `raw_transcript` still cannot be updated.
- Update the J08 and J09-05 journey step notes (the "never appears in the book" claim).

## 7. For the founder (only you can answer)

1. Approve (b), a marker with no sentence, and delete the "Not much today" sentence and its alternates? Yes / No.
2. Printed book: A) no quiet days at all (recommended) or B) a small date mark with no text?
3. D-051 (main): does a quiet day count toward the 2 free letters and stay ungated? A) never counts, always free (recommended) or B) counts.
4. A recording with no words (kept, but "No words in this one"): A) counts as a letter, because it is a kept recording (recommended) or B) does not count.
5. After the tap, offer "Add a few words" (option c) in v1.0? A) not in v1.0, plan it for v1.1 (recommended) or B) yes now.
6. Remove the "Dear {child}," ghost from the Write field? Yes / No.
7. Blank the old sentence in existing quiet-day rows (local migration, plus the server one if sync is live)? Yes / No.
