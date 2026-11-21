// web: later | android: same code
/**
 * The Months sheet (book-page.md 2 "Scale to 400 letters", BL-676): "Go to a month", listing only the months that
 * have letters, newest first like the Book, each with what exists in it ("3 letters, from Mama and Papa"). Choosing
 * one closes the sheet and the Book goes there with a cross-fade, never an animated scroll (the screen does that).
 * No count of months, no empty months, nothing about what is missing.
 *
 * Standard parts only: Sheet (@gorhom/bottom-sheet) and ListRow. The rows scroll inside the sheet
 * (BottomSheetScrollView), so at AX5 every row is reachable and no label truncates. Haptics: none (navigation).
 */
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useWindowDimensions } from 'react-native';
import { ListRow } from '@/components/ui/list-row';
import { Sheet } from '@/components/ui/sheet';
import type { MonthRow } from './book-page.logic';
import { bookCopy } from './copy';

export function MonthsSheet({ open, rows, onClose, onChoose }: { open: boolean; rows: readonly MonthRow[]; onClose: () => void; onChoose: (row: MonthRow) => void }) {
  const { height } = useWindowDimensions();
  return (
    <Sheet open={open} onClose={onClose} title={bookCopy.monthsTitle} testID="book.monthsSheet">
      <BottomSheetScrollView style={{ maxHeight: Math.round(height * 0.6) }}>
        {rows.map((row) => (
          <ListRow key={row.key} title={row.label} subtitle={row.line} trailing="chevron" accessibilityHint={bookCopy.monthRowHint} onPress={() => onChoose(row)} testID={`book.month.${row.key}`} />
        ))}
      </BottomSheetScrollView>
    </Sheet>
  );
}
