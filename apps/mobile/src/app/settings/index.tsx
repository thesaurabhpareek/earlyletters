import Constants from 'expo-constants';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { brand } from '@scribe/brand';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';
import { listChildren, subscribe, type Child } from '@/lib/store';
import { getAppearance, getReadingSize, getReminderCadence, getRemindersPaused } from '@/components/child/child-store';
import { Row, Section } from '@/components/settings/settings-ui';
import { cadenceLabel } from '@/components/settings/labels';

/** Settings home (PRD C, C-REQ-016; PRD B section 9). */
export default function Settings() {
  const read = () => ({
    children: listChildren(),
    appearance: getAppearance(),
    size: getReadingSize(),
    cadence: getReminderCadence(),
    paused: getRemindersPaused(),
  });
  const [s, setS] = useState(read);
  useEffect(() => subscribe(() => setS(read())), []);

  const m = copy.settingsMore;
  const version = Constants.expoConfig?.version ?? '';

  return (
    <ScrollView contentContainerClassName="gap-7 px-4 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <View accessible className="gap-1 rounded-[14px] bg-secondary p-4">
        <Text className="text-xs font-semibold tracking-[1.2px] text-primary">{copy.settings.about.beta.label.toUpperCase()}</Text>
        <Text className="text-sm leading-5 text-foreground">{copy.settings.about.beta.body}</Text>
      </View>

      <Section title={m.accountTitle} footer={m.signedOutHelp}>
        <Row first title={m.signedOutLabel} disabled />
      </Section>

      <Section title={copy.children.settings.sectionTitle}>
        {s.children.map((ch: Child, i) => (
          <Row
            key={ch.id}
            first={i === 0}
            title={ch.name}
            value={ch.birthday || ch.dueDate ? undefined : copy.childrenExtra.notSet}
            onPress={() => router.push({ pathname: '/settings/children/[id]', params: { id: ch.id } })}
          />
        ))}
        <Row first={s.children.length === 0} title={copy.children.switcher.addButton} onPress={() => router.push('/settings/children/new')} />
      </Section>

      <Section title={copy.settings.sections.reminders}>
        <Row
          first
          title={copy.settings.reminders.cadenceLabel}
          value={s.paused ? copy.settings.reminders.pauseLabel : cadenceLabel(s.cadence)}
          onPress={() => router.push('/settings/reminders')}
        />
      </Section>

      <Section title={m.appearanceTitle}>
        <Row first title={m.themeLabel} value={m.themes[s.appearance]} onPress={() => router.push('/settings/appearance')} />
        <Row title={copy.reader.readingSizeTitle} value={copy.reader.sizes[s.size]} onPress={() => router.push('/settings/appearance')} />
      </Section>

      <Section title={copy.settings.sections.voice}>
        <Row first title={copy.settings.recordings.onPhoneTitle} subtitle={copy.settings.recordings.onPhoneBody} onPress={() => router.push('/settings/recordings')} />
      </Section>

      <Section title={copy.settings.sections.data}>
        <Row first title={copy.settings.export.title} subtitle={`${copy.settings.export.body} ${m.exportNotYet}`} disabled />
        <Row title={copy.settings.delete.accountTitle} subtitle={m.deleteAccountNotYet} destructive disabled />
      </Section>

      <Section title={m.legalTitle}>
        <Row first title={copy.plus.legal.termsLink} disabled />
        <Row title={copy.plus.legal.privacyLink} role="link" onPress={() => WebBrowser.openBrowserAsync(brand.company.privacyUrl)} />
      </Section>

      <Section title={copy.settings.about.title} footer={`${copy.settings.neverRewrite} ${copy.settings.privacyLine}`}>
        <Row first title={m.versionLabel} value={version} />
      </Section>
    </ScrollView>
  );
}
