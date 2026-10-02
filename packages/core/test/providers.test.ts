import { describe, expect, it } from 'vitest';
import {
  applyEdits,
  cleanWithProviders,
  faithfulClean,
  JsonModelEditProvider,
  parseEditReply,
  punctuationEdits,
  RulePunctuationProvider,
  verifyEdits,
  type DictionaryTerm,
  type EditProvider,
  type EditRequest,
  type ModelCall,
} from '../src';

// Fictional family; real family details never live in code.
const DICT: DictionaryTerm[] = [
  { term: 'Asha', kind: 'child', heardAs: ['Asia', 'Usha'] },
  { term: 'Ashu', kind: 'nickname', heardAs: ['ah shoe'] },
  { term: 'Mumma', kind: 'family', heardAs: ['mama'] },
  { term: 'chalo', kind: 'word', heardAs: ['shallow'] },
];

const req = (raw: string, level: 'clean' | 'verbatim' = 'clean'): EditRequest => ({ raw, level, dictionary: DICT });
const rulesOnly = (raw: string, level: 'clean' | 'verbatim' = 'clean') =>
  cleanWithProviders(req(raw, level), [new RulePunctuationProvider()]);

/** A model stub that returns a fixed reply and records what it was asked. */
function stub(reply: string | object): ModelCall & { calls: string[] } {
  const calls: string[] = [];
  const fn = (async (r) => {
    calls.push(r.user);
    return typeof reply === 'string' ? reply : JSON.stringify(reply);
  }) as ModelCall & { calls: string[] };
  fn.calls = calls;
  return fn;
}

describe('RulePunctuationProvider: sentence case and terminal punctuation', () => {
  it('capitalises sentence starts and ends the text with a period', async () => {
    expect((await rulesOnly('she walked. then she ran')).text).toBe('She walked. Then she ran.');
    expect((await rulesOnly('she walked,')).text).toBe('She walked.');
  });

  it('capitalises the first word that survives the filler rules', async () => {
    expect((await rulesOnly('um so we went to the park')).text).toBe('So we went to the park.');
    // verbatim keeps the filler, so the filler is what gets the capital
    expect((await rulesOnly('um so we went', 'verbatim')).text).toBe('Um so we went.');
  });

  it('leaves dictionary terms, quotes and mixed-case words exactly as written', async () => {
    expect((await rulesOnly('chalo Ashu, time for bath')).text).toBe('chalo Ashu, time for bath.');
    expect((await rulesOnly('"bau" she said')).text).toBe('"bau" she said.');
    expect((await rulesOnly('she said "bau"')).text).toBe('She said "bau".');
    expect((await rulesOnly('iPad time again')).text).toBe('iPad time again.');
    // a mis-cased name is the dictionary's job (stt_fix), not punctuation's
    const out = await rulesOnly('asha walked');
    expect(out.text).toBe('Asha walked.');
    expect(out.applied.map((e) => e.type)).toEqual(['stt_fix', 'punctuation']);
  });

  it('does nothing when the text is already punctuated, caseless, or empty', () => {
    expect(punctuationEdits(req('She walked!'))).toEqual([]);
    expect(punctuationEdits(req('वह चली।'))).toEqual([]);
    expect(punctuationEdits(req('   '))).toEqual([]);
  });

  it('emits only punctuation edits, and every one passes the verifier', () => {
    const raw = 'um she walked. then, uh, Asia laughed. and she said "bau"';
    const edits = punctuationEdits(req(raw));
    expect(edits.length).toBeGreaterThan(0);
    expect(edits.every((e) => e.type === 'punctuation' && e.source === 'rule')).toBe(true);
    const v = verifyEdits(edits, { raw, level: 'clean', dictionary: DICT, protectedSpans: [] });
    expect(v.rejected).toEqual([]);
  });

  it('is not a free pass: the pipeline re-verifies rule-provider edits', () => {
    const raw = 'she walked';
    const sneaky = { type: 'punctuation' as const, start: 10, end: 10, original: '', replacement: ' happily.', source: 'rule' as const };
    const out = faithfulClean(raw, { level: 'clean', dictionary: DICT, ruleEdits: [sneaky] });
    expect(out.text).toBe('she walked');
    expect(out.rejected[0].reason).toBe('punctuation_changed_letters');
  });
});

describe('JsonModelEditProvider: parses strict JSON and keeps only verified edits', () => {
  it('accepts real repairs and locates them by exact text', async () => {
    const raw = 'Asha have a red ball. she was, she was so happy';
    const model = stub({
      edits: [
        { type: 'agreement', original: 'have', replacement: 'has' },
        { type: 'false_start', original: 'she was, ', replacement: '' },
      ],
    });
    const p = new JsonModelEditProvider(model, { id: 'stub' });
    const out = await p.propose(req(raw));
    expect(out.error).toBeUndefined();
    expect(out.rejected).toEqual([]);
    expect(out.edits.map((e) => [e.type, e.source])).toEqual([
      ['agreement', 'model'],
      ['false_start', 'model'],
    ]);
    expect(applyEdits(raw, out.edits)).toBe('Asha has a red ball. she was so happy');
    expect(model.calls[0]).toContain(raw);
  });

  it('with rule punctuation, capitalises the word that survives a false start', async () => {
    const raw = 'Asha have a red ball. she was, she was so happy';
    const model = stub({
      edits: [
        { type: 'agreement', original: 'have', replacement: 'has' },
        { type: 'false_start', original: 'she was, ', replacement: '' },
      ],
    });
    const out = await cleanWithProviders(req(raw), [new RulePunctuationProvider(), new JsonModelEditProvider(model)]);
    expect(out.text).toBe('Asha has a red ball. She was so happy.');
    expect(out.rejected).toEqual([]);
  });

  it('drops adversarial output that tries to add words, under every label', async () => {
    const raw = 'She walked to the door, um, and "bau" she said to Mumma';
    const model = stub({
      edits: [
        { type: 'punctuation', original: 'walked', replacement: 'walked happily' },
        { type: 'agreement', original: 'walked', replacement: 'walked slowly' },
        { type: 'agreement', original: 'door', replacement: 'gate' },
        { type: 'filler', original: 'um', replacement: 'proudly' },
        { type: 'false_start', original: 'She walked to the door, ', replacement: '' },
        { type: 'repeat', original: 'and', replacement: '' },
        { type: 'stt_fix', original: 'door', replacement: 'garden' },
        { type: 'stt_fix', original: 'Mumma', replacement: 'her loving Mumma' },
        { type: 'punctuation', original: '"bau"', replacement: '"Bau!"' },
      ],
    });
    const out = await new JsonModelEditProvider(model).propose(req(raw));
    expect(out.edits).toEqual([]);
    expect(out.invalid).toEqual([]);
    const reasons = out.rejected.map((r) => r.reason);
    expect(reasons).toEqual(
      expect.arrayContaining([
        'punctuation_changed_letters',
        'agreement_not_single_word',
        'agreement_stem_mismatch',
        'removal_only',
        'false_start_not_repeated',
        'not_a_repeat',
        'stt_fix_not_dictionary',
        'overlaps_protected',
      ]),
    );
    // the end-to-end text never contains a word the speaker did not say
    const clean = await cleanWithProviders(req(raw), [new JsonModelEditProvider(model)]);
    for (const w of ['happily', 'slowly', 'gate', 'proudly', 'garden', 'loving', 'Bau']) expect(clean.text).not.toContain(w);
  });

  it('cannot smuggle words in through an insertion or an invented original', async () => {
    const raw = 'She walked to the door';
    const model = stub({
      edits: [
        { type: 'punctuation', original: 'door', replacement: 'door, and she was brave.' },
        { type: 'punctuation', original: 'garden', replacement: 'garden.' }, // never said
        { type: 'punctuation', original: 'oor', replacement: 'oor.' }, // not a whole word
      ],
    });
    const out = await new JsonModelEditProvider(model).propose(req(raw));
    expect(out.edits).toEqual([]);
    expect(out.rejected.map((r) => r.reason)).toEqual(['punctuation_changed_letters']);
    expect(out.invalid.map((i) => i.reason)).toEqual(['original_not_found', 'original_not_found']);
  });

  it('rejects malformed replies whole, and malformed items one by one', async () => {
    const raw = 'she have a ball and she have a cat';
    const run = (reply: string | object) => new JsonModelEditProvider(stub(reply)).propose(req(raw));

    expect((await run('Sure! Here are the edits: []')).error).toBe('not_json');
    expect((await run('```json\n{"edits": []}\n```')).error).toBe('not_json');
    expect((await run({ text: 'She has a ball and she has a cat.' })).error).toBe('schema_mismatch');
    expect((await run({ edits: [], rewritten: 'She has a ball.' })).error).toBe('schema_mismatch');
    expect((await run([{ type: 'agreement', original: 'have', replacement: 'has' }])).error).toBe('schema_mismatch');

    const out = await run({
      edits: [
        { type: 'rewrite', original: 'she have a ball', replacement: 'she adores her ball' },
        { type: 'agreement', original: 'have', replacement: 'has', source: 'rule' },
        { type: 'agreement', original: 'have', replacement: 'has' }, // ambiguous: appears twice
        { type: 'agreement', original: 'have', replacement: 'has', occurrence: 3 },
        { type: 'agreement', original: 'have', replacement: 'has', occurrence: 2 },
        'has',
      ],
    });
    expect(out.invalid.map((i) => i.reason)).toEqual([
      'unknown_type',
      'unknown_key',
      'not_an_object',
      'ambiguous_original',
      'occurrence_out_of_range',
    ]);
    expect(out.edits).toHaveLength(1);
    expect(applyEdits(raw, out.edits)).toBe('she have a ball and she has a cat');
  });

  it('never lets a model label its edits as rules', async () => {
    const liar: EditProvider = {
      id: 'liar',
      source: 'model',
      async propose(r) {
        const raw = r.raw;
        const edits = ['walk', 'talk', 'run', 'eat', 'sing', 'jump'].map((w) => {
          const start = raw.indexOf(w);
          return { type: 'agreement' as const, start, end: start + w.length, original: w, replacement: `${w}s`, source: 'rule' as const };
        });
        return { edits, flags: [], rejected: [], invalid: [] };
      },
    };
    const raw = 'I walk. You talk. We run. They eat. She sing. He jump.';
    const out = await cleanWithProviders(req(raw), [liar]);
    // stamped as model, so the change ceiling throws them all out
    expect(out.applied).toEqual([]);
    expect(out.rejected.every((r) => r.reason === 'change_ceiling_exceeded' && r.edit.source === 'model')).toBe(true);
  });

  it('falls back to rules-only when the model fails, without leaking text in the error', async () => {
    const raw = 'um she walked to Asia';
    const failing: ModelCall = async () => {
      throw new Error(`upstream 500 while processing: ${raw}`);
    };
    const out = await cleanWithProviders(req(raw), [new RulePunctuationProvider(), new JsonModelEditProvider(failing)]);
    expect(out.text).toBe('She walked to Asha.');
    expect(out.providers.find((p) => p.source === 'model')?.error).toBe('model_call_failed');
  });

  it('maps flags to spans and keeps them out of the text', async () => {
    const raw = 'she went to the mela with Mumma';
    const out = await new JsonModelEditProvider(stub({ edits: [], flags: [{ original: 'mela' }, { original: 'fair' }] })).propose(req(raw));
    expect(out.flags).toEqual([{ start: 16, end: 20, original: 'mela', reason: 'model_unsure' }]);
    expect(out.invalid.map((i) => i.reason)).toEqual(['flag_original_not_found']);
  });

  it('parseEditReply caps oversized replies', () => {
    expect(parseEditReply(' '.repeat(70_000)).error).toBe('reply_too_long');
    const many = { edits: Array.from({ length: 201 }, () => ({ type: 'filler', original: 'um', replacement: '' })) };
    expect(parseEditReply(JSON.stringify(many)).error).toBe('too_many_items');
  });
});
