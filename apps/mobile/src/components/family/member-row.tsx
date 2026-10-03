import { View } from 'react-native';
import { Text } from '@/components/ui/text';

interface Props {
  signsAs: string;
  role: string; // "Co-parent" / "Family"
  status?: string; // "Invited"
}

/** COMPONENTS.md 2.16 Avatar (initials on accentSoft) + ListRow `author` variant. */
export function MemberRow({ signsAs, role, status }: Props) {
  const initial = signsAs.trim().charAt(0).toUpperCase() || '?';
  return (
    <View accessible accessibilityLabel={[signsAs, role, status].filter(Boolean).join(', ')} className="min-h-14 flex-row items-center gap-3 py-2">
      <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
        <Text maxFontSizeMultiplier={1.3} className="text-base font-semibold text-foreground">
          {initial}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-lg text-foreground">{signsAs}</Text>
        <Text className="text-sm text-muted-foreground">{[role, status].filter(Boolean).join(' · ')}</Text>
      </View>
    </View>
  );
}
