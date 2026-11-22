/// <reference types="node" />
/**
 * [BL-434] Tonight and the Book read only the rows and columns they show. The SQL each screen's read issues is
 * recorded: no `machine_edits`, no unbounded read for Tonight, and the answers match the full read.
 * Fictional family Asha only.
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { entries, settings } from '../src/lib/db/repos';
import type { SqlDb } from '../src/lib/db/sql';
import { fixture, insertBook, letter, type Fixture } from './helpers/store-fixture';

const ASHA = 'child-asha';
const NIA = 'child-nia';
const id = (i: number) => `0199a5b0-0000-7000-8000-${i.toString(16).padStart(12, '0')}`;
const day = (n: number) => new Date(Date.UTC(2026, 0, 1) + n * 86_400_000).toISOString().slice(0, 10);

function recorded(f: Fixture): { ctx: Fixture['ctx']; sql: string[] } {
  const sql: string[] = [];
  const spy = (fn: string) => (q: string, ...p: never[]) => {
    sql.push(q);
    return (f.db as unknown as Record<string, (...a: unknown[]) => unknown>)[fn](q, ...p);
  };
  const db = { ...f.db, all: spy('all'), get: spy('get'), run: spy('run') } as unknown as SqlDb;
  return { ctx: { ...f.ctx, db }, sql };
}

/** True when any recorded statement reads the stored edit list (a `'[]' AS machine_edits` stand-in is not a read). */
const readsEdits = (sql: string[]): boolean => /machine_edits/.test(sql.join('\n').replace(/AS machine_edits/g, ''));

function seeded() {
  const f = fixture();
  insertBook(f.db, { id: ASHA, name: 'Asha', birthday: '2025-10-01' });
  insertBook(f.db, { id: NIA, name: 'Nia', birthday: '2025-10-01' });
  settings.setSetting(f.ctx, 'activeChildId', ASHA);
  for (let i = 0; i < 120; i++) {
    entries.upsert(
      f.ctx,
      letter({
        id: id(i),
        childId: i % 6 === 5 ? NIA : ASHA,
        occurredOn: day(i),
        capturedAt: `${day(i)}T08:30:00.000Z`,
        promptKey: i % 3 === 0 ? null : `prompt-${i}`,
        machineEdits: [{ type: 'filler_removed', start: 0, end: 2, original: 'um', replacement: '' } as never],
        finalText: `Asha laughed, letter ${i}.`,
        kind: i === 100 ? 'not_much' : 'letter',
      }),
      { childId: i % 6 === 5 ? NIA : ASHA, authorSignsAs: 'Mama' },
    );
  }
  return f;
}

describe('[BL-434] the Book reads words, not edit lists', () => {
  const f = seeded();

  it('[BL-434] listForBook never selects machine_edits and returns the same letters', () => {
    const { ctx, sql } = recorded(f);
    const book = entries.listForBook(ctx, ASHA);
    expect(readsEdits(sql)).toBe(false);
    const full = entries.listForChild(f.ctx, ASHA);
    expect(book.map((e) => e.id)).toEqual(full.map((e) => e.id));
    expect(book.map((e) => e.finalText)).toEqual(full.map((e) => e.finalText));
    expect(book.every((e) => e.machineEdits.length === 0)).toBe(true);
    expect(full[0].machineEdits.length).toBe(1); // the full read still carries them (Review, export)
  });

  it('[BL-434] the letter count is one SQL count, equal to the loaded count, marks excluded', () => {
    const { ctx, sql } = recorded(f);
    const n = entries.countLetters(ctx, ASHA);
    expect(sql).toHaveLength(1);
    expect(sql[0]).toMatch(/count\(\*\)/i);
    expect(n).toBe(entries.listForChild(f.ctx, ASHA).filter((e) => e.kind !== 'not_much').length);
  });
});

describe('[BL-434] Tonight reads a window, not the book', () => {
  const f = seeded();

  it('[BL-434] recent prompt keys: at most the limit, newest first, from SQL with LIMIT and no machine_edits', () => {
    const { ctx, sql } = recorded(f);
    const keys = entries.recentPromptKeys(ctx, ASHA, 10);
    expect(keys).toHaveLength(10);
    expect(sql[0]).toMatch(/LIMIT/);
    expect(readsEdits(sql)).toBe(false);
    const old = entries.listForChild(f.ctx, ASHA).map((e) => e.promptKey).filter((k): k is string => !!k).slice(0, 10);
    expect(keys).toEqual(old);
  });

  it('[BL-434] latest occurred_on equals the first row of the full read, and an empty book gives null', () => {
    expect(entries.latestOccurredOn(f.ctx, ASHA)).toBe(entries.listForChild(f.ctx, ASHA)[0].occurredOn);
    insertBook(f.db, { id: 'child-empty', name: 'Asha' });
    expect(entries.latestOccurredOn(f.ctx, 'child-empty')).toBeNull();
  });

  it('[BL-434] the window holds only the days asked for, without edit lists', () => {
    const { ctx, sql } = recorded(f);
    const w = entries.listOccurredBetween(ctx, ASHA, day(60), day(70));
    expect(w.length).toBeGreaterThan(0);
    expect(w.every((e) => e.occurredOn >= day(60) && e.occurredOn <= day(70) && e.childId === ASHA)).toBe(true);
    expect(readsEdits(sql)).toBe(false);
    expect(w.length).toBeLessThan(entries.listForChild(f.ctx, ASHA).length);
  });

  it('[BL-434] the screens no longer call the full-book read', () => {
    const tonight = readFileSync(new URL('../src/app/(tabs)/index.tsx', import.meta.url), 'utf8');
    const book = readFileSync(new URL('../src/app/(tabs)/book.tsx', import.meta.url), 'utf8');
    expect(tonight).not.toMatch(/\blistEntries(ForChild)?\b/);
    expect(book).not.toMatch(/\blistEntriesForChild\b/);
  });
});
