/**
 * Find mode (docs/design/specs/02-FIND-11nov.md sections 3, 5, 6, 8; area B DESIGN B-S06). The field and the results,
 * for the Book to host in place of its header cluster. Not mounted anywhere yet: how the Book header swaps is design
 * silent (see FIND8-1 in the PR). Draws nothing unless `findAvailableNow` (build switch on, no pause, a letter, this
 * book shown to the signed-in account). Reads this phone only; the query lives in this component's state and is gone
 * when it unmounts (R14); nothing here logs, counts or sends a term.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { findCopy } from '@scribe/content';
import { tokens } from '@scribe/design-tokens';
import { ErrorLine } from '@/components/ui/error-line';
import { TextField } from '@/components/ui/text-field';
import { Text } from '@/components/ui/text';
import { entryDateline, entryDatelineA11y } from '@/components/book/date-change.logic';
import { announce, useTheme } from '@/lib/a11y';
import { fill } from '@/lib/copy';
import { createQueryDebounce } from '@/lib/find/debounce';
import type { FindResult } from '@/lib/find/search';
import { findAvailableNow, findLetters, getEntry, listEntriesForChild, type Child } from '@/lib/store';
import { copy } from '@/lib/copy';
import { excerptRuns, findView, rowLabel } from './find-view.logic';

/** `paused` is the remote pause, read by the Book (findPausedNow); Find imports no remote module (R22). */
export function FindMode({ child, paused, onCancel, onOpen }: { child: Child; paused: boolean; onCancel: () => void; onOpen: (id: string) => void }) {
  const { c } = useTheme();
  const [raw, setRaw] = useState('');
  const [result, setResult] = useState<FindResult | null>(null);
  const [failed, setFailed] = useState(false);
  const hasLetters = listEntriesForChild(child.id).length > 0;
  const on = findAvailableNow({ paused, hasLetters });

  const run = useRef<(q: string) => void>(() => {});
  run.current = (q) => {
    try {
      setFailed(false);
      setResult(findLetters(q, child.id));
    } catch {
      setFailed(true);
    }
  };
  const debounce = useMemo(() => createQueryDebounce((q) => run.current(q)), []);
  useEffect(() => () => debounce.dispose(), [debounce]);

  const view = findView(result, failed);
  const hits = result?.status === 'done' ? result.hits : [];
  useEffect(() => {
    if (view === 'results') announce(findCopy.foundA11y); // once, politely, no number (spec section 8)
  }, [view]);

  if (!on) return null;
  return (
    <View className="flex-1">
      <View className="flex-row items-center gap-3 px-5 pb-2">
        <View className="flex-1">
          <TextField
            label={findCopy.fieldLabel}
            labelHidden
            accessibilityHint={findCopy.fieldHint}
            placeholder={fill(findCopy.placeholder, { child: child.name || 'your child' })}
            value={raw}
            onChangeText={(t) => {
              setRaw(t);
              debounce.push(t);
            }}
            autoFocus
            autoCorrect={false}
            spellCheck={false}
            returnKeyType="search"
            onSubmitEditing={() => debounce.flush()}
          />
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={findCopy.cancel} onPress={onCancel} style={{ minHeight: tokens.target.min, justifyContent: 'center' }}>
          <Text variant="body">{findCopy.cancel}</Text>
        </Pressable>
      </View>
      {view === 'failed' ? (
        <View className="gap-3 px-5">
          <ErrorLine message={findCopy.error} />
          <Pressable accessibilityRole="button" onPress={() => run.current(raw)} style={{ minHeight: tokens.target.min, justifyContent: 'center' }}>
            <Text variant="body">{findCopy.retry}</Text>
          </Pressable>
        </View>
      ) : null}
      {view === 'noMatch' ? (
        <Text variant="body" className="px-5 pt-4" accessibilityLiveRegion="polite">
          {copy.book.empty.searchTitle}
        </Text>
      ) : null}
      {view === 'results' ? (
        <FlatList
          data={hits}
          keyExtractor={(h) => h.id}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const entry = getEntry(item.id);
            if (!entry) return null; // gone since the last keystroke: it disappears at the next one, no error
            const runs = excerptRuns(item.excerpt);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={rowLabel(findCopy.rowA11y, entryDatelineA11y(child, entry), item.excerpt.text)}
                onPress={() => onOpen(item.id)}
                className="mx-5 mb-3 rounded-2xl bg-card px-4 py-3"
                style={{ minHeight: tokens.target.min }}
              >
                <Text variant="caption">{entryDateline(child, entry)}</Text>
                <Text variant="body">
                  {runs.map((r, i) => (
                    <Text key={i} variant="body" style={r.match ? { textDecorationLine: 'underline', color: c.accent, fontWeight: '500' } : undefined}>
                      {r.text}
                    </Text>
                  ))}
                </Text>
              </Pressable>
            );
          }}
        />
      ) : null}
    </View>
  );
}
