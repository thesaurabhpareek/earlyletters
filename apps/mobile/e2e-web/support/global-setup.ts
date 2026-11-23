import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { BUILDS, buildEnv, inheritedEnv, type WebBuild } from './builds';
import { MOCK_SUPABASE_URL } from './mock-server';
import { serve } from './server';

const ROOT = path.resolve(__dirname, '../..'); // apps/mobile

/**
 * Four builds of the same app, each from the env in builds.ts (a test reads that file; nothing here sets an app env):
 *  - plain: no seed switch.
 *  - seed: the web design preview switch (`?seed=asha` fills the on-device database with the fictional family), so states
 *    that need many letters or a transcript (the web has no speech model) show on the real screens.
 *  - server-on: server features on (D-100; the TestFlight alpha of D-106) for the co-parent flows (j21-coparent.flow.ts).
 *    It points at a Supabase host nothing listens on; the flows answer with a mocked server (support/mock-server.ts).
 *  - seam (BL-410): seed plus the web presentation seam (`?e2eFontScale=`, `?e2eLang=`); the only build with the e2e switch.
 * All under .results/ or the two older dist folders, which git ignores.
 */
function build(b: WebBuild) {
  const dist = path.join(ROOT, b.dir);
  console.log(`[e2e-web] expo export --platform web -> ${path.basename(dist)} ...`);
  const r = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--clear', '--output-dir', dist], {
    cwd: ROOT,
    env: { ...inheritedEnv(process.env), ...buildEnv(b.env) },
    stdio: 'inherit',
  });
  if (r.status !== 0) throw new Error('expo export failed');
}

export default async function globalSetup() {
  const rebuild = process.env.E2E_WEB_REBUILD === '1';
  const urls: string[] = [];
  const closers: Array<() => Promise<void>> = [];
  for (const b of BUILDS) {
    const dist = path.join(ROOT, b.dir);
    if (!fs.existsSync(path.join(dist, 'index.html')) || rebuild) build(b);
    const s = await serve(dist);
    urls.push(`${dist} at ${s.url}`);
    closers.push(s.close);
    process.env[{ plain: 'E2E_WEB_URL', seed: 'E2E_WEB_SEED_URL', 'server-on': 'E2E_WEB_ON_URL', seam: 'E2E_WEB_SEAM_URL' }[b.name]] = s.url;
  }
  console.log(`[e2e-web] serving ${urls.join(', ')} (mock server ${MOCK_SUPABASE_URL})`);
  return async () => {
    for (const close of closers) await close();
  };
}
