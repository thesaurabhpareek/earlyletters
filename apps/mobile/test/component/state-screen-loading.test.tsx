/**
 * BL-494 point 3: StateScreen's primary action takes `loading`. The real StateScreenView and the real Button are
 * rendered to markup, so the busy state is read where VoiceOver and the web get it (aria-busy on the button; Button's
 * own logic keeps it busy and not disabled, and ignores a second press: test/button-busy.test.ts). A screen whose press
 * is on its way keeps its heading and sentence, and its kind, instead of turning into the loading state.
 * Fictional family "Asha" only.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-router', () => ({ useIsFocused: () => true }));
// The picture and its breath are not under test here: stood in so the block draws without animation curves or SVG.
vi.mock('@/lib/motion', () => ({ STANDARD_EASING: 'standard' }));
vi.mock('@/components/motion/breathe', () => ({ Breathe: ({ children }: { children: unknown }) => children }));
vi.mock('@/components/ui/line-art', () => ({ LineArt: () => null }));
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }) }));
vi.mock('@/components/ui/safe-area-view', async () => ({ SafeAreaView: (await import('react-native-web')).View }));

import { StateScreenView } from '@/components/ui/state-screen';
import { renderMarkup } from '../helpers/render-markup';

const noop = () => undefined;
/** The opening tag of the element that carries this testID. */
const tagOf = (html: string, testID: string) => html.match(new RegExp(`<[^>]*data-testid="${testID}"[^>]*>`))?.[0] ?? '';

describe('[BL-494 point 3] a primary on its way is busy, and the state keeps its words', () => {
  it('loading on the primary: the button is busy and the heading, sentence and quiet option stay as they were', () => {
    const html = renderMarkup(
      <StateScreenView
        kind="empty"
        title="Deletion scheduled"
        body="Asha's book is kept until then."
        primary={{ label: 'Cancel deletion', onPress: noop, testID: 's.primary', loading: true }}
        quiet={[{ label: 'Sign out of this phone', onPress: noop, testID: 's.quiet' }]}
      />,
    );
    expect(tagOf(html, 's.primary')).toContain('aria-busy="true"');
    // Busy, not dimmed: VoiceOver hears "busy", and the button is not announced as disabled.
    expect(tagOf(html, 's.primary')).not.toContain('aria-disabled="true"');
    expect(html).toContain('Deletion scheduled');
    expect(html).toContain('Asha&#x27;s book is kept until then.');
    expect(html).toContain('Cancel deletion');
    // The state is still the empty one: not the loading region's busy block.
    expect(html.match(/aria-busy="true"/g)).toHaveLength(1);
    expect(tagOf(html, 's.quiet')).not.toContain('aria-busy');
  });

  it('without loading the primary is a plain button', () => {
    const html = renderMarkup(<StateScreenView kind="empty" title="Deletion scheduled" primary={{ label: 'Cancel deletion', onPress: noop, testID: 's.primary' }} />);
    expect(tagOf(html, 's.primary')).toMatch(/role="button"|<button/);
    expect(html).not.toContain('aria-busy');
  });

  it('quiet options ignore loading (only the primary is drawn busy)', () => {
    const html = renderMarkup(
      <StateScreenView kind="error" title="Deletion scheduled" primary={{ label: 'Try again', onPress: noop }} quiet={[{ label: 'Sign out of this phone', onPress: noop, testID: 's.quiet', loading: true }]} />,
    );
    expect(tagOf(html, 's.quiet')).not.toContain('aria-busy');
  });
});
