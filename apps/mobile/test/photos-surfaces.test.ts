// NS-01 photo with a letter: where the controls are, what the switch removes, and what the code may not call.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { applyPullPage } from '../src/lib/sync/merge';
import { entrySnapshot, SYNC_SETTING, writeSetting, type LocalEntryRow } from '../src/lib/sync/outbox';
import type { PullResponse } from '../src/lib/sync/types';
import { entryMediaStore } from '../src/lib/photos/entry-media';
import { parsePhotosFlag, photoSurfaces, photosPaused } from '../src/lib/photos/flag';
import { fixture, insertBook } from './helpers/store-fixture';
import { commitPhoto } from '../src/lib/photos/session';
import { deps, makeJpeg } from './photos-helpers';

const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'src');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });
const parse = (file: string): ts.SourceFile => ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const importsOf = (sf: ts.SourceFile): string[] => sf.statements.filter(ts.isImportDeclaration).map((s) => (s.moduleSpecifier as ts.StringLiteral).text);
const rel = (f: string) => relative(SRC, f);

describe('[NS-01-R15][NX-39-R33] sync carries no picture', () => {
  const row: LocalEntryRow = {
    id: 'e1', kind: 'letter', occurred_on: '2026-06-12', captured_at: '2026-06-12T09:00:00Z', capture_mode: 'typed', edit_level: 'clean',
    prompt_key: null, engine_version: 1, raw_transcript: 'She laughed.', machine_edits: '[]', final_text: 'She laughed.', in_book: 1, sounds_like_me: null,
    updated_at: '2026-06-12T09:00:00Z', deleted_at: null, synced_at: null, child_id: 'c1', author_id: 'u1', author_signs_as: 'Papa', audio_uri: null,
    transcript_status: null, server_version: null, server_updated_at: null, server_epoch: null, sync_state: 'pending', approval: null,
    language: 'en', occurred_precision: 'day', base_direction: 'ltr',
  };
  it('[NS-01-R15][NX-39-R33] a letter with a picture syncs with photo_path null and no media key', async () => {
    const { d } = deps();
    await commitPhoto(d, { entryId: 'e1', finalText: 'She laughed.', text: 'Asha on the swing', bytes: makeJpeg() });
    const snap = entrySnapshot(row) as unknown as Record<string, unknown>;
    expect(snap.photo_path ?? null).toBeNull();
    expect(Object.keys(snap).filter((k) => /library|local_id|asset|place|geohash|moment|occasion|taken_at|media|photo/i.test(k))).toEqual([]);
    expect(JSON.stringify(snap)).not.toContain('Asha on the swing');
  });
  it('[NS-01-R15] a pull never creates, changes or deletes an entry_media row: not for a letter it rewrites, one the server no longer holds, a new one, or a draft (#836 review B)', () => {
    const ME = '11111111-1111-1111-1111-111111111111';
    const NOW = '2026-10-03T09:00:00.000Z';
    const db = fixture().db;
    insertBook(db, { id: 'c1', name: 'Asha', signsAs: 'Mama', serverState: 'synced' });
    writeSetting(db, SYNC_SETTING.owner, ME);
    writeSetting(db, SYNC_SETTING.epoch, '1');
    for (const id of ['e1', 'e2']) {
      db.run(
        `INSERT INTO entries (id, kind, occurred_on, captured_at, capture_mode, edit_level, engine_version, raw_transcript, machine_edits, final_text,
           in_book, updated_at, child_id, author_id, server_version, server_updated_at, server_epoch, sync_state)
         VALUES (?, 'letter', '2026-10-01', ?, 'typed', 'verbatim', 5, 'Hi.', '[]', 'Hi.', 1, ?, 'c1', ?, '100', ?, 1, 'synced')`,
        id, NOW, NOW, ME, NOW,
      );
    }
    db.run("INSERT INTO drafts (id, child_id, capture_mode, created_at) VALUES ('d1', 'c1', 'typed', ?)", NOW);
    const store = entryMediaStore(db);
    const pic = (owner: string, media: string) =>
      store.put({ entryId: owner, mediaId: media, ext: 'jpg', bytes: 3, sha256: 'ab', width: 4, height: 4, text: 'Rain boots', place: 'the back step', addedAt: NOW, deletedAt: null });
    pic('e1', 'm1');
    pic('e2', 'm2');
    pic('d1', 'm3');
    const media = () => db.all('SELECT * FROM entry_media ORDER BY id');
    const before = media();
    const row = (id: string, words: string) => ({
      id, child_id: 'c1', author_id: ME, author_signs_as: 'Mama', kind: 'letter', occurred_on: '2026-10-01', captured_at: NOW,
      capture_mode: 'typed', edit_level: 'verbatim', prompt_key: null, engine_version: 5, raw_transcript: 'Hi.', machine_edits: [],
      final_text: words, in_book: true, sounds_like_me: null, approval: null, created_at: NOW, updated_at: NOW, deleted_at: null, own: true, v: '120',
    });
    // e1 rewritten by the server, e2 no longer held there (it goes to Recently deleted here), e3 new from another phone.
    const page = {
      reset: false, epoch: 1, epoch_started_at: NOW, gone: [], more: false,
      books: [{ id: 'c1', access: 'parent', repull: false, meta_hash: 'x', cursor: '900:00000000-0000-0000-0000-000000000000', more: false, rows: [row('e1', 'Hi, Asha.'), row('e3', 'New.')], ids: ['e1', 'e3'] }],
    } as unknown as PullResponse;
    db.transaction(() => applyPullPage(db, page, NOW));
    expect(db.get<{ final_text: string }>("SELECT final_text FROM entries WHERE id = 'e1'")?.final_text).toBe('Hi, Asha.'); // the pull did run
    expect(media()).toEqual(before);
  });
  it('[NS-01-R15] the photo code never imports the sync layer or the network', () => {
    for (const f of walk(join(SRC, 'lib', 'photos'))) {
      expect(importsOf(parse(f)).filter((m) => /sync|supabase|fetch|api/.test(m)), rel(f)).toEqual([]);
      expect(readFileSync(f, 'utf8'), rel(f)).not.toMatch(/\bfetch\(|XMLHttpRequest/);
    }
  });
});

describe('[NS-01-R19][NX-39-R37] the switch removes the screens, not the data rights', () => {
  it('[NS-01-R19][NX-39-R37] off (the default), or paused remotely, nothing new draws; only "on" turns it on', () => {
    expect(parsePhotosFlag(undefined)).toBe(false);
    for (const v of ['', 'off', 'true', '1', 'yes']) expect(parsePhotosFlag(v)).toBe(false);
    expect(parsePhotosFlag('on')).toBe(true);
    expect(photoSurfaces({ build: false, paused: false })).toEqual({ start: false, lens: false, addActions: false });
    expect(photoSurfaces({ build: true, paused: true })).toEqual({ start: false, lens: false, addActions: false });
    expect(photoSurfaces({ build: true, paused: false })).toEqual({ start: true, lens: true, addActions: true });
    // the remote can pause, and a config with nothing in it never pauses and never turns anything on
    expect(photosPaused({ killSwitches: { photos: true } })).toBe(true);
    expect(photosPaused(null)).toBe(false);
    expect(photoSurfaces({ build: false, paused: photosPaused({ killSwitches: { photos: false } }) }).start).toBe(false);
  });
});
