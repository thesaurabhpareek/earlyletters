import { describe, expect, it } from 'vitest';
import type { DictionaryTerm } from '@scribe/core';
import { isNearSilent, peakFrameDbfs } from '../src/lib/transcribe-energy';
import { toWhisperLanguage } from '../src/lib/transcribe-language';
import type { Chunk } from '../src/lib/transcribe-plan';
import { chunkText, joinChunks, looksLikeLoop, speechOnly, speechUnits, tokensToWords, withoutOverlap } from '../src/lib/transcribe-post';
import {
  DEFAULT_PROMPT_SEEDS,
  PROMPT_TOKEN_CAP,
  chunkPrompt,
  dictionaryPrompt,
  estimateTokens,
  isDictionaryEcho,
  stripPromptEcho,
} from '../src/lib/transcribe-prompt';

const DICT: DictionaryTerm[] = [
  { term: 'Papa', kind: 'self', heardAs: [] },
  { term: 'Asha', kind: 'child', heardAs: [] },
  { term: 'Ashu', kind: 'nickname', heardAs: [] },
  { term: 'asha', kind: 'word', heardAs: [] },
];

describe('prompt per chunk (B-REQ-006, ADR 0015)', () => {
  it('lists the family spellings child first, each once', () => {
    expect(dictionaryPrompt(DICT)).toBe('Asha, Ashu, Papa.');
    expect(dictionaryPrompt([])).toBe('');
  });

  it('puts the language seed last, next to where the transcript starts', () => {
    expect(chunkPrompt(DICT, 'en')).toBe('Asha, Ashu, Papa.');
    expect(chunkPrompt(DICT, 'zh')).toBe('Asha, Ashu, Papa. 以下是普通话的句子。');
    expect(chunkPrompt([], 'hi')).toBe('यह हिंदी में बातचीत है।');
    expect(chunkPrompt(DICT, 'zh', '以下是普通話的句子。')).toBe('Asha, Ashu, Papa. 以下是普通話的句子。'); // a Traditional pack overrides
  });

  it('keeps every seed in its own script and punctuation', () => {
    expect(DEFAULT_PROMPT_SEEDS.hi).toMatch(/[ऀ-ॿ]/);
    expect(DEFAULT_PROMPT_SEEDS.hi.endsWith('।')).toBe(true);
    expect(DEFAULT_PROMPT_SEEDS.ar).toMatch(/[؀-ۿ]/);
    expect(DEFAULT_PROMPT_SEEDS.ar).toContain('؟');
    expect(DEFAULT_PROMPT_SEEDS.es).toContain('¿');
    expect(DEFAULT_PROMPT_SEEDS.en).toBe('');
  });

  it('stays under the prompt cap, dropping the lowest-priority terms and never the seed', () => {
    const many: DictionaryTerm[] = Array.from({ length: 200 }, (_, i) => ({ term: `Name${i}`, kind: 'word', heardAs: [] }));
    const p = chunkPrompt([{ term: 'Asha', kind: 'child', heardAs: [] }, ...many], 'zh');
    expect(estimateTokens(p)).toBeLessThanOrEqual(PROMPT_TOKEN_CAP);
    expect(p.startsWith('Asha, ')).toBe(true);
    expect(p.endsWith(DEFAULT_PROMPT_SEEDS.zh)).toBe(true);
  });

  it("[constitution] drops an echo of our own seed: the prompt never becomes a person's words", () => {
    const seed = DEFAULT_PROMPT_SEEDS.zh;
    expect(stripPromptEcho('以下是普通话的句子。', seed)).toEqual({ text: '', echoed: true });
    expect(stripPromptEcho('以下是普通话的句子。今天我们去了公园。', seed)).toEqual({ text: '今天我们去了公园。', echoed: true });
    expect(stripPromptEcho('今天我们去了公园。', seed)).toEqual({ text: '今天我们去了公园。', echoed: false });
  });

  it('[constitution] keeps a short word that happens to be in the seed: people say it', () => {
    expect(stripPromptEcho('Español.', DEFAULT_PROMPT_SEEDS.es)).toEqual({ text: 'Español.', echoed: false });
    expect(stripPromptEcho('¿Verdad?', DEFAULT_PROMPT_SEEDS.es).echoed).toBe(false);
  });

  it('treats the whole name list said back as an echo, never a single name', () => {
    expect(isDictionaryEcho('Asha, Ashu, Papa.', 'Asha, Ashu, Papa.')).toBe(true);
    expect(isDictionaryEcho('Asha.', 'Asha.')).toBe(false);
    expect(isDictionaryEcho('Asha and Papa', 'Asha, Ashu, Papa.')).toBe(false);
  });
});

describe('recogniser output to raw transcript (TDD 03 3.5.7, 3.8)', () => {
  const plain: Chunk = { index: 0, pieces: [{ srcStartMs: 1000, srcEndMs: 5000, silenceBeforeMs: 0 }], ownStartMs: -Infinity, ownEndMs: Infinity, audioMs: 4000, speechMs: 4000 };

  it('merges sub-word tokens into words with times on the recording', () => {
    const words = tokensToWords([
      { text: ' As', startMs: 1000, endMs: 1100 },
      { text: 'ha', startMs: 1100, endMs: 1300 },
      { text: ' laughed', startMs: 1400, endMs: 1900 },
      { text: '.', startMs: 1900, endMs: 1950 },
    ]);
    expect(words).toEqual([
      { text: 'Asha', startMs: 1000, endMs: 1300 },
      { text: 'laughed.', startMs: 1400, endMs: 1900 },
    ]);
  });

  it('takes chunk text from the full result and maps token times through the chunk', () => {
    const out = chunkText(plain, { result: ' Asha laughed.', segments: [{ text: ' Asha', t0: 0, t1: 30 }, { text: ' laughed.', t0: 30, t1: 80 }] });
    expect(out.text).toBe('Asha laughed.');
    expect(out.words).toEqual([
      { text: 'Asha', startMs: 1000, endMs: 1300 },
      { text: 'laughed.', startMs: 1300, endMs: 1800 },
    ]);
    expect(out.redecodeWithoutOverlap).toBe(false);
  });

  it('at a seam keeps each overlapped word once, by the side that owns its midpoint', () => {
    const left: Chunk = { ...plain, pieces: [{ srcStartMs: 0, srcEndMs: 10_500, silenceBeforeMs: 0 }], ownStartMs: -Infinity, ownEndMs: 10_000 };
    const out = chunkText(left, {
      result: ' one two three',
      segments: [
        { text: ' one', t0: 0, t1: 100 },
        { text: ' two', t0: 950, t1: 990 }, // 9.5 s to 9.9 s: owned here
        { text: ' three', t0: 1010, t1: 1050 }, // 10.1 s to 10.5 s: owned by the next chunk
      ],
    });
    expect(out.text).toBe('one two');
  });

  it('asks for a redecode without overlap when tokens split a character (multi-byte scripts)', () => {
    const seam: Chunk = { ...plain, ownEndMs: 3000 };
    const out = chunkText(seam, { result: ' नमस्ते', segments: [{ text: ' न�', t0: 0, t1: 50 }, { text: '�मस्ते', t0: 50, t1: 100 }] });
    expect(out.redecodeWithoutOverlap).toBe(true);
    const trimmed = withoutOverlap(seam);
    expect(trimmed.pieces).toEqual([{ srcStartMs: 1000, srcEndMs: 3000, silenceBeforeMs: 0 }]);
    expect(Number.isFinite(trimmed.ownEndMs)).toBe(false);
  });

  it('[TDD 03 FM-11] removes non-speech tags only, never words inside speech', () => {
    expect(speechOnly('[BLANK_AUDIO]')).toBe('');
    expect(speechOnly('(waves crashing)')).toBe('');
    expect(speechOnly('Asha *laughs* laughed today ♪')).toBe('Asha laughed today');
    expect(joinChunks(['Asha laughed.', '', '  ', 'Then she slept.'])).toBe('Asha laughed. Then she slept.');
  });

  it('[TDD 03 FM-13] spots a decode that loops, in words and in Han characters', () => {
    expect(looksLikeLoop('bye bye bye bye', 4000)).toBe(true);
    expect(looksLikeLoop('we went to the park and then we came home', 4000)).toBe(false);
    expect(looksLikeLoop('哈哈哈哈', 3000)).toBe(true);
    expect(looksLikeLoop('今天我们一起去了公园然后吃饭', 3000)).toBe(false); // 14 characters in 3 s: normal speech
    expect(looksLikeLoop('今天我们一起去了公园然后吃饭今天我们一起去了公园然后吃饭', 2000)).toBe(true); // 28 in 2 s
    expect(speechUnits('今天 Asha 笑了')).toEqual(['今', '天', 'asha', '笑', '了']);
  });
});

describe('loudness pre-check and language codes', () => {
  it('skips a window nobody could be talking in, but never quiet speech', () => {
    expect(isNearSilent(new Int16Array(16_000))).toBe(true);
    const whisper = new Int16Array(16_000).map((_, i) => Math.round(Math.sin(i / 5) * 300)); // about -43 dBFS
    expect(isNearSilent(whisper)).toBe(false);
    expect(peakFrameDbfs(new Int16Array(0))).toBe(-Infinity);
  });

  it('maps the author language to Whisper codes and never translates', () => {
    expect(toWhisperLanguage('zh-Hans')).toBe('zh');
    expect(toWhisperLanguage('pt-BR')).toBe('pt');
    expect(toWhisperLanguage('hi')).toBe('hi');
    expect(toWhisperLanguage('xx')).toBe('auto');
    expect(toWhisperLanguage(null)).toBe('auto');
  });
});
