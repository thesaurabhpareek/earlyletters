/**
 * The role props every state carries (STATE_SPEC), now built in state-screen.tsx beside the announce() that says an
 * in-place change on iOS (PER4-018, BL-1953). Rendered to markup: loading and error are polite live regions (never
 * assertive), loading is busy, empty and not found are static. Fictional family "Asha" only.
 */
import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-router', () => ({ useIsFocused: () => true }));
vi.mock('@/lib/motion', () => ({ STANDARD_EASING: 'standard' }));
vi.mock('@/components/motion/breathe', () => ({ Breathe: ({ children }: { children: unknown }) => children }));
vi.mock('@/components/ui/line-art', () => ({ LineArt: () => null }));
vi.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }) }));
vi.mock('@/components/ui/safe-area-view', async () => ({ SafeAreaView: (await import('react-native-web')).View }));

import { StateScreenView, stateA11y } from '@/components/ui/state-screen';
import type { StateKind } from '@/components/ui/state-screen.logic';
import { renderMarkup } from '../helpers/render-markup';

const KINDS: StateKind[] = ['empty', 'error', 'notFound', 'loading'];

describe('[PER4-018] state role props', () => {
  it('loading is a polite, busy live region; error is polite and not busy; empty and not found are static', () => {
    expect(stateA11y('loading')).toEqual({ accessibilityLiveRegion: 'polite', accessibilityState: { busy: true } });
    expect(stateA11y('error')).toEqual({ accessibilityLiveRegion: 'polite' });
    expect(stateA11y('empty')).toEqual({});
    expect(stateA11y('notFound')).toEqual({});
    for (const k of KINDS) expect(JSON.stringify(stateA11y(k))).not.toContain('assertive');
  });

  it('the rendered error state carries the polite region; the empty state carries none', () => {
    expect(renderMarkup(<StateScreenView kind="error" title="This is taking a while" body="Try again in a moment." />)).toContain('aria-live="polite"');
    expect(renderMarkup(<StateScreenView kind="empty" title="Nothing here yet" body="Asha has no letters yet." />)).not.toContain('aria-live');
  });
});
