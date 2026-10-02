import '@/global.css';

import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { Uniwind } from 'uniwind';
import { tokens } from '@scribe/design-tokens';
import { getSetting, subscribe } from '@/lib/store';

SplashScreen.preventAutoHideAsync();

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

export default function RootLayout() {
  useAppearance();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const c = tokens[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, background: c.bg, card: c.surfaceRaised, text: c.text, border: c.line, primary: c.accent },
  };

  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ThemeProvider value={theme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: c.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ gestureEnabled: false }} />
        <Stack.Screen name="write" options={{ presentation: 'modal' }} />
        <Stack.Screen name="listen" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="review" options={{ presentation: 'modal', gestureEnabled: false }} />
        <Stack.Screen name="letter/[id]" options={{ headerShown: true, title: '', headerTransparent: true, headerTintColor: c.accent }} />
      </Stack>
    </ThemeProvider>
  );
}
