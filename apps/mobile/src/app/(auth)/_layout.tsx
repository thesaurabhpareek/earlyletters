// android: same (the root layout presents this group as a modal sheet)
/**
 * The sign-in sheet's own stack: sign-in, email, code, link check, consent.
 * Presented as one modal from the root layout, so finishing or "Not now"
 * closes the whole sheet and returns to where it was opened.
 *
 * v1.0: server features are off (lib/capabilities.ts), so nothing offers sign-in and
 * any route here (a stale link) goes home. The screens stay in code for v1.1.
 */
import { Redirect, Stack } from 'expo-router';
import { capabilities } from '@/lib/capabilities';
import { useTheme } from '@/lib/a11y';

export default function AuthLayout() {
  return capabilities.signIn ? <AuthStack /> : <Redirect href="/" />;
}

function AuthStack() {
  const c = useTheme().c;
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}
