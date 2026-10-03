// android: same
/**
 * 18+ entry gate (PRD-REQ-019, LEGAL-REQ-002, K-07). Rendered by the root
 * layout instead of any route, so nothing (first run, Tonight, an invite or
 * any deep link) is reachable until it passes.
 *
 * Neutral question, nothing preselected. Yes stores a boolean only. No shows
 * a calm stop screen and stores only the time of the No (DECISIONS D-026); no
 * child, letter, recording or request exists afterwards. The stop screen has
 * no way back until those 24 hours have passed; only then does it offer
 * "I answered by mistake".
 */
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { answerAgeGate, reopenAgeGate } from '@/lib/age-gate';
import type { GateDecision } from '@/lib/age-gate.logic';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';

interface Props {
  decision: Exclude<GateDecision, 'pass'>;
  refresh: () => void;
}

export function AgeGateScreen({ decision, refresh }: Props) {
  const g = copy.ageGate;
  const [view, setView] = useState<'ask' | 'stop'>(decision);
  const [adult, setAdult] = useState<boolean | null>(null); // nothing preselected (K-07)

  // Announce the stop screen (iOS has no live regions in RN; TDD 09 A11Y-F08).
  useEffect(() => {
    if (view === 'stop') AccessibilityInfo.announceForAccessibility(g.stopTitle);
  }, [view, g.stopTitle]);

  const submit = () => {
    if (adult === null) return;
    haptic('tap');
    answerAgeGate(adult ? 'yes' : 'no');
    if (!adult) setView('stop');
    refresh();
  };

  const answeredByMistake = () => {
    haptic('tap');
    reopenAgeGate();
    setAdult(null);
    setView('ask');
    refresh();
  };

  const segment = (selected: boolean, label: string, onPress: () => void) => (
    <Pressable
      onPress={() => {
        haptic('tap');
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      className={`min-h-12 flex-1 items-center justify-center rounded-full border px-4 py-2 ${selected ? 'border-primary bg-secondary' : 'border-muted-foreground bg-card'}`}>
      <Text className={`text-center text-lg text-foreground ${selected ? 'font-semibold' : ''}`}>{label}</Text>
    </Pressable>
  );

  if (view === 'stop') {
    // The window has passed while this screen was open (or on a relaunch): only then is a way back offered.
    const windowPassed = decision === 'ask';
    return (
      <SafeAreaView className="flex-1 bg-background">
        <ScrollView contentContainerClassName="flex-grow justify-center gap-5 px-5 py-10">
          <View accessibilityLiveRegion="polite" className="gap-4">
            <Text role="heading" className="font-serif text-4xl leading-[44px] text-foreground">
              {g.stopTitle}
            </Text>
            <Text className="text-xl leading-8 text-foreground">{g.stopBody}</Text>
            <Text className="text-base leading-6 text-muted-foreground">{g.stopNote}</Text>
          </View>
          {windowPassed && (
            <Button size="lg" variant="secondary" onPress={answeredByMistake}>
              <Text>{g.mistakeButton}</Text>
            </Button>
          )}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-grow gap-5 px-5 pb-6 pt-16">
        <View className="flex-1 gap-5">
          <Text role="heading" className="font-serif text-4xl leading-[44px] text-foreground">
            {g.title}
          </Text>
          <Text className="text-lg text-muted-foreground">{g.body}</Text>
          <View className="flex-row flex-wrap gap-3" accessibilityRole="radiogroup" accessibilityLabel={g.title}>
            {segment(adult === true, g.yesButton, () => setAdult(true))}
            {segment(adult === false, g.noButton, () => setAdult(false))}
          </View>
        </View>
        {/* Controls never animate in (MOTION principle 2). */}
        <Button size="lg" disabled={adult === null} onPress={submit}>
          <Text>{copy.common.continueButton}</Text>
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}
