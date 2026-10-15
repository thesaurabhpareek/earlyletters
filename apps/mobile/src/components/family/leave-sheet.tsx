// android: same
/**
 * Leave {child}'s book (F11 6.2 D; leave_child). Two equal choices with their
 * consequence lines and nothing chosen; Leave the book stays disabled until
 * one is picked (F11-REQ-028, R4 PT-14). Under both: what cannot be taken
 * back (F11-REQ-027). Rules in packages/core/src/family-rules.ts.
 */
import { useState } from 'react';
import { View } from 'react-native';
import { leaveContinueEnabled, type LeaveChoice } from '@scribe/core/src/family-rules';
import { Button } from '@/components/ui/button';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { Busy } from '@/lib/auth/ui';
import { fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';

export function LeaveSheet({
  open,
  child,
  coParent,
  busy,
  onClose,
  onLeave,
}: {
  open: boolean;
  child: string;
  /** The other parent's sign-off name, or the generic "Your co-parent". */
  coParent: string;
  busy: boolean;
  onClose: () => void;
  onLeave: (choice: LeaveChoice) => void;
}) {
  const l = familyCopy.leave;
  const [choice, setChoice] = useState<LeaveChoice | null>(null);
  const close = () => {
    setChoice(null);
    onClose();
  };
  return (
    <Sheet
      open={open}
      onClose={close}
      title={fill(l.title, { child })}
      footer={
        busy ? (
          <Busy label={l.working} />
        ) : (
          <View className="gap-3">
            <Button size="lg" variant="destructive" disabled={!leaveContinueEnabled(choice)} onPress={() => choice && onLeave(choice)}>
              <Text>{l.confirm}</Text>
            </Button>
            <Button size="lg" variant="outline" onPress={close}>
              <Text>{l.stay}</Text>
            </Button>
          </View>
        )
      }>
      <View className="gap-4">
        <ChoiceGroup<LeaveChoice>
          label={fill(l.title, { child })}
          layout="list"
          // Nothing is preselected: no option matches until the person picks one.
          value={(choice ?? '') as LeaveChoice}
          onChange={setChoice}
          options={[
            { value: 'keep_in_book', label: l.keepTitle, description: fill(l.keepBody, { coParent }) },
            { value: 'take_out', label: l.takeOutTitle, description: l.takeOutBody },
          ]}
        />
        <Text className="text-sm leading-5 text-muted-foreground">{fill(l.cantTakeBack, { coParent })}</Text>
      </View>
    </Sheet>
  );
}
