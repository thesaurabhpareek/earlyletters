import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { DEFAULT_VIEW_SETTING, viewFromSetting, type ReviewView } from '@/components/capture/review-view.logic';
import { promiseSample, sampleA11yLabel } from '@/components/onboarding/promise-sample.logic';
import { Card } from '@/components/ui/card';
import { ChoiceGroup } from '@/components/ui/choice-group';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/a11y';
import { copy, fill } from '@/lib/copy';
import { getSetting, setSetting } from '@/lib/store';

/**
 * Settings > Your words (settings-ia.md 4; design.md 2.8; SETTINGS_AND_ACCOUNT.md 8). Two named choices replace the
 * "Word for word" switch, whose one label could not name both (founder, build 1). The stored setting is unchanged:
 * `review.defaultView`, 'fixes' or 'exact' (D-086), the default for new letters; Review's own control still changes
 * any single letter. The choice is a ChoiceGroup list (radio semantics; `tap` haptic on change, announced natively).
 *
 * The example is static: the onboarding sample sentence, cleaned by the real engine in packages/core
 * (promise-sample.logic.ts), with the words a small fix took out struck through and muted, as Review marks them. In
 * "Exactly as said" it shows the sentence as spoken. Nothing here is interactive besides the choice.
 */
export default function YourWords() {
  const w = copy.yourWords;
  const [view, setView] = useState<ReviewView>(() => viewFromSetting(getSetting(DEFAULT_VIEW_SETTING)));
  const choose = (v: ReviewView) => {
    setView(v);
    setSetting(DEFAULT_VIEW_SETTING, v);
  };
  return (
    <ScrollView contentContainerClassName="gap-7 px-5 pb-12 pt-4" contentInsetAdjustmentBehavior="automatic">
      <ChoiceGroup
        label={w.title}
        layout="list"
        value={view}
        onChange={choose}
        testID="yourWords.choice"
        options={[
          { value: 'fixes', label: w.marked.label, description: w.marked.line },
          { value: 'exact', label: w.exact.label, description: w.exact.line },
        ]}
      />
      <Example marked={view === 'fixes'} />
      <View className="gap-2 px-4">
        <Text variant="footnote">{w.footer}</Text>
        {/* Registered text (experience-pass REGISTERED): Settings keeps saying the engine can mishear. Moved here with
            the switch from Recordings' "How transcription works". */}
        <Text variant="footnote">{copy.settings.help.mistakes}</Text>
      </View>
    </ScrollView>
  );
}

function Example({ marked }: { marked: boolean }) {
  const { c } = useTheme();
  const p = copy.onboarding.promise;
  const sample = useMemo(() => promiseSample(p.sampleRaw), [p.sampleRaw]);
  const label = marked ? sampleA11yLabel(sample, [], (words) => fill(copy.review.removedWordsA11y, { name: words })) : p.sampleRaw;
  return (
    <Card variant="raised" radius="md" padding={4} className="gap-2">
      <Text variant="caption" caps tone="muted">
        {p.sampleLabel}
      </Text>
      <View accessible accessibilityRole="text" accessibilityLabel={label} testID="yourWords.example">
        {marked ? (
          <Text variant="letterBody">
            {sample.pieces.map((piece, i) =>
              piece.kind === 'word' ? (
                <Text key={i} variant="letterBody">{`${piece.text} `}</Text>
              ) : (
                <Text key={i} variant="letterBody" style={{ color: c.textMuted, textDecorationLine: 'line-through', textDecorationColor: c.editMark }}>
                  {`${piece.text} `}
                </Text>
              ),
            )}
          </Text>
        ) : (
          <Text variant="letterBody">{p.sampleRaw}</Text>
        )}
      </View>
    </Card>
  );
}
