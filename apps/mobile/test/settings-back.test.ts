/**
 * Back from Settings (TestFlight build 1: "No cross or back button in settings"). Settings is a push of the root
 * stack (whose header is hidden) and is a stack of its own, so its first screen has no native back; the Settings
 * layout draws the navigation library's HeaderBackButton there. Node cannot load React Native, so the layout's use of
 * the rule is checked in its source, as transitions.test.ts does for the route table.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { en } from '@scribe/content';
import { ROOT_ROUTE_CONTEXT, needsOuterBack, outerBackLabel } from '../src/lib/navigation.logic';
import { ROUTES } from '../src/lib/transitions.logic';

const SRC = join(__dirname, '..', 'src');
const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');
const TITLES = { index: 'Tonight', book: 'Book', family: 'Family' };

describe('needsOuterBack: only a nested stack first screen, only when there is somewhere to go', () => {
  it('the first screen gets the back when the root stack can go back', () => {
    expect(needsOuterBack(0, true)).toBe(true);
  });
  it('a later screen keeps the native back to the screen before it', () => {
    expect(needsOuterBack(1, true)).toBe(false);
    expect(needsOuterBack(3, true)).toBe(false);
  });
  it('nothing to go back to (a cold deep link): no button that does nothing', () => {
    expect(needsOuterBack(0, false)).toBe(false);
  });
});

describe('outerBackLabel: the title of the screen it goes back to, as iOS writes it', () => {
  it('from the Book tab (the gear), "Book"', () => {
    expect(outerBackLabel({ name: '(tabs)', state: { index: 1, routes: [{ name: 'index' }, { name: 'book' }, { name: 'family' }] } }, TITLES, 'Back')).toBe('Book');
  });
  it('tabs with no state yet show the first tab', () => {
    expect(outerBackLabel({ name: '(tabs)' }, TITLES, 'Back')).toBe('Tonight');
  });
  it('anywhere else, or nothing before it, "Back"', () => {
    expect(outerBackLabel({ name: 'letter/[id]' }, TITLES, 'Back')).toBe('Back');
    expect(outerBackLabel(undefined, TITLES, 'Back')).toBe('Back');
    expect(outerBackLabel({ name: '(tabs)', state: { index: 0, routes: [{ name: 'unknown' }] } }, TITLES, 'Back')).toBe('Back');
  });
  it('the fallback is the shared Back word from packages/content', () => {
    expect(en.common.backButton).toBe('Back');
  });
});

describe('Settings home has a native back affordance', () => {
  const layout = read('app/settings/_layout.tsx');
  const root = read('app/_layout.tsx');

  it('Settings is a push (not a modal) of a root stack whose own header is hidden, so the inner stack must draw the back', () => {
    expect(ROOT_ROUTE_CONTEXT.settings).toBe('push');
    expect(ROUTES.settings).toEqual({ rows: [9], move: 'push' });
    expect(root).toMatch(/<Stack screenOptions=\{\{ headerShown: false/);
    expect(root).toMatch(/<Stack\.Screen name="settings" options=\{routes\.settings\} \/>/);
  });

  it('the Settings stack shows its header and puts the back in the left slot of every screen, decided per screen', () => {
    expect(layout).toMatch(/screenOptions=\{\(\{ navigation, route \}\) => \(\{/);
    expect(layout).toMatch(/headerShown: true/);
    expect(layout).toMatch(/headerLeft: outerBack\(navigation, route\.key, c\.accent\)/);
  });

  it('the back is the navigation library HeaderBackButton (chevron, label, VoiceOver "<title>, back"), in the accent tint, popping the push', () => {
    expect(layout).toMatch(/import \{ HeaderBackButton \} from 'expo-router\/react-navigation'/);
    expect(layout).toMatch(/needsOuterBack\(index, parent\.canGoBack\(\)\)/);
    expect(layout).toMatch(/<HeaderBackButton label=\{label\} tintColor=\{tint\} onPress=\{\(\) => router\.back\(\)\}/);
    expect(layout).toMatch(/outerBackLabel\(p\.routes\[p\.index - 1\], TAB_TITLES, copy\.common\.backButton\)/);
    // No hand-drawn back (Never: hand-roll what a listed library provides), and no "Close": it is a push, not a modal.
    expect(layout).not.toMatch(/[{,] BackButton\b|<BackButton|ModalHeader|closeLabel/);
  });

  it('Settings home itself stays a screen of this stack with its title', () => {
    expect(layout).toMatch(/<Stack\.Screen name="index" options=\{\{ title: copy\.settings\.title \}\} \/>/);
  });
});
