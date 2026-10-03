import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Uniwind } from 'uniwind';
import { effectiveFreeSessions } from '@scribe/api';
import { tokens } from '@scribe/design-tokens';
import { AgeGateScreen } from '@/components/gate/age-gate-screen';
import { UIProvider } from '@/components/ui/provider';
import { answerAgeGate, useAgeGate } from '@/lib/age-gate';
import { startAnalytics } from '@/lib/analytics';
import { startAnalyticsObservers } from '@/lib/analytics/observers';
import { useScreenViews } from '@/lib/analytics/use-screen-views';
import { startListeningCopies } from '@/lib/audio-enhance';
import { SessionProvider } from '@/lib/auth/session-provider';
import { startPlus } from '@/lib/billing';
import { runLaunchSweep } from '@/lib/capture/sweep';
import { cleanupExports } from '@/lib/export';
import { PendingInviteWatcher } from '@/lib/family/pending-invite-watcher';
import { startPacks } from '@/lib/packs';
import { setReadTogetherFreeSessionsSource } from '@/lib/read-together';
import { startReminders } from '@/lib/reminders';
import { getRemoteConfig, startRemote } from '@/lib/remote';
import { getSetting, subscribe } from '@/lib/store';
import { startSync } from '@/lib/sync';
import { startTranscriptionQueue } from '@/lib/transcription-queue';
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

/** One service failing to start never stops the others or the app (each one also works offline). */
function safely(start: () => unknown): void {
  try {
    const r = start();
    if (r instanceof Promise) r.catch(() => undefined);
  } catch {
    // Nothing to report here: no service may log content, and each retries on its own next launch.
  }
}

let servicesStarted = false;

/**
 * Background services, once per process, only after the 18+ gate passed and
 * after the first frame (nothing here is awaited by any screen; every reader
 * works from its last good copy). Order matters where noted.
 */
function startServices(launchedAt: number): void {
  if (servicesStarted) return;
  servicesStarted = true;
  // Read together allowance: remote config may only raise the reviewed default (packages/api).
  setReadTogetherFreeSessionsSource(() => effectiveFreeSessions(getRemoteConfig()));
  safely(startRemote); // signed config, pack manifest, content bundle
  safely(startPacks); // after remote: installs pack updates when a newer manifest arrives
  // After packs: the queue registers the speech plan as a language resolver on the
  // platform pack facade (models/speech-packs.ts uses it by default; no bind needed).
  safely(() => startTranscriptionQueue());
  safely(startListeningCopies); // the player's clearer listening copy lookup, stale copies swept
  safely(startSync); // waits for a signed-in, consented session itself (syncAllowed)
  safely(startPlus); // StoreKit 2 entitlements on this phone
  safely(startReminders);
  safely(cleanupExports); // ZIPs left in the cache by an export cut off by a kill
  // Opt-in analytics: nothing is sent before a yes (LEGAL-REQ-003).
  safely(() => startAnalytics({ ttfiMs: Date.now() - launchedAt }));
  safely(startAnalyticsObservers);
}

const launchedAt = Date.now();

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
  // rebase moved paths, keep stray recordings (lib/capture/sweep.ts); then
  // the background services. Nothing starts before the gate passes.
  useEffect(() => {
    if (gate.decision !== 'pass') return;
    const frame = requestAnimationFrame(() => {
      void runLaunchSweep();
      startServices(launchedAt);
    });
    return () => cancelAnimationFrame(frame);
  }, [gate.decision]);

  // An under-18 answer on the account age sheet closes the gate the same way the entry question does.
  const refreshGate = gate.refresh;
  const closeGate = useCallback(() => {
    answerAgeGate('no');
    refreshGate();
  }, [refreshGate]);

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      {/* Design system root (gestures, sheets, toasts, fonts, Increase Contrast). UI only:
          it stays mounted from the gate to the app, so passing the gate never remounts it. */}
      <UIProvider>
        {gate.decision !== 'pass' ? (
          <AgeGateScreen decision={gate.decision} refresh={gate.refresh} />
        ) : (
          // Accounts (PRD A): inside the gate, so no session work happens before it passes.
          <SessionProvider onUnder18={closeGate}>
            <ScreenViews />
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
        )}
      </UIProvider>
    </ThemeProvider>
  );
}

/** `screen_view` per route template (analytics; dropped until the person says yes). */
function ScreenViews() {
  useScreenViews();
  return null;
}
