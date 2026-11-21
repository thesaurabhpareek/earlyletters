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
const CLEAN = 'EXPO_PUBLIC_APP_ENV=development\nEXPO_PUBLIC_SERVER_FEATURES=off\n';
const roots: string[] = [];

type Mutant = { file: 'preflight-testflight.mjs' | 'env-file-guard.mjs'; from: string; to: string };

/** A temp repo: the app without node_modules, plus what the preflight reads from the repo. Optionally one source edit. */
function sandbox(env: { file: string; text: string } | null, mutant?: Mutant): string {
  const root = mkdtempSync(join(tmpdir(), 'bl506-'));
  roots.push(root);
  const app = join(root, 'apps', 'mobile');
  cpSync(APP, app, { recursive: true, filter: (s) => !/\/(node_modules|ios|android|\.expo|coverage)(\/|$)/.test(s) && !/\/\.env[^/]*$/.test(s) });
  for (const p of ['packages/brand', 'packages/api/src/keys.ts', 'supabase/functions/config/published.ts', 'scripts/release', '.github/workflows/deploy-db.yml']) {
    mkdirSync(join(root, p, '..'), { recursive: true });
    cpSync(join(REPO, p), join(root, p), { recursive: true });
  }
  symlinkSync(join(REPO, 'node_modules'), join(root, 'node_modules'));
  if (env !== null) writeFileSync(join(app, env.file), env.text);
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

const FILES = ['.env', '.env.local', '.env.production', '.env.development', '.env.development.local'];
/** Fake keys, shaped like the real ones; the values are never real and must never appear in the output. */
const KEYS: Record<string, string> = {
  EXPO_PUBLIC_SUPABASE_ANON_KEY: FAKE_VALUE,
  SUPABASE_SERVICE_ROLE_KEY: `${FAKE_VALUE}service`,
  EXPO_PUBLIC_POSTHOG_KEY: `${FAKE_VALUE}posthog`,
};
const plant = (file: string, key: string) => ({ file, text: `${key}=${KEYS[key]}\n` });

const mutantFor = (file: string): Mutant => ({ file: 'preflight-testflight.mjs', from: "f.startsWith('.env'));", to: `f.startsWith('.env') && f !== '${file}');` });
const MUTANTS: Record<string, Mutant> = {
  'the guard result is discarded (bad.length = 0)': { file: 'preflight-testflight.mjs', from: 'check(bad.length === 0, ', to: 'bad.length = 0; check(bad.length === 0, ' },
  'the check call is removed': { file: 'preflight-testflight.mjs', from: 'check(bad.length === 0, ', to: 'void (bad.length === 0, ' },
  'the guard function reports nothing': { file: 'env-file-guard.mjs', from: 'bad.push(', to: 'void (' },
};

afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
}, 60_000);

describe('[BL-506] the preflight, run against a planted .env file', () => {
  it('[BL-506] each key planted in each .env file the build or dev server loads is a FAIL naming the file and the key, never the value', async () => {
    const cases = FILES.flatMap((f) => Object.keys(KEYS).map((k) => [f, k] as const));
    const runs = await Promise.all(cases.map(([f, k]) => run(sandbox(plant(f, k)))));
    runs.forEach((r, i) => {
      const [f, k] = cases[i];
      const fails = envLines(r, 'FAIL');
      expect(fails, `${f} ${k}`).toHaveLength(1);
      expect(fails[0], `${f} ${k}`).toContain(`${f}: ${k}`);
      expect(r.text, `${f} ${k}: the value is not printed`).not.toContain(KEYS[k]);
      expect(envLines(r, 'PASS'), `${f} ${k}`).toEqual([]);
    });
  }, 180_000);

  it('[BL-506] a harmless file (app env, servers off) passes the guard in each name, so the FAIL above is the guard and not the setup', async () => {
    const runs = await Promise.all(FILES.map((f) => run(sandbox({ file: f, text: CLEAN }))));
    runs.forEach((r, i) => {
      expect(envLines(r, 'PASS'), FILES[i]).toHaveLength(1);
      expect(envLines(r, 'PASS')[0]).toContain(FILES[i]);
      expect(envLines(r, 'FAIL'), FILES[i]).toEqual([]);
    });
  }, 180_000);

  it('[BL-506] the Delete account switch in a .env.local is a FAIL, with the Metro way in the message', async () => {
    const r = await run(sandbox({ file: '.env.local', text: 'EXPO_PUBLIC_ACCOUNT_DELETION=on\n' }));
    expect(envLines(r, 'FAIL')).toHaveLength(1);
    expect(envLines(r, 'FAIL')[0]).toMatch(/EXPO_PUBLIC_ACCOUNT_DELETION is never set in a \.env file/);
  }, 120_000);

  // The proof is the FAIL line: the sandbox exits 1 on its own (section 6 needs packages/content), so the exit code says nothing here.
  const survives = (r: Run) => {
    expect(envLines(r, 'FAIL'), 'a surviving mutant would still fail').toEqual([]);
    expect(r.text).not.toContain('SUPABASE');
    // The mutant ran to the check after the guard: it is the guard that went quiet, not the script that crashed.
    expect(r.lines.some((l) => /profile names no Supabase or analytics key in eas\.json/.test(l)), 'the script ran past section 4').toBe(true);
  };
  for (const [name, mutant] of Object.entries(MUTANTS)) {
    it(`[BL-506] mutant: ${name}; planted in every file name it goes unreported`, async () => {
      const runs = await Promise.all(FILES.map((f) => run(sandbox(plant(f, 'SUPABASE_SERVICE_ROLE_KEY'), mutant))));
      runs.forEach(survives);
    }, 180_000);
  }
  for (const f of FILES) {
    it(`[BL-506] mutant: ${f} is not read; its planted keys go unreported`, async () => {
      survives(await run(sandbox(plant(f, 'SUPABASE_SERVICE_ROLE_KEY'), mutantFor(f))));
    }, 120_000);
  }

  // Found in review of #1219, fixed after #1203 merges: scripts/env-file-guard.mjs:32 splits a line on "=" and :36 puts the first
  // part in the message, so a line with no "=" (a bare secret, or "KEY:value") is printed whole. This is red today by design.
  it.fails('[BL-506] a line with no "=" does not put its text into the FAIL message (follow-up after #1203)', async () => {
    const secret = 'sb_secret_ashafictional0000';
    const r = await run(sandbox({ file: '.env.local', text: `${secret}\n` }));
    expect(envLines(r, 'FAIL')).toHaveLength(1);
    expect(r.text).not.toContain(secret);
  }, 120_000);
});
