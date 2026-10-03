import Constants from 'expo-constants';
import { router, type Href } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { CaretDownIcon, CaretUpIcon } from 'phosphor-react-native';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, View, useColorScheme } from 'react-native';
import { brand, supportMailto } from '@scribe/brand';
import { tokens } from '@scribe/design-tokens';
import { Text } from '@/components/ui/text';
import { copy, fill } from '@/lib/copy';
import { listChildren, subscribe, type Child } from '@/lib/store';
import { getAppearance, getReminderCadence, getRemindersPaused } from '@/components/child/child-store';
import { Row, Section } from '@/components/settings/settings-ui';
import { cadenceLabel } from '@/components/settings/labels';

/**
 * Settings home (PRD C, C-REQ-016; PRD B section 9). Every destination is one tap from here.
 *
 * Route contract for screens other streams own (each is a file under src/app/settings/):
 * account, language, plus, export, privacy, storage, delete-account. Reminders, recordings and
 * appearance exist today. Terms and Privacy Policy open the published pages (packages/brand
 * `web.*`); Help writes to the support mailbox with a fixed subject and nothing else in it
 * (LEGAL-REQ-014). The "If you are struggling" lines are always here, never behind a flag (D-034).
 */
const ROUTES = {
  account: '/settings/account',
  language: '/settings/language',
  plus: '/settings/plus',
  reminders: '/settings/reminders',
  export: '/settings/export',
  privacy: '/settings/privacy',
  storage: '/settings/storage',
  recordings: '/settings/recordings',
  appearance: '/settings/appearance',
  deleteAccount: '/settings/delete-account',
} as const satisfies Record<string, string>;

const go = (route: string) => () => router.push(route as Href);

export default function Settings() {
  const read = () => ({
    children: listChildren(),
    appearance: getAppearance(),
    cadence: getReminderCadence(),
    paused: getRemindersPaused(),
  });
  const [s, setS] = useState(read);
  const [struggling, setStruggling] = useState(false);
  useEffect(() => subscribe(() => setS(read())), []);
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];

  const h = copy.settingsHome;
  const m = copy.settingsMore;
  const version = Constants.expoConfig?.version ?? '';
  const build = Constants.expoConfig?.ios?.buildNumber ?? '';
  const versionValue = build ? fill(h.versionValue, { version, build }) : version;

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      {/* "Early version, can make mistakes" stays in the app until the founder ends the beta (D-060). */}
      <View accessible className="gap-1 rounded-[14px] bg-secondary p-4">
        <Text className="text-xs font-semibold tracking-[1.2px] text-primary">{copy.settings.about.beta.label.toUpperCase()}</Text>
        <Text className="text-sm leading-5 text-foreground">{copy.settings.about.beta.body}</Text>
      </View>

      <Section title={h.sections.account}>
        <Row first title={h.accountLabel} subtitle={h.accountHelp} onPress={go(ROUTES.account)} />
        <Row title={h.plusLabel} subtitle={h.plusHelp} onPress={go(ROUTES.plus)} />
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

      <Section title={h.sections.writing}>
        <Row first title={h.languageLabel} subtitle={h.languageHelp} onPress={go(ROUTES.language)} />
        <Row
          title={h.remindersLabel}
          value={s.paused ? copy.settings.reminders.pauseLabel : cadenceLabel(s.cadence)}
          onPress={go(ROUTES.reminders)}
        />
        <Row title={h.appearanceLabel} value={m.themes[s.appearance]} onPress={go(ROUTES.appearance)} />
      </Section>

      <Section title={h.sections.data}>
        <Row first title={h.privacyLabel} subtitle={copy.trust.short} onPress={go(ROUTES.privacy)} />
        <Row title={h.exportLabel} subtitle={h.exportHelp} onPress={go(ROUTES.export)} />
        <Row title={h.recordingsLabel} onPress={go(ROUTES.recordings)} />
        <Row title={h.storageLabel} subtitle={h.storageHelp} onPress={go(ROUTES.storage)} />
      </Section>

      <Section>
        <Row first title={h.deleteAccountLabel} destructive onPress={go(ROUTES.deleteAccount)} />
      </Section>

      <Section title={h.sections.help}>
        <Row
          first
          title={h.helpLabel}
          value={h.helpValue}
          role="link"
          accessibilityHint={brand.support.email}
          onPress={() => Linking.openURL(supportMailto(h.helpSubject))}
        />
        <Pressable
          onPress={() => setStruggling((v) => !v)}
          accessibilityRole="button"
          accessibilityLabel={copy.struggling.title}
          accessibilityHint={h.strugglingA11yHint}
          accessibilityState={{ expanded: struggling }}
          className="min-h-12 flex-row items-center gap-3 border-t border-border px-4 py-3 active:bg-secondary">
          <Text className="flex-1 text-base text-foreground">{copy.struggling.title}</Text>
          {struggling ? <CaretUpIcon size={16} color={c.textMuted} weight="bold" /> : <CaretDownIcon size={16} color={c.textMuted} weight="bold" />}
        </Pressable>
        {struggling && (
          <View className="gap-1 border-t border-border px-4 py-3">
            <Text className="text-sm leading-5 text-foreground">{copy.struggling.body}</Text>
          </View>
        )}
        {struggling &&
          copy.struggling.resources.map((r) => (
            <Row key={r.tel} title={r.name} subtitle={r.how} role="link" onPress={() => Linking.openURL(`tel:${r.tel}`)} />
          ))}
        {struggling && (
          <View className="border-t border-border px-4 py-3">
            <Text className="text-sm leading-5 text-muted-foreground">{copy.struggling.emergency}</Text>
          </View>
        )}
        <Row title={h.termsLabel} role="link" onPress={() => WebBrowser.openBrowserAsync(brand.web.terms)} />
        <Row title={h.privacyPolicyLabel} role="link" onPress={() => WebBrowser.openBrowserAsync(brand.web.privacy)} />
      </Section>

      <Section title={copy.settings.about.title} footer={`${copy.settings.neverRewrite} ${copy.trust.short}`}>
        <Row first title={h.versionLabel} value={versionValue} />
      </Section>
    </ScrollView>
  );
}
