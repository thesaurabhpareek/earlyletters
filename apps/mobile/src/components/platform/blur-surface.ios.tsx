// web: blur-surface.web.tsx | android: blur-surface.tsx (solid)
/**
 * iOS: a system material behind bars and floating chrome (expo-blur BlurView), with a
 * thin paper tint so it stays warm. Reduce Transparency: solid surfaceRaised (HIG
 * Materials, DESIGN_LANGUAGE 11.4). Never in the content layer, never animated (MOTION 7).
 */
import { BlurView } from 'expo-blur';
import { View } from 'react-native';
import { useTheme } from '@/lib/a11y';
import type { BlurSurfaceProps } from './blur-surface.types';

export type { BlurSurfaceProps } from './blur-surface.types';

export function BlurSurface({ children, style, className, material = 'chrome', edge = 'none' }: BlurSurfaceProps) {
  const { c, scheme, reduceTransparency } = useTheme();
  const edgeStyle = edge === 'top' ? { borderTopWidth: 0.5, borderTopColor: c.line } : edge === 'bottom' ? { borderBottomWidth: 0.5, borderBottomColor: c.line } : undefined;
  if (reduceTransparency) {
    return (
      <View className={className} style={[{ backgroundColor: c.surfaceRaised }, edgeStyle, style]}>
        {children}
      </View>
    );
  }
  const tint = material === 'thin' ? (scheme === 'dark' ? 'systemThinMaterialDark' : 'systemThinMaterialLight') : scheme === 'dark' ? 'systemChromeMaterialDark' : 'systemChromeMaterialLight';
  return (
    // BlurView is not a Uniwind-wrapped component, so it takes style only; className goes on a wrapper.
    <View className={className} style={[edgeStyle, style, { overflow: 'hidden' }]}>
      <BlurView tint={tint} intensity={80} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: c.bg, opacity: 0.72 }} />
      {children}
    </View>
  );
}
