/**
 * The pure transcription run (src/lib/transcribe-run.ts), shared by the app
 * (transcribe-whisper.ts) and the Mac gate tool (experiments/gate.ts). Fake
 * decoders stand in for whisper.rn; text is the fictional family "Asha".
 */
import { describe, expect, it } from 'vitest';
import type { SttMeta } from '../src/lib/transcribe';
import { SPEECH_LANGUAGES } from '../src/lib/models/catalog';
import { toWhisperLanguage } from '../src/lib/transcribe-language';
import { planChunks, type Chunk } from '../src/lib/transcribe-plan';
import type { ChunkDecode } from '../src/lib/transcribe-post';
import { DEFAULT_PROMPT_SEEDS } from '../src/lib/transcribe-prompt';
import {
  DECODE_OPTIONS,
  LOOP_RETRY_TEMPERATURE,
  MAX_RUN_MS,
  RunInputError,
  findSpeech,
  runDurationMs,
  transcribeChunks,
  type SpeechIo,
} from '../src/lib/transcribe-run';

const meta = (): Pick<SttMeta, 'chunks' | 'dropped' | 'flags'> => ({ chunks: [], dropped: [], flags: [] });
const decoded = (result: string): ChunkDecode => ({ result, segments: [] });

/** 16 kHz PCM16 of `ms`, loud (speech-like) or all zeros. */
function pcm(ms: number, loud: boolean): ArrayBuffer {
  const a = new Int16Array(Math.round((ms * 16_000) / 1000));
  if (loud) for (let i = 0; i < a.length; i++) a[i] = i % 2 ? 6000 : -6000;
  return a.buffer;
}

describe('[security review L9] the planner only ever sees a real duration', () => {
  it('prefers the decoder measure, falls back to the stored one, never NaN or infinity', () => {
    expect(runDurationMs(120_000, 90_000)).toBe(120_000);
    expect(runDurationMs(Number.NaN, 90_000)).toBe(90_000);
    expect(runDurationMs(Number.POSITIVE_INFINITY, 90_000)).toBe(90_000);
    expect(runDurationMs(-5, 90_000)).toBe(90_000);
    expect(runDurationMs(0, null)).toBe(0);
    expect(runDurationMs(undefined, Number.NaN)).toBe(0);
  });

  it('refuses an absurd length instead of planning thousands of windows or cutting the letter short', () => {
    expect(() => runDurationMs(MAX_RUN_MS + 1, null)).toThrow(RunInputError);
    expect(() => runDurationMs(Number.NaN, MAX_RUN_MS * 10)).toThrow(RunInputError);
    expect(runDurationMs(MAX_RUN_MS, null)).toBe(MAX_RUN_MS);
  });
});

describe('voice activity over windows (TDD 03 3.5.3)', () => {
  it('skips silent windows without running the detector, and puts spans on the recording timeline', async () => {
    const windowsAsked: Array<[number, number]> = [];
    let detectorRuns = 0;
    const io: SpeechIo = {
      async decodeWindow(startMs, endMs) {
        windowsAsked.push([startMs, endMs]);
        return pcm(Math.min(1000, endMs - startMs), startMs !== 300_000); // the second window is silence
      },
      async detectSpeech() {
        detectorRuns += 1;
        return [{ t0: 100, t1: 250 }]; // 1.0 s to 2.5 s of the window, in centiseconds
      },
    };
    const spans = await findSpeech(11 * 60_000, io);
    expect(windowsAsked).toEqual([
      [0, 300_000],
      [300_000, 600_000],
      [600_000, 660_000],
    ]);
    expect(detectorRuns).toBe(2);
    expect(spans).toEqual([
      { startMs: 1_000, endMs: 2_500 },
      { startMs: 601_000, endMs: 602_500 },
    ]);
  });

  it('an empty recording asks for nothing', async () => {
    const io: SpeechIo = {
      decodeWindow: () => Promise.reject(new Error('never')),
      detectSpeech: () => Promise.reject(new Error('never')),
    };
    await expect(findSpeech(0, io)).resolves.toEqual([]);
  });

  it('stops between windows when the job is cancelled', async () => {
    let calls = 0;
    const io: SpeechIo = { decodeWindow: async () => (calls++, pcm(10, false)), detectSpeech: async () => [] };
    const check = () => {
      if (calls >= 1) throw new Error('aborted');
    };
    await expect(findSpeech(20 * 60_000, io, check)).rejects.toThrow('aborted');
    expect(calls).toBe(1);
  });
});

describe('chunks to raw transcript (TDD 03 3.5.5, 3.5.7)', () => {
  const plan: Chunk[] = planChunks(
    [
      { startMs: 0, endMs: 5_000 },
      { startMs: 40_000, endMs: 45_000 },
      { startMs: 80_000, endMs: 85_000 },
    ],
    90_000,
    { maxChunkMs: 8_000 },
  );
  const seed = DEFAULT_PROMPT_SEEDS.es;

  it('joins what each chunk heard, in order, and reports progress once per chunk and at the end', async () => {
    expect(plan).toHaveLength(3);
    const texts = ['Asha laughed today.', 'She held the spoon.', 'Good night, Asha.'];
    const progress: Array<[number, number]> = [];
    const m = meta();
    const out = await transcribeChunks(plan, async (c) => decoded(texts[c.index]), { seed: '', nameList: 'Asha.', onProgress: (d, t) => progress.push([d, t]) }, m);
    expect(out.raw).toBe('Asha laughed today. She held the spoon. Good night, Asha.');
    expect(progress).toEqual([
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
    expect(m.chunks.map((c) => c.units)).toEqual([3, 4, 3]);
    expect(m.dropped).toEqual([]);
  });

  it("[constitution] drops only what nobody said: tags, our own seed, the name list read back", async () => {
    const texts = ['[MUSIC]', `${seed} Asha durmió.`, 'Asha, Ashu, Papa.'];
    const m = meta();
    const out = await transcribeChunks(plan, async (c) => decoded(texts[c.index]), { seed, nameList: 'Asha, Ashu, Papa.' }, m);
    expect(out.raw).toBe('Asha durmió.');
    expect(m.dropped.map((d) => d.reason)).toEqual(['non_speech_tag', 'prompt_echo', 'dictionary_echo']);
  });

  it('decodes a looping chunk once more, warmer, and keeps the first text flagged if it still loops', async () => {
    const temps: number[] = [];
    const loop = 'bye bye bye bye bye bye bye bye';
    const m = meta();
    const out = await transcribeChunks(
      plan.slice(0, 1),
      async (_c, t) => {
        temps.push(t);
        return decoded(loop);
      },
      { seed: '', nameList: '' },
      m,
    );
    expect(temps).toEqual([0, LOOP_RETRY_TEMPERATURE]);
    expect(out.raw).toBe(loop);
    expect(m.flags).toEqual([{ chunk: 0, reason: 'repetition_loop' }]);
  });

  it('takes the retry when it no longer loops', async () => {
    const m = meta();
    const out = await transcribeChunks(
      plan.slice(0, 1),
      async (_c, t) => decoded(t === 0 ? 'Asha Asha Asha Asha Asha Asha' : 'Asha, my Asha.'),
      { seed: '', nameList: '' },
      m,
    );
    expect(out.raw).toBe('Asha, my Asha.');
    expect(m.flags).toEqual([]);
  });

  it('stops after the chunk that was running when the job is cancelled', async () => {
    let decodes = 0;
    let aborted = false;
    const check = () => {
      if (aborted) throw new Error('aborted');
    };
    await expect(
      transcribeChunks(
        plan,
        async () => {
          decodes += 1;
          aborted = true;
          return decoded('Asha.');
        },
        { seed: '', nameList: '', check },
        meta(),
      ),
    ).rejects.toThrow('aborted');
    expect(decodes).toBe(1);
  });
});

describe('decode settings (F05-REQ-008, F05-REQ-009, LEGAL-REQ-019)', () => {
  it('[F05-REQ-009] never translates and never separates speakers', () => {
    expect(DECODE_OPTIONS.translate).toBe(false);
    expect(DECODE_OPTIONS.tdrzEnable).toBe(false);
  });

  it("[F05-REQ-008] every spoken-letter language is decoded as itself, never 'auto'", () => {
    for (const lang of SPEECH_LANGUAGES) expect(toWhisperLanguage(lang)).toBe(lang);
  });
});
