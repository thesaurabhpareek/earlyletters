/**
 * On-device transcription with whisper.rn (ADR 0001, ADR 0015, TDD 03 3.4
 * to 3.5). The steps, for one recording:
 *
 * 1. Voice activity: the recording is decoded in 5-minute windows to 16 kHz
 *    PCM in memory (ScribeAudio, no decode buffer ever written, LEGAL-REQ-018)
 *    and Silero VAD finds the speech. A window with nothing loud enough to be
 *    anyone talking skips VAD (transcribe-energy.ts). Before that, the run's
 *    length is checked against what the file proves (ADR 0027): an ADTS take
 *    whose last frame a kill cut off may be read from a copy of its whole
 *    frames, in Caches, removed when the run ends (capture/adts-file.ts). A
 *    decoder still short of the counted frames refuses the run, and so does a
 *    file that does not end as a kill leaves it, when the decoder cannot read
 *    it as it is. The stream's frames after damage near the end are counted
 *    too, so a decoder that stops at the damage reads short and is refused.
 *    So a take a kill cut off never loses its end without anyone knowing.
 *    What is left needs real damage (ADR 0027 has the measured worst cases;
 *    V3 decides the first): a decoder whose length reads past the damage
 *    while its read stops there (ScribeAudio would return silence), about
 *    85 ms inside the length tolerance, and a damaged frame length that lands
 *    exactly on a later frame's header, which parses as a clean file.
 *    The length saved at capture never refuses a run, and an M4A runs exactly
 *    as before.
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
 *
 * Steps 1, 3 and 5 are pure (transcribe-run.ts); this file only plugs in
 * ScribeAudio and whisper.rn. The Mac gate tool (experiments/gate.ts) runs
 * the same steps with whisper.cpp, so its numbers describe this code.
 */
import { ScribeAudio } from '../../modules/scribe-audio';
import { adtsLengthEvidence, breaksInside } from './capture/adts';
import { scanRecordingFile, wholeFramesCopy } from './capture/adts-file';
import { containerOfRecording } from './capture/recording-file';
import { installedPathsFor } from './models/speech-packs';
import { acquireContexts, releaseContextsLater, whisperModule } from './models/whisper-runtime';
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
import { toWhisperLanguage } from './transcribe-language';
import { planChunks } from './transcribe-plan';
import { DECODE_OPTIONS, VAD_OPTIONS, findSpeech, openRecordingForRun, runFraction, transcribeChunks, type ChunkDecoder } from './transcribe-run';
import { chunkPrompt, DEFAULT_PROMPT_SEEDS, dictionaryPrompt } from './transcribe-prompt';

// The run itself (voice detector settings, chunking, clean-up) is pure and shared with the Mac gate tool.
export { LOOP_RETRY_TEMPERATURE, VAD_OPTIONS } from './transcribe-run';

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
  // An ADTS take proves its own length by its frame headers (ADR 0027); an M4A's length is in its index.
  const adts = containerOfRecording(input.audioUri) === 'adts' ? await scanRecordingFile(input.audioUri) : null;
  // NaN, infinity or an absurd length never reach the planner (security review L9), and a decoder short of what
  // the file proves never plans the run: the take waits for its words instead of losing its end (ADR 0027).
  const run = await openRecordingForRun(
    { probeMs: async (uri) => (await audio.probe(uri)).durationMs, decode: (uri, pieces) => audio.decodePcm16(uri, [...pieces]) },
    input.audioUri,
    input.durationMs,
    // A copy needs at least one whole frame; with none, a cut-off first frame is read (or refused) as it is.
    adts ? { evidence: adtsLengthEvidence(adts), tail: adts.wholeBytes > 0 ? adts.tail : 'none', breakInside: breaksInside(adts) } : null,
    () => wholeFramesCopy(input.audioUri, adts?.wholeBytes ?? 0),
  );
  const durationMs = run.durationMs;
  try {
    check();
    const ctx = await acquireContexts(paths.asr, paths.vad);
    try {
      const spans = await findSpeech(
        durationMs,
        {
          decodeWindow: (startMs, endMs) => run.decode([{ srcStartMs: startMs, srcEndMs: endMs, silenceBeforeMs: 0 }]),
          detectSpeech: (pcm) => ctx.vad.detectSpeechData(pcm, VAD_OPTIONS),
        },
        check,
      );
      const plan = planChunks(spans, durationMs);
      if (plan.length === 0) return result('', []);

      const language = toWhisperLanguage(input.language);
      const prompt = chunkPrompt(input.dictionary, input.language, input.promptSeed);
      const seed = (input.promptSeed ?? DEFAULT_PROMPT_SEEDS[input.language] ?? '').trim();
      const nameList = dictionaryPrompt(input.dictionary);

      // Within a part, whisper.rn reports 0 to 100 per call: the run's share is (parts done + this part's share) / parts.
      let part = { done: 0, total: plan.length };
      const decode: ChunkDecoder = async (chunk, temperature) => {
        const pcm = await run.decode(chunk.pieces);
        check();
        // The part this call belongs to, fixed at its start; one update per whole percent, not per callback.
        const at = part;
        let lastPct = -1;
        const within = (pct: number) => {
          const whole = Math.floor(pct);
          if (!(whole > lastPct)) return;
          lastPct = whole;
          onProgress?.({ stage: 'listening', done: at.done, total: at.total, fraction: runFraction(at.done, at.total, whole) });
        };
        const job = ctx.asr.transcribeData(pcm, { ...DECODE_OPTIONS, language, prompt: prompt || undefined, temperature, onProgress: within });
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

      const { raw, words } = await transcribeChunks(
        plan,
        decode,
        {
          seed,
          nameList,
          check,
          onProgress: (done, total) => {
            part = { done, total };
            // No fraction here: only whisper.rn's own callback gives one, so if it never fires the bar is not drawn
            // stuck at the start (words-state.logic.ts falls back to the part words and per-part steps).
            onProgress?.({ stage: 'listening', done, total });
          },
        },
        meta,
      );
      return result(raw, words);
    } finally {
      releaseContextsLater();
    }
  } finally {
    run.close();
  }
}
