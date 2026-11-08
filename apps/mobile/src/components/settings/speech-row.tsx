import { Alert, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { speechRow, type SpeechRowState } from '@/components/settings/recordings.logic';
import { ListRow } from '@/components/ui/list-row';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { fill } from '@/lib/copy';
import { authorSpeechLanguage } from '@/lib/models/author-language';
import { SPEECH_MODELS, VAD_MODEL_ID, type SpeechLanguage } from '@/lib/models/catalog';
import { speechSettingsCopy } from '@/lib/models/copy';
import { planFor, speechPackHost } from '@/lib/models/speech-packs';
import { removeSpeechPack, speechDownloadHold, startSpeechDownload, speechDownloadProgress, wordsState } from '@/lib/transcription-queue';
import { languageNames } from '@/lib/transcription-queue/copy';

/**
 * One row per spoken language in use: whether its speech files are on this phone, downloading or waiting, with their
 * size, and Download or Remove (founder decision 15, ADR 0015; EXPERIENCE_PASS S42). Moved from Recordings to
 * Storage on 8 Nov 2026 (settings-ia.md 4: language download lives only in Storage). The size of a language includes
 * the listening detector it needs, so the detector is never a row of its own. Removing one frees space; recordings
 * and letters stay, and new recordings wait for their words.
 */

/** Every pack a language row stands for (its speech model and the detector): Storage leaves these out of its list. */
export function packsShownAsLanguages(languages: readonly SpeechLanguage[]): Set<string> {
  return new Set(languages.flatMap((l) => planFor([l]).packs));
}

/** The author's language, plus any language a waiting recording was spoken in; only languages with a speech model (one row each). */
export function languagesInUse(): SpeechLanguage[] {
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

export function SpeechRow({ language }: { language: SpeechLanguage }) {
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
      testID={`storage.language.${language}`}
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
