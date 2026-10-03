import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Uniwind } from 'uniwind';
import { tokens } from '@scribe/design-tokens';
import { AgeGateScreen } from '@/components/gate/age-gate-screen';
import { answerAgeGate, useAgeGate } from '@/lib/age-gate';
import { SessionProvider } from '@/lib/auth/session-provider';
import { runLaunchSweep } from '@/lib/capture/sweep';
import { PendingInviteWatcher } from '@/lib/family/pending-invite-watcher';
import { getSetting, subscribe } from '@/lib/store';
import { useStoreReady } from '@/dev/store-ready';

SplashScreen.preventAutoHideAsync();

/** Deep links (invites, sign-in) open as sheets over the tabs, never as the only screen. */
export const unstable_settings = { initialRouteName: '(tabs)' };

/** Appearance (PRD B F10): System, Light or Dark, per device. Settings writes `appearance`. */
function useAppearance(): void {
  const read = (): 'system' | 'light' | 'dark' => {
    const v = getSetting('appearance');
    return v === 'light' || v === 'dark' ? v : 'system';
  };
  const [appearance, setAppearance] = useState(read);
  useEffect(() => subscribe(() => setAppearance(read())), []);
  useEffect(() => {
    Uniwind.setTheme(appearance);
  }, [appearance]);
}

/** Native: always ready. Web preview only: waits for the SQLite worker (src/dev/store-ready.web.ts). */
export default function RootLayout() {
  return useStoreReady() ? <Root /> : null;
}

function Root() {
  useAppearance();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = tokens[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, background: c.bg, card: c.surfaceRaised, text: c.text, border: c.line, primary: c.accent },
  };

  // 18+ entry gate (PRD-REQ-019): until it passes, no route renders, so first
  // run, Tonight, invites and every deep link sit behind it.
  const gate = useAgeGate();

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  // After the first frame, never awaited: finish takes cut off by a kill,
  // rebase moved paths, keep stray recordings (lib/capture/sweep.ts).
  useEffect(() => {
    if (gate.decision === 'pass') void runLaunchSweep();
  }, [gate.decision]);

  // An under-18 answer on the account age sheet closes the gate the same way the entry question does.
  const refreshGate = gate.refresh;
  const closeGate = useCallback(() => {
    answerAgeGate('no');
    refreshGate();
  }, [refreshGate]);

  if (gate.decision !== 'pass') {
    return (
      <ThemeProvider value={theme}>
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
        <AgeGateScreen decision={gate.decision} refresh={gate.refresh} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* Accounts (PRD A): inside the gate, so no session work happens before it passes. */}
      <SessionProvider onUnder18={closeGate}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
          <Stack.Screen name="write" options={{ presentation: 'modal' }} />
          <Stack.Screen name="listen" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
          <Stack.Screen name="review" options={{ presentation: 'modal', gestureEnabled: false }} />
          <Stack.Screen name="read-together" options={{ presentation: 'fullScreenModal' }} />
          <Stack.Screen name="letter/[id]" options={{ headerShown: true, title: '', headerTransparent: true, headerTintColor: c.accent }} />
          <Stack.Screen name="(auth)" options={{ presentation: 'modal' }} />
          <Stack.Screen name="invite" options={{ presentation: 'modal' }} />
        </Stack>
        <PendingInviteWatcher />
      </SessionProvider>
    </ThemeProvider>
  );
}
