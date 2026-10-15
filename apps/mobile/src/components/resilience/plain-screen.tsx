/**
 * The calm full-screen card used when the normal app cannot be shown: the root error boundary and the
 * launch recovery screen. Deliberately plain React Native (View, Text, Pressable) and design tokens only:
 * no providers, no stores, no router, no fonts to wait for, so it still draws when everything above it
 * is what failed. Reads the saved appearance when it can and falls back to the system scheme.
 * It never shows an error message, code or stack. Dynamic Type works (no fixed heights on text).
 */
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View, useColorScheme } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import { tokens } from '@scribe/design-tokens';
import { getSetting } from '@/lib/store';

export type PlainAction = { label: string; onPress: () => void; kind?: 'primary' | 'quiet'; busy?: boolean };

export function useSchemeSafely(): 'light' | 'dark' {
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';
  try {
    const v = getSetting('appearance'); // the store may be the very thing that failed
    if (v === 'light' || v === 'dark') return v;
  } catch {
    // fall back to the system scheme
  }
  return system;
}

export function PlainScreen({ title, body, hint, note, actions }: { title: string; body: string; hint?: string; note?: string; actions: PlainAction[] }) {
  const scheme = useSchemeSafely();
  const c = tokens[scheme];
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(c.bg).catch(() => {});
  }, [c.bg]);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 48 }}>
        <View accessible={false} style={{ gap: 12 }}>
          <Text accessibilityRole="header" style={{ color: c.text, fontSize: 28, lineHeight: 36, fontWeight: '600', fontFamily: 'Georgia' }}>
            {title}
          </Text>
          <Text style={{ color: c.text, fontSize: 17, lineHeight: 26 }}>{body}</Text>
          {hint ? <Text style={{ color: c.textMuted, fontSize: 15, lineHeight: 22 }}>{hint}</Text> : null}
          {note ? (
            <Text accessibilityLiveRegion="polite" style={{ color: c.textMuted, fontSize: 15, lineHeight: 22 }}>
              {note}
            </Text>
          ) : null}
        </View>
        <View style={{ gap: 8, marginTop: 28 }}>
          {actions.map((a) => {
            const primary = (a.kind ?? 'primary') === 'primary';
            return (
              <Pressable
                key={a.label}
                accessibilityRole="button"
                accessibilityLabel={a.label}
                accessibilityState={{ busy: !!a.busy, disabled: !!a.busy }}
                disabled={a.busy}
                onPress={a.onPress}
                style={({ pressed }) => ({
                  minHeight: 56,
                  borderRadius: 14,
                  paddingHorizontal: 20,
                  paddingVertical: 14,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: primary ? c.accent : 'transparent',
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                {a.busy ? (
                  <ActivityIndicator color={primary ? c.onAccent : c.accent} />
                ) : (
                  <Text style={{ color: primary ? c.onAccent : c.accent, fontSize: 17, lineHeight: 24, fontWeight: '600', textAlign: 'center' }}>{a.label}</Text>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
