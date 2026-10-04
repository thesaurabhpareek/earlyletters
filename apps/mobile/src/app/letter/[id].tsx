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
import { BookOpenIcon } from 'phosphor-react-native/src/icons/BookOpen';
import { LockSimpleIcon } from 'phosphor-react-native/src/icons/LockSimple';
import { MicrophoneIcon } from 'phosphor-react-native/src/icons/Microphone';
import { PencilSimpleLineIcon } from 'phosphor-react-native/src/icons/PencilSimpleLine';
import { TrashIcon } from 'phosphor-react-native/src/icons/Trash';
import { useEffect, useState } from 'react';
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
import {
  deleteEntry,
  getActiveChild,
  getChild,
  getEntry,
  setEntryInBook,
  setTypedWordsForWaitingEntry,
  subscribeTo,
  undeleteEntry,
  type Entry,
} from '@/lib/store';
import { clearReadItBack, isReadItBack } from '@/lib/read-it-back';
import { languageFor, requestSpeechFor, retryWords } from '@/lib/transcription-queue';
import { wordsCopy } from '@/lib/transcription-queue/copy';
import { useSpeechDownload, useWordsJob } from '@/lib/transcription-queue/use-words';
import { planFor } from '@/lib/models/speech-packs';
import { TextField } from '@/components/ui/text-field';
import { provenanceOf } from '@/components/book/chapters';
import { bookCopy } from '@/components/book/copy';
import { letterWords } from '@/components/book/letter-words.logic';
import { track } from '@/lib/analytics/track';
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
  // Words that arrived after the letter was saved and have not been read back yet (D-086).
  const [unread, setUnread] = useState(() => isReadItBack(id));

  // The page follows the store: words that arrive while it is open appear without leaving and reopening (J10-01).
  useEffect(
    () =>
      subscribeTo('entries', () => {
        setEntry((prev) => (prev === null ? prev : (getEntry(id) ?? prev)));
        setUnread(isReadItBack(id));
      }),
    [id],
  );

  // letter_opened once per open (who wrote it, relative to you, and whether it has a recording; never which letter).
  useEffect(() => {
    const e = getEntry(id);
    if (e) track('letter_opened', { author_relation: isOwnEntry(e) ? 'self' : 'other_parent', has_audio: !!e.audioUri });
  }, [id]);

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
            track('letter_deleted', { action: 'restored', destination: deleted.inBook ? 'book' : 'private' });
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
  const typedWords = provenanceOf(entry) === 'typed'; // typed, or typed for a recording that had no words
  const own = isOwnEntry(entry);
  const canShowOriginal = own && spoken && entry.rawTranscript !== entry.finalText;
  const words = letterWords(entry);
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
    track('letter_deleted', { action: 'deleted', destination: entry.inBook ? 'book' : 'private' });
    // Undo stays until the parent taps Undo, Close or Back: no timed navigation (TDD 09 A11Y-F03).
    setDeleted(entry);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerRight }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 60, paddingBottom: insets.bottom + 48 }} contentContainerClassName="gap-7 px-6">
        <Animated.View entering={enter(0)} className="gap-3">
          <Text variant="footnote">{date}</Text>
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
            {words !== 'words' && !showOriginal ? (
              // Waiting for words, or nobody spoke: a calm italic note, never an empty page.
              <Text variant="signature" scale={scale} tone="muted">
                {words === 'waiting' ? pendingCopy.book.waitingForWords : bookCopy.nobodySpoke}
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

        {spoken && <AudioPlayer entryId={entry.id} />}

        {own && words === 'waiting' && <WaitingCard entry={entry} />}
        {own && words === 'nobodySpoke' && spoken && (
          // Nobody spoke on a saved letter: the recording stays as it is; the one action is to record again.
          <View className="gap-3">
            <Button size="md" label={wordsCopy.waiting.recordAgainButton} onPress={() => router.push('/listen')} testID="letter.recordAgain" />
          </View>
        )}
        {own && words === 'words' && unread && (
          <ReadItBackCard
            onRead={() => {
              haptic('tap');
              clearReadItBack(entry.id);
              setUnread(false);
            }}
          />
        )}

        {words === 'words' && (
        <View className="gap-2 border-t border-border pt-5">
          <View className="flex-row items-center gap-2">
            {typedWords ? <PencilSimpleLineIcon size={16} color={c.textMuted} /> : <MicrophoneIcon size={16} color={c.textMuted} />}
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
              label={showOriginal ? copy.review.view.fixes : copy.review.view.exact}
              onPress={() => setShowOriginal((v) => !v)}
              testID="letter.view"
            />
          )}
        </View>
        )}

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
          track('settings_changed', { key: 'reading_size' });
        }}
        onClose={() => setSizeOpen(false)}
      />
    </View>
  );
}

/**
 * A saved letter still waiting for its words (D-086): the reason, then one primary action. The reason lines reuse
 * the words copy ("Getting ready, 40%", Wi-Fi, space); the actions are Write the words, and Try again or Get
 * words ready when that is what would help. The recording itself is never touched.
 */
function WaitingCard({ entry }: { entry: Entry }) {
  const language = languageFor(entry.id);
  const job = useWordsJob(entry.id);
  const download = useSpeechDownload(job?.phase === 'waiting_for_pack' ? language : null);
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState('');
  const w = wordsCopy.waiting;

  const failed = job?.phase === 'failed';
  const retryable = failed && job.failure !== 'file_missing' && job.failure !== 'unsupported';
  const packWait = job?.phase === 'waiting_for_pack';
  const p = download.progress;
  const reason = failed
    ? copy.errors.transcriptionFailed.body
    : packWait
      ? download.hold === 'waiting_for_wifi'
        ? wordsCopy.pack.waitingForWifi
        : download.hold === 'no_space'
          ? wordsCopy.pack.noSpace
          : p !== null
            ? fill(wordsCopy.pack.progress, { n: Math.floor(p * 100) })
            : fill(wordsCopy.pack.sizeLine, { size: Math.round(planFor([language]).bytes / 1e6) })
      : null;

  if (writing) {
    return (
      <View className="gap-3" testID="letter.writeWords">
        <TextField
          variant="letter"
          label={w.writeLabel}
          labelHidden
          value={text}
          onChangeText={setText}
          multiline
          autoFocus
          accessibilityHint={w.writeTitle}
        />
        <Button
          size="md"
          label={w.saveButton}
          disabled={!text.trim()}
          onPress={() => {
            haptic('tap');
            if (setTypedWordsForWaitingEntry(entry.id, text)) setWriting(false);
          }}
          testID="letter.writeWords.save"
        />
        <Button variant="quiet" size="sm" label={w.cancelButton} onPress={() => setWriting(false)} />
      </View>
    );
  }

  const primary = retryable ? (
    <Button size="md" label={w.retryButton} onPress={() => retryWords(entry.id)} testID="letter.retry" />
  ) : packWait && p === null ? (
    <Button size="md" label={w.readyButton} onPress={() => void requestSpeechFor(language)} testID="letter.getReady" />
  ) : null;

  return (
    <View className="gap-3" accessibilityLiveRegion="polite" testID="letter.waiting">
      {reason && <Text variant="footnote">{reason}</Text>}
      {primary}
      <Button
        size="md"
        variant={primary ? 'secondary' : 'primary'}
        label={w.writeButton}
        onPress={() => setWriting(true)}
        testID="letter.write"
      />
    </View>
  );
}

/**
 * "Words are ready. Read it back." The words arrived after the letter was saved, so they are exactly as said and
 * nothing was fixed unread (D-086). Reading them back is the parent's step; the card then goes away.
 */
function ReadItBackCard({ onRead }: { onRead: () => void }) {
  const w = wordsCopy.waiting;
  return (
    <View className="gap-3" accessibilityLiveRegion="polite" testID="letter.readItBack">
      <Text variant="headline">{w.readyBody}</Text>
      <Text variant="footnote">{w.arrivedNote}</Text>
      <Button size="md" label={w.readItBackButton} onPress={onRead} testID="letter.readItBack.done" />
    </View>
  );
}
