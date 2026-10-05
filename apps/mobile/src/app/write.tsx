/**
 * Write: the Type half of capture (COMPONENTS.md 2.8). Feels like paper, not
 * a form. Every pause in typing autosaves to a local draft, so a closed sheet
 * or a crash loses nothing. Save opens Review for the destination choice.
 * Also reached from Review with ?draftId= to type a letter for a recording
 * that could not be written down (capture mode becomes "mixed").
 *
 * Design (docs/design/BENCHMARK.md, "Screens"):
 * - Day One / Apple Notes writing surface: no box, the letter face at letter size,
 *   the prompt as a quiet line above. Typed text keeps the keyboard's own autocorrect.
 * - Save sits in the thumb zone above the keyboard (DESIGN_LANGUAGE principle 2;
 *   TDD 09 A11Y-F16), not alone in the top-right corner.
 * - "Saved on this phone" is a quiet status, announced at most every 10 s.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { renderTemplate } from '@scribe/core';
import { PROMPTS } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { ModalHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { announce, useTheme } from '@/lib/a11y';
import { copy, pendingCopy } from '@/lib/copy';
import { ageText } from '@/lib/dates';
import { createDraft, deleteDraft, getActiveChild, getDraft, setDraftTyped, todayISO } from '@/lib/store';

const ANNOUNCE_EVERY_MS = 10_000;

export default function Write() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ promptKey?: string; draftId?: string }>();
  const child = getActiveChild();
  const existing = params.draftId ? getDraft(params.draftId) : null;
  const [text, setText] = useState(existing?.typedText ?? '');
  const [saved, setSaved] = useState(false);
  const draftId = useRef<string | null>(existing?.id ?? null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnnounced = useRef(0);

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
    const now = Date.now();
    if (now - lastAnnounced.current > ANNOUNCE_EVERY_MS) {
      lastAnnounced.current = now;
      announce(pendingCopy.write.savedOnPhone);
    }
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
    router.replace({ pathname: '/review', params: { draftId: draftId.current } });
  };

  if (!child) return null;
  const age = ageText(child, todayISO());
  const dateline = age ? `${child.name} · ${age}` : child.name;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ModalHeader
          onClose={close}
          leading={
            saved ? (
              <Animated.View entering={FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never)} className="flex-row items-center gap-1.5" accessibilityLiveRegion="polite">
                <CheckIcon size={14} color={c.textMuted} weight="bold" />
                <Text variant="footnote">{pendingCopy.write.savedOnPhone}</Text>
              </Animated.View>
            ) : null
          }
        />
        <ScrollView contentContainerClassName="flex-grow gap-3 px-6 pb-6 pt-4" keyboardShouldPersistTaps="handled">
          <Text variant="letterDateline" caps>
            {dateline}
          </Text>
          {prompt && (
            <Text variant="callout" tone="muted">
              {renderTemplate(prompt.text, { child: child.name })}
            </Text>
          )}
          <TextField
            variant="letter"
            label={pendingCopy.write.label}
            labelHidden
            className="mt-3"
            value={text}
            onChangeText={onChange}
            placeholder={copy.tonight.typing.placeholder}
            autoFocus
          />
        </ScrollView>
        <View className="border-t border-border bg-background px-5 pb-2 pt-3">
          <Button size="lg" fullWidth label={copy.tonight.typing.saveButton} onPress={done} disabled={!text.trim()} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
