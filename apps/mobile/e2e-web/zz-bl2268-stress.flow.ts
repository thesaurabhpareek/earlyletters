// TEMPORARY (BL-2268 proof, removed before merge): the first-letter reminder card under CPU load.
// Spawns busy-loop processes (2 per core in each of the 2 workers) for the length of this file, then runs the store-build first letter
// 20 times with the new helper and 10 times with the old single 8 s wait, so the run shows both.
import { spawn, type ChildProcess } from 'node:child_process';
import os from 'node:os';
import { en } from '@scribe/content';
import { firstRun, noRemindersAfterFirstLetter, typeLetter } from './support/app';
import { expect, onStore, test } from './support/journey';

const burners: ChildProcess[] = [];
test.beforeAll(() => {
  const n = os.cpus().length * 2;
  for (let i = 0; i < n; i++) burners.push(spawn(process.execPath, ['-e', 'for(;;){}'], { stdio: 'ignore' }));
  console.log(`[BL-2268] ${n} burners on ${os.cpus().length} cores`);
});
test.afterAll(() => {
  for (const b of burners) b.kill('SIGKILL');
  console.log(`[BL-2268] load average ${os.loadavg().map((x) => x.toFixed(1)).join(' ')}`);
});

for (let i = 1; i <= 20; i++) {
  test(`[BL-2268] new wait, repeat ${i}`, async ({ app }) => {
    await onStore(app);
    await firstRun(app);
    const t0 = Date.now();
    await typeLetter(app, 'You held the spoon by yourself today.');
    await noRemindersAfterFirstLetter(app);
    console.log(`[BL-2268] new ${i}: card answered ${Date.now() - t0} ms after Keep; load ${os.loadavg()[0].toFixed(1)}`);
  });
}

for (let i = 1; i <= 10; i++) {
  test(`[BL-2268] old wait, repeat ${i}`, async ({ app }) => {
    await onStore(app);
    await firstRun(app);
    const t0 = Date.now();
    await typeLetter(app, 'You held the spoon by yourself today.');
    const card = app.getByRole('heading', { name: en.onboarding.reminder.title, exact: true });
    let shown = true;
    try {
      await expect(card).toBeVisible({ timeout: 8000 });
    } catch {
      shown = false;
    }
    if (!shown) await expect(card).toBeVisible({ timeout: 30_000 }); // still a card, only late
    console.log(`[BL-2268] old ${i}: ${shown ? 'within' : 'missed'} 8 s, card at ${Date.now() - t0} ms; load ${os.loadavg()[0].toFixed(1)}`);
  });
}
