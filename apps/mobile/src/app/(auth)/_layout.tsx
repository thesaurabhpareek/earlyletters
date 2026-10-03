// android: same (the root layout presents this group as a modal sheet)
/**
 * The sign-in sheet's own stack: sign-in, email, code, link check, consent.
 * Presented as one modal from the root layout, so finishing or "Not now"
 * closes the whole sheet and returns to where it was opened.
 */
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';

export default function AuthLayout() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }} />;
}
