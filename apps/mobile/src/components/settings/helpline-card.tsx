/**
 * One helpline on "If you are struggling" and "Lines in other countries" (struggling-page.md section 3): its name,
 * the line saying how to reach it, and Call and Text buttons. A tap opens Phone or Messages and never dials by
 * itself; if that cannot open, the same tap shows the number to copy (help-fallback.tsx, F20-REQ-005). Buttons stack
 * at large text sizes (ButtonRow) and grow with the text; nothing is truncated. Nothing is counted, logged or sent.
 */
import * as React from 'react';
import { View } from 'react-native';
import type { Helpline } from '@scribe/content';
import { Button, ButtonRow } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';
import type { HelpTarget } from './help-links.logic';
import { lineActions } from './struggling.logic';

export function HelplineCard({ line, open, callHint }: { line: Helpline; open: (t: HelpTarget) => void; callHint: string }) {
  const actions = lineActions(line);
  return (
    <Card variant="flat" padding={4} testID={`struggling.${line.id}`}>
      <View className="gap-1">
        <Text variant="headline" asHeading={3}>
          {line.name}
        </Text>
        <Text variant="subhead" tone="muted">
          {line.how}
        </Text>
      </View>
      <ButtonRow gap={2}>
        {actions.map((a) => (
          <Button
            key={a.kind}
            size="sm"
            variant="secondary"
            label={a.label}
            accessibilityLabel={a.a11y}
            accessibilityHint={a.kind === 'call' ? callHint : copy.helpLinks.textHint}
            onPress={() => open(a.target)}
            testID={`struggling.${line.id}.${a.kind}`}
          />
        ))}
      </ButtonRow>
    </Card>
  );
}
