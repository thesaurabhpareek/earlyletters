// web: apps/web/components/ui/sonner.tsx (shadcn Sonner) | android: same code (not Compose Snackbar)
/**
 * Toast (COMPONENTS 2.14): a quiet confirmation, usually with Undo, instead of a confirm
 * dialog (Airbnb wishlist undo, Apple Mail "Undo Send" bar).
 *
 * - One at a time; a new toast replaces the old one.
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
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tokens } from '@scribe/design-tokens';
import { Button, IconButton } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { announce, useScreenReader, useTheme } from '@/lib/a11y';
import { copy } from '@/lib/copy';
import { haptic } from '@/lib/haptics';
import { useMotion } from '@/lib/motion';

export type ToastOptions = {
  message: string;
  action?: { label: string; onPress: () => void };
  /** Only for toasts without an action. */
  durationMs?: number;
  onDismiss?: () => void;
};

type ToastViewProps = ToastOptions & {
  /** Extra space above the safe area (a tab bar or sticky footer). */
  bottomOffset?: number;
  /** Called when the toast should go away (Close, swipe, timeout, after the action). */
  onHide: () => void;
};

/** Presentational toast. Render it last inside a full-screen container (or use ToastHost). */
export function Toast({ message, action, durationMs = 4000, bottomOffset = 0, onHide, onDismiss }: ToastViewProps) {
  const insets = useSafeAreaInsets();
  const { c } = useTheme();
  const motion = useMotion();
  const screenReader = useScreenReader();
  const dy = useSharedValue(0);

  React.useEffect(() => {
    announce(action ? `${message} ${action.label}.` : message);
  }, [message, action]);

  React.useEffect(() => {
    if (action || screenReader) return;
    const id = setTimeout(() => {
      onDismiss?.();
      onHide();
    }, durationMs);
    return () => clearTimeout(id);
  }, [action, screenReader, durationMs, onHide, onDismiss]);

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
          <View
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
                onPress={() => {
                  haptic('tap');
                  action.onPress();
                  onHide();
                }}
              />
            ) : null}
            <IconButton icon={XIcon} label={copy.common.closeButton} size="md" onPress={dismiss} color={c.bg} iconWeight="bold" />
          </View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

type Ctx = { show: (o: ToastOptions) => void; hide: () => void };
const ToastContext = React.createContext<Ctx | null>(null);

/** Hosts one toast for everything below it. Mounted by UIProvider. */
export function ToastHost({ children, bottomOffset = 0 }: { children: React.ReactNode; bottomOffset?: number }) {
  const [current, setCurrent] = React.useState<{ key: number; options: ToastOptions } | null>(null);
  const counter = React.useRef(0);
  const value = React.useMemo<Ctx>(
    () => ({
      show: (o) => setCurrent({ key: ++counter.current, options: o }),
      hide: () => setCurrent(null),
    }),
    [],
  );
  const hide = React.useCallback(() => setCurrent(null), []);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {current ? <Toast key={current.key} {...current.options} bottomOffset={bottomOffset} onHide={hide} /> : null}
    </ToastContext.Provider>
  );
}

/** show({ message, action }) / hide(). Falls back to a no-op outside a ToastHost. */
export function useToast(): Ctx {
  return React.useContext(ToastContext) ?? { show: () => {}, hide: () => {} };
}
