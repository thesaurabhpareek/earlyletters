/**
 * The journey index generator (apps/mobile/e2e-web/support/build-index.mjs; docs/design/EXPERIENCE_PASS_2026-10.md section 6,
 * package P7). It must never write docs/release/journey/INDEX.md from steps that have no screenshot: on 13 Oct 2026 a run
 * made without JOURNEY_SHOTS=1 was committed, leaving 144 of 146 step files without `shot`, and an index rebuilt from them
 * would drop every Screen link (INDEX.md itself was not rebuilt then). Each test runs the script as a
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

describe('[journey record] the no-screenshot guard', () => {
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

  it('names exactly 20 missing steps without a "more" line, and 21 with one', () => {
    for (let n = 1; n <= 20; n++) writeStep(noShot(`J05-${String(n).padStart(2, '0')}`, 'voice-capture'));
    const twenty = run();
    expect(twenty.stderr).toMatch(/20 of 20 steps have no `shot`/);
    expect(twenty.stderr).toContain('J05-20');
    expect(twenty.stderr).not.toMatch(/and \d+ more/);
    writeStep(noShot('J05-21', 'voice-capture'));
    const twentyOne = run();
    expect(twentyOne.stderr).toMatch(/21 of 21 steps have no `shot`/);
    expect(twentyOne.stderr).not.toContain('J05-21');
    expect(twentyOne.stderr).toMatch(/and 1 more/);
  }, SPAWN_TIMEOUT_MS);

  it('names a step file that is not valid JSON, exits 1, and writes nothing', () => {
    writeStep(withShot('J01-01', 'first-run'));
    writeFileSync(join(dir, 'steps', 'J01-02.json'), '{ "id": "J01-02", "journey": ');
    const r = run();
    expect(r.status).toBe(1);
    expect(r.stderr).toContain(join(dir, 'steps', 'J01-02.json'));
    expect(r.stderr).toMatch(/is not valid JSON/);
    expect(r.stderr).not.toMatch(/SyntaxError/);
    expect(existsSync(join(dir, 'INDEX.md'))).toBe(false);
  }, SPAWN_TIMEOUT_MS);

  it('names a step file with no journey (or no id), exits 1, and writes nothing', () => {
    writeStep(withShot('J01-01', 'first-run'));
    writeFileSync(join(dir, 'steps', 'J01-02.json'), JSON.stringify({ id: 'J01-02', shot: 'screens/J01-02.png' }));
    const noJourney = run();
    expect(noJourney.status).toBe(1);
    expect(noJourney.stderr).toContain(join(dir, 'steps', 'J01-02.json'));
    expect(noJourney.stderr).toMatch(/no `id` or no `journey`/);
    writeFileSync(join(dir, 'steps', 'J01-02.json'), JSON.stringify({ journey: 'first-run', shot: 'screens/J01-02.png' }));
    expect(run().status).toBe(1);
    expect(existsSync(join(dir, 'INDEX.md'))).toBe(false);
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

  it('--text-only writes INDEX.text-only.md under a do-not-commit banner, never INDEX.md, and says so on stderr', () => {
    const before = '# the index a person committed\n';
    writeFileSync(join(dir, 'INDEX.md'), before);
    writeStep(withShot('J01-01', 'first-run'));
    writeStep(noShot('J01-02', 'first-run'));
    const r = run('--text-only');
    expect(r.status, r.stderr).toBe(0);
    expect(r.stderr).toMatch(/--text-only: wrote INDEX\.text-only\.md, not INDEX\.md \(1 of 2 steps have no screenshot\)\. Do not commit it/);
    expect(r.stdout).toMatch(/^INDEX\.text-only\.md: 1 journeys, 2 steps, 1 screenshots, 0 full$/m);
    expect(index()).toBe(before);
    const md = readFileSync(join(dir, 'INDEX.text-only.md'), 'utf8');
    expect(md.startsWith('> **TEXT ONLY. Do not commit this file.**')).toBe(true);
    expect(md).toContain('[png](screens/J01-01.png) |');
    expect(md).toMatch(/\| J01-02 \| happy \| \*\*Title J01-02\.\*\* Note J01-02 \| {2}\| {2}\|/);
  }, SPAWN_TIMEOUT_MS);

  it('INDEX.text-only.md is gitignored, so an `add -A` or `commit -a` cannot take it', () => {
    const ignored = spawnSync('git', ['check-ignore', '-q', 'docs/release/journey/INDEX.text-only.md'], { cwd: join(__dirname, '..', '..', '..') });
    expect(ignored.status).toBe(0);
    const tracked = spawnSync('git', ['check-ignore', '-q', 'docs/release/journey/INDEX.md'], { cwd: join(__dirname, '..', '..', '..') });
    expect(tracked.status).toBe(1);
  }, SPAWN_TIMEOUT_MS);

  it('--text-only still refuses when there are no steps', () => {
    expect(run('--text-only').status).toBe(1);
    expect(existsSync(join(dir, 'INDEX.text-only.md'))).toBe(false);
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

describe('[journey record] headings and header come from the current data', () => {
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

  it('takes the code most steps carry when the odd one out comes last, not the last step or the highest code', () => {
    writeStep(withShot('J05-01', 'voice-capture'));
    writeStep(withShot('J05-02', 'voice-capture'));
    writeStep(withShot('J06-01', 'voice-capture'));
    expect(run().status).toBe(0);
    expect(index()).toMatch(/^## J05 Speaking a letter: /m);
    expect(index()).not.toMatch(/^## J06 /m);
  }, SPAWN_TIMEOUT_MS);

  it('breaks a tie between codes toward the lowest', () => {
    writeStep(withShot('J03-01', 'children-and-books'));
    writeStep(withShot('J04-01', 'children-and-books'));
    expect(run().status).toBe(0);
    expect(index()).toMatch(/^## J03 More than one child/m);
    expect(index()).not.toMatch(/^## J04 /m);
  }, SPAWN_TIMEOUT_MS);

  it('says "small fixes", not the retired word, in the Review heading', () => {
    writeStep(withShot('J06-01', 'review-and-edits'));
    expect(run().status).toBe(0);
    expect(index()).toMatch(/^## J06 Review: small fixes, put back, word for word, change words, save or keep private$/m);
    expect(index()).not.toMatch(/tidy/i);
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
