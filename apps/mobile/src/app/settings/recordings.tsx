import { ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy, fill, pendingCopy, plural } from '@/lib/copy';
import { listOrphanAudio } from '@/lib/store';
import { Row, Section } from '@/components/settings/settings-ui';

/**
 * Recordings and backup (PRD C C-REQ-018): honest about where audio lives.
 * Backup is not built yet. Recordings the launch sweep found with no letter
 * (before any book existed) are listed here, never deleted (TDD 01 3.2.4).
 */
export default function Recordings() {
  const r = copy.settings.recordings;
  const b = copy.settings.backup;
  const orphans = listOrphanAudio().length;
  const o = pendingCopy.recordings;
  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <Section title={r.title} footer={r.keepHelp}>
        <Row first title={r.onPhoneTitle} subtitle={r.onPhoneBody} />
      </Section>

      {orphans > 0 && (
        <Section title={o.orphansTitle}>
          <Row first title={plural(orphans, o.orphansOne, fill(o.orphansMany, { count: orphans }))} />
        </Section>
      )}

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
