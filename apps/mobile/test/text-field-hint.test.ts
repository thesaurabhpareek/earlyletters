/**
 * CR-235 (Karma, 27 Nov 2026): TextField's helper is read twice by VoiceOver on purpose, and this pins it.
 *
 * The helper is the field's accessibilityHint, so it is heard when the field takes focus, however the person got
 * there (swiping, the Form Controls rotor, a tap). It is also a visible line that stays in the accessibility tree,
 * so a person who has turned VoiceOver hints off still reaches it. Several helpers are input limits ("Up to 30
 * characters"), which WCAG 3.3.2 wants given to everyone. Hiding the line would cut it off for hints-off users;
 * dropping it from the hint would cut it off for rotor users. One repeated line costs less than either, so the
 * review note on #2115 (Review B item 2) is closed by this test, not by a change.
 *
 * Also closes Review A of #2115, note 1: nothing pinned the helper-to-hint wiring or that the visible line shows
 * the error or the helper, never both. Read as source, like a11y-lint.test.ts. Fictional family "Asha".
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const FILE = join(__dirname, '../src/components/ui/text-field.tsx');
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const src = () => strip(readFileSync(FILE, 'utf8'));

/** The rules, as functions of the source, so each mutant below is checked by the same code as the real file. */
const rules = {
  hintJoinsHelperThenError: (s: string) => /const hint = \[helper, error\]\.filter\(Boolean\)\.join\('\. '\) \|\| undefined;/.test(s),
  inputTakesTheHint: (s: string) => {
    const at = s.indexOf('<TextInput');
    const end = s.indexOf('/>', at);
    return at >= 0 && /accessibilityHint=\{props\.accessibilityHint \?\? hint\}/.test(s.slice(at, end));
  },
  // `error ? (<error row>) : helper ? (<helper line>) : null`: one visible line, the error first.
  oneVisibleLine: (s: string) => /\{error \? \([\s\S]*?\) : helper \? \([\s\S]*?\{helper\}[\s\S]*?\) : null\}/.test(s),
  errorIsLive: (s: string) => /accessibilityLiveRegion="polite"/.test(s) && /if \(error\) announce\(error\);/.test(s),
  // Nothing in the field leaves the accessibility tree: the helper and error lines stay readable with hints off.
  nothingHidden: (s: string) => !/accessibilityElementsHidden|importantForAccessibility=["{]|aria-hidden/.test(s),
};

describe('[CR-235] TextField: the helper is the hint and a readable line; the error is live and never hidden', () => {
  for (const [name, rule] of Object.entries(rules)) {
    it(name, () => {
      expect(rule(src()), name).toBe(true);
    });
  }

  it('mutants: each way to break the wiring, the order, the one-line rule or the readable line is caught', () => {
    const s = src();
    const broken = (find: string | RegExp, put: string) => {
      const out = s.replace(find, put);
      expect(out, String(find)).not.toBe(s);
      return out;
    };
    // The hint wiring (Review A of #2115, mutants 2 to 4) and the join order (mutant H5).
    expect(rules.inputTakesTheHint(broken('accessibilityHint={props.accessibilityHint ?? hint}', 'accessibilityHint={props.accessibilityHint}'))).toBe(false);
    expect(rules.hintJoinsHelperThenError(broken('[helper, error]', '[error, helper]'))).toBe(false);
    expect(rules.hintJoinsHelperThenError(broken('[helper, error]', '[error]'))).toBe(false);
    // Both lines shown at once, or the helper winning over the error.
    expect(rules.oneVisibleLine(broken(') : helper ? (', ')}{helper ? ('))).toBe(false);
    expect(rules.oneVisibleLine(broken(/\{error \? \(/, '{helper && !error ? ('))).toBe(false);
    // The option CR-235 turned down: hiding the visible helper line from VoiceOver.
    expect(rules.nothingHidden(broken('<Text variant=', '<Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" variant='))).toBe(false);
    expect(rules.errorIsLive(broken('accessibilityLiveRegion="polite"', ''))).toBe(false);
  });
});
