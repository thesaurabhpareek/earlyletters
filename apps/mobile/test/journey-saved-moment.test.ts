/// <reference types="node" />
/**
 * [BL-1646] (BL-480 point 4) The saved moment is in the record: J06-09, J06-11 and J07-07 wait for the chip and the
 * confirmation line to be on screen before they capture, and fail loudly if they never show. Pure waiting logic is
 * driven here with a fake reader; the flows are checked for the options they must pass. No parent-facing string changes.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { missingNeeds, waitForNeeds } from '../e2e-web/support/saved-moment';

const E2E = join(__dirname, '..', 'e2e-web');
const read = (...p: string[]) => readFileSync(join(E2E, ...p), 'utf8');
const card = ['To Asha · Month 7', 'From Mama', 'Asha, today you held the spoon by yourself.'];

describe('[BL-1646] missingNeeds', () => {
  it('names each need not in the visible lines, by string equality or pattern', () => {
    const needs = [/^Kept in /, "Added to Asha's book."];
    expect(missingNeeds(card, needs)).toEqual(needs);
    expect(missingNeeds([...card, 'Kept in Month 7', "Added to Asha's book."], needs)).toEqual([]);
    expect(missingNeeds([...card, 'Kept in Month 7'], needs)).toEqual(["Added to Asha's book."]);
  });
  it('a string need is the whole line, not a part of one', () => {
    expect(missingNeeds(['Kept private. Always.'], ['Kept private.'])).toEqual(['Kept private.']);
  });
});

describe('[BL-1646] waitForNeeds', () => {
  const clock = () => {
    let t = 0;
    return { now: () => t, sleep: async (ms: number) => void (t += ms) };
  };
  it('keeps reading while the chip is still at opacity 0, then returns the lines that show it', async () => {
    const c = clock();
    let reads = 0;
    // The recorder leaves out text that is not opaque: the chip arrives on the fifth read, as the 250 ms fade-in does.
    const read = async () => (++reads < 5 ? card : [...card, 'Kept in Month 7', "Added to Asha's book."]);
    const lines = await waitForNeeds(read, [/^Kept in /, "Added to Asha's book."], { ...c, timeoutMs: 3000, everyMs: 50 });
    expect(reads).toBe(5);
    expect(lines).toContain('Kept in Month 7');
  });
  it('does not wait at all when nothing is needed or it is already there', async () => {
    const c = clock();
    let reads = 0;
    await waitForNeeds(async () => (reads++, card), [], { ...c, timeoutMs: 3000, everyMs: 50 });
    expect(c.now()).toBe(0);
  });
  it('throws when the moment never shows, naming what is missing and never the letter text', async () => {
    const c = clock();
    const err = await waitForNeeds(async () => card, ['Kept private.'], { ...c, timeoutMs: 400, everyMs: 50 }).catch((e: Error) => e);
    expect(err).toBeInstanceOf(Error);
    expect((err as Error).message).toContain('Kept private.');
    expect((err as Error).message).not.toContain('spoon');
    expect(c.now()).toBeGreaterThanOrEqual(400);
  });
});

describe('[BL-1646] the three steps ask for their moment', () => {
  const recorder = read('support', 'journey.ts');
  it('the recorder waits for the needs before it reads the text and takes the shot', () => {
    expect(recorder).toContain('needs?:');
    const wait = recorder.indexOf('waitForNeeds(');
    expect(wait).toBeGreaterThan(-1);
    expect(wait).toBeLessThan(recorder.indexOf('page.screenshot('));
    expect(wait).toBeLessThan(recorder.indexOf("const text = lines.join(' ')"));
  });
  it('journey() passes the option through to the recorder', () => {
    const app = read('support', 'app.ts');
    expect(app).toMatch(/opts\?: \{ settle\?: number; needs\?:/);
  });
  const stepCall = (file: string, title: string) => {
    const src = read(file);
    const i = src.indexOf(`'${title}'`);
    expect(i, `${title} in ${file}`).toBeGreaterThan(-1);
    return src.slice(i, src.indexOf(');', i));
  };
  it('J06-09 needs the chip and the confirmation line', () => {
    const call = stepCall('j06-review.flow.ts', 'Saved: kept in its month');
    expect(call).toContain('needs:');
    expect(call).toContain('Kept in ');
    expect(call).toContain("Added to Asha's book.");
  });
  it('J06-11 and J07-07 need the lock chip line', () => {
    expect(stepCall('j06-review.flow.ts', 'Kept private')).toMatch(/needs: \[[^\]]*Kept private\./);
    expect(stepCall('j07-typed.flow.ts', 'Kept private')).toMatch(/needs: \[[^\]]*Kept private\./);
  });
});
