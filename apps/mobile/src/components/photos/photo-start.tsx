/**
 * "Start from a photo" (NS-01-R1, design spec 3.1): the one quiet photo start, on Home only. A text button with a
 * leading image glyph; never larger than Speak, Type or "Not much today". Absent, not greyed, when the switch is off
 * or no picker is registered. Every word comes from packages/content.
 */
import { ImageIcon } from 'phosphor-react-native/src/icons/Image';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { fill } from '@/lib/copy';
import { photos } from '@/lib/photos/copy';

export function PhotoStartButton({ child, onPress, failed = false }: { child: string; onPress: () => void; failed?: boolean }) {
  return (
    <>
    <Button
      variant="quiet"
      size="md"
      icon={ImageIcon}
      label={photos.capture.startButton}
      accessibilityHint={fill(photos.a11y.startHint, { child })}
      onPress={onPress}
      className="self-center"
    />
    {failed ? <Text variant="footnote" tone="muted" className="text-center">{photos.capture.openFailed}</Text> : null}
    </>
  );
}
