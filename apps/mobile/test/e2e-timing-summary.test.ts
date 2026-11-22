/**
 * BL-1403: e2e/bin/timing-summary.mjs turns the TIMING lines the Maestro timing flows print into a table of
 * p50 and p95 with the sample count. Content-free: only the names of the timings and their millisecond
 * values are read; anything else in a log is ignored and never echoed.
 */
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseTimings, percentile, renderTable, summarise } from '../e2e/bin/timing-summary.mjs';

const ms = Array.from({ length: 200 }, (_, i) => (i + 1) * 10); // 10 .. 2000

describe('[BL-1403] timing summary', () => {
  it('[BL-1403] nearest-rank percentiles over a fixed list of 200 timings', () => {
    expect(percentile(ms, 50)).toBe(1000);
    expect(percentile(ms, 95)).toBe(1900);
    expect(percentile([...ms].reverse(), 95)).toBe(1900); // order does not matter
    expect(percentile([42], 95)).toBe(42);
  });

  it('[BL-1403] reads only TIMING lines and ignores everything else', () => {
    const log = [
      'Running on iPhone 15',
      'TIMING cold_start_ms=1200',
      'a line with Asha and a path /Users/someone/x TIMING not a timing',
      'TIMING record_start_ms=310',
      'TIMING cold_start_ms=1500',
      'TIMING cold_start_ms=abc',
      'TIMING cold_start_ms=-5',
    ].join('\n');
    expect(parseTimings(log)).toEqual({ cold_start_ms: [1200, 1500], record_start_ms: [310] });
  });

  it('[BL-1482] the line is anchored at the end: a value with anything after the digits is ignored, not read as its leading number', () => {
    // `TIMING cold_start_ms=12abc` must not count as 12. A trailing space alone is trimmed on purpose (the parser trims
    // each line, so a CRLF log still reads), so the space cases put text after it.
    const log = ['TIMING cold_start_ms=12abc', 'TIMING cold_start_ms=12 ms', 'TIMING cold_start_ms=12 x', 'TIMING cold_start_ms=12.5', 'TIMING cold_start_ms=7'].join('\n');
    expect(parseTimings(log)).toEqual({ cold_start_ms: [7] });
    expect(parseTimings('TIMING cold_start_ms=12abc\nTIMING cold_start_ms=12 ')).toEqual({ cold_start_ms: [12] });
  });

  it('[BL-1403] summarises with the sample count and renders a table with no other text', () => {
    const s = summarise({ cold_start_ms: ms });
    expect(s).toEqual([{ name: 'cold_start_ms', samples: 200, p50: 1000, p95: 1900 }]);
    const t = renderTable(s);
    expect(t).toContain('| cold_start_ms | 200 | 1000 | 1900 |');
    expect(t).not.toMatch(/Asha|\/Users/);
  });

  it('[BL-1403] flags a run that has fewer than 200 samples', () => {
    expect(renderTable(summarise({ record_start_ms: [300, 320] }))).toContain('| record_start_ms | 2 (need 200) | 300 | 320 |');
  });

  it('[BL-1403] the command prints the table for a log file and exits 1 when it holds no timings', () => {
    const dir = mkdtempSync(join(tmpdir(), 'timing-'));
    const ok = join(dir, 'ok.log');
    writeFileSync(ok, ms.map((n) => `TIMING cold_start_ms=${n}`).join('\n'));
    const bin = join(__dirname, '..', 'e2e', 'bin', 'timing-summary.mjs');
    const r = spawnSync(process.execPath, [bin, ok], { encoding: 'utf8' });
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain('| cold_start_ms | 200 | 1000 | 1900 |');
    const empty = join(dir, 'empty.log');
    writeFileSync(empty, 'nothing here');
    expect(spawnSync(process.execPath, [bin, empty], { encoding: 'utf8' }).status).toBe(1);
  });
});

describe('[BL-1403] the timing flows', () => {
  const E2E = join(__dirname, '..', 'e2e');
  it('[BL-1403] each repeats 200 times, kills the app between runs and prints only a TIMING line', async () => {
    const { readFileSync } = await import('node:fs');
    for (const [file, name] of [['E2E-18-timing-cold-start.yaml', 'cold_start_ms'], ['E2E-19-timing-record-start.yaml', 'record_start_ms']]) {
      const text = readFileSync(join(E2E, 'flows', file), 'utf8');
      expect(text, file).toMatch(/repeat:\s*\n\s*times:\s*200\b/);
      expect(text, file).toContain('- stopApp');
      expect(text, file).toContain(`TIMING_NAME: "${name}"`);
      expect(text, file).not.toMatch(/inputText|copyTextFrom/); // never reads a letter or a name
    }
    expect(readFileSync(join(E2E, 'config.yaml'), 'utf8')).toMatch(/excludeTags:[\s\S]*- e2e-timing/);
    const script = readFileSync(join(E2E, 'scripts', 'timing.js'), 'utf8');
    expect(script.match(/console\.log\(/g)).toHaveLength(1);
    expect(script).toMatch(/console\.log\('TIMING ' \+ name \+ '=' \+ /);
  });
});
