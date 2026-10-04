/**
 * Builds the site and serves it for the whole run:
 *   1. a mock of the Resend API on a free port (nothing real is ever called, no email is sent);
 *   2. `next build` in its own distDir (.next-e2e, so a dev server or the normal .next is untouched) as the
 *      launch-day coming-soon site, with dummy Resend credentials so the sign-up form is present;
 *   3. `next start` on another free port, with RESEND_BASE_URL pointing at the mock.
 * It hands the two addresses to the workers through E2E_BASE_URL and E2E_MOCK_URL.
 *
 * E2E_SKIP_BUILD=1 reuses the last build (the build reads RESEND_*, SITE_MODE at build time, so only reuse a build
 * made by this setup). Build and server output go to e2e/.results/ for debugging.
 */
import { spawn, type ChildProcess } from 'node:child_process';
import { createWriteStream, existsSync, mkdirSync } from 'node:fs';
import { createServer } from 'node:net';
import { join, resolve } from 'node:path';
import { startMockResend, type MockHandle } from './mock-resend';
import { TEST_ENV } from './env';

// Playwright loads this file as CommonJS, so __dirname is available.
const webDir = resolve(__dirname, '../..');
const resultsDir = join(webDir, 'e2e/.results');
const DIST_DIR = '.next-e2e';

async function freePort(): Promise<number> {
  return new Promise((res, rej) => {
    const probe = createServer();
    probe.on('error', rej);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();
      const port = typeof address === 'object' && address ? address.port : 0;
      probe.close(() => res(port));
    });
  });
}

function nextBin(): string {
  return require.resolve('next/dist/bin/next', { paths: [webDir] });
}

function run(args: string[], env: NodeJS.ProcessEnv, logName: string, detached = false): ChildProcess {
  mkdirSync(resultsDir, { recursive: true });
  const log = createWriteStream(join(resultsDir, logName));
  const child = spawn(process.execPath, [nextBin(), ...args], { cwd: webDir, env, detached, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout?.pipe(log);
  child.stderr?.pipe(log);
  return child;
}

async function waitForSite(url: string, server: ChildProcess, timeoutMs = 60_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  let exited = false;
  server.once('exit', () => (exited = true));
  while (Date.now() < deadline) {
    if (exited) throw new Error(`next start exited early; see ${join(resultsDir, 'server.log')}`);
    try {
      const response = await fetch(url, { redirect: 'manual' });
      if (response.status < 500) return;
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`The site did not answer at ${url} within ${timeoutMs} ms; see ${join(resultsDir, 'server.log')}`);
}

export default async function globalSetup(): Promise<() => Promise<void>> {
  const mock: MockHandle = await startMockResend();
  const sitePort = await freePort();

  const env: NodeJS.ProcessEnv = {
    ...process.env,
    ...TEST_ENV,
    NEXT_DIST_DIR: DIST_DIR,
    NEXT_TELEMETRY_DISABLED: '1',
    // The launch-day home page (the organised coming-soon page) with the sign-up form.
    SITE_MODE: 'coming-soon',
    // Never let a stray variable from the shell change what is built or where mail goes.
    RESEND_BASE_URL: mock.url,
  };
  for (const name of ['VERCEL_ENV', 'VERCEL_URL', 'VERCEL_PROJECT_PRODUCTION_URL', 'NEXT_PUBLIC_SITE_URL', 'NEXT_PUBLIC_APP_STORE_URL', 'NEXT_PUBLIC_ANALYTICS', 'ENABLE_LAB', 'NODE_ENV']) {
    delete env[name];
  }

  if (process.env.E2E_SKIP_BUILD === '1' && existsSync(join(webDir, DIST_DIR, 'BUILD_ID'))) {
    console.log('[e2e] reusing the existing build in', DIST_DIR);
  } else {
    console.log('[e2e] next build (coming-soon, dummy Resend credentials) ...');
    const build = run(['build'], env, 'build.log');
    const code = await new Promise<number | null>((res) => build.once('exit', res));
    if (code !== 0) throw new Error(`next build failed (exit ${code}); see ${join(resultsDir, 'build.log')}`);
  }

  const server = run(['start', '-p', String(sitePort), '-H', '127.0.0.1'], env, 'server.log', true);
  const url = `http://127.0.0.1:${sitePort}`;
  await waitForSite(url, server);
  process.env.E2E_BASE_URL = url;
  process.env.E2E_MOCK_URL = mock.url;
  console.log(`[e2e] site ${url}, mock Resend ${mock.url}`);

  return async () => {
    if (server.pid) {
      try {
        process.kill(-server.pid, 'SIGTERM');
      } catch {
        server.kill('SIGTERM');
      }
    }
    await mock.close();
  };
}
