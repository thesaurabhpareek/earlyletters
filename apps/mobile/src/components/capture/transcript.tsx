// web: later (<span> with dotted underline) | android: same (verify dotted underline, COMPONENTS 2.19)
/**
 * Transcript paragraph with quiet dotted underlines on machine edits
 * (COMPONENTS 2.19, MOTION 5d). Underlines render at final opacity on the
 * first frame. A pure deletion shows as a short underlined gap where the
 * words were, so it can still be tapped. Nested Text is not reliably
 * focusable by VoiceOver, so Review also lists every edit as a row.
 */
import type { Segment } from '@scribe/core';
import { useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Text } from '@/components/ui/text';
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

const GAP = '   ';

export function Transcript({ segments, openEdit, restoredIndex, onPressEdit, scale = 1 }: Props) {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const body = tokens.type.letterBody;
  return (
    <Text
      className="font-serif text-foreground"
      style={{ fontSize: body.fontSize * scale, lineHeight: body.lineHeight * scale }}
      maxFontSizeMultiplier={2}
      selectable>
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
        return (
          <Text
            key={i}
            onPress={() => onPressEdit(edit)}
            accessibilityRole="button"
            accessibilityHint={pendingCopy.review.editA11yHint}
            accessibilityLabel={s.text || pendingCopy.review.removedA11y}
            suppressHighlighting
            style={{
              textDecorationLine: 'underline',
              textDecorationStyle: 'dotted',
              textDecorationColor: `${c.accent}99`,
              backgroundColor: open ? c.accentSoft : undefined,
            }}>
            {s.text || GAP}
          </Text>
        );
      })}
    </Text>
  );
}
