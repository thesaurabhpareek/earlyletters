/**
 * e2e/bin/lint-flows.mjs: the Maestro flow lint (G2 gate) and its `--app`
 * report (G-29), which lists the testIDs the flows use that the app does not
 * set yet. The report never fails the lint; this test pins that, and that it
 * recognises ids set in the app's source (through the primitives' `testID`
 * props and the plain string ids screens use), so a screen that adds an id
 * drops off the list.
 */
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP = join(__dirname, '..');
const run = (...args: string[]) => spawnSync(process.execPath, [join(APP, 'e2e', 'bin', 'lint-flows.mjs'), ...args], { cwd: APP, encoding: 'utf8' });

describe('[G-29] lint-flows --app', () => {
  it('reports the ids flows use that the app lacks, and never fails the lint for it', () => {
    const r = run('--app');
    expect(r.status, r.stderr).toBe(0);
    const m = r.stdout.match(/^app check: (\d+) ids used by flows; (\d+) not found in apps\/mobile\/src:$/m);
    expect(m, r.stdout).not.toBeNull();
    const [used, missing] = [Number(m![1]), Number(m![2])];
    const listed = r.stdout.split('\n').filter((l) => /^ {2}\S/.test(l)).map((l) => l.trim());
    expect(listed.length).toBe(missing);
    expect(missing).toBeLessThanOrEqual(used);
    expect(new Set(listed).size).toBe(listed.length);
    expect(listed).toEqual([...listed].sort());
  });

  it('finds ids the app sets today, so they are not reported', () => {
    const r = run('--app');
    const listed = new Set(r.stdout.split('\n').filter((l) => /^ {2}\S/.test(l)).map((l) => l.trim()));
    // Ids both used by a flow and set in apps/mobile/src today (Review, the letter screen, the book switcher, Storage).
    for (const id of ['review.firstNote', 'review.keepVoice', 'review.save.book', 'letter.undo', 'switcher.close', 'storage.pack.text']) {
      expect(listed.has(id), id).toBe(false);
    }
  });

  it('without --app prints no report and still lints the flows', () => {
    const r = run();
    expect(r.stdout).not.toMatch(/app check:/);
    expect(r.status, r.stderr).toBe(0);
  });
});
