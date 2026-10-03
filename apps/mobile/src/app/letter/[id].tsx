/**
 * Letter reading view (DESIGN_LANGUAGE 12): a page, not a card.
 * Benchmarks (docs/design/BENCHMARK.md, "Screens"):
 * - Apple Books: reader-owned "Aa" Reading Size in a small sheet, the page changing live
 *   behind it; text never animates its size, it cross-fades (MOTION 5i).
 * - Day One: the recording and its words in one entry; the voice comes first after the text.
 * - Apple Settings inset list for the few actions (Make private, Delete).
 * - Apple Mail / Airbnb: Delete is immediate with a persistent Undo, no confirm dialog.
 * Haptics: `tap` for private / book, `warning` for Delete. Nothing on open or scroll.
 */
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { BookOpenIcon, LockSimpleIcon, MicrophoneIcon, PencilSimpleLineIcon, TrashIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn, ReduceMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { AudioPlayer } from '@/components/player/audio-player';
import { Button, LARGE_CONTENT } from '@/components/ui/button';
import { ListRow, ListSection } from '@/components/ui/list-row';
import { UIProvider } from '@/components/ui/provider';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/lib/a11y';
import { copy, fill, pendingCopy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { deleteEntry, getActiveChild, getChild, getEntry, setEntryInBook, undeleteEntry, type Entry } from '@/lib/store';
import { provenanceOf } from '@/components/book/chapters';
import { PrivateChip } from '@/components/book/letter-card';
import { letterDateline } from '@/lib/dates';
import { ReadingSizeSheet } from '@/components/book/reading-size-sheet';
import { UndoToast } from '@/components/book/undo-toast';
import { authorOf, getReadingSize, isOwnEntry, setReadingSize, type ReadingSize } from '@/components/child/child-store';

/** UIProvider is a no-op once the root layout mounts it (Sheet and Toast need it). */
export default function LetterScreen() {
  return (
    <UIProvider>
      <Letter />
    </UIProvider>
  );
}

function Letter() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const { enter } = useMotion();
  const toast = useToast();
  const [entry, setEntry] = useState<Entry | null | undefined>(() => getEntry(id));
  const [size, setSize] = useState<ReadingSize>(getReadingSize);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [deleted, setDeleted] = useState<Entry | null>(null);

  const headerRight = () => (
    <Pressable
      onPress={() => setSizeOpen(true)}
      role="button"
      accessibilityLabel={copy.reader.readingSizeA11y}
      {...LARGE_CONTENT(copy.reader.readingSizeA11y)}
      hitSlop={6}
      className="mr-1 h-11 min-w-11 items-center justify-center rounded-full px-2 active:bg-secondary">
      <Text variant="title2" tone="accent" maxFontSizeMultiplier={1.3}>
        {copy.reader.readingSizeButton}
      </Text>
    </Pressable>
  );

  const child = entry ? ((entry.childId ? getChild(entry.childId) : null) ?? getActiveChild()) : null;

  if (deleted) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ headerRight: undefined }} />
        <Animated.View entering={enter(0)} className="flex-1 justify-center gap-2 px-6">
          <Text variant="title1" asHeading>
            {copy.settings.delete.entryToast}
          </Text>
          <Text variant="body" tone="muted">
            {pendingCopy.reader.deletedUndoBody}
          </Text>
        </Animated.View>
        <UndoToast
          message={copy.settings.delete.entryToast}
          onDismiss={() => router.back()}
          onUndo={() => {
            undeleteEntry(deleted.id);
            setEntry(getEntry(deleted.id));
            setDeleted(null);
          }}
        />
      </View>
    );
  }

  if (!entry || !child) {
    return (
      <View className="flex-1 items-start justify-center gap-5 bg-background px-6">
        <Text variant="title1" asHeading>
          {copy.reader.notFoundTitle}
        </Text>
        <Button size="lg" label={copy.reader.notFoundCta} onPress={() => router.back()} />
      </View>
    );
  }

  const scale = tokens.readingScale[size];
  const signsAs = authorOf(entry, child);
  const signature = fill(copy.book.signature, { signsAs });
  const date = letterDateline(child, entry.occurredOn);
  const provenance = copy.book.provenance[provenanceOf(entry)];
  const spoken = entry.captureMode !== 'typed';
  const own = isOwnEntry(entry);
  const canShowOriginal = own && spoken && entry.rawTranscript !== entry.finalText;
  const waiting = entry.transcriptStatus === 'waiting';
  const text = showOriginal ? entry.rawTranscript : entry.finalText;
  const crossFade = FadeIn.duration(150).reduceMotion(ReduceMotion.Never);

  const toggleInBook = () => {
    const next = !entry.inBook;
    setEntryInBook(entry.id, next);
    haptic('tap');
    setEntry({ ...entry, inBook: next });
    toast.show({ message: next ? fill(copy.review.destination.addedToast, { child: child.name }) : copy.review.destination.privateToast });
  };

  const remove = () => {
    deleteEntry(entry.id); // tombstone; restorable
    haptic('warning');
    // Undo stays until the parent taps Undo, Close or Back: no timed navigation (TDD 09 A11Y-F03).
    setDeleted(entry);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerRight }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 48 }} contentContainerClassName="gap-7 px-6">
        <Animated.View entering={enter(0)} className="gap-3">
          <Text variant="letterDateline">{date}</Text>
          {!entry.inBook && (
            <View className="flex-row">
              <PrivateChip color={c.text} />
            </View>
          )}
        </Animated.View>

        <Animated.View entering={enter(1)} className="gap-6">
          {showOriginal && (
            <Text variant="caption" caps tone="muted" style={{ letterSpacing: 1 }}>
              {copy.review.originalLabel}
            </Text>
          )}
          <Animated.View key={`${size}:${showOriginal}`} entering={crossFade}>
            {waiting ? (
              <Text variant="signature" scale={scale} tone="muted">
                {pendingCopy.book.waitingForWords}
              </Text>
            ) : (
              <Text variant="letterBody" scale={scale} selectable>
                {text}
              </Text>
            )}
          </Animated.View>
          <Text variant="signature" scale={scale} className="self-end">
            {signature}
          </Text>
        </Animated.View>

        {spoken && <AudioPlayer entryId={entry.id} context="letter" />}

        <View className="gap-2 border-t border-border pt-5">
          <View className="flex-row items-center gap-2">
            {spoken ? <MicrophoneIcon size={16} color={c.textMuted} /> : <PencilSimpleLineIcon size={16} color={c.textMuted} />}
            <Text variant="footnote">{provenance}</Text>
          </View>
          {spoken && (
            <View className="flex-row items-center gap-2">
              <LockSimpleIcon size={16} color={c.textMuted} />
              <Text variant="footnote">{copy.book.recordingOnPhone}</Text>
            </View>
          )}
          {canShowOriginal && (
            <Button
              variant="quiet"
              size="sm"
              className="-ml-4 self-start"
              label={showOriginal ? copy.review.showTidiedButton : copy.review.showOriginalLink}
              onPress={() => setShowOriginal((v) => !v)}
            />
          )}
        </View>

        {own && (
          <ListSection>
            <ListRow
              title={entry.inBook ? copy.book.entryMenu.makePrivate : copy.book.entryMenu.moveToBook}
              leading={entry.inBook ? <LockSimpleIcon size={20} color={c.text} /> : <BookOpenIcon size={20} color={c.text} />}
              onPress={toggleInBook}
            />
            <ListRow title={copy.book.entryMenu.deleteButton} variant="destructive" leading={<TrashIcon size={20} color={c.destructive} />} onPress={remove} accessibilityHint={copy.settings.delete.entryConfirm} />
          </ListSection>
        )}
      </ScrollView>

      <ReadingSizeSheet
        visible={sizeOpen}
        value={size}
        onChange={(v) => {
          setSize(v);
          setReadingSize(v);
        }}
        onClose={() => setSizeOpen(false)}
      />
    </View>
  );
}
