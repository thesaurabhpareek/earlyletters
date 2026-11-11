/**
 * Find, the Book's search mode (docs/design/specs/02-FIND-11nov.md; NS-02). Not a screen and not a tab: it is drawn over
 * the Book, which stays mounted underneath, so Cancel returns to the Book exactly where it was (scroll position kept)
 * and a result tapped and left with Back returns to the same query and the same place in the results (NS-02-R12).
 *
 * - One field, autofocused. Autocorrect and spell check are off: a word is never "corrected" into another (R14). The
 *   query lives only in this component's state: it is never written to storage, a log, analytics or a URL, there are
 *   no recent searches, and it is cleared when the parent leaves the Book for another tab (R14, R15).
 * - Before three characters (a word with no spaces in CJK needs one) the screen shows nothing at all (no line, no message)
 *   (R3). Results are the letters' own words, newest first, with no count and no score (R10, R11). No match shows the
 *   existing "No letters with that word yet." and one quiet line, and no button that starts a letter (R13).
 * - Works with no network and no account: it reads this phone and imports no network code (R22).
 * - Find never records audio. Dictation into the field is the system keyboard's.
 *
 * Motion: the overlay cross-fades in over `swapMs`; typing never animates the list (design 02 section 7).
 */
import { useNavigation } from 'expo-router';
import { MagnifyingGlassIcon } from 'phosphor-react-native/src/icons/MagnifyingGlass';
import { XCircleIcon } from 'phosphor-react-native/src/icons/XCircle';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, InteractionManager, Keyboard, View, type TextInput } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { findCopy } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { entryDateline, entryDatelineA11y } from '@/components/book/date-change.logic';
import { Button, IconButton } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { announce, useTheme } from '@/lib/a11y';
import { copy, fill } from '@/lib/copy';
import type { FindHit } from '@/lib/find/search';
import { ensureFindIndex, findIndexReady, findLetters, type Child, type Entry } from '@/lib/store';
import { FindResultRow } from './find-result-row';
import { announcementFor, findView } from './find.logic';

/** Set just before a result opens its letter, so leaving the Book for the letter page does not clear the query (R12). */
let openingLetter = false;

export interface FindModeProps {
  child: Child;
  /** The active book's letters, for each result's date line. */
  entries: readonly Entry[];
  onClose: () => void;
  onOpen: (id: string) => void;
}

export function FindMode({ child, entries, onClose, onOpen }: FindModeProps) {
  const insets = useSafeAreaInsets();
  const { c } = useTheme();
  const nav = useNavigation();
  const input = useRef<TextInput>(null);
  const [query, setQuery] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(() => findIndexReady());

  // The parent leaves the Book for another tab: the query is gone (R14). Opening a letter from a result is not leaving.
  useEffect(
    () =>
      nav.addListener('blur', () => {
        if (openingLetter) {
          openingLetter = false;
          return;
        }
        setQuery('');
        onClose();
      }),
    [nav, onClose],
  );

  // The index is made, or checked, off the first frame (ADR 0028 D4). The scan answers meanwhile.
  useEffect(() => {
    if (ready) return;
    const task = InteractionManager.runAfterInteractions(() => {
      try {
        ensureFindIndex();
      } catch {
        // The scan still answers.
      }
      setReady(findIndexReady());
    });
    return () => task.cancel();
  }, [ready]);

  const outcome = useMemo(() => {
    try {
      return { result: findLetters(query, child.id), failed: false };
    } catch {
      return { result: null, failed: true };
    }
    // `attempt` re-runs a failed search when the parent taps Try again.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, child.id, attempt]);

  const view = findView(outcome);
  const byId = useMemo(() => new Map(entries.map((e) => [e.id, e])), [entries]);
  const rows = useMemo(
    () => (outcome.result?.status === 'done' ? outcome.result.hits.filter((h) => byId.has(h.id)) : []),
    [outcome.result, byId],
  );

  useEffect(() => {
    const message = announcementFor(view, copy.book.empty.searchTitle);
    if (message) announce(message);
  }, [view]);

  const open = useCallback(
    (id: string) => {
      openingLetter = true;
      onOpen(id);
    },
    [onOpen],
  );
  const cancel = useCallback(() => {
    Keyboard.dismiss();
    setQuery('');
    onClose();
  }, [onClose]);

  return (
    <Animated.View
      entering={FadeIn.duration(tokens.motion.swapMs).reduceMotion(ReduceMotion.System)}
      className="bg-background"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, paddingTop: insets.top + tokens.space[1] }}
      testID="find.mode">
      <View className="flex-row flex-wrap items-center gap-2 px-5 pb-3">
        <View className="flex-1" style={{ minWidth: tokens.target.min * 5 }}>
          <TextField
            ref={input}
            label={findCopy.fieldLabel}
            labelHidden
            value={query}
            onChangeText={setQuery}
            placeholder={fill(findCopy.placeholder, { child: child.name })}
            autoFocus
            autoCorrect={false}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            textContentType="none"
            returnKeyType="search"
            onSubmitEditing={() => Keyboard.dismiss()}
            trailing={
              query.length > 0 ? (
                <IconButton icon={XCircleIcon} label={findCopy.clear} size="sm" onPress={() => setQuery('')} testID="find.clear" />
              ) : (
                <MagnifyingGlassIcon size={20} color={c.textMuted} />
              )
            }
            testID="find.field"
          />
        </View>
        <Button variant="quiet" size="sm" label={findCopy.cancel} onPress={cancel} testID="find.cancel" />
      </View>

      {!ready && view === 'failed' ? (
        <View className="px-5 pb-2" accessibilityLiveRegion="polite">
          <Text variant="footnote">{findCopy.notReady}</Text>
        </View>
      ) : null}

      {view === 'idle' ? null : view === 'failed' ? (
        <View className="items-start gap-3 px-5 pt-2">
          <Text variant="callout">{findCopy.error}</Text>
          <Button variant="secondary" size="md" label={findCopy.retry} onPress={() => setAttempt((n) => n + 1)} testID="find.retry" />
        </View>
      ) : view === 'none' ? (
        // One calm line and a quiet second one. No tip, no "add a letter" button: the Book starts nothing (R13).
        <View className="gap-1 px-5 pt-2" accessibilityRole="text">
          <Text variant="headline">{copy.book.empty.searchTitle}</Text>
          <Text variant="callout">{findCopy.noMatchHelp}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(h: FindHit) => h.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={{ paddingBottom: insets.bottom + tokens.space[9] }}
          renderItem={({ item }: { item: FindHit }) => {
            const entry = byId.get(item.id) as Entry;
            return <FindResultRow hit={item} dateline={entryDateline(child, entry)} datelineA11y={entryDatelineA11y(child, entry)} onPress={open} />;
          }}
          testID="find.results"
        />
      )}
    </Animated.View>
  );
}
