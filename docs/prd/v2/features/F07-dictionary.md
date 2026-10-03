# F07 Names and words dictionary

| | |
|---|---|
| Release | v1.0 gate ("say the name three times" is P1 inside v1.0, cut first if late; see 4) |
| Priority and rank | P0, rank 7 (05-feature-map.md section 2) |
| Personas | P1, P2, P3, P4, P6 |
| Existing IDs | B-REQ-006, B-REQ-017, B-NFR-001, B-NFR-003, PRD-REQ-004, PRD-REQ-013, PRD-REQ-016, LEGAL-REQ-014, LEGAL-REQ-018, DATA-REQ-001, DATA-REQ-042, DATA-REQ-048, D-031, DR-01, R-01, R-08, R-14, BL-120, BL-136, BL-146, BL-148, BL-178, BL-305 |
| Depends on | F03 (names and signature at first run), F05 (prompt rendering, packs, phonetic tables, model for the name check), F06 (verifier fix for R-01, Review screen, author edit layer), F11 (co-parent membership), F16 (sync), F17 (Settings shell), F15 (export of terms) |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why

- [F] Names are where transcription fails first: Remento transcripts dropped proper nouns (CR S27, not re-checked in R1). `02-customers.md` U4 calls a misheard name the fastest way to lose trust.
- [F] Only one product we found claims name handling: From, Mama advertises dictation with automatic name correction, mechanism Unverified [F] R1-S20. Remento's FAQ and Day One's audio guide show no vocabulary feature [F] R1-S13, R1-S53, R1-S60.
- [F] Whisper can be steered toward the family's spellings by putting names in the initial prompt; only the final 224 prompt tokens count [F] R5-S49. whisper.rn biases only the first 30 s of each call, so F05 prompts every chunk (TDD 03 3.5.1, 3.5.3).
- [F] Today the dictionary is two terms derived on the fly from the child's name and the signature (`dictionaryFor` in `apps/mobile/src/lib/store.ts`); there is no local table, no nickname, no family names, and no way to teach a mishearing (`heardAs` is always empty) (read 3 Oct).
- [F] A term holds one spelling (`DictionaryTerm.term` is one string, `packages/core/src/types.ts`), while a Hindi-speaking family may write the child's name in Devanagari in a Hindi letter and in Latin letters in an English one (R5 section 3).
- [F] The dictionary fix path has known defects that change meaning: it changes ordinary words that share a spelling with a name, matches inside Devanagari words, and can swap one family name for another (R-01, found 3 Oct in a scratch copy of `packages/core`; engine tests still pass 237 of 237).
- [F] The server keys terms on `(owner_id, term)` (`supabase/migrations/20260930000000_scribe_core.sql`), so one parent cannot hold "the same word" for two children, and B-REQ-006 asks for child-level terms every member can read (B section 6 item 10; BL-178).

## 2. Who

| Persona | Moment | Holding | Short of | What F07 must do for them |
|---|---|---|---|---|
| P1 Evening parent | First run, then any letter where a name came out wrong | The child's name, a nickname, what the child calls each grandparent | Time to set up a list | Seed names from first run with no extra step; one tap from Review to teach a fix |
| P4 Multilingual family | Letters in Hindi, Spanish, Mandarin, French, Arabic or Portuguese | Names spelled their way in more than one script | Trust that the app will not transliterate or "correct" a name | One term with a form per script, each typed by the parent, never generated |
| P2 Co-parent | Writes to the same child on their own phone | Their own phone and dictionary | Patience to re-teach names the other parent already taught | The child's name, nicknames and family names arrive with the book |
| P3 Expecting parent | Before the name is final | A placeholder name | Nothing | Renaming the child updates the term; old letters keep their words |
| P6 Future reader | Years later | The book | The app, possibly | Their own name and their grandparents' names spelled the family's way in every letter |

## 3. What we are solving

**Outcome.** Names and family words come out spelled the family's way, in the letter's script, from the first letter, and a dictionary fix never changes any other word.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Names exact after cleaning, per passed language | 95% or more (F05 gate, R5 section 8.1) | F05 gate corpus, names column | None: lab corpus |
| Meaning changes from dictionary fixes | Zero accepted on the R-01 dictionary fixtures and the F07 property suite | `packages/core` tests in CI | None |
| Dictionary fixes undone by authors (`machine_edit_reverted` with `edit_type: stt_fix` over `stt_fix` edits shown) | Under 10% (03 section 4.3: any edit type over 10% is reviewed) | Analytics | Opt-in only (about 40% [A], TDD 06) |
| Authors who add a term beyond the seeded ones within 30 days | Watch only; no target [A] | `dictionary_term_added` with `source` not `onboarding` | Opt-in only |
| Co-parent sees shared child terms | Within one sync after joining (F16 budgets) | Two-phone test (BL-177) | None |

## 4. Scope

**In v1.0**
- Terms seeded in the first-run transaction: the child's name, nickname if given, the author's signature (F03, B-REQ-006). Family names (what the child calls grandparents and others) added from Settings or Review.
- Adding a term or a mishearing from Review, in one local transaction with the letter (DATA-REQ-048).
- Settings > Names and words (`settings.dictionaryLabel`, `settings.dictionaryHelp`, exist): list, add, edit, delete, per child.
- A term holds one form per script, each typed by a parent (new type, 11.2).
- Biasing per letter language: the per-chunk initial prompt with the forms for that letter's script (F05), and post-hoc correction as `stt_fix` edits that pass `verifyEdits` (CLAUDE.md constitution).
- Requirements that close the R-01 dictionary defects (section 7.2).
- Scope by child: `(owner_id, child_id, term)`; child-level kinds shared read-only with the co-parent (B-REQ-006, BL-178).
- Deletion of a term, and the cascades on leaving a book, deleting a book and deleting the account.

**P1 inside v1.0 (cut first if late)**
- "Say the name three times" (B-REQ-017, BL-305). **Decision [R]: P1, not a launch gate.** Reasons: it needs a downloaded, gate-passed model, which a new author may not have for days (F05-U01); LEGAL-REQ-018 says clips never touch persistent storage, but expo-audio records only to a file, and counsel has not confirmed a tmp file deleted within seconds (TDD 03 C-5); the P0 path (typed spellings, prompt, Review teaching) already covers names. It ships on only if counsel confirms C-5 and the gate for that language has passed.
- Offered (tap to accept) name suggestions from phonetic tables (section 6.4).

**Later**
- A per-language starter list of common kinship words for the prompt (v1.1 with F33, needs native review per language, R-08).
- Apple `contextualStrings` biasing for an Apple engine (v1.1 spike with F05; works with DictationTranscriber per one forum report, not confirmed for SpeechTranscriber [S] R1-S74).
- Contributors' terms (v1.1 with F32, B1).

**Never**
- Machine transliteration of a name into another script, or generating a form the parent did not type (B-REQ-003, constitution).
- A dictionary fix that replaces anything other than a misheard name or family word with its taught spelling.
- Names, terms or `heardAs` in analytics, logs, crash reports or URLs (LEGAL-REQ-014, B-NFR-001).
- Uploading name-check clips, or keeping them after the task ends (LEGAL-REQ-018).

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| From, Mama | Dictation with automatic name correction [F] R1-S20 | 4.9 (48) [F] R1-S20; mechanism Unverified | n/a | **Innovate**: names seeded at first run, a form per script, every fix shown and undoable |
| Remento | No name or vocabulary feature on its FAQ or how-it-works pages [F] R1-S13, R1-S53 | 4.8 (1,738) [F] R1-S15 | Proper nouns dropped (CR S27, not re-checked) | **Innovate**: fill the gap |
| Day One | No vocabulary feature on its audio guide [F] R1-S60 | n/a | n/a | Gap |
| Apple Speech framework | Docs group `AnalysisContext`, `SFSpeechLanguageModel` and `SFCustomLanguageModelData` under custom vocabulary [F] R1-S72; one developer thread says contextual strings work with DictationTranscriber, not SpeechTranscriber [S] R1-S74 | Not confirmed by Apple in the thread read | n/a | **Match later** behind F05's engine interface; our own post-hoc fix stays needed whatever the engine (R1 F07, Inferred) |

## 6. Experience

### 6.1 Entry points

| Entry | What happens | Copy key |
|---|---|---|
| First run final transaction (F03 step 5) | `child`, `nickname` (if given) and `self` terms written with the children (F03-REQ-002) | n/a |
| Review: tap an underlined name fix | Edit card with Put it back (F06) and the label `review.edits.misheardName.label`, `.explain` | Exists |
| Review: select a word, Add to your words | Add-term sheet prefilled with the selected text as "what we heard" | `review.addWordToDictionary` (exists), sheet strings new |
| Settings > {child}'s book > Names and words | The list for that child, with Add | `settings.dictionaryLabel`, `settings.dictionaryHelp` (exist) |
| Tonight card after the model is ready (P1) | Say the name three times | `onboarding.nameCheck.*` (exist) |
| Co-parent joins a book (F11) | Shared child-level terms arrive read-only with the book | n/a |

### 6.2 Happy path: teaching a name from Review (P4, Hindi letter, Hindi passed)

| # | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Reads a Hindi transcript where the grandmother's name came out wrong | Review (F06) with the recording | n/a |
| 2 | Long-presses the wrong word, taps Add to your words | Sheet: "We heard" (the selected text, read-only), "Spell it your way" field with the Hindi keyboard, kind chips (Child, Nickname, Family, Place, Word), and "Which script is this?" preset to the letter's script (strings new) | Nothing stored yet |
| 3 | Types the name, picks Family, taps Save | Sheet closes; the word is now underlined as a name fix | One local transaction: insert or update the term with a Devanagari form and the heard text as that form's `heardAs`; re-run `faithfulClean` on the draft with the new dictionary. The new `stt_fix` edit passes `verifyEdits` (section 7.2) and is stored with the draft's edits |
| 4 | Saves the letter | F06 destination | `machine_edits` holds the `stt_fix` with its offsets into raw (DATA-REQ-042). On the next letter, the term's form is in the prompt for every Hindi chunk (F05-REQ-027) |
| 5 | Later, writes in English | Normal | The prompt for English chunks uses only the term's Latin form, if the parent typed one; if not, the term is left out of the English prompt (no generated spelling) |

If the verifier rejects the fix in step 3 (for example, the heard text is a kinship word or another term, 7.2), the term is still saved, the letter is not changed automatically, and the sheet says "Saved to your words. This letter was not changed. You can edit the words yourself." (new). The author can edit the words as an author edit (BL-148).

### 6.3 Happy path: Settings (P1)

1. Settings > Asha's book > Names and words. The list groups by kind; each row shows the term's forms and, under a disclosure, "We have heard it as" with the `heardAs` values.
2. Add: one field per script the author writes in (from F03 languages), at least one required; kind chips; Save. Shared kinds (Child, Nickname, Family) show "Shared with Asha's other parent." (new) when a co-parent exists.
3. Edit a form, remove a heard-as value, or Delete the term (confirm sheet: "Delete {term}? Letters you already saved keep their words." new).

### 6.4 Say the name three times (P1)

Shown once per language the author records in, only when `languageStatus(lang).gate === 'transcribe'` and the model is ready (F05 7.2). Card on Tonight; never in first run (K-02).

1. Card: `onboarding.nameCheck.title`, `.body`. Microphone already granted at first Speak (F04); if denied, the card says it is optional and never asks again (B F4.3).
2. Three clips of 4 s or less (B F4.3), each to a tmp file with Complete protection, decoded and transcribed in memory with the dictionary prompt **off** (B F4.3.1, to learn natural mishearings), deleted in a `finally` block and again by a launch sweep (TDD 03 3.9).
3. All three match the form exactly: `onboarding.nameCheck.doneTitle`, `.doneBody`. Otherwise `.heardLabel` with the heard text and `.correctPrompt`; Yes or "Let me spell it" (`.yesButton`, `.fixButton`, `.spellPlaceholder`).
4. Distinct non-matching spellings become `heardAs` of that form, each passing the save-time checks in 7.2 (a heard text that is a common word or another term is not stored).

Name suggestions (P1): when a capitalised word in a Latin-script transcript has the same pack phonetic code as a term's form (Double Metaphone for Latin, R5-S53), Review offers "Is this {term}?" as a tap-to-accept suggestion (F06 suggestions UX, BL-146). Accepting adds the heard text as a `heardAs` (through 7.2 checks) and re-runs cleaning. Non-Latin phonetic tables (IndicSOUNDEX, pinyin, Arabic skeleton) feed suggestions only after native review of each table (R5 section 3: low confidence for Arabic; IndicSOUNDEX code licence Unverified).

### 6.5 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F07-U01 | A term that is also an ordinary word in the letter's language (R-01 case: a name spelled like a common word) | Case-only fixes for that term are offered, never auto-applied (F07-REQ-010) | Offered mark on the lowercase word; nothing changed until tapped | Tap to accept, per occurrence | R-01 dictionary fixture D1 (BL-120 widened) |
| F07-U02 | A taught heard-as value that is an ordinary word | Stored as offer-only; never auto-applied | Sheet note: "This is also an everyday word, so we will ask each time." (new) | n/a | Unit with the pack common-word list |
| F07-U03 | A term or heard-as text appearing inside a longer Devanagari or Arabic word (R-01 case) | No match: word boundaries treat combining marks and joiners as part of a word (F07-REQ-011) | Nothing changed | n/a | R-01 dictionary fixture D2 |
| F07-U04 | A heard-as value equals another term or another term's form (would swap one family name for another, R-01 case) | Refused at save; on merge from sync, the colliding value is ignored on this device and flagged | Sheet: "{text} is already a name in your words." (new); Settings flag on the ignored value | Edit one of them | R-01 dictionary fixture D3 |
| F07-U05 | Two terms differ only in case | Refused at save (unique on lower-cased form, 11.3) | "That name is already in your words." (new) | Edit the existing one | Unit; `npm run test:db` |
| F07-U06 | Teaching from Review where the verifier rejects the fix | Term saved; letter unchanged | Line from 6.2 | Edit words by hand (author edit) | Unit with a kinship-word heard text |
| F07-U07 | Term typed only in Latin letters, letter in Hindi | Term left out of the Hindi prompt; no fix in Hindi letters; nothing transliterated | Settings row shows "No Hindi spelling yet" (new) with Add | Add a Devanagari form | Unit on `asr-prompt` |
| F07-U08 | More terms than fit the 200-token prompt cap | Lowest-priority kinds dropped first: word, place, self, family, nickname, child last (TDD 03 3.5.5); post-hoc fixes still use every term | Nothing | n/a | Unit with 60 terms |
| F07-U09 | Offline add or edit | Local transaction; syncs later (F16) | Normal | n/a | Airplane test |
| F07-U10 | No sensitive-data consent yet, or signed out | Terms stay local; the server consent gate (`dictionary_terms_consent_gate`) would refuse a write, so none is attempted | Normal | Syncs after consent (F02) | Integration |
| F07-U11 | Co-parent joins | Shared kinds (child, nickname, family) of the other parent arrive read-only; own terms stay private | Shared rows show "Added by {signsAs}" (new), no edit control | Co-parent adds their own row if they spell it differently | Two-phone test |
| F07-U12 | Co-parent's shared term collides with this author's heard-as value | Merge on this device ignores the colliding heard-as value (F07-U04 rule) | Settings flag | Edit | Unit on the merge |
| F07-U13 | Same author edits the same term on two devices offline | Last write wins per row with the server sequence check (F16 C1 pattern); `heardAs` arrays merge as a union, then 7.2 checks re-run | The merged term | n/a | F16 conflict test |
| F07-U14 | Child renamed (P3 placeholder, or a spelling change) | The `child` term's form updates in the same transaction as `children.name`; saved letters are never changed | New spelling from the next letter | n/a | Unit |
| F07-U15 | Two children share a nickname, or siblings' names overlap | Terms are per child; the prompt and fixes for a letter use only that child's terms plus owner-wide kinds | Normal | n/a | Unit with two-child fixture |
| F07-U16 | Term deleted while a letter in Review uses its fix | Review re-runs cleaning without it; the fix disappears and the raw word shows | Underline gone | Re-add | Unit |
| F07-U17 | Term empty, only spaces, or over 80 characters | Save disabled; server check is 1 to 80 characters (`dictionary_terms.term`) | Inline hint | Shorten | Unit |
| F07-U18 | Multi-word term (a name with an honorific) | Matched as a whole phrase; longer variants first (`dictionaryEdits` today); never split | Normal | n/a | Unit |
| F07-U19 | Arabic or other right-to-left form | Field direction follows the text; list rows render each form in its own direction (B-NFR-007) | RTL text | n/a | Component test |
| F07-U20 | Name check: microphone denied | Card says it is optional; no new OS prompt | Optional line | Settings | Unit |
| F07-U21 | Name check: app killed mid-clip | Launch sweep deletes any `namecheck-*` tmp file | Card returns next time | n/a | LEGAL-REQ-018 sandbox test |
| F07-U22 | Name check: language not passed or model absent | Card not shown | Nothing | n/a | Unit on the gate-status fixture |
| F07-U23 | Leaves the book (F11) | The leaver's terms for that child are deleted on the server and the device (new, 7.3) | Gone from Settings | n/a | `npm run test:db` |
| F07-U24 | Account deleted | Terms deleted by cascade (DELETION_AND_EXPORT_SPEC step 8) and locally | n/a | n/a | Existing purge test |
| F07-U25 | VoiceOver | Rows read term, kind, script, and "shared" when shared; the heard-as disclosure is a button with state | Spoken | n/a | Script V-F07 |
| F07-U26 | AX5 on SE 3 | Forms stack; nothing truncates (D-027 for names) | Full text | n/a | Component test |
| F07-U27 | Double tap on Save | One transaction | One term | n/a | Unit |

## 7. Requirements and acceptance criteria

### 7.1 Terms in more than one script

A term is one name or word with one form per script. Each form is typed by a parent (or confirmed in the name check) and carries its own `heardAs` list. The machine never creates a form. The prompt and the post-hoc fixes for a letter use only forms whose script matches the letter's language script, plus Latin forms in Hindi letters (D-031 default keeps English words in Latin).

| Letter language | Forms used |
|---|---|
| en, es, fr, pt | `latin` |
| hi (Devanagari choice) | `devanagari`, then `latin` |
| hi (Roman choice, if D-031 offers it) | `latin` |
| zh | `han_simplified` (and `han_traditional` if the author chose traditional, F03 Q3) |
| ar | `arabic` |

### 7.2 Dictionary fixes that never change other words (R-01)

R-01 records three dictionary defects found on 3 Oct: (D1) a fix changes an ordinary word that shares its spelling with a name; (D2) a term matches inside a Devanagari word; (D3) a fix can swap one family name for another. The code reasons, read 3 Oct: in `verify.ts` `checkSttFix` accepts a case variant or a taught `heardAs` before the protected-word and other-term checks run; in `protect.ts` the term matcher's word boundary is `[\p{L}\p{N}]` with no `\p{M}`, so a vowel sign or harakat counts as a boundary; `dictionaryEdits` turns every term's `heardAs` into a fix target without checking it against other terms; and `faithfulClean` in `pipeline.ts` verifies dictionary fixes with only quoted and locked spans protected, not other terms. The fixtures that reproduce each case live in the BL-120 regression set (R-01: widen BL-120); this spec names them D1, D2 and D3 and does not restate their strings.

Rules (all in `packages/core`, each with a test titled after the constitution rule, each bumping `ENGINE_VERSION`):
1. **Boundaries.** Matching of terms, forms and `heardAs` runs on NFC-normalised text, and a word character is `[\p{L}\p{M}\p{N}]` plus U+200C and U+200D (joiners appear in R-01's list). A match whose neighbour on either side is a word character is not a match.
2. **No other-term targets.** An `stt_fix` is rejected when its original, after normalisation, equals any term, any form, or any `heardAs` of a different term in the effective dictionary, whatever the source (rule or model) and before any dictionary-backed shortcut.
3. **Protected spans for dictionary fixes.** Every other term's exact-form spans are protected while dictionary fixes are verified.
4. **Case-only fixes.** A fix that only changes letter case (Latin forms) is applied automatically only when the lower-cased form is not in the letter pack's `commonWords` list (new pack field, F05 7.4) and not in the verifier's protected word sets (function words, pronouns, kinship, negation, modals, numbers in `meaning.ts`). Otherwise it is offered, never applied, until the author taps it.
5. **Taught heard-as values.** At save, a `heardAs` value is refused if it equals another term, form or another term's `heardAs`; it is stored as offer-only if it is in `commonWords` or a protected word set. A kinship word may be taught only to a term of kind `self` or `family` (a spelling of what the child calls someone); never to `child`, `nickname`, `place` or `word`.
6. **Scripts without case or spaces.** Devanagari and Arabic forms have no case-only fixes. For Chinese, a taught `heardAs` is auto-applied only when it is 2 or more characters long and bounded by punctuation, line ends or a segmenter boundary (whether `Intl.Segmenter` works in Hermes on iOS is Unverified, R5 section 4.4); otherwise it is offered. Homophones are common in Chinese, so phonetic matching never auto-applies (R5 section 3).
7. **Merging shared terms.** The effective dictionary for a letter is the author's own terms for that child, owner-wide kinds, and the shared child-level terms of other members. Rules 2 and 5 run again on every merge; a colliding value is ignored on this device and flagged in Settings.
8. **Every fix is visible and undoable.** Applied `stt_fix` edits are underlined with Put it back (F06); `machine_edits` keeps accepted and rejected fixes (DATA-REQ-042).

### 7.3 Scope, sync and deletion

- **Keys.** Server uniqueness moves from `(owner_id, term)` to `(owner_id, child_id, lower(term))` with a null `child_id` treated as one owner-wide scope (data architect picks `NULLS NOT DISTINCT` or a sentinel, depending on the server Postgres version, Unverified). Local table mirrors it.
- **Kinds.** `child` and `nickname` always have a `child_id` and mirror `children.name` and `children.nickname` (written in the same transaction as those fields). `family` and `place` are per child by default. `self` and `word` may be owner-wide (`child_id` null) or per child.
- **Who reads.** Owner reads and writes their own rows (policy `dictionary_terms_owner`, exists). New policy: members of a child read rows with that `child_id` and kind in (`child`, `nickname`, `family`) (B-REQ-006; BL-178). No member writes another member's rows.
- **Sync.** Terms sync through F16 as an author table with the shared-read rule above. A co-parent's device holds the shared rows read-only.
- **Deletion.** Deleting a term deletes the row and its forms on the device and the server (owner policy allows delete). Saved letters keep their words; their stored `stt_fix` edits keep the replacement text, so Put it back still works. Leaving a book deletes the leaver's rows for that child (new step in F11's leave flow). Deleting a book cascades through `child_id` at purge. Account deletion cascades (DELETION_AND_EXPORT_SPEC section on auth user deletion). Export includes terms in `account.json` (F15).

### 7.4 Requirements

| ID | P | Requirement | Acceptance criteria | Source |
|---|---|---|---|---|
| B-REQ-006 Rev (B4) | P0 | Names and signature become terms at first run; child-level terms readable by every member | Given "Asha", nickname "Ashu" and signature "Papa" in first run, Then local `dictionary_terms` rows exist with kinds `child`, `nickname`, `self`, written in the first-run transaction (F03-REQ-002); Given a co-parent joins, Then they can read the `child` and `nickname` rows and cannot read `self` | B-REQ-006; BL-136; BL-178 |
| F07-REQ-001 | P0 | Local dictionary table replaces on-the-fly derivation | Given the app after this change, Then `dictionaryFor` is removed and every caller (`review.tsx`, dev seed) reads `dictionaryForLetter(childId, language)` (new); Given a child with 5 terms, Then all 5 are returned with their forms | BL-136; TDD 01 3.2 |
| F07-REQ-002 | P0 | Terms hold one form per script, typed by a parent | Given a term with a Latin form only, When a Hindi letter is cleaned, Then no Devanagari form exists or is generated, the term is absent from the Hindi prompt and no fix targets it; Given the parent adds a Devanagari form, Then the next Hindi letter uses it | B-REQ-003; R5 section 3 |
| F07-REQ-003 | P0 | Prompt rendering per letter script | Given a Spanish letter, Then the per-chunk prompt contains only Latin forms in the order child, nickname, family, self, place, word, capped at 200 tokens with lowest priority dropped first; Given a Hindi letter, Then Devanagari forms come first, then Latin forms | TDD 03 3.5.5; F05-REQ-027 |
| F07-REQ-004 | P0 | Post-hoc correction is an `stt_fix` that passes the verifier | Given a taught `heardAs` in a raw transcript, Then the change is an `stt_fix` edit with offsets into raw, accepted by `verifyEdits`, underlined in Review and reversible; no code path writes a dictionary spelling into text any other way | CLAUDE.md constitution; DATA-REQ-042 |
| F07-REQ-005 | P0 | Add a term from Review in one transaction with the draft | Given Add to your words on a selected word, When Save, Then the term and the re-cleaned draft edits commit in one local transaction; a kill between the two leaves neither changed | DATA-REQ-048 |
| F07-REQ-006 | P0 | A rejected fix still saves the term | Given a heard text the verifier rejects for this term (7.2 rule 2 or 5), When Save, Then the term saves, the letter's text is unchanged and the sheet shows the not-changed line | Constitution |
| F07-REQ-007 | P0 | Settings > Names and words per child | Given Asha's book, Then the list shows that child's terms and owner-wide terms, grouped by kind, with forms and heard-as values; add, edit and delete work offline | PRD-REQ-013; B-NFR-009 |
| F07-REQ-008 | P0 | No form is ever generated | Given any code path, Then no function in `packages/core` or `apps/mobile` produces a form in another script from an existing form (code review checklist item; unit test asserts forms equal typed input) | B-REQ-003 |
| F07-REQ-009 | P0 | Word boundaries include marks and joiners (7.2 rule 1) | Given the R-01 fixture D2, Then zero `stt_fix` edits are proposed or applied; Given the same term standing alone in Devanagari text, Then it is matched; inputs in NFD and NFC give identical results | R-01; R5 section 4.4 E1 |
| F07-REQ-010 | P0 | Case-only fixes never change ordinary words (7.2 rule 4) | Given the R-01 fixture D1, Then zero edits are applied and the occurrences are offered as suggestions only; Given a term whose lower-cased form is not in `commonWords` or a protected set, Then its case variant is applied automatically | R-01 |
| F07-REQ-011 | P0 | No fix may target another term (7.2 rules 2 and 3) | Given the R-01 fixture D3, Then the swap is rejected with `stt_fix_protected_word`, whether proposed by rule or model; Given a property test of 10,000 generated two-term dictionaries with fixed seed, Then no accepted `stt_fix` has an original equal to another term, form or another term's heard-as | R-01; BL-120 |
| F07-REQ-012 | P0 | Save-time checks on heard-as values (7.2 rule 5) | Given a heard-as equal to another term, Then Save is refused with the collision message; Given a heard-as in `commonWords`, Then it is stored offer-only and never auto-applied; Given a kinship word taught to a `child` term, Then Save is refused | R-01 |
| F07-REQ-013 | P0 | Chinese fixes need a taught, bounded match (7.2 rule 6) | Given a single-character heard-as, Then it is never auto-applied; Given a 2-character taught heard-as between punctuation marks, Then it is applied as an `stt_fix`; phonetic (pinyin) similarity never auto-applies | R5 section 3, 4.4 E5 |
| F07-REQ-014 | P0 | No non-English dictionary fix ships before the R-01 fix | Given `ENGINE_VERSION` without rules 1 to 7, Then F05-REQ-004 fails the gate for every non-English language; English case-only fixes follow rule 4 from the same release | R-01; F05-REQ-004 |
| F07-REQ-015 | P0 | Server key and shared read | Given migrations applied, Then inserting the same term for two children by one owner succeeds, inserting it twice for one child fails, and a terms row differing only in case fails; Given a co-parent, Then they read the other parent's `child`, `nickname`, `family` rows for that child and no `self`, `word`, `place` rows; access tests in `npm run test:db` | B section 6 item 10; BL-178; B-NFR-003 |
| F07-REQ-016 | P0 | Merge re-checks shared terms (7.2 rule 7) | Given a shared `family` term from the co-parent equal to one of this author's heard-as values, Then the heard-as is ignored on this device, flagged in Settings, and no fix uses it | R-01 |
| F07-REQ-017 | P0 | Child and nickname terms follow the child | Given a rename of the child, Then the `child` term's form changes in the same transaction and no saved letter's text changes | B F2.3; constitution |
| F07-REQ-018 | P0 | Deletion | Given a deleted term, Then it is gone locally and on the server after sync, saved letters are byte-identical, and Put it back on an old fix still restores the raw word; Given a member leaves, Then their rows for that child are deleted; Given account deletion, Then no `dictionary_terms` row for the owner remains after purge | DATA-REQ-041, -042; DELETION_AND_EXPORT_SPEC |
| F07-REQ-019 | P0 | L4 handling | Given the log canary with Asha fixture terms, Then zero matches in logs, crash reports, analytics payloads or URLs; Given analytics, Then only `kind` and `source` leave the device | LEGAL-REQ-014; B-NFR-001 |
| F07-REQ-020 | P0 | Accessibility | Given VoiceOver, Then each row reads term, kind, script and shared state; Given AX5 on SE 3, Then forms stack without truncation | LEGAL-REQ-051 |
| B-REQ-017 Rev | P1 | Say the name three times, per language, after the model is ready | Given transcripts that differ from the form in clips 2 and 3, Then those spellings are stored as heard-as values after the 7.2 checks, and no clip file remains in the sandbox after completion, cancel or a kill plus relaunch; Given the language not passed, Then the card does not appear | B-REQ-017; LEGAL-REQ-018; TDD 03 3.9 |
| F07-REQ-021 | P1 | Offered name suggestions from Latin phonetic codes | Given a capitalised word with the same Double Metaphone code as a term's Latin form, Then Review offers it; Accept adds a heard-as through the 7.2 checks and re-runs cleaning; nothing applies without the tap | R5 section 3; BL-146 |

## 8. Data, privacy and security

| Data | Level | Where | Who reads | Retention |
|---|---|---|---|---|
| `term`, forms, `heardAs` | L4 (PRD 7.10; `DATA_CLASSIFICATION.md` `dictionary_terms`) | Device `dictionary_terms` (new local table, BL-136); Postgres after consent (consent gate trigger exists) | Owner; members for shared kinds of that child | Until deleted, leave, book purge or account deletion |
| `kind`, ids, timestamps | L2 and L3 as classified today | Same | Same | Same |
| Rendered prompt | L4 | Memory per chunk; its SHA-256 in `stt_meta` (F05) | Nobody | Per call |
| Name-check clips (P1) | L4 voice | tmp file with Complete protection, seconds | Nobody | Deleted in `finally` and by launch sweep (LEGAL-REQ-018; counsel on C-5) |
| Offer-only flags, collision flags | L2 | Device | Owner | With the term |

What never leaves the phone at v1.0: the prompt, clips, and phonetic codes. Terms sync only after sign-in and sensitive-data consent (F02). New columns (`forms`, `offer_only`) get classification comments and rows in `DATA_CLASSIFICATION.md` in the same pull request (DATA-REQ-001).

## 9. Non-functional requirements

| Budget | Target | Gate? |
|---|---|---|
| Add from Review to re-cleaned text | p95 150 ms on SE 3 for a 3-minute transcript [A] | No |
| `dictionaryForLetter` read | Under 5 ms for 100 terms [A] | No |
| Dictionary size | Up to 200 terms per child before the list asks to tidy [A]; prompt cap 200 tokens (TDD 03 3.5.5) | No |
| Property suite in CI | 10,000 cases fixed seed per PR, random seed nightly (TDD 03 7.2 pattern) | Yes |
| Accessibility | VoiceOver, AX5, 44 pt targets | Yes |

Shared budgets in `06-nfr.md` (not yet written).

## 10. Analytics

Opt-in, L2 only (LEGAL-REQ-003, PRD-REQ-016). Never a term, form, heard-as, script or language.

| Event | Status | Properties | Question |
|---|---|---|---|
| `dictionary_term_added` | Exists | `kind`, `source` (`settings`, `review_correction`, `onboarding`); proposed `source: name_check` | Do authors teach names beyond the seeded ones, and from where |
| `machine_edit_reverted` | Exists | `edit_type: stt_fix`, `source` | Are dictionary fixes wrong |
| `review_action` | Exists | proposed `suggestion_accepted`, `suggestion_kept` (TDD 03 4.5) | Are offered name fixes accepted |
| `dictionary_term_removed` | New | `kind` | Do people prune the list |
| `name_check_completed` | New (P1) | `result` (`all_match`, `learned`, `skipped`) | Does the name check teach anything |

## 11. How we build it (with the architect)

### 11.1 What exists (verified 3 Oct 2026)

| Part | File | State |
|---|---|---|
| `DictionaryTerm { term, kind, heardAs }`, `DictionaryKind` | `packages/core/src/types.ts` | One string per term |
| Rule fixes and protected spans | `packages/core/src/protect.ts` (`termRegex`, `dictionaryEdits`, `protectedSpans`, `isDictionaryTerm`) | Boundary without marks (D2) |
| Verifier `stt_fix` check | `packages/core/src/verify.ts` `checkSttFix` | Dictionary-backed shortcut before other checks (D1, D3) |
| Pipeline order | `packages/core/src/pipeline.ts` `faithfulClean` | Dictionary fixes verified without other terms protected (D3) |
| Sound key and `soundsLike` | `packages/core/src/meaning.ts` | English letter rules only (R5 section 3) |
| Prompt | `apps/mobile/src/lib/transcribe.ts` `dictionaryPrompt` | Unique terms joined, no cap, no order (TDD 03 L-3) |
| Derived dictionary | `apps/mobile/src/lib/store.ts` `dictionaryFor` | Child name and signature only |
| Server table | `supabase/migrations/20260930000000_scribe_core.sql` `dictionary_terms`, unique `(owner_id, term)`, owner-only policy; consent gate in `20261003000000_security_and_family.sql` | Exists |
| Copy | `packages/content/src/strings.en.ts`: `onboarding.dictionary.*`, `onboarding.nameCheck.*`, `review.edits.misheardName.*`, `review.addWordToDictionary`, `settings.dictionaryLabel`, `settings.dictionaryHelp` | Exists; `onboarding.dictionary.languagesBody` promises code-switching (F05-REQ-031) |

### 11.2 Type change (new, `packages/core/src/types.ts`)

```ts
export type Script = 'latin' | 'devanagari' | 'arabic' | 'han_simplified' | 'han_traditional';

export interface DictionaryForm {
  script: Script;
  text: string;          // typed by a parent, never generated
  heardAs: string[];     // learned mishearings for this form
  offerOnly: string[];   // heard-as values that are everyday words: offered, never auto-applied
}

export interface DictionaryTerm {
  id: string;
  childId: string | null;        // null = owner-wide (self, word only)
  kind: DictionaryKind;
  forms: DictionaryForm[];       // at least one
  shared: boolean;               // true for another member's row (read-only here)
  /** @deprecated engine v3 callers; equals forms[0].text */
  term: string;
  /** @deprecated engine v3 callers; equals forms[0].heardAs */
  heardAs: string[];
}
```

The engine works on a `LetterDictionary` (new) built per letter: the forms for the letter's script (7.1), each tagged with its term id, so rule 2 can compare across terms. `ENGINE_VERSION` bumps; entries cleaned under engine 3 keep their stored edits.

Server (new migration, data architect, `approve-migration`): add `forms jsonb not null` (L4, validated by a check function for shape and 1 to 80 characters per form) and keep `term` as the primary form for older clients during the transition; drop unique `(owner_id, term)`; add the 7.3 unique index; add the shared-read policy; add leave-flow deletion. Access tests split owner and shared rows (TDD 07 BL-Q12).

### 11.3 Components

| Component | Path | Notes |
|---|---|---|
| Types and `LetterDictionary` | `packages/core/src/types.ts`, `packages/core/src/dictionary.ts` (new) | Pure |
| Matcher and fixes | `packages/core/src/protect.ts` | Rules 1, 3, 4, 6 |
| Verifier | `packages/core/src/verify.ts` `checkSttFix` | Rule 2 before the shortcut |
| Save-time checks and merge | `packages/core/src/dictionary.ts` | Rules 5, 7 |
| Prompt rendering | `packages/core/src/asr-prompt.ts` (F05 WP-F05-06) | Reads `LetterDictionary` |
| Local table and store functions | `apps/mobile/src/lib/db/migrations.ts` next version; `apps/mobile/src/lib/dictionary-store.ts` (new) | `addTerm`, `updateTerm`, `deleteTerm`, `dictionaryForLetter` |
| Review sheet | `apps/mobile/src/components/dictionary/add-term-sheet.tsx` (new), copy in `apps/mobile/src/components/dictionary/copy.ts` | @gorhom/bottom-sheet (B16) |
| Settings list | `apps/mobile/src/app/settings/children/` names-and-words screen (new file) | F17 owns the list entry |
| Name check (P1) | `apps/mobile/src/components/dictionary/name-check.tsx` (new) | F05 queue gives one short job; clips in tmp |
| Common-word lists | F05 pack field `commonWords` | Source: a permissively licensed frequency list per language, chosen in WP-F07-02 with native review (R-08); none chosen yet |

### 11.4 Sequencing and the riskiest unknown

1. WP-F07-01 core rules (no device, protects the constitution) starts now with BL-120.
2. WP-F07-02 common-word lists with F05 packs; WP-F07-03 local table and store after BL-111.
3. WP-F07-04 server migration with BL-178; WP-F07-05 Review sheet; WP-F07-06 Settings.
4. WP-F07-07 name check (P1) after F05 WP-F05-07 and counsel on C-5.

**Riskiest unknown:** whether rule 4 (case-only fixes offered when the name is an everyday word) leaves too many names lowercase in English letters. Spike: run the English gate corpus with names chosen to include everyday-word names, and count names exact after cleaning with and without auto case fixes. If names fall under 95%, the fallback is to auto-apply case fixes only at positions the transcript itself capitalised, still never to an everyday-word occurrence the recogniser wrote in lower case.

## 12. Work packages

| WP | Scope | Owns files or folders | Depends on | Done when (tests that must pass) | Mode |
|---|---|---|---|---|---|
| WP-F07-01 | R-01 dictionary rules 1 to 7 in core, property suite, `ENGINE_VERSION` bump | `packages/core/src/protect.ts`, `verify.ts` (`checkSttFix` only), `pipeline.ts` (dictionary verification step only), `dictionary.ts` (new), `packages/core/test/dictionary.test.ts` (new), `packages/core/test/dictionary.fuzz.test.ts` (new) | BL-120 fixtures D1 to D3 | `[F07-REQ-009]`, `[F07-REQ-010]`, `[F07-REQ-011]`, `[F07-REQ-012]`, `[F07-REQ-013]`, `[F07-REQ-016]`; engine suite still green | agent (speech engineer, core owner) |
| WP-F07-02 | `commonWords` lists per language with native review | F05 pack JSON `commonWords` field, `docs/qa/evidence/F07-common-words-<lang>.md` (new) | F05 WP-F05-03 | Licence recorded; reviewer sign-off; size under 50 KB per pack [A] | pair (speech engineer, native reviewer) |
| WP-F07-03 | Type change, local table, store functions, remove `dictionaryFor` | `packages/core/src/types.ts`, `apps/mobile/src/lib/db/migrations.ts` (dictionary part), `apps/mobile/src/lib/dictionary-store.ts` (new), callers in `review.tsx` and `apps/mobile/src/dev/asha-seed.ts` | BL-111, WP-F07-01 | `[F07-REQ-001]`, `[F07-REQ-002]`, `[F07-REQ-008]`, `[F07-REQ-017]`, `[B-REQ-006]` local part | agent (mobile engineer) |
| WP-F07-04 | Server migration: forms, unique key, shared read, leave deletion | `supabase/migrations/<range>_dictionary_scope.sql`, `supabase/tests/` | BL-178, BL-175 | `[F07-REQ-015]`, `[F07-REQ-018]` server part in `npm run test:db` | agent, `approve-migration` (data architect) |
| WP-F07-05 | Add-term sheet from Review, one transaction with the draft | `apps/mobile/src/components/dictionary/` | WP-F07-03, F06 Review | `[F07-REQ-005]`, `[F07-REQ-006]`, `[F07-REQ-004]` | agent (mobile engineer) |
| WP-F07-06 | Settings > Names and words | names-and-words screen under `apps/mobile/src/app/settings/children/` (new) | WP-F07-03 | `[F07-REQ-007]`, `[F07-REQ-020]` component tests at AX5 | agent (mobile engineer, design systems) |
| WP-F07-07 | P1: say the name three times | `apps/mobile/src/components/dictionary/name-check.tsx` (new) | F05 WP-F05-07, counsel on TDD 03 C-5 | `[B-REQ-017]` sandbox test after complete, cancel and kill | agent (speech engineer) |
| WP-F07-08 | P1: offered Latin name suggestions | `packages/core/src/dictionary.ts` suggestion function, F06 suggestions UX | WP-F07-01, BL-146 | `[F07-REQ-021]` | agent (speech engineer) |

## 13. Open questions and assumptions

| Q | Question | Who | By when | What changes |
|---|---|---|---|---|
| Q1 | Accept "say the name three times" as P1, not a launch gate | Founder | 16 Oct | B-REQ-017 tier; WP-F07-07 timing |
| Q2 | Counsel: a tmp clip file deleted within seconds versus LEGAL-REQ-018's "never written to persistent storage" (TDD 03 C-5) | Counsel | 30 Oct | Whether WP-F07-07 can ship |
| Q3 | Accept rule 4: a name that is an everyday word gets case fixes offered, not applied | Founder, speech engineer | 23 Oct (after the spike in 11.4) | F07-REQ-010 |
| Q4 | Should the co-parent's prompt include the other parent's signature (from `child_member_prefs.signs_as`), given `self` rows stay private | Founder with F11 | 23 Oct | Prompt contents for co-parents |
| Q5 | Which frequency list per language seeds `commonWords` (permissive licence) | Speech engineer | 23 Oct | WP-F07-02 |
| Q6 | Server Postgres version: `NULLS NOT DISTINCT` available, or a sentinel for owner-wide terms | Data architect | 16 Oct | WP-F07-04 |

| A | Assumption | How we validate |
|---|---|---|
| A1 | 200 terms per child is enough | Count distribution in TestFlight (kind counts only, no terms) |
| A2 | Adding from Review re-cleans within 150 ms on SE 3 | WP-F07-05 timing |
| A3 | Parents type a second-script form when prompted by "No Hindi spelling yet" | Study 1 diary with Hindi-speaking families |

## 14. Sources

- Founder brief: `docs/agents/BRIEF-2026-10-03.md` items 5, 6, 7, 11, 15, 16 (B1, B4, B5, B9, B13, B16 in `_AUTHORING.md` section 3).
- V2: `docs/prd/v2/_AUTHORING.md`; `02-customers.md` section 7 (U4); `03-goals-and-principles.md` section 4.3; `05-feature-map.md` section 2; `09-decisions-and-risks.md` DR-01, R-01, R-08, R-14; `features/F03-first-run.md` (B-REQ-006 Rev, F03-REQ-002, WP-F03-04); `features/F05-transcription.md` (7.2, 7.4, F05-REQ-004, -027, -031); `features/F16-sync.md` (C1 conflict rule).
- PRD 1.3: `docs/prd/PRD.md` PRD-REQ-004, -013, -016, section 7.10; `docs/prd/B-first-run-and-family.md` F4, B-REQ-006, B-REQ-017, B-NFR-001, B-NFR-003, B-NFR-007, B-NFR-009, section 6 item 10.
- Legal: `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-003, -014, -018, -051; `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-001, -041, -042, -048 and the account deletion steps; `docs/legal/DATA_CLASSIFICATION.md` `dictionary_terms`.
- Decisions and backlog: `docs/DECISIONS.md` D-027, D-031; `docs/BACKLOG.md` BL-111, BL-120, BL-136, BL-146, BL-148, BL-175, BL-177, BL-178, BL-305.
- Design: `docs/tdd/03-audio-transcription.md` sections 3.5.1, 3.5.5, 3.9, 7.1, 7.2, 8 (L-3), 10 (C-5); `docs/tdd/01-mobile-client.md` section 3.2; `docs/tdd/07-quality-test-strategy.md` B-REQ-006 row; `docs/adr/0001-on-device-asr.md`; `docs/adr/0012-open-models-transcription-and-grammar.md`.
- Code read 3 Oct 2026: `packages/core/src/types.ts`, `protect.ts`, `verify.ts`, `pipeline.ts`, `meaning.ts`, `text.ts`; `apps/mobile/src/lib/store.ts`, `transcribe.ts`; `apps/mobile/src/app/review.tsx`; `packages/content/src/strings.en.ts`; `packages/analytics/src/catalog.ts`; `supabase/migrations/20260930000000_scribe_core.sql`, `20261002020000_data_governance.sql`, `20261003000000_security_and_family.sql`.
- Research: R1 F07 and section 0 item 1 (R1-S13, R1-S15, R1-S20, R1-S53, R1-S60, R1-S72, R1-S74); R5 sections 3, 4.4, 8.1 (R5-S49, R5-S53, R5-S54, R5-S55, R5-S56); CR S27.
