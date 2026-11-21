/// <reference types="node" />
/**
 * [G5] Circular imports (docs/engineering/readiness-20nov/performance/CODE-QUALITY-GATES.md section 2, row G5).
 * No dependency: a regex import reader and Tarjan's strongly connected components over the value-import graph.
 * A cycle is a component of two or more files, or a file that imports itself. The ratchet is at zero: any cycle
 * in `apps/mobile/src`, `packages/core`, `api`, `content` or `analytics` fails, and the failure prints the files.
 *
 * Edges: static `import`, `export ... from`, side-effect `import 'x'` and `require('x')`. A dynamic `import('x')`
 * is not an edge: it runs after both modules have loaded, so it cannot deadlock the load order, and it is how
 * the app breaks a cycle on purpose (`lib/billing/plan-store.ts` loads `status-report.app.ts` that way, and that file
 * imports `plan-store` back; see the G5 PR).
 * Type-only imports (`import type`, `export type ... from`) are erased at build and are not edges.
 * Test files are not nodes. A package or a file outside the scanned folder is not an edge. A relative specifier
 * inside the folder that resolves to nothing fails the test. Platform files (`.ios`, `.android`, `.native`) are nodes.
 * The reader is shared with boundaries.test.ts (`helpers/import-reader.ts`). It strips comments with a scanner that
 * knows strings and regex literals, so `'src/*'` and `if (x) /\/\//.test(s);` do not hide imports. Limits: a string
 * that merely contains the text `import x from 'y'` still reads as an import.
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { importSpecifiers } from './helpers/import-reader';

const ROOT = resolve(__dirname, '..', '..', '..');
const MOBILE_SRC = join(ROOT, 'apps', 'mobile', 'src');
const EXT = ['.ts', '.tsx'];

export function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) && !name.endsWith('.d.ts') ? [p] : [];
  });
}

const PLATFORMS = ['', '.ios', '.android', '.native'];

/**
 * Adjacency list of resolved value-import edges between the files given. `@/` maps to `alias`.
 * `./b` resolves to `b.ts`, `b.ios.ts`, `b.android.ts`, `b.native.ts` and the same under `b/index`: every variant is an edge.
 * A relative or `@/` specifier inside the scanned folder with no known file and no extension of its own (an asset or `.json` is fine) is pushed
 * to `missing`, so a new blind spot fails the test instead of vanishing.
 */
export function buildGraph(files: string[], alias: string | null, missing: string[] = []): Map<string, string[]> {
  const known = new Set(files);
  const find = (base: string) =>
    [base, ...PLATFORMS.flatMap((p) => EXT.flatMap((e) => [base + p + e, join(base, 'index' + p + e)]))].filter((c) => known.has(c));
  const scope = files.length ? files.map(dirname).reduce((a, b) => { while (a !== b && !b.startsWith(a + '/')) a = dirname(a); return a; }) : '';
  const graph = new Map<string, string[]>();
  for (const file of files) {
    const edges = new Set<string>();
    for (const spec of importSpecifiers(readFileSync(file, 'utf8'))) {
      const base = spec.startsWith('.') ? resolve(dirname(file), spec) : alias && spec.startsWith('@/') ? join(alias, spec.slice(2)) : null;
      if (!base) continue;
      const hits = find(base);
      if (hits.length === 0 && (base === scope || base.startsWith(scope + '/')) && !/\.[a-z0-9]+$/i.test(spec.split('/').pop()!.replace(/^\.+$/, ''))) missing.push(`${file}: ${spec}`);
      for (const h of hits) edges.add(h);
    }
    graph.set(file, [...edges]);
  }
  return graph;
}

/** Tarjan: every strongly connected component with two or more files, plus any file that imports itself. */
export function findCycles(graph: Map<string, string[]>): string[][] {
  const index = new Map<string, number>();
  const low = new Map<string, number>();
  const onStack = new Set<string>();
  const stack: string[] = [];
  const cycles: string[][] = [];
  let next = 0;
  const visit = (v: string) => {
    index.set(v, next);
    low.set(v, next++);
    stack.push(v);
    onStack.add(v);
    for (const w of graph.get(v) ?? []) {
      if (!index.has(w)) {
        visit(w);
        low.set(v, Math.min(low.get(v)!, low.get(w)!));
      } else if (onStack.has(w)) low.set(v, Math.min(low.get(v)!, index.get(w)!));
    }
    if (low.get(v) === index.get(v)) {
      const scc: string[] = [];
      for (let w = stack.pop()!; ; w = stack.pop()!) {
        onStack.delete(w);
        scc.push(w);
        if (w === v) break;
      }
      if (scc.length > 1 || (graph.get(v) ?? []).includes(v)) cycles.push(scc.sort());
    }
  };
  for (const v of graph.keys()) if (!index.has(v)) visit(v);
  return cycles;
}

const ROOTS: Array<{ name: string; dir: string; alias: string | null; minFiles: number; minEdges: number }> = [
  { name: 'apps/mobile/src', dir: MOBILE_SRC, alias: MOBILE_SRC, minFiles: 510, minEdges: 1900 },
  { name: 'packages/core/src', dir: join(ROOT, 'packages', 'core', 'src'), alias: null, minFiles: 33, minEdges: 76 },
  { name: 'packages/api/src', dir: join(ROOT, 'packages', 'api', 'src'), alias: null, minFiles: 20, minEdges: 26 },
  { name: 'packages/content/src', dir: join(ROOT, 'packages', 'content', 'src'), alias: null, minFiles: 37, minEdges: 41 },
  { name: 'packages/analytics/src', dir: join(ROOT, 'packages', 'analytics', 'src'), alias: null, minFiles: 22, minEdges: 38 },
];

describe('[G5] no circular imports (ratchet at zero)', () => {
  for (const r of ROOTS) {
    it(`[G5] ${r.name} has no import cycle`, () => {
      const files = sourceFiles(r.dir);
      const missing: string[] = [];
      const graph = buildGraph(files, r.alias, missing);
      const edges = [...graph.values()].reduce((n, e) => n + e.length, 0);
      expect(missing, 'a relative import inside the root resolves to no file: the gate cannot see through it').toEqual([]);
      expect(files.length, 'the reader found too few files').toBeGreaterThanOrEqual(r.minFiles);
      expect(edges, 'the reader resolved too few edges').toBeGreaterThanOrEqual(r.minEdges);
      const cycles = findCycles(graph).map((c) => c.map((f) => f.slice(ROOT.length + 1)));
      expect(cycles, 'import cycle: break it by moving the shared piece to a third file').toEqual([]);
    });
  }
});

describe('[G5] the reader and the walk, self-tests', () => {
  const g = (o: Record<string, string[]>) => new Map(Object.entries(o));
  it('finds a two-file cycle, a three-file cycle and a self import, and no cycle in a chain or a diamond', () => {
    expect(findCycles(g({ a: ['b'], b: ['a'] }))).toEqual([['a', 'b']]);
    expect(findCycles(g({ a: ['b'], b: ['c'], c: ['a'], d: ['a'] }))).toEqual([['a', 'b', 'c']]);
    expect(findCycles(g({ a: ['a'] }))).toEqual([['a']]);
    expect(findCycles(g({ a: ['b', 'c'], b: ['d'], c: ['d'], d: [] }))).toEqual([]);
  });
  it('reads static and require imports; skips dynamic and type-only imports and comments', () => {
    const src = "import a from './a';\nimport type { T } from './t';\nexport type { U } from './u';\nexport * from './b';\nimport './c';\nconst d = await import('./d');\nconst e = require('./e');\n// import x from './x';\n/* import y from './y'; */";
    expect(importSpecifiers(src)).toEqual(['./a', './b', './c', './e']);
  });
  it('a planted cycle between two scratch files, and a type-only back edge that is not a cycle', () => {
    const dir = mkdtempSync(join(tmpdir(), 'g5-'));
    try {
      mkdirSync(join(dir, 'lib'));
      const w = (n: string, s: string) => writeFileSync(join(dir, n), s);
      w('a.ts', "import { b } from './b';\nexport const a = b;\n");
      w('b.ts', "import { a } from './a';\nexport const b = a;\n");
      w('c.ts', "import { d } from './lib';\nexport const c = d;\n");
      w('lib/index.ts', "import type { c } from '../c';\nexport const d = 1;\nexport type X = typeof c;\n");
      const graph = buildGraph(sourceFiles(dir), null);
      expect(findCycles(graph).map((c) => c.map((f) => f.slice(dir.length + 1)))).toEqual([['a.ts', 'b.ts']]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('a back edge made by a dynamic import is not a cycle; the same edge made static is', () => {
    const dir = mkdtempSync(join(tmpdir(), 'g5-'));
    try {
      writeFileSync(join(dir, 'a.ts'), "export const a = () => import('./b');\n");
      writeFileSync(join(dir, 'b.ts'), "import { a } from './a';\nexport const b = a;\n");
      expect(findCycles(buildGraph(sourceFiles(dir), null))).toEqual([]);
      writeFileSync(join(dir, 'a.ts'), "import { b } from './b';\nexport const a = b;\n");
      expect(findCycles(buildGraph(sourceFiles(dir), null)).length).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it('resolves @/ to the alias and a folder to its index file', () => {
    const dir = mkdtempSync(join(tmpdir(), 'g5-'));
    try {
      mkdirSync(join(dir, 'x'));
      writeFileSync(join(dir, 'a.ts'), "import { x } from '@/x';\nexport const a = x;\n");
      writeFileSync(join(dir, 'x', 'index.ts'), "import { a } from '@/a';\nexport const x = a;\n");
      expect(findCycles(buildGraph(sourceFiles(dir), dir)).length).toBe(1);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe('[G5] hardening: strings, long lines, inline types, platform files', () => {
  it('a string holding "/*" does not swallow a real import (comment strip is string-aware)', () => {
    const src = "const g = 'src/*';\nimport a from './a';\nconst h = 'x/*.ts */';\nconst r = /a\\/*/;\nimport b from './b';";
    expect(importSpecifiers(src)).toEqual(['./a', './b']);
    expect(importSpecifiers("/* import x from './x'; */ import y from './y'; // import z from './z'")).toEqual(['./y']);
  });
  it('a 1.4 MB single line is read in linear time', () => {
    for (const word of ['export ', 'import ']) {
      const t0 = Date.now();
      expect(importSpecifiers(word.repeat(200000))).toEqual([]);
      expect(Date.now() - t0).toBeLessThan(3000);
    }
  });
  it('an inline type-only import is not an edge; a mixed one is', () => {
    expect(importSpecifiers("import { type A, type B } from './t';\nexport { type C } from './u';\nimport type D from './v';")).toEqual([]);
    expect(importSpecifiers("import { type A, b } from './m';\nimport d, { type E } from './n';\nimport type from './p';")).toEqual(['./m', './n', './p']);
  });
  it('a cycle through a platform file is found, and an unresolved relative import is reported', () => {
    const dir = mkdtempSync(join(tmpdir(), 'g5-'));
    try {
      writeFileSync(join(dir, 'a.ts'), "import { b } from './b';\nexport const a = b;\nimport './nope';\nimport './pic.png';\nimport '../outside';\n");
      writeFileSync(join(dir, 'b.ios.ts'), "import { a } from './a';\nexport const b = a;\n");
      const missing: string[] = [];
      const graph = buildGraph(sourceFiles(dir), null, missing);
      expect(findCycles(graph).length).toBe(1);
      expect(missing.map((m) => m.slice(dir.length + 1))).toEqual(['a.ts: ./nope']);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
