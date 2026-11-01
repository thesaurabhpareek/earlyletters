import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { DEFAULT_VIEW_SETTING, viewFromSetting } from '@/components/capture/review-view.logic';
import { recordingsCard, speechRow, type SpeechRowState } from '@/components/settings/recordings.logic';
import { ListRow, ListSection, ToggleRow } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { backupInBuild, loadBackup } from '@/lib/backup/gate';
import { copy, fill, pendingCopy, plural } from '@/lib/copy';
import { countUnrecoverableTakes, getSetting, listOrphanAudio, setSetting } from '@/lib/store';
import { authorSpeechLanguage } from '@/lib/models/author-language';
import { SPEECH_MODELS, VAD_MODEL_ID, type SpeechLanguage } from '@/lib/models/catalog';
import { speechSettingsCopy } from '@/lib/models/copy';
import { planFor, speechPackHost } from '@/lib/models/speech-packs';
import { removeSpeechPack, speechDownloadHold, startSpeechDownload, speechDownloadProgress, wordsState } from '@/lib/transcription-queue';
import { languageNames } from '@/lib/transcription-queue/copy';
import { useWordsTick } from '@/lib/transcription-queue/use-words';

/**
 * Recordings (PRD C C-REQ-018; EXPERIENCE_PASS_2026-10 S42, package P6): honest about where audio lives. The card
 * at the top reads backup's own state (components/settings/recordings.logic.ts): a build without backup, backup off,
 * or backup on; the two option-B lines wait for counsel (C7), so a build with backup keeps today's card until then.
 * No fact is said twice on the screen. A take a kill cut off that would not play is kept and listed
 * here (D-085). Recordings the launch sweep found with no
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
  const unplayable = countUnrecoverableTakes();
  const o = pendingCopy.recordings;
  useWordsTick();
  const languages = languagesInUse();
  const backupStatus = useBackupStatus();
  const card = recordingsCard({ inBuild: backupInBuild(), status: backupStatus });

  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <ListSection title={r.title} footer={card.footer ?? undefined}>
        <ListRow title={card.title} subtitle={card.body} testID="recordings.card" />
        {card.backupRow ? <ListRow title={card.backupRow} trailing="chevron" onPress={() => router.push('/settings/backup' as Href)} /> : null}
      </ListSection>

      {orphans > 0 && (
        <ListSection title={o.orphansTitle}>
          <ListRow title={plural(orphans, o.orphansOne, fill(o.orphansMany, { count: orphans }))} />
        </ListSection>
      )}

      {unplayable > 0 && (
        <ListSection title={r.unplayableTitle}>
          <ListRow title={plural(unplayable, r.unplayableOne, fill(r.unplayableMany, { count: unplayable }))} />
        </ListSection>
      )}

      <ListSection title={speechSettingsCopy.title} footer={speechSettingsCopy.footer}>
        {languages.map((lang) => (
          <SpeechRow key={lang} language={lang} />
        ))}
      </ListSection>

      <ListSection title={copy.settings.help.mistakesTitle} footer={`${copy.settings.tidyHelp} ${copy.settings.help.mistakes}`}>
        <WordForWordSwitch />
      </ListSection>
    </ScrollView>
  );
}

/** Backup's status kind, re-read when backup reports a change; null in a build without backup or before it knows. */
function useBackupStatus(): string | null {
  const read = () => loadBackup()?.backupView()?.status.kind ?? null;
  const [status, setStatus] = useState<string | null>(read);
  useEffect(() => loadBackup()?.subscribeBackup(() => setStatus(read())), []); // eslint-disable-line react-hooks/exhaustive-deps
  return status;
}

/**
 * "Word for word" (D-086): the default for new letters. On: small fixes, marked, each one tappable and
 * reversible. Off: new letters open as "Exactly as said". Review's own control still changes any single letter.
 */
function WordForWordSwitch() {
  const [fixes, setFixes] = useState(() => viewFromSetting(getSetting(DEFAULT_VIEW_SETTING)) === 'fixes');
  return (
    <ToggleRow
      title={copy.settings.tidyLabel}
      description={fixes ? copy.settings.tidyOn : copy.settings.tidyOff}
      value={fixes}
      onValueChange={(on) => {
        setFixes(on);
        setSetting(DEFAULT_VIEW_SETTING, on ? 'fixes' : 'exact');
      }}
    />
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
  const name = languageNames[language];
  const state: SpeechRowState = !files
    ? { kind: 'unknown', mb }
    : files.installed
      ? { kind: 'here', mb: Math.round((SPEECH_MODELS[asrId].bytes + SPEECH_MODELS[VAD_MODEL_ID].bytes) / 1e6) }
      : files.hold === 'waiting_for_wifi'
        ? { kind: 'waitingForWifi', mb }
        : files.hold === 'no_space'
          ? { kind: 'noSpace', mb }
          : files.progress !== null
            ? { kind: 'downloading', fraction: files.progress }
            : { kind: 'absent', mb };
  const row = speechRow(state);

  const confirmRemove = () =>
    Alert.alert(fill(s.confirmTitle, { name }), fill(s.confirmBody, { name }), [
      { text: s.cancelButton, style: 'cancel' },
      { text: s.confirmButton, style: 'destructive', onPress: () => void removeSpeechPack(asrId) },
    ]);

  // One element for VoiceOver: the row is the button, its trailing word says what a tap does (S42).
  return (
    <ListRow
      title={name}
      subtitle={row.subtitle}
      trailing={row.trailing ? <TrailingWord text={row.trailing} /> : row.percent !== null ? <ProgressRing percent={row.percent} /> : 'none'}
      onPress={row.action === 'remove' ? confirmRemove : row.action === 'download' ? () => void startSpeechDownload(language) : undefined}
      accessibilityHint={row.hint}
      testID={`recordings.language.${language}`}
    />
  );
}

/** The row's action in words, in accent, like an iOS Settings text button. Part of the row's one element. */
function TrailingWord({ text }: { text: string }) {
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants">
      <Text variant="body" tone="accent">
        {text}
      </Text>
    </View>
  );
}

/** A small determinate ring beside "Getting ready, 40%": it steps with progress and never spins (Reduce Motion needs nothing). */
function ProgressRing({ percent }: { percent: number }) {
  const { c } = useTheme();
  const size = 22;
  const stroke = 2.5;
  const r = (size - stroke) / 2;
  const length = 2 * Math.PI * r;
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" aria-hidden>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={c.accent}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${length} ${length}`}
          strokeDashoffset={length * (1 - percent / 100)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}
