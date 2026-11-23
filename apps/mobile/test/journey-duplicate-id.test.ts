/// <reference types="node" />
/**
 * [BL-480] The step recorder refuses a step id used twice in one run, so parallel flows cannot silently overwrite a
 * record. Drives the pure check; the recorder calls it before it writes steps/<id>.json.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { assertUniqueStepId } from '../e2e-web/support/step-id';

describe('[BL-480] duplicate step id guard', () => {
  it('accepts distinct ids', () => {
    const seen = new Map<string, string>();
    expect(() => {
      assertUniqueStepId(seen, 'J10-07-book', 'Asha opens the book');
      assertUniqueStepId(seen, 'J10-08-share', 'Asha shares a page');
    }).not.toThrow();
  });

  it('[BL-480] a repeated id throws and names both step titles', () => {
    const seen = new Map<string, string>();
    assertUniqueStepId(seen, 'J10-08-share', 'Asha shares a page');
    expect(() => assertUniqueStepId(seen, 'J10-08-share', 'Asha stops before sharing')).toThrow(
      /J10-08-share.*Asha shares a page.*Asha stops before sharing/,
    );
  });

  it('[BL-480] the same id in a second journey (a fresh scope) does not throw', () => {
    const first = new Map<string, string>();
    const second = new Map<string, string>();
    assertUniqueStepId(first, 'J24-01', 'Asha opens the letter page');
    expect(() => assertUniqueStepId(second, 'J24-01', 'Asha opens the letter page')).not.toThrow();
  });

  it('journey() scopes the guard per call and checks before it records', () => {
    const src = readFileSync(join(__dirname, '..', 'e2e-web', 'support', 'app.ts'), 'utf8');
    const fn = src.slice(src.indexOf('export function journey('));
    const scope = fn.indexOf('const seen = new Map');
    const guard = fn.indexOf('assertUniqueStepId(seen');
    expect(scope).toBeGreaterThan(-1);
    expect(guard).toBeGreaterThan(scope);
    expect(guard).toBeLessThan(fn.indexOf('await record('));
    expect(scope).toBeLessThan(fn.indexOf('return async'));
  });
});
