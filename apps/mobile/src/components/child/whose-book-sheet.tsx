// android: same (ui/sheet is @gorhom/bottom-sheet on both platforms; no 3-button limit)
import { ChoiceGroup } from '@/components/ui/choice-group';
import { Sheet } from '@/components/ui/sheet';
import { copy, fill } from '@/lib/copy';
import type { Child } from '@/lib/store';

interface Props {
  visible: boolean;
  books: Child[];
  selectedId: string;
  onSelect: (childId: string) => void;
  onClose: () => void;
}

/**
 * "Whose book?" for Review's "To {child}" (PRD-REQ-012, TDD 01 3.12, TDD 09
 * A11Y-F12). Replaces the Alert.alert picker, which Android caps at three
 * buttons. Any number of books; changing it only moves the draft. The app's
 * one `Sheet` (focus, scrim, Close, Reduce Motion) with a radio list; a tap
 * chooses and closes.
 */
export function WhoseBookSheet({ visible, books, selectedId, onSelect, onClose }: Props) {
  const title = copy.children.switcher.title;
  return (
    <Sheet open={visible} onClose={onClose} title={title}>
      <ChoiceGroup
        label={title}
        layout="list"
        className="-mx-4"
        value={selectedId}
        options={books.map((ch) => ({ value: ch.id, label: fill(copy.book.title, { child: ch.name }) }))}
        onChange={onSelect}
        onSelect={onClose}
      />
    </Sheet>
  );
}
