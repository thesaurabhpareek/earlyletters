/**
 * The one ask for the speech download, at the end of first run (D-087, Q-015 3.3).
 *
 * Nothing downloads until the person taps "Download on Wi-Fi". "Not now" keeps the voice: the first
 * Review then offers the same button. The size comes from this phone's model plan (never a typed number);
 * when the phone cannot hold it yet, the card says how much space it needs and offers no button, because
 * there is nothing to decide. Wi-Fi only, resume and the reserve are the pack engine's rules, unchanged.
 */
import { speechConsentCopy } from '@scribe/content';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { announce } from '@/lib/a11y';
import { fill } from '@/lib/copy';
import type { SpeechLanguage } from '@/lib/models/catalog';
import { setSpeechDownloadChoice, speechAskFor, speechDownloadChoice, type SpeechDownloadChoice } from '@/lib/models/speech-consent';
import { formatBytes } from '@/lib/packs/copy';
import { startSpeechDownload } from '@/lib/transcription-queue';

export function SpeechConsentCard({ language }: { language: SpeechLanguage }) {
  const t = speechConsentCopy;
  const ask = useMemo(() => speechAskFor(language), [language]);
  const [choice, setChoice] = useState<SpeechDownloadChoice | null>(() => speechDownloadChoice());

  const yes = () => {
    setChoice('yes');
    announce(t.chosenYes);
    void startSpeechDownload(language); // a tap is the consent; it also records the yes
  };
  const later = () => {
    setSpeechDownloadChoice('later');
    setChoice('later');
    announce(t.chosenLater);
  };

  return (
    <Card padding={5} radius="xl" className="gap-3">
      <Text variant="title2" asHeading={2}>
        {t.title}
      </Text>
      <Text variant="body">{fill(t.body, { size: formatBytes(ask.bytes) })}</Text>
      <Text variant="footnote" tone="muted">
        {t.note}
      </Text>
      {choice === null && ask.kind === 'low_space' ? (
        <Text variant="footnote" accessibilityLiveRegion="polite">
          {fill(t.lowSpace, { size: formatBytes(ask.neededBytes) })}
        </Text>
      ) : null}
      {choice === null && ask.kind === 'ask' ? (
        <View className="gap-1">
          <Button size="lg" fullWidth label={t.downloadButton} onPress={yes} />
          <Button variant="quiet" fullWidth label={t.laterButton} onPress={later} />
        </View>
      ) : null}
      {choice !== null ? (
        <Text variant="callout" accessibilityLiveRegion="polite">
          {choice === 'yes' ? t.chosenYes : t.chosenLater}
        </Text>
      ) : null}
      <Text variant="footnote" tone="muted">
        {t.footnote}
      </Text>
    </Card>
  );
}
