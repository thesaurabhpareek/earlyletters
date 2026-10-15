// android: same
/**
 * The question an invite asks before it joins (BL-322; F11 6.2 B step 6):
 * "Join this book as a parent? Invited by {signsAs}". Two equal buttons with
 * nothing chosen; neither is the default and nothing happens without a tap.
 * The child's name is not shown: peek_invite never returns it (the name
 * reaches this phone only after joining, which needs consent).
 */
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { SheetBody, SheetTitle } from '@/lib/auth/ui';
import { fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';

export function JoinAsk({ inviter, onJoin, onNotNow }: { inviter: string | null; onJoin: () => void; onNotNow: () => void }) {
  const a = familyCopy.accept;
  return (
    <View className="gap-5">
      <SheetTitle>{a.askTitle}</SheetTitle>
      <SheetBody>{inviter ? fill(a.invitedBy, { inviter }) : a.invitedByUnknown}</SheetBody>
      <SheetBody muted>{a.askBody}</SheetBody>
      <View className="gap-3">
        <Button size="lg" variant="outline" onPress={onJoin} accessibilityLabel={a.join}>
          <Text>{a.join}</Text>
        </Button>
        <Button size="lg" variant="outline" onPress={onNotNow} accessibilityLabel={a.notNow}>
          <Text>{a.notNow}</Text>
        </Button>
      </View>
    </View>
  );
}
