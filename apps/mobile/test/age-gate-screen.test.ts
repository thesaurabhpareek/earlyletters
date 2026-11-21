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

describe('[F2] Before you begin: two controls on one screen (design 2.1, COMPONENTS 2.25)', () => {
  const row = code(readFileSync(join(SRC, 'components', 'ui', 'agreement-row.tsx'), 'utf8'));

  it('[LEGAL-REQ-002] nothing is preselected: no answer and an unticked box on every visit', () => {
    expect(screen).toMatch(/useState<boolean \| null>\(null\)/);
    expect(screen).toMatch(/const \[agreed, setAgreed\] = useState\(false\)/);
    // "I answered by mistake" resets both.
    const mistake = screen.slice(screen.indexOf('const answeredByMistake'), screen.indexOf('const windowPassed'));
    expect(mistake).toMatch(/setAdult\(null\)/);
    expect(mistake).toMatch(/setAgreed\(false\)/);
  });

  it('Continue is never disabled: an early tap shows the reason line (announced) and stores nothing', () => {
    const cont = screen.slice(screen.lastIndexOf('<Button', screen.indexOf('testID="gate.continue"')), screen.indexOf('testID="gate.continue"'));
    expect(cont).not.toMatch(/disabled=/);
    const submit = screen.slice(screen.indexOf('const submit'), screen.indexOf('const answeredByMistake'));
    const reason = submit.slice(0, submit.indexOf("out.kind === 'stop'"));
    expect(reason).toMatch(/setReason\(out\.reason\)/);
    expect(reason).toMatch(/announce\(b\[out\.reason\]\)/);
    expect(reason).toMatch(/return;/);
    expect(reason).not.toMatch(/answerAgeGate|acceptBeforeYouBegin/);
    // The box takes focus when the tick is what is missing.
    expect(screen).toMatch(/invalid=\{reason === 'tickBox'\}/);
  });

  it('[LEGAL-REQ-002] No keeps the existing stop path: only answerAgeGate(\'no\'), nothing about the box', () => {
    const submit = screen.slice(screen.indexOf('const submit'), screen.indexOf('const answeredByMistake'));
    const stop = submit.slice(submit.indexOf("out.kind === 'stop'"), submit.indexOf('acceptBeforeYouBegin'));
    expect(stop).toMatch(/answerAgeGate\('no'\)/);
    expect(stop).not.toMatch(/agreed/);
  });

  it('the Terms and Privacy links are their own targets, outside the checkbox, and open the in-app browser', () => {
    expect(row).not.toMatch(/openBrowserAsync|role="link"/);
    expect(screen).toMatch(/label=\{b\.termsLink\} role="link"[^>]*accessibilityHint=\{b\.linkA11yHint\}[^>]*onPress=\{openLink\(brand\.web\.terms\)\}/);
    expect(screen).toMatch(/label=\{b\.privacyLink\} role="link"[^>]*accessibilityHint=\{b\.linkA11yHint\}[^>]*onPress=\{openLink\(brand\.web\.privacy\)\}/);
    expect(screen.indexOf('<AgreementRow')).toBeLessThan(screen.indexOf('testID="gate.terms"'));
  });

  it('the box is a native checkbox with its state, the sentence as its label, and at least a 44 pt row', () => {
    expect(row).toMatch(/accessibilityRole="checkbox"/);
    expect(row).toMatch(/accessibilityState=\{\{ checked \}\}/);
    expect(row).toMatch(/accessibilityLabel=\{label\}/);
    expect(row).toMatch(/minHeight: tokens\.target\.min/);
    expect(row).toMatch(/haptic\('tap'\)/);
  });

  it('a build 1 install sees the returning title and the agreement only, never the age question again', () => {
    expect(screen).toMatch(/\{view === 'agree' \? b\.returningTitle : g\.title\}/);
    expect(screen).toMatch(/\{view === 'ask' \? <AgeAnswers/);
  });

  it('every new part scrolls with the rest at large text sizes', () => {
    const open = screen.indexOf('<ScrollView');
    const close = screen.indexOf('</ScrollView>');
    for (const part of ['<AgreementRow', 'testID="gate.terms"', 'testID="gate.privacy"', '<ReasonLine']) {
      const at = screen.indexOf(part);
      expect(at > open && at < close, `${part} scrolls`).toBe(true);
    }
  });
});
