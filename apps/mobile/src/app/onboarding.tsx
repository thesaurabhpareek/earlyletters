/**
 * First run (PRD B F1, essentials): a neutral 18+ question, what we promise,
 * the child's name (twins or more: add them all now, each book is free),
 * birthday or due date, and what the child calls you. One step per screen;
 * Continue is full width at the bottom.
 *
 * Disclosures: the "we can mishear" note sits on the promise step
 * (in-app-disclosures.md 2, help.mistakes). The beta label is NOT shown
 * here: in-app-disclosures.md 1 and PRD.md K-13 limit it to Settings > About.
 * Age (founder decision, Oct 2 2026): 18+ only. Asked first, before any child
 * details, so a "no" leaves nothing behind. "No" shows a calm stop screen with
 * a way back; nothing is stored for it. "Yes" stores only `ageAttested=yes`
 * and the time, never an age or a birthday.
 */
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { PlusIcon, XIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, useColorScheme } from 'react-native';
import Animated, { FadeOut } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { addChild, getActiveChildId, setActiveChildId, setSetting, todayISO } from '@/lib/store';

type Step = 'welcome' | 'adult' | 'stop' | 'promise' | 'child' | 'signsAs' | 'finish';
const ORDER: Step[] = ['welcome', 'adult', 'promise', 'child', 'signsAs', 'finish'];
const DAY = 864e5;
/** Twins, triplets or more; a sane ceiling for one first run. */
const MAX_FIRST_RUN_CHILDREN = 6;

/** "Asha", "Asha and Dev", "Asha, Dev and Mira". */
function joinNames(names: string[], fallback: string): string {
  const n = names.map((x) => x.trim()).filter(Boolean);
  if (n.length === 0) return fallback;
  if (n.length === 1) return n[0];
  return fill(pendingCopy.onboarding.andJoin, { a: n.slice(0, -1).join(', '), b: n[n.length - 1] });
}

export default function Onboarding() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const o = copy.onboarding;
  const pc = pendingCopy.onboarding;
  const motion = useMotion();
  const [step, setStep] = useState<Step>('welcome');
  const [names, setNames] = useState<string[]>(['']);
  const [expecting, setExpecting] = useState(false);
  const [birthday, setBirthday] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 60 * DAY));
  const [signsAs, setSignsAs] = useState('');
  const [adult, setAdult] = useState<boolean | null>(null); // nothing preselected (K-07)
  const child = joinNames(names, 'your child');
  const namedCount = names.filter((n) => n.trim()).length;
  const g = copy.ageGate;

  const next = () => {
    haptic('tap');
    // Under 18: stop here. Nothing has been entered yet and nothing is stored.
    if (step === 'adult' && adult === false) return setStep('stop');
    setStep(ORDER[ORDER.indexOf(step) + 1]);
  };

  const back = () => {
    haptic('tap');
    setStep(ORDER[Math.max(0, ORDER.indexOf(step) - 1)]);
  };

  const answeredByMistake = () => {
    haptic('tap');
    setAdult(null);
    setStep('adult');
  };

  const setNameAt = (i: number, v: string) => setNames((all) => all.map((x, j) => (j === i ? v.slice(0, 60) : x)));
  const addName = () => {
    haptic('tap');
    setNames((all) => (all.length < MAX_FIRST_RUN_CHILDREN ? [...all, ''] : all));
  };
  const removeName = (i: number) => {
    haptic('tap');
    setNames((all) => all.filter((_, j) => j !== i));
  };

  const finish = () => {
    // Every book made in first run is free (twins or more share the date).
    const created = names
      .map((n) => n.trim())
      .filter(Boolean)
      .map((n) =>
        addChild({
          name: n,
          birthday: expecting ? null : todayISO(birthday),
          dueDate: expecting ? todayISO(dueDate) : null,
          signsAs: signsAs.trim(),
        }),
      );
    if (created[0] && getActiveChildId() !== created[0].id) setActiveChildId(created[0].id);
    // Only the yes is stored, never an age (LEGAL-REQ-002). Under 18 never reaches here.
    setSetting('ageAttested', 'yes');
    setSetting('ageAttestedAt', new Date().toISOString());
    haptic('success');
    router.replace('/');
  };

  const input = 'h-14 rounded-2xl border border-muted-foreground/60 bg-card px-4 text-lg text-foreground';
  const disabled =
    (step === 'child' && names.some((n) => !n.trim())) || (step === 'signsAs' && !signsAs.trim()) || (step === 'adult' && adult === null);

  const cta = {
    welcome: o.welcome.startButton,
    adult: copy.common.continueButton,
    stop: g.mistakeButton,
    promise: o.promise.cta,
    child: o.child.cta,
    signsAs: o.signsAs.cta,
    finish: o.finish.cta,
  }[step];
  const centred = step === 'welcome' || step === 'finish' || step === 'stop';

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
        <ScrollView contentContainerClassName="flex-grow px-5 pb-6" keyboardShouldPersistTaps="handled">
          {step !== 'welcome' && step !== 'stop' && (
            <Button variant="ghost" size="sm" className="-ml-4 mt-2 self-start" onPress={back}>
              <Text className="text-primary">{copy.common.backButton}</Text>
            </Button>
          )}
          <Animated.View
            key={step}
            entering={motion.enter()}
            exiting={FadeOut.duration(120)}
            className={centred ? 'flex-1 justify-center gap-5 py-10' : 'flex-1 gap-5 pb-8 pt-6'}>
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
                  {names.map((n, i) => (
                    <View key={i} className="flex-row items-center gap-2">
                      <TextInput
                        className={`${input} flex-1`}
                        value={n}
                        onChangeText={(v) => setNameAt(i, v)}
                        placeholder={i === 0 ? o.child.namePlaceholder : undefined}
                        placeholderTextColor={c.textMuted}
                        autoCapitalize="words"
                        autoCorrect={false}
                        autoFocus={i > 0}
                        textContentType="givenName"
                        returnKeyType="done"
                        accessibilityLabel={names.length > 1 ? `${o.child.nameLabel} ${i + 1}` : o.child.nameLabel}
                        accessibilityHint={o.child.nameHelp}
                      />
                      {i > 0 && (
                        <Pressable
                          onPress={() => removeName(i)}
                          accessibilityRole="button"
                          accessibilityLabel={fill(pc.removeChild, { child: n.trim() || `${o.child.nameLabel} ${i + 1}` })}
                          className="h-11 w-11 items-center justify-center rounded-full active:bg-secondary">
                          <XIcon size={20} color={c.textMuted} />
                        </Pressable>
                      )}
                    </View>
                  ))}
                  <Text className="text-sm text-muted-foreground">{names.length > 1 ? o.child.addAnotherHelp : o.child.nameHelp}</Text>
                  {names.length < MAX_FIRST_RUN_CHILDREN && (
                    <Button variant="ghost" size="sm" className="-ml-4 self-start" onPress={addName} accessibilityHint={o.child.addAnotherHelp}>
                      <PlusIcon size={18} color={c.accent} />
                      <Text className="text-primary">{o.child.addAnotherButton}</Text>
                    </Button>
                  )}
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
                <Text role="heading" className="font-serif text-4xl leading-[44px] text-foreground">{fill(namedCount > 1 ? pc.signsAsTitleMany : o.signsAs.title, { child })}</Text>
                <Text className="text-lg text-foreground">{o.signsAs.body}</Text>
                <TextInput
                  className={input}
                  value={signsAs}
                  onChangeText={(v) => setSignsAs(v.slice(0, 30))}
                  placeholder={o.signsAs.placeholder}
                  placeholderTextColor={c.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel={fill(namedCount > 1 ? pc.signsAsTitleMany : o.signsAs.title, { child })}
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
                <Text role="heading" className="font-serif text-4xl leading-[44px] text-foreground">{g.title}</Text>
                <Text className="text-lg text-muted-foreground">{g.body}</Text>
                <View className="flex-row gap-3" accessibilityRole="radiogroup">
                  {segment(adult === true, g.yesButton, () => setAdult(true))}
                  {segment(adult === false, g.noButton, () => setAdult(false))}
                </View>
              </>
            )}

            {step === 'stop' && (
              <View accessibilityLiveRegion="polite" className="gap-4">
                <Text role="heading" className="font-serif text-4xl leading-[44px] text-foreground">{g.stopTitle}</Text>
                <Text className="text-xl leading-8 text-foreground">{g.stopBody}</Text>
                <Text className="text-base leading-6 text-muted-foreground">{g.stopNote}</Text>
              </View>
            )}

            {step === 'finish' && (
              <>
                <Text role="heading" className="font-serif text-5xl leading-[56px] text-foreground">{o.finish.title}</Text>
                <Text className="text-xl leading-8 text-foreground">{fill(o.finish.body, { child })}</Text>
              </>
            )}
          </Animated.View>

          {/* Controls never animate in (MOTION principle 2). */}
          <Button
            size="lg"
            variant={step === 'stop' ? 'secondary' : 'default'}
            disabled={disabled}
            onPress={step === 'finish' ? finish : step === 'stop' ? answeredByMistake : next}>
            <Text>{cta}</Text>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
