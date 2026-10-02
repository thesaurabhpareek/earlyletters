import { router, Stack, useLocalSearchParams } from 'expo-router';
import { BookOpenIcon, LockSimpleIcon, PlayIcon, TrashIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Pressable, ScrollView, View, useColorScheme } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { copy, fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';
import { deleteEntry, getActiveChild, getChild, getEntry, setEntryInBook, undeleteEntry, type Entry } from '@/lib/store';
import { provenanceOf } from '@/components/book/chapters';
import { PrivateChip } from '@/components/book/letter-card';
import { letterDateline } from '@/lib/dates';
import { ReadingSizeSheet } from '@/components/book/reading-size-sheet';
import { UndoToast } from '@/components/book/undo-toast';
import { authorOf, getReadingSize, isOwnEntry, setReadingSize, type ReadingSize } from '@/components/child/child-store';

const UNDO_MS = 10_000;
const BODY = { size: 20, leading: 32 }; // tokens.type.letterBody

/** Letter reading view (DESIGN_LANGUAGE 12): a page, not a card. */
export default function Letter() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = tokens[useColorScheme() === 'dark' ? 'dark' : 'light'];
  const insets = useSafeAreaInsets();
  const { enter } = useMotion();
  const [entry, setEntry] = useState<Entry | null | undefined>(() => getEntry(id));
  const [size, setSize] = useState<ReadingSize>(getReadingSize);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<Entry | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const headerRight = () => (
    <Pressable
      onPress={() => setSizeOpen(true)}
      accessibilityRole="button"
      accessibilityLabel={copy.reader.readingSizeA11y}
      className="mr-2 h-11 min-w-11 items-center justify-center px-3">
      <Text maxFontSizeMultiplier={1.3} className="font-serif text-xl text-primary">
        {copy.reader.readingSizeButton}
      </Text>
    </Pressable>
  );

  const child = entry ? ((entry.childId ? getChild(entry.childId) : null) ?? getActiveChild()) : null;

  if (deleted) {
    return (
      <View className="flex-1 bg-background">
        <Stack.Screen options={{ headerRight: undefined }} />
        <Animated.View entering={enter(0)} className="flex-1 justify-center gap-2 px-5">
          <Text role="heading" className="font-serif text-2xl text-foreground">
            {copy.settings.delete.entryToast}
          </Text>
          <Text className="text-base text-muted-foreground">{copy.reader.deletedBody}</Text>
        </Animated.View>
        <UndoToast
          message={copy.settings.delete.entryToast}
          onUndo={() => {
            if (timer.current) clearTimeout(timer.current);
            undeleteEntry(deleted.id);
            haptic('tap');
            setEntry(getEntry(deleted.id));
            setDeleted(null);
          }}
        />
      </View>
    );
  }

  if (!entry || !child) {
    return (
      <View className="flex-1 items-start justify-center gap-4 bg-background px-5">
        <Text role="heading" className="font-serif text-2xl text-foreground">
          {copy.reader.notFoundTitle}
        </Text>
        <Button onPress={() => router.back()}>
          <Text>{copy.reader.notFoundCta}</Text>
        </Button>
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
  const text = showOriginal ? entry.rawTranscript : entry.finalText;

  const toggleInBook = () => {
    const next = !entry.inBook;
    setEntryInBook(entry.id, next);
    haptic('tap');
    setEntry({ ...entry, inBook: next });
    setStatus(next ? fill(copy.review.destination.addedToast, { child: child.name }) : copy.review.destination.privateToast);
  };

  const remove = async () => {
    deleteEntry(entry.id); // tombstone; restorable
    haptic('warning');
    setDeleted(entry);
    const sr = await AccessibilityInfo.isScreenReaderEnabled();
    // With VoiceOver on, the undo stays until the reader leaves (COMPONENTS 2.14).
    if (!sr) timer.current = setTimeout(() => router.back(), UNDO_MS);
  };

  return (
    <View className="flex-1 bg-background">
      <Stack.Screen options={{ headerRight }} />
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 56, paddingBottom: insets.bottom + 40 }} contentContainerClassName="gap-6 px-5">
        <Animated.View entering={enter(0)} className="gap-2">
          <Text maxFontSizeMultiplier={2.4} className="text-sm font-medium tracking-[0.6px] text-muted-foreground">
            {date}
          </Text>
          {/* The signature lives once, at the end of the letter (no "From Mama" here). */}
          {!entry.inBook && (
            <View className="flex-row">
              <PrivateChip color={c.text} />
            </View>
          )}
        </Animated.View>

        {showOriginal && (
          <Text className="text-xs font-medium tracking-[1.2px] text-muted-foreground">{copy.review.originalLabel.toUpperCase()}</Text>
        )}
        <Text
          selectable
          maxFontSizeMultiplier={2}
          className="font-serif text-foreground"
          style={{ fontSize: BODY.size * scale, lineHeight: BODY.leading * scale }}>
          {text}
        </Text>

        <Text
          maxFontSizeMultiplier={2}
          className="self-end font-serif italic text-foreground"
          style={{ fontSize: BODY.size * scale, lineHeight: BODY.leading * scale }}>
          {signature}
        </Text>

        <View className="gap-1 border-t border-border pt-4">
          <Text className="text-sm text-muted-foreground">{provenance}</Text>
          {spoken && <Text className="text-sm text-muted-foreground">{copy.book.recordingOnPhone}</Text>}
        </View>

        {spoken && (
          // Playback is not wired yet; shown disabled so the page layout is final.
          <Button variant="secondary" disabled className="self-start" accessibilityLabel={fill(copy.book.hearLink, { signsAs })}>
            <PlayIcon size={18} color={c.accent} weight="fill" />
            <Text>{fill(copy.book.hearShort, { signsAs })}</Text>
          </Button>
        )}

        {canShowOriginal && (
          <Pressable onPress={() => setShowOriginal((v) => !v)} accessibilityRole="button" className="min-h-11 justify-center self-start">
            <Text className="text-base font-medium text-primary">
              {showOriginal ? copy.review.showTidiedButton : copy.review.showOriginalLink}
            </Text>
          </Pressable>
        )}

        {own && (
          <View className="gap-3 pt-2">
            <Button variant="outline" onPress={toggleInBook}>
              {entry.inBook ? <LockSimpleIcon size={18} color={c.text} /> : <BookOpenIcon size={18} color={c.text} />}
              <Text>{entry.inBook ? copy.book.entryMenu.makePrivate : copy.book.entryMenu.moveToBook}</Text>
            </Button>
            {status && (
              <Text accessibilityLiveRegion="polite" className="text-center text-sm text-success">
                {status}
              </Text>
            )}
            <Button variant="ghost" onPress={remove} accessibilityLabel={copy.settings.delete.entryConfirm}>
              {/* destructive token (terracotta, 5.05:1 light, 7.65:1 dark), never caution amber */}
              <TrashIcon size={18} color={c.recording} />
              <Text className="text-destructive">{copy.book.entryMenu.deleteButton}</Text>
            </Button>
          </View>
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
