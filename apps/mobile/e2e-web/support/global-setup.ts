import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { serve } from './server';

const ROOT = path.resolve(__dirname, '../..'); // apps/mobile
const DIST = path.join(ROOT, 'e2e-web/.web-dist');

export default async function globalSetup() {
  if (!fs.existsSync(path.join(DIST, 'index.html')) || process.env.E2E_WEB_REBUILD === '1') {
    console.log('[e2e-web] expo export --platform web (preview build, no backend) ...');
    const r = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', DIST], {
      cwd: ROOT,
      env: { ...process.env, EXPO_PUBLIC_APP_ENV: 'preview', CI: '1' },
      stdio: 'inherit',
    });
    if (r.status !== 0) throw new Error('expo export failed');
  }
  const s = await serve(DIST);
  process.env.E2E_WEB_URL = s.url;
  console.log(`[e2e-web] serving ${DIST} at ${s.url}`);
  return async () => {
    await s.close();
  };
}
