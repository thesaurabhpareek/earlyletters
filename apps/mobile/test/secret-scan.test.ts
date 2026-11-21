/// <reference types="node" />
/**
 * SEC-R02 and SEC-R03 (BRIEF CI-SECRET): the repo scanner finds a service key, a private key block, an EAS token and an
 * Anthropic or GitHub token in a tracked file, and says only the file, the line and the rule. Every planted value is
 * built at run time from random bytes, so this file never holds one whole (and the scanner reads this file too).
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, writeFileSync } from 'node:fs';
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

  it('[SEC-R03] EAS, Anthropic and GitHub tokens are found, and placeholders are not', () => {
    expect(names(`EXPO_TOKEN=${rand(40)}`)).toEqual(['EAS token (EXPO_TOKEN)']);
    expect(names(`k: sk-ant-${rand(40)}`)).toEqual(['Anthropic key (sk-ant-)']);
    expect(names(`t=ghp_${rand(40)}`)).toEqual(['GitHub token']);
    for (const ok of ['EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}', 'EXPO_TOKEN=<token>', 'sk-ant-...', 'SERVICE_ROLE_KEY=$KEY', 'sb_secret_abcdefghijklmnopqrstuv']) expect(names(ok), ok).toEqual([]);
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
