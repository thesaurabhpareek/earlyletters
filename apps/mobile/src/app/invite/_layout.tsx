// android: same (presented as a modal by the root layout)
/**
 * Invite flows, one modal: joining a co-parent's book (index) and inviting a
 * co-parent (new). PRD A F7, PRD B F5.
 */
import { Redirect, Stack } from 'expo-router';
import { useTheme } from '@/lib/a11y';
import { inviteScreensHidden } from '@/lib/family/surfaces';

export default function InviteLayout() {
  const c = useTheme().c;
  // A servers-on store build has no invite or join screen (NX-38-R5, familySurfacesShown): any way here lands on Tonight.
  if (inviteScreensHidden()) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}
