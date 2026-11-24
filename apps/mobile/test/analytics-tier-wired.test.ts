/**
 * BL-1255: the app hands the real `tierOf` to createAnalytics, and does not pass a policy (the flip is the founder's, D-163 and D-170).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const src = readFileSync(join(__dirname, '../src/lib/analytics/index.ts'), 'utf8');
const call = src.slice(src.indexOf('createAnalytics({'), src.indexOf('export const lifecycle'));

describe('analytics tier wiring', () => {
  it('passes the real tierOf from the package', () => {
    expect(call).toMatch(/\btierOf,/);
    expect(src).toMatch(/import \{[^}]*\btierOf\b[^}]*\} from '@scribe\/analytics'/s);
  });
  it('passes no basicsPolicy, so production stays ask_first', () => {
    expect(call).not.toMatch(/basicsPolicy/);
  });
});
