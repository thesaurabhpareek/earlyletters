/**
 * The age gate at Dynamic Type (EXPERIENCE_PASS S01, S02; LEGAL-REQ-002; review P2-C B1). The gate is the only way into
 * the app, so every control on it must stay reachable at every text size: at AX3 and AX5 on an iPhone SE with Display
 * Zoom (320 x 568 pt) the question, the stacked pills and Continue are taller than the screen. Both views therefore sit
 * in one ScrollView whose content grows to fill the screen (flexGrow 1), so nothing moves when it fits and Continue,
 * or "I answered by mistake", scrolls into reach when it does not. This is a source test: the screen is React Native,
 * and Node tests do not render it (the web build and a phone do).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(__dirname, '..', 'src');
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const gate = code(readFileSync(join(SRC, 'components', 'gate', 'age-gate-screen.tsx'), 'utf8'));
const screen = gate.slice(gate.indexOf('export function AgeGateScreen'), gate.indexOf('export function AgeAnswers'));

describe('[S01] [S02] Dynamic Type: every control on the gate stays reachable', () => {
  it('both views render inside one ScrollView whose content fills the screen (flexGrow 1)', () => {
    const open = screen.indexOf('<ScrollView');
    const close = screen.indexOf('</ScrollView>');
    expect(open, 'the gate has a ScrollView').toBeGreaterThan(0);
    expect(close).toBeGreaterThan(open);
    expect(screen.slice(open, screen.indexOf('>', open))).toMatch(/contentContainerStyle=\{\{ flexGrow: 1\b/);
    // Everything someone must reach is inside it: the question, both answers, Continue, the stop line and the way back.
    for (const part of ['{g.title}', '<AgeAnswers', 'copy.common.continueButton', '{g.stopTitle}', 'g.mistakeButton']) {
      const at = screen.indexOf(part);
      expect(at, `${part} is on the gate`).toBeGreaterThan(0);
      expect(at > open && at < close, `${part} scrolls`).toBe(true);
    }
    // One ScrollView for both views, so the mark does not move between the question and the stop line.
    expect(screen.match(/<ScrollView\b/g)).toHaveLength(1);
    expect(screen.indexOf('<QuotePair')).toBeGreaterThan(open);
  });

  it('the answers stack at accessibility sizes and their words are not capped (they grow with the reader\'s size)', () => {
    expect(gate).toMatch(/const stacked = useIsLargeText\(\)/);
    expect(gate).toMatch(/flexDirection: stacked \? 'column' : 'row'/);
    expect(gate).toMatch(/<Text variant="label">\{label\}<\/Text>/);
    expect(gate).not.toMatch(/maxFontSizeMultiplier/);
  });
});

describe('[F01-REQ-002] [SR-C-04] the screen writes a No only from the confirm step (F01-U01)', () => {
  const fn = (name: string) => {
    const at = screen.indexOf(`const ${name} = `);
    expect(at, `${name} exists`).toBeGreaterThan(0);
    return screen.slice(at, screen.indexOf('\n  };', at));
  };

  it('Continue never stores a No: it asks continueGate, and a No opens the confirm step', () => {
    const submit = fn('submit');
    expect(submit).toMatch(/continueGate\(adult\)/);
    expect(submit).not.toMatch(/answerAgeGate\(\s*(adult \?|'no')/);
    expect(submit).toMatch(/setView\('confirm'\)/);
  });

  it('the confirm step offers "Yes, I am under 18" and Go back, each by id, inside the scroll', () => {
    const confirm = fn('confirm');
    expect(confirm).toMatch(/confirmGate\(choice\)/);
    expect(confirm).toMatch(/setAdult\(step\.adult\)/);
    for (const part of ['testID="gate.confirm"', '{g.confirmTitle}', 'g.confirmYes', 'g.confirmBack', 'testID="gate.confirm.yes"', 'testID="gate.confirm.back"']) {
      const at = screen.indexOf(part);
      expect(at, `${part} is on the gate`).toBeGreaterThan(0);
      expect(at > screen.indexOf('<ScrollView') && at < screen.indexOf('</ScrollView>'), `${part} scrolls`).toBe(true);
    }
  });
});
