/**
 * Test fixtures and the step recorder.
 *
 * `step(id, ...)` is how a flow says "the customer is now on this screen". It records the step (and, when
 * JOURNEY_SHOTS=1, a screenshot) into docs/release/journey/steps/<id>.json so the journey map and PDF are built from
 * what the tests really saw, never from a hand-drawn picture. A step is one of:
 *   happy    the path the product is designed around
 *   unhappy  something goes wrong or the person chooses to stop; the screen shows how the product answers
 */
import { test as base, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export const OUT = path.resolve(__dirname, '../../../../docs/release/journey');
const SHOTS = process.env.JOURNEY_SHOTS === '1';

export type StepMeta = {
  /** Stable id, e.g. 'J01-age-gate-yes'. Sorted by this to build the flow. */
  id: string;
  /** Journey it belongs to, e.g. 'first-run'. */
  journey: string;
  kind: 'happy' | 'unhappy';
  /** What the customer sees or does, in plain words. */
  title: string;
  /** What the product does about it. */
  note?: string;
  /** The id of the step this one follows (for branches), if not simply the previous. */
  from?: string;
};

/**
 * Open the seeded build (fictional family Asha: see src/dev/asha-seed.ts). Same app, same screens, data filled in.
 * A phone with letters from an earlier session is asked, once, whether to share usage (the "Help us make it better?"
 * sheet appears on a tab screen 1.2 s after it opens). Unless `keepConsent`, that ask is answered "Don't share" first,
 * so later steps are not covered by it; the answer is the app's own and persists, like on a phone.
 */
export async function seeded(page: Page, kind: 'asha' | 'asha-waiting' | 'asha-quiet' | 'asha-marks' | 'asha-plus' = 'asha', path = '/', opts: { keepConsent?: boolean } = {}) {
  const base = process.env.E2E_WEB_SEED_URL;
  await page.goto(`${base}/?seed=${kind}`);
  await expect(page.locator('body')).not.toBeEmpty();
  if (opts.keepConsent) {
    if (path !== '/') await page.goto(`${base}${path}${path.includes('?') ? '&' : '?'}seed=${kind}`);
    return;
  }
  const decline = page.getByRole('button', { name: "Don't share" });
  await decline.waitFor({ timeout: 8000 });
  await decline.click();
  await decline.waitFor({ state: 'hidden' });
  await page.waitForTimeout(300);
  if (path !== '/') await page.goto(`${base}${path}${path.includes('?') ? '&' : '?'}seed=${kind}`);
}

const ALLOWED_PAGE = new WeakMap<Page, RegExp[]>();
/** A step that injects a fault on purpose may expect the page to throw. */
export function allowPageError(page: Page, re: RegExp): void {
  ALLOWED_PAGE.set(page, [...(ALLOWED_PAGE.get(page) ?? []), re]);
}

const ALLOWED = new WeakMap<Page, RegExp[]>();
/** A step that deliberately shows an error state may expect the browser to log it. */
export function allowConsoleError(page: Page, re: RegExp): void {
  ALLOWED.set(page, [...(ALLOWED.get(page) ?? []), re]);
}

/** `settle`: ms to wait before capturing (default 500, for entering animations). A screen that leaves on its own needs less. */
export type Recorder = (meta: StepMeta, opts?: { settle?: number }) => Promise<void>;

export const test = base.extend<{ record: Recorder; app: Page }>({
  // Every test opens the app fresh: a clean browser profile means a clean on-device database.
  app: async ({ page }, use) => {
    const errors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
    });
    // Screenshots are the app viewport only: no scrollbars of any kind (also after a reload).
    await page.addInitScript(() => {
      const add = () => {
        const st = document.createElement('style');
        st.textContent = '*::-webkit-scrollbar{display:none!important;width:0!important;height:0!important}*{scrollbar-width:none!important}';
        document.documentElement.appendChild(st);
      };
      if (document.documentElement) add();
      else document.addEventListener('DOMContentLoaded', add);
    });
    await page.goto('/');
    await use(page);
    const allowedPage = ALLOWED_PAGE.get(page) ?? [];
    expect(
      errors.filter((m) => !allowedPage.some((re) => re.test(m))),
      'uncaught page errors',
    ).toEqual([]);
    const allowed = ALLOWED.get(page) ?? [];
    expect(
      consoleErrors.filter((m) => !allowed.some((re) => re.test(m))),
      'console errors (allow one with allowConsoleError() only when the step is deliberately an error state)',
    ).toEqual([]);
  },
  record: async ({ page }, use) => {
    await use(async (meta, opts) => {
      const dir = path.join(OUT, 'steps');
      fs.mkdirSync(dir, { recursive: true });
      await page.waitForTimeout(opts?.settle ?? 500); // let the entering animation settle
      // Only text a person can see: not display:none, not transparent, not a hidden tab behind this one.
      const lines = await page.evaluate(() => {
        const out: string[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (let n = walker.nextNode(); n; n = walker.nextNode()) {
          const t = (n.textContent ?? '').replace(/\s+/g, ' ').trim();
          const el = n.parentElement;
          if (!t || !el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
          if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0 || r.right <= 0 || r.left >= window.innerWidth) continue;
          // Text covered by another screen (an inactive tab is kept mounted behind the active one) is not on screen.
          const cx = r.left + r.width / 2;
          const cy = r.top + Math.min(r.height / 2, 12);
          if (cx >= 0 && cx < window.innerWidth && cy >= 0 && cy < window.innerHeight) {
            const hit = document.elementFromPoint(cx, cy);
            if (hit && !el.contains(hit) && !hit.contains(el)) continue;
          }
          out.push(t);
        }
        return out;
      });
      const text = lines.join(' ').slice(0, 6000);
      // Safe-area insets the app applies (CSS env(); 0 in a desktop browser) next to the iPhone 17 Pro nominal values.
      const measured = await page.evaluate(() => {
        const probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom);visibility:hidden';
        document.body.appendChild(probe);
        const cs = getComputedStyle(probe);
        const r = { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
        probe.remove();
        return r;
      });
      // The tallest scrolling area decides whether this screen scrolls (then a full-length capture is taken too).
      const extra = await page.evaluate(() => {
        let best = 0;
        for (const el of Array.from(document.querySelectorAll<HTMLElement>('*'))) {
          const oy = getComputedStyle(el).overflowY;
          if ((oy === 'auto' || oy === 'scroll') && el.clientHeight > 200) best = Math.max(best, el.scrollHeight - el.clientHeight);
        }
        return best;
      });
      const shot = SHOTS ? `screens/${meta.id}.png` : undefined;
      let full: string | undefined;
      if (shot) {
        fs.mkdirSync(path.join(OUT, 'screens'), { recursive: true });
        await page.screenshot({ path: path.join(OUT, shot) });
        if (extra > 8) {
          const vp = page.viewportSize()!;
          full = `screens/${meta.id}-full.png`;
          await page.setViewportSize({ width: vp.width, height: vp.height + extra + 8 });
          await page.waitForTimeout(400);
          await page.screenshot({ path: path.join(OUT, full) });
          await page.setViewportSize(vp);
          await page.waitForTimeout(300);
        }
      }
      const json = {
        ...meta,
        shot,
        full,
        route: new URL(page.url()).pathname.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, ':id'),
        viewport: page.viewportSize(),
        // What the web build applies (0 in a browser) and what an iPhone 17 Pro applies natively; the frame must not cover content inside these.
        safeArea: { appliedOnWeb: measured, iphone17ProNominal: { top: 62, bottom: 34 } },
        scrolls: extra > 8,
        text,
        lines,
      };
      fs.writeFileSync(path.join(dir, `${meta.id}.json`), JSON.stringify(json, null, 2) + '\n');
    });
  },
});

export { expect };
