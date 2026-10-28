import type { Page } from '@playwright/test';
import { journey } from './support/app';
import { allowConsoleError, allowPageError, expect, seeded, test } from './support/journey';

/**
 * S50, S51: the title renders in Literata and the body and buttons in Mukta, never Times, Georgia or Helvetica. Both the
 * family each text asks for and the face the page has really loaded, so a missing @font-face cannot pass as Times.
 */
async function expectBrandFaces(app: Page, title: string, body: string, button: string) {
  const loaded = (family: string) =>
    app.evaluate(async (f) => {
      await document.fonts.ready;
      return [...document.fonts].some((ff) => ff.family.replace(/["']/g, '') === f && ff.status === 'loaded');
    }, family);
  for (const f of ['Literata-Medium', 'Mukta-Regular', 'Mukta-Medium']) await expect.poll(() => loaded(f), { message: `${f} loaded` }).toBe(true);
  const face = (loc: ReturnType<Page['getByText']>) => loc.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(await face(app.getByRole('heading', { name: title }))).toMatch(/^"?Literata-Medium/);
  expect(await face(app.getByText(body, { exact: true }))).toMatch(/^"?Mukta-Regular/);
  expect(await face(app.getByRole('button', { name: button }).getByText(button, { exact: true }))).toMatch(/^"?Mukta-Medium/);
  for (const t of [title, body]) expect(await face(app.getByText(t, { exact: true }))).not.toMatch(/Times|Georgia|Helvetica/);
}

// Fault injection: to see what a person would see if a screen threw, the page makes Intl.PluralRules throw (Review
// pluralises its count of small fixes). This is the closest honest state to a crash and is labelled so in the step note;
// it is not a path a person can take.
test('[J20] a screen throws while rendering (fault injected)', async ({ app, record }) => {
  const step = journey(record, 'J20', 'crash', 1, 'J19-01');
  allowConsoleError(app, /./);
  allowPageError(app, /injected fault/);
  await seeded(app);
  await app.evaluate(() => {
    const w = window as unknown as { __RealPluralRules?: unknown };
    const Real = Intl.PluralRules;
    w.__RealPluralRules = Real;
    (Intl as unknown as { PluralRules: unknown }).PluralRules = function () {
      throw new Error('injected fault');
    };
  });
  await app.getByText('Read it back').first().click();

  // The root error boundary: calm words, two ways forward, nothing technical (S50).
  await expect(app.getByRole('heading', { name: 'This page did not open' })).toBeVisible();
  await expect(app.getByText('Your letters and recordings are safe on this phone.')).toBeVisible();
  await expect(app.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(app.getByRole('button', { name: 'Go to Tonight' })).toBeVisible();
  await expect(app.getByText(/injected fault|stack|at Object|Error:/i)).toHaveCount(0);
  const bg = await app.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(bg).toBe('rgb(251, 248, 243)'); // the page colour (token bg), never white
  await expectBrandFaces(app, 'This page did not open', 'Your letters and recordings are safe on this phone.', 'Try again');
  await step('unhappy', 'A screen crashes (fault injected)', 'The root error boundary shows a calm screen instead of a blank page: a still page drawing, "This page did not open" in Literata and "Your letters and recordings are safe on this phone." in Mukta, with Try again and Go to Tonight as pill buttons. No error text, code or stack is shown or logged. Reached only by injecting a fault (Intl.PluralRules made to throw before opening Review); no normal action gets here.');

  // 20 pt gutters on both sides, the buttons full width at the bottom, as the 404 (S49) and every state.
  const tryBox = await app.getByRole('button', { name: 'Try again' }).boundingBox();
  const width = app.viewportSize()!.width;
  expect(Math.round(tryBox!.x)).toBe(20);
  expect(Math.round(width - (tryBox!.x + tryBox!.width))).toBe(20);

  // Go to Tonight works even though the screen that threw is still broken.
  await app.getByRole('button', { name: 'Go to Tonight' }).click();
  await expect(app.getByRole('button', { name: 'Speak' })).toBeVisible();

  // Try again does something: with the fault gone, the app draws again instead of the crash screen, so a Try again
  // that did nothing fails here. (On the web the remount comes back to Tonight, under which Review had opened.)
  await app.getByText('Read it back').first().click();
  await expect(app.getByRole('heading', { name: 'This page did not open' })).toBeVisible();
  await app.evaluate(() => {
    const w = window as unknown as { __RealPluralRules?: unknown };
    (Intl as unknown as { PluralRules: unknown }).PluralRules = w.__RealPluralRules;
  });
  await app.getByRole('button', { name: 'Try again' }).click();
  await expect(app.getByRole('heading', { name: 'This page did not open' })).toHaveCount(0);
  await expect(app.getByRole('heading', { name: 'Read it back' }).or(app.getByRole('button', { name: 'Speak' })).first()).toBeVisible();
});

test('[J20] the book cannot be opened at launch (fault injected)', async ({ app, record }) => {
  const step = journey(record, 'J20', 'crash', 2, 'J20-01');
  allowConsoleError(app, /./);
  const base = process.env.E2E_WEB_SEED_URL;
  // Preview-only switch (src/lib/resilience/launch-fault.web.ts): the first open of the database fails, Try again works.
  await app.goto(`${base}/?seed=asha&fault=launch-once`);
  await expect(app.getByRole('heading', { name: 'The book could not open' })).toBeVisible();
  await expect(app.getByText('Your letters and recordings are safe on this phone.')).toBeVisible();
  await expect(app.getByText('Try again, or restart the phone.')).toBeVisible();
  await expect(app.getByRole('button', { name: 'Try again' })).toBeVisible();
  await expect(app.getByRole('button', { name: "Export what's readable" })).toBeVisible();
  // Nothing on this screen deletes, resets or rebuilds anything (D-085): exactly two buttons.
  await expect(app.getByRole('button', { name: /delete|reset|erase|start over|remove|rebuild/i })).toHaveCount(0);
  await expect(app.getByRole('button')).toHaveCount(2);
  await expectBrandFaces(app, 'The book could not open', 'Your letters and recordings are safe on this phone.', 'Try again');
  await step('unhappy', 'The book cannot be opened (fault injected)', 'If opening the database or updating it throws, a recovery screen replaces the app, in the same plain block as the crash screen: "The book could not open", the letters are safe on this phone, "Try again, or restart the phone.", and two actions: Try again and Export what\'s readable. No delete, reset or rebuild exists here. Reached only by a preview-only switch (?fault=launch-once); on a phone it follows a failed database open or update.');

  // At a short height (as at large text sizes) the export's result is still seen: the screen scrolls to it, above the
  // buttons that stay put (lens A on #355). The web has no files to export, so the result is one of the two notes.
  await app.setViewportSize({ width: 402, height: 360 });
  await app.getByRole('button', { name: "Export what's readable" }).click();
  const note = app.getByText(/^(This phone has no recordings or files to export\.|That export did not work\. Your files are still on this phone\.)$/);
  await expect(note).toBeVisible();
  await expect
    .poll(async () => {
      const n = await note.boundingBox();
      const b = await app.getByRole('button', { name: 'Try again' }).boundingBox();
      return !!n && !!b && n.y >= 0 && n.y + n.height <= b.y;
    })
    .toBe(true);
  await app.setViewportSize({ width: 402, height: 874 });

  await app.getByRole('button', { name: 'Try again' }).click();
  await expect(app.getByRole('button', { name: 'Speak' }).or(app.getByText('Begin the book')).first()).toBeVisible();
});
