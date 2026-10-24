/**
 * Write: the Type half of capture (COMPONENTS.md 2.8; EXPERIENCE_PASS_2026-10 S19, S20 and 5.8 rows 3, 3a and 5a,
 * package P4b). Feels like paper, not a form. Every pause in typing autosaves to a local draft, so a closed sheet
 * or a crash loses nothing. Also reached from Review with ?draftId= to type a letter for a recording that could not
 * be written down (capture mode becomes "mixed").
 *
 * Design (docs/design/BENCHMARK.md, "Screens"; S19):
 * - The one sheet that is a room: the lamp's `write` scene (anchor top, 0.5, still: nothing breathes while typing).
 * - Day One / Apple Notes writing surface: no box, the letter face at letter size. The prompt, when there is one,
 *   is the literary line in `prompt` textMuted above the page. Typed text keeps the keyboard's own autocorrect;
 *   the machine never touches it.
 * - Above the keyboard, the two destinations side by side (stacked at accessibility sizes): "Add to Asha's book"
 *   and "Keep private", in the outline style until there is text.
 * - "Saved on this phone" is a quiet status after a pause, announced at most every 10 s, and it stays. A write that
 *   fails shows "Not saved yet" in the same place and is tried again on the next pause. Neither is a status colour:
 *   this is lit paper (D-110).
 *
 * Typed letters skip Review (S20). A destination tap saves the words, then hands the letter to Review's one Keep step
 * (lib/capture/keep-intent.ts): the Keep gate decides there exactly as for a spoken letter (D-082, D-083), and the
 * saved moment plays and lands on the Book, or the Plus sheet opens and the letter waits on Tonight as a draft.
 */
import { router, useLocalSearchParams } from 'expo-router';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { renderTemplate } from '@scribe/core';
import { PROMPTS } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { addButtonLabel, spokenSeparator } from '@/components/capture/review-view.logic';
import { Button, ButtonRow } from '@/components/ui/button';
import { Lamp } from '@/components/ui/lamp';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { ModalHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { announce, useTheme } from '@/lib/a11y';
import { armKeep } from '@/lib/capture/keep-intent';
import { copy, pendingCopy } from '@/lib/copy';
import { ageText } from '@/lib/dates';
import { createDraft, deleteDraft, getActiveChild, getDraft, setDraftTyped, todayISO } from '@/lib/store';

const ANNOUNCE_EVERY_MS = 10_000;

/** The autosave line: nothing yet, kept on this phone, or a write that did not go through (tried again on the next pause). */
type SaveState = 'none' | 'saved' | 'failed';

export default function Write() {
  const { c } = useTheme();
  const params = useLocalSearchParams<{ promptKey?: string; draftId?: string }>();
  const child = getActiveChild();
  const existing = params.draftId ? getDraft(params.draftId) : null;
  const [text, setText] = useState(existing?.typedText ?? '');
  const [saveState, setSaveState] = useState<SaveState>('none');
  const draftId = useRef<string | null>(existing?.id ?? null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnnounced = useRef(0);

  const promptKey = params.promptKey ?? existing?.promptKey ?? null;
  const prompt = promptKey ? PROMPTS.find((p) => p.key === promptKey) : undefined;

  /** Write the words to this phone. False when the write did not go through: the words stay on screen, and "Not saved yet" says so. */
  const persist = (value: string): boolean => {
    if (!child) return false;
    try {
      if (!draftId.current) {
        if (!value.trim()) return false;
        draftId.current = createDraft({
          childId: child.id,
          captureMode: 'typed',
          promptKey,
          audioUri: null,
          audioDurationMs: null,
          typedText: value,
        }).id;
      } else setDraftTyped(draftId.current, value);
    } catch {
      setSaveState('failed');
      announce(copy.write.notSaved);
      return false;
    }
    setSaveState('saved');
    const now = Date.now();
    if (now - lastAnnounced.current > ANNOUNCE_EVERY_MS) {
      lastAnnounced.current = now;
      announce(pendingCopy.write.savedOnPhone);
    }
    return true;
  };

  // The words as last typed, for the unmount flush (a closure would hold an old copy).
  const latest = useRef(text);
  const onChange = (value: string) => {
    setText(value);
    latest.current = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      persist(value);
    }, 500);
  };

  // Leaving any other way (a swipe down within the pause, a relaunch of the stack): a pending autosave is written now,
  // never dropped.
  const persistRef = useRef(persist);
  persistRef.current = persist;
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
        persistRef.current(latest.current);
      }
    },
    [],
  );

  const close = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    // An empty typed draft is nothing; a recording draft is always kept.
    if (draftId.current && !text.trim() && !getDraft(draftId.current)?.audioUri) deleteDraft(draftId.current);
    // Words that cannot be written to this phone keep the sheet open, with "Not saved yet" on screen and said aloud:
    // closing would lose them (S19).
    else if (text.trim() && !persist(text)) return;
    router.back();
  };

  /** "Add to Asha's book" or "Keep private": one tap keeps the letter (S20). Nothing is kept unless the words are on this phone first. */
  const keep = (inBook: boolean) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!persist(text) || !draftId.current) return;
    armKeep(draftId.current, inBook);
    router.replace({ pathname: '/review', params: { draftId: draftId.current } });
  };

  if (!child) return null;
  const age = ageText(child, todayISO());
  const dateline = age ? `${child.name} · ${age}` : child.name;
  const empty = !text.trim();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <Lamp scene="write" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ModalHeader
          onClose={close}
          leading={
            saveState === 'saved' ? (
              <Animated.View key="saved" entering={FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never)} className="flex-row items-center gap-1.5" accessibilityLiveRegion="polite">
                <CheckIcon size={14} color={c.textMuted} weight="bold" />
                <Text variant="footnote">{pendingCopy.write.savedOnPhone}</Text>
              </Animated.View>
            ) : saveState === 'failed' ? (
              <Animated.View key="failed" entering={FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never)} className="flex-row items-center gap-1.5" accessibilityLiveRegion="polite" testID="write.notSaved">
                <WarningCircleIcon size={14} color={c.textMuted} weight="bold" />
                <Text variant="footnote" tone="default">
                  {copy.write.notSaved}
                </Text>
              </Animated.View>
            ) : null
          }
        />
        <ScrollView contentContainerClassName="flex-grow gap-3 px-6 pb-6 pt-4" keyboardShouldPersistTaps="handled">
          <Text variant="letterDateline" caps accessibilityLabel={spokenSeparator(dateline)}>
            {dateline}
          </Text>
          {prompt && (
            // The prompt is the one literary line above the page (S19), carried over from Tonight or Listen (5.8 row 3).
            <Text variant="prompt" tone="muted" testID="write.prompt">
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
          <ButtonRow>
            <Button size="lg" fullWidth label={addButtonLabel(child.name)} onPress={() => keep(true)} disabled={empty} testID="write.keep.book" />
            <Button variant="quiet" size="lg" fullWidth label={copy.review.destination.privateButton} onPress={() => keep(false)} disabled={empty} testID="write.keep.private" />
          </ButtonRow>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
