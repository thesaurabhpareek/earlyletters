/**
 * Package rules and behaviour that do not depend on the migrations.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  API_CONTRACT_VERSION,
  API_ERRORS,
  CUSTOM_ERROR_CODES,
  ERROR_CODES,
  RPC_CATALOG,
  RPC_NAMES,
  callRpc,
  errorSpec,
  formatInviteCode,
  INVITE_CODE_ALPHABET,
  inviteCodeFromBytes,
  normaliseInviteCode,
  syncDisposition,
  type RpcTransport,
} from '../src';

const pkg = fileURLToPath(new URL('..', import.meta.url));
// En dash, em dash, curly single and double quotes, ellipsis (built from code points so this file stays clean).
const FORBIDDEN = new RegExp(`[${[0x2013, 0x2014, 0x2018, 0x2019, 0x201c, 0x201d, 0x2026].map((c) => String.fromCharCode(c)).join('')}]`);

function files(d: string): string[] {
  return readdirSync(d).flatMap((f) => {
    const p = join(d, f);
    if (f === 'node_modules') return [];
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

describe('package rules', () => {
  const src = files(join(pkg, 'src'));

  it('src is pure TypeScript: no node: imports, no react-native, no third-party imports', () => {
    for (const f of src) {
      const text = readFileSync(f, 'utf8');
      const imports = [...text.matchAll(/\bfrom\s+'([^']+)'/g)].map((m) => m[1]);
      for (const i of imports) expect(i.startsWith('./'), `${f} imports ${i}`).toBe(true);
      expect(text).not.toMatch(/\brequire\(/);
    }
  });

  it('no em or en dashes, curly quotes or ellipsis characters in package files', () => {
    for (const f of files(pkg)) {
      expect(readFileSync(f, 'utf8'), f).not.toMatch(FORBIDDEN);
    }
  });

  it('contract version is semver', () => {
    expect(API_CONTRACT_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});

describe('errors registry', () => {
  it('keys equal codes and codes are 5-character SQLSTATEs', () => {
    for (const c of ERROR_CODES) {
      expect(API_ERRORS[c].code).toBe(c);
      expect(c).toMatch(/^[0-9A-Z]{5}$/);
    }
  });

  it('copy keys are keys, not copy', () => {
    for (const c of ERROR_CODES) expect(API_ERRORS[c].copyKey).toMatch(/^api\.error\.[a-z_]+$/);
  });

  it('retryable agrees with the sync disposition', () => {
    for (const c of ERROR_CODES) {
      const s = API_ERRORS[c];
      if (s.sync === 'reject') expect(s.retryable, c).toBe(false);
      else expect(s.retryable, c).toBe(true);
    }
  });

  it('consent pauses the queue; purged ids are dropped; unknown codes retry', () => {
    expect(syncDisposition('SCCON')).toBe('pause');
    expect(errorSpec('SCPRG')?.clientAction).toBe('drop_local_row');
    expect(syncDisposition('XX999')).toBe('retry');
    // A reused key with different arguments is a client bug: never retried.
    expect(syncDisposition('SCCID')).toBe('reject');
    expect(errorSpec('SCCID')?.retryable).toBe(false);
    expect(errorSpec('XX999')).toBeUndefined();
  });

  it('custom codes are SC-prefixed and include the 15 post-#32 codes', () => {
    expect(new Set(CUSTOM_ERROR_CODES)).toEqual(
      new Set(['SCANO', 'SCCON', 'SCINV', 'SCRAT', 'SCAPR', 'SCIMM', 'SCTMB', 'SCLPG', 'SCDEL', 'SCPAR', 'SCACD', 'SCPRG', 'SCCID', 'SCVER', 'SCCFG']),
    );
  });
});

describe('rpc catalog', () => {
  it('names are unique and params are p_-prefixed', () => {
    expect(new Set(RPC_NAMES).size).toBe(RPC_NAMES.length);
    for (const n of RPC_NAMES) for (const p of RPC_CATALOG[n].params) expect(p.name).toMatch(/^p_/);
  });

  it('retry-safe commands carry a client_id idempotency key (#32)', () => {
    for (const n of ['create_child', 'create_child_invite', 'record_policy_act'] as const) {
      expect(RPC_CATALOG[n].idempotency, n).toEqual({ kind: 'client_id', param: 'p_id' });
      expect(RPC_CATALOG[n].params[0], n).toEqual({ name: 'p_id', sqlType: 'uuid', optional: false });
      expect(RPC_CATALOG[n].errors, n).toContain('SCCID');
    }
  });

  it('create_child_invite takes token and code hashes and returns the invite id, never a token', () => {
    const spec = RPC_CATALOG.create_child_invite;
    expect(spec.params.map((p) => p.name)).toEqual(['p_id', 'p_child', 'p_role', 'p_token_hash', 'p_code_hash', 'p_signs_as']);
    expect(spec.params.find((p) => p.name === 'p_token_hash')?.sqlType).toBe('bytea');
    expect(spec.params.find((p) => p.name === 'p_code_hash')).toEqual({ name: 'p_code_hash', sqlType: 'bytea', optional: false });
    expect(spec.errors).toContain('SCCFG');
    expect(spec.sqlReturns).toBe('uuid');
    expect(spec.params.some((p) => (p.name as string) === 'p_token')).toBe(false);
  });

  it('no RPC is left without retry safety (kind none)', () => {
    expect(RPC_NAMES.filter((n) => (RPC_CATALOG[n].idempotency.kind as string) === 'none')).toEqual([]);
  });

  it('optional params come last (PostgREST named args do not need it, but SQL defaults do)', () => {
    for (const n of RPC_NAMES) {
      const flags = RPC_CATALOG[n].params.map((p) => p.optional);
      expect(flags, n).toEqual([...flags].sort((a, b) => Number(a) - Number(b)));
    }
  });
});

describe('callRpc', () => {
  const ok: RpcTransport = { rpc: async () => ({ data: '0192f0e2-0000-7000-8000-000000000000', error: null }) };
  const fail: RpcTransport = {
    rpc: async () => ({ data: null, error: { code: 'SCCON', message: 'consent required', details: 'terms', hint: null } }),
  };

  it('passes name and args through and returns typed data', async () => {
    const calls: unknown[] = [];
    const t: RpcTransport = { rpc: async (fn, args) => (calls.push([fn, args]), ok.rpc(fn, args)) };
    const r = await callRpc(t, 'create_child', { p_id: '0192f0e2-0000-7000-8000-000000000000', p_name: 'Asha' });
    expect(calls).toEqual([['create_child', { p_id: '0192f0e2-0000-7000-8000-000000000000', p_name: 'Asha' }]]);
    expect(r).toEqual({ ok: true, data: '0192f0e2-0000-7000-8000-000000000000' });
  });

  it('maps errors to the registry', async () => {
    const r = await callRpc(fail, 'my_sync_gate', {});
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.code).toBe('SCCON');
      expect(r.error.spec?.sync).toBe('pause');
      expect(r.error.details).toBe('terms');
    }
  });
});

describe('invite codes (A-REQ-029)', () => {
  it('the alphabet is Crockford base32: 32 symbols, no I, L, O or U', () => {
    expect(INVITE_CODE_ALPHABET).toHaveLength(32);
    expect(new Set(INVITE_CODE_ALPHABET).size).toBe(32);
    expect(INVITE_CODE_ALPHABET).not.toMatch(/[ILOU]/);
  });

  it('normalises case, hyphens and spaces, and reads O as 0 and I or L as 1 (same as SQL)', () => {
    expect(normaliseInviteCode('ab2c-d3ef')).toBe('AB2CD3EF');
    expect(normaliseInviteCode(' o1il 2345 ')).toBe('01112345');
  });

  it('rejects wrong lengths, U and other symbols', () => {
    for (const bad of ['ABC', 'ABCDEFGHJ', 'ABCDEFGU', 'ABCD_EFG', '', null, undefined]) {
      expect(normaliseInviteCode(bad), String(bad)).toBeNull();
    }
  });

  it('builds codes from 8 bytes and formats them as XXXX-XXXX', () => {
    const code = inviteCodeFromBytes([0, 1, 31, 32, 63, 200, 255, 17]);
    expect(code).toBe('01Z0Z8ZH');
    expect(normaliseInviteCode(code)).toBe(code);
    expect(formatInviteCode(code)).toBe(`${code.slice(0, 4)}-${code.slice(4)}`);
    expect(() => inviteCodeFromBytes([1, 2, 3])).toThrow(RangeError);
  });
});
