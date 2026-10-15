// android: same (presented as a modal by the root layout)
/**
 * Invite flows, one modal: joining a co-parent's book (index) and inviting a
 * co-parent (new). PRD A F7, PRD B F5.
 */
import { Stack } from 'expo-router';
import { useTheme } from '@/lib/a11y';

export default function InviteLayout() {
  const c = useTheme().c;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}
