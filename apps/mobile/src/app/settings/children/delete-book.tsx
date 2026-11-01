import { router, Stack, useLocalSearchParams } from 'expo-router';
import { FileTextIcon } from 'phosphor-react-native/src/icons/FileText';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { typedWordMatches } from '@/components/settings/wipe.logic';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast';
import { useTheme } from '@/lib/a11y';
import { copy, fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { deleteBook, getChild, localDeletionAllowed } from '@/lib/store';

const PAGE = 'gap-7 px-5 pb-12 pt-4';

/**
 * Delete this book (BL-387; F17 6.2 D; DATA-REQ-014, DATA-REQ-053, F17-REQ-080), on a phone that never signed in.
 * Step 1 says what happens and offers Export first (Export everything is the primary action on the step before
 * Confirm, spec 4.3). Step 2 asks for the typed word, as account deletion does (F17 6.2 D step 4). The book then
 * waits in Recently deleted for 30 days, restorable, and the launch purge erases it (store.ts deleteBook, eraseBook).
 * Nothing is sent. Calm words only: no loss language, no countdown.
 *
 * A phone that has signed in is not offered this here: the server holds the book too (request_book_deletion and the
 * co-parent rule are F17 6.2 D step 5, not built in this screen). The row in child settings is hidden then.
 */
export default function DeleteBook() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [child] = useState(() => (id ? getChild(id) : null));
  const [step, setStep] = useState<'review' | 'confirm'>('review');
  const [typed, setTyped] = useState('');
  const toast = useToast();
  const colors = useTheme().c;
  const d = copy.settings.delete;

  if (!child || !localDeletionAllowed()) return null;
  const name = child.name;
  const header = <Stack.Screen options={{ title: d.deleteBookRow }} />;

  if (step === 'confirm') {
    const ready = typedWordMatches(typed, d.bookTypeWord);
    const confirm = () => {
      if (!ready) return;
      haptic('warning');
      if (deleteBook(child.id)) {
        toast.show({ message: fill(d.bookDeletedToast, { child: name }) });
        router.dismissTo('/settings');
      }
    };
    return (
      <ScrollView key="confirm" contentContainerClassName={PAGE} contentInsetAdjustmentBehavior="automatic" keyboardShouldPersistTaps="handled">
        {header}
        <View className="gap-2">
          <Text variant="title2" asHeading>
            {d.bookTitle}
          </Text>
          <Text variant="body">{d.bookUndo}</Text>
        </View>
        <TextField
          label={d.bookTypeToConfirmLabel}
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          returnKeyType="done"
          testID="deleteBook.typed"
        />
        <View className="gap-2">
          <Button
            variant="destructive"
            size="lg"
            fullWidth
            disabled={!ready}
            accessibilityLabel={d.bookConfirm}
            className={ready ? 'bg-destructive' : 'border border-input'}
            onPress={confirm}
            testID="deleteBook.confirm">
            <Text tone={ready ? 'onDestructive' : 'muted'}>{d.bookConfirm}</Text>
          </Button>
          <Button variant="quiet" fullWidth label={d.bookKeep} onPress={() => router.back()} testID="deleteBook.keep" />
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView key="review" contentContainerClassName={PAGE} contentInsetAdjustmentBehavior="automatic">
      {header}
      <View className="gap-2">
        <Text variant="title2" asHeading>
          {d.bookTitle}
        </Text>
        <Text variant="body">{fill(d.bookBodyThisPhone, { child: name })}</Text>
        <Text variant="body">{d.bookUndo}</Text>
      </View>

      <Card variant="raised" radius="md" padding={4}>
        <View className="flex-row items-center gap-3">
          <FileTextIcon size={24} color={colors.accent} />
          <Text variant="headline" asHeading className="flex-1">
            {d.bookExportFirst}
          </Text>
        </View>
        <Button size="lg" className="self-start" label={copy.settings.export.button} onPress={() => router.push('/settings/export')} testID="deleteBook.export" />
      </Card>

      <View className="gap-2">
        <Button variant="outline" size="lg" fullWidth label={copy.common.continueButton} onPress={() => setStep('confirm')} testID="deleteBook.continue" />
        <Button variant="quiet" fullWidth label={d.bookKeep} onPress={() => router.back()} />
      </View>
    </ScrollView>
  );
}
