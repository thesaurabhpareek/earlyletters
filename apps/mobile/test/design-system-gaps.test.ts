/**
 * Design-system gap guards from the QA journey critique (docs/release/journey/critiques/design.json on
 * qa/journey-flows: J06 Review, J18 dark mode, and the "_journey" entries). The screens draw with React
 * Native, which Node cannot load, so these check the contract in the logic modules and, for "this screen
 * uses the shared pattern", the source. The behaviour on a phone is in the journey flows and the device pass.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tokens } from '@scribe/design-tokens';
import { describe, expect, it } from 'vitest';
import { HEADER_TARGET, IDIOM, ROOT_ROUTE_CONTEXT, presentationFor, type NavContext } from '../src/lib/navigation.logic';
import { TRUST_COPY_MIN_PT, footerPlacement, pinnedFooterHeight } from '../src/lib/review-layout.logic';

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
/** Comments are not code. */
const code = (t: string) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');

describe('(3) one back/close idiom per context', () => {
  it('push screens use the native back; modals and sheets use Close top right; nothing else', () => {
    const want: Record<NavContext, string> = {
      'tab-root': 'none',
      push: 'native-back',
      'flow-step': 'back-button',
      modal: 'close-top-right',
      sheet: 'close-top-right',
    };
    expect(IDIOM).toEqual(want);
  });

  it('the root stack presents exactly the routes the table calls modal as modals', () => {
    const layout = read('app/_layout.tsx');
    for (const [route, ctx] of Object.entries(ROOT_ROUTE_CONTEXT)) {
      const m = layout.match(new RegExp(`<Stack\\.Screen name="${route.replace(/[[\]()]/g, '\\$&')}"([^>]*)/>`));
      if (!m) continue; // settings and onboarding mount without options
      const presented = /presentation: '(modal|fullScreenModal)'/.test(m[1]);
      expect(presented, route).toBe(presentationFor(ctx) === 'modal');
    }
  });

  it('every modal screen draws Close with ModalHeader (top right) and none draws it top-left or at the bottom', () => {
    const modals = ['app/write.tsx', 'app/review.tsx', 'app/read-together.tsx', 'components/family/coparent-soon.tsx', 'lib/auth/ui.tsx'];
    for (const f of modals) expect(read(f), f).toMatch(/ModalHeader/);
    // listen's only own header is the denied state's, which goes through StateScreen's header slot
    expect(read('app/listen.tsx')).toMatch(/header=\{<ModalHeader/);
    for (const f of [...modals, 'app/listen.tsx', 'app/invite/index.tsx', 'app/invite/new.tsx']) {
      // the old idioms: a Close button with -ml-4 (top left), and a QuietButton footer that only closes
      expect(code(read(f)), f).not.toMatch(/closeButton[^\n]*\n[^\n]*className="-ml-4/);
      expect(code(read(f)), f).not.toMatch(/-ml-4[^\n]*label=\{copy\.common\.closeButton\}/);
    }
    expect(code(read('app/invite/index.tsx'))).not.toMatch(/footer=\{<QuietButton label=\{a\.close\}/);
    expect(code(read('app/invite/new.tsx'))).not.toMatch(/footer=\{<QuietButton label=\{familyCopy\.accept\.close\}/);
  });

  it('the Sheet closes with the word Close, not a circled X', () => {
    const sheet = code(read('components/ui/sheet.tsx'));
    expect(sheet).not.toMatch(/XIcon/);
    expect(sheet).toMatch(/label=\{copy\.common\.closeButton\}/);
  });

  it('onboarding steps use BackButton (the native back, drawn)', () => {
    expect(read('app/onboarding.tsx')).toMatch(/<BackButton /);
    expect(code(read('app/onboarding.tsx'))).not.toMatch(/icon=\{CaretLeftIcon\}/);
  });

  it('Close and Back are at least 44 pt', () => {
    expect(HEADER_TARGET).toBeGreaterThanOrEqual(tokens.target.min);
    const header = read('components/ui/screen-header.tsx');
    expect((header.match(/size="sm"/g) ?? []).length).toBeGreaterThanOrEqual(2); // Button sm is 44 pt
  });
});

describe('(2) one shared pattern for loading, empty and error states', () => {
  it('every screen that deviated now uses StateScreen or InlineState', () => {
    const uses: [string, RegExp][] = [
      ['app/review.tsx', /<StateScreen[\s\S]*kind="error"/], // J06-13: no draft
      ['app/review.tsx', /<InlineState[\s\S]*kind="loading"/], // J05-03: words on their way
      ['app/review.tsx', /<InlineState[\s\S]*kind="error"/], // transcription failed
      ['app/read-together.tsx', /<StateScreen kind="empty"/], // J11-07
      ['app/letter/[id].tsx', /<StateScreen kind="notFound"/], // J10-11
      ['app/listen.tsx', /<StateScreen[\s\S]*kind="empty"/], // J05-04: microphone off
      ['app/+not-found.tsx', /<EmptyState[\s\S]*router\.replace/], // Expo's default 404 (#93's screen: one way back to Tonight)
      ['app/_layout.tsx', /export function ErrorBoundary[\s\S]*<RootErrorBoundary/], // the blank crash (#93's boundary, not a second one)
    ];
    for (const [f, re] of uses) expect(read(f), `${f} ${re}`).toMatch(re);
  });

  it('the old one-off treatments are gone from those screens', () => {
    // a centred line plus a content-width button, and floating cards written by hand
    expect(code(read('app/review.tsx'))).not.toMatch(/<Card className="gap-3 rounded-3xl border-0 bg-card p-6"/);
    expect(code(read('app/read-together.tsx'))).not.toMatch(/emptyBody[\s\S]{0,80}<Button className="self-start"/);
    expect(code(read('app/letter/[id].tsx'))).not.toMatch(/items-start justify-center gap-5/);
    expect(code(read('app/listen.tsx'))).not.toMatch(/<Card padding=\{6\} radius="xl" className="gap-5">/);
  });

  it('the root crash screen reads nothing from navigation and never prints the error', () => {
    const layout = code(read('app/_layout.tsx'));
    expect(layout.match(/export function ErrorBoundary/g)).toHaveLength(1); // one implementation, not two
    const boundary = code(read('components/resilience/error-boundary.tsx'));
    const plain = code(read('components/resilience/plain-screen.tsx'));
    expect(boundary).not.toMatch(/\berror\b\.(message|stack)|console\./);
    expect(plain).not.toMatch(/useIsFocused|useRouter|useNavigation|useLocalSearchParams|console\./);
  });

  it('loading never uses a spinner on the screens that moved', () => {
    for (const f of ['app/review.tsx', 'components/ui/state-screen.tsx']) expect(read(f), f).not.toMatch(/ActivityIndicator/);
  });
});

describe('(4) touch targets and Review layout', () => {
  it('Button enforces its minimum height as a style as well as a class (quiet links are 44 pt)', () => {
    const button = read('components/ui/button.tsx');
    expect(button).toMatch(/BUTTON_MIN_HEIGHT = \{ sm: tokens\.target\.min,/);
    expect(button).toMatch(/minHeight: BUTTON_MIN_HEIGHT\[size\]/);
    expect(tokens.target.min).toBe(44);
  });

  it('Review uses quiet buttons (44 pt) for Got it, Close, Undo, the view toggle, edit and Keep private', () => {
    const review = read('app/review.tsx');
    expect(review).not.toMatch(/variant="ghost"/);
    expect(review).toMatch(/label=\{r\.firstNote\.dismissButton\}/);
    expect(review).toMatch(/variant="quiet" fullWidth onPress=\{\(\) => save\(false\)\}/);
  });

  it('while editing, the footer is one primary Done, so the only way out is a 56 pt button', () => {
    expect(read('app/review.tsx')).toMatch(/editing \? \(\s*<Button size="lg" fullWidth label=\{copy\.common\.doneButton\}/);
  });

  it('the tidy mark is at least 24 pt wide and reaches 44 pt with hitSlop', () => {
    const t = read('components/capture/transcript.tsx');
    expect(Number(t.match(/const MARK_W = (\d+)/)![1])).toBeGreaterThanOrEqual(24);
    expect(t).toMatch(/hitSlop=\{\{ left: 8, right: 8, top: v, bottom: v \}\}/);
    expect(t).toMatch(/\(44 - h\) \/ 2/);
    expect(t).toMatch(/backgroundColor: c\.accentSoft/); // a visible wash, not a dotted run
  });

  it('trust copy on Review is never below the subhead step (16 pt), and never caption or footnote', () => {
    expect(TRUST_COPY_MIN_PT).toBe(16);
    const review = code(read('app/review.tsx'));
    for (const key of ['r.trustLine', 'r.firstNote.body', 'r.destination.privateHelp']) {
      const tag = review.match(new RegExp(`(<Text[^>]*>)\\s*\\{${key.replace(/\./g, '\\.')}\\}\\s*</Text>`));
      expect(tag, key).not.toBeNull();
      expect(tag![1], key).toMatch(/variant="subhead"/);
    }
    expect(review).not.toMatch(/text-(xs|sm)\b/);
  });

  it('at accessibility sizes the footer scrolls with the letter; otherwise it is pinned, and smaller than before', () => {
    expect(footerPlacement(false)).toBe('pinned');
    expect(footerPlacement(true)).toBe('inline');
    // 56 + 56 + gaps + 34 inset was about 164 pt; one primary and one quiet is under 130 pt before the inset.
    expect(pinnedFooterHeight()).toBeLessThan(130);
    const review = read('app/review.tsx');
    expect(review).toMatch(/\{inlineFooter \? footer : null\}/);
    expect(review).toMatch(/\{!inlineFooter && footer\}/);
  });

  it('the Review heading and letter text use ramp variants, so line height scales with the text', () => {
    const review = code(read('app/review.tsx'));
    expect(review).toMatch(/<Text variant="title1" asHeading>/);
    expect(review).not.toMatch(/leading-10/);
  });
});

describe('(5) selection state consistency', () => {
  it('no screen draws a selected choice as a solid accent button', () => {
    for (const f of ['app/review.tsx', 'app/settings/reminders.tsx', 'app/onboarding.tsx', 'components/child/add-child-form.tsx']) {
      const t = code(read(f));
      expect(t, f).not.toMatch(/\?\s*'(default|primary)'\s*:\s*'outline'/);
      expect(t, f).not.toMatch(/on \? 'border-primary bg-primary'/);
    }
  });

  it('Review Yes/No and the reminder evenings use the shared ChoiceGroup and Chip', () => {
    expect(read('app/review.tsx')).toMatch(/<ChoiceGroup[\s\S]*r\.voiceCheck\.question/);
    expect(read('app/settings/reminders.tsx')).toMatch(/<Chip[\s\S]*variant="filter"/);
  });

  it('a Chip that is one of a set or many reads as checked, the default as selected', () => {
    const chip = read('components/ui/choice-group.tsx');
    expect(chip).toMatch(/role === 'button' \? \{ selected \} : \{ checked: selected \}/);
  });

  it('the selected look is accentSoft fill + accent edge + a check, in both ChoiceGroup and Chip', () => {
    const t = read('components/ui/choice-group.tsx');
    expect((t.match(/checked \? 'bg-secondary' : 'bg-card'/g) ?? []).length).toBe(1);
    expect(t).toMatch(/selected \? 'bg-secondary' : 'bg-card'/);
    expect((t.match(/tokens\.stroke\.selected/g) ?? []).length).toBeGreaterThanOrEqual(2);
    expect((t.match(/CheckIcon/g) ?? []).length).toBeGreaterThanOrEqual(4);
  });
});
