import { BooksIcon } from 'phosphor-react-native';
import type { ReactNode } from 'react';
import { ScrollView, View, useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';

interface Props {
  onNotNow: () => void;
  /** Development builds only: lets testers pass the gate before purchases exist. */
  onContinueDev?: () => void;
  /** Defaults are the second-book gate (PRD C 4.1, C-REQ-023). */
  title?: string;
  body?: string;
  keepNote?: string;
  icon?: ReactNode;
}

/**
 * Gentle placeholder Plus gate. No purchase code yet: the Plus button is
 * disabled with an honest line. Content sits near the top (no floating block).
 */
export function PlusGate({ onNotNow, onContinueDev, title, body, keepNote, icon }: Props) {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const x = copy.childrenExtra;
  return (
    <ScrollView contentContainerClassName="gap-4 px-5 pb-10 pt-8">
      <View accessible={false} className="h-14 w-14 items-center justify-center rounded-full bg-secondary">
        {icon ?? <BooksIcon size={28} color={c.accent} />}
      </View>
      <Text role="heading" className="font-serif text-3xl leading-10 text-foreground">
        {title ?? x.plusGateTitle}
      </Text>
      <Text className="text-lg leading-7 text-foreground">{body ?? copy.children.add.plusNote}</Text>
      <Text className="text-base leading-6 text-muted-foreground">{keepNote ?? copy.children.add.keepNote}</Text>
      <View className="gap-3 pt-4">
        <Button size="lg" disabled accessibilityHint={x.plusNotYet}>
          <Text>{x.plusCta}</Text>
        </Button>
        <Text className="text-center text-sm text-muted-foreground">{x.plusNotYet}</Text>
        <Button variant="ghost" onPress={onNotNow}>
          <Text className="text-primary">{copy.common.notNowButton}</Text>
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
