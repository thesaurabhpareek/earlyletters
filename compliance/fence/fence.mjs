#!/usr/bin/env node
// The compliance fence (CTO ruling CR-23; compliance/README.md). Decides whether a pull request may change
// protected compliance paths. Self-contained on purpose: .github/workflows/compliance-fence.yml fetches this
// file and compliance/FENCE.json from the BASE commit through the API and runs it on data it fetched itself.
// It never sees pull request code.
//
// Protected paths need an assigned agent plus the CCO and Karma on the head commit; cco_review paths need
// the CCO on the head commit (config.approvals, FENCE.json).
// Input (stdin, JSON): { config, files: [{ filename, previous_filename?, patch? }], labels: [name], headSha,
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

const anyMatch = (globs, path) => (globs ?? []).map(globToRegExp).some((r) => r.test(path));

// Which tier each changed path falls in: 'protected', 'cco_review' or none. A path is caught by its name, or,
// under content_markers.paths, by a marker in its diff. A file there with no diff (GitHub omits large ones)
// is treated as protected: fail closed.
export function classify(config, files) {
  const tiers = { protected: new Set(), cco_review: new Set() };
  const cm = config.content_markers ?? {};
  for (const f of files) {
    for (const p of [f.filename, f.previous_filename]) {
      if (!p) continue;
      if (anyMatch(config.protected, p)) { tiers.protected.add(p); continue; }
      if (anyMatch(cm.paths, p)) {
        if (typeof f.patch !== 'string') { if ('patch' in f) tiers.protected.add(p); continue; }
        if ((cm.protected ?? []).some((m) => f.patch.includes(m))) { tiers.protected.add(p); continue; }
        if ((cm.cco_review ?? []).some((m) => f.patch.includes(m))) { tiers.cco_review.add(p); continue; }
      }
      if (anyMatch(config.cco_review, p)) tiers.cco_review.add(p);
    }
  }
  return { protected: [...tiers.protected].sort(), cco_review: [...tiers.cco_review].sort() };
}

// Kept for callers that only want the protected tier.
export function protectedPaths(config, files) {
  return classify(config, files).protected;
}

export function decide({ config, files, labels, headSha, comments, trustedLogins }) {
  const reasons = [];
  const roles = config?.approvals && typeof config.approvals === 'object' ? Object.entries(config.approvals) : [];
  if (!config || !Array.isArray(config.protected) || !Array.isArray(config.assigned_agents) || !roles.length || !config.approvals.cco) {
    return { pass: false, reasons: ['FENCE.json on the base branch is missing or malformed; failing closed'] };
  }
  if (!Array.isArray(files) || !Array.isArray(labels) || !Array.isArray(comments) || !/^[0-9a-f]{40}$/.test(headSha ?? '')) {
    return { pass: false, reasons: ['incomplete pull request data; failing closed'] };
  }
  const tiers = classify(config, files);
  if (!tiers.protected.length && !tiers.cco_review.length) return { pass: true, reasons: ['no compliance path changed'] };
  if (tiers.protected.length) reasons.push(`protected paths changed: ${tiers.protected.join(', ')}`);
  if (tiers.cco_review.length) reasons.push(`paths needing CCO review changed: ${tiers.cco_review.join(', ')}`);

  // Protected: assigned agent label plus every approval role. CCO review only: the CCO approval.
  const needed = tiers.protected.length ? roles : roles.filter(([r]) => r === 'cco');
  const assigned = config.assigned_agents.filter((h) => labels.includes(`agent:${h}`));
  const labelOk = !tiers.protected.length || assigned.length > 0;
  if (!labelOk) reasons.push(`missing label: one of ${config.assigned_agents.map((h) => `agent:${h}`).join(', ')}`);

  const trusted = new Set(trustedLogins ?? []);
  const bodies = comments.filter((c) => trusted.has(c.login)).map((c) => c.body ?? '');
  const missing = [];
  for (const [role, pattern] of needed) {
    const line = new RegExp(pattern);
    const shas = bodies.flatMap((b) => b.split(/\r?\n/).map((l) => l.match(line)).filter(Boolean).map((m) => m[1]));
    if (!shas.includes(headSha)) {
      missing.push(role);
      reasons.push(shas.length
        ? `${role} approval is for an older commit (${[...new Set(shas)].join(', ')}); the head is ${headSha}`
        : `no ${role} approval for head ${headSha}`);
    }
  }
  const pass = labelOk && missing.length === 0;
  if (pass) reasons.push(`approved for ${headSha} by ${needed.map(([r]) => r).join(' and ')}${assigned.length ? `; assigned agent: ${assigned.join(', ')}` : ''}`);
  return { pass, reasons };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  let input;
  try { input = JSON.parse(readFileSync(0, 'utf8')); } catch { console.log('::error title=compliance-fence::unreadable input; failing closed'); process.exit(1); }
  const { pass, reasons } = decide(input);
  for (const r of reasons) console.log(pass ? r : `::error title=compliance-fence::${r}`);
  process.exit(pass ? 0 : 1);
}
