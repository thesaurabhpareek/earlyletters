/**
 * The back-office docs (BL-2102): the data-requests runbook holds the weekly clock, same-day triage and the
 * letters-from-lawyers line; the founder-cannot-act plan exists and holds nothing a second person could use before
 * the policy sentence changes; the accountant brief is linked from the founder tasks with its trigger. The clock
 * itself is tested in scripts/ops/test/weekly-card.test.ts. If this fails, fix the doc, not the test.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const REPO = join(__dirname, '..', '..', '..');
const read = (p: string) => readFileSync(join(REPO, p), 'utf8');
const RUNBOOK = read('docs/ops/runbooks/data-requests-by-email.md');
const PLAN = read('docs/ops/runbooks/founder-cannot-act.md');
const TASKS = read('docs/FOUNDER_TASKS.md');
const WEEKLY = read('scripts/ops/lib/weekly-card.ts');

/** The section of a markdown file under a heading that starts with `start`, up to the next heading of that level. */
function section(text: string, start: string): string {
  const at = text.indexOf(`\n${start}`);
  if (at < 0) return '';
  const level = start.match(/^#+/)![0];
  const rest = text.slice(at + 1);
  const end = rest.slice(1).search(new RegExp(`\\n${level} `));
  return end < 0 ? rest : rest.slice(0, end + 1);
}

/** The kinds the runbook's log table allows, in order. */
function runbookKinds(): string[] {
  const line = RUNBOOK.split('\n').find((l) => /^\s*\| kind \|/.test(l)) ?? '';
  return [...line.matchAll(/`([a-z_0-9]+)`/g)].map((m) => m[1]);
}

describe('the data-requests runbook', () => {
  it('[FR-BKO-09] holds the weekly card: the command, day 35 first, the extension notice before day 45, and day 45 as a P0', () => {
    const card = section(RUNBOOK, '## 11. The weekly card (FR-BKO-09)');
    expect(card).toContain('node scripts/ops/weekly-card.ts --log');
    expect(card).toMatch(/day 35 or later comes first/);
    expect(card).toMatch(/extension notice with its reason before day 45/);
    expect(card).toMatch(/Past day 45 with no notice.*P0 defect.*counsel the same day/s);
    expect(RUNBOOK).toMatch(/^\s*\| next_action \|/m);
    expect(RUNBOOK).toContain('Sections are numbered 0 to 11.');
  });

  it('[FR-BKO-09] the kinds the runbook allows are exactly the kinds the weekly card reads', () => {
    const code = WEEKLY.match(/export const KINDS = \[([\s\S]*?)\] as const;/)?.[1] ?? '';
    const cardKinds = [...code.matchAll(/'([a-z_0-9]+)'/g)].map((m) => m[1]);
    expect(cardKinds.length).toBeGreaterThan(5);
    expect(runbookKinds()).toEqual(cardKinds);
  });

  it('[FR-BKO-13] triage is the same day, with a ticket and a kind, no free text, and one first reply that never says whether an account exists', () => {
    const receive = section(RUNBOOK, '## 1. Receive it');
    expect(receive).toMatch(/Triage happens the day you read it \(FR-BKO-13\)/);
    expect(receive).toMatch(/not a published time/);
    expect(receive).toMatch(/No person id, no email, no name, no code, no free text/);
    expect(runbookKinds()).toEqual(expect.arrayContaining(['safety', 'abuse_report']));
    const abuse = RUNBOOK.split('\n').find((l) => l.includes('(kind `abuse_report`)')) ?? '';
    expect(abuse).toMatch(/the day you read it/);
    expect(abuse).toMatch(/no free text/);
    expect(abuse).toMatch(/never says whether an account exists/);
    expect(abuse).toMatch(/Change nothing on any account/);
  });

  it('[FR-BKO-16] letters from lawyers, courts and the police: no action, no disclosure, no reply until counsel says so, the date logged, the kind and date only to the CLO', () => {
    const legal = RUNBOOK.split('\n').find((l) => l.includes('(kind `legal_process`)')) ?? '';
    expect(legal).toMatch(/No action, no disclosure, and no reply until counsel says so/);
    expect(legal).toMatch(/`legal_date`/);
    expect(legal).toMatch(/the kind and the date only, never the document/);
    expect(legal).toMatch(/`ops\.audit_log` row with runbook `legal_process` only when a step touches data/);
  });

  it('[FR-BKO-13] adds no deletion promise: the closed route stays closed (CR-187)', () => {
    expect(section(RUNBOOK, '## 3. Route 1')).toMatch(/CLOSED until BL-551/);
    expect(section(RUNBOOK, '## 11. The weekly card')).not.toMatch(/delet/i);
  });
});

describe('the founder-cannot-act plan', () => {
  it('[FR-BKO-18] is one page that names the second person as a placeholder, with a default while no one is named', () => {
    expect(PLAN.split('\n').length).toBeLessThan(80);
    expect(PLAN).toMatch(/Second person: \*\*not named\.\*\*/);
    expect(PLAN).toMatch(/## Default while no one is named/);
    expect(PLAN).toMatch(/risk accepted in writing/);
  });

  it('[FR-BKO-18] gives the second person nothing before the policy sentence changes and counsel has read it', () => {
    expect(PLAN).toContain('Today only the founder has that access');
    expect(PLAN).toMatch(/Before that person holds anything that can reach production, the Privacy Policy sentence .* changes and counsel has read the new one/);
    const never = section(PLAN, '## What they never do');
    expect(never).toMatch(/Read the mailbox for requests, or open a letter/);
  });

  it('[FR-BKO-18] holds no name, email or phone number', () => {
    expect(PLAN).not.toMatch(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/);
    expect(PLAN).not.toMatch(/\+?\d[\d ()-]{8,}\d/);
  });
});

describe('the accountant brief', () => {
  it('[FR-FIN-22] is linked from the founder tasks with its trigger, before the first Apple payout', () => {
    const item = TASKS.split('\n- [ ] ').find((b) => b.startsWith('**Accountant brief before the first Apple payout**')) ?? '';
    expect(item).toContain('FR-FIN-22');
    expect(item).toContain('docs/product/prd/functions/finance.md` section 7');
    expect(item).toMatch(/before the first Apple payout/);
  });
});
