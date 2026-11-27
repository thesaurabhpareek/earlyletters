import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMarkup } from '../helpers/render-markup';
import { harness } from './harness';

/**
 * [NS-14] [BL-941] Home with the Book's child switcher, rendered (static markup through react-native-web; BL-278
 * harness). The real Tonight screen and the real ChildSwitcher are drawn; only the store, the router, the lamp, the
 * billing and capture seams are stood in. Proves: the switcher is there with two visible books and absent with one,
 * it sits above the dateline, its whole label is in the markup with no line limit at AX5, and the name it is given.
 * It does NOT prove layout on a phone (overlap, wrapping, 44 pt), VoiceOver speech or focus order: NS-14-R5 stays a
 * device row (docs/qa/DEVICE_TEST_PLAN.md). Fictional family Asha only.
 */
const env = vi.hoisted(() => ({
  children: [] as { id: string; name: string; birthday: string | null; dueDate: string | null; signsAs: string; remindersOn: boolean; familyCanRead: boolean }[],
  active: 'asha',
}));

const book = (id: string, name: string, birthday: string) => ({ id, name, birthday, dueDate: null, signsAs: 'Mama', remindersOn: true, familyCanRead: false });
const ASHA = book('asha', 'Asha', '2026-04-10');
const NILA = book('nila', 'Nila', '2024-06-02');

vi.mock('@/lib/store', () => {
  const active = () => env.children.find((c) => c.id === env.active) ?? env.children[0] ?? null;
  return {
    todayISO: () => '2026-11-27',
    listChildren: () => env.children,
    getActiveChild: active,
    getActiveChildId: () => active()?.id ?? null,
    setActiveChildId: (id: string) => void (env.active = id),
    subscribe: () => () => {},
    getFamily: () => {
      const c = active();
      return c ? { childName: c.name, childBirthday: c.birthday, signsAs: c.signsAs, childDueDate: c.dueDate } : null;
    },
    listDrafts: () => [],
    readTonight: () => ({ window: [], markToday: false, recentKeys: [], lastOccurredOn: null }),
    deleteEntry: () => true,
    getEntry: () => null,
  };
});
vi.mock('expo-router', () => ({ Redirect: () => null, router: { push: () => {} }, useFocusEffect: () => {} }));
vi.mock('phosphor-react-native/src/icons/ArrowsClockwise', () => ({ ArrowsClockwiseIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/Microphone', () => ({ MicrophoneIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/PencilSimple', () => ({ PencilSimpleIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/CaretDown', () => ({ CaretDownIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/Plus', () => ({ PlusIcon: () => null }));
// The sheet is a native bottom sheet and stays closed until a tap; only the row that opens it is under test.
vi.mock('@/components/ui/sheet', () => ({ Sheet: ({ open, children }: any) => (open ? children : null) }));
vi.mock('@/components/ui/lamp', () => ({ Lamp: () => null }));
vi.mock('@/components/ui/safe-area-view', async () => {
  const { View } = await import('react-native-web');
  return { SafeAreaView: ({ edges: _e, ...p }: any) => React.createElement(View, p) };
});
vi.mock('@/components/motion/card-transition', () => ({ CardSource: ({ children }: any) => children, useHiddenBehindCardPage: () => ({}) }));
vi.mock('@/components/tonight/draft-card', () => ({ DraftCard: () => null }));
vi.mock('@/components/tonight/held-row', () => ({ HeldRow: () => null }));
vi.mock('@/components/tonight/plus-line', () => ({ PlusLine: () => null }));
vi.mock('@/components/tonight/quiet-day-inline', () => ({ QuietDayInline: () => null }));
vi.mock('@/components/tonight/resurfaced-card', () => ({ ResurfacedCard: () => null }));
vi.mock('@/components/photos/photo-start', () => ({ PhotoStartButton: () => null }));
vi.mock('@/lib/photos/use-photo-start', () => ({ usePhotoStart: () => ({ show: false, start: () => {}, failed: false }) }));
vi.mock('@/lib/capture/start-capture', () => ({ startCapture: () => ({ kind: 'none' }) }));
vi.mock('@/lib/billing', () => ({ freeLettersAllowance: () => 10, lettersKeptNow: async () => 0, PLUS_ALPHA: false, usePlan: () => ({ view: null }) }));
vi.mock('@/lib/motion', () => ({ STANDARD_EASING: undefined, useMotion: () => ({ reduced: true, enter: () => undefined, leave: () => undefined }) }));
vi.mock('@/lib/analytics/track', () => ({ track: () => {}, ordinalOf: () => 'first' }));

const { default: Tonight } = await import('@/app/(tabs)/index');

const AX5 = 3.12; // the Dynamic Type accessibility-5 scale the design tokens use (test/component/ax5-truncation-labels)
const NO_LINE_LIMIT = /r-textOverflow|r-whiteSpace|r-WebkitLineClamp|line-clamp|-webkit-box/;
const SWITCHER = 'data-testid="child.switcher"';
// The dateline is drawn in caps, so its words are in the markup as typed: "Asha · 7 months".
const DATELINE = 'Asha · 7 months';

beforeEach(() => {
  harness.fontScale = 1;
  env.active = 'asha';
});

const at = (html: string, needle: string) => {
  const i = html.indexOf(needle);
  expect(i, needle).toBeGreaterThanOrEqual(0);
  return i;
};

describe('[NS-14] the child switcher on Home, rendered', () => {
  it('[NS-14-R1] two books show the switcher: "For Asha" above the dateline', () => {
    env.children = [ASHA, NILA];
    const html = renderMarkup(<Tonight />);
    expect(html).toContain(SWITCHER);
    expect(html).toContain('>For Asha<');
    expect(at(html, SWITCHER)).toBeLessThan(at(html, DATELINE));
  });

  it('[NS-14-R1] the switcher is a button named by its visible words, so Voice Control can say "For Asha"', () => {
    // react-native-web drops accessibilityValue and accessibilityHint from the markup; the value ("Asha's book") is
    // proved on the source in test/ns14-home-child-switcher.test.ts.
    env.children = [ASHA, NILA];
    const html = renderMarkup(<Tonight />);
    const row = html.slice(html.lastIndexOf('<', at(html, SWITCHER)), at(html, '>For Asha<'));
    expect(row).toContain('aria-label="For Asha"');
    expect(row).toContain('role="button"');
  });

  it('[NS-14-R1] the switcher follows the one selection: with Nila chosen, Home says "For Nila"', () => {
    env.children = [ASHA, NILA];
    env.active = 'nila';
    const html = renderMarkup(<Tonight />);
    expect(html).toContain('>For Nila<');
    expect(html).not.toContain('>For Asha<');
  });

  it('[NS-14-R2] one book shows none: no switcher, no words of it, and nothing drawn before the dateline', () => {
    env.children = [ASHA];
    const html = renderMarkup(<Tonight />);
    expect(html).not.toContain(SWITCHER);
    expect(html).not.toContain('For Asha');
    // The dateline is the first words on Home, as before: the switcher leaves no empty row behind.
    const before = html.slice(0, at(html, DATELINE));
    expect(before.replace(/<[^>]*>/g, '')).toBe('');
  });

  it('[NS-14-R5] Home holds at AX5 with a switcher: the whole label, no line limit, and the switcher before the dateline (structure only)', () => {
    harness.fontScale = AX5;
    const long = book('long', 'Ashalakshmi Meenakshisundaram', '2026-04-10');
    env.children = [long, NILA];
    env.active = 'long';
    const html = renderMarkup(<Tonight />);
    expect(html).toContain('>For Ashalakshmi Meenakshisundaram<');
    const row = html.slice(at(html, SWITCHER), at(html, 'Ashalakshmi Meenakshisundaram ·'));
    expect(row).not.toMatch(NO_LINE_LIMIT);
    expect(at(html, SWITCHER)).toBeLessThan(at(html, 'Ashalakshmi Meenakshisundaram ·'));
  });
});
