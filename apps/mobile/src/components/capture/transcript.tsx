// web: later (<span> with dotted underline) | android: same (verify dotted underline, COMPONENTS 2.19)
/**
 * Transcript paragraph with every machine edit marked (COMPONENTS 2.19, MOTION 5d), in the website ProofLetter's
 * grammar (EXPERIENCE_PASS S17): a word taken out is struck through in textMuted; a word spelled another way (a
 * misheard name) shows the struck heard word followed by the kept word on an accentSoft wash; added punctuation keeps
 * the quiet dotted underline. Every mark is at full strength from the first frame and tappable. A pure deletion shows as a short dotted mark where the
 * words were: an inline mark on an accentSoft wash with a solid editMark underline (it reads as a
 * mark, not as an ellipsis typo), 32pt wide, whose hitSlop makes a 44x44pt target. Nested Text is not
 * reliably focusable by VoiceOver, so Review also lists every edit as a row, and the paragraph can carry the words as
 * they will be kept as its label (P4 critics' pass S3). Every span is in the letter's face (M1), and an open mark's
 * card opens under the line the mark ends on (S8, transcript.logic.ts).
 */
import type { Edit, Segment } from '@scribe/core';
import { Fragment, useRef, type ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { Text, type TextProps } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { rowShows } from './review-view.logic';
import { cardCutAt, placeAroundCard } from './transcript.logic';

interface Props {
  segments: Segment[];
  /** Index (into segments' edit numbering) of the edit whose card is open. */
  openEdit: number | null;
  /** Edit index that marks a span just put back (accentSoft wash), if any. */
  restoredIndex: number | null;
  onPressEdit: (index: number) => void;
  /**
   * The fixes in force, indexed like `segments`' edit numbering. With them, words taken out show inline,
   * struck through (D-086), so before and after is visible without opening anything. Without them, a taken-out
   * span shows as the short dotted mark.
   */
  edits?: readonly Edit[];
  scale?: number;
  /** The open mark's card: it opens under the line the mark ends on (S17, MOTION 5d), not after the whole letter. */
  card?: ReactNode;
  /**
   * What VoiceOver reads for the paragraph: the words as they will be kept, so taken-out and heard words are not read as
   * part of the letter (P4 critics' pass S3). The fix rows are the path to each mark.
   */
  accessibilityLabel?: string;
  /** With the label: how many small fixes there are ("2 small fixes"). */
  accessibilityHint?: string;
}

/** A space where struck words would otherwise touch their neighbours (the taken-out span often carried its own space). */
const gap = (neighbour: string | undefined, before: boolean): string => {
  if (!neighbour) return '';
  const edge = before ? neighbour.slice(-1) : neighbour.slice(0, 1);
  return /\s/.test(edge) ? '' : ' ';
};

/** Removed-words mark: 32pt wide (never under 24); hitSlop brings the target to 44x44pt. */
const MARK_W = 32;

/**
 * Every span inside the letter is in the letter's own face, size, line height and Reading Size (letterBody,
 * Literata 20/32): the person's words never look as if the app wrote them in (P4 critics' pass M1). A span with no
 * variant would fall back to the ui face (Mukta 16).
 */
function LetterSpan({ scale, ...props }: TextProps & { scale: number }) {
  return <Text variant="letterBody" scale={scale} {...props} />;
}

export function Transcript({ segments, openEdit, restoredIndex, onPressEdit, edits, scale = 1, card, accessibilityLabel, accessibilityHint }: Props) {
  // editMark: full-strength underline colour (5.82:1 light, 7.64:1 dark; darker again under Increase
  // Contrast), replacing accent at 60%, which failed 3:1 in light mode (TDD 09 2.7, A11Y-F04).
  const { c } = useTheme();
  const mark = c.editMark;
  // The paragraph's lines as last laid out whole (read when a card opens; never a render of their own).
  const lines = useRef<string[] | null>(null);

  const showsOf = (s: Segment) => (s.edit !== null && edits?.[s.edit] ? rowShows(edits[s.edit]) : null);

  /** The characters a segment puts on screen, in order: where the lines break is measured in these. */
  const shownText = (s: Segment, i: number): string => {
    if (s.edit === null || s.edit === restoredIndex) return s.text;
    const shows = showsOf(s);
    if (s.text && shows?.kind === 'change') return `${shows.from} ${s.text}`;
    if (!s.text && shows?.kind === 'struck') return `${gap(segments[i - 1]?.text, true)}${shows.text}${gap(segments[i + 1]?.text, false)}`;
    if (!s.text) return '\uFFFC'; // the short dotted mark is one inline object
    return s.text;
  };

  const render = (s: Segment, i: number): ReactNode => {
    if (s.edit === null) return s.text;
    if (s.edit === restoredIndex) {
      return (
        <LetterSpan key={i} scale={scale} style={{ backgroundColor: c.accentSoft }}>
          {s.text}
        </LetterSpan>
      );
    }
    const open = s.edit === openEdit;
    const edit = s.edit;
    const shows = showsOf(s);
    const taken = !s.text ? shows : null;
    if (s.text && shows?.kind === 'change') {
      // A word spelled another way: what was heard, struck, then the kept word on a wash (S17).
      return (
        <LetterSpan
          key={i}
          scale={scale}
          onPress={() => onPressEdit(edit)}
          accessibilityRole="button"
          accessibilityLabel={fill(copy.review.rowChange, { a: shows.from, b: shows.to })}
          accessibilityHint={pendingCopy.review.editA11yHint}
          suppressHighlighting
          testID="review.mark.change">
          <LetterSpan scale={scale} style={{ textDecorationLine: 'line-through', textDecorationStyle: 'solid', textDecorationColor: mark, color: c.textMuted }}>
            {shows.from}
          </LetterSpan>{' '}
          <LetterSpan scale={scale} style={{ backgroundColor: c.accentSoft, textDecorationLine: open ? 'underline' : 'none', textDecorationColor: mark }}>
            {s.text}
          </LetterSpan>
        </LetterSpan>
      );
    }
    if (taken?.kind === 'struck') {
      // Words taken out, kept visible and struck through; a tap opens the "You said / Now it reads" card. The spaces
      // around them stay outside the strike, in the letter's face, so "um," never reads joined to "today".
      return (
        <Fragment key={i}>
          {gap(segments[i - 1]?.text, true)}
          <LetterSpan
            scale={scale}
            onPress={() => onPressEdit(edit)}
            accessibilityRole="button"
            accessibilityLabel={fill(copy.review.removedWordsA11y, { name: taken.text })}
            accessibilityHint={pendingCopy.review.editA11yHint}
            suppressHighlighting
            style={{
              textDecorationLine: 'line-through',
              textDecorationStyle: 'solid',
              textDecorationColor: mark,
              color: c.textMuted,
              backgroundColor: open ? c.accentSoft : undefined,
            }}>
            {taken.text}
          </LetterSpan>
          {gap(segments[i + 1]?.text, false)}
        </Fragment>
      );
    }
    if (!s.text) {
      const h = 24 * scale;
      const v = Math.max(0, (44 - h) / 2);
      return (
        <View key={i} style={{ width: MARK_W + 4, height: h, alignItems: 'center' }}>
          <Pressable
            onPress={() => onPressEdit(edit)}
            hitSlop={{ left: 8, right: 8, top: v, bottom: v }}
            accessibilityRole="button"
            accessibilityLabel={pendingCopy.review.removedA11y}
            accessibilityHint={pendingCopy.review.editA11yHint}
            accessibilityState={{ expanded: open }}
            style={{ width: MARK_W, height: h, justifyContent: 'flex-end', borderRadius: 6, backgroundColor: c.accentSoft, borderWidth: open ? 1.5 : 0, borderColor: mark }}>
            <View style={{ marginHorizontal: 5, marginBottom: 3, height: 2, borderRadius: 1, backgroundColor: mark }} />
          </Pressable>
        </View>
      );
    }
    return (
      <LetterSpan
        key={i}
        scale={scale}
        onPress={() => onPressEdit(edit)}
        accessibilityRole="button"
        accessibilityHint={pendingCopy.review.editA11yHint}
        accessibilityLabel={s.text}
        suppressHighlighting
        style={{
          textDecorationLine: 'underline',
          textDecorationStyle: 'dotted',
          textDecorationColor: mark,
          backgroundColor: open ? c.accentSoft : undefined,
        }}>
        {s.text}
      </LetterSpan>
    );
  };

  const paragraph = (children: ReactNode[], whole: boolean, key: string) => (
    <Text
      key={key}
      variant="letterBody"
      scale={scale}
      selectable
      testID={whole ? 'review.transcript' : `review.transcript.${key}`}
      accessibilityLabel={key === 'below' ? undefined : accessibilityLabel}
      accessibilityHint={key === 'below' ? undefined : accessibilityHint}
      // The rest of a cut letter is read as part of the label above it, so VoiceOver does not read it twice.
      accessibilityElementsHidden={key === 'below' && !!accessibilityLabel}
      importantForAccessibility={key === 'below' && accessibilityLabel ? 'no-hide-descendants' : undefined}
      onTextLayout={whole ? (e) => (lines.current = e.nativeEvent.lines.map((l) => l.text)) : undefined}>
      {children}
    </Text>
  );

  const openAt = openEdit === null ? -1 : segments.map((s) => s.edit).lastIndexOf(openEdit);
  if (!card || openAt < 0) return paragraph(segments.map((s, i) => render(s, i)), true, 'whole');

  // A card is open: the letter is cut at the end of the open mark's line, and the card goes between (S8).
  const shown = segments.map(shownText);
  const at = cardCutAt({ shown, open: openAt, lines: lines.current });
  const places = placeAroundCard({ shown, plain: segments.map((s) => s.edit === null), at });
  const above: ReactNode[] = [];
  const below: ReactNode[] = [];
  places.forEach((p, i) => {
    const s = segments[i];
    if (p === 'above') above.push(render(s, i));
    else if (p === 'below') below.push(render(s, i));
    else {
      above.push(s.text.slice(0, p.cut));
      below.push(s.text.slice(p.cut));
    }
  });
  return (
    <View testID="review.transcript">
      {paragraph(above, false, 'above')}
      {card}
      {below.length > 0 && paragraph(below, false, 'below')}
    </View>
  );
}
