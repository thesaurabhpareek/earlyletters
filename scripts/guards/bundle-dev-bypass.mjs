#!/usr/bin/env node
// Release-bundle dev-bypass check (BL-2125, from BL-216 and BL-117): no dev shortcut can run in a preview
// or production build. Feed it the `expo export --no-bytecode` output of a preview or production profile;
// the CI step that exports is proposed in docs/ops/proposed/bl-2125-ci-scans.md.
//
//   node scripts/guards/bundle-dev-bypass.mjs <export dir or .js bundle> [...more]
//
// It reads the bundle as text and never evaluates it. It fails when:
//   1. `devShortcutsAllowed` (apps/mobile/src/lib/build-env.ts) is anything but a constant false in the
//      bundle, or cannot be found there (a search that cannot see the flag proves nothing, so it fails closed);
//   2. `onContinueDev` (components/child/plus-gate.tsx) is handed a value that is not behind that flag. Only
//      three shapes pass: `onContinueDev: <x>.devShortcutsAllowed ? ... : ...`; a property read
//      (`<x>.onContinueDev`); and a name inside a destructuring pattern, the receiving side (a function's
//      parameter `function({onContinueDev:F}){` or an assignment `{onContinueDev:F}=`). A name handed in an
//      object literal (`{onContinueDev:h}`), a shorthand or anything else fails, because the name may hold an
//      ungated handler (review of #2140).
// Why not a plain grep for `onContinueDev`: minification keeps property names, so the prop name is in every
// production export (measured 27 Nov 2026: two hits, both gated). What must hold is that the gate is a
// constant false and every handler sits behind it.
// Exit 0 clean, 1 a bypass can reach the build, 2 usage or nothing readable (Hermes bytecode is not text).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const FLAG = 'devShortcutsAllowed';
const HANDLER = 'onContinueDev';
const FALSE = new Set(['!1', 'false']);
const esc = (s) => s.replace(/[$]/g, '\\$');

/** Where each module of a Metro bundle starts; text outside any wrapper counts as one module. */
function moduleAround(text, at) {
  const start = text.lastIndexOf('__d(function', at);
  const next = text.indexOf('__d(function', at);
  return text.slice(start === -1 ? 0 : start, next === -1 ? text.length : next);
}

/** Every value the flag is given in one bundle text: [{ value, how }]. */
export function flagValues(text) {
  const out = [];
  // Metro's ES module export: Object.defineProperty(e,"devShortcutsAllowed",{enumerable:!0,get:function(){return f}})
  const getter = new RegExp(`defineProperty\\(\\s*[\\w$]+\\s*,\\s*["']${FLAG}["']\\s*,\\s*\\{[^}]*?get\\s*:\\s*function\\s*\\(\\)\\s*\\{\\s*return\\s+([\\w$]+)`, 'g');
  for (const m of text.matchAll(getter)) {
    const mod = moduleAround(text, m.index);
    const assign = new RegExp(`(?:^|[^\\w$.])${esc(m[1])}\\s*=(?!=)\\s*([^,;})]+)`, 'g');
    const values = [...mod.matchAll(assign)].map((a) => a[1].trim());
    if (!values.length) out.push({ value: null, how: `the getter returns ${m[1]}, which is never assigned in its module` });
    for (const v of values) out.push({ value: v, how: `${m[1]} = ${v}` });
  }
  // A CommonJS-style export: exports.devShortcutsAllowed = ...
  for (const m of text.matchAll(new RegExp(`\\.${FLAG}\\s*=(?!=)\\s*([^,;})]+)`, 'g'))) out.push({ value: m[1].trim(), how: `.${FLAG} = ${m[1].trim()}` });
  return out;
}

const GATED = new RegExp(`^\\s*:\\s*(?:\\(\\s*0\\s*,\\s*)?(?:[\\w$]+\\.)?${FLAG}\\s*\\)?\\s*\\?`);
const NAMED = /^\s*(?::\s*[\w$]+\s*)?(?:[,}]|=\s*void 0\s*[,}])/;

/**
 * For `flag ? A : B` starting just after the `?`: true only when B, the branch a false flag takes, is empty
 * (`void 0`, `null` or `undefined`). `flag ? void 0 : h` hands h over exactly when the flag is off (review of #2140).
 */
export function offWhenFalse(text, from) {
  let depth = 0;
  let pending = 0; // nested `?` waiting for their `:`
  for (let i = from; i < text.length; i += 1) {
    const c = text[i];
    if (c === '{' || c === '(' || c === '[') depth += 1;
    else if (c === '}' || c === ')' || c === ']') { if (depth === 0) return false; depth -= 1; }
    else if (depth === 0 && c === '?') pending += 1;
    else if (depth === 0 && c === ':') {
      if (pending > 0) { pending -= 1; continue; }
      return /^\s*(?:void 0|null|undefined)\s*[,})]/.test(text.slice(i + 1, i + 40));
    }
    else if (depth === 0 && c === ',') return false;
  }
  return false;
}

/** True when the object holding text[at] is a destructuring pattern: it closes into `){` or `)=>` (a parameter) or `=`. */
export function inPattern(text, at) {
  let depth = 0;
  for (let i = at; i < text.length; i += 1) {
    const c = text[i];
    if (c === '{' || c === '(' || c === '[') depth += 1;
    else if (c === ')' || c === ']') depth -= 1;
    else if (c === '}') {
      if (depth === 0) return /^\s*(?:\)\s*(?:\{|=>)|=(?![=>]))/.test(text.slice(i + 1, i + 40));
      depth -= 1;
    }
    if (depth < 0) return false;
  }
  return false;
}

/** Each `onContinueDev` whose value is not behind the flag, with a little of the text after it. */
export function ungatedHandlers(text) {
  const out = [];
  for (let at = text.indexOf(HANDLER); at !== -1; at = text.indexOf(HANDLER, at + HANDLER.length)) {
    const after = text.slice(at + HANDLER.length, at + HANDLER.length + 120);
    if (text[at - 1] === '.' && !/^\s*=(?!=)/.test(after)) continue; // a property read, not a value handed in
    if (GATED.test(after) && offWhenFalse(text, at + HANDLER.length + after.indexOf('?') + 1)) continue;
    if (NAMED.test(after) && inPattern(text, at + HANDLER.length)) continue;
    out.push(`${HANDLER}${after.slice(0, 60)}`);
  }
  return out;
}

/** The findings for a set of bundle texts. Empty means clean. */
export function check(texts) {
  const findings = [];
  const values = texts.flatMap(flagValues);
  if (!values.length) findings.push(`${FLAG} is not in the bundle, so nothing proves it is off. Export with --no-bytecode, and check apps/mobile/src/lib/build-env.ts still exports it.`);
  for (const v of values) if (!FALSE.has(v.value)) findings.push(`${FLAG} is not a constant false (${v.how}): a dev shortcut can run in this build.`);
  for (const h of texts.flatMap(ungatedHandlers)) findings.push(`${HANDLER} is given a value no ${FLAG} check guards: ${h}`);
  return findings;
}

function bundleFiles(p) {
  if (!statSync(p).isDirectory()) return [p];
  return readdirSync(p).flatMap((n) => bundleFiles(join(p, n)));
}

export function main(argv, log = console.log, err = console.error) {
  if (!argv.length || argv.some((a) => a.startsWith('--'))) {
    err('usage: node scripts/guards/bundle-dev-bypass.mjs <export dir or .js bundle> [...more]');
    return 2;
  }
  const missing = argv.filter((p) => !existsSync(p));
  if (missing.length) {
    err(`bundle-dev-bypass: not found: ${missing.join(', ')}`);
    return 2;
  }
  const files = argv.flatMap((p) => bundleFiles(resolve(p)));
  const js = files.filter((f) => f.endsWith('.js'));
  if (!js.length) {
    err(`bundle-dev-bypass: no .js bundle in ${argv.join(', ')}${files.some((f) => f.endsWith('.hbc')) ? ' (only Hermes bytecode: export with --no-bytecode)' : ''}`);
    return 2;
  }
  const findings = check(js.map((f) => readFileSync(f, 'utf8')));
  if (findings.length) {
    err(`bundle-dev-bypass: ${findings.length} finding(s) in ${js.length} bundle file(s) (BL-216, BL-2125)\n${findings.map((s) => `  ${s}`).join('\n')}`);
    return 1;
  }
  log(`bundle-dev-bypass: clean. ${FLAG} is a constant false and every ${HANDLER} is behind it (${js.length} bundle file(s)).`);
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
