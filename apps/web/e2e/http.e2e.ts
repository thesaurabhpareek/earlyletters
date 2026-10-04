/** Things a crawler, a proxy or a browser's security model sees: robots, sitemap, redirects, headers, CSP in action. */
import { siteOrigin } from '../src/lib/legal/origin';
import { legalSlugs } from '../src/lib/legal/documents';
import { expect, test } from './support/fixtures';

test.describe('robots.txt and sitemap.xml', () => {
  test('robots.txt allows the site and keeps crawlers out of the lab, the API and unsubscribe', async ({ request }) => {
    const res = await request.get('/robots.txt');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/^text\/plain/);
    const text = await res.text();
    expect(text).toMatch(/User-Agent: \*/i);
    expect(text).toMatch(/^Allow: \/$/m);
    for (const path of ['/lab', '/api', '/unsubscribe']) expect(text).toMatch(new RegExp(`^Disallow: ${path}$`, 'm'));
    expect(text).toContain(`Sitemap: ${siteOrigin}/sitemap.xml`);
  });

  test('sitemap.xml lists the home page, the four legal documents and delete-account, all on the primary domain', async ({ request }) => {
    const res = await request.get('/sitemap.xml');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toMatch(/xml/);
    const xml = await res.text();
    const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    expect(locs.sort()).toEqual([siteOrigin, ...legalSlugs.map((s) => `${siteOrigin}/${s}`), `${siteOrigin}/delete-account`].sort());
    expect(xml).not.toMatch(/\/lab|\/api|\/unsubscribe/);
    // A legal page carries its document's own date.
    expect(xml).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}/);
  });

  test('every address in the sitemap exists on this site', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text();
    for (const [, loc] of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
      const res = await request.get(new URL(loc).pathname || '/');
      expect(res.status(), loc).toBe(200);
    }
  });
});

test.describe('domain redirects (next.config.ts redirects)', () => {
  for (const host of ['www.earlyletters.com', 'earlyletters.app', 'www.earlyletters.app']) {
    test(`${host} answers 308 to earlyletters.com, keeping path and query`, async ({ request }) => {
      for (const target of ['/', '/privacy', '/unsubscribe?t=abc.def&x=1']) {
        const res = await request.get(target, { headers: { host }, maxRedirects: 0 });
        expect(res.status(), `${host}${target}`).toBe(308);
        // Compared as addresses: the root may come back with or without its slash.
        expect(new URL(res.headers().location).href).toBe(new URL(`https://earlyletters.com${target}`).href);
      }
    });
  }

  test('the primary domain, a preview address and local development are never redirected', async ({ request }) => {
    for (const host of ['earlyletters.com', 'earlyletters-web-git-x.vercel.app', 'localhost:3100', 'notearlyletters.app', 'earlyletters.com.evil.example']) {
      const res = await request.get('/privacy', { headers: { host }, maxRedirects: 0 });
      expect(res.status(), host).toBe(200);
    }
  });
});

test.describe('security headers', () => {
  const paths = ['/', '/privacy', '/delete-account', '/unsubscribe', '/this-page-does-not-exist', '/api/notify', '/robots.txt'];

  for (const path of paths) {
    test(`${path} carries the full set`, async ({ request }) => {
      const res = await request.get(path);
      const h = res.headers();
      const csp = h['content-security-policy'];
      expect(csp, 'CSP').toBeTruthy();
      const directives = Object.fromEntries(csp.split(';').map((d) => d.trim()).filter(Boolean).map((d) => [d.split(' ')[0], d.split(' ').slice(1).join(' ')]));
      expect(directives['default-src']).toBe("'self'");
      expect(directives['frame-ancestors']).toBe("'none'");
      expect(directives['object-src']).toBe("'none'");
      expect(directives['base-uri']).toBe("'self'");
      expect(directives['form-action']).toBe("'self'");
      expect(directives['connect-src']).toBe("'self'");
      expect(directives['img-src']).toBe("'self' data: blob:");
      // Production: no eval and no websockets (those are development only).
      expect(directives['script-src']).toBe("'self' 'unsafe-inline'");
      expect(csp).not.toContain('unsafe-eval');
      expect(csp).not.toMatch(/\bws:|wss:/);
      expect(csp).not.toMatch(/https?:\/\/(?!earlyletters)/); // no third-party origin is allowed anywhere
      expect(csp).toContain('upgrade-insecure-requests');

      expect(h['strict-transport-security']).toBe('max-age=63072000; includeSubDomains');
      expect(h['strict-transport-security']).not.toContain('preload');
      expect(h['x-frame-options']).toBe('DENY');
      expect(h['x-content-type-options']).toBe('nosniff');
      expect(h['referrer-policy']).toBe('strict-origin-when-cross-origin');
      expect(h['permissions-policy']).toBe('camera=(), microphone=(), geolocation=()');
      expect(h['x-powered-by'], 'the framework is not advertised').toBeUndefined();
    });
  }

  test('links that carry a token never leak their address through Referer', async ({ request }) => {
    for (const base of ['/a', '/i', '/j', '/r']) {
      const res = await request.get(`${base}/some-token`);
      expect(res.headers()['referrer-policy'], base).toBe('no-referrer');
    }
  });

  test('API answers are never cached', async ({ request, clientIp }) => {
    const res = await request.post('/api/notify', { headers: { 'x-forwarded-for': clientIp }, data: { email: 'bad', company: '' } });
    expect(res.headers()['cache-control']).toBe('no-store');
  });
});

test.describe('the browser enforces the policy', () => {
  test.use({ strictConsole: false }); // blocked actions are reported by the browser as console errors, on purpose

  test('string evaluation (eval) is refused', async ({ page }) => {
    await page.goto('/privacy');
    // Run from the page's own code, through a real click on an inline handler: code injected by the test tool
    // (evaluate, even a script element it adds) is allowed to bypass the policy, so it would prove nothing.
    await page.evaluate(() => {
      document.body.insertAdjacentHTML(
        'beforeend',
        `<button id="csp-probe" onclick="try { eval('1 + 1'); window.__evalResult = 'allowed'; } catch (e) { window.__evalResult = e.name; }">probe</button>`,
      );
    });
    await page.locator('#csp-probe').click();
    const outcome = await page.evaluate(() => (window as unknown as { __evalResult?: string }).__evalResult);
    expect(outcome).toBe('EvalError');
  });

  test('the site cannot be framed, not even by itself (frame-ancestors none, X-Frame-Options DENY)', async ({ page }) => {
    await page.goto('/privacy');
    await page.evaluate(() => {
      const frame = document.createElement('iframe');
      frame.id = 'probe';
      frame.src = '/terms';
      document.body.append(frame);
    });
    await expect.poll(() => page.frames().length).toBe(2);
    await expect.poll(() => page.frames()[1].url(), { timeout: 10_000 }).toMatch(/^chrome-error:/);
  });

  test('a form on the site cannot be pointed at another site (form-action self)', async ({ page }) => {
    await page.goto('/privacy');
    await page.evaluate(() => {
      const form = document.createElement('form');
      form.id = 'probe';
      form.method = 'post';
      form.action = 'https://example.org/collect';
      document.body.append(form);
      form.requestSubmit?.();
    });
    await page.waitForTimeout(500);
    expect(new URL(page.url()).origin).toBe(new URL(process.env.E2E_BASE_URL as string).origin);
  });
});
