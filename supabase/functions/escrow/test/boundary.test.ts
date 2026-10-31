// The trust boundary in code (F08 6.5 G3, F08-REQ-034 source part): the escrow function imports
// nothing remote (no npm:, jsr:, http(s): or esm.sh specifiers) and nothing from outside its own
// folder, so no main-project or third-party code runs next to the escrow key. Only index.ts reads
// the environment, and nothing writes to the console except the handler's one log sink.
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? files(p) : /\.(ts|json)$/.test(f) ? [p] : [];
});
const sources = files(root).filter((f) => f.endsWith('.ts') && !relative(root, f).startsWith('test'));
// Every module specifier a file names (review B S5 on PR #151): static imports and re-exports,
// side-effect imports (a bare quoted specifier after the keyword), and dynamic imports with a
// quoted or template-literal argument. A dynamic import whose argument is anything else (a
// variable, or a template with a placeholder) cannot be checked, so it is refused outright.
const STATIC = /\b(?:import|export)\b[^'"`;]*?\bfrom\s*(['"`])([^'"`]+)\1/g;
const SIDE_EFFECT = /\bimport\s*(['"`])([^'"`]+)\1/g;
const DYNAMIC = /\bimport\s*\(\s*(['"`])([^'"`$]*)\1\s*\)/g;
const NON_LITERAL_DYNAMIC = /\bimport\s*\(\s*(?!(['"`])[^'"`$]*\1\s*\))/;
const specifiers = (src: string) => [STATIC, SIDE_EFFECT, DYNAMIC].flatMap((re) => [...src.matchAll(re)].map((m) => m[2]));

Deno.test('[review B S5] the specifier check sees side-effect, re-export and template-literal dynamic imports', () => {
  // Built from pieces so this file's own source never holds the import statements it checks for.
  const I = 'imp' + 'ort';
  const E = 'exp' + 'ort';
  const tick = String.fromCharCode(96);
  assert.deepEqual(specifiers(`${I} 'npm:left-pad';`), ['npm:left-pad']);
  assert.deepEqual(specifiers(`const m = await ${I}(${tick}jsr:@std/x${tick});`), ['jsr:@std/x']);
  assert.deepEqual(specifiers(`${E} * from "https://esm.sh/x";`), ['https://esm.sh/x']);
  assert.deepEqual(specifiers(`${I} { a } from './a.ts';\n${I} type { B } from "./b.ts";`), ['./a.ts', './b.ts']);
  assert.ok(NON_LITERAL_DYNAMIC.test(`await ${I}(name)`));
  assert.ok(NON_LITERAL_DYNAMIC.test(`await ${I}(${tick}./\${x}.ts${tick})`));
  assert.ok(!NON_LITERAL_DYNAMIC.test(`await ${I}('./hpke.ts')`));
});

Deno.test('[review B S5] no dynamic import with an argument that cannot be checked', () => {
  for (const f of files(root)) assert.ok(!NON_LITERAL_DYNAMIC.test(readFileSync(f, 'utf8')), `${relative(root, f)} has a dynamic import that is not a plain literal`);
});

Deno.test('[F08-REQ-034] no remote import specifier anywhere in supabase/functions/escrow', () => {
  for (const f of files(root)) {
    const src = readFileSync(f, 'utf8');
    for (const s of specifiers(src)) assert.ok(!/^(npm:|jsr:|https?:|node:)|esm\.sh/.test(s) || (f.includes('/test/') && s.startsWith('node:')), `${relative(root, f)} imports ${s}`);
  }
  const deno = JSON.parse(readFileSync(join(root, 'deno.json'), 'utf8'));
  assert.deepEqual(deno.imports, {}, 'no import map entries');
});

Deno.test('[F08-REQ-034] no import reaches outside the escrow folder', () => {
  for (const f of files(root)) {
    for (const s of specifiers(readFileSync(f, 'utf8'))) {
      if (s.startsWith('node:')) continue;
      const target = normalize(join(dirname(f), s));
      assert.ok(target.startsWith(root + '/') || target === root, `${relative(root, f)} imports ${s} from outside the folder`);
    }
  }
});

Deno.test('only index.ts reads the environment; the handler\'s log sink is the only console use', () => {
  for (const f of sources) {
    const src = readFileSync(f, 'utf8');
    const name = relative(root, f);
    if (name !== 'index.ts') assert.ok(!/Deno\.env|\.env\.get/.test(src), `${name} reads the environment`);
    const uses = src.match(/console\.(log|info|warn|error|debug)/g) ?? [];
    assert.ok(name === 'handler.ts' ? uses.length === 1 : uses.length === 0, `${name} writes to the console`);
  }
});

Deno.test('the generated email file is the only one that names the product (it comes from packages/brand)', () => {
  for (const f of sources) {
    if (relative(root, f) === 'email/templates.ts') continue;
    assert.ok(!/Early Letters/.test(readFileSync(f, 'utf8')), `${relative(root, f)} hardcodes the public name`);
  }
});
