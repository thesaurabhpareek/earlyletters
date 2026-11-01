#!/usr/bin/env node
// Workflow lint (HV2-B11, requirement HV2-017; SEC-R10, SEC-R11).
//
// Rules:
//   pin   every `uses:` that is not local (./) must end in @<40 hex characters> (SEC-R10).
//   prt   a workflow triggered by `pull_request_target` must not check out PR head code, run
//         `gh pr checkout` or fetch pull refs, and must not interpolate PR title, body or head ref
//         into a `run:` line outside `env:` (SEC-R11).
//
// Usage (from the repo root, no install needed, Node 22+):
//   node scripts/ci/workflow-lint.mjs                      lint .github/workflows
//   node scripts/ci/workflow-lint.mjs path/a.yml dir/      lint named files or directories
// Output: one `file:line: rule: message` per finding. Exit 1 if any finding, 0 if none.
//
// Expected output on develop at 60136e51: 17 `pin` findings (tag pins), 0 `prt` findings:
//   ci.yml 31 32 38 55 70 81 92; migration-guard.yml 20 23; web-e2e.yml 43 45 50 61 77; web.yml 52 54 61.
//
// Limits: a line-based reader, not a YAML parser. It does not see `uses:` built by expansion, does not
// follow reusable workflows or composite actions, and a determined author can defeat the prt rule by
// indirection (for example a script that checks out the head). It is a tripwire for honest mistakes,
// not a security boundary. Not wired into any workflow or package.json (founder applies, HV2-B20).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const SHA40 = /@[0-9a-f]{40}$/;
const HEADISH = /head|refs\/pull|merge/i;

const indentOf = (l) => l.length - l.trimStart().length;
const isComment = (l) => /^\s*#/.test(l);
const clean = (v) => v.replace(/\s+#.*$/, '').trim().replace(/^['"]|['"]$/g, '');

export function lintText(file, text) {
  const lines = text.split(/\r?\n/);
  const out = [];
  const add = (n, rule, message) => out.push({ file, line: n + 1, rule, message });

  // Rule: pin
  lines.forEach((l, i) => {
    if (isComment(l)) return;
    const m = l.match(/^\s*(?:-\s+)?uses:\s*(.+)$/);
    if (!m) return;
    const ref = clean(m[1]);
    if (ref.startsWith('./')) return;
    if (!SHA40.test(ref)) add(i, 'pin', `not pinned to a 40-character sha: ${ref}`);
  });

  // Rule: prt
  const triggered = lines.some((l) => !isComment(l) && /\bpull_request_target\b/.test(l));
  if (!triggered) return out;

  lines.forEach((l, i) => {
    if (isComment(l)) return;
    if (/^\s*(?:-\s+)?uses:\s*actions\/checkout\b/.test(l)) {
      // Step window: from the step's first line to just before the next step.
      let start = i;
      while (start > 0 && !/^\s*-\s/.test(lines[start])) start--;
      const stepIndent = indentOf(lines[start]);
      let end = i + 1;
      while (end < lines.length && (lines[end].trim() === '' || indentOf(lines[end]) > stepIndent)) end++;
      for (let j = start; j < end; j++) {
        const kv = lines[j].match(/^\s*(?:-\s+)?(ref|repository):\s*(.+)$/);
        if (kv && !isComment(lines[j]) && HEADISH.test(clean(kv[2]))) {
          add(j, 'prt', `pull_request_target checks out PR code (${kv[1]}: ${clean(kv[2])})`);
        }
      }
    }
    if (/\bgh\s+pr\s+checkout\b|\bgit\s+(fetch|pull|checkout)\b[^\n]*(refs\/pull|pull\/\d|pull_request\.head)/.test(l)) {
      add(i, 'prt', 'pull_request_target fetches or checks out PR code in a run step');
    }
  });

  let envIndent = -1;
  lines.forEach((l, i) => {
    if (l.trim() === '' || isComment(l)) return;
    const ind = indentOf(l);
    if (envIndent >= 0 && ind <= envIndent) envIndent = -1;
    if (/^\s*env:\s*$/.test(l)) { envIndent = ind; return; }
    if (envIndent >= 0) return;
    if (/\$\{\{\s*github\.event\.pull_request\.(title|body|head\.ref)\s*\}\}/.test(l)) {
      add(i, 'prt', 'PR title, body or head ref interpolated outside env: (script injection)');
    }
  });
  return out.sort((a, b) => a.line - b.line);
}

function collect(target) {
  if (statSync(target).isDirectory()) {
    return readdirSync(target).filter((f) => /\.ya?ml$/.test(f)).sort().map((f) => join(target, f));
  }
  return [target];
}

export function lintPaths(paths) {
  return paths.flatMap(collect).flatMap((f) => lintText(f, readFileSync(f, 'utf8')));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const args = process.argv.slice(2);
  const findings = lintPaths(args.length ? args : ['.github/workflows']);
  for (const f of findings) console.log(`${f.file}:${f.line}: ${f.rule}: ${f.message}`);
  const n = (r) => findings.filter((f) => f.rule === r).length;
  console.log(`${findings.length} finding(s): ${n('pin')} pin, ${n('prt')} prt`);
  process.exit(findings.length ? 1 : 0);
}
