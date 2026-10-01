import { describe, expect, it } from 'vitest';
import {
  applyEdits,
  checkEdit,
  classify,
  dateline,
  ageOn,
  chapterOf,
  dictionaryEdits,
  faithfulClean,
  FORBIDDEN_CHARS,
  normalizeChars,
  selectFollowUps,
  selectPrompt,
  stripNonSpeech,
  renderTemplate,
  type Prompt,
  verifyEdits,
  withoutEdit,
  type DictionaryTerm,
  type Edit,
} from '../src';

// Fictional family; real family details never live in code.
const DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Asia', 'Usha'] },
  { term: 'Ashu', kind: 'nickname', heardAs: ['ah shoe'] },
  { term: 'Mumma', kind: 'family', heardAs: ['mama'] },
  { term: 'chalo', kind: 'word', heardAs: ['shallow'] },
];

/** Build a model edit against `raw` from a substring and its replacement. */
function modelEdit(raw: string, type: Edit['type'], original: string, replacement: string, nth = 0): Edit {
  let start = -1;
  for (let i = 0; i <= nth; i++) start = raw.indexOf(original, start + 1);
  if (start < 0) throw new Error(`not found: ${original}`);
  return { type, start, end: start + original.length, original, replacement, source: 'model' };
}

const ctx = (raw: string, level: 'clean' | 'verbatim' = 'clean') => ({ raw, level, dictionary: DICT, protectedSpans: [] });

describe('character normalization', () => {
  it('strips sound annotations that nobody said', () => {
    expect(stripNonSpeech(' (waves crashing) (waves crashing)')).toBe('');
    expect(stripNonSpeech('[BLANK_AUDIO] She walked. [MUSIC] *laughs* ♪')).toBe('She walked.');
    expect(stripNonSpeech('She said (I think) it was blue.')).toBe('She said (I think) it was blue.');
  });

  it('removes every forbidden character', () => {
    const out = normalizeChars('She laughed — really laughed… “bau” she said, it’s 3–4 times.');
    expect(out).not.toMatch(FORBIDDEN_CHARS);
    expect(out).toBe('She laughed, really laughed... "bau" she said, it\'s 3-4 times.');
  });
});

describe('dictionary corrections', () => {
  it('fixes learned mishearings to the canonical term', () => {
    const raw = 'Asia walked to mama today.';
    const out = faithfulClean(raw, { level: 'verbatim', dictionary: DICT });
    expect(out.text).toBe('Asha walked to Mumma today.');
    expect(out.applied.every((e) => e.type === 'stt_fix' && e.source === 'rule')).toBe(true);
  });

  it('never corrects inside quotes (the child’s own words)', () => {
    const raw = 'She pointed and said "mama" to the dog.';
    expect(dictionaryEdits(raw, DICT)).toHaveLength(0);
  });

  it('handles multi-word mishearings', () => {
    expect(faithfulClean('I called her ah shoe all day.', { level: 'clean', dictionary: DICT }).text).toBe(
      'I called her Ashu all day.',
    );
  });
});

describe('deterministic clean rules', () => {
  it('removes fillers and tidies punctuation', () => {
    const out = faithfulClean('So um, she uh walked to the door. Hmm.', { level: 'clean', dictionary: DICT });
    expect(out.text).toBe('So she walked to the door.');
  });

  it('collapses accidental function-word repeats only', () => {
    expect(faithfulClean('And and then the the dog barked.', { level: 'clean', dictionary: DICT }).text).toBe(
      'And then the dog barked.',
    );
  });

  it('keeps meaningful repetition: emphasis, dialect, toddler speech', () => {
    const raw = 'No no no, she said, bye bye, very very tired.';
    expect(faithfulClean(raw, { level: 'clean', dictionary: DICT }).text).toBe(raw);
  });

  it('keeps "like" and "you know"; they are how people talk', () => {
    const raw = 'She was like, you know, so proud.';
    expect(faithfulClean(raw, { level: 'clean', dictionary: DICT }).text).toBe(raw);
  });

  it('verbatim level does not remove fillers', () => {
    const raw = 'Um, she walked.';
    expect(faithfulClean(raw, { level: 'verbatim', dictionary: DICT }).text).toBe(raw);
  });

  it('keeps dialect and code-switching untouched', () => {
    const raw = 'She was not wanting to sleep na, chalo, tomorrow itself we will try.';
    expect(faithfulClean(raw, { level: 'clean', dictionary: DICT }).text).toBe(raw);
  });
});

describe('verifier: allowed model edits', () => {
  it('accepts a real false start', () => {
    const raw = 'She was, she was so happy.';
    const e = modelEdit(raw, 'false_start', 'She was, ', '');
    expect(checkEdit(e, ctx(raw))).toBeNull();
  });

  it('accepts punctuation and sentence case that change no letters', () => {
    const raw = 'she walked today it was amazing';
    expect(checkEdit(modelEdit(raw, 'punctuation', 'today it', 'today. It'), ctx(raw))).toBeNull();
  });

  it('accepts a one-word agreement fix with the same stem', () => {
    const raw = 'She have two teeth now.';
    expect(checkEdit(modelEdit(raw, 'agreement', 'have', 'has'), ctx(raw))).toBeNull();
    const raw2 = 'She walk to me every morning.';
    expect(checkEdit(modelEdit(raw2, 'agreement', 'walk', 'walks'), ctx(raw2))).toBeNull();
  });

  it('accepts a model stt_fix only when the replacement is a dictionary term', () => {
    const raw = 'Then Usher ran to me.';
    expect(checkEdit(modelEdit(raw, 'stt_fix', 'Usher', 'Asha'), ctx(raw))).toBeNull();
  });
});

describe('verifier: adversarial model edits are rejected', () => {
  it('rejects a synonym swap disguised as agreement', () => {
    const raw = 'She was happy today.';
    expect(checkEdit(modelEdit(raw, 'agreement', 'happy', 'joyful'), ctx(raw))).toBe('agreement_stem_mismatch');
  });

  it('rejects adding meaning disguised as punctuation', () => {
    const raw = 'She walked.';
    expect(checkEdit(modelEdit(raw, 'punctuation', 'walked.', 'walked beautifully.'), ctx(raw))).toBe(
      'punctuation_changed_letters',
    );
  });

  it('rejects a rewrite disguised as a false start', () => {
    const raw = 'I was tired, she was so happy.';
    expect(checkEdit(modelEdit(raw, 'false_start', 'I was tired, ', ''), ctx(raw))).toBe('false_start_not_repeated');
  });

  it('rejects any filler edit that inserts text', () => {
    const raw = 'Um she walked.';
    expect(checkEdit(modelEdit(raw, 'filler', 'Um ', 'Proudly '), ctx(raw))).toBe('removal_only');
  });

  it('rejects deleting real words under a "filler" or "repeat" label', () => {
    const raw = 'I was tired, she was so happy.';
    expect(checkEdit(modelEdit(raw, 'filler', 'I was tired, ', ''), ctx(raw))).toBe('not_a_filler');
    expect(checkEdit(modelEdit(raw, 'repeat', 'I was tired, ', ''), ctx(raw))).toBe('not_a_repeat');
    const dup = 'She was was happy.';
    expect(checkEdit(modelEdit(dup, 'repeat', ' was', ''), ctx(dup))).toBeNull();
  });

  it('rejects stt_fix to a non-dictionary word', () => {
    const raw = 'She ate the mango.';
    expect(checkEdit(modelEdit(raw, 'stt_fix', 'mango', 'banana'), ctx(raw))).toBe('stt_fix_not_dictionary');
  });

  it('rejects edits whose original does not match the raw text', () => {
    const raw = 'She walked.';
    const e: Edit = { type: 'punctuation', start: 0, end: 3, original: 'He ', replacement: 'He. ', source: 'model' };
    expect(checkEdit(e, ctx(raw))).toBe('original_mismatch');
  });

  it('rejects multi-word agreement and more than one per sentence', () => {
    const raw = 'She have two teeth and she have a cold.';
    expect(checkEdit(modelEdit(raw, 'agreement', 'She have', 'She has'), ctx(raw))).toBe('agreement_not_single_word');
    const result = verifyEdits(
      [modelEdit(raw, 'agreement', 'have', 'has', 0), modelEdit(raw, 'agreement', 'have', 'has', 1)],
      ctx(raw),
    );
    expect(result.accepted).toHaveLength(1);
    expect(result.rejected[0].reason).toBe('agreement_limit_per_sentence');
  });

  it('rejects edits in verbatim mode except punctuation and dictionary', () => {
    const raw = 'She was, she was so happy.';
    expect(checkEdit(modelEdit(raw, 'false_start', 'She was, ', ''), ctx(raw, 'verbatim'))).toBe(
      'type_not_allowed_at_level',
    );
  });

  it('never touches quoted child speech', () => {
    const raw = 'She said "me want bau" at the door.';
    const out = faithfulClean(raw, {
      level: 'clean',
      dictionary: DICT,
      modelEdits: [modelEdit(raw, 'agreement', 'want', 'wants')],
    });
    expect(out.text).toBe(raw);
    expect(out.rejected[0].reason).toBe('overlaps_protected');
  });

  it('never touches a locked phrase', () => {
    const raw = 'She go to sleep like a little owl.';
    const out = faithfulClean(raw, {
      level: 'clean',
      dictionary: DICT,
      locked: ['She go to sleep'],
      modelEdits: [modelEdit(raw, 'agreement', 'go', 'goes')],
    });
    expect(out.text).toBe(raw);
  });

  it('discards all model edits when the model touches too much', () => {
    const raw = 'she walk. she talk. she run. she eat. she sing. she jump.';
    const edits = ['walk', 'talk', 'run', 'eat', 'sing', 'jump'].map((w) => modelEdit(raw, 'agreement', w, w + 's'));
    const out = faithfulClean(raw, { level: 'clean', dictionary: DICT, modelEdits: edits });
    expect(out.text).toBe(raw);
    expect(out.rejected.filter((r) => r.reason === 'change_ceiling_exceeded')).toHaveLength(6);
  });
});

describe('reversibility', () => {
  it('raw + applied edits reproduces the cleaned text, and any edit can be undone', () => {
    const raw = 'Um, Asia and and mama went out.';
    const out = faithfulClean(raw, { level: 'clean', dictionary: DICT });
    expect(out.text).toBe('Asha and Mumma went out.');
    expect(normalizeChars(applyEdits(raw, out.applied)).trim()).toBe(out.text);
    const idx = out.applied.findIndex((e) => e.original === 'mama');
    expect(withoutEdit(raw, out.applied, idx).text).toBe('Asha and mama went out.');
  });

  it('cleaned text never contains a word the parent did not say, except dictionary terms', () => {
    const raw = 'So um she was, she was laughing at the the dog and Asia said "bau bau".';
    const out = faithfulClean(raw, { level: 'clean', dictionary: DICT });
    const spoken = new Set(raw.toLowerCase().match(/[a-z']+/g));
    const allowed = new Set(DICT.map((d) => d.term.toLowerCase()));
    for (const w of out.text.toLowerCase().match(/[a-z']+/g)!) {
      expect(spoken.has(w) || allowed.has(w)).toBe(true);
    }
  });
});

describe('age and dateline', () => {
  it('computes calendar-month age the way parents count', () => {
    expect(ageOn('2025-05-20', '2026-09-29')).toMatchObject({ months: 16, weeks: 1 });
    expect(ageOn('2025-01-31', '2025-02-28').months).toBe(1);
    expect(ageOn('2026-09-01', '2026-09-08')).toMatchObject({ months: 0, days: 7 });
  });

  it('writes a dateline without time-zone drift', () => {
    expect(dateline('2026-09-29', 'Asha', '2025-05-20')).toBe(
      'Tuesday, 29 September 2026. Asha is 16 months and 1 week old.',
    );
    expect(chapterOf('2025-05-20', '2026-09-29')).toBe(16);
  });
});

const LIB: Prompt[] = [
  { key: 'o.any.1', text: 'What did {child} do today?', band: 'any', kind: 'opening' },
  { key: 'o.13.1', text: 'What word is {child} saying wrong?', band: '13-18', kind: 'opening' },
  { key: 'o.13.2', text: 'Who did {child} run to first?', band: '13-18', kind: 'opening' },
  { key: 'g.1', text: 'The last few days, as one.', band: 'any', kind: 'gap' },
  { key: 'h.1', text: 'What did today ask of you?', band: 'any', kind: 'hard' },
  { key: 'f.1', text: 'What do you see of yourself in {child}?', band: 'any', kind: 'family' },
  { key: 't.1', text: 'Ask {child} what to remember about today.', band: 'any', kind: 'together' },
  { key: 'old', text: 'retired', band: 'any', kind: 'opening', retired: true },
];
const base = { ageMonths: 16, daysSinceLastEntry: 1, hardStretch: false, role: 'parent' as const, together: false, recentKeys: [], seed: '2026-09-30' };

describe('prompts', () => {
  it('is deterministic for the same night', () => {
    expect(selectPrompt(base, LIB).key).toBe(selectPrompt(base, LIB).key);
  });

  it('picks the right kind: hard > together > family > gap > opening', () => {
    expect(selectPrompt({ ...base, hardStretch: true, together: true }, LIB).kind).toBe('hard');
    expect(selectPrompt({ ...base, together: true, role: 'contributor' }, LIB).kind).toBe('together');
    expect(selectPrompt({ ...base, role: 'contributor', daysSinceLastEntry: 9 }, LIB).kind).toBe('family');
    expect(selectPrompt({ ...base, daysSinceLastEntry: 9 }, LIB).kind).toBe('gap');
    expect(selectPrompt(base, LIB).kind).toBe('opening');
  });

  it('never picks a retired prompt or one used recently when others exist', () => {
    for (let d = 0; d < 30; d++) {
      const p = selectPrompt({ ...base, seed: `s${d}`, recentKeys: ['o.13.1'] }, LIB);
      expect(p.retired).toBeUndefined();
      expect(p.key).not.toBe('o.13.1');
    }
  });

  it('fills placeholders and leaves unknown ones visible', () => {
    expect(renderTemplate('Hi {child}, from {signsAs} {x}', { child: 'Asha', signsAs: 'Papa' })).toBe('Hi Asha, from Papa {x}');
  });
});

describe('safety and follow-ups', () => {
  it('tiers common intrusive thoughts as 1 and active risk as 2', () => {
    expect(classify('What if I dropped her on the stairs, I keep thinking it')).toBe(1);
    expect(classify('Honestly I want to die some nights')).toBe(2);
    expect(classify('She was so tired and so was I')).toBe(0);
  });

  it('asks only a containing question on a heavy entry', () => {
    const f = selectFollowUps('I feel like a terrible mother, I cried all night', 'Asha');
    expect(f).toHaveLength(1);
    expect(f[0].kind).toBe('contain');
  });

  it('never asks more than two follow-ups', () => {
    expect(selectFollowUps('She walked.', 'Asha')).toHaveLength(2);
    expect(selectFollowUps('She walked.', 'Asha', ['anchor', 'you'])).toHaveLength(0);
  });
});
