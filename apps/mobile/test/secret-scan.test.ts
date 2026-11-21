/// <reference types="node" />
/**
 * SEC-R02 and SEC-R03 (BRIEF CI-SECRET): the repo scanner finds a service key, a private key block, an EAS token and an
 * Anthropic or GitHub token in a tracked file, and says only the file, the line and the rule. Every planted value is
 * built at run time from random bytes, so this file never holds one whole (and the scanner reads this file too).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { scanRepo, scanText } from '../../../scripts/packs/secret-scan.mjs';

const REPO = join(__dirname, '..', '..', '..');
const SCAN = join(REPO, 'scripts', 'packs', 'secret-scan.mjs');
const rand = (n: number) => randomBytes(n).toString('base64url').replace(/[^A-Za-z0-9]/g, 'q');
const b64url = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (role: string) => `${b64url({ alg: 'HS256' })}.${b64url({ role, iss: 'asha-fixture' })}.${rand(30)}`;
const BEGIN = ['-----BEGIN', 'PRIVATE', 'KEY-----'].join(' ');
const XS = ['X', 'SECRET'].join('_');
const hex = (n: number) => randomBytes(n).toString('hex');
const names = (text: string) => scanText(text).map((f: { name: string }) => f.name);

describe('secret scan, SEC-R03', () => {
  it('[SEC-R03] a service_role token in a tracked file is found', () => {
    expect(names(`const k = '${jwt('service_role')}';`)).toEqual(['service_role JWT']);
    expect(names(`SUPABASE_SECRET=sb_secret_${rand(30)}`)).toEqual(['Supabase secret key (sb_secret_)']);
    expect(names(`SUPABASE_SERVICE_ROLE_KEY=${rand(40)}`)).toEqual(['service role key value']);
    // the public key is allowed: role anon, and a publishable key
    expect(names(`const k = '${jwt('anon')}';`)).toEqual([]);
    expect(names(`key=sb_publishable_${rand(30)}`)).toEqual([]);
  });

  it('[SEC-R03] a private key block is found', () => {
    expect(names(`${BEGIN}\n${rand(60)}\n`)).toEqual(['private key block']);
    expect(names(`"key": "${BEGIN}\\n${rand(60)}\\n"`)).toEqual(['private key block']);
    expect(names(`-----BEGIN EC PRIVATE KEY-----\n${rand(60)}`)).toEqual(['private key block']);
    // a mention, and a template that builds one at run time, are not a key
    expect(names(`paste the ${BEGIN} block into the field`)).toEqual([]);
    expect(names(`${BEGIN}\n\${body}\n`)).toEqual([]);
  });

  it('[SEC-R03] a private key block indented under a YAML block scalar, or on one line with whitespace, is found', () => {
    expect(names(`key: |\n  ${BEGIN}\n  ${rand(60)}\n`)).toEqual(['private key block']);
    expect(names(`  - ${BEGIN}\n    ${rand(60)}`)).toEqual(['private key block']);
    expect(names(`"key": "${BEGIN}\\n  ${rand(60)}"`)).toEqual(['private key block']);
  });

  it('[SEC-R03] quoted names as in JSON (eas.json env) are found', () => {
    expect(names(`"SUPABASE_SERVICE_ROLE_KEY": "${rand(40)}"`)).toEqual(['service role key value']);
    expect(names(`"EXPO_TOKEN": "${rand(40)}"`)).toEqual(['EAS token (EXPO_TOKEN)']);
    expect(names(`'EXPO_TOKEN': '${rand(40)}'`)).toEqual(['EAS token (EXPO_TOKEN)']);
    expect(names('"EXPO_TOKEN": "${EXPO_TOKEN}"')).toEqual([]);
  });

  it('[SEC-R03] Supabase personal access tokens, Resend keys and AWS access keys are found', () => {
    const hex = randomBytes(20).toString('hex');
    expect(names(`t=sbp_${hex}`)).toEqual(['Supabase access token (sbp_)']);
    expect(names(`k=re_${rand(8).slice(0, 8)}_${rand(26).slice(0, 26)}`)).toEqual(['Resend key']);
    expect(names(`id=AKIA${rand(20).toUpperCase().slice(0, 16)}`)).toEqual(['AWS access key id']);
    for (const ok of ['sbp_...', 're_send_button_label', 'AKIAIOSFODNN7EXAMPLE']) expect(names(ok), ok).toEqual([]);
  });

  it('[SEC-R03] EAS, Anthropic and GitHub tokens are found, and placeholders are not', () => {
    expect(names(`EXPO_TOKEN=${rand(40)}`)).toEqual(['EAS token (EXPO_TOKEN)']);
    expect(names(`k: sk-ant-${rand(40)}`)).toEqual(['Anthropic key (sk-ant-)']);
    expect(names(`t=ghp_${rand(40)}`)).toEqual(['GitHub token']);
    for (const ok of ['EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}', 'EXPO_TOKEN=<token>', 'sk-ant-...', 'SERVICE_ROLE_KEY=$KEY', 'sb_secret_abcdefghijklmnopqrstuv']) expect(names(ok), ok).toEqual([]);
  });

  it('[SEC-R03] a reference to an environment variable is not a key, and a real value still is', () => {
    const N = 'SUPABASE_SERVICE_ROLE_KEY';
    for (const ok of [`${N}: process.env.${N}`, `${N}=process.env.${N}`, `${N} = Deno.env.${N}`, `${N}: config.${N}`, `SERVICE_ROLE_KEY = your_service_role_key_goes_here`]) expect(names(ok), ok).toEqual([]);
    expect(names(`${N}: '${rand(40)}'`)).toEqual(['service role key value']);
    expect(names(`${N}=${jwt('service_role')}`).length).toBeGreaterThan(0);
  });

  it('[SEC-R03] a reference excludes a line only when it is the whole value', () => {
    const N = 'SUPABASE_SERVICE_ROLE_KEY';
    const real = rand(40);
    expect(names(`${N}: process.env.${N} || '${real}'`)).toEqual(['service role key value']);
    expect(names(`${N}: process.env.${N} ?? "${real}",`)).toEqual(['service role key value']);
    expect(names(`${N}=process.env.${N}`)).toEqual([]);
    expect(names(`${N}: process.env.${N}, // from the host`)).toEqual([]);
    expect(names(`${N}: process.env.${N};`)).toEqual([]);
    // a dotted value that is not a known reference shape is a value
    expect(names(`${N}=abc123.${rand(30)}`)).toEqual(['service role key value']);
    // a reference in a *_SECRET rule with a digit in it is still a reference
    expect(names(`${XS}=process.env.TOKEN_KEK_V2_SECRET`)).toEqual([]);
    expect(names(`${XS}=process.env.TOKEN_KEK_V2_SECRET || '${rand(30)}9a'`)).toEqual(['secret variable value (*_SECRET)']);
    expect(names(`${XS}=import.meta.env.PUBLIC_VALUE_V2_FOR_ASHA`)).toEqual([]);
    // a UUID-shaped secret is a value
    expect(names(`${XS}=${randomUUID()}`)).toEqual(['secret variable value (*_SECRET)']);
  });

  it('[SEC-R03] every match on a line is tried: a placeholder first does not hide a real key', () => {
    expect(names(`a=sb_secret_${'a'.repeat(30)} b=sb_secret_${rand(30)}`)).toEqual(['Supabase secret key (sb_secret_)']);
    expect(names(`${'AKIAIOSFODNN7EXAMPLE'} ${'AKIA' + rand(20).toUpperCase().slice(0, 16)}`)).toEqual(['AWS access key id']);
    expect(names(`SERVICE_ROLE_KEY=<key> and k=ghp_${rand(40)} and e=phx_${rand(40)}`).sort()).toEqual(['GitHub token', 'PostHog personal key (phx_)']);
    expect(names(`x=sb_secret_${'b'.repeat(30)} y=sb_secret_${'c'.repeat(30)}`)).toEqual([]);
  });

  it('[SEC-R03] every GitHub token prefix is found, and a short one is not', () => {
    for (const p of ['ghp', 'gho', 'ghu', 'ghs', 'ghr']) expect(names(`t=${p}_${rand(40)}`), p).toEqual(['GitHub token']);
    expect(names(`t=github_pat_${rand(50)}`)).toEqual(['GitHub token']);
    expect(names(`t=ghp_${rand(10)}`)).toEqual([]);
  });

  it('[SEC-R03] PostHog personal keys, OpenRouter keys and *_SECRET values are found; public and placeholder ones are not', () => {
    expect(names(`k=phx_${rand(40)}`)).toEqual(['PostHog personal key (phx_)']);
    expect(names(`k=phc_${rand(40)}`)).toEqual([]);
    expect(names(`k=sk-or-v1-${hex(32)}`)).toEqual(['OpenRouter key (sk-or-)']);
    expect(names(`PURGE_WORKER_SECRET=${rand(30)}9a`)).toEqual(['secret variable value (*_SECRET)']);
    expect(names(`"UNSUBSCRIBE_SECRET": "${rand(30)}7b"`)).toEqual(['secret variable value (*_SECRET)']);
    for (const ok of ['PURGE_WORKER_SECRET=process.env.PURGE_WORKER_SECRET', 'X_SECRET: ${{ secrets.X_SECRET }}', "E2E_SECRET: 'e2e-unsubscribe-secret-not-real'", `${XS}=${'a'.repeat(30)}`]) expect(names(ok), ok).toEqual([]);
  });

  it('[SEC-R03] a PEM with a blank line after its header, and an Apple .p8 body with no header, are found', () => {
    expect(names(`${BEGIN}\n\n${rand(60)}\n`)).toEqual(['private key block']);
    expect(names(`${BEGIN}\r\n\r\n${rand(60)}\r\n`)).toEqual(['private key block']);
    expect(names(`${BEGIN}\n\n\n\n\n\n${rand(60)}`)).toEqual([]);
    const p8 = ['MIGTAgEAMBMGByqGSM49AgEGCCqGSM49', 'AwEHBHkwdwIBAQQg'].join('');
    expect(names(`APPLE_P8=${p8}${rand(40)}`)).toEqual(['Apple .p8 key body (no header)']);
    expect(names(`starts with ${p8}`)).toEqual([]);
  });

  it('[SEC-R03] a value is "fake" only when the whole value is a placeholder', () => {
    expect(names(`sb_secret_${'a'.repeat(30)}`)).toEqual([]);
    expect(names('AKIAIOSFODNN7EXAMPLE')).toEqual([]);
    expect(names(`phx_${'x'.repeat(40)}`)).toEqual([]);
    for (const word of ['example', 'fake', 'dummy', 'signature', '0123456789', 'abcdefghijklmnop']) {
      expect(names(`sb_secret_${rand(20)}${word}${rand(20)}`), word).toEqual(['Supabase secret key (sb_secret_)']);
    }
    expect(names(`k=${'AKIA' + rand(8).toUpperCase().slice(0, 8)}EXAMPLE1`).length).toBe(1);
    const sig = (w: string) => `${b64url({ alg: 'HS256' })}.${b64url({ role: 'service_role' })}.${Buffer.from(w).toString('base64url')}`;
    expect(names(`k='${sig(`${rand(20)}fake${rand(20)}`)}'`)).toEqual(['service_role JWT']);
    expect(names(`k='${sig('signature')}'`)).toEqual([]);
  });

  it('[SEC-R03] the scanner has no file exemption: a key in scripts/packs/secret-scan.test.ts is found', () => {
    const dir = mkdtempSync(join(tmpdir(), 'el-secret-'));
    execFileSync('git', ['-C', dir, 'init', '-q']);
    mkdirSync(join(dir, 'scripts', 'packs'), { recursive: true });
    writeFileSync(join(dir, 'scripts', 'packs', 'secret-scan.test.ts'), `const k = 'sb_secret_${rand(30)}';\n`);
    execFileSync('git', ['-C', dir, 'add', '.']);
    expect(scanRepo(dir)).toEqual([{ file: 'scripts/packs/secret-scan.test.ts', line: 1, name: 'Supabase secret key (sb_secret_)' }]);
  });

  it('[SEC-R03] no rule prints a value: every new rule reports file, line and rule name only', () => {
    const dir = mkdtempSync(join(tmpdir(), 'el-secret-'));
    execFileSync('git', ['-C', dir, 'init', '-q']);
    const values = [`phx_${rand(40)}`, `sk-or-v1-${hex(32)}`, `gho_${rand(40)}`, `${rand(30)}9a`, `MIGTAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBHkwdwIBAQQg${rand(40)}`];
    writeFileSync(join(dir, 'all.txt'), [`a=${values[0]}`, `b=${values[1]}`, `c=${values[2]}`, `D_SECRET=${values[3]}`, `e=${values[4]}`].join('\n'));
    execFileSync('git', ['-C', dir, 'add', 'all.txt']);
    const r = spawnSync(process.execPath, [SCAN], { cwd: dir, encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr.match(/^SECRET all\.txt:[1-5]: /gm)).toHaveLength(5);
    for (const v of values) expect(r.stdout + r.stderr).not.toContain(v);
    for (const v of values) expect(r.stdout + r.stderr).not.toContain(v.slice(8));
  });

  it('[SEC-R03] the finding names file and line, never the value', () => {
    const dir = mkdtempSync(join(tmpdir(), 'el-secret-'));
    execFileSync('git', ['-C', dir, 'init', '-q']);
    const value = `sb_secret_${rand(30)}`;
    writeFileSync(join(dir, 'notes.txt'), `hello\nkey ${value}\n`);
    execFileSync('git', ['-C', dir, 'add', 'notes.txt']);
    expect(scanRepo(dir)).toEqual([{ file: 'notes.txt', line: 2, name: 'Supabase secret key (sb_secret_)' }]);
    const r = spawnSync(process.execPath, [SCAN], { cwd: dir, encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('SECRET notes.txt:2: Supabase secret key');
    expect(r.stdout + r.stderr).not.toContain(value);
  });

  it('[SEC-R03] no tracked file in this repo holds a key of a known kind', () => {
    expect(scanRepo(REPO)).toEqual([]);
  });
});
