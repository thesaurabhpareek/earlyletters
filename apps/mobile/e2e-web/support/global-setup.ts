import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { serve } from './server';

const ROOT = path.resolve(__dirname, '../..'); // apps/mobile
const DIST = path.join(ROOT, 'e2e-web/.web-dist');

const SEED_DIST = path.join(ROOT, 'e2e-web/.web-dist-seed');

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
  const s = await serve(DIST);
  const seeded = await serve(SEED_DIST);
  process.env.E2E_WEB_URL = s.url;
  process.env.E2E_WEB_SEED_URL = seeded.url;
  console.log(`[e2e-web] serving ${DIST} at ${s.url} and ${SEED_DIST} at ${seeded.url}`);
  return async () => {
    await s.close();
    await seeded.close();
  };
}
