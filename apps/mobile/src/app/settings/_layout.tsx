import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { copy } from '@/lib/copy';

/** Settings stack (PRD C, C-REQ-016): every row at most 2 taps from Settings. */
export default function SettingsLayout() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: c.accent,
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { color: c.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.bg },
      }}>
      <Stack.Screen name="index" options={{ title: copy.settings.title }} />
      <Stack.Screen name="appearance" options={{ title: copy.settingsMore.appearanceTitle }} />
      <Stack.Screen name="reminders" options={{ title: copy.settings.sections.reminders }} />
      <Stack.Screen name="recordings" options={{ title: copy.settings.recordings.title }} />
      <Stack.Screen name="children/new" options={{ title: copy.children.add.title }} />
      <Stack.Screen name="children/[id]" options={{ title: copy.children.settings.sectionTitle }} />
    </Stack>
  );
}
