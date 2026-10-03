# F03 First run: child, signature, languages, names

| | |
|---|---|
| Release | v1.0 gate (goals step: moved to v1.1, see 4) |
| Priority and rank | P0, rank 9 (05-feature-map.md section 2) |
| Personas | P1 Evening parent, P2 Co-parent (invitee first run), P3 Expecting parent, P4 Multilingual family |
| Existing IDs | B-REQ-001, B-REQ-002, B-REQ-003, B-REQ-004 (first-run part), B-REQ-005 (create part), B-REQ-006, B-REQ-012, B-REQ-013, B-NFR-007, B-NFR-008, B-NFR-009, PRD-REQ-015, A-REQ-030, A-REQ-035, LEGAL-REQ-007, LEGAL-REQ-012, D-028, D-031, D-038, DR-01, BL-033, BL-136, BL-143, BL-178, BL-258 |
| Depends on | F01 (gate passed, Welcome > Start a book). Hands off to F04 (first letter), F05 (model and pack download, language gate), F07 (dictionary), F09 (month chapters, Before You), F11 (invitee first run), F12 (more children later), F17 (settings rows) |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why

- [F] UR R1: median time from first launch to first saved letter 90 s or less, no tutorial before the first recording (UR S10, S24). UR R2: only the child's first name or nickname and a birth or due date are required (UR S9, S27).
- [F] Tinybeans made child details optional and reported +885% onboarding completion (R1-S51). Headspace's quiz doubled course starts (31% to 63%) but did not raise practice days (R1-S58): first-run questions buy first use, not habit.
- [F] No competitor asks which languages a family speaks; Day One takes the transcription language from the keyboard and users ask for a separate setting (R1-S60, R1-S61).
- [F] In mixed-language couples the heritage language often does not reach the child: 92% against 55% among US Latino parents (R2-S31). Languages are asked per author, not per family.
- [F] Only English, Spanish, French, Portuguese and Mandarin look realistic on an SE 3 with one shared model; Hindi needs a Hindi-tuned model whose SE 3 speed is unproven; Arabic dialect speech is 30% to 60% WER on open models (R5 section 0 items 1 to 3). DR-01 default A: a language appears for transcription only after it passes its gate.
- [F] Auto-detection is risky for Hindi (Whisper can return Urdu script) (R5 section 1.2, R5-S27, R5-S29). The author sets languages explicitly.
- [S] Preterm parents asked for dates adjusted for a preterm birth; pregnancy pages are praised (R2-S2, R2-S14, R2-S15).

## 2. Who

| Persona | Moment | Holding, feeling, short of |
|---|---|---|
| P1 | First minutes after install, often at night, baby nearby [A] | One hand; wants to talk now, not fill a profile |
| P3 | Pregnant, more time, may not have a name yet | Placeholder names are common (B F2.3); no countdown copy |
| P4 | Parent who speaks Hindi, Spanish, Mandarin, French, Arabic or Portuguese with the child | Wants the letter kept in their language and script; English interface (B4) |
| Parent of twins or siblings | First run with two or more children | Must never meet a paywall in first run (PRD-REQ-015) |
| P2 invitee | Joined by link (F11) | The child already exists; only their own signature and languages matter |

## 3. What we are solving

Outcome: a parent names the child, gives a birthday or due date, says what the child calls them, and picks their letter languages, then is talking within the 90 s median, with names spelled their way from the first letter.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Median first launch to first saved letter | 90 s or less [A] (03 PS1) | Maestro on SE 3 with 10 scripted runs; field bucket `analytics_opted_in.time_to_first_letter` | Field value only for users who later consent |
| First-run screens interactive | 300 ms or less (B-NFR-008, gate) | BL-044 perf run | Lab |
| First-run completion (gate pass to Tonight) | 90% or more [A] | Server first-letter counts against ASC installs | Synced users only |
| Child name spelled as typed in the first transcript | 95% or more names exact after cleaning (R5 section 8.1 bar) | F05 per-language experiment | Lab |

## 4. Scope

**In v1.0**
- Child name (1 to 60 characters, any script) and birthday or due date; add more children together, all free (PRD-REQ-015, D-038 cap 6).
- Signature: "What does {child} call you?" (B-REQ-002).
- Letter languages per author, from the seven, gated by DR-01; script or variety where it matters.
- Model and pack download offer (hand-off to F05); names and signature seed the dictionary (hand-off to F07).
- Appearance follows the system; reading size offered to invitees only (B-REQ-012).
- Offline first run; invitee first run (with F11).

**Later**
- Goals ("What matters to you", B-REQ-013): moved to v1.1. Decision and evidence in 6.4.
- "Say the name three times" (B-REQ-017, P1, F07) once the model is ready.
- "The day {child} came home" (B-REQ-025, P2); preterm adjusted age (open question, F09).
- Hindi-English code-switching mode (v1.1, B4); next languages (F45).

**Never**
- Surname, gender, birth weight, birthplace, location, contacts, photo as required (LEGAL-REQ-012, B section 1 non-goals).
- Notification permission or a reminder step in first run (K-02).
- A Plus sheet in first run (C-REQ-023, K-12).
- Machine transliteration of a name or translation of anything (B-REQ-003, constitution).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Qeepsake | Journal name up to 14 characters, name inside prompts, age-adjusted questions from pregnancy [F] R1-S42, R1-S43, R1-S1 | 4.9 (15K) [F] R1-S1 | Age-inappropriate prompts outside the target range [S] R1-S56 | **Match** age-aware prompts; **Avoid** the 14-character cap [R] |
| Qeepsake twins | One journal per child or one shared [F] R1-S43 | n/a | n/a | **Match** one book per child [R] (PRD-REQ-011) |
| Tinybeans | Child details optional at sign-up [F] R1-S51 | +885% completion [F] R1-S51 | n/a | **Match** [R]: two required facts only |
| BabyPage | Pregnancy milestones [F] R1-S9 | 4.8 (4.1K) [F] R1-S9 | n/a | **Match** due-date mode (P3) [R] |
| Day One | Transcription language from the keyboard [F] R1-S60 | n/a | Users ask for a separate setting [S] R1-S61 | **Avoid** [R]: ask languages per author |
| From, Mama | Dictation with automatic name correction [F] R1-S20; method Unverified | 4.9 (48) [F] R1-S20 | n/a | **Innovate** [R]: names seed the dictionary at first run |
| Headspace | Onboarding quiz [F] R1-S58 | Doubled starts, no habit lift [F] R1-S58 | n/a | **Avoid** a quiz; supports cutting goals from first run [R] |

## 6. Experience

### 6.1 Entry points

| Entry | Path |
|---|---|
| Welcome > Start a book (F01) | Full first run: child, date, signature, languages, ready |
| Welcome > I was invited, after sign-in and join (F11) | Invitee first run: signature, languages, ready |
| Child switcher > Add a child after first run | F12 (not first run; Plus rule applies) |

### 6.2 Happy path (new parent, one child, English)

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Taps Start a book | `onboarding.child.title` "Who is this book for?", name field `onboarding.child.nameLabel`, placeholder `.namePlaceholder`, help `.nameHelp`; Add another child (`.addAnotherButton`) | Keyboard opens; nothing stored yet |
| 2 | Types "Asha" | Birthday or Not here yet segmented control (`.birthdayLabel`, `.expectingLabel`); birthday picker, no future dates; due-date picker today to 305 days ahead (today's code; server allows 310) | Name 1 to 60 characters, trimmed, any script, never transliterated |
| 3 | Picks a date, Continue | `onboarding.signsAs.title` "What does {child} call you?", chips `.examples`, preview `.preview` "From Papa", `.notYetHelp` | Continue disabled until 1 to 30 characters |
| 4 | Taps "Papa", Continue | Languages: "Which languages will you speak your letters in?" (new `onboarding.languages.title`), seven chips; English preselected only if the device language is English [R]; help "Your words stay in the language you said them." (new; VOICE multilingual rule) | Store per-author languages locally |
| 5 | Leaves English, Continue | Ready screen: `onboarding.finish.title` "The book is open.", `.body`; a quiet line about getting speech ready on Wi-Fi (new `onboarding.finish.speechNote`) | One transaction: children (shared `first_run_batch` id), per-child signature, author languages, dictionary terms (`child`, `self`); model download queued for Wi-Fi (F05) |
| 6 | Taps Write the first one | Tonight with the first prompt (F04) | Route to Tonight |

Today's code (`apps/mobile/src/app/onboarding.tsx`) has a promise step between Welcome and the child step and no languages step; the promise copy moves to Welcome (F01) or is cut, and the languages step is new (WP-F03-03).

### 6.3 Languages, scripts and the DR-01 gate

Per author, not per family; one to three letter languages [R]. Each letter records with the author's default; F04 shows a language chip when an author has more than one (F04-REQ-017).

| Language | Shown at v1.0 as | Script or variety question | What a letter does |
|---|---|---|---|
| English | Transcribed | None | Speak or type |
| Spanish, French, Portuguese, Mandarin | Transcribed once each passes its F05 gate (R5 section 8.1); until then as Record and type | Portuguese: Brazilian or European, stored for the pack's dictionary and punctuation only, never converted (R5 section 1.2). Mandarin: simplified characters at v1.0 [R]; traditional is an open question | Speak or type |
| Hindi | Record and type until its gate passes on SE 3 (DR-01, R5 K1) | Devanagari or Roman letters; default Devanagari (D-031 default if unanswered); Roman offered only if the experiment shows it works (D-031) | Recording kept; author types with the Hindi keyboard, or keeps the recording and adds words later |
| Arabic | Record and type at v1.0 (DR-01 A, R5 section 9 option A) | None at v1.0 (dialect handling is the transcription problem); typed text right to left | Recording kept; author types with the Arabic keyboard |

**How a family whose language has not passed still writes.** The chip is never hidden: the language shows with a quiet label "We keep your recording. You type the words." (new `onboarding.languages.recordAndType`). Choosing it sets the letter language, so the recording is filed correctly, the typed text keeps the keyboard's own autocorrect and is never machine-edited (B5), and when the language passes later, F05 offers to fill words for recordings that have none, once, never overwriting typed text (R5 section 8.1 note on immutable raw). No language is ever transcribed by a model that has not passed its gate.

### 6.4 Goals (B-REQ-013): decision

**Decision [R]: cut from v1.0 first run and from v1.0 entirely; revisit in v1.1 as an optional card.**
- Evidence against an extra first-run question: Headspace's quiz raised first use but not habit [F] R1-S58; UR R1 caps first run at 90 s and no tutorial [F] UR S10.
- At v1.0 most mapped effects in B F3 cannot be delivered: "Bring family in" needs contributors (v1.1, B1); "Keep our voices" points at backup (v1.1, B7); "Letters for when they're older" surfaces sealed letters (P1, B-REQ-018); "A book to hold" leans on print (later). B's own rule says every question must change something visible (B goal 6).
- Goals are L4 and never sent to analytics (catalog `goals_set` sends a count only), so we would learn little from them at launch.
- Cost of cutting: `profile_settings.goals` and the `goals_set` event stay defined but unused; B-REQ-013 marked Rev (B1, B7), v1.1. Founder confirms (Q1).

### 6.5 Invitee first run (with F11)

After the gate, sign-in, Terms, sensitive-data consent and `accept_child_invite` (F11-REQ-006): welcome (`family.contributorWelcome.*` or F11's new `coParent.welcome.*`), signature prefilled with the inviter's suggestion (`child_invites.signs_as`) and editable, languages step, Reading size offered once (B F10: Standard, Large, Large print; `reader.sizes.*`), then the first letter to the named child. No child creation, no date, no Plus sheet.

### 6.6 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F03-U01 | No date chosen | Continue disabled | `onboarding.child.birthdayHelp` "We sort letters by {child}'s month of age." | Pick a date | Unit (B-REQ-001) |
| F03-U02 | Name empty or spaces only | Continue disabled | `childrenExtra.nameRequired` | Type a name | Unit |
| F03-U03 | Name in Devanagari, Arabic or with diacritics | Stored exactly as typed | Same name everywhere | n/a | Unit with "आशा" and "Zoë" |
| F03-U04 | Two to six children added together | One book each, one `first_run_batch`; no Plus sheet; the server accepts every child in `create_first_run_children` without Plus | Signature title uses `pendingCopy.onboarding.signsAsTitleMany` | n/a | Integration (checklist 6.8) |
| F03-U05 | Seventh child | Add another child hidden at 6 (code cap `MAX_FIRST_RUN_CHILDREN`) | No button | Add later through F12 | Unit |
| F03-U06 | Siblings with different dates | Today's code applies one date to every child | n/a | Spec: each child row gets its own date control (WP-F03-02); still free (D-038) | Unit |
| F03-U07 | Expecting, no name yet | Any placeholder accepted; renamed later (B F2.3) | Normal | Settings > {child}'s book | n/a |
| F03-U08 | Due date passes without a birth date | No notification or card (B-REQ-015); 14 days later a quiet Settings row only | Nothing in first run | F09 transition | Unit |
| F03-U09 | Adoption, only the month is known | P1: "I only know the month" stores month precision (B F1 edge) | Not in v1.0 picker [R] | Pick the first of the month | Open question Q4 |
| F03-U10 | "My partner already started one" | Link under the date step: ask for an invite, then I was invited (B F1.2) | "Ask them to send you an invite from Family." (new) | F11 | Maestro |
| F03-U11 | Offline throughout | Every step is local (B-NFR-009); model download waits | Normal; speech note says it starts on Wi-Fi | n/a | Airplane test |
| F03-U12 | App killed mid first run | Nothing saved until the final transaction; inputs are lost [R] (under 60 s of input) | Starts at the child step again | Retype | Maestro kill test |
| F03-U13 | Low storage (model needs 574 MB plus 100 MB free, TDD 03 3.5) | Download not queued | Speech note becomes "Typing works now. Speaking needs about 700 MB free." (new) | Free space; F05 retries | Unit with storage mock |
| F03-U14 | Cellular only | Download waits for Wi-Fi unless the parent allows cellular (TDD 03 3.5) | "Get it now on mobile data" option (new) | Choose | Unit |
| F03-U15 | Picks a language that has not passed | Labelled Record and type; chip still selectable | 6.3 line | n/a | Unit against a gate-status fixture |
| F03-U16 | Picks Hindi | Script question appears (Devanagari default) | Two choices, nothing hidden | Settings > Languages | Unit (B-REQ-003) |
| F03-U17 | Picks Arabic and types | Text field right to left; bidi handles numbers (R5 section 1.2) | RTL field | n/a | Component test with Arabic fixture |
| F03-U18 | Device language not English | No language preselected | Seven chips, none selected; Continue enabled (English default applied if none chosen) [R] | n/a | Unit |
| F03-U19 | VoiceOver | Each step title is a heading; chips are toggle buttons with selected state; Record and type label read with the chip | Spoken order matches visual | n/a | Script V-F03 |
| F03-U20 | AX5 on SE 3 | Chips wrap; date picker compact style; Continue at the end of the scroll; nothing truncates (D-027 for names) | Full text | n/a | Component test at AX5 |
| F03-U21 | Reduce Motion | `useMotion()` fade between steps | No slide | n/a | Component test |
| F03-U22 | Double tap on the final button | `finish()` guarded so one transaction runs | One set of books | n/a | Unit |
| F03-U23 | Invitee already keeps a local book for the same child | Both coexist; merge is P1 (B-REQ-021) | No prompt in first run | Later | n/a |

## 7. Requirements and acceptance criteria

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| B-REQ-001 | P0 | Only name and birthday or due date required | Given "Asha" and a birthday, When Continue, Then a child exists with no other fields and nothing asked for surname, gender, photo or contacts; Given no date, Then Continue is disabled with the help line | B-REQ-001 |
| B-REQ-002 | P0 | Signature before the first letter | Given "Papa", Then letters to this child are signed "From Papa"; Given different signatures for two children, Then each book shows its own | B-REQ-002 |
| B-REQ-003 Rev (B4, DR-01) | P0 | Per-author letter languages from the seven; transcription only for languages that passed their gate; script or variety where relevant | Given Hindi and Devanagari with Hindi passed, When recording, Then transcription runs with `language: hi` and renders Devanagari, untranslated; Given Arabic (not passed), Then the recording is kept, the author types, and no model transcribes it | B-REQ-003, DR-01, R5 8.1 |
| B-REQ-005 | P0 | Due-date mode creates the book | Given Not here yet and a due date, When a letter is saved, Then it files into Before You (F09) | B-REQ-005 |
| B-REQ-006 Rev (B4) | P0 | Names and signature seed the dictionary | Given "Asha" and "Papa", Then local `dictionary_terms` rows exist with kinds `child` and `self`, written in the same transaction as the child; per-script forms are a field (new) the author fills, never generated | B-REQ-006, R5 section 3 |
| PRD-REQ-015 | P0 | Children added together in first run are free | Given three children in first run, Then three books, no Plus sheet, and the server accepts all three in one `create_first_run_children` call | PRD-REQ-015, D-038 |
| F03-REQ-001 | P0 | Each first-run child has its own date | Given twins with one date and a sibling with another, Then each book stores its own date | D-038 |
| F03-REQ-002 | P0 | One transaction at the end of first run | Given a kill before the final tap, Then no child row exists; Given the final tap, Then children, signatures, languages and dictionary terms commit together | DATA-REQ-048 pattern |
| F03-REQ-003 | P0 | Record and type for languages not yet passed | Given a language whose gate status is not passed, Then its chip shows the Record and type label and the letter path keeps audio plus typed text | DR-01 A |
| F03-REQ-004 | P0 | Gate status comes from the signed manifest | Given remote config marks a language passed, Then the chip label changes on next launch without a release; offline uses the last good copy (B14) | F19, B14 |
| F03-REQ-005 | P0 | Model download offered, never blocking | Given first run done on Wi-Fi with 700 MB free, Then the model download is queued; Given cellular, Then it waits unless allowed; first run never waits on it | TDD 03 3.5, A-REQ-002 |
| F03-REQ-006 | P0 | Non-English packs download only for chosen languages | Given Portuguese chosen, Then only the Portuguese pack is requested (B13) | B13 |
| F03-REQ-007 | P0 | No permission prompts and no Plus sheet in first run | Given a fresh first run, Then no OS prompt and no paywall appeared | LEGAL-REQ-007, C-REQ-023 |
| F03-REQ-008 | P0 | Time budget | Given 10 scripted runs on SE 3, Then median gate-to-first-saved-letter is 90 s or less (F01 plus F03 plus a 15 s spoken letter) | UR R1 |
| B-REQ-012 Rev (D-043) | P0 | Appearance and reading size | Appearance follows the system in first run (Settings changes it, `appearance` key, `_layout.tsx`); Reading size offered once to invitees; Given Large Print at AX5, Then letter text never truncates | B-REQ-012 |
| B-REQ-013 Rev (B1, B7) | P1 (v1.1) | Goals | Not in v1.0; see 6.4 | B-REQ-013 |
| B-NFR-007 | P0 | Names in any script; locale dates; no hardcoded LTR | Given an RTL name and RTL typed text, Then layout follows the text direction; dates format with the device locale (D-028) | B-NFR-007 |
| B-NFR-008 | P0 | First-run screens interactive 300 ms or less | SE 3 perf run | B-NFR-008 |
| B-NFR-009 | P0 | First run works offline | Airplane test from gate to first saved letter (typed) | B-NFR-009 |
| F03-REQ-009 | P0 | Invitee first run creates no child | Given an invitee, Then first run shows signature, languages and reading size only, and writes `child_member_prefs.signs_as` for the joined book | F11, B-REQ-002 |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention |
|---|---|---|---|---|
| Child name, birthday or due date | L4 | Device `children`; server `children` after sync and consent (F02) | Parents; contributors see name and birthday month and day only, never the due date (D-039) | Until book deletion |
| Signature per child | L3 | Device `children.signs_as` today; `child_member_prefs.signs_as` target (TDD 01 3.2.2) | Members of that book | Until leave or deletion |
| Letter languages, script, variety | L4 (PRD 7.10) | Device; server `profile_settings` (new, owner only, BL-178) | Author only | Until deletion |
| Dictionary terms from names | L4 | Device `dictionary_terms` (new local table, BL-136); server child-level terms readable by members (B-NFR-003) | Author; child-level kinds by members | Until deletion |
| `first_run_batch` | L2 | Device | Sync | Until synced |

Nothing leaves the phone before sign-in and sensitive-data consent (F02). Language names never go to analytics: they can proxy ethnicity (B-NFR-001; catalog comment on `languages_set`).

## 9. Non-functional requirements

| Budget | Target | Gate |
|---|---|---|
| First-run screen interactive | 300 ms or less (SE 3) | Yes |
| Final first-run transaction | p95 100 ms [A] | Yes |
| Total first run (child, signature, languages) | p50 40 s or less [A], leaving room inside 90 s | Yes (Maestro) |
| Download size | English pack and Devanagari-capable fonts in the app; nothing else bundled (B13, BL-258) | Yes (under 40 MB) |
| Accessibility | AX5, VoiceOver, 44 pt targets | Yes |

Shared budgets in `06-nfr.md`.

## 10. Analytics

No first-run event is sent at the time (consent comes later, K-01). Facts arrive once in `analytics_opted_in` and later in normal events.

| Event (exists) | Properties | Question |
|---|---|---|
| `analytics_opted_in` | `time_to_first_letter`, `first_letter_mode`, `came_from_invite` | Did first run fit the budget; speak or type first |
| `child_added` | `mode`, `ordinal`, `in_first_run`, `added_together` | How often twins or siblings start together |
| `dictionary_term_added` | `kind`, `source: onboarding` | Do authors add names beyond the seeded ones |
| `settings_changed` | `key: languages` | Do people change languages after first run |
| `model_download` | `stage`, `model`, `network` | Does the model arrive |

## 11. How we build it (with the architect)

**What exists (verified 3 Oct).** `apps/mobile/src/app/onboarding.tsx` steps `welcome`, `promise`, `child`, `signsAs`, `finish`; up to 6 names with one shared date; `addChild()` per name (not one transaction, no batch id); signature stored on each child row. `apps/mobile/src/lib/store.ts` `dictionaryFor()` derives terms on the fly (no table). Reading size lives in `apps/mobile/src/components/child/child-store.ts` (`readingSize` setting) with scales in `packages/design-tokens` (`readingScale` 1, 1.2, 1.45). Server `create_first_run_children` (cap 6, once per account) exists in a pending migration.

**Changes.**
1. Split welcome out (F01 WP-F01-04); remove or fold the promise step.
2. Per-child date control; one `LocalStore.createFirstRun({children, signsAs, languages})` transaction with `first_run_batch` (BL-136).
3. Languages step: `src/components/first-run/languages.tsx` (new) reading gate status from the signed pack manifest (F19) and the `packs` API from F05.
4. Dictionary: local `dictionary_terms` with per-script forms (new field) through `packages/core` (F07).
5. Speech-ready line hands off to F05's model manager (BL-143).

**Riskiest unknown.** The 90 s budget with an added languages step and no transcriber on first launch (model not yet downloaded): the first spoken letter saves audio and waits for words (BL-142, F05). Spike: 10 timed runs on SE 3 in week 3.

## 12. Work packages

| WP | Scope | Owns files or folders | Depends on | Done when (tests that must pass) | Mode |
|---|---|---|---|---|---|
| WP-F03-01 | First-run transaction, batch id, per-child signature move | `apps/mobile/src/lib/db/` migration (new), `apps/mobile/src/lib/store.ts` first-run function | BL-111 (BL-136) | `[F03-REQ-002]` kill test; `[PRD-REQ-015]` local batch | agent (mobile engineer) |
| WP-F03-02 | Child step: per-child dates, partner link, name rules | `apps/mobile/src/app/onboarding.tsx` | WP-F03-01 (BL-033) | `[B-REQ-001]`, `[F03-REQ-001]`, AX5 component test | agent (mobile engineer) |
| WP-F03-03 | Languages step with DR-01 labels, script and variety | `apps/mobile/src/components/first-run/languages.tsx` (new), feature `copy.ts` | F05 gate-status API, F19 manifest | `[B-REQ-003]`, `[F03-REQ-003]`, `[F03-REQ-004]` | agent (mobile engineer, content) |
| WP-F03-04 | Dictionary seeding with per-script forms | `packages/core/src/` dictionary helpers (F07 owns types) | F07 WP for `DictionaryTerm` forms | `[B-REQ-006]` unit | agent (speech engineer) |
| WP-F03-05 | Ready screen and download hand-off | `apps/mobile/src/app/onboarding.tsx` finish step | BL-143 | `[F03-REQ-005]`, `[F03-REQ-006]` with storage and network mocks | agent (mobile engineer) |
| WP-F03-06 | Invitee first run (signature, languages, reading size) | `apps/mobile/src/app/join/first-run.tsx` (new) | F11 WP-F11-06 (BL-191) | `[F03-REQ-009]` Maestro from a link | agent (mobile engineer) |
| WP-F03-07 | 90 s budget run on SE 3 | `docs/qa/` timing script (new) | WP-F03-02 to -05, F04 save | `[F03-REQ-008]` median recorded | human (QA engineer) |

## 13. Open questions and assumptions

| Q | Who | By when | What changes |
|---|---|---|---|
| Q1. Cut goals from v1.0 (6.4) | Founder | 16 Oct | B-REQ-013 scope; `profile_settings.goals` unused at v1.0 |
| Q2. Hindi script default (D-031) | Founder, from the experiment | 30 Oct | Default chip |
| Q3. Mandarin traditional characters at v1.0? | Founder, speech engineer | 30 Oct (with DR-01) | Pack script table |
| Q4. Month-only birthday for adoption in v1.0 or P1 | Founder | 23 Oct | Picker and `birth_date_precision` column |
| Q5. Preterm adjusted age for chapters | Founder with F09 | 30 Oct | F09 age math |
| Q6. Maximum letter languages per author (spec default 3) | Speech engineer | 30 Oct | Memory and download plan (R5 section 7) |

| A | Assumption | Validate |
|---|---|---|
| A1 | Asking languages adds under 10 s to first run | WP-F03-07 timing |
| A2 | Families accept Record and type for Hindi or Arabic at launch | Study 1 diary includes 3 to 4 Hindi or Arabic speakers |
| A3 | Parents of twins add both in first run rather than later | `child_added.added_together` after consent |

## 14. Sources

- Repo: `apps/mobile/src/app/onboarding.tsx`, `apps/mobile/src/app/_layout.tsx` (appearance), `apps/mobile/src/lib/store.ts`, `apps/mobile/src/lib/db/migrations.ts`, `apps/mobile/src/lib/copy.ts` (`pendingCopy.onboarding`), `apps/mobile/src/components/child/child-store.ts`, `packages/design-tokens/src/tokens.ts`, `packages/content/src/strings.en.ts` (`onboarding.*`, `family.contributorWelcome.*`, `reader.*`, `childrenExtra.*`), `packages/content/VOICE.md`, `packages/core/src/types.ts`, `packages/analytics/src/catalog.ts`, `supabase/migrations/20261003010000_children_and_entitlements.sql`.
- Docs: `docs/prd/B-first-run-and-family.md` (F1, F3, F4, F10, section 4, 5, 6), `docs/prd/PRD.md` (PRD-REQ-011, -015; K-02, K-12; 7.4, 7.10), `docs/DECISIONS.md` (D-028, D-031, D-038, D-039), `docs/tdd/01-mobile-client.md` (3.2.2, 3.2.3), `docs/tdd/03-audio-transcription.md` (3.5), `docs/BACKLOG.md` (BL-033, BL-136, BL-143, BL-178, BL-191, BL-258), `docs/research/USER_RESEARCH.md` (R1, R2, R12), `docs/prd/v2/09-decisions-and-risks.md` (DR-01), `docs/prd/v2/features/F04-capture.md` (F04-REQ-017), `docs/prd/v2/features/F11-co-parent.md`.
- Research: R1 F03 and section 4 (R1-S1, R1-S9, R1-S20, R1-S42, R1-S43, R1-S51, R1-S56, R1-S58, R1-S60, R1-S61); R2 section 6 (R2-S2, R2-S14, R2-S15, R2-S31); R5 sections 0, 1.2, 2.4, 3, 7, 8.1, 9 (R5-S27, R5-S29).
