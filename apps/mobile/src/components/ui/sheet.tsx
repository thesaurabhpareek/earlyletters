// web: apps/web/components/ui/drawer.tsx (shadcn Drawer) | android: same code
/**
 * Sheet (COMPONENTS 2.12): a focused task without leaving context (Reading Size, Whose
 * book, letter actions). Built on @gorhom/bottom-sheet 5 (BottomSheetModal) with
 * react-native-gesture-handler and Reanimated; needs UIProvider (components/ui/provider).
 *
 * Look: paper sheet (surfaceRaised), radius xl top corners, a grabber, ink scrim
 * (Apple Books "Themes & Settings", Airbnb filters). Sized to its content up to the
 * safe area; pan down or tap the scrim to close.
 *
 * Accessibility contract
 * - The title is a heading and receives VoiceOver focus when the sheet opens.
 * - The sheet is modal for VoiceOver (accessibilityViewIsModal) and closes with the
 *   escape gesture (two-finger Z) and a visible 44 pt Close button.
 * - Library defaults are overridden: its container is not one grouped "adjustable"
 *   element, and its handle and backdrop do not speak English placeholder labels.
 * - dismissible={false} for permission priming and required choices: only the sheet's
 *   own buttons close it (no pan, scrim, Close or escape).
 * Motion: the standard spring (sheetMotion, lib/transitions.logic.ts, MOTION 5l). Reduce Motion:
 * this is our own sheet, so nothing slides (EXPERIENCE_PASS 5.8 rule 6): it and its scrim fade in and
 * out over fadeMs (the library default would jump). The room behind keeps its lamp and pauses its
 * breath while the sheet is up (5.8 row 10). Haptics: none on open (MOTION 6).
 *
 * Swap note: @expo/ui/community/bottom-sheet is an API-compatible native sheet (SwiftUI
 * on iOS); see docs/design/COMPONENT_LIBRARY.md section 0.1.
 */
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as React from 'react';
import { StyleSheet, View, useWindowDimensions, type Text as RNText } from 'react-native';
import Animated, { ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { lampRooms } from '@/components/ui/lamp.logic';
import { Text } from '@/components/ui/text';
import { copy } from '@/lib/copy';
import { useFocusOnMount, useTheme } from '@/lib/a11y';
import { STANDARD_EASING, useSheetMotion } from '@/lib/motion';

export type SheetProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Optional line under the title. */
  description?: string;
  children: React.ReactNode;
  /** Sticky action area at the bottom (one primary button). */
  footer?: React.ReactNode;
  /** Hide the Close button (only when the content has its own Done). */
  hideClose?: boolean;
  /**
   * false: the sheet closes only through its own buttons (permission priming, a choice
   * that must be made). No pan to close, no grabber, the scrim does not close it, no
   * Close button and no escape gesture; the content must offer every way out as a
   * labelled button (for example "Allow" and "Not now"). Default true.
   */
  dismissible?: boolean;
  /** E2E id on the sheet body. */
  testID?: string;
  /** E2E id on the Close button (for example `switcher.close`). */
  closeTestID?: string;
};

/** Grabber: a visual affordance only. Hidden from VoiceOver (Close and escape are the accessible ways out). */
function Grabber() {
  const { c } = useTheme();
  return (
    <View accessible={false} importantForAccessibility="no-hide-descendants" style={{ alignItems: 'center', paddingTop: 8, paddingBottom: 6 }}>
      <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: c.controlBorder, opacity: 0.55 }} />
    </View>
  );
}

export function Sheet({ open, onClose, title, description, children, footer, hideClose, dismissible = true, testID, closeTestID }: SheetProps) {
  const ref = React.useRef<BottomSheetModal>(null);
  const titleRef = React.useRef<RNText>(null);
  const { c, scheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const motion = useSheetMotion();
  const fades = motion.kind === 'fade';
  const [shown, setShown] = React.useState(false);

  // Reduce Motion: the sheet and its scrim fade (veil) while the sheet itself does not travel.
  const veil = useSharedValue(fades ? 0 : 1);
  const veilStyle = useAnimatedStyle(() => ({ opacity: veil.value }));
  const fadeTo = React.useCallback(
    (to: number, then?: () => void) => {
      veil.value = withTiming(to, { duration: tokens.motion.fadeMs, easing: STANDARD_EASING, reduceMotion: ReduceMotion.Never }, (done) => {
        if (done && then) runOnJS(then)();
      });
    },
    [veil],
  );
  const dismiss = React.useCallback(() => ref.current?.dismiss(), []);

  // Present on open; dismiss only on a real open -> closed change. Calling dismiss() on a
  // modal that was never presented leaves @gorhom/bottom-sheet 5.2.14 in its
  // "dismissing" state, and the next present() then unmounts at once.
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (open) {
      if (fades) {
        veil.value = 0;
        fadeTo(1);
      } else veil.value = 1;
      ref.current?.present();
    } else if (wasOpen.current) {
      if (fades) fadeTo(0, dismiss);
      else dismiss();
    }
    wasOpen.current = open;
  }, [open, fades, fadeTo, dismiss, veil]);

  // The room behind keeps its light and pauses its breath while the sheet is up (EXPERIENCE_PASS 5.8 row 10).
  React.useEffect(() => (shown ? lampRooms.openSheet() : undefined), [shown]);

  useFocusOnMount(titleRef, shown, title);
  /** Close through the sheet so it animates (or, under Reduce Motion, fades) out; onDismiss then tells the parent. */
  const close = React.useCallback(() => (fades ? fadeTo(0, dismiss) : dismiss()), [fades, fadeTo, dismiss]);

  const animationConfigs = React.useMemo(
    () =>
      motion.kind === 'fade'
        ? // No travel: the position lands at once and the veil carries the change.
          { duration: 1, reduceMotion: ReduceMotion.Never }
        : { stiffness: motion.stiffness, damping: motion.damping, mass: motion.mass, reduceMotion: ReduceMotion.Never },
    [motion],
  );

  const backdrop = React.useCallback(
    (props: BottomSheetBackdropProps) => {
      const scrim = (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={1}
          // Under Reduce Motion a tap on the scrim fades the sheet out first.
          pressBehavior={dismissible && !fades ? 'close' : 'none'}
          onPress={dismissible && fades ? close : undefined}
          style={fades ? [StyleSheet.absoluteFill, { backgroundColor: c.scrim }] : [props.style, { backgroundColor: c.scrim }]}
          accessible={dismissible}
          accessibilityRole={dismissible ? 'button' : undefined}
          accessibilityLabel={dismissible ? copy.common.closeButton : undefined}
          accessibilityHint={undefined}
        />
      );
      return fades ? <Animated.View style={[props.style, veilStyle]}>{scrim}</Animated.View> : scrim;
    },
    [c.scrim, dismissible, fades, close, veilStyle],
  );

  return (
    <BottomSheetModal
      ref={ref}
      onDismiss={() => {
        setShown(false);
        onClose();
      }}
      onChange={(i) => setShown(i >= 0)}
      enableDynamicSizing
      maxDynamicContentSize={height - insets.top - 24}
      enablePanDownToClose={dismissible}
      enableHandlePanningGesture={dismissible}
      enableContentPanningGesture={dismissible}
      backdropComponent={backdrop}
      animationConfigs={animationConfigs}
      overrideReduceMotion={ReduceMotion.Never}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      accessible={false}
      backgroundStyle={{
        backgroundColor: c.surfaceRaised,
        borderTopLeftRadius: tokens.radius.xl,
        borderTopRightRadius: tokens.radius.xl,
        ...(scheme === 'dark' ? { borderWidth: 0.5, borderColor: c.line } : {}),
      }}
      handleComponent={dismissible ? Grabber : null}
      style={[scheme === 'light' ? { boxShadow: tokens.elevation[3].web } : undefined, veilStyle]}>
      <BottomSheetView>
        <View
          accessibilityViewIsModal
          testID={testID}
          onAccessibilityEscape={dismissible ? close : undefined}
          style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
          className={dismissible ? 'gap-4 px-5' : 'gap-4 px-5 pt-5'}>
          <View className="flex-row items-start gap-3 pt-1">
            <View className="flex-1 gap-1 pt-1.5">
              <Text ref={titleRef} variant="title2" asHeading>
                {title}
              </Text>
              {description ? <Text variant="subhead" tone="muted">{description}</Text> : null}
            </View>
            {/* The one modal idiom (lib/navigation.logic.ts): the word "Close", top right, 44 pt. Not a circled X. */}
            {dismissible && !hideClose && <Button variant="quiet" size="sm" className="-mr-3" label={copy.common.closeButton} onPress={close} testID={closeTestID} />}
          </View>
          {children}
          {footer ? <View className="pt-2">{footer}</View> : null}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
  );
}
