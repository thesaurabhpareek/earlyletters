// web: later (<span> with dotted underline) | android: same (verify dotted underline, COMPONENTS 2.19)
/**
 * Transcript paragraph with quiet dotted underlines on machine edits
 * (COMPONENTS 2.19, MOTION 5d). Underlines render at final opacity on the
 * first frame. A pure deletion shows as a short dotted mark where the
 * words were: an inline 28pt mark whose hitSlop makes a 44x44pt target. Nested Text is not reliably
 * focusable by VoiceOver, so Review also lists every edit as a row.
 */
import type { Edit, Segment } from '@scribe/core';
import { Pressable, View } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { rowShows } from './review-view.logic';

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
}

/** A space where struck words would otherwise touch their neighbours (the taken-out span often carried its own space). */
const gap = (neighbour: string | undefined, before: boolean): string => {
  if (!neighbour) return '';
  const edge = before ? neighbour.slice(-1) : neighbour.slice(0, 1);
  return /\s/.test(edge) ? '' : ' ';
};

/** Removed-words mark: 28pt wide; hitSlop brings the target to 44x44pt. */
const MARK_W = 28;

export function Transcript({ segments, openEdit, restoredIndex, onPressEdit, edits, scale = 1 }: Props) {
  // editMark: full-strength underline colour (5.82:1 light, 7.64:1 dark; darker again under Increase
  // Contrast), replacing accent at 60%, which failed 3:1 in light mode (TDD 09 2.7, A11Y-F04).
  const { c } = useTheme();
  const mark = c.editMark;
  return (
    <Text variant="letterBody" scale={scale} selectable testID="review.transcript">
      {segments.map((s, i) => {
        if (s.edit === null) return s.text;
        if (s.edit === restoredIndex) {
          return (
            <Text key={i} style={{ backgroundColor: c.accentSoft }}>
              {s.text}
            </Text>
          );
        }
        const open = s.edit === openEdit;
        const edit = s.edit;
        const taken = !s.text && edits?.[edit] ? rowShows(edits[edit]) : null;
        if (taken?.kind === 'struck') {
          // Words taken out, kept visible and struck through; a tap opens the "You said / Now it reads" card.
          return (
            <Text
              key={i}
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
              {gap(segments[i - 1]?.text, true)}
              {taken.text}
              {gap(segments[i + 1]?.text, false)}
            </Text>
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
                style={{ width: MARK_W, height: h, justifyContent: 'flex-end', borderRadius: 4, backgroundColor: open ? c.accentSoft : undefined }}>
                <View style={{ marginHorizontal: 4, marginBottom: 2, borderBottomWidth: tokens.stroke.editMark, borderStyle: 'dotted', borderColor: mark }} />
              </Pressable>
            </View>
          );
        }
        return (
          <Text
            key={i}
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
          </Text>
        );
      })}
    </Text>
  );
}
