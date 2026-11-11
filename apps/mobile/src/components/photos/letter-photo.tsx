/**
 * The picture on a kept letter's page (NS-01-R7 to R9; design spec 4): shown beside the parent's words, with the words
 * they typed about it and the place they typed. The letter's author can add, replace (asks first, the first stays until
 * they choose) and take it off, each with Undo for 10 seconds. A missing file reads "Not on this phone any more" with
 * Remove; the letter itself reads whole. None of this touches the letter's words, transcript or recording.
 * Absent when the photos switch is off.
 */
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { addPhotoToLetter, removePhotoFromLetter, settlePhotoChange, undoPhotoChange, type UndoTicket } from '@/lib/photos/attach';
import { photos } from '@/lib/photos/copy';
import { photoDeps, photoUri, pickedFilesPort } from '@/lib/photos/device';
import { photoSurfaces, photosBuildEnabled } from '@/lib/photos/flag';
import { useLetterPhoto } from '@/lib/photos/hooks';
import { photoA11yLabel } from '@/lib/photos/text';
import type { PickedAsset } from '@/lib/photos/types';
import { usePhotoPick } from '@/lib/photos/use-photo-pick';
import { PhotoFrame } from './photo-frame';

export function LetterPhoto({ entryId, finalText, own }: { entryId: string; finalText: string; own: boolean }) {
  const photo = useLetterPhoto(entryId);
  const toast = useToast();
  const [missing, setMissing] = useState(false);
  const [failed, setFailed] = useState(false);
  const on = photoSurfaces({ build: photosBuildEnabled(), paused: false }).addActions;

  const offerUndo = (message: string, ticket: UndoTicket | null) => {
    if (!ticket) return;
    const deps = photoDeps();
    toast.show({
      message,
      action: { label: photos.book.letter.undo, onPress: () => void undoPhotoChange(deps, ticket) },
      onDismiss: () => void settlePhotoChange(deps, ticket),
    });
  };

  const run = async (asset: PickedAsset, confirmed: boolean): Promise<void> => {
    const files = pickedFilesPort();
    let keepOriginal = false;
    try {
      const bytes = await files.read(asset.uri);
      const r = await addPhotoToLetter(photoDeps(), { entryId, finalText, bytes, text: null }, confirmed);
      if (r.status === 'needs_confirm') {
        keepOriginal = true; // the choice below decides; the original is removed after it
        Alert.alert(photos.book.letter.replaceTitle, photos.book.letter.replaceBody, [
          { text: photos.book.letter.replaceKeep, style: 'cancel', onPress: () => void files.remove(asset.uri) },
          { text: photos.book.letter.replaceConfirm, onPress: () => void run(asset, true) },
        ]);
        return;
      }
      const result = r.result;
      if (result.status !== 'stored') setFailed(true);
      else if (r.status === 'replaced') offerUndo(photos.book.letter.replaced, r.ticket);
    } catch {
      setFailed(true);
    } finally {
      if (!keepOriginal) await files.remove(asset.uri);
    }
  };
  const pick = usePhotoPick((asset) => {
    setFailed(false);
    setMissing(false);
    return run(asset, false);
  });

  if (!on || !pick.ready) return null;
  const words = finalText.trim().length > 0;
  if (!photo) {
    return own && words ? (
      <View className="items-start" testID="letter.photo.add">
        <Button variant="quiet" size="md" label={photos.book.letter.addPhoto} onPress={pick.pick} disabled={pick.busy} testID="letter.photo.addButton" />
        {failed || pick.failed ? <Text variant="footnote" tone="muted">{photos.capture.openFailed}</Text> : null}
      </View>
    ) : null;
  }
  const label = photoA11yLabel(photo.text);
  return (
    <View className="gap-2" testID="letter.photo">
      {missing ? (
        <View className="gap-1" testID="letter.photo.missing">
          <Text variant="callout" tone="muted">{photos.book.letter.missing}</Text>
          {own ? (
            <Button variant="quiet" size="md" label={photos.book.letter.missingRemove} onPress={() => void removePhotoFromLetter(photoDeps(), entryId)} testID="letter.photo.missingRemove" />
          ) : null}
        </View>
      ) : (
        <PhotoFrame uri={photoUri(photo)} label={label} aspectRatio={photo.width && photo.height ? photo.width / photo.height : 4 / 3} onMissing={() => setMissing(true)} testID="letter.photo.frame" />
      )}
      {photo.text ? <Text variant="callout">{photo.text}</Text> : null}
      {photo.place ? <Text variant="footnote" tone="muted">{photo.place}</Text> : null}
      {own ? (
        <View className="items-start">
          <Button variant="quiet" size="md" label={photos.capture.change} onPress={pick.pick} disabled={pick.busy} testID="letter.photo.change" />
          <Button
            variant="quiet"
            size="md"
            label={photos.book.letter.removePhoto}
            onPress={() => offerUndo(photos.book.letter.removed, removePhotoFromLetter(photoDeps(), entryId))}
            testID="letter.photo.remove"
          />
          {failed || pick.failed ? <Text variant="footnote" tone="muted">{photos.capture.openFailed}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}
