/**
 * Write: the Type half of capture (COMPONENTS.md 2.8). Feels like paper, not
 * a form. Every pause in typing autosaves to a local draft, so a closed sheet
 * or a crash loses nothing. Save opens Review for the destination choice.
 * Also reached from Review with ?draftId= to type a letter for a recording
 * that could not be written down (capture mode becomes "mixed").
 */
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View, useColorScheme } from 'react-native';
import { renderTemplate } from '@scribe/core';
import { ageText } from '@/lib/dates';
import { PROMPTS } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { Text } from '@/components/ui/text';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { createDraft, deleteDraft, getActiveChild, getDraft, setDraftTyped, todayISO } from '@/lib/store';

export default function Write() {
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const params = useLocalSearchParams<{ promptKey?: string; draftId?: string }>();
  const child = getActiveChild();
  const existing = params.draftId ? getDraft(params.draftId) : null;
  const [text, setText] = useState(existing?.typedText ?? '');
  const [saved, setSaved] = useState(false);
  const draftId = useRef<string | null>(existing?.id ?? null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const promptKey = params.promptKey ?? existing?.promptKey ?? null;
  const prompt = promptKey ? PROMPTS.find((p) => p.key === promptKey) : undefined;

  const persist = (value: string) => {
    if (!child) return;
    if (!draftId.current) {
      if (!value.trim()) return;
      draftId.current = createDraft({
        childId: child.id,
        captureMode: 'typed',
        promptKey,
        audioUri: null,
        audioDurationMs: null,
        typedText: value,
      }).id;
    } else setDraftTyped(draftId.current, value);
    setSaved(true);
  };

  const onChange = (value: string) => {
    setText(value);
    setSaved(false);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(value), 500);
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    // An empty typed draft is nothing; a recording draft is always kept.
    if (draftId.current && !text.trim() && !getDraft(draftId.current)?.audioUri) deleteDraft(draftId.current);
    else if (text.trim()) persist(text);
    router.back();
  };

  const done = () => {
    if (timer.current) clearTimeout(timer.current);
    persist(text);
    if (!draftId.current) return;
    haptic('press');
    router.replace({ pathname: '/review', params: { draftId: draftId.current } });
  };

  if (!child) return null;
  const age = ageText(child, todayISO());
  const dateline = age ? `${child.name} · ${age}` : child.name;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Button variant="ghost" size="sm" className="-ml-4" onPress={close}>
            <Text className="text-primary">{copy.common.closeButton}</Text>
          </Button>
          <Text className="text-sm text-muted-foreground" accessibilityLiveRegion="polite">
            {saved ? pendingCopy.write.savedOnPhone : ''}
          </Text>
          <Button size="sm" onPress={done} disabled={!text.trim()}>
            <Text>{copy.tonight.typing.saveButton}</Text>
          </Button>
        </View>
        <ScrollView contentContainerClassName="flex-grow gap-4 px-5 pb-8 pt-4" keyboardShouldPersistTaps="handled">
          <Text className="text-xs font-medium tracking-[1.5px] text-muted-foreground">{dateline.toUpperCase()}</Text>
          {prompt && <Text className="text-lg leading-7 text-muted-foreground">{renderTemplate(prompt.text, { child: child.name })}</Text>}
          <TextInput
            className="min-h-64 flex-1 font-serif text-xl leading-8 text-foreground"
            value={text}
            onChangeText={onChange}
            placeholder={fill(copy.tonight.typing.letterPlaceholder, { child: child.name })}
            placeholderTextColor={c.textMuted}
            multiline
            autoFocus
            textAlignVertical="top"
            accessibilityLabel={pendingCopy.write.label}
            accessibilityHint={copy.tonight.typing.placeholder}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
