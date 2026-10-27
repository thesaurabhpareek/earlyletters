/// <reference types="node" />
/**
 * The signing key and the upload secret never reach git (review A of #162,
 * finding 2), run by `npm test -w @scribe/api`, so in CI on every PR:
 *  - .gitignore ignores the key and credential files at any depth;
 *  - `secret-scan.mjs --staged` fails when a staged file holds a key, and
 *    names only the file and line;
 *  - no tracked file in this repo holds one (this is the CI check).
 * A repo-wide secret scan for every credential type is a request to S20.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateSigningKey } from '../../packages/api/src/index';
import { scanRepo, scanText } from './secret-scan.mjs';

const REPO = path.resolve(__dirname, '../..');
const SCAN = path.join(REPO, 'scripts/packs/secret-scan.mjs');
// Built at run time, so this file's own text never holds a key-shaped line.
const NAME = ['EL', 'SIGNING', 'KEY'].join('_');
const R2 = ['PACKS', 'S3', 'SECRET', 'ACCESS', 'KEY'].join('_');
const realKeyLine = () => `${NAME}=${generateSigningKey().secretKey}`;

describe('scanText', () => {
  it('finds the line keygen.mjs prints for the password manager, in any of the forms a key file allows', () => {
    const secret = generateSigningKey().secretKey;
    for (const line of [`${NAME}=${secret}`, `export ${NAME}="${secret}"`, `${NAME}: '${secret}'`, `  ${NAME} = ${secret}`]) {
      expect(scanText(`# notes\n${line}\n`), line).toEqual([{ line: 2, name: 'pack signing key (EL_SIGNING_KEY)' }]);
    }
    expect(scanText(`${R2}=AbCdEfGhIjKlMnOpQrStUvWxYz0123456789abcd`)).toEqual([{ line: 1, name: 'upload secret (PACKS_S3_SECRET_ACCESS_KEY)' }]);
  });

  it('does not flag mentions and placeholders (the runbook, the scripts, the tests)', () => {
    for (const text of [`${NAME}=...`, `${NAME}=\${secretKey}`, `${NAME}: key.secretKey`, `${R2}=<secret access key>`, `${R2}=$SECRET`, `${R2}: 'secret'`, `secretAccessKey: '${R2}',`]) {
      expect(scanText(text), text).toEqual([]);
    }
  });
});

describe('git', () => {
  const tmpRepo = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'el-secret-scan-'));
    execFileSync('git', ['-C', dir, 'init', '-q']);
    return dir;
  };

  it('ignores the key and credential files at any depth, and still tracks .env.development', () => {
    const ignored = (p: string) => spawnSync('git', ['-C', REPO, 'check-ignore', '-q', '--no-index', p]).status === 0;
    for (const p of ['signing.env', 'apps/mobile/signing.env', 'scripts/packs/deep/prod.signing.env', 'r2.env', 'packages/api/my.r2.env', '.env']) expect(ignored(p), p).toBe(true);
    expect(ignored('apps/mobile/.env.development')).toBe(false);
  });

  it('--staged fails on a staged key and names the file and line, never the value', () => {
    const dir = tmpRepo();
    const line = realKeyLine();
    fs.writeFileSync(path.join(dir, 'notes.txt'), `hello\n${line}\n`);
    execFileSync('git', ['-C', dir, 'add', 'notes.txt']);
    const r = spawnSync(process.execPath, [SCAN, '--staged'], { cwd: dir, encoding: 'utf8' });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain('SECRET notes.txt:2: pack signing key');
    expect(r.stdout + r.stderr).not.toContain(line.split('=')[1]);
    execFileSync('git', ['-C', dir, 'rm', '-q', '--cached', 'notes.txt']); // unstage (the repo has no commit yet)
    const clean = spawnSync(process.execPath, [SCAN, '--staged'], { cwd: dir, encoding: 'utf8' });
    expect(clean.status).toBe(0);
  });

  it('[CI] no tracked file in this repo holds a signing key or an upload secret', () => {
    expect(scanRepo(REPO)).toEqual([]);
  });
});
