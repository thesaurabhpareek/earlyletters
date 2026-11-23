/**
 * ER-A02 (BL-1237): basicsPolicy resolution, and the decision record that
 * ER-A03 will read. Fictional family Asha only; no event data is involved.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseBasicsPolicy, resolveBasicsPolicy, SAFE_BASICS_POLICY } from '../src/policy';

const prod = (over: Parameters<typeof resolveBasicsPolicy>[0] = {}) =>
  resolveBasicsPolicy({ profile: 'production', buildValue: 'collect_by_default', ...over });

describe('resolveBasicsPolicy', () => {
  it('defaults to ask_first with no input at all', () => {
    expect(resolveBasicsPolicy()).toBe('ask_first');
    expect(resolveBasicsPolicy({})).toBe('ask_first');
    expect(SAFE_BASICS_POLICY).toBe('ask_first');
  });

  it('only production can resolve to collect_by_default', () => {
    expect(prod()).toBe('collect_by_default');
    for (const profile of ['development', 'e2e', 'preview', 'testflight', 'Production', 'prod', '', null, undefined]) {
      expect(resolveBasicsPolicy({ profile, buildValue: 'collect_by_default' })).toBe('ask_first');
    }
  });

  it('treats garbage, empty and missing build values as ask_first', () => {
    for (const buildValue of ['', ' ', 'COLLECT_BY_DEFAULT', 'on', 'true', '1', 'collect_by_default ', null, undefined]) {
      expect(resolveBasicsPolicy({ profile: 'production', buildValue })).toBe('ask_first');
    }
    expect(resolveBasicsPolicy({ profile: 'production', buildValue: 'ask_first' })).toBe('ask_first');
  });

  it('lets a remote value tighten and ignores an attempt to loosen', () => {
    expect(prod({ remote: 'ask_first' })).toBe('ask_first');
    expect(prod({ remote: 'collect_by_default' })).toBe('collect_by_default');
    expect(resolveBasicsPolicy({ profile: 'production', buildValue: 'ask_first', remote: 'collect_by_default' })).toBe('ask_first');
    expect(resolveBasicsPolicy({ profile: 'preview', buildValue: 'ask_first', remote: 'collect_by_default' })).toBe('ask_first');
    expect(prod({ remote: 'garbage' })).toBe('collect_by_default');
  });

  it('has an empty region map by default, so a region changes nothing', () => {
    expect(prod({ region: 'XX' })).toBe('collect_by_default');
    expect(prod({ region: 'XX', regionMap: {} })).toBe('collect_by_default');
    expect(prod({ region: 'XX', regionMap: null })).toBe('collect_by_default');
  });

  it('applies a region entry only when it names the region, and an unreadable entry is ask_first', () => {
    expect(prod({ region: 'XX', regionMap: { XX: 'ask_first' } })).toBe('ask_first');
    expect(prod({ region: 'YY', regionMap: { XX: 'ask_first' } })).toBe('collect_by_default');
    expect(prod({ region: 'XX', regionMap: { XX: 'nonsense' } })).toBe('ask_first');
    expect(prod({ region: 'toString', regionMap: {} })).toBe('collect_by_default');
    expect(resolveBasicsPolicy({ profile: 'preview', region: 'XX', regionMap: { XX: 'collect_by_default' } })).toBe('ask_first');
  });

  it('a remote value still tightens after a region entry', () => {
    expect(prod({ region: 'XX', regionMap: { XX: 'collect_by_default' }, remote: 'ask_first' })).toBe('ask_first');
  });

  it('parseBasicsPolicy accepts only the two names', () => {
    expect(parseBasicsPolicy('ask_first')).toBe('ask_first');
    expect(parseBasicsPolicy('collect_by_default')).toBe('collect_by_default');
    for (const v of ['', 'Ask_First', 0, false, {}, [], undefined, null]) expect(parseBasicsPolicy(v)).toBeNull();
  });
});

describe('basics-policy-record.json', () => {
  const file = resolve(__dirname, '../../../docs/analytics/instrumentation/basics-policy-record.json');
  const record = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;

  it('ships ask_first with no founder decision and no counsel confirmation', () => {
    expect(record).toEqual({ policy: 'ask_first', founder_decision: null, counsel_confirmation: null });
  });
});
