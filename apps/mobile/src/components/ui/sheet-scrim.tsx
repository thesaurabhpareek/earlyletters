/**
 * Ink-tinted scrim behind bottom sheets (replaces pure-black bg-black/30).
 * Light: warm ink (tokens.text) at 0.32. Dark: the page colour (tokens.bg) at
 * 0.7, so the dim stays warm instead of going to true black. No new literals.
 * Tapping closes the sheet; the sheet itself keeps native swipe-to-dismiss.
 */
import { Pressable, StyleSheet, View, useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';

export function SheetScrim({ onPress, label }: { onPress: () => void; label: string }) {
  const dark = useColorScheme() === 'dark';
  const c = tokens[dark ? 'dark' : 'light'];
  return (
    <Pressable style={{ flex: 1 }} onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: dark ? c.bg : c.text, opacity: dark ? 0.7 : 0.32 }]} />
    </Pressable>
  );
}
