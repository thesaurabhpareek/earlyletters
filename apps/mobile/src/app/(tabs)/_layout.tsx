import { Tabs } from 'expo-router/js-tabs';
import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { MoonStarsIcon } from 'phosphor-react-native/src/icons/MoonStars';
import { UserIcon } from 'phosphor-react-native/src/icons/User';
import type { Icon } from 'phosphor-react-native';
import { Platform, Pressable, type ColorValue, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { LARGE_CONTENT } from '@/components/ui/button';
import { useFontsReady } from '@/components/ui/fonts';
import { UIProvider } from '@/components/ui/provider';
import { ToastHost } from '@/components/ui/toast';
import { ReminderPrimeAsk } from '@/components/asks/reminder-prime-ask';
import { useTheme } from '@/lib/a11y';
import { copy } from '@/lib/copy';

/**
 * Tabs: Home, Book, Me (founder, 11 Nov 2026), in every build: servers on or off, alpha or store. Family is never a tab
 * (DESIGN_LANGUAGE 12, HIG tab bars: navigation, not actions; always visible; single-word labels). The labels are
 * label-only renames: the files stay `index.tsx` (Home) and `you.tsx` (Me). JS tabs + Phosphor so iOS, Android and
 * the web preview match; NativeTabs (Liquid Glass) is the recorded next step after a
 * device spike (docs/design/COMPONENT_LIBRARY.md section 0.1).
 *
 * - Paper bar with a hairline, like Apple Books and Journal in light mode.
 * - 25 pt icons; labels 13 pt Mukta Medium (the type floor), not scaled with Dynamic Type (HIG); on
 *   iOS a long press at accessibility sizes shows the Large Content Viewer instead.
 * - No haptics and no custom transition on tab change (MOTION 5i, 6).
 * - The titles come from packages/content (`en.tabs`, EXPERIENCE_PASS_2026-10 S57); none is typed here.
 * - UIProvider here is a no-op once the root layout mounts it; the ToastHost lifts toasts
 *   above the bar on tab screens.
 * - No guard, no build rule: the bar is the same three items whatever the build (test/tab-bar.test.ts). Co-parent
 *   sharing has no tab and no coming-soon screen; the real flow, where a build has it, is a pushed route (/family,
 *   /invite) reached from a book's settings.
 */
const BAR = 58;
const t = copy.tabs;

export default function TabsLayout() {
  const { c } = useTheme();
  const fonts = useFontsReady();
  const bottom = Math.max(useSafeAreaInsets().bottom, 8);

  const icon = (Glyph: Icon) =>
    function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
      return <Glyph color={color as string} size={25} weight={focused ? 'fill' : 'regular'} />;
    };
  // iOS only: the default tab button plus Large Content Viewer. `href` is web-only.
  const button = (title: string) =>
    Platform.OS === 'ios'
      ? (props: Record<string, unknown>) => {
          const { href: _href, ...base } = props;
          // The You tab says what it holds, from content (the spec's tabs.youA11yHint).
          const rest = title === t.you ? { ...base, accessibilityHint: copy.settingsHome.youTabHint } : base;
          return <Pressable {...(rest as PressableProps)} {...LARGE_CONTENT(title)} />;
        }
      : undefined;

  return (
    <UIProvider>
      <ToastHost bottomOffset={BAR}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: c.accent,
            tabBarInactiveTintColor: c.textMuted,
            tabBarAllowFontScaling: false,
            // Item = 5 pt library padding + 25 pt icon + 18 pt label line + 5 pt: fits BAR with 4 pt on top.
            tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.line, borderTopWidth: 0.5, height: BAR + bottom, paddingTop: 4, paddingBottom: bottom, elevation: 0 },
            tabBarLabelStyle: {
              fontSize: tokens.minFontSize,
              lineHeight: 18,
              marginTop: 1,
              ...(fonts ? { fontFamily: tokens.fontFamily.sansMedium, fontWeight: 'normal' } : { fontWeight: '500' }),
            },
          }}>
          <Tabs.Screen name="index" options={{ title: t.tonight, tabBarIcon: icon(MoonStarsIcon), tabBarButton: button(t.tonight) }} />
          <Tabs.Screen name="book" options={{ title: t.book, tabBarIcon: icon(BookOpenIcon), tabBarButton: button(t.book) }} />
          {/* Me (NX-30a, founder 9 Nov; named Me on 11 Nov): Settings home as a tab root. The same component as /settings (app/settings/index.tsx),
              last in the bar. It has no lamp and no Back; the header carries the one title. Its rows push the Settings pages
              onto the root stack, which goes back to this tab ("Me"). */}
          <Tabs.Screen
            name="you"
            options={{
              title: t.you,
              tabBarIcon: icon(UserIcon),
              tabBarButton: button(t.you),
              headerShown: true,
              headerTitle: copy.settings.title,
              headerStyle: { backgroundColor: c.bg },
              headerTitleStyle: { color: c.text },
              headerShadowVisible: false,
              sceneStyle: { backgroundColor: c.bg },
            }}
          />
        </Tabs>
        {/* The reminder card after the first letter, over the Book (C-REQ-001 Rev; Review asks for it, lib/asks). Inside
            this ToastHost so its "No reminders" line sits above the tab bar, not over it. */}
        <ReminderPrimeAsk />
      </ToastHost>
    </UIProvider>
  );
}
