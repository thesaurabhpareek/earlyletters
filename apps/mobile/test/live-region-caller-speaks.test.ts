/**
 * [PER4-018, BL-1953] A state block whose caller says its own changes says none of its own (`callerSpeaks`), so
 * VoiceOver hears each line once. Each test runs the caller's real speech beside the real StateScreen or InlineState on
 * the small stand-in for React's hooks (a function component in the tree is called in place, so its hooks run in
 * order), feeds the sequence a parent meets, and counts the lines said:
 *  - Review's words card: the part counter moving says nothing, the slow line once, writing to failed (loading to
 *    error) once, Try again once (use-words-said.ts beside InlineState, with the card's real words from wordsCard);
 *  - the outage screen: offline turning into the outage in place says the new title once (useArrival), and a body
 *    that changes alone says nothing;
 *  - "Opening your book": the heading on arrival, then the heading and "Your letters are coming across." once when
 *    the letters are known to be on their way (StateScreen's own in-place line; nothing else says it).
 * The words are the app's own copy; whether VoiceOver says them, and when, is a device check. Fictional family "Asha".
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ spoken: [] as string[] }));
vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('react-native', () => ({ View: 'View', Platform: { OS: 'ios' } }));
vi.mock('react-native-reanimated', () => {
  const chain: any = new Proxy(() => chain, { get: () => chain });
  return { default: { View: 'Animated.View' }, FadeIn: chain, ReduceMotion: { Never: 'never' } };
});
vi.mock('expo-router', () => ({ useIsFocused: () => true, router: { push: () => undefined } }));
vi.mock('phosphor-react-native/src/icons/CloudSlash', () => ({ CloudSlashIcon: 'CloudSlashIcon' }));
vi.mock('phosphor-react-native/src/icons/WifiSlash', () => ({ WifiSlashIcon: 'WifiSlashIcon' }));
vi.mock('@/components/motion/breathe', () => ({ Breathe: 'Breathe' }));
vi.mock('@/components/ui/button', () => ({ Button: 'Button' }));
vi.mock('@/components/ui/card', () => ({ Card: 'Card' }));
vi.mock('@/components/ui/line-art', () => ({ LineArt: 'LineArt' }));
vi.mock('@/components/ui/pinned-action', () => ({ PinnedActionLayout: 'PinnedActionLayout' }));
vi.mock('@/components/ui/safe-area-view', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('@/components/ui/text', () => ({ Text: 'Text' }));
vi.mock('@/lib/motion', () => ({ STANDARD_EASING: 'standard' }));
vi.mock('@/lib/auth/ui', () => ({ AppleButton: 'AppleButton' }));
vi.mock('@/lib/auth/revocation-wait-line', () => ({ RevocationWaitLine: 'RevocationWaitLine' }));
vi.mock('@/lib/auth/session-provider', () => ({ useAuth: () => ({ state: { kind: 'signedIn' } }) }));
vi.mock('@/lib/capabilities', () => ({ capabilities: { accountDeletion: false } }));
vi.mock('@/lib/first-run/held-screen.logic', () => ({ heldScreenModel: () => ({}) }));
vi.mock('@/lib/a11y', () => ({
  announce: (message: string) => void h.spoken.push(message),
  useFocusOnMount: () => undefined,
  useTheme: () => ({ c: { textMuted: '#666', accentSoft: '#eee' } }),
}));

import { tokens } from '@scribe/design-tokens';
import { useWordsSaid } from '../src/components/capture/use-words-said';
import { wordsCard, type WordsCard, type WordsInput } from '../src/components/capture/words-state.logic';
import { OpeningBookScreen } from '../src/components/onboarding/new-phone-screens';
import { OutageScreen } from '../src/components/onboarding/outage-screen';
import { InlineState } from '../src/components/ui/state-screen';
import { authCopy } from '../src/lib/auth/copy';
import { copy, fill } from '../src/lib/copy';
import { wordsCopy } from '@scribe/content';
import { renderHook } from './helpers/mini-react';

/** Call every function component in the tree in place, so the hooks of the caller and of the block below it all run. */
function mount(node: unknown): void {
  if (Array.isArray(node)) return node.forEach(mount);
  if (!node || typeof node !== 'object' || !('type' in node)) return;
  const el = node as { type: unknown; props: { children?: unknown } };
  if (typeof el.type === 'function') mount((el.type as (p: unknown) => unknown)(el.props));
  else mount(el.props?.children);
}

/** Source without comments, so a pin never passes on a comment that names the thing. */
const code = (rel: string) =>
  readFileSync(join(__dirname, '..', 'src', rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

beforeEach(() => {
  h.spoken.length = 0;
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe("[PER4-018] Review's words card is said by Review alone: each line once, and never each part", () => {
  const base: WordsInput = {
    emptyFile: false,
    job: null,
    download: { ask: false, progress: null, hold: null, lowSpace: false, size: '', mb: 0, neededSize: '' },
    hints: { long: false, later: false },
    playing: false,
  };
  const running = (done: number, later = false): WordsInput => ({ ...base, job: { phase: 'running', progress: { done, total: 3 } }, hints: { long: later, later } });
  const failed: WordsInput = { ...base, job: { phase: 'failed', failure: 'transcribe_failed', progress: null } };

  /** WordsStatus as review.tsx draws it: its own speech, then the card as one InlineState with `callerSpeaks`. */
  const words = (first: WordsInput) => {
    let card: WordsCard = wordsCard(first);
    const r = renderHook(() => {
      useWordsSaid(card);
      mount(InlineState({ callerSpeaks: true, kind: card.kind, art: card.art, still: card.still, title: card.title, body: card.body }));
    });
    return (next: WordsInput) => {
      card = wordsCard(next);
      r.rerender();
    };
  };

  it('[PER4-018] the part counter moving says nothing; the slow line, the failure and Try again are each said once', () => {
    const next = words(running(0));
    expect(h.spoken).toEqual([]);
    vi.advanceTimersByTime(tokens.motion.route.dissolveMs);
    const part1 = fill(wordsCopy.listening, { n: 1, count: 3 });
    expect(h.spoken).toEqual([part1]); // once Review has dissolved in
    next(running(1)); // "Part 2 of 3"
    next(running(2)); // "Part 3 of 3"
    expect(h.spoken).toEqual([part1]);
    next(running(2, true)); // no progress for a while: the longer-than-usual line
    next(running(2, true));
    next(failed); // loading turns into an error in place
    next(running(0)); // Try again
    expect(h.spoken).toEqual([part1, copy.review.waitingSlow, copy.errors.transcriptionFailed.title, part1]);
    expect(h.spoken.join('\n')).not.toContain('Part 2 of 3');
    expect(h.spoken.join('\n')).not.toContain(copy.review.waitingBody);
  });

  it('[PER4-018] review.tsx draws the card with `callerSpeaks` and says it through useWordsSaid', () => {
    const review = code('app/review.tsx');
    expect(review).toMatch(/<InlineState\s+callerSpeaks\s/);
    expect(review).toContain('useWordsSaid(card);');
    expect(review.match(/<InlineState\b/g)).toHaveLength(1);
  });
});

describe('[PER4-018] the outage screen says its own change in place, and StateScreen adds nothing', () => {
  const props = { onTryAgain: () => undefined, onLocalStart: () => undefined };

  it('[PER4-018] offline turning into the outage says the new title once; a body that changes alone says nothing', () => {
    let p: Parameters<typeof OutageScreen>[0] = { ...props, variant: 'offline', localStartOffered: false };
    const r = renderHook(() => mount(OutageScreen(p)));
    expect(h.spoken).toEqual([authCopy.offline.title]); // the arrival (useArrival)
    p = { ...p, variant: 'outage' };
    r.rerender();
    r.rerender();
    p = { ...p, localStartOffered: true }; // the local start's note joins the body
    r.rerender();
    expect(h.spoken).toEqual([authCopy.offline.title, authCopy.outage.title]);
  });

  it('[PER4-018] the open deletion, which says its own cancel and failure, also passes `callerSpeaks`', () => {
    expect(code('components/settings/open-deletion.tsx')).toMatch(/<StateScreen\s+callerSpeaks\s/);
  });
});

describe('[PER4-018] "Opening your book" says its sentence once when the letters are known to be coming', () => {
  it('[PER4-018] the heading on arrival, then heading and sentence once, and nothing on a re-render', () => {
    let coming = false;
    const r = renderHook(() => mount(OpeningBookScreen({ lettersComing: coming })));
    expect(h.spoken).toEqual([authCopy.newPhone.loading]);
    coming = true;
    r.rerender();
    r.rerender();
    const t = authCopy.newPhone.loading;
    const sentence = /[.!?]$/.test(t) ? `${t} ${authCopy.newPhone.loadingBody}` : `${t}. ${authCopy.newPhone.loadingBody}`;
    expect(h.spoken).toEqual([t, sentence]);
  });
});
