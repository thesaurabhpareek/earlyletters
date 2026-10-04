/**
 * Ask before a delete or an erase (D-085). One sheet, two buttons: the safe one
 * ("Keep it") is the primary action and the default; the destructive one is
 * quiet and red. In the app's own Sheet rather than a native alert, so it
 * reads the same on every build and can be driven in the web preview.
 */
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

interface Props {
  open: boolean;
  title: string;
  body: string;
  /** The destructive choice, e.g. "Delete letter". */
  confirmLabel: string;
  /** The safe choice and the default, e.g. "Keep it". */
  keepLabel: string;
  onConfirm: () => void;
  onKeep: () => void;
}

export function ConfirmSheet({ open, title, body, confirmLabel, keepLabel, onConfirm, onKeep }: Props) {
  return (
    <Sheet open={open} onClose={onKeep} title={title}>
      <View className="gap-4 pb-2">
        <Text variant="body" tone="muted">
          {body}
        </Text>
        <Button size="lg" label={keepLabel} onPress={onKeep} />
        <Button variant="destructive" size="lg" label={confirmLabel} onPress={onConfirm} />
      </View>
    </Sheet>
  );
}
