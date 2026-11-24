/**
 * e2e/bin/lint-flows.mjs: the Maestro flow lint (G2 gate) and its `--app`
 * report (G-29), which lists the testIDs the flows use that the app does not
 * set yet. The report never fails the lint; this test pins that, and that it
 * recognises ids set in the app's source (through the primitives' `testID`
 * props and the plain string ids screens use), so a screen that adds an id
 * drops off the list.
 */
import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
    for (const id of ['review.firstNote', 'review.keepVoice', 'review.save.book', 'review.saved', 'write.keep.book']) {
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
    // src is a directory of links to the real entries, so a test can add a fixture source file beside them.
    mkdirSync(join(root, 'src'));
    for (const e of readdirSync(join(APP, 'src'))) symlinkSync(join(APP, 'src', e), join(root, 'src', e));
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

  const e2eFlow = (root: string, prefix: string) => join(root, 'e2e', 'flows', readdirSync(join(root, 'e2e', 'flows')).find((f) => f.startsWith(prefix))!);
  const requestIds = (root: string, ...ids: string[]) => {
    const req = join(root, 'e2e', 'TESTID_REQUESTS.md');
    writeFileSync(req, readFileSync(req, 'utf8') + '\n' + ids.map((i) => '`' + i + '`').join('\n') + '\n');
  };

  // Review of #1797: a quoted string with a screen prefix (a setting key) is not a testID declaration.
  it('fails when a flow taps an id that is only a quoted string in the source (a setting key), not a testID', () => {
    const root = copy();
    mkdirSync(join(root, 'src', 'zz-fixture'));
    writeFileSync(join(root, 'src', 'zz-fixture', 'key.ts'), "export const KEY = 'review.firstNoteSeen';\n");
    requestIds(root, 'review.firstNoteSeen');
    const flow = e2eFlow(root, 'E2E-04');
    writeFileSync(flow, readFileSync(flow, 'utf8').replace(/id: "review\.firstNote"/, 'id: "review.firstNoteSeen"'));
    const r = lint(root);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/taps id "review\.firstNoteSeen" that no file in apps\/mobile\/src sets/);
  });

  it('accepts an id declared as testID="..." and testID={\'...\'} in a source file', () => {
    const root = copy();
    mkdirSync(join(root, 'src', 'zz-fixture'));
    writeFileSync(join(root, 'src', 'zz-fixture', 'ids.tsx'), "export const A = () => <><View testID=\"review.fixtureA\" /><View testID={'review.fixtureB'} /></>;\n");
    requestIds(root, 'review.fixtureA', 'review.fixtureB');
    const flow = e2eFlow(root, 'E2E-04');
    writeFileSync(flow, readFileSync(flow, 'utf8').replace(/id: "review\.firstNote"/, 'id: "review.fixtureA"').replace(/id: "review\.saved"/, 'id: "review.fixtureB"'));
    const list = join(root, 'e2e', 'not-in-app.txt');
    expect(lint(root).stderr).not.toMatch(/review\.fixture/);
    expect(readFileSync(list, 'utf8')).not.toMatch(/fixture/);
  });

  it('fails when a regex id matches no id the app sets', () => {
    const root = copy();
    requestIds(root, 'write.save');
    const flow = e2eFlow(root, 'E2E-04');
    writeFileSync(flow, readFileSync(flow, 'utf8').replace(/id: "write\.keep\.book"/, 'id: "write.sav(e|x)"'));
    const r = lint(root);
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/taps id "write\.sav\(e\|x\)" that no file in apps\/mobile\/src sets/);
  });

  it('passes a regex id that matches an id the app sets', () => {
    const root = copy();
    const flow = e2eFlow(root, 'E2E-04');
    writeFileSync(flow, readFileSync(flow, 'utf8').replace(/id: "write\.keep\.book"/, 'id: "write.keep.(book|private)"'));
    const r = lint(root);
    expect(r.stderr).not.toMatch(/write\.keep/);
  });

  it('fails a flow that taps a not-in-app id without a "# BLOCKED" header, and a header with nothing blocked', () => {
    const root = copy();
    const flow = e2eFlow(root, 'E2E-04');
    writeFileSync(flow, readFileSync(flow, 'utf8').replace(/^# BLOCKED.*\n/m, ''));
    expect(lint(root).stderr).toMatch(/E2E-04.*no "# BLOCKED" header line/);
    const root2 = copy();
    writeFileSync(join(root2, 'e2e', 'not-in-app.txt'), '# empty\n');
    const r = lint(root2);
    expect(r.stderr).toMatch(/has a "# BLOCKED" header but every id it taps is in the app now/);
  });
});

// Review of #1797: after "Add to the book" the app shows the saved moment, never review.save.book.
describe('[BL-1965] typed-letter flows wait on what the app shows after Keep', () => {
  const text = (f: string) => readFileSync(join(APP, 'e2e', 'flows', f), 'utf8');
  it('E2E-15 never taps review.save.book and waits on review.saved', () => {
    const t = text('E2E-15-voiceover-smoke.yaml');
    expect(t).not.toMatch(/id: "review\.save\.book"/);
    expect(t).toMatch(/id: "review\.saved"/);
  });
  it('E2E-04 taps review.save.book only inside the recovery branch (a draft opened from Tonight)', () => {
    const t = text('E2E-04-type-a-letter.yaml');
    const first = t.indexOf('tonight.waiting"\n    commands');
    expect(first).toBeGreaterThan(0);
    expect(t.slice(0, first)).not.toMatch(/id: "review\.save\.book"/);
    expect(t.slice(0, first)).toMatch(/id: "review\.saved"/);
    expect(t).not.toMatch(/id: "review\.screen"/);
  });
});

// Review of #1797: flows that tap ids the app lacks are skipped by the runners with the reason.
describe('[BL-1965] runners skip blocked flows and print why', () => {
  const made: string[] = [];
  afterEach(() => {
    while (made.length) rmSync(made.pop()!, { recursive: true, force: true });
  });
  const setup = (notInApp?: string) => {
    const root = mkdtempSync(join(tmpdir(), 'runner-'));
    made.push(root);
    cpSync(join(APP, 'e2e'), join(root, 'e2e'), { recursive: true, filter: (s) => !/e2e\/(kill|ci)/.test(s) });
    symlinkSync(join(APP, '..', '..', 'node_modules'), join(root, 'node_modules'));
    if (notInApp !== undefined) writeFileSync(join(root, 'e2e', 'not-in-app.txt'), notInApp);
    mkdirSync(join(root, 'bin'));
    const log = join(root, 'maestro.log');
    writeFileSync(join(root, 'bin', 'maestro'), `#!/bin/sh\necho "$@" >> "${log}"\nexit 0\n`);
    chmodSync(join(root, 'bin', 'maestro'), 0o755);
    return { root, log };
  };
  const sh = (root: string, script: string, args: string[]) =>
    spawnSync('bash', [join(root, 'e2e', 'bin', script), ...args], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${join(root, 'bin')}:${process.env.PATH}`, OUT: join(root, 'out'), HOME: root, MAESTRO_E2E_SUPABASE_URL: '' },
    });

  it('run-suite.sh skips a flow whose ids are on not-in-app.txt, prints them, and does not start maestro for it', () => {
    const { root, log } = setup();
    const r = sh(root, 'run-suite.sh', ['--only', 'E2E-04']);
    expect(r.status, r.stderr + r.stdout).toBe(0);
    expect(r.stdout).toMatch(/SKIP E2E-04-type-a-letter \(blocked: the app does not set book\.letter, book\.screen.*not-in-app\.txt\)/);
    expect(existsSync(log)).toBe(false);
  });

  it('run-suite.sh runs a flow once nothing it taps is listed', () => {
    const { root, log } = setup('# nothing left\n');
    const r = sh(root, 'run-suite.sh', ['--only', 'E2E-04']);
    expect(r.status, r.stderr + r.stdout).toBe(0);
    expect(r.stdout).toMatch(/PASS E2E-04-type-a-letter/);
    expect(readFileSync(log, 'utf8')).toMatch(/E2E-04-type-a-letter\.yaml/);
  });

  it('run-p0-nightly.sh reports the blocked P0 flows as skipped (exit 3) and never calls maestro', () => {
    const { root, log } = setup();
    const r = sh(root, 'run-p0-nightly.sh', ['--udid-a', 'AAAA']);
    expect(r.status, r.stderr + r.stdout).toBe(3);
    expect(r.stdout).toMatch(/SKIP E2E-01a-age-gate-no \(blocked: the app does not set/);
    expect(r.stdout).toMatch(/SKIP E2E-13 \(blocked:.*E2E-13b-invite-accept \(/);
    expect(existsSync(log)).toBe(false);
  });
});
