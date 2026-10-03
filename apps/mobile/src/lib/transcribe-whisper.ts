/**
 * whisper.rn adapter (ADR 0001). Requires a development build: whisper.rn is
 * a native module and is not in Expo Go. The module is required lazily so
 * Expo Go never touches it.
 *
 * Model: ggml file downloaded on first run (not bundled) to Application
 * Support/models/<MODEL_FILE>, excluded from iCloud backup (ADR 0001,
 * lib/model-files.ts; Documents/models where the native module is absent).
 * Download, SHA-256 check and Wi-Fi rules are a separate task (BL-065);
 * until the file exists, availability() says 'model-missing'.
 *
 * Audio: whisper.rn reads 16 kHz WAV or raw PCM only. We record AAC M4A
 * (ADR 0005) and must decode on the fly without storing the PCM copy. That
 * decoder (AVAudioFile/AVAudioConverter in a small Expo module, or a parallel
 * expo-audio AudioStream capture at 16 kHz) is not built yet, so M4A input
 * reports 'decoder-missing'. WAV input works as-is.
 */
import { Directory, File, Paths } from 'expo-file-system';
import { modelsDirectory } from './model-files';
import type { TranscribeResult as WhisperResult, WhisperContext } from 'whisper.rn/index';
import { dictionaryPrompt, TranscriberUnavailable, type Transcriber, type UnavailableReason } from './transcribe';

export const MODEL_FILE = 'ggml-large-v3-turbo-q5_0.bin';
export const FALLBACK_MODEL_FILE = 'ggml-small-q5_1.bin';

type WhisperModule = typeof import('whisper.rn/index');

function loadModule(): WhisperModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('whisper.rn/index') as WhisperModule;
    // TurboModuleRegistry.get returns null when the native side is absent (Expo Go).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { TurboModuleRegistry } = require('react-native') as typeof import('react-native');
    return TurboModuleRegistry.get('RNWhisper') ? mod : null;
  } catch {
    return null;
  }
}

function modelFile(): File | null {
  // Application Support first; Documents/models is where earlier dev builds put a hand-copied model.
  const dirs = [modelsDirectory().dir, new Directory(Paths.document, 'models')];
  for (const dir of dirs) {
    for (const name of [MODEL_FILE, FALLBACK_MODEL_FILE]) {
      const f = new File(dir, name);
      if (f.exists) return f;
    }
  }
  return null;
}

/** Decodes a recording to 16 kHz mono PCM for Whisper. Not implemented yet (see header). */
async function pcmFor(audioUri: string): Promise<string> {
  if (/\.wav$/i.test(audioUri)) return audioUri;
  throw new TranscriberUnavailable('decoder-missing');
}

let context: Promise<WhisperContext> | null = null;

export function createWhisperTranscriber(): Transcriber {
  return {
    id: 'whisper',
    isSample: false,
    async availability(): Promise<UnavailableReason | null> {
      if (!loadModule()) return 'native-module-missing';
      if (!modelFile()) return 'model-missing';
      // Until the M4A decoder exists, every recording would fail; say so up front.
      return 'decoder-missing';
    },
    async transcribe(input, signal) {
      const mod = loadModule();
      if (!mod) throw new TranscriberUnavailable('native-module-missing');
      const model = modelFile();
      if (!model) throw new TranscriberUnavailable('model-missing');
      const audio = await pcmFor(input.audioUri);
      context ??= mod.initWhisper({ filePath: model.uri });
      const ctx = await context;
      const job = ctx.transcribe(audio, {
        language: input.language ?? 'auto',
        translate: false, // never translate (ADR 0001)
        tokenTimestamps: true,
        prompt: dictionaryPrompt(input.dictionary) || undefined,
      });
      signal?.addEventListener('abort', () => void job.stop());
      const res: WhisperResult = await job.promise;
      return {
        raw: res.result.trim(),
        words: res.segments.map((s) => ({ text: s.text, startMs: s.t0 * 10, endMs: s.t1 * 10 })),
        language: res.language ?? null,
        transcriber: 'whisper',
      };
    },
  };
}
