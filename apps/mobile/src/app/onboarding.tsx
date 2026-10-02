/**
 * First run (PRD B F1, essentials): what we promise, the child's name,
 * birthday or due date, what the child calls you, and a neutral 18+
 * question. One step per screen; Continue is full width at the bottom.
 *
 * Disclosures: the "we can mishear" note sits on the promise step
 * (in-app-disclosures.md 2, help.mistakes). The beta label is NOT shown
 * here: in-app-disclosures.md 1 and PRD.md K-13 limit it to Settings > About.
 * Age: PRD.md K-07 puts the 18+ gate at account creation; we also ask here
 * and store only the yes or no (never an age). "No" keeps local-only use.
 */
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, useColorScheme } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { brand } from '@scribe/brand';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { addChild, getActiveChildId, setActiveChildId, setSetting, todayISO } from '@/lib/store';

type Step = 'welcome' | 'promise' | 'child' | 'signsAs' | 'adult' | 'finish';
const ORDER: Step[] = ['welcome', 'promise', 'child', 'signsAs', 'adult', 'finish'];
const DAY = 864e5;

export default function Onboarding() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const o = copy.onboarding;
  const pc = pendingCopy.onboarding;
  const motion = useMotion();
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [expecting, setExpecting] = useState(false);
  const [birthday, setBirthday] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 60 * DAY));
  const [signsAs, setSignsAs] = useState('');
  const [adult, setAdult] = useState<boolean | null>(null); // nothing preselected (K-07)
  const child = name.trim() || 'your child';

  const next = () => {
    haptic('tap');
    setStep(ORDER[ORDER.indexOf(step) + 1]);
  };

  const back = () => {
    haptic('tap');
    setStep(ORDER[Math.max(0, ORDER.indexOf(step) - 1)]);
  };

  const finish = () => {
    const created = addChild({
      name: name.trim(),
      birthday: expecting ? null : todayISO(birthday),
      dueDate: expecting ? todayISO(dueDate) : null,
      signsAs: signsAs.trim(),
    });
    if (!getActiveChildId() || getActiveChildId() !== created.id) setActiveChildId(created.id);
    // Only the answer is stored, never an age (LEGAL-REQ-002).
    setSetting('ageAttested', adult ? 'yes' : 'no');
    setSetting('ageAttestedAt', new Date().toISOString());
    haptic('success');
    router.replace('/');
  };

  const input = 'h-14 rounded-2xl border border-muted-foreground/60 bg-card px-4 text-lg text-foreground';
  const disabled =
    (step === 'child' && !name.trim()) || (step === 'signsAs' && !signsAs.trim()) || (step === 'adult' && adult === null);

  const cta = {
    welcome: o.welcome.startButton,
    promise: o.promise.cta,
    child: o.child.cta,
    signsAs: o.signsAs.cta,
    adult: copy.common.continueButton,
    finish: o.finish.cta,
  }[step];

  const segment = (selected: boolean, label: string, onPress: () => void) => (
    <Pressable
      onPress={() => {
        haptic('tap');
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={`min-h-11 flex-1 items-center justify-center rounded-full border px-4 py-2 ${selected ? 'border-primary bg-secondary' : 'border-muted-foreground/60 bg-card'}`}>
      <Text className="text-center text-base text-foreground">{label}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow px-6 pb-6" keyboardShouldPersistTaps="handled">
          {step !== 'welcome' && (
            <Button variant="ghost" size="sm" className="mt-2 self-start px-2" onPress={back}>
              <Text className="text-primary">{copy.common.backButton}</Text>
            </Button>
          )}
          <Animated.View key={step} entering={motion.enter()} exiting={FadeOut.duration(120)} className="flex-1 justify-center gap-5 py-10">
            {step === 'welcome' && (
              <>
                <Text role="heading" className="font-serif text-5xl leading-[56px] text-foreground">{o.welcome.title}</Text>
                <Text className="text-xl text-muted-foreground">{o.welcome.subtitle}</Text>
                <Text className="text-lg leading-7 text-foreground">{fill(o.welcome.body, { child: 'your child' })}</Text>
              </>
            )}

            {step === 'promise' && (
              <>
                <Text role="heading" className="font-serif text-4xl leading-[44px] text-foreground">{o.promise.title}</Text>
                <Text className="text-lg leading-7 text-foreground">{o.promise.body}</Text>
                <Text className="text-lg leading-7 text-foreground">{o.promise.body2}</Text>
                <View className="gap-1 rounded-3xl bg-secondary p-5">
                  <Text className="text-lg font-semibold text-foreground">{o.promise.recordingTitle}</Text>
                  <Text className="text-base leading-6 text-foreground">{fill(o.promise.recordingBody, { child: 'your child' })}</Text>
                </View>
                <View className="gap-1 rounded-3xl bg-muted p-5">
                  <Text className="text-lg font-semibold text-foreground">{pc.mishearTitle}</Text>
                  <Text className="text-base leading-6 text-foreground">{copy.settings.help.mistakes}</Text>
                </View>
                <Text className="text-base text-muted-foreground">{o.promise.privateNote}</Text>
              </>
            )}

            {step === 'child' && (
              <>
                <Text role="heading" className="font-serif text-4xl leading-[44px] text-foreground">{o.child.title}</Text>
                <View className="gap-2">
                  <Text className="text-base font-medium text-muted-foreground">{o.child.nameLabel}</Text>
                  <TextInput
                    className={input}
                    value={name}
                    onChangeText={(v) => setName(v.slice(0, 60))}
                    placeholder={o.child.namePlaceholder}
                    placeholderTextColor={c.textMuted}
                    autoCapitalize="words"
                    autoCorrect={false}
                    textContentType="givenName"
                    returnKeyType="done"
                    accessibilityLabel={o.child.nameLabel}
                    accessibilityHint={o.child.nameHelp}
                  />
                  <Text className="text-sm text-muted-foreground">{o.child.nameHelp}</Text>
                </View>
                <View className="flex-row gap-3" accessibilityRole="radiogroup">
                  {segment(!expecting, o.child.birthdayLabel, () => setExpecting(false))}
                  {segment(expecting, o.child.expectingLabel, () => setExpecting(true))}
                </View>
                <View className="gap-2">
                  <Text className="text-base font-medium text-muted-foreground">{expecting ? pc.dueDateLabel : o.child.birthdayLabel}</Text>
                  {expecting ? (
                    <DateTimePicker
                      value={dueDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'compact' : 'default'}
                      minimumDate={new Date()}
                      maximumDate={new Date(Date.now() + 305 * DAY)}
                      accentColor={c.accent}
                      accessibilityLabel={pc.dueDateLabel}
                      onChange={(_, d) => d && setDueDate(d)}
                    />
                  ) : (
                    <DateTimePicker
                      value={birthday}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'compact' : 'default'}
                      maximumDate={new Date()}
                      accentColor={c.accent}
                      accessibilityLabel={o.child.birthdayLabel}
                      onChange={(_, d) => d && setBirthday(d)}
                    />
                  )}
                  <Text className="text-sm text-muted-foreground">
                    {expecting ? o.child.expectingHelp : fill(o.child.birthdayHelp, { child })}
                  </Text>
                </View>
              </>
            )}

            {step === 'signsAs' && (
              <>
                <Text role="heading" className="font-serif text-4xl leading-[44px] text-foreground">{fill(o.signsAs.title, { child })}</Text>
                <Text className="text-lg text-foreground">{o.signsAs.body}</Text>
                <TextInput
                  className={input}
                  value={signsAs}
                  onChangeText={(v) => setSignsAs(v.slice(0, 30))}
                  placeholder={o.signsAs.placeholder}
                  placeholderTextColor={c.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel={fill(o.signsAs.title, { child })}
                />
                <Text className="text-sm text-muted-foreground">{o.signsAs.examplesLabel}</Text>
                <View className="flex-row flex-wrap gap-2">
                  {o.signsAs.examples.map((ex) => (
                    <Pressable
                      key={ex}
                      onPress={() => {
                        haptic('tap');
                        setSignsAs(ex);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected: signsAs === ex }}
                      className={`h-11 justify-center rounded-full border px-4 ${signsAs === ex ? 'border-primary bg-secondary' : 'border-muted-foreground/60 bg-card'}`}>
                      <Text className="text-base text-foreground">{ex}</Text>
                    </Pressable>
                  ))}
                </View>
                {signsAs.trim() ? (
                  <Text className="font-serif text-2xl italic text-primary">{fill(o.signsAs.preview, { signsAs: signsAs.trim() })}</Text>
                ) : (
                  <Text className="text-sm text-muted-foreground">{o.signsAs.notYetHelp}</Text>
                )}
              </>
            )}

            {step === 'adult' && (
              <>
                <Text role="heading" className="font-serif text-4xl leading-[44px] text-foreground">{pc.adultTitle}</Text>
                <Text className="text-lg text-muted-foreground">{pc.adultBody}</Text>
                <View className="flex-row gap-3" accessibilityRole="radiogroup">
                  {segment(adult === true, pc.adultYes, () => setAdult(true))}
                  {segment(adult === false, pc.adultNo, () => setAdult(false))}
                </View>
                {adult === false && (
                  <Text className="text-base leading-6 text-foreground" accessibilityLiveRegion="polite">
                    {fill(pc.adultUnder, { app: brand.name })}
                  </Text>
                )}
              </>
            )}

            {step === 'finish' && (
              <>
                <Text role="heading" className="font-serif text-5xl leading-[56px] text-foreground">{o.finish.title}</Text>
                <Text className="text-xl leading-8 text-foreground">{fill(o.finish.body, { child })}</Text>
              </>
            )}
          </Animated.View>

          {/* Controls never animate in (MOTION principle 2). */}
          <Button size="lg" disabled={disabled} onPress={step === 'finish' ? finish : next}>
            <Text>{cta}</Text>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
