// web: same | android: same
/**
 * "Write this book together" (EXPERIENCE_PASS_2026-10 S57): the Family tab's one card, shown while the book
 * has one parent and no invite is open. `surfaceRaised`, `radius.md`, elevation 1, 16 pt padding. The small
 * closed cover at its right (the invite is into this book; dropped at accessibility sizes, as on the sign-in sheet), the title in `headline`, the body, "Invite a
 * co-parent" bordered with UserPlus 20 pt, then the privacy line with LockSimple, which says who the book is
 * shared with and never who can read it (review A1). Nothing is counted.
 */
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { UserPlusIcon } from 'phosphor-react-native/src/icons/UserPlus';
import { View } from 'react-native';
import { BookCover } from '@/components/book/book-cover';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { useIsAccessibilitySize, useTheme } from '@/lib/a11y';
import { fill } from '@/lib/copy';
import { familyCopy } from '@/lib/family/copy';

export function InviteCard({ child, note, onInvite }: { child: string; note: string | null; onInvite: () => void }) {
  const { c } = useTheme();
  const k = familyCopy.card;
  // At accessibility sizes the cover steps aside, as on the sign-in sheet, so the title and body take the width and
  // no word breaks; the button takes the width too (critics' pass S4).
  const ax = useIsAccessibilitySize();
  return (
    <Card testID="family.inviteCard" variant="raised" radius="md" padding={4}>
      <View className="flex-row items-start gap-4">
        <View className="flex-1 gap-2">
          <Text variant="headline" asHeading>
            {k.title}
          </Text>
          <Text variant="body" tone="muted">
            {fill(k.body, { child })}
          </Text>
        </View>
        {ax ? null : <BookCover name={child} size="sm" animate={false} />}
      </View>
      <Button testID="family.invite" variant="outline" size="lg" icon={UserPlusIcon} label={k.button} haptic="tap" className={ax ? 'self-stretch' : 'self-start'} onPress={onInvite} />
      {note ? <Text variant="footnote">{note}</Text> : null}
      <View className="flex-row items-center gap-2">
        <LockSimpleIcon size={16} color={c.textMuted} />
        <Text variant="footnote" className="shrink">
          {k.privacy}
        </Text>
      </View>
    </Card>
  );
}
