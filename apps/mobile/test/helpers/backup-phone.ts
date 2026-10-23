/// <reference types="node" />
/**
 * A phone for the backup end-to-end tests: the app's real local database
 * (every migration in src/lib/db/migrations.ts, on node:sqlite), real files
 * in a temp folder, the backup service exactly as runtime.ts builds it, and
 * the Node vault. Fictional family Asha only.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { migrate } from '../../src/lib/db/migrations';
import type { SqlDb } from '../../src/lib/db/sql';
import { openBackupDb, type BackupDb } from '../../src/lib/backup/local-db';
import { backupSource, restoreLocal } from '../../src/lib/backup/local-store';
import type { Conditions, NetworkKind } from '../../src/lib/backup/ports';
import { createBackupService, type BackupView } from '../../src/lib/backup/service';
import { FakeBackend, FakeICloud, fakeM4a, nodeAead, nodeFiles, nodeVault, sha256Hex } from './backup-node';
import { nodeDb } from './node-db';

export interface Clock {
  t: number;
}

const roots: string[] = [];
export function cleanupPhones(): void {
  for (const r of roots.splice(0)) rmSync(r, { recursive: true, force: true });
}

/** What two accounts on one phone share: its files, its letters and its Keychain. */
export interface SharedPhone {
  root: string;
  local: SqlDb;
  files: ReturnType<typeof nodeFiles>;
  vault: ReturnType<typeof nodeVault>;
}

/** The app's one Supabase client: whoever signed in last is the live session, and every call goes under it. */
export interface LiveSession {
  uid: string | null;
  /**
   * Runs as a call is sent (`before`: after the service's check read the session, before the send
   * reads it again, as supabase-js does) and as it answers (`after`), so a test can land a sign-in there.
   */
  onSend?: (name: string, phase: 'before' | 'after') => void;
}

/**
 * An API whose every call is made as `live.uid` at the moment it is sent, read again there, as the
 * shared client does for a request whose token is not set on the request itself (the worst case).
 */
function underLive<T extends object>(forUid: (uid: string) => T, live: LiveSession): T {
  const names = Object.keys(forUid(live.uid ?? '')) as (keyof T & string)[];
  return Object.fromEntries(
    names.map((n) => [
      n,
      async (...a: unknown[]) => {
        live.onSend?.(n, 'before');
        try {
          return await (forUid(live.uid ?? '')[n] as (...x: unknown[]) => Promise<unknown>)(...a);
        } finally {
          live.onSend?.(n, 'after');
        }
      },
    ]),
  ) as T;
}

/**
 * `share`: another account on the same phone (its files, its letters and its Keychain), for the tests
 * that switch accounts; `backupDb`: that account's own backup state (lib/backup/account.ts); `live`:
 * the phone's live session, which server and escrow calls go under (otherwise always `uid`'s).
 */
export function makePhone(o: { backend: FakeBackend; uid: string; icloud: FakeICloud | null; clock: Clock; name: string; backupDb?: BackupDb; share?: SharedPhone; live?: LiveSession }) {
  const iso = () => new Date(o.clock.t).toISOString();
  let root: string;
  let local: SqlDb;
  if (o.share) {
    root = o.share.root;
    local = o.share.local;
  } else {
    root = mkdtempSync(join(tmpdir(), `asha-${o.name}-`));
    roots.push(root);
    local = nodeDb().db;
    migrate(local, { now: iso(), newId: () => randomUUID() });
  }
  const files = o.share?.files ?? nodeFiles(root);
  const backupDb = o.backupDb ?? openBackupDb(nodeDb().db, iso);
  const vault = o.share?.vault ?? nodeVault({ icloud: o.icloud });
  const cond = { net: 'wifi' as NetworkKind, fg: true, busy: false, cell: false, killed: false, escrowKilled: false };
  const conditions: Conditions = {
    network: async () => cond.net,
    meteredNow: () => cond.net !== 'wifi',
    foreground: () => cond.fg,
    busy: () => cond.busy,
    cellularAllowed: () => cond.cell,
    uploadsKilled: () => cond.killed,
    escrowKilled: () => cond.escrowKilled,
  };
  /** What Settings was told mid-pass (a download starting), in order. */
  const changes: BackupView[] = [];
  const service = createBackupService({
    db: backupDb,
    vault,
    aead: nodeAead,
    files,
    server: o.live ? underLive((u) => o.backend.serverFor(u), o.live) : o.backend.serverFor(o.uid),
    escrow: o.live ? underLive((u) => o.backend.escrowFor(u), o.live) : o.backend.escrowFor(o.uid),
    http: o.backend.http,
    downloader: o.backend.downloader,
    conditions,
    clock: { now: () => o.clock.t, sleep: async () => {} },
    profileId: o.uid,
    sessionUid: async () => (o.live ? o.live.uid : o.uid),
    source: backupSource({ db: () => local, profileId: o.uid, heldOnServer: (id) => o.backend.rows.get(o.uid)?.has(id) ?? false }),
    local: restoreLocal({ db: () => local, profileId: o.uid, fileExists: files.exists }),
    escrowKeys: () => o.backend.escrowKeys(),
    onChange: () => changes.push(service.view()),
    random: () => 0.5,
    partBytes: 64 * 1024,
  });
  return { ...o, root, files, local, backupDb, vault, cond, service, changes };
}

export type Phone = ReturnType<typeof makePhone>;

export function addChild(p: Phone, id: string, name = 'Asha'): void {
  const now = new Date(p.clock.t).toISOString();
  p.local.run(
    'INSERT INTO children (id, name, birthday, due_date, signs_as, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    id,
    name,
    '2026-05-01',
    null,
    p.uid.startsWith('1') ? 'Mama' : 'Papa',
    now,
    now,
  );
}

let n = 0;
function letterId(): string {
  n += 1;
  return `01928c3e-5a2b-7c3d-8e4f-${String(n).padStart(12, '0')}`;
}

function insertLetter(db: SqlDb, x: { id: string; childId: string; authorId: string; capturedAt: string; text: string; audio: { uri: string; sha256: string; bytes: number } | null; synced: boolean }): void {
  db.run(
    `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, prompt_key, engine_version,
       raw_transcript, machine_edits, final_text, in_book, sounds_like_me, updated_at, child_id, author_id, author_signs_as,
       audio_uri, audio_sha256, audio_bytes, server_version, sync_state)
     VALUES (?, 'letter', ?, ?, 'spoken', 'light', NULL, 1, ?, '[]', ?, 1, NULL, ?, ?, ?, 'Mama', ?, ?, ?, ?, ?)`,
    x.id,
    x.capturedAt.slice(0, 10),
    x.capturedAt,
    x.text,
    x.text,
    x.capturedAt,
    x.childId,
    x.authorId,
    x.audio?.uri ?? null,
    x.audio?.sha256 ?? null,
    x.audio?.bytes ?? null,
    x.synced ? 'sx1' : null,
    x.synced ? 'synced' : 'pending',
  );
}

/** A spoken letter saved on this phone, its recording in Documents. `synced`: its text reached the server. */
export function recordLetter(p: Phone, childId: string, bytes: number, o: { synced?: boolean } = {}) {
  const id = letterId();
  const plain = fakeM4a(bytes);
  const uri = p.files.documentUri(`recording-${id}.m4a`);
  writeFileSync(fileURLToPath(uri), plain);
  const capturedAt = new Date(p.clock.t + n * 1000).toISOString();
  insertLetter(p.local, { id, childId, authorId: p.uid, capturedAt, text: 'Asha laughed at the rain today.', audio: { uri, sha256: sha256Hex(plain), bytes: plain.length }, synced: o.synced ?? true });
  if (o.synced ?? true) p.backend.addRow(p.uid, id);
  return { id, plain, uri };
}

/** A take held at the Keep gate (a ready draft). `onServer`: its held-draft row reached the server. */
export function holdDraft(p: Phone, childId: string, bytes: number, o: { onServer?: boolean } = {}) {
  const id = letterId();
  const plain = fakeM4a(bytes);
  const uri = p.files.documentUri(`recording-${id}.m4a`);
  writeFileSync(fileURLToPath(uri), plain);
  p.local.run(
    `INSERT INTO drafts (id, child_id, capture_mode, prompt_key, created_at, audio_uri, audio_duration_ms, raw_transcript, typed_text, state, audio_sha256, audio_bytes)
     VALUES (?, ?, 'spoken', NULL, ?, ?, 60000, NULL, NULL, 'ready', ?, ?)`,
    id,
    childId,
    new Date(p.clock.t).toISOString(),
    uri,
    sha256Hex(plain),
    plain.length,
  );
  if (o.onServer) p.backend.addRow(p.uid, id);
  return { id, plain, uri };
}

/** What sync brings to another phone of the same person: the letter's words, no recording and no hash (R2 AR-32). */
export function syncText(from: Phone, to: Phone, ids?: string[]): void {
  const rows = from.local.all<{ id: string; child_id: string; author_id: string; captured_at: string; final_text: string }>(
    "SELECT id, child_id, author_id, captured_at, final_text FROM entries WHERE deleted_at IS NULL AND kind = 'letter'",
  );
  for (const r of rows) {
    if (ids && !ids.includes(r.id)) continue;
    if (to.local.get('SELECT 1 AS x FROM entries WHERE id = ?', r.id)) continue;
    if (!to.local.get('SELECT 1 AS x FROM children WHERE id = ?', r.child_id)) addChild(to, r.child_id);
    insertLetter(to.local, { id: r.id, childId: r.child_id, authorId: r.author_id, capturedAt: r.captured_at, text: r.final_text, audio: null, synced: true });
  }
}

export function audioOf(p: Phone, id: string): { uri: string | null; sha256: string | null } {
  const r = p.local.get<{ audio_uri: string | null; audio_sha256: string | null }>('SELECT audio_uri, audio_sha256 FROM entries WHERE id = ?', id);
  return { uri: r?.audio_uri ?? null, sha256: r?.audio_sha256 ?? null };
}
