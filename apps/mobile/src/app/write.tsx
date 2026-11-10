/**
 * Write: the Type half of capture (COMPONENTS.md 2.8; EXPERIENCE_PASS_2026-10 S19, S20 and 5.8 rows 3, 3a and 5a,
 * package P4b). Feels like paper, not a form. The words are written to a local draft at least every 500 ms while
 * someone types (silently) and again after every pause, so a closed sheet or a crash loses at most the last half
 * second (F04-REQ-011). Also reached from Review with ?draftId= to type a letter for a recording that could not
 * be written down (capture mode becomes "mixed").
 *
 * Design (docs/design/BENCHMARK.md, "Screens"; S19):
 * - The one sheet that is a room: the lamp's `write` scene (anchor top, 0.5, still: nothing breathes while typing).
 * - Day One / Apple Notes writing surface: no box, the letter face at letter size. The prompt, when there is one,
 *   is the literary line in `prompt` textMuted above the page. Typed text keeps the keyboard's own autocorrect;
 *   the machine never touches it.
 * - Above the keyboard, the two destinations stacked as Review's footer is: "Add to Asha's book" full width and
 *   "Keep private" quiet beneath, off until there is text (P4 critics' pass S2). From accessibility text sizes up they
 *   ride at the end of the scroll instead of pinned, as Review's and Tonight's do (lib/review-layout.logic.ts
 *   `footerPlacement`), so a footer taller than the room above the keyboard can never push "Add to the book" off the
 *   screen; the page then follows the last line typed, not the buttons (review-view.logic `pageEndOffset`).
 * - "Saved on this phone" is a quiet status after a pause, announced at most every 10 s, and it stays. A write that
 *   fails shows "Not saved yet" in the same place and is tried again on the next pause. Neither is a status colour:
 *   this is lit paper (D-110).
 *
 * "Another thought" (engagement.md section 3, Option A; BL-E1): the quiet Tonight control under the prompt, for a new
 * letter that opened with one. A press swaps the line in place from the hand-written library, never one already shown
 * in this sheet until all that fit are used up (components/tonight/prompt.logic.ts `anotherThought`, Tonight's own
 * selectPrompt input). The old line fades out over exitMs, the new one fades in where it stood, and the field slides
 * with the height change; Reduce Motion swaps at once with no slide. `tap` haptic; VoiceOver hears the new line once
 * and focus stays on the button. It fades out at the first character and comes back when the page is empty again,
 * holding its space so nothing moves near the cursor. The letter keeps the question showing when its words are first
 * saved.
 *
 * Typed letters skip Review (S20). A destination tap saves the words, then hands the letter to Review's one Keep step
 * (lib/capture/keep-intent.ts): the Keep gate decides there exactly as for a spoken letter (D-082, D-083), and the
 * saved moment plays and lands on the Book, or the Plus sheet opens and the letter waits on Tonight as a draft.
 *
 * The standing Plus line (F14-REQ-040, F04-REQ-045, BL-560): the Write half of Tonight's line, the same `PlusLine` under
 * the same rule (tonight-plus.logic plusLineShows, the Keep step's own decideKeepLetter), above the two destinations.
 * Never in an alpha build (PLUS_ALPHA; Karma ruling on #508). Letters kept is read once when Write opens and never
 * awaited: until it is read the line is absent, so the first frame and typing never wait on it.
 */
import { Stack, router, useFocusEffect, useLocalSearchParams, useNavigation } from 'expo-router';
import { ArrowsClockwiseIcon } from 'phosphor-react-native/src/icons/ArrowsClockwise';
import { CheckIcon } from 'phosphor-react-native/src/icons/Check';
import { WarningCircleIcon } from 'phosphor-react-native/src/icons/WarningCircle';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, BackHandler, KeyboardAvoidingView, Platform, ScrollView, View, useWindowDimensions, type TextInput } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { renderTemplate } from '@scribe/core';
import { PROMPTS } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { addButtonLabel, followCaretToEnd, pageEmptinessChanged, pageEndOffset, sheetKeyboardOffset, spokenSeparator, writeSwipeAllowed, writeWords } from '@/components/capture/review-view.logic';
import { Button } from '@/components/ui/button';
import { Lamp } from '@/components/ui/lamp';
import { SafeAreaView } from '@/components/ui/safe-area-view';
import { ModalHeader } from '@/components/ui/screen-header';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { announce, useIsAccessibilitySize, useTheme } from '@/lib/a11y';
import { createFirstFocus, createWriteSession, leavesForeground } from '@/components/capture/write-session.logic';
import { anotherThought, anotherThoughtShown } from '@/components/tonight/prompt.logic';
import { PlusLine } from '@/components/tonight/plus-line';
import { plusLineShows } from '@/components/tonight/tonight-plus.logic';
import { freeLettersAllowance, lettersKeptNow, PLUS_ALPHA, usePlan } from '@/lib/billing';
import { armKeep } from '@/lib/capture/keep-intent';
import { copy, pendingCopy } from '@/lib/copy';
import { ageText } from '@/lib/dates';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { footerPlacement } from '@/lib/review-layout.logic';
import { createDraft, deleteDraft, getActiveChild, getDraft, listEntriesForChild, setDraftTyped, todayISO } from '@/lib/store';

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
  // The page is uncontrolled (pageEmptinessChanged): the words live in the input and in the session below. `text` is the
  // words as of the last pause or the last time the page went from empty to words or back; Write renders then, never
  // on each keystroke, and nothing is ever sent back into the input.
  const [text, setText] = useState(initialText);
  const [saveState, setSaveState] = useState<SaveState>('none');
  const draftId = useRef<string | null>(existing?.id ?? null);
  const lastAnnounced = useRef(0);

  // Plus (F14-REQ-040): the plan from usePlan, and letters kept read once when Write opens (never awaited). Null until
  // read, so the line never shows on a guess. Not read again while typing: a Keep from Write leaves Write.
  const plan = usePlan();
  const [lettersKept, setLettersKept] = useState<number | null>(null);
  useEffect(() => {
    let live = true;
    void lettersKeptNow().then((n) => {
      if (live) setLettersKept(n);
    });
    return () => {
      live = false;
    };
  }, []);

  // The question on screen. It starts as the one Tonight or the draft carried; "Another thought" may swap it while the
  // page is empty, and the one showing when the words are first saved is the one the letter keeps.
  const [promptKey, setPromptKey] = useState<string | null>(params.promptKey ?? existing?.promptKey ?? null);
  const prompt = promptKey ? PROMPTS.find((p) => p.key === promptKey) : undefined;
  // Every prompt shown in this sheet, in order (the one on screen last), and how many presses so far.
  const shownKeys = useRef<string[]>(promptKey ? [promptKey] : []);
  const presses = useRef(0);
  // What the next draw needs to know about this child's letters, read from the store on the first press only, never
  // when Write opens or on a keystroke.
  const history = useRef<{ recentKeys: string[]; daysSinceLastEntry: number | null } | null>(null);

  /** "Saved on this phone" is announced at most every 10 s. */
  const announceSaved = () => {
    const now = Date.now();
    if (now - lastAnnounced.current > ANNOUNCE_EVERY_MS) {
      lastAnnounced.current = now;
      announce(pendingCopy.write.savedOnPhone);
    }
  };

  /**
   * Write the words to this phone. False when the write did not go through: the words stay on screen, and "Not saved yet" says so.
   * `quiet` is a write inside an unbroken burst of typing (the session writes at least every 500 ms, F04-REQ-011): the
   * words go to the phone and nothing else happens. No autosave line, no announcement and no render, so a long burst
   * shows no flicker, says nothing aloud and never disturbs the uncontrolled field (D-057). All of that waits for the pause.
   */
  const persist = (value: string, quiet = false): boolean => {
    if (!child) return false;
    const create = (v: string) => createDraft({ childId: child.id, captureMode: 'typed', promptKey, audioUri: null, audioDurationMs: null, typedText: v }).id;
    const r = writeWords({ create, update: setDraftTyped }, draftId.current, value);
    draftId.current = r.draftId;
    if (quiet) return r.ok;
    // "Not saved yet" after a write that did not go through; the next good write puts "Saved on this phone" back and
    // releases Close, Android's back and the swipe.
    if (r.saveState) setSaveState(r.saveState);
    if (r.saveState === 'failed') announce(copy.write.notSaved);
    // The words as of this write, for the swipe and the destinations (one render per pause, not per keystroke).
    setText(value);
    if (!r.ok) return false;
    announceSaved();
    return true;
  };

  /** Typing paused and a quiet write had already put the newest words on the phone: the pause's half of `persist`. */
  const settled = (value: string) => {
    setSaveState('saved');
    setText(value);
    announceSaved();
  };

  // The words between the keyboard and this phone (write-session.logic.ts): each keystroke lands there, the words are
  // written at least every 500 ms while typing and after a pause, and every way out (Close, a destination, a swipe down)
  // writes the newest words first, so the last keystrokes are never dropped. `persist` and `settled` are read through
  // refs: the session outlives the render that made it.
  const persistRef = useRef(persist);
  persistRef.current = persist;
  const settledRef = useRef(settled);
  settledRef.current = settled;
  const [session] = useState(() =>
    createWriteSession(
      {
        persist: (value, quiet) => persistRef.current(value, quiet),
        settled: (value) => settledRef.current(value),
        draftId: () => draftId.current,
        // An empty typed draft is nothing; a recording draft is always kept.
        hasRecording: (id) => !!getDraft(id)?.audioUri,
        deleteDraft,
      },
      { initial: initialText },
    ),
  );
  const onChange = (value: string) => {
    if (pageEmptinessChanged(session.latest(), value)) setText(value);
    session.change(value);
  };

  // Leaving any other way (a swipe down within the pause, a relaunch of the stack): a pending autosave is written now,
  // never dropped. After a write that did not go through, the swipe down is refused instead, as Close is (below).
  useEffect(() => () => session.unmount(), [session]);
  // The app leaving the foreground (the phone locked, another app opened): the newest words are written now. iOS pauses
  // the pause's timer in the background and may end the app there, so waiting for it could lose the last words (QE-06).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (leavesForeground(state)) session.background();
    });
    return () => sub.remove();
  }, [session]);

  // Words that cannot be written to this phone keep the sheet open, with "Not saved yet" on screen and said aloud:
  // closing would lose them (S19).
  const close = () => {
    if (session.close()) router.back();
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

  const motion = useMotion();
  const swapPrompt = () => {
    if (!child) return;
    // The question belongs to the words: a typed draft emptied back to nothing is nothing (as on Close), so it goes
    // and the next words start a letter that keeps the new question. The button is only offered on a new letter
    // (`!existing`), so this draft was made on this page, typed, with no recording.
    if (!existing && draftId.current && !session.latest().trim()) {
      try {
        deleteDraft(draftId.current);
        draftId.current = null;
      } catch {
        // Kept as it is: the draft keeps its first question.
      }
    }
    const today = todayISO();
    if (!history.current) {
      const entries = listEntriesForChild(child.id);
      history.current = {
        recentKeys: entries.map((e) => e.promptKey).filter((k): k is string => !!k),
        daysSinceLastEntry: entries[0] ? Math.floor((Date.parse(today) - Date.parse(entries[0].occurredOn)) / 864e5) : null,
      };
    }
    presses.current += 1;
    const next = anotherThought({ birthday: child.birthday, today, ...history.current, shown: shownKeys.current, press: presses.current }, PROMPTS);
    shownKeys.current = next.shown;
    haptic('tap');
    setPromptKey(next.prompt.key);
    // Said once; focus stays on the button so a second double-tap swaps again.
    announce(renderTemplate(next.prompt.text, { child: child.name }));
  };

  /** "Add to Asha's book" or "Keep private": one tap keeps the letter (S20). Nothing is kept unless the words are on this phone first. */
  const keep = (inBook: boolean) => {
    const id = session.keep();
    if (!id) return;
    armKeep(id, inBook);
    router.replace({ pathname: '/review', params: { draftId: id } });
  };

  // At accessibility text sizes the autosave line has its own row under the header, where it can wrap, instead of
  // running into Close (P4 critics' pass S5).
  const large = useIsAccessibilitySize();
  // The same rule as Review's and Tonight's footer: pinned under the page at the default size, at the end of the scroll
  // from accessibility sizes up.
  const inlineFooter = footerPlacement(large) === 'inline';

  // KeyboardAvoidingView measures itself inside the sheet but the keyboard from the top of the screen; the sheet's
  // own top closes the gap (sheetKeyboardOffset), so the page and both destinations sit above the keyboard.
  const screen = useWindowDimensions();
  const [sheetHeight, setSheetHeight] = useState(0);
  const keyboardOffset = sheetKeyboardOffset(screen.height, sheetHeight);

  // The keyboard comes up once the sheet has measured itself, so the offset is in place before the keyboard moves
  // (createFirstFocus; never autoFocus, which raced the measurement and could leave "Keep private" behind the keyboard).
  const field = useRef<TextInput>(null);
  const [firstFocus] = useState(() => createFirstFocus(() => field.current?.focus()));
  useEffect(() => () => firstFocus.dispose(), [firstFocus]);
  // After the commit that hands KeyboardAvoidingView the new offset, never in the same tick as the layout.
  useEffect(() => firstFocus.measured(sheetHeight), [firstFocus, sheetHeight]);

  // The page grows with the words and the sheet scrolls, so the line being written stays in view above the keyboard.
  const scroll = useRef<ScrollView>(null);
  const selectionEnd = useRef<number | null>(null);
  // Measured, never state: reading them must not render. The footer's top only matters while it rides in the scroll.
  const viewportHeight = useRef(0);
  const footerTop = useRef(0);
  // Pinned footer: the end of the content is the end of the page, so the field growing scrolls to the end.
  const onContentSizeChange = () => {
    if (!inlineFooter && followCaretToEnd({ selectionEnd: selectionEnd.current, length: session.latest().length })) scroll.current?.scrollToEnd({ animated: false });
  };
  // Footer inline: the end of the page is the top of the footer, so the buttons below do not push the last line typed
  // out of sight (scrolling to the very end would show them instead of the words). The footer's own layout is the signal:
  // it moves down when the field grows, and its top is read from that same layout, so there is no order of events to
  // guess between two callbacks. The viewport's layout (it shrinks when the keyboard opens) asks again.
  const followPageEnd = () => {
    if (!inlineFooter || !followCaretToEnd({ selectionEnd: selectionEnd.current, length: session.latest().length })) return;
    const y = pageEndOffset({ footerTop: footerTop.current, viewportHeight: viewportHeight.current });
    if (y !== null) scroll.current?.scrollTo({ y, animated: false });
  };

  // "Another thought" fades out at the first character and back in when the page is empty again, keeping its space.
  const offerAnother = anotherThoughtShown({ hasPrompt: !!prompt, continuingDraft: !!existing, empty: !text.trim() });
  const anotherOpacity = useSharedValue(offerAnother ? 1 : 0);
  useEffect(() => {
    anotherOpacity.value = motion.reduced ? (offerAnother ? 1 : 0) : withTiming(offerAnother ? 1 : 0, { duration: tokens.motion.fadeMs, reduceMotion: ReduceMotion.Never });
  }, [offerAnother, motion.reduced, anotherOpacity]);
  const anotherStyle = useAnimatedStyle(() => ({ opacity: anotherOpacity.value }));
  const promptOut = motion.reduced ? undefined : FadeOut.duration(tokens.motion.exitMs).reduceMotion(ReduceMotion.Never);
  const promptIn = motion.reduced ? undefined : FadeIn.duration(tokens.motion.fadeMs).delay(Math.round(tokens.motion.exitMs / 2)).reduceMotion(ReduceMotion.Never);
  const promptLayout = motion.reduced ? undefined : LinearTransition.duration(tokens.motion.enter.durationMs);

  if (!child) return null;
  const age = ageText(child, todayISO());
  const dateline = age ? `${child.name} · ${age}` : child.name;
  const empty = !text.trim();
  const showPlusLine = plusLineShows({ plan: plan.view, now: new Date().toISOString(), lettersKept, allowance: freeLettersAllowance(), alpha: PLUS_ALPHA });
  // The standing Plus line, then "Add to Asha's book" full width and "Keep private" quiet beneath, so the main action
  // never breaks over two lines (P4 critics' pass S2). Defined once and drawn in exactly one place, by `inlineFooter`.
  const footer = (
    <View
      className={inlineFooter ? 'gap-1 pt-2' : 'gap-1 border-t border-border bg-background px-5 pb-2 pt-3'}
      onLayout={(e) => {
        footerTop.current = e.nativeEvent.layout.y;
        followPageEnd();
      }}>
      {/* Before the person keeps, not only at the Keep step: new letters need Plus. Never a count or a price. */}
      {showPlusLine ? (
        <View className="pb-1">
          <PlusLine />
        </View>
      ) : null}
      <Button size="lg" fullWidth label={addButtonLabel(child.name)} onPress={() => keep(true)} disabled={empty} testID="write.keep.book" />
      <Button variant="quiet" fullWidth label={copy.review.destination.privateButton} onPress={() => keep(false)} disabled={empty} testID="write.keep.private" />
    </View>
  );
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
        <ScrollView
          ref={scroll}
          contentContainerClassName="flex-grow gap-3 px-6 pb-6 pt-4"
          keyboardShouldPersistTaps="handled"
          onLayout={(e) => {
            viewportHeight.current = e.nativeEvent.layout.height;
            followPageEnd();
          }}>
          <Text variant="letterDateline" caps accessibilityLabel={spokenSeparator(dateline)}>
            {dateline}
          </Text>
          {prompt && (
            // The prompt is the one literary line above the page (S19), carried over from Tonight or Listen (5.8 row 3).
            <Animated.View key={prompt.key} entering={presses.current === 0 ? undefined : promptIn} exiting={promptOut} layout={promptLayout}>
              <Text variant="prompt" tone="muted" testID="write.prompt">
                {renderTemplate(prompt.text, { child: child.name })}
              </Text>
            </Animated.View>
          )}
          {prompt && !existing ? (
            // Hidden, not moved: the button keeps its place while words are on the page, so nothing shifts near the cursor.
            <Animated.View layout={promptLayout} style={anotherStyle} pointerEvents={offerAnother ? 'auto' : 'none'} accessibilityElementsHidden={!offerAnother} importantForAccessibility={offerAnother ? 'auto' : 'no-hide-descendants'}>
              <Button variant="quiet" size="sm" icon={ArrowsClockwiseIcon} label={copy.tonight.newPromptButton} className="-ml-4 self-start" onPress={swapPrompt} testID="write.anotherThought" />
            </Animated.View>
          ) : null}
          <TextField
            ref={field}
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
          />
          {/* Accessibility text sizes: the buttons scroll with the page, so they can never be taller than the room
              above the keyboard and push "Add to the book" off the screen. */}
          {inlineFooter ? footer : null}
        </ScrollView>
        {/* The default size: pinned under the page, in the thumb zone, always on screen. */}
        {inlineFooter ? null : footer}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
