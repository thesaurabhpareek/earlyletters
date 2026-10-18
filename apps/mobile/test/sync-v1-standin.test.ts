/// <reference types="node" />
/**
 * The sync v1 stand-in (helpers/sync-v1-standin.ts) is a patch over S02's newest
 * sync_push, never a copy of an older one. These checks keep that true: every edit
 * finds its anchor exactly once in the sync_push the migrations define last, and a
 * reshaped sync_push fails by name instead of silently testing an old server.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { patchSyncPush, SYNC_PULL_ERASE_EDITS, SYNC_PUSH_ERASE_EDITS, SYNC_PUSH_HELD_EDITS, SYNC_PUSH_V1_EDITS } from './helpers/sync-v1-standin';

const MIGRATIONS = resolve(__dirname, '../../../supabase/migrations');

/** The text of the newest `create or replace function public.<name>` in the migrations. */
function newest(name: string): { file: string; text: string } {
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files.reverse()) {
    const sql = readFileSync(join(MIGRATIONS, f), 'utf8');
    const start = sql.lastIndexOf(`create or replace function public.${name}(`);
    if (start < 0) continue;
    const bodyStart = sql.indexOf('$$', start);
    const end = sql.indexOf('$$;', bodyStart + 2);
    return { file: f, text: sql.slice(start, end + 3) };
  }
  throw new Error(`no ${name} in supabase/migrations`);
}

/** The text of the newest `create or replace function public.sync_push` in the migrations. */
function newestSyncPush(): { file: string; text: string } {
  const files = readdirSync(MIGRATIONS).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files.reverse()) {
    const sql = readFileSync(join(MIGRATIONS, f), 'utf8');
    const start = sql.lastIndexOf('create or replace function public.sync_push(');
    if (start < 0) continue;
    const bodyStart = sql.indexOf('$$', start);
    const end = sql.indexOf('$$;', bodyStart + 2);
    return { file: f, text: sql.slice(start, end + 3) };
  }
  throw new Error('no sync_push in supabase/migrations');
}

describe('sync v1 stand-in (request to S02, WP-F16-14)', () => {
  it('patches the newest real sync_push: every anchor once, every edit applied', () => {
    const { file, text } = newestSyncPush();
    if (text.includes('conflict_groups')) return; // S02's migration carries v1: the stand-in is not loaded
    const out = patchSyncPush(text);
    for (const e of SYNC_PUSH_V1_EDITS) expect(out, `${file}: ${e.why}`).toContain(e.becomes.trim());
    expect(out).toContain('for update');
    expect(out).toContain('sync_private.note_applied(v_op, v_id, v_refused, v_newer)');
    expect(out).toContain('sync_private.dup_outcome(v_op, v_id)');
  });

  it('keeps everything else in S02\'s body: only lines are added or extended, none removed', () => {
    const { text } = newestSyncPush();
    if (text.includes('conflict_groups')) return;
    const kept = patchSyncPush(text);
    // The only rewritten lines are the row read (adds text_xid and the lock) and the dup tail; every other line survives.
    const rewritten = new Set([
      '          select e.sync_xid, e.updated_at, e.deleted_at, e.sync_restored_from into cur',
      '            from entries e where e.id = v_id;            -- RLS: the caller\'s own letters only',
      "            jsonb_build_object('missing', true));",
    ]);
    const missing = text.split('\n').filter((l) => !rewritten.has(l) && !kept.includes(l));
    expect(missing).toEqual([]);
  });

  it('fails by name when S02 reshapes sync_push, never falls back to an old body', () => {
    const { text } = newestSyncPush();
    if (text.includes('conflict_groups')) return;
    expect(() => patchSyncPush(text.replace('  v_conflict boolean;\n', ''))).toThrow(/two flags for the words outcome/);
    expect(() => patchSyncPush(`${text}\n  v_conflict boolean;\n`)).toThrow(/found 2 times/);
  });

  it('held drafts (WP-F16-17): the branches, the Keep compare, the switch and the duplicate answers go into the same sync_push, each anchor once', () => {
    const { file, text } = newestSyncPush();
    if (text.includes("'held.upsert'")) return; // S02's migration carries held drafts: the stand-in is not loaded
    const v1 = text.includes('conflict_groups') ? text : patchSyncPush(text);
    const out = patchSyncPush(v1, SYNC_PUSH_HELD_EDITS);
    for (const e of SYNC_PUSH_HELD_EDITS) expect(out, `${file}: ${e.why}`).toContain(e.becomes.trim());
    expect(out.indexOf("when 'held.upsert'")).toBeLessThan(out.indexOf("raise exception 'unknown op type'"));
    // Nothing of the v1 body is lost, except the lines the Keep's compare and provenance edits rewrite (table row C).
    const rewritten = (l: string) => SYNC_PUSH_HELD_EDITS.some((e) => !e.becomes.includes(e.anchor)
      && e.anchor.split('\n').some((a) => a.trim() !== '' && l.includes(a.trim())));
    expect(v1.split('\n').filter((l) => !out.includes(l) && !rewritten(l))).toEqual([]);
    expect(v1.split('\n').filter((l) => !out.includes(l))).toHaveLength(7);
  });

  it('Erase now (WP-F16-13): the entry.erase branch and the pull digest check apply to the newest sync_push and sync_pull, each anchor once', () => {
    const push = newestSyncPush();
    if (push.text.includes("'entry.erase'")) return; // S02's migration carries it: the stand-in is not loaded
    const v1 = push.text.includes('conflict_groups') ? push.text : patchSyncPush(push.text);
    const out = patchSyncPush(patchSyncPush(v1, SYNC_PUSH_ERASE_EDITS), SYNC_PUSH_HELD_EDITS);
    expect(out).toContain("when 'entry.erase' then");
    expect(out).toContain("when 'held.upsert' then");
    const pull = newest('sync_pull');
    const p = patchSyncPush(pull.text, SYNC_PULL_ERASE_EDITS);
    expect(p, pull.file).toContain('sync_private.entry_erasures');
    expect(pull.text.split('\n').filter((l) => !p.includes(l))).toEqual([]);
  });
});
