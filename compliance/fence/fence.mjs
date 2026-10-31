#!/usr/bin/env node
// The compliance fence (CTO ruling CR-23; compliance/README.md). Decides whether a pull request may change
// protected compliance paths. Self-contained on purpose: .github/workflows/compliance-fence.yml fetches this
// file and compliance/FENCE.json from the BASE commit through the API and runs it on data it fetched itself.
// It never sees pull request code.
//
// Both the Chief Compliance Officer and Karma must approve the head commit (config.approvals).
// Input (stdin, JSON): { config, files: [{ filename, previous_filename? }], labels: [name], headSha,
//   comments: [{ body, login }], trustedLogins: [login] }
// Output: one line per reason, and exit 0 (pass) or 1 (fail). Any malformed input fails closed.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export function globToRegExp(glob) {
  let re = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*' && glob[i + 1] === '*') { re += '.*'; i++; if (glob[i + 1] === '/') i++; }
    else if (c === '*') re += '[^/]*';
    else if (c === '?') re += '[^/]';
    else re += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  }
  return new RegExp(`^${re}$`);
}

export function protectedPaths(config, files) {
  const res = config.protected.map(globToRegExp);
  const touched = new Set();
  for (const f of files) {
    for (const p of [f.filename, f.previous_filename]) {
      if (p && res.some((r) => r.test(p))) touched.add(p);
    }
  }
  return [...touched].sort();
}

export function decide({ config, files, labels, headSha, comments, trustedLogins }) {
  const reasons = [];
  const roles = config?.approvals && typeof config.approvals === 'object' ? Object.entries(config.approvals) : [];
  if (!config || !Array.isArray(config.protected) || !Array.isArray(config.assigned_agents) || !roles.length) {
    return { pass: false, reasons: ['FENCE.json on the base branch is missing or malformed; failing closed'] };
  }
  if (!Array.isArray(files) || !Array.isArray(labels) || !Array.isArray(comments) || !/^[0-9a-f]{40}$/.test(headSha ?? '')) {
    return { pass: false, reasons: ['incomplete pull request data; failing closed'] };
  }
  const touched = protectedPaths(config, files);
  if (!touched.length) return { pass: true, reasons: ['no protected compliance path changed'] };
  reasons.push(`protected paths changed: ${touched.join(', ')}`);

  const assigned = config.assigned_agents.filter((h) => labels.includes(`agent:${h}`));
  if (!assigned.length) reasons.push(`missing label: one of ${config.assigned_agents.map((h) => `agent:${h}`).join(', ')}`);

  // Every role in config.approvals (CCO and Karma) must have approved this exact head commit.
  const trusted = new Set(trustedLogins ?? []);
  const bodies = comments.filter((c) => trusted.has(c.login)).map((c) => c.body ?? '');
  const missing = [];
  for (const [role, pattern] of roles) {
    const line = new RegExp(pattern);
    const shas = bodies.map((b) => b.split(/\r?\n/).map((l) => l.match(line)).find(Boolean)).filter(Boolean).map((m) => m[1]);
    if (!shas.includes(headSha)) {
      missing.push(role);
      reasons.push(shas.length
        ? `${role} approval is for an older commit (${shas.join(', ')}); the head is ${headSha}`
        : `no ${role} approval for head ${headSha}`);
    }
  }
  const pass = assigned.length > 0 && missing.length === 0;
  if (pass) reasons.push(`approved for ${headSha} by ${roles.map(([r]) => r).join(' and ')}; assigned agent: ${assigned.join(', ')}`);
  return { pass, reasons };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  let input;
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { console.log('::error title=compliance-fence::unreadable input; failing closed'); process.exit(1); }
  const { pass, reasons } = decide(input);
  for (const r of reasons) console.log(pass ? r : `::error title=compliance-fence::${r}`);
  process.exit(pass ? 0 : 1);
}
