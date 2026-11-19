/**
 * PhotoFrame (COMPONENTS 2.23, design spec 01 section 3.3): one picture in a plain frame. Drawn with React Native's
 * Image (the spec names expo-image, which is not a dependency; adding one is its own review). While a screen must be
 * blank for the app switcher (NS-01-R13) it draws an opaque box instead of the picture, at once, with no animation.
 * The accessible name is the parent's own typed words, or the fixed label with the date; never a description of what is
 * in the picture (the app writes none).
 */
import { useState } from 'react';
import { Image, View } from 'react-native';
import { tokens } from '@scribe/design-tokens';
import { useTheme } from '@/lib/a11y';
import { usePictureCovered } from '@/lib/photos/hooks';

export interface PhotoFrameProps {
  uri: string;
  label: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  /** The file is gone: the caller draws its own "not on this phone any more" box. */
  onMissing?: () => void;
  testID?: string;
}

export function PhotoFrame({ uri, label, width, height, aspectRatio, onMissing, testID }: PhotoFrameProps) {
  const { c } = useTheme();
  const covered = usePictureCovered();
  const [failed, setFailed] = useState(false);
  const box = { width, height, aspectRatio, borderRadius: tokens.radius.md, borderWidth: 1, borderColor: c.line, backgroundColor: c.surface, overflow: 'hidden' as const };
  if (covered || failed) return <View style={box} testID={testID ? `${testID}.blank` : undefined} accessible accessibilityRole="image" accessibilityLabel={label} />;
  return (
    <View style={box} testID={testID}>
      <Image
        source={{ uri }}
        resizeMode="cover"
        style={{ width: '100%', height: '100%' }}
        accessible
        accessibilityRole="image"
        accessibilityLabel={label}
        onError={() => {
          setFailed(true);
          onMissing?.();
        }}
      />
    </View>
  );
}
