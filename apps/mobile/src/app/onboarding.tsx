/**
 * First run (PRD B F1, essentials): the welcome, what we promise, the child's name (twins or more: add them
 * all now, each book is free), birthday or due date, what the child calls you, and "The book is open." One step
 * per screen; Continue is full width at the bottom.
 *
 * Disclosures: the registered "we can mishear" text is not shown here (EXPERIENCE_PASS S04): its two registered
 * places are the first Review note and Settings (in-app-disclosures.md 2). The beta label is NOT shown here:
 * in-app-disclosures.md 1 and PRD.md K-13 limit it to Settings > About.
 * Age (PRD-REQ-019): the 18+ entry gate runs at the app root before any route, this one included
 * (components/gate/age-gate-screen.tsx), so first run is only ever reached by someone who answered Yes.
 *
 * Design (EXPERIENCE_PASS 3.1 chapter 1, S03 to S08): one lit room and one object.
 * - The lamp arrived at the gate and never goes out: the same `persistKey` ("firstRun") carries it from the gate's
 *   centred pool to the welcome (1.0, breathing), down to the form steps (0.5, still) and up again as the book
 *   opens (1.0). One Lamp in one slot, so a step changes only its scene.
 * - The welcome's one logo is the stacked lockup from the registry (`app.welcome`); the name is never typed.
 * - The promise shows a small fix instead of describing one (components/onboarding/promise-sample.tsx).
 * - The book cover (components/book/book-cover.tsx, P1) takes the child's name as it is typed, is signed on the
 *   next step, and opens on "The book is open."
 * - No help line justifies a field. Why Continue is waiting is said in words above it, quietly, and only after a
 *   tap on the waiting Continue does it show its warning mark (on its own chip, never caution on lit paper), with
 *   focus moved to the empty field.
 * - VoiceOver focus moves to each step's heading (TDD 09 A11Y-F09).
 * Haptics: only the choices (selection, from Chip and ChoiceGroup) and the open book (success, once when the step
 * is reached). Continue and Back are navigation and stay silent (MOTION 6).
 *
 * The welcome's two doors (5.8 row 13, requests from P8): "I already have a book" opens the sign-in sheet with
 * trigger `sign_in`, "I was invited" opens /invite. Both are hidden with server features off. Once sign-in or
 * joining brings a book to this phone, first run is over and the person lands on the Book, never on Tonight.
 */
import { router, usePathname, type Href } from 'expo-router';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { PlusIcon } from 'phosphor-react-native/src/icons/Plus';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { XIcon } from 'phosphor-react-native/src/icons/X';
import type { Icon as PhosphorIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type Text as RNText, type TextInput } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { CHILD_NAME_MAX, SIGNS_AS_MAX, checkBirthday, checkChildName, checkDueDate, checkSignsAs, clampText, languageInfo, latestDueDate, nearLimit, textLength, type LanguageCode } from '@scribe/core';
import { tokens } from '@scribe/design-tokens';
import { BookCover } from '@/components/book/book-cover';
import { CoverHeading, useCoverPlace } from '@/components/child/cover-heading';
import { DateField, type DateFieldHandle } from '@/components/child/date-field';
import { languageCopy } from '@/components/language/copy';
import { LanguagePicker } from '@/components/language/language-picker';
import { PromiseSample } from '@/components/onboarding/promise-sample';
import { WelcomeLockup } from '@/components/onboarding/welcome-lockup';
import { WELCOME_LOCKUP } from '@/components/onboarding/welcome-lockup.logic';
import { SpeechConsentCard } from '@/components/speech/speech-consent-card';
import { authorSpeechLanguage } from '@/lib/models/author-language';
import { Button, IconButton } from '@/components/ui/button';
import { Chip, ChipGroup, ChoiceGroup } from '@/components/ui/choice-group';
import { Lamp } from '@/components/ui/lamp';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { BackButton } from '@/components/ui/screen-header';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { announce, useFocusOnMount, useIsLargeText, useTheme } from '@/lib/a11y';
import { capabilities } from '@/lib/capabilities';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { inviteHref, visibleCoParentDoors } from '@/lib/family/entry.logic';
import { ordinalOf, track } from '@/lib/analytics/track';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { ensureTextRules } from '@/lib/language/packs';
import { useSpokenLanguage } from '@/lib/language/spoken-language';
import { addChild, getActiveChildId, listChildren, setActiveChildId, subscribe, todayISO } from '@/lib/store';
import { firstRunWelcome, welcomeMayLeave } from '@/components/family/welcome-handoff.logic';
import { CheckingScreen, OpenDeletionScreen } from '@/components/settings/open-deletion';
import { useFirstRunGate } from '@/lib/account-deletion';
import { useWelcomeJoinWait } from '@/components/family/join-wait';
import { familyCopy } from '@/lib/family/copy';

type Step = 'welcome' | 'promise' | 'child' | 'signsAs' | 'finish';
const ORDER: Step[] = ['welcome', 'promise', 'child', 'signsAs', 'finish'];
/** Twins, triplets or more; a sane ceiling for one first run. */
const MAX_FIRST_RUN_CHILDREN = 6;
/** The cover takes a typed name after a pause this long, with no motion per letter (S05). */
const COVER_PAUSE_MS = 300;
/** The row that holds Back on every step but the welcome (min-h-12). */
const BACK_ROW = 48;
/** The welcome's layout under the lockup (S03): the hero 32 pt below it, the body 16 below that, the free line 12. */
const WELCOME = { heroGap: 32, bodyGap: 16, freeGap: 12, doorGap: 24 } as const;

/** "Asha", "Asha and Dev", "Asha, Dev and Nina". */
function joinNames(names: string[], fallback: string): string {
  const n = names.map((x) => x.trim()).filter(Boolean);
  if (n.length === 0) return fallback;
  if (n.length === 1) return n[0];
  return fill(pendingCopy.onboarding.andJoin, { a: n.slice(0, -1).join(', '), b: n[n.length - 1] });
}

/** The value once it has held still for `ms` (the cover's name after a typing pause). */
function useSettled<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return settled;
}

function FirstRun() {
  const o = copy.onboarding;
  const pc = pendingCopy.onboarding;
  const motion = useMotion();
  const largeText = useIsLargeText();
  const heading = useRef<RNText>(null);
  const nameFields = useRef<(TextInput | null)[]>([]);
  const signsAsField = useRef<TextInput>(null);
  const dateField = useRef<DateFieldHandle>(null);
  const [step, setStep] = useState<Step>('welcome');
  const [names, setNames] = useState<string[]>(['']);
  const [expecting, setExpecting] = useState(false);
  // No date is chosen for the person: an untouched default would file a seven-month-old under "0 days".
  const [birthday, setBirthday] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [signsAs, setSignsAs] = useState('');
  // The date block arrives once the first letter of the name is in (S05), and stays.
  const [dateShown, setDateShown] = useState(false);
  // The person tapped a Continue that is waiting: the reason line shows its warning mark (S05).
  const [nudged, setNudged] = useState(false);
  // Tapping during "The book is open." lands the cover on its open state at once (S08: any tap completes it).
  const [settled, setSettledOpen] = useState(false);
  const child = joinNames(names, 'your child');
  const namedCount = names.filter((n) => n.trim()).length;
  const spoken = useSpokenLanguage();
  const doors = visibleCoParentDoors(capabilities.coParent);
  const [languageOpen, setLanguageOpen] = useState(false);

  // The cover: the name after each typing pause; a chip's signature at once, a typed one after a pause.
  const coverName = useSettled(names[0] ?? '', COVER_PAUSE_MS);
  const coverBehind = useSettled(names[1] ?? '', COVER_PAUSE_MS);
  const typedSignsAs = useSettled(signsAs, COVER_PAUSE_MS);
  const [chosenSignsAs, setChosenSignsAs] = useState<string | null>(null);
  const coverSignsAs = (chosenSignsAs === signsAs ? signsAs : typedSignsAs).trim();
  // Beside the heading, under it at accessibility text sizes, or away while the keyboard leaves under 480 pt (S05).
  const coverPlace = useCoverPlace();

  // "I already have a book" or "I was invited": once sign-in or joining brings a book to this phone, first run is
  // over (no second book is made by mistake), and the person lands on the Book, where the letters that came back
  // are, never on Tonight (EXPERIENCE_PASS 5.8 rows 12 and 13).
  // Only while the welcome, or the sign-in sheet over it, is in front (components/family/welcome-handoff.logic.ts): the
  // join sheet waits for Open or Close (S59, P8b), and no other screen is ever pulled back to the Book.
  const pathname = usePathname();
  useEffect(() => {
    if (!welcomeMayLeave(step, pathname)) return;
    const done = () => {
      if (listChildren().length > 0) router.replace('/book');
    };
    done();
    return subscribe(done);
  }, [step, pathname]);
  // Closed the join sheet before the joined book arrived (S59, P8b, critics' pass S2): while it is on its way the welcome
  // says so and hides "Begin the book"; if it does not come, Try again, and "Begin the book" is back. Leaving the
  // welcome ends the wait.
  const joining = useWelcomeJoinWait({ onWelcome: step === 'welcome', inFront: pathname === '/onboarding' });
  const joinLine = joining.line;
  const showContinue = joining.begin;
  // The join sheet's "Open the book" asks whether the welcome step is the one under it (S59, P8b).
  useEffect(() => {
    firstRunWelcome.set(step === 'welcome');
    return () => firstRunWelcome.set(false);
  }, [step]);

  useEffect(() => {
    if (names[0]?.trim()) setDateShown(true);
  }, [names]);

  // The book is open: one success, when the step is reached (MOTION 6).
  useEffect(() => {
    if (step === 'finish') haptic('success');
    setSettledOpen(false);
  }, [step]);

  // The language letters are spoken in (founder decisions 6 and 15): choosing it stores it and fetches its
  // small text rules. The speech model (large) downloads only after the explicit ask on the last step (D-087).
  const chooseLanguage = (code: LanguageCode) => {
    spoken.setPrimary(code);
    setLanguageOpen(false);
    // Never blocks or breaks first run: a download that cannot start now starts from Settings later.
    void Promise.resolve()
      .then(() => ensureTextRules(code))
      .catch(() => undefined);
  };

  useFocusOnMount(heading, step !== 'welcome', step);

  // Hand-off, not pile-up (MOTION 5l): the leaving step's words go up and out first (exitMs, also under Reduce
  // Motion), and only then does the next step arrive, so two steps' words are never on screen together. Controls
  // (Back, the reason line, Continue) change at once: they never animate.
  const [shown, setShown] = useState<Step>(step);
  useEffect(() => {
    if (shown === step) return;
    const id = setTimeout(() => setShown(step), tokens.motion.exitMs);
    return () => clearTimeout(id);
  }, [step, shown]);

  const next = () => setStep(ORDER[ORDER.indexOf(step) + 1]);
  const back = () => setStep(ORDER[Math.max(0, ORDER.indexOf(step) - 1)]);

  const setNameAt = (i: number, v: string) => setNames((all) => all.map((x, j) => (j === i ? clampText(v, CHILD_NAME_MAX) : x)));
  const addName = () => setNames((all) => (all.length < MAX_FIRST_RUN_CHILDREN ? [...all, ''] : all));
  const removeName = (i: number) => setNames((all) => all.filter((_, j) => j !== i));
  const chooseSignsAs = (v: string) => {
    setSignsAs(v);
    setChosenSignsAs(v);
  };

  const finish = () => {
    // Every book made in first run is free (twins or more share the date).
    if (childBlock) return;
    const created = names
      .map((n) => checkChildName(n))
      .flatMap((n) => (n.ok ? [n.value] : []))
      .map((n) =>
        addChild({
          name: n,
          birthday: expecting ? null : birthday,
          dueDate: expecting ? dueDate : null,
          signsAs: signsAs.trim(),
        }),
      );
    if (created[0] && getActiveChildId() !== created[0].id) setActiveChildId(created[0].id);
    // Dropped unless analytics is already a yes (it never is in first run; K-01). Kept for a reinstall that kept consent.
    for (const c of created) track('child_added', { has_date: true, child_ordinal: ordinalOf(c.id), in_first_run: true, added_together: created.length > 1 });
    router.replace('/');
  };

  // Why Continue is waiting, in words (never only a greyed button).
  const today = todayISO();
  const childBlock = ((): string | null => {
    if (names.some((n) => !checkChildName(n).ok)) return names.length > 1 ? o.child.needNameMany : copy.childrenExtra.nameRequired;
    if (expecting) {
      if (!dueDate) return o.child.needDueDate;
      return checkDueDate(dueDate, today).ok ? null : copy.childrenExtra.edit.dueDateRange;
    }
    if (!birthday) return fill(o.child.needBirthday, { child: namedCount ? child : 'your child' });
    return checkBirthday(birthday, today).ok ? null : copy.childrenExtra.edit.birthdayFuture;
  })();
  // Twins or more: the reason agrees in number with the title (S06).
  const signsAsBlock = checkSignsAs(signsAs).ok ? null : fill(namedCount > 1 ? o.signsAs.needSignsAsMany : o.signsAs.needSignsAs, { child });
  const block = step === 'child' ? childBlock : step === 'signsAs' ? signsAsBlock : null;
  const disabled = block !== null;
  const cta = { welcome: o.welcome.startButton, promise: o.promise.cta, child: o.child.cta, signsAs: o.signsAs.cta, finish: o.finish.cta }[step];
  const signsAsTitle = fill(namedCount > 1 ? pc.signsAsTitleMany : o.signsAs.title, { child });

  // A new reason (or a new step) starts quiet again; only a tap on the waiting Continue raises it.
  useEffect(() => setNudged(false), [block, step]);

  /** The waiting Continue was tapped: say why with the warning mark, and move focus to what is missing. */
  const nudge = () => {
    if (!block) return;
    setNudged(true);
    announce(block);
    if (step === 'signsAs') {
      signsAsField.current?.focus();
      return;
    }
    const missing = names.findIndex((n) => !checkChildName(n).ok);
    if (missing >= 0) nameFields.current[missing]?.focus();
    else dateField.current?.focus();
  };

  // Controls never animate in (MOTION principle 2). On every step but the last they follow the step's content in the scroll;
  // on "The book is open." they are pinned below it (S08): the cover, the line and the speech card scroll above one button.
  const pinned = step === 'finish';
  const controls = (
    <>
      {block ? <ReasonLine text={block} raised={nudged} /> : null}
      {joinLine ? (
        <View className="items-center gap-1 pb-2" testID="onboarding.joinWait">
          <Text variant="body" className="text-center" accessibilityLiveRegion="polite">
            {joinLine}
          </Text>
          {joining.retry ? <Button variant="quiet" size="sm" label={familyCopy.accept.tryAgain} onPress={joining.onRetry} testID="onboarding.joinWait.retry" /> : null}
        </View>
      ) : null}
      {showContinue ? (
        <View>
          <Button size="lg" fullWidth disabled={disabled} label={cta} accessibilityHint={block ?? undefined} onPress={step === 'finish' ? finish : next} testID="onboarding.continue" />
          {/* A tap on the waiting Continue lands on this clear layer (a disabled button takes no tap) and raises the
              reason. Touch only: VoiceOver reads the button itself, "dimmed", with the reason as its hint. */}
          {disabled ? <Pressable onPress={nudge} accessible={false} importantForAccessibility="no" style={StyleSheet.absoluteFill} testID="onboarding.continue.waiting" /> : null}
        </View>
      ) : null}
    </>
  );

  // The welcome's words arrive one after another (S03); under Reduce Motion, one fade.
  const enterAt = (ms: number) => (motion.reduced ? motion.enter(0) : motion.enter(0)?.delay(ms));

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* One light through first run (persistKey "firstRun"): one Lamp in one slot, so a step changes only its scene. */}
      {step === 'welcome' ? (
        <Lamp scene="welcome" persistKey="firstRun" />
      ) : step === 'finish' ? (
        <Lamp scene="finish" persistKey="firstRun" />
      ) : (
        <Lamp scene="form" persistKey="firstRun" />
      )}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-grow px-6 pb-6" keyboardShouldPersistTaps="handled">
          <View className="min-h-12 justify-center">
            {step !== 'welcome' && <BackButton onPress={back} />}
          </View>

          {shown === step ? (
            <Animated.View
              key={step}
              entering={step === 'welcome' || step === 'finish' ? undefined : motion.enter()}
              exiting={motion.leave()}
              onTouchStart={step === 'finish' ? () => setSettledOpen(true) : undefined}
              className={step === 'welcome' ? 'flex-1 items-center pb-8' : step === 'finish' ? 'flex-1 items-center justify-center gap-6 py-6' : 'flex-1 gap-6 pb-8 pt-4'}>
              {step === 'welcome' && (
                <>
                  {/* The one logo: the stacked lockup, its top 96 pt below the safe area. The name is never typed (BRAND_SYSTEM 2a). */}
                  <WelcomeLockup label={o.welcome.title} style={{ marginTop: WELCOME_LOCKUP.top - BACK_ROW }} />
                  <Animated.View entering={enterAt(120)} style={{ marginTop: WELCOME.heroGap }}>
                    <Text variant="hero" asHeading={1} className="text-center">
                      {o.welcome.subtitle}
                    </Text>
                  </Animated.View>
                  <Animated.View entering={enterAt(150)} style={{ marginTop: WELCOME.bodyGap }}>
                    <Text variant="body" tone="muted" className="text-center">
                      {fill(o.welcome.body, { child: 'your child' })}
                    </Text>
                  </Animated.View>
                  <Animated.View entering={enterAt(180)} style={{ marginTop: WELCOME.freeGap }}>
                    <Text variant="footnote" className="text-center">
                      {o.welcome.freeLine}
                    </Text>
                  </Animated.View>
                </>
              )}

              {step === 'promise' && (
                <>
                  <View className="gap-3">
                    <Text ref={heading} variant="display" asHeading={1}>
                      {o.promise.title}
                    </Text>
                    <Text variant="body">{o.promise.body2}</Text>
                  </View>
                  {/* A small fix, shown: the real engine's marks on a fictional sentence (S04). */}
                  <PromiseSample />
                  <View className="gap-6">
                    <IconRow icon={MicrophoneIcon} text={fill(o.promise.recordingBody, { child: 'your child' })} />
                    <IconRow icon={LockSimpleIcon} text={o.promise.privateNote} />
                  </View>
                </>
              )}

              {step === 'child' && (
                <>
                  <CoverHeading title={o.child.title} headingRef={heading} place={coverPlace}>
                    <BookCover name={coverName} size="sm" behindName={names.length > 1 ? coverBehind : undefined} />
                  </CoverHeading>
                  <View className="gap-3">
                    {names.map((n, i) => (
                      <TextField
                        key={i}
                        ref={(r) => {
                          nameFields.current[i] = r;
                        }}
                        label={i === 0 ? o.child.nameLabel : o.child.nameLabelMore}
                        face="serif"
                        value={n}
                        onChangeText={(v) => setNameAt(i, v)}
                        placeholder={i === 0 ? o.child.namePlaceholder : undefined}
                        autoCapitalize="words"
                        autoCorrect={false}
                        autoFocus={i > 0}
                        textContentType="givenName"
                        autoComplete="given-name"
                        returnKeyType="done"
                        helper={
                          nearLimit(textLength(n), CHILD_NAME_MAX)
                            ? fill(o.child.nameLimit, { n: CHILD_NAME_MAX })
                            : i === names.length - 1 && names.length > 1
                              ? o.child.addAnotherHelp
                              : undefined
                        }
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
                  {dateShown ? (
                    <Animated.View entering={motion.enter()} className="gap-4">
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
                          <View className="flex-row flex-wrap items-center justify-end gap-2">
                            {/* "Born today" is a chip beside the date control (S05). */}
                            {!expecting && birthday !== today ? <Chip label={o.child.bornToday} onPress={() => setBirthday(today)} /> : null}
                            <DateField
                              ref={dateField}
                              key={expecting ? 'due' : 'born'}
                              label={expecting ? pc.dueDateLabel : o.child.birthdayLabel}
                              chooseLabel={o.child.chooseDate}
                              value={expecting ? dueDate : birthday}
                              onChange={expecting ? setDueDate : setBirthday}
                              startISO={today}
                              min={expecting ? today : undefined}
                              max={expecting ? latestDueDate(today) : today}
                            />
                          </View>
                        </View>
                        {expecting ? <Text variant="footnote">{o.child.expectingHelp}</Text> : null}
                      </View>
                    </Animated.View>
                  ) : null}
                </>
              )}

              {step === 'signsAs' && (
                <>
                  {/* The one signature preview: "From Mama" on the cover's foot line (S06). */}
                  <CoverHeading title={signsAsTitle} headingRef={heading} place={coverPlace}>
                    <BookCover name={coverName} signsAs={coverSignsAs || undefined} size="sm" behindName={names.length > 1 ? coverBehind : undefined} />
                  </CoverHeading>
                  <TextField
                    ref={signsAsField}
                    label={signsAsTitle}
                    labelHidden
                    value={signsAs}
                    onChangeText={(v) => setSignsAs(clampText(v, SIGNS_AS_MAX))}
                    helper={nearLimit(textLength(signsAs), SIGNS_AS_MAX) ? fill(copy.childrenExtra.edit.signsAsLimit, { n: SIGNS_AS_MAX }) : undefined}
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
                        <Chip key={ex} label={ex} selected={signsAs === ex} onPress={() => chooseSignsAs(ex)} />
                      ))}
                    </ChipGroup>
                    <Text variant="footnote">{o.signsAs.notYetHelp}</Text>
                  </View>
                  {/* The spoken language, under a hairline, with no footer (S06). */}
                  <View className="gap-4">
                    <Separator />
                    <ListSection>
                      <ListRow
                        title={copy.settingsHome.languageLabel}
                        trailing={languageInfo(spoken.primary.code).native}
                        onPress={() => setLanguageOpen(true)}
                        accessibilityHint={languageCopy.picker.rowHint}
                      />
                    </ListSection>
                  </View>
                </>
              )}

              {step === 'finish' && (
                <>
                  {/* The cover opens: the light comes up as the book opens (S08). */}
                  <View testID="onboarding.finish.cover">
                    <BookCover
                      name={names[0] ?? ''}
                      signsAs={signsAs.trim() || undefined}
                      size="md"
                      state="open"
                      openOnMount
                      animate={!settled}
                      behindName={names.length > 1 ? names[1] : undefined}
                    />
                  </View>
                  <Animated.View entering={enterAt(200)} className="gap-3">
                    <Text ref={heading} variant="hero" asHeading={1} className="text-center">
                      {o.finish.title}
                    </Text>
                    <Text variant="body" className="text-center">
                      {fill(o.finish.body, { child })}
                    </Text>
                  </Animated.View>
                  {/* One explicit ask for the speech download: nothing starts until the person taps (D-087). It holds
                      controls, so it does not animate in (MOTION principle 2); it arrives with the step. */}
                  <View className="self-stretch">
                    <SpeechConsentCard key={authorSpeechLanguage()} language={authorSpeechLanguage()} />
                  </View>
                </>
              )}
            </Animated.View>
          ) : (
            // The moment between two steps: the leaving words finish going (exitMs) before the next ones come.
            <View className="flex-1" testID="onboarding.handoff" />
          )}

          {pinned ? null : controls}
          {step === 'welcome' && (capabilities.signIn || doors.joinButton) && (
            // Two doors, not offers: quiet text, no icon, no border, no line about accounts (S03).
            <View className={largeText ? 'mt-2 items-center' : 'mt-2 flex-row flex-wrap justify-center'} style={{ columnGap: WELCOME.doorGap }}>
              {capabilities.signIn ? (
                <Button variant="quiet" size="sm" accessibilityLabel={o.welcome.signInButton} onPress={() => router.push({ pathname: '/sign-in', params: { trigger: 'sign_in' } })}>
                  <Text variant="callout">{o.welcome.signInButton}</Text>
                </Button>
              ) : null}
              {doors.joinButton ? (
                <Button variant="quiet" size="sm" accessibilityLabel={o.welcome.joinButton} onPress={() => router.push(inviteHref('onboarding_join', capabilities.coParent) as Href)}>
                  <Text variant="callout">{o.welcome.joinButton}</Text>
                </Button>
              ) : null}
            </View>
          )}
        </ScrollView>
        {/* "The book is open." pins its one primary below the scroll, so "Write the first one" is whole on an iPhone SE and
            is the first thing reached at accessibility text sizes, whatever the speech card above it grows to (S08). */}
        {pinned ? <View className="px-6 pb-6 pt-3">{controls}</View> : null}
      </KeyboardAvoidingView>
      <LanguagePicker visible={languageOpen} onClose={() => setLanguageOpen(false)} onSelect={chooseLanguage} selected={spoken.primary.code} />
    </SafeAreaView>
  );
}

/** One line on the promise with its glyph (Phosphor Regular 20 pt, textMuted). */
function IconRow({ icon: Icon, text }: { icon: PhosphorIcon; text: string }) {
  const { c } = useTheme();
  return (
    <View className="flex-row items-start gap-3">
      <Icon size={20} color={c.textMuted} style={{ marginTop: 2 }} />
      <Text variant="callout" tone="muted" className="flex-1">
        {text}
      </Text>
    </View>
  );
}

/**
 * Why Continue is waiting, directly above it. Quiet (footnote, textMuted) until the waiting Continue is tapped; then
 * the same words with the warning mark, on their own accentSoft chip, so no status colour sits on the lit paper
 * (D-110). Announced politely; a change cross-fades (swapMs) and never shakes.
 */
function ReasonLine({ text, raised }: { text: string; raised: boolean }) {
  const { c } = useTheme();
  return (
    <Animated.View key={`${raised ? 'raised' : 'quiet'}:${text}`} entering={FadeIn.duration(tokens.motion.swapMs).reduceMotion(ReduceMotion.Never)} accessibilityLiveRegion="polite" className="mb-3">
      {raised ? (
        <View className="flex-row items-center gap-2 self-start rounded-2xl bg-secondary px-3 py-2" testID="onboarding.reason.raised">
          <WarningCircleIcon size={18} color={c.caution} weight="bold" />
          <Text variant="footnote" tone="default" className="shrink">
            {text}
          </Text>
        </View>
      ) : (
        <Text variant="footnote">{text}</Text>
      )}
    </Animated.View>
  );
}

/**
 * The route every "no book" path ends at: a cold launch with no book, Tonight, the Book tab and the Family tab (each
 * redirects here), and a sign-in on another phone. While a request to delete the account is open it is never the
 * welcome: the deletion screen takes its place, so "Begin the book" is not offered and a book cannot be made over the
 * request (lib/account-deletion/open-request.ts chooseScreen; critics' pass 30 Oct 2026, M1).
 */
export default function Onboarding() {
  const gate = useFirstRunGate();
  if (gate.screen === 'deletion' && gate.request) return <OpenDeletionScreen request={gate.request} />;
  if (gate.screen === 'checking') return <CheckingScreen />;
  return <FirstRun />;
}
