/**
 * The picture on Review, before Keep (NS-01-R7, R21; design spec 4). Add, replace and take off, each with Undo for 10
 * seconds, and the parent's own words and place for the picture (140 and 60 characters). Nothing is stored until Keep:
 * this edits the pending picture in memory (lib/photos/pending.ts). The app writes no caption; the fields start empty.
 * Absent when the photos switch is off or no picker is registered.
 */
import { View } from 'react-native';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { Text } from '@/components/ui/text';
import { useToast } from '@/components/ui/toast';
import { useIsAccessibilitySize } from '@/lib/a11y';
import { longDate } from '@/lib/dates';
import { fill } from '@/lib/copy';
import { photos } from '@/lib/photos/copy';
import { photoSurfaces, photosBuildEnabled } from '@/lib/photos/flag';
import { usePendingPhoto } from '@/lib/photos/hooks';
import { PHOTO_PLACE_MAX, PHOTO_TEXT_MAX } from '@/lib/photos/types';
import { usePhotoPick } from '@/lib/photos/use-photo-pick';
import { PhotoFrame } from './photo-frame';

export function ReviewPhoto() {
  const pending = usePendingPhoto();
  const toast = useToast();
  const large = useIsAccessibilitySize();
  const pick = usePhotoPick(async (asset) => {
    if (!pending) return;
    const replacing = pending.source !== null;
    await pending.set(asset);
    if (replacing) toast.show({ message: photos.book.letter.replaced, action: { label: photos.book.letter.undo, onPress: () => void pending.undo() }, onDismiss: () => void pending.settle() });
  });
  if (!pending || !photoSurfaces({ build: photosBuildEnabled(), paused: false }).addActions || !pick.ready) return null;
  const source = pending.source;
  if (!source) {
    return (
      <View className="items-start" testID="review.photo.add">
        <Button variant="quiet" size="md" label={photos.book.letter.addPhoto} onPress={pick.pick} disabled={pick.busy} testID="review.photo.addButton" />
        {pick.failed ? <Text variant="footnote" tone="muted">{photos.capture.openFailed}</Text> : null}
      </View>
    );
  }
  const date = longDate(new Date().toISOString().slice(0, 10));
  return (
    <View className="gap-3" testID="review.photo">
      <View className={large ? 'gap-3' : 'flex-row items-start gap-3'}>
        <PhotoFrame uri={source.uri} label={pending.text ?? fill(photos.a11y.readyThumb, { date })} width={large ? undefined : 96} height={large ? undefined : 96} aspectRatio={large ? 4 / 3 : undefined} testID="review.photo.frame" />
        <View className="flex-1 items-start">
          <Button variant="quiet" size="md" label={photos.capture.change} onPress={pick.pick} disabled={pick.busy} testID="review.photo.change" />
          <Button
            variant="quiet"
            size="md"
            label={photos.book.letter.removePhoto}
            onPress={() => {
              pending.remove();
              toast.show({ message: photos.book.letter.removed, action: { label: photos.book.letter.undo, onPress: () => void pending.undo() }, onDismiss: () => void pending.settle() });
            }}
            testID="review.photo.remove"
          />
        </View>
      </View>
      <TextField label={photos.text.label} helper={`${photos.text.optional}. ${photos.text.hint}`} value={pending.typedText} maxLength={PHOTO_TEXT_MAX} onChangeText={(t) => pending.setText(t)} multiline testID="review.photo.text" />
      <TextField label={photos.text.placeLabel} helper={photos.text.placeHint} value={pending.typedPlace} maxLength={PHOTO_PLACE_MAX} onChangeText={(t) => pending.setPlace(t)} testID="review.photo.place" />
      {pick.failed ? <Text variant="footnote" tone="muted">{photos.capture.openFailed}</Text> : null}
    </View>
  );
}
