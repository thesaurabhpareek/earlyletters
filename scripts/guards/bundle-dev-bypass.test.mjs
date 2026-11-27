// node --test scripts/guards/bundle-dev-bypass.test.mjs (wired into the root `npm test` list).
// The fixtures copy the shape of a real `expo export --platform ios --no-bytecode` production bundle
// (27 Nov 2026): Metro's module wrapper, its export getter, and the two places onContinueDev survives.
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { check, flagValues, main, ungatedHandlers } from './bundle-dev-bypass.mjs';

const buildEnv = (value) =>
  `__d(function(g,r,i,a,m,e,d){Object.defineProperty(e,"APP_ENV",{enumerable:!0,get:function(){return l}}),Object.defineProperty(e,"devShortcutsAllowed",{enumerable:!0,get:function(){return f}});var t='development';var l=u("production")??t,f=${value}},2069,[]);`;
const plusGate = `__d(function(g,r,i,a,m,e,d){_e.PlusGate=function({childName:e,lapsed:t=!1,onDismiss:G,onContinueDev:F}){var A=1},2070,[2069]);`;
const review = (handler = 'Y.devShortcutsAllowed?()=>{ui.current=!0,$e(null)}:void 0') => `__d(function(g,r,i,a,m,e,d){(0,ge.jsx)(Z,{onPlus:()=>$e(null),onDismiss:()=>$e(null),onContinueDev:${handler}})},2071,[2069,2070]);`;
const PRODUCTION = buildEnv('!1') + plusGate + review();
const quiet = () => {};
const exportDir = (files) => {
  const d = mkdtempSync(join(tmpdir(), 'dev-bypass-'));
  for (const [f, c] of Object.entries(files)) {
    mkdirSync(join(d, f, '..'), { recursive: true });
    writeFileSync(join(d, f), c);
  }
  return d;
};

test('[BL-216] a production-shaped bundle passes: the flag is !1 and the one handler is behind it', () => {
  assert.deepEqual(flagValues(PRODUCTION).map((v) => v.value), ['!1']);
  assert.deepEqual(ungatedHandlers(PRODUCTION), []);
  assert.deepEqual(check([PRODUCTION]), []);
});

test('[BL-216] a true devShortcutsAllowed fails, and so does any value not a constant false', () => {
  assert.equal(check([buildEnv('!0') + plusGate + review()]).length, 1);
  // What a --dev export holds (measured): the expression itself, not a constant.
  const dev = buildEnv("'undefined'!=typeof __DEV__&&!0===__DEV__&&'development'===l");
  assert.match(check([dev + plusGate + review()])[0], /not a constant false/);
  assert.equal(check(['exports.devShortcutsAllowed = true;' + plusGate]).length, 1);
});

test('[BL-216] an onContinueDev handler that no flag check guards fails, even with the flag off', () => {
  for (const h of ['()=>{ui.current=!0}', 'function(){x()}', '!0?()=>{}:void 0']) {
    const r = check([buildEnv('!1') + plusGate + review(h)]);
    assert.equal(r.length, 1, h);
    assert.match(r[0], /onContinueDev is given a value/);
  }
  assert.deepEqual(ungatedHandlers('{onContinueDev:(0,o.devShortcutsAllowed)?()=>{}:void 0}'), []);
});

test('[BL-2125] a bundle with no devShortcutsAllowed fails closed: a search that cannot see the flag proves nothing', () => {
  assert.match(check(['__d(function(){var x=1},1,[]);'])[0], /not in the bundle/);
});

test('[BL-2125] the command: clean export 0, planted onContinueDev 1, bytecode only or no input 2', () => {
  assert.equal(main([exportDir({ '_expo/static/js/ios/entry.js': PRODUCTION, 'metadata.json': '{}' })], quiet, quiet), 0);
  assert.equal(main([exportDir({ '_expo/static/js/ios/entry.js': buildEnv('!1') + plusGate + review('()=>{}') })], quiet, quiet), 1);
  assert.equal(main([exportDir({ '_expo/static/js/ios/entry.hbc': 'HBC' })], quiet, quiet), 2);
  assert.equal(main([], quiet, quiet), 2);
  assert.equal(main([join(tmpdir(), 'no-such-export-bl2125')], quiet, quiet), 2);
});
