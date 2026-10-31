import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { MOCK_SUPABASE_URL } from './mock-server';
import { serve } from './server';

const ROOT = path.resolve(__dirname, '../..'); // apps/mobile
const DIST = path.join(ROOT, 'e2e-web/.web-dist');

const SEED_DIST = path.join(ROOT, 'e2e-web/.web-dist-seed');
/**
 * Third build: server features on (D-100; the TestFlight alpha of D-106), with the seed switch, for
 * the co-parent flows (j21-coparent.flow.ts). It points at a Supabase host nothing listens on; the
 * flows answer what they need with a mocked server (support/mock-server.ts) and assert that nothing
 * else is asked. Kept under .results/ so git ignores it like the other builds.
 */
const ON_DIST = path.join(ROOT, 'e2e-web/.results/web-dist-server-on');

function build(dist: string, extra: Record<string, string>) {
  console.log(`[e2e-web] expo export --platform web -> ${path.basename(dist)} ...`);
  const r = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--clear', '--output-dir', dist], {
    cwd: ROOT,
    env: { ...process.env, EXPO_PUBLIC_APP_ENV: 'preview', EXPO_PUBLIC_SERVER_FEATURES: 'off', CI: '1', ...extra },
    stdio: 'inherit',
  });
  if (r.status !== 0) throw new Error('expo export failed');
}

export default async function globalSetup() {
  const rebuild = process.env.E2E_WEB_REBUILD === '1';
  if (!fs.existsSync(path.join(DIST, 'index.html')) || rebuild) build(DIST, {});
  // Second build, same app, with the web design preview switch (EXPO_PUBLIC_WEB_PREVIEW=1): `?seed=asha` fills the
  // on-device database with the fictional family, so states that need many letters or a transcript (the web has no
  // speech model) can be shown on the real screens. Flows that start from `?seed=` say so in their step notes.
  if (!fs.existsSync(path.join(SEED_DIST, 'index.html')) || rebuild) build(SEED_DIST, { EXPO_PUBLIC_WEB_PREVIEW: '1' });
  if (!fs.existsSync(path.join(ON_DIST, 'index.html')) || rebuild) {
    build(ON_DIST, {
      EXPO_PUBLIC_WEB_PREVIEW: '1',
      EXPO_PUBLIC_SERVER_FEATURES: 'on',
      // The Delete account row is a build flag on top of server features (lib/capabilities.ts, founder 30 Oct 2026): the two
      // alpha EAS profiles leave it unset (row hidden), but the flows that open Delete account need it on in this build.
      EXPO_PUBLIC_ACCOUNT_DELETION: 'on',
      EXPO_PUBLIC_SUPABASE_URL: MOCK_SUPABASE_URL,
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'e2e-web-publishable-key',
    });
  }
  const s = await serve(DIST);
  const seeded = await serve(SEED_DIST);
  const on = await serve(ON_DIST);
  process.env.E2E_WEB_URL = s.url;
  process.env.E2E_WEB_SEED_URL = seeded.url;
  process.env.E2E_WEB_ON_URL = on.url;
  console.log(`[e2e-web] serving ${DIST} at ${s.url}, ${SEED_DIST} at ${seeded.url} and ${ON_DIST} at ${on.url}`);
  return async () => {
    await s.close();
    await seeded.close();
    await on.close();
  };
}
