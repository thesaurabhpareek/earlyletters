/**
 * [BL-419] First run and the stop screen, after the design pass (J01-03, J01-04, J01-10, J01-13, J02-02, J02-04,
 * J03-03). Done when: no orphaned word in the finale or stop headings, including two long names, and the stop-screen
 * heading does not jump when the way back appears. Screens load React Native, so this reads the source the way the
 * other first-run guards do, and checks the wrap with a small greedy line breaker (break at a space, never at a
 * no-break space), the rule iOS and the web use for these headings. Pixels are the journey run's job, not this file's.
 *
 * Council rulings (BACKLOG BL-419 update): the finale keeps its hero size, and the orphan is handled by joining the
 * last two words at render time (PR #1506). "Add another child" sits below the date block (PR #1501).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { tokens } from '@scribe/design-tokens';
import { joinLastTwoWords } from '../src/components/onboarding/finale-title.logic';
import { copy, withBrandName } from '../src/lib/copy';
import { en } from '@scribe/content';

const SRC = join(__dirname, '..', 'src');
const code = (rel: string) =>
  readFileSync(join(SRC, rel), 'utf8').replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const N = String.fromCharCode(0xa0);

/**
 * The whole opening tag that starts at `at` (a `<`), up to the `>` that closes it: a `>` inside `{...}` or a string
 * (an arrow, a comparison) does not end it. The tag's props come before and after the testID, so reading only up to
 * the first `>` after the testID misses the className (the Review B finding on PR #2115).
 */
function openingTag(src: string, at: number): string {
  expect(src[at]).toBe('<');
  let depth = 0;
  let quote = '';
  for (let i = at + 1; i < src.length; i++) {
    const ch = src[i];
    if (quote) {
      if (ch === quote && src[i - 1] !== '\\') quote = '';
    } else if (ch === '"' || ch === "'" || ch === '`') quote = ch;
    else if (ch === '{') depth++;
    else if (ch === '}') depth--;
    else if (ch === '>' && depth === 0) return src.slice(at, i + 1);
  }
  throw new Error(`no end to the tag at ${at}`);
}
/** Anything that centres a child on the main axis of a column, or turns the column into a row (where items-center would). */
const CENTRES = [
  /justify-(center|between|around|evenly)\b/,
  /justifyContent/,
  /\b(my|mt|mb|m)-auto\b/,
  /margin(Vertical|Top|Bottom)?: 'auto'/,
  /flex-row\b/,
  /flexDirection/,
  /\bself-center\b|alignSelf: 'center'/,
];

/** Greedy wrap at `width` characters: breaks only at a plain space, so a no-break space keeps its two words on one line. */
function wrap(text: string, width: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const unit of text.split(' ')) {
    const next = line ? `${line} ${unit}` : unit;
    if (line && next.length > width) {
      lines.push(line);
      line = unit;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}
const words = (line: string) => line.split(/[ \u00a0]+/).filter(Boolean).length;
/** Every width from the narrowest that holds the joined last two words up to one line: the last line is never one word. */
function orphanWidths(text: string): number[] {
  const tail = text.slice(text.lastIndexOf(' ') + 1);
  const out: number[] = [];
  for (let w = tail.length; w <= text.length; w++) {
    const lines = wrap(text, w);
    if (lines.length > 1 && words(lines[lines.length - 1]) === 1) out.push(w);
  }
  return out;
}

describe('[BL-419] the wrap check itself', () => {
  it('catches an orphan in a heading rendered as it is (the planted case), and none once the last two words are joined', () => {
    const t = 'Asha is currently for adults 18 and over';
    expect(orphanWidths(t).length).toBeGreaterThan(0);
    expect(orphanWidths(joinLastTwoWords(t))).toEqual([]);
  });
});

describe('[BL-419] [J02-02] [J02-03] the stop heading never ends on one word', () => {
  const gate = code('components/gate/age-gate-screen.tsx');
  const stop = gate.slice(gate.indexOf('testID="gate.stop"'), gate.indexOf('export function', gate.indexOf('testID="gate.stop"')));

  it('renders the stop line through the last-two-words join, as the one title1 heading of the stop view', () => {
    expect(gate).toContain("import { joinLastTwoWords } from '@/components/onboarding/finale-title.logic';");
    expect(stop).toMatch(/<Text variant="title1" asHeading=\{1\} className="text-center"[^>]*>\s*\{joinLastTwoWords\(g\.stopTitle\)\}\s*<\/Text>/);
    expect(stop).not.toMatch(/>\s*\{g\.stopTitle\}\s*</);
  });

  it('the real stop line, with the public name and with a long one, has no orphan at any width', () => {
    expect(orphanWidths(joinLastTwoWords(copy.ageGate.stopTitle))).toEqual([]);
    const long = withBrandName(en.ageGate.stopTitle, 'Asha Letters For Every Little Day');
    expect(orphanWidths(long).length).toBeGreaterThan(0);
    expect(orphanWidths(joinLastTwoWords(long))).toEqual([]);
    // Only the last gap changes; the words are the content's own.
    expect(joinLastTwoWords(copy.ageGate.stopTitle).replace(N, ' ')).toBe(copy.ageGate.stopTitle);
  });
});

describe('[BL-419] [J02-02] [J02-04] the stop screen anchors where the age gate does, and the way back moves nothing', () => {
  const gate = code('components/gate/age-gate-screen.tsx');
  const screen = gate.slice(gate.indexOf('export function AgeGateScreen'), gate.indexOf('function ReasonLine'));
  const stop = screen.slice(screen.indexOf('testID="gate.stop"'));

  it('one mark, outside the switch between views, so the question and the stop line hang from the same place', () => {
    expect(screen.match(/<QuotePair\b/g)).toHaveLength(1);
    expect(screen.indexOf('<QuotePair')).toBeLessThan(screen.indexOf("view !== 'stop' ? ("));
    expect(screen).toMatch(/style=\{\[\{ marginTop: ROOM\.markTop, alignItems: 'center' \}/);
  });

  it('the stop line sits the same gap under the mark as the question, top-anchored, never centred in the screen', () => {
    const ask = screen.slice(screen.indexOf("view !== 'stop' ? ("), screen.indexOf('testID="gate.stop"'));
    expect(ask).toMatch(/style=\{\{ marginTop: ROOM\.questionGap, alignItems: 'center' \}\}/);
    expect(stop).toMatch(/<View accessibilityLiveRegion="polite" style=\{\{ marginTop: ROOM\.questionGap \}\}>/);
  });

  it('nothing centres the stop line: not the stop view\'s whole opening tag, not the heading wrapper, not the scroll column', () => {
    const viewAt = screen.indexOf('<Animated.View key="stop"');
    expect(viewAt).toBeGreaterThan(0);
    const view = openingTag(screen, viewAt);
    expect(view).toContain('testID="gate.stop"');
    expect(view).toContain('className=');
    const wrapperAt = screen.indexOf('<View', viewAt + view.length);
    const wrapper = openingTag(screen, wrapperAt);
    // The wrapper is the heading's own parent: nothing but whitespace between them.
    expect(screen.slice(wrapperAt + wrapper.length)).toMatch(/^\s*<Text variant="title1"[^>]*>\s*\{joinLastTwoWords\(g\.stopTitle\)\}/);
    for (const tag of [view, wrapper]) for (const centre of CENTRES) expect(tag, `${centre} in ${tag}`).not.toMatch(centre);
    // The wrapper does not grow to fill the view (flex: 1 with centring is the old centred stop screen).
    expect(wrapper).not.toMatch(/\bflex-1\b|\bgrow\b|\bflex: 1\b|flexGrow|\bh-full\b|height: '100%'/);
    const scrollAt = gate.indexOf('<ScrollView');
    const scroll = openingTag(gate, scrollAt);
    for (const centre of CENTRES.slice(0, 4)) expect(scroll).not.toMatch(centre);
  });

  it('the way back is always laid out below the heading and only fades, so the heading cannot jump when it appears', () => {
    const heading = stop.indexOf('g.stopTitle');
    const slot = stop.indexOf('wayBackStyle]');
    expect(heading).toBeGreaterThan(0);
    expect(slot).toBeGreaterThan(heading);
    expect(stop).toMatch(/pointerEvents=\{windowPassed \? 'auto' : 'none'\}/);
  });

  it('the slot is rendered unconditionally, the heading wrapper\'s next sibling and the stop view\'s last child', () => {
    // Structure, not a list of spellings: between the heading wrapper's close and the slot there is nothing but
    // whitespace (comments are stripped), so no `{windowPassed && <...`, `{windowPassed ? (`, or any other
    // condition can sit in front of it; and after the slot closes, the stop view closes.
    const slotAt = stop.lastIndexOf('<Animated.View', stop.indexOf('wayBackStyle]'));
    const slot = openingTag(stop, slotAt);
    expect(slot).toContain('wayBackStyle]');
    expect(stop.slice(0, slotAt)).toMatch(/\{joinLastTwoWords\(g\.stopTitle\)\}\s*<\/Text>\s*<\/View>\s*$/);
    const rest = stop.slice(slotAt + slot.length);
    const close = rest.indexOf('</Animated.View>');
    // The slot holds the button and nothing that opens another Animated.View, then the stop view closes.
    expect(rest.slice(0, close)).not.toMatch(/<Animated\.View\b|windowPassed \?|windowPassed &&|[{(]\s*!?windowPassed\s*[)}]/);
    expect(rest.slice(0, close)).toMatch(/^\s*<Button\b[^>]*testID="gate\.stop\.mistake"[^>]*\/>\s*$/);
    expect(rest.slice(close)).toMatch(/^<\/Animated\.View>\s*<\/Animated\.View>\s*\)\}/);
  });

  it('the window changes only the slot\'s opacity and who can reach it, never its display, size or position', () => {
    const slotAt = stop.lastIndexOf('<Animated.View', stop.indexOf('wayBackStyle]'));
    const slot = openingTag(stop, slotAt);
    // The only props that read the window: touch and the accessibility tree. The style is the fixed box plus the fade.
    const props = [...slot.matchAll(/(\w+)=\{[^{}]*windowPassed/g)].map((m) => m[1]).sort();
    expect(props).toEqual(['accessibilityElementsHidden', 'importantForAccessibility', 'pointerEvents']);
    const style = slot.slice(slot.indexOf('style={'), slot.indexOf('}', slot.indexOf('wayBackStyle]')) + 1);
    expect(style).toMatch(/^style=\{\[\{ marginTop: ROOM\.answersGap, alignSelf: largeText \? 'stretch' : 'center' \}, wayBackStyle\]\}$/);
    expect(slot).not.toMatch(/display|height|Height|overflow|position|transform|scale|hidden|\bh-0\b|className=/);
    // The fade is opacity and nothing else, from a shared value the window drives.
    const fade = gate.slice(gate.indexOf('const wayBackStyle'), gate.indexOf(';', gate.indexOf('const wayBackStyle')));
    expect(fade).toMatch(/^const wayBackStyle = useAnimatedStyle\(\(\) => \(\{ opacity: wayBack\.value \}\)\)$/);
    expect(gate).not.toMatch(/display: (windowPassed|'none'|"none")|display=|'none' : 'flex'|'flex' : 'none'/);
  });
});

describe('[BL-419] [J01-13] [J03-03] the finale heading never ends on one word, with one name or two long ones', () => {
  const onboarding = code('app/onboarding.tsx');
  const finish = onboarding.slice(onboarding.indexOf("step === 'finish' && ("), onboarding.indexOf('<SpeechConsentCard'));

  it('keeps its hero (council ruling) and joins its last two words; no name is in the heading, so two names cannot widen it', () => {
    const heading = finish.slice(finish.indexOf('<Text ref={heading}'), finish.indexOf('</Text>', finish.indexOf('<Text ref={heading}')));
    expect(heading).toMatch(/variant="hero" asHeading=\{1\} className="text-center">\s*\{joinLastTwoWords\(o\.finish\.title\)\}\s*$/);
    expect(heading).not.toMatch(/child|names/);
  });

  it('the real finale heading has no orphan at any width', () => {
    expect(orphanWidths(joinLastTwoWords(copy.onboarding.finish.title))).toEqual([]);
  });
});

describe('[BL-419] [J01-10] [J01-13] the signature helper sits under its field at subhead', () => {
  const onboarding = code('app/onboarding.tsx');
  const signsAs = onboarding.slice(onboarding.indexOf("step === 'signsAs' && ("), onboarding.indexOf("step === 'finish' && ("));
  const field = signsAs.slice(signsAs.indexOf('<TextField'), signsAs.indexOf('/>', signsAs.indexOf('<TextField')));

  it('"Not talking yet?" is the field\'s own helper, at subhead, and the limit line takes its place near the limit', () => {
    expect(field).toMatch(/helper=\{nearLimit\(textLength\(signsAs\), SIGNS_AS_MAX\) \? fill\(copy\.childrenExtra\.edit\.signsAsLimit, \{ n: SIGNS_AS_MAX \}\) : o\.signsAs\.notYetHelp\}/);
    expect(field).toMatch(/helperVariant="subhead"/);
  });

  it('it no longer floats under the chips as a footnote', () => {
    expect(signsAs.match(/o\.signsAs\.notYetHelp/g)).toHaveLength(1);
    expect(signsAs.indexOf('o.signsAs.notYetHelp')).toBeLessThan(signsAs.indexOf('<ChipGroup'));
    expect(signsAs).not.toMatch(/<Text variant="footnote">\{o\.signsAs\.notYetHelp\}<\/Text>/);
  });

  it('TextField sets its helper at the size it is given (footnote by default), and subhead is 16 pt', () => {
    const tf = code('components/ui/text-field.tsx');
    expect(tf).toMatch(/helperVariant = 'footnote'/);
    expect(tf).toMatch(/<Text variant=\{helperVariant\} tone="muted">\s*\{helper\}/);
    expect(tokens.type.subhead.fontSize).toBe(16);
  });
});

describe('[BL-419] [J01-10] the helper is the field\'s VoiceOver hint, and the helper and the error never show together', () => {
  const tf = code('components/ui/text-field.tsx');
  const onboarding = code('app/onboarding.tsx');
  const signsAs = onboarding.slice(onboarding.indexOf("step === 'signsAs' && ("), onboarding.indexOf("step === 'finish' && ("));
  const field = signsAs.slice(signsAs.indexOf('<TextField'), signsAs.indexOf('/>', signsAs.indexOf('<TextField')));
  // The hint expression, run as written: it is plain JavaScript over two strings.
  const rhs = tf.slice(tf.indexOf('const hint =') + 'const hint ='.length, tf.indexOf(';', tf.indexOf('const hint =')));
  const hint = new Function('helper', 'error', `return (${rhs});`) as (h?: string, e?: string | null) => string | undefined;

  it('the hint carries the helper, adds the error when there is one, and is empty with neither', () => {
    expect(hint('Not talking yet?', undefined)).toBe('Not talking yet?');
    expect(hint('Not talking yet?', null)).toBe('Not talking yet?');
    expect(hint('Not talking yet?', 'Too long')).toContain('Not talking yet?');
    expect(hint('Not talking yet?', 'Too long')).toContain('Too long');
    expect(hint(undefined, 'Too long')).toBe('Too long');
    expect(hint(undefined, undefined)).toBeUndefined();
  });

  it('the field takes that hint unless its caller gives its own, and the signature field gives none', () => {
    expect(tf).toMatch(/accessibilityHint=\{props\.accessibilityHint \?\? hint\}/);
    expect(tf.match(/accessibilityHint=/g)).toHaveLength(1);
    expect(field).toContain('helper={');
    expect(field).not.toMatch(/accessibilityHint/);
  });

  it('the helper line is the else of the error line, so the two are never on screen together', () => {
    const lines = tf.slice(tf.indexOf('{error ? ('), tf.lastIndexOf(') : null}') + ') : null}'.length);
    expect(lines).toMatch(/^\{error \? \([\s\S]*\{error\}[\s\S]*\) : helper \? \(\s*<Text variant=\{helperVariant\} tone="muted">\s*\{helper\}\s*<\/Text>\s*\) : null\}$/);
    // Rendered in one place only: no second helper line outside the branch.
    expect(tf.match(/\{helper\}/g)).toHaveLength(1);
    expect(tf.match(/\{error\}/g)).toHaveLength(1);
  });
});

describe('[BL-419] [J01-04] [J01-03] promise and art (done by the experience pass, guarded here)', () => {
  const onboarding = code('app/onboarding.tsx');
  const promise = onboarding.slice(onboarding.indexOf("step === 'promise' && ("), onboarding.indexOf("step === 'child' && ("));

  it('the two promise points share one look: the same row, the same muted glyph, no fill, and no seal-with-check', () => {
    expect(promise.match(/<IconRow /g)).toHaveLength(2);
    expect(promise).not.toMatch(/<Card\b|variant="tinted"|accentSoft/);
    expect(onboarding).not.toMatch(/SealCheck/);
    const row = onboarding.slice(onboarding.indexOf('function IconRow'), onboarding.indexOf('function ReasonLine'));
    expect(row).toMatch(/<Icon size=\{20\} color=\{c\.textMuted\}/);
  });

  it('first run draws no inset line art: the welcome mark is centred, so no drawing sits inside the text edge', () => {
    expect(onboarding).not.toMatch(/<LineArt\b/);
    const lockup = code('components/onboarding/welcome-lockup.tsx');
    expect(lockup).toMatch(/style=\{\[\{ alignSelf: 'center' \}, style\]\}/);
  });
});
