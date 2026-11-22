/**
 * S19 (QA): the backend guard every Maestro script loads first
 * (apps/mobile/e2e/scripts/lib-guard.js) talks only to the dedicated e2e
 * project or a local stack. Staging holds the family's real letters during the
 * alpha (D-106), so it is refused exactly like production, and a hosted URL is
 * refused when either ref is unset (fail closed). The script runs in Maestro's
 * GraalJS sandbox with MAESTRO_* globals and an `output` object; node:vm gives
 * it the same shape here.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync(join(__dirname, '..', 'e2e', 'scripts', 'lib-guard.js'), 'utf8');

// Fictional project refs: never real ones.
const E2E = 'e2eaaaaaaaaaaaaaaaaa';
const STAGING = 'stagingbbbbbbbbbbbbb';
const PROD = 'prodcccccccccccccccc';

function guard(vars: Record<string, string>): { baseUrl: () => string } {
  const context: Record<string, unknown> = { output: {}, ...vars };
  runInNewContext(SRC, context);
  return (context.output as { e2e: { baseUrl: () => string } }).e2e;
}

const configured = {
  MAESTRO_E2E_PROJECT_REF: E2E,
  MAESTRO_PROD_PROJECT_REF: PROD,
  MAESTRO_STAGING_PROJECT_REF: STAGING,
};

describe('[BL-275] e2e scripts reach only the e2e project', () => {
  it('accepts the e2e project and a local stack', () => {
    expect(guard({ ...configured, MAESTRO_E2E_SUPABASE_URL: `https://${E2E}.supabase.co/` }).baseUrl()).toBe(`https://${E2E}.supabase.co`);
    expect(guard({ MAESTRO_E2E_SUPABASE_URL: 'http://127.0.0.1:54321' }).baseUrl()).toBe('http://127.0.0.1:54321');
  });

  it('refuses the staging project, however it is named', () => {
    expect(() => guard({ ...configured, MAESTRO_E2E_SUPABASE_URL: `https://${STAGING}.supabase.co` }).baseUrl()).toThrow(/refusing/);
    // A mistyped e2e ref that names staging (the case the old guard let through).
    expect(() => guard({ ...configured, MAESTRO_E2E_PROJECT_REF: STAGING, MAESTRO_E2E_SUPABASE_URL: `https://${STAGING}.supabase.co` }).baseUrl()).toThrow(/production or staging/);
  });

  it('refuses the production project, however it is named', () => {
    expect(() => guard({ ...configured, MAESTRO_E2E_SUPABASE_URL: `https://${PROD}.supabase.co` }).baseUrl()).toThrow(/refusing/);
    expect(() => guard({ ...configured, MAESTRO_E2E_PROJECT_REF: PROD, MAESTRO_E2E_SUPABASE_URL: `https://${PROD}.supabase.co` }).baseUrl()).toThrow(/production or staging/);
  });

  it('fails closed: a hosted URL is refused while the staging or production ref is unset', () => {
    const url = `https://${E2E}.supabase.co`;
    expect(() => guard({ MAESTRO_E2E_PROJECT_REF: E2E, MAESTRO_PROD_PROJECT_REF: PROD, MAESTRO_E2E_SUPABASE_URL: url }).baseUrl()).toThrow(/MAESTRO_STAGING_PROJECT_REF/);
    expect(() => guard({ MAESTRO_E2E_PROJECT_REF: E2E, MAESTRO_STAGING_PROJECT_REF: STAGING, MAESTRO_E2E_SUPABASE_URL: url }).baseUrl()).toThrow(/MAESTRO_PROD_PROJECT_REF/);
  });

  it('refuses a URL that is not the e2e project', () => {
    expect(() => guard({ ...configured, MAESTRO_E2E_SUPABASE_URL: 'https://example.supabase.co' }).baseUrl()).toThrow(/not the e2e project/);
    expect(() => guard({ ...configured }).baseUrl()).toThrow(/not set/);
  });
});
