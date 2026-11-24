/**
 * BL-2168: the helper that source-scan tests use drops comments and keeps code.
 */
import { describe, expect, it } from 'vitest';
import { stripComments } from './helpers/strip-comments';

describe('stripComments', () => {
  it('drops line and block comments', () => {
    expect(stripComments('a // b\nc /* d\ne */ f')).toBe('a \nc \n f');
  });
  it('keeps // inside string and template literals', () => {
    expect(stripComments("const u = 'https://x.test'; const t = `//y`;")).toBe("const u = 'https://x.test'; const t = `//y`;");
  });
});
