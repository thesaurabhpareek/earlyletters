/**
 * The one ask for the speech download, at the end of first run (D-087, Q-015 3.3; EXPERIENCE_PASS S08).
 *
 * Nothing downloads until the person taps "Download on Wi-Fi". "Not now" keeps the voice: the first
 * Review then offers the same button. The size comes from this phone's model plan (never a typed number);
 * when the phone cannot hold it yet, the card says how much space it needs and offers no button, because
 * there is nothing to decide. When the words are already on this phone there is no card at all. Wi-Fi only,
 * resume and the reserve are the pack engine's rules, unchanged.
 *
 * Look (S08): a quiet card under "The book is open." (`accentSoft`, radius md, 16 pt padding): the title in
 * `headline`, one footnote line, then a bordered "Download on Wi-Fi" and a quiet "Not now" side by side at their
 * own widths (stacked at accessibility sizes). The screen's one filled button stays "Write the first one". After a choice the card
 * folds to one line on `standard`: "Getting ready, 40%" with a thin determinate line (track `controlBorder`) only
 * while bytes move; a wait (Wi-Fi, space, its turn), a check or a failure (with Try again) is said in words, never
 * as 0% (speech-consent-card.logic.ts). Under it, while the download is on its way, one still footnote: "You can
 * start now. Your voice is kept, and the words follow." (true: a recording made now waits as `waiting_for_pack` and
 * is kept). A failure a tap can help with leads with "The download stopped." Or "Your voice is kept either way."
 */
import { speechConsentCopy } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { announce, useIsLargeText } from '@/lib/a11y';
import { fill } from '@/lib/copy';
import type { SpeechLanguage } from '@/lib/models/catalog';
import { setSpeechDownloadChoice, speechAskFor, speechDownloadChoice, type SpeechDownloadChoice } from '@/lib/models/speech-consent';
import { shownPercent } from '@/lib/models/speech-download.logic';
import { installedPathsFor } from '@/lib/models/speech-packs';
import { useMotion } from '@/lib/motion';
import { formatBytes, packsCopy } from '@/lib/packs/copy';
import { startSpeechDownload } from '@/lib/transcription-queue';
import { useSpeechDownload } from '@/lib/transcription-queue/use-words';
import { barScale, consentLine, doneLine, showsStartNow, stateAnnouncement, type ConsentLine } from './speech-consent-card.logic';

/** True when this phone already has everything the language needs to write words down. */
function onThisPhone(language: SpeechLanguage): boolean {
  try {
    return installedPathsFor(language) !== null;
  } catch {
    // Where speech files cannot be read at all (the web design preview), the ask is shown.
    return false;
  }
}

export function SpeechConsentCard({ language }: { language: SpeechLanguage }) {
  const t = speechConsentCopy;
  const motion = useMotion();
  const largeText = useIsLargeText();
  const ask = useMemo(() => speechAskFor(language), [language]);
  const ready = useMemo(() => onThisPhone(language), [language]);
  const [choice, setChoice] = useState<SpeechDownloadChoice | null>(() => speechDownloadChoice());
  const download = useSpeechDownload(choice === 'yes' && !ready ? language : null);

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

  // A percent and the bar only while bytes move; a wait, a check or a failure is said in words (consentLine).
  const mb = Math.round(ask.bytes / 1e6);
  // Once every file is here the line says so, instead of the line said at the tap (re-read on each download tick).
  const done = choice === 'yes' && onThisPhone(language);
  const line = done ? doneLine(mb) : consentLine(download, mb);
  // VoiceOver has no live regions on iOS: each change of state is announced once (a wait, a check, a failure, done),
  // never a new percent; the percent is the bar's value (stateAnnouncement).
  const said = useRef<ConsentLine | null>(null);
  useEffect(() => {
    if (choice !== 'yes') return;
    const text = stateAnnouncement(said.current, line);
    said.current = line;
    if (text) announce(text);
  }, [choice, line]);

  // The words are already on this phone: nothing to ask.
  if (ready) return null;

  const retry = () => {
    announce(t.chosenYes);
    void startSpeechDownload(language);
  };
  return (
    <Animated.View layout={motion.layout('standard')} className="gap-2 rounded-md bg-secondary p-4" testID="speech.card">
      {choice === null ? (
        <>
          <Text variant="headline" asHeading={2}>
            {t.title}
          </Text>
          <Text variant="footnote" tone="default">
            {fill(t.body, { size: formatBytes(ask.bytes) })}
          </Text>
          {ask.kind === 'low_space' ? (
            <Text variant="footnote" tone="default" accessibilityLiveRegion="polite">
              {fill(t.lowSpace, { size: formatBytes(ask.neededBytes) })}
            </Text>
          ) : (
            // Side by side at their own widths (equal halves would break "Download on Wi-Fi" in two); stacked at
            // accessibility sizes, the download first.
            <View className={largeText ? 'items-start gap-1 pt-1' : 'flex-row flex-wrap items-center gap-2 pt-1'}>
              <Button variant="outline" size="sm" label={t.downloadButton} onPress={yes} />
              <Button variant="quiet" size="sm" label={t.laterButton} onPress={later} />
            </View>
          )}
        </>
      ) : choice === 'yes' ? (
        <View className="gap-2">
          {line.lead ? <Text variant="callout">{line.lead}</Text> : null}
          {line.bar === null ? (
            <Text variant={line.lead ? 'footnote' : 'callout'} tone="default">
              {line.text}
            </Text>
          ) : (
            <>
              {/* VoiceOver hears this from the progress line below: its label, and the percent as its value. */}
              <Text variant="callout" accessibilityElementsHidden importantForAccessibility="no">
                {line.text}
              </Text>
              <ProgressLine bar={line.bar} reduced={motion.reduced} />
            </>
          )}
          {line.retry ? (
            <View className="items-start">
              <Button variant="outline" size="sm" label={packsCopy.retryButton} onPress={retry} />
            </View>
          ) : null}
          {showsStartNow(download, done) ? (
            <Text variant="footnote" tone="default" testID="speech.startNow">
              {t.startNow}
            </Text>
          ) : null}
        </View>
      ) : (
        <Text variant="callout" accessibilityLiveRegion="polite">
          {t.chosenLater}
        </Text>
      )}
    </Animated.View>
  );
}

/**
 * A thin determinate line (HIG Progress indicators), drawn from the true fraction so bytes under 1% still show.
 * Track `controlBorder` (bg-input, about 3.2:1 on accentSoft), fill `accent` (bg-primary). The fill grows by scaleX
 * from the leading edge on `snappy`, never by width; under Reduce Motion it steps to each new value. VoiceOver reads
 * "Downloading" and the whole percent as its value, with no number below 1% (shownPercent).
 */
function ProgressLine({ bar, reduced }: { bar: number; reduced: boolean }) {
  const target = barScale(bar);
  const scale = useSharedValue(target);
  useEffect(() => {
    const s = tokens.motion.snappy;
    scale.value = reduced ? target : withSpring(target, { stiffness: s.stiffness, damping: s.damping, mass: s.mass, reduceMotion: ReduceMotion.System });
  }, [target, reduced, scale]);
  const fillStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: scale.value }] }));
  const n = shownPercent(bar);
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={packsCopy.phases.downloading}
      accessibilityValue={n === null ? undefined : { min: 0, max: 100, now: n }}
      className="h-1 overflow-hidden rounded-full bg-input">
      <Animated.View className="h-1 w-full bg-primary" style={[{ transformOrigin: 'left' }, fillStyle]} />
    </View>
  );
}
