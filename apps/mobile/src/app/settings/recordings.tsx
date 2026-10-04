import { Alert, ScrollView } from 'react-native';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { copy, fill, pendingCopy, plural } from '@/lib/copy';
import { listOrphanAudio } from '@/lib/store';
import { authorSpeechLanguage } from '@/lib/models/author-language';
import { SPEECH_MODELS, VAD_MODEL_ID, type SpeechLanguage } from '@/lib/models/catalog';
import { speechSettingsCopy } from '@/lib/models/copy';
import { planFor, speechPackHost } from '@/lib/models/speech-packs';
import { removeSpeechPack, speechDownloadHold, startSpeechDownload, speechDownloadProgress, wordsState } from '@/lib/transcription-queue';
import { languageNames } from '@/lib/transcription-queue/copy';
import { useWordsTick } from '@/lib/transcription-queue/use-words';

/**
 * Recordings (PRD C C-REQ-018): honest about where audio lives. v1.0 has no
 * backup and uploads no recordings (D-059), so this screen offers none and
 * says nothing about one arriving. Recordings the launch sweep found with no
 * letter (before any book existed) are listed here, never deleted (TDD 01
 * 3.2.4).
 *
 * Speech on this phone (founder decision 15, ADR 0015): each language in use
 * shows whether its speech files are here, downloading or waiting for Wi-Fi,
 * with their size. Removing one frees space; recordings and letters stay,
 * and new recordings wait for their words.
 */
export default function Recordings() {
  const r = copy.settings.recordings;
  const orphans = listOrphanAudio().length;
  const o = pendingCopy.recordings;
  useWordsTick();
  const languages = languagesInUse();

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <ListSection title={r.title} footer={r.keepHelp}>
        <ListRow title={r.onPhoneTitle} subtitle={r.onPhoneBody} />
      </ListSection>

      {orphans > 0 && (
        <ListSection title={o.orphansTitle}>
          <ListRow title={plural(orphans, o.orphansOne, fill(o.orphansMany, { count: orphans }))} />
        </ListSection>
      )}

      <ListSection title={speechSettingsCopy.title} footer={speechSettingsCopy.footer}>
        {languages.map((lang) => (
          <SpeechRow key={lang} language={lang} />
        ))}
      </ListSection>

      <ListSection title={copy.settings.help.mistakesTitle} footer={copy.settings.help.mistakes}>
        <ListRow title={copy.settings.tidyLabel} subtitle={copy.settings.tidyHelp} />
      </ListSection>
    </ScrollView>
  );
}

/** The author's language, plus any language a waiting recording was spoken in; only languages with a speech model (one row each). */
function languagesInUse(): SpeechLanguage[] {
  const langs = new Set<SpeechLanguage>([authorSpeechLanguage()]);
  for (const job of Object.values(wordsState().jobs)) langs.add(job.language);
  return [...langs].filter((l) => !!planFor([l]).asr[l]);
}

/**
 * This language's speech files: on the phone, downloading, or held. null where files cannot be
 * read at all (the web design preview, where expo-file-system has no Directory): the row then
 * shows the size and offers nothing.
 */
function speechFiles(language: SpeechLanguage, packs: readonly string[]) {
  try {
    const host = speechPackHost();
    return {
      installed: packs.every((id) => host.packPath(id) !== null),
      progress: speechDownloadProgress(language),
      hold: speechDownloadHold(language),
    };
  } catch {
    return null;
  }
}

function SpeechRow({ language }: { language: SpeechLanguage }) {
  const s = speechSettingsCopy;
  const plan = planFor([language]);
  const asrId = plan.asr[language];
  if (!asrId) return null;
  const mb = Math.round(plan.bytes / 1e6);
  const files = speechFiles(language, plan.packs);
  const installed = files?.installed === true;
  const progress = files?.progress ?? null;
  const hold = files?.hold ?? null;
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
    <ListRow
      title={name}
      subtitle={subtitle}
      onPress={!files ? undefined : installed ? confirmRemove : progress === null && hold === null ? () => void startSpeechDownload(language) : undefined}
      accessibilityHint={installed ? s.removeHint : s.downloadHint}
    />
  );
}
