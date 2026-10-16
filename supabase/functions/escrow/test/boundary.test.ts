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
const specifiers = (src: string) => [...src.matchAll(/(?:import|export)[^'"]*?from\s*['"]([^'"]+)['"]|import\(\s*['"]([^'"]+)['"]\s*\)/g)].map((m) => m[1] ?? m[2]);

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
