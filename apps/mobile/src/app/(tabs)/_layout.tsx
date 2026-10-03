import { Tabs } from 'expo-router/js-tabs';
import { BookOpenIcon, MoonStarsIcon, UsersThreeIcon } from 'phosphor-react-native';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';

/**
 * Three tabs: Tonight, Book, Family (DESIGN_LANGUAGE.md section 12).
 * JS tabs + Phosphor icons render the same on iOS and Android.
 */
export default function TabsLayout() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  // Room for a 26pt icon plus a 16pt label line above the home indicator, so labels never clip.
  const bottom = Math.max(useSafeAreaInsets().bottom, 8);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.surfaceRaised, borderTopColor: c.line, height: 58 + bottom, paddingTop: 6, paddingBottom: bottom },
        // Item: 5pt padding + 26pt icon + 16pt label line; the library default (49pt) clips the label.
        tabBarItemStyle: { height: 52 },
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tonight',
          tabBarIcon: ({ color, focused }) => <MoonStarsIcon color={color as string} size={26} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Book',
          tabBarIcon: ({ color, focused }) => <BookOpenIcon color={color as string} size={26} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Family',
          tabBarIcon: ({ color, focused }) => <UsersThreeIcon color={color as string} size={26} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
    </Tabs>
  );
}
