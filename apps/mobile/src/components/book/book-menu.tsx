/**
 * More for this book (NS-22-R3, R7; BL-938): the Book's end menu, a sheet of rows like the Months sheet (design B-S02,
 * gap G-03: no system action menu on develop). Quiet this book or Turn Quiet off, and Hide this book with two or more
 * books. One tap opens it and one more acts, so both are within 2 taps of the Book; Hide then asks Me's confirm.
 *
 * The sheet closes before anything acts, and closes when the app goes inactive, so a menu not acted on changes
 * nothing (NS-22 s6, Interrupted). Haptics: success after Quiet changes, as in Me; none on open.
 */
import { useEffect } from 'react';
import { Alert, AppState } from 'react-native';
import type { Child } from '@/lib/store';
import { hideChild, setChildQuiet } from '@/lib/store';
import { haptic } from '@/lib/haptics';
import { copy } from '@/lib/copy';
import { ListRow } from '@/components/ui/list-row';
import { Sheet } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/toast';
import { bookMenuRows, hideConfirm, saveFailedLine, toggleQuiet } from './book-menu.logic';

export function BookMenu({ open, child, books, onClose }: { open: boolean; child: Child; books: number; onClose: () => void }) {
  const toast = useToast();
  useEffect(() => {
    if (!open) return;
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') onClose();
    });
    return () => sub.remove();
  }, [open, onClose]);

  const quiet = child.quiet === true;
  const act = (id: 'quiet' | 'hide') => {
    onClose();
    if (id === 'quiet') {
      const r = toggleQuiet({ id: child.id, name: child.name, quiet, set: setChildQuiet });
      if (r.ok) haptic('success');
      toast.show({ message: r.message });
      return;
    }
    const c = hideConfirm(child.name);
    // Nothing is deleted, so the confirm is a plain choice, not a destructive one (Me's S46). After a hide the Book shows the next book.
    Alert.alert(c.title, c.body, [
      { text: c.cancel, style: 'cancel' },
      {
        text: c.confirm,
        style: 'default',
        onPress: () => {
          try {
            hideChild(child.id);
          } catch {
            toast.show({ message: saveFailedLine(child.name) });
          }
        },
      },
    ]);
  };

  return (
    <Sheet open={open} onClose={onClose} title={copy.book.menu.label} testID="book.menuSheet">
      {bookMenuRows({ quiet, books }).map((row) => (
        <ListRow key={row.id} title={row.label} onPress={() => act(row.id)} testID={`book.menu.${row.id}`} />
      ))}
    </Sheet>
  );
}
