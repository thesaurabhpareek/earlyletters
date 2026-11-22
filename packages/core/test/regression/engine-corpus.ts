/**
 * Engine regression corpus (RB-20). A fixed set of fictional "Asha" transcripts,
 * each with the edits the constitution says the engine must apply or refuse,
 * run through the real faithfulClean (so through verifyEdits) and snapshotted
 * per ENGINE_VERSION in snapshots/engine-v<N>.json.
 *
 * Why this exists next to test/golden: golden pins what the engine did; this
 * pins what it MUST do. Every item carries a hand-written expectation (written
 * from the constitution, not copied from engine output), so a snapshot
 * re-recorded after a regression cannot hide it. It also gives each EditType an
 * item and each known way to change meaning (negation flip, number change,
 * added content, name mangling, tense, pronoun) an adversarial item.
 *
 * The corpus is text only. It cannot say anything about transcription quality
 * from real audio; see docs/qa/ENGINE_REGRESSION.md.
 *
 * Rule for editing this file: add items with `added` set to the ENGINE_VERSION
 * that introduces them. Never change an existing item's raw, model edits or
 * expectation to make a test pass; a legitimate behaviour change needs an
 * ENGINE_VERSION bump with a dated comment in src/pipeline.ts.
 */
import type { CleanResult, DictionaryTerm, Edit, EditLevel } from '../../src';

/** The engine under test: this checkout's src, or a copy named by SCRIBE_ENGINE_SRC (an absolute path). */
export const ENGINE_SRC = process.env.SCRIBE_ENGINE_SRC || '';
export type EngineModule = typeof import('../../src');
export async function loadEngine(): Promise<EngineModule> {
  return ENGINE_SRC ? ((await import(/* @vite-ignore */ `${ENGINE_SRC}/index.ts`)) as EngineModule) : await import('../../src');
}

/** The complete allowlist, restated here on purpose: if src/types.ts grows a type, this test must be updated by a human. */
export const EDIT_TYPES = ['filler', 'false_start', 'repeat', 'stt_fix', 'punctuation', 'agreement', 'paragraph'] as const;

export const DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Usha', 'Asia'] },
  { term: 'Ashu', kind: 'nickname', heardAs: [] },
  { term: 'Mumma', kind: 'family', heardAs: ['mama'] },
];

/** A model edit located by text. `type` is a string so the corpus can propose types outside the allowlist. */
export interface ModelSpec {
  type: string;
  original: string;
  replacement: string;
  nth?: number;
  /** For hostile cases only: use these offsets instead of locating `original`. */
  at?: [number, number];
}

export interface Expect {
  /** Final text a parent sees. */
  text: string;
  /** Accepted edits in order, as `type:source`. */
  applied: string[];
  /** Refused edits as `type:reason`; every adversarial model edit must show up here. */
  rejected: string[];
}

export interface Item {
  id: string;
  category: 'per-type' | 'adversarial';
  /** ENGINE_VERSION that introduced the item; older snapshots do not contain it. */
  added: number;
  raw: string;
  level?: EditLevel;
  locked?: string[];
  model?: ModelSpec[];
  expect: Expect;
}

export const CORPUS: Item[] = [];

const M = (type: string, original: string, replacement: string, nth = 0): ModelSpec => ({ type, original, replacement, nth });
const Q = (text: string, applied: string[], rejected: string[]): Expect => ({ text, applied, rejected });
/** Every model edit refused and nothing applied: the final text is the raw text. */
const refused = (raw: string, ...reasons: string[]): Expect => Q(raw, [], reasons);

CORPUS.push(
  // ---- one item per EditType: the machine removes and repairs, and these are the only ways ----
  { id: 'type-filler', category: 'per-type', added: 8, raw: 'Um, Asha saw the duck.', expect: Q('Asha saw the duck.', ['filler:rule'], []) },
  { id: 'type-filler-midsentence', category: 'per-type', added: 8, raw: 'Asha was, uh, very sleepy.', expect: Q('Asha was, very sleepy.', ['filler:rule'], []) },
  { id: 'type-repeat', category: 'per-type', added: 8, raw: 'Asha looked at the the duck.', expect: Q('Asha looked at the duck.', ['repeat:rule'], []) },
  {
    id: 'type-false-start',
    category: 'per-type',
    added: 8,
    raw: 'She was, she was happy.',
    model: [M('false_start', 'She was, ', '')],
    expect: Q('she was happy.', ['false_start:model'], []),
  },
  { id: 'type-stt-fix', category: 'per-type', added: 8, raw: 'Usha ate peas and mama laughed.', expect: Q('Asha ate peas and Mumma laughed.', ['stt_fix:rule', 'stt_fix:rule'], []) },
  { id: 'type-stt-fix-case-only', category: 'per-type', added: 8, raw: 'asha slept', expect: Q('Asha slept', ['stt_fix:rule'], []) },
  {
    id: 'type-punctuation',
    category: 'per-type',
    added: 8,
    raw: 'she is happy',
    model: [M('punctuation', 'she', 'She'), M('punctuation', 'happy', 'happy.')],
    expect: Q('She is happy.', ['punctuation:model', 'punctuation:model'], []),
  },
  {
    id: 'type-agreement',
    category: 'per-type',
    added: 8,
    raw: 'she have a cold but she is still smiling',
    model: [M('agreement', 'have', 'has')],
    expect: Q('she has a cold but she is still smiling', ['agreement:model'], []),
  },
  {
    id: 'type-paragraph',
    category: 'per-type',
    added: 8,
    raw: 'Asha slept. Then she woke.',
    model: [M('paragraph', ' ', '\n\n', 1)],
    expect: Q('Asha slept.\n\nThen she woke.', ['paragraph:model'], []),
  },
  { id: 'level-verbatim-keeps-fillers', category: 'per-type', added: 8, raw: 'um she, uh, walked to Mumma', level: 'verbatim', expect: Q('um she, uh, walked to Mumma', [], []) },
  { id: 'locked-phrase-kept', category: 'per-type', added: 8, raw: 'she said the the moon is hers', locked: ['the the moon'], expect: Q('she said the the moon is hers', [], ['repeat:overlaps_protected']) },
  { id: 'emphasis-kept', category: 'per-type', added: 8, raw: 'I love you, I love you so much.', expect: Q('I love you, I love you so much.', [], []) },
  { id: 'quote-kept', category: 'per-type', added: 8, raw: 'Asia said "bau bau" to the cat.', expect: Q('Asha said "bau bau" to the cat.', ['stt_fix:rule'], []) },

  // ---- adversarial: negation flips ----
  { id: 'neg-drop-not', category: 'adversarial', added: 8, raw: 'She did not cry.', model: [M('filler', 'not ', '')], expect: refused('She did not cry.', 'filler:not_a_filler') },
  { id: 'neg-drop-not-as-repeat', category: 'adversarial', added: 8, raw: 'Asha is not sad.', model: [M('repeat', 'not ', '')], expect: refused('Asha is not sad.', 'repeat:not_a_repeat') },
  { id: 'neg-can-to-cannot', category: 'adversarial', added: 8, raw: 'I can come.', model: [M('agreement', 'can', 'cannot')], expect: refused('I can come.', 'agreement:changes_negation') },
  { id: 'neg-no-to-yes', category: 'adversarial', added: 8, raw: 'She said no.', model: [M('stt_fix', 'no', 'yes')], expect: refused('She said no.', 'stt_fix:stt_fix_not_dictionary') },
  { id: 'neg-contraction-dropped', category: 'adversarial', added: 8, raw: "She didn't cry.", model: [M('agreement', "didn't", 'did')], expect: refused("She didn't cry.", 'agreement:changes_negation') },
  { id: 'neg-never-removed', category: 'adversarial', added: 8, raw: 'She never cries.', model: [M('filler', 'never ', '')], expect: refused('She never cries.', 'filler:not_a_filler') },
  { id: 'neg-no-no-kept', category: 'adversarial', added: 8, raw: 'No, no, she would not let go.', expect: Q('No, no, she would not let go.', [], []) },

  // ---- adversarial: number changes ----
  { id: 'num-digit-changed', category: 'adversarial', added: 8, raw: 'Asha slept 3 hours.', model: [M('punctuation', '3', '2')], expect: refused('Asha slept 3 hours.', 'punctuation:punctuation_changed_letters') },
  { id: 'num-word-changed', category: 'adversarial', added: 8, raw: 'Asha is two years old.', model: [M('stt_fix', 'two', 'three')], expect: refused('Asha is two years old.', 'stt_fix:stt_fix_not_dictionary') },
  { id: 'num-word-as-agreement', category: 'adversarial', added: 8, raw: 'Asha is two years old.', model: [M('agreement', 'two', 'three')], expect: refused('Asha is two years old.', 'agreement:agreement_stem_mismatch') },
  { id: 'num-twice-to-once', category: 'adversarial', added: 8, raw: 'She waved twice.', model: [M('agreement', 'twice', 'once')], expect: refused('She waved twice.', 'agreement:agreement_stem_mismatch') },
  { id: 'num-time-changed', category: 'adversarial', added: 8, raw: 'They played until 3:30.', model: [M('punctuation', '3:30', '3:15')], expect: refused('They played until 3:30.', 'punctuation:punctuation_changed_letters') },
  { id: 'num-removed-as-filler', category: 'adversarial', added: 8, raw: 'She has two teeth now.', model: [M('filler', 'two ', '')], expect: refused('She has two teeth now.', 'filler:not_a_filler') },

  // ---- adversarial: added content and meaning-changing "corrections" ----
  { id: 'add-clause-punctuation', category: 'adversarial', added: 8, raw: 'Asha laughed.', model: [M('punctuation', 'laughed.', 'laughed very loudly.')], expect: refused('Asha laughed.', 'punctuation:punctuation_changed_letters') },
  { id: 'add-sentence-paragraph', category: 'adversarial', added: 8, raw: 'Asha laughed.', model: [M('paragraph', 'laughed.', 'laughed. She was thrilled.')], expect: refused('Asha laughed.', 'paragraph:paragraph_not_whitespace') },
  {
    id: 'add-summarize-type',
    category: 'adversarial',
    added: 8,
    raw: 'Asha laughed.',
    model: [{ type: 'summarize', original: 'Asha laughed.', replacement: 'Asha was happy.', at: [0, 13] }],
    expect: refused('Asha laughed.', 'summarize:type_not_allowed_at_level'),
  },
  {
    id: 'add-rewrite-type',
    category: 'adversarial',
    added: 8,
    raw: 'Asha laughed.',
    model: [{ type: 'rewrite', original: 'Asha ', replacement: '', at: [0, 5] }],
    expect: refused('Asha laughed.', 'rewrite:type_not_allowed_at_level'),
  },
  {
    id: 'add-stale-offsets',
    category: 'adversarial',
    added: 8,
    raw: 'Asha laughed.',
    model: [{ type: 'filler', original: 'XXXX', replacement: '', at: [0, 4] }],
    expect: refused('Asha laughed.', 'filler:original_mismatch'),
  },
  { id: 'fix-noun-plural', category: 'adversarial', added: 8, raw: 'We saw the dog with Asha.', model: [M('agreement', 'dog', 'dogs')], expect: refused('We saw the dog with Asha.', 'agreement:agreement_stem_mismatch') },
  { id: 'fix-tense', category: 'adversarial', added: 8, raw: 'She said she was hungry.', model: [M('agreement', 'was', 'is')], expect: refused('She said she was hungry.', 'agreement:changes_tense') },
  { id: 'fix-pronoun', category: 'adversarial', added: 8, raw: 'Daddy gave her the spoon.', model: [M('stt_fix', 'her', 'him')], expect: refused('Daddy gave her the spoon.', 'stt_fix:stt_fix_not_dictionary') },
  { id: 'fix-question-to-statement', category: 'adversarial', added: 8, raw: 'Did she sleep?', model: [M('punctuation', '?', '.')], expect: refused('Did she sleep?', 'punctuation:changes_sentence_type') },

  // ---- adversarial: child-name and family-name mangling ----
  { id: 'name-child-to-other-name', category: 'adversarial', added: 8, raw: 'Asha said hi to Ashu.', model: [M('stt_fix', 'Asha', 'Ashley')], expect: refused('Asha said hi to Ashu.', 'stt_fix:overlaps_protected') },
  { id: 'name-child-lowercased', category: 'adversarial', added: 8, raw: 'Asha said hi to Ashu.', model: [M('punctuation', 'Asha', 'asha')], expect: refused('Asha said hi to Ashu.', 'punctuation:overlaps_protected') },
  { id: 'name-nickname-to-child', category: 'adversarial', added: 8, raw: 'Asha said hi to Ashu.', model: [M('stt_fix', 'Ashu', 'Asha')], expect: refused('Asha said hi to Ashu.', 'stt_fix:overlaps_protected') },
  { id: 'name-dropped-as-filler', category: 'adversarial', added: 8, raw: 'Asha said hi to Ashu.', model: [M('filler', 'Asha ', '')], expect: refused('Asha said hi to Ashu.', 'filler:overlaps_protected') },
  { id: 'name-stranger-becomes-child', category: 'adversarial', added: 8, raw: 'Dada came home.', model: [M('stt_fix', 'Dada', 'Asha')], expect: refused('Dada came home.', 'stt_fix:stt_fix_protected_word') },
  { id: 'name-split-by-space', category: 'adversarial', added: 8, raw: 'Asha came home.', model: [M('punctuation', 'Asha', 'As ha')], expect: refused('Asha came home.', 'punctuation:overlaps_protected') },
);
