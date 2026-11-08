/**
 * The lock screen and the app switcher cover (design.md 2.4; SETTINGS_AND_ACCOUNT.md section 4; security.md section 2),
 * rendered once by the root layout, over everything.
 *
 * - Over everything means over native modals too (Listen, Review, Write and the sheets are presented view
 *   controllers): on iOS it draws in react-native-screens' FullWindowOverlay, a layer above the presented screens,
 *   and it mounts only while needed, so it is never in the way of a touch otherwise. Elsewhere (web preview) it is an
 *   absolute layer on top of the root.
 * - It only covers. Nothing under it unmounts, so a take being kept as the app left the front finishes underneath.
 * - Cover: drawn at once when the app goes inactive while the lock is on (no fade). Lock screen: the cover plus one
 *   Unlock button; the system sheet asks once on its own per lock, never in a loop; Cancel leaves Unlock and nothing
 *   else. Success: the cover fades out over fadeMs (also the Reduce Motion form) and nothing plays (no haptic).
 * - VoiceOver: the layer is modal; the cover reads only the app name; focus lands on Unlock, with its hint.
 * - The passcode was removed: the lock is off, and one toast says so (once).
 */
import { useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import Animated, { ReduceMotion, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FullWindowOverlay } from 'react-native-screens';
import { tokens } from '@scribe/design-tokens';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { announce, useFocusOnMount } from '@/lib/a11y';
import { clearNotice, coverShown, markPrompted, readLockAbility, unlock, useAppLock } from '@/lib/app-lock/controller';
import { appLockCopy } from '@/lib/app-lock/copy';
import { shouldAutoPrompt, type LockMethod } from '@/lib/app-lock/machine';
import { PrivacyCover } from './privacy-cover';

export function AppLockLayer() {
  const s = useAppLock();
  const show = coverShown(s);
  const toast = useToast();

  // Unlocked: keep the layer for one fade, then take it away. Any other way of leaving (back in front within the
  // grace) removes it at once.
  const [fading, setFading] = useState(false);
  const wasLocked = useRef(s.locked);
  const opacity = useSharedValue(1);
  useEffect(() => {
    if (show) {
      setFading(false);
      opacity.value = 1;
    } else if (wasLocked.current) {
      setFading(true);
      opacity.value = withTiming(0, { duration: tokens.motion.fadeMs, reduceMotion: ReduceMotion.Never });
      const id = setTimeout(() => setFading(false), tokens.motion.fadeMs);
      return () => clearTimeout(id);
    }
    return undefined;
  }, [show, opacity]);
  useEffect(() => {
    wasLocked.current = s.locked;
  }, [s.locked]);

  // The one automatic ask per lock.
  useEffect(() => {
    if (!shouldAutoPrompt(s)) return;
    markPrompted();
    void unlock();
  }, [s]);

  useEffect(() => {
    if (s.notice !== 'passcodeRemoved') return;
    toast.show({ message: appLockCopy.passcodeRemoved });
    announce(appLockCopy.passcodeRemoved);
    clearNotice();
  }, [s.notice, toast]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  if (!show && !fading) return null;

  const layer = (
    <Animated.View style={[StyleSheet.absoluteFill, style]} accessibilityViewIsModal pointerEvents={show ? 'auto' : 'none'}>
      <PrivacyCover>{s.locked ? <LockControls /> : null}</PrivacyCover>
    </Animated.View>
  );
  if (Platform.OS === 'ios') return <FullWindowOverlay unstable_accessibilityContainerViewIsModal>{layer}</FullWindowOverlay>;
  return <View style={[StyleSheet.absoluteFill, styles.web]}>{layer}</View>;
}

/** Unlock, at the foot of the cover where a thumb reaches it; stacks and grows with Dynamic Type (Button lg). */
function LockControls() {
  const unlockRef = useRef<View>(null);
  const [method, setMethod] = useState<LockMethod | null>(null);
  useEffect(() => {
    let live = true;
    void readLockAbility().then((a) => live && setMethod(a.available ? a.method : 'passcode'));
    return () => {
      live = false;
    };
  }, []);
  useFocusOnMount(unlockRef);
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.controls, { bottom: insets.bottom + 24 }]}>
      <Button
        ref={unlockRef}
        size="lg"
        fullWidth
        label={appLockCopy.unlock}
        accessibilityHint={method ? appLockCopy.unlockHint[method] : undefined}
        onPress={() => void unlock()}
        testID="appLock.unlock"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  controls: { position: 'absolute', left: 24, right: 24 },
  web: { zIndex: 1000 },
});
