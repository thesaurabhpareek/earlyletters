// NS-01 photo with a letter: where the controls are, what the switch removes, and what the code may not call.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { describe, expect, it } from 'vitest';
import ts from 'typescript';
import { entrySnapshot, type LocalEntryRow } from '../src/lib/sync/outbox';
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
  it('[NS-01-R15] the photo code never imports the sync layer or the network', () => {
    for (const f of walk(join(SRC, 'lib', 'photos'))) {
      expect(importsOf(parse(f)).filter((m) => /sync|supabase|fetch|api/.test(m)), rel(f)).toEqual([]);
      expect(readFileSync(f, 'utf8'), rel(f)).not.toMatch(/\bfetch\(|XMLHttpRequest/);
    }
  });
});
