// web: same | android: same
/**
 * The invite routes (/invite, /invite/new) while co-parent sharing is coming
 * soon: the same presentation as the Family tab, as a modal with Close. The
 * book is the one in the link's `childId`, else the open book, else none.
 */
import { useLocalSearchParams } from 'expo-router';
import { CoParentSoon } from '@/components/family/coparent-soon';
import { useCloseSheet } from '@/lib/auth/ui';
import { getActiveChild, getChild } from '@/lib/store';

export function InviteComingSoon() {
  const close = useCloseSheet();
  const { childId } = useLocalSearchParams<{ childId?: string }>();
  const book = (childId ? getChild(childId) : null) ?? getActiveChild();
  return <CoParentSoon presentation="sheet" childName={book?.name ?? null} onClose={close} />;
}
