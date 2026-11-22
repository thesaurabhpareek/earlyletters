/**
 * Moments tab, shell only (PRD 28, PR 6), dark behind EXPO_PUBLIC_MOMENTS_TAB. It renders no library read, no network
 * call and no native call: one heading, in the tab's own label, on the page colour. Nothing moves, so Reduce Motion has
 * nothing to hold back. Flag off: a link here goes Home, and the bar does not show the tab (lib/nav/moments-tab.ts).
 */
import { Redirect } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';
import { MOMENTS_TAB_ON, momentsTabLabel } from '@/lib/nav/moments-tab';

export default function Moments() {
  if (!MOMENTS_TAB_ON) return <Redirect href="/" />;
  const label = momentsTabLabel(copy.tabs);
  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']} testID="moments.shell">
      <View className="px-6 pt-6">
        <Text variant="title1" asHeading accessibilityLabel={label}>
          {label}
        </Text>
      </View>
    </SafeAreaView>
  );
}
