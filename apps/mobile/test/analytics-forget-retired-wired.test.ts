/**
 * BL-1252: the app hands makeForgetRetiredId to createAnalytics as forgetRetiredId. Without it a retired id never reaches the server.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(join(__dirname, '../src/lib/analytics/index.ts'), 'utf8');
const call = src.slice(src.indexOf('createAnalytics({'), src.indexOf('export const lifecycle'));

describe('analytics forget-retired wiring', () => {
  it('passes forgetRetiredId built by makeForgetRetiredId to createAnalytics', () => {
    expect(call).toMatch(/\bforgetRetiredId:\s*makeForgetRetiredId\(/);
    expect(src).toMatch(/import \{[^}]*\bmakeForgetRetiredId\b[^}]*\} from '\.\/forget-retired'/s);
  });
});
