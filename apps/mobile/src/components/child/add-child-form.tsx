import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, TextInput, View, useColorScheme } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy, fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { isoOf, longDate } from '@/lib/dates';
import { devShortcutsAllowed } from '@/lib/build-env';
import { addChild, getActiveChild, newChildNeedsPlus, setActiveChildId, todayISO } from '@/lib/store';
import { PlusGate } from './plus-gate';

const DAY = 86_400_000;

/**
 * Add a child (PRD B F2.1): name plus birthday or due date. Books made in
 * first run are free; another book after that is a Plus feature (PRD C 4.1),
 * and books joined as co-parent never count (store.newChildNeedsPlus).
 */
export function AddChildForm() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const o = copy.onboarding.child;
  const x = copy.childrenExtra;
  const [gated] = useState(newChildNeedsPlus);
  const [passedGate, setPassedGate] = useState(false);
  const [name, setName] = useState('');
  const [expecting, setExpecting] = useState(false);
  const [date, setDate] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(Platform.OS === 'ios');
  const [tried, setTried] = useState(false);

  if (gated && !passedGate) {
    return <PlusGate onNotNow={() => router.back()} onContinueDev={devShortcutsAllowed ? () => setPassedGate(true) : undefined} />;
  }

  const trimmed = name.trim();
  const dateLabel = expecting ? x.dueDateLabel : o.birthdayLabel;

  const save = () => {
    setTried(true);
    if (!trimmed) return;
    const iso = todayISO(date);
    const signsAs = getActiveChild()?.signsAs ?? '';
    const child = addChild({ name: trimmed, birthday: expecting ? null : iso, dueDate: expecting ? iso : null, signsAs });
    setActiveChildId(child.id);
    haptic('success');
    router.dismissTo('/book');
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
      <ScrollView contentContainerClassName="gap-6 px-5 pb-10 pt-4" keyboardShouldPersistTaps="handled">
        <Text role="heading" className="font-serif text-3xl leading-10 text-foreground">
          {o.title}
        </Text>
        <Text className="text-base leading-6 text-muted-foreground">{copy.children.add.body}</Text>

        <View className="gap-2">
          <Text className="text-base font-medium text-muted-foreground">{o.nameLabel}</Text>
          <TextInput
            className="min-h-14 rounded-2xl border border-border bg-card px-4 text-lg text-foreground"
            value={name}
            onChangeText={setName}
            placeholder={o.namePlaceholder}
            placeholderTextColor={c.textMuted}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            accessibilityLabel={o.nameLabel}
          />
          {tried && !trimmed ? (
            <Text accessibilityLiveRegion="polite" className="text-sm text-caution">
              {x.nameRequired}
            </Text>
          ) : (
            <Text className="text-sm text-muted-foreground">{o.nameHelp}</Text>
          )}
        </View>

        <View className="min-h-11 flex-row items-center justify-between gap-4">
          <View className="flex-1 gap-1">
            <Text className="text-base text-foreground">{o.expectingLabel}</Text>
            <Text className="text-sm text-muted-foreground">{o.expectingHelp}</Text>
          </View>
          <Switch
            value={expecting}
            onValueChange={(v) => {
              haptic('tap');
              setExpecting(v);
              setDate(new Date());
            }}
            trackColor={{ true: c.accent, false: c.line }}
            accessibilityLabel={o.expectingLabel}
          />
        </View>

        <View className="gap-2">
          <Text className="text-base font-medium text-muted-foreground">{dateLabel}</Text>
          {Platform.OS !== 'ios' && (
            <Pressable onPress={() => setPickerOpen(true)} accessibilityRole="button" accessibilityLabel={dateLabel} className="min-h-12 justify-center rounded-2xl border border-border bg-card px-4">
              <Text className="text-lg text-foreground">{longDate(isoOf(date))}</Text>
            </Pressable>
          )}
          {pickerOpen && (
            <DateTimePicker
              key={expecting ? 'due' : 'birth'}
              value={date}
              mode="date"
              display={Platform.OS === 'ios' ? 'compact' : 'default'}
              minimumDate={expecting ? new Date() : undefined}
              maximumDate={expecting ? new Date(Date.now() + 305 * DAY) : new Date()}
              accentColor={c.accent}
              accessibilityLabel={dateLabel}
              onChange={(_, d) => {
                if (Platform.OS !== 'ios') setPickerOpen(false);
                if (d) setDate(d);
              }}
            />
          )}
          <Text className="text-sm text-muted-foreground">{fill(o.birthdayHelp, { child: trimmed || o.nameLabel })}</Text>
        </View>

        <Button size="lg" onPress={save} accessibilityLabel={copy.children.switcher.addButton}>
          <Text>{trimmed ? fill(copy.children.add.cta, { child: trimmed }) : copy.children.switcher.addButton}</Text>
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
