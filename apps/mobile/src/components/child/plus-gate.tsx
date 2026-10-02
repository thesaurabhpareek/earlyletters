import { BooksIcon } from 'phosphor-react-native';
import { ScrollView, View, useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';

interface Props {
  onNotNow: () => void;
  /** Development builds only: lets testers reach the add-child form before purchases exist. */
  onContinueDev?: () => void;
}

/**
 * Gentle placeholder gate for a second child's book (PRD C 4.1, C-REQ-023).
 * No purchase code yet: the Plus button is disabled with an honest line.
 */
export function PlusGate({ onNotNow, onContinueDev }: Props) {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const x = copy.childrenExtra;
  return (
    <ScrollView contentContainerClassName="flex-grow justify-center gap-5 px-6 py-10">
      <View accessible={false} className="h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <BooksIcon size={30} color={c.accent} />
      </View>
      <Text role="heading" className="font-serif text-3xl leading-10 text-foreground">
        {x.plusGateTitle}
      </Text>
      <Text className="text-lg leading-7 text-foreground">{copy.children.add.plusNote}</Text>
      <Text className="text-base leading-6 text-muted-foreground">{copy.children.add.keepNote}</Text>
      <View className="gap-3 pt-2">
        <Button size="lg" disabled accessibilityHint={x.plusNotYet}>
          <Text>{x.plusCta}</Text>
        </Button>
        <Text className="text-center text-sm text-muted-foreground">{x.plusNotYet}</Text>
        <Button variant="ghost" onPress={onNotNow}>
          <Text className="text-muted-foreground">{copy.common.notNowButton}</Text>
        </Button>
        {onContinueDev && (
          <Button variant="outline" onPress={onContinueDev}>
            <Text>{copy.common.continueButton}</Text>
          </Button>
        )}
      </View>
    </ScrollView>
  );
}
