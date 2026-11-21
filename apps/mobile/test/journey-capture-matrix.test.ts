/**
 * [BL-410] The extended journey capture, checked without a browser. This proves the definitions, the flows' wiring and
 * that no screen is silently dropped; it does NOT prove a screen renders, a step is recorded or a layout fits at AX5:
 * only `npm run e2e:web:journey -w @scribe/mobile` on a machine with Chromium and the web export does.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { allCells, CONTROLS, LOCALES, SCALES, SCREENS, cellStepId } from '../e2e-web/support/capture-matrix';

const WEB = join(__dirname, '..', 'e2e-web');
const SRC_APP = join(__dirname, '..', 'src', 'app');
const read = (f: string) => readFileSync(join(WEB, f), 'utf8');

function appFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? appFiles(join(dir, e.name)).map((f) => `${e.name}/${f}`) : [e.name]));
}

describe('[BL-410] capture matrix', () => {
  it('holds hi, es, zh, fr, ar (RTL) and pt at default, AX3 and AX5 on the five controls', () => {
    expect(LOCALES.map((l) => l.code)).toEqual(['hi', 'es', 'zh', 'fr', 'ar', 'pt']);
    expect(LOCALES.filter((l) => l.rtl).map((l) => l.code)).toEqual(['ar']);
    expect(SCALES).toEqual(['default', 'ax3', 'ax5']);
    expect(CONTROLS.map((c) => c.key)).toEqual(['born-or-not-yet', 'add-to-book', 'exact-view', 'sounds-right', 'tab-labels']);
    expect(allCells()).toHaveLength(6 * 3 * 5);
  });

  it('gives every cell a unique step id that build-index reads as journey J24', () => {
    const ids = allCells().map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(cellStepId('ar', 'ax5', 'tab-labels')).toBe('J24-ar-ax5-tab-labels');
    for (const id of ids) expect(id.split('-')[0]).toBe('J24');
  });

  it('every control label is words the app says today (content strings), so a renamed control fails here', () => {
    const strings = readFileSync(join(__dirname, '..', '..', '..', 'packages', 'content', 'src', 'strings.en.ts'), 'utf8');
    for (const c of CONTROLS) for (const l of c.label) {
      expect(strings.includes(`"${l}"`), `${c.key}: "${l}"`).toBe(true);
    }
  });
});

describe('[BL-410] screens the capture must hold', () => {
  const appPaths = appFiles(SRC_APP).map((f) => f.replace(/\.tsx?$/, ''));

  it('names every screen the row lists', () => {
    expect(SCREENS.map((s) => s.id).sort()).toEqual(
      ['about', 'help', 'in-app-terms-privacy', 'interruption-states', 'legal-terms-privacy', 'lock-screen-notification', 'long-book', 'model-missing', 'second-waiting-draft', 'spoken-language', 'storage', 'tonight-not-yet-born', 'write-to-us'],
    );
  });

  it('a new or covered screen has a step with that title in a flow that exists', () => {
    for (const s of SCREENS) {
      if (s.status !== 'new' && s.status !== 'covered') continue;
      expect(existsSync(join(WEB, s.flow)), s.flow).toBe(true);
      expect(new RegExp(`step\\('(happy|unhappy)', '${s.stepTitle}'`).test(read(s.flow)), `${s.id}: step "${s.stepTitle}" in ${s.flow}`).toBe(true);
    }
  });

  it('a not-built screen really has no route yet; when one is built this fails so the status is moved to new', () => {
    for (const s of SCREENS) {
      if (s.status !== 'not-built' || s.route.startsWith('seed:')) continue;
      expect(appPaths.includes(s.route), `${s.id} now exists at ${s.route}: capture it and mark it new`).toBe(false);
    }
  });

  it('a device-only screen carries its reason', () => {
    for (const s of SCREENS) if (s.status === 'device' || s.status === 'not-built') expect(s.why.length).toBeGreaterThan(20);
  });

  it('the new flow keeps the journey code J23 and build-index gives it a heading', () => {
    expect(read('j23-more-screens.flow.ts')).toMatch(/journey\(record, 'J23', 'more-screens'/);
    expect(read('support/build-index.mjs')).toContain("'more-screens':");
  });

  it('the log canary is still wired into the fixture (no leak check removed)', () => {
    const j = read('support/journey.ts');
    expect(j).toContain('findLeaks(everyLog');
    expect(j).toContain("toEqual([])");
  });
});
