// android: same (the root layout presents this group as a modal sheet)
/**
 * The sign-in sheet's own stack: sign-in, email, code, link check, consent.
 * Presented as one modal from the root layout (lib/transitions.logic.ts, 5.8 row 10), so finishing or
 * "Not now" closes the whole sheet and returns to where it was opened.
 *
 * Motion (EXPERIENCE_PASS chapter 7, "Native first"): steps inside one sheet are one act, so they
 * cross-fade in place over `fadeMs` (200 ms) instead of pushing: the code, the opened link and account
 * setup. "Continue with email" is a choice the person can step back from, so it pushes (S53). The
 * sheet's content adds no entrance of its own (MOTION 5i). Reduce Motion: the same 200 ms fade.
 *
 * With server features off (lib/capabilities.ts) nothing offers sign-in and any route here (a stale
 * link) goes home.
 */
import { Redirect, Stack } from 'expo-router';
import { tokens } from '@scribe/design-tokens';
import { capabilities } from '@/lib/capabilities';
import { useTheme } from '@/lib/a11y';

/** One step replacing another inside the sheet. */
const STEP = { animation: 'fade', animationDuration: tokens.motion.fadeMs } as const;

export default function AuthLayout() {
  return capabilities.signIn ? <AuthStack /> : <Redirect href="/" />;
}

function AuthStack() {
  const c = useTheme().c;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
      <Stack.Screen name="sign-in/index" />
      <Stack.Screen name="sign-in/email" />
      <Stack.Screen name="sign-in/code" options={STEP} />
      <Stack.Screen name="sign-in/verify" options={STEP} />
      <Stack.Screen name="sign-in/consent" options={STEP} />
    </Stack>
  );
}
