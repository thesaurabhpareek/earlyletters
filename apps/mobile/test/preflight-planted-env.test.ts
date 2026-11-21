/// <reference types="node" />
/**
 * [BL-506] The preflight's .env* guard is proven by running the script, not by reading its source.
 *
 * A temp copy of the app (the scripts, the config and the few repo files the preflight reads) gets a planted `.env.local`, and
 * the real script is spawned against it: the guard must print its FAIL line and the exit code must be non-zero. Each rule then
 * has a mutant (the same script with one edit) that the planted file must expose. The script locates its app directory from its
 * own path, so the temp copy is how a test points it elsewhere; nothing is written into apps/mobile.
 * Planted values are obviously fake ("asha", zeros) and are never printed: the test asserts the FAIL line names the key only.
 */
import { execFile } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';

const APP = join(__dirname, '..');
const REPO = join(APP, '..', '..');
const FAKE_VALUE = 'ashafictional0000';
const PLANTED = `EXPO_PUBLIC_SUPABASE_ANON_KEY=${FAKE_VALUE}\n`;
const CLEAN = 'EXPO_PUBLIC_APP_ENV=development\nEXPO_PUBLIC_SERVER_FEATURES=off\n';
const roots: string[] = [];

type Mutant = { file: 'preflight-testflight.mjs' | 'env-file-guard.mjs'; from: string; to: string };

/** A temp repo: the app without node_modules, plus what the preflight reads from the repo. Optionally one source edit. */
function sandbox(env: string | null, mutant?: Mutant): string {
  const root = mkdtempSync(join(tmpdir(), 'bl506-'));
  roots.push(root);
  const app = join(root, 'apps', 'mobile');
  cpSync(APP, app, { recursive: true, filter: (s) => !/\/(node_modules|ios|android|\.expo|coverage)(\/|$)/.test(s) && !/\/\.env[^/]*$/.test(s) });
  for (const p of ['packages/brand', 'packages/api/src/keys.ts', 'supabase/functions/config/published.ts', 'scripts/release', '.github/workflows/deploy-db.yml']) {
    mkdirSync(join(root, p, '..'), { recursive: true });
    cpSync(join(REPO, p), join(root, p), { recursive: true });
  }
  symlinkSync(join(REPO, 'node_modules'), join(root, 'node_modules'));
  if (env !== null) writeFileSync(join(app, '.env.local'), env);
  if (mutant) {
    const f = join(app, 'scripts', mutant.file);
    const text = readFileSync(f, 'utf8');
    expect(text.includes(mutant.from), `the mutant's target text is in ${mutant.file}`).toBe(true);
    writeFileSync(f, text.replace(mutant.from, mutant.to));
  }
  return root;
}

type Run = { code: number | null; lines: string[]; text: string };
const run = (root: string) =>
  new Promise<Run>((resolve) => {
    const env = { ...process.env };
    for (const k of Object.keys(env)) if (/^(EXPO_PUBLIC_|VITEST)/.test(k) || k === 'EAS_BUILD_PROFILE') delete env[k];
    const app = join(root, 'apps', 'mobile');
    execFile(process.execPath, [join(app, 'scripts/preflight-testflight.mjs'), '--profile', 'testflight', '--skip-prebuild'], { cwd: app, env, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }, (err, stdout, stderr) => {
      const text = `${stdout}${stderr}`;
      resolve({ code: err ? ((err as { code?: number }).code ?? 1) : 0, lines: text.split('\n'), text });
    });
  });
const envLines = (r: Run, level: string) => r.lines.filter((l) => l.startsWith(level) && /\.env\* (files hold only|holds other values)/.test(l));

const MUTANTS: Record<string, Mutant> = {
  'the guard result is discarded (bad.length = 0)': { file: 'preflight-testflight.mjs', from: 'check(bad.length === 0, ', to: 'bad.length = 0; check(bad.length === 0, ' },
  'the check call is removed': { file: 'preflight-testflight.mjs', from: 'check(bad.length === 0, ', to: 'void (bad.length === 0, ' },
  'a .env.local is not read': { file: 'preflight-testflight.mjs', from: "f.startsWith('.env'));", to: "f.startsWith('.env') && f !== '.env.local');" },
  'the guard function reports nothing': { file: 'env-file-guard.mjs', from: 'bad.push(', to: 'void (' },
};

afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
}, 60_000);

describe('[BL-506] the preflight, run against a planted .env.local', () => {
  it('[BL-506] a planted server key is a FAIL that names the file and the key, never the value, and the exit is non-zero', async () => {
    const r = await run(sandbox(PLANTED));
    const fails = envLines(r, 'FAIL');
    expect(fails).toHaveLength(1);
    expect(fails[0]).toContain('.env.local: EXPO_PUBLIC_SUPABASE_ANON_KEY');
    expect(r.text).not.toContain(FAKE_VALUE);
    expect(envLines(r, 'PASS')).toEqual([]);
    expect(r.code).not.toBe(0);
  }, 120_000);

  it('[BL-506] a harmless .env.local (app env, servers off) passes the guard, so the FAIL above is the guard and not the setup', async () => {
    const r = await run(sandbox(CLEAN));
    expect(envLines(r, 'PASS')).toHaveLength(1);
    expect(envLines(r, 'PASS')[0]).toContain('.env.local');
    expect(envLines(r, 'FAIL')).toEqual([]);
  }, 120_000);

  it('[BL-506] the Delete account switch in a .env.local is a FAIL, with the Metro way in the message', async () => {
    const r = await run(sandbox('EXPO_PUBLIC_ACCOUNT_DELETION=on\n'));
    expect(envLines(r, 'FAIL')).toHaveLength(1);
    expect(envLines(r, 'FAIL')[0]).toMatch(/EXPO_PUBLIC_ACCOUNT_DELETION is never set in a \.env file/);
    expect(r.code).not.toBe(0);
  }, 120_000);

  for (const [name, mutant] of Object.entries(MUTANTS)) {
    it(`[BL-506] mutant: ${name}; the planted file exposes it (no FAIL line, the planted key goes unreported)`, async () => {
      const r = await run(sandbox(PLANTED, mutant));
      expect(envLines(r, 'FAIL'), 'a surviving mutant would still fail').toEqual([]);
      expect(r.text).not.toContain('EXPO_PUBLIC_SUPABASE_ANON_KEY');
      // The mutant ran to the check after the guard: it is the guard that went quiet, not the script that crashed.
      expect(r.lines.some((l) => /profile names no Supabase or analytics key in eas\.json/.test(l)), 'the script ran past section 4').toBe(true);
    }, 120_000);
  }
});
