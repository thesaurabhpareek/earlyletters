/// <reference types="node" />
/**
 * [NS-36-R10] level in the migration: every column a local migration adds (version 5 and later) carries an L1 to
 * L4 data class in a comment inside that migration. Mirrors supabase/tests/classification.test.mjs for the phone.
 * Reads source text only; checks that a label exists, not which one. Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync(new URL('../src/lib/db/migrations.ts', import.meta.url), 'utf8');
const FIRST_CHECKED = 5; // versions 1 to 4 shipped before the label rule; never edited to satisfy this test

/** Shipped columns with no label, listed for `privacy` (never edit an applied migration). Remove a line when fixed. */
export const KNOWN_GAPS = new Set<string>([
  // v7 child_member_prefs: the table is described in the comment but these two columns carry no level.
  '7:child_member_prefs.child_id',
  '7:child_member_prefs.updated_at',
]);

/** Split the source of the MIGRATIONS array into [version, body] pairs. */
export function splitMigrations(src: string): Array<[number, string]> {
  const parts = src.split(/^\s{2}\{\n\s+version: (\d+),/m);
  const out: Array<[number, string]> = [];
  for (let i = 1; i < parts.length; i += 2) out.push([Number(parts[i]), parts[i + 1]]);
  return out;
}

/** Every `table.column` a migration body adds, through addColumns or CREATE TABLE. */
export function addedColumns(body: string): string[] {
  const found: string[] = [];
  for (const m of body.matchAll(/addColumns\(\s*db,\s*'(\w+)',\s*\[([\s\S]*?)\]\s*\)/g)) {
    for (const c of m[2].matchAll(/\[\s*'(\w+)'\s*,/g)) found.push(`${m[1]}.${c[1]}`);
  }
  for (const m of body.matchAll(/CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)\s*\(([\s\S]*?)\n\s*\);/g)) {
    for (const line of m[2].split('\n')) {
      const c = line.trim().match(/^(\w+)\s+(TEXT|INTEGER|REAL|BLOB)\b/);
      if (c) found.push(`${m[1]}.${c[1]}`);
    }
  }
  return found;
}

/** Columns that no comment line names together with a level (L1 to L4). */
export function unlabelled(body: string): string[] {
  const comments = body.split('\n').filter((l) => l.trim().startsWith('//'));
  return addedColumns(body).filter((tc) => {
    const col = tc.split('.')[1];
    const word = new RegExp(`\\b${col}\\b`);
    return !comments.some((l) => word.test(l) && /\bL[1-4]\b/.test(l));
  });
}

describe('[NS-36-R10] level in the migration', () => {
  const migrations = splitMigrations(SRC);

  it('finds the migrations it is meant to check', () => {
    expect(migrations.map(([v]) => v)).toContain(10);
    expect(migrations.filter(([v]) => v >= FIRST_CHECKED).length).toBeGreaterThanOrEqual(6);
  });

  it('every added column names its level; a gap names the column', () => {
    const gaps: string[] = [];
    for (const [v, body] of migrations) {
      if (v < FIRST_CHECKED) continue;
      for (const tc of unlabelled(body)) if (!KNOWN_GAPS.has(`${v}:${tc}`)) gaps.push(`v${v} ${tc} has no L1 to L4 label in its comment`);
    }
    expect(gaps).toEqual([]);
  });

  it('a listed gap still exists (remove it from KNOWN_GAPS once privacy labels it)', () => {
    const live = new Set<string>();
    for (const [v, body] of migrations) for (const tc of unlabelled(body)) live.add(`${v}:${tc}`);
    expect([...KNOWN_GAPS].filter((k) => !live.has(k))).toEqual([]);
  });

  it('mutant: a column added without the comment fails and is named (positive control)', () => {
    const labelled = `
      // Every column is L2.
      //   note_kind   L2  a kind
      addColumns(db, 'drafts', [['note_kind', 'TEXT']]);`;
    const mutant = `
      // Every column is L2.
      //   note_kind   L2  a kind
      addColumns(db, 'drafts', [['note_kind', 'TEXT'], ['asha_mood', 'TEXT']]);`;
    expect(unlabelled(labelled)).toEqual([]);
    expect(unlabelled(mutant)).toEqual(['drafts.asha_mood']);
    const table = "CREATE TABLE IF NOT EXISTS t (\n id TEXT PRIMARY KEY NOT NULL,\n x TEXT\n );";
    expect(unlabelled(`// id L2 key\n${table}`)).toEqual(['t.x']);
  });

  it('mutant on the real file: dropping the v10 label line makes v10 fail', () => {
    const v10 = migrations.find(([v]) => v === 10)![1].replace(/^\s*\/\/\s+rendered_sha256.*$/m, '');
    expect(unlabelled(v10)).toEqual(['agreements.rendered_sha256']);
  });
});
