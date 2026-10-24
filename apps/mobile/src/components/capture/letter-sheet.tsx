// web: same | android: same
/**
 * The letter sheet (EXPERIENCE_PASS_2026-10 S17, S18, S21; package P4b). Review reads as a letter being read: the
 * words sit on a sheet of paper with the website ProofLetter's header row, "To Asha · Month 7" on the left and
 * "From Mama" on the right, both in letterDateline caps, textMuted. The saved moment files this same sheet into its
 * month (saved-moment.tsx).
 *
 *   surfaceRaised, radius xl on the top corners and md on the bottom, elevation 2 on paper; on night paper a 1 px
 *   `line` edge instead of a shadow (the high-contrast line under Increase Contrast); 20 pt padding.
 *   Editing (S18): no box inside the letter; the sheet's own edge becomes a 1.5 pt accent line.
 *
 * The header's left side is the "whose book" switch when there are two or more books (twins): VoiceOver reads it as
 * "To Asha, Month 7" with the hint "To Asha. Change". VoiceOver never hears the "·" (review-view.logic.ts `letterHeader`).
 */
import type { ReactNode } from 'react';
import { Platform, Pressable, View, type StyleProp, type ViewStyle } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';

export type LetterHeader = { to: string; toSpoken: string; from: string };

/** The sheet's own surface: shared by Review and the saved moment, so the card that files away is the same paper. */
export function useSheetSurface(editing = false): ViewStyle {
  const { c, scheme } = useTheme();
  const e = tokens.elevation[2];
  const edge = editing
    ? { borderWidth: tokens.stroke.selected, borderColor: c.accent }
    : scheme === 'dark'
      ? { borderWidth: tokens.stroke.control, borderColor: c.line }
      : Platform.OS === 'web'
        ? ({ boxShadow: e.web } as ViewStyle)
        : { shadowColor: e.shadowColor, shadowOpacity: e.shadowOpacity, shadowRadius: e.shadowRadius, shadowOffset: e.shadowOffset, elevation: e.elevation };
  return {
    backgroundColor: c.surfaceRaised,
    borderTopLeftRadius: tokens.radius.xl,
    borderTopRightRadius: tokens.radius.xl,
    borderBottomLeftRadius: tokens.radius.md,
    borderBottomRightRadius: tokens.radius.md,
    padding: tokens.space[5],
    gap: tokens.space[4],
    ...edge,
  };
}

/** "To Asha · Month 7" and "From Mama", one row, caps, quiet. */
export function LetterHeaderRow({ header, onChangeBook, changeLabel }: { header: LetterHeader; onChangeBook?: () => void; changeLabel?: string }) {
  const to = (
    <Text variant="letterDateline" caps tone="muted" accessibilityLabel={onChangeBook ? undefined : header.toSpoken}>
      {header.to}
    </Text>
  );
  return (
    <View className="flex-row flex-wrap items-center justify-between gap-x-3 gap-y-1">
      {onChangeBook ? (
        // The month stays in what VoiceOver says ("To Asha, Month 7"); changing the book is the hint ("To Asha. Change").
        <Pressable onPress={onChangeBook} accessibilityRole="button" accessibilityLabel={header.toSpoken} accessibilityHint={changeLabel} className="min-h-11 justify-center" testID="review.sheet.to">
          {to}
        </Pressable>
      ) : (
        <View className="min-h-11 justify-center" testID="review.sheet.to">
          {to}
        </View>
      )}
      <Text variant="letterDateline" caps tone="muted" accessibilityLabel={header.from} testID="review.sheet.from">
        {header.from}
      </Text>
    </View>
  );
}

/** The sheet: the header row, then the letter. */
export function LetterSheet({
  header,
  editing = false,
  onChangeBook,
  changeLabel,
  children,
  style,
}: {
  header: LetterHeader;
  editing?: boolean;
  onChangeBook?: () => void;
  changeLabel?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const surface = useSheetSurface(editing);
  return (
    <View style={[surface, style]} testID="review.sheet">
      <LetterHeaderRow header={header} onChangeBook={onChangeBook} changeLabel={changeLabel} />
      {children}
    </View>
  );
}
