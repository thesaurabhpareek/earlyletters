/**
 * The journey index generator (apps/mobile/e2e-web/support/build-index.mjs; EXPERIENCE_PASS_2026-10 package P7, item P7-2).
 * It must never write docs/release/journey/INDEX.md from steps that have no screenshot: on 13 Oct 2026 a run made without
 * JOURNEY_SHOTS=1 was committed and an index built from it dropped 144 Screen links. Each test runs the script as a
 * process against a scratch folder (`--dir`), with fictional step files, so the real record is never read or written.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const SCRIPT = join(__dirname, '..', 'e2e-web', 'support', 'build-index.mjs');
// Spawning Node takes well under a second on a quiet machine; a loaded runner can take several times that.
const SPAWN_TIMEOUT_MS = 30_000;

let dir: string;
beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'journey-index-'));
  mkdirSync(join(dir, 'steps'));
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

type Step = { id: string; journey: string; shot?: string; full?: string; title?: string; note?: string; kind?: 'happy' | 'unhappy'; from?: string };
function writeStep(s: Step) {
  const json = { kind: 'happy', title: `Title ${s.id}`, note: `Note ${s.id}`, route: '/', text: '', lines: [], ...s };
  writeFileSync(join(dir, 'steps', `${s.id}.json`), JSON.stringify(json, null, 2) + '\n');
}
/** A step as the recorder writes it with JOURNEY_SHOTS=1. */
const withShot = (id: string, journey: string, extra: Partial<Step> = {}): Step => ({ id, journey, shot: `screens/${id}.png`, ...extra });
/** A step as the recorder writes it without JOURNEY_SHOTS=1 (`shot` is undefined, so JSON.stringify drops it). */
const noShot = (id: string, journey: string): Step => ({ id, journey });

function run(...args: string[]) {
  return spawnSync(process.execPath, [SCRIPT, '--dir', dir, ...args], { encoding: 'utf8' });
}
const index = () => readFileSync(join(dir, 'INDEX.md'), 'utf8');

describe('[P7-2] the no-screenshot guard', () => {
  it('refuses to write when every step has no shot, names the steps, and exits 1', () => {
    writeStep(noShot('J01-01', 'first-run'));
    writeStep(noShot('J01-02', 'first-run'));
    const r = run();
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/refusing to write INDEX\.md/);
    expect(r.stderr).toMatch(/2 of 2 steps have no `shot`/);
    expect(r.stderr).toContain('J01-01 J01-02');
    expect(r.stderr).toMatch(/JOURNEY_SHOTS=1/);
    expect(r.stderr).toMatch(/README\.md/);
    expect(r.stdout).toBe('');
    expect(existsSync(join(dir, 'INDEX.md'))).toBe(false);
  }, SPAWN_TIMEOUT_MS);

  it('refuses when only some steps lack a shot (develop on 28 Oct had 2 of 146 with one), and names only those', () => {
    writeStep(withShot('J06-10', 'review-and-edits'));
    writeStep(noShot('J06-11', 'review-and-edits'));
    writeStep(noShot('J07-01', 'typed-letter'));
    const r = run();
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/2 of 3 steps have no `shot`/);
    expect(r.stderr).toContain('J06-11 J07-01');
    expect(r.stderr).not.toContain('J06-10');
    expect(existsSync(join(dir, 'INDEX.md'))).toBe(false);
  }, SPAWN_TIMEOUT_MS);

  it('leaves an INDEX.md that is already there exactly as it was', () => {
    const before = '# the index a person committed\n\n| J01-01 | [png](screens/J01-01.png) |\n';
    writeFileSync(join(dir, 'INDEX.md'), before);
    writeStep(noShot('J01-01', 'first-run'));
    expect(run().status).toBe(1);
    expect(index()).toBe(before);
  }, SPAWN_TIMEOUT_MS);

  it('names at most 20 steps and counts the rest', () => {
    for (let n = 1; n <= 25; n++) writeStep(noShot(`J05-${String(n).padStart(2, '0')}`, 'voice-capture'));
    const r = run();
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/25 of 25 steps have no `shot`/);
    expect(r.stderr).toContain('J05-20');
    expect(r.stderr).not.toContain('J05-21');
    expect(r.stderr).toMatch(/and 5 more/);
  }, SPAWN_TIMEOUT_MS);

  it('refuses when there are no steps at all, or no steps folder', () => {
    const empty = run();
    expect(empty.status).toBe(1);
    expect(empty.stderr).toMatch(/no step files/);
    expect(existsSync(join(dir, 'INDEX.md'))).toBe(false);
    rmSync(join(dir, 'steps'), { recursive: true });
    const missing = run();
    expect(missing.status).toBe(1);
    expect(missing.stderr).toMatch(/no steps folder/);
  }, SPAWN_TIMEOUT_MS);

  it('writes the index, with every Screen link, when every step has a shot', () => {
    writeStep(withShot('J01-01', 'first-run'));
    writeStep(withShot('J01-02', 'first-run', { full: 'screens/J01-02-full.png' }));
    const r = run();
    expect(r.status, r.stderr).toBe(0);
    expect(r.stderr).toBe('');
    expect(r.stdout).toMatch(/^INDEX\.md: 1 journeys, 2 steps, 2 screenshots, 1 full$/m);
    const md = index();
    expect(md).toContain('[png](screens/J01-01.png) |');
    expect(md).toContain('[png](screens/J01-02.png) [full](screens/J01-02-full.png) |');
    expect(md).not.toMatch(/TEXT ONLY/);
  }, SPAWN_TIMEOUT_MS);

  it('--text-only writes anyway, under a banner that says not to commit it, and says so on stderr', () => {
    writeStep(withShot('J01-01', 'first-run'));
    writeStep(noShot('J01-02', 'first-run'));
    const r = run('--text-only');
    expect(r.status, r.stderr).toBe(0);
    expect(r.stderr).toMatch(/--text-only: 1 of 2 steps have no screenshot\. Do not commit/);
    const md = index();
    expect(md.startsWith('> **TEXT ONLY. Do not commit this file.**')).toBe(true);
    expect(md).toContain('[png](screens/J01-01.png) |');
    expect(md).toMatch(/\| J01-02 \| happy \| \*\*Title J01-02\.\*\* Note J01-02 \| {2}\| {2}\|/);
  }, SPAWN_TIMEOUT_MS);

  it('--text-only still refuses when there are no steps', () => {
    expect(run('--text-only').status).toBe(1);
    expect(existsSync(join(dir, 'INDEX.md'))).toBe(false);
  }, SPAWN_TIMEOUT_MS);

  it('an unknown argument is an error, and nothing is written', () => {
    writeStep(withShot('J01-01', 'first-run'));
    const r = run('--force');
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/unknown argument "--force"/);
    expect(existsSync(join(dir, 'INDEX.md'))).toBe(false);
  }, SPAWN_TIMEOUT_MS);
});

describe('[P7-2] headings and header come from the current data', () => {
  it('titles the two server-on journeys, J21 and J22, with the code read from the step ids', () => {
    writeStep(withShot('J21-01', 'co-parent-sharing'));
    writeStep(withShot('J22-01', 'sign-in'));
    const r = run();
    expect(r.status, r.stderr).toBe(0);
    expect(r.stderr).toBe('');
    const md = index();
    expect(md).toMatch(/^## J21 Two parents: invite, join, and the Family tab \(server features on\)$/m);
    expect(md).toMatch(/^## J22 Sign in and Account \(server features on\)$/m);
    expect(md).not.toMatch(/^## (co-parent-sharing|sign-in)$/m);
  }, SPAWN_TIMEOUT_MS);

  it('takes the code from the steps, so a journey that moves to another number keeps a true heading', () => {
    writeStep(withShot('J23-01', 'dark-mode'));
    expect(run().status).toBe(0);
    expect(index()).toMatch(/^## J23 Dark mode$/m);
  }, SPAWN_TIMEOUT_MS);

  it("takes the code most of the steps carry: smoke's J00-open sits in 'first-run' beside J01", () => {
    writeStep(withShot('J00-open', 'first-run'));
    writeStep(withShot('J01-01', 'first-run'));
    writeStep(withShot('J01-02', 'first-run'));
    expect(run().status).toBe(0);
    const md = index();
    expect(md).toMatch(/^## J01 First run: age question, promise, child, signature, first letter$/m);
    expect(md).not.toMatch(/^## J00 /m);
  }, SPAWN_TIMEOUT_MS);

  it('gives a journey with no title a heading with its code, and a warning, rather than a bare key', () => {
    writeStep(withShot('J99-01', 'a-new-journey'));
    const r = run();
    expect(r.status, r.stderr).toBe(0);
    expect(r.stderr).toMatch(/warning: no title for journey "J99 a-new-journey"/);
    expect(index()).toMatch(/^## J99 a-new-journey$/m);
  }, SPAWN_TIMEOUT_MS);

  it('lists the journeys in step order, not the order of the files', () => {
    writeStep(withShot('J22-01', 'sign-in'));
    writeStep(withShot('J02-01', 'under-18'));
    writeStep(withShot('J01-01', 'first-run'));
    expect(run().status).toBe(0);
    const heads = [...index().matchAll(/^## (J\d+) /gm)].map((m) => m[1]);
    expect(heads).toEqual(['J01', 'J02', 'J22']);
  }, SPAWN_TIMEOUT_MS);

  it('names the three builds and no longer says accounts and sign-in are off by design', () => {
    writeStep(withShot('J01-01', 'first-run'));
    expect(run().status).toBe(0);
    const md = index();
    expect(md).toMatch(/exported for web in three builds/);
    expect(md).toMatch(/\*\*Server features off\*\*, a clean phone/);
    expect(md).toMatch(/\*\*Server features off, seeded\*\*/);
    expect(md).toMatch(/\*\*Server features on, against a mock server\*\*/);
    expect(md).not.toMatch(/off by design/);
    expect(md).not.toMatch(/Accounts, sign-in, sync, invites, delete account/);
    // The header points at the safe procedure instead of a bare "run these two commands".
    expect(md).toMatch(/only the journey-record pull request commits `steps\/` and this index/);
  }, SPAWN_TIMEOUT_MS);
});
