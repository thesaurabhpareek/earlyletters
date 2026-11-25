// web: later | android: same code
/**
 * The Months sheet (book-page.md 2 "Scale to 400 letters", BL-676): "Go to a month", listing only the months that
 * have letters, newest first like the Book, each with what exists in it ("3 letters, from Mama and Papa"). Choosing
 * one closes the sheet and the Book goes there with a cross-fade, never an animated scroll (the screen does that).
 * No count of months, no empty months, nothing about what is missing.
 *
 * Standard parts only: Sheet (@gorhom/bottom-sheet) and ListRow. The rows scroll inside the sheet
 * (BottomSheetScrollView), so at AX5 every row is reachable and no label truncates. Haptics: none (navigation).
 *
 * Read from here (spec 13 section 5, BL-1792): a month with a letter Read together can play gets a second, visible
 * control at the row's trailing edge, 44 pt at least, 8 pt clear of the row's own tap area (no hitSlop into that gap),
 * and under the row text, full width, at accessibility sizes. The row keeps its one tap (go to the month). For
 * VoiceOver the row stays one element and "Read from here" is an action on it; the visible control is hidden from
 * VoiceOver so it is not read twice (a control inside a one-element row could not be reached any other way).
 */
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useWindowDimensions, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { ListRow } from '@/components/ui/list-row';
import { useIsAccessibilitySize } from '@/lib/a11y';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import type { MonthRow } from './book-page.logic';
import { copy } from '@/lib/copy';
import type { YearRow } from './read-year.logic';
import { bookCopy } from './copy';

/** The VoiceOver action's name on a month row (its label is the visible words). */
export const READ_FROM_HERE_ACTION = 'readFromHere';

export function MonthsSheet({
  open,
  rows,
  onClose,
  onChoose,
  years = [],
  onChooseYear,
  starts,
  onReadFrom,
}: {
  open: boolean;
  rows: readonly MonthRow[];
  onClose: () => void;
  onChoose: (row: MonthRow) => void;
  years?: readonly YearRow[];
  onChooseYear?: (row: YearRow) => void;
  /** Each month's first playable letter by row key (read-from-here.logic.ts monthStarts); a month absent here has no control. */
  starts?: ReadonlyMap<string, string>;
  onReadFrom?: (letterId: string) => void;
}) {
  const { height } = useWindowDimensions();
  const ax = useIsAccessibilitySize();
  return (
    <Sheet open={open} onClose={onClose} title={bookCopy.monthsTitle} testID="book.monthsSheet">
      <BottomSheetScrollView style={{ maxHeight: Math.round(height * 0.6) }}>
        {years.length > 0 && onChooseYear ? (
          <>
            <Text variant="labelSmall" tone="muted" asHeading className="px-5 pb-1 pt-2">
              {copy.book.years.sectionTitle}
            </Text>
            {years.map((y) => (
              <ListRow key={y.key} title={y.label} subtitle={y.line ?? undefined} trailing="chevron" accessibilityHint={copy.book.years.rowA11y} onPress={() => onChooseYear(y)} testID={`book.year.${y.key}`} />
            ))}
          </>
        ) : null}
        {rows.map((row) => {
          const from = onReadFrom ? starts?.get(row.key) : undefined;
          const month = (
            <ListRow
              key={row.key}
              title={row.label}
              subtitle={row.line}
              trailing="chevron"
              accessibilityHint={bookCopy.monthRowHint}
              onPress={() => onChoose(row)}
              testID={`book.month.${row.key}`}
              accessibilityActions={from ? [{ name: READ_FROM_HERE_ACTION, label: copy.readTogether.fromHere }] : undefined}
              onAccessibilityAction={from ? (e) => e.nativeEvent.actionName === READ_FROM_HERE_ACTION && onReadFrom?.(from) : undefined}
            />
          );
          if (!from || !onReadFrom) return month;
          // gap-2 is the 8 pt between the row's tap area and the control (CDO ruling, spec 13 section 8 question 2). The
          // control's hint is for the day a phone check makes it its own element (spec 13 section 5, Voice Control).
          return (
            <View key={row.key} className={ax ? 'gap-2 pb-3' : 'flex-row items-center gap-2 pr-4'}>
              <View className={ax ? undefined : 'flex-1'}>{month}</View>
              <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants" aria-hidden className={ax ? 'px-4' : undefined}>
                <Button variant="quiet" size="sm" fullWidth={ax} label={copy.readTogether.fromHere} accessibilityHint={copy.readTogether.fromHereMonthA11y} onPress={() => onReadFrom(from)} testID={`book.month.${row.key}.readFromHere`} />
              </View>
            </View>
          );
        })}
      </BottomSheetScrollView>
    </Sheet>
  );
}
