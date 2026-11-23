/// <reference types="node" />
/**
 * [BL-1644] BL-480 points 2 and 5. The seeded family's dates are relative to the day of the run, so a flow note must not
 * hard-code one (the record carries the run day's dates), and the index prints a title as written, so a title that ends
 * in a question mark does not read "x?.". Fictional family Asha only.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

const FLOWS = join(__dirname, '..', 'e2e-web');
const SCRIPT = join(FLOWS, 'support', 'build-index.mjs');
const SPAWN_TIMEOUT_MS = 30_000;
const MONTH_DAY = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.? \d{1,2}\b|\b\d{1,2} (?:January|February|March|April|June|July|August|September|October|November|December)\b/;

describe('[BL-1644] a flow note carries no run-day date', () => {
  it('the date check recognises the notes it must reject', () => {
    expect(MONTH_DAY.test('"Deleted October 13. Kept here until November 12."')).toBe(true);
    expect(MONTH_DAY.test('Birthday 30 October')).toBe(true);
    expect(MONTH_DAY.test('one line that says when it was deleted')).toBe(false);
  });

  it('no step() note in any flow names a month and a day', () => {
    const offenders: string[] = [];
    for (const f of readdirSync(FLOWS).filter((n) => n.endsWith('.flow.ts'))) {
      readFileSync(join(FLOWS, f), 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (/\bstep\(/.test(line) && MONTH_DAY.test(line)) offenders.push(`${f}:${i + 1}`);
        });
    }
    expect(offenders).toEqual([]);
  });

  it('the journey README says the record carries the run day dates', () => {
    const readme = readFileSync(join(__dirname, '..', '..', '..', 'docs', 'release', 'journey', 'README.md'), 'utf8');
    expect(readme).toMatch(/The record carries the run day's dates\./);
    expect(readme).toMatch(/must not hard-code a date/);
  });
});

describe('[BL-1644] the index prints a title as written', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'journey-title-'));
    mkdirSync(join(dir, 'steps'));
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  const step = (id: string, title: string) =>
    writeFileSync(
      join(dir, 'steps', `${id}.json`),
      JSON.stringify({ id, journey: 'first-run', kind: 'happy', title, note: 'A note.', route: '/', text: '', lines: [], shot: `screens/${id}.png` }) + '\n',
    );
  const rows = () => {
    const r = spawnSync(process.execPath, [SCRIPT, '--dir', dir], { encoding: 'utf8' });
    expect(r.status, r.stderr).toBe(0);
    return readFileSync(join(dir, 'INDEX.md'), 'utf8');
  };

  it('keeps a question mark, an exclamation mark and a full stop, and adds a full stop to a bare title', () => {
    step('J01-01', 'What does Asha call you?');
    step('J01-02', 'All set!');
    step('J01-03', 'Done.');
    step('J01-04', 'Welcome');
    const md = rows();
    expect(md).toContain('**What does Asha call you?** A note.');
    expect(md).toContain('**All set!** A note.');
    expect(md).toContain('**Done.** A note.');
    expect(md).toContain('**Welcome.** A note.');
    expect(md).not.toMatch(/[?!.]\.\*\*/);
  }, SPAWN_TIMEOUT_MS);
});
