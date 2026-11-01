import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

/** Props shared by platform/blur-surface.* (COMPONENT_LIBRARY 5). */
export type BlurSurfaceProps = {
  children?: ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  /** Material thickness. `chrome` for bars, `thin` for floating pills. */
  material?: 'chrome' | 'thin';
  /** Draw a hairline on this edge (bars). */
  edge?: 'top' | 'bottom' | 'none';
};
