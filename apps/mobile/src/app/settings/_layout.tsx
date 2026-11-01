import { router, Stack } from 'expo-router';
import { HeaderBackButton } from 'expo-router/react-navigation';
import { Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { licences } from '@scribe/content';
import { copy } from '@/lib/copy';
import { useTheme } from '@/lib/a11y';
import { needsOuterBack, outerBackLabel } from '@/lib/navigation.logic';

/** The tabs Settings can be opened from, by route name, for the back label (iOS names the screen it returns to). */
const TAB_TITLES = { index: copy.tabs.tonight, book: copy.tabs.book, family: copy.tabs.family } as const;

/**
 * Settings stack (PRD C, C-REQ-016): every row at most 2 taps from Settings. Every page is a native push with the
 * platform's own motion and no lamp (EXPERIENCE_PASS 5.8 row 9); "If you are struggling" and Licenses are pages too
 * (S40), never accordions inside the list.
 *
 * Back from Settings (TestFlight build 1): this stack is pushed onto the root stack, whose header is hidden, so its
 * first screen (Settings home, or a page opened straight from elsewhere) has no native back of its own. It gets the
 * navigation library's HeaderBackButton in the header's left slot: the iOS chevron and the previous screen's title,
 * in the accent tint, read by VoiceOver as "<title>, back". It pops the root stack's push (router.back()), so the
 * platform's own motion and Reduce Motion apply; the edge swipe and the VoiceOver escape are the root stack's.
 */
export default function SettingsLayout() {
  const c = useTheme().c;
  return (
    <Stack
      screenOptions={({ navigation, route }) => ({
        headerShown: true,
        headerTintColor: c.accent,
        headerStyle: { backgroundColor: c.bg },
        headerTitleStyle: { color: c.text },
        headerShadowVisible: false,
        // iOS centres the title. The web preview's header starts at 16; nudge it to the 20pt content margin.
        headerTitle: Platform.OS === 'web' ? ({ children }) => <Text className="ml-1 text-lg font-medium text-foreground">{children}</Text> : undefined,
        contentStyle: { backgroundColor: c.bg },
        headerLeft: outerBack(navigation, route.key, c.accent),
      })}>
      <Stack.Screen name="index" options={{ title: copy.settings.title }} />
      <Stack.Screen name="appearance" options={{ title: copy.settingsMore.appearanceTitle }} />
      <Stack.Screen name="reminders" options={{ title: copy.settings.sections.reminders }} />
      <Stack.Screen name="recently-deleted" options={{ title: copy.settings.delete.recentlyDeleted }} />
      <Stack.Screen name="recordings" options={{ title: copy.settings.recordings.title }} />
      <Stack.Screen name="children/new" options={{ title: copy.children.add.title }} />
      <Stack.Screen name="children/[id]" options={{ title: copy.children.settings.sectionTitle }} />
      <Stack.Screen name="struggling" options={{ title: copy.struggling.title }} />
      <Stack.Screen name="licenses" options={{ title: licences.title }} />
    </Stack>
  );
}

/** The parent and own stack, as far as the back needs them (react-navigation's navigation object). */
type Nav = {
  getState: () => { routes: readonly { key: string }[] };
  getParent: () => { canGoBack: () => boolean; getState: () => { index: number; routes: readonly Parameters<typeof outerBackLabel>[0][] } } | undefined;
};

/** The header's left slot for this stack's first screen; undefined elsewhere, so the native back stays. */
function outerBack(navigation: Nav, key: string, tint: string) {
  const parent = navigation.getParent();
  const index = navigation.getState().routes.findIndex((r) => r.key === key);
  if (!parent || !needsOuterBack(index, parent.canGoBack())) return undefined;
  const p = parent.getState();
  const label = outerBackLabel(p.routes[p.index - 1], TAB_TITLES, copy.common.backButton);
  return () => <HeaderBackButton label={label} tintColor={tint} onPress={() => router.back()} testID="settings-back" />;
}
