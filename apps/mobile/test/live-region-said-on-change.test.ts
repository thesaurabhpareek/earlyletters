/// <reference types="node" />
/**
 * [PER4-018, BL-1953] The last two files on the live-region baseline: the letter page and the shared state screens.
 * iOS VoiceOver ignores accessibilityLiveRegion, so each live change is said once with announce() through
 * useSaidOnChange (lib/said-on-change.ts): on the change, not on a later render, and not when the screen first opens
 * on it (a live region reads a change, not what is there when it is drawn). StateScreen says only a change of a state
 * already showing, because its callers say their own arrival (useArrival, open-deletion) and a second call would say
 * their titles twice; a caller that says its own in-place changes passes `callerSpeaks` (live-region-caller-speaks.test.ts).
 * Each test counts the words spoken, not only that announce() ran. The hook and StateScreenView are
 * run on the small stand-in for React's hooks, with native modules mocked; the letter page needs a phone to render, so
 * its three live regions are pinned in the source. Whether VoiceOver says it, and when, is a device check.
 * Fictional family "Asha" only.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => ({ spoken: [] as string[] }));
vi.mock('react', async () => (await import('./helpers/mini-react')).reactStandIn);
vi.mock('react-native', () => ({ View: 'View', Platform: { OS: 'ios' } }));
vi.mock('react-native-reanimated', () => {
  const chain: any = new Proxy(() => chain, { get: () => chain });
  return { default: { View: 'Animated.View' }, FadeIn: chain, ReduceMotion: { Never: 'never' } };
});
vi.mock('expo-router', () => ({ useIsFocused: () => true }));
vi.mock('@/components/motion/breathe', () => ({ Breathe: 'Breathe' }));
vi.mock('@/components/ui/button', () => ({ Button: 'Button' }));
vi.mock('@/components/ui/card', () => ({ Card: 'Card' }));
vi.mock('@/components/ui/line-art', () => ({ LineArt: 'LineArt' }));
vi.mock('@/components/ui/pinned-action', () => ({ PinnedActionLayout: 'PinnedActionLayout' }));
vi.mock('@/components/ui/safe-area-view', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('@/components/ui/text', () => ({ Text: 'Text' }));
vi.mock('@/lib/motion', () => ({ STANDARD_EASING: 'standard' }));
vi.mock('@/lib/a11y', () => ({
  announce: (message: string) => void h.spoken.push(message),
  useTheme: () => ({ c: { textMuted: '#666', accentSoft: '#eee' } }),
}));

import { StateScreenView, type StateScreenProps } from '../src/components/ui/state-screen';
import { lineToSay, useSaidOnChange } from '../src/lib/said-on-change';
import { renderHook } from './helpers/mini-react';

/** Source without comments, so a pin never passes on a comment that names the thing. */
const code = (rel: string) =>
  readFileSync(join(__dirname, '..', 'src', rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

beforeEach(() => {
  h.spoken.length = 0;
});

describe('[PER4-018] useSaidOnChange says a live line once, when it changes', () => {
  const say = (line: string) => void h.spoken.push(line);

  it('[PER4-018] the line the screen opens on is not said; a new line is said once; a re-render says nothing', () => {
    let line: string | null = 'Getting ready when you\'re on Wi-Fi.';
    const r = renderHook(() => useSaidOnChange(line, say));
    r.rerender();
    expect(h.spoken).toEqual([]);
    line = 'Downloading';
    r.rerender();
    r.rerender();
    expect(h.spoken).toEqual(['Downloading']);
  });

  it('[PER4-018] a line that shows from nothing is said; one that goes and comes back is said again', () => {
    let line: string | null = null;
    const r = renderHook(() => useSaidOnChange(line, say));
    line = "That didn't save. Your words are still here.";
    r.rerender();
    line = null;
    r.rerender();
    line = "That didn't save. Your words are still here.";
    r.rerender();
    expect(h.spoken).toEqual(["That didn't save. Your words are still here.", "That didn't save. Your words are still here."]);
  });

  it('[PER4-018] fromNothing false: only a change of a line already showing is said', () => {
    expect(lineToSay(null, 'A', { fromNothing: false })).toBeNull();
    expect(lineToSay('A', 'B', { fromNothing: false })).toBe('B');
    expect(lineToSay('A', 'A')).toBeNull();
    expect(lineToSay('A', null)).toBeNull();
    expect(lineToSay(null, 'A')).toBe('A');
  });
});

describe('[PER4-018] a state screen says an in-place change of a polite state once, and not its arrival', () => {
  const render = (first: StateScreenProps) => {
    let props = first;
    const r = renderHook(() => StateScreenView(props));
    return { next: (p: StateScreenProps) => ((props = p), r.rerender()), again: () => r.rerender() };
  };

  it('[PER4-018] loading that turns into an error in place is said once: heading and sentence', () => {
    const s = render({ kind: 'loading', title: "Opening Asha's book" });
    expect(h.spoken).toEqual([]); // the arrival is the caller's to say
    s.next({ kind: 'error', title: 'This is taking a while', body: 'Try again in a moment.' });
    s.again();
    expect(h.spoken).toEqual(['This is taking a while. Try again in a moment.']);
  });

  it('[PER4-018] a static state that becomes an error says nothing here (the screen says its own failure, as open-deletion does)', () => {
    const s = render({ kind: 'empty', title: 'Deletion scheduled', body: "Asha's book is kept until then." });
    s.next({ kind: 'error', title: 'Deletion scheduled', body: "Asha's book is kept until then.\n\nThat did not go through." });
    s.again();
    expect(h.spoken).toEqual([]);
  });

  it('[PER4-018] an empty or not-found state never speaks, whatever changes', () => {
    const s = render({ kind: 'empty', title: 'Nothing here yet' });
    s.next({ kind: 'notFound', title: 'This letter is not here' });
    s.next({ kind: 'empty', title: 'Nothing on the shelf' });
    expect(h.spoken).toEqual([]);
  });

  it('[PER4-018] InlineState is wired the same way, with its spoken name when it has one; `callerSpeaks` silences both', () => {
    const src = code('components/ui/state-screen.tsx');
    expect(src).toContain("useSaidOnChange(callerSpeaks ? null : stateSpoken(kind, o), (line) => announce(line), { fromNothing: false })");
    expect(src).toContain('useStateSaid(kind, { title, body }, callerSpeaks);');
    expect(src).toContain('useStateSaid(kind, { title, body, label: accessibilityLabel }, callerSpeaks);');
    expect(code('components/ui/state-screen.logic.ts')).not.toMatch(/accessibilityLiveRegion/);
  });
});

describe('[PER4-018] the letter page says each of its three live lines once: the words the region shows, or for a moving download its phase', () => {
  const page = code('app/letter/[id].tsx');

  // The region shows "Getting ready, n%" while a download moves; VoiceOver is told the phase once ("Downloading", the
  // line below 1%), as Settings > Storage does, and not each percent.
  it('[PER4-018] the words card says its reason as a phase, not each percent', () => {
    expect(page).toContain('const reason = reasonAt(progress);');
    expect(page).toContain('useSaidOnChange(reasonAt(progress === null ? null : 0), (line) => announce(line));');
    expect(page).toMatch(/accessibilityLiveRegion="polite" testID="letter\.waiting">\s*\{reason && <Text variant="footnote">\{reason\}<\/Text>\}/);
  });

  it('[PER4-018] the refusal line in "Words for this recording" is said when it shows', () => {
    expect(page).toContain('useSaidOnChange(refused ? copy.review.saveFailed : null, (line) => announce(line));');
    expect(page).toMatch(/\{refused \? \(\s*<Text variant="footnote" accessibilityLiveRegion="polite" testID="letter\.writeWords\.refused">\s*\{copy\.review\.saveFailed\}/);
  });

  it('[PER4-018] "Words are ready" is said by the page when the card appears, from the same condition that draws it', () => {
    expect(page).toContain("const readItBack = editable && words === 'words' && (unread || !!entry.wordsUnreviewed);");
    expect(page).toContain('useSaidOnChange(readItBack ? wordsCopy.waiting.readyBody : null, (line) => announce(line));');
    // The card is drawn on the same three terms (spacing and line breaks free, so a formatter pass keeps this green).
    expect(page).toMatch(/\{\s*editable\s*&&\s*words\s*===\s*'words'\s*&&\s*\(\s*unread\s*\|\|\s*(?:!!\s*)?entry\.wordsUnreviewed\s*\)\s*&&\s*\(\s*<ReadItBackCard\b/);
    expect(page.match(/<ReadItBackCard\b/g)).toHaveLength(1);
    expect(page).toMatch(/testID="letter\.readItBack">\s*<Text variant="headline">\{w\.readyBody\}<\/Text>/);
    // One call each: the cards themselves say nothing, so no line is said twice.
    expect(page.match(/useSaidOnChange\(/g)).toHaveLength(3);
    expect(page.match(/\bannounce\(/g)).toHaveLength(3);
  });
});
