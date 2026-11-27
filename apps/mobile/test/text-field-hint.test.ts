/**
 * CR-235 (Karma, 27 Nov 2026): TextField's helper is read twice by VoiceOver on purpose, and this pins it.
 *
 * The helper is the field's accessibilityHint, so it is heard when the field takes focus, however the person got
 * there (swiping, the Form Controls rotor, a tap). It is also a visible line that stays in the accessibility tree,
 * so a person who has turned VoiceOver hints off still reaches it. Some helpers are input limits (the photo text and
 * place lines, "Up to 140 characters", and the From sheet's "Up to 30 characters"), which WCAG 3.3.2 asks to be given
 * as instructions to every user. Hiding the line would cut it off for hints-off users;
 * dropping it from the hint would cut it off for rotor users. One repeated line costs less than either, so the
 * review note on #2115 (a note in Review B, and note 2 of Review A) is closed by this test, not by a change.
 *
 * Also closes Review A of #2115, note 1: nothing pinned the helper-to-hint wiring or that the visible line shows
 * the error or the helper, never both. Read as source, like a11y-lint.test.ts. Fictional family "Asha".
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const FILE = join(__dirname, '../src/components/ui/text-field.tsx');
// Comments are dropped so a good line left in a comment cannot pass. A line comment starts at the line's start or after
// a space, so `//` inside a string (`testID="a//b"`) or a URL keeps the rest of its line.
const strip = (s: string) => s.replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '').replace(/(^|\s)\/\/.*$/gm, '$1');
const src = () => strip(readFileSync(FILE, 'utf8'));

/** The rules, as functions of the source, so each mutant below is checked by the same code as the real file. */
const rules = {
  hintJoinsHelperThenError: (s: string) => /const hint = \[helper, error\]\.filter\(Boolean\)\.join\('\. '\) \|\| undefined;/.test(s),
  // The one hint prop in the file, on the TextInput, after the caller's spread so the field's hint wins over nothing.
  inputTakesTheHint: (s: string) => {
    const at = s.indexOf('<TextInput');
    const end = s.indexOf('/>', at);
    const tag = s.slice(at, end);
    return at >= 0 && /accessibilityHint=\{props\.accessibilityHint \?\? hint\}/.test(tag) && (s.match(/accessibilityHint=/g) ?? []).length === 1
      && tag.indexOf('{...props}') < tag.indexOf('accessibilityHint=');
  },
  // `error ? (<error row>) : helper ? (<helper line>) : null`: one visible line, the error first, and the helper is
  // drawn in that one place only.
  oneVisibleLine: (s: string) => /\{error \? \([\s\S]*?\) : helper \? \([\s\S]*?\{helper\}[\s\S]*?\) : null\}/.test(s)
    && (s.match(/\{helper\}/g) ?? []).length === 1,
  // The polite live region is the error row itself, and the error is announced each time it changes.
  errorIsLive: (s: string) => /\{error \? \(\s*<View [^>]*accessibilityLiveRegion="polite"/.test(s)
    && (s.match(/accessibilityLiveRegion=/g) ?? []).length === 1
    && /React\.useEffect\(\(\) => \{\s*if \(error\) announce\(error\);\s*\}, \[error\]\);/.test(s),
  // Nothing in the field leaves the accessibility tree or folds into one element: the helper and error lines stay
  // readable with hints off. The words are refused as props and as object keys, and the only JSX spread allowed is the
  // caller's `{...props}` on the TextInput, so a hiding spread on a wrapper (`{...hiddenBehind(true)}`) cannot slip in.
  nothingHidden: (s: string) => !/accessibilityElementsHidden|importantForAccessibility|aria-hidden|\baccessible\b|hiddenBehind/.test(s)
    && (s.match(/\{\s*\.\.\.[^}]*\}/g) ?? []).every((spread) => spread === '{...props}')
    && (s.match(/\{\.\.\.props\}/g) ?? []).length === 1,
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
    const helperLine = /<Text variant=\{?[\w'"]+\}? tone="muted">\s*\{helper\}/;
    expect(helperLine.test(s), 'the helper line is found').toBe(true);
    const hideHelper = (attr: string) => s.replace(helperLine, (m) => m.replace('<Text ', `<Text ${attr} `));
    for (const attr of ['accessibilityElementsHidden', "importantForAccessibility='no-hide-descendants'", 'accessible={false}', 'aria-hidden']) {
      expect(rules.nothingHidden(hideHelper(attr)), attr).toBe(false);
    }
    // The same through a spread on a wrapper, or the whole field folded into one element by a bare `accessible`.
    const wrap = (open: string) => s.replace(helperLine, (m) => `${open}${m}`).replace(/(\{helper\}\s*<\/Text>)/, '$1</View>');
    for (const open of ['<View {...hiddenBehind(true)}>', '<View {...{ accessible: false }}>', "<View {...Platform.select({ android: { importantForAccessibility: 'no-hide-descendants' } })}>"]) {
      expect(rules.nothingHidden(wrap(open)), open).toBe(false);
    }
    expect(rules.nothingHidden(broken(/<View className=/, '<View accessible className='))).toBe(false);
    expect(rules.inputTakesTheHint(broken('aria-invalid=', 'accessibilityHint={undefined}\n      aria-invalid='))).toBe(false);
    expect(rules.oneVisibleLine(broken('{error ? (', '{helper}{error ? ('))).toBe(false);
    expect(rules.errorIsLive(broken('accessibilityLiveRegion="polite"', ''))).toBe(false);
    expect(rules.errorIsLive(broken('}, [error]);', '}, []);'))).toBe(false);
  });
});
