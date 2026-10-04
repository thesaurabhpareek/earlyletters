// ios: blur-surface.ios.tsx | web: blur-surface.web.tsx | android: this file
/**
 * Android (and any platform without a material): solid surfaceRaised plus a hairline.
 * Android blur needs extra setup and costs frames; not worth it (COMPONENT_LIBRARY 5).
 */
import { View } from 'react-native';
import { useTheme } from '@/lib/a11y';
import { cn } from '@/lib/utils';
import type { BlurSurfaceProps } from './blur-surface.types';

export type { BlurSurfaceProps } from './blur-surface.types';

export function BlurSurface({ children, style, className, edge = 'none' }: BlurSurfaceProps) {
  const { c } = useTheme();
  const edgeClass = edge === 'top' ? 'border-t border-border' : edge === 'bottom' ? 'border-b border-border' : undefined;
  return (
    <View className={cn(edgeClass, className)} style={[{ backgroundColor: c.surfaceRaised }, style]}>
      {children}
    </View>
  );
}
