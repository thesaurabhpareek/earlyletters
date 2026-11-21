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
 * Test files are not nodes. A specifier that names no file (a package, a platform-suffixed or generated file the
 * reader cannot resolve) is not an edge; the count of resolved edges is asserted so a broken reader cannot pass.
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..', '..', '..');
const MOBILE_SRC = join(ROOT, 'apps', 'mobile', 'src');
const EXT = ['.ts', '.tsx'];

export function importSpecifiers(source: string): string[] {
  const src = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
  const out: string[] = [];
  const add = (re: RegExp, group: number, typeOnly?: number) => {
    for (let m = re.exec(src); m; m = re.exec(src)) if (typeOnly === undefined || m[typeOnly] === undefined) out.push(m[group]);
  };
  add(/\b(import|export)\s+(type\b)?[^'";]*?\bfrom\s*['"]([^'"]+)['"]/g, 3, 2);
  add(/\bimport\s*['"]([^'"]+)['"]/g, 1);
  add(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g, 1);
  return out;
}

export function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return sourceFiles(p);
    return /\.tsx?$/.test(name) && !/\.test\.tsx?$/.test(name) && !name.endsWith('.d.ts') ? [p] : [];
  });
}

/** Adjacency list of resolved value-import edges between the files given. `@/` maps to `alias`. */
export function buildGraph(files: string[], alias: string | null): Map<string, string[]> {
  const known = new Set(files);
  const find = (base: string) => [base, ...EXT.map((e) => base + e), ...EXT.map((e) => join(base, 'index' + e))].find((c) => known.has(c));
  const graph = new Map<string, string[]>();
  for (const file of files) {
    const edges = new Set<string>();
    for (const spec of importSpecifiers(readFileSync(file, 'utf8'))) {
      const base = spec.startsWith('.') ? resolve(dirname(file), spec) : alias && spec.startsWith('@/') ? join(alias, spec.slice(2)) : null;
      const hit = base && find(base);
      if (hit) edges.add(hit);
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
  { name: 'apps/mobile/src', dir: MOBILE_SRC, alias: MOBILE_SRC, minFiles: 400, minEdges: 1000 },
  { name: 'packages/core/src', dir: join(ROOT, 'packages', 'core', 'src'), alias: null, minFiles: 20, minEdges: 20 },
  { name: 'packages/api/src', dir: join(ROOT, 'packages', 'api', 'src'), alias: null, minFiles: 20, minEdges: 10 },
  { name: 'packages/content/src', dir: join(ROOT, 'packages', 'content', 'src'), alias: null, minFiles: 10, minEdges: 5 },
  { name: 'packages/analytics/src', dir: join(ROOT, 'packages', 'analytics', 'src'), alias: null, minFiles: 10, minEdges: 10 },
];

describe('[G5] no circular imports (ratchet at zero)', () => {
  for (const r of ROOTS) {
    it(`[G5] ${r.name} has no import cycle`, () => {
      const files = sourceFiles(r.dir);
      const graph = buildGraph(files, r.alias);
      const edges = [...graph.values()].reduce((n, e) => n + e.length, 0);
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
