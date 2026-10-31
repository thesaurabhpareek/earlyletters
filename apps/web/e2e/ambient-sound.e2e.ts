/**
 * The film's ambient sound (src/film/sound). It is made in the browser by our own code, so what can be checked here
 * is the behaviour, not the taste: the button, what it says, the AudioContext's real state, the remembered choice,
 * reduced motion, a hidden tab, and that scrolling moves the filter. A person has to listen for the rest.
 * Runs against the film build (E2E_FILM_URL); the launch-day page has no sound.
 */
import type { Page } from '@playwright/test';
import { expect, test } from './support/fixtures';
import { filmUrl } from './support/env';

/** Records every AudioContext the page makes, and every target the filter cutoff is glided to. */
async function spyOnAudio(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    const made: AudioContext[] = [];
    const cutoffs: number[] = [];
    w.__ctxs = made;
    w.__cutoffs = cutoffs;
    const Real = window.AudioContext;
    class Spy extends Real {
      constructor(opts?: AudioContextOptions) {
        super(opts);
        made.push(this);
      }
      createBiquadFilter() {
        const f = super.createBiquadFilter();
        const real = f.frequency.setTargetAtTime.bind(f.frequency);
        f.frequency.setTargetAtTime = (v: number, t: number, c: number) => {
          cutoffs.push(v);
          return real(v, t, c);
        };
        return f;
      }
    }
    window.AudioContext = Spy as typeof AudioContext;
  });
}

const contexts = (page: Page) => page.evaluate(() => ((window as unknown as { __ctxs: AudioContext[] }).__ctxs ?? []).map((c) => c.state));
const toggle = (page: Page) => page.locator('[data-ambient-toggle]');

/**
 * A person's first gesture, once the page is ready for one. The button appears after the page has hydrated and read the
 * remembered choice, and the gesture listeners are armed just after; a click before that (a fast runner) would be lost,
 * as it would for a visitor who tapped before the page woke up. Then it is a real click, and the sound is checked.
 */
async function firstGesture(page: Page) {
  await expect(toggle(page)).toBeVisible();
  await expect(toggle(page)).toHaveAttribute('data-state', 'blocked');
  await page.waitForTimeout(250);
  await page.mouse.click(720, 450);
}

test.describe('ambient sound', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('is on in state but honest: asks for a tap, then plays after the first gesture', async ({ page }) => {
    await spyOnAudio(page);
    await page.goto(filmUrl());
    await expect(toggle(page)).toBeVisible();
    await expect(toggle(page)).toHaveText('Tap to start sound');
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
    await expect(toggle(page)).toHaveAttribute('data-state', 'blocked');
    expect(await contexts(page)).toEqual([]); // nothing is made before a gesture

    // Scrolling alone is not a gesture.
    await page.mouse.wheel(0, 400);
    await page.waitForTimeout(400);
    await expect(toggle(page)).toHaveText('Tap to start sound');

    await page.mouse.click(720, 450);
    await expect(toggle(page)).toHaveText('Sound on');
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
    expect(await contexts(page)).toEqual(['running']);
  });

  test('the button is a 44px, labelled, keyboard-reachable toggle that mutes, remembers and releases the context', async ({ page }) => {
    await spyOnAudio(page);
    await page.goto(filmUrl());
    await firstGesture(page);
    await expect(toggle(page)).toHaveText('Sound on');

    const box = await toggle(page).boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.width).toBeGreaterThanOrEqual(44);
    await expect(page.getByRole('button', { name: 'Sound on' })).toHaveAttribute('aria-pressed', 'true');

    // Reach it with the keyboard and press it.
    await toggle(page).focus();
    await expect(toggle(page)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(toggle(page)).toHaveText('Sound off');
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => contexts(page), { timeout: 5000 }).toEqual(['closed']);
    expect(await page.evaluate(() => localStorage.getItem('el-ambient-sound'))).toBe('off');

    // The choice lasts: after a reload and a gesture it is still off and silent.
    await page.reload();
    await expect(toggle(page)).toHaveText('Sound off');
    await page.mouse.click(720, 450);
    await page.waitForTimeout(400);
    await expect(toggle(page)).toHaveText('Sound off');
    expect(await contexts(page)).toEqual([]);

    // Pressing it again turns it on, and that is remembered too.
    await toggle(page).click();
    await expect(toggle(page)).toHaveText('Sound on');
    expect(await contexts(page)).toEqual(['running']);
    expect(await page.evaluate(() => localStorage.getItem('el-ambient-sound'))).toBe('on');
  });

  test('still works when storage is blocked', async ({ page }) => {
    await spyOnAudio(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError');
        },
      });
    });
    await page.goto(filmUrl());
    await firstGesture(page);
    await expect(toggle(page)).toHaveText('Sound on');
    await toggle(page).click();
    await expect(toggle(page)).toHaveText('Sound off');
  });

  test('scrolling opens the filter and the sound settles again when the visitor stops', async ({ page }) => {
    await spyOnAudio(page);
    await page.goto(filmUrl());
    await firstGesture(page);
    await expect(toggle(page)).toHaveText('Sound on');
    await page.waitForTimeout(800);
    const cutoffs = () => page.evaluate(() => (window as unknown as { __cutoffs: number[] }).__cutoffs.slice());
    const rest = Math.max(...(await cutoffs()));
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, 600);
      await page.waitForTimeout(80);
    }
    const busy = Math.max(...(await cutoffs()));
    expect(busy).toBeGreaterThan(rest + 300);
    expect(busy).toBeLessThan(2800); // the rest cutoff is 900 to 1200 Hz and scrolling opens it by at most 1500 Hz
    // Still: the most recent targets come back down.
    await page.waitForTimeout(9000);
    const all = await cutoffs();
    expect(all[all.length - 1]).toBeLessThan(busy - 300);
  });

  test('a hidden tab pauses the sound and coming back wakes it', async ({ page }) => {
    await spyOnAudio(page);
    await page.goto(filmUrl());
    await firstGesture(page);
    await expect(toggle(page)).toHaveText('Sound on');
    const setHidden = (hidden: boolean) =>
      page.evaluate((h) => {
        Object.defineProperty(document, 'hidden', { value: h, configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);
    await setHidden(true);
    await expect.poll(() => contexts(page), { timeout: 5000 }).toEqual(['suspended']);
    await setHidden(false);
    await expect.poll(() => contexts(page), { timeout: 5000 }).toEqual(['running']);
  });

  test('keys that only move around the page (Tab, Space, arrows, Page, Home, End) never start the sound', async ({ page }) => {
    await spyOnAudio(page);
    await page.goto(filmUrl());
    await expect(toggle(page)).toBeVisible();
    await expect(toggle(page)).toHaveAttribute('data-state', 'blocked');
    await page.waitForTimeout(250);
    for (const key of ['Tab', 'Shift+Tab', 'Space', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End']) {
      await page.keyboard.press(key);
      await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);
    expect(await contexts(page)).toEqual([]);
    await expect(toggle(page)).toHaveAttribute('data-state', 'blocked');
    // A real gesture still starts it.
    await page.mouse.click(720, 450);
    await expect(toggle(page)).toHaveText('Sound on');
    expect(await contexts(page)).toEqual(['running']);
  });

  test('the legal pages never make a sound or show the button', async ({ page }) => {
    await spyOnAudio(page);
    for (const path of ['/privacy', '/terms']) {
      await page.goto(new URL(path, filmUrl()).toString());
      await page.mouse.click(300, 300);
      await expect(toggle(page)).toHaveCount(0);
      expect(await contexts(page)).toEqual([]);
    }
  });
});

test.describe('ambient sound, reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('does not start on its own; it waits until the visitor presses the button', async ({ page }) => {
    await spyOnAudio(page);
    await page.addInitScript(() => localStorage.setItem('el-ambient-sound', 'on'));
    await page.goto(filmUrl());
    await expect(toggle(page)).toHaveText('Sound off');
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'false');
    await page.mouse.click(720, 450);
    await page.keyboard.press('a');
    await page.waitForTimeout(500);
    expect(await contexts(page)).toEqual([]);
    await expect(toggle(page)).toHaveText('Sound off');

    await toggle(page).click();
    await expect(toggle(page)).toHaveText('Sound on');
    await expect(toggle(page)).toHaveAttribute('aria-pressed', 'true');
    expect(await contexts(page)).toEqual(['running']);
  });
});
