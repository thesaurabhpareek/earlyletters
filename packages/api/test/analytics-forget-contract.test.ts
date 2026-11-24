/// <reference types="node" />
/**
 * BL-1252: the analytics-forget contract matches the deployed function, and the one reason the function does not accept
 * yet (`retired_id`) is pinned, so closing the server half changes this test on purpose.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ANALYTICS_FORGET_FUNCTION,
  ANALYTICS_FORGET_MAX_IDS,
  ANALYTICS_FORGET_PATH,
  ANALYTICS_FORGET_PENDING_REASONS,
  ANALYTICS_FORGET_REASONS,
  parseAnalyticsForgetRequest,
} from '../src';

const handler = readFileSync(fileURLToPath(new URL('../../../supabase/functions/analytics-forget/handler.ts', import.meta.url)), 'utf8');
const ID = '00000000-0000-4000-8000-000000000001';

describe('analytics-forget contract', () => {
  it('names the route the function serves', () => {
    expect(ANALYTICS_FORGET_PATH).toBe('/functions/v1/analytics-forget/v1');
    expect(ANALYTICS_FORGET_FUNCTION).toBe('analytics-forget/v1');
    expect(handler).toMatch(/\\\/analytics-forget\\\/v1/);
  });

  it('allows the same number of ids as the function', () => {
    expect(handler).toContain(`export const MAX_IDS = ${ANALYTICS_FORGET_MAX_IDS};`);
  });

  it('every reason the function accepts is in the contract, and the contract adds only the pending one', () => {
    const accepted = [...(handler.match(/const REASONS: readonly Reason\[\] = \[([^\]]*)\]/)?.[1] ?? '').matchAll(/'([a-z_]+)'/g)].map((m) => m[1]);
    expect(accepted.length).toBeGreaterThan(0);
    for (const r of accepted) expect(ANALYTICS_FORGET_REASONS).toContain(r);
    expect(ANALYTICS_FORGET_REASONS.filter((r) => !accepted.includes(r))).toEqual([...ANALYTICS_FORGET_PENDING_REASONS]);
  });

  it('parses a good request and refuses everything else', () => {
    expect(parseAnalyticsForgetRequest({ ids: [ID], reason: 'retired_id' })).toEqual({ ids: [ID], reason: 'retired_id' });
    const many = Array.from({ length: ANALYTICS_FORGET_MAX_IDS }, (_, i) => `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`);
    expect(parseAnalyticsForgetRequest({ ids: many, reason: 'account_deletion' })).not.toBeNull();
    for (const bad of [
      null,
      'x',
      {},
      { ids: [], reason: 'account_deletion' },
      { ids: [...many, ID], reason: 'account_deletion' },
      { ids: ['not-a-uuid'], reason: 'account_deletion' },
      { ids: [ID], reason: 'because' },
      { ids: [ID] },
      { ids: [42], reason: 'account_deletion' },
    ]) expect(parseAnalyticsForgetRequest(bad)).toBeNull();
  });
});
