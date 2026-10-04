// web: later (<span> with dotted underline) | android: same (verify dotted underline, COMPONENTS 2.19)
/**
 * Transcript paragraph with quiet dotted underlines on machine edits
 * (COMPONENTS 2.19, MOTION 5d). Underlines render at final opacity on the
 * first frame. A pure deletion shows as a short dotted mark where the
 * words were: an inline 28pt mark whose hitSlop makes a 44x44pt target. Nested Text is not reliably
 * focusable by VoiceOver, so Review also lists every edit as a row.
 */
import type { Segment } from '@scribe/core';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { pendingCopy } from '@/lib/copy';

interface Props {
  segments: Segment[];
  /** Index (into segments' edit numbering) of the edit whose card is open. */
  openEdit: number | null;
  /** Edit index that marks a span just put back (accentSoft wash), if any. */
  restoredIndex: number | null;
  onPressEdit: (index: number) => void;
  scale?: number;
}

/** Removed-words mark: 28pt wide; hitSlop brings the target to 44x44pt. */
const MARK_W = 28;

export function Transcript({ segments, openEdit, restoredIndex, onPressEdit, scale = 1 }: Props) {
  // editMark: full-strength underline colour (5.82:1 light, 7.64:1 dark; darker again under Increase
  // Contrast), replacing accent at 60%, which failed 3:1 in light mode (TDD 09 2.7, A11Y-F04).
  const { c } = useTheme();
  const mark = c.editMark;
  return (
    <Text variant="letterBody" scale={scale} selectable>
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
                <View style={{ marginHorizontal: 4, marginBottom: 2, borderBottomWidth: 2, borderStyle: 'dotted', borderColor: mark }} />
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
