/**
 * First run (PRD B F1, essentials): what we promise, the child's name (twins
 * or more: add them all now, each book is free), birthday or due date, and
 * what the child calls you. One step per screen; Continue is full width at
 * the bottom.
 *
 * Disclosures: the "we can mishear" note sits on the promise step
 * (in-app-disclosures.md 2, help.mistakes). The beta label is NOT shown
 * here: in-app-disclosures.md 1 and PRD.md K-13 limit it to Settings > About.
 * Age (PRD-REQ-019): the 18+ entry gate runs at the app root before any
 * route, this one included (components/gate/age-gate-screen.tsx), so first
 * run is only ever reached by someone who answered Yes.
 *
 * Design (docs/design/BENCHMARK.md, "Screens"):
 * - Headspace / Calm first run: one drawing, one large serif line, one action per screen.
 * - CREATIVE 6: an open envelope at the start, a page with one line at the end.
 * - Apple Settings segmented choice for Birthday / Not here yet (stacks at large text).
 * - VoiceOver focus moves to each step's heading (TDD 09 A11Y-F09).
 * Haptics: only the choices (selection) and the finished book (success). Continue and
 * Back are navigation and stay silent (MOTION 6).
 */
import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { CaretLeftIcon } from 'phosphor-react-native/src/icons/CaretLeft';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { SealCheckIcon } from 'phosphor-react-native/src/icons/SealCheck';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View, type Text as RNText } from 'react-native';
import Animated from 'react-native-reanimated';
import { languageInfo, type LanguageCode } from '@scribe/core';
import { languageCopy } from '@/components/language/copy';
import { LanguagePicker } from '@/components/language/language-picker';
import { Button, IconButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip, ChipGroup, ChoiceGroup } from '@/components/ui/choice-group';
import { LineArt } from '@/components/ui/line-art';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { useFocusOnMount, useTheme } from '@/lib/a11y';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { dayDate } from '@/lib/dates';
import { ordinalOf, track } from '@/lib/analytics/track';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { ensureTextRules } from '@/lib/language/packs';
import { useSpokenLanguage } from '@/lib/language/spoken-language';
import { addChild, getActiveChildId, listChildren, setActiveChildId, subscribe, todayISO } from '@/lib/store';

type Step = 'welcome' | 'promise' | 'child' | 'signsAs' | 'finish';
const ORDER: Step[] = ['welcome', 'promise', 'child', 'signsAs', 'finish'];
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
  const { c } = useTheme();
  const o = copy.onboarding;
  const pc = pendingCopy.onboarding;
  const motion = useMotion();
  const heading = useRef<RNText>(null);
  const [step, setStep] = useState<Step>('welcome');
  const [names, setNames] = useState<string[]>(['']);
  const [expecting, setExpecting] = useState(false);
  const [birthday, setBirthday] = useState<Date>(new Date());
  const [dueDate, setDueDate] = useState<Date>(new Date(Date.now() + 60 * DAY));
  const [signsAs, setSignsAs] = useState('');
  const child = joinNames(names, 'your child');
  const namedCount = names.filter((n) => n.trim()).length;
  const spoken = useSpokenLanguage();
  const [languageOpen, setLanguageOpen] = useState(false);

  // "I already have a book" or "I was invited": once sign-in or joining brings a book to this
  // phone, first run is over (no second book is made by mistake).
  useEffect(() => {
    if (step !== 'welcome') return;
    const done = () => {
      if (listChildren().length > 0) router.replace('/');
    };
    done();
    return subscribe(done);
  }, [step]);

  // The language letters are spoken in (founder decisions 6 and 15): choosing it starts only
  // that language's downloads (its text rules here; its speech model through the speech engine).
  const chooseLanguage = (code: LanguageCode) => {
    spoken.setPrimary(code);
    setLanguageOpen(false);
    // Never blocks or breaks first run: a download that cannot start now starts from Settings later.
    void Promise.resolve()
      .then(() => ensureTextRules(code))
      .catch(() => undefined);
  };

  useFocusOnMount(heading, step !== 'welcome', step);

  const next = () => setStep(ORDER[ORDER.indexOf(step) + 1]);
  const back = () => setStep(ORDER[Math.max(0, ORDER.indexOf(step) - 1)]);

  const setNameAt = (i: number, v: string) => setNames((all) => all.map((x, j) => (j === i ? v.slice(0, 60) : x)));
  const addName = () => setNames((all) => (all.length < MAX_FIRST_RUN_CHILDREN ? [...all, ''] : all));
  const removeName = (i: number) => setNames((all) => all.filter((_, j) => j !== i));

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
    // Dropped unless analytics is already a yes (it never is in first run; K-01). Kept for a reinstall that kept consent.
    for (const c of created) track('child_added', { has_date: true, child_ordinal: ordinalOf(c.id), in_first_run: true, added_together: created.length > 1 });
    haptic('success');
    router.replace('/');
  };

  const disabled = (step === 'child' && names.some((n) => !n.trim())) || (step === 'signsAs' && !signsAs.trim());
  const cta = { welcome: o.welcome.startButton, promise: o.promise.cta, child: o.child.cta, signsAs: o.signsAs.cta, finish: o.finish.cta }[step];
  const centred = step === 'welcome' || step === 'finish';
  const signsAsTitle = fill(namedCount > 1 ? pc.signsAsTitleMany : o.signsAs.title, { child });

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow px-6 pb-6" keyboardShouldPersistTaps="handled">
          <View className="min-h-12 justify-center">
            {step !== 'welcome' && <Button variant="quiet" size="sm" icon={CaretLeftIcon} label={copy.common.backButton} className="-ml-4 self-start" onPress={back} />}
          </View>

          <Animated.View key={step} entering={motion.enter()} className={centred ? 'flex-1 justify-center gap-6 py-6' : 'flex-1 gap-6 pb-8 pt-4'}>
            {step === 'welcome' && (
              <>
                <LineArt name="envelopeOpen" width={176} style={{ marginLeft: -12 }} />
                <View className="gap-3">
                  <Text ref={heading} variant="hero" asHeading={1}>
                    {o.welcome.title}
                  </Text>
                  <Text variant="prompt" tone="muted" scale={0.85}>
                    {o.welcome.subtitle}
                  </Text>
                </View>
                <Text variant="body">{fill(o.welcome.body, { child: 'your child' })}</Text>
              </>
            )}

            {step === 'promise' && (
              <>
                <Text ref={heading} variant="title1" asHeading={1}>
                  {o.promise.title}
                </Text>
                <View className="gap-3">
                  <Text variant="body">{o.promise.body}</Text>
                  <Text variant="body">{o.promise.body2}</Text>
                </View>
                <Card variant="tinted" padding={5} className="flex-row gap-3">
                  <MicrophoneIcon size={22} color={c.accent} weight="fill" style={{ marginTop: 2 }} />
                  <View className="flex-1 gap-1">
                    <Text variant="headline">{o.promise.recordingTitle}</Text>
                    <Text variant="callout">{fill(o.promise.recordingBody, { child: 'your child' })}</Text>
                  </View>
                </Card>
                <Card variant="flat" padding={5} className="flex-row gap-3">
                  <SealCheckIcon size={22} color={c.textMuted} style={{ marginTop: 2 }} />
                  <View className="flex-1 gap-1">
                    <Text variant="headline">{pc.mishearTitle}</Text>
                    <Text variant="callout">{copy.settings.help.mistakes}</Text>
                  </View>
                </Card>
                <View className="flex-row items-center gap-2">
                  <LockSimpleIcon size={16} color={c.textMuted} />
                  <Text variant="footnote" className="flex-1">
                    {o.promise.privateNote}
                  </Text>
                </View>
              </>
            )}

            {step === 'child' && (
              <>
                <Text ref={heading} variant="title1" asHeading={1}>
                  {o.child.title}
                </Text>
                <View className="gap-3">
                  {names.map((n, i) => (
                    <TextField
                      key={i}
                      label={names.length > 1 ? `${o.child.nameLabel} ${i + 1}` : o.child.nameLabel}
                      value={n}
                      onChangeText={(v) => setNameAt(i, v)}
                      placeholder={i === 0 ? o.child.namePlaceholder : undefined}
                      autoCapitalize="words"
                      autoCorrect={false}
                      autoFocus={i > 0}
                      textContentType="givenName"
                      autoComplete="given-name"
                      returnKeyType="done"
                      helper={i === names.length - 1 ? (names.length > 1 ? o.child.addAnotherHelp : o.child.nameHelp) : undefined}
                      trailing={
                        i > 0 ? (
                          <IconButton icon={XIcon} label={fill(pc.removeChild, { child: n.trim() || `${o.child.nameLabel} ${i + 1}` })} size="sm" onPress={() => removeName(i)} className="mr-2" />
                        ) : undefined
                      }
                    />
                  ))}
                  {names.length < MAX_FIRST_RUN_CHILDREN && (
                    <Button variant="quiet" size="sm" icon={PlusIcon} label={o.child.addAnotherButton} className="-ml-4 self-start" onPress={addName} accessibilityHint={o.child.addAnotherHelp} />
                  )}
                </View>
                <ChoiceGroup
                  label={o.child.birthdayLabel}
                  value={expecting ? 'expecting' : 'born'}
                  onChange={(v) => setExpecting(v === 'expecting')}
                  options={[
                    { value: 'born', label: o.child.birthdayLabel },
                    { value: 'expecting', label: o.child.expectingLabel },
                  ]}
                />
                <View className="gap-2">
                  <View className="min-h-12 flex-row flex-wrap items-center justify-between gap-2">
                    <Text variant="labelSmall" tone="muted">
                      {expecting ? pc.dueDateLabel : o.child.birthdayLabel}
                    </Text>
                    {Platform.OS === 'web' ? (
                      // Web preview only: the community picker renders nothing on web, so show
                      // the value the way iOS's compact picker does (a quiet date pill).
                      <View className="rounded-md bg-muted px-3 py-2">
                        <Text variant="body">{dayDate(todayISO(expecting ? dueDate : birthday))}</Text>
                      </View>
                    ) : expecting ? (
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
                  </View>
                  <Text variant="footnote">{expecting ? o.child.expectingHelp : fill(o.child.birthdayHelp, { child })}</Text>
                </View>
              </>
            )}

            {step === 'signsAs' && (
              <>
                <View className="gap-2">
                  <Text ref={heading} variant="title1" asHeading={1}>
                    {signsAsTitle}
                  </Text>
                  <Text variant="body" tone="muted">
                    {o.signsAs.body}
                  </Text>
                </View>
                <TextField
                  label={signsAsTitle}
                  labelHidden
                  value={signsAs}
                  onChangeText={(v) => setSignsAs(v.slice(0, 30))}
                  placeholder={o.signsAs.placeholder}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <View className="gap-2">
                  <Text variant="labelSmall" tone="muted">
                    {o.signsAs.examplesLabel}
                  </Text>
                  <ChipGroup label={o.signsAs.examplesLabel}>
                    {o.signsAs.examples.map((ex) => (
                      <Chip key={ex} label={ex} selected={signsAs === ex} onPress={() => setSignsAs(ex)} />
                    ))}
                  </ChipGroup>
                </View>
                <View className="min-h-16 justify-center">
                  {signsAs.trim() ? (
                    <Text variant="signature" tone="accent" scale={1.3}>
                      {fill(o.signsAs.preview, { signsAs: signsAs.trim() })}
                    </Text>
                  ) : (
                    <Text variant="footnote">{o.signsAs.notYetHelp}</Text>
                  )}
                </View>
                <ListSection footer={o.dictionary.languagesBody}>
                  <ListRow
                    title={copy.settingsHome.languageLabel}
                    trailing={languageInfo(spoken.primary.code).native}
                    onPress={() => setLanguageOpen(true)}
                    accessibilityHint={languageCopy.picker.rowHint}
                  />
                </ListSection>
              </>
            )}

            {step === 'finish' && (
              <>
                <LineArt name="page" width={168} style={{ marginLeft: -12 }} />
                <Text ref={heading} variant="hero" asHeading={1}>
                  {o.finish.title}
                </Text>
                <Text variant="body">{fill(o.finish.body, { child })}</Text>
              </>
            )}
          </Animated.View>

          {/* Controls never animate in (MOTION principle 2). */}
          <Button size="lg" fullWidth disabled={disabled} label={cta} onPress={step === 'finish' ? finish : next} />
          {step === 'welcome' && (
            <View className="mt-2 gap-1">
              <Button variant="quiet" fullWidth label={o.welcome.signInButton} onPress={() => router.push({ pathname: '/sign-in', params: { trigger: 'sign_in' } })} />
              <Button variant="quiet" fullWidth label={o.welcome.joinButton} onPress={() => router.push('/invite')} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <LanguagePicker visible={languageOpen} onClose={() => setLanguageOpen(false)} onSelect={chooseLanguage} selected={spoken.primary.code} />
    </SafeAreaView>
  );
}
