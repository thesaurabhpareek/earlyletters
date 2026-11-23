/// <reference types="node" />
/**
 * BL-221: the keep-and-leave Maestro flow (E2E-21) states LEGAL-REQ-050 row by row, and its
 * header is honest about the ids the app does not set yet. This reads the flow as text; it
 * does not run it (the flow runs on a Mac, apps/mobile/e2e/bin/run-suite.sh) and nothing
 * here says it passed on a device. Fictional Asha family only.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const APP = join(__dirname, '..');
const E2E = join(APP, 'e2e');
const FLOW = join(E2E, 'flows', 'E2E-21-keep-and-leave.yaml');
const flow = readFileSync(FLOW, 'utf8');
const [head, body] = flow.split(/^---$/m);
const steps = body ?? '';

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) sourceFiles(p, out);
    else if (/\.tsx?$/.test(e) && !/\.test\.tsx?$/.test(e)) out.push(p);
  }
  return out;
}

describe('[LEGAL-REQ-050] E2E-21 keep and leave', () => {
  it('is tagged with the requirement, its P0 siblings and the two decisions it rests on', () => {
    for (const tag of ['E2E-21', 'LEGAL-REQ-050', 'F14-REQ-029', 'D-082', 'D-083']) expect(head, tag).toMatch(new RegExp(`^  - ${tag}$`, 'm'));
  });

  it('row 1: a new letter at Keep is held with its words, not discarded, and Tonight shows it waiting', () => {
    const order = ['write.keep.book', 'plusGate.hold', 'plusGate.held', 'plusGate.heldNote', 'tonight.waiting'].map((id) => steps.indexOf(`"${id}"`));
    expect(order.every((i) => i >= 0), String(order)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
    // The held card is checked against the typed words, so a truncated or empty hold fails.
    expect(steps).toMatch(/text: "\.\*waved at the dog\.\*"/);
    expect(head).toMatch(/LETTER: "Asha, today you waved at the dog next door\."/);
  });

  it('rows 2 to 5: read, play, Read together and export are each followed by "no Plus sheet"', () => {
    for (const id of ['book.card', 'letter.screen', 'player.play', 'book.readTogether', 'readTogether.screen', 'export.screen', 'export.start', 'export.ready']) {
      // Read together is opened by the shared subflow, so its ids are checked there.
      const where = id.startsWith('book.readTogether') || id.startsWith('readTogether') ? readFileSync(join(E2E, 'subflows', 'read-together-once.yaml'), 'utf8') : steps;
      expect(where, id).toContain(`"${id}"`);
    }
    expect(steps).toContain('../subflows/read-together-once.yaml');
    const noSheet = steps.match(/assertNotVisible:\n    id: "plusGate\.hold"/g) ?? [];
    expect(noSheet.length).toBeGreaterThanOrEqual(5); // after the hold, the letter, playing, Read together and export
  });

  it('never buys: the flow never taps the Plus buttons, and it runs on the Free seed with 3 letters (past the 2 free)', () => {
    expect(steps).not.toMatch(/tapOn:\n    id: "plusGate\.(seePlus|redeem|subscribe)"/);
    expect(steps).toMatch(/E2E_SEED: "asha-recordings"/);
    expect(steps).not.toMatch(/e2eConfig|E2E_CONFIG/); // no override that could hide a gate
  });

  it('deletion and restore from Recently deleted, the rest of the promise, is stated by E2E-08 and the header says so', () => {
    expect(head).toMatch(/E2E-08/);
    const e08 = readFileSync(join(E2E, 'flows', 'E2E-08-delete-and-undo.yaml'), 'utf8');
    expect(e08).toContain('Recently deleted');
    expect(e08).toMatch(/Restore/);
  });

  it('the code-level pins named in the header exist and state the Keep step as the only gate', () => {
    for (const f of ['billing-keep-gate-m17.test.ts', 'billing-keep-gate-plan-read.test.ts', 'review-keep-m17.test.ts']) {
      expect(head, f).toContain(f);
      expect(existsSync(join(APP, 'test', f)), f).toBe(true);
    }
    const m17 = readFileSync(join(APP, 'test', 'billing-keep-gate-m17.test.ts'), 'utf8');
    expect(m17).toMatch(/\[F14-REQ-038\] a save with no words/);
    const plan = readFileSync(join(APP, 'test', 'billing-keep-gate-plan-read.test.ts'), 'utf8');
    expect(plan).toMatch(/RT-PLS-10/);
  });

  it('the requirement text and the flow agree on the words that matter', () => {
    const req = readFileSync(join(APP, '..', '..', 'docs', 'legal', 'ENGINEERING_REQUIREMENTS.md'), 'utf8');
    const row = req.slice(req.indexOf('### LEGAL-REQ-050'), req.indexOf('### LEGAL-REQ-051'));
    expect(row).toMatch(/\(P0\)/);
    expect(row).toMatch(/A letter waiting at the Keep step is never discarded, hidden or truncated/);
    expect(row).toMatch(/readable, playable and exportable/);
  });

  it('is honest about what is missing: the blocked line is exactly the ids not set in src, matched in full', () => {
    // The flow plus the subflows it runs (open-settings, read-together-once) are what Maestro selects by id.
    const sub = ['open-settings.yaml', 'read-together-once.yaml'].map((f) => readFileSync(join(E2E, 'subflows', f), 'utf8')).join('\n');
    const used = [...new Set([...(steps + sub).matchAll(/id: "([a-z][A-Za-z0-9.]+)"/g)].map((m) => m[1]))].sort();
    const src = sourceFiles(join(APP, 'src')).map((f) => readFileSync(f, 'utf8')).join('\n');
    // The full id as a string value somewhere in src (a testID prop, a constant or a table), never a prefix of it.
    const isSet = (id: string) => ['\'', '"', '`'].some((q) => src.includes(`${q}${id}${q}`));
    const missing = used.filter((id) => !isSet(id));
    const blocked = (head.match(/^# Blocked until testIDs land: (.+)$/m)?.[1] ?? '').split(/,\s*/).map((s) => s.trim()).filter(Boolean).sort();
    expect(blocked.length).toBeGreaterThan(0);
    // Both directions: an unset id left out of the line fails, and so does an id that landed but is still listed.
    expect(blocked).toEqual(missing);
    const requests = readFileSync(join(E2E, 'TESTID_REQUESTS.md'), 'utf8');
    for (const id of used) expect(requests, id).toContain(`\`${id}\``);
    // Ids the app already has under another name are used as the app names them, not requested again.
    for (const id of ['book.card', 'export.failed', 'settings.whereLive', 'whereLive.export']) expect(isSet(id), id).toBe(true);
    for (const old of ['book.letter', 'export.error', 'settings.export']) expect(used, old).not.toContain(old);
  });

  it('is honest about the seam and the seed: the header says both are missing while src/dev/e2e-seams.ts lacks them', () => {
    const seams = readFileSync(join(APP, 'src', 'dev', 'e2e-seams.ts'), 'utf8');
    const seedLanded = seams.includes('asha-recordings');
    const seamLanded = /e2eSeed/.test(seams) && /e2eOffline/.test(seams);
    // When both land this fails: delete the BLOCKED lines for them and add the flow to run-suite.sh.
    expect(head).toMatch(/^# BLOCKED: this flow cannot run yet/m);
    expect(head).toMatch(/e2eSeed and e2eOffline are not read there yet/);
    expect(head).toMatch(/seedAsha[\s\S]*6 letters, 4\s*#?\s*spoken/);
    expect(seedLanded, 'asha-recordings now exists in e2e-seams.ts: update the header').toBe(false);
    expect(seamLanded, 'the launch seam now exists: update the header').toBe(false);
    expect(head).not.toMatch(/ran on a device|passed on a device/);
  });

  it('while blocked, the flow is not in the nightly list of run-suite.sh', () => {
    const suite = readFileSync(join(E2E, 'bin', 'run-suite.sh'), 'utf8');
    const list = suite.slice(suite.indexOf('FLOWS=('), suite.indexOf('\n)', suite.indexOf('FLOWS=(')));
    expect(list).not.toContain('E2E-21');
    expect(existsSync(FLOW)).toBe(true);
  });
});
