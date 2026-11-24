#!/usr/bin/env node
// Which ids a flow taps (directly or through the subflows it runs) are still
// listed in not-in-app.txt, i.e. the app does not set them yet. A flow with any
// is BLOCKED: it fails at that selector by design, so bin/run-suite.sh and
// bin/run-p0-nightly.sh skip it and print these ids as the reason, and
// bin/lint-flows.mjs requires a `# BLOCKED` header line in the flow.
//
//   node apps/mobile/e2e/bin/blocked-ids.mjs <path/to/flow.yaml>   (one id per line; nothing when not blocked)
import { readFileSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const E2E = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function baselineIds(e2e = E2E) {
  const p = join(e2e, 'not-in-app.txt');
  return new Set((existsSync(p) ? readFileSync(p, 'utf8') : '').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')));
}

/** Ids tapped or asserted by a flow file and, recursively, the flow files it runs. */
export function idsUsedBy(YAML, flowPath, seen = new Set()) {
  const path = resolve(flowPath);
  const out = new Set();
  if (seen.has(path) || !existsSync(path)) return out;
  seen.add(path);
  const docs = YAML.parseAllDocuments(readFileSync(path, 'utf8'));
  const visit = (n) => {
    if (Array.isArray(n)) n.forEach(visit);
    else if (n && typeof n === 'object') {
      if (typeof n.id === 'string') out.add(n.id);
      const ref = typeof n.runFlow === 'string' ? n.runFlow : n.runFlow?.file;
      if (ref) for (const id of idsUsedBy(YAML, resolve(dirname(path), ref), seen)) out.add(id);
      Object.values(n).forEach(visit);
    }
  };
  visit(docs[1]?.toJS());
  return out;
}

export function blockedIds(YAML, flowPath, e2e = E2E) {
  const base = baselineIds(e2e);
  return [...idsUsedBy(YAML, flowPath)].filter((id) => base.has(id)).sort();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const flow = process.argv[2];
  if (!flow) { console.error('usage: blocked-ids.mjs <flow.yaml>'); process.exit(2); }
  const YAML = await import('yaml');
  for (const id of blockedIds(YAML, flow)) console.log(id);
}
