# F06 Faithful edit and review

| | |
|---|---|
| Release | v1.0 gate |
| Priority and rank | P0, rank 2 (05-feature-map.md section 2) |
| Personas | P1, P2, P4, P6 |
| Existing IDs | PRD-REQ-004, K-09, K-14, K-26, DATA-REQ-040, DATA-REQ-041, DATA-REQ-042, DATA-REQ-046, DATA-REQ-048, DATA-REQ-050, LEGAL-REQ-014, LEGAL-REQ-044, B-REQ-003, B-REQ-006, D-031, R-01, DR-01, BL-120 (was TDD 03 BL-064; widened here to R-01 D1 to D15), BL-020, BL-118, BL-142, BL-144, BL-146, BL-147, BL-148, BL-156, BL-043 |
| Depends on | F05 (raw transcript, language packs), F07 (dictionary), F19 (pack delivery), F16 (sync of edits) |
| Status | Draft V2, 3 Oct 2026 |

## 1. Why

- [D] The constitution: the machine may remove and repair; it may never add meaning. Every machine edit goes through `verifyEdits`, `raw_transcript` never changes, and every edit is stored and reversible (CLAUDE.md). B5 confirms the scope: spelling, script, punctuation, "um" and stumbles, tiny agreement slips, never rewording, and typed text never touched.
- [F] The category is moving the other way. Remento offers first-person and third-person "story" rewrites, and changing the style overwrites the user's own edits; FirstChapter, Sproutbook and Dujour polish or summarise notes; Day One Gold and Apple's Writing Tools add AI summaries and tone changes (R1 F06; R1-S63, R1-S4, R1-S38, R1-S22, R1-S23, R1-S65). None of the products opened shows a list of what the machine changed (R1 F06, Inferred from pages opened).
- [S] People notice. 3 reviewers praise AI polish (2 Remento, 1 Sproutbook) and 1 was surprised that AI changed spoken words (R2 section 0 item 5; R2-S8, R2-S21, R2-S22). [F] 76% of US adults say telling AI-made from human-made content apart is extremely or very important (R2-S27).
- [F] The engine accepts meaning changes outside English today. A `punctuation` edit turning बेटी (daughter) into बेटा (son), or أنتِ into أنتَ (you, feminine to masculine), passes `verifyEdits`; Devanagari words split into single letters; Chinese and Arabic question marks pass the sentence-type guard (R-01; R5 section 4.4 E1 to E4). I re-ran every R-01 item on 3 Oct against a scratch copy of `packages/core/src` (Node 22, no repo change) and each one reproduces. Several need no model at all: the English filler list removes Portuguese "um", "uh-uh" is cut apart, and a child named Hope turns "I hope" into "I Hope".
- [F] Review stores only the applied edits, not the rejected ones, so DATA-REQ-042 is not met; "Change words" overwrites `final_text` with no author layer, so DATA-REQ-041 replay breaks (`apps/mobile/src/app/review.tsx` `save`; TDD 03 section 3.7 item 4; BL-148).
- [F] `faithfulClean` runs `normalizeChars` after the verified edits, so em dashes, curly quotes, ellipses and no-break spaces change with no typed edit, no underline and no undo (`packages/core/src/pipeline.ts`). In French it removes the no-break space before ? and ! (R5 E7).
- [F] The machine's output is permanent once saved. `raw_transcript` is immutable by trigger (DATA-REQ-040), and a book letter is read years later by the child (P6). A wrong edit puts words in a parent's mouth for good.

## 2. Who

| Persona | Moment | Holding, feeling, short of | What F06 must do for them |
|---|---|---|---|
| P1 Evening parent | Right after Finish, the baby asleep, 1 to 3 minutes of speech on screen | A phone in one hand, tired, wants to save and put the phone down. Fears losing it or seeing words they did not say (02 section 6 items 1, 2) | Show the letter at once with every change quietly marked; save in one tap; never ask them to fix anything |
| P2 Co-parent | Writes their own letters on their own phone; reads P1's letters in the book | Little evidence about P2 (R2-S13). Reads a letter in a language they may not read (R2-S31) | Their own letters get the same Review. P1's letters show final text only: no underlines, no raw transcript, no recording at v1.0 (K-09, DR-07) |
| P4 Multilingual family | Speaking Hindi, Spanish, Mandarin, French, Arabic or Portuguese | Words in their language and script; fears being "corrected" into another script or language (02 section 6 item 7) | Only that language's own rules touch the letter; a language without a signed pack gets no machine edits at all |
| P6 Future reader | Years later, reading the book | Only what the parent said, signed by them | `final_text` contains nothing the parent did not say; the recording and the author's own exact words stay one tap away for the author |

## 3. What we are solving

**Outcome.** Every spoken letter is saved with only typed, verified, visible and reversible machine repairs, in the author's language and script, and no letter ever holds a word, a gender, a negation, a tense or a sentence type its author did not say.

| Metric | Target | How measured | Consent caveat |
|---|---|---|---|
| Accepted meaning changes in the regression suite (section 7, F06-REQ-019) | Zero, per language (gate) | CI on every PR; on-device Hermes run per release candidate | None: test data |
| Machine edit revert rate | Under 5% overall; any edit type over 10% is reviewed (03 section 4.3; TRACKING_PLAN fidelity guardrail) | `machine_edit_reverted` count / `letter_saved.machine_edit_count` sum, by `edit_type` | Opt-in only, about 40% of users [A] (TRACKING_PLAN 1.2) |
| Author correction rate per language | Per-language threshold from the F05 gate; a rise of 50% over baseline pauses that pack (03 section 4.3) | Computed on device from the author edit layer (F06-REQ-026); how it leaves the device is F05 Q8 | Opt-in; language is L4 (B-NFR-001) |
| Silent changes to a saved letter by an engine or pack update | Zero (gate) | Engine audit test (F06-REQ-022); release replay of fixture letters | None |
| Untracked character changes in `final_text` | Zero (gate) | Replay test: `final_text` equals apply(raw, applied edits) plus author edits, byte for byte (DATA-REQ-041) | None |
| Share of spoken letters saved word for word | Watched, no target. Answers U2 alongside Study 2 | `letter_saved` with a new `edit_level` property (section 10) | Opt-in |
| "Does this sound like you?" answered "Sounds like me" | Watched, no target [A]; a drop of 10 points after a release is reviewed | `entries.sounds_like_me` server aggregate (S) | Synced users only |
| Review open to text on screen, 2-minute letter, iPhone SE 3 | p95 300 ms after the transcript exists | Perf build marker (section 9) | Lab only |

## 4. Scope

### 4.1 The edit types, from the code

The allowlist is `EditType` in `packages/core/src/types.ts`. Nothing else can reach a letter. "Producer at v1.0" says what can propose each type once this spec ships; everything else is refused or never proposed.

| Type | May do (checked in `packages/core/src/verify.ts`) | May never do | Producer at v1.0 | Levels |
|---|---|---|---|---|
| `filler` | Remove words on the letter's filler list, with one adjacent comma or space; a filler said as its own sentence goes with its end mark (`rules.ts` `fillerEdits`) | Remove any word not on the list; add punctuation; split or join words; touch quoted text, dictionary terms or locked phrases | Rules, from the letter's pack auto list only (F06-REQ-010) | clean |
| `repeat` | Remove the second copy of an accidental immediate double: always-remove words, "was was" outside a pseudo-cleft, subject "you you", phrase restarts ending in a dangling word (`repeats.ts`) | Remove emphasis ("very very", "bye bye"), a complete phrase said twice, a lone negation, anything across a sentence break | Rules (English tables); offered doubles once accepted by the author (F06-REQ-012) | clean |
| `false_start` | Remove words the speaker said again, in order, right after, when the sentence carries on | Remove a complete phrase said twice, a lone negation, a ? or ! | None at v1.0 (no rule proposes it; model pass off) | clean |
| `stt_fix` | Replace a span with a dictionary term: a taught "heard as" form, or a case variant; a near-sounding capitalised word only from a model (`checkSttFix`, `soundsLike`) | Replace a pronoun, kinship word, number, negation, modal or another dictionary term; replace inside quotes or a locked phrase | Rules from the dictionary (`protect.ts` `dictionaryEdits`), hardened by F06-REQ-014. The `soundsLike` path is model-only and unreachable | clean, verbatim |
| `punctuation` | Change punctuation and the case of a word's first letter at a sentence start; letters and whole words stay equal (`checkPunctuation`, `checkCase`) | Change a letter, a combining mark or an invisible character; turn a statement into a question or remove ? or !; add, remove or move a quote mark; join or split words ("were" to "we're") | `RulePunctuationProvider` (sentence case, final mark) driven by the pack (F06-REQ-015); character edits that replace the silent `normalizeChars` step (F06-REQ-016) | clean, verbatim |
| `agreement` | Swap one word for another form of the same word in a closed number-or-person table (`isAgreementPair`), at most one per sentence | Change negation, tense, a modal, a noun's number, or anything outside the table | None at v1.0. Tables are closed and English-only (F06-REQ-013) so a v1.1 model starts from a safe gate | clean |
| `paragraph` | Change whitespace only | Change anything that is not whitespace | None at v1.0 (`model-edits.ts` leaves it to layout code; no producer exists) | clean |

Every substitution also passes the whole-text guards in `checkEdit`: negation count, numbers, mood marks and quote marks unchanged, and no word inserted that was not in the replaced span. Model edits share a change ceiling of 15% of words, minimum 3 (`CEILING_RATIO`, `CEILING_MIN_WORDS`).

### 4.2 In v1.0

- **Rules only, no model pass** [D] ADR 0003 decision 1, ADR 0012 decision 4. `JsonModelEditProvider` stays in `packages/core` for experiments and is never wired into the app or switchable by remote config.
- **Two levels.** `clean` is the default for spoken letters; `verbatim` keeps every word as heard and applies only dictionary spellings and punctuation (the engine's own `LEVEL_TYPES`). The person can switch either way in Review. A per-author default lives in Settings (row exists in `apps/mobile/src/app/settings/recordings.tsx`; F17 makes it a control).
- **Typed text is never machine-edited** [D] B5. Typed and mixed letters skip `faithfulClean`, character edits and `normalizeChars` (F04-REQ-012). The author's own hand edits are not machine edits either.
- **Per-language rule packs as data** [D] B13. The engine reads filler, repeat, agreement, punctuation and word tables from the letter's pack. Pure hesitation sounds are removed automatically; word fillers are offered, never applied [R] R5 section 0 item 7, 4.1. Non-English packs remove no repeats automatically [R] R5 section 4.2. A letter whose language has no installed, verified pack gets zero machine edits.
- **The R-01 launch gate**: every confirmed defect fixed, each with a regression test in a per-language suite that runs in CI and under Hermes on the device (section 7.2).
- **Immutable raw transcript, reversible stored edits**: applied, reverted and rejected edits stored against raw; hand edits stored as an author layer; every version replayable (DATA-REQ-040 to -042).
- **The Review screen**: every change marked and undoable, Show exactly what I said, word for word, lock a phrase, add to your words, Change words, the one-time read card (K-14), low-confidence marks, note or letter, date, child, Add to the book, Keep private, Let it go.
- **Saved letters**: the author can reopen and edit their own letter; a co-parent sees final text only (K-09).
- **Engine versioning**: a saved letter is never re-cleaned; an engine update audits old edits and asks, never changes.

### 4.3 Later

| Item | Release | Why later |
|---|---|---|
| Model edit pass (false starts, agreement, run-on breaks), hosted or on device, with consent | v1.1 at the earliest, only if the experiment bar in ADR 0012 is met | ADR 0003, 0012; needs consent (text leaves the phone) and the hardened gate first |
| Agreement and false-start tables for non-English languages | v1.1 with native review | No v1.0 producer; native review per pack (R-08) |
| Chinese word segmentation for fillers inside a clause | v1.1 | `Intl.Segmenter` in Hermes is Unverified (R5 4.4); v1.0 removes Chinese fillers only between punctuation (E5) |
| Adding a Spanish opening ¿ or ¡ by rule | v1.1 | The verifier allows it after F06-REQ-008; whether Whisper already writes it is unmeasured |
| Hindi-English code-switching edits | v1.1 (F33) | B4 |
| Re-cleaning a saved letter with a newer engine, on the author's request, shown as a new version | later | Needs `engine_version` per version, not per entry (DATA-REQ-040 keeps it immutable) |
| A per-family "always keep this" preference | later | Premature (TDD 03 3.7.1) |

### 4.4 Never

- Rewrite, reword, summarise, shorten, translate, transliterate, change tone, title or "make it nicer" (constitution; 03 section 3 principle 1).
- Any machine edit on typed text (B5).
- A step that changes `final_text` outside verified machine edits and the author's own edits.
- A remote switch that turns on a model pass or changes what the verifier accepts (B14: never server-driven if it changes data collection; text would leave the phone).
- A silent change to a saved letter by an engine, pack or app update.
- Showing another author's raw transcript, machine edits or underlines (K-09, PRD-REQ-004).
- Machine suggestions of new words, including grammar or style hints.

## 5. Market reference

| Product | What it does | Does it work? (evidence) | What customers say | Our call |
|---|---|---|---|---|
| Remento | Three styles: cleaned transcript without ums and ahs, first-person story, third-person story with a length slider; changing perspective overwrites earlier edits; the recording stays unchanged [F] R1-S63 | 4.8 (1,738 ratings) [F] R1-S15 | Hearing the voice is the most named value (11 of 64) [S] R2 section 0 item 5; 2 praise AI rewrites, 1 surprised AI changed spoken words [S] R2-S21, R2-S22; asks for richer editing [S] R1-S15 | **Match** the cleaned transcript. **Avoid** story modes and overwrite on regenerate: our edits are stored per change, and the author's own edits are never lost to the machine |
| FirstChapter | AI turns 30-second voice notes into polished entries [F] R1-S4 | No US average [F] R1-S4 | n/a | **Avoid**: polish speaks for the parent |
| Sproutbook | AI weekly and monthly recaps; site says originals are kept [F] R1-S38 | 5.0 (3) | 1 reviewer praises a baby book that writes itself [S] R2 T12 | **Avoid** recaps |
| Dujour Baby | AI polishes messy notes into "memories" [F] R1-S22 | Site cites 4.8, source Unverified | n/a | **Avoid** |
| Day One Gold | AI summaries, title suggestions, image generation [F] R1-S23 | Gold tier added March 2026 (CR S15) | n/a | **Avoid** |
| Apple Voice Memos (Mac) | Writing Tools summarise, proofread and change the tone of transcripts [F] R1-S65 | n/a | n/a | **Avoid**. Writing Tools may also appear in our own text fields; see Q2 |
| From, Mama | Third-party listing says it keeps an archive and does not generate AI content [F] R1-S17 | 4.9 (48) | n/a | Ally on principle; mechanism Unverified |
| Every product above | None shows a list of what the machine changed (Inferred from pages opened) [F] R1 F06 | n/a | 76% of US adults want to tell AI-made from human-made content apart [F] R2-S27 | **Innovate**: every change marked, explained in plain words, one tap to put back, and the exact words one tap away |

**Our call.** Remento proves people want filler removed [F] R1-S63; the rest of the market rewrites. We match the cleaning and innovate on proof: typed edits, shown, undoable, and a gate that refuses anything that adds meaning. We accept losing buyers who want polish [S] R2 section 0 item 5 (02 anti-personas). Study 2 (R2 section 8.2) tells us how prominently to show the changes and how to say no to polish requests (U2).

## 6. Experience

### 6.1 Entry points

| Entry | From | Route | Params | State today |
|---|---|---|---|---|
| Finish a spoken take | Listen (F04 step 6) | `/review` | `draftId` | Exists |
| Save a typed letter | Write (F04 path C) | `/review` | `draftId` | Exists |
| Waiting draft row | Tonight (F04-REQ-027) | `/review` | `draftId` | Exists |
| Words ready for a voice-only letter | The letter in the Book or Private, after F05 sets its words (`setWordsForWaitingEntry`) | `/review` | `entryId` (new) | New |
| Edit my own saved letter | Letter view menu, own letters only | `/review` | `entryId` (new) | New |
| An edit the new engine would refuse | Letter view note on the author's own letter (F06-REQ-022) | `/review` | `entryId`, `focusEdit` (new) | New |

A co-parent's letter never opens Review on another author's phone (F06-REQ-033).

### 6.2 Happy path

**A. Spoken letter, English, level clean (the default).**

| Step | Person does | App shows (copy key) | System does |
|---|---|---|---|
| 1 | Taps Finish on Listen | Review (`review.title`). Header: dateline with "To {child}" (`pendingCopy.review.toChildA11y`), then one row with the kind control (`tonight.noteOrLetter.*`), the date row (`review.date.today`, from F04) and the language chip if the author has two or more languages (F05). While F05 works: `tonight.states.transcribing` | Reads the draft. F05 runs the queue and hands back the raw transcript and `stt_meta` |
| 2 | Waits about 30 s or less (F05 budget) | The letter in letter type with each machine change under a quiet dotted underline; a removal shows a short dotted mark where the words were (`components/capture/transcript.tsx`). Under the title: `review.trustLine`. First spoken letter on this install only: the read card `review.firstNote.*` (K-14) | Pins the letter's pack id and version. Runs `faithfulClean(raw, { level, dictionary, locked, pack })` once; the verifier decides every edit. Stores applied, rejected and offered edits in memory and autosaves the review state to the draft |
| 3 | Reads it | Below the letter: `pendingCopy.review.changesLabelOne` or `review.changesLabel`, then one row per change (label plus the words as said), Show exactly what I said (`review.showOriginalLink`), Keep it word for word (`review.undoAllButton`), Change words (`pendingCopy.review.editTextButton`) | Nothing until a tap |
| 4 | Taps an underline or its row | Card: change label and plain explanation (`review.edits.*`), "Exactly what you said" (`review.originalLabel`) with the words, the new form if any, Put it back (`review.undoEditButton`) | On Put it back: `withoutEdit`; the edit's state becomes `reverted`; soft wash on the span (MOTION 5d); `pendingCopy.review.putBack` with Undo (`common.undoButton`); haptic `tap`; review state autosaved |
| 5 | Optionally taps Show exactly what I said | The raw transcript, selectable, under `review.originalLabel`; Hear it (`review.playButton`) plays the recording | Raw is shown only to its author (K-09) |
| 6 | Optionally holds a phrase and taps Keep this as said | The phrase gets a `review.lock.lockedLabel` mark; `review.lock.explain` once | Adds the phrase to `locked`, re-runs the clean; edits inside it drop out |
| 7 | Optionally taps a word and Add "{name}" to your words | `review.addWordToDictionary`, then the F07 sheet | F07 stores the term on save; Review re-runs the clean with it for this letter only |
| 8 | Taps Add to {child}'s book or Keep private | Sticky footer: `review.destination.addButton`, `review.destination.privateButton`; then the saved card and toast (`review.destination.addedToast` or `.privateToast`) | One local transaction (DATA-REQ-048): entry with raw, every edit record, author edits, `final_text`, level, engine and pack versions, kind, date, child, language, destination, dictionary additions; draft deleted. Haptic `success`, then the settle animation (MOTION 5e) |

**B. Typed letter.** Review opens with the text exactly as typed. No underlines, no change count, no first card, no level switch, no Show exactly what I said (raw equals final). The header row, Change words and the footer work as in A. Saved with `edit_level = verbatim` and no machine edits (F04-REQ-012).

**C. Spanish letter with a signed Spanish pack.** As A. "eh" is removed as a `filler` (pack auto list). "este" is not touched; if the suggestions UX ships (F06-REQ-012, P1), a hollow ring after it opens a card "Maybe a filler" with Take it out and Keep it. Sentence case and a final mark come from the Spanish pack. No repeat is removed by rule.

**D. A letter in a language with no installed pack** (pack not downloaded, failed its SHA-256 check, or the language has no text-rules table). Review shows the letter word for word, with `review.noPackLine` (new) under the title. Only verified dictionary spellings apply. Save as A.

**E. Edit my own saved letter.** From the letter view, Edit opens Review on the entry. The stored applied and reverted edits show as in A; the person can put back, re-apply a reverted edit, switch level, lock a phrase or Change words. No new machine edit is proposed: the engine is not re-run on a saved letter. Save writes a new version (DATA-REQ-041).

### 6.3 Unhappy paths and edge cases

| ID | Trigger | System behaviour | What the person sees | Recovery | Test |
|---|---|---|---|---|---|
| F06-U01 | No transcriber or model not ready (F05 `model-missing`) | No clean runs. Draft kept | `pendingCopy.review.waitingTitle`, `.waitingBody`, Keep the recording only, Type it (`errors.micDenied.typeButton`) | Voice-only save (private, F06-REQ-030); words fill in later and open Review (6.1) | Unit; E2E with no model |
| F06-U02 | Transcription fails or returns nothing | Same as U01 with the failed copy; retry allowed unless the draft is `unrecoverable` | `errors.transcriptionFailed.*` | Retry, Type it, or Keep the recording only | Unit (exists in `review.tsx` paths) |
| F06-U03 | The engine throws on a transcript (a bug) | Catch; show the raw transcript word for word with no edits; never block save; record `error_shown{code: clean_failed}` (new enum) | The letter as heard, `review.noChanges` | Save word for word | Unit: inject a throwing pack |
| F06-U04 | App killed or backgrounded in Review | Review state (level, reverted ids, locked phrases, author edits, kind, date, child) autosaved to the draft within 500 ms of each change; raw is already on the draft | On relaunch, the waiting row on Tonight; Review reopens exactly as left | Continue | Kill test, 100 iterations: state identical after relaunch |
| F06-U05 | Phone call, Siri or alarm while Hear it plays | Player pauses on the interruption; audio mode back to idle | Play button shows Hear it again | Tap to resume | Manual device script |
| F06-U06 | Low storage at save | Save is one SQLite transaction with no new audio bytes; if it fails, nothing half-saves | `errors.generic.body` in the footer area (exists) | Free space, tap save again; draft intact | Unit with a failing store (exists pattern) |
| F06-U07 | Double tap on save, or tapping both save buttons | `saving` ref blocks the second call (exists); buttons disabled until the first resolves | One save, one toast | n/a | Unit: two taps, one row |
| F06-U08 | Offline | Review needs no network. Save is local; sync is F16 | Nothing different | n/a | E2E in airplane mode |
| F06-U09 | Letter language has no installed pack, or its SHA-256 check fails | No pack-driven edits; dictionary spellings only (F06-REQ-011) | `review.noPackLine` (new) | Download the pack in Settings > Languages (F05); the saved letter is not re-cleaned later | Unit: missing and corrupt pack fixtures |
| F06-U10 | The pack updates while a draft is open | The draft keeps the pack version pinned at step 2 (F06-REQ-024) | Nothing changes on screen | n/a | Unit: swap pack mid-review |
| F06-U11 | A hostile or buggy rule provider or pack proposes a meaning change (the R-01 list) | Refused by the verifier; stored in `rejected` with its reason; never shown as a change | Nothing | n/a | Regression suite (F06-REQ-019) |
| F06-U12 | A word filler that has a real meaning (Spanish "este", Mandarin 那个, Arabic يعني) | Never applied automatically; offered only if F06-REQ-012 ships | Hollow ring and "Maybe a filler" card, or nothing | Keep it, or Take it out | Unit per pack |
| F06-U13 | Portuguese "um" (a, one), English "uh-uh" (no) or "mm-hmm" (yes) | Not removed (F06-REQ-005, -010) | Kept as said | n/a | R-01 regression cases |
| F06-U14 | A child named Hope, Will, Joy or Grace | "heard as" and case-variant fixes change a lowercase word only when it was taught as a mishearing for that term; a common word that matches a name is never capitalised mid-sentence (F06-REQ-014) | "I hope" stays "I hope" | Tap the word and Add to your words if it was the name | R-01 regression cases |
| F06-U15 | A machine change the person disagrees with | Put it back reverts it; stored as `reverted`, counted in `machine_edit_reverted` | Words as said, soft wash, Undo | Undo restores the edit | Unit (exists: `withoutEdit`) |
| F06-U16 | Person taps Keep it word for word, then wants the fixes back | Level returns to clean; edits re-applied from the stored list, not re-run | Underlines return | n/a | Unit |
| F06-U17 | Person edits text in Change words that overlaps a machine edit | The author diff wins over that span; the machine edit is stored as `superseded_by_author` and no longer shown as a change | The words they typed | Undo inside the text field; Show exactly what I said stays available | Replay test (DATA-REQ-041) |
| F06-U18 | Person clears the whole text in Change words | Save buttons disabled while `final_text` is empty (exists) | Buttons disabled | Type words, or leave and Let it go from Tonight | Unit (exists) |
| F06-U19 | Person leaves Review with Close | The draft and its review state are kept; nothing is deleted | Tonight waiting row | Reopen | Unit |
| F06-U20 | Let it go in Review | Confirm `pendingCopy.listen.discardTitle`, `.discardBody`, `.discardConfirm`; F04 discard path (F04-REQ-009) | Dialog | Keep it | F04 tests |
| F06-U21 | Wrong child picked | "To {child}" picker in the header (exists); the dictionary for the new child is used and the clean re-runs | New child's name in the dateline | Pick again | Unit: two children, two dictionaries |
| F06-U22 | Low-confidence words from F05 | Shown with a light dashed mark, distinct from machine changes; the card offers Hear this part and Change words; no machine edit happens (F06-REQ-029) | Mark plus `review.unsure.label` (new) | Change the word or leave it | Unit with flagged fixture |
| F06-U23 | Transcript is very long (30-minute cap, about 4,000 words) | Clean runs off the render path; text shows raw first, then edits within 1 s on the SE 3 (section 9) | `tonight.states.transcribing` then the letter | n/a | Perf test with a 4,000-word fixture |
| F06-U24 | VoiceOver | Every change is a row (exists); underlines hidden from the rotor; rows read "Took out: um", "Name: Asha, you said Usher"; the read card is announced once; low-confidence rows read "Might be misheard" | Rows in reading order after the letter | n/a | VoiceOver script (TDD 09) |
| F06-U25 | AX5 text size | Header row stacks: kind, date, language each on its own line; footer buttons stack; the letter never truncates (BL-265) | Stacked layout | n/a | Snapshot at AX5 on SE 3 |
| F06-U26 | Reduce Motion | The wash on put-back becomes a 150 ms fade; no settle scale (MOTION) | Fades only | n/a | Snapshot test with Reduce Motion |
| F06-U27 | Right-to-left letter (Arabic typed or a future Arabic transcript) in an English UI | Letter text block uses the paragraph's own direction; underlines and rows follow the text direction; the UI chrome stays left to right | Arabic aligned right | n/a | Manual RTL script; unit on segment order |
| F06-U28 | Co-parent opens the other parent's letter | Final text only, from `book_entries`; no underlines, no change count, no Show exactly what I said, no Edit; recording line from F11 (F11-REQ-015) | Letter as `final_text`, byte for byte (F11-REQ-016) | n/a | Access test plus render test |
| F06-U29 | Author edits a saved letter on two phones offline | Words, `machine_edits`, author edits and `edit_level` push as one group; compare-and-set; the losing version is kept (F16 C1, F16-REQ-010, -011) | F16 conflict note | F16 | F16 tests |
| F06-U30 | Account signed out, lapsed or deleted | Review works without an account; Plus never gates any part of Review (03 principle 6). After account deletion, local letters follow F17 | No difference while signed out or lapsed | n/a | Unit: Review with no session and with lapsed entitlement |
| F06-U31 | An app update ships a new engine whose verifier would refuse an edit in a saved letter | The letter is not changed. On the author's phone, the letter view shows one quiet note; tapping it opens Review on that edit (F06-REQ-022) | `review.engineNote` (new) | Put it back, or Keep it | Engine audit test |
| F06-U32 | Sample transcript in a development build | Never saved as a transcript (exists) | `pendingCopy.review.sampleBanner` | Keep the recording only | Exists |
| F06-U33 | Person asks for nicer wording (support email, feedback, App Store review) | No feature. Support replies with the help article (`settings.help.mistakes`) and the reason in plain words | n/a | n/a | Content review of the support macro (section 6.4) |
| F06-U34 | iPhone SE 3 under memory pressure right after transcription | The engine holds no model; the Whisper context is released by F05 before Review renders (TDD 03 5.2) | Nothing different | n/a | Perf run on SE 3 |

### 6.4 Copy

Existing keys are in `packages/content/src/strings.en.ts` (`review.*`, `settings.*`) or `apps/mobile/src/lib/copy.ts` `pendingCopy.review`. New strings go in `apps/mobile/src/components/review/copy.ts` (new) until the content agent moves them (brief coordination rule; BL-156). Proposed text follows `packages/content/VOICE.md`; content and counsel own the final words. VOICE bans words that suggest software tidied a letter, so new strings use "fix" (K-26).

| Key | Status | Proposed text |
|---|---|---|
| `review.title`, `.trustLine`, `.changesLabel`, `.noChanges`, `.showOriginalLink`, `.originalLabel`, `.undoEditButton`, `.undoAllButton` | Exist | as in content |
| `review.edits.*.label`, `.explain` | Exist | as in content, except punctuation below |
| `review.edits.punctuation.explain` | Revise: today it says we added commas where you paused, which v1.0 rules never do | We added a capital letter or a full stop. Your words are the same. |
| `review.tidiedLabel` | Revise (K-26) | With small fixes |
| `review.showTidiedButton` | Revise (K-26) | Show with small fixes |
| `review.subtitle` | Revise (K-26); unused in `review.tsx` today | Here is what you said, with small fixes. |
| `review.lock.button`, `.explain`, `.lockedLabel`, `.unlockButton` | Exist, not yet wired | as in content |
| `review.addWordToDictionary` | Exists, not yet wired | as in content |
| `review.firstNote.title`, `.body`, `.dismissButton` | Exist (K-14) | as in content |
| `review.voiceCheck.*` | Exist | as in content |
| `review.destination.*` | Exist | as in content |
| `pendingCopy.review.*` | Pending (BL-156) | as in `copy.ts` |
| `review.noPackLine` | New | Kept word for word. Small fixes for this language are not on this phone yet. |
| `review.unsure.label` | New | Might be misheard |
| `review.unsure.explain` | New | We were not sure about this part. Hear it, then change it if it is wrong. |
| `review.unsure.hearButton` | New | Hear this part |
| `review.unsure.a11y` | New | Might be misheard: {words} |
| `review.engineNote` | New | We now leave one small fix in this letter as you said it. Take a look. |
| `review.engineNoteKeepButton` | New | Keep the fix |
| `review.suggestions.filler.label` (P1) | New | Maybe a filler |
| `review.suggestions.filler.explain` (P1) | New | Sometimes this word fills a pause. Sometimes it means something. You decide. |
| `review.suggestions.repeat.label` (P1) | New | Said twice |
| `review.suggestions.repeat.explain` (P1) | New | This came out twice in a row. You decide whether to keep both. |
| `review.suggestions.removeButton` (P1) | New | Take it out |
| `review.suggestions.keepButton` (P1) | New | Keep it |
| `settings.tidyLabel`, `.tidyOn`, `.tidyOff`, `.tidyHelp` | Revise (K-26), owned by F17 | Small fixes; With small fixes; Word for word; Word for word keeps every um and false start. Either way, we never rewrite your words. |
| `book.provenance.spokenTidied` | Revise (K-26), owned by F09 and F15 | Spoken, with small fixes |
| `support.macro.noRewrite` | New, support macro (not in-app) | Thank you for telling us. We keep each letter in your own words, so we do not reword or polish them. You can change any word yourself with Change words, and the recording always keeps exactly how you said it. |

Every string with "never" goes through the claims registry (LEGAL-REQ-044). "We never rewrite your words" already exists (`settings.neverRewrite`).

## 7. Requirements and acceptance criteria

### 7.1 The R-01 defect inventory

Every item below was reproduced on 3 Oct against a scratch copy of `packages/core/src` run with Node 22 type stripping (repo dependencies are not installed in this checkout, so `npm test` could not run here; 09 R-01 records 237 of 237 passing). Rules-only means the shipped rules reach it with no model.

| # | Defect (09 R-01, R5 4.4) | Reachable by | Fixed by |
|---|---|---|---|
| D1 | Tokenizer drops combining marks: Devanagari words split into single letters (E1) | Rules (every Hindi count and boundary) | F06-REQ-001 |
| D2 | A `punctuation` edit changes बेटी to बेटा, or أنتِ to أنتَ, and passes (E2, E3) | Rule provider or model | F06-REQ-002 |
| D3 | Decomposed accents: swapping one combining accent for another passes | Rule provider or model | F06-REQ-002 |
| D4 | Inserting an invisible direction mark or joiner passes | Rule provider or model | F06-REQ-003 |
| D5 | Chinese ？ and ！ and Arabic ؟ bypass the sentence-type guard (E4) | Rule provider or model | F06-REQ-004 |
| D6 | "uh-uh" (no) is cut into two fillers, leaving a stray hyphen | Rules | F06-REQ-005 |
| D7 | Fillers inside guillemets or curly single quotes are removed; only the straight double quote, U+201C, U+201D, « and » are counted as quote marks | Rules | F06-REQ-006 |
| D8 | Hindi or Arabic agreement changes pass when labelled `punctuation` | Rule provider or model | F06-REQ-002 |
| D9 | `agreement` allows plural to singular on nouns through the generic -s rule | Model (no rule emits `agreement`) | F06-REQ-007 |
| D10 | Dictionary case-variant fixes change common words that match a name ("hope" to "Hope", "will" to "Will") | Rules | F06-REQ-008 |
| D11 | Dictionary "heard as" forms match inside Devanagari words, doubling a vowel sign | Rules | F06-REQ-009 |
| D12 | The English filler list removes Portuguese "um" (a, one) | Rules | F06-REQ-010 |
| D13 | A "heard as" form that is another family member's name swaps one name for the other | Rules | F06-REQ-014 |
| D14 | `normalizeChars` removes the French no-break space before ? and ! with no edit (E7) | Rules (every letter) | F06-REQ-016 |
| D15 | The experiment scorer uses the same broken word regex, so Hindi and Chinese error rates are meaningless (E8) | Experiments | F06-REQ-020 |

Found on 3 Oct while checking D5, not in R-01: `punctuationEdits` treats only `. ! ? । ॥` as sentence ends, so it appends "." after a Chinese 。 or an Arabic ؟ [F] scratch run of `packages/core/src/punctuation.ts`. Not reachable today because the app does not run `RulePunctuationProvider`; F06-REQ-015 covers it before it is wired. Proposed for the R-01 list (section 13).

### 7.2 Requirements

| ID | P | Requirement | Acceptance criteria (Given / When / Then) | Source |
|---|---|---|---|---|
| F06-REQ-001 | P0 | Words include their combining marks and joiners | Given `tokens()` in `text.ts`, When it reads a Devanagari phrase, Then each word is one token with all its vowel signs and viramas (R-01 D1 fixture: three words, three tokens). Given U+200C or U+200D between two letters of one word, Then it stays inside that token. The same word pattern is used by `words`, `insideWord`, `wordWindow`, `wordAt`, `termRegex` and the change ceiling | R-01 D1; R5 E1 |
| F06-REQ-002 | P0 | A `punctuation` edit never changes a letter or a mark | Given `lettersOnly`, Then it keeps `\p{M}`. Given a `punctuation` edit whose original and replacement differ in any code point other than punctuation, whitespace or the case of a sentence-start letter, Then it is refused `punctuation_changed_letters`. Given the R-01 cases बेटी to बेटा and أنتِ to أنتَ as `punctuation` or `agreement`, Then both are refused. Given a decomposed accent swapped for another accent, Then refused. Given English "daughter" to "son", Then still refused (control) | R-01 D2, D3, D8; R5 E2, E3 |
| F06-REQ-003 | P0 | No edit adds, removes or moves an invisible character | Given an edit whose original and replacement differ in their count of `\p{Default_Ignorable_Code_Point}` or `\p{Bidi_Control}` characters, Then it is refused with the new reason `changes_invisible`. Given inserting U+200F or U+200D anywhere, Then refused | R-01 D4 |
| F06-REQ-004 | P0 | Sentence type covers every script we ship | Given `moodMarks`, Then it counts `? ! ¿ ¡ ？ ！ ؟`. Given 。 to ？, . to ؟, or ！ removed, Then refused `changes_sentence_type`. Given "You did it." to "You did it?", Then still refused (control) | R-01 D5; R5 E4 |
| F06-REQ-005 | P0 | A filler joined to another word by a hyphen is not a filler | Given "uh-uh" anywhere in a letter, When the rules run at level clean, Then no edit touches it and `final_text` contains "uh-uh". The same holds for any listed filler joined by a hyphen to a word | R-01 D6 |
| F06-REQ-006 | P0 | Every quotation style is protected and counted | Given words inside `« »`, curly single quotes (U+2018, U+2019) used as a pair, low-high quotes (U+201E, U+201C), `「 」` or `『 』`, Then `quotedSpans` protects them and no filler, repeat or dictionary edit lands inside. Given `quoteMarkCount`, Then it counts those marks; an apostrophe inside a word is not a quote mark. Given the R-01 case of a filler inside guillemets, Then it is kept | R-01 D7 |
| F06-REQ-007 | P0 | Agreement is a closed table of verb and article pairs | Given `isAgreementPair`, Then it accepts only pairs listed in the letter's pack `agreement.pairs` (English: today's `AGREEMENT_GROUPS`); the generic -s, -es, -ies rule is removed. Given "dogs" to "dog", Then refused. Given a pack with an empty table (every non-English pack at v1.0), Then every `agreement` edit is refused `type_not_allowed_at_level` | R-01 D9 |
| F06-REQ-008 | P0 | A common word that matches a name stays as said | Given a dictionary term whose lowercase form is in the pack's `nameWords` table (English seeds include hope, will, joy, grace, rose, june, faith; native reviewers extend each pack), When `dictionaryEdits` runs, Then it never proposes a case-variant fix of the lowercase word. Given the R-01 cases, Then "I hope you sleep" and "You will love it" are unchanged with a child named Hope or Will. Given the recogniser wrote "Hope" mid-sentence, Then it stays "Hope" | R-01 D10 |
| F06-REQ-009 | P0 | Names match whole words only, in every script | Given `termRegex`, Then its boundaries treat `\p{M}` and joiners as part of a word. Given the R-01 Devanagari case, a "heard as" form that is the start of a longer word, Then no edit is proposed and no vowel sign doubles | R-01 D11 |
| F06-REQ-010 | P0 | Fillers come from the letter's own pack, and only pure hesitation sounds are removed | Given a letter with `language = pt`, Then the English filler list is not used and "um" (a, one) is kept (R-01 D12). Given any pack, Then only words in `fillers.auto` are removed as `filler`; words in `fillers.offer` are never applied by the engine. Given English, Then `fillers.auto` equals today's `FILLERS` | R-01 D12; R5 section 0 item 7, 4.1; B5 |
| F06-REQ-011 | P0 | No verified pack means no pack-driven edits | Given a letter whose language pack is missing, failed its SHA-256 check, or has no text-rules table, When Review cleans it, Then only dictionary spellings apply, `review.noPackLine` shows, and the letter saves with `pack_ref = null`. Given the English pack, Then it is always present (bundled, B13) | B13; F05 pack delivery |
| F06-REQ-012 | P1 | Offered fillers and repeats are the author's choice | Given `CleanResult.suggestions` and the pack's offered fillers, Then each shows as a hollow ring after the word, distinct from applied changes, never colour alone. Given Take it out, Then the edit passes through `acceptSuggestions` and `verifyEdits` again and is stored with `accepted_by: 'author'`; if refused, nothing changes. Given Keep it, Then nothing changes and nothing is learned | ADR 0012; TDD 03 3.7.1; BL-146; R5 4.1 |
| F06-REQ-013 | P0 | Non-English packs remove nothing by repeat rule at v1.0 | Given a pack whose `repeats.always` is empty (every non-English pack at v1.0), Then no `repeat` edit is applied automatically; exact immediate doubles of one word are only offered (F06-REQ-012) | R5 4.2 |
| F06-REQ-014 | P0 | One family name never becomes another | Given a "heard as" form equal (case-insensitive) to another dictionary term, Then `dictionaryEdits` proposes nothing for it and the verifier refuses it `stt_fix_protected_word`. Given F07 adding such a form, Then F07 refuses it at save (request to F07) | R-01 D13 |
| F06-REQ-015 | P0 | Sentence case and the final mark follow the pack | Given `RulePunctuationProvider` wired into Review through `cleanWithProviders`, Then sentence ends and the final mark come from the pack `punctuation` profile (`。` for zh, `।` for hi if the pack says so, `.` for Latin scripts), caseless scripts get no case edits, and a text already ending in any of the pack's terminal marks gets no final mark. Given a Chinese letter ending in 。 or an Arabic letter ending in ؟, Then no "." is added | Section 7.1 note; R5 4.3; TDD 03 3.7 item 1 |
| F06-REQ-016 | P0 | Nothing changes a letter except a stored edit | Given a spoken letter, Then `final_text` equals `applyEdits(raw, applied)` with leading and trailing whitespace trimmed, then the author layer; `normalizeChars` is not called by `faithfulClean`, `withoutEdit` or `segments`. Given the founder's character rule (no em or en dashes, curly quotes or ellipsis characters), Then each replacement is a `punctuation` edit from a pack character table, underlined and undoable. Given a French pack, Then U+00A0 and U+202F before `? ! : ;` and inside `« »` are kept (R5 E7). Given a Chinese pack, Then full-width punctuation is kept | R-01 D14; F04 Q6; R5 4.3, K7 |
| F06-REQ-017 | P0 | The verifier is the only gate | Given any edit (rule, pack table, accepted suggestion, re-applied edit, dictionary fix), Then it passes `verifyEdits` against raw at the moment of save; there is no bypass flag, no remote switch and no code path from a provider to `final_text` that skips it. Given `JsonModelEditProvider`, Then no app module imports it (lint rule) | CLAUDE.md; ADR 0003; B14 |
| F06-REQ-018 | P0 | The engine version moves with every behaviour change | Given F06-REQ-001 to -016 merged, Then `ENGINE_VERSION` is 4 with a dated changelog line in `pipeline.ts`. Every new test is titled with the constitution rule and the R-01 item it proves ("never genders the child: R-01 D2") | CLAUDE.md; R5 4.4 |
| F06-REQ-019 | P0 | Per-language regression suite gates every pack | Given the suite in `packages/core/test/regression/`, Then each of D1 to D14 has at least one refused case in every launch language whose script it applies to (Latin: D3, D4, D6, D7, D10, D12, D13, D14; Devanagari: D1, D2, D4, D8, D9, D13; Arabic: D2, D3, D4, D5, D8; Chinese: D4, D5, D7), plus one accepted legitimate edit per language as a control. When it runs in Node CI and inside the iOS dev build under Hermes, Then accepted meaning changes are 0. Given any failure for a language, Then that language's pack cannot be published to the manifest (F19) and the build fails. Cases come from R-01 and R5 4.4; each non-English case is signed off by a native reviewer (R-08) | R-01 launch gate; 05 section 5 never-cut list |
| F06-REQ-020 | P0 | The experiment scorer counts words the same way | Given `experiments/score.ts` `normWords`, Then it uses the core tokenizer; Chinese is scored by character error rate. Given the R5 E8 Hindi and Chinese inputs, Then word counts match the core tokenizer | R-01 D15; R5 E8 |
| F06-REQ-021 | P0 | The property test covers scripts and invisibles | Given `verify.fuzz.test.ts`, Then its generators include combining marks, joiners, direction marks and the mood marks in F06-REQ-004, with a fixed seed in CI and a random seed nightly; invariant: no accepted edit changes a letter, mark, invisible character, negation, number, mood mark or quote count | TDD 03 7.2 |
| F06-REQ-022 | P0 | An engine update never changes a saved letter | Given an app update that raises `ENGINE_VERSION`, When the app first opens, Then for each of this author's own letters it re-checks every applied edit with the new verifier and the letter's language pack, off the main thread, and changes no row. Given an edit the new verifier refuses, Then the letter view shows `review.engineNote` to the author only, and Review opens on that edit with Put it back and Keep the fix. Given 1,000 letters on an SE 3, Then the audit finishes within 60 s in batches that never block a frame over 16 ms | ADR 0012 consequences; 03 PS2; DATA-REQ-040 |
| F06-REQ-023 | P0 | Every edit decision is stored against raw | Given a save, Then `machine_edits` holds one record per edit with `type`, `start`, `end`, `original`, `replacement`, `source`, `state` (`applied`, `reverted`, `rejected`, `offered`, `superseded_by_author`), `reason` for rejected ones, and `accepted_by` where the author accepted a suggestion. Given the store today saving only applied edits, Then rejected and reverted edits are added | DATA-REQ-042 Rev; TDD 03 3.7 item 3 |
| F06-REQ-024 | P0 | The pack used is pinned and recorded | Given Review starts cleaning, Then the pack id and version are pinned for that draft; a pack update mid-review changes nothing. Given save, Then `pack_ref` (new, `lang@version`) is written and is immutable like `engine_version` | B13; DATA-REQ-040 |
| F06-REQ-025 | P0 | Every version replays byte for byte | Given any saved version, When `replayFinalText(raw, machine_edits, author_edits)` (new, `packages/core`) runs, Then it equals that version's `final_text` byte for byte. Given 500 generated letters with random put-backs, locks and hand edits, Then 500 of 500 replay | DATA-REQ-041; BL-148 |
| F06-REQ-026 | P0 | Hand edits are stored as the author's own layer | Given Change words, When the author saves, Then the change is stored as `author_edits` (new): word-level `{start, end, replacement}` against the machine-cleaned text, computed by a word diff; each save writes an `entry_versions` row; machine edits overlapping an author span become `superseded_by_author`. Author edits never pass the verifier and are never counted as machine edits | TDD 03 3.7 item 4; DATA-REQ-041; BL-148 |
| F06-REQ-027 | P0 | A saved letter is never re-cleaned | Given a saved letter reopened in Review, Then the engine is not re-run on raw; Review shows the stored records. Given a reverted edit re-applied, Then it is re-verified with the current verifier and pack; if refused, it stays reverted and its row reads that this fix is no longer offered | DATA-REQ-040; 03 PS2 |
| F06-REQ-028 | P0 | Every machine change is visible and undoable | Given a spoken letter at level clean, Then each applied edit has an underline or removal mark and a row; the count label matches the number of applied edits. Given Put it back, Then the text equals raw with that edit removed and a toast with Undo shows for 5 s. Given Keep it word for word, Then level becomes verbatim and only dictionary spellings and punctuation remain. Given Show exactly what I said, Then raw shows, selectable, to its author only | DATA-REQ-042; K-26; PS3 |
| F06-REQ-029 | P0 | Low-confidence words are marked, never changed | Given `flags` with `reason = 'low_confidence'` from F05, Then each flagged span shows a dashed mark distinct from machine changes, a row "Might be misheard", and a card with Hear this part (plays from the span's word timings, else from the start) and Change words. No machine edit is ever proposed from a flag. Given no flags, Then nothing shows | types.ts `Flag`; ADR 0009 |
| F06-REQ-030 | P0 | A voice-only letter stays private and on the phone until it has words | Given Keep the recording only, Then the entry saves with `in_book = false`, `transcript_status = waiting`, and does not sync. Given F05 fills its words, Then the letter opens in Review with a destination choice, and syncs only after save. Never auto-added to the book | TDD 03 OQ-4; BL-142; DATA-REQ-040 (raw is immutable once on the server) |
| F06-REQ-031 | P0 | The author can lock a phrase | Given a selection in the letter and Keep this as said (`review.lock.button`), Then the span is stored in `locked_spans` (new) against raw, edits inside it drop out, and the span shows `review.lock.lockedLabel`; Allow small fixes removes the lock. Given the engine, Then `CleanOptions` accepts locked spans (new) as well as phrases | `review.lock.*`; `protect.ts` |
| F06-REQ-032 | P0 | Add to your words from Review | Given a word or a name tapped in the letter, Then `review.addWordToDictionary` opens the F07 sheet with the word as heard. Given the term saved, Then this letter re-cleans with it and the term commits in the save transaction (DATA-REQ-048) | B-REQ-006; F07 |
| F06-REQ-033 | P0 | Others see final text only | Given a co-parent reading A's letter, Then the app reads `book_entries` only; no underline, change count, raw transcript, edit record, author layer, locked span or Edit control renders; text equals `final_text` byte for byte. `author_edits`, `locked_spans` and `pack_ref` join the author-only columns | PRD-REQ-004 Rev; K-09; F11-REQ-016 |
| F06-REQ-034 | P0 | The read card shows once | Given the first spoken transcript on this install, Then `review.firstNote.*` shows before the first save; Got it sets `review.firstNoteSeen`. Never for typed letters, never again on this install; always in Settings > Help (`settings.help.mistakes`) | K-14; PRD 6.3 |
| F06-REQ-035 | P0 | Review places the F04 controls | Given Review, Then the header shows "To {child}" (picker when two or more children), the kind control (`kind-control.tsx` from F04, F04-REQ-014), the date row (`date-sheet.tsx`, F04-REQ-015) and the language chip when the author has two or more languages. Given a change to any of them, Then it is written to the draft at once and the saved entry matches | F04 11.1, 11.4 |
| F06-REQ-036 | P0 | Review never loses work | Given any change in Review, Then the review state is written to the draft within 500 ms. Given 100 kills at random points in Review, Then 100 of 100 reopen with the same text, edit states, locks, author edits, kind, date and child | DATA-REQ-048; F04 durability |
| F06-REQ-037 | P0 | Typed letters get no machine edits | Given a typed or mixed draft, Then `faithfulClean`, character edits and `normalizeChars` are not called; Review shows no change count, underline, read card, level switch or Show exactly what I said; save stores `edit_level = verbatim` and `machine_edits = []` | B5; F04-REQ-012 |
| F06-REQ-038 | P0 | Clean is the default; the author can choose | Given a spoken draft and no author default, Then level is clean. Given the author default set to Word for word (F17), Then Review opens at verbatim. Given a switch in Review, Then it applies to this letter only | PRD 1.3 levels; `settings.tidy*` |
| F06-REQ-039 | P0 | No control makes words nicer | Given every screen and remote config, Then there is no rewrite, polish, summarise, shorten, translate or tone control, and no flag can add one. Given `packages/content/test/rules.test.ts`, Then a new rule fails review, book and settings strings that offer to improve, polish or rewrite a letter | CLAUDE.md; 03 principle 1 |
| F06-REQ-040 | P0 | Review is fully accessible | Given VoiceOver, Then the order is dateline, title, read card, letter, change rows, low-confidence rows, actions, footer; each row announces its label and the words as said. Given AX5, Then the header row and footer stack and nothing truncates. Given Reduce Motion, Then fades only. Every target is 44 by 44 pt or larger | LEGAL-REQ-051; TDD 09; COMPONENTS 2.19 |
| F06-REQ-041 | P0 | Review is fast | Given an SE 3 and a 300-word transcript, Then raw to fully marked text is p95 300 ms. Given a 4,000-word transcript, Then raw text shows within 300 ms and marks within 1 s, with no frame over 50 ms on the JS thread | Section 9 |
| PRD-REQ-004 Rev | P0 | Author-only working material, widened | `raw_transcript`, `machine_edits`, `stt_meta`, plus new `author_edits`, `locked_spans`, `pack_ref`, readable only by the author; `book_entries` and the F16 pull omit them | K-09; F06-REQ-033 |
| DATA-REQ-040 Rev | P0 | Immutability, widened | `pack_ref` joins the immutable columns. A voice-only letter does not reach the server before it has words (F06-REQ-030) | DATA-REQ-040 |
| DATA-REQ-041 Rev | P0 | Versions include the author layer | Every change to `final_text`, `in_book`, `machine_edits`, `author_edits` or `locked_spans` writes a version row carrying all of them | DATA-REQ-041 |
| DATA-REQ-042 Rev | P0 | Edit records carry state | As F06-REQ-023 | DATA-REQ-042 |

## 8. Data, privacy and security

| Data | Level (PRD 7.10) | Where | Who reads | Retention | Leaves the phone? |
|---|---|---|---|---|---|
| `raw_transcript` | L4 | Device `entries`; Postgres `entries` | Author only (PRD-REQ-004) | Immutable from insert (DATA-REQ-040); purge rules F17 | Syncs, author-only |
| `machine_edits` with state and reasons | L4 author-only | Device; Postgres | Author only | Versioned (DATA-REQ-041) | Syncs, author-only |
| `author_edits` (new) | L4 author-only | Device; Postgres | Author only | Versioned | Syncs, author-only |
| `locked_spans` (new) | L4 author-only | Device; Postgres | Author only | Versioned | Syncs, author-only |
| `pack_ref` (new), `engine_version`, `edit_level` | L2 | Device; Postgres | `engine_version` and `edit_level` are in `book_entries` today; `pack_ref` author-only (it names the language, which is L4 in analytics, B-NFR-001) | Immutable (`pack_ref`, `engine_version`) | Syncs |
| `final_text` | L4 | Device; Postgres | Author; book members through `book_entries` when `in_book` | Versioned | Syncs |
| Review state on the draft (level, edit states, locks, author edits, kind, date, child) | L4 | Device `drafts` only | Author's phone | Until save or Let it go | Never (drafts do not sync, F04-REQ-027) |
| Voice-only entry before words | L4 | Device only | Author's phone | Until words arrive and the author saves | Never before words (F06-REQ-030) |
| Language pack tables | L1 | Device, from the signed manifest (F19) | App | Until the pack is deleted | Downloaded, never uploaded |
| Analytics events | L2 | PostHog after opt-in | Team | 12 months (TDD 03 4.1) | Enums and counts only |

Rules:
- Nothing in this feature calls a network. Review works offline; text leaves the phone only by sync to the family's own book (03 principle 3).
- No letter text, raw transcript, edit `original` or `replacement`, locked phrase, dictionary term or language name in logs, analytics, crash reports or error messages (LEGAL-REQ-014). `edit-provider.ts` already returns fixed error codes for this reason; the engine audit (F06-REQ-022) and clean failures (F06-U03) follow the same pattern.
- Export (F15) includes the author's own raw transcript, edit records and author layer; never another author's (DATA-REQ-050; DELETION spec 4.2). Request to F15: include `author_edits` and `locked_spans` in the author's own export.
- Server: `author_edits`, `locked_spans` and `pack_ref` need a migration with classification comments, the `approve-migration` label, the immutability guard extended to `pack_ref`, the version trigger extended to the new columns, and `book_entries` left without them (BACKLOG rule 9; D-041).

## 9. Non-functional requirements

Shared budgets are in `06-nfr.md` (not yet written); these are specific to F06.

| Area | Budget | How measured |
|---|---|---|
| Clean time, 300 words | p95 300 ms on iPhone SE 3, Hermes release build | Perf marker from raw available to marks rendered. Baseline [F]: 5.2 ms per `faithfulClean` for 301 words on Node 22 in this sandbox (scratch run, 3 Oct); the phone number is unmeasured |
| Clean time, 4,000 words (30-minute cap) | Raw text in 300 ms, marks in 1 s, no JS frame over 50 ms | Same marker. Baseline [F]: 527 ms on Node 22 for 4,001 words, so the cost grows faster than length; WP-F06-03 profiles it (likely `tokens(raw)` re-run per edit in `checkEdit`) and runs the clean off the render path |
| Engine audit on update | 1,000 letters in 60 s or less on SE 3; batches under 16 ms of main-thread time | Perf build with a seeded store |
| Pack text tables | English bundled; each pack's text tables 50 KB or less compressed [A] (validated when the first pack is built) | CI size check; app budget under 40 MB (B13) |
| Determinism | Same raw, level, dictionary, locks, pack version and engine version give the same edits, byte for byte, on Node and Hermes | Regression suite run in both (F06-REQ-019) |
| Reliability | Zero letters lost or silently changed by Review; 100 of 100 kills in Review recover (F06-REQ-036) | Kill run |
| Accessibility | VoiceOver order, AX5, Reduce Motion, 44 pt targets (F06-REQ-040) | TDD 09 scripts; snapshot tests |
| Memory | The engine allocates no model; peak under 20 MB for a 4,000-word letter [A] | Instruments on SE 3 |

## 10. Analytics

All events fire only after analytics opt-in (B-NFR-001, B10) and carry L2 properties only. Catalogue: `packages/analytics/src/catalog.ts`. Never: words, edit text, language names, names, pack ids (they name a language).

| Event | Status | Properties | Question it answers |
|---|---|---|---|
| `machine_edit_reverted` | Exists | `edit_type`, `source` | Is any edit type wrong often enough to change the rules? (guardrail: under 5% overall, 10% per type) |
| `letter_saved` | Exists; add `edit_level` (enum: clean, verbatim) and `low_confidence_count` (int 0 to 500) | `machine_edit_count`, `edits_reverted_count` exist | Revert rate denominator; how often people choose word for word (U2); how often F05 flags words |
| `review_action` | Exists; add values `lock_phrase`, `add_word`, `suggestion_accepted`, `suggestion_kept`, `edit_reapplied`, `engine_note_opened`, `low_confidence_opened` | `action` | Which Review tools people use; whether low-confidence marks get attention |
| `error_shown` | Exists; add `code` value `clean_failed` | `code` | Does the engine ever fail on real transcripts? Target zero |
| `engine_audit_completed` | New | `letters_bucket` (enum: lt_10, 10_99, 100_999, 1000_plus), `refused_bucket` (enum: 0, 1_9, 10_plus) | Does a new engine refuse edits already in saved letters, and how many? |

Server aggregate (S): share of synced spoken letters with `sounds_like_me = true`, by week; share at `edit_level = verbatim`. No content.

Author correction rate per language (03 section 4.3) is computed on the device from `author_edits` word counts against raw word counts, bucketed. How a per-language figure leaves the phone without sending a language name is F05 Q8; F06 supplies the on-device computation only.

## 11. How we build it (with the architect)

### 11.1 Components and files

| Part | File | Status |
|---|---|---|
| Tokenizer, letters-only, fillers out of code | `packages/core/src/text.ts` | Exists; F06-REQ-001, -002, -010, -016 |
| Mood marks, quote marks, invisible-character guard, agreement table from pack | `packages/core/src/meaning.ts` | Exists; F06-REQ-003, -004, -006, -007 |
| Verifier | `packages/core/src/verify.ts` | Exists; reads the pack through `VerifyContext.pack` (new field); new reason `changes_invisible` in `types.ts` |
| Quoted spans, whole-word term match, family-name guard, locked spans | `packages/core/src/protect.ts` | Exists; F06-REQ-006, -008, -009, -014, -031 |
| Fillers and repeats from the pack | `packages/core/src/rules.ts`, `repeats.ts` | Exists; tables move to the English pack; F06-REQ-005, -010, -013 |
| Pack-driven punctuation and character edits | `packages/core/src/punctuation.ts` | Exists; F06-REQ-015, -016 |
| Text-rules pack type, English pack, loader and validator | `packages/core/src/pack.ts`, `packages/core/packs/en.json` | New. Schema shared with F05 (which owns delivery and the speech parts of a pack) |
| Pipeline: pack option, locked spans, no `normalizeChars`, `ENGINE_VERSION` 4, `replayFinalText`, `auditEdits` | `packages/core/src/pipeline.ts` | Exists; F06-REQ-016, -018, -022, -025 |
| Author layer word diff | `packages/core/src/author-edits.ts` | New; F06-REQ-026 |
| Regression suite, per language | `packages/core/test/regression/*.test.ts` | New; F06-REQ-019 |
| Property test | `packages/core/test/verify.fuzz.test.ts` | Exists; F06-REQ-021 |
| Experiment scorer | `experiments/score.ts` | Exists; F06-REQ-020 |
| Review screen | `apps/mobile/src/app/review.tsx` | Exists; split into the parts below |
| Review state reducer (pure) | `packages/core/src/review-state.ts` | New: level, edit states, locks, author edits, put back, re-apply; unit-tested in Node |
| Transcript marks: applied, removed, offered, low confidence, locked | `apps/mobile/src/components/capture/transcript.tsx` | Exists; extend |
| Change rows, edit card, suggestion card, unsure card | `apps/mobile/src/components/review/*.tsx` | New |
| Review strings | `apps/mobile/src/components/review/copy.ts` | New (moves to `packages/content` with BL-156) |
| Kind control, date sheet | `apps/mobile/src/components/capture/kind-control.tsx`, `date-sheet.tsx` | New in F04; F06 places them |
| Local schema | `apps/mobile/src/lib/db/migrations.ts` migration 5 (F04 owns 4) | New |
| Store: save with full records, review state on draft, open saved letter, author edits | `apps/mobile/src/lib/store.ts` | Exists; new functions in 11.3 |
| Engine audit job | `apps/mobile/src/lib/review/engine-audit.ts` | New; F06-REQ-022 |
| Server columns | `supabase/migrations/<new>_f06_author_layer.sql` | New; data architect |

Libraries: none new in `packages/core` (pure TypeScript, ES2018 Unicode property escapes, which the scratch run used). The word diff is about 60 lines of our own code over the core tokenizer [R]: a library diff (`diff`, BSD) works on characters or its own word regex, and would reintroduce D1 for Devanagari. Agents confirm Hermes supports `\p{Default_Ignorable_Code_Point}` and `\p{Bidi_Control}` in the dev build before WP-F06-02 merges (Unverified; part of the spike).

### 11.2 The text-rules pack (shared schema with F05)

A pack is data, never code (B13, App Review 2.5.2). F06 reads these tables; F05 owns the file, manifest, download and speech fields.

```ts
// packages/core/src/pack.ts (new)
export interface TextRulesPack {
  id: string;              // "pt"
  version: string;         // "1.0.0"; recorded on the entry as pack_ref "pt@1.0.0"
  script: 'Latn' | 'Deva' | 'Arab' | 'Hans' | 'Hant';
  fillers: { auto: string[]; offer: string[] };     // F06-REQ-010
  repeats: { always: string[]; offer: string[] };   // empty "always" outside English at v1.0 (F06-REQ-013)
  agreement: { pairs: string[][] };                 // empty outside English at v1.0 (F06-REQ-007)
  nameWords: string[];                              // common words a name may match (F06-REQ-008)
  negations: string[];                              // added to the core NEGATIONS set for this letter (B13)
  punctuation: {
    terminal: string[];        // marks that end a sentence, e.g. [".", "?", "!"] or ["。", "？", "！"]
    finalMark: string | null;  // added when a text ends with no terminal mark; null adds nothing
    caseless: boolean;         // no sentence-case edits
    characters: Array<{ from: string; to: string }>;  // F06-REQ-016, e.g. em dash to comma for Latin packs
    keepSpaces: string[];      // e.g. [" ", " "] for fr
  };
  reviewedBy: string;          // role and date of the native sign-off, e.g. "native reviewer 2026-11-02"
}
```

Validation: the loader refuses a pack whose JSON fails the schema, whose tables hold a word that is also in the pack's negation table, or whose `characters` entry changes a letter or mark. A refused pack means F06-REQ-011 (no pack-driven edits).

### 11.3 Data model and store contract

Local migration 5 (append-only, one transaction, fixture DBs v0 to v4 must migrate with row counts and hashes unchanged):
```sql
ALTER TABLE entries ADD COLUMN author_edits TEXT NOT NULL DEFAULT '[]';
ALTER TABLE entries ADD COLUMN locked_spans TEXT NOT NULL DEFAULT '[]';
ALTER TABLE entries ADD COLUMN pack_ref TEXT;
ALTER TABLE drafts ADD COLUMN review_state TEXT;  -- JSON: level, edit states, locks, author edits; never syncs
```

`Edit` gains optional `state`, `reason` and `accepted_by` (types.ts); stored edits from engine 3 read as `state: 'applied'`.

Store functions (new, synchronous, same patterns as `store.ts`): `setDraftReviewState(id, state)`, `openEntryForReview(id)`, `saveEntryEdits(id, { machineEdits, authorEdits, lockedSpans, finalText, editLevel, baseSeq })`. `saveLetterFromDraft` writes every field in F06-REQ-023 and -024. `setWordsForWaitingEntry` stays the only way a voice-only letter gets raw text, and only on the device (F06-REQ-030).

Server migration (data architect, `approve-migration`): add `author_edits jsonb not null default '[]'`, `locked_spans jsonb not null default '[]'`, `pack_ref text` to `entries` with classification comments; add `pack_ref` to `entries_guard_immutable`; add `author_edits` and `locked_spans` to `entries_record_version` and to `entry_versions`; leave `book_entries` unchanged. Sync field group (F16-REQ-011): words, `machine_edits`, `author_edits`, `locked_spans`, `edit_level` push together.

### 11.4 Sequencing

1. Weeks 2 to 3: WP-F06-01 (spike) and WP-F06-02 (verifier and tokenizer, R-01 D1 to D9, D14 guard) in parallel.
2. Weeks 3 to 4: WP-F06-03 (packs out of code, fillers, repeats, names), WP-F06-04 (regression suite and scorer). Gate: no non-English pack on the manifest until WP-F06-04 is green for it.
3. Weeks 4 to 6: WP-F06-05 (character edits, punctuation provider), WP-F06-06 (records and replay), WP-F06-07 (migrations).
4. Weeks 5 to 7: WP-F06-08 to -11 (Review UI), WP-F06-12 (engine audit).
5. P1, cut first: WP-F06-13 (suggestions).

### 11.5 Riskiest unknown and the spike

The riskiest unknown is whether the fixed verifier behaves the same under Hermes on an iPhone as on Node: Unicode property escapes, normalisation and regex boundaries can differ by engine. A difference would let a case refused in CI pass on the phone. Spike WP-F06-01: run the R-01 fixtures and the 4,000-word timing fixture inside the iOS dev build on an SE 3, compare verdicts with Node byte for byte, and record timings. If any verdict differs, the suite runs in the dev build on every release candidate (it does anyway, F06-REQ-019) and the differing construct is replaced with an explicit code-point table.

Second unknown: whether parents notice and accept the marks. Study 2 (R2 8.2) and Study 1 (TestFlight diary) answer it; the revert-rate guardrail watches it in beta.

## 12. Work packages

BL-120 is widened from the eight TDD 03 7.1 cases (already refused by engine 3, confirmed in the scratch run) to the R-01 list D1 to D15 (09 R-01 mitigation). WP-F06-02 to -05 together close it. Owner roles follow `08-delivery.md`.

| WP | Scope | Owner | BL | Owns files or folders | Depends on | Done when (tests that must pass) | Mode |
|---|---|---|---|---|---|---|---|
| WP-F06-01 | Spike: R-01 fixtures and the 4,000-word timing fixture under Hermes on an SE 3; Unicode property escapes in Hermes | Speech engineer | BL-120 | `docs/qa/evidence/F06-spike.md` (new) | BL-030 dev build | Verdicts for every R-01 fixture equal Node byte for byte, or each difference is listed with its construct; timings recorded | pair (speech engineer, QA engineer) |
| WP-F06-02 | Verifier and tokenizer: marks, invisibles, mood marks, quote styles, closed agreement table, whole-word terms | Core owner | BL-120 | `packages/core/src/text.ts`, `meaning.ts`, `verify.ts`, `protect.ts` (`quotedSpans`, `termRegex`), `types.ts`, `packages/core/test/verify.test.ts` | none | `[F06-REQ-001]` to `[F06-REQ-007]`, `[F06-REQ-009]` green; existing 237 engine tests green or changed only where a test asserted a defect, each listed in the PR | agent |
| WP-F06-03 | Text-rules pack type, English pack, loader; fillers, repeats, agreement, name words and negations read from the pack; hyphen and name-word rules; family-name guard | Core owner | BL-120 | `packages/core/src/pack.ts` (new), `packages/core/packs/en.json` (new), `rules.ts`, `repeats.ts`, `protect.ts` (`dictionaryEdits`), `pipeline.ts` (pack option) | WP-F06-02 | `[F06-REQ-005]`, `[F06-REQ-008]`, `[F06-REQ-010]`, `[F06-REQ-011]`, `[F06-REQ-013]`, `[F06-REQ-014]`; English output for every existing fixture unchanged except the R-01 cases | agent |
| WP-F06-04 | Per-language regression suite and property test; scorer fix | Speech engineer | BL-120, BL-147 | `packages/core/test/regression/*` (new), `packages/core/test/verify.fuzz.test.ts`, `experiments/score.ts`, `experiments/score.test.ts` | WP-F06-02, WP-F06-03 | `[F06-REQ-019]` zero accepted meaning changes per language in Node; `[F06-REQ-020]`; `[F06-REQ-021]` 10k cases fixed seed; native sign-off recorded per non-English file | agent, then human sign-off per language |
| WP-F06-05 | Character edits replace `normalizeChars` in the pipeline; pack-driven sentence case and final mark; `ENGINE_VERSION` 4 | Core owner | BL-120 | `packages/core/src/punctuation.ts`, `pipeline.ts`, `text.ts` (`normalizeChars` kept only for product copy) | WP-F06-03 | `[F06-REQ-015]`, `[F06-REQ-016]`, `[F06-REQ-018]`; segments joined equal `text` for every fixture | agent |
| WP-F06-06 | Edit records with state; author layer word diff; `replayFinalText`; review-state reducer; `auditEdits` | Speech engineer | BL-144, BL-148 | `packages/core/src/author-edits.ts` (new), `review-state.ts` (new), `pipeline.ts` (replay, audit), `packages/core/test/replay.test.ts` (new) | WP-F06-05 | `[F06-REQ-023]`, `[F06-REQ-025]` 500 of 500 replay, `[F06-REQ-026]`, `[F06-REQ-027]` reducer tests | agent |
| WP-F06-07 | Local migration 5 and store functions; server migration for `author_edits`, `locked_spans`, `pack_ref`, guard and version trigger | Data architect, mobile engineer | BL-144 | `apps/mobile/src/lib/db/migrations.ts`, `apps/mobile/src/lib/store.ts`, `apps/mobile/test/migrations.test.ts`, `supabase/migrations/<new>_f06_author_layer.sql`, `supabase/tests/*` | WP-F04-03, WP-F06-06 | Fixture DBs v0 to v4 migrate unchanged; `[DATA-REQ-040 Rev]` `pack_ref` update fails `SCIMM`; `[DATA-REQ-041 Rev]` version row on author edit; `[PRD-REQ-004 Rev]` member cannot read new columns | agent, `approve-migration` |
| WP-F06-08 | Review shell: split `review.tsx`; header with child, kind, date, language; autosave review state; typed path with no machine edits | Mobile engineer | BL-148 | `apps/mobile/src/app/review.tsx`, `apps/mobile/src/components/review/header.tsx` (new), `copy.ts` (new) | WP-F06-07, WP-F04-10 | `[F06-REQ-035]`, `[F06-REQ-036]` 100 of 100 kills, `[F06-REQ-037]`, `[F04-REQ-012]` byte equality | agent |
| WP-F06-09 | Changes: marks, rows, edit card, put back and re-apply, word for word, show exactly what I said, read card, no-pack line | Mobile engineer | BL-120 | `apps/mobile/src/components/capture/transcript.tsx`, `apps/mobile/src/components/review/changes.tsx` (new), `edit-card.tsx` (new) | WP-F06-08 | `[F06-REQ-028]`, `[F06-REQ-034]`, `[F06-REQ-038]`, `[F06-REQ-040]` VoiceOver script and AX5 snapshots | agent |
| WP-F06-10 | Lock a phrase, add to your words, Change words as author layer, low-confidence marks | Mobile engineer | BL-148 | `apps/mobile/src/components/review/lock.tsx` (new), `unsure-card.tsx` (new), `review.tsx` (edit mode) | WP-F06-09, F07 sheet | `[F06-REQ-026]` end to end, `[F06-REQ-029]`, `[F06-REQ-031]`, `[F06-REQ-032]` | agent |
| WP-F06-11 | Save paths: full records, voice-only stays local, open and edit a saved letter, co-parent read path | Mobile engineer | BL-142, BL-144 | `apps/mobile/src/app/review.tsx` (save), `apps/mobile/src/lib/store.ts` (save functions) | WP-F06-07, WP-F06-09 | `[F06-REQ-023]` on device, `[F06-REQ-030]`, `[F06-REQ-033]` render and access tests, `[F06-REQ-041]` perf on SE 3 | agent |
| WP-F06-12 | Engine audit job and the author-only engine note | Mobile engineer | BL-120 | `apps/mobile/src/lib/review/engine-audit.ts` (new), letter view note (coordinate with F09) | WP-F06-06, WP-F06-11 | `[F06-REQ-022]` no row changed, 1,000 letters in 60 s on SE 3 | agent |
| WP-F06-13 | P1: offered fillers and repeats with the hollow ring and card | Speech engineer, mobile engineer | BL-146 | `apps/mobile/src/components/review/suggestion-card.tsx` (new) | WP-F06-09 | `[F06-REQ-012]` | agent |
| WP-F06-14 | Copy: new review strings, K-26 renames, content rule against improve or polish offers, support macro | Content | BL-156, BL-118 | `apps/mobile/src/components/review/copy.ts`, `packages/content/src/strings.en.ts` (review, settings tidy keys, provenance), `packages/content/test/rules.test.ts`, `docs/legal/claims-registry.yaml` | none | `[F06-REQ-039]` content test; `npm test` content rules green; counsel signs any "never" claim | agent, counsel review |
| WP-F06-15 | Analytics enum additions and `engine_audit_completed` | Analytics engineer | BL-020 | `packages/analytics/src/catalog.ts`, `docs/analytics/TRACKING_PLAN.md` | none | Catalogue tests green; every new property L2 | agent |

## 13. Open questions and assumptions

### Questions

| # | Question | Who answers | By | What changes |
|---|---|---|---|---|
| Q1 | The founder's character rule (no em dashes, curly quotes, ellipses) applied to spoken letters: keep it as visible, undoable `punctuation` edits (spec default), or drop it for letters, since entry text is the parent's and not product copy? Chinese quote marks and French no-break spaces are exempt either way (F06-REQ-016) | Founder, with content | 16 Oct (with F04 Q6) | F06-REQ-016, WP-F06-05, `normalizeChars` use |
| Q2 | Apple Writing Tools can appear in iOS text fields (R1-S65 shows it on Voice Memos transcripts). If it appears in Change words, a person could have Apple rewrite their own letter there. Does the founder want it turned off in our text fields (spec default: off, if Expo exposes the control; Unverified), or left as the person's own tool? The same question applies to Write (F04) | Founder; mobile engineer checks the API | 23 Oct | F06-REQ-039, F04-REQ-013 |
| Q3 | A voice-only letter stays private and on the phone until it has words (F06-REQ-030, the BL-142 default). Confirm, since it means a co-parent never sees a waiting letter | Founder | 16 Oct | F06-REQ-030, F09-U23, F11 |
| Q4 | `pack_ref` immutable: if a pack ships with a wrong table, saved letters keep its edits until the author puts them back (F06-REQ-022 audit covers engine changes, not pack fixes). Extend the audit to pack updates? Spec default: yes, same note, same rules | Speech engineer | 30 Oct | F06-REQ-022, WP-F06-12 |
| Q5 | Add the 3 Oct finding to R-01: `punctuationEdits` appends "." after 。 or ؟ (section 7.1 note) | Core owner (edit to 09) | 9 Oct | 09 R-01, BL-120 |
| Q6 | Native reviewers for six languages sign off each pack and the regression file (R-08). Who are they and what is the budget? | Founder | 23 Oct | F06-REQ-019; non-English packs cannot ship without it |
| Q7 | Should the edit-level choice in Settings (F17) be per author or per letter language? Spec default: per author | Product, F17 owner | 30 Oct | F06-REQ-038 |
| Q8 | K-26 renames ("Lightly tidied" to "With small fixes") touch the printed book and F15 export. Confirm the new words for all three | Content, design leads | 23 Oct | Section 6.4, F09, F15 |

### Assumptions

| # | Assumption | How we validate |
|---|---|---|
| A1 | [A] Whisper writes hesitation sounds in enough letters for filler removal to matter in each language (R5 4.1 marks this Unverified) | Per-language experiment: share of reference fillers present in raw (R5 8.2) |
| A2 | [A] Parents read the marks and use Put it back rather than ignoring them | Revert rate in TestFlight; Study 1 diary; Study 2 |
| A3 | [A] A 4,000-word letter cleans within 1 s on an SE 3 after WP-F06-03 profiling | WP-F06-01 spike numbers |
| A4 | [A] Most parents keep clean as the default; few switch to word for word | `letter_saved.edit_level` share in beta |
| A5 | [A] Engine audits rarely refuse an existing edit, because each engine only tightens | `engine_audit_completed.refused_bucket` |
| A6 | [A] Pack text tables stay under 50 KB compressed | First non-English pack build |

## 14. Sources

Repo (read 3 Oct 2026):
- `CLAUDE.md` (constitution, content and privacy rules).
- `docs/agents/BRIEF-2026-10-03.md` items 7 (what the machine may do) and 11 (privacy, said calmly); `_AUTHORING.md` B5, B13, B14.
- `packages/core/src/types.ts`, `verify.ts`, `pipeline.ts`, `rules.ts`, `meaning.ts`, `protect.ts`, `punctuation.ts`, `repeats.ts`, `model-edits.ts`, `edit-provider.ts`, `text.ts`; `packages/core/test/verify.test.ts`, `verify.fuzz.test.ts`, `core.test.ts`.
- Scratch runs, 3 Oct, of a copy of `packages/core/src` with Node 22 type stripping (no repo change): R-01 D1 to D14, the punctuation finding in 7.1, the TDD 03 7.1 controls, and the timing baseline in section 9.
- `apps/mobile/src/app/review.tsx`, `apps/mobile/src/components/capture/transcript.tsx`, `apps/mobile/src/lib/store.ts` (`saveLetterFromDraft`, `setWordsForWaitingEntry`), `apps/mobile/src/lib/copy.ts` (`pendingCopy`), `apps/mobile/src/lib/db/migrations.ts`, `apps/mobile/src/app/settings/recordings.tsx`, `apps/mobile/src/components/book/chapters.ts`.
- `packages/content/src/strings.en.ts` (`review.*`, `settings.*`, `book.provenance.*`), `packages/content/VOICE.md`.
- `packages/analytics/src/catalog.ts`; `docs/analytics/TRACKING_PLAN.md` fidelity guardrail and `letter_saved`, `review_action`, `machine_edit_reverted`.
- `supabase/migrations/20261002020000_data_governance.sql` (`entries_guard_immutable`, `entries_record_version`, `book_entries`).
- `docs/adr/0003-edit-pass-model-strategy.md`, `0009-word-alignment.md`, `0012-open-models-transcription-and-grammar.md`.
- `docs/tdd/03-audio-transcription.md` sections 3.7, 3.7.1, 4.1, 4.3, 5.2, 7.1, 7.2, 8 (X-1 to X-3), 12 (OQ-4).
- `docs/legal/DELETION_AND_EXPORT_SPEC.md` DATA-REQ-040 to -046, -048, -050, section 4.2; `docs/legal/ENGINEERING_REQUIREMENTS.md` LEGAL-REQ-014, -044, -051.
- `docs/prd/PRD.md` K-09, K-14, K-26, PRD-REQ-004, section 6.3; `docs/prd/B-first-run-and-family.md` B-REQ-003, B-REQ-006, B-NFR-001.
- `docs/BACKLOG.md` BL-020, BL-118, BL-120, BL-142, BL-144, BL-146, BL-147, BL-148, BL-156.
- PRD V2: `01-problem.md`, `02-customers.md`, `03-goals-and-principles.md`, `05-feature-map.md`, `09-decisions-and-risks.md` (R-01, R-08, DR-01, DR-07, DR-15); `features/F04-capture.md` (6.2, 6.4, F04-REQ-012, -014, -015, 11.1, 11.4, Q6); `features/F05-transcription.md` (sections 1 to 5, Q8); `features/F11-co-parent.md` (F11-REQ-015, -016); `features/F16-sync.md` (C1, C7, F16-REQ-010, -011).

Research:
- R5 (`research/R5-speech-audio-languages.md`) section 0 items 6, 7; section 3; section 4.1 to 4.4 (E1 to E8); section 8.2; risk K7.
- R1 (`research/R1-competitors-by-feature.md`) F06: R1-S4, R1-S15, R1-S17, R1-S22, R1-S23, R1-S38, R1-S63, R1-S65.
- R2 (`research/R2-customer-evidence.md`) section 0 item 5, T12, F06 row, section 8.2 Study 2: R2-S8, R2-S13, R2-S21, R2-S22, R2-S27, R2-S31.
