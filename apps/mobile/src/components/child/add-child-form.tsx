// web: same (the date control is a native date input) | android: same
/**
 * Add a child (PRD B F2.1; EXPERIENCE_PASS_2026-10 S47, package P6): the first-run child step again, for one more
 * book. The name, then the birthday or the due date, with no date chosen for the person ("Born today" is a chip
 * beside the date control), the small book cover taking the name after a typing pause, and one primary that waits
 * with its reason in words above it. Free, with no Plus gate (D-082, D-083): the free letters are one pool across
 * every book. The rules are add-child-form.logic.ts, shared with first run through packages/core.
 *
 * Motion: the date block arrives once the first letter of the name is in (S05), with `motion.enter`; the reason line
 * cross-fades (swapMs); controls never animate in. Accessibility: the heading takes focus, the waiting primary is
 * read as dimmed with its reason as the hint, and a tap on it says the reason and moves focus to what is missing.
 */
import { checkChildName, clampText, CHILD_NAME_MAX, latestDueDate, nearLimit, textLength } from '@scribe/core';
import { router } from 'expo-router';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import * as React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View, type Text as RNText, type TextInput } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { tokens } from '@scribe/design-tokens';
import { BookCover } from '@/components/book/book-cover';
import { Button } from '@/components/ui/button';
import { Chip, ChoiceGroup } from '@/components/ui/choice-group';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { announce, useFocusOnMount, useTheme } from '@/lib/a11y';
import { ordinalOf, track } from '@/lib/analytics/track';
import { copy, fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { addChild, getActiveChild, setActiveChildId, todayISO } from '@/lib/store';
import { CoverHeading, useCoverPlace } from './cover-heading';
import { DateField, type DateFieldHandle } from './date-field';
import { addChildBlock, addChildCta, addChildValues } from './add-child-form.logic';

/** The cover takes a typed name after this pause, with no motion per letter (S05, as first run). */
const COVER_PAUSE_MS = 300;

function useSettled<T>(value: T, ms: number): T {
  const [settled, setSettled] = React.useState(value);
  React.useEffect(() => {
    const id = setTimeout(() => setSettled(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return settled;
}

export function AddChildForm() {
  const o = copy.onboarding.child;
  const motion = useMotion();
  const heading = React.useRef<RNText>(null);
  const nameField = React.useRef<TextInput>(null);
  const dateField = React.useRef<DateFieldHandle>(null);
  const [name, setName] = React.useState('');
  const [expecting, setExpecting] = React.useState(false);
  // No date is chosen for the person (S47): a seven-month-old is never saved as a newborn by a default.
  const [birthday, setBirthday] = React.useState<string | null>(null);
  const [dueDate, setDueDate] = React.useState<string | null>(null);
  const [dateShown, setDateShown] = React.useState(false);
  const [nudged, setNudged] = React.useState(false);
  const coverName = useSettled(name, COVER_PAUSE_MS);
  // Beside the heading, under it at accessibility text sizes, or away while the keyboard leaves under 480 pt (S05, S47).
  const coverPlace = useCoverPlace();

  useFocusOnMount(heading);
  React.useEffect(() => {
    if (name.trim()) setDateShown(true);
  }, [name]);

  const today = todayISO();
  const input = { name, expecting, birthday, dueDate, today };
  const block = addChildBlock(input);
  React.useEffect(() => setNudged(false), [block]);

  const save = () => {
    const values = addChildValues(input);
    if (!values) return;
    const signsAs = getActiveChild()?.signsAs ?? '';
    const child = addChild({ ...values, signsAs });
    setActiveChildId(child.id);
    track('child_added', { has_date: true, child_ordinal: ordinalOf(child.id), in_first_run: false, added_together: false });
    haptic('success');
    router.dismissTo('/book');
  };

  /** The waiting primary was tapped: say why, and move focus to what is missing. */
  const nudge = () => {
    if (!block) return;
    setNudged(true);
    announce(block);
    if (!checkChildName(name).ok) nameField.current?.focus();
    else dateField.current?.focus();
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView contentContainerClassName="flex-grow gap-6 px-5 pb-6 pt-4" keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
        <CoverHeading title={o.title} headingRef={heading} place={coverPlace}>
          <BookCover name={coverName} size="sm" />
        </CoverHeading>

        <TextField
          ref={nameField}
          label={o.nameLabel}
          face="serif"
          value={name}
          onChangeText={(v) => setName(clampText(v, CHILD_NAME_MAX))}
          placeholder={o.namePlaceholder}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="givenName"
          autoComplete="given-name"
          returnKeyType="done"
          helper={nearLimit(textLength(name), CHILD_NAME_MAX) ? fill(o.nameLimit, { n: CHILD_NAME_MAX }) : copy.children.add.twinsHelp}
        />

        {dateShown ? (
          <Animated.View entering={motion.enter()} className="gap-4">
            <ChoiceGroup
              label={o.birthdayLabel}
              value={expecting ? 'expecting' : 'born'}
              onChange={(v) => setExpecting(v === 'expecting')}
              options={[
                { value: 'born', label: o.birthdayLabel },
                { value: 'expecting', label: o.expectingLabel },
              ]}
            />
            <View className="gap-2">
              <View className="min-h-12 flex-row flex-wrap items-center justify-between gap-2">
                <Text variant="labelSmall" tone="muted">
                  {expecting ? copy.childrenExtra.dueDateLabel : o.birthdayLabel}
                </Text>
                <View className="flex-row flex-wrap items-center justify-end gap-2">
                  {/* "Born today" is a chip beside the date control, never a default (S05, S47). */}
                  {!expecting && birthday !== today ? <Chip label={o.bornToday} onPress={() => setBirthday(today)} testID="addChild.bornToday" /> : null}
                  <DateField
                    ref={dateField}
                    key={expecting ? 'due' : 'born'}
                    label={expecting ? copy.childrenExtra.dueDateLabel : o.birthdayLabel}
                    chooseLabel={o.chooseDate}
                    value={expecting ? dueDate : birthday}
                    onChange={expecting ? setDueDate : setBirthday}
                    startISO={today}
                    min={expecting ? today : undefined}
                    max={expecting ? latestDueDate(today) : today}
                  />
                </View>
              </View>
              {expecting ? <Text variant="footnote">{o.expectingHelp}</Text> : null}
            </View>
          </Animated.View>
        ) : null}

        <View className="flex-1" />
        {/* Controls never animate in (MOTION principle 2). */}
        <View>
          {block ? <ReasonLine text={block} raised={nudged} /> : null}
          <View>
            <Button size="lg" fullWidth disabled={block !== null} label={addChildCta(name)} accessibilityHint={block ?? undefined} onPress={save} testID="addChild.add" />
            {/* A tap on the waiting primary lands on this clear layer (a disabled button takes no tap) and raises the reason. */}
            {block ? <Pressable onPress={nudge} accessible={false} importantForAccessibility="no" style={StyleSheet.absoluteFill} testID="addChild.add.waiting" /> : null}
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Why the primary is waiting, directly above it: quiet (footnote, textMuted) until the waiting primary is tapped; then
 * the same words with the warning mark on an accentSoft chip. Announced politely; a change cross-fades, never shakes.
 */
function ReasonLine({ text, raised }: { text: string; raised: boolean }) {
  const { c } = useTheme();
  return (
    <Animated.View key={`${raised ? 'raised' : 'quiet'}:${text}`} entering={FadeIn.duration(tokens.motion.swapMs).reduceMotion(ReduceMotion.Never)} accessibilityLiveRegion="polite" className="mb-3" testID="addChild.reason">
      {raised ? (
        <View className="flex-row items-center gap-2 self-start rounded-2xl bg-secondary px-3 py-2">
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
