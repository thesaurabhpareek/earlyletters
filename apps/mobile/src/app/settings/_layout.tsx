import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';
import { useTheme } from '@/lib/a11y';

/** Settings stack (PRD C, C-REQ-016): every row at most 2 taps from Settings. */
export default function SettingsLayout() {
  const c = useTheme().c;
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTintColor: c.accent,
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { color: c.text },
        headerShadowVisible: false,
        // iOS centres the title. The web preview's header starts at 16; nudge it to the 20pt content margin.
        headerTitle: Platform.OS === 'web' ? ({ children }) => <Text className="ml-1 text-lg font-medium text-foreground">{children}</Text> : undefined,
        contentStyle: { backgroundColor: c.bg },
      }}>
      <Stack.Screen name="index" options={{ title: copy.settings.title }} />
      <Stack.Screen name="appearance" options={{ title: copy.settingsMore.appearanceTitle }} />
      <Stack.Screen name="reminders" options={{ title: copy.settings.sections.reminders }} />
      <Stack.Screen name="recently-deleted" options={{ title: copy.settings.delete.recentlyDeleted }} />
      <Stack.Screen name="recordings" options={{ title: copy.settings.recordings.title }} />
      <Stack.Screen name="children/new" options={{ title: copy.children.add.title }} />
      <Stack.Screen name="children/[id]" options={{ title: copy.children.settings.sectionTitle }} />
    </Stack>
  );
}
