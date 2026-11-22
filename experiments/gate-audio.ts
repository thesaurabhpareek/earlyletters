/**
 * The app's transcription run on a Mac (F05 7.1: the gate runs on the
 * shipped model, pack and engine). The steps are the app's own pure code
 * (apps/mobile/src/lib/transcribe-run.ts, transcribe-plan.ts,
 * transcribe-post.ts, transcribe-prompt.ts); only the device parts change:
 *
 *   phone                                  Mac (this file)
 *   ScribeAudio.decodePcm16 (AAC to 16 kHz)  ffmpeg once, then slices of that PCM
 *   whisper.rn detectSpeechData (Silero)     whisper-vad-speech-segments, same model and settings
 *   whisper.rn transcribeData                whisper-cli, greedy, no flash attention, same prompt
 *
 * whisper.cpp must be v1.9.3, the version whisper.rn 0.7.4 bundles
 * (setup.sh pins it; the report checks it). Known difference: whisper-cli
 * merges a character split across tokens, where whisper.rn's one-token
 * segments can split it; the app then re-decodes a seam chunk without its
 * overlap. That only touches chunks cut inside 28 s or more of unbroken
 * speech, and only their token timing.
 *
 * Audio stays on this Mac. Temporary WAV slices are deleted as soon as they
 * are decoded; nothing is sent anywhere. Never logs text.
 */
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ChunkPiece } from '../apps/mobile/src/lib/transcribe-plan';
import { msToSamples, planChunks } from '../apps/mobile/src/lib/transcribe-plan';
import type { ChunkDecode, WhisperSegment } from '../apps/mobile/src/lib/transcribe-post';
import { chunkPrompt, DEFAULT_PROMPT_SEEDS, dictionaryPrompt } from '../apps/mobile/src/lib/transcribe-prompt';
import { toWhisperLanguage } from '../apps/mobile/src/lib/transcribe-language';
import { DECODE_OPTIONS, VAD_OPTIONS, findSpeech, runDurationMs, transcribeChunks, type ChunkDecoder, type SpeechIo } from '../apps/mobile/src/lib/transcribe-run';
import type { DictionaryTerm } from '@scribe/core';
import type { SttMeta } from '../apps/mobile/src/lib/transcribe';
import type { SpeechLanguage } from '../apps/mobile/src/lib/models/catalog';
import { SPECIAL_TOKEN } from './score';

export const SAMPLE_RATE = 16_000;

// ---------------------------------------------------------------------------
// WAV (PCM16 mono): pure
// ---------------------------------------------------------------------------

/** 16 kHz mono PCM16 from a canonical WAV (what ffmpeg writes with -ar 16000 -ac 1 -c:a pcm_s16le). */
export function parseWav(buf: Uint8Array): Int16Array {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const tag = (o: number) => String.fromCharCode(buf[o], buf[o + 1], buf[o + 2], buf[o + 3]);
  if (buf.length < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') throw new Error('wav_invalid');
  let offset = 12;
  let format: { channels: number; rate: number; bits: number; codec: number } | null = null;
  while (offset + 8 <= buf.length) {
    const id = tag(offset);
    const size = view.getUint32(offset + 4, true);
    const body = offset + 8;
    if (id === 'fmt ') {
      format = { codec: view.getUint16(body, true), channels: view.getUint16(body + 2, true), rate: view.getUint32(body + 4, true), bits: view.getUint16(body + 14, true) };
    } else if (id === 'data') {
      if (!format || format.codec !== 1 || format.channels !== 1 || format.rate !== SAMPLE_RATE || format.bits !== 16) throw new Error('wav_not_16k_mono_pcm16');
      const end = Math.min(buf.length, body + size);
      const samples = Math.floor((end - body) / 2);
      const out = new Int16Array(samples);
      for (let i = 0; i < samples; i++) out[i] = view.getInt16(body + i * 2, true);
      return out;
    }
    offset = body + size + (size % 2);
  }
  throw new Error('wav_no_data');
}

export function wavBytes(pcm: Int16Array): Uint8Array {
  const out = new Uint8Array(44 + pcm.length * 2);
  const v = new DataView(out.buffer);
  const put = (o: number, s: string) => {
    for (let i = 0; i < 4; i++) out[o + i] = s.charCodeAt(i);
  };
  put(0, 'RIFF');
  v.setUint32(4, 36 + pcm.length * 2, true);
  put(8, 'WAVE');
  put(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, SAMPLE_RATE, true);
  v.setUint32(28, SAMPLE_RATE * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  put(36, 'data');
  v.setUint32(40, pcm.length * 2, true);
  for (let i = 0; i < pcm.length; i++) v.setInt16(44 + i * 2, pcm[i], true);
  return out;
}

export const durationMsOf = (pcm: Int16Array): number => (pcm.length / SAMPLE_RATE) * 1000;

/** [startMs, endMs) of the recording as a PCM16 buffer: the Mac stand-in for one `decodePcm16` window. */
export function windowPcm(pcm: Int16Array, startMs: number, endMs: number): ArrayBuffer {
  const a = Math.min(pcm.length, msToSamples(startMs));
  const b = Math.min(pcm.length, Math.max(a, msToSamples(endMs)));
  return pcm.slice(a, b).buffer;
}

/**
 * A chunk's audio exactly as ScribeAudio builds it: per piece, `silenceBeforeMs` of zeros, then the piece's
 * samples (count from its length, the same rounding as `chunkSampleCount`), zeros past the end of the file.
 */
export function chunkPcm(pcm: Int16Array, pieces: readonly ChunkPiece[]): ArrayBuffer {
  const counts = pieces.map((p) => ({ silence: msToSamples(p.silenceBeforeMs), speech: msToSamples(p.srcEndMs - p.srcStartMs) }));
  const out = new Int16Array(Math.max(1, counts.reduce((n, c) => n + c.silence + c.speech, 0)));
  let cursor = 0;
  pieces.forEach((p, i) => {
    cursor += counts[i].silence;
    const from = Math.min(pcm.length, msToSamples(p.srcStartMs));
    const part = pcm.subarray(from, Math.min(pcm.length, from + counts[i].speech));
    out.set(part, cursor);
    cursor += counts[i].speech;
  });
  return out.buffer;
}

// ---------------------------------------------------------------------------
// whisper.cpp command lines and output: pure
// ---------------------------------------------------------------------------

const VAD_FLAGS: Record<keyof typeof VAD_OPTIONS, string> = {
  threshold: '-vt',
  minSpeechDurationMs: '-vspd',
  minSilenceDurationMs: '-vsd',
  speechPadMs: '-vp',
  samplesOverlap: '-vo',
};

/** Threads the app gives the voice detector (`initWhisperVad({ nThreads: 2 })`, models/whisper-runtime.ts). */
export const VAD_THREADS = 2;

/** The app's VAD settings as whisper-vad-speech-segments flags. An option the Mac tool cannot take stops the gate. */
export function vadArgs(wav: string, vadModel: string, options: Record<string, number> = VAD_OPTIONS): string[] {
  const args = ['-f', wav, '-vm', vadModel, '-t', String(VAD_THREADS), '-np'];
  for (const [k, v] of Object.entries(options)) {
    const flag = (VAD_FLAGS as Record<string, string>)[k];
    if (!flag) throw new Error(`vad_option_not_mapped: ${k}`);
    args.push(flag, String(v));
  }
  return args;
}

/** "Speech segment 0: start = 29.00, end = 221.00" (centiseconds), as whisper.rn's detectSpeechData returns them. */
export function parseVadSegments(stdout: string): Array<{ t0: number; t1: number }> {
  const out: Array<{ t0: number; t1: number }> = [];
  for (const m of stdout.matchAll(/Speech segment \d+: start = ([\d.]+), end = ([\d.]+)/g)) {
    const t0 = Number(m[1]);
    const t1 = Number(m[2]);
    if (Number.isFinite(t0) && Number.isFinite(t1) && t1 > t0) out.push({ t0, t1 });
  }
  return out;
}

/**
 * whisper-cli flags for one chunk, matching whisper.rn's transcribeData as
 * the app calls it: greedy (whisper.rn has no beam unless asked; the CLI
 * defaults to beam 5), language forced, never translate, never tinydiarize,
 * token times on (-ojf), flash attention off (`useFlashAttn: false`),
 * no_context and the 0.2 temperature fallback as both defaults.
 */
export function whisperArgs(o: { model: string; wav: string; outBase: string; language: string; prompt: string; temperature: number }): string[] {
  if (DECODE_OPTIONS.translate || DECODE_OPTIONS.tdrzEnable) throw new Error('decode_options_changed');
  if (!o.language || o.language === 'auto') throw new Error('language_must_be_set'); // F05-REQ-008
  const args = ['-m', o.model, '-f', o.wav, '-l', o.language, '-bs', '1', '-tp', String(o.temperature), '-nfa', '-ojf', '-of', o.outBase, '-np'];
  if (o.prompt) args.push('--prompt', o.prompt);
  return args;
}

interface CliToken {
  text: string;
  offsets?: { from: number; to: number };
}
interface CliJson {
  transcription: Array<{ text: string; tokens?: CliToken[] }>;
}

/** whisper-cli JSON (full) to the shape whisper.rn returns: the joined text, and one timed segment per token (centiseconds). */
export function parseWhisperJson(text: string): ChunkDecode {
  let json: CliJson;
  try {
    json = JSON.parse(text) as CliJson;
  } catch {
    throw new Error('whisper_json_unreadable'); // JSON.parse quotes the text near the error: heard words stay out of messages
  }
  const segments: WhisperSegment[] = [];
  for (const seg of json.transcription ?? []) {
    for (const t of seg.tokens ?? []) {
      if (!t.text || SPECIAL_TOKEN.test(t.text) || !t.offsets) continue;
      segments.push({ text: t.text, t0: t.offsets.from / 10, t1: t.offsets.to / 10 });
    }
  }
  return { result: (json.transcription ?? []).map((s) => s.text).join(''), segments };
}

// ---------------------------------------------------------------------------
// Running it (side effects)
// ---------------------------------------------------------------------------

/**
 * A tool that failed, by name and exit status only. Never the command line or its output: the command line
 * holds the prompt (the child's name and the family's words) and the output can hold heard words.
 */
export class ToolFailed extends Error {
  constructor(
    readonly tool: string,
    readonly status: number | string | null,
  ) {
    super(`${tool}_failed: exit ${status ?? 'unknown'}`);
    this.name = 'ToolFailed';
  }
}

/**
 * What a gate failure may print: tool failures (name and exit status) and this kit's own code-style messages
 * (`duration_invalid`, `wav_invalid`). Anything else could carry a transcript or a family name (a parse error
 * quotes the text near the mistake), so only its type is shown, unless the person asks with --debug.
 */
export function safeErrorMessage(e: unknown, debug = false): string {
  if (debug) return e instanceof Error ? (e.stack ?? e.message) : String(e);
  if (e instanceof ToolFailed) return e.message;
  const m = e instanceof Error ? e.message : '';
  if (/^[a-z][a-z0-9]*(?:_[a-z0-9]+)+(?:: [\w .,:/@-]{0,160})?$/.test(m)) return m; // codes always hold an underscore
  return `${e instanceof Error ? e.name : typeof e} (run again with --debug to see the full message; it may contain your words)`;
}

/** Runs a tool and returns its standard output; a failure becomes a ToolFailed with no argument or output text in it. */
export function runTool(tool: string, file: string, args: readonly string[], opts: { stdout?: boolean } = {}): string {
  try {
    const out = execFileSync(file, args, { encoding: 'utf8', stdio: ['ignore', opts.stdout ? 'pipe' : 'ignore', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
    return typeof out === 'string' ? out : '';
  } catch (e) {
    const err = e as { status?: number | null; code?: unknown; signal?: unknown };
    const status = typeof err.status === 'number' ? err.status : typeof err.signal === 'string' ? err.signal : typeof err.code === 'string' ? err.code : null;
    throw new ToolFailed(tool, status);
  }
}

export interface MacTools {
  whisperCli: string;
  vadTool: string;
  ffmpeg: string;
}

export function toWav16(tools: MacTools, src: string, out: string): void {
  runTool('ffmpeg', tools.ffmpeg, ['-y', '-loglevel', 'error', '-i', src, '-ar', String(SAMPLE_RATE), '-ac', '1', '-c:a', 'pcm_s16le', out]);
}

export interface FileRun {
  raw: string;
  seconds: number;
  loops: number;
}

/** One recording through the app's run with whisper.cpp. `workDir` holds temporary slices only. */
export async function transcribeWav(o: {
  tools: MacTools;
  wav: string;
  workDir: string;
  model: string;
  vadModel: string;
  language: SpeechLanguage;
  dictionary: DictionaryTerm[];
}): Promise<FileRun> {
  const started = Date.now();
  mkdirSync(o.workDir, { recursive: true });
  const pcm = parseWav(readFileSync(o.wav));
  const durationMs = runDurationMs(durationMsOf(pcm), null);
  let n = 0;
  const slice = (buf: ArrayBuffer) => {
    const path = join(o.workDir, `slice-${n++}.wav`);
    writeFileSync(path, wavBytes(new Int16Array(buf)));
    return path;
  };
  const io: SpeechIo = {
    decodeWindow: async (startMs, endMs) => windowPcm(pcm, startMs, endMs),
    detectSpeech: async (buf) => {
      const path = slice(buf);
      try {
        return parseVadSegments(runTool('vad_tool', o.tools.vadTool, vadArgs(path, o.vadModel), { stdout: true }));
      } finally {
        rmSync(path, { force: true });
      }
    },
  };
  const spans = await findSpeech(durationMs, io);
  const plan = planChunks(spans, durationMs);
  if (!plan.length) return { raw: '', seconds: (Date.now() - started) / 1000, loops: 0 };

  const language = toWhisperLanguage(o.language);
  const prompt = chunkPrompt(o.dictionary, o.language);
  const decode: ChunkDecoder = async (chunk, temperature) => {
    const path = slice(chunkPcm(pcm, chunk.pieces));
    const outBase = path.replace(/\.wav$/, '');
    try {
      runTool('whisper_cli', o.tools.whisperCli, whisperArgs({ model: o.model, wav: path, outBase, language, prompt, temperature }));
      return parseWhisperJson(readFileSync(`${outBase}.json`, 'utf8'));
    } finally {
      rmSync(path, { force: true });
      rmSync(`${outBase}.json`, { force: true });
    }
  };
  const meta: Pick<SttMeta, 'chunks' | 'dropped' | 'flags'> = { chunks: [], dropped: [], flags: [] };
  const { raw } = await transcribeChunks(plan, decode, { seed: DEFAULT_PROMPT_SEEDS[o.language] ?? '', nameList: dictionaryPrompt(o.dictionary) }, meta);
  return { raw, seconds: (Date.now() - started) / 1000, loops: meta.flags.length };
}
