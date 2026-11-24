/// <reference types="node" />
/**
 * BL-1169 (NS-40-R10, R12; D-131). The country hook lives in the database, so what the phone side can prove is read
 * from the migration text and from the real error mapping: R10, every sign-in method meets the one hook and its refusal
 * reaches the refused screen the same way (the staging run from a test location is a separate check, see the card);
 * R12, the daily counts hold a result, a day, a count and the country code of a refusal, and no IP address, email or
 * user id. The hosted hook's response code is still [U] (auth-region-refused.test.ts pins what the phone expects).
 * Each rule has a mutant: a copy of the source with the one wrong line, which the same check must catch. Asha only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { authErrorKind } from '../src/lib/auth/errors.logic';
import { authReducer, type AuthMethod } from '../src/lib/auth/machine.logic';

const REPO = join(__dirname, '..', '..', '..');
const migration = () => readFileSync(join(REPO, 'supabase/migrations/20261121030000_compliance_gates.sql'), 'utf8');
const sql = (t: string) => t.replace(/--.*$/gm, '');
const section = (t: string, start: RegExp, end: RegExp) => {
  const a = t.search(start);
  const rest = t.slice(a);
  const b = rest.search(end);
  return a < 0 ? '' : b < 0 ? rest : rest.slice(0, b);
};
const hookBody = (t: string) => section(sql(t), /create or replace function public\.hook_before_user_created/, /\nrevoke all on function public\.hook_before_user_created/);
const countsTable = (t: string) => section(sql(t), /create table if not exists ops\.compliance_check_counts/, /\n\);/);
const bumpBody = (t: string) => section(sql(t), /create or replace function ops\.bump_check/, /\nrevoke all on function ops\.bump_check/);
const PERSON = /\b(ip|ip_address|inet|email|user_id|uid|auth\.uid|user_agent|device|session|name)\b/i;

describe('[NS-40-R10] every sign-in method meets the country check', () => {
  const refusal = Object.assign(new Error('refused'), { code: 'region_refused', status: 403 });

  it('[NS-40-R10] Apple, Google and email are refused by one hook that never asks which method made the account', () => {
    const body = hookBody(migration());
    expect(body).toContain('v_ip := nullif(event -> \'metadata\' ->> \'ip_address\'');
    expect(body).toMatch(/'http_code', 403/);
    expect(body).not.toMatch(/provider|identities|app_metadata|apple|google|'email'/i);
  });

  it('[NS-40-R10] the refusal becomes the same kind for each method on its own path (Apple and Google: provider; email: code)', () => {
    for (const method of ['apple', 'google'] as const satisfies AuthMethod[]) {
      const state = authReducer(authReducer({ status: 'signedOut' }, { type: 'START', method }), { type: 'FAILED', error: authErrorKind(refusal, 'provider') });
      expect(state, method).toEqual({ status: 'signedOut', error: 'region_refused' });
    }
    expect(authErrorKind(refusal, 'code')).toBe('region_refused');
    expect(authErrorKind(refusal, 'send')).toBe('region_refused');
  });

  it('[NS-40-R10] each sign-in call site hands its error to the one mapper before it reports it', () => {
    const sp = readFileSync(join(__dirname, '..', 'src/lib/auth/session-provider.tsx'), 'utf8');
    expect(sp).toMatch(/authErrorKind\(e, method === 'passkey' \? 'passkey' : 'provider'\)/); // Apple and Google
    expect(sp).toMatch(/authErrorKind\(e, 'send'\)/);
    expect(sp).toMatch(/authErrorKind\(e, 'code'\)/);
  });

  it('[NS-40-R10] mutant: a hook that skips one method, or a call site that keeps a raw error, is caught', () => {
    const real = migration();
    const skips = (t: string) => /provider|identities|app_metadata/i.test(hookBody(t));
    expect(skips(real)).toBe(false);
    expect(skips(real.replace("v_cc := ops.country_of(v_ip);", "if event -> 'user' -> 'app_metadata' ->> 'provider' = 'email' then return '{}'::jsonb; end if;\n  v_cc := ops.country_of(v_ip);"))).toBe(true);
    const sp = readFileSync(join(__dirname, '..', 'src/lib/auth/session-provider.tsx'), 'utf8');
    const mapsCode = (t: string) => /authErrorKind\(e, 'code'\)/.test(t);
    expect(mapsCode(sp)).toBe(true);
    expect(mapsCode(sp.replace("authErrorKind(e, 'code')", "'unknown'"))).toBe(false);
  });
});

describe('[NS-40-R12] country counts hold no person', () => {
  it('[NS-40-R12] the counts table has a day, a check, a result, a country code for refusals only, and a count', () => {
    const t = countsTable(migration());
    const cols = [...t.matchAll(/^\s{2}(\w+) (date|text|integer)\b/gm)].map((m) => m[1]);
    expect(cols).toEqual(['day', 'check_name', 'outcome', 'jurisdiction', 'n']);
    expect(t).not.toMatch(PERSON);
    expect(t).toMatch(/outcome = 'block' and jurisdiction ~ '\^\[A-Z\]\{2\}/);
    expect(t).toMatch(/outcome <> 'block' and jurisdiction = ''/);
  });

  it('[NS-40-R12] the counter writes only those columns, and the hook passes it a country code only for a refusal, never the address', () => {
    const bump = bumpBody(migration());
    expect(bump).toMatch(/insert into ops\.compliance_check_counts \(day, check_name, outcome, jurisdiction, n\)/);
    expect(bump).not.toMatch(PERSON);
    const calls = [...hookBody(migration()).matchAll(/ops\.bump_check\(([^)]*)\)/g)].map((m) => m[1]);
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) expect(c, c).not.toMatch(/v_ip|event|email|user/);
    expect(calls.filter((c) => c.includes('v_cc'))).toEqual(["'signup_region', 'block', v_cc"]);
  });

  it('[NS-40-R12] mutant: an IP column, an address passed to the counter, or a user id is caught by the same checks', () => {
    const real = migration();
    const cols = (t: string) => [...countsTable(t).matchAll(/^\s{2}(\w+) (date|text|integer)\b/gm)].map((m) => m[1]).join(',');
    expect(cols(real)).toBe('day,check_name,outcome,jurisdiction,n');
    expect(cols(real.replace("  n integer not null default 0 check (n >= 0),", "  n integer not null default 0 check (n >= 0),\n  ip text,"))).not.toBe(cols(real));
    const passesIp = (t: string) => /ops\.bump_check\([^)]*v_ip/.test(hookBody(t));
    expect(passesIp(real)).toBe(false);
    expect(passesIp(real.replace("ops.bump_check('signup_region', 'block', v_cc)", "ops.bump_check('signup_region', 'block', v_ip::text)"))).toBe(true);
    const personInTable = (t: string) => PERSON.test(countsTable(t));
    expect(personInTable(real)).toBe(false);
    expect(personInTable(real.replace("  n integer not null", "  user_id uuid,\n  n integer not null"))).toBe(true);
  });
});
