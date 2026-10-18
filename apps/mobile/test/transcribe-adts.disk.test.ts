/// <reference types="node" />
/**
 * The real transcription job (transcribe-whisper.ts) on recordings laid out as the phone has them
 * (ADR 0027), with only the native parts faked: ScribeAudio's decoder and whisper.rn. The decoder fake
 * behaves as Core Audio is expected to on ADTS (length from the whole frames, priming trimmed), and can
 * be told to fail on a frame a kill cut off, the case V3 measures on a device.
 *
 * What these hold, from review Y's re-check of #213:
 * - the length saved at capture (the recorder's clock) never refuses a run: a killed take with a progress
 *   mark past its frames transcribes over its frames, and an M4A short of the clock transcribes as on
 *   develop;
 * - a file that breaks before its end is refused, with no copy made;
 * - the temporary whole-frame copy never outlives an erase, mid-run included, and the queue removes any
 *   copy left from a killed run when it starts (privacy, #207 "erase removes every copy").
 * Fictional Asha family only; no real audio, frames built in the test.
 */
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SqlDb } from '../src/lib/db/sql';
import { createDisk, iosContainer, layOutApp, put, recorderDir, type Disk } from './helpers/expo-fs-standin';
import { nodeDb } from './helpers/node-db';
import { letter } from './helpers/store-fixture';

const h = vi.hoisted(() => ({
  disk: null as unknown as Disk,
  /** M4A lengths the fake decoder reports, by file name (an M4A's length is in its index). */
  m4aMs: new Map<string, number>(),
  /** Core Audio might throw on a partial last ADTS frame (V3 finds out); some tests say it does. */
  failsOnCutFrame: false,
  /** Past damage, Core Audio might stop silently (the default here) or read on to the frames after it (V3). */
  readsPastDamage: false,
  /** Runs once, inside the first decode: something the person does while the words are being written. */
  duringDecode: null as null | (() => void),
  probed: [] as string[],
  windows: [] as { uri: string; endMs: number }[],
}));

vi.mock('expo-file-system', async () => (await import('./helpers/expo-fs-standin')).expoFileSystem(() => h.disk));
vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  AppState: { currentState: 'active', addEventListener: () => ({ remove() {} }) },
}));
vi.mock('expo-crypto', async () => {
  const { createHash: hash } = await import('node:crypto');
  return {
    getRandomBytes: (n: number) => new Uint8Array(n).fill(7),
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digest: async (_alg: string, data: Uint8Array) => new Uint8Array(hash('sha256').update(data).digest()).buffer,
  };
});
vi.mock('expo-audio', () => ({ AudioQuality: { HIGH: 96 }, IOSOutputFormat: { MPEG4AAC: 'aac ' }, setAudioModeAsync: async () => {} }));
vi.mock('expo-sqlite', () => ({
  get defaultDatabaseDirectory() {
    return `${h.disk.documents.replace(/^file:\/\//, '')}SQLite`;
  },
}));
vi.mock('../src/lib/db/repos/open-native', () => ({
  openNativeDb: () => {
    throw new Error('native open must not be used in tests');
  },
}));
// Listening copies live in Application Support (audio-enhance); not under test here.
vi.mock('../src/lib/audio-enhance', () => ({ removeListeningCopy: () => {}, copyForLetter: async () => {} }));
vi.mock('../src/lib/analytics/track', () => ({ trackTranscriptionCompleted: () => {} }));
// The queue names the author's languages through src/lib/language, which reaches the pack system (native).
vi.mock('../src/lib/language', () => ({ getSpokenLanguages: () => ({ languages: [] }) }));
vi.mock('../src/lib/models/speech-consent', () => ({ migrateSpeechConsent: () => {}, setSpeechDownloadChoice: () => {}, speechAutoStartAllowed: () => false }));
vi.mock('../src/lib/models/speech-packs', () => ({
  installedPathsFor: () => ({ asr: '/models/asr', vad: '/models/vad', asrId: 'whisper-base' }),
  bindSpeechPacks: () => {},
  combineProgress: () => null,
  ensureSpeechFor: async () => {},
  onSpeechPacksBound: () => () => {},
  planFor: () => ({ asr: {}, packs: [] }),
  recordMemoryFailure: () => {},
  speechPackHost: () => ({ onProgress: () => () => {}, addLanguageResolver: () => () => {}, packPath: () => null }),
  speechPacksForLanguage: () => [],
}));
vi.mock('../src/lib/models/whisper-runtime', () => ({
  whisperModule: () => ({}),
  releaseContexts: async () => {},
  releaseContextsLater: () => {},
  acquireContexts: async () => ({
    // Speech everywhere it is loud: one segment over the whole window (centiseconds; 16 kHz PCM16).
    vad: { detectSpeechData: async (pcm: ArrayBuffer) => [{ t0: 0, t1: Math.floor(pcm.byteLength / 2 / 160) }] },
    asr: { transcribeData: () => ({ promise: Promise.resolve({ result: 'Asha, you laughed at the rain today.', segments: [], isAborted: false }), stop: async () => {} }) },
  }),
}));
vi.mock('../modules/scribe-audio', async () => {
  const { scanAdts } = await import('../src/lib/capture/adts');
  const missing = () => Object.assign(new Error('missing'), { code: 'ERR_SCRIBE_AUDIO_FILE_MISSING' });
  const lengthOf = (uri: string): number => {
    const file = h.disk.files.get(uri);
    if (!file) throw missing();
    if (!uri.endsWith('.aac')) {
      const ms = h.m4aMs.get(uri.slice(uri.lastIndexOf('/') + 1));
      if (ms === undefined) throw Object.assign(new Error('decode'), { code: 'ERR_SCRIBE_AUDIO_DECODE' });
      return ms;
    }
    const scan = scanAdts(file.data);
    if (!scan || (h.failsOnCutFrame && scan.tailBytes > 0)) throw Object.assign(new Error('decode'), { code: 'ERR_SCRIBE_AUDIO_DECODE' });
    const frames = scan.frames + (h.readsPastDamage ? ((scan as { framesAfterBreak?: number }).framesAfterBreak ?? 0) : 0);
    return ((frames * 1024 - 2112) / 48000) * 1000; // Apple's assumed priming trimmed (TN2258)
  };
  return {
    ScribeAudio: {
      probe: async (uri: string) => {
        h.probed.push(uri);
        return { durationMs: lengthOf(uri), sampleRate: 48000, channels: 1 };
      },
      decodePcm16: async (uri: string, pieces: { srcStartMs: number; srcEndMs: number; silenceBeforeMs: number }[]) => {
        const during = h.duringDecode;
        h.duringDecode = null;
        during?.();
        const length = lengthOf(uri);
        h.windows.push({ uri, endMs: Math.max(...pieces.map((p) => p.srcEndMs)) });
        const ms = pieces.reduce((n, p) => n + p.silenceBeforeMs + Math.max(0, Math.min(p.srcEndMs, length) - p.srcStartMs), 0);
        return new Int16Array(Math.round(ms * 16)).fill(3000).buffer; // loud enough to be someone talking
      },
    },
  };
});

/** One ADTS frame for AAC-LC, 48 kHz, mono: a 7-byte header, then `payload` bytes. */
function adtsFrame(payload: number): Uint8Array {
  const len = 7 + payload;
  const b = new Uint8Array(len);
  b.set([0xff, 0xf1, (1 << 6) | (3 << 2), (1 << 6) | ((len >> 11) & 3), (len >> 3) & 0xff, ((len & 7) << 5) | 0x1f, 0xfc]);
  for (let i = 7; i < len; i++) b[i] = (i * 7 + payload) & 0xff;
  return b;
}
const concat = (...parts: Uint8Array[]) => {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
};
const stream = (frames: number) => concat(...Array.from({ length: frames }, (_, i) => adtsFrame(160 + (i % 5))));
const framesMs = (frames: number) => ((frames * 1024) / 48000) * 1000;
const sha256 = (data: Uint8Array) => createHash('sha256').update(data).digest('hex');

const T0 = Date.parse('2026-10-03T09:00:00.000Z');
const ASHA_DISK = iosContainer('B81D7E44-NEW0-4A7F-8C21-ASHA00000027');
let db: SqlDb;
let closeDb: () => void = () => {};
let seq = 0;

const copiesInCaches = () => [...h.disk.files.keys()].filter((u) => u.startsWith(`${h.disk.caches}whole-frames-`));
const takeAt = (name: string, data: Uint8Array) => put(h.disk, `${recorderDir(h.disk)}/${name}`, data);

async function launch() {
  vi.resetModules();
  const store = await import('../src/lib/store');
  const opened = store.openStore({
    open: () => ({ db, close: () => {} }),
    now: () => new Date().toISOString(),
    newId: () => `0199a5b0-0000-7000-8000-${String(++seq).padStart(12, '0')}`,
  });
  expect(opened.ok).toBe(true);
  const { createWhisperTranscriber } = await import('../src/lib/transcribe-whisper');
  const { jobFailureOf } = await import('../src/lib/transcription-queue/machine');
  const erase = await import('../src/lib/capture/erase');
  return { store, whisper: createWhisperTranscriber(), jobFailureOf, erase };
}
type App = Awaited<ReturnType<typeof launch>>;

const transcribe = (app: App, audioUri: string, durationMs: number | null) => app.whisper.transcribe({ audioUri, durationMs, dictionary: [], language: 'en' });

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  seq = 0;
  h.disk = createDisk(ASHA_DISK);
  layOutApp(h.disk);
  h.m4aMs = new Map();
  h.failsOnCutFrame = false;
  h.readsPastDamage = false;
  h.duringDecode = null;
  h.probed = [];
  h.windows = [];
  const n = nodeDb();
  db = n.db;
  closeDb = n.close;
});
afterEach(() => {
  vi.useRealTimers();
  closeDb();
});

describe('[ADR 0027] the length saved at capture never refuses the transcription job', () => {
  it.each([
    ['reads the cut-off frame', false],
    ['fails on the cut-off frame, so the copy is read', true],
  ])('[review Y repro 1] a killed ADTS take, 57.49 s of frames against its 60 s progress mark, transcribes over its frames (decoder %s)', async (_name, fails) => {
    const app = await launch();
    h.failsOnCutFrame = fails;
    const killed = concat(stream(2695), adtsFrame(160).subarray(0, 40)); // a kill cut the last frame
    const uri = takeAt('recording-5D2E0F11-0000-4000-8000-0000000057A9.aac', killed);
    const res = await transcribe(app, uri, 60_000);
    expect(res.outcome).toBe('ok');
    expect(res.raw).toContain('Asha');
    // The voice-activity pass covered every whole frame, and no more: the plan is the file, not the clock.
    expect(h.windows[0].endMs).toBeCloseTo(framesMs(2695), 6);
    expect(h.windows.every((w) => w.uri === (fails ? h.windows[0].uri : uri))).toBe(true);
    expect(copiesInCaches()).toEqual([]);
    expect(sha256(h.disk.files.get(uri)!.data)).toBe(sha256(killed)); // the recording is only read
  });

  it('[review Y repro 2] a finished M4A whose decoder reads 2.5 s short of the recorder\'s clock transcribes over the decoder\'s length, as on develop', async () => {
    const app = await launch();
    const uri = takeAt('recording-5D2E0F11-0000-4000-8000-0000000057B0.m4a', new Uint8Array(4000));
    h.m4aMs.set('recording-5D2E0F11-0000-4000-8000-0000000057B0.m4a', 57_500);
    const res = await transcribe(app, uri, 60_000);
    expect(res.outcome).toBe('ok');
    expect(h.windows[0]).toEqual({ uri, endMs: 57_500 });
    expect(h.probed).toEqual([uri]);
    expect(copiesInCaches()).toEqual([]);
  });

  it('a file that breaks before its end (a bad header with more than 8191 bytes after it) is refused, with no copy made and nothing decoded', async () => {
    const app = await launch();
    h.failsOnCutFrame = true;
    const broken = concat(stream(400), new Uint8Array([0xff, 0x00, 0x12, 0x34, 0x56, 0x78, 0x9a]), stream(60));
    const uri = takeAt('recording-5D2E0F11-0000-4000-8000-0000000057B1.aac', broken);
    const refused = await transcribe(app, uri, 9_000).catch((e: unknown) => e);
    expect(refused).toMatchObject({ name: 'RunInputError', reason: 'break_inside' });
    expect(app.jobFailureOf(refused)).toBe('decode_failed'); // Try again, or type: visible, and the take waits
    expect(h.probed).toEqual([]);
    expect(h.windows).toEqual([]);
    expect(copiesInCaches()).toEqual([]);
    expect(sha256(h.disk.files.get(uri)!.data)).toBe(sha256(broken));
  });
  it('[review Y] damage inside the last 8 kB (not a kill cut) is refused when the decoder fails on it: no copy of the frames before it, nothing decoded', async () => {
    const app = await launch();
    h.failsOnCutFrame = true;
    const damaged = stream(400);
    // stream() frames are 7 + 160 + (i % 5) bytes long: zero the sync byte of the frame 20 from the end.
    damaged[Array.from({ length: 380 }, (_, i) => 167 + (i % 5)).reduce((n, len) => n + len, 0)] = 0x00;
    const uri = takeAt('recording-5D2E0F11-0000-4000-8000-0000000057B2.aac', damaged);
    const refused = await transcribe(app, uri, 9_000).catch((e: unknown) => e);
    expect(refused).toMatchObject({ name: 'RunInputError', reason: 'break_inside' });
    expect(app.jobFailureOf(refused)).toBe('decode_failed');
    expect(h.windows).toEqual([]);
    expect(copiesInCaches()).toEqual([]);
    expect(sha256(h.disk.files.get(uri)!.data)).toBe(sha256(damaged));
  });
  it('[review Y on #219] damage inside the last 8 kB that the decoder stops at without an error is refused: the frames after it are counted, so the decoder reads short', async () => {
    const app = await launch();
    const damaged = stream(400);
    damaged[Array.from({ length: 380 }, (_, i) => 167 + (i % 5)).reduce((n, len) => n + len, 0)] = 0x00; // sync byte, 20 frames from the end
    const uri = takeAt('recording-5D2E0F11-0000-4000-8000-0000000057B3.aac', damaged);
    const refused = await transcribe(app, uri, 9_000).catch((e: unknown) => e);
    expect(refused).toMatchObject({ name: 'RunInputError', reason: 'break_inside' });
    expect(app.jobFailureOf(refused)).toBe('decode_failed');
    expect(h.probed).toEqual([uri]);
    expect(h.windows).toEqual([]);
    expect(copiesInCaches()).toEqual([]);
  });

  it('[review Y on #219] the same damaged take transcribes over every frame the file proves when the decoder reads past the damage', async () => {
    const app = await launch();
    h.readsPastDamage = true;
    const damaged = stream(400);
    damaged[Array.from({ length: 380 }, (_, i) => 167 + (i % 5)).reduce((n, len) => n + len, 0)] = 0x00;
    const uri = takeAt('recording-5D2E0F11-0000-4000-8000-0000000057B4.aac', damaged);
    const res = await transcribe(app, uri, 9_000);
    expect(res.outcome).toBe('ok');
    expect(h.windows[0].endMs).toBeCloseTo(framesMs(399), 6); // 380 before the damage, 19 after it
    expect(copiesInCaches()).toEqual([]);
  });
});

describe('[ADR 0027, privacy] the whole-frame copy never outlives an erase', () => {
  it('erasing a letter while its words are being written removes the recording and its copy, mid-run; the run ends with no copy left', async () => {
    const app = await launch();
    const asha = app.store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    h.failsOnCutFrame = true; // the run reads a copy of the whole frames
    const uri = takeAt('recording-5D2E0F11-0000-4000-8000-0000000057C0.aac', concat(stream(300), adtsFrame(160).subarray(0, 40)));
    const id = '0199a5b0-0000-7000-8000-00000000e027';
    app.store.saveEntry(letter({ id, childId: asha, audioUri: uri, rawTranscript: '', machineEdits: [], finalText: '', transcriptStatus: 'waiting' }));
    app.store.deleteEntry(id);

    let copiesWhenErased: string[] = [];
    h.duringDecode = () => {
      copiesWhenErased = copiesInCaches();
      expect(app.erase.eraseDeletedLetter(id)).toBe(true); // Erase now, from the shelf
      expect(copiesInCaches()).toEqual([]);
    };
    const ended = await transcribe(app, uri, 6_000).catch((e: unknown) => e);
    expect(copiesWhenErased).toHaveLength(1); // the run was reading a copy when the letter was erased
    expect(app.jobFailureOf(ended)).toBe('file_missing'); // the run stops; no words for an erased letter
    expect(copiesInCaches()).toEqual([]);
    expect(h.disk.files.has(uri)).toBe(false);
    expect(app.store.listDeleted()).toEqual([]);
  });

  it('the 30 day purge removes a copy a killed run left for the letter it erases, and leaves copies of other recordings to their own clean-up', async () => {
    const app = await launch();
    const asha = app.store.addChild({ name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama' }).id;
    const uri = takeAt('recording-5D2E0F11-0000-4000-8000-0000000057C1.aac', stream(50));
    const other = takeAt('recording-5D2E0F11-0000-4000-8000-0000000057C2.aac', stream(50));
    const { copyKeyOf } = await import('../src/lib/capture/adts-file');
    const leftover = put(h.disk, `${h.disk.caches}whole-frames-${copyKeyOf(uri)}-kill.aac`, 300, T0 - 60_000);
    const othersCopy = put(h.disk, `${h.disk.caches}whole-frames-${copyKeyOf(other)}-kill.aac`, 300, T0 - 60_000);
    const id = '0199a5b0-0000-7000-8000-00000000e028';
    app.store.saveEntry(letter({ id, childId: asha, audioUri: uri }));
    app.store.deleteEntry(id);
    vi.setSystemTime(T0 + 30 * 24 * 60 * 60 * 1000 + 60_000);
    expect(app.erase.purgeShelfAtLaunch()).toBe(1);
    expect(h.disk.files.has(leftover)).toBe(false);
    expect(h.disk.files.has(uri)).toBe(false);
    expect(h.disk.files.has(othersCopy)).toBe(true);
    expect(h.disk.files.has(other)).toBe(true);
  });

  it('the transcription queue removes every copy a killed run left when it starts, before its first job', async () => {
    await launch();
    const fresh = put(h.disk, `${h.disk.caches}whole-frames-0a1b2c3d-kill.aac`, 300, T0 - 60_000); // the launch sweep keeps it for an hour
    const notACopy = put(h.disk, `${h.disk.caches}exports-keep.zip`, 10, T0 - 60_000);
    const queue = await import('../src/lib/transcription-queue');
    const stop = queue.startTranscriptionQueue();
    try {
      expect(h.disk.files.has(fresh)).toBe(false);
      expect(h.disk.files.has(notACopy)).toBe(true);
    } finally {
      stop();
    }
  });
});
