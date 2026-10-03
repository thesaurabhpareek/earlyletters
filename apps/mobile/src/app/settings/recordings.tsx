import { Alert, ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy, fill, pendingCopy, plural } from '@/lib/copy';
import { listOrphanAudio } from '@/lib/store';
import { Row, Section } from '@/components/settings/settings-ui';
import { authorSpeechLanguage } from '@/lib/models/author-language';
import { SPEECH_MODELS, VAD_MODEL_ID, type SpeechLanguage } from '@/lib/models/catalog';
import { speechSettingsCopy } from '@/lib/models/copy';
import { planFor, speechPackHost } from '@/lib/models/speech-packs';
import { removeSpeechPack, requestSpeechFor, speechDownloadHold, speechDownloadProgress, wordsState } from '@/lib/transcription-queue';
import { languageNames } from '@/lib/transcription-queue/copy';
import { useWordsTick } from '@/lib/transcription-queue/use-words';

/**
 * Recordings and backup (PRD C C-REQ-018): honest about where audio lives.
 * Backup is not built yet. Recordings the launch sweep found with no letter
 * (before any book existed) are listed here, never deleted (TDD 01 3.2.4).
 *
 * Speech on this phone (founder decision 15, ADR 0015): each language in use
 * shows whether its speech files are here, downloading or waiting for Wi-Fi,
 * with their size. Removing one frees space; recordings and letters stay,
 * and new recordings wait for their words.
 */
export default function Recordings() {
  const r = copy.settings.recordings;
  const b = copy.settings.backup;
  const orphans = listOrphanAudio().length;
  const o = pendingCopy.recordings;
  useWordsTick();
  const languages = languagesInUse();

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

      <Section title={speechSettingsCopy.title} footer={speechSettingsCopy.footer}>
        {languages.map((lang, i) => (
          <SpeechRow key={lang} language={lang} first={i === 0} />
        ))}
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

/** The author's language, plus any language a waiting recording was spoken in. */
function languagesInUse(): SpeechLanguage[] {
  const langs = new Set<SpeechLanguage>([authorSpeechLanguage()]);
  for (const job of Object.values(wordsState().jobs)) langs.add(job.language);
  return [...langs];
}

function SpeechRow({ language, first }: { language: SpeechLanguage; first: boolean }) {
  const s = speechSettingsCopy;
  const host = speechPackHost();
  const plan = planFor([language]);
  const asrId = plan.asr[language];
  if (!asrId) return null;
  const mb = Math.round(plan.bytes / 1e6);
  const installed = plan.packs.every((id) => host.packPath(id) !== null);
  const progress = speechDownloadProgress(language);
  const hold = speechDownloadHold(language);
  const name = languageNames[language];

  const subtitle = installed
    ? fill(s.ready, { n: Math.round((SPEECH_MODELS[asrId].bytes + SPEECH_MODELS[VAD_MODEL_ID].bytes) / 1e6) })
    : hold === 'waiting_for_wifi'
      ? fill(s.waitingForWifi, { n: mb })
      : hold === 'no_space'
        ? fill(s.noSpace, { n: mb })
        : progress !== null
          ? fill(s.downloading, { n: Math.floor(progress * 100) })
          : fill(s.absent, { n: mb });

  const confirmRemove = () =>
    Alert.alert(fill(s.confirmTitle, { name }), fill(s.confirmBody, { name }), [
      { text: s.cancelButton, style: 'cancel' },
      { text: s.confirmButton, style: 'destructive', onPress: () => void removeSpeechPack(asrId) },
    ]);

  return (
    <Row
      first={first}
      title={name}
      subtitle={subtitle}
      onPress={installed ? confirmRemove : progress === null && hold === null ? () => void requestSpeechFor(language) : undefined}
      accessibilityHint={installed ? s.removeHint : s.downloadHint}
    />
  );
}
