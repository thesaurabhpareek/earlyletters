import { View } from 'react-native';
import { progressOf } from '@/lib/player/player.logic';
import { scrubA11y } from '@/lib/player/scrub-a11y.logic';
import { useTheme } from '@/lib/a11y';

/**
 * Where Review's recording is, as a thin line under the header, and the adjustable position a VoiceOver parent moves
 * within it (BL-1825): the same props as the letter page's player (`scrubA11y`), so swipe up or down moves 5 seconds.
 * It never trims or changes the recording. Sighted touch is Play and Pause in the header; the line only shows where
 * playback is.
 */
export function ReviewScrub({ position, duration, onSeek }: { position: number; duration: number; onSeek: (seconds: number) => void }) {
  const c = useTheme().c;
  return (
    <View {...scrubA11y({ position, shown: position, duration, onSeek })} className="min-h-11 justify-center px-5" testID="review.scrub">
      <View className="h-0.5 overflow-hidden rounded-full" style={{ backgroundColor: c.line }}>
        <View className="h-full" style={{ width: `${progressOf(position, duration) * 100}%`, backgroundColor: c.accent }} />
      </View>
    </View>
  );
}
