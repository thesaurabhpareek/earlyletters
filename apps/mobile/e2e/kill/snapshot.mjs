// Reads what the app left on disk, from the host: the app's SQLite file (read only) and its audio files.
// The oracle (oracle.mjs) judges a run from this snapshot alone, never from anything the app reports about itself.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, posix } from 'node:path';
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
    // Sorted, so the order of files that share a name never depends on the file system.
    for (const it of items.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
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

/**
 * The file path a row stores (`audio_uri`, a file:// URI on iOS), so the oracle can check that the row points at
 * the very file the host lists, not only at one of the same name. Spelling is undone, never meaning: `file://`,
 * `file://localhost` and `file:` go, percent-encoding is decoded, and `//`, `./` and `../` are resolved
 * (`normalizePath`). Null when there is no URI.
 */
export function storedPathOf(uri) {
  if (!uri) return null;
  const clean = String(uri).split(/[?#]/)[0];
  const path = clean.replace(/^file:\/\/localhost(?=\/)/i, '').replace(/^file:\/\//i, '').replace(/^file:/i, '');
  let decoded = path;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    // a stray % stays as it is
  }
  return normalizePath(decoded);
}

/** A path with `//`, `./` and `../` resolved (POSIX), and no trailing slash. */
export function normalizePath(p) {
  const n = posix.normalize(String(p));
  return n.length > 1 && n.endsWith('/') ? n.slice(0, -1) : n;
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
  if (!dbPath || !existsSync(dbPath)) return indexed({ dbPath: null, documentsDir, integrity: 'no database file', drafts: [], entries: [], orphans: [], files });
  const db = new DatabaseSync(dbPath, { readOnly: true });
  try {
    // 07 and 06-nfr gate: `PRAGMA integrity_check` must answer ok after every kill.
    const check = db.prepare('PRAGMA integrity_check').all().map((r) => String(Object.values(r)[0]));
    const integrity = check.length === 1 && check[0] === 'ok' ? 'ok' : check.slice(0, 5).join('; ');
    const drafts = db
      .prepare('SELECT id, capture_mode, typed_text, raw_transcript, audio_uri, audio_sha256, audio_bytes, state FROM drafts')
      .all()
      .map((r) => ({
        id: r.id,
        captureMode: r.capture_mode,
        typedText: r.typed_text,
        rawTranscript: r.raw_transcript,
        audioFile: r.audio_uri ? fileNameOf(r.audio_uri) : null,
        audioPath: storedPathOf(r.audio_uri),
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
        audioPath: storedPathOf(r.audio_uri),
        audioSha256: r.audio_sha256,
        deleted: r.deleted_at !== null,
      }));
    const orphans = db.prepare('SELECT file_name FROM orphan_audio').all().map((r) => r.file_name);
    return indexed({ dbPath, documentsDir, integrity, drafts, entries, orphans, files });
  } finally {
    db.close();
  }
}

/** Lookups the oracle needs on every relaunch, built once per snapshot (rows by id, by words, by file). */
function indexed(snap) {
  const add = (map, key, row) => {
    if (key === null || key === undefined || key === '') return;
    const list = map.get(key) ?? [];
    list.push(row);
    map.set(key, list);
  };
  const byId = new Map();
  const byText = new Map();
  const byFile = new Map();
  for (const d of snap.drafts) {
    const row = { table: 'drafts', ...d };
    add(byId, d.id, row);
    for (const t of new Set([d.typedText, d.rawTranscript])) add(byText, t, row);
    add(byFile, d.audioFile, row);
  }
  for (const e of snap.entries) {
    const row = { table: 'entries', ...e };
    add(byId, e.id, row);
    if (e.deleted) continue;
    for (const t of new Set([e.rawTranscript, e.finalText])) add(byText, t, row);
    add(byFile, e.audioFile, row);
  }
  return { ...snap, orphanSet: new Set(snap.orphans), idx: { byId, byText, byFile } };
}
