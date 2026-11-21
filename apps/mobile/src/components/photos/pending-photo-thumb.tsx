/**
 * Ready with a picture (NS-01-R3, R20; design spec 3.2): the thumbnail above the prompt, at most 160 pt tall, with
 * a quiet 44 pt "Change" under it (card section 4 step 4). Reading order (R20b as corrected by erratum E40): thumbnail,
 * Change, prompt, Speak, Type, each control announcing its state (Change is dimmed while a pick is open). It scales to the screen width at
 * accessibility sizes. Absent when nothing was picked or the switch is off. The line under
 * it never names what is in the picture.
 */
import { useWindowDimensions, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { PhotoFrame } from './photo-frame';
import { ErrorLine } from '@/components/ui/error-line';
import { useIsAccessibilitySize } from '@/lib/a11y';
import { photos } from '@/lib/photos/copy';
import { usePendingPhoto } from '@/lib/photos/hooks';
import { THUMB_AX_MAX_HEIGHT_PT, THUMB_MAX_HEIGHT_PT } from '@/lib/photos/surface';
import { photoA11yLabel } from '@/lib/photos/text';
import { usePhotoPick } from '@/lib/photos/use-photo-pick';

export function PendingPhotoThumb() {
  const pending = usePendingPhoto();
  const large = useIsAccessibilitySize();
  const { width } = useWindowDimensions();
  const pick = usePhotoPick(async (asset) => void (await pending?.set(asset)));
  const source = pending?.source ?? null;
  if (!pending || !source) return null;
  // The whole picture fits inside the box, uncropped (R42); from AX3 the box is at most 88 pt tall (R39).
  const boxHeight = large ? THUMB_AX_MAX_HEIGHT_PT : THUMB_MAX_HEIGHT_PT;
  const w = Math.min(width - 48, boxHeight * 1.5);
  // The parent's own words, else the fixed phrase (NS-01-R9, R21; design spec 01 section 8): never a date or a description.
  const label = photoA11yLabel(pending.text);
  return (
    <View className="items-center gap-1" testID="ready.photo">
      <PhotoFrame uri={source.uri} label={label} width={w} height={boxHeight} fit="contain" />
      <Button variant="quiet" size="md" label={photos.capture.change} onPress={pick.pick} disabled={pick.busy} testID="ready.photo.change" />
      {/* Said aloud when it appears, and a polite live region (WCAG 4.1.3; spec 01 section 6 names ErrorLine). */}
      <ErrorLine message={pick.failed ? photos.capture.openFailed : null} />
    </View>
  );
}

