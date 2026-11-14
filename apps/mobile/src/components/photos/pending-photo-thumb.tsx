/**
 * Ready with a picture (NS-01-R3, R20; design spec 3.2): the thumbnail above the prompt, at most 160 pt tall, never
 * under 64 pt on its longest side, with a quiet 44 pt "Change". Reading order: thumbnail, prompt, Speak, Type. It
 * scales to the screen width at accessibility sizes. Absent when nothing was picked or the switch is off. The line under
 * it never names what is in the picture.
 */
import { useWindowDimensions, View } from 'react-native';
import { Button } from '@/components/ui/button';
import { PhotoFrame } from './photo-frame';
import { Text } from '@/components/ui/text';
import { useIsAccessibilitySize } from '@/lib/a11y';
import { longDate } from '@/lib/dates';
import { fill } from '@/lib/copy';
import { photos } from '@/lib/photos/copy';
import { usePendingPhoto } from '@/lib/photos/hooks';
import { THUMB_MAX_HEIGHT_PT } from '@/lib/photos/surface';
import { usePhotoPick } from '@/lib/photos/use-photo-pick';

export function PendingPhotoThumb() {
  const pending = usePendingPhoto();
  const large = useIsAccessibilitySize();
  const { width } = useWindowDimensions();
  const pick = usePhotoPick(async (asset) => void (await pending?.set(asset)));
  const source = pending?.source ?? null;
  if (!pending || !source) return null;
  const date = longDate(new Date().toISOString().slice(0, 10));
  const w = large ? width - 48 : Math.min(width - 48, THUMB_MAX_HEIGHT_PT * 1.5);
  const label = pending.text ?? fill(photos.a11y.readyThumb, { date });
  return (
    <View className="items-center gap-1" testID="ready.photo">
      <PhotoFrame uri={source.uri} label={label} width={w} height={large ? undefined : THUMB_MAX_HEIGHT_PT} aspectRatio={large ? 4 / 3 : undefined} />
      <Button variant="quiet" size="md" label={photos.capture.change} onPress={pick.pick} disabled={pick.busy} testID="ready.photo.change" />
      {pick.failed ? <Text variant="footnote" tone="muted" className="text-center">{photos.capture.openFailed}</Text> : null}
    </View>
  );
}

