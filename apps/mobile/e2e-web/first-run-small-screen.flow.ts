import { CHILD, SIGNS_AS, btn, nameField, passAgeGate, startOnboarding, toChildStep } from './support/app';
import { expect, test } from './support/journey';

/**
 * First run on an iPhone SE (375 x 667), the phone where "The book is open." pushed its one primary button below the
 * fold, and the face the child's name is typed in (P2 critics' pass, 28 Oct 2026: S3 and S4). A stand-in for a phone:
 * the web has no keyboard (so the cover's 480 pt rule cannot run here) and no Dynamic Type, which are D1 and D5 on the
 * run sheet. No journey steps are recorded (docs/release/journey is P7's record), so this flow writes nothing.
 */
test.use({ viewport: { width: 375, height: 667 }, contextOptions: { screen: { width: 375, height: 667 } } });

test('[P2-S3] the name is typed in the book\'s title face; [P2-S4] "Write the first one" is whole on an iPhone SE', async ({ app }) => {
  await passAgeGate(app);
  await startOnboarding(app);
  await toChildStep(app);

  // S3: the letter face (Literata, 22 pt), not the app's Mukta. The label above it stays in the app's face.
  const field = nameField(app);
  await expect(field).toHaveCSS('font-family', /Literata/);
  await expect(field).toHaveCSS('font-size', '22px');
  await field.fill(CHILD);
  await expect(field).toHaveCSS('font-family', /Literata/);
  await expect(app.getByText('Name', { exact: true })).not.toHaveCSS('font-family', /Literata/);

  await btn(app, 'Born today').click();
  await btn(app, 'Continue').click();
  await app.getByText(SIGNS_AS, { exact: true }).click();
  await btn(app, 'Sign my letters').click();
  await expect(app.getByText('The book is open.')).toBeVisible();

  // S4: the one primary is on the screen, whole, without scrolling (it sat at 637 to 693 of 667 before).
  const write = btn(app, /Write the first one/);
  await expect(write).toHaveCount(1);
  await expect(write).toBeInViewport({ ratio: 1 });
  const box = await write.boundingBox();
  expect(box!.y + box!.height).toBeLessThanOrEqual(667);
  // It stays there when the content above it scrolls: the speech card's own buttons are not the screen's primary.
  await app.mouse.wheel(0, 400);
  await expect(write).toBeInViewport({ ratio: 1 });
  expect((await write.boundingBox())!.y).toBe(box!.y);
});
