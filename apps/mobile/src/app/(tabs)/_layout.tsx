import { Tabs } from 'expo-router/js-tabs';
import { BookOpenIcon, MoonStarsIcon, UsersThreeIcon, type Icon } from 'phosphor-react-native';
import { Platform, Pressable, type ColorValue, type PressableProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { LARGE_CONTENT } from '@/components/ui/button';
import { useFontsReady } from '@/components/ui/fonts';
import { UIProvider } from '@/components/ui/provider';
import { ToastHost } from '@/components/ui/toast';
import { useTheme } from '@/lib/a11y';

/**
 * Three tabs: Tonight, Book, Family (DESIGN_LANGUAGE 12, HIG tab bars: navigation, not
 * actions; always visible; single-word labels). JS tabs + Phosphor so iOS, Android and
 * the web preview match; NativeTabs (Liquid Glass) is the recorded next step after a
 * device spike (docs/design/COMPONENT_LIBRARY.md section 4).
 *
 * - Paper bar with a hairline, like Apple Books and Journal in light mode.
 * - Labels 13 pt Mukta Medium (the type floor), not scaled with Dynamic Type (HIG); on
 *   iOS a long press at accessibility sizes shows the Large Content Viewer instead.
 * - No haptics and no custom transition on tab change (MOTION 5i, 6).
 * - UIProvider here is a no-op once the root layout mounts it; the ToastHost lifts toasts
 *   above the bar on tab screens.
 */
const BAR = 54;

export default function TabsLayout() {
  const { c } = useTheme();
  const fonts = useFontsReady();
  const bottom = Math.max(useSafeAreaInsets().bottom, 8);

  const icon = (Glyph: Icon) =>
    function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
      return <Glyph color={color as string} size={26} weight={focused ? 'fill' : 'regular'} />;
    };
  // iOS only: the default tab button plus Large Content Viewer. `href` is web-only.
  const button = (title: string) =>
    Platform.OS === 'ios'
      ? (props: Record<string, unknown>) => {
          const { href: _href, ...rest } = props;
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
            tabBarStyle: { backgroundColor: c.bg, borderTopColor: c.line, borderTopWidth: 0.5, height: BAR + bottom, paddingTop: 6, paddingBottom: bottom, elevation: 0 },
            tabBarItemStyle: { height: BAR - 6 },
            tabBarLabelStyle: {
              fontSize: tokens.minFontSize,
              lineHeight: 16,
              ...(fonts ? { fontFamily: tokens.fontFamily.sansMedium, fontWeight: 'normal' } : { fontWeight: '500' }),
            },
          }}>
          <Tabs.Screen name="index" options={{ title: 'Tonight', tabBarIcon: icon(MoonStarsIcon), tabBarButton: button('Tonight') }} />
          <Tabs.Screen name="book" options={{ title: 'Book', tabBarIcon: icon(BookOpenIcon), tabBarButton: button('Book') }} />
          <Tabs.Screen name="family" options={{ title: 'Family', tabBarIcon: icon(UsersThreeIcon), tabBarButton: button('Family') }} />
        </Tabs>
      </ToastHost>
    </UIProvider>
  );
}
