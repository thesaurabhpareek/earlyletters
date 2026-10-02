import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View, useColorScheme } from 'react-native';
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy, fill } from '@/lib/copy';
import { saveFamily, todayISO } from '@/lib/store';

type Step = 'welcome' | 'promise' | 'child' | 'signsAs' | 'finish';
const ORDER: Step[] = ['welcome', 'promise', 'child', 'signsAs', 'finish'];

export default function Onboarding() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const o = copy.onboarding;
  const [step, setStep] = useState<Step>('welcome');
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState<Date>(new Date());
  const [signsAs, setSignsAs] = useState('');
  const child = name.trim() || 'your child';

  const next = () => {
    Haptics.selectionAsync();
    setStep(ORDER[ORDER.indexOf(step) + 1]);
  };

  const finish = () => {
    saveFamily({ childName: name.trim(), childBirthday: todayISO(birthday), signsAs: signsAs.trim() });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.replace('/');
  };

  const input = 'h-14 rounded-2xl border border-border bg-card px-4 text-lg text-foreground';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow px-6 pb-6" keyboardShouldPersistTaps="handled">
          <Animated.View key={step} entering={FadeInDown.springify().damping(18)} exiting={FadeOut.duration(120)} className="flex-1 justify-center gap-5 py-10">
            {step === 'welcome' && (
              <>
                <Text className="font-serif text-5xl leading-[56px] text-foreground">{o.welcome.title}</Text>
                <Text className="text-xl text-muted-foreground">{o.welcome.subtitle}</Text>
                <Text className="text-lg leading-7 text-foreground">{fill(o.welcome.body, { child: 'your child' })}</Text>
              </>
            )}

            {step === 'promise' && (
              <>
                <Text className="font-serif text-4xl leading-[44px] text-foreground">{o.promise.title}</Text>
                <Text className="text-lg leading-7 text-foreground">{o.promise.body}</Text>
                <Text className="text-lg leading-7 text-foreground">{o.promise.body2}</Text>
                <View className="gap-1 rounded-3xl bg-secondary p-5">
                  <Text className="text-lg font-semibold text-foreground">{o.promise.recordingTitle}</Text>
                  <Text className="text-base leading-6 text-foreground">{fill(o.promise.recordingBody, { child: 'your child' })}</Text>
                </View>
                <Text className="text-base text-muted-foreground">{o.promise.privateNote}</Text>
              </>
            )}

            {step === 'child' && (
              <>
                <Text className="font-serif text-4xl leading-[44px] text-foreground">{o.child.title}</Text>
                <View className="gap-2">
                  <Text className="text-base font-medium text-muted-foreground">{o.child.nameLabel}</Text>
                  <TextInput
                    className={input}
                    value={name}
                    onChangeText={setName}
                    placeholder={o.child.namePlaceholder}
                    placeholderTextColor={c.textMuted}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="done"
                    accessibilityLabel={o.child.nameLabel}
                  />
                  <Text className="text-sm text-muted-foreground">{o.child.nameHelp}</Text>
                </View>
                <View className="gap-2">
                  <Text className="text-base font-medium text-muted-foreground">{o.child.birthdayLabel}</Text>
                  <DateTimePicker
                    value={birthday}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'compact' : 'default'}
                    maximumDate={new Date(Date.now() + 280 * 864e5)}
                    accentColor={c.accent}
                    onChange={(_, d) => d && setBirthday(d)}
                  />
                  <Text className="text-sm text-muted-foreground">{fill(o.child.birthdayHelp, { child })}</Text>
                </View>
              </>
            )}

            {step === 'signsAs' && (
              <>
                <Text className="font-serif text-4xl leading-[44px] text-foreground">{fill(o.signsAs.title, { child })}</Text>
                <Text className="text-lg text-foreground">{o.signsAs.body}</Text>
                <TextInput
                  className={input}
                  value={signsAs}
                  onChangeText={setSignsAs}
                  placeholder={o.signsAs.placeholder}
                  placeholderTextColor={c.textMuted}
                  autoCapitalize="words"
                  autoCorrect={false}
                  accessibilityLabel={fill(o.signsAs.title, { child })}
                />
                <View className="flex-row flex-wrap gap-2">
                  {o.signsAs.examples.map((ex) => (
                    <Pressable
                      key={ex}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSignsAs(ex);
                      }}
                      accessibilityRole="button"
                      className={`h-11 justify-center rounded-full border px-4 ${signsAs === ex ? 'border-primary bg-secondary' : 'border-border bg-card'}`}>
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

            {step === 'finish' && (
              <>
                <Text className="font-serif text-5xl leading-[56px] text-foreground">{o.finish.title}</Text>
                <Text className="text-xl leading-8 text-foreground">{fill(o.finish.body, { child })}</Text>
              </>
            )}
          </Animated.View>

          <Button
            size="lg"
            disabled={(step === 'child' && !name.trim()) || (step === 'signsAs' && !signsAs.trim())}
            onPress={step === 'finish' ? finish : next}>
            <Text>
              {step === 'welcome'
                ? o.welcome.startButton
                : step === 'promise'
                  ? o.promise.cta
                  : step === 'child'
                    ? o.child.cta
                    : step === 'signsAs'
                      ? o.signsAs.cta
                      : o.finish.cta}
            </Text>
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
