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
 * - Above the keyboard, the two destinations stacked as Review's footer is: "Add to Asha's book" full width and
 *   "Keep private" quiet beneath, off until there is text (P4 critics' pass S2).
 * - "Saved on this phone" is a quiet status after a pause, announced at most every 10 s, and it stays. A write that
 *   fails shows "Not saved yet" in the same place and is tried again on the next pause. Neither is a status colour:
 *   this is lit paper (D-110).
 *
 * Typed letters skip Review (S20). A destination tap saves the words, then hands the letter to Review's one Keep step
 * (lib/capture/keep-intent.ts): the Keep gate decides there exactly as for a spoken letter (D-082, D-083), and the
 * saved moment plays and lands on the Book, or the Plus sheet opens and the letter waits on Tonight as a draft.
 */
import { Stack, router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, ScrollView, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { renderTemplate } from '@scribe/core';
import { PROMPTS } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { addButtonLabel, followCaretToEnd, pageEmptinessChanged, sheetKeyboardOffset, spokenSeparator, writeSwipeAllowed, writeWords } from '@/components/capture/review-view.logic';
import { Button } from '@/components/ui/button';
import { Lamp } from '@/components/ui/lamp';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { ModalHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { announce, useIsAccessibilitySize, useTheme } from '@/lib/a11y';
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
  // Read from the store once, when Write opens: never again on a render, so nothing on this page waits on the
  // database while someone types.
  const [child] = useState(getActiveChild);
  const [existing] = useState(() => (params.draftId ? getDraft(params.draftId) : null));
  const [initialText] = useState(existing?.typedText ?? '');
  // The page is uncontrolled (pageEmptinessChanged): the words live in the input and in `latest` below. `text` is the
  // words as of the last pause or the last time the page went from empty to words or back; Write renders then, never
  // on each keystroke, and nothing is ever sent back into the input.
  const [text, setText] = useState(initialText);
  const [saveState, setSaveState] = useState<SaveState>('none');
  const draftId = useRef<string | null>(existing?.id ?? null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastAnnounced = useRef(0);

  const promptKey = params.promptKey ?? existing?.promptKey ?? null;
  const prompt = promptKey ? PROMPTS.find((p) => p.key === promptKey) : undefined;

  /** Write the words to this phone. False when the write did not go through: the words stay on screen, and "Not saved yet" says so. */
  const persist = (value: string): boolean => {
    if (!child) return false;
    const create = (v: string) => createDraft({ childId: child.id, captureMode: 'typed', promptKey, audioUri: null, audioDurationMs: null, typedText: v }).id;
    const r = writeWords({ create, update: setDraftTyped }, draftId.current, value);
    draftId.current = r.draftId;
    // "Not saved yet" after a write that did not go through; the next good write puts "Saved on this phone" back and
    // releases Close, Android's back and the swipe.
    if (r.saveState) setSaveState(r.saveState);
    if (r.saveState === 'failed') announce(copy.write.notSaved);
    // The words as of this write, for the swipe and the destinations (one render per pause, not per keystroke).
    setText(value);
    if (!r.ok) return false;
    const now = Date.now();
    if (now - lastAnnounced.current > ANNOUNCE_EVERY_MS) {
      lastAnnounced.current = now;
      announce(pendingCopy.write.savedOnPhone);
    }
    return true;
  };

  // The words as last typed, for the unmount flush (a closure would hold an old copy).
  const latest = useRef(initialText);
  const onChange = (value: string) => {
    if (pageEmptinessChanged(latest.current, value)) setText(value);
    latest.current = value;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      persist(value);
    }, 500);
  };

  // Leaving any other way (a swipe down within the pause, a relaunch of the stack): a pending autosave is written now,
  // never dropped. After a write that did not go through, the swipe down is refused instead, as Close is (below).
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
    const text = latest.current;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    // An empty typed draft is nothing; a recording draft is always kept.
    if (draftId.current && !text.trim() && !getDraft(draftId.current)?.audioUri) deleteDraft(draftId.current);
    // Words that cannot be written to this phone keep the sheet open, with "Not saved yet" on screen and said aloud:
    // closing would lose them (S19).
    else if (text.trim() && !persist(text)) return;
    router.back();
  };

  // Android's back is Close (S19): it writes the words now, and stays on Write when they cannot be written to the
  // phone. (Its native stack turns the swipe off and handles back in JS, so gestureEnabled alone would not hold it.)
  const closeRef = useRef(close);
  closeRef.current = close;
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        closeRef.current();
        return true;
      });
      return () => sub.remove();
    }, []),
  );

  // The swipe down follows the same rule, from the last write. One options object per answer, so the stack is not
  // asked to update on every keystroke.
  const swipeAllowed = writeSwipeAllowed({ text, writeFailed: saveState === 'failed' });
  const screenOptions = useMemo(() => ({ gestureEnabled: swipeAllowed }), [swipeAllowed]);
  // A swipe iOS refused (the sheet springs back, `gestureCancel`) is a Close: it writes the words now, leaves when
  // they go through (the disk came back), and says "Not saved yet" again when they still cannot be written. Only a
  // refused swipe: a drag let go halfway while the swipe is allowed never closes Write. (`gestureCancel` is a native
  // stack event that expo-router's navigation type does not list, hence the cast.)
  const swipeHeld = useRef(false);
  swipeHeld.current = !swipeAllowed;
  const navigation = useNavigation();
  useEffect(
    () =>
      navigation.addListener('gestureCancel' as never, () => {
        if (swipeHeld.current) closeRef.current();
      }),
    [navigation],
  );

  /** "Add to Asha's book" or "Keep private": one tap keeps the letter (S20). Nothing is kept unless the words are on this phone first. */
  const keep = (inBook: boolean) => {
    const text = latest.current;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (!persist(text) || !draftId.current) return;
    armKeep(draftId.current, inBook);
    router.replace({ pathname: '/review', params: { draftId: draftId.current } });
  };

  // At accessibility text sizes the autosave line has its own row under the header, where it can wrap, instead of
  // running into Close (P4 critics' pass S5).
  const large = useIsAccessibilitySize();

  // KeyboardAvoidingView measures itself inside the sheet but the keyboard from the top of the screen; the sheet's
  // own top closes the gap (sheetKeyboardOffset), so the page and both destinations sit above the keyboard.
  const screen = useWindowDimensions();
  const [sheetHeight, setSheetHeight] = useState(0);
  const keyboardOffset = sheetKeyboardOffset(screen.height, sheetHeight);

  // The page grows with the words and the sheet scrolls, so the line being written stays in view above the keyboard.
  const scroll = useRef<ScrollView>(null);
  const selectionEnd = useRef<number | null>(null);
  const onContentSizeChange = () => {
    if (followCaretToEnd({ selectionEnd: selectionEnd.current, length: latest.current.length })) scroll.current?.scrollToEnd({ animated: false });
  };

  if (!child) return null;
  const age = ageText(child, todayISO());
  const dateline = age ? `${child.name} · ${age}` : child.name;
  const empty = !text.trim();
  const status =
    saveState === 'saved' ? (
      <Animated.View key="saved" entering={FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never)} className="flex-row items-center gap-1.5" accessibilityLiveRegion="polite">
        <CheckIcon size={14} color={c.textMuted} weight="bold" />
        <Text variant="footnote" className="shrink">
          {pendingCopy.write.savedOnPhone}
        </Text>
      </Animated.View>
    ) : saveState === 'failed' ? (
      <Animated.View key="failed" entering={FadeIn.duration(tokens.motion.fadeMs).reduceMotion(ReduceMotion.Never)} className="flex-row items-center gap-1.5" accessibilityLiveRegion="polite" testID="write.notSaved">
        <WarningCircleIcon size={14} color={c.textMuted} weight="bold" />
        <Text variant="footnote" tone="default" className="shrink">
          {copy.write.notSaved}
        </Text>
      </Animated.View>
    ) : null;

  return (
    <SafeAreaView className="flex-1 bg-background" onLayout={(e) => setSheetHeight(e.nativeEvent.layout.height)}>
      {/* Words on screen that the last write could not keep: the sheet will not swipe away (iOS holds it in place), so
          they are never lost to a swipe. Close stays open in the same case; both work again after the next good write. */}
      <Stack.Screen options={screenOptions} />
      <Lamp scene="write" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={keyboardOffset} className="flex-1">
        <ModalHeader onClose={close} leading={large ? null : status} />
        {large && status ? <View className="px-5 pb-1">{status}</View> : null}
        <ScrollView ref={scroll} contentContainerClassName="flex-grow gap-3 px-6 pb-6 pt-4" keyboardShouldPersistTaps="handled">
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
            // Uncontrolled (D-057): the keyboard's own autocorrect, QuickType, dictation and composing keyboards work
            // undisturbed, and the person's words are never written back into the field. The field grows with the
            // words instead of scrolling inside itself, so the sheet's scroll keeps the caret in view.
            className="mt-3 flex-none"
            inputClassName="flex-none"
            defaultValue={initialText}
            onChangeText={onChange}
            onSelectionChange={(e) => {
              selectionEnd.current = e.nativeEvent.selection.end;
            }}
            onContentSizeChange={onContentSizeChange}
            scrollEnabled={false}
            placeholder={copy.tonight.typing.placeholder}
            autoFocus
          />
        </ScrollView>
        {/* Stacked as Review's footer is: "Add to Asha's book" full width, "Keep private" quiet beneath, so the main
            action never breaks over two lines (P4 critics' pass S2). */}
        <View className="gap-1 border-t border-border bg-background px-5 pb-2 pt-3">
          <Button size="lg" fullWidth label={addButtonLabel(child.name)} onPress={() => keep(true)} disabled={empty} testID="write.keep.book" />
          <Button variant="quiet" fullWidth label={copy.review.destination.privateButton} onPress={() => keep(false)} disabled={empty} testID="write.keep.private" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
