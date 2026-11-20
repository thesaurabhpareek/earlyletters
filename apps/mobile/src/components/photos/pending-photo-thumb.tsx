/**
 * Ready with a picture (NS-01-R3, R20; design spec 3.2): the thumbnail above the prompt, at most 160 pt tall, with
 * a quiet 44 pt "Change" under it (card section 4 step 4). Reading order today: thumbnail, Change, prompt, Speak, Type;
 * R20b asks Change last, which needs a reading-order override (flagged on #838). It scales to the screen width at
 * accessibility sizes. Absent when nothing was picked or the switch is off. The line under
 * it never names what is in the picture.
 */
import { useWindowDimensions, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { PhotoFrame } from './photo-frame';
import { ErrorLine } from '@/lib/auth/ui';
import { useIsAccessibilitySize } from '@/lib/a11y';
import { photos } from '@/lib/photos/copy';
import { usePendingPhoto } from '@/lib/photos/hooks';
import { THUMB_MAX_HEIGHT_PT } from '@/lib/photos/surface';
import { photoA11yLabel } from '@/lib/photos/text';
import { usePhotoPick } from '@/lib/photos/use-photo-pick';

export function PendingPhotoThumb() {
  const pending = usePendingPhoto();
  const large = useIsAccessibilitySize();
  const { width } = useWindowDimensions();
  const pick = usePhotoPick(async (asset) => void (await pending?.set(asset)));
  const source = pending?.source ?? null;
  if (!pending || !source) return null;
  const w = large ? width - 48 : Math.min(width - 48, THUMB_MAX_HEIGHT_PT * 1.5);
  // The parent's own words, else the fixed phrase (NS-01-R9, R21; design spec 01 section 8): never a date or a description.
  const label = photoA11yLabel(pending.text);
  return (
    <View className="items-center gap-1" testID="ready.photo">
      <PhotoFrame uri={source.uri} label={label} width={w} height={large ? undefined : THUMB_MAX_HEIGHT_PT} aspectRatio={large ? 4 / 3 : undefined} />
      <Button variant="quiet" size="md" label={photos.capture.change} onPress={pick.pick} disabled={pick.busy} testID="ready.photo.change" />
      {/* Said aloud when it appears, and a polite live region (WCAG 4.1.3; spec 01 section 6 names ErrorLine). */}
      <ErrorLine message={pick.failed ? photos.capture.openFailed : null} />
    </View>
  );
}

