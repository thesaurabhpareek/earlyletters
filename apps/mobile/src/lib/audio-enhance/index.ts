/**
 * Clearer listening copies (founder decision 8, ADR 0015).
 *
 * The original recording is never altered: it is only read. A listening
 * copy is a second file, Application Support/listening/<letter id>.m4a,
 * made with Apple's system voice isolation (AUSoundIsolation, iOS 16 and
 * later) through the ScribeAudio module. The person can always hear the
 * original; the copy is an extra, offered where it helps (a fan, a
 * white-noise machine).
 *
 * - Made on request (the player asks), one at a time, with progress and
 *   cancel. Never in the background, never at launch.
 * - Excluded from device backup (it can always be made again) and never
 *   uploaded or exported (the original is what export carries).
 * - Classification: L4, derived from the voice (rule 2, DATA_CLASSIFICATION);
 *   deleted with its letter. Requests to the store and export owners are in
 *   the speech engineer's report.
 * - `mix` below 100 keeps a little of the room, so a baby's laugh in the
 *   background is softened, not erased (E: tuned by ear on the corpus).
 * - Each copy has a sidecar `<id>.json` with the SHA-256 of the original it
 *   was made from, so the player never plays a copy of a different take
 *   (contract in src/lib/player/listening.ts). Boot wiring: call
 *   `startListeningCopies()` once (it registers `listeningCopyLookup` with
 *   the player and removes copies whose letter is gone).
 * - Who makes them: the transcription queue, for each recording after its
 *   words, only while the app is open and the queue is idle
 *   (`copyForLetter`). The player can also ask with `makeListeningCopy`.
 */
import { Directory, File } from 'expo-file-system';
import { ScribeAudio, scribeAudioErrorCode } from '../../../modules/scribe-audio';
import { provideListeningCopies, type ListeningCopy } from '../player';
import { getDraft, getEntry } from '../store';

/** What made the copy (player contract; never shown, never logged). */
export const LISTENING_METHOD = 'apple-sound-isolation';

export const DEFAULT_MIX = 80;

export function listeningCopiesSupported(): boolean {
  try {
    return !!ScribeAudio && ScribeAudio.isIsolationAvailable();
  } catch {
    return false;
  }
}

/** Safe file name for a letter id (ids are UUIDv7; anything else is reduced to word characters). */
export function listeningFileName(id: string): string {
  return `${id.replace(/[^A-Za-z0-9_-]/g, '_')}.m4a`;
}

function listeningFile(id: string, ext: 'm4a' | 'json' = 'm4a'): File | null {
  if (!ScribeAudio) return null;
  try {
    const dir = ScribeAudio.listeningDirectory();
    const name = ext === 'm4a' ? listeningFileName(id) : listeningFileName(id).replace(/\.m4a$/, '.json');
    return dir ? new File(dir, name) : null;
  } catch {
    return null;
  }
}

interface Sidecar {
  v: 1;
  sourceSha256: string;
  method: string;
  durationMs: number | null;
  mix: number;
}

/**
 * The player's lookup (synchronous, local files only): the copy for a
 * letter with the hash of the original it was made from, or null.
 */
export function listeningCopyLookup(entryId: string): ListeningCopy | null {
  try {
    const audio = listeningFile(entryId);
    const meta = listeningFile(entryId, 'json');
    if (!audio?.exists || !meta?.exists) return null;
    const side = JSON.parse(meta.textSync()) as Partial<Sidecar>;
    if (side.v !== 1 || typeof side.sourceSha256 !== 'string' || !/^[0-9a-f]{64}$/i.test(side.sourceSha256)) return null;
    return { uri: audio.uri, sourceSha256: side.sourceSha256, method: side.method ?? LISTENING_METHOD, durationMs: side.durationMs ?? null };
  } catch {
    return null;
  }
}

/** Boot wiring (coordinator): registers the lookup with the player and sweeps stale copies. Returns an undo. */
export function startListeningCopies(): () => void {
  provideListeningCopies(listeningCopyLookup);
  sweepListeningCopies();
  return () => provideListeningCopies(null);
}

/**
 * Deletes copies whose recording is no longer a draft or a live letter
 * (discarded, deleted, purged). A copy of a deleted letter that is later
 * restored is simply made again. Keeps L4 data from outliving its letter.
 */
export function sweepListeningCopies(): number {
  if (!ScribeAudio) return 0;
  let removed = 0;
  try {
    const dir = ScribeAudio.listeningDirectory();
    if (!dir) return 0;
    for (const item of new Directory(dir).list()) {
      if (!(item instanceof File)) continue;
      const id = item.name.replace(/\.(m4a|json|m4a\.part)$/, '');
      if (getDraft(id) || getEntry(id)) continue;
      try {
        item.delete();
        removed += 1;
      } catch {
        // try again next launch
      }
    }
  } catch {
    // no directory yet
  }
  return removed;
}

/** The recording and its capture hash for a draft or letter, if both exist. */
export function letterSource(id: string): { uri: string; sha256: string } | null {
  const d = getDraft(id);
  const e = d ? null : getEntry(id);
  const uri = d?.audioUri ?? e?.audioUri ?? null;
  const sha = d?.audioSha256 ?? e?.audioSha256 ?? null;
  return uri && sha ? { uri, sha256: sha } : null;
}

/** Makes the copy for one letter if it can and has none yet; never throws. */
export async function copyForLetter(id: string): Promise<void> {
  if (!listeningCopiesSupported()) return;
  const source = letterSource(id);
  if (!source) return;
  await makeListeningCopy(id, source).catch(() => null);
}

/** URI of a finished listening copy, or null. */
export function listeningCopyUri(id: string): string | null {
  const f = listeningFile(id);
  return f?.exists ? f.uri : null;
}

export type ListeningCopyResult = { ok: true; uri: string } | { ok: false; reason: 'unavailable' | 'cancelled' | 'failed' };

let chain: Promise<unknown> = Promise.resolve();
const inFlight = new Map<string, Promise<ListeningCopyResult>>();

/**
 * Makes (or returns) the listening copy for one letter. Joins a run already
 * in progress for the same letter. `sourceSha256` is the letter's
 * `audioSha256` (the original's hash at capture). `onProgress` receives 0 to 1.
 */
export function makeListeningCopy(
  id: string,
  source: { uri: string; sha256: string },
  opts: { mix?: number; onProgress?: (p: number) => void; signal?: AbortSignal } = {},
): Promise<ListeningCopyResult> {
  const existing = listeningCopyLookup(id);
  if (existing && existing.sourceSha256.toLowerCase() === source.sha256.toLowerCase()) return Promise.resolve({ ok: true, uri: existing.uri });
  const sourceUri = source.uri;
  const running = inFlight.get(id);
  if (running) return running;
  const native = ScribeAudio;
  const file = listeningFile(id);
  if (!native || !file || !listeningCopiesSupported()) return Promise.resolve({ ok: false, reason: 'unavailable' });

  const jobId = `${id}:${Date.now()}`;
  const run = async (): Promise<ListeningCopyResult> => {
    if (opts.signal?.aborted) return { ok: false, reason: 'cancelled' };
    const sub = native.addListener('onEnhanceProgress', (e) => {
      if (e.jobId === jobId) opts.onProgress?.(e.progress);
    });
    const onAbort = () => native.cancelEnhance(jobId);
    opts.signal?.addEventListener('abort', onAbort);
    const mix = opts.mix ?? DEFAULT_MIX;
    try {
      const made = await native.enhance(jobId, sourceUri, file.uri, { mix });
      const side: Sidecar = { v: 1, sourceSha256: source.sha256.toLowerCase(), method: LISTENING_METHOD, durationMs: made.durationMs ?? null, mix };
      listeningFile(id, 'json')?.write(JSON.stringify(side));
      return { ok: true, uri: file.uri };
    } catch (e) {
      const code = scribeAudioErrorCode(e);
      if (code === 'ERR_SCRIBE_AUDIO_CANCELLED') return { ok: false, reason: 'cancelled' };
      if (code === 'ERR_SCRIBE_AUDIO_ISOLATION_UNAVAILABLE' || code === 'ERR_SCRIBE_AUDIO_UNSUPPORTED') return { ok: false, reason: 'unavailable' };
      return { ok: false, reason: 'failed' };
    } finally {
      opts.signal?.removeEventListener('abort', onAbort);
      sub.remove();
    }
  };
  const p = chain.then(run, run).finally(() => inFlight.delete(id));
  chain = p.catch(() => {});
  inFlight.set(id, p);
  return p;
}

/** Deletes a letter's listening copy and its sidecar (letter purged, or the parent prefers the original only). */
export function removeListeningCopy(id: string): void {
  for (const ext of ['json', 'm4a'] as const) {
    try {
      const f = listeningFile(id, ext);
      if (f?.exists) f.delete();
    } catch {
      // nothing to remove
    }
  }
}
