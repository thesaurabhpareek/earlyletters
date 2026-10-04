/**
 * On-device transcription with whisper.rn (ADR 0001, ADR 0015, TDD 03 3.4
 * to 3.5). The steps, for one recording:
 *
 * 1. Voice activity: the recording is decoded in 5-minute windows to 16 kHz
 *    PCM in memory (ScribeAudio, no file ever written, LEGAL-REQ-018) and
 *    Silero VAD finds the speech. A window with nothing loud enough to be
 *    anyone talking skips VAD (transcribe-energy.ts).
 * 2. No speech anywhere: the transcript is '' and Whisper never runs, so a
 *    white-noise machine can never become words (TDD 03 3.5.7 rule 1).
 * 3. The planner (transcribe-plan.ts) packs speech into chunks of at most
 *    28 s, cut in pauses, with overlap only inside continuous speech.
 * 4. Each chunk is decoded again, in memory, and transcribed in its own
 *    call with the author's language and the dictionary prompt, because
 *    whisper.rn carries the prompt only through the first 30 s of a call.
 * 5. Each chunk's text keeps only what was heard: non-speech tags, an echo
 *    of our own prompt and an echo of the name list are dropped (they are
 *    not the person's words); nothing inside speech is ever removed. A
 *    chunk that loops is decoded once more at a higher temperature, and
 *    kept (flagged) if it still repeats: it may be real.
 *
 * Never translates (`translate: false`), never diarizes (`tdrzEnable:
 * false`, LEGAL-REQ-019). Abort stops the current chunk at once.
 */
import { ScribeAudio } from '../../modules/scribe-audio';
import { installedPathsFor } from './models/speech-packs';
import { acquireContexts, releaseContextsLater, whisperModule, type Contexts } from './models/whisper-runtime';
import {
  TranscriberUnavailable,
  TranscriptionAborted,
  type SttMeta,
  type TranscribeInput,
  type TranscribeProgress,
  type TranscribeResult,
  type Transcriber,
  type Word,
} from './transcribe';
import { isNearSilent } from './transcribe-energy';
import { toWhisperLanguage } from './transcribe-language';
import { joinAtBoundaries, planChunks, vadWindows, type Chunk, type SpeechSpan } from './transcribe-plan';
import { chunkText, collapseSpaces, joinChunks, looksLikeLoop, speechOnly, speechUnits, withoutOverlap, type ChunkDecode } from './transcribe-post';
import { chunkPrompt, DEFAULT_PROMPT_SEEDS, dictionaryPrompt, isDictionaryEcho, stripPromptEcho } from './transcribe-prompt';

/**
 * Silero VAD settings (E: starting values, tuned on the golden corpus,
 * TDD 03 OQ-5). 200 ms padding keeps word onsets Whisper needs (Silero's
 * default 30 ms cuts them); 300 ms minimum silence avoids splitting at
 * every breath.
 */
export const VAD_OPTIONS = {
  threshold: 0.5,
  minSpeechDurationMs: 250,
  minSilenceDurationMs: 300,
  speechPadMs: 200,
  samplesOverlap: 0.1,
} as const;

/** Temperature for the one retry of a chunk that looped (whisper.cpp's own fallback steps by 0.2). */
export const LOOP_RETRY_TEMPERATURE = 0.4;

let bindingVersion: string | null = null;
function binding(): string | null {
  if (bindingVersion) return bindingVersion;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    bindingVersion = (require('whisper.rn/package.json') as { version?: string }).version ?? null;
  } catch {
    bindingVersion = null;
  }
  return bindingVersion;
}

export function createWhisperTranscriber(): Transcriber {
  return {
    id: 'whisper',
    isSample: false,
    async availability(language) {
      if (!whisperModule() || !ScribeAudio) return 'native-module-missing';
      if (!installedPathsFor(language)) return 'model-missing';
      return null;
    },
    transcribe: transcribeWithWhisper,
  };
}

async function transcribeWithWhisper(
  input: TranscribeInput,
  hooks: { signal?: AbortSignal; onProgress?: (p: TranscribeProgress) => void } = {},
): Promise<TranscribeResult> {
  const audio = ScribeAudio;
  if (!audio || !whisperModule()) throw new TranscriberUnavailable('native-module-missing');
  const paths = installedPathsFor(input.language);
  if (!paths) throw new TranscriberUnavailable('model-missing');
  const { signal, onProgress } = hooks;
  const check = () => {
    if (signal?.aborted) throw new TranscriptionAborted();
  };

  const meta: SttMeta = {
    engine: 'whisper-rn',
    model: paths.asrId,
    bindingVersion: binding(),
    language: input.language,
    chunks: [],
    dropped: [],
    flags: [],
  };
  const result = (raw: string, words: Word[]): TranscribeResult => ({
    raw,
    words,
    language: input.language,
    transcriber: 'whisper',
    outcome: raw ? 'ok' : 'no_speech',
    meta,
  });

  onProgress?.({ stage: 'preparing', done: 0, total: 0 });
  const info = await audio.probe(input.audioUri);
  const durationMs = Math.max(0, info.durationMs || input.durationMs || 0);
  check();

  const ctx = await acquireContexts(paths.asr, paths.vad);
  try {
    const spans = await findSpeech(ctx, input.audioUri, durationMs, check);
    const plan = planChunks(spans, durationMs);
    if (plan.length === 0) return result('', []);

    const language = toWhisperLanguage(input.language);
    const prompt = chunkPrompt(input.dictionary, input.language, input.promptSeed);
    const seed = (input.promptSeed ?? DEFAULT_PROMPT_SEEDS[input.language] ?? '').trim();
    const nameList = dictionaryPrompt(input.dictionary);

    const decode = async (chunk: Chunk, temperature: number): Promise<ChunkDecode> => {
      const pcm = await audio.decodePcm16(input.audioUri, chunk.pieces);
      check();
      const job = ctx.asr.transcribeData(pcm, {
        language,
        translate: false,
        tdrzEnable: false,
        tokenTimestamps: true,
        maxLen: 1,
        prompt: prompt || undefined,
        temperature,
      });
      const stop = () => void job.stop().catch(() => {});
      signal?.addEventListener('abort', stop);
      try {
        const res = await job.promise;
        if (res.isAborted) throw new TranscriptionAborted();
        return { result: res.result, segments: res.segments };
      } finally {
        signal?.removeEventListener('abort', stop);
      }
    };

    const texts: string[] = [];
    const words: Word[] = [];
    for (const chunk of plan) {
      check();
      onProgress?.({ stage: 'listening', done: chunk.index, total: plan.length });

      let used = chunk;
      let piece = chunkText(used, await decode(used, 0));
      if (piece.redecodeWithoutOverlap) {
        used = withoutOverlap(chunk);
        piece = chunkText(used, await decode(used, 0));
      }
      if (looksLikeLoop(piece.text, chunk.speechMs)) {
        const again = chunkText(used, await decode(used, LOOP_RETRY_TEMPERATURE));
        if (!again.redecodeWithoutOverlap && !looksLikeLoop(again.text, chunk.speechMs)) piece = again;
        else meta.flags.push({ chunk: chunk.index, reason: 'repetition_loop' });
      }

      let text = speechOnly(piece.text);
      let changed = text !== collapseSpaces(piece.text);
      if (changed) meta.dropped.push({ chunk: chunk.index, reason: 'non_speech_tag' });
      const echo = stripPromptEcho(text, seed);
      if (echo.echoed) {
        text = echo.text;
        changed = true;
        meta.dropped.push({ chunk: chunk.index, reason: 'prompt_echo' });
      }
      if (isDictionaryEcho(text, nameList)) {
        text = '';
        changed = true;
        meta.dropped.push({ chunk: chunk.index, reason: 'dictionary_echo' });
      }

      texts.push(text);
      // Word times only where the text is exactly what the tokens spell (v1.1 highlight).
      if (!changed) words.push(...piece.words);
      const first = chunk.pieces[0];
      const last = chunk.pieces[chunk.pieces.length - 1];
      meta.chunks.push({ startMs: first.srcStartMs, endMs: last.srcEndMs, units: speechUnits(text).length });
    }
    onProgress?.({ stage: 'listening', done: plan.length, total: plan.length });
    return result(joinChunks(texts), words);
  } finally {
    releaseContextsLater();
  }
}

/** Speech spans of the whole recording, from VAD over 5-minute windows. */
async function findSpeech(ctx: Contexts, uri: string, durationMs: number, check: () => void): Promise<SpeechSpan[]> {
  const audio = ScribeAudio!;
  const windows = vadWindows(durationMs);
  const spans: SpeechSpan[] = [];
  for (const w of windows) {
    check();
    const pcm = await audio.decodePcm16(uri, [{ srcStartMs: w.startMs, srcEndMs: w.endMs, silenceBeforeMs: 0 }]);
    if (isNearSilent(new Int16Array(pcm))) continue;
    const segments = await ctx.vad.detectSpeechData(pcm, VAD_OPTIONS);
    for (const s of segments) spans.push({ startMs: w.startMs + s.t0 * 10, endMs: w.startMs + s.t1 * 10 });
  }
  return joinAtBoundaries(
    spans,
    windows.slice(1).map((w) => w.startMs),
  );
}
