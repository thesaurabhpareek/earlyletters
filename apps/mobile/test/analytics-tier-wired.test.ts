/**
 * BL-1255: the app hands the real `tierOf` to createAnalytics, and does not pass a policy (the flip is the founder's, D-163 and D-170).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from './helpers/strip-comments';

const raw = readFileSync(join(__dirname, '../src/lib/analytics/index.ts'), 'utf8');
const callOf = (text: string) => text.slice(text.indexOf('createAnalytics({'), text.indexOf('export const lifecycle'));
const src = stripComments(raw);
const call = callOf(src);

describe('analytics tier wiring', () => {
  it('passes the real tierOf from the package', () => {
    expect(call).toMatch(/\btierOf,/);
    expect(src).toMatch(/import \{[^}]*\btierOf\b[^}]*\} from '@scribe\/analytics'/s);
  });
  it('passes no basicsPolicy, so production stays ask_first', () => {
    expect(call).not.toMatch(/basicsPolicy/);
  });
  it('BL-2168: a commented-out tierOf line no longer satisfies the wiring check', () => {
    const off = stripComments(raw.replace(/(createAnalytics\(\{[\s\S]*?\n)(\s*)tierOf,/, '$1$2// tierOf,'));
    expect(off).not.toBe(src);
    expect(callOf(off)).not.toMatch(/\btierOf,/);
  });
  it('BL-2168: a commented-out import no longer satisfies the import check', () => {
    const off = stripComments(raw.replace(/^import \{[^}]*\btierOf\b[^}]*\} from '@scribe\/analytics'.*$/ms, (m) => m.replace(/^/gm, '// ')));
    expect(off).not.toMatch(/import \{[^}]*\btierOf\b[^}]*\} from '@scribe\/analytics'/s);
  });
});
