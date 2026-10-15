import DateTimePicker from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Toggle } from '@/components/platform/toggle';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy, fill } from '@/lib/copy';
import { ordinalOf, track } from '@/lib/analytics/track';
import { haptic } from '@/lib/haptics';
import { isoOf, longDate } from '@/lib/dates';
import { addChild, getActiveChild, setActiveChildId, todayISO } from '@/lib/store';
import { useTheme } from '@/lib/a11y';

const DAY = 86_400_000;

/**
 * Add a child (PRD B F2.1): name plus birthday or due date. Books are free to
 * start (D-082, D-083): the free letters are one pool across every book, so
 * there is no second-book gate.
 */
export function AddChildForm() {
  const c = useTheme().c;
  const o = copy.onboarding.child;
  const x = copy.childrenExtra;
  const [name, setName] = useState('');
  const [expecting, setExpecting] = useState(false);
  const [date, setDate] = useState(new Date());
  const [pickerOpen, setPickerOpen] = useState(Platform.OS === 'ios');
  const [tried, setTried] = useState(false);

  const trimmed = name.trim();
  const dateLabel = expecting ? x.dueDateLabel : o.birthdayLabel;

  const save = () => {
    setTried(true);
    if (!trimmed) return;
    const iso = todayISO(date);
    const signsAs = getActiveChild()?.signsAs ?? '';
    const child = addChild({ name: trimmed, birthday: expecting ? null : iso, dueDate: expecting ? iso : null, signsAs });
    setActiveChildId(child.id);
    track('child_added', { has_date: true, child_ordinal: ordinalOf(child.id), in_first_run: false, added_together: false });
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
          <Toggle
            label={o.expectingLabel}
            description={o.expectingHelp}
            value={expecting}
            onValueChange={(v) => {
              setExpecting(v);
              setDate(new Date());
            }}
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
