/**
 * The acknowledgment after a purchase or a free period starts (BL-342, WP-F14-06; C-REQ-024 phone
 * half). Five items: the terms, the first or next charge date, the price after, the cancel-by date
 * and how to cancel; "Save a copy" opens the share sheet (Mail, Files, Notes) with the same text.
 * The Plan screen's "Your Plus terms" row opens it too. Words: billingCopy.ack (counsel review).
 */
import { useState } from 'react';
import { Share, View } from 'react-native';
import { Button, ButtonRow } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { acknowledgment, billingCopy, usePlan } from '@/lib/billing';

export function AcknowledgmentSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const plan = usePlan();
  const ack = acknowledgment(plan);
  const a = billingCopy.ack;
  const [sharing, setSharing] = useState(false);

  const saveCopy = async () => {
    if (sharing) return;
    setSharing(true);
    try {
      await Share.share({ message: ack.shareText, title: a.title });
    } catch {
      // The person closed the share sheet or it could not open; the same text stays in Settings, Plan.
    } finally {
      setSharing(false);
    }
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={a.title}
      hideClose
      footer={
        <ButtonRow>
          <Button variant="secondary" label={a.saveCopy} accessibilityHint={a.saveCopyHelp} loading={sharing} onPress={saveCopy} />
          <Button variant="primary" label={a.done} onPress={onClose} />
        </ButtonRow>
      }>
      <View className="gap-3">
        {ack.lines.map((line) => (
          <Text key={line} variant="body" selectable>
            {line}
          </Text>
        ))}
      </View>
    </Sheet>
  );
}
