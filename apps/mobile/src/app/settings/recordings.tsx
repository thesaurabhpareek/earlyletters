import { ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';
import { Row, Section } from '@/components/settings/settings-ui';

/** Recordings and backup (PRD C C-REQ-018): honest about where audio lives. Backup is not built yet. */
export default function Recordings() {
  const r = copy.settings.recordings;
  const b = copy.settings.backup;
  return (
    <ScrollView contentContainerClassName="gap-7 px-4 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Section title={r.title} footer={r.keepHelp}>
        <Row first title={r.onPhoneTitle} subtitle={r.onPhoneBody} />
      </Section>

      <Section title={b.title} footer={b.honestNote}>
        <Row first title={b.offLabel} subtitle={b.body} />
      </Section>

      <View className="gap-2">
        <Button variant="outline" disabled accessibilityHint={copy.settingsMore.backupNotYet}>
          <Text>{b.turnOnButton}</Text>
        </Button>
        <Text className="text-center text-sm text-muted-foreground">{copy.settingsMore.backupNotYet}</Text>
      </View>

      <Section title={copy.settings.help.mistakesTitle} footer={copy.settings.help.mistakes}>
        <Row first title={copy.settings.tidyLabel} subtitle={copy.settings.tidyHelp} />
      </Section>
    </ScrollView>
  );
}
