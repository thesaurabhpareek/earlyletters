// web: apps/web/components/book/letter-card.tsx (not yet) | android: same
/**
 * LetterCard (COMPONENTS 2.5, EXPERIENCE_PASS S26): dateline, two lines of the person's words ending in a fade,
 * signature, private tag, and a quiet "has a recording" line. One VoiceOver element with a composed label; the
 * excerpt is cut visually only (ExcerptFade: whole lines at every Dynamic Type size, never an ellipsis glyph, the
 * stored letter never cut).
 * Look: Airbnb listing card (radius md 14, no hard border in light, whole card one tap target, metadata muted below)
 * on paper; press scale 0.98 from press-in (Card, Things 3 "objects"), so the finger sees the card take the touch
 * before it grows into its page.
 *
 * Card to page (P1's contract, MOTION 5f): the screen puts the card in a CardSource, and the card puts its dateline
 * and excerpt in a CardText, in the type the letter page opens with (letterBody at Reading Size Standard, or the
 * app's note), so the page can carry these exact words into its own opening without a reflow.
 *
 * A card that has just arrived (kept a moment ago, put back by Undo, or the other parent's letter seen here for the
 * first time) carries the 1.6 s accentSoft wash once, behind its words. A card that leaves (deleted here, or on
 * another phone) collapses out of its row: a fade over exitMs while the rows below close up on `standard`.
 */
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { useEffect, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeOut, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { CardText } from '@/components/motion/card-transition';
import { ExcerptFade } from '@/components/motion/excerpt-fade';
import { isRtl, lineHeightFor } from '@/components/motion/excerpt-fade.logic';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useFontScale, useTheme } from '@/lib/a11y';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { layoutSpring, type Motion } from '@/lib/motion';
import type { Child, Entry } from '@/lib/store';
import { authorOf, isOwnEntry } from '@/components/child/child-store';
import { datelineA11y, shortDateline } from './chapters';
import { AppNote } from './app-note';
import { bookCopy } from './copy';
import { cardLabel } from './letter-card.logic';
import { letterWords } from './letter-words.logic';
import { showsSignature } from './quiet-day.logic';

interface Props {
  entry: Entry;
  child: Child;
  onPress: (id: string) => void;
  /** A new value runs the 1.6 s accentSoft wash once (0 or undefined: none). */
  wash?: number;
  /** The waiting card's live reason beside its length ("Getting ready, 40%", "Ready to read back"). */
  reason?: string | null;
}

const LAYOUT = layoutSpring('standard');
/** The gap between the dateline and the words, on the card and on the page's opening (the column contract). */
export const CARD_TEXT_GAP = 10;
/** The card's words sit 20 pt (the list's gutter) plus 16 pt (the card's padding) from each edge; the page opens there. */
export const CARD_TEXT_INSET = 36;
/** The raised card's edge in dark mode (Card: `dark:border`, 1 pt), which its padding gives back. */
export const CARD_EDGE_DARK = 1;

function clock(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** What a card or a page shows for a letter's words: the words, or the app's own note about the recording. */
export function excerptOf(entry: Entry): { note: boolean; text: string } {
  const words = letterWords(entry);
  if (words === 'waiting') return { note: true, text: pendingCopy.book.waitingForWords };
  if (words === 'nobodySpoke') return { note: true, text: bookCopy.nobodySpoke };
  return { note: false, text: entry.finalText.replace(/\s+/g, ' ').trim() };
}

/** The line height the card's words render at, which the page's opening must match to carry them. */
export function cardLineHeight(note: boolean, fontScale: number): number {
  return lineHeightFor(note ? 'footnote' : 'letterBody', fontScale);
}

export function LetterCard({ entry, child, onPress, wash, reason }: Props) {
  const { c, scheme } = useTheme();
  const fontScale = useFontScale();
  const signsAs = authorOf(entry, child);
  const signature = fill(copy.book.signature, { signsAs });
  const date = shortDateline(child, entry.occurredOn);
  const spoken = entry.captureMode !== 'typed';
  const words = letterWords(entry);
  // No words to show (waiting for them, or no words in the recording): the app's own note, small and
  // unsigned, never in the letter's type (D-084).
  const { note, text } = excerptOf(entry);
  const signed = showsSignature(words);
  const rtl = !note && isRtl(text);

  const label = cardLabel({
    signature: signed ? signature : null,
    dateline: datelineA11y(child, entry.occurredOn),
    text,
    inBook: entry.inBook,
    privateLabel: copy.book.privateLabel,
    reason,
    spoken,
    own: isOwnEntry(entry),
    recordingOnPhone: copy.book.recordingOnPhone,
  });

  return (
    <Card
      radius="md"
      padding={4}
      // In dark mode a raised card draws a 1 pt `line` edge inside its box; the padding gives that point back, so the
      // words sit in the same 330 pt column in both schemes and the page can carry them (canCarry allows 1 pt).
      style={scheme === 'dark' ? { padding: tokens.space[4] - CARD_EDGE_DARK } : undefined}
      onPress={() => onPress(entry.id)}
      accessibilityLabel={label}
      accessibilityHint={copy.reader.openHint}
      className="gap-2.5"
      testID="book.card">

      <Wash run={wash} color={c.accentSoft} />
      <CardText lineHeight={cardLineHeight(note, fontScale)} rtl={rtl} style={{ gap: CARD_TEXT_GAP }}>
        <Text variant="letterDateline" caps>
          {date}
        </Text>
        {note ? <AppNote>{text}</AppNote> : <ExcerptFade text={text} lines={2} variant="letterBody" surface={c.surfaceRaised} />}
      </CardText>

      <View className="flex-row flex-wrap items-center gap-x-3 gap-y-1 pt-0.5">
        {signed ? (
          <Text variant="labelSmall" tone="muted">
            {signature}
          </Text>
        ) : null}
        {!entry.inBook && <PrivateChip color={c.text} />}
        <View className="flex-1" />
        {spoken && entry.audioDurationMs ? (
          <View className="flex-row items-center gap-1.5" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {reason ? <Text variant="footnote">{reason}</Text> : null}
            <MicrophoneIcon size={14} color={c.textMuted} weight="regular" />
            <Text variant="footnote" style={{ fontVariant: ['tabular-nums'] }}>
              {clock(entry.audioDurationMs)}
            </Text>
          </View>
        ) : null}
      </View>
    </Card>
  );
}

/**
 * A row of the Book: its gutter, how it arrives and how it leaves (a fade over exitMs while the rows below close up
 * on `standard`). The card itself goes inside, in the screen's own CardSource (the screen that holds the cards also
 * hides itself under their pages, P1's contract).
 */
export function BookRow({ entering, reduced, children }: { entering?: ReturnType<Motion['enter']>; reduced: boolean; children: ReactNode }) {
  return (
    <Animated.View
      entering={entering}
      exiting={FadeOut.duration(reduced ? tokens.motion.fadeMs : tokens.motion.exitMs).reduceMotion(ReduceMotion.Never)}
      layout={reduced ? undefined : LAYOUT}
      className="px-5 pb-3">
      {children}
    </Animated.View>
  );
}

/**
 * The arrival wash (MOTION 5e): accentSoft behind the card's words, fading over newMarkMs. It is a fade either way,
 * so Reduce Motion shows the same static wash, then fades it. Decorative: hidden from screen readers, no touches.
 */
function Wash({ run, color }: { run?: number; color: string }) {
  const o = useSharedValue(0);
  useEffect(() => {
    if (!run) return;
    o.value = 1;
    o.value = withTiming(0, { duration: tokens.motion.newMarkMs, reduceMotion: ReduceMotion.Never });
  }, [run, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[StyleSheet.absoluteFill, { backgroundColor: color, borderRadius: tokens.radius.md }, style]}
    />
  );
}

/** "Private" tag: accentSoft fill with full-strength text (12.07:1 light, 11.20:1 dark), lock + word. */
export function PrivateChip({ color }: { color: string }) {
  return (
    <View className="flex-row items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5">
      <LockSimpleIcon size={12} color={color} weight="bold" />
      <Text variant="caption" tone="default">
        {copy.book.privateLabel}
      </Text>
    </View>
  );
}
