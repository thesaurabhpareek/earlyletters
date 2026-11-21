/**
 * The picture's CONTROLS on a kept letter's page and on Review (NS-01-R7 to R9, R21): add, replace (asks first, the first
 * stays until they choose), take off with Undo, and the words and place. The author only (letterPhotoControls). The
 * picture itself is LetterPicture below, drawn by the letter page's opening between the dateline and the words
 * (CL-116 C-01). None of this touches the letter's words, transcript or recording. Absent when the photos switch is off.
 */
import { useEffect, useRef, useState } from 'react';
import { Alert, View, useWindowDimensions } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { TextField } from '@/components/ui/text-field';
import { announce, useIsAccessibilitySize } from '@/lib/a11y';
import { ErrorLine } from './error-line';
import { photoWordsFieldsShown } from '@/lib/photos/words-setting';
import { copy } from '@/lib/copy';
import { useToast } from '@/components/ui/toast';
import { clearPhotoNotSaved } from '@/lib/photos/failures';
import { usePhotoNotSaved } from '@/lib/photos/hooks';
import { addPhotoToLetter, editPhotoWords, removePhotoFromLetter, settlePhotoChange, undoPhotoChange, type UndoTicket } from '@/lib/photos/attach';
import { photos } from '@/lib/photos/copy';
import { photoDeps, photoUri, pickedFilesPort } from '@/lib/photos/device';
import { photoSurfaces, photosBuildEnabled } from '@/lib/photos/flag';
import { photosPausedNow } from '@/lib/photos/pause';
import { useLetterPhoto } from '@/lib/photos/hooks';
import { photoA11yLabel } from '@/lib/photos/text';
import { letterPhotoControls, letterPictureSize } from '@/lib/photos/surface';
import type { PickedAsset, StoredPhoto } from '@/lib/photos/types';
import { usePhotoPick } from '@/lib/photos/use-photo-pick';
import { PhotoFrame } from './photo-frame';

export function LetterPhoto({ entryId, finalText, own, draft = false }: { entryId: string; finalText: string; own: boolean; draft?: boolean }) {
  const photo = useLetterPhoto(entryId);
  const toast = useToast();
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState(false);
  // Words are written when the parent leaves a field or taps Done, not on every keystroke (each write is a SQLite write that
  // broadcasts to the store's listeners). The latest text waits in a ref, and unmounting flushes it.
  const typed = useRef<{ text?: string; place?: string }>({});
  const flush = () => {
    const t = typed.current;
    typed.current = {};
    if (t.text !== undefined || t.place !== undefined) editPhotoWords(photoDeps(), entryId, t);
  };
  useEffect(() => flush, []); // eslint-disable-line react-hooks/exhaustive-deps
  const notSaved = usePhotoNotSaved(entryId);
  const on = photoSurfaces({ build: photosBuildEnabled(), paused: photosPausedNow() }).addActions;

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
      const r = await addPhotoToLetter(photoDeps(), { entryId, finalText, bytes, text: null, sourceUri: asset.uri, requireWords: !draft }, confirmed);
      if (r.status === 'needs_confirm') {
        keepOriginal = true; // the choice below decides; the original is removed after it
        Alert.alert(photos.book.letter.replacePhotoAsk.question, photos.book.letter.replacePhotoAsk.body, [
          { text: photos.book.letter.replacePhotoAsk.keep, style: 'cancel', onPress: () => void files.remove(asset.uri) },
          { text: photos.book.letter.replacePhotoAsk.confirm, onPress: () => void run(asset, true) },
        ]);
        return;
      }
      const result = r.result;
      if (result.status !== 'stored') setFailed(true);
      else {
        clearPhotoNotSaved(entryId);
        if (r.status === 'replaced') offerUndo(photos.book.letter.replacePhotoUndo, r.ticket);
      }
    } catch {
      setFailed(true);
    } finally {
      if (!keepOriginal) await files.remove(asset.uri);
    }
  };
  const pick = usePhotoPick((asset) => {
    setFailed(false);
    return run(asset, false);
  });

  if (!on || !pick.ready) return null;
  const words = draft || finalText.trim().length > 0;
  const controls = letterPhotoControls({ own, hasPhoto: !!photo, hasWords: words });
  if (!photo) {
    return controls.add ? (
      <View className="items-start" testID="letter.photo.add">
        {notSaved ? <SpokenLine text={draft ? photos.review.notStored : photos.book.letter.notSaved} testID="letter.photo.notSaved" /> : null}
        <Button variant="quiet" size="md" label={photos.book.letter.addPhoto} onPress={pick.pick} disabled={pick.busy} testID="letter.photo.addButton" />
        <ErrorLine message={failed || pick.failed ? photos.capture.openFailed : null} />
      </View>
    ) : null;
  }
  return (
    <View className="gap-2" testID="letter.photo.controls">
      {editing && controls.editWords && photoWordsFieldsShown() ? (
        <View className="gap-3" testID="letter.photo.edit">
          {/* No length cap on the fields: a native cap counts UTF-16 units and could cut a character in half; editPhotoWords keeps 140 and 60 characters a person sees (BL-957). */}
          <TextField label={photos.text.label} helper={`${photos.text.optional}. ${photos.text.hint}`} defaultValue={photo.text ?? ''} multiline onChangeText={(t) => (typed.current.text = t)} onBlur={flush} testID="letter.photo.text" />
          <TextField label={photos.text.placeLabel} helper={photos.text.placeHint} defaultValue={photo.place ?? ''} onChangeText={(t) => (typed.current.place = t)} onBlur={flush} testID="letter.photo.place" />
          <Button variant="quiet" size="md" label={copy.common.doneButton} onPress={() => (flush(), setEditing(false))} testID="letter.photo.editDone" />
        </View>
      ) : null}
      {controls.change ? (
        <View className="items-start">
          {!editing && photoWordsFieldsShown() ? <Button variant="quiet" size="md" label={photos.text.label} onPress={() => setEditing(true)} testID="letter.photo.editWords" /> : null}
          <Button variant="quiet" size="md" label={photos.book.letter.changePhoto} onPress={pick.pick} disabled={pick.busy} testID="letter.photo.change" />
          <Button
            variant="quiet"
            size="md"
            label={photos.book.letter.removePhoto}
            onPress={() => offerUndo(photos.book.letter.removed, removePhotoFromLetter(photoDeps(), entryId))}
            testID="letter.photo.remove"
          />
          <ErrorLine message={failed || pick.failed ? photos.capture.openFailed : null} />
        </View>
      ) : null}
    </View>
  );
}

/**
 * The picture itself on the letter page (NS-01-R7 to R9, CL-116 C-01, ruling NS-01-C01-order): drawn by the page's
 * opening BETWEEN the dateline and the words, display only, with the parent's photo words and place under it. The
 * controls (add, change, words, remove) stay in LetterPhoto below the words. Sized on first render from the width and
 * height stored on its row, so nothing below it moves after open; its name is the fixed phrase or the parent's own
 * words (R9a, R21c), never derived from the picture. Absent (no gap) when there is no picture or photos are off.
 */
export function LetterPicture({ entryId, own, columnWidth }: { entryId: string; own: boolean; columnWidth: number }) {
  const photo = useLetterPhoto(entryId);
  const large = useIsAccessibilitySize();
  const { height: windowHeight } = useWindowDimensions();
  const on = photoSurfaces({ build: photosBuildEnabled(), paused: photosPausedNow() }).addActions;
  if (!on || !photo) return null;
  const { width, height } = letterPictureSize({ columnWidth, windowHeight, aspect: photo.width && photo.height ? photo.width / photo.height : 4 / 3, largeText: large });
  return (
    <View className="gap-2" testID="letter.photo">
      <PictureFrame key={photo.mediaId} photo={photo} own={own} width={width} height={height} />
      {/* The photo words are the picture's accessible name already (R21c): the caption is for the eye, not read twice. */}
      {photo.text ? (
        <Text variant="callout" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" testID="letter.photo.text">
          {photo.text}
        </Text>
      ) : null}
      {photo.place ? <Text variant="footnote" tone="muted" testID="letter.photo.placeText">{photo.place}</Text> : null}
    </View>
  );
}

function PictureFrame({ photo, own, width, height }: { photo: StoredPhoto; own: boolean; width: number; height: number }) {
  const [missing, setMissing] = useState(false);
  if (missing) {
    return (
      <View className="gap-1" testID="letter.photo.missing">
        <Text variant="callout" tone="muted">{photos.book.letter.missing}</Text>
        {letterPhotoControls({ own, hasPhoto: true, hasWords: true }).remove ? (
          <Button variant="quiet" size="md" label={photos.book.letter.missingRemove} onPress={() => void removePhotoFromLetter(photoDeps(), photo.entryId)} testID="letter.photo.missingRemove" />
        ) : null}
      </View>
    );
  }
  return <PhotoFrame uri={photoUri(photo)} label={photoA11yLabel(photo.text)} width={width} height={height} onMissing={() => setMissing(true)} testID="letter.photo.frame" />;
}

/**
 * A calm line said aloud once when it appears (NS-33 section 6): announce() on iOS, a polite live region on Android. It
 * keeps the muted look of a line that names no cause, so it is not an ErrorLine.
 */
function SpokenLine({ text, testID }: { text: string; testID: string }) {
  useEffect(() => {
    announce(text);
  }, [text]);
  return (
    <Text variant="callout" tone="muted" accessibilityLiveRegion="polite" testID={testID}>
      {text}
    </Text>
  );
}
