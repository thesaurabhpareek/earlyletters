/// <reference types="node" />
/**
 * [BL-1643] The nine J24 capture-loop tests that record steps each own a distinct, contiguous range of step ids, so
 * none overwrites another's steps/J24-NN.json. Reads the flow source (Playwright cannot run in unit tests).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(join(__dirname, '..', 'e2e-web', 'j24-capture-loop.flow.ts'), 'utf8');

function table(name: string): Record<string, number> {
  const body = new RegExp(`const ${name} = \\{([^}]*)\\}`).exec(src)?.[1] ?? '';
  return Object.fromEntries([...body.matchAll(/(\w+):\s*(\d+)/g)].map((m) => [m[1], Number(m[2])]));
}

describe('[BL-1643] J24 step id ranges', () => {
  const scales = table('SCALE_START');
  const langs = table('LANG_START');
  const SCALE_STEPS = 3;
  const LANG_STEPS = 1;

  it('[BL-1643] nine tests, each with its own start id, covering J24-01..15 with no overlap and no gap', () => {
    expect(Object.keys(scales)).toHaveLength(3);
    expect(Object.keys(langs)).toHaveLength(6);
    const ids: number[] = [];
    for (const s of Object.values(scales)) for (let i = 0; i < SCALE_STEPS; i++) ids.push(s + i);
    for (const s of Object.values(langs)) for (let i = 0; i < LANG_STEPS; i++) ids.push(s + i);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort((a, b) => a - b)).toEqual(Array.from({ length: 15 }, (_, i) => i + 1));
  });

  it('[BL-1643] the step counts above match the flow: three step() calls per scale test, one per language test', () => {
    const scaleBlock = src.slice(src.indexOf('for (const [name, scale]'), src.indexOf('for (const lang of LANGS)'));
    const langBlock = src.slice(src.indexOf('for (const lang of LANGS)'), src.indexOf("test('[J24] the seam ignores"));
    expect(scaleBlock.match(/await step\(/g)).toHaveLength(SCALE_STEPS);
    expect(langBlock.match(/await step\(/g)).toHaveLength(LANG_STEPS);
  });

  it('[BL-1643] journey() takes its start id from the tables, never a literal 1', () => {
    expect(src).toMatch(/journey\(record, 'J24', `capture-loop-\$\{name\.toLowerCase\(\)\}`, SCALE_START\[/);
    expect(src).toMatch(/journey\(record, 'J24', `capture-loop-\$\{lang\}`, LANG_START\[lang\]/);
    expect(src).not.toMatch(/journey\(record, 'J24', [^)]*, 1,/);
  });
});
