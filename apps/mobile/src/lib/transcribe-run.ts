/**
 * One recording's transcription run, without the native parts (TDD 03 3.5.3
 * to 3.5.7; pure, test/transcribe-run.test.ts).
 *
 * The device supplies three things: decode a range of the recording to
 * 16 kHz PCM, find speech in it, and decode a chunk. On the phone those are
 * ScribeAudio and whisper.rn (transcribe-whisper.ts). On a Mac they are
 * ffmpeg and whisper.cpp (experiments/gate-audio.ts), so the per-language
 * gate (F05-REQ-002 to -006) measures this exact code: the same voice
 * detector settings, chunk planner, prompt and clean-up, not a copy of them.
 *
 * Nothing here adds, reorders or rewrites words (CLAUDE.md constitution).
 * Raw is what the recogniser heard in speech; the only things dropped are
 * non-speech tags, an echo of our own prompt and an echo of the name list,
 * none of which a person said.
 */
import type { SttMeta, Word } from './transcribe';
import { isNearSilent } from './transcribe-energy';
import { joinAtBoundaries, vadWindows, type Chunk, type SpeechSpan } from './transcribe-plan';
import { chunkText, collapseSpaces, joinChunks, looksLikeLoop, speechOnly, speechUnits, withoutOverlap, type ChunkDecode } from './transcribe-post';
import { isDictionaryEcho, stripPromptEcho } from './transcribe-prompt';

/**
 * Silero VAD settings (E: starting values, tuned on the golden corpus,
 * TDD 03 OQ-5). 200 ms padding keeps word onsets Whisper needs (Silero's
 * default 30 ms cuts them); 300 ms minimum silence avoids splitting at
 * every breath. A change here re-runs every language's gate (F05-REQ-006).
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

/**
 * Settings every chunk is decoded with, besides its language (always the
 * letter's own, never 'auto', F05-REQ-008), prompt and temperature. Never
 * translates; never separates speakers (F05-REQ-009, LEGAL-REQ-019).
 */
export const DECODE_OPTIONS = { translate: false, tdrzEnable: false, tokenTimestamps: true, maxLen: 1 } as const;

/**
 * Longest recording a run accepts: far above the 30-minute capture cap
 * (F04), so it only stops a bad duration from planning thousands of windows.
 */
export const MAX_RUN_MS = 4 * 60 * 60_000;

/**
 * The recording's length cannot be trusted. The job fails (Try again, or type); nothing is cut short or guessed.
 * - `decoder_short`: the decoder reports less audio than the file itself proves, so the tail would not be heard
 *   (ADR 0027).
 * - `break_inside`: an ADTS file breaks before its end (more bytes after the last whole frame than one frame can
 *   hold), so what follows cannot be counted and might not be heard.
 * Either way the take waits, visibly, rather than get a short raw transcript, which could never be fixed.
 */
export class RunInputError extends Error {
  constructor(readonly reason: 'duration_invalid' | 'decoder_short' | 'break_inside') {
    super(reason);
    this.name = 'RunInputError';
  }
}

const usable = (ms: number | null | undefined): ms is number => typeof ms === 'number' && Number.isFinite(ms) && ms > 0;

/**
 * The duration a run plans over (security review L9, JavaScript side): the
 * decoder's own measure when it is a real number above zero, else the one
 * stored at capture. NaN, infinity, zero and negative values never reach the
 * planner. When neither length can be trusted, or one is past `MAX_RUN_MS`,
 * the run is refused: planning over 0 would call the recording silent and
 * give a waiting letter permanent empty words, and a shortened raw
 * transcript would be permanent too. The job fails instead (Try again, or
 * type), and the letter keeps waiting for its words.
 */
export function runDurationMs(probedMs: number | null | undefined, storedMs: number | null | undefined): number {
  const ms = usable(probedMs) ? probedMs : usable(storedMs) ? storedMs : null;
  if (ms === null || ms > MAX_RUN_MS) throw new RunInputError('duration_invalid');
  return ms;
}

/**
 * What a recording's own bytes prove about its length (ADR 0027). For ADTS,
 * the whole frames counted from the headers (capture/adts.ts
 * `adtsLengthEvidence`): `countedMs` is every whole frame, `minDecodedMs`
 * the shortest length a correct decoder may report (less the 2112 samples
 * of priming Apple assumes, TN2258, and one frame).
 */
export interface LengthEvidence {
  countedMs: number;
  minDecodedMs: number;
}

export interface RunDuration {
  /** What the run plans over: never shorter than the counted frames. */
  durationMs: number;
  /** The decoder reports less than the file proves: its tail would go unheard. */
  decoderShort: boolean;
}

/**
 * `runDurationMs`, checked against the file's own evidence (ADR 0027). The
 * decoder's length is not trusted when it is missing or short of
 * `evidence.minDecodedMs`. Then the plan covers the counted frames and
 * `decoderShort` is set, so the caller can try a readable copy or refuse the
 * run, never store a transcript that silently lacks the end. Otherwise the
 * plan covers the decoder's length or the counted frames, whichever is
 * longer.
 *
 * The length stored at capture never refuses a run. It is the recorder's
 * clock, not audio in the file: a take a kill cut off keeps its last progress
 * mark (Listen saves one every 5 s), so it can be seconds past the frames the
 * file holds, and no decoder or retry could ever reach it. As in
 * `runDurationMs`, it stands in only when the decoder gives no usable
 * length. With no evidence (M4A) this is exactly `runDurationMs`.
 */
export function checkedRunDuration(
  probedMs: number | null | undefined,
  storedMs: number | null | undefined,
  evidence: LengthEvidence | null,
): RunDuration {
  const proof = evidence && usable(evidence.countedMs) ? evidence : null;
  if (proof && (!usable(probedMs) || probedMs < proof.minDecodedMs)) {
    const durationMs = Math.max(usable(probedMs) ? probedMs : 0, proof.countedMs);
    if (durationMs > MAX_RUN_MS) throw new RunInputError('duration_invalid');
    return { durationMs, decoderShort: true };
  }
  const ms = runDurationMs(probedMs, storedMs);
  const durationMs = proof ? Math.max(ms, proof.countedMs) : ms;
  if (durationMs > MAX_RUN_MS) throw new RunInputError('duration_invalid');
  return { durationMs, decoderShort: false };
}

/** One range to decode, as the planner and ScribeAudio's `decodePcm16` take it. */
export interface DecodeRange {
  srcStartMs: number;
  srcEndMs: number;
  silenceBeforeMs: number;
}

/** How a run reads a recording: ScribeAudio on the phone. */
export interface RecordingIo {
  /** The decoder's length in ms (ScribeAudio `probe`). */
  probeMs(uri: string): Promise<number | null>;
  decode(uri: string, pieces: readonly DecodeRange[]): Promise<ArrayBuffer>;
}

/** A temporary copy of a recording's whole ADTS frames, in the cache. */
export interface WholeFrameCopy {
  uri: string;
  remove(): void;
}

export interface OpenRun {
  durationMs: number;
  decode(pieces: readonly DecodeRange[]): Promise<ArrayBuffer>;
  /** Removes the temporary copy, if one was made. Call once the run ends, whatever happened. */
  close(): void;
}

/** What an ADTS scan says about one recording (capture/adts.ts): its counted length, and how it ends. */
export interface AdtsFacts {
  evidence: LengthEvidence;
  /** Bytes of a frame a kill cut off at the end; 0 when the file ends on a whole frame. */
  tailBytes: number;
  /** More bytes after the last whole frame than one frame can hold (`breaksInside`). */
  breakInside: boolean;
}

/**
 * Opens one recording for a run (ADR 0027). If probing or decoding throws,
 * or the decoder's length is short of what the file proves, and the file
 * ends in a cut-off ADTS frame (`adts.tailBytes`), it switches once to a
 * copy of the whole frames that `makeCopy` writes in the cache, and reads
 * that instead. The stored recording is only ever read. If the length still
 * cannot be trusted, the run is refused with `RunInputError('decoder_short')`:
 * the take waits for its words, visibly (Try again, or type), instead of
 * getting a raw transcript without its end, which could never be fixed.
 *
 * An ADTS file with a break inside is refused before anything is read
 * (`RunInputError('break_inside')`), and no copy is made: the frames after
 * the break cannot be counted, so no decoder length can be checked, and a
 * copy would hold only what comes before the break.
 */
export async function openRecordingForRun(
  io: RecordingIo,
  uri: string,
  storedMs: number | null | undefined,
  adts: AdtsFacts | null,
  makeCopy: () => Promise<WholeFrameCopy>,
): Promise<OpenRun> {
  if (adts?.breakInside) throw new RunInputError('break_inside');
  let current = uri;
  let copy: WholeFrameCopy | null = null;
  let copyTried = false;
  const close = () => {
    try {
      copy?.remove();
    } catch {
      // the cache is cleared by iOS too; the launch sweep removes stale copies
    }
    copy = null;
  };
  const useCopy = async (): Promise<boolean> => {
    if (copyTried || !adts || adts.tailBytes <= 0) return false;
    copyTried = true;
    copy = await makeCopy();
    current = copy.uri;
    return true;
  };
  const probe = async (): Promise<number | null> => {
    try {
      return await io.probeMs(current);
    } catch (e) {
      if (await useCopy()) return io.probeMs(current);
      throw e;
    }
  };
  try {
    let length = checkedRunDuration(await probe(), storedMs, adts?.evidence ?? null);
    if (length.decoderShort && (await useCopy())) length = checkedRunDuration(await probe(), storedMs, adts?.evidence ?? null);
    if (length.decoderShort) throw new RunInputError('decoder_short');
    return {
      durationMs: length.durationMs,
      decode: async (pieces) => {
        try {
          return await io.decode(current, pieces);
        } catch (e) {
          if (await useCopy()) return io.decode(current, pieces);
          throw e;
        }
      },
      close,
    };
  } catch (e) {
    close();
    throw e;
  }
}

/** What the device does for the voice detector. */
export interface SpeechIo {
  /** 16 kHz mono PCM16 of [startMs, endMs) of the recording, in memory (LEGAL-REQ-018). */
  decodeWindow(startMs: number, endMs: number): Promise<ArrayBuffer>;
  /** Speech segments in centiseconds of that window (whisper.rn `detectSpeechData`, whisper.cpp VAD). */
  detectSpeech(pcm: ArrayBuffer): Promise<ReadonlyArray<{ t0: number; t1: number }>>;
}

/**
 * Speech spans of the whole recording, from VAD over 5-minute windows. A
 * window with nothing loud enough to be anyone talking skips VAD
 * (transcribe-energy.ts). Spans cut by a window edge are joined again.
 */
export async function findSpeech(durationMs: number, io: SpeechIo, check: () => void = () => {}): Promise<SpeechSpan[]> {
  const windows = vadWindows(durationMs);
  const spans: SpeechSpan[] = [];
  for (const w of windows) {
    check();
    const pcm = await io.decodeWindow(w.startMs, w.endMs);
    if (isNearSilent(new Int16Array(pcm))) continue;
    const segments = await io.detectSpeech(pcm);
    for (const s of segments) spans.push({ startMs: w.startMs + s.t0 * 10, endMs: w.startMs + s.t1 * 10 });
  }
  return joinAtBoundaries(
    spans,
    windows.slice(1).map((w) => w.startMs),
  );
}

/** Decodes one chunk at a temperature (0 first; LOOP_RETRY_TEMPERATURE for the retry). */
export type ChunkDecoder = (chunk: Chunk, temperature: number) => Promise<ChunkDecode>;

export interface ChunkRunOptions {
  /** The language's prompt seed, so an echo of it is recognised and dropped. */
  seed: string;
  /** The dictionary line of the prompt ("Asha, Ashu, Papa."), for the name-list echo check. */
  nameList: string;
  /** Throws to stop between steps (abort). */
  check?: () => void;
  /** Chunks done so far and the total, before each chunk and once at the end. */
  onProgress?: (done: number, total: number) => void;
}

/**
 * Decodes every chunk of the plan in order and joins what was heard. Each
 * chunk keeps only speech: non-speech tags, an echo of the seed and an echo
 * of the name list are dropped and counted in `meta`. A chunk that loops is
 * decoded once more at a higher temperature and kept, flagged, if it still
 * repeats (it may be real: "bye bye bye bye").
 */
export async function transcribeChunks(
  plan: readonly Chunk[],
  decode: ChunkDecoder,
  o: ChunkRunOptions,
  meta: Pick<SttMeta, 'chunks' | 'dropped' | 'flags'>,
): Promise<{ raw: string; words: Word[] }> {
  const check = o.check ?? (() => {});
  const texts: string[] = [];
  const words: Word[] = [];
  for (const chunk of plan) {
    check();
    o.onProgress?.(chunk.index, plan.length);

    let used = chunk;
    let piece = chunkText(used, await decode(used, 0));
    check();
    if (piece.redecodeWithoutOverlap) {
      used = withoutOverlap(chunk);
      piece = chunkText(used, await decode(used, 0));
      check();
    }
    if (looksLikeLoop(piece.text, chunk.speechMs)) {
      const again = chunkText(used, await decode(used, LOOP_RETRY_TEMPERATURE));
      check();
      if (!again.redecodeWithoutOverlap && !looksLikeLoop(again.text, chunk.speechMs)) piece = again;
      else meta.flags.push({ chunk: chunk.index, reason: 'repetition_loop' });
    }

    let text = speechOnly(piece.text);
    let changed = text !== collapseSpaces(piece.text);
    if (changed) meta.dropped.push({ chunk: chunk.index, reason: 'non_speech_tag' });
    const echo = stripPromptEcho(text, o.seed);
    if (echo.echoed) {
      text = echo.text;
      changed = true;
      meta.dropped.push({ chunk: chunk.index, reason: 'prompt_echo' });
    }
    if (isDictionaryEcho(text, o.nameList)) {
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
  o.onProgress?.(plan.length, plan.length);
  return { raw: joinChunks(texts), words };
}
