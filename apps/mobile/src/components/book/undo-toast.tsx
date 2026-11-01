// web: later | android: same code
/**
 * Undo after a reversible action (COMPONENTS 2.14), as a thin wrapper over ui/Toast for
 * screens that render it inline. Never times out (WCAG 2.2.1): Undo, Close or a swipe.
 */
import { Toast } from '@/components/ui/toast';
import { copy } from '@/lib/copy';

interface Props {
  message: string;
  onUndo: () => void;
  /** Close without undoing. */
  onDismiss?: () => void;
  bottomOffset?: number;
}

export function UndoToast({ message, onUndo, onDismiss, bottomOffset }: Props) {
  return (
    <Toast
      message={message}
      action={{ label: copy.common.undoButton, onPress: onUndo }}
      onDismiss={onDismiss}
      onHide={() => {}}
      bottomOffset={bottomOffset}
    />
  );
}
