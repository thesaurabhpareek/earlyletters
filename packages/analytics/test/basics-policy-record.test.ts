/**
 * ER-A03 (BL-1238) acceptance 2: production may resolve to `collect_by_default` only when the decision record holds a
 * founder decision that names a D-number present in docs/DECISIONS.md AND a counsel confirmation. The flip PR edits
 * the record (the founder's and counsel's), never this test. Privacy and Karma review any change to either.
 * BL-1249 will fold this into analytics-policy.test.ts; it must stay as strict.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveBasicsPolicy } from '../src';

const root = resolve(__dirname, '../../..');
const read = (p: string) => readFileSync(resolve(root, p), 'utf8');

interface Record_ {
  policy?: unknown;
  founder_decision?: unknown;
  counsel_confirmation?: unknown;
}

/** Empty means the production value is allowed. */
export function policyFlipProblems(resolved: string, record: Record_, decisions: string): string[] {
  if (resolved !== 'collect_by_default') return [];
  const out: string[] = [];
  const d = record.founder_decision;
  if (typeof d !== 'string' || !/^D-\d+$/.test(d)) out.push('no founder decision named');
  else if (!new RegExp(`^\\| ${d} \\|`, 'm').test(decisions)) out.push('the named decision is not in DECISIONS.md');
  if (typeof record.counsel_confirmation !== 'string' || record.counsel_confirmation.trim() === '') out.push('no counsel confirmation');
  return out;
}

describe('production basicsPolicy', () => {
  const eas = JSON.parse(read('apps/mobile/eas.json')) as { build: Record<string, { env?: Record<string, string> }> };
  const record = JSON.parse(read('docs/analytics/instrumentation/basics-policy-record.json')) as Record_;
  const decisions = read('docs/DECISIONS.md');

  it('resolves ask_first, or the record carries a founder decision and a counsel confirmation', () => {
    const resolved = resolveBasicsPolicy({ profile: 'production', buildValue: eas.build.production?.env?.EXPO_PUBLIC_ANALYTICS_BASICS_POLICY });
    expect(policyFlipProblems(resolved, record, decisions)).toEqual([]);
  });

  it('the record on develop is still ask_first with no decision', () => {
    expect(record).toEqual({ policy: 'ask_first', founder_decision: null, counsel_confirmation: null });
  });

  it('the check itself: a flip with a null, invented or unrecorded decision, or no counsel line, fails', () => {
    const real = decisions.match(/^\| (D-\d+) \|/m)?.[1] as string;
    expect(policyFlipProblems('ask_first', record, decisions)).toEqual([]);
    expect(policyFlipProblems('collect_by_default', record, decisions)).toHaveLength(2);
    expect(policyFlipProblems('collect_by_default', { founder_decision: 'D-999999', counsel_confirmation: 'Q22 answered' }, decisions)).toEqual(['the named decision is not in DECISIONS.md']);
    expect(policyFlipProblems('collect_by_default', { founder_decision: 'a decision', counsel_confirmation: 'Q22 answered' }, decisions)).toEqual(['no founder decision named']);
    expect(policyFlipProblems('collect_by_default', { founder_decision: real, counsel_confirmation: null }, decisions)).toEqual(['no counsel confirmation']);
    expect(policyFlipProblems('collect_by_default', { founder_decision: real, counsel_confirmation: '  ' }, decisions)).toEqual(['no counsel confirmation']);
    expect(policyFlipProblems('collect_by_default', { founder_decision: real, counsel_confirmation: 'Q22 answered' }, decisions)).toEqual([]);
  });

  it('a production build value of collect_by_default would fail today (the flip is not part of this change)', () => {
    const resolved = resolveBasicsPolicy({ profile: 'production', buildValue: 'collect_by_default' });
    expect(policyFlipProblems(resolved, record, decisions).length).toBeGreaterThan(0);
  });
});
