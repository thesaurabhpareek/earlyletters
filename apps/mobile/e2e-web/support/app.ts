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
