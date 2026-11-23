// Guard: new-device-fill is the only function that calls ops_new_device_pending_fill. The RPC trusts its caller for the profile and
// session (they come from a verified token there), so a second caller would be a second place that must get that right.
import assert from 'node:assert/strict';

const ROOT = new URL('../../', import.meta.url);
const RPC = 'ops_new_device_pending_fill';

function* tsFiles(dir: URL): Generator<URL> {
  for (const e of Deno.readDirSync(dir)) {
    const u = new URL(e.name + (e.isDirectory ? '/' : ''), dir);
    if (e.isDirectory) yield* tsFiles(u);
    else if (e.name.endsWith('.ts')) yield u;
  }
}

Deno.test('only new-device-fill (handler and its test) names ops_new_device_pending_fill under supabase/functions', () => {
  const hits: string[] = [];
  for (const f of tsFiles(ROOT)) {
    if (f.pathname.endsWith('/fill-caller.test.ts')) continue;
    if (Deno.readTextFileSync(f).includes(RPC)) hits.push(f.pathname.slice(ROOT.pathname.length));
  }
  assert.deepEqual(hits.sort(), ['new-device-fill/handler.ts', 'new-device-fill/test/handler.test.ts']);
});
