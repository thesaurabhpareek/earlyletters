// Reads what the app left on disk, from the host: the app's SQLite file (read only) and its audio files.
// The oracle (oracle.mjs) judges a run from this snapshot alone, never from anything the app reports about itself.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileNameOf } from './protocol.mjs';

const DB_FILE = 'scribe.db';
const AUDIO = /\.(m4a|mp4|aac|caf|wav|3gp|webm)$/i;

/** expo-sqlite keeps databases under Documents/SQLite; found by name so a changed default still works. */
export function findDatabase(dataDir, depth = 4) {
  const walk = (dir, left) => {
    let items;
    try {
      items = readdirSync(dir, { withFileTypes: true });
    } catch {
      return null;
    }
    for (const it of items) if (it.isFile() && it.name === DB_FILE) return join(dir, it.name);
    if (left === 0) return null;
    for (const it of items) {
      if (!it.isDirectory()) continue;
      const hit = walk(join(dir, it.name), left - 1);
      if (hit) return hit;
    }
    return null;
  };
  return walk(dataDir, depth);
}

/** Every audio file under Documents, any depth (expo-audio writes takes to Documents/ExpoAudio), by file name. */
function listAudio(documentsDir) {
  const files = new Map();
  const walk = (dir) => {
    let items;
    try {
      items = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const it of items) {
      const p = join(dir, it.name);
      if (it.isDirectory()) walk(p);
      else if (it.isFile() && AUDIO.test(it.name)) {
        const st = statSync(p);
        const list = files.get(it.name) ?? [];
        list.push({ path: p, bytes: st.size, mtimeMs: st.mtimeMs });
        files.set(it.name, list);
      }
    }
  };
  walk(documentsDir);
  return files;
}

const shaCache = new Map();
/** SHA-256 of a file, cached by path, size and time, so a long run does not hash old takes again. */
export function sha256OfFile(path) {
  const st = statSync(path);
  const key = `${path}|${st.size}|${st.mtimeMs}`;
  if (!shaCache.has(key)) shaCache.set(key, createHash('sha256').update(readFileSync(path)).digest('hex'));
  return shaCache.get(key);
}

/**
 * @param {{ dataDir: string, dbPath?: string }} where  the app's data container (`simctl get_app_container ... data`)
 */
export function readSnapshot(where) {
  const dbPath = where.dbPath ?? findDatabase(where.dataDir);
  const documentsDir = join(where.dataDir, 'Documents');
  const files = existsSync(documentsDir) ? listAudio(documentsDir) : new Map();
  if (!dbPath || !existsSync(dbPath)) return { dbPath: null, drafts: [], entries: [], orphans: [], files };
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    const drafts = db
      .prepare('SELECT id, capture_mode, typed_text, raw_transcript, audio_uri, audio_sha256, audio_bytes, state FROM drafts')
      .all()
      .map((r) => ({
        id: r.id,
        captureMode: r.capture_mode,
        typedText: r.typed_text,
        rawTranscript: r.raw_transcript,
        audioFile: r.audio_uri ? fileNameOf(r.audio_uri) : null,
        audioSha256: r.audio_sha256,
        audioBytes: r.audio_bytes,
        state: r.state,
      }));
    const entries = db
      .prepare('SELECT id, kind, raw_transcript, final_text, audio_uri, audio_sha256, deleted_at FROM entries')
      .all()
      .map((r) => ({
        id: r.id,
        kind: r.kind,
        rawTranscript: r.raw_transcript,
        finalText: r.final_text,
        audioFile: r.audio_uri ? fileNameOf(r.audio_uri) : null,
        audioSha256: r.audio_sha256,
        deleted: r.deleted_at !== null,
      }));
    const orphans = db.prepare('SELECT file_name FROM orphan_audio').all().map((r) => r.file_name);
    return { dbPath, drafts, entries, orphans, files };
  } finally {
    db.close();
  }
}
