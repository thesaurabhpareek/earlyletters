/// <reference types="node" />
/**
 * BL-929 H1 (PR 1): the content-free marker ring. The one row test is `[NS-34-R6] markers content-free`; the other
 * tests here carry no row id, so the row is cited by exactly one test (rule C-01). Fixture family: Asha.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { exportRun, mark, PERF_EVENTS, RING_SIZE, resetMarks, snapshot, type PerfEvent } from '../src/lib/perf/markers';

const SRC = join(__dirname, '..', 'src');
const CANARY = 'Asha-CANARY-/var/mobile/asha-1.jpg-2026-03-14';
const HEADER = { model: 'iPhone14,6', ios: '26.0.1', version: '1.0.0', build: '13', fingerprint: 'a1b2c3d4' };

/** Every `mark(` call in source, with the reason it is not content-free, or null. First argument: a quoted listed event. Second: no string. */
function scanMarkCalls(text: string, file = 'x.ts'): { file: string; line: number; why: string }[] {
  const bad: { file: string; line: number; why: string }[] = [];
  for (const m of text.matchAll(/(?<![\w$.])mark\(([^)]*)\)/g)) {
    const line = text.slice(0, m.index).split('\n').length;
    const [first = '', ...rest] = m[1].split(/,(.*)/s);
    const lit = first.trim().match(/^'([a-z_]+)'$/);
    if (!lit) bad.push({ file, line, why: 'event is not a plain quoted literal' });
    else if (!(PERF_EVENTS as readonly string[]).includes(lit[1])) bad.push({ file, line, why: 'event is not in the closed list' });
    if (rest.join('').match(/['"`]/)) bad.push({ file, line, why: 'number argument holds a string' });
  }
  return bad;
}

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) sourceFiles(p, acc);
    else if (/\.tsx?$/.test(n) && !/\.test\.tsx?$/.test(n) && !p.endsWith(join('perf', 'markers.ts'))) acc.push(p);
  }
  return acc;
}

describe('perf markers', () => {
  beforeEach(() => { process.env.EXPO_PUBLIC_PERF = 'on'; resetMarks(); });
  afterEach(() => { delete process.env.EXPO_PUBLIC_PERF; resetMarks(); });

  it('[NS-34-R6] markers content-free', () => {
    // Arrange: a real mark lands, so the canary checks below are not passing on a ring that never records.
    mark('save_commit', 12.5);
    expect(snapshot()).toHaveLength(1);
    expect(snapshot()[0]).toMatchObject({ event: 'save_commit', ms: 12.5 });
    // Act: the canary goes through every marker path: as the event, as the number, as extra arguments, in the header.
    mark(CANARY as unknown as PerfEvent, 1);
    mark('launch_first_frame', CANARY as unknown as number);
    (mark as (...a: unknown[]) => void)('find_first_row', 3, CANARY, { name: CANARY });
    expect(() => exportRun({ ...HEADER, model: CANARY }, new Date(0), 1)).toThrow(/plain token/);
    const out = exportRun(HEADER, new Date(Date.UTC(2026, 10, 20, 9, 5, 7)), 1);
    // Assert: only the two listed marks exist, and no canary text is in the ring or the file.
    expect(snapshot().map((m) => m.event)).toEqual(['save_commit', 'find_first_row']);
    for (const m of snapshot()) expect(Object.keys(m).sort()).toEqual(['event', 'ms', 't']);
    expect(JSON.stringify(snapshot()) + out.json + out.name).not.toMatch(/CANARY|Asha|asha|\/var/);
    expect(out.name).toBe('perf-20261120T090507Z-1.json');
    // The call sites in app source: a literal listed event and a number, nothing built from text.
    expect(sourceFiles(SRC).flatMap((f) => scanMarkCalls(readFileSync(f, 'utf8'), relative(SRC, f)))).toEqual([]);
  });

  it('the scan finds a template string, a variable, an unlisted event and a string number', () => {
    expect(scanMarkCalls("mark('save_commit', 4)\nmark('find_first_row', t1 - t0)")).toEqual([]);
    expect(scanMarkCalls('mark(`save_${name}`, 4)').map((b) => b.why)).toEqual(['event is not a plain quoted literal']);
    expect(scanMarkCalls('mark(eventName, 4)')).toHaveLength(1);
    expect(scanMarkCalls("mark('asha_letter', 4)").map((b) => b.why)).toEqual(['event is not in the closed list']);
    expect(scanMarkCalls("mark('save_commit', `${n}`)").map((b) => b.why)).toEqual(['number argument holds a string']);
  });

  it('with the flag unset or not literally on, mark does nothing', () => {
    for (const v of [undefined, 'off', 'ON', 'true', '1', ' on']) {
      if (v === undefined) delete process.env.EXPO_PUBLIC_PERF; else process.env.EXPO_PUBLIC_PERF = v;
      mark('save_commit', 5);
      expect(snapshot()).toEqual([]);
    }
    process.env.EXPO_PUBLIC_PERF = 'on';
    mark('save_commit', 5);
    expect(snapshot()).toHaveLength(1);
  });

  it('the ring keeps the last 2,000 marks, oldest first, and drops a negative or non-finite number', () => {
    for (let i = 0; i < RING_SIZE + 5; i++) mark('copy_decode', i);
    mark('copy_decode', -1);
    mark('copy_decode', Number.NaN);
    const s = snapshot();
    expect(s).toHaveLength(RING_SIZE);
    expect([s[0].ms, s[RING_SIZE - 1].ms]).toEqual([5, RING_SIZE + 4]);
  });

  it('the export name is the UTC start and a counter, and refuses a bad counter', () => {
    expect(exportRun(HEADER, new Date(Date.UTC(2026, 0, 2, 3, 4, 5, 678)), 3).name).toBe('perf-20260102T030405Z-3.json');
    expect(() => exportRun(HEADER, new Date(0), 0)).toThrow(/counter/);
    expect(JSON.parse(exportRun(HEADER, new Date(0), 1).json).header).toEqual(HEADER);
  });
});
