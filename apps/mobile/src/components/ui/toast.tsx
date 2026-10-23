// web: apps/web/components/ui/sonner.tsx (shadcn Sonner) | android: same code (not Compose Snackbar)
/**
 * Toast (COMPONENTS 2.14): a quiet confirmation, usually with Undo, instead of a confirm
 * dialog (Airbnb wishlist undo, Apple Mail "Undo Send" bar).
 *
 * - One at a time, for the whole app: a new show() replaces the toast on screen, whichever host
 *   draws it (toast.logic.ts; EXPERIENCE_PASS principle 8, S38). In the same host the box stays and
 *   the new words cross-fade over the old (swapMs, 5.8 row 11); the replaced toast's onDismiss runs, because its Undo
 *   can no longer be pressed. A late timer or swipe on a replaced toast never closes the new one.
 * - With an action (Undo) it never times out: it stays until Undo, Close, a swipe down or
 *   the screen changes (WCAG 2.2.1, DESIGN_LANGUAGE 11.5). Without an action it leaves
 *   after `durationMs` (default 4 s), and never while a screen reader is running.
 * - Announced once (iOS announce(), Android polite live region). Focus is not moved.
 * - Undo and Close are 44 pt. Sits above the home indicator and any bottom bar (`bottomOffset`).
 * Motion: enter y 8 to 0 + fade (280 ms), exit 160 ms; swipe down to dismiss (Gesture
 * Handler). Reduce Motion: fades only. Haptics: none on show; `tap` on Undo.
 */
import { XIcon } from 'phosphor-react-native/src/icons/X';
import * as React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut, ReduceMotion, runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { Button, IconButton } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { createToastStore } from '@/components/ui/toast.logic';
import { announce, useScreenReader, useTheme } from '@/lib/a11y';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';

/** A toast replacing the one on screen cross-fades in place (swapMs, EXPERIENCE_PASS 5.8 row 11); a fade is also the Reduce Motion form. */
const SWAP_IN = FadeIn.duration(tokens.motion.swapMs).reduceMotion(ReduceMotion.Never);
const SWAP_OUT = FadeOut.duration(tokens.motion.swapMs).reduceMotion(ReduceMotion.Never);

export type ToastOptions = {
  message: string;
  /** `testID`: E2E id on the action button (for example `letter.undo`). */
  action?: { label: string; onPress: () => void; testID?: string };
  /** Only for toasts without an action. */
  durationMs?: number;
  onDismiss?: () => void;
};

type ToastViewProps = ToastOptions & {
  /** Extra space above the safe area (a tab bar or sticky footer). */
  bottomOffset?: number;
  /** Called when the toast should go away (Close, swipe, timeout, after the action). */
  onHide: () => void;
  /** Set by ToastHost: which show() this is. A new key in the same box swaps the words in place. */
  entryKey?: number;
};

/** Presentational toast. Render it last inside a full-screen container (or use ToastHost). */
export function Toast({ message, action, durationMs = 4000, bottomOffset = 0, onHide, onDismiss, entryKey }: ToastViewProps) {
  const insets = useSafeAreaInsets();
  const { c } = useTheme();
  const motion = useMotion();
  const screenReader = useScreenReader();
  const dy = useSharedValue(0);
  // The first show() of this box enters with the box; a replacement only fades its words in.
  const firstKey = React.useRef(entryKey);
  const swapped = entryKey !== firstKey.current;

  React.useEffect(() => {
    announce(action ? `${message} ${action.label}.` : message);
  }, [message, action, entryKey]);

  React.useEffect(() => {
    if (action || screenReader) return;
    const id = setTimeout(() => {
      onDismiss?.();
      onHide();
    }, durationMs);
    return () => clearTimeout(id);
  }, [action, screenReader, durationMs, onHide, onDismiss, entryKey]);

  const dismiss = React.useCallback(() => {
    onDismiss?.();
    onHide();
  }, [onDismiss, onHide]);

  const pan = Gesture.Pan()
    .activeOffsetY(8)
    .onUpdate((e) => {
      dy.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > 40 || e.velocityY > 600) {
        dy.value = withTiming(120, { duration: tokens.motion.exitMs });
        runOnJS(dismiss)();
      } else {
        const s = tokens.motion.snappy;
        dy.value = withSpring(0, { stiffness: s.stiffness, damping: s.damping, mass: s.mass });
      }
    });
  const drag = useAnimatedStyle(() => ({ transform: [{ translateY: dy.value }] }));

  return (
    <Animated.View
      entering={motion.enter(0)}
      exiting={motion.exit()}
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 12, right: 12, bottom: insets.bottom + 12 + bottomOffset }}>
      <GestureDetector gesture={pan}>
        <Animated.View style={drag}>
          <Animated.View
            key={entryKey}
            entering={swapped ? SWAP_IN : undefined}
            exiting={entryKey !== undefined ? SWAP_OUT : undefined}
            accessibilityLiveRegion="polite"
            className="min-h-14 flex-row items-center gap-2 rounded-lg bg-foreground py-2 pl-5 pr-2"
            style={{ boxShadow: tokens.elevation[2].web }}>
            <Text variant="callout" tone="inverse" className="flex-1 py-1">
              {message}
            </Text>
            {action ? (
              <Button
                size="sm"
                variant="secondary"
                label={action.label}
                testID={action.testID}
                onPress={() => {
                  haptic('tap');
                  action.onPress();
                  onHide();
                }}
              />
            ) : null}
            <IconButton icon={XIcon} label={copy.common.closeButton} size="md" onPress={dismiss} color={c.bg} iconWeight="bold" />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

/** The app's one toast. Every ToastHost reads it and draws the entries shown from below it. */
export const toastStore = createToastStore<ToastOptions>();

type Ctx = { show: (o: ToastOptions) => void; hide: () => void };
const ToastContext = React.createContext<Ctx | null>(null);

/**
 * Hosts the toast for everything below it (UIProvider mounts one; the tabs layout one above the tab bar).
 * A show() from below this host replaces the toast on screen in any host, and is drawn here.
 */
export function ToastHost({ children, bottomOffset = 0 }: { children: React.ReactNode; bottomOffset?: number }) {
  const host = React.useId();
  const entry = React.useSyncExternalStore(toastStore.subscribe, toastStore.get, toastStore.get);
  const value = React.useMemo<Ctx>(
    () => ({
      show: (o) => {
        toastStore.show(host, o);
      },
      hide: () => toastStore.hide(),
    }),
    [host],
  );
  const mine = entry && entry.host === host ? entry : null;
  const key = mine?.key;
  const hide = React.useCallback(() => toastStore.hide(key), [key]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {mine ? <Toast key={mine.session} entryKey={mine.key} {...mine.options} bottomOffset={bottomOffset} onHide={hide} /> : null}
    </ToastContext.Provider>
  );
}

/** show({ message, action }) / hide(). Falls back to a no-op outside a ToastHost. */
export function useToast(): Ctx {
  return React.useContext(ToastContext) ?? { show: () => {}, hide: () => {} };
}
