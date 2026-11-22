/**
 * [BL-415] Client log canary: no entry text, transcript or child name reaches an app log.
 * The browser run is e2e-web (journey.ts `app` fixture); the matching rules are pure and tested here.
 */
/// <reference types="node" />
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHILD_NAME, SEED_TEXT_FRAGMENTS, findLeaks, runtimeFixture } from '../e2e-web/support/log-canary';

const read = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');
const squash = (s: string) => s.replace(/\s+/g, ' ').toLowerCase();

describe('[BL-415] log canary rules', () => {
  it('flags the child name as a whole word in any case', () => {
    expect(findLeaks(['ok', 'saved for Asha']).map((l) => `${l.label}@${l.line}`)).toEqual(['child-name@1']);
    expect(findLeaks(['child=asha;']).length).toBe(1);
    expect(findLeaks(['{"name":"ASHA"}']).length).toBe(1);
  });

  it('does not flag a longer word that only contains the name', () => {
    expect(findLeaks(['Ashanti', 'ashamed', 'cashate'])).toEqual([]);
  });

  it('flags seeded letter text, even when the line wraps or changes case', () => {
    expect(findLeaks(['note: Your Nani   made\ndal and nobody ate it']).length).toBe(1);
    expect(findLeaks(['LAVENDER SOAP PAPA INSISTS ON']).length).toBe(1);
  });

  it('flags a letter the journey typed, and only that journey', () => {
    const typed = [runtimeFixture('You laughed at the rain.')!];
    expect(findLeaks(['draft: you laughed at the rain.'], typed).length).toBe(1);
    expect(findLeaks(['draft: you laughed at the rain.'], []).length).toBe(0);
  });

  it('ignores very short runtime text and ordinary log lines', () => {
    expect(runtimeFixture('Hi')).toBeNull();
    expect(findLeaks(['[e2e-boot] Error: database is locked', 'Warning: Each child in a list'], ['hi'])).toEqual([]);
  });

  it('reports labels and positions only, never the line or the fixture text', () => {
    const typed = [runtimeFixture('You laughed at the rain.')!];
    const lines = [`Asha ${'x'.repeat(300)}`, 'note: Your Nani made dal', 'draft: you laughed at the rain.'];
    const leaks = findLeaks(lines, typed);
    expect(leaks.map((l) => l.label)).toEqual(['child-name', 'seed:1', 'typed:0']);
    const shown = JSON.stringify(leaks) + String(leaks.map((l) => `${l.label}@line${l.line}`));
    for (const secret of ['asha', 'nani', 'dal', 'laughed', 'rain', 'xxxx']) expect(shown.toLowerCase()).not.toContain(secret);
  });

  it('the failure message a journey raises holds no text (plant the name and a seeded phrase)', () => {
    const j = read('e2e-web/support/journey.ts');
    expect(j).toMatch(/findLeaks\(everyLog, TYPED\.get\(page\) \?\? \[\]\)\.map\(\(l\) => `\$\{l\.label\}@line\$\{l\.line\}`\)/);
    const planted = findLeaks(['Asha saved', 'the whole house is quiet'], []).map((l) => `${l.label}@line${l.line}`);
    let message = '';
    try {
      expect(planted).toEqual([]);
    } catch (e) {
      message = String((e as Error).message);
    }
    expect(message).toContain('child-name@line0');
    expect(message.toLowerCase()).not.toContain('asha');
    expect(message.toLowerCase()).not.toContain('house');
  });
});

describe('[BL-415] fixtures and wiring stay true', () => {
  it('the child name is the one the journeys use', () => {
    expect(CHILD_NAME).toBe(read('e2e-web/support/app.ts').match(/export const CHILD = '([^']+)'/)![1]);
  });

  it('every seed fragment is still in the seeded letters (drift guard)', () => {
    const seed = squash(read('src/dev/asha-seed.ts'));
    const missing = SEED_TEXT_FRAGMENTS.filter((f) => !seed.includes(f.toLowerCase()));
    expect(missing).toEqual([]);
  });

  it('the journey fixture captures every console level and page errors, and asserts no leak', () => {
    const j = read('e2e-web/support/journey.ts');
    expect(j).toMatch(/page\.on\('console', \(m\) => \{\s*everyLog\.push\(m\.text\(\)\)/);
    expect(j).toMatch(/page\.on\('pageerror'[\s\S]*everyLog\.push/);
    expect(j).toMatch(/expect\(\s*findLeaks\(everyLog, TYPED\.get\(page\) \?\? \[\]\)/);
  });

  it('typed letters are registered with the canary', () => {
    expect(read('e2e-web/support/app.ts')).toMatch(/canary\(page, text\);\s*await btn\(page, \/\^Type\/\)/);
  });
});
