// web: same | android: same
/**
 * PinnedActionLayout (BL-418): the screen's one primary action, pinned at the bottom. The content scrolls above it.
 * From AX1 up the action moves into the scroll, last, so large type never covers the screen (pinned-action.logic.ts).
 * `action` holds the primary (a Button size lg, fullWidth) and any quiet options beneath it.
 * Accessibility: the action is last in reading order at every size; focus order matches the visual order.
 */
import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PINNED_ACTION, isPinned } from '@/components/ui/pinned-action.logic';
import { useFontScale } from '@/lib/a11y';

export type PinnedActionLayoutProps = {
  children: ReactNode;
  /** Omit (null) while the screen has no primary to offer; nothing is pinned then. */
  action?: ReactNode;
  /** Centre the content in the space above the action (an empty state). */
  center?: boolean;
  /** The screen's own insets and gaps for the scrolling content. */
  contentContainerClassName?: string;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** False inside the tab bar, which already clears the home indicator. */
  insetBottom?: boolean;
  testID?: string;
};

export function PinnedActionLayout({ children, action, center = false, contentContainerClassName, contentContainerStyle, insetBottom = true, testID }: PinnedActionLayoutProps) {
  const pinned = isPinned(useFontScale());
  const insets = useSafeAreaInsets();
  const bottom = insetBottom ? Math.max(insets.bottom, PINNED_ACTION.bottom) : PINNED_ACTION.bottom;
  const footerStyle = { paddingHorizontal: PINNED_ACTION.gutter, paddingTop: PINNED_ACTION.top, paddingBottom: bottom };
  return (
    <View className="flex-1" testID={testID}>
      <ScrollView
        className="flex-1"
        contentContainerClassName={contentContainerClassName}
        contentContainerStyle={[{ flexGrow: 1 }, center ? { justifyContent: 'center' } : null, contentContainerStyle]}
        contentInsetAdjustmentBehavior="automatic"
        showsVerticalScrollIndicator={false}>
        {children}
        {!action || pinned ? null : (
          <View style={footerStyle} testID="pinnedAction.scrolling">
            {action}
          </View>
        )}
      </ScrollView>
      {action && pinned ? (
        <View style={footerStyle} testID="pinnedAction.pinned">
          {action}
        </View>
      ) : null}
    </View>
  );
}
