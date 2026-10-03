/**
 * Core types for the Letters fidelity engine.
 *
 * Constitution (PRD v2, section 0.5): the machine may remove and repair.
 * It may never add meaning. Everything in src/core enforces that in code.
 *
 * This folder is pure TypeScript with no React Native imports, so it can be
 * shared with the web app and unit-tested in Node.
 */

/** The complete allowlist of machine edits. Anything else is rejected. */
export type EditType =
  | 'filler' // "um", "uh" removed
  | 'false_start' // "she was, she was so" -> "she was so"
  | 'repeat' // "the the" -> "the"
  | 'stt_fix' // "mirror" -> "Mira" (replacement must be a dictionary term)
  | 'punctuation' // add/remove punctuation, sentence case; letters unchanged
  | 'agreement' // "she have" -> "she has": one word, same stem
  | 'paragraph'; // whitespace only

/** Where an edit came from. Rule edits are deterministic code. */
export type EditSource = 'rule' | 'model';

/**
 * A single proposed change, expressed against the RAW transcript.
 * Offsets are UTF-16 indices into the raw text (JS string indices).
 */
export interface Edit {
  type: EditType;
  start: number;
  end: number;
  /** Must equal raw.slice(start, end) exactly, or the edit is rejected. */
  original: string;
  replacement: string;
  source: EditSource;
}

/** A model may flag a span it is unsure about instead of fixing it. */
export interface Flag {
  start: number;
  end: number;
  original: string;
  reason: 'low_confidence' | 'model_unsure';
}

export type DictionaryKind = 'child' | 'nickname' | 'family' | 'word' | 'place' | 'self';

/** A term the parent wants spelled their way, always. Never edited. */
export interface DictionaryTerm {
  term: string;
  kind: DictionaryKind;
  /** Mis-hearings learned from corrections, e.g. ["Mira", "mirror"]. */
  heardAs: string[];
}

export type EditLevel = 'clean' | 'verbatim';

export interface Span {
  start: number;
  end: number;
}

export type RejectReason =
  | 'original_mismatch'
  | 'out_of_bounds'
  | 'overlaps_protected'
  | 'overlaps_other_edit'
  | 'type_not_allowed_at_level'
  | 'removal_only'
  | 'not_a_filler'
  | 'not_a_repeat'
  | 'false_start_not_repeated'
  | 'stt_fix_not_dictionary'
  | 'punctuation_changed_letters'
  | 'agreement_not_single_word'
  | 'agreement_stem_mismatch'
  | 'agreement_limit_per_sentence'
  | 'paragraph_not_whitespace'
  | 'inserted_content_word'
  | 'change_ceiling_exceeded'
  // Meaning guards (BL-064, TDD 03 section 7.1). Each names what the edit would have changed.
  | 'splits_word' // span starts or ends inside a word
  | 'removal_adds_punctuation' // a removal may only drop punctuation, never add it
  | 'changes_negation' // not, n't, never, no, cannot added or removed
  | 'changes_tense' // is -> was, loves -> loved
  | 'changes_modal' // can -> could, will -> would
  | 'changes_word' // were -> we're, its -> it's, some one -> someone
  | 'changes_number' // 1,000 -> 1.000, two -> too
  | 'changes_sentence_type' // "it." -> "it?", "!" removed
  | 'changes_quotes' // quotation marks added, removed or moved
  | 'case_change_not_allowed' // case changed anywhere but a word's first letter, or a capital that was not positional
  | 'case_change_not_sentence_start' // a capital where no sentence starts (will -> Will)
  | 'removes_negation' // a "repeat" or "false start" that only removes a negation (not not -> not)
  | 'repeat_is_emphasis' // very very, bye bye, come on come on: kept as said
  | 'false_start_complete_phrase' // the "restart" did not lead anywhere: I love you, I love you.
  | 'stt_fix_protected_word' // a pronoun, kinship word, number, negation or another dictionary term
  | 'stt_fix_not_heard_as' // not a learned mishearing, a case variant, or close in sound
  // Language packs (ADR 0014).
  | 'not_vetted_for_language'; // this kind of edit needs a table this language's pack has not had signed off

export interface RejectedEdit {
  edit: Edit;
  reason: RejectReason;
}

export interface CleanResult {
  /** The text to show and store as the machine's output. */
  text: string;
  /** Edits actually applied, in raw-text order. Stored for reversibility. */
  applied: Edit[];
  rejected: RejectedEdit[];
  flags: Flag[];
  /** Share of raw words touched by applied MODEL edits (0..1). */
  modelChangeRatio: number;
  /**
   * Edits the engine did NOT apply but offers to the parent (possible
   * repeats such as "so so" or "you you" after an object verb). Each has
   * already passed the verifier against this raw text; to accept one, pass
   * it back in CleanOptions.ruleEdits (see acceptSuggestions).
   */
  suggestions: Edit[];
}
