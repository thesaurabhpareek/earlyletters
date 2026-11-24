/**
 * BL-1252: the app hands makeForgetRetiredId to createAnalytics as forgetRetiredId. Without it a retired id never reaches the server.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { stripComments } from './helpers/strip-comments';

const raw = readFileSync(join(__dirname, '../src/lib/analytics/index.ts'), 'utf8');
const callOf = (text: string) => text.slice(text.indexOf('createAnalytics({'), text.indexOf('export const lifecycle'));
const src = stripComments(raw);
const call = callOf(src);

describe('analytics forget-retired wiring', () => {
  it('passes forgetRetiredId built by makeForgetRetiredId to createAnalytics', () => {
    expect(call).toMatch(/\bforgetRetiredId:\s*makeForgetRetiredId\(/);
    expect(src).toMatch(/import \{[^}]*\bmakeForgetRetiredId\b[^}]*\} from '\.\/forget-retired'/s);
  });
  it('BL-2168: a commented-out forgetRetiredId line no longer satisfies the wiring check', () => {
    const off = stripComments(raw.replace(/^(\s*)forgetRetiredId:/m, '$1// forgetRetiredId:'));
    expect(off).not.toBe(src);
    expect(callOf(off)).not.toMatch(/\bforgetRetiredId:\s*makeForgetRetiredId\(/);
  });
});
