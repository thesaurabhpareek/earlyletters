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

export type Recorder = (meta: StepMeta) => Promise<void>;

export const test = base.extend<{ record: Recorder; app: Page }>({
  // Every test opens the app fresh: a clean browser profile means a clean on-device database.
  app: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/');
    await use(page);
    expect(errors, 'uncaught page errors').toEqual([]);
  },
  record: async ({ page }, use) => {
    await use(async (meta) => {
      const dir = path.join(OUT, 'steps');
      fs.mkdirSync(dir, { recursive: true });
      await page.waitForTimeout(500); // let the entering animation settle
      const text = (await page.locator('body').innerText()).replace(/\s+/g, ' ').trim().slice(0, 400);
      const shot = SHOTS ? `screens/${meta.id}.png` : undefined;
      if (shot) {
        fs.mkdirSync(path.join(OUT, 'screens'), { recursive: true });
        await page.screenshot({ path: path.join(OUT, shot) });
      }
      fs.writeFileSync(path.join(dir, `${meta.id}.json`), JSON.stringify({ ...meta, shot, route: new URL(page.url()).pathname, text }, null, 2) + '\n');
    });
  },
});

export { expect };
