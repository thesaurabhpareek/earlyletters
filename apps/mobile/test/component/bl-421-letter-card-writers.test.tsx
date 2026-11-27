import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderMarkup } from '../helpers/render-markup';
import { harness } from './harness';

/**
 * [BL-421] The Book's letter card, rendered (static markup through react-native-web; BL-278 harness), in a book one
 * person writes and in a book two people write (J09-03). The real LetterCard and its real writer hook are drawn; only
 * the store's count of writers and its change bus are stood in. Proves: a one-writer book draws no "From Mama" under
 * the words, a two-writer book does, VoiceOver's label opens with the writer either way, and a voice letter keeps the
 * waveform marker, never a play button. It does NOT prove layout on a phone or VoiceOver speech: J09-03 stays a
 * device row. Fictional family Asha only: Mama and Papa.
 */
const env = vi.hoisted(() => ({ writers: new Map<string, number>(), counts: 0, listeners: [] as (() => void)[] }));

vi.mock('@/lib/store', () => ({
  countBookWriters: (childId: string) => {
    env.counts++;
    return env.writers.get(childId) ?? 0;
  },
  subscribeTo: (_tables: unknown, fn: () => void) => {
    env.listeners.push(fn);
    return () => void (env.listeners = env.listeners.filter((l) => l !== fn));
  },
  getSetting: () => null,
}));
// The card's page transition and the photo lens label are their own components' business; the card's words are not.
vi.mock('@/components/motion/card-transition', () => ({ CardText: ({ children }: any) => children }));
vi.mock('phosphor-react-native/src/icons/LockSimple', () => ({ LockSimpleIcon: () => null }));
vi.mock('phosphor-react-native/src/icons/Microphone', () => ({ MicrophoneIcon: () => null }));
// The excerpt's fade is SVG drawn on a phone; here it is its words, which is all this test reads of it.
vi.mock('@/components/motion/excerpt-fade', async () => {
  const { Text } = await import('react-native-web');
  return { ExcerptFade: ({ text }: { text: string }) => React.createElement(Text, null, text) };
});
vi.mock('@/lib/motion', () => ({ layoutSpring: () => undefined }));
// The arrival wash animates on a phone; here it is a still, empty layer (setup.tsx's stand-in has no shared values).
vi.mock('react-native-reanimated', async () => {
  const RN = await import('react-native-web');
  const chain: any = new Proxy(() => chain, { get: () => chain });
  return {
    default: { View: RN.View, Text: RN.Text },
    FadeOut: chain,
    ReduceMotion: { Never: 'never' },
    useSharedValue: (v: number) => ({ value: v }),
    useAnimatedStyle: (fn: () => object) => fn(),
    withTiming: (v: number) => v,
  };
});
// The waveform glyph is native SVG: stood in by a marked element so the markup shows which glyph the card drew.
vi.mock('phosphor-react-native/src/icons/Waveform', () => ({ WaveformIcon: () => React.createElement('i', { 'data-glyph': 'waveform' }) }));

const { LetterCard } = await import('@/components/book/letter-card');
const { resetBookWritersForTest } = await import('@/components/book/book-writers');

const ASHA = { id: 'child-asha', name: 'Asha', birthday: '2026-03-01', dueDate: null, signsAs: 'Mama', remindersOn: true, familyCanRead: false } as any;
const entry = (over: Record<string, unknown> = {}) =>
  ({
    id: '0199a5b0-0000-7000-8000-000000000001',
    kind: 'letter',
    occurredOn: '2026-10-14',
    capturedAt: '2026-10-14T08:30:00.000Z',
    captureMode: 'typed',
    editLevel: 'clean',
    promptKey: null,
    engineVersion: 3,
    rawTranscript: 'Asha laughed at the dog',
    machineEdits: [],
    finalText: 'Asha laughed at the dog',
    inBook: true,
    soundsLikeMe: null,
    childId: 'child-asha',
    authorSignsAs: 'Mama',
    audioUri: null,
    audioDurationMs: null,
    transcriptStatus: null,
    ...over,
  }) as any;

const card = (e = entry()) => renderMarkup(<LetterCard entry={e} child={ASHA} onPress={() => {}} />);
/** The visible signature: the italic line's text as its own element, not inside the card's aria-label. */
const drawsFromMama = (html: string) => />From Mama</.test(html);
const label = (html: string) => /aria-label="([^"]*)"/.exec(html)?.[1] ?? '';

beforeEach(() => {
  harness.fontScale = 1;
  env.writers.clear();
  env.counts = 0;
  resetBookWritersForTest();
  env.listeners = [];
});

describe('[BL-421] a book one person writes repeats no author name on its cards', () => {
  it('[BL-421] one writer: no "From Mama" under the words', () => {
    env.writers.set('child-asha', 1);
    expect(drawsFromMama(card())).toBe(false);
  });

  it('[BL-421] one writer: VoiceOver still hears who wrote it, first, in the existing signature line', () => {
    env.writers.set('child-asha', 1);
    expect(label(card())).toMatch(/^From Mama\. /);
  });

  it('[BL-421] a typed letter kept in a one-writer book draws no empty footer row under its words', () => {
    env.writers.set('child-asha', 1);
    // The card ends on the letter's words: no footer view after them (react-native-web drops class names, so read the end).
    expect(card()).toMatch(/>Asha laughed at the dog<\/div><\/button>$/);
  });
});

describe('[BL-421] a book two people write names the writer on every signed card', () => {
  it('[BL-421] two writers: "From Mama" is drawn, and VoiceOver hears it too', () => {
    env.writers.set('child-asha', 2);
    const html = card();
    expect(drawsFromMama(html)).toBe(true);
    expect(label(html)).toMatch(/^From Mama\. /);
  });

  it("[BL-421] the other parent's card says their name", () => {
    env.writers.set('child-asha', 2);
    expect(card(entry({ authorSignsAs: 'Papa' }))).toMatch(/>From Papa</);
  });

  it('[BL-421] the answer follows the letters: a second writer arriving adds the line after the next change', () => {
    env.writers.set('child-asha', 1);
    expect(drawsFromMama(card())).toBe(false);
    env.writers.set('child-asha', 2);
    for (const l of [...env.listeners]) l();
    expect(drawsFromMama(card())).toBe(true);
  });

  it('[BL-421] the cards of one book share one count until the letters change', () => {
    env.writers.set('child-asha', 2);
    card();
    card(entry({ id: '0199a5b0-0000-7000-8000-000000000002' }));
    card(entry({ id: '0199a5b0-0000-7000-8000-000000000003' }));
    expect(env.counts).toBe(1);
  });
});

describe('[BL-421] the voice marker stays a waveform, never a play button', () => {
  for (const writers of [1, 2]) {
    it(`[BL-421] ${writers === 1 ? 'one writer' : 'two writers'}: a spoken letter draws the waveform glyph and "Voice 1:06", no play control`, () => {
      env.writers.set('child-asha', writers);
      const html = card(entry({ captureMode: 'spoken', audioDurationMs: 66_000, audioUri: 'file:///rec/1.m4a' }));
      expect(html).toMatch(/data-testid="book\.card\.voice"/);
      expect(html).toMatch(/data-glyph="waveform"/);
      expect(html).toMatch(/Voice 1:06/);
      expect(html).not.toMatch(/role="button"[^>]*aria-label="[^"]*[Pp]lay/);
      expect(label(html)).toMatch(/Voice recording, 1 minute 6 seconds/);
    });
  }
});
