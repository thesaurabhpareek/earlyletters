/// <reference types="node" />
/**
 * PR 9b: the For you wiring (PRD 28; CPO-27, CPO-28, CDO-22). `planForYou` reads the device-only store, hands its hidden
 * days to `buildMoments` as `excludedDays` and ALWAYS passes `phoneCalm`. Nothing in the default bundle imports it.
 * Fictional family Asha only. Mutants: drop phoneCalm, drop excludedDays, treat an unreadable store as empty.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { moments } from '@scribe/core';
import { columns, laOffsetAt, ashaLibV1, type Row } from '../../../packages/core/test/moments/asha-lib-v1';
import { planForYou, type ForYouInput } from '../src/lib/moments/for-you';
import { emptyMoments } from '../src/lib/moments/store.logic';
import type { MomentsRead } from '../src/lib/moments/store-file';

const PROMPTS = [{ key: 'o.any.1', text: 'What did {child} do today?', band: 'any', kind: 'opening' }] as const;
const rows: Row[] = ashaLibV1().filter((c) => /^F0[124]/.test(c.name)).flatMap((c) => c.rows);
const input = (over: Partial<ForYouInput> = {}): ForYouInput => ({
  today: '2026-11-21', birth: '2025-04-12', marked: [], holidayRegion: null, state: 'normal', prompts: [...PROMPTS],
  libraryReadable: true, library: { window: columns(rows), offsetAt: laOffsetAt, bookId: 'book-asha' }, phoneCalm: false, ...over,
});
const store = (r: MomentsRead) => ({ load: () => r });
const withDays = (...dayKeys: string[]): MomentsRead => ({ state: 'ok', file: { ...emptyMoments('local'), dayKeys } });
const kinds = (p: moments.PlannedCard[]) => p.map((c) => c.slot);

describe('[PR9b] planForYou', () => {
  it('shows a library pictures card for a settled book and no calm phone', () => {
    expect(kinds(planForYou(store({ state: 'empty' }), input()))).toContain('pictures');
  });

  it('[R253] phoneCalm is passed through: a calm phone shows no library picture card', () => {
    const plan = planForYou(store({ state: 'empty' }), input({ phoneCalm: true }));
    expect(kinds(plan)).not.toContain('pictures');
    expect(kinds(plan)).toContain('question');
  });

  it('[CDO-22] days hidden in the store are excluded: a look back and a picked picture on one never show', () => {
    const i = input({ library: null, lookBack: { ref: 'l1', date: '2025-11-21' }, pictures: { source: 'S5', ref: 'p1', day: '2025-11-02' } });
    expect(kinds(planForYou(store({ state: 'empty' }), i))).toEqual(expect.arrayContaining(['lookBack', 'pictures']));
    const hidden = kinds(planForYou(store(withDays('2025-11-21', '2025-11-02')), i));
    expect(hidden).not.toContain('lookBack');
    expect(hidden).not.toContain('pictures');
  });

  it('[CDO-22] a hidden library day is not picked', () => {
    const plan = planForYou(store({ state: 'empty' }), input());
    const day = plan.find((c) => c.slot === 'pictures')!.dayKey!;
    const again = planForYou(store(withDays(day)), input());
    expect(again.find((c) => c.slot === 'pictures')?.dayKey ?? null).not.toBe(day);
  });

  it('[CDO-22] a store that cannot be read gives an empty plan (the hidden days are unknown)', () => {
    for (const state of ['unreadable', 'unavailable'] as const) expect(planForYou(store({ state }), input())).toEqual([]);
  });

  it('a foreign or newer file reads as no hidden days (the plan is built)', () => {
    expect(kinds(planForYou(store({ state: 'foreign', owner: 'a1b2c3d4e5f60718' }), input())).length).toBeGreaterThan(0);
    expect(kinds(planForYou(store({ state: 'newer' }), input())).length).toBeGreaterThan(0);
  });
});

describe('[PR9b] the wiring stays dark', () => {
  const root = join(__dirname, '..', 'src');
  const walk = (d: string): string[] => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : /\.tsx?$/.test(n) ? [join(d, n)] : []));
  const text = (f: string) => readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

  it('only the Moments screen may import for-you or use-for-you, and today nothing does (flag off: no new import)', () => {
    const users = walk(root).filter((f) => !f.includes('/lib/moments/') && /moments\/(use-)?for-you/.test(text(f)));
    expect(users.map((f) => f.slice(root.length))).toEqual([]);
  });

  it('the folder index does not re-export them (the default bundle imports the index)', () => {
    expect(text(join(root, 'lib/moments/index.ts'))).not.toMatch(/for-you/);
  });

  it('the wiring imports no analytics, network, native or library-read code', () => {
    for (const f of ['for-you.ts', 'use-for-you.ts']) expect(text(join(root, 'lib/moments', f))).not.toMatch(/from '[^']*(analytics|supabase|expo-media-library|scribe-library|logger)[^']*'|console\.|fetch\(/);
  });

  it('phoneCalm is a required input and buildMoments always receives it', () => {
    const t = text(join(root, 'lib/moments/for-you.ts'));
    expect(t).toMatch(/phoneCalm: boolean;/);
    expect(t).toMatch(/phoneCalm: input\.phoneCalm/);
  });
});
