import { Tabs } from 'expo-router';
import { BookOpenIcon, MoonStarsIcon, UsersThreeIcon } from 'phosphor-react-native';
import { useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';

/**
 * Three tabs: Tonight, Book, Family (DESIGN_LANGUAGE.md section 12).
 * JS tabs + Phosphor icons render the same on iOS and Android.
 */
export default function TabsLayout() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.textMuted,
        tabBarStyle: { backgroundColor: c.surfaceRaised, borderTopColor: c.line },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '500' },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tonight',
          tabBarIcon: ({ color, focused }) => <MoonStarsIcon color={color} size={26} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tabs.Screen
        name="book"
        options={{
          title: 'Book',
          tabBarIcon: ({ color, focused }) => <BookOpenIcon color={color} size={26} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Family',
          tabBarIcon: ({ color, focused }) => <UsersThreeIcon color={color} size={26} weight={focused ? 'fill' : 'regular'} />,
        }}
      />
    </Tabs>
  );
}
