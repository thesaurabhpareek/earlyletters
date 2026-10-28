// Grades whether guidance still sends agents to a retired mechanism.
// D-117 (23 Oct 2026): the approve-migration label is no longer used and no
// workflow reads it. The rule that replaced it: two independent passing reviews
// on the current head, green CI, then the coordinator merges. The review
// requirement must survive the repair; only the label goes.
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const LIVE = [
  '.claude/agents/data-architect.md',
  '.claude/agents/security.md',
  'agents/data-architect/MEMORY.md',
  'docs/engineering/06-security-engineering.md',
];
const HISTORY = {
  'docs/DECISIONS.md': '2ed62aef0606414eaf18e547752e6856de64455d61fda966611efe19f429e18a',
  'docs/ops/DEPLOY.md': '493d87952b849f40e62093725924cc9af784617b290e611f519b2d02b58d35a5',
};
const LABEL = /approve[- ]migration/i;
const RETIRED = /(no longer used|no longer|retired|superseded|not used)/i;

export function grade({ workdir }) {
  for (const [f, sha] of Object.entries(HISTORY)) {
    const p = join(workdir, f);
    if (!existsSync(p)) return { pass: false, reason: `${f} was deleted` };
    if (createHash('sha256').update(readFileSync(p)).digest('hex') !== sha) {
      return { pass: false, reason: `${f} was edited; it is the decision record or the already-correct runbook, and is not part of the repair` };
    }
  }
  const stillGated = [];
  for (const f of LIVE) {
    const p = join(workdir, f);
    if (!existsSync(p)) return { pass: false, reason: `${f} was deleted; guidance is repaired, not removed` };
    const lines = readFileSync(p, 'utf8').split('\n');

    lines.forEach((l, i) => {
      if (LABEL.test(l) && !(/D-117/.test(l) && RETIRED.test(l))) stillGated.push(`${f}:${i + 1}`);
    });

  }
  if (stillGated.length) {
    return { pass: false, reason: `${stillGated.length} lines still send agents to the retired approve-migration label as a requirement: ${stillGated.join(', ')}` };
  }
  for (const f of LIVE) {
    const lines = readFileSync(join(workdir, f), 'utf8').split('\n');
    // The review gate must survive: the rule that replaced the label, under D-117.
    const kept = lines.some((l) => /D-117/.test(l) && /two independent/i.test(l) && /\bCI\b/.test(l) && /coordinator/i.test(l));
    if (!kept) {
      return { pass: false, reason: `${f} no longer states the rule that replaced the label (two independent passing reviews, green CI, coordinator merges; D-117); removing the label must not remove the gate` };
    }
  }
  return { pass: true, reason: 'no live guidance requires the retired label; each file states the D-117 rule; history and runbook untouched' };
}
