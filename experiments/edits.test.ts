import { describe, expect, it } from 'vitest';
import type { ModelCall } from '@scribe/core';
import { changedWordRatio, compareTranscript, recordingModel, replayModel, summarize } from './edits';

// Fictional family only.
const DICT = [
  { term: 'Asha', kind: 'child' as const, heardAs: ['Asia'] },
  { term: 'Mumma', kind: 'family' as const, heardAs: [] },
];

const replying = (reply: object | string): ModelCall => async () => (typeof reply === 'string' ? reply : JSON.stringify(reply));

describe('edit-pass comparison', () => {
  it('scores changed words, ignoring case and punctuation', () => {
    expect(changedWordRatio('she walked', 'She walked.')).toBe(0);
    expect(changedWordRatio('um she walked', 'She walked.')).toBeCloseTo(1 / 3);
    expect(changedWordRatio('', '')).toBe(0);
  });

  it('runs rules-only and rules+model on the same transcript', async () => {
    const t = { file: 'a', raw: 'um Asia have a ball. she was, she was so happy', expected: 'Asha has a ball. She was so happy.' };
    const model = replying({
      edits: [
        { type: 'agreement', original: 'have', replacement: 'has' },
        { type: 'false_start', original: 'she was, ', replacement: '' },
      ],
    });
    const [rules, withModel] = await compareTranscript(t, DICT, model);
    expect(rules.variant).toBe('rules');
    expect(rules.clean).toBe('Asha have a ball. She was, she was so happy.');
    expect(withModel.clean).toBe('Asha has a ball. She was so happy.');
    expect(withModel.werClean).toBe(0);
    expect(withModel.changedWordRatio).toBeGreaterThan(rules.changedWordRatio);
    expect(withModel.rejectedTotal).toBe(0);
  });

  it('counts verifier rejections and keeps the rules output when the model misbehaves', async () => {
    const t = { file: 'b', raw: 'she walked to Mumma' };
    const model = replying({ edits: [{ type: 'punctuation', original: 'walked', replacement: 'walked proudly' }, { type: 'nonsense', original: 'x', replacement: 'y' }] });
    const rows = await compareTranscript(t, DICT, model);
    expect(rows[1].clean).toBe(rows[0].clean);
    expect(rows[1].rejections).toEqual({ punctuation_changed_letters: 1 });
    expect(rows[1].invalid).toBe(1);

    const broken = await compareTranscript(t, DICT, replying('I fixed it for you: She walked to Mumma!'));
    expect(broken[1].error).toBe('not_json');

    const s = summarize([...rows, ...broken.map((r) => ({ ...r, file: 'c' }))]);
    expect(s.map((v) => v.variant)).toEqual(['rules', 'rules+model']);
    expect(s[1]).toMatchObject({ transcripts: 2, totalRejected: 1, totalInvalid: 1, errors: 1, differsFromRules: 0 });
  });

  it('runs rules only when no model is configured', async () => {
    const rows = await compareTranscript({ file: 'd', raw: 'she walked' }, DICT, null);
    expect(rows.map((r) => r.variant)).toEqual(['rules']);
  });

  it('collapses restarts, keeps grammatical doubles and counts offered repeats', async () => {
    const t = {
      file: 'e',
      raw: 'today you you held the spoon, it was like a like a little hiccup. I told you you were brave and I am so so proud',
      expected: 'Today you held the spoon, it was like a little hiccup. I told you you were brave and I am so so proud.',
    };
    const [rules] = await compareTranscript(t, DICT, null);
    expect(rules.clean).toBe(t.expected);
    expect(rules.werClean).toBe(0);
    expect(rules.applied.repeat).toBe(2);
    expect(rules.suggested).toBe(1); // "so so": the parent decides
    expect(summarize([rules])[0].totalSuggested).toBe(1);
  });

  it('records replies and replays them without any endpoint', async () => {
    let id = '';
    const saved: Record<string, string> = {};
    const live = recordingModel(replying({ edits: [{ type: 'agreement', original: 'have', replacement: 'has' }] }), () => id, saved);
    const t = { file: 'f', raw: 'she have a ball' };
    id = 'f';
    const first = await compareTranscript(t, DICT, live);
    expect(Object.keys(saved)).toEqual(['f']);

    const replay = replayModel(saved, () => id);
    const again = await compareTranscript(t, DICT, replay);
    expect(again[1].clean).toBe(first[1].clean);
    expect(again[1].clean).toBe('She has a ball.');

    id = 'missing';
    const none = await compareTranscript({ file: 'missing', raw: 'she have a ball' }, DICT, replay);
    expect(none[1].error).toBe('model_call_failed');
    expect(none[1].clean).toBe(none[0].clean);
  });
});
