/**
 * e2e/bin/lint-flows.mjs: the Maestro flow lint (G2 gate) and its `--app`
 * report (G-29), which lists the testIDs the flows use that the app does not
 * set yet. The report never fails the lint; this test pins that, and that it
 * recognises ids set in the app's source (through the primitives' `testID`
 * props and the plain string ids screens use), so a screen that adds an id
 * drops off the list.
 */
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

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

// BL-1965: E2E-04 and E2E-15 tapped `write.save`, an id the write screen no longer has, and the lint stayed green
// because it only checked TESTID_REQUESTS.md. It now also fails for an id no source sets unless not-in-app.txt lists it.
describe('[BL-1965] lint-flows fails when a flow taps an id no source sets', () => {
  const made: string[] = [];
  afterEach(() => {
    while (made.length) rmSync(made.pop()!, { recursive: true, force: true });
  });
  // A copy of e2e/ next to the real src/, inside apps/mobile so `yaml` still resolves.
  const copy = () => {
    const root = mkdtempSync(join(APP, '.lint-copy-'));
    made.push(root);
    cpSync(join(APP, 'e2e'), join(root, 'e2e'), { recursive: true, filter: (s) => !/e2e\/(kill|ci)/.test(s) });
    symlinkSync(join(APP, 'src'), join(root, 'src'));
    return root;
  };
  const lint = (root: string) => spawnSync(process.execPath, [join(root, 'e2e', 'bin', 'lint-flows.mjs')], { cwd: root, encoding: 'utf8' });

  it('passes on the real flows', () => {
    const r = lint(copy());
    expect(r.status, r.stderr).toBe(0);
  });

  it('fails when a flow taps write.save, even though TESTID_REQUESTS.md names it', () => {
    const root = copy();
    const req = join(root, 'e2e', 'TESTID_REQUESTS.md');
    writeFileSync(req, readFileSync(req, 'utf8') + '\n`write.save`\n');
    const flow = join(root, 'e2e', 'flows', readdirSync(join(root, 'e2e', 'flows')).find((f) => f.startsWith('E2E-04'))!);
    writeFileSync(flow, readFileSync(flow, 'utf8').replace(/write\.keep\.book/, 'write.save'));
    const r = lint(root);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/taps id "write\.save" that no file in apps\/mobile\/src sets/);
  });

  it('fails on a stale line in not-in-app.txt (an id the app sets)', () => {
    const root = copy();
    const list = join(root, 'e2e', 'not-in-app.txt');
    writeFileSync(list, readFileSync(list, 'utf8') + 'write.keep.book\n');
    const r = lint(root);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/not-in-app\.txt lists "write\.keep\.book"/);
  });
});
