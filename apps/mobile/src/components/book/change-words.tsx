/**
 * "Change words" on a saved letter's page and the rows that put each change back (BL-413; the constitution: every
 * edit is stored and reversible, raw_transcript never changes). The sheet writes the person's own words through the
 * store (changeLetterWords); each row puts one change back (putBackLetterEdit). The page follows the store, so the
 * words and the rows change in place. Haptic `tap` on Save and on Put it back; nothing on open.
 */
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { useToast } from '@/components/ui/toast';
import { copy, fill } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { changeLetterWords, letterAuthorEdits, putBackLetterEdit, type Entry } from '@/lib/store';
import { changeRow } from './change-words.logic';

/** The words sheet: the letter's words as they read now, to change; Save keeps them as the person's own. */
export function ChangeWordsSheet({ entry, open, onClose }: { entry: Entry; open: boolean; onClose: () => void }) {
  const r = copy.review;
  const [text, setText] = useState(entry.finalText);
  // The store refused (the letter changed under the sheet, or left the book): the typing stays and the sheet says so.
  const [refused, setRefused] = useState(false);
  useEffect(() => {
    if (!open) return;
    setText(entry.finalText);
    setRefused(false);
    // Only on open: the words in the field are the person's while the sheet is up, whatever the store does.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const same = text.trim() === entry.finalText;
  return (
    <Sheet open={open} onClose={onClose} title={r.editTextButton} testID="letter.changeWords">
      <View className="gap-3 pb-2">
        <TextField
          variant="letter"
          label={r.editTextButton}
          labelHidden
          value={text}
          onChangeText={(v) => {
            setText(v);
            setRefused(false);
          }}
          multiline
          autoFocus
        />
        {refused ? (
          <Text variant="footnote" accessibilityLiveRegion="polite" testID="letter.changeWords.refused">
            {r.saveFailed}
          </Text>
        ) : null}
        <Button
          size="lg"
          label={copy.common.saveButton}
          disabled={!text.trim() || same}
          onPress={() => {
            if (!changeLetterWords(entry.id, text)) return setRefused(true);
            haptic('tap');
            onClose();
          }}
          testID="letter.changeWords.save"
        />
        <Button variant="quiet" size="sm" label={copy.common.cancelButton} onPress={onClose} />
      </View>
    </Sheet>
  );
}

/** One row for each of the person's changes, "{was} to {now}", each with its own Put it back. None: nothing drawn. */
export function ChangeRows({ entryId }: { entryId: string }) {
  const toast = useToast();
  const layer = letterAuthorEdits(entryId);
  if (!layer || layer.edits.length === 0) return null;
  return (
    <View className="gap-2" testID="letter.changes">
      {layer.edits.map((edit) => {
        const row = changeRow(layer.base, edit);
        const line = fill(copy.review.rowChange, { a: row.from, b: row.to });
        return (
          <View key={`${edit.start}:${edit.end}:${edit.replacement}`} className="flex-row items-center gap-2">
            <Text variant="subhead" className="flex-1">
              {line}
            </Text>
            <Button
              variant="quiet"
              size="sm"
              label={copy.review.undoEditButton}
              accessibilityHint={line}
              onPress={() => {
                if (!putBackLetterEdit(entryId, edit)) return toast.show({ message: copy.errors.generic.title });
                haptic('tap');
                toast.show({ message: copy.review.putBackToast });
              }}
              testID="letter.changes.putBack"
            />
          </View>
        );
      })}
    </View>
  );
}
