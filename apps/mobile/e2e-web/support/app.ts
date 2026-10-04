/** Shared moves for the journey flows. Only fictional family data ("Asha"); everything goes through the real screens. */
import type { Page } from '@playwright/test';
import { expect, type Recorder } from './journey';

export const CHILD = 'Asha';
export const SIGNS_AS = 'Mama';

export const btn = (page: Page, name: string | RegExp) => page.getByRole('button', { name });

/** Age gate: Yes, Continue. */
export async function passAgeGate(page: Page) {
  await page.getByRole('radio', { name: 'Yes' }).click();
  await btn(page, 'Continue').click();
  await expect(page.getByText('Begin the book')).toBeVisible();
}

export async function startOnboarding(page: Page) {
  await btn(page, 'Begin the book').click();
  await expect(btn(page, 'That sounds right')).toBeVisible();
}

export async function toChildStep(page: Page) {
  await btn(page, 'That sounds right').click();
  await expect(page.getByText('Who is this book for?')).toBeVisible();
}

/** Whole first run, ending on Tonight. */
export async function firstRun(page: Page, name = CHILD) {
  await passAgeGate(page);
  await startOnboarding(page);
  await toChildStep(page);
  await page.getByRole('textbox').first().fill(name);
  await btn(page, 'Continue').click();
  await page.getByText(SIGNS_AS, { exact: true }).click();
  await btn(page, 'Sign my letters').click();
  await btn(page, /Write the first one/).click();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
}

/**
 * Numbered step recorder for one journey: `step('happy', title, note)` records J05-07 and so on, "from" defaulting to the
 * previous step. Pass `from` to branch. `start` keeps ids stable when a journey is split over several tests.
 */
export function journey(record: Recorder, code: string, name: string, start = 1, first?: string) {
  let n = start - 1;
  let last = first;
  return async (kind: 'happy' | 'unhappy', title: string, note: string, from?: string, opts?: { settle?: number }): Promise<string> => {
    n += 1;
    const id = `${code}-${String(n).padStart(2, '0')}`;
    await record({ id, journey: name, kind, title, note, from: from ?? last }, opts);
    last = id;
    return id;
  };
}

export const tab = (page: Page, name: 'Tonight' | 'Book' | 'Family') => page.getByRole('tab', { name }).or(page.getByText(name, { exact: true }).last());

/** Type a letter on the Write screen and save it from Review (the honest path to a letter on the web, which has no speech model). */
export async function typeLetter(page: Page, text: string, to: 'book' | 'private' = 'book') {
  await btn(page, /^Type/).click();
  await page.getByRole('textbox').first().fill(text);
  await btn(page, 'Save').click();
  await expect(page.getByText('Add to ')).toBeVisible();
  await btn(page, to === 'book' ? /^Add to .*book/ : 'Keep private').click();
}

/**
 * Every visible button, link, radio and checkbox is at least `min` pt tall (HIG 44). Controls whose touch area is
 * widened with hitSlop (the tidy-up marks in Review) are listed in `except` by accessible name: hitSlop does not
 * grow the box on web, so the web run cannot see it; the device pass covers those (Accessibility Inspector).
 */
export async function expectMinTargets(page: Page, min = 44, except: RegExp[] = []) {
  const small = await page.locator('[role=button],[role=link],[role=radio],[role=checkbox]').evaluateAll((els, m) => {
    return els
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && r.height < m - 0.5;
      })
      .map((e) => `${e.getAttribute('aria-label') ?? e.textContent?.trim() ?? '?'} (${Math.round(e.getBoundingClientRect().height)})`);
  }, min);
  expect(small.filter((n) => !except.some((re) => re.test(n))), `controls under ${min} pt`).toEqual([]);
}

/** WCAG contrast of two CSS colours, e.g. 'rgb(43, 39, 34)'. */
export function contrastRatio(a: string, b: string): number {
  const lum = (css: string) => {
    const [r, g, b2] = (css.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map((v) => Number(v) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The glyph colour of an icon control (the first painted fill or stroke inside it) and the first opaque background behind it. */
export async function glyphColours(locator: ReturnType<Page['locator']>): Promise<{ glyph: string; behind: string }> {
  return locator.first().evaluate((el) => {
    const paint = (n: Element) => {
      const cs = getComputedStyle(n);
      for (const v of [cs.fill, cs.stroke, cs.color]) if (v && v !== 'none' && !/rgba\(.*, 0\)$/.test(v)) return v;
      return '';
    };
    const nodes = [el, ...Array.from(el.querySelectorAll('*'))];
    const glyph = nodes.map(paint).find((v) => v && /^rgb/.test(v)) ?? 'rgb(0, 0, 0)';
    let behind = 'rgb(255, 255, 255)';
    for (let n: Element | null = el; n; n = n.parentElement) {
      const bg = getComputedStyle(n).backgroundColor;
      if (bg && !/rgba\(.*, 0\)$/.test(bg) && bg !== 'transparent') {
        behind = bg;
        break;
      }
    }
    return { glyph, behind };
  });
}
